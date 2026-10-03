/**
 * `MagicalSight` (`actors/buffs/MagicalSight.java`, `levels/Level.updateFieldOfView()`, tag `v3.3.8`):
 * while the buff is up the hero also *senses* every discoverable cell inside a circle of
 * `DISTANCE` (12) around them, through walls - the same `sense` circle `MindVision.distance` feeds
 * (`Level.java:1349-1405`), built from `ShadowCaster.rounding`. Pure: returns the cell indices.
 */

export const MAGICAL_SIGHT_DURATION = 50;
export const MAGICAL_SIGHT_DISTANCE = 12;

/** `ShadowCaster.rounding[i][j]` (`ShadowCaster.java:41`; `[i][0]` is the array's default 0). */
export function shadowCasterRounding(radius: number, row: number): number {
	if (row <= 0) return 0;
	return Math.min(row, Math.round(radius * Math.cos(Math.asin(row / (radius + 0.5)))));
}

/** `Level.updateFieldOfView()`'s per-row half-width for a sense circle of `sense` (`Level.java:1360-1375`). */
export function senseRowHalfWidth(sense: number, dy: number): number {
	const at = shadowCasterRounding(sense, dy);
	if (at < dy) return at;
	let left = sense;
	while (shadowCasterRounding(sense, left) < at) left--;
	return left;
}

/**
 * The sensed cells: every row `cy-sense..cy+sense`, `cx-half..cx+half`, kept only where `discoverable`
 * (Java copies `discoverable[]`, so solid rock nowhere near open floor stays unseen).
 */
export function magicalSightCells(
	width: number, height: number, cx: number, cy: number, sense: number, discoverable: (x: number, y: number) => boolean,
): number[] {
	const cells: number[] = [];
	for (let y = Math.max(0, cy - sense); y <= Math.min(height - 1, cy + sense); y++) {
		const half = senseRowHalfWidth(sense, Math.abs(cy - y));
		for (let x = Math.max(0, cx - half); x <= Math.min(width - 1, cx + half); x++) {
			if (discoverable(x, y)) cells.push(y * width + x);
		}
	}
	return cells;
}
