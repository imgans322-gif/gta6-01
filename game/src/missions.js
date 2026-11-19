// Mission loop for Solmar Bay: pickup, timed delivery, then escape the police.
// Completing the loop pays cash, saves progress and starts a harder round.
import { ROAD, WORLD } from './config.js';
import { distance } from './random.js';

export const MISSION_PICKUP = 'pickup';
export const MISSION_DELIVERY = 'delivery';
export const MISSION_ESCAPE = 'escape';
export const MISSION_DONE = 'done';

const SPOTS = [
  { x: 450, y: 450, label: 'Pier 9 package' },
  { x: 1050, y: 750, label: 'Mercado parcel' },
  { x: 1650, y: 450, label: 'Hotel Azul bag' },
  { x: 750, y: 1350, label: 'Cinema Sol crate' },
  { x: 1800, y: 1500, label: 'Beach kiosk box' },
  { x: 450, y: 1500, label: 'Taco Mar order' },
];
export function createMission(round) {
  const from = SPOTS[round % SPOTS.length];
  const to = SPOTS[(round + 2) % SPOTS.length];
  return { stage: MISSION_PICKUP, round, from, to, timer: 0, reward: 150 + round * 50 };
}
export function missionTarget(mission) {
  if (mission.stage === MISSION_PICKUP) return { x: mission.from.x, y: mission.from.y, label: `Pick up: ${mission.from.label}` };
  if (mission.stage === MISSION_DELIVERY) return { x: mission.to.x, y: mission.to.y, label: `Deliver to ${mission.to.label}` };
  if (mission.stage === MISSION_ESCAPE) return { x: ROAD.beachX + 140, y: 900, label: 'Escape to the beach safe point' };
  return { x: WORLD.width / 2, y: WORLD.height / 2, label: 'Free roam — new job incoming' };
}
export function updateMission(state, dt) {
  const m = state.mission;
  if (m.stage === MISSION_DELIVERY) {
    m.timer -= dt;
    if (m.timer <= 0) { state.message = 'Delivery failed — too slow. New job posted.'; state.mission = createMission(m.round); return 'failed'; }
  }
  const t = missionTarget(m);
  const px = state.driving ? state.driving.x : state.player.x;
  const py = state.driving ? state.driving.y : state.player.y;
  if (distance(px, py, t.x, t.y) > 42) return null;
  if (m.stage === MISSION_PICKUP) {
    m.stage = MISSION_DELIVERY; m.timer = 45; state.message = 'Package picked up! Deliver it before the timer runs out.';
    return 'pickup';
  }
  if (m.stage === MISSION_DELIVERY) {
    state.cash += m.reward; state.jobsDone += 1;
    state.message = `Delivered! +$${m.reward}. Now lose the heat and reach the beach.`;
    if (state.wanted < 2) state.wanted = 2;
    m.stage = MISSION_ESCAPE; return 'delivered';
  }
  if (m.stage === MISSION_ESCAPE) {
    if (state.wanted > 0) { state.message = 'Reach the safe point with no stars to finish the job.'; return null; }
    state.cash += 100; state.message = `Job complete! Round ${m.round + 1} posted.`;
    state.mission = createMission(m.round + 1); state.saveDirty = true; return 'complete';
  }
  return null;
}
