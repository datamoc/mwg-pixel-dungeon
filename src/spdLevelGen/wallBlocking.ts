/** WallBlockingTilemap.updateMapCell: opaque masks behind the filtered fog.
 * Recomputed from exploration rather than caching Java's CLEARED sentinel.
 * Mining-specific shelf invalidation is not needed on the port's regular floors.
 */
export function wallBlockingFrame(
	x: number, y: number, width: number, height: number,
	terrain: (x: number, y: number) => number,
	seen: (x: number, y: number) => boolean,
): number {
	if (y <= 0 || y >= height - 1) return -1;
	const wall = (cx: number, cy: number) => [-1, 4, 12, 16, 21, 22, 27].includes(terrain(cx, cy));
	const hidden = (cx: number, cy: number): boolean => !seen(cx, cy)
		|| (wall(cx, cy) && cy + 1 < height && !wall(cx, cy + 1) && !seen(cx, cy + 1));
	const open = (cx: number, cy: number) => !wall(cx, cy) && !hidden(cx, cy);
	if (!wall(x, y)) {
		if (!hidden(x, y) || !wall(x, y + 1)) return -1;
		return !hidden(x, y + 1) && !open(x - 1, y) && !open(x + 1, y)
			&& !open(x - 1, y + 1) && !open(x + 1, y + 1) ? 3 : -1;
	}
	if (!wall(x, y + 1)) {
		if (wall(x - 1, y - 1) && wall(x, y - 1) && wall(x + 1, y - 1)) return -1;
		const aboveVisible = (open(x - 1, y - 1) && wall(x - 1, y)) || open(x, y - 1)
			|| (open(x + 1, y - 1) && wall(x + 1, y));
		return aboveVisible && hidden(x, y + 1) && !open(x - 1, y) && !open(x + 1, y)
			&& !open(x - 1, y + 1) && !open(x + 1, y + 1) ? 2 : -1;
	}
	if (hidden(x, y - 1) && hidden(x, y) && hidden(x, y + 1)) return -1;
	const blocked = (dx: number) => {
		const cx = x + dx;
		return cx >= 0 && cx < width && !(!wall(cx, y) && !hidden(cx, y - 1))
			&& !open(cx, y) && !open(cx, y + 1);
	};
	return -1 + (blocked(1) ? 1 : 0) + (blocked(-1) ? 2 : 0);
}
