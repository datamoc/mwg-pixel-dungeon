/**
 * The real armor abilities (`actors/hero/abilities/**`, tag `v3.3.8`) as data plus the pure
 * charge arithmetic around them. Behaviour lives in `dungeonScene.ts`; everything that can be
 * checked without a scene lives here.
 *
 * The authored numbers (which class owns which ability, its `baseChargeUse`, whether it takes a
 * target, and its three T4 talents) are rows in `src/content/talent-rules.mwl`, matching how this
 * port keeps SPD's data in MWL and its code in TypeScript.
 */
import type { ClassId } from './classes';
import { MWL_TABLE_ROWS } from './mwlContent';

/**
 * Java's `targetingPrompt()` return value, collapsed to what a caller has to know:
 * - `none`  - no prompt at all (Endure, Elemental Blast, Nature's Power); activating it uses the
 *             hero's own cell.
 * - `cell`  - always asks for a cell.
 * - `beacon`/`clone`/`hawk` - asks for a cell only in one state (Warp Beacon before a beacon
 *             exists, Shadow Clone with no clone out, Spirit Hawk with no hawk out); in the other
 *             state it acts on the hero's own cell, i.e. it behaves like `none`.
 */
export type ArmorAbilityTargeting = 'none' | 'cell' | 'beacon' | 'clone' | 'hawk';

export interface ArmorAbilityDef {
	id: string;
	classId: ClassId;
	/** `ArmorAbility.baseChargeUse`: 35 by default, overridden per ability (Endure 50, Wild
	 *  Magic/Death Mark/Spectral Blades/Elemental Strike 25, ...). */
	baseChargeUse: number;
	targeting: ArmorAbilityTargeting;
	/** The ability's own three T4 talents, in `talents()` order (no `HEROIC_ENERGY` here - that
	 *  one is universal and appended by `armorTalentDefinitions`). */
	talents: readonly string[];
}

/** `ClassArmor.charge` runs 0-100 and a class armor is created at 50 (`ClassArmor.upgrade()`). */
export const ARMOR_CHARGE_MAX = 100;
export const ARMOR_CHARGE_START = 50;
/**
 * `ClassArmor.Charger.act()`: `chargeGain = 100/500f` per `TICK`, i.e. 500 turns from empty to
 * full, times `RingOfEnergy.armorChargeMultiplier(target)` (this port's `ringEnergyMultiplier`,
 * which is that same `1.175^bonusLevel`). Gated on `Regeneration.regenOn()` in Java, which is
 * about starvation/no-regen states this port does not model - the gate is therefore not
 * reproduced, and no state here suppresses regen.
 */
export const ARMOR_CHARGE_PER_TURN = 100 / 500;

/** `ArmorAbility.chargeUse()`'s `HEROIC_ENERGY` table: reduced charge use by 12%/23%/32%/40%. */
const HEROIC_ENERGY_FACTORS = [1, 0.88, 0.77, 0.68, 0.6] as const;

const DEFINITIONS = new Map<string, ArmorAbilityDef>(
	MWL_TABLE_ROWS('armorAbilities', 'id').map((row) => {
		const def: ArmorAbilityDef = {
			id: String(row.id),
			classId: String(row.class) as ClassId,
			baseChargeUse: Number(row.charge),
			targeting: String(row.targeting) as ArmorAbilityTargeting,
			talents: (Array.isArray(row.talents) ? row.talents.map(String) : []).filter((id) => id.length > 0),
		};
		return [def.id, def];
	}),
);

export function armorAbilityDef(id: string): ArmorAbilityDef | undefined {
	return DEFINITIONS.get(id);
}

/**
 * Which of the real abilities this port can actually run end to end. Every ability in the authored
 * table has its real name, charge cost, targeting mode and T4 talent list, but an ability whose
 * `activate()` is not implemented has nothing to do when used, so it is deliberately **not**
 * offered: `armorAbilitiesFor()` returns the ported subset, and a class with an empty subset keeps
 * its armor ability unchosen (and its T4 pool ungranted, which is Java's own behavior while
 * `armorAbility == null`) rather than handing the player a choice that cannot be spent.
 *
 * Ported so far: the Warrior's three and the Rogue's Death Mark. Still to port, each needing its
 * own systems: the Mage's (`ElementalBlast` and `WildMagic` need per-wand blast factors and a
 * wand-randomization pass; `WarpBeacon` needs a beacon actor and window), the Rogue's remaining two
 * (`SmokeBomb` needs the real `Blindness` buff and the `NinjaLog` ally; `ShadowClone` needs an ally
 * actor), the Huntress's (`SpectralBlades` needs the spirit-blade projectile and an attack damage
 * multiplier; `NaturesPower` a growing-power tracker wired into the SpiritBow; `SpiritHawk` an ally
 * actor) and the Duelist's (`Challenge` needs a duel tracker; `ElementalStrike` the four blade
 * imbuements; `Feint` a feint buff). See `PORT_COVERAGE.md`'s armor-ability rows.
 */
const PORTED_ARMOR_ABILITIES: ReadonlySet<string> = new Set(['heroicleap', 'shockwave', 'endure', 'deathmark']);

/** The implemented abilities for one class, in `HeroClass.armorAbilities()` order (the authored
 *  table's own row order, which `DEFINITIONS` preserves). */
export function armorAbilitiesFor(classId: ClassId): string[] {
	return [...DEFINITIONS.values()]
		.filter((def) => def.classId === classId && PORTED_ARMOR_ABILITIES.has(def.id))
		.map((def) => def.id);
}

/** Whether an ability is implemented well enough to be offered. */
export function armorAbilityIsPorted(id: string): boolean {
	return PORTED_ARMOR_ABILITIES.has(id);
}

/**
 * Whether an id names something this port knows as an armor ability at all - every authored row,
 * ported or not, plus `ratmogrify`, which the Rat King grants and which deliberately has no row
 * (see `PORTED_ARMOR_ABILITIES`' note about its unported talent tree). Used to decide whether a
 * saved ability id survives a load, so it is deliberately wider than `armorAbilityDef`.
 */
export function isKnownArmorAbility(id: string): boolean {
	return id === 'ratmogrify' || DEFINITIONS.has(id);
}

/** The real `actors.hero.abilities.<class>.<id>` message key base - `.name`/`.short_desc`/`.desc`
 *  hang off it, and `.prompt` for the targeted ones. These are SPD's own strings (translated in
 *  every offered locale), which is why nothing here needs a `port.*` key. */
export function armorAbilityKey(id: string, classId: ClassId): string {
	return `actors.hero.abilities.${classId}.${id}`;
}

/**
 * `ArmorAbility.chargeUse(hero)` and the two per-ability overrides that change it:
 * `HeroicLeap.chargeUse()`'s `0.84^points` in `DOUBLE_JUMP` while its `DoubleJumpTracker` is up,
 * and `DeathMark.chargeUse()`'s `0.707^points` in `DOUBLE_MARK` while `DoubleMarkTracker` is armed
 * (30/50/65/75% off at rank 1-4). Both are keyed off the ability id rather than left to the caller,
 * because each is an override on that ability alone - every other ability inherits the base
 * implementation - and the `HEROIC_ENERGY` table applies underneath both, in Java's own order
 * (`super.chargeUse(hero)` first, then the override's multiplier).
 */
export function armorChargeUse(
	def: ArmorAbilityDef,
	options: {
		heroicEnergyRank: number;
		doubleJumpArmed?: boolean;
		doubleJumpRank?: number;
		doubleMarkArmed?: boolean;
		doubleMarkRank?: number;
	},
): number {
	const heroicEnergy = HEROIC_ENERGY_FACTORS[Math.min(4, Math.max(0, options.heroicEnergyRank))] ?? 1;
	let chargeUse = def.baseChargeUse * heroicEnergy;
	const rank = (points: number | undefined) => Math.min(4, Math.max(0, points ?? 0));
	if (def.id === 'heroicleap' && options.doubleJumpArmed) {
		chargeUse *= Math.pow(0.84, rank(options.doubleJumpRank));
	}
	if (def.id === 'deathmark' && options.doubleMarkArmed) {
		chargeUse *= Math.pow(0.707, rank(options.doubleMarkRank));
	}
	return chargeUse;
}
