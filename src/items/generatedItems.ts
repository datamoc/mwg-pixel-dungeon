import { MWL_CONSUMABLE_CLASS_TO_ID, MWL_MISSILE_BY_CLASS, MWL_RING_CLASS_TO_ID, mwlItemEffectValue, mwlItemNeedsInstance } from '../mwlContent';
import { ENCHANT_TABLE, GLYPH_TABLE } from './itemAffixes';
import { rollGeneratedAffix } from './itemKinds';
import { stonePortId } from './transmutation';
import { Cat, type GenItem } from './generator';
import { ARMOR_TIER_BY_CLASS } from './catalog';
import type { GroundItem } from '../combat';

export interface GeneratedItemContext {
	readonly newItemInstanceId: (kind: string) => string;
}

/** Converts Generator output into the live inventory payload used by item and scene systems. */
export function generatedInventoryItem(generated: GenItem, context: GeneratedItemContext): NonNullable<GroundItem['item']> {
	const cls = generated.cls;
	let id = 'food';
	if (generated.cat === Cat.GOLD) id = 'gold';
	else if (generated.cat >= Cat.MISSILE && generated.cat <= Cat.MIS_T5) id = MWL_MISSILE_BY_CLASS.get(cls)?.id ?? 'stone';
	else if (generated.cat <= Cat.WEP_T5) id = 'weaponReward';
	else if (generated.cat === Cat.STONE) id = stonePortId(cls);
	else if (generated.cat === Cat.SEED) id = 'seed';
	else if (generated.cat === Cat.ARMOR) id = 'armorReward';
	else if (generated.cat === Cat.ARTIFACT) {
		const artifactCls = generated.cls.toLowerCase();
		//Chalice of Blood (checked 2026-09-14): every other generated artifact class still
		//collapses to 'cloak' (Cloak of Shadows) below, a real, stated gap - see PORT_COVERAGE.md.
		id = artifactCls.includes('timekeepershourglass') ? 'hourglass' : artifactCls.includes('chaliceofblood') ? 'chalice' : 'cloak';
	}
	else if (generated.cat === Cat.RING) id = MWL_RING_CLASS_TO_ID.get(cls) ?? (() => { throw new Error(`MWL ring alias is missing generated class: ${cls}`); })();
	else if (generated.cat === Cat.WAND) id = 'wand';
	else if (generated.cat === Cat.POTION || generated.cat === Cat.SCROLL) {
		const mappedId = MWL_CONSUMABLE_CLASS_TO_ID.get(cls);
		if (!mappedId) throw new Error(`MWL consumable alias is missing generated class: ${cls}`);
		id = mappedId;
	}
	else if (generated.cat === Cat.FOOD) id = 'food';
	let affix: string | undefined;
	if (generated.cat <= Cat.WEP_T5) affix = rollGeneratedAffix(ENCHANT_TABLE, generated.cursed, generated.hasGoodEnchant);
	else if (generated.cat === Cat.ARMOR) affix = rollGeneratedAffix(GLYPH_TABLE, generated.cursed, generated.hasGoodEnchant);
	const tier = generated.cat >= Cat.WEP_T1 && generated.cat <= Cat.WEP_T5
		? generated.cat - Cat.WEP_T1 + 1
		: generated.cat === Cat.ARMOR ? ARMOR_TIER_BY_CLASS[generated.cls.toLowerCase()] ?? 1 : undefined;
	// Java stacks Plant.Seed objects by concrete seed class. Keep that class in the stack key;
	// the generic `seed` id alone would merge Sungrass and Rotberry and make alchemy unable to
	// recover which potion each seed represents.
	const seedInstanceId = id === 'seed' ? `seed:${generated.cls.toLowerCase()}` : undefined;
	return {
		id, quantity: generated.quantity, level: generated.level,
		...(tier === undefined ? {} : { tier }),
		...(id === 'cloak' ? { charges: Math.min((generated.level ?? 0) + mwlItemEffectValue('cloak', 'initialChargeBase'), mwlItemEffectValue('cloak', 'initialChargeCap')) } : {}),
		cursed: generated.cursed, affix, identified: false, sourceClass: generated.cls,
		instanceId: seedInstanceId ?? (mwlItemNeedsInstance(id) ? context.newItemInstanceId(id) : undefined),
	};
}
