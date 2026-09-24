import type { DungeonScene } from '../dungeonScene';
import { fallenItemStore } from './fallenItems';
import { FogOfWar } from '../../ui/fogOfWar';
import { wallBlockingFrame } from '../../spdLevelGen/wallBlocking';
import { Actors, AnimatedSprite, Bar, Game, Random, Roguelike, SaveSystem, theme } from 'mwg';
import { groundKindForItem, portItemKind, sourceInventoryItem } from '../../items/itemKinds';
import { ringWealthBonus, ringWealthMultiplier } from '../../items/ringModifiers';
import { GROUND_ITEM_KEYS, MOB_KEYS, REGION_KEYS, capitalize, has, t } from '../../i18n/index';
import { lethalHasteDuration, soulSiphonCharge } from '../../talentEffects';
import { SpdRandom } from '../../spdRng';
import { runState } from '../../runState';
import { recordRun } from '../../rankings';
import { isChallengeEnabled } from '../../challenges';
import { PRISMATIC_FADE_TURNS } from '../../simulation/prismatic';
import { skeletonBoneExplosionDamage } from '../../simulation/skeletonExplosion';
import { CLASS_AMMO } from '../../classes';
import { applyDM300DeathUnseal, applyGooDeathUnseal, applyKingDeathUnseal, applyYogDeathUnseal } from '../bossUnseal';
import { processSacrifice } from '../../simulation/environmentalBlobs';
import { buildYogMinionDeck, chooseYogSpawnCell } from '../../simulation/yogBoss';
import { deathBurstsFor } from '../../simulation/deathBursts';
import { colorblind } from '../../settings';
import { ringTypesKnownFor } from '../../simulation/ringKnow';
import { staffImbueFor } from '../../items/wands';
import { Banner } from '../../ui/banner';
import { bruteLootArmor, randomArmor, randomUsingDefaultsAnyCategory, type GenItem } from '../../items/generator';
import { generatedInventoryItem } from '../../items/generatedItems';
import { initialiseWealthTrackers, planWealthDrops, wealthEquipBonus, type WealthTrackers } from '../../items/wealthDrops';
import { wandmakerQuestType, wandmakerQuestWands } from '../../spdLevelGen/wandmaker';
import { FLOOR, TILE, WALL, WATER, WATERSKIN_MAX } from '../../dungeonConstants';
import { regionForDepth } from '../../genericDungeon';
import { BUFF_DURATION, addBuff, buffBlocked, reigniteBuff, rollHit, type BuffId, type Creature, type GroundItem } from '../../combat';
import { BOSSES, BOSS_KINDS, LIMITED_DROP_DECAY, MINIBOSS_KINDS, MOB_LOOT, MONSTERS, type AnyMonsterId, type MonsterId } from '../../monsters';
import { SPD_LEVEL_CURVE, isStatueLoot } from './shared';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `deathSaveRefresh`). Each takes the scene as 	his`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const deathSaveRefreshMethods = {
	/** `Skeleton.die()`'s bone explosion (tag `v3.3.8`): every living character in the
	 * eight neighbouring cells takes a fresh 6..12 roll, then two defender armor rolls.
	 * The shared blast seam supplies the remaining defender-side curves and HP/death tail for
	 * mobs; the hero uses the existing damage boundary so barriers, AuraOfProtection and death
	 * saves remain centralized. Java's extra RockArmor/Earthroot double-DR and target-health
	 * indicator talent branch have no equivalent state in this compact port. */
	skeletonBoneExplosion(this: DungeonScene, skeleton: Creature, cause: 'foe' | 'trap' | 'fire' | 'poison' | 'hunger' | 'falling'): void {
		if (cause === 'falling') return;
		let heroKilled = false;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const target = this.creatureAt(skeleton.x + dx, skeleton.y + dy);
			if (!target || target.hp <= 0) continue;
			const raw = Random.normalRange(6, 12);
			const damage = skeletonBoneExplosionDamage(raw,
				Random.normalRange(target.armor[0], target.armor[1]),
				Random.normalRange(target.armor[0], target.armor[1]));
			if (target.isHero) {
				const dealt = this.absorbHeroDamage(damage);
				target.hp -= dealt;
				this.showDamage(target, dealt);
				if (target.hp <= 0) {
					this.kill(target, 'foe');
					heroKilled = true;
				}
			} else {
				// Armor was already rolled above; `pierceArmor` keeps the blast seam from rolling it twice.
				this.applyBlastDamage(target, damage, true, 'foe');
			}
		}
		if (heroKilled) this.say(t('actors.mobs.skeleton.explo_kill'), 'negative');
	},

	/** `Mob.die()`'s Lethal Haste trigger (Duelist T2, checked against tag `v3.3.8`): a
	 * hero-caused kill grants `GreaterHaste.set(2 + 2*points)` turns - this port's existing
	 * `haste` buff at its real x3 turn-cost multiplier, written directly since the duration
	 * is rank-scaled rather than the fixed 20 `addBuff` grants - gated by a real 100-turn
	 * `LethalHasteCooldown`. Replaces a wrong-shaped stand-in (a single `freeTurnNext` flag
	 * on every kill, no cooldown, no haste). Called from the melee kill site (which also
	 * covers enchant-proc kills, since those resolve inside `attack()`) and the
	 * thrown-missile/bow kill sites (Java's `cause instanceof Weapon` gate); wand-zap kills
	 * are excluded the same way (`cause` is the Wand, not a Weapon), as are bombs/traps.
	 * Gate note, same as Weapon Recharging above: both tags gate the Java line on
	 * `heroClass != DUELIST`, unsatisfiable with class-locked talents, so the port follows
	 * the evident intent for the talent-holding class. No log line: Java signals this with
	 * the haste visual only. */
	lethalHasteOnKill(this: DungeonScene): void {
		const rank = this.talentRank('lethal_haste');
		if (this.heroClass !== 'duelist' || rank <= 0 || this.hero.buffs['lethalHasteCooldown'] !== undefined) return;
		this.hero.buffs['lethalHasteCooldown'] = BUFF_DURATION['lethalHasteCooldown'];
		this.hero.buffs['haste'] = Math.max(this.hero.buffs['haste'] ?? 0, lethalHasteDuration(rank));
	},

	/** `PinCushion.detach()`/`Char.throwItems()`: stuck missiles scatter back out as ground heaps (one item per
	 * cell here, so extras take neighbouring cells, like statue drops). The heaps keep the pile's set at
	 * the current level - Java's scattered missiles stay their stack's set, which is what the
	 * dust rule reads (generic stones have neither field and stay always valid). Run on death, and
	 * by a crumpled `CrystalGuardian` each recovering turn (`crystalMine.ts`). */
	scatterStuckAmmo(this: DungeonScene, creature: Creature): void {
		if (!creature.stuckAmmo || creature.stuckAmmo <= 0) return;
		const cells = [{ x: creature.x, y: creature.y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))]
			.filter((at) => this.level.inside(at.x, at.y) && this.level.passable(at.x, at.y) && !this.groundItemAt(at.x, at.y));
		for (let i = 0; i < Math.min(creature.stuckAmmo, cells.length); i++) {
			this.spawnGroundItem('stone', cells[i]!.x, cells[i]!.y);
			const heap = this.groundItemAt(cells[i]!.x, cells[i]!.y);
			if (heap) {
				heap.missileLevel = this.missileLevel;
				heap.missileSet = this.ammoSetId;
				//Stuck ammo carries no per-unit origin: the scatter keeps the currently
				//wielded pile's tip, the same simplification as its set and level above.
				if (this.ammoTippedSeed !== undefined) heap.tippedSeed = this.ammoTippedSeed;
			}
		}
		creature.stuckAmmo = 0;
	},

	kill(this: DungeonScene, creature: Creature, cause: 'foe' | 'trap' | 'fire' | 'poison' | 'hunger' | 'falling' = 'foe'): void {
		const index = this.creatures.indexOf(creature);
		if (index < 0) return;
		//`Challenge.DuelParticipant.detach()` on death: a dueling target that dies (or a
		//hero whose duel dies with her) runs the detach cascade immediately, so the
		//victory heal and the freeze cleanup cannot wait for the next turn's pairing
		//check. (Death-marked creatures return below without dying - their duel ends in
		//	ickDeathMark` instead, once the mark lets them die.)
		if (creature.buffs['duelParticipant'] !== undefined && (creature.deathMarkTurns ?? 0) <= 0) {
			this.detachDuel(creature);
		}
		//`Char.isAlive()` is `HP > 0 || deathMarked`, so a marked creature is *not* `die()`d at zero
		//HP: it keeps acting, and `Char.damage()`'s `HP == 0 && deathMarked` branch runs Fear the
		//Reaper instead. 	ickDeathMark` is what eventually lets it die, when the five turns are up.
		//`Char.damage()`'s own `if (HP < 0) HP = 0` clamp belongs here rather than at the damage
		//sites, because this is the only path where a dead creature stays in the game long enough
		//for a negative HP to be seen (or saved).
		if ((creature.deathMarkTurns ?? 0) > 0) {
			if (creature.hp < 0) creature.hp = 0;
			this.processFearTheReaper(creature);
			return;
		}
		//`PrismaticImage.die()`'s non-chasm branch as a backstop for every lethal seam
		//that funnels through here (blasts, traps, abilities, DoTs): a fading-capable
		//image at 0 HP starts its 5-turn fade instead of dying. The hit's own damage
		//number was already shown by the calling seam; `attack()` and the zap loop
		//intercept earlier with the floater because their post-kill flow assumes the
		//target is gone (XP/loot) or never kills allies at all. Chasm deaths bypass:
		//no mob-chasm kill path exists in this port (chasms only move the hero down),
		//so any future one must tear the actor down directly (`destroyAlly`), exactly
		//like Java's `cause == Chasm.class` carve-out.
		if (!creature.isHero && creature.isAlly && creature.allyKind === 'prismatic'
			&& creature.hp <= 0 && creature.prismaticFade === undefined) {
			creature.hp = 0;
			creature.prismaticFade = PRISMATIC_FADE_TURNS;
			return;
		}
		//`CrystalGuardian.isAlive()`: at 0 HP it crumples to 1 HP and recovers instead of dying, whatever
		//the lethal seam (`crystalMine.ts`).
		if (creature.kind === 'crystalGuardian' && this.crumpleCrystalGuardian(creature)) return;
		//`CrystalSpire.damage()`: only the pickaxe lowers its HP, so a non-pickaxe lethal seam is undone.
		if (creature.kind === 'crystalSpire' && this.restoreSpireHp(creature)) return;
		if (creature.isHero && this.resurrectPending) return;
	if (creature.isHero && this.reviveWithBlessedAnkh()) return;
	if (creature.isHero && this.openResurrectWindow()) return;
		runState.audio.cue('death', 0.65);
		//`BrightFist.damage()`'s death case: the hero's Blindness is prolonged for three times
		//the base duration (30 turns of the table's `daze`). `DarkFist.damage()`'s death case
		//only detaches the hero's Light - no model here, so a dying dark fist costs nothing.
		//The old code dazed for both, which was Dark's half invented.
		if (creature.kind === 'yogFist' && creature.yogFistType === 'bright' && !buffBlocked(this.hero, 'daze')) {
			this.hero.buffs['daze'] = Math.max(this.hero.buffs['daze'] ?? 0, 30);
		}
		this.scheduler.remove(creature);
		this.creatures.splice(index, 1);
		const deadSprite = this.sprite(creature);
		this.monsterMotion.get(deadSprite)?.clear();
		this.monsterMotion.delete(deadSprite);
		deadSprite.position.set(creature.x * TILE, creature.y * TILE);
		deadSprite.colorAdd = 0;
		if (deadSprite instanceof AnimatedSprite && deadSprite.has('die')) {
			deadSprite.play('die', true);
			//a monster's corpse is handed to the fade loop; the hero keeps its pose in place
			if (!creature.isHero) this.dyingMonsters.set(deadSprite, { x: creature.x, y: creature.y, fade: 0, duration: 3, playDieClip: true });
		//`WardSprite.die()` (tag `v3.3.8`): no death clip - just `sprite.parent.add(new
		//AlphaTweener(sprite, 0, 2f))`, a plain 2-second fade of the static gem sprite in
		//place. Java's own ordinary `MobSprite.die()` (the `duration: 3` branch above) has
		//no such tween at all; the two are separate, differently-timed effects that only
		//looked alike from this port's "no fade exists" note before the fade loop above
		//grew a generic per-corpse duration.
		} else if (!creature.isHero && creature.allyKind === 'ward') {
			this.dyingMonsters.set(deadSprite, { x: creature.x, y: creature.y, fade: 0, duration: 2, playDieClip: false });
		} else if (!creature.isHero) deadSprite.destroy();
		//Java's one-shot death bursts (`DM300Sprite.onComplete(die)`, `PylonSprite.play(die)`,
		//`GuardSprite.play(die)`, `SuccubusSprite.die()`, `GhostSprite.die()`,
		//`WardSprite.die()` - see `simulation/deathBursts.ts`): fired for every death through
		//this shared path. The table returns [] for kinds with no burst, so the hero and
		//ordinary monsters need no branch here.
		this.playDeathBursts(deathBurstsFor(creature.kind, creature.allyKind), creature.x, creature.y);
		//the hero's sprite outlives `kill()` for the game-over screen (see the `gameOver`
		//check further down) - every other creature's sprite is either already destroyed above
		//or now only reachable through `dyingMonsters`, keyed by the sprite object itself, so
		//dropping the id mapping here is safe.
		if (!creature.isHero) this.spriteFor.delete(creature.id);
		this.charmTargets.delete(creature.id);
		this.charmIgnoreNextHit.delete(creature.id);
		this.suckerPunchTargets.delete(creature.id);
		//the bar is keyed on the creature, so it has to go with it or it hangs over an empty
		//cell for the rest of the floor
		this.healthBars.get(creature)?.destroy();
		this.healthBars.delete(creature);

		if (creature.isHero) {
			this.leaveBones();
			this.say(this.depth in BOSSES ? t('port.log.deathboss') : t('port.log.deathfloor', { depth: this.depth }), 'negative');
			//death badges (`Badges.java`, tag `v3.3.8`): trap/fire/poison/hunger map
			//1:1; a chasm landing maps to `DEATH_FROM_FALLING` (image 21). Gas and
			//enemy-magic variants stay collapsed into 'foe' - no systems here produce
			//them distinctly.
			this.awardBadge(
				cause === 'trap' ? 'death_trap' : cause === 'fire' ? 'death_fire' : cause === 'poison' ? 'death_poison' : cause === 'hunger' ? 'death_hunger' : cause === 'falling' ? 'death_falling' : 'death_foe'
			);
			this.awaitingInput = false;
			this.gameOver = true;
			recordRun({ result: 'lost', depth: this.depth, level: this.progression.level, gold: this.heroStats.base('gold') });
			this.showDefeatPanel();
			//`GameScene.gameOver()`: the GAME_OVER banner with Java's own `show(0x000000, 2f)` -
			//an infinite hold, so it stays up behind the defeat panel until a restart leaves the
			//scene. The panel tracks the banner's alpha squared, which is what Java's restart and
			//menu buttons do (`alpha(pow(gameOver.am, 2))`); the menu button itself has no port
			//counterpart because the panel is a port invention, but its path survives - Escape and
			//the toolbar entry still open `WndGame` on a dead hero (see `onAction`).
			const over = new Banner(runState.sprites.bannerGameOver);
			over.show(0x000000, 2);
			this.showBanner(over);
			this.bannerPanelFollow = true;
			return;
		}
		if ((creature.kind === 'skeleton' || creature.kind === 'necroSkeleton') && !creature.isAlly) {
			this.skeletonBoneExplosion(creature, cause);
		}
		//ChampionEnemy.Blazing.detach() (tag v3.3.8): a grounded blazing champion seeds
		//Fire volume 2 in each of the eight neighbouring non-solid, non-water cells when it
		//dies. The Java hook suppresses this only when the champion is flying over a pit; use
		//the port's chasm predicate for that pit test and the existing floor Fire blob for the
		//same short-lived environmental effect. This runs before ordinary hostile-death
		//bookkeeping, while the dead creature's last position is still available.
		if (creature.champion === 'blazing'
			&& (!creature.flying || !this.isChasmCell(creature.x, creature.y))) {
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const x = creature.x + dx;
				const y = creature.y + dy;
				if (!this.level.inside(x, y) || this.level.get(x, y) === WALL || this.level.get(x, y) === WATER) continue;
				this.fire.seed(x, y, 2);
			}
		}
		//MirrorImage allies are temporary 1-HP summons, not hostile Mob instances: their death
		//must not award XP, loot, quest progress, or trigger monster-specific death hooks.
		//`CrystalSpire` is `Alignment.NEUTRAL`: `Mob.die()` grants no EXP and rolls no loot for it;
		//its own death effects (quest boss beaten, crystals shattered) run in `crystalSpireDied`.
		if (creature.kind === 'crystalSpire') {
			this.crystalSpireDied(creature);
			return;
		}
		if (creature.kind === 'pylon') {
			//Pylon.die() delegates to CavesBossLevel.eliminatePylon(), which calls
			//DM300.loseSupercharge() even when the pylon is the final one.
			this.dm300LoseSupercharge();
			return;
		}
		if (creature.isAlly) return;
		this.processSacrifice(creature);
		this.scatterStuckAmmo(creature);
		if (creature.kind === 'bat' && this.blacksmithAlternative) {
			const pickaxe = this.bag.find('pickaxe');
			if (pickaxe && pickaxe.affix !== 'bloodStained') {
				pickaxe.affix = 'bloodStained';
				Actors.identify(pickaxe);
				this.say(t('port.log.pickaxeblood'), 'positive');
			}
		}

		//Mob.java: `exp = Dungeon.hero.lvl <= maxLvl ? EXP : 0` - a mob outgrown by the hero's
		//level grants nothing; NPCs never fight and clones past generation 0 grant nothing
		if (creature.kind && !creature.isNPC) {
			//Talent.BOUNTY_HUNTER is now its real mechanic: `Mob.lootChance()`'s drop-chance term,
			//added into the multiplier by `bountyHunterLootBonus()`, gated on the tracker armed by
			//a prepared attack (`Char.attack()` 407-409). What stood here was a flat gold bonus on
			//*any* kill - invented when this port had no Preparation subsystem to arm the tracker
			//from, and wrong in kind: real Java's talent grants no gold at all, and applies only
			//while Preparation is up.
			//Necromancer's Minions' old stand-in is gone outright: real Java only rolls
			//(`0.4*points/3`, the formula `necromancerMinionChance` still encodes for reference)
			//on a SOUL-MARKED victim's death, raising a Corrupted Wraith ally - and this port
			//has no SoulMark application or Wraith kind; ally combat now exists, but the required
			//to fight in. What stood here instead (a hostile necro skeleton on EVERY warlock
			//kill, marked or not) had the trigger, the minion, and the allegiance all wrong,
			//actively punishing the talent - removal plus this note, not a quieter stub.
			const def = MONSTERS[creature.kind];
			const isClone = creature.kind === 'swarm' && (creature.generation ?? 0) > 0;
			//`noExp` is a `maxLvl = -2` summon (the King's servants): neither XP nor
			//loot, in every phase - Java's `hero.lvl <= maxLvl` and `lvl > maxLvl+2`
			//gates both fail unconditionally at -2.
			if (!isClone && creature.noExp !== true && this.progression.level <= def.maxLvl) this.grantExperience(def.exp);
			if (this.subclass() === 'warlock' && this.talentRank('soul_eater') > 0) {
				const heal = this.talentRank('soul_eater');
				this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
				this.showHeal(this.hero, heal);
			}
			this.wandCharges.refund(soulSiphonCharge(this.subclass(), this.talentRank('soul_siphon')));
			//(`SECONDARY_CHARGE` - the Champion T3 in this port's newer-tree talent table,
			//replacing v3.3.8's `VARIED_CHARGE` at the same slot - has no effect here: its
			//real mechanic scales the *second weapon's* charge meter (`secondChargeCap()`,
			//50%-67% of primary by rank), and this port has no second weapon, no second
			//meter, and no dual-wield at all (the same blocker 	win_upgrades` already
			//records). An earlier pass granted rank-many missile ammo on every kill under
			//this talent's name; that effect is fiction - nothing in any Java version does
			//it - so it is gone, not rebuilt. Stated, not silent.)
		}

		//Mob.rollToDropLoot, simplified to one-item ground drops (no stacking heaps, no Wealth
		//rings): one roll per table entry through real rollLoot. `Dungeon.LimitedDrops` decay is
		//now real for bat/necromancer/guard (`LIMITED_DROP_DECAY`, below) - see `PORT_COVERAGE.md`
		//for the remaining kinds whose base chance/category still diverges from Java outright.
		if (creature.kind && !creature.isNPC) {
			//`Goo.die()` and `DM300.die()` (tag v3.3.8) each roll
			//`Random.chances({0:0, 1:0, 2:6, 3:3, 4:1})`, then drop that many
			//identified one-unit quest items on random passable neighbours. The port has no
			//stacking heaps, so each material is placed on the first free sampled neighbour;
			//the item identity and 60/30/10 distribution remain exact.
			if (creature.kind === 'goo' || creature.kind === 'dm300') {
				const materialId = creature.kind === 'goo' ? 'gooBlob' : 'metalShard';
				const countRoll = Random.int(0, 9);
				const count = countRoll < 6 ? 2 : countRoll < 9 ? 3 : 4;
				for (let i = 0; i < count; i++) {
					const candidates = Roguelike.neighbourOffsets(8)
						.map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }));
					const sampled = Random.element(candidates);
					const at = sampled && this.level.inside(sampled.x, sampled.y)
						&& this.level.passable(sampled.x, sampled.y) && !this.groundItemAt(sampled.x, sampled.y)
						? sampled
						: candidates.find((cell) => this.level.inside(cell.x, cell.y)
							&& this.level.passable(cell.x, cell.y) && !this.groundItemAt(cell.x, cell.y));
					if (at) this.spawnGroundItem('food', at.x, at.y, {
						id: materialId, quantity: 1, identified: true, sourceClass: materialId,
					});
				}
			}
			if ((creature.kind === 'statue' || creature.kind === 'armoredStatue') && creature.mimicLoot?.startsWith('statue:')) {
				try {
					// The payload comes from a save-derived string, not a trusted in-memory GenItem;
					// validate its minimal shape before handing it to item generation.
					const parsed: unknown = JSON.parse(creature.mimicLoot.slice('statue:'.length));
					if (!isStatueLoot(parsed)) throw new Error('invalid statue loot payload');
					const payload = parsed;
					this.dropGeneratedStatueItem(payload.weapon, creature.x, creature.y);
					if (payload.armor) this.dropGeneratedStatueItem(payload.armor, creature.x, creature.y);
					this.say(t('port.log.statuedrops'), 'positive');
				} catch {
					// An old save can contain a pre-payload statue; its generic loot table is absent
					// deliberately, so a malformed legacy payload simply has no statue equipment.
				}
			}
			if ((creature.kind === 'mimic' || creature.kind === 'crystalMimic') && creature.mimicLoot) {
				const [bonusSpec, heldGoldText] = creature.mimicLoot.split(';heldGold:', 2);
				const [bonusPayload, heldItem] = bonusSpec.split(';held:', 2);
				const [lootFamily, lootClass] = bonusPayload.split('|', 2);
				const bonusKind = lootFamily.toLowerCase().includes('missile')
					? 'stone'
					: portItemKind(lootFamily);
				if (bonusKind) {
					//`CrystalMimic.generatePrize()` (`actors/mobs/CrystalMimic.java`, tag `v3.3.8`)
					//guarantees the contained prize is never cursed.
					const prize = sourceInventoryItem(lootFamily, lootClass, (kind) => this.newItemInstanceId(kind));
					if (prize) {
						prize.cursed = false;
						this.spawnGroundItem(bonusKind, creature.x, creature.y, prize);
					}
					this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS[bonusKind]) }));
				}
				const heldGold = heldGoldText ? Number(heldGoldText) : 0;
				if (heldGold > 0) {
					const at = Roguelike.neighbourOffsets(8)
						.map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))
						.find((candidate) => this.level.passable(candidate.x, candidate.y)
							&& !this.groundItemAt(candidate.x, candidate.y) && !this.creatureAt(candidate.x, candidate.y));
					if (at) this.spawnGroundItem('gold', at.x, at.y, { id: 'gold', quantity: heldGold, identified: true });
				}
				if (heldItem) {
					//Three segments since the whole-stack steal (`family|class|qty`); older
					//two-segment payloads read with quantity 1. Stolen items keep their
					//curse state - Java only ever uncurses the prize, never the theft.
					const [heldFamily, heldClass, heldQtyText] = heldItem.split('|', 3);
					const heldKind = portItemKind(heldFamily);
					const at = Roguelike.neighbourOffsets(8)
						.map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))
						.find((candidate) => this.level.passable(candidate.x, candidate.y)
							&& !this.groundItemAt(candidate.x, candidate.y) && !this.creatureAt(candidate.x, candidate.y));
					const heldQty = Math.max(1, Math.floor(Number(heldQtyText) || 1));
					const held = sourceInventoryItem(heldFamily, heldClass || undefined, (kind) => this.newItemInstanceId(kind));
					if (held) held.quantity = heldQty;
					if (heldKind && at && held) this.spawnGroundItem(heldKind, at.x, at.y, held);
				}
			}
			//Elemental.random()/the four concrete elemental subclasses (Elemental.java and
			//FireElemental/FrostElemental/ShockElemental/ChaosElemental, tag v3.3.8) each
			//have a distinct guaranteed-or-chanced loot rule. The shared `elemental` carrier
			//now retains that subtype, so ordinary kills no longer lose the real drop family.
			//Mob.rollToDropLoot() (Mob.java, tag v3.3.8): `if (Dungeon.hero.lvl > maxLvl + 2)
			//return` gates every lootChance roll - and the wealth bonus roll below it, which
			//sits inside rollToDropLoot past the gate. die() drops (goo/DM300 materials,
			//statue equipment, mimic payloads, stolen returns, embers) and the port-invented
			//guard key are outside it. MOB_LOOT maxLvl rides the same MWL rows as EXP.
			const kind = creature.kind;
			const overleveled = creature.noExp === true
				|| (kind !== undefined && (MONSTERS[kind]?.maxLvl ?? 29) < this.progression.level - 2);
			if (!overleveled && creature.kind === 'elemental') {
				const elementalType = creature.elementalType ?? 'fire';
				const elementalLoot = elementalType === 'fire'
					? Random.chance(1 / 8) ? { kind: 'potion' as const, item: { id: 'potionFlame', quantity: 1, identified: false, sourceClass: 'PotionOfLiquidFlame' } } : null
					: elementalType === 'frost'
						? Random.chance(1 / 8) ? { kind: 'potion' as const, item: { id: 'potionFrost', quantity: 1, identified: false, sourceClass: 'PotionOfFrost' } } : null
						: elementalType === 'shock'
							? Random.chance(1 / 4) ? { kind: 'scroll' as const, item: { id: 'scrollRecharging', quantity: 1, identified: false, sourceClass: 'ScrollOfRecharging' } } : null
							: { kind: 'scroll' as const, item: { id: 'scrollTransmutation', quantity: 1, identified: false, sourceClass: 'ScrollOfTransmutation' } };
				if (elementalLoot) {
					this.spawnGroundItem(elementalLoot.kind, creature.x, creature.y, elementalLoot.item);
					this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS[elementalLoot.kind]) }));
				}
			}
			//Warlock.createLoot(): a flat 0.5 lootChance (no LimitedDrops decay on the roll
			//itself, unlike Bat/Necromancer/Guard/etc.), but the *kind* of potion it drops is a
			//separate roll this port's generic 'potion' MOB_LOOT kind can't express - drinking
			//this port's plain 'potion' id always heals (see quaffPotion), so a Warlock always
			//"dropping a potion" would always be a free heal, when real Java guarantees the
			//opposite most of the time. `Random.Int(3)==0 && Random.Int(8) > WARLOCK_HP.count`
			//(1/3 chance, then scaled to never over 8 real healing drops this run) picks
			//`PotionOfHealing`; otherwise a fresh non-healing potion class is redrawn until it
			//isn't Healing. Reproduced here as a real `potionHealing` drop on the rare branch,
			//else a uniform pick among this port's 7 already-modeled non-healing potion ids.
			if (!overleveled && creature.kind === 'warlock' && Actors.rollLoot({ entries: [{ id: 'drop', weight: 1 }], chance: 0.5 * ringWealthMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) })) {
				const warlockHp = this.limitedDrops.warlock ?? 0;
				if (Random.int(3) === 0 && Random.int(8) > warlockHp) {
					this.limitedDrops.warlock = warlockHp + 1;
					this.spawnGroundItem('potion', creature.x, creature.y, { id: 'potionHealing', quantity: 1, identified: false });
				} else {
					const nonHealing = ['potionStrength', 'potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'] as const;
					this.spawnGroundItem('potion', creature.x, creature.y, { id: Random.element(nonHealing)!, quantity: 1, identified: false });
				}
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.potion) }));
			}
			//Scorpio.createLoot(): a flat 0.5 lootChance, always a potion class that is neither
			//Healing nor Strength (a plain redraw-until-excluded loop, no LimitedDrops counter
			//involved) - the same generic-'potion'-always-heals mismatch as Warlock above, fixed
			//the same way: a uniform pick among this port's 6 remaining modeled potion ids.
			if (!overleveled && creature.kind === 'scorpio' && Actors.rollLoot({ entries: [{ id: 'drop', weight: 1 }], chance: 0.5 * ringWealthMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) })) {
				const eligible = ['potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'] as const;
				this.spawnGroundItem('potion', creature.x, creature.y, { id: Random.element(eligible)!, quantity: 1, identified: false });
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.potion) }));
			}
			//Succubus.createLoot(): a flat 0.33 lootChance, always a scroll class that is neither
			//Identify nor Upgrade (a redraw-until-excluded loop, no LimitedDrops counter) - the
			//same mismatch as Warlock/Scorpio above, since this port's generic 'scroll' bag id
			//only ever resolves to exactly those two excluded ids (see the pickup branch's own
			//25%-upgrade/75%-identify split). Reproduced with a uniform pick among this port's 9
			//other modeled scroll ids (all 10 non-Identify/Upgrade members of Java's real
			//12-class `SCROLL` pool, now that `scrollTransmutation`'s own appearance-table gap -
			//found and fixed in the same pass - no longer makes it a crash risk to hand out).
			if (!overleveled && creature.kind === 'succubus' && Actors.rollLoot({ entries: [{ id: 'drop', weight: 1 }], chance: 0.33 * ringWealthMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) })) {
				const eligible = ['scrollCleanse', 'scrollMirror', 'scrollRecharging', 'scrollTeleportation', 'scrollLullaby', 'scrollMapping', 'scrollRage', 'scrollRetribution', 'scrollTerror', 'scrollTransmutation'] as const;
				this.spawnGroundItem('scroll', creature.x, creature.y, { id: Random.element(eligible)!, quantity: 1, identified: false });
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.scroll) }));
			}
			//ArmoredBrute.createLoot() (`actors/mobs/ArmoredBrute.java`, tag `v3.3.8`):
			//lootChance 1 inside the maxLvl gate, so the drop is guaranteed here - 1-in-4
			//PlateArmor, else ScaleArmor, each `.random()`ed. Replaces the generic MWL
			//`armor` row (removed, like the warlock/scorpio/succubus rows that never
			//existed for their dedicated blocks). Gameplay-stream draws: `bruteLootArmor`
			//takes the ambient `Random` directly, never the levelgen stream.
			if (!overleveled && creature.kind === 'armoredBrute') {
				const item = generatedInventoryItem(bruteLootArmor(Random), { newItemInstanceId: (kind) => this.newItemInstanceId(kind) });
				this.spawnGroundItem(groundKindForItem(item, 'armor'), creature.x, creature.y, item);
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.armor) }));
			}
			//`HermitCrab.rollToDropLoot()` (tag `v3.3.8`): past the shared `maxLvl+2` gate, always
			//drops one `Generator.randomArmor()` (depth/5 floor set, the same default the wealth-drop
			//path already uses) alongside its ordinary meat roll below - two separate items, matching
			//Java's `super.rollToDropLoot()` call before this bonus.
			//`GnollExile.rollToDropLoot()` (tag `v3.3.8`): past the same gate, two - and on a coin flip three -
			//`Generator.randomUsingDefaults()` items, each thrown onto a random `NEIGHBOURS9` cell around
			//the corpse that is not solid-and-impassable (its `lootChance` is 0, so this is its only loot).
			if (!overleveled && creature.kind === 'gnollExile') {
				const count = Random.int(2) === 0 ? 3 : 2;
				for (let i = 0; i < count; i++) {
					const item = generatedInventoryItem(randomUsingDefaultsAnyCategory(), { newItemInstanceId: (kind) => this.newItemInstanceId(kind) });
					const cells = [{ x: 0, y: 0 }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: dx, y: dy }))]
						.map((o) => ({ x: creature.x + o.x, y: creature.y + o.y }))
						.filter((c) => this.level.inside(c.x, c.y) && this.level.passable(c.x, c.y));
					const at = cells.length > 0 ? cells[Random.int(0, cells.length)]! : { x: creature.x, y: creature.y };
					this.spawnGroundItem(groundKindForItem(item, 'food'), at.x, at.y, item);
					this.say(t('port.log.drops', { who: capitalize(creature.name), item: this.itemDisplayName(item.id, item.identified ?? false, item.instanceId) }));
				}
			}
			if (!overleveled && creature.kind === 'hermitCrab') {
				const item = generatedInventoryItem(randomArmor(), { newItemInstanceId: (kind) => this.newItemInstanceId(kind) });
				this.spawnGroundItem(groundKindForItem(item, 'armor'), creature.x, creature.y, item);
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.armor) }));
			}
			for (const entry of MOB_LOOT[creature.kind] ?? []) {
				//Mob.rollToDropLoot()'s own `maxLvl + 2` gate, sharing `overleveled` above.
				if (overleveled) break;
				//Dungeon.LimitedDrops: Bat/Necromancer/Guard each scale their own lootChance()
				//down further by how many times this exact drop has already happened this run -
				//`(7-n)/7`, `(6-n)/6`, `(1/3)^n` respectively, real Java's own per-kind formulas.
				//DM201 inherits `DM200.lootChance()` wholesale (`DM201.java` overrides only
				//`rollToDropLoot`, for the MetalShard bonus) - including the *shared*
				//`DM200_EQUIP` counter - so it reads dm200's decay and counter, not its own.
				//`DM201`/`CausticSlime` share their base kind's LimitedDrops counter
				//(`DM200_EQUIP`, `SLIME_WEP` - Java keys the counter on the drop, and both
				//subclasses inherit the base lootChance override unchanged), so both read the
				//base kind's decay and counter, not their own.
				const counterKind = creature.kind === 'dm201' ? 'dm200'
					: creature.kind === 'causticSlime' ? 'slime'
					: creature.kind;
				const decay = LIMITED_DROP_DECAY[counterKind as MonsterId];
				//Swarm.lootChance() (Swarm.java, tag v3.3.8): `1/(6*(generation+1))` - the
				//MWL 1/6 base is the generation-0 value, so split descendants divide by
				//their own generation+1 here; the `(5-n)/5` LimitedDrops half rides `decay`.
				const generationDivisor = creature.kind === 'swarm' ? (creature.generation ?? 0) + 1 : 1;
				const chance = (decay ? entry.chance * decay(this.limitedDrops[counterKind as MonsterId] ?? 0) : entry.chance)
					/ generationDivisor
					* (ringWealthMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) + this.bountyHunterLootBonus());
				const drop = Actors.rollLoot({ entries: [{ id: entry.kind, weight: 1 }], chance });
				if (drop) {
					if (decay) this.limitedDrops[counterKind as MonsterId] = (this.limitedDrops[counterKind as MonsterId] ?? 0) + 1;
					//`DM200`/`Golem.java` (tag v3.3.8): `loot = Random.oneOf(WEAPON, ARMOR)` -
					//Java rolls this once at spawn and keeps it fixed; this port rolls it once
					//per death instead (a per-death, not per-spawn, simplification - stated in
					//`loot-rules.mwl`'s own row comment) since it tracks no per-instance loot
					//field. Every other MOB_LOOT `armor` entry keeps its authored kind unchanged.
					const kind = (creature.kind === 'dm200' || creature.kind === 'golem') && entry.kind === 'armor' && Random.chance(0.5)
						? 'weapon' : entry.kind;
					// `PhantomPiranha` inherits Piranha's guaranteed food drop but its
					// Java `loot` class is `PhantomMeat`, not `MysteryMeat`.
					const payload = creature.kind === 'phantomPiranha' && kind === 'meat'
						? { id: 'phantomMeat', quantity: 1, identified: true, sourceClass: 'PhantomMeat' }
						: undefined;
					this.spawnGroundItem(kind, creature.x, creature.y, payload);
					this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS[kind]) }));
					break;
				}
			}
			//RingOfWealth.tryForBonusDrop(): an independent counter-based bonus roll, in
			//addition to the mob's ordinary loot roll. The port has no generator-level
			//equipment/consumable taxonomy, so the generated result is represented by the
			//closest playable armor/potion payload, while the real counter cadence and boss
			//roll multipliers are retained. The drop is placed in a free neighbouring cell
			//because this port deliberately has one ground item per cell rather than heaps.
			//Mob.rollToDropLoot()'s own wealth cadence (Mob.java, tag v3.3.8): 15 rolls for
			//BOSS, 5 for MINIBOSS, 1 otherwise - read off the same property sets every other
			//boss/miniboss rule here already keys on, not a hand list (which wrongly gave
			//goo/dm200/dm201 five rolls each while starving real minibosses). Inside the
			//same `maxLvl + 2` gate: the bonus block sits past it in rollToDropLoot.
			if (!overleveled && ringWealthBonus(this.effectiveRing(), undefined, this.trinitySpiritRing()) > 0) {
				const rolls = BOSS_KINDS.has(creature.kind as AnyMonsterId) ? 15
					: MINIBOSS_KINDS.has(creature.kind as AnyMonsterId) ? 5 : 1;
				this.tryWealthBonusDrop(creature, rolls);
			}
			//guards carry the iron key (the locked-door stand-in) one time in three
			if (creature.kind === 'guard' && Random.chance(1 / 3)) {
				this.spawnGroundItem('ironKey', creature.x, creature.y, { id: 'ironKey', quantity: 1, identified: true });
				this.say(t('port.log.guardkey'));
			}
			//NewbornFireElemental.die(): an enemy newborn always drops its `Embers` where it
			//died (plus quest-score/music effects neither system here exists to play). No
			//MOB_LOOT roll - guaranteed, outside the decay/wealth machinery above.
			if (creature.kind === 'newbornElemental') {
				this.spawnGroundItem('embers', creature.x, creature.y, { id: 'embers', quantity: 1, identified: true, sourceClass: 'Embers' });
				this.say(t('port.log.emberdrop'), 'positive');
			}
			//a slain thief returns what it stole, plus the gold it drops fleeing-or-dead.
			//Bandit extends Thief and shares this unchanged - previously excluded here too by
			//the same literal-kind-check bug found for its flee behavior above, so a killed
			//Bandit's stolen item vanished for good instead of being recoverable.
			if ((creature.kind === 'thief' || creature.kind === 'bandit') && creature.stolen) {
				if (creature.stolen.startsWith('gold:')) {
					this.heroStats.setBase('gold', this.heroStats.base('gold') + 10);
				} else {
					this.bag.add({ id: creature.stolen, quantity: 1, stackable: true, identified: true });
				}
				this.say(t('port.log.thiefloot'), 'positive');
				this.heroStats.setBase('gold', this.heroStats.base('gold') + 5);
			}
			//GreatCrab's 2x meat is a real 1.0 lootChance roll, so the `maxLvl + 2` gate
			//applies to it like every other loot roll (unlike the recovery/payload drops).
			if (creature.kind === 'greatCrab' && !overleveled) {
				for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
					const at = { x: creature.x + dx, y: creature.y + dy };
					if (this.level.passable(at.x, at.y) && !this.groundItemAt(at.x, at.y)) {
						this.spawnGroundItem('meat', at.x, at.y);
						break;
					}
				}
			}
			//CausticSlime.rollToDropLoot() (CausticSlime.java, tag v3.3.8): past the shared
			//weapon roll, a GooBlob drops on a free neighbour - inside the same `maxLvl + 2`
			//gate (the override returns before super.rollToDropLoot() when overleveled).
			if (creature.kind === 'causticSlime' && !overleveled) {
				const at = Roguelike.neighbourOffsets(8)
					.map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))
					.find((cell) => this.level.passable(cell.x, cell.y)
						&& !this.groundItemAt(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
				if (at) this.spawnGroundItem('food', at.x, at.y, { id: 'gooBlob', quantity: 1, identified: true, sourceClass: 'GooBlob' });
			}
		}

		//Necromancer.die kills its skeleton with it (SpectralNecromancer shares this unchanged)
		if ((creature.kind === 'necromancer' || creature.kind === 'spectralNecromancer') && creature.skeleton && creature.skeleton.hp > 0) {
			this.say(t('port.log.skeletoncollapses'));
			this.kill(creature.skeleton);
		}
		this.kingLinkedAdds.delete(creature);
		//`KingDamager.onDetach()`: every P2-wave add carries the King's own HT/12
		//(HT/18 on the challenge), dealt to him when the add dies - through the
		//P2 shield like any hit, which is also what ends P2 (see `kingDamageHook`).
		//The per-add `kingDamager` flag is the buff: P1/P3 servants never carry it,
		//so the P1->P2 cull below chips nothing. Conversion off the ENEMY alignment
		//detaches it in Java too - unmodeled here (stated).
		if (creature.kingDamager === true) {
			const king = this.creatures.find((c) => c.kind === 'king' && c.hp > 0 && (c.kingPhase ?? 1) === 2);
			if (king && (king.kingShield ?? 0) > 0) {
				const chip = Math.floor(king.maxHp / (isChallengeEnabled('stronger_bosses') ? 18 : 12));
				king.kingShield = Math.max(0, (king.kingShield ?? 0) - chip);
				this.lockedFloorBossDamage(king, chip, 0); //`m.damage(HT/12)` -> `DwarfKing.damage()`'s addTime
				this.kingDamageHook(king);
			}
		}
		//RotHeart.die(): every RotLasher on the level dies with it (the same shape as the
		//necromancer rule above - Java iterates `Dungeon.level.mobs` the same way).
		if (creature.kind === 'rotHeart') {
			for (const other of [...this.creatures]) {
				if (other.kind === 'rotLasher' && other.hp > 0) this.kill(other);
			}
			//RotHeart.die() (RotHeart.java, tag v3.3.8) also drops a Rotberry.Seed at its
			//cell - but only on a real die(): Burning destroys the heart through destroy(),
			//skipping death processing entirely (no seed, and none of the +2000 quest score
			//either - the score itself stays unmodeled, this port tracks no quest-score
			//table). The kill cause carries the distinction (`fire` for the burn path).
			if (cause !== 'fire') {
				this.spawnGroundItem('seed', creature.x, creature.y, sourceInventoryItem('seed', 'Rotberry', (kind) => this.newItemInstanceId(kind)));
			}
		}
		//YogDzewa.processFistDeath(): the last fist's death at phase 4 opens phase 5 (hope
		//yell, a -15 minion-burst debt that 	akeYogTurn`'s summon loop spends down over the
		//following turns, and `BossHealthBar.bleed(true)` - a bar flag, latched here, not
		//damage over time).
		if (creature.kind === 'yogFist') {
			const yog = this.creatures.find((c) => c.kind === 'yog' && c.hp > 0);
			if (yog && (yog.yogPhase ?? 1) === 4 && !this.creatures.some((c) => c.kind === 'yogFist' && c.hp > 0)) {
				yog.yogPhase = 5;
				yog.yogSummonCd = -15;
				this.bossBleedLatched = true;
				this.say(t('actors.mobs.yogdzewa.hope'), 'warning');
			}
		}

		//Imp quest: Monks and Golems drop DwarfTokens half the time on City depths
		if ((creature.kind === 'monk' || creature.kind === 'golem') && this.depth >= 16 && this.depth <= 19 && Random.chance(0.5)) {
			this.spawnGroundItem('dwarfToken', creature.x, creature.y);
			this.say(t('port.log.dropstoken', { who: capitalize(creature.name) }));
		}

		//`Mob.die()`: an enemy dying while marked by `Trap.HazardAssistTracker` counts
		//toward `Statistics.hazardAssistedKills` and the `ENEMY_HAZARDS` badge (10 assists).
		if (!creature.isHero && !creature.isAlly && !creature.isNPC && creature.buffs['hazardAssist'] !== undefined) {
			this.awardBadge('hazard_assists');
		}
		//`Piranha.die()` (`Piranha.java`, tag `v3.3.8`): every piranha death counts
		//toward `Statistics.piranhasKilled` and the `PIRANHAS` badge at 6 - any
		//cause, including beaching (`dieOnLand` funnels through `die` too).
		if (creature.kind === 'piranha' || creature.kind === 'phantomPiranha') this.awardBadge('piranhas');
		const boss = creature.kind ? BOSSES[this.depth] : undefined;
		if (boss && boss.kind === creature.kind) {
			//`boss.victory` used to be raw English text authored directly in `bossTransitions` -
			//a real i18n gap, since `say()` never translates its argument (unlike every other
			//call site here, which passes a 	('port.â€¦')` key). It now authors a message key
			//(`port.log.bossvictory.<region>`) instead, translated the same way every other
			//port-invented log line is.
			this.say(t(boss.victory), 'positive');
			//`GameScene.bossSlain()`: the BOSS_SLAIN banner plus the BOSS sound, gated on the hero
			//surviving (`Dungeon.hero.isAlive()`). The banner is stage-level so its 5s hold plays
			//out over the floor the port enters immediately below, the way Java's plays over the
			//game the player keeps after the kill.
			if (this.hero.hp > 0) {
				runState.audio.cue('boss');
				const slain = new Banner(runState.sprites.bannerBossSlain);
				slain.show(0xffffff, 0.3, 5);
				this.showBanner(slain);
			}
			//boss badges, one per chapter (BOSS_SLAIN_1..4), plus `BOSS_CHALLENGE_1..5` when
			//`qualifiedForBossChallengeBadge` survived (weapon-only kill).
			if (creature.kind === 'goo') {
				this.awardBadge('boss_goo');
				if (this.qualifiedForBossChallenge) this.awardBadge('boss_challenge_goo');
			}
			if (creature.kind === 'tengu') {
				this.awardBadge('boss_tengu');
				if (this.qualifiedForBossChallenge) this.awardBadge('boss_challenge_tengu');
			}
			if (creature.kind === 'dm300') {
				this.awardBadge('boss_dm300');
				if (this.qualifiedForBossChallenge) this.awardBadge('boss_challenge_dm300');
			}
			if (creature.kind === 'king') {
				this.awardBadge('boss_king');
				if (this.qualifiedForBossChallenge) this.awardBadge('boss_challenge_king');
				for (const add of [...this.kingAdds]) if (add.hp > 0) this.kill(add);
				//`DwarfKing.die()`: the real `defeated` yell, the Warlock Degrade
				//cleanse ("mainly for convenience"), and the LloydsBeacon upgrade.
				//The throne-heap spill has no heap seam to land in (stated).
				this.say(t('actors.mobs.dwarfking.defeated'), 'warning');
				delete this.hero.buffs['degrade'];
				const beacon = this.beaconArtifactItem();
				if (beacon) beacon.level = (beacon.level ?? 0) + 1;
				//DwarfKing.java drops a non-upgradable King's Crown as a heap. Granted to the
				//bag instead: the crown has no ground-pickup path here (unlike the Amulet,
				//which does), so a dropped crown would sit unpickable on the arena floor.
				this.bag.add({ id: 'kingsCrown', quantity: 1, stackable: true, identified: true });
				this.say(t('port.log.pickup', { item: t('items.kingscrown.name') }), 'positive');
			}
			if (creature.kind === 'yog') {
				if (this.qualifiedForBossChallenge) this.awardBadge('boss_challenge_yog');
				//`YogDzewa.die()` kills every summoned minion: Larva, YogRipper, YogEye,
				//YogScorpio (fists die through their own `YogFist.die()` cascade). The list
				//used to omit `'larva'`, so larvae outlived their summoner - found by the
				//13th monster-analysis matrix (bosses).
				for (const minion of this.creatures.filter((c) => c.kind !== undefined && ['yogFist', 'larva', 'ripperDemon', 'eye', 'scorpio'].includes(c.kind))) this.kill(minion);
			}
			if (creature.kind === 'tengu') {
				//`Tengu.die()` drops a `TengusMask` at his cell (wear it to choose a subclass). Granted
				//to the bag instead of the floor, like the Dwarf King's crown: a heap on the arena floor
				//has no pickup path of its own here. The hero must still wear it (`useTengusMask`).
				this.bag.add({ id: 'tengusMask', quantity: 1, stackable: true, identified: true });
				this.say(t('port.log.pickup', { item: t('items.tengusmask.name') }), 'positive');
				this.applyTenguDeathTransition();
				return;
			}
			//Java never auto-descends: each level's own `unseal()` (called from the boss's
			//`die()`) reopens a real, walkable exit and the hero walks out. The four calls
			//below are this port's `unseal()`s; each opens its own exit stairs in place of
			//the old shared `depth++`/`enterLevel()`.
			if (creature.kind === 'goo') {
				applyGooDeathUnseal(this.bossUnsealContext());
				return;
			}
			if (creature.kind === 'dm300') {
				applyDM300DeathUnseal(this.bossUnsealContext());
				return;
			}
			if (creature.kind === 'king') {
				applyKingDeathUnseal(this.bossUnsealContext());
				return;
			}
			if (creature.kind === 'yog') {
				applyYogDeathUnseal(this.bossUnsealContext());
				return;
			}
			this.depth++;
			this.deepestDepth = Math.max(this.deepestDepth, this.depth);
			this.justDescended = true;
			this.enterLevel();
		} else {
			this.say(t('port.log.dies', { who: capitalize(creature.name) }));
		}

		//Ghost.Quest.process() on any of the three minibosses' deaths
		if (creature.kind === 'fetidRat' || creature.kind === 'gnollTrickster' || creature.kind === 'greatCrab') {
			this.gameState.setSwitch('ghostTargetSlain', true);
			this.quests.advanceStage('sadGhost', this.gameState);
			this.say(t('port.npc.ghost.echo'));
		}
		if (creature.kind === 'gnollSapper' || creature.kind === 'gnollGeomancer') this.gnollMineDied(creature);
	},

	/** `RingOfWealth.tryForBonusDrop()` (tag v3.3.8): decrement the persistent missed-drop
	 * tracker by the mob's roll count and generate a bonus once it crosses zero. Java gives
	 * bosses 15 rolls and minibosses 5; ordinary mobs get one. The port's available item
	 * families are narrower than Generator's full consumable/equipment catalogue, but the
	 * independent escalating tracker is retained and every generated reward is a real,
	 * playable ground payload. */
		tryWealthBonusDrop(this: DungeonScene, creature: Creature, rolls: number): void {
			const bonus = ringWealthBonus(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing());
			if (bonus <= 0) return;
			const rng = {
				int: (n: number) => Random.int(n),
				float: () => Random.float(),
				normalIntRange: (min: number, max: number) => Random.normalRange(min, max),
			};
			//Java creates both counters lazily on the first roll of the run (`Buff.affect` + `countUp`),
			//which is why they live as -1 sentinels here.
			if (this.wealthTriesToDrop < 0 || this.wealthDropsToEquip < 0) {
				const fresh = initialiseWealthTrackers(rng);
				if (this.wealthTriesToDrop < 0) this.wealthTriesToDrop = fresh.triesToDrop;
				if (this.wealthDropsToEquip < 0) this.wealthDropsToEquip = fresh.dropsToEquip;
			}
			//`equipBonus` is Java's own capped loop over the *equipped* wealth rings; this port has one
			//ring slot, so it sees a single level, but the cap rule is kept in the helper because it is
			//what makes the number for a hero wearing two.
			const trackers: WealthTrackers = { triesToDrop: this.wealthTriesToDrop, dropsToEquip: this.wealthDropsToEquip };
			const { plans, trackers: next } = planWealthDrops(trackers, rolls, bonus, wealthEquipBonus([bonus]), rng);
			this.wealthTriesToDrop = next.triesToDrop;
			this.wealthDropsToEquip = next.dropsToEquip;
			for (const plan of plans) this.materialiseWealthDrop(plan, { x: creature.x, y: creature.y });
		},

	/** The six Yog fist zaps (`YogFist.doAttack`'s ranged branch + each subclass's `zap()`).
	 * Delivery keeps the port's existing clear-line hook (nearest visible hero/ally within
	 * 6 - Java's own gate is a sight-limited `MAGIC_BOLT` line with no fixed range, so the
	 * longer half of that line is a stated residual). The effects map to the shared
	 * status/blob primitives: Dark's Light weakening has no light subsystem here and stays
	 * a documented omission, and the zap visuals (`MagicMissile`, steam bursts, leaf
	 * particles, screen flashes) are presentation only.
	 *
	 * `YogFist.canAttack`: while `rangedCooldown` is above 0 only melee is allowed, so a
	 * cooling elemental fist returns false here and the dispatch steps it closer instead.
	 * Bright/dark never accumulate cooldown (their `incrementRangedCooldown` is a no-op)
	 * and zap every ranged turn. The cooldown is added up front by `doAttack`, before the
	 * subclass zap runs - hence below, on every elemental zap once a target exists,
	 * hit or miss. */
	yogFistRangedTurn(this: DungeonScene, fist: Creature): boolean {
		const type = fist.yogFistType ?? 'burning';
		if (type !== 'bright' && type !== 'dark' && (fist.fistZapCd ?? 0) > 0) return false;
		const target = this.rangedTarget(fist, 6);
		if (!target) return false;
		//`doAttack` adds the cooldown before the subclass zap runs, so a missed soiled
		//zap still cools the fist down. `Random.NormalFloat(8, 12)` is two independent
		//float draws summed, halved, and spread over the range - mwg's live `Random` has
		//no `normalFloat`, so the same shape is written out (the seeded `SpdRandom`
		//stream belongs to levelgen, not live combat).
		if (type !== 'bright' && type !== 'dark') {
			fist.fistZapCd = (fist.fistZapCd ?? 0) + 8 + ((Random.float() + Random.float()) / 2) * 4;
		}
		if (type !== 'bright' && type !== 'dark' && type !== 'soiled') {
			//Only SoiledFist and BrightFist/DarkFist roll `hit()` on their zaps - and soiled
			//only for the roots. Every other zap lands unconditionally (magic, never rolled).
		} else if (!rollHit(fist, target, true)) {
			if (type !== 'soiled') this.say(t('port.log.boltmisses', { who: capitalize(fist.name) }), 'negative');
			else this.spreadFistGrass(target, () => Random.int(5) === 0);
			return true;
		}
		this.spawnProjectile(fist, target);
		switch (type) {
			case 'burning': {
				//`BurningFist.zap()`: a target on water evaporates the cell instead of
				//igniting (steam visuals unmodeled), otherwise Burning is reignited -
				//never a fresh overwrite - and fire tops up to 4 across the 3x3. The zap
				//itself deals no direct damage in Java; the old flat `[18, 36]` bolt plus
				//single-cell `seed 4` here were both invented.
				if (this.level.get(target.x, target.y) === WATER) {
					this.level.set(target.x, target.y, FLOOR);
				} else {
					reigniteBuff(target, 'burning');
				}
				this.topUpFistFire(target);
				break;
			}
			case 'soiled':
				//`SoiledFist.zap()`: roots only on a landed `hit()` (3 turns, the table's
				//own duration), while the grass grows across the 3x3 regardless (1-in-5
				//tall) - including on a miss, which is why the miss branch above spreads
				//grass instead of logging. `Invisibility.dispel(this)` needs no model:
				//this port's monsters never turn invisible.
				addBuff(target, 'roots');
				this.spreadFistGrass(target, () => Random.int(5) === 0);
				break;
			case 'rotting': this.toxicGas.seed(target.x, target.y, 100); break;
 			case 'rusted': addBuff(target, 'cripple', 4); break;
			case 'bright': case 'dark': {
				//`BrightFist.zap()` (`LightBeam`) / `DarkFist.zap()` (`DarkBolt`): a rolled
				//`NormalIntRange(10, 20)` magic hit - the only fist zaps that deal direct
				//damage - plus Bright's half-duration Blindness (the table's 5-turn `daze`)
				//or Dark's `Light.weaken(50)` (no light model here). A lethal zap on the
				//hero validates the enemy-magic death badge in Java; this port's death
				//causes have no magic bucket (electric kills already land in `foe`), so
				//both land there too - stated, not silent.
				let dealt = Random.normalRange(10, 20);
				if (target.isHero) dealt = this.absorbHeroDamage(dealt, true);
				target.hp -= dealt;
				this.showDamage(target, dealt);
				if (type === 'bright') addBuff(target, 'daze');
				this.say(t('port.log.bolthits', { who: capitalize(fist.name), damage: dealt }), 'negative');
				if (target.hp <= 0) this.kill(target);
				return true;
			}
		}
		return true;
	},

	/** `YogDzewa.act()`'s `regularSummons` deck (`actors/mobs/YogDzewa.java`, tag `v3.3.8`):
	 * built once per Yog from the live spawner count (`Statistics.spawnersAlive` - here
	 * the live `demonSpawner` creatures, the only ones observable mid-fight), shuffled,
	 * then drawn cyclically. Normal: the first `spawnersAlive` slots are rippers, the
	 * rest larvae; challenge: eye/scorpio under the count, larvae to index 4, rippers
	 * for the last two (see `buildYogMinionDeck`). Every arrival is `maxLvl = -2`
	 * (`YogRipper`/`YogEye`/`YogScorpio`/`Larva`), i.e. the shared `noExp` flag: no XP
	 * and no loot, like the King's servants. Simplified and stated: Java builds the deck
	 * at Yog construction on the dungeon-wide counter (including skipped off-floor
	 * spawners); this port builds it at the first summon from the live arena count,
	 * since the spawn path cannot see the scene roster. */
	summonYogMinion(this: DungeonScene, yog: Creature): boolean {
		const challenge = isChallengeEnabled('stronger_bosses');
		if (!yog.yogMinionDeck) {
			const spawnersAlive = this.creatures.filter((c) => c.kind === 'demonSpawner' && c.hp > 0).length;
			const deck = buildYogMinionDeck(challenge, spawnersAlive);
			Random.shuffle(deck);
			yog.yogMinionDeck = deck;
			yog.yogSummonIndex = 0;
		}
		const deck = yog.yogMinionDeck;
		const index = yog.yogSummonIndex ?? 0;
		const kind = deck[index % deck.length]!;
		yog.yogSummonIndex = index + 1;
		const at = chooseYogSpawnCell({
			yog: { x: yog.x, y: yog.y },
			hero: { x: this.hero.x, y: this.hero.y },
			occupantAt: (x, y) => {
				const occupant = this.creatureAt(x, y);
				if (!occupant) return null;
				return occupant.kind === 'sheep' ? 'sheep' : 'blocked';
			},
		});
		if (!at) return false;
		//Java's kill-a-sheep fallback (`Actor.findChar(spawnPos).die(null)`): the
		//port's `kill()` returns before XP/loot for allies, the same path sheep
		//expiry already uses, so the minion inherits a clean cell either way.
		if (at.killSheep) {
			const sheep = this.creatureAt(at.x, at.y);
			if (sheep) this.kill(sheep);
		}
		const minion = this.spawnMonster(kind, at);
		minion.sleeping = false;
		minion.seesHero = true;
		minion.lastSeen = { x: this.hero.x, y: this.hero.y };
		//`YogRipper`/`YogEye`/`YogScorpio`/`Larva` are all `maxLvl = -2`: arrivals grant
		//no XP and roll no loot - the same `noExp` flag the King's servants carry.
		minion.noExp = true;
		return true;
	},

	/** `Bones.leave()`: seeded runs leave gold; normal runs may leave eligible carried/equipped loot. */
	bonesEligible(this: DungeonScene, item: { id: string; sourceClass?: string }): boolean {
		const value = `${item.id}|${item.sourceClass ?? ''}`.toLowerCase();
		// Item.bones defaults to false in Java. These are the concrete classes represented by
		// the port that explicitly opt out; keeping the list class-based also handles a generated
		// item whose playable family is only a stand-in (weaponReward/armorReward/cloak).
		const never = [
			'clotharmor', 'warriorarmor', 'magearmor', 'roguearmor', 'huntressarmor', 'duelistarmor', 'clericarmor',
			'berry', 'brokenseal', 'spiritbow', 'cloakofshadows', 'pickaxe',
			'dagger', 'gloves', 'magesstaff', 'rapier', 'throwingstone', 'throwingknife', 'throwingspike',
			//`Bomb` never sets `bones = true` (`Item.bones` defaults false), so neither form
			//is preserved - without this, bombs would enter bones through the live bag.
			//CorpseDust likewise (a single-use quest item, not bones material).
			'bomb', 'doublebomb', 'corpsedust',
		];
		return !never.some((name) => value.includes(name));
	},

	leaveBones(this: DungeonScene): void {
		const gold = this.heroStats.base('gold');
		const goldPayload = (): GroundItem['item'] => ({
			id: 'gold',
			quantity: gold > 100 ? Random.range(50, Math.max(50, Math.floor(gold / 2))) : 50,
			identified: true,
		});
		let item: NonNullable<GroundItem['item']> = goldPayload()!;
		if (!this.seededRun) {
			// Bones.pickItem(): the Java code first chooses equipment/quickslot (2/3) or
			// eligible backpack loot (1/3), recursively retrying an empty equipment slot.
			// Keep the same draw order; this port represents unsupported equipped categories
			// through their corresponding carried item when one exists.
			const backpack = this.bag.items.filter((carried) =>
				!['gold', 'waterskin', 'crystalKey', 'ironKey'].includes(carried.id)
				&& this.bonesEligible(carried));
			const equipmentCandidate = (choice: number): NonNullable<GroundItem['item']> | null => {
				switch (choice) {
					case 0: return this.weaponId !== 'startingWeapon' && this.bonesEligible({ id: this.weaponId })
						? { id: 'weaponReward', quantity: 1, identified: true, level: this.weaponLevel, sourceClass: this.weaponId }
						: null;
					case 1: return this.armorId !== 'clothArmor' && this.bonesEligible({ id: this.armorId })
						? { id: 'armorReward', quantity: 1, identified: true, level: this.armorLevel, sourceClass: this.armorId }
						: null;
					case 2: return backpack.find((carried) => carried.id === 'cloak' || carried.id.includes('artifact')) ?? null;
					case 3: return backpack.find((carried) => !carried.id.startsWith('ring_')) ?? null;
					case 4: return backpack.find((carried) => carried.id.startsWith('ring_')) ?? null;
					default: return backpack[0] ?? null; // quickslot placeholder in this port
				}
			};
			let picked: NonNullable<GroundItem['item']> | null = null;
			while (!picked) {
				if (Random.int(3) !== 0) {
					picked = equipmentCandidate(Random.int(7));
				} else {
					// Java's `if (Random.Int(3) < items.size())` falls through to Gold
					// immediately when the backpack has no eligible entries.
					if (Random.int(3) < backpack.length) picked = Random.element(backpack)!;
					else break;
				}
			}
			if (picked) {
				item = { ...picked, quantity: picked.quantity > 1
					? Random.range(1, Math.max(1, Math.floor((picked.quantity + 1) / 2)))
					: 1 };
			}
		}
		const kind = portItemKind(item.id) ?? 'gold';
		this.bones.save('pending', {
			depth: Math.max(this.depth, this.deepestDepth - 5),
			branch: this.miningBranchActive ? 1 : 0,
			kind,
			item,
		});
	},

	/** Rebuild the feature definitions for a newly generated floor. Definitions are code; only
	 * the placed cell/kind pairs are persisted, matching MWG's FeatureLayer contract. */
	resetPortedFeatures(this: DungeonScene): void {
		this.portedFeatures = new Roguelike.FeatureLayer<DungeonScene>();
		for (const kind of ['awareness', 'health', 'waterOfAwareness', 'waterOfHealth']) {
			this.portedFeatures.define(`well:${kind}`, {
				persistent: false,
				consequence: (cell, scene) => scene.usePortedWellAtCell(cell),
			});
		}
	},

	placePortedFeature(this: DungeonScene, cell: number, kind: string): void {
		if (kind.startsWith('well:')) {
			this.portedFeatures.place(cell, kind);
			return;
		}
		const plantKind = `plant:${kind}`;
		this.portedFeatures.define(plantKind, {
			persistent: false,
			consequence: (featureCell, scene) => scene.triggerPortedPlantAt(featureCell % scene.level.width, Math.floor(featureCell / scene.level.width)),
		});
		this.portedFeatures.place(cell, plantKind);
	},

	restorePortedFeatures(this: DungeonScene, data?: { cells: [number, string][] }): void {
		this.resetPortedFeatures();
		const cells = data?.cells ?? this.portedPaint?.plants.map((plant) => [
			plant.pos,
			plant.kind.startsWith('wellWater:') ? `well:${plant.kind.slice('wellWater:'.length)}` : `plant:${plant.kind}`,
		] as [number, string]) ?? [];
		for (const [cell, kind] of cells) {
			if (kind.startsWith('plant:')) {
				this.portedFeatures.define(kind, {
					persistent: false,
					consequence: (featureCell, scene) => scene.triggerPortedPlantAt(featureCell % scene.level.width, Math.floor(featureCell / scene.level.width)),
				});
			}
			this.portedFeatures.place(cell, kind);
		}
	},

	creatureAt(this: DungeonScene, x: number, y: number): Creature | null {
		return this.creatures.find((c) => c.x === x && c.y === y) ?? null;
	},

	// -------------------------------------------------------------- drawing

	/** `Level.updateFieldOfView`'s smoke clause (tag `v3.3.8`): a gaze is blocked when a
	 * `SmokeScreen` cell (`cur > 0`) lies strictly between viewer and target - the smoky
	 * endpoints themselves stay visible, the way shadowcasting keeps its blocking cells
	 * lit. The ray is MWG's Bresenham 	raceLine`, an approximation of Java's
	 * `ShadowCaster` that only ever removes visibility, never adds it. Callers decide
	 * WHO it applies to: Java blocks every char's sight except allies and the gnoll
	 * geomancer ("allies and specific enemies can see through shrouding fog"). */
	smokeBlocksSight(this: DungeonScene, ax: number, ay: number, bx: number, by: number): boolean {
		if (this.smokeScreen.total() <= 0) return false;
		for (const cell of Roguelike.traceLine({ x: ax, y: ay }, { x: bx, y: by })) {
			if ((cell.x === ax && cell.y === ay) || (cell.x === bx && cell.y === by)) continue;
			if (this.smokeScreen.volumeAt(cell.x, cell.y) > 0) return true;
		}
		return false;
	},

	/** Drops the smoke-hidden cells from a computed sight set - the hero's merged sight
	 * (own FOV plus the hawk-shared cells; Java has no sharing, so the merged set is
	 * pruned as one) and the fist-teleport search's own. */
	pruneSmokeFromSight(this: DungeonScene, fov: Roguelike.FieldOfView, hx: number, hy: number): void {
		if (this.smokeScreen.total() <= 0 || this.hero.buffs.blobImmunity !== undefined) return;
		for (const index of [...fov.visible]) {
			const x = index % this.level.width, y = Math.floor(index / this.level.width);
			if ((x !== hx || y !== hy) && this.smokeBlocksSight(hx, hy, x, y)) {
				fov.visible.delete(index);
			}
		}
	},

	refresh(this: DungeonScene): void {
		this.fov.update(this.hero.x, this.hero.y, this.viewRadius());
		this.shareAllyVision();
		this.pruneSmokeFromSight(this.fov, this.hero.x, this.hero.y);

		// FogOfWar owns explored shading and half-wall occlusion above every world layer.
		// Keep water quads disabled while unexplored, but do not darken explored art twice.
		for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
			this.waterSurface?.setCellColor(x, y, this.fov.isExplored(x, y) || this.fov.isVisible(x, y) ? 0xffffff : 0);
		}
		this.fog?.refresh(this.visualTerrainAt, (x, y) =>
			this.fov.isVisible(x, y) ? 0 : this.fov.isExplored(x, y) ? 1 : 3);
		this.wallBlocking?.setLayerData('blocking', Array.from(this.tileVariance, (_, cell) =>
			this.depth === 25 ? -1 : wallBlockingFrame(cell % this.level.width, Math.floor(cell / this.level.width),
				this.level.width, this.level.height, this.visualTerrainAt,
				(x, y) => this.level.inside(x, y) && (this.fov.isExplored(x, y) || this.fov.isVisible(x, y)))));

		//MindVision: while active, every ordinary monster's position shows through walls/fog,
		//same as Java's real "see_mobs" reveal - NPCs and the hero are unaffected (not Mobs).
		const mindVision = !!this.hero.buffs['mindvision'];
		for (const creature of this.creatures) {
			//`TalismanOfForesight.CharAwareness`: a scried creature keeps rendering outside the
			//hero's field of view for `5 + 2*level()` turns, which is what Java's `Dungeon.observe()`
			//does with the buff attached - here the mark is consulted directly, since this port has no
			//per-char observe flag.
			//`Talent.SEER_SHOT`: cells under a seer-shot reveal stay creature-visible while
			//their own timer runs (see `procSeerShot`) - area-limited `mindvision`.
			this.sprite(creature).visible = creature.isHero === true || this.fov.isVisible(creature.x, creature.y)
				|| (mindVision && !creature.isNPC) || this.awareCreatures.has(creature)
				|| this.seerCells.has(this.level.index(creature.x, creature.y))
				//`DivineSenseTracker` (`Level.updateVisibility()`, tag `v3.3.8`): the same
				//reveal while the 50-turn tracker runs. Java limits it to `4+4*points`
				//tiles; this port's `mindvision` channel is already range-unbounded
				//(stated at its site), so the tracker rides it with no new divergence.
				|| (!!this.hero.buffs['divineSense'] && !creature.isNPC);
		}
		if (this.stairsSprite) {
			this.stairsSprite.visible = this.fov.isExplored(this.stairs.x, this.stairs.y);
			this.stairsSprite.tint = 0xffffff;
		}
		//a stacked heap draws only its top entry (`Heap.peek()`), the last one at each cell
		const heapTops = new Map<number, typeof this.groundItems[number]>();
		for (const item of this.groundItems) heapTops.set(this.level.index(item.x, item.y), item);
		for (const item of this.groundItems) {
			this.sprite(item).visible = heapTops.get(this.level.index(item.x, item.y)) === item && this.fov.isExplored(item.x, item.y);
			// `Bomb.glowing()` (`items/bombs/Bomb.java`, tag `v3.3.8`): keep lit fuses red
			// through FOV/heap refreshes; an armed Noisemaker stays lit after its fuse is spent.
			const litBomb = item.kind === 'bomb' && (item.item?.fuseTurns !== undefined || item.item?.noisemakerArmed === true);
			this.sprite(item).tint = litBomb ? 0xff4444 : 0xffffff;
		}

		const boss = BOSSES[this.depth];
		const region = regionForDepth(this.depth);
		const place = boss
			? t('port.ui.lair', { boss: t(MOB_KEYS[boss.kind]) })
			: t('port.ui.place', { region: t(REGION_KEYS[region]), depth: this.depth });
		//The bag is represented by a count in the compact HUD; the full list and item actions live
		//in the modal inventory window, rather than in a string reformatted every turn. See
		//PORT_COVERAGE.md's "UI and presentation" table.
		const carriedCount = this.bag.items.filter((i) => i.quantity > 0).length;
		this.statusPane.update({
			place,
			seed: this.runSeedLabel,
			level: this.progression.level,
			hp: this.hero.hp,
			maxHp: this.hero.maxHp,
			//SPD's own `hero.exp / hero.maxExp()` is progress *within* the level, exp resetting
			//to 0 on each level-up. mwg's Progression keeps a running total instead, so the
			//level's own span is subtracted back out here to get the same fraction.
			exp: this.progression.experience - SPD_LEVEL_CURVE.experienceFor(this.progression.level),
			maxExp:
				SPD_LEVEL_CURVE.experienceFor(this.progression.level + 1) -
				SPD_LEVEL_CURVE.experienceFor(this.progression.level),
			accuracy: this.hero.accuracy,
			evasion: this.hero.evasion,
			strength: this.heroStr,
			gold: this.heroStats.base('gold'),
			waterskin: this.waterskin,
			waterskinMax: WATERSKIN_MAX,
			hunger: this.hunger >= 450 ? 'starving' : this.hunger >= 300 ? 'hungry' : 'none',
			//The guard's buff-map value is a re-armed sentinel, not a duration: the
			//status pane (icon text, info window) reads the pool instead, which is
			//what Java's `iconTextDisplay()`/`desc()` show (`(int)HP`, `{0}/{1}`).
			buffs: [...Object.entries(this.hero.buffs).map(([id, turns]) => ({ id: id as BuffId, turns: id === 'prismaticGuard' ? Math.floor(this.hero.prismaticGuardHp ?? 0) : turns })),
				//`LockedFloor` has no `iconTextDisplay()` override: icon only.
				...(this.regeneration.lockLeft !== null ? [{ id: 'lockedFloor' as BuffId, turns: undefined }] : [])],
			staff: this.heroClass === 'mage' ? { current: this.wandCharges.current, max: this.wandCharges.max } : null,
			ammo: CLASS_AMMO.has(this.heroClass) ? this.ammo : null,
			carriedCount,
			armorTier: this.armorTier,
			interfaceSize: this.interfaceSize,
			busy: !this.awaitingInput && !this.gameOver,
			talentPointsAvailable: this.talentPoints.some((points) => points > 0),
		});
		//`KeyDisplay.updateKeys()` (tag `v3.3.8`): only counts `Notes.KeyRecord`s whose `depth`
		//equals the current one (a stale key from an earlier floor shows as a single black icon
		//instead - not ported, stated at `pickupPayload`'s depth stamp); this HUD drops a stale
		//key's count entirely rather than folding it into the black-icon stand-in.
		//`KeyDisplay`: per-depth counts summed over every matching entry - `find`
		//returns the first entry only, which undercounts split same-kind stacks
		//(and reads 0 when the stale entry sorts first).
		const keyOfDepth = (id: string): number => this.bag.items.reduce((sum, it) =>
			sum + (it.id === id && (it as { depth?: number }).depth === this.depth ? it.quantity : 0), 0);
		this.dungeonHud.update({
			place,
			keys: {
				iron: keyOfDepth('ironKey'),
				golden: keyOfDepth('goldenKey'),
				crystal: keyOfDepth('crystalKey'),
			},
		});
		this.refreshInventoryPanel();
		this.refreshTalentPanel();

		//Java's `ActionIndicator`: the prepared strike is available exactly while Preparation is
		//up, so the toolbar's contextual button follows `hero.prepLevel`. When it appears or goes
		//the interface re-sits itself, since the button occupies layout space above the toolbar.
		if (this.actionBar.setPreparationAvailable(this.hero.prepLevel !== undefined)) {
			this.positionInterface(Game.current.width, Game.current.height);
		}
		//The armor-ability button carries the charge percent in its label, so it reports a change
		//on every percent of regen rather than only when it appears or goes.
		if (this.actionBar.setArmorAbility(this.armorAbilityLabel())) {
			this.positionInterface(Game.current.width, Game.current.height);
		}
		//Java's `QuickslotButton`s mirror the assigned items; slots holding items that left
		//the bag clear themselves rather than using a stale reference.
		if (this.actionBar.setQuickslots(this.quickslotStates())) {
			this.positionInterface(Game.current.width, Game.current.height);
		}

		this.refreshHealthBars();
	},

	/**
	 * A health bar over every damaged, visible creature, `ui/CharHealthIndicator.java`: it
	 * spans `sprite.width * 4/6` starting `width/6` in, sits 2px above the sprite, and is
	 * visible only while `HP < HT`. Colours are `HealthBar.java`'s own (`COLOR_BG 0xCC0000`
	 * behind, `COLOR_HP 0x00EE00` in front).
	 */
	refreshHealthBars(this: DungeonScene): void {
		//`BossHealthBar.assignBoss(GnollGeomancer)` once the pickaxe's third strike wakes it (`hits == 3`).
		const boss = this.creatures.find((creature) => creature.kind && (BOSSES[this.depth]?.kind === creature.kind
			|| (creature.kind === 'gnollGeomancer' && (creature.geomancerHits ?? 0) >= 3)
			//`BossHealthBar.assignBoss(CrystalSpire)` from its third pickaxe strike (`hits == 3`).
			|| (creature.kind === 'crystalSpire' && (creature.spireHits ?? 0) >= 3)));
		if ((boss ?? null) !== this.currentBoss) this.bossBleedLatched = false;
		this.currentBoss = boss ?? null;
		if (boss && boss.hp > 0) {
			this.bossChrome.visible = true;
			this.bossHealthBar.visible = true;
			this.bossNameLabel.visible = true;
			this.bossNameLabel.text = `${Math.max(0, boss.hp)}/${boss.maxHp}`;
			const fraction = boss.hp / boss.maxHp;
			this.bossHealthBar.setValue(Math.max(0, fraction));
		//`BossHealthBar.bleed`: a one-shot colour swap when HP crosses 25%, not a
		//continuous flash - Java's own `update()` only re-tints on the boolean's *edge*.
		//`bossBleedLatched` ORs in the transition-latched `bleed(true)` (King P3, Yog P5),
		//which Java sets regardless of the HP fraction.
		const bleeding = fraction < 0.25 || this.bossBleedLatched;
			if (bleeding !== this.bossBleeding) {
				this.bossBleeding = bleeding;
				this.bossHealthBar.setColor(bleeding ? 0xff7777 : 0xffffff);
				this.bossNameLabel.setColor(bleeding ? 0xff3030 : theme().color.textHighlight);
			}
		} else {
			this.bossChrome.visible = false;
			this.bossHealthBar.visible = false;
			this.bossNameLabel.visible = false;
			this.bossBleeding = false;
			this.bossBleedLatched = false;
		}
		for (const creature of this.creatures) {
			const hurt = creature.hp < creature.maxHp && creature.hp > 0;
			const show = hurt && !creature.isHero && this.sprite(creature).visible;

			let bar = this.healthBars.get(creature);
			if (!show) {
				if (bar) bar.visible = false;
				continue;
			}
			if (!bar) {
				//Port-original accessibility work (ROADMAP.md section 8 - Java's own bar is
				//this same green-on-red, so there is no source to diverge from, only this
				//port's own `settings.colorblind()` swap): the filled/missing portions read
				//as similarly dark under red-green colorblindness, so `colorblind()` swaps
				//to the same Okabe-Ito-derived safe pair `ui/spdTheme.ts`'s `SPD_STATUS_COLOR`
				//already uses (bluish-green filled, vermillion missing). Read once at bar
				//creation, matching this map's own per-creature caching - a mid-run settings
				//toggle only affects bars created after it, a stated simplification.
				bar = new Bar({
					width: TILE * (4 / 6),
					height: 1,
					color: colorblind() ? 0x009e73 : 0x00ee00,
					background: colorblind() ? 0xd55e00 : 0xcc0000,
					roundUpToPixel: true,
				});
				this.healthBars.set(creature, bar);
				this.camera.world.addChild(bar);
			}
			bar.visible = true;
			bar.x = creature.x * TILE + TILE / 6;
			bar.y = creature.y * TILE - 2;
			bar.setValue(creature.hp / creature.maxHp);
		}
	},

	/**
	 * Run persistence through mwg/core's SaveSystem (named slot, versioned, plain JSON -
	 * Dungeon.saveGame's bundle simplified: stats, bag and quests are flat JSON, while visited
	 * floors retain their mutable terrain, entities and effects as sprite-free snapshots.
	 */
	saveRun(this: DungeonScene): void {
		if (!this.miningBranchActive) this.captureActiveFloor();
		this.saves.save('run', {
			runSeed: this.runSeed,
			runSeedLong: this.runSeedLong.toString(),
			seededRun: this.seededRun,
		depth: this.depth,
		deepestDepth: this.deepestDepth,
		mobsToChampion: this.mobsToChampion,
		miningBranchActive: this.miningBranchActive,
			hp: this.hero.hp,
			maxHp: this.hero.maxHp,
			level: this.progression.level,
			experience: this.progression.experience,
			progressionState: this.progression.toJSON(),
			attackSkill: this.heroAttackSkill,
			defenseSkill: this.heroDefenseSkill,
			gold: this.heroStats.base('gold'),
			str: this.heroStr,
			heroStatsState: this.heroStats.toJSON(),
		weaponLevel: this.weaponLevel,
		weaponTier: this.weaponTier,
		armorLevel: this.armorLevel,
		armorTier: this.armorTier,
			weaponId: this.weaponId,
			weaponInstanceId: this.weaponInstanceId,
			weaponSourceClass: this.weaponSourceClass,
			armorId: this.armorId,
			armorInstanceId: this.armorInstanceId,
			waterskin: this.waterskin,
			hunger: this.hunger,
			hungerPartialDamage: this.hungerPartialDamage,
			ammo: this.ammo,
			ammoSourceClass: this.ammoSourceClass,
			ammoTippedSeed: this.ammoTippedSeed,
			ammoDurability: this.ammoDurability,
			missileLevel: this.missileLevel,
			ammoSetId: this.ammoSetId,
			missileThresholds: [...this.missileThresholds],
			dustSpawnPower: this.dustSpawnPower,
			frostWand: this.frostWand,
			wandType: this.wandType,
			ghostSpawned: this.ghostSpawned,
			ghostType: this.ghostType,
			wandmakerSpawned: this.wandmakerSpawned,
			wandmakerQuestType: this.wandmakerType,
			wandmakerWands: wandmakerQuestWands() ?? undefined,
			shopkeeperSpawned: this.shopSpawnedDepths.has(6),
			shopkeeperWarned: this.shopkeeperWarned,
			shopSpawnedDepths: [...this.shopSpawnedDepths],
			shops: [...this.shopStocks.entries()].map(([depth, stock]) => ([
				depth,
				{
					potions: stock.find('potion')?.quantity ?? 0,
					identifies: stock.find('scrollIdentify')?.quantity ?? 0,
					buyback: this.shopBuybackShelves.get(depth) ?? [],
				},
			] as [number, { potions: number; identifies: number; buyback: { id: string; quantity: number; identified?: boolean }[] }])),
			blacksmithSpawned: this.blacksmithSpawned,
			impSpawned: this.impSpawned,
			limitedDrops: Object.entries(this.limitedDrops) as [MonsterId, number][],
			droppedBags: [...this.droppedBags],
			reclaimedTrap: this.reclaimedTrap,
			wealthTriesToDrop: this.wealthTriesToDrop,
			wealthDropsToEquip: this.wealthDropsToEquip,
			suckerPunchTargets: [...this.suckerPunchTargets],
			upgradeScrollDrops: this.upgradeScrollDrops,
			blacksmithAlternative: this.blacksmithAlternative,
			blacksmithQuestType: this.blacksmithQuestType,
			blacksmithQuestStarted: this.blacksmithQuestStarted,
			blacksmithFavor: this.blacksmithFavor,
			blacksmithBossBeaten: this.blacksmithBossBeaten,
			hallsBossSealed: this.hallsBossSealed,
			cavesBossSealed: this.cavesBossSealed,
			sewerBossSealed: this.sewerBossSealed,
			cityBossSealed: this.cityBossSealed,
			bossUnsealedDepths: [...this.bossUnsealedDepths],
			tenguFightStarted: this.tenguFightStarted,
			qualifiedForBossChallenge: this.qualifiedForBossChallenge,
			resurrectPending: this.resurrectPending,
			interfaceSize: this.interfaceSize,
			quickslots: this.quickslots.map((slot) => slot ? { ...slot } : null),
			weaponCharge: this.weaponCharge,
			weaponPartialCharge: this.weaponPartialCharge,
			spinSpins: this.spinSpins,
			spinTurns: this.spinTurns,
			cleaveFreeTurns: this.cleaveFreeTurns,
			guardTurns: this.guardTurns,
			comboClobberUsed: this.comboClobberUsed,
			comboParryUsed: this.comboParryUsed,
			comboInitialTime: this.comboInitialTime,
			swordDanceTurns: this.swordDanceTurns,
			defensiveStanceTurns: this.defensiveStanceTurns,
			chargedShotArmed: this.chargedShotArmed,
			clAbilityWeaponClass: this.clAbilityWeaponClass,
			clAbilityWeaponInstanceId: this.clAbilityWeaponInstanceId,
			clAbilityTurns: this.clAbilityTurns,
			heroActionClock: this.heroActionClock,
			recentHitClocks: [...this.recentHitClocks],
			blacksmithPickaxeAvailable: this.blacksmithPickaxeAvailable,
			blacksmithPickaxeFree: this.blacksmithPickaxeFree,
			blacksmithReforges: this.blacksmithReforges,
			blacksmithHardens: this.blacksmithHardens,
			blacksmithUpgrades: this.blacksmithUpgrades,
			blacksmithSmiths: this.blacksmithSmiths,
			weaponHardened: this.weaponHardened,
			weaponCursed: this.weaponCursed,
			weaponCursedKnown: this.weaponCursedKnown,
			weaponIdentified: this.weaponIdentified,
			armorIdentified: this.armorIdentified,
			armorHardened: this.armorHardened,
			armorCursed: this.armorCursed,
			armorCursedKnown: this.armorCursedKnown,
			bag: this.bag.items.map((i) => ({ id: i.id, quantity: i.quantity, instanceId: i.instanceId, identified: i.identified, level: i.level, sandBags: (i as typeof i & { sandBags?: number }).sandBags, charges: (i as typeof i & { charges?: number }).charges, affix: i.affix, cursed: i.cursed,
				wandCur: (i as typeof i & { wandCur?: number }).wandCur, wandPartial: (i as typeof i & { wandPartial?: number }).wandPartial, wandMax: (i as typeof i & { wandMax?: number }).wandMax,
				returnDepth: (i as typeof i & { returnDepth?: number }).returnDepth, returnBranch: (i as typeof i & { returnBranch?: number }).returnBranch,
				returnPos: (i as typeof i & { returnPos?: number }).returnPos, returnX: (i as typeof i & { returnX?: number }).returnX, returnY: (i as typeof i & { returnY?: number }).returnY,
				cursedKnown: (i as typeof i & { cursedKnown?: boolean }).cursedKnown,
				usesLeftToIdentify: (i as typeof i & { usesLeftToIdentify?: number }).usesLeftToIdentify,
				availableUsesToIdentify: (i as typeof i & { availableUsesToIdentify?: number }).availableUsesToIdentify,
				durability: (i as typeof i & { durability?: number }).durability,
				maxDurability: (i as typeof i & { maxDurability?: number }).maxDurability,
				seal: (i as typeof i & { seal?: boolean }).seal, blessed: (i as typeof i & { blessed?: boolean }).blessed })),
			bagState: this.bag.toJSON(),
			bagDefinitions: [...new Map(this.bag.items.map((item) => [item.id, { stackable: item.stackable, weight: item.weight } as Actors.ItemDefinition]))],
			bagSources: this.bag.items.map((item) => ({
				id: item.id,
				instanceId: item.instanceId,
				sandBags: (item as typeof item & { sandBags?: number }).sandBags,
				charges: (item as typeof item & { charges?: number }).charges,
			wandCur: (item as typeof item & { wandCur?: number }).wandCur,
			wandPartial: (item as typeof item & { wandPartial?: number }).wandPartial,
			wandMax: (item as typeof item & { wandMax?: number }).wandMax,
				sourceClass: (item as typeof item & { sourceClass?: string }).sourceClass,
				cursedKnown: (item as typeof item & { cursedKnown?: boolean }).cursedKnown,
				usesLeftToIdentify: (item as typeof item & { usesLeftToIdentify?: number }).usesLeftToIdentify,
				availableUsesToIdentify: (item as typeof item & { availableUsesToIdentify?: number }).availableUsesToIdentify,
				durability: (item as typeof item & { durability?: number }).durability,
				maxDurability: (item as typeof item & { maxDurability?: number }).maxDurability,
				seal: (item as typeof item & { seal?: boolean }).seal,
				blessed: (item as typeof item & { blessed?: boolean }).blessed,
				returnDepth: (item as typeof item & { returnDepth?: number }).returnDepth,
				returnBranch: (item as typeof item & { returnBranch?: number }).returnBranch,
				returnPos: (item as typeof item & { returnPos?: number }).returnPos,
				returnX: (item as typeof item & { returnX?: number }).returnX,
				returnY: (item as typeof item & { returnY?: number }).returnY,
				missileSet: (item as typeof item & { missileSet?: string }).missileSet,
				tippedSeed: (item as typeof item & { tippedSeed?: string }).tippedSeed,
				//`HolyTome` charge/exp/level (`bagSources` side channel, like the spare-wand
				//`wandCur` trio - `bagState` itself is not trusted with them).
				tomeCharge: (item as typeof item & { charge?: number }).charge,
				tomePartialCharge: (item as typeof item & { partialCharge?: number }).partialCharge,
				tomeExp: (item as typeof item & { exp?: number }).exp,
				tomeLevel: (item as typeof item & { level?: number }).level,
			})),
			staffImbue: staffImbueFor(this),
			itemSerial: this.itemSerial,
			appearances: this.appearances.toJSON(),
			switches: this.gameState.toJSON().switches,
			questStages: this.quests.toJSON().stageIndex,
			equippedRing: this.equippedRing,
			ringTypesKnown: [...ringTypesKnownFor(this)],
			ringHtBonus: this.ringHtBonus,
			advancement: this.advancement.toJSON(),
			talentPoints: this.talentPoints,
			charges: {
				wand: this.wandCharges.toJSON(),
				tome: this.tomeCharges.toJSON(),
				fire: this.fireCharges.toJSON(),
				bolt: this.boltCharges.toJSON(),
			},
			talentAccuracy: this.talentAccuracy,
			talentEvasion: this.talentEvasion,
			talents: Object.entries(this.talentRanks),
			heroShield: this.heroBarrier.total + this.blockingBarrier.total,
			heroBarrierState: this.heroBarrier.toJSON(),
			ascendedBarrierState: this.ascendedBarrier.toJSON(),
			ascendedTurns: this.ascendedTurns,
			ascendedSpellCasts: this.ascendedSpellCasts,
			ascendedFlashCasts: this.ascendedFlashCasts,
			ascendedDivineCast: this.ascendedDivineCast,
			trinityForm: this.trinityForm,
			trinityTurns: this.trinityTurns,
			trinityBodyAffix: this.trinityBodyAffix,
			skeletonKeyTracker: this.skeletonKeyTracker,
			trinityBodyGlyph: this.trinityBodyGlyph,
			trinitySpiritEffect: this.trinitySpiritEffect,
			trinityMindEffect: this.trinityMindEffect,
			livingEarthArmor: this.livingEarthArmor,
			livingEarthWandLevel: this.livingEarthWandLevel,
			earthrootArmorLevel: this.earthrootArmor?.level ?? 0,
			earthrootArmorPos: this.earthrootArmor?.pos ?? -1,
				barkskinLevel: this.hero.barkskinLevel,
				barkskinInterval: this.hero.barkskinInterval,
				barkskinCooldown: this.hero.barkskinCooldown,
			regrowthTotalChargesUsed: this.regrowthTotalChargesUsed,
			regrowthChargesOverLimit: this.regrowthChargesOverLimit,
			barrierPartialLoss: this.barrierPartialLoss,
			regenPartial: this.regeneration.partial,
			lockedFloorLeft: this.regeneration.lockLeft,
			blockingBarrierState: this.blockingBarrier.toJSON(),
			blockingTurnsLeft: this.blockingTurnsLeft,
			sealBarrierState: this.sealBarrier.toJSON(),
			sealPartialGain: this.sealPartialGain,
			armorSealed: this.armorSealed,
			stealthTalentTicks: this.stealthTalentTicks,
			empoweredZaps: this.empoweredZaps,
			enhancedRingsTurns: this.enhancedRingsTurns,
			seerShotCooldown: this.seerShotCooldown,
			seerCells: [...this.seerCells],
			cloakChargeProgress: this.cloakChargeProgress,
			cloakStealthTurnsToCost: this.cloakStealthTurnsToCost,
			natureBerriesDropped: this.natureBerriesDropped,
			berryCounter: this.berryCounter,
			burningIncrement: this.burningIncrement,
			intuitionTracker: this.intuitionTracker,
			wandBonusDamage: this.wandBonusDamage,
			physicalBonusDamage: this.physicalBonusDamage,
			physicalBonusAttacks: this.physicalBonusAttacks,
			patientStrikeReady: this.patientStrikeReady,
			holdFastX: this.holdFastX,
			holdFastY: this.holdFastY,
			preciseAssaultReady: this.preciseAssaultReady,
			healingEvasionTurns: this.healingEvasionTurns,
			sungrassHealing: this.sungrassHealing,
			sungrassPartial: this.sungrassPartial,
 			healingLeft: this.healingLeft,
 			healingPercent: this.healingPercent,
 			healingFlat: this.healingFlat,
			sungrassPos: this.sungrassPos,
			deathlessFuryUsed: this.deathlessFuryUsed,
			alchemyEnergy: this.alchemyEnergy,
			weaponAffix: this.weaponAffix,
			weaponCurseDurability: this.weaponCurseDurability,
			weaponAugment: this.weaponAugment,
			charmTargets: [...this.charmTargets.entries()],
			charmIgnoreNextHit: [...this.charmIgnoreNextHit],
			armorGlyph: this.armorGlyph,
			armorAbility: this.armorAbility,
			armorCharge: this.armorCharge,
			endureTurns: this.endureTurns,
			endureEnduring: this.endureEnduring,
			endureBanked: this.endureBanked,
			endureHits: this.endureHits,
			doubleJumpTurns: this.doubleJumpTurns,
			naturesPowerTurns: this.naturesPowerTurns,
			naturesPowerExtensions: this.naturesPowerExtensions,
			doubleMarkArmed: this.doubleMarkArmed,
			warpBeacon: this.warpBeacon ? { ...this.warpBeacon } : null,
			deferredDamage: this.hero.deferredDamage,
			deferredDamageDelay: this.hero.deferredDamageDelay,
			corrosionTurns: this.hero.corrosionTurns,
			corrosionDamage: this.hero.corrosionDamage,
			prismaticGuardHp: this.hero.prismaticGuardHp ?? null,
			shieldOfLightTarget: this.hero.shieldOfLightTarget ?? null,
			recallItemClass: this.hero.recallItemClass ?? null,
			kineticStored: this.kineticStored,
			elementalFurrow: this.elementalFurrow,
			timeBubbleTurns: this.timeBubbleTurns,
			timeBubblePresses: [...this.timeBubblePresses],
			hourglassFreeze: this.hourglassFreeze,
			hourglassTurnsToCost: this.hourglassTurnsToCost,
			buffs: Object.entries(this.hero.buffs) as [BuffId, number][],
			//Java's `Preparation.storeInBundle` writes `turnsInvis` independently of the
			//invisibility buff; preserve that counter so a mid-stealth save keeps its damage/blink tier.
			prepInvisibleTurns: this.prepInvisibleTurns,
			mnemonicExtended: [...this.mnemonicExtended],
			floors: [...this.floorStates],
			fallenItems: [...fallenItemStore(this)],
		});
		this.say(t('port.log.saved'), 'positive');
	},
};
