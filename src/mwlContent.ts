import { contentCatalog, type MwlTableDefinition } from 'mwg/mwl';
import { gameData } from './generated/mwlContent';

/**
 * MWL source lives in a .mwl content file so designers can edit catalogue data without
 * touching TypeScript. `tools/compile-mwl.mjs` validates and compiles it before TypeScript;
 * the game imports only the generated data, while SPD-specific formulas and hooks remain in
 * this repository.
 */
const MWL_CONTENT = contentCatalog(gameData);

export const MWL_RING_ITEMS = MWL_CONTENT.items;
export const MWL_MONSTERS = MWL_CONTENT.monsters;
export const MWL_CONSUMABLE_ITEMS = MWL_CONTENT.items.filter((item) => item.slot === 'consumable');
/**
 * The authored item catalogue's `id` to `slot`. Java has no such table - an item's kind *is* its
 * class - so this is the port's single statement of it, for the rules that have to answer "what
 * kind of item is this?" from a bag id. `slot` is one of `weapon`, `armor`, `wand`, `ring`,
 * `missile`, `artifact`, `consumable`, and every authored item node carries one (checked: 228
 * nodes, no gaps). A bag id that is *not* in here was minted by the port rather than authored -
 * a generated weapon/armor payload, a picked-up heap, a quest prop - so those are resolved by
 * `src/items/itemKinds.ts` instead, which is where the minting lives.
 *
 * Built from the nodes that declare a slot, so the type stays `string` rather than
 * `string | undefined`: an item node without one is simply absent here, which lands the caller on
 * its own default rather than on a bogus `'undefined'` slot.
 */
export const MWL_ITEM_SLOTS: ReadonlyMap<string, string> = new Map(
	MWL_CONTENT.items.flatMap((item) => (item.slot === undefined ? [] : [[item.id, item.slot] as const])),
);

/**
 * MWG 0.7.2 typed MWL tables: `[table] columns=...` with `[row]` children. The framework validates
 * each column's shape and coerces every cell (`coerceTableValue`), so this port no longer
 * hand-splits `set=` positional rows or re-checks cell types - it only narrows the few columns
 * whose values are a closed set (a trigger name, a roster of ids). Every authored table below is
 * authored this way; `MWL_TABLE` is the single reader.
 */
const MWL_TABLES = new Map(MWL_CONTENT.tables.map((table) => [table.id, table]));

/** Shared item-art sources are authored as MWL rows; frame coordinates remain renderer data. */
export const MWL_ITEM_ASSET_SOURCES = new Map(
	MWL_TABLES.get('itemAssetSources')?.rows.map((row) => [String(row.slot), String(row.image)]) ?? [],
);
if (!MWL_ITEM_ASSET_SOURCES.has('items')) throw new Error('MWL item assets are missing the items atlas');

/** Item value metadata is authored in MWL; pricing formulas and conditional modifiers stay in TS. */
export const MWL_ITEM_UNIT_VALUES: Readonly<Record<string, number>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemUnitValues', 'item').map((row) => [String(row.item), Number(row.value)]),
);
export interface MwlEquipmentValueRule {
	readonly basePerTier: number;
	readonly positiveAffixMultiplier: number;
	readonly knownCurseMultiplier: number;
	readonly identifiedLevelBase: number;
}
/** Generated-gear price coefficients are content metadata; state-dependent price decisions stay TS. */
export const MWL_EQUIPMENT_VALUE_RULES: Readonly<Record<string, MwlEquipmentValueRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('equipmentValueRules', 'kind').map((row) => [String(row.kind), {
		basePerTier: Number(row.basePerTier), positiveAffixMultiplier: Number(row.positiveAffixMultiplier),
		knownCurseMultiplier: Number(row.knownCurseMultiplier), identifiedLevelBase: Number(row.identifiedLevelBase),
	}]),
);
if (Object.values(MWL_ITEM_UNIT_VALUES).some((value) => !Number.isFinite(value) || value < 0)) {
	throw new Error('MWL item unit values must be finite and non-negative');
}

/** Item categories are authored in MWL; executable behavior consumes these sets by category. */
export const MWL_ITEM_CATEGORIES: ReadonlyMap<string, string> = new Map(
	MWL_TABLE_ROWS('itemCategories', 'item').map((row) => [String(row.item), String(row.category)]),
);
/** Runtime-only item ids still have player-facing names authored as MWL key mappings. */
export const MWL_ITEM_NAME_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemNameKeys', 'item').map((row) => [String(row.item), String(row.nameKey)]),
);
/** Ground-item names are presentation metadata; the ground-kind selection remains executable. */
export const MWL_GROUND_ITEM_NAME_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('groundItemNameKeys', 'groundKind').map((row) => [String(row.groundKind), String(row.nameKey)]),
);
export interface MwlItemActionRule {
	readonly actionKey: string;
	readonly capitalize: boolean;
}
/** Inventory action labels are content/localization metadata; item routing remains in the UI. */
export const MWL_ITEM_ACTION_RULES: Readonly<Record<string, MwlItemActionRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemActionKeys', 'item').map((row) => [String(row.item), {
		actionKey: String(row.actionKey), capitalize: row.capitalize === true,
	}]),
);
/** Per-instance identity is item metadata; equip/unequip state remains in TypeScript. */
export const MWL_ITEM_INSTANCE_RULES: Readonly<Record<string, boolean>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemInstanceRules', 'item').map((row) => [String(row.item), row.needsInstance === true]),
);
export function mwlItemNeedsInstance(item: string): boolean {
	return MWL_ITEM_INSTANCE_RULES[item] ?? (item.startsWith('ring_') && MWL_ITEM_INSTANCE_RULES.ring === true);
}
/** Internal item ids and their ground-item render/interaction family are content aliases. */
export const MWL_ITEM_GROUND_KIND_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemGroundKindAliases', 'itemId').map((row) => [String(row.itemId), String(row.groundKind)]),
);
/** Ring Java-class aliases and compact runtime ids are authored in MWL. */
export const MWL_RING_CLASS_TO_ID: ReadonlyMap<string, string> = new Map(
	MWL_TABLE_ROWS('ringClassAliases', 'sourceClass').map((row) => [String(row.sourceClass), String(row.item)]),
);

export interface MwlMonsterDepthStatRule {
	readonly hpBase?: number; readonly hpPerDepth?: number;
	readonly accuracyBase?: number; readonly accuracyPerDepth?: number;
	readonly evasionBase?: number; readonly evasionPerDepth?: number; readonly evasionDivisor?: number;
	readonly damageMinBase?: number; readonly damageMinPerDepth?: number; readonly damageMinDivisor?: number; readonly damageMinFloor?: number;
	readonly damageMaxBase?: number; readonly damageMaxPerDepth?: number; readonly damageMaxDivisor?: number; readonly damageMaxFloor?: number;
	readonly armorMinBase?: number; readonly armorMinPerDepth?: number; readonly armorMinDivisor?: number;
	readonly armorMaxBase?: number; readonly armorMaxPerDepth?: number; readonly armorMaxDivisor?: number;
}

/** Depth-scaled monster formulas are authored alongside the base actor catalogue. */
export const MWL_MONSTER_DEPTH_STATS: Readonly<Record<string, MwlMonsterDepthStatRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('monsterDepthStats', 'monster').map((row) => {
		const number = (key: string): number | undefined => row[key] === undefined ? undefined : Number(row[key]);
		return [String(row.monster), {
			hpBase: number('hp_base'), hpPerDepth: number('hp_per_depth'),
			accuracyBase: number('accuracy_base'), accuracyPerDepth: number('accuracy_per_depth'),
			evasionBase: number('evasion_base'), evasionPerDepth: number('evasion_per_depth'), evasionDivisor: number('evasion_divisor'),
			damageMinBase: number('damage_min_base'), damageMinPerDepth: number('damage_min_per_depth'), damageMinDivisor: number('damage_min_divisor'), damageMinFloor: number('damage_min_floor'),
			damageMaxBase: number('damage_max_base'), damageMaxPerDepth: number('damage_max_per_depth'), damageMaxDivisor: number('damage_max_divisor'), damageMaxFloor: number('damage_max_floor'),
			armorMinBase: number('armor_min_base'), armorMinPerDepth: number('armor_min_per_depth'), armorMinDivisor: number('armor_min_divisor'),
			armorMaxBase: number('armor_max_base'), armorMaxPerDepth: number('armor_max_per_depth'), armorMaxDivisor: number('armor_max_divisor'),
		}];
	}),
);

/** Item atlas coordinates are content metadata; renderer-specific texture loading stays in TS. */
export const MWL_ITEM_FRAMES: Readonly<Record<string, number>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemFrames', 'kind').map((row) => [String(row.kind), Number(row.frame)]),
);
if (Object.values(MWL_ITEM_FRAMES).some((frame) => !Number.isInteger(frame) || frame < 0)) {
	throw new Error('MWL item frames must be non-negative integers');
}
export const MWL_ITEM_SPECIFIC_FRAMES: Readonly<Record<string, number>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemSpecificFrames', 'item').map((row) => [String(row.item), Number(row.frame)]),
);
if (Object.values(MWL_ITEM_SPECIFIC_FRAMES).some((frame) => !Number.isInteger(frame) || frame < 0)) {
	throw new Error('MWL item-specific frames must be non-negative integers');
}

/** Each hero class's starting-weapon bag icon (`ItemSpriteSheet` cells, see the MWL comment). */
export const MWL_STARTING_WEAPON_FRAMES: Readonly<Record<string, number>> = Object.fromEntries(
	MWL_TABLE_ROWS('startingWeaponFrames', 'class').map((row) => [String(row.class), Number(row.frame)]),
);
if (Object.values(MWL_STARTING_WEAPON_FRAMES).some((frame) => !Number.isInteger(frame) || frame < 0)) {
	throw new Error('MWL starting weapon frames must be non-negative integers');
}
export interface MwlConsumableStats {
	readonly hunger: number;
	readonly heal: number;
}
export const MWL_CONSUMABLE_STATS: Readonly<Record<string, MwlConsumableStats>> = Object.fromEntries(
	MWL_TABLE_ROWS('consumableStats', 'item').map((row) => [String(row.item), {
		hunger: Number(row.hunger), heal: Number(row.heal),
	}]),
);
/** Small item modifiers are authored in MWL; their application remains executable item logic. */
export const MWL_ITEM_EFFECT_VALUES: Readonly<Record<string, number>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemEffectValues', 'id').map((row) => [`${String(row.item)}.${String(row.effect)}`, Number(row.value)]),
);
if (Object.values(MWL_ITEM_EFFECT_VALUES).some((value) => !Number.isFinite(value))) {
	throw new Error('MWL item effect values must be finite numbers');
}
export function mwlItemEffectValue(item: string, effect: string): number {
	const value = MWL_ITEM_EFFECT_VALUES[`${item}.${effect}`];
	if (value === undefined) throw new Error(`MWL item effect value is missing: ${item}.${effect}`);
	return value;
}
export interface MwlBombRule {
	readonly chainRadius: number;
	readonly affectedRadius: number;
	readonly baseBlast: boolean;
	readonly piercesArmor: boolean;
	readonly minBase: number;
	readonly minPerDepth: number;
	readonly maxBase: number;
	readonly maxPerDepth: number;
}
export const MWL_BOMB_RULES: Readonly<Record<string, MwlBombRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('bombRules', 'variant').map((row) => [String(row.variant), {
		chainRadius: Number(row.chainRadius), affectedRadius: Number(row.affectedRadius),
		baseBlast: Boolean(row.baseBlast), piercesArmor: Boolean(row.piercesArmor),
		minBase: Number(row.minBase), minPerDepth: Number(row.minPerDepth), maxBase: Number(row.maxBase), maxPerDepth: Number(row.maxPerDepth),
	}]),
);
for (const [variant, rule] of Object.entries(MWL_BOMB_RULES)) {
	if (![rule.chainRadius, rule.affectedRadius, rule.minBase, rule.minPerDepth, rule.maxBase, rule.maxPerDepth].every(Number.isFinite)) throw new Error(`MWL bomb rule is not finite: ${variant}`);
	if (rule.chainRadius < 0 || rule.affectedRadius < 0 || rule.minBase < 0 || rule.maxBase < 0) throw new Error(`MWL bomb rule is negative: ${variant}`);
}
export const MWL_ITEM_LIMITS: Readonly<Record<string, number>> = Object.fromEntries(
	MWL_TABLE_ROWS('itemLimits', 'item').map((row) => [String(row.item), Number(row.value)]),
);
export const MWL_CONSUMABLE_DESCRIPTION_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('consumableDescriptionKeys', 'item').map((row) => [String(row.item), String(row.descriptionKey)]),
);
export const MWL_EQUIPMENT_DESCRIPTION_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('equipmentDescriptionKeys', 'item').map((row) => [String(row.item), String(row.descriptionKey)]),
);

export interface MwlConsumableClassAlias {
	readonly sourceClass: string;
	readonly item: string;
	readonly category: 'potion' | 'scroll' | 'seed' | 'stone';
}
export const MWL_CONSUMABLE_CLASS_ALIASES: readonly MwlConsumableClassAlias[] = MWL_TABLE_ROWS('consumableClassAliases', 'sourceClass').map((row) => {
	const category = String(row.category);
	if (category !== 'potion' && category !== 'scroll' && category !== 'seed' && category !== 'stone') throw new Error(`Invalid consumable alias category: ${category}`);
	return { sourceClass: String(row.sourceClass), item: String(row.item), category };
});
export const MWL_CONSUMABLE_CLASS_TO_ID = new Map(MWL_CONSUMABLE_CLASS_ALIASES.map((alias) => [alias.sourceClass, alias.item]));

export interface MwlEquipmentStatRule {
	readonly minFormula: string;
	readonly maxFormula: string;
}

export const MWL_EQUIPMENT_STAT_RULES: Readonly<Record<string, MwlEquipmentStatRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('equipmentStatRules', 'kind').map((row) => [String(row.kind), {
		minFormula: String(row.minFormula), maxFormula: String(row.maxFormula),
	}]),
);


/** Reads one numeric `effect` off a `trait` node, failing loudly when it is absent or NaN. */
function traitEffectNumber(traitId: string, applyTo: string): number {
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === traitId);
	const value = trait?.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === applyTo)?.attributes.set;
	const number = value === undefined ? NaN : Number(value);
	if (!Number.isFinite(number)) throw new Error(`MWL trait ${traitId} is missing numeric effect ${applyTo}`);
	return number;
}

export interface MwlDefaultMeleeCombat {
	readonly accuracy: number;
	readonly delay: number;
	readonly reach: number;
	readonly defense: number;
}

export function MWL_TABLE(id: string): MwlTableDefinition {
	const table = MWL_TABLES.get(id);
	if (!table) throw new Error(`MWL table is missing: ${id}`);
	return table;
}

/** Reads a table's rows and rejects duplicate keys - MWG validates cell shape, not row uniqueness.
 * `key` is the column that must be unique; it is skipped when the table does not declare it (e.g.
 * `bossTransitions`, keyed by depth and with no `id` column). */
export function MWL_TABLE_ROWS(id: string, key = 'id'): readonly Readonly<Record<string, unknown>>[] {
	const table = MWL_TABLE(id);
	const rows = table.rows;
	if (table.columns.some((column) => column.name === key)) {
		if (new Set(rows.map((row) => String(row[key]))).size !== rows.length) throw new Error(`MWL table ${id} contains duplicate ${key}s`);
	}
	return rows;
}

export interface MwlRawNode {
	readonly tag: string;
	readonly attributes: Readonly<Record<string, string>>;
	readonly children: readonly MwlRawNode[];
}

const MWL_ROOT_NODES = gameData.roots as unknown as readonly MwlRawNode[];
function allMwlNodes(nodes: readonly MwlRawNode[]): MwlRawNode[] {
	return nodes.flatMap((node) => [node, ...allMwlNodes(node.children)]);
}

const MWL_NODES = allMwlNodes(MWL_ROOT_NODES);
export const MWL_ITEM_NODES = MWL_NODES.filter((node) => node.tag === 'item');
export const MWL_TRAIT_NODES = MWL_NODES.filter((node) => node.tag === 'trait');
export const MWL_MONSTER_NODES = MWL_NODES.filter((node) => node.tag === 'monster');

/** `MeleeWeapon`'s own class defaults, for a weapon class with no `weaponCombatRules` row.
 * Initialized here, after `MWL_TRAIT_NODES` above (module evaluation order). */
export const MWL_DEFAULT_MELEE_COMBAT: MwlDefaultMeleeCombat = {
	accuracy: traitEffectNumber('defaultMeleeCombat', 'accuracy'),
	delay: traitEffectNumber('defaultMeleeCombat', 'delay'),
	reach: traitEffectNumber('defaultMeleeCombat', 'reach'),
	defense: traitEffectNumber('defaultMeleeCombat', 'defense'),
};
export const MWL_SPECIAL_ITEM_GROUND_KINDS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('specialItemGroundKinds', 'sourceClass').map((row) => [String(row.sourceClass).toLowerCase(), String(row.groundKind)]),
);
export interface MwlSpecialItemInventoryRule {
	readonly sourceClass: string;
	readonly itemId: string;
	readonly identified: boolean;
	readonly cursed: boolean;
}
export const MWL_SPECIAL_ITEM_INVENTORY_RULES: readonly MwlSpecialItemInventoryRule[] = MWL_TABLE_ROWS('specialItemInventoryRules', 'sourceClass').map((row) => ({
	sourceClass: String(row.sourceClass),
	itemId: String(row.itemId),
	identified: Boolean(row.identified),
	cursed: Boolean(row.cursed),
}));
export const MWL_SPECIAL_ITEM_INVENTORY_BY_CLASS: ReadonlyMap<string, MwlSpecialItemInventoryRule> = new Map(
	MWL_SPECIAL_ITEM_INVENTORY_RULES.map((rule) => [rule.sourceClass.toLowerCase(), rule]),
);

export interface MwlMissileDefinition {
	readonly id: string;
	readonly sourceClass: string;
	readonly tier: number;
	readonly minDamage: number;
	readonly maxDamage: number;
	/** `MissileWeapon.baseUses` (tag `v3.3.8`): durability uses before the `1.5^level` scaling. */
	readonly baseUses: number;
}

/** Missile classes are content data too; the combat adapter decides how much of this
 * payload is currently used by the compact thrown-ammo model. */
function parseMissileDefinitions(): readonly MwlMissileDefinition[] {
	return MWL_TABLE_ROWS('missileDefinitions').map((row) => ({
		id: String(row.id),
		sourceClass: String(row.sourceClass),
		tier: Number(row.tier),
		minDamage: Number(row.minDamage),
		maxDamage: Number(row.maxDamage),
		baseUses: Number(row.baseUses),
	}));
}

export const MWL_MISSILE_DEFINITIONS = parseMissileDefinitions();
export const MWL_MISSILE_BY_CLASS = new Map(MWL_MISSILE_DEFINITIONS.map((definition) => [definition.sourceClass, definition]));
export const MWL_MISSILE_DESCRIPTION_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_TABLE_ROWS('missileDescriptionKeys', 'id').map((row) => [String(row.item), String(row.descriptionKey)]),
);
/**
 * `missileDefinitions` (the mechanical table) carries damage/uses but no display name - the name
 * lives on each missile's own `item` node in `missiles.mwl`. The boomerang's return logs Java's
 * real `hero.you_now_have` line, which needs that name, so this maps id to name key off the
 * authored item nodes rather than duplicating the strings into the table.
 */
export const MWL_MISSILE_NAME_KEYS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_CONTENT.items.filter((item) => item.slot === 'missile').map((item) => [item.id, item.name]),
);
export interface MwlMissileUpgradeRule {
	readonly minPerLevel: number;
	readonly maxPerLevel: number;
}
export const MWL_MISSILE_UPGRADE_RULES: Readonly<Record<string, MwlMissileUpgradeRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('missileUpgradeRules', 'sourceClass').map((row) => [String(row.sourceClass), {
		minPerLevel: Number(row.minPerLevel), maxPerLevel: Number(row.maxPerLevel),
	}]),
);

/** `MissileWeapon`'s own `baseUses` field default, for a wielded class with no authored row. */
export const MWL_DEFAULT_MISSILE_BASE_USES: number = traitEffectNumber('defaultMissileBaseUses', 'default');

export interface MwlWandDefinition {
	readonly id: string;
	readonly sourceClass: string;
	readonly type: string;
	readonly name: string;
}

export const MWL_WAND_DEFINITIONS: readonly MwlWandDefinition[] = MWL_TABLE_ROWS('wandDefinitions', 'id').map((row) => ({
	id: String(row.id), sourceClass: String(row.sourceClass), type: String(row.type), name: String(row.name),
}));
export interface MwlWandRangeRule {
	readonly base: number;
	readonly perLevel: number;
}
export const MWL_WAND_RANGE_RULES: Readonly<Record<string, MwlWandRangeRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('wandRangeRules', 'type').map((row) => [String(row.type), { base: Number(row.base), perLevel: Number(row.perLevel) }]),
);
export interface MwlWandChargeRule {
	readonly ratio: number;
	readonly min: number;
	readonly max: number;
}
export const MWL_WAND_CHARGE_RULES: Readonly<Record<string, MwlWandChargeRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('wandChargeRules', 'type').map((row) => [String(row.type), { ratio: Number(row.ratio), min: Number(row.min), max: Number(row.max) }]),
);
export interface MwlWandDamageRule {
	readonly minBase: number;
	readonly minPerLevel: number;
	readonly maxBase: number;
	readonly maxPerLevel: number;
}
export const MWL_WAND_DAMAGE_RULES: Readonly<Record<string, MwlWandDamageRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('wandDamageRules', 'type').map((row) => [String(row.type), {
		minBase: Number(row.minBase), minPerLevel: Number(row.minPerLevel),
		maxBase: Number(row.maxBase), maxPerLevel: Number(row.maxPerLevel),
	}]),
);
export interface MwlWandWardRule {
	readonly maxHp: number;
	readonly heal: number;
	readonly selfDamage: number;
	readonly zapLimit: number;
}
export const MWL_WAND_WARD_RULES: Readonly<Record<number, MwlWandWardRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('wandWardRules', 'tier').map((row) => [Number(row.tier), {
		maxHp: Number(row.maxHp), heal: Number(row.heal),
		selfDamage: Number(row.selfDamage), zapLimit: Number(row.zapLimit),
	}]),
);
export interface MwlWandFireblastRule {
	readonly degrees: number;
	readonly distance: number;
	readonly fireVolume: number;
	readonly minLevelFactor: number;
	readonly maxBase: number;
	readonly maxPerLevel: number;
}
export const MWL_WAND_FIREBLAST_RULES: Readonly<Record<number, MwlWandFireblastRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('wandFireblastRules', 'charges').map((row) => [Number(row.charges), {
		degrees: Number(row.degrees), distance: Number(row.distance), fireVolume: Number(row.fireVolume),
		minLevelFactor: Number(row.minLevelFactor), maxBase: Number(row.maxBase), maxPerLevel: Number(row.maxPerLevel),
	}]),
);
export interface MwlWandRegrowthRule {
	readonly degrees: number;
	readonly distance: number;
	readonly rootsPerCharge: number;
	readonly grassBase: number;
	readonly grassPerLevel: number;
	readonly lotusMinCharges: number;
}
export const MWL_WAND_REGROWTH_RULES: Readonly<Record<number, MwlWandRegrowthRule>> = Object.fromEntries(
	MWL_TABLE_ROWS('wandRegrowthRules', 'charges').map((row) => [Number(row.charges), {
		degrees: Number(row.degrees), distance: Number(row.distance), rootsPerCharge: Number(row.rootsPerCharge),
		grassBase: Number(row.grassBase), grassPerLevel: Number(row.grassPerLevel), lotusMinCharges: Number(row.lotusMinCharges),
	}]),
);

export interface MwlScenarioChapter {
	readonly id: string;
	readonly firstDepth: number;
	readonly bossDepth: number;
	readonly bossKind: string;
}

function parseScenarioChapters(): readonly MwlScenarioChapter[] {
	const chapters = MWL_TABLE_ROWS('scenarioChapters').map((row) => ({
		id: String(row.id),
		firstDepth: Number(row.firstDepth),
		bossDepth: Number(row.bossDepth),
		bossKind: String(row.bossKind),
	}));
	// A cross-row invariant MWG does not check: chapters must be ordered and non-overlapping.
	if (chapters.some((chapter, index) => index > 0 && chapter.firstDepth <= chapters[index - 1]!.bossDepth)) {
		throw new Error('MWL scenario chapters overlap');
	}
	return chapters;
}

export const MWL_SCENARIO_CHAPTERS = parseScenarioChapters();

export interface MwlScenarioQuest {
	readonly id: string;
	readonly depths: readonly number[];
	readonly rollBase: number;
}

function parseScenarioQuests(): readonly MwlScenarioQuest[] {
	return MWL_TABLE_ROWS('scenarioQuests').map((row) => ({
		id: String(row.id),
		depths: (Array.isArray(row.depths) ? row.depths : []).map((depth) => Number(depth)),
		rollBase: Number(row.rollBase),
	}));
}

export const MWL_SCENARIO_QUESTS = parseScenarioQuests();

export interface MwlQuestDefinition {
	readonly id: string;
	readonly conditionSwitch: string;
	readonly description: string;
}

function parseQuestDefinitions(): readonly MwlQuestDefinition[] {
	return MWL_TABLE_ROWS('questDefinitions').map((row) => ({
		id: String(row.quest),
		conditionSwitch: String(row.conditionSwitch),
		description: String(row.description),
	}));
}

export const MWL_QUEST_DEFINITIONS = parseQuestDefinitions();

export interface MwlProgressionRules {
	readonly maxLevel: number;
	readonly experienceNumerator: number;
	readonly experienceDivisor: number;
	readonly experienceOffset: number;
}

function parseProgressionRules(): MwlProgressionRules {
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === 'heroProgression');
	if (!trait) throw new Error('MWL hero progression rules are missing');
	const effect = (id: string) => trait.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === id)?.attributes.set;
	const maxLevel = Number(effect('max_level'));
	const formula = (effect('experience_formula') ?? '').split('|').map(Number);
	if (!Number.isInteger(maxLevel) || maxLevel < 1 || formula.length !== 3 || formula.some((value) => !Number.isFinite(value) || value === 0)) {
		throw new Error('Invalid MWL hero progression rules');
	}
	return { maxLevel, experienceNumerator: formula[0]!, experienceDivisor: formula[1]!, experienceOffset: formula[2]! };
}

export const MWL_PROGRESSION = parseProgressionRules();

export interface MwlCurseDefinition {
	readonly id: string;
	readonly type: 'weapon' | 'armor';
	readonly locks: boolean;
	readonly nameKey: string;
	readonly descriptionKey: string;
}

function parseCurseDefinitions(): readonly MwlCurseDefinition[] {
	return MWL_TABLE_ROWS('curseDefinitions').map((row) => ({
		id: String(row.curse),
		type: String(row.type) as 'weapon' | 'armor',
		locks: row.locks === true,
		nameKey: String(row.nameKey),
		descriptionKey: String(row.descriptionKey),
	}));
}

export const MWL_CURSE_DEFINITIONS = parseCurseDefinitions();

export type MwlAffixTrigger = 'strike' | 'defend' | 'passive';

function isMwlAffixTrigger(value: string | undefined): value is MwlAffixTrigger {
	return value === 'strike' || value === 'defend' || value === 'passive';
}

export interface MwlAffixDefinition {
	readonly id: string;
	readonly trigger: MwlAffixTrigger;
	readonly weight: number;
	/** A curse both restricts a generated roll to the curse pool and locks the item once identified. */
	readonly curse: boolean;
	readonly description: string;
}

/**
 * Weapon enchantments (`Weapon.java`'s `enchantments`) and armor glyphs (`Armor.java`'s `glyphs`)
 * as `mwg/actors` affix data, authored as MWG typed MWL tables (`src/content/affix-rules.mwl`), so
 * the framework validates column shape and coerces every cell and this module only narrows the
 * `trigger` column to the three real routes. Real Java ties each id to its own `Enchantment`/
 * `Glyph` subclass; this port authors the shared routing metadata and interprets the id itself
 * when the trigger fires, so the proc bodies stay in `main.ts`.
 */
function affixRows(tableId: string): readonly MwlAffixDefinition[] {
	return MWL_TABLE_ROWS(tableId).map((row) => {
		const trigger = String(row.trigger);
		if (!isMwlAffixTrigger(trigger)) throw new Error(`MWL ${tableId} row has an invalid trigger: ${String(row.id)}`);
		return { id: String(row.id), trigger, weight: Number(row.weight), curse: row.curse === true, description: String(row.description) };
	});
}

export const MWL_WEAPON_ENCHANTS = affixRows('weaponEnchants');
export const MWL_ARMOR_GLYPHS = affixRows('armorGlyphs');

/** `Unstable.randomEnchants`: the enchantments `Unstable` may delegate a swing to. Read from the
 * table-unique rows' `enchant` column (keyed, so a twice-listed delegate fails the build), still
 * validated against the weapon-enchant domain table. */
export const MWL_UNSTABLE_DELEGATES: readonly string[] = (() => {
	const known = new Set(MWL_WEAPON_ENCHANTS.map((definition) => definition.id));
	const ids = MWL_TABLE_ROWS('unstableEnchants', 'enchant').map((row) => String(row.enchant));
	for (const id of ids) {
		if (!known.has(id)) throw new Error(`MWL Unstable delegate references unknown enchantment: ${id}`);
	}
	return ids;
})();

function requiredClassValue(values: Readonly<Record<string, string>>, key: string): string {
	const value = values[key];
	if (value === undefined) throw new Error(`MWL class definition is missing ${key}`);
	return value;
}

/** Class metadata is authored as MWL traits and adapted here to the scene's typed class kit. */
export const MWL_CLASSES = gameData.roots
	.filter((node) => node.tag === 'trait')
	.map((node) => {
		const values = Object.fromEntries(
			node.children
				.filter((child) => child.tag === 'effect' && child.attributes.apply_to)
			.map((child) => {
				const attributes = child.attributes as Readonly<Record<string, string>>;
		return [attributes.apply_to, attributes.set ?? attributes.add ?? ''];
			}),
		);
		const number = (key: string): number => Number(requiredClassValue(values, key));
		const ammo = requiredClassValue(values, 'special_ammo');
		return {
			id: requiredClassValue(node.attributes, 'id'),
			nameKey: requiredClassValue(node.attributes, 'name'),
			weaponKey: requiredClassValue(values, 'weapon_key'),
			damage: [number('damage_min'), number('damage_max')] as [number, number],
			speed: number('speed'),
			accuracy: number('accuracy'),
			blurbKey: requiredClassValue(values, 'blurb_key'),
			unlocked: requiredClassValue(values, 'unlocked') === 'true',
			ammo: requiredClassValue(values, 'ammo') === 'true',
			badge: requiredClassValue(values, 'badge') === 'null' ? null : requiredClassValue(values, 'badge'),
			unlockHint: requiredClassValue(values, 'unlock_hint'),
			special: {
				kind: requiredClassValue(values, 'special_kind') as 'throw' | 'zap' | 'shoot' | 'none',
				sourceClass: values.special_source_class,
				labelKey: requiredClassValue(values, 'special_label_key'),
				ammo: ammo === 'null' ? null : Number(ammo),
				damage: [number('special_damage_min'), number('special_damage_max')] as [number, number],
			},
		};
	});

/** Hero.java's shared starting values (`Hero.initHero` and `Hero` field defaults), authored
 * alongside the class catalogue so scene initialization and save migration use one source. */
export interface MwlHeroBaseStats {
	readonly hp: number;
	readonly maxHp: number;
	readonly strength: number;
	readonly attackSkill: number;
	readonly defenseSkill: number;
	readonly baseEvasion: number;
	readonly baseGold: number;
}
export const MWL_HERO_BASE_STATS: MwlHeroBaseStats = (() => {
	const row = MWL_TABLE_ROWS('heroBaseStats', 'id').find((candidate) => String(candidate.id) === 'spdHero');
	if (!row) throw new Error('MWL hero base stats are missing');
	return {
		hp: Number(row.hp), maxHp: Number(row.max_hp), strength: Number(row.strength),
		attackSkill: Number(row.attack_skill), defenseSkill: Number(row.defense_skill),
		baseEvasion: Number(row.base_evasion), baseGold: Number(row.base_gold),
	};
})();

/** Hero.java's level-up increments, kept separate from the starting row because the executable
 * level-up transition applies them once per gained level. */
export const MWL_HERO_LEVEL_GROWTH = (() => {
	const row = MWL_TABLE_ROWS('heroLevelGrowth', 'id').find((candidate) => String(candidate.id) === 'spdHeroLevelGrowth');
	if (!row) throw new Error('MWL hero level growth is missing');
	return {
		hpPerLevel: Number(row.hp_per_level),
		attackSkillPerLevel: Number(row.attack_skill_per_level),
		defenseSkillPerLevel: Number(row.defense_skill_per_level),
	};
})();

export const MWL_TURN_CLOCK = MWL_CONTENT.turnClocks.find((clock) => clock.id === 'spdAdventureClock') ?? {
  id: 'spdAdventureClock',
  tick: 1,
  hunger: 10,
};
