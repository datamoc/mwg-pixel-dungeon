import type { Container } from 'pixi.js';
import type { WindowStack } from 'mwg';
import { menuScale } from './spdButton';

/**
 * The window stack's base zoom: the PixelScene integer `menuScale`, capped at 2. At 3x a window
 * is Java's own size on a desktop, but read as oversized on a large canvas; 2x keeps its 6-9 px
 * text legible (12-18 px) without filling the screen.
 */
export const windowBaseZoom = (width: number, height: number): number => Math.min(2, menuScale(width, height));

/**
 * The zoom a window stack should run at: `base`, stepped down until the top window's
 * `contentHeight` (unzoomed) fits the viewport. Java's tall windows (`WndSettings` is ~443 px)
 * scroll; this port's do not, so at 3x they were clipped top and bottom on a short screen. With
 * no window open the base zoom applies.
 */
export function fitWindowZoom(base: number, contentHeight: number, viewportHeight: number): number {
	let zoom = base;
	while (zoom > 1 && contentHeight * zoom > viewportHeight) zoom--;
	return zoom;
}

/**
 * Re-rasterises every text under `node` at device ratio x its own on-screen scale. Pixi draws a
 * `Text` at the renderer's resolution and knows nothing of a parent's scale, so text inside a zoomed
 * container (the window stack, the 3x log, the inventory and end panels) was 1x text magnified -
 * blurry. The scale is read from each node's `worldTransform`, rounded to a whole number (a 1.5x
 * pane rasterises at 2x rather than shimmering).
 */
export function sharpenText(node: Container, dpr: number): void {
	for (const child of node.children) {
		const text = child as unknown as { text?: unknown; resolution?: number; worldTransform?: { a: number; b: number } };
		if (typeof text.text === 'string' && text.worldTransform) {
			const resolution = dpr * Math.max(1, Math.round(Math.hypot(text.worldTransform.a, text.worldTransform.b)));
			if (text.resolution !== resolution) text.resolution = resolution;
		}
		sharpenText(child as Container, dpr);
	}
}

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
