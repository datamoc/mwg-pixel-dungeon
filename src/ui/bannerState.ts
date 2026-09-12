/**
 * `ui/Banner.java`'s FADE_IN/STATIC/FADE_OUT state machine (tag `v3.3.8`), translated - values
 * and transitions only, no rendering, so the timing is testable headlessly (see
 * `tools/verifyBanner.mjs`) while `ui/banner.ts` owns the one `TintedSprite` it drives.
 *
 * Java's shape, kept exactly: `show(color, fadeTime, showTime)` arms FADE_IN with
 * `time = fadeTime`; each update subtracts the elapsed time and, while `time >= 0`, reports
 * `p = time / fadeTime` - FADE_IN tints toward the color with strength `p` while alpha runs
 * `1 - p`, STATIC resets the tint and holds alpha, FADE_OUT resets the tint while alpha runs
 * `p`. When `time` drops below zero the phase advances (FADE_IN takes `showTime`, STATIC takes
 * `fadeTime`) and a spent FADE_OUT kills the banner. `show(color, fadeTime)` without a hold is
 * the infinite case (`Float.MAX_VALUE` in Java, `Infinity` here) - the GAME_OVER banner.
 */
export type BannerPhase = 'fadeIn' | 'static' | 'fadeOut';

export interface BannerState {
	readonly phase: BannerPhase;
	readonly timeLeft: number;
	readonly showTime: number;
}

export interface BannerFrame {
	readonly state: BannerState;
	/** null keeps the current alpha (STATIC holds whatever FADE_IN left). */
	readonly alpha: number | null;
	/** strength for the tint, or 'reset' for Java's `resetColor()`. */
	readonly tint: number | 'reset';
	readonly dead: boolean;
}

export function showBannerState(fadeTime: number, showTime = Infinity): BannerState {
	return { phase: 'fadeIn', timeLeft: fadeTime, showTime };
}

export function stepBannerState(state: BannerState, dt: number, fadeTime: number): BannerFrame {
	const time = state.timeLeft - dt;
	if (time >= 0) {
		const p = time / fadeTime;
		switch (state.phase) {
			case 'fadeIn':
				return { state: { ...state, timeLeft: time }, alpha: 1 - p, tint: p, dead: false };
			case 'static':
				return { state: { ...state, timeLeft: time }, alpha: null, tint: 'reset', dead: false };
			case 'fadeOut':
				return { state: { ...state, timeLeft: time }, alpha: p, tint: 'reset', dead: false };
		}
	}
	switch (state.phase) {
		case 'fadeIn':
				return { state: { ...state, phase: 'static', timeLeft: state.showTime }, alpha: null, tint: 'reset', dead: false };
		case 'static':
			return { state: { ...state, phase: 'fadeOut', timeLeft: fadeTime }, alpha: null, tint: 'reset', dead: false };
		case 'fadeOut':
			return { state, alpha: null, tint: 'reset', dead: true };
	}
}
