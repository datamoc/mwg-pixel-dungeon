/**
 * Talisman of Foresight's own rules, split out of the scene so they can be checked without a live
 * game - the same split `items/sandals.ts` and `items/shopPricing.ts` use. Every formula here is
 * `TalismanOfForesight.java` (tag `v3.3.8`); the scene owns the aiming, the level mutation, the
 * awareness marks and the turn cost. The scry flow itself (aimer, cone pass, trap warning)
 * lives here too, behind `TalismanFlowContext` - the file-size refactor's ninth extraction,
 * behavior-identical.
 *
 * The artifact has one active action (`AC_SCRY`: a cone-shaped scry that maps ground, uncovers
 * secrets and flags what it finds) and one passive (`Foresight`: a per-turn charge trickle plus a
 * proximity warning when a hidden trap sits in the hero's own sight).
 */
import { Roguelike } from 'mwg';
import { WALL } from '../dungeonConstants';
import { coneCells } from '../mechanics/cone';
import { mwlItemEffectValue } from '../mwlContent';

export type TalismanItem = {
	level?: number;
	/** Java's `charge` (an int) and `partialCharge` (the float build-up toward the next one). */
	charge?: number;
	partialCharge?: number;
	/** Java's `exp`: progress toward the next artifact level, awarded per cell the scry reveals. */
	exp?: number;
	cursed?: boolean;
	/** Java's `warn`: whether the "uneasy" line is already showing, so it fires once per run of
	 *  hidden traps rather than every turn. Persisted in Java's own bundle. */
	warn?: boolean;
};

/** `TalismanOfForesight`'s constructor block: `chargeCap = 100`, `levelCap = 10`, `charge = 0`. */
export function talismanChargeCap(): number {
	return mwlItemEffectValue('talisman', 'chargeCap');
}

export function talismanLevelCap(): number {
	return mwlItemEffectValue('talisman', 'levelCap');
}

/** The `AC_SCRY` gate's floor: `execute()` refuses with `low_charge` below 5. */
export function talismanScryMinCharge(): number {
	return mwlItemEffectValue('talisman', 'scryMinCharge');
}

/**
 * `TalismanOfForesight.maxDist()`: `min(5 + 2*level(), (charge-3)/1.08f)`. Note the two bounds
 * pull in opposite directions - the level raises the ceiling while a nearly-empty charge lowers
 * it, so a +10 talisman on 5 charge still only reaches 1.85 tiles.
 */
export function talismanMaxDist(level: number, charge: number): number {
	const fromLevel = mwlItemEffectValue('talisman', 'maxDistBase') + mwlItemEffectValue('talisman', 'maxDistPerLevel') * level;
	const fromCharge = (charge - mwlItemEffectValue('talisman', 'maxDistChargeOffset'))
		/ mwlItemEffectValue('talisman', 'maxDistChargeDivisor');
	return Math.min(fromLevel, fromCharge);
}

/** `FloatMath.round(200 * pow(0.92, dist))`: the cone's arc in degrees, narrowing with distance -
 *  "starts at 200 degrees, loses 8% per tile" in Java's own comment. */
export function talismanScryAngle(distance: number): number {
	const base = mwlItemEffectValue('talisman', 'angleBase');
	return Math.round(Math.fround(base * Math.pow(mwlItemEffectValue('talisman', 'angleDecay'), distance)));
}

/** `charge -= 3 + dist*1.08f`, the scry's cost in points (so 5 at 2 tiles, ~30 at 25 tiles). */
export function talismanScryCost(distance: number): number {
	return Math.fround(mwlItemEffectValue('talisman', 'scryCostBase')
		+ Math.fround(distance * mwlItemEffectValue('talisman', 'scryCostPerTile')));
}

/**
 * The scry's charge arithmetic, in Java's own order, on Java's own types: `charge` is an int
 * field, so `charge -= 3 + dist*1.08f` *truncates toward zero* rather than keeping the fraction,
 * which is why `partialCharge` is then adjusted by `(dist*1.08f) % 1` to keep the books even -
 * and why the two follow-up branches (a negative partial paid out of a positive charge, then a
 * negative charge paid out of the partial) exist at all. Reproducing the order matters: the
 * branches only behave as Java's do when the truncation has already happened.
 */
export function talismanApplyScryCost(item: TalismanItem, distance: number): void {
	const cost = talismanScryCost(distance);
	//Java's `int charge -= float` truncates toward zero, which `Math.trunc` reproduces.
	let charge = Math.trunc((item.charge ?? 0) - cost);
	let partialCharge = Math.fround((item.partialCharge ?? 0) - Math.fround(cost % 1));
	if (partialCharge < 0 && charge > 0) {
		partialCharge = Math.fround(partialCharge + 1);
		charge--;
	}
	while (charge < 0) {
		charge++;
		partialCharge = Math.fround(partialCharge - 1);
	}
	item.charge = charge;
	item.partialCharge = partialCharge;
}

/** `Foresight.act()`'s per-turn trickle: `chargeGain = 0.05f + level()*0.005f`, scaled by
 *  `RingOfEnergy.artifactChargeMultiplier` - "fully charges in 2000 turns at +0, scaling to 1000
 *  turns at +10". Gated exactly as Java gates it: below the cap, not cursed, no `MagicImmune`,
 *  and `Regeneration.regenOn()` (the port's `regenOn` argument, the scene's boss-arena lock
 *  gate). Reaching the cap zeroes `partialCharge`
 *  outright. */
export function applyTalismanPerTurnCharge(
	item: TalismanItem,
	ringMultiplier: number,
	magicImmune: boolean,
	regenOn: boolean,
): void {
	if (item.cursed || magicImmune || !regenOn) return;
	const chargeCap = talismanChargeCap();
	let charge = item.charge ?? 0;
	if (charge >= chargeCap) return;
	const level = item.level ?? 0;
	const gain = (mwlItemEffectValue('talisman', 'chargeGainBase')
		+ mwlItemEffectValue('talisman', 'chargeGainPerLevel') * level) * ringMultiplier;
	let partialCharge = Math.fround((item.partialCharge ?? 0) + gain);
	while (partialCharge >= 1) {
		partialCharge = Math.fround(partialCharge - 1);
		charge++;
		if (charge >= chargeCap) {
			partialCharge = 0;
			break;
		}
	}
	item.charge = charge;
	item.partialCharge = partialCharge;
}

/** `Foresight`'s awareness durations - both the scry's marks and the trap warning use
 *  `5 + 2*level()`. */
export function talismanAwarenessDuration(level: number): number {
	return mwlItemEffectValue('talisman', 'awarenessBase') + mwlItemEffectValue('talisman', 'awarenessPerLevel') * level;
}

/** The figure Java's scry hands to `Artifact.artifactProc`, `(int)(3 + dist*1.08f)`. That method
 *  reads neither of its two numeric arguments at `v3.3.8`: it only runs the three talent procs
 *  (Priest's GuidingLight detonation, Cleric's SearingLight, Huntress's Sunray), so this number is
 *  cited for completeness rather than applied - see `item-rules.mwl`'s own note. */
export function talismanProcFigure(distance: number): number {
	return Math.trunc(mwlItemEffectValue('talisman', 'procBase')
		+ Math.fround(distance * mwlItemEffectValue('talisman', 'procPerTile')));
}

/**
 * The scry's exp accounting: `exp += earned`, and `exp >= 100 + 50*level()` levels the artifact
 * (subtracting that threshold) while below `levelCap`. Java's own `expToLevel` scales with the
 * level, so each level costs 50 more than the last. Returns whether a level was gained, which is
 * what the caller logs (`levelup`).
 */
export function talismanApplyExp(item: TalismanItem, earned: number): boolean {
	const levelCap = talismanLevelCap();
	const level = item.level ?? 0;
	let exp = (item.exp ?? 0) + earned;
	const toLevel = mwlItemEffectValue('talisman', 'expToLevelBase')
		+ mwlItemEffectValue('talisman', 'expToLevelPerLevel') * level;
	if (exp >= toLevel && level < levelCap) {
		exp -= toLevel;
		item.level = level + 1;
		item.exp = exp;
		return true;
	}
	item.exp = exp;
	return false;
}

/** Whether `execute(AC_SCRY)` would open the cell selector at all: Java checks `MagicImmune` first
 *  (silently), then equipped-ness and the `charge >= 5` floor. `'low'` is Java's `low_charge`
 *  line; `'cursed'` is `actions()` having hidden the row entirely, which this port reports rather
 *  than silently ignoring (it has no per-item action menu to hide rows in). */
export function talismanScryGate(item: TalismanItem | undefined, magicImmune: boolean): 'ok' | 'cursed' | 'low' | 'missing' {
	if (!item) return 'missing';
	if (magicImmune) return 'missing';
	if (item.cursed) return 'cursed';
	if ((item.charge ?? 0) < talismanScryMinCharge()) return 'low';
	return 'ok';
}

/** A creature the scry cone may mark, as the awareness pass sees it. */
export interface TalismanScryCreature {
	readonly isHero?: boolean;
	readonly isAlly?: boolean;
	readonly isNPC?: boolean;
}

/**
 * The Talisman of Foresight's scry flow (`useTalisman`'s aimer plus `confirmTalismanScry`'s
 * cone pass) and its per-turn trap warning, moved out of the scene behind this context the way
 * the sandals flow moved before them - behavior-identical, with the scene keeping builders plus
 * the adapters its router and turn block call. The `t` field is deliberately named `t` (bound
 * to the real one) so the `t('...')` key audits keep matching these call sites.
 */
export interface TalismanFlowContext {
	readonly magicImmune: boolean;
	readonly heroPos: { x: number; y: number };
	readonly levelSize: { width: number; height: number };
	talismanOf(instanceId?: string): TalismanItem | undefined;
	beginAim(opts: { range: number; requireLineOfSight: boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	trueDistanceTo(cell: { x: number; y: number }): number;
	isCellVisible(x: number, y: number): boolean;
	isCellExplored(x: number, y: number): boolean;
	markCellExplored(x: number, y: number): void;
	terrainAt(x: number, y: number): number;
	isSecretCell(x: number, y: number): boolean;
	discoverSecret(x: number, y: number): boolean;
	creatureAt(x: number, y: number): TalismanScryCreature | null;
	markCreatureAware(creature: TalismanScryCreature, duration: number): void;
	hasGroundItem(x: number, y: number): boolean;
	markHeapAware(cellIndex: number, duration: number): void;
	cellIndex(x: number, y: number): number;
	insideLevel(x: number, y: number): boolean;
	clearTravel(): void;
	dispelInvisibility(): void;
	refresh(): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `TalismanOfForesight.execute(AC_SCRY)`: gate, then open the cell selector. */
export function useTalismanFlow(ctx: TalismanFlowContext, instanceId?: string): void {
	const talisman = ctx.talismanOf(instanceId);
	const gate = talismanScryGate(talisman, ctx.magicImmune);
	if (gate === 'missing' || !talisman) return;
	if (gate === 'cursed') { ctx.say(ctx.t('items.artifacts.talismanofforesight.desc_cursed'), 'negative'); return; }
	if (gate === 'low') { ctx.say(ctx.t('items.artifacts.talismanofforesight.low_charge'), 'negative'); return; }
	ctx.beginAim({
		range: Math.max(ctx.levelSize.width, ctx.levelSize.height),
		requireLineOfSight: false,
		onConfirm: (cell) => confirmTalismanScryFlow(ctx, cell, instanceId),
	});
	ctx.say(ctx.t('items.artifacts.talismanofforesight.prompt'), 'positive');
}

/** The scry's cone pass: map ground, uncover secrets, mark creatures and heaps, pay, uncloak. */
export function confirmTalismanScryFlow(ctx: TalismanFlowContext, cell: { x: number; y: number }, instanceId?: string): void {
	const talisman = ctx.talismanOf(instanceId);
	if (!talisman) return;
	if (talismanScryGate(talisman, ctx.magicImmune) !== 'ok') return;
	//Java: `if (target != null && target != curUser.pos)` - aiming at his own cell does nothing.
	if (cell.x === ctx.heroPos.x && cell.y === ctx.heroPos.y) return;
	//Java's adjacency nudge: `if (Dungeon.level.adjacent(target, curUser.pos)) target += (target
	//- curUser.pos)`, which pushes a 1-cell aim out to 2 in the same direction. Java does not
	//bound-check the result; a cell off the map has no cone cells at all there either, so this
	//refuses the scry instead (and spends nothing, since the cost comes at the end).
	let target = { x: cell.x, y: cell.y };
	if (Roguelike.chebyshevDistance(target, ctx.heroPos) <= 1) {
		target = { x: target.x + (target.x - ctx.heroPos.x), y: target.y + (target.y - ctx.heroPos.y) };
	}
	if (!ctx.insideLevel(target.x, target.y)) return;
	const level = talisman.level ?? 0;
	const maxDist = talismanMaxDist(level, talisman.charge ?? 0);
	let distance = ctx.trueDistanceTo(target);
	//`if (dist >= 3 && dist > maxDist())`: walk the aim's own ballistic path and keep the last
	//cell still inside `maxDist()` - Java iterates `trajectory.path` and reassigns `target` per
	//step, so the *last* cell within range wins, not the first.
	if (distance >= 3 && distance > maxDist) {
		for (const step of Roguelike.traceLine(ctx.heroPos, target)) {
			if (ctx.trueDistanceTo(step) > maxDist) break;
			target = step;
		}
		distance = ctx.trueDistanceTo(target);
	}
	//`new ConeAOE(new Ballistica(pos, target, STOP_TARGET), angle)`: the arc is
	//`round(200 * 0.92^dist)`, the cone's own radius is unbounded (`ConeAOE`'s two-arg
	//constructor passes `POSITIVE_INFINITY`), and each ray carries the core's own
	//`STOP_TARGET`-only params - which stop at neither wall nor creature, i.e. a plain line.
	const cone = coneCells({
		source: ctx.heroPos,
		target,
		degrees: talismanScryAngle(distance),
		maxDistance: Infinity,
		width: ctx.levelSize.width,
		height: ctx.levelSize.height,
		trace: (from, to) => Roguelike.traceLine(from, to),
	});
	const duration = talismanAwarenessDuration(level);
	let earnedExp = 0;
	let noticed = false;
	for (const coneCell of cone.cells) {
		const { x, y } = coneCell;
		//Java's `subPath(1, dist)` starts one cell out, so the hero's own cell is never in the
		//cone; `traceLine` includes both endpoints, so it is skipped here instead.
		if (x === ctx.heroPos.x && y === ctx.heroPos.y) continue;
		const index = ctx.cellIndex(x, y);
		const wasExplored = ctx.isCellExplored(x, y) || ctx.isCellVisible(x, y);
		if (!wasExplored) {
			//`if (Dungeon.level.discoverable[cell] && !(mapped || visited)) { mapped = true; }`.
			//This port's fog has no `discoverable` channel - every floor here is discoverable -
			//and `explored` is its stand-in for both `mapped` and `visited`.
			ctx.markCellExplored(x, y);
			earnedExp += mwlItemEffectValue('talisman', 'expMappedCell');
		}
		//`if (Dungeon.level.secret[cell])`: a concealed cell is disguised as `WALL` when the
		//secret is a door and as `FLOOR` when it is a trap (see `Secrets.conceal`'s call sites),
		//which is also how Java's `oldValue == SECRET_DOOR ? 100 : 10` splits the experience.
		const concealment = ctx.terrainAt(x, y);
		if (ctx.isSecretCell(x, y) && ctx.discoverSecret(x, y)) {
			earnedExp += concealment === WALL
				? mwlItemEffectValue('talisman', 'expSecretDoor')
				: mwlItemEffectValue('talisman', 'expSecretTrap');
			noticed = true;
		}
		//A creature the hero cannot see, marked visible for `5 + 2*level()` turns: Java attaches
		//`CharAwareness` carrying the char's own id, and this port keeps the equivalent as a
		//countdown consulted by the sprite-visibility gate below.
		const occupant = ctx.creatureAt(x, y);
		if (occupant && !occupant.isHero && (occupant.isAlly || !occupant.isNPC)) {
			ctx.markCreatureAware(occupant, duration);
			if (!ctx.isCellVisible(x, y)) earnedExp += mwlItemEffectValue('talisman', 'expUnseen');
		}
		//`HeapAwareness`: the same mark for a heap, keyed by cell. Java awards its 10 only for a
		//heap it has never seen (`!h.seen`); this port's heaps carry no such flag, so the cell's
		//own pre-scry fog state stands in for it.
		if (ctx.hasGroundItem(x, y)) {
			ctx.markHeapAware(index, duration);
			if (!wasExplored) earnedExp += mwlItemEffectValue('talisman', 'expUnseen');
		}
	}
	if (talismanApplyExp(talisman, earnedExp)) ctx.say(ctx.t('items.artifacts.talismanofforesight.levelup'), 'positive');
	talismanApplyScryCost(talisman, distance);
	ctx.dispelInvisibility();
	void noticed;
	ctx.refresh();
	ctx.spendTurn();
}

/** `Foresight`'s proximity warning: one "uneasy" line per run of hidden traps in sight. */
export function checkTalismanAwarenessFlow(ctx: TalismanFlowContext): void {
	const talisman = ctx.talismanOf();
	if (!talisman) return;
	let somethingFound = false;
	const radius = 3;
	const minX = Math.max(0, ctx.heroPos.x - radius), maxX = Math.min(ctx.levelSize.width - 1, ctx.heroPos.x + radius);
	const minY = Math.max(0, ctx.heroPos.y - radius), maxY = Math.min(ctx.levelSize.height - 1, ctx.heroPos.y + radius);
	for (let y = minY; y <= maxY && !somethingFound; y++) {
		for (let x = minX; x <= maxX; x++) {
			if (!ctx.isCellVisible(x, y)) continue;
			if (!ctx.isSecretCell(x, y)) continue;
			if (ctx.terrainAt(x, y) === WALL) continue;
			somethingFound = true;
			break;
		}
	}
	if (somethingFound && !talisman.cursed && !ctx.magicImmune) {
		if (!talisman.warn) {
			ctx.say(ctx.t('items.artifacts.talismanofforesight$foresight.uneasy'), 'warning');
			//`((Hero)target).interrupt()`: this port's stand-in for it is dropping the auto-travel
			//destination, the same thing every other "stop resting/walking" site here does.
			ctx.clearTravel();
			talisman.warn = true;
		}
	} else {
		talisman.warn = false;
	}
}
