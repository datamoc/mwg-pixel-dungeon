import { Random } from 'mwg';
import type { GroundItem } from '../combat';
import { missileStackFields } from './missiles';

type ItemPayload = NonNullable<GroundItem['item']>;
type GroundKind = GroundItem['kind'];

export interface GroundPickupContext {
	item: GroundItem;
	depth: number;
	heroClass: string;
	gold: number;
	hasItem(id: string): boolean;
	removeItem(id: string, quantity: number): void;
	setGold(amount: number): void;
	shopPrice(item: ItemPayload): number;
	itemName(id: string, identified: boolean, instanceId?: string): string;
	/** `WndTradeItem`'s Buy button. Java never charges for a FOR_SALE heap on the spot: stepping
	 *  onto one (or picking it up) shows the window, whose single `buy` button is disabled while
	 *  the price exceeds the hero's gold, and only pressing it pays. The scene opens that window
	 *  and calls `buy` from the button's own callback, then re-runs the pickup - which now finds a
	 *  paid-for heap and takes it. A cancel simply never calls `buy`, so nothing is spent. */
	offerPurchase(name: string, price: number, buy: () => void): void;
	missilePickupValid(setId: string, level: number): boolean;
	removeGround(): void;
	playSound(kind: GroundKind): void;
	addItem(item: ItemPayload, stackable?: boolean): void;
	identify(item: ItemPayload): void;
	say(message: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	showStatus(message: string): void;
	/** Return false when Java's `Dewdrop.consumeDew(..., force=false)` refuses the pickup. */
	collectDewdrop(force: boolean): boolean;
	/** `DriedRose.Petal.doPickUp()`: with no rose the pickup is *refused* and the petal stays on
	 *  the floor; at the rose's level cap it is consumed and wasted; otherwise it levels the rose. */
	collectPetal(): 'no_rose' | 'no_room' | 'levelup' | 'maxlevel';
	/** Java forces a one-drop heal on entrance, exit, and unlocked-exit terrain. */
	forceDewdropPickup?(item: GroundItem): boolean;
	addSand(item: ItemPayload): void;
	addEnergy(amount: number): void;
	addLooseGold(amount: number): void;
	recoverStone(item: GroundItem): void;
	pickupArmor(): void;
	pickupWand(): void;
	pickupAmulet(): void;
	pickupRing(): void;
	pickupCrystalKey(): void;
	addSimpleGroundKind(kind: GroundKind): void;
	messages: {
		crystalChestLocked: string;
		unlockCrystalChest: string;
		lockedChestNeedsGoldenKey: string;
		unlockChest: string;
		cannotAfford: (item: string, price: number) => string;
		buy: (item: string, price: number) => string;
		missileDust: string;
		noHourglassSand: string;
		snuffFuse: string;
		freeDoubleBomb: string;
		pickup: (item: string) => string;
		pickupGold: (amount: number) => string;
		recoverStone: string;
		pickUpRing: (item: string) => string;
	};
}

/**
 * `GameScene.pickUp` plus the compact port's ground-kind conversions. Item rules stay under
 * `items/`; the scene supplies only persistence, rendering, and hero-specific effects.
 */
export function pickupGroundItem(context: GroundPickupContext): void {
	const { item } = context;
	if (item.chest === 'crystal') {
		if (!context.hasItem('crystalKey')) {
			context.say(context.messages.crystalChestLocked, 'negative');
			return;
		}
		context.removeItem('crystalKey', 1);
		context.say(context.messages.unlockCrystalChest, 'positive');
	}
	if (item.chest === 'locked') {
		if (!context.hasItem('goldenKey')) {
			context.say(context.messages.lockedChestNeedsGoldenKey, 'negative');
			return;
		}
		context.removeItem('goldenKey', 1);
		context.say(context.messages.unlockChest, 'positive');
	}
	item.chest = undefined;
	if (item.forSale && item.item) {
		const price = context.shopPrice(item.item);
		if (price > 0) {
			const name = context.itemName(item.item.id, item.item.identified ?? false, item.item.instanceId);
			if (context.gold < price) {
				//Java *disables* the Buy button in this case; the line is this port's equivalent
				//notice, which it already had.
				context.say(context.messages.cannotAfford(name, price), 'negative');
				return;
			}
			//The purchase itself stays here, so the window only decides *whether* it happens.
			//The pickup stops at this point and resumes from the scene's confirmed path.
			context.offerPurchase(name, price, () => {
				context.setGold(context.gold - price);
				item.forSale = false;
				context.say(context.messages.buy(name, price), 'positive');
			});
			return;
		}
	}
	if (item.kind === 'stone' && item.missileSet !== undefined
		&& !context.missilePickupValid(item.missileSet, item.missileLevel ?? 0)) {
		context.playSound('stone');
		context.say(context.messages.missileDust, 'negative');
		context.removeGround();
		return;
	}

	if (item.kind === 'petal') {
		// `DriedRose.Petal.doPickUp()` refuses the pickup entirely with no rose (`no_rose`), which is
		// why this branch sits above the generic `removeGround()` - the petal has to stay on the floor.
		if (context.collectPetal() === 'no_rose') return;
		// Java plays the DEWDROP sample for a petal, so that is the cue here too.
		context.playSound('dewdrop');
		context.removeGround();
		return;
	}

	if (item.kind === 'dewdrop') {
		// `Dewdrop.doPickUp()` only removes the heap after `consumeDew` accepts it. Keeping
		// this check before `removeGround()` matters when a full, fully-healed Waterskin is
		// standing away from an entrance/exit: Java leaves the dewdrop on the floor.
		if (!context.collectDewdrop(context.forceDewdropPickup?.(item) ?? false)) return;
		context.playSound(item.kind);
		context.removeGround();
		return;
	}
	context.playSound(item.kind);
	context.removeGround();
	if (item.item?.id === 'sandBag') return context.addSand(item.item);
	if (item.item) return pickupPayload(context, item.item);
	if (item.kind === 'gold') return context.addLooseGold(Random.range(30 + context.depth * 10, 60 + context.depth * 20));
	if (item.kind === 'stone' && ['warrior', 'rogue', 'duelist'].includes(context.heroClass)) return context.recoverStone(item);
	if (item.kind === 'armor') return context.pickupArmor();
	if (item.kind === 'wand') return context.pickupWand();
	if (item.kind === 'amulet') return context.pickupAmulet();
	if (item.kind === 'ring') return context.pickupRing();
	if (item.kind === 'crystalKey') return context.pickupCrystalKey();
	const id = item.kind === 'potion' ? 'potion'
		: item.kind === 'scroll' ? Random.chance(0.25) ? 'scrollUpgrade' : 'scrollIdentify' : item.kind;
	//A scattered missile heap carries the set and level it was thrown at, and those have to
	//survive the pickup or the identity this heap belongs to is lost (see `src/missiles.ts`).
	//Java's heap *is* the stack; this port's heaps carry no class, so a heap picked up here
	//joins its own set at its own level and keeps the pile's class when it is next wielded.
	//A tipped heap additionally carries its seed, which makes the picked-up stack a real
	//`TippedDart` rather than an unknown-tipped pile.
	if (id === 'stone' && item.missileSet !== undefined) {
		context.addItem({ id, quantity: 1, identified: false,
			...(item.tippedSeed !== undefined ? { sourceClass: 'TippedDart', tippedSeed: item.tippedSeed } : {}),
			...missileStackFields(item.missileSet, item.missileLevel ?? 0, item.tippedSeed) }, true);
		context.say(context.messages.pickup(context.itemName(id, false)), 'positive');
		return;
	}
	context.addItem({ id, quantity: 1, identified: false }, true);
	context.say(context.messages.pickup(context.itemName(id, false)), 'positive');
}

function pickupPayload(context: GroundPickupContext, item: ItemPayload): void {
	if (item.id === 'noisemaker' && item.noisemakerArmed) return;
	if (item.fuseTurns !== undefined) {
		const { fuseTurns: _snuffed, ...unlit } = item;
		context.addItem(unlit, true);
		context.say(context.messages.snuffFuse, 'positive');
		return;
	}
	if (item.id === 'doubleBomb') {
		context.addItem({ id: 'bomb', quantity: 2, identified: true, sourceClass: 'Bomb' }, true);
		context.showStatus(context.messages.freeDoubleBomb);
		context.say(context.messages.pickup(context.itemName('bomb', true)), 'positive');
		return;
	}
	const payload = { ...item, stackable: true };
	if (payload.id === 'gold') {
		context.addLooseGold(payload.quantity);
		return;
	}
	if (payload.id === 'energyCrystal') {
		context.addEnergy(payload.quantity);
		return;
	}
	if (['ironKey', 'goldenKey', 'crystalKey'].includes(payload.id)) context.identify(payload);
	context.addItem(payload);
	context.say(context.messages.pickup(context.itemName(payload.id, payload.identified ?? false, payload.instanceId)), 'positive');
}
