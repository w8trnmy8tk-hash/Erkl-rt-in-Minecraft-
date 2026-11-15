import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright/index.js');
import fs from 'fs';
const [,, from = '0', to = '', outDir = 'frames', list = ''] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); });
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.goto('http://127.0.0.1:8765/index.html');
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const total = await page.evaluate(() => window.TOTAL);
const frames = list ? list.split(',').map(Number) : [...Array((to ? +to : total) - +from).keys()].map(i => i + +from);
const t0 = Date.now();
for (const f of frames) {
  await page.evaluate(f => window.renderFrame(f), f);
  await page.screenshot({ path: `${outDir}/f${String(f).padStart(4, '0')}.png` });
  if (f % 30 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await browser.close();
