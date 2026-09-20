import type { Graphics } from 'pixi.js';

/**
 * Draws the aim preview: every cell the current shape would affect, in world space. Extracted from
 * `DungeonScene.refreshAimOverlay` unchanged (the scene keeps the aim state and the overlay layer).
 */
export function drawAimPreview(overlay: Graphics | null, cells: Iterable<{ x: number; y: number }>, tile: number): void {
	if (!overlay) return;
	overlay.clear();
	for (const cell of cells) {
		overlay.rect(cell.x * tile, cell.y * tile, tile, tile)
			.fill({ color: 0xffd54a, alpha: 0.28 })
			.stroke({ width: 1, color: 0xffd54a, alpha: 0.9 });
	}
}
