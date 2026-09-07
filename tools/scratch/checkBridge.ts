// SCRATCH - integration check for spdLevelGen/gameBridge.ts, independent of the browser.
//
// Verifies the things a renderer/gameplay pass depends on, for every ported floor of every test
// seed: that the terrain mapping covers every emitted Terrain value, that a floor has exactly one
// entrance and one exit, and - the load-bearing one - that the exit is actually REACHABLE from
// the entrance through the *mapped* terrain, bumping closed doors open on the way.
//
// A byte-exact tile grid is worthless if the mapping onto this port's eight kinds seals the
// stairs behind a wall, and that is exactly the class of bug pixels would show but type-checking
// would not.
import { portedFloor, resetPortedRun, toGameTerrain, PORTED_DEPTHS, type GameKindCodes } from '../../src/spdLevelGen/gameBridge.ts';

const WALL = 0, FLOOR = 1, TRAP = 2, WATER = 3, DOOR = 4, GRASS = 5, HIGH_GRASS = 6, DOOR_CLOSED = 7;
const CODES: GameKindCodes = {
	wall: WALL, floor: FLOOR, trap: TRAP, water: WATER,
	door: DOOR, grass: GRASS, highGrass: HIGH_GRASS, doorClosed: DOOR_CLOSED,
};
const NAME = ['WALL', 'FLOOR', 'TRAP', 'WATER', 'DOOR', 'GRASS', 'HIGH_GRASS', 'DOOR_CLOSED'];

// walkable for reachability: everything passable, plus DOOR_CLOSED (bumping opens it) - but NOT
// WALL, and secret doors are disguised as WALL so they are correctly excluded (a floor must not
// depend on searching one out to be completable)
const WALKABLE = new Set([FLOOR, TRAP, WATER, DOOR, GRASS, HIGH_GRASS, DOOR_CLOSED]);

const seeds = [123456789n, 1n, 42n, 999999999999n];
let failures = 0;

for (const seed of seeds) {
	resetPortedRun();
	for (const depth of PORTED_DEPTHS) {
		const floor = portedFloor(seed, depth);
		const t = toGameTerrain(floor, CODES);
		const { width: w, height: h } = floor;

		const counts = new Array(8).fill(0);
		for (const v of t) counts[v]++;

		const problems: string[] = [];
		if (!floor.entrance) problems.push('NO ENTRANCE TILE');
		if (!floor.exit) problems.push('no exit tile');

		let reached = 0;
		let exitReached = false;
		if (floor.entrance) {
			const start = floor.entrance.x + floor.entrance.y * w;
			if (!WALKABLE.has(t[start])) problems.push(`entrance cell is ${NAME[t[start]]}`);
			const seen = new Uint8Array(w * h);
			const queue = [start];
			seen[start] = 1;
			while (queue.length) {
				const cell = queue.pop()!;
				reached++;
				const x = cell % w, y = (cell - (cell % w)) / w;
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
					const nx = x + dx, ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					const n = nx + ny * w;
					if (seen[n] || !WALKABLE.has(t[n])) continue;
					seen[n] = 1;
					queue.push(n);
				}
			}
			if (floor.exit && !seen[floor.exit.x + floor.exit.y * w]) problems.push('EXIT UNREACHABLE FROM ENTRANCE');
			else if (floor.exit) exitReached = true;
		}

		// Decisive second pass: treat every SECRET_DOOR cell as walkable (i.e. assume the player
		// searched it out). If the exit becomes reachable, the seal above is Java's own hidden-door
		// tutorial, not a terrain-mapping bug that walled the stairs off.
		let exitReachedIfSearched = false;
		if (floor.entrance && floor.exit) {
			const secret = new Set(floor.secretDoors.map(d => d.x + d.y * w));
			const start = floor.entrance.x + floor.entrance.y * w;
			const seen = new Uint8Array(w * h);
			const queue = [start];
			seen[start] = 1;
			while (queue.length) {
				const cell = queue.pop()!;
				const x = cell % w, y = (cell - (cell % w)) / w;
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
					const nx = x + dx, ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					const n = nx + ny * w;
					if (seen[n] || !(WALKABLE.has(t[n]) || secret.has(n))) continue;
					seen[n] = 1;
					queue.push(n);
				}
			}
			exitReachedIfSearched = seen[floor.exit.x + floor.exit.y * w] === 1;
		}
		if (problems.length && exitReachedIfSearched) problems.push('(but reachable once secret doors are searched out)');

		const walkableTotal = [...t].filter(v => WALKABLE.has(v)).length;
		const orphaned = walkableTotal - reached;
		// Some orphaning is legitimate: a secret room is sealed behind a SECRET_DOOR (disguised
		// as WALL) until searched out, and a crystal vault is sealed by a key this port never
		// grants. Those are reported, not failed.
		const sealed = floor.secretDoors.length + floor.doors.filter(d => d.crystal).length;

		if (problems.length) failures++;
		const kindSummary = counts.map((c, i) => c ? `${NAME[i]}:${c}` : '').filter(Boolean).join(' ');
		console.log(
			`${seed}:${depth} ${w}x${h} reach=${reached}/${walkableTotal} orphan=${orphaned}` +
			` sealedDoors=${sealed} doors=${floor.doors.length} traps=${floor.traps.length}` +
			` exit=${exitReached ? 'REACHABLE' : 'n/a'}` +
			(problems.length ? `  ** ${problems.join('; ')} **` : '') +
			`\n    ${kindSummary}`
		);
	}
}
console.log(failures ? `\n${failures} floors with problems` : '\nno structural problems on any ported floor');
