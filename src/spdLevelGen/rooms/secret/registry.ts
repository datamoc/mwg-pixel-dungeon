/**
 * Port of `levels/rooms/secret/SecretRoom.java`'s run-level state (`ALL_SECRETS`, `runSecrets`,
 * `regionSecretsThisRun`, `initForRun`/`secretsForFloor`/`createRoom`), plus the paint dispatch
 * table for all 12 `ALL_SECRETS` classes (see `room.ts`'s `SecretRoomKind` census comment for
 * what's excluded and why - `RatKingRoom` isn't in `ALL_SECRETS`, so it's out of scope here too).
 *
	 * Like `SpecialRoom`'s run-state (`rooms/special/registry.ts`), this keeps `runSecrets`/
	 * `regionSecretsThisRun` as real module-level state (mirroring Java's own `static` fields).
	 * The live `gameBridge` performs the run-start reset; standalone verifier entry points still
	 * do it explicitly so they can control their fixture seed.
 *
 * `regionSecretsThisRun` is indexed by `depth/5` exactly as Java computes it (so depth 5 -
 * SewerBossLevel - already falls under region index 1, Prison's slot, not region 0's - a real
 * Java quirk, not a porting bug, though it never matters for this port's Sewers-1-4-only scope).
 * `restoreRoomsFromBundle`/`storeRoomsInBundle` (save-file persistence) aren't ported - this port
 * has no multi-session save continuity for run-level state.
 */
import type { SecretRoomKind } from '../../room';
import { Room } from '../../room';
import { PaintLevel } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

import { paintGardenRoom } from './gardenRoom';
import { paintLaboratoryRoom } from './laboratoryRoom';
import { paintLibraryRoom } from './libraryRoom';
import { paintLarderRoom } from './larderRoom';
import { paintWellRoom } from './wellRoom';
import { paintRunestoneRoom } from './runestoneRoom';
import { paintArtilleryRoom } from './artilleryRoom';
import { paintChestChasmRoom } from './chestChasmRoom';
import { paintHoneypotRoom } from './honeypotRoom';
import { paintHoardRoom } from './hoardRoom';
import { paintMazeRoom } from './mazeRoom';
import { paintSummoningRoom } from './summoningRoom';
import { paintRatKingRoom } from '../sewerBoss/ratKingRoom';

/** `SecretRoom.ALL_SECRETS`'s real declaration order - `createRoom()`'s selection index is rolled
 *  against this list's current order (post-shuffle, post-rotation), so the order matters. */
const ALL_SECRETS: SecretRoomKind[] = [
	'garden', 'laboratory', 'library', 'larder', 'well', 'runestone',
	'artillery', 'chestChasm', 'honeypot', 'hoard', 'maze', 'summoning',
];

/** `SecretRoom.baseRegionSecrets`. */
const BASE_REGION_SECRETS = [2, 2.25, 2.5, 2.75, 3.0];

let runSecrets: SecretRoomKind[] = [];
let regionSecretsThisRun: number[] = [0, 0, 0, 0, 0];

/** `SecretRoom.initForRun()`. See module comment - not auto-invoked; callers opt in. */
export function resetSecretRoomRunState(): void {
	regionSecretsThisRun = BASE_REGION_SECRETS.map(chance => {
		let n = Math.trunc(chance);
		if (SpdRandom.float() < chance % 1) n++;
		return n;
	});

	runSecrets = ALL_SECRETS.slice();
	SpdRandom.shuffle(runSecrets);
}

/** `SecretRoom.secretsForFloor(depth)`. */
export function secretsForFloor(depth: number): number {
	if (depth === 1) return 0;

	const region = Math.floor(depth / 5);
	const floor = depth % 5;
	const floorsLeft = 5 - floor;

	let secrets: number;
	if (floorsLeft === 0) {
		secrets = regionSecretsThisRun[region];
	} else {
		const raw = regionSecretsThisRun[region] / floorsLeft;
		secrets = SpdRandom.float() < raw % 1 ? Math.ceil(raw) : Math.floor(raw);
	}

	regionSecretsThisRun[region] -= Math.trunc(secrets);
	return Math.trunc(secrets);
}

/** `SecretRoom.createRoom()`: "min of 4 rolls" - picks the lowest of 4 independent
 *  `Random.Int(runSecrets.size())` draws, then rotates that entry to the end of the queue. */
export function createSecretRoom(): SecretRoomKind {
	let index = runSecrets.length;
	for (let i = 0; i < 4; i++) {
		const candidate = SpdRandom.int(runSecrets.length);
		if (candidate < index) index = candidate;
	}

	const kind = runSecrets[index];
	runSecrets.splice(index, 1);
	runSecrets.push(kind);
	return kind;
}

type PaintFn = (level: PaintLevel, room: Room, depth: number) => void;
const PAINTERS: Record<SecretRoomKind, PaintFn> = {
	garden: (l, r) => paintGardenRoom(l, r),
	laboratory: (l, r) => paintLaboratoryRoom(l, r),
	library: (l, r) => paintLibraryRoom(l, r),
	larder: (l, r, d) => paintLarderRoom(l, r, d),
	well: (l, r) => paintWellRoom(l, r),
	runestone: (l, r) => paintRunestoneRoom(l, r),
	artillery: (l, r) => paintArtilleryRoom(l, r),
	chestChasm: (l, r, d) => paintChestChasmRoom(l, r, d),
	honeypot: (l, r) => paintHoneypotRoom(l, r),
	hoard: (l, r, d) => paintHoardRoom(l, r, d),
	maze: (l, r) => paintMazeRoom(l, r),
	summoning: (l, r) => paintSummoningRoom(l, r),
	// Never in `ALL_SECRETS`/`createSecretRoom()` - placed directly by `sewerBossInitRooms()`.
	ratKing: (l, r) => paintRatKingRoom(l, r),
};

export function paintSecretRoom(level: PaintLevel, room: Room, depth: number): void {
	if (!room.secretKind) throw new Error('paintSecretRoom: room has no secretKind set');
	PAINTERS[room.secretKind](level, room, depth);
}
