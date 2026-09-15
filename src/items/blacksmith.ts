import { Random } from 'mwg';
import { getCurse } from './itemCurses';

export interface BlacksmithItem {
	id: string; quantity: number; instanceId?: string; identified?: boolean; cursed?: boolean;
	affix?: string; level?: number; hardened?: boolean;
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
	return ['weaponReward', 'armorReward', 'armor'].includes(item.id);
}

export function selectBlacksmithUpgradeItems(items: readonly BlacksmithItem[], excludedInstanceIds: Set<string | undefined>): BlacksmithItem[] {
	return items.filter((item) => item.quantity > 0 && isBlacksmithGear(item) && (item.identified ?? false)
		&& !item.cursed && (item.level ?? 0) < 2 && !excludedInstanceIds.has(item.instanceId));
}

export function selectBlacksmithHardenItems(items: readonly BlacksmithItem[]): BlacksmithItem[] {
	return items.filter((item) => item.quantity > 0 && isBlacksmithGear(item) && (item.identified ?? false)
		&& !item.cursed && !item.hardened);
}

export function selectBlacksmithReforgeItems(items: readonly BlacksmithItem[]): BlacksmithItem[] {
	return items.filter((item) => item.quantity > 0 && isBlacksmithGear(item)
		&& (item.identified ?? false) && !item.cursed);
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
