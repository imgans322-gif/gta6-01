# Solmar Bay

![Competition badge](https://make.fun/badge/gta6-01.svg)
![Rank badge](https://make.fun/badge/gta6-01/imgans322-gif/gta6-01/rank.svg)
![Reward badge](https://make.fun/badge/gta6-01/imgans322-gif/gta6-01/reward.svg)

Entry for the make.fun bounty [gta6-01 — Make GTA 6](https://make.fun/bounties/gta6-01).

**Solmar Bay** is an original top-down 2D open-world crime game that runs in a desktop browser from static files — no build step, no network requests. Explore a sun-soaked coastal city on foot and by car: a grid of streets and city blocks with neon-signed buildings, a beach and water along the east edge, street lights and palm trees, moving traffic and pedestrians on the sidewalks.

## How to play

- **Start:** press `Enter` on the title screen (`N` starts a new game and wipes saved cash).
- **Walk:** `WASD` or arrow keys. Hold `Shift` to run.
- **Cars:** walk up to a parked car and press `E` to steal and drive it; press `E` again while stopped to get out. Driving has acceleration, braking/reverse, steering and collisions with buildings, traffic and police cars.
- **Wanted system:** stealing a car, hitting a pedestrian or hitting a police car raises your wanted stars (up to 5). Police cars spawn and pursue you. Break their line of sight for a while and the stars cool down. Get pinned by a police car while slow and you are busted and fined.
- **Missions:** follow the pink marker. Pick up the package, deliver it to the drop-off before the timer runs out for cash, then lose the heat and reach the beach safe point to finish the job. Jobs loop with rising rewards.
- **HUD:** cash, jobs done, current objective and delivery timer (top left), wanted stars (top right), speedometer while driving, and a live minimap showing streets, the beach, traffic, police, the objective and you.
- **Save:** cash, jobs done and mission round are saved in `localStorage` and restored on your next visit.

## Run it locally

```sh
node serve.ts          # serves game/ at http://localhost:8080
```

Then open <http://localhost:8080> in a desktop browser.

## Hand in the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `game/` and `screenshots/` into `out/` and writes `out/dossier.json`.

## Layout

- `game/index.html` — page shell and canvas
- `game/src/config.js` — tuning, palette and save key
- `game/src/world.js` — city generation, roads, buildings, collisions
- `game/src/entities.js` — traffic, pedestrians and police AI
- `game/src/missions.js` — pickup / delivery / escape mission loop
- `game/src/render.js` — city rendering, HUD and minimap
- `game/src/input.js` — keyboard input
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=city|drive|chase|mission`)
- `game/src/main.js` — game loop, player, driving, wanted system and saving
- `capture.mjs` — Puppeteer script that captures the four screenshots in `screenshots/`
