/**
 * R015: `RegularLevel.levelExplorePercent()` (tag `v3.3.8`), the room-missed exploration
 * fraction the run score uses. Java collects "missed" rooms - undiscovered / openable /
 * key-bearing levelgen heaps, the eternal and sacrificial fires, undefeated statues and
 * mimics, barricade/locked/secret doors, unused crystal keys - then returns 1 / 0.5 / 0.2
 * / 0 for 0 / 1 / 2 / 3+ missed rooms (Java's own comment says "reduced by 50%/30%/20%",
 * but its switch is 1/0.5/0.2/0 - the code wins, and so does this port's).
 *
 * Deliberately pure so `npm run test:score` can pin the algebra; the scene gathers the
 * evidence (heap seen-state, blob volumes, live creatures, terrain cells, bag keys) in
 * `DungeonScene.levelExplorePercent`.
 *
 * Deliberate divergences from the Java loop, all stated where the evidence is gathered:
 * - Java's comment claims connection rooms are ignored by the door-candidate step, but
 *   its own loop has no such filter; this port actually skips them (never harsher than
 *   Java, and matches the documented intent).
 * - `Room.inside()` is the strict interior (`Room.java`), so wall/border cells belong to
 *   no room here either; a heap in a corridor marks whatever room's strict interior it
 *   sits in, exactly like Java's `room(pos)`.
 */

/** A room rectangle plus its `gameBridge` label (`standard:tunnel`, `special:pit`, ...). */
export interface ExploreRoom {
	left: number;
	top: number;
	right: number;
	bottom: number;
	label: string;
}

/** One levelgen heap's evidence: position, seen-state, container shape, key payload. */
export interface ExploreHeap {
	x: number;
	y: number;
	/** Java's `Heap.seen`; the cell's explored state stands in for the heap sprite's. */
	seen: boolean;
	/** Java's `Heap.autoExplored` (levelgen notes; see `GroundItem.autoExplored`). */
	autoExplored: boolean;
	/** Java's openable types: HEAP/FOR_SALE are fine, CHEST/LOCKED_CHEST are not. */
	openable: boolean;
	/** The heap's payload id, for Java's `i instanceof Key` check (`KEY_ITEM_IDS`). */
	itemKind?: string;
}

export interface ExploreEvidence {
	rooms: readonly ExploreRoom[];
	heaps: readonly ExploreHeap[];
	/** `MagicalFireRoom.EternalFire` with `volume > 0`. */
	eternalFireBurning: boolean;
	/** `SacrificialFire` with `volume > 0`. */
	sacrificialFireBurning: boolean;
	/** An undefeated `levelGenStatue` still alive (Java marks `room(StatueRoom.class)`). */
	liveLevelGenStatue: boolean;
	/** Live mimics, marked at their own cell like Java's `room(m.pos)`. */
	liveMimics: readonly { x: number; y: number }[];
	/** `Terrain.BARRICADE` / `Terrain.LOCKED_DOOR` / undiscovered `SECRET_DOOR` cells. */
	blockedCells: readonly { x: number; y: number }[];
	/** An unused `CrystalKey` for this floor in the bag (Java: `Notes.KeyRecord`). */
	unusedCrystalKey: boolean;
}

/**
 * `SpecialRoom.CRYSTAL_KEY_SPECIALS` = {PitRoom, CrystalVaultRoom, CrystalChoiceRoom,
 * CrystalPathRoom}, as the port's room labels.
 */
const CRYSTAL_KEY_SPECIALS = ['special:pit', 'special:crystalVault', 'special:crystalChoice', 'special:crystalPath'];

/**
 * Java's `instanceof Key` for the heap sweep: every key id the port can put on the
 * floor (the same four the port's own key pickup dispatch checks,
 * `groundPickup.ts:230`). `skeletonkey` is excluded because Java's `SkeletonKey` is an
 * artifact (`items/artifacts/SkeletonKey.java`), not a `Key` subclass.
 */
export const KEY_ITEM_IDS = new Set(['crystalKey', 'ironKey', 'goldenKey', 'wornKey']);

/** The Java `NEIGHBOURS4` order: up, right, down, left. */
const NEIGHBOURS4: readonly (readonly [number, number])[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function explorePercentOf(evidence: ExploreEvidence): number {
	const { rooms } = evidence;
	const missed = new Set<number>();

	//`Room.inside()`: strict interior - a rect of width/height 1 encloses nothing.
	const roomAt = (x: number, y: number): number => {
		for (let i = 0; i < rooms.length; i++) {
			const r = rooms[i]!;
			if (x > r.left && y > r.top && x < r.right && y < r.bottom) return i;
		}
		return -1;
	};
	const markCell = (x: number, y: number): void => {
		const i = roomAt(x, y);
		if (i >= 0) missed.add(i);
	};
	//Java's `room(Class)` is first-match over `rooms`, so label lookups take the first room.
	const markLabel = (label: string): void => {
		const i = rooms.findIndex((r) => r.label === label);
		if (i >= 0) missed.add(i);
	};

	//There are levelgen heaps which are undiscovered, in an openable container, or which
	//contain keys (`RegularLevel.levelExplorePercent`, tag `v3.3.8`).
	for (const heap of evidence.heaps) {
		if (heap.autoExplored) continue;
		//Java ignores crystal chests as "not all are openable" - `openable` excludes them.
		if (!heap.seen || heap.openable) markCell(heap.x, heap.y);
		else if (heap.itemKind !== undefined && KEY_ITEM_IDS.has(heap.itemKind)) markCell(heap.x, heap.y);
	}

	//There is magical fire (blocks items) or sacrificial fire (contains items) in it.
	if (evidence.eternalFireBurning) markLabel('special:magicalFire');
	if (evidence.sacrificialFireBurning) markLabel('special:sacrifice');

	//There are undefeated statues or mimics in it.
	if (evidence.liveLevelGenStatue) markLabel('special:statue');
	for (const mimic of evidence.liveMimics) markCell(mimic.x, mimic.y);

	//it contains a barricade, locked door (player locked doors are fine though), or hidden
	//door. Java's comment says connection rooms are ignored here but its loop has no
	//filter; this port skips them for real (never harsher than Java, and it is what the
	//comment promised). The candidate scan is Java's exact `RegularLevel.java:842-852`:
	//replace a candidate that is not yet missed (so the walk freezes on the first
	//already-missed neighbour - "prefer rooms already missed" - and otherwise lands on
	//the last fresh neighbour room, "it only counts one").
	for (const cell of evidence.blockedCells) {
		let candidate = -1;
		for (const [dx, dy] of NEIGHBOURS4) {
			const i = roomAt(cell.x + dx, cell.y + dy);
			if (i < 0) continue;
			const label = rooms[i]!.label;
			if (label.startsWith('connection:') || label.startsWith('mazeConnection:')) continue;
			//Java's exact condition: swap in this room unless the current one is missed.
			if (candidate === -1 || !missed.has(candidate)) candidate = i;
		}
		if (candidate >= 0) missed.add(candidate);
	}

	//it has an unused CrystalKey for this floor - every crystal-key special room counts.
	if (evidence.unusedCrystalKey) for (const label of CRYSTAL_KEY_SPECIALS) markLabel(label);

	//`{0,1,2,3+} missed rooms -> {1, 0.5, 0.2, 0}` (the switch's default).
	switch (missed.size) {
		case 0: return 1;
		case 1: return 0.5;
		case 2: return 0.2;
		default: return 0;
	}
}
