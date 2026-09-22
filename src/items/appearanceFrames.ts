/**
 * Per-appearance inventory frames for potions and scrolls.
 *
 * Java (`Potion.reset()`/`Scroll.reset()`, tag `v3.3.8` - and identically in this
 * checkout's older tree) sets `image = handler.image(this)`: the shuffled appearance's
 * own sprite, whether the kind is identified or not. Only the *name* changes on
 * identify (the colour/rune word vs the true name); the sprite never does. So every
 * potion always wears its own colour and every scroll its own rune - never one shared
 * family icon.
 *
 * `ItemStatusHandler` deals each class a *label* per run and looks the image up in the
 * fixed label→image maps (`Potion.colors`, `Scroll.runes`): the label, not the deal
 * order, decides the sprite. The port's `Appearances` deals the same way and exposes
 * the dealt label via `appearanceOf`, so the frame here is the sheet base plus the
 * label's Java offset. The bases are `ItemSpriteSheet`'s own rows (`POTIONS = xy(1,22)`
 * = 336, `SCROLLS = xy(1,19)` = 288 - `xy` is 1-based, `(x-1) + 16*(y-1)`), read off
 * the bundled `items.png` itself: its 336 row holds the twelve round flasks and its
 * 288 row the twelve runed scrolls (352/304 hold the darker exotic rows - a fencepost
 * here once read 353/305, dressing every normal potion and scroll in exotic art).
 */
export const POTION_SHEET_BASE = 336;
export const SCROLL_SHEET_BASE = 288;

/** `Potion.colors` label→image offsets (`POTION_CRIMSON = POTIONS+0` … `POTION_IVORY = POTIONS+11`). */
const POTION_IMAGE_OFFSET: Readonly<Record<string, number>> = {
	crimson: 0,
	amber: 1,
	golden: 2,
	jade: 3,
	turquoise: 4,
	azure: 5,
	indigo: 6,
	magenta: 7,
	bistre: 8,
	charcoal: 9,
	silver: 10,
	ivory: 11,
};

/** `Scroll.runes` label→image offsets (`SCROLL_KAUNAN = SCROLLS+0` … `SCROLL_TIWAZ = SCROLLS+11`). */
const SCROLL_IMAGE_OFFSET: Readonly<Record<string, number>> = {
	kaunan: 0,
	sowilo: 1,
	laguz: 2,
	yngvi: 3,
	gyfu: 4,
	raido: 5,
	isaz: 6,
	mannaz: 7,
	naudiz: 8,
	berkanan: 9,
	odal: 10,
	tiwaz: 11,
};

/**
 * The `items.png` frame for a potion/scroll appearance label key
 * (`appearanceOf` returns the full key, e.g. `items.potions.potion.turquoise` -
 * only its last segment matters), or `undefined` for an unknown label so the
 * caller keeps its generic family frame instead of crashing the bag.
 */
export function appearanceItemFrame(category: 'potion' | 'scroll', labelKey: string): number | undefined {
	const label = labelKey.split('.').at(-1) ?? '';
	const offset = category === 'potion' ? POTION_IMAGE_OFFSET[label] : SCROLL_IMAGE_OFFSET[label];
	if (offset === undefined) return undefined;
	return (category === 'potion' ? POTION_SHEET_BASE : SCROLL_SHEET_BASE) + offset;
}
