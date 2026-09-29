/** `PathFinder.buildDistanceMap(pos, BArray.not(level.solid), 2)` for trap areas. */
export function nonSolidDistanceMap(
	width: number,
	height: number,
	start: number,
	neighbours: readonly number[],
	isNonSolid: (cell: number) => boolean,
	maxDistance = 2,
): number[] {
	const distances = new Array<number>(width * height).fill(-1);
	if (start < 0 || start >= distances.length || !isNonSolid(start)) return distances;
	distances[start] = 0;
	const queue = [start];
	for (let cursor = 0; cursor < queue.length; cursor++) {
		const cell = queue[cursor]!;
		const distance = distances[cell]!;
		if (distance >= maxDistance) continue;
		for (const offset of neighbours) {
			const next = cell + offset;
			if (next < 0 || next >= distances.length || distances[next] >= 0 || !isNonSolid(next)) continue;
			//Offsets must not wrap from one row to another.
			if (Math.abs((next % width) - (cell % width)) > 1 || Math.abs(Math.floor(next / width) - Math.floor(cell / width)) > 1) continue;
			distances[next] = distance + 1;
			queue.push(next);
		}
	}
	return distances;
}
