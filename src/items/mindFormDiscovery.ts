/**
 * `Trinity.WndItemtypeSelect`'s MindForm catalog gate (`Trinity.java`, tag `v3.3.8`):
 * Java offers only wand/missile classes in `Statistics.itemTypesDiscovered`. This
 * run-scoped mirror stores concrete port ids so a discovered item remains selectable
 * after its original inventory stack is consumed or sold.
 */
import { MWL_MISSILE_BY_CLASS } from '../mwlContent';
import { TIPPED_DART_BY_SEED } from './missiles';
import { wandTypeFromSource } from './wands';
import type { MindFormEffect } from '../simulation/mindFormCast';

export interface DiscoverableMindItem {
	id: string;
	identified?: boolean;
	quantity?: number;
	sourceClass?: string;
	tippedSeed?: string;
}

const discoveredByScene = new WeakMap<object, Set<string>>();

export function mindFormDiscoveryKey(effect: MindFormEffect): string {
	return effect.kind === 'wand' ? `wand:${effect.wandType}`
		: `thrown:${effect.missileClass}${effect.tippedSeed ? `:${effect.tippedSeed.toLowerCase()}` : ''}`;
}

export function mindFormDiscoveriesFor(scene: object): Set<string> {
	let known = discoveredByScene.get(scene);
	if (!known) {
		known = new Set();
		discoveredByScene.set(scene, known);
	}
	return known;
}

/** `Item.collect()` (`Item.java`, tag `v3.3.8`) records a type only for an already-identified
 * item; `Item.identify()` records it after the item becomes identified. Keep both sites on that gate. */
export function markMindFormItemDiscovered(scene: object, item: DiscoverableMindItem): void {
	if (item.identified !== true || item.quantity === 0) return;
	const known = mindFormDiscoveriesFor(scene);
	if (item.id === 'wand') {
		const type = wandTypeFromSource(item.sourceClass);
		if (type) known.add(`wand:${type}`);
		return;
	}
	if (!item.id.startsWith('missile_') || !item.sourceClass || !MWL_MISSILE_BY_CLASS.has(item.sourceClass)) return;
	if (item.sourceClass === 'TippedDart') {
		const seed = (item.tippedSeed ?? '').toLowerCase();
		if (TIPPED_DART_BY_SEED[seed]) known.add(`thrown:TippedDart:${seed}`);
	} else {
		known.add(`thrown:${item.sourceClass}`);
	}
}

export function markMindFormItemsDiscovered(scene: object, items: readonly DiscoverableMindItem[]): void {
	for (const item of items) markMindFormItemDiscovered(scene, item);
}

export function restoreMindFormDiscoveries(scene: object, ids: readonly string[]): void {
	const known = mindFormDiscoveriesFor(scene);
	known.clear();
	for (const id of ids) known.add(id);
}
