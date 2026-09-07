/** FogOfWar.updateTexture's left/right wall halves, at default brightness.
 * States match Java: visible=0, visited=1, mapped=2, invisible=3.
 */
export function fogHalves(
	x: number, y: number, width: number, height: number,
	terrain: (x: number, y: number) => number,
	state: (x: number, y: number) => number,
): [number, number] {
	const wall = (cx: number, cy: number) => [-1, 4, 12, 16, 21, 22, 27].includes(terrain(cx, cy));
	let discoverable = false;
	for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
		const cx = x + dx, cy = y + dy;
		if (cx >= 0 && cy >= 0 && cx < width && cy < height && ![4, 12].includes(terrain(cx, cy))) discoverable = true;
	}
	const own = state(x, y);
	if (!discoverable || own === 3) return [3, 3];
	if (!wall(x, y)) return [own, own];
	if (y + 1 >= height) return [3, 3];
	if (!wall(x, y + 1)) {
		const darkest = Math.max(own, state(x, y + 1));
		return [darkest, darkest];
	}
	const side = (dx: number): number => {
		const cx = x + dx;
		if (cx < 0 || cx >= width) return 3;
		if (wall(cx, y)) return wall(cx, y + 1) ? 3 : Math.max(own, state(cx, y), state(cx, y + 1));
		return Math.max(own, state(cx, y));
	};
	return [side(-1), side(1)];
}
