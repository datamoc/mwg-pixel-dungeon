/**
 * Skeleton Key's own rules (`items/artifacts/SkeletonKey.java`, tag `v3.3.8`), split out of the scene
 * so they can be checked without a live game - the same split `items/talisman.ts` and
 * `items/chains.ts` use. The scene owns the terrain, doors, chests, temporary walls and the turn
 * clock; this module owns the charge/exp arithmetic, the `INSERT` targeter's decision tree
 * (`targeter.onSelect`) and the `KeyReplacementTracker` bookkeeping.
 *
 * The artifact has one active action (`AC_INSERT`: pick an adjacent lock to open or close, or a
 * direction to raise a three-cell temporary wall) and a passive recharge (`keyRecharge`, 60-120
 * turns per charge). Every number is an MWL `skeletonkey*` row in `item-rules.mwl`.
 */
import { mwlItemEffectValue } from '../mwlContent';

export type SkeletonKeyItem = {
	level?: number;
	/** Java's `charge` (an int); absent on a freshly minted key, which starts full (`charge = chargeCap`). */
	charge?: number;
	partialCharge?: number;
	/** Java's `exp`: progress toward the next artifact level. */
	exp?: number;
	cursed?: boolean;
};

const value = (effect: string): number => mwlItemEffectValue('skeletonkey', effect);

export function skeletonKeyLevelCap(): number {
	return value('levelCap');
}

/** `chargeCap = 3 + level()/2` (int division), re-derived by `upgrade()` as `3 + (level()+1)/2` before the bump. */
export function skeletonKeyChargeCap(level: number): number {
	return value('chargeCapBase') + Math.floor(level / 2);
}

/** A key with no stored charge is full: the constructor block sets `charge = chargeCap`. */
export function skeletonKeyCharge(item: SkeletonKeyItem): number {
	return item.charge ?? skeletonKeyChargeCap(item.level ?? 0);
}

/**
 * `SkeletonKey.gainExp()`: nothing at the level cap; otherwise `exp += xpGain` and, once
 * `exp > 4 + level()`, `exp -= 4 + level()` and `upgrade()` (which also widens `chargeCap`).
 * @returns whether the key levelled up (the caller prints `levelup`).
 */
export function skeletonKeyGainExp(item: SkeletonKeyItem, xpGain: number): boolean {
	const level = item.level ?? 0;
	if (level >= skeletonKeyLevelCap()) return false;
	item.exp = (item.exp ?? 0) + xpGain;
	const toLevel = value('expToLevelBase') + level;
	if (item.exp > toLevel) {
		item.exp -= toLevel;
		item.level = level + 1;
		return true;
	}
	return false;
}

/**
 * `keyRecharge.act()`, one whole turn: while below the cap, uncursed, un-immunized and with
 * `Regeneration.regenOn()`, gain `1 / (120 - (chargeCap - charge) * 7.5)` (120 turns to charge at
 * full, 60 at 0/8) scaled by `RingOfEnergy.artifactChargeMultiplier`. Zeroes the partial at the cap.
 */
export function skeletonKeyTickRecharge(item: SkeletonKeyItem, energyMultiplier: number, magicImmune: boolean, regenOn: boolean): void {
	const cap = skeletonKeyChargeCap(item.level ?? 0);
	let charge = skeletonKeyCharge(item);
	if (charge < cap && !item.cursed && !magicImmune && regenOn) {
		let partial = item.partialCharge ?? 0;
		partial += Math.fround(1 / (value('rechargeBase') - (cap - charge) * value('rechargePerMissing'))) * energyMultiplier;
		while (partial >= 1) {
			partial--;
			charge++;
			if (charge === cap) partial = 0;
		}
		item.partialCharge = partial;
	}
	item.charge = charge;
}

/** `SkeletonKey.charge(Hero, amount)`: the wand-of-recharging-style external charge, 0.133 partial per unit. */
export function skeletonKeyAddCharge(item: SkeletonKeyItem, amount: number, magicImmune: boolean): void {
	const cap = skeletonKeyChargeCap(item.level ?? 0);
	let charge = skeletonKeyCharge(item);
	if (charge < cap && !item.cursed && !magicImmune) {
		let partial = (item.partialCharge ?? 0) + value('partialPerAmount') * amount;
		while (partial >= 1) {
			partial--;
			charge++;
		}
		if (charge >= cap) partial = 0;
		item.partialCharge = partial;
	}
	item.charge = charge;
}

/** `PathFinder.CIRCLE8`: the eight neighbours in clockwise order from the north-west; even indices are diagonals. */
export const CIRCLE8: readonly (readonly [number, number])[] = [
	[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0],
];

/** `PathFinder.NEIGHBOURS8`: the order the door-lock push scans in, which decides ties between equally far cells. */
export const NEIGHBOURS8: readonly (readonly [number, number])[] = [
	[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];

/** What the targeted cell is, as far as the targeter cares (`Terrain` flags plus the heap type). */
export type SkeletonKeyTarget =
	| 'lockedExit' | 'lockedDoor' | 'heroLockedDoor' | 'crystalDoor' | 'door'
	| 'lockedChest' | 'crystalChest' | 'other';

export interface SkeletonKeyMob {
	readonly enemy: boolean;
	readonly immovable: boolean;
	/** `Char.Property.LARGE`: it needs an open-space cell to be pushed into. */
	readonly large: boolean;
}

/**
 * One `KeyReplacementTracker`: how many keys each depth still needs, so the ones a skeleton key made
 * redundant can be discarded from the journal. `-1` means "not measured yet" (`setupKeysForDepth`
 * fills it from the level on first use). Java sizes the arrays to 26 depths.
 */
export interface KeyReplacementTracker {
	iron: number[];
	golden: number[];
	crystal: number[];
}

export function newKeyReplacementTracker(): KeyReplacementTracker {
	return { iron: new Array(26).fill(-1), golden: new Array(26).fill(-1), crystal: new Array(26).fill(-1) };
}

export type KeyLockKind = 'iron' | 'golden' | 'crystal';

export interface SkeletonKeyFlowContext {
	readonly magicImmune: boolean;
	readonly heroPos: { x: number; y: number };
	/** `Level.locked` (a boss arena sealed): iron doors then refuse the key. */
	readonly levelLocked: boolean;
	keyOf(instanceId?: string): SkeletonKeyItem | undefined;
	beginAim(opts: { range: number; validate: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	levelSize: { width: number; height: number };
	/** `Level.visited[cell] || Level.mapped[cell]`. */
	isCellKnown(x: number, y: number): boolean;
	targetAt(x: number, y: number): SkeletonKeyTarget;
	isSolid(x: number, y: number): boolean;
	isOpenSpace(x: number, y: number): boolean;
	mobAt(x: number, y: number): SkeletonKeyMob | null;
	/** `Level.trueDistance`: the Euclidean distance the targeter compares cells by. */
	trueDistance(a: { x: number; y: number }, b: { x: number; y: number }): number;
	/** Opens the lock at the cell (`Level.set` to `DOOR`/`EMPTY`, or `Heap.open`); the scene owns the terrain. */
	openLock(cell: { x: number; y: number }, kind: 'iron' | 'hero' | 'crystal' | 'goldChest' | 'crystalChest'): void;
	/** `Level.set(target, HERO_LKD_DR)` plus scattering whatever lay in the doorway. */
	lockDoor(cell: { x: number; y: number }): void;
	/** Pushes the character one cell (`WandOfBlastWave.throwChar(.., 1, ..)`). */
	pushMob(from: { x: number; y: number }, to: { x: number; y: number }): void;
	/** `placeWall`: raises the temporary wall at the cell for `wallTurns` turns. */
	placeWall(cell: { x: number; y: number }, knockback: readonly [number, number]): void;
	/** `KeyReplacementTracker.process*LockOpened`. */
	noteLockOpened(kind: KeyLockKind): void;
	/** `Talent.onArtifactUsed`'s `ENHANCED_RINGS` leg (the only one this port models). */
	armEnhancedRings(): void;
	dispelInvisibility(): void;
	/** `Dungeon.observe()`/`GameScene.updateFog()` after new walls. */
	observe(): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

const K = (key: string): string => `port.skeletonkey.${key}`;

/** `SkeletonKey.execute(AC_INSERT)`: MagicImmune/curse gates, then the cell selector. */
export function useSkeletonKeyFlow(ctx: SkeletonKeyFlowContext, instanceId?: string): void {
	const key = ctx.keyOf(instanceId);
	if (!key || ctx.magicImmune) return;
	if (key.cursed) { ctx.say(ctx.t(K('cursed')), 'negative'); return; }
	ctx.beginAim({
		range: Math.max(ctx.levelSize.width, ctx.levelSize.height),
		validate: (cell) => ctx.isCellKnown(cell.x, cell.y),
		onConfirm: (cell) => confirmSkeletonKeyFlow(ctx, cell, instanceId),
	});
	ctx.say(ctx.t(K('prompt')), 'positive');
}

/** Pays `cost` charges and awards exp (`charge -= cost; gainExp(..)`), then the shared use tail. */
function spendKeyCharge(ctx: SkeletonKeyFlowContext, key: SkeletonKeyItem, cost: number, xp: number): void {
	key.charge = skeletonKeyCharge(key) - cost;
	if (skeletonKeyGainExp(key, xp)) ctx.say(ctx.t(K('levelup')), 'positive');
}

function finishUse(ctx: SkeletonKeyFlowContext, usedArtifact: boolean): void {
	if (usedArtifact) ctx.armEnhancedRings();
	ctx.dispelInvisibility();
	ctx.spendTurn();
}

/** `targeter.onSelect`, in Java's own order. */
export function confirmSkeletonKeyFlow(ctx: SkeletonKeyFlowContext, target: { x: number; y: number }, instanceId?: string): void {
	const key = ctx.keyOf(instanceId);
	if (!key) return;
	if (!ctx.isCellKnown(target.x, target.y)) return;
	const hero = ctx.heroPos;
	if (target.x === hero.x && target.y === hero.y) { ctx.say(ctx.t(K('invalid_target')), 'warning'); return; }
	const charge = skeletonKeyCharge(key);
	const adjacent = Math.max(Math.abs(target.x - hero.x), Math.abs(target.y - hero.y)) === 1;
	if (adjacent) {
		const kind = ctx.targetAt(target.x, target.y);
		const cost = (effect: string): number => value(effect);
		if (kind === 'lockedExit') { ctx.say(ctx.t(K('wont_open')), 'warning'); return; }
		if (kind === 'lockedDoor') {
			if (ctx.levelLocked) { ctx.say(ctx.t(K('wont_open')), 'warning'); return; }
			if (charge < cost('ironCost')) { ctx.say(ctx.t(K('iron_charges'))); return; }
			ctx.noteLockOpened('iron');
			ctx.openLock(target, 'iron');
			spendKeyCharge(ctx, key, cost('ironCost'), value('expBase') + cost('ironCost'));
			finishUse(ctx, true);
			return;
		}
		if (kind === 'heroLockedDoor') {
			//no charge cost, no artifact on-use
			ctx.openLock(target, 'hero');
			finishUse(ctx, false);
			return;
		}
		if (kind === 'crystalDoor') {
			if (charge < cost('crystalCost')) { ctx.say(ctx.t(K('crystal_charges'))); return; }
			ctx.noteLockOpened('crystal');
			ctx.openLock(target, 'crystal');
			spendKeyCharge(ctx, key, cost('crystalCost'), value('expBase') + cost('crystalCost'));
			finishUse(ctx, true);
			return;
		}
		if (kind === 'door') {
			if (charge < cost('lockCost')) { ctx.say(ctx.t(K('lock_charges'))); return; }
			const mob = ctx.mobAt(target.x, target.y);
			if (mob) {
				//push to the closest open cell that's further than the door
				let push: { x: number; y: number } | null = null;
				for (const [dx, dy] of NEIGHBOURS8) {
					const cell = { x: target.x + dx, y: target.y + dy };
					if (ctx.isSolid(cell.x, cell.y) || ctx.mobAt(cell.x, cell.y)) continue;
					if (mob.large && !ctx.isOpenSpace(cell.x, cell.y)) continue;
					if (ctx.trueDistance(hero, cell) <= ctx.trueDistance(hero, target)) continue;
					if (push === null || ctx.trueDistance(hero, push) > ctx.trueDistance(hero, cell)) push = cell;
				}
				if (push === null || mob.immovable) { ctx.say(ctx.t(K('lock_no_space')), 'warning'); return; }
				ctx.pushMob(target, push);
			}
			ctx.lockDoor(target);
			spendKeyCharge(ctx, key, cost('lockCost'), value('expBase'));
			finishUse(ctx, true);
			return;
		}
		if (kind === 'lockedChest') {
			if (charge < cost('goldCost')) { ctx.say(ctx.t(K('gold_charges'))); return; }
			ctx.noteLockOpened('golden');
			ctx.openLock(target, 'goldChest');
			spendKeyCharge(ctx, key, cost('goldCost'), value('expBase') + cost('goldCost'));
			finishUse(ctx, true);
			return;
		}
		if (kind === 'crystalChest') {
			if (charge < cost('crystalCost')) { ctx.say(ctx.t(K('crystal_charges'))); return; }
			ctx.noteLockOpened('crystal');
			ctx.openLock(target, 'crystalChest');
			spendKeyCharge(ctx, key, cost('crystalCost'), value('expBase') + cost('crystalCost'));
			finishUse(ctx, true);
			return;
		}
	}
	//anything else: lock the air in the cardinal/diagonal direction of the target
	if (charge < value('wallCost')) { ctx.say(ctx.t(K('wall_charges'))); return; }
	let closest = { x: hero.x, y: hero.y };
	let closestIdx = -1;
	for (let i = 0; i < CIRCLE8.length; i++) {
		const cell = { x: hero.x + CIRCLE8[i]![0], y: hero.y + CIRCLE8[i]![1] };
		if (ctx.trueDistance(target, cell) < ctx.trueDistance(target, closest)) {
			closest = cell;
			closestIdx = i;
		}
	}
	if (closestIdx === -1 || ctx.isSolid(closest.x, closest.y)) { ctx.say(ctx.t(K('invalid_target')), 'warning'); return; }
	const knock = CIRCLE8[closestIdx]!;
	const at = (idx: number, scale = 1) => ({ x: hero.x + scale * CIRCLE8[(idx + 8) % 8]![0], y: hero.y + scale * CIRCLE8[(idx + 8) % 8]![1] });
	ctx.placeWall(at(closestIdx), knock);
	ctx.placeWall(at(closestIdx + 7), knock);
	ctx.placeWall(at(closestIdx + 1), knock);
	//if we're in a diagonal direction
	if (closestIdx % 2 === 0) {
		ctx.placeWall(at(closestIdx + 7, 2), knock);
		ctx.placeWall(at(closestIdx + 1, 2), knock);
	}
	spendKeyCharge(ctx, key, value('wallCost'), value('expBase'));
	ctx.observe();
	finishUse(ctx, true);
}

/**
 * `KeyReplacementTracker.setupKeysForDepth` + `process*LockOpened` + `processExcessKeys`: the counts
 * of locks still shut on this depth bound how many real keys the journal may keep, so opening a
 * lock with the skeleton key discards the now-redundant key.
 * @returns how many excess keys of each kind should be discarded from the journal.
 */
export function processKeyLockOpened(
	tracker: KeyReplacementTracker,
	depth: number,
	kind: KeyLockKind,
	level: { iron: number; golden: number; crystal: number },
	held: { iron: number; golden: number; crystal: number },
): { iron: number; golden: number; crystal: number } {
	const arrays = { iron: tracker.iron, golden: tracker.golden, crystal: tracker.crystal };
	if (arrays[kind][depth] === -1) {
		tracker.iron[depth] = level.iron;
		tracker.golden[depth] = level.golden;
		tracker.crystal[depth] = level.crystal;
	}
	arrays[kind][depth]! -= 1;
	const excess = (needed: number, have: number): number => (needed >= 0 ? Math.max(0, have - needed) : 0);
	return {
		iron: excess(tracker.iron[depth]!, held.iron),
		golden: excess(tracker.golden[depth]!, held.golden),
		crystal: excess(tracker.crystal[depth]!, held.crystal),
	};
}
