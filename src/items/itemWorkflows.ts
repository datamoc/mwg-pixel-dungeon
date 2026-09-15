import { Actors } from 'mwg';

export type ItemLike = {
	id: string;
	quantity: number;
	instanceId?: string;
	level?: number;
	affix?: string;
	cursed?: boolean;
};

/** Applies an upgrade to one concrete item instance, including its affix policy. */
export function upgradeItem<T extends ItemLike>(item: T, delta: number, policy: Actors.AffixUpgradePolicy = 'keep'): number {
	return Actors.enchant(item, delta, policy);
}

/** Copies the complete enhancement state while deliberately retaining the target identity. */
export function transferEnhancement<T extends ItemLike>(from: T, to: T, move = false): void {
	to.level = from.level;
	Actors.copyAffix(from, to);
	if (move) Actors.removeAffix(from);
}
