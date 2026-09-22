/**
 * Mob speed as Java spends it (tag v3.3.8), on top of the scheduler's flat one-turn default.
 *
 * - `Char.baseSpeed` / `speed()`: a step costs `1 / speed()`. `Bat`, `Crab` and `Piranha` set
 *   `baseSpeed = 2f`, so they cross two cells in the time the hero crosses one (`GreatCrab` and
 *   `RipperDemon` reset it to 1).
 * - `attackDelay()`: a swing costs that many turns. `Monk` (and `Senior`, its subclass),
 *   `RipperDemon` and `Thief` (and `Bandit`) return `super.attackDelay() * 0.5f`, so they hit
 *   twice per turn.
 *
 * The monster-turn dispatcher does not say what a turn consisted of, so the scene notes the
 * position a turn started from and whether the monster swung, and `monsterSpeedFactor` turns
 * that into the cost multiplier the scheduler charges once the turn ends. A turn that both
 * steps and swings pays both, which no Java mob's single action can do anyway.
 */
const MOVE_SPEED: Readonly<Record<string, number>> = { bat: 2, crab: 2, piranha: 2 };
const ATTACK_DELAY: Readonly<Record<string, number>> = { monk: 0.5, senior: 0.5, ripperDemon: 0.5, thief: 0.5, bandit: 0.5 };

const startedAt = new WeakMap<object, { x: number; y: number }>();
const swung = new WeakSet<object>();

/** Called as a monster's turn begins. */
export function beginMonsterTurn(monster: { x: number; y: number }): void {
	startedAt.set(monster, { x: monster.x, y: monster.y });
	swung.delete(monster);
}

/** Called for every melee/ranged attack a monster makes. */
export function noteMonsterAttack(monster: object): void {
	swung.add(monster);
}

/** The multiplier on this monster's turn cost for what it just did (1 for everyone else). */
export function monsterSpeedFactor(monster: { kind?: string; x: number; y: number; attackDelay?: number }): number {
	const kind = monster.kind;
	if (kind === undefined) return 1;
	let factor = 1;
	const from = startedAt.get(monster);
	const speed = MOVE_SPEED[kind];
	if (speed !== undefined && from && (from.x !== monster.x || from.y !== monster.y)) factor /= speed;
	//a statue's own weapon `DLY` rides the creature (`applyStatueKit`); the class table covers the rest
	const delay = ATTACK_DELAY[kind] ?? monster.attackDelay;
	if (delay !== undefined && swung.has(monster)) factor *= delay;
	return factor;
}
