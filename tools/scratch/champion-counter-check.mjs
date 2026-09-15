import { execSync } from 'node:child_process';
import fs from 'node:fs';

execSync('npx esbuild src/actors/monsterSpawn.ts --bundle --platform=node --format=esm --packages=external --outfile=tools/scratch/monsterSpawn-check.mjs', { stdio: 'inherit' });
const { rollForChampion } = await import('./monsterSpawn-check.mjs');

let failures = 0;
function check(label, cond) {
	if (!cond) { console.log(`FAIL ${label}`); failures++; }
	else console.log(`PASS ${label}`);
}

// Challenge inactive: never assigns, but the counter still ticks down and wraps (Java always
// runs the countdown regardless of whether the challenge is on).
{
	let counter = 0;
	let anyChampion = false;
	for (let i = 0; i < 32; i++) {
		const result = rollForChampion(counter, false);
		counter = result.mobsToChampion;
		if (result.champion) anyChampion = true;
	}
	check('challenge inactive: never assigns a champion', !anyChampion);
}

// Challenge active: exactly every 8th eligible spawn becomes a champion - deterministic, not a
// probability roll.
{
	let counter = 0;
	const champions = [];
	for (let i = 1; i <= 24; i++) {
		const result = rollForChampion(counter, true);
		counter = result.mobsToChampion;
		champions.push(result.champion !== null ? i : null);
	}
	const hits = champions.filter((x) => x !== null);
	check('challenge active: exactly every 8th spawn is a champion', JSON.stringify(hits) === JSON.stringify([8, 16, 24]));
}

// A mid-sequence counter (e.g. loaded from a save) still counts down correctly to zero.
{
	const result = rollForChampion(3, true);
	check('a save-restored counter of 3 needs two more spawns, not eight', result.mobsToChampion === 2 && result.champion === null);
}

// The champion type, when assigned, is one of the real six.
{
	const result = rollForChampion(1, true);
	check('the assigned champion type is one of the real six', ['blessed', 'blazing', 'giant', 'growing', 'antimagic', 'projecting'].includes(result.champion));
}

fs.rmSync('tools/scratch/monsterSpawn-check.mjs', { force: true });
fs.rmSync('tools/scratch/monsterSpawn-check.mjs.map', { force: true });

if (failures > 0) { console.log(`${failures} check(s) FAILED`); process.exit(1); }
console.log('All champion-counter checks passed.');
