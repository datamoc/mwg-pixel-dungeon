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
// Arcana-style scaling rides the shared multiplier on every chance.
assert.equal(seam.blazingProcChance(1, 1.5), 0.75);
assert.ok(Math.abs(seam.dazzlingProcChance(1.5) - 0.15) < 1e-12);

// The chain runs the seam, not a second copy of the arithmetic.
const chain = readFileSync(new URL('../src/scenes/dungeon/combatResolution.ts', import.meta.url), 'utf8');
for (const name of ['blazingProcChance', 'bloomingProcChance', 'chillingProcChance', 'elasticProcChance',
	'luckyProcChance', 'blockingProcChance', 'shockingProcChance', 'vampiricHealChance',
	'explosiveFuseWear', 'dazzlingProcChance', 'annoyingProcChance', 'waywardProcChance']) {
	assert.ok(chain.includes(name), `affix chain delegates to ${name}`);
}
// Absence is scoped to the post-hit affix chain (other 1/10-style rolls elsewhere -
// sacrificial mirrors, spirit blades - are different mechanics, not copies).
const chainStart = chain.indexOf("if (affix === 'blazing'");
const chainEnd = chain.indexOf("applyBloomingGrass(attacker, defender, level, procChance);");
assert.ok(chainStart !== -1 && chainEnd !== -1 && chainEnd > chainStart, 'chain bounds found');
const region = chain.slice(chainStart, chainEnd);
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
