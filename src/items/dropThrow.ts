/**
 * The generic item verbs every Java `Item` carries - `AC_DROP` (`Item.doDrop`) and `AC_THROW`
 * (`Item.doThrow`/`cast`/`onThrow`, tag `v3.3.8`) - and the potion throw rules layered on top
 * (`Potion.mustThrowPots`/`canThrowPots`, `Potion.doThrow`'s "beneficial" confirmation).
 * Scene-free: which bag entries can take part, and how a throw lands. The scene owns the bag, the
 * heap it drops onto, the aim and the turn clock (`scenes/dungeon/hero/dropThrowScene.ts`).
 */
import { SPECIALTY_BOMB_IDS } from './itemKinds';
import { AREA_SHATTER_POTION_IDS } from './potionEffects';
import { THROWABLE_BREW_IDS } from '../simulation/brews';
import { isClassArmorId } from './catalog';

/** `Potion.mustThrowPots` (the four base malevolent potions plus Shrouding Fog, which this port carries): a known one throws by default. */
export const MUST_THROW_POTIONS: ReadonlySet<string> = new Set(['potionToxicGas', 'potionFlame', 'potionParalyticGas', 'potionFrost', 'potionShrouding']);

/** `Potion.canThrowPots`: beneficial potions Java lets you throw without the "are you sure" prompt. */
export const CAN_THROW_POTIONS: ReadonlySet<string> = new Set(['potionPurity', 'potionLevitation']);

const KEY_IDS = new Set(['ironKey', 'goldenKey', 'crystalKey']);

/**
 * Bag entries that stay out of Drop/Throw: keys (`Key` removes `AC_DROP`), and every id the port models
 * as a compact stand-in rather than a payload item - equipment stash entries, class armors, wands, rings,
 * the missile pile, the tome, the pickaxe - because their ground heaps are picked up through per-kind
 * stand-ins (`pickupArmor`, `pickupWand`, ...) that would not give the same item back.
 */
export function canDropBagItem(id: string): boolean {
	if (KEY_IDS.has(id) || id === 'gold' || id === 'energyCrystal' || id === 'sandBag') return false;
	if (id === 'armor' || id === 'armorReward' || id === 'weaponReward' || id === 'wand' || id === 'stone' || id === 'amulet') return false;
	if (isClassArmorId(id) || id.startsWith('ring_') || id.startsWith('missile_')) return false;
	if (id === 'holyTome' || id === 'pickaxe' || id === 'waterskin') return false;
	return true;
}

/**
 * Items with their own throw flow (bombs, honeypots, brews, the ceremonial candle) or whose throw is an
 * activation (runestones) keep it; the generic Throw is for everything else, the flasks first.
 */
export function canThrowBagItem(id: string): boolean {
	if (!canDropBagItem(id)) return false;
	if (id === 'bomb' || id === 'doubleBomb' || SPECIALTY_BOMB_IDS.has(id) || id === 'honeypot' || id === 'candle') return false;
	if (THROWABLE_BREW_IDS.has(id) || id.startsWith('stoneOf')) return false;
	return true;
}

/** `Potion.doThrow`: a known potion that is neither must-throw nor can-throw asks before it is wasted. */
export function throwNeedsConfirm(id: string, known: boolean): boolean {
	return id.startsWith('potion') && known && !MUST_THROW_POTIONS.has(id) && !CAN_THROW_POTIONS.has(id);
}

/** `Potion.defaultAction()`: a known malevolent potion throws by default rather than being drunk. */
export function potionThrowsByDefault(id: string, known: boolean): boolean {
	return known && MUST_THROW_POTIONS.has(id);
}

/** Whether a flask's `shatter` is an area effect here (else it splashes harmlessly). */
export function shatterHasEffect(id: string): boolean {
	return AREA_SHATTER_POTION_IDS.has(id);
}

/**
 * Where a thrown item lands (`Item.throwPos`: `Ballistica(hero, dst, PROJECTILE).collisionPos`): walk the aim
 * line from the hero and stop at the first creature (it is hit at its own cell) or, before a blocking cell,
 * on the last open one.
 */
export function throwLanding(
	path: readonly { x: number; y: number }[],
	blocked: (x: number, y: number) => boolean,
	occupied: (x: number, y: number) => boolean,
): { x: number; y: number } {
	let last = path[0]!;
	for (let i = 1; i < path.length; i++) {
		const cell = path[i]!;
		if (blocked(cell.x, cell.y)) return last;
		if (occupied(cell.x, cell.y)) return cell;
		last = cell;
	}
	return last;
}
