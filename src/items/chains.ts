/**
 * Ethereal Chains' grab/pull flow, split out of the scene so it can be checked without a live
 * game - the same split `items/sandals.ts` and `items/talisman.ts` use. Every rule here is
 * `EtherealChains.java` (tag `v3.3.8`); the scene owns the aiming, the pathfinding, the
 * movement and the turn cost.
 *
 * The flow itself (`useChains`'s aimer, `confirmChains`'s reachability split, the enemy pull
 * and the self-grab) lives here too, behind `ChainsFlowContext` - the file-size refactor's
 * tenth extraction, behavior-identical.
 */
import { Roguelike } from 'mwg';
import type { AnyMonsterId } from '../monsters';

export type ChainsItem = {
	level?: number;
	charge?: number;
	partialCharge?: number;
	exp?: number;
	cursed?: boolean;
};

/** An enemy the chains may pull, as the pull pass sees it. */
export interface ChainsEnemy {
	readonly x: number;
	readonly y: number;
	readonly isHero?: boolean;
	readonly kind?: AnyMonsterId;
}

/**
 * The Ethereal Chains' window flow, moved out of the scene behind this context the way the
 * sandals and talisman flows moved before it - behavior-identical, with the scene keeping one
 * builder plus the `useChains` adapter the item-use router calls. The `t` field is deliberately
 * named `t` (bound to the real one) so the `t('...')` key audits keep matching these call sites.
 */
export interface ChainsFlowContext {
	readonly magicImmune: boolean;
	readonly heroPos: { x: number; y: number };
	readonly levelSize: { width: number; height: number };
	readonly heroRooted: boolean;
	chainsOf(instanceId?: string): ChainsItem | undefined;
	beginAim(opts: { range: number; validate: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	isCellExploredOrVisible(x: number, y: number): boolean;
	isCellPassable(x: number, y: number): boolean;
	isImmovableKind(kind: AnyMonsterId | undefined): boolean;
	reachableFromHero(x: number, y: number): boolean;
	traceTo(x: number, y: number): { x: number; y: number }[];
	creatureAt(x: number, y: number): ChainsEnemy | null;
	moveHeroTo(cell: { x: number; y: number }): void;
	pullEnemyTo(enemy: ChainsEnemy, destination: { x: number; y: number }): void;
	shake(): void;
	armEnhancedRings(): void;
	dispelInvisibility(): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `EtherealChains.execute()`: curse/charge gates, then open the cell selector. */
export function useChainsFlow(ctx: ChainsFlowContext, instanceId?: string): void {
	const chains = ctx.chainsOf(instanceId);
	if (!chains || ctx.magicImmune) return;
	if (chains.cursed) { ctx.say(ctx.t('items.artifacts.etherealchains.cursed'), 'negative'); return; }
	if ((chains.charge ?? 0) < 1) { ctx.say(ctx.t('items.artifacts.etherealchains.no_charge'), 'negative'); return; }
	ctx.beginAim({
		range: Math.max(ctx.levelSize.width, ctx.levelSize.height),
		validate: (cell) => ctx.isCellExploredOrVisible(cell.x, cell.y),
		onConfirm: (cell) => confirmChainsFlow(ctx, cell, instanceId),
	});
	ctx.say(ctx.t('items.artifacts.etherealchains.prompt'), 'positive');
}

/** The confirm split: an enemy at the target is pulled, anything else grabs the location. */
export function confirmChainsFlow(ctx: ChainsFlowContext, target: { x: number; y: number }, instanceId?: string): void {
	const chains = ctx.chainsOf(instanceId);
	if (!chains) return;
	if (!ctx.reachableFromHero(target.x, target.y)) {
		ctx.say(ctx.t('items.artifacts.etherealchains.cant_reach'), 'negative');
		return;
	}
	const path = ctx.traceTo(target.x, target.y);
	const enemy = ctx.creatureAt(target.x, target.y);
	if (enemy && !enemy.isHero) chainEnemyFlow(ctx, chains, path, enemy);
	else chainLocationFlow(ctx, chains, target);
}

/** `EtherealChains.chainEnemy`: drag the victim along the aim line toward the hero. */
export function chainEnemyFlow(ctx: ChainsFlowContext, chains: ChainsItem, path: readonly { x: number; y: number }[], enemy: ChainsEnemy): void {
	if (ctx.isImmovableKind(enemy.kind)) {
		ctx.say(ctx.t('items.artifacts.etherealchains.cant_pull'), 'negative');
		return;
	}
	let destination: { x: number; y: number } | null = null;
	for (let i = 1; i < path.length - 1; i++) {
		const cell = path[i];
		if (ctx.isCellPassable(cell.x, cell.y) && !ctx.creatureAt(cell.x, cell.y)) {
			destination = cell;
			break;
		}
	}
	if (!destination) { ctx.say(ctx.t('items.artifacts.etherealchains.does_nothing'), 'negative'); return; }
	const chargeUse = Roguelike.chebyshevDistance(enemy, destination);
	if (chargeUse > (chains.charge ?? 0)) { ctx.say(ctx.t('items.artifacts.etherealchains.no_charge'), 'negative'); return; }
	chains.charge = Math.max(0, (chains.charge ?? 0) - chargeUse);
	ctx.dispelInvisibility();
	ctx.pullEnemyTo(enemy, destination);
	//`EtherealChains.chainEnemy` (tag `v3.3.8`): the pull lands inside the chains'
	//animation callback with `Talent.onArtifactUsed(hero)` and `hero.spendAndNext(1f)`
	//- the turn and the EnhancedRings arming were both missing here (failures return
	//free in Java too, and do here, so only this success path spends).
	ctx.armEnhancedRings();
	ctx.spendTurn();
}

/** `EtherealChains.chainLocation`: pull the hero himself to a grabbable cell. */
export function chainLocationFlow(ctx: ChainsFlowContext, chains: ChainsItem, target: { x: number; y: number }): void {
	if (ctx.heroRooted) {
		ctx.shake();
		ctx.say(ctx.t('items.artifacts.etherealchains.rooted'), 'negative');
		return;
	}
	if (!ctx.isCellPassable(target.x, target.y)) {
		ctx.say(ctx.t('items.artifacts.etherealchains.inside_wall'), 'negative');
		return;
	}
	const solidNearby = Roguelike.neighbourOffsets(8).some(([dx, dy]) => !ctx.isCellPassable(target.x + dx, target.y + dy));
	if (!solidNearby) { ctx.say(ctx.t('items.artifacts.etherealchains.nothing_to_grab'), 'negative'); return; }
	const chargeUse = Roguelike.chebyshevDistance(ctx.heroPos, target);
	if (chargeUse > (chains.charge ?? 0)) { ctx.say(ctx.t('items.artifacts.etherealchains.no_charge'), 'negative'); return; }
	chains.charge = Math.max(0, (chains.charge ?? 0) - chargeUse);
	ctx.dispelInvisibility();
	ctx.moveHeroTo(target);
	//`EtherealChains.chainLocation` (tag `v3.3.8`): same success tail as the enemy
	//pull - `Talent.onArtifactUsed(hero)` then `hero.spendAndNext(1f)` - both missing
	//here for the same reason; rooted/wall/grab/charge failures stay free in Java too.
	ctx.armEnhancedRings();
	ctx.spendTurn();
}
