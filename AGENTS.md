# AGENTS.md

## What this is

Static vanilla-JS game: `index.html`, `game.js` (all game logic, ~520 lines), `favicon.svg`, `README.md`. No `package.json`, no build, no dependencies, no tests, no lint, no CI, no workspace config.

## Run / verify

- Open `index.html` directly (double-click works over `file://`), or `npx serve .` → http://localhost:3000.
- No automated checks exist — verify changes by playing in the browser.
- Keep it working over `file://`: adding `import`/`fetch` breaks the double-click launch.

## Codebase facts

- `game.js` is a classic (non-module) script: every top-level `const`/function/class shares one scope; there are no imports/exports. Don't introduce ES modules without also adding `type="module"` to the `<script>` in `index.html` (and losing `file://` support).
- Execution flow: input handlers → entity classes (`Bullet`, `Asteroid`, `Ship`, `Particle`) → game state (`state` is `'menu' | 'playing' | 'dead' | 'gameover'`) → `update(dt)` / `draw()` → `loop()` via `requestAnimationFrame`. Entry point is the last two lines: `showMenu(); requestAnimationFrame(loop);`.
- Balance lives in three parallel arrays near the top: `RADII` / `SPEEDS` / `POINTS`, indexed by asteroid size 1–3 (index 0 is a placeholder). Scoring in README: 20 / 50 / 100.
- Ships are described by `SHIP_TYPES` (`{ name, color, scale, mult }`): classic (white, scale 1, x1) and purple (`#b46cff`, scale 2, x2). `scale` multiplies the hull, the collision radius (`SHIP_RADIUS`) and the bullet spawn offset; `mult` multiplies the points of each asteroid. `selectedShip` holds the index chosen in the `'menu'` state.
- Input: `keys[code]` is held state; `pressed(code)` is one-shot and clears the flag on read, so at most one caller can consume a keypress per frame (`Space` restart and `Space` fire both use it). Read every flag you care about in one frame — `a || b` short-circuits and leaves the second flag set.
- `dt` is in seconds and clamped to 0.05 max; game speed is dt-based, so don't use per-frame constants for motion.
- Restart is `pressed('Space') → showMenu()` while `'gameover'`; the menu then starts a game with `initGame()` using the selected ship.

## Language

Comments, HUD/overlay strings, and README are in Spanish — write new ones in Spanish to match.

## README caveat

README advertises power-ups and a "estrella fugaz" asteroid type; neither exists in `game.js`. Trust the code, not that README section.
