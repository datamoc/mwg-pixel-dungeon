import { execSync } from 'node:child_process';
import fs from 'node:fs';

execSync('npx esbuild src/items/wandEffects.ts --bundle --platform=node --format=esm --packages=external --outfile=tools/scratch/wandEffects-check.mjs', { stdio: 'inherit' });
const { useFireblastWand } = await import('./wandEffects-check.mjs');

function makeVictim(magicImmune) {
	return { id: 1, isHero: false, isNPC: false, isAlly: false, name: 'v', hp: 20, maxHp: 20, buffs: {}, magicImmune };
}

function run(magicImmune) {
	const victim = makeVictim(magicImmune);
	const hero = { id: 0, isHero: true, x: 0, y: 0, name: 'hero' };
	let damageDealt = 0;
	let buffsAdded = [];
	useFireblastWand({
		target: { x: 1, y: 0 },
		hero,
		charges: 1,
		weaponLevel: 0,
		width: 10,
		height: 10,
		traceRay: (from, to) => [from, to],
		isClosedDoor: () => false,
		openDoor: () => {},
		passable: () => true,
		isFlammableTerrain: () => false,
		burnFireContents: () => {},
		seedFire: () => {},
		fireVolumeAt: () => 0,
		inside: (x, y) => x >= 0 && x < 10 && y >= 0 && y < 10,
		creatureAt: (x, y) => (x === 1 && y === 0 ? victim : null),
		fadeMirrorOnDamage: () => false,
		showDamage: () => { damageDealt += 1; },
		setColorAdd: () => {},
		refundWandCharge: () => {},
		isWarlock: () => false,
		kill: () => {},
		rollDamage: () => 5,
		addBuff: (_t, id) => { buffsAdded.push(id); },
		say: () => {},
		message: () => 'hit',
	});
	return { hp: victim.hp, damageDealt, buffsAdded };
}

let failures = 0;
function check(label, cond) {
	if (!cond) { console.log(`FAIL ${label}`); failures++; }
	else console.log(`PASS ${label}`);
}

const immuneResult = run(true);
check('a magicImmune target takes no Fireblast damage', immuneResult.hp === 20 && immuneResult.damageDealt === 0);
check('a magicImmune target gets no burning buff from Fireblast', immuneResult.buffsAdded.length === 0);

const ordinaryResult = run(false);
check('an ordinary target still takes Fireblast damage', ordinaryResult.hp === 15 && ordinaryResult.damageDealt === 1);
check('an ordinary target still catches burning from Fireblast', ordinaryResult.buffsAdded.includes('burning'));

fs.rmSync('tools/scratch/wandEffects-check.mjs', { force: true });
fs.rmSync('tools/scratch/wandEffects-check.mjs.map', { force: true });

if (failures > 0) { console.log(`${failures} check(s) FAILED`); process.exit(1); }
console.log('All WandOfFireblast magicImmune checks passed.');
