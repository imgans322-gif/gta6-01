// Deterministic screenshot staging for Solmar Bay: each ?shot= scene arranges real
// game state (player, cars, police, wanted level, mission) and lets the renderer draw it.
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function stageShot(name, state, helpers) {
  helpers.reset(state.seed, true);
  if (name === 'drive') {
    const car = state.cars.find((c) => c.parked) || state.cars[0];
    car.x = 750; car.y = 672; car.angle = 0; car.parked = false;
    state.player.x = car.x; state.player.y = car.y;
    state.driving = car; car.speed = 215;
    state.cash = 450; state.message = 'Nice ride! Deliver the package across town.'; state.messageTimer = 99;
    // Two traffic cars staged deterministically on the same road for the driving scene.
    state.cars[16].x = 980; state.cars[16].y = 672; state.cars[17].x = 560; state.cars[17].y = 628;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'chase') {
    const car = state.cars.find((c) => c.parked) || state.cars[0];
    car.x = 1050; car.y = 1050; car.angle = 0; car.parked = false; car.speed = 260;
    state.player.x = car.x; state.player.y = car.y; state.driving = car;
    state.wanted = 3; state.cash = 900; state.jobsDone = 2;
    state.message = 'Police pursuit! Lose them and reach the beach.'; state.messageTimer = 99;
    helpers.spawnPolice(state, 3);
    // Police staged on the same horizontal road, behind and ahead of the player.
    state.police[0].x = 860; state.police[0].y = 1050; state.police[0].angle = 0;
    state.police[1].x = 900; state.police[1].y = 1018; state.police[1].angle = 0.15;
    if (state.police[2]) { state.police[2].x = 1290; state.police[2].y = 1050; state.police[2].angle = Math.PI; }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'mission') {
    state.player.x = 430; state.player.y = 500; state.cash = 300; state.jobsDone = 1;
    state.mission.stage = 'delivery'; state.mission.timer = 27;
    state.message = 'Package picked up! Deliver it before the timer runs out.'; state.messageTimer = 99;
    return { screen: SCREEN_PLAY };
  }
  // city (default / cover): on foot downtown with the first pickup marker nearby.
  state.player.x = 430; state.player.y = 560; state.cash = 150;
  state.message = 'Welcome to Solmar Bay — follow the pink marker!'; state.messageTimer = 99;
  return { screen: SCREEN_PLAY };
}
export function stageTitle(state, helpers) {
  helpers.reset(state.seed, true);
  state.player.x = 750; state.player.y = 560;
  return { screen: SCREEN_TITLE };
}
