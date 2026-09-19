/**
 * Master Thieves' Armband's steal flow, split out of the scene so it can be checked without a
 * live game - the same split `items/sandals.ts`, `items/talisman.ts`, `items/chains.ts` and
 * `items/horn.ts` use. Every rule here is `MasterThievesArmband.java` (tag `v3.3.8`); the scene
 * owns the aiming, the loot tables, the spawn and the buffs.
 *
 * The flow itself (`useArmband`'s aimer, the steal confirm with its loot pick) lives here too,
 * behind `ArmbandFlowContext` - the file-size refactor's twelfth extraction, behavior-identical.
 */
import { Random } from 'mwg';
import type { GroundItem } from '../combat';
import type { GroundItemKind } from '../dungeonConstants';
import { mwlItemEffectValue } from '../mwlContent';

export type ArmbandItem = {
	level?: number;
	charge?: number;
	partialCharge?: number;
	exp?: number;
	cursed?: boolean;
};

/** A stealable creature, as the steal pass sees it (the scene passes the live creature, so
 *  setting `armbandStolen` marks the real one, the way the sandals flow mutates its item). */
export interface ArmbandVictim {
	readonly x: number;
	readonly y: number;
	readonly isHero?: boolean;
	readonly isNPC?: boolean;
	readonly isAlly?: boolean;
	readonly sleeping?: boolean;
	readonly seesHero?: boolean;
	readonly kind?: string;
	armbandStolen?: boolean;
}

/**
 * The Armband's steal flow, moved out of the scene behind this context the way the sandals,
 * talisman, chains and horn flows moved before it - behavior-identical, with the scene keeping
 * one builder plus the `useArmband` adapter the item-use router calls. The `t` field is
 * deliberately named `t` (bound to the real one) so the `t('...')` key audits keep matching
 * these call sites. Monster data (loot tables, decay, max levels) arrives through callbacks
 * because the catalogue module is too heavy for the item suite's harness to compile.
 */
export interface ArmbandFlowContext {
	armbandOf(instanceId?: string): ArmbandItem | undefined;
	beginAim(opts: { range: number; validate: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	creatureAt(x: number, y: number): ArmbandVictim | null;
	lootMultiplier(): number;
	heroLevel(): number;
	mobLoot(kind: string): { chance: number; kind: GroundItemKind }[];
	lootDecay(kind: string): ((drops: number) => number) | undefined;
	monsterMaxLvl(kind: string): number;
	limitedDropCount(kind: string): number;
	bumpLimitedDrop(kind: string): void;
	spawnLoot(kind: GroundItemKind, x: number, y: number, item?: GroundItem['item']): void;
	groundKindName(kind: GroundItemKind): string;
	addCreatureBuff(creature: ArmbandVictim, id: string, duration: number): void;
	dispelInvisibility(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `MasterThievesArmband.execute()`: curse/charge gates, then open the melee aimer. */
export function useArmbandFlow(ctx: ArmbandFlowContext, instanceId?: string): void {
	const armband = ctx.armbandOf(instanceId);
	if (!armband) return;
	if (armband.cursed) { ctx.say(ctx.t('items.artifacts.masterthievesarmband.cursed'), 'negative'); return; }
	if ((armband.charge ?? 0) < 1) { ctx.say(ctx.t('items.artifacts.masterthievesarmband.no_charge'), 'negative'); return; }
	ctx.beginAim({
		range: 1,
		validate: (cell) => armbandStealTarget(ctx, cell) !== null,
		onConfirm: (cell) => confirmArmbandStealFlow(ctx, cell, instanceId),
	});
	ctx.say(ctx.t('items.artifacts.masterthievesarmband.prompt'), 'positive');
}

/** A steal target is a live enemy: not the hero, no NPCs, no allies. */
export function armbandStealTarget(ctx: ArmbandFlowContext, cell: { x: number; y: number }): ArmbandVictim | null {
	const creature = ctx.creatureAt(cell.x, cell.y);
	if (!creature || creature.isHero || creature.isNPC || creature.isAlly) return null;
	return creature;
}

/** The steal chance for an ordinary monster: its first loot entry, decayed, multiplied. */
export function armbandLootChance(ctx: ArmbandFlowContext, kind: string | undefined): number {
	if (!kind) return 0;
	const multiplier = ctx.lootMultiplier();
	if (kind === 'warlock') return 0.5 * multiplier;
	if (kind === 'scorpio') return 0.5 * multiplier;
	if (kind === 'succubus') return 0.33 * multiplier;
	const entry = ctx.mobLoot(kind)[0];
	if (!entry) return 0;
	const decay = ctx.lootDecay(kind);
	const chance = decay ? entry.chance * decay(ctx.limitedDropCount(kind)) : entry.chance;
	return chance * multiplier;
}

/** The stolen drop: warlocks and scorpios brew potions, succubi scrolls, the rest their
 *  own first loot entry (advancing its limited-drop counter). */
export function armbandLootPick(ctx: ArmbandFlowContext, kind: string | undefined): { kind: GroundItemKind; item?: GroundItem['item'] } | null {
	if (!kind) return null;
	if (kind === 'warlock') {
		const warlockHp = ctx.limitedDropCount('warlock');
		if (Random.int(3) === 0 && Random.int(8) > warlockHp) {
			ctx.bumpLimitedDrop('warlock');
			return { kind: 'potion', item: { id: 'potionHealing', quantity: 1, identified: false } };
		}
		const nonHealing = ['potionStrength', 'potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'] as const;
		return { kind: 'potion', item: { id: Random.element(nonHealing)!, quantity: 1, identified: false } };
	}
	if (kind === 'scorpio') {
		const eligible = ['potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'] as const;
		return { kind: 'potion', item: { id: Random.element(eligible)!, quantity: 1, identified: false } };
	}
	if (kind === 'succubus') {
		const eligible = ['scrollCleanse', 'scrollMirror', 'scrollRecharging', 'scrollTeleportation', 'scrollLullaby', 'scrollMapping', 'scrollRage', 'scrollRetribution', 'scrollTerror', 'scrollTransmutation'] as const;
		return { kind: 'scroll', item: { id: Random.element(eligible)!, quantity: 1, identified: false } };
	}
	const entry = ctx.mobLoot(kind)[0];
	if (!entry) return null;
	const decay = ctx.lootDecay(kind);
	if (decay) ctx.bumpLimitedDrop(kind);
	return { kind: entry.kind };
}

/** The steal confirm: surprise bonus, level-gated chance, drop, mark, debuff, pay, level. */
export function confirmArmbandStealFlow(ctx: ArmbandFlowContext, target: { x: number; y: number }, instanceId?: string): void {
	const armband = ctx.armbandOf(instanceId);
	if (!armband) return;
	const creature = armbandStealTarget(ctx, target);
	if (!creature) { ctx.say(ctx.t('items.artifacts.masterthievesarmband.no_target'), 'negative'); return; }
	const level = armband.level ?? 0;
	//`Mob.surprisedBy()`'s own condition, already established at the combat call site's own
	//`surprise` local (see `attack()`, a few thousand lines up in the scene module).
	const surprised = creature.sleeping === true || (!creature.isHero && !creature.seesHero);
	let lootMultiplier = mwlItemEffectValue('armband', 'lootMultiplierBase') + mwlItemEffectValue('armband', 'lootMultiplierPerLevel') * level;
	let debuffDuration = mwlItemEffectValue('armband', 'debuffDurationBase') + Math.floor(level / 2);
	let exp = mwlItemEffectValue('armband', 'expPerUse');
	ctx.dispelInvisibility();
	if (surprised) {
		lootMultiplier += mwlItemEffectValue('armband', 'surpriseLootBonus');
		debuffDuration += mwlItemEffectValue('armband', 'surpriseDebuffBonus');
		exp += mwlItemEffectValue('armband', 'surpriseExpBonus');
	}
	const maxLvl = creature.kind ? ctx.monsterMaxLvl(creature.kind) : 0;
	const alreadyStolen = creature.armbandStolen === true;
	const lootChance = alreadyStolen || ctx.heroLevel() > maxLvl + mwlItemEffectValue('armband', 'maxLvlLootCutoff')
		? 0
		: armbandLootChance(ctx, creature.kind) * lootMultiplier;
	if (lootChance <= 0) {
		ctx.say(ctx.t('items.artifacts.masterthievesarmband.no_steal'), 'negative');
	} else if (Random.chance(lootChance)) {
		const drop = armbandLootPick(ctx, creature.kind);
		if (drop) {
			ctx.spawnLoot(drop.kind, creature.x, creature.y, drop.item);
			ctx.say(ctx.t('items.artifacts.masterthievesarmband.stole_item', { 0: ctx.groundKindName(drop.kind) }), 'positive');
		} else {
			ctx.say(ctx.t('items.artifacts.masterthievesarmband.failed_steal'), 'negative');
		}
	} else {
		ctx.say(ctx.t('items.artifacts.masterthievesarmband.failed_steal'), 'negative');
	}
	creature.armbandStolen = true;
	ctx.addCreatureBuff(creature, 'daze', debuffDuration);
	ctx.addCreatureBuff(creature, 'cripple', debuffDuration);
	armband.charge = Math.max(0, (armband.charge ?? 0) - 1);
	const levelCap = mwlItemEffectValue('armband', 'levelCap');
	armband.exp = (armband.exp ?? 0) + exp;
	while ((armband.level ?? 0) < levelCap
		&& (armband.exp ?? 0) >= mwlItemEffectValue('armband', 'expToLevelBase') + Math.round(mwlItemEffectValue('armband', 'expToLevelPerLevel') * (armband.level ?? 0))) {
		armband.exp = (armband.exp ?? 0) - (mwlItemEffectValue('armband', 'expToLevelBase') + Math.round(mwlItemEffectValue('armband', 'expToLevelPerLevel') * (armband.level ?? 0)));
		armband.level = (armband.level ?? 0) + 1;
		ctx.say(ctx.t('items.artifacts.masterthievesarmband.level_up'), 'positive');
	}
}
