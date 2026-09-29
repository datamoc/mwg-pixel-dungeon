import type { DungeonScene } from '../dungeonScene';
import type { Creature } from '../../combat';
import { IMMOVABLE_KINDS } from '../../monsters';
import { spawnTrapSpecks } from '../../ui/effectBursts';

const NEIGHBOURS9: ReadonlyArray<readonly [number, number]> = [
	[0, 0], [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];

/** Scene methods for `PitfallTrap.DelayedPit` (`levels/traps/PitfallTrap.java`, tag `v3.3.8`). */
export const pitfallCollapseMethods = {
	schedulePitfallCollapse(this: DungeonScene, x: number, y: number): void {
		const cells: number[] = [];
		for (const [dx, dy] of NEIGHBOURS9) {
			const px = x + dx, py = y + dy;
			if (!this.level.inside(px, py)) continue;
			//Java DelayedPit snapshots NEIGHBOURS9 cells that are non-solid or passable.
			//This port treats pits as passable for hero collision and keeps their identity separate.
			if (this.level.passable(px, py) || this.isChasmCell(px, py)) cells.push(this.level.index(px, py));
		}
		if (cells.length > 0) this.pendingPitfallCollapses.push(cells);
	},

	/**
	 * Resolve after the automatic actors have taken their intervening turns, before new input.
	 * Java schedules `DelayedPit` as a one-turn Buff actor; the port has no independently timed
	 * buff actor, so this uses the scene's completed automatic-actor phase as that one-turn boundary.
	 * A fast mob that takes extra scheduler turns can therefore act before collapse here.
	 */
	resolvePendingPitfallCollapses(this: DungeonScene): boolean {
		const pending = this.pendingPitfallCollapses.splice(0);
		let heroFalls = false;
		for (const cells of pending) {
			for (const cell of cells) {
				const x = cell % this.level.width, y = Math.floor(cell / this.level.width);
				if (!this.level.inside(x, y) || (!this.level.passable(x, y) && !this.isChasmCell(x, y))) continue;
				if (this.fov.isVisible(x, y)) spawnTrapSpecks(this.effectLayer, this.effectBursts, x, y, 'pitfall');
				const target: Creature | null = this.creatureAt(x, y);
				if (target && !target.flying && target.buffs['levitation'] === undefined
					&& !(target.isNPC && target.kind !== undefined && IMMOVABLE_KINDS.has(target.kind))) {
					if (target.isHero) heroFalls = true;
					else {
						//Java `Chasm.mobFall` prolongs HazardAssistTracker before `Mob.die(Chasm.class)`.
						this.markHazardMob(target);
						this.kill(target, 'falling');
					}
				}
				//Java drops every ordinary heap payload into Dungeon.droppedItems, but
				//leaves for-sale, locked-chest and crystal-chest heaps intact.
				for (const heap of this.heapItemsAt(x, y)) {
					if (heap.forSale || heap.chest === 'locked' || heap.chest === 'crystal') continue;
					if (heap.item) this.dropToChasm(heap.kind, heap.item, heap.chest);
					this.removeGroundItem(heap);
				}
			}
		}
		if (!heroFalls || this.hero.buffs['levitation']) return false;
		//Java processes every cell first and calls Chasm.heroFall last.
		this.pitfallDrop();
		return true;
	},
};
