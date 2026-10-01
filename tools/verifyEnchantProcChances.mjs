import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Pins the weapon enchant/curse proc-chance seam (`src/simulation/attackWeaponAffixes.ts`)
// against each `Weapon.proc()` branch (`items/weapon/enchantments/*.java`, curses under
// `items/weapon/curses/`, tag `v3.3.8`) and pins the post-hit affix chain in
// combatResolution to the seam: the chain must delegate, never a second copy.
const source = new URL('../src/simulation/attackWeaponAffixes.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-ench-chance-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'attackWeaponAffixes.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const seam = createRequire(import.meta.url)(join(output, 'attackWeaponAffixes.cjs'));

// Tiered chances at reference levels (multiplier 1).
assert.equal(seam.blazingProcChance(0, 1), 1 / 3);
assert.equal(seam.blazingProcChance(1, 1), 1 / 2);
assert.equal(seam.blazingProcChance(2, 1), 3 / 5);
assert.equal(seam.bloomingProcChance(2, 1), 3 / 5);
assert.equal(seam.chillingProcChance(0, 1), 1 / 4);
assert.equal(seam.chillingProcChance(1, 1), 2 / 5);
assert.equal(seam.chillingProcChance(2, 1), 1 / 2);
assert.equal(seam.elasticProcChance(0, 1), 1 / 5);
assert.equal(seam.luckyProcChance(0, 1), 1 / 10);
assert.equal(seam.blockingProcChance(0, 1), 1 / 10);
assert.equal(seam.blockingProcChance(2, 1), 6 / 42);
// Flat fractions.
assert.equal(seam.shockingProcChance(1), 1 / 3);
assert.equal(seam.dazzlingProcChance(1), 1 / 10);
assert.equal(seam.annoyingProcChance(1), 1 / 20);
assert.equal(seam.waywardProcChance(1), 1 / 4);
// Vampiric scales 5% unhurt to 30% near death.
assert.equal(seam.vampiricHealChance(100, 100, 1), 0.05);
assert.equal(seam.vampiricHealChance(1, 100, 1), 0.05 + 0.25 * 0.99);
assert.equal(seam.vampiricHealChance(0, 0, 1), 0.05);
// Explosive fuse wear takes the rolled draw.
assert.equal(seam.explosiveFuseWear(7, 1), 7);
assert.equal(seam.explosiveFuseWear(7, 0.5), 4);
// Grim execute: (0.5 + 0.05 x level) x arcana, rolled against missing-HP-fraction squared.
assert.equal(seam.grimExecuteChance(0, 1, 50, 100), 0.125);
assert.equal(seam.grimExecuteChance(0, 1, 100, 100), 0, 'full HP never executes');
assert.equal(seam.grimExecuteChance(0, 1, 0, 0), 0, 'zero max HP guards the fraction');
assert.ok(Math.abs(seam.grimExecuteChance(2, 1, 0, 100) - 0.6) < 1e-12, 'level 2 full-missing is 60%');
// Corrupting conversion: (level+5)/(level+25) x arcana, 20% at 0.
assert.equal(seam.corruptingProcChance(0, 1), 5 / 25);
assert.equal(seam.corruptingProcChance(1, 1), 6 / 26);
assert.equal(seam.corruptingProcChance(2, 1.5), 7 / 27 * 1.5);
// Hero weapon-proc decisions: Spirit Blades arming, Kinetic conserve/store, holy magnitude.
assert.equal(seam.spiritBladesFires(true, true, 2, 1), true, 'Int(10) < 3*points');
assert.equal(seam.spiritBladesFires(true, true, 3, 1), false, 'boundary is strict');
assert.equal(seam.spiritBladesFires(false, true, 0, 3), false, 'disarmed stays armed');
assert.equal(seam.spiritBladesFires(true, false, 0, 3), false, 'hero-only gate');
assert.equal(seam.kineticConserveRelease(7.2), 8);
assert.equal(seam.kineticOverkillStore(-30, 8, 1), 22);
assert.equal(seam.kineticOverkillStore(-5, 8, 1), 0, 'conserved bonus is subtracted first');
assert.equal(seam.holyWeaponHitDamage(6, 1), 6);
assert.equal(seam.holyWeaponHitDamage(2, 1.5), 3);

// Arcana-style scaling rides the shared multiplier on every chance.
assert.equal(seam.blazingProcChance(1, 1.5), 0.75);
assert.ok(Math.abs(seam.dazzlingProcChance(1.5) - 0.15) < 1e-12);

// The chain runs the seam, not a second copy of the arithmetic.
const chain = readFileSync(new URL('../src/scenes/dungeon/combatResolution.ts', import.meta.url), 'utf8');
for (const name of ['blazingProcChance', 'bloomingProcChance', 'chillingProcChance', 'elasticProcChance',
	'luckyProcChance', 'blockingProcChance', 'shockingProcChance', 'vampiricHealChance',
	'explosiveFuseWear', 'dazzlingProcChance', 'annoyingProcChance', 'waywardProcChance',
	'grimExecuteChance', 'corruptingProcChance']) {
	assert.ok(chain.includes(name), `affix chain delegates to ${name}`);
}
// Grim/Corrupting resolve outside the blazing chain (hero path + Shockwave mirrors),
// so their no-duplicate gate covers the whole file, not just the chain region.
assert.ok(!chain.includes('(0.5 + 0.05 * level) * this.enchantProcMultiplier()'), 'no duplicated grim maxChance');
assert.ok(!chain.includes('((Math.max(0, this.degradedLevel(this.weaponLevel)) + 5) / (Math.max(0, this.degradedLevel(this.weaponLevel)) + 25))'), 'no duplicated corrupting fraction');
// Absence is scoped to the post-hit affix chain (other 1/10-style rolls elsewhere -
// sacrificial mirrors, spirit blades - are different mechanics, not copies).
const chainStart = chain.indexOf("if (affix === 'blazing'");
const chainEnd = chain.indexOf("applyBloomingGrass(attacker, defender, level, procChance);");
assert.ok(chainStart !== -1 && chainEnd !== -1 && chainEnd > chainStart, 'chain bounds found');
const region = chain.slice(chainStart, chainEnd);
for (const name of ['spiritBladesFires', 'kineticConserveRelease', 'kineticOverkillStore', 'holyWeaponHitDamage']) {
	assert.ok(chain.includes(name), `hero blocks delegate to ${name}`);
}
// Lethal Momentum arming: Java's 0.34+0.33/point (Mob.die), not the old 2/3 rounding.
assert.equal(seam.lethalMomentumChance(0), 0.34);
assert.ok(Math.abs(seam.lethalMomentumChance(1) - 0.67) < 1e-12, 'rank 1 is 0.67');
assert.ok(Math.abs(seam.lethalMomentumChance(2) - 1.0) < 1e-12, 'rank 2 is certain');
assert.ok(chain.includes('lethalMomentumChance'), 'kill hook delegates to lethalMomentumChance');
assert.ok(!chain.includes("this.talentRank('lethal_momentum') >= 2 ? 1 : 2 / 3"), 'no duplicated momentum tiers');
assert.ok(!chain.includes("Random.int(0, 10) < 3 * this.talentRank('spirit_blades')"), 'no duplicated blades roll');
assert.ok(!chain.includes('Math.ceil(this.kineticStored)'), 'no duplicated conserve release');
assert.ok(!chain.includes('Math.max(0, -defender.hp - this.kineticConservedAdded)'), 'no duplicated overkill');
assert.ok(!chain.includes('Math.round(holyWeaponBonus(this.subclass()) * this.genericProcMultiplier())'), 'no duplicated holy magnitude');
for (const formula of ['((level + 1) / (level + 3)) * this.enchantProcMultiplier()',
	'((level + 1) / (level + 4)) * this.enchantProcMultiplier()',
	'((level + 1) / (level + 5)) * this.enchantProcMultiplier()',
	'((level + 4) / (level + 40)) * this.enchantProcMultiplier()',
	'(1 / 3) * this.enchantProcMultiplier()',
	'(0.05 + 0.25 * missing) * this.enchantProcMultiplier()',
	'(1 / 10) * this.enchantProcMultiplier()',
	'(1 / 20) * this.enchantProcMultiplier()',
	'(1 / 4) * this.enchantProcMultiplier()']) {
	assert.ok(!region.includes(formula), `no duplicated formula remains: ${formula}`);
}

console.log('enchant proc-chance seam: all checks pass');
