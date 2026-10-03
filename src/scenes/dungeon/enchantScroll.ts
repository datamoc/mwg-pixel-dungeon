import { Random } from 'mwg';
import { t } from '../../i18n/index';
import { rollEnchantOffers, type EnchantKind } from '../../items/enchantScroll';
import { empoweringScrollsCharges } from '../../talentEffects';
import { showChoiceWindow } from '../../ui/portWindows';
import type { DungeonScene } from '../dungeonScene';

/**
 * `ScrollOfEnchantment.doRead()` + `WndEnchantSelect` / `WndGlyphSelect` (`items/scrolls/exotic/ScrollOfEnchantment.java`,
 * tag `v3.3.8`): pick a weapon or armor, then one of three offered enchantments/glyphs (common, uncommon, any - none equal to
 * the item's current one). Differences, kept on purpose: only bag gear is offered (the same candidate set as this port's
 * Stone of Enchantment, so the worn pieces are not selectable here - unequip first), and cancelling at the offer window
 * simply keeps the scroll, where Java consumes it after a "are you sure" warning. The read's turn is spent when the picker opens (the caller's `read` attempt returns true), like the transmutation pick.
 */
/** Java's `Enchantment.name()` / `Glyph.name()` with an empty item word: the real catalog text ("blazing", "of obfuscation"), in every locale the catalog covers. */
function affixLabel(kind: EnchantKind, id: string): string {
	const key = kind === 'weapon' ? `items.weapon.enchantments.${id}.name` : `items.armor.glyphs.${id}.name`;
	return t(key, { '0': '' }).trim();
}

export function startEnchantmentScroll(scene: DungeonScene, scrollInstanceId: string | undefined, consume = true): boolean {
	const candidates = scene.bag.items.filter((item) => item.quantity > 0 && (item.id === 'weaponReward' || item.id === 'armorReward'));
	if (candidates.length === 0) {
		scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
		return false;
	}
	scene.openItemPicker(t('items.scrolls.exotic.scrollofenchantment.inv_title'), candidates, (pick) => {
		const live = scene.bag.items.find((item) => item.quantity > 0 && item.id === pick.id && (item.instanceId ?? undefined) === (pick.instanceId ?? undefined));
		if (!live) return;
		const kind: EnchantKind = live.id === 'weaponReward' ? 'weapon' : 'armor';
		const offers = rollEnchantOffers(kind, (live as { affix?: string }).affix, { chances: (weights) => Random.weighted(weights) ?? 0, element: (list) => Random.element(list)! });
		showChoiceWindow(
			scene.gameWindows,
			t('items.scrolls.exotic.scrollofenchantment.name'),
			t(`items.scrolls.exotic.scrollofenchantment.${kind}`),
			[
				...offers.map((id) => ({
					label: affixLabel(kind, id),
					onPick: () => {
						(live as { affix?: string }).affix = id;
						if (consume) {
							scene.bag.remove('scrollEnchantment', 1, scrollInstanceId);
							scene.onScrollUsed();
							scene.armRecallInscription('ScrollOfEnchantment');
						}
						if (scene.talentRank('empowering_scrolls') > 0) scene.empoweredZaps = empoweringScrollsCharges(scene.talentRank('empowering_scrolls'));
						scene.say(t(`items.stones.stoneofenchantment.${kind}`), 'positive');
						scene.refreshInventoryPanel?.();
					},
				})),
				{ label: t('items.scrolls.exotic.scrollofenchantment.cancel'), onPick: () => {} },
			],
		);
	});
	return true;
}
