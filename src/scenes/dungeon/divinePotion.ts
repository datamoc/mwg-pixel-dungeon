import { t } from '../../i18n/index';
import { DIVINE_BONUS_POINTS, divineStateFor, divineWindowOpen } from '../../items/divineInspiration';
import { markPotionKindsKnown } from '../../items/potionKnow';
import { TALENT_TIERS } from '../../talents';
import { showChoiceWindow } from '../../ui/portWindows';
import type { DungeonScene } from '../dungeonScene';

/** Credits every boosted tier whose window is open and has not been paid yet (see `items/divineInspiration.ts`). */
export function tickDivineInspiration(scene: DungeonScene): void {
	const state = divineStateFor(scene);
	if (state.boosted.length === state.granted.length) return;
	for (const tier of state.boosted) {
		if (state.granted.includes(tier)) continue;
		if (!divineWindowOpen(tier, scene.progression.level, TALENT_TIERS, scene.subclass() !== null, scene.hasArmorTalentTree())) continue;
		state.granted.push(tier);
		scene.talentPoints[tier - 1] = (scene.talentPoints[tier - 1] ?? 0) + DIVINE_BONUS_POINTS;
		scene.say(t('items.potions.exotic.potionofdivineinspiration.bonus'), 'positive');
	}
}

/**
 * `PotionOfDivineInspiration.drink()`: choose a talent tier that is not yet boosted (all four boosted refuses with `no_more_points`),
 * which gains two bonus points once that tier is unlocked. The potion is spent when a tier is chosen and the turn with it; cancelling
 * keeps the potion (Java's window has no cancel either, but an unidentified potion is already consumed there).
 */
export function startDivineInspiration(scene: DungeonScene, potionInstanceId: string | undefined): boolean {
	const state = divineStateFor(scene);
	if (state.boosted.length >= 4) {
		scene.say(t('items.potions.exotic.potionofdivineinspiration.no_more_points'), 'warning');
		return false;
	}
	showChoiceWindow(scene.gameWindows, t('items.potions.exotic.potionofdivineinspiration.name'), t('items.potions.exotic.potionofdivineinspiration.select_tier'),
		[1, 2, 3, 4].map((tier) => ({
			label: t('ui.talentspane.tier', { '0': tier }),
			disabled: state.boosted.includes(tier),
			onPick: () => {
				state.boosted.push(tier);
				scene.bag.remove('potionDivineInspiration', 1, potionInstanceId);
				markPotionKindsKnown(scene, ['potionDivineInspiration']);
				tickDivineInspiration(scene);
				scene.refreshInventoryPanel?.();
				scene.actionSpentTurn = true;
				scene.spendHeroTurn(1);
			},
		})));
	return false;
}
