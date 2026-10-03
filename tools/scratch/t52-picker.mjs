// T52 picker probe: toolbar button rects, tap quaff, dump picker rows.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-picker', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const tb = s.actionBar;
  if (!tb) return { toolbarMissing: true, keys: Object.keys(s).filter((k) => /bar|hud|tool/i.test(k)) };
  const row = tb?.row ?? tb?.children?.[0];
  if (!row) return { toolbarKeys: Object.keys(tb), rowMissing: true };
  const btns = (row?.children ?? []).map((b) => {
    let g = null;
    try { const p = b.toGlobal({ x: (b.width ?? 0) / 2, y: (b.height ?? 0) / 2 }); g = [Math.round(p.x), Math.round(p.y)]; } catch { }
    return { w: b.width, h: b.height, g, t: b.constructor?.name };
  });
  // tap the quaff button (index 2) via its own centre
  const q = btns[2];
  if (!q?.g) return { btns, quaffMissing: true };
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const fire = (type) => c.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true,
    clientX: q.g[0], clientY: q.g[1],
    pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
  }));
  fire('pointermove'); fire('pointerdown'); fire('pointerup');
  c.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, clientX: q.g[0], clientY: q.g[1] }));
  const dump = (el, depth, acc) => {
    if (!el || depth > 6) return;
    for (const k of (el.children ?? [])) {
      let g = null;
      try { const p = k.toGlobal({ x: (k.width ?? 0) / 2, y: (k.height ?? 0) / 2 }); g = [Math.round(p.x), Math.round(p.y)]; } catch { }
      const texts = [];
      try {
        const walk = (n, d) => {
          if (!n || d > 3) return;
          if (typeof n.text === 'string' && n.text.length > 0 && n.text.length < 80) texts.push(n.text);
          for (const m of (n.children ?? [])) walk(m, d + 1);
        };
        walk(k, 0);
      } catch { }
      acc.push({ t: k.constructor?.name, w: k.width, h: k.height, g, texts: texts.slice(0, 4) });
      dump(k, depth + 1, acc);
    }
  };
  const wins = (s.gameWindows?.children ?? []).filter((x) => x.content);
  const acc = [];
  for (const w of wins) { acc.push({ t: 'WINDOW', title: w.title ?? w.label ?? null }); dump(w, 0, acc); }
  return { btns, windowsOpen: wins.length, tree: acc.slice(0, 60), awaiting: s.awaitingInput };
});
console.log(JSON.stringify(out, null, 1).slice(0, 5000));
await browser.close();
