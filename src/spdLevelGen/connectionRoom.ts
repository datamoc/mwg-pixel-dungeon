/**
 * Port of `levels/rooms/connection/ConnectionRoom.java`'s `createRoom()` class-selection table.
 * The 6 concrete subclasses (`TunnelRoom`, `BridgeRoom`, `PerimeterRoom`, `WalkwayRoom`,
 * `RingTunnelRoom`, `RingBridgeRoom`, in `ConnectionRoom.rooms[]`'s real registration order) are
 * now distinguished via `Room.connectionKind` - `RingTunnelRoom`/`RingBridgeRoom` override
 * `minWidth()`/`minHeight()` to 5 (see `room.ts`'s `CONNECTION_ROOM_META`), the other four keep
 * the base 3. Their Java `paint()` methods are dispatched by `rooms/standard/registry.ts` and
 * `rooms/connection/paint.ts`, including the tunnel/bridge/chasm geometry and all paint-stage
 * RNG draws (`getDoorCenter()`'s two `Random.Float()` calls and TunnelRoom's diagonal roll).
 * `MazeConnectionRoom` (used for the tunnel leading to a `SecretRoom`) is NOT one of these 6 -
 * it's instantiated directly in `RegularBuilder.createBranches` when branching a `SecretRoom`,
 * so it doesn't go through this table at all in the real Java either.
 */
import { Room, type ConnectionRoomKind } from './room';
import { SpdRandom } from '../spdRng';

/**
 * `ConnectionRoom.chances[]`, indexed by depth (1-26); this port covers Sewers (1-5) and
 * Prison (6-10). Note Prison's table zeroes `TunnelRoom`/`BridgeRoom` entirely and is dominated
 * by `PerimeterRoom` (22) with a little `WalkwayRoom` (3) - the inverse of Sewers, where
 * `PerimeterRoom` is the one class that can never appear.
 */
const CHANCES: Record<number, number[]> = {
	1: [20, 1, 0, 2, 2, 1], 2: [20, 1, 0, 2, 2, 1], 3: [20, 1, 0, 2, 2, 1], 4: [20, 1, 0, 2, 2, 1],
	5: [20, 0, 0, 0, 0, 0],
	6: [0, 0, 22, 3, 0, 0], 7: [0, 0, 22, 3, 0, 0], 8: [0, 0, 22, 3, 0, 0],
	9: [0, 0, 22, 3, 0, 0], 10: [0, 0, 22, 3, 0, 0],
};

/** `ConnectionRoom.rooms[]`'s real registration order (`ConnectionRoom.java:50-57`). */
const KINDS: ConnectionRoomKind[] = ['tunnel', 'bridge', 'perimeter', 'walkway', 'ringTunnel', 'ringBridge'];

export function createConnectionRoom(depth: number, maze: boolean): Room {
	if (maze) {
		const r = new Room('mazeConnection');
		return r;
	}
	const table = CHANCES[depth] ?? CHANCES[1];
	const ordinal = SpdRandom.chances(table);
	const kind = KINDS[ordinal] ?? 'tunnel';
	return new Room('connection', undefined, undefined, undefined, kind);
}
