import { capitalize, t } from '../i18n/index';
import { SPECIALTY_BOMB_IDS } from '../items/itemKinds';
import { generatorItemOrder } from '../items/generator';
import { InventoryWindow, type InventoryEntry } from './inventoryWindow';
import { MWL_CONSUMABLE_DESCRIPTION_KEYS, MWL_EQUIPMENT_DESCRIPTION_KEYS, MWL_ITEM_ACTION_RULES, MWL_ITEM_FRAMES, MWL_ITEM_SPECIFIC_FRAMES, MWL_MISSILE_DESCRIPTION_KEYS } from '../mwlContent';
import { getArtifact, getAllArtifactIds } from '../items/artifacts';

/** Real artifact ids, derived from the same `artifacts.mwl` roster `generatedInventoryItem`'s
 * generation switch routes to (see `getAllArtifactIds`), plus `holyTome` - a Cleric equip-slot
 * item, not one of the 13 real SPD artifacts, but occupying the same dedicated slot below.
 * Previously this only recognized `cloak`/`hourglass`/`holyTome` by hand: a carried Chalice of
 * Blood, Cape of Thorns, or Alchemist's Toolkit rendered correctly in the carried list but never
 * took the dedicated artifact equip-slot icon in the bag UI (confirmed by live browser testing) -
 * fixed here by deriving the set from the one place new artifact ids are already wired, instead
 * of hand-maintaining a third duplicate list that silently falls out of sync with it. */
const ARTIFACT_SLOT_IDS = new Set([...getAllArtifactIds(), 'holyTome']);

interface InventoryItem {
	id: string; quantity?: number; instanceId?: string; level?: number; identified?: boolean;
	cursed?: boolean; sourceClass?: string;
}

export interface InventoryPanelContext {
	readonly panel: InventoryWindow | null;
	readonly open: boolean;
	readonly items: readonly InventoryItem[];
	readonly armorId: string;
	readonly armorInstanceId?: string;
	readonly armorLevel: number;
	readonly weaponInstanceId?: string;
	readonly weaponName: string;
	readonly weaponFrame: number;
	readonly equippedRing: InventoryItem | null;
	readonly gold: number;
	readonly itemDisplayName: (id: string, identified: boolean, instanceId?: string) => string;
	readonly itemDescription?: (id: string, identified: boolean) => string | undefined;
	readonly addToStage: (panel: InventoryWindow) => void;
	readonly positionInterface: () => void;
}

/** UI-only projection from live inventory state into the SPD-style inventory window. */
export function refreshInventoryPanel(context: InventoryPanelContext): void {
	const panel = context.panel;
	if (!panel) return;
	panel.visible = context.open;
	if (!context.open) return;
	const entry = (item: InventoryItem): InventoryEntry => {
		const id = item.id;
		let frame = MWL_ITEM_SPECIFIC_FRAMES[id] ?? 0;
		if (SPECIALTY_BOMB_IDS.has(id)) frame = MWL_ITEM_FRAMES.bomb ?? frame;
		if (id.startsWith('stoneOf')) frame = MWL_ITEM_FRAMES.stone ?? frame;
		let action: string | undefined;
		const authoredAction = MWL_ITEM_ACTION_RULES[id]
			?? (id.startsWith('potion') ? MWL_ITEM_ACTION_RULES.potion : undefined)
			?? (id.startsWith('scroll') ? MWL_ITEM_ACTION_RULES.scroll : undefined)
			?? (SPECIALTY_BOMB_IDS.has(id) ? MWL_ITEM_ACTION_RULES.bomb : undefined)
			?? (id.startsWith('stoneOf') ? MWL_ITEM_ACTION_RULES.stone : undefined)
			?? (id.startsWith('ring_') ? MWL_ITEM_ACTION_RULES.ring : undefined);
		if (id.startsWith('potion')) frame = MWL_ITEM_FRAMES.potion ?? frame;
		else if (id.startsWith('scroll')) frame = MWL_ITEM_FRAMES.scroll ?? frame;
		else if (id.startsWith('ring_')) frame = MWL_ITEM_FRAMES.ring ?? frame;
		if (authoredAction) {
			const translated = t(authoredAction.actionKey);
			action = authoredAction.capitalize ? capitalize(translated) : translated;
		}
		const description = context.itemDescription?.(id, item.identified ?? false)
			?? (MWL_CONSUMABLE_DESCRIPTION_KEYS[id] ? t(MWL_CONSUMABLE_DESCRIPTION_KEYS[id]!) : undefined)
			?? (MWL_MISSILE_DESCRIPTION_KEYS[id] ? t(MWL_MISSILE_DESCRIPTION_KEYS[id]!) : undefined)
			?? (MWL_EQUIPMENT_DESCRIPTION_KEYS[id] ? t(MWL_EQUIPMENT_DESCRIPTION_KEYS[id]!) : undefined)
			?? (getArtifact(id) ? t(getArtifact(id)!.descriptionKey) : undefined);
		return { ...item, quantity: item.quantity ?? 1, name: context.itemDisplayName(id, item.identified ?? false, item.instanceId), frame, action, description };
	};
	const rows = context.items.filter(item => (item.quantity ?? 0) > 0).map(entry)
		.sort((a, b) => generatorItemOrder(a.sourceClass, a.id, a.frame) - generatorItemOrder(b.sourceClass, b.id, b.frame));
	const armor = context.armorId === 'startingArmor' ? null : entry({ id: context.armorId, instanceId: context.armorInstanceId, quantity: 1, identified: true, level: context.armorLevel });
	if (armor) armor.action = undefined;
	const artifact = rows.find(item => ARTIFACT_SLOT_IDS.has(item.id)) ?? null;
	const weapon: InventoryEntry = { id: 'equippedWeapon', instanceId: context.weaponInstanceId, name: context.weaponName,
		frame: context.weaponFrame, quantity: 1, identified: true };
	const ring = context.equippedRing ? entry({ ...context.equippedRing, quantity: 1, identified: true }) : null;
	if (ring) ring.action = undefined;
	panel.setItems([weapon, armor, artifact, null, ring], rows.filter(item => item !== artifact && item.id !== context.armorId), context.gold);
	context.addToStage(panel);
	context.positionInterface();
}
