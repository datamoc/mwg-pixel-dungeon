// T52 cross-class bot v2 (tools/scratch): same genuine-input design as t52-bot.mjs,
// with two fixes:
//  FIX1 (combat blindness): creatures carry NO `alignment` field in this port -
//    enemy status is the isHero/isAlly/isNPC flag triple (see combatResolution.ts
//    "hero/ally/NPC flags are its ALLY alignment"). The old
//    `c.alignment === 'ENEMY'` filter matched nothing, so the bot never attacked.
//  FIX2 (purity): the old `pickup()` called scene.pickupGroundItemAt directly,
//    bypassing the input path. actorTurnsHazards.ts picks up automatically on
//    every hero step, so walking is the genuine pickup - the direct call is gone.
//
// Usage: node tools/scratch/t52-bot2.mjs <seed> <classIndex 0-5> [maxActions]
// Logs:  tools/scratch/t52-logs/<seed>.jsonl
import { createRequire } from 'node:module';
import fs from 'node:fs';
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
const MAX_ACTIONS = Number(process.argv[4] ?? 1500);
const slots = [[62 / 1024, 261 / 768], [170 / 1024, 261 / 768], [278 / 1024, 261 / 768],
  [62 / 1024, 400 / 768], [170 / 1024, 400 / 768], [278 / 1024, 400 / 768]];
fs.mkdirSync('tools/scratch/t52-logs', { recursive: true });
const log = fs.createWriteStream(`tools/scratch/t52-logs/${seed}.jsonl`);
const say = (o) => { log.write(JSON.stringify(o) + '\n'); };

const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newContext({ viewport: { width: 1024, height: 768 } }).then((c) => c.newPage());
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

const tap = async (fx, fy, waitMs = 900) => {
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
const cellTap = async (cx, cy, waitMs = 900) => {
  const f = await page.evaluate(([x, y]) => {
    const s = window.__MWG__.currentScene;
    const g = s.map.toGlobal({ x: x * 16 + 8, y: y * 16 + 8 });
    return [g.x / 1024, g.y / 768];
  }, [cx, cy]);
  await tap(f[0], f[1], waitMs);
};
const read = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  if (!s || !s.hero || s.hero.x === undefined) return { scene: s?.constructor?.name ?? null, ok: false };
  const h = s.hero;
  let buffs = null;
  try { buffs = h.buffs ? Object.keys(h.buffs) : (Array.isArray(h.buffList) ? h.buffList.map((b) => b.kind ?? b.name) : null); } catch { buffs = 'err'; }
  const vis = (x, y) => { try { return s.fov.isVisible(x, y); } catch { return true; } };
  // FIX1: flag-triple enemy test, no `alignment` field exists on creatures.
  const all = [...(s.creatures?.values?.() ?? s.creatures ?? [])];
  const mobs = all
    .filter((c) => c !== h && !c.isHero && !c.isAlly && !c.isNPC && c.hp > 0 && vis(c.x, c.y))
    .map((c) => ({ kind: c.kind ?? null, x: c.x, y: c.y, hp: c.hp, sleeping: !!c.sleeping }));
  let potions = 0, foodCount = 0, waterskin = 0, hunger = 0, gasTotal = 0, gasHere = 0, logLines = [];
  try {
    const blocks = s.gameLog?.blocks ?? [];
    logLines = blocks.slice(-3).map((b) => { try { return b.label?.text ?? b.text ?? null; } catch { return null; } }).filter(Boolean);
  } catch { }
  try {
    const items = s.bag?.items ?? [];
    for (const e of items) {
      if (e.id?.startsWith('potion') && e.quantity > 0) potions += e.quantity;
      if ((e.id === 'food' || e.id === 'smallRation' || e.id === 'meat' || e.id === 'berry' || e.id === 'meatPie' || e.id === 'phantomMeat' || e.id === 'frozenCarpaccio' || e.id === 'pasty') && e.quantity > 0) foodCount += e.quantity;
    }
    waterskin = s.waterskin ?? 0;
    hunger = typeof s.hunger === 'number' ? s.hunger : 0;
    gasTotal = s.toxicGas?.total?.() ?? 0;
    gasHere = s.toxicGas?.volumeAt?.(h.x, h.y) ?? 0;
  } catch { }
  return {
    ok: true, scene: s.constructor.name, hero: { x: h.x, y: h.y, hp: h.hp, maxHp: h.maxHp, buffs },
    potions, foodCount, waterskin, hunger, gasTotal, gasHere, logLines,
    stairsPos: s.hasStairs && s.stairs ? [s.stairs.x, s.stairs.y] : null,
    nc: all.length,
    level: s.progression?.level, depth: s.depth, branch: s.branch ?? null,
    gameOver: !!s.gameOver, awaiting: !!s.awaitingInput, travel: !!s.travelTarget,
    windows: !s.gameWindows?.isEmpty, mobs,
    stairs: s.hasStairs && s.stairs ? { x: s.stairs.x, y: s.stairs.y } : null,
    victory: !!s.victory || !!s.gameWon || undefined,
  };
});
const readMenu = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const stack = s.gameWindows;
  const windows = stack.children.filter((c) => c.content);
  const win = windows[windows.length - 1];
  if (!win) return { title: null, options: [] };
  const content = win.content;
  const texts = [];
  try {
    const walk = (n, d) => {
      if (!n || d > 4) return;
      if (typeof n.text === 'string' && n.text.length > 0 && n.text.length < 120) texts.push(n.text.slice(0, 90));
      for (const k of (n.children ?? [])) walk(k, d + 1);
    };
    walk(win, 0);
  } catch { }
  // every candidate button with its label: the bot must be able to pick
  // "Non" on the chasm-jump confirm, not just the first wide button.
  const btns = [];
  try {
    const walkB = (n, d) => {
      if (!n || d > 5) return;
      if (typeof n.width === 'number' && typeof n.height === 'number' && n.width > 40 && n.height > 8 && n.visible !== false && n.eventMode !== 'none') {
        const t = [];
        try {
          const wt = (m, dd) => {
            if (!m || dd > 2) return;
            if (typeof m.text === 'string' && m.text.length > 0 && m.text.length < 90) t.push(m.text);
            for (const k of (m.children ?? [])) wt(k, dd + 1);
          };
          wt(n, 0);
        } catch { }
        let g = null;
        try { const p = n.toGlobal({ x: n.width / 2, y: n.height / 2 }); g = [p.x, p.y]; } catch { }
        if (g) btns.push({ x: g.x, y: g.y, label: t.join(' ').slice(0, 80) });
      }
      for (const k of (n.children ?? [])) walkB(k, d + 1);
    };
    walkB(win, 0);
  } catch { }
  const centre = (b) => ({ x: win.x + content.x + b.x + b.width / 2, y: win.y + content.y + b.y + b.height / 2 });
  const wide = (content?.children ?? []).filter((c) => typeof c?.width === 'number' && c.width > 100).map(centre);
  return { title: win.title ?? win.label ?? null, ctor: win.constructor?.name ?? null, texts: texts.slice(0, 6), options: wide, btns };
});
const clickStagePoint = async (p) => {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointermove', opts));
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
  }, [p.x, p.y]);
  await page.waitForTimeout(900);
  return true;
};
// Dialog buttons from readMenu carry screen (toGlobal) coords: tap directly.
const clickScreenPoint = async (p) => {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('canvas');
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointermove', opts));
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
  }, [p.x, p.y]);
  await page.waitForTimeout(900);
  return true;
};
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const key = (d, x, y) => `${d}:${x},${y}`;
// Genuine toolbar tap: button centres come from the live layout (indices in
// toolbar.ts row order: 0 more, 1 read, 2 quaff, 3 eat, 4 special,
// 5 inventory, 6 search, 7 wait).
const toolbarTap = async (index, waitMs = 900) => {
  const p = await page.evaluate((i) => {
    const b = window.__MWG__.currentScene.actionBar?.row?.children?.[i];
    if (!b) return null;
    const g = b.toGlobal({ x: b.width / 2, y: b.height / 2 });
    return [g.x, g.y];
  }, index);
  if (!p) return false;
  await page.evaluate(([px, py]) => {
    const c = document.querySelector('canvas');
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: px, clientY: py, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointermove', opts));
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
  }, p);
  await page.waitForTimeout(waitMs);
  return true;
};

// ---- boot + class select + start (pilot-proven)
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + `?seed=${seed}`, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(slots[classIndex][0], slots[classIndex][1], 1500);
await tap(0.166, 0.921, 6000);

// Visible-hazard blob keys (gas/fire render on screen: reading their volumes
// is observation, not a wallhack). Hidden traps stay unread - never trapKinds.
const VOLS = ['toxicGas', 'fire', 'paralyticGas', 'stenchGas', 'corrosiveGas'];
const visited = new Set();
const avoid = new Set();
const crumbs = [];
let lastPos = '', stuck = 0, actions = 0, outcome = 'unfinished';
let lastDest = '', destFails = 0, prevHp = null, lastTrapAction = -99;
let exploreRadius = 9, stairsFails = 0, stairsCooldownUntil = 0, lastDepth = null;
say({ ev: 'start', seed, classIndex });
while (actions < MAX_ACTIONS) {
  const st = await read();
  if (!st.ok) { await page.waitForTimeout(1000); continue; }
  if (actions % 5 === 0 || st.windows) say({ ev: 'turn', n: actions, d: st.depth, h: [st.hero.x, st.hero.y, st.hero.hp], b: st.hero.buffs, mobs: st.mobs.map((m) => m.kind), nc: st.nc, win: st.windows, pot: st.potions, ws: st.waterskin, hu: Math.round(st.hunger), gas: [st.gasTotal, st.gasHere], st: st.stairsPos });
  if (prevHp !== null && st.hero.hp < prevHp) say({ ev: 'dmg', n: actions, dhp: prevHp - st.hero.hp, hp: st.hero.hp, lines: st.logLines });
  prevHp = st.hero.hp;
  // trap-gallery rule: recent dart/trap hits mean standing in a trap's line
  // of sight - never spend turns in place (rest/search/wait), keep moving.
  const trapHit = (st.logLines ?? []).some((l) => /fléchette|dart|piège|piege|trap|glyph|explos/i.test(l));
  if (trapHit) lastTrapAction = actions;
  const danger = actions - lastTrapAction <= 3;
  if (lastDepth !== null && st.depth !== lastDepth) {
    say({ ev: 'depth', from: lastDepth, to: st.depth, n: actions });
    stairsFails = 0; stairsCooldownUntil = 0; exploreRadius = 9;
    avoid.clear(); crumbs.length = 0;
  }
  lastDepth = st.depth;
  if (st.victory) { outcome = 'VICTORY'; break; }
  if (st.gameOver) { outcome = `gameover depth=${st.depth} hp=${st.hero.hp}`; break; }
  if (st.windows) {
    const m = await readMenu();
    say({ ev: 'window', title: m.title, ctor: m.ctor, texts: m.texts, options: m.options.length, btns: (m.btns ?? []).map((b) => b.label) });
    const blob = [...(m.texts ?? []), ...((m.btns ?? []).map((b) => b.label))].join(' | ');
    // chasm-jump confirm: never jump (a cautious player cancels).
    if (/gouffre|chasm|chute de cette hauteur|painful fall/i.test(blob)) {
      const no = (m.btns ?? []).find((b) => /non|changé|changed|cancel|never mind/i.test(b.label));
      if (no && await clickScreenPoint(no)) say({ ev: 'act', a: 'chasm-no' });
      else if (m.options.length > 0 && await clickStagePoint(m.options[0])) say({ ev: 'act', a: 'window-fallback' });
      else await tap(0.5, 0.5, 500);
      actions++;
      continue;
    }
    if (m.options.length > 0 && await clickStagePoint(m.options[0])) { actions++; continue; }
    const labeled = (m.btns ?? []).find((b) => b.label && b.label.length > 0);
    if (labeled && await clickScreenPoint(labeled)) { say({ ev: 'act', a: 'window-labeled', t: labeled.label }); actions++; continue; }
    await tap(0.5, 0.5, 500);
    actions++;
    continue;
  }
  if (!st.awaiting && !st.travel) { await page.waitForTimeout(500); continue; }
  const pos = key(st.depth, st.hero.x, st.hero.y);
  if (pos === lastPos) stuck++; else { stuck = 0; lastPos = pos; }
  if (stuck > 25) { outcome = `stuck at ${pos}`; break; }
  visited.add(pos);
  const lastCrumb = crumbs[crumbs.length - 1];
  if (!lastCrumb || lastCrumb[0] !== st.hero.x || lastCrumb[1] !== st.hero.y || lastCrumb[2] !== st.depth) {
    crumbs.push([st.hero.x, st.hero.y, st.depth]);
    if (crumbs.length > 300) crumbs.splice(0, crumbs.length - 300);
  }
  const adj = st.mobs.filter((m) => cheb(m, st.hero) === 1);
  if (adj.length > 0) {
    const t = adj[0];
    const before = [st.hero.x, st.hero.y, st.hero.hp];
    await cellTap(t.x, t.y, 700);
    const after = await page.evaluate(() => {
      const s = window.__MWG__.currentScene;
      return { hero: [s.hero.x, s.hero.y, s.hero.hp] };
    });
    say({ ev: 'act', a: 'attack', t: t.kind, at: [t.x, t.y], dhp: after.hero[2] - before[2], moved: after.hero[0] !== before[0] || after.hero[1] !== before[1] });
    actions++;
    continue;
  }
  // Survival taps (same handlers as the Q/E keyboard hotkeys): quaff when
  // damaged badly or under a DoT with something to drink; eat when hungry.
  const dots = (st.hero.buffs ?? []).filter((b) => /poison|burn|bleed|ooze|toxic/i.test(b));
  if ((dots.length > 0 || st.hero.hp < st.hero.maxHp * 0.45) && (st.potions > 0 || st.waterskin > 0)) {
    await toolbarTap(2, 900);
    say({ ev: 'act', a: 'quaff', dots, hp: st.hero.hp, pot: st.potions, ws: st.waterskin });
    actions++;
    continue;
  }
  if (dots.length > 0) {
    // dotted: descend the hazard gradient (volumes render on screen, so this
    // is seeing the gas, not a wallhack). Only move on strictly-less volume;
    // a zero-volume cell with a residual poison clock falls through to rest.
    const esc = await page.evaluate(([hx, hy, vols]) => {
      const s = window.__MWG__.currentScene;
      const vol = (x, y) => {
        let m = 0;
        for (const k of vols) {
          try { const b = s[k]; if (b && b.volumeAt) m = Math.max(m, b.volumeAt(x, y) ?? 0); } catch { }
        }
        return m;
      };
      const here = vol(hx, hy);
      let best = null, bv = here;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const c = { x: hx + ox, y: hy + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        try { if (!s.level.passable(c.x, c.y) || s.creatureAt(c.x, c.y)) continue; } catch { continue; }
        try { if (s.isChasmCell(c.x, c.y)) continue; } catch { }
        const v = vol(c.x, c.y);
        if (v < bv) { bv = v; best = c; }
      }
      return best;
    }, [st.hero.x, st.hero.y, VOLS]);
    if (esc) {
      await cellTap(esc.x, esc.y, 700);
      say({ ev: 'act', a: 'escape', t: [esc.x, esc.y] });
      actions++;
      continue;
    }
    // no downhill: backtrack along breadcrumbs, then an unvisited step.
    let back = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
    if (back && back[2] !== st.depth) { crumbs.length = 0; back = null; }
    else if (back) crumbs.pop();
    const backOk = back ? await page.evaluate(([x, y, vols]) => {
      const s = window.__MWG__.currentScene;
      try {
        if (!s.level.inside(x, y) || !s.level.passable(x, y) || s.creatureAt(x, y)) return false;
        try { if (s.isChasmCell(x, y)) return false; } catch { }
        for (const k of vols) {
          try { const b = s[k]; if (b && b.volumeAt && b.volumeAt(x, y) > 0) return false; } catch { }
        }
        return true;
      } catch { return false; }
    }, [back[0], back[1], VOLS]) : false;
    if (back && backOk && (back[0] !== st.hero.x || back[1] !== st.hero.y)) {
      await cellTap(back[0], back[1], 700);
      say({ ev: 'act', a: 'backtrack', t: back });
      actions++;
      continue;
    }
    const step = await page.evaluate(([hx, hy, depth, known, vols]) => {
      const s = window.__MWG__.currentScene;
      const bad = (x, y) => {
        for (const k of vols) {
          try { const b = s[k]; if (b && b.volumeAt && b.volumeAt(x, y) > 0) return true; } catch { }
        }
        return false;
      };
      let fallback = null;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const c = { x: hx + ox, y: hy + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        if (known.includes(`${depth}:${c.x},${c.y}`)) continue;
        try { if (!s.level.passable(c.x, c.y) || s.creatureAt(c.x, c.y)) continue; } catch { continue; }
        try { if (s.isChasmCell(c.x, c.y)) continue; } catch { }
        if (bad(c.x, c.y)) { fallback ??= c; continue; }
        return c;
      }
      return fallback;
    }, [st.hero.x, st.hero.y, st.depth, [...visited].slice(-200), VOLS]);
    if (step) { await cellTap(step.x, step.y, 700); say({ ev: 'act', a: 'gasp', t: [step.x, step.y] }); actions++; continue; }
  }
  // rest on an active heal-over-time: wait while hurt with healing pending,
  // but never in a trap gallery (darts punish loitering).
  if (st.hero.hp < st.hero.maxHp && adj.length === 0 && !danger) {
    const healing = await page.evaluate(() => {
      const s = window.__MWG__.currentScene;
      try { return s.healingLeft ?? 0; } catch { return 0; }
    });
    if (healing > 0) {
      await cellTap(st.hero.x, st.hero.y, 500);
      say({ ev: 'act', a: 'rest', hl: Math.round(healing), hp: st.hero.hp });
      actions++;
      continue;
    }
  }
  if (st.hunger >= 300 && st.foodCount > 0) {
    await toolbarTap(3, 900);
    say({ ev: 'act', a: 'eat', hunger: st.hunger, food: st.foodCount });
    actions++;
    continue;
  }
  if (actions % 12 === 0 && adj.length === 0 && !danger) {
    await toolbarTap(6, 600);
    say({ ev: 'act', a: 'search' });
    actions++;
    continue;
  }
  const near = st.mobs.filter((m) => cheb(m, st.hero) <= 4);
  if (st.hero.hp < st.hero.maxHp * 0.45 && near.length > 0) {
    // flee: step to the adjacent cell farthest from the nearest enemy
    const away = await page.evaluate(([hx, hy, ex, ey]) => {
      const s = window.__MWG__.currentScene;
      let best = null, bd = -1;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const c = { x: hx + ox, y: hy + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        try { if (!s.level.passable(c.x, c.y) || s.creatureAt(c.x, c.y)) continue; } catch { continue; }
        try { if (s.isChasmCell(c.x, c.y)) continue; } catch { }
        const p = s.pathfinder.find({ x: hx, y: hy }, c, {});
        if (!p) continue;
        const d = Math.max(Math.abs(c.x - ex), Math.abs(c.y - ey));
        if (d > bd) { bd = d; best = c; }
      }
      return best;
    }, [st.hero.x, st.hero.y, near[0].x, near[0].y]);
    if (away) { await cellTap(away.x, away.y, 700); say({ ev: 'act', a: 'flee' }); }
    else await cellTap(st.hero.x, st.hero.y, 700); // wait
    actions++;
    continue;
  }
  // FIX2: no direct pickup call - stepping onto a heap auto-picks-up in-game,
  // so exploration below is the genuine pickup path.
  // (stairs re-entry is handled at the tostairs branch below: step off, step on)
  // explore: nearest unvisited WALKABLE cell within radius 9, else stairs, else wait.
  // The framework pathfinder returns a truthy degenerate path even for wall
  // cells (proven by t52-refused probe), so walkability MUST be gated on
  // level.passable + unoccupied - never on pathfinder truthiness alone.
  const dest = await page.evaluate(([hx, hy, depth, known, avoid, vols, radius]) => {
    const s = window.__MWG__.currentScene;
    const R = radius;
    const bad = (x, y) => {
      for (const k of vols) {
        try { const b = s[k]; if (b && b.volumeAt && b.volumeAt(x, y) > 0) return true; } catch { }
      }
      return false;
    };
    let best = null, bd = 1e9;
    for (let pass = 0; pass < 2 && !best; pass++) {
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const c = { x: hx + dx, y: hy + dy };
        if (!s.level.inside(c.x, c.y) || (dx === 0 && dy === 0)) continue;
        if (known.includes(`${depth}:${c.x},${c.y}`)) continue;
        if (avoid.includes(`${depth}:${c.x},${c.y}`)) continue;
        let ok = false;
        try { ok = s.level.passable(c.x, c.y) && !s.creatureAt(c.x, c.y) && !s.isChasmCell(c.x, c.y); } catch { continue; }
        if (!ok) continue;
        // a human cannot tap what the camera does not show - skip off-screen cells
        try {
          const g = s.map.toGlobal({ x: c.x * 16 + 8, y: c.y * 16 + 8 });
          if (g.x < 0 || g.y < 0 || g.x > 1024 || g.y > 768) continue;
        } catch { continue; }
        if (pass === 0 && bad(c.x, c.y)) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        if (d >= bd) continue;
        try {
          const p = s.pathfinder.find({ x: hx, y: hy }, c, {});
          if (p && p.length > 0) { bd = d; best = c; }
        } catch { /* unreachable */ }
      }
    }
    return best;
  }, [st.hero.x, st.hero.y, st.depth, [...visited].slice(-4000), [...avoid], VOLS, exploreRadius]);
  if (!dest) {
    if (exploreRadius < 20) { exploreRadius += 5; say({ ev: 'expand', r: exploreRadius }); }
  } else if (exploreRadius !== 9) exploreRadius = 9;
  if (dest) {
    // walk it in full via travel: tap once, let the game walk
    await cellTap(dest.x, dest.y, 400);
    say({ ev: 'act', a: 'travel', t: [dest.x, dest.y] });
    // wait for arrival or interrupt (bounded), with stall detection: no
    // position change across 5 reads means the tap went nowhere (wall/door).
    let stall = 0, lx = -1, ly = -1;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(400);
      const s2 = await read();
      if (!s2.ok || s2.windows || s2.gameOver || s2.victory) break;
      if (s2.hero.x === dest.x && s2.hero.y === dest.y) break;
      if (s2.mobs.some((m) => cheb(m, s2.hero) <= 1)) break;
      if (s2.hero.hp < st.hero.hp) break;
      if (s2.hero.x === lx && s2.hero.y === ly) { if (++stall >= 5) break; } else { stall = 0; lx = s2.hero.x; ly = s2.hero.y; }
    }
    const dk = `${st.depth}:${dest.x},${dest.y}`;
    if (dk === lastDest) {
      destFails++;
      if (destFails >= 3) {
        // trace-on-avoid: instrument one more tap to separate delivery failure
        // (map never gets pointerdown) from game refusal (handle runs, no move)
        const trace = await page.evaluate(([x, y]) => {
          const s = window.__MWG__.currentScene;
          let downs = 0;
          const cnt = () => downs++;
          s.map.on('pointerdown', cnt);
          const calls = [];
          const origH = s.handleMapPointer.bind(s);
          s.handleMapPointer = function (sx, sy) {
            calls.push([Math.round(sx), Math.round(sy), this.awaitingInput]);
            const r = origH(sx, sy);
            calls.push(['after', this.hero.x, this.hero.y, !!this.travelTarget]);
            return r;
          };
          const g = s.map.toGlobal({ x: x * 16 + 8, y: y * 16 + 8 });
          const c = document.querySelector('canvas');
          const r = c.getBoundingClientRect();
          const cx = r.x + r.width * (g.x / 1024), cy = r.y + r.height * (g.y / 768);
          const fire = (type) => c.dispatchEvent(new PointerEvent(type, {
            bubbles: true, cancelable: true, composed: true, clientX: cx, clientY: cy,
            pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
          }));
          const before = [s.hero.x, s.hero.y];
          fire('pointermove'); fire('pointerdown');
          const syncTravel = !!s.travelTarget;
          fire('pointerup');
          s.map.off('pointerdown', cnt);
          s.handleMapPointer = origH;
          // scene-graph audit: which interactive objects cover the tap point?
          const covering = [];
          try {
            const root = s.stage ?? null;
            const walk2 = (n, depth) => {
              if (!n || depth > 8 || covering.length >= 12) return;
              let bounds = null;
              try { if (typeof n.getBounds === 'function') bounds = n.getBounds(); } catch { }
              const mode = n.eventMode ?? null;
              if (bounds && mode && mode !== 'none' && cx >= bounds.x && cx <= bounds.x + bounds.width && cy >= bounds.y && cy <= bounds.y + bounds.height) {
                let nl = -1;
                try { nl = typeof n.listenerCount === 'function' ? n.listenerCount('pointerdown') : (n._events?.pointerdown?.length ?? -1); } catch { }
                covering.push({ ctor: n.constructor?.name ?? '?', mode, b: [Math.round(bounds.x), Math.round(bounds.y), Math.round(bounds.width), Math.round(bounds.height)], listeners: nl, vis: n.visible !== false });
              }
              for (const k of (n.children ?? [])) walk2(k, depth + 1);
            };
            walk2(root, 0);
          } catch { }
          return { before, after: [s.hero.x, s.hero.y], downs, calls, syncTravel, client: [Math.round(cx), Math.round(cy)], rect: [r.x, r.y, Math.round(r.width), Math.round(r.height)], covering };
        }, [dest.x, dest.y]);
        say({ ev: 'trace', cell: dk, trace });
        avoid.add(dk);
        const diag = await page.evaluate(([x, y]) => {
          const s = window.__MWG__.currentScene;
          const o = s.creatureAt(x, y);
          let scr = null;
          try { const g = s.map.toGlobal({ x: x * 16 + 8, y: y * 16 + 8 }); scr = [Math.round(g.x), Math.round(g.y)]; } catch { }
          const cell = (() => { try { return s.level.index(x, y); } catch { return -1; } })();
          const vols = {};
          for (const k of ['toxicGas', 'fire', 'paralyticGas', 'stenchGas', 'corrosiveGas', 'web', 'electricity', 'blizzard', 'smokeScreen']) {
            try { const v = s[k]?.volumeAt?.(x, y) ?? 0; if (v > 0) vols[k] = v; } catch { }
          }
          return {
            pass: (() => { try { return s.level.passable(x, y); } catch { return 'err'; } })(),
            terr: (() => { try { return s.level.terrain[cell]; } catch { return 'err'; } })(),
            occ: o ? { k: o.kind ?? null, ally: !!o.isAlly, npc: !!o.isNPC, sleep: !!o.sleeping, hp: o.hp } : null,
            hero: [s.hero.x, s.hero.y],
            scr,
            feat: (() => { try { return s.portedFeatures?.kindAt?.(cell) ?? null; } catch { return 'err'; } })(),
            well: (() => { try { return s.portedWellWater?.has?.(cell) ?? s.portedWellWater?.get?.(cell) ?? null; } catch { return 'err'; } })(),
            door: (() => { try { return s.doors?.isDoor?.(x, y) ? (s.doors?.isOpen?.(x, y) ? 'open' : 'closed') : null; } catch { return 'err'; } })(),
            secret: (() => { try { return s.secrets?.isSecret?.(x, y) ?? null; } catch { return 'err'; } })(),
            heap: (() => { try { return !!s.groundItemAt?.(x, y); } catch { return 'err'; } })(),
            vols,
            awaiting: s.awaitingInput,
          };
        }, [dest.x, dest.y]);
        say({ ev: 'avoid', cell: dk, diag });
        destFails = 0;
      }
    }
    else { lastDest = dk; destFails = 0; }
    actions++;
    continue;
  }
  if (st.stairs && actions >= stairsCooldownUntil) {
    if (st.hero.x === st.stairs.x && st.hero.y === st.stairs.y) {
      // descending fires on ENTERING the stairs cell: step off, then back on.
      const off = await page.evaluate(([hx, hy]) => {
        const s = window.__MWG__.currentScene;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const c = { x: hx + ox, y: hy + oy };
          if (!s.level.inside(c.x, c.y)) continue;
          try { if (!s.level.passable(c.x, c.y) || s.creatureAt(c.x, c.y)) continue; } catch { continue; }
        try { if (s.isChasmCell(c.x, c.y)) continue; } catch { }
          return c;
        }
        return null;
      }, [st.hero.x, st.hero.y]);
      if (off) { await cellTap(off.x, off.y, 600); say({ ev: 'act', a: 'stepoff', t: [off.x, off.y] }); actions++; continue; }
    } else {
      await cellTap(st.stairs.x, st.stairs.y, 600);
      say({ ev: 'act', a: 'tostairs' });
      if (++stairsFails >= 5) {
        stairsFails = 0;
        stairsCooldownUntil = actions + 40;
        say({ ev: 'stairsCooldown' });
      }
      actions++;
      continue;
    }
  }
  // no walkable dest and no stairs: try opening an adjacent closed door (terrain 7)
  const door = await page.evaluate(([hx, hy]) => {
    const s = window.__MWG__.currentScene;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = { x: hx + ox, y: hy + oy };
      if (!s.level.inside(c.x, c.y)) continue;
      try { if (s.level.terrain[s.level.index(c.x, c.y)] === 7) return c; } catch { }
    }
    return null;
  }, [st.hero.x, st.hero.y]);
  if (door) { await cellTap(door.x, door.y, 600); say({ ev: 'act', a: 'open', t: [door.x, door.y] }); actions++; continue; }
  if (danger) {
    // in a trap gallery with nowhere good to go: step anywhere walkable
    // (even visited) rather than wait in the line of sight.
    const any = await page.evaluate(([hx, hy]) => {
      const s = window.__MWG__.currentScene;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const c = { x: hx + ox, y: hy + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        try { if (!s.level.passable(c.x, c.y) || s.creatureAt(c.x, c.y)) continue; } catch { continue; }
        try { if (s.isChasmCell(c.x, c.y)) continue; } catch { }
        return c;
      }
      return null;
    }, [st.hero.x, st.hero.y]);
    if (any) { await cellTap(any.x, any.y, 600); say({ ev: 'act', a: 'dodge', t: [any.x, any.y] }); actions++; continue; }
  }
  await cellTap(st.hero.x, st.hero.y, 600); // wait a turn
  say({ ev: 'act', a: 'wait' });
  actions++;
}
say({ ev: 'end', outcome, actions, problems: problems.slice(0, 5) });
console.log(JSON.stringify({ seed, outcome, actions, problems: problems.slice(0, 3) }));
await browser.close();
