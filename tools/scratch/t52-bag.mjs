// T52 bag probe: bag entries, open inventory, dump rows + action buttons.
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
const tapFrac = async (fx, fy, waitMs = 1000) => {
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-bag', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tapFrac(398 / 1024, 400 / 768, 3000);
await tapFrac(62 / 1024, 261 / 768, 1500);
await tapFrac(0.166, 0.921, 6000);
const tapPt = (x, y, waitMs) => page.evaluate(([px, py, w]) => {
  const c = document.querySelector('canvas');
  const fire = (type) => c.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, clientX: px, clientY: py,
    pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
  }));
  fire('pointermove'); fire('pointerdown'); fire('pointerup');
  c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: px, clientY: py }));
  return new Promise((res) => setTimeout(() => res(true), w));
}, [x, y, waitMs]);
const rows = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const acc = [];
  const walk = (n, d) => {
    if (!n || d > 5) return;
    let g = null;
    try { const p = n.toGlobal({ x: (n.width ?? 0) / 2, y: (n.height ?? 0) / 2 }); g = [Math.round(p.x), Math.round(p.y)]; } catch { }
    const texts = [];
    try {
      const wt = (m, dd) => {
        if (!m || dd > 2) return;
        if (typeof m.text === 'string' && m.text.length > 0 && m.text.length < 90) texts.push(m.text);
        for (const k of (m.children ?? [])) wt(k, dd + 1);
      };
      wt(n, 0);
    } catch { }
    if (texts.length > 0 || (n.width > 60 && n.height > 10 && n.eventMode !== 'none')) {
      acc.push({ t: n.constructor?.name, w: Math.round(n.width ?? -1), h: Math.round(n.height ?? -1), g, mode: n.eventMode ?? null, texts: texts.slice(0, 3) });
    }
    for (const k of (n.children ?? [])) walk(k, d + 1);
  };
  const wins = (s.gameWindows?.children ?? []).filter((x) => x.content);
  const out = [];
  for (const w of wins) { out.push({ title: w.title ?? w.label ?? w.constructor?.name }); walk(w, 0); }
  const panel = s.inventoryPanel;
  const panelInfo = panel ? { visible: panel.visible, ctor: panel.constructor?.name } : null;
  if (panel && panel.visible) { out.push({ title: 'INVENTORY-PANEL' }); walk(panel, 0); }
  return { n: wins.length, titles: out.map((t) => t.title), panel: panelInfo, acc: acc.slice(0, 60) };
});
const bag = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const items = s.bag?.items ?? s.bag ?? null;
  if (!items) return { bagKeys: Object.keys(s).filter((k) => /bag|invent/i.test(k)) };
  const list = Array.isArray(items) ? items : [...(items.values?.() ?? [])];
  return list.map((e) => ({ id: e.id ?? e.kind ?? '?', name: e.name ?? null, q: e.quantity ?? null, ident: e.identified ?? null, verbs: e.verbs ?? null }));
});
// tap inventory toolbar button (index 5)
const invBtn = await page.evaluate(() => {
  const q = window.__MWG__.currentScene.actionBar?.row?.children?.[5];
  const p = q.toGlobal({ x: q.width / 2, y: q.height / 2 });
  return [p.x, p.y];
});
await tapPt(invBtn[0], invBtn[1], 1500);
const afterOpen = await rows();
import fs from 'node:fs';
fs.writeFileSync('tools/scratch/t52-logs/bag-probe.json', JSON.stringify({ bag, invBtn, afterOpen }, null, 1));
console.log('wrote tools/scratch/t52-logs/bag-probe.json');
await browser.close();
