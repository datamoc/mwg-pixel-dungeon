// T52 UI-tree probe: dump HUD/toolbar + open bag and dump the item window.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-ui', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const dump = (el, depth) => {
  if (!el || depth > 4) return null;
  const kids = [];
  try {
    for (const k of (el.children ?? [])) {
      let g = null;
      try { const p = k.toGlobal({ x: (k.width ?? 0) / 2, y: (k.height ?? 0) / 2 }); g = [Math.round(p.x), Math.round(p.y)]; } catch { }
      kids.push({
        t: k.constructor?.name ?? '?',
        label: k.label ?? k.title ?? k.text ?? null,
        w: k.width, h: k.height, vis: k.visible !== false, mode: k.eventMode ?? null,
        g, kids: dump(k, depth + 1),
      });
    }
  } catch { }
  return kids;
};
const hud = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const dump = (el, depth) => {
    if (!el || depth > 4) return null;
    const kids = [];
    try {
      for (const k of (el.children ?? [])) {
        let g = null;
        try { const p = k.toGlobal({ x: (k.width ?? 0) / 2, y: (k.height ?? 0) / 2 }); g = [Math.round(p.x), Math.round(p.y)]; } catch { }
        kids.push({
          t: k.constructor?.name ?? '?',
          label: k.label ?? k.title ?? k.text ?? null,
          w: k.width, h: k.height, vis: k.visible !== false, mode: k.eventMode ?? null,
          g, kids: dump(k, depth + 1),
        });
      }
    } catch { }
    return kids;
  };
  const out = {};
  for (const k of ['toolbar', 'hud', 'menu', 'statusPane', 'gameWindows', 'quickslot', 'actionButtons']) {
    if (s[k]) {
      let g = null;
      try { const p = s[k].toGlobal({ x: 0, y: 0 }); g = [Math.round(p.x), Math.round(p.y)]; } catch { }
      out[k] = { t: s[k].constructor?.name ?? '?', g, kids: (() => { try { return dump(s[k], 0); } catch (e) { return `err ${String(e).slice(0, 60)}`; } })() };
    }
  }
  out.sceneKeys = Object.keys(s).filter((k) => /tool|hud|menu|status|window|slot|button|pane/i.test(k));
  return out;
});
console.log(JSON.stringify(hud, null, 1).slice(0, 6000));
await browser.close();
