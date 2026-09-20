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
 * Re-rasterises every text under `node` at `resolution`. Pixi draws a `Text` at the renderer's
 * resolution and knows nothing of a parent's scale, so text inside the zoomed window stack was
 * rendered at 1x and then magnified - blurry. `resolution` = device pixel ratio x zoom makes it
 * crisp at the size it is shown.
 */
export function sharpenText(node: Container, resolution: number): void {
	for (const child of node.children) {
		const text = child as unknown as { text?: unknown; resolution?: number };
		if (typeof text.text === 'string' && text.resolution !== resolution) text.resolution = resolution;
		sharpenText(child as Container, resolution);
	}
}

/** One per-frame pass over a scaled window stack: fit its zoom to the top window and keep its text crisp. */
export function tuneWindowStack(stack: WindowStack, base: number, zoom: number, viewportHeight: number, apply: (zoom: number) => void): void {
	const fit = fitWindowZoom(base, stack.top?.getLocalBounds().height ?? 0, viewportHeight);
	if (fit !== zoom) apply(fit);
	if (!stack.isEmpty) sharpenText(stack, (globalThis.devicePixelRatio || 1) * fit);
}
