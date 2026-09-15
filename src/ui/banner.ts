import { TintedSprite } from 'mwg';
import type { Texture2D } from 'mwg/two-d/render';
import { showBannerState, stepBannerState, type BannerState } from './bannerState';

/**
 * The most of the machine Java's raw frame delta this widget will apply in one `update()`.
 *
 * Java hands `Banner.update()` `Game.elapsed` unfiltered, which is only ever fine because its
 * frames are ~16ms: `STATIC` never writes alpha, so the strength the *last* fade-in frame left
 * (`1 - p`) is what the band holds for its whole hold phase. This port arms the boss band in the
 * same frame that it builds the next floor synchronously, so that first delta was measured at
 * 233ms - a 0.3s fade-in arrived at STATIC already frozen at alpha 0.78, visibly transparent
 * where Java's sits at ~0.99. Clamping the step costs nothing when frames are normal (20fps is
 * never reached in practice, and a slower fade is invisible next to a stall) and leaves the
 * residual at one normal frame's worth, which is exactly Java's own situation.
 */
const MAX_STEP = 1 / 20;

/**
 * `ui/Banner.java` (tag `v3.3.8`), translated - the boss-slain / game-over text band that tints
 * in, holds, and fades out. The FADE_IN/STATIC/FADE_OUT timing is `bannerState.ts`'s exact
 * translation; this is only the sprite it drives: `TintedSprite.lerpTint(color, strength)` is
 * watabou's `Visual.tint(int, float)` and `resetColor()` is `Visual.resetColor()`, so the three
 * phases map one to one. Like Java (`new Banner(sample)` then `show(...)`), construction only
 * stages the art (invisible, centered anchor - the scene positions it); `show` arms the machine.
 * A spent FADE_OUT removes and destroys the sprite, Java's `killAndErase()`.
 */
export class Banner extends TintedSprite {
	private banner: BannerState | null = null;
	private fadeTime = 0;
	private color = 0xffffff;

	constructor(texture: Texture2D) {
		super(texture);
		this.anchor.set(0.5, 0.5);
		this.alpha = 0;
	}

	show(color: number, fadeTime: number, showTime = Infinity): void {
		this.color = color;
		this.fadeTime = fadeTime;
		this.banner = showBannerState(fadeTime, showTime);
	}

	get showing(): boolean {
		return this.banner !== null;
	}

	update(dt: number): void {
		if (!this.banner) return;
		const frame = stepBannerState(this.banner, Math.min(dt, MAX_STEP), this.fadeTime);
		this.banner = frame.dead ? null : frame.state;
		if (frame.alpha !== null) this.alpha = frame.alpha;
		if (frame.tint === 'reset') this.resetColor();
		else this.lerpTint(this.color, frame.tint);
		if (frame.dead) {
			this.parent?.removeChild(this);
			this.destroy();
		}
	}
}
