// Pins `items/beacon.ts`'s `beaconClearAnchor` (`LloydsBeacon.returnBeacon()`'s mob-displacement,
// shared with the `BeaconOfReturning` spell twin, tag `v3.3.8`). Live-checked in the built game
// (`tools/scratch/beacon-push-livecheck.mjs`: a rat on the anchor cell is pushed aside and the
// hero lands there). Run through `npm run test:beacon`.
import { returnBeaconFlow, useReturningBeaconFlow, type BeaconFlowContext, type BeaconItem, type BeaconMobView } from '../src/items/beacon';
import { LARGE_KINDS, isLargeCreature } from '../src/monsters';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

function context(overrides: Partial<BeaconFlowContext> & { beacon: BeaconItem; occupants?: BeaconMobView[] }): BeaconFlowContext {
 const moved: { id: string; to: string }[] = [];
 const relocated: { x: number; y: number }[] = [];
 const said: string[] = [];
 const occupants = (overrides.occupants ?? []).map((mob) => ({ ...mob }));
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
  creatureAt: (x, y) => occupants.find((mob) => mob.x === x && mob.y === y) ?? null,
  mobsAt: (x, y) => occupants.filter((mob) => mob.x === x && mob.y === y && !mob.isHero),
 isImmovableKind: (kind) => kind === 'statue',
	isLargeKind: (kind, yogFistType) => isLargeCreature(kind, yogFistType),
		randomFreeCellNear: () => ({ x: 0, y: 0 }),
		moveHeroTo: () => undefined,
		playHeroTeleport: () => undefined,
		playCreatureTeleport: (from, to) => { moved.push({ id: `${from.x},${from.y}`, to: `${to.x},${to.y}` }); },
		moveCreatureTo: (x, y, cell) => { const mob = occupants.find((entry) => entry.x === x && entry.y === y); if (mob) { mob.x = cell.x; mob.y = cell.y; } },
  displaceMob: (id, cell) => {
   const mob = occupants.find((entry) => entry.id === id);
   if (mob) { moved.push({ id, to: `${cell.x},${cell.y}` }); mob.x = cell.x; mob.y = cell.y; }
  },
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
 return Object.assign(base, { __moved: moved, __relocated: relocated, __said: said, __occupants: occupants }) as BeaconFlowContext & { __moved: typeof moved; __relocated: typeof relocated; __said: typeof said; __occupants: typeof occupants };
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
  occupants: [{ id: 'rat', x: 5, y: 1, kind: 'rat' }],
  passable: (x, y) => !(x === 4 && y === 1) && !(x === 6 && y === 0),
 }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __moved: { id: string; to: string }[] };
 returnBeaconFlow(ctx);
 check('a movable occupant is displaced and the hero still lands on the anchor', ctx.__relocated.length === 1 && ctx.__relocated[0]!.x === 5 && ctx.__relocated[0]!.y === 1 && ctx.__moved.length === 1);
}
//Java directly changes Mob.pos, so IMMOVABLE does not block beacon displacement
{
 const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
 const ctx = context({
  beacon,
  occupants: [{ id: 'statue', x: 5, y: 1, kind: 'statue' }],
 }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __moved: { id: string; to: string }[]; __occupants: BeaconMobView[] };
 returnBeaconFlow(ctx);
	check('an IMMOVABLE mob is still directly displaced and the hero lands on the anchor', ctx.__relocated.length === 1 && ctx.__relocated[0]!.x === 5 && ctx.__relocated[0]!.y === 1 && ctx.__moved.length === 1 && ctx.__occupants[0]!.y !== 1);
}
//No free neighbour leaves the mob at the anchor; it does not cancel the hero's return.
{
 const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
 const neighbours = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
 const occupants: BeaconMobView[] = [{ id: 'rat', x: 5, y: 1, kind: 'rat' }, ...neighbours.map(([dx,dy], i) => ({ id: `blocker-${i}`, x: 5 + dx!, y: 1 + dy!, kind: 'rat' }))];
 const ctx = context({
  beacon,
  occupants,
 }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __said: string[]; __occupants: BeaconMobView[] };
 returnBeaconFlow(ctx);
 check('a boxed mob stays on the anchor but the hero still returns without no_tele', ctx.__relocated.length === 1 && ctx.__relocated[0]!.x === 5 && ctx.__relocated[0]!.y === 1 && ctx.__occupants[0]!.x === 5 && !ctx.__said.includes('items.scrolls.scrollofteleportation.no_tele'));
}
//the hero occupying its own anchor (never having left) is not treated as an occupant to push
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 105, returnX: 5, returnY: 5 };
 const ctx = context({ beacon, occupants: [{ id: 'hero', x: 5, y: 5, isHero: true }] }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __moved: { id: string; to: string }[] };
 returnBeaconFlow(ctx);
 check('the hero on its own anchor is not treated as a Mob to push', ctx.__relocated.length === 1 && ctx.__moved.length === 0);
}
//NPC subclasses are Mobs, and quest NPCs are registered in Level.mobs.
{
 const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
 const ctx = context({ beacon, occupants: [{ id: 'npc', x: 5, y: 1, kind: 'ghost', isNPC: true }] }) as ReturnType<typeof context> & { __moved: { id: string; to: string }[] };
 returnBeaconFlow(ctx);
	check('artifact mob loop displaces NPCs registered in Level.mobs', ctx.__moved.length === 1 && ctx.__moved[0]!.id === 'npc');
}
//BeaconOfReturning uses its own Char/IMMOVABLE/candidate/refusal algorithm.
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	let consumed = 0;
 const ctx = context({
  beacon,
  occupants: [{ id: 'rat', x: 5, y: 1, kind: 'rat' }],
 	consumeReturningBeacon: () => { consumed++; },
	}) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __occupants: BeaconMobView[] };
	useReturningBeaconFlow(ctx);
	check('the spell twin displaces a movable occupant and is consumed', ctx.__relocated.length === 1 && consumed === 1 && ctx.__occupants[0]!.y !== 1);
}
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const ctx = context({ beacon, occupants: [{ id: 'statue', x: 5, y: 1, kind: 'statue' }] }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __occupants: BeaconMobView[] };
	useReturningBeaconFlow(ctx);
	check('the spell twin moves the hero aside from an IMMOVABLE occupant', ctx.__relocated.length === 1 && !(ctx.__relocated[0]!.x === 5 && ctx.__relocated[0]!.y === 1) && ctx.__occupants[0]!.y === 1);
}
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const neighbours = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
	const occupants: BeaconMobView[] = [{ id: 'rat', x: 5, y: 1, kind: 'rat' }, ...neighbours.map(([dx,dy], i) => ({ id: `blocker-${i}`, x: 5 + dx!, y: 1 + dy!, kind: 'rat' }))];
	let consumed = 0;
	const ctx = context({ beacon, occupants, consumeReturningBeacon: () => { consumed++; } }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __said: string[] };
	useReturningBeaconFlow(ctx);
	check('the spell twin refuses a boxed anchor without consuming or relocating', ctx.__relocated.length === 0 && consumed === 0 && ctx.__said.includes('items.scrolls.scrollofteleportation.no_tele'));
}
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const ctx = context({
		beacon,
		occupants: [{ id: 'shopkeeper', x: 5, y: 1, kind: 'shopkeeper', isNPC: true }],
		isImmovableKind: (kind) => kind === 'statue' || kind === 'shopkeeper' || kind === 'impShopkeeper',
	}) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __moved: { id: string; to: string }[] };
	returnBeaconFlow(ctx);
	check('artifact return directly displaces an immovable NPC because it is a Mob', ctx.__relocated.length === 1 && ctx.__relocated[0]!.x === 5 && ctx.__moved.length === 1);
}

//A LARGE occupant is only pushed into open space (`WarpBeacon.returnBeacon()`'s
//`!LARGE || openSpace[cell]` clause): with only a walled-in neighbour passable, the
//spell twin refuses without consuming, while a small mob in the same layout still moves.
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const passable = (x: number, y: number): boolean => (x === 5 && y === 1) || (x === 5 && y === 0);
	let consumed = 0;
	const ctx = context({ beacon, occupants: [{ id: 'golem', x: 5, y: 1, kind: 'golem' }], passable, consumeReturningBeacon: () => { consumed++; } }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __said: string[]; __occupants: BeaconMobView[] };
	useReturningBeaconFlow(ctx);
	check('the spell twin refuses a LARGE occupant with no open-space neighbour', ctx.__relocated.length === 0 && consumed === 0 && ctx.__said.includes('items.scrolls.scrollofteleportation.no_tele') && ctx.__occupants[0]!.x === 5 && ctx.__occupants[0]!.y === 1);
}
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const passable = (x: number, y: number): boolean => (x === 5 && y === 1) || (x === 5 && y === 0);
	let consumed = 0;
	const ctx = context({ beacon, occupants: [{ id: 'rat', x: 5, y: 1, kind: 'rat' }], passable, consumeReturningBeacon: () => { consumed++; } }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __occupants: BeaconMobView[] };
	useReturningBeaconFlow(ctx);
	check('a small occupant in the same walled-in layout is still pushed', ctx.__relocated.length === 1 && consumed === 1 && (ctx.__occupants[0]!.x !== 5 || ctx.__occupants[0]!.y !== 1));
}
{
	const beacon: BeaconItem = { returnDepth: 3, returnBranch: 0, returnPos: 25, returnX: 5, returnY: 1 };
	const passable = (x: number, y: number): boolean => x >= 4 && x <= 6 && y >= 0 && y <= 2;
	let consumed = 0;
	const ctx = context({ beacon, occupants: [{ id: 'golem', x: 5, y: 1, kind: 'golem' }], passable, consumeReturningBeacon: () => { consumed++; } }) as ReturnType<typeof context> & { __relocated: { x: number; y: number }[]; __occupants: BeaconMobView[] };
	useReturningBeaconFlow(ctx);
	check('a LARGE occupant with open space around is pushed and the cast is consumed', ctx.__relocated.length === 1 && consumed === 1 && (ctx.__occupants[0]!.x !== 5 || ctx.__occupants[0]!.y !== 1));
}

//`Char.Property.LARGE` holders at tag v3.3.8: DM200 (inherited by DM201), DM300,
//Golem and the Ghost; the RustedFist is LARGE by subtype, gated in `isLargeCreature`.
{
	check('LARGE_KINDS carries Java holders and nothing small', (['dm200', 'dm201', 'dm300', 'ghost', 'golem'] as const).every((kind) => LARGE_KINDS.has(kind)) && !LARGE_KINDS.has('rat') && !LARGE_KINDS.has('yogFist'));
	check('isLargeCreature gates the rusted subtype', isLargeCreature('golem', undefined) && isLargeCreature('dm201', undefined) && isLargeCreature('ghost', undefined) && isLargeCreature('yogFist', 'rusted') && !isLargeCreature('yogFist', 'burning') && !isLargeCreature('yogFist', undefined) && !isLargeCreature('rat', undefined) && !isLargeCreature(undefined, undefined));
}

if (failed > 0) { console.error(`${failed} beacon-push check(s) failed`); process.exit(1); }
console.log('verifyBeaconPush: OK');
