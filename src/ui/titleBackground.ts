import { Container, FillGradient, Graphics, TilingSprite, type Texture } from 'pixi.js';

/**
 * `Archs.java`'s title-screen background: two vertically-tiled arch textures
 * (`interfaces/arcs1.png` behind, `interfaces/arcs2.png` in front) scrolling at
 * `SCROLL_SPEED = 20` px/s, the foreground at twice the background's rate
 * (`arcsFg.offset(0, shift*2)`), plus a dark overlay that fades in toward the bottom edge.
 * Java builds that overlay by rotating a 1px vertical gradient `Image` 90 degrees and
 * scaling it across the screen; this port draws the same five stops (alpha
 * `0x00/0x22/0x55/0x99/0xEE`, `TextureCache.createGradient`'s own values) directly as a
 * vertical `FillGradient`, a purely mechanical simplification - same pixels, no rotated
 * intermediate image.
 */
export class TitleBackground extends Container {
	private static readonly SCROLL_SPEED = 20;

	private readonly bg: TilingSprite;
	private readonly fg: TilingSprite;
	private readonly vignette = new Graphics();

	constructor(bgTexture: Texture, fgTexture: Texture) {
		super();
		this.bg = new TilingSprite({ texture: bgTexture, width: 1, height: 1 });
		this.fg = new TilingSprite({ texture: fgTexture, width: 1, height: 1 });
		this.addChild(this.bg, this.fg, this.vignette);
	}

	resize(width: number, height: number): void {
		this.bg.width = width;
		this.bg.height = height;
		this.fg.width = width;
		this.fg.height = height;
		this.vignette.clear();
		this.vignette.rect(0, 0, width, height).fill(
			new FillGradient({
				type: 'linear',
				start: { x: 0, y: 0 },
				end: { x: 0, y: 1 },
				textureSpace: 'local',
				colorStops: [
					{ offset: 0, color: 'rgba(0,0,0,0)' },
					{ offset: 0.25, color: 'rgba(0,0,0,0.133)' },
					{ offset: 0.5, color: 'rgba(0,0,0,0.333)' },
					{ offset: 0.75, color: 'rgba(0,0,0,0.6)' },
					{ offset: 1, color: 'rgba(0,0,0,0.933)' },
				],
			}),
		);
	}

	update(dt: number): void {
		const shift = dt * TitleBackground.SCROLL_SPEED;
		this.bg.tilePosition.y += shift;
		this.fg.tilePosition.y += shift * 2;
	}
}
