/**
 * MindForm's synthetic item cast (`MindForm.targetSelector`, tag `v3.3.8`), pure half.
 * Java conjures the picked wand or thrown weapon at `MindForm.itemLevel()` (2 + talent
 * points) and fires it once through the normal zap/throw machinery without touching the
 * hero's real bag: wands arrive full-charged and identified, thrown arrive repaired with
 * `spawnedForEffect` set. This port has no temporary-item path (every cast reads a real
 * bag instance), so the scene fires through its existing level-explicit seams
 * (`fireWandShot(wandType, level, ...)` and the `attack()` throw path) with a conjured
 * level and no ammo/durability/drop bookkeeping - nothing is consumed and nothing drops.
 * The scene supplies geometry and catalog data; this decides gates, levels and targets,
 * and stays import-free so `tools/verifyMindForm.mjs` transpiles it alone.
 */

/** What the picker hands the planner: a wand type or a missile class, by port id. */
export type MindFormEffect =
	| { kind: 'wand'; wandType: string; isMultiCharge: boolean }
	| { kind: 'thrown'; missileClass: string };

/** The conjured level is the live `trinityMindItemLevel()` (2 + talent points),
 * passed in by the caller - never re-derived here, so the mapping stays
 * single-sourced. */

/**
 * `WndUseTrinity`'s Mind button gate: fireable while the armor holds the effect's
 * own charge cost, except a wand under MagicImmune (thrown stays allowed - Java
 * disables only the wand branch there).
 */
export function mindFormCastGate(
	isWand: boolean,
	magicImmune: boolean,
	armorCharge: number,
	cost: number,
): 'ok' | 'warded' | 'charges' {
	if (isWand && magicImmune) return 'warded';
	if (armorCharge < cost) return 'charges';
	return 'ok';
}

export interface MindFormAim {
	heroCell: { x: number; y: number };
	aimCell: { x: number; y: number };
	collisionCell: { x: number; y: number };
	aimOccupied: boolean;
	collisionOccupied: boolean;
}

export type MindFormTarget =
	| { status: 'ok'; target: 'aim' | 'collision' }
	| { status: 'refused'; reason: 'self' | 'empty' };

/**
 * `targetSelector.onSelect()`: aiming at (or colliding with) the hero's own cell
 * refuses with the wand `self_target` line; otherwise Java targets the occupant at
 * the aimed cell, else the one at the collision cell, else fires at the bare cell.
 * This port's targeting is creature-based everywhere (see the section-8 audit), so
 * the bare-cell outcome is a refusal, not a terrain zap - stated, not silent.
 */
export function resolveMindFormAim(aim: MindFormAim): MindFormTarget {
	const same = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x === b.x && a.y === b.y;
	if (same(aim.aimCell, aim.heroCell) || same(aim.collisionCell, aim.heroCell)) {
		return { status: 'refused', reason: 'self' };
	}
	if (aim.aimOccupied) return { status: 'ok', target: 'aim' };
	if (aim.collisionOccupied) return { status: 'ok', target: 'collision' };
	return { status: 'refused', reason: 'empty' };
}
