/**
 * The Honeypot's throw/shatter flow, split out of the scene so it can be checked without
 * a live game - the same split the brew flow uses (`simulation/brews.ts`): aim through
 * the bomb's gate, then break at the pending cell. The scene owns the aiming, the floor,
 * the bee spawn and the turn.
 *
 * The flow itself lives here, behind `HoneypotFlowContext` - the file-size refactor's
 * twenty-second extraction, behavior-identical.
 */
import { Roguelike } from 'mwg';

/** Whoever stands on the landing cell: the bee's first suspect, unless it is an NPC. */
export interface PotOccupantView {
	id: string;
	isNPC?: boolean | undefined;
}

/**
 * The honeypot throw/shatter flow, moved out of the scene behind this context the way
 * the brew flow moved before it - behavior-identical, with the scene keeping one
 * builder plus the `useHoneypot` adapter the item-use router calls. The pending-aim
 * cell, the bee release and the turn stay scene-side; this flow only decides them.
 */
export interface HoneypotFlowContext {
	hasPot(instanceId?: string): boolean;
	consumePot(instanceId?: string): void;
	beginAim(opts: { range: number; validate: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	canTargetCell(x: number, y: number): boolean;
	get pendingTarget(): { x: number; y: number } | null;
	set pendingTarget(cell: { x: number; y: number } | null);
	occupantAt(x: number, y: number): PotOccupantView | null;
	isSpawnFree(x: number, y: number): boolean;
	/** Spawn at `at`, but anchor Java's ShatteredPot at the original target cell. */
	releaseBee(at: { x: number; y: number }, potPos: { x: number; y: number }, holderId: string | null): void;
	spendTurn(): void;
}

/** The honeypot throw: same aim gate and range as the bomb and the brews (passable,
 * non-chasm, six cells). A confirmed aim re-enters here with the cell pending, so the
 * pot breaks at once. */
export function useHoneypotFlow(ctx: HoneypotFlowContext, instanceId?: string): void {
	if (!ctx.hasPot(instanceId)) return;
	if (!ctx.pendingTarget) {
		ctx.beginAim({
			range: 6,
			validate: (cell) => ctx.canTargetCell(cell.x, cell.y),
			onConfirm: (cell) => {
				ctx.pendingTarget = cell;
				useHoneypotFlow(ctx, instanceId);
			},
		});
		return;
	}
	const target = ctx.pendingTarget;
	ctx.pendingTarget = null;
	shatterHoneypotFlow(ctx, target, instanceId);
}

/** `Honeypot.shatter(owner, pos)`: detach one pot, break it at the cell (or a free
 * cardinal neighbour when occupied - the ShatteredPot item Java drops is unmodeled, so
 * nothing lands), and release the bee with `setPotInfo`. No free cell means no bee and
 * the pot stays, exactly like Java returning the pot itself. Silent either way - Java
 * logs nothing on the shatter. Spends the hero's turn like both Java actions. */
export function shatterHoneypotFlow(ctx: HoneypotFlowContext, at: { x: number; y: number }, instanceId?: string): void {
	//`shatter`'s owner is whoever stands on the landing cell (the bee's first suspect);
	//an empty cell breaks ownerless (`setPotInfo(pos, null)` - no holder, a ground pot).
	const occupant = ctx.occupantAt(at.x, at.y);
	const cands = occupant
		? Roguelike.neighbourOffsets(4).map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy }))
		: [at];
	const free = cands.find((cell) => ctx.isSpawnFree(cell.x, cell.y));
	if (!free) return;
	ctx.consumePot(instanceId);
	//Java's `Honeypot.shatter()` sets `Bee.potPos` to the original `pos`, even when
	//the bee must spawn on a free cardinal neighbour. Keeping those cells separate is
	//important: the bee hunts around the broken pot, not around its spawn cell.
	ctx.releaseBee(free, at, occupant && !occupant.isNPC ? occupant.id : null);
	ctx.spendTurn();
}
