import { Container, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Toast } from 'mwg/two-d/ui';

const SIZE = 16;
const COLS = 8;
const DEFAULT_SCALE = 3;

/**
 * `effects/BadgeBanner.java`: a badge icon that pops in oversized, holds, then fades - cut
 * from `interfaces/badges.png`'s real 16x16/8-column grid (`Badges.Badge.image`-indexed,
 * `TextureFilm(texture, 16, 16)`, row-major) at the real `DEFAULT_SCALE = 3`. The
 * pop/hold/fade timing and the show-while-busy queue come from the framework's `Toast`
 * (owned, not extended - its `show` takes content, this layer's takes a badge index),
 * whose defaults are exactly Java's `FADE_IN_TIME`/`STATIC_TIME`/`FADE_OUT_TIME`
 * (0.25s/1s/1.75s) and `scaleFrom` 2. Two stated simplifications stay: the banner shows
 * at a fixed screen position (top-centre of the HUD) with a second queued behind the
 * first rather than overlapping at the hero's world position, and the per-badge
 * pixel-scanned "shine" highlight (`BadgeBanner.highlight`) is not reproduced. One
 * micro-difference is accepted: the pop eases out cubic where Java scales linearly.
 */
export class BadgeBannerLayer extends Container {
	private readonly texture: Texture;
	private readonly toast = new Toast();

	constructor(badgesTexture: Texture) {
		super();
		this.texture = badgesTexture;
		this.addChild(this.toast);
	}

	show(index: number): void {
		const col = index % COLS;
		const row = Math.floor(index / COLS);
		const sprite = new Sprite(
			new Texture({ source: this.texture.source, frame: new Rectangle(col * SIZE, row * SIZE, SIZE, SIZE) })
		);
		sprite.anchor.set(0.5);
		//`Toast` drives its content's own scale from 2x down to 1, so the badge's
		//own scale lives on the sprite inside - the same 96px-to-48px pop-in Java
		//draws. (A scaled holder would be overwritten by `Toast.start`.)
		sprite.scale.set(DEFAULT_SCALE);
		const holder = new Container();
		holder.addChild(sprite);
		this.toast.show(holder);
	}

	update(dt: number): void {
		this.toast.update(dt);
	}

	resize(width: number, _height: number): void {
		this.x = width / 2;
		this.y = 48;
	}
}
