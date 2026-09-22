/**
 * Ctrl+wheel zoom direction: MWG reports the browser wheel delta with
 * `delta > 0` scrolling down/out, so a downward roll steps the zoom offset
 * down (zoom out, like the `zoomOut` action) and an upward roll steps it up.
 * Zero/NaN deltas (synthetic events) step nowhere. Pure so the suite can pin
 * the mapping without input hardware.
 */
export function wheelZoomStep(delta: number): -1 | 0 | 1 {
	if (!(delta > 0) && !(delta < 0)) return 0;
	return delta > 0 ? -1 : 1;
}
