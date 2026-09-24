/**
 * Lloyd's Beacon's own rules, split out of the scene so they can be checked without a live game -
 * the same split `items/sandals.ts`, `items/talisman.ts` and `items/rose.ts` use. Every formula
 * here is `LloydsBeacon.java` (tag `v3.3.8`); the scene owns the aiming, the floor, and the
 * depth travel the return row triggers.
 *
 * The beacon is a three-row artifact: a charge-gated teleport zap (self or other, via
 * `ScrollOfTeleportation`'s own candidate set), a set that anchors the return point, and a
 * return that either steps the hero across the current floor or travels back to the anchored
 * depth. Both travel blocks refuse while bosses, the mining branch, or the amulet forbid
 * teleports, and while an enemy stands adjacent. The single-use `BeaconOfReturning` spell
 * twin lives here too (`useReturningBeaconFlow`) - same anchor shape, consumed on travel.
 *
 * The zap/set/return flow itself lives here too, behind `BeaconFlowContext` - the file-size
 * refactor's fourteenth extraction, behavior-identical.
 */
import { Roguelike } from 'mwg';
import { mwlItemEffectValue } from '../mwlContent';
import type { AnyMonsterId } from '../monsters';

/** The beacon fields the flow reads and writes (`LloydsBeacon`'s return-point triple plus the
 *  shared artifact charge pair; `returnBranch` is always 0 here - this port has no branches). */
export type BeaconItem = {
	level?: number;
	charge?: number;
	partialCharge?: number;
	cursed?: boolean;
	returnDepth?: number;
	returnBranch?: number;
	returnPos?: number;
	returnX?: number;
	returnY?: number;
};

/** `LloydsBeacon.chargeCap()`: `3 + 2*level()`, the level capped at 10. */
export function beaconChargeCap(item: BeaconItem): number {
	const level = Math.min(item.level ?? 0, mwlItemEffectValue('beacon', 'levelCap'));
	return mwlItemEffectValue('beacon', 'chargeCapBase') + mwlItemEffectValue('beacon', 'chargeCapPerLevel') * level;
}

/** `LloydsBeacon.upgrade()` (`LloydsBeacon.java`, tag `v3.3.8`): +1 level unless already at
 * `levelCap` (3, authored in `item-rules.mwl`), in which case it is a no-op - the boss-`die()`
 * upgrade Tengu, DM300 and the Dwarf King call (Goo and Yog never do). Returns whether the
 * level moved, so the caller can say the `levelup` line only on a real upgrade. */
export function upgradeBeaconLevel(item: BeaconItem): boolean {
	if ((item.level ?? 0) >= mwlItemEffectValue('beacon', 'levelCap')) return false;
	item.level = (item.level ?? 0) + 1;
	return true;
}

/** The zap price: 1 charge down to depth 20, 2 deeper (`LloydsBeacon.zap()`'s own threshold). */
export function beaconZapCost(depth: number): number {
	return depth > mwlItemEffectValue('beacon', 'zapCostDepthThreshold')
		? mwlItemEffectValue('beacon', 'zapCostHighDepth') : mwlItemEffectValue('beacon', 'zapCostBase');
}

/** The zap's reach (`LloydsBeacon.zap()` hands the aimer `Ballistica` range 8). */
export function beaconZapRange(): number {
	return mwlItemEffectValue('beacon', 'zapRange');
}

/** A creature where the beacon flow needs one: the zap's victim check and the adjacency scan. */
export interface BeaconCreatureView {
	kind?: AnyMonsterId | undefined;
	isHero?: boolean | undefined;
	isNPC?: boolean | undefined;
	isAlly?: boolean | undefined;
}

/** A Java `Level.mobs` entry on a beacon's saved return cell. */
export interface BeaconMobView extends BeaconCreatureView {
	id: string;
	x: number;
	y: number;
}

/**
 * The Lloyd's Beacon zap/set/return flow, moved out of the scene behind this context the way
 * the sandals, talisman, chains, horn, armband and rose flows moved before it -
 * behavior-identical, with the scene keeping one builder plus the `useBeaconArtifact` adapter
 * the item-use router calls. The `t` field is deliberately named `t` (bound to the real one)
 * so the `t('...')` key audits keep matching these call sites.
 */
export interface BeaconFlowContext {
	readonly depth: number;
	readonly heroPos: { x: number; y: number };
	readonly miningBranchActive: boolean;
	beaconOf(instanceId?: string): BeaconItem | undefined;
	beaconTitle(): string;
	openPicker(title: string, entries: { id: string; instanceId?: string; identified: boolean; quantity: number }[], onPick: (entry: { id: string; instanceId?: string }) => void): void;
	beginAim(opts: { range: number; onConfirm: (cell: { x: number; y: number }) => void }): void;
	cellIndex(x: number, y: number): number;
	gridWidth(): number;
	isBossDepth(): boolean;
	hasAmulet(): boolean;
	creatureAt(x: number, y: number): BeaconCreatureView | null;
	mobsAt(x: number, y: number): readonly BeaconMobView[];
	isImmovableKind(kind: AnyMonsterId | undefined): boolean;
	randomFreeCellNear(x: number, y: number): { x: number; y: number } | undefined;
	moveHeroTo(cell: { x: number; y: number }): void;
	playHeroTeleport(from: { x: number; y: number }, to: { x: number; y: number }): void;
	playCreatureTeleport(from: { x: number; y: number }, to: { x: number; y: number }, atX: number, atY: number): void;
	moveCreatureTo(x: number, y: number, cell: { x: number; y: number }): void;
	displaceMob(id: string, cell: { x: number; y: number }): void;
	passable(x: number, y: number): boolean;
	relocateHero(x: number, y: number): void;
	travelToDepth(returnDepth: number, arrival: { x: number; y: number }): void;
	returningBeaconOf(instanceId?: string): BeaconItem | undefined;
	consumeReturningBeacon(instanceId?: string): void;
	spendTurn(): void;
	clearRoots(): void;
	dispelInvisibility(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `LloydsBeacon`'s travel block: boss depths, the mining branch, and carrying the amulet all
 *  forbid setting and returning alike. */
export function beaconTeleportBlocked(ctx: BeaconFlowContext): boolean {
	return ctx.isBossDepth() || ctx.miningBranchActive || ctx.hasAmulet();
}

/** The adjacency block Java shares between setting and returning: any hostile neighbour. */
export function beaconAdjacentEnemy(ctx: BeaconFlowContext): boolean {
	for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
		const creature = ctx.creatureAt(ctx.heroPos.x + dx, ctx.heroPos.y + dy);
		if (creature && !creature.isHero && !creature.isNPC && !creature.isAlly) return true;
	}
	return false;
}

/** `LloydsBeacon.execute()`'s three rows (`beacon-zap`/`beacon-set`/`beacon-return` synthetic
 *  instance ids, the same trick the horn and rose rows use): the zap hides below its price,
 *  the set is always offered, the return only once anchored. */
export function useBeaconFlow(ctx: BeaconFlowContext, instanceId?: string): void {
	const beacon = ctx.beaconOf(instanceId);
	if (!beacon) return;
	const chargeCap = beaconChargeCap(beacon);
	const charge = Math.min(chargeCap, beacon.charge ?? 0);
	const zapCost = beaconZapCost(ctx.depth);
	const zapEntry = 'beacon-zap', setEntry = 'beacon-set', returnEntry = 'beacon-return';
	ctx.openPicker(ctx.beaconTitle(), [
		...(charge >= zapCost ? [{ id: 'beacon', instanceId: zapEntry, identified: true, quantity: 1 }] : []),
		{ id: 'beacon', instanceId: setEntry, identified: true, quantity: 1 },
		...(beacon.returnDepth !== undefined && beacon.returnDepth >= 0 ? [{ id: 'beacon', instanceId: returnEntry, identified: true, quantity: 1 }] : []),
	], (entry) => {
		if (entry.instanceId === zapEntry) beginBeaconZapFlow(ctx, zapCost, instanceId);
		else if (entry.instanceId === setEntry) setBeaconFlow(ctx, instanceId);
		else if (entry.instanceId === returnEntry) returnBeaconFlow(ctx, instanceId);
	});
}

/** The zap row's aimer; the charge is paid on confirm, not on aim. */
export function beginBeaconZapFlow(ctx: BeaconFlowContext, zapCost: number, instanceId?: string): void {
	ctx.beginAim({
		range: beaconZapRange(),
		onConfirm: (cell) => confirmBeaconZapFlow(ctx, cell, zapCost, instanceId),
	});
	ctx.say(ctx.t('items.artifacts.lloydsbeacon.prompt'), 'positive');
}

/** `LloydsBeacon.zap()`: self-zaps free roots and scatter the hero, other-zaps scatter the
 *  victim instead - both through `ScrollOfTeleportation`'s candidate set, both refusing with
 *  its `no_tele` line when the floor has nothing free. Boss depths and immovables refuse the
 *  victim half with their own lines. */
export function confirmBeaconZapFlow(ctx: BeaconFlowContext, target: { x: number; y: number }, zapCost: number, instanceId?: string): void {
	const beacon = ctx.beaconOf(instanceId);
	if (!beacon) return;
	beacon.charge = Math.max(0, (beacon.charge ?? 0) - zapCost);
	ctx.dispelInvisibility();
	if (target.x === ctx.heroPos.x && target.y === ctx.heroPos.y) {
		ctx.clearRoots();
		const destination = ctx.randomFreeCellNear(ctx.heroPos.x, ctx.heroPos.y);
		if (destination) {
			const from = { x: ctx.heroPos.x, y: ctx.heroPos.y };
			ctx.moveHeroTo(destination);
			ctx.playHeroTeleport(from, destination);
			ctx.say(ctx.t('items.scrolls.scrollofteleportation.tele'), 'positive');
		} else ctx.say(ctx.t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
		return;
	}
	const creature = ctx.creatureAt(target.x, target.y);
	if (!creature) return;
	if (ctx.isBossDepth()) { ctx.say(ctx.t('items.scrolls.scrollofteleportation.no_tele'), 'negative'); return; }
	if (ctx.isImmovableKind(creature.kind)) {
		ctx.say(ctx.t('items.artifacts.lloydsbeacon.tele_fail'), 'negative');
		return;
	}
	const destination = ctx.randomFreeCellNear(target.x, target.y);
	const from = { x: target.x, y: target.y };
	if (!destination) { ctx.say(ctx.t('items.scrolls.scrollofteleportation.no_tele'), 'negative'); return; }
	ctx.playCreatureTeleport(from, destination, target.x, target.y);
	ctx.moveCreatureTo(target.x, target.y, destination);
}

/** `LloydsBeacon.setBeacon()`: anchors depth, branch, and hero cell after the two blocks. */
export function setBeaconFlow(ctx: BeaconFlowContext, instanceId?: string): void {
	const beacon = ctx.beaconOf(instanceId);
	if (!beacon) return;
	if (beaconTeleportBlocked(ctx)) { ctx.say(ctx.t('items.artifacts.lloydsbeacon.preventing'), 'negative'); return; }
	if (beaconAdjacentEnemy(ctx)) { ctx.say(ctx.t('items.artifacts.lloydsbeacon.creatures'), 'negative'); return; }
	beacon.returnDepth = ctx.depth;
	beacon.returnBranch = 0;
	beacon.returnPos = ctx.cellIndex(ctx.heroPos.x, ctx.heroPos.y);
	beacon.returnX = ctx.heroPos.x;
	beacon.returnY = ctx.heroPos.y;
	ctx.say(ctx.t('items.artifacts.lloydsbeacon.return'), 'positive');
}

/** `LloydsBeacon.execute(AC_RETURN)` calls `ScrollOfTeleportation.appear(hero, pos)` first, then scans
 * `Dungeon.level.mobs` and directly advances every mob found at the hero's new cell. This includes
 * allies, NPC mobs, rooted mobs, and `IMMOVABLE` mobs; the direct position/sprite write
 * bypasses `Char.move()`. A boxed occupant simply stays under the hero - return still succeeds.
 */
function beaconClearAnchor(ctx: BeaconFlowContext, x: number, y: number): { x: number; y: number } {
	for (const mob of ctx.mobsAt(x, y)) {
		//Java's own fixed `PathFinder.NEIGHBOURS8` scan; after each move `Actor.findChar` sees
		//that new cell occupied, so a stack of mobs is displaced one at a time where possible.
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const cell = { x: x + dx, y: y + dy };
			if (ctx.passable(cell.x, cell.y) && !ctx.creatureAt(cell.x, cell.y)) {
				ctx.displaceMob(mob.id, cell);
				break;
			}
		}
	}
	return { x, y };
}

/** `BeaconOfReturning.returnBeacon()` is separate Java code: it considers the occupying Char,
 * chooses a passable uncrowded neighbour, sends the hero there for IMMOVABLE occupants, and
 * refuses the whole cast if no candidate exists. */
function spellBeaconClearAnchor(ctx: BeaconFlowContext, x: number, y: number): { x: number; y: number } | null {
	const occupant = ctx.creatureAt(x, y);
	if (!occupant || occupant.isHero) return { x, y };
	const pushHero = ctx.isImmovableKind(occupant.kind);
	let free: { x: number; y: number } | undefined;
	//Port simplification: Java collects !solid candidates, shuffles them, and applies LARGE/openSpace;
	//this flow picks the first fixed neighbour that the port marks passable.
	for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
		const cell = { x: x + dx, y: y + dy };
		if (ctx.passable(cell.x, cell.y) && !ctx.creatureAt(cell.x, cell.y)) { free = cell; break; }
	}
	if (!free) { ctx.say(ctx.t('items.scrolls.scrollofteleportation.no_tele'), 'negative'); return null; }
	if (pushHero) return free;
	ctx.playCreatureTeleport({ x, y }, free, x, y);
	ctx.moveCreatureTo(x, y, free);
	return { x, y };
}

/** `LloydsBeacon.execute(AC_RETURN)`: same-depth return appears the hero first, then displaces
 *  mobs from the anchor; another depth travels there - the scene owns that transition. */
export function returnBeaconFlow(ctx: BeaconFlowContext, instanceId?: string): void {
	const beacon = ctx.beaconOf(instanceId);
	if (!beacon || beacon.returnDepth === undefined || beacon.returnDepth < 0 || beacon.returnPos === undefined) return;
	if (beaconTeleportBlocked(ctx)) { ctx.say(ctx.t('items.artifacts.lloydsbeacon.preventing'), 'negative'); return; }
	if (beaconAdjacentEnemy(ctx)) { ctx.say(ctx.t('items.artifacts.lloydsbeacon.creatures'), 'negative'); return; }
	const width = ctx.gridWidth();
	const x = beacon.returnX ?? (beacon.returnPos % width);
	const y = beacon.returnY ?? Math.floor(beacon.returnPos / width);
	if (beacon.returnDepth === ctx.depth) {
		if (!ctx.passable(x, y)) { ctx.say(ctx.t('items.scrolls.scrollofteleportation.no_tele'), 'negative'); return; }
		ctx.relocateHero(x, y);
		beaconClearAnchor(ctx, x, y);
	} else {
		ctx.travelToDepth(beacon.returnDepth, { x, y });
	}
	ctx.say(ctx.t('port.log.beaconreturned'), 'positive');
}

/** `BeaconOfReturning.execute()` (tag `v3.3.8`): the single-use spell twin of the artifact's
 *  set/return pair. Unanchored casts anchor instead of travelling; a non-zero branch
 *  refuses (this port has no branches, so the anchor always writes 0 and this is a
 *  defensive re-check); same-depth occupancy follows `BeaconOfReturning.returnBeacon()`'s
 *  separate Char/IMMOVABLE/refusal algorithm; another depth in 1..26 travels there. Every
 *  finished cast consumes the spell and spends the turn; every refusal returns early. */
export function useReturningBeaconFlow(ctx: BeaconFlowContext, instanceId?: string): void {
	const beacon = ctx.returningBeaconOf(instanceId);
	if (!beacon) return;
	if (beacon.returnDepth === undefined || beacon.returnDepth < 0 || beacon.returnPos === undefined) {
		beacon.returnDepth = ctx.depth;
		beacon.returnBranch = 0;
		beacon.returnPos = ctx.cellIndex(ctx.heroPos.x, ctx.heroPos.y);
		beacon.returnX = ctx.heroPos.x;
		beacon.returnY = ctx.heroPos.y;
		ctx.say(ctx.t('items.spells.beaconofreturning.set'), 'positive');
		ctx.spendTurn();
		return;
	}
	if (beacon.returnBranch !== 0) {
		ctx.say(ctx.t('items.spells.beaconofreturning.preventing'), 'negative');
		return;
	}
	const width = ctx.gridWidth();
	const x = beacon.returnX ?? (beacon.returnPos % width);
	const y = beacon.returnY ?? Math.floor(beacon.returnPos / width);
	if (beacon.returnDepth === ctx.depth && ctx.passable(x, y)) {
		const arrival = spellBeaconClearAnchor(ctx, x, y);
		if (!arrival) return;
		ctx.relocateHero(arrival.x, arrival.y);
		ctx.consumeReturningBeacon(instanceId);
		ctx.say(ctx.t('port.log.beaconreturned'), 'positive');
	} else if (beacon.returnDepth === ctx.depth) {
		ctx.say(ctx.t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
		return;
	} else if (beacon.returnDepth >= 1 && beacon.returnDepth <= 26) {
		ctx.consumeReturningBeacon(instanceId);
		ctx.travelToDepth(beacon.returnDepth, { x, y });
		ctx.say(ctx.t('port.log.beaconreturned'), 'positive');
	} else {
		ctx.say(ctx.t('items.spells.beaconofreturning.preventing'), 'negative');
		return;
	}
	ctx.spendTurn();
}
