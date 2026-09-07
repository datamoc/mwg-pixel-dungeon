import { Rectangle, Sprite, Texture } from 'pixi.js';

/**
 * Title-screen icons cut from `icons.png` (`Icons.java`'s cases): `ENTER`/`RANKINGS`/
 * `BADGES`/`NEWS`/`CHANGES`/`SHPX`/`PREFS`, all `uvRectBySize` at y=0, spacing for 17x16;
 * `LANGS` is a separate row (y=32) used for the language cycle button - it is SPD's own
 * language icon, not a per-language flag, since SPD itself has no flag art (a language is
 * not a country). `GOLD` and `PREFS` are used by Support and Settings.
 */
const REGIONS: Record<string, [x: number, y: number, w: number, h: number]> = {
	gold: [17, 0, 17, 16],
	bag: [112, 48, 16, 16],
	exit: [0, 32, 15, 11],
	enter: [0, 0, 16, 16],
	rankings: [34, 0, 17, 16],
	badges: [51, 0, 16, 16],
	news: [68, 0, 16, 15],
	changes: [85, 0, 15, 15],
	shpx: [119, 0, 16, 16],
	prefs: [102, 0, 14, 14],
	langs: [80, 32, 14, 11],
};

export type TitleIconName = keyof typeof REGIONS;

/** `SCALE = 2` matches every other piece of chrome cut from this sheet (`statusPane.ts`'s
 * buff icons, `compass.ts`'s arrow) rather than inventing a title-screen-specific factor. */
const SCALE = 2;

export function titleIcon(icons: Texture, name: TitleIconName, scale = SCALE): Sprite {
	const [x, y, w, h] = REGIONS[name];
	const sprite = new Sprite(new Texture({ source: icons.source, frame: new Rectangle(x, y, w, h) }));
	sprite.scale.set(scale);
	return sprite;
}
