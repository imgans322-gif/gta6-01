// Solmar Bay tuning: world size, roads, speeds, colours and save keys in one place.
export const WORLD = { width: 2400, height: 1800 };
export const ROAD = { spacing: 300, width: 92, beachX: 2040 };
export const STEP = 1 / 60;
export const VIEW = { width: 1280, height: 800 };
export const PLAYER = { radius: 11, walkSpeed: 175, runSpeed: 245 };
export const CAR = { length: 46, width: 22, accel: 260, brake: 420, maxSpeed: 330, maxReverse: 110, turnRate: 2.4, friction: 1.6 };
export const WANTED = { max: 5, decaySeconds: 9, sightRange: 340 };
export const SAVE_KEY = 'solmar-bay.save.v1';
export const PALETTE = {
  water: '#1b6f8e', sand: '#e8cf8f', grass: '#57a05a', sidewalk: '#c9c2b4',
  road: '#3a3f47', roadLine: '#f5d76e', block: '#8fae6b',
  buildingRoofs: ['#e2725b', '#5b8e7d', '#f2cc8f', '#81b29a', '#e07a5f', '#6d8ea0', '#c9ada7', '#90be6d'],
  neon: ['#ff2e88', '#00e5ff', '#ffe600', '#7cff00', '#ff6d00'],
  player: '#ffd23f', carBody: ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#e9c46a', '#9b5de5', '#f1fa8c', '#00bbf9'],
  police: '#1d3557', policeLightA: '#ff3355', policeLightB: '#3388ff',
  ped: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f78c6b', '#a8dadc'],
  hudBg: 'rgba(10,18,28,0.72)', hudText: '#ffffff', accent: '#ffd23f', star: '#ffd23f', marker: '#ff2e88',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const SIGNS = ['SOLMAR', 'CAFE LUNA', 'HOTEL AZUL', 'TACO MAR', 'SURF SHOP', 'NEON BAR', 'PIER 9', 'MERCADO', 'CINEMA SOL', 'GYM OLA'];
