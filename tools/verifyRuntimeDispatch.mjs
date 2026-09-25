// Guards the T60/B6 invariant: game code dispatches state-mutating simulation
// commands through adapters/gameSimulation.ts (the single SimulationRuntime),
// never by importing the pure planners directly.
//
// In scope (must dispatch): resolveAttack, finishHeroTurn, planHeroAction,
// planMovement, planSearch, advanceHunger, exertHunger.
// Deliberately still direct (pure queries / deterministic value functions /
// shared constants - journaling them would add nothing): passiveSearchChance,
// advanceWellFed, STARVING/HUNGRY, MOVES/MEAL_TALENTS, per-domain formula
// tables, and `import type` references. Tests under tools/ pin the pure
// functions directly by design and are out of scope, as are simulation/ and
// adapters/ themselves.
//
// Run: node tools/verifyRuntimeDispatch.mjs (wired into `npm run check`).
// Exit 0 when every assertion holds, 1 with the offending lines otherwise.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
let failures = 0;
function check(label, ok, detail = '') {
	if (ok) console.log(`PASS ${label}`);
	else { console.log(`FAIL ${label}${detail ? ` - ${detail}` : ''}`); failures++; }
}

// Strip strings first (so URLs and text survive), then comments, so only real
// code is scanned. Template placeholders cannot hide an import clause.
function codeOnly(src) {
	return src
		.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, (m) => (m.startsWith('`') ? '``' : "''"))
		.replace(/\/\/[^\n]*/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '');
}

const BANNED = ['resolveAttack', 'finishHeroTurn', 'planHeroAction', 'planMovement', 'planSearch', 'advanceHunger', 'exertHunger'];
const gameDirs = ['scenes', 'items'];
const gameFiles = [];
for (const dir of gameDirs) {
	const walk = (at) => {
		for (const entry of readdirSync(at)) {
			const full = join(at, entry);
			if (statSync(full).isDirectory()) walk(full);
			else if (entry.endsWith('.ts')) gameFiles.push(full);
		}
	};
	walk(join(root, dir));
}
for (const entry of readdirSync(root)) {
	if (entry.endsWith('.ts')) gameFiles.push(join(root, entry));
}

const offenders = [];
const importRe = /(?:import|export)\s+(?!type\b)([\s\S]*?)\s+from\s+'([^']+)'/g;
for (const file of gameFiles) {
	const src = codeOnly(readFileSync(file, 'utf8'));
	let m;
	while ((m = importRe.exec(src)) !== null) {
		const [, clause, mod] = m;
		if (!/(^|\/)simulation\//.test(mod) && !mod.startsWith('./simulation/') && !mod.startsWith('../simulation/')) continue;
		const names = clause.split(',').map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()).filter(Boolean);
		for (const name of names) {
			if (BANNED.includes(name)) offenders.push(`${file.replace(root, 'src/')}: imports ${name} from ${mod}`);
		}
	}
}
check('no game file imports a runtime-covered planner directly', offenders.length === 0, offenders.slice(0, 5).join('; '));

// The one-runtime shape: per-domain facades re-export from gameSimulation,
// and it handles every command kind.
const facadeDir = join(root, 'adapters');
const facadeReads = (name) => readFileSync(join(facadeDir, name), 'utf8');
for (const facade of ['attackSimulation.ts', 'heroActionSimulation.ts', 'hungerSimulation.ts', 'movementSimulation.ts', 'searchSimulation.ts']) {
	check(`${facade} re-exports from the shared runtime`, facadeReads(facade).includes("from './gameSimulation'"));
}
check('sceneSimulation routes monster turns through the shared runtime',
	facadeReads('sceneSimulation.ts').includes("from './gameSimulation'"));
const rule = readFileSync(join(facadeDir, 'gameSimulation.ts'), 'utf8');
for (const kind of ['attack', 'hero-turn', 'monster-turn', 'hunger', 'hunger-exertion', 'hero-action', 'movement', 'search']) {
	check(`shared runtime handles '${kind}'`, rule.includes(`case '${kind}':`));
}

if (failures) { console.log(`verifyRuntimeDispatch: ${failures} FAILURE(S)`); process.exit(1); }
console.log('verifyRuntimeDispatch: OK');
