import type { DungeonScene } from '../../dungeonScene';
import { Random } from 'mwg';
import { t } from '../../../i18n/index';
import { DOOR, DOOR_CLOSED, ITEM_FRAME, WALL } from '../../../dungeonConstants';
import { Terrain } from '../../../spdLevelGen/paintLevel';
import { mwlItemEffectValue } from '../../../mwlContent';
import { IMMOVABLE_KINDS } from '../../../monsters';
import { ringEnergyMultiplier } from '../../../items/ringModifiers';
import {
	CIRCLE8, newKeyReplacementTracker, processKeyLockOpened, skeletonKeyTickRecharge, useSkeletonKeyFlow,
	type KeyLockKind, type SkeletonKeyFlowContext, type SkeletonKeyItem, type SkeletonKeyTarget,
} from '../../../items/skeletonKey';

/** The door registry's lock id for a door the skeleton key shut (Java's `Terrain.HERO_LKD_DR`). */
export const HERO_LOCK_ID = 'heroLock';

/**
 * Scene side of `items/artifacts/SkeletonKey.java` (tag `v3.3.8`): the rules live in
 * `items/skeletonKey.ts` behind `SkeletonKeyFlowContext`; this file owns the terrain, doors,
 * chests, temporary walls (`SkeletonKey.KeyWall`) and the `KeyReplacementTracker` journal.
 */
export const skeletonKeyMethods = {
	skeletonKeyItem(this: DungeonScene, instanceId?: string) {
		return this.bag.find('skeletonkey', instanceId) as (typeof this.bag.items[number] & SkeletonKeyItem) | undefined;
	},

	useSkeletonKey(this: DungeonScene, instanceId?: string): void {
		useSkeletonKeyFlow(this.skeletonKeyFlowContext(), instanceId);
	},

	/** What the targeter sees at a cell: `Terrain.LOCKED_EXIT`/`LOCKED_DOOR`/`HERO_LKD_DR`/`CRYSTAL_DOOR`/doors or the heap type. */
	skeletonKeyTargetAt(this: DungeonScene, x: number, y: number): SkeletonKeyTarget {
		const idx = this.level.index(x, y);
		if (this.portedPaint?.map[idx] === Terrain.LOCKED_EXIT) return 'lockedExit';
		if (this.doors.isDoor(x, y) && !this.secrets.isSecret(x, y)) {
			if (!this.doors.isLocked(x, y)) return 'door';
			if (this.crystalDoorCells.has(idx)) return 'crystalDoor';
			return this.doors.requiredKey(x, y) === HERO_LOCK_ID ? 'heroLockedDoor' : 'lockedDoor';
		}
		const chest = this.groundItemAt(x, y)?.chest;
		if (chest === 'locked') return 'lockedChest';
		if (chest === 'crystal') return 'crystalChest';
		return 'other';
	},

	skeletonKeyFlowContext(this: DungeonScene): SkeletonKeyFlowContext {
		const scene = this;
		return {
			get magicImmune() { return scene.hero.magicImmune === true; },
			get heroPos() { return { x: scene.hero.x, y: scene.hero.y }; },
			get levelLocked() { return scene.floorLocked(); },
			get levelSize() { return { width: scene.level.width, height: scene.level.height }; },
			keyOf: (instanceId?: string) => scene.skeletonKeyItem(instanceId),
			beginAim: (opts) => scene.beginAiming(opts),
			isCellKnown: (x, y) => scene.fov.isExplored(x, y) || scene.fov.isVisible(x, y),
			targetAt: (x, y) => scene.skeletonKeyTargetAt(x, y),
			isSolid: (x, y) => !scene.level.inside(x, y) || (!scene.level.passable(x, y) && scene.level.get(x, y) !== DOOR_CLOSED),
			isOpenSpace: (x, y) => scene.level.passable(x, y),
			mobAt: (x, y) => {
				const mob = scene.creatureAt(x, y);
				if (!mob || mob.isHero) return null;
				return { enemy: !mob.isAlly, immovable: mob.kind !== undefined && IMMOVABLE_KINDS.has(mob.kind), large: false };
			},
			trueDistance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
			openLock: (cell, kind) => scene.skeletonKeyOpenLock(cell, kind),
			lockDoor: (cell) => scene.skeletonKeyLockDoor(cell),
			pushMob: (from, to) => {
				const mob = scene.creatureAt(from.x, from.y);
				if (mob && !mob.isHero) scene.moveTo(mob, to);
			},
			placeWall: (cell, knockback) => scene.skeletonKeyPlaceWall(cell, knockback),
			noteLockOpened: (kind) => scene.skeletonKeyNoteLockOpened(kind),
			armEnhancedRings: () => scene.armEnhancedRingsFromArtifact(),
			dispelInvisibility: () => { delete scene.hero.buffs['invisibility']; },
			observe: () => { scene.fov.update(scene.hero.x, scene.hero.y, scene.viewRadius()); },
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
			say: scene.say.bind(scene),
			t,
		};
	},

	/**
	 * The `targeter`'s `Level.set(..)`/`Heap.open()` step. Iron and hero-locked doors become a shut,
	 * unlocked door (Java's `Terrain.DOOR`, which opens on bump); a crystal door does too - Java turns
	 * it into `Terrain.EMPTY`, and the port's own real-key path also just unlocks it, so both keep
	 * one door. A chest loses its lock flag and shows its contents' art, as `Heap.open` does.
	 */
	skeletonKeyOpenLock(this: DungeonScene, cell: { x: number; y: number }, kind: 'iron' | 'hero' | 'crystal' | 'goldChest' | 'crystalChest'): void {
		if (kind === 'goldChest' || kind === 'crystalChest') {
			const chest = this.groundItemAt(cell.x, cell.y);
			if (!chest) return;
			chest.chest = undefined;
			const sprite = this.spriteFor.get(chest.id);
			if (sprite) sprite.texture = this.itemsSheet.get(ITEM_FRAME[chest.kind]);
			//`Heap.open()` rolls the Wealth bonus into the opened chest, like the key path.
			this.tryWealthBonusDrop(this.hero, 1);
			return;
		}
		this.doors.unlock(cell.x, cell.y);
		if (kind === 'crystal') this.crystalDoorCells.delete(this.level.index(cell.x, cell.y));
		this.restitchTilesAround(cell.x, cell.y);
	},

	/**
	 * `Level.set(target, Terrain.HERO_LKD_DR)`: a door shut and locked by the key. Items lying in the
	 * doorway are thrown to random passable neighbours, as Java scatters the heap's contents (this
	 * port holds one item per cell, so an occupied neighbour is skipped).
	 */
	skeletonKeyLockDoor(this: DungeonScene, cell: { x: number; y: number }): void {
		this.doors.place(cell.x, cell.y, { open: DOOR, closed: DOOR_CLOSED, locked: HERO_LOCK_ID, startOpen: false });
		this.level.set(cell.x, cell.y, DOOR_CLOSED);
		const heap = this.groundItemAt(cell.x, cell.y);
		if (heap) {
			const candidates = CIRCLE8.map(([dx, dy]) => ({ x: cell.x + dx, y: cell.y + dy }))
				.filter((c) => this.level.inside(c.x, c.y) && this.level.passable(c.x, c.y) && !this.groundItemAt(c.x, c.y));
			if (candidates.length > 0) {
				const to = candidates[Random.int(0, candidates.length)]!;
				heap.x = to.x;
				heap.y = to.y;
				const sprite = this.spriteFor.get(heap.id);
				if (sprite) { sprite.x = to.x * 16; sprite.y = to.y * 16; }
			}
		}
		this.restitchTilesAround(cell.x, cell.y);
	},

	/**
	 * `SkeletonKey.placeWall` + `KeyWall`: a solid cell for `wallTurns` turns. Java keeps the terrain
	 * and overlays `solid`/`losBlocking` flags from a blob; this port swaps the cell's terrain to a
	 * wall and remembers the original (`keyWalls`, persisted with the floor) so it can be put back.
	 * An enemy standing there is shoved one cell along the aim direction first (`throwChar(.., 1)`).
	 */
	skeletonKeyPlaceWall(this: DungeonScene, cell: { x: number; y: number }, knockback: readonly [number, number]): void {
		if (!this.level.inside(cell.x, cell.y)) return;
		const idx = this.level.index(cell.x, cell.y);
		const existing = this.keyWalls.get(idx);
		const solid = !this.level.passable(cell.x, cell.y) && this.level.get(cell.x, cell.y) !== DOOR_CLOSED;
		if (solid && !existing) return;
		const turns = mwlItemEffectValue('skeletonkey', 'wallTurns');
		if (existing) { existing.turns = turns; return; }
		const mob = this.creatureAt(cell.x, cell.y);
		//`Mimic.act()`/`CrystalMimic` keep hidden mobs `NEUTRAL` until revealed
		//(`Mimic.java`/`CrystalMimic.java`, tag `v3.3.8`), so Java's ENEMY-only
		//`SkeletonKey.placeWall()` does not shove them. `mimicRevealed` carries that
		//alignment boundary in this port; revealed mimics follow the ordinary enemy path.
		const hiddenMimic = (mob?.kind === 'mimic' || mob?.kind === 'crystalMimic') && mob.mimicRevealed === false;
		//Java's `placeWall()` only calls `throwChar` for ENEMY alignment, so allies, NPCs
		//and the hero stay put. For eligible enemies `throwChar` still refuses rooted and
		//IMMOVABLE characters; the KeyWall is seeded over every occupant regardless.
		if (mob && !hiddenMimic && !mob.isHero && !mob.isAlly && !mob.isNPC
			&& mob.buffs['roots'] === undefined
			&& (mob.kind === undefined || !IMMOVABLE_KINDS.has(mob.kind))) {
			const to = { x: cell.x + knockback[0], y: cell.y + knockback[1] };
			if (this.level.inside(to.x, to.y) && this.level.passable(to.x, to.y) && !this.creatureAt(to.x, to.y)) this.moveTo(mob, to);
		}
		this.keyWalls.set(idx, { turns, original: this.level.get(cell.x, cell.y) });
		this.level.set(cell.x, cell.y, WALL);
		this.restitchTilesAround(cell.x, cell.y);
	},

	/** The key's own per-turn work: `keyRecharge.act()`, then every wall's countdown. */
	tickSkeletonKey(this: DungeonScene): void {
		const key = this.skeletonKeyItem();
		if (key) {
			skeletonKeyTickRecharge(key, ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(),
				this.hero.magicImmune === true, this.regenOn());
		}
		if (this.keyWalls.size === 0) return;
		let ended = false;
		for (const [idx, wall] of this.keyWalls) {
			if (--wall.turns > 0) continue;
			this.keyWalls.delete(idx);
			const x = idx % this.level.width;
			const y = Math.floor(idx / this.level.width);
			this.level.set(x, y, wall.original);
			this.restitchTilesAround(x, y);
			ended = true;
		}
		//`KeyWall.evolve()`: `Dungeon.observe()` when a wall cell ends.
		if (ended) this.fov.update(this.hero.x, this.hero.y, this.viewRadius());
	},

	/**
	 * `KeyReplacementTracker.process*LockOpened` (via `Buff.affect`, so the first use creates it):
	 * counts the locks this depth still has, then discards any real key the journal no longer needs.
	 */
	skeletonKeyNoteLockOpened(this: DungeonScene, kind: KeyLockKind): void {
		this.skeletonKeyTracker ??= newKeyReplacementTracker();
		this.skeletonKeyProcessLock(kind);
	},

	/** A real key opened a lock: `Hero.onOperateComplete` tells an existing tracker (only), which then trims excess keys. */
	realKeyLockOpened(this: DungeonScene, kind: KeyLockKind): void {
		if (this.skeletonKeyTracker) this.skeletonKeyProcessLock(kind);
	},

	skeletonKeyProcessLock(this: DungeonScene, kind: KeyLockKind): void {
		const tracker = this.skeletonKeyTracker!;
		const doors = this.doors.toJSON().doors;
		const chests = this.groundItems.filter((g) => g.chest === 'locked' || g.chest === 'crystal');
		const level = {
			iron: doors.filter((d) => d.locked === 'ironKey' && d.cell >= 0 && !this.crystalDoorCells.has(d.cell)).length,
			golden: chests.filter((g) => g.chest === 'locked').length,
			crystal: doors.filter((d) => d.locked === 'crystalKey' || this.crystalDoorCells.has(d.cell)).length + chests.filter((g) => g.chest === 'crystal').length,
		};
		const held = (id: string): number => this.bag.items.reduce((sum, it) => sum + (it.id === id && (it as { depth?: number }).depth === this.depth ? it.quantity : 0), 0);
		const excess = processKeyLockOpened(tracker, this.depth, kind, level, { iron: held('ironKey'), golden: held('goldenKey'), crystal: held('crystalKey') });
		let removed = false;
		for (const [id, count] of [['ironKey', excess.iron], ['goldenKey', excess.golden], ['crystalKey', excess.crystal]] as const) {
			for (let i = 0; i < count; i++) {
				const entry = this.bag.items.find((it) => it.id === id && (it as { depth?: number }).depth === this.depth);
				if (!entry) break;
				this.bag.remove(id, 1, entry.instanceId);
				removed = true;
			}
		}
		if (removed) this.say(t('port.skeletonkey.discard'));
	},

	/**
	 * `SpiritForm.applyActiveArtifactEffect(SkeletonKey)`: `GameScene.selectCell(effect.targeter)` on the
	 * synthetic key. `resetForTrinity` sets `level = artifactLevel` but leaves `chargeCap` at the
	 * constructor's 3 (only `upgrade()` widens it), so `charge = chargeCap = 3`: enough for a regular
	 * lock, a gold lock, a door lock or a wall, never a crystal lock (5). `exp = MIN_VALUE` means it
	 * never levels. The ported flow runs unchanged with only its key lookup overridden (as the other
	 * synthetic Trinity artifacts do), so a live getter on the context stays live.
	 */
	trinitySpiritSkeletonKey(this: DungeonScene): void {
		const key: SkeletonKeyItem = { level: this.trinitySyntheticLevel('skeletonkey'), charge: mwlItemEffectValue('skeletonkey', 'chargeCapBase'), exp: -2147483648, cursed: false };
		useSkeletonKeyFlow(Object.create(this.skeletonKeyFlowContext(), { keyOf: { value: () => key } }) as SkeletonKeyFlowContext);
	},

	/**
	 * `Hero.onOperateComplete`'s distraction: a cursed skeleton key makes a real key fail 5 times in 6
	 * (`skele.isCursed() && Random.Int(6) != 0`), costing two unlock turns and 4 hunger.
	 * @returns true when the attempt was swallowed.
	 */
	cursedKeyDistracts(this: DungeonScene): boolean {
		const key = this.skeletonKeyItem();
		if (!key?.cursed || Random.int(0, 6) === 0) return false;
		this.say(t('port.skeletonkey.key_distracted'), 'negative');
		this.simulation.exertHunger(4);
		this.spendHeroTurn(2);
		return true;
	},
};
