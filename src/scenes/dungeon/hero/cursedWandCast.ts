import { setupChallengeArena } from '../challengeArena';
import type { DungeonScene } from '../../dungeonScene';
import { Random, Roguelike } from 'mwg';
import { BUFF_DURATION, addBuff, buffBlocked, doomDamage, reigniteBuff, type Creature, type Step } from '../../../combat';
import { CURSED_PLANT_KINDS, CURSED_RANDOM_GAS, cursedForestFireSeeds, cursedInterfloorDepthWeights, pickBurnAndFreeze, pickConeOfColorsStatus, pickCursedCommonEffect, pickCursedEquipmentSlot, pickCursedRandomAreaEffect, pickCursedRareEffect, pickCursedTier, pickCursedUncommonEffect, pickCursedVeryRareEffect, cursedGoldenMimicSpawnCell } from '../../../simulation/cursedWand';
import { isChallengeEnabled } from '../../../challenges';
import { activateGeyserTrap as activateGeyserTrapFlow } from '../../../simulation/geyserTrap';
import { applyBlastDamage } from '../../../items/bombEffects';
import { MWL_BOMB_RULES } from '../../../mwlContent';
import { isPlantBlocked } from '../../../challenges';
import { getArmorCurses, getWeaponCurses } from '../../../items/itemCurses';
import { WAND_TYPES } from '../../../items/wands';
import { WATER } from '../../../dungeonConstants';
import { t } from '../../../i18n/index';
import { runState } from '../../../runState';
import { spawnTrapSpecks } from '../../../ui/effectBursts';
import { BOSSES, BOSS_KINDS, FLYING_KINDS, IMMOVABLE_KINDS, MINIBOSS_KINDS } from '../../../monsters';
import { coneCells } from '../../../mechanics/cone';
import { Cat, randomUsingDefaults } from '../../../items/generator';
import { generatedInventoryItem } from '../../../items/generatedItems';
import { groundKindForItem } from '../../../items/itemKinds';
import { arcaneVisionDuration, soulMarkDuration, soulMarkProcThreshold } from '../../../talentEffects';
import { talismanArtifactProcPlan } from '../../../items/talisman';
import { resinExtraCurseChance, resinPositiveCurseChance } from '../../../simulation/trinkets';
import { trinketLevelOf } from '../trinkets';

/** `CursedWand.cursedZap()` (`items/wands/CursedWand.java`, tag `v3.3.8`) - moved verbatim from
 * `armorAbilityUse.ts` as the file-size refactor's extraction once `activateWildMagic`'s cursed
 * branch grew past that group's own budget, behavior-identical. Called from `activateWildMagic`;
 * `simulation/cursedWand.ts` carries the full scoping rationale for what is and isn't ported. */
/** The origin wand's `buffedLvl()` for the effect `castCursedWandEffect` is currently
 * dispatching. Java reads `origin.buffedLvl()` at each `tryForWandProc` call site, but the
 * tier handlers are dispatched without their origin (that exact dispatch text is pinned by
 * `verifyArmorAbilities.mjs`), so the level rides this slot for the duration of one effect. */
let cursedProcWandLevel = 0;

export const cursedWandCastMethods = {
	/** `ForestFire.effect()` (`CursedWand.java`, tag `v3.3.8`): seed Regrowth 15 on every
	 * level cell. This scene seam is shared by the VeryRare dispatcher. The caller separately
	 * seeds Java's random Fire cells only when WondrousResin did not roll positiveOnly. */
	castCursedWandForestFire(this: DungeonScene): void {
		for (const seed of cursedForestFireSeeds(this.level.width, this.level.height)) this.regrowth.seed(seed.x, seed.y, seed.volume);
	},

	/** `CursedWand.cursedZap()`'s tier roll plus effect dispatch. Called once per selected cursed
	 * spare in `activateWildMagic`'s firing loop in place of a normal `fireWandShot`. `target` is
	 * the same resolved aim the normal branch computes (occupant, else the original target) and
	 * may be `undefined`; `cell` is the bolt's own collision cell. */
	castCursedWandEffect(this: DungeonScene, target: Creature | undefined, cell: Step, origin: { instanceId: string; level?: number }, forcePositive = false): void {
		//`tryForWandProc` reads `origin.buffedLvl()`; Java's `buffedLvl()` only subtracts
		//Degrade, which this port never applies to wands, so the stored level is the figure.
		//Java's `cursedZap()` rolls `Random.Float()` before selecting the tier, even without
		//Resin (its chance is then zero); keep that draw ahead of every tier/effect draw.
		//The Float roll still happens during Java's forcePositive callback; the static flag
		//then overrides its result for the bonus zap.
		const positiveRoll = Random.float();
		const positiveOnly = forcePositive || positiveRoll < resinPositiveCurseChance(trinketLevelOf(this, 'trinketWondrousResin'));
		cursedProcWandLevel = origin.level ?? 0;
		const tier = pickCursedTier((bound) => Random.int(bound));
		if (tier === 'common') this.castCursedWandCommonEffect(target, cell, positiveOnly);
		else if (tier === 'uncommon') this.castCursedWandUncommonEffect(target, cell, positiveOnly);
		else if (tier === 'rare') this.castCursedWandRareEffect(target, cell, positiveOnly);
		else this.castCursedWandVeryRareEffect(cell, origin, positiveOnly);
	},

	/** `WildMagic.zapWand()` and `MindForm` set `WondrousResin.forcePositive` only around
	 * the second cursed zap. Keep their callback chance draw separate from the inner
	 * `cursedZap()` positive chance draw, which is still consumed even while forced. */
	tryResinExtraCursedZap(this: DungeonScene, target: Creature | undefined, cell: Step,
		origin: { instanceId: string; level?: number }): boolean {
		const level = trinketLevelOf(this, 'trinketWondrousResin');
		if (Random.float() >= resinExtraCurseChance(level)) return false;
		this.castCursedWandEffect(target, cell, origin, true);
		return true;
	},

	/** `CursedWand.tryForWandProc()` -> `Wand.wandProc(target, origin.buffedLvl(), 1)`
	 * (`CursedWand.java:135-138`, `Wand.java:210-245`, tag `v3.3.8`): every proc-eligible
	 * cursed effect runs the whole `wandProc` tail on a live non-hero collision target. All
	 * five Java legs run here exactly as they do on an ordinary zap (`turnLoopAiming.ts`'s
	 * `fireWandShot`): Arcane Vision marks the victim on the port's per-creature
	 * `awareCreatures` map (Java's target-ID `CharAwareness`, same `5 + 5*rank` duration -
	 * this replaces the old all-mobs Mind Vision stand-in, which predated that seam),
	 * Warlock SoulMark on Java's `1 - 0.92^(lvl*charges+1) - 0.07` chance at the fixed
	 * `chargesUsed = 1`, then the shared Priest-detonate / Searing-Light / Sunray-blind plan
	 * (`talismanArtifactProcPlan`, the same figure `Artifact.artifactProc()` uses, at Java's
	 * `hero.lvl + 5` Priest damage). The null/hero test is Java's own guard
	 * (`target != null && target != Dungeon.hero && origin instanceof Wand`). The port's
	 * corpse gate (stated at the ordinary zap site) applies too: Java procs a target the
	 * effect just killed, a no-op once `kill()` has run. Like Java's `wandProc` the level
	 * is an argument (`origin.buffedLvl()` - here the origin wand's stored level, passed
	 * by every call site as `cursedProcWandLevel`, which the dispatcher sets from
	 * `origin`); `buffedLvl()` only subtracts Degrade, which this port never applies to
	 * wands. */
	applyCursedWandProc(this: DungeonScene, target: Creature | null | undefined, wandLevel: number): void {
		if (!target || target === this.hero || target.hp <= 0) return;
		const rank = this.talentRank('arcane_vision');
		if (rank > 0) {
			this.awareCreatures.set(target, Math.max(this.awareCreatures.get(target) ?? 0, arcaneVisionDuration(rank)));
		}
		if (this.subclass() === 'warlock' && Random.float() > soulMarkProcThreshold(wandLevel, 1)) {
			addBuff(target, 'soulmark', soulMarkDuration(wandLevel));
		}
		const zapPlan = talismanArtifactProcPlan({
			heroClass: this.heroClass,
			heroSubclass: this.subclass() ?? undefined,
			heroLevel: this.progression.level,
			targetIsAlly: target.isAlly === true || target.isHero === true,
			targetIlluminated: target.buffs['illuminated'] !== undefined,
			searingLightRank: this.talentRank('searing_light'),
			searingLightCooldown: this.hero.buffs['searingLightCooldown'] !== undefined,
			sunrayRank: this.talentRank('sunray'),
		});
		if (zapPlan.consumeIlluminated) {
			delete target.buffs['illuminated'];
			this.applyCharacterDamage(target, zapPlan.illuminatedDamage, {
				pierceArmor: true, cause: 'foe',
				onNonWeaponBossDamage: (v) => this.disqualifyBossChallenge(v),
			});
		}
		if (target.hp > 0) {
			if (zapPlan.applyIlluminated) addBuff(target, 'illuminated');
			if (zapPlan.armSearingLightCooldown) addBuff(this.hero, 'searingLightCooldown', BUFF_DURATION.searingLightCooldown);
			if (zapPlan.sunrayChance > 0 && Random.int(20) < zapPlan.sunrayChance) {
				addBuff(target, 'blindness', zapPlan.sunrayBlindTurns);
			}
		}
	},

	/** `CursedWand.cursedZap()`'s VeryRare tier (`CursedWand.java`, tag `v3.3.8`: eight effects). Ported: `SinkHole`, `GravityChaos`, `SuperNova`,
	 * All eight outcomes are dispatched. `SpawnGoldenMimic`, `RandomTransmogrify` and `HeroShapeShift` use generated loot, the exact Wild Magic wand instance and a temporary cosmetic class sheet respectively; Golden Mimic uses the existing Mimic visuals because this port has no dedicated golden sheet. */
	castCursedWandVeryRareEffect(this: DungeonScene, cell: Step, origin: { instanceId: string }, positiveOnly = false): void {
		//`randomValidVeryRareEffect`: re-roll until `valid()`; SinkHole refuses on boss floors, past depth 25
		//and off the main branch (`PitfallTrap`'s own gate). `RandomTransmogrify` also requires its
		//exact origin Wand to remain in the bag; `HeroShapeShift` passes because this caster is the hero.
		const sinkHoleAllowed = !(this.depth in BOSSES) && this.depth <= 25 && !this.miningBranchActive;
		let effect;
		do effect = pickCursedVeryRareEffect((bound) => Random.int(bound));
		while ((effect === 'sinkHole' && !sinkHoleAllowed)
			|| (effect === 'randomTransmogrify' && !positiveOnly && !this.bag.find('wand', origin.instanceId)));
		if (effect === 'spawnGoldenMimic') {
			const at = cursedGoldenMimicSpawnCell(cell, !!this.creatureAt(cell.x, cell.y),
				(x, y) => this.level.inside(x, y) && this.level.passable(x, y),
				(x, y) => this.creatureAt(x, y) !== null, (bound) => Random.int(bound));
			if (!at) return;
			let payload = '';
			if (!positiveOnly) {
				const cat = Random.element([Cat.WEAPON, Cat.ARMOR, Cat.RING, Cat.WAND])!;
				let reward = randomUsingDefaults(cat);
				while ((reward.level ?? 0) < 1) reward = randomUsingDefaults(cat);
				const family = cat === Cat.WEAPON ? 'weapon' : cat === Cat.ARMOR ? 'armor' : cat === Cat.RING ? 'ring' : 'wand';
				payload = `${family}|${reward.cls};level:${reward.level}`;
			}
			const mimic = this.spawnMonster('mimic', at, false, payload);
			mimic.maxHp = Math.max(mimic.maxHp + 1, Math.round(mimic.maxHp * 1.33));
			mimic.hp = mimic.maxHp;
			mimic.damage = [Math.round(mimic.damage[0] * 1.33), Math.round(mimic.damage[1] * 1.33)];
			this.revealMimic(mimic);
			if (positiveOnly) mimic.isAlly = true;
		} else if (effect === 'randomTransmogrify') {
			if (positiveOnly) {
				//Java opens ScrollOfMetamorphosis' item chooser here. This port has no equivalent
				//choice window yet; do not consume the wand or invent a random target.
				this.say(t('items.wands.cursedwand.transmogrify_wand'), 'positive');
				return;
			}
			const categories = [Cat.WEAPON, Cat.ARMOR, Cat.RING, Cat.ARTIFACT] as const;
			const cat = Random.element(categories)!;
			let generated = randomUsingDefaults(cat);
			while (generated.cursed) generated = randomUsingDefaults(cat);
			generated.level = Math.max(1, generated.level ?? 0);
			generated.cursed = true;
			const item = generatedInventoryItem(generated, { newItemInstanceId: (kind) => this.newItemInstanceId(kind) });
			item.cursed = true; item.cursedKnown = true;
			this.bag.remove('wand', 1, origin.instanceId);
			this.spawnGroundItem(groundKindForItem(item, 'food'), this.hero.x, this.hero.y, item);
			this.say(t('items.wands.cursedwand.transmogrify_wand'), 'warning');
		} else if (effect === 'heroShapeShift') {
			const classes = ['warrior', 'mage', 'rogue', 'huntress', 'duelist', 'cleric'].filter((id) => id !== this.heroClass);
			this.hero.heroDisguiseClass = Random.element(classes) as typeof this.hero.heroDisguiseClass;
			this.hero.buffs['heroDisguise'] = 1000;
			this.refreshHeroArmorSprite();
			this.say(t('items.wands.cursedwand.disguise'), 'warning');
		} else if (effect === 'forestFire') {
			this.castCursedWandForestFire();
			//Java: Fire 10 at `Level.randomDestination(null)` until `Random.Int(5) == 0`; the
			//port's `randomFreeCell` stands in for randomDestination (it also skips occupied cells).
			if (!positiveOnly) do {
				const fireCell = this.randomFreeCell(this.hero);
				if (fireCell) this.fire.seed(fireCell.x, fireCell.y, 10);
			} while (Random.int(5) !== 0);
			runState.audio.cue('teleport', 0.7);
			this.say(t('items.wands.cursedwand.grass'), 'positive');
			if (!positiveOnly) this.say(t('items.wands.cursedwand.fire'), 'warning');
		} else if (effect === 'superNova') {
			//`SuperNova.effect()`: `harmsAllies` is the inverse of WondrousResin's positiveOnly.
			this.superNova = { x: cell.x, y: cell.y, depth: this.depth, turnsLeft: 10, harmsAllies: !positiveOnly };
			this.say(t('items.wands.cursedwand.supernova'), positiveOnly ? 'positive' : 'warning');
		} else if (effect === 'gravityChaos') {
			//`GravityChaos.effect()`: `Buff.append(GravityChaosTracker)` on the caster with Java's
			//positiveOnly ally filter. Lasts `NormalIntRange(30, 70)` pushes.
			this.gravityChaos = { left: Math.round(Random.normalRange(30, 70)), wait: 0, positiveOnly };
			runState.audio.cue('teleport', 0.7);
			this.say(t('items.wands.cursedwand.gravity'), positiveOnly ? 'positive' : 'warning');
		} else if (effect === 'sinkHole') {
			//`SinkHole.effect()` (tag `v3.3.8`): Java queues a radius-5 `DelayedPit`, then after one turn drops
			//non-flying characters and ordinary heaps in the area. This wand path remains simplified: it
			//drops only the hero immediately and leaves mobs/heaps in place because it does not queue the
			//area-collapse phase now used by the PitfallTrap path.
			const reach = this.pathfinder.distanceMap({ x: this.hero.x, y: this.hero.y });
			for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
				const steps = reach[this.level.index(x, y)] ?? -1;
				if (steps >= 0 && steps <= 5 && this.fov.isVisible(x, y)) spawnTrapSpecks(this.effectLayer, this.effectBursts, x, y, 'pitfall');
			}
			this.say(t('items.wands.cursedwand.sinkhole'), positiveOnly ? 'positive' : 'warning');
			if (!positiveOnly) this.pitfallDrop();
		} else if (effect === 'abortRetryFail') {
			//Java saves, then shows an English-only "CURSED WAND ERROR" dialog whose every button calls
			//`Game.instance.finish()`. Deliberate divergence: a web port must not close the tab, so the
			//joke is a warning line and the zap is consumed (Java's non-English path also does nothing).
			this.say('CURSED WAND ERROR: this application will now self-destruct', 'warning');
		}
	},

	/** `SuperNovaTracker.act()` (tag `v3.3.8`), once per hero action: ten countdown ticks, then a
	 * `ConjuredBomb` at every non-solid cell of a radius-8 field of view from the target cell (a
	 * cell inside takes up to nine bombs). Java ticks per actor time unit and waits while the hero is
	 * on another floor; this ticks per hero action on the same floor only. Deliberate reductions:
	 * the growing halo/floating countdown and `Level.destroy(cell)` (door/barricade removal) are not
	 * presented, and FOV reads terrain transparency in place of Java's `solid`. */
	tickSuperNova(this: DungeonScene): void {
		const nova = this.superNova;
		if (!nova || nova.depth !== this.depth) return;
		if (nova.turnsLeft-- > 0) return;
		this.superNova = null;
		const fov = new Roguelike.FieldOfView(this.level);
		fov.update(nova.x, nova.y, 8);
		const cells: { x: number; y: number }[] = [];
		for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
			if (fov.isVisible(x, y) && this.level.transparent(x, y)) cells.push({ x, y });
		}
		runState.audio.cue('blast', 0.7);
		this.shakeScreen(5, 2);
		for (const cell of cells) this.explodeConjuredBomb(cell, nova.harmsAllies ?? true);
	},

	/** `GravityChaosTracker.act()` (`v4.0.0`), once per hero action: on each of its `left` turns (spaced
	 * `IntRange(1, 3)` apart) every non-IMMOVABLE character, the hero included, is thrown 3 cells in one
	 * shared random `NEIGHBOURS8` direction, and sleeping mobs wake. **Simplified:** a push stops at a wall or
	 * occupant and before a chasm cell (Java's `throwChar` lets a non-flyer fall), and a character blocked by
	 * another is not re-pushed the same turn once the blocker moves (Java's `blocked` retry loop). */
	tickGravityChaos(this: DungeonScene): void {
		const gravity = this.gravityChaos;
		if (!gravity) return;
		if (gravity.wait > 0) { gravity.wait--; return; }
		const [dx, dy] = Random.element(Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>)!;
		for (const ch of [...this.creatures]) {
			if (ch.hp <= 0 || (ch.kind !== undefined && IMMOVABLE_KINDS.has(ch.kind))) continue;
			if (gravity.positiveOnly && (ch.isHero || ch.isAlly)) continue;
			if (ch.sleeping) ch.sleeping = false;
			let last: Step | undefined;
			for (let step = 1, x = ch.x, y = ch.y; step <= 3; step++) {
				x += dx; y += dy;
				if (!this.level.inside(x, y) || !this.level.passable(x, y) || this.creatureAt(x, y) !== null) break;
				if (this.isChasmCell(x, y) && !ch.flying) break;
				last = { x, y };
			}
			if (last) this.moveTo(ch, last);
		}
		if (--gravity.left <= 0) {
			this.gravityChaos = null;
			runState.audio.cue('degrade', 0.7);
			this.say(t('items.wands.cursedwand.gravity_end'), 'warning');
		} else gravity.wait = Random.int(3);
	},

	/** `new Bomb.ConjuredBomb().explode(cell)`, shared by `Explosion` and `SuperNova`. */
	explodeConjuredBomb(this: DungeonScene, cell: { x: number; y: number }, harmsAllies = true): void {
		const rule = MWL_BOMB_RULES.standard;
		if (rule && rule.baseBlast) {
			const context = this.bombEffectsContext();
			for (let y = cell.y - rule.affectedRadius; y <= cell.y + rule.affectedRadius; y++) {
				for (let x = cell.x - rule.affectedRadius; x <= cell.x + rule.affectedRadius; x++) {
					if (!this.level.inside(x, y) || Roguelike.chebyshevDistance(cell, { x, y }) > rule.affectedRadius) continue;
					if (context.isFlammableTerrain(x, y)) context.burnFlammableTerrain(x, y);
				}
			}
			const chained = new Set<string>();
			for (const other of [...context.groundItems]) {
				if (!context.groundItems.includes(other) || Roguelike.chebyshevDistance(cell, other) > rule.affectedRadius) continue;
				context.explodeGroundItem(other, chained);
			}
			const lo = rule.minBase + rule.minPerDepth * this.depth;
			const hi = rule.maxBase + rule.maxPerDepth * this.depth;
			for (const victim of [...context.creatures]) {
				if (victim.isNPC || victim.hp <= 0 || (!harmsAllies && (victim.isHero || victim.isAlly)) || !this.level.passable(victim.x, victim.y)
					|| Roguelike.chebyshevDistance(cell, victim) > rule.affectedRadius) continue;
				applyBlastDamage(victim, Math.max(0, Random.normalRange(lo, hi)), false, context);
			}
		}
	},

	/** `CursedWand.cursedZap()`'s Common tier (all eight of Java's Common `CursedEffect`s,
	 * picked uniformly). `RandomGas`/`Bubbles` run regardless of whether anything stands at
	 * `cell`. */
	castCursedWandCommonEffect(this: DungeonScene, target: Creature | undefined, cell: Step, positiveOnly = false): void {
	const targetCanTeleport = target !== undefined && target.hp > 0
			&& (target.kind === undefined || !IMMOVABLE_KINDS.has(target.kind));
		let effect;
		do effect = pickCursedCommonEffect((bound) => Random.int(bound));
		while (positiveOnly && effect === 'randomTeleport' && !targetCanTeleport);
		if (effect === 'burnAndFreeze') {
			const { userStatus, targetStatus } = pickBurnAndFreeze(Random.int(2) === 0);
			if (!positiveOnly) {
				if (userStatus === 'burning') reigniteBuff(this.hero, 'burning');
				else this.hero.buffs['frost'] = Math.max(this.hero.buffs['frost'] ?? 0, BUFF_DURATION.frost);
			}
			if (target && target.hp > 0) {
				if (targetStatus === 'burning') reigniteBuff(target, 'burning');
				else target.buffs['frost'] = Math.max(target.buffs['frost'] ?? 0, BUFF_DURATION.frost);
			}
			this.applyCursedWandProc(target, cursedProcWandLevel);
		} else if (effect === 'randomTeleport') {
			//RandomTeleport.effect(): a live, non-IMMOVABLE target teleports on a coin flip;
			//anything else (no target, IMMOVABLE, or the flip losing) teleports the caster
			//instead - the hero here, which is never IMMOVABLE, so that branch always lands.
			const targetEligible = targetCanTeleport;
			const mover = targetEligible && (positiveOnly || Random.int(2) === 0) ? target : this.hero;
			const from = { x: mover.x, y: mover.y };
			const destination = this.randomFreeCell(mover);
			if (mover === target) this.applyCursedWandProc(target, cursedProcWandLevel);
			if (destination) {
				this.moveTo(mover, destination);
				this.playTeleportAppear(from, destination, mover);
			}
		} else if (effect === 'randomGas') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			const gas = CURSED_RANDOM_GAS[Random.int(CURSED_RANDOM_GAS.length)]!;
			if (gas.id === 'confusionGas') this.confusionGas.seed(cell.x, cell.y, gas.volume);
			else if (gas.id === 'toxicGas') this.toxicGas.seed(cell.x, cell.y, gas.volume);
			else this.paralyticGas.seed(cell.x, cell.y, gas.volume);
		} else if (effect === 'bubbles') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//Bubbles.effect(): a harmless particle burst plus a cell press this port doesn't
			//model (no generic arbitrary-cell trap/plant press seam) - genuinely a no-op here
			//beyond the tier draw itself, matching Java's own "fun, harmless" cursed outcome.
		} else if (effect === 'randomWand') {
			//RandomWand.effect(): a fresh Generator-drawn wand zaps the bolt once, at the
			//caster's own level (or scalingDepth()/5 for a non-Wand origin, moot - WildMagic's
			//origin is always a Wand). This port's fireWandShot needs a live creature target;
			//Java's own onZap can resolve against empty terrain for some wand types, a stated
			//reduction shared with WildMagic's normal shots.
			if (target && target.hp > 0) {
				const type = WAND_TYPES[Random.int(WAND_TYPES.length)]!;
				this.fireWandShot(type, this.weaponLevel > 0 ? this.weaponLevel : 0, target, 1);
			}
		} else if (effect === 'selfOoze') {
			//SelfOoze.effect(): every character within Chebyshev-ish distance 2 of the caster
			//(Java's own `PathFinder.buildDistanceMap(user.pos, ..., 2)`, a walkable-distance
			//flood, not a raw radius) gets Ooze at its full duration; the splash particles are
			//presentation-only and skipped.
			const distances = this.pathfinder.distanceMap({ x: this.hero.x, y: this.hero.y });
			for (const creature of this.creatures) {
				const dist = distances[this.level.index(creature.x, creature.y)] ?? -1;
				if (dist >= 0 && dist <= 2 && (!positiveOnly || (!creature.isHero && !creature.isAlly))) addBuff(creature, 'ooze');
			}
		} else if (effect === 'randomAreaEffect') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//RandomAreaEffect.effect() (`CursedWand.java`, tag `v3.3.8`): Java first calls
			//tryForWandProc (the supported Arcane Vision leg is dispatched here), then
			//Level.pressCell on an empty collision cell, then activates a
			//uniform BurningTrap/ChillingTrap/ShockingTrap at that same cell. This port lacks
			//those two generic seams, but the trap payloads are already represented by the same
			//Fire, Freezing, and Electricity fields as the ordinary traps, so preserve the area
			//effect itself. As in those trap handlers, this uses `passable` for Java's `!solid`.
			const areaEffect = pickCursedRandomAreaEffect((bound) => Random.int(bound));
			for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
				const x = cell.x + dx, y = cell.y + dy;
				if (!this.level.inside(x, y) || !this.level.passable(x, y)) continue;
				if (areaEffect === 'burningTrap') this.fire.seed(x, y, 2);
				else if (areaEffect === 'chillingTrap') this.plantFreeze.seed(x, y, 10);
				else this.electricity.seed(x, y, 10);
			}
		} else if (effect === 'spawnRegrowth') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//`SpawnRegrowth.effect()` (`CursedWand.java`, tag `v3.3.8`) seeds 30 volume at
			//the collision cell even when occupied; the persistent floor blob grows terrain
			//and roots on subsequent environmental turns. Its `Level.pressCell` call on empty
			//cells is still omitted because the port has no generic cell-press seam here.
			this.regrowth.seed(cell.x, cell.y, 30);
		}
	},

	/** `CursedWand.cursedZap()`'s Uncommon tier, all eight of Java's real ids
	 * (`simulation/cursedWand.ts` has the scoping rationale for what each one dropped). */
	castCursedWandUncommonEffect(this: DungeonScene, target: Creature | undefined, cell: Step, positiveOnly = false): void {
		let effect;
		do effect = pickCursedUncommonEffect((bound) => Random.int(bound), !isPlantBlocked());
		while ((effect === 'healthTransfer' && (!target || target.hp <= 0))
			|| (effect === 'randomPlant' && (!this.level.passable(cell.x, cell.y) || this.isChasmCell(cell.x, cell.y)
				|| this.portedFeatures.kindAt(this.level.index(cell.x, cell.y)) !== undefined)));
		if (effect === 'healthTransfer') {
			//HealthTransfer.effect(): a coin flip picks which side heals and which takes
			//`scalingDepth()*2` raw damage (half the roll heals, matching Java's `damage/2`);
			//`Char.damage()` never reduces by armor. No badge system exists here for the
			//friendly/enemy-magic death distinction Java books on this specific kill.
			if (!target || target.hp <= 0) return;
			this.applyCursedWandProc(target, cursedProcWandLevel);
			const damage = this.depth * 2;
			const targetTakesDamage = positiveOnly || Random.int(2) === 0;
			const healer = targetTakesDamage ? this.hero : target;
			const victim = targetTakesDamage ? target : this.hero;
			healer.hp = Math.min(healer.maxHp, healer.hp + Math.floor(damage / 2));
			//`CursedWand` is one of `AntiMagic.RESISTS`' listed source classes: `Char.damage()`
			//zeroes any hit whose source class is in that set for a `magicImmune` defender
			//(an AntiMagic champion), matching the guard the ordinary wand-zap loop already
			//has - the heal above still lands regardless, only the damage half is RESISTS-gated.
			if (victim.magicImmune) return;
			if (victim === this.hero) {
				this.applyCharacterDamage(victim, damage, { pierceArmor: true, cause: 'foe', skipAura: true,
					onNonWeaponBossDamage: (target) => this.disqualifyBossChallenge(target) });
			} else {
				this.applyCharacterDamage(victim, damage, { pierceArmor: true, cause: 'foe', skipAura: true,
					onNonWeaponBossDamage: (target) => this.disqualifyBossChallenge(target) });
			}
		} else if (effect === 'geyser') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//Geyser.effect(): a fresh GeyserTrap activates at the bolt's own cell - the same
			//flow the port's own geyser utility trap already uses. Java sets `geyser.source`
			//to the wand/user, so `activate()`'s `source == this` gate skips its
			//`HazardAssistTracker` prolong - this caller's `markHazardMob` bridge is a no-op
			//for exactly that reason (the utility-trap path passes the real mark instead).
			activateGeyserTrapFlow({
				depth: this.depth, random: Random, neighbourOffsets: Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>,
				randomElement: <T,>(values: readonly T[]) => Random.element(values), width: this.level.width, height: this.level.height,
				distanceMap: (origin) => this.pathfinder.distanceMap(origin), passable: (gx, gy) => this.level.passable(gx, gy),
				setWater: (gx, gy) => this.level.set(gx, gy, WATER), clearFire: (gx, gy) => this.fire.clear(gx, gy),
				restitch: () => this.restitchAllTiles(), creatureAt: (gx, gy) => this.creatureAt(gx, gy),
				markHazardMob: () => {},
				applyCharacterDamage: (target, damage, options) => this.applyCharacterDamage(target, damage, options),
				disqualifyBossChallenge: (target) => this.disqualifyBossChallenge(target),
				moveTo: (creature, destination) => this.moveTo(creature, destination),
			}, cell.x, cell.y);
		} else if (effect === 'summonSheep') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//SummonSheep.effect(): a fresh FlockTrap activates at the bolt's cell - Java's own
			//distance-2 flood of free non-pit cells, one Sheep (lifespan 6) each, matching this
			//port's existing 'flock' utility trap exactly.
			const distances = this.pathfinder.distanceMap(cell);
			for (let cy = 0; cy < this.level.height; cy++) for (let cx = 0; cx < this.level.width; cx++) {
				const steps = distances[this.level.index(cx, cy)] ?? -1;
				if (steps < 0 || steps > 2 || !this.level.passable(cx, cy)) continue;
				if (this.creatureAt(cx, cy) || this.isChasmCell(cx, cy)) continue;
				this.spawnSheep({ x: cx, y: cy }, 6);
			}
		} else if (effect === 'levitate') {
			//Levitate.effect(): a live target that isn't already flying and isn't IMMOVABLE
			//gets Levitation; otherwise the caster does. The hero's own "flying" reads live off
			//the levitation buff everywhere else in this port (no generic `.flying` write site
			//for it), so the eligibility check mirrors that rather than touching `.flying`.
			const alreadyFlying = (c: Creature) => c.buffs['levitation'] !== undefined
				|| (c.kind !== undefined && FLYING_KINDS.has(c.kind));
			const targetEligible = target !== undefined && target.hp > 0
				&& (!positiveOnly || target.kind === 'piranha') && !alreadyFlying(target)
				&& (target.kind === undefined || !IMMOVABLE_KINDS.has(target.kind));
			addBuff(targetEligible ? target : this.hero, 'levitation');
		} else if (effect === 'alarm') {
			//Alarm.effect(): every hostile mob wakes and heads for the caster's cell - the same
			//wake-plus-lastSeen shape the port's own 'alarm' utility trap already uses.
			for (const mob of this.creatures) {
				if (mob.isHero || mob.isNPC || mob.isAlly || mob.hp <= 0) continue;
				if (mob.kind !== undefined && IMMOVABLE_KINDS.has(mob.kind)) continue;
				mob.sleeping = false;
				if (!mob.fleeing) mob.lastSeen = { x: this.hero.x, y: this.hero.y };
			}
			//`if (positiveOnly) Buff.affect(user, ScrollOfChallenge.ChallengeArena.class).setup(user.pos)`: a Wondrous Resin positive
			//roll turns the alarm into a Challenge arena around the caster (R117, 2026-10-02).
			if (positiveOnly) {
				this.hero.buffs['challengeArena'] = BUFF_DURATION['challengeArena'];
				setupChallengeArena(this);
			}
		} else if (effect === 'randomPlant') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//RandomPlant.effect(): a uniformly-picked plant kind seeds at the bolt's own cell,
			//refusing silently on an occupied feature, a chasm, or impassable terrain - the same
			//`valid()` gate the hero's own `plantSeed` action already checks, generalized off the
			//hero's own cell to the bolt's collision cell.
			const plantCellIndex = this.level.index(cell.x, cell.y);
			if (this.level.passable(cell.x, cell.y) && !this.isChasmCell(cell.x, cell.y)
				&& this.portedFeatures.kindAt(plantCellIndex) === undefined) {
				const kind = CURSED_PLANT_KINDS[Random.int(CURSED_PLANT_KINDS.length)]!;
				this.manualPlants.set(plantCellIndex, kind);
				this.placePortedFeature(plantCellIndex, kind);
			}
		} else if (effect === 'explosion') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//Explosion.effect(): `new Bomb.ConjuredBomb().explode(pos)` - Java's `ConjuredBomb`
			//is an empty `Bomb` subclass with zero overrides, so it resolves exactly this port's
			//'standard' MWL_BOMB_RULES entry. Reuses `detonateBomb`'s own three base-blast loops
			//(terrain burn, ground-item chain, character damage) rather than re-deriving them,
			//since there is no ground item to remove/chain from here.
			this.explodeConjuredBomb(cell);
		} else {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//LightningBolt.effect(): every `Lightning()` visual call and `ScrollOfRecharging.
			//charge()` are pure particle bursts with zero mechanical effect in `v3.3.8`, both
			//skipped. The mechanical shape: the union of NEIGHBOURS9 around the caster's own
			//cell and around the bolt's collision cell (deduplicated by creature identity), the
			//hero in that set gets an additional Recharging grant (this port's own full duration
			//stands in for Java's `Recharging.DURATION/3` scale-down, matching how every other
			//Recharging grant here works) - Java's damage/paralysis half below is unconditional
			//on top of that (positiveOnly exempts ALLY-aligned characters, including the hero,
			//from damage/paralysis but retains the hero's Recharging grant), so every eligible character takes
			//armor-piercing `NormalIntRange(5 + depth/4, 10 + depth/4)` Electricity damage
			//(`applyBlastDamage`'s `pierceArmor` covers the same boss-hook/shield edge cases
			//Explosion already reuses) plus Paralysis at this port's own reduced duration
			//(matching the FlashBangBomb payload's identical `reigniteBuff(target, 'paralysis')`
			//call with no explicit override, the same documented global simplification).
			const context = this.bombEffectsContext();
			const affected: Creature[] = [];
			for (const center of [{ x: this.hero.x, y: this.hero.y }, cell]) {
				for (const [dx, dy] of [[0, 0], ...Roguelike.neighbourOffsets(8)] as const) {
					const victim = this.creatureAt(center.x + dx, center.y + dy);
					if (victim && !affected.includes(victim)) affected.push(victim);
				}
			}
			const lo = 5 + Math.floor(this.depth / 4);
			const hi = 10 + Math.floor(this.depth / 4);
			for (const victim of affected) {
				//The Hero branch is a separate, unconditional grant. In positiveOnly mode the hero
				//still receives Recharging but is skipped with other ALLY-aligned characters below.
				if (victim.isHero) reigniteBuff(this.hero, 'recharging');
				if (victim.hp <= 0 || (positiveOnly && (victim.isHero || victim.isAlly))) continue;
				applyBlastDamage(victim, Math.max(0, Random.normalRange(lo, hi)), true, context);
				if (victim.hp > 0) reigniteBuff(victim, 'paralysis');
			}
		}
	},

	/** `CursedWand.cursedZap()`'s Rare tier, all eight of Java's effects. */
	castCursedWandRareEffect(this: DungeonScene, target: Creature | undefined, cell: Step, positiveOnly = false): void {
		let effect;
		do effect = pickCursedRareEffect((bound) => Random.int(bound));
		while (effect === 'sheepPolymorph' && (!target || target.hp <= 0 || target.isHero || target.isNPC
			|| (target.kind !== undefined && (BOSS_KINDS.has(target.kind) || MINIBOSS_KINDS.has(target.kind)))));
		if (effect === 'sheepPolymorph') {
			//SheepPolymorph.valid()/effect(): a live, non-hero target that isn't a boss/miniboss
			//and isn't a (neutral) NPC is silently destroyed - no death, no loot, the same
			//teardown `destroyAlly` already uses for a non-death removal - and replaced with a
			//fresh Sheep at its cell, reusing `spawnSheep`'s own factory (Java's real 10-turn
			//lifespan). An ineligible or missing target makes this Rare draw a genuine no-op,
			//matching Java's own `valid()` gate rather than falling back to some other target.
			if (target && target.hp > 0 && !target.isHero && !target.isNPC
				&& (target.kind === undefined || (!BOSS_KINDS.has(target.kind) && !MINIBOSS_KINDS.has(target.kind)))) {
				const at = { x: target.x, y: target.y };
				this.scheduler.remove(target);
				this.creatures.splice(this.creatures.indexOf(target), 1);
				this.sprite(target).destroy();
				this.spriteFor.delete(target.id);
				this.spawnSheep(at, 10);
			}
			return;
		}
		if (effect === 'massInvuln') {
			//MassInvuln.effect(): every character on the level gets Invulnerability 10 and a full
			//Bless - both already-modeled buffs, no target/cell needed at all (Java's own FX call
			//takes neither).
			for (const creature of this.creatures) {
				addBuff(creature, 'invulnerability', 10);
				addBuff(creature, 'bless');
			}
			return;
		}
		if (effect === 'summonMonsters') {
			if (positiveOnly) {
				//Java spawns two MirrorImages at the bolt cell; this port's helper registers a
				//single image at an explicit cell, so place up to two in nearby open cells.
				const candidates = [{ ...cell }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: cell.x + dx, y: cell.y + dy }))]
					.filter((at) => this.level.inside(at.x, at.y) && this.level.passable(at.x, at.y)
						&& !this.creatureAt(at.x, at.y));
				for (const at of candidates.slice(0, 2)) this.spawnMirrorImage(at);
				return;
			}
			//`SummonMonsters.effect()` (`CursedWand.java`, tag `v3.3.8`) activates a
			//SummoningTrap at the bolt collision cell. Reuse this port's matching utility trap;
			//Java uses the level mob rotation, supports avoid cells, delays each spawn by two turns
			//and activates traps under new mobs. The ordinary branch's utility instead picks a random depth-roster mob,
			//spawns immediately, and omits avoid-cell/chained-trap handling. Those are the stated
			//simplifications for this shared utility-trap implementation.
			this.activateUtilityTrap('summoning', cell.x, cell.y);
			return;
		}
		if (effect === 'curseEquipment') {
			if (positiveOnly) {
				if (target && target.hp > 0) addBuff(target, 'hex');
				return;
			}
			//`CurseEquipment.effect()` calls `CursingTrap.curse(hero)` for ordinary WildMagic.
			//With positiveOnly, the branch above Hexes the collision target instead.
			//Java prioritizes an unenchanted weapon/unglyphed armor, then falls back
			//to any non-Mage's-Staff weapon or armor, marks the curse known, and adds a matching
			//curse affix only when none exists. Curse particles/audio are omitted because this
			//port has no such presentation seam at this call site. The port identifies Mage's
			//Staff by the Mage's starting-weapon id or a staff id substring; it has no Java item
			//instance type at this seam.
			const weaponId = this.weaponId.toLowerCase();
			const weaponEligible = this.weaponId !== '' && !weaponId.includes('staff')
				&& !(this.heroClass === 'mage' && weaponId === 'startingweapon');
			const slot = pickCursedEquipmentSlot(weaponEligible, this.weaponAffix != null,
				this.armorId !== '', this.armorGlyph != null, (bound) => Random.int(bound));
			if (slot === 'weapon') {
				this.weaponCursed = true;
				this.weaponCursedKnown = true;
				if (this.weaponAffix == null) this.weaponAffix = Random.element(getWeaponCurses())?.id ?? null;
			} else if (slot === 'armor') {
				this.armorCursed = true;
				this.armorCursedKnown = true;
				if (this.armorGlyph == null) this.armorGlyph = Random.element(getArmorCurses())?.id ?? null;
			}
			this.say(t('levels.traps.cursingtrap.curse'));
			return;
		}
		if (effect === 'interFloorTeleport') {
			//`InterFloorTeleport.effect()` (`CursedWand.java`, tag `v3.3.8`): WildMagic's
			//Hero uses weighted inter-floor travel when permitted; Java's other cases use
			//ScrollOfTeleportation's same-floor teleport. Java checks Dungeon.level.locked;
			//floorLocked() is this port's live equivalent, including boss-specific unsealing.
			//The mining branch, depth 1 and a carried Amulet also bar inter-floor travel.
			const allowed = !positiveOnly && this.depth > 1 && !this.floorLocked()
				&& !this.miningBranchActive && !this.bag.find('amulet');
			const weights = allowed ? cursedInterfloorDepthWeights(this.depth) : [];
			const destinationIndex = weights.length > 0 ? Random.weighted(weights) : null;
			if (destinationIndex !== null) {
				this.disarmTimeBubblePresses();
				this.depth = destinationIndex + 1;
				this.miningBranchActive = false;
				//Java returnPos=-1 selects the destination entrance. Null uses this port's
				//default entrance cell; {-1,-1} is reserved for Java's distinct returnPos=-2 exit.
				this.beaconArrival = null;
				this.enterLevel();
			} else {
				const from = { x: this.hero.x, y: this.hero.y };
				const destination = this.randomFreeCell(this.hero);
				if (destination) {
					this.moveTo(this.hero, destination);
					this.playTeleportAppear(from, destination, this.hero);
				}
			}
			return;
		}
		if (effect === 'petrify') {
			//`Petrify.effect()` (`CursedWand.java`, tag `v3.3.8`) only accepts Hero and applies
			//TimeStasis for 100 actor turns. This port represents its held action lock and
			//invisibility with timed states and pauses hunger while `timeStasis` is active.
			//Unlike Java's ref-counted buffs this max-duration mapping cannot preserve
			//overlap counts, but it does preserve longer pre-existing control states. Its
			//TELEPORT cue, ten STEAM specks, and warning line are retained with shared audio
			//and a white-pixel approximation for Java's film art.
			this.hero.buffs['paralysis'] = Math.max(this.hero.buffs['paralysis'] ?? 0, 100);
			this.hero.buffs['invisibility'] = Math.max(this.hero.buffs['invisibility'] ?? 0, 100);
			this.hero.buffs['timeStasis'] = Math.max(this.hero.buffs['timeStasis'] ?? 0, 100);
			spawnTrapSpecks(this.effectLayer, this.effectBursts, this.hero.x, this.hero.y, 'steam');
			runState.audio.cue('teleport', 0.7);
			this.say(t('items.wands.cursedwand.petrify'), 'warning');
			return;
		}
		if (effect === 'fireBall') {
			this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
			//`FireBall.effect()` (`CursedWand.java`, tag `v3.3.8`): radius-3 shadowcast from
			//the bolt collision cell, damage/ignite visible non-solid cells, then a radius-6
			//BlastWave used only for its visual ripple (no knockback or damage); FlameParticle,
			//BLAST and BURNING presentation use white-pixel stand-ins and the shipped sound clips.
			//The generic FOV consumes `transparent`, so the port inherits its terrain opacity mapping.
			const fov = new Roguelike.FieldOfView(this.level);
			fov.update(cell.x, cell.y, 3);
			for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
				if (!fov.isVisible(x, y) || !this.level.transparent(x, y)) continue;
				const victim = this.creatureAt(x, y);
				if (positiveOnly && (victim?.isHero || victim?.isAlly)) continue;
				spawnTrapSpecks(this.effectLayer, this.effectBursts, x, y, 'flame');
				if (victim && victim.hp > 0) {
					reigniteBuff(victim, 'burning');
					const damage = Math.max(0, Random.normalRange(5 + this.depth, 10 + 2 * this.depth));
					//`Char.damage()` seam: hero shields/magical absorb, or the mob path's Doom, overrides, shields, hooks and death.
					this.applyCharacterDamage(victim, damage, { pierceArmor: true, cause: 'fire', skipAura: true, magical: true });
				}
				if (this.isFireFlammableTerrain(x, y)) this.fire.seed(x, y, 4);
			}
			runState.audio.cue('blast', 0.7);
			runState.audio.cue('burning', 0.7);
			return;
		}
		//ConeOfColors.effect(): Java re-does the bolt as `STOP_SOLID` (so it goes through
		//characters) before building an 8-radius, 90-degree `ConeAOE` from it - `coneRay`'s own
		//`stopAtTarget: false` is that same STOP_SOLID-alone stop mode. `positiveOnly` skips
		//allied targets, matching Java; `tryForWandProc` (a generic wand-glyph
		//reaction hook) runs for its collision-cell character before the cone is applied.
		this.applyCursedWandProc(target ?? this.creatureAt(cell.x, cell.y), cursedProcWandLevel);
		const cone = coneCells({
			source: { x: this.hero.x, y: this.hero.y },
			target: cell,
			degrees: 90,
			maxDistance: 8,
			width: this.level.width,
			height: this.level.height,
			trace: (coneFrom, coneTo) => this.coneRay(coneFrom, coneTo, false),
		});
		for (const coneCell of cone.cells) {
			if (coneCell.x === this.hero.x && coneCell.y === this.hero.y) continue;
			const victim = this.creatureAt(coneCell.x, coneCell.y);
			if (positiveOnly && (victim?.isHero || victim?.isAlly)) continue;
			if (!victim || victim.hp <= 0) continue;
			const dmg = Math.max(0, Random.normalRange(5 + this.depth, 10 + this.depth * 2));
			const dealDamage = (): boolean => {
				this.applyCharacterDamage(victim, dmg, { pierceArmor: true, cause: 'foe', skipAura: true });
				return victim.hp > 0;
			};
			const status = pickConeOfColorsStatus((bound) => Random.int(bound));
			if (status === 'burning') {
				reigniteBuff(victim, 'burning');
				dealDamage();
			} else if (status === 'frost') {
				if (dealDamage()) addBuff(victim, 'frost');
			} else if (status === 'poison') {
				//`Char.Property.INORGANIC` rejects Poison (`Char.java`, tag `v3.3.8`).
				//This direct `Poison.set` equivalent must use the shared immunity gate too.
				if (!buffBlocked(victim, 'poison')) victim.buffs['poison'] = Math.max(victim.buffs['poison'] ?? 0, 3 + Math.floor(this.depth / 2));
				dealDamage();
			} else if (status === 'ooze') {
				addBuff(victim, 'ooze');
				dealDamage();
			} else {
				if (dealDamage()) reigniteBuff(victim, 'paralysis');
			}
		}
	},

};
