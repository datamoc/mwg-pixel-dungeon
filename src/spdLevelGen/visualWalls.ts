/** DungeonTileSheet and DungeonWallsTilemap, using Java Terrain ids rather than
 * collision categories. Mining-branch decorated interiors remain unported.
 * This translation and its atlas values belong to SPD, not the MWG framework.
 */
export type VisualTerrain = (x: number, y: number) => number;
const walls = new Set([-1, 4, 12, 16, 21, 22, 27]);
const doors = new Set([5, 6, 10, 31]);

export function raisedWallFrame(at: VisualTerrain, x: number, y: number, variance: number): number | undefined {
	const tile = at(x, y), below = at(x, y + 1);
	// DungeonTerrainTilemap passes the NORTH neighbour to getRaisedDoorTile.
	if (doors.has(tile)) return walls.has(at(x, y - 1)) ? 132 : ({ 5: 128, 6: 129, 10: 130, 31: 131 } as Record<number, number>)[tile];
	if (!walls.has(tile)) return undefined;
	if (walls.has(below)) return -1;
	let frame = doors.has(below) ? 104 : tile === 27 ? 108 : tile === 12 ? 100 : tile === 4 || tile === 16 ? 96 : -1;
	if (frame < 0) return frame;
	if (frame !== 104 && variance >= 50) frame += 16;
	return frame + (walls.has(at(x + 1, y)) ? 0 : 1) + (walls.has(at(x - 1, y)) ? 0 : 2);
}

export function upperWallFrame(at: VisualTerrain, x: number, y: number, belowVariance: number): number {
	const tile = at(x, y), below = at(x, y + 1);
	if (walls.has(tile)) {
		if (walls.has(below)) {
			return (tile === 27 || below === 27 ? 192 : 160)
				+ (walls.has(at(x + 1, y)) ? 0 : 1)
				+ (walls.has(at(x + 1, y + 1)) ? 0 : 2)
				+ (walls.has(at(x - 1, y + 1)) ? 0 : 4)
				+ (walls.has(at(x - 1, y)) ? 0 : 8);
		}
		if (below === 5) return 252;
		if (below === 10) return 253;
		if (below === 31) return 254;
		if (below === 6) return -1;
	}
	if (tile === 21 || tile === 22) return 255;
	if (walls.has(below) && below !== -1) {
		const frame = ({ 6: 224, 5: 228, 10: 232, 31: 236 } as Record<number, number>)[tile]
			?? (below === 12 ? 212 : below === 27 ? 216 : 208);
		return frame + (walls.has(at(x + 1, y + 1)) ? 0 : 1) + (walls.has(at(x - 1, y + 1)) ? 0 : 2);
	}
	if (below === 5 || below === 10) return 249;
	if (below === 6) return 250;
	if (below === 31) return 251;
	if (below === 25 || below === 26) return 240;
	if (below === 28) return 241;
	if (below === 13) return 242;
	if (below === 15) return belowVariance >= 50 ? 246 : 243;
	if (below === 30) return belowVariance >= 50 ? 247 : 244;
	return -1;
}

/** RaisedTerrainTilemap: the foreground blades in the character's own cell. */
export function foregroundGrassFrame(tile: number, variance: number): number {
	return tile === 15 ? (variance >= 50 ? 155 : 151) : tile === 30 ? (variance >= 50 ? 156 : 152) : -1;
}
