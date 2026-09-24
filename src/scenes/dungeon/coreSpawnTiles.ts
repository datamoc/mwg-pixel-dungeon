import type { DungeonScene } from '../dungeonScene';
import { fallenItemStore } from './fallenItems';
import { monsterSpeedFactor } from './monsters/monsterSpeed';
import { doorAwareLevel } from './monsters/doorAwareLevel';
import { placeCharacterArt } from '../../ui/characterPlacement';
import { FogOfWar } from '../../ui/fogOfWar';
import { WaterSurface } from '../../ui/waterSurface';
import { Container, FillGradient, Graphics, TilingSprite } from 'mwg/two-d/pixi-interop';
import { Actors, AnimatedSprite, Blob, Game, Label, Random, ReactionTable, Roguelike, SpriteSheet, TileMap, TintedSprite, theme } from 'mwg';
import { SceneSimulationAdapter } from '../../adapters/sceneSimulation';
import { weaponAbilityFor } from '../../items/weaponAbilities';
import { combinedStatBonusLevel, ringDef, ringEnergyMultiplier, ringMightBonus, RING_DEFS } from '../../items/ringModifiers';
import { MOB_KEYS, has, t } from '../../i18n/index';
import { evasiveArmorBonus, unencumberedSpiritEvasion } from '../../talentEffects';
import { SpdJavaRandom, spdScramble, spdSeedForDepth } from '../../spdRng';
import { isPortedDepth, miningBranchFloor, portedFloor, toGameTerrain } from '../../spdLevelGen/gameBridge';
import { CITY_BOTTOM_DOOR, CITY_TOP_DOOR, HALLS_EXIT_CELL } from '../../spdLevelGen/bossLevels';
import { hallsCenterPieceLayer, hallsCenterWallLayer } from '../../spdLevelGen/hallsBossVisuals';
import { cityGroundLayer, cityWallLayer } from '../../spdLevelGen/cityBossVisuals';
import { ritualMarkerLayer } from '../../spdLevelGen/ritualMarkerVisuals';
import { CAVES_GATE, cavesArenaLayer, cavesEntranceLayer, cavesOverhangLayer } from '../../spdLevelGen/cavesBossVisuals';
import { vaultBlockedCells } from '../../spdLevelGen/vaultVisuals';
import { setHourglassShopState } from '../../items/shopItems';
import { PLANT_VISUALS, TRAP_VISUALS } from '../../generated/terrainVisuals';
import { Terrain } from '../../spdLevelGen/paintLevel';
import { WallDecorationLayer, WaterEmberLayer, WellRippleLayer } from '../../ui/wallDecorations';
import { runState } from '../../runState';
import { isChallengeEnabled } from '../../challenges';
import { TALENT_TIERS } from '../../talents';
import { spiritHawkDodges } from '../../simulation/huntressAbilities';
import { prismaticGuardMaxHp, prismaticImageStats } from '../../simulation/prismatic';
import { mirrorImageStats } from '../../simulation/mirrorImage';
import { TOME_START_CHARGES } from '../../simulation/clericSpells';
import { CLASSES, HERO_IDLE_FRAME } from '../../classes';
import { menuScale } from '../../ui/spdButton';
import { allyIdentityColorAdd, buildMonsterCreature, buildMonsterSprite } from '../monsterSpawn';
import { repairBossUnsealStairs } from '../bossUnseal';
import { timeBubbleTurnCost } from '../../simulation/timeBubble';
import { mineTileFrames, foregroundGrassFrames as buildForegroundGrassFrames, terrainFrameAt as buildTerrainFrameAt, terrainFrames as buildTerrainFrames, wallFrameAt as buildWallFrameAt, wallFrames as buildWallFrames, waterFrames as buildWaterFrames, type DungeonTileFrameContext } from '../dungeonTileFrames';
import { bindZoomShortcuts } from './zoomShortcuts';
import { STARTING_WEAPON_CLASS, armorReductionRange, isClassArmorId, weaponCombat } from '../../items/catalog';
import { MWL_HERO_BASE_STATS, MWL_HERO_LEVEL_GROWTH } from '../../mwlContent';
import { dungeonRegion } from '../regions';
import { applyArmbandGainCharge, applyChainsGainExp, applyHornGainCharge, applyToolkitGainCharge } from '../../items/artifactActions';
import { type FloorState, type SavedCreature } from '../floorState';
import { monsterSpawnProfile } from '../../actors/monsterSpawn';
import { ritualSiteState } from '../../spdLevelGen/rooms/standard/ritualSiteRoom';
import { DOOR, GAME_KIND_CODES, HIGH_GRASS, SOLID, TERRAIN_KINDS, TILE, WALL, WATER, type GroundItemKind } from '../../dungeonConstants';
import { REGION_GRASS, REGION_WATER, generateSpdDungeon, regionForDepth, type Region } from '../../genericDungeon';
import { INFINITE_EVASION, addBuff, baseCreature, rollHit, type BuffId, type Creature, type GroundItem, type Step } from '../../combat';
import { BOSSES, MONSTERS, heroSheet, type AnyMonsterId } from '../../monsters';
import { HERO_SCHEDULER_ID, MOB_SCHEDULER_ID_PREFIX, NON_STATBLOCK_RING_STATS, SPD_LEVEL_CURVE, SUBCLASS_OPTIONS, wardTexture } from './shared';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `coreSpawnTiles`). Each takes the scene as 	his`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const coreSpawnTilesMethods = {
	/** `Dungeon.dropToChasm()`: queue the item for the depth below. */
	dropToChasm(this: DungeonScene, kind: GroundItemKind, item?: GroundItem['item'], chest?: GroundItem['chest']): void {
		const store = fallenItemStore(this);
		const list = store.get(this.depth + 1) ?? [];
		list.push({ kind, item, chest });
		store.set(this.depth + 1, list);
	},

	/**
	 * `GameScene`'s arrival block (tag v3.3.8): every item that fell to this depth lands on
	 * `randomRespawnCell` (a free cell out of the hero's view, else the entrance). Java also shatters
	 * a fallen potion, plants a fallen seed and shatters a honeypot on landing; here they land as
	 * ordinary items (stated simplification). One item per cell holds, so an item that cannot find a
	 * free cell beside the fallback is dropped on the nearest free one.
	 */
	landFallenItems(this: DungeonScene): void {
		const store = fallenItemStore(this);
		const fallen = store.get(this.depth);
		if (!fallen) return;
		store.delete(this.depth);
		for (const entry of fallen) {
			let at = this.randomFreeCell(this.hero);
			if (at && this.groundItemAt(at.x, at.y)) at = undefined;
			if (!at) {
				at = Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
					.find((cell) => this.level.passable(cell.x, cell.y) && !this.isChasmCell(cell.x, cell.y) && !this.groundItemAt(cell.x, cell.y));
			}
			if (at) this.spawnGroundItem(entry.kind, at.x, at.y, entry.item, entry.chest);
		}
	},

	buildSimulation(this: DungeonScene): SceneSimulationAdapter<Creature> {
		return new SceneSimulationAdapter<Creature>({
		scheduler: this.scheduler,
		isGameOver: () => this.gameOver,
		takeMonsterTurn: (actor) => this.takeMonsterTurn(actor),
		afterMonsterTurn: (actor) => this.afterMonsterTurn(actor),
			//A TimeBubble owner absorbs its own spends (`Char.spendConstant`) and costs 0
			//scheduler clock, so it acts again immediately; everyone else pays the base.
			monsterTurnCost: (monster) => timeBubbleTurnCost(monster.timeBubbleTurns,
				monster.kind === 'dm300' && monster.dmSupercharged ? 0.5 : (this.pendingMonsterTurnCost ?? 1) * monsterSpeedFactor(monster)),
		awaitHeroInput: () => {
			if (this.resurrectPending) return;
			this.awaitingInput = true;
			this.refresh();
			if (this.travelTarget) this.stepTravel();
		},
		readHunger: () => ({
			hunger: this.hunger,
			partialDamage: this.hungerPartialDamage,
			hp: this.hero.hp,
			maxHp: this.hero.maxHp,
		}),
		writeHunger: (state) => {
			this.hunger = state.hunger;
			this.hungerPartialDamage = state.partialDamage;
			this.hero.hp = state.hp;
		},
		presentHungerEvent: (event) => {
			switch (event.type) {
				case 'hungry': this.say(t('port.log.hungry'), 'warning'); break;
				case 'starving': this.say(t('port.log.starving'), 'warning'); break;
				case 'starvation-damage':
					this.showDamage(this.hero, event.damage);
					this.say(t('port.log.starvation', { damage: event.damage }), 'negative');
					break;
				case 'starvation-death': this.kill(this.hero, 'hunger'); break;
			}
		},
		});
	},

	sprite(this: DungeonScene, entity: { id: string }): TintedSprite {
		const sprite = this.spriteFor.get(entity.id);
		if (!sprite) throw new Error(`no sprite registered for entity ${entity.id}`);
		return sprite;
	},

	newItemInstanceId(this: DungeonScene, kind: string): string {
		return `${kind}-${this.runSeedLong.toString(36)}-${this.itemSerial++}`;
	},

	/** Lower-cased compact id of the wielded melee weapon (the same key
	 * `weaponAbilityFor` maps), for per-weapon Java rules (crossbow procs, the
	 * dagger-family surprise passive). */
	weaponMeleeKey(this: DungeonScene): string {
		const key = (this.weaponSourceClass ?? this.weaponId).toLowerCase();
		//the run-start weapon is one id for every class; its real class (worn shortsword, staff, dagger, gloves, rapier)
		//is what the per-weapon rules key on
		return key === 'startingweapon' ? STARTING_WEAPON_CLASS[this.heroClass] ?? key : key;
	},

	/** The logical (pre-zoom) size a window is laid out and placed in. */
	windowViewport(this: DungeonScene): { width: number; height: number } {
		return { width: Game.current.width / this.windowZoom, height: Game.current.height / this.windowZoom };
	},

	applyWindowZoom(this: DungeonScene, zoom: number): void { this.windowZoom = zoom; this.gameWindows.scale.set(zoom); this.gameWindows.setViewport(Game.current.width / zoom, Game.current.height / zoom); },

	/**
	 * Hero.java: HP=HT=20, attackSkill=10, defenseSkill=5 for every class; weapon (and, for the
	 * Cleric, its own accuracy multiplier) differs by CLASSES[id]. Plus HeroClass.initHero's
	 * real starting kit - ClothArmor (equipped, identified), Food, VelvetPouch, Waterskin and
	 * ScrollOfIdentify knowledge - and each init{Warrior,...} method's own extras: Warrior's
	 * stones + Healing/Rage knowledge, Mage's staff + Upgrade/LiquidFlame knowledge, Rogue's
	 * cloak + knives + Mapping/Invisibility knowledge, Huntress's bow + MindVision/Lullaby,
	 * Duelist's spikes + Strength/MirrorImage, Cleric's tome + Purity/RemoveCurse. Knowledge
	 * items grant one real scroll/potion of that kind (this port has no separate knowledge
	 * layer); the cloak's charge-based stealth is represented by the persisted bag charges.
	 */
	makeHero(this: DungeonScene): Creature {
		const def = CLASSES[this.heroClass];
		//The hero is an `AnimatedSprite` - which extends `TintedSprite`, so the colour channel the
		//hero's own flash/stealth tinting uses is still there - rather than a texture-swapping sprite
		//driven by a hand-rolled animator. It plays the same Java frame tables `HeroSprite` gives its
		//cloth tier, which a port-local animator used to walk by hand: idle `0,0,0,1,0,0,1,1` at
		//1 fps, run `2..7` at 20 fps, attack `13,14,15,0` at 15 fps once per swing, and the death
		//sequence `8,9,10,11,12,11` at 20 fps holding its last frame. Frame `i` is the cloth row's
		//`i	h cell, which is `HERO_IDLE_FRAME + i` on the class's own sheet.
		const sheet = heroSheet(runState.sprites[this.heroClass]);
		const frame = (index: number) => sheet.get(HERO_IDLE_FRAME + index);
		const sprite = new AnimatedSprite(frame(0));
		sprite.add('idle', [0, 0, 0, 1, 0, 0, 1, 1].map(frame), { fps: 1 });
		sprite.add('run', [2, 3, 4, 5, 6, 7].map(frame), { fps: 20 });
		sprite.add('attack', [13, 14, 15, 0].map(frame), { fps: 15, loop: false });
		sprite.add('die', [8, 9, 10, 11, 12, 11].map(frame), { fps: 20, loop: false });
		sprite.play('idle');
		placeCharacterArt(sprite);
		this.creatureLayer.addChild(sprite);

		this.talentRanks = {};
		this.talentTier = 1;
		this.heroBarrier.clear();
		this.barrierPartialLoss = 0;
		this.ascendedBarrier.clear();
		this.ascendedTurns = 0;
		this.ascendedSpellCasts = 0;
		this.ascendedFlashCasts = 0;
		this.ascendedDivineCast = false;
		this.blockingBarrier.clear();
		this.blockingTurnsLeft = 0;
		this.sealBarrier.clear();
		this.sealPartialGain = 0;
		this.armorSealed = false;
		this.itemPickerOpen = false;
		this.itemPickerEntries = [];
		this.itemPickerBody = undefined;
		this.itemPickerOnPick = null;
		this.deathlessFuryUsed = false;
		this.stealthTalentTicks = 0;
		this.cloakChargeProgress = 0;
		this.cloakStealthTurnsToCost = 0;
		this.natureBerriesDropped = 0;
		this.berryCounter = 0;
		this.burningIncrement = 0;
		this.intuitionTracker = false;
		this.suckerPunchTargets.clear();
		this.wandBonusDamage = 0;
		this.physicalBonusDamage = 0;
		this.physicalBonusAttacks = 0;
		this.patientStrikeReady = false;
		this.healingEvasionTurns = 0;
		this.talentPoints = [0, 0, 0, 0];
		this.progression = new Actors.Progression(SPD_LEVEL_CURVE, { level: 1, experience: 0 });
		this.gear = new Actors.EquipmentSlots(['weapon', 'armor'], null);
		this.gear.equip('armor', { modifiers: [] });
		this.armorInstanceId = this.newItemInstanceId('armor');
		this.bag.add({ id: 'clothArmor', quantity: 1, instanceId: this.armorInstanceId, identified: true, level: 0 });
		this.bag.add({ id: 'food', quantity: 1, stackable: true, identified: true });
		this.bag.add({ id: 'velvetPouch', quantity: 1, identified: true });
		this.noteBagAcquired('velvetPouch');
		//`HeroClass.initHero()` drops `LimitedDrops.VELVET_POUCH` unconditionally, for every
		//class - the starting pouch is never offered back by a later shop's `ChooseBag()`.
		this.droppedBags = ['velvetPouch'];
		this.bag.add({ id: 'scrollIdentify', quantity: 1, stackable: true, identified: true });
		this.bag.add({ id: 'waterskin', quantity: 1, identified: true });
		if (this.heroClass === 'warrior') {
			this.bag.add({ id: 'potionHealing', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollRage', quantity: 1, stackable: true, identified: true });
			//HeroClass.initWarrior(): `belongings.armor.affixSeal(new BrokenSeal())` - the seal is
			//affixed directly to the starting cloth armor, not carried as a separate item.
			this.armorSealed = true;
		} else if (this.heroClass === 'mage') {
			this.bag.add({ id: 'scrollUpgrade', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'potionFlame', quantity: 1, stackable: true, identified: true });
		} else if (this.heroClass === 'rogue') {
			this.bag.add({ id: 'cloak', quantity: 1, identified: true });
			const cloak = this.bag.find('cloak');
			if (cloak) (cloak as typeof cloak & { charges?: number }).charges = 3;
			this.bag.add({ id: 'scrollMapping', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'potionInvis', quantity: 1, stackable: true, identified: true });
		} else if (this.heroClass === 'huntress') {
			this.bag.add({ id: 'spiritBow', quantity: 1, identified: true });
			this.bag.add({ id: 'potionMindVision', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollLullaby', quantity: 1, stackable: true, identified: true });
		} else if (this.heroClass === 'duelist') {
			this.bag.add({ id: 'potionStrength', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollMirror', quantity: 1, stackable: true, identified: true });
		} else {
			//`HeroClass.initCleric()`'s `HolyTome` (identified, quickslotted) plus the
			//Purity/RemoveCurse knowledge this port grants as real items (see the
			//method's own comment). The tome arrives full at `min(0+3, 10)` charges.
			this.bag.add({ id: 'holyTome', quantity: 1, identified: true });
			const tome = this.bag.find('holyTome');
			if (tome) {
				const state = tome as typeof tome & { charge?: number; partialCharge?: number; level?: number; exp?: number };
				state.charge = TOME_START_CHARGES;
				state.partialCharge = 0;
				state.level = 0;
				state.exp = 0;
			}
			this.bag.add({ id: 'potionPurity', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollCleanse', quantity: 1, stackable: true, identified: true });
		}

		const hero = baseCreature({
			name: t('port.name.you'),
			x: 0,
			y: 0,
			hp: MWL_HERO_BASE_STATS.hp,
			maxHp: MWL_HERO_BASE_STATS.maxHp,
			accuracy: this.heroStats.get('accuracy'),
			evasion: this.heroStats.get('evasion') + (this.heroClass === 'rogue' ? 3 : 0),
			damage: def.damage,
			armor: [0, 2],
			isHero: true,
			speed: def.speed,
			sleeping: false,
			str: this.heroStr,
			strReq: MWL_HERO_BASE_STATS.strength,
			weaponLevel: 0,
		});
		this.spriteFor.set(hero.id, sprite);
		this.creatures.push(hero);
		return hero;
	},

	/** copies the StatBlock's resolved values into the flat fields combat actually reads - the same pattern mwg's own dungeon example uses for equipment */
	syncHeroFromStats(this: DungeonScene): void {
		//Brimstone.proc() has no damage-side effect: Java's glyph contributes a
		//Burning immunity in Char.isImmune(). Derive the shared buff-boundary flag
		//from the currently equipped glyph whenever equipment/stats are refreshed.
		this.hero.fireImmune = this.armorGlyphActive() && this.armorGlyph === 'brimstone';
		this.hero.magicImmune = this.armorGlyphActive() && this.armorGlyph === 'antimagic';
		//Hero.java increments the raw skills, then applies weapon/armor factors when
		//attackSkill()/defenseSkill() is queried. Keep those counters separate from
		//talent points so every level has the real +1/+1 combat-skill growth.
		//`Cudgel.ACC = 1.40`: the 40% accuracy bonus lives on the Cleric's starting weapon, not the
		//class - a Cleric wielding anything else attacks at unmodified skill. There is no weapon-item
		//model here to hang the factor on, so the stand-in applies while `weaponId` is still the
		//implicit starting cudgel (`Hero.attackSkill()` rounds `skill * 1.4`, which equals the
		//floor for this factor - `1.4 * skill` never lands on exactly x.5 for integer skill).
		this.heroStats.setBase('accuracy', Math.floor(this.heroAttackSkill * (this.heroClass === 'cleric' && this.weaponId === 'startingWeapon' ? 1.4 : 1)) + this.talentAccuracy);
		this.heroStats.setBase('evasion', this.heroDefenseSkill + this.talentEvasion);
		this.hero.accuracy = this.heroStats.get('accuracy');
		this.hero.evasion = this.heroStats.get('evasion') + evasiveArmorBonus(this.subclass(), this.talentRank('evasive_armor'), this.armorLevel) + unencumberedSpiritEvasion(this.subclass(), this.talentRank('unencumbered_spirit'));
		//`Quarterstaff` defensive stance: triples evasion while up (`ability_desc`).
		if (this.defensiveStanceTurns > 0) this.hero.evasion *= 3;
		//Guard (`Hero.defenseSkill`, tag `v3.3.8`): infinite evasion while the tracker
		//runs - every incoming attack misses, not just the first. The old one-negated-
		//hit model in 	akeHeroDamage` is gone with it.
		if (this.guardTurns > 0) this.hero.evasion = 1000000;
		//`Combo.ParryTracker` (`Hero.defenseSkill`): infinite evasion while the Parry window is up.
		if (this.comboParryTurns > 0) this.hero.evasion = 1000000;
		if (this.healingEvasionTurns > 0) this.hero.evasion = this.talentRank('restored_agility') >= 2 ? 1000000 : this.hero.evasion * 4;
		this.hero.str = this.heroStr + ringMightBonus(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing());
		if (this.hero.buffs['adrenalineSurge']) this.hero.str += 1;
		//Strongman is the one always-on T1/T2 talent that changes Hero.STR directly.
		this.hero.str += Math.floor(this.heroStr * (0.03 + 0.05 * this.talentRank('strongman')));
		//MeleeWeapon: min = tier+lvl, max = 5*(tier+1)+lvl*(tier+1). Tier affects scaling:
		//tier 1: [1+lvl, 10+2*lvl], tier 2: [2+lvl, 15+3*lvl], etc.
		//Starting values (from CLASSES) are ignored; tier determines base damage.
		//`Item.buffedLevel()`: under Degrade both read through `degradedLevel` - the only
		//two formulas Java routes through buffed levels (damage rolls and armor DR); proc
		//chances and upgrade-loss rolls below deliberately keep the TRUE level (`level()`).
		const effWeapon = this.degradedLevel(this.effectiveWeaponLevel());
		const effArmor = this.degradedLevel(this.effectiveArmorLevel());
		//The wielded class's own `max(lvl)` (`weaponCombatRules` in `item-rules.mwl`): about twenty-six of the
		//thirty-one melee classes override the default formula, so a tier alone gave most weapons the wrong range.
		const weaponRule = weaponCombat(this.weaponMeleeKey(), this.weaponTier, effWeapon);
		this.hero.damage = [weaponRule.min, weaponRule.max];
		const bark = this.talentRank('barkskin');
		//Armor: min = lvl, max = tier*(2+lvl). Tier 1 (cloth): [lvl, 2+lvl],
		//tier 2 (leather): [lvl, 4+2*lvl], tier 3 (mail): [lvl, 6+3*lvl], etc.
		//Armor.DRMin/DRMax under the real NO_ARMOR challenge: min drops to a flat 0, max drops to
		//1+tier+lvl(+augment, not modeled here) instead of the normal tier*(2+lvl) scaling -
		//found dead alongside champion_enemies/darkness while auditing every challenge toggle.
		//`bark` (Barkskin talent rank) is this port's own additive layer on top of either
		//formula, not part of Java's DRMin/DRMax bodies themselves, so it stays unconditional.
		this.hero.armor = isChallengeEnabled('no_armor')
			? [bark > 0 ? 1 : 0, 1 + this.armorTier + effArmor + bark]
			: (() => {
				const reduction = armorReductionRange(this.armorTier, effArmor);
				return [reduction[0] + (bark > 0 ? 1 : 0), reduction[1] + bark];
			})();
		//`Talent.HOLD_FAST`: `HoldFast.armorBonus()` is Java's own separate
		//`NormalIntRange(0, 2*points)` roll, summed onto the armor roll's *result* rather than
		//widening its range - folded into `hero.armor[1]` here instead (this port's one shared
		//`normalRange(armor[0], armor[1])` call has no seam for a second independent roll),
		//matching the precedent `bark` already sets two lines up. Only min is left alone since
		//Java's own roll floors at 0.
		if (this.holdFastX === this.hero.x && this.holdFastY === this.hero.y) {
			this.hero.armor = [this.hero.armor[0], this.hero.armor[1] + 2 * this.talentRank('hold_fast')];
		}
		//`Hero.drRoll()`: a wielded weapon adds its own `NormalIntRange(0, defenseFactor)` roll (the shields,
		//katana, quarterstaff, rapier). Folded into the armor range like Hold Fast above: the ends and the
		//mean match Java, the bell is flatter. Not ported: the `2 * missing STR` penalty on that roll.
		if (weaponRule.defense > 0) {
			this.hero.armor = [this.hero.armor[0], this.hero.armor[1] + weaponRule.defense];
		}
		const subclass = this.subclass();
		if (subclass === 'champion') this.hero.damage = [this.hero.damage[0] + 1, this.hero.damage[1] + 1];
		if (subclass === 'warden' && this.level && this.level.get(this.hero.x, this.hero.y) === HIGH_GRASS) {
			this.hero.armor = [this.hero.armor[0] + 2, this.hero.armor[1] + 2];
		}
		//Passive affix math lives here, next to every other flat stat. Stone used to
		//be one of these (+2 armor) - it is not: `Stone.proc()` converts dodge
		//chance into damage reduction on every landed hit (see `attack()`), so no
		//armor line belongs to it at all. Wayward's penalty is deliberately *not*
		//one of these either - see the buff-gated assignment after the ring block
		//below.
		//ring effects: Might already widened hero.str above; Tenacity's real
		//`RingOfTenacity.damageMultiplier()` is applied directly to incoming damage in
		//`absorbHeroDamage` (it scales with current missing HP, so it can't be baked into a
		//static StatBlock modifier here) - skipped in this loop the same way 'strength' is;
		//Accuracy/Evasion ride the StatBlock as source-'ring' modifiers, re-applied whole
		//through scaledModifiers with the ring's own curve evaluated at its level
		this.heroStats.removeModifiersFrom('ring');
		{
			//Trinity SpiritForm's ring is an *independent* second ring (`trinitySpiritRing()`),
			//so Accuracy/Evasion - the two stats this StatBlock loop carries - are computed per
			//stat, not per ring: each reads `combinedStatBonusLevel`'s Java fallback (the
			//equipped ring's own bonus for that stat, or the spirit ring's when the equipped
			//one is exactly 0 or absent - `Ring.getBuffedBonus()`, tag `v3.3.8`). An equipped
			//Accuracy ring and a spirit Evasion ring (or vice versa) both apply at once, since
			//they are different stats; two of the same stat never do (the fallback, not a sum).
			const spiritRing = this.trinitySpiritRing();
			const equippedDef = this.equippedRing ? ringDef(this.equippedRing.id) : undefined;
			const spiritDef = spiritRing ? ringDef(spiritRing.id) : undefined;
			//Stats applied outside this StatBlock loop (direct damage/turn-cost reads) are
			//marker-only here: Might (str), Tenacity (incoming-damage curve), Haste/Energy
			//(turn-cost/wand-rate divisors), Wealth/Arcana/Force/Sharpshooting (kill-loot,
			//proc-chance, flat damage bonuses), Elements (elemental-damage multiplier) and
			//Furor (attack-only turn-cost divisor). A Set, not an OR-chain (see ROADMAP Â§11).
			const relevantStats = new Set(
				[equippedDef, spiritDef]
					.filter((def): def is NonNullable<typeof def> => def !== undefined && !NON_STATBLOCK_RING_STATS.has(def.stat))
					.map((def) => def.stat),
			);
			for (const stat of relevantStats) {
				const level = combinedStatBonusLevel(this.effectiveRing(), spiritRing, stat, this.hero.magicImmune);
				const def = RING_DEFS[stat]!;
				for (const modifier of Actors.scaledModifiers(level, [{ stat, op: def.op, base: def.at(level), perLevel: 0 }])) {
					this.heroStats.addModifier({ ...modifier, source: 'ring' });
				}
			}
			if (relevantStats.size > 0) this.hero.evasion = this.heroStats.get('evasion') + (this.heroClass === 'rogue' ? 3 : 0);
		}
		//`Weapon.accuracyFactor(this, target)`: while the cursed weapon's own
		//`Wayward.WaywardBuff` is up, the weapon's `ACC` (1 for every ordinary weapon) is divided
		//by 5 - and that factor multiplies the hero's whole attack skill, since
		//`Hero.attackSkill()` is `max(1, round(attackSkill * accuracy * factor))`. What stood here
		//docked a flat 3 accuracy for as long as a wayward weapon was *equipped* (the ring block
		//above re-added it on the ring path), i.e. permanently; Java's penalty exists only while
		//the buff is up, and `Wayward.proc` is what toggles it (`Wayward.java` 41-45).
		this.hero.accuracy = this.weaponAffix === 'wayward' && this.hero.buffs['wayward'] !== undefined
			? Math.max(1, Math.round(this.heroStats.get('accuracy') / 5))
			: this.heroStats.get('accuracy');
		if (subclass === 'freerunner' && !this.creatures.some((c) => !c.isHero && !c.isNPC && Roguelike.chebyshevDistance(this.hero, c) <= 1)) { this.hero.evasion += 2; }
		this.refreshHeroArmorSprite();
	},

	/** `HeroSprite.updateArmor()` (tag `v3.3.8`) rebuilds every animation from `Hero.tier()`; Java reports ClassArmor as tier 6 even though its copied combat tier remains ordinary, so this port refreshes the visible row whenever stats sync. */
	refreshHeroArmorSprite(this: DungeonScene): void { const s = this.spriteFor.get(this.hero?.id ?? -1); if (!(s instanceof AnimatedSprite)) return; const base = Math.max(0, Math.min(6, isClassArmorId(this.armorId) ? 6 : this.armorTier)) * 21, sheet = heroSheet(runState.sprites[this.heroClass]), frame = (i: number) => sheet.get(base + i), playing = s.playing; s.add('idle', [0, 0, 0, 1, 0, 0, 1, 1].map(frame), { fps: 1 }).add('run', [2, 3, 4, 5, 6, 7].map(frame), { fps: 20 }).add('attack', [13, 14, 15, 0].map(frame), { fps: 15, loop: false }).add('die', [8, 9, 10, 11, 12, 11].map(frame), { fps: 20, loop: false }).play(playing && s.has(playing) ? playing : 'idle', true); },

	/**
	 * `Hero.java`'s level-up block: `HT = 20 + 5*(lvl-1)`, `attackSkill++`, `defenseSkill++`
	 * every level. Talent points follow `Talent.tierLevelThresholds`'
	 * real windows: tier 1 spans levels 2-6, tier 2 levels 7-12, and subclass talent points
	 * continue through the later tiers. The panel exposes the Java Tier 1/2 nodes and the
	 * selected subclass's Tier 3 nodes; Advancement still owns the level-13 branch and the
	 * level-21 armor-ability choice.
	 */
	grantExperience(this: DungeonScene, amount: number): void {
		//`AlchemistsToolkit.kitEnergy.gainCharge()` (`Hero.earnExp()`, tag `v3.3.8`): every raw
		//XP grant feeds the toolkit's own charge pool as `percent = exp/maxExp()` against the
		//hero's *current* level - before any level-ups this same grant causes - matching real
		//Java, which reads `maxExp()` (current-level-based) before applying the exp itself.
		//See `applyToolkitGainCharge`'s doc comment in `artifactActions.ts`.
		if (amount > 0) {
			const currentLevelMaxExp = SPD_LEVEL_CURVE.experienceFor(this.progression.level + 1) - SPD_LEVEL_CURVE.experienceFor(this.progression.level);
			if (currentLevelMaxExp > 0) {
				applyToolkitGainCharge({ bag: this.bag }, amount / currentLevelMaxExp, ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(), this.hero.magicImmune === true);
				//`MasterThievesArmband.Thievery.gainCharge()` (tag `v3.3.8`): the same per-XP-grant
				//hook as the toolkit call just above - see `applyArmbandGainCharge`'s own doc comment.
				applyArmbandGainCharge({ bag: this.bag }, amount / currentLevelMaxExp, ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(), this.hero.magicImmune === true);
				//`HornOfPlenty.hornRecharge.gainCharge()` (tag `v3.3.8`): the same per-XP-grant hook
				//again - see `applyHornGainCharge`'s own doc comment in `artifactActions.ts`.
				applyHornGainCharge({ bag: this.bag }, amount / currentLevelMaxExp, ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(), this.hero.magicImmune === true);
				//`EtherealChains.chainsRecharge.gainExp()` (tag `v3.3.8`): unlike the three hooks
				//above, this one also drives the artifact's own leveling (see `applyChainsGainExp`'s
				//doc comment in `artifactActions.ts` for how its charge/level math differs from theirs).
				applyChainsGainExp({ bag: this.bag, say: this.say.bind(this) }, amount / currentLevelMaxExp, this.hero.magicImmune === true);
			}
		}

		const gained = this.progression.addExperience(amount);
		if (gained <= 0) return;

		for (let i = 0; i < gained; i++) {
			const level = this.progression.level - gained + i + 1;
			const oldMax = this.hero.maxHp;
			this.hero.maxHp = MWL_HERO_BASE_STATS.maxHp + MWL_HERO_LEVEL_GROWTH.hpPerLevel * (level - 1);
			this.hero.hp += this.hero.maxHp - oldMax;
			this.heroAttackSkill += MWL_HERO_LEVEL_GROWTH.attackSkillPerLevel;
			this.heroDefenseSkill += MWL_HERO_LEVEL_GROWTH.defenseSkillPerLevel;
			this.syncHeroFromStats();

			//Talent points are intentionally separate from the combat-skill counters. Each
			//tier's own window (see 	alentPoints`'s own comment) grants into that tier's own
			//bucket only. T4's [21,31) window grants only once an armor ability *with a ported
			//talent tree* has been chosen, which is Java's own gate (`Hero.talentPointsAvailable(4)`
			//returns 0 while `armorAbility == null`) narrowed to what this port can actually spend
			//points on: Ratmogrify's three rat talents are Not ported, so granting it a pool would
			//bank points that no tab can ever spend (its T4 tab is hidden for the same reason).
			if (level >= TALENT_TIERS[1] && level < TALENT_TIERS[2]) this.talentPoints[0]++;
			else if (level >= TALENT_TIERS[2] && level < TALENT_TIERS[3]) this.talentPoints[1]++;
			else if (level >= TALENT_TIERS[3] && level < TALENT_TIERS[4]) this.talentPoints[2]++;
			else if (level >= TALENT_TIERS[4] && this.hasArmorTalentTree()) this.talentPoints[3]++;
			//Advancement tier 3 (the subclass branch) lives on its own real threshold (13)
			this.advancement.grant(level);
			//Java never prompts for a subclass on a level: `TengusMask` is the only way in (see
			//`useTengusMask`), and the mask drops when Tengu dies.
		}

		this.say(t('port.log.levelup', { level: this.progression.level }), 'positive');
		runState.audio.cue('levelup', 0.75);

		//The point ledger remains available in the panel; the subclass branch is also presented
		//there instead of silently choosing the first option.
	},

	/** any monster in MONSTERS, cut from its own real sprite sheet at its own real frame size */
	spawnMonster(this: DungeonScene, kind: AnyMonsterId, at: Step, restoring = false, mimicLoot?: string, isAlly = false, allyKind?: 'mirror' | 'sheep' | 'ward' | 'earthGuardian' | 'lotus' | 'ghost' | 'ninjaLog' | 'spiritHawk' | 'lightAlly' | 'afterImage' | 'shadowClone' | 'prismatic', championEligible = false, initialSentryWarmup?: number, schedulerDelay?: number): Creature {
		const profile = monsterSpawnProfile(kind, this.depth, restoring, isAlly, championEligible, this.mobsToChampion);
		this.mobsToChampion = profile.mobsToChampion;
		//Data-driven: was a 12-case cascade checking both `kind` and `baseKind` - see
		//`SPRITE_KIND_OVERRIDE`'s own doc comment in monsters.ts for why `baseKind` alone
		//covers every case the original also checked `kind` for.
		const sprite = buildMonsterSprite(kind, at, profile, wardTexture);
		this.creatureLayer.addChild(sprite);

		const monster = buildMonsterCreature(kind, at, profile, isAlly, allyKind, mimicLoot);
		if (kind === 'sentry' && initialSentryWarmup !== undefined) monster.sentryInitialWarmup = initialSentryWarmup;
		this.spriteFor.set(monster.id, sprite);
		if (isAlly) {
			sprite.alpha = 0.72;
			sprite.colorAdd = allyIdentityColorAdd(isAlly, allyKind);
		}
		//`HawkAlly`'s `attacksAutomatically = false` is a property of the class, not of a summoning,
		//so it is set here and survives a load without being persisted.
		if (allyKind === 'spiritHawk') monster.attacksAutomatically = false;
		//Monk.java: enters HUNTING with Focus (one guaranteed dodge, re-earned over ~6 turns)
		if (kind === 'monk' || kind === 'senior') addBuff(monster, 'focus');
		this.creatures.push(monster);
		this.applyStatueKit(monster);
		// A restored creature receives its saved scheduler time below. Rolling a fresh stagger
		// here would both lose turn order and perturb the run's random stream.
		if (!restoring) this.scheduler.add(monster, schedulerDelay ?? Random.float(0.1, 0.9));
		return monster;
	},

	/** `PowerOfMany.LightAlly` (`PowerOfMany.java`, tag `v3.3.8`): the summoned ally is an
	 * 80-HP DirectableAlly with hero-level attack/defense skills, a 5-30 damage roll and 1-5 DR.
	 * Java picks one of the five original hero classes in its constructor and draws that class's
	 * cloth-tier animation; this uses the same five-class pool and sprite frames. */
	spawnLightAlly(this: DungeonScene, at: Step): Creature {
		const classes = ['warrior', 'mage', 'rogue', 'huntress', 'duelist'] as const;
		const heroClass = classes[Random.int(0, classes.length)]!;
		const ally = this.spawnMonster('rat', at, false, undefined, true, 'lightAlly', false, undefined, 0);
		ally.name = t('port.ally.lightally.name');
		ally.hp = ally.maxHp = 80;
		ally.accuracy = this.progression.level + 9;
		ally.evasion = this.progression.level + 4;
		ally.damage = [5, 30];
		ally.armor = [1, 5];
		ally.lightAllyClass = heroClass;
		ally.noExp = true;
		ally.powerOfManyBarrier = 25;
		ally.powerOfManyBarrierPartial = 0;
		this.syncLightAllyVisual(ally);
		return ally;
	},

	/** Rebuild `LightAllySprite.setup(cls)` using the real class cloth frames after save/load. */
	syncLightAllyVisual(this: DungeonScene, ally: Creature): void {
		if (ally.allyKind !== 'lightAlly') return;
		this.sprite(ally).destroy();
		const cls = ally.lightAllyClass ?? 'warrior';
		const sheet = heroSheet(runState.sprites[cls]);
		const frame = (index: number) => sheet.get(HERO_IDLE_FRAME + index);
		const sprite = new AnimatedSprite(frame(0));
		sprite.add('idle', [0, 0, 0, 1, 0, 0, 1, 1].map(frame), { fps: 1 });
		sprite.add('run', [2, 3, 4, 5, 6, 7].map(frame), { fps: 20 });
		sprite.add('attack', [13, 14, 15, 0].map(frame), { fps: 15, loop: false });
		sprite.add('die', [frame(0)], { fps: 1, loop: false });
		sprite.play('idle');
		placeCharacterArt(sprite);
		sprite.x = ally.x * TILE;
		sprite.y = ally.y * TILE;
		sprite.alpha = 0.8;
		//Java applies a pale gold/white four-channel tint; Pixi's flat tint is this port's
		//closest single-colour treatment of that glow.
		sprite.tint = 0xffeeaa;
		this.creatureLayer.addChild(sprite);
		this.spriteFor.set(ally.id, sprite);
	},

	/** ScrollOfMirrorImage's two one-hit-point allied copies use the hero's current combat
	 * values. Java's `MirrorSprite` uses the hero's own class sheet and changes its armor-tier
	 * film, so replace the temporary factory sprite with that same class sheet here rather than
	 * using an unrelated monster as a graphical carrier. */
	spawnMirrorImage(this: DungeonScene, at: Step): Creature {
		const image = this.spawnMonster('rat', at, false, undefined, true);
		image.name = `${this.hero.name} (image)`;
		image.hp = 1;
		image.maxHp = 1;
		//`MirrorImage` is immune to ToxicGas, CorrosiveGas, Burning and AllyBuff
		//(tag `v3.3.8`): the gases ride the blob paths below (see `isToxicImmune`
		//and `applyCorrosion`), Burning rides this flag through `buffBlocked`
		//exactly like the prismatic image's own, and AllyBuff has no system here.
		image.fireImmune = true;
		image.sleeping = false;
		image.seesHero = true;
		image.allyKind = 'mirror';
		//`duplicate()` affects the image with `MirrorInvis` (`Short.MAX_VALUE` -
		//invisible until the first landed hit). 9999 is the catalogue's
		//effectively-permanent stand-in (the prismatic-guard precedent); the
		//detach rides `attack()`'s existing aggressive-action dispel, and the
		//first swing surprises through `rollHit`'s own invisible-attacker rule.
		//Stated gap: Java detaches on the landed hit (`attackProc`), this port
		//on the swing - a missed first swing reveals the image early.
		addBuff(image, 'invisibility', 9999);
		this.syncMirrorImage(image);
		const carrier = this.sprite(image);
		carrier.destroy();
		const mirrorSheet = heroSheet(runState.sprites[this.heroClass]);
		const mirrorFrame = Math.max(0, Math.min(5, this.armorTier)) * 21;
		const sprite = new TintedSprite(mirrorSheet.get(mirrorFrame));
		placeCharacterArt(sprite);
		sprite.x = at.x * TILE;
		sprite.y = at.y * TILE;
		this.creatureLayer.addChild(sprite);
		this.spriteFor.set(image.id, sprite);
		sprite.alpha = 0.72;
		return image;
	},

	/** `Feint.AfterImage`: a one-turn decoy left at the cell the hero just blinked out of.
	 * `AfterImageSprite extends MirrorSprite` (same class-armor film, `alpha(0.6f)`), so this
	 * shares the mirror image's sprite factory. Unlike a real Mirror Image it never dies - its
	 * `damage()` is a no-op in Java, and every attack against it is intercepted in `attack()`
	 * (`defender.allyKind === 'afterImage'`) before any damage roll runs at all - so `hp`/`armor`
	 * here exist only to satisfy the shared `Creature` shape and are never actually spent.
	 * 	akeAllyTurn`'s own `afterImage` branch destroys it on its first scheduled turn, which is
	 * this port's equivalent of Java's `actPriority = HERO_PRIO+1` (fades right before the hero's
	 * own next turn, after every hostile in earshot has had exactly one turn to take the bait). */
	spawnAfterImage(this: DungeonScene, at: Step): Creature {
		const image = this.spawnMonster('rat', at, false, undefined, true);
		image.name = `${this.hero.name} (image)`;
		image.hp = 1;
		image.maxHp = 1;
		image.sleeping = false;
		image.seesHero = false;
		image.allyKind = 'afterImage';
		const carrier = this.sprite(image);
		carrier.destroy();
		const mirrorSheet = heroSheet(runState.sprites[this.heroClass]);
		const mirrorFrame = Math.max(0, Math.min(5, this.armorTier)) * 21;
		const sprite = new TintedSprite(mirrorSheet.get(mirrorFrame));
		placeCharacterArt(sprite);
		sprite.x = at.x * TILE;
		sprite.y = at.y * TILE;
		this.creatureLayer.addChild(sprite);
		this.spriteFor.set(image.id, sprite);
		sprite.alpha = 0.6;
		return image;
	},

	/** `Sheep.initialize(lifespan)` (`Sheep.java`, tag `v3.3.8`): a neutral,
	 * invulnerable NPC that spends `lifespan + Float(-2, 2)` and destroys itself on
	 * its next turn - the flock stone passes 8, the woolly bomb passes 20 on a boss
	 * floor and 200 otherwise. `INFINITE_EVASION` plus the `buffBlocked` sheep gate
	 * are the `defenseSkill`/`add()` halves; the damage `damage()` no-op halves ride
	 * the blob/bomb/shocker skips below (melee can never land through infinite
	 * evasion, and traps only ever target the hero). `Sheep.interact` (the Baa
	 * lines, the hero's spent turn, the woolly dispel) has no tap-ally seam here.
	 */
	/** `PrismaticImage.duplicate()`: the exotic scroll's guard hatches into this - a weaker
	 * hero clone (`HT = PrismaticGuard.maxHP`, current HP = the guard pool leftovers)
	 * that keeps the hero's armor film like a mirror image (Java's `PrismaticSprite`
	 * is the hero sheet plus an armor tier, which is exactly this factory). Immune
	 * to ToxicGas, CorrosiveGas and Burning (`fireImmune` covers the last; the two
	 * gases and `AllyBuff` ride the blob/buff paths below - see 	ickPrismaticGuard`
	 * and PORT_COVERAGE.md). `actPriority = MOB_PRIO + 1` has no expression: no ally
	 * carries a scheduler priority here, so the image queues like every other ally.
	 * `intelligentAlly` is the shared ally AI below, which already fights and follows.
	 */
	spawnPrismaticImage(this: DungeonScene, at: Step, hp: number): Creature {
		const image = this.spawnMonster('rat', at, false, undefined, true, 'prismatic');
		image.name = t('actors.mobs.npcs.prismaticimage.name');
		image.maxHp = prismaticGuardMaxHp(this.progression.level);
		image.hp = Math.max(1, Math.min(image.maxHp, Math.trunc(hp)));
		image.fireImmune = true;
		image.sleeping = false;
		image.seesHero = true;
		this.syncPrismaticImage(image);
		const carrier = this.sprite(image);
		carrier.destroy();
		const mirrorSheet = heroSheet(runState.sprites[this.heroClass]);
		const mirrorFrame = Math.max(0, Math.min(5, this.armorTier)) * 21;
		const sprite = new TintedSprite(mirrorSheet.get(mirrorFrame));
		placeCharacterArt(sprite);
		sprite.x = at.x * TILE;
		sprite.y = at.y * TILE;
		this.creatureLayer.addChild(sprite);
		this.spriteFor.set(image.id, sprite);
		sprite.alpha = 0.72;
		return image;
	},

	/** Re-reads a mirror image's hero-derived combat stats (`duplicate()` binds the
	 * hero for life; every formula below reads it live). Runs at spawn and on each
	 * image turn - the old spawn-time copy went stale on every weapon swap and
	 * level-up, and dealt full hero damage where Java deals `(damage+1)/2`.
	 * Accuracy is Java's `(9 + lvl) * accuracyMultiplier` (truncated); evasion is
	 * `1 * (base + heroEv) / 2` with `base = 4 + lvl` (truncated, same shape as
	 * `prismaticImageStats`); damage halves each live bound rounded up (Java
	 * halves the roll: `ceil(d/2)`); DR copies the hero's tuple. Stated gaps: the
	 * attacking weapon's `accuracyFactor` (only the cudgel factor is modeled,
	 * hero-side), the armor's `evasionFactor`, the weapon's `defenseFactor()/2`
	 * DR half, the weapon `proc()` share, `MirrorInvis` (spawn invisibility
	 * until the first hit), and the hero's own `attackDelay` (ally turns spend
	 * the uniform cost here).
	 */
	syncMirrorImage(this: DungeonScene, image: Creature): void {
		const level = this.progression.level;
		const spiritRing = this.trinitySpiritRing();
		const accBonus = combinedStatBonusLevel(this.effectiveRing(), spiritRing, 'accuracy', this.hero.magicImmune);
		const evBonus = combinedStatBonusLevel(this.effectiveRing(), spiritRing, 'evasion', this.hero.magicImmune);
		const stats = mirrorImageStats(level, Math.pow(1.3, accBonus), Math.pow(1.125, evBonus),
			this.hero.damage[0], this.hero.damage[1]);
		image.accuracy = stats.accuracy;
		image.evasion = stats.evasion;
		image.damage = [stats.damageMin, stats.damageMax];
		image.armor = [...this.hero.armor] as [number, number];
	},

	/** Re-reads the image's hero-derived combat stats (`duplicate()` binds the hero for
	 * life; every formula below reads it live). Runs at spawn and on each image turn,
	 * the hawk/shadow-clone precedent for live-scaling summons. The armor's own
	 * `evasionFactor`/`proc`/glyph-maximum hooks have no expression in this port's
	 * armor model (flat DR tuple, hero-side-only glyph path), so evasion reads the
	 * ring-scaled value and DR copies the hero's tuple - both stated in PORT_COVERAGE.
	 */
	syncPrismaticImage(this: DungeonScene, image: Creature): void {
		const level = this.progression.level;
		const spiritRing = this.trinitySpiritRing();
		const accBonus = combinedStatBonusLevel(this.effectiveRing(), spiritRing, 'accuracy', this.hero.magicImmune);
		const evBonus = combinedStatBonusLevel(this.effectiveRing(), spiritRing, 'evasion', this.hero.magicImmune);
		const stats = prismaticImageStats(level, Math.pow(1.3, accBonus), Math.pow(1.125, evBonus));
		image.accuracy = stats.accuracy;
		image.evasion = stats.evasion;
		image.damage = [stats.damageMin, stats.damageMax];
		image.armor = [...this.hero.armor] as [number, number];
	},

	spawnSheep(this: DungeonScene, at: Step, lifespan: number): Creature {
		const sheep = this.spawnMonster('sheep', at, false, undefined, true, 'sheep');
		sheep.name = t(MOB_KEYS.sheep);
		sheep.hp = sheep.maxHp = 1;
		//`initialize()`: `spend(lifespan + Float(-2, 2))` - the same jitter on the
		//turn countdown, since a sheep turn here is one scheduler turn there.
		sheep.sheepTurns = Math.max(1, Math.round(Random.float(lifespan - 2, lifespan + 2)));
		sheep.evasion = INFINITE_EVASION;
		sheep.sleeping = false;
		const sprite = this.sprite(sheep);
		sprite.alpha = 0.62;
		sprite.colorAdd = 0xdddddd;
		return sheep;
	},

	/** `WandOfRegrowth.Lotus`: an immovable neutral helper with `25 + 3*wandLvl` HP that
	 * loses one HP on each of its own actor turns (WandOfRegrowth.java, tag v3.3.8). A ward
	 * carrier keeps the existing scheduler/render/save plumbing; its ally turn is intercepted
	 * below so it cannot attack or be targeted as a normal ward. */
	spawnLotus(this: DungeonScene, at: Step, wandLevel: number): Creature {
		const lotus = this.spawnMonster('ward', at, false, undefined, true, 'lotus');
		lotus.name = 'Lotus';
		lotus.hp = lotus.maxHp = 25 + 3 * wandLevel;
		lotus.sheepTurns = lotus.hp;
		lotus.sleeping = false;
		lotus.accuracy = 0;
		lotus.damage = [0, 0];
		return lotus;
	},

	captureActiveFloor(this: DungeonScene): void {
		if (this.activeFloorDepth === null) return;
		const creatures: SavedCreature[] = [];
		const savedIndex = new Map<Creature, number>();
		for (const creature of this.creatures) {
			if (!creature.isHero && creature.kind) savedIndex.set(creature, savedIndex.size);
		}
		for (const creature of this.creatures) {
			if (creature.isHero || !creature.kind) continue;
			creatures.push({
				kind: creature.kind,
				x: creature.x, y: creature.y, hp: creature.hp, maxHp: creature.maxHp,
				accuracy: creature.accuracy, evasion: creature.evasion,
				damage: [...creature.damage] as [number, number], armor: [...creature.armor] as [number, number],
				buffs: Object.entries(creature.buffs) as [BuffId, number][],
				sleeping: creature.sleeping, champion: creature.champion, championPower: creature.championPower, pumped: creature.pumped,
				combo: creature.combo, moving: creature.moving, arenaJumps: creature.arenaJumps, tenguPhase: creature.tenguPhase, tenguAbilityCd: creature.tenguAbilityCd, tenguAbilityUses: creature.tenguAbilityUses, tenguLastAbility: creature.tenguLastAbility,
				// These collections are mutated in place by the live boss turns (`shift` and the
				// shocker tick). Copy them so an in-memory FloorState cannot alias a live creature.
				tenguFire: creature.tenguFire ? {
					direction: creature.tenguFire.direction,
					beam: {
						...creature.tenguFire.beam,
						fronts: creature.tenguFire.beam.fronts.map((front) => front.map((cell) => ({ ...cell }))),
						path: creature.tenguFire.beam.path?.map((cell) => ({ ...cell })),
					},
				} : undefined,
				tenguShockers: creature.tenguShockers?.map((shocker) => ({ ...shocker })),
				gooHealInc: creature.gooHealInc,
				focusCooldown: creature.focusCooldown,
				shamanType: creature.shamanType,
				yogPhase: creature.yogPhase, yogFistType: creature.yogFistType, elementalType: creature.elementalType, yogSummonCd: creature.yogSummonCd, yogSummonIndex: creature.yogSummonIndex, yogBeamCd: creature.yogBeamCd,
				yogTargeted: creature.yogTargeted ? [...creature.yogTargeted] : undefined,
				yogFistDeck: creature.yogFistDeck ? [...creature.yogFistDeck] : undefined,
				yogChallengeDeck: creature.yogChallengeDeck ? [...creature.yogChallengeDeck] : undefined,
				yogMinionDeck: creature.yogMinionDeck ? [...creature.yogMinionDeck] : undefined,
				fistZapCd: creature.fistZapCd,
				potPos: creature.potPos ? { ...creature.potPos } : undefined, potHolderId: creature.potHolderId,
				kingPhase: creature.kingPhase, kingSummonsMade: creature.kingSummonsMade, kingSummonCd: creature.kingSummonCd,
				kingAbilityCd: creature.kingAbilityCd, kingLastAbility: creature.kingLastAbility, kingShield: creature.kingShield,
				kingWaveCd: creature.kingWaveCd, noExp: creature.noExp, kingDamager: creature.kingDamager,
				deferredDamage: creature.deferredDamage, deferredDamageDelay: creature.deferredDamageDelay,
				corrosionTurns: creature.corrosionTurns, corrosionDamage: creature.corrosionDamage,
				sungrassLevel: creature.sungrassLevel, sungrassPartial: creature.sungrassPartial, sungrassPos: creature.sungrassPos,
				earthrootArmorLevel: creature.earthrootArmorLevel, earthrootArmorPos: creature.earthrootArmorPos,
						barkskinLevel: creature.barkskinLevel, barkskinInterval: creature.barkskinInterval, barkskinCooldown: creature.barkskinCooldown,
				kingReactionsState: creature.kingReactions?.toJSON(),
				weaponLevel: creature.weaponLevel, stolen: creature.stolen, mimicLoot: creature.mimicLoot, generation: creature.generation,
				armbandStolen: creature.armbandStolen,
				spawnCooldown: creature.spawnCooldown, seesHero: creature.seesHero,
				fleeing: creature.fleeing,
				ratmogrifiedTurns: creature.ratmogrifiedTurns,
				ratmogrifiedPermanent: creature.ratmogrifiedPermanent,
				deathMarkTurns: creature.deathMarkTurns,
				duelTakenDmg: creature.duelTakenDmg,
				deathMarkInitialHp: creature.deathMarkInitialHp,
				patrolTarget: creature.patrolTarget ? { ...creature.patrolTarget } : undefined,
				lastSeen: creature.lastSeen ? { ...creature.lastSeen } : undefined,
				timeBubbleTurns: creature.timeBubbleTurns,
				mimicRevealed: creature.mimicRevealed,
				hasteTurns: creature.hasteTurns, hasteBaseSpeed: creature.hasteBaseSpeed,
				hasRaged: creature.hasRaged, raged: creature.raged, chainUsed: creature.chainUsed,
				ventCooldown: creature.ventCooldown, webCooldown: creature.webCooldown, golemTeleCooldown: creature.golemTeleCooldown,
				golemSelfTeleCooldown: creature.golemSelfTeleCooldown,
				beamCharged: creature.beamCharged, beamCooldown: creature.beamCooldown, armoredRageTicks: creature.armoredRageTicks, blinkCooldown: creature.blinkCooldown,
				leapTarget: creature.leapTarget ? { ...creature.leapTarget } : undefined, leapCooldown: creature.leapCooldown,
				leapLastEnemy: creature.leapLastEnemy ? { ...creature.leapLastEnemy } : undefined,
				leapPrevEnemy: creature.leapPrevEnemy ? { ...creature.leapPrevEnemy } : undefined,
				pylonActive: creature.pylonActive, pylonTargetNeighbor: creature.pylonTargetNeighbor,
				rangedCooldown: creature.rangedCooldown, newbornTarget: creature.newbornTarget ? { ...creature.newbornTarget } : undefined,
				stuckAmmo: creature.stuckAmmo, sentryWarmup: creature.sentryWarmup, divineShield: creature.divineShield,
				sentryInitialWarmup: creature.sentryInitialWarmup,
				dmAbilityTurns: creature.dmAbilityTurns, dmAbilityCd: creature.dmAbilityCd, dmLastAbility: creature.dmLastAbility,
				dmSupercharged: creature.dmSupercharged, dmPylonsActivated: creature.dmPylonsActivated, dmBarrier: creature.dmBarrier,
				wraithLevel: creature.wraithLevel,
				skeletonIndex: creature.skeleton ? savedIndex.get(creature.skeleton) : undefined,
				firstSummon: creature.firstSummon,
				impShopkeeperGreeted: creature.impShopkeeperGreeted,
				isAlly: creature.isAlly,
				allyKind: creature.allyKind,
				lightAllyClass: creature.lightAllyClass,
				powerOfManyBarrier: creature.powerOfManyBarrier,
				powerOfManyBarrierPartial: creature.powerOfManyBarrierPartial,
				prismaticFade: creature.prismaticFade,
				sheepTurns: creature.sheepTurns,
				wardTier: creature.wardTier, wardWandLevel: creature.wardWandLevel, wardTotalZaps: creature.wardTotalZaps,
				earthGuardianWandLevel: creature.earthGuardianWandLevel, earthGuardianDefense: creature.earthGuardianDefense,
				spiritHawkTime: creature.spiritHawkTime, spiritHawkDodges: creature.spiritHawkDodges,
				nextTurn: this.scheduler.timeOf(creature),
			});
		}
		this.floorStates.set(this.activeFloorDepth, {
			terrain: Array.from(this.level.terrain),
			doors: this.doors.toJSON(),
			secrets: this.secrets.toJSON(),
			trapKinds: [...this.trapKinds],
			spentTrapCells: [...this.spentTrapCells],
			gatewayTelePos: [...this.gatewayTelePos],
			secretDoorCells: [...this.secretDoorCells],
			crystalDoorCells: [...this.crystalDoorCells],
			keyWalls: [...this.keyWalls].map(([cell, wall]) => [cell, { ...wall }] as [number, { turns: number; original: number }]),
			fire: this.fire.toJSON(),
			plantGas: this.plantGas.toJSON(),
			plantFreeze: this.plantFreeze.toJSON(),
			toxicGas: this.toxicGas.toJSON(),
			toxicGasVents: [...this.toxicGasVents],
			paralyticGas: this.paralyticGas.toJSON(),
			stenchGas: this.stenchGas.toJSON(),
			corrosiveGas: this.corrosiveGas.toJSON(),
			corrosiveGasStrength: this.corrosiveGasStrength,
			confusionGas: this.confusionGas.toJSON(),
			web: this.web.toJSON(),
			electricity: this.electricity.toJSON(),
			smokeScreen: this.smokeScreen.toJSON(),
			inferno: this.inferno.toJSON(),
			blizzard: this.blizzard.toJSON(),
			portedFeatures: this.portedFeatures.toJSON(),
			ritualPos: this.ritualPos,
			ritualCandles: [...this.ritualCandles],
			eternalFire: this.eternalFire.toJSON(),
			sacrificialFire: this.sacrificialFire.toJSON(),
			sacrificialFireCharge: this.sacrificialFireCharge,
			sacrificialFireCell: this.sacrificialFireCell,
			sacrificialFirePrize: this.sacrificialFirePrize,
			groundItems: this.groundItems.map(({ kind, x, y, item, chest, forSale, missileLevel, missileSet, tippedSeed }) => ({ kind, x, y, item, chest, forSale, missileLevel, missileSet, tippedSeed })),
			fallingRocks: this.fallingRocks.map((v) => ({ cells: v.cells.map((c) => ({ ...c })), turns: v.turns })),
			cavesBossEnergyCells: [...this.cavesBossEnergyCells],
			manualPlants: [...this.manualPlants.entries()],
			furrowedGrass: [...this.furrowedGrass],
			creatures,
			schedulerNow: this.scheduler.now,
			//The whole queue, not just `now`: see `FloorState.scheduler`'s own doc comment. Keys are
			//this port's own - `mob-<index>` into the `creatures` array above (the same indexes
			//`savedIndex`/`skeletonIndex` already use) and a fixed key for the hero, which that array
			//deliberately excludes because it outlives every floor.
			scheduler: this.scheduler.toJSON((creature) =>
				creature.isHero ? HERO_SCHEDULER_ID : `${MOB_SCHEDULER_ID_PREFIX}${savedIndex.get(creature)}`),
		});
	},

	restoreFloor(this: DungeonScene, state: FloorState): void {
		if (state.terrain.length !== this.level.cellCount) return;
		this.level.terrain.set(state.terrain);
		this.secrets = Roguelike.Secrets.fromJSON(this.level, state.secrets);
		this.doors = Roguelike.Doors.fromJSON(this.level, state.doors);
		this.trapKinds = new Map(state.trapKinds);
		this.spentTrapCells = new Set(state.spentTrapCells ?? []);
		this.gatewayTelePos = new Map(state.gatewayTelePos ?? []);
		this.secretDoorCells = new Set(state.secretDoorCells);
		this.crystalDoorCells = new Set(state.crystalDoorCells);
		this.keyWalls = new Map((state.keyWalls ?? []).map(([cell, wall]) => [cell, { ...wall }]));
		this.fire = Blob.fromJSON(state.fire);
		this.plantGas = state.plantGas ? Blob.fromJSON(state.plantGas) : new Blob(this.level.width, this.level.height);
		this.plantFreeze = state.plantFreeze ? Blob.fromJSON(state.plantFreeze) : new Blob(this.level.width, this.level.height);
		this.toxicGas = state.toxicGas ? Blob.fromJSON(state.toxicGas) : new Blob(this.level.width, this.level.height);
		this.toxicGasVents = new Map(state.toxicGasVents ?? []);
		this.paralyticGas = state.paralyticGas ? Blob.fromJSON(state.paralyticGas) : new Blob(this.level.width, this.level.height);
		this.stenchGas = state.stenchGas ? Blob.fromJSON(state.stenchGas) : new Blob(this.level.width, this.level.height);
		this.corrosiveGas = state.corrosiveGas ? Blob.fromJSON(state.corrosiveGas) : new Blob(this.level.width, this.level.height);
		this.corrosiveGasStrength = state.corrosiveGasStrength ?? 0;
		this.confusionGas = state.confusionGas ? Blob.fromJSON(state.confusionGas) : new Blob(this.level.width, this.level.height);
		this.web = state.web ? Blob.fromJSON(state.web) : new Blob(this.level.width, this.level.height);
		this.electricity = state.electricity ? Blob.fromJSON(state.electricity) : new Blob(this.level.width, this.level.height);
		this.smokeScreen = state.smokeScreen ? Blob.fromJSON(state.smokeScreen) : new Blob(this.level.width, this.level.height);
		this.inferno = state.inferno ? Blob.fromJSON(state.inferno) : new Blob(this.level.width, this.level.height);
		this.blizzard = state.blizzard ? Blob.fromJSON(state.blizzard) : new Blob(this.level.width, this.level.height);
		this.manualPlants = new Map(state.manualPlants ?? []);
		this.furrowedGrass = new Set(state.furrowedGrass ?? []);
		this.fallingRocks = (state.fallingRocks ?? []).map((v) => ({ cells: v.cells.map((c) => ({ ...c })), turns: v.turns }));
		this.cavesBossEnergyCells = new Set(state.cavesBossEnergyCells ?? []);
		this.restorePortedFeatures(state.portedFeatures);
		for (const [cell, kind] of this.manualPlants) this.placePortedFeature(cell, kind);
		this.eternalFire = state.eternalFire ? Blob.fromJSON(state.eternalFire) : new Blob(this.level.width, this.level.height);
		this.ritualPos = state.ritualPos ?? -1;
		this.ritualCandles = [...(state.ritualCandles ?? [false, false, false, false])];
		this.sacrificialFire = state.sacrificialFire ? Blob.fromJSON(state.sacrificialFire) : new Blob(this.level.width, this.level.height);
		this.sacrificialFireCharge = state.sacrificialFireCharge ?? 0;
		this.sacrificialFireCell = state.sacrificialFireCell ?? -1;
		this.sacrificialFirePrize = state.sacrificialFirePrize;
		for (const item of state.groundItems) {
			this.spawnGroundItem(item.kind, item.x, item.y, item.item, item.chest, item.forSale);
			const heap = this.groundItemAt(item.x, item.y);
			if (heap) {
				heap.missileLevel = item.missileLevel;
				heap.missileSet = item.missileSet;
				heap.tippedSeed = item.tippedSeed;
			}
		}

		this.scheduler.clear();
		this.scheduler.now = state.schedulerNow;
		const restored: Creature[] = [];
		for (const saved of state.creatures) {
			const creature = this.spawnMonster(saved.kind, saved, true, saved.mimicLoot, saved.isAlly, saved.allyKind);
			Object.assign(creature, {
				hp: saved.hp, maxHp: saved.maxHp, accuracy: saved.accuracy, evasion: saved.evasion,
				damage: [...saved.damage] as [number, number], armor: [...saved.armor] as [number, number],
				buffs: Object.fromEntries(saved.buffs), sleeping: saved.sleeping, champion: saved.champion,
				championPower: saved.championPower, pumped: saved.pumped, gooHealInc: saved.gooHealInc, focusCooldown: saved.focusCooldown, shamanType: saved.shamanType, combo: saved.combo, moving: saved.moving, arenaJumps: saved.arenaJumps, tenguPhase: saved.tenguPhase, tenguAbilityCd: saved.tenguAbilityCd, tenguAbilityUses: saved.tenguAbilityUses, tenguLastAbility: saved.tenguLastAbility, tenguFire: saved.tenguFire, tenguShockers: saved.tenguShockers,
				yogPhase: saved.yogPhase, yogFistType: saved.yogFistType, elementalType: saved.elementalType, yogSummonCd: saved.yogSummonCd, yogSummonIndex: saved.yogSummonIndex, yogBeamCd: saved.yogBeamCd, yogTargeted: saved.yogTargeted, yogFistDeck: saved.yogFistDeck, yogChallengeDeck: saved.yogChallengeDeck, yogMinionDeck: saved.yogMinionDeck, fistZapCd: saved.fistZapCd,
				potPos: saved.potPos ? { ...saved.potPos } : undefined, potHolderId: saved.potHolderId,
				kingPhase: saved.kingPhase, kingSummonsMade: saved.kingSummonsMade, kingSummonCd: saved.kingSummonCd,
				kingAbilityCd: saved.kingAbilityCd, kingLastAbility: saved.kingLastAbility, kingShield: saved.kingShield,
				kingWaveCd: saved.kingWaveCd, noExp: saved.noExp, kingDamager: saved.kingDamager,
				deferredDamage: saved.deferredDamage, deferredDamageDelay: saved.deferredDamageDelay,
				corrosionTurns: saved.corrosionTurns, corrosionDamage: saved.corrosionDamage,
				sungrassLevel: saved.sungrassLevel, sungrassPartial: saved.sungrassPartial, sungrassPos: saved.sungrassPos,
				earthrootArmorLevel: saved.earthrootArmorLevel, earthrootArmorPos: saved.earthrootArmorPos,
						barkskinLevel: saved.barkskinLevel, barkskinInterval: saved.barkskinInterval, barkskinCooldown: saved.barkskinCooldown,
				kingReactions: saved.kingReactionsState
					? ReactionTable.fromJSON(this.kingPhaseRules(creature), saved.kingReactionsState)
					: undefined,
				weaponLevel: saved.weaponLevel, stolen: saved.stolen, mimicLoot: saved.mimicLoot, generation: saved.generation,
				armbandStolen: saved.armbandStolen,
				spawnCooldown: saved.spawnCooldown, seesHero: saved.seesHero,
				fleeing: saved.fleeing,
				ratmogrifiedTurns: saved.ratmogrifiedTurns,
				ratmogrifiedPermanent: saved.ratmogrifiedPermanent,
				deathMarkTurns: saved.deathMarkTurns,
				duelTakenDmg: saved.duelTakenDmg,
				deathMarkInitialHp: saved.deathMarkInitialHp,
				patrolTarget: saved.patrolTarget ? { ...saved.patrolTarget } : undefined,
				lastSeen: saved.lastSeen ? { ...saved.lastSeen } : undefined,
				timeBubbleTurns: saved.timeBubbleTurns,
				mimicRevealed: saved.mimicRevealed ?? (saved.kind === 'mimic' ? true : Boolean(saved.stolen)),
				hasteTurns: saved.hasteTurns, hasteBaseSpeed: saved.hasteBaseSpeed,
				hasRaged: saved.hasRaged, raged: saved.raged, chainUsed: saved.chainUsed,
				ventCooldown: saved.ventCooldown, webCooldown: saved.webCooldown, golemTeleCooldown: saved.golemTeleCooldown,
				golemSelfTeleCooldown: saved.golemSelfTeleCooldown,
				beamCharged: saved.beamCharged, beamCooldown: saved.beamCooldown, armoredRageTicks: saved.armoredRageTicks, blinkCooldown: saved.blinkCooldown,
				leapTarget: saved.leapTarget ? { ...saved.leapTarget } : undefined, leapCooldown: saved.leapCooldown,
				leapLastEnemy: saved.leapLastEnemy ? { ...saved.leapLastEnemy } : undefined,
				leapPrevEnemy: saved.leapPrevEnemy ? { ...saved.leapPrevEnemy } : undefined,
				pylonActive: saved.pylonActive, pylonTargetNeighbor: saved.pylonTargetNeighbor,
				rangedCooldown: saved.rangedCooldown, newbornTarget: saved.newbornTarget ? { ...saved.newbornTarget } : undefined,
				stuckAmmo: saved.stuckAmmo, sentryWarmup: saved.sentryWarmup, divineShield: saved.divineShield,
				sentryInitialWarmup: saved.sentryInitialWarmup,
				dmAbilityTurns: saved.dmAbilityTurns, dmAbilityCd: saved.dmAbilityCd, dmLastAbility: saved.dmLastAbility,
				dmSupercharged: saved.dmSupercharged ?? false, dmPylonsActivated: saved.dmPylonsActivated ?? 0, dmBarrier: saved.dmBarrier ?? 0,
				wraithLevel: saved.wraithLevel,
				firstSummon: saved.firstSummon ?? true,
				impShopkeeperGreeted: saved.impShopkeeperGreeted ?? false,
				isAlly: saved.isAlly,
				allyKind: saved.allyKind,
				lightAllyClass: saved.lightAllyClass,
				powerOfManyBarrier: saved.powerOfManyBarrier,
				powerOfManyBarrierPartial: saved.powerOfManyBarrierPartial,
				prismaticFade: saved.prismaticFade,
				sheepTurns: saved.sheepTurns,
				wardTier: saved.wardTier, wardWandLevel: saved.wardWandLevel, wardTotalZaps: saved.wardTotalZaps,
				earthGuardianWandLevel: saved.earthGuardianWandLevel, earthGuardianDefense: saved.earthGuardianDefense,
				//`HawkAlly.storeInBundle`'s two fields. The ally's standing order is not saved (see
				//`Creature.allyDefendCell`'s note), but how long the hawk has left is its own state.
				spiritHawkTime: saved.spiritHawkTime, spiritHawkDodges: saved.spiritHawkDodges,
				speed: saved.hasteTurns ? (saved.hasteBaseSpeed ?? 1) * 2 : undefined,
			});
			this.syncMimicVisual(creature);
			this.syncLightAllyVisual(creature);
			this.applyStatueKit(creature);
			restored.push(creature);
		}
		for (let i = 0; i < state.creatures.length; i++) {
			const skeletonIndex = state.creatures[i].skeletonIndex;
			if (skeletonIndex !== undefined) restored[i].skeleton = restored[skeletonIndex] ?? null;
		}
		//`BossHealthBar.bleed(true)` is transition-latched, not HP-derived: a save loaded
		//into King P3 or Yog P5 re-latches from the persisted phase (see `bossBleedLatched`).
		this.bossBleedLatched = restored.some((creature) =>
			(creature.kind === 'king' && (creature.kingPhase ?? 1) === 3)
			|| (creature.kind === 'yog' && (creature.yogPhase ?? 1) === 5));
		//The turn queue itself: `Scheduler.restore` puts back `now`, the `sequence` counter and each
		//entry's time/sequence/priority, so a load resumes the exact queue instead of re-deriving one.
		//Actors are looked up by the same keys `captureActiveFloor` wrote - `mob-<index>` into the
		//array just rebuilt, plus the hero, which that array deliberately excludes. A key that does
		//not resolve is thrown rather than swallowed: `restore` inserts whatever `actorOf` returns,
		//and an `undefined` entry would only surface later as a crash inside the turn loop.
		if (state.scheduler) {
			const byId = new Map<string, Creature>(restored.map((creature, index) => [`${MOB_SCHEDULER_ID_PREFIX}${index}`, creature]));
			this.scheduler = Roguelike.Scheduler.restore(state.scheduler, (id) => {
				if (id === HERO_SCHEDULER_ID) return this.hero;
				const creature = byId.get(id);
				if (!creature) throw new Error(`saved turn queue references an unknown actor: ${id}`);
				return creature;
			});
			//The hero is in the restored queue already (with the turn time and sequence it had), so
			//`enterLevel` must not add it a second time - `Scheduler.add` does not guard duplicates and
			//a duplicate entry would give the hero two turns per round. Derived from the snapshot rather
			//than assumed: a queue that somehow holds no hero entry falls back to the plain add below,
			//which is also what keeps `advanceToInput` able to stop on hero input.
			this.restoredHeroQueued = state.scheduler.entries.some((entry) => entry.id === HERO_SCHEDULER_ID);
			//`buildSimulation()` captured the scheduler instance it was built with, and this is a new
			//one, so the bridge is rebuilt against it.
			this.simulation = this.buildSimulation();
		} else {
			//A save from before the queue was serialised: `schedulerNow` plus each creature's
			//`nextTurn` still rebuild a working queue, just without the original tie order.
			for (let index = 0; index < state.creatures.length; index++) {
				const saved = state.creatures[index];
				this.scheduler.add(restored[index], Math.max(0, (saved.nextTurn ?? state.schedulerNow) - state.schedulerNow));
			}
		}
		//Rebuild any in-progress Tengu fire cone from its saved beam: the live `MultiTurnBeam`
		//itself is never serialized, only its 	oJSON()` on the creature's 	enguFire`. A save
		//written before the beam adoption carries the old `{ direction, cells }` shape instead, so
		//the `beam` guard simply drops that cone rather than crashing on it.
		for (const creature of restored) {
			if (creature.tenguFire?.beam) {
				this.tenguBeams.set(creature, this.rebuildTenguBeam(creature.tenguFire.direction, creature.tenguFire.beam, creature));
			}
		}
	},

	enterLevel(this: DungeonScene): void {
		this.captureActiveFloor();
		//Ctrl+wheel / Ctrl+plus/minus zoom, bound once per scene (see the module).
		bindZoomShortcuts(this);
		//`seerCells` are floor indices: a new floor has a different width and cell layout, so
		//stale entries would reveal the wrong cells. The cooldown is hero state and survives.
		this.seerCells.clear();
		//Pixi keeps a per-render-group list of renderables still awaiting a transform update.
		//A container dropped from the tree without being destroyed can stay on that list, and
		//updating it then reads `parentRenderGroup` off nothing - "Cannot read properties of
		//undefined (reading 'updateRenderable')".  The outgoing floor's tilemap holds a sprite
		//per cell per layer, so it is destroyed rather than merely orphaned; the same goes for
		//the stair and entrance sprites, which are rebuilt per floor further down.
		//
		//The hero's sprite is the one exception - it outlives the floor and is re-added below -
		//so it is detached before the layer is emptied, keeping it clear of the destroy.
		if (this.hero) this.creatureLayer.removeChild(this.sprite(this.hero));
		this.map?.destroy({ children: true });
		this.wallsMap?.destroy({ children: true });
		this.featuresMap?.destroy({ children: true });
		this.fog?.destroy();
		this.wallBlocking?.destroy({ children: true });
		this.waterSurface?.destroy({ children: true });
		this.miningBorder?.destroy();
		this.miningBorder = null;
		this.mineTiles?.destroy();
		this.mineTiles = null;
		this.mineOverhangs?.destroy();
		this.mineOverhangs = null;
		this.branchQuestEntrance?.destroy();
		this.branchQuestEntrance = null;
		this.demonSpawnerFloor?.destroy();
		this.demonSpawnerFloor = null;
		this.wellRipples?.destroy({ children: true });
		this.wellRipples = null;
		//the custom-tilemap layers go with the floor like every other map: dropping them from the
		//world without destroying them leaves a live `SpriteSheet` on the reference, and updating a
		//detached `TileMap` reads `parentRenderGroup` off nothing
		this.vaultVisuals?.destroy({ children: true });
		this.vaultVisuals = null;
		this.cavesBossTiles?.destroy({ children: true });
		this.cavesBossTiles = null;
		this.cavesBossWalls?.destroy({ children: true });
		this.cavesBossWalls = null;
		this.hallsBossCenter?.destroy({ children: true });
		this.hallsBossCenter = null;
		this.hallsBossCenterWalls?.destroy({ children: true });
		this.hallsBossCenterWalls = null;
		this.cityBossTiles?.destroy({ children: true });
		this.cityBossTiles = null;
		this.cityBossWalls?.destroy({ children: true });
		this.cityBossWalls = null;
		this.ritualMarker?.destroy({ children: true });
		this.ritualMarker = null;
		this.stairsSprite = undefined;
		//the floater layer itself survives the floor (it is re-added below), but its live
		//texts must not: a damage number from the last floor would hang in mid-air on this one
		this.floaters.clear();
		this.camera.world.removeChild(this.floaters);
		// the bursts go with the world: `camera.world.removeChildren()` below detaches them, so
		// keeping their references would leave the update ticking destroyed emitters
		for (const burst of this.effectBursts) burst.emitter.destroy();
		this.effectBursts = [];
		this.teleportFades = [];
		for (const mark of this.surpriseMarks) mark.sprite.destroy();
		this.surpriseMarks = [];
		//health bars are per-creature and every non-hero creature is about to be dropped
		for (const bar of this.healthBars.values()) bar.destroy();
		this.healthBars.clear();
		this.compass?.reset();
		this.camera.world.removeChildren();
		for (const sprite of this.creatureLayer.removeChildren()) sprite.destroy();
		for (const motion of this.monsterMotion.values()) motion.clear();
		this.monsterMotion.clear();
		this.dyingMonsters.clear();
		this.tenguBeams.clear();
		this.characterEffects?.clear();
		for (const sprite of this.itemLayer.removeChildren()) sprite.destroy();
		this.creatures = this.creatures.filter((c) => c.isHero);
		this.groundItems = [];
		this.manualPlants.clear();
		this.furrowedGrass.clear();
		this.portedMobSpawns = [];
		this.portedMobCells.clear();
		this.portedBranchExitCells.clear();
		this.portedWellWater.clear();
		this.scheduler.clear();

		const region = regionForDepth(this.depth);
		const savedFloor = this.miningBranchActive ? null : this.floorStates.get(this.depth);
		if (this.depth === 26) runState.audio.vaultMusic(this.gameState.switch('amuletObtained'));
		else runState.audio.enterDungeon(region, this.depth in BOSSES);
		this.terrainSheet = SpriteSheet.fromTexture(runState.sprites[region], TILE);

		//One run seed owns every floor.  The previous depth-only seed made floor 1 identical
		//in every run, so a screenshot could never be compared against a selected seed.
		//
		//Sewers 1-4 and Prison 6-9 come from spdLevelGen/, the port verified byte-identical to
		//the real Java game (PORT_COVERAGE.md); every other depth still uses the generic
		//generateSpdDungeon below, since this port does not generate boss arenas or the three
		//regions past the Prison.  The ported floor arrives complete - real rooms, doors, water,
		//grass and traps in their real positions - so the terrain passes that follow are all
		//skipped for it rather than overwriting exactly what was verified.
		const hourglass = this.bag.find('hourglass');
		setHourglassShopState(hourglass ? {
			identified: hourglass.identified ?? false,
			cursed: hourglass.cursed ?? false,
			sandBags: (hourglass as typeof hourglass & { sandBags?: number }).sandBags ?? hourglass.level ?? 0,
		} : null);
		//`ritualSiteState` is levelgen-module state: reset before generating so a stale
		//value from another floor (or a cache-hit revisit that generates nothing) can never
		//leak into this floor's adoption below - `restoreFloor` supplies the persisted value
		//on revisits instead.
		ritualSiteState.ritualPos = -1;
		const ported = this.miningBranchActive
			? miningBranchFloor(this.runSeedLong, this.depth, this.blacksmithQuestType, isChallengeEnabled('darkness'))
			: isPortedDepth(this.depth) ? portedFloor(this.runSeedLong, this.depth, isChallengeEnabled('stronger_bosses')) : null;
		this.portedFloorActive = ported !== null;
		this.portedPaint = ported?.paint ?? null;
		//`HallsBossLevel.seal()` persists in Java's own saved map; this port regenerates paint
		//from the seed on every visit, so a sealed run re-applies the spent entrance here -
		//before any tile layer reads the grid - rather than in the trigger below, which only
		//fires on a live approach. The live map needs no change: both tiles collapse to 'floor'.
		if (ported && this.depth === 25 && this.hallsBossSealed && !this.bossUnsealedDepths.has(25) && ported.entrance) {
			ported.paint.map[ported.entrance.y * ported.width + ported.entrance.x] = Terrain.EMPTY_SP;
		}
		//Same regenerated-paint repair for the Caves gate: the walled entrance otherwise comes
		//back as ENTRANCE art over a WALL live cell after every load. The live WALL itself
		//survives via the floor capture, like the energy cells and DM-300 below it.
		if (ported && this.depth === 15 && this.cavesBossSealed && !this.bossUnsealedDepths.has(15) && ported.entrance) {
			ported.paint.map[ported.entrance.y * ported.width + ported.entrance.x] = Terrain.WALL;
		}
		//And the Sewer gate: the drowned entrance likewise comes back dry. The live WATER
		//survives via the floor capture; both layers are refreshed from the paint grid below.
		if (ported && this.depth === 5 && this.sewerBossSealed && !this.bossUnsealedDepths.has(5) && ported.entrance) {
			ported.paint.map[ported.entrance.y * ported.width + ported.entrance.x] = Terrain.WATER;
		}
		//`CityBossLevel.seal()` persists in Java's own saved map the same way: a sealed run
		//re-applies the locked bottom door here. The doors registry itself comes back via
		//the floor capture below; this is the paint-grid half the visuals read.
		if (ported && this.depth === 20 && this.cityBossSealed && !this.bossUnsealedDepths.has(20)) {
			ported.paint.map[CITY_BOTTOM_DOOR.y * ported.width + CITY_BOTTOM_DOOR.x] = Terrain.LOCKED_DOOR;
		}
		//An unsealed boss floor keeps its exit open across reloads: re-apply the unseal's
		//paint writes (the live terrain itself survives via the floor capture, restored
		//below). The stairs half is repaired after `restoreFloor` - see
		//`repairBossUnsealStairs`.
		if (ported && this.bossUnsealedDepths.has(this.depth)) {
			if (this.depth === 15) {
				for (let x = CAVES_GATE.left; x < CAVES_GATE.right; x++) {
					ported.paint.map[CAVES_GATE.top * ported.width + x] = Terrain.EMPTY;
				}
			} else if (this.depth === 20) {
				ported.paint.map[CITY_BOTTOM_DOOR.y * ported.width + CITY_BOTTOM_DOOR.x] = Terrain.DOOR;
				ported.paint.map[CITY_TOP_DOOR.y * ported.width + CITY_TOP_DOOR.x] = Terrain.DOOR;
			} else if (this.depth === 25) {
				ported.paint.map[HALLS_EXIT_CELL.y * ported.width + HALLS_EXIT_CELL.x] = Terrain.EXIT;
				if (ported.entrance) ported.paint.map[ported.entrance.y * ported.width + ported.entrance.x] = Terrain.ENTRANCE;
			}
		}
		this.restorePortedFeatures();
		if (ported) {
			this.level = new Roguelike.Level(ported.width, ported.height, TERRAIN_KINDS, WALL);
			this.level.terrain.set(toGameTerrain(ported, GAME_KIND_CODES));
			this.level.rooms = ported.rooms;
			//`LastLevel.create()`'s unwalkable cells - the vault's pit cells and its sealed
			//entrance chamber. Java mutates `passable`/`avoid`/`solid` per cell; the port's level
			//takes passability from the terrain kind, so those cells take the SOLID kind while
			//their tile keeps coming from the paint grid (see that constant's comment).
			if (this.depth === 26) {
				for (const cell of vaultBlockedCells(ported.paint.map, ported.width, ported.height)) {
					this.level.terrain[cell] = SOLID;
				}
			}
		} else {
			const floorSeed = spdSeedForDepth(this.runSeedLong, this.depth);
			this.level = generateSpdDungeon(48, 32, TERRAIN_KINDS.slice(2), floorSeed);
		}
		this.secrets = new Roguelike.Secrets(this.level);
		this.doors = new Roguelike.Doors(this.level);
		this.trapKinds = new Map();
		this.spentTrapCells = new Set();
		this.gatewayTelePos = new Map();
		this.secretDoorCells = new Set();
		this.crystalDoorCells = new Set();
		this.keyWalls = new Map();
		this.fire = new Blob(this.level.width, this.level.height);
		this.plantGas = new Blob(this.level.width, this.level.height);
		this.plantFreeze = new Blob(this.level.width, this.level.height);
		this.toxicGas = new Blob(this.level.width, this.level.height);
		this.toxicGasVents = new Map();
		this.paralyticGas = new Blob(this.level.width, this.level.height);
		this.stenchGas = new Blob(this.level.width, this.level.height);
		this.corrosiveGas = new Blob(this.level.width, this.level.height);
		this.corrosiveGasStrength = 0;
		this.confusionGas = new Blob(this.level.width, this.level.height);
		this.web = new Blob(this.level.width, this.level.height);
		this.electricity = new Blob(this.level.width, this.level.height);
		this.smokeScreen = new Blob(this.level.width, this.level.height);
		this.inferno = new Blob(this.level.width, this.level.height);
		this.blizzard = new Blob(this.level.width, this.level.height);
		this.eternalFire = new Blob(this.level.width, this.level.height);
		this.ritualPos = -1;
		this.ritualCandles = [false, false, false, false];
		this.sacrificialFire = new Blob(this.level.width, this.level.height);
		this.sacrificialFireCharge = 0;
		this.fallingRocks = [];
		this.yogFistWarned = false;
		this.sacrificialFireCell = -1;
		this.sacrificialFirePrize = undefined;
		this.ghoulsDowned = 0;
		this.kingAdds = new Set();
		this.kingLinkedAdds = new Set();
		//`cavesBossSealed` is intentionally NOT reset here: it persists in the run save, and
		//resetting it per visit re-armed the gate after every load - spawning a second DM-300
		//next to the persisted one. Fresh runs start false via the field initializer, and every
		//read is depth-guarded, so a spent flag can never leak onto another floor.
		this.cavesBossEnergyCells = new Set();

		//positions decided before any terrain layer is built, so water generation (and the
		//door pass) can treat them as dry land from the start rather than patching sprites
		//in after the fact.  A ported floor already carries SPD's own ENTRANCE/EXIT tiles, put
		//there by EntranceRoom/ExitRoom's real paint(), so those are used verbatim instead of
		//"first room's centre"/"furthest room's centre" - the stairs land where Java puts them.
		const start = ported?.entrance ?? Roguelike.rectCenter(this.level.rooms[0]);
		//Java Dungeon.switchLevel(level, -2) resolves to the target floor's regular
		//exit (Dungeon.java, tag v3.3.8), used by Warden Fadeleaf's return branch.
		const arrivalAtExit = this.beaconArrival?.x === -1 && this.beaconArrival?.y === -1;
		const arrival = arrivalAtExit ? (ported?.exit ?? start)
			: this.beaconArrival && this.level.passable(this.beaconArrival.x, this.beaconArrival.y)
				&& !this.creatureAt(this.beaconArrival.x, this.beaconArrival.y) ? this.beaconArrival : start;
		this.beaconArrival = null;
		this.miningBranchEntrance = this.miningBranchActive ? start : null;
		//the cell the hero arrived on: Java's `Level.entrance()`. Only `CavesBossLevel.seal()`
		//reads it here (it walls the way in behind the player), but it is where an ascent would
		//start if this port ever grew one.
		this.entranceCell = { ...start };
		//depth 26 (LastLevel) has no down staircase - the Amulet is the only way out
		this.hasStairs = !this.miningBranchActive && !(this.depth in BOSSES) && this.depth < 26;
		if (this.hasStairs) {
			if (ported?.exit) {
				this.stairs = ported.exit;
			} else {
				const room = Roguelike.furthestRoom(this.level, start) ?? this.level.rooms[0];
				this.stairs = Roguelike.rectCenter(room);
			}
		}

		//all regular regions get real water and real grass in Java, each at its own fill/smoothing -
		//see REGION_WATER/REGION_GRASS's own comment.  A ported floor has all three already, at
		//Java's own fill numbers and in Java's own positions, so these generic passes would
		//only overwrite verified output; its doors and traps are registered from the generated
		//grid instead (adoptPortedFeatures).
		if (ported) {
			this.adoptPortedFeatures(ported);
		} else {
			this.placeWaterPool(start, region);
			this.placeGrass(region, start);
			this.placeDoors();
		}
		// The generated layout above is the baseline for a first visit. On a revisit or a load,
		// replace its mutable layer before drawing anything, so doors/traps and terrain frames
		// agree with the state the player left behind.
		if (savedFloor) this.restoreFloor(savedFloor);
		repairBossUnsealStairs(this.bossUnsealContext());
		const foresight = this.talentRank('rogues_foresight');
		if (this.heroClass === 'rogue' && foresight > 0 && Random.chance(foresight === 1 ? 0.5 : 0.75)) {
			let hasSecret = false;
			for (let y = 0; y < this.level.height && !hasSecret; y++) for (let x = 0; x < this.level.width; x++) {
				if (this.secrets.isSecret(x, y)) { hasSecret = true; break; }
			}
			if (hasSecret) this.say(t('actors.hero.hero.noticed_smth'), 'positive');
		}

		//before any frame is picked: the wall art variant is a per-cell roll off the floor's
		//own seed (GameScene.java does the same, `setupVariance(.., seedCurDepth())`)
		this.setupTileVariance(spdSeedForDepth(this.runSeedLong, this.depth));

		this.map = new TileMap({ width: this.level.width, height: this.level.height, sheet: this.terrainSheet });
		this.map.addLayer('terrain', this.terrainFrames());
		this.map.addLayer('water', this.waterFrames());
		this.wallsMap = new TileMap({ width: this.level.width, height: this.level.height, sheet: this.terrainSheet });
		this.wallsMap.addLayer('grass', this.foregroundGrassFrames());
		this.wallsMap.addLayer('walls', this.wallFrames());

		const regionProfile = dungeonRegion(region);
		this.waterSurface = new WaterSurface(runState.sprites[regionProfile.waterSprite], runState.sprites.effects, this.level.width, this.level.height, (x, y) => this.level.get(x, y) === WATER);
		this.camera.world.addChild(this.waterSurface, this.map);
		if (this.miningBranchActive) {
			//MiningLevel.BorderDarken maps the 64x16 CAVES_QUEST atlas as [top=2,
			//sides=1,bottom-two=3,interior=-1]. TileMap is the direct equivalent of Java's
			//CustomTilemap and keeps the custom art pixel-exact.
			const border = new Array(this.level.cellCount).fill(-1);
			for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
				const cell = x + y * this.level.width;
				if (y === 0) border[cell] = 2;
				else if (x === 0 || x === this.level.width - 1) border[cell] = 1;
				else if (y >= this.level.height - 2) border[cell] = 3;
			}
			this.miningBorder = new TileMap({ width: this.level.width, height: this.level.height, sheet: SpriteSheet.fromTexture(runState.sprites.cavesQuest, TILE) });
			this.miningBorder.addLayer('border', border);
			this.camera.world.addChild(this.miningBorder);
			//`MiningLevel.tilesTex()`: the quest type picks the atlas the mine tiles come from.
			const mineAtlas = this.blacksmithQuestType === 1 ? runState.sprites.cavesCrystal
				: this.blacksmithQuestType === 2 ? runState.sprites.cavesGnoll : null;
			if (mineAtlas) {
				const frames = mineTileFrames(this.tileFrameContext());
				this.mineTiles = new TileMap({ width: this.level.width, height: this.level.height, sheet: SpriteSheet.fromTexture(mineAtlas, TILE) });
				this.mineTiles.addLayer('mine', frames.raised);
				this.camera.world.addChild(this.mineTiles);
				this.mineOverhangs = new TileMap({ width: this.level.width, height: this.level.height, sheet: SpriteSheet.fromTexture(mineAtlas, TILE) });
				this.mineOverhangs.addLayer('overhang', frames.overhang);
			}
		}
		if (!this.miningBranchActive && this.portedBranchExitCells.size > 0) {
			// BlacksmithRoom.QuestEntrance is a one-cell CustomTilemap using atlas tile 0.
			const quest = new Array(this.level.cellCount).fill(-1);
			for (const cell of this.portedBranchExitCells) quest[cell] = 0;
			this.branchQuestEntrance = new TileMap({ width: this.level.width, height: this.level.height, sheet: SpriteSheet.fromTexture(runState.sprites.cavesQuest, TILE) });
			this.branchQuestEntrance.addLayer('questEntrance', quest);
			this.camera.world.addChild(this.branchQuestEntrance);
		}
		this.featuresMap = new TileMap({ width: this.level.width, height: this.level.height,
			sheet: SpriteSheet.fromTexture(runState.sprites.terrainFeatures, TILE) });
		this.featuresMap.addLayer('features', this.featureFrames());
		this.camera.world.addChild(this.featuresMap);
		//`WellWater` adds a ripple over active magic wells in the Java scene. The port's
		//well gameplay markers already identify those cells, so this scene-owned overlay
		//recreates the visible animation without baking animation state into TileMap.
		this.wellRipples = null;
		const wellCells = Array.from(this.portedWellWater.keys(), cell => ({
			x: cell % this.level.width,
			y: Math.floor(cell / this.level.width),
		}));
		if (wellCells.length > 0) {
			this.wellRipples = new WellRippleLayer(wellCells);
			this.camera.world.addChild(this.wellRipples);
		}
		if (regionProfile.waterEmbers && this.portedPaint) {
			this.demonSpawnerFloor = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.hallsSpecial, TILE) });
			this.demonSpawnerFloor.addLayer('demonSpawnerFloor', this.demonSpawnerFloorFrames(true));
			this.camera.world.addChild(this.demonSpawnerFloor);
		}
		//A pointer/touch target on the map is the browser equivalent of tapping a neighbouring
		//cell in SPD's CellSelector. Only one step is issued per click: this preserves the
		//turn-based rhythm and prevents a held pointer from accidentally sprinting through a
		//room. Targeting and item selection remain explicit toolbar actions.
		this.map.eventMode = 'static';
		this.map.cursor = 'pointer';
		this.map.on('pointerdown', (event) => this.handleMapPointer(event.global.x, event.global.y));
		this.map.on('pointermove', (event) => this.handleMapHover(event.global.x, event.global.y));
		this.map.on('pointerout', () => this.travelOverlay?.clear());
		this.onDestroy.add(() => {
			this.map?.removeAllListeners('pointerdown');
			this.map?.removeAllListeners('pointermove');
			this.map?.removeAllListeners('pointerout');
		});
		//Aiming highlight, in world space so it tracks cells under the camera. `enterLevel`
		//clears `camera.world`, so it is (re)created here, and any aim from the previous level is
		//dropped with it.
		this.aiming = null;
		this.aimOverlay = new Graphics();
		this.aimOverlay.eventMode = 'none';
		this.camera.world.addChild(this.aimOverlay);
		this.travelOverlay = new Graphics();
		this.travelOverlay.eventMode = 'none';
		this.camera.world.addChild(this.travelOverlay);
		//the newborn elemental's telegraph, on the same layer (Java's `addToBack` puts its
		//`TargetedCell` markers behind the actors and over the floor, exactly like this one)
		this.targetedCells = new Graphics();
		this.targetedCells.eventMode = 'none';
		this.camera.world.addChild(this.targetedCells);
		this.zapBeams = [];
		//`SewerLevel`/`PrisonLevel`/`CityLevel`'s `Sink`/`Torch`/`Smoke` decorations, real `WALL_DECO`
		//cells the ported painter already placed (see `wallDecorations.ts`'s own doc comment).
		//`CavesLevel`'s own `WALL_DECO` is a Vein/Sparkle effect rather than a Sink, Torch or
		//Smoke puff; WallDecorationLayer's `ore` kind reproduces its FOV-gated amber sparkle.
		this.wallDecorations = null;
		if (this.portedPaint && regionProfile.wallDecoration) {
			const paint = this.portedPaint;
			const cells: { x: number; y: number }[] = [];
			for (let cell = 0; cell < paint.map.length; cell++) {
				if (paint.map[cell] === Terrain.WALL_DECO) cells.push({ x: cell % paint.w, y: Math.floor(cell / paint.w) });
			}
			if (cells.length > 0) {
				this.wallDecorations = new WallDecorationLayer(regionProfile.wallDecoration, cells);
				this.camera.world.addChild(this.wallDecorations);
			}
		}
		//`HallsLevel.Stream`/`FireParticle`: one ember emitter per real WATER cell, unconditional
		//(not decoration-gated like the WALL_DECO effects above) - see `wallDecorations.ts`'s
		//`WaterEmberLayer` doc comment.
		this.waterEmbers = null;
		if (this.portedPaint && region === 'halls') {
			const paint = this.portedPaint;
			const cells: { x: number; y: number }[] = [];
			for (let cell = 0; cell < paint.map.length; cell++) {
				if (paint.map[cell] === Terrain.WATER) cells.push({ x: cell % paint.w, y: Math.floor(cell / paint.w) });
			}
			if (cells.length > 0) {
				this.waterEmbers = new WaterEmberLayer(cells);
				this.camera.world.addChild(this.waterEmbers);
			}
		}
		//`CavesBossLevel`'s three custom tilemaps (depth 15 only). Java keeps them in two groups that
		//straddle the wall layer: `CityEntrance` and `ArenaVisuals` are `customTiles`, added inside the
		//terrain group so the wall tilemap paints *over* them, while `EntranceOverhang` is
		//`customWalls`, added on top of the walls. That split is load-bearing here - the entrance
		//facade's frames cover rows 2-3 across the level, most of which is solid rock that must keep
		//hiding them - so this is two layers on one shared sheet, one either side of `wallsMap` in the
		//child order below, rather than the single layer the vault's three maps can share.
		//
		//The arena layer's data is set from `cavesArenaLayer()` here, which reads the live creatures
		//through `pylonActorAt` - and on a restored floor that is correct, because `restoreFloor` has
		//already put the pylons back before this point; a fresh floor has `cavesBossSealed` false, so
		//the pylon branch cannot be reached yet anyway.
		this.cavesBossTiles = null;
		this.cavesBossWalls = null;
		if (this.depth === 15 && this.portedPaint) {
			this.cavesBossTiles = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.cavesBoss, TILE) });
			this.cavesBossTiles.addLayer('cavesEntrance', cavesEntranceLayer(this.level.width, this.level.height));
			this.cavesBossTiles.addLayer('cavesArena', this.cavesArenaLayer());
			this.camera.world.addChild(this.cavesBossTiles);
		}
		//`HallsBossLevel`'s centre pieces (depth 25), the same two-group split as the Caves boss above:
		//`CenterPieceVisuals` is a `customTile`, `CenterPieceWalls` a `customWall`. Both are fixed
		//9x8 blocks, so they are built once here and never re-mapped.
		this.hallsBossCenter = null;
		this.hallsBossCenterWalls = null;
		if (this.depth === 25 && this.portedPaint) {
			this.hallsBossCenter = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.hallsSpecial, TILE) });
			this.hallsBossCenter.addLayer('hallsCenter', hallsCenterPieceLayer(this.level.width, this.level.height, false));
			this.camera.world.addChild(this.hallsBossCenter);
		}
		//`CityBossLevel`'s two custom tilemaps (depth 20 only), the same two-group split:
		//`CustomGroundVisuals` is a `customTile` under the actors, `CustomWallVisuals` a
		//`customWall` over the walls. Both read the paint grid as it stands here - the seal
		//and unseal never change a cell either map reads (doors and energy are not inputs),
		//so unlike the Caves arena neither layer is ever re-mapped.
		this.cityBossTiles = null;
		this.cityBossWalls = null;
		if (this.depth === 20 && this.portedPaint) {
			this.cityBossTiles = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.cityBoss, TILE) });
			this.cityBossTiles.addLayer('cityGround', cityGroundLayer(this.level.width, this.level.height, this.portedPaint.map));
			this.camera.world.addChild(this.cityBossTiles);
		}
		//`RitualSiteRoom`'s marker, on the quest site's own floor (`ritualPos` is -1 elsewhere): a
		//`customTile`, so it goes under the actors and the wall layer with the rest of the floor art.
		this.ritualMarker = null;
		if (this.ritualPos >= 0) {
			this.ritualMarker = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.prisonQuest, TILE) });
			this.ritualMarker.addLayer('ritualMarker', ritualMarkerLayer(this.level.width, this.level.height, this.ritualPos));
			this.camera.world.addChild(this.ritualMarker);
		}
		this.camera.world.addChild(this.itemLayer);
		this.camera.world.addChild(this.characterEffects.shadows);
		this.camera.world.addChild(this.creatureLayer);
		this.camera.world.addChild(this.effectLayer);
		//Drawn alongside the particle/effect layer, not the aim/travel overlays grouped with
		//the tile layers above - a `Beam.DeathRay` is meant to be seen over the actors it
		//connects, the same as every other zap effect here.
		this.zapBeamOverlay = new Graphics();
		this.zapBeamOverlay.eventMode = 'none';
		this.camera.world.addChild(this.zapBeamOverlay);
		//wall tops and overhangs draw over the actors, as they do in Java
		this.camera.world.addChild(this.wallsMap);
		if (this.mineOverhangs) this.camera.world.addChild(this.mineOverhangs);
		//`LastLevel`'s three custom tilemaps, drawn over the walls (Java's `customWalls` layer
		//sits above the wall tilemap too, and its floor strip has no wall cell in its rect, so a
		//single sheet above both is the same picture with one less layer to keep in order).
		this.vaultVisuals = null;
		if (this.depth === 26 && this.portedPaint) {
			const layers = this.vaultTileLayers();
			this.vaultVisuals = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.hallsSpecial, TILE) });
			this.vaultVisuals.addLayer('vaultFloor', layers.floor);
			this.vaultVisuals.addLayer('vaultCenter', layers.center);
			this.vaultVisuals.addLayer('vaultCenterWalls', layers.walls);
			this.camera.world.addChild(this.vaultVisuals);
		}
		if (this.hallsBossCenter) {
			this.hallsBossCenterWalls = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.hallsSpecial, TILE) });
			this.hallsBossCenterWalls.addLayer('hallsCenterWalls', hallsCenterWallLayer(this.level.width, this.level.height, false));
			this.camera.world.addChild(this.hallsBossCenterWalls);
		}
		if (this.cavesBossTiles) {
			this.cavesBossWalls = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.cavesBoss, TILE) });
			this.cavesBossWalls.addLayer('cavesOverhang', cavesOverhangLayer(this.level.width, this.level.height));
			this.camera.world.addChild(this.cavesBossWalls);
		}
		if (this.cityBossTiles && this.portedPaint) {
			this.cityBossWalls = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.cityBoss, TILE) });
			this.cityBossWalls.addLayer('cityWalls', cityWallLayer(this.level.width, this.level.height, this.portedPaint.map));
			this.camera.world.addChild(this.cityBossWalls);
		}
		this.wallBlocking = new TileMap({ width: this.level.width, height: this.level.height,
			sheet: SpriteSheet.fromTexture(runState.sprites.wallBlocking, TILE) });
		this.wallBlocking.addLayer('blocking', new Array(this.level.cellCount).fill(-1));
		this.camera.world.addChild(this.wallBlocking);
		this.fog = new FogOfWar(this.level.width, this.level.height);
		this.camera.world.addChild(this.fog);
		this.camera.world.addChild(this.characterEffects.icons);
		//floating text last of all: a damage number must stay readable over a wall top
		this.camera.world.addChild(this.floaters);

		this.fov = new Roguelike.FieldOfView(this.level);
		//pathing sees a shut door as passable (see `doorAwareLevel`)
		this.pathfinder = new Roguelike.Pathfinder(doorAwareLevel(this.level, this.doors, this.secrets));

		//the hero's own clip and walk tween reset with the floor: a fresh level starts standing still
		const heroSprite = this.sprite(this.hero);
		this.monsterMotion.get(heroSprite)?.clear();
		if (heroSprite instanceof AnimatedSprite) heroSprite.play('idle', true);
		this.hero.x = arrival.x;
		this.hero.y = arrival.y;
		this.sprite(this.hero).x = arrival.x * TILE;
		this.sprite(this.hero).y = arrival.y * TILE;
		//removeChildren() above cleared every sprite, including the hero's - it survives
		//floor transitions, so it goes back in rather than being rebuilt
		this.creatureLayer.addChild(this.sprite(this.hero));
		//A restored floor's queue already contains the hero, with the exact turn time and sequence it
		//had when saved (`Scheduler.restore`); adding it again here would queue it twice.
		if (this.restoredHeroQueued) this.restoredHeroQueued = false;
		else this.scheduler.add(this.hero, 0);
		this.placeEntrance(start);

		if (this.hasStairs) this.drawStairsSprite();
		if (!savedFloor) {
			this.populate();
			this.spawnPortedMobs();
			//a ported floor's traps came from the real paintTraps() and are already registered
			if (!ported) this.placeHiddenTraps();
			this.maybeSpawnGhost();
			if (!ported) {
				this.maybeSpawnWandmaker();
				this.maybeSpawnShopkeeper();
				this.maybeSpawnBlacksmith();
			}
			this.maybeSpawnImp();
			if (!ported) this.maybeSpawnDemonSpawner();
			if (!this.miningBranchActive) this.placeGroundItems();
		}
		//items that fell from the floor above land on every arrival, new floor or revisit
		this.landFallenItems();
		// The Java custom floor changes when the spawner dies.  The first frame above uses
		// the painter's mob list so it exists before actors are populated; this refresh uses
		// the actual live/restored creature list and therefore removes it on a revisit after
		// the spawner was killed.
		if (this.demonSpawnerFloor) this.demonSpawnerFloor.setLayerData('demonSpawnerFloor', this.demonSpawnerFloorFrames(!savedFloor));

		// GameScene.java pans to hero.center() without clamping to map bounds.
		// Clamping pushed the hero to the screen edge on wide windows.
		this.camera.setBounds(null);
		this.camera.snapTo(...this.worldOf(this.hero));
		this.camera.follow(this.heroPoint());

		this.refresh();
		//SPD seals the starting room behind hidden doors as its search tutorial - see
		//`stairsNeedSearching` for why that is correct and why this hint exists
		if (this.stairsNeedSearching(start)) {
			this.say(t('port.hint.sealedroom'), 'warning');
		}
		this.activeFloorDepth = this.depth;
		this.runTurns();
		this.showInterlevel(region);
	},

	/**
	 * `InterlevelScene`: the real 16px regional loading texture scrolls at 5 px/s (at the
	 * Java scene's 4x pixel scale) behind a fade-in/static/fade-out curtain and centred mode
	 * text. Generation is synchronous in this browser port, so this is presentation-only;
	 * input stays blocked until the equivalent normal/slow timing has finished.
	 */
	showInterlevel(this: DungeonScene, region: Region): void {
		this.interlevel?.root.destroy({ children: true });
		const key = dungeonRegion(region).loadingSprite;
		const root = new Container();
		const backdrop = new TilingSprite({ texture: runState.sprites[key], width: Game.current.width, height: Game.current.height });
		backdrop.tileScale.set(4);
		//InterlevelScene's rotated five-stop black gradient, whose opacity is separately
		//animated below. A flat black veil loses the original scene's subtle depth.
		const curtain = new Graphics().rect(0, 0, Game.current.width, Game.current.height).fill(new FillGradient({
			type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
			colorStops: [
				{ offset: 0, color: 'rgba(0,0,0,0.67)' }, { offset: 0.25, color: 'rgba(0,0,0,0.73)' },
				{ offset: 0.5, color: 'rgba(0,0,0,0.80)' }, { offset: 0.75, color: 'rgba(0,0,0,0.87)' },
				{ offset: 1, color: 'rgba(0,0,0,1)' },
			],
		}));
		const message = new Label({ text: t('scenes.interlevelscene$mode.descend'), size: 9 * menuScale(Game.current.width, Game.current.height), color: theme().color.text });
		message.anchor.set(0.5);
		message.position.set(Game.current.width / 2, Game.current.height / 2);
		root.addChild(backdrop, curtain, message);
		this.stage.addChild(root);
		//Java's SLOW_FADE applies to a fresh run and to the first floor of a new region;
		//the 0.33s in/out fades are added either side of its central dwell time.
		const slow = this.depth === 1 || this.depth % 5 === 1;
		this.interlevel = { root, backdrop, elapsed: 0, duration: slow ? 1.66 : 1.33, curtain, message };
		this.awaitingInput = false;
	},

	setupTileVariance(this: DungeonScene, floorSeed: bigint): void {
		const random = new SpdJavaRandom(spdScramble(floorSeed));
		this.tileVariance = new Uint8Array(this.level.cellCount);
		for (let i = 0; i < this.tileVariance.length; i++) this.tileVariance[i] = random.nextInt(100);
	},

	/** DungeonTerrainTilemap direct visuals and DungeonTileSheet alternates. */
	terrainFrameAt(this: DungeonScene, x: number, y: number): number {
		return buildTerrainFrameAt(this.tileFrameContext(), x, y);
	},

	/** Water shoreline and animated surface frames. */
	waterFrames(this: DungeonScene): number[] {
		return buildWaterFrames(this.tileFrameContext());
	},

	wallFrameAt(this: DungeonScene, x: number, y: number): number {
		return buildWallFrameAt(this.tileFrameContext(), x, y);
	},

	foregroundGrassFrames(this: DungeonScene): number[] {
		return buildForegroundGrassFrames(this.tileFrameContext());
	},

	terrainFrames(this: DungeonScene): number[] {
		return buildTerrainFrames(this.tileFrameContext());
	},

	wallFrames(this: DungeonScene): number[] {
		return buildWallFrames(this.tileFrameContext());
	},

	tileFrameContext(this: DungeonScene): DungeonTileFrameContext {
		return {
			width: this.level.width,
			height: this.level.height,
			tileVariance: this.tileVariance,
			terrainAt: (x, y) => this.level.get(x, y),
			visualTerrainAt: this.visualTerrainAt,
			rawTerrainAt: (x, y) => this.portedPaint?.map[this.level.index(x, y)],
			inside: (x, y) => this.level.inside(x, y),
		};
	},

	/** TerrainFeaturesTilemap: visible trap art, plants and regional grass details.
	 * Unknown newer plant classes remain blank rather than borrowing another plant's art.
	 * Trap effects are still the port's reduced set; visuals retain the actual Java class.
	 */
	featureFrames(this: DungeonScene): number[] {
		return Array.from(this.tileVariance, (variance, cell) => {
			const x = cell % this.level.width, y = Math.floor(cell / this.level.width);
			const trap = this.portedPaint?.traps.get(cell);
			if (trap || this.trapKinds.has(cell)) {
				if (this.secrets.isSecret(x, y)) return -1;
				const spent = this.spentTrapCells.has(cell);
				const fallback = ({ toxic: 35, burning: 1, poisonDart: 83, wornDart: 87, grim: 103, explosive: 65, confusionGas: 36, corrosionGas: 39, shockingTrap: 2, stormTrap: 50, alarm: 0, teleportation: 4, summoning: 20, chilling: 6, ooze: 3, flock: 22, warping: 52, gripping: 7, rockfall: 71, pitfall: 64, frost: 54, geyser: 68, gateway: 84, guardian: 48 } as const)[this.trapKinds.get(cell) ?? 'poisonDart'];
				const frame = trap ? TRAP_VISUALS[trap.kind[0].toUpperCase() + trap.kind.slice(1)] ?? fallback : fallback;
				return spent || trap?.active === false ? Math.floor(frame / 16) * 16 + 8 : frame;
			}
			const feature = this.portedFeatures.kindAt(cell);
			const plant = feature?.startsWith('plant:') ? feature.slice('plant:'.length).replace(/Seed$/, '') : undefined;
			if (plant) return PLANT_VISUALS[plant[0].toUpperCase() + plant.slice(1)] ?? -1;
			const raw = this.visualTerrainAt(x, y);
			const stage = Math.min(4, Math.floor((this.depth - 1) / 5));
			return raw === 15 ? 9 + stage * 16 + (variance >= 50 ? 1 : 0)
				: raw === 30 ? 11 + stage * 16 + (variance >= 50 ? 1 : 0)
				: raw === 2 ? 13 + stage * 16 + (variance >= 50 ? 1 : 0) : -1;
		});
	},
};
