import type { DungeonScene } from '../dungeonScene';
import { Actors, Random, Roguelike, TintedSprite } from 'mwg';
import { MISSILE_MAX_DURABILITY, missilePickupValid, missileStackId } from '../../items/missiles';
import { appearanceItemFrame } from '../../items/appearanceFrames';
import { eatFood as eatConsumableFood, quaffPotion as quaffConsumablePotion } from '../../items/consumables';
import { readScrollFlow, rollUpgradeAffixLoss, type ReadScrollContext } from '../../items/scrollEffects';
import { applyPotionPurity, cureHeroBuffs } from '../../items/potionEffects';
import { buyFromShop, buybackFromShop, sellFood, shopPrice as itemShopPrice, shopSellPrice as itemShopSellPrice, type ShopActionsContext } from '../../items/shopActions';
import { generatedInventoryItem as createGeneratedInventoryItem } from '../../items/generatedItems';
import { placeGroundItems as placeGeneratedGroundItems } from '../../items/groundPlacement';
import { planShopStock } from '../../items/shopStock';
import { BAG_IDS, bagFitsPickup, chooseShopBag, ownsBag, type BagPickupStack } from '../../items/bags';
import { pickupGroundItem as pickupGroundItemWorkflow } from '../../items/groundPickup';
import { BLACKSMITH_FREE_PICKAXE_FAVOR, blacksmithHardenCost as itemBlacksmithHardenCost, blacksmithReforgeCost as itemBlacksmithReforgeCost, blacksmithReforgePairValid, blacksmithTurnInFavor, blacksmithUpgradeCost as itemBlacksmithUpgradeCost, reforgeDiscardedMissileSet, rollCarriedAffixLoss, selectBlacksmithHardenItems, selectBlacksmithReforgeItems, selectBlacksmithUpgradeItems, type BlacksmithItem } from '../../items/blacksmith';
import { simulationRandom } from '../../adapters/mwgRandom';
import { simulationRoguelike } from '../../adapters/mwgRoguelike';
import { planMonsterPopulation } from '../../simulation/levelPopulation';
import { interactWithGhost as runGhostInteraction, interactWithImp as runImpInteraction, interactWithRatKing as runRatKingInteraction, interactWithWandmaker as runWandmakerInteraction } from '../../actors/npcs';
import { groundKindForItem } from '../../items/itemKinds';
import { startTransmutationPick } from '../../items/transmutation';
import { RING_DEFS } from '../../items/ringModifiers';
import { CLASS_KEYS, RING_KEYS, WAND_KEYS, capitalize, has, language, t } from '../../i18n/index';
import { SPD_STATUS_COLOR } from '../../ui/spdTheme';
import { SpdRandom } from '../../spdRng';
import { vaultCenterVisualFrames, vaultCenterWallFrames, vaultFloorFrames } from '../../spdLevelGen/vaultVisuals';
import { buybackPrice, getShopPrice } from '../../items/shopPricing';
import { Terrain } from '../../spdLevelGen/paintLevel';
import { foregroundGrassFrame } from '../../spdLevelGen/visualWalls';
import { Feeling } from '../../spdLevelGen/regularPainter';
import { runState } from '../../runState';
import { recordRun } from '../../rankings';
import { isChallengeEnabled } from '../../challenges';
import { CLASSES } from '../../classes';
import { showChoiceWindow, showConfirmWindow, showInfoWindow } from '../../ui/portWindows';
import { confirmBlacksmithCashout, confirmBlacksmithSmith, openBlacksmithWindow, type BlacksmithWindowContext } from '../../ui/blacksmithWindow';
import { getCurse } from '../../items/itemCurses';
import { Cat, blacksmithSmithRewards, generatorRandom, ghostQuestReward, randomArmor, randomArtifact, randomCategory, randomUsingDefaults, randomWeapon, setGeneratorDepth, type GenItem } from '../../items/generator';
import { mwlItemEffectValue } from '../../mwlContent';
import { hallsDemonSpawnerFloorFrames } from '../regions/halls';
import { resolveWandPickup, wandInitialCharges, wandTypeFromSource } from '../../items/wands';
import { newSpareWandCharges } from '../../simulation/spareWands';
import { itemDescription, itemStatsLine } from '../../items/displayName';
import { wandmakerQuestType, wandmakerQuestWands } from '../../spdLevelGen/wandmaker';
import { CHEST_FRAME, CRYSTAL_CHEST_FRAME, DOOR, DOOR_CLOSED, FLOOR, GRASS, HIGH_GRASS, ITEM_FRAME, LOCKED_CHEST_FRAME, TERRAIN_FRAME, TILE, WALL, WATER, type GroundItemKind } from '../../dungeonConstants';
import { REGION_GRASS, REGION_WATER, patchGenerate, type Region } from '../../genericDungeon';
import { type Creature, type GroundItem, type Step } from '../../combat';
import { nextEntityId } from '../../simulation/entityId';
import { markRingTypesKnown } from '../../simulation/ringKnow';
import { BOSSES, FLYING_KINDS, mobRosterForDepth, type MonsterId } from '../../monsters';
import { BLACKSMITH_SMITH_COST, STARTING_WEAPON_CLASS, WANDMAKER_CLASS_INTROS, scenarioQuest } from './shared';
import { mineTileFrames } from '../dungeonTileFrames';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `npcShopBlacksmith`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const npcShopBlacksmithMethods = {
	/** Plant.execute(AC_PLANT): consume one seed and register a persistent plant marker. */
	plantSeed(this: DungeonScene): void {
		const seed = this.requestedItemId ? this.bag.find(this.requestedItemId, this.requestedItemInstanceId) : undefined;
		if (!seed || seed.id !== 'seed') return;
		//Plant.Seed.onThrow(): the real NO_HERBALISM challenge falls through to a plain thrown-
		//item drop instead of ever planting - this port has no throw-to-cell targeting, so the
		//closest equivalent is simply refusing the plant action without consuming the seed.
		if (isChallengeEnabled('no_herbalism')) {
			this.say(t('port.log.noherbalism'), 'negative');
			return;
		}
		const x = this.hero.x, y = this.hero.y;
		const cell = this.level.index(x, y);
		if (!this.level.passable(x, y) || this.isChasmCell(x, y) || this.portedFeatures.kindAt(cell) !== undefined) {
			this.say(t('port.log.noplantcell'), 'negative');
			return;
		}
		const sourceClass = (seed as typeof seed & { sourceClass?: string }).sourceClass;
		const kind = this.seedPlantKind(sourceClass);
		if (!kind) {
			this.say(t('port.log.noseedeffect'), 'negative');
			return;
		}
		this.bag.remove('seed', 1, seed.instanceId);
		this.manualPlants.set(cell, kind);
		this.placePortedFeature(cell, kind);
		this.say(t('port.log.plantseed', { kind }), 'positive');
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
	},

	seedPlantKind(this: DungeonScene, sourceClass?: string): string | null {
		const name = (sourceClass ?? '').toLowerCase().replace(/\$seed$|\.seed$/, '').split('.').pop() ?? '';
		const supported = new Set(['blindweed', 'earthroot', 'fadeleaf', 'firebloom', 'icecap', 'mageroyal',
			'rotberry', 'sorrowmoss', 'starflower', 'stormvine', 'sungrass', 'swiftthistle']);
		return supported.has(name) ? name : null;
	},

	/**
	 * HallsLevel's DemonSpawnerRoom.CustomFloor.  Java uses the room's custom atlas rather
	 * than terrain art: frame 19 for ordinary cells, 27/31 for decorative floor cells, and
	 * frames 37-39 for the three-cell spawner sprite.  `baseline` is only true while the
	 * first-visit actors have not been spawned yet; revisits use the live creature list so a
	 * killed spawner does not reappear from the immutable painted mob list.
	 */
	/**
	 * `LastLevel`'s custom tiles, over the paint grid: the shaft's lit floor strip with its candle
	 * cluster, and the two fixed centre pieces over the entrance. The Amulet's own state changes
	 * all three (`amuletObtained` lights the candles and swaps the floor decoration), which is why
	 * the pickup site rebuilds the layers the same way the demon-spawner overlay is rebuilt.
	 */
	vaultTileLayers(this: DungeonScene): { floor: number[]; center: number[]; walls: number[] } {
		const paint = this.portedPaint!;
		const amuletObtained = this.gameState.switch('amuletObtained');
		return {
			floor: vaultFloorFrames(paint.map, paint.w, paint.h, this.tileVariance, amuletObtained),
			center: vaultCenterVisualFrames(paint.w, paint.h),
			walls: vaultCenterWallFrames(paint.w, paint.h),
		};
	},

	demonSpawnerFloorFrames(this: DungeonScene, baseline: boolean): number[] {
		return hallsDemonSpawnerFloorFrames({
			cellCount: this.level.cellCount,
			paint: this.portedPaint,
			rooms: this.level.rooms,
			index: (x, y) => this.level.index(x, y),
			amuletObtained: this.gameState.switch('amuletObtained'),
			liveSpawner: this.creatures.find(c => c.kind === 'demonSpawner') ?? null,
		}, baseline);
	},

	/**
	 * Re-picks both layers' frames for a cell and the ring around it, which is Java's
	 * `DungeonTilemap.updateMapCell` (it too rewrites a 3x3). Every wall and door frame reads
	 * its neighbours, so opening a door or uncovering a secret one restitches its
	 * surroundings - without this a revealed secret door keeps the wall face it was hiding
	 * behind, and an opened door keeps its shut art.
	 */
	/** Redraws the mine crystal/boulder layers after the pickaxe changes the raw grid. */
	refreshMineTiles(this: DungeonScene): void {
		if (!this.mineTiles || !this.mineOverhangs) return;
		const frames = mineTileFrames(this.tileFrameContext());
		this.mineTiles.setLayerData('mine', frames.raised);
		this.mineOverhangs.setLayerData('overhang', frames.overhang);
	},

	restitchTilesAround(this: DungeonScene, x: number, y: number): void {
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const cx = x + dx;
				const cy = y + dy;
				if (!this.level.inside(cx, cy)) continue;
				this.map.setTile('terrain', cx, cy, this.terrainFrameAt(cx, cy));
				this.wallsMap.setTile('walls', cx, cy, this.wallFrameAt(cx, cy));
				this.wallsMap.setTile('grass', cx, cy, foregroundGrassFrame(this.visualTerrainAt(cx, cy), this.tileVariance[this.level.index(cx, cy)]));
			}
		}
	},

	/** both layers at once, for the floor-wide reveals where restitching each cell's ring would redo most of the map anyway */
	restitchAllTiles(this: DungeonScene): void {
		this.map.setLayerData('terrain', this.terrainFrames());
		this.wallsMap.setLayerData('walls', this.wallFrames());
		this.wallsMap.setLayerData('grass', this.foregroundGrassFrames());
		this.featuresMap?.setLayerData('features', this.featureFrames());
	},

	/**
	 * Whether the stairs cannot be reached without first searching out a hidden door.
	 *
	 * `RegularPainter.paintDoors` turns every entrance-room door into `Door.Type.HIDDEN` on
	 * depth 1 while `SPDSettings.intro()` is set, and again on depth 2 until the guidebook's
	 * searching page has been found - its own comment calls this the tutorial. So the hero
	 * genuinely does start sealed into the entrance room, and that is **faithful generation,
	 * not a bug**: the doors are on the room's perimeter and `searchForSecrets` checks all
	 * eight neighbours, so they are findable. Do not "fix" it by opening them.
	 *
	 * What real SPD also ships, and this port does not, is the scaffolding that makes the
	 * seal fair - the Adventurer's Guide page lying in the starting room, a search button on
	 * the toolbar, and the prompts pointing at it. Without those, a correct seal reads as a
	 * broken floor, so `enterLevel` prints a one-line hint instead.
	 *
	 * Keyed off actual reachability rather than off `depth === 1`, so it stays right for the
	 * depth-2 case and anything else that ever seals a floor. A shut door counts as a way
	 * through, since bumping one opens it; a hidden door does not, being stored as plain wall
	 * until it is found.
	 */
	stairsNeedSearching(this: DungeonScene, start: Step): boolean {
		if (!this.hasStairs || this.secretDoorCells.size === 0) return false;

		const seen = new Uint8Array(this.level.cellCount);
		const queue: Step[] = [start];
		seen[this.level.index(start.x, start.y)] = 1;

		for (let head = 0; head < queue.length; head++) {
			const { x, y } = queue[head];
			if (x === this.stairs.x && y === this.stairs.y) return false;

			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nx = x + dx;
				const ny = y + dy;
				if (!this.level.inside(nx, ny)) continue;
				const cell = this.level.index(nx, ny);
				if (seen[cell]) continue;
				if (!this.level.passable(nx, ny) && this.level.get(nx, ny) !== DOOR_CLOSED) continue;
				seen[cell] = 1;
				queue.push({ x: nx, y: ny });
			}
		}
		return true;
	},

	/** the down staircase sprite - SPD's real `EXIT` tile, not the door tile this port used to reuse for it. `this.stairs` is already decided by `enterLevel`, before water/doors are painted */
	drawStairsSprite(this: DungeonScene): void {
		this.stairsSprite = new TintedSprite(this.terrainSheet.get(TERRAIN_FRAME.exit));
		this.stairsSprite.x = this.stairs.x * TILE;
		this.stairsSprite.y = this.stairs.y * TILE;
		this.creatureLayer.addChild(this.stairsSprite);
	},

	/** the up staircase the hero arrived by - SPD's real `ENTRANCE` tile. Every floor has one except the first, which has nothing above it to lead back to */
	placeEntrance(this: DungeonScene, at: Step): void {
		if (this.depth <= 1) return;

		const sprite = new TintedSprite(this.terrainSheet.get(TERRAIN_FRAME.entrance));
		sprite.x = at.x * TILE;
		sprite.y = at.y * TILE;
		this.creatureLayer.addChild(sprite);
	},

	/**
	 * Regular floors: `Bestiary.getMobRotation`'s real per-depth pool, more monsters the
	 * deeper down (SPD scales this by level connectivity, not a flat count - this port keeps
	 * a flat count, now drawing from the real roster for whichever region `this.depth` is in).
	 * Boss floors (`BOSSES`): that boss, alone, and nothing else.
	 */
	enterMiningBranch(this: DungeonScene): void {
		if (this.miningBranchActive) return;
		//The branch swaps the whole map out at the *same* depth, which the `depth` gate in
		//`tickBoomerangReturn` cannot see - a boomerang left in flight would resolve against the
		//other map's coordinates. Java's `Level.clearEntities(safeArea)` gives the boomerang back
		//(`storedItems.add(b.cancel())`) whenever a layout is rebuilt under the hero, so the unit
		//returns to the pile here too rather than flying home onto a map it was not thrown on.
		this.cancelBoomerangReturn();
		this.captureActiveFloor();
		this.miningBranchActive = true;
		this.activeFloorDepth = null;
		this.enterLevel();
	},

	leaveMiningBranch(this: DungeonScene): void {
		if (!this.miningBranchActive) return;
		this.cancelBoomerangReturn();
		this.miningBranchActive = false;
		this.activeFloorDepth = null;
		this.enterLevel();
	},

	populate(this: DungeonScene): void {
		if (this.miningBranchActive) {
			//`MiningLevel.createMob()`: GNOLL mines hold gnoll guards, CRYSTAL mines crystal wisps.
			if (!this.populateMiningBranch()) this.say(t('port.log.mineabandonedquiet'), 'warning');
			return;
		}
		const boss = BOSSES[this.depth];
		if (boss) {
			//`CavesBossLevel.seal()` creates DM-300 itself, at a random point in `mainArena`,
			//once the hero nears a pylon - not on floor entry like the other ported bosses.
			//See `checkCavesBossPylonGate`.
			if (boss.kind === 'dm300') return;
			//`HallsBossLevel.seal()` likewise spawns Yog itself, at `exit() + width*3` when
			//the hero walks two cells from the entrance - see `checkHallsBossSeal`, which also
			//owns the arrival line below.
			if (boss.kind === 'yog') return;
			//`PrisonBossLevel.occupyCell()`'s real `case START:` spawns Tengu himself, once the
			//hero has moved past the locked door into `tenguCell` - see `checkTenguFightStart`,
			//which also owns the arrival line.
			if (boss.kind === 'tengu') return;
			const room = this.level.rooms[this.level.rooms.length - 1] ?? this.level.rooms[1];
			this.spawnMonster(boss.kind, Roguelike.rectCenter(room));
			//`Statistics.qualifiedForBossChallengeBadge = true` at each boss fight's start.
			this.qualifiedForBossChallenge = true;
			this.say(
				boss.kind === 'goo'
					? 'You feel a pulse of ooze - Goo is here.'
					: 'A crowned figure rises from the throne - the Dwarf King is here.'
			);
			return;
		}

		//LastLevel: no roster, no monsters - just the way out (Java's 26 is the amulet vault)
		if (this.depth === 26) {
			//Java's `LastLevel.createItems()` drops the Amulet at AMULET_POS (8,12). It used
			//to be spawned by Yog's death after the old auto-descent; now the hero walks down
			//the unsealed stairs, so the vault carries it. Guarded: a re-entry must not mint
			//a second Amulet over the one already waiting (or won).
			if (!this.groundItemAt(8, 12) && !this.bag.find('amulet')) {
				this.spawnGroundItem('amulet', 8, 12);
				this.say(t('port.log.amuletwaits'), 'positive');
			}
			this.say(t('port.hint.vault'), 'warning');
			return;
		}

		const population = planMonsterPopulation(
			this.depth,
			mobRosterForDepth(this.depth),
			this.portedFloorActive && this.portedPaint?.feeling === 4,
			simulationRandom,
			simulationRoguelike,
		);
		const roster = population.roster;
		let rotationIndex = 0;
		const count = population.count;
		for (let i = 0; i < count; i++) {
			//A room rect includes its own wall ring in both generators, and a ported floor puts
			//far more solid terrain *inside* the ring than the generic one ever did - chasms,
			//statues, bookshelves and maze walls all map to WALL - so a cell has to be tested
			//for passability rather than assumed open. Retried like placeGroundItems does.
			//
			//RegularLevel.createMobs() explicitly excludes `roomEntrance` from mob placement
			//(`room instanceof StandardRoom && room != roomEntrance`) - not an index-based rule,
			//an identity one, true on every floor including ported ones. This port previously
			//only skipped index 0 on a *generic* floor (reasoning that a ported floor's shuffled
			//room order made index 0 meaningless) and treated every room as fair game there -
			//which meant mobs, including the roster's less-common entries, could spawn right in
			//the entrance room on a ported floor, something real Java never does. Fixed by
			//excluding whichever room actually contains the hero's spawn cell, on both kinds of
			//floor alike - the hero is still standing there at populate() time.
			const entranceRoomIdx = this.level.rooms.findIndex((room) =>
				this.hero.x >= room.left && this.hero.x <= room.right && this.hero.y >= room.top && this.hero.y <= room.bottom);
			for (let attempt = 0; attempt < 10; attempt++) {
				let index = Random.int(0, this.level.rooms.length);
				if (this.level.rooms.length > 1 && index === entranceRoomIdx) index = (index + 1) % this.level.rooms.length;
				const room = this.level.rooms[index];
				const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
				//Java's Char.canEnterCell() treats a chasm as solid for mobs. The coarse MWG
				//terrain map intentionally exposes chasms as passable so the hero can fall through,
				//so the raw ported terrain must be checked separately before spawning a monster;
				//the roster's flying actors are the Java exception.
				const kind = roster[rotationIndex % roster.length]!;
				if (!this.level.passable(at.x, at.y) || (this.isChasmCell(at.x, at.y) && !FLYING_KINDS.has(kind))
					|| (kind === 'piranha' && this.level.get(at.x, at.y) !== WATER)) continue;
				if (at.x === this.hero.x && at.y === this.hero.y) continue;
				if (this.portedMobCells.has(this.level.index(at.x, at.y))) continue;
				if (this.creatureAt(at.x, at.y)) continue;
				//The one spawn that is Java's `createMob()`: drawn from the rolled floor roster, and
				//therefore the only one that may roll a champion.
				this.spawnMonster(roster[rotationIndex++ % roster.length]!, at, false, undefined, false, undefined, true);
				break;
			}
		}
	},

	/**
	 * `Ghost.Quest.spawn()`: depth 2-4, `Random.Int(5-depth)==0` each (1-in-3, 1-in-2, always),
	 * once per run, `type = depth-1` - all three types now, not just the Fetid Rat.
	 */
	/**
	 * A cell an NPC can actually stand on inside `room`, preferring its centre.
	 *
	 * Every NPC spawn used to take `rectCenter(room)` unconditionally, which is safe on a
	 * generic floor (a generated room's interior is all floor, so its centre always is). It is
	 * not safe on a ported floor: a `SecretMazeRoom`'s centre is maze wall, a `CircleBasinRoom`'s
	 * is water, and anything the terrain mapping folds onto WALL - chasm, statue, bookshelf -
	 * can sit dead centre. An NPC placed there would be sealed inside solid rock.
	 *
	 * Water counts as standable, matching the rest of this port (WATER is a passable kind).
	 * Returns null only for a room with no passable cell at all, which a caller must handle
	 * rather than spawning into a wall.
	 */
	standableCellIn(this: DungeonScene, room: Roguelike.Rect): Step | null {
		const centre = Roguelike.rectCenter(room);
		if (this.level.passable(centre.x, centre.y) && !this.isChasmCell(centre.x, centre.y) && !this.creatureAt(centre.x, centre.y)) return centre;
		for (let attempt = 0; attempt < 20; attempt++) {
			const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
			if (this.level.passable(at.x, at.y) && !this.isChasmCell(at.x, at.y) && !this.creatureAt(at.x, at.y)) return at;
		}
		for (let y = room.top; y <= room.bottom; y++) {
			for (let x = room.left; x <= room.right; x++) {
				if (this.level.passable(x, y) && !this.isChasmCell(x, y) && !this.creatureAt(x, y)) return { x, y };
			}
		}
		return null;
	},

	/** a room to spawn something in - see populate()'s note on why index 0 is only skipped
	 *  on a generic floor */
	randomSpawnRoom(this: DungeonScene): Roguelike.Rect {
		const first = this.portedFloorActive ? 0 : 1;
		return this.level.rooms[Random.int(first, this.level.rooms.length)] ?? this.level.rooms[0];
	},

	maybeSpawnGhost(this: DungeonScene): void {
		const quest = scenarioQuest('ghost');
		if (this.ghostSpawned || !quest.depths.includes(this.depth)) return;
		if (Random.int(0, quest.rollBase - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('ghost', at);
		this.ghostSpawned = true;
		this.ghostType = this.depth - 1;
	},

	/**
	 * Wandmaker.Quest spawn, simplified: Java picks one of three site quests by room shape
	 * (MassGrave/RitualSite/RotGarden) with `depth > 6 && Random.Int(10-depth)==0` odds when
	 * no type is fixed - the odds and the once-per-run flag are real, and all three fetch
	 * targets (dust, embers, rotberry) are now real items with real turn-ins.
	 */
	maybeSpawnWandmaker(this: DungeonScene): void {
		const quest = scenarioQuest('wandmaker');
		if (this.wandmakerSpawned || !quest.depths.includes(this.depth)) return;
		if (Random.int(0, quest.rollBase - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('wandmaker', at);
		this.wandmakerSpawned = true;
	},

	/**
	 * Shopkeeper: Java's shops sit on depths 6/11/16/21. This port still has no shop
	 * ROOMS (a level-gen gap - the keeper stands in a random room instead), but the
	 * depth rule itself is now exact rather than depth-6-only. Prices are the real
	 * `sellPrice()` formula (`shopPricing.ts`); each depth keeps its own shelf stock
	 * and buyback shelf.
	 */
	maybeSpawnShopkeeper(this: DungeonScene): void {
		const quest = scenarioQuest('shopkeeper');
		if (!quest.depths.includes(this.depth) || this.shopSpawnedDepths.has(this.depth)) return;
		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('shopkeeper', at);
		this.shopSpawnedDepths.add(this.depth);
		//The shelf is *generated* here, not on first interaction, because that is when Java draws
		//it - `ShopRoom.paint()` calls `generateItems()` as the room is built, so the potion/scroll
		//draws, the rare roll and the Bomb/Honeypot pick all come off the level stream in the same
		//place they do in Java. Seeding lazily at the keeper's first line of dialogue would take
		//those draws at an arbitrary later point instead, which is what the authored stand-in this
		//replaces existed to avoid.
		this.shopStockFor(this.depth);
	},

	/**
	 * Blacksmith.Quest spawn: `depth > 11 && Random.Int(15-depth)==0` (depths 12-14),
	 * once per run. Ported floors carry the generator's normal/Bat-blood variant; this
	 * fallback is retained only for non-ported floors and therefore uses the normal path.
	 */
	maybeSpawnBlacksmith(this: DungeonScene): void {
		const quest = scenarioQuest('blacksmith');
		if (this.blacksmithSpawned || !quest.depths.includes(this.depth)) return;
		if (Random.int(0, quest.rollBase - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('blacksmith', at);
		this.blacksmithSpawned = true;
	},

	/**
	 * Imp.Quest spawn: `depth > 16 && Random.Int(20-depth)==0` (depths 17-19), once per
	 * run. The monks-vs-golems variant is fixed by depth parity here (odd: monks, even:
	 * golems need one fewer token) instead of Java's coin flip - the 5/4 token counts
	 * are real either way.
	 */
	maybeSpawnImp(this: DungeonScene): void {
		const quest = scenarioQuest('imp');
		if (this.impSpawned || !quest.depths.includes(this.depth)) return;
		if (Random.int(0, quest.rollBase - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('imp', at);
		this.impSpawned = true;
		//odd depths want 5 monk tokens, even depths 4 golem tokens (Java flips a coin)
		this.impNeed = this.depth % 2 === 1 ? 5 : 4;
	},

	/**
	 * `HallsLevel.initRooms()`'s `rooms.add(new DemonSpawnerRoom())` - unconditional, unlike the
	 * roll-gated quest spawns above, and once per FLOOR rather than once per run: every Halls
	 * floor (21-24) gets its own. Room placement itself isn't tracked (see
	 * `spdLevelGen/regularLevel.ts`'s own doc comment) - like every other monster on a ported or
	 * generic floor, it simply respawns fresh on re-entry, since this port doesn't persist
	 * per-floor mob state at all (see PORT_COVERAGE.md).
	 */
	maybeSpawnDemonSpawner(this: DungeonScene): void {
		if (this.depth < 21 || this.depth > 24) return;
		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('demonSpawner', at);
	},

	/**
	 * `DemonSpawner.act()`'s spawn-cooldown countdown (`DemonSpawner.java`, tag `v3.3.8`).
	 * `spawnCooldown--` every turn, clamped at -20 so a long-uncontested spawner doesn't
	 * drift arbitrarily negative; once `<= 0`, an empty+passable 8-neighbour cell gets a fresh
	 * `RipperDemon`, already `HUNTING` (`sleeping = false`). The clock starts at Java's
	 * field-init 0 (not 60), so the first turn already attempts a spawn, and a success
	 * ADDS 60 (`+=`, from the decremented value) minus up to 20 at Halls depths 22-24
	 * (`Math.min(20, (depth-21)*6.67)` - 60/53.33/46.67/40 turns to spawn on floor
	 * 21/22/23/24). No candidates: the cooldown stays `<= 0` and the next turn retries,
	 * same as Java. (The Ascension `> 20` cap has no expression - ascension modifiers
	 * stay inert here.)
	 */
	tickDemonSpawner(this: DungeonScene, spawner: Creature): void {
		spawner.spawnCooldown = Math.max((spawner.spawnCooldown ?? 0) - 1, -20);
		if (spawner.spawnCooldown > 0) return;

		const candidates: Step[] = [];
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: spawner.x + dx, y: spawner.y + dy };
			if (this.level.passable(at.x, at.y) && !this.isChasmCell(at.x, at.y) && !this.creatureAt(at.x, at.y)) candidates.push(at);
		}
		if (candidates.length === 0) return;

		const demon = this.spawnMonster('ripperDemon', Random.element(candidates)!);
		demon.sleeping = false;

		spawner.spawnCooldown += 60;
		if (this.depth > 21) spawner.spawnCooldown -= Math.min(20, (this.depth - 21) * 6.67);
	},

	interactWithNPC(this: DungeonScene, npc: Creature): void {
		if (npc.npcKind === 'wandmaker') this.interactWithWandmaker();
		else if (npc.npcKind === 'shopkeeper' || npc.npcKind === 'impShopkeeper') this.interactWithShopkeeper();
		else if (npc.npcKind === 'blacksmith') this.interactWithBlacksmith();
		else if (npc.npcKind === 'imp') this.interactWithImp(npc);
		else if (npc.npcKind === 'ratKing') this.interactWithRatKing(npc);
		else this.interactWithGhost();
	},

	/**
	 * `RatKing.interact()`: sleeping kings wake with the real `not_sleeping` yell; awake
	 * kings without a King's Crown get `what_is_it`; a worn armor and the crown unlock
	 * Ratmogrify, matching RatKing.interact()'s one-way exchange.
	 */
	interactWithRatKing(this: DungeonScene, npc: Creature): void {
		//Java opens a confirmation/info window here. The port's NPC conversations are
		//single-step, so the explicit player interaction is treated as accepting the positive
		//exchange; the crown is still consumed only after the armor check.
		runRatKingInteraction({
			npc,
			armorAbility: this.armorAbility,
			armorId: this.armorId,
			hasItem: (id) => this.bag.find(id) !== undefined,
			removeItem: (id, quantity) => this.bag.remove(id, quantity),
			setArmorAbility: () => { this.grantRatmogrify(); },
			say: (message, level) => this.say(message, level),
			messages: {
				notSleeping: t('actors.mobs.npcs.ratking.not_sleeping'),
				crownAfter: t('actors.mobs.npcs.ratking.crown_after'),
				crownClothes: t('actors.mobs.npcs.ratking.crown_clothes'),
				crownThankyou: t('actors.mobs.npcs.ratking.crown_thankyou'),
				whatIsIt: t('actors.mobs.npcs.ratking.what_is_it'),
			},
		});
	},

	/**
	 * `Ghost.interact()`: offers the quest the first time (spawning the type's miniboss,
	 * `Quest.given = true`), reminds the hero while it is still alive, and completes the quest
	 * (once, via `QuestLog.advance`) the first time the hero returns after it is dead.
	 */
	interactWithGhost(this: DungeonScene): void {
		const status = this.quests.status('sadGhost');
		const target: MonsterId = this.ghostType === 2 ? 'gnollTrickster' : this.ghostType === 3 ? 'greatCrab' : 'fetidRat';
		const stage = this.quests.currentStage('sadGhost');
		runGhostInteraction({
			status: status === 'active' || status === 'unavailable' ? 'active' : status,
			stageHasCondition: stage?.condition !== undefined,
			offer: () => {
				this.quests.start('sadGhost');
				this.quests.advanceStage('sadGhost', this.gameState); //past the "given" milestone, stage 0
				const at = this.standableCellIn(this.randomSpawnRoom());
				if (at) this.spawnMonster(target, at);
				this.say(t('port.npc.ghost.offer'));
			},
			done: () => this.say(t('port.npc.ghost.done')),
			remind: () => this.say(t('port.npc.ghost.remind')),
			turnIn: () => {
				//the condition stage is done (the miniboss is dead) - this is the turn-in
				//Ghost.Quest.spawn(): a fixed 50/30/15/5% tier roll (not the generic depth-scaled
				//randomWeapon/randomArmor this used to call), a shared upgrade level, and a shared 20%
				//enchant/glyph chance for both items - see `ghostQuestReward()` for the exact formula.
				setGeneratorDepth(this.depth);
				const reward = ghostQuestReward();
				const weaponReward = this.generatedInventoryItem(reward.weapon);
				const armorReward = this.generatedInventoryItem(reward.armor);
				Actors.identify(weaponReward);
				Actors.identify(armorReward);
				//WndSadGhost: the hero takes the weapon OR the armor - never both, and no
				//max-HP bonus (the flat +2 this turn-in used to grant was a stand-in from before
				//the generated pair existed). Cancelling leaves the quest turn-in-ready, so the
				//next talk re-offers the same pair; the quest completes on pick.
				const titleKey = this.ghostType === 2 ? 'windows.wndsadghost.gnoll_title' : this.ghostType === 3 ? 'windows.wndsadghost.crab_title' : 'windows.wndsadghost.rat_title';
				this.openItemPicker(
					t(titleKey),
					[weaponReward, armorReward].map((item) => ({ id: item.id, instanceId: item.instanceId, identified: true, quantity: item.quantity ?? 1 })),
					(pick) => {
						const chosen = [weaponReward, armorReward].find((item) => item.instanceId === pick.instanceId) ?? weaponReward;
						this.bag.add(chosen);
						this.quests.advanceStage('sadGhost', this.gameState);
						//`WndSadGhost.onSelect()` (tag `v3.3.8`): `Ghost.Quest.complete()`, the ghost's
						//`farewell` line, then `ghost.die(null)` - the ghost leaves the level. Without
						//removing it the completed ghost stood where it was forever (a corridor it
						//stands in becomes impassable: NPCs are bump-to-talk, never swapped).
						this.say(t('windows.wndsadghost.farewell'), 'positive');
						const ghost = this.creatures.find((c) => c.kind === 'ghost' && c.isNPC && !c.isAlly);
						if (ghost) {
							this.scheduler.remove(ghost);
							this.creatures.splice(this.creatures.indexOf(ghost), 1);
							this.sprite(ghost).destroy();
							this.spriteFor.delete(ghost.id);
						}
					},
				);
			},
		});
	},

	/**
	 * `Blacksmith.interact()` (tag `v3.3.8`). Not yet given: the class greeting and the mine
	 * pitch (`intro_quest_*`), the pickaxe, then the quest type's own warning in a second window.
	 * Given but not complete: the reminder plus its quest-type line. Completed: the reward
	 * window (`WndBlacksmith`) or `get_lost`. The quest itself completes on the way *out of the
	 * mine* (`tryLeaveMiningBranch`), as Java's `MiningLevel.activateTransition()` does - the old
	 * turn-in-at-the-anvil below survives only for a pre-v2.2 blood-pickaxe save.
	 */
	interactWithBlacksmith(this: DungeonScene): void {
		const status = this.quests.status('blacksmith');
		if (status === 'available') {
			this.quests.start('blacksmith');
			this.quests.advanceStage('blacksmith', this.gameState);
			this.bag.add({ id: 'pickaxe', quantity: 1, identified: true });
			if (this.blacksmithAlternative) {
				this.say(t('port.npc.blacksmith.bloodoffer'));
				return;
			}
			const title = capitalize(t('actors.mobs.npcs.blacksmith.name'));
			const typeLine = this.blacksmithQuestType === 1 ? t('port.blacksmith.intro_quest_crystal')
				: this.blacksmithQuestType === 2 ? t('port.blacksmith.intro_quest_gnoll') : '';
			//`WndQuest.hide()` opens the second window: pushed first, it waits under the intro.
			if (typeLine) showInfoWindow(this.gameWindows, title, typeLine);
			showInfoWindow(this.gameWindows, title, `${t(`port.blacksmith.intro_quest_${this.heroClass}`)}\n\n${t('port.blacksmith.intro_quest_start')}`);
			this.say(capitalize(t('actors.hero.hero.you_now_have', { '0': this.itemDisplayName('pickaxe', true) })));
			return;
		}
		if (status === 'complete') {
			//`WndBlacksmith`: one window listing all six services, each enabled only when
			//the favor covers its cost (`reforge.enable(favor >= reforgecost)`).
			//`Blacksmith.Quest.rewardsAvailable()`: favor, or a free retained pickaxe. Java's
			//third clause (`smithRewards != null && smiths > 0`, for a save made mid smith
			//selection) has no counterpart: this port's smith set is session-only and
			//regenerates on next open by design.
			if (this.blacksmithFavor <= 0 && !(this.blacksmithPickaxeAvailable && this.blacksmithPickaxeFree)) {
				this.say(t('port.npc.blacksmith.done'));
				return;
			}
			this.openBlacksmithWindow();
			return;
		}
		if (!this.blacksmithAlternative) {
			const typeLine = this.blacksmithQuestType === 1 ? t('port.blacksmith.reminder_crystal')
				: this.blacksmithQuestType === 2 ? t('port.blacksmith.reminder_gnoll') : '';
			showInfoWindow(this.gameWindows, capitalize(t('actors.mobs.npcs.blacksmith.name')),
				typeLine ? `${t('port.blacksmith.reminder')}\n\n${typeLine}` : t('port.blacksmith.reminder'));
			return;
		}
		const pick = this.bag.find('pickaxe');
		if (!pick || pick.affix !== 'bloodStained') {
			this.say(t('port.npc.blacksmith.bloodremind'));
			return;
		}
		this.bag.remove('pickaxe', 1);
		//Old Java's alternative branch (`Blacksmith.java` before the v3.0 quest rework)
		//grants no favor at all and scores a flat `questScores[2] = 3000`, which clears
		//that version's `score >= 2500` free-buy-back gate. This port tracks no
		//quest-score table, so the observable half is recorded directly: no favor,
		//and the buy-back is free.
		this.blacksmithPickaxeFree = true;
		this.finishBlacksmithQuest();
		this.say(t('windows.wndblacksmith.prompt', { '0': this.blacksmithFavor }), 'positive');
	},

	/** The shared tail of both completions: switch, the quest's last two stages, the retained pickaxe. */
	finishBlacksmithQuest(this: DungeonScene): void {
		this.gameState.setSwitch('blacksmithDone', true);
		this.quests.advanceStage('blacksmith', this.gameState);
		// The authored quest has a final empty post-turn-in milestone. MWG advances only one
		// stage per call, so consume that milestone here or the service window remains unreachable.
		this.quests.advanceStage('blacksmith', this.gameState);
		this.blacksmithPickaxeAvailable = true;
	},

	/** Carried DarkGold across every stack. */
	carriedDarkGold(this: DungeonScene): number {
		return this.bag.items.filter((it) => it.id === 'darkGold').reduce((sum, it) => sum + (it.quantity ?? 1), 0);
	},

	/**
	 * `Blacksmith.Quest.complete()` (tag `v3.3.8`): every carried DarkGold is worth 50 favor
	 * (capped at 2000) and is taken, the pickaxe is taken back (retained for the buy-back), a
	 * beaten quest boss adds 1000, and 2500+ favor makes the buy-back free.
	 */
	completeBlacksmithQuest(this: DungeonScene): void {
		const gold = this.carriedDarkGold();
		this.blacksmithFavor = blacksmithTurnInFavor(gold, this.blacksmithBossBeaten);
		if (gold > 0) this.bag.remove('darkGold', gold);
		if (this.bag.find('pickaxe')) this.bag.remove('pickaxe', 1);
		this.finishBlacksmithQuest();
		this.blacksmithPickaxeFree = this.blacksmithFavor >= BLACKSMITH_FREE_PICKAXE_FAVOR;
	},

	/**
	 * `CavesLevel.activateTransition()` for the mine's `BRANCH_EXIT` (tag `v3.3.8`): refused
	 * (`entrance_blocked`) unless the Blacksmith is on the floor and the quest was given and is
	 * not complete; a hero without the pickaxe hears `lost_pick`; the first entry asks
	 * `quest_start_prompt` and marks the quest started, after which the ladder is free to use.
	 */
	tryEnterMiningBranch(this: DungeonScene): void {
		const given = this.quests.status('blacksmith') !== 'available';
		const completed = this.quests.status('blacksmith') === 'complete';
		if (given && !completed && this.blacksmithQuestStarted) {
			this.enterMiningBranch();
			return;
		}
		const title = capitalize(t('actors.mobs.npcs.blacksmith.name'));
		if (!this.creatures.some((c) => c.kind === 'blacksmith') || !given || completed) {
			this.say(t('port.blacksmith.entrance_blocked'), 'warning');
		} else if (!this.bag.find('pickaxe')) {
			showInfoWindow(this.gameWindows, title, t('actors.mobs.npcs.blacksmith.lost_pick'));
		} else {
			showConfirmWindow(this.gameWindows, title, t('port.blacksmith.quest_start_prompt'),
				t('port.blacksmith.enter_yes'), t('port.blacksmith.enter_no'), () => {
					this.blacksmithQuestStarted = true;
					this.enterMiningBranch();
				});
		}
	},

	/**
	 * `MiningLevel.activateTransition()` for the mine's `BRANCH_ENTRANCE` (tag `v3.3.8`): until
	 * the quest is complete, leaving needs the pickaxe (`lost_pick` otherwise) and a confirmation
	 * graded by the DarkGold carried (<10 none, <20 low, <30 med, <40 high, else full), plus the
	 * boss line while the quest boss lives. Confirming completes the quest, then climbs out.
	 */
	tryLeaveMiningBranch(this: DungeonScene): void {
		if (this.quests.status('blacksmith') === 'complete' || this.blacksmithAlternative) {
			this.leaveMiningBranch();
			return;
		}
		const title = capitalize(t('actors.mobs.npcs.blacksmith.name'));
		if (!this.bag.find('pickaxe')) {
			showInfoWindow(this.gameWindows, title, t('actors.mobs.npcs.blacksmith.lost_pick'));
			return;
		}
		const gold = this.carriedDarkGold();
		let warn = t(gold < 10 ? 'port.blacksmith.exit_warn_none' : gold < 20 ? 'port.blacksmith.exit_warn_low'
			: gold < 30 ? 'port.blacksmith.exit_warn_med' : gold < 40 ? 'port.blacksmith.exit_warn_high' : 'port.blacksmith.exit_warn_full');
		if (!this.blacksmithBossBeaten) {
			if (this.blacksmithQuestType === 1) warn += `\n\n${t('port.blacksmith.exit_warn_crystal')}`;
			else if (this.blacksmithQuestType === 2) warn += `\n\n${t('port.blacksmith.exit_warn_gnoll')}`;
		}
		showConfirmWindow(this.gameWindows, title, warn, t('port.blacksmith.exit_yes'), t('port.blacksmith.exit_no'), () => {
			this.completeBlacksmithQuest();
			this.leaveMiningBranch();
		});
	},

	blacksmithReforgeCost(this: DungeonScene): number { return itemBlacksmithReforgeCost(this.blacksmithReforges); },

	/** `WndBlacksmith`'s `hardenCost = 500 + 1000*Blacksmith.Quest.hardens`. */
	blacksmithHardenCost(this: DungeonScene): number { return itemBlacksmithHardenCost(this.blacksmithHardens); },

	/** `WndBlacksmith`'s service list. Java offers pickaxe, reforge, harden, upgrade, smith and
	 * cash out; the pickaxe buy-back now uses the retained quest item and Java's 250/0 cost. */
	openBlacksmithWindow(this: DungeonScene): void {
		openBlacksmithWindow(this.blacksmithWindowContext(
			() => this.confirmBlacksmithSmith(),
			() => this.confirmBlacksmithCashOut(),
		));
	},

	blacksmithWindowContext(this: DungeonScene, onSmith: () => void, onCashout: () => void): BlacksmithWindowContext {
		return {
			favor: this.blacksmithFavor,
			costs: {
				pickaxe: this.blacksmithPickaxeFree ? 0 : 250,
				reforge: this.blacksmithReforgeCost(),
				harden: this.blacksmithHardenCost(),
				upgrade: this.blacksmithUpgradeCost(),
				smith: BLACKSMITH_SMITH_COST,
			},
			labels: {
				title: t('actors.mobs.npcs.blacksmith.name'),
				prompt: t('port.blacksmith.prompt', { favor: this.blacksmithFavor }),
				pickaxe: `${t('items.quest.pickaxe.name')} (${this.blacksmithPickaxeFree ? 0 : 250})`,
				reforge: t('port.blacksmith.reforge', { favor: this.blacksmithReforgeCost() }),
				harden: t('port.blacksmith.harden', { favor: this.blacksmithHardenCost() }),
				upgrade: t('port.blacksmith.upgrade', { favor: this.blacksmithUpgradeCost() }),
				smith: t('port.blacksmith.smith', { favor: BLACKSMITH_SMITH_COST }),
				cashout: t('port.blacksmith.cashout'),
				smithVerify: t('port.blacksmith.smith.verify'),
				smithYes: t('port.blacksmith.smith.yes'),
				smithNo: t('port.blacksmith.smith.no'),
				cashoutVerify: t('port.blacksmith.cashout.verify', { favor: this.blacksmithFavor }),
				cashoutYes: t('port.blacksmith.cashout.yes'),
				cashoutNo: t('port.blacksmith.cashout.no'),
			},
			showChoice: (title, body, options) => showChoiceWindow(this.gameWindows, title, body, options),
			showConfirm: (title, body, yes, no, onYes) => showConfirmWindow(this.gameWindows, title, body, yes, no, onYes),
			onReforge: () => this.openBlacksmithReforge(),
			onPickaxe: () => this.buyBlacksmithPickaxe(),
			onHarden: () => this.openBlacksmithHarden(),
			onUpgrade: () => this.openBlacksmithUpgrade(),
			onSmith,
			onCashout,
		};
	},

	/** `WndBlacksmith`'s pickaxe branch: return the retained quest pickaxe, charging 250 favor
	 * unless `Blacksmith.Quest.freePickaxe` was earned at 2500 favor. Java drops the item when
	 * the backpack is full; this port has no bag-capacity rule, so it adds the item directly to
	 * the shared bag instead of reproducing Java's full-backpack ground drop. */
	buyBlacksmithPickaxe(this: DungeonScene): void {
		if (!this.blacksmithPickaxeAvailable) return;
		const cost = this.blacksmithPickaxeFree ? 0 : 250;
		if (this.blacksmithFavor < cost) return;
		this.blacksmithFavor -= cost;
		this.blacksmithPickaxeAvailable = false;
		this.bag.add({ id: 'pickaxe', quantity: 1, identified: true });
		this.say(t('items.quest.pickaxe.name'), 'positive');
	},

	/** `WndBlacksmith`'s smith flow: a confirm ("warm the forge"), then `WndSmith`'s four
	 * pre-generated rewards to choose from. */
	confirmBlacksmithSmith(this: DungeonScene): void {
		confirmBlacksmithSmith(this.blacksmithWindowContext(() => this.openBlacksmithSmith(), () => this.confirmBlacksmithCashOut()));
	},

	openBlacksmithSmith(this: DungeonScene): void {
		if (this.blacksmithFavor < BLACKSMITH_SMITH_COST) return;
		//Java's own lazy branch (`WndSmith`'s `generateRewards(false)`), see the generator
		this.blacksmithSmithRewards ??= blacksmithSmithRewards().map((generated) => this.generatedInventoryItem(generated));
		showChoiceWindow(
			this.gameWindows,
			t('actors.mobs.npcs.blacksmith.name'),
			t('port.blacksmith.smith.prompt'),
			this.blacksmithSmithRewards.map((reward) => ({
				label: this.itemDisplayName(reward.id, true, reward.instanceId),
				onPick: () => this.takeBlacksmithSmith(reward),
			})),
		);
	},

	takeBlacksmithSmith(this: DungeonScene, reward: NonNullable<GroundItem['item']>): void {
		if (this.blacksmithFavor < BLACKSMITH_SMITH_COST) return;
		this.blacksmithFavor -= BLACKSMITH_SMITH_COST;
		this.blacksmithSmiths++;
		this.blacksmithSmithRewards = null;
		this.bag.add({ ...reward, quantity: 1 });
		this.say(t('port.log.pickup', { item: this.itemDisplayName(reward.id, true, reward.instanceId) }), 'positive');
		this.refresh();
	},

	/** `WndBlacksmith`'s `upgradeCost = 1000 + 1000*Blacksmith.Quest.upgrades`. */
	blacksmithUpgradeCost(this: DungeonScene): number { return itemBlacksmithUpgradeCost(this.blacksmithUpgrades); },

	/** `WndBlacksmith.UpgradeSelector`: an identified, uncursed, upgradable item below +2.
	 * `item.upgrade()` is the plain overload, so the affix-loss roll (and the hardening branch)
	 * applies here exactly as it does to a scroll - which is why this rolls through the same
	 * helper rather than nudging the level. */
	openBlacksmithUpgrade(this: DungeonScene): void {
		const candidates: { id: string; instanceId?: string; identified?: boolean; quantity: number }[] = [];
		const eligible = (instanceId?: string) => instanceId === this.weaponInstanceId || instanceId === this.armorInstanceId;
		if (this.weaponLevel < 2 && !this.weaponCursed) candidates.push({ id: this.weaponId, instanceId: this.weaponInstanceId, identified: true, quantity: 1 });
		if (this.armorLevel < 2 && !this.armorCursed) candidates.push({ id: this.armorId, instanceId: this.armorInstanceId, identified: true, quantity: 1 });
		for (const item of selectBlacksmithUpgradeItems(this.bag.items, new Set([this.weaponInstanceId, this.armorInstanceId]))) {
			if (!eligible(item.instanceId)) candidates.push({ id: item.id, instanceId: item.instanceId, identified: true, quantity: 1 });
		}
		if (candidates.length === 0) {
			this.say(t('port.blacksmith.prompt', { favor: this.blacksmithFavor }), 'negative');
			return;
		}
		this.openItemPicker(t('port.blacksmith.upgrade', { favor: this.blacksmithUpgradeCost() }), candidates, (pick) => this.completeBlacksmithUpgrade(pick));
	},

	completeBlacksmithUpgrade(this: DungeonScene, pick: { id: string; instanceId?: string }): void {
		if (this.blacksmithFavor < this.blacksmithUpgradeCost()) return;
		if (pick.id === this.weaponId && pick.instanceId === this.weaponInstanceId) {
			this.rollUpgradeAffixLoss('weapon');
			this.weaponLevel++;
			this.syncHeroFromStats();
			this.say(t('port.log.weaponupgraded', { level: this.weaponLevel, min: this.hero.damage[0], max: this.hero.damage[1] }), 'positive');
		} else if (pick.id === this.armorId && pick.instanceId === this.armorInstanceId) {
			this.rollUpgradeAffixLoss('armor');
			this.armorLevel++;
			this.syncHeroFromStats();
			this.say(t('port.log.armorupgraded', { level: this.armorLevel }), 'positive');
		} else {
			const item = this.bag.find(pick.id, pick.instanceId);
			if (!item || item.cursed || !(item.identified ?? false) || (item.level ?? 0) >= 2) return;
			this.rollCarriedItemAffixLoss(item);
			item.level = (item.level ?? 0) + 1;
			this.onMissileStackUpgraded(item);
			this.say(t('port.log.itemupgraded', { item: this.itemDisplayName(item.id, true, item.instanceId) }), 'positive');
		}
		this.blacksmithFavor -= this.blacksmithUpgradeCost();
		this.blacksmithUpgrades++;
		this.refresh();
	},

	/** The same `Weapon.upgrade()`/`Armor.upgrade()` rolls, for an item still in the bag: the
	 * equipped slots carry their state in the scene fields, so `rollUpgradeAffixLoss` cannot see
	 * a carried item's affix, level or hardening at all. */
	rollCarriedItemAffixLoss(this: DungeonScene, item: BlacksmithItem): void {
		rollCarriedAffixLoss(item, (key, level) => this.say(t(key), level));
	},

	/** `WndBlacksmith`'s cash out: `new Gold(favor)`, all of it, after a confirm whose prompt
	 * quotes the amount back. */
	confirmBlacksmithCashOut(this: DungeonScene): void {
		confirmBlacksmithCashout(this.blacksmithWindowContext(() => this.openBlacksmithSmith(), () => this.cashOutBlacksmithFavor()));
	},

	cashOutBlacksmithFavor(this: DungeonScene): void {
		const favor = this.blacksmithFavor;
		if (favor <= 0) return;
		this.blacksmithFavor = 0;
		this.bag.add({ id: 'gold', quantity: favor, identified: true });
		this.say(t('port.log.pickup', { item: this.itemDisplayName('gold', true) }), 'positive');
		this.refresh();
	},

	/** `WndBlacksmith.HardenSelector`: an identified, uncursed, upgradable item that is not
	 * already hardened. Java's selector walks the hero's whole belongings, so the *equipped*
	 * weapon and armor are candidates too - which is exactly the item a player wants hardened,
	 * since the hardening only ever matters on the item a scroll later upgrades. */
	openBlacksmithHarden(this: DungeonScene): void {
		const equipped: { id: string; instanceId?: string; identified?: boolean; quantity: number }[] = [];
		//the class's own starting gear is a candidate too: Java's selector walks every upgradable
		//item the hero has, and this port's starting weapon/armor is upgradable like any other
		if (!this.weaponHardened && !getCurse(this.weaponAffix ?? '')) {
			equipped.push({ id: this.weaponId, instanceId: this.weaponInstanceId, identified: true, quantity: 1 });
		}
		if (!this.armorHardened && !getCurse(this.armorGlyph ?? '')) {
			equipped.push({ id: this.armorId, instanceId: this.armorInstanceId, identified: true, quantity: 1 });
		}
		const carried = selectBlacksmithHardenItems(this.bag.items);
		const candidates = [...equipped, ...carried];
		if (candidates.length === 0) {
			this.say(t('port.blacksmith.prompt', { favor: this.blacksmithFavor }), 'negative');
			return;
		}
		this.openItemPicker(t('port.blacksmith.harden', { favor: this.blacksmithHardenCost() }), candidates, (pick) => this.completeBlacksmithHarden(pick));
	},

	completeBlacksmithHarden(this: DungeonScene, pick: { id: string; instanceId?: string }): void {
		if (this.blacksmithFavor < this.blacksmithHardenCost()) return;
		//the picker's entries are re-validated against the live state, as the reforge path does
		//`id` *and* `instanceId` have to agree: the starting gear has no instance id of its own
		//early on, and an id-only test would then also match an unrelated bag item
		if (pick.id === this.weaponId && pick.instanceId === this.weaponInstanceId) this.weaponHardened = true;
		else if (pick.id === this.armorId && pick.instanceId === this.armorInstanceId) this.armorHardened = true;
		else {
			const item = this.bag.find(pick.id, pick.instanceId);
			if (!item || item.cursed || !(item.identified ?? false)) return;
			(item as typeof item & { hardened?: boolean }).hardened = true;
		}
		this.blacksmithFavor -= this.blacksmithHardenCost();
		this.blacksmithHardens++;
		this.say(t('port.blacksmith.prompt', { favor: this.blacksmithFavor }), 'positive');
		this.refresh();
	},

	/** `WndBlacksmith.WndReforge`: select two identified, non-cursed, upgradable items **of the same
	 * class**; the higher-true-level item survives and gains one upgrade level while the other is
	 * consumed (`trueLevel()` comparison, not the displayed level).
	 *
	 * The class test is `blacksmithItemClass` (`sourceClass ?? id`), because this port mints one id
	 * for every generated weapon, every generated armor and every wand: pairing by bag id - which is
	 * what this did until 2026-09-16 - happily reforged a handaxe with a shortsword, exactly the
	 * merge Java's `item1.getClass() != item2.getClass()` refuses.
	 *
	 * Java leaves the Reforge button disabled until the pair matches, and lets each pick come from
	 * the whole selectable bag; this port's pickers have no disabled state, so the second list is
	 * restricted to the first pick's class instead - the same rule, expressed where a row-picker can
	 * express it, and it cannot offer a pair the rule would then reject.
	 * **The missile half is live (2026-09-16).** Java retires a consumed missile stack's set
	 * (`levelThresholds.put(setID, MAX_VALUE)`, `WndBlacksmith.java` 279-282) so any heap still
	 * carrying it crumbles instead of resurrecting the spent stack; that clause needed carried
	 * stacks to have a set id of their own, which they now do (see `src/missiles.ts`), so the picker
	 * offers missiles like every other upgradable item and `reforgeDiscardedMissileSet` applies the
	 * retirement. A consumed armor's seal also lands at the hero's feet as a real `brokenSeal`
	 * pickup, affixable back onto the equipped armor. The one item Java offers and this port still
	 * withholds is the **wand** - see `isBlacksmithServiceTarget`. */
	openBlacksmithReforge(this: DungeonScene): void {
		const candidates = selectBlacksmithReforgeItems(this.bag.items);
		if (candidates.length < 2) {
			this.say(t('windows.wndblacksmith.prompt', { '0': this.blacksmithFavor }), 'negative');
			return;
		}
		this.blacksmithReforgeFirst = null;
		this.openItemPicker(t('windows.wndblacksmith.prompt'), candidates, (first) => {
			this.blacksmithReforgeFirst = first;
			const entry = candidates.find((item) => item.id === first.id && item.instanceId === first.instanceId);
			const remaining = entry
				? candidates.filter((item) => item !== entry && blacksmithReforgePairValid(entry, item))
				: [];
			this.openItemPicker(t('windows.wndblacksmith.prompt'), remaining, (second) => this.completeBlacksmithReforge(first, second));
		});
	},

	completeBlacksmithReforge(this: DungeonScene, first: { id: string; instanceId?: string }, second: { id: string; instanceId?: string }): void {
		if (this.blacksmithFavor < this.blacksmithReforgeCost()) return;
		const a = this.bag.find(first.id, first.instanceId);
		const b = this.bag.find(second.id, second.instanceId);
		//the picker already restricts the second list to the first's class, but this re-validates
		//against the live bag the way every other picker callback does (Java's own FIXME-shaped guard)
		if (!a || !b || a.cursed || b.cursed || !(a.identified ?? false) || !(b.identified ?? false)) return;
		if (!blacksmithReforgePairValid(a, b)) return;
		const keep = (a.level ?? 0) >= (b.level ?? 0) ? a : b;
		const discard = keep === a ? b : a;
		keep.level = (keep.level ?? 0) + 1;
		//Java records the *discarded* missile's set as retired before upgrading the survivor
		//(`WndBlacksmith.java` 279-282) - any heap still carrying it then crumbles on pickup.
		this.missileThresholds = reforgeDiscardedMissileSet(this.missileThresholds, discard);
		this.onMissileStackUpgraded(keep);
		//`second.detachAll()` takes the whole item, so a consumed *stack* goes entirely - a
		//missile stack of five is spent, not four. Every other target here is a single item.
		this.bag.remove(discard.id, discard.quantity, discard.instanceId);
		//Java floor-drops a consumed armor's seal as a `BrokenSeal` item
		// (`WndBlacksmith.java` 277-285); the seal no longer vanishes with its armor.
		if ((discard as typeof discard & { seal?: boolean }).seal) {
			this.spawnGroundItem('brokenSeal', this.hero.x, this.hero.y, { id: 'brokenSeal', quantity: 1, identified: true });
		}
		this.blacksmithFavor -= this.blacksmithReforgeCost();
		this.blacksmithReforges++;
		//Java's own reforge just closes the window - there is no log line to copy, and the port's old
		//one reported this *scene's* weapon/armor counters, so a reforged ring announced the armor's
		//level. This names the item that was actually reforged instead.
		this.say(t('port.npc.blacksmith.reforged', { item: this.itemDisplayName(keep.id, true, keep.instanceId), level: keep.level ?? 0 }), 'positive');
	},

	/** Imp quest: dwarf tokens in, a +2 cursed ring out (Java's exact reward shape) */
	interactWithImp(this: DungeonScene, npc: Creature): void {
		const status = this.quests.status('imp');
		runImpInteraction({
			status: status === 'available' || status === 'complete' ? status : 'active',
			need: this.impNeed,
			heldTokens: this.bag.find('dwarfToken')?.quantity ?? 0,
			startQuest: () => this.quests.start('imp'),
			advanceQuest: () => this.quests.advanceStage('imp', this.gameState),
			removeTokens: (quantity) => this.bag.remove('dwarfToken', quantity),
			reward: () => {
				const ringId = 'ring_' + Random.element(Object.keys(RING_DEFS))!;
				this.bag.add({ id: ringId, quantity: 1, instanceId: this.newItemInstanceId('ring'), identified: true, level: 2 });
				const item = this.bag.find(ringId)!;
				Actors.applyAffix(item, { id: 'cursed', trigger: 'passive', weight: 1, curse: true });
				this.gameState.setSwitch('impDone', true);
				return t('port.npc.imp.reward', { ring: t(RING_KEYS[ringId.slice(5)]) });
			},
			flee: () => {
				this.scheduler.remove(npc);
				this.creatures.splice(this.creatures.indexOf(npc), 1);
				this.sprite(npc).destroy();
				this.spriteFor.delete(npc.id);
			},
			say: (message) => this.say(message),
			messages: {
				offer: t('port.npc.imp.offer', { count: this.impNeed, enemy: t(this.impNeed === 5 ? 'port.npc.imp.enemy.monks' : 'port.npc.imp.enemy.golems') }),
				done: t('port.npc.imp.done'),
				remind: t('port.npc.imp.remind', { count: this.impNeed, held: this.bag.find('dwarfToken')?.quantity ?? 0 }),
				reward: '',
			},
		});
	},

	interactWithWandmaker(this: DungeonScene): void {
		const status = this.quests.status('wandmaker');
		const genType = wandmakerQuestType();
		if (genType !== 0) this.wandmakerType = genType;
		const type = this.wandmakerType;
		runWandmakerInteraction({
			status: status === 'available' || status === 'complete' ? status : 'active',
			type,
			hasItem: (id) => this.bag.find(id) !== undefined,
			rotberrySeedInstance: () => this.bag.items.find((item) => item.id === 'seed' && (item as typeof item & { sourceClass?: string }).sourceClass === 'Rotberry')?.instanceId,
			startQuest: () => this.quests.start('wandmaker'),
			advanceQuest: () => this.quests.advanceStage('wandmaker', this.gameState),
			offerReward: () => this.offerWandmakerReward(type),
			say: (message) => this.say(message),
			messages: {
				//Java's `msg1` = the class's own `intro_<class>` line, then `intro_1`; `msg2` = the
				//type's line, then `intro_2`. The class line comes first and was simply absent here.
				//A class with no line in this port's catalogue (see `WANDMAKER_CLASS_INTROS`) is
				//left out of the sequence rather than given another class's words or a raw key.
				intro: [...(WANDMAKER_CLASS_INTROS[this.heroClass] ? [t(`actors.mobs.npcs.wandmaker.intro_${this.heroClass}`)] : []), t('actors.mobs.npcs.wandmaker.intro_1'), t(type === 1 ? 'actors.mobs.npcs.wandmaker.intro_dust' : type === 2 ? 'actors.mobs.npcs.wandmaker.intro_ember' : 'actors.mobs.npcs.wandmaker.intro_berry'), t('actors.mobs.npcs.wandmaker.intro_2')],
				offer: t('port.npc.wandmaker.offer'), done: t('port.npc.wandmaker.done'), remind: t('port.npc.wandmaker.remind'),
				reminderDust: t('actors.mobs.npcs.wandmaker.reminder_dust', { '0': t(CLASS_KEYS[this.heroClass]) }),
				reminderEmber: t('actors.mobs.npcs.wandmaker.reminder_ember', { '0': t(CLASS_KEYS[this.heroClass]) }),
				reminderBerry: t('actors.mobs.npcs.wandmaker.reminder_berry', { '0': t(CLASS_KEYS[this.heroClass]) }),
			},
		});
	},

	/**
	 * `Wandmaker.Quest.interact()`'s reward half: Java shows `WndWandmaker`, whose two buttons are
	 * this floor's own `Quest.wand1`/`wand2` (rolled during level generation by
	 * `spdLevelGen/wandmaker.ts`, and persisted with the run), titled with the quest item's name
	 * and described by `windows.wndwandmaker.{dust|ember|berry}`. Picking one opens
	 * `RewardWindow`'s confirm; confirming is `selectReward` - and that is the only place the quest
	 * item is spent, so cancelling here leaves it in the bag, exactly as Java's does.
	 *
	 * This used to be an invented substitute: the interaction granted a *frost* wand outright (a
	 * plain magic-missile staff for a Mage), picking the class for the player where Java offers two
	 * random ones. The offered pair is real now; what remains unmodelled is Java's
	 * `wand1.upgrade()`/`wand2.upgrade()` - both wands are generated at +1 - because this port's
	 * wand power comes from `weaponLevel`, not from a level on the wand item (the same
	 * single-wand model `PORT_COVERAGE.md`'s wand rows record).
	 */
	offerWandmakerReward(this: DungeonScene, type: number): void {
		const wands = wandmakerQuestWands();
		if (!wands) {
			//A save from before the pair was persisted (or a quest floor generated before it was
			//recorded): say the reminder rather than inventing a wand to hand over.
			this.say(t(type === 1 ? 'actors.mobs.npcs.wandmaker.reminder_dust' : type === 2 ? 'actors.mobs.npcs.wandmaker.reminder_ember' : 'actors.mobs.npcs.wandmaker.reminder_berry', { '0': t(CLASS_KEYS[this.heroClass]) }));
			return;
		}
		const body = t(type === 1 ? 'windows.wndwandmaker.dust' : type === 2 ? 'windows.wndwandmaker.ember' : 'windows.wndwandmaker.berry');
		this.openItemPicker(body, wands.map((cls) => ({ id: 'wand', instanceId: `wand-reward:${cls}`, identified: true, quantity: 1 })), (pick) => this.completeWandmakerReward(pick.instanceId));
	},

	/** `WndWandmaker.selectReward()`: spend the quest item, identify and hand over the chosen
	 *  wand, say the real `farewell`, and let the Wandmaker leave for good. */
	completeWandmakerReward(this: DungeonScene, instanceId?: string): void {
		const cls = instanceId?.startsWith('wand-reward:') ? instanceId.slice('wand-reward:'.length) : undefined;
		const wandType = wandTypeFromSource(cls);
		if (!wandType) return;
		const item = this.wandmakerQuestItem();
		if (!item) return;
		this.bag.remove(item.id, 1, item.instanceId);
		if (item.id === 'corpseDust') {
			//`DustGhostSpawner.dispel()` on handover: every DustWraith dies with the curse
			//(the music fade has no layer here; the score penalties no system).
			for (const wraith of this.creatures.filter((c) => c.kind === 'dustWraith' && c.hp > 0)) this.kill(wraith);
			this.dustSpawnPower = 0;
		}
		//`RewardWindow.selectReward()`: the reward is identified and picked up. This port's wand is
		//one bag id whose *type* is the class (`wandTypeFromSource`), the same shape `equipWand`
		//uses when a wand is picked up off the floor.
		this.wandType = wandType;
		this.frostWand = wandType === 'frost';
		const existing = this.bag.find('wand');
		if (existing) existing.identified = true;
		else this.bag.add({ id: 'wand', quantity: 1, stackable: true, identified: true });
		this.say(t('actors.hero.hero.you_now_have', { 0: t(WAND_KEYS[wandType] ?? WAND_KEYS.magicMissile) }), 'positive');
		this.gameState.setSwitch('wandQuestDone', true);
		this.quests.advanceStage('wandmaker', this.gameState);
		const npc = this.creatures.find((c) => c.kind === 'wandmaker' && c.hp > 0);
		if (npc) {
			this.say(t('windows.wndwandmaker.farewell', { 0: t(CLASS_KEYS[this.heroClass]) }));
			this.scheduler.remove(npc);
			this.creatures.splice(this.creatures.indexOf(npc), 1);
			this.sprite(npc).destroy();
			this.spriteFor.delete(npc.id);
		}
	},

	/** The quest item the Wandmaker is currently waiting for, as it sits in the bag - the same
	 *  three classes `interactWithWandmaker` routes on, plus the scroll fallback for a run whose
	 *  type was never recorded. */
	wandmakerQuestItem(this: DungeonScene): { id: string; instanceId?: string } | undefined {
		const type = this.wandmakerType;
		if (type === 1) return this.bag.find('corpseDust');
		if (type === 2) return this.bag.find('embers');
		if (type === 3) return this.bag.items.find((item) => item.id === 'seed' && (item as typeof item & { sourceClass?: string }).sourceClass === 'Rotberry');
		const scroll = ['scroll', 'scrollIdentify', 'scrollUpgrade'].find((id) => this.bag.find(id));
		return scroll ? this.bag.find(scroll) : undefined;
	},

	/** Each shop's opening shelf, authored in `scenario-rules.mwl`'s `shopShelfStock`
	 * (the simplified two-potions/two-identifies stock this shop UI trades). */
	/** The shelf `ShopRoom.generateItems()` stocks for this depth - see `items/shopStock.ts` for
	 *  the whole list and its draws. Built once per depth and cached: Java generates a shop's items
	 *  when the room is painted, not every time the keeper is spoken to. */
	shopStockFor(this: DungeonScene, depth: number): Actors.Inventory {
		let stock = this.shopStocks.get(depth);
		if (!stock) {
			stock = new Actors.Inventory();
			const hourglass = this.bag.find('hourglass') as (typeof this.bag.items[number] & { sandBags?: number }) | undefined;
			//Java's own gate: `hourglass != null && hourglass.isIdentified() && !hourglass.cursed`.
			const hourglassBags = hourglass && hourglass.identified !== false && !hourglass.cursed
				? Math.max(0, mwlItemEffectValue('hourglass', 'sandBagCap') - (hourglass.sandBags ?? hourglass.level ?? 0))
				: null;
			//`ChooseBag(Dungeon.hero.belongings)`: the pick and its flag drop happen here, at
			//shelf-generation time - the port's analogue of `ShopRoom.paint()` (see
			//`maybeSpawnShopkeeper`, which builds the shelf at keeper-spawn, not first talk).
			//`sourceClass` is the payload field minted heaps and generated entries carry, which
			//the pick's holdability scoring needs to tell a missile `stone` from a runestone.
			const bagPickForShop = chooseShopBag(this.droppedBags, this.bag.items.map((item) => ({ id: item.id, sourceClass: (item as { sourceClass?: string }).sourceClass })));
			if (bagPickForShop) this.droppedBags.push(bagPickForShop);
			for (const plan of planShopStock(depth, hourglassBags, {
				//`Generator.wepTiers`/`misTiers` are Java's 0-indexed arrays whose first entry is tier
				//1, so Java's index *n* is this port's `Cat.WEP_T{n+1}` - the offset lives here, at
				//the boundary, rather than in `shopStock.ts`.
				weaponTier: (tier) => (Cat.WEP_T1 + tier) as Cat,
				missileTier: (tier) => (Cat.MIS_T1 + tier) as Cat,
				potion: Cat.POTION, scroll: Cat.SCROLL, seed: Cat.SEED, wand: Cat.WAND, ring: Cat.RING,
				randomCategory: (cat) => randomCategory(cat as Cat),
				randomUsingDefaults: (cat) => randomUsingDefaults(cat as Cat),
				randomArtifact: () => randomArtifact(),
				rng: {
					int: (n) => Random.int(n),
					intRange: (min, max) => Random.normalRange(min, max),
					long: () => Number(SpdRandom.long()),
					pushGenerator: (seed) => SpdRandom.pushGenerator(BigInt(seed)),
					popGenerator: () => SpdRandom.popGenerator(),
				},
			}, bagPickForShop)) {
				if (plan.kind === 'generated') {
					const item = this.generatedInventoryItem(plan.generated);
					stock.add({ ...item, quantity: item.quantity ?? 1, stackable: true, identified: plan.identify });
				} else if (plan.kind === 'item') {
					stock.add({ id: plan.id, quantity: plan.quantity, stackable: true, identified: plan.identify,
						...(plan.tier !== undefined ? { tier: plan.tier } : {}), ...(plan.level !== undefined ? { level: plan.level } : {}) });
				} else if (plan.kind === 'tippedDart') {
					//`TippedDart.randomTipped(2)`: a stack of two darts tipped with the drawn seed.
					const setId = this.newItemInstanceId('missile');
					const tipped: typeof stock.items[number] & { sourceClass?: string; tippedSeed?: string; level?: number; durability?: number; maxDurability?: number; missileSet?: string } = {
						id: 'missile_tippeddart', quantity: plan.quantity, stackable: true, identified: plan.identify,
						sourceClass: 'TippedDart', tippedSeed: plan.seedClass, level: 0,
						durability: MISSILE_MAX_DURABILITY, maxDurability: MISSILE_MAX_DURABILITY,
						missileSet: setId, instanceId: missileStackId(setId, 0, plan.seedClass),
					};
					stock.add(tipped);
				} else {
					//Java increments `hourglass.sandBags` as it stocks each bag, so a later shop
					//offers the remainder rather than a fresh five.
					if (hourglass) hourglass.sandBags = Math.min(mwlItemEffectValue('hourglass', 'sandBagCap'), (hourglass.sandBags ?? 0) + 1);
					stock.add({ id: 'sandBag', quantity: 1, stackable: true, identified: true });
				}
			}
			this.shopStocks.set(depth, stock);
		}
		return stock;
	},

	buybackFor(this: DungeonScene, depth: number): { id: string; quantity: number; identified?: boolean; tier?: number; level?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; seal?: boolean }[] {
		let shelf = this.shopBuybackShelves.get(depth);
		if (!shelf) {
			shelf = [];
			this.shopBuybackShelves.set(depth, shelf);
		}
		return shelf;
	},

	/** Shopkeeper: bump to hear prices, B/N to buy, V to choose a sale, G to buy back the latest sale */
	interactWithShopkeeper(this: DungeonScene): void {
		const potionPrice = this.shopPrice('potion');
		const identifyPrice = this.shopPrice('scrollIdentify');
		const foodPrice = this.shopSellPrice('food');
		let text = t('port.log.shopgreet', {
			potion: potionPrice, identify: identifyPrice, food: foodPrice, gold: this.heroStats.base('gold'),
		});
		const shelf = this.buybackFor(this.depth);
		if (shelf.length > 0) {
			const items = shelf.map((e) =>
				`${this.itemDisplayName(e.id, e.identified ?? true)} (${buybackPrice(e.id, e.quantity, e.identified ?? true, e)})`).join(', ');
			text += t('port.log.shopbuyback', { items });
		}
		this.say(text);
		//Java's shop is a `WndTradeItem` over each FOR_SALE heap: a window listing what the keeper
		//has, each item with its price, and a buy button for it. This port's generic picker is that
		//window - the rows are the shelf's stock, each labelled with SPD's own
		//`windows.wndtradeitem.buy` string and its price - and picking a row opens that row's own detail window (body plus buy row). Java prices
		//the *heap's* items; this port prices the id, through the same `getShopPrice` its sell side
		//already uses, which is the same per-unit `value()` body either way.
		const stock = this.shopStockFor(this.depth);
		const entries = stock.items
			.filter((stockItem) => stockItem.quantity > 0)
			.map((stockItem) => ({
				id: stockItem.id,
				instanceId: stockItem.instanceId,
				identified: true,
				quantity: stockItem.quantity,
				note: t('windows.wndtradeitem.buy', { '0': getShopPrice(stockItem.id, this.depth) }),
			}));
		if (entries.length === 0) return;
		this.openItemPicker(t('port.ui.shop.title'), entries, (pick) => this.openShelfItemDetail(pick));
	},

	/** `WndTradeItem extends WndInfoItem` body for a shelf or stand good: the item's description
	 * plus its per-class stats line (`itemStatsLine` - damage/DR with Java's real STR sentences),
	 * `undefined` when the id has neither. The stand-purchase window builds the same body inline;
	 * that verified-live path is deliberately untouched, and this is its twin for the shelf. */
	tradeItemBody(this: DungeonScene, item: { id: string; sourceClass?: string; tier?: number; level?: number }): string | undefined {
		const parts = [
			itemDescription(item.id, item.sourceClass),
			itemStatsLine(item.id, { tier: item.tier, level: item.level, sourceClass: item.sourceClass, heroStr: this.hero.str }),
		].filter((part): part is string => part !== undefined);
		return parts.length > 0 ? parts.join('\n') : undefined;
	},

	/** Java opens one `WndTradeItem` per heap; this port lists the whole shelf at once, so picking
	 * a shelf row opens that row's own detail window - the body above the buy row - and the buy
	 * row completes the purchase through the unchanged `buyStockEntry` path. */
	openShelfItemDetail(this: DungeonScene, pick: { id: string; instanceId?: string }): void {
		const stock = this.shopStockFor(this.depth);
		const entry = stock.items.find((stockItem) => stockItem.quantity > 0 && stockItem.id === pick.id
			&& (stockItem.instanceId ?? undefined) === (pick.instanceId ?? undefined));
		if (!entry) return;
		this.openItemPicker(this.itemDisplayName(entry.id, true, entry.instanceId), [
			{ id: entry.id, instanceId: entry.instanceId, identified: true, quantity: 1, note: t('windows.wndtradeitem.buy', { '0': getShopPrice(entry.id, this.depth) }) },
		], () => this.buyStockEntry(pick), this.tradeItemBody(entry));
	},

	/** Buying one unit of a shelf good: `Actors.buy` against the shop's own stock at `getShopPrice`,
	 *  reporting the same `port.log.buy`/`cannotafford` lines the old fixed two-id path did. */
	buyStockEntry(this: DungeonScene, pick: { id: string; instanceId?: string }): void {
		const stock = this.shopStockFor(this.depth);
		const price = getShopPrice(pick.id, this.depth);
		const prices = new Map([[pick.id, { buy: price, sell: 0 }]]);
		const name = this.itemDisplayName(pick.id, true, pick.instanceId);
		if (Actors.buy(this.heroStats, stock, this.bag, pick.id, 1, { currency: 'gold', prices })) {
			this.say(t('port.log.buy', { item: name, price }), 'positive');
			this.noteBagAcquired(pick.id);
		} else this.say(t('port.log.cannotafford', { item: name, price }), 'negative');
	},

	shopPrice(this: DungeonScene, id: 'potion' | 'scrollIdentify'): number {
		return itemShopPrice(id, this.depth);
	},

	shopSellPrice(this: DungeonScene, id: 'food' | 'meat'): number {
		return itemShopSellPrice(id, this.depth);
	},

	shopBuy(this: DungeonScene, id: 'potion' | 'scrollIdentify'): void {
		buyFromShop(id, this.shopActionsContext());
	},

	shopSellFood(this: DungeonScene): void {
		sellFood(this.shopActionsContext());
	},

	/** Rebuy the most recent sale at flat `value()` (`Dungeon.gold -= returned.value()`).
	 * No picker UI exists to choose among up to 3 shelf entries, so the key always takes
	 * the latest sale (Java appends new sales at the list end) - documented, not silent. */
	shopBuyback(this: DungeonScene): void {
		buybackFromShop(this.shopActionsContext());
	},

	shopActionsContext(this: DungeonScene): ShopActionsContext {
		return {
			heroStats: this.heroStats,
			bag: this.bag,
			stock: this.shopStockFor(this.depth),
			buyback: this.buybackFor(this.depth),
			depth: this.depth,
			openItemPicker: (title, entries, onPick) => this.openItemPicker(title, entries, (entry) => onPick({ ...entry, quantity: 1 })),
			itemDisplayName: (id, identified) => this.itemDisplayName(id, identified),
			say: (message, level) => this.say(message, level),
			//`WndTradeItem`'s selling buttons: the scene owns the window, `sellFood` decided which
			//quantities exist. `showChoiceWindow` is the same seam the seal transfer uses.
			showSellOptions: (itemName, options, onPick) => showChoiceWindow(
				this.gameWindows,
				itemName,
				'',
				options.map((option) => ({ label: option.label, onPick: () => onPick(option.units) })),
			),
		};
	},

	/**
	 * `{Sewer,Prison}Level.painter()`: `.setWater(feeling == WATER ? 0.85/0.90f : 0.30f, 5/4)`
	 * (the non-"feeling" branch, since this port does not model `Level.Feeling`) - real water
	 * in both regions is a level-wide organic patch, not a small hand-placed rectangle the way
	 * this port used to draw it. `RegularPainter.paintWater`'s own restriction - only
	 * `Terrain.EMPTY` (plain floor) cells the patch mask covers become water - is reproduced
	 * by checking `FLOOR` here; nothing has been placed as `DOOR`/`GRASS` yet at this point in
	 * `enterLevel`, so there is nothing else to accidentally flood.
	 */
	placeWaterPool(this: DungeonScene, start: Step, region: Region): void {
		const w = this.level.width;
		const h = this.level.height;
		const { fill, smoothing } = REGION_WATER[region];
		const lake = patchGenerate(w, h, fill, smoothing, true);

		for (const room of this.level.rooms) {
			for (let y = room.top; y <= room.bottom; y++) {
				for (let x = room.left; x <= room.right; x++) {
					if (lake[x + y * w] && this.level.get(x, y) === FLOOR) this.level.set(x, y, WATER);
				}
			}
		}

		//SPD's own room-shape exclusions (waterPlaceablePoints) keep entrances/exits dry as a
		//side effect of room geometry; this just clears the two specific points directly
		this.level.set(start.x, start.y, FLOOR);
		if (this.hasStairs) this.level.set(this.stairs.x, this.stairs.y, FLOOR);
	},

	/**
	 * `RegularPainter.paintGrass`: another `Patch.generate` pass, same shape of algorithm as
	 * `placeWaterPool` but its own fill/smoothing (`REGION_GRASS`) and reading `Terrain.EMPTY`
	 * cells the same way. Java then rolls each covered cell into `GRASS` or `HIGH_GRASS`
	 * (`Random.Float() < count/12f`, `count` starting at 1 for the cell itself plus one per
	 * grass-patch neighbour among its 8) - reproduced verbatim below, since it's what actually
	 * produces the real ~60%-high-grass mix at these fill/smoothing numbers the header comment
	 * on `TERRAIN_FRAME` mentions, not an invented ratio.
	 */
	placeGrass(this: DungeonScene, region: Region, start: Step): void {
		const w = this.level.width;
		const h = this.level.height;
		const { fill, smoothing } = REGION_GRASS[region];
		const patch = patchGenerate(w, h, fill, smoothing, true);

		for (const room of this.level.rooms) {
			for (let y = room.top; y <= room.bottom; y++) {
				for (let x = room.left; x <= room.right; x++) {
				const i = x + y * w;
				if (!patch[i] || this.level.get(x, y) !== FLOOR) continue;

				let count = 1;
				for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					if (patch[nx + ny * w]) count++;
				}
				this.level.set(x, y, Random.float() < count / 12 ? HIGH_GRASS : GRASS);
				}
			}
		}

		this.level.set(start.x, start.y, FLOOR);
		if (this.hasStairs) this.level.set(this.stairs.x, this.stairs.y, FLOOR);
	},

	/**
	 * `RegularLevel.createItems()`: 3/4/5 generated items at 60%/30%/10%, plus two on a
	 * LARGE-feeling floor. Room painters have already emitted their own special-room drops;
	 * this is the separate regular-level item pass. The payload keeps the Generator-selected
	 * class, while the supported heap outcomes are represented by the live ground-item/chest
	 * boundary. The 1-in-20 ordinary Mimic branch and Java's artifact/upgradable locked-chest
	 * branch are real actors/chests rather than silently leaving the generated item on the floor.
	 */
	placeGroundItems(this: DungeonScene): void {
		setGeneratorDepth(this.depth);
		this.upgradeScrollDrops = placeGeneratedGroundItems({
			depth: this.depth,
			isBossDepth: this.depth in BOSSES,
			largeFeeling: this.portedPaint?.feeling === 4,
			upgradeScrollDrops: this.upgradeScrollDrops,
			noScrolls: isChallengeEnabled('no_scrolls'),
			randomSpawnRoom: () => this.randomSpawnRoom(),
			generateItem: () => generatorRandom(),
			materialize: (generated) => this.generatedInventoryItem(generated),
			canPlaceFloorItem: (x, y) => [FLOOR, GRASS, HIGH_GRASS].includes(this.level.get(x, y))
				&& !this.creatureAt(x, y) && !(x === this.hero.x && y === this.hero.y)
				&& !(this.hasStairs && x === this.stairs.x && y === this.stairs.y)
				&& !this.groundItemAt(x, y),
			canPlaceKey: (x, y) => this.level.passable(x, y) && !this.creatureAt(x, y)
				&& !this.groundItemAt(x, y) && !(x === this.hero.x && y === this.hero.y),
			spawnMimic: (x, y, item) => this.spawnMonster('mimic', { x, y }, false, `${item.id}|${item.sourceClass ?? ''}`),
			spawnGround: (kind, x, y, item, chest) => this.spawnGroundItem(kind as GroundItemKind, x, y, item, chest),
			placeUpgradeScroll: () => this.placeQueuedPortedItem('ScrollOfUpgrade', this.level.rooms),
		});
		this.placeRosePetals();
	},

	groundItemAt(this: DungeonScene, x: number, y: number): GroundItem | null {
		return this.groundItems.find((i) => i.x === x && i.y === y) ?? null;
	},

	generatedInventoryItem(this: DungeonScene, generated: GenItem): NonNullable<GroundItem['item']> {
		return createGeneratedInventoryItem(generated, { newItemInstanceId: (kind) => this.newItemInstanceId(kind) });
	},

	dropGeneratedStatueItem(this: DungeonScene, generated: GenItem, x: number, y: number): void {
		const item = this.generatedInventoryItem(generated);
		const candidates = [{ x, y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: x + dx, y: y + dy }))];
		const at = candidates.find((cell) => this.level.passable(cell.x, cell.y)
			&& !this.groundItemAt(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
		if (!at) return;
		this.spawnGroundItem(groundKindForItem(item, 'armor'), at.x, at.y, item);
	},

	spawnGroundItem(this: DungeonScene, kind: GroundItemKind, x: number, y: number, item?: GroundItem['item'], chest?: 'normal' | 'locked' | 'crystal', forSale?: boolean): void {
		//`Level.drop()`: an item dropped on a chasm cell falls to the floor below instead of resting here
		//(a mob killed over a chasm, a thrown item that lands in one) - see `fallenItems.ts`.
		if (this.isChasmCell(x, y) && !this.miningBranchActive && this.depth < 26) {
			this.dropToChasm(kind, item, chest);
			return;
		}
		if (this.groundItemAt(x, y)) return; //one item per cell - this port's simplification of Java's stacking heaps

		//Java heaps show the item's own sprite: a ground potion/scroll wears its dealt
		//appearance (`Potion.reset()`'s `handler.image(this)`), the same frame the bag
		//resolves - without this every ground potion wore the one MWL family frame.
		let groundFrame = chest === 'crystal' ? CRYSTAL_CHEST_FRAME
			: chest === 'locked' ? LOCKED_CHEST_FRAME
			: chest === 'normal' ? CHEST_FRAME
			: kind === 'bomb' && item?.id === 'doubleBomb' ? ITEM_FRAME[kind] + 1 : ITEM_FRAME[kind];
		const groundCategory = item && kind === 'potion' && item.id.startsWith('potion') ? 'potion' as const
			: item && kind === 'scroll' && item.id.startsWith('scroll') ? 'scroll' as const : null;
		if (groundCategory && item) {
			try { groundFrame = appearanceItemFrame(groundCategory, this.appearances.appearanceOf(groundCategory, item.id)) ?? groundFrame; } catch { /* unknown id keeps the family frame */ }
		}
		const sprite = new TintedSprite(this.itemsSheet.get(groundFrame));
		//`Bomb.glowing()`: a lit fuse glows red - reapplied here (rather than only at
		//throw time) so lit bombs reloaded from a save glow too. An armed noisemaker has spent
		//its `fuseTurns` but is the most dangerous state, so it stays lit-looking.
		if (kind === 'bomb' && (item?.fuseTurns !== undefined || item?.noisemakerArmed)) sprite.tint = 0xff4444;
		sprite.x = x * TILE;
		sprite.y = y * TILE;
		this.itemLayer.addChild(sprite);
		const groundItem = { id: nextEntityId('item'), kind, x, y, item, chest, forSale };
		this.spriteFor.set(groundItem.id, sprite);
		this.groundItems.push(groundItem);
	},

	/** stepping onto a ground item's cell picks it up - `GameScene.pickUp` without a "leave it" choice, since there is no inventory UI to offer one through */
	pickupGroundItemAt(this: DungeonScene, x: number, y: number): void {
		const item = this.groundItemAt(x, y);
		if (!item) return;
		//`CorpseDust.doPickUp()`: the chill line on first pickup (the spawner bank it arms is
		//just `dustSpawnPower`, which the per-turn block reads).
		const hadDust = this.bag.find('corpseDust') !== undefined;
		pickupGroundItemWorkflow({
			item,
			depth: this.depth,
			heroClass: this.heroClass,
			gold: this.heroStats.base('gold'),
			hasItem: (id) => this.bag.find(id) !== undefined,
			removeItem: (id, quantity) => this.bag.remove(id, quantity),
			hasKeyForDepth: (id) => this.bag.items.some((it) => it.id === id && (it as { depth?: number }).depth === this.depth),
			removeKeyForDepth: (id) => {
				//`Notes.remove(Key)`: removes the depth-matched record, not the first
				//stack of the kind - mwg's `remove` without an instance takes the
				//first id-match, which is the stale key whenever one sorts first.
				//Entries that predate instance stamping (no `instanceId`) fall back
				//to that first-match behavior.
				const entry = this.bag.items.find((it) => it.id === id && (it as { depth?: number }).depth === this.depth);
				if (entry) this.bag.remove(id, 1, entry.instanceId);
			},
			mintKeyInstanceId: () => this.newItemInstanceId('key'),
			//`Heap.open()` rolls the Wealth bonus into the opened chest; the bonus heaps
			//materialise beside it (see `materialiseWealthDrop`), since this port's heaps
			//carry a single payload rather than Java's item list. The hero stands on the
			//chest cell - stepping onto it is what picks it up - so hero position is the
			//chest position, and `tryWealthBonusDrop` no-ops without a Wealth ring.
			rollWealthBonusOnOpen: () => this.tryWealthBonusDrop(this.hero, 1),
			setGold: (amount) => this.heroStats.setBase('gold', amount),
			shopPrice: (payload) => getShopPrice(payload.id, this.depth, payload.quantity, payload.identified ?? false),
			//`WndTradeItem`: the shop window is the same generic picker the keeper's own window
			//uses (see `interactWithShopkeeper`), one row for this heap, labelled with SPD's real
			//`windows.wndtradeitem.buy` string and the price. Only its pick pays; a cancel leaves
			//both the gold and the heap alone.
			cursedKeyDistracts: () => this.cursedKeyDistracts(),
			realKeyLockOpened: (kind) => this.realKeyLockOpened(kind),
			offerPurchase: (name, price, buy) => this.openItemPicker(t(name), [
				{ id: item.item?.id ?? 'gold', instanceId: item.item?.instanceId, identified: true, quantity: item.item?.quantity ?? 1, note: t('windows.wndtradeitem.buy', { '0': price }) },
			], () => { buy(); this.pickupGroundItemAt(x, y); }, item.item ? [
				itemDescription(item.item.id, item.item.sourceClass),
				//`WndTradeItem extends WndInfoItem`: the body is the item's description plus its
				//per-class stats line (damage/DR with Java's real STR sentences - wand charges
				//are not shown because Java does not show them either, see `itemStatsLine`).
				itemStatsLine(item.item.id, { tier: item.item.tier, level: item.item.level, sourceClass: item.item.sourceClass, heroStr: this.hero.str }),
			].filter((part): part is string => part !== undefined).join('\n') : undefined),
			itemName: (id, identified, instanceId) => this.itemDisplayName(id, identified, instanceId),
			missilePickupValid: (setId, level) => missilePickupValid(this.missileThresholds, setId, level),
			removeGround: () => {
				this.groundItems.splice(this.groundItems.indexOf(item), 1);
				this.sprite(item).destroy();
				this.spriteFor.delete(item.id);
			},
			playSound: (kind) => runState.audio.cue(kind === 'gold' ? 'gold' : kind === 'dewdrop' ? 'dewdrop' : 'item', 0.6),
			addItem: (payload, stackable = false) => {
				this.bag.add(stackable ? { ...payload, stackable: true } : payload);
				this.noteBagAcquired(payload.id);
			},
			bagFitsPickup: (incoming) => this.bagFitsPickup(incoming),
			identify: (payload) => Actors.identify(payload),
			say: (message, level) => this.say(message, level),
			showStatus: (message) => { if (language().code === 'en') this.showStatus(this.hero, message, SPD_STATUS_COLOR.neutral); },
			collectDewdrop: (force) => this.collectDewdrop(force),
			collectPetal: () => this.collectRosePetal(),
			forceDewdropPickup: (ground) => {
				const terrain = this.portedPaint?.map[this.level.index(ground.x, ground.y)];
				return terrain === Terrain.ENTRANCE || terrain === Terrain.EXIT;
			},
			addSand: (payload) => {
				const hourglass = this.bag.find('hourglass') as (typeof payload & { sandBags?: number }) | undefined;
				if (!hourglass || hourglass.cursed) { this.say(t('port.log.nohourglasssand'), 'negative'); return; }
				hourglass.sandBags = Math.min(5, (hourglass.sandBags ?? hourglass.level ?? 0) + 1);
				hourglass.level = hourglass.sandBags;
				this.say(hourglass.sandBags >= 5 ? 'Your hourglass is filled with magical sand.' : 'You add the sand to your hourglass.', 'positive');
			},
			addEnergy: (amount) => { this.alchemyEnergy += amount; this.showStatus(this.hero, '+' + amount, SPD_STATUS_COLOR.neutral); },
			addLooseGold: (amount) => { this.heroStats.setBase('gold', this.heroStats.base('gold') + amount); this.say(t('port.log.pickupgold', { amount }), 'positive'); },
			recoverStone: (ground) => {
				//A reclaimed heap joins the pile as the stack it was thrown from: an empty pile
				//adopts the heap's set and level (Java wields the picked-up stack), a pile already
				//holding that set gets the unit back. The port's heap carries no class, so the class
				//stays the pile's own - see `src/missiles.ts`.
				if (this.ammo === 0) {
					this.ammoSetId = ground.missileSet ?? this.newMissileSetId();
					this.missileLevel = ground.missileLevel ?? 0;
				}
				this.ammo++;
				if (this.ammoDurability <= 0) this.ammoDurability = MISSILE_MAX_DURABILITY;
				this.say(t('port.log.recoverstone'), 'positive');
			},
			pickupArmor: () => {
				if (this.armorLevel < 3) { this.armorLevel++; this.syncHeroFromStats(); this.say(t('port.log.weararmor', { level: this.armorLevel }), 'positive'); return true; }
				//Instance gear is never mergeable, so the stash is always a new stack -
				//`Item.collect()` fails it once the flat bag is full (silent, heap kept).
				const armorInstance = this.newItemInstanceId('armor');
				if (!this.bagFitsPickup({ id: 'armor', quantity: 1, instanceId: armorInstance })) return false;
				this.bag.add({ id: 'armor', quantity: 1, instanceId: armorInstance, identified: true }); this.say(t('port.log.stasharmor'));
				return true;
			},
			//`Slime`/`Skeleton`/`DM200`/`Golem`.rollToDropLoot()'s WEAPON-category drop, this
			//port's own "+1 level" simplification mirroring `pickupArmor` exactly (no concrete
			//weapon is generated either way) - reusing `port.log.weaponupgraded`, the same
			//message the blacksmith's own weapon upgrade already uses, since the event is the
			//same from the hero's perspective (the weapon in hand got stronger).
			pickupWeapon: () => {
				if (this.weaponLevel < 3) {
					this.weaponLevel++;
					this.syncHeroFromStats();
					this.say(t('port.log.weaponupgraded', { level: this.weaponLevel, min: this.hero.damage[0], max: this.hero.damage[1] }), 'positive');
					return true;
				} else {
					//Bugfix, live-verified: `this.weaponId` is the literal id `'startingWeapon'`
					//until the hero equips a real class (same shape `openBlacksmithUpgrade`'s
					//candidate list already relies on) - not a real weapon class name, and not a
					//name `itemDisplayName` can resolve on its own either (the equipped-slot UI
					//bypasses it entirely via `CLASSES[heroClass].weaponKey`). Stashing it as a
					//bare id rendered as the literal string "startingWeapon"; using it as
					//`weaponReward`'s `sourceClass` rendered the generic "quest weapon" fallback.
					//`STARTING_WEAPON_CLASS`'s real Java class per `HeroClass.initHero()` (tag
					//v3.3.8) fixes both: once resolved, this is the same shape the bones-loot
					//weapon candidate already uses for a real (non-starting) class id. Cleric's
					//"cudgel" is this port's own invented weapon key with no matching WEAPONS
					//table entry (Cleric has no real weapon system here yet) - stays unmapped,
					//falling back to the pre-existing generic "quest weapon" text rather than a
					//broken literal id, the same fallback every other unmapped sourceClass gets.
					const sourceClass = this.weaponId === 'startingWeapon' ? STARTING_WEAPON_CLASS[this.heroClass] : undefined;
					const id = this.weaponId === 'startingWeapon' ? 'weaponReward' : this.weaponId;
					const weaponInstance = this.newItemInstanceId('weapon');
					if (!this.bagFitsPickup({ id, quantity: 1, instanceId: weaponInstance })) return false;
					this.bag.add({ id, quantity: 1, instanceId: weaponInstance, identified: true, level: this.weaponLevel, ...(sourceClass ? { sourceClass } : {}) });
					this.say(t('port.log.stashweapon'));
					return true;
				}
			},
			pickupWand: () => {
				//`resolveWandPickup` (`items/wands.ts`): a pickup of the wielded class (or of
				//unknown class) absorbs exactly as before; any *other* class lands as a spare
				//entry with its own identity and full charge state (`simulation/spareWands.ts`)
				//instead of being silently destroyed. The spare is what `WildMagic` will fire
				//and `MagesStaff.imbueWand()` will choose among.
				const groundType = wandTypeFromSource(item.item?.sourceClass);
				if (groundType !== null && resolveWandPickup(this.wandType, groundType) === 'spare') {
					const spareInstance = this.newItemInstanceId('wand');
					if (!this.bagFitsPickup({ id: 'wand', quantity: 1, instanceId: spareInstance })) return false;
					const spare = newSpareWandCharges(wandInitialCharges(groundType));
					//The spare keeps the heap's own identification (ground wands arrive
					//unidentified, shop stock identified).
					this.bag.add({ id: 'wand', quantity: 1, instanceId: spareInstance, identified: item.item?.identified ?? false, level: 0, ...(item.item?.sourceClass ? { sourceClass: item.item.sourceClass } : {}), ...{ wandCur: spare.cur, wandPartial: spare.partial, wandMax: spare.max }, ...(item.item?.cursed ? { cursed: true } : {}), ...(item.item?.cursedKnown ? { cursedKnown: true } : {}) });
					this.say(t('actors.hero.hero.you_now_have', { 0: t(WAND_KEYS[groundType]) }), 'positive');
					return true;
				}
				if (!this.bagFitsPickup({ id: 'wand', quantity: 1, stackable: true })) return false;
				this.wandCharges = new Actors.Charges({ max: 4, current: 4, regenRate: 1 }); this.bag.add({ id: 'wand', quantity: 1, stackable: true, identified: true }); this.say(t('port.log.wandabsorbed'), 'positive');
				return true;
			},
			pickupAmulet: () => {
				this.gameState.setSwitch('amuletObtained', true); runState.audio.winMusic();
				if (this.demonSpawnerFloor) this.demonSpawnerFloor.setLayerData('demonSpawnerFloor', this.demonSpawnerFloorFrames(false));
				if (this.vaultVisuals) { const layers = this.vaultTileLayers(); this.vaultVisuals.setLayerData('vaultFloor', layers.floor); this.vaultVisuals.setLayerData('vaultCenter', layers.center); this.vaultVisuals.setLayerData('vaultCenterWalls', layers.walls); }
				this.awardBadge('amulet'); this.say(t('port.log.victory'), 'positive'); this.awaitingInput = false; this.gameOver = true;
			recordRun({ result: 'won', depth: this.depth, level: this.progression.level, gold: this.heroStats.base('gold') }); this.showVictoryPanel();
				return true;
			},
			pickupRing: () => {
				const ringId = 'ring_' + Random.element(Object.keys(RING_DEFS))!;
				const ringInstance = this.newItemInstanceId('ring');
				if (!this.bagFitsPickup({ id: ringId, quantity: 1, instanceId: ringInstance })) return false;
				this.bag.add({ id: ringId, quantity: 1, instanceId: ringInstance, identified: false, level: Random.chance(0.5) ? 1 : 0 });
				this.say(t('port.log.pickupring', { item: this.itemDisplayName(ringId, false) }), 'positive');
				return true;
			},
			pickupCrystalKey: () => {
				const keyInstance = this.newItemInstanceId('key');
				if (!this.bagFitsPickup({ id: 'crystalKey', quantity: 1, instanceId: keyInstance })) return false;
				//`Key.depth`/`isSimilar()`: stamped with the finding depth, like the ironKey/goldenKey
				//pickup in `groundPickup.ts`'s `pickupPayload` - see `bumpDoor`/the locked-chest checks.
				//One entry per key, never merged: mwg `add` folds a stackable key into the older
				//entry's depth, mis-stamping the new one.
				this.bag.add({ id: 'crystalKey', quantity: 1, identified: true, ...{ depth: this.depth }, instanceId: keyInstance }); this.say(t('port.log.pickup', { item: t('items.keys.crystalkey.name') }), 'positive');
				return true;
			},
			addSimpleGroundKind: (kind) => {
				const id = kind === 'potion' ? 'potion' : kind === 'scroll' ? (Random.chance(0.25) ? 'scrollUpgrade' : 'scrollIdentify') : kind;
				this.bag.add({ id, quantity: 1, stackable: true, identified: false }); this.say(t('port.log.pickup', { item: this.itemDisplayName(id, false) }), 'positive');
			},
			messages: {
				crystalChestLocked: t('port.log.crystalchestlocked'), unlockCrystalChest: t('port.log.unlockcrystalchest'), lockedChestNeedsGoldenKey: t('port.log.lockedchestneedsgoldenkey'), unlockChest: t('port.log.unlockchest'),
				cannotAfford: (item, price) => t('port.log.cannotafford', { item, price }), buy: (item, price) => t('port.log.buy', { item, price }), missileDust: t('port.log.missiledust'), noHourglassSand: t('port.log.nohourglasssand'), snuffFuse: t('items.bombs.bomb.snuff_fuse'), freeDoubleBomb: '1+1 free!', pickup: (item) => t('port.log.pickup', { item }), pickupGold: (amount) => t('port.log.pickupgold', { amount }), recoverStone: t('port.log.recoverstone'), pickUpRing: (item) => t('port.log.pickupring', { item }),
			},
		});
		if (!hadDust && this.bag.find('corpseDust')) this.say(t('items.quest.corpsedust.chill'), 'negative');
	},

	/** `Item.collect()`'s capacity gate over the flat bag: owned sub-bags take what their
	 *  `canHold` gate matches up to 19 stacks each, the rest counts toward the backpack's
	 *  own 20 (sub-bag contents excluded, owned bags included), and a mergeable stack or
	 *  a bag item itself always fits. See `bagFitsPickup` for the full routing. */
	bagFitsPickup(this: DungeonScene, incoming: BagPickupStack): boolean {
		return bagFitsPickup(this.bag.items, BAG_IDS.filter((bag) => ownsBag(this.bag.items, bag)), incoming);
	},

	eatFood(this: DungeonScene): boolean {
		return eatConsumableFood(this.consumableContext());
	},

	/**
	 * Quaffs the best potion for the moment (healing when hurt - a full-heal stand-in for
	 * Healing's Shielding-aware HoT - else strength/flame/mindvision/invis/purity in bag
	 * order). PotionOfHealing's cure list (poison/burning/weakness among them) is real.
	 */
	quaffPotion(this: DungeonScene): boolean {
		return quaffConsumablePotion(this.consumableContext());
	},

	/**
	 * The healing/purity trio lives in `items/potionEffects.ts` (`cureHeroBuffs`,
	 * `applyPotionHealing`, `applyPotionPurity`) - the file-size refactor's
	 * twenty-ninth extraction, behavior-identical. The registry calls the module
	 * functions directly now; the scene keeps these thin adapters for the wells,
	 * the ankh revive and `quaffPotion`'s own fallback.
	 */
	cureHeroBuffs(this: DungeonScene): void {
		cureHeroBuffs(this.hero);
	},

	applyPotionPurity(this: DungeonScene): void {
		applyPotionPurity(this.hero, this.say.bind(this));
	},

	/**
	 * The scroll-read selection plus dispatch lives in `items/scrollEffects.ts` as
	 * `readScrollFlow` behind `ReadScrollContext` - the file-size refactor's
	 * twenty-seventh extraction, behavior-identical. The scene only builds the
	 * context here.
	 */
	readScroll(this: DungeonScene): boolean {
		return readScrollFlow(this.readScrollContext());
	},

	readScrollContext(this: DungeonScene): ReadScrollContext {
		const scene = this;
		return {
			...scene.scrollEffectsContext(),
			bag: scene.bag,
			requestedItemId: scene.requestedItemId,
			requestedItemInstanceId: scene.requestedItemInstanceId,
			heroClass: scene.heroClass,
			talentRank: (id) => scene.talentRank(id),
			get empoweredZaps() { return scene.empoweredZaps; },
			set empoweredZaps(zaps: number) { scene.empoweredZaps = zaps; },
			itemDisplayName: (id, identified) => scene.itemDisplayName(id, identified),
			procIdentifyTalents: () => scene.procIdentifyTalents(),
			armRecallInscription: (sourceClass) => scene.armRecallInscription(sourceClass),
			startTransmutationPick: (instanceId) => startTransmutationPick(scene.transmuteFlowContext(), instanceId),
			get weaponAffix() { return scene.weaponAffix; },
			set weaponAffix(affix: string | null) { scene.weaponAffix = affix; },
			get armorGlyph() { return scene.armorGlyph; },
			set armorGlyph(glyph: string | null) { scene.armorGlyph = glyph; },
			equippedRing: scene.equippedRing,
			markRingTypesKnown: (ids) => markRingTypesKnown(scene, ids),
			syncHeroFromStats: () => scene.syncHeroFromStats(),
		};
	},
};
