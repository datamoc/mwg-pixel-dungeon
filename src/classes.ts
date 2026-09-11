import { MWL_CLASSES } from './mwlContent';

export type ClassId = 'warrior' | 'mage' | 'rogue' | 'huntress' | 'duelist' | 'cleric';

/**
 * A class's real day-one ranged/thrown action, bound to `T` - see `main.ts`'s file header for
 * why this is each kit's actual starting item rather than an invented talent. `kind` picks how
 * `SewersScene.useSpecial` resolves it: `throw` rolls to hit exactly like a melee swing and
 * has finite `ammo`; `zap` (the wand) never rolls to hit at all; `shoot` (the bow) always
 * rolls to hit but its damage grows with distance; `none` is an honest no-op.
 */
export type SpecialKind = 'throw' | 'zap' | 'shoot' | 'none';
export interface SpecialAction {
	kind: SpecialKind;
	/** SPD's own key for the item this action uses; empty when the class has no special */
	labelKey: string;
	/** null means unlimited (the wand and the bow are not consumable ammo in Java either) */
	ammo: number | null;
	damage: [number, number];
}

/**
 * `HeroClass.initHero`/`init{Warrior,Mage,Rogue,Huntress,Duelist,Cleric}` in Java: every
 * class starts with the same base HP/accuracy/evasion (`Hero.java`: HP=HT=20,
 * attackSkill=10, defenseSkill=5) and differs by starting weapon. Damage ranges are each
 * weapon's `min(0)`/`max(0)` (tier 1, unleveled); speed is `1/DLY` (`Gloves.DLY = 0.5`, i.e.
 * Huntress attacks twice as often bare-handed - everyone else's base weapon has the default
 * `DLY = 1`); `accuracy` folds in a weapon's own `ACC` multiplier (`Cudgel.ACC = 1.40f`, a
 * 40% boost - the Cleric is the one exception to the shared attackSkill of 10).
 *
 * Six classes, not four: this checkout's `HeroClass` enum (`actors/hero/HeroClass.java`)
 * predates Cleric - it stops at `DUELIST`, an older point in SPD's history than the 6-class
 * roster the game ships today (`v3.3.8` and later). Duelist's own numbers come from this
 * checkout same as the other four; Cleric's come from reading `HeroClass.java`/`Cudgel.java`
 * at tag `v3.3.8` directly (see `images.ts` for where its sprite comes from).
 *
 * `HeroClass.isUnlocked()` in Java: a fresh save only ever has Warrior unlocked
 * (`case WARRIOR: default: return true;`); every other class needs its own badge
 * (`Badges.Badge.UNLOCK_MAGE` etc.). `CLASSES[id].unlocked` below records that
 * fresh-save state, but gating now reads the live badge store (`classUnlocked`, in
 * `./badges.ts`) - earn the badge, unlock the class, across runs.
 */
export interface ClassDefinition {
	nameKey: string;
	weaponKey: string;
	damage: [number, number];
	speed: number;
	accuracy: number;
	blurbKey: string;
	unlocked: boolean;
	special: SpecialAction;
}

export const CLASSES: Record<ClassId, ClassDefinition> = Object.fromEntries(
	MWL_CLASSES.map(({ id, ...definition }) => [id, definition]),
) as unknown as Record<ClassId, ClassDefinition>;

/** classes whose T action spends finite ammo (Warrior/Rogue/Duelist) */
export const CLASS_AMMO = new Set<ClassId>(
	MWL_CLASSES.filter(({ ammo }) => ammo).map(({ id }) => id as ClassId),
);

/**
 * Badge-gated classes (`HeroClass.isUnlocked()` + `Badges.Badge.UNLOCK_*`): Warrior is
 * always open; every other class needs its badge, earned across runs and persisted in the
 * meta store. The Cleric has no Java unlock (it postdates the checkout), so first victory
 * opens it - a stated port rule.
 */
export const CLASS_BADGE: Record<ClassId, string | null> = Object.fromEntries(
	MWL_CLASSES.map(({ id, badge }) => [id, badge]),
) as Record<ClassId, string | null>;

export const CLASS_UNLOCK_HINT: Record<ClassId, string> = Object.fromEntries(
	MWL_CLASSES.map(({ id, unlockHint }) => [id, unlockHint]),
) as Record<ClassId, string>;

/** a class's real idle-stance frame: tier row 1 (the starting cloth-armour look), column 0 -
 * `HeroSprite.updateArmor()`'s `idle.frames(film, 0, 0, 0, 1, 0, 0, 1, 1)` */
export const HERO_IDLE_FRAME = 21; //row 1 * (256/12 cols, floored to 21) + column 0
