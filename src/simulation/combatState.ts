import type { BuffState } from './buffs';
import type { EntityId } from './entityId';

export interface Step { x: number; y: number; }

/** Chebyshev steps between two cells - the same `max(|dx|, |dy|)` math as
 * `mwg/roguelike`'s `chebyshevDistance`, kept local because simulation modules
 * run headless without the framework runtime. */
export function chebyshevDistance(a: Step, b: Step): number {
	return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

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
	/** `Preparation.AttackLevel` level (1-4) while the attacker's Preparation buff is up, which
	 * replaces its damage roll and unlocks the assassinate. Absent means no Preparation - Java
	 * reads the same thing from `buff(Preparation.class) != null`. */
	prepLevel?: number;
	/** Plain rule identifier; the scene narrows it to its MonsterId catalogue. */
	kind?: string;
	/** `MissileWeapon.damageRoll()` post-roll multiplier, rounded before Char.attack modifiers. */
	damageRollMultiplier?: number;
	/**
	 * `AscensionChallenge.AscensionBuffBlocker` (`AscensionChallenge.java:416`, tag `v3.3.8`):
	 * chars holding it are not boosted by the ascension table. Java's marker is an (empty, no
	 * `act`/duration/store) `Buff`; this port keeps it as a plain flag instead - behaviorally
	 * identical, since the buff carries no state and expires with its holder. Set only on
	 * `RATFORCEMENTS`-summoned ally rats (`Ratmogrify.java:111`); the hero's own rat form has
	 * no table kind so it needs nothing, and enemy `TransmogRat`s keep their original kind
	 * (see `Creature.ratmogrifiedTurns`), which is exactly Java's unwrap-to-original.
	 */
	ascensionBuffBlocked?: boolean;
	/** `DwarfKing.isImmune(Doom.class)` changes at phase 2 while Doom may remain attached. */
	kingPhase?: number;
	/** NPC and summon identity for Java `Char.damage()` Doom immunity edge cases. */
	isNPC?: boolean;
	allyKind?: string;
	sleeping?: boolean;
	champion?: 'blessed' | 'blazing' | 'giant' | 'growing' | 'antimagic' | 'projecting' | null;
	str?: number;
	strReq?: number;
	/** DriedRose.GhostHero weapon defenseFactor; rolled independently after armor DR. */
	weaponDefense?: number;
	/** `Brute.BruteRage` active (post-revival), boosting `damageRoll()` to 15-40. */
	raged?: boolean;
	/** `ChampionEnemy.Growing`'s own growth multiplier, starting at 1.19 and rising 0.01/turn
	 * (`Growing.act()`) - undefined for every other champion type/non-champion. */
	championPower?: number;
	/** Barkskin (`actors/buffs/Barkskin.java`, tag `v3.3.8`): independent armor roll. */
	barkskinLevel?: number;
	barkskinInterval?: number;
	barkskinCooldown?: number;
}
