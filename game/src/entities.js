// Traffic cars, parked cars, police cars and pedestrians: spawning and simple road-following AI.
import { WORLD, ROAD, PALETTE } from './config.js';
import { createRandom, pick, randRange, clamp } from './random.js';
import { roadCenters, hitsBuilding } from './world.js';

export function makeCar(x, y, angle, color, kind) {
  return { x, y, angle, speed: 0, color, kind, parked: kind === 'parked', id: Math.floor(x * 7 + y * 13) };
}
export function spawnVehicles(seed) {
  const rng = createRandom(seed + 77);
  const { xs, ys } = roadCenters();
  const cars = [];
  // Parked cars along vertical roads.
  for (let i = 0; i < 16; i += 1) {
    const cx = pick(rng, xs); const y = randRange(rng, 60, WORLD.height - 60);
    cars.push(makeCar(cx + (rng() > 0.5 ? 28 : -28), y, Math.PI / 2, pick(rng, PALETTE.carBody), 'parked'));
  }
  // Moving traffic: half horizontal, half vertical, driving on the right side.
  for (let i = 0; i < 14; i += 1) {
    if (i % 2 === 0) {
      const cy = pick(rng, ys);
      cars.push({ ...makeCar(randRange(rng, 40, ROAD.beachX - 80), cy + 22, 0, pick(rng, PALETTE.carBody), 'traffic'), speed: randRange(rng, 90, 150), dir: 1, laneAxis: 'x' });
    } else {
      const cx = pick(rng, xs);
      cars.push({ ...makeCar(cx + 22, randRange(rng, 40, WORLD.height - 80), Math.PI / 2, pick(rng, PALETTE.carBody), 'traffic'), speed: randRange(rng, 90, 150), dir: 1, laneAxis: 'y' });
    }
  }
  return cars;
}
export function spawnPedestrians(seed) {
  const rng = createRandom(seed + 131);
  const peds = [];
  for (let i = 0; i < 22; i += 1) {
    peds.push({
      x: randRange(rng, 60, ROAD.beachX - 40), y: randRange(rng, 60, WORLD.height - 60),
      angle: rng() * Math.PI * 2, speed: randRange(rng, 28, 52), color: pick(rng, PALETTE.ped),
      turnTimer: randRange(rng, 1, 4), down: 0,
    });
  }
  return peds;
}
export function spawnPolice(state, count) {
  const rng = createRandom(Math.floor(state.time * 60) + count * 991 + 7);
  const { xs, ys } = roadCenters();
  while (state.police.length < count) {
    // Spawn on the nearest road intersection offset from the player, so police
    // arrive on streets instead of inside city blocks.
    const nearX = xs.reduce((best, cx) => (Math.abs(cx - state.player.x) < Math.abs(best - state.player.x) ? cx : best), xs[0]);
    const nearY = ys.reduce((best, cy) => (Math.abs(cy - state.player.y) < Math.abs(best - state.player.y) ? cy : best), ys[0]);
    const x = clamp(nearX + (rng() > 0.5 ? 300 : -300), 60, ROAD.beachX - 60);
    const y = clamp(nearY + (rng() > 0.5 ? 300 : -300), 60, WORLD.height - 60);
    state.police.push({ x, y, angle: 0, speed: 0, color: PALETTE.police, kind: 'police', parked: false, flash: rng() * 6 });
  }
}
export function updateTraffic(state, dt) {
  for (const car of state.cars) {
    if (car.parked || car.kind !== 'traffic') continue;
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    if (car.x > ROAD.beachX - 30) { car.x = 40; }
    if (car.y > WORLD.height - 30) { car.y = 40; }
    if (car.x < 20) car.x = ROAD.beachX - 60;
    if (car.y < 20) car.y = WORLD.height - 60;
    if (hitsBuilding(state.city, car.x, car.y, 14)) { car.speed = Math.abs(car.speed); car.x += Math.cos(car.angle) * 30 * dt; }
  }
}
export function updatePedestrians(state, dt) {
  for (const ped of state.peds) {
    if (ped.down > 0) { ped.down -= dt; continue; }
    ped.turnTimer -= dt;
    if (ped.turnTimer <= 0) { ped.angle += randRange(Math.random, -1.2, 1.2); ped.turnTimer = randRange(Math.random, 1, 4); }
    const nx = ped.x + Math.cos(ped.angle) * ped.speed * dt;
    const ny = ped.y + Math.sin(ped.angle) * ped.speed * dt;
    if (!hitsBuilding(state.city, nx, ny, 8) && nx > 20 && nx < WORLD.width - 20 && ny > 20 && ny < WORLD.height - 20) { ped.x = nx; ped.y = ny; }
    else ped.angle += Math.PI / 2;
  }
}
export function updatePolice(state, dt) {
  for (const cop of state.police) {
    cop.flash += dt * 8;
    const target = state.driving ?? state.player;
    const dx = target.x - cop.x; const dy = target.y - cop.y;
    const dist = Math.hypot(dx, dy) || 1;
    const want = Math.atan2(dy, dx);
    let diff = want - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += clamp(diff, -2.2 * dt, 2.2 * dt);
    const top = dist > 90 ? 305 : 150;
    cop.speed += clamp(top - cop.speed, -300 * dt, 220 * dt);
    const nx = cop.x + Math.cos(cop.angle) * cop.speed * dt;
    const ny = cop.y + Math.sin(cop.angle) * cop.speed * dt;
    if (!hitsBuilding(state.city, nx, ny, 15)) { cop.x = nx; cop.y = ny; } else { cop.speed *= 0.4; cop.angle += 0.7 * dt; }
  }
}
