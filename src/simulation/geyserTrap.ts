import type { SimulationRandom } from './random';
import type { Creature, Step } from '../combat';

/** The `CharacterDamageOptions` slice this pure flow sets (`items/bombEffects.ts` carries the
 * shared type); structural, so `simulation/` keeps no items/scene import. The scene bridge
 * fills in whatever else the shared dispatch takes. */
export interface GeyserDamageOptions {
	readonly pierceArmor: boolean;
	readonly cause: 'trap';
	readonly sourceClassResistHalf?: boolean;
	readonly onNonWeaponBossDamage?: (target: Creature) => void;
}

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
	/** `Trap.HazardAssistTracker` prolong (`Buff.prolong` keep-max), bridged from the scene's
	 * `markHazardMob`. Java gates it on `source == this` inside `activate()`, so the utility
	 * path passes the real mark and callers that build a trap with `source` set elsewhere
	 * (the cursed-wand `Geyser.effect`) pass a no-op. */
	markHazardMob: (creature: Creature) => void;
	/** The scene's shared `applyCharacterDamage` dispatch (`panelsSingleUse.ts`), bridged by
	 * both live callers exactly like `BombEffectsContext.applyCharacterDamage`. */
	applyCharacterDamage: (target: Creature, damage: number, options: GeyserDamageOptions) => boolean;
	disqualifyBossChallenge: (target: Creature) => void;
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
		const damage = Math.floor(ctx.random.normalRange(5 + ctx.depth, 10 + ctx.depth * 2) * multiplier);
		//Java: `if (!ch.isImmune(GeyserTrap.class)) ch.damage(dmg, this)`
		//(`GeyserTrap.activate()`, tag `v3.3.8`) - the full `Char.damage()` seam, so Aura, Doom,
		//the defender curves, the invulnerability gates (SpectatorFreeze, dormant pylon, guarded
		//fist, ...), shield pools, damage hooks, wake and the death `kill` all ride the shared
		//dispatch; the hand-rolled `absorbHeroDamage`/`hp -=`/`doomDamage`/`kill` pair this
		//replaces only had Doom and the kill. `GeyserTrap` is absent from `AntiMagic.RESISTS`
		//(so the hero's share is not `magical`) and Java's `damage()` subtracts no DR here
		//(`pierceArmor`); no v3.3.8 class registers `GeyserTrap.class` in its immunities, so
		//Java's `isImmune` gate never fires, and BurningFist's own
		//`resistances.add(GeyserTrap.class)` (`YogFist.java` 284) halves its share instead.
		ctx.applyCharacterDamage(creature, damage, {
			pierceArmor: true,
			cause: 'trap',
			sourceClassResistHalf: creature.kind === 'yogFist' && creature.yogFistType === 'burning',
			onNonWeaponBossDamage: (target) => ctx.disqualifyBossChallenge(target),
		});
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
		if (creature) {
			//Java marks `source == this && ch instanceof Mob` *before* its hit
			//(`GeyserTrap.activate()`, tag `v3.3.8`, lines 79-81), so a lethal geyser hit
			//still counts as a hazard assist; `markHazardMob` skips the hero like `Mob` does.
			ctx.markHazardMob(creature);
			douseAndPush(creature, Math.sign(dx), Math.sign(dy), 0.67);
		}
	}
	const center = ctx.creatureAt(x, y);
	if (center) {
		ctx.markHazardMob(center);
		//Java prefers `centerKnockBackDirection` (only `AquaBrew.shatter` ever sets it, and
		//its recipe is Not ported - rows/consumables R082), else a random direction whose
		//both cells a hero can stand in, else any random direction; `targetpos == -1` (a hero
		//with no safe pair) skips the douse/push tail entirely, which the null target mirrors.
		const directions = center.isHero
			? ring.filter(([dx, dy]) => ctx.passable(x + dx, y + dy) && ctx.passable(x + dx * 2, y + dy * 2))
			: ring;
		const target = ctx.randomElement(directions);
		if (target) douseAndPush(center, target[0], target[1], 1);
	}
}
