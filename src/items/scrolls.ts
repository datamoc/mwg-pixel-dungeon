import type { Actors } from 'mwg';
import { t } from '../i18n';

export interface ScrollSelectionContext {
	readonly bag: Actors.Inventory;
	readonly requestedItemId: string | null;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
}

/** Selects the default scroll action in the same priority order as the inventory shortcut. */
export function selectScrollId(scene: ScrollSelectionContext): string | null {
	const ids = scene.bag.items.filter((i) => i.id.startsWith('scroll') && i.quantity > 0).map((i) => i.id);
	if (ids.length === 0) {
		scene.say(t('port.log.noscroll'), 'negative');
		return null;
	}
	let id = scene.requestedItemId && ids.includes(scene.requestedItemId) ? scene.requestedItemId : ids[0];
	const unidentified = scene.bag.items.find((i) => !i.identified && i.quantity > 0);
	if (!scene.requestedItemId && unidentified && ids.includes('scrollIdentify')) id = 'scrollIdentify';
	else if (!scene.requestedItemId && ids.includes('scrollRage')) id = 'scrollRage';
	else if (!scene.requestedItemId && ids.includes('scrollLullaby')) id = 'scrollLullaby';
	else if (!scene.requestedItemId && ids.includes('scrollMapping')) id = 'scrollMapping';
	else if (!scene.requestedItemId && ids.includes('scrollMirror')) id = 'scrollMirror';
	else if (!scene.requestedItemId && ids.includes('scrollRecharging')) id = 'scrollRecharging';
	else if (!scene.requestedItemId && ids.includes('scrollCleanse')) id = 'scrollCleanse';
	return id;
}
