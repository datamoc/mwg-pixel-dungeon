/**
 * One `Blob.evolve()` step from SPD tag `v3.3.8`.
 *
 * The generic MWG Blob deliberately has a different diffusion/decay model, so the port keeps
 * this game-specific volume transition in its own simulation helper instead of changing MWG.
 */
export function evolveJavaBlob(
	width: number,
	height: number,
	before: readonly number[],
	isSolid: (x: number, y: number) => boolean,
): number[] {
	const next = new Array<number>(width * height).fill(0);
	const active = before.flatMap((volume, cell) => volume > 0 ? [cell] : []);
	if (active.length === 0) return next;
	const left = Math.max(0, Math.min(...active.map(cell => cell % width)));
	const right = Math.min(width - 1, Math.max(...active.map(cell => cell % width)));
	const top = Math.max(0, Math.min(...active.map(cell => Math.floor(cell / width))));
	const bottom = Math.min(height - 1, Math.max(...active.map(cell => Math.floor(cell / width))));
	const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < width && y < height;
	for (let y = top - 1; y <= bottom + 1; y++) for (let x = left - 1; x <= right + 1; x++) {
		if (!inside(x, y) || isSolid(x, y)) continue;
		const neighbours: readonly [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
		let sum = 0;
		let count = 0;
		for (const [dx, dy] of neighbours) {
			const nx = x + dx, ny = y + dy;
			if (dx === 0 && dy === 0 || (nx >= left && nx <= right && ny >= top && ny <= bottom)) {
				if (!isSolid(nx, ny)) {
					sum += before[nx + ny * width] ?? 0;
					count++;
				}
			}
		}
		const value = sum >= count && count > 0 ? Math.floor(sum / count) - 1 : 0;
		if (value > 0) next[x + y * width] = value;
	}
	return next;
}
