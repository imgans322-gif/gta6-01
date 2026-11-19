// Solmar Bay — main loop: player on foot and driving, wanted/police, missions, save.
// Original top-down open-world crime game. No network, no build step, canvas only.
import { WORLD, ROAD, STEP, VIEW, PLAYER, CAR, WANTED, SAVE_KEY, PALETTE } from './config.js';
import { clamp, distance } from './random.js';
import { buildCity, roadCenters, resolveCollision, hitsBuilding } from './world.js';
import { spawnVehicles, spawnPedestrians, spawnPolice, updateTraffic, updatePedestrians, updatePolice } from './entities.js';
import { createMission, updateMission } from './missions.js';
import { createInput } from './input.js';
import { renderGame, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot, stageTitle } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width; canvas.height = VIEW.height;
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7) || 7;

function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
}
function createState() {
  const saved = loadSave();
  const state = {
    seed, time: 0, screen: SCREEN_TITLE, hasSave: !!saved,
    bestCash: saved?.bestCash ?? 0, cash: saved?.cash ?? 0, jobsDone: saved?.jobsDone ?? 0,
    player: { x: 450, y: 560 }, driving: null, wanted: 0, unseenTimer: 0,
    city: null, cars: [], peds: [], police: [], mission: createMission(saved?.round ?? 0),
    message: '', messageTimer: 0, saveDirty: false, roadCenters: roadCenters(),
  };
  resetWorld(state, false);
  return state;
}
function resetWorld(state, fresh) {
  if (fresh) { state.cash = 0; state.jobsDone = 0; state.mission = createMission(0); }
  state.city = buildCity(state.seed);
  state.cars = spawnVehicles(state.seed);
  state.peds = spawnPedestrians(state.seed);
  state.police = []; state.driving = null; state.wanted = 0; state.unseenTimer = 0;
  state.player.x = 450; state.player.y = 560;
}
function saveProgress(state) {
  const bestCash = Math.max(state.bestCash, state.cash);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ cash: state.cash, jobsDone: state.jobsDone, round: state.mission.round, bestCash })); } catch { /* storage unavailable */ }
  state.bestCash = bestCash; state.saveDirty = false;
}
function addWanted(state, amount, reason) {
  const before = state.wanted;
  state.wanted = clamp(state.wanted + amount, 0, WANTED.max);
  state.unseenTimer = 0;
  if (state.wanted > before) state.message = reason;
  state.messageTimer = Math.max(state.messageTimer, 2.5);
  spawnPolice(state, state.wanted);
}
function nearestParkedCar(state) {
  let best = null; let bestDist = 52;
  for (const car of state.cars) {
    if (!car.parked) continue;
    const d = distance(state.player.x, state.player.y, car.x, car.y);
    if (d < bestDist) { best = car; bestDist = d; }
  }
  return best;
}
function stepOnFoot(state, input, dt) {
  const speed = input.down('ShiftLeft') || input.down('ShiftRight') ? PLAYER.runSpeed : PLAYER.walkSpeed;
  let dx = input.axisX(); let dy = input.axisY();
  const len = Math.hypot(dx, dy) || 1;
  if (dx || dy) {
    state.player.x += (dx / len) * speed * dt;
    state.player.y += (dy / len) * speed * dt;
    resolveCollision(state.city, state.player, PLAYER.radius);
    state.player.x = clamp(state.player.x, 16, WORLD.width - 16);
    state.player.y = clamp(state.player.y, 16, WORLD.height - 16);
  }
  if (input.justPressed('KeyE')) {
    const car = nearestParkedCar(state);
    if (car) {
      car.parked = false; state.driving = car;
      addWanted(state, 1, 'Car stolen! The police noticed.');
    }
  }
}
function stepDriving(state, input, dt) {
  const car = state.driving;
  const fwd = input.axisY() < 0; const back = input.axisY() > 0;
  if (fwd) car.speed += CAR.accel * dt;
  else if (back) car.speed -= (car.speed > 0 ? CAR.brake : CAR.accel * 0.6) * dt;
  else car.speed -= car.speed * CAR.friction * dt;
  car.speed = clamp(car.speed, -CAR.maxReverse, CAR.maxSpeed);
  const steer = input.axisX();
  if (steer && Math.abs(car.speed) > 4) car.angle += steer * CAR.turnRate * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 120);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const probe = { x: nx, y: ny };
  if (hitsBuilding(state.city, nx, ny, 16)) { car.speed *= -0.25; }
  else { car.x = clamp(nx, 24, WORLD.width - 24); car.y = clamp(ny, 24, WORLD.height - 24); }
  state.player.x = car.x; state.player.y = car.y;
  // Collisions with traffic, police and pedestrians carry consequences.
  for (const other of state.cars) {
    if (other === car) continue;
    if (distance(car.x, car.y, other.x, other.y) < 34 && Math.abs(car.speed) > 60) {
      car.speed *= 0.55; other.x += Math.cos(car.angle) * 8; other.y += Math.sin(car.angle) * 8;
      if (other.kind === 'traffic') { state.message = 'Crash! Watch the traffic.'; state.messageTimer = 2; }
    }
  }
  for (const cop of state.police) {
    if (distance(car.x, car.y, cop.x, cop.y) < 34 && Math.abs(car.speed) > 40) { car.speed *= 0.6; addWanted(state, 1, 'You hit a police car!'); }
  }
  for (const ped of state.peds) {
    if (ped.down <= 0 && distance(car.x, car.y, ped.x, ped.y) < 22 && Math.abs(car.speed) > 30) {
      ped.down = 6; addWanted(state, 1, 'You hit a pedestrian!');
    }
  }
  if (input.justPressed('KeyE') && Math.abs(car.speed) < 25) {
    car.parked = true; car.speed = 0; state.driving = null;
    state.player.x = car.x + 26; state.player.y = car.y;
    resolveCollision(state.city, state.player, PLAYER.radius);
  }
}
function stepGame(state, input, dt) {
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.screen === SCREEN_TITLE) {
    if (input.justPressed('Enter')) state.screen = SCREEN_PLAY;
    if (input.justPressed('KeyN')) { resetWorld(state, true); state.screen = SCREEN_PLAY; saveProgress(state); }
    return;
  }
  if (state.driving) stepDriving(state, input, dt); else stepOnFoot(state, input, dt);
  updateTraffic(state, dt); updatePedestrians(state, dt);
  if (state.wanted > 0) {
    spawnPolice(state, state.wanted);
    updatePolice(state, dt);
    const seen = state.police.some((cop) => distance(cop.x, cop.y, state.player.x, state.player.y) < WANTED.sightRange);
    if (seen) state.unseenTimer = 0; else {
      state.unseenTimer += dt;
      if (state.unseenTimer >= WANTED.decaySeconds) { state.wanted -= 1; state.unseenTimer = 0; state.message = state.wanted === 0 ? 'You lost the police.' : 'Heat is cooling down…'; state.messageTimer = 2.5; if (state.wanted === 0) state.police = []; }
    }
    // Busted if a police car sits on top of a slow player for a while.
    const closeCop = state.police.some((cop) => distance(cop.x, cop.y, state.player.x, state.player.y) < 30);
    if (closeCop && (!state.driving || Math.abs(state.driving.speed) < 20)) {
      state.bustedTimer = (state.bustedTimer || 0) + dt;
      if (state.bustedTimer > 2) {
        state.cash = Math.max(0, state.cash - 100); state.wanted = 0; state.police = []; state.bustedTimer = 0;
        if (state.driving) { state.driving.parked = true; state.driving = null; }
        state.player.x = 450; state.player.y = 450; state.message = 'BUSTED! -$100 fine. Stay out of trouble.'; state.messageTimer = 4;
      }
    } else state.bustedTimer = 0;
  }
  updateMission(state, dt);
  if (state.saveDirty) saveProgress(state);
  if ((state.time | 0) % 20 === 0 && state.cash > state.bestCash) saveProgress(state);
}

const state = createState();
const helpers = { reset: (s, fresh) => resetWorld(state, fresh), spawnPolice };
let screenOverride = null;
if (params.has('shot')) {
  const shot = params.get('shot');
  if (shot === 'start') { const staged = stageTitle(state, helpers); screenOverride = staged.screen; }
  else { const staged = stageShot(shot, state, helpers); screenOverride = staged.screen; state.screen = SCREEN_PLAY; }
  renderGame(ctx, state, screenOverride);
  document.title = 'Solmar Bay';
  window.__SOLMAR = { state, shot: params.get('shot') };
} else {
  const input = createInput();
  window.__SOLMAR = { state, input };
  let last = performance.now(); let acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= STEP) { stepGame(state, input, STEP); acc -= STEP; }
    input.endFrame();
    renderGame(ctx, state, state.screen);
    if (statusEl) statusEl.textContent = `Cash $${state.cash}, wanted ${state.wanted} stars`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
