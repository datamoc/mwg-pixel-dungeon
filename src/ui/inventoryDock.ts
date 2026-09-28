import { Container, Graphics, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Label, NinePatch } from 'mwg';
import { runState } from '../runState';
import { SPD_TITLE_COLOR } from './spdTheme';
import { isBagId, type BagId } from '../items/bags';
import type { InventoryEntry } from './inventoryWindow';

/**
 * The docked inventory of `SPDSettings.interfaceSize() == 2` (`ui/InventoryPane.java` with
 * `ui/InventorySlot.java` and `ui/ItemSlot.java`, tag `v3.3.8`): a `TOAST_TR` panel 187 wide with
 * the five equipped slots (weapon, armor, artifact, misc, ring) on top, the gold count beside
 * them and the bag in 17x24 slots, ten to a row. Laid out in Java's native pixels and scaled by
 * `hudZoom` (Java's UI-camera zoom).
 *
 * The `BagButton` row (17x14 at y+14, `ACTIVE`/`INACTIVE` tints) shows the backpack and each bag
 * the hero owns, but is display-only: this port's bag is one flat list, so the grid simply grows
 * by a row per ten items instead of capping at Java's 20 and there are no per-bag pages to switch
 * to. Also not ported (see `PORT_COVERAGE.md`): `LostInventory` greying, the selector/prompt mode,
 * the throw crosshair and the `energy` counter. Clicking a slot opens the port's existing item window.
 */
const WIDTH = 187;
const SLOT_W = 17;
const SLOT_H = 24;
const COLUMNS = 10;
/** `ItemSpriteSheet` placeholders (`PLACEHOLDERS = xy(1, 1)` on a 16-wide sheet): weapon, armor, artifact, misc (`SOMETHING`), ring. */
const HOLDER_FRAMES = [18, 19, 23, 17, 22];
const NORMAL = 0x53564d;
const EQUIPPED = 0x91938c;
/** `InventoryPane.BagButton.ACTIVE` / `INACTIVE` (0xAARRGGBB with alpha 0x99). */
const BAG_ACTIVE = 0x53564d;
const BAG_INACTIVE = 0x42443d;
/** `Icons.COIN_SML`/`BACKPACK` and the four bag icons, located in this port's repacked `ui_icons.png` (`tools/scratch/icons-match.mjs`). */
const COIN_ICON = new Rectangle(192, 64, 7, 7);
const BACKPACK_ICON = new Rectangle(201, 64, 10, 10);
const BAG_ICONS: Record<BagId, Rectangle> = {
	scrollHolder: new Rectangle(211, 64, 10, 10),
	velvetPouch: new Rectangle(221, 64, 10, 10),
	magicalHolster: new Rectangle(231, 64, 10, 10),
	potionBandolier: new Rectangle(241, 64, 10, 10),
};
/** `ItemSlot.DEGRADED` / `UPGRADED`, the level and strength colours. */
const DEGRADED = 0xff4444;
const UPGRADED = 0x44ff44;

export class InventoryDock extends Container {
	private readonly art = new Container();
	private equipment: (InventoryEntry | null)[] = [];
	private carried: InventoryEntry[] = [];
	private gold = 0;
	private paneHeight = 82;
	/** `GameScene.toggleInvPane()`: the toolbar's backpack button shows and hides the docked pane. */
	shown = true;

	constructor(private readonly onSelect: (entry: InventoryEntry) => void) {
		super();
		this.setZoom(2);
		this.addChild(this.art);
	}

	/** Rendered size in screen pixels. */
	get renderedWidth(): number { return WIDTH * this.zoom; }
	get renderedHeight(): number { return this.paneHeight * this.zoom; }

	private zoom = 2;
	setZoom(zoom: number): void { this.zoom = zoom; this.scale.set(zoom); }

	setItems(equipment: (InventoryEntry | null)[], carried: InventoryEntry[], gold: number): void {
		this.equipment = equipment;
		this.carried = carried;
		this.gold = gold;
		this.draw();
	}

	private frameTexture(frame: number): Texture {
		return new Texture({ source: runState.sprites.items.source, frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) });
	}

	private panel(height: number): NinePatch {
		//`Chrome.Type.TOAST_TR_HEAVY` = `NinePatch(chrome, 29, 9, 9, 9, 4)`, the one background `InventoryPane` uses.
		const patch = new NinePatch(new Texture({ source: runState.sprites.uiChrome.source, frame: new Rectangle(29, 9, 9, 9) }), { border: 4 });
		patch.resize(WIDTH, height);
		return patch;
	}

	private text(value: string, color: number, alpha = 1): Label {
		//A scale-1 BitmapText in a container that is already scaled: size 6 draws at this port's HUD size 12.
		//Java's `BitmapText` is unsmoothed: draw at 6x and let the 2x container minify, or the digits smear.
		const label = new Label({ size: 6, color, resolution: 6, roundPixels: true });
		label.setText(value);
		label.alpha = alpha;
		return label;
	}

	private slot(entry: InventoryEntry | null, x: number, y: number, equippedSlot: boolean, holder?: number): Container {
		const slot = new Container();
		slot.position.set(x, y);
		//`InventorySlot.item()`: a cursed-known item tints red (+0.3 r, -0.15 g), an unidentified one purple.
		const base = equippedSlot && entry ? EQUIPPED : NORMAL;
		const color = entry?.cursed ? tint(base, 76, -38, 0) : entry && entry.identified === false ? tint(base, 76, 0, 76) : base;
		slot.addChild(new Graphics().rect(0, 0, SLOT_W, SLOT_H).fill({ color, alpha: 0.6 }));
		const frame = entry ? entry.frame : holder;
		if (frame !== undefined) {
			const sprite = new Sprite(this.frameTexture(frame));
			sprite.position.set(Math.floor((SLOT_W - 16) / 2), Math.floor((SLOT_H - 16) / 2));
			if (!entry) sprite.alpha = 0.3;
			slot.addChild(sprite);
		}
		if (entry) {
			//`ItemSlot.updateText()`: quantity/charges top-left, strength requirement top-right, level bottom-right.
			if (entry.quantity > 1) { const q = this.text(String(entry.quantity), 0xffffff); q.position.set(0, 0); slot.addChild(q); }
			if (entry.extra) {
				const extra = this.text(entry.extra, entry.extraColor ?? 0xffffff);
				extra.position.set(SLOT_W - extra.width, 0);
				slot.addChild(extra);
			}
			if (entry.level && entry.identified !== false) {
				const level = this.text(`${entry.level > 0 ? '+' : ''}${entry.level}`, entry.level > 0 ? UPGRADED : DEGRADED);
				level.position.set(SLOT_W - level.width, SLOT_H - level.height - 1);
				slot.addChild(level);
			}
			slot.eventMode = 'static';
			slot.cursor = 'pointer';
			slot.on('pointertap', (event) => { event.stopPropagation(); this.onSelect(entry); });
		}
		return slot;
	}

	private icon(region: Rectangle, x: number, y: number): Sprite {
		const sprite = new Sprite(new Texture({ source: runState.sprites.uiIcons.source, frame: region }));
		sprite.position.set(x, y);
		return sprite;
	}

	private draw(): void {
		this.art.removeChildren().forEach((child) => child.destroy({ children: true }));
		//The bags themselves are the `BagButton`s, not grid items.
		const items = this.carried.filter((entry) => !isBagId(entry.id));
		const bagSlots = Math.max(20, Math.ceil(items.length / COLUMNS) * COLUMNS);
		const rows = bagSlots / COLUMNS;
		//4 top margin + the equipped row + 1 gap, then 25 per bag row, plus Java's 3px bottom margin (82 for two rows).
		this.paneHeight = 4 + SLOT_H + 1 + rows * (SLOT_H + 1) + 3;
		this.art.addChild(this.panel(this.paneHeight));
		let left = 4;
		for (let i = 0; i < 5; i++) {
			this.art.addChild(this.slot(this.equipment[i] ?? null, left, 4, true, HOLDER_FRAMES[i]));
			left += SLOT_W + 1;
		}
		//`InventoryPane.layout()`: gold text at (left, 5.5), the coin one pixel after it; then the bag buttons at y+14.
		const gold = this.text(String(this.gold), SPD_TITLE_COLOR);
		gold.position.set(left, 5.5);
		this.art.addChild(gold, this.icon(COIN_ICON, left + gold.width + 1, 5.5));
		const owned = this.carried.filter((entry) => isBagId(entry.id)).map((entry) => entry.id as BagId);
		let bagLeft = left;
		for (const bag of [null, ...owned]) {
			const button = new Container();
			button.position.set(bagLeft, 14);
			//`BagButton.layout()`: a 1px-inset top strip over the full-width body, `ACTIVE` for the shown (flat) bag.
			const tint = bag === null ? BAG_ACTIVE : BAG_INACTIVE;
			button.addChild(new Graphics().rect(1, 0, SLOT_W - 2, 1).fill({ color: tint, alpha: 0.6 }).rect(0, 1, SLOT_W, 13).fill({ color: tint, alpha: 0.6 }));
			const region = bag === null ? BACKPACK_ICON : BAG_ICONS[bag];
			button.addChild(this.icon(region, Math.floor((SLOT_W - region.width) / 2), Math.floor((14 - region.height) / 2)));
			this.art.addChild(button);
			bagLeft += SLOT_W + 1;
		}
		for (let i = 0; i < bagSlots; i++) {
			const x = 4 + (i % COLUMNS) * (SLOT_W + 1);
			const y = 4 + SLOT_H + 1 + Math.floor(i / COLUMNS) * (SLOT_H + 1);
			this.art.addChild(this.slot(items[i] ?? null, x, y, false));
		}
	}
}

/** Adds signed 0-255 channel offsets to a colour, clamped. */
function tint(color: number, r: number, g: number, b: number): number {
	const clamp = (v: number) => Math.max(0, Math.min(255, v));
	return (clamp(((color >> 16) & 0xff) + r) << 16) | (clamp(((color >> 8) & 0xff) + g) << 8) | clamp((color & 0xff) + b);
}
