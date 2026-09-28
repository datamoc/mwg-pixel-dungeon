import { Container, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Label } from 'mwg';
import { APP_VERSION, runState } from '../runState';
import { hudZoom } from './interfaceMode';

export interface DungeonHudState {
	place: string;
	depth: number;
	keys: { iron: number; golden: number; crystal: number };
}

/** `Icons.DEPTH` (`uvRectBySize(32, 80, 6, 7)`), located in this port's repacked `ui_icons.png` (`tools/scratch/icons-match.mjs`). */
const DEPTH_ICON = new Rectangle(48, 64, 6, 7);
const TEXT_COLOR = 0xcacfc2;

/**
 * `ui/MenuPane.java` (tag `v3.3.8`): the 31x21 pane in the top-right corner - the version on its top
 * strip, the journal button (a key counter instead of the journal glyph while keys are carried) and
 * the menu button below it, and the depth icon with the floor number to the pane's left. Laid out
 * in Java's native pixels and scaled like the rest of this port's HUD.
 *
 * Not ported (`PORT_COVERAGE.md`): the level-feeling variants of the depth icon (only the plain
 * `DEPTH` one), the `challengeIcon` counter, the `DangerIndicator`, the `PickedUpItem` fly-in,
 * the journal button's page-flash, and the version overflow strip (the version is short enough not
 * to overflow at the pane's width). The key counter draws this port's key item sprites in place of
 * Java's `KeyDisplay` glyphs.
 */
export class DungeonHud extends Container {
	static readonly WIDTH = 31;
	private readonly art = new Container();
	private readonly keyTexture: Texture;
	private readonly journalBg: Sprite;
	private readonly journalIcon: Sprite;
	private readonly keys = new Container();
	private readonly depthText: Label;
	private readonly depthIcon: Sprite;

	constructor(onMenu: () => void, onJournal: () => void) {
		super();
		const pane = runState.sprites.uiMenuPane;
		const buttons = runState.sprites.uiMenuButton;
		this.keyTexture = runState.sprites.items;
		const cut = (source: Texture, x: number, y: number, w: number, h: number) => new Texture({ source: source.source, frame: new Rectangle(x, y, w, h) });
		this.addChild(this.art);
		this.art.addChild(new Sprite(cut(pane, 1, 0, 31, 21)));

		const version = new Label({ text: `v${APP_VERSION}`, size: 4.5, color: TEXT_COLOR, resolution: 8, roundPixels: true });
		version.position.set(3, 3 - version.height / 2);
		this.art.addChild(version);

		//`MenuButton`: 12x11 at (2, 8) inside a 16-wide button that sits at the pane's right edge.
		const menu = new Container();
		const menuImage = new Sprite(cut(buttons, 17, 2, 12, 11));
		menuImage.position.set(2, 8);
		menu.addChild(menuImage);
		menu.position.set(DungeonHud.WIDTH - 16, 0);
		this.press(menu, menuImage, onMenu);
		this.art.addChild(menu);

		//`JournalButton`: 13x11 at (2, 8) inside a 17-wide button placed 2px into the menu button.
		const journal = new Container();
		this.journalBg = new Sprite(cut(buttons, 2, 2, 13, 11));
		this.journalBg.position.set(2, 8);
		this.journalIcon = new Sprite(cut(buttons, 31, 0, 11, 6));
		this.journalIcon.position.set(2 + Math.floor((13 - 11) / 2), 8 + Math.floor((11 - 6) / 2));
		this.keys.position.set(3, 9);
		journal.addChild(this.journalBg, this.journalIcon, this.keys);
		journal.position.set(menu.x - 17 + 2, 0);
		this.press(journal, this.journalBg, onJournal);
		this.art.addChild(journal);

		//Depth icon left of the journal button; the number below it at Java's 0.67 scale (6px on the 9px pixel font).
		const depthX = journal.x - 7 + (7 - 6) / 2;
		const icon = new Sprite(cut(runState.sprites.uiIcons, DEPTH_ICON.x, DEPTH_ICON.y, DEPTH_ICON.width, DEPTH_ICON.height));
		icon.position.set(depthX, 8);
		this.depthText = new Label({ text: '1', size: 6, color: TEXT_COLOR, resolution: 8, roundPixels: true });
		this.art.addChild(icon, this.depthText);
		this.depthIcon = icon;
	}

	/** `onPointerDown` brightens the button image to 1.5x; a tap runs `onClick`. */
	private press(button: Container, image: Sprite, onClick: () => void): void {
		button.eventMode = 'static';
		button.cursor = 'pointer';
		button.hitArea = new Rectangle(0, 8, 17, 11);
		button.on('pointerdown', () => { image.tint = 0xdddddd; });
		const release = () => { image.tint = 0xffffff; };
		button.on('pointerup', release);
		button.on('pointerupoutside', release);
		button.on('pointertap', onClick);
	}

	update(state: DungeonHudState): void {
		this.depthText.setText(String(state.depth));
		this.depthText.position.set(this.depthIcon.x + (6 - this.depthText.width) / 2, this.depthIcon.y + 7);
		this.keys.removeChildren().forEach((child) => child.destroy({ children: true }));
		const carried: [number, number][] = [[55, state.keys.crystal], [56, state.keys.golden], [57, state.keys.iron]];
		const first = carried.find(([, count]) => count > 0);
		this.journalIcon.visible = !first;
		if (!first) return;
		//`JournalButton.updateKeyDisplay()`: the button darkens a little per carried key, up to six.
		const total = state.keys.iron + state.keys.golden + state.keys.crystal;
		const shade = Math.round((0.8 - Math.min(6, total) / 20) * 255);
		this.journalBg.tint = (shade << 16) | (shade << 8) | shade;
		const [frame] = first;
		const icon = new Sprite(new Texture({ source: this.keyTexture.source, frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) }));
		icon.scale.set(0.5);
		icon.position.set(1, 0);
		this.keys.addChild(icon);
		if (total > 1) {
			const label = new Label({ text: String(total), size: 4.5, color: 0xffffff, resolution: 8, roundPixels: true });
			label.position.set(8, 3);
			this.keys.addChild(label);
		}
	}

	layout(width: number, height: number): void {
		const zoom = hudZoom(width, height);
		this.scale.set(zoom);
		this.position.set(Math.floor(width - DungeonHud.WIDTH * zoom), 0);
	}
}
