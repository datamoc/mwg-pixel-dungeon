import type { Actors } from 'mwg';
import type { Step } from '../combat';
import { AURA_COST, BLESS_COST, CLEANSE_COST, DIVINE_INTERVENTION_COST, DIVINE_SENSE_COST, HALLOWED_GROUND_COST, HOLY_LANCE_COST, JUDGEMENT_COST, LAY_ON_HANDS_COST, PRAYER_COST, RADIANCE_COST, SHIELD_OF_LIGHT_COST, SMITE_COST, SUNRAY_COST, TOME_SPELL_COST, WALL_OF_LIGHT_COST, flashCost, guidingLightCost, holyIntuitionCost, recallInscriptionCost, tomeCastGate, tomeChargeCap, wallOfLightCost, type SubclassSpellId, type TalentSpellId, type TomeSpellId } from '../simulation/clericSpells';

/** The `HolyTome` fields the cast flows read and write on the bag entry. */
export interface TomeBagItem {
	charge?: number;
	partialCharge?: number;
	level?: number;
	exp?: number;
	cursed?: boolean;
}

export function findHolyTome(bag: Actors.Inventory, instanceId?: string): (Actors.InventoryItem & TomeBagItem) | undefined {
	return bag.find('holyTome', instanceId) as (Actors.InventoryItem & TomeBagItem) | undefined;
}

/** One `WndClericSpells` row: the spell plus whether the tome can pay for it. */
export interface HolyTomePickerRow {
	spell: TomeSpellId | TalentSpellId | SubclassSpellId;
	affordable: boolean;
}

/** `port.spell.<key>` message suffix per spell (Java keys are lowercase class names -
 * `BlessSpell`'s is `blessspell`, whose port rows live under `port.spell.bless.*`). */
export function tomeSpellKey(spell: TomeSpellId | TalentSpellId | SubclassSpellId): string {
	return spell === 'guidingLight' ? 'guidinglight' : spell === 'holyWeapon' ? 'holyweapon'
		: spell === 'holyWard' ? 'holyward' : spell === 'holyIntuition' ? 'holyintuition'
		: spell === 'shieldOfLight' ? 'shieldoflight' : spell === 'recallInscription' ? 'recallinscription'
		: spell === 'sunray' ? 'sunray' : spell === 'divineSense' ? 'divinesense'
		: spell === 'bless' ? 'bless' : spell === 'cleanse' ? 'cleanse'
		: spell === 'radiance' ? 'radiance' : spell === 'holyLance' ? 'holylance'
		: spell === 'mnemonicPrayer' ? 'mnemonicprayer' : spell === 'smite' ? 'smite'
		: spell === 'layOnHands' ? 'layonhands' : spell === 'hallowedGround' ? 'hallowedground'
		: spell === 'wallOfLight' ? 'walloflight' : spell === 'divineIntervention' ? 'divineintervention' : spell === 'judgement' ? 'judgement' : spell === 'flash' ? 'flash' : 'auraofprotection';
}

/**
 * The picker-window charge cost per row. Talent-spell costs read the hero's rank in the
 * gating talent (`HolyIntuition.chargeUse()`'s `4 - points`, the T2 defaults 1/1/2/1,
 * `Cleanse.chargeUse()`'s flat 2); Recall's price additionally reads the tracked
 * item class (`recallCost`, 0 untracked).
 */
export function tomePickerCost(spell: TomeSpellId | TalentSpellId | SubclassSpellId, talentRank: number, recallCost = 0): number {
	if (spell === 'holyIntuition') return holyIntuitionCost(talentRank);
	if (spell === 'shieldOfLight') return SHIELD_OF_LIGHT_COST;
	if (spell === 'recallInscription') return recallCost;
	if (spell === 'sunray') return SUNRAY_COST;
	if (spell === 'divineSense') return DIVINE_SENSE_COST;
	if (spell === 'bless') return BLESS_COST;
	if (spell === 'cleanse') return CLEANSE_COST;
	if (spell === 'radiance') return RADIANCE_COST;
	if (spell === 'holyLance') return HOLY_LANCE_COST;
	if (spell === 'mnemonicPrayer') return PRAYER_COST;
	if (spell === 'smite') return SMITE_COST;
	if (spell === 'layOnHands') return LAY_ON_HANDS_COST;
	if (spell === 'auraOfProtection') return AURA_COST;
	if (spell === 'hallowedGround') return HALLOWED_GROUND_COST;
	if (spell === 'wallOfLight') return WALL_OF_LIGHT_COST;
	if (spell === 'divineIntervention') return DIVINE_INTERVENTION_COST;
	if (spell === 'judgement') return JUDGEMENT_COST;
	if (spell === 'flash') return flashCost(0);
	return TOME_SPELL_COST[spell];
}

/**
 * `HolyTome.directCharge()` (tag `v3.3.8`): an instant partial grant with the
 * carry and the cap - unlike the recharge tick it banks no exp. Returns the new
 * `{ charge, partialCharge }` for the caller to write back.
 */
export function directTomeCharge(charge: number, partialCharge: number, level: number, amount: number): { charge: number; partialCharge: number } {
	const cap = tomeChargeCap(level);
	if (charge < cap) {
		partialCharge += amount;
		while (partialCharge >= 1) {
			charge++;
			partialCharge--;
		}
		if (charge >= cap) {
			partialCharge = 0;
			charge = cap;
		}
	}
	return { charge, partialCharge };
}

/** The `HolyTome.talentRank` read the row costs and gates need. */
export type TomeTalentRank = (id: string) => number;

export interface HolyTomeBagPick {
	id: string;
	instanceId?: string;
	identified?: boolean;
	quantity?: number;
}

export interface HolyTomeContext {
	readonly bag: Actors.Inventory;
	readonly heroLevel: number;
	readonly magicImmune: boolean;
	readonly talentRank: TomeTalentRank;
	/** The recall tracker's item class (`UsedItemTracker.item`), if one is armed. */
	readonly recallTrackedClass: () => string | undefined;
	/** The hero's subclass (`priest`/`paladin` gate the subclass-granted spells). */
	readonly subclass: () => string;
	/** Live hero-buff read (the Priest's free-GuidingLight cooldown, immunity gates). */
	readonly hasBuff: (id: string) => boolean;
	/** Whether a Wall of Light is already up (the recast just ends it, free). */
	readonly wallActive: () => boolean;
	readonly ascendedActive: () => boolean;
	readonly ascendedFlashCasts: () => number;
	/** `AscendBuff.divineInverventionCast`: DivineIntervention is once per Ascended form. */
	readonly ascendedDivineCast: () => boolean;
	/** Scene-side DivineIntervention resolution (hero + ally shields, form extension, turn, charge). */
	resolveDivineIntervention(instanceId?: string): void;
	openSpellPicker(rows: HolyTomePickerRow[], onPick: (spell: TomeSpellId | TalentSpellId | SubclassSpellId) => void): void;
	beginSpellAim(onConfirm: (cell: Step) => void, range?: number): void;
	/** The level's diagonal span - the uncapped rays borrow it like the armor-ability aim. */
	readonly levelSpan: () => number;
	openBagPicker(title: string, entries: HolyTomeBagPick[], onPick: (pick: HolyTomeBagPick) => void): void;
	/** Scene-side GuidingLight resolution (damage/press, turn, charge). */
	resolveGuidingLight(cell: Step, instanceId?: string): void;
	/** Scene-side HolyWeapon/HolyWard resolution (buff, charge, no turn). */
	castHolyBuff(spell: 'holyWeapon' | 'holyWard', instanceId?: string): void;
	/** Scene-side HolyIntuition resolution (curse reveal, turn, charge). */
	resolveHolyIntuition(pick: HolyTomeBagPick, instanceId?: string): void;
	/** Scene-side ShieldOfLight resolution (tracker, no turn, charge). */
	resolveShieldOfLight(cell: Step, instanceId?: string): void;
	/** Scene-side RecallInscription resolution (re-cast, no turn, charge). */
	resolveRecall(instanceId?: string): void;
	/** Scene-side Sunray resolution (ray damage + blind, turn, charge). */
	resolveSunray(cell: Step, instanceId?: string): void;
	/** Scene-side DivineSense resolution (50-turn tracker, no turn, charge). */
	resolveDivineSense(instanceId?: string): void;
	/** Scene-side BlessSpell resolution (buff/shield or heal, turn, charge). */
	resolveBless(cell: Step, instanceId?: string): void;
	/** Scene-side Cleanse resolution (detach + immunity + shield, turn, charge). */
	resolveCleanse(instanceId?: string): void;
	/** Scene-side Radiance resolution (flash + AoE, turn, charge). */
	resolveRadiance(instanceId?: string): void;
	/** Scene-side HolyLance resolution (projectile ray, turn, charge). */
	resolveHolyLance(cell: Step, instanceId?: string): void;
	/** Scene-side MnemonicPrayer resolution (buff extension, free, charge). */
	resolvePrayer(cell: Step, instanceId?: string): void;
	/** Scene-side Smite resolution (empowered strike, attack turn, charge). */
	resolveSmite(cell: Step, instanceId?: string): void;
	/** Scene-side LayOnHands resolution (heal/shield, free, charge). */
	resolveLayOnHands(cell: Step, instanceId?: string): void;
	/** Scene-side AuraOfProtection resolution (20-turn buff, turn, charge). */
	resolveAura(instanceId?: string): void;
	/** Scene-side HallowedGround resolution (terrain + blob, turn, charge). */
	resolveHallowedGround(cell: Step, instanceId?: string): void;
	/** Scene-side WallOfLight resolution (ray of walls, turn, charge). */
	resolveWallOfLight(cell: Step, instanceId?: string): void;
	resolveJudgement(instanceId?: string): void;
	resolveFlash(cell: Step, instanceId?: string): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/**
 * `HolyTome.execute()`'s `AC_CAST`: cursed refuses with the tome's own line,
 * MagicImmune offers nothing at all (Java's `actions()` withholds `AC_CAST`),
 * otherwise the spell window opens with the base three plus every talent spell
 * whose talent the hero holds (`ClericSpell.getSpellList()` tiers 1-3).
 */
export function useHolyTomeFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (tome.cursed === true) {
		ctx.say(ctx.t('port.log.tomecursed'), 'negative');
		return;
	}
	if (ctx.magicImmune) return;
	const charge = tome.charge ?? 0;
	//`GuidingLight.chargeUse()`'s Priest half: the row prices the live cost (0 on a
	//fresh cooldown), so the picker and the purse re-check below agree.
	const guidingCost = guidingLightCost(ctx.subclass(), ctx.hasBuff('guidingPriestCooldown'));
	const rows: HolyTomePickerRow[] = (['guidingLight', 'holyWeapon', 'holyWard'] as TomeSpellId[]).map((spell) => ({
		spell,
		affordable: charge >= (spell === 'guidingLight' ? guidingCost : TOME_SPELL_COST[spell]),
	}));
	//`ClericSpell.getSpellList()` tiers 1-3 plus the subclass tier (tag `v3.3.8`):
	//the talent spells join the base three in this order, each gated on its
	//talent (subclass spells on the subclass itself). The window shows every
	//tier in one list with separator bars; this picker is one flat list in
	//the same order.
	const intuitionRank = ctx.talentRank('holy_intuition');
	if (intuitionRank > 0) rows.push({ spell: 'holyIntuition', affordable: charge >= holyIntuitionCost(intuitionRank) });
	if (ctx.talentRank('shield_of_light') > 0) rows.push({ spell: 'shieldOfLight', affordable: charge >= SHIELD_OF_LIGHT_COST });
	if (ctx.talentRank('recall_inscription') > 0) {
		const recallCost = recallInscriptionCost(ctx.recallTrackedClass());
		rows.push({ spell: 'recallInscription', affordable: ctx.recallTrackedClass() !== undefined && charge >= recallCost });
	}
	if (ctx.talentRank('sunray') > 0) rows.push({ spell: 'sunray', affordable: charge >= SUNRAY_COST });
	if (ctx.talentRank('divine_sense') > 0) rows.push({ spell: 'divineSense', affordable: charge >= DIVINE_SENSE_COST });
	if (ctx.talentRank('bless') > 0) rows.push({ spell: 'bless', affordable: charge >= BLESS_COST });
	//`ClericSpell.getSpellList()`'s subclass tier (tag `v3.3.8`): the subclass's
	//own spell first (no talent gate - the subclass itself grants it), then
	//Cleanse, then the subclass's talent spells in talent order.
	const subclass = ctx.subclass();
	if (subclass === 'priest') rows.push({ spell: 'radiance', affordable: charge >= RADIANCE_COST });
	if (subclass === 'paladin') rows.push({ spell: 'smite', affordable: charge >= SMITE_COST });
	if (ctx.talentRank('cleanse') > 0) rows.push({ spell: 'cleanse', affordable: charge >= CLEANSE_COST });
	if (subclass === 'priest') {
		if (ctx.talentRank('holy_lance') > 0) rows.push({ spell: 'holyLance', affordable: charge >= HOLY_LANCE_COST });
		if (ctx.talentRank('hallowed_ground') > 0) rows.push({ spell: 'hallowedGround', affordable: charge >= HALLOWED_GROUND_COST });
		if (ctx.talentRank('mnemonic_prayer') > 0) rows.push({ spell: 'mnemonicPrayer', affordable: charge >= PRAYER_COST });
	}
	if (subclass === 'paladin') {
		if (ctx.talentRank('lay_on_hands') > 0) rows.push({ spell: 'layOnHands', affordable: charge >= LAY_ON_HANDS_COST });
		if (ctx.talentRank('aura_of_protection') > 0) rows.push({ spell: 'auraOfProtection', affordable: charge >= AURA_COST });
		//`WallOfLight.chargeUse()`: the row prices the live cost (0 while a wall
		//is up - the recast just ends it early), like the GuidingLight row above.
		if (ctx.talentRank('wall_of_light') > 0) rows.push({ spell: 'wallOfLight', affordable: charge >= wallOfLightCost(ctx.wallActive()) });
	}
	// Tier 4 follows the subclass tier in Java's `getSpellList()` (DivineIntervention,
	// Judgement, Flash); each is offered only while its AscendedForm gate is live.
	if (ctx.ascendedActive() && !ctx.ascendedDivineCast() && ctx.talentRank('divine_intervention') > 0) rows.push({ spell: 'divineIntervention', affordable: charge >= DIVINE_INTERVENTION_COST });
	if (ctx.ascendedActive() && ctx.talentRank('judgement') > 0) rows.push({ spell: 'judgement', affordable: charge >= JUDGEMENT_COST });
	if (ctx.ascendedActive() && ctx.talentRank('flash') > 0) rows.push({ spell: 'flash', affordable: charge >= flashCost(ctx.ascendedFlashCasts()) });
	ctx.openSpellPicker(rows, (spell) => {
		if (spell === 'guidingLight') castGuidingLightFlow(ctx, instanceId);
		else if (spell === 'holyIntuition') castHolyIntuitionFlow(ctx, instanceId);
		else if (spell === 'shieldOfLight') castShieldOfLightFlow(ctx, instanceId);
		else if (spell === 'recallInscription') castRecallFlow(ctx, instanceId);
		else if (spell === 'sunray') castSunrayFlow(ctx, instanceId);
		else if (spell === 'divineSense') castDivineSenseFlow(ctx, instanceId);
		else if (spell === 'bless') castBlessFlow(ctx, instanceId);
		else if (spell === 'cleanse') castCleanseFlow(ctx, instanceId);
		else if (spell === 'radiance') castRadianceFlow(ctx, instanceId);
		else if (spell === 'holyLance') castHolyLanceFlow(ctx, instanceId);
		else if (spell === 'mnemonicPrayer') castPrayerFlow(ctx, instanceId);
		else if (spell === 'smite') castSmiteFlow(ctx, instanceId);
		else if (spell === 'layOnHands') castLayOnHandsFlow(ctx, instanceId);
		else if (spell === 'auraOfProtection') castAuraFlow(ctx, instanceId);
		else if (spell === 'hallowedGround') castHallowedGroundFlow(ctx, instanceId);
		else if (spell === 'wallOfLight') castWallOfLightFlow(ctx, instanceId);
		else if (spell === 'divineIntervention') castDivineInterventionFlow(ctx, instanceId);
		else if (spell === 'judgement') castJudgementFlow(ctx, instanceId);
		else if (spell === 'flash') castFlashFlow(ctx, instanceId);
		else ctx.castHolyBuff(spell, instanceId);
	});
}

/**
 * `HolyIntuition.usableOnItem()` (`actors/hero/spells/HolyIntuition.java`, tag `v3.3.8`):
 * unidentified gear whose curse is still unknown. The port's gear notion is the Detect
 * Magic stone's (`weaponReward`/`armorReward`/`ring_*`/`wand`).
 */
export function isHolyIntuitionCandidate(item: { id: string; quantity: number; identified?: boolean; cursedKnown?: boolean }): boolean {
	return item.quantity > 0
		&& (item.id === 'weaponReward' || item.id === 'armorReward' || item.id.startsWith('ring_') || item.id === 'wand')
		&& !item.identified && !item.cursedKnown;
}

/**
 * `HolyIntuition`'s cast head: the purse re-check (unaffordable rows stay tappable and
 * refuse, like the base three), then the bag selector. A null pick spends nothing -
 * `onItemSelected` returns before `onSpellCast` - which the picker expresses as a
 * cancel row, so even an empty candidate list opens the window like Java's `WndBag`.
 */
export function castHolyIntuitionFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	const rank = ctx.talentRank('holy_intuition');
	if (rank <= 0 || tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, holyIntuitionCost(rank)) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	const candidates = ctx.bag.items.filter((item) => isHolyIntuitionCandidate(item as { id: string; quantity: number; identified?: boolean; cursedKnown?: boolean }));
	ctx.openBagPicker(ctx.t('port.spell.holyintuition.prompt'),
		candidates.map((item) => ({ id: item.id, instanceId: item.instanceId ?? undefined, identified: item.identified, quantity: item.quantity })),
		(pick) => ctx.resolveHolyIntuition(pick, instanceId));
}

/**
 * `ShieldOfLight.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): the purse re-check,
 * then the cell selector. Target legality (enemy, seen) is decided at confirm time, not
 * here - `onTargetSelected` gates with the `no_target` line after the cell arrives.
 */
export function castShieldOfLightFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.talentRank('shield_of_light') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, SHIELD_OF_LIGHT_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveShieldOfLight(cell, instanceId));
}

/**
 * `RecallInscription.onCast()` (tag `v3.3.8`): the purse re-check (cost reads the
 * tracked class) plus the `canCast` tracker requirement, then the re-cast. A null
 * tracker returns before `onSpellCast` and spends nothing.
 */
export function castRecallFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	const tracked = ctx.recallTrackedClass();
	if (ctx.talentRank('recall_inscription') <= 0 || tracked === undefined
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, recallInscriptionCost(tracked)) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.resolveRecall(instanceId);
}

/**
 * `Sunray.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): the purse re-check,
 * then the cell selector. Collision/self/empty legality is decided at confirm time.
 */
export function castSunrayFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.talentRank('sunray') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, SUNRAY_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveSunray(cell, instanceId));
}

/**
 * `DivineSense.onCast()` (tag `v3.3.8`): no targeting - the purse re-check, then
 * the immediate resolve. Like ShieldOfLight it takes no time (`hero.next()`
 * without `spend()`), but it still runs the shared `onSpellCast` tail.
 */
export function castDivineSenseFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.talentRank('divine_sense') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, DIVINE_SENSE_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.resolveDivineSense(instanceId);
}

/**
 * `BlessSpell.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): the purse re-check,
 * then the cell selector. It sets no auto-targeting (`targetingFlags() == -1` -
 * ours is manual anyway); target legality at confirm time.
 */
export function castBlessFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.talentRank('bless') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, BLESS_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveBless(cell, instanceId));
}

/**
 * `Cleanse.onCast()` (tag `v3.3.8`): no targeting - the purse re-check, then
 * the immediate resolve. The hero plus every visible ally is affected, so the
 * cell selector never opens; like Bless it spends the turn (unlike the
 * instant DivineSense), then runs the shared `onSpellCast` tail.
 */
export function castCleanseFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.talentRank('cleanse') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, CLEANSE_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.resolveCleanse(instanceId);
}

/**
 * `Radiance.onCast()` (tag `v3.3.8`): Priest only, no targeting - the purse
 * re-check, then the immediate resolve. Like Cleanse it spends the turn.
 */
export function castRadianceFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'priest'
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, RADIANCE_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.resolveRadiance(instanceId);
}

/** `DivineIntervention.canCast()` (`actors/hero/spells/DivineIntervention.java`, tag
 * `v3.3.8`): the talent, a live AscendBuff whose `divineInverventionCast` is still unset,
 * and the ordinary purse gate; no targeting. */
export function castDivineInterventionFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (!ctx.ascendedActive() || ctx.ascendedDivineCast() || ctx.talentRank('divine_intervention') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, DIVINE_INTERVENTION_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.resolveDivineIntervention(instanceId);
}

/** `Judgement.onCast()` (`actors/hero/spells/Judgement.java`, tag `v3.3.8`):
 * AscendedForm plus the talent, immediate visible-area resolution. */
export function castJudgementFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (!ctx.ascendedActive() || ctx.talentRank('judgement') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, JUDGEMENT_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.resolveJudgement(instanceId);
}

/** `Flash.onTargetSelected()` (`Flash.java`, tag `v3.3.8`): AscendedForm-only
 * teleport to a valid empty cell, with a rising charge price per cast. */
export function castFlashFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	const cost = flashCost(ctx.ascendedFlashCasts());
	if (!tome || !ctx.ascendedActive() || ctx.talentRank('flash') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? tomeChargeCap(tome.level ?? 0), cost) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveFlash(cell, instanceId), 2 + ctx.talentRank('flash'));
}

/**
 * `HolyLance.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): Priest plus the
 * lance talent, the purse re-check, then the cell selector. The 30-turn
 * cooldown gate lives at confirm time (`LanceCooldown` present refuses); the
 * self-cell refusal does too.
 */
export function castHolyLanceFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'priest' || ctx.talentRank('holy_lance') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, HOLY_LANCE_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveHolyLance(cell, instanceId), ctx.levelSpan());
}

/**
 * `MnemonicPrayer.onCast()` (tag `v3.3.8`): Priest plus the prayer talent, the
 * purse re-check, then the cell selector. Target legality (a visible character)
 * is decided at confirm time; the cast itself is free (`hero.next()`).
 */
export function castPrayerFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'priest' || ctx.talentRank('mnemonic_prayer') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, PRAYER_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolvePrayer(cell, instanceId));
}

/**
 * `Smite.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): Paladin only, the
 * purse re-check, then the cell selector. Target legality (a reachable,
 * visible, uncharmed non-hero character) is decided at confirm time.
 */
export function castSmiteFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'paladin'
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, SMITE_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveSmite(cell, instanceId));
}

/**
 * `LayOnHands.onCast()` (tag `v3.3.8`): Paladin plus the lay talent, the purse
 * re-check, then the cell selector. Adjacency is decided at confirm time; the
 * cast itself is free (`hero.next()`).
 */
export function castLayOnHandsFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'paladin' || ctx.talentRank('lay_on_hands') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, LAY_ON_HANDS_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveLayOnHands(cell, instanceId));
}

/**
 * `AuraOfProtection.onCast()` (tag `v3.3.8`): Paladin plus the aura talent, the
 * purse re-check, then the immediate resolve. Like Cleanse it spends the turn.
 */
export function castAuraFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'paladin' || ctx.talentRank('aura_of_protection') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, AURA_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.resolveAura(instanceId);
}

/**
 * `GuidingLight.onCast()`: re-checks the purse, then opens the cell selector.
 * The purse prices `GuidingLight.chargeUse()`'s Priest half (free on a fresh
 * cooldown), matching the picker row.
 */
export function castGuidingLightFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	const cost = guidingLightCost(ctx.subclass(), ctx.hasBuff('guidingPriestCooldown'));
	if (tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, cost) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveGuidingLight(cell, instanceId));
}

/**
 * `HallowedGround.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): Priest plus
 * the ground talent, the purse re-check, then the cell selector. Visibility is
 * decided at confirm time (`heroFOV`); the cast spends the turn.
 */
export function castHallowedGroundFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'priest' || ctx.talentRank('hallowed_ground') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, HALLOWED_GROUND_COST) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveHallowedGround(cell, instanceId));
}

/**
 * `WallOfLight.onCast()` (`TargetedClericSpell`, tag `v3.3.8`): Paladin plus the
 * wall talent, the purse re-check (free while a wall is up - the recast just
 * ends it), then the cell selector. The ray truncates at confirm time; like
 * HolyLance the aim is uncapped, borrowing the level span.
 */
export function castWallOfLightFlow(ctx: HolyTomeContext, instanceId?: string): void {
	const tome = findHolyTome(ctx.bag, instanceId);
	if (!tome) return;
	if (ctx.subclass() !== 'paladin' || ctx.talentRank('wall_of_light') <= 0
		|| tomeCastGate(tome.cursed === true, ctx.magicImmune, tome.charge ?? 0, wallOfLightCost(ctx.wallActive())) !== 'ok') {
		ctx.say(ctx.t('port.log.tomenospell'), 'negative');
		return;
	}
	ctx.beginSpellAim((cell) => ctx.resolveWallOfLight(cell, instanceId), ctx.levelSpan());
}
