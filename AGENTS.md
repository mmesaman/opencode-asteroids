# AGENTS.md

## What this is

Static vanilla-JS game: `index.html`, `game.js` (all game logic, ~360 lines), `favicon.svg`, `README.md`. No `package.json`, no build, no dependencies, no tests, no lint, no workspace config. CI lives in `.github/workflows/` (nothing that runs on the game code itself).

## Run / verify

- Open `index.html` directly (double-click works over `file://`), or `npx serve .` → http://localhost:3000.
- No automated checks exist — verify changes by playing in the browser.
- Keep it working over `file://`: adding `import`/`fetch` breaks the double-click launch.

## Codebase facts

- `game.js` is a classic (non-module) script: every top-level `const`/function/class shares one scope; there are no imports/exports. Don't introduce ES modules without also adding `type="module"` to the `<script>` in `index.html` (and losing `file://` support).
- Execution flow: input handlers → entity classes (`Bullet`, `Asteroid`, `Ship`, `Particle`) → game state (`state` is `'playing' | 'dead' | 'gameover'`) → `update(dt)` / `draw()` → `loop()` via `requestAnimationFrame`. Entry point is the last two lines: `initGame(); requestAnimationFrame(loop);`.
- Balance lives in three parallel arrays near the top: `RADII` / `SPEEDS` / `POINTS`, indexed by asteroid size 1–3 (index 0 is a placeholder). Scoring in README: 20 / 50 / 100.
- Input: `keys[code]` is held state; `pressed(code)` is one-shot and clears the flag on read, so at most one caller can consume a keypress per frame (`Space` restart and `Space` fire both use it).
- `dt` is in seconds and clamped to 0.05 max; game speed is dt-based, so don't use per-frame constants for motion.
- Restart is `pressed('Space') → initGame()` while `'gameover'`.

## GitHub Actions

- `.github/workflows/opencode.yml` — responde a `/oc` o `/opencode` en comentarios de issues/PRs.
- `.github/workflows/issue-triage.yml` — al abrir un issue: lo clasifica con OpenCode, le pone la etiqueta de tipo (`bug` / `enhancement` / `documentation` / `question`) y **agrega un bloque de metadatos al final del cuerpo** (`<!-- opencode-triage:start -->` … `<!-- opencode-triage:end -->`). El texto que escribió la persona queda byte a byte intacto arriba del bloque; si el bloque ya existe, se reemplaza en vez de duplicarse.
- `.github/scripts/apply-triage.mjs` — script Node sin dependencias que aplica las etiquetas y arma el bloque. Si el modelo falla, cae a heurísticas por palabras clave. Probálo local sin tocar GitHub con `--dry-run`.

## Language

Comments, HUD/overlay strings, and README are in Spanish — write new ones in Spanish to match.

## README caveat

README advertises power-ups and a "estrella fugaz" asteroid type; neither exists in `game.js`. Trust the code, not that README section.
