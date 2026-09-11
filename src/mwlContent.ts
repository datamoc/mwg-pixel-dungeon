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
 * MWG 0.7.2 typed MWL tables: `[table] columns=...` with `[row]` children. The framework validates
 * each column's shape and coerces every cell (`coerceTableValue`), so this port no longer
 * hand-splits `set=` positional rows or re-checks cell types - it only narrows the few columns
 * whose values are a closed set (a trigger name, a roster of ids). Every authored table below is
 * authored this way; `MWL_TABLE` is the single reader.
 */
const MWL_TABLES = new Map(MWL_CONTENT.tables.map((table) => [table.id, table]));

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

export interface MwlMissileDefinition {
	readonly id: string;
	readonly sourceClass: string;
	readonly tier: number;
	readonly minDamage: number;
	readonly maxDamage: number;
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
	}));
}

export const MWL_MISSILE_DEFINITIONS = parseMissileDefinitions();
export const MWL_MISSILE_BY_CLASS = new Map(MWL_MISSILE_DEFINITIONS.map((definition) => [definition.sourceClass, definition]));

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
		id: String(row.id),
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
		id: String(row.id),
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

/** `Unstable.randomEnchants`: the enchantments `Unstable` may delegate a swing to. */
export const MWL_UNSTABLE_DELEGATES: readonly string[] = (() => {
	const known = new Set(MWL_WEAPON_ENCHANTS.map((definition) => definition.id));
	const ids = MWL_TABLE_ROWS('unstableEnchants').map((row) => String(row.id));
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
				labelKey: requiredClassValue(values, 'special_label_key'),
				ammo: ammo === 'null' ? null : Number(ammo),
				damage: [number('special_damage_min'), number('special_damage_max')] as [number, number],
			},
		};
	});

export const MWL_TURN_CLOCK = MWL_CONTENT.turnClocks.find((clock) => clock.id === 'spdAdventureClock') ?? {
  id: 'spdAdventureClock',
  tick: 1,
  hunger: 10,
};
