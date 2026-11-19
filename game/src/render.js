// Canvas rendering for Solmar Bay: city, beach, vehicles, pedestrians, player,
// HUD (cash, wanted stars, objective, speed) and the minimap.
import { WORLD, ROAD, VIEW, PALETTE, FONT } from './config.js';
import { missionTarget } from './missions.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';

function drawCar(ctx, car, cam) {
  const x = car.x - cam.x; const y = car.y - cam.y;
  if (x < -70 || y < -70 || x > VIEW.width + 70 || y > VIEW.height + 70) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-21, -9, 46, 22);
  ctx.fillStyle = car.color; ctx.beginPath(); ctx.roundRect(-23, -11, 46, 22, 6); ctx.fill();
  ctx.fillStyle = '#bfe9ff'; ctx.fillRect(-4, -8, 12, 16); ctx.fillRect(-16, -8, 7, 16);
  ctx.fillStyle = '#222'; ctx.fillRect(-17, -13, 9, 4); ctx.fillRect(9, -13, 9, 4); ctx.fillRect(-17, 9, 9, 4); ctx.fillRect(9, 9, 9, 4);
  if (car.kind === 'police') {
    ctx.fillStyle = '#fff'; ctx.fillRect(-10, -7, 20, 14);
    ctx.fillStyle = Math.sin(car.flash || 0) > 0 ? PALETTE.policeLightA : PALETTE.policeLightB;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
export function renderGame(ctx, state, screen) {
  const cam = {
    x: Math.max(0, Math.min(WORLD.width - VIEW.width, (state.driving?.x ?? state.player.x) - VIEW.width / 2)),
    y: Math.max(0, Math.min(WORLD.height - VIEW.height, (state.driving?.y ?? state.player.y) - VIEW.height / 2)),
  };
  // Ground, water and sand.
  ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(ROAD.beachX - cam.x, 0, WORLD.width - ROAD.beachX + 400, VIEW.height);
  ctx.fillStyle = PALETTE.water; ctx.fillRect(ROAD.beachX + 180 - cam.x, 0, 500, VIEW.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 6; i += 1) { const wy = ((state.time * 22 + i * 150) % VIEW.height); ctx.beginPath(); ctx.moveTo(ROAD.beachX + 205 - cam.x, wy); ctx.lineTo(ROAD.beachX + 265 - cam.x, wy); ctx.stroke(); }
  // Roads.
  ctx.fillStyle = PALETTE.road;
  const { xs, ys } = state.roadCenters;
  for (const cx of xs) ctx.fillRect(cx - ROAD.width / 2 - cam.x, 0 - cam.y, ROAD.width, WORLD.height);
  for (const cy of ys) ctx.fillRect(0 - cam.x, cy - ROAD.width / 2 - cam.y, ROAD.beachX, ROAD.width);
  ctx.strokeStyle = PALETTE.roadLine; ctx.setLineDash([18, 16]); ctx.lineWidth = 3;
  for (const cx of xs) { ctx.beginPath(); ctx.moveTo(cx - cam.x, -cam.y); ctx.lineTo(cx - cam.x, WORLD.height - cam.y); ctx.stroke(); }
  for (const cy of ys) { ctx.beginPath(); ctx.moveTo(-cam.x, cy - cam.y); ctx.lineTo(ROAD.beachX - cam.x, cy - cam.y); ctx.stroke(); }
  ctx.setLineDash([]);
  // Sidewalk blocks tint.
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (const b of state.city.buildings) ctx.fillRect(b.x - 8 - cam.x, b.y - 8 - cam.y, b.w + 16, b.h + 16);
  // Buildings with neon signs.
  for (const b of state.city.buildings) {
    const x = b.x - cam.x; const y = b.y - cam.y;
    if (x + b.w < 0 || y + b.h < 0 || x > VIEW.width || y > VIEW.height) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 5, y + 6, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(x, y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(x, y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let fx = 10; fx < b.w - 8; fx += 18) for (let fy = 10; fy < b.h - 8; fy += 18) ctx.fillRect(x + fx, y + fy, 7, 7);
    if (b.sign) { ctx.font = 'bold 11px ' + FONT; ctx.fillStyle = b.signColor; ctx.textAlign = 'center'; ctx.fillText(b.sign, x + b.w / 2, y + b.h / 2 + 4); }
  }
  // Palms and lights.
  for (const p of state.city.palms) {
    const x = p.x - cam.x; const y = p.y - cam.y;
    if (x < -30 || y < -30 || x > VIEW.width + 30 || y > VIEW.height + 30) continue;
    ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 12 * p.s); ctx.stroke();
    ctx.strokeStyle = '#2e8b3a'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) { const a = (i / 5) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + 3, y - 12 * p.s); ctx.lineTo(x + 3 + Math.cos(a) * 14 * p.s, y - 12 * p.s + Math.sin(a) * 7 * p.s); ctx.stroke(); }
  }
  ctx.fillStyle = '#ffe9a3';
  for (const l of state.city.lights) { const x = l.x - cam.x; const y = l.y - cam.y; if (x < -10 || y < -10 || x > VIEW.width + 10 || y > VIEW.height + 10) continue; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  // Mission marker.
  const target = missionTarget(state.mission);
  const mx = target.x - cam.x; const my = target.y - cam.y;
  const bob = Math.sin(state.time * 4) * 6;
  ctx.fillStyle = PALETTE.marker; ctx.beginPath(); ctx.arc(mx, my + bob, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('!', mx, my + bob + 6);
  ctx.strokeStyle = PALETTE.marker; ctx.beginPath(); ctx.arc(mx, my, 30 + Math.sin(state.time * 4) * 5, 0, Math.PI * 2); ctx.stroke();
  // Entities.
  for (const car of state.cars) drawCar(ctx, car, cam);
  for (const cop of state.police) drawCar(ctx, cop, cam);
  for (const ped of state.peds) {
    const x = ped.x - cam.x; const y = ped.y - cam.y;
    if (x < -20 || y < -20 || x > VIEW.width + 20 || y > VIEW.height + 20) continue;
    ctx.fillStyle = ped.down > 0 ? '#999' : ped.color;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c09a'; ctx.beginPath(); ctx.arc(x, y - 2, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  if (state.driving) drawCar(ctx, state.driving, cam);
  if (!state.driving) {
    const x = state.player.x - cam.x; const y = state.player.y - cam.y;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x, y + 8, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c09a'; ctx.beginPath(); ctx.arc(x, y - 3, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#123'; ctx.font = 'bold 9px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('YOU', x, y + 24);
  }
  drawHud(ctx, state);
  if (screen === SCREEN_TITLE) drawTitle(ctx, state);
}
function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hudBg; ctx.beginPath(); ctx.roundRect(14, 14, 330, 92, 10); ctx.fill();
  ctx.fillStyle = PALETTE.hudText; ctx.textAlign = 'left'; ctx.font = 'bold 22px ' + FONT;
  ctx.fillText(`$${state.cash}`, 28, 44);
  ctx.font = '15px ' + FONT; ctx.fillText(`Jobs done: ${state.jobsDone}`, 28, 68);
  const target = missionTarget(state.mission);
  ctx.font = 'bold 13px ' + FONT; ctx.fillStyle = PALETTE.accent;
  ctx.fillText(target.label.slice(0, 44), 28, 90);
  if (state.mission.stage === 'delivery') { ctx.fillStyle = '#ff6b6b'; ctx.fillText(`Time left: ${Math.ceil(state.mission.timer)}s`, 220, 68); }
  // Wanted stars top-right.
  ctx.font = '26px ' + FONT; ctx.textAlign = 'right';
  for (let i = 0; i < 5; i += 1) { ctx.fillStyle = i < state.wanted ? PALETTE.star : 'rgba(255,255,255,0.25)'; ctx.fillText('★', VIEW.width - 20 - (4 - i) * 30, 42); }
  ctx.font = 'bold 14px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText(state.wanted > 0 ? 'WANTED' : '', VIEW.width - 20, 66);
  if (state.driving) { ctx.fillStyle = PALETTE.hudBg; ctx.beginPath(); ctx.roundRect(VIEW.width - 170, VIEW.height - 64, 156, 48, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 20px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(Math.abs(state.driving.speed) * 0.36)} km/h`, VIEW.width - 92, VIEW.height - 34); }
  if (state.message && state.messageTimer > 0) {
    ctx.fillStyle = PALETTE.hudBg; const w = Math.min(760, 30 + state.message.length * 8.4);
    ctx.beginPath(); ctx.roundRect((VIEW.width - w) / 2, VIEW.height - 118, w, 40, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(state.message, VIEW.width / 2, VIEW.height - 92);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '13px ' + FONT; ctx.textAlign = 'left';
  ctx.fillText(state.driving ? 'WASD drive · E exit car' : 'WASD walk · Shift run · E enter car near a parked car', 16, VIEW.height - 18);
  drawMinimap(ctx, state);
}
function drawMinimap(ctx, state) {
  const w = 196; const h = 148; const x = VIEW.width - w - 14; const y = 78;
  ctx.fillStyle = PALETTE.hudBg; ctx.beginPath(); ctx.roundRect(x - 4, y - 4, w + 8, h + 8, 10); ctx.fill();
  const sx = w / WORLD.width; const sy = h / WORLD.height;
  ctx.fillStyle = '#4a7c59'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PALETTE.water; ctx.fillRect(x + ROAD.beachX * sx, y, (WORLD.width - ROAD.beachX) * sx, h);
  ctx.fillStyle = '#e8cf8f'; ctx.fillRect(x + ROAD.beachX * sx, y, 14, h);
  ctx.strokeStyle = '#d9d9d9'; ctx.lineWidth = 2;
  for (const cx of state.roadCenters.xs) { ctx.beginPath(); ctx.moveTo(x + cx * sx, y); ctx.lineTo(x + cx * sx, y + h); ctx.stroke(); }
  for (const cy of state.roadCenters.ys) { ctx.beginPath(); ctx.moveTo(x, y + cy * sy); ctx.lineTo(x + ROAD.beachX * sx, y + cy * sy); ctx.stroke(); }
  const target = missionTarget(state.mission);
  ctx.fillStyle = PALETTE.marker; ctx.beginPath(); ctx.arc(x + target.x * sx, y + target.y * sy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff5566';
  for (const cop of state.police) { ctx.fillRect(x + cop.x * sx - 2, y + cop.y * sy - 2, 4, 4); }
  ctx.fillStyle = '#fff';
  for (const car of state.cars) { if (!car.parked) ctx.fillRect(x + car.x * sx - 1.5, y + car.y * sy - 1.5, 3, 3); }
  const px = state.driving?.x ?? state.player.x; const py = state.driving?.y ?? state.player.y;
  ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(x + px * sx, y + py * sy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px ' + FONT; ctx.textAlign = 'left'; ctx.fillText('SOLMAR BAY', x + 4, y + 14);
}
function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(6,12,24,0.62)'; ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 76px ' + FONT; ctx.fillText('SOLMAR BAY', VIEW.width / 2, 300);
  ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 24px ' + FONT; ctx.fillText('Sun, streets and second chances', VIEW.width / 2, 342);
  ctx.fillStyle = '#fff'; ctx.font = '18px ' + FONT;
  ctx.fillText('Walk and drive a coastal city. Pick up packages, deliver them on time,', VIEW.width / 2, 402);
  ctx.fillText('steal a ride when you need one — and lose the police before the beach.', VIEW.width / 2, 428);
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 22px ' + FONT;
  ctx.fillText(state.hasSave ? 'Press ENTER to continue · N for a new game' : 'Press ENTER to start', VIEW.width / 2, 490);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '15px ' + FONT;
  ctx.fillText(`Best cash saved: $${state.bestCash} · Jobs done: ${state.jobsDone}`, VIEW.width / 2, 526);
  ctx.fillText('WASD / arrows move · E enter or exit car · Shift run', VIEW.width / 2, 556);
}
