import type { DungeonScene } from '../dungeonScene';
import { FogOfWar } from '../../ui/fogOfWar';
import { Actors, Random, Roguelike } from 'mwg';
import { cureHeroBuffs } from '../../items/potionEffects';
import { runMovement } from '../../adapters/movementSimulation';
import { simulationRandom } from '../../adapters/mwgRandom';
import { simulationRoguelike } from '../../adapters/mwgRoguelike';
import { takeSentryTurn as takeSentryTurnFlow } from '../../simulation/sentryTurn';
import { sourceInventoryItem } from '../../items/itemKinds';
import { ringElementsMultiplier } from '../../items/ringModifiers';
import { capitalize, has, t } from '../../i18n/index';
import { SPD_STATUS_COLOR } from '../../ui/spdTheme';
import { Terrain, type PaintLevel } from '../../spdLevelGen/paintLevel';
import { runState } from '../../runState';
import { isChallengeEnabled } from '../../challenges';
import { SPIRIT_HAWK_LIFESPAN, goForTheEyesEffect, spiritHawkSpeed, spiritHawkViewDistance } from '../../simulation/huntressAbilities';
import { PRISMATIC_FADE_TURNS, PRISMATIC_HATCH_RANGE, prismaticGuardMaxHp, prismaticSpawnCell } from '../../simulation/prismatic';
import { tickSungrassHealth } from '../../simulation/plantPools';
import { plantDropCandidates, plantDropCount } from '../../simulation/plantDrops';
import { runHeroPlantEffect, runMobPlantEffect, type HeroPlantContext, type MobPlantContext } from '../../simulation/plantTriggers';
import { disarmBubblePresses } from '../../simulation/teleport';
import { findEnemyAlly as findEnemyAllyFlow } from '../../simulation/targeting';
import { nearestFreeCell as nearestFreeCellFlow } from '../../simulation/wandering';
import { wardZapBursts } from '../../simulation/deathBursts';
import { isClassArmorId } from '../../items/catalog';
import { getCurse } from '../../items/itemCurses';
import { Cat, randomUsingDefaults } from '../../items/generator';
import { MWL_WAND_WARD_RULES } from '../../mwlContent';
import { FLOOR, SOLID, TILE, WALL, WATER } from '../../dungeonConstants';
import { NEGATIVE_BUFFS, absorbShield, addBuff, reigniteBuff, rollHit, setBleeding, tickBuffs, type BuffId, type Creature, type Step } from '../../combat';
import { BOSSES, IMMOVABLE_KINDS } from '../../monsters';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `part05`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const part05Methods = {
	/**
	 * `Corrosion.act()` (tag `v3.3.8`) deals its current damage, then raises that damage by
	 * one until the depth cap and finally by 0.5, while consuming one of its two actor turns.
	 * The port stores those two values on the creature because its ordinary buff map has only
	 * one numeric slot per status. Java's source-class immunity and dedicated death badge are
	 * not represented by this shared corrosion state.
	 */
	tickCorrosion(this: DungeonScene, target: Creature): boolean {
		const turns = target.corrosionTurns ?? 0;
		if (turns <= 0 || target.hp <= 0) {
			delete target.corrosionTurns;
			delete target.corrosionDamage;
			return target.hp > 0;
		}
		//`Corrosion` is in `RingOfElements`' RESISTS set (`Char.resist()`, tag `v3.3.8`), so the
		//hero's tick scales by the ring before Barrier absorption, like the burning/poison ticks.
		const rawCorrosion = Math.max(1, Math.floor(target.corrosionDamage ?? 1));
		//`Corrosion.act()` deals its tick through `Char.damage()`, so a rotting fist halves
		//it first (the ACIDIC property resists Corrosion) and converts the rest to Bleeding
		//(`RottingFist.damage()`), losing no HP to the tick itself.
		if (!target.isHero && target.kind === 'yogFist' && target.yogFistType === 'rotting') {
			setBleeding(target, Math.round(rawCorrosion * 0.5 * 0.6));
		}
		//`Char.Property.ACIDIC` (`Char.java`, tag `v3.3.8`) resists the Corrosion
		//damage class: `Char.damage()` applies `Math.round(dmg * 0.5)` for a
		//resisted class, so odd ticks round up (3 -> 2), not down. Goo,
		//CausticSlime and the acidic mob take that half; the rotting fist
		//converts instead (handled just above); the Ooze-buff half of ACIDIC
		//already lives in the immunity table. Found by the 41st matrix.
		const acidic = !target.isHero && (target.kind === 'goo' || target.kind === 'causticSlime' || target.kind === 'acidic');
		const damage = target.isHero
			? Math.floor(rawCorrosion * ringElementsMultiplier(this.effectiveRing(), this.hero.magicImmune))
			: target.kind === 'yogFist' && target.yogFistType === 'rotting' ? 0
			: acidic ? Math.round(rawCorrosion / 2) : rawCorrosion;
		if (target.isHero) {
			const blocked = this.absorbHeroDamage(damage);
			target.hp -= blocked;
			this.showDamage(target, damage);
		} else {
			target.hp -= damage;
			this.showDamage(target, damage);
		}
		const cap = Math.floor(this.depth / 2) + 2;
		target.corrosionDamage = (target.corrosionDamage ?? 1) < cap
			? (target.corrosionDamage ?? 1) + 1
			: (target.corrosionDamage ?? 1) + 0.5;
		target.corrosionTurns = turns - 1;
		if (target.corrosionTurns <= 0) {
			delete target.corrosionTurns;
			delete target.corrosionDamage;
		}
		if (target.hp <= 0) {
			this.kill(target, 'poison');
			return false;
		}
		return true;
	},

	/**
	 * `Burning.act()` (tag `v3.3.8`) increments `burnIncrement` each damaging hero tick and
	 * rolls `Random.Int(3) < burnIncrement - 3` once the counter reaches four. Java considers
	 * only non-unique Scrolls, MysteryMeat, and FrozenCarpaccio, and cooks meat into one
	 * ChargrilledMeat. This port has no unique-scroll flag or FrozenCarpaccio payload, so its
	 * concrete scroll ids and `meat` id are the complete representable candidate set.
	 */
	burnHeroInventoryItem(this: DungeonScene): void {
		const candidates = this.bag.items.filter((item) => item.quantity > 0
			&& (item.id === 'scroll' || item.id.startsWith('scroll') || item.id === 'meat'));
		if (candidates.length === 0) return;
		const item = Random.element(candidates);
		if (!item) return;
		this.bag.remove(item.id, 1, item.instanceId);
		if (item.id === 'meat') {
			this.bag.add({ id: 'chargrilledMeat', quantity: 1, stackable: true, identified: true });
		}
		this.say(t('actors.buffs.burning.burnsup', { 0: this.itemDisplayName(item.id, item.identified ?? true, item.instanceId) }), 'warning');
	},

	takeHeroTurn(this: DungeonScene, move: Step): void {
		//Weapon.Projecting.reachFactor() (Weapon.java, tag 4.0.0-beta): a projecting
		//weapon reaches its normal melee range plus round(Arcana). The port's input
		//is a direction rather than Java's free cell selector, so scan that direction
		//for the first occupant and attack it when it lies within the real reach.
		//Walls and doors stop the scan, preserving ordinary bump movement otherwise.
		if (this.weaponAffix === 'projecting') {
			const reach = 1 + Math.round(this.genericProcMultiplier());
			for (let distance = 2; distance <= reach; distance++) {
				const at = { x: this.hero.x + move.x * distance, y: this.hero.y + move.y * distance };
				if (!this.level.inside(at.x, at.y)) break;
				const occupant = this.creatureAt(at.x, at.y);
				if (occupant) {
					if (!occupant.isNPC && !occupant.isAlly && occupant.hp > 0) this.attack(this.hero, occupant);
					return;
				}
				if (!this.level.passable(at.x, at.y) || this.doors.isDoor(at.x, at.y)) break;
			}
		}
		let occupant: Creature | null = null;
		const plan = runMovement({ x: this.hero.x, y: this.hero.y }, move, {
			occupantAt: (target) => {
				occupant = this.creatureAt(target.x, target.y);
				return occupant ? (occupant.isNPC || occupant.isAlly ? 'npc' : 'enemy') : null;
			},
			closedDoorAt: (target) => this.doors.isDoor(target.x, target.y) && !this.doors.isOpen(target.x, target.y)
				&& !this.secrets.isSecret(target.x, target.y),
			isRooted: () => !!this.hero.buffs['roots'],
			passable: (target) => this.canStepOnto(target.x, target.y)
				&& this.eternalFire.volumeAt(target.x, target.y) < 1,
		});
		if (plan.kind === 'wait') {
			if (this.talentRank('patient_strike') > 0) this.patientStrikeReady = true;
			if (this.talentRank('hold_fast') > 0) { this.holdFastX = this.hero.x; this.holdFastY = this.hero.y; }
			this.say(t('port.log.wait'));
			return;
		}
		const { target } = plan;
		// Interaction plans only arise from the synchronous occupant query above.
		if (plan.kind === 'interact') {
			// Allies occupy a cell like a friendly NPC; interactWithNPC intentionally has no
			// branch for them, so bumping one cannot turn into friendly fire.
			if (occupant!.isAlly && !occupant!.isNPC && this.tryAllyWarp(occupant!)) return;
			this.interactWithNPC(occupant!);
		}
		else if (plan.kind === 'attack') this.attack(this.hero, occupant!);
		else if (plan.kind === 'door') this.bumpDoor(target.x, target.y);
		//`Hero.actTransition()` 1385 (tag `v3.3.8`): a rooted stair attempt shakes
		//(`1, 1f`) like the rooted move does (`getCloser` 1771, covered by `moveTo`).
		//The movement planner refuses before this dispatch, so this branch is the
		//transition half.
		else if (plan.kind === 'rooted') { this.shakeScreen(1, 1); this.say(t('actors.buffs.roots.heromsg'), 'negative'); }
		else if (plan.kind === 'move') {
 			this.moveTo(this.hero, target);
 			if (this.sungrassPos >= 0 && this.level.index(target.x, target.y) !== this.sungrassPos) {
 				this.sungrassHealing = 0;
 				this.sungrassPartial = 0;
 				this.sungrassPos = -1;
 			}
			this.projectileMomentumReady = this.subclass() === 'freerunner' && this.talentRank('projectile_momentum') > 0;
			this.trampleHighGrass(target.x, target.y);
			const targetCell = this.level.index(target.x, target.y);
			const delayedFeature = this.portedFeatures.kindAt(targetCell)?.startsWith('plant:') ?? false;
			const delayedTrap = this.trapKinds.has(targetCell);
			if (this.timeBubbleTurns > 0 && (delayedFeature || delayedTrap)) this.timeBubblePresses.add(targetCell);
			else this.portedFeatures.interact(targetCell, this);
			this.pickupGroundItemAt(target.x, target.y);
			this.checkCavesBossPylonGate();
			this.checkCityBossSeal();
			this.checkImpShopkeeperGreeting();
			this.checkHallsBossSeal();
			this.checkTenguFightStart();
			this.checkTenguArenaRetreat();
			if (!(this.timeBubbleTurns > 0 && delayedTrap)) this.triggerTrapAt(target.x, target.y);
			if (this.fallThroughChasm(target.x, target.y)) return;
			if (this.miningBranchActive && this.miningBranchEntrance
				&& target.x === this.miningBranchEntrance.x && target.y === this.miningBranchEntrance.y) {
				this.leaveMiningBranch();
			} else if (!this.miningBranchActive && this.portedBranchExitCells.has(this.level.index(target.x, target.y))) {
				this.enterMiningBranch();
			}
			if (this.hasStairs && target.x === this.stairs.x && target.y === this.stairs.y) {
				this.depth++;
				this.deepestDepth = Math.max(this.deepestDepth, this.depth);
				this.say(this.depth in BOSSES ? t('port.log.descendboss') : t('scenes.gamescene.descend', { 0: this.depth }), 'warning');
				this.justDescended = true;
				//`Level.beforeTransition()`: delayed TimeBubble presses disarm on the old floor.
				this.disarmTimeBubblePresses();
				this.enterLevel();
			}
		} else if (plan.kind === 'wall' && this.canMineCavesWall() && this.mineMiningWall(target.x, target.y)) {
			// Pickaxe mining spends its turn inside mineMiningWall(); the movement adapter must not spend it twice.
		} else {
			this.say(t('port.log.wall'), 'negative');
		}
	},

	/** Consumes a generated Java well once, applying the two WellWater hero effects. */
	usePortedWellAtCell(this: DungeonScene, cell: number): void {
		this.usePortedWellAt(cell % this.level.width, Math.floor(cell / this.level.width));
	},

	usePortedWellAt(this: DungeonScene, x: number, y: number): void {
		const cell = this.level.index(x, y);
		const kind = this.portedWellWater.get(cell);
		if (!kind || this.portedPaint?.map[cell] !== Terrain.WELL) return;
		if (kind === 'awareness' || kind === 'waterOfAwareness') {
			//WaterOfAwareness.affectHero(): `hero.belongings.observe()` - real Java identifies only
			//the equipped weapon/armor/artifact/ring (this port already treats those as identified
			//and curse-known the instant they're equipped, a pre-existing simplification, so there
			//is nothing left to reveal there) and marks every equipable/wand item still sitting in
			//the backpack cursed-known, without fully identifying it. The previous `for (item of
			//bag) Actors.identify(item)` was a real overreach with no Java basis at all - Java's
			//per-item full identify only happens via the separate `affectItem()` path, triggered by
			//the water blob spreading onto a *ground* item heap over time, which this port's
			//one-shot touch-the-well interaction doesn't model. Also grants the `awareness` buff.
			for (const item of this.bag.items) {
				if (item.id === 'clothArmor' || item.id === 'armor' || item.id === 'armorReward' || isClassArmorId(item.id)
					|| item.id === 'weaponReward' || item.id === 'wand' || item.id.startsWith('ring_')) {
					(item as typeof item & { cursedKnown?: boolean }).cursedKnown = true;
				}
			}
			addBuff(this.hero, 'awareness');
			for (let yy = 0; yy < this.level.height; yy++) for (let xx = 0; xx < this.level.width; xx++) {
				if (this.secrets.isSecret(xx, yy)) this.secrets.discover(xx, yy);
			}
			this.say(t('port.log.wellreveals'), 'positive');
		} else {
 			const healed = this.hero.maxHp - this.hero.hp;
 			this.hero.hp = this.hero.maxHp;
 			//`WaterOfHealth.affectHero()` runs `PotionOfHealing.cure(hero)` first - the shared
 			//helper, which is also what fixed the two old deviations here (clearing Burning,
 			//which Java never cures, and clearing Roots, which `cure()` never detaches).
 			this.cureHeroBuffs();
			//Belongings.uncurseEquipped(): clears a known curse from the equipped weapon/armor/ring,
			//the same three-slot clear ScrollOfRemoveCurse's branch above already uses.
			if (getCurse(this.weaponAffix ?? '')) this.weaponAffix = null;
			if (getCurse(this.armorGlyph ?? '')) this.armorGlyph = null;
			if (this.equippedRing?.cursed) this.equippedRing.cursed = false;
			this.hunger = Math.max(this.hunger, 300);
			//`WaterOfHealth.affectHero()`'s own presentation - found missing from a live player
			//report ("no red crosses"): Java plays `hero.sprite.showStatusWithIcon(POSITIVE, HT,
			//HEALING)` (the floating heal amount) and `emitter().start(Speck.factory(HEALING),
			//0.4f, 4)` (a burst of red-cross specks) on top of it. This port has no sprite
			//particle-emitter layer at all (see `PORT_COVERAGE.md`), so the burst becomes one red
			//`+` floater beside the usual green amount - a stated substitution, not a missing
			//effect, following the same "text stands in for an icon" precedent as the busy pip.
			this.showHeal(this.hero, healed);
			this.showStatus(this.hero, '+', SPD_STATUS_COLOR.negative);
			this.say(t('port.log.wellheals'), 'positive');
		}
		this.portedWellWater.delete(cell);
		const plantIndex = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && plant.kind.startsWith('wellWater:')) ?? -1;
		if (plantIndex >= 0) this.portedPaint!.plants.splice(plantIndex, 1);
		if (this.portedPaint) this.portedPaint.map[cell] = Terrain.EMPTY_WELL;
		this.level.set(x, y, FLOOR);
		this.restitchTilesAround(x, y);
		this.featuresMap?.setLayerData('features', this.featureFrames());
	},

	/** Plant neighbours use Java's no-replacement `PathFinder.NEIGHBOURS8` pool
	 * (`Dewcatcher`/`Seedpod.activate()`, `items/wands/WandOfRegrowth.java`, tag `v3.3.8`):
	 * distinct passable neighbours minus both stair cells, triangular counts. Java drops
	 * onto an occupied cell anyway; the live floor model cannot stack heaps, so occupied
	 * candidates are simply skipped instead - owned by the stacking-heaps item. */
	dropPlantNeighbourLoot(this: DungeonScene, x: number, y: number, min: number, max: number, kind: 'dew' | 'seed'): void {
		const candidates = plantDropCandidates(Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
			.filter((at) => this.level.inside(at.x, at.y))
			.map((at) => ({
				...at,
				passable: this.level.passable(at.x, at.y),
				isChasm: this.isChasmCell(at.x, at.y),
				isStairs: this.hasStairs && this.stairs && this.stairs.x === at.x && this.stairs.y === at.y,
				isEntrance: this.entranceCell?.x === at.x && this.entranceCell?.y === at.y,
			})));
		const count = plantDropCount(min, max, simulationRandom);
		for (let i = 0; i < count && candidates.length > 0; i++) {
			const index = Random.int(candidates.length);
			const at = candidates.splice(index, 1)[0]!;
			if (this.groundItemAt(at.x, at.y)) continue;
			if (kind === 'dew') this.spawnGroundItem('dewdrop', at.x, at.y);
			else {
				const seed = randomUsingDefaults(Cat.SEED);
				this.spawnGroundItem('seed', at.x, at.y, sourceInventoryItem('seed', seed.cls, (kind) => this.newItemInstanceId(kind)));
			}
		}
	},

	/** `Plant.trigger()` asks nearby Lotus actors for their strongest seed-preservation chance:
	 * `0.40 + 0.04 * wandLevel`, with Rotberry explicitly excluded (Plant.java, tag v3.3.8). */
	lotusPreservesSeed(this: DungeonScene, cell: number, plantKind: string): boolean {
		if (plantKind === 'rotberry') return false;
		const x = cell % this.level.width;
		const y = Math.floor(cell / this.level.width);
		const chance = this.creatures
			.filter((c) => c.isAlly && c.allyKind === 'lotus' && c.hp > 0)
			.filter((c) => Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) <= Math.max(0, Math.round((c.maxHp - 25) / 3)))
			.reduce((best, c) => Math.max(best, 0.4 + 0.04 * Math.max(0, Math.round((c.maxHp - 25) / 3))), 0);
		return chance > 0 && Random.float() < chance;
	},

	/**
	 * `Plant.trigger()`/`Plant.wither()` for generated regional plants. Room painters record
	 * the concrete seed/plant class as a tag because the framework has no Java Plant registry;
	 * stepping on it still has the same one-shot consequence and removes only the plant marker,
	 * leaving the room's grass/high-grass terrain intact.
	 */
	triggerPortedPlantAt(this: DungeonScene, x: number, y: number): void {
		const cell = this.level.index(x, y);
		const featureKind = this.portedFeatures.kindAt(cell);
		const index = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && !plant.kind.startsWith('wellWater:')) ?? -1;
		const manualKind = this.manualPlants.get(cell);
		if (index < 0 && !manualKind) return;
		const kind = (featureKind?.startsWith('plant:') ? featureKind.slice('plant:'.length) : index >= 0 ? this.portedPaint!.plants[index]!.kind : manualKind!)
			.replace(/Seed$/, '').toLowerCase();
		if (this.lotusPreservesSeed(cell, kind)) {
			const sourceClass = kind.charAt(0).toUpperCase() + kind.slice(1);
			this.spawnGroundItem('seed', x, y, sourceInventoryItem('seed', sourceClass, (itemKind) => this.newItemInstanceId(itemKind)));
		}
		if (index >= 0) this.portedPaint!.plants.splice(index, 1);
		this.manualPlants.delete(cell);

		runHeroPlantEffect(kind, x, y, cell, this.hero, this.heroPlantContext());
		this.featuresMap?.setLayerData('features', this.featureFrames());
	},

	/** Scene services behind `runHeroPlantEffect`: the plant-trigger extraction's hero-half
	 * context. Buff grants, the cure, blob seeds and `t()` stay shared code; the scene only
	 * binds its own state, movement and presentation seams. */
	heroPlantContext(this: DungeonScene): HeroPlantContext {
		return {
			subclass: () => this.subclass(),
			depth: this.depth,
			say: this.say.bind(this),
			t,
			neighbour8: Roguelike.neighbourOffsets(8),
			grantBuff: (target, id, duration) => addBuff(target, id, duration),
			prolongBuff: (target, id, duration) => reigniteBuff(target, id, duration),
			cureHero: () => this.cureHeroBuffs(),
			spawnFood: (x, y) => this.spawnGroundItem('food', x, y),
			dropLoot: (x, y, min, max, kind) => this.dropPlantNeighbourLoot(x, y, min, max, kind),
			seedFreeze: (x, y, volume) => this.plantFreeze.seed(x, y, volume),
			seedGas: (x, y, volume) => this.plantGas.seed(x, y, volume),
			seedFire: (x, y, volume) => this.fire.seed(x, y, volume),
			markHazardArea: this.markHazardArea.bind(this),
			passable: (x, y) => this.level.passable(x, y),
			isVisible: (x, y) => this.fov.isVisible(x, y),
			shake: this.shakeScreen.bind(this),
			setEarthrootArmor: (level, pos) => { this.earthrootArmor = { level, pos }; },
			setTimeBubble: (turns) => { this.timeBubbleTurns = turns; },
			syncHero: () => this.syncHeroFromStats(),
			healingLeft: () => this.healingLeft,
			setHealingLeft: (value) => { this.healingLeft = value; },
			healingFlat: () => this.healingFlat,
			setHealingFlat: (value) => { this.healingFlat = value; },
			sungrass: () => this.sungrassPos >= 0
				? { level: this.sungrassHealing, partial: this.sungrassPartial }
				: undefined,
			setSungrass: (level, partial, pos) => { this.sungrassHealing = level; this.sungrassPartial = partial; this.sungrassPos = pos; },
			findTeleportCell: () => this.randomFreeCell(this.hero),
			cancelTravel: () => { this.travelTarget = null; },
			moveHero: (to) => this.moveTo(this.hero, to),
			showTeleport: (from, to) => this.playTeleportAppear(from, to, this.hero),
		};
	},

	/** `Plant.trigger()`/the concrete `Plant.activate(Char)` methods (tag `v3.3.8`): mobs and
	 * allied chars soft-trigger a revealed plant when they occupy its cell. Fadeleaf keeps its
	 * teleport behavior; the status/blob effects below reuse this port's existing per-creature
	 * buff and environmental systems. Earthroot's per-hit armor pool and Sungrass's gradual
	 * monster Health buff are now the real pools, granted in the branches below. */
	/** `Trap.HazardAssistTracker` (`levels/traps/Trap.java`, tag `v3.3.8`): the 50-turn
	 * `FlavourBuff` hazards prolong onto mobs (`Buff.prolong` is keep-max, which is what
	 * `reigniteBuff` with the table duration does). `Mob.die()` counts a marked *enemy*
	 * toward `Statistics.hazardAssistedKills` and the `ENEMY_HAZARDS` badge; the count fires
	 * in `kill()`. Every producer this port models marks through here - plants and the
	 * caves-boss wires mark their single victim, traps mark their whole blast/gas area
	 * through `markHazardArea` (Grim/PoisonDart only ever aim at one target, so they mark
	 * just the stepper). Traps this port does not model stay unmarked - see
	 * `PORT_COVERAGE.md`. */
	markHazardMob(this: DungeonScene, creature: Creature): void {
		//Java marks `instanceof Mob` (the hero excluded, allies included but never counted -
		//`die()` requires enemy alignment, mirrored by the kill-side gate).
		if (creature.isHero || creature.hp <= 0) return;
		reigniteBuff(creature, 'hazardAssist');
	},

 	/** The area half of `markHazardMob`, for Java `activate()`s that loop
 	 * `PathFinder.NEIGHBOURS9` and mark every mob in it: the gas/burning/explosive/
 	 * shocking traps - and `Icecap`, whose 3x3 Freezing marks the same way. StormTrap marks its
 	 * distance-2 flood cell-by-cell instead, Grim/PoisonDart only their aimed target. */
	markHazardArea(this: DungeonScene, x: number, y: number): void {
		for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
			const target = this.creatureAt(x + dx, y + dy);
			if (target) this.markHazardMob(target);
		}
	},

	triggerMobPlantAt(this: DungeonScene, creature: Creature): boolean {
		if (creature.isHero || creature.isNPC || creature.hp <= 0) return false;
		const cell = this.level.index(creature.x, creature.y);
		const index = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && !plant.kind.startsWith('wellWater:')) ?? -1;
		const kind = this.plantKindAt(cell);
		if (index >= 0) this.portedPaint!.plants.splice(index, 1);
		this.manualPlants.delete(cell);
		if (this.portedFeatures.kindAt(cell)?.startsWith('plant:')) this.portedFeatures.remove(cell);
		if (!kind) return true;
		runMobPlantEffect(kind, cell, creature, this.mobPlantContext());
		return true;
	},

	/** Scene services behind `runMobPlantEffect`: the plant-trigger extraction's mob-half
	 * context. The immovable gate, patrol/teleport destinations, sprite placement and
	 * blob seeds stay scene-owned; buff math and the bubble constant are shared code. */
	mobPlantContext(this: DungeonScene): MobPlantContext {
		return {
			depth: this.depth,
			neighbour8: Roguelike.neighbourOffsets(8),
			grantBuff: (target, id, duration) => addBuff(target, id, duration),
			prolongBuff: (target, id, duration) => reigniteBuff(target, id, duration),
			markHazardMob: this.markHazardMob.bind(this),
			markHazardArea: this.markHazardArea.bind(this),
			patrolDestination: (creature) => this.randomPatrolDestination(creature),
			findTeleportCell: (creature) => this.randomFreeCell(creature),
			placeSprite: (creature, x, y) => { this.sprite(creature).position.set(x * TILE, y * TILE); },
			showTeleport: (from, to, creature) => this.playTeleportAppear(from, to, creature),
			seedFreeze: (x, y, volume) => this.plantFreeze.seed(x, y, volume),
			seedGas: (x, y, volume) => this.plantGas.seed(x, y, volume),
			seedFire: (x, y, volume) => this.fire.seed(x, y, volume),
			passable: (x, y) => this.level.passable(x, y),
			isVisibleCell: (cell) => this.fov.isVisible(cell % this.level.width, Math.floor(cell / this.level.width)),
			shake: this.shakeScreen.bind(this),
			isImmovableKind: (kind) => IMMOVABLE_KINDS.has(kind),
		};
	},

	/**
	 * Whether a *step* may land on this cell: Java's `Char.move` test, `passable || avoid`.
	 *
	 * A pit cell is enterable here because that is how this port models falling - the chasm is
	 * `AVOID` in Java, so `move()` accepts it and `Chasm` takes over from there. The one
	 * exception is a cell Java forced solid outright (`LastLevel.create()`, the `SOLID` kind):
	 * those are neither passable nor avoid, so a step must be refused *before* the chasm branch,
	 * which is what stops the hero walking off the Amulet vault's walkway into the void (a fall
	 * is disabled there by `fallThroughChasm`, so it used to leave them standing in mid-air).
	 */
	canStepOnto(this: DungeonScene, x: number, y: number): boolean {
		if (this.level.get(x, y) === SOLID) return false;
		return this.level.passable(x, y) || this.isChasmCell(x, y);
	},

	isChasmCell(this: DungeonScene, x: number, y: number): boolean {
		return Boolean(this.portedPaint && this.level.inside(x, y) && this.portedPaint.map[this.level.index(x, y)] === Terrain.CHASM);
	},

	/** Swiftthistle.TimeBubble.triggerPresses(): activate delayed traps/plants in insertion order. */
	flushTimeBubblePresses(this: DungeonScene): void {
		const cells = [...this.timeBubblePresses];
		this.timeBubblePresses.clear();
		for (const cell of cells) {
			if (this.trapKinds.has(cell)) this.triggerTrapAt(cell % this.level.width, Math.floor(cell / this.level.width));
			this.portedFeatures.interact(cell, this);
		}
	},

	/** The normalized class of the live plant on a cell (`sungrass`, `rotberry`, ...), or
	 * `undefined` when none - the same resolution `triggerMobPlantAt` consumes with. */
	plantKindAt(this: DungeonScene, cell: number): string | undefined {
		const featureKind = this.portedFeatures.kindAt(cell);
		const index = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && !plant.kind.startsWith('wellWater:')) ?? -1;
		const manualKind = this.manualPlants.get(cell);
		if (index < 0 && !manualKind) return undefined;
		return (featureKind?.startsWith('plant:') ? featureKind.slice('plant:'.length) : index >= 0 ? this.portedPaint!.plants[index]!.kind : manualKind!)
			.replace(/Seed$/, '').toLowerCase();
	},

	/** `Swiftthistle.TimeBubble.disarmPresses()` via `Level.beforeTransition()`: leaving the
	 * floor with delayed presses disarms them on the old floor instead of carrying stale
	 * cell indices along - delayed-press plants are uprooted (Rotberry explicitly spared),
	 * delayed-press traps are spent and revealed. The bubble's remaining turns survive the
	 * trip, exactly as Java's buff does. Only the stairs transition disarms (Java runs this
	 * from `Level.transition`, not from chasm falls or branch hops). */
	disarmTimeBubblePresses(this: DungeonScene): void {
		if (this.timeBubblePresses.size === 0) return;
		const { uproot, disarm } = disarmBubblePresses(
			[...this.timeBubblePresses],
			(cell) => this.plantKindAt(cell),
			(cell) => this.trapKinds.has(cell),
		);
		for (const cell of uproot) {
			const index = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && !plant.kind.startsWith('wellWater:')) ?? -1;
			if (index >= 0) this.portedPaint!.plants.splice(index, 1);
			this.manualPlants.delete(cell);
			if (this.portedFeatures.kindAt(cell)?.startsWith('plant:')) this.portedFeatures.remove(cell);
		}
		for (const cell of disarm) {
			this.spentTrapCells.add(cell);
			const x = cell % this.level.width;
			const y = Math.floor(cell / this.level.width);
			if (this.secrets.isSecret(x, y)) this.secrets.discover(x, y);
		}
		this.timeBubblePresses.clear();
		this.featuresMap?.setLayerData('features', this.featureFrames());
	},

	/** Java chasms are traversable only by falling; monster pathfinding still sees them as solid.
	 * `Char.flying` (Levitation) makes `Char.move` skip the chasm interaction entirely in real
	 * Java - the same bypass already applied to traps in `triggerTrapAt`. */
	fallThroughChasm(this: DungeonScene, x: number, y: number): boolean {
		if (!this.isChasmCell(x, y) || this.miningBranchActive || this.depth >= 26 || this.hero.buffs['levitation']) return false;
		this.say(t('port.log.fallchasm'), 'negative');
		this.depth++;
		this.justDescended = true;
		this.enterLevel();
		this.landFromChasm();
		return true;
	},

	/**
	 * `Chasm.heroLand()` (`Chasm.java`): applies on arrival at the new floor, after the fall
	 * itself. Real Java also plays a landing sound, shakes the camera (`PixelScene.shake(4, 1f)`,
	 * `Chasm.java` 143, before the Cripple it also applies), and lets
	 * `ElixirOfFeatherFall.FeatherBuff` cancels the whole thing outright; the marker is consumed
	 * by `consumeFeatherFall()`. Without it, the two mechanical consequences are a `Cripple`
	 * application and upfront
	 * damage scaled the same way Java's is (`max(HP/2, NormalIntRange(HP/2, HT/4))`, run through
	 * the same
	 * Tenacity/Barrier/Iron-Will/Deathless-Fury pipeline every other hero-damage source uses).
	 * Java also applies a separate `Bleeding` DoT here; the port now keeps its intensity in the
	 * shared buff map and ticks it with Java's NormalFloat/rounding rule. Source-class death
	 * badges and blood splash presentation remain unmodeled.
	 */
	/** `ElixirOfFeatherFall.FeatherBuff.processFall()` consumes the one-use protection before
	 * `Chasm.heroLand()` applies any landing effects. The port keeps the Java 50-turn lifetime
	 * but represents the one-use lifecycle by deleting the marker on the fall. */
	consumeFeatherFall(this: DungeonScene): boolean {
		if (this.hero.buffs['featherFall'] === undefined) return false;
		delete this.hero.buffs['featherFall'];
		this.say(t('items.spells.featherfall.light'), 'positive');
		return true;
	},

	landFromChasm(this: DungeonScene): void {
		if (this.hero.hp <= 0) return;
		if (this.consumeFeatherFall()) return;
 		//`Chasm.java` 143: the shake comes first, before the Cripple and the damage.
 		this.shakeScreen(4, 1);
 		//`Buff.prolong(hero, Cripple.class, Cripple.DURATION)`: keep-max whole 10.
 		reigniteBuff(this.hero, 'cripple');
		setBleeding(this.hero, Math.round(this.hero.maxHp / (6 + 6 * (this.hero.hp / this.hero.maxHp))));
		const damage = this.absorbHeroDamage(Math.max(Math.floor(this.hero.hp / 2), Random.normalRange(Math.floor(this.hero.hp / 2), Math.floor(this.hero.maxHp / 4))));
		this.hero.hp -= damage;
		this.showDamage(this.hero, damage);
		//death badges (DEATH_FROM_*: trap/fire/poison/hunger/foe - gas/falling/magic variants,
		//including this one, need systems this port has none of, so a chasm death still books
		//as the generic 'foe' bucket via kill()'s default)
		if (this.hero.hp <= 0) this.kill(this.hero);
	},

	/** Pickaxe interaction for adjacent walls. Java mines ordinary WALL in one turn and
	 * WALL_DECO veins in one turn; only a vein yields DarkGold.
	 *
	 * The gate is `Hero.java` 1913's `Dungeon.level instanceof MiningLevel && ... has Pickaxe`,
	 * which is narrower than this port used to be: it asked only for a pickaxe and a Caves depth,
	 * so ordinary Caves floors (11-14) and - worse - the Caves **boss** arena at 15 were mineable
	 * too, where Java allows it only inside the mining branch level itself (`MiningLevel extends
	 * CavesLevel`, reached from the Blacksmith's mine and re-painted at the same depth here, so
	 * this port's `miningBranchActive` is the exact equivalent of that `instanceof`).
	 *
	 * Not ported, and now visible as the reason this gate cannot be widened again: Java's test also
	 * accepts `MINE_CRYSTAL` and `MINE_BOULDER` cells, two terrain kinds this port has no
	 * equivalent of - its branch is the same `PaintLevel` surface with `WALL`/`WALL_DECO` only. */
	canMineCavesWall(this: DungeonScene): boolean {
		return Boolean(this.bag.find('pickaxe') && this.miningBranchActive && this.portedPaint);
	},

	mineMiningWall(this: DungeonScene, x: number, y: number): boolean {
		const paint = this.portedPaint;
		if (!this.bag.find('pickaxe') || !paint || !this.level.inside(x, y) || this.level.get(x, y) !== WALL) return false;
		const cell = this.level.index(x, y);
		const vein = paint.map[cell] === Terrain.WALL_DECO;
		if (paint.map[cell] !== Terrain.WALL && !vein) return false;
		paint.map[cell] = Terrain.EMPTY_DECO;
		this.level.set(x, y, FLOOR);
		//`Hero.java` 1299/1310: mining shakes once (0.5, half a second) whichever it struck - the
		//DarkGold vein and the plain wall branch both do it, beside their own burst and sound.
		this.shakeScreen(0.5, 0.5);
		if (vein) {
			this.bag.add({ id: 'darkGold', quantity: 1, stackable: true, identified: true });
			this.say(t('port.log.pickup', { item: t('items.quest.darkgold.name') }), 'positive');
			runState.audio.cue('evoke', 0.7);
		} else {
			runState.audio.cue('mine', 0.7);
		}
		this.restitchTilesAround(x, y);
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		return true;
	},

	/**
	 * One monster's turn. Sleeping mobs (Mob.SLEEPING) wake on the real `1/(distance +
	 * stealth)` detection roll while the hero is in their sight - or stay put; waking
	 * spends the turn. Ranged attackers (DM-100's lightning,
	 * Shaman's bolt, Necromancer's 2-10 bolt, Tengu's darts, Trickster's missiles) fire
	 * through `canTarget` when line-of-sight allows instead of pathing into melee; everyone
	 * else hunts through `decideMonsterAI`.
	 */
	takeMonsterTurn(this: DungeonScene, monster: Creature): void {
		this.pendingMonsterTurnCost = null;
		//`Tengu.FireAbility` is a `Buff`: it acts with its host, one ring per turn, whatever else
		//Tengu does that turn (`FireAbility.act()`).
		if (this.tenguBeams.has(monster)) this.advanceTenguFire(monster);
		//Actor-specific pre-turn maintenance is keyed, so it happens before every later gate
		//(including adjacent melee and ally/NPC checks) without growing this dispatcher chain.
		const preTurnHook = monster.kind ? this.monsterTurnHooks[monster.kind] : undefined;
		preTurnHook?.(monster);
		//Chill.speedFactor() also slows monster actor speed; the scheduler reads this
		//pending cost after the actor finishes its turn.
		if (monster.buffs['chill']) this.pendingMonsterTurnCost = 1 / Math.max(0.5, 1 - monster.buffs['chill']! * 0.1);
		//`Elemental.act()` decrements `rangedCooldown` on every turn the mob is hunting - including
		//the adjacent melee turns, which never reach the ranged profile below (that dispatch is
		//non-adjacent only). Same pre-dispatch placement as the golem cooldowns above.
		//`YogDzewa.act()`'s phase-0 dormancy owns Yog's whole turn: idle and untouchable
		//until `takeYogTurn` notices the hero. Placed before every dispatch below so the
		//wandering, adjacent-ally, and adjacent-melee branches cannot move or swing a
		//dormant Yog - Java's trailing `spend(TICK); return` moves nothing either.
		if (monster.kind === 'yog' && (monster.yogPhase ?? 1) === 0) { this.takeYogTurn(monster); return; }
		if (monster.isNPC) return;
		if (monster.isAlly) {
			this.takeAllyTurn(monster);
			return;
		}
		if (monster.ratmogrifiedTurns !== undefined || monster.ratmogrifiedPermanent) {
			//TransmogRat has no original mob abilities; ordinary pathing/melee is the
			//faithful common denominator for the compact scene AI.
			const dot = tickBuffs(monster, this.depth);
			if (dot > 0) {
				monster.hp -= dot;
				this.showDamage(monster, dot);
				if (monster.hp <= 0) { this.kill(monster); return; }
			}
			if (Roguelike.chebyshevDistance(monster, this.hero) === 1) this.attack(monster, this.hero);
			else {
				const blocked = new Set(this.creatures.filter((c) => c !== monster).map((c) => this.level.index(c.x, c.y)));
				const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, monster, monster.hp / monster.maxHp, this.hero, {
					sightRadius: this.viewRadius(), fleeBelow: 0, blocked,
				});
				if (decision.step) this.stepMonster(monster, decision.step);
			}
			return;
		}
		//Whole-turn special actors use the keyed strategy table just like ranged actors below.
		//This keeps Pylon's inactive/active behavior ahead of FOV, ally targeting, and generic AI.
		const specialOverride = monster.kind ? this.specialMonsterTurnOverrides[monster.kind] : undefined;
		if (specialOverride?.(monster)) return;
		// Hostile mobs now recognize an adjacent friendly summon as a valid combat target.
		// Longer-range special attacks still use their existing hero-only dispatch until their
		// target selection is migrated, but this makes MirrorImage bodies able to intercept
		// ordinary melee turns instead of being harmless scenery.
		const adjacentAlly = this.creatures.find((c) => c.isAlly && c.allyKind !== 'sheep' && c.hp > 0
			&& c.buffs['invisibility'] === undefined
			&& Roguelike.chebyshevDistance(monster, c) === 1);
		if (adjacentAlly) {
			this.attack(monster, adjacentAlly);
			return;
		}
		const postAllyOverride = monster.kind ? this.postAllyMonsterTurnOverrides[monster.kind] : undefined;
		if (postAllyOverride?.(monster)) return;
		// Mob.act() updates enemySeen from the monster's field of view *before* its state
		// moves it. This is what makes the classic door trick work: a snake that steps into
		// the doorway while it cannot yet see the hero remains surprised until its next turn.
		const wasSeen = monster.seesHero === true;
		const monsterFov = new Roguelike.FieldOfView(this.level);
		monsterFov.update(monster.x, monster.y, this.viewRadius());
		//`Level.updateFieldOfView`: `boolean sighted = c.buff(Blindness.class) == null && ...` - a
		//blinded creature's field of view is *empty*, not merely reduced, so it cannot acquire the
		//hero by sight (Smoke Bomb's own blinding, the Blindweed plant, and later Elemental Blast's).
		//Damage still alerts it: `Char.damage()` sets HUNTING whatever the attacker's state, so the
		//other `seesHero = true` sites in this file deliberately do not consult this buff.
		monster.seesHero = monster.buffs['blindness'] === undefined
			&& monsterFov.isVisible(this.hero.x, this.hero.y)
			&& !this.smokeBlocksSight(monster.x, monster.y, this.hero.x, this.hero.y)
			&& (monster.kind === 'sentry' || !this.hero.buffs['invisibility']);
		//Mob.findEnemy(): a hostile mob may pursue a visible allied Char when the hero is not
		//currently its enemy. The compact AI still has hero-shaped ranged overrides, so route
		//this case through ordinary pathing/melee only; that is the documented reduction for
		//special attacks against allies, while MirrorImage can now be reached and attacked.
		//`Mob.findEnemy()`'s ally branch lives in `simulation/targeting.ts` as
	//`findEnemyAlly` - the file-size refactor's forty-third extraction,
	//behavior-identical. The scene only binds the mob's FOV and smoke gate here.
	const visibleAllyTarget = findEnemyAllyFlow(monster, this.creatures,
			(x, y) => monsterFov.isVisible(x, y),
			(fx, fy, tx, ty) => this.smokeBlocksSight(fx, fy, tx, ty),
			simulationRoguelike);
		if (!monster.seesHero && visibleAllyTarget) {
			if (Roguelike.chebyshevDistance(monster, visibleAllyTarget) === 1) this.attack(monster, visibleAllyTarget);
			else {
				const blocked = new Set(this.creatures.filter((c) => c !== monster && c !== visibleAllyTarget)
					.map((c) => this.level.index(c.x, c.y)));
				this.eternalFireBlockedInto(blocked);
				const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, monster, monster.hp / monster.maxHp, visibleAllyTarget, {
					sightRadius: this.viewRadius(),
					fleeBelow: 0,
					blocked,
				});
				if (decision.step) this.stepMonster(monster, decision.step);
			}
			return;
		}
		//Mob.Wandering.act(): an awake mob that has not yet acquired the hero rolls
		//`Random.Float(distance(hero)/2f + hero.stealth()) < 1` before entering HUNTING
		//(Mob.java, tag v3.3.8). The port has no separate WANDERING state, so the persisted
		//`seesHero` edge is the equivalent just-alerted marker; a failed roll holds the mob
		//in place for this turn, while an already-aware mob continues its normal hunt.
		//A mob that is already hunting (`lastSeen` set) re-acquires without a roll - Java
		//only rolls on the WANDERING-state transition; HUNTING mobs just refresh their target.
		//A mob that gave up (`lastSeen` cleared) rolls again, like a first acquisition.
		if (monster.seesHero && !wasSeen && monster.lastSeen === undefined && monster.kind !== 'sentry') {
			const detectionDistance = Roguelike.chebyshevDistance(monster, this.hero);
			const detectionRange = detectionDistance / 2 + this.heroStealth();
			if (detectionRange >= 1 && Random.float(detectionRange) >= 1) {
				monster.seesHero = false;
				return;
			}
		}
		//ChampionEnemy.Growing.act(): its own real per-turn tick, `+0.01` to the multiplier
		//`meleeDamageFactor`/`damageTakenFactor`/`evasionAndAccuracyFactor` all read from
		//(real Java spends its own separate `4*TICK` actor slot for this; this port folds it
		//into the monster's ordinary turn instead, since it has no secondary-actor scheduling).
		if (monster.champion === 'growing') monster.championPower = (monster.championPower ?? 1.19) + 0.01;
		//`YogFist.act()`: the ranged cooldown ticks down 1 per unparalysed turn while it is
		//above 0 (`paralysed <= 0 && rangedCooldown > 0`). Bright/dark never accumulate
		//any (their `incrementRangedCooldown` is a no-op), so the gate below is vacuous
		//for them, exactly like Java's.
		if (monster.kind === 'yogFist' && monster.buffs['paralysis'] === undefined && (monster.fistZapCd ?? 0) > 0) {
			monster.fistZapCd = (monster.fistZapCd ?? 0) - 1;
		}
		//`BurningFist.act()`: a burning fist evaporates its own water cell, then 0-2 random
		//neighbours (`Random.chances([0,1,2])` averages 1.67), and tops fire up to 4 across
		//its own 3x3 - before `super.act()` in Java, after the cooldown tick here, which is
		//the same turn either way.
		if (monster.kind === 'yogFist' && monster.yogFistType === 'burning') this.burningFistAct(monster);
		//`SoiledFist.act()`: a soiled fist keeps growing grass around itself every turn.
		if (monster.kind === 'yogFist' && monster.yogFistType === 'soiled') this.soiledFistAct(monster);
		//`RottingFist.act()`'s water heal: a hurt rotting fist standing in water regains
		//`HT/50` every turn (6 at 300 HP). The zero-volume toxic seed on the same line only
		//orders the gas blob's actor clock, which this port's blob has no equivalent of.
		if (monster.kind === 'yogFist' && monster.yogFistType === 'rotting'
			&& this.level.get(monster.x, monster.y) === WATER && monster.hp < monster.maxHp) {
			const healed = Math.min(monster.maxHp - monster.hp, Math.floor(monster.maxHp / 50));
			monster.hp += healed;
			this.showHeal(monster, healed);
		}
		//DwarfKing P3 banks damage into Viscosity's deferred pool instead of losing HP directly;
		//pay it out on the King's own turn, exactly like the hero's pool above.
		if (this.tickMonsterDeferredDamage(monster)) return;
		//dots tick on the sufferer's own turn, like Java's Buff.act()
		const monsterWasBurning = monster.buffs['burning'] !== undefined;
		const monsterWasOozing = monster.buffs['ooze'] !== undefined;
		const monsterWasDrowsy = monster.buffs['drowsy'] !== undefined;
		const dot = tickBuffs(monster, this.depth);
		//`SoiledFist.damage()` can be ignited but takes no damage from Burning itself. This port's
		//per-turn tick applies one combined total, so when Burning is the only damaging effect the
		//whole tick is discarded (the roll is still spent, as Java's own `damage()` call would be);
		//with another DoT also running the burning share cannot be split out - a stated reduction.
		const soiledBurningOnly = monster.kind === 'yogFist' && monster.yogFistType === 'soiled'
			&& monster.buffs['burning'] !== undefined && monster.buffs['poison'] === undefined && monster.buffs['bleeding'] === undefined;
		//`Char.damage()` negates through `isInvulnerable()`, which a `SpectatorFreeze`
		//carries - frozen spectators take no DoT damage (the roll is still spent, as
		//Java's own negated `damage()` call would spend it).
		let dotDealt = soiledBurningOnly || monster.buffs['spectatorFreeze'] !== undefined ? 0 : dot;
		//`Challenge.DuelParticipant.act()`'s pairing half for the mob side, checked on
		//every mob turn right after its own buffs tick (Java buffs act independently of
		//the char's action gates, so this runs even for a paralyzed duelist). The hero
		//side runs from `spendHeroTurn`.
		this.tickDuelParticipant(monster);
		//DKBarrier absorbs on every `Char.damage()` path - same block as the attack
		//tail (see the trap-blast seam's own copy).
		if (monster.kind === 'king' && (monster.kingShield ?? 0) > 0) {
			const absorbed = absorbShield(monster.kingShield ?? 0, dotDealt);
			monster.kingShield = absorbed.shield;
			dotDealt = absorbed.damage;
		}
		if (monsterWasDrowsy && monster.buffs['drowsy'] === undefined) {
			//Drowsy.act() attaches MagicalSleep after five turns; monsters have a native
			//sleeping state here, so this transition needs no second buff.
			monster.sleeping = true;
		}
		if (dotDealt > 0 && !(monster.kind === 'yog' && this.yogShielded(monster)) && !(monster.kind === 'yogFist' && this.guardFist(monster))) {
			const preHp = monster.hp;
			monster.hp -= dotDealt;
			if (monster.kind === 'tengu') this.clampTenguBracket(monster, preHp);
			if (monster.kind === 'yog' && monster.hp > 0) this.yogDamageHook(monster, preHp);
			if (monster.kind === 'king' && monster.hp > 0 && (monster.kingPhase ?? 1) === 1) {
				monster.kingSummonCd = (monster.kingSummonCd ?? 0) - dotDealt / 8;
				monster.kingAbilityCd = (monster.kingAbilityCd ?? 0) - dotDealt / 8;
			}
			if (monster.kind === 'king' && monster.hp > 0) this.kingDamageHook(monster);
			this.showDamage(monster, dotDealt);
			if (monster.hp <= 0) {
				this.kill(monster);
				return;
			}
			if (monster.kind === 'tengu') this.tenguBracketJump(monster, preHp);
		}
		//`Sungrass.Health.act()` / `Earthroot.Armor.act()` for a mob pool: the sungrass pool
		//pays out its gradual heal on the owner's own turn (like every other DoT tick above),
		//and either pool ends when its owner has left the grant cell (both buffs detach on
		//`target.pos != pos`; the exhaustion half lives in `tickSungrassHealth` and in the
		//`attack()` absorb hook below).
		if (monster.sungrassLevel !== undefined || monster.earthrootArmorLevel !== undefined) {
			const mobCell = this.level.index(monster.x, monster.y);
			if (monster.sungrassLevel !== undefined) {
				const ticked = tickSungrassHealth(
					{ level: monster.sungrassLevel, partial: monster.sungrassPartial ?? 0 },
					monster.maxHp, monster.maxHp - monster.hp, mobCell !== monster.sungrassPos);
				if (ticked.pool) {
					monster.sungrassLevel = ticked.pool.level;
					monster.sungrassPartial = ticked.pool.partial;
				} else {
					delete monster.sungrassLevel;
					delete monster.sungrassPartial;
					delete monster.sungrassPos;
				}
				if (ticked.healed > 0) {
					const healedBefore = monster.hp;
					monster.hp = Math.min(monster.maxHp, monster.hp + ticked.healed);
					if (monster.hp > healedBefore) this.showHeal(monster, monster.hp - healedBefore);
				}
			}
			if (monster.earthrootArmorLevel !== undefined && mobCell !== monster.earthrootArmorPos) {
				delete monster.earthrootArmorLevel;
				delete monster.earthrootArmorPos;
			}
		}
		if (!this.tickCorrosion(monster)) return;
		//Level.java's per-turn WATER hook: flying Java actors are exempt from the ground-status
		//cleanup, just as the hero's Levitation is checked in the matching branch above.
		//Ooze washes alongside Burning (real Poison shares nothing but the old stand-in).
		if (monsterWasBurning && this.level.get(monster.x, monster.y) === WATER && !monster.flying) delete monster.buffs['burning'];
		//Ooze.act()'s own depth-scaled tick for monsters (same formula as the hero side).
		if (monsterWasOozing && monster.hp > 0) {
			const ooze = this.depth > 5 ? 1 + Math.floor(this.depth / 5)
				: this.depth === 5 ? 1 : Random.chance(0.5) ? 1 : 0;
			if (ooze > 0) {
				monster.hp -= ooze;
				this.showDamage(monster, ooze);
				if (monster.hp <= 0) {
					this.kill(monster);
					return;
				}
			}
			if (this.level.get(monster.x, monster.y) === WATER && !monster.flying) delete monster.buffs['ooze'];
		}
		//Brute.BruteRage.act(): while active it drains at a flat 4/turn (Java's
		//`AscensionChallenge.statModifier` multiplier is 1 with no ascension-challenge UI), on
		//top of whatever combat damage also lands on it (both drain the same pool). Once it
		//actually reaches 0 this time, the Brute stays dead - `hasRaged` was already set true at
		//the revival, so there is no second one.
		if (monster.kind === 'brute' && monster.raged) {
			monster.hp -= 4;
			if (monster.hp <= 0) {
				this.kill(monster);
				return;
			}
		}
		//ArmoredBrute.ArmoredRage.act(): the same shield, but drains only 1 point every 3rd
		//turn (`spend(3*TICK)`) instead of 4 every turn - "similar rate...much slower" per
		//Java's own comment.
		if (monster.kind === 'armoredBrute' && monster.raged) {
			monster.armoredRageTicks = (monster.armoredRageTicks ?? 0) + 1;
			if (monster.armoredRageTicks >= 3) {
				monster.armoredRageTicks = 0;
				monster.hp -= 1;
				if (monster.hp <= 0) {
					this.kill(monster);
					return;
				}
			}
		}
		//`Mob.act()`: `if (buff(Feint.AfterImage.FeintConfusion.class) != null){ ...; spend(TICK);
		//return true; }` - wastes the whole turn, same shape as paralysis/frost just above.
		if (monster.buffs['paralysis'] || monster.buffs['frost'] || monster.buffs['feintConfusion']) return;
		//`Challenge.SpectatorFreeze`: a frozen spectator loses the turn after its own buffs
		//already ticked above (so the 10-turn clock still runs down). Java pairs this with
		//`delayChar`; the shared tick-then-skip here is the same observable.
		if (monster.buffs['spectatorFreeze'] !== undefined) return;
		if (monster.buffs['amok']) {
			this.takeAmokTurn(monster);
			return;
		}
		//DemonSpawner: PASSIVE, IMMOVABLE, never attacks - only its spawn-cooldown ticks, and
		//unlike every other monster here that happens regardless of hero distance/sleep state.
		if (monster.kind === 'demonSpawner') {
			this.tickDemonSpawner(monster);
			return;
		}
		//RotHeart: PASSIVE and immobile - never acts at all (placed after the DoT above so
		//burning still destroys it; Java's `destroy()`-vs-`die()` distinction on that path -
		//no death processing - is not reproduced, it dies the ordinary way).
		if (monster.kind === 'rotHeart') return;
		//RotLasher.act(): immobile Waiting - never moves or chases; attacks adjacent foes,
		//and regenerates +5/turn while hurt with no adjacent enemy (a `showHeal` tick stands
		//in for the status text). Terrified lashers hold still like the sentry (see below).
		if (monster.kind === 'rotLasher') {
			const adjacentHero = Roguelike.chebyshevDistance(monster, this.hero) === 1;
			if (!monster.buffs['terror'] && adjacentHero) this.attack(monster, this.hero);
			else if (monster.hp < monster.maxHp && !adjacentHero) {
				const healed = Math.min(monster.maxHp - monster.hp, 5);
				monster.hp += healed;
				this.showHeal(monster, healed);
			}
			return;
		}

		const distance = Roguelike.chebyshevDistance(monster, this.hero);
		if (this.heroClass === 'huntress' && this.talentRank('heightened_senses') > 0 && distance <= (this.talentRank('heightened_senses') === 1 ? 2 : 3)) monster.seesHero = true;
		// Invisibility makes monsters lose their target until the hero attacks or the
		// effect expires. Adjacent monsters retain current awareness, which is the
		// useful Char.canInteract behaviour without a separate target-memory system.
		if (this.hero.buffs['invisibility'] && distance > 1 && monster.kind !== 'sentry') return;
		//Spinner.Fleeing.act(): a fleeing spider returns to HUNTING once it sees the hero
		//again and the hero's Poison has worn off. Java also returns early on Terror/Dread,
		//but this port's own generic terror override owns those two states. Checked for
		//every acting turn (not only the non-adjacent path) so an adjacent spider stops
		//retreating the moment the poison ends, exactly as Java's state machine does.
		if (monster.fleeing && monster.kind === 'spinner' && monster.seesHero && !this.hero.buffs['poison']) {
			monster.fleeing = false;
		}
		if (monster.sleeping) {
			//Mob.Sleeping.act(): "debuffs cause mobs to wake as well" - checked first and
			//unconditionally (no roll), before the enemyInFOV-gated detection roll below, since
			//real Java wakes a sleeping monster from being hurt/debuffed even if it still can't
			//see the hero. **Found and fixed in the 2026-09-09 roadmap pass**: standing in fire
			//or a gas blob already applies `burning`/`poison`/`ooze` to a sleeping monster
			//elsewhere in this port (`spreadFire`/`spreadPlantBlobs` don't gate on `sleeping`),
			//it just never woke the monster up before this check existed - checked against each
			//buff's own Java class (`NEGATIVE_BUFFS`, tag `v3.3.8`) for which ones actually
			//carry `buffType.NEGATIVE`.
			const debuffed = Object.keys(monster.buffs).some((id) => NEGATIVE_BUFFS.has(id as BuffId));
			if (!debuffed) {
				//Mob.Sleeping.act(): waking is a per-turn `detectionChance` roll, `1/(distance +
				//stealth)` - here always the hero at stealth 0 (only Obfuscation raises it,
				//unported) - replacing the old flat wake radii (6/3/2) that had no Java basis.
				//Silent Steps (`distance >= 4-points` never wakes) and flying/levitation
				//(`distance >= 2` never wakes) are real immunities, not radius tweaks: Java sets
				//those candidates' chance to infinity, which never beats the initial infinity,
				//so they are never even selected for the roll. Only rolled while the hero is in
				//the mob's sight (see `seesHero` above - invisibility still hides); a woken mob
				//spends its turn waking (`TIME_TO_WAKE_UP`) rather than acting.
				if (!monster.seesHero) return;
				const silent = this.heroClass === 'rogue' ? this.talentRank('silent_steps') : 0;
				const flying = this.hero.buffs['levitation'] !== undefined;
				if ((silent > 0 && distance >= 4 - silent) || (flying && distance >= 2)) return;
				//Obfuscation.stealthBoost(): sleeping detection is 1/(distance+stealth),
				//with the glyph's (1+level/3) x Arcana stealth contribution.
				if (!Random.chance(1 / (distance + this.heroStealth()))) return;
			}
		monster.sleeping = false;
		//`Goo.notice()` yells `actors.mobs.goo.notice` ("GLURP-GLURP!") on first awareness -
		//the one boss yell the generic wake line below would otherwise swallow. Said only on
		//the detection path (`!debuffed`): Java's `damage()` seals without yelling, and a
		//DoT-woken Goo gets no `notice()` either, so those stay on the generic line.
		if (monster.kind === 'goo' && !debuffed) this.say(t('actors.mobs.goo.notice'), 'warning');
		else this.say(t('port.log.wakes', { who: capitalize(monster.name) }), 'warning');
			//Mob.Sleeping.act()'s real SWARM_INTELLIGENCE hook: every other non-paralyzed,
			//not-yet-HUNTING enemy mob within 8 tiles of the noticing mob (not the hero) also
			//beckons toward the hero's position immediately, rather than each mob only ever
			//noticing independently. This port has no HUNTING/WANDERING state machine, so "not
			//yet HUNTING" is approximated as "not already awake-and-seesHero"; beckoning itself
			//reuses the same `sleeping=false`/`seesHero=true` stand-in ScrollOfRage's own beckon
			//already uses, and distance is this port's usual Chebyshev metric.
			if (isChallengeEnabled('swarm_intelligence')) {
				for (const other of this.creatures) {
					if (other === monster || other.isHero || other.isNPC || other.buffs['paralysis']) continue;
					if (other.sleeping === false && other.seesHero) continue;
					if (Roguelike.chebyshevDistance(monster, other) > 8) continue;
					other.sleeping = false;
					other.seesHero = true;
				}
			}
			return;
		}
		const aggressionTarget = this.aggressionTarget(monster);
		if (aggressionTarget) {
			this.takeAggressionTurn(monster, aggressionTarget);
			return;
		}
		//Monk.act() attaches Focus after the action through `afterMonsterTurn`; its
		//floating cooldown is reduced there by action time and in `moveTo` by the real
		//movement bonuses. This replaces the former flat six-turn combo stand-in.
		//ScrollOfTerror.doRead()/Terror.java: real Java's Terror stops the mob attacking the
		//specific reader while otherwise letting it act freely (attack allies, flee toward
		//other exits) - this port's monster-turn model has no per-object avoidance and no
		//monster-vs-ally targeting distinction is now available for allies, but this compact
		//terror implementation still approximates the
		//practical single-hero effect as an always-flee override on the same
		//`decideMonsterAI`/`fleeBelow` mechanism `Thief.FLEEING` already uses, skipping every
		//attack branch below entirely for the turn. The immobile sentry is excluded (it
		//cannot flee) and simply holds fire while terrified - see its own branch.
		if (monster.buffs['terror'] && monster.kind !== 'sentry' && monster.kind !== 'tengu') {
			const blocked = new Set(
				this.creatures.filter((c) => c !== monster && c !== this.hero).map((c) => this.level.index(c.x, c.y))
			);
			this.eternalFireBlockedInto(blocked);
			const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, monster, monster.hp / monster.maxHp, this.hero, { sightRadius: this.viewRadius(), fleeBelow: 1, blocked });
			if (decision.step) this.stepMonster(monster, decision.step);
			return;
		}
		// CrystalMimic remains in FLEEING after revealing itself. Revelation is separate from
		// `stolen`: Java reveals it before the first theft, so an untouched chest must still be
		// able to steal on its first hostile turn.
		if (monster.kind === 'crystalMimic' && monster.mimicRevealed) {
			if (this.fleeCrystalMimic(monster)) return;
			// CrystalMimic.Fleeing.nowhereToRun(): once it is no longer seen and has
			// reached distance 6, Java destroys it instead of invoking normal loot death.
			if (!monster.seesHero && distance >= 6) {
				this.escapeCrystalMimic(monster);
				return;
			}
		}

		//The sentry's whole turn lives in `simulation/sentryTurn.ts` as
		//`takeSentryTurn` - the file-size refactor's forty-fifth extraction,
		//behavior-identical. The scene only binds its callbacks here; the Java
		//contract (charge, gaze, warmup reset) is documented at the module.
		if (monster.kind === 'sentry') {
			//Terror stops the sentry firing on the reader (its only conceivable target)
			//without moving it - an immobile turret cannot flee, so the generic flee
			//override above is skipped for this kind instead.
			if (monster.buffs['terror']) return;
			takeSentryTurnFlow(monster, this.hero, {
				depth: this.depth,
				seesHero: monster.seesHero === true,
				canTargetHero: () => Roguelike.canTarget(this.level, monster, this.hero, { range: 8 }),
				warmup: monster.sentryWarmup,
				setWarmup: (value) => { monster.sentryWarmup = value; },
				sayCharge: () => this.say(t('port.log.sentrycharge'), 'negative'),
				sayMiss: () => this.say(t('port.log.sentrymisses'), 'negative'),
				sayGaze: () => this.say(t('port.log.sentrygaze'), 'negative'),
				rollHit: (attacker, defender) => rollHit(attacker, defender, true),
				strikeHero: (min, max) => {
					const dmg = this.absorbHeroDamage(Random.normalRange(min, max));
					this.hero.hp -= dmg;
					this.showDamage(this.hero, dmg);
					if (this.hero.hp <= 0) this.kill(this.hero);
				},
			});
			return;
		}
		//ChampionEnemy.Giant/Projecting.canAttackWithExtraReach() (ChampionEnemy.java,
		//tag 4.0.0-beta): Giant reaches two cells and Projecting reaches four. The
		//port has no path-distance attack query, so a clear line with the same range
		//is the closest available geometry; damage factors remain in combat rolls.
		const extraReach = monster.champion === 'giant' ? 2 : monster.champion === 'projecting' ? 4 : 0;
		if (extraReach > 0 && distance > 1 && distance <= extraReach
			&& monster.seesHero && Roguelike.canTarget(this.level, monster, this.hero, { range: extraReach })) {
			this.attack(monster, this.hero);
			return;
		}
		if (distance === 1) {
			if (monster.kind === 'crystalMimic') {
				this.revealCrystalMimic(monster);
				this.crystalMimicSteal(monster);
				this.attack(monster, this.hero);
				if (monster.hp > 0) this.fleeCrystalMimic(monster);
				return;
			}
			if (monster.kind === 'goo') this.takeGooTurn(monster);
			else if (monster.kind === 'king') this.takeKingTurn(monster);
			//`SpectralNecromancer extends Necromancer` and shares its adjacent-bolt/skeleton-
			//summon behavior unchanged (its own overrides - a wraith-summoning variant and a
			//Scroll of Remove Curse drop - are both beyond this port's scope) - previously
			//excluded here by the same literal-kind-check bug found for ArmoredBrute/DM201/
			//Senior, so a SpectralNecromancer fought as a plain melee attacker with no ranged
			//bolt or skeleton summon at all.
			else if (monster.kind === 'necromancer' || monster.kind === 'spectralNecromancer') this.zapHero(monster, [2, 10]);
			else if (monster.kind === 'gnollTrickster') this.stepAway(monster);
			//Thief.FLEEING never attacks - it runs (same stepper as the Trickster's retreat).
			//`Bandit extends Thief` and shares this unchanged - previously excluded here by the
			//same literal-kind-check bug found for ArmoredBrute/DM201/Senior/SpectralNecromancer.
			//Spinner also enters a real FLEEING state (set by its own `attackProc`), so it
			//backs off on an adjacent turn too instead of biting.
			else if (monster.fleeing || ((monster.kind === 'thief' || monster.kind === 'bandit') && monster.stolen)) {
				const fx = monster.x, fy = monster.y;
				this.stepAway(monster);
				//`Mob.Fleeing` with no step: `nowhereToRun()` below. Only the explicit
				//fleeing flag recovers here - a stolen-loot thief keeps pressing (its
				//`fleeBelow` re-flees every visible turn, so clearing the flag is not a
				//state this port can hold for it; standing still while boxed in is the
				//same observable).
				if (monster.fleeing && monster.x === fx && monster.y === fy) this.recoverFleeing(monster);
			}
			//Scorpio refuses adjacent kills - it backs off to keep its range (getFurther).
			//`Acidic extends Scorpio` and shares this unchanged (its own override just adds an
			//Ooze/corrosion proc, already ported separately via the `causticSlime || acidic`
			//branch elsewhere in this file) - previously excluded here by the same literal-
			//kind-check bug found for the other rare variants.
			else if (monster.kind === 'scorpio' || monster.kind === 'acidic') this.stepAway(monster);
			//Tengu owns his whole turn (ability check included) from `takeTenguTurn`, which
			//handles both the adjacent melee and the ranged-dart cases. Without this the
			//generic `attack` below swallowed the turn and the phase-2 ability check only
			//ever ran at range - Java checks `canUseAbility()` before attacking either way.
			else if (monster.kind === 'tengu') this.takeTenguTurn(monster);
			else this.attack(monster, this.hero);
			return;
		}

		if (this.takeWanderingTurn(monster)) return;
		//Data-driven dispatch (was a 16-case, 236-line `if (kind === X && cond) {...; return}`
		//cascade - see `rangedAiOverrides`'s own doc comment). `distance` is always >=2 here
		//(the `distance === 1` block above always returns), so every handler below runs only
		//for a non-adjacent monster, matching where each original branch used to sit.
		const rangedOverride = monster.kind ? this.validatedRangedAiProfiles[monster.kind] : undefined;
		if (rangedOverride && rangedOverride(monster, distance)) return;
	//`Succubus.getCloser()`: the blink preempts the shared step below (a fleeing
	//succubus never reaches `Hunting.getCloser`, hence the gate beside the kind).
	if (monster.kind === 'succubus' && !monster.fleeing && this.trySuccubusBlink(monster, distance)) return;
		//The hunting step's blocked set is the same `wanderBlocked(monster, false)` the
	//wandering branch uses (creatures minus seeker and hero, eternal fire, piranha
	//water confinement with the hero-cell exception) - shared since the file-size
	//refactor's thirty-ninth extraction rather than duplicated inline.
	const blocked = this.wanderBlocked(monster, false);

		const decision = Roguelike.decideMonsterAI(
			this.level,
			this.pathfinder,
			monster,
			monster.hp / monster.maxHp,
			this.hero,
			{
				sightRadius: this.viewRadius(),
				//Thief.FLEEING once it has stolen something; Spinner.FLEEING for as long as its
				//victim is poisoned (set by `attackProc`, cleared above once the poison ends);
				//everyone else fights on (0.25). Bandit extends Thief and shares this unchanged.
				fleeBelow: monster.fleeing || ((monster.kind === 'thief' || monster.kind === 'bandit') && monster.stolen) ? 1 : 0.25,
				blocked,
			}
		);

		if (decision.step) this.stepMonster(monster, decision.step);
		//`Mob.Fleeing.nowhereToRun()` (tag `v3.3.8`): the framework's greedy step-away
		//has no recovery of its own, so a fleeing mob with no step recovers here.
		else if (monster.fleeing && decision.state === 'flee') this.recoverFleeing(monster);
	},

	/** The shared allied-actor turn: `Mob.Wandering`/`Hunting` as every non-special ally here
	 * runs it, plus `DirectableAlly`'s standing order. Attack the nearest visible hostile,
	 * otherwise head for the ordered cell, otherwise stay near the hero. */
	takeAllyTurn(this: DungeonScene, ally: Creature): void {
		if (ally.buffs['paralysis'] || ally.buffs['frost']) return;
		//`SmokeBomb.NinjaLog` never acts: it is an IMMOVABLE decoy whose whole job is to be attacked
		//(its `defenseSkill()` is what redirects whatever was hunting the hero). Returning here also
		//keeps the generic ally branch below from walking an immovable log across the floor.
		if (ally.allyKind === 'ninjaLog') return;
		//`Feint.AfterImage.act()`: `destroy(); sprite.die(); return true;` unconditionally - the
		//decoy's first scheduled turn is also its last, whether or not anything took the bait.
		if (ally.allyKind === 'afterImage') {
			this.kill(ally);
			return;
		}
		if (ally.allyKind === 'spiritHawk') {
			this.takeSpiritHawkTurn(ally);
			return;
		}
		if (ally.allyKind === 'ward') {
			this.takeWardTurn(ally);
			return;
		}
		if (ally.allyKind === 'earthGuardian') {
			this.takeEarthGuardianTurn(ally);
			return;
		}
		if (ally.allyKind === 'sheep') {
			ally.sheepTurns = (ally.sheepTurns ?? 1) - 1;
			if ((ally.sheepTurns ?? 0) <= 0) this.kill(ally);
			return;
		}
		if (ally.allyKind === 'lotus') {
			//Lotus.act() loses one HP per actor turn and disappears at zero; it never
			//participates in ally combat (WandOfRegrowth.java, tag v3.3.8).
			ally.sheepTurns = (ally.sheepTurns ?? ally.hp) - 1;
			ally.hp = ally.sheepTurns;
			if (ally.sheepTurns <= 0) this.kill(ally);
			return;
		}
		//`DriedRose.GhostHero.act()` (tag `v3.3.8`): on any turn the rose is gone (or un-identified)
		//or the hero is under `MagicImmune`, the ghost loses 1 HP - Java's `damage(1, new
		//NoRoseDamage())`, a source with no armor behind it. Dying takes the reference with it, so
		//the rose can be charged and summoned again.
		if (ally.allyKind === 'ghost') {
			const rose = this.roseItem();
			if (!rose || rose.identified === false || this.hero.magicImmune === true) {
				ally.hp -= 1;
				this.showDamage(ally, 1);
				if (ally.hp <= 0) {
					this.kill(ally);
					this.roseGhost = null;
					return;
				}
			}
		}
		//`ShadowClone.ShadowAlly` has no turn of its own beyond the shared ally below,
		//but its gear-scaling stats are re-read on each of its turns (the hawk precedent).
		if (ally.allyKind === 'shadowClone') this.syncShadowClone(ally);
		if (ally.allyKind === 'mirror') this.syncMirrorImage(ally);
		//`PrismaticImage.act()`'s death fade: at 0 HP the image spends its turns counting
		//down (`deathTimer`), still targetable and healable - healing above 0 HP clears
		//the fade on this same turn, exactly like Java's `act()` reset branch. While
		//fading it neither moves nor fights (Java spends the tick fading).
		if (ally.allyKind === 'prismatic' && ally.prismaticFade !== undefined) {
			if (ally.hp > 0) delete ally.prismaticFade;
			else {
				ally.prismaticFade -= 1;
				if (ally.prismaticFade <= 0) this.kill(ally);
			}
			return;
		}
		if (ally.allyKind === 'prismatic') this.syncPrismaticImage(ally);
		const hostiles = this.visibleAllyHostiles(ally)
			.sort((a, b) => Roguelike.chebyshevDistance(ally, a) - Roguelike.chebyshevDistance(ally, b));
		//`DirectableAlly`'s standing order, if this ally has one: an ordered attack target takes
		//precedence over the nearest hostile, and an ordered defend cell replaces the hero as the
		//fallback destination. The rose's ghost and the spirit hawk are the two allies that carry
		//one, so both lines below are inert for every other ally kind. Java's `defendPos` leaves the
		//ally WANDERING with no target, so an ally that still *sees* an enemy fights it on the way -
		//which is what the shared `hostiles` ordering below already does; what the order changes is
		//where it goes when nothing is in sight, and that it stops there instead of following the hero.
		const ordered = ally.allyTargetChar !== undefined && ally.allyTargetChar.hp > 0 ? ally.allyTargetChar : undefined;
		const target = ordered ?? hostiles[0];
		//`PrismaticImage.Wandering.act()`: with no enemy in sight the image rejoins its
		//master - the guard pool is set to the image's current HP (`set(image)`), the
		//actor is destroyed with the teleport effect, and no guard spawns while one is
		//already owed (there is only ever one pool; hatching spends it). The shared
		//follow-the-hero fallback below never runs for this kind.
		if (ally.allyKind === 'prismatic' && !target && !ordered && !ally.allyDefendCell) {
			this.hero.prismaticGuardHp = ally.hp;
			addBuff(this.hero, 'prismaticGuard', 9999);
			this.destroyAlly(ally);
			return;
		}
		//`PrismaticImage.attackProc()`'s `aggro()` has no equivalent, the documented
		//`activateFeint` reduction: this port's AI retargets from FOV every turn, so a
		//mob that cannot see the hero already comes for the visible image through the
		//shared paths, and there is no persistent enemy pointer to redirect.
		if (target && Roguelike.chebyshevDistance(ally, target) === 1) {
			this.attack(ally, target);
			return;
		}
		const defend = ally.allyDefendCell;
		const destination = target ?? defend ?? this.hero;
		if (!target && Roguelike.chebyshevDistance(ally, this.hero) <= 2 && !defend) return;
		if (!target && defend && ally.x === defend.x && ally.y === defend.y) return;
		const blocked = new Set(this.creatures.filter((c) => c !== ally && c !== destination)
			.map((c) => this.level.index(c.x, c.y)));
		this.eternalFireBlockedInto(blocked);
		const next = this.pathfinder.find({ x: ally.x, y: ally.y }, { x: destination.x, y: destination.y }, { blocked })[0];
		if (next) this.moveTo(ally, next);
	},

	/** Silent ally teardown for `PrismaticImage.Wandering`'s return-to-guard (no death,
	 * no loot, no log line - Java `destroy()`s plus a teleport effect; the effect has
	 * no seam here, stated in PORT_COVERAGE.md). */
	destroyAlly(this: DungeonScene, ally: Creature): void {
		this.scheduler.remove(ally);
		this.creatures.splice(this.creatures.indexOf(ally), 1);
		this.sprite(ally).destroy();
		this.spriteFor.delete(ally.id);
	},

	/** `PrismaticImage.die()`'s non-chasm branch: the killing blow starts the 5-turn
	 * healable fade (`deathTimer = 5` plus the PARALYSED sprite state, which this
	 * port's fade branch in `takeAllyTurn` already honors) instead of destroying the
	 * actor. Runs at the same damage boundary as the mirror fade below, *before*
	 * any death bookkeeping - and only for combat damage through `attack()`: chasm
	 * falls and other direct `kill()` paths stay real deaths, exactly like Java's
	 * `cause == Chasm.class` carve-out. */
	enterPrismaticFade(this: DungeonScene, target: Creature, damage: number): boolean {
		if (!target.isAlly || target.allyKind !== 'prismatic' || damage <= 0) return false;
		if (target.prismaticFade !== undefined || target.hp > 0) return false;
		target.hp = 0;
		target.prismaticFade = PRISMATIC_FADE_TURNS;
		this.showDamage(target, damage);
		return true;
	},

	/** `PrismaticGuard.act()` (`actors/buffs/PrismaticGuard.java`, tag `v3.3.8`): regen
	 * plus the hatch check, once per spent turn. The `PowerOfMany` turns have no
	 * system here (no Cleric spells), so that half is always zero. Hatching spends
	 * the pool (Java `detach()`s); a hatch with no free neighbour keeps the guard,
	 * exactly like Java's `bestPos == -1` spend path.
	 */
	tickPrismaticGuard(this: DungeonScene, turns: number): void {
		if (this.hero.prismaticGuardHp === undefined) {
			delete this.hero.buffs['prismaticGuard'];
			return;
		}
		const max = prismaticGuardMaxHp(this.progression.level);
		const steps = Math.max(1, Math.round(turns));
		for (let n = 0; n < steps; n++) {
			//`HP += 0.1f` while hurt and `Regeneration.regenOn()`: the boss-arena
			//and mining gates ride the established "regen always on" simplification
			//stated at the seal/book ticks above, so the guard always regens here.
			const pool = Math.min(max, (this.hero.prismaticGuardHp ?? 0) + 0.1);
			this.hero.prismaticGuardHp = pool;
			addBuff(this.hero, 'prismaticGuard', 9999);
			if (this.hatchPrismaticImage(pool)) return;
			if (this.hero.prismaticGuardHp === undefined) return;
		}
	},

	/** The hatch half of the guard turn: returns true when an image spawned (the
	 * pool is spent). Closest live visible enemy first, Java's three state
	 * exclusions as this port's proxies (sleeping; unalerted wanderers via
	 * `seesHero`/`lastSeen`/fleeing - the hunting row's own alerted notion;
	 * `invulnerability` for `isInvulnerable(PrismaticImage.class)`), hatching
	 * inside Chebyshev 5, into the free passable non-chasm neighbour closest
	 * (Euclidean, Java's `trueDistance`) to that enemy. Mind-vision-only enemies
	 * are NOT excluded: the hero FOV carries potion reveals indistinguishably
	 * (stated in PORT_COVERAGE.md).
	 */
	hatchPrismaticImage(this: DungeonScene, pool: number): boolean {
		let closest: Creature | undefined;
		let best = Infinity;
		for (const c of this.creatures) {
			if (c.isHero || c.isNPC || c.isAlly || c.hp <= 0) continue;
			if (!this.fov.isVisible(c.x, c.y)) continue;
			if (c.sleeping || c.buffs['invulnerability'] !== undefined) continue;
			if (!c.seesHero && c.lastSeen === undefined && !c.fleeing) continue;
			const d = Roguelike.chebyshevDistance(this.hero, c);
			if (d < best) { best = d; closest = c; }
		}
		if (!closest || best >= PRISMATIC_HATCH_RANGE) return false;
		//`PathFinder.NEIGHBOURS8` order (top-left row first), so Euclidean ties keep
		//Java's pick under the strict `<` comparison in `prismaticSpawnCell`.
		const neighbours: ReadonlyArray<readonly [number, number]> = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
		const candidates: { x: number; y: number; distance: number }[] = [];
		for (const [dx, dy] of neighbours) {
			const x = this.hero.x + dx, y = this.hero.y + dy;
			if (!this.level.passable(x, y) || this.isChasmCell(x, y) || this.creatureAt(x, y)) continue;
			candidates.push({ x, y, distance: Math.hypot(x - closest.x, y - closest.y) });
		}
		const at = prismaticSpawnCell(candidates);
		if (!at) return false;
		this.spawnPrismaticImage(at, Math.floor(pool));
		delete this.hero.prismaticGuardHp;
		delete this.hero.buffs['prismaticGuard'];
		return true;
	},

	/** `MirrorImage.damage()`: a mirror has no durability and fades on the first positive
	 * damage event, regardless of whether ordinary armor/HP resolution would be lethal. */
	fadeMirrorOnDamage(this: DungeonScene, target: Creature, damage: number): boolean {
		if (!target.isAlly || target.allyKind !== 'mirror' || damage <= 0) return false;
		this.showDamage(target, damage);
		this.kill(target);
		return true;
	},

	/** Java allies run their own `Char.fieldOfView`, not the player's current FOV. Using the
	 * hero's visibility here made a Mirror Image blind to a monster beside it whenever the
	 * hero was looking away, while also granting it knowledge through walls revealed by a
	 * mapping effect. This local FOV keeps the existing compact ally orders but gives them the
	 * correct information boundary. `radius` is the ally's own sight range where it has one
	 * (the spirit hawk's `viewDistance`); the fallback is Java's `Mob.viewDistance` (8),
	 * not the hero's radius - the hero's shrinks under darkness, Yog's gloom, the
	 * Halls cap and grows with Farsight, none of which touches an ally's own eyes.
	 * (The shared hero/monster sight radius elsewhere is a separate, documented
	 * simplification.)
	 */
	visibleAllyHostiles(this: DungeonScene, ally: Creature, radius = 8): Creature[] {
		const allyFov = new Roguelike.FieldOfView(this.level);
		allyFov.update(ally.x, ally.y, radius);
		return this.creatures.filter((c) => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0 && allyFov.isVisible(c.x, c.y));
	},

	/** The spirit hawk's own `viewDistance` for the current talent ranks. */
	spiritHawkViewDistance(this: DungeonScene): number {
		return spiritHawkViewDistance(this.talentRank('eagle_eye'));
	},

	/**
	 * `Level.updateFieldOfView(hero, heroFOV)`'s ally-vision union (tag `v3.3.8`): while updating
	 * the *hero's* field of view the level also recomputes each of a set of allies' own views and
	 * ORs them in - the list there is `WandOfWarding.Ward`, `WandOfRegrowth.Lotus`,
	 * `SpiritHawk.HawkAlly` and `PowerOfMany`'s buff - so a hawk sees for the Huntress exactly as
	 * the ability's own description promises, and its scouting is what reveals the floor ahead.
	 *
	 * Only the hawk is wired here: the port's wards and lotus carry no per-ally view distance of
	 * their own yet (Java gives a ward 4 cells and a lotus 1), so adding them would be guessing at
	 * numbers nothing else in this port checks. Recorded in `PORT_COVERAGE.md`.
	 */
	shareAllyVision(this: DungeonScene): void {
		const hawk = this.spiritHawk();
		if (!hawk) return;
		const allyFov = new Roguelike.FieldOfView(this.level);
		allyFov.update(hawk.x, hawk.y, this.spiritHawkViewDistance());
		for (const cell of allyFov.visible) {
			//`FogOfWar` here reads visibility alone (`lightAt` is unused), and Java's union carries
			//visibility alone too - so the hawk's cells join both sets without a light entry.
			this.fov.visible.add(cell);
			this.fov.explored.add(cell);
		}
	},

	/**
	 * `SpiritHawk.HawkAlly.act()` (tag `v3.3.8`): the hawk's turn. It flies, has `viewDistance`
	 * cells of sight and `baseSpeed` cells of movement, but `attacksAutomatically = false` - left
	 * to itself it only follows the hero (or the cell it was directed to) and never picks a fight.
	 * A hero who re-casts the ability on the hawk gives it a standing order instead, and that
	 * order is what makes it attack.
	 *
	 * Java's `timeRemaining` counts down by the actor time the hawk spends (`spend()`, which is
	 * `1/speed` per step and a full `TICK` when it has nowhere to go); at zero it dies and
	 * interrupts the hero. This port spends through the same `pendingMonsterTurnCost` hook the
	 * rest of the scheduler uses, so a speed-2 hawk genuinely takes two turns per hero turn.
	 */
	takeSpiritHawkTurn(this: DungeonScene, ally: Creature): void {
		//Java's expiry check opens the turn (`if (timeRemaining <= 0) { die(null); hero.interrupt(); }`),
		//so the hawk acts right up to the turn that empties its clock and dies on the next one.
		if ((ally.spiritHawkTime ?? SPIRIT_HAWK_LIFESPAN) <= 0) {
			this.kill(ally);
			return;
		}
		const speed = spiritHawkSpeed(this.talentRank('swift_spirit'));
		const ordered = ally.allyTargetChar !== undefined && ally.allyTargetChar.hp > 0 ? ally.allyTargetChar : undefined;
		//`attacksAutomatically = false`: with no order the hawk has no targets at all, so the
		//shared `takeAllyTurn` branch's "nearest visible hostile" would be an auto-hunt Java
		//deliberately denies it. An order is also the only thing that puts the hawk in HUNTING.
		const hostiles = ordered ? this.visibleAllyHostiles(ally, this.spiritHawkViewDistance()) : [];
		const target = ordered ?? hostiles[0];
		const defend = ally.allyDefendCell;
		const destination = target ?? defend ?? this.hero;
		//`spend(time)` is the actor time this turn costs the hawk, and `HawkAlly.spend()` takes the
		//same amount off `timeRemaining`: `1 / speed()` per step, a full `TICK` when it has nowhere
		//to go. A faster hawk therefore expires in fewer *turns* as well as moving further in each,
		//which is Java's own behaviour rather than an oversight to correct.
		let spent = 1;
		if (target && Roguelike.chebyshevDistance(ally, target) === 1) {
			if (this.attack(ally, target)) this.applyGoForTheEyes(target);
			spent = 1 / speed;
		} else {
			//Where the hawk would rather be: its ordered target, the ordered cell, or the hero.
			//It stays put once it has arrived at any of them (Java's `getCloser` returning false
			//falls through to a full `TICK` of waiting).
			const shouldMove = target !== undefined
				? Roguelike.chebyshevDistance(ally, target) > 1
				: defend !== undefined
					? ally.x !== defend.x || ally.y !== defend.y
					: Roguelike.chebyshevDistance(ally, this.hero) > 2;
			if (shouldMove) {
				const blocked = new Set(this.creatures.filter((c) => c !== ally && c !== destination)
					.map((c) => this.level.index(c.x, c.y)));
				this.eternalFireBlockedInto(blocked);
				const next = this.pathfinder.find({ x: ally.x, y: ally.y }, { x: destination.x, y: destination.y }, { blocked })[0];
				if (next) {
					this.moveTo(ally, next);
					spent = 1 / speed;
				}
			}
		}
		ally.spiritHawkTime = (ally.spiritHawkTime ?? SPIRIT_HAWK_LIFESPAN) - spent;
		this.pendingMonsterTurnCost = spent;
	},

	/** `HawkAlly.attackProc()`'s `GO_FOR_THE_EYES`: a landed hawk bite blinds the target, and at
	 *  ranks 3 and 4 also cripples it. Called only for a hit, matching Java's proc. */
	applyGoForTheEyes(this: DungeonScene, target: Creature): void {
		const effect = goForTheEyesEffect(this.talentRank('go_for_the_eyes'));
		if (effect.blindness > 0) addBuff(target, 'blindness', effect.blindness);
		if (effect.cripple > 0) addBuff(target, 'cripple', effect.cripple);
	},

	/** `WandOfLivingEarth.onZap()` creates the guardian once RockArmor reaches its
	 * `armorToGuardian()` threshold. The Java actor consumes the stored armor as HP and
	 * appears in the closest free neighbour of the zap target. */
	maybeSummonEarthGuardian(this: DungeonScene, target: Creature): void {
		if (this.livingEarthArmor < 8 + 4 * this.livingEarthWandLevel) return;
		//The summon-cell search lives in `simulation/wandering.ts` as
		//`nearestFreeCell` - shared with the Yog-minion placement below since the
		//file-size refactor's forty-fourth extraction, behavior-identical.
		const cell = nearestFreeCellFlow({ x: target.x, y: target.y }, true, this.summonCellContext());
		if (!cell) return;
		const guardian = this.spawnMonster('earthGuardian', cell, false, undefined, true, 'earthGuardian');
		guardian.earthGuardianWandLevel = this.livingEarthWandLevel;
		guardian.earthGuardianDefense = Math.floor((this.progression.level + 4) / 2);
		guardian.maxHp = guardian.earthGuardianWandLevel * 8 + 16;
		guardian.hp = Math.min(guardian.maxHp, this.livingEarthArmor);
		guardian.accuracy = 2 * guardian.earthGuardianDefense + 5;
		guardian.evasion = guardian.earthGuardianDefense;
		guardian.damage = [2, 4 + Math.floor(this.depth / 2)];
		guardian.armor = [guardian.earthGuardianWandLevel, 3 + 3 * guardian.earthGuardianWandLevel];
		this.livingEarthArmor = 0;
		this.say(t('port.log.wandlivingearth'), 'positive');
	},

	/** `EarthGuardian.Wandering.act()`: when no enemy remains in its sight, the guardian
	 * returns its current HP to RockArmor and disappears. While an enemy is visible it uses
	 * the ordinary allied melee/pathing loop, with the Java-derived stats set at summon. */
	takeEarthGuardianTurn(this: DungeonScene, guardian: Creature): void {
		const hostiles = this.visibleAllyHostiles(guardian)
			.sort((a, b) => Roguelike.chebyshevDistance(guardian, a) - Roguelike.chebyshevDistance(guardian, b));
		const target = hostiles[0];
		if (!target) {
			this.livingEarthWandLevel = Math.max(this.livingEarthWandLevel, guardian.earthGuardianWandLevel ?? 0);
			this.livingEarthArmor = Math.min(2 * (8 + 4 * this.livingEarthWandLevel), this.livingEarthArmor + guardian.hp);
			this.kill(guardian);
			return;
		}
		if (Roguelike.chebyshevDistance(guardian, target) === 1) {
			this.attack(guardian, target);
			return;
		}
		const blocked = new Set(this.creatures.filter((c) => c !== guardian && c !== target).map((c) => this.level.index(c.x, c.y)));
		this.eternalFireBlockedInto(blocked);
		const next = this.pathfinder.find({ x: guardian.x, y: guardian.y }, { x: target.x, y: target.y }, { blocked })[0];
		if (next) this.moveTo(guardian, next);
	},

	/** `WandOfWarding.Ward.zap()`: an always-hit ranged attack followed by the real tier
	 * lifetime/self-damage rule. The actor is immovable in practice because wards do not
	 * enter the movement branch above; its compact ally turn only fires at visible hostiles. */
	takeWardTurn(this: DungeonScene, ward: Creature): void {
		const target = this.visibleAllyHostiles(ward)
			.filter((creature) => Roguelike.chebyshevDistance(ward, creature) <= 8)
			.sort((a, b) => Roguelike.chebyshevDistance(ward, a) - Roguelike.chebyshevDistance(ward, b))[0];
		if (target) {
			//`WandOfWarding.Ward` is itself one of `AntiMagic.RESISTS`' listed source classes -
			//`Char.damage()` zeroes this hit for a MagicImmune target the same way it does for
			//every other RESISTS-listed source; the zap still counts against the ward's own
			//lifetime, matching Java charging `wardTotalZaps` regardless of the hit landing.
			if (!target.magicImmune) {
				const wandLevel = ward.wardWandLevel ?? 0;
				const damage = Random.normalRange(2 + wandLevel, 8 + 4 * wandLevel);
				target.hp -= damage;
				this.showDamage(target, damage);
				target.sleeping = false;
				if (target.hp <= 0) this.kill(target);
			}
			ward.wardTotalZaps = (ward.wardTotalZaps ?? 0) + 1;
			//`WardSprite.zap()`'s own-sprite burst + RAY sample (see
			//`simulation/deathBursts.ts`); the DeathRay beam and attacker flash
			//stay recorded-open there.
			this.playDeathBursts(wardZapBursts(), ward.x, ward.y);
		}
		const tier = ward.wardTier ?? 1;
		if (tier <= 3) {
			if ((ward.wardTotalZaps ?? 0) >= (MWL_WAND_WARD_RULES[tier]?.zapLimit ?? 0)) this.kill(ward);
		} else {
			ward.hp -= MWL_WAND_WARD_RULES[tier]?.selfDamage ?? 0;
			if (ward.hp <= 0) this.kill(ward);
		}
	},
};
