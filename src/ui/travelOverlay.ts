import type { Graphics } from 'pixi.js';

/** Draws the route under the pointer while click-to-travel is available. */
export function drawTravelPreview(
	overlay: Graphics | null,
	cells: Iterable<{ x: number; y: number }>,
	tile: number,
): void {
	if (!overlay) return;
	overlay.clear();
	for (const cell of cells) {
		overlay.rect(cell.x * tile + tile * 0.2, cell.y * tile + tile * 0.2, tile * 0.6, tile * 0.6)
			.fill({ color: 0x58b8ff, alpha: 0.34 })
			.stroke({ width: 1, color: 0xb9e6ff, alpha: 0.8 });
	}
}
