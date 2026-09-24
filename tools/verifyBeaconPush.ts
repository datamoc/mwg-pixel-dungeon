// Pins `items/beacon.ts`'s `beaconClearAnchor` (`LloydsBeacon.returnBeacon()`'s mob-displacement,
// shared with the `BeaconOfReturning` spell twin, tag `v3.3.8`). Live-checked in the built game
// (`tools/scratch/beacon-push-livecheck.mjs`: a rat on the anchor cell is pushed aside and the
// hero lands there). Run through `npm run test:beacon`.
import { returnBeaconFlow, useReturningBeaconFlow, type BeaconFlowContext, type BeaconItem } from '../src/items/beacon';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

function context(overrides: Partial<BeaconFlowContext> & { beacon: BeaconItem; occupantAt?: (x: number, y: number) => { kind?: string; isHero?: boolean } | null }): BeaconFlowContext {
	const moved: { from: string; to: string }[] = [];
	const relocated: { x: number; y: number }[] = [];
	const said: string[] = [];
	const base: BeaconFlowContext = {
		depth: 3,
		heroPos: { x: 5, y: 5 },
		miningBranchActive: false,
		beaconOf: () => overrides.beacon,
		returningBeaconOf: () => overrides.beacon,
		consumeReturningBeacon: () => undefined,
		beaconTitle: () => 'Beacon',
		openPicker: () => undefined,
		beginAim: () => undefined,
		cellIndex: (x, y) => y * 20 + x,
		gridWidth: () => 20,
		isBossDepth: () => false,
		hasAmulet: () => false,
		creatureAt: (x, y) => overrides.occupantAt?.(x, y) ?? null,
		isImmovableKind: (kind) => kind === 'statue',
		randomFreeCellNear: () => ({ x: 0, y: 0 }),
		moveHeroTo: () => undefined,
		playHeroTeleport: () => undefined,
		playCreatureTeleport: (from, to) => { moved.push({ from: `${from.x},${from.y}`, to: `${to.x},${to.y}` }); },
		moveCreatureTo: () => undefined,
		passable: () => true,
		relocateHero: (x, y) => { relocated.push({ x, y }); },
		travelToDepth: () => undefined,
		spendTurn: () => undefined,
		clearRoots: () => undefined,
		dispelInvisibility: () => undefined,
		say: (line) => { said.push(line); },
		t: (key) => key,
		...overrides,
	};
	return Object.assign(base, { __moved: moved, __relocated: relocated, __said: said }) as BeaconFlowContext & { __moved: typeof moved; __relocated: typeof relocated; __said: typeof said };
}

//an empty anchor: straight relocation, no push
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const ctx = context({ beacon }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[] };
	returnBeaconFlow(ctx);
	check('an empty anchor relocates straight there', ctx.__relocated.length === 1 && ctx.__relocated[0]!.x === 5 && ctx.__relocated[0]!.y === 1);
}
//a movable occupant is pushed to a free neighbour, the hero still lands on the anchor
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const ctx = context({
		beacon,
		occupantAt: (x, y) => (x === 5 && y === 1 ? { kind: 'rat' } : null),
		passable: (x, y) => !(x === 4 && y === 1) && !(x === 6 && y === 0),
	}) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __moved: { from: string; to: string }[] };
	returnBeaconFlow(ctx);
	check('a movable occupant is displaced and the hero still lands on the anchor', ctx.__relocated.length === 1 && ctx.__relocated[0]!.x === 5 && ctx.__relocated[0]!.y === 1 && ctx.__moved.length === 1);
}
//an immovable occupant pushes the hero to a free neighbour instead
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const ctx = context({
		beacon,
		occupantAt: (x, y) => (x === 5 && y === 1 ? { kind: 'statue' } : null),
	}) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __moved: { from: string; to: string }[] };
	returnBeaconFlow(ctx);
	check('an immovable occupant pushes the hero aside instead of moving', ctx.__relocated.length === 1 && !(ctx.__relocated[0]!.x === 5 && ctx.__relocated[0]!.y === 1) && ctx.__moved.length === 0);
}
//no free neighbour anywhere: the whole return refuses
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const ctx = context({
		beacon,
		occupantAt: (x, y) => (x === 5 && y === 1 ? { kind: 'rat' } : (Math.abs(x - 5) <= 1 && Math.abs(y - 1) <= 1) ? { kind: 'blocker' } : null),
	}) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __said: string[] };
	returnBeaconFlow(ctx);
	check('no free neighbour refuses the whole return, not just the push', ctx.__relocated.length === 0 && ctx.__said.includes('items.scrolls.scrollofteleportation.no_tele'));
}
//the hero occupying its own anchor (never having left) is not treated as an occupant to push
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 105, returnX: 5, returnY: 5 };
	const ctx = context({ beacon, occupantAt: (x, y) => (x === 5 && y === 5 ? { isHero: true } : null) }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[] };
	returnBeaconFlow(ctx);
	check('the hero on its own anchor is not pushed', ctx.__relocated.length === 1);
}
//the BeaconOfReturning spell twin shares the same push and consumes on a successful return
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	let consumed = 0;
	const ctx = context({
		beacon,
		occupantAt: (x, y) => (x === 5 && y === 1 ? { kind: 'rat' } : null),
		consumeReturningBeacon: () => { consumed++; },
	}) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[] };
	useReturningBeaconFlow(ctx);
	check('the spell twin pushes the occupant too and is consumed', ctx.__relocated.length === 1 && consumed === 1);
}

if (failed > 0) { console.error(`${failed} beacon-push check(s) failed`); process.exit(1); }
console.log('verifyBeaconPush: OK');
