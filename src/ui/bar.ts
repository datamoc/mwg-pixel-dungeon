import { Container, Sprite, Texture } from 'pixi.js';

/**
 * A horizontal fill meter: a background strip with a coloured strip drawn over a fraction
 * of it.
 *
 * GENERIC - nothing here knows about SPD, and most of it is now duplication: `mwg/ui`'s `Bar`
 * ships `fillTexture` (art stretched to the filled width, the way Java's `StatusPane` stretches
 * with `scale.x`) and `roundUpToPixel` (`HealthBar.layout()`'s ceil-to-whole-pixel rounding,
 * covered by the framework's own `tests/bar.test.ts`) - the two things this file was originally
 * kept for, so the earlier claim that `mwg`'s `Bar` had neither was true of an older release only.
 * Two capabilities it still lacks, and this file uses both: recolouring the fill after
 * construction (the boss bar goes red while the boss bleeds) and a track colour (the HP bar's
 * missing-health strip is black, not the theme's panel fill). That pair is proposed as
 * `tools/scratch/mwg-proposal/0002-bar-runtime-colour-and-track.patch`; with it applied this file
 * is just `setValue`, which is why ROADMAP.md schedules its deletion.
 *
 * `SPD-classes`' own `ColorBlock` is a solid rectangle, which is what `HealthBar.java` uses;
 * a texture may be given instead so `StatusPane`'s real bar art can be stretched the way
 * Java stretches it with `scale.x`.
 */
export interface BarOptions {
	width: number;
	height: number;
	/** the fill's texture; a plain white pixel tinted by `fillColor` when omitted */
	fill?: Texture;
	/** the strip behind the fill; omit for no background */
	background?: Texture;
	fillColor?: number;
	backgroundColor?: number;
}

export class Bar extends Container {
	private bg: Sprite | null = null;
	private bar: Sprite;
	private barWidth: number;
	private barHeight: number;
	private level = 1;

	constructor(options: BarOptions) {
		super();

		this.barWidth = options.width;
		this.barHeight = options.height;

		if (options.background || options.backgroundColor !== undefined) {
			this.bg = new Sprite(options.background ?? Texture.WHITE);
			this.bg.width = this.barWidth;
			this.bg.height = this.barHeight;
			if (options.backgroundColor !== undefined) this.bg.tint = options.backgroundColor;
			this.addChild(this.bg);
		}

		this.bar = new Sprite(options.fill ?? Texture.WHITE);
		this.bar.width = this.barWidth;
		this.bar.height = this.barHeight;
		if (options.fillColor !== undefined) this.bar.tint = options.fillColor;
		this.addChild(this.bar);
	}

	/**
	 * Sets the fill, 0 to 1.
	 *
	 * `HealthBar.layout()` rounds the fill up to the next whole screen pixel, so a sliver of
	 * health never disappears entirely into a sub-pixel; the same rounding is applied here,
	 * against the bar's own width in pixels.
	 */
	setLevel(fraction: number): void {
		const clamped = Math.max(0, Math.min(1, fraction));
		if (clamped === this.level) return;
		this.level = clamped;
		this.bar.width = this.barWidth * (Math.ceil(clamped * this.barWidth) / this.barWidth);
		this.bar.visible = clamped > 0;
	}

	/** re-tints the fill strip, e.g. a low-HP warning colour */
	setFillColor(color: number): void {
		this.bar.tint = color;
	}

	/** resizes the whole meter, keeping the current fill */
	resize(width: number, height: number): void {
		this.barWidth = width;
		this.barHeight = height;
		if (this.bg) {
			this.bg.width = width;
			this.bg.height = height;
		}
		this.bar.height = height;
		const level = this.level;
		this.level = -1;
		this.setLevel(level);
	}
}
