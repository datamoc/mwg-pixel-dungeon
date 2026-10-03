// T52 pilot harness (tools/scratch): boots the built game, starts a Warrior run
// through the real title -> class-select -> start taps (no scene-state cheats),
// then dumps the live dungeon shape the bot policy will read every turn.
//
// Run after `npm run build`, from the repo root:
//   node tools/scratch/t52-pilot.mjs [seed] [classIndex0-5]
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(
  process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
  'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');

const seed = process.argv[2] ?? 't52-warrior-1';
const classIndex = Number(process.argv[3] ?? 0);
// Class slots on the 1024x768 stage (row-major, 3 per row): fractions measured
// from the class-select screenshot.
const slots = [[62 / 1024, 261 / 768], [170 / 1024, 261 / 768], [278 / 1024, 261 / 768],
  [62 / 1024, 400 / 768], [170 / 1024, 400 / 768], [278 / 1024, 400 / 768]];

const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

const tap = async (fx, fy, waitMs = 1500) => {
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + `?seed=${seed}`, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000); // title -> class select
await tap(slots[classIndex][0], slots[classIndex][1], 1500); // pick class slot
await tap(0.166, 0.921, 6000); // start button
await page.screenshot({ path: `C:/tmp/t52-${seed}.png` });

const dump = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const out = { scene: s?.constructor?.name, hero: null, mobs: null, proto: [] };
  if (!s || !s.hero) return out;
  const h = s.hero;
  out.hero = { x: h.x, y: h.y, hp: h.hp, maxHp: h.maxHp, lvl: h.lvl, exp: h.exp, heroClass: s.heroClass, depth: s.depth, branch: s.branch };
  const mobs = [...(s.creatures?.values?.() ?? [])].filter((c) => !c.isHero && !c.isAlly && !c.isNPC);
  out.mobs = { count: mobs.length, sample: mobs.slice(0, 5).map((m) => ({ kind: m.kind, x: m.x, y: m.y, hp: m.hp })) };
  out.stairs = s.stairs ?? s.exitStairs ?? null;
  out.proto = Object.getOwnPropertyNames(Object.getPrototypeOf(s)).filter((n) => /attack|move|descend|pickup|search|rest|descend|enter|open|use|drink|equip/i.test(n)).slice(0, 60);
  return out;
});
console.log(JSON.stringify(dump, null, 1).slice(0, 3000));
console.log('PROBLEMS:', JSON.stringify(problems.slice(0, 5)));
await browser.close();
