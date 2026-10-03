// tools/verifyBloodSplash.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// src/simulation/bloodSplash.ts
var DEFAULT_BLOOD = 12255232;
var BLOOD_BY_KIND = {
  acidic: 6749986,
  bee: 16766208,
  crab: 16771712,
  greatCrab: 16771712,
  hermitCrab: 16771712,
  crystalGuardian: 9364479,
  crystalSpire: 9364479,
  crystalWisp: 6730751,
  dm100: 16777096,
  dm200: 16777096,
  dm201: 16777096,
  dm300: 16777096,
  pylon: 16777096,
  earthGuardian: 9856e3,
  yogFist: 16768308,
  sentry: 8965188,
  rotHeart: 8965188,
  rotLasher: 8965188,
  ghost: 16777215,
  golem: 8417388,
  goo: 0,
  larva: 12307558,
  scorpio: 4521762,
  skeleton: 13421772,
  necroSkeleton: 13421772,
  slime: 8965188,
  spinner: 12576184,
  statue: 13487543,
  armoredStatue: 13487543,
  swarm: 9150583,
  ward: 13382655,
  wraith: 0,
  dustWraith: 0,
  newbornElemental: 8781768
};
var ELEMENTAL_BLOOD = { fire: 16759603, frost: 9364479, shock: 16777093, chaos: 14935011 };
function bloodColor(kind, elementalType) {
  if (kind === "elemental") return ELEMENTAL_BLOOD[elementalType ?? "fire"] ?? DEFAULT_BLOOD;
  return BLOOD_BY_KIND[kind ?? ""] ?? DEFAULT_BLOOD;
}
function bloodBurstCount(damage, maxHp) {
  if (damage <= 0 || maxHp <= 0) return 0;
  return Math.trunc(Math.min(9 * Math.sqrt(damage / maxHp), 9));
}
function bleedsOnHit(defender) {
  if (defender.isHero || defender.allyKind === "mirror") return false;
  return !(defender.kind === "demonSpawner" && defender.hp <= 0);
}

// tools/verifyBloodSplash.ts
assert.equal(bloodBurstCount(0, 10), 0);
assert.equal(bloodBurstCount(1, 100), 0, "9 * 0.1 = 0.9 truncates to 0");
assert.equal(bloodBurstCount(1, 10), 2, "9 * sqrt(0.1) = 2.84");
assert.equal(bloodBurstCount(5, 10), 6, "9 * sqrt(0.5) = 6.36");
assert.equal(bloodBurstCount(10, 10), 9);
assert.equal(bloodBurstCount(500, 10), 9, "capped at 9");
assert.equal(bloodColor("rat"), DEFAULT_BLOOD, "no override = 0xBB0000");
assert.equal(bloodColor("skeleton"), 13421772);
assert.equal(bloodColor("slime"), 8965188);
assert.equal(bloodColor("goo"), 0);
assert.equal(bloodColor("elemental", "frost"), 9364479);
assert.equal(bloodColor("elemental", "chaos"), 14935011);
assert.equal(bloodColor("elemental"), 16759603, "an untyped elemental is the fire sprite");
assert.equal(bloodColor(void 0), DEFAULT_BLOOD);
assert.equal(bleedsOnHit({ isHero: true, kind: void 0, hp: 5 }), false, "HeroSprite.bloodBurstA does nothing");
assert.equal(bleedsOnHit({ allyKind: "mirror", kind: "rat", hp: 5 }), false, "MirrorSprite.bloodBurstA does nothing");
assert.equal(bleedsOnHit({ kind: "demonSpawner", hp: 0 }), false, "a dead spawner does not bleed");
assert.equal(bleedsOnHit({ kind: "demonSpawner", hp: 3 }), true);
assert.equal(bleedsOnHit({ kind: "rat", hp: 0 }), true, "a killing blow still splashes");
var site = readFileSync(join(process.cwd(), "src/scenes/dungeon/combatResolution.ts"), "utf8");
assert.ok(site.includes("spawnBloodBurst(this, attacker, defender, damage)"), "attack() splashes through the seam");
console.log("blood splash: all checks pass");
