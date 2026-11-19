// Capture the four Solmar Bay screenshots with Puppeteer + local Chromium.
// Serves game/ locally, opens each shots.json scene at 1280x800, saves JPEGs
// into screenshots/, recompressing until each file is at most 256 KiB.
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const puppeteer = createRequire('/home/hatch/workspace/makefun/tools/package.json')('puppeteer');

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(join(here, 'game'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const data = readFileSync(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
mkdirSync(join(here, 'screenshots'), { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
try {
  for (const shot of shots) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${port}/index.html${shot.query}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 700));
    const outPath = join(here, 'screenshots', shot.name);
    let quality = 82;
    for (;;) {
      await page.screenshot({ path: outPath, type: 'jpeg', quality });
      const size = statSync(outPath).size;
      if (size <= 262144 || quality <= 30) { console.log(shot.name, size, 'bytes q=' + quality, errors.length ? 'ERRORS ' + errors.join(';') : 'ok'); break; }
      quality -= 14;
    }
    await page.close();
    if (errors.length) throw new Error('page errors in ' + shot.name + ': ' + errors.join(';'));
  }
} finally {
  await browser.close();
  server.close();
}
