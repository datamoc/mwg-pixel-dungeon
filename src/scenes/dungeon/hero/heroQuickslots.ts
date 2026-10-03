import type { DungeonScene } from '../../dungeonScene';
import { Game } from 'mwg';
import { t } from '../../../i18n/index';
import { appearanceKindOf } from '../../../items/alchemy';
import {
	QUICKSLOT_SIZE,
	assignQuickslotToFree as assignQuickslotToFreeEntry,
	clearQuickslotSlot as clearQuickslotSlotEntry,
	readQuickslotStates,
	setQuickslotSlot as setQuickslotSlotEntry,
	useQuickslot as useQuickslotEntry,
	type QuickslotContext,
} from '../../../items/itemActions';
import { appearanceItemFrame } from '../../../items/appearanceFrames';
import { quickslotItemFrame } from '../../../ui/inventoryPanel';

/** The toolbar quickslots (`ui/Toolbar.java` + `ui/QuickSlotButton.java`, tag `v3.3.8`) -
 * moved verbatim from `inventoryQuickslot.ts` as a file-size-refactor extraction once the
 * manual six-slot port grew past that group's own budget, behavior-identical. The scene
 * only binds its slot array, bag, sprite frames and use path; the slot model itself
 * lives in `items/itemActions.ts` next to the item-use router the slots feed. */
export const heroQuickslotMethods = {

	/** The toolbar's six quickslot states - the decision lives in `items/itemActions.ts`
	 * next to the item-use router they feed; the scene only binds its slot array, bag,
	 * sprite frames and use path. Each state carries the item's display name for the
	 * slot's hover hint, the way Java's `QuickslotTool` tooltips the item's own name. */
	quickslotStates(this: DungeonScene): ({ id: string; instanceId?: string; frame: number; quantity: number; name?: string } | null)[] {
		return readQuickslotStates(this.quickslotContext()).map((state) => {
			if (!state) return null;
			const held = this.bag.find(state.id, state.instanceId);
			return { ...state, name: this.itemDisplayName(state.id, held?.identified ?? false, state.instanceId) };
		});
	},

	/** Exact-slot assignment (the slot long-press picker), replacing whatever was there. */
	setQuickslot(this: DungeonScene, slot: number, id: string, instanceId?: string): void {
		setQuickslotSlotEntry(this.quickslotContext(), slot, id, instanceId);
		this.refreshToolbarQuickslots();
	},

	/** Drops one slot's assignment (replacements come through `setQuickslot`; this
	 * stays for the keyboard/debug path). */
	clearQuickslot(this: DungeonScene, slot: number): void {
		clearQuickslotSlotEntry(this.quickslotContext(), slot);
		this.refreshToolbarQuickslots();
	},

	/** First-free-slot assignment (the inventory long-press): confirms the slot in
	 * the log and reports a full bar instead of silently dropping the item. */
	assignBagItemToFree(this: DungeonScene, id: string, instanceId?: string): void {
		const slot = assignQuickslotToFreeEntry(this.quickslotContext(), id, instanceId);
		if (slot < 0) this.say(t('port.quickslot.full'));
		else {
			const held = this.bag.find(id, instanceId);
			this.say(t('port.quickslot.assigned', {
				item: this.itemDisplayName(id, held?.identified ?? false, instanceId),
				slot: slot + 1,
			}));
		}
		this.refreshToolbarQuickslots();
	},

	/** Opens the bag with cell taps routed to one slot (`ui.quickslotbutton.select_item`,
	 * Java's `WndBag.ItemSelector` prompt behind `QuickSlotButton.set`). */
	openQuickslotPicker(this: DungeonScene, slot: number): void {
		if (slot < 0 || slot >= QUICKSLOT_SIZE) return;
		this.quickslotPickSlot = slot;
		this.inventoryPanel.pickHandler = (id, instanceId) => {
			this.inventoryPanel.pickHandler = null;
			this.quickslotPickSlot = null;
			this.setQuickslot(slot, id, instanceId);
			this.inventoryOpen = false;
			this.inventoryPanel.reset();
			this.refreshInventoryPanel();
		};
		this.inventoryOpen = true;
		this.refreshInventoryPanel();
		this.positionInterface(Game.current.width, Game.current.height);
	},

	/** Pushes the live states to the toolbar, moving the interface when visibility changes. */
	refreshToolbarQuickslots(this: DungeonScene): void {
		if (this.actionBar.setQuickslots(this.quickslotStates())) {
			this.positionInterface(Game.current.width, Game.current.height);
		}
	},

	useQuickslot(this: DungeonScene, slot: number): void {
		useQuickslotEntry(this.quickslotContext(), slot);
	},

	quickslotContext(this: DungeonScene): QuickslotContext {
		const scene = this;
		return {
			slots: this.quickslots,
			findHeld: (id, instanceId) => this.bag.find(id, instanceId),
			itemFrame: (id) => quickslotItemFrame(id, (kind) => {
				const category = kind.startsWith('potion') ? 'potion' as const : kind.startsWith('scroll') ? 'scroll' as const : null;
				if (!category) return undefined;
				try { return appearanceItemFrame(category, scene.appearances.appearanceOf(category, appearanceKindOf(kind))); } catch { return undefined; }
			}),
			useItem: (id, instanceId) => this.useItemById(id, instanceId),
		};
	},
};
