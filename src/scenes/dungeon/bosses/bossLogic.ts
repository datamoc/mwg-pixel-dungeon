import type { DungeonScene } from '../../dungeonScene';
import { faceCharacter } from '../../../ui/characterPlacement';
import { AnimatedSprite, Blob, Random, ReactionTable, Roguelike, Tweener, type ReactionRule } from 'mwg';
import { simulationRandom } from '../../../adapters/mwgRandom';
import { takeGooTurn as runGooTurn } from '../../../simulation/gooBoss';
import { vertigoStep } from '../../../simulation/vertigo';
import { planRatKingWave, ratKingP1Summon, type RatKingAddKind, type RatKingWavePlan } from '../../../simulation/ratKingBoss';
import { chooseDM300Ability, dm300VentPath, planDM300Knockback, planDM300Rockfall } from '../../../simulation/dm300Boss';
import { aimYogDeathGaze } from '../../../simulation/yogBoss';
import { preparationLevel } from '../../../simulation/preparation';
import { CLASS_KEYS, has, t, titleCase } from '../../../i18n/index';
import { bountyHunterDropBonus, rejuvenatingStepHeal } from '../../../talentEffects';
import { SpdRandom, spdSeedForDepth } from '../../../spdRng';
import { CAVES_BOSS_ARENA, CITY_BOTTOM_DOOR, CITY_THRONE, CITY_TOP_DOOR, HALLS_EXIT_CELL } from '../../../spdLevelGen/bossLevels';
import { CAVES_GATE, cavesArenaLayer, type CavesArenaVisualContext } from '../../../spdLevelGen/cavesBossVisuals';
import { Terrain, type PaintLevel } from '../../../spdLevelGen/paintLevel';
import { runState } from '../../../runState';
import { isChallengeEnabled } from '../../../challenges';
import { applyDM300DeathUnseal, applyYogDeathUnseal } from '../../bossUnseal';
import { coneCells } from '../../../mechanics/cone';
import { planTenguConeFront } from '../../../simulation/tenguBeam';
import { teleportCandidates, type TeleportCell } from '../../../simulation/teleport';
import { randomPatrolDestination as randomPatrolDestinationFlow } from '../../../simulation/wandering';
import { DOOR, DOOR_CLOSED, EMBERS, FLOOR, GRASS, HIGH_GRASS, TILE, TRAP, WALL, WATER, type TrapKind } from '../../../dungeonConstants';
import { addBuff, buffBlocked, reigniteBuff, rollDamage, rollHit, setBleeding, type Creature, type Step } from '../../../combat';
import { IMMATERIAL_KINDS, IMMOVABLE_KINDS, YOG_FIST_SUMMON_STATS, liveStats } from '../../../monsters';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `bossLogic`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const bossLogicMethods = {
	/**
	 * `Tengu.FireAbility.act()`: one ring per Tengu turn, in the stored `CIRCLE8` direction. The
	 * ring-per-turn traversal is MWG 0.7.7's `MultiTurnBeam` now (see `buildTenguBeam` and the
	 * `fronts` resolver `tenguConeFront`), which owns the cone's save too; this method just
	 * advances one front and drops the cone once the beam is done or blocked.
	 *
	 * The rule the resolver carries is Java's: the cone is anchored on Tengu's own cell and spreads
	 * three cells from each cell of the ring it is on - the direction and its two neighbours around
	 * the ring (`left(direction)`/`right(direction)`) - skipping solid cells and never re-adding the
	 * ring it just came from (`toCells.remove(c)`). What ends it is the fire itself: every act after
	 * the first spreads only from cells where the previous ring's `FireBlob` still has volume
	 * (`FireBlob.volumeAt(c) > 0`), so it advances while its own fire still burns and detaches when
	 * a spread comes back empty. Measured live on the port's depth-10 floor: a right-facing cone in
	 * an open room reaches one further ring per turn, three cells on the first ring and nine by the
	 * sixth, all on the aimed side, stopping only against walls - an advancing front, not a
	 * three-ring burst. `this.fire` is the port's counterpart of `FireBlob` and `volumeAt` the same
	 * reading, with one difference worth knowing: the port's fire field diffuses, where Java's
	 * `FireBlob` decays in place at one per turn, so a ring extinguished by water can still read as
	 * burning because the volume moved to a neighbour. The guard is Java's, then, but a shade more
	 * permissive; the port's own fire spreading decides where the front goes.
	 */
	advanceTenguFire(this: DungeonScene, tengu: Creature): boolean {
		const beam = this.tenguBeams.get(tengu);
		const saved = tengu.tenguFire;
		if (!beam || !saved || !beam.active) {
			this.tenguBeams.delete(tengu);
			tengu.tenguFire = undefined;
			return false;
		}
		beam.advance();
		if (beam.done) {
			this.tenguBeams.delete(tengu);
			tengu.tenguFire = undefined;
			return false;
		}
		tengu.tenguFire = { direction: saved.direction, beam: beam.toJSON() };
		return true;
	},

	/** Java's `FireAbility.act()` ring rule, as a `MultiTurnBeam` `fronts` resolver: from every
	 * cell the previous ring reached (Tengu's own cell on turn 0) that still has fire volume, step
	 * one cell in the aimed `CIRCLE8` direction and its two neighbours, skipping off-map, solid,
	 * and already-seen cells and never re-adding the ring just left. An empty result ends the beam.
	 * The volume filter is Java's `FireBlob.volumeAt(c) > 0` gate, read against this port's fire
	 * field. */
	tenguConeFront(this: DungeonScene,
		direction: number,
		previous: readonly { x: number; y: number }[],
		turn: number,
	): { x: number; y: number }[] {
		return planTenguConeFront({
			direction,
			previous,
			turn,
			width: this.level.width,
			height: this.level.height,
			passable: (x, y) => this.level.passable(x, y),
			hasFire: (x, y) => this.fire.volumeAt(x, y) > 0,
		});
	},

	/** A live Tengu cone: MWG's `MultiTurnBeam` with the game-supplied `fronts` resolver above. The
	 * beam owns the per-turn traversal and its own save; `onCell` seeds the port's fire field, which
	 * is what actually burns creatures, so no damage callback is involved. */
	//Divergence (deliberate): the Java `Tengu.FireAbility.FireBlob.evolve()` decrements
	//and ignites creatures but never calls `Level.destroy()` and never spreads, so the
	//cone leaves grass and doors standing where ordinary fire would reduce them to
	//embers. This port seeds ordinary fire instead, so the cone burns terrain exactly
	//like the rest - see `tools/scratch/FLAMABLE-INVENTORY.md` item 1.
	/**
	 * Java's `FireAbility.FireBlob.evolve()` burns occupants as the front advances -
	 * Tengu himself immune, the hero fouling the bosses challenge - so the seeded
	 * cell ignites non-Tengu occupants at seed time, exactly once per cell reached,
	 * matching Java's per-cell-expiry burn. The ordinary field fire seeded alongside
	 * keeps burning on later turns (and still burns Tengu himself, where Java's
	 * blob never does - recorded residual).
	 */
	seedTenguConeCell(this: DungeonScene, tengu: Creature, cell: { x: number; y: number }): void {
		this.fire.seed(cell.x, cell.y, 2);
		const occupant = this.creatureAt(cell.x, cell.y);
		if (!occupant || occupant === tengu || occupant.hp <= 0) return;
		//Java fouls the hero on the cone cell even when fire-immune (the foul sits
		//outside the `!isImmune(Fire)` burn guard), so foul before the immunity return.
		if (occupant.isHero) this.foulBossChallenge();
		if (occupant.fireImmune || occupant.buffs.blobImmunity !== undefined) return;
		reigniteBuff(occupant, 'burning');
	},

	buildTenguBeam(this: DungeonScene, from: { x: number; y: number }, direction: number, tengu: Creature): Roguelike.MultiTurnBeam {
		return new Roguelike.MultiTurnBeam({
			level: this.level,
			from,
			target: from,
			damage: 0,
			blocker: 'none',
			shape: 'tengu-cone',
			fronts: (previous, turn) => this.tenguConeFront(direction, previous, turn),
			onCell: (cell) => this.seedTenguConeCell(tengu, cell),
		});
	},

	/** Rebuilds a saved cone (`creature.tenguFire.beam`) into a live `MultiTurnBeam` on load. */
	rebuildTenguBeam(this: DungeonScene, direction: number, save: Roguelike.MultiTurnBeamSave, tengu: Creature): Roguelike.MultiTurnBeam {
		return Roguelike.MultiTurnBeam.fromJSON({
			level: this.level,
			damage: 0,
			blocker: 'none',
			shape: 'tengu-cone',
			fronts: (previous, turn) => this.tenguConeFront(direction, previous, turn),
			onCell: (cell) => this.seedTenguConeCell(tengu, cell),
		}, save);
	},

	/** Advances the logical counterpart of Java's `ShockerAbility` buff. Java creates a
	 * ShockerBlob on each act: the center cell and alternating diagonal/cardinal neighbours
	 * expire over subsequent blob ticks. The port has no Lightning/ShockerBlob actor, so it
	 * keeps the actor lifetime and parity/damage schedule but resolves each pulse directly.
	 * This is deliberately a presentation simplification, not an immediate-burst substitute.
	 */
	advanceTenguShockers(this: DungeonScene, tengu: Creature): void {
		const active = tengu.tenguShockers ?? [];
		if (active.length === 0) return;
		const remaining: NonNullable<Creature['tenguShockers']> = [];
		for (const shocker of active) {
			shocker.turns++;
			const parity = shocker.turns % 2 === 1 ? shocker.ordinals : !shocker.ordinals;
			const offsets: ReadonlyArray<readonly [number, number]> = parity
				? [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]
				: [[0, 0], [0, -1], [-1, 0], [1, 0], [0, 1]];
			for (const [dx, dy] of offsets) {
				const target = this.creatureAt(shocker.x + dx, shocker.y + dy);
				if (!target || target === tengu || target.isNPC || target.hp <= 0) continue;
				//`Sheep.damage()` is a no-op (tag `v3.3.8`) - see the blob seam.
				if (target.allyKind === 'sheep') continue;
				const raw = 2 + this.depth;
				const dealt = target.isHero ? this.absorbHeroDamage(raw, true) : raw;
				target.hp -= dealt;
				this.showDamage(target, dealt);
				//`ShockerAbility`'s pulse fouls the bosses challenge when it strikes the
				//hero (`Tengu.java`, tag `v3.3.8`).
				if (target.isHero) this.foulBossChallenge();
				if (target.hp <= 0) this.kill(target);
			}
			if (shocker.turns < 3) remaining.push(shocker);
		}
		tengu.tenguShockers = remaining;
	},

	/** Tengu.throwShocker()/ShockerAbility: choose a free hero-adjacent anchor. The
	 * Java actor alternates diagonal/cardinal pulses over subsequent ticks; the actor state
	 * is retained above, while this port resolves its direct damage without Lightning/Blob FX.
	 * Returns false when no free adjacent anchor exists, which `useAbility` turns into its
	 * Fire fallback on the scripted second cast.
	 */
	tenguThrowShocker(this: DungeonScene, tengu: Creature): boolean {
		const anchor = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
			.filter((at) => this.level.inside(at.x, at.y) && this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y))
			.sort((a, b) => Math.hypot(a.x - tengu.x, a.y - tengu.y) - Math.hypot(b.x - tengu.x, b.y - tengu.y))[0];
		if (!anchor) return false;
		(tengu.tenguShockers ??= []).push({ x: anchor.x, y: anchor.y, ordinals: Random.int(2) === 1, turns: 0 });
		return true;
	},

	/** `ArenaVisuals.updateState()`'s inputs, read off the live scene: the level's raw terrain,
	 *  whether the arena is sealed, which pylon cells hold a live `Pylon` actor, and which cells the
	 *  gate's own rect covers. */
	cavesArenaVisualContext(this: DungeonScene): CavesArenaVisualContext {
		const paint = this.portedPaint;
		//Every caller is downstream of `enterLevel`'s `depth === 15 && portedPaint` guard that builds
		//the layers, so a missing paint here is a broken invariant, not a state to paper over: the
		//grid would fall back to the live terrain, whose kind codes (0..9) cannot match any of the
		//`Terrain` values the frames key on (EMPTY_SP 14, INACTIVE_TRAP 19, SIGN 23) - so the whole
		//arena would come back empty and silent, with no art and generic examine names.
		if (!paint) throw new Error('cavesArenaVisualContext: no ported paint for this floor');
		return {
			terrain: paint.map,
			width: this.level.width,
		//Java reads this as `Dungeon.level.solid[gatePos]`: the gate is solid `CUSTOM_DECO` from
		//`build()` until `unseal()` sets its five cells to `EMPTY`. Read off the live paint
		//rather than hardcoded, so `applyDM300DeathUnseal()`'s break shows the broken
		//frames (`32..36`) through the `refreshCavesBossArenaVisuals()` it calls.
		gateIntact: (() => {
			for (let x = CAVES_GATE.left; x < CAVES_GATE.right; x++) {
				if (paint.map[CAVES_GATE.top * this.level.width + x] !== Terrain.SIGN) return false;
			}
			return true;
		})(),
			//`Dungeon.level.locked`, which `super.seal()` sets and `super.unseal()` clears. Java can
			//only read it from `create()`, `unseal()` or `eliminatePylon()` - never from `seal()` or
			//`activatePylon()`, the two state changes it does not re-map on - so this flag is read
			//exactly where Java reads it and at no other time.
			locked: this.cavesBossSealed,
			pylonActorAt: (cell) => this.creatures.some((creature) => creature.kind === 'pylon' && creature.hp > 0
				&& this.level.index(creature.x, creature.y) === cell),
			insideGate: (cell) => {
				const x = cell % this.level.width;
				const y = Math.floor(cell / this.level.width);
				return x >= CAVES_GATE.left && x < CAVES_GATE.right && y >= CAVES_GATE.top && y < CAVES_GATE.bottom;
			},
		};
	},

	cavesArenaLayer(this: DungeonScene): number[] {
		return cavesArenaLayer(this.level.width, this.level.height, this.cavesArenaVisualContext());
	},

	/** Re-maps `ArenaVisuals`' layer from the current state. Java calls `updateState()` from three
	 *  places: `ArenaVisuals.create()` (this port's `enterLevel` block), `eliminatePylon()` (called
	 *  here from `dm300LoseSupercharge`) and `unseal()` (called here from
	 *  `applyDM300DeathUnseal`). `seal()` and `activatePylon()` are the two state changes
	 *  Java does *not* re-map on. */
	refreshCavesBossArenaVisuals(this: DungeonScene): void {
		if (!this.cavesBossTiles) return;
		this.cavesBossTiles.setLayerData('cavesArena', this.cavesArenaLayer());
	},

	/** `CavesBossLevel.occupyCell()`: seal the arena once the hero comes within Chebyshev
	 * distance 3 of a pylon (`Level.distance` is `max(|dx|,|dy|)`), and create DM-300 there at a
	 * random open `mainArena` point - Java spawns it in `seal()`, not on floor entry. Energizing
	 * the floor is NOT part of the seal: `activatePylon()` does that, and only
	 * `DM300.supercharge()` calls it (see `dm300Supercharge`). */
	checkCavesBossPylonGate(this: DungeonScene): void {
		if (this.depth !== 15 || this.cavesBossSealed) return;
		const nearPylon = this.cavesBossPylons.some((pylon) =>
			Roguelike.chebyshevDistance(this.hero, pylon) <= 3
		);
		if (!nearPylon) return;
		this.cavesBossSealed = true;
		this.qualifiedForBossChallenge = true;
		//`CavesBossLevel.seal()`'s do/while over `Random.element(mainArena.getPoints())`: an open,
		//unoccupied cell that is not an `EMPTY_SP` special-floor tile. `openSpace`/`EMPTY_SP` come
		//from the untranslated `PaintLevel`, since the live terrain mapping collapses both.
		const paint = this.portedPaint;
		const spots: { x: number; y: number }[] = [];
		for (let y = CAVES_BOSS_ARENA.top; y <= CAVES_BOSS_ARENA.bottom; y++) {
			for (let x = CAVES_BOSS_ARENA.left; x <= CAVES_BOSS_ARENA.right; x++) {
				if (!this.level.passable(x, y) || this.creatureAt(x, y)) continue;
				if (paint && paint.map[y * paint.w + x] === Terrain.EMPTY_SP) continue;
				spots.push({ x, y });
			}
		}
		//`seal()` closes the way the hero came in: the entrance cell becomes a wall, and whatever
		//is standing on it - or heaped there - is pushed to a random passable 8-neighbour first
		//(`PathFinder.NEIGHBOURS8`'s own order, since that index is what the draw picks).
		const entrance = this.entranceCell;
		if (entrance && this.level.inside(entrance.x, entrance.y)) {
			const pushOff = (): Step => {
				const offsets: ReadonlyArray<readonly [number, number]> = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
				let at = { x: entrance.x, y: entrance.y };
				for (let attempt = 0; attempt < 32; attempt++) {
					const [dx, dy] = offsets[Random.int(8)]!;
					at = { x: entrance.x + dx, y: entrance.y + dy };
					if (this.level.passable(at.x, at.y)) return at;
				}
				return at;
			};
			const ground = this.groundItemAt(entrance.x, entrance.y);
			if (ground) {
				const at = pushOff();
				ground.x = at.x;
				ground.y = at.y;
				this.sprite(ground).position.set(at.x * TILE, at.y * TILE);
			}
			const occupant = this.creatureAt(entrance.x, entrance.y);
			if (occupant) {
				const at = pushOff();
				this.moveTo(occupant, at);
			}
			if (this.portedPaint) this.portedPaint.map[this.level.index(entrance.x, entrance.y)] = Terrain.WALL;
			this.level.set(entrance.x, entrance.y, WALL);
			this.restitchTilesAround(entrance.x, entrance.y);
			//`CellEmitter`'s rock burst, `PixelScene.shake(3, 0.7f)` and the ROCKS sample
			this.shakeScreen(3, 0.7);
			runState.audio.cue('rocks', 0.7);
		}
		//DM-300 exists only through this gate, so a live one with the flag down means the seal
		//already ran under a save that predates the persisted flag: adopt the sealed state
		//(the wall above is already re-applied) rather than doubling the boss. Fresh runs can
		//never reach that branch - nothing else spawns DM-300.
		if (!this.creatures.some((c) => c.kind === 'dm300' && c.hp > 0)) {
			if (spots.length > 0) this.spawnMonster('dm300', Random.element(spots)!);
			this.say(t('port.log.dm300arrives'), 'warning');
		} else if (!this.cavesBossSealed) this.cavesBossSealed = true;
	},

	/** `CityBossLevel.occupyCell()`/`seal()` (`CityBossLevel.java`, tag `v3.3.8`): the
	 *  moment the hero's own cell index passes above the arena bottom door
	 *  (`ch.pos < bottomDoor`, i.e. through it into the throne room) while the top door
	 *  is still locked, the bottom door locks behind them. Flat-index comparison, exactly
	 *  like Java - the entrance room sits at higher indexes than the arena.
	 *
	 *  Port shape: this port's `Doors` registry owns locked-ness, so sealing re-places
	 *  the door `ironKey`-locked the way Tengu's own re-lock does - never requiring the
	 *  key, since `unseal()` re-places it open at the King's death. `Mob.holdAllies`/
	 *  `restoreAllies` (no intelligent ally persists into this fight),
	 *  `Statistics.qualifiedForBossChallengeBadge` (set live by `checkCityBossSeal` below) and the `CITY_BOSS`
	 *  music start (already playing from floor entry) are correctly no-ops. Runs on the
	 *  hero-move path with the other boss gates; Java fires on any cell occupation. */
	checkCityBossSeal(this: DungeonScene): void {
		if (this.depth !== 20 || this.cityBossSealed || this.bossUnsealedDepths.has(20)) return;
		if (!this.portedPaint || this.portedPaint.map[CITY_TOP_DOOR.y * this.level.width + CITY_TOP_DOOR.x] !== Terrain.LOCKED_DOOR) return;
		if (this.level.index(this.hero.x, this.hero.y) >= CITY_BOTTOM_DOOR.y * this.level.width + CITY_BOTTOM_DOOR.x) return;
		this.cityBossSealed = true;
		this.qualifiedForBossChallenge = true;
		this.portedPaint.map[CITY_BOTTOM_DOOR.y * this.level.width + CITY_BOTTOM_DOOR.x] = Terrain.LOCKED_DOOR;
		this.doors.place(CITY_BOTTOM_DOOR.x, CITY_BOTTOM_DOOR.y, { open: DOOR, closed: DOOR_CLOSED, locked: 'ironKey', startOpen: false });
		this.restitchTilesAround(CITY_BOTTOM_DOOR.x, CITY_BOTTOM_DOOR.y);
	},

	/** `ImpShopkeeper.act()`'s first-sight greeting (`ImpShopkeeper.java`, tag `v3.3.8`):
	 *  the first time the hero is in its FOV it yells `greetings` with the hero's class
	 *  name. NPCs never take turns here, so this runs on the hero-move path (and once at
	 *  the `unseal()` spawn, which can land in view) instead of the keeper's own `act()` -
	 *  same visible outcome, one persisted `seenBefore` flag. Stated: the `greetings_ascent`
	 *  variant (no AscensionChallenge exists here - the run ends at the vault, there is no
	 *  ascent to be on). */
	checkImpShopkeeperGreeting(this: DungeonScene): void {
		for (const keeper of this.creatures.filter((c) => c.kind === 'impShopkeeper' && !c.impShopkeeperGreeted)) {
			if (!this.fov.isVisible(keeper.x, keeper.y)) continue;
			keeper.impShopkeeperGreeted = true;
			this.say(t('actors.mobs.npcs.impshopkeeper.greetings', { '0': titleCase(t(CLASS_KEYS[this.heroClass])) }));
		}
	},

	/** `HallsBossLevel.seal()` (`HallsBossLevel.java` 252-284): `occupyCell` seals the moment
	 * the hero is two cells from the entrance - the way in becomes `EMPTY_SP` floor and
	 * Yog-Dzewa himself rises at `exit() + width*3`, shoving any occupant to a free
	 * 8-neighbour (`boss.pos + 2*width` when all are taken).
	 *
	 * Port shape: the trigger runs on the hero-move path with the other boss gate above
	 * (Java fires on any cell occupation; a blink landing off that path seals on the next
	 * ordinary step instead). The exit-tile half of Java's trigger (`map[exit()] != EXIT`)
	 * reads the paint grid, which `unseal()` sets to `EXIT` - see `applyYogDeathUnseal`;
	 * before that it is the `WALL_DECO` the room's band paints, so the once-flag still
	 * stands in for a second firing. `super.seal()`'s lock and the boss-challenge-badge flag are likewise
	 * unowned (no ascent, Rankings work), and the flame burst has no one-shot hook in this
	 * port's pooled particle layers - presentation only, the mechanics are all here. The live
	 * map needs no write: both tiles collapse to 'floor' in the bridge. */
	checkHallsBossSeal(this: DungeonScene): void {
		if (this.depth !== 25 || this.hallsBossSealed) return;
		const entrance = this.entranceCell;
		if (!entrance || Roguelike.chebyshevDistance(this.hero, entrance) < 2) return;
		//Migration: runs saved before this seal existed arrive with a live entry-spawned Yog
		//and no flag; spawning again would double him, so those runs keep the old spawn and
		//the entrance simply never converts.
		if (this.creatures.some((c) => c.kind === 'yog' && c.hp > 0)) return;
		this.hallsBossSealed = true;
		this.qualifiedForBossChallenge = true;
		if (this.portedPaint) this.portedPaint.map[this.level.index(entrance.x, entrance.y)] = Terrain.EMPTY_SP;
		this.restitchTilesAround(entrance.x, entrance.y);
		//Java's `exit() + width*3`: `HALLS_EXIT_CELL` (16,9), three rows down into the
		//boss room. Falls back to the boss-room centre this port previously spawned at (which is that
		//same cell on the fixed floor, so the fallback only matters if the layout is edited).
		let at = Roguelike.rectCenter(this.level.rooms[this.level.rooms.length - 1] ?? this.level.rooms[1]);
		{
			const w = this.level.width;
			const landed = { x: HALLS_EXIT_CELL.x, y: HALLS_EXIT_CELL.y + 3 };
			if (this.level.inside(landed.x, landed.y)) at = landed;
		}
		const occupant = this.creatureAt(at.x, at.y);
		if (occupant) {
			const offsets: ReadonlyArray<readonly [number, number]> = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
			const free = offsets
				.map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy }))
				.filter((cell) => this.level.inside(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
			this.moveTo(occupant, free.length > 0 ? Random.element(free)! : { x: at.x, y: at.y + 2 });
		}
		//Java's `phase = 0` dormancy: risen but unseeing, invulnerable and idle until the
		//hero's FOV reaches his cell - see `takeYogTurn`. Pre-seal saves (undefined phase)
		//keep behaving awake via every `?? 1` below.
		const risen = this.spawnMonster('yog', at);
		risen.yogPhase = 0;
		//A raw English literal here once showed English on every locale, the same silent
		//`say()`-without-`t()` failure the boss-victory lines had - now a port key in all 19.
		this.say(t('port.log.yogarrives'));
	},

	/** `SewerBossLevel.seal()` (`SewerBossLevel.java` 177-195): the entrance cell drowns to
	 * `WATER`. Java fires it from three sites - `Goo.act()` on the first non-sleeping turn,
	 * `Goo.damage()` on the first scratch, `Goo.notice()` on awareness - all guarded by
	 * `!locked`. This port hooks the first site: `takeGooTurn` only runs for an awake Goo
	 * (the sleeping branch above spends the wake turn first, exactly like Java's
	 * `TIME_TO_WAKE_UP`), so the seal lands on Goo's first acting turn after any of the
	 * three. The damage/notice halves therefore arrive up to one turn late - stated, not
	 * silent: a wand sniped at a sleeping Goo floods the entrance on his next turn rather
	 * than instantly. Hurt and debuffs already wake here, so the delay is bounded by one
	 * round in every case.
	 *
	 * Unowned halves, each named where it belongs (the boss-challenge-badge flag is NOT one of them: `checkSewerBossSeal` sets it live below - see the `BOSS_CHALLENGE_1..5` coverage row): the `LockedFloor` buff that actually bars
	 * the way out (boss floors have no stairs here; descent is Goo's death alone), the
	 * `SEWERS_BOSS` switch (it already plays
	 * on boss-floor entry, so there is nothing to switch to), the ripple (no one-shot hook
	 * in the pooled particle layers), and `unseal()`'s entrance restore (same descent-flow
	 * reason as every other seal). The drowned cell stays walkable floor-flat water - Java's
	 * own `WATER` is walkable too; what bars Java's exit is the buff, not the tile. */
	checkSewerBossSeal(this: DungeonScene): void {
		if (this.depth !== 5 || this.sewerBossSealed) return;
		if (!this.creatures.some((c) => c.kind === 'goo' && c.hp > 0)) return;
		this.sewerBossSealed = true;
		this.qualifiedForBossChallenge = true;
		const entrance = this.entranceCell;
		if (entrance && this.portedPaint) {
			this.portedPaint.map[this.level.index(entrance.x, entrance.y)] = Terrain.WATER;
			this.level.set(entrance.x, entrance.y, WATER);
			this.restitchTilesAround(entrance.x, entrance.y);
			this.map.setLayerData('water', this.waterFrames());
		}
	},

	/** `CavesBossLevel.PylonEnergy.evolve()`: damage grounded characters standing on
	 * energized terrain until the active pylon cycle clears the field. `this.creatures` already
	 * contains the hero, so the target list is deduplicated by identity - the previous
	 * `[this.hero, ...this.creatures]` damaged the hero twice in a single tick. */
	tickCavesBossEnergy(this: DungeonScene): boolean {
		if (this.depth !== 15 || !this.cavesBossSealed || this.cavesBossEnergyCells.size === 0) return false;
		const targets = new Set(this.creatures);
		if (this.hero) targets.add(this.hero);
		for (const target of targets) {
			if (target.hp <= 0 || target.flying || target.kind === 'dm300') continue;
			if (!this.cavesBossEnergyCells.has(this.level.index(target.x, target.y))) continue;
			//`CavesBossLevel.PylonEnergy.evolve()` prolongs the tracker onto mob victims.
			if (!target.isHero) this.markHazardMob(target);
			const damage = Random.normalRange(6, 12);
			const dealt = target.isHero ? this.absorbHeroDamage(damage) : damage;
			target.hp -= dealt;
			this.showDamage(target, dealt);
			if (target.isHero) this.say(t('port.log.affliction', { damage: dealt }), 'negative');
			if (target.hp <= 0) {
				this.kill(target, target.isHero ? 'trap' : 'foe');
				if (target.isHero) return true;
			}
		}
		return false;
	},

	/**
	 * DM-300: GAS/ROCKS ability rotation on a `NormalIntRange(5,9)` cooldown (7 max on the
	 * bosses challenge), first pick 50/50, then 1-in-4 to repeat GAS and 3-in-4 to repeat
	 * ROCKS. GAS vents live `toxicGas` along the trajectory (100 at the collision cell, 20
	 * per path cell, topped up around the hero to 250 total, doubled on the challenge).
	 * ROCKS schedules a telegraphed 7x7 rockfall that slams after 2 turns for
	 * `NormalIntRange(6,12)` (10-20 on the challenge) plus brief paralysis. The old
	 * every-3rd-turn fire-ring + double-strike had no Java basis and is gone. The
	 * can't-reach branch is ported: with the hero unreachable (see `canReach` below) and
	 * `turnsSinceLastAbility >= MIN_COOLDOWN` (5), a 30-degree infinite-range `STOP_SOLID`
	 * cone decides whether the hero can still be gassed - Java's own "account for
	 * trickshotting angles" - and otherwise drops rocks unless the hero is already
	 * paralysed; that branch re-rolls no cooldown and spends no turn, exactly as Java's does.
	 * Remaining: Java's `INORGANIC` clause (provably false for the hero here) and its
	 * adjacent-only turn spend (abilities cost the full turn here either way - 1-turn
	 * granularity, stated).
	 */
	takeDM300Turn(this: DungeonScene, dm300: Creature): void {
		const maxCooldown = isChallengeEnabled('stronger_bosses') ? 7 : 9;
		//`DM300.act()` runs its whole ability clock only while not supercharged: the turn
		//counter freezes during the charge, and no ability fires. The first cooldown is
		//Java's own construction roll (`NormalIntRange(5, MAX)`), drawn here once when the
		//counter starts rather than defaulting flat every turn.
		const supercharged = dm300.dmSupercharged === true;
		if (!supercharged) {
			if ((dm300.dmAbilityTurns ?? -1) < 0) {
				dm300.dmAbilityTurns = 0;
				if (dm300.dmAbilityCd === undefined) dm300.dmAbilityCd = Random.normalRange(5, maxCooldown);
			} else dm300.dmAbilityTurns = (dm300.dmAbilityTurns ?? 0) + 1;
		}
		const blocked = new Set(
			this.creatures.filter((c) => c !== dm300 && c !== this.hero).map((c) => this.level.index(c.x, c.y))
		);
		//`DM300.java` 185-189: adjacent, or a step towards the hero exists.
		const canReach = Roguelike.chebyshevDistance(dm300, this.hero) <= 1
			|| this.pathfinder.find({ x: dm300.x, y: dm300.y }, { x: this.hero.x, y: this.hero.y }, { blocked }).length > 0;
		if (!supercharged && dm300.seesHero && !canReach && (dm300.dmAbilityTurns ?? 0) >= 5) {
			//`DM300.java` 202-234, "more aggressive ability usage when DM can't reach its target": the
			//gas cone is cast with `STOP_SOLID` only (`Float.POSITIVE_INFINITY` range, 30 degrees), and
			//a cone that misses falls through to rocks - unless the hero is already stunned, where
			//Java fires nothing and, crucially, does NOT reset the counter. A failed attempt (like
			//a fired one at range, which spends no turn) falls through below: first to the
			//normal-branch roll, then to movement. Can't-reach implies distance > 1, since
			//adjacency counts as reachable, so a fired ability here never spends the turn.
			const aim = coneCells({
				source: { x: dm300.x, y: dm300.y },
				target: { x: this.hero.x, y: this.hero.y },
				degrees: 30,
				maxDistance: Infinity,
				width: this.level.width,
				height: this.level.height,
				trace: (from, to) => this.coneRay(from, to, false),
			});
			const inCone = aim.cells.some((cell) => cell.x === this.hero.x && cell.y === this.hero.y);
			if (inCone) {
				dm300.dmLastAbility = 1;
				dm300.dmAbilityTurns = 0;
				this.dm300VentGas(dm300);
			} else if (this.hero.buffs['paralysis'] === undefined) {
				dm300.dmLastAbility = 2;
				dm300.dmAbilityTurns = 0;
				this.dm300Rockfall(dm300);
			}
		}
		if (!supercharged && dm300.seesHero && (dm300.dmAbilityTurns ?? 0) > (dm300.dmAbilityCd ?? 5)) {
			const last = dm300.dmLastAbility ?? 0;
			const pick = chooseDM300Ability(last as 0 | 1 | 2, simulationRandom) === 'vent' ? 1 : 2;
			dm300.dmLastAbility = pick;
			dm300.dmAbilityTurns = 0;
			dm300.dmAbilityCd = Random.normalRange(5, maxCooldown);
			if (pick === 1) this.dm300VentGas(dm300);
			else this.dm300Rockfall(dm300);
			//Java spends the turn on an adjacent ability (`spend(TICK)`) and nothing at all at
			//range, where the ability is free and the turn continues into movement below.
			if (Roguelike.chebyshevDistance(dm300, this.hero) <= 1) return;
		}
		const distance = Roguelike.chebyshevDistance(dm300, this.hero);
		if (distance <= 1) {
			this.attack(dm300, this.hero);
			return;
		}
		const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, dm300, dm300.hp / dm300.maxHp, this.hero, {
			sightRadius: this.viewRadius(),
			blocked,
		});
		if (decision.step) this.moveTo(dm300, decision.step);
	},

	/** DM300.ventGas(): toxic gas along a STOP_TARGET trajectory at the hero (100 at the
	 * collision cell, 20 per path cell, neighbours topped up to 250 total; doubled on the
	 * bosses challenge). The trajectory is greedy Chebyshev stepping (no ballistics
	 * primitive exists); the delayed-VFX-actor timing, GAS sound, and travel interrupt are
	 * presentation this port has no seam for - the gas lands immediately with a log line. */
	dm300VentGas(this: DungeonScene, dm300: Creature): void {
		const multi = isChallengeEnabled('stronger_bosses') ? 2 : 1;
		const path = dm300VentPath(dm300, this.hero, (x, y) => this.level.inside(x, y) && this.level.passable(x, y));
		let vented = 0;
		for (const cell of path) {
			this.toxicGas.seed(cell.x, cell.y, 20 * multi);
			vented += 20 * multi;
		}
		const collision = path[path.length - 1];
		if (collision) {
			this.toxicGas.seed(collision.x, collision.y, 100 * multi);
			vented += 100 * multi;
		}
		if (vented < 250 * multi) {
			const around = Math.ceil((250 * multi - vented) / 8);
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nx = this.hero.x + dx, ny = this.hero.y + dy;
				if (this.level.inside(nx, ny) && this.level.passable(nx, ny)) this.toxicGas.seed(nx, ny, around);
			}
		}
		this.say(t('port.log.dm300vent'), 'warning');
	},

	/** DM300 rockfall: a 7x7 centred on the hero minus one safe neighbour (solid cells
	 * retried at 50%, like Java; the pylon-energy retry has no equivalent blob), where each
	 * cell joins with chance `1/distance` (distance-0/1 always join - `Random.Int(0/1)` is
	 * trivially 0). Slams after 2 hero turns (`gate(TICK, ceil(cooldown), 3*TICK)`
	 * collapses to the middle at this port's 1-turn granularity) for the real
	 * `NormalIntRange(6,12)` (10-20 on the challenge) to everything but DM-300 itself, plus
	 * Paralysis 3 (5 on the challenge). A port log line stands in for the red target cells.
	 */
	dm300Rockfall(this: DungeonScene, dm300: Creature): void {
		//`DM300.dropRocks()` (`DM300.java`, tag `v3.3.8`) interrupts the hero and throws
		//it two cells when adjacent, or one cell when it is two cells away and visible.
		//The pure planner owns Java's blocked/occupied/immovable gates; this scene applies
		//the forced move before choosing the volley, so rockCenter is the landing cell.
		this.travelTarget = null;
		const distance = Roguelike.chebyshevDistance(dm300, this.hero);
		const power: 0 | 1 | 2 = distance <= 1 ? 2 : (dm300.seesHero && distance === 2 ? 1 : 0);
		const landing = planDM300Knockback(dm300, this.hero, power, {
			blocked: (x, y) => !this.level.inside(x, y) || !this.level.passable(x, y),
			occupied: (x, y) => {
				const occupant = this.creatureAt(x, y);
				return occupant !== undefined && occupant !== this.hero;
			},
			immovable: this.hero.buffs['roots'] !== undefined,
		});
		if (landing.x !== this.hero.x || landing.y !== this.hero.y) this.moveTo(this.hero, landing);
		const { cells } = planDM300Rockfall(
			landing,
			dm300,
			this.level.width,
			this.level.height,
			(x, y) => this.level.passable(x, y),
			simulationRandom,
		);
		if (cells.length > 0) this.fallingRocks.push({ cells, turns: 2 });
		//`DM300.java` 655: the ROCKS ability shakes hardest of anything in the game (5, a full
		//second) as it slams - scheduled here, on the turn the volley is called down.
		this.shakeScreen(5, 1);
		this.say(t('port.log.dm300rocks'), 'warning');
	},

	/** `FallingRockBuff` landing: damage + brief paralysis on every cell, DM-300 excluded
	 * (Pylons don't exist here to exclude). Runs from the end-of-turn pipeline next to the
	 * bomb-fuse tick; floor save/load carries unexploded volleys like any other heap state.
	 * Returns true when a rock kills the hero, stopping the sequence like bomb blasts do. */
	tickFallingRocks(this: DungeonScene): boolean {
		let heroDied = false;
		for (const volley of [...this.fallingRocks]) {
			volley.turns--;
			if (volley.turns > 0) continue;
			this.fallingRocks.splice(this.fallingRocks.indexOf(volley), 1);
			//`DelayedRockFall.act()` 68 / `RockfallTrap.trigger()` 117 /
			//`GnollRockfallTrap.trigger()` 112 (tag `v3.3.8`): the impact shakes
			//(`3, 0.7f`). One shake per landing volley, not per rock - Java shakes
			//per falling rock and a 7x7 volley would stack seven of them. The floor
			//trap kinds themselves are unported (only DM300's volleys fly here).
			this.shakeScreen(3, 0.7);
			const challenge = isChallengeEnabled('stronger_bosses');
			//`GnollGeomancer.GnollRockFall`: its own strike and its 1-in-3 boulder per empty cell (`gnollMine.ts`).
			if (volley.gnoll) { if (this.landGnollRockFall(volley.cells)) heroDied = true; continue; }
			for (const cell of volley.cells) {
				const target = this.creatureAt(cell.x, cell.y);
				if (!target || target.hp <= 0 || target.kind === 'dm300') continue;
				const dmg = Random.normalRange(challenge ? 10 : 6, challenge ? 20 : 12);
				if (target.isHero) {
					const blocked = this.absorbHeroDamage(dmg);
					this.hero.hp -= blocked;
					this.showDamage(this.hero, dmg);
					if (this.hero.hp <= 0) {
						this.say(t('port.log.rockfallkill'), 'negative');
						this.kill(this.hero);
						heroDied = true;
					} else if (challenge && !buffBlocked(this.hero, 'paralysis')) this.hero.buffs['paralysis'] = 5;
					else addBuff(this.hero, 'paralysis');
				} else {
					//No armor: `FallingRockBuff.affectChar` calls `ch.damage(...)` directly, and
					//`Char.damage()` subtracts no DR (that is an `attack()`-only step - see
					//`Char.java`'s own "we already reduced it in Char.attack" note). This used to
					//subtract the target's armor roll, making rocks weaker than Java's against any
					//armored monster.
					target.hp -= dmg;
					if (this.fadeMirrorOnDamage(target, dmg)) continue;
					this.showDamage(target, dmg);
					if (target.hp <= 0) this.kill(target);
					//Same duration through the shared gate, so STATIC kinds (demonSpawner/rotHeart/
					//pylon/yog) refuse the challenge-mode paralysis like Java's isImmune.
					else addBuff(target, 'paralysis', challenge ? 5 : undefined);
				}
			}
		}
		return heroDied;
	},

	seedBossTrap(this: DungeonScene, at: Step, kind: TrapKind): void {
		if (!this.level.inside(at.x, at.y) || this.level.get(at.x, at.y) === WALL) return;
		this.secrets.conceal(at.x, at.y, this.level.get(at.x, at.y), TRAP);
		this.trapKinds.set(this.level.index(at.x, at.y), kind);
	},

	/**
	 * DwarfKing phase machine (1/2/3), replacing the old BossPhases/AbilityCycle sketch -
	 * whose half-HP Fury has no Java basis at all (DwarfKing.java never touches Fury) and
	 * whose "hold the barrier while adds live" turn is backwards (the real barrier is a
	 * shield pool on the King himself, not inaction). P1 hunts with summon/ability cooldowns
	 * (LINK/TELE-lite); at HP<=50 (100 on the bosses challenge) P2 makes him immobile with a
	 * full-HP shield and escalating ghoul/monk/warlock/golem waves that chip him as they land
	 * (`KingDamager` HT/12, HT/18 on the challenge); at shield 0, P3 bleeds (the bar's own
	 * 25% tint covers it), summons while fewer than 4 adds stand, and yells once under 20 HP.
	 * P1->P2 teleports him onto `CITY_THRONE` with the shared appear presentation (Java's own
	 * `ScrollOfTeleportation.appear(this, CityBossLevel.throne)`); the `IMMOVABLE` pin itself
	 * stays immobile-by-return (no per-instance seam - see the rule below).
	 * Not modeled: the LloydsBeacon upgrade (this port has no beacon artifact), and presentation
	 * (particles/sounds). P3 now defers every incoming hit into Viscosity's pool instead of HP
	 * (`deferMonsterDamage`/`tickMonsterDeferredDamage`). The King's Crown drop is granted on his death (see `kill`'s king
	 * branch) - it enters the bag directly because the port moves to the next floor at that same
	 * boundary. Summon/ability cooldown
	 * damage-acceleration in P1 is exact (`-= taken/8`).
	 */
	/** The two monster-local `Viscosity.DeferedDamage` sources in Java: `DwarfKing.damage()`'s
	 * phase-3 branch (the King banks every hit) and `RustedFist.damage()` (a Rusted YogFist banks
	 * everything). In both cases the creature takes no direct HP damage unless the hit already is
	 * its own payout (`src instanceof Viscosity.DeferedDamage` - the scene's shared
	 * `applyingDeferredDamage` flag); everything else is added to the pool the armor glyph uses and
	 * paid out on its own turns (`tickMonsterDeferredDamage`). Returns true when the caller must
	 * not apply the damage itself. */
	deferMonsterDamage(this: DungeonScene, defender: Creature, damage: number): boolean {
		if (this.applyingDeferredDamage || damage <= 0) return false;
		const defers = (defender.kind === 'king' && (defender.kingPhase ?? 1) === 3)
			|| (defender.kind === 'yogFist' && defender.yogFistType === 'rusted');
		if (!defers) return false;
		defender.deferredDamage = (defender.deferredDamage ?? 0) + damage;
		if (!defender.deferredDamageDelay) defender.deferredDamageDelay = true;
		this.showDamage(defender, damage);
		return true;
	},

	/** `Viscosity.DeferedDamage.act()` for a monster (the King in phase 3, a Rusted YogFist): a
	 * fresh pool waits one
	 * actor turn, then pays out `max(1, floor(pool*0.1))` per turn. Routed through the shared
	 * `applyingDeferredDamage` flag so the payout is never banked straight back. Returns true when
	 * the payout killed the creature. */
	tickMonsterDeferredDamage(this: DungeonScene, monster: Creature): boolean {
		if (!monster.deferredDamage || monster.deferredDamage <= 0) return false;
		if (monster.deferredDamageDelay) {
			monster.deferredDamageDelay = false;
			return false;
		}
		const tick = Math.max(1, Math.floor(monster.deferredDamage * 0.1));
		this.applyingDeferredDamage = true;
		monster.hp -= tick;
		this.applyingDeferredDamage = false;
		//`Viscosity.DeferedDamage` re-enters `DwarfKing.damage()`, whose lock `addTime` it feeds.
		this.lockedFloorBossDamage(monster, tick, tick);
		monster.deferredDamage = Math.max(0, monster.deferredDamage - tick);
		this.showDamage(monster, tick);
		if (monster.hp <= 0) {
			this.kill(monster);
			return true;
		}
		if (monster.deferredDamage <= 0) monster.deferredDamageDelay = false;
		return false;
	},

	/**
	 * DwarfKing's three one-way phase transitions (P1->P2 at an HP threshold, P2->P3 at
	 * shield-zero, and P3's one-time "losing" yell under 20 HP), as `mwg/core`'s
	 * `ReactionTable` rules instead of hand-rolled `if (...) { ...; phase = X; }` transition
	 * blocks each guarded by its own ad-hoc latch field. `once: true` matches Java's actual
	 * one-way transitions exactly - the same "boss entering phase two" shape `ReactionTable`'s
	 * own doc comment uses as its worked example. Rules close over this specific `king`
	 * instance (built fresh per King, not shared), so `action` mutates it directly rather than
	 * through the (`Readonly`-typed) `state` parameter `check()` passes.
	 */
	kingPhaseRules(this: DungeonScene, king: Creature): ReactionRule<Creature>[] {
		return [
			{
				id: 'kingPhase2',
				when: (k) => (k.kingPhase ?? 1) === 1 && k.hp <= (isChallengeEnabled('stronger_bosses') ? 100 : 50),
				action: () => {
					const threshold = isChallengeEnabled('stronger_bosses') ? 100 : 50;
					king.hp = threshold;
					king.kingPhase = 2;
					king.kingSummonsMade = 0;
					king.kingShield = king.maxHp;
					//`DwarfKing.damage()`'s P1->P2 branch teleports the King onto
					//`CityBossLevel.throne` (`ScrollOfTeleportation.appear(this, ...)` before the
					//`Property.IMMOVABLE` pin, tag `v3.3.8`); the throne cell here is `CITY_THRONE`
					//(`arena.center()`), and the appear presentation arrives through the shared
					//`playTeleportAppear`. Per-instance IMMOVABLE has no seam (`IMMOVABLE_KINDS`
					//is a kind-level MWL set), so the pin itself stays the existing
					//immobile-by-return in `takeKingTurn`, which likewise ends at P3 when the
					//phase falls through to movement again.
					const throne = { x: CITY_THRONE.x, y: CITY_THRONE.y };
					const throneFrom = { x: king.x, y: king.y };
					const throneOccupant = this.creatureAt(throne.x, throne.y);
					const throneSpot = throneOccupant && throneOccupant !== king
						? this.freeCellNear(throne)
						: throne;
					if (throneSpot) {
						king.x = throneSpot.x;
						king.y = throneSpot.y;
						this.playTeleportAppear(throneFrom, throneSpot, king);
					}
					for (const add of [...this.kingAdds]) if (add.hp > 0) this.kill(add);
					this.kingLinkedAdds.clear();
					this.say(t('port.log.kingphase2'), 'warning');
				},
				once: true,
			},
			{
				id: 'kingPhase3',
				when: (k) => (k.kingPhase ?? 1) === 2 && (k.kingShield ?? 0) <= 0,
				action: () => {
					king.kingPhase = 3;
					king.kingSummonsMade = 1;
					//`DwarfKing.damage()` calls `BossHealthBar.bleed(true)` on entering phase 3
					//(tag `v3.3.8`) - see `bossBleedLatched`.
					this.bossBleedLatched = true;
					this.say(t('actors.mobs.dwarfking.enraged', { '0': t(CLASS_KEYS[this.heroClass]) }), 'warning');
				},
				once: true,
			},
			{
				id: 'kingLosingYell',
				when: (k) => k.hp < 20,
				action: () => this.say(t('actors.mobs.dwarfking.losing'), 'warning'),
				once: true,
			},
		];
	},

	/** `DwarfKing.damage()` runs the P1->P2 and P2->P3 transitions on the damage event
	 * itself (tag `v3.3.8`), not on the King's next turn: the throne teleport, the
	 * full-HP shield and the subject cull all land before the hero's next damage source
	 * (a second swing, a bomb, a DoT tick) can touch the crossed threshold. The table's
	 * own `once` latch is what makes damage-time firing safe - `takeKingTurn`'s existing
	 * re-check cannot double-fire. Lethal P1 damage still kills outright: Java's own
	 * `super.damage()` runs `die()` (via `Char.damage()`'s `HP == 0` branch) before the
	 * phase branch ever sees the corpse, so the clamp only ever rescues a survivor -
	 * hence the `hp > 0` guard, matching `clampTenguBracket`'s and `yogDamageHook`'s.
	 * Found by the 13th monster-analysis matrix (boss transitions). */
	kingDamageHook(this: DungeonScene, king: Creature): void {
		if (king.kind !== 'king' || king.hp <= 0) return;
		king.kingReactions ??= new ReactionTable<Creature>(this.kingPhaseRules(king));
		king.kingReactions.check(king);
	},

	takeKingTurn(this: DungeonScene, king: Creature): void {
		const challenge = isChallengeEnabled('stronger_bosses');
		king.kingReactions ??= new ReactionTable<Creature>(this.kingPhaseRules(king));
		king.kingReactions.check(king);
		const phase = king.kingPhase ?? 1;
		if (phase === 1) {
			king.kingSummonCd = (king.kingSummonCd ?? 0) - 1;
			if ((king.kingSummonCd ?? 0) <= 0) {
				if (this.summonKingAdd(king, this.kingP1Summon((king.kingSummonsMade ?? 0), challenge))) {
					king.kingSummonsMade = (king.kingSummonsMade ?? 0) + 1;
					king.kingSummonCd = Random.normalRange(challenge ? 8 : 10, challenge ? 10 : 14);
				}
			}
			king.kingAbilityCd = (king.kingAbilityCd ?? 0) - 1;
			if ((king.kingAbilityCd ?? 0) <= 0 && this.kingAbility(king)) {
				king.kingAbilityCd = Random.normalRange(challenge ? 8 : 10, challenge ? 10 : 14);
				return;
			}
		}
		if (phase === 2) {
			//Java paces waves with `spend(3*TICK)` (wave-1 schedule, challenge
			//wave-2/3a) vs `spend(TICK)` (everything else) - the plan's cadence
			//counts the King's own turns between batches, same decrement-then-fire
			//shape as the P1 cooldowns above. The old code waved every turn, so
			//wave-1 adds arrived up to 3x faster than Java's.
			king.kingWaveCd = (king.kingWaveCd ?? 0) - 1;
			if ((king.kingWaveCd ?? 0) <= 0) {
				const plan = planRatKingWave(king.kingSummonsMade ?? 0, king.kingShield ?? 0, challenge, simulationRandom);
				if (plan) {
					this.kingWave(king, plan);
					king.kingWaveCd = plan.cadence;
				}
			}
			return;
		}
		if (phase === 3) {
			//`DwarfKing.act()` gates P3 reinforcement on fewer than 4 *pending* arrivals
			//(`buffs(Summoning.class).size() < 4`), not live servants - with this port's
			//instant spawns the pipeline is always empty, so P3 reinforces every turn with
			//no live cap, and every success advances the rotation below (which the old
			//live-count gate left frozen on one kind).
			if (this.summonKingAdd(king, this.kingP1Summon(king.kingSummonsMade ?? 1, challenge))) {
				king.kingSummonsMade = (king.kingSummonsMade ?? 1) + 1;
			}
		}
		const distance = Roguelike.chebyshevDistance(king, this.hero);
		if (distance <= 1) {
			this.attack(king, this.hero);
			return;
		}
		const blocked = new Set(
			this.creatures.filter((c) => c !== king && c !== this.hero).map((c) => this.level.index(c.x, c.y))
		);
		const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, king, king.hp / king.maxHp, this.hero, {
			sightRadius: this.viewRadius(),
			blocked,
		});
		if (decision.step) this.moveTo(king, decision.step);
	},

	/** P1/P3 summon rotation: every 4th summon (3rd on the challenge, 9th a golem there)
	 * is a monk or warlock, otherwise a ghoul. Delayed-arrival `Summoning` buffs collapse
	 * to instant spawns (1-turn granularity, like abilities). */
	kingP1Summon(this: DungeonScene, made: number, challenge: boolean): RatKingAddKind {
		return ratKingP1Summon(made, challenge, simulationRandom);
	},

	/** One royal servant beside the King (neighbour cells only, like the old guard calls;
	 * Java arrives onto arena pedestals after a 2-3 turn delay with arrival damage -
	 * stated); tracked for LifeLink subjects, wave counts, and death cleanup.
	 * `noExp` is Java's `maxLvl = -2` on the arrival (`Summoning.spawnMinion`):
	 * servants grant no XP and roll no loot, in every phase. */
	summonKingAdd(this: DungeonScene, king: Creature, kind: RatKingAddKind, damager = false): boolean {
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: king.x + dx, y: king.y + dy };
			if (!this.level.passable(at.x, at.y) || this.isChasmCell(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const add = this.spawnMonster(kind, at);
			add.sleeping = false;
			add.noExp = true;
			//P2-wave arrivals carry `KingDamager` (chip the P2 shield when they die);
			//P1/P3 servants do not, so the P1->P2 cull below chips nothing.
			if (damager) add.kingDamager = true;
			this.kingAdds.add(add);
			this.say(t('port.log.kingadds'), 'warning');
			return true;
		}
		return false;
	},

	/** P1 LINK/TELE-lite over the live servants (skeletons are never subjects in Java -
	 * only ghouls/monks/warlocks/golems, which is all this court ever holds). LINK marks
	 * the furthest unlinked servant (damage splits across the link - see `attack()`);
	 * TELE moves the King himself first (past himself away from the hero, else the
	 * open neighbour furthest from the hero) and then sets the furthest servant
	 * beside the hero, with the real yell. First pick is 50/50, then 1-in-8 to
	 * repeat LINK, 7-in-8 to repeat TELE. */
	kingAbility(this: DungeonScene, king: Creature): boolean {
		const subjects = [...this.kingAdds].filter((add) => add.hp > 0
			&& (add.kind === 'ghoul' || add.kind === 'monk' || add.kind === 'warlock' || add.kind === 'golem'));
		if (subjects.length === 0) return false;
		const last = king.kingLastAbility ?? 0;
		const pick = last === 0 ? (Random.int(0, 2) === 0 ? 1 : 2)
			: last === 1 ? (Random.int(0, 8) === 0 ? 1 : 2)
			: (Random.int(0, 8) !== 0 ? 1 : 2);
		//Java assigns `lastAbility` at pick time, before either attempt - even a
		//whiffed round retunes the next pick. The old code only recorded successes.
		king.kingLastAbility = pick;
		const furthest = (list: Creature[]): Creature | null => {
			let best: Creature | null = null;
			let bestDist = -1;
			for (const m of list) {
				const d = Math.hypot(m.x - king.x, m.y - king.y);
				if (d > bestDist) { bestDist = d; best = m; }
			}
			return best;
		};
		if ((pick === 1 || subjects.every((s) => this.kingLinkedAdds.has(s)))) {
			const target = furthest(subjects.filter((s) => !this.kingLinkedAdds.has(s)));
			if (pick === 1 && target) {
				this.kingLinkedAdds.add(target);
				//Java alternates the two real `lifelink_1`/`lifelink_2` yells on a coin
				//flip - the invented `port.log.kinglink` line is gone with them.
				this.say(t(Random.int(0, 2) === 0 ? 'actors.mobs.dwarfking.lifelink_1' : 'actors.mobs.dwarfking.lifelink_2'), 'warning');
				return true;
			}
		}
		const target = furthest(subjects);
		if (target) {
			//`teleportSubject()`: the KING moves first - the cell past him away from
			//the hero along the shot line, else the open neighbour furthest from the
			//hero - and only then is the servant set beside the hero. The old code
			//teleported the servant alone, leaving the King standing still, and took
			//any free neighbour instead of a strictly-closer one.
			this.teleportKingAway(king);
			const heroDist = Math.hypot(this.hero.x - king.x, this.hero.y - king.y);
			const spots = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
				.filter((at) => this.level.inside(at.x, at.y) && this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)
					&& Math.hypot(at.x - king.x, at.y - king.y) < heroDist);
			spots.sort((a, b) => Math.hypot(a.x - king.x, a.y - king.y) - Math.hypot(b.x - king.x, b.y - king.y));
			if (spots[0]) this.moveTo(target, spots[0]);
			this.say(t(Random.int(0, 2) === 0 ? 'actors.mobs.dwarfking.teleport_1' : 'actors.mobs.dwarfking.teleport_2'), 'warning');
			return true;
		}
		return false;
	},

	/** `teleportSubject()`'s first half: the King steps past himself away from the
	 * hero down the shot line when that cell is open, else the open neighbour
	 * furthest from the hero (strictly further - ties stay put). Euclidean stands
	 * in for `trueDistance`, passable for `!solid`, as elsewhere. */
	teleportKingAway(this: DungeonScene, king: Creature): void {
		const dx = Math.sign(king.x - this.hero.x);
		const dy = Math.sign(king.y - this.hero.y);
		const beyond = { x: king.x + dx, y: king.y + dy };
		if ((dx !== 0 || dy !== 0) && this.level.inside(beyond.x, beyond.y)
			&& this.level.passable(beyond.x, beyond.y) && !this.creatureAt(beyond.x, beyond.y)) {
			this.moveTo(king, beyond);
			return;
		}
		let best: { x: number; y: number } | null = null;
		let bestDist = Math.hypot(king.x - this.hero.x, king.y - this.hero.y);
		for (const [ox, oy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: king.x + ox, y: king.y + oy };
			if (!this.level.inside(at.x, at.y) || !this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const d = Math.hypot(at.x - this.hero.x, at.y - this.hero.y);
			if (d > bestDist) { bestDist = d; best = at; }
		}
		if (best) this.moveTo(king, best);
	},

	/** P2 wave schedule (counts in `planRatKingWave`): the batches arrive at Java's
	 * `spend` pacing via the caller's `kingWaveCd`, and the shield damage lands
	 * per dead add in `kill()` (`KingDamager` HT/12, HT/18 on the challenge) -
	 * never here. The old code chipped the shield once per wave-turn regardless
	 * of kills, so P2 ended on a fixed ~12-turn schedule while Java stalls until
	 * the adds actually die. Wave yells are real, placed exactly where Java
	 * yells them. */
	kingWave(this: DungeonScene, king: Creature, plan: RatKingWavePlan): void {
		if (plan.announcement) this.say(t(`actors.mobs.dwarfking.${plan.announcement}`), 'warning');
		king.kingSummonsMade = plan.nextSummonsMade;
		for (const kind of plan.adds) this.summonKingAdd(king, kind, true);
	},

	/**
	 * Yog-Dzewa: each crossed HP gate tears open another fist (Java gates sit at
	 * HT-300*phase; the damage hook below scales them to this fight). Fists make Yog
	 * untouchable (`isInvulnerable` - see `yogShielded`) but do NOT hold its beams:
	 * Java aims and fires DeathGaze every turn regardless of fists, and keeps
	 * summoning regulars on a catch-up float cooldown. The fistless-P5 bleed is Java's
	 * own `BossHealthBar.bleed(true)` in `processFistDeath` - a bar flag, not damage over
	 * time - and it arrives through `bossBleedLatched` (see `kill`'s fist branch).
	 */
	takeYogTurn(this: DungeonScene, yog: Creature): void {
		//`YogDzewa.act()`'s phase-0 dormancy: risen but unseeing, Yog spends each turn idle
		//and untouchable until the hero's FOV reaches his cell, then `notice()`s awake -
		//boss bar, "I. SEE. YOU.", `HALLS_BOSS`, and phase 1 with fresh 10-15 cooldowns.
		//This port keeps the yell, the phase and the cooldowns; the bar is moot (no boss-bar
		//UI) and the music already plays on boss-floor entry. The turn still ends here even
		//on the noticing turn itself, exactly like Java's trailing `spend(TICK); return`.
		if ((yog.yogPhase ?? 1) === 0) {
			if (this.fov.isVisible(yog.x, yog.y)) {
				yog.yogPhase = 1;
				yog.yogSummonCd = Random.normalRange(10, 15);
				yog.yogBeamCd = Random.normalRange(10, 15);
				this.say(t('actors.mobs.yogdzewa.notice'), 'warning');
			}
			return;
		}
		//Phase gates ride the damage hook (`yogDamageHook`), never the turn; the P5
		//clamp below is Java's end-of-turn leftover cap, applied every turn here.
		const phase = yog.yogPhase ?? 1;
		yog.yogSummonCd = (yog.yogSummonCd ?? Random.normalRange(10, 15)) - 1;
		if (phase === 5) yog.yogSummonCd = Math.min(yog.yogSummonCd, 3);
		//`YogDzewa.act()` summons in a `while (summonCooldown <= 0)` loop, so a deep
		//debt (phase 5 opens at -15) bursts several minions in one turn; there is no
		//floor on the re-roll, and a live fist stretches it by `MIN_SUMMON_CD - phase + 1`.
		while (yog.yogSummonCd <= 0) {
			if (!this.summonYogMinion(yog)) break;
			yog.yogSummonCd += Random.normalRange(10, 15) - Math.max(0, phase - 1);
			if (this.creatures.some((c) => c.kind === 'yogFist' && c.hp > 0)) {
				yog.yogSummonCd += 10 - Math.max(0, phase - 1);
			}
		}

		//`YogDzewa.act()` runs DeathGaze in two phases: the aiming turn only paints
		//`targetedCells`, and a later turn fires a beam along each painted cell's path. A rooted hero
		//delays the fire (the beams stay painted until the roots lift), matching Java's
		//`!Dungeon.hero.rooted` gate.
		const targeted = yog.yogTargeted ?? [];
		if (targeted.length > 0) {
			if (this.hero.buffs.roots) return;
			this.fireYogDeathGaze(yog, targeted);
			yog.yogTargeted = [];
		}
		yog.yogBeamCd = (yog.yogBeamCd ?? Random.normalRange(10, 15)) - 1;
		//`YogDzewa.act()` aims with no range or line gate (map-wide `WONT_STOP` rays),
		//and clamps a leftover cooldown to 2 on entering the final phase.
		if (phase === 5 && yog.yogBeamCd > 2) yog.yogBeamCd = 2;
		if (yog.yogBeamCd <= 0) {
			yog.yogTargeted = this.aimYogDeathGaze(yog);
			yog.yogBeamCd = Math.max(2, Random.normalRange(10, 15) - Math.max(0, (yog.yogPhase ?? 1) - 1));
			//`YogDzewa.act()` spends `GameMath.gate(TICK, ceil(hero.cooldown()), 3*TICK)` on the
			//aiming turn and calls `Dungeon.hero.interrupt()` (tag `v3.3.8`) - the same gated
			//expression the newborn telegraph uses through `pendingMonsterTurnCost`, and the same
			//drop-the-auto-travel stand-in the talisman site uses for the interrupt.
			this.pendingMonsterTurnCost = Math.min(3, Math.max(1, Math.ceil(this.getAttackTurnCostMod())));
			this.travelTarget = null;
		}
	},

	/** `YogDzewa.act()`'s aiming half: `beams = 1 + (HT - HP)/400` target cells, scaled to this
 * port's 400 HP so the 40%/80%-damage-taken escalation survives (see `aimYogDeathGaze`), one per beam - the
	 * hero's own cell first, then random 8-neighbours no farther from Yog than the hero is
	 * (`Level.trueDistance`, i.e. Euclidean). If the union of the beams' paths already covers every
	 * passable cell beside the hero, Java drops one beam so a volley cannot blanket the whole 3x3
	 * around the hero. Returns the painted cell indices, persisted as `yogTargeted`. */
	aimYogDeathGaze(this: DungeonScene, yog: Creature): number[] {
		return aimYogDeathGaze({
			width: this.level.width,
			height: this.level.height,
			hero: this.hero,
			yog,
			maxHp: yog.maxHp,
			hp: yog.hp,
			neighbours: Roguelike.neighbourOffsets(8),
			index: (x, y) => this.level.index(x, y),
			passable: (x, y) => this.level.passable(x, y),
			trace: (from, to) => Roguelike.traceLine(from, to),
			random: simulationRandom,
		});
	},

	/** `YogDzewa.act()`'s firing half: a beam along each painted cell's path damages every character
	 * it crosses - Java's `ch.alignment != alignment || ch instanceof Bee`, and every non-Yog
	 * character here is hostile - through the shared hit roll and armor reduction, for the real
	 * `NormalIntRange(20,30)`, or 30-50 under Stronger Bosses. Java also burns flamable terrain
	 * along each path (`Dungeon.level.destroy`), which this port now does too - see the burn in
	 * the path walk below. */
	fireYogDeathGaze(this: DungeonScene, yog: Creature, targeted: readonly number[]): void {
		//`YogDzewa.act()` dispels invisibility on every firing turn, before the hit rolls,
		//whether or not anything stands in the beams - same as the Eye's own gaze here.
		delete this.hero.buffs['invisibility'];
		const stronger = isChallengeEnabled('stronger_bosses');
		const affected = new Set<Creature>();
		for (const cell of targeted) {
			const to = { x: cell % this.level.width, y: Math.floor(cell / this.level.width) };
			for (const point of Roguelike.traceLine(yog, to)) {
				const creature = this.creatureAt(point.x, point.y);
				if (creature && creature !== yog) affected.add(creature);
			//`YogDzewa.act()` runs `Dungeon.level.destroy(p)` on every flamable path cell -
			//The FLAMABLE flag covers grass, furrows, both door states and barricades,
			//rewriting the tile to EMBERS. Unlike the shared fire path, `destroy()` touches
			//no heap contents, so the beam uses the flammability gate but not `burnFireTerrain`.
			if (this.isFireFlammableTerrain(point.x, point.y)) {
				const cell = this.level.index(point.x, point.y);
				if (this.portedPaint) this.portedPaint.map[cell] = Terrain.EMBERS;
				this.level.set(point.x, point.y, EMBERS);
				this.restitchTilesAround(point.x, point.y);
			}
			}
		}
		this.say(t('port.log.yogbeam'), 'warning');
		for (const target of affected) {
			if (!rollHit(yog, target, true)) continue;
			//No armor: `YogDzewa`'s beam calls `ch.damage(Random.NormalIntRange(20, 30), new
			//Eye.DeathGaze())` directly (30-50 under Stronger Bosses), and `Char.damage()`
			//subtracts no DR - see `zapHero`'s note. The armor roll used to come off here, which
			//made the final boss's beam weaker than Java's against an armored hero.
			let dmg = Random.normalRange(stronger ? 30 : 20, stronger ? 50 : 30);
			if (target.isHero) dmg = this.absorbHeroDamage(dmg, true);
			target.hp -= dmg;
			this.showDamage(target, dmg);
			if (target.hp <= 0) this.kill(target, 'foe');
		}
		this.spawnProjectile(yog, this.hero);
	},

	/** YogFist.isNearYog(): within 4 cells of a live Yog (the real anchor is the exit+3
	 * arena spot Yog never leaves; live-position distance is equivalent while it holds).
	 * Near fists are invulnerable to everything - pull them away to kill them. Warns once
	 * per fight (Java warns once per fist; the per-fist latch has no seam here). */
	fistNearYog(this: DungeonScene, fist: Creature): boolean {
		const yog = this.creatures.find((c) => c.kind === 'yog' && c.hp > 0);
		return !!yog && Roguelike.chebyshevDistance(fist, yog) <= 4;
	},

	guardFist(this: DungeonScene, fist: Creature): boolean {
		if (fist.kind !== 'yogFist' || !this.fistNearYog(fist)) return false;
		if (!this.yogFistWarned) {
			this.yogFistWarned = true;
			this.say(t('actors.mobs.yogfist.invuln_warn'), 'warning');
		}
		return true;
	},

	/** YogDzewa.isInvulnerable(): dormant phase-0 (risen but unseeing until the hero's FOV
	 * reaches him - see `takeYogTurn`) or any live fist. The central choke `Char.damage()`
	 * checks for EVERY source, so all hero-side damage paths (melee/thrown/zap, bomb blasts,
	 * DoT ticks, trap blasts, gas) route through it rather than only `attack()`. */
	yogShielded(this: DungeonScene, yog: Creature): boolean {
		if (yog.kind !== 'yog' || yog.hp <= 0) return false;
		//`YogDzewa.isInvulnerable()`: phase 0 dormancy shields like a live fist does.
		if ((yog.yogPhase ?? 1) === 0) return true;
		return this.creatures.some((c) => c.kind === 'yogFist' && c.hp > 0);
	},

	/** YogDzewa.damage(): HP floors at each gate while a phase below 4 holds, and crossing
	 * a gate advances the phase with the darkness line and a new fist - drawn from the real
	 * seeded `fistSummons` deck, plus its `challengeSummons` pair on the Stronger Bosses
	 * challenge (see `yogFistDecks`). Gates are Java's absolute
	 * 300-HP steps at HT 1000, scaled to this fight's own balance-scaled HP pool as the
	 * same 0.3 fractions (280/160/40 at 400 max, P4 floor at step/3 like Java's 100) -
	 * the old BossPhases 0.75/0.5/0.25 rhythm had no Java basis. Phase 5 opens in `kill()`,
	 * not here. Only runs when damage actually landed (the gate above owns the fist-up
	 * case). */
	yogDamageHook(this: DungeonScene, yog: Creature, preHp: number): void {
		if (yog.kind !== 'yog' || yog.hp <= 0) return;
		//`YogDzewa.damage()` returns before the phase logic while dormant or fist-guarded;
		//the HP itself still applied above, exactly like `super.damage()` running first.
		if ((yog.yogPhase ?? 1) === 0) return;
		const step = 0.3 * yog.maxHp;
		const phase = yog.yogPhase ?? 1;
		if (phase < 4) {
			yog.hp = Math.max(yog.hp, yog.maxHp - step * phase);
		} else if (phase === 4) {
			yog.hp = Math.max(yog.hp, step / 3);
		}
		//`YogDzewa.damage()` (tag `v3.3.8`): the taken damage is measured AFTER the
		//clamp above (`int dmgTaken = preHP - HP`), and accelerates both cooldowns
		//(`-= dmgTaken/10`). Found by the 13th monster-analysis matrix (bosses).
		const dmgTaken = Math.max(0, preHp - yog.hp);
		this.creditLockedFloor('yog', dmgTaken, dmgTaken);
		if (dmgTaken > 0) {
			yog.yogSummonCd = (yog.yogSummonCd ?? Random.normalRange(10, 15)) - dmgTaken / 10;
			yog.yogBeamCd = (yog.yogBeamCd ?? Random.normalRange(10, 15)) - dmgTaken / 10;
		}
		if (phase < 4 && yog.hp <= yog.maxHp - step * phase) {
			yog.yogPhase = phase + 1;
			this.say(t('actors.mobs.yogdzewa.darkness'), 'negative');
			this.summonFist(yog);
			//A fresh fist buys Yog room: both cooldowns reset to at least 5, exactly
			//like `addFist()`'s own `if (cooldown < 5) cooldown = 5` pair.
			if ((yog.yogSummonCd ?? 0) < 5) yog.yogSummonCd = 5;
			if ((yog.yogBeamCd ?? 0) < 5) yog.yogBeamCd = 5;
		}
	},

	/** `YogDzewa`'s `fistSummons`/`challengeSummons` decks, built once per Yog on the same seeded
	 * stream Java's own field initializer pushes (`Random.pushGenerator(Dungeon.seedCurDepth()+1)`):
	 * one fist from each of the three opposed pairs, `Random.shuffle`d, plus - only on the
	 * Stronger Bosses challenge - the three paired counterparts in one of two rotations, so a
	 * fist and its own pair can never be summoned by the same gate. */
	yogFistDecks(this: DungeonScene, yog: Creature): { summons: string[]; challenge: string[] } {
		if (yog.yogFistDeck && yog.yogChallengeDeck) return { summons: yog.yogFistDeck, challenge: yog.yogChallengeDeck };
		const pairOf = (type: string): string =>
			type === 'burning' ? 'soiled' : type === 'soiled' ? 'burning'
				: type === 'rotting' ? 'rusted' : type === 'rusted' ? 'rotting'
					: type === 'bright' ? 'dark' : 'bright';
		SpdRandom.pushGenerator(spdSeedForDepth(this.runSeedLong, this.depth, 0) + 1n);
		try {
			const pairs: [string, string][] = [['burning', 'soiled'], ['rotting', 'rusted'], ['bright', 'dark']];
			const summons = pairs.map(([a, b]) => (SpdRandom.int(2) === 0 ? a : b));
			SpdRandom.shuffle(summons);
			const challenge = SpdRandom.int(2) === 0
				? [pairOf(summons[1]!), pairOf(summons[2]!), pairOf(summons[0]!)]
				: [pairOf(summons[2]!), pairOf(summons[0]!), pairOf(summons[1]!)];
			yog.yogFistDeck = summons;
			yog.yogChallengeDeck = challenge;
		} finally {
			SpdRandom.popGenerator();
		}
		return { summons: yog.yogFistDeck!, challenge: yog.yogChallengeDeck! };
	},

	/** `YogDzewa.damage()`'s gate: `fistSummons.remove(0)`, plus - on the Stronger Bosses
	 * challenge - `challengeSummons.remove(0)`, each spawned beside Yog. The decks hold exactly
	 * one entry per gate (three gates), so they bound the number of fists by themselves; Java
	 * places them at the level exit, this port at the first free neighbour. */
	summonFist(this: DungeonScene, yog: Creature): void {
		const { summons, challenge } = this.yogFistDecks(yog);
		const types = [summons.shift(), ...(isChallengeEnabled('stronger_bosses') ? [challenge.shift()] : [])];
		for (const type of types) {
			if (!type) continue;
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const at = { x: yog.x + dx, y: yog.y + dy };
				if (!this.level.passable(at.x, at.y) || this.isChasmCell(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
				const fist = this.spawnMonster('yogFist', at);
				fist.yogFistType = type as Creature['yogFistType'];
				fist.fistZapCd = 0;
				// `YogFist.java`'s live numbers (`yogFistSummonStats` in `actor-rules.mwl`) -
				// the rusted fist hits harder, every other type shares the default line.
				const summon = YOG_FIST_SUMMON_STATS[type === 'rusted' ? 'rusted' : 'default'];
				if (!summon) throw new Error(`MWL yog fist summon stats are missing type: ${type}`);
				fist.maxHp = fist.hp = summon.hp;
				fist.accuracy = summon.accuracy;
				fist.evasion = summon.evasion;
				fist.damage = [summon.damage[0], summon.damage[1]];
				fist.armor = [summon.armor[0], summon.armor[1]];
				fist.sleeping = false;
				this.say(t('port.log.yogfistslam'), 'warning');
				break;
			}
		}
	},

	/** `SoiledFist.canSpreadGrass()`: new grass only takes more than 4 cells (Chebyshev) from
	 * Yog's own anchor (`exit + width*3`), on a non-solid cell that is not already tall grass.
	 * This port's live terrain has no `FURROWED_GRASS` id, so Java's furrow rolls land on the
	 * `HIGH_GRASS` ("tall grass") state this port does have. */
	canSpreadFistGrass(this: DungeonScene, x: number, y: number): boolean {
		if (!this.level.inside(x, y) || !this.level.passable(x, y)) return false;
		if (this.level.get(x, y) === HIGH_GRASS) return false;
		if (this.stairs && Math.max(Math.abs(x - this.stairs.x), Math.abs(y - (this.stairs.y + 3))) <= 4) return false;
		return true;
	},

	/** Grows grass on every eligible cell of the 3x3 around `at` (Java's `NEIGHBOURS9`), asking
	 * `furrow` per cell whether to leave tall grass (Java's `FURROWED_GRASS`) instead of plain -
	 * Java rolls that only in `zap()`, never in `act()`. */
	spreadFistGrass(this: DungeonScene, at: { x: number; y: number }, furrow: () => boolean): void {
		for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as ReadonlyArray<readonly [number, number]>) {
			const x = at.x + dx, y = at.y + dy;
			if (!this.canSpreadFistGrass(x, y)) continue;
			this.level.set(x, y, furrow() ? HIGH_GRASS : GRASS);
		}
	},

	/** `BrightFist`/`DarkFist.damage()`'s warp: relocate to a random level cell that is not in the
	 * hero's field of view, not solid, unoccupied, and reachable from the level exit - Java redraws
	 * `Random.Int(level.length())` until all four hold. */
	teleportFistAway(this: DungeonScene, fist: Creature): void {
		if (!this.stairs) return;
		const fov = new Roguelike.FieldOfView(this.level);
		fov.update(this.hero.x, this.hero.y, this.viewRadius());
		//The fist must land outside the hero's *smoke-aware* sight, like `refresh()`'s own.
		this.pruneSmokeFromSight(fov, this.hero.x, this.hero.y);
		for (let attempt = 0; attempt < 200; attempt++) {
			const at = { x: Random.int(this.level.width), y: Random.int(this.level.height) };
			if (!this.level.passable(at.x, at.y) || this.isChasmCell(at.x, at.y)) continue;
			if (this.creatureAt(at.x, at.y) || fov.isVisible(at.x, at.y)) continue;
			if (!this.pathfinder.find(at, this.stairs)) continue;
			this.moveTo(fist, at);
			//Java drops the fist to `WANDERING` on arrival; losing the hero is this
			//port's closest state, so the next turn re-acquires instead of instantly
			//zapping from the new cell.
			fist.seesHero = false;
			return;
		}
	},

	/** `SoiledFist.damage()`'s grass cut: blows lose `(6-n)/6`, rounded, where n is the
	 * number of tall-grass cells in the fist's 3x3 (Java counts FURROWED_GRASS or
	 * HIGH_GRASS; this port's furrows are tall grass). A `damage()` override, so every
	 * source runs it - `attack()` and the blast seam both call here. */
	soiledGrassCut(this: DungeonScene, defender: Creature, damage: number): number {
		if (defender.kind !== 'yogFist' || defender.yogFistType !== 'soiled') return damage;
		let grassCells = 0;
		for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as ReadonlyArray<readonly [number, number]>) {
			if (this.level.inside(defender.x + dx, defender.y + dy)
				&& this.level.get(defender.x + dx, defender.y + dy) === HIGH_GRASS) grassCells++;
		}
		return grassCells > 0 ? Math.round((damage * (6 - grassCells)) / 6) : damage;
	},

	/** `RottingFist.damage()`'s conversion: any non-invulnerable hit lands no HP damage
	 * and instead sets Bleeding to 60% of the blow, rounded (`Bleeding.set` keeps the
	 * strongest level, like this port's `setBleeding`). Returns the HP damage left over.
	 * Both callers check the proximity guard first, matching `isInvulnerable`. Bleeding
	 * itself never reaches either caller (the DoT tick applies directly), and Corrosion
	 * has its own tick below (the ACIDIC property halves it there first). A hero harvest
	 * strike is exempt: `Sickle.harvestAbility` pins a `HarvestBleedTracker` on the enemy
	 * and the conversion skips tracked victims, so the harvest bleed lands instead -
	 * `abilityHarvestNext` armed on the hero is this port's stand-in for that tracker. */
	rottingBleedConvert(this: DungeonScene, defender: Creature, damage: number, harvestArmed: boolean): number {
		if (defender.kind !== 'yogFist' || defender.yogFistType !== 'rotting' || damage <= 0 || harvestArmed) return damage;
		setBleeding(defender, Math.round(damage * 0.6));
		return 0;
	},

	/** `BrightFist.damage()`/`DarkFist.damage()`'s half-HP edge: the first crossing pins
	 * HP at half max and warps the fist away; Bright additionally prolongs the hero's
	 * Blindness 1.5x (15 turns of the table's `daze`), Dark detaches the hero's Light
	 * instead (no light model here, so nothing lands on that half). The death edges live
	 * in `kill`, not here. */
	brightDarkHalfHp(this: DungeonScene, defender: Creature, preHp: number): void {
		const type = defender.kind === 'yogFist' ? defender.yogFistType : undefined;
		if ((type !== 'bright' && type !== 'dark') || defender.hp <= 0) return;
		if (preHp <= defender.maxHp / 2 || defender.hp > defender.maxHp / 2) return;
		defender.hp = defender.maxHp / 2;
		if (type === 'bright' && !buffBlocked(this.hero, 'daze')) this.hero.buffs['daze'] = Math.max(this.hero.buffs['daze'] ?? 0, 15);
		this.teleportFistAway(defender);
	},

	/** `BurningFist.act()`: evaporate the fist's own water cell (steam visuals unmodeled),
	 * then `Random.chances([0,1,2])` random 8-neighbours evaporated the same way - the roll
	 * may repeat a cell, so the same uniform pick is made per roll - then top fire up to 4
	 * on every non-water non-solid cell of the 3x3 (`4 - vol` seeded where `vol < 4`). */
	burningFistAct(this: DungeonScene, fist: Creature): void {
		if (this.level.get(fist.x, fist.y) === WATER) this.level.set(fist.x, fist.y, FLOOR);
		//`Random.chances([0,1,2])` (1 with 1/3, 2 with 2/3) as one uniform int draw; mwg's
		//live `Random` has no `chances`, and the seeded `SpdRandom` stream is levelgen's.
		const evaporated = Random.int(3) === 0 ? 1 : 2;
		for (let i = 0; i < evaporated; i++) {
			const [dx, dy] = Roguelike.neighbourOffsets(8)[Random.int(8)]!;
			if (this.level.inside(fist.x + dx, fist.y + dy) && this.level.get(fist.x + dx, fist.y + dy) === WATER) {
				this.level.set(fist.x + dx, fist.y + dy, FLOOR);
			}
		}
		this.topUpFistFire(fist);
	},

	/** The fire top-up `BurningFist.act()` and `BurningFist.zap()` share: `4 - vol` seeded
	 * on every non-water non-solid 3x3 cell whose fire volume is below 4. Java tests
	 * `solid`; this port has no separate solid gate, so walkability stands in - a chasm
	 * cell a real fist would seed (chasm is not solid) is skipped here instead. */
	topUpFistFire(this: DungeonScene, at: { x: number; y: number }): void {
		for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as ReadonlyArray<readonly [number, number]>) {
			const x = at.x + dx, y = at.y + dy;
			if (!this.level.inside(x, y) || this.level.get(x, y) === WATER || !this.level.passable(x, y)) continue;
			const vol = this.fire.volumeAt(x, y);
			if (vol < 4) this.fire.seed(x, y, 4 - vol);
		}
	},

	/** `SoiledFist.act()`: `Random.chances([0,2,1])` furrow rolls (1.33 cells on average) that
	 * upgrade a plain GRASS neighbour to tall grass, then plain grass across the rest of its 3x3. */
	soiledFistAct(this: DungeonScene, fist: Creature): void {
		//`Random.chances([0,2,1])` (1 with 2/3, 2 with 1/3, 1.33 on average) as one uniform
		//int draw - the old `chance(2/3) ? 2 : 1` had the weights backwards (2 with 2/3).
		const furrows = Random.int(3) === 0 ? 2 : 1;
		const cells = [[0, 0], ...Roguelike.neighbourOffsets(8)] as ReadonlyArray<readonly [number, number]>;
		for (let i = 0; i < furrows; i++) {
			const [dx, dy] = cells[Random.int(cells.length)]!;
			const x = fist.x + dx, y = fist.y + dy;
			if (this.level.inside(x, y) && this.level.get(x, y) === GRASS) this.level.set(x, y, HIGH_GRASS);
		}
		this.spreadFistGrass(fist, () => false);
	},

	/**
	 * Goo's real pump-up mechanic (`Goo.java`'s `doAttack`/`pumpedUp`), simplified to melee
	 * range: `pumped` 0 -> chance to start charging instead of attacking (higher below half
	 * health, matching `Random.Int((HP*2<=HT) ? 2 : 5) > 0`) -> 1 -> 2, a guaranteed second
	 * charge turn, sprite-only in Java (`GooSprite.pumpUp`) - a log line here -> the slam
	 * itself at 3x damage and 2x accuracy, then back to 0. `liveStats` already applies the
	 * below-half-health enrage to Goo's ordinary attacks; the temporary object below only
	 * needs `kind` cleared so `liveStats` does not re-apply that on top of the 3x/2x it is
	 * already carrying explicitly.
	 */
	takeGooTurn(this: DungeonScene, goo: Creature): void {
		//`Goo.act()` clears a charge held outside HUNTING; a Goo that cannot see the
		//hero is not on the hunt, so a blind Goo drops the pump here.
		if (!goo.seesHero && (goo.pumped ?? 0) > 0) goo.pumped = 0;
		this.checkSewerBossSeal();
		runGooTurn(goo, {
			hero: this.hero,
			inWater: (x, y) => this.level.get(x, y) === WATER,
			strongerBosses: isChallengeEnabled('stronger_bosses'),
			stats: (boss) => liveStats(boss),
			attack: (attacker, defender) => { this.attack(attacker, defender); },
			showHeal: (target, amount) => this.showHeal(target, amount),
			say: (message, level) => this.say(message, level),
			foulBossChallenge: () => this.foulBossChallenge(),
			onWaterHeal: (healInc) => this.lockedFloorGooHeal(healInc),
			random: simulationRandom,
			messages: { slam: t('port.log.gooslam'), pump: t('port.log.goopump'), pumpMore: t('port.log.goopumpmore') },
		});
	},

	randomFreeCell(this: DungeonScene, exclude: Step): Step | undefined {
		//`ScrollOfTeleportation.teleportChar` (`items/scrolls/ScrollOfTeleportation.java`, tag
		//`v3.3.8`) lands on `Level.randomRespawnCell`: passable, unoccupied, outside the
		//hero's FOV, with secret cells re-rolled (up to 20 tries before `no_tele`). The port
		//collects the accepted set instead of probing with a cap, so it never fails spuriously
		//where Java can return -1. Chasms read passable in this port's level (the hero can
		//fall in), so they need the explicit refusal Java's own `passable[]` gives it.
		//LARGE chars needing `openSpace` stay unmodeled (no open-space concept here), as does
		//`teleportPreferringUnseen`'s unseen-room preference for the scroll itself.
		const cells: TeleportCell[] = [];
		for (let y = 1; y < this.level.height - 1; y++) {
			for (let x = 1; x < this.level.width - 1; x++) {
				cells.push({
					x, y,
					passable: this.level.passable(x, y),
					//`creatureAt` returns null for an empty cell; comparing against undefined marked every cell
					//occupied, so no random teleport (fadeleaf, displacement, the scroll's fallback) ever found a cell.
					occupied: (x === exclude.x && y === exclude.y) || this.creatureAt(x, y) !== null,
					visible: this.fov.isVisible(x, y),
					secret: this.secrets.isSecret(x, y),
					chasm: this.isChasmCell(x, y),
				});
			}
		}
		return Random.element(teleportCandidates(cells)) ?? undefined;
	},

	/** `Level.randomDestination(Mob)`: Java samples any passable cell, while the port also
	 * excludes occupied cells so a saved target cannot immediately become an impossible
	 * destination. Piranhas use their Java water-only movement restriction. */
	randomPatrolDestination(this: DungeonScene, monster: Creature): Step | undefined {
		return randomPatrolDestinationFlow(monster.kind === 'piranha' || monster.kind === 'phantomPiranha', this.wanderingContext());
	},

	moveTo(this: DungeonScene, creature: Creature, to: Step): void {
		if (creature.buffs['roots']) {
			//`Hero.java` 1770-1772 (`getCloser`): the hero's own rooted refusal shakes; a rooted
			//*monster* refuses silently in Java too (`Char.move` just returns), so this is hero-only.
			if (creature.isHero) this.shakeScreen(1, 1);
			return;
		}
		// Java mobs treat CHASM as solid for pathing even though the hero can enter it
		// and fall. The coarse terrain kind is open for FOV/hero collision, so enforce
		// the mob-specific rule at the final movement boundary.
		if (!creature.isHero && !creature.flying && this.isChasmCell(to.x, to.y)) return;
		const moved = creature.x !== to.x || creature.y !== to.y;
		faceCharacter(this.sprite(creature), creature.x, to.x);
		if (creature.isHero) runState.audio.cue('step', 0.32);
		creature.x = to.x;
		creature.y = to.y;
		//`Level.occupyCell()` (tag v3.3.8): whoever ends a move on a shut `DOOR` cell - hero, mob,
		//ally, flying or not - swings it open through `Door.enter()`; `leaveDoor` shuts it again once
		//the last occupant has gone. Without this a following monster walked through a door the hero
		//had just closed behind him, leaving it drawn shut with the monster standing in it. The hero
		//itself already opened it through `bumpDoor`, so this only fires for everyone else (and for
		//forced moves onto a door, which Java opens the same way). Locked and secret doors are
		//impassable to pathing, so the guards below only restate that.
		//DELIBERATE DIVERGENCE: bodiless creatures (`IMMATERIAL_KINDS`: ghosts, wraiths, spectral
		//necromancers) drift through a wooden door and leave it shut; Java opens it for them too.
		//Bees and flies are physical and open it like everyone else.
		const immaterial = (creature.kind !== undefined && IMMATERIAL_KINDS.has(creature.kind)) || creature.allyKind === 'ghost';
		if (moved && !immaterial && this.doors.isDoor(to.x, to.y) && !this.doors.isOpen(to.x, to.y)
			&& !this.doors.isLocked(to.x, to.y) && !this.secrets.isSecret(to.x, to.y)) {
			this.doors.open(to.x, to.y);
			if (this.fov.isVisible(to.x, to.y)) runState.audio.cue('door_open', 0.55);
			this.restitchTilesAround(to.x, to.y);
		}
		if (moved && (creature.kind === 'monk' || creature.kind === 'senior') && !creature.buffs['focus']) {
			//Monk.move() adds 0.67 to the normal cooldown reduction while travelling;
			//Senior.move() adds a further 1.66 (Monk.java/Senior.java, tag v3.3.8).
			creature.focusCooldown = (creature.focusCooldown ?? 0) - 0.67
				- (creature.kind === 'senior' ? 1.66 : 0);
		}
		//DM300.move() (`DM300.java` 322-347): stepping onto an `INACTIVE_TRAP` **wire** cell while
		//hunting grants Barrier for `30 + (HT-HP)/10` - but the method returns early when that cell is
		//already energized (`PylonEnergy.volumeAt(pos) > 0`), and it never applies on any other
		//terrain. This port reads the wire cell from the ported paint grid, because the live level
		//collapses `INACTIVE_TRAP` into the floor kind, and uses `seesHero` for Java's hunting state.
		//The persisted energy set is exactly what `activatePylon()` seeds, so "already energized" is
		//membership in it - the inverse of what this used to test, which also awarded the shield on
		//energized *water*, a cell Java never grants it from.
		if (creature.kind === 'dm300' && creature.dmSupercharged && !creature.flying && creature.seesHero) {
			const cell = this.level.index(to.x, to.y);
			const wireCell = this.portedPaint?.map[cell] === Terrain.INACTIVE_TRAP;
			if (wireCell && !this.cavesBossEnergyCells.has(cell)) {
				creature.dmBarrier = Math.max(creature.dmBarrier ?? 0, 30 + Math.floor((creature.maxHp - creature.hp) / 10));
			}
		}
		//Piranha.java's act() calls dieOnLand() when an effect leaves it outside water.
		//Normal piranha pathing only offers water cells, but forced movement deliberately
		//reaches this post-move check so knockback/teleport effects kill it immediately.
		if ((creature.kind === 'piranha' || creature.kind === 'phantomPiranha') && this.level.get(to.x, to.y) !== WATER) {
			this.kill(creature);
			return;
		}
		if (moved) this.triggerMobTrapAt(creature);
		if (creature.hp <= 0) return;
		//`triggerMobPlantAt` returns `true` for almost every branch it takes (including the
		//"no plant here after all" case), but only `fadeleaf` actually relocates the creature
		//(and manually places its sprite at the teleport destination). The other branches
		//(grass, Sorrowmoss, Firebloom, ...) leave the creature genuinely standing at `to`, so
		//returning on every truthy result used to skip the tween below for them too - the
		//sprite never slid to its new tile and sat one step behind the creature's real
		//position permanently (found from a live report: a snake's sprite three tiles from
		//where it was actually standing, close enough to land a real hit that looked like it
		//came from nowhere). Only skip when the creature's position no longer matches `to`.
		if (moved && this.triggerMobPlantAt(creature) && (creature.x !== to.x || creature.y !== to.y)) return;
		if (this.level.get(to.x, to.y) === WATER) this.waterSurface?.ripple(to.x, to.y);
		if (creature.isHero) {
			const heal = rejuvenatingStepHeal(this.level.get(to.x, to.y), GRASS, this.hero.hp, this.hero.maxHp, this.talentRank('rejuvenating_steps'));
			if (heal > 0) { this.hero.hp += heal; this.showHeal(this.hero, heal); }
		}
		//`CharSprite.moveInterval`: visual movement takes 0.1s for every character, the hero included
		//(the hero used to run its own copy of this inside `HeroAnimation`); logical turns remain
		//immediate either way.
		const sprite = this.sprite(creature);
		const motion = this.monsterMotion.get(sprite) ?? new Tweener();
		motion.clear(); this.monsterMotion.set(sprite, motion);
		const fromX = sprite.x, fromY = sprite.y;
		if (sprite instanceof AnimatedSprite && sprite.has('run')) sprite.play('run');
		void motion.tween(0.1, progress => {
			if (sprite.destroyed) return;
			sprite.position.set(fromX + (to.x * TILE - fromX) * progress, fromY + (to.y * TILE - fromY) * progress);
			if (progress === 1 && sprite instanceof AnimatedSprite && sprite.playing === 'run') sprite.play('idle');
		});
	},

	/**
	 * A voluntary monster step (`Goo.getCloser()`/`getFurther()`, tag `v3.3.8`):
	 * any step discharges a pump-up in progress - Java clears `pumpedUp` on
	 * entering either method, before the move itself, so the clear lands even
	 * when `moveTo` refuses (roots/chasm). Forced relocations (knockback,
	 * teleports, leaps, blinks) stay on `moveTo` directly - Java never routes
	 * those through getCloser/getFurther.
	 */
	stepMonster(this: DungeonScene, monster: Creature, to: Step): void {
		if (monster.kind === 'goo' && (monster.pumped ?? 0) > 0) monster.pumped = 0;
		//`Char.move()` under Vertigo: an adjacent step re-rolls to a random neighbour, or goes nowhere.
		if (monster.buffs['vertigo'] !== undefined) {
			const drunk = vertigoStep({ x: monster.x, y: monster.y }, to, Random.int(0, 8),
				(cell) => this.level.inside(cell.x, cell.y) && this.level.passable(cell.x, cell.y),
				(cell) => this.creatureAt(cell.x, cell.y) !== null);
			if (!drunk) return;
			to = drunk;
		}
		const from = { x: monster.x, y: monster.y };
		this.moveTo(monster, to);
		this.leaveDoor(from.x, from.y, monster);
	},

	/** Mirrors `Preparation`'s own rule onto the hero's combat data: the buff exists exactly while
	 * its target is invisible (`Preparation.act()` detaches the moment it is not), so the level is
	 * present only then. Java reads `buff(Preparation.class)` *on the attacker* inside
	 * `Char.attack()`, which is what `rollDamage` reads with `prepLevel`. */
	syncPreparation(this: DungeonScene): void {
		this.hero.prepLevel = this.hero.buffs['invisibility']
			? preparationLevel(this.prepInvisibleTurns).level
			: undefined;
	},

	/** One hero turn of `Preparation.act()`: the length of the current invisibility grows while it
	 * lasts, and both the counter and the level reset the moment it ends. The turn cost is rounded
	 * to a whole turn because every other per-turn counter in this port ticks once per hero action
	 * (the cloak's own stealth cost, buff durations) rather than per fractional time unit. */
	trackPreparation(this: DungeonScene, turnCost: number): void {
		if (this.hero.buffs['invisibility']) this.prepInvisibleTurns += Math.max(1, Math.round(turnCost));
		else this.prepInvisibleTurns = 0;
		//BountyHunterTracker is a zero-duration FlavourBuff in Java: it survives the turn it was
		//armed in and is gone by the hero's next one, which is exactly where this sits.
		this.bountyTrackerArmed = false;
		this.syncPreparation();
	},

	/** `Mob.lootChance()`'s Bounty Hunter term. Java adds it to the *drop chance multiplier*
	 * (beside the Ring of Wealth's own) rather than to the base chance, so the caller adds it into
	 * the same factor - and it needs both the tracker (armed by a prepared attack) and Preparation
	 * still being up, which is why an ordinary kill never sees it. */
	bountyHunterLootBonus(this: DungeonScene): number {
		if (!this.bountyTrackerArmed) return 0;
		const level = this.hero.prepLevel;
		if (level === undefined) return 0;
		return bountyHunterDropBonus(level, this.subclass() === 'assassin' ? this.talentRank('bounty_hunter') : 0);
	},
};
