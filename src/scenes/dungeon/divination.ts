import { Random } from 'mwg';
import { RING_KEYS } from '../../i18n/spdKeys';
import { t } from '../../i18n/index';
import { POTION_DEFAULT_CLASSES } from '../../items/alchemyRules';
import { DIVINATION_RING_IDS, rollDivination } from '../../items/divination';
import { markPotionKindsKnown, potionKindKnown, potionKindsKnownFor } from '../../items/potionKnow';
import { markRingTypesKnown, ringTypesKnownFor } from '../../simulation/ringKnow';
import type { DungeonScene } from '../dungeonScene';

/**
 * `ScrollOfDivination.doRead()` after the scroll is spent: identify up to four unknown classes and list them (Java's
 * `WndDivination`, here one log line per find - the window is not ported). Scroll classes have no run-wide known set in this port
 * (scrolls are identified per instance), so that category is always empty here: a roll never lands on one and the four picks come
 * from potions and rings (a documented reduction, `rows-items-consumables-and-crafting.md`).
 */
export function runDivination(scene: DungeonScene): void {
	const knownPotions = potionKindsKnownFor(scene);
	const knownRings = ringTypesKnownFor(scene);
	const picks = rollDivination({
		potion: POTION_DEFAULT_CLASSES.filter((id) => !potionKindKnown(knownPotions, id)),
		scroll: [],
		ring: DIVINATION_RING_IDS.filter((id) => !knownRings.has(id)),
	}, { chances: (weights) => Random.weighted(weights) ?? -1, element: (list) => Random.element(list)! });
	if (picks.length === 0) {
		scene.say(t('items.scrolls.exotic.scrollofdivination.nothing_left'), 'warning');
		return;
	}
	markPotionKindsKnown(scene, picks.filter((p) => p.category === 'potion').map((p) => p.id));
	markRingTypesKnown(scene, picks.filter((p) => p.category === 'ring').map((p) => p.id));
	scene.say(t('items.scrolls.exotic.scrollofdivination$wnddivination.desc'), 'info');
	for (const pick of picks) scene.say(pick.category === 'ring' ? t(RING_KEYS[pick.id.slice(4).toLowerCase()] ?? pick.id) : scene.itemDisplayName(pick.id, true), 'info');
	scene.syncHeroFromStats();
}
