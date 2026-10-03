// T52 inventory probe: starting bag contents, hunger, button tap effect + game log.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-inv', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const bag = [];
  try {
    for (const [id, st] of Object.entries(s.bag ?? {})) bag.push({ id, qty: st.quantity ?? st.qty ?? null, known: st.known ?? null });
  } catch (e) { return { bagErr: String(e).slice(0, 100) }; }
  // hunger shape
  const hunger = typeof s.hunger === 'object' ? { ...s.hunger } : s.hunger;
  // quaff button centre + tap it, watch windows + log
  const row = s.actionBar?.row;
  const kids = row?.children ?? [];
  const q = kids[2];
  let g = null;
  try { const p = q.toGlobal({ x: q.width / 2, y: q.height / 2 }); g = [p.x, p.y]; } catch { }
  const c = document.querySelector('canvas');
  const fire = (type) => c.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, clientX: g[0], clientY: g[1],
    pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
  }));
  const clicks = [];
  q.on('click', () => clicks.push('clicked'));
  fire('pointermove'); fire('pointerdown'); fire('pointerup');
  c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: g[0], clientY: g[1] }));
  let logTail = null;
  try {
    const gl = s.gameLog ?? s.log;
    logTail = gl ? (gl.lines ?? gl.messages ?? gl.text ?? `${typeof gl}`).toString().slice(-300) : 'no-log';
  } catch (e) { logTail = `logerr ${String(e).slice(0, 60)}`; }
  return {
    bag: bag.slice(0, 40), hunger,
    quaffBtn: q ? { w: q.width, h: q.height, g, mode: q.eventMode, ctor: q.constructor?.name } : null,
    clicks, windows: (s.gameWindows?.children ?? []).filter((x) => x.content).length,
    logTail, awaiting: s.awaitingInput,
  };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
await browser.close();
