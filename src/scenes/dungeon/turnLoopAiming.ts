import type { DungeonScene } from '../dungeonScene';
import { Camera, Input, Projectile, Random, Roguelike, TintedSprite, Window, WindowStack } from 'mwg';
import { dispatchHeroAction } from '../../adapters/heroActions';
import { MISSILE_MAX_DURABILITY, missileAdjacentAccFactor, missileDamageRange, missileFlightArt, type MissileFlightArt } from '../../items/missiles';
import { ALL_BAGS_BADGE, BAG_BADGE, BAG_IDS, HOLSTER_RECHARGE_BASE, NORMAL_RECHARGE_BASE, isBagId, ownsBag } from '../../items/bags';
import { MOVES } from '../../simulation/heroActions';
import { dustSpawnerCap, dustSpawnerStep } from '../../simulation/wraith';
import { runHeroTurn } from '../../adapters/gameSimulation';
import { usePreparationBlink, type PreparationBlinkContext } from '../../simulation/preparation';
import { confirmDisintegrationWand, livingEarthZapRange, useDisintegrationWand, wandChargesPerCast, wandDamageRange, wandTargetRange, type DisintegrationWandScene, type WandType } from '../../items/wands';
import { ringElementsMultiplier, ringEnergyMultiplier, ringSharpshootingBonus } from '../../items/ringModifiers';
import { has, t } from '../../i18n/index';
import { onZoomChanged, screenShake, setZoomOffset, zoomForOffset, zoomOffset } from '../../settings';
import { EMPOWERING_SCROLLS_BONUS, arcaneVisionDuration, canImproviseProjectile, enragedCatalystBonus, ironStomachReduction, lightReadingWandMult, monasticVigorShield, preservationChance, projectileMomentumBonus } from '../../talentEffects';
import { directTomeCharge, findHolyTome } from '../../items/holyTome';
import { tomeChargeCap, tomeTickRate } from '../../simulation/clericSpells';
import { advanceWellFed, HUNGRY, STARVING } from '../../simulation/hunger';
import { addLockedFloorTime, lockedFloorBossTime, regenOn, regenerationDelay, removeLockedFloorTime, tickLockedFloor, tickRegeneration } from '../../simulation/regeneration';
import { isChallengeEnabled } from '../../challenges';
import { ARMOR_CHARGE_MAX, ARMOR_CHARGE_PER_TURN } from '../../armorAbilities';
import { CLASSES } from '../../classes';
import { drawAimPreview } from '../../ui/aimOverlay';
import { drawTravelPreview } from '../../ui/travelOverlay';
import { emitToxicImbueGas } from '../../simulation/environmentalBlobs';
import { tickSungrassHealth } from '../../simulation/plantPools';
import { rechargeSpareWand } from '../../simulation/spareWands';
import { spendTimeBubbleTurn } from '../../simulation/timeBubble';
import { getCurse } from '../../items/itemCurses';
import { MWL_MISSILE_BY_CLASS, MWL_TURN_CLOCK, mwlItemEffectValue } from '../../mwlContent';
import { applyCapeOfThornsProc, spellbookChargeCap } from '../../items/artifactActions';
import { applyTalismanPerTurnCharge } from '../../items/talisman';
import { applyRoseRecharge } from '../../items/rose';
import { beaconPassiveRecharge, chainsPassiveRecharge, hourglassPassiveRecharge } from '../../items/artifactPassiveRecharge';
import { beaconChargeCap } from '../../items/beacon';
import type { ChainsItem } from '../../items/chains';
import { TILE, WATER } from '../../dungeonConstants';
import { BUFF_DURATION, addBuff, buffBlocked, electricDamageHalved, icyDamageHalved, rollHit, tickBuffs, type Creature, type Step } from '../../combat';
import { tickMonsterTurnEnd } from '../../simulation/buffs';
import { isUndeadOrDemonic } from '../../monsters';

/** DungeonScene methods, moved verbatim from `dungeonScene.ts` (group `turnLoopAiming`). Each takes the scene as `this`;
 * `dungeonScene.ts` merges them back onto the class prototype. */
export const turnLoopAimingMethods = {
	/**
	 * `Badges.validateAllBagsBought()`: the per-bag badge on acquisition, plus the meta
	 * badge once all four are owned. Called everywhere a bag can enter the inventory -
	 * run start (the free velvet), ground pickup (including shop-stand purchases, which
	 * re-enter the pickup path), and keeper-shelf buys.
	 */
	noteBagAcquired(this: DungeonScene, id: string): void {
		if (!isBagId(id)) return;
		this.awardBadge(BAG_BADGE[id]);
		if (BAG_IDS.every((bag) => this.ownsBag(bag))) this.awardBadge(ALL_BAGS_BADGE);
	},

	/**
	 * One wand bolt hitting home: the regrowth/fireblast/transfusion dispatch plus the
	 * generic victim loop (extracted verbatim from `useSpecial`\u2019s zap branch so
	 * `WildMagic` can fire spare wands through the same code). The spend/preservation/
	 * backup-barrier head and the excess-charge/arcane-vision/empowered tail stay with the
	 * normal zap - Java runs those in `Wand.zap()`, which `WildMagic.zapWand()` bypasses
	 * (`tryToZap` + `fx` + `onZap` directly). The crab parry moved down with the body:
	 * it is damage-time in real Java, so every WildMagic shot parries individually too.
	 * Returns false on a parry (no bolt fired) so the normal-zap tail still skips exactly
	 * as the old `else` made it skip; WildMagic ignores the result and spends every shot.
	 */
	/**
	 * Approximate per-wand tint for the shared `zapBeams` trail (see `dungeonScene.ts`'s own
	 * doc comment) - Java draws each wand's own textured `MagicMissile`/`LightningParticle`/
	 * etc. bolt sprite, which this port has no assets for; these are representative colors
	 * picked to read as each element (frost blue, fire orange, lightning yellow...), not
	 * values extracted from a specific Java particle class. `warding` is omitted: the ward's
	 * own zap already pushes its own beam directly in `takeWardTurn`, never through here.
	 */
	wandZapTrailColor(wandType: WandType): number {
		const colors: Record<Exclude<WandType, 'warding'>, number> = {
			magicMissile: 0xffffff, frost: 0x99ddff, fireblast: 0xff8822, lightning: 0xffee55,
			corrosion: 0x77cc44, corruption: 0x663399, disintegration: 0x8844cc, blastWave: 0xffaa55,
			livingEarth: 0xaa8855, prismaticLight: 0xff66ff, regrowth: 0x66cc66, transfusion: 0xff4466,
		};
		return colors[wandType as Exclude<WandType, 'warding'>] ?? 0xffffff;
	},

	fireWandShot(this: DungeonScene, wandType: WandType, zapLevel: number, target: Creature, chargesPerCast: number): boolean {
		//GreatCrab.damage negates wand bolts from a seen hero - kept verbatim
		//`GreatCrab.damage()` (tag v3.3.8): `enemySeen && state != SLEEPING && paralysed == 0
		//&& src instanceof Wand && enemy == Dungeon.hero && enemy.invisible == 0`. This port\u2019s
		//`seesHero` already folds in both the sight check and the invisibility bypass (a
		//monster\u2019s `seesHero` is computed false while the hero is invisible - see where it\u2019s
		//set), so only the missing `paralysed == 0` term needed adding; `!target.sleeping`
		//alone previously let a paralysed crab (which cannot act, let alone react to a hit)
		//still parry every wand hit.
		if (target.kind === 'greatCrab' && !target.sleeping && target.seesHero && target.buffs['paralysis'] === undefined) {
			this.say(t('port.log.crabparries'), 'negative');
			return false;
		}
		//`Beam` (`effects/Beam.java`, tag `v3.3.8`): every wand zap in Java draws its own
		//textured bolt from caster to target (`MagicMissile`/`LightningParticle`/etc.); this
		//port has none of those assets, so it reuses the same plain fading-line primitive
		//`WardSprite.zap()`'s `DeathRay` already draws, tinted per wand (`wandZapTrailColor`)
		//- one shared `Beam` reduction, not two. Pushed once here regardless of the
		//type-specific branch below, since every one of them still zaps from the hero to
		//`target`'s cell first (fireblast/regrowth's own area shapes are a separate, larger
		//visual this stays a stated simplification for, not a full cone/AOE telegraph).
		this.zapBeams.push({
			x1: (this.hero.x + 0.5) * TILE, y1: (this.hero.y + 0.5) * TILE,
			x2: (target.x + 0.5) * TILE, y2: (target.y + 0.5) * TILE,
			timeLeft: 0.5, duration: 0.5, color: this.wandZapTrailColor(wandType),
		});
		//WandOfMagicMissile.onZap calls ch.damage() directly in Java - never a hit
		//roll. Fireblast and Lightning use their real level-0/level-scaling rolls too.
		//Fireblast is now Java's whole area routine (`useFireblastWand`: the cone, the fire
		//seeding with its adjacent-to-caster exception, doors, heaps, the neighbours-8
		//ignition, and the per-charge damage and statuses). Lightning still arcs to visible
		//adjacent foes instead of Java's Ballistica chain.
		if (wandType === 'regrowth') {
			this.useRegrowthWand(target, chargesPerCast);
		} else if (wandType === 'fireblast') {
			this.useFireblastWand(target, chargesPerCast);
		} else if (wandType === 'transfusion') {
			this.useTransfusionWand(target);
		} else {
		const zapTargets = wandType === 'blastWave'
			? this.creatures.filter((c) => !c.isNPC && c.hp > 0 && Roguelike.chebyshevDistance(c, target) <= 1)
			: wandType === 'lightning'
			? this.lightningTargets(target)
			: wandType === 'corrosion'
				? [target, ...this.creatures.filter((c) => c !== target && !c.isHero && !c.isNPC && c.hp > 0
					&& Roguelike.chebyshevDistance(target, c) <= 1 && this.fov.isVisible(c.x, c.y))]
			: [target];
		//WandOfLightning.onZap() (tag `v3.3.8`) promotes the multiplier to 1 when
		//the collision cell is water, so a conductive water strike deals full damage
		//to every affected character rather than sharing the ordinary chain penalty.
		const lightningMultiplier = wandType === 'lightning'
			? this.level.get(target.x, target.y) === WATER ? 1 : 0.4 + 0.6 / zapTargets.length
			: 1;
		if (wandType === 'corrosion') {
			//WandOfCorrosion.onZap() (tag v3.3.8) seeds 50 + 10*level CorrosiveGas at
			//the collision cell and raises the blob strength to 2 + level. The gas now
			//persists and diffuses through the scene; its intensity is retained separately
			//because the port's Ooze stand-in has no increasing damage field.
			this.corrosiveGas.seed(target.x, target.y, 50 + 10 * zapLevel);
			this.corrosiveGasStrength = Math.max(this.corrosiveGasStrength, 2 + zapLevel);
		}
		for (const victim of zapTargets) {
			//WandOfLightning.onZap() skips characters sharing the caster's alignment,
			//except for the caster itself, which takes half damage. The target is an
			//enemy in this port, so an allied chain participant is a same-alignment skip.
			if (wandType === 'lightning' && victim !== this.hero && victim.isAlly) continue;
			const raw = wandType === 'corrosion' || wandType === 'corruption'
				? 0
				: wandType === 'blastWave'
					? Random.normalRange(...wandDamageRange('blastWave', zapLevel))
				: wandType === 'livingEarth'
					? Random.normalRange(...livingEarthZapRange(this.depth))
				: wandType === 'lightning'
					? Random.normalRange(...wandDamageRange('lightning', zapLevel))
						: wandType === 'prismaticLight'
							? Random.normalRange(...wandDamageRange('prismaticLight', zapLevel))
							: wandType === 'disintegration'
								? Random.normalRange(...wandDamageRange('disintegration', zapLevel))
					: wandType === 'frost'
						? Random.normalRange(...wandDamageRange('frost', zapLevel))
						: Random.normalRange(...wandDamageRange('magicMissile', zapLevel));
			const frostBlocked = wandType === 'frost' && victim.buffs['frost'] !== undefined;
			let damage = Math.round(raw * lightningMultiplier)
				+ (victim === target ? enragedCatalystBonus(this.subclass(), this.talentRank('enraged_catalyst'), this.hero.hp, this.hero.maxHp) + this.wandBonusDamage : 0);
			if (wandType === 'lightning' && victim === this.hero) damage = Math.round(damage * 0.5);
		//`Char.Property.ELECTRIC` (`Char.java`, tag `v3.3.8`) resists the
		//`WandOfLightning` class: `Char.damage()` halves with `Math.round` on
		//every holder (shock elemental, DM100, Pylon, BrightFist). The blob seam
		//carries the `Electricity` class, `shockingArc` and the shock arc carry
		//`Shocking`; darts and the Potential talent have no mob-damage seam of
		//their own (stated, not silent).
		if (wandType === 'lightning' && !victim.isHero
			&& electricDamageHalved(victim.kind, victim.elementalType, victim.yogFistType)) damage = Math.round(damage * 0.5);
			if (wandType === 'frost') {
				//WandOfFrost.onZap() clears Fire at the collision cell. A frozen target
				//cannot be affected again; otherwise existing Chill reduces this bolt's
				//damage by 6.67% per remaining turn, capped at 10 (tag v3.3.8).
				//The real `Freezing` path also freezes heaps and clears the next cell of
				//EternalFire when the Ballistica collision ends one tile short. The port
				//has no heap-freeze primitive, but the selected creature gives us the
				//collision direction needed for that second EternalFire cell.
				this.fire.clear(target.x, target.y);
				if (this.eternalFire.volumeAt(target.x, target.y) > 0) this.eternalFire.clear(target.x, target.y);
				const stepX = Math.sign(target.x - this.hero.x), stepY = Math.sign(target.y - this.hero.y);
				const beyond = { x: target.x + stepX, y: target.y + stepY };
				if (this.level.inside(beyond.x, beyond.y) && this.eternalFire.volumeAt(beyond.x, beyond.y) > 0) {
					this.eternalFire.clear(beyond.x, beyond.y);
				}
				if (frostBlocked) damage = 0;
				else if (victim.buffs['chill'] !== undefined) {
					damage = Math.round(damage * Math.pow(0.9333, Math.min(10, victim.buffs['chill'])));
				}
				//`Char.Property.ICY` (`Char.java`, tag `v3.3.8`) resists the `WandOfFrost`
				//class: `Char.damage()` halves with `Math.round` after the chill cut
				//above (Java computes that cut in `onZap`, then halves in `damage()`).
				//The only ICY holder is the frost elemental.
				if (icyDamageHalved(victim.kind, victim.elementalType)) damage = Math.round(damage * 0.5);
			}
			if (wandType === 'prismaticLight' && isUndeadOrDemonic(victim.kind)) {
				//`WandOfPrismaticLight.affectTarget()`: against a `Property.DEMONIC` or
				//`Property.UNDEAD` target the bolt deals `round(dmg * 1.333)` and plays the
				//shadow-burn FX; everyone else takes the plain roll. The multiplier was
				//previously missing entirely, so holy light hit a demon for no bonus at all.
				damage = Math.round(damage * 1.333);
			}
			this.wandBonusDamage = victim === target ? 0 : this.wandBonusDamage;
			//`AntiMagic.RESISTS` lists `WandOfBlastWave`/`WandOfDisintegration`/`WandOfFrost`/
			//`WandOfLightning`/`WandOfLivingEarth`/`WandOfMagicMissile`/`WandOfPrismaticLight`
			//by name: `Char.damage()` zeroes any hit whose source class is in that set for a
			//MagicImmune victim. `WandOfCorrosion`/`WandOfCorruption` are not RESISTS members
			//(their own `raw` roll is already 0 here, dealt with separately below), so they
			//keep their non-damage effects regardless of `magicImmune`.
			const resistedWandDamage = wandType !== 'corrosion' && wandType !== 'corruption' && victim.magicImmune;
			const livingEarthGuardian = wandType === 'livingEarth' && victim.allyKind === 'earthGuardian';
			if (resistedWandDamage) {
				// no damage, no heal-through-the-guardian branch either - a fully blocked hit
			} else if (livingEarthGuardian) {
				//EarthGuardian.setInfo(): shooting the guardian heals it by the fresh
				//damage roll; the guardian is never damaged by its own wand.
				victim.hp = Math.min(victim.maxHp, victim.hp + Math.max(0, raw));
				this.showHeal(victim, Math.max(0, raw));
			} else {
				//`DwarfKing.damage()` 459-467: any `Wand` except `WandOfLightning` clears the
				//boss-challenge flag. Lightning keeps it (Java's explicit exception).
				if (wandType !== 'lightning' && damage > 0) this.disqualifyBossChallenge(victim);
				const dealt = victim.isHero ? this.absorbHeroDamage(damage, true) : damage;
				victim.hp -= dealt;
				//`WandOfLightning.onZap()` (tag `v3.3.8`): the burst shakes
				//(`2, 0.3f`) for every affected char that is the hero.
				if (victim.isHero && wandType === 'lightning') this.shakeScreen(2, 0.3);
				if (this.fadeMirrorOnDamage(victim, damage)) continue;
				//Allies are never `kill()`ed on this seam (`!victim.isAlly` below),
				//so a lethally-zapped image must enter its fade here, not at the
				//kill backstop - otherwise it would linger at 0 HP and keep acting.
				if (this.enterPrismaticFade(victim, dealt)) continue;
				this.showDamage(victim, dealt);
				victim.sleeping = false;
			}
			if (wandType === 'livingEarth' && !livingEarthGuardian) {
				//WandOfLivingEarth.onZap() adds the successful damage roll to
				//RockArmor, capped at twice armorToGuardian(). Once the cap is reached,
				//the Java actor is created and consumes that stored armor.
				const guardian = this.creatures.find((c) => c.allyKind === 'earthGuardian' && c.hp > 0);
				if (guardian) {
					guardian.hp = Math.min(guardian.maxHp, guardian.hp + Math.max(0, raw));
					this.showHeal(guardian, Math.max(0, raw));
				} else {
					this.livingEarthWandLevel = Math.max(this.livingEarthWandLevel, zapLevel);
					this.livingEarthArmor = Math.min(
						2 * (8 + 4 * this.livingEarthWandLevel),
						this.livingEarthArmor + Math.max(0, raw),
					);
					this.maybeSummonEarthGuardian(victim);
				}
			}
			if (wandType === 'blastWave' && victim.hp > 0) {
				//`WandOfBlastWave.throwChar()` (tag v3.3.8): adjacent victims are
				//pushed away from the impact cell by `1 + round(level/2)` cells.
				//The port's straight forced-movement path keeps the same displacement
				//result, while terrain pressing and collision damage remain simplified.
				const strength = 1 + Math.round(zapLevel / 2);
				const dx = Math.sign(victim.x - target.x), dy = Math.sign(victim.y - target.y);
				for (let push = 0; push < strength; push++) {
					const next = { x: victim.x + dx, y: victim.y + dy };
					if (!this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y)) break;
					this.moveTo(victim, next);
				}
			}
			if (wandType === 'corruption' && !victim.isHero && !victim.isNPC) {
				//WandOfCorruption.corruptEnemy() creates a permanent controlled ally
				//after healing/cleansing it. The port has no separate Corruption buff
				//or loot-transfer payload, so the existing ally scheduler is used for
				//the observable controlled-combat result.
				victim.isAlly = true;
				victim.allyKind = 'mirror';
				victim.hp = victim.maxHp;
				victim.buffs = {};
				victim.sleeping = false;
				victim.seesHero = false;
			}
			if ((wandType === 'frost') && victim === target && victim.hp > 0 && !frostBlocked) {
				addBuff(victim, 'chill');
				victim.buffs.chill = Math.max(victim.buffs.chill ?? 0, (this.level.get(victim.x, victim.y) === WATER ? 4 : 2) + zapLevel);
			}
			if (wandType === 'prismaticLight' && Random.int(0, 5 + zapLevel) >= 3) addBuff(victim, 'daze');
			this.sprite(victim).setColorAdd(0.6, 0.7, 1);
			if (wandType === 'corrosion') this.say(t('port.log.wandcorrosion', { target: victim.name }), 'positive');
			else if (wandType === 'corruption') this.say(t('port.log.wandcorruption', { target: victim.name }), 'positive');
			else this.say(t('port.log.wandhits', { target: victim.name, damage }), 'positive');
			if (victim.hp <= 0 && !victim.isAlly) this.kill(victim);
		}
		}
		return true;
	},

	/**
	 * The class's real day-one ranged action (see the file header) against the nearest
	 * visible, in-range, in-sight target - `mwg/roguelike`'s `canTarget`/`chebyshevDistance`
	 * doing exactly the targeting work they were built for.
	 *
	 * Mage zaps through `mwg/actors` Charges (max 4 = 3 + the staff's +1, starting full,
	 * recharging over turns using Java's missing-charge-dependent delay); Cleric invokes the
	 * HolyTome through its own slow charges (the SP economy has no other model here). Thrown
	 * stacks use persistent durability and decrease only when a projectile breaks.
	 *
	 * @returns false for "nothing happened, no turn spent" (no target, no ammo/charge) - true
	 * once the shot is actually taken
	 */
	useSpecial(this: DungeonScene): boolean {
		this.cancelHourglassFreeze();
		// `MissileWeapon.doThrow()` opens a cell selector before resolving the throw. This port
		// used to auto-select the nearest visible enemy; MWG's renderer-free TargetingController
		// now supplies that cursor/range/LOS seam. Confirmation only latches a target and re-enters
		// this method, so the existing throw path still owns every mutation and turn cost.
		if (this.armorAbility === 'ratmogrify') return this.useRatmogrify();
		const special = CLASSES[this.heroClass].special;

		if (special.kind === 'none') {
			//HolyTome: heal 5+2*lvl through slow charges, standing in for the SP economy
			if (!this.tomeCharges.spend(1)) {
				this.say(t('port.log.tomecharging'));
				return false;
			}
			const heal = Math.min(this.hero.maxHp - this.hero.hp, 5 + 2 * this.progression.level);
			this.hero.hp += heal;
			this.grantHeroShield(monasticVigorShield(this.subclass(), this.talentRank('monastic_vigor')), this.hero.maxHp);
			this.say(t('port.log.tomeheal', { heal }), 'positive');
			return true;
		}
		const improvised = special.kind === 'throw' && canImproviseProjectile(this.heroClass, this.talentRank('improvised_projectiles'), this.bag.find('stone')?.quantity ?? 0);
		if (special.kind === 'throw' && this.ammo <= 0 && !improvised) {
			this.say(t('port.log.noammo', { item: t(special.labelKey) }), 'negative');
			return false;
		}
		//`Wand.chargesPerCast()`, overridden by exactly two wands: Regrowth and Fireblast, both with
		//Java's own rule - `gate(1, ceil(curCharges * 0.3), 3)`, and 1 when the wand is cursed (this
		//port has no cursed-wand concept, so that clause cannot arise here). Every other wand casts
		//for one charge. This used to be computed for Regrowth alone, so a Fireblast wand always cast
		//at one charge where Java spends up to three (and deals `3*(6 + 2*lvl)` rather than `2 + 2*lvl`).
		const chargesPerCast = wandChargesPerCast(this.wandType, this.wandCharges.current);
		if (special.kind === 'zap' && !this.wandCharges.canAfford(chargesPerCast)) {
			this.say(t('port.log.staffempty'), 'negative');
			return false;
		}

			//`Talent.EMPOWERING_SCROLLS` prospectively: an armed charge makes the coming zap read
			//+3 levels, including disintegration's level-scaled targeting range - the charge is
			//only consumed once the zap actually fires (see the zap branch), so this previews
			//the bonus without spending it on a cancelled aim.
			const range = special.kind === 'throw' ? 6 : wandTargetRange(this.wandType, this.weaponLevel + (this.empoweredZaps > 0 ? EMPOWERING_SCROLLS_BONUS : 0));
		if (special.kind === 'zap' && this.wandType === 'disintegration') {
			this.beginAiming({
				range,
				requireLineOfSight: false,
				shape: { kind: 'line' },
				onConfirm: (cell) => this.confirmDisintegrationWand(cell, chargesPerCast),
			});
			return false;
		}
		// The remaining wand families in this port currently resolve their effects around a
		// creature target. Java's wand action opens a cell selector; use the same MWG controller
		// here and keep the existing per-wand ally/guardian eligibility as the validation hook.
		// Empty-cell collision targeting for area wands remains a separate, documented gap.
		if (special.kind === 'zap' && !this.specialTarget) {
			const validTarget = (candidate: Creature): boolean => !candidate.isHero && !candidate.isNPC
				&& candidate.hp > 0 && this.fov.isVisible(candidate.x, candidate.y)
				&& (this.wandType === 'transfusion' || this.wandType === 'warding'
					|| (this.wandType === 'livingEarth' && candidate.allyKind === 'earthGuardian') || !candidate.isAlly)
				&& Roguelike.canTarget(this.level, this.hero, candidate, { range });
			if (!this.creatures.some(validTarget)) {
				this.say(t('port.log.notarget'), 'negative');
				return false;
			}
			this.beginAiming({
				range,
				initial: this.creatures.filter(validTarget)
					.sort((a, b) => Roguelike.chebyshevDistance(this.hero, a) - Roguelike.chebyshevDistance(this.hero, b))[0],
				validate: (cell) => {
					const candidate = this.creatureAt(cell.x, cell.y);
					return !!candidate && validTarget(candidate);
				},
				onConfirm: (cell) => {
					this.specialTarget = this.creatureAt(cell.x, cell.y);
					this.useSpecial();
				},
			});
			return false;
		}
		//`shoot` (SpiritBow) opens the same selector as a throw - it used to auto-pick the nearest, so it could not be retargeted
		if ((special.kind === 'throw' || special.kind === 'shoot') && !this.specialTarget) {
			const nearest = this.nearestVisibleEnemy(range);
			if (!nearest) {
				this.say(t('port.log.notarget'), 'negative');
				return false;
			}
			this.beginAiming({
				range,
				initial: nearest,
				validate: (cell) => {
					const candidate = this.creatureAt(cell.x, cell.y);
					return !!candidate && candidate.hp > 0 && !candidate.isHero && !candidate.isNPC
						&& !candidate.isAlly && this.fov.isVisible(candidate.x, candidate.y);
				},
				onConfirm: (cell) => {
					this.specialTarget = this.creatureAt(cell.x, cell.y);
					this.useSpecial();
				},
			});
			return false;
		}
		const selectedSpecialTarget = this.specialTarget;
		this.specialTarget = null;
		const target = selectedSpecialTarget ?? this.creatures
			.filter((c) => !c.isHero && !c.isNPC && this.fov.isVisible(c.x, c.y)
				&& (this.wandType === 'transfusion' || this.wandType === 'warding'
					|| (this.wandType === 'livingEarth' && c.allyKind === 'earthGuardian') || !c.isAlly))
			.filter((c) => Roguelike.canTarget(this.level, this.hero, c, { range }))
			.sort((a, b) => (this.wandType === 'transfusion' && a.isAlly !== b.isAlly ? (a.isAlly ? -1 : 1)
				: this.wandType === 'warding' && a.allyKind !== b.allyKind ? (a.allyKind === 'ward' ? -1 : 1)
				: this.wandType === 'livingEarth' && a.allyKind !== b.allyKind ? (a.allyKind === 'earthGuardian' ? -1 : 1)
				: Roguelike.chebyshevDistance(this.hero, a) - Roguelike.chebyshevDistance(this.hero, b)))[0];

		if (!target) {
			this.say(t('port.log.notarget'), 'negative');
			return false;
		}

		//`MissileWeapon.doThrow()`'s pre-throw warning, before any of the throw's effects: Java asks
		//first and only throws from the window's "Yes". The port's action is synchronous, so the
		//confirm re-enters this same method with the flag set, rather than duplicating the branch.
		if (special.kind === 'throw' && !this.missileThrowConfirmed && this.missileThrowNeedsConfirm()) {
			this.confirmMissileThrow(t(special.labelKey), target);
			return false;
		}
		if (special.kind === 'throw') this.missileThrowConfirmed = false;
		//The flight sprite is the thrown item's own art (`MissileSprite.reset()` flies
		//`view(item)`): an improvised stone flies stone art, not the pile's class. Reaching
		//the throw block with an empty pile means IMPROVISED_PROJECTILES (an empty pile
		//without the talent turns away above), so `!carried` is exactly the stone case -
		//which is why a stone used to fly past as a dart whenever the pile still named one.
		let thrownSourceClass = this.ammoSourceClass;
		let thrownTippedSeed = this.ammoTippedSeed;
		if (special.kind === 'throw') {
			const carried = this.ammo > 0;
			if (!carried) {
				thrownSourceClass = 'ThrowingStone';
				thrownTippedSeed = undefined;
			}
			//`Talent.IMPROVISED_PROJECTILES` throws a *carried* stack instead of the equipped one, so
			//the throw has to read that stack's own level - `MissileWeapon.min()/max()` are the item's
			//level, not the hero's. This used to read the pile's level, which is 0 for a hero with an
			//empty pile - i.e. exactly the state that talent exists for.
			const improvisedStack = carried ? undefined : this.bag.find('stone');
			if (!carried) this.bag.remove('stone', 1);
			const thrownLevel = carried ? this.missileLevel : improvisedStack?.level ?? 0;
			//`MissileWeapon.min()`/`max()` are authored with the missile identity and its
			//upgrade increments in MWL; this adapter only applies the live stack level and
			//Sharpshooting bonus. The hit roll and ammo mutation remain executable behavior.
			const sharpshooting = ringSharpshootingBonus(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing());
			const missile = special.sourceClass ? MWL_MISSILE_BY_CLASS.get(special.sourceClass) : undefined;
			if (!missile) throw new Error(`MWL missile definition is missing for ${this.heroClass}`);
			const thrownDamage = missileDamageRange(missile.sourceClass, thrownLevel, sharpshooting);
			//`Dart.processChargedShot()`: an untipped dart fired from a wielded crossbow
			//with an armed shot deals +4+bow level on both ends (tipped darts are
			//excluded - `!(this instanceof TippedDart)` - and the bow level is the
			//crossbow's own). Tipped-ness here is the seed the pile was tipped with.
			if (this.chargedShotArmed && this.weaponMeleeKey() === 'crossbow' && this.ammoTippedSeed === undefined) {
				const chargedBonus = 4 + this.degradedLevel(this.weaponLevel);
				thrownDamage[0] += chargedBonus;
				thrownDamage[1] += chargedBonus;
			}
			//rolls to hit exactly like a melee swing (SPD's MissileWeapon shares Weapon's
			//accuracy machinery) - only the damage range and the range itself differ.
			//`MissileWeapon.accuracyFactor()` = `Weapon.accuracyFactor() * adjacentAccFactor()`:
			//a thrown weapon is -50% accurate at melee range (Point Blank raises that to
			//0.75/1.0/1.25) and +50% at any distance. `Hero.attackSkill()` folds the factor into
			//the accuracy stat, which is where `attack()`'s `accFactor` puts it - so a throw
			//finally honours Point Blank, and *only* as accuracy: this port used to apply the
			//talent as a `1 + 0.2*rank` damage multiplier at `distance <= 2`, which Java never
			//does (see `missiles.ts`'s `missileAdjacentAccFactor`).
			const thrownAccFactor = missileAdjacentAccFactor(
				Roguelike.chebyshevDistance(this.hero, target) === 1,
				true,
				this.talentRank('point_blank'),
			);
			//`FishingSpear.proc()` is a *damage floor*, not an after-hit effect: against a piranha
			//the throw deals at least half the piranha's remaining HP
			//(`damage = max(damage, defender.HP/2)`). Java raises the rolled damage; this port rolls
			//inside `attack()`, so the floor goes on the range's minimum, which the roll cannot go
			//below - the same outcome for every possible roll.
			if (this.ammoSourceClass === 'FishingSpear' && (target.kind === 'piranha' || target.kind === 'phantomPiranha')) {
				thrownDamage[0] = Math.max(thrownDamage[0], Math.floor(target.hp / 2));
			}
			const hit = this.attack({ ...this.hero, kind: undefined, attackMode: 'throw', damage: thrownDamage }, target, thrownAccFactor);
			//`Crossbow.ChargedShot`: the forced hit above is the "always hits" half; the dart
			//also applies on-hit effects to enemies in a 5x5 area around the target (tipped
			//darts last longer than that area's ordinary coverage - see `TippedDart`).
			//Consumed on the throw, hit or miss.
			if (this.chargedShotArmed) {
				this.chargedShotArmed = false;
				if (this.weaponAffix && !getCurse(this.weaponAffix)) {
					for (const other of this.creatures.filter((c) => c !== target && !c.isHero && !c.isNPC && c.hp > 0
						&& Roguelike.chebyshevDistance(target, c) <= 2 && this.fov.isVisible(c.x, c.y))) {
						this.heroOnHit({ ...this.hero, kind: undefined, attackMode: 'throw' }, other, 0);
					}
				}
			}
			//`SpiritBow.proc()`'s Nature's-Power block runs on the hit, before the missile's own
			//durability bookkeeping below.
			if (hit) this.applyNaturesPowerOnHit(target);
			//`Weapon.proc()` runs on a hit, before the durability bookkeeping below.
			if (hit) this.applyMissileClassProc(target);
			//rangedHit(): durability decreases only on a HIT (a miss just drops the missile
			//via rangedMiss -> onThrow) - hence resolving after attack()'s hit boolean rather
			//than up front, which also wrongly wore missiles down on every miss.
			let missileSurvived = true;
			if (hit && carried) {
				//durabilityPerUse(): the exact formula is in missileDurabilityCost() above.
				//Break and about-to-break use the real log lines.
				const cost = this.missileDurabilityCost();
				this.ammoDurability -= cost;
				if (this.ammoDurability <= 0) {
					this.ammo--;
					this.ammoDurability = this.ammo > 0 ? MISSILE_MAX_DURABILITY : 0;
					missileSurvived = false;
					this.say(t('port.log.missilebroken'), 'negative');
				} else if (this.ammoDurability <= cost) {
					this.say(t('items.weapon.missiles.missileweapon.about_to_break'), 'warning');
				}
			}
			if (missileSurvived) {
				//`HeavyBoomerang.rangedHit()`/`rangedMiss()` (tag `v3.3.8`) override *both* paths to
				//hand the missile to `CircleBack` instead of leaving it where it landed - a boomerang
				//is the one missile that comes back on its own. `rangedMiss` attaches it
				//unconditionally (a miss never wears it), `rangedHit` only while durability remains,
				//which is exactly the `missileSurvived` state reached here. `sticky` is `false` for a
				//boomerang, so it never sticks to a living target either - which is why the
				//stick/drop split below must not run for it.
				if (this.ammoSourceClass === 'HeavyBoomerang') {
					this.scheduleBoomerangReturn(target.x, target.y, carried);
				} else if (hit && target.hp > 0 && this.heroClass !== 'warrior') {
					target.stuckAmmo = (target.stuckAmmo ?? 0) + 1;
				} else {
					const dropAt = this.freeCellNear(target) ?? target; //one heap per cell: a landing on an occupied cell used to vanish (Java stacks)
					this.spawnGroundItem('stone', dropAt.x, dropAt.y);
					const heap = this.groundItemAt(dropAt.x, dropAt.y);
					if (heap) {
						heap.missileLevel = this.missileLevel;
						heap.missileSet = this.ammoSetId;
						if (this.ammoTippedSeed !== undefined) heap.tippedSeed = this.ammoTippedSeed;
					}
				}
				//the thrown unit leaves the pile (a boomerang's own return already did); `recoverStone` credits it back on pickup
				if (carried && this.ammoSourceClass !== 'HeavyBoomerang') { this.ammo = Math.max(0, this.ammo - 1); if (this.ammo === 0) this.ammoDurability = 0; }
			}
			if (this.heroClass === 'huntress' && this.talentRank('followup_strike') > 0) { this.followupTarget = target; this.followupDamage = this.talentRank('followup_strike') === 1 ? 2 : 3; }
			if (this.talentRank('deadly_followup') > 0) this.deadlyFollowupTarget = target;
			//`Talent.SEER_SHOT`: the thrown arrow lands at the victim's cell (see `procSeerShot`).
			this.procSeerShot(target.x, target.y);
		} else if (special.kind === 'zap') {
			const fullyCharged = this.wandCharges.current === this.wandCharges.max;
			const lastCharge = this.wandCharges.current === 1;
			this.wandCharges.spend(chargesPerCast);
			//`Talent.EMPOWERING_SCROLLS`: one armed charge per zap action makes this zap read
			//+3 levels through `effectiveZapLevel()` below (damage, corrosion, statuses, and the
			//regrowth/fireblast/transfusion/warding helpers). Consumed even when the bolt itself
			//fizzles (crab parry): the charge paid for a zap, which is what arms it.
			this.empoweredZapBonus = this.empoweredZaps > 0 ? EMPOWERING_SCROLLS_BONUS : 0;
			if (this.empoweredZaps > 0) this.empoweredZaps--;
			const preservation = preservationChance(this.talentRank('wand_preservation'));
			if (preservation > 0 && Random.chance(preservation)) this.wandCharges.refund(1);
			if (lastCharge && this.talentRank('backup_barrier') > 0) this.grantHeroShield(this.talentRank('backup_barrier') === 1 ? 3 : 5, this.hero.maxHp);
			//GreatCrab.damage negates wand bolts from a seen hero - kept verbatim
			//`GreatCrab.damage()` (tag v3.3.8): `enemySeen && state != SLEEPING && paralysed == 0
			//&& src instanceof Wand && enemy == Dungeon.hero && enemy.invisible == 0`. This port's
			//`seesHero` already folds in both the sight check and the invisibility bypass (a
			//monster's `seesHero` is computed false while the hero is invisible - see where it's
			//set), so only the missing `paralysed == 0` term needed adding; `!target.sleeping`
			//alone previously let a paralysed crab (which cannot act, let alone react to a hit)
			//still parry every wand hit.
			//A parried bolt skips the tail like the pre-extraction `else` did: no
			//excess-charge shield, no arcane-vision mark, and the empowered bonus (freshly
			//set per zap above) is left for the next shot exactly as before.
			if (this.fireWandShot(this.wandType, this.effectiveZapLevel(), target, chargesPerCast)) {
				if (fullyCharged && this.talentRank('excess_charge') > 0) this.grantHeroShield(Math.ceil((this.talentRank('excess_charge') * Math.max(1, this.effectiveZapLevel())) / 1.5), this.hero.maxHp);
				//Arcane Vision (Mage T2, `Wand.wandProc()`): every zap marks its target with
				//`CharAwareness` for `5+5*points` turns (see through walls). No per-target
				//awareness primitive exists here, so the existing all-mobs `mindvision` stands
				//in at the real duration (over-broad, stated) - never shortened below an
				//active potion's remainder.
				if (this.heroClass === 'mage' && this.talentRank('arcane_vision') > 0) {
					this.hero.buffs['mindvision'] = Math.max(this.hero.buffs['mindvision'] ?? 0, arcaneVisionDuration(this.talentRank('arcane_vision')));
				}
				this.empoweredZapBonus = 0;
			}
		} else {
			//SpiritBow.damageRoll: a normal hit roll, but the base damage is scaled by
			//distance (min(3, 1.2 * 1.125^(distance-1))) before armor is subtracted.
			//`MissileWeapon.accuracyFactor()` covers the bow too - `SpiritBow` inherits it,
			//so the adjacent `0.5 + 0.25*POINT_BLANK` / distance `1.5` factor applies here
			//(the sniperSpecial + DAMAGE-augment infinite clause has no bow-augment system
			//to read, so the plain factor always applies). Point Blank is accuracy-only in
			//Java: the `1 + 0.2*rank` damage bonus this branch used to add at close range
			//never existed (it appears exactly once in Java, in `adjacentAccFactor`).
			//`SpiritBow.speedMultiplier()` while Nature's Power is up (tag `v3.3.8`): the bow
			//gains `(8 + GROWING_POWER)/24` speed additively. Turn costs spend through the
			//shared `spendTurn` port below, so the shot stashes its divisor for that port to
			//consume - sniper specials are exempt in Java, but none exist here, so no gate.
			if (this.naturesPowerTurns > 0) {
				this.pendingBowNpDivisor = 1 + (8 + this.talentRank('growing_power')) / 24;
			}
			const bowAccFactor = missileAdjacentAccFactor(
				Roguelike.chebyshevDistance(this.hero, target) === 1,
				true,
				this.talentRank('point_blank'),
			);
			if (!rollHit(this.hero, target, false, false, bowAccFactor)) {
				this.say(t('port.log.arrowmisses', { target: target.name }), 'negative');
			} else {
				const distance = Roguelike.chebyshevDistance(this.hero, target);
				const multiplier = Math.min(3, 1.2 * Math.pow(1.125, distance - 1));
				//SpiritBow.min()/max(): RingOfSharpshooting's bonus is asymmetric here - +bonus on
				//the low end, +2*bonus on the high end (unlike MissileWeapon's identical +bonus
				//on both bounds above).
				const sharpshooting = ringSharpshootingBonus(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing());
				const base = Random.normalRange(special.damage[0] + sharpshooting, special.damage[1] + 2 * sharpshooting);
				const dr = Random.normalRange(target.armor[0], target.armor[1]);
				const momentum = projectileMomentumBonus(this.subclass(), this.talentRank('projectile_momentum'), this.projectileMomentumReady);
				const damage = Math.max(0, Math.round(base * multiplier * (this.subclass() === 'sniper' ? 1.15 : 1)) - dr) + momentum;
				this.projectileMomentumReady = false;
				target.hp -= damage;
				this.showDamage(target, damage);
				this.sprite(target).setColorAdd(1, 1, 1);
				this.say(t('port.log.shoot', { target: target.name, damage }), 'positive');
				if (this.talentRank('followup_strike') > 0) { this.followupTarget = target; this.followupDamage = this.talentRank('followup_strike') === 1 ? 2 : 3; }
				//`Talent.SEER_SHOT` procs from bow shots the same way (`procSeerShot`).
				this.procSeerShot(target.x, target.y);
				if (target.hp <= 0) {
					//SpiritBow kills are missile-weapon kills (`cause instanceof Weapon`), so
					//Lethal Haste triggers here just like at the melee/throw kill site above;
					//wand-zap kills never do (the Wand is not a Weapon - see `lethalHasteOnKill`).
					this.lethalHasteOnKill();
					this.kill(target);
				}
			}
		}

		//MeleeWeapon.useAbility()'s Duelist branch: shield = `1 + 2*points` (3/5), gated on a
		//(Flat HP/HT <= 0.5 - not a flat 3 with an invented per-rank threshold (0.4/0.6,
		//no Java basis at any rank) - found in the 2026-09-09 hero-progression audit.
		//`AGGRESSIVE_BARRIER` used to fire here, on the class special, from before this
		//scene had a real T-key ability path; Java fires it on weapon-ability use
		//specifically, so it now lives in `takeAbilityCharge` and this block is gone.)
		//Thrown piles and spirit arrows fly their own item art; wand bolts keep the dot.
		this.spawnProjectile(this.hero, target,
			special.kind === 'throw' ? missileFlightArt(thrownSourceClass, thrownTippedSeed)
			: special.kind === 'shoot' ? missileFlightArt('SpiritArrow')
			: null);
		return true;
	},

	spawnProjectile(this: DungeonScene, from: Creature, to: Creature, art?: MissileFlightArt | null): void {
		//`MissileSprite.reset()`: `view(item)` flies the thrown item's own art, spinning
		//at the class's `ANGULAR_SPEEDS` rate (boomerang/bolas/shuriken; everything else
		//flies straight). No art means the dot fallback - never a tinted item sprite.
		const sprite = art ? new TintedSprite(this.itemsSheet.get(art.frame)) : new TintedSprite(this.dotTexture);
		if (!art) sprite.tint = 0xffdd66;
		this.creatureLayer.addChild(sprite);

		const [fx, fy] = this.worldOf(from);
		const [tx, ty] = this.worldOf(to);
		this.projectiles.push({
			flight: new Projectile(sprite, { x: fx, y: fy }, { x: tx, y: ty }, { speed: 300 }),
			sprite,
			spin: art?.spin ?? 0,
		});
	},

	/**
	 * `MagicMissile.boltFromChar(parent, type, from, toPos, callback)` (tag `v3.3.8`):
	 * a plain travelling dot from a creature's own cell to an arbitrary cell (not
	 * necessarily an occupant), tinted per missile kind, running `onArrive` once it
	 * lands - the shape `GuidingLight.onTargetSelected()` uses for its own
	 * `LIGHT_MISSILE` bolt. Reuses the same `Projectile`/`projectiles` primitive
	 * `spawnProjectile` above drives for thrown weapons, just without requiring a
	 * `Creature` at the destination.
	 */
	spawnBoltTo(this: DungeonScene, from: Creature, to: { x: number; y: number }, tint: number, onArrive?: () => void): void {
		const sprite = new TintedSprite(this.dotTexture);
		sprite.tint = tint;
		this.creatureLayer.addChild(sprite);
		const [fx, fy] = this.worldOf(from);
		const tx = (to.x + 0.5) * TILE, ty = (to.y + 0.5) * TILE;
		this.projectiles.push({
			flight: new Projectile(sprite, { x: fx, y: fy }, { x: tx, y: ty }, { speed: 300 }),
			sprite,
			spin: 0,
			onArrive,
		});
	},

	// -------------------------------------------------------------- the loop

	runTurns(this: DungeonScene): void {
		this.simulation.runTurns();
	},

	/**
	 * Java's Buff.act() boundary for temporary monster speed effects. The buff ticks
	 * live in `simulation/buffs.ts` as `tickMonsterTurnEnd` - the file-size refactor's
	 * thirty-fourth extraction, behavior-identical. Death-mark and time-bubble stay
	 * here: they read scene systems, not buff clocks.
	 */
	afterMonsterTurn(this: DungeonScene, monster: Creature): void {
		this.tickDeathMark(monster);
		//One absorbed own-turn for a TimeBubble owner, read by `monsterTurnCost` above.
		monster.timeBubbleTurns = spendTimeBubbleTurn(monster.timeBubbleTurns);
		//The flow hands back one of the scene's own monsters, so the cast is exact.
		tickMonsterTurnEnd(monster, (m) => addBuff(m as Creature, 'focus'));
	},

	onAction(this: DungeonScene, action: string): boolean {
		//A window is up: Java's `Window.onSignal` swallows every key while one is open, so the map
		//underneath must not receive the action either. The scene's `Input.onAction` listener asks
		//the windows first (`gameWindows.handleAction`, MWG 0.8.0 item 325), so by the time an
		//action reaches here the top window has already declined it - but `WindowStack.blocksWorld`
		//is still MWG's seam for that state, and this guard also protects the direct `onAction`
		//calls (adjacent-tile clicks) that never pass through the listener. This returns "not
		//consumed" on purpose for anything else while a window is open, so the key stays
		//available to the stack's own `Input.onAction` listener rather than being swallowed here
		//(consuming here would starve a window's own widgets of the arrow keys they need).
		//`cancel` is the exception - closing the top window is what the stack does with it, so
		//it is left to the stack.
		if (this.gameWindows.blocksWorld && action !== 'cancel') return false;
		if (this.journalOpen) {
			if (action === 'cancel' || action === 'confirm') this.closeJournal();
			return true;
		}
		//Java's `SPDAction.ZOOM_IN`/`ZOOM_OUT` (`PLUS`/`EQUALS`/`MINUS`): a free camera
		//action that spends no turn, so it sits ahead of the hero-state gate - zooming
		//while dead or mid-animation is harmless, exactly as Java's pinch zoom is.
		if (action === 'zoomIn' || action === 'zoomOut') {
			setZoomOffset(zoomOffset() + (action === 'zoomIn' ? 1 : -1));
			return true;
		}
		if (this.gameOver || !this.awaitingInput) {
			//Java's `GameScene.onBackPressed` is independent of the hero's state, and a dead hero is
			//exactly who `WndGame`'s Start/Rankings entries exist for. A turn still in flight is the
			//one case this port holds back on: unlike Java it saves mid-animation (`saveRun` below),
			//so the menu waits for the hero to act again - which `awaitingInput` reports.
			if ((action === 'cancel' || action === 'gameMenu') && this.gameOver && this.menuCanOpen()) {
				this.openGameMenu();
				return true;
			}
			return false;
		}
		//An active aim owns the keyboard too: arrows move the cursor, Confirm resolves it, and
		//anything else (Cancel included) abandons it rather than acting through it.
		if (this.aiming) {
			const move = MOVES[action];
			if (move) {
				this.aiming.controller.move(move.x, move.y);
				this.refreshAimOverlay();
			} else if (action === 'confirm') {
				this.confirmAiming();
			} else {
				this.cancelAiming();
			}
			return true;
		}
		//The item picker is now owned by WindowStack. It has already had first refusal above; if its
		// Window does not consume this action, keep it from falling through to the talent toggle or
		// the world, just as a modal Java Window would.
		if (this.itemPickerOpen) return false;
		if ((this.subclassChoiceOpen || this.armorChoiceOpen || this.augmentChoiceOpen) && action !== 'talents') {
			this.talentOpen = true;
			this.refreshTalentPanel();
			return false;
		}

		// WndBag is modal: arrows select slots and confirm opens item actions.
		if (this.inventoryOpen) return this.inventoryPanel.handleAction(action);
		//`GameScene.onBackPressed()`: `if (!cancel()) add(new WndGame())`. Java's `Window`s take the
		//back key first (`Window.onSignal`), `cancel()` then handles an in-progress hero action or
		//the cell selector, and only what is left opens `WndGame` - so by the time an action reaches
		//here, every window and overlay above has already had its chance. `gameMenu` is the toolbar's
		//on-screen equivalent (`MenuPane`'s own menu entry), since a pointer-only player has no Escape.
		if ((action === 'cancel' || action === 'gameMenu') && this.menuCanOpen()) {
			this.openGameMenu();
			return true;
		}
		//`SPDSettings.interfaceSize()`: toggles the small/large interface layout. Free action:
		//no turn is spent, matching Java's settings change.
		if (action === 'toggleInterfaceSize') {
			this.interfaceSize = this.interfaceSize === 1 ? 0 : 1;
			this.gameLog.setInterfaceSize(this.interfaceSize);
			this.refresh();
			this.say(t(this.interfaceSize === 1 ? 'port.log.largeui' : 'port.log.smallui'));
			return true;
		}
		//Java's `QuickslotButton.press()`: uses the assigned item through the ordinary path.
		if (action === 'quickslot0' || action === 'quickslot1' || action === 'quickslot2' || action === 'quickslot3') {
			this.useQuickslot(Number(action.slice(-1)));
			return true;
		}
		//The Duelist's T-key weapon ability (`MeleeWeapon.ability()` overrides).
		if (action === 'weaponAbility') {
			this.useWeaponAbility();
			return true;
		}
		return dispatchHeroAction(action, this.heroActions);
	},

	/**
	 * Whether `WndGame` may open right now. Java runs `GameScene.onBackPressed` at any time, but
	 * its back key never reaches the scene while a window is open, while a hero action or cell
	 * selector is mid-cancel, or during an interlevel descent (`InterlevelScene.onBackPressed` does
	 * nothing) - the port's own stand-ins for those (`ui/journalWindow.ts`, the aim, the inventory
	 * and talent-choice overlays, the transition curtain) are all covered here or above.
	 */
	/**
	 * Applies the persisted zoom offset to the live camera - Java's
	 * `Camera.main.zoom(gate(minZoom, defaultZoom + SPDSettings.zoom(), maxZoom))` at
	 * `GameScene.create()`, except this also runs on every settings change (see the
	 * `onZoomChanged` subscription at camera creation) rather than only at create time.
	 */
	applyZoom(this: DungeonScene): void {
		this.camera.zoom = zoomForOffset(zoomOffset());
	},

	menuCanOpen(this: DungeonScene): boolean {
		if (this.interlevel) return false;
		if (this.gameWindows.blocksWorld) return false;
		return !(this.subclassChoiceOpen || this.armorChoiceOpen || this.augmentChoiceOpen ||
			this.itemPickerOpen || this.inventoryOpen || this.journalOpen
			|| (this.infoPanel && !this.infoPanel.closed && this.infoPanel.visible));
	},

	/**
	 * `Hero.handle()`'s click-to-move: a click beyond one step away queues a destination and
	 * the real pathfinder walks it automatically, one step per turn, until it arrives or an
	 * interrupt condition fires (`Hero.interrupt()`/`resting` in Java) - previously a click on
	 * a distant tile only ever produced a single step toward it, with no travel at all.
	 */
	handleMapPointer(this: DungeonScene, screenX: number, screenY: number): void {
		if (this.gameOver || !this.awaitingInput || !this.map) return;
		//`Camera.toWorld` is the documented way to turn a click into a tile; the map is a direct
		//child of `camera.world` at its origin, so this is what `map.toLocal` computed by hand.
		const local = this.camera.toWorld(screenX, screenY);
		const target = { x: Math.floor(local.x / TILE), y: Math.floor(local.y / TILE) };
		if (!this.level.inside(target.x, target.y)) return;
		//An active aim consumes the click: the cursor moves there and a legal cell confirms it.
		if (this.aiming) {
			this.travelOverlay?.clear();
			this.aiming.controller.moveTo(target);
			this.refreshAimOverlay();
			this.confirmAiming();
			return;
		}
		const dx = Math.sign(target.x - this.hero.x);
		const dy = Math.sign(target.y - this.hero.y);
		if (Roguelike.chebyshevDistance(target, this.hero) <= 1) {
			this.travelOverlay?.clear();
			this.travelTarget = null;
			const action = Object.entries(MOVES).find(([, step]) => step.x === dx && step.y === dy)?.[0] ?? 'wait';
			this.onAction(action);
			return;
		}
		this.travelTarget = target;
		this.travelStartHp = this.hero.hp;
		this.travelOverlay?.clear();
		this.stepTravel();
	},

	/** Hover feedback while aiming: moves the cursor and redraws the preview, nothing else. The
	 * port has no hover behaviour outside an aim, matching its click-only UI. */
	handleMapHover(this: DungeonScene, screenX: number, screenY: number): void {
		if (!this.map) return;
		const local = this.camera.toWorld(screenX, screenY);
		const cell = { x: Math.floor(local.x / TILE), y: Math.floor(local.y / TILE) };
		if (!this.level.inside(cell.x, cell.y)) return;
		if (!this.aiming) {
			if (!this.awaitingInput || this.gameOver) {
				this.travelOverlay?.clear();
				return;
			}
			const blocked = new Set(this.creatures.filter((c) => c !== this.hero).map((c) => this.level.index(c.x, c.y)));
			this.eternalFireBlockedInto(blocked);
			const path = this.pathfinder.find({ x: this.hero.x, y: this.hero.y }, cell, { blocked });
			drawTravelPreview(this.travelOverlay, path, TILE);
			return;
		}
		this.aiming.controller.moveTo(cell);
		this.refreshAimOverlay();
	},

	/**
	 * Opens a player aim over the map, backed by MWG 0.7.7's renderer-free
	 * `Roguelike.TargetingController` (`move`/`moveTo`, range + line-of-sight legality with an
	 * optional `validate` hook, `preview()`, `confirm()`/`cancel()`). The controller only ever
	 * returns cells; the caller's `onConfirm` decides what a cell means and what it consumes.
	 * Click or Confirm resolves it; any other key or Cancel abandons it. Nothing is consumed
	 * until a legal cell is confirmed, so cancelling is always free.
	 */
	beginAiming(this: DungeonScene, options: {
		range: number;
		shape?: Roguelike.AreaShape;
		requireLineOfSight?: boolean;
		validate?: (cell: { x: number; y: number }) => boolean;
		/** where the cursor starts (Java's cell selector opens on the nearest target, not on the hero) */
		initial?: { x: number; y: number } | null;
		onConfirm: (target: { x: number; y: number }, cells: readonly { x: number; y: number }[]) => void;
	}): void {
		const controller = new Roguelike.TargetingController(this.level, {
			origin: { x: this.hero.x, y: this.hero.y },
			range: options.range,
			requireLineOfSight: options.requireLineOfSight ?? true,
			shape: options.shape ?? { kind: 'single' },
			...(options.validate ? { validate: options.validate } : {}),
		});
		if (options.initial) controller.moveTo(options.initial);
		this.aiming = { controller, onConfirm: options.onConfirm };
		if (this.map) this.map.cursor = 'crosshair';
		this.travelTarget = null;
		this.refreshAimOverlay();
	},

	/** Resolves the line picker for `WandOfDisintegration`; opening it is free, confirmation is
	 * the cast. The renderer-free beam accounting lives in `simulation/disintegration.ts`. */
	confirmDisintegrationWand(this: DungeonScene, target: Step, chargesPerCast: number): void {
		this.actionSpentTurn = true;
		confirmDisintegrationWand(this.disintegrationWandScene(), target, chargesPerCast);
	},

	/** Applies the selected disintegration beam. Unlike the other compact wand effects this is
	 * resolved from the whole ballistica path, so terrain and later victims affect its level. */
	useDisintegrationWand(this: DungeonScene, target: Step): void {
		useDisintegrationWand(this.disintegrationWandScene(), target);
	},

	disintegrationWandScene(this: DungeonScene): DisintegrationWandScene {
		return {
			level: this.level,
			hero: this.hero,
			weaponLevel: this.weaponLevel,
			wandCharges: this.wandCharges,
			creatures: this.creatures,
			creatureAt: this.creatureAt.bind(this),
			isFireFlammableTerrain: this.isFireFlammableTerrain.bind(this),
			burnFireTerrain: this.burnFireTerrain.bind(this),
			talentRank: this.talentRank.bind(this),
			grantHeroShield: this.grantHeroShield.bind(this),
			fadeMirrorOnDamage: this.fadeMirrorOnDamage.bind(this),
			showDamage: this.showDamage.bind(this),
			say: this.say.bind(this),
			kill: this.kill.bind(this),
			spendHeroTurn: this.spendHeroTurn.bind(this),
			getAttackTurnCostMod: this.getAttackTurnCostMod.bind(this),
			message: (victim, damage) => t('port.log.wandhits', { target: victim.name, damage }),
		};
	},

	/** Abandons an aim without consuming or resolving anything. */
	cancelAiming(this: DungeonScene): void {
		if (!this.aiming) return;
		this.aiming = null;
		this.aimOverlay?.clear();
		this.travelOverlay?.clear();
		if (this.map) this.map.cursor = 'pointer';
	},

	/** Resolves an aim: confirms the controller, and on a legal cell runs the caller's effect. */
	confirmAiming(this: DungeonScene): boolean {
		const aiming = this.aiming;
		if (!aiming) return false;
		const result = aiming.controller.confirm();
		if (!result) {
			this.say(t('port.log.notarget'), 'negative');
			return false;
		}
		this.aiming = null;
		this.aimOverlay?.clear();
		if (this.map) this.map.cursor = 'pointer';
		aiming.onConfirm({ ...result.target }, result.cells);
		return true;
	},

	/** Redraws the aim preview (`ui/aimOverlay.ts`); an ended aim leaves the layer empty. */
	refreshAimOverlay(this: DungeonScene): void {
		drawAimPreview(this.aimOverlay, this.aiming ? this.aiming.controller.preview() : [], TILE);
	},

	/**
	 * `Preparation`'s own action (`Preparation.doAction()` and its cell listener,
	 * `Preparation.java` 264-334): the prepared strike, which is what makes the Assassin's
	 * stealth state worth holding. Java opens a cell picker; on a visible hostile it either
	 * attacks normally when already adjacent, or steps to the cheapest free cell beside the
	 * target that is within `AttackLevel.blinkDistance()` of the hero and strikes from there.
	 * Opening the picker costs nothing - the attack spends the turn, like any other attack.
	 * Java's message strings are SPD's own keys, already translated in every locale.
	 * The whole aim family lives in `simulation/preparation.ts` - the file-size refactor's
	 * thirty-first extraction, behavior-identical. The scene only builds the context here.
	 */
	usePreparationBlink(this: DungeonScene): void {
		usePreparationBlink(this.preparationBlinkContext());
	},

	preparationBlinkContext(this: DungeonScene): PreparationBlinkContext {
		const scene = this;
		return {
			hero: scene.hero,
			subclass: () => scene.subclass(),
			talentRank: (id) => scene.talentRank(id),
			beginAiming: (opts) => scene.beginAiming(opts),
			creatureAt: (x, y) => scene.creatureAt(x, y) ?? undefined,
			fov: scene.fov,
			level: scene.level,
			distanceMap: (from) => scene.pathfinder.distanceMap(from),
			moveTo: (creature, to) => scene.moveTo(creature, to),
			refresh: () => scene.refresh(),
			set actionSpentTurn(spent: boolean) { scene.actionSpentTurn = spent; },
			attack: (attacker, defender) => scene.attack(attacker, defender),
			spendHeroTurn: (cost) => scene.spendHeroTurn(cost),
			getAttackTurnCostMod: () => scene.getAttackTurnCostMod(),
			shakeScreen: (magnitude, duration) => scene.shakeScreen(magnitude, duration),
			say: (key, params, level) => scene.say(t(key, params ?? undefined), level),
		};
	},

	/**
	 * `PixelScene.shake(magnitude, duration)`: Java's one screen-shake entry point, used by 43
	 * sites across the game. The Java body is a thin wrapper - `magnitude *= SPDSettings.screenShake()`
	 * then `Camera.main.shake(magnitude, duration)`. MWG now also exposes `shakeScreen`, which accepts
	 * screen pixels and performs the active-camera conversion; use it here because Java's magnitude
	 * is explicitly measured in screen pixels, not world units. Java's
	 * `SPDSettings.screenShake()` 0-4 multiplier (`PixelScene.shake`) applies here, so 0
	 * disables shake outright and the default 2 doubles it - the old fixed-gain behavior
	 * is exactly what 1 would give, not the default.
	 *
	 * Wired at every site whose Java feature this port has ported; the rest are listed in
	 * `PORT_COVERAGE.md` with the reason each cannot be reached yet (mostly hero abilities and two
	 * monsters that are not ported at all).
	 */
	shakeScreen(this: DungeonScene, magnitude: number, duration: number): void {
		const scaled = magnitude * screenShake();
		if (scaled > 0) this.camera.shakeScreen(scaled, duration);
	},

	/** `WandOfLightning.arc()` (`WandOfLightning.java`, tag `v3.3.8`): recursively
	 * flood through non-solid cells. A character standing in water expands its next
	 * arc to path distance 2; every other character expands it to distance 1. The
	 * Java implementation keeps one affected set for the whole recursion, so a
	 * character is never zapped twice. NPCs remain excluded because this port's
	 * shared area-damage paths do not expose shopkeeper harm. */
	lightningTargets(this: DungeonScene, target: Creature): Creature[] {
		const affected: Creature[] = [target];
		const queue: Creature[] = [target];
		while (queue.length > 0) {
			const from = queue.shift()!;
			const radius = this.level.get(from.x, from.y) === WATER ? 2 : 1;
			const distances = this.pathfinder.distanceMap({ x: from.x, y: from.y });
			for (const candidate of this.creatures) {
				if (candidate.isNPC || candidate.hp <= 0 || affected.includes(candidate)) continue;
				const steps = distances[this.level.index(candidate.x, candidate.y)] ?? -1;
				//Java's lightning arc does not zap the caster through a distance-2
				//water chain; adjacent self-conductivity is still allowed.
				if (candidate.isHero && steps > 1) continue;
				if (steps < 0 || steps > radius) continue;
				affected.push(candidate);
				queue.push(candidate);
			}
		}
		return affected;
	},

	/** `Shocking.arc()` (`items/weapon/enchantments/Shocking.java`): a recursive chain. From the
	 * starting character, every other character within `dist` *path* cells (Java's
	 * `PathFinder.buildDistanceMap(pos, not(solid), dist)`) joins the affected set, and each of
	 * those chains onward with a radius of 2 when standing in water and not flying, or 1 otherwise -
	 * which is how a shock can cascade through a flooded room. The attacker is skipped, and a
	 * character already in the set is never hit twice, so the recursion terminates. The defender is
	 * in the set but explicitly excluded from the damage, exactly as Java removes it before applying
	 * any. */
	shockingArc(this: DungeonScene, attacker: Creature, defender: Creature, damage: number, powerMulti: number): void {
		const affected: Creature[] = [];
		const queue: { from: Creature; dist: number }[] = [{ from: defender, dist: 2 }];
		while (queue.length > 0) {
			const { from, dist } = queue.shift()!;
			const distances = this.pathfinder.distanceMap({ x: from.x, y: from.y });
			for (const hit of this.creatures) {
				if (hit === attacker || hit.hp <= 0 || affected.includes(hit)) continue;
				const steps = distances[this.level.index(hit.x, hit.y)] ?? -1;
				if (steps < 0 || steps > dist) continue;
				affected.push(hit);
				const inWater = this.level.get(hit.x, hit.y) === WATER && !hit.flying;
				queue.push({ from: hit, dist: inWater ? 2 : 1 });
			}
		}
		const arcDamage = Math.round(damage * 0.5 * powerMulti);
		for (const hit of affected) {
			//`Shocking` is one of `AntiMagic.RESISTS`' listed source classes: `Char.damage()`
			//zeroes any hit whose source class is in that set for a MagicImmune target, so a
			//magicImmune character caught by the chain takes none of its damage (the defender
			//itself is already excluded above, for the unrelated reason that Java's own arc never
			//touches it).
			if (hit === defender || arcDamage <= 0 || hit.magicImmune) continue;
			//`Shocking.proc()` only zaps `ch.alignment != attacker.alignment` - the arc
			//catches the wielder's allies geometrically but Java spares them, so the
			//hero's own allies (hawk, clone, log, mirror, corrupted) are skipped here.
			//Neutrals (NPCs) are still zapped, exactly as Java's `!=` does to them.
			if ((hit.isHero || hit.isAlly) && (attacker.isHero || attacker.isAlly)) continue;
			//`Char.Property.ELECTRIC` (`Char.java`, tag `v3.3.8`): the arc's source class
			//is `Shocking`, so every holder takes the `Math.round` half of the chain hit.
			const dealt = electricDamageHalved(hit.kind, hit.elementalType, hit.yogFistType) ? Math.round(arcDamage / 2) : arcDamage;
			hit.hp -= dealt;
			this.showDamage(hit, dealt);
			if (hit.hp <= 0) this.kill(hit);
		}
	},

	/** `Explosive.proc()`'s detonation: real Java throws an `ExplosiveCurseBomb` - a bare
	 * `Bomb.ConjuredBomb`, so the plain `Bomb.explode()` body - at the *closest adjacent
	 * non-solid cell to the defender*, which it picks by walking `NEIGHBOURS8` and keeping the
	 * one with the smallest `trueDistance` to the attacker (with the two adjacent, that is the
	 * attacker's own cell), falling back to the defender's cell when every neighbour is solid
	 * (`Explosive.java` 70-85). The blast then deals `NormalIntRange(4 + scalingDepth,
	 * 12 + 3*scalingDepth)` minus armor to every char caught within a `PathFinder` distance-1
	 * flood through non-solid/flammable cells - the hero included, since a bomb does not
	 * discriminate, which is exactly why a cursed weapon hurts its own wielder. Approximated here
	 * the same way `useStoneOfBlast`/`detonateGroundBomb` already are: a Chebyshev circle of
	 * radius 1 (no wall-aware distance, no flammable-solid flood), Java's `!solid` folded into
	 * this port's `passable` flag, `this.depth` for `scalingDepth`, and `applyBlastDamage` for the
	 * per-target consequences. The previous form reused `applyTrapBlast`'s unrelated trap formula
	 * (`5+depth .. 10+2*depth`, off-center x0.67) at the defender's own cell and skipped the hero,
	 * so it was neither the same area nor the same damage as a real bomb. */
	curseExplosiveBlast(this: DungeonScene, attacker: Creature, defender: Creature): void {
		let at = { x: defender.x, y: defender.y };
		let best = Infinity;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const x = defender.x + dx, y = defender.y + dy;
			if (!this.level.inside(x, y) || !this.level.passable(x, y)) continue;
			const distance = (x - attacker.x) ** 2 + (y - attacker.y) ** 2;
			if (distance < best) {
				best = distance;
				at = { x, y };
			}
		}
		for (const c of [...this.creatures]) {
			if (c.isNPC || c.hp <= 0) continue;
			if (!this.level.passable(c.x, c.y) || Roguelike.chebyshevDistance(at, c) > 1) continue;
			this.applyBlastDamage(c, Math.max(0, Random.normalRange(4 + this.depth, 12 + 3 * this.depth)), false);
		}
	},

	/** Takes one step of a queued `travelTarget`, or cancels it once arrived/interrupted. */
	stepTravel(this: DungeonScene): void {
		const to = this.travelTarget;
		if (!to || this.gameOver || !this.awaitingInput) return;
		if (this.hero.x === to.x && this.hero.y === to.y) {
			this.travelTarget = null;
			this.travelOverlay?.clear();
			return;
		}
		//Interrupt conditions, matching Java's real "stop and let the player decide" cases:
		//taking damage, or any awake, hostile creature coming into sight. This port checks
		//visibility broadly (any such creature currently seen) rather than Java's narrower
		//"a *newly* seen enemy" - a stated simplification, safer than under-interrupting.
		if (this.hero.hp < this.travelStartHp) {
			this.travelTarget = null;
			this.travelOverlay?.clear();
			return;
		}
		if (this.creatures.some((c) => !c.isHero && !c.isNPC && c.hp > 0 && !c.sleeping && this.fov.isVisible(c.x, c.y))) {
			this.travelTarget = null;
			this.travelOverlay?.clear();
			return;
		}
		const blocked = new Set(this.creatures.filter((c) => c !== this.hero).map((c) => this.level.index(c.x, c.y)));
		this.eternalFireBlockedInto(blocked);
		const path = this.pathfinder.find({ x: this.hero.x, y: this.hero.y }, to, { blocked });
		const next = path[0];
		if (!next) {
			this.travelTarget = null;
			this.travelOverlay?.clear();
			return;
		}
		const dx = Math.sign(next.x - this.hero.x);
		const dy = Math.sign(next.y - this.hero.y);
		const action = Object.entries(MOVES).find(([, step]) => step.x === dx && step.y === dy)?.[0] ?? 'wait';
		this.onAction(action);
	},

	/**
	 * One hero turn passes: the TurnClock drives hunger (Hunger.STEP=10 per turn, HUNGRY 300,
	 * STARVING 450, continuous partial-damage accrual per `simulation/hunger.ts`), wand charges regenerate, and
	 * the hero's own buff timers tick down with their dot damage. turnCost (default 1) allows
	 * fractional turns for attack-speed modifiers (Weapon.Augment SPEED, Swiftness glyph,
	 * RingOfFuror/Haste).
	 */
	spendHeroTurn(this: DungeonScene, turnCost: number = 1): void {
		runHeroTurn({
			isAlive: () => this.hero.hp > 0,
			advanceClock: () => {
				this.clock.advance(turnCost * (MWL_TURN_CLOCK.tick ?? 1));
				//`DeathMark.DoubleMarkTracker` is a 0.01-duration latch (`Buff.affect(hero, ...,
				//0.01f)`): it expires at the next buff-act, so only a same-round chained mark -
				//never anything that advances the clock - can spend the discount. Banking it
				//across turns was a port invention; any real time passing drops it here.
				this.doubleMarkArmed = false;
				//`ConservedDamage.act()`: `preservedDamage -= max(preserved*0.025, 0.1)`,
				//detaching at zero - previously a flat `*0.75` floor, a guess with no Java
				//basis, and the store rule below used to add half of every hit instead of
				//kill-overkill only. Both corrected against `Kinetic.java`/`Char.java` this pass.
				if (this.kineticStored > 0) {
					this.kineticStored -= Math.max(this.kineticStored * 0.025, 0.1);
					if (this.kineticStored <= 0) this.kineticStored = 0;
				}
			},
			//`Hunger.act()` is an actor-clock tick, not a once-per-input hook. A search costs
			//two turns, so it must run the transition twice; fractional action costs still
			//run the one actor tick that the existing scene model assigns to that action.
			advanceHunger: (cost = 1) => { for (let tick = 0; tick < cost; tick++) this.hungerStep(); },
			tickRegeneration: () => this.tickNaturalRegeneration(turnCost),
			// Recharging's Java Charger contribution is an additional recharge tick while the
			// 30-second flavour buff is active; Charges.advance() is this port's tick primitive.
			recoverWandCharge: (cost = 1) => {
				//Each actor turn has its own Charger.recharge() rate: recompute it before every
				//tick because the missing-charge curve changes as a charge fills.
				for (let tick = 0; tick < cost; tick++) {
					const missing = this.wandCharges.max - this.wandCharges.current;
					//`MagicalHolster.HOLSTER_SCALE_FACTOR`: wands charge off `0.85` while the
					//holster is owned instead of the normal `0.875` (see `bags.ts`).
					const rechargeBase = this.ownsBag('magicalHolster') ? HOLSTER_RECHARGE_BASE : NORMAL_RECHARGE_BASE;
					const turnsToCharge = 10 + 40 * Math.pow(rechargeBase, Math.max(0, missing));
					//RingOfEnergy.wandChargeMultiplier(): 1.175^level, applied straight onto the base rate.
					//`LIGHT_READING`'s metamorphosed leg (`RingOfEnergy.java`, tag `v3.3.8`): a
					//non-Cleric who took the talent recharges wands 1+0.2*rank/3 faster.
					//`if (Regeneration.regenOn())` gates the base rate only; Recharging still adds.
					const baseRate = !this.regenOn() ? 0 : ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing())
						* lightReadingWandMult(this.heroClass, this.talentRank('light_reading')) / turnsToCharge;
					//Charger.recharge(): Recharging's CHARGE_BUFF_BONUS is a flat `+0.25 * remainder()`
					//added on top of the base rate, not a 1.25x multiplier on it.
					const wandRate = baseRate + (this.hero.buffs['recharging'] ? 0.25 : 0);
					this.wandCharges.advance(wandRate);
					//Spare carried wands recharge on their own clocks (`Wand.Charger` is per-wand
					//in real Java); the stackable absorb pile has no instance and no state.
					for (const entry of this.bag.items) {
						if (entry.id !== 'wand' || entry.instanceId === undefined) continue;
						const spare = entry as typeof entry & { wandCur?: number; wandPartial?: number; wandMax?: number };
						if (spare.wandCur === undefined || spare.wandMax === undefined) continue;
						const state = { cur: spare.wandCur, partial: spare.wandPartial ?? 0, max: spare.wandMax };
						rechargeSpareWand(state, wandRate);
						spare.wandCur = state.cur;
						spare.wandPartial = state.partial;
					}
				}
			},
			recoverTomeCharge: (cost = 1) => { this.tomeCharges.advance(cost); },
			//`ClassArmor.Charger.act()`: `100/500` charge per tick, times
			//`RingOfEnergy.armorChargeMultiplier` (this port's `ringEnergyMultiplier`). `finishHeroTurn`
			//runs each per-turn effect once and hands the clock the whole cost, so this scales by
			//`turnCost` itself - a three-turn action like Endure regenerates three ticks, the same
			//amount Java's Charger actor gains while the hero is busy for that long.
			recoverArmorCharge: () => {
				if (!this.regenOn()) return; //`ClassArmor.Charger.act()`'s `if (Regeneration.regenOn())`
				this.armorCharge = Math.min(ARMOR_CHARGE_MAX,
					this.armorCharge + turnCost * ARMOR_CHARGE_PER_TURN * ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier());
			},
			//`HolyTome.TomeRecharge.act()` (tag `v3.3.8`): the carried tome banks the
			//tick rate while below cap, uncursed, un-immunized and while `regenOn()` (the
			//boss-arena lock; Java's `Vault` gate has no floor here). Carried ticks at the equipped rate by
			//the carried-cloak convention above; at cap the partial zeroes outright
			//(Java's `else` branch). Scales by the spent turn cost like the armor tick.
			recoverHolyTomeCharge: () => {
				const tome = findHolyTome(this.bag);
				if (!tome || tome.cursed === true || this.hero.magicImmune === true || !this.regenOn()) return;
				const cap = tomeChargeCap(tome.level ?? 0);
				if ((tome.charge ?? 0) >= cap) { tome.partialCharge = 0; return; }
				const charged = directTomeCharge(tome.charge ?? 0, tome.partialCharge ?? 0, tome.level ?? 0,
					turnCost * tomeTickRate(cap, tome.charge ?? 0, tome.level ?? 0, ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing())));
				tome.charge = charged.charge;
				tome.partialCharge = charged.partialCharge;
			},
			//`Hero.act()`'s `endEnduring()` is deliberately *not* here: it belongs to the start of the
			//hero's next action, so the endure window survives the turn it is cast on. Only the
			//tracker's own twelve-turn countdown runs on the clock. See `settleEndure`.
			tickEndureTracker: () => this.tickEndureDuration(turnCost),
			tickDoubleJumpTracker: () => this.tickDoubleJump(turnCost),
			//`AscendedForm.AscendBuff.act()` decrements one actor turn and removes its
			//ShieldBuff plus every DivineIntervention shield on expiry.
			tickAscendedForm: () => {
				if (this.ascendedTurns <= 0) return;
				this.ascendedTurns = Math.max(0, this.ascendedTurns - turnCost);
				if (this.ascendedTurns === 0) {
					this.ascendedBarrier.clear();
					this.ascendedSpellCasts = 0;
					this.ascendedFlashCasts = 0;
					this.ascendedDivineCast = false;
					for (const creature of this.creatures) delete creature.divineShield;
				}
			},
			//Trinity's selected form is a temporary activation window. The Java form buffs
			//also remove themselves on expiry; this state is the port's explicit hand-off
			//until item-specific body/mind/spirit effects are implemented.
			tickTrinityForm: () => {
				if (this.trinityTurns <= 0) return;
				this.trinityTurns = Math.max(0, this.trinityTurns - turnCost);
				if (this.trinityTurns === 0) {
					this.trinityForm = null;
					this.trinityBodyAffix = null;
					this.trinityBodyGlyph = null;
					this.trinitySpiritEffect = null;
					this.trinityMindEffect = null;
				}
			},
			tickWeaponAbility: () => this.tickWeaponAbility(turnCost),
			//`naturesPowerTracker`'s own eight-turn flavour countdown, on the actor clock.
			tickNaturesPowerTracker: () => { if (this.naturesPowerTurns > 0) this.naturesPowerTurns = Math.max(0, this.naturesPowerTurns - turnCost); },
			//Preparation.act(): the invisibility counter lives in the hero-turn pipeline next to
			//the other per-turn buff state, and reads the turn cost this action actually spent.
			updatePreparation: () => this.trackPreparation(turnCost),
			spreadFire: (cost = 1) => {
				//`Fire.evolve()` is a level actor tick. Multi-turn actions age and spread
				//the Java fire field once for every turn they consume.
				for (let tick = 0; tick < cost; tick++) this.spreadFire();
			},
			applyBuffDamage: (cost = 1) => {
				//Buff actors are scheduled on the same actor clock as the hero. A multi-turn
				//action therefore gives every hero-owned actor-tick effect one pass per spent
				//tick, rather than one pass for the input event. Keep the existing effect order
				//inside the loop: Java's actor priorities are represented by this order here.
				for (let tick = 0; tick < cost; tick++) {
				if (this.hero.buffs.toxicImbue !== undefined) emitToxicImbueGas((x, y, volume) => this.toxicGas.seed(x, y, volume), (x, y) => this.level.passable(x, y), { x: this.hero.x, y: this.hero.y }, Roguelike.neighbourOffsets(8) as readonly (readonly [number, number])[]);
				//CloakOfShadows.cloakRecharge/cloakStealth.act(): recharge while inactive and
				//spend one charge every four active turns. The Java fractional actor-clock
				//remainder is retained here, while the port's bag item supplies persistence.
				const cloak = this.bag.find('cloak') as (typeof this.bag.items[number] & { charges?: number }) | undefined;
				if (cloak && !cloak.cursed) {
					const maxCharge = Math.min((cloak.level ?? 0) + 3, 10);
					const charge = Math.min(maxCharge, cloak.charges ?? maxCharge);
					if (this.cloakStealthTurnsToCost > 0 && this.hero.buffs['invisibility']) {
						this.cloakStealthTurnsToCost--;
						if (this.cloakStealthTurnsToCost <= 0) {
							if (charge <= 0) {
								delete this.hero.buffs['invisibility'];
								this.cloakStealthTurnsToCost = 0;
							} else {
								cloak.charges = charge - 1;
								this.cloakStealthTurnsToCost = mwlItemEffectValue('cloak', 'turnsToCost');
							}
						}
					} else if (this.cloakStealthTurnsToCost <= 0 && charge < maxCharge && this.regenOn()) {
						this.cloakChargeProgress += this.lightCloakChargeMultiplier() / Math.max(1, 45 - (maxCharge - charge));
						while (this.cloakChargeProgress >= 1 && cloak.charges !== maxCharge) {
							cloak.charges = Math.min(maxCharge, (cloak.charges ?? 0) + 1);
							this.cloakChargeProgress -= 1;
						}
					}
				}
				//Barrier.act(): partialLostShield += min(1, shielding/20), then absorbDamage(1)
				//and a hard reset to 0 (not a carried remainder, unlike Hunger's partialDamage)
				//once it reaches 1 - bigger shields decay faster, and this now actually runs;
				//previously heroBarrier.advance()/this decay was never called at all, so shields
				//held indefinitely once granted (documented "Not ported" gap, now closed).
				//The accrual base is the Barrier pool only: real BlockBuff.act() has no
				//proportional decay at all, so Blocking's own pool is exempt here.
				//Deliberate simplification carried over from the Barrier row: neither this nor
				//the cliff below is scaled by HoldFast.buffDecayFactor() (no HoldFast buff here).
				if (this.heroBarrier.total > 0) {
					this.barrierPartialLoss += Math.min(1, this.heroBarrier.total / 20);
					if (this.barrierPartialLoss >= 1) {
						this.heroBarrier.absorb(1);
						this.barrierPartialLoss = 0;
					}
				}
				//BrokenSeal.WarriorShield.act(): regenerates 1/30 per turn (while regen is on)
				//toward armTier + armLvl + pointsInTalent(IRON_WILL), never decaying on its own.
				//The gain is gated on `Regeneration.regenOn()` (the `LockedFloor` boss-arena lock).
				if (this.armorSealed && this.regenOn()) {
					const sealCap = this.armorTier + this.armorLevel + this.talentRank('iron_will');
					if (this.sealBarrier.total < sealCap) {
						this.sealPartialGain += 1 / 30;
						while (this.sealPartialGain >= 1 && this.sealBarrier.total < sealCap) {
							this.sealBarrier.add(1);
							this.sealPartialGain -= 1;
						}
					} else this.sealPartialGain = 0;
				}
			//`ArtifactRecharge.act()`: while the buff is up, every carried artifact is handed
			//`min(1, left)` and the timer drops by one. This is the only caller of
			//`Artifact.charge(Hero, amount)` in the game - see `items/artifactRecharge.ts`.
			if (this.artifactRechargeTurns > 0) {
				this.applyArtifactRecharge(Math.min(1, this.artifactRechargeTurns));
				this.artifactRechargeTurns--;
			}
				//`CapeOfThorns.Thorns.act()`: the radiating cooldown ticks down once per actor turn
				//(a real scheduled Buff), independent of whether the hero was hit that turn - the
				//charge-then-trigger and deflection halves live in `applyCapeOfThornsProc`, called
				//from `attack()` where the incoming damage itself is known.
				{
					const cape = this.bag.find('cape') as (typeof this.bag.items[number] & { cooldown?: number }) | undefined;
					if (cape && (cape.cooldown ?? 0) > 0) {
						cape.cooldown = (cape.cooldown ?? 0) - 1;
						if (cape.cooldown === 0) this.say(t('items.artifacts.capeofthorns$thorns.inert'), 'info');
					}
				}
				//`UnstableSpellbook.bookRecharge.act()` (tag `v3.3.8`): `partialCharge += 1/(120 -
				//(chargeCap-charge)*5)` every actor turn while not cursed - the same shrinking-return
				//shape as Beacon's/Chains's own regen above (the closer to full, the slower the last
				//charge fills), gated on `Regeneration.regenOn()` like the other artifact ticks.
				{
					const book = this.spellbookItem();
					if (book && !book.cursed && !this.hero.magicImmune && this.regenOn()) {
						const level = book.level ?? 0;
						const chargeCap = spellbookChargeCap(level);
						let charge = Math.min(chargeCap, book.charge ?? chargeCap);
						if (charge < chargeCap) {
							let partial = (book.partialCharge ?? 0)
								+ this.lightCloakChargeMultiplier() / (mwlItemEffectValue('spellbook', 'rechargeBase') - (chargeCap - charge) * mwlItemEffectValue('spellbook', 'rechargeCapWeight'));
							while (partial >= 1 && charge < chargeCap) {
								partial -= 1;
								charge += 1;
								if (charge === chargeCap) partial = 0;
							}
							book.charge = charge;
							book.partialCharge = partial;
						}
					}
				}
				//`chainsRecharge`/`beaconRecharge`/`hourglassRecharge.act()` - see
				//`items/artifactPassiveRecharge.ts` for the three formulas and gates.
				{
					const gates = {
						magicImmune: this.hero.magicImmune === true, regenOn: this.regenOn(),
						artifactChargeMultiplier: ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(),
					};
					const chains = this.bag.find('chains') as (typeof this.bag.items[number] & ChainsItem) | undefined;
					if (chains) {
						const next = chainsPassiveRecharge(chains.level ?? 0, { charge: chains.charge ?? 0, partialCharge: chains.partialCharge ?? 0 }, { ...gates, cursed: chains.cursed === true });
						chains.charge = next.charge; chains.partialCharge = next.partialCharge;
						//The cursed branch: `Random.Int(100) == 0` prolongs a 10-turn Cripple.
						if (chains.cursed && Random.int(0, 100) === 0) addBuff(this.hero, 'cripple', mwlItemEffectValue('chains', 'cursedCrippleDuration'));
					}
					const beacon = this.beaconArtifactItem();
					if (beacon) {
						const next = beaconPassiveRecharge(beaconChargeCap(beacon), { charge: beacon.charge ?? 0, partialCharge: beacon.partialCharge ?? 0 }, { ...gates, cursed: beacon.cursed === true });
						beacon.charge = next.charge; beacon.partialCharge = next.partialCharge;
					}
					//`charges` undefined reads as full (see `useHourglass`). Java's cursed branch
					//(`Random.Int(10) == 0` makes the hero lose a turn) is not reproduced: this port's
					//turn loop has no seam for an artifact to spend the hero's time - stated.
					const hourglass = this.bag.find('hourglass') as (typeof this.bag.items[number] & { charges?: number; partialCharge?: number }) | undefined;
					if (hourglass) {
						const cap = mwlItemEffectValue('hourglass', 'maxChargeBase')
							+ Math.min(mwlItemEffectValue('hourglass', 'maxChargeLevelCap'), hourglass.level ?? 0) * mwlItemEffectValue('hourglass', 'maxChargePerLevel');
						const next = hourglassPassiveRecharge(cap, { charge: Math.min(cap, hourglass.charges ?? cap), partialCharge: hourglass.partialCharge ?? 0 }, { ...gates, cursed: hourglass.cursed === true });
						hourglass.charges = next.charge; hourglass.partialCharge = next.partialCharge;
					}
				}
				//`TalismanOfForesight.Foresight.act()` (tag `v3.3.8`): the per-turn charge trickle
				//(`0.05 + 0.005*level`, scaled by the energy-ring multiplier and capped at 100 - "fully
				//charges in 2000 turns at +0, scaling to 1000 turns at +10"), then `checkAwareness()`.
				//Java gates the trickle on `Regeneration.regenOn()` (suppressed by a `LockedFloor` boss
				//lock - see `simulation/regeneration.ts`).
				//
				//The two awareness marks tick down on the same actor turn, which is where Java's
				//`CharAwareness`/`HeapAwareness` buffs spend themselves.
				{
					const talisman = this.talismanItem();
					if (talisman) {
						applyTalismanPerTurnCharge(talisman, ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(), this.hero.magicImmune === true, this.regenOn());
						this.checkTalismanAwareness();
					}
					for (const [creature, turns] of this.awareCreatures) {
						if (turns <= 1) this.awareCreatures.delete(creature);
						else this.awareCreatures.set(creature, turns - 1);
					}
					for (const [cell, turns] of this.awareHeapCells) {
						if (turns <= 1) this.awareHeapCells.delete(cell);
						else this.awareHeapCells.set(cell, turns - 1);
					}
				}
				//`DriedRose.roseRecharge.act()` (tag `v3.3.8`): with a live ghost the rose heals it
				//(`ghost.HT/500` a turn, "heals to full over 500 turns") instead of charging; with
				//none it trickles `1/5` a turn toward a full 100, i.e. 500 turns. Both loops are
				//`while (partialCharge > 1)` - strictly greater - and both zero the partial on
				//finishing. Java's cursed branch (a 1% per-turn `Wraith` spawn) has no equivalent
				//here, since this port has no wraith mob kind; it is absent, not faked.
				{
					const rose = this.roseItem();
					if (rose) {
						if (!this.roseGhostAlive()) this.roseGhost = null;
						const ghost = this.roseGhost;
						const outcome = applyRoseRecharge(rose, {
							ghostAlive: ghost !== null,
							...(ghost ? { ghostHp: ghost.hp, ghostMaxHp: ghost.maxHp } : {}),
							ringMultiplier: ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(),
							magicImmune: this.hero.magicImmune === true,
							regenOn: this.regenOn(),
						});
						if (ghost && outcome.ghostHealed > 0) {
							ghost.hp = Math.min(ghost.maxHp, ghost.hp + outcome.ghostHealed);
							//Java flashes the healed sprite (`Char.sprite.showStatus(HEALING, ...)`);
							//this port's floater is `showHeal`, the same one the Chalice's own per-turn
							//heal uses - the recovered line set a `healFlash` field that exists on no
							//type here, so it is the floater that carries the feedback.
							this.showHeal(ghost, outcome.ghostHealed);
						}
						if (outcome.charged) this.say(t('items.artifacts.driedrose.charged'), 'positive');
						//`DriedRose`'s cursed branch (tag `v3.3.8`): a cursed rose never charges -
						//`applyRoseRecharge` already returns early on `cursed` - and instead rolls
						//1/100 per turn for a wraith in a free neighbouring cell (the CURSED sound
						//has no audio layer here). `Random.int(100)` is Java's `Random.Int(100)`.
					}
				}
			//`CorpseDust.DustGhostSpawner.act()` (tag `v3.3.8`): while the dust is carried, bank
			//one spawn power per hero turn toward `min(49, wraiths*wraiths)` (`wraiths` counts the
			//wraith being summoned: 1 + live DustWraiths), then spend it on a DustWraith in hero
			//FOV, on a free cell farther than `round(viewDistance/3)` (Chebyshev - Java's
			//`Level.distance` is `max(|dx|,|dy|)`). Losing the dust zeroes the bank (the buff
			//re-checks the bag every tick). The quest-score penalties and the music fade have no
			//systems here; the CURSED sound has no audio layer.
			if (this.bag.find('corpseDust')) {
				const dustWraiths = this.creatures.filter((c) => c.kind === 'dustWraith' && c.hp > 0).length;
				const step = dustSpawnerStep(this.dustSpawnPower, dustWraiths);
				this.dustSpawnPower = step.power;
				if (step.spawn) {
					const minDist = Math.round(this.viewRadius() / 3);
					const candidates: { x: number; y: number }[] = [];
					for (let cy = 0; cy < this.level.height; cy++) {
						for (let cx = 0; cx < this.level.width; cx++) {
							if (!this.fov.isVisible(cx, cy) || !this.level.passable(cx, cy) || this.creatureAt(cx, cy)) continue;
							if (Roguelike.chebyshevDistance({ x: cx, y: cy }, this.hero) <= minDist) continue;
							candidates.push({ x: cx, y: cy });
						}
					}
					const at = Random.element(candidates);
					if (at) this.spawnWraithAt('dustWraith', at.x, at.y);
					else this.dustSpawnPower = dustSpawnerCap(this.dustSpawnPower + step.cost, dustWraiths);
				}
			} else if (this.dustSpawnPower !== 0) this.dustSpawnPower = 0;
			//`HeavyBoomerang.CircleBack.act()` (tag `v3.3.8`): the return flight's own countdown,
			//which only advances while the hero is still on the depth it was thrown from.
			this.tickBoomerangReturn();
			//Viscosity.DeferedDamage.act(): a fresh deferred pool waits one actor turn,
				//then deals max(1, floor(pool*0.1)) and spends that amount each turn. The
				//scheduled damage uses the normal shield/HP path but must not be deferred
				//again by the same glyph.
				if (this.hero.deferredDamage && this.hero.deferredDamage > 0) {
					if (this.hero.deferredDamageDelay) this.hero.deferredDamageDelay = false;
					else {
						const tick = Math.max(1, Math.floor(this.hero.deferredDamage * 0.1));
						this.applyingDeferredDamage = true;
						const blocked = this.absorbHeroDamage(tick);
						this.applyingDeferredDamage = false;
						this.hero.hp -= blocked;
						this.hero.deferredDamage = Math.max(0, this.hero.deferredDamage - tick);
						this.showDamage(this.hero, blocked);
						if (this.hero.hp <= 0) { this.kill(this.hero, 'poison'); return true; }
						if (this.hero.deferredDamage <= 0) this.hero.deferredDamageDelay = false;
					}
				}
				//BlockBuff.act(): `left -= 1; left<=0 -> detach()` - a hard cliff-edge expiry of
				//Blocking's own pool, independent of the proportional curve above. Every fresh
				//proc resets the timer via grantBlockingShield; damage absorption eats into the
				//pool directly, so nothing needs clamping here anymore.
				if (this.blockingTurnsLeft > 0) {
					this.blockingTurnsLeft--;
					if (this.blockingTurnsLeft <= 0) this.blockingBarrier.clear();
				}
 				//`Sungrass.Health.act()` for the hero: the same shared tick the mob half runs
 				//(`simulation/plantPools.ts`'s `tickSungrassHealth`) - additive-HT pool, strict
 				//`> 1` payout gate, the pool draining by the whole tick even at full HP, and no
 				//parting tick on leaving the cell. The gate is the buff's existence (an anchored
 				//grant cell), not a positive pool: a pool banked at full HP has nothing owed yet
 				//but is still live for later damage on the same cell.
 				if (this.sungrassPos >= 0) {
 					const heroCell = this.level.index(this.hero.x, this.hero.y);
 					const ticked = tickSungrassHealth(
 						{ level: this.sungrassHealing, partial: this.sungrassPartial },
 						this.hero.maxHp, this.hero.maxHp - this.hero.hp, heroCell !== this.sungrassPos);
 					if (ticked.pool === null) {
 						this.sungrassHealing = 0;
 						this.sungrassPartial = 0;
 						this.sungrassPos = -1;
 					} else {
 						this.sungrassHealing = ticked.pool.level;
 						this.sungrassPartial = ticked.pool.partial;
 						if (ticked.healed > 0) {
 							const before = this.hero.hp;
 							this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + ticked.healed);
 							if (this.hero.hp > before) this.showHeal(this.hero, this.hero.hp - before);
 						}
 					}
 				}
				//Healing.act()/healingThisTick(): PotionOfHealing is a heal-over-time, not an
				//instant full heal - 25% of whatever's left per turn (floored at 1, capped at
				//what's left), fully replacing the port's former "quaff = instantly full HP"
				//stand-in. `setHeal`'s real semantics: a fresh potion only replaces `healingLeft`
				//if its amount is bigger, it never stacks additively on top of the first - and
				//each rate property combines by maximum, so a Warden sungrass (`setHeal(HT,0,1)`)
				//keeps its flat 1/turn through a later potion's 25% and vice versa.
				if (this.healingLeft > 0) {
					const tick = Math.min(this.healingLeft, Math.max(1, Math.round(this.healingLeft * this.healingPercent) + this.healingFlat));
					if (this.hero.hp < this.hero.maxHp) {
						const before = this.hero.hp;
						this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + tick);
						if (this.hero.hp > before) this.showHeal(this.hero, this.hero.hp - before);
					}
					this.healingLeft -= tick;
				}
				if (this.hero.buffs['invisibility'] && this.talentRank('protective_shadows') > 0) {
					this.stealthTalentTicks++;
					const cadence = this.talentRank('protective_shadows') === 1 ? 2 : 1;
					if (this.stealthTalentTicks >= cadence) {
						this.stealthTalentTicks = 0;
						this.grantHeroShield(1, this.talentRank('protective_shadows') === 1 ? 3 : 5);
					}
				} else this.stealthTalentTicks = 0;
				//`Barkskin.act()` spends its interval and detaches at level zero. The Java buff
				//runs on actor-time, while this port's hero pipeline advances in whole turns, so
				//one hero turn is the documented approximation of one scheduler tick here.
				if (this.hero.barkskinLevel !== undefined) {
					const interval = this.hero.barkskinInterval ?? 1;
					const cooldown = (this.hero.barkskinCooldown ?? interval) - 1;
					if (cooldown <= 0) {
						this.hero.barkskinLevel--;
						if (this.hero.barkskinLevel <= 0) {
							delete this.hero.barkskinLevel;
							delete this.hero.barkskinInterval;
							delete this.hero.barkskinCooldown;
						} else this.hero.barkskinCooldown = interval;
					} else this.hero.barkskinCooldown = cooldown;
				}
				const burning = this.hero.buffs['burning'] !== undefined;
				const hadHolyWard = this.hero.buffs['holyWard'] !== undefined;
				const hadAdrenaline = this.hero.buffs['adrenalineSurge'] !== undefined;
				//RingOfElements.resist(): Burning/Poison are both in `RESISTS`, so the DoT
				//they deal through `Char.damage()` is scaled by `0.825^level` in real Java.
				const wasDrowsy = this.hero.buffs['drowsy'] !== undefined;
				const wasMagicalSleep = this.hero.buffs['magicalSleep'] !== undefined;
				const tickedDamage = tickBuffs(this.hero, this.depth);
				//`tickBuffs` (the `simulation/buffs.ts` adapter) knows nothing of `bleedSource` -
				//once the bleed itself has fully decayed, drop the stale tag so a much later,
				//unrelated poison/burning death can't misread it as a chasm-fall death.
				if (this.hero.buffs['bleeding'] === undefined) this.hero.bleedSource = undefined;
				if (hadHolyWard !== (this.hero.buffs['holyWard'] !== undefined)) this.syncHeroFromStats();
				const dot = Math.floor(tickedDamage * ringElementsMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()));
				//`Challenge.DuelParticipant.act()`'s pairing half for the hero side (mob
				//side runs from `takeMonsterTurn`, right after its own tick, for the same
				//reason: Java buffs act independently of the char's action gates).
				this.tickDuelParticipant(this.hero);
				//`PrismaticGuard.act()`'s regen-plus-hatch turn, folded into the hero-turn
				//pipeline like every other hero buff (it spends TICKs, not hero actions),
				//scaled by the spent cost the way the armor charger above is.
				this.tickPrismaticGuard(turnCost);
				if (wasDrowsy && this.hero.buffs['drowsy'] === undefined && this.hero.hp < this.hero.maxHp) {
					//Drowsy.act() attaches MagicalSleep; a full-health reader takes Java's
					//"too healthy" path and is not put to sleep.
					if (!this.hero.magicImmune) {
						this.hero.buffs['magicalSleep'] = 1;
						if (!buffBlocked(this.hero, 'paralysis')) this.hero.buffs['paralysis'] = Math.max(this.hero.buffs['paralysis'] ?? 0, BUFF_DURATION.paralysis);
					}
				}
				if (hadAdrenaline !== (this.hero.buffs['adrenalineSurge'] !== undefined)) this.syncHeroFromStats();
				if (dot > 0) {
					const blockedDot = this.absorbHeroDamage(dot);
					this.hero.hp -= blockedDot;
					this.showDamage(this.hero, dot);
					this.say(t('port.log.affliction', { damage: dot }), 'negative');
					if (this.hero.hp <= 0) {
						//Bleeding.act(): a fatal bleed sourced from the chasm fall books Java's own
						//`Badges.validateDeathFromFalling()` rather than the generic DoT bucket this
						//merged tick otherwise defaults every non-burning death to.
						const bleedingFatal = !burning && this.hero.buffs['bleeding'] !== undefined && this.hero.bleedSource === 'chasm';
						this.kill(this.hero, burning ? 'fire' : bleedingFatal ? 'falling' : 'poison');
						return true;
					}
				}
				if (!this.tickCorrosion(this.hero)) return true;
				// Burning.act() does not advance its inventory counter while TimekeepersHourglass
				// stasis is active. A fatal DoT returns above before this consequence, matching the
				// port's fatal-damage turn boundary; Java's later cleanup is not observable here.
				if (burning && !this.hourglassFreeze) {
					this.burningIncrement++;
					if (Random.int(0, 2) < this.burningIncrement - 3) {
						this.burningIncrement = 0;
						this.burnHeroInventoryItem();
					}
				} else if (!burning) this.burningIncrement = 0;
				//MagicalSleep.act(): a sleeping ally restores exactly 1 HP per actor turn,
				//then wakes and removes its paralysis as soon as it reaches full health. A
				//fresh Drowsy transition waits until the next turn before healing, matching
				//Drowsy.act() attaching MagicalSleep after its own actor tick.
				if (wasMagicalSleep && this.hero.buffs['magicalSleep'] !== undefined && this.hero.hp > 0) {
					this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 1);
					if (this.hero.hp >= this.hero.maxHp) {
						delete this.hero.buffs['magicalSleep'];
						delete this.hero.buffs['paralysis'];
					} else if (!buffBlocked(this.hero, 'paralysis')) this.hero.buffs['paralysis'] = BUFF_DURATION.paralysis;
				}
				//Ooze.act(): depth-scaled direct damage (`1+depth/5` past depth 5, 1 at
				//depth 5, a coin-flip 1 in the Sewers), in RESISTS like Burning/Poison, with
				//the real `ondeath` line on a kill (no dedicated badge exists to award).
				if (this.hero.buffs['ooze'] !== undefined) {
					const rawOoze = this.depth > 5 ? 1 + Math.floor(this.depth / 5)
						: this.depth === 5 ? 1 : Random.chance(0.5) ? 1 : 0;
					const oozeDot = Math.floor(rawOoze * ringElementsMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()));
					if (oozeDot > 0) {
						const blockedOoze = this.absorbHeroDamage(oozeDot);
						this.hero.hp -= blockedOoze;
						this.showDamage(this.hero, oozeDot);
						this.say(t('port.log.affliction', { damage: oozeDot }), 'negative');
						if (this.hero.hp <= 0) {
							this.say(t('actors.buffs.ooze.ondeath'), 'negative');
							this.kill(this.hero, 'poison');
							return true;
						}
					}
				}
				//Level.java's per-turn WATER hook: a non-flying char standing in water forces
				//Burning to act (the DoT above already covers this turn's damage) then extinguish
				//on the following check, matching `Burning.act()`'s own `acted && water && !flying
				//-> detach()` cliff - collapsed here to an immediate extinguish once this turn's
				//tick has already landed, rather than reproducing the exact one-turn-late timing.
			//`Char.flying` is Levitation in this port (see `fallThroughChasm`'s own comment).
			//Ooze washes the same way (`Ooze.act()` detaches in water right after its own
			//tick) - real Poison, which shares nothing but the old stand-in, correctly stays.
			if (burning && this.level.get(this.hero.x, this.hero.y) === WATER && !this.hero.buffs['levitation']) delete this.hero.buffs['burning'];
			if (this.hero.buffs['ooze'] !== undefined && this.level.get(this.hero.x, this.hero.y) === WATER && !this.hero.buffs['levitation']) delete this.hero.buffs['ooze'];
			//Lit bomb fuses burn down here, after the hero's own DoT (a `Fuse` acts after the
			//hero in round order) - a hero-killing blast stops the sequence like fatal buff
			//damage does. See `tickBombFuses`.
			if (this.tickBombFuses()) return true;
			if (this.tickFallingRocks()) return true;
				if (this.tickCavesBossEnergy()) return true;
				}
				return false;
			},
			spendScheduledTurn: (cost = 1) => {
				if (this.timeBubbleTurns > 0) {
					//`Char.spendConstant(time)` hands the complete action time to
					//TimeBubble/timeFreeze. A search (2f) must consume two absorbed
					//time units, not merely one input event.
					this.timeBubbleTurns = Math.max(0, this.timeBubbleTurns - cost);
					const hourglass = this.hourglassFreeze
						? this.bag.find('hourglass') as (typeof this.bag.items[number] & { charges?: number }) | undefined
						: undefined;
					if (this.hourglassFreeze) {
						this.hourglassTurnsToCost -= cost;
						while (this.hourglassTurnsToCost < -0.001) {
							this.hourglassTurnsToCost += mwlItemEffectValue('hourglass', 'turnsToCost');
							if (hourglass && (hourglass.charges ?? 0) > 0) hourglass.charges!--;
						}
					}
					if (this.timeBubbleTurns === 0) this.flushTimeBubblePresses();
					if (this.timeBubbleTurns === 0 || (this.hourglassFreeze && this.hourglassTurnsToCost <= 0
						&& (hourglass?.charges ?? 0) <= 0)) this.hourglassFreeze = false;
				} else this.scheduler.spend(cost);
			},
			runAutomaticTurns: () => { if (this.timeBubbleTurns <= 0) this.runTurns(); },
		}, turnCost);
		if (this.healingEvasionTurns > 0) { this.healingEvasionTurns = Math.max(0, this.healingEvasionTurns - turnCost); this.syncHeroFromStats(); }
		//Talent tracker countdowns, one per hero turn like every other FlavourBuff-duration
		//state on this clock (`naturesPowerTurns` scales by turn cost inside the runtime; these
		//are flat Java turn counts - 3/6/9, 20, 5/10/15 - so they tick by exactly one here,
		//after the runtime call, next to `healingEvasionTurns`).
		if (this.enhancedRingsTurns > 0) { this.enhancedRingsTurns = Math.max(0, this.enhancedRingsTurns - turnCost); this.syncHeroFromStats(); }
		if (this.seerShotCooldown > 0) this.seerShotCooldown = Math.max(0, this.seerShotCooldown - turnCost);
		if (this.seerCells.size > 0) {
			for (const [cell, turns] of this.seerCells) {
				if (turns <= turnCost) this.seerCells.delete(cell);
				else this.seerCells.set(cell, turns - turnCost);
			}
		}
	},

	/** Hunger.act(): +10 per turn, warnings/1-damage on crossing STARVING, then continuous partialDamage accrual */
	hungerStep(this: DungeonScene): void {
		const wellFed = this.hero.buffs['wellFed'];
		if (wellFed !== undefined) {
			const next = advanceWellFed(wellFed, this.hero.hp, this.hero.maxHp);
			if (next.remaining === null) delete this.hero.buffs['wellFed'];
			else this.hero.buffs['wellFed'] = next.remaining;
			if (next.heal > 0) {
				this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + next.heal);
				this.showHeal(this.hero, next.heal);
			}
			return;
		}
		//`Hunger.act()` spends its tick doing nothing while `Dungeon.level.locked` (the boss-arena
		//seal - the LockedFloor buff text's "you will not gain hunger or take damage from starving").
		if (this.floorLocked()) return;
		//Java's Hunger uses `hungerDelay = 1.5` while the CloakOfShadows stealth buff is
		//active; this is the scene-only gate because the pure transition has no cloak state.
		const hungerDelay = this.cloakStealthTurnsToCost > 0 && this.hero.buffs['invisibility'] ? 1.5 : 1;
		this.simulation.hungerStep(MWL_TURN_CLOCK.hunger ?? 1, hungerDelay);
		const reduction = ironStomachReduction(this.heroClass, this.talentRank('iron_stomach'));
		if (reduction > 0) this.hunger = Math.max(0, this.hunger - reduction);
	},

	/** `Dungeon.level.locked`: set by each boss floor's `seal()`, cleared by its `unseal()`. The
	 * port keeps one run-scoped seal flag per boss floor; Tengu's floor has no unseal mark of its
	 * own (`PrisonBossLevel`'s `WON` state is Tengu's death), so a live Tengu stands in there. */
	floorLocked(this: DungeonScene): boolean {
		if (this.bossUnsealedDepths.has(this.depth)) return false;
		switch (this.depth) {
			case 5: return this.sewerBossSealed;
			case 10: return this.tenguFightStarted && this.creatures.some((c) => c.kind === 'tengu' && c.hp > 0);
			case 15: return this.cavesBossSealed;
			case 20: return this.cityBossSealed;
			case 25: return this.hallsBossSealed;
			default: return false;
		}
	},

	/** `Regeneration.regenOn()` - see `simulation/regeneration.ts`. */
	regenOn(this: DungeonScene): boolean {
		return regenOn(this.regeneration.lockLeft);
	},

	/** A boss's `damage()` override buying lock time back (`LockedFloor.addTime`), called right
	 * after a seam writes HP and before any boss clamp: `dealt` is the amount written, `hpLost` the
	 * raw HP delta. That is Java's measuring point for DM300 (`dmgTaken` before its supercharge
	 * clamp) and YogFist; Tengu and Yog measure *after* their own clamps, so they credit from
	 * `clampTenguBracket`/`yogDamageHook` instead and are skipped here. */
	lockedFloorBossDamage(this: DungeonScene, creature: Creature, dealt: number, hpLost: number): void {
		if (creature.kind === 'tengu' || creature.kind === 'yog') return;
		this.creditLockedFloor(creature.kind, dealt, hpLost);
	},

	creditLockedFloor(this: DungeonScene, kind: string | undefined, dealt: number, hpLost: number): void {
		if (this.regeneration.lockLeft === null) return;
		const time = lockedFloorBossTime(kind, dealt, hpLost, isChallengeEnabled('stronger_bosses'));
		if (time > 0) this.regeneration.lockLeft = addLockedFloorTime(this.regeneration.lockLeft, time);
	},

	/** `Goo.act()`'s water heal: `lock.removeTime(healInc * 1.5)`, or `healInc` under Stronger Bosses. */
	lockedFloorGooHeal(this: DungeonScene, healInc: number): void {
		this.regeneration.lockLeft = removeLockedFloorTime(this.regeneration.lockLeft,
			isChallengeEnabled('stronger_bosses') ? healInc : healInc * 1.5);
	},

	/**
	 * `Regeneration.act()` then `LockedFloor.act()`, once per spent turn. Regeneration acts at
	 * `HERO_PRIO - 1` (before every other buff), so it reads the lock before this turn's decrement.
	 * The heal scales by the action's turn cost (Java's actor acts once per 1.0 of time); the lock
	 * decrements once per whole tick, like `advanceHunger`.
	 *
	 * The carried Chalice of Blood stands in for Java's equipped one (artifacts are carried, not
	 * slotted, in this port - the convention every artifact here follows). `SpiritForm`'s chalice
	 * branch reads `trinitySpiritEffect === 'chalice'` (see `trinitySpiritChalice`).
	 * Java's `hero.resting = false` at full HP has no counterpart: this port has no rest-until-healed.
	 */
	tickNaturalRegeneration(this: DungeonScene, turnCost: number): void {
		const chalice = this.bag.find('chalice') as (typeof this.bag.items[number] & { level?: number }) | undefined;
		const delay = regenerationDelay({
			//Java's `else if` order: a carried (equipped) chalice wins; else SpiritForm's chalice at `artifactLevel()`.
			chaliceLevel: chalice ? (chalice.level ?? 0)
				: this.trinityForm === 'spirit' && this.trinityTurns > 0 && this.trinitySpiritEffect === 'chalice' ? this.trinityArtifactLevel() : -1,
			chaliceCursed: chalice?.cursed === true,
			magicImmune: this.hero.magicImmune === true,
			artifactChargeMultiplier: ringEnergyMultiplier(this.effectiveRing(), this.hero.magicImmune, this.trinitySpiritRing()) * this.lightCloakChargeMultiplier(),
		});
		const next = tickRegeneration(this.hero.hp, this.hero.maxHp, this.regeneration.partial, {
			regenOn: this.regenOn(), starving: this.hunger >= STARVING, delay, ticks: turnCost,
		});
		this.hero.hp = next.hp;
		this.regeneration.partial = next.partial;
		//`LockedFloor` acts once per 1.0 of actor time, not per action: carry the fraction so a
		//hasted half-cost action does not burn a whole lock turn.
		const locked = this.floorLocked();
		const stronger = isChallengeEnabled('stronger_bosses');
		this.regeneration.lockCarry = (this.regeneration.lockCarry ?? 0) + turnCost;
		if (this.regeneration.lockLeft === null && locked) this.regeneration.lockCarry = 0;
		if (!locked || this.regeneration.lockLeft === null) this.regeneration.lockLeft = tickLockedFloor(this.regeneration.lockLeft, locked, stronger);
		for (; this.regeneration.lockCarry >= 1; this.regeneration.lockCarry--) {
			this.regeneration.lockLeft = tickLockedFloor(this.regeneration.lockLeft, locked, stronger);
		}
	},
};
