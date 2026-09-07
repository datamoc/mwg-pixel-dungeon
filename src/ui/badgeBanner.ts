import { Container, Rectangle, Sprite, Texture } from 'pixi.js';

const SIZE = 16;
const COLS = 8;
const DEFAULT_SCALE = 3;
const FADE_IN_TIME = 0.25;
const STATIC_TIME = 1;
const FADE_OUT_TIME = 1.75;

interface Banner {
	sprite: Sprite;
	state: 'in' | 'static' | 'out';
	time: number;
}

/**
 * `effects/BadgeBanner.java`: a badge icon that pops in oversized, holds, then fades - cut
 * from `interfaces/badges.png`'s real 16x16/8-column grid (`Badges.Badge.image`-indexed,
 * `TextureFilm(texture, 16, 16)`, row-major) at the real `DEFAULT_SCALE = 3` and the real
 * `FADE_IN_TIME`/`STATIC_TIME`/`FADE_OUT_TIME` (0.25s/1s/1.75s). Simplified: Java anchors the
 * banner to the hero's world position and lets several overlap there; this port shows one at
 * a fixed screen position (top-centre of the HUD) and queues a second behind the first rather
 * than overlapping, since there is no on-screen hero sprite position to anchor to that reads
 * well as a HUD element. The per-badge pixel-scanned "shine" highlight (`BadgeBanner.highlight`)
 * is not reproduced - a minor sparkle detail, not the badge's identity.
 */
export class BadgeBannerLayer extends Container {
	private readonly texture: Texture;
	private current: Banner | null = null;
	private queue: number[] = [];

	constructor(badgesTexture: Texture) {
		super();
		this.texture = badgesTexture;
	}

	show(index: number): void {
		if (this.current) {
			this.queue.push(index);
			return;
		}
		this.start(index);
	}

	private start(index: number): void {
		const col = index % COLS;
		const row = Math.floor(index / COLS);
		const sprite = new Sprite(
			new Texture({ source: this.texture.source, frame: new Rectangle(col * SIZE, row * SIZE, SIZE, SIZE) })
		);
		sprite.anchor.set(0.5);
		sprite.alpha = 0;
		sprite.scale.set(2 * DEFAULT_SCALE);
		this.addChild(sprite);
		this.current = { sprite, state: 'in', time: FADE_IN_TIME };
	}

	update(dt: number): void {
		const banner = this.current;
		if (!banner) return;

		banner.time -= dt;
		if (banner.time >= 0) {
			if (banner.state === 'in') {
				const p = banner.time / FADE_IN_TIME;
				banner.sprite.scale.set((1 + p) * DEFAULT_SCALE);
				banner.sprite.alpha = 1 - p;
			} else if (banner.state === 'out') {
				banner.sprite.alpha = banner.time / FADE_OUT_TIME;
			}
			return;
		}

		if (banner.state === 'in') {
			banner.state = 'static';
			banner.time = STATIC_TIME;
			banner.sprite.scale.set(DEFAULT_SCALE);
			banner.sprite.alpha = 1;
		} else if (banner.state === 'static') {
			banner.state = 'out';
			banner.time = FADE_OUT_TIME;
		} else {
			banner.sprite.destroy();
			this.current = null;
			const next = this.queue.shift();
			if (next !== undefined) this.start(next);
		}
	}

	resize(width: number, _height: number): void {
		this.x = width / 2;
		this.y = 48;
	}
}
