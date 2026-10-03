import { t } from '../i18n/index';
import type { Actors } from 'mwg';

/**
 * `Blandfruit`'s `potionAttrib` system (`items/food/Blandfruit.java`, tag `v3.3.8`):
 * a cooked fruit carries the potion its seed mapped to, swapping its name and
 * description, feeding like a meal while applying the potion, and shattering like
 * the potion when thrown in one of the volatile forms (leaving `Chunks` behind).
 *
 * The carried potion rides a `potionAttrib` payload field on the `blandfruit` bag
 * entry (like `sourceClass` on seeds, with its own `bagSources` side channel since
 * the framework inventory serializes only declared fields); one fruit per potion
 * class gets its own `blandfruit:<potion>` instance id so different brews never
 * stack, matching `isSimilar()`'s same-attrib rule. A plain fruit has no payload.
 */

export interface FruitPayload {
	id: string;
	instanceId?: string;
	quantity?: number;
	potionAttrib?: string;
}

type FruitInventory = Pick<Actors.Inventory, 'items' | 'remove'>;

/** An omitted instance selects the plain, id-less stack rather than another brew. */
export function findFruitStack(inventory: FruitInventory, instanceId?: string): Actors.Inventory['items'][number] | undefined {
	return inventory.items.find((item) => item.id === 'blandfruit' && item.instanceId === instanceId);
}

/** Java detaches from the selected Item object, including an id-less plain fruit.
 * MWG remove(id, quantity, undefined) selects any instance, so give only that object
 * a temporary selector during the synchronous removal and restore its identity.
 * Surviving plain fruit must remain id-less to merge with future plain pickups. */
export function removeFruitUnits(inventory: FruitInventory, item: Actors.Inventory['items'][number], quantity: number): boolean {
	if (item.id !== 'blandfruit' || !inventory.items.includes(item) || !Number.isInteger(quantity) || quantity <= 0 || quantity > item.quantity) return false;
	if (item.instanceId !== undefined) {
		inventory.remove(item.id, quantity, item.instanceId);
		return true;
	}
	let selector = 'blandfruit:plain-selection';
	while (inventory.items.some((entry) => entry.instanceId === selector)) selector += ':';
	item.instanceId = selector;
	try {
		inventory.remove(item.id, quantity, selector);
	} finally {
		delete item.instanceId;
	}
	return true;
}

/** A plain, cookable fruit: `blandfruit` with no `potionAttrib` (Java's `potionAttrib == null`). */
export function isPlainFruit(item: FruitPayload): boolean {
	return item.id === 'blandfruit' && item.potionAttrib === undefined;
}

/** A cooked, seed-imbued fruit. */
export function isCookedFruit(item: FruitPayload): boolean {
	return item.id === 'blandfruit' && item.potionAttrib !== undefined;
}

/** `Blandfruit.name()`'s twelve `instanceof` branches, keyed by this port's potion id. */
export const FRUIT_NAME_KEYS: Readonly<Record<string, string>> = {
	potionHealing: 'items.food.blandfruit.sunfruit',
	potionStrength: 'items.food.blandfruit.rotfruit',
	potionParalyticGas: 'items.food.blandfruit.earthfruit',
	potionInvis: 'items.food.blandfruit.blindfruit',
	potionFlame: 'items.food.blandfruit.firefruit',
	potionFrost: 'items.food.blandfruit.icefruit',
	potionMindVision: 'items.food.blandfruit.fadefruit',
	potionToxicGas: 'items.food.blandfruit.sorrowfruit',
	potionLevitation: 'items.food.blandfruit.stormfruit',
	potionPurity: 'items.food.blandfruit.dreamfruit',
	potionExperience: 'items.food.blandfruit.starfruit',
	potionHaste: 'items.food.blandfruit.swiftfruit',
};

/** `Blandfruit.imbuePotion()` (`items/food/Blandfruit.java`, tag `v3.3.8`):
 * the potion class chooses the color passed to `ItemSprite.Glowing`. */
export const FRUIT_GLOW_COLORS: Readonly<Record<string, number>> = {
	potionHealing: 0x2ee62e,
	potionStrength: 0xcc0022,
	potionParalyticGas: 0x67583d,
	potionInvis: 0xd9d9d9,
	potionFlame: 0xff7f00,
	potionFrost: 0x66b3ff,
	potionMindVision: 0x919999,
	potionToxicGas: 0xa15ce5,
	potionLevitation: 0x1b5f79,
	potionPurity: 0xc152aa,
	potionExperience: 0x404040,
	potionHaste: 0xccbb00,
};

export function fruitGlowColor(potionId?: string): number | undefined {
	return potionId === undefined ? undefined : FRUIT_GLOW_COLORS[potionId];
}

/** `Blandfruit.desc()`'s volatile half: these four read `desc_throw`, the rest `desc_eat`. */
export const THROW_DESC_POTION_IDS: ReadonlySet<string> = new Set([
	'potionFrost', 'potionFlame', 'potionToxicGas', 'potionParalyticGas',
]);

/** `Potion.defaultAction()`'s AC_THROW subset (`MUST_THROW_POTIONS`, tag `v3.3.8`).
 * Levitation and Purity are volatile on impact but default to AC_CHOOSE, not AC_THROW. */
export const DEFAULT_THROW_FRUIT_POTION_IDS = THROW_DESC_POTION_IDS;

/** `Potion.canThrowPots` (`potionLevitation`, `potionPurity`; tag `v3.3.8`):
 * `Blandfruit.defaultAction()` returns AC_CHOOSE for these anonymized brews. */
export const CAN_CHOOSE_THROW_FRUIT_POTION_IDS: ReadonlySet<string> = new Set(['potionLevitation', 'potionPurity']);

/** `Blandfruit.onThrow()`'s shatter half: these six break into their potion's shatter
 * (plus a `Chunks` drop); every other cooked fruit drops plainly like an uncooked one. */
export const VOLATILE_FRUIT_POTION_IDS: ReadonlySet<string> = new Set([
	'potionFlame', 'potionToxicGas', 'potionParalyticGas', 'potionFrost', 'potionLevitation', 'potionPurity',
]);

/** `Blandfruit.imbuePotion()`'s instance id: one stack per potion class. */
export function cookedFruitInstanceId(potionId: string): string {
	return `blandfruit:${potionId}`;
}

/** `Blandfruit.desc()` for a cooked brew: `desc_cooked`, then `desc_throw` for a
 * volatile potion and `desc_eat` for the rest. */
export function fruitDescBody(potionId: string): string {
	const desc = t('items.food.blandfruit.desc_cooked');
	return THROW_DESC_POTION_IDS.has(potionId)
		? `${desc}\n\n${t('items.food.blandfruit.desc_throw')}`
		: `${desc}\n\n${t('items.food.blandfruit.desc_eat')}`;
}
