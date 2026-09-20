/**
 * The zoom a window stack should run at: `base` (the PixelScene integer zoom, `menuScale`), stepped
 * down until the top window's `contentHeight` (unzoomed) fits the viewport. Java's tall windows
 * (`WndSettings` is ~443 px) scroll; this port's do not, so at the full 3x they were clipped top and
 * bottom on any screen shorter than `contentHeight * 3`. With no window open the base zoom applies.
 */
export function fitWindowZoom(base: number, contentHeight: number, viewportHeight: number): number {
	let zoom = base;
	while (zoom > 1 && contentHeight * zoom > viewportHeight) zoom--;
	return zoom;
}
