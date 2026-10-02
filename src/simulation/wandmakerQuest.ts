/**
 * Pure decision half of Java's `Wandmaker.Quest.spawnRoom()`
 * (`actors/mobs/npcs/Wandmaker.java`, tag `v3.3.8`). Keeping the short-circuit and
 * lazy integer rolls here lets the quest gate be compared independently of the
 * deliberately reduced room-generation RNG sequence.
 */
export interface WandmakerSpawnDecision {
	spawnRoom: boolean;
	type: number;
}

export function wandmakerSpawnDecision(
	type: number,
	spawned: boolean,
	depth: number,
	int: (max: number) => number,
): WandmakerSpawnDecision {
	const spawnRoom = !spawned && (type !== 0 || (depth > 6 && int(10 - depth) === 0));
	return {
		spawnRoom,
		type: spawnRoom && type === 0 ? int(3) + 1 : type,
	};
}
