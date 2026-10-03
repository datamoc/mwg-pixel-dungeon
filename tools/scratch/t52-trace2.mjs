// T52 branch-trace probe: wrap handleMapPointer/stepTravel to log the taken branch.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(
  process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
  'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newContext({ viewport: { width: 1024, height: 768 } }).then((c) => c.newPage());
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const tap = async (fx, fy, waitMs = 1000) => {
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width * x, clientY: r.y + r.height * y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointermove', opts));
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
  }, [fx, fy]);
  await page.waitForTimeout(waitMs);
};
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-trace', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const log = [];
  const origH = s.handleMapPointer.bind(s);
  const origS = s.stepTravel.bind(s);
  s.handleMapPointer = function (sx, sy) {
    const local = this.camera.toWorld(sx, sy);
    const t = { x: Math.floor(local.x / 16), y: Math.floor(local.y / 16) };
    log.push({
      ev: 'handle', sx: Math.round(sx), sy: Math.round(sy), cell: t,
      awaiting: this.awaitingInput, gameOver: !!this.gameOver, aiming: !!this.aiming,
      inside: this.level.inside(t.x, t.y),
      clicked: (() => { const c = this.creatureAt(t.x, t.y); return c ? { ally: !!c.isAlly, npc: !!c.isNPC, kind: c.kind ?? null } : null; })(),
    });
    const r = origH.call(this, sx, sy);
    log.push({ ev: 'handled', travel: this.travelTarget, hero: [this.hero.x, this.hero.y] });
    return r;
  };
  s.stepTravel = function () {
    const to = this.travelTarget;
    log.push({ ev: 'step', to, hero: [this.hero.x, this.hero.y], awaiting: this.awaitingInput });
    const r = origS.call(this);
    log.push({ ev: 'stepped', travel: this.travelTarget, hero: [this.hero.x, this.hero.y] });
    return r;
  };
  const dest = { x: s.hero.x, y: s.hero.y + 5 };
  const g = s.map.toGlobal({ x: dest.x * 16 + 8, y: dest.y * 16 + 8 });
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const cx = r.x + r.width * (g.x / 1024), cy = r.y + r.height * (g.y / 768);
  const mk = (type) => new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, clientX: cx, clientY: cy,
    pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1,
  });
  c.dispatchEvent(mk('pointermove'));
  c.dispatchEvent(mk('pointerdown'));
  return { hero0: [s.hero.x, s.hero.y], dest, log };
});
console.log(JSON.stringify({ ...out, pageerrors: problems }, null, 1));
await browser.close();
