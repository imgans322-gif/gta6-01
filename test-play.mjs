// Headless play-test for Solmar Bay: boot with zero errors, start, walk,
// teleport next to a parked car, steal it with E, then drive with W.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const puppeteer = createRequire('/home/hatch/workspace/makefun/tools/package.json')('puppeteer');
const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(join(here, 'game'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }); res.end(readFileSync(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1280, height: 800 });
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));
const before = await page.evaluate(() => ({ screen: window.__SOLMAR.state.screen, x: window.__SOLMAR.state.player.x, y: window.__SOLMAR.state.player.y }));
await page.keyboard.press('Enter');
await page.keyboard.down('KeyD');
await new Promise((r) => setTimeout(r, 900));
await page.keyboard.up('KeyD');
const walked = await page.evaluate(() => ({ screen: window.__SOLMAR.state.screen, x: window.__SOLMAR.state.player.x }));
await page.evaluate(() => {
  const s = window.__SOLMAR.state;
  const car = s.cars.find((c) => c.parked);
  s.player.x = car.x + 20; s.player.y = car.y;
});
await page.keyboard.press('KeyE');
await new Promise((r) => setTimeout(r, 200));
const stolen = await page.evaluate(() => ({ driving: !!window.__SOLMAR.state.driving, wanted: window.__SOLMAR.state.wanted, police: window.__SOLMAR.state.police.length }));
const carPos = await page.evaluate(() => ({ x: window.__SOLMAR.state.driving.x, y: window.__SOLMAR.state.driving.y }));
await page.keyboard.down('KeyW');
await new Promise((r) => setTimeout(r, 1200));
await page.keyboard.up('KeyW');
const driven = await page.evaluate(() => ({ x: window.__SOLMAR.state.driving?.x, y: window.__SOLMAR.state.driving?.y, speed: window.__SOLMAR.state.driving?.speed }));
console.log(JSON.stringify({ before, walked, stolen, carPos, driven, errors }, null, 1));
const movedWalk = walked.x > before.x + 30;
const movedDrive = driven.x !== undefined && Math.hypot(driven.x - carPos.x, driven.y - carPos.y) > 20;
console.log('walkMoved', movedWalk, 'stoleCar', stolen.driving, 'wanted>=1', stolen.wanted >= 1, 'droveMoved', movedDrive, 'errors', errors.length);
await browser.close(); server.close();
if (!movedWalk || !stolen.driving || stolen.wanted < 1 || !movedDrive || errors.length) process.exit(1);
console.log('PLAYTEST PASS');
