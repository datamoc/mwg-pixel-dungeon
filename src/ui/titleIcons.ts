import { Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';

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
	//`WndGame`'s two remaining entries, `Icons.CHALLENGE_COLOR` (Java 144,32,15,12) and `DISPLAY`'s
	//own portrait/landscape pair (Java 16,16,12,16 and 32,16,16,12, the one Java picks by
	//orientation). This sheet is hand-packed rather than a density copy of Java's, so these three
	//were located by template-matching their art against `interfaces/icons.png` at tag `v3.3.8`
	//rather than by shifting Java's numbers (`tools/scratch/icons-match.mjs`).
	challenge: [160, 32, 15, 12],
	displayPort: [16, 32, 12, 16],
	displayLand: [32, 32, 16, 12],
	//`WndSettings`' tab icons and checkbox art, located the same way (template match
	//against `interfaces/icons.png` at tag `v3.3.8`): this sheet carries Java's
	//second row at y=32 instead of y=16 and its third row at y=48 instead of y=32,
	//so every region below is Java's coordinates shifted down one row. Same-row
	//neighbours never overlap (displayPort 16-28, displayLand 32-48, data 48-62,
	//audio 64-78, langs 80-94, controller 96-112, keyboard 112-127).
	data: [48, 32, 14, 15],
	audio: [64, 32, 14, 14],
	controller: [96, 32, 16, 12],
	keyboard: [112, 32, 15, 12],
	unchecked: [0, 48, 12, 12],
	checked: [16, 48, 12, 12],
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
