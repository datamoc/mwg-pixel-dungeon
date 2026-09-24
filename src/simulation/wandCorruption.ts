import type { BuffId } from './buffs';

/**
 * `WandOfCorruption.onZap()` (`items/wands/WandOfCorruption.java`, tag `v3.3.8`): the resistance
 * model that decides whether a bolt corrupts its target outright, lands a debuff instead, or
 * (for an already-doomed target) refuses. Pure: the scene supplies the target's numbers and two
 * random draws, and applies the outcome.
 *
 * Reductions, stated in `PORT_COVERAGE.md`: Java's `Slow` (a MAJOR debuff, weight 2) and `Dread`,
 * `Corrosion` (weight 0) have no port buff id, so the MAJOR pool the port draws from is
 * Amok 3 / Hex 2 / Paralysis 1; `Corruption` is not a buff here (a converted ally is a scheduled
 * ally), so "already corrupted" is only ever the `doom` half of Java's check.
 */

const MAJOR_DEBUFF_WEAKEN = 1 / 2;
const MINOR_DEBUFF_WEAKEN = 1 / 4;

/** `MINOR_DEBUFFS`: the weighted picks (weight > 0) - zero-weight entries only shrink resistance. */
export const MINOR_DEBUFF_WEIGHTS: ReadonlyArray<readonly [BuffId, number]> = [
	['weakness', 2], ['vulnerable', 2], ['cripple', 1], ['blindness', 1], ['terror', 1],
];
/** `MAJOR_DEBUFFS` (weight > 0, port-available ids only - see the header). */
export const MAJOR_DEBUFF_WEIGHTS: ReadonlyArray<readonly [BuffId, number]> = [
	['amok', 3], ['hex', 2], ['paralysis', 1],
];
const MINOR_DEBUFF_IDS: ReadonlySet<string> = new Set<string>([
	...MINOR_DEBUFF_WEIGHTS.map(([id]) => id), 'chill', 'ooze', 'roots', 'vertigo', 'drowsy', 'bleeding', 'burning', 'poison',
]);
const MAJOR_DEBUFF_IDS: ReadonlySet<string> = new Set<string>([
	...MAJOR_DEBUFF_WEIGHTS.map(([id]) => id), 'daze', 'charm', 'magicalSleep', 'soulmark', 'frost', 'doom',
]);

export interface CorruptionTarget {
	kind: string;
	hp: number;
	maxHp: number;
	/** `Mob.EXP` - the experience the kill would give (`MONSTERS[kind].exp`). */
	exp: number;
	buffs: Readonly<Partial<Record<string, number>>>;
}

/** Corrupting power of the bolt: `3 + buffedLvl()/3`. */
export function corruptingPower(wandLevel: number): number {
	return 3 + wandLevel / 3;
}

/**
 * The target's resistance: base (by kind, else `1 + EXP`), times `1 + 4*(HP/HT)^2` (5x at full
 * health, 1.25x at a quarter), times a `(1 - weaken)` per debuff it carries (MAJOR halves, MINOR and
 * any other NEGATIVE buff cost a quarter). `depth` stands for both `Dungeon.depth` and
 * `Dungeon.scalingDepth()` (the port has no depth-scaling offset).
 */
export function corruptionResistance(target: CorruptionTarget, depth: number, isNegativeBuff: (id: string) => boolean): number {
	let resist: number;
	if (target.kind === 'mimic' || target.kind === 'statue' || target.kind === 'armoredStatue') resist = 1 + depth;
	else if (target.kind === 'piranha' || target.kind === 'bee') resist = 1 + depth / 2;
	else if (target.kind === 'wraith') resist = (1 + depth / 4) / 5;
	else if (target.kind === 'swarm') resist = (1 + target.exp) === 1 ? 1 + 3 : 1 + target.exp;
	else resist = 1 + target.exp;
	resist *= 1 + 4 * Math.pow(target.hp / target.maxHp, 2);
	for (const id of Object.keys(target.buffs)) {
		if (MAJOR_DEBUFF_IDS.has(id)) resist *= 1 - MAJOR_DEBUFF_WEAKEN;
		else if (MINOR_DEBUFF_IDS.has(id) || isNegativeBuff(id)) resist *= 1 - MINOR_DEBUFF_WEAKEN;
	}
	return resist;
}

export type CorruptionOutcome =
	| { kind: 'corrupt' }
	| { kind: 'doom' }
	| { kind: 'refuse' }
	| { kind: 'debuff'; id: BuffId };

export interface CorruptionRolls {
	/** `Random.Float()` in [0, 1). */
	float(): number;
}

/** `Random.chances`: one pick weighted by `weight`, or `undefined` when every weight is 0. */
function pickWeighted(entries: ReadonlyArray<readonly [BuffId, number]>, float: () => number): BuffId | undefined {
	const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
	if (total <= 0) return undefined;
	let roll = float() * total;
	for (const [id, weight] of entries) {
		if (weight <= 0) continue;
		if (roll < weight) return id;
		roll -= weight;
	}
	return undefined;
}

/**
 * The whole zap decision. `immune(id)` is `Char.isImmune` for a debuff, `corruptionImmune` says
 * `isImmune(Corruption.class)`, and `alreadyDoomed` is `buff(Corruption) != null || buff(Doom) != null`.
 */
export function resolveCorruptionZap(args: {
	power: number;
	resistance: number;
	buffs: Readonly<Partial<Record<string, number>>>;
	alreadyDoomed: boolean;
	corruptionImmune: boolean;
	immune: (id: BuffId) => boolean;
	rolls: CorruptionRolls;
}): CorruptionOutcome {
	const { resistance, buffs, alreadyDoomed, corruptionImmune, immune, rolls } = args;
	//A target that cannot be re-corrupted or doomed gets a debuff instead: its resistance is
	//matched to just under the power, so the tier roll below is (almost) always the MAJOR one.
	const power = alreadyDoomed ? resistance - 0.001 : args.power;
	const corruptEnemy = (): CorruptionOutcome => (alreadyDoomed ? { kind: 'refuse' } : corruptionImmune ? { kind: 'doom' } : { kind: 'corrupt' });
	const debuffEnemy = (major: boolean): CorruptionOutcome => {
		const table = major ? MAJOR_DEBUFF_WEIGHTS : MINOR_DEBUFF_WEIGHTS;
		//Buffs already on the target, and ones it is immune to, drop out of the draw.
		const usable = table.map(([id, weight]) => [id, buffs[id] !== undefined || immune(id) ? 0 : weight] as const);
		const id = pickWeighted(usable, rolls.float);
		if (id !== undefined) return { kind: 'debuff', id };
		//Nothing left in the tier: go up one (MINOR -> MAJOR -> corrupt).
		return major ? corruptEnemy() : debuffEnemy(true);
	};
	if (power > resistance) return corruptEnemy();
	return debuffEnemy(rolls.float() < power / resistance);
}
