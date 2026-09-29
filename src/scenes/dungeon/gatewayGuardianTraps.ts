import type { DungeonScene } from '../dungeonScene';
import { Random } from 'mwg';
import { TILE } from '../../dungeonConstants';
import { t } from '../../i18n/index';
import type { Step } from '../../combat';
import { IMMOVABLE_KINDS, type MonsterId } from '../../monsters';
//Moved verbatim from `environmentFireTraps.ts` (file-budget headroom for the R007/R075 hazard marking):
//`GatewayTrap.activate()` and `GuardianTrap.activate()`.
export const gatewayGuardianTrapMethods = {
	/**
	 * `GatewayTrap.activate()` (`levels/traps/GatewayTrap.java`, tag `v3.3.8`), shared by the
	 * hero and mob step paths. The trap is reusable (`disarmedByActivation = false` - the
	 * callers skip the spent set for this kind), and its `telePos` link lives on the scene
	 * (`gatewayTelePos`, floor-scoped and persisted). First trigger links the trap: the first
	 * char in `NEIGHBOURS9` order (Java's top-left-to-bottom-right offsets, center fifth) is
	 * sent to a random respawn cell - or, if no char teleports, the first loose heap is
	 * relocated there instead - and that destination is recorded. Every trigger (including
	 * the linking one) then gathers everything in the trap's own 3x3 around the recorded
	 * cell: chars ride `teleportToLocation` onto free cells around it (center preferred),
	 * heaps are dropped on it. Stated simplifications: LARGE chars' `openSpace` shortlist has
	 * no counterpart here (a size property exists now - `LARGE_KINDS` - but this draw still doesn't gate; everyone draws from the one shuffled list);
	 * heap stacking collapses to one payload per cell (a blocked destination leaves the heap
	 * where it is); `Honeypot.ShatteredPot`'s pot-link move has no counterpart (no shattered
	 * pot item here); the TELEPORT sample/speck presentation is the shared appear effect.
	 */
	activateGatewayTrap(this: DungeonScene, x: number, y: number): void {
		const trapCell = this.level.index(x, y);
		//Java's `PathFinder.NEIGHBOURS9` order: top-left to bottom-right, center fifth.
		const around9: ReadonlyArray<readonly [number, number]> = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
		if (!this.gatewayTelePos.has(trapCell)) {
			for (const [dx, dy] of around9) {
				const cx = x + dx, cy = y + dy;
				if (!this.level.inside(cx, cy)) continue;
				const ch = this.creatureAt(cx, cy);
				if (ch && ch.hp > 0) {
					if (ch.isHero || (ch.kind !== undefined && !IMMOVABLE_KINDS.has(ch.kind as MonsterId))) {
						const destination = this.randomFreeCell(ch);
						if (destination) {
							const hunting = !ch.isHero && (ch.seesHero || ch.lastSeen !== undefined);
							const from = { x: ch.x, y: ch.y };
							if (ch.isHero) {
								delete ch.buffs['roots'];
								this.travelTarget = null;
								this.moveTo(ch, destination);
							} else {
								ch.x = destination.x;
								ch.y = destination.y;
								this.sprite(ch).position.set(destination.x * TILE, destination.y * TILE);
								ch.seesHero = false;
								ch.lastSeen = undefined;
							}
							this.playTeleportAppear(from, destination, ch);
							if (hunting) this.markHazardMob(ch);
							this.gatewayTelePos.set(trapCell, this.level.index(destination.x, destination.y));
							break;
						}
					}
				}
				const heap = this.groundItemAt(cx, cy);
				if (heap) {
					let destination: Step | undefined;
					for (let attempt = 0; attempt < 5 && !destination; attempt++) {
						const candidate = this.randomFreeCell({ x, y });
						if (candidate && !this.groundItemAt(candidate.x, candidate.y)) destination = candidate;
					}
					if (destination) {
						const { kind, item, chest, forSale } = heap;
						this.removeGroundItem(heap);
						this.spawnGroundItem(kind, destination.x, destination.y, item, chest, forSale);
						if (this.groundItemAt(destination.x, destination.y)) {
							this.gatewayTelePos.set(trapCell, this.level.index(destination.x, destination.y));
							break;
						}
					}
				}
			}
		}
		const linked = this.gatewayTelePos.get(trapCell);
		if (linked === undefined) return;
		const lx = linked % this.level.width, ly = Math.floor(linked / this.level.width);
		//Java's `NEIGHBOURS8` order (same ring minus the center), shuffled, with the free
		//center itself prepended - so the center wins when it is open.
		const ring8: ReadonlyArray<readonly [number, number]> = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
		const telePositions: Step[] = [];
		for (const [dx, dy] of ring8) {
			const px = lx + dx, py = ly + dy;
			if (this.level.inside(px, py) && this.level.passable(px, py) && !this.creatureAt(px, py)) telePositions.push({ x: px, y: py });
		}
		Random.shuffle(telePositions);
		if (this.level.inside(lx, ly) && this.level.passable(lx, ly) && !this.creatureAt(lx, ly)) telePositions.unshift({ x: lx, y: ly });
		for (const [dx, dy] of around9) {
			const cx = x + dx, cy = y + dy;
			if (!this.level.inside(cx, cy)) continue;
			const ch = this.creatureAt(cx, cy);
			if (ch && ch.hp > 0 && (ch.isHero || (ch.kind !== undefined && !IMMOVABLE_KINDS.has(ch.kind as MonsterId)))) {
				const next = telePositions.shift();
				if (!next) continue;
				const from = { x: ch.x, y: ch.y };
				//`teleportToLocation` refuses an occupied or impassable cell - the list only
				//holds free passable cells, so it always lands; Roots still detaches.
				if (ch.isHero) {
					delete ch.buffs['roots'];
					this.travelTarget = null;
					this.moveTo(ch, next);
				} else {
					ch.x = next.x;
					ch.y = next.y;
					this.sprite(ch).position.set(next.x * TILE, next.y * TILE);
					ch.seesHero = false;
					ch.lastSeen = undefined;
				}
				this.playTeleportAppear(from, next, ch);
			}
			const heap = this.groundItemAt(cx, cy);
			if (heap && !this.groundItemAt(lx, ly)) {
				const { kind, item, chest, forSale } = heap;
				this.removeGroundItem(heap);
				this.spawnGroundItem(kind, lx, ly, item, chest, forSale);
				if (!this.groundItemAt(lx, ly)) this.spawnGroundItem(kind, cx, cy, item, chest, forSale);
				else this.playTeleportAppear({ x: cx, y: cy }, { x: lx, y: ly }, this.hero);
			}
		}
	},

	/**
	 * `GuardianTrap.activate()` (`levels/traps/GuardianTrap.java`, tag `v3.3.8`), shared by
	 * the hero and mob step paths: every mob is beckoned to the trap cell (Java's `beckon`
	 * wakes and, unless hunting/fleeing, retargets to wandering - the port's `lastSeen`
	 * retarget with the same guards), the alarm line logs when visible, and
	 * `(scalingDepth() - 5) / 5` guardians (Java integer division, truncating toward zero -
	 * none below depth 6) arrive on random respawn cells, awake and beckoned to the hero.
	 * Stated simplifications: the guardians are ordinary depth-scaled statues (Java's
	 * `Guardian extends Statue` rolls a fresh uncursed level-0 unenchanted melee weapon per
	 * spawn - this port's statue damage comes from its depth table, with no per-instance
	 * weapon to roll); the ALERT sample and SCREAM specks have no layer here; the blue tint
	 * on `GuardianSprite` has no sprite layer to carry it.
	 */
	activateGuardianTrap(this: DungeonScene, x: number, y: number): void {
		for (const mob of this.creatures) {
			if (mob.isHero || mob.isNPC || mob.isAlly || mob.hp <= 0) continue;
			mob.sleeping = false;
			if (!mob.fleeing && !mob.seesHero) mob.lastSeen = { x, y };
		}
		if (this.fov.isVisible(x, y)) this.say(t('levels.traps.guardiantrap.alarm'), 'warning');
		//`scalingDepth()` is `this.depth` everywhere else in this port; Java's `(d - 5) / 5`
		//is integer division truncating toward zero, so depths 1-9 spawn nothing.
		const count = Math.max(0, Math.trunc((this.depth - 5) / 5));
		for (let i = 0; i < count; i++) {
			const at = this.randomFreeCell({ x, y });
			if (!at) continue;
			const guardian = this.spawnMonster('statue', at, false);
			guardian.sleeping = false;
			guardian.seesHero = false;
			guardian.lastSeen = { x: this.hero.x, y: this.hero.y };
			this.playTeleportAppear(at, at, guardian);
		}
	},
};
