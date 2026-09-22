/**
 * A view of the level for PATHING that treats a shut, unlocked, non-secret door as passable.
 *
 * Java's `DOOR` is passable and a mob opens it by walking in (`Level.occupyCell` -> `Door.enter`);
 * this port models a shut door as an impassable terrain the hero bumps open, so a route across one
 * simply did not exist for the pathfinder: a mob hunting the hero lost its path the moment he
 * went through a door (which shuts behind him) and gave up on the spot. Only pathing is widened -
 * spawning, item drops, teleports and the hero's own bump-to-open keep reading the plain terrain,
 * and `moveTo` opens the door under whoever steps there.
 */
interface LevelLike {
	passable(x: number, y: number): boolean;
	inside(x: number, y: number): boolean;
}

export function doorAwareLevel<L extends LevelLike>(
	level: L,
	doors: { isDoor(x: number, y: number): boolean; isOpen(x: number, y: number): boolean; isLocked(x: number, y: number): boolean },
	secrets: { isSecret(x: number, y: number): boolean },
): L {
	return Object.create(level, {
		passable: {
			value: (x: number, y: number) => level.passable(x, y)
				|| (level.inside(x, y) && doors.isDoor(x, y) && !doors.isOpen(x, y) && !doors.isLocked(x, y) && !secrets.isSecret(x, y)),
		},
	}) as L;
}
