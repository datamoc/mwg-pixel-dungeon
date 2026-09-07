import { Random, Roguelike } from 'mwg';
import { SpdJavaRandom, spdScramble } from './spdRng';

export const COLOR = {
	remembered: 0x2a2a30,
	unseen: 0x000000,
};

export type Region = 'sewers' | 'prison' | 'caves' | 'city' | 'halls';

/** DungeonSeed.convertFromCode(), including SPD's reversed base-26 digit order. */
export function spdSeedValue(input: string | null): bigint | null {
	if (!input) return null;
	const code = input.replace(/[-\s]/g, '').toUpperCase();
	if (!/^[A-Z]{9}$/.test(code)) {
		try {
			const numeric = BigInt(input.replace(/\s/g, ''));
			return ((numeric % 5429503678976n) + 5429503678976n) % 5429503678976n;
		} catch { return null; }
	}
	let value = 0n;
	for (let i = 8; i >= 0; i--) value += BigInt(code.charCodeAt(i) - 65) * 26n ** BigInt(8 - i);
	return value;
}

/** `Dungeon.java`'s depth switch: 1-4 Sewers, 5 SewerBoss, 6-9 Prison, 10 PrisonBoss, 11-14 Caves, 15 CavesBoss, 16-19 City, 20 CityBoss, 21-24 Halls, 25 HallsBoss, 26 LastLevel */
export function regionForDepth(depth: number): Region {
	if (depth <= 5) return 'sewers';
	if (depth <= 10) return 'prison';
	if (depth <= 15) return 'caves';
	if (depth <= 20) return 'city';
	return 'halls';
}

/**
 * Each level's own real `.setWater(fill, smoothing)`/`.setGrass(fill, smoothing)` calls
 * (the fallback path, used only for content outside the verified SPD level generator):
 * SewerLevel (.30/5, .20/4), PrisonLevel (.30/4, .20/3), CavesLevel (.30/6, .15/3),
 * CityLevel (.30/4, .20/3), HallsLevel (.15/6, .10/3). An earlier revision of this table
 * had Caves wrong (.30/4, .20/3, copied from Prison) - corrected against CavesLevel.java.
 */
export const REGION_WATER: Record<Region, { fill: number; smoothing: number }> = {
	sewers: { fill: 0.3, smoothing: 5 },
	prison: { fill: 0.3, smoothing: 4 },
	caves: { fill: 0.3, smoothing: 6 },
	city: { fill: 0.3, smoothing: 4 },
	halls: { fill: 0.15, smoothing: 6 },
};
export const REGION_GRASS: Record<Region, { fill: number; smoothing: number }> = {
	sewers: { fill: 0.2, smoothing: 4 },
	prison: { fill: 0.2, smoothing: 3 },
	caves: { fill: 0.15, smoothing: 3 },
	city: { fill: 0.2, smoothing: 3 },
	halls: { fill: 0.1, smoothing: 3 },
};

/**
 * `levels/Patch.java`'s cellular-automaton "lake/patch" generator, translated block for
 * block - a random fill, then `clustering` passes of "become whatever most of my 8 neighbours
 * already are", which is what turns a scatter of random cells into the organic irregular
 * blobs SPD's water and grass actually look like (this port's water used to be one small hand
 * -placed rectangle, which is not that shape at all). `forceFillRate` is Java's fill-rate
 * correction: clustering pushes the true fill sharply toward 0% or 100% the more passes it
 * runs, so the initial fill is pulled toward 0.5 first and then cells are manually flipped
 * afterwards until the requested fill is hit exactly - both steps are reproduced here, not
 * just the clustering.
 */
export function patchGenerate(w: number, h: number, fill: number, clustering: number, forceFillRate: boolean): boolean[] {
	const length = w * h;
	let cur = new Array<boolean>(length).fill(false);
	let off = new Array<boolean>(length).fill(false);

	let fillDiff = -Math.round(length * fill);
	const seedFill = forceFillRate && clustering > 0 ? fill + (0.5 - fill) * 0.5 : fill;

	for (let i = 0; i < length; i++) {
		off[i] = Random.float() < seedFill;
		if (off[i]) fillDiff++;
	}

	for (let pass = 0; pass < clustering; pass++) {
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const pos = x + y * w;
				let count = 0;
				let neighbours = 0;

				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const nx = x + dx;
						const ny = y + dy;
						if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
						neighbours++;
						if (off[nx + ny * w]) count++;
					}
				}

				cur[pos] = 2 * count >= neighbours;
				if (cur[pos] !== off[pos]) fillDiff += cur[pos] ? 1 : -1;
			}
		}
		[cur, off] = [off, cur];
	}

	if (forceFillRate && Math.min(w, h) > 2) {
		const neighbourOffsets9 = [-w - 1, -w, -w + 1, -1, 0, 1, w - 1, w, w + 1];
		const growing = fillDiff < 0;
		let guard = 0;

		while (fillDiff !== 0 && guard++ < length * 10) {
			let cell = 0;
			let tries = 0;
			do {
				cell = Random.int(1, w - 1) + Random.int(1, h - 1) * w;
				tries++;
			} while (off[cell] !== growing && tries * 10 < length);

			for (const n of neighbourOffsets9) {
				const at = cell + n;
				if (fillDiff !== 0 && at >= 0 && at < length && off[at] !== growing) {
					off[at] = growing;
					fillDiff += growing ? 1 : -1;
				}
			}
		}
	}

	return off;
}

export interface SpdRoom {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * The first version delegated layout to mwg's deliberately generic room sampler. SPD does
 * not do that: RegularLevel builds a small connected room graph, then each Room paints its
 * own rectangle and the corridors only join room edges. This is the rectangular core of that
 * builder, kept in the SPD game because room classes and their placement rules are game data.
 * The special-room painters can be added here without changing mwg/roguelike.
 */
export function generateSpdDungeon(width: number, height: number, kinds: Roguelike.TerrainKind[], floorSeed: bigint): Roguelike.Level {
	const random = new SpdJavaRandom(spdScramble(floorSeed));
	const level = new Roguelike.Level(width, height, [
		{ passable: false, transparent: false },
		{ passable: true, transparent: true },
		...kinds,
	], 0);
	const rooms: SpdRoom[] = [];
	const attempts = 120;
	const roomCount = 4 + random.nextInt(3); //SewerLevel.standardRooms(): 4-6

	for (let attempt = 0; attempt < attempts && rooms.length < roomCount; attempt++) {
		const roomWidth = 5 + random.nextInt(5);
		const roomHeight = 5 + random.nextInt(5);
		const left = 2 + random.nextInt(Math.max(1, width - roomWidth - 3));
		const top = 2 + random.nextInt(Math.max(1, height - roomHeight - 3));
		const room = { left, top, right: left + roomWidth - 1, bottom: top + roomHeight - 1 };
		if (rooms.some((other) =>
			room.left - 2 <= other.right && room.right + 2 >= other.left &&
			room.top - 2 <= other.bottom && room.bottom + 2 >= other.top
		)) continue;
		rooms.push(room);
	}

	//RegularBuilder's main path is a loop rather than a simple chain. Keep the entrance as the
	//first room, order the remaining rooms around the level centre, and close the loop; this is
	//the rectangular equivalent of LoopBuilder's primary path.
	//SPD Room.paint() keeps the inclusive rectangle's perimeter as wall and paints only
	//room.inside(); corridors then breach that wall at their connection point. Filling the
	//whole rectangle was the source of wide openings and doors placed beside one another.
	for (const room of rooms) {
		for (let y = room.top + 1; y < room.bottom; y++) {
			for (let x = room.left + 1; x < room.right; x++) level.set(x, y, 1);
		}
	}
	if (rooms.length > 2) {
		const centre = rooms.reduce((sum, room) => {
			const at = Roguelike.rectCenter(room);
			return { x: sum.x + at.x, y: sum.y + at.y };
		}, { x: 0, y: 0 });
		centre.x /= rooms.length;
		centre.y /= rooms.length;
		const rest = rooms.slice(1).sort((a, b) => {
			const aa = Roguelike.rectCenter(a);
			const bb = Roguelike.rectCenter(b);
			return Math.atan2(aa.y - centre.y, aa.x - centre.x) - Math.atan2(bb.y - centre.y, bb.x - centre.x);
		});
		rooms.splice(1, rooms.length - 1, ...rest);
	}
	for (let i = 0; i < rooms.length; i++) {
		const from = Roguelike.rectCenter(rooms[i]);
		const to = Roguelike.rectCenter(rooms[(i + 1) % rooms.length]);
		if (random.nextFloat() < 0.5) {
			for (let x = from.x; x !== to.x; x += from.x < to.x ? 1 : -1) level.set(x, from.y, 1);
			for (let y = from.y; y !== to.y; y += from.y < to.y ? 1 : -1) level.set(to.x, y, 1);
		} else {
			for (let y = from.y; y !== to.y; y += from.y < to.y ? 1 : -1) level.set(from.x, y, 1);
			for (let x = from.x; x !== to.x; x += from.x < to.x ? 1 : -1) level.set(x, to.y, 1);
		}
	}
	//LoopBuilder/RegularBuilder add occasional extra connections to create loops. One
	//deterministic cross-link is enough for the small Sewer floor without flooding it with
	//corridors.
	if (rooms.length > 3) {
		const from = Roguelike.rectCenter(rooms[0]);
		const to = Roguelike.rectCenter(rooms[2]);
		for (let x = from.x; x !== to.x; x += from.x < to.x ? 1 : -1) level.set(x, from.y, 1);
		for (let y = from.y; y !== to.y; y += from.y < to.y ? 1 : -1) level.set(to.x, y, 1);
	}
	level.rooms = rooms;
	return level;
}
