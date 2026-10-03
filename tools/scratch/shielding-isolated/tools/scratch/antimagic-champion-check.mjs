import { execSync } from 'node:child_process';
import fs from 'node:fs';

execSync('npx esbuild src/combat.ts --bundle --platform=node --format=esm --packages=external --outfile=tools/scratch/combat-check.mjs', { stdio: 'inherit' });
const { addBuff } = await import('./combat-check.mjs');

function makeCreature(magicImmune) {
	return {
		id: 0, isHero: false, isNPC: false, name: 'test', hp: 10, maxHp: 10,
		accuracy: 10, evasion: 10, damage: [1, 2], armor: [0, 0], buffs: {}, sleeping: false,
		magicImmune,
	};
}

let failures = 0;
function check(label, cond) {
	if (!cond) { console.log(`FAIL ${label}`); failures++; }
	else console.log(`PASS ${label}`);
}

for (const id of ['weakness', 'vulnerable', 'hex', 'degrade', 'magicalSleep', 'charm']) {
	const immune = makeCreature(true);
	addBuff(immune, id);
	check(`AntiMagic-immune creature refuses ${id}`, immune.buffs[id] === undefined);

	const normal = makeCreature(false);
	addBuff(normal, id);
	check(`ordinary creature still accepts ${id}`, normal.buffs[id] !== undefined);
}

// A buff outside RESISTS' list should still land on a magicImmune creature (the gate must be
// per-buff, not a blanket "no buffs at all" flag).
const immuneButFlammable = makeCreature(true);
addBuff(immuneButFlammable, 'burning');
check('AntiMagic immunity does not block unrelated buffs (burning)', immuneButFlammable.buffs['burning'] !== undefined);

fs.rmSync('tools/scratch/combat-check.mjs', { force: true });
fs.rmSync('tools/scratch/combat-check.mjs.map', { force: true });

if (failures > 0) { console.log(`${failures} check(s) FAILED`); process.exit(1); }
console.log('All AntiMagic-champion magicImmune checks passed.');
