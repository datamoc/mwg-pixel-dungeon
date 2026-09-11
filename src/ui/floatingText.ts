import { Container } from 'pixi.js';
import { Label } from 'mwg';

/**
 * Text that rises off a point in the world and fades out - damage numbers, "search",
 * "blocked", a buff's name as it lands.
 *
 * GENERIC - nothing here knows about SPD. Written game-agnostically (a world point, a
 * string, a colour) so it could sit in `mwg/ui` - but not the same thing as `mwg/ui`'s own
 * `FloatingText`: that class fades *linearly* over its whole lifetime and has no per-target
 * stacking, so it does not reproduce the real Java curve below - the two are siblings, not a
 * drop-in replacement for one another. This one belongs in `mwg/ui` if that `FloatingText` ever
 * grows the hold-then-fade curve and the stacking. See PORT_COVERAGE.md's "UI and
 * presentation" table.
 *
 * `effects/FloatingText.java`'s real numbers: `LIFESPAN = 1f` second, `DISTANCE =
 * DungeonTilemap.SIZE` (one tile) of rise over that second, and alpha held at 1 for the
 * first half of the life then falling linearly (`alpha(p > 0.5f ? 1 : p * 2)`).
 *
 * Java stacks texts that share a `key` so several numbers on one creature in one turn do
 * not overprint (`FloatingText.push`). That is reproduced here by nudging a new text up
 * past any live text still close to the same spot, which needs no key bookkeeping from the
 * caller - a stated simplification, since Java's version stacks strictly per-target while
 * this one stacks by proximity.
 */
const LIFESPAN = 1;
/** one tile of rise, SPD's `DungeonTilemap.SIZE` */
const DISTANCE = 16;

interface Floater {
	label: Label;
	timeLeft: number;
	x: number;
	y: number;
}

export class FloatingTextLayer extends Container {
	private live: Floater[] = [];
	private textScale: number;
	private fontSize: number;

	/**
	 * @param textScale how much to shrink each label, for a layer living in world space
	 *   under a zoomed camera. Pass `1 / zoom` to get text drawn at screen resolution but
	 *   positioned in the world, which is what `FloatingText`'s own
	 *   `zoom(1/PixelScene.defaultZoom)` achieves. Defaults to 1, i.e. a screen-space layer.
	 * @param fontSize the on-screen size the text should end up at
	 */
	constructor(textScale = 1, fontSize = 8) {
		super();
		this.textScale = textScale;
		this.fontSize = fontSize;
	}

	/**
	 * @param x world x of the point the text rises from
	 * @param y world y
	 */
	show(x: number, y: number, text: string, color: number): void {
		//rendered at full size then scaled down, never the other way round: Pixi rasterises
		//text once at its style size, and scaling a small raster up is what looks blurry
		const label = new Label({ text, color, size: this.fontSize / this.textScale });
		label.scale.set(this.textScale);
		//centred over the point and sitting just above it, as reset() does with
		//`x - width/2` and `y - height()`
		label.anchor.set(0.5, 1);

		let top = y;
		//keep clear of anything still floating near this spot, standing in for Java's
		//per-target stacking
		for (const other of this.live) {
			if (Math.abs(other.x - x) < 12 && Math.abs(other.y - top) < 10) top = other.y - 9;
		}

		label.x = x;
		label.y = top;
		this.addChild(label);
		this.live.push({ label, timeLeft: LIFESPAN, x, y: top });
	}

	update(dt: number): void {
		for (let i = this.live.length - 1; i >= 0; i--) {
			const floater = this.live[i];
			floater.timeLeft -= dt;
			if (floater.timeLeft <= 0) {
				floater.label.destroy();
				this.live.splice(i, 1);
				continue;
			}
			const remaining = floater.timeLeft / LIFESPAN;
			floater.label.alpha = remaining > 0.5 ? 1 : remaining * 2;
			floater.label.y -= (DISTANCE / LIFESPAN) * dt;
		}
	}

	/** drops every live text, for a floor change */
	clear(): void {
		for (const floater of this.live) floater.label.destroy();
		this.live = [];
	}
}
