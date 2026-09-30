import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { displacementProcChance, repulsionProcChance } from '../src/simulation/combat';
import { friendlyProcChance } from '../src/simulation/attackWeaponAffixes';

// Pins the defender-proc chance seam against its Java classes
// (`items/armor/curses/Displacement.java`, `items/armor/glyphs/Repulsion.java`,
// `items/weapon/curses/Friendly.java`, tag `v3.3.8`) and pins both damage
// call sites to the seam: `applyDefenderGlyphProcs` (attackSeams.ts),
// the post-hit friendly branch and `friendlyCurseProc`, and the repulsion
// branch (combatResolution.ts) must delegate, never a second copy.
//
// Run: esbuild tools/verifyDefenderProcChances.ts --bundle --platform=node --format=esm \
//   --outfile=tools/scratch/verifyDefenderProcChances.mjs && node tools/scratch/verifyDefenderProcChances.mjs

// Flat fractions.
assert.equal(displacementProcChance(1), 1 / 20);
assert.equal(friendlyProcChance(1), 1 / 10);
// Repulsion tier at reference levels.
assert.equal(repulsionProcChance(0, 1), 1 / 5);
assert.equal(repulsionProcChance(4, 1), 5 / 9);
// Arcana-style scaling rides the shared multiplier on every chance.
assert.equal(repulsionProcChance(0, 2), 2 / 5);
assert.ok(Math.abs(friendlyProcChance(1.5) - 0.15) < 1e-12);

// Both call sites run the seam, not a second copy (paths resolve from the
// repo root, the documented working directory for the run line).
const sites = [
	'displacementProcChance(this.armorProcMultiplier(defender))',
	'repulsionProcChance(level, this.armorProcMultiplier(defender))',
];
for (const rel of ['src/scenes/dungeon/attackSeams.ts', 'src/scenes/dungeon/combatResolution.ts']) {
	const site = readFileSync(join(process.cwd(), rel), 'utf8');
	for (const call of sites) {
		assert.ok(site.includes(call), `${rel} delegates ${call}`);
	}
	assert.ok(!site.includes('((level + 1) / (level + 5)) * this.armorProcMultiplier(defender)'),
		`no duplicated repulsion formula in ${rel}`);
	assert.ok(!site.includes('(1 / 20) * this.armorProcMultiplier(defender)'),
		`no duplicated displacement formula in ${rel}`);
}
const friendly = 'friendlyProcChance(this.enchantProcMultiplier())';
for (const rel of ['src/scenes/dungeon/attackSeams.ts', 'src/scenes/dungeon/combatResolution.ts']) {
	const site = readFileSync(join(process.cwd(), rel), 'utf8');
	assert.ok(site.includes(friendly), `${rel} delegates friendly`);
}
const cr = readFileSync(join(process.cwd(), 'src/scenes/dungeon/combatResolution.ts'), 'utf8');
assert.equal(cr.split(friendly).length - 1, 2, 'both friendly branches delegate');

console.log('defender proc-chance seam: all checks pass');
