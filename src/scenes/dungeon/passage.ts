import { t } from '../../i18n/index';
import type { DungeonScene } from '../dungeonScene';

/**
 * `ScrollOfPassage.doRead()` (`items/scrolls/exotic/ScrollOfPassage.java`, tag `v3.3.8`), after the scroll is spent: unless
 * `Dungeon.interfloorTeleportAllowed()` refuses (a live boss seal, the carried Amulet; this port's mining branch refuses too, as it does for
 * Fadeleaf) the hero returns to the first floor of the current five-floor region, `max(1, depth - 1 - (depth - 2) % 5)`, arriving at that
 * floor's entrance (`returnPos = -1`). The refusal logs the teleportation scroll's `no_tele` line, and the scroll is spent either way.
 */
export function readPassage(scene: DungeonScene): void {
	if (scene.floorLocked() || scene.miningBranchActive || scene.bag.find('amulet')) {
		scene.say(t('items.scrolls.scrollofteleportation.no_tele'), 'warning');
		return;
	}
	const target = Math.max(1, scene.depth - 1 - ((scene.depth - 2) % 5));
	scene.disarmTimeBubblePresses(); //`Level.beforeTransition()`
	scene.depth = target;
	scene.beaconArrival = null; //`enterLevel` places the hero at the entrance when no arrival cell is set
	scene.enterLevel();
}
