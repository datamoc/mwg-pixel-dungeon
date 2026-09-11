import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { SpdLabel as Label } from './spdLabel';
import { SpdButton } from './spdButton';
import { spdPanel } from './spdPanel';
import { t } from '../i18n';
import { runState } from '../runState';
import { titleIcon } from './titleIcons';

export interface InventoryEntry {
	id: string;
	instanceId?: string;
	name: string;
	frame: number;
	quantity: number;
	level?: number;
	identified?: boolean;
	cursed?: boolean;
	equipped?: boolean;
	action?: string;
	sourceClass?: string;
}

type InventoryFilter = 'all' | 'consumables' | 'equipment' | 'quest';

/** WndBag/InventorySlot: 5 columns, 28px cells, 1px gutters, 14px title.
 * The root bag has Java-shaped category tabs and pages; actual sub-bag ownership is not
 * invented because this port's compact item payload has no container relationship yet.
 * WndUseItem shows the actions actually implemented here.
 */
export class InventoryWindow extends Container {
	private readonly dim = new Graphics();
	private readonly panel = new Container();
	private readonly detail = new Container();
	private entries: (InventoryEntry | null)[] = [];
	private equipment: (InventoryEntry | null)[] = [];
	private carried: InventoryEntry[] = [];
	private selection = 5;
	private page = 0;
	private filter: InventoryFilter = 'all';
	private gold = 0;
	private vw = 0;
	private vh = 0;
	private chosen: InventoryEntry | null = null;
	private readonly width_ = 156;
	private readonly height_ = 226;

	constructor(private use: (id: string, instanceId?: string) => void, private close: () => void) {
		super();
		this.addChild(this.dim, this.panel, this.detail);
		this.dim.eventMode = 'static';
		this.dim.on('pointerdown', () => this.chosen ? this.dismissDetail() : this.close());
		this.panel.eventMode = 'static';
		this.panel.hitArea = new Rectangle(0, 0, this.width_, this.height_);
		this.detail.eventMode = 'static';
	}

	setItems(equipment: (InventoryEntry | null)[], carried: InventoryEntry[], gold: number): void {
		this.equipment = equipment;
		this.carried = carried;
		this.gold = gold;
		this.page = Math.min(this.page, Math.max(0, Math.ceil(this.filteredCarried().length / 20) - 1));
		this.draw();
	}

	private filteredCarried(): InventoryEntry[] {
		return this.carried.filter((item) => {
			if (this.filter === 'all') return true;
			const id = item.id.toLowerCase();
			const equipment = id.startsWith('weapon') || id.startsWith('armor') || id.startsWith('ring_')
				|| id === 'wand' || id === 'cloak' || id === 'hourglass' || id === 'holytome';
			const consumable = id.startsWith('potion') || id.startsWith('scroll') || id.startsWith('stoneof')
				|| id.startsWith('seed') || ['food', 'meat', 'chargrilledmeat', 'bomb', 'doublebomb'].includes(id);
			if (this.filter === 'equipment') return equipment;
			if (this.filter === 'consumables') return consumable;
			return !equipment && !consumable;
		});
	}

	private icon(frame: number): Sprite {
		return new Sprite(new Texture({ source: runState.sprites.items.source,
			frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) }));
	}

	private draw(): void {
		this.panel.removeChildren().forEach(c => c.destroy({ children: true }));
		this.panel.addChild(spdPanel(this.width_, this.height_));
		const title = new Label({ text: t('port.action.bag'), size: 8, color: 0xffff44 });
		title.position.set(7, 7);
		const money = new Label({ text: String(this.gold), size: 8, color: 0xffff44 });
		money.anchor.set(1, 0); money.position.set(130, 7);
		const coin = this.icon(18); coin.position.set(132, 5);
		this.panel.addChild(title, money, coin);
		const carried = this.filteredCarried();
		this.entries = [...this.equipment, ...carried.slice(this.page * 20, this.page * 20 + 20)];
		while (this.entries.length < 25) this.entries.push(null);
		//SPD v3.3.8's `WndBag` pages by `Bag` subclass rather than by filter, so these four
		//compact categories are this port's own labels (and its own category tests in
		//`filteredCarried`) - translated, not hardcoded English.
		const filters: [InventoryFilter, string][] = [
			['all', t('port.ui.bag.all')], ['consumables', t('port.ui.bag.use')],
			['equipment', t('port.ui.bag.gear')], ['quest', t('port.ui.bag.quest')],
		];
		filters.forEach(([filter, text], index) => {
			const tab = new SpdButton({ width: 35, height: 17, text, onClick: () => {
				this.filter = filter; this.page = 0; this.draw();
			} });
			tab.position.set(5 + index * 37, 20);
			this.panel.addChild(tab);
		});
		this.entries.forEach((item, index) => {
			const slot = new Container();
			slot.position.set(6 + (index % 5) * 29, 40 + Math.floor(index / 5) * 29);
			const equipped = index < 5;
			const color = item?.cursed ? 0x9f394d : item && item.identified === false ? 0x995399 : equipped ? 0x91938c : 0x53564d;
			const bg = new Graphics().rect(0, 0, 28, 28).fill({ color, alpha: 0.6 });
			if (index === this.selection && item) bg.rect(0.5, 0.5, 27, 27).stroke({ color: 0xffff44, width: 0.5 });
			slot.addChild(bg);
			if (item || equipped) {
				const sprite = this.icon(item?.frame ?? [1, 2, 6, 0, 5][index]);
				sprite.position.set(6, 6);
				if (!item) sprite.alpha = 0.3;
				slot.addChild(sprite);
			}
			if (item) {
				if (item.quantity > 1) {
					const amount = new Label({ text: String(item.quantity), size: 6 }); amount.position.set(1, 1); slot.addChild(amount);
				}
				if (item.level && item.identified !== false) {
					const level = new Label({ text: `${item.level > 0 ? '+' : ''}${item.level}`, size: 6, color: item.level > 0 ? 0x44ff44 : 0xff4444 });
					level.anchor.set(1, 1); level.position.set(27, 27); slot.addChild(level);
				}
				slot.eventMode = 'static'; slot.cursor = 'pointer';
				slot.on('pointertap', () => { this.selection = index; this.showItem(item); });
			}
			this.panel.addChild(slot);
		});
		const close = new SpdButton({ width: 20, height: 17, icon: titleIcon(runState.sprites.uiIcons, 'exit', 1), onClick: this.close });
		close.position.set(130, 204); this.panel.addChild(close);
		if (carried.length > 20) {
			const pages = Math.ceil(carried.length / 20);
			for (const [step, x, text] of [[-1, 6, '<'], [1, 90, '>']] as const) {
				const button = new SpdButton({ width: 20, height: 17, text, onClick: () => { this.page = (this.page + step + pages) % pages; this.draw(); } });
				button.position.set(x, 204); this.panel.addChild(button);
			}
			const count = new Label({ text: `${this.page + 1}/${pages}`, size: 7 }); count.position.set(40, 208); this.panel.addChild(count);
		} else {
			const bag = titleIcon(runState.sprites.uiIcons, 'bag', 1); bag.position.set(9, 205); this.panel.addChild(bag);
		}
		this.layout(this.vw, this.vh);
	}

	private showItem(item: InventoryEntry): void {
		this.chosen = item;
		this.detail.removeChildren().forEach(c => c.destroy({ children: true }));
		this.detail.visible = true;
		this.panel.alpha = 0.35;
		this.panel.eventMode = 'none';
		this.detail.addChild(spdPanel(140, 90));
		const sprite = this.icon(item.frame); sprite.position.set(8, 9); this.detail.addChild(sprite);
		const name = new Label({ text: item.name, size: 8, color: 0xffff44, wrapWidth: 102 }); name.position.set(28, 9); this.detail.addChild(name);
		const stats = new Label({ text: `${item.quantity > 1 ? `${item.quantity}×  ` : ''}${item.identified !== false && item.level ? `+${item.level}` : ''}`, size: 7 });
		stats.position.set(9, 35); this.detail.addChild(stats);
		if (item.action) {
						const use = new SpdButton({ width: 122, height: 18, text: item.action, onClick: () => { this.dismissDetail(); this.close(); this.use(item.id, item.instanceId); } });
			use.position.set(9, 46); this.detail.addChild(use);
		}
		const back = new SpdButton({ width: 122, height: 16, text: t('port.window.close'), onClick: () => this.dismissDetail() });
		back.position.set(9, 67); this.detail.addChild(back);
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
		if (action === 'confirm') { const item = this.entries[this.selection]; if (item) this.showItem(item); return true; }
		const delta = ({ left: -1, right: 1, up: -5, down: 5 } as Record<string, number>)[action];
		if (delta !== undefined) { this.selection = Math.max(0, Math.min(24, this.selection + delta)); this.draw(); }
		return true;
	}

	layout(width: number, height: number): void {
		this.vw = width; this.vh = height;
		const zoom = Math.max(1, Math.min(3, Math.floor(Math.min((width - 16) / this.width_, (height - 16) / this.height_))));
		this.dim.clear().rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.5 });
		this.panel.scale.set(zoom); this.panel.position.set(Math.floor((width - this.width_ * zoom) / 2), Math.floor((height - this.height_ * zoom) / 2));
		this.detail.scale.set(zoom); this.detail.position.set(Math.floor((width - 140 * zoom) / 2), Math.floor((height - 90 * zoom) / 2));
	}
}
