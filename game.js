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

// ── EnemyBullet (proyectil del OVNI) ──────────────────────────────────────────
class EnemyBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * SAUCER_BULLET_SPEED;
    this.vy = Math.sin(angle) * SAUCER_BULLET_SPEED;
    this.ttl    = SAUCER_BULLET_TTL;
    this.radius = 3;
    this.dead   = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// Power-ups
const SPEED_BOOST_DURATION  = 5;    // segundos de efecto (Velocidad)
const TRIPLE_SHOT_DURATION  = 5;    // segundos de efecto (Disparo triple)
const POWERUP_LIFETIME      = 12;   // segundos que permanece en el campo
const POWERUP_DROP_CHANCE   = 0.18; // probabilidad al destruir un asteroide
const POWERUP_TYPES         = ['speed', 'triple', 'shield'];

// Power-up "Escudo"
const SHIELD_DURATION = 8;         // segundos que absorbe impactos
const SHIELD_RADIUS   = 22;        // radio del aro alrededor de la nave
const SHIELD_COLOR    = '#7dff9b'; // verde, para no confundir con el cian

// Enemigo (OVNI)
const SAUCER_POINTS        = 150;  // puntos por destruirlo
const SAUCER_DROP_CHANCE   = 0.35; // probabilidad de soltar un power-up
const SAUCER_DELAY_MIN     = 12;   // segundos entre apariciones
const SAUCER_DELAY_MAX     = 20;
const SAUCER_BULLET_SPEED  = 230;  // px/s del proyectil enemigo
const SAUCER_BULLET_TTL    = 4;    // segundos de vida del proyectil

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

// ── Power-up ──────────────────────────────────────────────────────────────────
const POWERUP_COLORS = {
  speed:  '#50f0ff',   // cian
  triple: '#ffb03a',   // ámbar
  shield: SHIELD_COLOR, // verde
};

class PowerUp {
  // Sin `type` (o con uno desconocido) se elige al azar entre los tipos
  constructor(x, y, type = null) {
    this.x = x;
    this.y = y;
    this.type  = POWERUP_TYPES.includes(type) ? type
               : POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
    this.color = POWERUP_COLORS[this.type];
    this.radius = 11;
    this.ttl    = POWERUP_LIFETIME;
    this.phase  = rand(0, Math.PI * 2);
    this.dead   = false;
  }

  update(dt) {
    this.ttl -= dt;
    this.phase += dt * 4;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadea cuando está a punto de desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const color = this.color;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.phase) * 0.35);

    // Halo
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (this.type === 'triple') {
      // Tres líneas paralelas: el disparo triple
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-7, i * 5);
        ctx.lineTo( 4, i * 5);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(7, i * 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (this.type === 'shield') {
      // Aro del escudo
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Rayo de velocidad
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo( 2, -8);
    ctx.lineTo(-5,  1);
    ctx.lineTo(-1,  1);
    ctx.lineTo(-2,  8);
    ctx.lineTo( 5, -1);
    ctx.lineTo( 1, -1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// ── Saucer (OVNI enemigo) ─────────────────────────────────────────────────────
class Saucer {
  constructor() {
    const fromLeft = Math.random() < 0.5;
    this.x = fromLeft ? -30 : W + 30;
    this.baseY = rand(90, H - 90);
    this.y     = this.baseY;
    this.vx    = (fromLeft ? 1 : -1) * rand(60, 85);
    this.radius = 16;
    this.phase      = rand(0, Math.PI * 2);
    this.wobble     = rand(25, 45);   // amplitud vertical del zigzag
    this.shootTimer = rand(0.8, 1.6); // primer disparo
    this.dead = false;
  }

  // Devuelve los proyectiles disparados en este frame (patrón de Ship.tryShoot)
  update(dt, target) {
    this.x     += this.vx * dt;
    this.phase += dt * 2.2;
    this.y      = this.baseY + Math.sin(this.phase) * this.wobble;

    // Cruzó toda la pantalla: se retira
    if (this.x < -60 || this.x > W + 60) {
      this.dead = true;
      return [];
    }

    if (!target || target.dead || target.invincible > 0) return [];
    if (this.x < 10 || this.x > W - 10) return []; // fuera de vista

    this.shootTimer -= dt;
    if (this.shootTimer > 0) return [];

    const angle = Math.atan2(target.y - this.y, target.x - this.x) + rand(-0.1, 0.1);
    const ox = this.x + Math.cos(angle) * (this.radius + 3);
    const oy = this.y + Math.sin(angle) * (this.radius + 3);
    this.shootTimer = rand(1.2, 2.2);
    return [new EnemyBullet(ox, oy, angle)];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#ff6b6b';
    ctx.fillStyle   = '#ff6b6b';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Cuerpo en forma de lente
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cúpula
    ctx.beginPath();
    ctx.arc(0, -4, 7, Math.PI, 0);
    ctx.stroke();

    // Tres luces
    for (const lx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.arc(lx, 0, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
// Cada skin dibuja la silueta centrada en (0,0) mirando hacia +x.
// `nose` es la distancia a la punta, para que las balas salgan del morro.
const SKINS = [
  {
    name: 'CLÁSICA',
    nose: 21,
    draw(ctx, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo( 20,  0);   // nariz
      ctx.lineTo(-12, -9);   // ala izquierda
      ctx.lineTo( -7,  0);   // muesca trasera
      ctx.lineTo(-12,  9);   // ala derecha
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    name: 'RELLENA',
    nose: 21,
    draw(ctx, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo( 20,  0);
      ctx.lineTo(-12, -9);
      ctx.lineTo( -7,  0);
      ctx.lineTo(-12,  9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  },
  {
    name: 'NEÓN',
    nose: 22,
    draw(ctx, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur  = 10;
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo( 21,  0);
      ctx.lineTo(-13, -10);
      ctx.lineTo( -8,  0);
      ctx.lineTo(-13, 10);
      ctx.closePath();
      ctx.stroke();
      ctx.stroke();   // doble trazo = más brillo
      ctx.restore();
    },
  },
  {
    name: 'INTERCEPTOR',
    nose: 24,
    draw(ctx, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo( 23,  0);   // morro largo
      ctx.lineTo( -4, -3);
      ctx.lineTo(-16, -11);  // ala trasera izquierda
      ctx.lineTo(-11, -4);
      ctx.lineTo(-10,  0);   // muesca trasera
      ctx.lineTo(-11,  4);
      ctx.lineTo(-16, 11);   // ala trasera derecha
      ctx.lineTo( -4,  3);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },
  },
];

const SKIN_KEY = 'asteroids.skin';
let skinIndex  = 0;
let skinToast  = 0;   // segundos restantes del aviso en pantalla

function loadSkinIndex() {
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(i) && i >= 0 && i < SKINS.length) return i;
  } catch (e) { /* file:// o modo privado sin localStorage */ }
  return 0;
}
skinIndex = loadSkinIndex();

const currentSkin = () => SKINS[skinIndex];

function cycleSkin() {
  skinIndex = (skinIndex + 1) % SKINS.length;
  skinToast = 1.5;
  try { localStorage.setItem(SKIN_KEY, String(skinIndex)); } catch (e) {}
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleShot    = 0;   // segundos restantes de disparo triple
    this.shield        = 0;   // segundos restantes de escudo
    this.shieldFlash   = 0;   // destello al absorber un impacto
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;
    if (this.shield        > 0) this.shield        -= dt;
    if (this.shieldFlash   > 0) this.shieldFlash   -= dt;

    const ROT   = 3.5;   // rad/s
    const BOOST = this.speedBoost > 0 ? 2 : 1;
    const THRUST = 260 * BOOST;  // px/s²
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
    const NOSE = currentSkin().nose;
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    const ox = this.x + dx * NOSE;
    const oy = this.y + dy * NOSE;
    if (this.tripleShot <= 0) return [new Bullet(ox, oy, this.angle)];

    // Disparo triple: tres balas paralelas saliendo del morro
    const px = -dy;              // vector perpendicular
    const py =  dx;
    const SPREAD = 9;            // separación entre balas
    return [-SPREAD, 0, SPREAD].map(off =>
      new Bullet(ox + px * off, oy + py * off, this.angle));
  }

  // 'none'   → invencibilidad de reaparición: lo atraviesa
  // 'shield' → el escudo absorbe el impacto y sigue activo
  // 'dead'   → pierde una vida
  takeHit() {
    if (this.invincible > 0) return 'none';
    if (this.shield     > 0) return 'shield';
    return 'dead';
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Skin activa; color según el efecto dominante (triple > velocidad)
    const color = this.tripleShot > 0 ? POWERUP_COLORS.triple
                : this.speedBoost > 0 ? POWERUP_COLORS.speed : '#fff';
    currentSkin().draw(ctx, color);

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    // Aro del escudo
    if (this.shield > 0) {
      // Parpadea al acercarse al final
      const fading = this.shield < 2 && Math.floor(this.shield * 8) % 2 === 0;
      if (!fading) {
        const flashing = this.shieldFlash > 0;
        ctx.globalAlpha = flashing ? 1 : 0.6 + Math.sin(this.shield * 8) * 0.2;
        ctx.strokeStyle  = SHIELD_COLOR;
        ctx.lineWidth    = flashing ? 3 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, SHIELD_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '#fff') {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.color = color;
    this.dead  = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let enemies, enemyBullets, saucerTimer;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

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
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  enemies      = [];
  enemyBullets = [];
  saucerTimer  = rand(10, 16); // primer OVNI
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  enemies      = [];
  enemyBullets = [];
  saucerTimer  = rand(SAUCER_DELAY_MIN, SAUCER_DELAY_MAX);
  ship.reset();
  spawnAsteroids(3 + level);
}

function spawnSaucer() {
  enemies.push(new Saucer());
  saucerTimer = rand(SAUCER_DELAY_MIN, SAUCER_DELAY_MAX);
}

function explode(x, y, count = 8, color = '#fff') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
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

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambiar skin en cualquier momento (incluso en game over)
  if (pressed('KeyS')) cycleSkin();
  if (skinToast > 0) skinToast -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    enemies.forEach(e => e.update(dt, null)); // el OVNI no dispara
    enemyBullets.forEach(b => b.update(dt));
    enemies      = enemies.filter(e => !e.dead);
    enemyBullets = enemyBullets.filter(b => !b.dead);
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
  powerups.forEach(p => p.update(dt));

  // OVNI: entra, zigzaguea y dispara a la nave
  saucerTimer -= dt;
  if (saucerTimer <= 0) {
    if (enemies.length === 0) spawnSaucer();
    else saucerTimer = 1; // reintenta en cuanto el actual se retire
  }
  for (const e of enemies) enemyBullets.push(...e.update(dt, ship));
  enemyBullets.forEach(b => b.update(dt));

  bullets = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);
  enemies      = enemies.filter(e => !e.dead);
  enemyBullets = enemyBullets.filter(b => !b.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        if (Math.random() < POWERUP_DROP_CHANCE)
          powerups.push(new PowerUp(a.x, a.y)); // tipo al azar
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala del jugador vs OVNI
  for (const b of bullets) {
    for (const e of enemies) {
      if (!e.dead && !b.dead && dist(b, e) < e.radius + 3) {
        b.dead = true;
        e.dead = true;
        score += SAUCER_POINTS;
        explode(e.x, e.y, 12, '#ff6b6b');
        if (Math.random() < SAUCER_DROP_CHANCE)
          powerups.push(new PowerUp(e.x, e.y)); // tipo al azar
      }
    }
  }

  bullets   = bullets.filter(b => !b.dead);

  // Proyectil enemigo vs nave
  for (const b of enemyBullets) {
    if (ship.dead || dist(ship, b) >= ship.radius + b.radius) continue;
    const hit = ship.takeHit();
    if (hit === 'none') continue;   // invencibilidad: lo atraviesa
    b.dead = true;
    if (hit === 'dead') { killShip(); break; }
    ship.shieldFlash = 0.25;        // 'shield': destello del aro
    explode(b.x, b.y, 6, SHIELD_COLOR);
  }
  enemyBullets = enemyBullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (!ship.dead) for (const a of asteroids) {
    if (a.dead || dist(ship, a) >= ship.radius + a.radius * 0.82) continue;
    const hit = ship.takeHit();
    if (hit === 'none') break;
    if (hit === 'dead') { killShip(); break; }
    // El escudo absorbe: el asteroide se desintegra sin dar puntos
    a.dead = true;
    ship.shieldFlash = 0.25;
    explode(a.x, a.y, a.size * 4, SHIELD_COLOR);
  }
  asteroids = asteroids.filter(a => !a.dead);

  // Nave vs cuerpo del OVNI
  if (!ship.dead) for (const e of enemies) {
    if (e.dead || dist(ship, e) >= ship.radius + e.radius) continue;
    const hit = ship.takeHit();
    if (hit === 'none') continue;
    if (hit === 'dead') { killShip(); break; }
    e.dead = true;
    ship.shieldFlash = 0.25;
    explode(e.x, e.y, 12, SHIELD_COLOR);
  }
  enemies = enemies.filter(e => !e.dead);

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerups) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if (p.type === 'shield')      ship.shield     = SHIELD_DURATION;
        else if (p.type === 'triple') ship.tripleShot = TRIPLE_SHOT_DURATION;
        else                          ship.speedBoost = SPEED_BOOST_DURATION;
        explode(p.x, p.y, 6, p.color);
      }
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nivel completado (solo si la nave sigue en pie)
  if (state === 'playing' && asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(0.6, 0.6);
  currentSkin().draw(ctx, '#fff');
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  // Efectos activos, apilados debajo del marcador
  if (state === 'playing') {
    let fx = 48;
    const effects = [
      ['speed',  ship.speedBoost],
      ['triple', ship.tripleShot],
      ['shield', ship.shield],
    ];
    const labels = { speed: 'VELOCIDAD', triple: 'DISPARO TRIPLE', shield: 'ESCUDO' };
    for (const [type, time] of effects) {
      if (time <= 0) continue;
      ctx.fillStyle = POWERUP_COLORS[type];
      ctx.fillText(`${labels[type]}  ${time.toFixed(1)}s`, 14, fx);
      fx += 22;
    }
    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Skin activa (se ilumina brevemente al cambiarla)
  ctx.textAlign = 'left';
  ctx.font      = '13px monospace';
  ctx.fillStyle = skinToast > 0 ? '#fff' : 'rgba(255,255,255,0.45)';
  ctx.fillText(`SKIN [S]  ${currentSkin().name}`, 14, H - 14);
  ctx.fillStyle = '#fff';
}

function drawOverlay(title, sub, hint) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
  if (hint) {
    ctx.font      = '15px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(hint, W / 2, H / 2 + 50);
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  enemies.forEach(e => e.draw());
  enemyBullets.forEach(b => b.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  // Aviso al cambiar de skin
  if (skinToast > 0) {
    const a = Math.min(1, skinToast / 0.4).toFixed(2);
    ctx.textAlign = 'center';
    ctx.font      = 'bold 20px monospace';
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillText(`SKIN: ${currentSkin().name}`, W / 2, H - 40);
  }

  if (state === 'gameover')
    drawOverlay('GAME OVER',
      `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`,
      `S: CAMBIAR SKIN  (${currentSkin().name})`);
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

initGame();
requestAnimationFrame(loop);
