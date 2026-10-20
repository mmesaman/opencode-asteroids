# AGENTS.md

## What this is

Static vanilla-JS game: `index.html`, `game.js` (all game logic, ~900 lines), `favicon.svg`, `README.md`. No `package.json`, no build, no dependencies, no tests, no lint, no CI, no workspace config.

## Run / verify

- Open `index.html` directly (double-click works over `file://`), or `npx serve .` → http://localhost:3000.
- No automated checks exist — verify changes by playing in the browser.
- Keep it working over `file://`: adding `import`/`fetch` breaks the double-click launch.

## Codebase facts

- `game.js` is a classic (non-module) script: every top-level `const`/function/class shares one scope; there are no imports/exports. Don't introduce ES modules without also adding `type="module"` to the `<script>` in `index.html` (and losing `file://` support).
- Execution flow: input handlers → entity classes (`Bullet`, `EnemyBullet`, `Asteroid`, `PowerUp`, `Saucer`, `Ship`, `Particle`) → game state (`state` is `'playing' | 'dead' | 'gameover'`) → `update(dt)` / `draw()` → `loop()` via `requestAnimationFrame`. Entry point is the last two lines: `initGame(); requestAnimationFrame(loop);`.
- Balance lives in three parallel arrays near the top: `RADII` / `SPEEDS` / `POINTS`, indexed by asteroid size 1–3 (index 0 is a placeholder). Scoring in README: 20 / 50 / 100 (+150 per OVNI, `SAUCER_POINTS`).
- Power-ups: types in `POWERUP_TYPES` (`speed` / `triple` / `shield`) with one duration constant each; the ship mirrors them as timers (`speedBoost`, `tripleShot`, `shield`) and `Ship.takeHit()` returns `'none' | 'shield' | 'dead'` so callers never branch on raw timers.
- OVNI: `Saucer` crosses the screen on a `saucerTimer`, aims with `Saucer.update(dt, target)` which *returns* the `EnemyBullet`s it fired (same pattern as `Ship.tryShoot`); the ship never holds a bullets array for enemies.
- Input: `keys[code]` is held state; `pressed(code)` is one-shot and clears the flag on read, so at most one caller can consume a keypress per frame (`Space` restart and `Space` fire both use it).
- `dt` is in seconds and clamped to 0.05 max; game speed is dt-based, so don't use per-frame constants for motion.
- Restart is `pressed('Space') → initGame()` while `'gameover'`.

## Language

Comments, HUD/overlay strings, and README are in Spanish — write new ones in Spanish to match.

## README caveat

README is kept in sync with `game.js` (power-ups, OVNI, skins are all implemented). If docs and code ever disagree again, trust the code.
