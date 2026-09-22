import type { DungeonScene } from '../../dungeonScene';
import { Random, Roguelike } from 'mwg';
import { addBuff, BUFF_DURATION, NEGATIVE_BUFFS, type BuffId } from '../../../combat';
import { isUndeadOrDemonic } from '../../../monsters';
import { isChallengeEnabled } from '../../../challenges';
import { t } from '../../../i18n/index';
import { findHolyTome } from '../../../items/holyTome';
import { AURA_COST, DIVINE_INTERVENTION_COST, HALLOWED_GROUND_COST, HALLOWED_GROUND_HEAL, HALLOWED_GROUND_ROOTS_TURNS, HOLY_LANCE_COST, JUDGEMENT_COST, LAY_ON_HANDS_COST, LAY_ON_HANDS_SHIELD_CASTS, MNEMONIC_POSITIVE_BUFFS, PRAYER_COST, RADIANCE_COST, RADIANCE_LIGHT_DARKNESS_TURNS, RADIANCE_LIGHT_TURNS, RADIANCE_PARALYSIS_TURNS, SMITE_COST, WALL_OF_LIGHT_COST, WALL_OF_LIGHT_PARALYSIS_TURNS, WALL_OF_LIGHT_TURNS, flashCost, flashRange, hallowedGroundRadius, holyLanceDamage, judgementDamageBase, layOnHandsHeal, prayerExtension, radianceBonusDamage, smiteBonusDamage, tomeCastGate, tomeChargeCap, wallOfLightCost, wallOfLightWidth, divineInterventionShield, divineInterventionExtension } from '../../../simulation/clericSpells';

/**
 * The HolyTome's Priest/Paladin subclass tier (`ClericSpell.getSpellList()`
 * tiers 3, tag `v3.3.8`): Radiance, HolyLance, MnemonicPrayer, Smite,
 * LayOnHands, AuraOfProtection, HallowedGround, WallOfLight. Split out of
 * `inventoryQuickslot.ts` (group `clericSpellFlows`) once that file's other
 * cleric-spell methods pushed it over its line budget - see
 * `tools/file-budgets.json`.
 */
export const clericSpellFlowsMethods = {
	/**
	 * `DivineIntervention.onCast()` (`DivineIntervention.java`, tag `v3.3.8`): every
	 * ALLY-aligned character except the hero gets a raise-only `DivineShield` of
	 * `100+50*points`; then `onSpellCast()` spends the 5 charges and adds the shared
	 * Ascended `10*chargeUse` shield; only after that is the hero's AscendBuff raised
	 * to the same target (Java orders it so the two "do not stack"), the once-per-form
	 * flag set, and the form extended by `2+points`. All of it lands before the turn is
	 * spent, as Java's buff/charge writes complete before any other actor runs - a cast
	 * on the form's last turn therefore survives it. Sheep and Lotus are skipped: both are
	 * Java NEUTRAL NPCs that this port happens to carry as allies. The yellow `Flare`s
	 * and the `SHIELDED` sprite state are presentation this port does not draw.
	 */
	resolveDivineIntervention(this: DungeonScene, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const rank = this.talentRank('divine_intervention');
		if (rank <= 0 || this.ascendedTurns <= 0 || this.ascendedDivineCast
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(tome.level ?? 0), DIVINE_INTERVENTION_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		const shield = divineInterventionShield(rank);
		for (const ally of this.creatures) {
			if (ally.isHero || !ally.isAlly || ally.hp <= 0 || ally.allyKind === 'sheep' || ally.allyKind === 'lotus') continue;
			ally.divineShield = Math.max(ally.divineShield ?? 0, shield);
		}
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, DIVINE_INTERVENTION_COST, 'divineIntervention');
		if (this.ascendedBarrier.total < shield) this.ascendedBarrier.add(shield - this.ascendedBarrier.total);
		this.ascendedDivineCast = true;
		this.ascendedTurns += divineInterventionExtension(rank);
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
	},

	/**
	 * `Judgement.onCast()` (`Judgement.java`, tag `v3.3.8`): AscendedForm's
	 * area spell damages every visible hostile character for a normal roll in
	 * `[base, 2*base]`, where base is talent-scaled and increased by prior
	 * Ascended spell casts. The Java Priest branch also applies GuidingLight's
	 * `Illuminated` effect; this port deliberately leaves that add-on out until
	 * the shared illumination tracker is available, while preserving the damage,
	 * visibility, turn, charge, and cast-counter reset behavior.
	 */
	resolveJudgement(this: DungeonScene, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const rank = this.talentRank('judgement');
		const level = tome.level ?? 0;
		if (this.subclass() !== 'priest' && this.subclass() !== 'paladin') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		if (rank <= 0 || this.ascendedTurns <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), JUDGEMENT_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		//`GameScene.flash(0x80FFFFFF)` (`Judgement.onCast()`, tag `v3.3.8`): a screen-wide
		//white flash fired once per cast, ahead of the per-target damage loop below (Java
		//fires it before iterating `Actor.chars()` too). `dungeonScene.ts`'s `screenFlash`
		//is the generic primitive; duration is a stated approximation (see its own doc
		//comment), since Java's own `Fader` timing lives outside this checkout's history.
		this.screenFlash = { color: 0xffffff, timeLeft: 0.3, duration: 0.3 };
		const base = judgementDamageBase(rank, this.ascendedSpellCasts);
		for (const victim of this.creatures) {
			if (victim.isHero || victim.isAlly || victim.hp <= 0 || !this.fov.isVisible(victim.x, victim.y)) continue;
			const damage = Random.normalRange(base, base * 2);
			this.disqualifyBossChallenge(victim);
			victim.hp -= damage;
			this.showDamage(victim, damage);
			victim.sleeping = false;
			if (victim.hp <= 0) this.kill(victim);
		}
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, JUDGEMENT_COST, 'judgement');
		this.ascendedSpellCasts = 0;
	},

	/**
	 * `Flash.onTargetSelected()` (`Flash.java`, tag `v3.3.8`): teleport the
	 * hero to an empty passable cell within `2+points`, then spend the rising
	 * `2+flashCasts` charge cost and one turn. Java additionally rejects cells
	 * that are neither mapped nor visited; this port has no persistent map-memory
	 * array, so passability plus occupancy is the closest available gate and is
	 * recorded as a deliberate simplification in `PORT_COVERAGE.md`.
	 */
	resolveFlash(this: DungeonScene, cell: { x: number; y: number }, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		const rank = this.talentRank('flash');
		const cost = flashCost(this.ascendedFlashCasts);
		if (!tome || !this.ascendedTurns || rank <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(tome.level ?? 0), cost) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		const inRange = this.level.inside(cell.x, cell.y)
			&& Roguelike.chebyshevDistance(this.hero, cell) <= flashRange(rank);
		const target = inRange && this.level.passable(cell.x, cell.y)
			&& (!this.creatureAt(cell.x, cell.y) || (cell.x === this.hero.x && cell.y === this.hero.y));
		if (!target) {
			this.say(t('items.scrolls.scrollofteleportation.cant_reach'), 'warning');
			return;
		}
		const from = { x: this.hero.x, y: this.hero.y };
		this.teleportHeroTo(cell.x, cell.y);
		this.playTeleportAppear(from, cell, this.hero);
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, cost, 'flash');
		this.ascendedFlashCasts++;
	},

	/**
	 * `Radiance.onCast()` (`ClericSpell`, tag `v3.3.8`): Priest only, no
	 * targeting. Every visible non-ally takes the `Illuminated` mark (and its
	 * `WasIlluminatedTracker`); one already illuminated instead takes
	 * `lvl+5` bonus damage (the `GuidingLight` combo), then every visible
	 * non-ally survivor is stunned (`Paralysis` 3). The hero's own `Light`
	 * lasts the full 100 turns, or 20 under the DARKNESS challenge. Like
	 * Cleanse the cast spends the turn.
	 */
	resolveRadiance(this: DungeonScene, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const level = tome.level ?? 0;
		if (this.subclass() !== 'priest'
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), RADIANCE_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		for (const victim of this.creatures) {
			if (victim.isHero || victim.isAlly || victim.isNPC || victim.hp <= 0 || !this.fov.isVisible(victim.x, victim.y)) continue;
			if (victim.buffs['illuminated'] !== undefined) {
				const damage = radianceBonusDamage(this.progression.level);
				if (damage > 0) {
					this.disqualifyBossChallenge(victim);
					victim.hp -= damage;
					this.showDamage(victim, damage);
				}
			}
			addBuff(victim, 'illuminated');
			addBuff(victim, 'wasIlluminated');
			victim.sleeping = false;
			if (victim.hp > 0) addBuff(victim, 'paralysis', RADIANCE_PARALYSIS_TURNS);
			else this.kill(victim);
		}
		addBuff(this.hero, 'light', isChallengeEnabled('darkness') ? RADIANCE_LIGHT_DARKNESS_TURNS : RADIANCE_LIGHT_TURNS);
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, RADIANCE_COST, 'radiance');
	},

	/**
	 * `HolyLance.onTargetSelected()` (`TargetedClericSpell`, tag `v3.3.8`): the
	 * hero's own cell refuses with the wand `self_target` line, and an armed
	 * `LanceCooldown` refuses with the tome's `no_spell` line - both spend
	 * nothing. Otherwise the ray damage (`15+15*points` to `round(27.5+27.5*
	 * points)`, undead/demonic at the max) lands on the confirmed cell - no
	 * Ballistica, the same simplification every other aimed port spell makes
	 * (stated at `resolveSunray`) - then the 30-turn cooldown arms regardless
	 * of whether a target was hit.
	 */
	resolveHolyLance(this: DungeonScene, cell: { x: number; y: number }, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const rank = this.talentRank('holy_lance');
		const level = tome.level ?? 0;
		if (this.subclass() !== 'priest' || rank <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), HOLY_LANCE_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		if (cell.x === this.hero.x && cell.y === this.hero.y) {
			this.say(t('items.wands.wand.self_target'), 'negative');
			return;
		}
		if (this.hero.buffs['lanceCooldown'] !== undefined) {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		const victim = this.creatureAt(cell.x, cell.y);
		if (victim) {
			const [min, max] = holyLanceDamage(rank);
			const damage = isUndeadOrDemonic(victim.kind) ? max : Random.normalRange(min, max);
			if (damage > 0) this.disqualifyBossChallenge(victim);
			const parried = victim.kind === 'greatCrab' && !victim.sleeping && victim.seesHero
				&& victim.buffs['paralysis'] === undefined;
			if (parried) this.say(t('port.log.crabparries'), 'negative');
			else {
				victim.hp -= damage;
				this.showDamage(victim, damage);
			}
			victim.sleeping = false;
			if (victim.hp <= 0 && !victim.isAlly) this.kill(victim);
		}
		addBuff(this.hero, 'lanceCooldown', BUFF_DURATION['lanceCooldown']);
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, HOLY_LANCE_COST, 'holyLance');
	},

	/**
	 * `MnemonicPrayer.onCast()`/`affectChar()` (tag `v3.3.8`): Priest plus the
	 * prayer talent, the purse re-check, then a visible target (`no_target`
	 * line, spending nothing, otherwise). An ally (or the hero) has every
	 * present buff in `MNEMONIC_POSITIVE_BUFFS` extended by `2+points`
	 * (3/4/5) turns; an enemy instead gains `Illuminated` and has every
	 * present negative buff extended the same amount. Java's
	 * `b.mnemonicExtended` flag - one cast per *buff instance*, resetting only
	 * when that buff itself detaches - has a port model for the hero's own
	 * buffs only (`this.mnemonicExtended`, the one target the save format
	 * tracks); an ally or enemy target re-extends on every cast instead, a
	 * stated simplification. The cast is free (`hero.next()`, no `spend()`).
	 */
	resolvePrayer(this: DungeonScene, cell: { x: number; y: number }, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const rank = this.talentRank('mnemonic_prayer');
		const level = tome.level ?? 0;
		if (this.subclass() !== 'priest' || rank <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), PRAYER_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		const target = this.creatureAt(cell.x, cell.y);
		if (!target || !this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('port.log.clericnotarget'), 'warning');
			return;
		}
		const extend = prayerExtension(rank);
		if (target === this.hero || target.isAlly) {
			//Drop any stale mark whose buff has since detached, matching Java's
			//flag living on the buff instance rather than the target.
			if (target === this.hero) this.mnemonicExtended = this.mnemonicExtended.filter((id) => this.hero.buffs[id] !== undefined);
			for (const id of MNEMONIC_POSITIVE_BUFFS) {
				const buffId = id as BuffId;
				const remaining = target.buffs[buffId];
				if (remaining === undefined) continue;
				if (target === this.hero) {
					if (this.mnemonicExtended.includes(buffId)) continue;
					this.mnemonicExtended.push(buffId);
				}
				target.buffs[buffId] = remaining + extend;
			}
		} else {
			addBuff(target, 'illuminated');
			addBuff(target, 'wasIlluminated');
			for (const id of NEGATIVE_BUFFS) {
				const remaining = target.buffs[id];
				if (remaining !== undefined) target.buffs[id] = remaining + extend;
			}
		}
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, PRAYER_COST, 'mnemonicPrayer');
	},

	/**
	 * `Smite.onTargetSelected()` (`TargetedClericSpell`, tag `v3.3.8`): Paladin
	 * only, no talent gate (the subclass grants it outright). A missing,
	 * unseen, or the hero's own cell refuses with the base `no_target` line
	 * and spends nothing. Otherwise `bonusDmg()`'s `5+lvl/2` to `10+lvl` lands
	 * on the target - undead/demonic at the max - the same no-Ballistica,
	 * direct-spell-damage shape every other `ClericSpell` here uses (stated at
	 * `resolveSunray`). The real weapon swing and its `+300%` enchant power
	 * (`SMITE_ENCHANT_BONUS`) have no port model - this spell has no weapon-
	 * attack integration yet - so the bonus lands as the whole hit. Divergence,
	 * stated here and in `PORT_COVERAGE.md`.
	 */
	resolveSmite(this: DungeonScene, cell: { x: number; y: number }, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const level = tome.level ?? 0;
		if (this.subclass() !== 'paladin'
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), SMITE_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		const target = this.creatureAt(cell.x, cell.y);
		if (!target || target.isHero || target.isNPC || !this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('port.log.clericnotarget'), 'warning');
			return;
		}
		const [min, max] = smiteBonusDamage(this.progression.level);
		const damage = isUndeadOrDemonic(target.kind) ? max : Random.normalRange(min, max);
		if (damage > 0) this.disqualifyBossChallenge(target);
		const parried = target.kind === 'greatCrab' && !target.sleeping && target.seesHero
			&& target.buffs['paralysis'] === undefined;
		if (parried) this.say(t('port.log.crabparries'), 'negative');
		else {
			target.hp -= damage;
			this.showDamage(target, damage);
		}
		target.sleeping = false;
		if (target.hp <= 0 && !target.isAlly) this.kill(target);
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, SMITE_COST, 'smite');
	},

	/**
	 * `LayOnHands.onCast()` (tag `v3.3.8`): Paladin plus the lay talent, the
	 * purse re-check, then an adjacent target (`no_target` line otherwise,
	 * spending nothing). `affectChar()`'s `10+5*points` (15/20/25) heals the
	 * missing HP first; any leftover spills into shielding, capped at three
	 * casts' worth on one holder. The port has no per-mob Barrier pool (the
	 * Bless full-heal leftover is dropped the same way, stated at
	 * `resolveBless`), so only the hero's own overflow banks into
	 * `heroBarrier` - an ally target's leftover is dropped. The cast is free.
	 */
	resolveLayOnHands(this: DungeonScene, cell: { x: number; y: number }, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const rank = this.talentRank('lay_on_hands');
		const level = tome.level ?? 0;
		if (this.subclass() !== 'paladin' || rank <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), LAY_ON_HANDS_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		const target = this.creatureAt(cell.x, cell.y);
		if (!target || Roguelike.chebyshevDistance(this.hero, target) > 1 || !this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('port.log.clericnotarget'), 'warning');
			return;
		}
		const heal = layOnHandsHeal(rank);
		const missing = Math.max(0, target.maxHp - target.hp);
		const healed = Math.min(missing, heal);
		if (healed > 0) {
			target.hp += healed;
			this.showHeal(target, healed);
		}
		const overflow = heal - healed;
		if (overflow > 0 && target === this.hero) {
			const cap = LAY_ON_HANDS_SHIELD_CASTS * heal;
			const shield = Math.min(this.heroBarrier.total + overflow, cap);
			if (shield > this.heroBarrier.total) this.heroBarrier.add(shield - this.heroBarrier.total);
		}
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, LAY_ON_HANDS_COST, 'layOnHands');
	},

	/**
	 * `AuraOfProtection.onCast()` (tag `v3.3.8`): Paladin plus the aura talent,
	 * the purse re-check, then the 20-turn `AuraBuff` with no targeting. Like
	 * Cleanse the cast spends the turn. `Char.attack()`/`damage()`'s aura
	 * clause - `0.9-0.1*points` off incoming damage for same-alignment
	 * characters near the holder - is applied by the shared scene damage
	 * seams (`auraProtectedDamage`); the buff itself remains the 20-turn
	 * source of truth.
	 */
	resolveAura(this: DungeonScene, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const level = tome.level ?? 0;
		if (this.subclass() !== 'paladin' || this.talentRank('aura_of_protection') <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), AURA_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		addBuff(this.hero, 'auraProtection', BUFF_DURATION['auraProtection']);
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, AURA_COST, 'auraOfProtection');
	},

	/**
	 * `HallowedGround.onTargetSelected()` (`TargetedClericSpell`, tag
	 * `v3.3.8`): Priest plus the ground talent, the purse re-check, then a
	 * visible cell (`no_target` line otherwise, spending nothing). Java plants
	 * a standing `HallowedTerrain` patch (`1+2*points` a side) that ticks for
	 * `HALLOWED_GROUND_TURNS` turns - healing/shielding allies and evolving
	 * its grass each turn, rooting enemies only as they step onto it. This
	 * port has no terrain-panel system to place and tick that patch, so the
	 * cast instead lands as a one-shot burst over the same square the instant
	 * it is cast: allies heal (or shield, if already full) `15`, enemies
	 * caught in it are rooted for the opening `Roots 2`. The grass evolution
	 * and the ongoing per-turn tick are dropped. Divergence, stated here and
	 * in `PORT_COVERAGE.md`.
	 */
	resolveHallowedGround(this: DungeonScene, cell: { x: number; y: number }, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const rank = this.talentRank('hallowed_ground');
		const level = tome.level ?? 0;
		if (this.subclass() !== 'priest' || rank <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), HALLOWED_GROUND_COST) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		if (!this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('port.log.clericnotarget'), 'warning');
			return;
		}
		const radius = hallowedGroundRadius(rank);
		for (const target of this.creatures) {
			if (target.hp <= 0) continue;
			if (Math.max(Math.abs(target.x - cell.x), Math.abs(target.y - cell.y)) > radius) continue;
			if (target === this.hero || target.isAlly) {
				const missing = target.maxHp - target.hp;
				if (missing > 0) {
					const healed = Math.min(missing, HALLOWED_GROUND_HEAL);
					target.hp += healed;
					this.showHeal(target, healed);
				} else if (target === this.hero && HALLOWED_GROUND_HEAL > this.heroBarrier.total) {
					this.heroBarrier.add(HALLOWED_GROUND_HEAL - this.heroBarrier.total);
				}
			} else if (!target.isNPC) {
				addBuff(target, 'roots', HALLOWED_GROUND_ROOTS_TURNS);
			}
		}
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, HALLOWED_GROUND_COST, 'hallowedGround');
	},

	/**
	 * Whether a Wall of Light is currently up: `WallOfLight` places no standing
	 * terrain in this port (stated at `resolveWallOfLight`), so this reads the
	 * `lightWallActive` marker that stands in for it - the one thing the free
	 * early-end recast (`WallOfLight.chargeUse()`) needs to know.
	 */
	lightWallActive(this: DungeonScene): boolean {
		return this.hero.buffs['lightWallActive'] !== undefined;
	},

	/**
	 * `WallOfLight.onTargetSelected()` (`TargetedClericSpell`, tag `v3.3.8`):
	 * Paladin plus the wall talent, the purse re-check (free while a wall is
	 * already up - ending it is instant and costs nothing), then a visible
	 * cell. Java's `placeWall()` lays a standing cross-wall of blocking,
	 * `Paralysis`-on-contact terrain `1+2*points` wide for `WALL_OF_LIGHT_
	 * TURNS` turns; this port has no terrain-panel system to place and tick
	 * it (same gap as HallowedGround above), so the cast instead stuns
	 * whoever is standing across the aimed line's perpendicular span the
	 * instant it is cast, and `lightWallActive` tracks the window so the free
	 * early-end recast still works. Divergence, stated here and in
	 * `PORT_COVERAGE.md`.
	 */
	resolveWallOfLight(this: DungeonScene, cell: { x: number; y: number }, instanceId?: string): void {
		const tome = findHolyTome(this.bag, instanceId);
		if (!tome) return;
		const rank = this.talentRank('wall_of_light');
		const level = tome.level ?? 0;
		const active = this.lightWallActive();
		if (this.subclass() !== 'paladin' || rank <= 0
			|| tomeCastGate(tome.cursed === true, this.hero.magicImmune === true, tome.charge ?? tomeChargeCap(level), wallOfLightCost(active)) !== 'ok') {
			this.say(t('port.log.tomenospell'), 'negative');
			return;
		}
		if (active) {
			delete this.hero.buffs['lightWallActive'];
			return;
		}
		if (!this.fov.isVisible(cell.x, cell.y)) {
			this.say(t('port.log.clericnotarget'), 'warning');
			return;
		}
		const dx = Math.sign(cell.x - this.hero.x);
		const dy = Math.sign(cell.y - this.hero.y);
		const perpX = -dy;
		const perpY = dx;
		const width = wallOfLightWidth(rank);
		const half = Math.floor(width / 2);
		for (let i = -half; i <= half; i++) {
			const victim = this.creatureAt(cell.x + perpX * i, cell.y + perpY * i);
			if (victim && !victim.isHero && !victim.isAlly && !victim.isNPC && victim.hp > 0) {
				addBuff(victim, 'paralysis', WALL_OF_LIGHT_PARALYSIS_TURNS);
			}
		}
		addBuff(this.hero, 'lightWallActive', WALL_OF_LIGHT_TURNS);
		if (this.hero.buffs['invisibility']) delete this.hero.buffs['invisibility'];
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		this.consumeSatiatedSpells();
		this.spendTomeForCast(tome, WALL_OF_LIGHT_COST, 'wallOfLight');
	},
};
