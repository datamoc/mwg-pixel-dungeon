import { Random } from 'mwg';
import { getCurse } from './itemCurses';
import { isUpgradableItem } from './itemKinds';
import { isClassArmorId } from './catalog';

export interface BlacksmithItem {
	id: string; quantity: number; instanceId?: string; identified?: boolean; cursed?: boolean;
	affix?: string; level?: number; hardened?: boolean;
	/** `MissileWeapon`'s own class, which is what tells a carried missile stack apart from the
	 *  runestone that shares its `'stone'` bag id - see `isUpgradableItem`. */
	sourceClass?: string;
	/** A carried missile stack's own set id, which the reforge retires when it consumes the stack
	 *  (see `reforgeDiscardedMissileSet`) - absent on every non-missile. */
	missileSet?: string;
}

export const BLACKSMITH_SMITH_COST = 2000;

/** `Blacksmith.Quest.complete()`: the DarkGold half of favor is capped - favour
 * beyond 40 ore (2000) is lost, and the cap applies before the boss bonus. */
export const BLACKSMITH_FAVOR_CAP = 2000;
/** `Blacksmith.Quest.complete()`'s `if (bossBeaten) favor += 1000`. */
export const BLACKSMITH_QUEST_BOSS_BONUS = 1000;
/** `Blacksmith.Quest.complete()`'s `if (favor >= 2500) freePickaxe = true`. */
export const BLACKSMITH_FREE_PICKAXE_FAVOR = 2500;

/** `Blacksmith.Quest.complete()`'s favor arithmetic, without the pickaxe/belongings
 * handling the scene owns. `Statistics.questScores[2] += favor` has no counterpart:
 * this port tracks no quest-score table (endgame/Rankings work, not a forge gap). */
export function blacksmithTurnInFavor(darkGoldQuantity: number, bossBeaten: boolean): number {
	let favor = Math.min(BLACKSMITH_FAVOR_CAP, darkGoldQuantity * 50);
	if (bossBeaten) favor += BLACKSMITH_QUEST_BOSS_BONUS;
	return favor;
}

export function blacksmithUpgradeCost(upgrades: number): number { return 1000 + 1000 * upgrades; }
export function blacksmithHardenCost(hardens: number): number { return 500 + 1000 * hardens; }
export function blacksmithReforgeCost(reforges: number): number { return 500 + 1000 * reforges; }

export function isBlacksmithGear(item: BlacksmithItem): boolean {
	return ['weaponReward', 'armorReward', 'armor'].includes(item.id) || isClassArmorId(item.id);
}

/**
 * Java's `WndBlacksmith.WndUpgrade`/`WndReforge` `itemSelectable`: `item.isUpgradable() &&
 * item.isIdentified() && !item.cursed` - no type test at all, which is why Java's Blacksmith can
 * upgrade a wand or a ring, and why a carried missile stack is a real target there too
 * (`MissileWeapon extends Weapon` and never overrides `isUpgradable()`).
 *
 * One class is excluded on top of Java's predicate, and it is this port's own model drawing the
 * line rather than a reading of Java - a **wand** *is* a real Blacksmith target in Java, and would
 * be a silent no-op here (the port's wands are one shared bag id whose power comes from
 * `weaponLevel` - see `useWardingWand`'s `degradedLevel(this.weaponLevel)` - so `item.level` on a
 * wand item is read by nothing). Offering it would let the service be paid for and then change
 * nothing, which is worse than not offering it. Rings are per-item in this port
 * (`ringBonusLevel` reads the equipped ring's own level) and so reach this service exactly as
 * Java's do.
 *
 * A **missile stack** was excluded here until 2026-09-16, when carried stacks gained a level, a set
 * id and their own wear (`src/missiles.ts`): Java upgrades the stack's own level, and so does this
 * port now, which is what makes `MissileWeapon.upgrade()`'s durability reset meaningful here.
 */
function isBlacksmithServiceTarget(item: BlacksmithItem): boolean {
	//`'wand'` is the port's own *minted* single wand bag id (`itemKinds.ts`'s
	//`sourceInventoryItem`), not an authored node - so it is not in `MWL_ITEM_SLOTS` and the id
	//itself is the marker, the same way the infusion pickers already treat it.
	return isUpgradableItem(item) && item.id !== 'wand';
}

export function selectBlacksmithUpgradeItems(items: readonly BlacksmithItem[], excludedInstanceIds: Set<string | undefined>): BlacksmithItem[] {
	return items.filter((item) => item.quantity > 0 && isBlacksmithServiceTarget(item) && (item.identified ?? false)
		&& !item.cursed && (item.level ?? 0) < 2 && !excludedInstanceIds.has(item.instanceId));
}

export function selectBlacksmithHardenItems(items: readonly BlacksmithItem[]): BlacksmithItem[] {
	return items.filter((item) => item.quantity > 0 && isBlacksmithGear(item) && (item.identified ?? false)
		&& !item.cursed && !item.hardened);
}

/**
 * The *class* two reforge picks must share, which is what Java's `item1.getClass() != item2.getClass()`
 * test needs (`WndBlacksmith.WndReforge`'s `onSelect`). This port mints a single id for every
 * generated weapon, every generated armor and every wand, so the bag id alone cannot tell two
 * classes apart - it would happily reforge a handaxe into a shortsword. `sourceClass` is the
 * per-class payload every generated entry carries (`itemKinds.ts`'s `sourceInventoryItem`), so it is
 * the identity; items with no payload of their own (a plain `'armor'`, a ring) fall back to their id,
 * which already names their class.
 */
export function blacksmithItemClass(item: BlacksmithItem): string {
	return item.sourceClass ?? item.id;
}

/** `WndBlacksmith.WndReforge`'s pair rule: two picks that are the same class and not the same
 *  *entry* (Java's `item1 == item2`). The reforge button stays disabled until both hold. */
export function blacksmithReforgePairValid(first: BlacksmithItem, second: BlacksmithItem): boolean {
	if (first === second) return false;
	if (first.instanceId !== undefined && first.instanceId === second.instanceId
		&& blacksmithItemClass(first) === blacksmithItemClass(second)) return false;
	return blacksmithItemClass(first) === blacksmithItemClass(second);
}

/**
 * `WndBlacksmith.WndReforge`'s own `itemSelectable` - which is the *same* predicate as the upgrade
 * window's (`isIdentified() && !cursed && isUpgradable()`), with no level cap: Java really does
 * offer every upgradable carried item to the reforge, wands and missile stacks included. This port
 * keeps that predicate and reuses the upgrade service's one model-blocked exclusion (see
 * `isBlacksmithServiceTarget`): a wand's level is read by nothing, so a reforge that consumed one
 * would take the player's favour and change nothing. What it no longer does is restrict the picker
 * to a hand-list of three gear ids, which is why rings (per-item in this port) and, since
 * 2026-09-16, carried missile stacks can be reforged exactly as Java allows.
 */
export function selectBlacksmithReforgeItems(items: readonly BlacksmithItem[]): BlacksmithItem[] {
	return items.filter((item) => item.quantity > 0 && isBlacksmithServiceTarget(item)
		&& (item.identified ?? false) && !item.cursed);
}

/**
 * `WndBlacksmith.WndReforge`'s one missile clause, which only a missile pair can reach: **the
 * consumed stack's set is retired** - `levelThresholds.put(second.setID, Integer.MAX_VALUE)`
 * (Java 279-282). Every heap still carrying that set is then below its threshold, so it crumbles on
 * pickup instead of resurrecting the stack the player just spent.
 *
 * The *surviving* stack's own record (`levelThresholds[setID] = trueLevel()+1`) is
 * `MissileWeapon.upgrade()`'s, not the reforge window's - it happens whichever way the stack is
 * upgraded, so the scene's `onMissileStackUpgraded` makes it. Keys are the stacks' set ids (see
 * `src/missiles.ts`); a pair of non-missiles records nothing, exactly as in Java.
 */
export function reforgeDiscardedMissileSet(
	thresholds: ReadonlyMap<string, number>,
	discarded: BlacksmithItem,
): Map<string, number> {
	const next = new Map(thresholds);
	if (discarded.missileSet !== undefined) next.set(discarded.missileSet, Number.MAX_SAFE_INTEGER);
	return next;
}

/** `Weapon.upgrade()`/`Armor.upgrade()`'s carried-item affix/hardening roll. */
export function rollCarriedAffixLoss(item: BlacksmithItem, onMessage: (key: string, level: 'positive' | 'warning') => void): void {
	const level = item.level ?? 0;
	if (!item.affix) return;
	if (item.hardened) {
		if (level >= 6 && Random.float(10) < Math.pow(2, level - 6)) {
			item.hardened = false;
			onMessage(item.id.startsWith('armor') ? 'port.log.hardeninggone.armor' : 'port.log.hardeninggone.weapon', 'warning');
		}
		return;
	}
	if (getCurse(item.affix)) {
		if (Random.int(0, 3) === 0) {
			item.affix = undefined;
			onMessage('items.scrolls.scrollofupgrade.remove_curse', 'positive');
		}
	} else if (level >= 4 && Random.float(10) < Math.pow(2, level - 4)) {
		item.affix = undefined;
		onMessage(item.id.startsWith('armor') ? 'items.armor.armor.incompatible' : 'items.weapon.weapon.incompatible', 'warning');
	}
}
