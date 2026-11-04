// Headless frame renderer: node render.cjs <module> stills <out_dir> t1,t2,...  |  node render.cjs <module> video <out.mkv> [from] [to]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const serve = require('../../the-last-ember/render/server.cjs');
(async () => {
  const [mod, mode, out, a, b] = process.argv.slice(2);
  const ROOT = path.resolve(__dirname, '../..');
  const srv = await serve(ROOT, 8765 + Math.floor(Math.random() * 1000));
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text().slice(0, 400)); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/dragons-still-existed/render/index.html`);
  await page.waitForFunction(() => window.ready === true);
  const info = await page.evaluate((m) => window.load(m), '/dragons-still-existed/render/src/' + mod + '.js');
  console.error('duration', info.duration, 'shots', info.shots.length);
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    const times = a.split(',').map(Number);
    for (const t of times) {
      const url = await page.evaluate((t) => window.framePNG(t), t);
      fs.writeFileSync(path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
    }
  } else {
    const fps = 30, from = Number(a ?? 0), to = Number(b ?? info.duration);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '360x640', '-r', String(fps), '-i', '-', '-vf', 'vflip', '-c:v', 'ffv1', '-pix_fmt', 'bgr0', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
    const t0 = Date.now();
    for (let n = n0; n < n1; n++) {
      const b64 = await page.evaluate((t) => window.frameRaw(t), n / fps);
      const buf = Buffer.from(b64, 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((n - n0) % 150 === 0) console.error(`frame ${n}/${n1} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
