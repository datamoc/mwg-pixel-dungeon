import type { BuffState } from './buffs';
import type { EntityId } from './entityId';

export interface Step { x: number; y: number; }

/** Only the data needed by combat formulas. No sprite, scene, or framework reference. */
export interface Combatant extends Step {
	/** Stable across the object's lifetime; see `entityId.ts`. */
	id: EntityId;
	hp: number;
	maxHp: number;
	accuracy: number;
	evasion: number;
	damage: [number, number];
	armor: [number, number];
	buffs: BuffState;
	isHero?: boolean;
	/** Plain rule identifier; the scene narrows it to its MonsterId catalogue. */
	kind?: string;
	sleeping?: boolean;
	champion?: 'blessed' | 'blazing' | 'giant' | 'growing' | null;
	str?: number;
	strReq?: number;
	/** `Brute.BruteRage` active (post-revival), boosting `damageRoll()` to 15-40. */
	raged?: boolean;
	/** `ChampionEnemy.Growing`'s own growth multiplier, starting at 1.19 and rising 0.01/turn
	 * (`Growing.act()`) - undefined for every other champion type/non-champion. */
	championPower?: number;
}
