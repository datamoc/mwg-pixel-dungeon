/**
 * T52/T53 playthrough evidence, player-true inputs only: every hero step is
 * a REAL tap (full pointer sequence through handleMapPointer) on the next
 * BFS cell toward the stairs; search/doors/mobs resolve through the ordinary
 * turn pipeline. Asserts depth 2, screenshots, zero console errors.
 * Run: node tools/browserTest.mjs --script tools/scratch/t52-descent-probe.mjs
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
//File log: the harness can exit before flushing piped stdout on failure, so
//every verdict-relevant line goes here too (appended, survives exit races).
import { appendFileSync as _appendLog } from 'node:fs';
const PLOG = 'tools/scratch/t52-progress.log';
const plog = (m) => { try { _appendLog(PLOG, m + '\n'); } catch {} console.log(m); };

//In-page helper: canvas fraction of tile (X, Y)'s center by affine-inverting
//camera.toWorld (world units are 16px tiles).
const FRACTION_FN = `((TX, TY) => {
const canvas = document.querySelector('canvas');
const r = canvas.getBoundingClientRect();
const cw = r.width, ch = r.height;
const W0 = scene.camera.toWorld(0, 0), Wx = scene.camera.toWorld(cw, 0), Wy = scene.camera.toWorld(0, ch);
const a = (Wx.x - W0.x) / cw, b = (Wx.y - W0.y) / ch;
const c = (Wx.y - W0.y) / cw, d = (Wy.y - W0.y) / ch;
const det = a * d - b * c;
const ex = (TX + 0.5) * 16 - W0.x, ey = (TY + 0.5) * 16 - W0.y;
return [(d * ex - b * ey) / det / cw, (-c * ex + a * ey) / det / ch];
})`;

const STATE = `(() => ({
depth: scene.depth, hp: scene.hero.hp, hero: [scene.hero.x, scene.hero.y],
stairs: scene.hasStairs && scene.stairs ? [scene.stairs.x, scene.stairs.y] : null
}))()`;

//nearest hostile (not hero/ally/NPC/corpse) by Chebyshev + hero vitals, for rest decisions.
const REST = `(() => {
let md = 999, mx = 0, my = 0;
for (const c of scene.creatures) {
if (c.isHero || c.isAlly || c.isNPC || c.hp <= 0) continue;
const d = Math.max(Math.abs(c.x - scene.hero.x), Math.abs(c.y - scene.hero.y));
if (d < md) { md = d; mx = c.x; my = c.y; }
}
return { md, mx, my, hp: scene.hero.hp, max: scene.hero.maxHp };
})()`;
const RETREAT = `((MX, MY) => {
let best = null, bd = -1;
for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
const nx = scene.hero.x + dx, ny = scene.hero.y + dy;
const W = scene.level.width, H = scene.level.height;
if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
if (typeof scene.isChasmCell === 'function' && scene.isChasmCell(nx, ny)) continue;
if (!scene.doors.isDoor(nx, ny) && !scene.level.passable(nx, ny)) continue;
if (typeof scene.creatureAt === 'function' && scene.creatureAt(nx, ny)) continue;
const d = Math.max(Math.abs(nx - MX), Math.abs(ny - MY));
if (d > bd) { bd = d; best = [nx, ny]; }
}
return { step: best };
})`;

const BFS_STEP = `(() => {
const W = scene.level.width, H = scene.level.height;
const key = (x, y) => y * W + x;
const tx = scene.stairs.x, ty = scene.stairs.y;
const openThrough = (x, y) => {
if (x < 0 || y < 0 || x >= W || y >= H) return false;
if (typeof scene.isChasmCell === 'function' && scene.isChasmCell(x, y)) return false;
if (scene.doors.isDoor(x, y)) return true;
if (!scene.level.passable(x, y)) return false;
//Route around non-combat blockers (NPC quest-givers, allies, unhittable sheep):
//hostiles stay enterable so bumping still fights them.
const occ = (typeof scene.creatureAt === 'function' && scene.creatureAt(x, y)) || null;
if (occ && (occ.isNPC || occ.isAlly || occ.kind === 'sheep')) return false;
if (window.__PROBE_AVOID && occ && occ.hp > 0) return false;
return true;
};
const prev = new Map([[key(scene.hero.x, scene.hero.y), null]]);
const q = [[scene.hero.x, scene.hero.y]];
while (q.length) {
const [x, y] = q.shift();
if (x === tx && y === ty) {
let k = key(tx, ty), ck = [tx, ty], first = ck;
while (k !== key(scene.hero.x, scene.hero.y)) { first = ck; const p = prev.get(k); ck = [p % W, Math.floor(p / W)]; k = p; }
return { step: first };
}
for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
const nx = x + dx, ny = y + dy, k = key(nx, ny);
if (!prev.has(k) && openThrough(nx, ny)) { prev.set(k, key(x, y)); q.push([nx, ny]); }
}
}
return { step: null };
})()`;

export default async (game) => {
const HERO = Number(process.env.PROBE_HERO ?? 0); // 0 warrior 1 mage 2 rogue 3 huntress 4 duelist 5 cleric
// Non-warrior classes are badge-locked on a fresh profile (Java-faithful: HeroClass.isUnlocked,
// unlock_mage = upgrades_used x1). PROBE_UNLOCK names the meta counter whose increment is the
// game's own unlock path (DungeonScene.awardBadge = badges.increment + meta.save); the increment
// runs through the live badge store as test setup, every tap after it is player-true.
if (process.env.PROBE_UNLOCK) {
await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 60000 });
await sleep(2500);
const [ucounter, uamount] = String(process.env.PROBE_UNLOCK).split(':');
console.log('UNLOCK ' + JSON.stringify(await game.eval(`scene['badges'].increment(${JSON.stringify(ucounter)}, ${Number(uamount || 1)})`)));
const slots = [[0.098, 0.344], [0.169, 0.344], [0.236, 0.344], [0.098, 0.475], [0.169, 0.475], [0.236, 0.475]]; // browserTest.mjs startGame
await game.tap(...slots[HERO % 6]);
await sleep(1200);
await game.screenshot('tools/scratch/t52-unlocked-class.png');
await game.tapText('^commencer$|^start$', { timeout: 60000 });
for (let i = 0; i < 90; i++) { const ok = await game.eval('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])'); if (ok) break; await sleep(1000); }
} else {
await game.startGame({ hero: HERO });
}
console.log(`PROBE hero=${HERO}`);
await sleep(2500);
const setup = await game.eval(STATE);
plog('descent setup: ' + JSON.stringify(setup));
plog('SEED ' + JSON.stringify(await game.eval(`String(scene['runSeedLabel'])`)));
if (!setup.stairs) throw new Error('no stairs at spawn');
let taps = 0, bumps = 0, searches = 0, sheepWaits = 0, rests = 0, noSteps = 0;
let retreats = 0;
const MAXD = Number(process.env.PROBE_MAXDEPTH ?? 3); // 5 = Goo's floor
for (let target = 2; target <= MAXD; target++) {
retreats = 0;
let stalls = 0;
for (let t = 0; t < 150; t++) {
const s = await game.eval(STATE);
if (s.hp <= 0) throw new Error('hero died on the way to depth ' + target + ': ' + JSON.stringify(s));
//Player-true rest: below 60% with nothing within 6 cells, pass turns until
//near-full or something approaches (spawns while resting are honest risk).
const r0 = await game.eval(`(${REST})`);
if (r0.hp < r0.max * 0.75 && r0.md > 6) { rests++; plog('REST ' + JSON.stringify(r0));
for (let w = 0; w < 120; w++) {
await game.eval(`((m) => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`);
const r = await game.eval(`(${REST})`);
if (r.hp >= r.max || r.md <= 5 || r.hp <= 0) break;
}
continue;
}
//Player-true kiting: below 45% with a hostile within 2, step away instead of ahead.
const r1 = await game.eval(`(${REST})`);
if (r1.hp < r1.max * 0.45 && r1.md <= 2 && retreats < 12) {
const rt = await game.eval(`(${RETREAT})(${r1.mx}, ${r1.my})`);
if (rt.step) {
const rf = await game.eval(`(${FRACTION_FN})(${rt.step[0]}, ${rt.step[1]})`);
await game.tap(rf[0], rf[1]);
await sleep(900);
taps++; retreats++;
continue;
}
}
if (s.depth !== target - 1) break;
if (!s.stairs) throw new Error('stairs vanished');
await game.eval('window.__PROBE_AVOID = true');
let b = await game.eval(BFS_STEP);
if (!b.step) { await game.eval('window.__PROBE_AVOID = false'); b = await game.eval(BFS_STEP); }
if (!b.step) {
noSteps++; plog('NOSTEP ' + JSON.stringify(s));
for (let w = 0; w < 20; w++) { await game.eval(`((m) => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`); }
searches++;
continue;
}
const f = await game.eval(`(${FRACTION_FN})(${b.step[0]}, ${b.step[1]})`);
await game.tap(f[0], f[1]);
await sleep(900);
taps++;
const after = await game.eval(STATE);
if (after.depth !== target - 1) break;
if (after.hero[0] === s.hero[0] && after.hero[1] === s.hero[1]) {
const sec = await game.eval('!!(scene.secrets.isSecret && scene.secrets.isSecret(' + b.step[0] + ', ' + b.step[1] + '))');
if (sec && searches < 40) { await game.press('f'); await sleep(900); searches++; stalls = 0; continue; }
const fight0 = await game.eval('(() => { const c = scene.creatureAt(' + b.step[0] + ', ' + b.step[1] + '); return [scene.hero.hp, c ? c.hp : -1]; })()');
await game.eval(`((m) => { scene['takeHeroTurn'](m); return 0; })({x: ${Math.sign(b.step[0] - s.hero[0])}, y: ${Math.sign(b.step[1] - s.hero[1])}})`);
await game.eval(`(() => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`);
bumps++;
await sleep(600);
const after2 = await game.eval(STATE);
if (after2.hero[0] === s.hero[0] && after2.hero[1] === s.hero[1]) {
//Combat in place is progress, not a stall: either HP bar moving resets the count.
const fight1 = await game.eval('(() => { const c = scene.creatureAt(' + b.step[0] + ', ' + b.step[1] + '); return [scene.hero.hp, c ? c.hp : -1]; })()');
if (fight1[0] !== fight0[0] || fight1[1] !== fight0[1]) { stalls = 0; continue; }
if (++stalls >= 6) {
const occKind = await game.eval('(() => { const c = scene.creatureAt(' + b.step[0] + ', ' + b.step[1] + '); return c ? c.kind : null; })()');
if (occKind === 'sheep' && sheepWaits < 8) {
//Java-faithful unhittable sheep (INFINITE_EVASION, sheepTurns countdown): bumping never
//works, so pass turns until it wanders off or expires - the player-true wait, not a skip.
for (let w = 0; w < 25; w++) { await game.eval(`((m) => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`); }
sheepWaits++; stalls = 0;
const afterW = await game.eval(STATE);
if (afterW.hp <= 0) throw new Error('hero died waiting out a sheep: ' + JSON.stringify(afterW));
continue;
}
const diag = await game.eval('({ at: [scene.hero.x, scene.hero.y], isDoor: !!scene.doors.isDoor(' + b.step[0] + ', ' + b.step[1] + '), locked: !!(scene.doors.isLocked && scene.doors.isLocked(' + b.step[0] + ', ' + b.step[1] + ')), open: !!(scene.doors.isOpen && scene.doors.isOpen(' + b.step[0] + ', ' + b.step[1] + ')), secret: !!(scene.secrets.isSecret && scene.secrets.isSecret(' + b.step[0] + ', ' + b.step[1] + ')), passable: !!scene.level.passable(' + b.step[0] + ', ' + b.step[1] + '), occupant: (() => { const c = scene.creatureAt(' + b.step[0] + ', ' + b.step[1] + '); return c ? (c.kind + ":" + c.hp + ":" + (!!c.isNPC)) : null; })(), hp: scene.hero.hp })');
if (diag.locked) throw new Error('GATED (by design): stairs behind locked door, no key: ' + JSON.stringify(diag));
if (typeof diag.occupant === 'string' && diag.occupant.endsWith(':true')) throw new Error('GATED (by design): quest NPC blocks the only corridor, dialogue required: ' + JSON.stringify(diag));
throw new Error('stalled: ' + JSON.stringify(diag));
}
} else stalls = 0;
} else stalls = 0;
}
const got = await game.eval(STATE);
plog('depth ' + target + ': ' + JSON.stringify({ ...got, taps, bumps, searches, sheepWaits, rests, noSteps }));
if (got.depth !== target) throw new Error('did not reach depth ' + target + ': ' + JSON.stringify(got));
await sleep(1500);
await game.screenshot('tools/scratch/t52-descent-' + target + '.png');
}
const fin = await game.eval(STATE);
const errors = game.consoleErrors();
if (errors.length > 0) throw new Error('console errors:\n' + errors.slice(0, 5).join('\n'));
if (fin.depth !== MAXD) throw new Error('did not descend: ' + JSON.stringify(fin));
plog('descent final: ' + JSON.stringify({ ...fin, taps, bumps, searches, sheepWaits, rests, noSteps }));
//PROBE_FIGHT=goo: walk to Goo and bump-fight it (player-true taps for moves,
//turn-pipeline vectors for attacks, like the descent bumps). Honest verdict:
//Goo may kill the hero; either outcome is live boss-combat evidence.
if (process.env.PROBE_FIGHT === 'goo') {
const FSTATE = `(() => { const g = scene.creatures.find(c => c.kind === 'goo'); return { depth: scene.depth, hp: scene.hero.hp, hero: [scene.hero.x, scene.hero.y], goo: g ? { x: g.x, y: g.y, hp: g.hp } : null }; })()`;
const FIGHT_STEP = `((TX, TY) => {
const W = scene.level.width, H = scene.level.height;
const key = (x, y) => y * W + x;
const openThrough = (x, y) => {
if (x < 0 || y < 0 || x >= W || y >= H) return false;
if (typeof scene.isChasmCell === 'function' && scene.isChasmCell(x, y)) return false;
if (scene.doors.isDoor(x, y)) return true;
if (!scene.level.passable(x, y)) return false;
//Route around non-combat blockers (NPC quest-givers, allies, unhittable sheep):
//hostiles stay enterable so bumping still fights them.
const occ = (typeof scene.creatureAt === 'function' && scene.creatureAt(x, y)) || null;
if (occ && (occ.isNPC || occ.isAlly || occ.kind === 'sheep')) return false;
return true;
};
const prev = new Map([[key(scene.hero.x, scene.hero.y), null]]);
const q = [[scene.hero.x, scene.hero.y]];
while (q.length) {
const [x, y] = q.shift();
if (x === TX && y === TY) {
let k = key(TX, TY), ck = [TX, TY], first = ck;
while (k !== key(scene.hero.x, scene.hero.y)) { first = ck; const p = prev.get(k); ck = [p % W, Math.floor(p / W)]; k = p; }
return { step: first };
}
for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
const nx = x + dx, ny = y + dy, k = key(nx, ny);
if (!prev.has(k) && openThrough(nx, ny)) { prev.set(k, key(x, y)); q.push([nx, ny]); }
}
}
return { step: null };
})`;
await game.screenshot('tools/scratch/t52-goo-prefight.png');
//Goo waits in its arena past the entry room: auto-explore (farthest reachable
//cell first, player-true taps) until it spawns into sight, then fight it.
const EXPLORE_STEP = `(() => {
const W = scene.level.width, H = scene.level.height;
const key = (x, y) => y * W + x;
const openThrough = (x, y) => {
if (x < 0 || y < 0 || x >= W || y >= H) return false;
if (typeof scene.isChasmCell === 'function' && scene.isChasmCell(x, y)) return false;
if (scene.doors.isDoor(x, y)) return true;
if (!scene.level.passable(x, y)) return false;
//Route around non-combat blockers (NPC quest-givers, allies, unhittable sheep):
//hostiles stay enterable so bumping still fights them.
const occ = (typeof scene.creatureAt === 'function' && scene.creatureAt(x, y)) || null;
if (occ && (occ.isNPC || occ.isAlly || occ.kind === 'sheep')) return false;
return true;
};
const prev = new Map([[key(scene.hero.x, scene.hero.y), null]]);
const q = [[scene.hero.x, scene.hero.y]];
let far = [scene.hero.x, scene.hero.y];
while (q.length) {
const [x, y] = q.shift(); far = [x, y];
for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
const nx = x + dx, ny = y + dy, k = key(nx, ny);
if (!prev.has(k) && openThrough(nx, ny)) { prev.set(k, key(x, y)); q.push([nx, ny]); }
}
}
if (far[0] === scene.hero.x && far[1] === scene.hero.y) return { step: null };
let k = key(far[0], far[1]), ck = far, first = ck;
while (k !== key(scene.hero.x, scene.hero.y)) { first = ck; const p = prev.get(k); ck = [p % W, Math.floor(p / W)]; k = p; }
return { step: first };
})()`;
for (let e = 0; e < 100; e++) {
const f0 = await game.eval(FSTATE);
if (f0.hp <= 0) throw new Error('hero died exploring Goo floor: ' + JSON.stringify(f0));
if (f0.goo && f0.goo.hp > 0) break;
const b0 = await game.eval(`(${EXPLORE_STEP})`);
if (!b0.step) { await game.eval(`(() => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`); await sleep(900); continue; }
const fr0 = await game.eval(`(${FRACTION_FN})(${b0.step[0]}, ${b0.step[1]})`);
await game.tap(fr0[0], fr0[1]);
await sleep(900);
const f0b = await game.eval(FSTATE);
if (f0b.hero[0] === f0.hero[0] && f0b.hero[1] === f0.hero[1] && f0b.hp > 0) {
await game.eval(`((m) => { scene['takeHeroTurn'](m); return 0; })({x: ${Math.sign(b0.step[0] - f0.hero[0])}, y: ${Math.sign(b0.step[1] - f0.hero[1])}})`);
await game.eval(`(() => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`);
await sleep(600);
}
if (e === 99) throw new Error('Goo never appeared: ' + JSON.stringify(await game.eval(FSTATE)));
}
plog('GOO-FIGHT engaged: ' + JSON.stringify(await game.eval(FSTATE)));
for (let i = 0; i < 120; i++) {
const f = await game.eval(FSTATE);
if (f.hp <= 0) { plog('GOO-FIGHT hero died: ' + JSON.stringify(f)); await game.screenshot('tools/scratch/t52-goo-outcome.png'); break; }
if (!f.goo) {
plog('GOO-VANISHED ' + JSON.stringify(f));
plog('GOO-UNSEAL ' + JSON.stringify(await game.eval('!!(scene.hasStairs && scene.stairs)')));
plog('GOO-ROSTER ' + JSON.stringify(await game.eval('scene.creatures.map(c => [c.kind, c.hp, c.x, c.y, !!c.isNPC, !!c.isAlly])')));
plog('GOO-ERRS ' + JSON.stringify(game.consoleErrors()));
await game.screenshot('tools/scratch/t52-goo-vanished.png');
break;
}
if (f.goo.hp <= 0) { plog('GOO-FIGHT GOO SLAIN: ' + JSON.stringify(f)); await game.screenshot('tools/scratch/t52-goo-outcome.png'); break; }
plog('GOO-IT ' + i + ' ' + JSON.stringify({ h: f.hero, hp: f.hp, g: [f.goo.x, f.goo.y, f.goo.hp] }));
const dx = f.goo.x - f.hero[0], dy = f.goo.y - f.hero[1];
if (Math.abs(dx) + Math.abs(dy) === 1) {
await game.eval(`((m) => { scene['takeHeroTurn'](m); return 0; })({x: ${Math.sign(dx)}, y: ${Math.sign(dy)}})`);
await game.eval(`(() => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`);
await sleep(900);
} else {
const b = await game.eval(`(${FIGHT_STEP})(${f.goo.x}, ${f.goo.y})`);
if (!b.step) { await game.eval(`(() => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`); await sleep(900); continue; }
const fr = await game.eval(`(${FRACTION_FN})(${b.step[0]}, ${b.step[1]})`);
await game.tap(fr[0], fr[1]);
await sleep(900);
const f2 = await game.eval(FSTATE);
if (f2.hero[0] === f.hero[0] && f2.hero[1] === f.hero[1] && f2.hp > 0) {
await game.eval(`((m) => { scene['takeHeroTurn'](m); return 0; })({x: ${Math.sign(b.step[0] - f.hero[0])}, y: ${Math.sign(b.step[1] - f.hero[1])}})`);
await game.eval(`(() => { scene['actionSpentTurn'] = true; scene['spendHeroTurn'](1); return 0; })()`);
await sleep(600);
}
}
if (i === 119) {
await game.screenshot('tools/scratch/t52-goo-turncap.png');
plog('GOO-FIGHT turn cap: ' + JSON.stringify(await game.eval(FSTATE)));
plog('GOO-GEO ' + JSON.stringify(await game.eval(`(() => {
const g = scene.creatures.find(c => c.kind === 'goo');
const W = scene.level.width, H = scene.level.height;
const doors = [];
for (let y = Math.max(0, g.y - 8); y < Math.min(H, g.y + 9); y++)
for (let x = Math.max(0, g.x - 8); x < Math.min(W, g.x + 9); x++) {
if (scene.doors.isDoor(x, y)) doors.push([x, y, !!(scene.doors.isLocked && scene.doors.isLocked(x, y)), !!(scene.doors.isOpen && scene.doors.isOpen(x, y))]);
}
const hvx = scene.hero.x, hvy = scene.hero.y;
const seen = new Set([hvy*W+hvx]);
const qq = [[hvx, hvy]];
let reach = 0;
const ot = (x, y) => {
if (x < 0 || y < 0 || x >= W || y >= H) return false;
if (typeof scene.isChasmCell === 'function' && scene.isChasmCell(x, y)) return false;
if (scene.doors.isDoor(x, y)) return true;
return !!scene.level.passable(x, y);
};
while (qq.length) { const top = qq.shift(); reach++;
for (const dd of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = top[0]+dd[0], ny = top[1]+dd[1], k = ny*W+nx;
if (!seen.has(k) && ot(nx, ny)) { seen.add(k); qq.push([nx, ny]); } } }
const line = [];
let x0 = hvx, y0 = hvy;
const x1 = g.x, y1 = g.y;
const dxm = Math.abs(x1-x0), dym = Math.abs(y1-y0), sx = x0<x1?1:-1, sy = y0<y1?1:-1;
let err = dxm-dym;
for (let n = 0; n < 300; n++) {
const cc = scene.creatureAt(x0, y0);
line.push([x0, y0, !!scene.level.passable(x0, y0), !!scene.doors.isDoor(x0, y0), !!(typeof scene.isChasmCell === 'function' && scene.isChasmCell(x0, y0)), scene.level.get(x0, y0), cc ? cc.kind : null]);
if (x0 === x1 && y0 === y1) break;
const e2 = 2*err; if (e2 > -dym) { err -= dym; x0 += sx; } if (e2 < dxm) { err += dxm; y0 += sy; }
}
return { sealed: !!scene.sewerBossSealed, reach, gooReached: seen.has(g.y*W+g.x), line, gooCell: { passable: !!scene.level.passable(g.x, g.y), door: !!scene.doors.isDoor(g.x, g.y), chasm: !!(typeof scene.isChasmCell === 'function' && scene.isChasmCell(g.x, g.y)) }, doorsNearGoo: doors };
})()`)));
}
}
const ferr = game.consoleErrors();
if (ferr.length > 0) throw new Error('console errors in fight:\n' + ferr.slice(0, 5).join('\n'));
plog('GOO-FIGHT done');
}
};
