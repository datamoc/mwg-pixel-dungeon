import { CLASS_KEYS } from './i18n/index';

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
export const CLASSES: Record<
	ClassId,
	{
		/** SPD's own key for the class name; `port.name.cleric` where SPD has none */
		nameKey: string;
		/** SPD's own key for the starting weapon */
		weaponKey: string;
		damage: [number, number];
		speed: number;
		accuracy: number;
		/** this port's own summary: SPD's `_desc_short` describes mechanics this port does not model */
		blurbKey: string;
		unlocked: boolean;
		special: SpecialAction;
	}
> = {
	warrior: {
		nameKey: CLASS_KEYS.warrior,
		weaponKey: 'port.name.wornshortsword',
		damage: [1, 10],
		speed: 1,
		accuracy: 10,
		blurbKey: 'port.class.warrior.blurb',
		unlocked: true,
		special: { kind: 'throw', labelKey: 'items.weapon.missiles.throwingstone.name', ammo: 3, damage: [2, 5] },
	},
	mage: {
		nameKey: CLASS_KEYS.mage,
		weaponKey: 'port.name.magesstaff',
		damage: [1, 6],
		speed: 1,
		accuracy: 10,
		blurbKey: 'port.class.mage.blurb',
		unlocked: false,
		special: { kind: 'zap', labelKey: 'items.wands.wandofmagicmissile.name', ammo: null, damage: [2, 8] },
	},
	rogue: {
		nameKey: CLASS_KEYS.rogue,
		weaponKey: 'port.name.dagger',
		damage: [1, 10],
		speed: 1,
		accuracy: 10,
		blurbKey: 'port.class.rogue.blurb',
		unlocked: false,
		special: { kind: 'throw', labelKey: 'items.weapon.missiles.throwingknife.name', ammo: 3, damage: [2, 6] },
	},
	huntress: {
		nameKey: CLASS_KEYS.huntress,
		weaponKey: 'port.name.gloves',
		damage: [1, 5],
		speed: 2,
		accuracy: 10,
		blurbKey: 'port.class.huntress.blurb',
		unlocked: false,
		special: { kind: 'shoot', labelKey: 'items.weapon.spiritbow.name', ammo: null, damage: [1, 6] },
	},
	duelist: {
		nameKey: CLASS_KEYS.duelist,
		weaponKey: 'port.name.rapier',
		damage: [1, 8],
		speed: 1,
		accuracy: 10,
		blurbKey: 'port.class.duelist.blurb',
		unlocked: false,
		special: { kind: 'throw', labelKey: 'items.weapon.missiles.throwingspike.name', ammo: 2, damage: [2, 5] },
	},
	cleric: {
		nameKey: CLASS_KEYS.cleric,
		weaponKey: 'port.name.cudgel',
		damage: [1, 8],
		speed: 1,
		accuracy: 14,
		blurbKey: 'port.class.cleric.blurb',
		unlocked: false,
		special: { kind: 'none', labelKey: '', ammo: 0, damage: [0, 0] },
	},
};

/** classes whose T action spends finite ammo (Warrior/Rogue/Duelist) */
export const CLASS_AMMO = new Set<ClassId>(['warrior', 'rogue', 'duelist']);

/**
 * Badge-gated classes (`HeroClass.isUnlocked()` + `Badges.Badge.UNLOCK_*`): Warrior is
 * always open; every other class needs its badge, earned across runs and persisted in the
 * meta store. The Cleric has no Java unlock (it postdates the checkout), so first victory
 * opens it - a stated port rule.
 */
export const CLASS_BADGE: Record<ClassId, string | null> = {
	warrior: null,
	mage: 'unlock_mage',
	rogue: 'unlock_rogue',
	huntress: 'unlock_huntress',
	duelist: 'unlock_duelist',
	cleric: 'victory',
};

export const CLASS_UNLOCK_HINT: Record<ClassId, string> = {
	warrior: '',
	mage: 'Unlock: use an upgrade scroll.',
	rogue: 'Unlock: land 10 surprise attacks.',
	huntress: 'Unlock: throw 10 times.',
	duelist: 'Unlock: raise a weapon to +2.',
	cleric: 'Unlock: win a run.',
};

/** a class's real idle-stance frame: tier row 1 (the starting cloth-armour look), column 0 -
 * `HeroSprite.updateArmor()`'s `idle.frames(film, 0, 0, 0, 1, 0, 0, 1, 1)` */
export const HERO_IDLE_FRAME = 21; //row 1 * (256/12 cols, floored to 21) + column 0
