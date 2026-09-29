import type { Container } from 'pixi.js';
import type { WindowStack } from 'mwg';
import { fitWindowZoom, sharpenText } from 'mwg/two-d/ui';
import { menuScale } from './spdButton';

/**
 * The window stack's base zoom: the PixelScene integer `menuScale`, capped at 2. At 3x a window
 * is Java's own size on a desktop, but read as oversized on a large canvas; 2x keeps its 6-9 px
 * text legible (12-18 px) without filling the screen.
 */
export const windowBaseZoom = (width: number, height: number): number => Math.min(2, menuScale(width, height));

let sharpenFrame = 0;
/** `sharpenText` over several UI roots, every 10th frame - their scale changes on layout, not per frame. */
export function sharpenUi(roots: readonly (Container | undefined)[]): void {
	if (++sharpenFrame % 10 !== 0) return;
	for (const root of roots) if (root) sharpenText(root, globalThis.devicePixelRatio || 1);
}

/** One per-frame pass over a scaled window stack: fit its zoom to the top window and keep its text crisp. */
export function tuneWindowStack(stack: WindowStack, base: number, zoom: number, viewportHeight: number, apply: (zoom: number) => void): void {
	const fit = fitWindowZoom(base, stack.top?.getLocalBounds().height ?? 0, viewportHeight);
	if (fit !== zoom) apply(fit);
	if (!stack.isEmpty) sharpenText(stack, globalThis.devicePixelRatio || 1);
}
