import { SpriteSheet } from 'mwg';
import { Container2D, Rectangle2D, Shape2D, Sprite2D } from 'mwg/two-d/render';
import { IconGrid, TabbedList } from 'mwg/two-d/ui';
import { SpdLabel as Label } from './spdLabel';
import { SpdButton } from './spdButton';
import { spdPanel } from './spdPanel';
import { bagGridLayout } from './bagLayout';
import { t } from '../i18n';
import { runState } from '../runState';
import { titleIcon } from './titleIcons';
import { getAllArtifactIds } from '../items/artifacts';

/** Same derived id set `inventoryPanel.ts`'s `ARTIFACT_SLOT_IDS` uses, lower-cased to match
 * this file's own already-lower-cased `category()` comparison - see that constant's doc
 * comment for the bug this replaces (the "equipment" tab used to recognize only
 * `cloak`/`hourglass`/`holytome` by hand, so a carried Chalice/Cape/Toolkit/Beacon never
 * appeared under the Gear tab, only under Quest). */
const ARTIFACT_CATEGORY_IDS = new Set(getAllArtifactIds().map((id) => id.toLowerCase()));

export interface InventoryEntry {
	id: string;
	instanceId?: string;
	name: string;
	frame: number;
	quantity: number;
	description?: string;
	level?: number;
	identified?: boolean;
	cursed?: boolean;
	equipped?: boolean;
	action?: string;
	sourceClass?: string;
}

type InventoryFilter = 'all' | 'consumables' | 'equipment' | 'quest'
	| 'pouch_seed' | 'holder_scroll' | 'bag_potion' | 'holster_wand' | 'pouch_stone';

/**
 * Java's `Bag.canHold()` per sub-bag (`SeedPouch` holds seeds, `ScrollHolder` scrolls,
 * `PotionBag` potions, `MagicalHolster` wands, `VelvetPouch` runestones). The id tests are
 * this port's compact-id shapes for those families.
 */
export function subBagFor(item: { id: string }): string | null {
	const id = item.id.toLowerCase();
	if (id.startsWith('seed')) return 'pouch_seed';
	if (id.startsWith('scroll')) return 'holder_scroll';
	if (id.startsWith('potion')) return 'bag_potion';
	if (id === 'wand') return 'holster_wand';
	if (id.startsWith('stoneof')) return 'pouch_stone';
	return null;
}

const SUB_BAG_LABEL: Record<string, string> = {
	pouch_seed: 'port.ui.bag.seedpouch',
	holder_scroll: 'port.ui.bag.scrollholder',
	bag_potion: 'port.ui.bag.potionbag',
	holster_wand: 'port.ui.bag.holster',
	pouch_stone: 'port.ui.bag.velvetpouch',
};

/** Shared `items.png` sheet for the row icons above; built lazily so module load never touches
 * sprite state, and shared so `icon()` reuses cached frame textures across redraws. */
let itemsSheet: SpriteSheet | null = null;

/** WndBag/InventorySlot: 5 columns, 28px cells, 1px gutters, 14px title.
 * The root bag has Java-shaped category tabs and pages; the five sub-bags
 * (`SeedPouch`/`ScrollHolder`/`PotionBag`/`MagicalHolster`/`VelvetPouch`) are live as
 * filtered bag views over the same compact payload - each item's `subBagFor` test is
 * Java's own `Bag.canHold()` shape (seeds, scrolls, potions, wands, runestones), so the
 * pouch tabs show exactly what Java's pouches would hold. Moving items between bags has
 * no expression (the bag has no capacity limit here, so there is nothing to move for).
 * WndUseItem shows the actions actually implemented here.
 */
export class InventoryWindow extends Container2D {
	private readonly dim = new Shape2D();
	private readonly panel = new Container2D();
	private readonly detail = new Container2D();
	private entries: (InventoryEntry | null)[] = [];
	private equipment: (InventoryEntry | null)[] = [];
	private carried: InventoryEntry[] = [];
	private selection = 5;
	private list!: TabbedList<InventoryEntry>;
	private grid: IconGrid | null = null;
	private gold = 0;
	private vw = 0;
	private vh = 0;
	private chosen: InventoryEntry | null = null;
	private wide = false;
	private width_ = 156;
	private height_ = 226;

	/**
	 * `SPDSettings.interfaceSize()`: large mode switches the grid to `InventoryPane`'s
	 * wide 10-column arrangement (see `bagLayout.ts`) instead of the fixed 5-column one.
	 * Called on every refresh ahead of `setItems`, so toggling the interface size while
	 * the bag is open rearranges it in place; redraws only once entries exist.
	 */
	setWide(wide: boolean): void {
		this.wide = wide;
		const layout = bagGridLayout(wide);
		this.width_ = layout.windowWidth;
		this.height_ = layout.windowHeight;
		if (this.entries.length > 0) this.draw();
	}

	constructor(private use: (id: string, instanceId?: string) => void, private close: () => void) {
		super();
		this.list = this.createList();
		this.addChild(this.dim, this.panel, this.detail);
		this.dim.eventMode = 'static';
		this.dim.on('pointerdown', () => this.chosen ? this.dismissDetail() : this.close());
		this.panel.eventMode = 'static';
		this.panel.hitArea = new Rectangle2D(0, 0, this.width_, this.height_);
		this.detail.eventMode = 'static';
	}

	setItems(equipment: (InventoryEntry | null)[], carried: InventoryEntry[], gold: number): void {
		this.equipment = equipment;
		this.carried = carried;
		this.gold = gold;
		const tab = this.list?.tab.id ?? 'all';
		const page = this.list?.page ?? 0;
		this.list = this.createList();
		this.list.selectTab(tab);
		this.list.setPage(page);
		this.draw();
	}

	private filteredCarried(): InventoryEntry[] {
		return [...this.list.rows];
	}

	private createList(): TabbedList<InventoryEntry> {
		const category = (item: InventoryEntry): InventoryFilter => {
			const id = item.id.toLowerCase();
			//`holytome` is already correctly lower-cased here (the Cleric's equip-slot item is
			//stored as `holyTome`, and `id` above is already `.toLowerCase()`'d) - the casing looked
			//inconsistent against `inventoryPanel.ts`'s exact-case `'holyTome'` check, but each file
			//compares against its own already-established case convention, so neither was a bug.
			const equipment = id.startsWith('weapon') || id.startsWith('armor') || id.startsWith('ring_')
				|| id === 'wand' || ARTIFACT_CATEGORY_IDS.has(id) || id === 'holytome';
			const consumable = id.startsWith('potion') || id.startsWith('scroll') || id.startsWith('stoneof')
				|| id.startsWith('seed') || ['food', 'meat', 'chargrilledmeat', 'bomb', 'doublebomb'].includes(id);
			return equipment ? 'equipment' : consumable ? 'consumables' : 'quest';
		};
		return new TabbedList<InventoryEntry>({
			tabs: [
				{ id: 'all', label: t('port.ui.bag.all') }, { id: 'consumables', label: t('port.ui.bag.use') },
				{ id: 'equipment', label: t('port.ui.bag.gear') }, { id: 'quest', label: t('port.ui.bag.quest') },
				{ id: 'pouch_seed', label: t('port.ui.bag.seedpouch') }, { id: 'holder_scroll', label: t('port.ui.bag.scrollholder') },
				{ id: 'bag_potion', label: t('port.ui.bag.potionbag') }, { id: 'holster_wand', label: t('port.ui.bag.holster') },
				{ id: 'pouch_stone', label: t('port.ui.bag.velvetpouch') },
			],
			rowsFor: (tab) => {
				if (tab === 'all') return this.carried;
				if (tab === 'pouch_seed' || tab === 'holder_scroll' || tab === 'bag_potion'
					|| tab === 'holster_wand' || tab === 'pouch_stone') {
					return this.carried.filter((item) => subBagFor(item) === tab);
				}
				return this.carried.filter((item) => category(item) === tab);
			},
			pageSize: 20,
			label: (item) => item.name,
		});
	}

	private icon(frame: number): Sprite2D {
		//`items.png` is a 16x16 grid, and a sheet caches each cut `Texture`: every redraw shares
		//the frame textures instead of cutting a fresh one per row (MWG 0.8.0 item 326).
		itemsSheet ??= SpriteSheet.fromTexture(runState.sprites.items, 16, 16);
		return new Sprite2D(itemsSheet.get(frame));
	}

	private slotIcon(item: InventoryEntry | null, index: number): Container2D {
		const slot = new Container2D();
		const equipped = index < 5;
		const color = item?.cursed ? 0x9f394d : item && item.identified === false ? 0x995399 : equipped ? 0x91938c : 0x53564d;
		slot.addChild(new Shape2D().rect(0, 0, 28, 28).fill({ color, alpha: 0.6 }));
		if (item || equipped) {
			const sprite = this.icon(item?.frame ?? [1, 2, 6, 0, 5][index]);
			sprite.position.set(6, 6);
			if (!item) sprite.alpha = 0.3;
			slot.addChild(sprite);
		}
		if (item?.level && item.identified !== false) {
			const level = new Label({ text: `${item.level > 0 ? '+' : ''}${item.level}`, size: 6, color: item.level > 0 ? 0x44ff44 : 0xff4444 });
			level.anchor.set(1, 1); level.position.set(27, 27); slot.addChild(level);
		}
		if (item) {
			// IconGrid's built-in tap is intentionally a reorder gesture. Inventory selection is
			// an inspect gesture instead, so the adapter keeps this one semantic difference at
			// the item cell while keyboard confirm still goes through IconGrid.confirm().
			slot.eventMode = 'static';
			slot.on('pointertap', () => { this.selection = index; this.showItem(item); });
		}
		return slot;
	}

	private draw(): void {
		const layout = bagGridLayout(this.wide);
		this.panel.removeChildren().forEach(c => c.destroy({ children: true }));
		this.panel.addChild(spdPanel(this.width_, this.height_));
		const title = new Label({ text: t('port.action.bag'), size: 8, color: 0xffff44 });
		title.position.set(7, 7);
		const money = new Label({ text: String(this.gold), size: 8, color: 0xffff44 });
		money.anchor.set(1, 0); money.position.set(this.width_ - 26, 7);
		const coin = this.icon(18); coin.position.set(this.width_ - 24, 5);
		this.panel.addChild(title, money, coin);
		const carried = this.filteredCarried();
		this.entries = [...this.equipment, ...this.list.pageRows];
		while (this.entries.length < layout.padTotal) this.entries.push(null);
		//SPD v3.3.8's `WndBag` pages by `Bag` subclass rather than by filter, so these four
		//compact categories are this port's own labels (and its own category tests in
		//`filteredCarried`) - translated, not hardcoded English. The second row is Java's
		//own five sub-bags (`SeedPouch`/`ScrollHolder`/`PotionBag`/`MagicalHolster`/
		//`VelvetPouch`), filtered by `subBagFor` above.
		const filters: [InventoryFilter, string][] = [
			['all', t('port.ui.bag.all')], ['consumables', t('port.ui.bag.use')],
			['equipment', t('port.ui.bag.gear')], ['quest', t('port.ui.bag.quest')],
		];
		filters.forEach(([filter, text], index) => {
			const tab = new SpdButton({ width: 35, height: 17, text, onClick: () => {
				this.list.selectTab(filter); this.draw();
			} });
			tab.position.set(5 + index * 37, 20);
			this.panel.addChild(tab);
		});
		(['pouch_seed', 'holder_scroll', 'bag_potion', 'holster_wand', 'pouch_stone'] as const).forEach((filter, index) => {
			const tab = new SpdButton({ width: 28, height: 14, text: t(SUB_BAG_LABEL[filter]), onClick: () => {
				this.list.selectTab(filter); this.draw();
			} });
			tab.position.set(5 + index * 30, 38);
			this.panel.addChild(tab);
		});
		this.grid = new IconGrid({
			width: layout.gridWidth, height: layout.gridHeight, columns: layout.columns, cellSize: 29,
			items: this.entries.map((item, index) => ({
				icon: this.slotIcon(item, index), disabled: !item, quantity: item?.quantity,
				value: item,
			})),
			onHighlight: (cell) => { const item = cell.value as InventoryEntry | null; if (item) this.selection = this.entries.indexOf(item); },
			onSelect: (cell) => { const item = cell.value as InventoryEntry | null; if (item) { this.selection = this.entries.indexOf(item); this.showItem(item); } },
		});
		this.grid.position.set(5, layout.gridY);
		this.panel.addChild(this.grid);
		const close = new SpdButton({ width: 20, height: 17, icon: titleIcon(runState.sprites.uiIcons, 'exit', 1), onClick: this.close });
		close.position.set(this.width_ - 26, layout.footerY); this.panel.addChild(close);
		if (carried.length > 20) {
			const pages = Math.ceil(carried.length / 20);
			for (const [step, x, text] of [[-1, 6, '<'], [1, this.width_ - 66, '>']] as const) {
				const button = new SpdButton({ width: 20, height: 17, text, onClick: () => { this.list.nextPage(step); this.draw(); } });
				button.position.set(x, layout.footerY); this.panel.addChild(button);
			}
			const count = new Label({ text: `${this.list.page + 1}/${pages}`, size: 7 }); count.position.set(40, layout.footerY + 4); this.panel.addChild(count);
		} else {
			const bag = titleIcon(runState.sprites.uiIcons, 'bag', 1); bag.position.set(9, layout.footerY + 1); this.panel.addChild(bag);
		}
		this.layout(this.vw, this.vh);
	}

	private showItem(item: InventoryEntry): void {
		this.chosen = item;
		this.detail.removeChildren().forEach(c => c.destroy({ children: true }));
		this.detail.visible = true;
		this.panel.alpha = 0.35;
		this.panel.eventMode = 'none';
		this.detail.addChild(spdPanel(140, 120));
		const sprite = this.icon(item.frame); sprite.position.set(8, 9); this.detail.addChild(sprite);
		const name = new Label({ text: item.name, size: 8, color: 0xffff44, wrapWidth: 102 }); name.position.set(28, 9); this.detail.addChild(name);
		const stats = new Label({ text: `${item.quantity > 1 ? `${item.quantity}×  ` : ''}${item.identified !== false && item.level ? `+${item.level}` : ''}`, size: 7 });
		stats.position.set(9, 35); this.detail.addChild(stats);
		const bag = subBagFor(item);
		if (bag) {
			const bagLabel = new Label({ text: t(SUB_BAG_LABEL[bag]), size: 6, color: 0x9999ff });
			bagLabel.position.set(9, 44); this.detail.addChild(bagLabel);
		}
		if (item.description) {
			const description = new Label({ text: item.description, size: 6, wrapWidth: 122, color: 0xd0d0c0 });
			description.position.set(9, 46); this.detail.addChild(description);
		}
		if (item.action) {
			const use = new SpdButton({ width: 122, height: 18, text: item.action, onClick: () => { this.dismissDetail(); this.close(); this.use(item.id, item.instanceId); } });
			use.position.set(9, item.description ? 84 : 46); this.detail.addChild(use);
		}
		const back = new SpdButton({ width: 122, height: 16, text: t('port.window.close'), onClick: () => this.dismissDetail() });
		back.position.set(9, item.description ? 105 : 67); this.detail.addChild(back);
		this.layout(this.vw, this.vh);
	}

	private dismissDetail(): void {
		this.chosen = null; this.detail.visible = false; this.panel.alpha = 1; this.panel.eventMode = 'static'; this.draw();
	}

	reset(): void { this.chosen = null; this.detail.visible = false; this.panel.alpha = 1; this.panel.eventMode = 'static'; }

	handleAction(action: string): boolean {
		if (this.chosen) {
			if (action === 'cancel') this.dismissDetail();
			else if (action === 'confirm' && this.chosen.action) { const id = this.chosen.id; const instanceId = this.chosen.instanceId; this.dismissDetail(); this.close(); this.use(id, instanceId); }
			return true;
		}
		if (action === 'cancel') { this.close(); return true; }
		if (!this.grid) return true;
		return this.grid.handleAction(action);
	}

	layout(width: number, height: number): void {
		this.vw = width; this.vh = height;
		const zoom = Math.max(1, Math.min(3, Math.floor(Math.min((width - 16) / this.width_, (height - 16) / this.height_))));
		this.dim.clear().rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.5 });
		this.panel.scale.set(zoom); this.panel.position.set(Math.floor((width - this.width_ * zoom) / 2), Math.floor((height - this.height_ * zoom) / 2));
		this.detail.scale.set(zoom); this.detail.position.set(Math.floor((width - 140 * zoom) / 2), Math.floor((height - 120 * zoom) / 2));
	}
}
