import type { DungeonScene } from '../dungeonScene';
import { fallenItemStore } from './fallenItems';
import { InfoWindow } from '../../ui/infoWindow';
import { buffInfo } from '../../ui/buffInfo';
import { recallTrackedPortId } from '../../items/scrollEffects';
import { getCurse } from '../../items/itemCurses';
import { showBuffInfoWindow } from '../../ui/buffInfoWindow';
import { InventoryWindow } from '../../ui/inventoryWindow';
import { Container, Graphics, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Actors, Bar, Blob, Button, Game, Label, Random, Roguelike, Rpg, Window, WindowStack, theme } from 'mwg';
import { MISSILE_MAX_DURABILITY } from '../../items/missiles';
import { cureHeroBuffs } from '../../items/potionEffects';
import { aimBombFlow, useBomb as useItemBomb, type BombAimContext } from '../../items/bombs';
import { detonateBomb, type BombEffectsContext } from '../../items/bombEffects';
import { isBagId } from '../../items/bags';
import { isResurrectKeepCandidate, partitionResurrectKeeps } from '../../items/resurrect';
import { useStoneOfAggression as useItemStoneOfAggression, useStoneOfAugmentation as useItemStoneOfAugmentation, useStoneOfBlast as useItemStoneOfBlast, useStoneOfBlink as useItemStoneOfBlink, useStoneOfClairvoyance as useItemStoneOfClairvoyance, useStoneOfDeepSleep as useItemStoneOfDeepSleep, useStoneOfEnchantment as useItemStoneOfEnchantment, useStoneOfFear as useItemStoneOfFear, useStoneOfFlock as useItemStoneOfFlock, useStoneOfShock as useItemStoneOfShock } from '../../items/stones';
import { type AlchemyFlowContext } from '../../items/alchemy';
import { applyDefenderDamageCurves } from '../../simulation/defenderDamageCurves';
import { rollGeneratedAffix } from '../../items/itemKinds';
import { ENCHANT_TABLE, GLYPH_TABLE } from '../../items/itemAffixes';
import { ringBonusLevel, ringDef, ringFurorMultiplier, ringHasteMultiplier, type EquippedRing } from '../../items/ringModifiers';
import { capitalize, has, t, titleCase } from '../../i18n/index';
import { SPD_STATUS_COLOR } from '../../ui/spdTheme';
import { GameLog } from '../../ui/gameLog';
import { Compass } from '../../ui/compass';
import { BadgeBannerLayer } from '../../ui/badgeBanner';
import { SpdToolbar } from '../../ui/toolbar';
import { StatusPane } from '../../ui/statusPane';
import { DungeonHud } from '../../ui/dungeonHud';
import { lightCloakArtifactBonus, lightCloakRechargeRate } from '../../talentEffects';
import { resetPortedRun } from '../../spdLevelGen/gameBridge';
import { runState } from '../../runState';
import { isChallengeEnabled } from '../../challenges';
import { CLASS_TALENTS, TALENT_TIERS, armorTalentDefinitions, hasClassTier3Row, subclassTalentDefinitions, talentDescKey, talentTitleKey, type TalentDefinition } from '../../talents';
import { recallTrackerDuration } from '../../simulation/clericSpells';
import { ARMOR_CHARGE_START, armorAbilitiesFor, armorAbilityDef, armorAbilityKey, isKnownArmorAbility } from '../../armorAbilities';
import { prismaticGuardMaxHp } from '../../simulation/prismatic';
import { markRingTypesKnown } from '../../simulation/ringKnow';
import { isWandType, setStaffImbue } from '../../items/wands';
import { CLASSES } from '../../classes';
import { showChoiceWindow } from '../../ui/portWindows';
import { useBrewFlow, type BrewFlowContext } from '../../simulation/brews';
import { useHoneypotFlow, type HoneypotFlowContext } from '../../items/honeypot';
import { useAnkhFlow, type AnkhContext } from '../../items/selfUse';
import { Banner } from '../../ui/banner';
import { showDefeatPanel as showDefeatPanelUi, showVictoryPanel as showVictoryPanelUi } from '../../ui/endPanels';
import { createItemPickerWindow } from '../../ui/itemPicker';
import { CLASS_ARMOR_ID_BY_CLASS, isClassArmorId, weaponCombat } from '../../items/catalog';
import { MWL_HERO_BASE_STATS, mwlItemEffectValue } from '../../mwlContent';
import { useAlchemizeFlow, useStylusFlow, type AlchemizeContext, type StylusContext } from '../../items/spells';
import { useStoneById as routeStoneAction, type StoneActionContext } from '../../items/stoneActions';
import { setWandmakerQuestType, setWandmakerQuestWands, wandmakerQuestType } from '../../spdLevelGen/wandmaker';
import { ITEM_FRAME, WATER } from '../../dungeonConstants';
import { BUFF_DURATION, absorbShield, addBuff, setAnnounceBuff, setAttachBacklash, type BuffId, type Creature, type GroundItem, type Step } from '../../combat';
import { BOSSES } from '../../monsters';
import { APPEARANCE_TABLES, AUGMENT_OPTIONS, BLACKSMITH_QUEST, IMP_QUEST, SAD_GHOST_QUEST, SPD_LEVEL_CURVE, SUBCLASS_OPTIONS, SUBCLASS_TRACK, WANDMAKER_QUEST } from './shared';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `panelsSingleUse`). Each takes the scene as 	his`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const panelsSingleUseMethods = {
	loadRun(this: DungeonScene): void {
		const data = this.saves.load('run');
		if (!data) {
			this.say(t('port.log.nosave'), 'negative');
			return;
		}
		const s = data.state;
		// The scene may currently hold a different run. Never capture it under the loaded depth
		// while `enterLevel` tears it down; replace the entire floor-state cache first.
		this.activeFloorDepth = null;
		this.floorStates = new Map(s.floors ?? []);
		const fallenStore = fallenItemStore(this);
		fallenStore.clear();
		for (const [depth, entries] of s.fallenItems ?? []) fallenStore.set(depth, entries);
		resetPortedRun();
		this.runSeedLong = s.runSeedLong ? BigInt(s.runSeedLong) : BigInt(s.runSeed ?? this.runSeed);
		this.runSeed = Number(this.runSeedLong % 4294967296n) >>> 0;
		this.runSeedLabel = s.runSeedLong ?? String(this.runSeed);
		this.seededRun = s.seededRun ?? false;
		if (s.appearances) this.appearances = Actors.Appearances.fromJSON(APPEARANCE_TABLES, s.appearances);
		this.depth = s.depth;
		this.deepestDepth = Math.max(this.depth, s.deepestDepth ?? this.depth);
		this.mobsToChampion = s.mobsToChampion ?? 0;
		this.miningBranchActive = s.miningBranchActive ?? false;
		this.heroStr = s.str ?? MWL_HERO_BASE_STATS.strength;
		this.alchemyEnergy = s.alchemyEnergy ?? 0;
		this.reclaimedTrap = s.reclaimedTrap ?? null;
		this.heroAttackSkill = s.attackSkill ?? MWL_HERO_BASE_STATS.attackSkill;
		this.heroDefenseSkill = s.defenseSkill ?? MWL_HERO_BASE_STATS.defenseSkill;
		this.talentAccuracy = s.talentAccuracy ?? 0;
		this.talentEvasion = s.talentEvasion ?? 0;
		this.talentRanks = Object.fromEntries(s.talents ?? []);
		this.heroBarrier = s.heroBarrierState
			? Actors.Barrier.fromJSON(s.heroBarrierState)
			: new Actors.Barrier();
		this.ascendedBarrier = s.ascendedBarrierState
			? Actors.Barrier.fromJSON(s.ascendedBarrierState)
			: new Actors.Barrier();
		this.ascendedTurns = s.ascendedTurns ?? 0;
		this.ascendedSpellCasts = s.ascendedSpellCasts ?? 0;
		this.ascendedFlashCasts = s.ascendedFlashCasts ?? 0;
		this.ascendedDivineCast = s.ascendedDivineCast ?? false;
		this.trinityForm = s.trinityForm ?? null;
		this.trinityTurns = s.trinityTurns ?? 0;
		this.trinityBodyAffix = s.trinityBodyAffix ?? null;
		this.trinityBodyGlyph = s.trinityBodyGlyph ?? null;
		this.trinitySpiritEffect = s.trinitySpiritEffect ?? null;
		this.trinityMindEffect = s.trinityMindEffect ?? null;
		this.livingEarthArmor = s.livingEarthArmor ?? 0;
		this.skeletonKeyTracker = s.skeletonKeyTracker ?? null;
		this.livingEarthWandLevel = s.livingEarthWandLevel ?? 0;
		this.earthrootArmor = (s.earthrootArmorLevel ?? 0) > 0 ? { level: s.earthrootArmorLevel!, pos: s.earthrootArmorPos ?? -1 } : null;
		this.hero.barkskinLevel = s.barkskinLevel;
		this.hero.barkskinInterval = s.barkskinInterval;
		this.hero.barkskinCooldown = s.barkskinCooldown;
		this.regrowthTotalChargesUsed = s.regrowthTotalChargesUsed ?? 0;
		this.regrowthChargesOverLimit = s.regrowthChargesOverLimit ?? 0;
		if (!s.heroBarrierState && s.heroShield) this.heroBarrier.add(s.heroShield);
		this.barrierPartialLoss = s.barrierPartialLoss ?? 0;
		this.regeneration = { partial: s.regenPartial ?? 0, lockLeft: s.lockedFloorLeft ?? null, lockCarry: 0 };
		this.blockingBarrier = s.blockingBarrierState
			? Actors.Barrier.fromJSON(s.blockingBarrierState)
			: new Actors.Barrier();
		if (!s.blockingBarrierState && (s.blockingShieldLeft ?? 0) > 0) {
			//Pre-two-pool saves kept Blocking's share inside the shared pool: carve it back
			//out so totals are preserved exactly across the migration.
			const moved = Math.min(s.blockingShieldLeft ?? 0, this.heroBarrier.total);
			this.heroBarrier.absorb(moved);
			if (moved > 0) this.blockingBarrier.add(moved);
		}
		this.blockingTurnsLeft = s.blockingTurnsLeft ?? 0;
		this.sealBarrier = s.sealBarrierState
			? Actors.Barrier.fromJSON(s.sealBarrierState)
			: new Actors.Barrier();
		this.sealState = { cooldown: 0, turnsSinceEnemies: 0, initialShield: 0, ...(s.sealState ?? {}) };
		//Pre-seal saves have no record either way; treat a Warrior's pre-existing run as unsealed
		//rather than guessing whether the equipped armor is still the original starting piece.
		this.armorSealed = s.armorSealed ?? false;
		this.stealthTalentTicks = s.stealthTalentTicks ?? 0;
		this.empoweredZaps = s.empoweredZaps ?? 0;
		this.enhancedRingsTurns = s.enhancedRingsTurns ?? 0;
		this.seerShotCooldown = s.seerShotCooldown ?? 0;
		this.seerCells = new Map((s.seerCells ?? []) as [number, number][]);
		this.cloakChargeProgress = s.cloakChargeProgress ?? 0;
		this.cloakStealthTurnsToCost = s.cloakStealthTurnsToCost ?? 0;
		this.natureBerriesDropped = s.natureBerriesDropped ?? 0;
		this.berryCounter = s.berryCounter ?? 0;
		this.burningIncrement = s.burningIncrement ?? 0;
		this.intuitionTracker = s.intuitionTracker ?? false;
		this.wandBonusDamage = s.wandBonusDamage ?? 0;
		this.physicalBonusDamage = s.physicalBonusDamage ?? 0;
		this.physicalBonusAttacks = s.physicalBonusAttacks ?? 0;
		this.patientStrikeReady = s.patientStrikeReady ?? false;
		this.holdFastX = s.holdFastX ?? null;
		this.holdFastY = s.holdFastY ?? null;
		this.preciseAssaultReady = s.preciseAssaultReady ?? false;
		this.healingEvasionTurns = s.healingEvasionTurns ?? 0;
		this.sungrassHealing = s.sungrassHealing ?? 0;
		this.sungrassPartial = s.sungrassPartial ?? 0;
		this.healingLeft = s.healingLeft ?? 0;
		//Pre-`healingPercent` saves with an active heal were always on the potion's 25%.
		this.healingPercent = s.healingPercent ?? (this.healingLeft > 0 ? 0.25 : 0);
		this.healingFlat = s.healingFlat ?? 0;
		this.sungrassPos = s.sungrassPos ?? -1;
		this.deathlessFuryUsed = s.deathlessFuryUsed ?? false;
		this.weaponLevel = s.weaponLevel;
		this.weaponTier = s.weaponTier ?? 1;
		this.armorLevel = s.armorLevel;
		this.armorTier = s.armorTier ?? 1;
		this.weaponId = s.weaponId ?? 'startingWeapon';
		this.weaponInstanceId = s.weaponInstanceId;
		this.weaponSourceClass = (s as { weaponSourceClass?: string }).weaponSourceClass ?? this.weaponId;
		this.armorId = s.armorId ?? 'clothArmor';
		this.armorInstanceId = s.armorInstanceId;
		this.weaponAffix = s.weaponAffix ?? null;
		//Older saves carried no independent equipped-item curse bit. Their former equip gate
		//treated a cursed enchant/glyph as the binding state, so use that only as a migration
		//fallback; all saves written now persist `weaponCursed`/`armorCursed` separately.
		this.weaponCursed = s.weaponCursed ?? Boolean(getCurse(this.weaponAffix ?? ''));
		this.weaponCursedKnown = s.weaponCursedKnown ?? false;
		//`Swiftness` exists in real Java only as an armor glyph (`Armor.Glyphs.Swiftness` -
		//checked tag `v3.3.8`: no `Weapon.Enchantments.Swiftness` class at all); this port
		//previously modeled a phantom 0.9x weapon version too, now removed with no equivalent
		//to map to, so a pre-correction weapon `swiftness` id is dropped rather than kept.
		if (this.weaponAffix === 'swiftness') this.weaponAffix = null;
		this.weaponCurseDurability = s.weaponCurseDurability ?? 100;
		this.weaponAugment = s.weaponAugment ?? null;
		this.charmTargets = new Map(s.charmTargets ?? []);
		this.charmIgnoreNextHit = new Set(s.charmIgnoreNextHit ?? []);
		this.armorGlyph = s.armorGlyph ?? null;
		this.armorCursed = s.armorCursed ?? Boolean(getCurse(this.armorGlyph ?? ''));
		this.armorCursedKnown = s.armorCursedKnown ?? false;
		//A save written before the real armor abilities carries the invented `warding`/`arcane`
		//capstone (see `SUBCLASS_TRACK`); those ids are not abilities any more, so they are dropped
		//and the hero can choose a real one at the next King's Crown. `ratmogrify` and every real
		//ability id survive.
		this.armorAbility = s.armorAbility && isKnownArmorAbility(s.armorAbility) ? s.armorAbility : null;
		this.armorCharge = s.armorCharge ?? (this.armorAbility ? ARMOR_CHARGE_START : 0);
		this.endureTurns = s.endureTurns ?? 0;
		this.endureEnduring = s.endureEnduring ?? false;
		this.endureBanked = s.endureBanked ?? 0;
		this.endureHits = s.endureHits ?? 0;
		this.doubleJumpTurns = s.doubleJumpTurns ?? 0;
		this.naturesPowerTurns = s.naturesPowerTurns ?? 0;
		this.naturesPowerExtensions = s.naturesPowerExtensions ?? 0;
		//Java's 0.01-duration latch never survives a save/load round trip (it acts out
		//immediately on restore), so an armed latch in an old save is dropped, not honored.
		this.doubleMarkArmed = false;
		this.warpBeacon = s.warpBeacon ? { ...s.warpBeacon } : null;
		//`Fragile` never existed in real Java (the 8th armor curse is `Stench` - see the
		//affix-table comment); saves from before the correction carry it here and on bag
		//items, so both migrate to `stench` on load rather than silently losing their curse.
		if (this.armorGlyph === 'fragile') this.armorGlyph = 'stench';
		this.kineticStored = s.kineticStored ?? 0;
		this.elementalFurrow = s.elementalFurrow ?? 0;
		this.timeBubbleTurns = s.timeBubbleTurns ?? 0;
		this.timeBubblePresses = new Set(s.timeBubblePresses ?? []);
		this.mnemonicExtended = s.mnemonicExtended ?? [];
		this.hourglassFreeze = s.hourglassFreeze ?? false;
		this.hourglassTurnsToCost = s.hourglassTurnsToCost ?? mwlItemEffectValue('hourglass', 'turnsToCost');
		this.waterskin = s.waterskin;
		this.hunger = s.hunger;
		this.hungerPartialDamage = s.hungerPartialDamage ?? 0;
		this.ammo = s.ammo;
		this.ammoSourceClass = s.ammoSourceClass ?? CLASSES[this.heroClass].special.sourceClass ?? '';
		this.ammoTippedSeed = (s as { ammoTippedSeed?: string }).ammoTippedSeed;
		this.ammoDurability = s.ammoDurability ?? MISSILE_MAX_DURABILITY;
		this.missileLevel = s.missileLevel ?? 0;
		//A pre-2026-09-16 save holds Java-style numeric set ids; the keys are stringified on load,
		//or a numeric key would never match a string lookup and the dust rule would silently stop.
		this.ammoSetId = s.ammoSetId === undefined ? '' : String(s.ammoSetId);
		this.missileThresholds = new Map((s.missileThresholds ?? []).map(([setId, level]) => [String(setId), level]));
		this.dustSpawnPower = s.dustSpawnPower ?? 0;
		this.frostWand = s.frostWand;
		this.wandType = s.wandType ?? (this.frostWand ? 'frost' : 'magicMissile');
		this.ghostSpawned = s.ghostSpawned;
		this.ghostType = s.ghostType;
		this.wandmakerSpawned = s.wandmakerSpawned;
		this.wandmakerType = s.wandmakerQuestType ?? 0;
		setWandmakerQuestWands(s.wandmakerWands ?? null);
		if (this.wandmakerType !== 0) setWandmakerQuestType(this.wandmakerType);
		this.shopStocks.clear();
		this.shopBuybackShelves.clear();
		this.shopSpawnedDepths = new Set(s.shopSpawnedDepths ?? (s.shopkeeperSpawned ? [6] : []));
		for (const [depth, shop] of s.shops ?? []) {
			this.shopSpawnedDepths.add(depth);
			//Rebuilt at exactly the saved counts - never through `shopStockFor`, whose
			//first-touch seeding would resurrect a shelf the save recorded depleted.
			const stock = new Actors.Inventory();
			if (shop.potions > 0) stock.add({ id: 'potion', quantity: shop.potions, stackable: true, identified: true });
			if (shop.identifies > 0) stock.add({ id: 'scrollIdentify', quantity: shop.identifies, stackable: true, identified: true });
			this.shopStocks.set(depth, stock);
			this.shopBuybackShelves.set(depth, (shop.buyback ?? []).slice(0, 3));
		}
		this.shopkeeperWarned = s.shopkeeperWarned ?? false;
		this.blacksmithSpawned = s.blacksmithSpawned ?? this.blacksmithSpawned;
		this.impSpawned = s.impSpawned ?? this.impSpawned;
		this.limitedDrops = Object.fromEntries(s.limitedDrops ?? []);
		//Pre-bag saves carry no flags; velvet is the `initHero()` invariant, and any shop
		//already visited will not rebuild its shelf (see the load path above), so it cannot
		//re-offer what it already sold.
		this.droppedBags = (s.droppedBags ?? ['velvetPouch']).filter(isBagId);
		this.wealthTriesToDrop = s.wealthTriesToDrop ?? -1;
		this.wealthDropsToEquip = s.wealthDropsToEquip ?? -1;
		this.suckerPunchTargets = new Set(s.suckerPunchTargets ?? []);
		this.upgradeScrollDrops = s.upgradeScrollDrops ?? 0;
		this.blacksmithAlternative = s.blacksmithAlternative ?? this.blacksmithAlternative;
		this.blacksmithQuestType = s.blacksmithQuestType ?? this.blacksmithQuestType;
		//A save from before the entry prompt existed and already inside the quest keeps its access.
		this.blacksmithQuestStarted = s.blacksmithQuestStarted ?? (s.blacksmithQuestType !== undefined ? false : this.quests.status('blacksmith') === 'active');
		this.blacksmithFavor = s.blacksmithFavor ?? 0;
		this.blacksmithBossBeaten = s.blacksmithBossBeaten ?? false;
		this.hallsBossSealed = s.hallsBossSealed ?? false;
		this.cavesBossSealed = s.cavesBossSealed ?? false;
		this.sewerBossSealed = s.sewerBossSealed ?? false;
		this.cityBossSealed = s.cityBossSealed ?? false;
		this.bossUnsealedDepths = new Set(s.bossUnsealedDepths ?? []);
		this.tenguFightStarted = s.tenguFightStarted ?? false;
		this.qualifiedForBossChallenge = (s as { qualifiedForBossChallenge?: boolean }).qualifiedForBossChallenge ?? false;
		this.resurrectPending = (s as { resurrectPending?: boolean }).resurrectPending ?? false;
		this.interfaceSize = ((s as { interfaceSize?: number }).interfaceSize === 1 ? 1 : 0);
		this.quickslots = ((s as { quickslots?: ({ id: string; instanceId?: string } | null)[] }).quickslots ?? [null, null, null, null]).slice(0, 4);
		while (this.quickslots.length < 4) this.quickslots.push(null);
		this.weaponCharge = (s as { weaponCharge?: number }).weaponCharge ?? 2;
		this.weaponPartialCharge = (s as { weaponPartialCharge?: number }).weaponPartialCharge ?? 0;
		this.spinSpins = (s as { spinSpins?: number }).spinSpins ?? 0;
		this.spinTurns = (s as { spinTurns?: number }).spinTurns ?? 0;
		this.cleaveFreeTurns = (s as { cleaveFreeTurns?: number }).cleaveFreeTurns ?? 0;
		this.guardTurns = (s as { guardTurns?: number }).guardTurns ?? 0;
		this.comboClobberUsed = (s as { comboClobberUsed?: boolean }).comboClobberUsed ?? false;
		this.monk.energy = (s as { monkEnergy?: number }).monkEnergy ?? 0;
		this.monkEnsureBuff();
		this.comboParryUsed = (s as { comboParryUsed?: boolean }).comboParryUsed ?? false;
		this.comboInitialTime = (s as { comboInitialTime?: number }).comboInitialTime ?? 0;
		this.swordDanceTurns = (s as { swordDanceTurns?: number }).swordDanceTurns ?? 0;
		this.defensiveStanceTurns = (s as { defensiveStanceTurns?: number }).defensiveStanceTurns ?? 0;
		this.chargedShotArmed = (s as { chargedShotArmed?: boolean }).chargedShotArmed ?? false;
		this.clAbilityWeaponClass = (s as { clAbilityWeaponClass?: string | null }).clAbilityWeaponClass ?? null;
		this.clAbilityWeaponInstanceId = (s as { clAbilityWeaponInstanceId?: string }).clAbilityWeaponInstanceId ?? undefined;
		this.clAbilityTurns = (s as { clAbilityTurns?: number }).clAbilityTurns ?? 0;
		//Pre-2026-09-19 saves may carry `clTriggerTurns` (the deleted second tracker);
		//it is ignored, not restored - the single ability tracker above is the whole state.
		this.heroActionClock = (s as { heroActionClock?: number }).heroActionClock ?? 0;
		this.recentHitClocks = (s as { recentHitClocks?: number[] }).recentHitClocks ?? [];
		this.blacksmithPickaxeAvailable = s.blacksmithPickaxeAvailable ?? false;
		this.blacksmithPickaxeFree = s.blacksmithPickaxeFree ?? false;
		this.blacksmithReforges = s.blacksmithReforges ?? 0;
		this.blacksmithHardens = s.blacksmithHardens ?? 0;
		this.blacksmithUpgrades = s.blacksmithUpgrades ?? 0;
		this.blacksmithSmiths = s.blacksmithSmiths ?? 0;
		this.weaponHardened = s.weaponHardened ?? false;
		this.weaponIdentified = s.weaponIdentified ?? true;
		this.armorIdentified = s.armorIdentified ?? true;
		this.armorHardened = s.armorHardened ?? false;
		this.equippedRing = s.equippedRing ?? null;
		markRingTypesKnown(this, s.ringTypesKnown ?? []);
		this.ringHtBonus = s.ringHtBonus ?? 0;
		this.advancement = s.advancement ? Actors.Advancement.fromJSON(SUBCLASS_TRACK, s.advancement) : new Actors.Advancement(SUBCLASS_TRACK);
		//No subclass window is re-opened on load either: the choice belongs to the Tengu's mask, not to a level.
		this.subclassChoiceOpen = false;
		//No armor-ability window is re-opened on load: the choice belongs to the King's Crown
		//(`KingsCrown.WEAR`), not to a level, so there is nothing pending to restore.
		this.armorChoiceOpen = false;
		this.talentOpen = this.subclassChoiceOpen || this.armorChoiceOpen;
		this.itemPickerOpen = false;
		this.itemPickerEntries = [];
		this.itemPickerOnPick = null;
		const classDef = CLASSES[this.heroClass];
		this.heroStats = s.heroStatsState
			? Actors.StatBlock.fromJSON({ base: { accuracy: classDef.accuracy, evasion: MWL_HERO_BASE_STATS.baseEvasion, gold: MWL_HERO_BASE_STATS.baseGold } }, s.heroStatsState)
			: this.heroStats;
		this.heroStats.setBase('gold', s.heroStatsState?.base.gold ?? s.gold);
		//A save from before the per-tier talent-point split (see 	alentPoints`'s own comment)
		//has no 	alentPoints` array, only the old single pool's remaining count
		//(`skillPointsState.points`/`skillPoints`) - dumped into the T1 bucket as a one-time
		//migration, since the old save has no record of which tier those leftover points came
		//from. A save already on the new format just restores its array directly.
		this.talentPoints = s.talentPoints ?? [s.skillPointsState?.points ?? s.skillPoints ?? 0, 0, 0, 0];
		//T4's bucket is new with the real armor abilities: an older save's array is 3 long, and a
		//save from before those existed has no ability either, so its T4 bucket starts at 0.
		while (this.talentPoints.length < 4) this.talentPoints.push(0);
		//Pre-imbue saves carry no staff class; the staff starts on Magic Missile.
		if (isWandType(s.staffImbue)) setStaffImbue(this, s.staffImbue);
		this.itemSerial = s.itemSerial ?? 0;
		if (s.bagState && s.bagDefinitions) {
			this.bag = Actors.Inventory.fromJSON(new Map(s.bagDefinitions), s.bagState);
			for (const item of this.bag.items) {
				const source = s.bagSources?.find((saved) => saved.id === item.id && saved.instanceId === item.instanceId);
				if (source?.sourceClass) (item as typeof item & { sourceClass?: string }).sourceClass = source.sourceClass;
				if (source?.sandBags !== undefined) (item as typeof item & { sandBags?: number }).sandBags = source.sandBags;
				if (source?.charges !== undefined) (item as typeof item & { charges?: number }).charges = source.charges;
				if (source?.wandCur !== undefined) (item as typeof item & { wandCur?: number }).wandCur = source.wandCur;
				if (source?.wandPartial !== undefined) (item as typeof item & { wandPartial?: number }).wandPartial = source.wandPartial;
				if (source?.wandMax !== undefined) (item as typeof item & { wandMax?: number }).wandMax = source.wandMax;
				if (source?.cursedKnown !== undefined) (item as typeof item & { cursedKnown?: boolean }).cursedKnown = source.cursedKnown;
				const state = item as typeof item & { usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean };
				if (source?.usesLeftToIdentify !== undefined) state.usesLeftToIdentify = source.usesLeftToIdentify;
				if (source?.availableUsesToIdentify !== undefined) state.availableUsesToIdentify = source.availableUsesToIdentify;
				if (source?.durability !== undefined) state.durability = source.durability;
				if (source?.maxDurability !== undefined) state.maxDurability = source.maxDurability;
				if (source?.seal !== undefined) state.seal = source.seal;
				if (source?.blessed !== undefined) (item as typeof item & { blessed?: boolean }).blessed = source.blessed;
				const beacon = item as typeof item & { returnDepth?: number; returnBranch?: number; returnPos?: number; returnX?: number; returnY?: number };
				if (source?.returnDepth !== undefined) beacon.returnDepth = source.returnDepth;
				if (source?.returnBranch !== undefined) beacon.returnBranch = source.returnBranch;
				if (source?.returnPos !== undefined) beacon.returnPos = source.returnPos;
				if (source?.returnX !== undefined) beacon.returnX = source.returnX;
				if (source?.returnY !== undefined) beacon.returnY = source.returnY;
				if (source?.missileSet !== undefined) (item as typeof item & { missileSet?: string }).missileSet = source.missileSet;
				if (source?.tippedSeed !== undefined) (item as typeof item & { tippedSeed?: string }).tippedSeed = source.tippedSeed;
				//`HolyTome` charge/exp/level (see the save site's comment); only the tome
				//reads these back, so a horn's `charge` saved under the same key is ignored.
				if (item.id === 'holyTome') {
					const tome = item as typeof item & { charge?: number; partialCharge?: number; exp?: number; level?: number };
					if (source?.tomeCharge !== undefined) tome.charge = source.tomeCharge;
					if (source?.tomePartialCharge !== undefined) tome.partialCharge = source.tomePartialCharge;
					if (source?.tomeExp !== undefined) tome.exp = source.tomeExp;
					if (source?.tomeLevel !== undefined) tome.level = source.tomeLevel;
				}
			}
		} else {
			this.bag = new Actors.Inventory();
			for (const item of s.bag) {
				const instanceId = item.instanceId ?? (item.id === 'clothArmor' || item.id === 'armor' || item.id === 'armorReward' || isClassArmorId(item.id) || item.id === 'weaponReward' || item.id.startsWith('ring_') ? this.newItemInstanceId(item.id) : undefined);
				this.bag.add({ ...item, instanceId, stackable: true });
				if (instanceId && s.itemSerial === undefined) this.itemSerial++;
			}
		}
		for (const item of this.bag.items) {
			if ((item as { affix?: string }).affix === 'fragile') (item as { affix?: string }).affix = 'stench';
			//Phantom weapon Swiftness (see the weaponAffix migration above): `swiftness` is only
			//a real id on armor, so a non-armor bag item carrying it is pre-correction residue.
			if ((item as { affix?: string }).affix === 'swiftness'
				&& item.id !== 'clothArmor' && item.id !== 'armor' && item.id !== 'armorReward' && !isClassArmorId(item.id)) delete (item as { affix?: string }).affix;
		}
		this.armorInstanceId ??= this.bag.find(this.armorId)?.instanceId;
		this.gameState = new Rpg.GameState();
		for (const [name, value] of s.switches) this.gameState.setSwitch(name, value);
		this.quests = Rpg.QuestLog.fromJSON(
			[SAD_GHOST_QUEST, WANDMAKER_QUEST, BLACKSMITH_QUEST, IMP_QUEST],
			{ stageIndex: s.questStages },
		);
		this.progression = Actors.Progression.fromJSON(SPD_LEVEL_CURVE, s.progressionState ?? { level: s.level, experience: s.experience });
		if (s.charges) {
			const wandSave = { ...s.charges.wand, progress: s.charges.wand.progress > 1 ? s.charges.wand.progress / 12 : s.charges.wand.progress };
			this.wandCharges = Actors.Charges.fromJSON({ max: 4, regenRate: 1 }, wandSave);
			this.tomeCharges = Actors.Charges.fromJSON({ max: 3, regenRate: 20 }, s.charges.tome);
			this.fireCharges = Actors.Charges.fromJSON({ max: 3, current: 0, regenRate: 9999 }, s.charges.fire);
			this.boltCharges = Actors.Charges.fromJSON({ max: 3, current: 0, regenRate: 9999 }, s.charges.bolt);
		}
		this.hero.hp = Math.min(s.hp, s.maxHp);
		this.hero.maxHp = s.maxHp;
		this.hero.buffs = Object.fromEntries(s.buffs ?? []) as Partial<Record<BuffId, number>>;
		//Java's Preparation stores its independent `turnsInvis` counter, not only the
		//invisibility buff. Restore it before the derived prep level is synchronized below;
		//old saves have no counter and correctly restart at Preparation level 1.
		this.prepInvisibleTurns = Math.max(0, s.prepInvisibleTurns ?? 0);
		this.hero.deferredDamage = s.deferredDamage ?? 0;
		this.hero.deferredDamageDelay = s.deferredDamageDelay ?? false;
		this.hero.corrosionTurns = s.corrosionTurns;
		this.hero.corrosionDamage = s.corrosionDamage;
		this.hero.prismaticGuardHp = s.prismaticGuardHp ?? undefined;
		if (this.hero.prismaticGuardHp === undefined) delete this.hero.buffs['prismaticGuard'];
		this.hero.shieldOfLightTarget = s.shieldOfLightTarget ?? undefined;
		if (this.hero.shieldOfLightTarget === undefined) delete this.hero.buffs['shieldOfLight'];
		this.hero.recallItemClass = s.recallItemClass ?? undefined;
		if (this.hero.recallItemClass === undefined) delete this.hero.buffs['recallUsed'];
		this.syncHeroFromStats();
		//Preparation's attack/blink tier is derived from the restored Java `turnsInvis`
		//payload and the restored invisibility buff; rebuild that mirror before the level loads.
		this.syncPreparation();
		this.enterLevel();
		this.say(t('port.log.loaded', { depth: s.depth, level: s.level }), 'highlight');
	},

	buildInterface(this: DungeonScene): void {
		//StatusPane.java anchors the compact status pane to the bottom-left of the UI camera;
		//the pane's 128x36 native frame is rendered at the port's 2x HUD scale. Its position is
		//reapplied from positionInterface() on every resize so it stays attached to the viewport.
		this.statusPane = new StatusPane(runState.sprites.uiStatusPane, runState.sprites.uiBuffs, runState.sprites.uiLargeBuffs, runState.sprites[this.heroClass], (buff) => this.showBuffInfo(buff));
		this.statusPane.x = 8;
		this.stage.addChild(this.statusPane);
		//GameScene.java's compact top-right chrome is separate from StatusPane: it carries the
		//version, floor label, carried key counters and the entry point for WndGame.
		this.dungeonHud = new DungeonHud(() => this.onAction('gameMenu'));
		this.stage.addChild(this.dungeonHud);
		this.statusPane.on('pointertap', () => {
			//InfoWindow is a spent Window after close, so create a fresh instance for each opening.
			this.infoPanel = new InfoWindow();
			this.infoPanel.show(`${capitalize(t(CLASSES[this.heroClass].nameKey))} - ${this.progression.level}`, [
				[t('windows.wndhero$statstab.health'), `${Math.max(0, this.hero.hp)}/${this.hero.maxHp}`],
				[t('windows.wndhero$statstab.str'), String(this.heroStr)],
				[t('port.ui.accuracy'), String(this.hero.accuracy)],
				[t('port.ui.evasion'), String(this.hero.evasion)],
				[t('windows.wndhero$statstab.exp'), String(this.progression.experience)],
				[t('windows.wndhero$statstab.gold'), String(this.heroStats.base('gold'))],
				[t('windows.wndhero$statstab.depth'), String(this.depth)],
				[t('windows.wndhero$statstab.dungeon_seed'), this.runSeedLabel],
			], this.windowViewport().width, this.windowViewport().height);
			this.gameWindows.push(this.infoPanel);
		});

		//StatusPane.java centers the compass around the hero avatar.
		this.compass = new Compass(runState.sprites.uiIcons);
		this.stage.addChild(this.compass);

		this.gameLog = new GameLog(320);
		this.gameLog.x = 8;
		this.gameLog.setInterfaceSize(this.interfaceSize);
		this.stage.addChild(this.gameLog);

		//see announceBuff's comment: the live scene is what turns a landed buff into text
		setAnnounceBuff((creature, id) => this.showStatus(creature, id, SPD_STATUS_COLOR.warning));
		//see attachBacklash's comment: the live scene is what turns attach-time backlash
		//damage into a number and a death - `Elemental.add()`'s hate-listed opposite-
		//element attaches (tag `v3.3.8`) deal `NormalIntRange(HT/2, HT*3/5)` instead.
		setAttachBacklash((creature, damage) => {
			if (damage > 0) this.showDamage(creature, damage);
			if (creature.hp <= 0) this.kill(creature);
		});

		//the keybind cheat-sheet used to be concatenated onto the end of the status line,
		//where it was reread every turn for information that never changes. It sits in the
		//corner on its own now; SPD needs no such list because its Toolbar's buttons are the
		//discoverable form of it, which is a later batch (see PORT_COVERAGE.md).
		this.hintLabel = new Label({
			text: t('port.hint.keys'),
			color: theme().color.textDim,
			size: 8,
		});
		this.hintLabel.alpha = 0.55;
		// The pointer toolbar exposes these actions; avoid a second line across its labels.
		this.hintLabel.visible = false;
		this.stage.addChild(this.hintLabel);

		// Toolbar.java's grouped art/layout, with fixed quick actions for this port.
		// ItemSpriteSheet.MISSILE_WEP starts at 144; Cleric uses a wand placeholder
		// because this checkout's item sheet predates HolyTome.
		const specialFrame = { warrior: 147, mage: ITEM_FRAME.wand, rogue: 146, huntress: 144, duelist: 145, cleric: ITEM_FRAME.wand }[this.heroClass];
		this.actionBar = new SpdToolbar(
			[ITEM_FRAME.scroll, ITEM_FRAME.potion, ITEM_FRAME.food, specialFrame].map(frame => this.itemsSheet.get(frame)),
			(action) => {
				if (action === 'inventory') {
					this.inventoryOpen = !this.inventoryOpen;
					this.refreshInventoryPanel();
				} else if (action === 'journal') this.openJournal();
				else this.onAction(action);
			},
			() => this.positionInterface(Game.current.width, Game.current.height),
		);
		this.stage.addChild(this.actionBar);

		this.inventoryPanel = new InventoryWindow(
			(id, instanceId) => this.useItemById(id, instanceId),
			() => { this.inventoryOpen = false; this.inventoryPanel.reset(); this.refreshInventoryPanel(); },
			{
				drop: (id, instanceId) => this.dropBagItem(id, instanceId),
				throw: (id, instanceId) => this.throwBagItem(id, instanceId),
				drink: (id, instanceId) => this.drinkBagPotion(id, instanceId),
			},
		);
		this.stage.addChild(this.inventoryPanel);
		this.refreshInventoryPanel();
		//The talent content keeps its SPD-specific layout, but the surrounding modal is a real
		//MWG Window so keyboard ownership, outside-click dismissal and world blocking come from the
		//same WindowStack as every other in-game modal. It is created lazily when first opened.
		this.talentPanel = new Container();
		this.victoryPanel = new Container();
		this.stage.addChild(this.victoryPanel);
		this.victoryPanel.visible = false;
		this.bossNameLabel = new Label({ text: '', size: 10, align: 'center', color: theme().color.textHighlight });
		this.stage.addChild(this.bossNameLabel);
		//BossHealthBar: real 64x16 chrome at an integer scale. Java's hp strip is
		//source rect (15,19,47,4), corresponding to inset (15,3) in the top frame.
		this.bossChrome = new Container();
		this.bossChrome.addChild(new Sprite(new Texture({ source: runState.sprites.uiBossHp.source, frame: new Rectangle(0, 0, 64, 16) })));
		const skull = new Sprite(new Texture({ source: runState.sprites.uiBossHp.source, frame: new Rectangle(5, 18, 6, 6) }));
		skull.position.set(5, 5); this.bossChrome.addChild(skull);
		this.bossChrome.scale.set(2);
		this.stage.addChild(this.bossChrome);
		this.bossHealthBar = new Bar({ width: 94, height: 8, fillTexture: new Texture({ source: runState.sprites.uiBossHp.source, frame: new Rectangle(15, 19, 47, 4) }), background: 0x000000, roundUpToPixel: true });
		this.stage.addChild(this.bossHealthBar);
		this.stage.addChild(this.bossNameLabel);
		this.bossNameLabel.style.fontSize = 7;
		this.bossNameLabel.alpha = 0.6;
		this.bossNameLabel.visible = false;
		this.bossChrome.visible = false;
		this.bossHealthBar.visible = false;
		this.badgeBanner = new BadgeBannerLayer(runState.sprites.uiBadges);
		this.stage.addChild(this.badgeBanner);
		//last, so a window is always over the HUD and the badge banner
		this.stage.addChild(this.gameWindows);
		this.applyWindowZoom(this.windowZoom);
		//`bossInfo`'s click -> `WndInfoMob`: no mob-info window exists in this port, so this
		//logs the same name/HP line the bar already shows, the same "detailed window
		//simplifies to a log line" pattern `awardBadge` already uses for `BadgeBanner`
		this.bossHealthBar.eventMode = 'static';
		this.bossHealthBar.cursor = 'pointer';
		this.bossHealthBar.on('pointerdown', () => {
			if (!this.currentBoss) return;
			this.say(
				t('port.log.bossinfo', {
					name: capitalize(this.currentBoss.name),
					hp: Math.max(0, this.currentBoss.hp),
					maxHp: this.currentBoss.maxHp,
				})
			);
		});
	},

	/** LastLevel's Amulet pickup ends the run with a visible, restartable result screen. */
	showVictoryPanel(this: DungeonScene): void {
		showVictoryPanelUi({ panel: this.victoryPanel, level: this.progression.level, depth: this.depth, position: () => this.positionInterface(Game.current.width, Game.current.height) });
	},

	showDefeatPanel(this: DungeonScene): void {
		showDefeatPanelUi({ panel: this.victoryPanel, level: this.progression.level, depth: this.depth, position: () => this.positionInterface(Game.current.width, Game.current.height) });
	},

	/**
	 * `GameScene.showBanner`: centers the banner on screen and tracks it until its FADE_OUT kills
	 * it (the widget removes itself; this only drops the reference). Replaces any live banner -
	 * Java shows one at a time too.
	 */
	showBanner(this: DungeonScene, banner: Banner): void {
		this.banner?.destroy();
		this.banner = banner;
		banner.position.set(Game.current.width / 2, Game.current.height / 2);
		this.stage.addChild(banner);
	},

	/** `BuffIndicator` click -> `WndInfoBuff`: shows the clicked icon's real name/description. */
	showBuffInfo(this: DungeonScene, buff: string): void {
		if (this.buffInfoOpen && !this.buffInfoOpen.closed) this.buffInfoOpen.close();
		const turns = buff === 'hungry' || buff === 'starving' ? undefined
			: buff === 'prismaticGuard' ? Math.floor(this.hero.prismaticGuardHp ?? 0)
			: this.hero.buffs[buff as BuffId];
		const info = buffInfo(buff as BuffId | 'hungry' | 'starving', turns,
			buff === 'prismaticGuard' ? prismaticGuardMaxHp(this.progression.level) : buff === 'monkEnergy' ? this.monkEnergyCap() : undefined,
			buff === 'recallUsed' ? this.recallTrackedItemName() : undefined,
			buff === 'combo' ? this.hero.combo : buff === 'monkEnergy' ? this.monk.energy : undefined);
		if (!info) return;
		const window = showBuffInfoWindow(info);
		this.buffInfoOpen = window;
		window.onClose.add(() => { if (this.buffInfoOpen === window) this.buffInfoOpen = undefined; });
		window.place(this.windowViewport().width, this.windowViewport().height);
		this.gameWindows.push(window);
	},

	/** Small explicit talent window: earned points are assigned to accuracy or evasion. */
	createTalentWindow(this: DungeonScene): void {
		const window = new Window({ width: 320, height: 220, title: t('port.action.talents'), anchor: 'center', blocker: true });
		window.onClose.add(() => {
			this.talentWindow = undefined;
			this.talentOpen = false;
			this.subclassChoiceOpen = false;
			this.armorChoiceOpen = false;
			this.augmentChoiceOpen = false;
			this.talentPanel = new Container();
			this.refresh();
		});
		this.talentWindow = window;
		this.talentPanel = window.content;
	},

	refreshTalentPanel(this: DungeonScene): void {
		if (!this.talentPanel) return;
		if (this.talentOpen && (!this.talentWindow || this.talentWindow.closed)) this.createTalentWindow();
		this.talentPanel.removeChildren().forEach((child) => child.destroy());
		if (!this.talentOpen) {
			if (this.talentWindow && !this.talentWindow.closed) this.talentWindow.close();
			return;
		}
		if (!this.talentWindow || this.talentWindow.closed) return;
		const width = Math.min(320, Math.max(240, this.windowViewport().width - 24));
		if (this.subclassChoiceOpen || this.armorChoiceOpen || this.augmentChoiceOpen) {
			const options: readonly string[] = this.augmentChoiceOpen ? AUGMENT_OPTIONS
				: this.armorChoiceOpen ? armorAbilitiesFor(this.heroClass) : (SUBCLASS_OPTIONS[this.heroClass] ?? []);
			//Augment's option text ("Speed (+20% attack speed)") is real Java's own longer wording
			//(the actual button in `WndAugment` just says "Speed"/"Damage"/"None", with the detail
			//living in a separate message block above it) - kept as-is since it already existed in
			//this file before this pass, so it gets one full-width row per option instead of armor/
			//subclass's existing 2-up column layout, which is too narrow for text this long.
			//The armor-ability list is full-width for the same reason `WndChooseAbility` uses
			//full-width buttons: three long names side by side would not fit this panel's width.
			const rows = this.augmentChoiceOpen || this.armorChoiceOpen;
			const rowHeight = this.augmentChoiceOpen ? 30 : 38;
			//The armor panel carries a description block under its three rows plus Java's own cancel
			//row - `WndChooseAbility` ends with a `cancelButton` that just hides the window, and
			//without one the crown would be forced: this panel swallows every action but 	alents`,
			//so there would be no way to close it, save, or change your mind.
			const descriptionHeight = this.armorChoiceOpen ? 46 + 24 : 0;
			const panelHeight = (rows ? 34 + options.length * (rowHeight + 4) : this.subclassChoiceOpen ? 104 : 92) + descriptionHeight;
			this.talentPanel.addChild(new Graphics().roundRect(0, 0, width, panelHeight, 6)
				.fill({ color: 0x101116, alpha: 0.98 }).stroke({ width: 2, color: 0xc9a24c }));
			const title = new Label({
				text: this.augmentChoiceOpen ? t('port.ui.augment.title') : this.armorChoiceOpen ? t('port.ui.armorability') : t('port.ui.subclass'),
				size: 13, bold: true, color: theme().color.textHighlight,
			});
			title.position.set(10, 7);
			this.talentPanel.addChild(title);
			const columnWidth = (width - 16) / options.length;
			const abilityDescription = this.armorChoiceOpen
				? new Label({ text: t('actors.hero.abilities.armorability.prompt'), size: 6, wrapWidth: width - 20, color: theme().color.textDim })
				: null;
			if (abilityDescription) {
				abilityDescription.position.set(10, 34 + options.length * (rowHeight + 4));
				this.talentPanel.addChild(abilityDescription);
				//`WndChooseAbility.cancel` is "I'll decide later", not a bare "Cancel" - keep the real
				//line rather than a shorter invented one.
				const cancel = new Button({
					width: width - 16, height: 20, text: t('windows.wndchooseability.cancel'),
					onClick: () => { this.armorChoiceOpen = false; this.talentOpen = false; this.refresh(); },
				});
				cancel.position.set(8, 34 + options.length * (rowHeight + 4) + 40);
				cancel.eventMode = 'static';
				cancel.cursor = 'pointer';
				this.talentPanel.addChild(cancel);
			}
			options.forEach((option, index) => {
				//`actors.hero.abilities.<class>.<id>` is SPD's own key namespace, so the ability's
				//real name and description come translated from the generated catalog.
				const label = this.armorChoiceOpen
					? titleCase(t(`${armorAbilityKey(option, this.heroClass)}.name`))
					: t(this.augmentChoiceOpen ? `port.ui.augment.${option}` : `port.subclass.${option}`);
				const button = new Button({
					width: rows ? width - 16 : columnWidth - 8, height: rowHeight, text: label,
					onClick: () => this.augmentChoiceOpen ? this.chooseAugment(option as (typeof AUGMENT_OPTIONS)[number])
						: this.armorChoiceOpen ? this.chooseArmorAbility(option) : this.chooseSubclass(option),
				});
				button.on('pointerover', () => {
					abilityDescription?.setText(t(`${armorAbilityKey(option, this.heroClass)}.short_desc`));
				});
				button.position.set(rows ? 8 : 8 + index * columnWidth, rows ? 34 + index * (rowHeight + 4) : 34);
				button.eventMode = 'static';
				button.cursor = 'pointer';
				this.talentPanel.addChild(button);
			});
			if (this.subclassChoiceOpen) {
				//the mask stays in the bag when the choice is put off, like the crown's "I'll decide later"
				const later = new Button({
					width: width - 16, height: 20, text: t('windows.wndchooseability.cancel'),
					onClick: () => { this.subclassChoiceOpen = false; this.talentOpen = false; this.refresh(); },
				});
				later.position.set(8, 34 + rowHeight + 8);
				later.eventMode = 'static';
				later.cursor = 'pointer';
				this.talentPanel.addChild(later);
			}
			this.talentWindow.resize(width, panelHeight + 34);
			this.talentWindow.place(this.windowViewport().width, this.windowViewport().height);
			if (this.gameWindows.top !== this.talentWindow) this.gameWindows.push(this.talentWindow);
			return;
		}
		const points = this.talentPoints[this.talentTier - 1] ?? 0;
		//Java's tier-3 tab is the single `talents.get(2)` map: class tier-3 talents
		//(Cleric's CLEANSE/LIGHT_READING) beside the subclass three, keyed by
		//talent so the class pair appears once. Other classes have no class
		//tier-3 row, so their tab is unchanged.
		const classTier3 = CLASS_TALENTS[this.heroClass]?.[2] ?? [];
		const classTier3Ids = new Set(classTier3.map((def) => def.id));
		const defs: TalentDefinition[] = this.talentTier === 3
			? [...classTier3, ...subclassTalentDefinitions(this.subclass() ?? '', this.heroClass).filter((def) => !classTier3Ids.has(def.id))]
			: this.talentTier === 4
				? armorTalentDefinitions(this.armorAbility ?? '', this.heroClass)
				: (CLASS_TALENTS[this.heroClass]?.[this.talentTier - 1] ?? []);
		const panelHeight = 138;
		this.talentPanel.addChild(new Graphics().roundRect(0, 0, width, panelHeight, 6)
			.fill({ color: 0x101116, alpha: 0.96 }).stroke({ width: 2, color: 0x8b7651 }));
		const title = new Label({ text: `${t('port.action.talents')} Â· ${t('port.talent.tier', { tier: this.talentTier })} (${points})`, size: 11, bold: true, color: theme().color.textHighlight });
		title.position.set(8, 6);
		this.talentPanel.addChild(title);
		[1, 2, 3, 4].forEach(tier => {
			const tab = new Button({ width: 38, height: 17, text: `T${tier}`, onClick: () => {
				//T4 is Java's armor-ability tier: it opens at level 20 (	ierLevelThresholds[4] - 1`)
				//and only once an ability has actually been chosen, since `Hero.talentPointsAvailable(4)`
				//returns 0 while `armorAbility == null`. An ability with no ported talent row (the
				//Cleric's, and Ratmogrify) has no tab rather than an empty one.
				//`Hero.talentPointsAvailable(3)` (`Hero.java`, tag `v3.3.8`) returns 0
				//while `subClass == NONE` - Java's tier-3 tab needs the subclass
				//choice first. This port banks tier-3 points from level 13 with
				//no subclass gate, so the literal rule would strand them until
				//(and unless) the choice is made; a class-authored tier-3 row
				//opens the tab at the level threshold instead (other classes
				//still wait for the choice, exactly as before).
				const unlocked = tier === 1
					|| (tier === 2 && this.progression.level >= TALENT_TIERS[2])
					|| (tier === 3 && this.progression.level >= TALENT_TIERS[3]
						&& (!!this.subclass() || hasClassTier3Row(this.heroClass)))
					|| (tier === 4 && this.armorAbility !== null && this.progression.level >= TALENT_TIERS[4] - 1
						&& armorTalentDefinitions(this.armorAbility, this.heroClass).length > 0);
				if (unlocked) { this.talentTier = tier as 1 | 2 | 3 | 4; this.refreshTalentPanel(); }
			} });
			tab.position.set(width - 162 + (tier - 1) * 40, 4);
			this.talentPanel.addChild(tab);
		});
		const description = new Label({ text: t('port.talent.select'), size: 6, wrapWidth: width - 16, color: theme().color.textDim });
		description.position.set(8, 108);
		this.talentPanel.addChild(description);
		defs.forEach((def: TalentDefinition, index: number) => {
			const rank = this.talentRank(def.id);
			const button = new Button({ width: width - 16, height: 17, text: `${t(talentTitleKey(def.id))}  ${rank}/${def.maxRank}`, onClick: () => {
				description.setText(t(talentDescKey(def.id)));
				const tierIndex = this.talentTier - 1;
				if (rank < def.maxRank && this.talentPoints[tierIndex] > 0) {
					this.talentPoints[tierIndex]--;
					this.talentRanks[def.id] = rank + 1;
					//`Talent.onTalentUpgraded()`'s rank-2 intuition identify (tag `v3.3.8`):
					//reaching rank 2 identifies whatever's *already* equipped, not just future
					//equips - real Java fires this the instant the point is spent. Equipped
					//gear now carries a real identified flag (`weaponIdentified`/
					//`armorIdentified`/`EquippedRing.identified`, see `items/equipment.ts`),
					//so this has an observable target where it used to have none. Rank 1's
					//Thief's Intuition `setKnown()` (type known, level/curse still hidden)
					//stays unported - this port's binary `identified` ring model has no
					//separate type-known state to set.
					this.identifyOnTalentUpgraded(def.id, rank + 1);
					this.syncHeroFromStats();
					this.say(t('port.log.talentspent', { stat: t(talentTitleKey(def.id)) }), 'positive');
					this.refresh();
				}
			} });
			button.position.set(8, 27 + index * 16);
			this.talentPanel.addChild(button);
		});
		this.talentWindow.resize(width, panelHeight + 34);
		this.talentWindow.place(this.windowViewport().width, this.windowViewport().height);
		if (this.gameWindows.top !== this.talentWindow) this.gameWindows.push(this.talentWindow);
	},

	talentRank(this: DungeonScene, id: string): number { return this.talentRanks[id] ?? 0; },

	/**
	 * The worn ring as the ring formulas should read it. `Talent.ENHANCED_RINGS` grants +1
	 * *upgrade level* while `enhancedRingsTurns` runs, so the ring is presented one level
	 * higher and the existing `ringBonusLevel` translation (uncursed `level + 1`, cursed
	 * `min(0, level - 2)`, AntiMagic gate) applies unchanged. Write sites (equip, cleanse,
	 * transmute, save) keep using the raw `equippedRing`; every formula read goes here.
	 */
	effectiveRing(this: DungeonScene): EquippedRing | null {
		if (!this.equippedRing) return null;
		if (this.enhancedRingsTurns <= 0) return this.equippedRing;
		return { ...this.equippedRing, level: this.equippedRing.level + 1 };
	},

	/**
	 * `Trinity.SpiritForm`'s stored ring (`SpiritForm.SpiritFormBuff.ring()`, tag `v3.3.8`):
	 * an *independent* second ring, granted a 20-turn `SpiritFormBuff` regardless of the
	 * hero's own equipped ring slot - but Java's real combination rule is a **fallback, not a
	 * stack**: `Ring.getBuffedBonus()` only adds the spirit ring's bonus when the equipped
	 * ring's own bonus *for that exact stat* is precisely 0 (an equipped ring of a *different*
	 * stat, or none at all, still counts as 0 for the stat the spirit ring provides). Every
	 * ring-formula call site combines both reads through `combinedStatBonusLevel`, never blends
	 * into one `EquippedRing`. Its level is `SpiritForm.ringLevel() = pointsInTalent(SPIRIT_FORM)`
	 * (0-3, cursed never - Trinity's synthetic instance has no curse state), read fresh every
	 * time rather than cached, since the talent rank cannot change while the form is active.
	 * `null` outside an active ring-effect SpiritForm (including the not-yet-offered Chalice
	 * case, which shares this buff but is not a `Ring`).
	 */
	trinitySpiritRing(this: DungeonScene): EquippedRing | null {
		if (this.trinityForm !== 'spirit' || this.trinityTurns <= 0 || !this.trinitySpiritEffect) return null;
		if (!ringDef(this.trinitySpiritEffect)) return null;
		return { id: this.trinitySpiritEffect, level: this.talentRank('spirit_form'), cursed: false };
	},

	/**
	 * `Talent.LIGHT_CLOAK`'s cross-hero half (`meta_desc` in the talent strings): gained by a
	 * non-Rogue, it raises every artifact's charging speed by 7/13/20% at +1/+2/+3. Rogues
	 * get nothing here - their half is the unequipped-use rate, which is moot because a
	 * carried cloak is always usable (see `lightCloakRechargeRate`'s note in
	 * 	alentEffects.ts`). Folded into the existing energy-ring multiplier at helper call
	 * sites (multiplication commutes, so the fold is exact, not an approximation) and
	 * multiplied directly onto the scene-owned per-turn gains. Unreachable through the
	 * class-gated talent pools today - like every other `meta_desc` branch - but live the
	 * moment a rank exists, the same way `effectiveRing()` is.
	 */
	lightCloakChargeMultiplier(this: DungeonScene): number {
		if (this.heroClass === 'rogue') return 1;
		return 1 + lightCloakArtifactBonus(this.talentRank('light_cloak'));
	},

	effectiveZapLevel(this: DungeonScene): number {
		return this.weaponLevel + this.empoweredZapBonus;
	},

	/**
	 * Turn-cost multiplier for hero actions, based on equipped gear and buffs.
	 * <1 = faster actions (Weapon.Augment SPEED, Swiftness glyph)
	 * >1 = slower actions (encumbrance penalties, once modeled)
	 * Default: 1 (no modifier)
	 */
	getActionTurnCostMod(this: DungeonScene): number {
		let mod = 1;
		// Armor.speedFactor()/Swiftness.java (tag v3.3.8): when no hostile actor is
		// within PathFinder distance 3, speed is multiplied by
		// `(1.2 + 0.04 * buffedLvl) * procChanceMultiplier()`. Turn cost is the
		// inverse of speed, so apply that multiplier as a divisor here.
		if (this.armorGlyphActive() && this.armorGlyph === 'swiftness') {
			const hasNearbyEnemy = this.hasSwiftnessEnemyNearby();
			if (!hasNearbyEnemy) {
				const level = Math.max(0, this.degradedLevel(this.armorLevel));
				mod /= (1.2 + 0.04 * level) * this.genericProcMultiplier();
			}
		}
		// Armor.speedFactor()/Flow.java (tag v3.3.8): Flow multiplies speed by
		// `(2 + 0.5 * buffedLvl) * procChanceMultiplier()` while the hero stands
		// in water. As with Swiftness above, this speed factor is represented by
		// dividing the shared action cost.
		if (this.armorGlyphActive() && this.armorGlyph === 'flow' && this.level.get(this.hero.x, this.hero.y) === WATER) {
			const level = Math.max(0, this.degradedLevel(this.armorLevel));
			mod /= (2 + 0.5 * level) * this.genericProcMultiplier();
		}
		//`Bulk.speedBoost()` (`items/armor/curses/Bulk.java`, tag `v3.3.8`): the curse
		//has no proc - it fires in `Char.speed()` - and it is a REDUCTION: speed
		//x`(1/3 x Arcana)` in an open or closed doorway ("more of a reduction
		//really"), so arcana mitigates it upward and it never helps. What stood
		//here divided the turn cost by a flat 3 - three times FASTER in doorways,
		//the exact inverse of the curse, with no arcana term at all.
		if (this.armorGlyph === 'bulk' && this.doors.isDoor(this.hero.x, this.hero.y)) mod /= (1 / 3) * this.genericProcMultiplier();
		//Char.speed()'s real `if (buff(Haste.class)) speed *= 3f` (PotionOfHaste).
		if (this.hero.buffs['haste']) mod /= 3;
		//`Hero.speed()`'s Nature's-Power line: `speed *= 2 + 0.25*GROWING_POWER` while the tracker is
		//up, expressed as the turn-cost divisor this method uses for every other speed effect.
		mod /= this.naturesPowerSpeedFactor();
		//Chill.speedFactor(): speed falls by 10% per remaining turn, capped at 50%.
		if (this.hero.buffs['chill']) mod /= Math.max(0.5, 1 - this.hero.buffs['chill']! * 0.1);
		//RingOfHaste.speedMultiplier(): a higher Char.speed() means less time per action in
		//real Java; this port's turn-cost multiplier expresses the same relationship inverted.
		mod /= ringHasteMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing());
		return mod;
	},

	/** Java's `PathFinder.buildDistanceMap(hero.pos, passable, 3)` used by
	 * `Swiftness.speedBoost()` (`items/armor/glyphs/Swiftness.java`, tag `v3.3.8`):
	 * eight-way terrain distance, not a raw coordinate radius - an ENEMY-aligned
	 * creature within 3 path steps suppresses the boost. The old flood stopped at
	 * 2, so an enemy exactly 3 steps out wrongly left the hero hasted. */
	hasSwiftnessEnemyNearby(this: DungeonScene): boolean {
		const reachable = new Set<string>([`${this.hero.x},${this.hero.y}`]);
		let frontier: Step[] = [{ x: this.hero.x, y: this.hero.y }];
		for (let distance = 0; distance < 3; distance++) {
			const next: Step[] = [];
			for (const cell of frontier) {
				for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
					const at = { x: cell.x + dx, y: cell.y + dy };
					const key = `${at.x},${at.y}`;
					if (reachable.has(key) || !this.level.passable(at.x, at.y)) continue;
					reachable.add(key);
					next.push(at);
				}
			}
			frontier = next;
		}
		return this.creatures.some((c) => !c.isHero && !c.isNPC && !c.isAlly && reachable.has(`${c.x},${c.y}`));
	},

	/**
	 * `Hero.attackDelay()`'s turn cost: the blanket `getActionTurnCostMod()` divided by
	 * `RingOfFuror.attackSpeedMultiplier()`, times the weapon's own `Augment.delayFactor`
	 * (real Java: `attackDelay() = 1 * weapon.delayFactor(this)`, and
	 * `Weapon.delayFactor()` folds `augment.delayFactor(DLY)` before the Furor-driven
	 * `speedMultiplier` divides it back down - `Weapon.java` at tag `v3.3.8`: `SPEED(0.7f,
	 * 2/3f)`, `DAMAGE(1.5f, 5/3f)`, `NONE(1f, 1f)`). Real Java keeps `attackDelay()` and
	 * `Char.speed()` as two separate cost functions; this port previously had only the
	 * single blanket cost, so Furor (and now the augment's delay half) had no faithful
	 * place to land. Only bump-attacks use this (see the `move` port's enemy pre-check) -
	 * movement, search, and item-use turns keep the blanket cost, matching Java's own split
	 * where neither Furor nor a weapon augment's delay factor ever touches those.
	 * **Found in the 2026-09-09 item-system audit**: this previously applied the augment's
	 * delay as a flat `0.8` on the *blanket* `getActionTurnCostMod()` (speeding up movement
	 * too, not just attacks) and never modeled `DAMAGE`'s real 5/3 delay penalty at all -
	 * both fixed here, alongside `attack()`'s damage-factor numbers (0.7/1.5, not a bare 1.2).
	 */
	getAttackTurnCostMod(this: DungeonScene): number {
		const augmentDelayFactor = this.weaponAugment === 'speed' ? 2 / 3 : this.weaponAugment === 'damage' ? 5 / 3 : 1;
		//`Scimitar` sword dance: +60% attack speed while up (`ability_desc`).
		const danceFactor = this.swordDanceTurns > 0 ? 1 / 1.6 : 1;
		//`Hero.attackDelay()`: `weapon.delayFactor` - the class's `DLY` (gloves/sai/gauntlet 0.5, scimitar 0.8, spear/glaive 1.5).
		const weaponDelay = weaponCombat(this.weaponMeleeKey(), this.weaponTier, 0).delay;
		return (this.getActionTurnCostMod() / ringFurorMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing())) * augmentDelayFactor * danceFactor * weaponDelay;
	},

	chooseSubclass(this: DungeonScene, option: string): void {
		if (!this.subclassChoiceOpen || !(SUBCLASS_OPTIONS[this.heroClass] ?? []).includes(option)) return;
		//`TengusMask.choose()`: the mask is detached and consumed. Java lets the mask be worn at any
		//level, so the track's level-13 threshold is passed as the choose level rather than the
		//hero's own (the tier-3 talent tab still waits for level 13 itself).
		this.advancement.choose(0, option, Math.max(this.progression.level, SUBCLASS_TRACK.tiers[0]!.threshold));
		this.subclassChoiceOpen = false;
		this.talentOpen = false;
		this.bag.remove('tengusMask', 1);
		this.say(t('items.tengusmask.used'), 'positive');
		this.say(t('port.log.talent', { talent: t(`port.subclass.${option}`) }), 'highlight');
		if (option === 'berserker') addBuff(this.hero, 'berserk');
		//`MonkEnergy` starts empty and carries the status icon; the invented `focus` grant that stood here is gone.
		if (option === 'monk_sub') this.monkEnsureBuff();
		this.syncHeroFromStats();
		this.refresh();
		//`TengusMask.choose()`: `curUser.spend(Actor.TICK)` - wearing it costs a turn.
		this.spendHeroTurn(1);
	},

	/**
	 * `KingsCrown.upgradeArmor()`'s state changes. The armor ability itself becomes the hero's, the
	 * class armor is created at 50 charge (`ClassArmor.upgrade()`'s `classArmor.charge = 50`), and
	 * the ability's four T4 talents become spendable (`Talent.initArmorTalents`).
	 *
	 * The T4 point pool is granted up to Java's current entitlement rather than only from the next
	 * level-up, because a crown found on depth 6 grants the whole tree immediately and real Java's
	 * count is a function of level, not of when the choice happened: `Hero.talentPointsAvailable(4)`
	 * is `1 + level - tierLevelThresholds[4]` once `level >= 21` (1 point at level 21, 10 at level
	 * 30) with `31 - 21 = 10` as the hard cap, i.e. `min(level - 20, 10)`, and 0 at or below level
	 * 20. Since tier-4 points are only ever granted while the hero holds an ability with a ported
	 * tree (see `gainExperience`), adding the current entitlement here cannot double-count for the
	 * level-up path. A second crown would grant again, but `KingsCrown` is `unique` in Java and this
	 * port drops exactly one (the Dwarf King's), and the Rat King's exchange consumes that same one,
	 * so there is never a second crown to use.
	 */
	/**
	 * `ClassArmor.upgrade()`'s item half (`ClassArmor.java` 97-137, via `KingsCrown.upgradeArmor()`
	 * swapping the worn piece for it): the worn armor becomes the hero's per-class subclass,
	 * keeping its tier, level, glyph, curse and infusion state - those all ride this port's
	 * unchanged scalars, and `upgrade()`'s `identify()` is the `armorIdentified = true` below.
	 * `augment` has no armor model here and `masteryPotionBonus` is not applied (`strReq.ts`),
	 * so those two transfers have nothing to attach to. The seal transfers only for the Warrior
	 * (`upgrade()` affixes it inside the `WARRIOR` case alone); every other class loses it here,
	 * the way Java's detach of the old armor destroys it.
	 */
	wearClassArmor(this: DungeonScene): void {
		this.armorId = CLASS_ARMOR_ID_BY_CLASS[this.heroClass] ?? this.armorId;
		this.armorIdentified = true;
		if (this.heroClass !== 'warrior') this.armorSealed = false;
	},

	grantArmorAbility(this: DungeonScene, ability: string): void {
		this.armorAbility = ability;
		this.armorCharge = ARMOR_CHARGE_START;
		const entitlement = Math.max(0, Math.min(this.progression.level - (TALENT_TIERS[4] - 1), TALENT_TIERS[5] - TALENT_TIERS[4]));
		this.talentPoints[3] += entitlement;
		this.say(t('port.log.armorabilitychosen', { ability: titleCase(t(`${armorAbilityKey(ability, this.heroClass)}.name`)) }), 'highlight');
	},

	/** Whether the hero's current ability has a tier-4 tree this port can actually spend points in
	 *  (`Talent.initArmorTalents` registers one for every ability; Ratmogrify's row registers its
	 *  three rat talents, of which RATLOMACY/RATFORCEMENTS run and RATSISTANCE's damage factor is
	 *  still open - see `armorTalentDefinitions`). */
	hasArmorTalentTree(this: DungeonScene): boolean {
		return this.armorAbility !== null && armorTalentDefinitions(this.armorAbility, this.heroClass).length > 0;
	},

	chooseArmorAbility(this: DungeonScene, option: string): void {
		const def = armorAbilityDef(option);
		if (!this.armorChoiceOpen || !def || def.classId !== this.heroClass) return;
		this.armorChoiceOpen = false;
		//`upgradeArmor()` detaches the crown as it transforms the armor.
		this.bag.remove('kingsCrown', 1);
		this.wearClassArmor();
		this.grantArmorAbility(option);
		this.refresh();
	},

	/** Opens the generic item picker over a snapshot of eligible bag entries. The pick
	 * callback runs with the chosen entry's id/instanceId; a cancel row closes the panel with
	 * no callback (the consuming item is never spent on a cancel - Java's known-scroll cancel
	 * path; the identifiedByUse/already-detached nuance has no expression here since this
	 * port consumes use-on-item scrolls only on completion). The picker is a real MWG Window,
	 * so cancellation and outside clicks are handled by WindowStack rather than scene flags. */
	openItemPicker(this: DungeonScene,
		title: string,
		entries: { id: string; instanceId?: string; identified?: boolean; quantity: number; note?: string }[],
		onPick: (entry: { id: string; instanceId?: string }) => void,
		body?: string
	): void {
		this.itemPickerWindow?.close();
		this.itemPickerOpen = true;
		this.itemPickerTitle = title;
		this.itemPickerBody = body;
		this.itemPickerEntries = entries;
		this.itemPickerOnPick = onPick;
		const width = Math.min(320, Math.max(240, this.windowViewport().width - 24));
		this.itemPickerWindow = createItemPickerWindow({
			width,
			title,
			body,
			entries,
			displayName: (id, identified, instanceId) => this.itemDisplayName(id, identified, instanceId),
			onPick: (index) => this.chooseItemPicker(index),
			onCancel: () => this.clearItemPicker(),
		});
		this.gameWindows.push(this.itemPickerWindow);
	},

	/** Picker row (or cancel, with index -1): close the panel, then run the stored callback
	 * for a real pick. The callback re-validates the entry against the live bag first -
	 * the panel blocks hero actions while open, but this mirrors Java's own FIXME safety
	 * check on `curItem` rather than trusting the snapshot. */
	chooseItemPicker(this: DungeonScene, index: number): void {
		if (!this.itemPickerOpen) return;
		const cb = this.itemPickerOnPick;
		const entry = index >= 0 ? this.itemPickerEntries[index] : undefined;
		this.itemPickerWindow?.close();
		this.clearItemPicker(false);
		if (entry && cb) cb({ id: entry.id, instanceId: entry.instanceId });
	},

	/** Clears picker-only state after WindowStack closes the modal, including an outside click. */
	clearItemPicker(this: DungeonScene, refresh = true): void {
		this.itemPickerOpen = false;
		this.itemPickerEntries = [];
		this.itemPickerBody = undefined;
		this.itemPickerOnPick = null;
		this.itemPickerWindow = undefined;
		if (refresh) this.refresh();
	},

	/**
	 * Opens the executable subset of the Java alchemy catalogue. The window flow itself
	 * (pickers, craft tail, recipe list) lives in `items/alchemy.ts` behind
	 * `AlchemyFlowContext` - the file-size refactor's first extraction, behavior-identical.
	 */
	alchemyFlowContext(this: DungeonScene): AlchemyFlowContext {
		const scene = this;
		return {
			bag: scene.bag,
			get alchemyEnergy() { return scene.alchemyEnergy; },
			set alchemyEnergy(value: number) { scene.alchemyEnergy = value; },
			say: this.say.bind(this),
			openItemPicker: (title, entries, onPick) => this.openItemPicker(title, entries, onPick),
			itemDisplayName: (id, identified) => this.itemDisplayName(id, identified),
			refreshInventoryPanel: this.refreshInventoryPanel.bind(this),
		};
	},

	/** Runestone use-action dispatch, one entry per ported stone id (was a 7-branch else-if
	 * chain in `useItemById`, converted to a table per the section-11 KISS note so each newly
	 * ported stone adds one line, not one more clause). The generic `'stone'` id has no entry
	 * and falls through silently, like every other unhandled bag id. */
	useStoneById(this: DungeonScene, id: string, instanceId?: string): void {
		routeStoneAction(this.stoneActionContext(), id, instanceId);
	},

	/**
	 * `Talent.onScrollUsed()`/`onRunestoneUsed()`'s `RECALL_INSCRIPTION` Cleric half
	 * (tag `v3.3.8`): a Cleric with the talent records the used scroll/stone's class
	 * in the `UsedItemTracker` (300 turns at rank 2, else 10) for the recall spell.
	 * No-op for everyone else. (Upgrade scrolls never reach this - the read flow
	 * refuses them first; the non-Cleric refund half needs metamorphosis.)
	 */
	armRecallInscription(this: DungeonScene, sourceClass: string): void {
		if (this.heroClass !== 'cleric' || this.talentRank('recall_inscription') <= 0) return;
		addBuff(this.hero, 'recallUsed', recallTrackerDuration(this.talentRank('recall_inscription')));
		this.hero.recallItemClass = sourceClass;
	},

	/**
	 * `RecallInscription.chargeUse()`/`canCast()`'s tracker read (tag `v3.3.8`): the
	 * armed item class while the `UsedItemTracker` buff runs, `undefined` once it
	 * lapses (a lingering class field without the buff is a stale save, refused).
	 */
	recallTrackedClass(this: DungeonScene): string | undefined {
		if (this.hero.buffs['recallUsed'] === undefined) return undefined;
		return this.hero.recallItemClass;
	},

	/**
	 * `UsedItemTracker.desc()`'s `%1$s` (`RecallInscription.java`, tag `v3.3.8`):
	 * the tracked item's display name, mapped back from its Java class through the
	 * recall tables. `undefined` when the tracker lapsed (the window shows `?`).
	 */
	recallTrackedItemName(this: DungeonScene): string | undefined {
		const tracked = this.recallTrackedClass();
		if (tracked === undefined) return undefined;
		const portId = recallTrackedPortId(tracked);
		if (portId === undefined) return undefined;
		return this.itemDisplayName(portId, true);
	},

	stoneActionContext(this: DungeonScene): StoneActionContext {
		return {
			useStoneOfAugmentation: this.useStoneOfAugmentation.bind(this), useStoneOfFear: this.useStoneOfFear.bind(this),
			useStoneOfDeepSleep: this.useStoneOfDeepSleep.bind(this), useStoneOfShock: this.useStoneOfShock.bind(this),
			useStoneOfBlast: this.useStoneOfBlast.bind(this), useStoneOfBlink: this.useStoneOfBlink.bind(this),
			useStoneOfClairvoyance: this.useStoneOfClairvoyance.bind(this), useStoneOfEnchantment: this.useStoneOfEnchantment.bind(this),
			useStoneOfIntuition: this.useStoneOfIntuition.bind(this), useStoneOfDetectMagic: this.useStoneOfDetectMagic.bind(this),
			useStoneOfFlock: this.useStoneOfFlock.bind(this), useStoneOfAggression: this.useStoneOfAggression.bind(this),
		};
	},

	/** `Stylus`'s `INSCRIBE` action and `itemSelector`: the Java item picker may select any
	 * armor, then refuses unidentified or cursed armor before consuming the stylus. This port
	 * reuses its generic bag picker (equipped gear is not exposed by that picker) and rolls the
	 * real good-glyph pool; the selected armor remains in the bag, just as Java's item object does.
	 * The inscription animation and two-turn busy state have no equivalent UI/timing seam here.
	 */
	useStylus(this: DungeonScene, instanceId?: string): void {
		useStylusFlow(this.stylusContext(), instanceId);
	},

	/**
	 * The ArcaneStylus inscribe flow lives in `items/spells.ts` behind `StylusContext` -
	 * the file-size refactor's twenty-third extraction (with Alchemize below),
	 * behavior-identical.
	 */
	stylusContext(this: DungeonScene): StylusContext {
		const scene = this;
		type Armor = { id: string; instanceId?: string; quantity: number; identified?: boolean; cursed?: boolean; affix?: string };
		const carried = () => scene.bag.items as Armor[];
		return {
			hasStylus: (instanceId) => scene.bag.find('stylus', instanceId) !== undefined,
			consumeStylus: (instanceId) => { scene.bag.remove('stylus', 1, instanceId); },
			openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
			armors: () => [...carried()],
			findArmor: (id, instanceId) => carried().find((item) => item.quantity > 0
				&& item.id === id && (item.instanceId ?? undefined) === (instanceId ?? undefined)) ?? null,
			rollGlyph: () => rollGeneratedAffix(GLYPH_TABLE, false, true) ?? null,
			say: scene.say.bind(scene),
			t,
		};
	},

	useAlchemize(this: DungeonScene, instanceId?: string): void {
		useAlchemizeFlow(this.alchemizeContext(), instanceId);
	},

	/**
	 * The Alchemize energize flow lives in `items/spells.ts` behind `AlchemizeContext` -
	 * the file-size refactor's twenty-third extraction (with Stylus above),
	 * behavior-identical.
	 */
	alchemizeContext(this: DungeonScene): AlchemizeContext {
		const scene = this;
		return {
			hasSpell: (id, instanceId) => scene.bag.find(id, instanceId) !== undefined,
			consumeSpell: (id, instanceId) => { scene.bag.remove(id, 1, instanceId); },
			openPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
			energizables: () => [...scene.bag.items],
			findEnergizable: (id, instanceId) => scene.bag.items.find((item) => item.quantity > 0
				&& item.id === id && (item.instanceId ?? undefined) === (instanceId ?? undefined)) ?? null,
			bankEnergy: (amount) => { scene.alchemyEnergy += amount; },
			consumeTarget: (id, instanceId) => { scene.bag.remove(id, 1, instanceId); },
			markIdentified: (target) => { target.identified = true; },
			targetName: (target) => scene.itemDisplayName(target.id, target.identified ?? false, target.instanceId),
			refreshPanels: () => { scene.refreshInventoryPanel(); },
			say: scene.say.bind(scene),
			t,
		};
	},

	/** `StoneOfFlock.activate(cell)`: Java fills every reachable non-solid cell within distance
	 * two with a temporary Sheep NPC. This port has no thrown-cell targeting, so the hero's
	 * cell is the center; the same radius is represented by a Chebyshev circle and each sheep
	 * uses the shared scheduled ally path with a tinted rat carrier sprite. */
	useStoneOfFlock(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfFlock(this.stoneContext(), instanceId);
	},

	/** `StoneOfAggression.activate(cell)`: real Java marks the target for 20 turns, or
	 * `Aggression.DURATION / 4` (5 turns) when it is a BOSS **or MINIBOSS** - that is the whole
	 * condition, `Char.hasProp(ch, Property.BOSS) || Char.hasProp(ch, Property.MINIBOSS)`, not the
	 * target's alignment: an ordinary enemy gets the full 20 turns. This port used to shorten
	 * every non-ally to 5, i.e. 4x too short for every ordinary enemy, which this project's own
	 * coverage row then recorded as Java's rule. `addBuff` already applies the 20-turn default
	 * from `mwlBuffDurations`, so only the short case needs overriding. With no map-cell picker,
	 * this port uses the same nearest-visible-enemy convention as the other combat stones; the
	 * shared aggression branch then supports enemy-vs-enemy and enemy-vs-ally combat. */
	useStoneOfAggression(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfAggression(this.stoneContext(), instanceId);
	},

	/** `StoneOfAugmentation.usableOnItem()`/`onItemSelected()`: real Java lets the player pick
	 * any enchantable weapon or armor to augment; this port auto-targets the hero's own equipped
	 * weapon (armor augment - `Armor.Augment.EVASION`/`DEFENSE`, an unrelated stat trade-off, not
	 * a turn-cost/damage thing - is not modeled at all, the same auto-target-rather-than-a-picker
	 * convention `ScrollOfIdentify`/`ScrollOfRemoveCurse` already use). Consumes the stone and
	 * opens the same choice panel the level-up armor-ability/subclass windows use.
	 */
	useStoneOfAugmentation(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfAugmentation(this.stoneContext(), instanceId);
	},

	/** `StoneOfAugmentation.apply(Weapon, augment)`: sets the real `Weapon.Augment` this port
	 * already fully models (`weaponAugment`, read by `getActionTurnCostMod`/the damage-modifier
	 * chain). Real Java's stone also grants a genuine `ScrollOfUpgrade.upgrade()` bonus alongside
	 * the augment choice; this port's own upgrade path is tier-based rather than a plain +1 level
	 * (`upgradeGear`'s weaponTier/weaponLevel split), with no equivalent free-standing "+1 level"
	 * primitive to reuse without also advancing the tier state machine unexpectedly - so only the
	 * augment choice itself is reproduced here, stated as a deliberate, narrower simplification
	 * rather than silently dropped. */
	chooseAugment(this: DungeonScene, option: (typeof AUGMENT_OPTIONS)[number]): void {
		if (!this.augmentChoiceOpen) return;
		this.augmentChoiceOpen = false;
		this.weaponAugment = option;
		this.say(t('port.log.augmentchosen', { augment: t(`port.ui.augment.${option}`) }), 'highlight');
		this.refresh();
	},

	/** `StoneOfFear.activate(cell)`: real Java throws the stone at a chosen cell and applies a
	 * 20-turn `Terror` (`Terror.DURATION`) to whatever's there, unless it's an ally. This port now
	 * aims for real - a click (or arrow keys) picks the cell through MWG 0.7.7's renderer-free
	 * `TargetingController`, and the stone is consumed only once a legal cell is confirmed, so
	 * cancelling is free. 	error` is the same buff `ScrollOfTerror`
	 * already grants and 	akeMonsterTurn` already honors, so no new mechanic was needed here -
	 * only a new item id/use-action to reach it, the same gap `StoneOfAugmentation` closed for
	 * weapon augments. */
	useStoneOfFear(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfFear(this.stoneContext(), instanceId);
	},

	/** `StoneOfDeepSleep.activate(cell)`: real Java applies a gradual `MagicalSleep` debuff (a
	 * few turns of `Drowsy` before the target actually falls asleep) to a mob at a thrown-to cell.
	 * This port already collapses that same gradual-then-asleep shape to an instant `sleeping =
	 * true` for `ScrollOfLullaby` (see its own comment), so this stone reuses the identical
	 * simplification rather than inventing a second one - the only difference from Lullaby is
	 * hitting one cell the player aims at instead of every visible mob at once, matching Java's
	 * own single-cell-vs-whole-screen distinction between the two items. */
	useStoneOfDeepSleep(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfDeepSleep(this.stoneContext(), instanceId);
	},

	/** `StoneOfShock.activate(cell)`: real Java paralyzes every char within a `PathFinder`
	 * distance-2 area of the thrown-to cell (each `Buff.prolong(n, Paralysis.class, 1f)`, a
	 * 1-turn paralysis distinct from the flat 3-turn `paralysis` this port's own buff table
	 * already uses for every other paralysis source) and refunds the hero's wand `1 + hits`
	 * charges. This port aims the stone for real (a click picks the cell) but has no
	 * BFS-through-open-floor distance map handy in `main.ts`, so the area is approximated: the
	 * area is a plain Chebyshev-distance-2 circle around the aimed cell (ignoring walls, unlike
	 * Java's real flood fill), and
	 * every hit gets this port's existing 3-turn `paralysis` rather than a bespoke 1-turn variant
	 * (the shared `addBuff`/`BUFF_DURATION` mechanism has no per-call duration override) - stated
	 * simplifications, not silently dropped precision. The wand-charge refund is reproduced
	 * exactly, since `Actors.Charges.refund` already exists and no-ops harmlessly for classes
	 * without a wand, matching Java's own generic (and here mostly inert) `Belongings.charge()`. */
	useStoneOfShock(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfShock(this.stoneContext(), instanceId);
	},

	/** `Bomb.execute(AC_LIGHTTHROW)` + `onThrow()`: lighting the fuse and throwing the bomb
	 * at a chosen passable, non-chasm cell, where it lands as a lit heap and `Bomb.Fuse`
	 * detonates it after 2 further turns. Refuses WITHOUT consuming when no free cell exists
	 * around a character target (pits/chasms are excluded - Java never lights a fuse over a pit
	 * either). The blast itself is `detonateGroundBomb`.
	 * `EnhanceBomb` recipes now produce identified specialty bomb ids. Their fuse and base
	 * explosion use this same path; per-bomb payload effects remain explicitly tracked in
	 * `PORT_COVERAGE.md` until each Java subclass has a matching status/terrain seam. */
	useBomb(this: DungeonScene, bombId = 'bomb', instanceId?: string): void {
		aimBombFlow(this.bombAimContext(), bombId, instanceId);
	},

	/**
	 * The bomb throw-aim flow lives in `items/bombs.ts` behind `BombAimContext` - the
	 * file-size refactor's twenty-fourth extraction, behavior-identical. The detonate
	 * half already lived there; only the aimer joins it.
	 */
	bombAimContext(this: DungeonScene): BombAimContext {
		const scene = this;
		return {
			hasBomb: (bombId, instanceId) => scene.bag.find(bombId, instanceId) !== undefined,
			beginAim: (opts) => scene.beginAiming(opts),
			canTargetCell: (x, y) => scene.level.passable(x, y) && !scene.isChasmCell(x, y),
			aimRange: () => mwlItemEffectValue('bombs', 'targetRange'),
			get pendingTarget() { return scene.bombTarget; },
			set pendingTarget(cell) { scene.bombTarget = cell; },
			detonateAt: (target, bombId, instanceId) => { useItemBomb(scene.bombContext(target), bombId, instanceId); },
		};
	},

	/** `Honeypot.execute()`'s SHATTER and THROW in one port action: aiming at the hero's own
	 * cell shatters at the feet (`AC_SHATTER`), any other confirmed cell is the throw landing
	 * (`onThrow`). The aim gate is the bomb's (passable, non-chasm) - Java would also let a pot
	 * fly over a pit and land intact there, which this aim path refuses outright instead.
	 * Throw range follows the thrown-weapon convention (6); Java flies the full PROJECTILE line. */
	useHoneypot(this: DungeonScene, instanceId?: string): void {
		useHoneypotFlow(this.honeypotContext(), instanceId);
	},

	/**
	 * The honeypot throw/shatter flow lives in `items/honeypot.ts` behind
	 * `HoneypotFlowContext` - the file-size refactor's twenty-second extraction,
	 * behavior-identical.
	 */
	honeypotContext(this: DungeonScene): HoneypotFlowContext {
		const scene = this;
		return {
			hasPot: (instanceId) => scene.bag.find('honeypot', instanceId) !== undefined,
			consumePot: (instanceId) => { scene.bag.remove('honeypot', 1, instanceId); },
			beginAim: (opts) => scene.beginAiming(opts),
			canTargetCell: (x, y) => scene.level.passable(x, y) && !scene.isChasmCell(x, y),
			get pendingTarget() { return scene.honeypotTarget; },
			set pendingTarget(cell) { scene.honeypotTarget = cell; },
			occupantAt: (x, y) => scene.creatureAt(x, y),
			isSpawnFree: (x, y) => scene.level.inside(x, y)
				&& (scene.level.passable(x, y) || scene.isChasmCell(x, y))
				&& !scene.creatureAt(x, y),
			releaseBee: (at, potPos, holderId) => {
				const bee = scene.spawnMonster('bee', at);
				bee.sleeping = false;
				bee.seesHero = false;
				bee.lastSeen = undefined;
				bee.potPos = { ...potPos };
				if (holderId !== null) bee.potHolderId = holderId;
			},
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
		};
	},

	useBrew(this: DungeonScene, brewId: string, instanceId?: string): void {
		useBrewFlow(this.brewFlowContext(), brewId, instanceId);
	},

	/**
	 * The brew throw/aim/shatter flow lives in `simulation/brews.ts` behind
	 * `BrewFlowContext` - the file-size refactor's fifteenth extraction, behavior-identical.
	 * Blob seeding, the ooze affliction and the pending-aim cell stay scene-side; the
	 * module only decides them.
	 */
	brewFlowContext(this: DungeonScene): BrewFlowContext {
		const scene = this;
		return {
			get levelSize() { return { width: scene.level.width, height: scene.level.height }; },
			get pendingTarget() { return scene.brewTarget; },
			set pendingTarget(cell) { scene.brewTarget = cell; },
			hasBrew: (brewId, instanceId) => scene.bag.find(brewId, instanceId) !== undefined,
			consumeBrew: (brewId, instanceId) => { scene.bag.remove(brewId, 1, instanceId); },
			beginAim: (opts) => scene.beginAiming(opts),
			canTargetCell: (x, y) => scene.level.passable(x, y) && !scene.isChasmCell(x, y),
			isSolid: (x, y) => !scene.level.inside(x, y) || !scene.level.passable(x, y),
			creatureAt: (x, y) => scene.creatureAt(x, y),
			afflictOoze: (creature) => { addBuff(creature as Creature, 'ooze'); },
			seedBlob: (kind, x, y, volume) => {
				if (kind === 'inferno') scene.inferno.seed(x, y, volume);
				else if (kind === 'blizzard') scene.blizzard.seed(x, y, volume);
				else scene.electricity.seed(x, y, volume);
			},
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
		};
	},

	removeGroundItem(this: DungeonScene, g: GroundItem): void {
		this.groundItems.splice(this.groundItems.indexOf(g), 1);
		this.sprite(g).destroy();
		this.spriteFor.delete(g.id);
		this.showTopHeapSprite(g.x, g.y);
	},

	/** Applies one already-rolled blast damage amount to one creature with exactly the rules the
	 * ordinary bomb blast uses - the hero's share through `absorbHeroDamage`/`kill`, a monster's
	 * through its armor roll (skipped when `pierceArmor`, as `ArcaneBomb` does), Tengu's HP
	 * bracket, Yog's shield/fist guards, and the sleeping reset. Split out so the non-destructive
	 * subclasses (Arcane, Shrapnel) can reuse it without their own copy. Returns true when the
	 * hero died. */
	applyBlastDamage(this: DungeonScene, c: Creature, damage: number, pierceArmor: boolean, cause: 'foe' | 'fire' = 'fire'): boolean {
		if (c.isHero) {
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			if (this.hero.hp <= 0) {
				this.say(t('items.bombs.bomb.ondeath'), 'negative');
				this.kill(this.hero, 'fire');
				return true;
			}
			return false;
		}
		//`Challenge.SpectatorFreeze` makes `Char.isInvulnerable()` true for every
		//damage source (tag `v3.3.8`). Bombs, Stone of Blast and the other blast
		//callers all converge here, so preserve their roll but discard HP damage.
		if (c.buffs['spectatorFreeze'] !== undefined) return false;
		if (c.kind === 'yog' && this.yogShielded(c)) return false;
		if (c.kind === 'yogFist' && this.guardFist(c)) return false;
		//`Pylon.isInvulnerable()`: an inactive pylon takes nothing from any source, not just from
		//`attack()`. Moved here with the `damage()` curves below, so a bomb or an armor ability
		//cannot damage a dormant pylon the way `Char.damage()` refuses to.
		if (c.kind === 'pylon' && !c.pylonActive) return false;
		if (this.gnollMineInvulnerable(c)) return false;
		if (this.crystalMineInvulnerable(c)) return false;
		if (!pierceArmor) damage = Math.max(0, damage - Random.normalRange(c.armor[0], c.armor[1]));
		//`AuraOfProtection.AuraBuff` is a defender-side `Char.damage()` modifier (tag `v3.3.8`),
		//so blast damage must pass through the same nearby same-alignment reduction as attacks.
		damage = this.auraProtectedDamage(c, damage);
		//Every defender-side `damage()` override (`Pylon` 14+/15, `Eye` /4 while charging,
		//`DemonSpawner` 19+/20, `Slime`/`CausticSlime` 4+/5) is part of `Char.damage()`, so it
		//applies to *any* source that reaches a mob through `damage()` - including a bomb blast
		//(`Bomb.explode` calls `ch.damage(dmg, this)`) and an armor ability. It used to live only
		//inside `attack()`, which meant a blast or an ability hit a charged pylon or a slime for
		//far more than Java's curve allows; see `PORT_COVERAGE.md`.
		damage = applyDefenderDamageCurves(c.kind, damage, { beamCharged: c.beamCharged === true });
		damage = this.gnollMineDamageTaken(c, damage);
		//`DwarfKing.damage()` (phase 3) and `RustedFist.damage()` bank every hit into the same
		//`Viscosity.DeferedDamage` pool instead of losing HP - also a `damage()` override, so also
		//source-independent.
		if (this.deferMonsterDamage(c, damage)) return false;
		//The fist `damage()` overrides are source-independent too, so the blast seam runs the
		//same pair `attack()` runs (harvest never routes a blast, hence no exemption flag).
		damage = this.rottingBleedConvert(c, damage, false);
		damage = this.soiledGrassCut(c, damage);
		//DKBarrier: the P2 shield pool absorbs before HP (no per-turn regen here - the
		//`incShield` half of `DKBarrior.act()` has no modeled trigger to hang it on).
		if (c.kind === 'king' && (c.kingShield ?? 0) > 0) {
			const absorbed = absorbShield(c.kingShield ?? 0, damage);
			c.kingShield = absorbed.shield;
			damage = absorbed.damage;
		}
		//DM300.move()/PylonEnergy: Barrier absorbs damage before HP while the boss is charged.
		if (c.kind === 'dm300' && (c.dmBarrier ?? 0) > 0) {
			const blocked = Math.min(c.dmBarrier ?? 0, damage);
			c.dmBarrier = (c.dmBarrier ?? 0) - blocked;
			damage -= blocked;
		}
		// Java's `PhantomPiranha.damage()` halves direct bomb/blast damage before HP is changed,
		// then teleports a surviving fish. These blast callers do not retain a Java `Char` source,
		// so the source-less random-water branch is the honest port seam.
		const phantomDirect = c.kind === 'phantomPiranha';
		if (phantomDirect) damage = this.phantomPiranhaDamage(c, damage);
		const preHp = c.hp;
		c.hp -= damage;
		if (phantomDirect && c.hp > 0) this.phantomPiranhaTeleport(c);
		this.lockedFloorBossDamage(c, damage, preHp - c.hp);
		if (c.kind === 'tengu') this.clampTenguBracket(c, preHp);
		this.gnollMineAfterDamage(c, preHp);
		this.crystalMineAfterDamage(c);
		this.brightDarkHalfHp(c, preHp);
		if (c.kind === 'yog' && c.hp > 0) this.yogDamageHook(c, preHp);
		if (c.kind === 'king' && c.hp > 0 && (c.kingPhase ?? 1) === 1) {
			const taken = Math.max(0, preHp - c.hp);
			c.kingSummonCd = (c.kingSummonCd ?? 0) - taken / 8;
			c.kingAbilityCd = (c.kingAbilityCd ?? 0) - taken / 8;
		}
		if (c.kind === 'king' && c.hp > 0) this.kingDamageHook(c);
		this.showDamage(c, damage);
		c.sleeping = false;
		if (c.hp <= 0) this.kill(c, cause);
		else if (c.kind === 'tengu') this.tenguBracketJump(c, preHp);
		return false;
	},

	/** `Bomb.explode(cell)`: `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` minus armor
	 * on every char caught in it, hero included (a bomb does not discriminate - the hero's share
	 * runs through `absorbHeroDamage`/`kill` like every other source, plus the real `ondeath`
	 * line when it kills). The radius is the bomb's own `explosionRange()` - `1` for a plain bomb,
	 * overridden per specialty subclass below. Tengu's `BombAbility`
	 * reuses this with its own ordnance (`fuseTurns: 3`, range-2 flood fill,
	 * `NormalIntRange(5 + scalingDepth, 10 + 2*scalingDepth)`), read off the payload's
	 * 	enguBomb` flag - same routine, same chaining, only the numbers differ. The flood
	 * fill through non-solid/flammable terrain is a passable-cell Chebyshev circle here (the
	 * same shape `useStoneOfBlast` already uses); 	his.depth` stands in for
	 * `scalingDepth` the same way. `Heap.explode()`'s bomb-chaining is reproduced: other
	 * bomb heaps in the blast detonate through the same routine, guarded by `chained`.
	 * Destructive variants now also destroy affected flammable terrain before damage, as Java
	 * does; heap container/exotic-item details and the blast presentation remain simplified.
	 * Returns true when the blast kills the hero. */
	detonateGroundBomb(this: DungeonScene, g: GroundItem, chained: Set<string>): boolean {
		return detonateBomb(g, chained, this.bombEffectsContext());
	},

	bombEffectsContext(this: DungeonScene): BombEffectsContext {
		return {
			hero: this.hero,
			creatures: this.creatures,
			groundItems: this.groundItems,
			depth: this.depth,
			progressionLevel: this.progression.level,
			level: this.level,
			isFlammableTerrain: (x, y) => this.isFireFlammableTerrain(x, y),
			burnFlammableTerrain: (x, y) => this.destroyBombTerrain(x, y),
			// Java's Heap.explode() preserves unique, upgradable, and equipable items (see `explodeHeapEntry`).
			explodeGroundItem: (ground, chained) => this.explodeHeapEntry(ground, chained),
			creatureAt: (x, y) => this.creatureAt(x, y),
			groundItemAt: (x, y) => this.groundItemAt(x, y),
			removeGroundItem: (ground) => this.removeGroundItem(ground),
			//`WoollyBomb`: `sheep.initialize(Dungeon.bossLevel() ? 20 : 200)`.
			spawnSheep: (at) => this.spawnSheep(at, this.depth in BOSSES ? 20 : 200),
			seedFire: (x, y, duration) => this.fire.seed(x, y, duration),
			seedSmoke: (x, y, volume) => this.smokeScreen.seed(x, y, volume),
			plantBloomingGrass: (x, y) => this.plantBloomingGrass(x, y),
			cureHeroBuffs: () => this.cureHeroBuffs(),
			noHealing: isChallengeEnabled('no_healing'),
 			healHeroFromRegrowth: () => {
 				const amount = Math.round(0.8 * this.hero.maxHp + 14);
 				if (amount > this.healingLeft) this.healingLeft = amount;
 				this.healingPercent = Math.max(this.healingPercent, 0.25);
 			},
			onBombDeath: () => this.say(t('items.bombs.bomb.ondeath'), 'negative'),
			onPharmacophobia: () => this.say(t('port.log.pharmacophobia'), 'negative'),
			absorbHeroDamage: (amount) => this.absorbHeroDamage(amount),
			protectDamage: (target, amount) => this.auraProtectedDamage(target, amount),
			phantomPiranhaDamage: (target, amount) => this.phantomPiranhaDamage(target, amount),
			phantomPiranhaSurvived: (target) => this.phantomPiranhaTeleport(target),
			showDamage: (target, amount) => this.showDamage(target, amount),
			kill: (target, cause) => this.kill(target, cause),
			say: (message, level) => this.say(message, level),
			yogShielded: (target) => this.yogShielded(target),
			guardFist: (target) => this.guardFist(target),
			clampTenguBracket: (target, previousHp) => this.clampTenguBracket(target, previousHp),
			onBossDamageTaken: (target, dealt, hpLost) => this.lockedFloorBossDamage(target, dealt, hpLost),
			yogDamageHook: (target, previousHp) => this.yogDamageHook(target, previousHp),
			kingDamageHook: (target) => this.kingDamageHook(target),
			tenguBracketJump: (target, previousHp) => this.tenguBracketJump(target, previousHp),
			onNonWeaponBossDamage: (target) => this.disqualifyBossChallenge(target),
		onTenguBombHeroHit: () => this.foulBossChallenge(),
		};
	},

	beckonMobs(this: DungeonScene): void {
		for (const c of this.creatures) {
			if (c.isHero || c.isNPC) continue;
			c.sleeping = false;
			c.seesHero = true;
			c.lastSeen = { x: this.hero.x, y: this.hero.y };
		}
	},

	/** `Bomb.Fuse.act()`: lit bombs tick down once per hero turn (`Actor.addDelayed(fuse, 2)`
	 * is two fuse-acts, i.e. two rounds) and detonate at zero. `NoisemakerFuse` instead arms at
	 * zero and then acts on its own (see below). Called from the end-of-turn pipeline, where a
	 * hero-killing blast returns true exactly like fatal buff damage. A running Timekeeper freeze
	 * stops every automatic actor, fuses included, but a triggered noisemaker refuses `freeze()`
	 * in Java, so its alarm keeps running. Lit bombs ride ordinary ground-item payloads, so
	 * leaving the floor or saving/loading carries them exactly like any other heap (Java abandons
	 * level actors on descent the same way). Returns true when a blast kills the hero. */
	tickBombFuses(this: DungeonScene): boolean {
		let heroDied = false;
		for (const g of [...this.groundItems]) {
			if (g.kind !== 'bomb' || !g.item) continue;
			if (!this.groundItems.includes(g)) continue; //chained-detonated earlier this tick
			const armedNoisemaker = g.item.id === 'noisemaker' && g.item.noisemakerArmed === true;
			if (this.timeBubbleTurns > 0 && !armedNoisemaker) continue;
			if (armedNoisemaker) {
				//`NoisemakerFuse.act()` once triggered: any char on its cell sets it off, otherwise
				//it screams every 6 acts and beckons the level toward the cell.
				if (this.creatureAt(g.x, g.y)) {
					if (this.detonateGroundBomb(g, new Set())) heroDied = true;
					continue;
				}
				const left = (g.item.noisemakerAlertIn ?? 1) - 1;
				if (left <= 0) {
					this.beckonMobs();
					g.item.noisemakerAlertIn = 6;
				} else g.item.noisemakerAlertIn = left;
				continue;
			}
			const fuse = g.item.fuseTurns;
			if (fuse === undefined) continue;
			if (fuse <= 1) {
				//`NoisemakerFuse.trigger()`: the first trigger arms the alarm instead of exploding,
				//spending the fuse; a plain bomb (or Tengu ordnance) detonates here.
				if (g.item.id === 'noisemaker') {
					delete g.item.fuseTurns;
					g.item.noisemakerArmed = true;
					g.item.noisemakerAlertIn = 1;
					continue;
				}
				if (this.detonateGroundBomb(g, new Set())) heroDied = true;
			} else g.item.fuseTurns = fuse - 1;
		}
		return heroDied;
	},

	/** `StoneOfBlast.activate(cell)` -> `Bomb.ConjuredBomb().explode(cell)`: real Java flood-fills
	 * a `PathFinder` distance-1 area through non-solid/flammable terrain (`explosionRange() = 1`,
	 * the `Bomb` base class default, never overridden by `ConjuredBomb`) and deals
	 * `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` damage, minus armor, to every char
	 * caught in it - the hero included, since a bomb does not discriminate. The port uses the
	 * same 8-neighbour flood-fill shape through passable or flammable cells, and reuses
	 * 	his.depth` for `scalingDepth` (the same substitution every other
	 * depth-scaled formula in this file already makes). The hero's own share of the blast, if
	 * caught in range, goes through the existing `absorbHeroDamage`/`kill` path exactly like
	 * `applyTrapBlast`'s hero branch does. Flammable terrain is now destroyed before this damage
	 * pass, matching the destructive `ConjuredBomb`; heap container/exotic-item handling and the
	 * exact wall-aware flood fill remain simplified. */
	useStoneOfBlast(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfBlast(this.stoneContext(), instanceId);
	},

	/** `StoneOfBlink.activate(cell)` -> `ScrollOfTeleportation.teleportToLocation(curUser, cell)`:
	 * real Java throws the stone at a player-aimed cell and blinks the hero there directly (a
	 * short, precise, player-chosen hop - `onThrow`'s own logic even steps back one cell along the
	 * path if a char already occupies the aimed cell). This port now aims for real, so Blink is a
	 * genuine player-chosen hop again, distinct from `ScrollOfTeleportation`'s full-level random
	 * jump; the one simplification is that an occupied or impassable aimed cell is refused outright
	 * rather than Java's step-back-along-the-path. */
	useStoneOfBlink(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfBlink(this.stoneContext(), instanceId);
	},

	/** `StoneOfClairvoyance.activate(cell)`: real Java marks every cell within a `DIST = 20`
	 * diamond (via `ShadowCaster.rounding`) around the thrown-to cell `mapped` (visible on the map
	 * regardless of current sight) and reveals any secret terrain caught in that same area - a
	 * smaller, localized cousin of the already-ported `ScrollOfMagicMapping`'s whole-floor
	 * `revealAll()`. This port now aims for real (a click picks the center) but has no per-cell
	 * partial reveal primitive, so it reproduces the same real DIST=20 radius as a plain Chebyshev circle
	 * (ignoring walls, the same simplification the light/AoE stones above already make) by adding
	 * each cell directly to `FieldOfView.explored` (a public, mutable `Set`) rather than calling
	 * `revealAll()`'s whole-level version. */
	useStoneOfClairvoyance(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfClairvoyance(this.stoneContext(), instanceId);
	},

	/** `StoneOfEnchantment.onItemSelected()`: imbue a picked weapon or armor with a random
	 * enchantment/glyph (`Weapon.enchant()`/`Armor.inscribe()` - good pool only, never a
	 * curse, overwriting whatever affix was there: `enchant(ench)` assigns unconditionally).
	 * Real Java's `usableOnItem` is `ScrollOfEnchantment.enchantable()` (any upgradable
	 * weapon/armor); this port's bag holds `weaponReward`/`armorReward` items (affix rides
	 * into `equipWeapon`/`equipArmor` already), so those are the eligible set, picked through
	 * the generic panel with the real `inv_title`. Armor *inscription* as such needs no
	 * separate path - a bag armor item takes a `GLYPH_TABLE` roll the same way a weapon takes
	 * an `ENCHANT_TABLE` one. Deliberate gaps, same family as Transmutation's: equipped gear
	 * is not targetable (bag-only picker), and the exotic `ScrollOfEnchantment`'s own
	 * choose-your-enchant window has no expression (the stone is random in Java too). */
	useStoneOfEnchantment(this: DungeonScene, instanceId?: string): void {
		useItemStoneOfEnchantment(this.stoneContext(), instanceId);
	},

	/** `WndResurrect` (tag `v3.3.8`): dying with an unblessed ankh offers resurrection keeping two
	 * items instead of the game-over path below. False when no unblessed ankh is carried (or the
	 * run is already over), so the caller falls through to the defeat panel. */
	openResurrectWindow(this: DungeonScene): boolean {
		if (this.gameOver) return false;
		const ankh = this.bag.items.find((item) => item.id === 'ankh'
			&& !(item as typeof item & { blessed?: boolean }).blessed && (item.quantity ?? 0) > 0);
		if (!ankh) return false;
		this.resurrectPending = true;
		this.resurrectAnkhInstanceId = ankh.instanceId;
		this.resurrectKeep1 = { id: this.weaponId, instanceId: this.weaponInstanceId };
		this.resurrectKeep2 = { id: this.armorId, instanceId: this.armorInstanceId };
		this.awaitingInput = false;
		this.openResurrectKeeps();
		return true;
	},

	/** The keeps window itself: Java's title/message plus two keep buttons and the confirm button,
	 * mapped onto `showChoiceWindow` rows (picker rows can only name items, never actions). */
	openResurrectKeeps(this: DungeonScene): void {
		if (this.resurrectKeep1 == null) this.resurrectKeep1 = { id: this.weaponId, instanceId: this.weaponInstanceId };
		if (this.resurrectKeep2 == null) this.resurrectKeep2 = { id: this.armorId, instanceId: this.armorInstanceId };
		const keep1 = this.resurrectKeep1;
		const keep2 = this.resurrectKeep2;
		showChoiceWindow(this.gameWindows, t('windows.wndresurrect.title'), t('windows.wndresurrect.message'), [
			{ label: this.itemDisplayName(keep1.id, true, keep1.instanceId), onPick: () => this.openResurrectSelector(1) },
			{ label: this.itemDisplayName(keep2.id, true, keep2.instanceId), onPick: () => this.openResurrectSelector(2) },
			{ label: t('windows.wndresurrect.confirm'), onPick: () => this.confirmResurrect() },
		]);
	},

	/** Keep-slot selector: Java's `itemSelector` admits everything but ankhs and bags. Picking the
	 * item already kept in the other slot is impossible - the list excludes it, which lands the
	 * same `both slots equal â†’ clear the other` rule without a second step. */
	openResurrectSelector(this: DungeonScene, slot: 1 | 2): void {
		const other = slot === 1 ? this.resurrectKeep2 : this.resurrectKeep1;
		const rows = this.bag.items
			.filter((item) => isResurrectKeepCandidate(item)
				&& !(other != null && item.id === other.id && (item.instanceId ?? null) === (other.instanceId ?? null)))
			.map((item) => ({ id: item.id, instanceId: item.instanceId, identified: true, quantity: item.quantity ?? 1 }));
		this.openItemPicker(t('windows.wndresurrect.prompt'), rows, (pick) => {
			if (slot === 1) this.resurrectKeep1 = { id: pick.id, instanceId: pick.instanceId };
			else this.resurrectKeep2 = { id: pick.id, instanceId: pick.instanceId };
			this.openResurrectKeeps();
		});
	},

	/** `WndResurrect.resurrect()`: consume the ankh, lose everything but the keeps, and regenerate
	 * the depth - `InterlevelScene.Mode.RESURRECT` minus its locked-floor branch (boss seals here
	 * are flags, not a generic locked level, so preserved items and the LostBackpack have no seam).
	 * Lost goods vanish outright (no bag system could carry a LostBackpack); gold is not an item
	 * and stays. Gear left behind unequips to the port's unarmed minima - `startingWeapon` and
	 * `clothArmor`, the same "no gear" floor the rest of the port already treats as empty. */
	confirmResurrect(this: DungeonScene): void {
		const keep1 = this.resurrectKeep1;
		const keep2 = this.resurrectKeep2;
		if (keep1 == null || keep2 == null) {
			this.openResurrectKeeps();
			return;
		}
		this.resurrectPending = false;
		this.bag.remove('ankh', 1, this.resurrectAnkhInstanceId);
		for (const item of partitionResurrectKeeps(this.bag.items, keep1, keep2).lost) {
			this.bag.remove(item.id, item.quantity ?? 1, item.instanceId);
		}
		const kept = (id: string | undefined, instanceId: string | undefined): boolean =>
			(keep1.id === id && (keep1.instanceId ?? null) === (instanceId ?? null))
			|| (keep2.id === id && (keep2.instanceId ?? null) === (instanceId ?? null));
		if (!kept(this.weaponId, this.weaponInstanceId)) {
			this.weaponId = 'startingWeapon';
			this.weaponInstanceId = undefined;
			this.weaponSourceClass = 'startingWeapon';
			this.weaponTier = 1;
			this.weaponLevel = 0;
			this.weaponAffix = null;
			this.weaponHardened = false;
			this.weaponCursed = false;
			this.weaponCursedKnown = false;
			this.weaponIdentified = true;
			this.weaponCurseInfusionBonus = false;
		}
		if (!kept(this.armorId, this.armorInstanceId)) {
			this.armorId = 'clothArmor';
			this.armorInstanceId = undefined;
			this.armorTier = 1;
			this.armorLevel = 0;
			this.armorGlyph = null;
			this.armorHardened = false;
			this.armorCursed = false;
			this.armorCursedKnown = false;
			this.armorIdentified = true;
			this.armorCurseInfusionBonus = false;
		}
		this.syncHeroFromStats();
		this.hero.hp = this.hero.maxHp;
		//`Hero.resurrect()`: full health plus 3 turns of invisibility (`LostInventory` has no model here).
		addBuff(this.hero, 'invisibility', 3);
		this.enterLevel();
		this.awaitingInput = true;
		this.refresh();
	},

	/** `Ankh.execute(AC_BLESS)` (tag `v3.3.8`): a full waterskin blesses the ankh, emptying
	 * the waterskin and spending the hero's turn (`hero.spend(1f)`). Java lists BLESS only on an
	 * unblessed ankh beside a full waterskin; this port's action rows are unconditional, so a
	 * thirsty hero gets the refusal line instead of no button. Blessing an already-blessed ankh
	 * re-runs the same rite (the flag is idempotent) rather than growing a second state. Java's
	 * DRINK sample and speck burst have no seam here (see PORT_COVERAGE.md's ankh row). */
	useAnkh(this: DungeonScene, instanceId?: string): void {
		useAnkhFlow(this.ankhContext(), instanceId);
	},

	/**
	 * The ankh-bless flow lives in `items/selfUse.ts` behind `AnkhContext` - the
	 * file-size refactor's twenty-sixth extraction (with Torch below), behavior-identical.
	 */
	ankhContext(this: DungeonScene): AnkhContext {
		const scene = this;
		return {
			findAnkh: (instanceId) => scene.bag.find('ankh', instanceId) ?? null,
			get waterskin() { return scene.waterskin; },
			drainWaterskin: () => { scene.waterskin = 0; },
			spendTurn: () => { scene.actionSpentTurn = true; scene.spendHeroTurn(1); },
			say: scene.say.bind(scene),
			t,
		};
	},
};
