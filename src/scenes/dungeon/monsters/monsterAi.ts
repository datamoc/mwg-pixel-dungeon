import type { DungeonScene } from '../../dungeonScene';
import { faceCharacter } from '../../../ui/characterPlacement';
import { Random, Roguelike, SpriteSheet } from 'mwg';
import { ARMOR_TIER_BY_CLASS, WEAPON_TIER_BY_CLASS, armorReductionRange } from '../../../items/catalog';
import { Cat } from '../../../items/generator';
import { UNSTABLE_DELEGATES, rollStatueEnchant, statueEnchantChance, statueWeaponStats, type StatueEnchant } from '../../../items/statueWeapons';
import { traceRayToTarget } from '../../../mechanics/rays';
import { isStatueLoot } from '../shared';
import { missileFlightArt } from '../../../items/missiles';
import { throwTenguBomb } from '../../../items/bombs';
import { runAttackResolution } from '../../../adapters/attackSimulation';
import { simulationRandom } from '../../../adapters/mwgRandom';
import { simulationRoguelike } from '../../../adapters/mwgRoguelike';
import { wraithCombatStats } from '../../../simulation/wraith';
import { stepTenguAbility, tenguAbilityCost } from '../../../simulation/tenguAbility';
import { colorblind } from '../../../settings';
import { capitalize, has, t } from '../../../i18n/index';
import { SPD_TERRAIN_TO_GAME_KIND, toGameTerrain } from '../../../spdLevelGen/gameBridge';
import { CITY_IMP_SHOP, PRISON_ARENA, PRISON_TENGU_CELL, PRISON_TENGU_CELL_CENTER, PRISON_TENGU_CELL_DOOR, prisonBossArena, prisonBossEnd, prisonBossPause } from '../../../spdLevelGen/bossLevels';
import { hallsCenterPieceLayer, hallsCenterWallLayer } from '../../../spdLevelGen/hallsBossVisuals';
import { spdPatchGenerate } from '../../../spdLevelGen/spdPatch';
import { Terrain, type PaintLevel } from '../../../spdLevelGen/paintLevel';
import { runState } from '../../../runState';
import { isChallengeEnabled } from '../../../challenges';
import { mobOnHit } from '../../mobOnHit';
import { type BossUnsealContext } from '../../bossUnseal';
import { aggressionTarget as aggressionTargetFlow, amokTarget as amokTargetFlow, beeTarget as beeTargetFlow, pursueTarget as pursueTargetFlow, selectRangedTarget } from '../../../simulation/targeting';
import { fleeStep as fleeStepFlow, isPatrolTargetValid as isPatrolTargetValidFlow, wanderBlocked as wanderBlockedFlow, type FleeStepContext, type SummonCellContext, type WanderingContext } from '../../../simulation/wandering';
import { canRipperLeap, chooseRipperBounceEnd, predictRipperLeapTarget, ripperLeapCooldown } from '../../../simulation/ripperLeap';
import { chooseSuccubusBlinkCell, shouldSuccubusBlink, succubusBlinkCooldown } from '../../../simulation/succubusBlink';
import { DOOR, DOOR_CLOSED, FLOOR, GAME_KIND_CODES, SOLID, TILE, WALL, WATER } from '../../../dungeonConstants';
import { NEGATIVE_BUFFS, addBuff, buffBlocked, reigniteBuff, rollDamage, rollHit, setBleeding, type BuffId, type Creature, type GroundItem, type Step } from '../../../combat';
import { applyChillFreeze } from '../../../simulation/buffs';
import { IMMOVABLE_KINDS, liveStats } from '../../../monsters';
import { TENGU_CIRCLE8 } from '../shared';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `monsterAi`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const monsterAiMethods = {
	/** `Amok.act()` lets a visible mob attack any nearby character, including another hostile
	 * mob or a player-side ally. The real Mob state also has an exact aggro/path memory; this
	 * port's compact turn model expresses the same combat consequence by selecting the nearest
	 * living non-NPC creature within eight tiles and pathing toward it. */
	//The Amok target query lives in `simulation/targeting.ts` as `amokTarget` -
	//the file-size refactor's fortieth extraction, behavior-identical. The scene
	//only binds its creatures and the real geometry here.
	takeAmokTurn(this: DungeonScene, monster: Creature): void {
		const target = amokTargetFlow(monster, this.creatures, simulationRoguelike);
		if (!target) return;
		this.pursue(monster, target);
	},

	/** The shared Amok/Aggression pursuit tail lives in `simulation/targeting.ts`
	 * as `pursueTarget` - the file-size refactor's forty-sixth extraction,
	 * behavior-identical. The scene only binds its creatures and geometry here. */
	pursue(this: DungeonScene, monster: Creature, target: Creature): void {
		pursueTargetFlow(monster, target, {
			creatures: this.creatures,
			cellIndex: (x, y) => this.level.index(x, y),
			blockEternalFire: (blocked) => this.eternalFireBlockedInto(blocked),
			findStep: (from, to, blocked) => this.pathfinder.find(from, to, { blocked })[0],
			isAdjacent: (a, b) => Roguelike.chebyshevDistance(a, b) === 1,
			step: (m, s) => this.stepMonster(m, s),
			strike: (m, t) => { this.attack(m, t); },
		});
	},

	/** Java's hostile-target query considers the hero and friendly summoned characters. Keep
	 * the hero first for equal distances so ordinary runs preserve their previous target and
	 * random stream while a nearer MirrorImage can now draw a ranged attack. `null`, not
	 * `undefined`, for "nothing to pick" - mwg's own API-wide convention (REFERENCE.md,
	 * "Conventions"), which the surrounding port code mostly follows already. */
	rangedTarget(this: DungeonScene, monster: Creature, range: number): Creature | null {
		return selectRangedTarget(this.level, monster, this.hero, this.creatures, range, simulationRoguelike);
	},

	/**
	 * `Mob.chooseEnemy()`'s Aggression priority lives in `simulation/targeting.ts`
	 * as `aggressionTarget` - the file-size refactor's thirty-sixth extraction,
	 * behavior-identical. The scene only binds its level and creatures here.
	 */
	aggressionTarget(this: DungeonScene, monster: Creature): Creature | null {
		return aggressionTargetFlow(this.level, monster, this.creatures, simulationRoguelike);
	},

	/** `Mob.chooseEnemy()` prioritizes a character carrying `Aggression`, even when that
	 * character is another enemy. This small shared branch applies that priority to all ordinary
	 * movement before per-kind ranged overrides, preserving the stone's forced-target effect. */
	takeAggressionTurn(this: DungeonScene, monster: Creature, target: Creature): void {
		this.pursue(monster, target);
	},

	/** `Bee.chooseEnemy()` as a whole-turn override: the pot holder first (hero or mob, at any
	 * range), else the nearest live mob within 3 of the pot, else the hero within 3 of the
	 * pot. No suspect, no hunt: a random free step, like the generic wander. The bee spawns
	 * hostile (never an ally), so no alignment flip is needed. Movement hunts through the
	 * shared AI with the bee's own `viewDistance` 4 (not the hero's 8), and attacks land
	 * through the ordinary `attack()` - including the depth row's `[HT/10, HT/4]` damage,
	 * which `liveStats` already rolls bell-curved.
	 * Not modeled: stung mobs turning on the bee (`attackProc`'s beckon - this port's mobs
	 * cannot target other mobs, only hero and allies), and the honeyed-charm ally path (no
	 * honeyed elixir exists to drink). */
	//`Bee.chooseEnemy()` lives in `simulation/targeting.ts` as `beeTarget` - the
	//file-size refactor's forty-first extraction, behavior-identical. The scene
	//only binds its hero and creatures here.
	takeBeeTurn(this: DungeonScene, bee: Creature): void {
		const target: Creature | null = beeTargetFlow(bee, this.hero, this.creatures, simulationRoguelike);
		if (!target) {
			const steps = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: bee.x + dx, y: bee.y + dy }))
				.filter((cell) => this.level.inside(cell.x, cell.y) && this.level.passable(cell.x, cell.y)
					&& !this.creatureAt(cell.x, cell.y));
			if (steps.length > 0) this.moveTo(bee, steps[Random.int(steps.length)]!);
			return;
		}
		if (Roguelike.chebyshevDistance(bee, target) === 1) {
			this.attack(bee, target);
			return;
		}
		const blocked = new Set(this.creatures.filter((c) => c !== bee && c !== target).map((c) => this.level.index(c.x, c.y)));
		const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, bee, bee.hp / bee.maxHp, target, {
			sightRadius: 4, fleeBelow: 0, blocked,
		});
		if (decision.step) this.moveTo(bee, decision.step);
	},

	/** `Statue`'s PASSIVE turn (`Statue.java`, tag `v3.3.8`): immobile until woken, then
	 * adjacent-only attacks through this override (the woken-statue chase is a recorded
	 * simplification, not modeled here). `sleeping` is the port's compact passive-state
	 * flag: the damage path wakes it after a hit lands, and - matching `Statue.add()`'s
	 * `NEGATIVE`-buff flip to HUNTING - a debuffed sleeper wakes here, since this override
	 * returns before the generic sleeping branch that would otherwise do it. */
	takeStatueTurn(this: DungeonScene, monster: Creature): boolean {
		if (monster.sleeping && Object.keys(monster.buffs).some((id) => NEGATIVE_BUFFS.has(id as BuffId))) {
			monster.sleeping = false;
		}
		//`BlockBuff` lapses outright a few turns after it is set (a cliff edge, not a decay).
		if ((monster.blockTurns ?? 0) > 0 && --monster.blockTurns! <= 0) monster.blockShield = 0;
		//`Statue` is PASSIVE until something hurts it (or a negative buff lands): it never wakes on sight.
		if (monster.sleeping) return true;
		//`Statue.canAttack()`: adjacent, or within the weapon's reach along a clear line.
		if (this.statueCanReach(monster)) {
			this.attack(monster, this.hero);
			return true;
		}
		//Awake and out of reach: a HUNTING `Mob`, so it walks after the hero like any other. It used to
		//stand still and swing only when the hero happened to be adjacent.
		return false;
	},

	/** `Weapon.canReach()` for a statue: plain adjacency for reach 1; a longer reach needs the hero within
	 * that many cells with nothing in between (`Ballistica.PROJECTILE`). */
	statueCanReach(this: DungeonScene, monster: Creature): boolean {
		const distance = Roguelike.chebyshevDistance(monster, this.hero);
		if (distance === 1) return true;
		const reach = monster.reach ?? 1;
		if (reach <= 1 || distance > reach) return false;
		const path = traceRayToTarget(this.level, { x: monster.x, y: monster.y }, { x: this.hero.x, y: this.hero.y },
			(x, y) => (x === this.hero.x && y === this.hero.y ? null : this.creatureAt(x, y)));
		const last = path[path.length - 1];
		return path.length <= reach && last !== undefined && last.x === this.hero.x && last.y === this.hero.y;
	},

	/**
	 * `Weapon.Enchantment.proc()` for a statue's weapon (`Statue.attackProc()`, tag `v3.3.8`), run after
	 * its swing landed on `defender` for `damage`. Every chance is at a proc multiplier of 1 (no Arcana,
	 * Berserk or trackers on a statue) and reads the weapon's own level.
	 * - blazing/chilling/shocking/blooming/elastic/vampiric/grim: the same effects the hero's weapon has, turned on the hero.
	 * - blocking: a `round(2 + level)` shield on the statue for 5 turns.
	 * - unstable: a random delegate from `Unstable.randomEnchants` on every hit.
	 * - projecting: no proc, it lengthens the reach (`applyStatueKit`).
	 * - kinetic, lucky, corrupting: no observable effect on a hero (they act on an overkill, a kill, or a `Mob`).
	 * Not ported: the armor glyph of an armored statue, and the enchantment of the *dropped* weapon (the
	 * item generator rolls its own).
	 */
	statueEnchantProc(this: DungeonScene, statue: Creature, defender: Creature, damage: number, delegated?: StatueEnchant): void {
		const enchant = delegated ?? (statue.statueEnchant as StatueEnchant | undefined);
		if (!enchant || defender.hp <= 0 || defender.magicImmune) return;
		const level = Math.max(0, statue.statueLevel ?? 0);
		const chance = statueEnchantChance(enchant, level);
		switch (enchant) {
			case 'unstable':
				this.statueEnchantProc(statue, defender, damage, Random.element(UNSTABLE_DELEGATES) ?? 'blazing');
				return;
			case 'blazing': {
				if (!Random.chance(chance)) return;
				let power = Math.max(1, chance);
				if (defender.buffs['burning'] === undefined) {
					addBuff(defender, 'burning');
					power -= 1;
				}
				if (power > 0 && defender.hp > 0) {
					const burn = Math.round(Random.normalRange(1, 3 + Math.floor(this.depth / 4)) * 0.67 * power);
					if (burn > 0) this.damageFromProc(defender, burn);
				}
				return;
			}
			case 'chilling': {
				if (!Random.chance(chance)) return;
				const power = Math.max(1, chance);
				const existing = defender.buffs['chill'] ?? 0;
				const added = Math.min(Math.round(3 * power), Math.round(6 * power) - existing);
				if (added > 0 && !buffBlocked(defender, 'chill')) defender.buffs['chill'] = existing + added;
				return;
			}
			case 'shocking':
				if (Random.chance(chance)) this.shockingArc(statue, defender, damage, Math.max(1, chance));
				return;
			case 'blooming':
				if (Random.chance(chance)) this.applyBloomingGrass(statue, defender, level, chance);
				return;
			case 'elastic': {
				if (!Random.chance(chance)) return;
				const dx = Math.sign(defender.x - statue.x);
				const dy = Math.sign(defender.y - statue.y);
				const distance = Math.round(2 * Math.max(1, chance));
				for (let step = 0; step < distance; step++) {
					const next = { x: defender.x + dx, y: defender.y + dy };
					if (!this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y)) break;
					this.moveTo(defender, next);
				}
				return;
			}
			case 'vampiric': {
				const missing = statue.maxHp > 0 ? (statue.maxHp - statue.hp) / statue.maxHp : 0;
				const healChance = 0.05 + 0.25 * missing;
				if (!Random.chance(healChance) || statue.hp >= statue.maxHp) return;
				const heal = Math.min(Math.round(damage * 0.5 * Math.max(1, healChance)), statue.maxHp - statue.hp);
				if (heal > 0) { statue.hp += heal; this.showHeal(statue, heal); }
				return;
			}
			case 'grim': {
				//`GrimTracker`: `maxChance` scaled by the square of the defender's missing-HP fraction, and a
				//success deals the defender's whole remaining HP.
				const missing = (defender.maxHp - defender.hp) / defender.maxHp;
				if (Random.chance(chance * missing * missing)) this.damageFromProc(defender, Math.round(defender.hp));
				return;
			}
			case 'blocking':
				if (Random.chance(chance)) {
					statue.blockShield = Math.max(statue.blockShield ?? 0, Math.round(Math.max(1, chance) * (2 + level)));
					statue.blockTurns = 5;
				}
				return;
			default:
				return;
		}
	},

	/** Direct enchant damage: the hero's barrier and Tenacity-style reductions apply, armor does not. */
	damageFromProc(this: DungeonScene, defender: Creature, amount: number): void {
		const dealt = defender.isHero ? this.absorbHeroDamage(amount, true) : amount;
		defender.hp -= dealt;
		this.showDamage(defender, dealt);
	},

	/**
	 * `Statue()`/`ArmoredStatue()` (tag `v3.3.8`): the statue fights with the weapon (and armor) it
	 * generated, not with a flat stat line. `damageRoll()`, `attackSkill()` (`(9 + depth) * ACC`),
	 * `attackDelay()`, `canAttack()`'s reach and `drRoll()` (`NormalIntRange(0, depth + defenseFactor)`,
	 * plus the armor's `DRMin..DRMax` when armored) all read it. Runs at spawn and again on load, from the
	 * payload the painter kept (`statue:{...}`), so the numbers are derived rather than saved; a statue with
	 * no payload (a Guardian, an old save) keeps the depth table's stand-in stats.
	 * Simplified: the armored statue's two DR rolls (`0..depth+def` and `DRMin..DRMax`) are one roll over the
	 * summed range, which keeps the ends and the mean but flattens the bell. Not ported: the weapon's random
	 * enchantment proc (`weapon.proc`), the armor's glyph (`armor.proc`) and Brimstone/AntiMagic immunities.
	 */
	applyStatueKit(this: DungeonScene, monster: Creature): void {
		if ((monster.kind !== 'statue' && monster.kind !== 'armoredStatue') || !monster.mimicLoot?.startsWith('statue:')) return;
		let parsed: unknown;
		try { parsed = JSON.parse(monster.mimicLoot.slice('statue:'.length)); } catch { return; }
		if (!isStatueLoot(parsed)) return;
		const weaponTier = WEAPON_TIER_BY_CLASS[parsed.weapon.cls.toLowerCase()] ?? Math.max(1, parsed.weapon.cat - Cat.WEAPON);
		const weapon = statueWeaponStats(parsed.weapon.cls, weaponTier, parsed.weapon.level);
		//`Statue()`: `weapon.enchant(Enchantment.random())`. Rolled here on the scene's stream and written back into
		//the payload so it survives saves (the painter's own draw is discarded, see `statueWeapons.ts`).
		let enchant = parsed.enchant as StatueEnchant | undefined;
		if (enchant === undefined) {
			enchant = rollStatueEnchant(() => Random.float(), (n) => Random.int(0, n));
			monster.mimicLoot = `statue:${JSON.stringify({ ...parsed, enchant })}`;
		}
		monster.statueEnchant = enchant;
		monster.statueLevel = parsed.weapon.level;
		monster.damage = [weapon.min, Math.max(weapon.min, weapon.max)];
		monster.accuracy = Math.trunc((9 + this.depth) * weapon.accuracyFactor);
		monster.attackDelay = weapon.delayFactor === 1 ? undefined : weapon.delayFactor;
		//`Weapon.reachFactor()`: Projecting adds `round(procChanceMultiplier)` = 1 to the weapon's reach.
		const reach = weapon.reach + (enchant === 'projecting' ? 1 : 0);
		monster.reach = reach === 1 ? undefined : reach;
		let drMin = 0;
		let drMax = this.depth + weapon.defense;
		if (parsed.armor) {
			const armorTier = ARMOR_TIER_BY_CLASS[parsed.armor.cls.toLowerCase()] ?? 1;
			const [armorMin, armorMax] = armorReductionRange(armorTier, parsed.armor.level);
			drMin += armorMin;
			drMax += armorMax;
		}
		monster.armor = [drMin, Math.max(drMin, drMax)];
	},

	/** `Pylon.act()`/`Pylon.activate()` (tag `v3.3.8`): inactive pylons are neutral, immovable
	 * and do not attack. Once the DM-300 gate activates them, each pylon shocks the next neighbour
	 * in its clockwise cursor, with three extra targets under the stronger-bosses challenge. */
	takePylonTurn(this: DungeonScene, monster: Creature): void {
		if (!monster.pylonActive) return;
		const cursor = monster.pylonTargetNeighbor ?? 0;
		const offsets = Roguelike.neighbourOffsets(8);
		const indices = isChallengeEnabled('stronger_bosses')
			? [cursor, (cursor + 3) % 8, (cursor + 5) % 8]
			: [cursor, (cursor + 4) % 8];
		for (const index of indices) {
			const [dx, dy] = offsets[index]!;
			const target = this.creatureAt(monster.x + dx, monster.y + dy);
			if (!target || target.kind === 'dm300' || target.hp <= 0) continue;
			//No armor: `Pylon.act()` calls `ch.damage(Random.NormalIntRange(10, 20), new
			//Electricity())` directly, and `Char.damage()` subtracts no DR - see `zapHero`'s note.
			const raw = Random.normalRange(10, 20);
			if (target.isHero) {
				const damage = this.absorbHeroDamage(raw);
				target.hp -= damage;
				this.showDamage(target, damage);
				if (target.hp <= 0) this.kill(target, 'foe');
			} else {
				target.hp -= raw;
				this.showDamage(target, raw);
				if (target.hp <= 0) this.kill(target, 'foe');
			}
		}
		monster.pylonTargetNeighbor = (cursor + 1) % 8;
	},

	/**
	 * `Mob.Wandering.continueWandering()` (Mob.java, tag v3.3.8): retain a random target until
	 * it is reached, then choose another passable destination. This scene-owned strategy keeps
	 * the live pathfinder and terrain queries together, while the caller remains responsible for
	 * the subsequent ranged/hostile fallback.
	 */
	/**
	 * The wandering-decision trio (`wanderBlocked`, `isPatrolTargetValid`,
	 * `randomPatrolDestination`) lives in `simulation/wandering.ts` - the file-size
	 * refactor's thirty-eighth extraction, behavior-identical. The scene only
	 * binds its level, creatures, hero and eternal-fire set in the builder below.
	 */
	wanderingContext(this: DungeonScene): WanderingContext {
		return {
			width: this.level.width,
			height: this.level.height,
			cellCount: this.level.cellCount,
			passable: (x, y) => this.level.passable(x, y),
			inside: (x, y) => this.level.inside(x, y),
			terrainAt: (x, y) => this.level.get(x, y),
			terrainAtCell: (cell) => this.level.terrain[cell],
			waterTerrain: WATER,
			cellIndex: (x, y) => this.level.index(x, y),
			isChasm: (x, y) => this.isChasmCell(x, y),
			creatureAt: (x, y) => this.creatureAt(x, y),
			creatures: this.creatures,
			hero: this.hero,
			blockExtraInto: (blocked) => this.eternalFireBlockedInto(blocked),
			pickElement: (candidates) => Random.element(candidates) ?? undefined,
		};
	},

	wanderBlocked(this: DungeonScene, monster: Creature, blockHeroCell: boolean): Set<number> {
		return wanderBlockedFlow(monster, blockHeroCell, this.wanderingContext());
	},

	takeWanderingTurn(this: DungeonScene, monster: Creature): boolean {
		if (monster.seesHero || monster.kind === 'dm201'
			|| Roguelike.chebyshevDistance(monster, this.hero) === 1) {
			//`Mob.Hunting`: the target refreshes to the enemy's cell every turn it is seen.
			if (monster.seesHero) monster.lastSeen = { x: this.hero.x, y: this.hero.y };
			return false;
		}
		//`Mob.Hunting` with an unseen enemy paths to the last cell where it saw the hero;
		//reaching it unseen, or finding it unreachable, gives up to wandering - `showLost`
		//has no presentation here, so the turn is simply spent. Fleeing mobs never pursue
		//(Fleeing is its own state in Java).
		if (monster.lastSeen && !monster.fleeing) {
			if (monster.x !== monster.lastSeen.x || monster.y !== monster.lastSeen.y) {
				const next = this.pathfinder.find(
					{ x: monster.x, y: monster.y }, monster.lastSeen, { blocked: this.wanderBlocked(monster, true) },
				)[0];
				if (next) {
					this.stepMonster(monster, next);
					return true;
				}
			}
			monster.lastSeen = undefined;
			return true;
		}
		const target = monster.patrolTarget;
		const targetValid = target
			&& isPatrolTargetValidFlow(target, monster.kind === 'piranha' || monster.kind === 'phantomPiranha', this.wanderingContext());
		if (!targetValid) monster.patrolTarget = this.randomPatrolDestination(monster);
		if (!monster.patrolTarget) return true;
		if (monster.x === monster.patrolTarget.x && monster.y === monster.patrolTarget.y) {
			monster.patrolTarget = undefined;
			return true;
		}
		const next = this.pathfinder.find(
			{ x: monster.x, y: monster.y }, monster.patrolTarget, { blocked: this.wanderBlocked(monster, false) }
		)[0];
		if (next) this.stepMonster(monster, next);
		else if (monster.kind === 'golem' && this.depth !== 20
			&& monster.patrolTarget && (monster.golemSelfTeleCooldown ?? 0) <= 0) {
			//Golem.Wandering.continueWandering(): Java spends 2*TICK charging before teleporting
			//to an unreachable target and resets its self-teleport cooldown to 30 (Golem.java).
			//The port commits the relocation in one logical action because it has no delayed
			//teleport-particle actor; the scheduler cost remains the real 2*TICK.
			this.pendingMonsterTurnCost = 2;
			this.moveTo(monster, monster.patrolTarget);
			monster.golemSelfTeleCooldown = 30;
			monster.patrolTarget = undefined;
		} else monster.patrolTarget = undefined;
		return true;
	},

	/** `Golem.canTele(target)` from `Golem.java` (tag v3.3.8): the zap may route around
	 * solid terrain, so line-of-sight is not enough. Java builds a bounded distance map from
	 * the hero and accepts any reachable golem; MWG's pathfinder gives the same passable-cell
	 * reachability here. Creature occupancy is intentionally ignored, matching Java's map
	 * (characters are not part of `Level.solid`). */
	golemCanTeleport(this: DungeonScene, monster: Creature): boolean {
		return this.pathfinder.find(
			{ x: monster.x, y: monster.y },
			{ x: this.hero.x, y: this.hero.y },
		).length > 0;
	},

	/** Necromancer/SpectralNecromancer's non-adjacent turn (the adjacent case bolts instead,
	 * handled at the `distance === 1` dispatch via `zapHero` directly). See the
	 * `rangedAiOverrides.necromancer` entry's own comment for the Java citation. */
	necromancerRangedTurn(this: DungeonScene, monster: Creature, distance: number): boolean {
		const skel = monster.skeleton;
		//Necromancer.onZapComplete(): while its skeleton lives and is in its own sight, it
		//supports rather than attacks directly - heals HT/5 if the skeleton is hurt, else
		//grants it a one-time Adrenaline (reusing this port's existing haste stand-in, since
		//there is no separate Adrenaline buff) once per summon. Previously the necromancer
		//never did either - once summoned, the skeleton just fought alone with no ongoing
		//support at all.
		const skelVisible = skel && skel.hp > 0 && Roguelike.canTarget(this.level, monster, skel, { range: 8 });
		if (skelVisible) {
			if (skel.hp < skel.maxHp) {
				const healed = Math.min(skel.maxHp - skel.hp, Math.round(skel.maxHp / 5));
				skel.hp += healed;
				this.showHeal(skel, healed);
				this.say(t('port.log.necroheal'), 'warning');
				return true;
			}
			if (!skel.hasteTurns) {
				skel.hasteBaseSpeed = skel.speed ?? 1;
				skel.speed = skel.hasteBaseSpeed * 2;
				skel.hasteTurns = 3;
				this.say(t('port.log.necroadrenaline'), 'warning');
				return true;
			}
		}
		//Hunting.act()'s teleport branch: an out-of-sight skeleton not already adjacent to
		//the hero gets teleported to a free cell beside the hero instead, so it can rejoin
		//the fight rather than being stranded wherever it last wandered. Java picks the
		//*closest* such cell that is also in the necromancer's own sight
		//(`fieldOfView[enemy.pos+c]`, strictly smallest `trueDistance` over
		//`PathFinder.NEIGHBOURS8` order) - this port used to pick any free neighbour.
		//`openSpace`/LARGE has no counterpart (no LARGE mob exists here); the trigger above
		//stays the port's own narrower one (unseen skeleton, no path-length clause).
		if (
			skel && skel.hp > 0 && !skelVisible && monster.seesHero &&
			Roguelike.chebyshevDistance(skel, this.hero) > 1
		) {
			const necroFov = new Roguelike.FieldOfView(this.level);
			necroFov.update(monster.x, monster.y, this.viewRadius());
			//Java's `PathFinder.NEIGHBOURS8` order: ties break toward the northwest.
			const order: ReadonlyArray<readonly [number, number]> =
				[[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
			let at: Step | null = null;
			//`Level.trueDistance` is Euclidean; the initial `telePos = -1` compares
			//farther than any real cell, so the first valid candidate always wins.
			let best = Infinity;
			for (const [dx, dy] of order) {
				const cell = { x: this.hero.x + dx, y: this.hero.y + dy };
				if (!this.level.inside(cell.x, cell.y) || !this.level.passable(cell.x, cell.y)
					|| this.creatureAt(cell.x, cell.y) || !necroFov.isVisible(cell.x, cell.y)
					|| this.smokeBlocksSight(monster.x, monster.y, cell.x, cell.y)) continue;
				const distance = Math.hypot(cell.x - monster.x, cell.y - monster.y);
				if (distance < best) {
					best = distance;
					at = cell;
				}
			}
			if (at) {
				const skelTeleFrom = { x: skel.x, y: skel.y };
				this.moveTo(skel, at);
				this.playTeleportAppear(skelTeleFrom, at, skel);
				this.say(t('port.log.necroteleport'), 'warning');
				return true;
			}
		}
		if ((!skel || skel.hp <= 0) && distance <= 4) {
			this.summonSkeleton(monster);
			return true;
		}
		if (this.rangedTarget(monster, 6)) {
			this.zapHero(monster, [2, 10]);
			return true;
		}
		return false;
	},

	/** Scorpio/Acidic's non-adjacent turn (the adjacent case retreats instead, handled at the
	 * `distance === 1` dispatch via `stepAway`). Scorpio: ranged-only over PROJECTILE
	 * ballistics, like the Trickster. Acidic shares this unchanged. */
	scorpioRangedTurn(this: DungeonScene, monster: Creature): boolean {
		const target = this.rangedTarget(monster, 6);
		if (!target) return false;
		this.attack(monster, target);
		this.spawnProjectile(monster, target);
		return true;
	},

	/** `DM200.canVent()` (`DM200.java`, tag `v3.3.8`): the vent may route *around*
	 *  blocking terrain but not through it - a bounded BFS from the hero over non-solid
	 *  cells, capped at `distance+1`, with characters ignored (Java maps `solid`, which
	 *  has no actors in it). 8-directional with no row wrap, matching `dirLR`; `limit`
	 *  cuts the flood exactly like Java's early `return`. Solid here is the live `WALL`
	 *  and `DOOR_CLOSED` kinds - Java's `SOLID`-flagged set (walls, locked doors, statues,
	 *  bookshelves, bars) collapses onto those two, while open doors, water, chasms and
	 *  traps stay traversable on both sides. */
	dm200CanVent(this: DungeonScene, monster: Creature): boolean {
		if ((monster.ventCooldown ?? 0) > 0) return false;
		const w = this.level.width, h = this.level.height;
		const maxDist = Roguelike.chebyshevDistance(monster, this.hero) + 1;
		const seen = new Int8Array(w * h);
		const start = this.level.index(this.hero.x, this.hero.y);
		seen[start] = 1;
		let frontier = [start];
		for (let dist = 0; dist < maxDist && frontier.length > 0; dist++) {
			const next: number[] = [];
			for (const cell of frontier) {
				const x = cell % w, y = Math.floor(cell / w);
				for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;
					const nx = x + dx, ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					const n = ny * w + nx;
					if (seen[n] === 1) continue;
					const kind = this.level.get(nx, ny);
					if (kind === WALL || kind === DOOR_CLOSED) continue;
					seen[n] = 1;
					if (n === this.level.index(monster.x, monster.y)) return true;
					next.push(n);
				}
			}
			frontier = next;
		}
		return false;
	},

	/** `DM200.Hunting.act()`'s vent half (`DM200.java`, tag `v3.3.8`): a distance-scaled roll
	 *  (`Random.Int(100/distance)==0` - farther away is *more* likely, up to 30 turns'
	 *  cooldown after each vent) vents toxic gas along the line to the hero whenever `canVent`
	 *  (above) allows - no line of sight needed, the gas routes around rock. Failing the roll,
	 *  Java tries `getCloser(target)` and only vents on *that* failing too (the vent retry);
	 *  reaching here without a step means the shared mover below takes the approach, so this
	 *  returns false exactly when Java would move, and vents when Java would vent. */
	dm200HuntingTurn(this: DungeonScene, monster: Creature, distance: number): boolean {
		if (distance >= 1
			&& Random.int(Math.max(1, Math.floor(100 / distance))) === 0
			&& this.dm200CanVent(monster)) {
			this.ventDM200(monster);
			return true;
		}
		const blocked = new Set(
			this.creatures.filter((c) => c !== monster && c !== this.hero).map((c) => this.level.index(c.x, c.y))
		);
		this.eternalFireBlockedInto(blocked);
		const step = this.pathfinder.find(
			{ x: monster.x, y: monster.y },
			{ x: this.hero.x, y: this.hero.y },
			{ blocked },
		)[0];
		if (step) return false;
		if (this.dm200CanVent(monster)) {
			this.ventDM200(monster);
			return true;
		}
		return false;
	},

	/** Eye.doAttack()/deathGaze(): a real two-turn ranged beam, not a melee proc - turn 1
	 * charges (Java's own `spend(attackDelay()*2f)`, reproduced via `pendingMonsterTurnCost`;
	 * no damage yet, but the eye takes 1/4 damage meanwhile via the `beamCharged` check
	 * earlier in this file's damage-modifier chain), turn 2 fires along a clear line to the
	 * hero for a real magic hit roll (`hit(this, ch, true)`) and `NormalIntRange(30,50)`
	 * damage - Java's own `ch.damage(dmg, ...)` call, which bypasses armor/DR entirely, the
	 * same as every other bolt here (see `zapHero`'s note) - then a 4-6 turn cooldown. Kept
	 * separate from `zapHero` because Java's beam is `NormalIntRange` while that helper takes
	 * a per-mob range pair, and because the beam has its own two-turn state machine. */
	/**
	 * `Eye.deathGaze()`'s per-victim hit for a non-hero char (`Eye.java`, tag
	 * `v3.3.8`): the `hit(this, ch, true)` roll happens in the caller; here the
	 * `NormalIntRange(30, 50)` damage lands with the `StoneOfAggression`
	 * half-damage rule (same shape as `rollDamage`'s branch in
	 * `simulation/combat.ts`: half for a marked boss/miniboss from a
	 * same-alignment attacker, half again for Yog-Dzewa) and kills. Flammable-
	 * terrain destruction has no primitive at any mob site (same stated gap as
	 * the bomb sites).
	 */
	resolveEyeBeamMobHit(this: DungeonScene, monster: Creature, victim: Creature): void {
		let dmg = Math.max(0, Random.normalRange(30, 50));
		if (victim.buffs['aggression'] && (victim.boss || victim.miniboss) && !monster.isHero && !monster.isAlly) {
			dmg *= 0.5;
			if (victim.kind === 'yog') dmg *= 0.5;
		}
		victim.hp -= dmg;
		this.showDamage(victim, dmg);
		if (victim.hp <= 0) this.kill(victim);
	},

	/** `RipperDemon.Hunting.act()`'s leap trigger (`RipperDemon.java`, tag `v3.3.8`): off
 * cooldown, enemy in FOV, unrooted and at least 3 cells away, the ripper arms its landing
 * cell instead of moving. The landing prediction (far side of a moved enemy, direct aim
 * otherwise) and the gate live in `simulation/ripperLeap`; the ray fallback below -
 * aim near the hero, then directly at them - is Java's own two-try sequence. Costs one
 * turn (`pendingMonsterTurnCost`): Java spends `gate(TICK, enemy.cooldown(), 3*TICK)`,
 * scaled by the victim's own speed, but the port hero always acts on whole turns, so the
 * 1-3 tick window collapses to the base tick (stated, not silent). The warning line is
 * Java's real `leap` message; the red `TargetedCell` marker and `leapPrep` crouch have no
 * cell-overlay primitive here, so the log line stands in for all three (the same skip the
 * eye charge and sentry warmup already document). `Dungeon.hero.interrupt()` has no
 * analogue either - hero turns are synchronous, there is no channel to cancel.
 * The single wandering-to-hunting transition turn Java skips its enemy-cell update
 * on is not reproduced: the pre-turn hook rotates every turn, which matches Java's steady
 * state on all other turns. */
/** `Succubus.getCloser()` (`Succubus.java`, tag `v3.3.8`): while hunting, a succubus
 * that sees the hero more than 2 cells away, off cooldown and unrooted blinks to them
 * instead of stepping. Returns true when the turn is consumed (a blink, attempted or
 * landed, never falls through to the shared mover); false takes the ordinary approach
 * and ticks the cooldown down - Java decrements only in that else branch, never on
 * adjacent-attack, wandering or blink-attempt turns, which is why the tick lives here
 * rather than in a pre-turn hook. A failed blink wastes the turn (`getCloser` false ->
 * `spend(TICK)`); a landed one is free (`spend(-1/speed())` nets against the act's own
 * spend, hence the zero turn cost - zero is an established scheduler cost, what the
 * TimeBubble owner pays every turn). Relocation reuses the golem teleport's
 * move-plus-`playTeleportAppear` pair; Java's own `ScrollOfTeleportation.appear` sound
 * and particles arrive through that same presentation helper, and blink carries no log
 * line on either side. Two map halves have no port-side primitive: the `avoid`-cell
 * reroute (no avoid map exists here) and the `LARGE` open-space check (she is not
 * large). The landing additionally requires a passable cell where Java only reroutes
 * off `avoid` - her FOV gate makes a wall landing unreachable in practice (opaque walls
 * block the sight the attempt needs), so the guard only ever fires where Java would
 * have embedded her; stated, not silent. Like every other mover here the aim is the
 * hero even when charmed (the port's hero-directed movement model, not a new choice). */
	trySuccubusBlink(this: DungeonScene, monster: Creature, distance: number): boolean {
		if (!shouldSuccubusBlink({
			cooldown: monster.blinkCooldown ?? 0,
			seesHero: monster.seesHero === true,
			rooted: monster.buffs['roots'] !== undefined,
			fleeing: monster.fleeing === true,
			distance,
		})) {
			monster.blinkCooldown = (monster.blinkCooldown ?? 0) - 1;
			return false;
		}
		const ray = traceRayToTarget(this.level, monster, this.hero, (x, y) => this.creatureAt(x, y));
		const landing = chooseSuccubusBlinkCell(ray, (cell) =>
			this.level.passable(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y), simulationRandom,
			(cell) => this.creatureAt(cell.x, cell.y) !== null, monster);
		monster.blinkCooldown = succubusBlinkCooldown(simulationRandom);
		if (!landing) return true;
		const from = { x: monster.x, y: monster.y };
		this.moveTo(monster, landing);
		this.playTeleportAppear(from, landing, monster);
		this.pendingMonsterTurnCost = 0;
		return true;
	},

	takeRipperLeapTrigger(this: DungeonScene, monster: Creature, distance: number): boolean {
		if (!canRipperLeap({
			cooldown: monster.leapCooldown ?? 0,
			seesHero: monster.seesHero === true,
			rooted: monster.buffs['roots'] !== undefined,
			distance,
		})) return false;
		let aim = predictRipperLeapTarget(this.hero, monster.leapPrevEnemy);
		let landing = this.traceRipperLeap(monster, aim);
		if ((!landing || landing.x !== aim.x || landing.y !== aim.y)
			&& (aim.x !== this.hero.x || aim.y !== this.hero.y)) {
			aim = { x: this.hero.x, y: this.hero.y };
			landing = this.traceRipperLeap(monster, aim);
		}
		if (!landing || landing.x !== aim.x || landing.y !== aim.y) return false;
		monster.leapTarget = { ...aim };
		this.pendingMonsterTurnCost = 1;
		if (this.fov.isVisible(monster.x, monster.y) || this.fov.isVisible(aim.x, aim.y)) {
			this.say(t('port.log.ripperleap'), 'negative');
		}
		return true;
	},

/** The leap ray's collision cell: MWG stops before impassable cells where Java's
 * `STOP_SOLID` ray only stops at solid ones, so a leap across a chasm truncates at its
 * edge here instead of clearing it (stated - the only terrain divergence; walls and
 * closed doors stop both). The stopping cell is retained, matching `collisionPos`. */
	traceRipperLeap(this: DungeonScene, monster: Creature, aim: Step): Step | null {
		const cells = traceRayToTarget(this.level, monster, aim, (x, y) => this.creatureAt(x, y));
		return cells.length > 0 ? cells[cells.length - 1]! : null;
	},

/** `RipperDemon.Hunting.act()`'s leap execution: the armed landing fires on the next
 * turn even adjacent (it precedes the attack branch, which is why this lives in the
 * whole-turn overrides rather than the ranged table). The cooldown resets to
 * `NormalIntRange(2, 4)` first - even when rooted or boxed in, exactly like Java - a
 * newly-rooted ripper stands down, the ray re-traces from the live position, and an
 * occupied landing bounces to the nearest free neighbour or aborts. The pounce hits
 * only hero/ally victims (the port's hero-only combat model: a leap onto another mob
 * still bounces, but there is no mob-vs-mob damage here, matching every other ranged
 * override's documented reduction). Java's sprite jump and push-aside have no motion
 * primitive here, so the relocation is instant; the hit itself resolves through the
 * shared attack choke below. */
	executeRipperLeap(this: DungeonScene, monster: Creature): boolean {
		const target = monster.leapTarget;
		if (!target) return false;
		if (monster.buffs['paralysis'] !== undefined || monster.buffs['frost'] !== undefined
			|| monster.buffs['feintConfusion'] !== undefined || monster.sleeping === true
			|| monster.buffs['terror'] !== undefined || monster.fleeing) return false;
		monster.leapCooldown = ripperLeapCooldown(simulationRandom);
		if (monster.buffs['roots'] !== undefined) {
			monster.leapTarget = null;
			return true;
		}
		const landing = this.traceRipperLeap(monster, target);
		if (!landing) {
			monster.leapTarget = null;
			return true;
		}
		const victim = this.creatureAt(landing.x, landing.y);
		let end: Step = landing;
		if (victim && victim !== monster && victim.hp > 0) {
			const bounce = chooseRipperBounceEnd(monster, landing, (cell) =>
				this.level.passable(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y),
				//Java's second sweep is free + non-solid (not necessarily passable), catching
				//cells like shallow chasm edges that the passable-only first pass rejects.
				(cell) => this.level.get(cell.x, cell.y) !== SOLID && !this.creatureAt(cell.x, cell.y));
			if (!bounce) {
				monster.leapTarget = null;
				return true;
			}
			end = bounce;
		}
		faceCharacter(this.sprite(monster), monster.x, end.x);
		this.moveTo(monster, end);
		monster.leapTarget = null;
		if (victim && victim !== monster && victim.hp > 0 && (victim.isHero || victim.isAlly)) {
			this.resolveRipperPounce(monster, victim);
		}
		return true;
	},

/** The pounce impact: `hit(this, leapVictim, INFINITE_ACCURACY, false)` through the
 * shared resolver (`force` is its infinite-accuracy channel, `magic = false` keeps the
 * melee armor path Java's `attack()` applies), presented like any landed melee hit,
 * then `Bleeding` at 0.75x a *fresh* damage roll - not the dealt damage - via the
 * shared keep-strongest setter. A miss (only reachable through infinite-evasion
 * carriers) reads the dodge line, as Java's `showStatus` + miss sound does. */
	resolveRipperPounce(this: DungeonScene, monster: Creature, victim: Creature): void {
		const roll = runAttackResolution(monster, victim, simulationRandom, false, true, 1, 1);
		const subject = capitalize(monster.name);
		const object = victim.isHero ? t('port.log.object.you') : victim.name;
		if (!roll.hit) {
			runState.audio.cue('miss', 0.55);
			victim.sleeping = false;
			this.say(t(victim.isHero ? 'port.log.misshero' : 'port.log.miss', { subject, object }), 'negative');
			return;
		}
		const damage = victim.isHero ? this.absorbHeroDamage(roll.damage) : roll.damage;
		victim.hp -= damage;
		this.showDamage(victim, damage);
		victim.sleeping = false;
		this.sprite(victim).setColorAdd(1, 1, 1);
		runState.audio.cue('hit', 0.6);
		this.say(
			t('port.log.hit', { subject, verb: t('port.log.verb.hit'), object, damage }),
			victim.isHero ? 'negative' : 'info',
		);
		const [min, max] = liveStats(monster).damage;
		setBleeding(victim, 0.75 * Random.normalRange(min, max));
		this.mobOnHit(monster, victim, damage);
		if (victim.hp <= 0) this.kill(victim);
	},

	eyeBeamTurn(this: DungeonScene, monster: Creature): boolean {
		if ((monster.beamCooldown ?? 0) > 0) monster.beamCooldown = (monster.beamCooldown ?? 0) - 1;
		if (monster.beamCharged) {
			monster.beamCharged = false;
			monster.beamCooldown = 4 + Random.int(3);
			delete monster.buffs['invisibility'];
			//`Eye.deathGaze()` (`Eye.java`, tag `v3.3.8`): the beam strikes every
			//char along its line (`beam.subPath(1, beam.dist)`), not just the hero
			//it aimed at - hero, ally or enemy alike, each with the real magic hit
			//roll. Non-hero victims resolve inline and `continue`; the hero's own
			//body below is untouched. Like Java (which fires the stored beam
			//unconditionally once charged), there is no fire-time range/LOS
			//recheck - only the charge itself required `canTarget`.
			for (const cell of Roguelike.traceLine(monster, this.hero).slice(1)) {
				const victim = cell.x === this.hero.x && cell.y === this.hero.y
					? this.hero
					: this.creatureAt(cell.x, cell.y);
				if (!victim || victim === monster || victim.hp <= 0) continue;
				if (!victim.isHero) {
					if (rollHit(monster, victim, true)) this.resolveEyeBeamMobHit(monster, victim);
					continue;
				}
				if (!rollHit(monster, this.hero, true)) {
					this.say(t('port.log.eyegazemisses'), 'negative');
				} else {
					const dmg = this.absorbHeroDamage(Random.normalRange(30, 50), true);
					this.hero.hp -= dmg;
					this.showDamage(this.hero, dmg);
					this.say(t('port.log.eyegaze'), 'negative');
					if (this.hero.hp <= 0) this.kill(this.hero);
				}
			}
			return true;
		}
		if ((monster.beamCooldown ?? 0) <= 0 && Roguelike.canTarget(this.level, monster, this.hero, { range: 8 })) {
			monster.beamCharged = true;
			this.pendingMonsterTurnCost = 2;
			this.say(t('port.log.eyecharge'), 'negative');
			return true;
		}
		return false;
	},

	/** a magic bolt that never misses its roll the melee way - hit(accMulti 2), then damage.
	 *
	 * The damage is applied **unreduced by armor**, which is what Java does for every bolt that
	 * reuses this helper: `DM100.zap()` (`DM100.java`: `enemy.damage(dmg, new LightningBolt())`),
	 * `Shaman.zap()` (`new EarthenBolt()`), `Warlock.zap()` (`new DarkBolt()`) and the
	 * Necromancer's blocked-summon hit (`new SummoningBlockDamage()`) all call `Char.damage()`
	 * directly. That method subtracts *no* DR - its own comment says so ("if dmg is from a
	 * character we already reduced it in Char.attack", `Char.java` 851) - so DR is an
	 * `attack()`-only step and these bolts ignore it. This helper used to subtract the target's
	 * armor roll anyway, which made every zap weaker than Java's against any armored target
	 * (a 12-18 DarkBolt became 2-8 against 10 armor); the `eyeBeamTurn` note that called this
	 * helper "subtracting armor unlike Java" was the misreading that kept it there. */
	zapHero(this: DungeonScene, monster: Creature, damage: [number, number]): void {
		const target = this.rangedTarget(monster, 8);
		if (!target) return;
		if (!rollHit(monster, target, true)) {
			this.say(t('port.log.boltmisses', { who: capitalize(monster.name) }), 'negative');
			return;
		}
		let dmg = Math.max(0, Random.normalRange(damage[0], damage[1]));
		if (target.isHero) dmg = this.absorbHeroDamage(dmg, true);
		target.hp -= dmg;
		this.showDamage(target, dmg);
		this.sprite(target).setColorAdd(0.6, 0.7, 1);
		this.say(t('port.log.bolthits', { who: capitalize(monster.name), damage: dmg }), 'negative');
		this.spawnProjectile(monster, target);
		//Shaman.zap() (Shaman.java, tag v3.3.8): on a landed magic bolt, the
		//colour-specific debuff is applied on a 1-in-2 roll. The compact port keeps
		//the subtype on the shared Shaman actor and reuses its existing timed buffs.
		if (monster.kind === 'shaman' && Random.int(0, 2) === 0) {
			if (monster.shamanType === 'red') addBuff(target, 'weakness');
			else if (monster.shamanType === 'blue') addBuff(target, 'vulnerable');
			else addBuff(target, 'hex');
		}
		//Warlock DarkBolt: a LANDED ranged zap applies the Degrade buff half the time
		//(`Random.Int(2) == 0`, melee never does) - previously a 25% permanent weapon-level
		//decrement on any warlock hit, wrong trigger and wrong effect both. The buff only
		//reduces EFFECTIVE levels (see `degradedLevel`); true levels are untouched, so no
		//decrement happens here at all. No DEGRADE sound cue exists to play.
		if (monster.kind === 'warlock' && target.isHero && target.hp > 0 && Random.int(0, 2) === 0) {
			addBuff(target, 'degrade');
			this.syncHeroFromStats();
			this.say(t('port.log.degrade'), 'negative');
		}
		if (target.hp <= 0) this.kill(target);
	},

	/**
	 * `Wraith.spawnAt()` (`actors/mobs/Wraith.java`, tag `v3.3.8`): materialize a wraith at
	 * the cell, falling back to a random free NEIGHBOURS8 cell when the cell itself is taken,
	 * else nothing. Stats come from `adjustStats(scalingDepth())` - this port's `depth`
	 * substitutes for `scalingDepth()` the way every other depth-scaled formula here does -
	 * and the wraith arrives HUNTING (`seesHero`, awake) with Java's 2-turn materialization
	 * delay (`SPAWN_DELAY`). The fade-in/particles have no layer here (stated, the same skip
	 * every mid-run summon carries); the exotic `TormentedSpirit` 1/100 roll is not rolled -
	 * every caller here passes an explicit class, and all four generic callers (haunted heaps,
	 * `DistortionTrap`, the Cleric spell, soul-marked deaths) belong to unported systems.
	 */
	spawnWraithAt(this: DungeonScene, kind: 'wraith' | 'dustWraith', x: number, y: number): Creature | null {
		let at: { x: number; y: number } | null = null;
		if (this.level.passable(x, y) && !this.creatureAt(x, y)) at = { x, y };
		else {
			const candidates: { x: number; y: number }[] = [];
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const cell = { x: x + dx, y: y + dy };
				if (this.level.passable(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y)) candidates.push(cell);
			}
			at = Random.element(candidates) ?? null;
		}
		if (!at) return null;
		const wraith = this.spawnMonster(kind, at);
		const stats = wraithCombatStats(this.depth);
		wraith.wraithLevel = this.depth;
		wraith.accuracy = stats.accuracy;
		wraith.evasion = stats.evasion;
		wraith.damage = [stats.damageMin, stats.damageMax];
		wraith.hp = wraith.maxHp = 1;
		wraith.sleeping = false;
		wraith.seesHero = true;
		wraith.lastSeen = { x: this.hero.x, y: this.hero.y };
		this.scheduler.remove(wraith);
		this.scheduler.add(wraith, 2);
		return wraith;
	},

	/** Necromancer.summonMinion (`Necromancer.java`): a NecroSkeleton beside the hero.
	 * Real Java splits this across two turns (turn A picks `summoningPos` - the unoccupied,
	 * passable, reachable, in-sight hero-neighbour minimizing `trueDistance` to the necro - and
	 * spends `firstSummon ? TICK : 2*TICK`; turn B summons there), but the placement, push-aside,
	 * and blocker-damage rules below are all real, collapsed into the single turn this port's
	 * `necromancerRangedTurn` already spends on a summon. `trueDistance` is Euclidean, so these
	 * selections use `Math.hypot`, not the Chebyshev ruler used elsewhere here.
	 * Deliberate simplifications: no one-turn telegraph (no `summoning` sprite state exists);
	 * no reachability/FOV gating on the pick (passable + unoccupied only); the LARGE/`openSpace`
	 * gate on push targets is vacuous (no LARGE kinds exist here); the Pushing visual is a log
	 * line. Notably NOT simplified anymore: the old "push-aside needs a full knockback system"
	 * claim was wrong - checked against the source, the rule is just an 8-neighbour search
	 * maximizing distance from the necro, needing no framework primitive at all (and
	 * `Roguelike.knockbackPath`'s straight-line shove would not have matched its
	 * direction-choice logic anyway). Real Java's own turn cost is `firstSummon ? TICK :
	 * 2*TICK` - the very first summon this necromancer ever makes costs the normal 1, every
	 * one after that costs double. */
	summonSkeleton(this: DungeonScene, necro: Creature): void {
		const summonAt = (at: { x: number; y: number }): void => {
			const skel = this.spawnMonster('necroSkeleton', at);
			skel.sleeping = false;
			necro.skeleton = skel;
			this.pendingMonsterTurnCost = necro.firstSummon === false ? 2 : 1;
			necro.firstSummon = false;
			this.say(t('port.log.summonskeleton'), 'warning');
		};
		//Turn-A pick: unoccupied + passable hero-neighbour minimizing distance to the necro.
		let summoningPos: { x: number; y: number } | null = null;
		let best = Infinity;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.passable(at.x, at.y) || this.isChasmCell(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const d = Math.hypot(necro.x - at.x, necro.y - at.y);
			if (d < best) {
				best = d;
				summoningPos = at;
			}
		}
		if (summoningPos) {
			summonAt(summoningPos);
			return;
		}
		//No free cell: Java's turn-B logic on the nearest passable neighbour even when occupied.
		let target: { x: number; y: number } | null = null;
		best = Infinity;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.passable(at.x, at.y)) continue;
			const d = Math.hypot(necro.x - at.x, necro.y - at.y);
			if (d < best) {
				best = d;
				target = at;
			}
		}
		//Nowhere passable at all: Java's turn-A wait (spend the turn placing nothing).
		if (!target) return;
		const occupant = this.creatureAt(target.x, target.y);
		if (!occupant) {
			summonAt(target);
			return;
		}
		//Push-aside search: free + passable neighbours of the intended cell maximizing
		//distance from the necro (farthest first, ties keep the first enumerated).
		let pushPos: { x: number; y: number } | null = null;
		let pushBest = Math.hypot(necro.x - target.x, necro.y - target.y);
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: target.x + dx, y: target.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const d = Math.hypot(necro.x - at.x, necro.y - at.y);
			if (d > pushBest) {
				pushBest = d;
				pushPos = at;
			}
		}
		if (pushPos) {
			//Immovable occupants are never shoved - the skeleton takes the freed cell instead
			//(`kind` is absent on the hero, who is always pushable, like any ordinary mob).
			if (occupant.kind !== undefined && IMMOVABLE_KINDS.has(occupant.kind)) {
				summonAt(pushPos);
				return;
			}
			this.moveTo(occupant, pushPos);
			this.say(
				t(occupant.isHero ? 'port.log.necropushhero' : 'port.log.necropush', {
					who: capitalize(occupant.name),
				}),
				'warning'
			);
			summonAt(target);
			return;
		}
		//No valid push: `SummoningBlockDamage` - a direct NormalIntRange(2, 10) hit on the
		//blocker with no hit roll (Java calls blocker.damage() straight, never a bolt attack),
		//then wait. Corrected in the same pass: the old fallback fired the generic
		//`zapHero` bolt here, whose magic hit roll could miss and whose armor handling belongs
		//to bolts - and it fired even when no cell was passable at all, where Java waits.
		const raw = Random.normalRange(2, 10);
		if (occupant.isHero) {
			const dmg = this.absorbHeroDamage(raw);
			this.hero.hp -= dmg;
			this.showDamage(this.hero, dmg);
			this.say(t('port.log.necroblockdamagehero', { damage: dmg }), 'negative');
			if (this.hero.hp <= 0) this.kill(this.hero);
		} else {
			//A monster blocker takes the raw roll: the hero's shield pool must not absorb a
			//hit that never targeted the hero (Java runs this through the blocker's own DR;
			//this port tracks no per-monster armor outside the attack pipeline, so no reduction).
			occupant.hp -= raw;
			this.showDamage(occupant, raw);
			this.say(t('port.log.necroblockdamage', { who: capitalize(occupant.name), damage: raw }), 'warning');
			if (occupant.hp <= 0) this.kill(occupant);
		}
	},

	/** `Elemental.doAttack()`/the four `rangedProc()` implementations (tag `v3.3.8`).
	 * Elementals use a magic bolt outside melee, and the bolt **deals no direct damage at all**:
	 * `Elemental.zap()` is just `hit(this, enemy, true)` -> `rangedProc(enemy)`, and every
	 * `rangedProc` is a pure status application - `FireElemental` reignites Burning (unless the
	 * target stands in water), `FrostElemental` calls `Freezing.freeze`, `ShockElemental` applies
	 * `Blindness.DURATION/2f`, and `ChaosElemental` delegates to a cursed-wand effect. This port
	 * used to roll `NormalIntRange(20, 25)` on top of the status, damage real Java never deals -
	 * an Elemental's threat at range is the status, not a hit. The shared port has no Blindness
	 * or cursed-wand subsystem, so Shock uses Daze and Chaos uses one existing harmful status as
	 * explicit stand-ins; Fire/Frost use the existing fire/chill/frost primitives. No explicit hit
	 * message is logged, matching Java (only the sprite zap and the buff's own announcement).
	 *
	 * `ShockElemental.meleeProc`'s electric arc is modelled in `combatResolution` (not
	 * here): `planShockElementalArc` reproduces Java's `Shocking.arc` radius/order and
	 * each hit lands armor-piercing via `ch.damage(round(dmg*0.4))`. Not modelled here:
	 * the Chaos cursed-wand table. */
	elementalRangedTurn(this: DungeonScene, monster: Creature): boolean {
		const target = this.rangedTarget(monster, 5);
		if (!target) return false;
		if (!rollHit(monster, target, true)) {
			this.say(t('port.log.boltmisses', { who: capitalize(monster.name) }), 'negative');
			return true;
		}
		this.spawnProjectile(monster, target);
		const type = monster.elementalType ?? 'fire';
		//`FireElemental.rangedProc()` (`Elemental.java`, tag `v3.3.8`) reignites
		//Burning with an explicit 4, not the table-default 8.
		if (type === 'fire' && this.level.get(target.x, target.y) !== WATER) reigniteBuff(target, 'burning', 4);
		else if (type === 'frost') {
			target.buffs = applyChillFreeze(target.buffs).buffs;
		} else if (type === 'shock') addBuff(target, 'daze');
		else addBuff(target, Random.element(['burning', 'chill', 'cripple', 'daze'] as const) ?? 'daze');
		return true;
	},

	/** `Elemental.NewbornFireElemental`'s telegraphed fireball (`Elemental.java`, checked
	 * against tag `v3.3.8`): while off cooldown it aims at a random free sight-line cell
	 * beside the hero (never its own cell), charges a turn with the real `charging` line,
	 * then detonates a 3x3 blast there - `Fire` seeded at 8 per cell (2 over water, Java's
	 * own volumes) plus `Burning.reignite` on every char caught except itself. Cooldown
	 * re-rolls `3-5` after each blast (and starts there, set at ritual spawn). Melee is the
	 * ordinary shared attack with the newborn's own `[10,12]`/acc-15 stats and no fiery
	 * on-hit (`meleeProc` is a no-op unless ally-summoned, which never happens here).
	 * **Three of the simplifications this row used to carry are now closed (2026-09-16):** the
	 * `TargetedCell` telegraph is drawn (`refreshTargetedCellsOverlay`, a red 3x3 over the cells the
	 * blast will cover); the charge's cost is Java's own `GameMath.gate(attackDelay(), ceil(hero.
	 * cooldown()), 3*attackDelay())`, expressed through `pendingMonsterTurnCost` - in units of the
	 * mob's own attack delay that is `clamp(1, ceil(heroAttackCost), 3)`, and the newborn carries no
	 * speed buff, so its `attackDelay()` is 1 there; and the cooldown ticks on *every* turn while
	 * hunting, adjacent melee turns included (the decrement now sits in the per-turn pre-dispatch
	 * beside the golem cooldowns, matching `Elemental.act()`'s `if (state == HUNTING) rangedCooldown--`).
	 * What remains: no zap *animation* (Java's `sprite.zap()`/`zap()` pair, and this port has no
	 * per-sprite zap art for it), no quest-score/music side effects on spawn or death (neither system
	 * exists), and the elemental's own `FIERY` immunity lives at its own call site, shared with the
	 * base elemental. */
	newbornElementalTurn(this: DungeonScene, monster: Creature): boolean {
		const pending = monster.newbornTarget;
		if (pending) {
			monster.newbornTarget = null;
			//the telegraph's own red 3x3 goes with the pending target, whether or not the blast
			//still finds a line to it (Java's markers live on the discarded sprite either way)
			this.refreshTargetedCellsOverlay();
			if (Roguelike.canTarget(this.level, monster, pending, { range: 8 })) {
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const at = { x: pending.x + dx, y: pending.y + dy };
						if (!this.level.inside(at.x, at.y)) continue;
						this.fire.seed(at.x, at.y, this.level.get(at.x, at.y) === WATER ? 2 : 8);
					}
				}
				//`this.creatures` includes the hero (skipped explicitly, like the ignite
				//loops in `spreadFire`), so no separate hero pass is needed or wanted here.
				for (const target of this.creatures) {
					if (target === monster || target.hp <= 0 || target.isNPC) continue;
					if (target.kind === 'elemental' || target.kind === 'newbornElemental') continue;
					if (Math.abs(target.x - pending.x) > 1 || Math.abs(target.y - pending.y) > 1) continue;
					if (target.buffs['burning']) continue;
					addBuff(target, 'burning');
					if (target.isHero) this.say(t('port.log.firecatches'), 'negative');
				}
			}
			monster.rangedCooldown = Random.normalRange(3, 5);
			return true;
		}
		if ((monster.rangedCooldown ?? 0) > 0) return false;
		if (!Roguelike.canTarget(this.level, monster, this.hero, { range: 8 })) return false;
		const candidates = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
			.filter((at) => !(at.x === monster.x && at.y === monster.y)
				&& Roguelike.canTarget(this.level, monster, at, { range: 8 }));
		if (candidates.length === 0) {
			monster.rangedCooldown = 1;
			return false;
		}
		monster.newbornTarget = Random.element(candidates)!;
		this.say(t('port.log.newborncharging'), 'negative');
		this.refreshTargetedCellsOverlay();
		//Java's charge spends `GameMath.gate(attackDelay(), ceil(hero.cooldown()), 3*attackDelay())`.
		//In units of the mob's own attack delay - which is what one turn costs here, and the newborn
		//carries no speed buff - that is `clamp(1, ceil(hero cost), 3)`; the hero's own current action
		//cost is `getAttackTurnCostMod()` (see its own row).
		this.pendingMonsterTurnCost = Math.min(3, Math.max(1, Math.ceil(this.getAttackTurnCostMod())));
		return true;
	},

	/** `NewbornFireElemental.doAttack()`'s telegraph, drawn from `doAttack`'s own loop:
	 *  `for (int i : NEIGHBOURS9) if (!solid[targetingPos + i]) addToBack(new TargetedCell(cell,
	 *  0xFF0000))` - a red-tinted cell per non-solid square of the 3x3 the blast will cover. Java
	 *  tints the cell art itself; this draws a translucent red square per cell on the overlay the
	 *  aim preview uses, which sits under the actors exactly as `addToBack` does.
	 *  Port-original accessibility work (ROADMAP.md section 8 - Java's own tint is this exact
	 *  red, so there is no source to diverge from, only this port's own `settings.colorblind()`
	 *  swap): under `colorblind()` this substitutes the same Okabe-Ito vermillion
	 *  `SPD_STATUS_COLOR.negative` already uses, which still reads as "danger" but stays
	 *  distinguishable from the bluish-green "safe" tones the rest of that palette uses,
	 *  unlike pure red under red-green colorblindness. */
	refreshTargetedCellsOverlay(this: DungeonScene): void {
		const overlay = this.targetedCells;
		if (!overlay) return;
		overlay.clear();
		const pending = this.creatures.find((c) => c.kind === 'newbornElemental' && c.newbornTarget)?.newbornTarget;
		if (!pending) return;
		const color = colorblind() ? 0xd55e00 : 0xff0000;
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const at = { x: pending.x + dx, y: pending.y + dy };
				if (!this.level.inside(at.x, at.y) || !this.level.passable(at.x, at.y)) continue;
				overlay.rect(at.x * TILE, at.y * TILE, TILE, TILE).fill({ color, alpha: 0.3 });
			}
		}
	},

	/** Guard.chain: drag one cell closer through a clear path, then Cripple - once per Guard, ever */
	chainHero(this: DungeonScene, guard: Creature): void {
		guard.chainUsed = true;
		const dx = Math.sign(this.hero.x - guard.x);
		const dy = Math.sign(this.hero.y - guard.y);
		const at = { x: this.hero.x - dx, y: this.hero.y - dy };
 			if ((dx !== 0 || dy !== 0) && this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)) {
 				this.moveTo(this.hero, at);
 			}
 			//`Guard.pullEnemy`: `Cripple.prolong(enemy, Cripple.class, 4f)` - an explicit 4,
		//not the table's whole 10, keep-max exactly like Java's `prolong`.
			reigniteBuff(this.hero, 'cripple', 4);
		this.say(t('port.log.chain'), 'negative');
	},

	/** DM200.zap(): toxic gas seeded along the line to the hero (20/cell), 100 at the far end.
	 *  **Found and fixed 2026-09-16: this seeded `plantGas`, whose effect is `poison`, instead
	 *  of `toxicGas`, whose effect is Java's direct damage** - every vent used to poison the
	 *  hero rather than burn through HP the way `ToxicGas` does. Amounts were already Java's. */
	ventDM200(this: DungeonScene, monster: Creature): void {
		monster.ventCooldown = 30;
		const line = Roguelike.traceLine(monster, this.hero);
		for (let i = 0; i < line.length - 1; i++) this.toxicGas.seed(line[i].x, line[i].y, 20);
		const last = line[line.length - 1]!;
		this.toxicGas.seed(last.x, last.y, 100);
		//`DM200.java`'s own `canVent`/vent code has no log line at all (the gas cloud itself is
		//the only real feedback); this port adds one for clarity, so it should at least name the
		//actual venting creature - previously hardcoded "DM-200" even when DM201 vented.
		this.say(t('port.log.dm200vent', { who: capitalize(monster.name) }), 'negative');
	},

	/**
	 * `Mob.Fleeing.nowhereToRun()` (`Mob.java`, tag `v3.3.8`): enemies turn and fight
	 * when they have nowhere to run and are not Terror/Dread-afflicted - HUNTING with the
	 * `Mob.rage` status line while the enemy is seen, WANDERING otherwise. Dread has no
	 * system here, so Terror alone holds the mob fleeing (stated, not silent). Clearing
	 * the fleeing flag hands the next turn back to the ordinary hunt/wander dispatch,
	 * which is this port's standing equivalent of Java's state flip.
	 */
	recoverFleeing(this: DungeonScene, monster: Creature): void {
		if (monster.buffs['terror'] !== undefined) return;
		monster.fleeing = false;
		if (monster.seesHero) this.say(t('actors.mobs.mob.rage'), 'warning');
		else monster.patrolTarget = undefined;
	},

	/**
	 * The farthest-open-neighbour step (`Hunting.getFurther` shape) lives in
	 * `simulation/wandering.ts` as `fleeStep` - the file-size refactor's
	 * forty-second extraction, behavior-identical. `stepAway` and
	 * `fleeCrystalMimic` were line-for-line duplicates apart from their tails;
	 * the scene only binds its level, occupants, geometry and hero below.
	 */
	fleeStepContext(this: DungeonScene): FleeStepContext {
		return {
			passable: (x, y) => this.level.passable(x, y),
			creatureAt: (x, y) => this.creatureAt(x, y),
			neighbourOffsets: Roguelike.neighbourOffsets(8),
			chebyshev: (a, b) => Roguelike.chebyshevDistance(a, b),
			hero: { x: this.hero.x, y: this.hero.y },
			isChasm: (x, y) => this.isChasmCell(x, y),
		};
	},

	summonCellContext(this: DungeonScene): SummonCellContext {
		return {
			...this.fleeStepContext(),
			inside: (x, y) => this.level.inside(x, y),
		};
	},

	/** GnollTrickster adjacent: never melees - steps further away instead (Hunting.getFurther) */
	stepAway(this: DungeonScene, monster: Creature): void {
		//GnollTrickster.getCloser(): "if he's moving, he isn't attacking, reset combo."
		if (monster.kind === 'gnollTrickster') monster.combo = 0;
		const best = fleeStepFlow({ x: monster.x, y: monster.y }, this.fleeStepContext());
		if (best) this.stepMonster(monster, best);
	},

	/** CrystalMimic.Fleeing: after revealing/attacking, run to the farthest open neighbour. */
	fleeCrystalMimic(this: DungeonScene, monster: Creature): boolean {
		const best = fleeStepFlow({ x: monster.x, y: monster.y }, this.fleeStepContext());
		if (best) {
			this.stepMonster(monster, best);
			return true;
		}
		return false;
	},

	/**
	 * A base `Mimic`'s two faces (`Mimic.name()`/`description()`/`MimicSprite.hideMimic()`): while hidden
	 * (`mimicRevealed === false`) it is named "Chest" and drawn as the chest frame; revealed, it is the
	 * monster. Runs at spawn, on load and on reveal so the three can never disagree.
	 */
	syncMimicVisual(this: DungeonScene, monster: Creature): void {
		if (monster.kind !== 'mimic') return;
		const hidden = monster.mimicRevealed === false;
		monster.name = hidden ? t('items.heap.chest') : t('actors.mobs.mimic.name');
		const sheet = SpriteSheet.fromTexture(runState.sprites.mimic, 16, 16);
		this.sprite(monster).texture = sheet.get(hidden ? 0 : 3);
	},

	/** `Mimic.stopHiding()` (tag v3.3.8): the chest drops its disguise and goes hunting. Alignment
	 * flips to ENEMY with it. Not ported: the star burst and the mimic sound. */
	revealMimic(this: DungeonScene, monster: Creature): void {
		if (monster.kind !== 'mimic' || monster.mimicRevealed !== false) return;
		monster.mimicRevealed = true;
		monster.sleeping = false;
		monster.seesHero = true;
		monster.lastSeen = { x: this.hero.x, y: this.hero.y };
		this.syncMimicVisual(monster);
		if (this.fov.isVisible(monster.x, monster.y)) this.say(t('actors.mobs.mimic.reveal'), 'warning');
	},

	/** `CrystalMimic.stopHiding()`: neutral chests get two hasted turns when revealed. */
	revealCrystalMimic(this: DungeonScene, monster: Creature): void {
		if (monster.mimicRevealed) return;
		monster.mimicRevealed = true;
		monster.sleeping = false;
		if (!monster.hasteTurns) {
			monster.hasteBaseSpeed = monster.speed ?? 1;
			monster.speed = monster.hasteBaseSpeed * 2;
			monster.hasteTurns = 2;
		}
		this.say(t('port.log.mimicreveals'), 'warning');
	},

	/** CrystalMimic.steal(): the first neutral attack may consume one eligible item from
	 * the unequipped backpack. The compact creature payload carries the item family and
	 * concrete class so death can return the same object rather than a generic substitute. */
	crystalMimicSteal(this: DungeonScene, monster: Creature): void {
		if (monster.stolen || !monster.mimicLoot) return;
		let picked: (typeof this.bag.items)[number] | undefined;
		// Belongings.randomUnequipped() samples the whole backpack, then retries invalid
		// unique/upgraded entries at most ten times. Keep that draw shape in the live bridge.
		for (let tries = 0; tries <= 10; tries++) {
			const candidate = Random.element(this.bag.items);
			if (!candidate) break;
			const unique = ['pickaxe', 'cloak', 'holyTome', 'spiritBow'].includes(candidate.id);
			if (!unique && (candidate.level ?? 0) < 1 && !['gold', 'crystalKey', 'ironKey'].includes(candidate.id)) {
				picked = candidate;
				break;
			}
		}
		if (!picked) {
			monster.stolen = 'none';
			return;
		}
		const sourceClass = (picked as NonNullable<GroundItem['item']>).sourceClass;
		const held = `${picked.id}${sourceClass ? `|${sourceClass}` : ''}`;
		this.bag.remove(picked.id, 1, picked.instanceId);
		monster.stolen = held;
		monster.mimicLoot += `;held:${held}`;
	},

	escapeCrystalMimic(this: DungeonScene, monster: Creature): void {
		const index = this.creatures.indexOf(monster);
		if (index < 0) return;
		this.scheduler.remove(monster);
		this.creatures.splice(index, 1);
		this.monsterMotion.get(this.sprite(monster))?.clear();
		this.monsterMotion.delete(this.sprite(monster));
		this.healthBars.get(monster)?.destroy();
		this.healthBars.delete(monster);
		this.sprite(monster).destroy();
		this.spriteFor.delete(monster.id);
		this.say(t('port.log.mimicescapes'), 'warning');
	},

	/**
	 * Tengu: melee acc 10 adjacent, ranged acc 20 otherwise (the dart half of attackSkill).
	 * Below half HP his ability rotation takes precedence over the attack on any turn it
	 * fires (see `tenguFireAbilityIfReady`); relocation rides the damage hook
	 * (`tenguBracketJump`), not the turn.
	 */
	takeTenguTurn(this: DungeonScene, tengu: Creature): void {
		this.advanceTenguShockers(tengu);
		if (tengu.hp <= 0) return;
		//Tengu.Hunting.act() (tag v3.3.8): `if (canUseAbility()) return useAbility();`
		//sits before `doAttack`, so an ability owns that turn instead of being an extra
		//action on top of a swing. When Tengu cannot attack he tries an ability even unseen
		//and otherwise waits out the turn (`spend(TICK); return true`) - the override never
		//moves, chases, or calls the base unreachable-target handling, so repositioning comes
		//only from bracket jumps. The port therefore checks the ability before both the
		//ranged-dart and melee branches, and waits below when neither can fire.
		if (this.tenguFireAbilityIfReady(tengu)) return;
		const distance = Roguelike.chebyshevDistance(tengu, this.hero);
		if (distance > 1) {
			if (Roguelike.canTarget(this.level, tengu, this.hero, { range: 8 })) {
				this.say(t('port.log.tengudart'), 'negative');
				this.attack({ ...tengu, kind: undefined, accuracy: 20 }, this.hero);
				//Java's `TenguShuriken`: a `MissileSprite` with shuriken art at 2160 spin.
				this.spawnProjectile(tengu, this.hero, missileFlightArt('Shuriken'));
			}
			//else: Java waits here (see above) - no chase step, the turn simply ends.
		} else {
			this.attack(tengu, this.hero);
		}
	},

	/** `Tengu.canUseAbility()` (tag v3.3.8): phase 2 only, and bounded by
	 * `targetAbilityUses()` - unlike a free-running rotation, Tengu runs out of casts until
	 * another arena jump raises the budget. The cadence itself lives in the pure
	 * `simulation/tenguAbility.ts` module (verified by `tools/verifySimulation.mjs`); this
	 * method only wires it to the scene's persisted fields and to `Random`. The catch-up
	 * rules pull a lagging Tengu back onto the Java schedule: 4+ behind casts immediately
	 * (or, on the bosses challenge, with no delay at all), 3 behind casts every other turn,
	 * and otherwise the real `Random.IntRange(1, 4)` gap applies. Returns true when the
	 * ability fired and therefore owns the turn. */
	tenguFireAbilityIfReady(this: DungeonScene, tengu: Creature): boolean {
		const stronger = isChallengeEnabled('stronger_bosses');
		const step = stepTenguAbility(
			{
				hp: tengu.hp,
				maxHp: tengu.maxHp,
				cooldown: tengu.tenguAbilityCd ?? 2,
				used: tengu.tenguAbilityUses ?? 0,
				arenaJumps: tengu.arenaJumps ?? 0,
				strongerBosses: stronger,
			},
			() => Random.range(1, 4),
		);
		tengu.tenguAbilityCd = step.cooldown;
		if (!step.ready) return false;
		this.tenguUseAbility(tengu, stronger, step.behind);
		return true;
	},

	/** `Tengu.useAbility()`: the first two phase-2 casts are scripted Bomb then Shocker;
	 * later casts roll randomly (the bosses challenge excludes Fire from the roll, then adds
	 * a guaranteed Fire cast after any non-Fire ability). A roll matching the previous
	 * ability is rerolled 9 times in 10. Bomb/Shocker falling through on their scripted
	 * first/second use falls back to Fire, exactly as Java does. Java's own loop is
	 * unbounded on the assumption that some ability always succeeds; this port caps the
	 * reroll at 100 attempts as a defensive guard and, in the pathological case where none
	 * lands, spends the turn without counting a cast (a stated deviation from a Java hang
	 * that cannot realistically occur). */
	tenguUseAbility(this: DungeonScene, tengu: Creature, stronger: boolean, behind: number): void {
		const used = tengu.tenguAbilityUses ?? 0;
		const last = tengu.tenguLastAbility ?? -1;
		let abilityUsed = false;
		let abilityToUse = -1;
		for (let guard = 0; guard < 100 && !abilityUsed; guard++) {
			if (used === 0) abilityToUse = 0;
			else if (used === 1) abilityToUse = 2;
			else if (stronger) abilityToUse = Random.int(2) * 2;
			else abilityToUse = Random.int(3);
			if (abilityToUse === last && Random.int(10) !== 0) continue;
			if (abilityToUse === 0) {
				abilityUsed = this.tenguThrowBomb(tengu);
				if (used === 0 && !abilityUsed) {
					abilityToUse = 1;
					abilityUsed = this.tenguThrowFire(tengu);
				}
			} else if (abilityToUse === 1) {
				abilityUsed = this.tenguThrowFire(tengu);
			} else {
				abilityUsed = this.tenguThrowShocker(tengu);
				if (used === 1 && !abilityUsed) {
					abilityToUse = 1;
					abilityUsed = this.tenguThrowFire(tengu);
				}
			}
			if (abilityUsed && abilityToUse !== 1 && stronger) this.tenguThrowFire(tengu);
		}
		if (!abilityUsed) return;
		//`Tengu.useAbility()`'s trailing spend (tag v3.3.8): the real cost lives in the pure
		//`tenguAbilityCost` helper. `behind` reads the pre-increment cast count, exactly like
		//Java's `abilitiesUsed`. The port previously always spent the default full turn, so a
		//normal-mode Tengu cast roughly twice as often as Java.
		this.pendingMonsterTurnCost = tenguAbilityCost(stronger, behind);
		tengu.tenguLastAbility = abilityToUse;
		tengu.tenguAbilityUses = used + 1;
	},

	/** Tengu.damage(): HP cannot cross more than one 1/8-bracket (`HT/8`, integer) per hit -
	 * a multi-bracket blow floors at the next bracket +1. Java tracks the bracket
	 * persistently; deriving it from pre-hit HP is equivalent since brackets only move
	 * down. Lethal hits kill normally (phase transitions own death, not the clamp). */
	clampTenguBracket(this: DungeonScene, tengu: Creature, preHp: number): void {
		if (tengu.kind !== 'tengu' || tengu.hp <= 0 || preHp <= 0) return;
		const bracket = Math.max(1, Math.floor(tengu.maxHp / 8));
		if (tengu.hp <= (Math.floor(preHp / bracket) - 1) * bracket) {
			tengu.hp = (Math.floor(preHp / bracket) - 1) * bracket + 1;
		}
		if ((tengu.tenguPhase ?? 'cell') === 'cell' && tengu.hp <= Math.floor(tengu.maxHp / 2)) {
			tengu.hp = Math.floor(tengu.maxHp / 2);
			tengu.tenguPhase = 'paused';
			this.say(t('port.log.tenguinteresting'), 'warning');
			this.enterTenguPauseMap();
		}
	},

	/**
	 * `PrisonBossLevel.progress()`'s `case FIGHT_START:` (tag `v3.3.8`): the half-health beat
	 * repaints the floor to `setMapPause()` and, crucially, turns Tengu's sealed door back into an
	 * ordinary `DOOR` (`Painter.set(tenguCell.left+4, tenguCell.top, Terrain.DOOR)`). That door is
	 * load-bearing rather than decorative: `checkTenguFightStart` seals the hero in beside Tengu,
	 * and the `FIGHT_PAUSE -> FIGHT_ARENA` retreat trigger needs the hero to reach row 8 up the
	 * hallway. Without this repaint the whole arena phase is unreachable in real play.
	 *
	 * Java fires this from `occupyCell`, i.e. on the hero's own next move after the HP crossing;
	 * this port fires it at the crossing itself. Nothing reads the map in between, so the
	 * one-action difference is not observable - recorded rather than reproduced.
	 *
	 * Unowned halves, each named where it belongs: Java's own `clearEntities(tenguCell)` here
	 * destroys every heap, mob and plant outside the cell and pulls a pending
	 * `HeavyBoomerang.CircleBack` home (see `PORT_COVERAGE.md`'s `MissileWeapon` row), and
	 * `cleanMapState()` clears visited/mapped, every blob and every trap - including the dart
	 * traps this port deliberately keeps (`tenguCellJump`'s own patch). Tengu is not removed from
	 * the level for the wait either; see `checkTenguArenaRetreat` for that stated simplification.
	 */
	enterTenguPauseMap(this: DungeonScene): void {
		this.applyPrisonBossPaint(prisonBossPause(this.runSeedLong).paint);
		//The `Doors` registry owns locked-ness in this port, and `applyPrisonBossPaint` only
		//writes terrain - so re-placing the door unlocked is what actually opens the way back.
		this.doors.place(PRISON_TENGU_CELL_DOOR.x, PRISON_TENGU_CELL_DOOR.y, { open: DOOR, closed: DOOR_CLOSED, startOpen: false });
		this.restitchTilesAround(PRISON_TENGU_CELL_DOOR.x, PRISON_TENGU_CELL_DOOR.y);
	},

	/**
	 * `PrisonBossLevel.progress()`'s `case START:`, fired from `occupyCell()` (tag `v3.3.8`):
	 * Tengu is not spawned on floor entry like every other ported boss - he does not exist as a
	 * live actor at all until the hero's own move lands past his locked door, inside `tenguCell`
	 * (`cellToPoint(ch.pos).y > tenguCell.top`, i.e. past row 23 on this port's 32x32 layout -
	 * see `PRISON_TENGU_CELL`), which in real play means unlocking that door with the iron key a
	 * guard drops. `populate()` skips spawning `tengu` for exactly this reason, mirroring the
	 * existing DM-300/Yog precedent of a lazily-triggered boss.
	 *
	 * Java's own order is kept, because the order is observable. The spawn cell is resolved
	 * first - `pointToCell(tenguCellCenter)`, or a random free 8-neighbour when something is
	 * already standing there - and when there is no free cell at all the whole transition is
	 * abandoned: the trigger stays unspent and is retried on the hero's next move. Only then does
	 * Java re-lock the door behind the hero (`set(pointToCell(tenguCellDoor), Terrain.LOCKED_DOOR)`),
	 * which is the point of the beat: the iron key has just been spent, so the fight cannot be
	 * walked away from. That re-lock lasts until half HP, where `enterTenguPauseMap()` sets the
	 * door back to a plain `DOOR` for the retreat, and the death transition's `setMapEnd()` opens
	 * it once more so the walkable exit is actually reachable - so the three halves keep each
	 * other honest, and none of them can be changed alone.
	 *
	 * Unowned halves, each named where it belongs: `seal()`'s own `LockedFloor` buff (the same
	 * stated simplification as every other boss seal here - boss floors have no stairs in this
	 * port, descent is the boss's death alone), `Statistics.qualifiedForBossChallengeBadge`,
	 * `Mob.holdAllies`/`restoreAllies` (no intelligent ally persists into this fight), and the
	 * wool burst/PUFF sample plus the `PRISON_BOSS` music start (this port's boss music already
	 * plays from floor entry - the same "nothing to switch to" note the Sewer seal records).
	 * `GameScene.add(tengu, 1)`'s one-tick delay is not modelled; `spawnMonster` schedules at its
	 * own default, as it does for every other boss. The double-`hp > 0` guard on the migration
	 * path below covers a run saved before this trigger existed, whose floor state already
	 * carries a live entry-spawned Tengu.
	 */
	checkTenguFightStart(this: DungeonScene): void {
		if (this.depth !== 10 || this.tenguFightStarted) return;
		if (this.creatures.some((c) => c.kind === 'tengu' && c.hp > 0)) {
			this.tenguFightStarted = true;
			return;
		}
		if (this.hero.y <= PRISON_TENGU_CELL.top) return;
		let spawn: Step = { x: PRISON_TENGU_CELL_CENTER.x, y: PRISON_TENGU_CELL_CENTER.y };
		if (this.creatureAt(spawn.x, spawn.y)) {
			const free = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: spawn.x + dx, y: spawn.y + dy }))
				.filter((cell) => !this.creatureAt(cell.x, cell.y));
			if (free.length === 0) return;
			spawn = Random.element(free)!;
		}
		this.tenguFightStarted = true;
		//`Statistics.qualifiedForBossChallengeBadge = true` (`PrisonBossLevel` seal).
		this.qualifiedForBossChallenge = true;
		//`set(pointToCell(tenguCellDoor), Terrain.LOCKED_DOOR)` + `GameScene.updateMap` - this
		//port's `Doors` registry owns locked-ness, so re-placing the door is what re-locks it.
		this.doors.place(PRISON_TENGU_CELL_DOOR.x, PRISON_TENGU_CELL_DOOR.y, { open: DOOR, closed: DOOR_CLOSED, locked: 'ironKey', startOpen: false });
		this.restitchTilesAround(PRISON_TENGU_CELL_DOOR.x, PRISON_TENGU_CELL_DOOR.y);
		this.spawnMonster('tengu', spawn);
		this.say(t('port.log.tenguarrives'), 'warning');
	},

	/**
	 * `PrisonBossLevel.occupyCell()`'s `case FIGHT_PAUSE:` (tag `v3.3.8`): real Java fires
	 * `setMapArena()` - walling the whole floor but the (3,1)-(18,16) ellipse - the moment the
	 * hero's own move lands on `y <= startHallway.top+1` (row 8), re-adding Tengu at the arena's
	 * centre. This port keeps Tengu alive and fighting through the whole wait instead of Java's
	 * remove-then-re-add "he's vanished" beat (this port's actor/sprite/health-bar lifecycle has
	 * no precedent for temporarily pulling a boss out mid-fight and back in with its state
	 * intact, and getting that wrong risks a broken fight far worse than skipping one cutscene
	 * beat) - Tengu simply teleports to the arena's centre the instant the repaint lands, the same
	 * presentation `tenguArenaJump`'s existing teleports already use elsewhere in this fight.
	 * **Firing this only once the hero has actually retreated is load-bearing, not cosmetic**:
	 * this port's whole first phase is fought inside `tenguCell` (rows 23-31), entirely outside
	 * the arena ellipse (rows 1-16) - repainting on the HP threshold alone, without waiting for
	 * the retreat, would wall the hero into solid rock on every single fight.
	 */
	checkTenguArenaRetreat(this: DungeonScene): void {
		if (this.depth !== 10) return;
		const tengu = this.creatures.find((c) => c.kind === 'tengu' && c.hp > 0);
		if (!tengu || tengu.tenguPhase !== 'paused') return;
		if (this.hero.y > 8) return;
		const arena = prisonBossArena().paint;
		this.applyPrisonBossPaint(arena);
		//`PrisonBossLevel.progress()`: `(arena.left + arena.width()/2) + width()*(arena.top+2)` -
		//Java's own integer division, `width()=16` so `16/2=8`.
		const center = { x: PRISON_ARENA.left + Math.floor((PRISON_ARENA.right - PRISON_ARENA.left + 1) / 2), y: PRISON_ARENA.top + 2 };
		this.moveTo(tengu, center);
		tengu.tenguPhase = 'arena';
		this.say(t('port.log.tenguarena'), 'warning');
	},

	/** Bulk-writes a Tengu boss-floor `PaintLevel` into the live `this.level.terrain` and
	 *  `this.portedPaint.map`, then restitches every tile - the shared repaint primitive
	 *  `checkTenguArenaRetreat()`/`applyTenguDeathTransition()` both need, mirroring the
	 *  mining-branch precedent's own `toGameTerrain` conversion for a fresh floor entry. */
	applyPrisonBossPaint(this: DungeonScene, paint: PaintLevel): void {
		for (let cell = 0; cell < paint.map.length; cell++) {
			const kind = SPD_TERRAIN_TO_GAME_KIND[paint.map[cell]!];
			if (kind === undefined) throw new Error(`applyPrisonBossPaint: no mapping for Terrain value ${paint.map[cell]}`);
			this.level.terrain[cell] = GAME_KIND_CODES[kind];
		}
		if (this.portedPaint) this.portedPaint.map.set(paint.map);
		this.restitchAllTiles();
	},

	/**
	 * `PrisonBossLevel.progress()`'s `case FIGHT_ARENA:` (tag `v3.3.8`), Tengu's real death
	 * transition: `unseal()`, the hero repositioned to `tenguCell.left+4 + width()*(tenguCell.top+2)`
	 * = `(10, 25)` (not the door cell - two rows further in, the reopened room `setMapEnd()`
	 * carves), `setMapEnd()`'s chasm/exit layout, and a real stairway the hero can now walk to
	 * instead of this port's shared auto-descend. Java also relocates surviving allies and
	 * drops `storedItems` back into the world; this port has no analogue for either (no allies
	 * ever accompany a boss fight here, and nothing is pulled out of the bag for this fight), so
	 * both are correctly no-ops rather than invented behavior. Called in place of the shared
	 * boss-death `depth++`/`enterLevel()` block - the caller already handled the banner/badge/
	 * victory-message work common to every boss before reaching here.
	 */
	applyTenguDeathTransition(this: DungeonScene): void {
		this.applyPrisonBossPaint(prisonBossEnd(this.runSeedLong).paint);
		//`setMapEnd()`'s own `Painter.set(tenguCell.left+4, tenguCell.top, Terrain.DOOR)` - the
		//hero is put back inside the cell on the line below, so this door is the only way to the
		//exit it has just opened. Re-placed rather than assumed open: the registry is not part of
		//`applyPrisonBossPaint`'s terrain write, and a run that reached here by any route other
		//than the pause repaint must still find it openable.
		this.doors.place(PRISON_TENGU_CELL_DOOR.x, PRISON_TENGU_CELL_DOOR.y, { open: DOOR, closed: DOOR_CLOSED, startOpen: false });
		this.restitchTilesAround(PRISON_TENGU_CELL_DOOR.x, PRISON_TENGU_CELL_DOOR.y);
		this.moveTo(this.hero, { x: 10, y: 25 });
		const exitCell = this.portedPaint?.map.indexOf(Terrain.EXIT) ?? -1;
		if (exitCell >= 0) {
			this.stairs = { x: exitCell % this.level.width, y: Math.floor(exitCell / this.level.width) };
			this.hasStairs = true;
			this.drawStairsSprite();
		}
	},

	/**
	 * The shared stairs half of every boss `unseal()` below: the floor gains a real
	 * walkable exit at Java's own exit cell instead of the port's old instant
	 * `depth++`/`enterLevel()`. Stepping onto it descends through the ordinary
	 * stairs path, which is also what persists the unsealed floor via the floor
	 * capture. Called in place of the shared boss-death auto-descent - the caller
	 * already handled the banner/badge/victory-message work common to every boss.
	 */
	openBossExitStairs(this: DungeonScene, at: Step, draw = true): void {
		this.stairs = { ...at };
		this.hasStairs = true;
		//The reload repair passes `draw: false`: `enterLevel` draws the sprite itself
		//a few lines later (`if (this.hasStairs) this.drawStairsSprite()`), and drawing
		//here too would orphan a second sprite on the same cell.
		if (draw) this.drawStairsSprite();
	},

	/** What `scenes/bossUnseal.ts`'s `unseal()`s need from this scene (the paint, tile layers, doors and stairs sprite are ours). */
	bossUnsealContext(this: DungeonScene): BossUnsealContext {
		return {
			depth: this.depth,
			width: this.level.width,
			paint: this.portedPaint,
			entrance: this.entranceCell,
			inside: (x, y) => this.level.inside(x, y),
			markUnsealed: (depth) => { this.bossUnsealedDepths.add(depth); },
			wasUnsealed: (depth) => this.bossUnsealedDepths.has(depth),
			makeFloor: (x, y) => this.level.set(x, y, FLOOR),
			restitch: (x, y) => this.restitchTilesAround(x, y),
			refreshTerrain: () => this.map?.setLayerData('terrain', this.terrainFrames()),
			refreshWater: () => this.map?.setLayerData('water', this.waterFrames()),
			placeDoor: (at) => {
				this.doors.place(at.x, at.y, { open: DOOR, closed: DOOR_CLOSED, startOpen: false });
				this.restitchTilesAround(at.x, at.y);
			},
			openStairs: (at, draw) => this.openBossExitStairs(at, draw),
			clearCavesEnergy: () => this.cavesBossEnergyCells.clear(),
			refreshCavesArena: () => this.refreshCavesBossArenaVisuals(),
			refreshHallsCenter: () => {
				this.hallsBossCenter?.setLayerData('hallsCenter', hallsCenterPieceLayer(this.level.width, this.level.height, true));
				this.hallsBossCenterWalls?.setLayerData('hallsCenterWalls', hallsCenterWallLayer(this.level.width, this.level.height, true));
			},
			impShopDue: () => this.quests.status('imp') === 'complete' && !this.creatureAt(CITY_IMP_SHOP.left + 4, CITY_IMP_SHOP.top + 4),
			spawnImpShop: (at) => {
				this.spawnMonster('impShopkeeper', at);
				this.shopStockFor(20);
				this.checkImpShopkeeperGreeting();
			},
		};
	},

	/** Tengu's per-bracket `jump()`: relocate 5-7 away with the trap burst, capped at 4
	 * jumps (`arenaJumps`, Java's own phase-2 cap - without a FIGHT_START/ARENA room split
	 * the whole fight runs under these rules). The first jump keeps the old vanish flavor
	 * (the phase-shift moment); every jump re-seeds the burst. Called from damage sites
	 * after the hit resolves (Java queues it past the full attack the same way). */
	tenguBracketJump(this: DungeonScene, tengu: Creature, preHp: number): void {
		if (tengu.kind !== 'tengu' || tengu.hp <= 0) return;
		const bracket = Math.max(1, Math.floor(tengu.maxHp / 8));
		if (Math.floor(preHp / bracket) === Math.floor(tengu.hp / bracket)) return;
		if ((tengu.tenguPhase ?? 'cell') === 'cell') this.tenguCellJump(tengu);
		else this.tenguArenaJump(tengu);
	},

	/** `Tengu.jump()`'s FIGHT_START branch: warp within the cell (true distance > 3.5 from the
	 * hero), then `placeTrapsInTenguCell(fill)` - a `Patch.generate(7, 7, fill, 0, false)` dart
	 * field whose density ramps from 0.9 down to 0.4 as Tengu nears half health. Java also
	 * rejects a patch that leaves the hero too close to or too far from Tengu along the
	 * trap-free path; this port approximates that gate by keeping the hero's own cell and its
	 * neighbours clear. `arenaJumps` is untouched - phase 1 never casts abilities. */
	tenguCellJump(this: DungeonScene, tengu: Creature): void {
		const room = this.level.rooms[0];
		if (!room) return;
		for (let attempt = 0; attempt < 100; attempt++) {
			const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			if (Math.hypot(at.x - this.hero.x, at.y - this.hero.y) <= 3.5) continue;
			this.moveTo(tengu, at);
			break;
		}
		const half = tengu.maxHp / 2;
		const fill = Math.min(0.9, Math.max(0.4, 0.9 - 0.5 * ((tengu.hp - half) / half)));
		const width = room.right - room.left + 1;
		const height = room.bottom - room.top + 1;
		const patch = spdPatchGenerate(width, height, fill, 0, false);
		for (let i = 0; i < patch.length; i++) {
			if (!patch[i]) continue;
			const x = room.left + (i % width), y = room.top + Math.floor(i / width);
			if (this.creatureAt(x, y)) continue;
			if (Math.max(Math.abs(x - this.hero.x), Math.abs(y - this.hero.y)) <= 1) continue;
			this.seedBossTrap({ x, y }, 'poisonDart');
		}
		this.say(t('port.log.tenguvanish'), 'warning');
		this.say(t('port.log.tengutraps'), 'warning');
	},

	/** `Tengu.jump()`'s FIGHT_ARENA branch: pick any level cell 5-7 (Chebyshev) from the hero, the
	 * old position and the current enemy, non-solid, unoccupied and without a heap - Java draws
	 * `Random.Int(level.length())` over the whole map exactly like this - then raise `arenaJumps`
	 * (Java's own phase-2 cap of 4) and burst the vanish cue. Java seeds no traps here. The port
	 * does not rebuild the map into Java's separate `arena` ellipse (`setMapArena()`), so a jump
	 * can land outside the Tengu cell; that geometry is the documented remaining gap. */
	tenguArenaJump(this: DungeonScene, tengu: Creature): void {
		if ((tengu.arenaJumps ?? 0) >= 4) return;
		const from = { x: tengu.x, y: tengu.y };
		for (let attempt = 0; attempt < 100; attempt++) {
			const at = { x: Random.int(this.level.width), y: Random.int(this.level.height) };
			if (this.level.get(at.x, at.y) === WALL) continue;
			const heroDistance = Roguelike.chebyshevDistance(at, this.hero);
			if (heroDistance < 5 || heroDistance > 7) continue;
			if (Roguelike.chebyshevDistance(at, from) < 5) continue;
			if (this.creatureAt(at.x, at.y) || this.groundItemAt(at.x, at.y)) continue;
			this.moveTo(tengu, at);
			tengu.arenaJumps = (tengu.arenaJumps ?? 0) + 1;
			this.say(t('port.log.tenguvanish'), 'warning');
			return;
		}
	},

	/** Tengu.throwBomb(): the free non-solid cell adjacent to the hero nearest Tengu (with
	 * no lit bomb already there) gets a 3-turn `tenguBomb` fuse - the range-2 scaled blast
	 * reuses `detonateGroundBomb` via the payload flag. Returns false when no cell is free,
	 * which `useAbility` turns into its Fire fallback. */
	tenguThrowBomb(this: DungeonScene, tengu: Creature): boolean {
		return throwTenguBomb({
			hero: this.hero,
			tengu,
			level: this.level,
			isChasmCell: (x, y) => this.isChasmCell(x, y),
			groundItemAt: (x, y) => this.groundItemAt(x, y),
			spawnTenguBomb: (at) => this.spawnGroundItem('bomb', at.x, at.y, {
				id: 'bomb', quantity: 1, identified: true, sourceClass: 'Bomb', fuseTurns: 3, tenguBomb: true,
			}),
			say: (message, level) => this.say(message, level),
		});
	},

	/** Tengu.throwFire(): aim a `Ballistica` at the hero and take the ring direction of its first
	 * step, which is what Java stores on the ability (`FireAbility.direction` - the `CIRCLE8` index
	 * whose offset equals `aim.path.get(1)`). No cone is seeded here: the ability acts on the
	 * Tengu's next turn, one ring at a time, in `advanceTenguFire`. Returns false only in the
	 * degenerate standing-on-the-hero case, matching Java's own `throwFire` false path. */
	tenguThrowFire(this: DungeonScene, tengu: Creature): boolean {
		const step = Roguelike.traceLine({ x: tengu.x, y: tengu.y }, { x: this.hero.x, y: this.hero.y })[1];
		if (!step) return false;
		const direction = TENGU_CIRCLE8.findIndex(([dx, dy]) => dx === step.x - tengu.x && dy === step.y - tengu.y);
		if (direction < 0) return false;
		const beam = this.buildTenguBeam({ x: tengu.x, y: tengu.y }, direction, tengu);
		beam.start();
		this.tenguBeams.set(tengu, beam);
		tengu.tenguFire = { direction, beam: beam.toJSON() };
		this.say(t('port.log.tengudart'), 'negative');
		return true;
	},
};
