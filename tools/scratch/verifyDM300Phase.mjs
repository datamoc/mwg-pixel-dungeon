// tools/verifyDM300Phase.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// src/simulation/dm300Boss.ts
function dm300SuperchargeThreshold(maxHp, pylonsActivated, strongerBosses) {
  return strongerBosses ? maxHp / 4 * (3 - pylonsActivated) : maxHp / 3 * (2 - pylonsActivated);
}
function dm300SuperchargeEntry(supercharged, hp, threshold) {
  return !supercharged && threshold > 0 && hp <= threshold;
}
var DM300_MIN_COOLDOWN = 5;
function dm300ChargeEndTurns(turnsSinceLastAbility) {
  return Math.min(turnsSinceLastAbility, DM300_MIN_COOLDOWN - 3);
}
function dm300PylonsFinished(pylonsActivated, strongerBosses) {
  return pylonsActivated >= (strongerBosses ? 3 : 2);
}
function dm300PylonEnergySeeds(width, height, terrainAt) {
  const cells = [];
  const start = 13 * width;
  for (let cell = start; cell < width * height; cell++) {
    const terrain = terrainAt(cell);
    if (terrain === "water" || terrain === "inactiveTrap" || terrain === "sign") cells.push(cell);
  }
  return cells;
}
var CAVES_DIGGABLE_AREA = { left: 2, top: 11, right: 31, bottom: 40 };
var CAVES_BOSS_GATE = { left: 14, top: 13, right: 19, bottom: 14 };
var NEIGHBOURS8 = [
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 }
];
var NEIGHBOURS9 = [...NEIGHBOURS8.slice(0, 4), { x: 0, y: 0 }, ...NEIGHBOURS8.slice(4)];
var trueDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function closestNeighbour(from, target, accept) {
  let best = from;
  for (const d of NEIGHBOURS8) {
    const at = { x: from.x + d.x, y: from.y + d.y };
    if (accept(at.x, at.y) && trueDistance(best, target) > trueDistance(at, target)) best = at;
  }
  return best;
}
function planDM300Tunnel(from, target, ctx) {
  const best = closestNeighbour(from, target, (x, y) => !ctx.occupied(x, y));
  if (best.x === from.x && best.y === from.y) return null;
  const dig = [];
  for (const d of NEIGHBOURS9) {
    const p = { x: from.x + d.x, y: from.y + d.y };
    if (!ctx.isWall(p.x, p.y)) continue;
    const gate = CAVES_BOSS_GATE;
    if (p.y < gate.bottom && p.x >= gate.left - 2 && p.x < gate.right + 2) continue;
    const area = CAVES_DIGGABLE_AREA;
    if (!(p.x >= area.left && p.x < area.right && p.y >= area.top && p.y < area.bottom)) continue;
    dig.push(p);
  }
  return { dig };
}
function dm300TunnelMove(from, target, ctx) {
  const best = closestNeighbour(from, target, (x, y) => !ctx.occupied(x, y) && ctx.isOpenSpace(x, y));
  return best.x === from.x && best.y === from.y ? null : best;
}

// src/simulation/ratKingBoss.ts
function planRatKingWave(made, shield, challenge, random) {
  const batch = [];
  let announcement;
  if (!challenge) {
    if (made >= 4 && (shield > 200 || made >= 8) && (shield > 100 || made >= 12)) return null;
    if (made < 4) {
      if (made === 0) announcement = "wave_1";
      batch.push("ghoul");
      return { adds: batch, nextSummonsMade: made + 1, announcement, arrivalDelay: 3, cadence: 3 };
    } else if (shield <= 200 && made < 8) {
      if (made === 4) announcement = "wave_2";
      if (made === 7) batch.push(random.int(0, 2) === 0 ? "monk" : "warlock");
      else batch.push("ghoul");
      return { adds: batch, nextSummonsMade: made + 1, announcement, arrivalDelay: 3, cadence: 1 };
    } else if (shield <= 100 && made < 12) {
      announcement = "wave_3";
      batch.push("warlock", "monk", "ghoul", "ghoul");
      return { adds: batch, nextSummonsMade: 12, announcement, arrivalDelay: 4, cadence: 1 };
    } else return null;
  }
  if (made >= 6 && (shield > 300 || made >= 12) && (shield > 150 || made >= 18)) return null;
  if (made < 6) {
    if (made === 0) announcement = "wave_1";
    batch.push("ghoul", "ghoul");
    return { adds: batch, nextSummonsMade: made + 2, announcement, arrivalDelay: 3, cadence: 3 };
  } else if (shield <= 300 && made < 12) {
    if (made === 6) announcement = "wave_2";
    batch.push("ghoul", "ghoul", made === 6 ? "monk" : "warlock");
    return { adds: batch, nextSummonsMade: made + 3, announcement, arrivalDelay: 3, cadence: 3 };
  } else if (shield <= 150 && made < 18) {
    if (made === 12) {
      announcement = "wave_3";
      batch.push("warlock", "monk", "ghoul", "ghoul");
      return { adds: batch, nextSummonsMade: made + 4, announcement, arrivalDelay: 3, cadence: 3 };
    } else batch.push("golem", "golem");
    return { adds: batch, nextSummonsMade: made + 2, announcement, arrivalDelay: 3, cadence: 1 };
  } else return null;
}

// tools/verifyDM300Phase.ts
assert.equal(dm300SuperchargeThreshold(300, 0, false), 200);
assert.equal(dm300SuperchargeThreshold(300, 1, false), 100);
assert.equal(dm300SuperchargeThreshold(300, 2, false), 0);
assert.equal(dm300SuperchargeThreshold(400, 0, true), 300);
assert.equal(dm300SuperchargeThreshold(400, 2, true), 100);
assert.equal(dm300SuperchargeThreshold(400, 3, true), 0);
assert.equal(dm300SuperchargeEntry(false, 200, 200), true);
assert.equal(dm300SuperchargeEntry(false, 201, 200), false);
assert.equal(dm300SuperchargeEntry(true, 0, 200), false, "no re-entry while charged");
assert.equal(dm300SuperchargeEntry(void 0, 200, 200), true, "fresh DM300 has no flag set");
assert.equal(dm300SuperchargeEntry(false, 50, 0), false, "spent thresholds stay shut");
assert.equal(dm300ChargeEndTurns(9), 2);
assert.equal(dm300ChargeEndTurns(2), 2);
assert.equal(dm300ChargeEndTurns(-4), -4, "negative counters pass through untouched");
assert.equal(dm300PylonsFinished(1, false), false);
assert.equal(dm300PylonsFinished(2, false), true);
assert.equal(dm300PylonsFinished(2, true), false);
assert.equal(dm300PylonsFinished(3, true), true);
{
  const types = /* @__PURE__ */ new Map([
    [12 * 33 + 2, "water"],
    [13 * 33 + 2, "inactiveTrap"],
    [14 * 33 + 2, "water"],
    [15 * 33 + 2, "sign"],
    [16 * 33 + 2, "inactiveTrap"]
  ]);
  assert.deepEqual(
    dm300PylonEnergySeeds(33, 42, (cell) => types.get(cell) ?? "other"),
    [13 * 33 + 2, 14 * 33 + 2, 15 * 33 + 2, 16 * 33 + 2],
    "Java directly seeds water, inactive traps and custom-deco/sign cells from row 13 onward"
  );
}
var superchargeScene = readFileSync(join(process.cwd(), "src/scenes/dungeon/combatResolution.ts"), "utf8");
var supercharge = /dm300Supercharge\(this: DungeonScene, dm300: Creature\): void \{[\s\S]*?\n\t\},/.exec(superchargeScene);
assert.ok(supercharge, "scene supercharge adapter still exists");
assert.ok(
  supercharge[0].includes("this.scheduler.postpone(dm300, isChallengeEnabled('stronger_bosses') ? 2 : 3)"),
  "DM300 receives Java's challenge-specific actor cooldown at charge activation"
);
assert.ok(supercharge[0].includes("dm300PylonEnergySeeds("), "scene charge setup delegates direct PylonEnergy seed-cell selection");
var kingScene = readFileSync(join(process.cwd(), "src/scenes/dungeon/bosses/bossLogic.ts"), "utf8");
assert.equal(
  (kingScene.match(/this\.kingP1Summon\([^\n]+challenge\), false, challenge \? 2 : 3\)/g) ?? []).length,
  2,
  "P1 and P3 servants both receive Java's challenge-specific arrival delay"
);
assert.ok(kingScene.includes("arrivalDelay?: number"), "summoned servant accepts a Java arrival delay");
assert.ok(kingScene.includes("false, undefined, arrivalDelay)"), "summoned servant first action waits for the Java delay");
var noRandomChoice = { float: () => 0, normalRange: () => 0, range: () => 0, int: () => 0, chance: () => false };
assert.equal(planRatKingWave(0, 300, false, noRandomChoice)?.arrivalDelay, 3, "normal first wave uses Java delay 3");
assert.equal(planRatKingWave(4, 200, false, noRandomChoice)?.arrivalDelay, 3, "normal second wave uses Java delay 3");
assert.equal(planRatKingWave(8, 100, false, noRandomChoice)?.arrivalDelay, 4, "normal final wave uses Java delay 4");
assert.equal(planRatKingWave(0, 300, true, noRandomChoice)?.arrivalDelay, 3, "challenge first wave uses Java delay 3");
assert.equal(planRatKingWave(6, 300, true, noRandomChoice)?.arrivalDelay, 3, "challenge second wave uses Java delay 3");
assert.equal(planRatKingWave(12, 150, true, noRandomChoice)?.arrivalDelay, 3, "challenge mixed wave uses Java delay 3");
assert.equal(planRatKingWave(16, 150, true, noRandomChoice)?.arrivalDelay, 3, "challenge golem wave uses Java delay 3");
assert.ok(kingScene.includes("plan.arrivalDelay"), "phase-two servants use their wave plan arrival delay");
for (const rel of ["src/scenes/dungeon/attackSeams.ts", "src/scenes/dungeon/combatResolution.ts"]) {
  const site = readFileSync(join(process.cwd(), rel), "utf8");
  assert.ok(site.includes("dm300SuperchargeThreshold"), `${rel} delegates the threshold`);
  assert.ok(site.includes("dm300SuperchargeEntry"), `${rel} delegates the entry`);
  assert.ok(!site.includes("maxHp / 4 * (3 - activated)"), `no duplicated threshold in ${rel}`);
  if (rel.endsWith("combatResolution.ts")) {
    assert.ok(site.includes("dm300ChargeEndTurns"), "dispatch tail delegates the charge-end clamp");
    assert.ok(!site.includes("Math.min(dm300.dmAbilityTurns"), "no duplicated clamp remains in the tail");
  } else {
    assert.ok(!site.includes("dm300ChargeEndTurns"), "charge end lives only in the dispatch tail");
  }
}
assert.ok(
  readFileSync(join(process.cwd(), "src/scenes/dungeon/combatResolution.ts"), "utf8").includes("dm300PylonsFinished(dm300.dmPylonsActivated ?? 0, isChallengeEnabled('stronger_bosses'))"),
  "final charge loss delegates Java totalPylonsToActivate to the shared finale gate"
);
assert.ok(
  readFileSync(join(process.cwd(), "src/scenes/dungeon/coreSpawnTiles.ts"), "utf8").includes("creature.kind === 'dm300' && !creature.dmSupercharged && dm300PylonsFinished"),
  "final-pylon bleed state is restored after a save/load"
);
assert.ok(
  readFileSync(join(process.cwd(), "src/scenes/dungeon/deathSaveRefresh.ts"), "utf8").includes("if (this.currentBoss && (boss ?? null) !== this.currentBoss)"),
  "initial restored boss assignment does not clear the saved transition latch"
);
{
  const walls = /* @__PURE__ */ new Set();
  for (let x = 0; x < 40; x++) for (let y = 0; y < 50; y++) walls.add(x + "," + y);
  const none = () => false;
  const wall = (x, y) => walls.has(x + "," + y);
  const plan = planDM300Tunnel({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: none, isWall: wall });
  assert.ok(plan, "a closer neighbour exists");
  assert.equal(plan.dig.length, 9, "all nine 3x3 walls dug inside diggableArea");
  assert.deepEqual(plan.dig[0], { x: 9, y: 19 }, "NEIGHBOURS9 row-major order");
  const edge = planDM300Tunnel({ x: 2, y: 20 }, { x: 2, y: 30 }, { occupied: none, isWall: wall });
  assert.ok(edge.dig.every((c) => c.x >= 2), "nothing dug left of diggableArea");
  assert.equal(edge.dig.length, 6, "the x=1 column is outside the arena");
  const gate = planDM300Tunnel({ x: 15, y: 14 }, { x: 15, y: 30 }, { occupied: none, isWall: wall });
  assert.ok(gate.dig.every((c) => c.y >= 14 || c.x < 12 || c.x >= 21), "gate band untouched");
  assert.equal(gate.dig.length, 6, "row y=13 inside the gate columns skipped");
  assert.equal(planDM300Tunnel({ x: 10, y: 20 }, { x: 10, y: 20 }, { occupied: none, isWall: wall }), null, "on the target: no closer cell");
  assert.equal(planDM300Tunnel({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: (x, y) => y > 20, isWall: wall }), null, "every closer cell occupied");
  assert.deepEqual(dm300TunnelMove({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: none, isOpenSpace: () => true }), { x: 10, y: 21 }, "strictly closest step; ties go to the first in order");
  assert.equal(dm300TunnelMove({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: none, isOpenSpace: () => false }), null, "no open cell, no step");
}
console.log("dm300 phase seam: all checks pass");
