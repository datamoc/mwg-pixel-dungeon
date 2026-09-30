import { Container, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Button, Label } from 'mwg';
import { runState } from '../runState';
import { t } from '../i18n';
import { SpdButton } from './spdButton';
import { titleIcon } from './titleIcons';
import { hudZoom } from './interfaceMode';
import { QUICKSLOT_SIZE, type QuickslotState } from '../items/itemActions';
import { addLongPress } from './longPress';

/** A quickslot state plus the item's display name for the hover hint - Java's
 * `QuickslotTool` tooltip is the item's own name (`Item.name()`). */
export type QuickslotView = QuickslotState & { name?: string };

/** `Toolbar.java` GROUP layout (`Toolbar.layout()`, tag `v3.3.8`): the `more` menu cap,
 * six assignable `QuickslotTool` cells, then search, wait and the backpack - with the
 * contextual ability buttons above the row. Java shows 4-6 slots by UI width
 * (`quickslotsToShow`); this row always shows all six, a stated simplification (a narrow
 * phone window can overflow where Java would swap - there is no `SlotSwapTool` here).
 *
 * The pre-2026-09-30 row of fixed verbs (read/quaff/eat/special on generic icons, plus
 * four auto-filled family slots floating above) is gone: tap uses the assigned item
 * through the scene's `quickslot0..5` actions, long-press opens the bag to pick the
 * slot's item (`ui.quickslotbutton.select_item`), and tapping an empty (or placeholder)
 * slot opens the picker too. Those verbs remain as hero actions for keyboard/keys.
 */
export class SpdToolbar extends Container {
	private readonly extras = new Container();
	private readonly hint = new Label({ size: 8 });
	private readonly row = new Container();
	/** Java's `ActionIndicator`: contextual ability buttons living above the toolbar, shown only
	 * while the ability is available. Java draws a dedicated `HeroIcon`; this uses SPD action-name
	 * text because the port has no matching icon art. */
	private readonly actions = new Container();
	private readonly preparationButton: SpdButton;
	/** Java's armor-ability button: the class armor's `AC_ABILITY` action, shown while the hero has
	 * an ability chosen, carrying its name and charge percent the way `ClassArmor.status()` does. */
	private readonly armorAbilityButton: SpdButton;
	private readonly berserkButton: SpdButton;
	private readonly slotCells: { root: Container; base: Sprite; icon: Sprite | null; qty: Label }[] = [];
	private readonly rowWidth = 218;
	private zoom = 2;
	/** Both contextual buttons stack above the toolbar row - Preparation at `-19`, the armor
	 *  ability above it at `-40`, and Berserk at `-61` - so what the interface layout has to
	 *  clear is the *highest* visible button's own top edge, not one row per button. Counting
	 *  a row each would reserve 21 units for a button whose box reaches 40 above the row, and
	 *  the game log is anchored off this number (`positionInterface`), so the newest lines
	 *  would land underneath the armor button. */
	get occupiedHeight(): number {
		let contextual = 0;
		for (const button of [this.preparationButton, this.armorAbilityButton, this.berserkButton]) {
			if (button.visible) contextual = Math.max(contextual, -button.y);
		}
		return (this.extras.visible ? 143 : 26) * this.zoom + contextual * this.zoom;
	}

	constructor(onAction: (action: string) => void, onLayout: () => void, hooks: { assignSlot: (slot: number) => void }) {
		super();
		this.extras.visible = false;
		this.hint.visible = false;
		this.hint.anchor.set(1, 1);
		this.hint.position.set(this.rowWidth, -3);
		this.addChild(this.row, this.actions, this.extras, this.hint);
		this.preparationButton = new SpdButton({ width: 110, height: 19, text: t('actors.buffs.preparation.action_name'), onClick: () => onAction('preparation') });
		this.preparationButton.position.set(this.rowWidth - 110, -19);
		this.preparationButton.visible = false;
		this.actions.addChild(this.preparationButton);
		this.armorAbilityButton = new SpdButton({ width: 110, height: 19, text: '', onClick: () => onAction('armorAbility') });
		this.armorAbilityButton.position.set(this.rowWidth - 110, -40);
		this.armorAbilityButton.visible = false;
		this.actions.addChild(this.armorAbilityButton);
		this.berserkButton = new SpdButton({ width: 110, height: 19, text: t('actors.buffs.berserk.action_name'), onClick: () => onAction('berserk') });
		this.berserkButton.position.set(this.rowWidth - 110, -61);
		this.berserkButton.visible = false;
		this.actions.addChild(this.berserkButton);
		//Contextual buttons live in one container so `occupiedHeight` moves the interface above
		//the toolbar once, whichever of them appears.
		this.actions.visible = false;
		const sheet = runState.sprites.uiToolbar;
		const crop = (x: number, y: number, w: number, h: number) => new Texture({ source: sheet.source, frame: new Rectangle(x, y, w, h) });
		let x = 0;
		const add = (action: string, key: string, frameX: number, width: number, height: number, icon: Sprite, click = () => onAction(action)) => {
			const button = new Button({ width, height, icon, onClick: click });
			button.children[0].visible = false;
			const base = new Sprite(crop(frameX, 0, width, height));
			button.addChildAt(base, 0);
			button.position.set(x, 26 - height);
			x += width;
			button.on('pointerover', () => { this.hint.setText(t(key)); this.hint.visible = !this.extras.visible; });
			button.on('pointerout', () => { this.hint.visible = false; base.tint = 0xffffff; });
			button.on('pointerdown', () => { base.tint = 0xaaaaaa; });
			button.on('pointerup', () => { base.tint = 0xffffff; });
			button.on('pointerupoutside', () => { base.tint = 0xffffff; });
			this.row.addChild(button);
		};
		add('more', 'scenes.titlescene.settings', 64, 22, 24, titleIcon(runState.sprites.uiIcons, 'prefs', 1), () => {
			this.extras.visible = !this.extras.visible;
			this.hint.visible = false;
			onLayout();
		});
		//Java's six `QuickslotTool`s sit in the row itself: uniform 22-wide cells on the
		//same frame art as the row's other buttons (Java varies the end caps by position;
		//one frame for all six is a stated simplification, not a new asset).
		//items.png is a 16-wide grid of 16px cells; slot icons cut the same frames the bag shows.
		for (let slot = 0; slot < QUICKSLOT_SIZE; slot++) {
			const root = new Container();
			const base = new Sprite(crop(64, 0, 22, 24));
			root.addChild(base);
			const qty = new Label({ size: 7 });
			qty.anchor.set(1, 1);
			qty.position.set(21, 23);
			root.addChild(qty);
			root.eventMode = 'static';
			root.cursor = 'pointer';
			root.position.set(x, 26 - 24);
			x += 22;
			const cell = { root, base, icon: null as Sprite | null, qty };
			this.slotCells.push(cell);
			const index = slot;
			addLongPress(root, {
				onTap: () => {
					const current = this.slotState(index);
					//An empty or placeholder slot cannot fire - tapping it picks its item instead.
					if (!current || current.quantity <= 0) hooks.assignSlot(index);
					else onAction(`quickslot${index}`);
				},
				onLongPress: () => hooks.assignSlot(index),
			});
			root.on('pointerover', () => {
				const current = this.slotState(index);
				this.hint.setText(current?.name ?? t('ui.toolbar.quickslot_assign'));
				this.hint.visible = !this.extras.visible;
			});
			root.on('pointerout', () => {
				this.hint.visible = false;
				base.tint = 0xffffff;
			});
			this.row.addChild(root);
		}
		//`Toolbar.layout()`: search, wait, then the backpack as the right-hand cap of the row.
		//Hover labels are SPD's own keybinding names (`Toolbar.hoverText()`, tag `v3.3.8`),
		//translated in every locale - the `port.action.*` keys this row used before this
		//change never existed in any catalogue and rendered as raw key text.
		add('search', 'windows.wndkeybindings.examine', 44, 20, 26, new Sprite(crop(192, 0, 16, 16)));
		add('wait', 'windows.wndkeybindings.wait', 24, 20, 26, new Sprite(crop(176, 0, 16, 16)));
		add('inventory', 'windows.wndkeybindings.inventory', 0, 24, 26, new Sprite(crop(160, 0, 16, 16)));
		const extraActions = [['examine', 'port.action.examine'], ['upgrade', 'port.action.upgrade'], ['talents', 'port.action.talents'], ['weaponAbility', 'port.action.ability'], ['journal', 'windows.wndkeybindings.journal'], ['gameMenu', 'windows.wndkeybindings.menu'], ['save', 'port.action.save'], ['load', 'port.action.load']];
		extraActions.forEach(([action, key], i) => {
			const button = new SpdButton({ width: 100, height: 21, text: t(key), onClick: () => {
				this.extras.visible = false;
				onAction(action);
				onLayout();
			} });
			button.position.set(this.rowWidth - 100, -extraActions.length * 23 + i * 23);
			this.extras.addChild(button);
		});
	}

	private states: readonly (QuickslotView | null)[] = [];
	private slotState(slot: number): QuickslotView | null {
		return this.states[slot] ?? null;
	}

	/** `height` is where the row's bottom edge sits; `windowHeight` (the whole window) picks the zoom, which must not shrink when a docked pane takes height. */
	layout(width: number, height: number, windowHeight = height): void {
		this.zoom = hudZoom(width, windowHeight);
		this.scale.set(this.zoom);
		this.position.set(Math.floor(width - this.rowWidth * this.zoom), height - 26 * this.zoom);
	}

	/** Whether the hero's Preparation is up, i.e. whether the blink action exists right now.
	 * Called from the scene's own HUD refresh, so the button tracks the buff rather than polling.
	 * Returns whether that changed anything, since the interface sits its own layout above the
	 * toolbar and has to move when a button appears or goes. */
	setPreparationAvailable(available: boolean): boolean {
		if (this.preparationButton.visible === available) return false;
		this.preparationButton.visible = available;
		this.actions.visible = this.preparationButton.visible || this.armorAbilityButton.visible || this.berserkButton.visible;
		return true;
	}

	/** Sets the armor-ability button's label, or hides it when the hero has no ability chosen. The
	 * scene owns the chosen ability and its charge; this only reflects them, including the charge
	 * percent the label carries. Returns whether anything changed, for the same re-layout reason
	 * `setPreparationAvailable` reports its own. */
	setArmorAbility(label: string | null): boolean {
		const changed = this.armorAbilityButton.visible !== (label !== null) || this.armorAbilityLabel !== label;
		if (label !== null) this.armorAbilityButton.setText(label);
		this.armorAbilityLabel = label;
		this.armorAbilityButton.visible = label !== null;
		this.actions.visible = this.preparationButton.visible || this.armorAbilityButton.visible || this.berserkButton.visible;
		return changed;
	}

	/** Java's Berserk `ActionIndicator.Action`: available at full rage while the state is normal. */
	setBerserkAvailable(available: boolean): boolean {
		if (this.berserkButton.visible === available) return false;
		this.berserkButton.visible = available;
		this.actions.visible = this.preparationButton.visible || this.armorAbilityButton.visible || available;
		return true;
	}
	private armorAbilityLabel: string | null = null;

	/** Reflects the scene's six quickslot assignments: each cell draws its item's own sprite
	 * (the same `items.png` frame the bag shows) with the live quantity, dimmed while the
	 * assignment is a placeholder. Returns whether anything visible changed. */
	setQuickslots(slots: readonly (QuickslotView | null)[]): boolean {
		let changed = false;
		const items = runState.sprites.items;
		for (let i = 0; i < QUICKSLOT_SIZE; i++) {
			const state = slots[i] ?? null;
			const cell = this.slotCells[i];
			if (!cell) continue;
			const before = this.states[i] ?? null;
			const signature = (s: QuickslotView | null) => (s ? `${s.id}:${s.instanceId ?? ''}:${s.frame}:${s.quantity}` : 'empty');
			if (signature(before) !== signature(state)) changed = true;
			if (cell.icon) {
				cell.root.removeChild(cell.icon);
				cell.icon.destroy();
				cell.icon = null;
			}
			if (state) {
				const icon = new Sprite(new Texture({
					source: items.source,
					frame: new Rectangle((state.frame % 16) * 16, Math.floor(state.frame / 16) * 16, 16, 16),
				}));
				icon.position.set(3, 4);
				icon.alpha = state.quantity > 0 ? 1 : 0.4;
				cell.root.addChild(icon);
				cell.icon = icon;
				cell.qty.setText(state.quantity > 1 ? String(state.quantity) : '');
			} else {
				cell.qty.setText('');
			}
		}
		this.states = slots.map((s) => (s ? { ...s } : null));
		return changed;
	}
}
