// Pins `items/skeletonKey.ts` against `SkeletonKey.java` (tag `v3.3.8`): the charge/exp arithmetic,
// the recharge curve, the `INSERT` targeter's whole decision tree (every lock kind, the door lock's
// push-aside, the wall's shape) and the `KeyReplacementTracker` excess-key rule. The scene's terrain,
// door and chest wiring is pinned by source checks in `verifySimulation`'s Trinity/skeleton cases and
// was live-checked in a browser. Run through `npm run test:skeletonkey`.
import {
	CIRCLE8, confirmSkeletonKeyFlow, newKeyReplacementTracker, processKeyLockOpened, skeletonKeyAddCharge, skeletonKeyChargeCap,
	skeletonKeyGainExp, skeletonKeyTickRecharge, useSkeletonKeyFlow,
	type SkeletonKeyFlowContext, type SkeletonKeyItem, type SkeletonKeyMob, type SkeletonKeyTarget,
} from '../src/items/skeletonKey';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let failed = 0;
const check = (name: string, ok: boolean, detail = ''): void => {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ` - ${detail}`}`);
	if (!ok) failed++;
};
const near = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;

//charge cap: 3 + level/2 (int division)
check('chargeCap 3 + level/2', [0, 1, 2, 3, 10].map(skeletonKeyChargeCap).join() === '3,3,4,4,8');

//gainExp: threshold 4 + level, carry-over, cap at 10
{
	const key: SkeletonKeyItem = { level: 0 };
	check('exp 4 does not level (needs > 4)', !skeletonKeyGainExp(key, 4) && key.exp === 4 && key.level === 0);
	check('exp 5 levels and carries 1', skeletonKeyGainExp(key, 1) && key.level === 1 && key.exp === 1);
	const maxed: SkeletonKeyItem = { level: 10, exp: 0 };
	check('no exp at the level cap', !skeletonKeyGainExp(maxed, 99) && maxed.exp === 0);
}

//recharge: 1/(120 - missing*7.5) per turn; 60 turns at 0/8, 120 at full-1
{
	const key: SkeletonKeyItem = { level: 10, charge: 0 };
	for (let i = 0; i < 59; i++) skeletonKeyTickRecharge(key, 1, false, true);
	check('level 10 at 0/8 charges in about 60 turns', key.charge === 0);
	skeletonKeyTickRecharge(key, 1, false, true);
	skeletonKeyTickRecharge(key, 1, false, true);
	check('...then a charge', key.charge === 1);
	const guarded = (item: SkeletonKeyItem, imm: boolean, regen: boolean): number => {
		for (let i = 0; i < 400; i++) skeletonKeyTickRecharge(item, 1, imm, regen);
		return item.charge ?? -1;
	};
	check('cursed key never recharges', guarded({ level: 0, charge: 0, cursed: true }, false, true) === 0);
	check('MagicImmune blocks recharge', guarded({ level: 0, charge: 0 }, true, true) === 0);
	check('LockedFloor (regen off) blocks recharge', guarded({ level: 0, charge: 0 }, false, false) === 0);
	check('a normal key fills to the cap and stops', guarded({ level: 0, charge: 0 }, false, true) === 3);
	const fast: SkeletonKeyItem = { level: 0, charge: 0 };
	const slow: SkeletonKeyItem = { level: 0, charge: 0 };
	for (let i = 0; i < 50; i++) { skeletonKeyTickRecharge(fast, 2, false, true); skeletonKeyTickRecharge(slow, 1, false, true); }
	check('energy multiplier scales the trickle', (fast.charge ?? 0) >= 1 && slow.charge === 0);
	const boosted: SkeletonKeyItem = { level: 0, charge: 0 };
	skeletonKeyAddCharge(boosted, 10, false);
	check('charge() adds 0.133 per unit', near(boosted.partialCharge ?? 0, 1.33 - 1) && boosted.charge === 1);
}

//the targeter, on a scripted level
type Cell = { x: number; y: number };
interface World {
	hero: Cell;
	terrain: Map<string, SkeletonKeyTarget>;
	solid: Set<string>;
	mobs: Map<string, SkeletonKeyMob>;
	locked?: boolean;
	log: string[];
	opened: string[];
	walls: string[];
	locks: string[];
	pushes: string[];
	tracked: string[];
	turns: number;
	rings: number;
	key: SkeletonKeyItem;
}
const id = (c: Cell): string => `${c.x},${c.y}`;
function world(key: SkeletonKeyItem, hero: Cell = { x: 5, y: 5 }): World {
	return { hero, terrain: new Map(), solid: new Set(), mobs: new Map(), log: [], opened: [], walls: [], locks: [], pushes: [], tracked: [], turns: 0, rings: 0, key };
}
function context(w: World): SkeletonKeyFlowContext {
	return {
		magicImmune: false,
		heroPos: w.hero,
		get levelLocked() { return w.locked === true; },
		levelSize: { width: 20, height: 20 },
		keyOf: () => w.key,
		beginAim: () => undefined,
		isCellKnown: () => true,
		targetAt: (x, y) => w.terrain.get(`${x},${y}`) ?? 'other',
		isSolid: (x, y) => w.solid.has(`${x},${y}`),
		isOpenSpace: () => true,
		mobAt: (x, y) => w.mobs.get(`${x},${y}`) ?? null,
		trueDistance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
		openLock: (cell, kind) => { w.opened.push(`${kind}@${id(cell)}`); },
		lockDoor: (cell) => { w.locks.push(id(cell)); },
		pushMob: (from, to) => { w.pushes.push(`${id(from)}->${id(to)}`); },
		placeWall: (cell, knock) => { w.walls.push(`${id(cell)}/${knock.join(',')}`); },
		noteLockOpened: (kind) => { w.tracked.push(kind); },
		armEnhancedRings: () => { w.rings++; },
		dispelInvisibility: () => undefined,
		observe: () => undefined,
		spendTurn: () => { w.turns++; },
		say: (line) => { w.log.push(line); },
		t: (key) => key.replace('port.skeletonkey.', ''),
	};
}
const at = (w: World, dx: number, dy: number): Cell => ({ x: w.hero.x + dx, y: w.hero.y + dy });
const aim = (w: World, target: Cell): void => confirmSkeletonKeyFlow(context(w), target);

{
	//iron door: 1 charge, exp 2+1, spends the turn, tells the tracker
	const w = world({ level: 0, charge: 3 });
	w.terrain.set(id(at(w, 1, 0)), 'lockedDoor');
	aim(w, at(w, 1, 0));
	check('iron door opens for 1 charge', w.opened.join() === 'iron@6,5' && w.key.charge === 2 && w.turns === 1 && w.tracked.join() === 'iron' && w.rings === 1);
	check('iron door awards exp 3', w.key.exp === 3);
}
{
	const w = world({ level: 0, charge: 0 });
	w.terrain.set(id(at(w, 1, 0)), 'lockedDoor');
	aim(w, at(w, 1, 0));
	check('iron door with no charge says iron_charges and spends nothing', w.log.join() === 'iron_charges' && w.turns === 0 && w.opened.length === 0);
}
{
	const w = world({ level: 0, charge: 3 });
	w.locked = true;
	w.terrain.set(id(at(w, 1, 0)), 'lockedDoor');
	aim(w, at(w, 1, 0));
	check('a sealed boss level refuses iron doors (wont_open)', w.log.join() === 'wont_open' && w.opened.length === 0);
	const exit = world({ level: 0, charge: 3 });
	exit.terrain.set(id(at(exit, 0, -1)), 'lockedExit');
	aim(exit, at(exit, 0, -1));
	check('a locked exit never opens', exit.log.join() === 'wont_open' && exit.opened.length === 0);
}
{
	const w = world({ level: 0, charge: 3 });
	w.terrain.set(id(at(w, 0, 1)), 'heroLockedDoor');
	aim(w, at(w, 0, 1));
	check('a hero-locked door opens free, no charge, no artifact use', w.opened.join() === 'hero@5,6' && w.key.charge === 3 && w.turns === 1 && w.rings === 0 && w.tracked.length === 0);
}
{
	const w = world({ level: 0, charge: 4 });
	w.terrain.set(id(at(w, -1, 0)), 'crystalDoor');
	aim(w, at(w, -1, 0));
	check('crystal door needs 5', w.log.join() === 'crystal_charges' && w.opened.length === 0);
	const full: SkeletonKeyItem = { level: 2, charge: 5, exp: 0 };
	const f = world(full);
	f.terrain.set(id(at(f, -1, 0)), 'crystalDoor');
	aim(f, at(f, -1, 0));
	check('crystal door opens for 5, exp 7, tracker crystal', f.opened.join() === 'crystal@4,5' && full.charge === 0 && full.exp === 7 - 6 && full.level === 3 && f.tracked.join() === 'crystal');
}
{
	const w = world({ level: 0, charge: 3 });
	w.terrain.set(id(at(w, 0, -1)), 'lockedChest');
	w.terrain.set(id(at(w, 1, 1)), 'crystalChest');
	aim(w, at(w, 0, -1));
	check('gold chest opens for 2 and awards 4', w.opened.join() === 'goldChest@5,4' && w.key.charge === 1 && w.key.exp === 4 && w.tracked.join() === 'golden');
	aim(w, at(w, 1, 1));
	check('crystal chest refuses on 1 charge', w.log.at(-1) === 'crystal_charges' && w.opened.length === 1);
}
{
	//locking a door: 2 charges, exp 2, pushes a mob to the closest cell farther than the door
	const w = world({ level: 0, charge: 3 });
	w.terrain.set(id(at(w, 1, 0)), 'door');
	aim(w, at(w, 1, 0));
	check('door locks for 2 charges', w.locks.join() === '6,5' && w.key.charge === 1 && w.key.exp === 2 && w.turns === 1);
	const m = world({ level: 0, charge: 3 });
	m.terrain.set(id(at(m, 1, 0)), 'door');
	m.mobs.set(id(at(m, 1, 0)), { enemy: true, immovable: false, large: false });
	aim(m, at(m, 1, 0));
	check('a mob in the doorway is pushed to the nearest farther cell (N wins the N/S tie, NEIGHBOURS8 order)', m.pushes.join() === '6,5->6,4' && m.locks.length === 1);
	const stuck = world({ level: 0, charge: 3 });
	stuck.terrain.set(id(at(stuck, 1, 0)), 'door');
	stuck.mobs.set(id(at(stuck, 1, 0)), { enemy: true, immovable: true, large: false });
	aim(stuck, at(stuck, 1, 0));
	check('an immovable mob blocks the lock (lock_no_space)', stuck.log.join() === 'lock_no_space' && stuck.locks.length === 0 && stuck.turns === 0);
	const boxed = world({ level: 0, charge: 3 });
	boxed.terrain.set(id(at(boxed, 1, 0)), 'door');
	boxed.mobs.set(id(at(boxed, 1, 0)), { enemy: true, immovable: false, large: false });
	for (const [dx, dy] of CIRCLE8) boxed.solid.add(`${6 + dx},${5 + dy}`);
	aim(boxed, at(boxed, 1, 0));
	check('no free cell behind the door refuses', boxed.log.join() === 'lock_no_space');
}
{
	//walls: cardinal = 3 cells, diagonal = 5 cells; costs 2; a solid neighbour refuses
	const w = world({ level: 0, charge: 3 });
	aim(w, at(w, 5, 0));
	check('cardinal wall is three cells (E, NE, SE)', w.walls.join() === '6,5/1,0,6,4/1,0,6,6/1,0' && w.key.charge === 1 && w.turns === 1);
	const d = world({ level: 0, charge: 3 });
	aim(d, at(d, 4, 4));
	check('diagonal wall is five cells', d.walls.length === 5 && d.walls[0] === '6,6/1,1');
	const s = world({ level: 0, charge: 3 });
	s.solid.add('6,5');
	aim(s, at(s, 5, 0));
	check('a solid neighbour in that direction refuses (invalid_target)', s.log.join() === 'invalid_target' && s.walls.length === 0 && s.turns === 0);
	const c = world({ level: 0, charge: 1 });
	aim(c, at(c, 5, 0));
	check('a wall needs 2 charges (wall_charges)', c.log.join() === 'wall_charges' && c.walls.length === 0);
	const self = world({ level: 0, charge: 3 });
	aim(self, self.hero);
	check('targeting yourself is invalid', self.log.join() === 'invalid_target');
}
{
	const w = world({ level: 0, charge: 3, cursed: true });
	useSkeletonKeyFlow(context(w));
	check('a cursed key refuses to open the selector', w.log.join() === 'cursed');
	const ok = world({ level: 0, charge: 3 });
	let aimed = 0;
	const ctx = { ...context(ok), beginAim: () => { aimed++; } } as SkeletonKeyFlowContext;
	useSkeletonKeyFlow(ctx);
	check('an uncursed key opens the selector with a prompt', aimed === 1 && ok.log.join() === 'prompt');
}

//KeyReplacementTracker: excess keys are discarded once fewer locks remain than keys held
{
	const tracker = newKeyReplacementTracker();
	const out = processKeyLockOpened(tracker, 3, 'iron', { iron: 2, golden: 1, crystal: 0 }, { iron: 2, golden: 1, crystal: 0 });
	check('first use measures the depth and subtracts the lock just opened', tracker.iron[3] === 1 && tracker.golden[3] === 1 && out.iron === 1 && out.golden === 0);
	const again = processKeyLockOpened(tracker, 3, 'iron', { iron: 0, golden: 0, crystal: 0 }, { iron: 1, golden: 1, crystal: 0 });
	check('later uses reuse the stored counts and never re-measure', tracker.iron[3] === 0 && again.iron === 1 && again.golden === 0);
}

// `placeWall`'s shove is scene-side (terrain + actors), so this pins its gate at
// source level: Java knocks only ENEMY occupants, with Mimic's hidden-neutral state
// retained; for an eligible enemy `throwChar` refuses rooted and IMMOVABLE actors.
{
	const source = readFileSync(join(process.cwd(), 'src/scenes/dungeon/hero/skeletonKeyScene.ts'), 'utf8');
	const at = source.indexOf('skeletonKeyPlaceWall(this: DungeonScene');
	const block = source.slice(at, source.indexOf('\n\t},', at));
	check('wall shove skips hero, allies, NPCs, rooted and immovables',
		block.includes('!mob.isHero && !mob.isAlly && !mob.isNPC')
		&& block.includes("mob.buffs['roots'] === undefined")
		&& block.includes('!IMMOVABLE_KINDS.has(mob.kind)'));
	check('hidden neutral Mimics are not shoved until revealed',
		block.includes("const hiddenMimic = (mob?.kind === 'mimic' || mob?.kind === 'crystalMimic') && mob.mimicRevealed === false")
		&& block.includes('!hiddenMimic && !mob.isHero'));
	check('the wall still raises over an unshoved occupant',
		block.includes('this.keyWalls.set(idx, { turns, original:'));
}

if (failed > 0) {
	console.error(`${failed} skeleton key check(s) failed`);
	process.exit(1);
}
console.log('verifySkeletonKey: OK');
