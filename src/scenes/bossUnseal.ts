import type { Step } from '../simulation/combatState';
import { CAVES_EXIT_CELL, CITY_BOTTOM_DOOR, CITY_EXIT_CELL, CITY_IMP_SHOP, CITY_TOP_DOOR, HALLS_EXIT_CELL } from '../spdLevelGen/bossLevels';
import { CAVES_GATE } from '../spdLevelGen/cavesBossVisuals';
import { Terrain, type PaintLevel } from '../spdLevelGen/paintLevel';

/**
 * What the boss `unseal()`s need from the scene. Extracted from `DungeonScene` (behavior-identical
 * apart from the Sewer exit fix on `unlockPaintedExit`); the scene owns the paint, the tile layers
 * and the stairs sprite, so it hands them over as callbacks and this module stays free of scene
 * types and import cycles.
 */
export interface BossUnsealContext {
	depth: number;
	width: number;
	paint: PaintLevel | null;
	/** the arena's entrance cell, restored to `ENTRANCE` by the Sewer/Caves/Halls unseals */
	entrance: Step | null;
	inside: (x: number, y: number) => boolean;
	markUnsealed: (depth: number) => void;
	wasUnsealed: (depth: number) => boolean;
	/** `Level.set(cell, FLOOR)` for the cell (the scene's collision grid) */
	makeFloor: (x: number, y: number) => void;
	restitch: (x: number, y: number) => void;
	/** repaint the terrain tile layer from the live paint (a no-op before the map exists) */
	refreshTerrain: () => void;
	refreshWater: () => void;
	/** register a closed, unlocked door in `Doors` and restitch it */
	placeDoor: (at: Step) => void;
	openStairs: (at: Step, draw?: boolean) => void;
	clearCavesEnergy: () => void;
	refreshCavesArena: () => void;
	refreshHallsCenter: () => void;
	/** the Imp quest is complete and the exit-hall shop keeper has not been spawned yet */
	impShopDue: () => boolean;
	spawnImpShop: (at: Step) => void;
}

const cellOf = (ctx: BossUnsealContext, x: number, y: number): number => y * ctx.width + x;

/** First painted `EXIT` tile, for floors whose exit Java paints at `build()`. */
export function exitCellFromPaint(ctx: BossUnsealContext): Step | null {
	if (!ctx.paint) return null;
	const cell = ctx.paint.map.indexOf(Terrain.EXIT);
	return cell >= 0 ? { x: cell % ctx.width, y: Math.floor(cell / ctx.width) } : null;
}

/**
 * The Sewer boss floor's exit cell. `SewerBossExitRoom.paint()` (tag `v3.3.8`) paints it
 * `LOCKED_EXIT` and never converts it: Java's way out is the `LevelTransition` rect around that
 * niche, gated by `LockedFloor` until the boss dies. This port models every boss exit as a
 * walkable `EXIT` stairs cell, and `exitCellFromPaint` only ever found a painted `EXIT` - which
 * this floor never has - so killing Goo opened no way down and the run dead-ended on depth 5.
 * The locked niche is therefore turned into the stairs cell here (the hero reaches it from the
 * exit room's floor row below). Idempotent: a reload repair calls it again on the regenerated paint.
 */
export function unlockPaintedExit(ctx: BossUnsealContext): Step | null {
	const painted = exitCellFromPaint(ctx);
	if (painted || !ctx.paint) return painted;
	const cell = ctx.paint.map.indexOf(Terrain.LOCKED_EXIT);
	if (cell < 0) return null;
	const at = { x: cell % ctx.width, y: Math.floor(cell / ctx.width) };
	ctx.paint.map[cell] = Terrain.EXIT;
	ctx.makeFloor(at.x, at.y);
	ctx.restitch(at.x, at.y);
	ctx.refreshTerrain();
	return at;
}

/** Restores the drowned/walled entrance to `ENTRANCE` (Sewer, Caves and Halls unseals share it). */
function restoreEntrance(ctx: BossUnsealContext): void {
	if (!ctx.entrance || !ctx.paint) return;
	ctx.paint.map[cellOf(ctx, ctx.entrance.x, ctx.entrance.y)] = Terrain.ENTRANCE;
	ctx.makeFloor(ctx.entrance.x, ctx.entrance.y);
	ctx.restitch(ctx.entrance.x, ctx.entrance.y);
}

/**
 * Re-applies the stairs half after a load: `hasStairs`/`stairs` live outside the floor capture,
 * so a run reloaded onto an unsealed boss floor would otherwise come back with Java's exit
 * underfoot and no way to take it. The paint writes are already repaired in `enterLevel`; the
 * terrain and doors come back via `restoreFloor`. Runs saved before any `unseal()` existed simply
 * never carry the depth in the set, so there is nothing to migrate.
 */
export function repairBossUnsealStairs(ctx: BossUnsealContext): void {
	if (!ctx.wasUnsealed(ctx.depth)) return;
	if (ctx.depth !== 5 && ctx.depth !== 15 && ctx.depth !== 20 && ctx.depth !== 25) return;
	const at = ctx.depth === 5 ? unlockPaintedExit(ctx) ?? undefined
		: ctx.depth === 15 ? CAVES_EXIT_CELL : ctx.depth === 20 ? CITY_EXIT_CELL : HALLS_EXIT_CELL;
	if (at && ctx.inside(at.x, at.y)) ctx.openStairs(at, false);
}

/**
 * `SewerBossLevel.unseal()` (tag `v3.3.8`): the drowned entrance is restored to `ENTRANCE` and the
 * floor gains its walkable exit. Unowned halves, each named where it belongs: the `LockedFloor`
 * buff that actually bars Java's way out (this port's exit is the stairs, gated on the boss's
 * death the same way), the boss-challenge-badge flag (Rankings work) and the ripple presentation.
 */
export function applyGooDeathUnseal(ctx: BossUnsealContext): void {
	ctx.markUnsealed(5);
	restoreEntrance(ctx);
	ctx.refreshTerrain();
	ctx.refreshWater();
	const exit = unlockPaintedExit(ctx);
	if (exit) ctx.openStairs(exit);
}

/**
 * `CavesBossLevel.unseal()` (tag `v3.3.8`): the walled entrance is restored, the gate's five
 * `CUSTOM_DECO` cells break to `EMPTY`, the pylon energy clears and the arena visuals re-map to
 * the broken frames (`32..36`). `gateIntact` in the visual context reads the live paint, so it is
 * whole until exactly here. Unowned: the `BlastParticle` bursts, the music fade and
 * `Dungeon.observe()` (this port re-observes on every move already).
 */
export function applyDM300DeathUnseal(ctx: BossUnsealContext): void {
	ctx.markUnsealed(15);
	ctx.clearCavesEnergy();
	restoreEntrance(ctx);
	if (ctx.paint) {
		for (let x = CAVES_GATE.left; x < CAVES_GATE.right; x++) {
			ctx.paint.map[cellOf(ctx, x, CAVES_GATE.top)] = Terrain.EMPTY;
			ctx.makeFloor(x, CAVES_GATE.top);
			ctx.restitch(x, CAVES_GATE.top);
		}
	}
	ctx.refreshCavesArena();
	ctx.refreshTerrain();
	ctx.openStairs(CAVES_EXIT_CELL);
}

/**
 * `CityBossLevel.unseal()` (tag `v3.3.8`): both arena doors open and, when the Imp quest is
 * complete, the shop spawns in the exit hallway. The keeper is the real `ImpShopkeeper` kind,
 * standing on the shop rect's own pedestal with a depth-20 shelf from the live shop stock.
 * Unowned: the music fade and `Dungeon.observe()` (same standing note as every other unseal).
 */
export function applyKingDeathUnseal(ctx: BossUnsealContext): void {
	ctx.markUnsealed(20);
	if (ctx.paint) {
		ctx.paint.map[cellOf(ctx, CITY_BOTTOM_DOOR.x, CITY_BOTTOM_DOOR.y)] = Terrain.DOOR;
		ctx.paint.map[cellOf(ctx, CITY_TOP_DOOR.x, CITY_TOP_DOOR.y)] = Terrain.DOOR;
	}
	ctx.placeDoor(CITY_BOTTOM_DOOR);
	ctx.placeDoor(CITY_TOP_DOOR);
	if (ctx.impShopDue()) ctx.spawnImpShop({ x: CITY_IMP_SHOP.left + 4, y: CITY_IMP_SHOP.top + 4 });
	ctx.openStairs(CITY_EXIT_CELL);
}

/**
 * `HallsBossLevel.unseal()` (tag `v3.3.8`): the entrance is restored, the exit becomes a real
 * `EXIT` tile, and the centre pieces swap to their portal/archway variant. Unowned: the
 * `ShadowParticle` bursts and the `THEME_FINALE` music fade (no one-shot particle hook and no
 * music-swap primitive here - the vault plays its own theme on entry either way).
 */
export function applyYogDeathUnseal(ctx: BossUnsealContext): void {
	ctx.markUnsealed(25);
	restoreEntrance(ctx);
	if (ctx.paint) {
		ctx.paint.map[cellOf(ctx, HALLS_EXIT_CELL.x, HALLS_EXIT_CELL.y)] = Terrain.EXIT;
		ctx.makeFloor(HALLS_EXIT_CELL.x, HALLS_EXIT_CELL.y);
		ctx.restitch(HALLS_EXIT_CELL.x, HALLS_EXIT_CELL.y);
	}
	ctx.refreshHallsCenter();
	ctx.refreshTerrain();
	ctx.openStairs(HALLS_EXIT_CELL);
}
