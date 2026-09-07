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
	champion?: 'blessed' | 'blazing' | null;
	str?: number;
	strReq?: number;
	/** `Brute.BruteRage` active (post-revival), boosting `damageRoll()` to 15-40. */
	raged?: boolean;
}
