# AGENTS.md

## What this is

Static vanilla-JS game: `index.html`, `game.js` (all game logic, ~360 lines), `favicon.svg`, `README.md`. No `package.json`, no build, no dependencies, no tests, no lint, no CI, no workspace config.

## Run / verify

- Open `index.html` directly (double-click works over `file://`), or `npx serve .` → http://localhost:3000.
- No automated checks exist — verify changes by playing in the browser.
- Keep it working over `file://`: adding `import`/`fetch` breaks the double-click launch.

## Codebase facts

- `game.js` is a classic (non-module) script: every top-level `const`/function/class shares one scope; there are no imports/exports. Don't introduce ES modules without also adding `type="module"` to the `<script>` in `index.html` (and losing `file://` support).
- Execution flow: input handlers → entity classes (`Bullet`, `Asteroid`, `Ship`, `Particle`) → game state (`state` is `'playing' | 'dead' | 'gameover'`) → `update(dt)` / `draw()` → `loop()` via `requestAnimationFrame`. Entry point is the last two lines: `initGame(); requestAnimationFrame(loop);`.
- Balance lives in three parallel arrays near the top: `RADII` / `SPEEDS` / `POINTS`, indexed by asteroid size 1–3 (index 0 is a placeholder). Scoring in README: 20 / 50 / 100.
- Two ships are selectable with `1` / `2` (also works at game over). `SHIPS` holds both definitions (color, size scale, collision radius, score multiplier); `shipIndex` is the current one and survives restarts. `selectShip()` swaps the definition in place, keeping position and velocity.
- Input: `keys[code]` is held state; `pressed(code)` is one-shot and clears the flag on read, so at most one caller can consume a keypress per frame (`Space` restart and `Space` fire both use it).
- `dt` is in seconds and clamped to 0.05 max; game speed is dt-based, so don't use per-frame constants for motion.
- Restart is `pressed('Space') → initGame()` while `'gameover'`.

## Language

Comments, HUD/overlay strings, and README are in Spanish — write new ones in Spanish to match.

## README caveat

The README used to advertise power-ups and a "estrella fugaz" asteroid type; neither exists in `game.js`. That claim was removed, but trust the code over the README in general.
