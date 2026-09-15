import type { DungeonRegionProfile } from './regionTypes';
import { Terrain, type PaintLevel } from '../../spdLevelGen/paintLevel';

export interface HallsFloorFrameContext {
	cellCount: number;
	paint: PaintLevel | null;
	rooms: readonly { left: number; right: number; top: number; bottom: number }[];
	index: (x: number, y: number) => number;
	amuletObtained: boolean;
	liveSpawner: { x: number; y: number } | null;
}

/** Builds the Halls demon-spawner room overlay. The scene supplies only live actor position and
 * rendering state; the Halls-specific tile pattern stays with the Halls region definition. */
export function hallsDemonSpawnerFloorFrames({ cellCount, paint, rooms, index, amuletObtained, liveSpawner }: HallsFloorFrameContext, baseline: boolean): number[] {
	const frames = new Array(cellCount).fill(-1);
	if (!paint) return frames;
	const painted = baseline ? paint.mobs.find((mob) => mob.kind.toLowerCase().includes('demonspawner')) : undefined;
	const pos = liveSpawner ?? (painted ? { x: painted.pos % paint.w, y: Math.floor(painted.pos / paint.w) } : null);
	if (!pos) return frames;
	const room = rooms.find((candidate) => pos.x >= candidate.left && pos.x <= candidate.right && pos.y >= candidate.top && pos.y <= candidate.bottom);
	if (!room) return frames;
	for (let y = room.top + 1; y < room.bottom; y++) for (let x = room.left + 1; x < room.right; x++) {
		const cell = index(x, y);
		frames[cell] = paint.map[cell] === Terrain.EMPTY_DECO ? (amuletObtained ? 31 : 27) : 19;
	}
	if (liveSpawner || baseline) {
		const center = index(pos.x, pos.y);
		frames[center] = 38;
		if (pos.x > room.left + 1) frames[center - 1] = 37;
		if (pos.x < room.right - 1) frames[center + 1] = 39;
	}
	return frames;
}

export const HALLS_REGION: DungeonRegionProfile = {
	id: 'halls', waterSprite: 'water4', loadingSprite: 'loadingHalls', wallDecoration: null, waterEmbers: true,
};
