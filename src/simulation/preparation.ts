import type { Creature, Step } from '../combat';

/**
 * `Preparation` (`actors/buffs/Preparation.java`, tag `v3.3.8`) - the Assassin's stealth state, and
 * the tables it drives. Kept pure and here rather than inline in the scene so `verifyCombat` can
 * pin every number against the source.
 *
 * The buff is applied when a character turns invisible (`Invisibility.attachTo`), counts the turns
 * it has been invisible, and detaches the moment it is not. While it holds, the character's attack
 * damage roll is replaced by `AttackLevel.damageRoll()` and the attack may execute a weak enemy
 * outright (`Char.attack()` 404-412 and 524-539). One hidden *side* effect: because the buff only
 * exists while invisible, and an attack dispels invisibility, the whole state is per-invisibility
 * rather than permanent.
 *
 * The `Talent.BOUNTY_HUNTER` loot bonus that reads `attackLevel()` in `Mob.lootChance()`
 * is ported, not here but at its call sites (checked against `Mob.java` 929-947 and `Char.java`
 * 404-412, tag `v3.3.8`): `bountyHunterDropBonus` (`talentEffects.ts`) is Java's own
 * `0.02 * 2^(attackLevel-1) * points`, armed when a prepared hero attack lands with the talent
 * (`combatResolution.ts`, mirroring the zero-duration `BountyHunterTracker` affect) and added
 * into the drop-chance multiplier beside Ring of Wealth (`bossLogic.ts`).
 * The blink action below used to be in the same unmodelled state (it needs a cell picker and
 * a teleport-strike); the picker half is ported now through the scene's `TargetingController`,
 * so the whole aim family lives here.
 *
 * Recorded gap, not faked: Java persists `turnsInvis` (`storeInBundle`/`restoreFromBundle`),
 * while this port's `prepInvisibleTurns` counter is scene state that resets on load - a
 * reloaded invisible hero restarts at level 1 and re-accumulates, instead of resuming.
 */

/** `AttackLevel`: the turns of invisibility each level needs, its damage bonus, and how many
 * damage rolls it takes the best of. */
export interface PreparationLevel {
	/** 1-4, Java's `ordinal() + 1`. */
	level: number;
	/** turnsInvis needed to reach this level. */
	turnsReq: number;
	/** `baseDmgBonus`: a fraction added on top of the best roll. */
	damageBonus: number;
	/** `damageRolls`: take the maximum of this many rolls. */
	damageRolls: number;
}

export const PREPARATION_LEVELS: readonly PreparationLevel[] = [
	{ level: 1, turnsReq: 1, damageBonus: 0.10, damageRolls: 1 },
	{ level: 2, turnsReq: 3, damageBonus: 0.20, damageRolls: 1 },
	{ level: 3, turnsReq: 5, damageBonus: 0.35, damageRolls: 2 },
	{ level: 4, turnsReq: 9, damageBonus: 0.50, damageRolls: 3 },
];

/**
 * `AttackLevel.getLvl(turnsInvis)`: the highest level whose requirement is met, walking the levels
 * in reverse - and `LVL_1` when none is, which is what Java's fallback returns (so 0 turns still
 * reports level 1; the buff itself is what tells a caller whether Preparation is up at all).
 */
export function preparationLevel(turnsInvis: number): PreparationLevel {
	for (let i = PREPARATION_LEVELS.length - 1; i >= 0; i--) {
		const level = PREPARATION_LEVELS[i]!;
		if (turnsInvis >= level.turnsReq) return level;
	}
	return PREPARATION_LEVELS[0]!;
}

/**
 * The level for a plain level *number* (1-4), for callers that already know which level they are
 * at - `Combatant.prepLevel` carries the number, so reading it must not be confused with reading
 * turns of invisibility (which is what `preparationLevel` takes, and which would silently shift
 * every level by one when handed a number). Out-of-range numbers clamp to the nearest level.
 */
export function preparationLevelByNumber(level: number): PreparationLevel {
	const index = Math.min(Math.max(Math.round(level), 1), PREPARATION_LEVELS.length) - 1;
	return PREPARATION_LEVELS[index]!;
}

/**
 * `AttackLevel.KOThresholds`, indexed by preparation level (1-4) and then by
 * `Talent.ENHANCED_LETHALITY` rank (0-3) - Java's own `[ordinal()][pointsInTalent(...)]`.
 */
const KO_THRESHOLDS: readonly (readonly number[])[] = [
	[0.03, 0.04, 0.05, 0.06],
	[0.10, 0.13, 0.17, 0.20],
	[0.20, 0.27, 0.33, 0.40],
	[0.50, 0.67, 0.83, 1.0],
];

/** `AttackLevel.KOThreshold()` for a preparation level and talent rank, both clamped to the table
 * (the talent cannot exceed rank 3, and a level outside 1-4 has no row). */
export function preparationKoThreshold(level: number, enhancedLethalityRank: number): number {
	const row = KO_THRESHOLDS[Math.min(Math.max(level, 1), 4) - 1]!;
	return row[Math.min(Math.max(enhancedLethalityRank, 0), 3)] ?? row[0]!;
}

/**
 * `AttackLevel.canKO(defender)`: the target is below the threshold *fraction of its own maximum*,
 * and a `BOSS`/`MINIBOSS` is only killable at one fifth of it. Java compares with a strict `<`.
 * The caller supplies current HP (Java reads `defender.HP/defender.HT`), and is responsible for the
 * `isAlive`/`alignment !=`/`isInvulnerable` guards that sit around the call in `Char.attack()`.
 */
export function preparationCanKo(
	currentHp: number,
	maxHp: number,
	level: number,
	enhancedLethalityRank: number,
	bossOrMiniboss: boolean,
): boolean {
	if (maxHp <= 0) return false;
	const threshold = preparationKoThreshold(level, enhancedLethalityRank);
	return currentHp / maxHp < (bossOrMiniboss ? threshold / 5 : threshold);
}

/**
 * `AttackLevel.blinkRanges`, indexed by preparation level (1-4) and `Talent.ASSASSINS_REACH` rank
 * (0-3). Exported as data even though the action itself is unported, so the table is checkable.
 */
const BLINK_RANGES: readonly (readonly number[])[] = [
	[1, 1, 2, 2],
	[2, 3, 4, 5],
	[3, 4, 6, 7],
	[4, 6, 8, 10],
];

/** `AttackLevel.blinkDistance()` - the range of `Preparation`'s blink action. */
export function preparationBlinkDistance(level: number, assassinsReachRank: number): number {
	const row = BLINK_RANGES[Math.min(Math.max(level, 1), 4) - 1]!;
	return row[Math.min(Math.max(assassinsReachRank, 0), 3)] ?? row[0]!;
}

/**
 * `AttackLevel.damageRoll(attacker)`: roll the attacker's damage `damageRolls` times, keep the
 * best, and add `baseDmgBonus` on top of it - `Math.round(dmg * (1f + baseDmgBonus))`.
 *
 * `roll` is supplied by the caller so the RNG draws stay in the attack's own deterministic order,
 * exactly as Java's `attacker.damageRoll()` calls do; the rolls happen before the rounding.
 */
export function preparationDamageRoll(level: PreparationLevel, roll: () => number): number {
	let best = roll();
	for (let i = 1; i < level.damageRolls; i++) {
		const candidate = roll();
		if (candidate > best) best = candidate;
	}
	return Math.round(best * (1 + level.damageBonus));
}

/**
 * `Preparation`'s blink-aim family (`usePreparationBlink` in the scene), moved here
 * verbatim as the file-size refactor's thirty-first extraction, behavior-identical.
 * The scene keeps the one-line adapter plus a builder; the strike tail (turn flag,
 * `attack()`, turn spend) arrives as callbacks so this module never learns combat.
 */
export interface PreparationBlinkContext {
	readonly hero: Creature;
	readonly subclass: () => string | null;
	readonly talentRank: (id: string) => number;
	readonly beginAiming: (opts: {
		range: number;
		validate: (cell: Step) => boolean;
		onConfirm: (cell: Step) => void;
	}) => void;
	readonly creatureAt: (x: number, y: number) => Creature | null | undefined;
	readonly fov: { isVisible(x: number, y: number): boolean };
	readonly level: {
		inside(x: number, y: number): boolean;
		passable(x: number, y: number): boolean;
		index(x: number, y: number): number;
	};
	/** MWG's breadth-first flood, `-1` for unreachable - Java's `Integer.MAX_VALUE`. */
	readonly distanceMap: (from: Step) => ArrayLike<number>;
	readonly moveTo: (creature: Creature, to: Step) => void;
	readonly refresh: () => void;
	set actionSpentTurn(spent: boolean);
	readonly attack: (attacker: Creature, defender: Creature) => void;
	readonly spendHeroTurn: (cost: number) => void;
	readonly getAttackTurnCostMod: () => number;
	readonly shakeScreen: (magnitude: number, duration: number) => void;
	//Message keys stay keys here (this directory cannot import the catalog): the scene
	//translates with `t()`; only the prompt carries a param, Java's `{0: distance}`.
	readonly say: (key: string, params: { readonly [param: string]: string | number } | null, level: 'positive' | 'negative') => void;
}

export function usePreparationBlink(context: PreparationBlinkContext): void {
	const level = context.hero.prepLevel;
	if (level === undefined) return;
	const distance = preparationBlinkDistance(level, context.subclass() === 'assassin' ? context.talentRank('assassins_reach') : 0);
	context.beginAiming({
		//Java applies the blink distance to the *destination* beside the target, so the
		//target itself may sit one step further out than that.
		range: distance + 1,
		validate: (cell) => blinkTarget(context, cell) !== null
			&& (canBumpAttack(context, cell) || blinkDestination(context, cell, distance) !== null),
		onConfirm: (cell) => confirmPreparationBlink(context, cell, distance),
	});
	context.say('actors.buffs.preparation.prompt', { 0: distance }, 'positive');
}

/** Java's `no_target` half of the picker: a visible hostile that is not the hero, an NPC, or
 * something the hero is charmed by. One clause is recorded, not reproduced: Java refuses the
 * specific charmer (`Dungeon.hero.isCharmedBy(enemy)`), but this port's `charm` buff carries no
 * source, so there is nothing to test the target against - refusing every target while charmed
 * would over-block (Java still lets a charmed hero blink at anyone else), and allowing the
 * charmer is the narrower deviation. */
export function blinkTarget(context: PreparationBlinkContext, cell: Step): Creature | null {
	const creature = context.creatureAt(cell.x, cell.y);
	if (!creature || creature.isHero || creature.isNPC || creature.isAlly) return null;
	if (!context.fov.isVisible(cell.x, cell.y)) return null;
	return creature;
}

/** `Dungeon.hero.canAttack(enemy)`'s practical half for this port: melee reach is one cell. */
export function canBumpAttack(context: PreparationBlinkContext, cell: Step): boolean {
	return Math.max(Math.abs(cell.x - context.hero.x), Math.abs(cell.y - context.hero.y)) <= 1;
}

/**
 * Java's destination search (`Preparation.java`, tag `v3.3.8`): among the eight cells around
 * the target, the free one with the smallest path distance from the hero (which must be within
 * `distance`). Ties keep the first cell in `NEIGHBOURS8` order - which is dy-outer/dx-inner
 * row-major, the same walk this loop uses - because Java only replaces on a strictly smaller
 * distance (`PathFinder.distance[dest] > PathFinder.distance[cell+i]`); there is no
 * true-distance tiebreak. `distanceMap` is MWG's breadth-first flood, the same shape as Java's
 * `PathFinder.buildDistanceMap(hero.pos, passable, range)` - `-1` marks an unreachable cell
 * where Java uses `Integer.MAX_VALUE`. Java floods `passable OR avoid` and lets a flying hero
 * land on `avoid` cells; this port has no separate `avoid` array (every hazardous-but-walkable
 * cell is already `passable`), so the `passable` test alone is the whole gate.
 */
export function blinkDestination(context: PreparationBlinkContext, cell: Step, distance: number): Step | null {
	const distances = context.distanceMap({ x: context.hero.x, y: context.hero.y });
	let best: Step | null = null;
	let bestSteps = Infinity;
	//All eight neighbours in NEIGHBOURS8 (row-major) order - first wins ties, as Java's
	//strict-greater comparison does.
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			if (dx === 0 && dy === 0) continue;
			const x = cell.x + dx, y = cell.y + dy;
			if (!context.level.inside(x, y)) continue;
			if (context.creatureAt(x, y)) continue;
			if (!context.level.passable(x, y)) continue;
			const steps = distances[context.level.index(x, y)] ?? -1;
			if (steps < 0 || steps > distance) continue;
			if (steps < bestSteps) {
				best = { x, y };
				bestSteps = steps;
			}
		}
	}
	return best;
}

/** Resolves the picker's cell for real: attack from where we stand, blink and attack, or
 * refuse with Java's own message. A rooted hero refuses exactly as Java does. */
export function confirmPreparationBlink(context: PreparationBlinkContext, cell: Step, distance: number): void {
	const enemy = blinkTarget(context, cell);
	if (!enemy) {
		context.say('actors.buffs.preparation.no_target', null, 'negative');
		return;
	}
	if (!canBumpAttack(context, cell)) {
		const destination = blinkDestination(context, cell, distance);
		if (!destination || context.hero.buffs['roots']) {
			context.say('actors.buffs.preparation.out_of_reach', null, 'negative');
			//`Preparation.java` 308-310: the refusal shakes only when the hero is *rooted* - the
			//message is the same for an unreachable cell, the shake is not.
			if (context.hero.buffs['roots']) context.shakeScreen(1, 1);
			return;
		}
		//Dungeon.observe() + GameScene.updateFog() + checkVisibleMobs(): refresh() re-runs the
		//hero's own field of view, the fog and the sprite visibility from the new cell.
		context.moveTo(context.hero, destination);
		context.refresh();
	}
	context.actionSpentTurn = true;
	context.attack(context.hero, enemy);
	context.spendHeroTurn(context.getAttackTurnCostMod());
}
