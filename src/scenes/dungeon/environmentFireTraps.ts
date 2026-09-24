import type { DungeonScene } from '../dungeonScene';
import { missileThrowConfirmationMethods } from './hero/missileThrowConfirmation';
import { placeCharacterArt } from '../../ui/characterPlacement';
import { Actors, Blob, Random, Roguelike } from 'mwg';
import { missileBaseUses, missileBaseUsesOrDefault, tippedDartUseDivisor } from '../../items/missiles';
import { collectDewdrop as collectConsumableDewdrop } from '../../items/consumables';
import { rollUpgradeAffixLoss, upgradeGearFlow, type ScrollEffectsContext, type UpgradeGearContext } from '../../items/scrollEffects';
import { detonateBomb } from '../../items/bombEffects';
import { HOLSTER_DURABILITY_FACTOR, ownsBag, type BagId } from '../../items/bags';
import { runSearch } from '../../adapters/searchSimulation';
import { passiveSearchChance } from '../../simulation/search';
import { openAlchemyRecipes } from '../../items/alchemy';
import { HERO_LOCK_ID } from './hero/skeletonKeyScene';
import { simulationRoguelike } from '../../adapters/mwgRoguelike';
import { activateGeyserTrap as activateGeyserTrapFlow } from '../../simulation/geyserTrap';
import { groundKindForItem, portItemKind, sourceInventoryItem } from '../../items/itemKinds';
import { type TransmuteFlowContext } from '../../items/transmutation';
import { examineTileOutcome } from '../../ui/examineText';
import { ringElementsMultiplier, ringEnergyMultiplier, ringSharpshootingDurabilityMultiplier, type EquippedRing } from '../../items/ringModifiers';
import { has, t, titleCase } from '../../i18n/index';
import { MINE_QUEST_ACTOR_KINDS, type PortedFloor } from '../../spdLevelGen/gameBridge';
import { cityGroundDescKey, cityGroundLayer, cityGroundNameKey } from '../../spdLevelGen/cityBossVisuals';
import { insideRitualMarker } from '../../spdLevelGen/ritualMarkerVisuals';
import { cavesArenaDescKey, cavesArenaNameKey } from '../../spdLevelGen/cavesBossVisuals';
import { entranceRoomContext } from '../../spdLevelGen/rooms/standard/entranceRoom';
import { Terrain } from '../../spdLevelGen/paintLevel';
import { Feeling } from '../../spdLevelGen/regularPainter';
import { mwlTrapTable } from '../../spdLevelGen/mwlDungeonRules';
import { runState } from '../../runState';
import { useFireblastWand as useFireblastWandEffect, useRegrowthWand as useRegrowthWandEffect, useTransfusionWand as useTransfusionWandEffect, useWardingWand as useWardingWandEffect } from '../../items/wandEffects';
import { coneCells } from '../../mechanics/cone';
import { traceRayToTarget } from '../../mechanics/rays';
import { planFireSpread } from '../../simulation/fireSpread';
import { applyHighGrassTrample, plantBloomingGrass as plantBloomingGrassFlow, type HighGrassApplyContext } from '../../simulation/highGrass';
import { applyEnvironmentalBlobs, emitToxicGasVents as emitToxicGasVentsFlow, processSacrifice, spreadSacrificialFire, type SacrificialFireContext } from '../../simulation/environmentalBlobs';
import { evolveElectricity, evolveJavaBlob } from '../../simulation/javaBlob';
import { burnFireContents as burnFireContentsEffect } from '../../items/fireContent';
import { nearestVisibleEnemy as nearestVisibleEnemyFlow } from '../../simulation/targeting';
import { getCurse } from '../../items/itemCurses';
import { Cat, randomUsingDefaults, removeArtifactClass } from '../../items/generator';
import { absorbCreatureShields } from '../../simulation/allyShields';
import { mwlItemEffectValue } from '../../mwlContent';
import { applySandalsNaturalismCharge, sandalsNaturalismLevel } from '../../items/sandals';
import { ritualSiteState } from '../../spdLevelGen/rooms/standard/ritualSiteRoom';
import { DOOR, DOOR_CLOSED, EMBERS, FLOOR, GRASS, HIGH_GRASS, TILE, TRAP, WALL, WATER, modeledTrapTable, sewerTrapTable, type TrapKind } from '../../dungeonConstants';
import { regionForDepth, type Region } from '../../genericDungeon';
import { absorbShield, addBuff, applyElementalBacklash, buffBlocked, electricDamageHalved, explosiveTrapBounds, grimTrapDamage, reigniteBuff, rollDamage, setBleeding, type Creature, type GroundItem, type Step } from '../../combat';
import { applyChillFreeze } from '../../simulation/buffs';
import { BLOB_IMMUNE_KINDS, BOSSES, FLYING_KINDS, IMMOVABLE_KINDS, INORGANIC_KINDS, MONSTERS, UNDEAD_KINDS, mobRosterForDepth, type AnyMonsterId, type MonsterId } from '../../monsters';
import { ETERNAL_FIRE_BURN, wardTexture, type BonesShape } from './shared';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `environmentFireTraps`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
/** Traps whose `activate()` this port runs through `activateUtilityTrap`. */
type UtilityTrap = 'alarm' | 'teleportation' | 'summoning' | 'chilling' | 'ooze' | 'flock' | 'warping' | 'gripping' | 'rockfall' | 'pitfall' | 'frost' | 'geyser' | 'gateway' | 'guardian';
const UTILITY_TRAPS: ReadonlySet<TrapKind> = new Set<TrapKind>(['alarm', 'teleportation', 'summoning', 'chilling', 'ooze', 'flock', 'warping', 'gripping', 'rockfall', 'pitfall', 'frost', 'geyser', 'gateway', 'guardian']);
function isUtilityTrap(kind: TrapKind): kind is UtilityTrap { return UTILITY_TRAPS.has(kind); }
/** The utility traps that aim at no one, so mark no mob for the hazard-assist tracker (Freezing
 * and Ooze are gas/buff producers like the shock and gas traps, and stay marked; Gateway marks
 * only the hunting mob it relocates on the linking trigger, Guardian only beckons). */
const UNMARKED_TRAPS: ReadonlySet<TrapKind> = new Set<TrapKind>(['alarm', 'teleportation', 'summoning', 'flock', 'warping', 'gripping', 'pitfall', 'gateway', 'guardian']);
function isUnmarkedTrap(kind: TrapKind): boolean { return UNMARKED_TRAPS.has(kind); }

export const environmentFireTrapsMethods = {
	...missileThrowConfirmationMethods,
	scrollEffectsContext(this: DungeonScene): ScrollEffectsContext {
		return {
			hero: this.hero,
			creatures: this.creatures,
			level: this.level,
			fov: this.fov,
			secrets: this.secrets,
			isChasmCell: (x, y) => this.isChasmCell(x, y),
			creatureAt: (x, y) => this.creatureAt(x, y) ?? undefined,
			spawnMirrorImage: (at) => this.spawnMirrorImage(at),
			randomFreeCell: (exclude) => this.randomFreeCell(exclude),
			moveTo: (creature, to) => this.moveTo(creature, to),
			playTeleportAppear: (from, to, entity) => this.playTeleportAppear(from, to, entity),
			restitchAllTiles: () => this.restitchAllTiles(),
			showDamage: (target, amount) => this.showDamage(target, amount),
			showHeal: (target, amount) => this.showHeal(target, amount),
			kill: (target) => this.kill(target),
			say: (message, level) => this.say(message, level),
			heroLevel: this.progression.level,
			grantPrismaticGuard: (hp) => {
				this.hero.prismaticGuardHp = hp;
				addBuff(this.hero, 'prismaticGuard', 9999);
			},
		};
	},

	/** The transmutation-scroll window flow (candidates, reroll, Might-ring slot swap)
	 *  lives in `items/transmutation.ts` behind `TransmuteFlowContext` - the file-size
	 *  refactor's second extraction, behavior-identical. The scene only builds the
	 *  context here.
	 */
	transmuteFlowContext(this: DungeonScene): TransmuteFlowContext {
		const scene = this;
		return {
			bag: scene.bag,
			heroClass: scene.heroClass,
			miningBranchActive: scene.miningBranchActive,
			hero: scene.hero,
			talentRank: (id) => scene.talentRank(id),
			newItemInstanceId: (kind) => scene.newItemInstanceId(kind),
			syncHeroFromStats: scene.syncHeroFromStats.bind(scene),
			say: scene.say.bind(scene),
			openItemPicker: (title, entries, onPick) => scene.openItemPicker(title, entries, onPick),
			get equippedRing() { return scene.equippedRing; },
			set equippedRing(ring: EquippedRing | null) { scene.equippedRing = ring; },
			get ringHtBonus() { return scene.ringHtBonus; },
			set ringHtBonus(bonus: number) { scene.ringHtBonus = bonus; },
			get missileThresholds() { return scene.missileThresholds; },
			set missileThresholds(thresholds: Map<string, number>) { scene.missileThresholds = thresholds; },
			set empoweredZaps(zaps: number) { scene.empoweredZaps = zaps; },
			armRecallInscription: (sourceClass) => scene.armRecallInscription(sourceClass),
		};
	},

	/**
	 * `Weapon.upgrade(false)`/`Armor.upgrade(false)` (the scroll path - `upgradeItem()` calls
	 * the no-enchant form, so no new enchant/glyph is ever granted here): affix/curse
	 * transitions roll BEFORE the level changes, then the tier/level advance below stands in
	 * for `super.upgrade()`'s +1. Real rules, in order: a curse affix/glyph is removed on a
	 * static 1-in-3 (with the real `remove_curse` line - the port treats an equipped curse as
	 * known immediately, so the `cursedKnown` gate Java logs behind is already satisfied);
	 * otherwise a good affix/glyph is lost at 10/20/40/80/100% when upgrading from
	 * +4/5/6/7/8 (`Random.Float(10) < 2^(level-4)`, real `incompatible` warning). **Correction
	 * 2026-09-12: this comment used to say hardening was "granted by StoneOfEnchantment,
	 * unported, so nothing can hold it" - wrong on both counts.** Hardening is the *Blacksmith's*
	 * service (`WndBlacksmith`'s harden button, `Blacksmith.Quest.hardens`), it is ported now
	 * (`openBlacksmithHarden`), and the loss roll it replaces is `rollUpgradeAffixLoss`'s own
	 * hardened branch: `level() >= 6 && Random.Float(10) < 2^(level-6)` drops the *hardening*
	 * instead of the enchant, which is the whole point of buying it. Still not modeled: the seal upgrade
	 * (`Armor.upgrade` feeds a level-0 BrokenSeal - no seal exists here); RunicTransference
	 * shifting the armor loss floor for non-warriors (the talent itself has no mechanics
	 * yet, so the floor stays 4); `Degrade.detach` (no Degrade buff exists - Warlock decay
	 * is applied directly, see below). Because this port has no item-picker modal,
	 * `upgradeGear` auto-selects the lower-level equipped weapon/armor; that selection is
	 * the documented simplification. The selected item's fixed tier is preserved and its
	 * upgrade level advances by one, as in Java.
	 */
	/**
	 * The `scrollUpgrade` action lives in `items/scrollEffects.ts` as `upgradeGearFlow`
	 * behind `UpgradeGearContext` - the file-size refactor's twenty-eighth extraction,
	 * behavior-identical (the two `Random` rolls arrive on the context). The scene only
	 * builds the context here.
	 */
	upgradeGear(this: DungeonScene): boolean {
		return upgradeGearFlow(this.upgradeGearContext());
	},

	upgradeGearContext(this: DungeonScene): UpgradeGearContext {
		const scene = this;
		return {
			bag: scene.bag,
			hero: scene.hero,
			heroClass: scene.heroClass,
			subclass: () => scene.subclass(),
			talentRank: (id) => scene.talentRank(id),
			get missileLevel() { return scene.missileLevel; },
			set missileLevel(level: number) { scene.missileLevel = level; },
			get weaponLevel() { return scene.weaponLevel; },
			set weaponLevel(level: number) { scene.weaponLevel = level; },
			get armorLevel() { return scene.armorLevel; },
			set armorLevel(level: number) { scene.armorLevel = level; },
			get ammo() { return scene.ammo; },
			set ammo(ammo: number) { scene.ammo = ammo; },
			set ammoDurability(durability: number) { scene.ammoDurability = durability; },
			get ammoSetId() { return scene.ammoSetId; },
			set ammoSetId(id: string) { scene.ammoSetId = id; },
			newMissileSetId: () => scene.newMissileSetId(),
			get missileThresholds() { return scene.missileThresholds; },
			set missileThresholds(thresholds: Map<string, number>) { scene.missileThresholds = thresholds; },
			wandCharges: scene.wandCharges,
			get weaponAffix() { return scene.weaponAffix; },
			set weaponAffix(affix: string | null) { scene.weaponAffix = affix; },
			get armorGlyph() { return scene.armorGlyph; },
			set armorGlyph(glyph: string | null) { scene.armorGlyph = glyph; },
			get weaponCursed() { return scene.weaponCursed; }, set weaponCursed(cursed: boolean) { scene.weaponCursed = cursed; }, get weaponCursedKnown() { return scene.weaponCursedKnown; },
			get armorCursed() { return scene.armorCursed; }, set armorCursed(cursed: boolean) { scene.armorCursed = cursed; }, get armorCursedKnown() { return scene.armorCursedKnown; },
			get weaponHardened() { return scene.weaponHardened; }, set weaponHardened(hardened: boolean) { scene.weaponHardened = hardened; },
			get armorHardened() { return scene.armorHardened; }, set armorHardened(hardened: boolean) { scene.armorHardened = hardened; },
			randomInt: (min, max) => Random.int(min, max),
			randomFloat: (bound) => Random.float(bound),
			say: (message, level) => scene.say(message, level),
			syncHeroFromStats: () => scene.syncHeroFromStats(),
		};
	},

	/** Shared `Weapon.upgrade()`/`Armor.upgrade()` affix-loss roll, keyed on the CURRENT
	 * upgrade level (before the +1 level is applied). `getCurse` distinguishes curse from
	 * good affixes exactly the way `hasCurseEnchant()`/`hasCurseGlyph()` do. */
	rollUpgradeAffixLoss(this: DungeonScene, slot: 'weapon' | 'armor'): void {
		rollUpgradeAffixLoss(this.upgradeGearContext(), slot);
	},

	/**
	 * The nearest visible, in-range, in-sight hostile lives in
	 * `simulation/targeting.ts` as `nearestVisibleEnemy` - the file-size refactor's
	 * thirty-fifth extraction, behavior-identical. The scene only binds its level,
	 * hero and field of view here.
	 */
	nearestVisibleEnemy(this: DungeonScene, range: number): Creature | null {
		return nearestVisibleEnemyFlow(
			this.level,
			this.hero,
			this.creatures,
			(x, y) => this.fov.isVisible(x, y),
			range,
			simulationRoguelike,
		);
	},

	/**
	 * `Dewdrop.doPickUp`/`Waterskin.collectDew`: goes into the waterskin first, while it isn't
	 * already full; only once it is full does drinking a dewdrop heal HP directly instead
	 * (`Dewdrop.consumeDew`). The Warden's Shielding Dew cap and proportional drop calculation
	 * are shared with the exact Waterskin drink path; Vial of Blood remains unmodeled.
	 */
	/**
	 * Dew-drop collection lives in `items/consumables.ts` as `collectDewdrop` -
	 * the file-size refactor's thirtieth extraction, behavior-identical. The scene
	 * only forwards its own consumable context here.
	 */
	collectDewdrop(this: DungeonScene, force = false): boolean {
		return collectConsumableDewdrop(this.consumableContext(), force);
	},

	/**
	 * `HighGrass.trample()`: ordinary heroes step onto high grass and trample it to plain
	 * `GRASS`; Java's Huntress instead leaves `FURROWED_GRASS` and preserves it on later
	 * Huntress steps, while another hero clears it without any drop rolls. The furrow is persisted with the floor because the real terrain
	 * state survives leaving and revisiting a depth. Java's `freezeTrample` re-entry guard is
	 * unnecessary here: ground-item creation does not synchronously retrigger hero movement.
	 * Ordinary trampling then rolls
	 * Java's naturalism-level-0 seed chance (1/25) followed by an independent dew chance
	 * (1/6, modified by the port's Nature's Bounty talent). The seed category selection uses
	 * the real Generator defaults/substream and its concrete class is retained in the payload,
	 * and `plantSeed()` now consumes it the same way real `Seed.execute(AC_PLANT)` does -
	 * instant activation with no growth delay, matching `Plant.Seed`'s own `onThrow()`-on-plant
	 * shape (real Java has no "wait and it grows" timer for a planted seed at all). What
	 * `WandOfRegrowth`'s Lotus ally and its `seedPreservation()` chance are implemented in
	 * `useRegrowthWand`/`triggerPortedPlantAt`; exact target-cell aiming and plant-animation
	 * presentation remain simplified.
	 */
	/**
	 * `HighGrass.trample()`'s apply half (and the `plantBloomingGrass` sibling below)
	 * live in `simulation/highGrass.ts` - the file-size refactor's thirty-third
	 * extraction, behavior-identical (the three rolls arrive scripted on the context).
	 * The scene only builds the context here.
	 */
	trampleHighGrass(this: DungeonScene, x: number, y: number): void {
		applyHighGrassTrample(this.highGrassContext(), x, y);
	},

	highGrassContext(this: DungeonScene): HighGrassApplyContext {
		const scene = this;
		//The four coefficients Java's loot block reads are authored rows (`sandals*Chance*` in
		//`item-rules.mwl`) rather than inlined here, because the artifact's own actions read the
		//same numbers - see `simulation/highGrass.ts`'s header for why they are passed in.
		const magicImmune = scene.hero.magicImmune === true;
		return {
			hero: scene.hero,
			heroClass: scene.heroClass,
			talentRank: (id) => scene.talentRank(id),
			furrowedGrass: scene.furrowedGrass,
			level: scene.level,
			highGrassTerrain: HIGH_GRASS,
			grassTerrain: GRASS,
			naturalismLevel: sandalsNaturalismLevel(scene.sandalsItem(), magicImmune),
			grassFeeling: scene.portedPaint?.feeling === Feeling.GRASS,
			lootRules: {
				seedChanceBase: mwlItemEffectValue('sandals', 'seedChanceBase'),
				seedChancePerLevel: mwlItemEffectValue('sandals', 'seedChancePerLevel'),
				dewChanceBase: mwlItemEffectValue('sandals', 'dewChanceBase'),
				dewChanceLevelDivisor: mwlItemEffectValue('sandals', 'dewChanceLevelDivisor'),
			},
			chargeNaturalism: () => {
				applySandalsNaturalismCharge(scene.sandalsItem(), ringEnergyMultiplier(scene.effectiveRing(), magicImmune, scene.trinitySpiritRing()) * scene.lightCloakChargeMultiplier(), magicImmune);
			},
			camouflageDuration: scene.armorGlyphActive() && scene.armorGlyph === 'camouflage'
				? Math.round((3 + scene.armorLevel / 2) * scene.genericProcMultiplier())
				: null,
			grantShield: (amount, cap) => scene.grantHeroShield(amount, cap),
			afterTerrainChange: (x, y) => {
				scene.restitchTilesAround(x, y);
				scene.featuresMap?.setLayerData('features', scene.featureFrames());
			},
			depth: scene.depth,
			get natureBerriesDropped() { return scene.natureBerriesDropped; },
			set natureBerriesDropped(dropped: number) { scene.natureBerriesDropped = dropped; },
			rollChance: (p) => Random.chance(p),
			rollInt: (min, max) => Random.int(min, max),
			drawSeedClass: () => randomUsingDefaults(Cat.SEED).cls,
			spawnDrop: (kind, x, y, seedClass) => {
				if (kind === 'seed') scene.spawnGroundItem('seed', x, y, sourceInventoryItem('seed', seedClass ?? '', (id) => scene.newItemInstanceId(id)));
				else scene.spawnGroundItem(kind === 'berry' ? 'food' : kind, x, y, kind === 'berry' ? { id: 'berry', quantity: 1, identified: true, sourceClass: 'Berry' } : undefined);
			},
			say: (key, level) => scene.say(t(key), level),
			isBloomGround: (terrain) => terrain === FLOOR || terrain === GRASS,
			isPlanted: (cell) => (scene.portedPaint?.plants.some((plant) => plant.pos === cell) ?? false) || scene.manualPlants.has(cell),
		};
	},

	/**
	 * `Blooming.plantGrass()`: converts one plantable cell to `HIGH_GRASS` (see the Blooming
	 * branch in `heroOnHit` for the terrain substitution) unless a grown plant already holds
	 * it, then restitches exactly like `trampleHighGrass` does. Returns whether anything
	 * was planted, so the caller can spend its plant budget.
	 */
	plantBloomingGrass(this: DungeonScene, x: number, y: number): boolean {
		return plantBloomingGrassFlow(this.highGrassContext(), x, y);
	},

	/**
	 * One ray of a `ConeAOE`: Java's `new Ballistica(source, cell, ballisticaParams).subPath(1, dist)`.
	 * MWG's `ballistica` covers the terrain half (`stop: 'impassable'`, Java's `Level.solid`). The
	 * character half is the caller's: Java's Regrowth cone casts with `STOP_SOLID | STOP_TARGET`, so
	 * its rays end at the first creature too (Java includes the stopping cell, so it is kept), while
	 * DM-300's gas cone casts with `STOP_SOLID` alone and ignores characters - `stopAtTarget: false`.
	 */
	coneRay(this: DungeonScene, from: Step, to: Step, stopAtTarget = true): Step[] {
		return traceRayToTarget(this.level, from, to, (x, y) => this.creatureAt(x, y), stopAtTarget);
	},

	/**
	 * `WandOfRegrowth.onZap()` (checked against the local SPD checkout's
	 * `WandOfRegrowth.java`, tag v3.3.8). The charge cost, grass budget, root duration, seed
	 * chances, the bolt path and the Lotus placement all follow Java, and the affected cells are now
	 * Java's own `ConeAOE` rather than a target-centred circle: range `2 + 2*charges`, arc
	 * `20 + 10*charges` degrees, rays cast with `STOP_SOLID | STOP_TARGET` (see `coneCells`).
	 */
	useRegrowthWand(this: DungeonScene, target: Creature, charges: number): void {
		const level = Math.max(0, this.degradedLevel(this.effectiveZapLevel()));
		const limit = this.regrowthChargeLimit();
		useRegrowthWandEffect({
			target,
			hero: this.hero,
			level,
			charges,
			width: this.level.width,
			height: this.level.height,
			furrowedChance: this.regrowthTotalChargesUsed >= limit ? (this.regrowthChargesOverLimit + 1) / 5 : 0,
			traceRay: (from, to) => this.coneRay(from, to),
			getTerrain: (x, y) => this.level.get(x, y),
			setTerrain: (x, y, terrain) => this.level.set(x, y, terrain),
			cellIndex: (x, y) => this.level.index(x, y),
			isChasmCell: (x, y) => this.isChasmCell(x, y),
			hasPortedFeature: (cell) => this.portedFeatures.kindAt(cell) !== undefined,
			hasManualPlant: (cell) => this.manualPlants.has(cell),
			creatureAt: (x, y) => this.creatureAt(x, y),
			isImmovable: (creature) => creature.kind !== undefined && IMMOVABLE_KINDS.has(creature.kind),
			restitchAround: (x, y) => this.restitchTilesAround(x, y),
			spawnLotus: (cell, wandLevel) => this.spawnLotus(cell, wandLevel),
			seedPlantKind: (sourceClass) => this.seedPlantKind(sourceClass),
			placePlant: (cell, kind) => {
				this.manualPlants.set(cell, kind);
				this.placePortedFeature(cell, kind);
			},
			refreshFeatures: () => this.featuresMap?.setLayerData('features', this.featureFrames()),
			chargeLimit: () => limit,
			getTotalCharges: () => this.regrowthTotalChargesUsed,
			getChargesOverLimit: () => this.regrowthChargesOverLimit,
			setChargeState: (total, overLimit) => {
				this.regrowthTotalChargesUsed = total;
				this.regrowthChargesOverLimit = overLimit;
			},
			say: (message, levelName) => this.say(message, levelName),
			message: t('port.log.wandregrowth'),
		});
	},

	/**
	 * `WandOfFireblast.onZap()` (checked against tag v3.3.8). Java's order: seed `1 + charges` of
	 * Fire on every cone cell except the caster's own, holding back only the cells adjacent to the
	 * caster that are neither flamable nor solid (any heap there burns instead, unlit); open doors
	 * as the cone crosses them; collect every character hit; then ignite the flamable, unlit cells
	 * that share a side with a held-back cell and are strictly *closer* to the collision cell -
	 * Java's own "This prevents short-range casts not igniting barricades or bookshelves"; a cone
	 * that came out empty ignites the caster's own cell; and each affected character takes

	 * `damageRoll()`, `Burning.reignite`, plus Cripple (2 charges) or Paralysis (3).
	 *
	 * The port's differences, all stated: the collision cell is the aimed creature's cell (this port
	 * aims at creatures, not cells, and an uncursed wand's own `collisionProperties` is `WONT_STOP`,
	 * so Java's collision cell is the aimed one anyway); NPCs are excluded from the blast, as every
	 * other area effect here does, where Java's `Actor.findChar` would catch a shopkeeper; the three
	 * statuses use Java's own durations (Burning reignite 8, Cripple explicit 4, Paralysis
	 * explicit 4 - see the buff-durations row; the port prolongs Cripple/Paralysis keep-max
	 * where Java's `affect` spends (adds 4 onto the live clock), a stated divergence).
	 */
	useFireblastWand(this: DungeonScene, target: Creature, chargesPerCast: number): void {
		useFireblastWandEffect({
			target,
			hero: this.hero,
			charges: chargesPerCast,
			weaponLevel: this.effectiveZapLevel(),
			width: this.level.width,
			height: this.level.height,
			traceRay: (from, to) => this.coneRay(from, to),
			//a concealed secret door is not a closed door yet (see `bumpDoor`)
			isClosedDoor: (x, y) => this.doors.isDoor(x, y) && !this.doors.isOpen(x, y) && !this.secrets.isSecret(x, y),
			openDoor: (x, y) => this.doors.open(x, y),
			passable: (x, y) => this.level.passable(x, y),
			isFlammableTerrain: (x, y) => this.isFireFlammableTerrain(x, y),
			burnFireContents: (x, y) => this.burnFireContents(x, y),
			seedFire: (x, y, amount) => this.fire.seed(x, y, amount),
			fireVolumeAt: (x, y) => this.fire.volumeAt(x, y),
			inside: (x, y) => this.level.inside(x, y),
			creatureAt: (x, y) => this.creatureAt(x, y),
			fadeMirrorOnDamage: (victim, damage) => this.fadeMirrorOnDamage(victim, damage),
			showDamage: (victim, damage) => this.showDamage(victim, damage),
			setColorAdd: (victim, red, green, blue) => this.sprite(victim).setColorAdd(red, green, blue),
			kill: (victim) => this.kill(victim),
			rollDamage: (min, max) => Random.normalRange(min, max),
			addBuff: (victim, id) => addBuff(victim, id),
			reigniteBuff: (victim, id, duration) => reigniteBuff(victim, id, duration),
			say: (message, level) => this.say(message, level),
			message: (victim, damage) => t('port.log.wandhits', { target: victim.name, damage }),
		});
	},

	/**
	 * `WandOfTransfusion.onZap()` (local SPD `WandOfTransfusion.java`). Against an enemy the
	 * wand grants the real `5 + level` hero shield and charms living targets; undead instead
	 * take the real direct damage roll. Against an ally it heals by `round(5% of hero HT) +
	 * 3*level` and pays that health cost. The current port has no generic ally Barrier pool, so
	 * excess ally healing is intentionally omitted; the existing hero Barrier is still used
	 * for the enemy branch. Targeting an ally is auto-preferred because this port has no cell
	 * picker, while the enemy fallback keeps the wand useful before ally combat is present.
	 */
	useTransfusionWand(this: DungeonScene, target: Creature): void {
		const level = Math.max(0, this.degradedLevel(this.effectiveZapLevel()));
		useTransfusionWandEffect({
			target,
			hero: this.hero,
			level,
			isUndead: (victim) => victim.kind !== undefined && UNDEAD_KINDS.has(victim.kind),
			grantHeroShield: (amount, cap) => this.grantHeroShield(amount, cap),
			absorbHeroDamage: (amount) => this.absorbHeroDamage(amount),
			showHeal: (victim, amount) => this.showHeal(victim, amount),
			showDamage: (victim, amount) => this.showDamage(victim, amount),
			kill: (victim) => this.kill(victim),
			setCharm: (victim) => this.charmTargets.set(victim.id, this.hero.id),
			addBuff: (victim, id) => addBuff(victim, id),
			reigniteBuff: (victim, id, duration) => reigniteBuff(victim, id, duration),
			rollDamage: (min, max) => Random.normalRange(min, max),
			say: (message, levelName) => this.say(message, levelName),
			message: t('port.log.wandtransfusion'),
		});
	},

	/** `WandOfWarding.onZap()` and its nested `WandOfWarding.Ward.zap()` actor (local SPD
	 * checkout). Java does have a dedicated Ward NPC actor; this port now gives it its own
	 * `kind: 'ward'` actor and persisted state. Its six-tier sprite film is the Java
	 * `sprites/wards.png` asset, cut with the exact variable-width rectangles from `WardSprite`.
	 * A fresh cast places a tier-1 ward in a free cell next to the selected target, preserving
	 * Java's energy budget (`2 + wand level`) and the ward's always-hit damage roll. Java's
	 * aimed-cell upgrade/dismiss UI is not available, so existing wards are selected by the
	 * port's nearest-target policy; their tier/zap expiry and self-damage rules remain real.
	 */
	useWardingWand(this: DungeonScene, target: Creature): void {
		const level = Math.max(0, this.degradedLevel(this.weaponLevel));
		useWardingWandEffect({
			target,
			level,
			creatures: this.creatures,
			inside: (x, y) => this.level.inside(x, y),
			passable: (x, y) => this.level.passable(x, y),
			isChasmCell: (x, y) => this.isChasmCell(x, y),
			creatureAt: (x, y) => this.creatureAt(x, y),
			spawnWard: (x, y, wandLevel) => this.spawnMonster('ward', { x, y }, false, undefined, true, 'ward', false),
			setWardTexture: (ward, tier) => { this.sprite(ward).texture = wardTexture(runState.sprites.wards, tier); },
			placeCharacterArt: (ward) => placeCharacterArt(this.sprite(ward)),
			say: (message, levelName) => this.say(message, levelName),
			messages: {
				success: t('port.log.wandwarding'),
				empty: t('port.log.staffempty'),
				noTarget: t('port.log.notarget'),
			},
		});
	},
	/** `WandOfRegrowth.chargeLimit()`: Java's level/hero-level degradation threshold. */
	regrowthChargeLimit(this: DungeonScene): number {
		if (this.weaponLevel >= 10) return Number.MAX_SAFE_INTEGER;
		const level = this.weaponLevel;
		return Math.round(20 + this.progression.level * (2 + level) * (1 + level / (50 - 5 * level)));
	},
	/**
	 * A real door (`DungeonTileSheet.FLAT_DOOR`) at every point a room's own generator carved
	 * a corridor straight through its wall ring - `mwg/roguelike`'s generic room-and-corridor
	 * generator already punches exactly one passable cell through the wall at each such
	 * junction, which is precisely where SPD's own generator places a door; this only has to
	 * find those cells and mark them, not carve anything itself.
	 *
	 * The cell marked is the *wall-ring* cell the corridor breached (`nx, ny` below) - one
	 * step outside the room's own floor - not the room's own perimeter floor cell next to it.
	 * A door sitting on the room side of that gap would float in open floor with the actual
	 * wall breach one tile further out still passable and undecorated; sitting in the breach
	 * itself, the door *is* the wall at that point, same as SPD's own doors are.
	 *
	 * Doors start shut (impassable, opaque - bump to open for a turn, like Java) through
	 * `mwg/roguelike`'s Doors, not as bare tiles. From the Prison on, one random door per
	 * floor is locked for an `ironKey` (a stated stand-in: Java's keys come from its own
	 * locked-room/key-drop placement, which needs room types this generator has none of -
	 * here a guard drops the key instead).
	 */
	placeDoors(this: DungeonScene): void {
		const rooms = this.level.rooms;
		const inAnyRoom = (x: number, y: number): boolean =>
			rooms.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
		const candidates: Step[] = [];
		const candidateKeys = new Set<string>();
		for (const room of rooms) {
			for (let x = room.left; x <= room.right; x++) {
				for (let y = room.top; y <= room.bottom; y++) {
					const onEdge = x === room.left || x === room.right || y === room.top || y === room.bottom;
					if (!onEdge || !this.level.passable(x, y)) continue;

					for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
						const nx = x + dx;
						const ny = y + dy;
						if (this.level.passable(nx, ny) && !inAnyRoom(nx, ny)) {
							const key = `${nx},${ny}`;
							if (!candidateKeys.has(key)) {
								candidateKeys.add(key);
								candidates.push({ x: nx, y: ny });
							}
						}
					}
				}
			}
		}

		//The generic corridor can expose several consecutive cells at one room edge. SPD
		//stores one Door per room connection, never a two-door-wide opening; collapse those
		//runs before creating the actual door entities.
		const found: Step[] = [];
		for (const candidate of candidates) {
			if (!found.some((door) => Math.abs(door.x - candidate.x) + Math.abs(door.y - candidate.y) <= 1)) {
				found.push(candidate);
				this.doors.place(candidate.x, candidate.y, { open: DOOR, closed: DOOR_CLOSED, startOpen: false });
			}
		}

		if (this.depth >= 6 && found.length > 0) {
			const at = Random.element(found)!;
			this.doors.place(at.x, at.y, { open: DOOR, closed: DOOR_CLOSED, locked: 'ironKey', startOpen: false });
		}
	},

	/**
	 * Registers a ported floor's doors, secret doors and traps with `Doors`/`Secrets`.
	 *
	 * The generic `placeDoors`/`placeHiddenTraps` *find* somewhere plausible to put these; this
	 * only adopts what the verified generator already decided, so no `Random` call is made here
	 * and nothing about the floor's layout is re-rolled.
	 *
	 * Three deliberate gaps, all inherited from the terrain mapping (see gameBridge.ts):
	 * - A `LOCKED_DOOR` needs `ironKey`, the same stand-in key the generic path uses.  Java
	 *   places its keys via room/key-drop logic this port has none of, so the key still comes
	 *   from a guard drop rather than from where Java put it.
	 * - A `CRYSTAL_DOOR` is locked by `crystalKey`; queued room keys are placed after the
	 *   generated floor is adopted, so the crystal rooms are reachable in live play.
	 * - Trap *behaviour* is routed to the seven effects this port implements; the real class name
	 *   is kept on the trap for display.  See gameBridge's TRAP_BEHAVIOUR.
	 */
	adoptPortedFeatures(this: DungeonScene, floor: PortedFloor): void {
		//The run-level quest type becomes known once the Blacksmith room is generated; later floors keep it.
		if (this.blacksmithQuestType === 0) this.blacksmithQuestType = floor.blacksmithQuestType;
		this.portedWellWater.clear();
		//`ToxicGasRoom.paint()` seeds 30 ToxicGas on every interior EMPTY cell before its
		//vents are placed. The room generator records those Java blob seeds separately from
		//terrain so the existing ToxicGas evolution can consume them here. Do not re-seed a
		//restored floor whose blob state is already non-empty.
		for (const blob of floor.paint.seededBlobs) {
			if (blob.kind === 'toxicGas' && this.toxicGas.total() === 0) {
				const x = blob.pos % floor.paint.w;
				const y = Math.floor(blob.pos / floor.paint.w);
				this.toxicGas.seed(x, y, blob.amount);
			}
			if (blob.kind === 'toxicGasSeed') this.toxicGasVents.set(blob.pos, blob.amount);
		}
		for (const plant of floor.paint.plants) {
			if (plant.kind.startsWith('wellWater:')) {
				const kind = plant.kind.slice('wellWater:'.length) as 'awareness' | 'health' | 'waterOfAwareness' | 'waterOfHealth';
				this.portedWellWater.set(plant.pos, kind);
				this.placePortedFeature(plant.pos, `well:${kind}`);
			} else {
				this.placePortedFeature(plant.pos, plant.kind);
			}
		}
		//`CeremonialCandle.ritualPos` arrives as a raw cell index on the painted level's own
		//grid, which matches this floor's live grid exactly (same dimensions by construction).
		if (ritualSiteState.ritualPos >= 0 && ritualSiteState.ritualPos < this.level.cellCount) {
			this.ritualPos = ritualSiteState.ritualPos;
		}
		this.portedMobSpawns = floor.mobs.filter((mob) => {
			if (mob.kind === 'sacrificialFire') {
				this.sacrificialFireCell = this.level.index(mob.x, mob.y);
				this.sacrificialFireCharge = 6 + this.depth * 4;
				this.sacrificialFire.seed(mob.x, mob.y, this.sacrificialFireCharge);
				const [family, sourceClass] = (mob.loot ?? 'weapon').split('|', 2);
				this.sacrificialFirePrize = sourceInventoryItem(family, sourceClass, (kind) => this.newItemInstanceId(kind));
				return false;
			}
		//LaboratoryRoom's pot marker is `Blob.seed(pot, 1, Alchemy.class)` - a blob, not a
		//mob (this port has no Alchemy blob to seed, and the pot cell itself arrives as
		//inert ALCHEMY->wall scenery). MagicalFireRoom's wall markers are
		//`Blob.seed(cell, 1, EternalFire.class)` the same way - seeded into the static
		//`eternalFire` blob below (amount 1, never spread or decayed, matching Java's own
		//seed amount and non-diffusing `evolve()`). Neither may reach `spawnMonster`
		//(which would crash on the unknown kind - see `spawnPortedMobs`' guard below).
		if (mob.kind === 'alchemyBlob') return false;
		if (mob.kind === 'eternalFire') {
			this.eternalFire.seed(mob.x, mob.y, 1);
			return false;
		}
			if (!mob.kind.startsWith('wellWater:')) return true;
			const kind = mob.kind.slice('wellWater:'.length) as 'awareness' | 'health' | 'waterOfAwareness' | 'waterOfHealth';
			this.portedWellWater.set(this.level.index(mob.x, mob.y), kind);
			this.placePortedFeature(this.level.index(mob.x, mob.y), `well:${kind}`);
			return false;
		});
		// Statue terrain is solid in Java while the statue itself is a live Mob occupying that
		// cell. Expose its occupied cell as floor to the gameplay collision grid; the actor sprite
		// remains the visible statue and preserves the locked-room encounter.
		for (const mob of this.portedMobSpawns) {
			if (mob.kind === 'statue' || mob.kind === 'armoredStatue') this.level.set(mob.x, mob.y, FLOOR);
		}
		this.portedMobCells = new Set(this.portedMobSpawns.map((mob) => this.level.index(mob.x, mob.y)));
		this.portedBranchExitCells = new Set(floor.branchExits.map((exit) => this.level.index(exit.x, exit.y)));
		for (const door of floor.doors) {
			this.doors.place(door.x, door.y, {
				open: DOOR,
				closed: DOOR_CLOSED,
				locked: door.locked ? (door.crystal ? 'crystalKey' : 'ironKey') : undefined,
				startOpen: false,
			});
			if (door.crystal) this.crystalDoorCells.add(this.level.index(door.x, door.y));
		}
		//a secret door reads as solid wall until searched out, exactly like the generic path's
		//concealed traps - Secrets writes the disguise into the level itself.  It still has to
		//exist in Doors before being concealed: discovery only restores DOOR_CLOSED in the
		//terrain, and bumpDoor consults the Doors registry before opening it.
		for (const at of floor.secretDoors) {
			this.doors.place(at.x, at.y, { open: DOOR, closed: DOOR_CLOSED, startOpen: false });
			this.secrets.conceal(at.x, at.y, WALL, DOOR_CLOSED);
			this.secretDoorCells.add(this.level.index(at.x, at.y));
		}

		for (const trap of floor.traps) {
			this.trapKinds.set(this.level.index(trap.x, trap.y), trap.behaviour as TrapKind);
			if (trap.hidden) this.secrets.conceal(trap.x, trap.y, FLOOR, TRAP);
		}
		for (const item of floor.groundItems) {
			const kind = portItemKind(item.kind);
			const remainsGold = item.note?.match(/^remains:gold:(\d+)$/);
			const fixedGold = item.note?.match(/(?:^|,)qty:(\d+)/);
			const chest = item.note?.includes('crystalChest') ? 'crystal' : item.note?.includes('chest') ? 'normal' : undefined;
			const payload = remainsGold || fixedGold
				? { id: 'gold', quantity: Number((remainsGold ?? fixedGold)![1]), stackable: true, identified: true }
				: sourceInventoryItem(item.kind, item.sourceClass, (kind) => this.newItemInstanceId(kind));
			if (payload && item.quantity !== undefined) payload.quantity = item.quantity;
			if (!kind || this.groundItemAt(item.x, item.y)) continue;
			//Java's Heap placement is guaranteed to target a valid level cell. A compact room
			//adapter can retain the source cell after terrain reduction, which used to strand
			//keys in walls and make the corresponding locked door impossible to open. Keep the
			//authored cell when valid; otherwise use the normal valid-cell chooser.
			const validCell = this.level.inside(item.x, item.y) && this.level.passable(item.x, item.y)
				&& !(this.hasStairs && this.stairs.x === item.x && this.stairs.y === item.y);
			if (validCell) this.spawnGroundItem(kind, item.x, item.y, payload, chest, item.note?.includes('forSale'));
			else this.placeQueuedPortedItem(item.kind, floor.rooms, payload);
		}
		// Java's RegularLevel places Level.itemsToSpawn after ordinary room drops using a valid
		// StandardRoom cell. The generator bridge preserves the queue; consume it here so crystal
		// keys and room keys are playable instead of silently disappearing.
		for (const queued of floor.queuedItems) this.placeQueuedPortedItem(queued, floor.rooms);
		this.placePendingBones(floor.rooms);
	},

	placeQueuedPortedItem(this: DungeonScene, sourceId: string, rooms: { left: number; top: number; right: number; bottom: number }[], payload?: GroundItem['item']): boolean {
		const kind = portItemKind(sourceId);
		if (!kind) return false;
		const candidates: Step[] = [];
		for (const room of rooms) {
			if (room.left <= 1 || room.top <= 1) continue;
			for (let y = room.top + 1; y < room.bottom; y++) for (let x = room.left + 1; x < room.right; x++) {
				if (!this.level.passable(x, y) || this.creatureAt(x, y) || this.groundItemAt(x, y)) continue;
				if (this.hero.x === x && this.hero.y === y) continue;
				if (this.hasStairs && this.stairs.x === x && this.stairs.y === y) continue;
				candidates.push({ x, y });
			}
		}
		if (candidates.length === 0) return false;
		const at = Random.element(candidates)!;
		this.spawnGroundItem(kind, at.x, at.y, payload ?? sourceInventoryItem(sourceId, undefined, (kind) => this.newItemInstanceId(kind)));
		return true;
	},

	placePendingBones(this: DungeonScene, rooms: { left: number; top: number; right: number; bottom: number }[]): void {
		const saved = this.bones.load('pending')?.state;
		if (!saved) return;
		const matches = saved.branch === 1
			? this.miningBranchActive && Math.floor(saved.depth / 5) === Math.floor(this.depth / 5)
			: !this.miningBranchActive && saved.depth === this.depth;
		if (!matches) return;
		if (this.miningBranchActive && this.miningBranchEntrance) {
			// MiningLevel.createItems() uses the fixed cell directly above its entrance for Bones.get().
			const at = { x: this.miningBranchEntrance.x, y: this.miningBranchEntrance.y - 1 };
			const item = this.bonesItemForPickup(saved);
			const kind = portItemKind(item.id);
			if (kind) this.spawnGroundItem(kind, at.x, at.y, item);
			this.bones.delete('pending');
			return;
		}
		const item = this.bonesItemForPickup(saved);
		if (this.placeQueuedPortedItem(item.id, rooms, item)) {
			this.bones.delete('pending');
		}
	},

	/** `Bones.get()` post-processing: seeded runs collapse remains to Gold(10); normal Java
	 * upgradable loot is cursed-known and capped at +3 while preserving ordinary identification.
	 * Missile weapons keep their level/identity state. */
	bonesItemForPickup(this: DungeonScene, saved: BonesShape): NonNullable<GroundItem['item']> {
		if (this.seededRun) return { id: 'gold', quantity: 10, identified: true };
		const item = { ...(saved.item ?? { id: saved.kind, quantity: 1, identified: true }) };
		const lower = `${item.id}|${item.sourceClass ?? ''}`.toLowerCase();
		if (lower.includes('artifact') || item.id === 'cloak' || item.id === 'hourglass' || item.id === 'chalice') {
			const artifactClass = item.sourceClass;
			if (!artifactClass || !removeArtifactClass(artifactClass)) {
				// Artifact.value() is 100 by default, halves for a known curse, and has
				// class-specific overrides (CloakOfShadows is worth 0; DriedRose is
				// 100 here because this compact port has no attached ghost/gear state).
				const value = artifactClass?.toLowerCase().includes('cloakofshadows')
					? 0
					: item.cursed && item.cursedKnown ? 50 : 100;
				return { id: 'gold', quantity: value, identified: true };
			}
			item.cursed = true;
			item.cursedKnown = true;
			// Bones creates a fresh instance of the same artifact class; Java's constructor
			// does not reveal its appearance merely because the old instance was known.
			item.identified = false;
			return item;
		}
		const missile = lower.includes('missile') || lower.includes('dart') || lower.includes('boomerang');
		const upgradable = item.id === 'weaponReward' || item.id === 'armorReward'
			|| item.id.startsWith('ring_') || item.id === 'wand' || item.id === 'cloak';
		if (upgradable && !missile) {
			item.cursed = true;
			item.cursedKnown = true;
			if (item.level !== undefined && item.level > 3) Actors.enchant(item, 3 - item.level);
		} else if (missile) {
			// Java keeps missile remains uncursed and marks only their level known; the
			// item's ordinary identification state remains whatever the carried item had.
		}
		this.resetBonesItemState(item, lower, missile);
		return item;
	},

	/** Java Item.reset() state that matters when a carried item crosses a run boundary. */
	resetBonesItemState(this: DungeonScene, item: NonNullable<GroundItem['item']>, lower: string, missile: boolean): void {
		// Weapon/Armor/Wand identification progress is runtime state, not a property of the
		// generated class. Bones.reset() starts each family at its normal half/full budget.
		if (lower.includes('armor')) {
			item.usesLeftToIdentify = 10;
			item.availableUsesToIdentify = 5;
			// Armor.reset() deliberately drops a carried BrokenSeal; this payload uses the
			// boolean equivalent until the full seal item is implemented.
			item.seal = false;
		} else if (lower.includes('weapon')) {
			item.usesLeftToIdentify = 20;
			item.availableUsesToIdentify = 10;
		} else if (lower.includes('wand')) {
			item.usesLeftToIdentify = 10;
			item.availableUsesToIdentify = 5;
		}
		if (missile) {
			// MissileWeapon.reset() restores a fresh stack's durability.
			item.maxDurability = 100;
			item.durability = 100;
		}
	},

	/**
	 * Room painters already placed these actors using Java's room-local RNG. Keep those
	 * positions instead of replacing them with the old scene-level random quest spawns.
	 * Generic population runs first, so an ordinary monster cannot overwrite a Java room
	 * placement; the target cells are reserved while `populate()` chooses its candidates.
	 */
	spawnPortedMobs(this: DungeonScene): void {
		for (const mob of this.portedMobSpawns) {
			//The raw Terrain.CHASM cell is rendered through the hero-facing FLOOR code so
			//falling remains possible; Java's flying actors are the exception to the grounded-mob rule.
			if (!this.level.passable(mob.x, mob.y) || (this.isChasmCell(mob.x, mob.y) && !FLYING_KINDS.has(mob.kind as AnyMonsterId))
				|| ((mob.kind === 'piranha' || mob.kind === 'phantomPiranha') && this.level.get(mob.x, mob.y) !== WATER) || this.creatureAt(mob.x, mob.y)) continue;
			//An unknown kind refuses cleanly (`spawnMonster` would crash reading `.frame` - the old section-10
			//TypeError); the mine's quest actors, placed before their monster rows exist, skip without a warning.
			if (!MONSTERS[mob.kind as AnyMonsterId]) { if (!MINE_QUEST_ACTOR_KINDS.has(mob.kind)) this.say(t('port.log.unknownmob', { kind: mob.kind }), 'negative'); continue; }
			this.spawnMonster(mob.kind as AnyMonsterId, { x: mob.x, y: mob.y }, false, mob.loot, false, undefined, false, mob.initialWarmup);
		}
		this.linkMineQuestActors(this.portedMobSpawns); this.portedMobSpawns = [];
		this.portedMobCells.clear();
	},

	/** bumping a shut door: locked needs the key, otherwise it swings open (costing the turn) */
	bumpDoor(this: DungeonScene, x: number, y: number): boolean {
		if (!this.doors.isDoor(x, y) || this.doors.isOpen(x, y)) return false;
		//a concealed secret door is a solid wall until searched out (Java: SECRET_DOOR is impassable, bumping does nothing).
		//Opening it flipped `Doors` to open while the terrain stayed WALL; discovery then restored DOOR_CLOSED over an
		//"open" door - permanently unopenable, and the only way to the stairs on some floors.
		if (this.secrets.isSecret(x, y)) return false;
		if (this.doors.isLocked(x, y) && this.doors.requiredKey(x, y) === HERO_LOCK_ID) {
			//`Hero.actMove`'s `HERO_LKD_DR` branch (tag `v3.3.8`): a door the skeleton key shut refuses
			//any hand but the key's own; without an uncursed key the lock has weakened and gives way.
			const skeleton = this.skeletonKeyItem();
			if (skeleton && !skeleton.cursed) {
				this.say(t('port.skeletonkey.locked_with_key'), 'warning');
				return true;
			}
			this.doors.unlock(x, y);
			this.say(t('port.skeletonkey.force_lock'));
		} else if (this.doors.isLocked(x, y)) {
			const keyId = this.crystalDoorCells.has(this.level.index(x, y)) ? 'crystalKey' : 'ironKey';
			//`Notes.keyCount(new IronKey(Dungeon.depth))`: a key counts toward its own depth only.
			const key = this.bag.items.find((it) => it.id === keyId && (it as { depth?: number }).depth === this.depth);
			if (!key) {
				this.say(t('port.log.locked'), 'negative');
				return true;
			}
			//`Hero.onOperateComplete`: a cursed skeleton key swallows five real-key attempts in six.
			if (this.cursedKeyDistracts()) return true;
			//`Notes.remove(Key)`: the depth-matched record goes, not the first stack
			//of the kind (mwg `remove` without an instance takes the first id-match).
			this.bag.remove(keyId, 1, key.instanceId);
			this.realKeyLockOpened(keyId === 'crystalKey' ? 'crystal' : 'iron');
			this.doors.unlock(x, y);
			this.say(t('port.log.unlock'), 'positive');
		}
		this.doors.open(x, y);
		runState.audio.cue('door_open', 0.55);
		//shut and open doors are different frames now, and the wall above a doorway carries a
		//matching lip, so the ring has to be restitched rather than left on its shut art
		this.restitchTilesAround(x, y);
		this.say(t('port.log.opendoor'));
		return true;
	},

	/** `Door.leave()` (`levels/features/Door.java`, tag `v3.3.8`), called from `Char.move()`
	 * BEFORE `pos = step`, so the mover still counts as standing on the old cell: an open
	 * door left behind shuts again unless a heap lies on it or another creature is still
	 * standing on it (`chars <= 1` with the mover counted). The voluntary-step call sites
	 * (`takeHeroTurn`'s move branch, `stepMonster`, the ally turns) mirror that placement by
	 * passing the pre-move cell; teleports and knockbacks set position directly and never
	 * close doors, exactly like Java. `doors.close()` swaps the terrain to the registered
	 * closed kind itself; the tile restitch follows the `bumpDoor` precedent above, and the
	 * next `awaitHeroInput` `refresh()` re-observes, like Java's conditional `Dungeon.observe()`.
	 */
	leaveDoor(this: DungeonScene, x: number, y: number, mover: Creature): void {
		if (this.level.get(x, y) !== DOOR) return;
		if (this.groundItemAt(x, y)) return;
		if (this.creatures.some((c) => c !== mover && c.hp > 0 && c.x === x && c.y === y)) return;
		if (!this.doors.close(x, y)) return;
		this.restitchTilesAround(x, y);
	},

	/**
	 * Hidden traps, concealed with mwg's Secrets the same way the old single trap was -
	 * `RegularLevel.nTraps()` (2..3+depth/5) per regular floor, each drawn from the MWL
	 * region tables the ported painters use, filtered to the kinds with a port effect:
	 * depth 1 is worn darts only, grim waits for the Halls, explosive never spawns
	 * randomly (Java places it only in TrapsRoom/MinefieldRoom).
	 * Numbers are Java's own (Toxic/Confusion/Corrosion seed depth-scaled gas; Burning
	 * seeds fire with no direct hit; PoisonDart and WornDart deal 4-8 minus armor, the
	 * former plus depth-scaled poison; Grim mixes half max with half current HP capped
	 * at 90% of max; Explosive rolls 4+depth to 12+3*depth minus armor, no falloff).
	 */
	placeHiddenTraps(this: DungeonScene): void {
		if (this.depth in BOSSES) return;
		//Java's per-region random trap pools (`SewerLevel`..`HallsLevel.trapClasses()`, tag
		//`v3.3.8`) via the MWL tables the ported painters draw from; unmodeled classes
		//(chilling, alarm, ...) drop out weights-intact, and `RegularLevel.nTraps()`
		//rolls 2..3+depth/5 traps per floor.
		const region = regionForDepth(this.depth);
		const table = region === 'sewers' ? sewerTrapTable(this.depth) : mwlTrapTable(region);
		const { kinds, weights } = modeledTrapTable(table.classes, table.chances);
		const count = Math.max(2, Math.round(Random.normalRange(2, 3 + this.depth / 5)));
		for (let t = 0; t < count; t++) {
			for (let attempt = 0; attempt < 20; attempt++) {
				const room = this.level.rooms[Random.int(1, this.level.rooms.length)];
				const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
				if (at.x === this.hero.x && at.y === this.hero.y) continue;
				if (this.creatureAt(at.x, at.y)) continue;
				if (this.level.get(at.x, at.y) !== FLOOR) continue;

				this.secrets.conceal(at.x, at.y, FLOOR, TRAP);
				this.trapKinds.set(this.level.index(at.x, at.y), kinds[Random.weighted(weights) ?? 0]!);
				break;
			}
		}
	},

	/** `Fire.evolve()` in Java: age every existing fire cell by exactly one, burn its contents,
	 * then ignite each empty flammable orthogonal neighbour at volume 4. The generic `mwg` Blob
	 * deliberately diffuses and exponentially decays, so this scene-owned transition preserves
	 * the Java fire shape without teaching the generic framework about SPD's terrain rules.
	 * Tengu's separate FireAbility blob deliberately does not use this path. */
	spreadFire(this: DungeonScene): void {
		const before = this.fire.toJSON().volume;
		//`Web.onUpdateCellFlags()` (tag `v3.3.8`) marks webbed cells flammable, so
		//`Fire.evolve()` ignites them like any flammable terrain - the web itself
		//decays on its own clock (the `advance('web')` half), the floor underneath
		//is never destroyed, so webbed cells ignite but skip the ember pass.
		//Stated gap: the same method also marks them solid, which this port's
		//static terrain model cannot express - webs root but never bar movement.
		const plan = planFireSpread(this.level.width, this.level.height, before,
			(x, y) => this.isFireFlammableTerrain(x, y) || this.web.volumeAt(x, y) > 0,
			// `Fire.evolve()` (tag `v3.3.8`) clears a live Freezing cell before
			// doing any burn/decay/destroy work, and a frozen empty cell cannot
			// ignite. `plantFreeze` is this port's persisted Freezing blob.
			(x, y) => this.plantFreeze.volumeAt(x, y) > 0);
		this.fire = Blob.fromJSON({ width: this.level.width, height: this.level.height, volume: plan.next });
		// The Java fire step clears the frost at every burning cell it douses;
		// apply that side effect after replacing the fire blob so both blobs use
		// the same tick's source state.
		for (const cell of plan.extinguished) this.plantFreeze.clear(cell.x, cell.y);
		const { burning, burntOut } = plan;
		for (const cell of burning) this.burnFireContents(cell.x, cell.y);
		for (const cell of burntOut) {
			if (this.web.volumeAt(cell.x, cell.y) > 0) continue;
			this.burnFireTerrain(cell.x, cell.y);
		}
		//A burning plant is removed from the features layer, so redraw it when anything burned;
		//the terrain half restitches its own converted cell, the same as `plantBloomingGrass`
		//and `trampleHighGrass` do.
		if (burning.length > 0) this.featuresMap?.setLayerData('features', this.featureFrames());
		//`Fire.burn(pos)` runs for every burning cell every turn, and what it does to a char is
		//`Buff.affect(ch, Burning.class).reignite(ch)` - a *prolong*, not a one-shot grant, so
		//standing in fire keeps a full burn armed and stepping out leaves the whole 8 turns running;
		//this port used to grant it once, making fire a single short burn however long the target stayed.
		if (this.fire.volumeAt(this.hero.x, this.hero.y) >= 1 && this.hero.buffs.blobImmunity === undefined) {
			const fresh = this.hero.buffs['burning'] === undefined;
			reigniteBuff(this.hero, 'burning');
			if (fresh) this.say(t('port.log.firecatches'), 'negative');
		}
		for (const creature of this.creatures) {
			if (creature.isHero || creature.isNPC || creature.hp <= 0) continue;
			//`Property.FIERY` (every `Elemental`, newborn included): immune to Burning - real
			//Java refuses the buff in `add()` rather than skipping the grant, same outcome.
			if (creature.kind === 'elemental' || creature.kind === 'newbornElemental') continue;
			//`Fire.burn()` gates its ignition on `!ch.isImmune(Fire.class)`, and a creature with
			//`BlobImmunity` is immune to every harmful blob - so the spirit hawk never catches fire.
			if (BLOB_IMMUNE_KINDS.has(creature.kind as AnyMonsterId) || creature.buffs.blobImmunity !== undefined || creature.buffs.spectatorFreeze !== undefined) continue; // Challenge.SpectatorFreeze carries Java's BlobImmunity set.
			if (this.fire.volumeAt(creature.x, creature.y) >= 1) reigniteBuff(creature, 'burning');
		}
		//EternalFire.evolve()'s ignition half: any char on a burning wall cell catches fire
		//(`Burning.reignite(ch, 4)` - re-applied while standing in it, the same buff the
		//regular-fire branch above grants, since this port's `burning` has no separate
		//reignite-duration dimension). The wall itself is never spread or decayed here -
		//Java's `evolve()` is non-diffusing by construction, and the audit's suggested
		//`spread(passable, 0, 1)` is exactly "never call spread at all". Regular Fire's own
		//flammable-terrain spread and heap burning are handled above by `spreadFire`/
		//`burnFireContents`; this eternal wall fire is deliberately not part of that path.
		if (this.eternalFire.total() > 0) {
			//Java's eternal wall fire is one of the three sites that pass their own duration:
			//`MagicalFireRoom.EternalFire.evolve()` is `Burning.reignite(ch, 4f)`
			if (this.eternalFire.volumeAt(this.hero.x, this.hero.y) >= 1 && this.hero.buffs.blobImmunity === undefined) {
				const fresh = this.hero.buffs['burning'] === undefined;
				reigniteBuff(this.hero, 'burning', ETERNAL_FIRE_BURN);
				if (fresh) this.say(t('port.log.firecatches'), 'negative');
			}
			for (const creature of this.creatures) {
				if (creature.isHero || creature.isNPC || creature.hp <= 0) continue;
				if (creature.kind === 'elemental' || creature.kind === 'newbornElemental') continue;
				//`MagicalFireRoom.EternalFire.evolve()` checks `isImmune(EternalFire.class)` the
				//same way `Fire.burn()` does, and `BlobImmunity` lists `EternalFire` explicitly.
				if (BLOB_IMMUNE_KINDS.has(creature.kind as AnyMonsterId) || creature.buffs.blobImmunity !== undefined || creature.buffs.spectatorFreeze !== undefined) continue;
				if (this.eternalFire.volumeAt(creature.x, creature.y) >= 1) reigniteBuff(creature, 'burning', ETERNAL_FIRE_BURN);
			}
		}
		//Shopkeeper.processHarm()/flee(): every other NPC is flatly immune to environmental
		//damage in this port (the `isNPC` skip just above), but real Java's Shopkeeper is a
		//real exception - catching them in fire (or any harmful buff) warns once, then makes
		//them flee for good on the next hit, closing the shop. The Imp shopkeeper inherits
		//this whole path (`ImpShopkeeper extends Shopkeeper`), so it is covered by the same
		//find. Only the fire path is wired here
		//(the far more common real-play way to accidentally harm them); Java's other harmful-buff
		//triggers and its per-heap shop-stock item removal on flee (this port's shop is a shared
		//bag, not floor heaps) are not reproduced - a narrower, honestly-flagged gap.
		const shopkeeper = this.creatures.find((c) => c.kind === 'shopkeeper' || c.kind === 'impShopkeeper');
		if (shopkeeper && this.fire.volumeAt(shopkeeper.x, shopkeeper.y) >= 1) {
			if (!this.shopkeeperWarned) {
				this.shopkeeperWarned = true;
				this.say(t('port.log.shopkeeperwarn'), 'warning');
			} else {
				this.scheduler.remove(shopkeeper);
				this.creatures.splice(this.creatures.indexOf(shopkeeper), 1);
				this.sprite(shopkeeper).destroy();
				this.spriteFor.delete(shopkeeper.id);
				this.say(t('port.log.shopkeeperflee'), 'negative');
			}
		}
		this.spreadSacrificialFire();
		this.spreadPlantBlobs();
	},

	/** MagicalFireRoom.EternalFire.onUpdateCellFlags(): burning wall cells read impassable
	 * while the wall stands. Boss-turn pathing (Tengu/DM-300/King) skips this - their fixed
	 * arenas never contain a MagicalFireRoom, so only the shared hero/monster/travel paths
	 * below need it. */
	eternalFireBlockedInto(this: DungeonScene, into: Set<number>): void {
		if (this.eternalFire.total() <= 0) return;
		for (const cell of this.eternalFire.cellsAbove(1)) into.add(this.level.index(cell.x, cell.y));
	},

	/** The `SacrificialFire` room rule - spread, cost and death processing live in
	 * `simulation/environmentalBlobs.ts` next to the other blob rules; the scene keeps
	 * the prize/charge/cell triple, the room setup and the save/load half. */
	spreadSacrificialFire(this: DungeonScene): void {
		spreadSacrificialFire(this.sacrificialFireContext());
	},

	processSacrifice(this: DungeonScene, creature: Creature): void {
		processSacrifice(creature, this.sacrificialFireContext());
	},

	sacrificialFireContext(this: DungeonScene): SacrificialFireContext {
		return {
			prize: () => this.sacrificialFirePrize,
			setPrize: (prize) => { this.sacrificialFirePrize = prize; },
			charge: () => this.sacrificialFireCharge,
			setCharge: (charge) => { this.sacrificialFireCharge = charge; },
			cell: () => this.sacrificialFireCell,
			levelWidth: this.level.width,
			depth: this.depth,
			fire: this.sacrificialFire,
			resetFire: () => { this.sacrificialFire = new Blob(this.level.width, this.level.height); },
			passable: (x, y) => this.level.passable(x, y),
			monsterExp: (kind) => (kind ? MONSTERS[kind].exp : 1),
			rollRange: (min, max) => Random.range(min, max),
			spawnReward: (prize, x, y) => this.spawnGroundItem(groundKindForItem(prize, 'armor'), x, y, prize),
			say: this.say.bind(this),
			t,
		};
	},

	/** Applies the Java plant blobs to every actor standing in an active cell. */
	spreadPlantBlobs(this: DungeonScene): void {
		this.emitToxicGasVents();
		applyEnvironmentalBlobs({
			creatures: this.creatures,
			passable: (x, y) => this.level.passable(x, y),
			advance: (blob, isSolid) => {
				const current = (this[blob] as Blob).toJSON().volume;
				//`Electricity.evolve()` overrides the generic diffusion entirely: charge
				//conducts at full power through connected water, then loses one per cell.
				const next = blob === 'electricity'
					? evolveElectricity(this.level.width, this.level.height, current,
						(x, y) => this.level.terrain[x + y * this.level.width] === WATER)
					: evolveJavaBlob(this.level.width, this.level.height, current, isSolid);
				this[blob] = Blob.fromJSON({ width: this.level.width, height: this.level.height, volume: next });
				if (blob === 'corrosiveGas' && this[blob].total() === 0) this.corrosiveGasStrength = 0;
			},
			cellsAbove: (blob, threshold) => (this[blob] as Blob).cellsAbove(threshold),
			amountAt: (blob, x, y) => (this[blob] as Blob).volumeAt(x, y),
			//`Electricity` is in `RingOfElements`' RESISTS set (`Char.resist()`, tag `v3.3.8`),
			//so the hero's zap scales by the ring before Barrier absorption, like the burning
			//trap below - mobs have no rings, so theirs stays raw.
			electricDamage: (target) => {
				const raw = Math.round(Random.float(2 + this.depth / 5));
				return target.isHero
					? Math.floor(raw * ringElementsMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()))
					: raw;
			},
			creatureAt: (x, y) => this.creatureAt(x, y),
			addBuff: (target, id, duration) => addBuff(target, id, duration),
			//`Inferno`/`Blizzard.evolve()` provisions (tag `v3.3.8`): reignited Burning,
			//double chill steps, mutual annihilation (plus `Freezing`/`plantFreeze`), and
			//inferno's flamable-terrain destruction with adjacent `Fire` 4 seeding.
			reigniteBurning: (target) => reigniteBuff(target, 'burning'),
			//NPCs refuse every buff (`add()` returns false, tag `v3.3.8`) - chill writes
			//straight onto the buff map, bypassing `buffBlocked`, so the gate lives here.
			//`Elemental.add()`'s hate-listed chill likewise backslashes instead of
			//attaching (tag `v3.3.8`) - the shared helper refuses, damages, and presents.
			applyChill: (target) => { if (applyElementalBacklash(target, 'chill') === 0 && !target.isNPC) target.buffs = applyChillFreeze(target.buffs).buffs; },
			clearCell: (blob, x, y) => (this[blob] as Blob).clear(x, y),
			clearFireCell: (x, y) => this.fire.clear(x, y),
			fireAmountAt: (x, y) => this.fire.volumeAt(x, y),
			seedFireCell: (x, y, volume) => this.fire.seed(x, y, volume),
			isFlammableCell: (x, y) => this.isFireFlammableTerrain(x, y),
			destroyFlammableCell: (x, y) => this.destroyBombTerrain(x, y),
			applyCorrosion: (target, strength) => {
				//Same `BlobImmunity` decoy cover as `isToxicImmune` just above.
				if (target.allyKind === 'afterImage') return;
				//NPCs refuse every buff (`add()` returns false, tag `v3.3.8`) - corrosion
				//writes straight onto the creature fields, bypassing `buffBlocked`.
				if (target.isNPC) return;
				//`PrismaticImage` is immune to `CorrosiveGas` (tag `v3.3.8`).
				if (target.allyKind === 'prismatic') return;
				//`MirrorImage` is immune to `CorrosiveGas` (same source).
				if (target.allyKind === 'mirror') return;
				target.corrosionTurns = Math.max(target.corrosionTurns ?? 0, 2);
				target.corrosionDamage = Math.max(target.corrosionDamage ?? 0, strength);
			},
			corrosiveStrength: () => this.corrosiveGasStrength,
			toxicDamage: (target) => target.isHero
				? Math.floor((1 + Math.floor(this.depth / 5)) * ringElementsMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()))
				: 1 + Math.floor(this.depth / 5),
			//`Char.Property.IMMOVABLE` immunity to Vertigo (`Char.java`): the daze applied
			//above is Vertigo's stand-in, so these kinds refuse confusion gas - every other
			//daze source still lands, since those are not Vertigo.
			isVertigoImmune: (target) => target.kind !== undefined && IMMOVABLE_KINDS.has(target.kind),
			isToxicImmune: (target) =>
				target.buffs.toxicImbue !== undefined
				|| target.kind === 'rotHeart' || target.kind === 'rotLasher'
				//`Feint.AfterImage` carries the whole `BlobImmunity` set (tag `v3.3.8`); like
				//the buff half in `buffBlocked`, the kind-keyed sets cannot see it (it spawns
				//as a rat), so the decoy is named here alongside them.
				|| target.allyKind === 'afterImage'
				//`PrismaticImage` is immune to `ToxicGas` (same source); Burning is
				//covered by its `fireImmune` flag on the fire paths, like Brimstone.
				|| target.allyKind === 'prismatic'
				//`MirrorImage` is immune to `ToxicGas` (same source); Burning rides
				//its own new `fireImmune` flag the same way.
				|| target.allyKind === 'mirror'
				//`PowerOfMany.LightAlly` has Property.INORGANIC (`PowerOfMany.java`, tag `v3.3.8`);
				//its rat kind is only a scheduler carrier, so include it at this blob seam.
				|| target.allyKind === 'lightAlly'
				|| (target.kind !== undefined && INORGANIC_KINDS.has(target.kind))
				|| (target.kind === 'yogFist' && target.yogFistType === 'rusted')
				|| (target.kind === 'yog' && this.yogShielded(target))
				|| (target.kind === 'yogFist' && this.guardFist(target)),
			isBlobImmune: (target) => target.buffs.blobImmunity !== undefined || target.buffs.spectatorFreeze !== undefined || (target.kind !== undefined && BLOB_IMMUNE_KINDS.has(target.kind as AnyMonsterId)),
			applyDamage: (target, damage, cause = 'poison') => {
				damage = this.auraProtectedDamage(target, damage);
				if (target.isHero) {
					const blocked = this.absorbHeroDamage(damage, false, true);
					this.hero.hp -= blocked;
					this.showDamage(this.hero, damage);
					if (this.hero.hp <= 0) {
						//Electric kills have no death-badge bucket here (the port's four death
						//causes predate the blob), so they land in the default 'foe' bucket -
						//but the player-facing line is Java's own `ondeath`, said here like the
						//ooze/bomb kill sites do.
						this.kill(this.hero, cause === 'electricity' ? 'foe' : 'poison');
						if (cause === 'electricity') this.say(t('actors.blobs.electricity.ondeath'), 'negative');
						return false;
					}
					return true;
				}
				//DKBarrier absorbs on every `Char.damage()` path - same block as the
				//attack tail (see the trap-blast seam's own copy).
				if (target.kind === 'king' && (target.kingShield ?? 0) > 0) {
					const absorbed = absorbShield(target.kingShield ?? 0, damage);
					target.kingShield = absorbed.shield;
					damage = absorbed.damage;
				}
				damage = absorbCreatureShields(target, damage, this.ascendedTurns > 0);
				//`Sheep.damage()` (tag `v3.3.8`) is a no-op: no blob seam can damage sheep.
				if (target.allyKind === 'sheep') return true;
				//`SentryRoom$Sentry.damage()` (tag `v3.3.8`) is likewise a no-op.
				if (target.kind === 'sentry') return true;
				//Every NPC's `damage(int, Object)` is a no-op - "do nothing" (tag
				//`v3.3.8`): `RatKing`, `Shopkeeper`, `Ghost`, `Wandmaker`,
				//`Blacksmith` and `Imp` (plus the `ImpShopkeeper` subclass, which
				//inherits `Shopkeeper`'s). No blob seam - toxic gas, electricity,
				//or anything else routed here - can damage an NPC, the same shape
				//as the sheep/sentry gates just above.
				if (target.isNPC) return true;
				//`Char.Property.ELECTRIC` (`Char.java`, tag `v3.3.8`) halves `Electricity`
				//damage with `Math.round` on every holder: the shock elemental, DM100,
				//the Pylon and BrightFist.
				if (cause === 'electricity' && !target.isHero
					&& electricDamageHalved(target.kind, target.elementalType, target.yogFistType)) damage = Math.round(damage / 2);
				// Java's PhantomPiranha.damage() halves and relocates source-less blob damage; use random water.
				const phantomDirect = target.kind === 'phantomPiranha'; if (phantomDirect) damage = this.phantomPiranhaDamage(target, damage);
				const preHp = target.hp;
				target.hp -= damage; this.lockedFloorBossDamage(target, damage, preHp - target.hp);
				if (phantomDirect && target.hp > 0) this.phantomPiranhaTeleport(target);
				if (this.fadeMirrorOnDamage(target, damage)) return true;
				if (target.kind === 'yog' && target.hp > 0) this.yogDamageHook(target, preHp);
				if (target.kind === 'king' && target.hp > 0 && (target.kingPhase ?? 1) === 1) {
					const taken = Math.max(0, preHp - target.hp);
					target.kingSummonCd = (target.kingSummonCd ?? 0) - taken / 8;
					target.kingAbilityCd = (target.kingAbilityCd ?? 0) - taken / 8;
				}
				if (target.kind === 'king' && target.hp > 0) this.kingDamageHook(target);
				this.showDamage(target, damage);
				if (target.hp <= 0) this.kill(target);
				return true;
			},
		});
	},

	/**
	 * `ToxicGasRoom.ToxicGasSeed.evolve()` (tag `v3.3.8`): each inactive toxic vent retains
	 * its seeded volume (12) and seeds the ordinary ToxicGas blob only while the gas already
	 * present at that cell is at most nine times the vent's volume. This is intentionally a
	 * scene-owned source map rather than a generic spreading blob: Java's nested seed class
	 * does not call `Blob.evolve()`, so it neither diffuses nor decays. The port has no vent
	 * particle emitter, but the gameplay emission and its save/load state are preserved.
	 */
	/**
	 * `ToxicGasRoom.ToxicGasSeed.evolve()` vent emission lives in
	 * `simulation/environmentalBlobs.ts` as `emitToxicGasVents` - the file-size
	 * refactor's thirty-seventh extraction, behavior-identical. The scene only
	 * binds its vent map, level and gas blob here.
	 */
	emitToxicGasVents(this: DungeonScene): void {
		emitToxicGasVentsFlow({
			vents: this.toxicGasVents,
			width: this.level.width,
			inside: (x, y) => this.level.inside(x, y),
			terrainAt: (x, y) => this.level.get(x, y),
			trapTerrain: TRAP,
			gasTotal: () => this.toxicGas.total(),
			gasAmountAt: (x, y) => this.toxicGas.volumeAt(x, y),
			seedGas: (x, y, volume) => this.toxicGas.seed(x, y, volume),
		});
	},

	/** `Fire.evolve()` -> `Dungeon.level.destroy(cell)`: convert the flammable terrain this
	 * port can represent to Java's passable, non-flammable `EMBERS` result. Region decorations
	 * still need their own seam; the raw `FURROWED_GRASS` id is now handled as grass. */
	burnFireTerrain(this: DungeonScene, x: number, y: number): void {
		if (!this.level.inside(x, y)) return;
		const cell = this.level.index(x, y);
		if (!this.isFireFlammableTerrain(x, y)) return;
		const raw = this.portedPaint?.map[cell];
		// `SewerLevel.destroy()` deliberately turns REGION_DECO barrels into WATER and
		// REGION_DECO_ALT into EMPTY_SP; unlike ordinary terrain they do not become EMBERS.
		const sewerBarrel = this.depth <= 5 && raw === Terrain.REGION_DECO;
		const sewerBarrelAlt = this.depth <= 5 && raw === Terrain.REGION_DECO_ALT;
		const replacement = sewerBarrel ? Terrain.WATER : sewerBarrelAlt ? Terrain.EMPTY_SP : Terrain.EMBERS;
		if (this.portedPaint) this.portedPaint.map[cell] = replacement;
		this.level.set(x, y, sewerBarrel ? WATER : replacement === Terrain.EMPTY_SP ? FLOOR : EMBERS);
		//the burned cell's new face has to be stitched in, exactly as a grass change is
		this.restitchTilesAround(x, y);
		this.burnFireContents(x, y);
	},

	/** `Heap.explode()`'s terrain half calls `Level.destroy()` without the fire heap-burn
	 * path. Keep that distinction explicit: a bomb destroys the terrain, then separately
	 * explodes/removes the heap contents. */
	destroyBombTerrain(this: DungeonScene, x: number, y: number): void {
		if (!this.level.inside(x, y)) return;
		const cell = this.level.index(x, y);
		if (!this.isFireFlammableTerrain(x, y)) return;
		const raw = this.portedPaint?.map[cell];
		const sewerBarrel = this.depth <= 5 && raw === Terrain.REGION_DECO;
		const sewerBarrelAlt = this.depth <= 5 && raw === Terrain.REGION_DECO_ALT;
		const replacement = sewerBarrel ? Terrain.WATER : sewerBarrelAlt ? Terrain.EMPTY_SP : Terrain.EMBERS;
		if (this.portedPaint) this.portedPaint.map[cell] = replacement;
		this.level.set(x, y, sewerBarrel ? WATER : replacement === Terrain.EMPTY_SP ? FLOOR : EMBERS);
		this.restitchTilesAround(x, y);
		const plantIndex = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && !plant.kind.startsWith('wellWater:')) ?? -1;
		if (plantIndex >= 0) this.portedPaint!.plants.splice(plantIndex, 1);
		this.manualPlants.delete(cell);
		if (this.portedFeatures.has(cell) && this.portedFeatures.kindAt(cell)?.startsWith('plant:')) this.portedFeatures.remove(cell);
	},

	isFireFlammableTerrain(this: DungeonScene, x: number, y: number): boolean {
		const cell = this.level.index(x, y);
		const raw = this.portedPaint?.map[cell];
		return raw === Terrain.GRASS || raw === Terrain.HIGH_GRASS || raw === Terrain.FURROWED_GRASS
			|| raw === Terrain.DOOR || raw === Terrain.LOCKED_DOOR || raw === Terrain.BARRICADE
			|| (this.depth <= 5 && (raw === Terrain.REGION_DECO || raw === Terrain.REGION_DECO_ALT))
			|| (!this.portedPaint && [GRASS, HIGH_GRASS, DOOR, DOOR_CLOSED].includes(this.level.get(x, y)));
	},

	/** `Fire.burn()`/`Heap.burn()`/`Plant.wither()`: apply the content-side fire effects while
	 * a cell still carries fire. The compact port has no unique scroll heaps, so every current
	 * ground `scroll` is the ordinary non-unique kind Java burns; bombs reuse the existing blast
	 * routine, and feature removal keeps the burned plant from being triggered later. */
	burnFireContents(this: DungeonScene, x: number, y: number): void {
		burnFireContentsEffect({
			cellIndex: (cellX, cellY) => this.level.index(cellX, cellY),
			groundItemAt: (cellX, cellY) => this.groundItemAt(cellX, cellY),
			groundItemsAt: (cellX, cellY) => this.heapItemsAt(cellX, cellY),
			removeGroundItem: (ground) => this.removeGroundItem(ground),
			detonateBomb: (ground) => { this.detonateGroundBomb(ground, new Set()); },
			removePortedPlant: (cell) => {
				const plantIndex = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && !plant.kind.startsWith('wellWater:')) ?? -1;
				if (plantIndex >= 0) this.portedPaint!.plants.splice(plantIndex, 1);
				this.manualPlants.delete(cell);
				if (this.portedFeatures.has(cell) && this.portedFeatures.kindAt(cell)?.startsWith('plant:')) this.portedFeatures.remove(cell);
			},
		}, x, y);
	},

	/** `Hero.search()` decision is delegated to `runSearch`; this method applies the
	 * scene-owned discovery, tile, log, and guide-progress effects. */
	searchForSecrets(this: DungeonScene, intentional = true): void {
		//`Hero.search(true)` (tag `v3.3.8`) starts at distance 2 for Rogue and adds one for Wide Search.
		const talisman = this.talismanItem();
		//The artifact's Foresight buff still scans while cursed; its curse only suppresses
		//the ordinary passive-search branch (`Hero.search(false)`, tag `v3.3.8`).
		const foresight = !intentional && !!talisman && !this.hero.magicImmune;
		const wideSearch = this.talentRank('wide_search');
		const radius = foresight ? 8 : (this.heroClass === 'rogue' ? 2 : 1) + (wideSearch > 0 ? 1 : 0);
		const outcome = runSearch(this.hero, radius, { isSecret: (cell) => {
			if (!this.secrets.isSecret(cell.x, cell.y)) return false;
			if (intentional || foresight) return true;
			if (!this.fov.isVisible(cell.x, cell.y) || talisman?.cursed) return false;
			if (this.depth <= 2 && !entranceRoomContext.guideIntroRead) return false;
			const kind = this.secretDoorCells.has(this.level.index(cell.x, cell.y)) ? 'door' : 'trap';
			return Random.float() < passiveSearchChance(this.depth, kind);
		} }, { circular: foresight || wideSearch === 1, stopAtFirst: false });
		if (intentional) this.simulation.exertHunger(talisman?.cursed ? 10 : 4);
		const cells = outcome.kind === 'found' ? [outcome.cell] : outcome.kind === 'found-many' ? outcome.cells : [];
		if (cells.length === 0) { if (intentional) this.say(t('port.log.foundnothing'), 'negative'); return; }
		for (const { x, y } of cells) {
			this.secrets.discover(x, y);
			//Secret doors were stored as WALL; restitch their door face and neighbours.
			this.restitchTilesAround(x, y);
			if (this.secretDoorCells.has(this.level.index(x, y))) {
			this.say(t('port.log.founddoor'), 'positive');
			//Persist the entrance-room tutorial completion signal once, like Java's badge state.
			if (this.depth === 1 && !entranceRoomContext.guideIntroRead) {
				entranceRoomContext.guideIntroRead = true;
				this.guideProgress.save('guide', { introRead: true, searchingFound: entranceRoomContext.guideSearchingFound });
			} else if (this.depth === 2 && !entranceRoomContext.guideSearchingFound) {
				entranceRoomContext.guideSearchingFound = true;
				this.guideProgress.save('guide', { introRead: entranceRoomContext.guideIntroRead, searchingFound: true });
			}
		} else {
			if (intentional) this.say(t('port.log.foundtrap'), 'positive');
		}
		}
		this.featuresMap?.setLayerData('features', this.featureFrames());
	},

	/** Free "Look" action: the name/description decision lives in `ui/examineText.ts`'s
	 * `examineTileOutcome` next to its per-region helpers - the scene only precomputes the
	 * arena/city key answers (they need its visual contexts) and performs the outcome. */
	examineTile(this: DungeonScene, x: number, y: number): void {
		const region = regionForDepth(this.depth);
		//`WndInfoCell.cellName` consults the level's `customTiles` *before* the terrain -
		//precomputed here because the arena answer needs the scene's visual context.
		let arenaName: string | undefined;
		let arenaDesc: string | undefined;
		if (this.depth === 15 && this.cavesBossTiles) {
			const context = this.cavesArenaVisualContext();
			arenaName = cavesArenaNameKey(context, this.level.index(x, y));
			if (arenaName !== undefined) arenaDesc = cavesArenaDescKey(context, this.level.index(x, y));
		}
		//`CityBossLevel.CustomGroundVisuals.name()`/`desc()` answer only where the ground
		//map draws - likewise precomputed; the `""`-desc suppression decision is the module's.
		let cityName: string | undefined;
		let cityDesc: string | undefined;
		if (this.depth === 20 && this.portedPaint) {
			const w = this.level.width;
			const cell = this.level.index(x, y);
			const frames = cityGroundLayer(w, this.level.height, this.portedPaint.map);
			cityName = cityGroundNameKey(this.portedPaint.map, frames, w, cell);
			cityDesc = cityGroundDescKey(this.portedPaint.map, frames, w, cell);
		}
		const outcome = examineTileOutcome({
			region,
			raw: this.portedPaint?.map[this.portedPaint.w * y + x],
			inRitualMarker: insideRitualMarker(this.ritualPos, this.level.width, x, y),
			arenaName,
			arenaDesc,
			cityName,
			cityDesc,
			atStairs: Boolean(this.hasStairs && this.stairs && this.stairs.x === x && this.stairs.y === y),
			coarse: this.level.get(x, y),
			isCrystalDoor: this.crystalDoorCells.has(this.level.index(x, y)),
		});
		if (outcome.kind === 'alchemy') {
			openAlchemyRecipes(this.alchemyFlowContext());
			return;
		}
		this.say(outcome.text);
	},

	triggerTrapAt(this: DungeonScene, x: number, y: number): void {
		// Char.flying is Levitation in SPD. It prevents pressure/ground traps from
		// activating; none of the small set of traps modelled by this port are magical
		// airborne effects, so they are all safely bypassed here.
		if (this.hero.buffs['levitation']) return;
		if (!this.secrets.isSecret(x, y)) return;
		if (this.spentTrapCells.has(this.level.index(x, y))) return;
		this.secrets.discover(x, y);
		const kind = this.trapKinds.get(this.level.index(x, y)) ?? 'poisonDart';
		let fallAfter = false;
		this.featuresMap?.setLayerData('features', this.featureFrames());

		if (kind === 'toxic') {
			//ToxicTrap.activate(): seeds the real ToxicGas blob (`300 + 20*scalingDepth()`) and
			//nothing else - no instant poison. The gas itself deals direct per-turn damage next
			//turn via `spreadPlantBlobs`; the previous instant `poison` buff here was never real
			//Java behavior, and reusing `plantGas` conflated this with Rotberry's own gas blob.
			this.toxicGas.seed(x, y, 300 + 20 * this.depth);
			this.say(t('port.log.trap.toxic'), 'negative');
		} else if (kind === 'confusionGas') {
			//ConfusionTrap.activate() (tag v3.3.8) seeds 300 + 20*depth ConfusionGas;
			//the blob applies Java's two-turn Vertigo shape through the port's daze stand-in.
			this.confusionGas.seed(x, y, 300 + 20 * this.depth);
			this.say(t('port.log.trap.toxic'), 'negative');
		} else if (kind === 'corrosionGas') {
			//CorrosionTrap.activate() (tag v3.3.8) seeds 80 + 5*depth CorrosiveGas and
			//sets its strength to 1 + depth/4; the shared field applies the saved strength.
			this.corrosiveGas.seed(x, y, 80 + 5 * this.depth);
			this.corrosiveGasStrength = Math.max(this.corrosiveGasStrength, 1 + Math.floor(this.depth / 4));
			this.say(t('port.log.trap.toxic'), 'negative');
		} else if (kind === 'burning') {
			//`BurningTrap.activate()` (tag `v3.3.8`) seeds Fire 2 on every non-solid
			//NEIGHBOURS9 cell and deals NO direct damage at all - the flames ignite
			//whoever stands in them (the fire tick reignites `burning`, which is
			//also where the catch-fire feedback comes from, so this branch logs
			//nothing of its own). The old `Int(2,5) x Elements` hit, the instant
			//burn and the single-cell fire 4 were all invented. Cells use passable
			//where Java floods `!solid` (stated residual, same as the shock/storm
			//branches below).
			for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
				const nx = x + dx, ny = y + dy;
				if (this.level.inside(nx, ny) && this.level.passable(nx, ny)) this.fire.seed(nx, ny, 2);
			}
		} else if (kind === 'poisonDart') {
			//`PoisonDartTrap.activate()` (tag `v3.3.8`): 4-8 minus a full `drRoll()`, plus
			//depth-scaled poison. The old roll skipped armor entirely, which is why darts
			//hit the early cloth hero so hard.
			let damage = Math.max(0, Random.normalRange(4, 8) - Random.normalRange(this.hero.armor[0], this.hero.armor[1]));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.say(t('port.log.trap.poisondart', { damage }), 'negative');
			addBuff(this.hero, 'poison');
			if (!buffBlocked(this.hero, 'poison')) this.hero.buffs['poison'] = 8 + Math.round((2 * this.depth) / 3);
		} else if (kind === 'wornDart') {
			//WornDartTrap (WornDartTrap.java, tag 3.3.8) is the poison dart's weak
			//sibling: the same 4-8-minus-armor dart with no poison, and the only trap
			//depth 1 knows (SewerLevel.trapClasses()).
			let damage = Math.max(0, Random.normalRange(4, 8) - Random.normalRange(this.hero.armor[0], this.hero.armor[1]));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.say(t('port.log.trap.worndart', { damage }), 'negative');
		} else if (kind === 'grim') {
			//`GrimTrap`: `round(HT/2 + HP/2)` - half max plus half CURRENT, not half
			//current plus a quarter max as stood here (a full-HP hero took 75% of max
			//instead of the capped 90%, a hurt one far less than Java's). The 90%-of-max
			//cap is Java's own (never quite lethal on its own); `absorbHeroDamage`
			//subtracts no armor (Java's `damage()` has no DR either) and applies the
			//AntiMagic `drRoll()` reduction for listed magical sources.
			let damage = Math.min(Math.round(this.hero.maxHp * 0.9), grimTrapDamage(this.hero.hp, this.hero.maxHp));
			damage = this.absorbHeroDamage(damage, true);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.say(t('port.log.trap.grim', { damage }), 'negative');
		} else if (isUtilityTrap(kind)) {
			fallAfter = this.activateUtilityTrap(kind, x, y);
		} else if (kind === 'shockingTrap') {
				//ShockingTrap.activate() (tag `v3.3.8`): seeds Electricity 10 on every
				//non-solid NEIGHBOURS9 cell. The LIGHTNING sound has no layer here (stated); the
				//mob-marking tracker feeds the hazard-assists badge through `markHazardArea`.
				for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
					const nx = x + dx, ny = y + dy;
					if (this.level.passable(nx, ny)) this.electricity.seed(nx, ny, 10);
				}
			} else if (kind === 'stormTrap') {
				//StormTrap.activate(): a distance-2 flood seeding Electricity 20 and marking the
				//flood's mobs like Java (same sound skip as above).
				const stormDistances = this.pathfinder.distanceMap({ x, y });
				for (let floodY = 0; floodY < this.level.height; floodY++) {
					for (let floodX = 0; floodX < this.level.width; floodX++) {
						const stormSteps = stormDistances[this.level.index(floodX, floodY)] ?? -1;
						if (stormSteps >= 0 && stormSteps <= 2 && this.level.passable(floodX, floodY)) this.electricity.seed(floodX, floodY, 20);
						if (stormSteps >= 0 && stormSteps <= 2) {
							const stormMob = this.creatureAt(floodX, floodY);
							if (stormMob) this.markHazardMob(stormMob);
						}
					}
				}
			} else {
			//`ExplosiveTrap` fires a verbatim stock `Bomb.explode()`: `4+d..12+3d`
			//with no falloff and no fire seeding (only the fireBomb payload seeds
			//fire; the stock bomb destroys flamable terrain instead - unmodeled
			//here, stated). The old `5+d..10+2d` underdealt past the early depths,
			//and the fire 3 set the stepper burning for free.
			//Java's dmg -= ch.drRoll() (Bomb.explode()): the old roll skipped armor.
			let damage = Math.max(0, Random.normalRange(...explosiveTrapBounds(this.depth)) - Random.normalRange(this.hero.armor[0], this.hero.armor[1]));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.applyTrapBlast(x, y);
			this.say(t('port.log.trap.explosive', { damage }), 'negative');
		}
		//A hero-stepped trap marks nearby mobs exactly like a mob-stepped one - Grim,
		//PoisonDart and WornDart only ever mark their aimed target (here, the hero), so they mark nothing.
		if (kind !== 'grim' && kind !== 'poisonDart' && kind !== 'wornDart' && kind !== 'stormTrap' && !isUnmarkedTrap(kind)) this.markHazardArea(x, y);
		this.sprite(this.hero).setColorAdd(1, 0.2, 0.2);
		if (this.hero.hp <= 0) this.kill(this.hero, kind === 'burning' || kind === 'explosive' ? 'fire' : 'trap');
		//`GatewayTrap` sets `disarmedByActivation = false` - the one reusable trap in the
		//set, so it never lands in the spent set no matter who steps on it.
		if (kind !== 'gateway') this.spentTrapCells.add(this.level.index(x, y));
		if (fallAfter && this.hero.hp > 0) this.pitfallDrop();
	},

	/**
	 * `AlarmTrap`/`TeleportationTrap`/`SummoningTrap.activate()` (tag v3.3.8), shared by the hero and
	 * mob step paths. Not ported: the alert sound, the scream/light specks, and `TeleportationTrap`'s
	 * relocation of loose item heaps (Java drops each plain heap around the trap on a random
	 * respawn cell; here items stay put).
	 * - Alarm: `mob.beckon(pos)` on every mob - wakes it and sends it to the trap cell. `lastSeen` is
	 *   this port's hunt-to-last-known-cell target, the same field `takeWanderingTurn` paths to.
	 *   Allies and NPCs are left alone (their AI never used `beckon`'s target here).
	 * - Teleportation: everything on the trap's NEIGHBOURS9 (the stepper included) is sent to a
	 *   random free cell out of view; a hunting mob drops back to wandering.
	 * - Summoning: 1-3 mobs (`Random.Int(2)` twice) on free cells around the trap, awake and
	 *   wandering. Java's `createMob()` walks the level's mob rotation; this picks a random entry
	 *   of the depth's roster instead (stated simplification), never a water-bound piranha.
	 */
	activateUtilityTrap(this: DungeonScene, kind: UtilityTrap, x: number, y: number): boolean {
		if (kind === 'gripping') {
			//`GrippingTrap.activate()`: whoever stands on it (unless flying) gets `Bleeding` of
			//`max(0, 2 + depth/2 - drRoll/2)` and a keep-max `Cripple`. Java leaves this trap armed
			//(`disarmedByActivation = false`); here, like every trap in this port, it is spent once
			//revealed (stated simplification). The wound splash is not ported.
			const c = this.creatureAt(x, y);
			if (c && c.hp > 0 && !c.flying) {
				const dr = Math.floor(Random.normalRange(c.armor[0], c.armor[1]) / 2);
				setBleeding(c, Math.max(0, 2 + Math.floor(this.depth / 2) - dr));
				reigniteBuff(c, 'cripple');
			}
		} else if (kind === 'rockfall') {
			//`RockfallTrap.activate()`: rocks land on every non-solid cell of the trap's room (a 5x5
			//flood when it is not in one), each char there taking `NormalIntRange(5+d, 10+2d)` minus its
			//`drRoll()` and being paralysed for `Paralysis.DURATION`. The trap is never hidden in Java
			//(`canBeHidden = false`). Not ported: the rock particles and the rocks sound; the room is
			//this scene's own room rect, so where none contains the trap it falls back to the flood.
			const cells: Step[] = [];
			const room = this.level.rooms.find((rm) => x >= rm.left && x <= rm.right && y >= rm.top && y <= rm.bottom);
			if (room) {
				for (let ry = room.top; ry <= room.bottom; ry++) for (let rx = room.left; rx <= room.right; rx++) {
					if (this.level.inside(rx, ry) && this.level.passable(rx, ry)) cells.push({ x: rx, y: ry });
				}
			} else {
				const reach = this.pathfinder.distanceMap({ x, y });
				for (let ry = 0; ry < this.level.height; ry++) for (let rx = 0; rx < this.level.width; rx++) {
					const steps = reach[this.level.index(rx, ry)] ?? -1;
					if (steps >= 0 && steps <= 2 && this.level.passable(rx, ry)) cells.push({ x: rx, y: ry });
				}
			}
			if (cells.some((cell) => this.fov.isVisible(cell.x, cell.y))) this.shakeScreen(3, 0.7);
			for (const cell of cells) {
				const ch = this.creatureAt(cell.x, cell.y);
				if (!ch || ch.hp <= 0) continue;
				let damage = Math.max(0, Random.normalRange(5 + this.depth, 10 + this.depth * 2) - Random.normalRange(ch.armor[0], ch.armor[1]));
				// Challenge.SpectatorFreeze keeps Java's damage/armor rolls but blocks HP damage.
				if (ch.buffs['spectatorFreeze'] !== undefined) { /* no HP damage */
				} else if (ch.isHero) {
					damage = this.absorbHeroDamage(damage);
					this.hero.hp -= damage;
					this.showDamage(this.hero, damage);
				} else {
					damage = absorbCreatureShields(ch, damage, this.ascendedTurns > 0);
					ch.hp -= damage;
					this.showDamage(ch, damage);
				}
				//`Paralysis.DURATION` is 10 in Java; the port's table default of 3 is for its other call sites.
				addBuff(ch, 'paralysis', 10);
				if (!ch.isHero && ch.hp <= 0) this.kill(ch, 'trap');
			}
		} else if (kind === 'pitfall') {
			//`PitfallTrap.activate()`: refuses on boss floors, past depth 25 and off the main branch;
			//otherwise the ground gives way around the trap. Java queues a one-turn `DelayedPit` on the
			//hero that drops every non-flying char in the NEIGHBOURS9 (and destroys the heaps there);
			//the caller runs `pitfallDrop` right after the trap is spent instead of a turn later, and
			//only the hero falls - mobs and items around it stay put (stated simplification).
			if (this.depth in BOSSES || this.depth > 25 || this.miningBranchActive) {
				this.say(t('levels.traps.pitfalltrap.no_pit'), 'warning');
				return false;
			}
			const near = Roguelike.chebyshevDistance(this.hero, { x, y }) <= 1;
			this.say(t(near && this.hero.x === x && this.hero.y === y ? 'levels.traps.pitfalltrap.triggered_hero' : 'levels.traps.pitfalltrap.triggered'), 'negative');
			return near;
		} else if (kind === 'frost') {
			//`FrostTrap.activate()`: `Freezing` volume 20 on every non-solid cell within distance 2 (the
			//chilling trap seeds 10 on the 3x3 only). Splash and shatter sound not ported.
			const reach = this.pathfinder.distanceMap({ x, y });
			for (let fy = 0; fy < this.level.height; fy++) for (let fx = 0; fx < this.level.width; fx++) {
				const steps = reach[this.level.index(fx, fy)] ?? -1;
				if (steps >= 0 && steps <= 2 && this.level.passable(fx, fy)) this.plantFreeze.seed(fx, fy, 20);
			}
		} else if (kind === 'chilling') {
			//`ChillingTrap.activate()`: `Freezing` volume 10 on every non-solid NEIGHBOURS9 cell (the
			//icecap plant seeds the same blob with 2). The splash and shatter sound are not ported.
			for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
				if (this.level.inside(x + dx, y + dy) && this.level.passable(x + dx, y + dy)) this.plantFreeze.seed(x + dx, y + dy, 10);
			}
		} else if (kind === 'ooze') {
			//`OozeTrap.activate()`: `Ooze` (its `DURATION`) on every non-flying char in the 3x3. The black
			//splash is not ported.
			for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
				const ch = this.level.passable(x + dx, y + dy) ? this.creatureAt(x + dx, y + dy) : null;
				if (ch && ch.hp > 0 && !ch.flying) addBuff(ch, 'ooze');
			}
		} else if (kind === 'flock') {
			//`FlockTrap.activate()`: a `Sheep` (lifespan 6) on every free non-pit cell within distance 2
			//over non-solid cells. Java disarms the triggering trap before the spawn loop, so a fresh
			//sheep pressing another trap cannot recursively re-trigger the flock trap itself; the
			//remaining trap press is routed through the same ordinary mob-cell activation seam.
			this.spentTrapCells.add(this.level.index(x, y));
			const distances = this.pathfinder.distanceMap({ x, y });
			for (let cy = 0; cy < this.level.height; cy++) {
				for (let cx = 0; cx < this.level.width; cx++) {
					const steps = distances[this.level.index(cx, cy)] ?? -1;
					if (steps < 0 || steps > 2 || !this.level.passable(cx, cy)) continue;
					if (this.creatureAt(cx, cy) || this.isChasmCell(cx, cy)) continue;
					const sheep = this.spawnSheep({ x: cx, y: cy }, 6);
					this.triggerMobTrapAt(sheep);
				}
			}
		} else if (kind === 'alarm') {
			for (const mob of this.creatures) {
				if (mob.isHero || mob.isNPC || mob.isAlly || mob.hp <= 0) continue;
				if (mob.kind !== undefined && IMMOVABLE_KINDS.has(mob.kind as MonsterId)) continue;
				mob.sleeping = false;
				if (!mob.fleeing) mob.lastSeen = { x, y };
			}
			if (this.fov.isVisible(x, y)) this.say(t('levels.traps.alarmtrap.alarm'), 'warning');
		} else if (kind === 'teleportation' || kind === 'warping') {
			//`WarpingTrap` is a `TeleportationTrap` that first wipes the map memory (visited and
			//mapped cells) when the hero is within one cell of it.
			if (kind === 'warping' && Roguelike.chebyshevDistance(this.hero, { x, y }) <= 1) this.fov.explored.clear();
			const victims: Creature[] = [];
			for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
				const ch = this.creatureAt(x + dx, y + dy);
				if (ch && ch.hp > 0) victims.push(ch);
			}
			for (const ch of victims) {
				if (!ch.isHero && ch.kind !== undefined && IMMOVABLE_KINDS.has(ch.kind as MonsterId)) continue;
				const destination = this.randomFreeCell(ch);
				if (!destination) {
					if (ch.isHero) this.say(t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
					continue;
				}
				const from = { x: ch.x, y: ch.y };
				if (ch.isHero) {
					//`teleportChar` detaches Roots and cancels the hero's queued action.
					delete ch.buffs['roots'];
					this.travelTarget = null;
					this.moveTo(ch, destination);
				} else {
					ch.x = destination.x;
					ch.y = destination.y;
					this.sprite(ch).position.set(destination.x * TILE, destination.y * TILE);
					//a hunting mob loses the hero and wanders on
					ch.seesHero = false;
					ch.lastSeen = undefined;
				}
				this.playTeleportAppear(from, destination, ch);
			}
		} else if (kind === 'geyser') {
			activateGeyserTrapFlow({ depth: this.depth, random: Random, neighbourOffsets: Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>, randomElement: <T>(values: readonly T[]) => Random.element(values), width: this.level.width, height: this.level.height, distanceMap: (origin) => this.pathfinder.distanceMap(origin), passable: (gx, gy) => this.level.passable(gx, gy), setWater: (gx, gy) => this.level.set(gx, gy, WATER), clearFire: (gx, gy) => this.fire.clear(gx, gy), restitch: () => this.restitchAllTiles(), creatureAt: (gx, gy) => this.creatureAt(gx, gy), hero: this.hero, absorbHeroDamage: (damage) => this.absorbHeroDamage(damage), showDamage: (target, damage) => this.showDamage(target, damage), kill: (target, cause) => this.kill(target, cause), moveTo: (creature, destination) => this.moveTo(creature, destination) }, x, y);
		} else if (kind === 'gateway') {
			this.activateGatewayTrap(x, y);
		} else if (kind === 'guardian') {
			this.activateGuardianTrap(x, y);
		} else {
			let count = 1;
			if (Random.int(0, 2) === 0) {
				count++;
				if (Random.int(0, 2) === 0) count++;
			}
			const candidates: Step[] = [];
			for (const [dx, dy] of Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>) {
				const cell = { x: x + dx, y: y + dy };
				if (this.level.inside(cell.x, cell.y) && this.level.passable(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y)) candidates.push(cell);
			}
			const roster = mobRosterForDepth(this.depth).filter((kind) => kind !== 'piranha');
			while (count > 0 && candidates.length > 0 && roster.length > 0) {
				const at = candidates.splice(Random.int(0, candidates.length), 1)[0]!;
				const kind = Random.element(roster) ?? roster[0]!;
				const mob = this.spawnMonster(kind, at, false);
				mob.sleeping = false;
				this.playTeleportAppear(at, at, mob);
				count--;
			}
		}
		return false;
	},

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
	 * no counterpart (no size property here - everyone draws from the one shuffled list);
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

	/** `PitfallTrap.DelayedPit` for the hero: `Chasm.heroFall`, minus the one-turn delay. A levitating
	 * hero is flying and does not fall; the landing (cripple, bleeding, damage) is `landFromChasm`. */
	pitfallDrop(this: DungeonScene): void {
		if (this.hero.buffs['levitation']) return;
		this.say(t('port.log.fallchasm'), 'negative');
		this.depth++;
		this.justDescended = true;
		this.enterLevel();
		this.landFromChasm();
	},

	/** `Level.occupyCell()`'s soft `pressCell` path and the concrete trap activators in
	 * `traps/` (tag v3.3.8): a mob activates a trap only after it has been revealed, while a
	 * hidden trap remains safe because Java's soft press ignores `SECRET_TRAP`. The hero
	 * handler above owns player-specific Barrier/ring/anti-magic ordering; this companion
	 * keeps the represented trap effects usable for ordinary monsters and summons. */
	triggerMobTrapAt(this: DungeonScene, monster: Creature): void {
		if (monster.isHero || monster.isNPC || monster.flying || monster.hp <= 0) return;
		const cell = this.level.index(monster.x, monster.y);
		if (!this.trapKinds.has(cell) || this.secrets.isSecret(monster.x, monster.y) || this.spentTrapCells.has(cell)) return;
		const kind = this.trapKinds.get(cell)!;
		let fallAfter = false;
		if (kind === 'toxic') this.toxicGas.seed(monster.x, monster.y, 300 + 20 * this.depth);
		else if (kind === 'confusionGas') this.confusionGas.seed(monster.x, monster.y, 300 + 20 * this.depth);
		else if (isUtilityTrap(kind)) fallAfter = this.activateUtilityTrap(kind, monster.x, monster.y);
		else if (kind === 'corrosionGas') {
			this.corrosiveGas.seed(monster.x, monster.y, 80 + 5 * this.depth);
			this.corrosiveGasStrength = Math.max(this.corrosiveGasStrength, 1 + Math.floor(this.depth / 4));
		} else if (kind === 'burning') {
			//Same as the hero branch: Fire 2 on the non-solid NEIGHBOURS9, no direct
			//damage, no instant burn - the old `Int(2,5)`-minus-armor hit was invented.
			for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
				const nx = monster.x + dx, ny = monster.y + dy;
				if (this.level.inside(nx, ny) && this.level.passable(nx, ny)) this.fire.seed(nx, ny, 2);
			}
		} else if (kind === 'poisonDart') {
			const damage = Math.max(0, Random.normalRange(4, 8) - Random.normalRange(monster.armor[0], monster.armor[1]));
			const dealt = absorbCreatureShields(monster, damage, this.ascendedTurns > 0);
			monster.hp -= dealt;
			this.showDamage(monster, dealt);
			//`reigniteBuff` keeps the max-duration semantics and routes through the shared
			//immunity gate, so INORGANIC kinds refuse the dart's poison like Java's isImmune.
			reigniteBuff(monster, 'poison', 8 + Math.round((2 * this.depth) / 3));
		} else if (kind === 'wornDart') {
			//Same dart as poisonDart above, minus the poison, like Java's WornDartTrap.
			const damage = Math.max(0, Random.normalRange(4, 8) - Random.normalRange(monster.armor[0], monster.armor[1]));
			const dealt = absorbCreatureShields(monster, damage, this.ascendedTurns > 0);
			monster.hp -= dealt;
			this.showDamage(monster, dealt);
		} else if (kind === 'grim') {
			//`GrimTrap` is one of `AntiMagic.RESISTS`' listed source classes (see the hero branch
			//above) - an AntiMagic champion caught on one takes none of its damage, though the
			//trap still triggers and spends itself normally (`Char.damage()` only zeroes the
			//damage itself, matching the shared tail below). This mob-side branch was missing
			//that gate, unlike its hero-side twin.
			//The mix is `round(HT/2 + HP/2)` with NO armor subtraction - Java's
			//`damage()` has no DR, so the old `drRoll` cut was invented (and the old
			//quarter-max mix with it).
			if (!monster.magicImmune) {
				const damage = grimTrapDamage(monster.hp, monster.maxHp);
				const dealt = absorbCreatureShields(monster, damage, this.ascendedTurns > 0);
				monster.hp -= dealt;
				this.showDamage(monster, dealt);
			}
		} else if (kind === 'shockingTrap') {
			for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
				const nx = monster.x + dx, ny = monster.y + dy;
				if (this.level.passable(nx, ny)) this.electricity.seed(nx, ny, 10);
			}
		} else if (kind === 'stormTrap') {
			const mobStormDistances = this.pathfinder.distanceMap({ x: monster.x, y: monster.y });
			for (let mobFloodY = 0; mobFloodY < this.level.height; mobFloodY++) {
				for (let mobFloodX = 0; mobFloodX < this.level.width; mobFloodX++) {
					const mobStormSteps = mobStormDistances[this.level.index(mobFloodX, mobFloodY)] ?? -1;
					if (mobStormSteps >= 0 && mobStormSteps <= 2 && this.level.passable(mobFloodX, mobFloodY)) this.electricity.seed(mobFloodX, mobFloodY, 20);
					if (mobStormSteps >= 0 && mobStormSteps <= 2) {
						const floodMob = this.creatureAt(mobFloodX, mobFloodY);
						if (floodMob) this.markHazardMob(floodMob);
					}
				}
			}
		} else {
			//Same stock-`Bomb.explode()` numbers as the hero branch above
			//(`4+d..12+3d`, armor-subtracted per Java's own `dmg -= drRoll()`), no
			//fire seeding.
			const damage = Math.max(0, Random.normalRange(...explosiveTrapBounds(this.depth))
				- Random.normalRange(monster.armor[0], monster.armor[1]));
			const dealt = absorbCreatureShields(monster, damage, this.ascendedTurns > 0);
			monster.hp -= dealt;
			this.showDamage(monster, dealt);
			this.applyTrapBlast(monster.x, monster.y);
		}
		//Every trap kind modelled for mobs is a Java `HazardAssistTracker` producer:
		//gas/burning/explosive/shocking mark NEIGHBOURS9, StormTrap marked its distance-2
		//flood cell-by-cell above, Grim/PoisonDart/WornDart only ever aim at one target.
		if (kind === 'grim' || kind === 'poisonDart' || kind === 'wornDart') this.markHazardMob(monster);
		else if (kind !== 'stormTrap' && !isUnmarkedTrap(kind)) this.markHazardArea(monster.x, monster.y);
		monster.sleeping = false;
		//Same reusable-trap rule as the hero path: a gateway never spends itself.
		if (kind !== 'gateway') this.spentTrapCells.add(cell);
		if (monster.hp <= 0) this.kill(monster, kind === 'burning' || kind === 'explosive' ? 'fire' : 'trap');
		if (fallAfter && this.hero.hp > 0) this.pitfallDrop();
	},

	/** `Bomb.explode`: the blast reaches all characters in the 3x3 NEIGHBOURS9 area,
	 * each for its own `4+d..12+3d` roll with NO distance falloff - Java rolls full
	 * damage per char. The old 0.67 neighbour cut was invented, as was the range. */
	applyTrapBlast(this: DungeonScene, x: number, y: number): void {
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const target = this.creatureAt(x + dx, y + dy);
			if (!target || target.isHero || target.hp <= 0) continue;
			if (target.kind === 'yog' && this.yogShielded(target)) continue;
			if (target.kind === 'yogFist' && this.guardFist(target)) continue;
			let damage = Math.max(0, Random.normalRange(...explosiveTrapBounds(this.depth)));
			damage = Math.max(0, damage - Random.normalRange(target.armor[0], target.armor[1]));
			damage = this.auraProtectedDamage(target, damage);
			//DKBarrier absorbs on every Java `Char.damage()` path, not just attacks and bomb blasts.
			if (target.kind === 'king' && (target.kingShield ?? 0) > 0) {
				const absorbed = absorbShield(target.kingShield ?? 0, damage);
				target.kingShield = absorbed.shield;
				damage = absorbed.damage;
			}
			damage = absorbCreatureShields(target, damage, this.ascendedTurns > 0);
			// Java's PhantomPiranha.damage() also halves source-less trap blast damage and relocates survivors.
			const phantomDirect = target.kind === 'phantomPiranha'; if (phantomDirect) damage = this.phantomPiranhaDamage(target, damage);
			const preHp = target.hp;
			target.hp -= damage; this.lockedFloorBossDamage(target, damage, preHp - target.hp);
			if (phantomDirect && target.hp > 0) this.phantomPiranhaTeleport(target);
			if (target.kind === 'yog' && target.hp > 0) this.yogDamageHook(target, preHp);
			if (target.kind === 'king' && target.hp > 0 && (target.kingPhase ?? 1) === 1) {
				const taken = Math.max(0, preHp - target.hp);
				target.kingSummonCd = (target.kingSummonCd ?? 0) - taken / 8;
				target.kingAbilityCd = (target.kingAbilityCd ?? 0) - taken / 8;
			}
			if (target.kind === 'king' && target.hp > 0) this.kingDamageHook(target);
			this.showDamage(target, damage);
			target.sleeping = false;
			if (target.hp <= 0) this.kill(target, 'fire');
		}
	},

	/** `MissileWeapon.durabilityPerUse()` (tag `v3.3.8`): `baseUses` (stones/knives 5,
	 * spikes 12) x `1.5^level`, x durable-projectiles (`1.25+0.25/point`, only while the
	 * talent is actually taken), x sharpshooting `1.2^level`, rounded, then `100/usages` plus
	 * Java's `+0.001` rounding epsilon. Java also divides by `augment.delayFactor(1f)` and
	 * multiplies by the MagicalHolster factor - neither applies here (missiles are not
	 * individually augmentable and there is no holster) - and returns 0 once rounded usages
	 * reach 100, when the stack effectively lasts forever. The previous inline form always
	 * applied `(1.25+0.25*rank)` even at rank 0, granting every hero +25% missile durability
	 * without the talent; Java gates it behind `hasTalent` (`pointsInTalent > 0`). `baseUses`
	 * follows the *wielded class* (`missiles.mwl`, Java's field default 8 when the pile names
	 * no authored class) - the old hero-class rule wore every non-duelist spike as a 5-use stone.
	 */
	/**
	 * `MissileWeapon.doThrow()`'s warning condition: the stack is down to its last missile, that
	 * throw would break it (`durabilityLeft() <= durabilityPerUse()`), and the stack is worth
	 * warning about - in Java "known and upgraded, or with a good enchant, or a mastery potion
	 * bonus, or hardened". This port's ammo is fungible class ammo with no per-stack enchant,
	 * hardening or mastery state, so the reachable clause is the upgrade level; `extraThrownLeft`
	 * has no expression here either (it is the flag the same warning is suppressed by).
	 */


	missileDurabilityCost(this: DungeonScene): number {
		//`TippedDart.durabilityPerUse()` with `Talent.DURABLE_TIPS` (`TippedDart.java`, tag
		//`v3.3.8`): the use cost is divided by `1 + points` while a Warden throws tipped darts
		//(2x/3x/4x durability); rot darts are exempt and last longer outright (see
		//`tippedDartUseDivisor`). Any other wielded class keeps the ordinary formula below.
		//Both scale by `MagicalHolster.HOLSTER_DURABILITY_FACTOR` while the holster is owned
		//(Java multiplies the use count `1.2x` while the stack sits inside it - see `bags.ts`).
		const holsterFactor = this.ownsBag('magicalHolster') ? HOLSTER_DURABILITY_FACTOR : 1;
		if (this.ammoSourceClass === 'TippedDart') {
			const baseUses = missileBaseUses('TippedDart') * (this.ammoTippedSeed?.toLowerCase() === 'rotberry' ? mwlItemEffectValue('missile_tippeddart', 'rotBaseUsesMultiplier') : 1);
			const divisor = tippedDartUseDivisor(this.ammoTippedSeed, this.talentRank('durable_tips'), this.subclass() === 'warden');
			const uses = Math.round(baseUses * Math.pow(1.5, this.missileLevel) / divisor
				* holsterFactor
				* ringSharpshootingDurabilityMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()));
			if (uses >= 100) return 0;
			return 100 / Math.max(1, uses) + 0.001;
		}
		const baseUses = missileBaseUsesOrDefault(this.ammoSourceClass);
		const durable = this.talentRank('durable_projectiles');
		const uses = Math.round(baseUses * Math.pow(1.5, this.missileLevel)
			* (durable > 0 ? 1.25 + 0.25 * durable : 1)
			* holsterFactor
			* ringSharpshootingDurabilityMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()));
		if (uses >= 100) return 0;
		return 100 / Math.max(1, uses) + 0.001;
	},

	/** `Bag` ownership over the flat inventory (see `ownsBag` in `bags.ts`). */
	ownsBag(this: DungeonScene, id: BagId): boolean {
		return ownsBag(this.bag.items, id);
	},
};
