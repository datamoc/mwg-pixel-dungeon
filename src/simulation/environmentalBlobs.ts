import type { Creature, GroundItem, Step } from '../combat';
import type { AnyMonsterId } from '../monsters';
import type { LogLevel } from '../ui/gameLog';

export type EnvironmentalBlob = 'plantGas' | 'plantFreeze' | 'toxicGas' | 'paralyticGas' | 'stenchGas' | 'corrosiveGas' | 'confusionGas' | 'web' | 'electricity' | 'smokeScreen' | 'inferno' | 'blizzard';

// `StenchGas.evolve()` uses `Paralysis.DURATION / 5`; this port's authored Java duration is 10.
const STENCH_PARALYSIS_DURATION = 2;

export interface EnvironmentalBlobsContext {
	creatures: readonly Creature[];
	passable: (x: number, y: number) => boolean;
	advance: (blob: EnvironmentalBlob, isSolid: (x: number, y: number) => boolean) => void;
	cellsAbove: (blob: EnvironmentalBlob, threshold: number) => readonly Step[];
	creatureAt: (x: number, y: number) => Creature | null;
	addBuff: (target: Creature, id: 'poison' | 'paralysis' | 'ooze' | 'daze' | 'roots', duration?: number) => void;
	applyCorrosion: (target: Creature, strength: number) => void;
	corrosiveStrength: () => number;
	toxicDamage: (target: Creature) => number;
	isToxicImmune: (target: Creature) => boolean;
	/** Java's IMMOVABLE immunity to Vertigo: the confusion-gas daze here IS Vertigo's
	 *  stand-in, so immovable kinds refuse it - while daze from every other source (prismatic
	 *  light, fists, plants) still lands, since those are not Vertigo. Optional so headless
	 *  callers keep working. */
	isVertigoImmune?: (target: Creature) => boolean;
	applyDamage: (target: Creature, damage: number, cause?: 'poison' | 'electricity') => boolean;
	/** Cell charge of a blob volume (mirrors `Blob.volumeAt`); needed for electricity's odd-charge damage. */
	amountAt: (blob: EnvironmentalBlob, x: number, y: number) => number;
	/** `Electricity.evolve()`'s depth-scaled zap, `round(Random.Float(2 + scalingDepth/5))`, injected like `toxicDamage`. */
	electricDamage: (target: Creature) => number;
	/** `Fire.burn(cell)` on inferno occupants: reignite Burning (optional so headless
	 * callers that never seed inferno keep working). */
	reigniteBurning?: (target: Creature) => void;
	/** One `Freezing.freeze(cell)` step (the shared chill-then-Frost primitive); blizzard
	 * calls it twice per cell, like Java. Optional for the same reason. */
	applyChill?: (target: Creature) => void;
	/** Per-cell blob clearing for the inferno/blizzard mutual annihilation (and their
	 * clearing of `Freezing`/`plantFreeze` cells). Optional for the same reason. */
	clearCell?: (blob: EnvironmentalBlob, x: number, y: number) => void;
	/** Per-cell `Fire` reads/clears plus seeding, for inferno's fire interplay. */
	clearFireCell?: (x: number, y: number) => void;
	fireAmountAt?: (x: number, y: number) => number;
	seedFireCell?: (x: number, y: number, volume: number) => void;
	/** Flamable-terrain destruction under inferno (`Level.destroy`). */
	isFlammableCell?: (x: number, y: number) => boolean;
	destroyFlammableCell?: (x: number, y: number) => void;
}

/** Advances environmental blobs and applies their distinct SPD effects. */
export function applyEnvironmentalBlobs(context: EnvironmentalBlobsContext): void {
	const isSolid = (x: number, y: number): boolean => !context.passable(x, y);
	context.advance('plantGas', isSolid);
	context.advance('plantFreeze', isSolid);
	context.advance('toxicGas', isSolid);
	context.advance('paralyticGas', isSolid);
	context.advance('stenchGas', isSolid);
	context.advance('corrosiveGas', isSolid);
	context.advance('confusionGas', isSolid);
	context.advance('web', isSolid);
	context.advance('electricity', isSolid);
	//`SmokeScreen` has no `evolve()` override and no per-turn effect - it only advances
	//here so the cloud spreads and thins; its sight-blocking lives in the scene's
	//`pruneSmokeFromSight`, mirroring `Level.updateFieldOfView`.
	context.advance('smokeScreen', isSolid);
	context.advance('inferno', isSolid);
	context.advance('blizzard', isSolid);
	//`Inferno.evolve()` (tag `v3.3.8`): every live cell clears `Fire` and `Freezing`
	//there; meeting `Blizzard` annihilates both instead of burning; otherwise chars
	//reignite (`Fire.burn`) and flamable terrain is destroyed. Flamable 4-neighbours
	//with no fire catch `Fire` 4. Loop order (inferno before blizzard) is arbitrary -
	//Java runs them as separate blob actors.
	for (const cell of context.cellsAbove('inferno', 0.0001)) {
		context.clearFireCell?.(cell.x, cell.y);
		context.clearCell?.('plantFreeze', cell.x, cell.y);
		if (context.amountAt('blizzard', cell.x, cell.y) > 0) {
			context.clearCell?.('blizzard', cell.x, cell.y);
			context.clearCell?.('inferno', cell.x, cell.y);
			continue;
		}
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.reigniteBurning?.(target);
		if (context.isFlammableCell?.(cell.x, cell.y)) context.destroyFlammableCell?.(cell.x, cell.y);
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
			const x = cell.x + dx, y = cell.y + dy;
			if (context.isFlammableCell?.(x, y) && (context.fireAmountAt?.(x, y) ?? 0) <= 0) {
				context.seedFireCell?.(x, y, 4);
			}
		}
	}
	//`Blizzard.evolve()`: the mirror half - clears `Fire` and `Freezing`, annihilates
	//with `Inferno`, otherwise runs `Freezing.freeze(cell)` twice (two chill steps here).
	for (const cell of context.cellsAbove('blizzard', 0.0001)) {
		context.clearFireCell?.(cell.x, cell.y);
		context.clearCell?.('plantFreeze', cell.x, cell.y);
		if (context.amountAt('inferno', cell.x, cell.y) > 0) {
			context.clearCell?.('inferno', cell.x, cell.y);
			context.clearCell?.('blizzard', cell.x, cell.y);
			continue;
		}
		const target = context.creatureAt(cell.x, cell.y);
		if (target) { context.applyChill?.(target); context.applyChill?.(target); }
	}
	for (const cell of context.cellsAbove('plantGas', 1)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'poison');
	}
	//`Freezing.evolve()` (tag `v3.3.8`): live cells clear `Fire` and chill occupants
	//(the shared chill-then-Frost step - this loop used to grant raw paralysis, which
	//neither Java nor the icecap comments claiming chill-then-Frost ever did).
	for (const cell of context.cellsAbove('plantFreeze', 0.5)) {
		context.clearFireCell?.(cell.x, cell.y);
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.applyChill?.(target);
	}
	for (const cell of context.cellsAbove('toxicGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (!target || target.hp <= 0 || context.isToxicImmune(target)) continue;
		if (!context.applyDamage(target, context.toxicDamage(target))) return;
	}
	for (const cell of context.cellsAbove('paralyticGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'paralysis');
	}
	for (const cell of context.cellsAbove('stenchGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'paralysis', STENCH_PARALYSIS_DURATION);
	}
	for (const cell of context.cellsAbove('corrosiveGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.applyCorrosion(target, context.corrosiveStrength());
	}
	for (const cell of context.cellsAbove('confusionGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		// ConfusionGas.prolongs Vertigo for 2 turns; daze is this port's movement-confusion stand-in.
		if (!target || context.isVertigoImmune?.(target)) continue;
		context.addBuff(target, 'daze', 2);
	}
	//`Web` terrain (`Spinner`'s ranged web, tag `v3.3.8`): Java seeds a persistent 3-cell web
	//blob rather than a direct debuff. Standing in web roots the creature; the scene seeds the
	//blob in the spinner handler and this applies the root each turn.
	for (const cell of context.cellsAbove('web', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'roots', 2);
	}
	//`Electricity.evolve()` (tag `v3.3.8`): creatures in electrified cells are paralysed
	//for the cell's charge unless already held, and take the depth-scaled zap on odd
	//charges (with the real `ondeath` line on a hero kill, via the cause below). Water
	//conduction runs in the volume step itself (`evolveElectricity` in `javaBlob.ts`);
	//the shocking/storm traps seed it directly.
	for (const cell of context.cellsAbove('electricity', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		//`Feint.AfterImage` carries the whole `BlobImmunity` set (tag `v3.3.8`); the
		//paralysis half is refused by `buffBlocked`, this skips the direct zap (the decoy
		//spawns as a rat, so the kind-keyed sets cannot see it).
		if (!target || target.hp <= 0 || target.allyKind === 'afterImage') continue;
		const charge = context.amountAt('electricity', cell.x, cell.y);
		if (target.buffs?.['paralysis'] === undefined) context.addBuff(target, 'paralysis', charge);
		if (charge % 2 === 1 && !context.applyDamage(target, context.electricDamage(target), 'electricity')) return;
	}
}

/** The `SacrificialFire` quest-room blob: only the live volume plus the prize/charge/cell
 * triple travel here - the room setup, prize generation and save/load stay scene-owned.
 * The field is deliberately named `t` (bound to the real one) so the `t('...')` key
 * audits keep seeing the reward line, the same shape `plantTriggers.ts` uses. */
export interface SacrificialFireContext {
	prize: () => GroundItem['item'] | undefined;
	setPrize: (prize: GroundItem['item'] | undefined) => void;
	charge: () => number;
	setCharge: (charge: number) => void;
	cell: () => number;
	levelWidth: number;
	depth: number;
	fire: {
		spread: (passable: (x: number, y: number) => boolean, intensity: number, decay: number) => void;
		volumeAt: (x: number, y: number) => number;
	};
	resetFire: () => void;
	passable: (x: number, y: number) => boolean;
	monsterExp: (kind: AnyMonsterId | undefined) => number;
	rollRange: (min: number, max: number) => number;
	spawnReward: (prize: NonNullable<GroundItem['item']>, x: number, y: number) => void;
	say: (line: string, level?: LogLevel) => void;
	t: (key: string) => string;
}

/** SacrificialFire spreads like a floor blob. Java marks actors for two turns; this
 * compact scene checks the active volume at death, which preserves the meaningful
 * room rule without adding another persistent combat buff solely for this feature. */
export function spreadSacrificialFire(ctx: SacrificialFireContext): void {
	if (!ctx.prize() || ctx.charge() <= 0) return;
	ctx.fire.spread(ctx.passable, 0.25, 0.9);
}

export function sacrificeCost(
	kind: AnyMonsterId | undefined,
	generation: number | undefined,
	ctx: SacrificialFireContext,
): number {
	let exp = ctx.monsterExp(kind);
	if (kind === 'statue' || kind === 'mimic') exp = 1 + ctx.depth;
	else if (kind === 'piranha') exp = 1 + Math.floor(ctx.depth / 2);
	else if (kind === 'swarm' && (generation ?? 0) > 0) exp = 1;
	return exp * ctx.rollRange(2, 3);
}

export function processSacrifice(creature: Creature, ctx: SacrificialFireContext): void {
	const prize = ctx.prize();
	if (!prize || ctx.charge() <= 0) return;
	if (ctx.fire.volumeAt(creature.x, creature.y) <= 0) return;
	ctx.setCharge(ctx.charge() - sacrificeCost(creature.kind, creature.generation, ctx));
	if (ctx.charge() > 0) return;
	const reward = ctx.cell() >= 0
		? { x: ctx.cell() % ctx.levelWidth, y: Math.floor(ctx.cell() / ctx.levelWidth) }
		: { x: creature.x, y: creature.y };
	ctx.spawnReward(prize, reward.x, reward.y);
	ctx.say(ctx.t('port.log.sacrificialfirereward'), 'positive');
	ctx.setPrize(undefined);
	ctx.setCharge(0);
	ctx.resetFire();
}
