/** Port of `levels/rooms/standard/PlatformRoom.java`; its `merge()` behavior is implemented in
 *  `regularPainter.ts` alongside the other class-specific room merge overrides. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, drawInside } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

/** `Rect.java`: exclusive width/height (`right-left`), unlike `Room`'s +1-inclusive convention. */
interface Rect { left: number; top: number; right: number; bottom: number; }

function splitPlatforms(cur: Rect, out: Rect[]): void {
	const curArea = (cur.right - cur.left + 1) * (cur.bottom - cur.top + 1);

	if (SpdRandom.float() < (curArea - 25) / 11) {
		if (cur.right - cur.left > cur.bottom - cur.top ||
			(cur.right - cur.left === cur.bottom - cur.top && SpdRandom.int(2) === 0)) {
			const splitX = SpdRandom.intRange(cur.left + 2, cur.right - 2);
			splitPlatforms({ left: cur.left, top: cur.top, right: splitX - 1, bottom: cur.bottom }, out);
			splitPlatforms({ left: splitX + 1, top: cur.top, right: cur.right, bottom: cur.bottom }, out);
			const bridgeY = SpdRandom.normalIntRange(cur.top, cur.bottom);
			out.push({ left: splitX - 1, top: bridgeY, right: splitX + 1, bottom: bridgeY });
		} else {
			const splitY = SpdRandom.intRange(cur.top + 2, cur.bottom - 2);
			splitPlatforms({ left: cur.left, top: cur.top, right: cur.right, bottom: splitY - 1 }, out);
			splitPlatforms({ left: cur.left, top: splitY + 1, right: cur.right, bottom: cur.bottom }, out);
			const bridgeX = SpdRandom.normalIntRange(cur.left, cur.right);
			out.push({ left: bridgeX, top: splitY - 1, right: bridgeX, bottom: splitY + 1 });
		}
	} else {
		out.push(cur);
	}
}

export function paintPlatformRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.CHASM);

	const platforms: Rect[] = [];
	splitPlatforms({ left: room.left + 2, top: room.top + 2, right: room.right - 2, bottom: room.bottom - 2 }, platforms);

	for (const platform of platforms) {
		fillXY(level, platform.left, platform.top, platform.right - platform.left + 1, platform.bottom - platform.top + 1, Terrain.EMPTY_SP);
	}

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		drawInside(level, room, door, 2, Terrain.EMPTY_SP);
	}
}
