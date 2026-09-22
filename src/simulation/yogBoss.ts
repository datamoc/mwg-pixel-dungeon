import type { Step } from './combatState';
import type { SimulationRandom } from './random';

export interface YogDeathGazeAimContext {
	width: number;
	height: number;
	hero: Step;
	yog: Step;
	maxHp: number;
	hp: number;
	neighbours: ReadonlyArray<readonly [number, number]>;
	index(x: number, y: number): number;
	passable(x: number, y: number): boolean;
	trace(from: Step, to: Step): Step[];
	random: SimulationRandom;
}

/**
 * `YogDzewa.act()`'s aiming half. Returns painted target cells, not damage targets: the scene
 * owns persistence and the later firing effects. MWG's line tracer is injected so this remains
 * a renderer-free beam planner.
 */
export function aimYogDeathGaze(context: YogDeathGazeAimContext): number[] {
	//Java's `1 + (HT - HP)/400` with HT 1000 escalates at 40%/80% damage taken.
	//This port scales Yog to 400 HP, so the literal /400 would never exceed one beam
	//while alive; dividing by 40% of the live max preserves Java's fractions exactly
	//(2nd beam at 60% HP remaining, 3rd at 20%). Integer arithmetic throughout: a float
	//divisor (`maxHp * 0.4`) would sit on a rounding edge at the exact thresholds.
	const beams = 1 + Math.floor(((context.maxHp - context.hp) * 5) / (context.maxHp * 2));
	const pathOf = (cell: number): number[] => {
		const to = { x: cell % context.width, y: Math.floor(cell / context.width) };
		return context.trace(context.yog, to).map((point) => context.index(point.x, point.y));
	};
	//Java paints into an `ArrayList`, so two extra beams may roll the same neighbour and
	//the cell fires twice - a plain list here, not a set, preserves those duplicates.
	const targets: number[] = [];
	const affected = new Set<number>();
	for (let i = 0; i < beams; i++) {
		let cell = context.index(context.hero.x, context.hero.y);
		if (i > 0) {
			const heroDistance = Math.hypot(context.hero.x - context.yog.x, context.hero.y - context.yog.y);
			//Java's `do/while` retries uncapped; termination is guaranteed because the
			//neighbour towards Yog is always strictly closer (equal counts as accepted).
			for (;;) {
				const [dx, dy] = context.neighbours[context.random.int(0, context.neighbours.length)]!;
				const x = context.hero.x + dx, y = context.hero.y + dy;
				if (x < 0 || y < 0 || x >= context.width || y >= context.height) continue;
				if (Math.hypot(x - context.yog.x, y - context.yog.y) > heroDistance) continue;
				cell = context.index(x, y);
				break;
			}
		}
		targets.push(cell);
		for (const pathCell of pathOf(cell)) affected.add(pathCell);
	}
	//Java sweeps `NEIGHBOURS9` - the hero's own cell counts too, not just the eight
	//neighbours (it is passable by construction: the hero stands on it).
	let allAdjacentTargeted = affected.has(context.index(context.hero.x, context.hero.y));
	for (const [dx, dy] of context.neighbours) {
		const x = context.hero.x + dx, y = context.hero.y + dy;
		if (x < 0 || y < 0 || x >= context.width || y >= context.height || !context.passable(x, y)) continue;
		if (!affected.has(context.index(x, y))) { allAdjacentTargeted = false; break; }
	}
	if (allAdjacentTargeted) targets.pop();
	return targets;
}

/** The four `YogDzewa` regular-summon kinds. A local union (not `AnyMonsterId`) so
 * this renderer-free module keeps its light imports; every member is a real
 * `MonsterId` the scene widens on store. */
export type YogMinionKind = 'ripperDemon' | 'larva' | 'eye' | 'scorpio';

/** `YogDzewa`'s `regularSummons` deck (`actors/mobs/YogDzewa.java`, tag `v3.3.8`),
 * in build order (Java `Random.shuffle`s it after). Normal: four slots, the first
 * `spawnersAlive` of them rippers, the rest larvae. Stronger Bosses: six slots,
 * indices under the spawner count alternate eye/scorpio (eye first), indices from
 * the count up to 4 are larvae, and the last two are always rippers. Pure so the
 * suite pins the composition matrix without a scene. */
export function buildYogMinionDeck(challenge: boolean, spawnersAlive: number): YogMinionKind[] {
	const deck: YogMinionKind[] = [];
	if (challenge) {
		for (let i = 0; i < 6; i++) {
			if (i >= 4) deck.push('ripperDemon');
			else if (i >= spawnersAlive) deck.push('larva');
			else deck.push(i % 2 === 0 ? 'eye' : 'scorpio');
		}
	} else {
		for (let i = 0; i < 4; i++) deck.push(i >= spawnersAlive ? 'larva' : 'ripperDemon');
	}
	return deck;
}
