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
	/** Java `Char.Alignment.ALLY` beyond the hero itself: converted/summoned allies. Needed
	 * because several Java rules compare an attacker's alignment with the target's rather than
	 * asking whether it is the hero (`Char.attack()`'s Aggression branch is one). */
	isAlly?: boolean;
	/** Java `Char.Property.BOSS`/`Property.MINIBOSS`. Plain flags rather than a catalogue lookup
	 * so this module stays import-free of the monster tables, and `rollDamage` can key rules on
	 * them - the two properties are checked separately by name in several Java rules. */
	boss?: boolean;
	miniboss?: boolean;
	/** Plain rule identifier; the scene narrows it to its MonsterId catalogue. */
	kind?: string;
	sleeping?: boolean;
	champion?: 'blessed' | 'blazing' | 'giant' | 'growing' | 'antimagic' | 'projecting' | null;
	str?: number;
	strReq?: number;
	/** `Brute.BruteRage` active (post-revival), boosting `damageRoll()` to 15-40. */
	raged?: boolean;
	/** `ChampionEnemy.Growing`'s own growth multiplier, starting at 1.19 and rising 0.01/turn
	 * (`Growing.act()`) - undefined for every other champion type/non-champion. */
	championPower?: number;
}
