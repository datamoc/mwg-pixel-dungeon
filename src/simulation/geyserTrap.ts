import type { SimulationRandom } from './random';
import type { Creature, Step } from '../combat';

export interface GeyserTrapContext {
	depth: number;
	random: SimulationRandom;
	neighbourOffsets: ReadonlyArray<readonly [number, number]>;
	randomElement: <T>(values: readonly T[]) => T | null;
	width: number;
	height: number;
	distanceMap: (origin: Step) => ArrayLike<number>;
	passable: (x: number, y: number) => boolean;
	setWater: (x: number, y: number) => void;
	clearFire: (x: number, y: number) => void;
	restitch: () => void;
	creatureAt: (x: number, y: number) => Creature | null;
	hero: Creature;
	absorbHeroDamage: (damage: number) => number;
	showDamage: (target: Creature, damage: number) => void;
	kill: (target: Creature, cause?: 'poison' | 'fire' | 'hunger' | 'trap' | 'foe') => void;
	moveTo: (creature: Creature, destination: Step) => void;
}

/**
 * Java reference: levels/traps/GeyserTrap.java, `activate()`, tag `v3.3.8`.
 * The port's compact terrain model uses passability as the non-solid-cell test and
 * its elemental/fist subtype fields as the fiery-elemental test (fire elementals and burning
 * fists only, matching the FIERY property); both reductions are intentional.
 */
export function activateGeyserTrap(ctx: GeyserTrapContext, x: number, y: number): void {
	const distance = ctx.distanceMap({ x, y });
	for (let gy = 0; gy < ctx.height; gy++) for (let gx = 0; gx < ctx.width; gx++) {
		const steps = distance[gy * ctx.width + gx] ?? -1;
		if (steps < 0 || steps > 2 || !ctx.passable(gx, gy)) continue;
		if (steps < 2 || ctx.random.int(0, 3) > 0) {
			ctx.setWater(gx, gy);
			ctx.clearFire(gx, gy);
		}
	}
	ctx.restitch();

	const ring = ctx.neighbourOffsets;
	/* Java tests the FIERY property, which only FireElemental (and its NewbornFireElemental heir) and BurningFist carry. */
	const fiery = (creature: Creature): boolean =>
		((creature.kind === 'elemental' || creature.kind === 'newbornElemental') && creature.elementalType === 'fire')
		|| (creature.kind === 'yogFist' && creature.yogFistType === 'burning');
	const geyserDamage = (creature: Creature, multiplier: number): void => {
		if (!fiery(creature)) return;
		let damage = Math.floor(ctx.random.normalRange(5 + ctx.depth, 10 + ctx.depth * 2) * multiplier);
		if (creature.isHero) {
			damage = ctx.absorbHeroDamage(damage);
			ctx.hero.hp -= damage;
			ctx.showDamage(ctx.hero, damage);
		} else if (creature.buffs['spectatorFreeze'] !== undefined) {
			//`Challenge.SpectatorFreeze` makes `Char.isInvulnerable()` true for
			//GeyserTrap's damage source too; the douse/push tail still runs.
		} else {
			creature.hp -= damage;
			ctx.showDamage(creature, damage);
			if (creature.hp <= 0) ctx.kill(creature, 'trap');
		}
	};
	const douseAndPush = (creature: Creature, dx: number, dy: number, multiplier: number): void => {
		geyserDamage(creature, multiplier);
		if (creature.hp <= 0) return;
		delete creature.buffs['burning'];
		for (let push = 0; push < 2; push++) {
			const next = { x: creature.x + dx, y: creature.y + dy };
			if (!ctx.passable(next.x, next.y) || ctx.creatureAt(next.x, next.y)) break;
			ctx.moveTo(creature, next);
		}
	};
	for (const [dx, dy] of ring) {
		const creature = ctx.creatureAt(x + dx, y + dy);
		if (creature) douseAndPush(creature, Math.sign(dx), Math.sign(dy), 0.67);
	}
	const center = ctx.creatureAt(x, y);
	if (center) {
		const directions = center.isHero
			? ring.filter(([dx, dy]) => ctx.passable(x + dx, y + dy) && ctx.passable(x + dx * 2, y + dy * 2))
			: ring;
		const [dx, dy] = ctx.randomElement(directions) ?? [0, 0];
		douseAndPush(center, dx, dy, 1);
	}
}
