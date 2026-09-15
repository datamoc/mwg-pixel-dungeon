import { Actors } from 'mwg';
import { t } from '../i18n/index';
import { buybackPrice, getSellPrice, getShopPrice } from './shopPricing';
import { isMissileStack, isUpgradableItem } from './itemKinds';

export interface ShopEntry {
	id: string; quantity: number; instanceId?: string; identified?: boolean; tier?: number;
	level?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; seal?: boolean;
}

export interface ShopActionsContext {
	readonly heroStats: Actors.StatBlock;
	readonly bag: Actors.Inventory;
	readonly stock: Actors.Inventory;
	readonly buyback: ShopEntry[];
	readonly depth: number;
	readonly openItemPicker: (title: string, entries: ShopEntry[], onPick: (entry: ShopEntry) => void) => void;
	readonly itemDisplayName: (id: string, identified: boolean) => string;
	readonly say: (message: string, level?: 'positive' | 'negative' | 'warning') => void;
	/**
	 * `WndTradeItem`'s selling buttons, which are the whole reason it is a *window* and not a
	 * single action: a lone item gets one button, a stack gets a choice of one or all. The scene
	 * owns the window and only renders it - which quantities exist, and SPD's `sell`/`sell_1`/
	 * `sell_all` labels with their prices, are decided here so this stays headless-testable.
	 */
	readonly showSellOptions: (
		itemName: string,
		options: readonly { units: number; label: string }[],
		onPick: (units: number) => void,
	) => void;
}

export function shopPrice(id: 'potion' | 'scrollIdentify', depth: number): number {
	return getShopPrice(id === 'potion' ? 'potionHealing' : id, depth);
}

export function shopSellPrice(id: 'food' | 'meat', depth: number): number {
	return getSellPrice(id, depth);
}

export function buyFromShop(id: 'potion' | 'scrollIdentify', context: ShopActionsContext): void {
	const price = shopPrice(id, context.depth);
	const prices = new Map([[id, { buy: price, sell: 0 }]]);
	const name = context.itemDisplayName(id === 'potion' ? 'potionHealing' : 'scrollIdentify', true);
	if (Actors.buy(context.heroStats, context.stock, context.bag, id, 1, { currency: 'gold', prices })) {
		context.say(t('port.log.buy', { item: name, price }), 'positive');
	} else context.say(t('port.log.cannotafford', { item: name, price }), 'negative');
}

/**
 * `WndTradeItem`'s *selling* half: pick a carried item, then sell one unit or the whole stack.
 *
 * Java builds two different windows from one rule (`WndTradeItem.java` 78-131): when
 * `item.quantity() == 1 || (item instanceof MissileWeapon && item.isUpgradable())` it shows a
 * single `sell` button that sells the item outright, and otherwise a `sell_1` button at
 * `priceAll / item.quantity()` beside a `sell_all` at `priceAll` (= `item.value()`, the *stack*
 * total - this port's `getSellPrice` third argument is the same quantity-aware total). So a lone
 * item has no quantity to choose and an upgradable missile stack deliberately does not get the
 * choice either: Java sells those whole, one button.
 *
 * What this replaces sold exactly one unit for every item, which silently made a stack of twelve
 * potions take twelve picks to clear and gave no way to sell it in one action.
 *
 * Not modelled: the `extraThrownLeft` warning above the button (`WndUpgrade.thrown_dust`), which
 * needs Java's per-stack extra-thrown counter - this port's ammo has no such state (see the
 * `MissileWeapon` rows in `PORT_COVERAGE.md`).
 */
export function sellFood(context: ShopActionsContext): void {
	const candidates = (context.bag.items as ShopEntry[]).filter((item) =>
		item.quantity > 0 && getSellPrice(item.id, context.depth, 1, item.identified ?? true, item) > 0
		&& !(item.cursed && (item.id === 'weaponReward' || item.id === 'armorReward' || item.id.startsWith('ring_')))
	);
	if (candidates.length === 0) {
		context.say(t('port.log.nofoodtosell'));
		return;
	}
	context.openItemPicker(t('actors.mobs.npcs.shopkeeper.sell'), candidates, (pick) => {
		const item = (context.bag.items as ShopEntry[]).find((entry) => entry.id === pick.id
			&& (entry.instanceId ?? undefined) === (pick.instanceId ?? undefined) && entry.quantity > 0);
		if (!item) return;
		const sell = (units: number): void => {
			//Re-priced here rather than carried in from the button, so the gold paid is always the
			//stack's real value for the units actually leaving the bag.
			const price = getSellPrice(item.id, context.depth, units, item.identified ?? true, item);
			if (price <= 0) return;
			context.bag.remove(item.id, units, item.instanceId);
			context.heroStats.setBase('gold', context.heroStats.base('gold') + price);
			context.buyback.push({ ...item, quantity: units });
			while (context.buyback.length > 3) context.buyback.shift();
			context.say(t('port.log.solditem', { item: context.itemDisplayName(item.id, item.identified ?? true), price }), 'positive');
		};
		//`priceAll` is the whole stack's total (`item.value()`), so the per-unit label is Java's own
		//integer division of it.
		const allPrice = getSellPrice(item.id, context.depth, item.quantity, item.identified ?? true, item);
		const options = item.quantity === 1 || (isMissileStack(item) && isUpgradableItem(item))
			? [{ units: item.quantity, label: t('windows.wndtradeitem.sell', { 0: allPrice }) }]
			: [
				{ units: 1, label: t('windows.wndtradeitem.sell_1', { 0: Math.floor(allPrice / item.quantity) }) },
				{ units: item.quantity, label: t('windows.wndtradeitem.sell_all', { 0: allPrice }) },
			];
		context.showSellOptions(context.itemDisplayName(item.id, item.identified ?? true), options, sell);
	});
}

export function buybackFromShop(context: ShopActionsContext): void {
	const entry = context.buyback[context.buyback.length - 1];
	if (!entry) {
		context.say(t('port.log.nobuyback'), 'negative');
		return;
	}
	const name = context.itemDisplayName(entry.id, entry.identified ?? true);
	const price = buybackPrice(entry.id, entry.quantity, entry.identified ?? true, entry);
	if (context.heroStats.base('gold') < price) {
		context.say(t('port.log.cannotafford', { item: name, price }), 'negative');
		return;
	}
	context.heroStats.setBase('gold', context.heroStats.base('gold') - price);
	context.buyback.pop();
	context.bag.add({ ...entry, stackable: true });
	context.say(t('actors.mobs.npcs.shopkeeper.buyback'), 'positive');
}

