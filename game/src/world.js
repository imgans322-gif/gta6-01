// City generation for Solmar Bay: road grid, city blocks, buildings with neon signs,
// beach and water on the east edge, street lights and palm trees, plus collision helpers.
import { WORLD, ROAD, PALETTE, SIGNS } from './config.js';
import { createRandom, pick, randRange } from './random.js';

export function roadCenters() {
  const xs = []; const ys = [];
  for (let x = 150; x < ROAD.beachX; x += ROAD.spacing) xs.push(x);
  for (let y = 150; y < WORLD.height; y += ROAD.spacing) ys.push(y);
  return { xs, ys };
}
export function isOnRoad(x, y) {
  const half = ROAD.width / 2;
  if (x > ROAD.beachX) return false;
  const { xs, ys } = roadCenters();
  return xs.some((cx) => Math.abs(x - cx) <= half) || ys.some((cy) => Math.abs(y - cy) <= half);
}
export function buildCity(seed) {
  const rng = createRandom(seed);
  const buildings = []; const palms = []; const lights = [];
  const { xs, ys } = roadCenters();
  // Buildings fill each block between roads, leaving sidewalk margins.
  for (let bx = 0; bx < xs.length; bx += 1) {
    for (let by = 0; by < ys.length; by += 1) {
      const x0 = xs[bx] + ROAD.width / 2 + 14;
      const y0 = ys[by] + ROAD.width / 2 + 14;
      const x1 = (xs[bx + 1] ?? ROAD.beachX) - ROAD.width / 2 - 14;
      const y1 = (ys[by + 1] ?? WORLD.height) - ROAD.width / 2 - 14;
      if (x1 - x0 < 90 || y1 - y0 < 90) continue;
      const cols = rng() > 0.5 ? 2 : 1; const rows = rng() > 0.5 ? 2 : 1;
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const w = (x1 - x0) / cols - 12; const h = (y1 - y0) / rows - 12;
          buildings.push({
            x: x0 + c * ((x1 - x0) / cols) + 6, y: y0 + r * ((y1 - y0) / rows) + 6,
            w, h, color: pick(rng, PALETTE.buildingRoofs),
            sign: rng() > 0.45 ? pick(rng, SIGNS) : null,
            signColor: pick(rng, PALETTE.neon), floors: 2 + Math.floor(rng() * 6),
          });
        }
      }
    }
  }
  for (let x = 60; x < ROAD.beachX; x += 90) {
    for (const cy of ys) lights.push({ x: x + randRange(rng, -8, 8), y: cy - ROAD.width / 2 - 8 });
  }
  for (let y = 40; y < WORLD.height; y += 110) palms.push({ x: ROAD.beachX + 30 + rng() * 60, y, s: randRange(rng, 0.8, 1.3) });
  for (let i = 0; i < 26; i += 1) palms.push({ x: randRange(rng, 80, ROAD.beachX - 80), y: randRange(rng, 60, WORLD.height - 60), s: randRange(rng, 0.7, 1.1) });
  return { buildings, palms, lights, seed };
}
export function hitsBuilding(city, x, y, radius) {
  for (const b of city.buildings) {
    if (x + radius > b.x && x - radius < b.x + b.w && y + radius > b.y && y - radius < b.y + b.h) return b;
  }
  return null;
}
export function resolveCollision(city, pos, radius) {
  const b = hitsBuilding(city, pos.x, pos.y, radius);
  if (!b) return pos;
  const left = Math.abs(pos.x + radius - b.x); const right = Math.abs(b.x + b.w - (pos.x - radius));
  const top = Math.abs(pos.y + radius - b.y); const bottom = Math.abs(b.y + b.h - (pos.y - radius));
  const m = Math.min(left, right, top, bottom);
  if (m === left) pos.x = b.x - radius; else if (m === right) pos.x = b.x + b.w + radius;
  else if (m === top) pos.y = b.y - radius; else pos.y = b.y + b.h + radius;
  return pos;
}
