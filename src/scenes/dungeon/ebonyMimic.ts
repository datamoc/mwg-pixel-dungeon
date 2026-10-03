import { Random, Roguelike } from 'mwg';
import type { Creature } from '../../combat';
import { randomUsingDefaultsAnyCategory, mimicGeneratePrize } from '../../items/generator';
import { getCurse } from '../../items/itemCurses';
import { groundKindForItem, isUpgradableItem } from '../../items/itemKinds';
import { ebonyMimicChance } from '../../simulation/trinkets';
import type { DungeonScene } from '../dungeonScene';
import { trinketLevelOf } from './trinkets';

/**
 * `EbonyMimic` and the Mimic Tooth's prize (`actors/mobs/EbonyMimic.java`, `Mimic.generatePrize()`, `RegularLevel.createItems()`, tag `v3.3.8`).
 *
 * An Ebony Mimic is a base Mimic that stays an almost invisible "suspicious outline" (always stealthy), hits for double on its surprise blow, and
 * carries a prize generated without decks: the ordinary mimic reward, the Mimic Tooth's extra random item and its own extra random item, every
 * equipable or wand among them uncursed, identified-as-uncursed and at least +1. Here it is the base `mimic` kind with `ebonyMimic` set (sprite
 * frames 48+, the `ebonymimic` texts), so every chest-mimic rule - reveal, counterattack, the hidden-contact decision - applies unchanged.
 *
 * Placement follows `RegularLevel.createItems()`: with the tooth's chance, half the time on a random plain heap outside a special room with no mob on
 * it; otherwise (and when none qualified) one time in five on the exit, else on a door cell. Stated difference: the level stream's isolated generator
 * is not reproduced (these draws use the live RNG), and a floor with neither a heap nor a door simply gets none.
 */
export function maybeSpawnEbonyMimic(scene: DungeonScene): void {
	const toothLevel = trinketLevelOf(scene, 'trinketMimicTooth');
	if (toothLevel < 0 || !(Random.float() < ebonyMimicChance(toothLevel))) return;
	const free = (x: number, y: number): boolean => !scene.creatureAt(x, y) && !(x === scene.hero.x && y === scene.hero.y);
	let candidates: Array<{ x: number; y: number }> = [];
	if (Random.int(0, 2) === 0) {
		candidates = scene.groundItems
			.filter((g) => g.chest === undefined && free(g.x, g.y) && !inSpecialRoom(scene, g.x, g.y))
			.map((g) => ({ x: g.x, y: g.y }));
	}
	if (candidates.length === 0) {
		if (Random.int(0, 5) === 0 && scene.hasStairs && free(scene.stairs.x, scene.stairs.y)) candidates = [{ ...scene.stairs }];
		else {
			for (let y = 0; y < scene.level.height; y++) for (let x = 0; x < scene.level.width; x++) {
				if (scene.doors.isDoor(x, y) && free(x, y)) candidates.push({ x, y });
			}
		}
	}
	if (candidates.length === 0) return;
	const at = Random.element(candidates)!;
	const mimic = scene.spawnMonster('mimic', at);
	mimic.ebonyMimic = true;
	mimic.ebonyPrizes = JSON.stringify(rollPrizes(scene));
	scene.syncMimicVisual(mimic);
}

function inSpecialRoom(scene: DungeonScene, x: number, y: number): boolean {
	return scene.level.rooms.some((room) => x >= room.left && x <= room.right && y >= room.top && y <= room.bottom
		&& ((room as { label?: string }).label ?? '').startsWith('special'));
}

/** `EbonyMimic.generatePrize(false)`: the base reward, the tooth's extra item, the ebony extra, then the uncurse / +1 pass. */
function rollPrizes(scene: DungeonScene): unknown[] {
	const items = [mimicGeneratePrize(), randomUsingDefaultsAnyCategory(), randomUsingDefaultsAnyCategory()].map((generated) => scene.generatedInventoryItem(generated));
	for (const item of items) {
		//`i instanceof EquipableItem || i instanceof Wand`: weapons (missiles included), armor, rings, wands
		if (!(item.id === 'weaponReward' || item.id === 'armorReward' || item.id === 'wand' || item.id.startsWith('ring_') || item.id.startsWith('missile_')) || !isUpgradableItem(item)) continue;
		item.cursed = false;
		item.cursedKnown = true;
		if (item.affix && getCurse(item.affix)) delete item.affix;
		if (!item.id.startsWith('artifact') && (item.level ?? 0) === 0) item.level = 1;
	}
	return items;
}

/** `Mimic.rollToDropLoot()`'s `items` and `generatePrize()`'s tooth extra, dropped around a dying mimic. */
export function dropMimicExtras(scene: DungeonScene, mimic: Creature): void {
	const drops: Array<NonNullable<ReturnType<DungeonScene['generatedInventoryItem']>>> = [];
	if (mimic.ebonyPrizes) {
		try { drops.push(...(JSON.parse(mimic.ebonyPrizes) as typeof drops)); } catch { /* a malformed payload has no prize */ }
	} else if (mimic.mimicToothExtra) {
		//the tooth's `items.add(Generator.randomUsingDefaults())` on an ordinary mimic
		drops.push(scene.generatedInventoryItem(randomUsingDefaultsAnyCategory()));
	}
	for (const item of drops) {
		const cell = [{ x: mimic.x, y: mimic.y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: mimic.x + dx, y: mimic.y + dy }))]
			.find((c) => scene.level.passable(c.x, c.y) && !scene.groundItemAt(c.x, c.y));
		if (!cell) continue;
		scene.spawnGroundItem(groundKindForItem(item, 'food'), cell.x, cell.y, item);
	}
}
