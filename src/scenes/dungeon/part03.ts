import type { DungeonScene } from '../dungeonScene';
import { placeCharacterArt } from '../../ui/characterPlacement';
import { Actors, Blob, Random, Roguelike } from 'mwg';
import { missileBaseUses, tippedDartUseDivisor } from '../../items/missiles';
import { collectDewdrop as collectConsumableDewdrop } from '../../items/consumables';
import { rollUpgradeAffixLoss, upgradeGearFlow, type ScrollEffectsContext, type UpgradeGearContext } from '../../items/scrollEffects';
import { detonateBomb } from '../../items/bombEffects';
import { HOLSTER_DURABILITY_FACTOR, ownsBag, type BagId } from '../../items/bags';
import { runSearch } from '../../adapters/searchSimulation';
import { openAlchemyRecipes } from '../../items/alchemy';
import { simulationRoguelike } from '../../adapters/mwgRoguelike';
import { groundKindForItem, portItemKind, sourceInventoryItem } from '../../items/itemKinds';
import { type TransmuteFlowContext } from '../../items/transmutation';
import { examineTileOutcome } from '../../ui/examineText';
import { ringElementsMultiplier, ringEnergyMultiplier, ringSharpshootingDurabilityMultiplier, type EquippedRing } from '../../items/ringModifiers';
import { has, t, titleCase } from '../../i18n/index';
import { type PortedFloor } from '../../spdLevelGen/gameBridge';
import { cityGroundDescKey, cityGroundLayer, cityGroundNameKey } from '../../spdLevelGen/cityBossVisuals';
import { insideRitualMarker } from '../../spdLevelGen/ritualMarkerVisuals';
import { cavesArenaDescKey, cavesArenaNameKey } from '../../spdLevelGen/cavesBossVisuals';
import { entranceRoomContext } from '../../spdLevelGen/rooms/standard/entranceRoom';
import { Terrain } from '../../spdLevelGen/paintLevel';
import { Feeling } from '../../spdLevelGen/regularPainter';
import { runState } from '../../runState';
import { showConfirmWindow } from '../../ui/portWindows';
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
import { mwlItemEffectValue } from '../../mwlContent';
import { applySandalsNaturalismCharge, sandalsNaturalismLevel } from '../../items/sandals';
import { ritualSiteState } from '../../spdLevelGen/rooms/standard/ritualSiteRoom';
import { DOOR, DOOR_CLOSED, EMBERS, FLOOR, GRASS, HIGH_GRASS, TRAP, TRAP_KINDS, WALL, WATER, type TrapKind } from '../../dungeonConstants';
import { regionForDepth, type Region } from '../../genericDungeon';
import { absorbShield, addBuff, explosiveTrapBounds, grimTrapDamage, reigniteBuff, rollDamage, type Creature, type GroundItem, type Step } from '../../combat';
import { applyChillFreeze } from '../../simulation/buffs';
import { BLOB_IMMUNE_KINDS, BOSSES, FLYING_KINDS, IMMOVABLE_KINDS, INORGANIC_KINDS, MONSTERS, UNDEAD_KINDS, type AnyMonsterId } from '../../monsters';
import { ETERNAL_FIRE_BURN, wardTexture, type BonesShape } from './shared';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `part03`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const part03Methods = {
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
			get weaponHardened() { return scene.weaponHardened; },
			set weaponHardened(hardened: boolean) { scene.weaponHardened = hardened; },
			get armorHardened() { return scene.armorHardened; },
			set armorHardened(hardened: boolean) { scene.armorHardened = hardened; },
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
				applySandalsNaturalismCharge(scene.sandalsItem(), ringEnergyMultiplier(scene.effectiveRing(), magicImmune) * scene.lightCloakChargeMultiplier(), magicImmune);
			},
			camouflageDuration: scene.armorGlyph === 'camouflage'
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
				else scene.spawnGroundItem(kind, x, y);
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
		//The run-level flag becomes known when the Blacksmith room is generated. Never clear a
		//true value when a later floor is extracted before the quest is consumed.
		this.blacksmithAlternative ||= floor.blacksmithAlternative;
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
				|| (mob.kind === 'piranha' && this.level.get(mob.x, mob.y) !== WATER) || this.creatureAt(mob.x, mob.y)) continue;
			//Painter markers (`alchemyBlob`, `eternalFire`) are filtered upstream, but any
			//future unknown kind must refuse cleanly here instead of crashing inside
			//`spawnMonster` reading `.frame` off an undefined catalogue entry - that exact
			//TypeError was this project's open section-10 item, root-caused to these markers
			//rather than the suspected asset-load race.
			if (!MONSTERS[mob.kind as AnyMonsterId]) {
				this.say(t('port.log.unknownmob', { kind: mob.kind }), 'negative');
				continue;
			}
			this.spawnMonster(mob.kind as AnyMonsterId, { x: mob.x, y: mob.y }, false, mob.loot);
		}
		this.portedMobSpawns = [];
		this.portedMobCells.clear();
	},

	/** bumping a shut door: locked needs the key, otherwise it swings open (costing the turn) */
	bumpDoor(this: DungeonScene, x: number, y: number): boolean {
		if (!this.doors.isDoor(x, y) || this.doors.isOpen(x, y)) return false;
		//a concealed secret door is a solid wall until searched out (Java: SECRET_DOOR is impassable, bumping does nothing).
		//Opening it flipped `Doors` to open while the terrain stayed WALL; discovery then restored DOOR_CLOSED over an
		//"open" door - permanently unopenable, and the only way to the stairs on some floors.
		if (this.secrets.isSecret(x, y)) return false;
		if (this.doors.isLocked(x, y)) {
			const keyId = this.crystalDoorCells.has(this.level.index(x, y)) ? 'crystalKey' : 'ironKey';
			const key = this.bag.find(keyId);
			if (!key) {
				this.say(t('port.log.locked'), 'negative');
				return true;
			}
			this.bag.remove(keyId, 1);
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

	/**
	 * Hidden traps (Toxic/Burning/PoisonDart/Grim/Explosive), concealed with mwg's Secrets
	 * the same way the old single trap was - two per regular floor, each a random kind.
	 * Numbers are Java's own (Toxic seeds gas - here a 3-turn poison, since gas cells don't
	 * exist; Burning 2-5 + burning; PoisonDart 4-8 + poison scaled by depth; Grim half of
	 * current HP capped at 90% of max; Explosive 5+depth to 10+2*depth). Explosive blasts now
	 * damage all nearby characters with Java's 0.67 off-center multiplier; fire and toxic traps
	 * seed the live area blobs, though exact gas/fire volume cadence remains simplified.
	 */
	placeHiddenTraps(this: DungeonScene): void {
		if (this.depth in BOSSES) return;
		for (let t = 0; t < 2; t++) {
			for (let attempt = 0; attempt < 20; attempt++) {
				const room = this.level.rooms[Random.int(1, this.level.rooms.length)];
				const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
				if (at.x === this.hero.x && at.y === this.hero.y) continue;
				if (this.creatureAt(at.x, at.y)) continue;
				if (this.level.get(at.x, at.y) !== FLOOR) continue;

				this.secrets.conceal(at.x, at.y, FLOOR, TRAP);
				this.trapKinds.set(this.level.index(at.x, at.y), Random.element(TRAP_KINDS)!);
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
			(x, y) => this.isFireFlammableTerrain(x, y) || this.web.volumeAt(x, y) > 0);
		this.fire = Blob.fromJSON({ width: this.level.width, height: this.level.height, volume: plan.next });
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
			if (BLOB_IMMUNE_KINDS.has(creature.kind as AnyMonsterId) || creature.buffs.blobImmunity !== undefined) continue;
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
				if (BLOB_IMMUNE_KINDS.has(creature.kind as AnyMonsterId) || creature.buffs.blobImmunity !== undefined) continue;
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
					? Math.floor(raw * ringElementsMultiplier(this.effectiveRing(), this.hero.magicImmune))
					: raw;
			},
			creatureAt: (x, y) => this.creatureAt(x, y),
			addBuff: (target, id, duration) => addBuff(target, id, duration),
			//`Inferno`/`Blizzard.evolve()` provisions (tag `v3.3.8`): reignited Burning,
			//double chill steps, mutual annihilation (plus `Freezing`/`plantFreeze`), and
			//inferno's flamable-terrain destruction with adjacent `Fire` 4 seeding.
			reigniteBurning: (target) => reigniteBuff(target, 'burning'),
			applyChill: (target) => { target.buffs = applyChillFreeze(target.buffs).buffs; },
			clearCell: (blob, x, y) => (this[blob] as Blob).clear(x, y),
			clearFireCell: (x, y) => this.fire.clear(x, y),
			fireAmountAt: (x, y) => this.fire.volumeAt(x, y),
			seedFireCell: (x, y, volume) => this.fire.seed(x, y, volume),
			isFlammableCell: (x, y) => this.isFireFlammableTerrain(x, y),
			destroyFlammableCell: (x, y) => this.destroyBombTerrain(x, y),
			applyCorrosion: (target, strength) => {
				//Same `BlobImmunity` decoy cover as `isToxicImmune` just above.
				if (target.allyKind === 'afterImage') return;
				//`PrismaticImage` is immune to `CorrosiveGas` (tag `v3.3.8`).
				if (target.allyKind === 'prismatic') return;
				//`MirrorImage` is immune to `CorrosiveGas` (same source).
				if (target.allyKind === 'mirror') return;
				target.corrosionTurns = Math.max(target.corrosionTurns ?? 0, 2);
				target.corrosionDamage = Math.max(target.corrosionDamage ?? 0, strength);
			},
			corrosiveStrength: () => this.corrosiveGasStrength,
			toxicDamage: (target) => target.isHero
				? Math.floor((1 + Math.floor(this.depth / 5)) * ringElementsMultiplier(this.effectiveRing(), this.hero.magicImmune))
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
				|| (target.kind !== undefined && INORGANIC_KINDS.has(target.kind))
				|| (target.kind === 'yogFist' && target.yogFistType === 'rusted')
				|| (target.kind === 'yog' && this.yogShielded(target))
				|| (target.kind === 'yogFist' && this.guardFist(target)),
			isBlobImmune: (target) => target.buffs.blobImmunity !== undefined || (target.kind !== undefined && BLOB_IMMUNE_KINDS.has(target.kind as AnyMonsterId)),
			applyDamage: (target, damage, cause = 'poison') => {
				if (target.isHero) {
					const blocked = this.absorbHeroDamage(damage);
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
				//`Sheep.damage()` (tag `v3.3.8`) is a no-op: the sheep takes no
				//damage from any blob seam (melee can never land through its
				//infinite evasion, and buffs never attach via `buffBlocked`).
				if (target.allyKind === 'sheep') return true;
				//`SentryRoom$Sentry.damage()` (tag `v3.3.8`) is likewise a no-op.
				if (target.kind === 'sentry') return true;
				//`Char.Property.ELECTRIC` (`Char.java`, tag `v3.3.8`) resists the
				//`Electricity` class the same `Math.round` half as ACIDIC above -
				//only the shock elemental subtype carries the property.
				if (cause === 'electricity' && !target.isHero && target.kind === 'elemental'
					&& (target.elementalType ?? 'fire') === 'shock') damage = Math.round(damage / 2);
				const preHp = target.hp;
				target.hp -= damage;
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

	/** `Hero.search()`: the pure "which cell, if any" decision now runs through
	 * `runSearch`/`SimulationRuntime` (see `SIMULATION_ARCHITECTURE.md`'s "Step 7"); this method
	 * keeps every scene-owned effect the decision used to inline - discovering the cell,
	 * restitching tiles, redrawing the feature map, logging, and guide-progress persistence -
	 * unchanged, the same "scene executes the selected effect" split `movement.ts`'s
	 * `planMovement` already established. */
	searchForSecrets(this: DungeonScene): void {
		const radius = 1 + this.talentRank('wide_search');
		const outcome = runSearch(this.hero, radius, { isSecret: (cell) => this.secrets.isSecret(cell.x, cell.y) });
		if (outcome.kind === 'nothing') {
			this.say(t('port.log.foundnothing'), 'negative');
			return;
		}
		const { x, y } = outcome.cell;
		this.secrets.discover(x, y);
		//a secret door was stored as WALL to hide it, so it was drawn with the wall's own
		//face; now that it is a door it needs its door frames, and the rock it was
		//blending into needs restitching around the hole it just left
		this.restitchTilesAround(x, y);
		this.featuresMap?.setLayerData('features', this.featureFrames());
		//a ported floor conceals real SECRET_DOOR cells too, not only traps - and on depths
		//1-2 finding one is mandatory, not optional: Java's SPDSettings.intro() makes every
		//entrance-room door secret as its search tutorial, so the hero starts sealed in
		if (this.secretDoorCells.has(this.level.index(x, y))) {
			this.say(t('port.log.founddoor'), 'positive');
			//Real completion signal for SPDSettings.intro()/the depth-2 searching page - see
			//`guideProgress`'s own comment. Persisted once, permanently, the same as a badge.
			if (this.depth === 1 && !entranceRoomContext.guideIntroRead) {
				entranceRoomContext.guideIntroRead = true;
				this.guideProgress.save('guide', { introRead: true, searchingFound: entranceRoomContext.guideSearchingFound });
			} else if (this.depth === 2 && !entranceRoomContext.guideSearchingFound) {
				entranceRoomContext.guideSearchingFound = true;
				this.guideProgress.save('guide', { introRead: entranceRoomContext.guideIntroRead, searchingFound: true });
			}
		} else {
			this.say(t('port.log.foundtrap'), 'positive');
		}
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
			let damage = Math.max(0, Random.normalRange(4, 8));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.say(t('port.log.trap.poisondart', { damage }), 'negative');
			addBuff(this.hero, 'poison');
			this.hero.buffs['poison'] = 8 + Math.round((2 * this.depth) / 3);
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
			let damage = Math.max(0, Random.normalRange(...explosiveTrapBounds(this.depth)));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.applyTrapBlast(x, y);
			this.say(t('port.log.trap.explosive', { damage }), 'negative');
		}
		//A hero-stepped trap marks nearby mobs exactly like a mob-stepped one - Grim and
		//PoisonDart only ever mark their aimed target (here, the hero), so they mark nothing.
		if (kind !== 'grim' && kind !== 'poisonDart' && kind !== 'stormTrap') this.markHazardArea(x, y);
		this.sprite(this.hero).setColorAdd(1, 0.2, 0.2);
		if (this.hero.hp <= 0) this.kill(this.hero, kind === 'burning' || kind === 'explosive' ? 'fire' : 'trap');
		this.spentTrapCells.add(this.level.index(x, y));
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
		if (kind === 'toxic') this.toxicGas.seed(monster.x, monster.y, 300 + 20 * this.depth);
		else if (kind === 'confusionGas') this.confusionGas.seed(monster.x, monster.y, 300 + 20 * this.depth);
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
			monster.hp -= damage;
			this.showDamage(monster, damage);
			//`reigniteBuff` keeps the max-duration semantics and routes through the shared
			//immunity gate, so INORGANIC kinds refuse the dart's poison like Java's isImmune.
			reigniteBuff(monster, 'poison', 8 + Math.round((2 * this.depth) / 3));
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
				monster.hp -= damage;
				this.showDamage(monster, damage);
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
			monster.hp -= damage;
			this.showDamage(monster, damage);
			this.applyTrapBlast(monster.x, monster.y);
		}
		//Every trap kind modelled for mobs is a Java `HazardAssistTracker` producer:
		//gas/burning/explosive/shocking mark NEIGHBOURS9, StormTrap marked its distance-2
		//flood cell-by-cell above, Grim/PoisonDart only ever aim at one target.
		if (kind === 'grim' || kind === 'poisonDart') this.markHazardMob(monster);
		else if (kind !== 'stormTrap') this.markHazardArea(monster.x, monster.y);
		monster.sleeping = false;
		this.spentTrapCells.add(cell);
		if (monster.hp <= 0) this.kill(monster, kind === 'burning' || kind === 'explosive' ? 'fire' : 'trap');
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
			//DKBarrier absorbs on every `Char.damage()` path (`ShieldBuff.processDamage`
			//in Java), not just attacks and bomb blasts - the same block as the attack
			//tail. Found as a residual of the 13th monster-analysis matrix.
			if (target.kind === 'king' && (target.kingShield ?? 0) > 0) {
				const absorbed = absorbShield(target.kingShield ?? 0, damage);
				target.kingShield = absorbed.shield;
				damage = absorbed.damage;
			}
			const preHp = target.hp;
			target.hp -= damage;
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
	 * without the talent; Java gates it behind `hasTalent` (`pointsInTalent > 0`). */
	/**
	 * `MissileWeapon.doThrow()`'s warning condition: the stack is down to its last missile, that
	 * throw would break it (`durabilityLeft() <= durabilityPerUse()`), and the stack is worth
	 * warning about - in Java "known and upgraded, or with a good enchant, or a mastery potion
	 * bonus, or hardened". This port's ammo is fungible class ammo with no per-stack enchant,
	 * hardening or mastery state, so the reachable clause is the upgrade level; `extraThrownLeft`
	 * has no expression here either (it is the flag the same warning is suppressed by).
	 */
	missileThrowNeedsConfirm(this: DungeonScene): boolean {
		return this.missileLevel > 0 && this.ammo === 1 && this.ammoDurability <= this.missileDurabilityCost();
	},

	/** `WndOptions`' yes/no, worded with SPD's own `break_upgraded_warn_*` strings (title is the
	 * missile's own name, as Java's `Messages.titleCase(title())` is). "Yes" re-enters
	 * `useSpecial` with the confirmation latched, so the throw runs its one real path.
	 *
	 * **The target has to be handed back explicitly (fixed 2026-09-16).** `useSpecial` consumes
	 * `specialTarget` as it resolves the target, which happens *before* this warning is raised - so
	 * re-entering with only the confirmation flag set re-resolved the target from scratch (Java's
	 * `doThrow` is re-entered with the same `enemy`), and with no other visible candidate the throw
	 * simply did not happen: the player answered "Yes" and nothing was spent or hit. Passing the
	 * resolved target through re-latches exactly what Java keeps. */
	confirmMissileThrow(this: DungeonScene, title: string, target: Creature): void {
		showConfirmWindow(
			this.gameWindows,
			title,
			t('port.confirm.lastmissile.desc'),
			t('port.confirm.lastmissile.yes'),
			t('port.confirm.lastmissile.no'),
			() => {
				this.missileThrowConfirmed = true;
				this.specialTarget = target;
				this.useSpecial();
			},
		);
	},

	missileDurabilityCost(this: DungeonScene): number {
		//`TippedDart.durabilityPerUse()` with `Talent.DURABLE_TIPS` (`TippedDart.java`, tag
		//`v3.3.8`): the use cost is divided by `1 + points` while a Warden throws tipped darts
		//(2x/3x/4x durability); rot darts are exempt and last longer outright (see
		//`tippedDartUseDivisor`). Any other wielded class keeps the ordinary formula below.
		//Both scale by `MagicalHolster.HOLSTER_DURABILITY_FACTOR` while the holster is owned
		//(Java multiplies the use count `1.2x` while the stack sits inside it - see `bags.ts`).
		const holsterFactor = this.ownsBag('magicalHolster') ? HOLSTER_DURABILITY_FACTOR : 1;
		if (this.ammoSourceClass === 'TippedDart') {
			const baseUses = missileBaseUses('TippedDart') * (this.ammoTippedSeed?.toLowerCase() === 'rotberry' ? 2 : 1);
			const divisor = tippedDartUseDivisor(this.ammoTippedSeed, this.talentRank('durable_tips'), this.subclass() === 'warden');
			const uses = Math.round(baseUses * Math.pow(1.5, this.missileLevel) / divisor
				* holsterFactor
				* ringSharpshootingDurabilityMultiplier(this.effectiveRing(), this.hero.magicImmune));
			if (uses >= 100) return 0;
			return 100 / Math.max(1, uses) + 0.001;
		}
		const baseUses = this.heroClass === 'duelist' ? 12 : 5;
		const durable = this.talentRank('durable_projectiles');
		const uses = Math.round(baseUses * Math.pow(1.5, this.missileLevel)
			* (durable > 0 ? 1.25 + 0.25 * durable : 1)
			* holsterFactor
			* ringSharpshootingDurabilityMultiplier(this.effectiveRing(), this.hero.magicImmune));
		if (uses >= 100) return 0;
		return 100 / Math.max(1, uses) + 0.001;
	},

	/** `Bag` ownership over the flat inventory (see `ownsBag` in `bags.ts`). */
	ownsBag(this: DungeonScene, id: BagId): boolean {
		return ownsBag(this.bag.items, id);
	},
};
