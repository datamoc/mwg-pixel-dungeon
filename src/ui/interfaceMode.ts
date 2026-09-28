/**
 * `SPDSettings.interfaceSize()`'s responsive gate (`SPDSettings.java`, tag `v3.3.8`): a large or
 * mixed interface is forced back to the mobile layout when the window is too small for it -
 * `min(width / MIN_WIDTH_FULL, height / MIN_HEIGHT_FULL) < 2 * density` with `MIN_WIDTH_FULL = 360`,
 * `MIN_HEIGHT_FULL = 200` (`PixelScene.java`). A browser page has density 1, so the full layout
 * needs at least 720x400. Kept pure so `tools/verifyInterfaceMode.mjs` pins it.
 */
export const MIN_WIDTH_FULL = 360;
export const MIN_HEIGHT_FULL = 200;

/** The interface size actually drawn: the player's choice (0 mobile, 1 large) unless the window is too small. */
export function effectiveInterfaceSize(choice: 0 | 1, width: number, height: number): 0 | 1 {
	if (choice === 0) return 0;
	return Math.min(width / MIN_WIDTH_FULL, height / MIN_HEIGHT_FULL) < 2 ? 0 : 1;
}

/** `Toolbar.layout()`: 4 quickslots, a 5th above 152 and a 6th above 170 logical pixels of UI width. */
export function quickslotsToShow(uiWidth: number): number {
	return 4 + (uiWidth > 152 ? 1 : 0) + (uiWidth > 170 ? 1 : 0);
}

/** `SPDSettings.interfaceSize() == 2`: only the large mode docks the inventory pane (1, "mixed", does not). */
export function inventoryDocked(choice: 0 | 1, uiModeSetting: number, width: number, height: number): boolean {
	return effectiveInterfaceSize(choice, width, height) === 1 && uiModeSetting === 2;
}

/**
 * `PixelScene.defaultZoom` at density 1 (a browser page): `ceil(2.5 * density)` = 3, lowered until the
 * canvas still holds the minimum logical size (`MIN_WIDTH_L`/`MIN_HEIGHT_L` 240x160 landscape,
 * `MIN_WIDTH_P`/`MIN_HEIGHT_P` 135x225 portrait). Every docked HUD piece is authored in Java's own
 * pixels and scaled by this, like Java's UI camera.
 */
export function hudZoom(width: number, height: number): number {
	const landscape = width > height;
	return Math.max(1, Math.min(3, Math.floor(Math.min(width / (landscape ? 240 : 135), height / (landscape ? 160 : 225)))));
}
