#!/usr/bin/env node
'use strict';

/**
 * apply-triage.mjs
 *
 * Aplica el triage automático a un issue de GitHub:
 *   1. Lee la propuesta del modelo (JSON) y, si falta o es inválida, cae a
 *      heurísticas por palabras clave.
 *   2. Aplica la etiqueta de tipo (creando la etiqueta si el repo no la tiene).
 *   3. Añade un bloque de metadatos al FINAL del cuerpo del issue, sin tocar
 *      el texto original: el cuerpo se conserva byte a byte arriba del bloque.
 *
 * Uso:
 *   node .github/scripts/apply-triage.mjs \
 *     --body-file <cuerpo.md> \
 *     --meta-file <meta.json> \
 *     [--json <triage.json>] \
 *     [--dry-run]
 *
 * Sin dependencias: corre con el Node que ya viene en el runner.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ── Constantes ────────────────────────────────────────────────────────────────

const START_MARKER = '<!-- opencode-triage:start -->';
const END_MARKER = '<!-- opencode-triage:end -->';

// Etiquetas de tipo que el triage puede aplicar. Para sumar más tipos,
// agregalos acá con su color y descripción: el flujo los crea solo.
const TYPE_LABELS = {
  bug:           { color: 'd73a4a', description: 'Algo no funciona' },
  enhancement:   { color: 'a2eeef', description: 'Nueva función o mejora' },
  documentation: { color: '0075ca', description: 'Mejoras en la documentación' },
  question:      { color: 'd876e3', description: 'Se necesita más información' },
};

// Archivos del repo que el triage puede sugerir (filtra alucinaciones).
const KNOWN_FILES = ['game.js', 'index.html', 'README.md', 'favicon.svg', 'AGENTS.md'];

// Modos de juego reconocidos.
const MODES = {
  'menu': 'Menú', 'menú': 'Menú', 'inicio': 'Menú',
  'partida': 'Partida', 'juego': 'Partida', 'jugando': 'Partida', 'gameplay': 'Partida',
  'game over': 'Game over', 'gameover': 'Game over', 'fin': 'Game over',
  'general': 'General', 'todo': 'General', 'ninguno': 'General',
};

const REVIEW_CHECKLIST = [
  'Reproducido localmente',
  'Pasos de reproducción confirmados',
  'Causa raíz identificada',
  'Corregido y probado',
  'README actualizado (si aplica)',
];

// ── Utilidades ────────────────────────────────────────────────────────────────

function log(...args) {
  console.log('[triage]', ...args);
}

function parseArgs(argv) {
  const out = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      out.dryRun = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      out[key] = argv[i + 1];
      i++;
    }
  }
  return out;
}

function gh(args) {
  const res = spawnSync('gh', args, { encoding: 'utf8', shell: false });
  if (res.error) throw new Error(`no se pudo ejecutar gh: ${res.error.message}`);
  return res;
}

function oneLine(value, max = 300) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function paragraphs(value, max = 1200) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

// ── Clasificación ─────────────────────────────────────────────────────────────

const KEYWORDS = [
  { type: 'bug',           re: /\b(no funciona|no andaba|falla|fallo|error|bug|rompe|se rompe|crashea|crashea|exception|undefined|null|no dispara|no aparece|no se ve|se traba|problema)\b/i },
  { type: 'documentation', re: /\b(readme|documentaci[oó]n|docs?|tutorial|gu[ií]a)\b/i },
  { type: 'enhancement',   re: /\b(quiero|necesito|necesitamos|ser[ií]a|agregar|a[ñn]adir|mejora|mejoras|nueva|nuevo|feature|propuesta|idea)\b/i },
  { type: 'question',      re: /(\?\s*$)|(\b(c[oó]mo|d[oó]nde|cu[aá]ndo|cu[aá]l|por qu[eé]|ayuda)\b)/i },
];

function classifyByKeywords(text) {
  for (const rule of KEYWORDS) {
    if (rule.re.test(text)) return rule.type;
  }
  return 'question';
}

function normalizeProposal(raw) {
  const out = {
    type: null,
    summary: '',
    expected: '',
    actual: '',
    steps: [],
    affectedFiles: [],
    mode: '',
  };
  if (!raw || typeof raw !== 'object') return out;

  const type = oneLine(raw.type, 40).toLowerCase();
  if (type && Object.hasOwn(TYPE_LABELS, type)) out.type = type;

  out.summary = oneLine(raw.summary);
  out.expected = paragraphs(raw.expected);
  out.actual = paragraphs(raw.actual);

  if (Array.isArray(raw.steps)) {
    out.steps = raw.steps
      .map((s) => oneLine(s, 240))
      .filter(Boolean)
      .slice(0, 8);
  }

  if (Array.isArray(raw.affectedFiles)) {
    out.affectedFiles = raw.affectedFiles
      .map((f) => oneLine(f, 60))
      .filter((f) => KNOWN_FILES.includes(f));
  }

  const mode = oneLine(raw.mode, 30).toLowerCase();
  if (Object.hasOwn(MODES, mode)) out.mode = MODES[mode];

  return out;
}

// ── Cuerpo del issue ──────────────────────────────────────────────────────────

// Detecta si el texto original ya trae la sección, para no duplicarla.
function originalCovers(original, what) {
  const text = original.toLowerCase();
  if (what === 'expected') return /\b(esperado|esperaba|se esperaba|deber[ií]a|should)\b/.test(text);
  if (what === 'actual')   return /\b(real|realmente|actual|en vez de|pero no)\b/.test(text);
  if (what === 'steps')    return /\b(pasos|reproduc|steps?)\b/.test(text);
  return false;
}

function buildBlock(data, ctx, original) {
  const lines = [];
  lines.push(START_MARKER);
  lines.push('## Triage automático');
  lines.push('');
  lines.push('_Generado automáticamente por la GitHub Action de triage. El texto original del issue quedó intacto arriba._');
  lines.push('');

  if (data.summary) {
    lines.push(`**Resumen:** ${data.summary}`);
    lines.push('');
  }

  lines.push('| Campo | Valor |');
  lines.push('| --- | --- |');
  lines.push(`| Tipo | \`${data.type}\` |`);
  if (data.mode) lines.push(`| Modo de juego | ${data.mode} |`);
  if (data.affectedFiles.length) {
    lines.push(`| Archivos probablemente afectados | ${data.affectedFiles.map((f) => `\`${f}\``).join(', ')} |`);
  }
  if (ctx.sha) lines.push(`| Commit base | [\`${ctx.sha}\`](${ctx.commitUrl}) |`);
  if (ctx.author) lines.push(`| Reportado por | @${ctx.author} |`);
  if (ctx.createdAt) lines.push(`| Creado | ${ctx.createdAt} |`);
  lines.push('');

  // Solo se agrega la sección si el texto original no la traía ya.
  if (data.expected && !originalCovers(original, 'expected')) {
    lines.push('### Comportamiento esperado');
    lines.push('');
    lines.push(data.expected);
    lines.push('');
  }

  if (data.actual && !originalCovers(original, 'actual')) {
    lines.push('### Comportamiento real');
    lines.push('');
    lines.push(data.actual);
    lines.push('');
  }

  if (data.steps.length && !originalCovers(original, 'steps')) {
    lines.push('### Pasos para reproducir');
    lines.push('');
    data.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    lines.push('');
  }

  lines.push('### Checklist de revisión');
  lines.push('');
  REVIEW_CHECKLIST.forEach((item) => lines.push(`- [ ] ${item}`));
  lines.push('');
  lines.push(END_MARKER);

  return lines.join('\n');
}

// Une el cuerpo original con el bloque. Si el cuerpo ya tenía un bloque
// (re-triaje), se reemplaza solo esa parte: el resto queda intacto.
function composeBody(original, block) {
  const startIdx = original.indexOf(START_MARKER);
  const endIdx = original.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const prefix = original.slice(0, startIdx);
    return prefix + block;
  }

  if (!original.trim()) return block;
  return `${original.replace(/\s+$/, '')}\n\n---\n\n${block}`;
}

// ── GitHub ────────────────────────────────────────────────────────────────────

function resolveRepo() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const res = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
  if (res.status !== 0) throw new Error(`no se pudo resolver el repo: ${res.stderr}`);
  return res.stdout.trim();
}

function ensureLabel(repo, name, dryRun) {
  const meta = TYPE_LABELS[name];
  const check = gh(['api', `repos/${repo}/labels/${encodeURIComponent(name)}`, '--silent']);
  if (check.status === 0) return 'existe';
  if (dryRun) return 'no existe (se crearía)';

  const create = gh([
    'api', `repos/${repo}/labels`,
    '-f', `name=${name}`,
    '-f', `color=${meta.color}`,
    '-f', `description=${meta.description}`,
  ]);
  if (create.status !== 0) {
    log(`⚠ no se pudo crear la etiqueta "${name}": ${(create.stderr || '').trim()}`);
    return 'fallo';
  }
  return 'creada';
}

function applyIssue(repo, number, body, labels, dryRun) {
  const bodyFile = path.join(os.tmpdir(), `issue-triage-body-${number}.md`);
  fs.writeFileSync(bodyFile, body, 'utf8');

  const args = ['issue', 'edit', String(number), '--repo', repo, '--body-file', bodyFile];
  for (const label of labels) args.push('--add-label', label);

  if (dryRun) {
    log(`(dry-run) gh ${args.join(' ')}`);
    return;
  }

  const res = gh(args);
  if (res.status !== 0) {
    throw new Error(`gh issue edit falló: ${(res.stderr || res.stdout || '').trim()}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function readJson(file) {
  try {
    if (!file || !fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch (err) {
    log(`no se pudo leer ${file}: ${err.message}`);
    return null;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const bodyFile = args.bodyFile || process.env.ISSUE_BODY_FILE;
  const metaFile = args.metaFile || process.env.ISSUE_META_FILE;
  const jsonFile = args.json || process.env.TRIAGE_JSON || '.github/triage/triage.json';

  if (!bodyFile || !fs.existsSync(bodyFile)) {
    throw new Error('falta --body-file (o ISSUE_BODY_FILE) con el cuerpo del issue');
  }

  const meta = readJson(metaFile) || {};
  const number = meta.number ?? process.env.ISSUE_NUMBER;
  if (!number) throw new Error('falta el número de issue (meta.number o ISSUE_NUMBER)');

  const original = fs.readFileSync(bodyFile, 'utf8');
  const title = oneLine(meta.title ?? process.env.ISSUE_TITLE ?? '', 200);
  const author = oneLine(meta.author ?? process.env.ISSUE_AUTHOR ?? '', 60);
  const createdAt = oneLine(meta.createdAt ?? process.env.ISSUE_CREATED_AT ?? '', 40);
  const sha = oneLine(meta.sha ?? process.env.BASE_SHA ?? '', 40);

  const proposal = normalizeProposal(readJson(jsonFile));
  const source = proposal.type ? 'modelo' : 'heurísticas';
  const type = proposal.type ?? classifyByKeywords(`${title}\n${original}`);
  const data = { ...proposal, type };

  log(`issue #${number} · tipo "${type}" (origen: ${source})`);

  const repo = args.repo || resolveRepo();
  const ctx = {
    author,
    createdAt,
    sha,
    commitUrl: sha ? `https://github.com/${repo}/commit/${sha}` : '',
  };

  const block = buildBlock(data, ctx, original);
  const newBody = composeBody(original, block);

  const labelState = ensureLabel(repo, type, args.dryRun);
  log(`etiqueta "${type}": ${labelState}`);

  applyIssue(repo, number, newBody, [type], args.dryRun);

  if (args.dryRun) {
    log('--- cuerpo resultante ---');
    console.log(newBody);
    log('--- fin ---');
  } else {
    log(`issue #${number} actualizado`);
  }
}

try {
  main();
} catch (err) {
  console.error('[triage] error:', err.message);
  process.exitCode = 1;
}
