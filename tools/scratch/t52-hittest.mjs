// T52 hit-test probe: does the map receive pointerdown from a synthetic tap?
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-hittest', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const tx = s.hero.x + 1, ty = s.hero.y;
  const g = s.map.toGlobal({ x: tx * 16 + 8, y: ty * 16 + 8 });
  const fx = g.x / 1024, fy = g.y / 768;
  const log = [];
  const onDown = (e) => log.push(`map pointerdown global=${Math.round(e.global.x)},${Math.round(e.global.y)}`);
  s.map.on('pointerdown', onDown);
  // what does the event system hit-test at that point?
  let hit = 'n/a';
  try {
    const sys = s.app?.renderer?.events ?? s.stage?.eventSystem ?? null;
    hit = sys ? typeof sys.hitTest?.name ?? 'no-hitTest-fn' : 'no-event-system';
  } catch (e) { hit = `err ${String(e).slice(0, 80)}`; }
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const fire = (type, extra = {}) => c.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true,
    clientX: r.x + r.width * fx, clientY: r.y + r.height * fy,
    pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, ...extra,
  }));
  fire('pointermove'); fire('pointerdown');
  const afterDown = { hero: [s.hero.x, s.hero.y], travel: s.travelTarget, log: [...log] };
  fire('pointerup'); c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.x + r.width * fx, clientY: r.y + r.height * fy }));
  s.map.off('pointerdown', onDown);
  return {
    hero0: { x: s.hero.x, y: s.hero.y }, target: { x: tx, y: ty }, frac: { x: fx, y: fy },
    mapEventMode: s.map.eventMode, mapVisible: s.map.visible, mapInteractive: s.map.interactive,
    hitTest: hit, afterDown,
    afterUp: { hero: [s.hero.x, s.hero.y], travel: s.travelTarget, log },
    awaiting: s.awaitingInput,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
