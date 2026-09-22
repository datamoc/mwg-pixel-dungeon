import { placeCharacterArt, faceCharacter } from '../ui/characterPlacement';
import { CharacterEffects } from '../ui/characterEffects';
import { FogOfWar } from '../ui/fogOfWar';
import { wallBlockingFrame } from '../spdLevelGen/wallBlocking';
import { InfoWindow } from '../ui/infoWindow';
import { buffInfo } from '../ui/buffInfo';
import { showBuffInfoWindow } from '../ui/buffInfoWindow';
import { WaterSurface } from '../ui/waterSurface';
import { InventoryWindow } from '../ui/inventoryWindow';
import { refreshInventoryPanel as refreshInventoryPanelView, type InventoryPanelContext } from '../ui/inventoryPanel';
import { createJournalWindow } from '../ui/journalWindow';
import { createJournalTabs } from '../ui/journalContent';
import { Container, FillGradient, Graphics, Rectangle, Sprite, Texture, TilingSprite } from 'mwg/two-d/pixi-interop';
import { Bar, Blob, FloatingTextStack, Game, Scene2D, Input, Random, SaveSystem, Achievements, ReactionTable, type ReactionRule } from 'mwg';
import { spawnDeathBursts, spawnShadowBurst, spawnTeleportBurst, type LiveBurst } from '../ui/effectBursts';
import { SceneSimulationAdapter } from '../adapters/sceneSimulation';
import { dispatchHeroAction, type HeroActionPorts } from '../adapters/heroActions';
import { BOOMERANG_RETURN_ACC_FACTOR, BOOMERANG_RETURN_TURNS, MISSILE_DEFAULT_QUANTITY, MISSILE_MAX_DURABILITY, bolasCrippleTurns, missileAdjacentAccFactor, missileBaseUses, missileDamageRange, missileFlightArt, missilePickupValid, missileStackFields, missileStackId, recordMissileUpgrade, tippedDartUseDivisor, tomahawkBleedRange, type MissileFlightArt } from '../items/missiles';
import { eatFood as eatConsumableFood, quaffPotion as quaffConsumablePotion, applyMealEatenEffects, collectDewdrop as collectConsumableDewdrop, type ConsumableContext } from '../items/consumables';
import { applyScrollEffect, readScrollFlow, rollUpgradeAffixLoss, upgradeGearFlow, type ReadScrollContext, type ScrollEffectsContext, type UpgradeGearContext } from '../items/scrollEffects';
import { applyPotionPurity, createPotionEffects, cureHeroBuffs } from '../items/potionEffects';
import { placeCandleAtSlot, aimCandleFlow, type CandleContext, type CandleAimContext } from '../items/candles';
import { throwTenguBomb, useBomb as useItemBomb, aimBombFlow, type BombContext, type BombAimContext } from '../items/bombs';
import { detonateBomb, type BombEffectsContext } from '../items/bombEffects';
import { buyFromShop, buybackFromShop, sellFood, shopPrice as itemShopPrice, shopSellPrice as itemShopSellPrice, type ShopActionsContext } from '../items/shopActions';
import { generatedInventoryItem as createGeneratedInventoryItem } from '../items/generatedItems';
import { placeGroundItems as placeGeneratedGroundItems } from '../items/groundPlacement';
import { planShopStock } from '../items/shopStock';
import { bagFitsPickup, bagTab, chooseShopBag, isBagId, ownsBag, HOLSTER_RECHARGE_BASE, NORMAL_RECHARGE_BASE, HOLSTER_DURABILITY_FACTOR, BAG_BADGE, ALL_BAGS_BADGE, BAG_IDS, type BagId, type BagPickupStack } from '../items/bags';
import { isResurrectKeepCandidate, partitionResurrectKeeps } from '../items/resurrect';
import { pickupGroundItem as pickupGroundItemWorkflow } from '../items/groundPickup';
import { reforgeDiscardedMissileSet, blacksmithHardenCost as itemBlacksmithHardenCost, blacksmithReforgeCost as itemBlacksmithReforgeCost, blacksmithReforgePairValid, blacksmithUpgradeCost as itemBlacksmithUpgradeCost, blacksmithTurnInFavor, BLACKSMITH_FREE_PICKAXE_FAVOR, rollCarriedAffixLoss, selectBlacksmithHardenItems, selectBlacksmithReforgeItems, selectBlacksmithUpgradeItems, type BlacksmithItem } from '../items/blacksmith';
import { abilityFlatBoost, accrueWeaponCharge, counterAbilityRefund, gainWeaponCharge, preciseAssaultAccuracy, spendWeaponCharge, weaponAbilityChargeCost, weaponAbilityFor, weaponChargeCap } from '../items/weaponAbilities';
import { useStoneOfFlock as useItemStoneOfFlock, useStoneOfAggression as useItemStoneOfAggression, useStoneOfAugmentation as useItemStoneOfAugmentation, useStoneOfFear as useItemStoneOfFear, useStoneOfDeepSleep as useItemStoneOfDeepSleep, useStoneOfBlink as useItemStoneOfBlink, useStoneOfClairvoyance as useItemStoneOfClairvoyance, useStoneOfShock as useItemStoneOfShock, useStoneOfBlast as useItemStoneOfBlast, useStoneOfEnchantment as useItemStoneOfEnchantment, useStoneOfDetectMagic as useItemStoneOfDetectMagic, useStoneOfIntuition as useItemStoneOfIntuition, type StoneContext, type StonePickerEntry } from '../items/stones';
import { runSearch } from '../adapters/searchSimulation';
import { runMovement } from '../adapters/movementSimulation';
import { runAttackResolution } from '../adapters/attackSimulation';
import { simulationRandom } from '../adapters/mwgRandom';
import { simulationRoguelike } from '../adapters/mwgRoguelike';
import { MEAL_TALENTS, MOVES } from '../simulation/heroActions';
import { wraithCombatStats, dustSpawnerStep, dustSpawnerCap } from '../simulation/wraith';
import { runHeroTurn } from '../adapters/gameSimulation';
import { takeGooTurn as runGooTurn } from '../simulation/gooBoss';
import { takeSentryTurn as takeSentryTurnFlow } from '../simulation/sentryTurn';
import { planRatKingWave, ratKingP1Summon, type RatKingAddKind, type RatKingWavePlan } from '../simulation/ratKingBoss';
import { chooseDM300Ability, dm300VentPath, planDM300Rockfall } from '../simulation/dm300Boss';
import { aimYogDeathGaze } from '../simulation/yogBoss';
import { planMonsterPopulation } from '../simulation/levelPopulation';
import { interactWithGhost as runGhostInteraction, interactWithImp as runImpInteraction, interactWithRatKing as runRatKingInteraction, interactWithWandmaker as runWandmakerInteraction } from '../actors/npcs';
import { preparationCanKo, preparationLevel, usePreparationBlink, type PreparationBlinkContext } from '../simulation/preparation';
import { confirmDisintegrationWand, livingEarthZapRange, useDisintegrationWand, type DisintegrationWandScene } from '../items/wands';
import { stepTenguAbility, tenguAbilityCost } from '../simulation/tenguAbility';
import { applyDefenderDamageCurves } from '../simulation/defenderDamageCurves';
import {
	TintedSprite,
	AnimatedSprite,
	Tweener,
	SpriteSheet,
	TileMap,
	Camera,
	Projectile,
	registerColorTransform,
} from 'mwg';
import { Label, theme, Button, Window, WindowStack } from 'mwg';
import { Roguelike, Actors, Rpg, World } from 'mwg';
import { loadSpdSprites } from '../images';
import { rollGeneratedAffix, groundKindForItem, portItemKind, sourceInventoryItem, isUpgradableItem, SPECIALTY_BOMB_IDS } from '../items/itemKinds';
import { ENCHANT_TABLE, GLYPH_TABLE, UNSTABLE_DELEGATES } from '../items/itemAffixes';
import {
	POTION_CLASS_BY_PORT_ID,
	stonePortId,
	startTransmutationPick,
	type TransmuteFlowContext,
} from '../items/transmutation';
import { examineTileOutcome } from '../ui/examineText';
import {
	type EquippedRing,
	RING_DEFS,
	ringDef,
	ringTenacityMultiplier,
	ringBonusLevel,
	ringMightBonus,
	ringHasteMultiplier,
	ringEnergyMultiplier,
	ringArcanaMultiplier,
	ringForceBonus,
	ringSharpshootingBonus,
	ringSharpshootingDurabilityMultiplier,
	ringWealthMultiplier,
	ringWealthBonus,
	ringElementsMultiplier,
	ringFurorMultiplier,
} from '../items/ringModifiers';
import {
	t,
	capitalize,
	titleCase,
	initI18n,
	setLanguage,
	language,
	nextLanguage,
	MOB_KEYS,
	CLASS_KEYS,
	REGION_KEYS,
	GROUND_ITEM_KEYS,
	ITEM_KEYS,
	RING_KEYS,
	WAND_KEYS,
	POTION_APPEARANCE_KEYS,
	SCROLL_APPEARANCE_KEYS,
	has,
} from '../i18n/index';
import { applySpdTheme, SPD_STATUS_COLOR } from '../ui/spdTheme';
import { GameLog, type LogLevel } from '../ui/gameLog';
import { Compass } from '../ui/compass';
import { BadgeBannerLayer } from '../ui/badgeBanner';
import { SpdToolbar } from '../ui/toolbar';
import { StatusPane } from '../ui/statusPane';
import { DungeonHud } from '../ui/dungeonHud';
import { SpdAudio } from '../audio';
import { onBrightnessChanged, onZoomChanged, screenShake, setZoomOffset, zoomForOffset, zoomOffset } from '../settings';
import { arcaneVisionDuration, assassinReachBonus, bountyHunterDropBonus, canImproviseProjectile, cleaveComboSeed, deathlessFuryTriggers, EMPOWERING_SCROLLS_BONUS, enhancedRingsDuration, enragedCatalystBonus, evasiveArmorBonus, empoweredStrikeBonus, farsightMultiplier, ironStomachReduction, lethalHasteDuration, lightCloakArtifactBonus, lightCloakRechargeRate, allyWarpRange, monasticVigorShield, preservationChance, projectileMomentumBonus, rejuvenatingStepHeal, seerShotDuration, SEER_SHOT_COOLDOWN, shieldBatteryGain, soulSiphonCharge, unencumberedSpiritEvasion, weaponRechargingDamage } from '../talentEffects';
import pixelFontUrl from '../assets/pixel_font.ttf';
import { SpdJavaRandom, spdScramble, spdSeedForDepth, SpdRandom } from '../spdRng';
import {
	isPortedDepth,
	portedFloor,
	miningBranchFloor,
	resetPortedRun,
	toGameTerrain,
	SPD_TERRAIN_TO_GAME_KIND,
	type PortedFloor,
} from '../spdLevelGen/gameBridge';
import { CAVES_BOSS_ARENA, CITY_BOTTOM_DOOR, CITY_IMP_SHOP, CITY_THRONE, CITY_TOP_DOOR, HALLS_EXIT_CELL, PRISON_ARENA, PRISON_TENGU_CELL, PRISON_TENGU_CELL_CENTER, PRISON_TENGU_CELL_DOOR, prisonBossArena, prisonBossEnd, prisonBossPause } from '../spdLevelGen/bossLevels';
import { hallsCenterPieceLayer, hallsCenterWallLayer } from '../spdLevelGen/hallsBossVisuals';
import { cityGroundDescKey, cityGroundLayer, cityGroundNameKey, cityWallLayer } from '../spdLevelGen/cityBossVisuals';
import { insideRitualMarker, ritualMarkerLayer } from '../spdLevelGen/ritualMarkerVisuals';
import { CAVES_GATE, cavesArenaDescKey, cavesArenaLayer, cavesArenaNameKey, cavesEntranceLayer, cavesOverhangLayer, type CavesArenaVisualContext } from '../spdLevelGen/cavesBossVisuals';
import { vaultBlockedCells, vaultCenterVisualFrames, vaultCenterWallFrames, vaultFloorFrames } from '../spdLevelGen/vaultVisuals';
import { spdPatchGenerate } from '../spdLevelGen/spdPatch';
import { entranceRoomContext } from '../spdLevelGen/rooms/standard/entranceRoom';
import { setHourglassShopState } from '../items/shopItems';
import { buybackPrice, getSellPrice, getShopPrice } from '../items/shopPricing';
import { TRAP_VISUALS, PLANT_VISUALS } from '../generated/terrainVisuals';
import { Terrain, type PaintLevel } from '../spdLevelGen/paintLevel';
import { foregroundGrassFrame } from '../spdLevelGen/visualWalls';
import { Feeling } from '../spdLevelGen/regularPainter';
import { WallDecorationLayer, WaterEmberLayer, WellRippleLayer } from '../ui/wallDecorations';
import { runState, LANGUAGE_KEY } from '../runState';
import { recordRun } from '../rankings';
import { isChallengeEnabled } from '../challenges';
import { HUNGRY, STARVING } from '../simulation/hunger';
import { CLASS_TALENTS, armorTalentDefinitions, subclassTalentDefinitions, TALENT_TIERS, type TalentDefinition } from '../talents';
import {
	ARMOR_CHARGE_MAX, ARMOR_CHARGE_PER_TURN, ARMOR_CHARGE_START,
	armorAbilitiesFor, armorAbilityDef, armorAbilityKey, armorChargeUse, isKnownArmorAbility, type ArmorAbilityDef,
} from '../armorAbilities';
import {
	bodySlamDamage, endureBankedDamage, endureDamageTaken, endureEndingBonus,
	impactWaveStrength, impactWaveVulnerable, shockwaveCone, shockwaveDamage,
	shockForceParalyses, strikingWaveProcs, type DamageRoll,
} from '../simulation/warriorAbilities';
import {
	SPIRIT_HAWK_LIFESPAN, goForTheEyesEffect, spiritHawkDodges, spiritHawkSpeed, spiritHawkViewDistance,
} from '../simulation/huntressAbilities';
import { exposeWeaknessDuration, feignedRetreatHaste, combinedLethalityTest, closeTheGapRange, invigoratingVictoryHeal, elementalStrikeCone, elementalPowerMulti, directedPowerBoost, elementalBlockingShield, elementalVampiricHeal, elementalSacrificialSelf, elementalBlobAmount, elementalBloomingBudget, elementalFurrowStep, elementalBaseDamage, elementalKineticSplash, elementalRootsDuration, elementalKnockback, elementalLuckyChance, elementalProjectingSplash, elementalCorruptingChance, elementalGrimChance, elementalCurseChance, elementalAnnoyingChance, elementalSacrificialOther, elementalStrikeResisted, type ElementalStrikeDamageSource } from '../simulation/duelistAbilities';
import { shadowCloneAccuracy, shadowCloneArmorShare, shadowCloneBladeShare, shadowCloneEvasion, shadowCloneHp } from '../simulation/rogueAbilities';
import { ratsistanceFactor, useRatmogrifyFlow, type RatmogrifyContext } from '../simulation/ratmogrify';
import { PRISMATIC_FADE_TURNS, PRISMATIC_HATCH_RANGE, prismaticGuardMaxHp, prismaticImageStats, prismaticSpawnCell } from '../simulation/prismatic';
import { mirrorImageStats } from '../simulation/mirrorImage';
import { CLASSES, CLASS_AMMO, HERO_IDLE_FRAME, type ClassId } from '../classes';
import { BADGE_DEFS, BADGE_ICON, loadBadges } from '../badges';
import { TitleScene } from '../scenes/titleScene';
import { ClassSelectScene } from '../scenes/classSelectScene';
import { menuScale } from '../ui/spdButton';
import { drawAimPreview } from '../ui/aimOverlay';
import { allyIdentityColorAdd, buildMonsterCreature, buildMonsterSprite } from './monsterSpawn';
import { mobOnHit } from './mobOnHit';
import { sharpenUi, tuneWindowStack, windowBaseZoom } from '../ui/windowFit';
import { applyDM300DeathUnseal, applyGooDeathUnseal, applyKingDeathUnseal, applyYogDeathUnseal, repairBossUnsealStairs, type BossUnsealContext } from './bossUnseal';
import { openGameMenu as openGameMenuWindow } from '../ui/gameMenu';
import { showChoiceWindow, showConfirmWindow } from '../ui/portWindows';
import { confirmBlacksmithCashout, confirmBlacksmithSmith, openBlacksmithWindow, type BlacksmithWindowContext } from '../ui/blacksmithWindow';
import { useFireblastWand as useFireblastWandEffect, useRegrowthWand as useRegrowthWandEffect, useTransfusionWand as useTransfusionWandEffect, useWardingWand as useWardingWandEffect } from '../items/wandEffects';
import { coneCells } from '../mechanics/cone';
import { traceRayToTarget } from '../mechanics/rays';
import { planTenguConeFront } from '../simulation/tenguBeam';
import { planFireSpread } from '../simulation/fireSpread';
import { applyHighGrassTrample, plantBloomingGrass as plantBloomingGrassFlow, trampleHighGrass as planHighGrassTrample, type HighGrassApplyContext, type HighGrassState } from '../simulation/highGrass';
import {
	applyEnvironmentalBlobs, emitToxicImbueGas,
	emitToxicGasVents as emitToxicGasVentsFlow,
	processSacrifice, spreadSacrificialFire,
	type SacrificialFireContext,
} from '../simulation/environmentalBlobs';
import { grantSungrassHealth, tickSungrassHealth, grantEarthrootArmor, absorbEarthrootArmor } from '../simulation/plantPools';
import { plantDropCandidates, plantDropCount } from '../simulation/plantDrops';
import { runHeroPlantEffect, runMobPlantEffect, type HeroPlantContext, type MobPlantContext } from '../simulation/plantTriggers';
import { teleportCandidates, disarmBubblePresses, type TeleportCell } from '../simulation/teleport';
import { TIME_BUBBLE_TURNS, timeBubbleTurnCost, spendTimeBubbleTurn } from '../simulation/timeBubble';
import { teleportAppearPlan } from '../simulation/teleportAppear';
import { evolveElectricity, evolveJavaBlob } from '../simulation/javaBlob';
import { burnFireContents as burnFireContentsEffect } from '../items/fireContent';
import { aggressionTarget as aggressionTargetFlow, amokTarget as amokTargetFlow, beeTarget as beeTargetFlow, findEnemyAlly as findEnemyAllyFlow, nearestVisibleEnemy as nearestVisibleEnemyFlow, pursueTarget as pursueTargetFlow, selectRangedTarget } from '../simulation/targeting';
import { fleeStep as fleeStepFlow, isPatrolTargetValid as isPatrolTargetValidFlow, nearestFreeCell as nearestFreeCellFlow, randomPatrolDestination as randomPatrolDestinationFlow, wanderBlocked as wanderBlockedFlow, type FleeStepContext, type SummonCellContext, type WanderingContext } from '../simulation/wandering';
import { deathBurstsFor, wardZapBursts, type DeathBurstSpec } from '../simulation/deathBursts';
import { canRipperLeap, predictRipperLeapTarget, chooseRipperBounceEnd, ripperLeapCooldown } from '../simulation/ripperLeap';
import { shouldSuccubusBlink, chooseSuccubusBlinkCell, succubusBlinkCooldown } from '../simulation/succubusBlink';
import { useBrewFlow, type BrewFlowContext } from '../simulation/brews';
import { useHoneypotFlow, type HoneypotFlowContext } from '../items/honeypot';
import { useAnkhFlow, useTorchFlow, type AnkhContext, type TorchContext } from '../items/selfUse';
import { foregroundGrassFrames as buildForegroundGrassFrames, terrainFrameAt as buildTerrainFrameAt, terrainFrames as buildTerrainFrames, wallFrameAt as buildWallFrameAt, wallFrames as buildWallFrames, waterFrames as buildWaterFrames, type DungeonTileFrameContext } from './dungeonTileFrames';
import { Banner } from '../ui/banner';
import { showDefeatPanel as showDefeatPanelUi, showVictoryPanel as showVictoryPanelUi } from '../ui/endPanels';
import { createItemPickerWindow } from '../ui/itemPicker';
import { curseInfusionLevelBonus, reverseCurseInfusion, transferEnhancement } from '../items/itemWorkflows';
import { armorReductionRange, weaponDamageRange, WEAPON_NAME_BY_CLASS, CLASS_ARMOR_ID_BY_CLASS, isClassArmorId } from '../items/catalog';
import { getCurse } from '../items/itemCurses';
import { Cat, blacksmithSmithRewards, generatorItemOrder, generatorRandom, ghostQuestReward, randomUsingDefaults, randomCategory, randomWeapon, randomArmor, randomArtifact, randomGold, removeArtifactClass, setGeneratorDepth, type GenItem, type StatueLoot } from '../items/generator';
import { MWL_CONSUMABLE_STATS, MWL_HERO_BASE_STATS, MWL_HERO_LEVEL_GROWTH, MWL_MISSILE_BY_CLASS, MWL_MISSILE_NAME_KEYS, MWL_PROGRESSION, MWL_QUEST_DEFINITIONS, MWL_SCENARIO_QUESTS, MWL_TURN_CLOCK, MWL_WAND_WARD_RULES, mwlItemEffectValue } from '../mwlContent';
import { dungeonRegion } from './regions';
import { hallsDemonSpawnerFloorFrames } from './regions/halls';
import { wandChargesPerCast, wandDamageRange, wandTargetRange, wandTypeFromSource, type WandType } from '../items/wands';
import {
	useItemById as routeItemAction,
	assignQuickslot as assignFamilyQuickslot,
	readQuickslotStates,
	useQuickslot as useQuickslotEntry,
	type ItemActionContext,
	type QuickslotContext,
} from '../items/itemActions';
import { equipWand as equipInventoryWand, type EquipWandContext } from '../items/equipWand';
import { useCloak as useArtifactCloak, useHourglass as useArtifactHourglass, useChalice as useArtifactChalice, useKingsCrown as useArtifactKingsCrown, useToolkit as useArtifactToolkit, useSpellbook as useArtifactSpellbook,
	applyCapeOfThornsProc, applyToolkitGainCharge, applyArmbandGainCharge, applyHornGainCharge, applyChainsGainExp, consumeToolkitEnergy, toolkitAvailableEnergy, energizeToolkit, setupSpellbookScrolls, randomSpellbookScroll, spellbookChargeCap, addScrollToSpellbook, type ArtifactActionContext, type SpellbookItem } from '../items/artifactActions';
import { sandalsNaturalismLevel, applySandalsNaturalismCharge, useSandalsFlow, type SandalsFlowContext, type SandalsItem } from '../items/sandals';
import { useChainsFlow, type ChainsFlowContext } from '../items/chains';
import { hornChargeCap, useHornFlow, type HornFlowContext } from '../items/horn';
import { useArmbandFlow, type ArmbandFlowContext } from '../items/armband';
import { applyTalismanPerTurnCharge, useTalismanFlow, checkTalismanAwarenessFlow, type TalismanFlowContext, type TalismanItem } from '../items/talisman';
import { roseGhostMaxHp, applyRoseRecharge, useRoseFlow, type RoseFlowContext, type RoseItem } from '../items/rose';
import { rosePetalsNeeded, rosePetalDropCap, rosePetalPickup, roseChargeCap, roseLevelCap } from '../items/rose';
import { beaconChargeCap, useBeaconFlow, useReturningBeaconFlow, type BeaconFlowContext, type BeaconItem } from '../items/beacon';
import { useTelekineticGrabFlow, usePhaseShiftFlow, useReclaimTrapFlow, useRecycleFlow, useCurseInfusionFlow, useMagicalInfusionFlow, useFeatherFallFlow, useWildEnergyFlow, useStylusFlow, useAlchemizeFlow, type TargetedSpellAim, type TelekineticGrabContext, type PhaseShiftContext, type ReclaimTrapContext, type RecycleContext, type InfusionBase, type CurseInfusionContext, type CastBase, type FeatherFallContext, type WildEnergyContext, type StylusContext, type AlchemizeContext } from '../items/spells';
import { planWealthDrops, wealthEquipBonus, initialiseWealthTrackers, wealthDeathRolls, type WealthDropPlan, type WealthTrackers } from '../items/wealthDrops';
import { artifactRechargeEffect, bankArtifactCharge, chaliceRechargeHeal, roseRechargeGhostHeal, artifactRechargeDuration, wildEnergyRechargeTurns, type RechargeGuards } from '../items/artifactRecharge';
import { equipRing as equipInventoryRing, equipArmor as equipInventoryArmor, equipWeapon as equipInventoryWeapon, openClassArmorTransfer as openInventoryClassArmorTransfer, type GearEquipmentContext, type RingEquipmentContext } from '../items/equipment';
import { itemDescription, itemStatsLine, itemDisplayName as resolveItemDisplayName, type ItemDisplayContext } from '../items/displayName';
import { weaponSTRReq, canSurpriseAttack } from '../items/strReq';
import { useStoneById as routeStoneAction, type StoneActionContext } from '../items/stoneActions';
import { setWandmakerQuestType, setWandmakerQuestWands, wandmakerQuestType, wandmakerQuestWands } from '../spdLevelGen/wandmaker';
import type { FloorState, SavedCreature } from './floorState';
import { monsterSpawnProfile } from '../actors/monsterSpawn';
import { ritualSiteState } from '../spdLevelGen/rooms/standard/ritualSiteRoom';
import {
	TILE,
	VIEW_RADIUS,
	WALL,
	FLOOR,
	TRAP,
	WATER,
	DOOR,
	GRASS,
	HIGH_GRASS,
	DOOR_CLOSED,
	EMBERS,
	SOLID,
	GAME_KIND_CODES,
	TERRAIN_KINDS,
	TERRAIN_FRAME,
	TRAP_KINDS,
	ITEM_FRAME,
	WATERSKIN_MAX,
	type TrapKind,
	type GroundItemKind,
} from '../dungeonConstants';
import {
	COLOR,
	spdSeedValue,
	regionForDepth,
	REGION_WATER,
	REGION_GRASS,
	generateSpdDungeon,
	patchGenerate,
	type Region,
} from '../genericDungeon';
import {
	baseCreature,
	rollHit,
	rollDamage,
	setAnnounceBuff,
	addBuff,
	reigniteBuff,
	stoneGlyphReduction,
	grimTrapDamage,
	explosiveTrapBounds,
	setBleeding,
	tickBuffs,
	INFINITE_EVASION,
	NEGATIVE_BUFFS,
	BUFF_DURATION,
	absorbShield,
	type Step,
	type Creature,
	type GroundItem,
	type BuffId,
} from '../combat';
import { nextEntityId } from '../simulation/entityId';
import { applyChillFreeze, tickMonsterTurnEnd } from '../simulation/buffs';
import { heroSheet, MONSTERS, mobRosterForDepth, liveStats, BOSSES, MOB_LOOT, LIMITED_DROP_DECAY, NPC_KINDS, BOSS_KINDS, MINIBOSS_KINDS, UNDEAD_KINDS, isUndeadOrDemonic, IMMOVABLE_KINDS, INORGANIC_KINDS, NEVER_SLEEPS_KINDS, FLYING_KINDS, BLOB_IMMUNE_KINDS, MWL_AI_PROFILES, type AnyMonsterId, type MonsterId } from '../monsters';
import { APPEARANCE_TABLES, AUGMENT_OPTIONS, BLACKSMITH_QUEST, BLACKSMITH_SMITH_COST, ETERNAL_FIRE_BURN, HARMFUL_PLANTS, HERO_SCHEDULER_ID, IMP_QUEST, MOB_SCHEDULER_ID_PREFIX, NATURES_POWER_DURATION, NON_STATBLOCK_RING_STATS, SAD_GHOST_QUEST, SPD_LEVEL_CURVE, STARTING_WEAPON_CLASS, SUBCLASS_OPTIONS, SUBCLASS_TRACK, TENGU_CIRCLE8, WANDMAKER_CLASS_INTROS, WANDMAKER_QUEST, effectMarkSheet, isStatueLoot, scenarioQuest, wardTexture, type BonesShape, type SaveShape } from './dungeon/shared';
import { coreSpawnTilesMethods } from './dungeon/coreSpawnTiles';
import { npcShopBlacksmithMethods } from './dungeon/npcShopBlacksmith';
import { environmentFireTrapsMethods } from './dungeon/environmentFireTraps';
import { turnLoopAimingMethods } from './dungeon/turnLoopAiming';
import { actorTurnsHazardsMethods } from './dungeon/actorTurnsHazards';
import { monsterAiMethods } from './dungeon/monsters/monsterAi';
import { bossLogicMethods } from './dungeon/bosses/bossLogic';
import { combatResolutionMethods } from './dungeon/combatResolution';
import { deathSaveRefreshMethods } from './dungeon/deathSaveRefresh';
import { panelsSingleUseMethods } from './dungeon/panelsSingleUse';
import { inventoryQuickslotMethods } from './dungeon/hero/inventoryQuickslot';
import { clericSpellFlowsMethods } from './dungeon/hero/clericSpellFlows';
import { armorAbilityUseMethods } from './dungeon/hero/armorAbilityUse';
import { cursedWandCastMethods } from './dungeon/hero/cursedWandCast';
import { weaponSpellsGearMethods } from './dungeon/hero/weaponSpellsGear';

export class DungeonScene extends Scene2D {
	terrainSheet!: SpriteSheet;
	heroClass!: ClassId;
	camera!: Camera;
	map!: TileMap;
	//SPD's second wall layer. It is a separate TileMap rather than another layer of `map`
	//because Java draws it *above* the actors (`DungeonWallsTilemap` sits over the mob
	//sprites), so a wall top and its overhanging lip hide whoever is behind them - and layers
	//within one mwg TileMap all draw under whatever is added to the world after it.
	waterSurface?: WaterSurface;
	wallsMap!: TileMap;
	featuresMap?: TileMap;
	monsterMotion = new Map<TintedSprite, Tweener>();
	dyingMonsters = new Map<AnimatedSprite, { x: number; y: number; fade: number }>();
	characterEffects!: CharacterEffects;
	/** Reused each frame; avoids rebuilding the character-visual array in `update()`. */
	characterEffectCharacters: Array<{ sprite: TintedSprite; sleeping?: boolean }> = [];
	fog?: FogOfWar;
	wallBlocking?: TileMap;
	level!: Roguelike.Level;
	fov!: Roguelike.FieldOfView;
	pathfinder!: Roguelike.Pathfinder;
	secrets!: Roguelike.Secrets;
	scheduler = new Roguelike.Scheduler<Creature>();
	/** Set by `restoreFloor` when the saved turn queue already holds the hero, consumed once by
	 * `enterLevel`'s own `scheduler.add(this.hero, 0)` further down - see that call site. */
	restoredHeroQueued = false;
	/** A monster-turn cost other than the default 1 (the necromancer's summon, Tengu's abilities, chill,
	 * ...), read once via `monsterTurnCost` right after `takeMonsterTurn` returns, then cleared at the
	 * start of the next monster's turn. */
	pendingMonsterTurnCost: number | null = null;
	/**
	 * The scene→simulation bridge, built through `buildSimulation()` rather than inline because
	 * `Roguelike.Scheduler.restore` hands back a *new* scheduler instance while the adapter holds
	 * whatever instance it was constructed with - so restoring a floor rebuilds the adapter too
	 * (see `restoreFloor`).
	 */
	simulation = this.buildSimulation();

	readonly heroActions: HeroActionPorts = {
		isParalysed: () => !!this.hero.buffs['paralysis'] || !!this.hero.buffs['frost'],
		beginTurn: () => { this.awaitingInput = false; this.settleEndure(); },
		spendTurn: (turnCost?: number) => {
			//A Nature's-Powered bow shot stashes its own speed divisor (see `useSpecial`'s
			//bow branch): it divides this spend only, then clears - including on a free
			//turn, so a banked divisor can never leak into a later action's cost.
			const bowDivisor = this.pendingBowNpDivisor;
			this.pendingBowNpDivisor = null;
			if (this.freeTurnNext) this.freeTurnNext = false;
			else this.spendHeroTurn(bowDivisor !== null ? (turnCost ?? 1) / bowDivisor : turnCost);
		},
		announceParalysis: () => this.say(t('actors.buffs.paralysis.heromsg'), 'negative'),
		search: () => this.searchForSecrets(),
		attempts: {
			special: () => this.useSpecial(), eat: () => this.eatFood(),
			quaff: () => this.quaffPotion(), read: () => this.readScroll(), upgrade: () => this.upgradeGear(),
		},
		free: {
			examine: () => this.examineTile(this.hero.x, this.hero.y),
			//Preparation's blink: opening its aim costs nothing, and the attack it resolves into
			//is what spends the turn (Java's own `HeroAction.Attack` from the cell picker).
			preparation: () => this.usePreparationBlink(),
			//The armor ability is free to *open* (Java's cell selector) and its own `activate()`
			//spends the charge and the turn - one turn for Heroic Leap and Shockwave, three for
			//Endure, and nothing at all when the charge is short or the ability refuses.
			armorAbility: () => this.useArmorAbility(),
			talents: () => {
				this.talentOpen = this.subclassChoiceOpen || this.armorChoiceOpen || this.augmentChoiceOpen || this.itemPickerOpen || !this.talentOpen;
				this.refreshTalentPanel();
			},
			buyHeal: () => this.shopBuy('potion'), buyId: () => this.shopBuy('scrollIdentify'),
			sellFood: () => this.shopSellFood(), buyback: () => this.shopBuyback(),
			save: () => this.saveRun(), load: () => this.loadRun(),
		},
		move: (step) => {
			this.justDescended = false;
			this.actionSpentTurn = false;
			//Furor's attack-only cost (`Hero.attackDelay()` vs `Char.speed()`): when the
			//step leads into a hostile creature, `takeHeroTurn` resolves a bump-attack, so
			//spend that turn here at the attack rate and report it spent - the adapter must
			//not also spend the blanket cost. Movement/door/NPC steps fall through to the
			//adapter's own blanket-cost spend, matching Java's split where Furor never
			//speeds non-attacks. The occupant test mirrors `takeHeroTurn`'s own
			//`occupantAt` query (same `creatureAt`, same NPC exclusion).
			const target = { x: this.hero.x + step.x, y: this.hero.y + step.y };
			const occupant = this.creatureAt(target.x, target.y);
			if (occupant && !occupant.isNPC) {
				this.takeHeroTurn(step);
				if (!this.justDescended && !this.actionSpentTurn) {
					this.actionSpentTurn = true;
					this.spendHeroTurn(this.getAttackTurnCostMod());
				}
				return true;
			}
			this.takeHeroTurn(step);
			// enterLevel already establishes the new floor's first input turn.
			return this.justDescended || this.actionSpentTurn;
		},
		getTurnCostMod: () => this.getActionTurnCostMod(),
		//`Food.eatingTime()` (tag `v3.3.8`) checks the six meal talents and
		// reduces the base 3-turn eat cost to 1. Resolve that scene-owned rank
		// state at the adapter boundary; the planner remains pure.
		hasMealTalent: () => MEAL_TALENTS.some((id) => this.talentRank(id) > 0),
	};
	actionSpentTurn = false;
	creatureLayer = new Container();
	/** One-shot effect emitters (the curse infusion's shadow motes). Recovered as a reference whose
	 *  declaration the truncation took: placed in the world between the actors and the wall tops,
	 *  which is where Java draws its `effects` group. */
	effectLayer = new Container();
	itemLayer = new Container();
	itemsSheet!: SpriteSheet;

	creatures: Creature[] = [];
	groundItems: GroundItem[] = [];
	/** Sprite ownership keyed by `EntityId`, kept outside `Creature`/`GroundItem` themselves -
	 * see `SIMULATION_ARCHITECTURE.md`'s "Step 6". Every id that reaches this map is registered
	 * once at spawn and never re-registered, so a plain `Map` (not a WeakMap) is fine; entries
	 * are removed explicitly wherever the sprite is destroyed. */
	spriteFor = new Map<string, TintedSprite>();
	/** Seeds planted during play on floors whose original PaintLevel has no plant array. */
	manualPlants = new Map<number, string>();
	furrowedGrass = new Set<number>();
	/** Java room painters place quest NPCs/special mobs at fixed cells. */
	portedMobSpawns: { x: number; y: number; kind: string; loot?: string; initialWarmup?: number }[] = [];
	portedMobCells = new Set<number>();
	portedBranchExitCells = new Set<number>();
	portedWellWater = new Map<number, 'awareness' | 'health' | 'waterOfAwareness' | 'waterOfHealth'>();
	/** Java's generated wells and plants are mutable level features, not terrain. */
	portedFeatures = new Roguelike.FeatureLayer<DungeonScene>();
	/** The Blacksmith MiningLevel branch keeps the parent depth while replacing its map. */
	miningBranchActive = false;
	miningBranchEntrance: Step | null = null;
	/** Runtime state for visited depths; the generated layout remains the immutable baseline. */
	floorStates = new Map<number, FloorState>();
	/** The depth currently represented by `level`; distinct from `depth` during a transition. */
	activeFloorDepth: number | null = null;
	/**
	 * `Hero.belongings`: a real `mwg/actors` Inventory (stacking, identified flags, upgrade
	 * levels) instead of the old three-counter stand-in. Ground pickups go here (`stone`,
	 * `potion`, `scroll`, `food`, `meat`, `armor`, `wand`, `gold` as kinds); consumables are
	 * spent through the E/Q/I/U/B/N/V actions below.
	 */
	bag = new Actors.Inventory();
	itemSerial = 0;
	/** weapon/armor slots: ClothArmor starts equipped (identified), upgrades raise `level` */
	gear!: Actors.EquipmentSlots<'weapon' | 'armor', Actors.EquippableItem>;
	/** `Waterskin.volume` - dew collected on the hero's behalf (see `collectDewdrop`) */
	waterskin = 0;
	/** Hunger.HUNGRY=300, STARVING=450, STEP=10 per move */
	hunger = 0;
	/** Java's `Hunger.partialDamage` - fractional starvation damage carried between turns. */
	hungerPartialDamage = 0;
	/** the slower TurnClock hunger and wand recharge run on (distinct from the Scheduler) */
	clock = new World.TurnClock();
	/** Wand.Charger: progress is normalized because Java's delay depends on missing charges. */
	wandCharges = new Actors.Charges({ max: 4, regenRate: 1 });
	/** Cleric HolyTome: slow charges standing in for the SP economy this port has none of */
	tomeCharges = new Actors.Charges({ max: 3, regenRate: 20 });
	/** open/closed/locked door state (mwg/roguelike Doors over two terrain kinds) */
	doors!: Roguelike.Doors;
	trapKinds = new Map<number, TrapKind>();
	/** `Trap` objects are removed from Java's active trap map after firing/reclaiming; this
	 * explicit set preserves that one-shot rule while the compact port keeps trap metadata for
	 * rendering and save migration. */
	spentTrapCells = new Set<number>();
	/** `ReclaimTrap.ReclaimedTrap`: the visible trap class held by the hero for redeployment. */
	reclaimedTrap: TrapKind | null = null;
	/** `GatewayTrap.telePos` per gateway-trap cell (`disarmedByActivation = false`, so the
	 * trap stays live and the link must outlive the trigger - floor-scoped, like the
	 * trap map itself). Absent = unlinked (`-1` in Java). */
	gatewayTelePos = new Map<number, number>();
	hero!: Creature;
	depth = 1;
	/** Pending `BeaconOfReturning` arrival cell, consumed by the next floor rebuild. */
	beaconArrival: Step | null = null;
	/** Java Statistics.deepestFloor, used to cap Bones remains five floors above the run's low point. */
	deepestDepth = 1;
	/** `Dungeon.mobsToChampion` (a real Java `float`, not an int - `ChampionEnemy
	 * .rollForChampion`): decrements by 1 on every eligible spawn, no reset-to-8 step; a
	 * successful, non-excluded assignment adds a depth-scaled `8 - min(20, depth-1)/10` back on.
	 * See `rollForChampion` in `actors/monsterSpawn.ts` for the exact rule (re-verified against
	 * the correct `v3.3.8` tag after an earlier misread this session). `Dungeon.java`'s own
	 * `reset()` sets this to `1`, not 0 - matched here so the very first eligible spawn of a
	 * fresh run already clears the countdown, same as real Java. */
	mobsToChampion = 1;
	stairs: Step = { x: 0, y: 0 };
	stairsSprite?: TintedSprite;
	hasStairs = false;
	/** set by takeHeroTurn when a step lands on the stairs and triggers enterLevel() */
	justDescended = false;
	/** thrown-weapon charges left for classes whose special is finite (Warrior/Rogue/Duelist); ignored for the rest */
	ammo = 0;
	/** Shared missile upgrade level (all class missiles are tier-1; rogue knives scale max twice as fast - see useSpecial). No cap, like Java. */
	missileLevel = 0;
	/**
	 * Which missile class the wielded ammo *is* - `ThrowingStone` for a Warrior, but any of the
	 * fifteen once `wieldMissile` takes one out of the bag. Java tracks the class through the item
	 * instance the hero has equipped (`Belongings.thrownWeapon`); this port's ammo is a counter, so
	 * the class is the run state's own field, seeded from the hero class's starting missile and
	 * persisted with the run. It decides the thrown damage
	 * (`missileDamageRange(ammoSourceClass, ...)`), the durability `baseUses` (`missileBaseUses`)
	 * and the class's `proc()` - before this, all three read the *hero* class's missile, so the
	 * thirteen other authored missile classes could never actually be thrown.
	 */
	ammoSourceClass = '';
	/**
	 * The wielded pile's tip seed (`TippedDart` only): the `Plant.Seed` class the darts are
	 * tipped with, deciding the on-hit dart effect (`applyTippedDartEffect`). Carried alongside
	 * `ammoSourceClass` for the same reason - the pile is the stack - and persisted with it.
	 */
	ammoTippedSeed: string | undefined;
	/**
	 * `MissileWeapon.setID` lineage for the wielded ammo pile (see `src/missiles.ts`): the set the
	 * stack currently in the pile belongs to. Java mints a random id per stack; this port uses the
	 * scene's own per-instance counter (`newItemInstanceId('missile')`, run-seed + serial), which is
	 * what a carried stack's `instanceId` and `missileSet` are built from - so it is a **string**,
	 * not Java's long, and stable across a save. An empty pile has `''`, and the first stack
	 * wielded claims it. `missileThresholds` is the `UpgradedSetTracker.levelThresholds` map (set
	 * id to the post-upgrade level), persisted with the run since Java's buff revives.
	 */
	ammoSetId = '';
	/** `MissileWeapon.doThrow()`'s warning has been answered for this throw - see
	 * `confirmMissileThrow`, which re-enters `useSpecial` with this latched. */
	missileThrowConfirmed = false;
	/**
	 * `HeavyBoomerang.CircleBack`'s in-flight return (tag `v3.3.8`). Java attaches the buff to the
	 * hero with the cell the boomerang landed on (`thrownPos`), the hero's own cell at throw time
	 * (`returnPos`), the depth, and `left = 5`; five hero turns later the boomerang flies home to
	 * `returnPos` and resolves against whoever is standing there - picked up if that is still the
	 * hero, thrown at them (`hero.shoot`) if it is anyone else, and simply dropped if the cell is
	 * empty. Only one buff can exist per char (`Buff.append` returns the existing instance and
	 * `setup` overwrites it), so this port tracks a single pending return, overwritten by a second
	 * boomerang throw exactly as Java overwrites the first.
	 *
	 * Java keeps the countdown stalled while the hero is on another depth
	 * (`returnDepth == Dungeon.depth && returnBranch == Dungeon.branch`), which is why `depth` is
	 * stored and compared rather than the state being discarded on descent.
	 */
	boomerangReturn: { fromX: number; fromY: number; returnX: number; returnY: number; left: number; level: number; setId: string; depth: number } | null = null;
	missileThresholds = new Map<string, number>();
	/** `CorpseDust.DustGhostSpawner.spawnPower`, carried while the dust is (tag `v3.3.8`). */
	dustSpawnPower = 0;
	/** The wielded stack's own wear, `MissileWeapon.durability` (100-point scale); the pile and the
	 * bag stack it came from are the same stack, so this is what travels when it is stashed back
	 * (see `wieldMissile`). A projectile breaks only at 0. */
	ammoDurability = MISSILE_MAX_DURABILITY;
	projectiles: Array<{ flight: Projectile; sprite: TintedSprite; spin: number }> = [];
	/** A thrown item flies its own item sprite (`MissileSprite.view(item)`); anything
	 * without flight art - wand bolts, monster zaps - keeps the plain dot, which is
	 * what those effects approximate here rather than a stand-in for a real sprite. */
	dotTexture!: Texture;

	/** `Hero.exp`/`lvl` against SPD's real curve - see `SPD_LEVEL_CURVE` */
	progression!: Actors.Progression;
	/** base `accuracy`/`evasion`/`gold` a skill point can raise */
	heroStats!: Actors.StatBlock;
	/** Talent points banked per tier - `Talent.tierLevelThresholds` (tag `v3.3.8`) grants each
	 * tier its own separate pool over its own level window (T1 [2,7), T2 [7,13), T3 [13,21)),
	 * and a tier's points can only ever buy that tier's own talents in real Java; unspent
	 * points never carry across tiers. Indexed 0/1/2 for T1/T2/T3. **Replaces a single shared
	 * `Actors.SkillPoints` pool that let every tier freely cross-spend the same points (found
	 * in the 2026-09-09 hero-progression audit) - `Actors.SkillPoints` was also a StatBlock-
	 * spending primitive being defeated by immediately reverting the `accuracy` bump it caused
	 * as a side effect, just to reuse it as a bare counter; a plain per-tier array needs no
	 * such workaround.** T4's own [21,31) window (10 points) is deliberately never granted -
	 * this port has no T4 talents to spend them on (ROADMAP.md section 6), so granting them
	 * would silently let players over-invest T1-T3 with points real Java only ever lets them
	 * spend on T4. */
	talentPoints: number[] = [0, 0, 0, 0];
	/** Hero STR (STARTING_STR=10, +1 per Potion of Strength - no per-level gain in Java either) */
	heroStr = MWL_HERO_BASE_STATS.strength;
	/** Hero.java's independent attackSkill/defenseSkill counters. */
	heroAttackSkill = MWL_HERO_BASE_STATS.attackSkill;
	heroDefenseSkill = MWL_HERO_BASE_STATS.defenseSkill;
	talentAccuracy = 0;
	talentEvasion = 0;
	/** Java Hero.talents, keyed by the stable Talent enum id. */
	talentRanks: Record<string, number> = {};
	talentTier = 1 as 1 | 2 | 3 | 4;
	/** MeleeWeapon tier (1-5) and upgrade level; tier affects damage formula: min = tier+lvl, max = 5*(tier+1)+lvl*(tier+1) */
	/** `WndResurrect` flow: pending while the dead hero still owes the keeps choice, the ankh
	 * instance the window was opened for, and the two keeps (equipped weapon/armor by default).
	 * Transient UI state, never saved - except `resurrectPending` itself, without which a run
	 * saved mid-window would reload a dead hero with no window and no game over. */
	resurrectPending = false;
	resurrectAnkhInstanceId: string | undefined;
	resurrectKeep1: { id: string; instanceId?: string } | null = null;
	resurrectKeep2: { id: string; instanceId?: string } | null = null;
	weaponTier = 1;
	weaponLevel = 0;
	/** Armor tier (1-5) and upgrade level; tier affects armor formula similarly */
	armorTier = 1;
	armorLevel = 0;
	weaponId = 'startingWeapon';
	weaponInstanceId: string | undefined;
	/** The equipped weapon's own class (`Flail` for a flail), carried alongside the bag id
	 * because every generated weapon shares the `weaponReward` id - see `blacksmithItemClass`.
	 * Used by `Hero.canSurpriseAttack()`'s flail gate. */
	weaponSourceClass: string | undefined;
	/** `Weapon.enchantHardened`/`Armor.glyphHardened` for the *equipped* gear - the Blacksmith's
	 * hardening. While it is set, `upgrade()`'s affix-loss roll is replaced by a hardening-loss
	 * one, so the enchant is protected until the protection itself wears off (from +6). */
	weaponHardened = false;
	armorHardened = false;
	/** Whether the equipped weapon/armor is identified - `Item.identify()` is not implied by
	 * merely equipping something (see `equipRing`'s `EquippedRing.identified` doc comment).
	 * Starting gear is always known, hence the `true` default. */
	weaponIdentified = true;
	armorIdentified = true;
	/** `Weapon`/`Armor`/`Wand.curseInfusionBonus` for the *equipped* gear: CurseInfusion's marker,
	 * reversed (with its level) when the curse is cleansed - see `reverseCurseInfusion`. */
	weaponCurseInfusionBonus = false;
	armorCurseInfusionBonus = false;
	armorId = 'clothArmor';
	armorInstanceId: string | undefined;
	/** whether the Wandmaker's frost wand was chosen (zap also dazes) */
	frostWand = false;
	/** Concrete equipped wand family; old saves fall back to the Wandmaker's boolean. */
	wandType: WandType = 'magicMissile';
	/** `Charm.object` and `Charm.ignoreNextHit`, keyed by stable creature id. */
	charmTargets = new Map<string, string>();
	charmIgnoreNextHit = new Set<string>();

	/** switches/variables the quest stage conditions read */
	gameState = new Rpg.GameState();
	/** `Dungeon.energy`: carried alchemical energy, spent by recipes and persisted with the run. */
	alchemyEnergy = 0;
	quests = new Rpg.QuestLog();
	/** `Ghost.Quest.spawned` / Wandmaker `spawned` - each NPC appears once per run */
	ghostSpawned = false;
	wandmakerSpawned = false;
	/** The run's Wandmaker quest type (0 undecided, 1 dust, 2 embers, 3 rotberry) - synced
	 * from levelgen whenever known, persisted so dialogue/turn-in survive save/load. */
	wandmakerType = 0;
	/** Depths whose keeper has been spawned this run (Java shops sit on 6/11/16/21). Kept
	 * after `shops` replaced the single `shopkeeperSpawned` flag - old saves migrate it
	 * into a depth-6 entry on load. */
	shopSpawnedDepths = new Set<number>();
	/** Live shelf stock per shop depth (two potions + two identifies each, depleting as
	 * bought - Java's full generated stock needs unported items plus a shop-browse UI,
	 * so the 2-item stand-in stays, now per keeper instead of run-global). */
	shopStocks = new Map<number, Actors.Inventory>();
	/** `Shopkeeper.buybackItems` per shop depth: what the hero sold here, newest last
	 * (Java appends), capped at `MAX_BUYBACK_HISTORY = 3`, rebought at flat value. */
	shopBuybackShelves = new Map<number, { id: string; quantity: number; identified?: boolean; tier?: number; level?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; seal?: boolean }[]>();
	/** `Shopkeeper.processHarm()`'s one-warning buffer before fleeing for good. */
	shopkeeperWarned = false;
	blacksmithSpawned = false;
	/** Java Blacksmith.Quest.alternative: blood-stained pickaxe instead of 15 DarkGold. */
	blacksmithAlternative = false;
	/** `Blacksmith.Quest.bossBeaten`: set by the quest-branch bosses' deaths
	 * (`CrystalSpire`, `FungalCore`, `GnollGeomancer` call `Quest.beatBoss()`).
	 * None of the three mobs is ported, so nothing sets this yet - the field and
	 * its save plumbing exist so `complete()`'s +1000 already reads the real rule. */
	blacksmithBossBeaten = false;
	/** `Blacksmith.Quest.favor/reforges`: forge currency and progressive reforge count. */
	blacksmithFavor = 0;
	/** Java's `Blacksmith.Quest.pickaxe`: the returned quest pickaxe held for buy-back. */
	blacksmithPickaxeAvailable = false;
	/** Java's `Blacksmith.Quest.freePickaxe`, earned at 2500+ favor. */
	blacksmithPickaxeFree = false;
	/** `Blacksmith.Quest.hardens`, which each harden costs more than the last. */
	blacksmithHardens = 0;
	/** `Blacksmith.Quest.upgrades`, the paid upgrade service's own counter. */
	blacksmithUpgrades = 0;
	/** `Blacksmith.Quest.smiths`, and the pre-generated reward set `WndSmith` shows. */
	blacksmithSmiths = 0;
	blacksmithSmithRewards: NonNullable<GroundItem['item']>[] | null = null;
	blacksmithReforges = 0;
	blacksmithReforgeFirst: { id: string; instanceId?: string } | null = null;
	impSpawned = false;
	/** Imp token ask for this run (5 monk tokens on odd depths, 4 golem tokens on even) */
	impNeed = 5;
	/** `Dungeon.LimitedDrops`: how many times each of these mobs has already dropped its special
	 * loot this run - real Java scales `lootChance()` down further with every successful drop
	 * (`Bat`/`Necromancer`/`Guard` below), reset only on a new game, not per floor. */
	limitedDrops: Partial<Record<MonsterId, number>> = {};
	/** `Dungeon.LimitedDrops`' four bag flags, as the set of already-dropped bag ids.
	 * `HeroClass.initHero()` drops velvet unconditionally (see `makeHero`), and each built
	 * shop shelf drops its `ChooseBag()` pick (see `shopStockFor`) - run-lifetime state,
	 * reset only on a new game, persisted with the run like `limitedDrops`. */
	droppedBags: BagId[] = ['velvetPouch'];
	/** RingOfWealth.TriesToDropTracker/DropsToEquipTracker, persisted for the run. */
	wealthTriesToDrop = -1;
	wealthDropsToEquip = -1;
	/** `Dungeon.LimitedDrops.UPGRADE_SCROLLS.count`: guaranteed upgrade scrolls allocated this run. */
	upgradeScrollDrops = 0;
	/** Ghost Quest.type for this run (1 Fetid Rat, 2 Gnoll Trickster, 3 Great Crab) */
	ghostType = 1;
	/** Version 3 adds MWG actor serializers (Barrier/Inventory/progression state). Legacy fields
	 * remain accepted by loadRun, so the version bump is an explicit schema marker, not a reset. */
	saves = new SaveSystem<SaveShape>({ namespace: 'spd-mwg', version: 3 });
	/** Java Bones.dat equivalent: one remains payload survives a run and is consumed once. */
	bones = new SaveSystem<BonesShape>({ namespace: 'spd-bones', version: 1 });
	/** meta badges across runs (`Badges.java`, persisted separately from any one run) */
	meta = new SaveSystem<{ counts: [string, number][] }>({ namespace: 'spd-meta', version: 1 });
	badges = new Achievements();
	/**
	 * `SPDSettings.intro()`/`Document.ADVENTURERS_GUIDE`'s persisted, cross-run state - real
	 * Java only seals the depth-1/2 entrance room behind a hidden-door "tutorial" once, ever,
	 * for a genuinely new install; it un-seals permanently the moment the player reads the
	 * relevant guidebook page, typically within their very first run. This port has no
	 * guidebook-reading interaction (see `entranceRoomContext`'s own comment), so the closest
	 * faithful equivalent is treating the tutorial as satisfied by its real completion signal -
	 * successfully searching out the sealed door - and persisting that permanently, exactly
	 * like a badge. Without this, `entranceRoomContext.guideIntroRead`/`guideSearchingFound`
	 * would default `false` forever, resealing depth 1/2 on every single run rather than only
	 * a new player's first one.
	 */
	guideProgress = new SaveSystem<{ introRead: boolean; searchingFound: boolean }>({ namespace: 'spd-guide', version: 1 });
	/** talent tiers 3+ (subclass branch at 13, armor-ability capstone at 21) */
	advancement = new Actors.Advancement(SUBCLASS_TRACK);
	/** per-run shuffled potion/scroll looks, seeded at run start */
	appearances = new Actors.Appearances(APPEARANCE_TABLES);
	runSeed = 1;
	runSeedLong = 1n;
	runSeedLabel = '';
	/** Java Bones uses gold on custom-seed runs, but may copy eligible loot on normal runs. */
	seededRun = false;

	/** weapon enchant / armor glyph ids (from the affix tables, or null) */
	weaponAffix: string | null = null;
	/** Explosive curse's separate 100-point fuse, persisted with the equipped weapon. */
	weaponCurseDurability = 100;
	armorGlyph: string | null = null;
	/** King's Crown / Rat King choice - any real `ArmorAbility` id, or `ratmogrify`, or null while
	 * unchosen. `Hero.armorAbility`, the same field `ClassArmor.execute()` reads. */
	armorAbility: string | null = null;
	/** `ClassArmor.charge`: 0-100, regrown per hero turn by `ClassArmor.Charger`. Java keeps this
	 * on the class-armor *item* (`ClassArmor.upgrade()` turns the worn armor into one and starts it
	 * at 50); this port has no separate class-armor item type, so the charge lives on the hero and
	 * is spent by whichever real armor is worn, which is the only armor a crown can be applied to. */
	armorCharge = 0;
	/** `AscendedForm.AscendBuff` (tag `v3.3.8`): a separate ShieldBuff pool of 30
	 * lasting 10 actor turns. It is not `heroBarrier`: Java's ShieldBuff does not
	 * receive Barrier's proportional decay, and merging it would silently make the
	 * Cleric's armor ability weaker every turn. */
	ascendedBarrier = new Actors.Barrier();
	ascendedTurns = 0; ascendedSpellCasts = 0; ascendedFlashCasts = 0;
	/** Selected Trinity form and its remaining window. Item-specific effects are not yet dispatched. */
	trinityForm: 'body' | 'mind' | 'spirit' | null = null;
	trinityTurns = 0;
	/** Java Trinity.BodyFormBuff's stored enchantment/glyph, represented by this port's affix id. */
	trinityBodyAffix: string | null = null;
	/** `HeroicLeap.DoubleJumpTracker`'s remaining turns: Java's `Buff.affect(hero,
	 *  DoubleJumpTracker.class, 3)` is a three-turn `FlavourBuff`, and it is what `chargeUse()`
	 *  discounts against. A plain latch would keep the discount forever - a ranked warrior would
	 *  pay 17.4 instead of 35 charge on every leap after the first, across saves. */
	doubleJumpTurns = 0;
	/** `DeathMark.DoubleMarkTracker`'s presence: true while the hero's next Death Mark is the
	 *  discounted one (`DeathMark.chargeUse()`'s `0.707^points`, 30/50/65/75% off at rank 1-4). */
	doubleMarkArmed = false;
	/**
	 * `Talent.SpiritBladesTracker`'s presence: true for the one attack that consumes it. Java arms
	 * it with `Buff.affect(hero, SpiritBladesTracker.class, 0f)` immediately before a Spectral Blades
	 * throw, and `Weapon.damageRoll()` reads it for the rank-4 `multi += 0.1f` while
	 * `Talent.onAttackProc` consumes the proc chance. Deliberately not persisted with the run: Java's
	 * tracker is a zero-duration buff, so it cannot outlive the attack it was armed for, and nothing
	 * can save in between.
	 */
	spiritBladesArmed = false;
	/** `NaturesPower.naturesPowerTracker`'s remaining turns and its leftover extensions. */
	naturesPowerTurns = 0;
	naturesPowerExtensions = 0;
	/**
	 * `WarpBeacon.WarpBeaconTracker`'s `pos`/`depth`/`branch`, saved with the run (`revivePersists`
	 * in Java, so it survives death too). Java's `branch` is the dungeon's side-branch index; this
	 * port has exactly one, the Blacksmith's mine, so it is `miningBranchActive` as 0/1.
	 */
	warpBeacon: { x: number; y: number; depth: number; branch: number } | null = null;
	/**
	 * `Endure.EndureTracker`'s four fields, held on the scene rather than in the buff map because
	 * this port's buff table is a fixed MWL id list and the tracker's real payload is three numbers
	 * (a boolean `enduring`, the banked `damageBonus`, and `hitsLeft`) plus its flavour countdown.
	 * `endureTurns` is the buff's remaining turns, `endureEnduring` its `enduring` flag, and
	 * `endureBanked`/`endureHits` the stored counter-attack and its remaining strikes.
	 */
	endureTurns = 0;
	endureEnduring = false;
	endureBanked = 0;
	endureHits = 0;
	/** Weapon augment choice: SPEED/DAMAGE/NONE. Applied once per weapon at upgrade time. */
	weaponAugment: 'speed' | 'damage' | 'none' | null = null;
	/** Kinetic's conserved damage (`ConservedDamage.preservedDamage`) - a float: it decays
	 * 2.5%/turn (min 0.1) and reads back with `ceil`, so no integer rounding here. */
	kineticStored = 0;
	/**
	 * `ElementalStrike.ElementalStrikeFurrowCounter`: counted Blooming-strike uses toward the
	 * 40-use furrow threshold (Java's `revivePersists` counter, saved with the run).
	 */
	elementalFurrow = 0;
	/** `Kinetic.KineticTracker`: attached by every Kinetic (or Unstable-delegated-to-Kinetic)
	 * proc, even at zero conserved - drives the kill-overkill store, then clears per swing. */
	kineticTrackerHit = false;
	/** The conserved bonus added by this swing's proc (the tracker's `conservedDamage`),
	 * subtracted back out of the overkill so only the true excess is stored. */
	kineticConservedAdded = 0;
	/** This swing's Unstable delegation for `heroOnHit`'s post-damage branches (null unless
	 * the hero's weapon is Unstable) - both halves of a swing resolve the same enchant. */
	unstableDelegated: string | null = null;
	/** Swiftthistle's TimeBubble: hero actions advance while automatic actors are frozen. */
	timeBubbleTurns = 0;
	timeBubblePresses = new Set<number>();
	/** `Buff.mnemonicExtended`: which of the hero's own current buffs `MnemonicPrayer`
	 * has already extended once - cleared per id as soon as that buff is no longer on
	 * the hero (Java's flag lives on the buff instance itself, so it vanishes with it). */
	mnemonicExtended: BuffId[] = [];
	/** Timekeeper's Hourglass freeze state; unlike Swiftthistle's bubble it consumes charges. */
	hourglassFreeze = false;
	hourglassTurnsToCost = mwlItemEffectValue('hourglass', 'turnsToCost');
	/** Prevent Viscosity from recursively deferring its own scheduled damage tick. */
	applyingDeferredDamage = false;
	/** Java Barrier/BrokenSeal-style shielding, consumed before HP and saved with the run. */
	heroBarrier = new Actors.Barrier();
	/** `BrokenSeal.WarriorShield` (`items/BrokenSeal.java`, tag `v3.3.8`): a persistent shield the
	 * Warrior's starting armor carries, regenerating `1/30` per hero turn (while regen is on) up to
	 * `armorTier + armorLevel + pointsInTalent(IRON_WILL)` - unlike `heroBarrier` above, this pool
	 * never decays on its own, only regenerates and drains on hits, so it needs its own `Barrier`
	 * instance rather than sharing Barrier's proportional-decay pool. Java affixes the seal to a
	 * specific `Armor` instance and lets the player detach/re-affix it to a different piece
	 * (`Armor.AC_DETACH`, `BrokenSeal.AC_AFFIX`) with a `RUNIC_TRANSFERENCE`-gated glyph transfer;
	 * this port tracks whether the *currently equipped* armor is sealed (`armorSealed`) and
	 * implements both directions of that pair: `detachSeal` returns the seal to the bag (reached by
	 * tapping the equipped armor, which is otherwise a no-op) and `useBrokenSeal` affixes a carried
	 * one. Clearing on any later `equipArmor` swap is still this port's own simplification, and
	 * Runic Transference's glyph-transfer half remains unported (that talent is unimplemented). */
	sealBarrier = new Actors.Barrier();
	armorSealed = false;
	sealPartialGain = 0;
	/** `WandOfLivingEarth.RockArmor`: stored rock armor and the wand level that set its cap. */
	livingEarthArmor = 0;
	/** `Earthroot.Armor` (`plants/Earthroot.java`, tag `v3.3.8`): a block *pool* of `level` points
	 * that absorbs `min(damage, (scalingDepth + 5)/2)` per hit and ends when it is exhausted or its
	 * owner has moved - `act()` and `absorb()` both compare the character's position against the
	 * `pos` stored when the level was set. Shared by the Earthroot plant (level = the char's max
	 * HP) and the Entanglement armor glyph (its own smaller level), exactly as Java shares one buff
	 * between them. */
	earthrootArmor: { level: number; pos: number } | null = null;
	livingEarthWandLevel = 0;
	/** `WandOfRegrowth`'s persistent degradation counters, saved with the wand's run state. */
	regrowthTotalChargesUsed = 0;
	regrowthChargesOverLimit = 0;
	/** Barrier.partialLostShield (`actors/buffs/Barrier.java`): fractional decay accumulator. */
	barrierPartialLoss = 0;
	/** Blocking.BlockBuff's own real shield (`items/weapon/enchantments/Blocking.java`): a separate
	 * Java `ShieldBuff` from Barrier, so it gets its own pool here too, drained before Barrier's in
	 * `absorbHeroDamage` (see that method's own 2026-09-14 correction: real `ShieldBuff` has no
	 * priority field at all, this port's fixed order is a stand-in for Java's unspecified
	 * attachment-order draining, not a reproduction of a real one). `setShield()` keeps the higher of the
	 * old/new value (never additive) and always resets the fixed 5-turn cliff-edge expiry
	 * (`BlockBuff.act()`: `left -= 1; left<=0 -> detach()`); the timer here is `blockingTurnsLeft`.
	 * Deliberate simplifications: the `left` decrement is a flat 1/turn - real Java scales both
	 * this and Barrier's proportional decay by `HoldFast.buffDecayFactor()`, but this port has no
	 * HoldFast buff (a Sec 6 talent gap); and a broken shield grants no ProvokedAngerTracker
	 * (same talent gap). */
	blockingBarrier = new Actors.Barrier();
	blockingTurnsLeft = 0;
	stealthTalentTicks = 0;
	/** CloakOfShadows' fractional passive recharge and four-turn active cost timer. */
	cloakChargeProgress = 0;
	cloakStealthTurnsToCost = 0;
	/** `Talent.NatureBerriesDropped`: a whole-run counter capping Nature's Bounty's real berry
	 * drops at `2+2*rank` total, never reset mid-run (`revivePersists = true` in Java). */
	natureBerriesDropped = 0; berryCounter = 0;
	/** `TalismanOfForesight`'s `CharAwareness`/`HeapAwareness` marks: turns remaining of "the hero
	 * knows this is there", consulted by the sprite-visibility gates so a scried creature or heap
	 * keeps rendering outside his field of view. Java attaches these as hero buffs carrying the
	 * char's own id or the heap's position; this port's creatures have no per-creature id to key a
	 * saved buff on, so they live as live maps here (and, unlike Java's buffs, do not survive a
	 * save/load - recorded in `PORT_COVERAGE.md`). */
	awareCreatures = new Map<Creature, number>();
	/** The Dried Rose's live `GhostHero`, and whether this run has summoned one before (Java's
	 *  `firstSummon`, which picks the arrival line). Java re-finds its ghost by actor id after a
	 *  save; this port's reference does not survive one, so a reload leaves the rose thinking it
	 *  has no ghost until it is charged and summoned again - see `PORT_COVERAGE.md`. */
	roseGhost: Creature | null = null;
	roseFirstSummon = false;
	/** `ArtifactRecharge`'s remaining turns (Java's `left`). Modelled as a scene timer rather than a
	 *  buff id - this port has no buff entry or icon for it, and every other artifact timer here
	 *  (cloak stealth, hourglass freeze, beacon send) is already a plain field. Java's own `act()`
	 *  charges while `left >= 0` and then detaches at -1, which is this countdown's shape. */
	artifactRechargeTurns = 0;
	awareHeapCells = new Map<number, number>();
	/** `Burning.burnIncrement` (tag `v3.3.8`): item-burn progress resets after a successful roll. */
	burningIncrement = 0;
	/** `StoneOfIntuition.IntuitionUseTracker`: alternating free/paid intuition uses (first
	 * guess only arms the tracker and keeps the stone, the next guess consumes a stone and
	 * clears it). A plain run flag rather than a buff-map entry, since numeric buffs tick
	 * down and this one must persist until spent (`revivePersists` in Java). */
	intuitionTracker = false;
	/** `SuckerPunchTracker`: one surprise bonus per enemy, until that enemy dies. */
	suckerPunchTargets = new Set<string>();
	wandBonusDamage = 0;
	physicalBonusDamage = 0;
	physicalBonusAttacks = 0;
	patientStrikeReady = false;
	/** `Talent.HOLD_FAST`'s `HoldFast.pos`: the cell the hero was standing on when they last
	 * waited, granting `NormalIntRange(0, 2*points)` bonus armor while they stay put -
	 * `HoldFast.act()` detaches it the instant `target.pos` no longer matches, which this port
	 * models by simply comparing against the hero's *current* position rather than tracking a
	 * live buff object; the one gap this leaves is a hero who waits, walks away, then walks
	 * back onto the exact same cell without waiting again - Java's buff would already have
	 * detached, this port's check re-lights it. Null while inactive (never waited, or moved). */
	holdFastX: number | null = null;
	holdFastY: number | null = null;
	/** `Talent.PreciseAssaultTracker`: armed by `armPreciseAssault()`, consumed by the next
	 * normal attack's accuracy roll. Simplified to a plain flag rather than Java's own
	 * `hero.cooldown()+4f`-turn expiry (a Duelist's next attack is almost always well inside
	 * that window regardless), matching this port's existing `patientStrikeReady` precedent. */
	preciseAssaultReady = false;
	healingEvasionTurns = 0;
	/** Sungrass' Java Health buff: healing is gradual and ends when the hero moves. */
	sungrassHealing = 0;
	sungrassPartial = 0;
	/** `Healing` buff's `healingLeft` (`PotionOfHealing.heal()`): HP still owed by a HoT heal,
	 * with `setHeal`'s property-wise-maximum companions (`percentHealPerTick`,
	 * `flatHealPerTick`): the potion brings 0.25/0, a Warden sungrass brings 0/1, and each
	 * survives the other. All three persist through save/load. */
	healingLeft = 0;
	healingPercent = 0;
	healingFlat = 0;
	sungrassPos = -1;
	deathlessFuryUsed = false;
	freeTurnNext = false;
	followupTarget: Creature | null = null;
	followupDamage = 0;
	/** `Talent.DeadlyFollowupTracker`: marked by a thrown hit, consumed by the next melee hit
	 * on the *same* target for `round(dmg * (1 + 0.08*points))`. Java also excludes
	 * `SpiritBow.SpiritArrow` throws from marking it - structurally unreachable here, since
	 * the Duelist (the only class with this talent) has no SpiritBow. */
	deadlyFollowupTarget: Creature | null = null;
	projectileMomentumReady = false;
	/** worn ring {id, level} or null; ring modifiers live on heroStats under source 'ring' */
	equippedRing: EquippedRing | null = null;
	/**
	 * `Talent.EMPOWERING_SCROLLS`: remaining wand zaps that read +3 levels, armed by reading
	 * a scroll (Mage, 1/2/3 charges by rank) and consumed one per zap action. Persisted.
	 */
	empoweredZaps = 0;
	/**
	 * `Talent.ENHANCED_RINGS`: remaining turns the worn ring reads one upgrade level higher,
	 * armed by using an artifact (Rogue, 3/6/9 turns by rank). Ticked on the hero clock,
	 * persisted. The status-pane icon Java shows for the buff stays unported (presentation).
	 */
	enhancedRingsTurns = 0;
	/**
	 * `Talent.SEER_SHOT`: cooldown before the next ground-reveal (flat 20 turns), plus the
	 * revealed cells with their own remaining vision turns. Ticked on the hero clock,
	 * persisted per run (cells are floor-indexed, so they clear on descent like the floor).
	 */
	seerShotCooldown = 0;
	seerCells = new Map<number, number>();
	/**
	 * The extra max HP currently granted by `RingOfMight.HTMultiplier()` (real Java:
	 * x1.035^lvl on max HP, alongside the already-ported flat +lvl STR). `equipRing` is the
	 * only place this changes, so it's tracked as an absolute HP delta rather than folded
	 * into `syncHeroFromStats` (which runs many times per turn from unrelated buff/evasion
	 * paths) - recomputing there on every call would either double-apply or need its own
	 * change-detection, so the delta lives here instead, applied once per actual ring swap.
	 */
	ringHtBonus = 0;
	/** fire on the ground this floor (`mwg` core Blob; floor-scoped, not saved) */
	fire!: Blob;
	/** Java Rotberry ToxicGas and Icecap Freezing blobs, persisted with the floor. */
	plantGas!: Blob;
	plantFreeze!: Blob;
	/** ToxicGas.java: both `PotionOfToxicGas.shatter()` and `ToxicTrap.activate()` seed this
	 * same blob class in real Java - `1 + scalingDepth()/5` direct damage/turn, no buff involved. */
	toxicGas!: Blob;
	/** `ToxicGasRoom.ToxicGasSeed` sources, kept separate because Java's vent blob does not
	 * diffuse or decay: each inactive vent keeps emitting its current amount conditionally. */
	toxicGasVents = new Map<number, number>();
	/** ParalyticGas.java: `PotionOfParalyticGas.shatter()` seeds this - prolongs `paralysis` each turn. */
	paralyticGas!: Blob;
	/** Java `StenchGas` blob; distinct from `ToxicGas` despite both being emitted by curses/items. */
	stenchGas!: Blob;
	/** Java `CorrosiveGas.strength`; the current Ooze stand-in cannot carry intensity. */
	corrosiveGas!: Blob;
	corrosiveGasStrength = 0;
	/** Java `ConfusionGas` blob; its Vertigo effect uses the port's daze stand-in. */
	confusionGas!: Blob;
	/** Spinner web volume; persisted with the floor while the actor's web cooldown remains on the
	 * creature. The current port only needs the field for save compatibility. */
	web!: Blob;
	/** `Electricity` terrain (shocking/storm traps, tag `v3.3.8`) - seeded by the trap branches, applied by `environmentalBlobs`. */
	electricity!: Blob;
	/** `SmokeScreen` (`actors/blobs/SmokeScreen.java`, tag `v3.3.8`) - seeded by smoke-bomb
	 * blasts; it spreads like a base blob and its only game effect is sight-blocking
	 * (`Level.updateFieldOfView`), applied by `pruneSmokeFromSight`. Like every gas here
	 * it advances through the shared `evolveJavaBlob` diffusion. */
	smokeScreen!: Blob;
	/** `Inferno`/`Blizzard` (`actors/blobs/Inferno.java`/`Blizzard.java`, tag `v3.3.8`) -
	 * seeded by the matching brews; their `evolve()` halves run in `environmentalBlobs`
	 * (burning reignite + terrain destruction + adjacent fire for inferno, double chill
	 * for blizzard, mutual annihilation either way). */
	inferno!: Blob;
	blizzard!: Blob;
	/** MagicalFireRoom.EternalFire (`levels/rooms/special/MagicalFireRoom.java`): a permanent,
	 * non-spreading, non-decaying fire wall. Unlike every other blob here it is never
	 * `spread()`ed - seeded once at 1 per wall cell (Java's own `Blob.seed(cell, 1,
	 * EternalFire.class)` amount), it simply stays until something clears it. Ignites chars
	 * standing on it (`Burning.reignite(4)`); blocks passage for hero and monsters alike
	 * (`onUpdateCellFlags`: `passable = false` while volume > 0); any partial clear
	 * (frost/blizzard/water touching any part) clears the whole floor's wall (`clear()` ->
	 * `fullyClear()`). Deliberate gaps, all narrower than the old "no primitive" claim: no
	 * spread of regular Fire onto flammable terrain (no flammable map exists - same gap as
	 * StoneOfBlast's unported terrain half), no heap burning (no heap-burn primitive), no
	 * water/blizzard clearing (no water-on-fire-cell or Blizzard systems touch blobs), and no
	 * visuals (consistent with every other logic-only blob here). */
	eternalFire!: Blob;
	/** SacrificialFire blob and its generated prize, adopted from SacrificeRoom. */
	sacrificialFire!: Blob;
	/** Wandmaker type-2 `RitualSiteRoom` state (`CeremonialCandle.ritualPos` + which of its 4
	 * cardinal neighbours holds a placed candle, N/E/S/W order). Captured from levelgen at
	 * the live bridge and persisted per floor, since the module-level paint state goes stale
	 * on revisits (floors come from the run cache then) and across mining-branch floors. */
	ritualPos = -1;
	ritualCandles: boolean[] = [false, false, false, false];
	sacrificialFireCharge = 0;
	sacrificialFireCell = -1;
	sacrificialFirePrize: GroundItem['item'] | undefined;
	/** loot wands: fireblast (cone) and lightning (chain), no recharge (found wands only) */
	fireCharges = new Actors.Charges({ max: 3, current: 0, regenRate: 9999 });
	boltCharges = new Actors.Charges({ max: 3, current: 0, regenRate: 9999 });
	/** Ghoul lifelink: downs this floor (first down revives, later ones stick) */
	ghoulsDowned = 0;
	/** the King's live summoned servants, for LifeLink subjects and death cleanup */
	kingAdds = new Set<Creature>();
	/** Live LifeLink subjects of the King (damage to them splits onto him - see `attack()`). */
	kingLinkedAdds = new Set<Creature>();
	/** CavesBossLevel's pylon gate/energy stand-in; the fixed floor supplies these cells. */
	cavesBossSealed = false;
	/** `SewerBossLevel.seal()`: the entrance drowns once Goo wakes. Run-scoped like the
	 * other boss seals (never reset per floor): depth-guarded everywhere, re-applied to
	 * regenerated paint on load - see `checkSewerBossSeal`. */
	sewerBossSealed = false;
	/** `HallsBossLevel.seal()`: the entrance is spent and Yog rises on approach, not entry.
	 * Run-scoped like favor (never reset per floor): depth-guarded everywhere it is read,
	 * and re-applied to regenerated paint on load - see `checkHallsBossSeal`. */
	hallsBossSealed = false;
	/** `CityBossLevel.seal()`: the arena bottom door locks once the hero walks past it
	 * (`ch.pos < bottomDoor`), re-applied to regenerated paint on load. Run-scoped like
	 * the other boss seals - see `checkCityBossSeal`. */
	cityBossSealed = false;
	/** Every boss floor's `unseal()`, spent at that boss's death: the instant-descent
	 * `depth++`/`enterLevel()` the port used to run is gone, and the floor gains a real
	 * walkable exit (`hasStairs` + `stairs` at Java's own exit cell) instead. Run-scoped
	 * and persisted: on reload the paint writes are re-applied in `enterLevel` (the live
	 * terrain itself survives via the floor capture) and the stairs half is repaired
	 * after `restoreFloor` - see `repairBossUnsealStairs`. */
	bossUnsealedDepths = new Set<number>();
	/** `PrisonBossLevel.occupyCell()`'s real `case START:` trigger: Tengu does not exist as a
	 * live actor at all until the hero's own move lands past the locked door, inside
	 * `tenguCell` (`y > tenguCell.top`, i.e. row 23 on this port's 32x32 layout) - not on floor
	 * entry like this port previously spawned every boss. Run-scoped like the other boss
	 * seals (never reset per floor): depth-guarded everywhere it is read - see
	 * `checkTenguFightStart()`. Needs no regenerated-paint repair on load (unlike the three
	 * above): the locked door is baked into the base start paint unconditionally, so nothing
	 * about the live terrain differs before/after this flag flips - only whether Tengu himself
	 * has been spawned yet. */
	tenguFightStarted = false;
	/** `SPDSettings.interfaceSize()`: 0 small, 1 large. Persisted per run. */
	interfaceSize: 0 | 1 = 0;
	/**
	 * Java's four `QuickslotButton`s: assigned item id + instance per slot, persisted per run.
	 * Assignment is automatic (the most recently used consumable fills its family's slot -
	 * potions/scrolls/food/bombs), since this port has no drag-to-slot gesture; tapping a
	 * slot uses the assigned item through the ordinary use path.
	 */
	quickslots: ({ id: string; instanceId?: string } | null)[] = [null, null, null, null];
	/**
	 * `MeleeWeapon.Charger` T-key ability state (`src/items/weaponAbilities.ts`): whole charges
	 * plus the fractional `partialCharge`, starting at Java's own 2 (the cap is the hero's
	 * level via `weaponChargeCap`, accruing over time per `Charger.act`), the flail spin
	 * count/turns, the free re-cleave window, guard/sword-dance/defensive-stance turns,
	 * the armed charged shot, the pending next-attack modifiers (force hit, damage
	 * multiplier for harvest's zeroing, flat boost, harvest amount, runic proc bonus,
	 * daze/knockback), and the hero action clock behind combo strike's 5-turn window.
	 */
	weaponCharge = 2;
	weaponPartialCharge = 0;
	spinSpins = 0;
	spinTurns = 0;
	cleaveFreeTurns = 0;
	guardTurns = 0;
	swordDanceTurns = 0;
	defensiveStanceTurns = 0;
	chargedShotArmed = false;
	abilityForceHit = false;
	abilityDamageMult = 1;
	abilityDamageBoostNext = 0;
	abilityHarvestNext = 0;
	abilityRunicBonus = 0;
	/** `DirectedPowerTracker.enchBoost`: the ElementalStrike tracker's pending proc bonus. */
	abilityDirectedBonus = 0;
	abilityDazeNext = false;
	abilityKnockbackNext = false;
	lastAbilityAttack: string | null = null;
	/** `Talent.CombinedLethalityAbilityTracker`: the weapon the last weapon ability
	 * was used with (bag id + instance id - Java stores the weapon object and tests
	 * `tracker.weapon == this`, i.e. instance identity), and its remaining duration
	 * (Java's `hero.cooldown()`, one turn: `afterAbilityUsed` sets it, the execute tail
	 * in `Char.attack()` tests it and detaches it one-shot). Duration is 1 turn: the
	 * tracker is set after the ability's `spendHeroAction` tick, so it survives the
	 * end-of-turn tick and is active for the next turn's swing, then expires.
	 * Correction 2026-09-19: an earlier draft of this port kept a second
	 * `clTriggerTurns` countdown "armed by `proc()`" - no such buff exists in Java
	 * (`Talent.java` declares only `CombinedLethalityAbilityTracker`; `Char.java`
	 * 541-561 tests and detaches that same tracker inline in `attack()`), so the
	 * second field is deleted and the tail below is the whole mechanic. */
	clAbilityWeaponClass: string | null = null;
	clAbilityWeaponInstanceId: string | undefined = undefined;
	clAbilityTurns = 0;
	heroActionClock = 0;
	recentHitClocks: number[] = [];
	/**
	 * `Statistics.qualifiedForBossChallengeBadge` (tag `v3.3.8`): set true at each of the five
	 * boss fights' starts (`SewerBossLevel`/`PrisonBossLevel`/`CavesBossLevel`/`CityBossLevel`/
	 * `HallsBossLevel` seal/progress), cleared when the hero deals boss damage that is not a
	 * plain weapon hit (unarmed without `RingOfForce`, any `Wand` except `WandOfLightning`, a
	 * `ClericSpell` - plus bombs/armor abilities here, which are equally non-weapon sources),
	 * read at that boss's death for `BOSS_CHALLENGE_1..5`. Run-scoped, persisted.
	 */
	qualifiedForBossChallenge = false;
	/** `Level.entrance()`: the cell the hero arrived on. See `CavesBossLevel.seal()`. */
	entranceCell: Step | null = null;
	/** PylonEnergy cells, persisted with the Caves boss floor. */
	cavesBossEnergyCells = new Set<number>();
	/** In-flight DM300 rockfall volleys on this floor (cells + turns to impact). */
	fallingRocks: { cells: { x: number; y: number }[]; turns: number }[] = [];
	readonly cavesBossPylons = [
		{ x: 4, y: 13 }, { x: 28, y: 13 }, { x: 4, y: 37 }, { x: 28, y: 37 },
	] as const;

	gameLog!: GameLog;
	statusPane!: StatusPane;
	dungeonHud!: DungeonHud;
	infoPanel!: InfoWindow;
	compass!: Compass;
	hintLabel!: Label;
	/**
	 * The in-game window stack: `WndGame` and the windows it opens. Kept separate from the HUD
	 * containers so a window always draws over them, and so `WindowStack`'s own `Input.onAction`
	 * listener can swallow `cancel` for whatever is open - the same arrangement the title screen
	 * uses. Every Java `Window` carries a full-screen blocker that dismisses it on a click
	 * outside its chrome and keeps clicks off the map and the toolbar; MWG 0.8.0 ships that
	 * layer natively (`Window({ blocker: true })`, item 324), so each window below opts in at
	 * its own construction site and this is a plain `WindowStack` - the port used to carry its
	 * own `WindowStack` subclass for this because the framework had no such layer. Its first
	 * inhabitant is the
	 * menu; the hand-rolled talent/item-picker panels remain their own thing for now (see
	 * `PORT_COVERAGE.md`).
	 */
	gameWindows = new WindowStack();
	/** `PixelScene.defaultZoom` for windows: the title scene's `menuScale`. Windows are authored at native 6-9 px
	 * text, so an unscaled stack drew them at 1x - unreadable next to the 2x HUD art. */
	windowZoom = windowBaseZoom(Game.current.width, Game.current.height);
	actionBar!: SpdToolbar;
	inventoryPanel!: InventoryWindow;
	inventoryOpen = false;
	journalWindow?: Window;
	journalOpen = false;
	talentPanel!: Container;
	talentWindow?: Window;
	buffInfoOpen?: Window;
	talentOpen = false;
	subclassChoiceOpen = false;
	armorChoiceOpen = false;
	/** StoneOfAugmentation.onItemSelected(): reuses the same choice-panel mechanism as the
	 * level-up armor-ability/subclass windows, but item-use-triggered instead of level-triggered. */
	augmentChoiceOpen = false;
	/** Generic item-picker panel (`windows/WndBag.ItemSelector`): a title, one row per eligible
	 * bag entry, and a cancel row. First consumer is ScrollOfTransmutation (its real
	 * `InventoryScroll.itemSelector`); built generic so the other picker-blocked uses
	 * (Stones of Enchantment/Intuition/DetectMagic, shop buy/sell, alchemy) can reuse the same
	 * panel instead of growing their own. Transient UI state, never saved - like every other
	 * choice flag here. */
	itemPickerOpen = false;
	itemPickerTitle = '';
	/** `WndInfoItem`'s body: the trade window is Java's `WndTradeItem`, which extends it. */
	itemPickerBody: string | undefined;
	itemPickerEntries: { id: string; instanceId?: string; identified?: boolean; quantity: number; note?: string }[] = [];
	itemPickerOnPick: ((entry: { id: string; instanceId?: string }) => void) | null = null;
	itemPickerWindow?: Window;

	/** An active player aim, backed by MWG 0.7.7's renderer-free `Roguelike.TargetingController`:
	 * a cell cursor, range + line-of-sight legality, a shape preview and a cells-only
	 * confirm/cancel. This is the port's first real map-click cell-targeting - it replaces
	 * `nearestVisibleEnemy`'s auto-target for the cell-aimed runestones (Fear/DeepSleep/Shock/
	 * Blast/Blink/Clairvoyance), and is now also used by the thrown-weapon path.
	 * Transient UI state, never saved, like every other choice flag here. */
	aiming: {
		controller: Roguelike.TargetingController;
		onConfirm: (target: { x: number; y: number }, cells: readonly { x: number; y: number }[]) => void;
	} | null = null;
	/** Target latched by the thrown-weapon cell picker. The confirmed callback re-enters
	 * `useSpecial`, keeping ammo, warning, hit, and durability resolution in one path. */
	specialTarget: Creature | null = null;
	/** One-shot Nature's-Power bow-speed divisor, set by `useSpecial`'s bow branch and
	 * consumed by the `spendTurn` port above. Transient aim state, never persisted. */
	pendingBowNpDivisor: number | null = null;
	/** Latched weapon-ability strike target: `beginAiming` confirms it and re-enters `useWeaponAbility`, exactly like `specialTarget` above. Transient aim state, never persisted. */
	abilityAimTarget: Creature | null = null;
	/** Cell latched by the bomb's map picker; cleared before the item-domain resolver runs. */
	bombTarget: Step | null = null;
	/** Cell latched by the honeypot's map picker; cleared before the shatter runs. */
	honeypotTarget: Step | null = null;
	/** Cell latched by a brew's map picker; cleared before the shatter runs. */
	brewTarget: Step | null = null;
	/** The aim cursor highlight, drawn in world space so it tracks cells under the camera. */
	aimOverlay: Graphics | null = null;
	/** `NewbornFireElemental`'s `TargetedCell` telegraph: the red 3x3 its fireball will cover. */
	targetedCells: Graphics | null = null;
	/** Live Tengu fire cones, keyed by creature. MWG 0.7.7's `MultiTurnBeam` owns the ring-per-turn
	 * traversal; the creature's own `tenguFire` carries that beam's `toJSON()` for saves, so this
	 * map is rebuilt from it on load and never serialized itself. */
	tenguBeams = new Map<Creature, Roguelike.MultiTurnBeam>();
	/** `Preparation`'s own state: the turns the hero has spent invisible (`Preparation.java`'s
	 * `turnsInvis`), which is what selects its `AttackLevel`. Java counts it in the buff's own
	 * `act()` while `target.invisible > 0` and detaches the buff the moment it is not, so the
	 * counter resets whenever invisibility ends - see `trackPreparation`/`syncPreparation`. */
	prepInvisibleTurns = 0;
	/** `Talent.BountyHunterTracker`, armed by a *prepared* attack (`Char.attack()` 407-409 does
	 * `Buff.affect(hero, BountyHunterTracker.class, 0.0f)` only inside its `prep != null` branch).
	 * Java's buff lives for the rest of that turn - it has a zero duration and detaches on its own
	 * act - so this clears in the hero-turn pipeline beside the Preparation counter. */
	bountyTrackerArmed = false;
	victoryPanel!: Container;
	/**
	 * The live `Banner` (`ui/Banner.java`): BOSS_SLAIN across the boss transition, GAME_OVER over
	 * the defeat panel. Stage-level, so it survives `enterLevel()` like the rest of the HUD;
	 * `showBanner` centers it, `update()` drives it until its FADE_OUT kills it.
	 */
	banner: Banner | null = null;
	/** While a GAME_OVER banner lives, the defeat panel tracks its alpha squared - Java's two
	 * buttons do `alpha(pow(gameOver.am, 2))`, and the panel is this port's stand-in for them. */
	bannerPanelFollow = false;
	bossChrome!: Container;
	bossHealthBar!: Bar;
	bossNameLabel!: Label;
	/** the boss `bossHealthBar` currently tracks, read by its click-to-inspect handler */
	currentBoss: Creature | null = null;
	/** `BossHealthBar.bleed`: true once the tracked boss drops under 25% HP */
	bossBleeding = false;
	/** `BossHealthBar.bleed(true)` latched at a phase transition (King P3, Yog P5 - see
	 * `kingPhaseRules` and `kill`'s fist branch): Java latches the flag rather than deriving
	 * it from the HP fraction, so a shielded King or a fresh P5 Yog bleeds immediately.
	 * Reset whenever the tracked boss changes or dies. */
	bossBleedLatched = false;
	badgeBanner!: BadgeBannerLayer;
	/** Item selected from the inventory panel; consumed by the next matching action. */
	requestedItemId: string | null = null;
	requestedItemInstanceId: string | undefined;
	/**
	 * Floating damage/heal/status text. It lives in world space under the camera so it tracks
	 * the map, and counter-scales by the camera's zoom so the text itself draws at screen
	 * resolution - `FloatingText`'s own `zoom(1/PixelScene.defaultZoom)`.
	 */
	/**
	 * Damage numbers and status text: `mwg/ui`'s `FloatingTextStack`, one `push` per number and
	 * one `update(dt)` for all of them, with pop-ups on one target stacking apart instead of
	 * overprinting. That is Java's own `FloatingText.push` keyed stacking (`CharSprite` keys by
	 * the sprite), which this port used to approximate by proximity because `mwg`'s
	 * `FloatingText` had neither the curve nor the stacking until 0.7.4. The numbers are
	 * `effects/FloatingText.java`'s: `LIFESPAN = 1f` second over `DISTANCE = DungeonTilemap.SIZE`
	 * of rise, alpha held at 1 for the first half of the life and falling linearly after - the
	 * stack's `hold: 0.5`.
	 *
	 * The label is rasterised at the full 21px and shrunk by `floaterTextScale` for this
	 * world-space layer, rather than rasterised small and scaled up, because Pixi rasterises text
	 * once at its style size and scaling a small raster up is what looks blurry. That scale is
	 * passed *into* `push` (`FloatingTextPush.scale`): 0.7.7 moved it there and applies it before
	 * measuring, because a `FloatingText`'s height includes its own scale - the stacked lines of a
	 * pop-up scaled after the push were spaced by a size they were never drawn at. `size` and
	 * `rise` stay divided by that scale: both are expressed in the pop-up's own pre-scale space
	 * (the rise moves `FloatingText`'s inner `rising` container, inside the scaled pop-up), so the
	 * text draws at `floaterFontSize` and rises exactly one tile.
	 */
	floaters = new FloatingTextStack();

	/** One-shot particle bursts (currently only the curse infusion's shadow motes), ticked and
	 * destroyed by `updateEffectBursts` - the same self-removing-list shape `projectiles` uses. */
	effectBursts: LiveBurst[] = [];
	/** Pending `ScrollOfTeleportation.appear` alpha fades (`AlphaTweener(ch.sprite, 1,
	 * 0.4f)`): transient visual state like `effectBursts`, never persisted. */
	teleportFades: { sprite: TintedSprite; remaining: number; total: number }[] = [];
	/** Pending `Wound.hit`/`Surprise.hit` overlays: transient visual state like `effectBursts`, never persisted. */
	surpriseMarks: { sprite: TintedSprite; remaining: number; total: number; wound: boolean }[] = [];

	/** how much to shrink each pop-up, for a layer living in world space under a zoomed camera */
	readonly floaterTextScale = 1 / 3;

	/** the on-screen size the text ends up at, `PixelScene`'s status text */
	readonly floaterFontSize = 7;

	/**
	 * A stable id per target, so a pop-up stacks against the last one on the same creature.
	 * A `WeakMap` because a creature that leaves the level should not be kept alive by this.
	 */
	readonly floaterKeys = new WeakMap<Creature, number>();
	nextFloaterKey = 1;
	/** one health bar per damaged creature, `ui/CharHealthIndicator.java` */
	healthBars = new Map<Creature, Bar>();

	awaitingInput = false;
	gameOver = false;
	/** `Hero.travel()`-equivalent: a queued click-to-move destination, walked one step per turn
	 *  via the real pathfinder rather than the single-step move a click used to produce. */
	travelTarget: Step | null = null;
	/** HP at the moment travel began, so taking any damage along the way interrupts it. */
	travelStartHp = 0;
	/** The hovered route preview for click-to-travel; transient presentation only. */
	travelOverlay: Graphics | null = null;
	/** whether the current floor came from spdLevelGen/ rather than generateSpdDungeon - changes
	 *  what may be assumed about room order and about how much of a room rect is walkable */
	portedFloorActive = false;
	/** cells concealing a real SECRET_DOOR, so a search can name what it found */
	secretDoorCells = new Set<number>();
	crystalDoorCells = new Set<number>();
	/** the current ported floor's raw, untranslated `Terrain.java` grid (null off a ported
	 * depth) - kept around only so `examineTile` can tell an `EMPTY_DECO`/`BOOKSHELF` cell
	 * apart from plain floor/wall, a distinction `toGameTerrain`'s coarse mapping deliberately
	 * throws away for rendering (see `gameBridge.ts`'s own doc comment) */
	portedPaint: PaintLevel | null = null;
	/** `SewerLevel`/`PrisonLevel`'s `Sink`/`Torch` decorations at this floor's real `WALL_DECO`
	 * cells - null off a ported depth, or on any other region (neither exists there) */
	wallDecorations: WallDecorationLayer | null = null;
	/** MiningLevel.BorderDarken equivalent: the custom caves quest border overlay. */
	miningBorder: TileMap | null = null;
	branchQuestEntrance: TileMap | null = null;
	/** Halls' DemonSpawnerRoom.CustomFloor overlay, rebuilt from the live spawner state. */
	demonSpawnerFloor: TileMap | null = null;
	/** `LastLevel`'s three custom tilemaps (depth 26 only), rebuilt when the Amulet is taken. */
	vaultVisuals: TileMap | null = null;
	/** `CavesBossLevel`'s `customTiles` (`CityEntrance` + `ArenaVisuals`, depth 15 only), on the boss
	 *  floor's own atlas. The arena layer is a function of the live pylon/energy state, so it is
	 *  re-mapped by `refreshCavesBossArenaVisuals()` rather than drawn once. */
	cavesBossTiles: TileMap | null = null;
	/** The same floor's `customWalls` (`EntranceOverhang`), which Java draws on the other side of the
	 *  wall layer - see the layer blocks in `enterLevel`. */
	cavesBossWalls: TileMap | null = null;
	/** `HallsBossLevel`'s `CenterPieceVisuals` (depth 25 only): the art over Yog's arena, on the
	 *  `hallsSpecial` sheet. Java's `unseal()` swaps in a portal variant, which
	 *  `applyYogDeathUnseal()` re-maps live - see `hallsBossVisuals.ts`. */
	hallsBossCenter: TileMap | null = null;
	/** The same floor's `CenterPieceWalls`, drawn on the wall side, one row higher. */
	hallsBossCenterWalls: TileMap | null = null;
	/** `CityBossLevel`'s `CustomGroundVisuals` (depth 20 only): the exit-hall stairs, pillar
	 *  bases, skull piles, ground stitching and throne carpets, on the `cityBoss` sheet -
	 *  a `customTile`, so it goes under the actors with the rest of the floor art. */
	cityBossTiles: TileMap | null = null;
	/** The same floor's `CustomWallVisuals`: pillar tops, skull tops, the stairs' shadow
	 *  and the throne archway, drawn over the walls like the caves overhang. */
	cityBossWalls: TileMap | null = null;
	/** `RitualSiteRoom`'s `RitualMarker` (the Wandmaker's elemental-embers site), a 3x3 block over
	 *  the four ceremonial candles' own cell - built on whichever floor `ritualPos` was painted. */
	ritualMarker: TileMap | null = null;
	/** `HallsLevel.Stream`/`FireParticle` embers over this floor's real `WATER` cells - null off a
	 * ported Halls depth, or on any other region (no other region has this effect) */
	waterEmbers: WaterEmberLayer | null = null;
	wellRipples: WellRippleLayer | null = null;
	/** `InterlevelScene` overlay, held above the world/HUD while a floor transition fades. */
	interlevel: { root: Container; backdrop: TilingSprite; elapsed: number; duration: number; curtain: Graphics; message: Label } | null = null;

	override create(): void {
		this.heroClass = runState.pendingClass;
		// Hoisted ahead of buildInterface() (below): its refreshInventoryPanel() call reads
		// this.heroStats.base('gold') synchronously, before makeHero() - where this used to be
		// assigned - ever runs. Only def.accuracy is needed, which depends solely on heroClass
		// above, so this doesn't need anything else makeHero() sets up.
		this.heroStats = new Actors.StatBlock({ base: { accuracy: CLASSES[this.heroClass].accuracy, evasion: MWL_HERO_BASE_STATS.baseEvasion, gold: MWL_HERO_BASE_STATS.baseGold } });

		const canvas = document.createElement('canvas');
		canvas.width = 4;
		canvas.height = 4;
		const dotCtx = canvas.getContext('2d')!;
		dotCtx.fillStyle = '#ffffff';
		dotCtx.fillRect(0, 0, 4, 4);
		this.dotTexture = Texture.from(canvas);

		this.camera = new Camera({ zoom: zoomForOffset(zoomOffset()), deadzone: 0.25 });
		//`SPDSettings.zoom()`: a settings change mid-run re-zooms the live camera, so the
		//dungeon does not need a scene rebuild to honour it.
		this.onDestroy.add(onZoomChanged(() => this.applyZoom()));
		//`SPDSettings.brightness()`: a settings change mid-run re-renders fog live, same
		//as the zoom subscription above - `FogOfWar.refresh` already re-reads the level.
		this.onDestroy.add(onBrightnessChanged(() => this.refresh()));
		this.stage.addChild(this.camera.world);
		this.itemsSheet = SpriteSheet.fromTexture(runState.sprites.items, 16, 16);

		this.buildInterface();
		this.quests.define(SAD_GHOST_QUEST);
		this.quests.define(WANDMAKER_QUEST);
		this.quests.define(BLACKSMITH_QUEST);
		this.quests.define(IMP_QUEST);
		this.badges = loadBadges();
		const guide = this.guideProgress.load('guide');
		entranceRoomContext.guideIntroRead = guide?.state.introRead ?? false;
		entranceRoomContext.guideSearchingFound = guide?.state.searchingFound ?? false;
		//per-run appearance shuffle, seeded so the seed fully determines the mapping -
		//every kind is drawn now, inside the seed, so later lookups never touch the RNG
		const seedText = new URLSearchParams(window.location.search).get('seed');
		const requestedSeed = spdSeedValue(seedText);
		this.seededRun = Boolean(seedText?.trim());
		this.runSeedLong = requestedSeed ?? BigInt(Random.int(1, 1 << 30));
		this.runSeed = Number(this.runSeedLong % 4294967296n) >>> 0;
		this.runSeedLabel = seedText?.trim() || String(this.runSeed);
		//a new run: drop any cached ported floors so Dungeon.init()'s run-level resets
		//(SecretRoom's budget, the SpecialRoom queue, Generator's decks) run again from scratch
		resetPortedRun();
		Random.withSeed(this.runSeed, () => {
			this.appearances = new Actors.Appearances(APPEARANCE_TABLES);
			for (const [category, table] of Object.entries(APPEARANCE_TABLES)) {
				for (const kind of table.kinds) this.appearances.appearanceOf(category, kind);
			}
		});
		//Shelf stock is per-shop state (see `shopStockFor`), generated when that depth's keeper is
		//spawned - nothing to pre-fill at run start.
		this.hero = this.makeHero();
		this.characterEffects = new CharacterEffects(runState.sprites.uiIcons);
		this.ammo = CLASSES[this.heroClass].special.ammo ?? 0;
		this.ammoSourceClass = CLASSES[this.heroClass].special.sourceClass ?? '';
		this.missileLevel = 0;
		this.ammoDurability = MISSILE_MAX_DURABILITY;
		//The hero starts with a real stack of their class missile equipped (Java's starting
		//`belongings.weapon`), so it needs a set of its own - not the old fixed `1`.
		this.ammoSetId = this.newMissileSetId();
		this.missileThresholds = new Map();
		this.dustSpawnPower = 0;
		this.enterLevel();

		const def = CLASSES[this.heroClass];
		this.say(
			t('port.log.welcome', {
				region: t(REGION_KEYS[regionForDepth(this.depth)]),
				depth: this.depth,
				hero: t(def.nameKey),
				weapon: t(def.weaponKey),
			}),
			'highlight'
		);
		//A keyboard action means the player has taken manual control - cancel any queued
		//click-to-travel rather than let it silently resume after an unrelated keypress.
		//The windows are asked first (MWG 0.8.0's public `WindowStack.handleAction`, item 325):
		//the stack holds the keyboard while a window is open, so an open window consumes its
		//keys before the map ever sees them. The returned "consumed" flag still matters for one
		//key: a back key this scene used to open `WndGame` must not reach `WindowStack`'s own
		//listener for the same keystroke, or the window it just opened is closed again by the
		//keypress that opened it.
		const listener = (action: string) => {
			this.travelTarget = null;
			return this.gameWindows.handleAction(action) || this.onAction(action);
		};
		Input.onAction.add(listener);
		this.onDestroy.add(() => Input.onAction.remove(listener));
	}
















	/**
	 * `DungeonTileSheet.tileVariance`, which decides per cell whether a wall uses its second
	 * brick art, so a long wall does not read as one repeated tile.
	 *
	 * Java rolls `Random.Int(100)` per cell inside its own `pushGenerator(seedCurDepth())`
	 * (`GameScene.java`), so this consumes no part of the level-generation stream and is
	 * reproducible exactly from the per-depth seed this port already computes.
	 */
	tileVariance: Uint8Array = new Uint8Array(0);


	/** Preserve Java's visual terrain while applying the live door/grass state.
	 * Collision categories cannot distinguish bookshelves, statues or chasms.
	 */
	visualTerrainAt = (x: number, y: number): number => {
		if (!this.level.inside(x, y)) return -1;
		const kind = this.level.get(x, y);
		const raw = this.portedPaint?.map[this.level.index(x, y)];
		if (kind === DOOR) return 6;
		if (kind === DOOR_CLOSED) return this.doors.isLocked(x, y) ? (this.crystalDoorCells.has(this.level.index(x, y)) ? 31 : 10) : 5;
		//`DungeonTileSheet`'s `directFlatVisuals`/raised tables give `FURROWED_GRASS` its own frames
		//(151/155 are the two high-grass cuts, 152/156 the furrowed pair - see `foregroundGrassFrame`).
		//Both kinds collapse onto one game kind here, so the furrowed state has to come from the set
		//that already carries it (`furrowedGrass`, persisted with the floor): without this the two
		//furrowed frames were computed and never reachable.
		if (kind === HIGH_GRASS) return this.furrowedGrass.has(this.level.index(x, y)) ? 30 : 15;
		if (kind === GRASS) return 2;
		if (kind === WATER) return 29;
		return raw ?? (kind === WALL ? 4 : 1);
	};













































































	/**
	 * Data-driven potion-effect dispatch: was a 39-branch `if (id === ...) else if (...)`
	 * chain (one `else if` per real Java `Potion` subclass), now a `Record` lookup keyed by
	 * generated item id. Same behavior per id, same comments citing the real Java source per
	 * effect - restructured for O(1) dispatch and to read as a table of "id -> effect" rather
	 * than a cascade, not a behavior change. The registry now lives in `items/potionEffects.ts`;
	 * `potionPurity` (real Java's actual fallback for
	 * any potion with no more specific effect) and any genuinely unrecognized id both still
	 * route through `applyPotionPurity` from `quaffPotion`'s own `else` above - kept out of
	 * this map since "the id wasn't found" is exactly the case this map can't dispatch itself;
	 * `applyPotionEffect` is the scene-owned adapter used by `items/consumables.ts`.
	 */
	readonly potionEffects = createPotionEffects(this.potionEffectsContext());



















































































	
	




	
	


























	/** Whole-turn special actors that must run before target acquisition and the shared AI. */
	readonly monsterTurnHooks: Record<string, (monster: Creature) => void> = {
		golem: (monster) => {
			//Golem.act() decrements both teleport cooldowns before delegating to its AI,
			//including adjacent melee turns (Golem.java, tag v3.3.8).
			if (monster.golemTeleCooldown !== undefined) monster.golemTeleCooldown--;
			if (monster.golemSelfTeleCooldown !== undefined) monster.golemSelfTeleCooldown--;
		},
		dm200: (monster) => {
			//`DM200.act()` decrements `ventCooldown` on every turn, adjacent melee turns included
			//(`DM200.java`, tag `v3.3.8`). DM-201 inherits this hook through the same strategy shape.
			monster.ventCooldown = (monster.ventCooldown ?? 0) - 1;
		},
		dm201: (monster) => {
			monster.ventCooldown = (monster.ventCooldown ?? 0) - 1;
		},
		newbornElemental: (monster) => {
			//`Elemental.act()` decrements `rangedCooldown` on every hunting turn, including the
			// adjacent melee turns; a non-hunting elemental leaves it untouched.
			if (monster.seesHero) monster.rangedCooldown = (monster.rangedCooldown ?? 3) - 1;
		},
		ripperDemon: (monster) => {
			//`RipperDemon.act()`: `if (paralysed <= 0) leapCooldown--`, then the enemy-cell
			//tracking every other hook here skips - Java records `enemy.pos` (falling back to
			//the hero's cell with no enemy) on every act except the wandering-to-hunting
			//transition turn, so the pre-turn rotation below matches its steady state; the
			//single skipped transition turn is not reproduced (see `takeRipperLeapTrigger`).
			//The hook runs ahead of the paralysis gate below, hence the explicit check -
			//golem/DM200 decrement unconditionally because their Java does not gate.
			if (monster.buffs['paralysis'] === undefined && monster.buffs['frost'] === undefined) {
				monster.leapCooldown = (monster.leapCooldown ?? 0) - 1;
			}
			monster.leapPrevEnemy = monster.leapLastEnemy;
			monster.leapLastEnemy = { x: this.hero.x, y: this.hero.y };
		},
	};

	readonly specialMonsterTurnOverrides: Record<string, (monster: Creature) => boolean> = {
		pylon: (monster) => { this.takePylonTurn(monster); return true; },
		ripperDemon: (monster) => this.executeRipperLeap(monster),
		bee: (monster) => { this.takeBeeTurn(monster); return true; },
	};

	/** Whole-turn passive actors checked after hostile mobs have had the chance to attack an
	 * adjacent friendly summon, preserving the old ordering in `takeMonsterTurn`. */
	readonly postAllyMonsterTurnOverrides: Record<string, (monster: Creature) => boolean> = {
		statue: (monster) => this.takeStatueTurn(monster),
		//ArmoredStatue inherits Statue's PASSIVE turn/wake rules unchanged in Java
		//(`ArmoredStatue extends Statue`, tag v3.3.8 - its own overrides only add the
		//armor/weapon kit), so it shares the handler rather than falling through to
		//the generic sleeper path, which would wake it on sight and let it wander.
		armoredStatue: (monster) => this.takeStatueTurn(monster),
		piranha: (monster) => {
			//Piranha.act(): water-bound mobs die immediately when a room effect or movement
			//places them on land; in water it falls through to the ordinary water-only path.
			if (this.level.get(monster.x, monster.y) !== WATER) this.kill(monster);
			return this.level.get(monster.x, monster.y) !== WATER;
		},
	};




	

	/**
	 * Data-driven per-kind ranged/special-turn dispatch for `takeMonsterTurn`'s
	 * non-adjacent case: was a 236-line, 16-case `if (monster.kind === 'x' && cond) { ...;
	 * return; }` cascade, one case per kind, each mutually exclusive since `kind` is a single
	 * string - restructured into an O(1) `Record` lookup instead of a linear string-compare
	 * chain, no behavior change. Each handler returns `true` if it consumed the monster's
	 * turn (the original branch's `return`) or `false` to fall through to the shared movement
	 * AI below (the original branch's condition failing, or no branch matching at all for a
	 * kind with no special ranged ability). A few kinds shared one underlying behavior in the
	 * original cascade (Necromancer/SpectralNecromancer, Scorpio/Acidic, DM200/DM201) - each
	 * still shares one helper method here, just referenced from two registry keys instead of
	 * one `||`-joined condition.
	 */
	readonly rangedAiOverrides: Record<string, (monster: Creature, distance: number) => boolean> = {
		//DM100.canAttack/doAttack: lightning bolt (Normal(3,10)) over MAGIC_BOLT ballistics when
		//not adjacent - no blast exists in this SPD revision (that is DM200/DM201 territory)
		dm100: (monster) => {
			if (!this.rangedTarget(monster, 6)) return false;
			//`DM100.java` 107-109: the bolt shakes the screen when it lands on the hero (the shake
			//is inside its `enemy == Dungeon.hero` branch, which is the only target this AI uses).
			this.shakeScreen(2, 0.3);
			this.zapHero(monster, [3, 10]);
			return true;
		},
		//Shaman: melee 5-10 adjacent, zap Normal(6,15) at range over MAGIC_BOLT
		shaman: (monster) => {
			if (!this.rangedTarget(monster, 6)) return false;
			this.zapHero(monster, [6, 15]);
			return true;
		},
		//Necromancer: summons while it has none and the hero is close (see `summonSkeleton`
		//for the placement/push-aside/blocker-damage rules), otherwise bolts. The old comment
		//here claimed the push-aside needed a full knockback system - wrong (see above), now
		//ported as a plain neighbour search. SpectralNecromancer shares all of this unchanged.
		necromancer: (monster, distance) => this.necromancerRangedTurn(monster, distance),
		spectralNecromancer: (monster, distance) => this.necromancerRangedTurn(monster, distance),
		tengu: (monster) => { this.takeTenguTurn(monster); return true; },
		dm300: (monster) => { this.takeDM300Turn(monster); return true; },
		yog: (monster) => { this.takeYogTurn(monster); return true; },
		//Warlock DarkBolt, Elemental zap: same MAGIC_BOLT shape as the Shaman's (Warlock's
		//zap is its own 12-18; the Elemental's cooldown and opposite-element rules are not
		//modelled - it simply zaps within its own melee range)
		warlock: (monster) => {
			if (!this.rangedTarget(monster, 6)) return false;
			this.zapHero(monster, [12, 18]);
			return true;
		},
		elemental: (monster) => this.elementalRangedTurn(monster),
		newbornElemental: (monster) => this.newbornElementalTurn(monster),
		//YogFist subclasses all use a ranged zap when not adjacent; the concrete effect is
		//selected by `yogFistType` (YogFist.java, BurningFist/SoiledFist/RottingFist/
		//RustedFist/BrightFist/DarkFist, tag v3.3.8).
		yogFist: (monster) => {
			return this.yogFistRangedTurn(monster);
		},
		//Scorpio: ranged-only over PROJECTILE ballistics, like the Trickster. Acidic shares this
		//unchanged (see the melee-retreat branch's own comment above, at the `distance === 1` dispatch).
		scorpio: (monster) => this.scorpioRangedTurn(monster),
		acidic: (monster) => this.scorpioRangedTurn(monster),
		//Guard.chain: distance<5 with a projectile path - pulls one cell closer + Cripple 4s.
		//Real Java's `chainsUsed` means a Guard may only ever do this once in its lifetime, not
		//every time the hero re-enters range - previously unmodeled, letting a Guard chain-pull
		//and Cripple-lock the hero repeatedly, something the real game never allows.
		guard: (monster, distance) => {
			if (monster.chainUsed || distance < 2 || distance >= 5 || !Roguelike.canTarget(this.level, monster, this.hero, { range: 5 })) return false;
			this.chainHero(monster);
			return true;
		},
		//DM200.Hunting.act()/canVent() - see `dm200HuntingTurn`/`dm200CanVent`'s own doc
		//comments for the Java citation. `DM201 extends DM200` and inherits this vent ability
		//unchanged, but is also IMMOVABLE (DM200 itself is not): reaching here without a
		//successful vent means real Java simply does nothing rather than stepping closer
		//like every other non-immobile monster, so DM201's own entry always consumes the
		//turn either way.
		dm200: (monster, distance) => this.dm200HuntingTurn(monster, distance),
		dm201: (monster, distance) => {
			this.dm200HuntingTurn(monster, distance);
			return true;
		},
		//Spinner.Hunting.act()/shootWeb() (tag `v3.3.8`): while not adjacent and off a 10-turn
		//cooldown, seeds Java's persistent 3-cell `Web` blob (the aimed cell plus its two
		//neighbours) and roots the hero on the shot. The blob persists via `spreadPlantBlobs`
		//(`web` volume roots whoever stands in it), so the direct root is the impact and the
		//terrain is the aftermath, exactly Java's two halves.
		spinner: (monster, distance) => {
			if (distance < 2) return false;
			monster.webCooldown = (monster.webCooldown ?? 0) - 1;
			if ((monster.webCooldown ?? 0) > 0 || !Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) return false;
			monster.webCooldown = 10;
			this.web.seed(this.hero.x, this.hero.y, 10);
			for (const step of [{ x: 1, y: 0 }, { x: -1, y: 0 }]) {
				const nx = this.hero.x + step.x;
				const ny = this.hero.y + step.y;
				if (nx >= 0 && ny >= 0 && nx < this.level.width && ny < this.level.height && this.level.passable(nx, ny)) {
					this.web.seed(nx, ny, 10);
				}
			}
			addBuff(this.hero, 'roots');
			this.say(t('port.log.spinnerweb'), 'negative');
			return true;
		},
		//Golem.teleportEnemy()/canTele(): while not adjacent and off a 20-turn cooldown, teleports
		//the hero to whichever of the hero's own free 8-neighbours is farthest from the golem
		//(pushing the hero away rather than pulling itself closer). Real Java gates this on a real
		//BFS reachability check around blocking terrain (`canTele`) rather than a hard range, and
		//separately has its own self-teleport-to-reposition ability while wandering, handled by
		//the persistent patrol target below.
		golem: (monster, distance) => {
			if (distance < 2) return false;
			//`Golem.teleportEnemy()` restores the target's own position when it has
			//`MagicImmune`; teleporting the hero would otherwise bypass the port's existing
			//anti-magic state gate.
			if (this.hero.magicImmune) return false;
			if ((monster.golemTeleCooldown ?? 0) > 0 || !this.golemCanTeleport(monster)) return false;
			//`Golem.Hunting.act()` first gives the ability a `Random.Int(100/distance) == 0`
			//chance. The old port always teleported whenever the line was available, making
			//the cooldown the only gate and turning a probabilistic ability into a guaranteed one.
			//When the direct roll fails, Java first tries `getCloser(target)` and only teleports
			//if that approach cannot find a step. Ask the same pathfinder here so a blocked line
			//with an open route still produces an ordinary approach turn.
			if (Random.int(0, Math.max(1, Math.floor(100 / distance))) !== 0) {
				const blocked = new Set(this.creatures
					.filter((c) => c !== monster && c !== this.hero)
					.map((c) => this.level.index(c.x, c.y)));
				this.eternalFireBlockedInto(blocked);
				if (this.pathfinder.find(
					{ x: monster.x, y: monster.y },
					{ x: this.hero.x, y: this.hero.y },
					{ blocked },
				)[0]) return false;
			}
			let best: { x: number; y: number } | null = null;
			let bestDistance = -1;
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const at = { x: this.hero.x + dx, y: this.hero.y + dy };
				if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
				const fromGolem = Roguelike.chebyshevDistance(at, monster);
				if (fromGolem > bestDistance) { bestDistance = fromGolem; best = at; }
			}
			if (!best) return false;
			const golemTeleFrom = { x: this.hero.x, y: this.hero.y };
			this.moveTo(this.hero, best);
			this.playTeleportAppear(golemTeleFrom, best, this.hero);
			monster.golemTeleCooldown = 20;
			this.say(t('port.log.golemteleport'), 'negative');
			return true;
		},
		eye: (monster) => this.eyeBeamTurn(monster),
		//GnollTrickster: ranged-only (never adjacent), combo escalates in attack(). Falling
		//through here (out of range) means it's about to move via the shared mover below
		//rather than attack this turn, so its combo resets (see `stepAway`'s own identical
		//reset for the adjacent-retreat case).
		gnollTrickster: (monster) => {
			const target = this.rangedTarget(monster, 6);
			if (!target) {
				monster.combo = 0;
				return false;
			}
			this.attack(monster, target);
			this.spawnProjectile(monster, target);
			return true;
		},
		//GreatCrab.getCloser: only really advances every 3rd turn
		greatCrab: (monster) => {
			monster.moving = (monster.moving ?? 0) + 1;
			if (monster.moving < 3) return true;
			monster.moving = 0;
			return false;
		},
		ripperDemon: (monster, distance) => this.takeRipperLeapTrigger(monster, distance),
	};


	readonly validatedRangedAiProfiles: Readonly<Record<string, (monster: Creature, distance: number) => boolean>> = (() => {
		const resolved: Record<string, (monster: Creature, distance: number) => boolean> = {};
		for (const [monster, profile] of Object.entries(MWL_AI_PROFILES)) {
			const hook = this.rangedAiOverrides[profile];
			if (!hook) throw new Error(`MWL AI profile ${profile} has no TypeScript hook for ${monster}`);
			resolved[monster] = hook;
		}
		return resolved;
	})();














































































	/** One-time-per-fight guard warning (Java warns once per fist - no per-fist latch exists). */
	yogFistWarned = false;




































































	/**
	 * The wand power the current zap resolves at. `Talent.EMPOWERING_SCROLLS` makes the next
	 * N zaps read +3 levels; `empoweredZapBonus` carries that bonus only for the duration of
	 * one zap resolution (set around the zap branch, cleared after), so every other
	 * `weaponLevel` read - melee damage, upgrade logic, save - is untouched.
	 */
	empoweredZapBonus = 0;






























































































		sandalsItem(instanceId?: string) {
			return this.bag.find('sandals', instanceId) as (typeof this.bag.items[number] & SandalsItem) | undefined;
		}

		chainsItem(instanceId?: string) {
			return this.bag.find('chains', instanceId) as (typeof this.bag.items[number]
				& { level?: number; charge?: number; partialCharge?: number; exp?: number; cursed?: boolean }) | undefined;
		}

		armbandItem(instanceId?: string) {
			return this.bag.find('armband', instanceId) as (typeof this.bag.items[number]
				& { level?: number; charge?: number; partialCharge?: number; exp?: number; cursed?: boolean }) | undefined;
		}

		beaconArtifactItem(instanceId?: string) {
			return this.bag.find('beacon', instanceId) as (typeof this.bag.items[number] & BeaconItem) | undefined;
		}

		hornItem(instanceId?: string) {
			return this.bag.find('horn', instanceId) as (typeof this.bag.items[number]
				& { level?: number; charge?: number; partialCharge?: number; cursed?: boolean; storedFoodEnergy?: number }) | undefined;
		}

		roseItem(instanceId?: string) {
			return this.bag.find('rose', instanceId) as (typeof this.bag.items[number] & RoseItem) | undefined;
		}


		talismanItem(instanceId?: string) {
			return this.bag.find('talisman', instanceId) as (typeof this.bag.items[number] & TalismanItem) | undefined;
		}

		spellbookItem(instanceId?: string) {
			return this.bag.find('spellbook', instanceId) as (typeof this.bag.items[number] & SpellbookItem) | undefined;
		}






		summonElementalItem(instanceId?: string) {
			return this.bag.find('summonElemental', instanceId) as (typeof this.bag.items[number] & { imbuedElement?: 'fire' | 'frost' | 'shock' | 'chaos' }) | undefined;
		}

	override resize(width: number, height: number): void {
		//the window zoom first: `positionInterface` places the scaled windows in its logical space
		this.applyWindowZoom(windowBaseZoom(width, height));
		this.camera.setViewport(width, height);
		if (this.gameLog) {
			//wrap to the window, leaving room for the margin on both sides, and sit the block
			//on the bottom edge the way GameScene.java anchors its log
			this.gameLog.setWrapWidth(Math.max(100, (width - 16) / this.gameLog.scale.x));
			this.gameLog.y = height - this.gameLog.logHeight - 24;
		}
		if (this.hintLabel) {
			this.hintLabel.x = 8;
			this.hintLabel.y = height - 14;
		}
		if (this.compass) {
			//Centered on the portrait, as in StatusPane.layout().
			this.compass.x = this.statusPane.x + 30;
			this.compass.y = this.statusPane.y + 32;
		}
		this.positionInterface(width, height);
	}

	/** Releases the scene-owned generated projectile texture in addition to Scene2D's stage. */
	protected override teardown(): void {
		super.teardown();
		//The projectile sprites are stage children and are already destroyed above; clear these
		//references so a discarded scene cannot retain the old flight list through its closures.
		this.projectiles.length = 0;
		//Unlike atlas textures in runState, this texture came from this scene's private canvas and
		//its source is not shared, so destroying the source is correct here.
		this.dotTexture?.destroy(true);
	}

	override update(dt: number): void {
		runState.audio.update(dt);
		//fit the window zoom to the top window and keep window text crisp (`ui/windowFit.ts`)
		tuneWindowStack(this.gameWindows, windowBaseZoom(Game.current.width, Game.current.height), this.windowZoom, Game.current.height, (zoom) => this.applyWindowZoom(zoom));
		sharpenUi([this.statusPane, this.actionBar, this.inventoryPanel, this.victoryPanel, this.journalWindow, this.gameLog]);
		//`WndResurrect.onBackPressed()` is empty - the keeps choice cannot be dismissed. Any close
		//that is not the confirm (picker cancel, outside click, a save loaded mid-window) reopens the
		//keeps window here, so a dead hero with no window and no game over is unreachable.
		if (this.resurrectPending && !this.gameOver && this.hero.hp <= 0 && !this.itemPickerOpen && this.gameWindows.top == null) this.openResurrectKeeps();
		if (this.interlevel) {
			const transition = this.interlevel;
			transition.elapsed += dt;
			transition.backdrop.tilePosition.y += dt * 5;
			const p = Math.min(1, transition.elapsed / transition.duration);
			//InterlevelScene uses exact 0.33s fades around a static middle phase.
			const fade = 0.33;
			transition.curtain.alpha = transition.elapsed < fade ? 1 - transition.elapsed / fade
				: transition.elapsed > transition.duration - fade ? (transition.elapsed - (transition.duration - fade)) / fade : 0;
			transition.message.alpha = 1 - transition.curtain.alpha;
			if (p >= 1) {
				transition.root.destroy({ children: true });
				this.interlevel = null;
				if (!this.gameOver) {
					this.awaitingInput = true;
					this.refresh();
				}
			}
		}
		if (this.banner) {
			this.banner.update(dt);
			if (this.bannerPanelFollow) this.victoryPanel.alpha = this.banner.alpha * this.banner.alpha;
			if (!this.banner.showing) {
				this.banner = null;
				this.bannerPanelFollow = false;
			}
		}
		for (const creature of this.creatures) {
			const liveSprite = this.sprite(creature);
			if (!liveSprite.destroyed && liveSprite instanceof AnimatedSprite) {
				liveSprite.update(dt);
				//a non-looping clip returns to idle only if it was not a death - the dead keep their
				//final pose (the hero stays in `this.creatures`, unlike a monster, which `kill()`
				//moves into `dyingMonsters` to fade)
				if (liveSprite.isFinished && liveSprite.playing !== 'die') liveSprite.play('idle');
			}
		}
		//`kill()` splices the hero out of `this.creatures` but keeps its sprite for the game-over
		//screen, so the loop above would leave a dying hero frozen on the death clip's first frame -
		//the animator this replaced was advanced unconditionally, so the clip has to keep running.
		const heroSprite = this.sprite(this.hero);
		if (!heroSprite.destroyed && heroSprite instanceof AnimatedSprite && !this.creatures.includes(this.hero)) {
			heroSprite.update(dt);
		}
		// MobSprite finishes the death clip, then fades its corpse over three seconds.
		// Logical removal and loot are immediate; the corpse never blocks a cell.
		for (const [sprite, corpse] of this.dyingMonsters) {
			if (sprite.destroyed) { this.dyingMonsters.delete(sprite); continue; }
			sprite.visible = this.fov.isVisible(corpse.x, corpse.y);
			if (!sprite.isFinished) sprite.update(dt);
			else {
				corpse.fade += dt;
				sprite.alpha = Math.max(0, 1 - corpse.fade / 3);
				if (corpse.fade >= 3) { sprite.destroy(); this.dyingMonsters.delete(sprite); }
			}
		}
		for (const [sprite, motion] of this.monsterMotion) {
			if (!sprite.destroyed) motion.update(dt);
			if (sprite.destroyed || !motion.isBusy) { motion.clear(); this.monsterMotion.delete(sprite); }
		}
		//The previous map/spread/Array.from expression allocated a new array every frame (the
		//same visual values, only rebuilt for CharacterEffects' current-set pass). Reuse the buffer;
		//CharacterEffects still receives an exact current-frame list and owns its own entry cleanup.
		const characterEffects = this.characterEffectCharacters;
		characterEffects.length = 0;
		for (const creature of this.creatures) characterEffects.push({ sprite: this.sprite(creature), sleeping: creature.sleeping && !(creature.kind === 'mimic' && creature.mimicRevealed === false) /* MimicSprite.hideSleep() */ });
		for (const sprite of this.dyingMonsters.keys()) characterEffects.push({ sprite });
		const heroVisual = this.sprite(this.hero);
		if (this.gameOver && !heroVisual.destroyed) characterEffects.push({ sprite: heroVisual });
		this.characterEffects.update(dt, characterEffects);
		this.camera.update(dt);
		this.map?.cull(this.camera);
		this.wallsMap?.cull(this.camera);
		this.featuresMap?.cull(this.camera);
		this.wallBlocking?.cull(this.camera);
		this.badgeBanner.update(dt);
		this.gameWindows.update(dt);
		this.waterSurface?.update(dt);
		this.wallDecorations?.update(dt, (x, y) => this.fov.isVisible(x, y));
		this.waterEmbers?.update(dt, (x, y) => this.fov.isVisible(x, y));
		this.wellRipples?.update(dt, (x, y) => this.fov.isVisible(x, y));
		//the custom-tilemap layers are chunked like the other maps and must be culled with them,
		//or every chunk of a floor-wide layer stays live for the whole floor
		this.vaultVisuals?.cull(this.camera);
		this.cavesBossTiles?.cull(this.camera);
		this.cavesBossWalls?.cull(this.camera);
		this.hallsBossCenter?.cull(this.camera);
		this.hallsBossCenterWalls?.cull(this.camera);
		this.cityBossTiles?.cull(this.camera);
		this.cityBossWalls?.cull(this.camera);
		this.ritualMarker?.cull(this.camera);

		//the hit-flash fades by clearing only the additive term, never the tint - tint is a
		//creature's identity colour here, and resetColor() would wipe the sprite's own art
		//back to a flat white square along with the flash. `colorAdd` doubles as an ally's own
		//persistent identity tint though (`allyIdentityColorAdd`, set at spawn), so a flashed
		//ally must fade back to *that* baseline, not to 0 - fixed live (2026-09-19): a hit
		//Sheep previously lost its tint for good after one frame, since this loop always zeroed
		//`colorAdd` outright rather than restoring the value the ally was actually spawned with.
		for (const creature of this.creatures) {
			const baseline = allyIdentityColorAdd(creature.isAlly, creature.allyKind);
			if (this.sprite(creature).colorAdd !== baseline) this.sprite(creature).colorAdd = baseline;
		}

		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const thrown = this.projectiles[i];
			if (thrown.spin) thrown.sprite.angle = (thrown.sprite.angle + thrown.spin * dt) % 360;
			if (thrown.flight.update(dt)) {
				thrown.sprite.destroy();
				this.projectiles.splice(i, 1);
			}
		}

		this.floaters.update(dt);
		this.updateEffectBursts(dt);
		this.updateTeleportFades(dt);
		this.updateSurpriseMarks(dt);

		//Compass.java recomputes its angle whenever the camera scrolls, against the camera's
		//own centre - so it follows the view rather than the hero, and keeps pointing while
		//the hero stands still and the camera eases in
		if (this.compass && this.hasStairs && this.stairs) {
			const view = this.camera.view;
			this.compass.update(
				{ x: (this.stairs.x + 0.5) * TILE, y: (this.stairs.y + 0.5) * TILE },
				{ x: view.x + view.width / 2, y: view.y + view.height / 2 },
				this.fov?.isExplored(this.stairs.x, this.stairs.y) ?? false
			);
		}
	}
}

/** The method groups in `./dungeon/` are typed with `this: DungeonScene` and merged onto the prototype here. */
type Mixed<T> = { [K in keyof T]: OmitThisParameter<T[K]> };
export interface DungeonScene extends Mixed<typeof coreSpawnTilesMethods>, Mixed<typeof npcShopBlacksmithMethods>, Mixed<typeof environmentFireTrapsMethods>, Mixed<typeof turnLoopAimingMethods>, Mixed<typeof actorTurnsHazardsMethods>, Mixed<typeof monsterAiMethods>, Mixed<typeof bossLogicMethods>, Mixed<typeof combatResolutionMethods>, Mixed<typeof deathSaveRefreshMethods>, Mixed<typeof panelsSingleUseMethods>, Mixed<typeof inventoryQuickslotMethods>, Mixed<typeof clericSpellFlowsMethods>, Mixed<typeof armorAbilityUseMethods>, Mixed<typeof cursedWandCastMethods>, Mixed<typeof weaponSpellsGearMethods> {}
Object.assign(DungeonScene.prototype, coreSpawnTilesMethods, npcShopBlacksmithMethods, environmentFireTrapsMethods, turnLoopAimingMethods, actorTurnsHazardsMethods, monsterAiMethods, bossLogicMethods, combatResolutionMethods, deathSaveRefreshMethods, panelsSingleUseMethods, inventoryQuickslotMethods, clericSpellFlowsMethods, armorAbilityUseMethods, cursedWandCastMethods, weaponSpellsGearMethods);
