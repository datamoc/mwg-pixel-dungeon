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
import { MWL_TRAIT_NODES } from '../mwlContent';

/**
 * `ConnectionRoom.chances[]`, indexed by depth (1-26); this port covers Sewers (1-5) and
 * Prison (6-10). Note Prison's table zeroes `TunnelRoom`/`BridgeRoom` entirely and is dominated
 * by `PerimeterRoom` (22) with a little `WalkwayRoom` (3) - the inverse of Sewers, where
 * `PerimeterRoom` is the one class that can never appear.
 */
/** `ConnectionRoom.rooms[]`'s real registration order (`ConnectionRoom.java:50-57`). */
const KINDS: ConnectionRoomKind[] = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'connectionRoomChances');
	const effect = node?.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'classes');
	const values = effect?.attributes.set?.split(',').filter(Boolean) ?? [];
	if (values.length !== 6) throw new Error('MWL room rule has invalid connection-room class order');
	return values as ConnectionRoomKind[];
})();

const CHANCES: Record<number, number[]> = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'connectionRoomChances');
	if (!node) throw new Error('MWL room rule is missing connectionRoomChances');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL room rule is missing connection-room entries');
	const rows: Record<number, number[]> = {};
	for (const entry of raw.split(';')) {
		const [depthText, valuesText] = entry.split('|');
		const depth = Number(depthText);
		const values = valuesText?.split(',').map(Number) ?? [];
		if (!Number.isInteger(depth) || values.length !== KINDS.length || values.some((value) => !Number.isFinite(value) || value < 0)) {
			throw new Error(`MWL room rule has invalid connection-room row ${entry}`);
		}
		rows[depth] = values;
	}
	return rows;
})();

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
