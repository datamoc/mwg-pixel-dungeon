// tools/verifyDefenderProcChances.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// src/simulation/combat.ts
function displacementProcChance(multiplier) {
  return 1 / 20 * multiplier;
}
function repulsionProcChance(level, multiplier) {
  return (level + 1) / (level + 5) * multiplier;
}

// src/simulation/attackWeaponAffixes.ts
function friendlyProcChance(multiplier) {
  return 1 / 10 * multiplier;
}

// tools/verifyDefenderProcChances.ts
assert.equal(displacementProcChance(1), 1 / 20);
assert.equal(friendlyProcChance(1), 1 / 10);
assert.equal(repulsionProcChance(0, 1), 1 / 5);
assert.equal(repulsionProcChance(4, 1), 5 / 9);
assert.equal(repulsionProcChance(0, 2), 2 / 5);
assert.ok(Math.abs(friendlyProcChance(1.5) - 0.15) < 1e-12);
var sites = [
  "displacementProcChance(this.armorProcMultiplier(defender))",
  "repulsionProcChance(level, this.armorProcMultiplier(defender))"
];
for (const rel of ["src/scenes/dungeon/attackSeams.ts", "src/scenes/dungeon/combatResolution.ts"]) {
  const site = readFileSync(join(process.cwd(), rel), "utf8");
  for (const call of sites) {
    assert.ok(site.includes(call), `${rel} delegates ${call}`);
  }
  assert.ok(
    !site.includes("((level + 1) / (level + 5)) * this.armorProcMultiplier(defender)"),
    `no duplicated repulsion formula in ${rel}`
  );
  assert.ok(
    !site.includes("(1 / 20) * this.armorProcMultiplier(defender)"),
    `no duplicated displacement formula in ${rel}`
  );
}
var friendly = "friendlyProcChance(this.enchantProcMultiplier())";
for (const rel of ["src/scenes/dungeon/attackSeams.ts", "src/scenes/dungeon/combatResolution.ts"]) {
  const site = readFileSync(join(process.cwd(), rel), "utf8");
  assert.ok(site.includes(friendly), `${rel} delegates friendly`);
}
var cr = readFileSync(join(process.cwd(), "src/scenes/dungeon/combatResolution.ts"), "utf8");
assert.equal(cr.split(friendly).length - 1, 2, "both friendly branches delegate");
console.log("defender proc-chance seam: all checks pass");
