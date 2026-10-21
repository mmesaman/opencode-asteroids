'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Naves ─────────────────────────────────────────────────────────────────────
// Cada nave define su color, su escala (tamaño) y su multiplicador de puntos.
const SHIPS = [
  { name: 'ESTÁNDAR', colorName: 'BLANCA', color: '#ffffff', scale: 1, pointsMult: 1 },
  { name: 'TITÁN',    colorName: 'MORADA', color: '#b16cff', scale: 2, pointsMult: 2 },
];

// Dibuja la silueta de la nave en coordenadas locales (origen en el centro).
// Se reutiliza para las vistas previas del menú de selección.
function drawShipBody(scale, color, thrusting) {
  ctx.lineJoin    = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5 / scale;

  // Silueta clásica: triángulo con muesca trasera
  ctx.beginPath();
  ctx.moveTo( 20,  0);   // nariz
  ctx.lineTo(-12, -9);   // ala izquierda
  ctx.lineTo( -7,  0);   // muesca trasera
  ctx.lineTo(-12,  9);   // ala derecha
  ctx.closePath();
  ctx.stroke();

  // Llama del propulsor
  if (thrusting && Math.random() > 0.35) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8 - rand(6, 14), 0);
    ctx.lineTo(-8,  4);
    ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
    ctx.stroke();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor(type = SHIPS[0]) {
    this.type = type;
    this.reset();
  }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.scale  = this.type.scale;
    this.color  = this.type.color;
    this.radius = 12 * this.scale;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  get pointsMult() { return this.type.pointsMult; }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21 * this.scale;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    drawShipBody(this.scale, this.color, this.thrusting);
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles;
let score, lives, level;
let state;      // 'menu' | 'playing' | 'dead' | 'gameover'
let deadTimer;
let shipIndex;  // nave elegida en el menú

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship(SHIPS[shipIndex]);
  bullets   = [];
  asteroids = [];
  particles = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function openMenu() {
  ship          = new Ship(SHIPS[shipIndex]);
  bullets   = [];
  asteroids = [];
  particles = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'menu';
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Menú de selección de nave ────────────────────────────────────────────────
function handleMenuInput() {
  const left  = pressed('ArrowLeft')  || pressed('KeyA');
  const right = pressed('ArrowRight') || pressed('KeyD');
  if (left)  shipIndex = wrap(shipIndex - 1, SHIPS.length);
  if (right) shipIndex = wrap(shipIndex + 1, SHIPS.length);
  if (pressed('Digit1')) shipIndex = 0;
  if (pressed('Digit2')) shipIndex = 1;
  const start = pressed('Space') || pressed('Enter');
  if (start) initGame();
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'menu') {
    handleMenuInput();
    return;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    if (pressed('KeyM')) openMenu();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size] * ship.pointsMult;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.2 / scale;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.font = '13px monospace';
  ctx.fillStyle = ship.color;
  ctx.fillText(`NAVE  ${ship.type.name}`, 14, 47);
  if (ship.pointsMult > 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(`PUNTOS x${ship.pointsMult}`, 14, 65);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18, 0.45 * ship.scale, ship.color);

}

function drawShipPreview(type, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(type.scale, type.scale);
  drawShipBody(type.scale, type.color, false);
  ctx.restore();
}

function drawMenu() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font      = 'bold 40px monospace';
  ctx.fillText('ASTEROIDS', W / 2, 88);

  ctx.font      = '16px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('ELIGE TU NAVE', W / 2, 126);

  const CARD_W = 250, CARD_H = 230, GAP = 40, TOP = 170;
  const totalW = SHIPS.length * CARD_W + (SHIPS.length - 1) * GAP;
  const startX = (W - totalW) / 2;

  SHIPS.forEach((type, i) => {
    const x   = startX + i * (CARD_W + GAP);
    const cx  = x + CARD_W / 2;
    const sel = i === shipIndex;

    ctx.fillStyle = sel ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)';
    ctx.fillRect(x, TOP, CARD_W, CARD_H);

    ctx.strokeStyle = sel ? type.color : 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = sel ? 2 : 1;
    ctx.strokeRect(x + 0.5, TOP + 0.5, CARD_W - 1, CARD_H - 1);

    if (sel) {
      ctx.fillStyle = type.color;
      ctx.font      = '16px monospace';
      ctx.fillText('▼', cx, TOP - 10);
    }

    drawShipPreview(type, cx, TOP + 85);

    ctx.font      = 'bold 20px monospace';
    ctx.fillStyle = type.color;
    ctx.fillText(type.name, cx, TOP + 145);

    ctx.font      = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`NAVE ${type.colorName}`, cx, TOP + 167);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(`TAMAÑO x${type.scale}   PUNTOS x${type.pointsMult}`, cx, TOP + 195);
  });

  ctx.font      = '15px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('← →  ELEGIR NAVE        ESPACIO  EMPEZAR', W / 2, TOP + CARD_H + 44);
  ctx.font      = '13px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('1 / 2  SELECCIÓN RÁPIDA', W / 2, TOP + CARD_H + 68);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state === 'menu') {
    drawMenu();
    return;
  }

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}  —  ESPACIO: REINICIAR  —  M: CAMBIAR NAVE`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

shipIndex = 0;
openMenu();
requestAnimationFrame(loop);
