import type { DungeonScene } from '../../dungeonScene';
import { Random, Roguelike } from 'mwg';
import { BUFF_DURATION, addBuff, buffBlocked, reigniteBuff, type Creature, type Step } from '../../../combat';
import { CURSED_PLANT_KINDS, CURSED_RANDOM_GAS, pickBurnAndFreeze, pickConeOfColorsStatus, pickCursedCommonEffect, pickCursedRareEffect, pickCursedTier, pickCursedUncommonEffect } from '../../../simulation/cursedWand';
import { activateGeyserTrap as activateGeyserTrapFlow } from '../../../simulation/geyserTrap';
import { applyBlastDamage } from '../../../items/bombEffects';
import { MWL_BOMB_RULES } from '../../../mwlContent';
import { WAND_TYPES } from '../../../items/wands';
import { WATER } from '../../../dungeonConstants';
import { BOSS_KINDS, FLYING_KINDS, IMMOVABLE_KINDS, MINIBOSS_KINDS } from '../../../monsters';
import { coneCells } from '../../../mechanics/cone';

/** `CursedWand.cursedZap()` (`items/wands/CursedWand.java`, tag `v3.3.8`) - moved verbatim from
 * `armorAbilityUse.ts` as the file-size refactor's extraction once `activateWildMagic`'s cursed
 * branch grew past that group's own budget, behavior-identical. Called from `activateWildMagic`;
 * `simulation/cursedWand.ts` carries the full scoping rationale for what is and isn't ported. */
export const cursedWandCastMethods = {

	/** `CursedWand.cursedZap()`'s tier roll plus effect dispatch. Called once per selected cursed
	 * spare in `activateWildMagic`'s firing loop in place of a normal `fireWandShot`. `target` is
	 * the same resolved aim the normal branch computes (occupant, else the original target) and
	 * may be `undefined`; `cell` is the bolt's own collision cell. */
	castCursedWandEffect(this: DungeonScene, target: Creature | undefined, cell: Step): void {
		const tier = pickCursedTier((bound) => Random.int(bound));
		if (tier === 'common') this.castCursedWandCommonEffect(target, cell);
		else if (tier === 'uncommon') this.castCursedWandUncommonEffect(target, cell);
		else this.castCursedWandRareEffect(target, cell);
	},

	/** `CursedWand.cursedZap()`'s Common tier (six of Java's eight Common `CursedEffect`s,
	 * picked uniformly). `RandomGas`/`Bubbles` run regardless of whether anything stands at
	 * `cell`. */
	castCursedWandCommonEffect(this: DungeonScene, target: Creature | undefined, cell: Step): void {
		const effect = pickCursedCommonEffect((bound) => Random.int(bound));
		if (effect === 'burnAndFreeze') {
			const { userStatus, targetStatus } = pickBurnAndFreeze(Random.int(2) === 0);
			if (userStatus === 'burning') reigniteBuff(this.hero, 'burning');
			else this.hero.buffs['frost'] = Math.max(this.hero.buffs['frost'] ?? 0, BUFF_DURATION.frost);
			if (target && target.hp > 0) {
				if (targetStatus === 'burning') reigniteBuff(target, 'burning');
				else target.buffs['frost'] = Math.max(target.buffs['frost'] ?? 0, BUFF_DURATION.frost);
			}
		} else if (effect === 'randomTeleport') {
			//RandomTeleport.effect(): a live, non-IMMOVABLE target teleports on a coin flip;
			//anything else (no target, IMMOVABLE, or the flip losing) teleports the caster
			//instead - the hero here, which is never IMMOVABLE, so that branch always lands.
			const targetEligible = target !== undefined && target.hp > 0
				&& (target.kind === undefined || !IMMOVABLE_KINDS.has(target.kind));
			const mover = targetEligible && Random.int(2) === 0 ? target : this.hero;
			const from = { x: mover.x, y: mover.y };
			const destination = this.randomFreeCell(mover);
			if (destination) {
				this.moveTo(mover, destination);
				this.playTeleportAppear(from, destination, mover);
			}
		} else if (effect === 'randomGas') {
			const gas = CURSED_RANDOM_GAS[Random.int(CURSED_RANDOM_GAS.length)]!;
			if (gas.id === 'confusionGas') this.confusionGas.seed(cell.x, cell.y, gas.volume);
			else if (gas.id === 'toxicGas') this.toxicGas.seed(cell.x, cell.y, gas.volume);
			else this.paralyticGas.seed(cell.x, cell.y, gas.volume);
		} else if (effect === 'bubbles') {
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
		} else {
			//SelfOoze.effect(): every character within Chebyshev-ish distance 2 of the caster
			//(Java's own `PathFinder.buildDistanceMap(user.pos, ..., 2)`, a walkable-distance
			//flood, not a raw radius) gets Ooze at its full duration; the splash particles are
			//presentation-only and skipped.
			const distances = this.pathfinder.distanceMap({ x: this.hero.x, y: this.hero.y });
			for (const creature of this.creatures) {
				const dist = distances[this.level.index(creature.x, creature.y)] ?? -1;
				if (dist >= 0 && dist <= 2) addBuff(creature, 'ooze');
			}
		}
	},

	/** `CursedWand.cursedZap()`'s Uncommon tier, all eight of Java's real ids
	 * (`simulation/cursedWand.ts` has the scoping rationale for what each one dropped). */
	castCursedWandUncommonEffect(this: DungeonScene, target: Creature | undefined, cell: Step): void {
		const effect = pickCursedUncommonEffect((bound) => Random.int(bound));
		if (effect === 'healthTransfer') {
			//HealthTransfer.effect(): a coin flip picks which side heals and which takes
			//`scalingDepth()*2` raw damage (half the roll heals, matching Java's `damage/2`);
			//`Char.damage()` never reduces by armor. No badge system exists here for the
			//friendly/enemy-magic death distinction Java books on this specific kill.
			if (!target || target.hp <= 0) return;
			const damage = this.depth * 2;
			const targetTakesDamage = Random.int(2) === 0;
			const healer = targetTakesDamage ? this.hero : target;
			const victim = targetTakesDamage ? target : this.hero;
			healer.hp = Math.min(healer.maxHp, healer.hp + Math.floor(damage / 2));
			//`CursedWand` is one of `AntiMagic.RESISTS`' listed source classes: `Char.damage()`
			//zeroes any hit whose source class is in that set for a `magicImmune` defender
			//(an AntiMagic champion), matching the guard the ordinary wand-zap loop already
			//has - the heal above still lands regardless, only the damage half is RESISTS-gated.
			if (victim.magicImmune) return;
			if (victim === this.hero) {
				const applied = this.absorbHeroDamage(damage);
				this.hero.hp -= applied;
				this.showDamage(this.hero, applied);
				if (this.hero.hp <= 0) this.kill(this.hero, 'foe');
			} else {
				victim.hp -= damage;
				this.showDamage(victim, damage);
				if (victim.hp <= 0) this.kill(victim, 'foe');
			}
		} else if (effect === 'geyser') {
			//Geyser.effect(): a fresh GeyserTrap activates at the bolt's own cell - the same
			//flow the port's own geyser utility trap already uses.
			activateGeyserTrapFlow({
				depth: this.depth, random: Random, neighbourOffsets: Roguelike.neighbourOffsets(8) as ReadonlyArray<readonly [number, number]>,
				randomElement: <T,>(values: readonly T[]) => Random.element(values), width: this.level.width, height: this.level.height,
				distanceMap: (origin) => this.pathfinder.distanceMap(origin), passable: (gx, gy) => this.level.passable(gx, gy),
				setWater: (gx, gy) => this.level.set(gx, gy, WATER), clearFire: (gx, gy) => this.fire.clear(gx, gy),
				restitch: () => this.restitchAllTiles(), creatureAt: (gx, gy) => this.creatureAt(gx, gy), hero: this.hero,
				absorbHeroDamage: (damage) => this.absorbHeroDamage(damage), showDamage: (t, damage) => this.showDamage(t, damage),
				kill: (t, cause) => this.kill(t, cause), moveTo: (creature, destination) => this.moveTo(creature, destination),
			}, cell.x, cell.y);
		} else if (effect === 'summonSheep') {
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
			const targetEligible = target !== undefined && target.hp > 0 && !alreadyFlying(target)
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
		} else if (effect === 'randomPlant') {
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
			//Explosion.effect(): `new Bomb.ConjuredBomb().explode(pos)` - Java's `ConjuredBomb`
			//is an empty `Bomb` subclass with zero overrides, so it resolves exactly this port's
			//'standard' MWL_BOMB_RULES entry. Reuses `detonateBomb`'s own three base-blast loops
			//(terrain burn, ground-item chain, character damage) rather than re-deriving them,
			//since there is no ground item to remove/chain from here.
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
					if (victim.isNPC || victim.hp <= 0 || !this.level.passable(victim.x, victim.y)
						|| Roguelike.chebyshevDistance(cell, victim) > rule.affectedRadius) continue;
					applyBlastDamage(victim, Math.max(0, Random.normalRange(lo, hi)), false, context);
				}
			}
		} else {
			//LightningBolt.effect(): every `Lightning()` visual call and `ScrollOfRecharging.
			//charge()` are pure particle bursts with zero mechanical effect in `v3.3.8`, both
			//skipped. The mechanical shape: the union of NEIGHBOURS9 around the caster's own
			//cell and around the bolt's collision cell (deduplicated by creature identity), the
			//hero in that set gets an additional Recharging grant (this port's own full duration
			//stands in for Java's `Recharging.DURATION/3` scale-down, matching how every other
			//Recharging grant here works) - Java's damage/paralysis half below is unconditional
			//on top of that (`positiveOnly`, the only thing that would exempt an ally from it,
			//is never true here), so every affected character including the hero takes
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
				//The Hero branch is a separate, unconditional grant - Java's own damage/paralysis
				//half below still applies to the hero too (only an ALLY is ever excluded, gated on
				//`positiveOnly` this port never sets), so this is additive, not exclusive.
				if (victim.isHero) reigniteBuff(this.hero, 'recharging');
				if (victim.hp <= 0) continue;
				applyBlastDamage(victim, Math.max(0, Random.normalRange(lo, hi)), true, context);
				if (victim.hp > 0) reigniteBuff(victim, 'paralysis');
			}
		}
	},

	/** `CursedWand.cursedZap()`'s Rare tier, 4 of 8 (`simulation/cursedWand.ts` has the scoping
	 * rationale for the other five, each blocked on real missing infrastructure). */
	castCursedWandRareEffect(this: DungeonScene, target: Creature | undefined, cell: Step): void {
		const effect = pickCursedRareEffect((bound) => Random.int(bound));
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
			//`SummonMonsters.effect()` (`CursedWand.java`, tag `v3.3.8`) activates a
			//SummoningTrap at the bolt collision cell. Reuse this port's matching utility trap;
			//Java uses the level mob rotation, supports avoid cells, delays each spawn by two turns
			//and activates traps under new mobs. The utility instead picks a random depth-roster mob,
			//spawns immediately, and omits avoid-cell/chained-trap handling. These are documented
			//simplifications of the shared utility-trap implementation.
			this.activateUtilityTrap('summoning', cell.x, cell.y);
			return;
		}
		//ConeOfColors.effect(): Java re-does the bolt as `STOP_SOLID` (so it goes through
		//characters) before building an 8-radius, 90-degree `ConeAOE` from it - `coneRay`'s own
		//`stopAtTarget: false` is that same STOP_SOLID-alone stop mode. `positiveOnly` is never
		//true from WildMagic, so the ally-exemption branch never fires and is skipped, matching
		//every other tier's documented convention here; `tryForWandProc` (a generic wand-glyph
		//reaction hook) has no seam in this port and is not modeled, also matching convention.
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
			if (!victim || victim.hp <= 0) continue;
			const dmg = Math.max(0, Random.normalRange(5 + this.depth, 10 + this.depth * 2));
			const dealDamage = (): boolean => {
				if (victim.isHero) {
					const applied = this.absorbHeroDamage(dmg);
					this.hero.hp -= applied;
					this.showDamage(this.hero, applied);
					if (this.hero.hp <= 0) { this.kill(this.hero, 'foe'); return false; }
				} else {
					victim.hp -= dmg;
					this.showDamage(victim, dmg);
					if (victim.hp <= 0) { this.kill(victim, 'foe'); return false; }
				}
				return true;
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
