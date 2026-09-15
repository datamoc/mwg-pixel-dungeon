import { Actors } from 'mwg';
import { t } from '../i18n/index';
import { buybackPrice, getSellPrice, getShopPrice } from './shopPricing';

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
		const price = getSellPrice(item.id, context.depth, 1, item.identified ?? true, item);
		if (price <= 0) return;
		context.bag.remove(item.id, 1, item.instanceId);
		context.heroStats.setBase('gold', context.heroStats.base('gold') + price);
		context.buyback.push({ ...item, quantity: 1 });
		while (context.buyback.length > 3) context.buyback.shift();
		context.say(t('port.log.solditem', { item: context.itemDisplayName(item.id, item.identified ?? true), price }), 'positive');
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

