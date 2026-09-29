import { Container, Graphics, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Label, Window } from 'mwg';
import { runState } from '../runState';
import { t } from '../i18n';
import { SpdRedButton } from './spdButton';
import { SPD_TITLE_COLOR } from './spdTheme';
import { talentIconIndex } from './talentIconIndex';

/**
 * `ui/TalentButton.java`, `ui/TalentIcon.java`, `ui/TalentsPane.TalentTierPane` and
 * `windows/WndInfoTalent.java` (tag `v3.3.8`), in Java's native pixels.
 *
 * A talent is a 20x26 tile: `talent_button.png` cut at `x = 20 * (maxPoints - 1)` (the frame carries one
 * pip per possible point), its 16x16 `talent_icons.png` cell 2px in, and a yellow fill under the icon of
 * `points / maxPoints * 16` width. A tier pane is the tier title with one star per talent point of that
 * tier and the tiles spread evenly on one row (`gap = (width - n * 20) / (n + 1)`). Tapping a tile opens
 * `WndInfoTalent` - icon, title (`+points` once ranked), the description and, while a point can be spent,
 * an "Upgrade Talent" red button; the point is spent only from that button.
 *
 * Simplified (`PORT_COVERAGE.md`): the port keeps its own T1-T4 tabs instead of Java's one scrolling column of
 * every unlocked tier, stars are drawn as small plus shapes rather than `Speck.STAR`, the upgrade has no
 * star burst or level-up sound, and the random-talent shuffle button is not ported.
 */
export const TALENT_TILE_W = 20;
export const TALENT_TILE_H = 26;

export interface TalentTile {
	readonly id: string;
	readonly title: string;
	readonly rank: number;
	readonly max: number;
}

const cut = (source: Texture, x: number, y: number, w: number, h: number): Texture =>
	new Texture({ source: source.source, frame: new Rectangle(x, y, w, h) });

/** `TalentIcon`: the 16x16 cell of `talent_icons.png` (32 per row), or nothing for an id Java has no icon for. */
export function talentIconSprite(id: string): Sprite | null {
	const index = talentIconIndex(id);
	if (index === undefined) return null;
	return new Sprite(cut(runState.sprites.uiTalentIcons, (index % 32) * 16, Math.floor(index / 32) * 16, 16, 16));
}

/** One `TalentButton`. */
export function talentTile(tile: TalentTile, onClick: () => void): Container {
	const button = new Container();
	const bg = new Sprite(cut(runState.sprites.uiTalentButton, 20 * (tile.max - 1), 0, TALENT_TILE_W, TALENT_TILE_H));
	const fill = new Graphics().rect(2, TALENT_TILE_W - 1, (tile.rank / tile.max) * (TALENT_TILE_W - 4), 5).fill({ color: 0xffff44 });
	const icon = talentIconSprite(tile.id);
	button.addChild(fill, bg);
	if (icon) { icon.position.set(2, 2); button.addChild(icon); }
	button.eventMode = 'static';
	button.cursor = 'pointer';
	//`onPointerDown` brightens the icon and background to 1.5x.
	button.on('pointerdown', () => { bg.tint = 0xdddddd; if (icon) icon.tint = 0xdddddd; });
	const release = () => { bg.tint = 0xffffff; if (icon) icon.tint = 0xffffff; };
	button.on('pointerup', release);
	button.on('pointerupoutside', release);
	button.on('pointertap', onClick);
	return button;
}

/** A 5x5 plus-shaped star, standing in for `Speck.STAR`. */
function star(color: number, alpha: number): Graphics {
	return new Graphics().rect(2, 0, 1, 5).rect(0, 2, 5, 1).fill({ color, alpha });
}

export interface TalentTierPaneSpec {
	readonly tier: number;
	readonly tiles: readonly TalentTile[];
	readonly width: number;
	/** `Hero.talentPointsAvailable(tier)` and the points already spent in the tier. */
	readonly open: number;
	readonly spent: number;
	readonly onSelect: (id: string) => void;
}

/** `TalentsPane.TalentTierPane`: title, stars, then the tile row; returns the pane and its height. */
export function talentTierPane(spec: TalentTierPaneSpec): { pane: Container; height: number } {
	const pane = new Container();
	const heading = t('ui.talentspane.tier', { 0: spec.tier });
	const title = new Label({ text: heading.charAt(0).toUpperCase() + heading.slice(1), size: 9, color: SPD_TITLE_COLOR, resolution: 6, roundPixels: true });
	const total = spec.open + spec.spent;
	const starsWidth = 2 + Math.min(total, 6) * 6;
	title.position.set(Math.round((spec.width - title.width - starsWidth) / 2), 0);
	pane.addChild(title);
	let left = title.x + title.width + 2;
	for (let i = 0; i < total; i++) {
		//`setupStars()`: open points stay white, spent ones grey.
		const s = i < spec.open ? star(0xffffff, 1) : star(0xbfbfbf, 0.9);
		s.position.set(left, Math.round((title.height - 5) / 2) + (i >= 6 ? 6 : 0));
		pane.addChild(s);
		left += 6;
		if (i === 5) left = title.x + title.width + 2;
	}
	const gap = (spec.width - spec.tiles.length * TALENT_TILE_W) / (spec.tiles.length + 1);
	let x = gap;
	const top = Math.round(title.height) + 4;
	for (const tile of spec.tiles) {
		const button = talentTile(tile, () => spec.onSelect(tile.id));
		button.position.set(Math.round(x), top);
		pane.addChild(button);
		x += TALENT_TILE_W + gap;
	}
	return { pane, height: top + TALENT_TILE_H };
}

export interface TalentInfoSpec {
	readonly id: string;
	readonly title: string;
	readonly rank: number;
	readonly description: string;
	/** Present while a point can be spent: the "Upgrade Talent" button's action. */
	readonly onUpgrade?: () => void;
}

/** `WndInfoTalent`: icon title bar, description, and the optional upgrade button. */
export function createTalentInfoWindow(spec: TalentInfoSpec): Window {
	const width = 120;
	const heading = spec.rank > 0 ? `${spec.title} +${spec.rank}` : spec.title;
	const window = new Window({ width: width + 12, height: 60, title: heading, anchor: 'center', blocker: true });
	const body = new Label({ text: spec.description, size: 6, wrapWidth: width, color: 0xffffff });
	const icon = talentIconSprite(spec.id);
	const iconRow = icon ? 20 : 0;
	if (icon) { icon.position.set(0, 0); window.content.addChild(icon); }
	body.position.set(0, iconRow + 2);
	window.content.addChild(body);
	let bottom = iconRow + 2 + Math.ceil(body.height);
	if (spec.onUpgrade) {
		const upgrade = new SpdRedButton({ width, height: 18, text: t('windows.wndinfotalent.upgrade'), onClick: () => { window.close(); spec.onUpgrade?.(); } });
		upgrade.position.set(0, bottom + 4);
		upgrade.eventMode = 'static';
		upgrade.cursor = 'pointer';
		window.content.addChild(upgrade);
		bottom += 4 + 18;
	}
	//`Window`'s height is outer: grow the frame by its own inset around the content, like the item picker does.
	window.resize(width + 12, 2 * (bottom + 6) - window.contentHeight);
	return window;
}
