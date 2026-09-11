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

/** Reads a table's rows and rejects duplicate ids - MWG validates cell shape, not row uniqueness. */
export function MWL_TABLE_ROWS(id: string): readonly Readonly<Record<string, unknown>>[] {
	const rows = MWL_TABLE(id).rows;
	if (new Set(rows.map((row) => String(row.id))).size !== rows.length) throw new Error(`MWL table ${id} contains duplicate ids`);
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
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === 'missileDefinitions');
	if (!trait) return [];
	const effect = trait.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	return (effect?.attributes.set ?? '').split(';').filter(Boolean).map((entry) => {
		const [id, sourceClass, tier, minDamage, maxDamage] = entry.split('|');
		const values = [tier, minDamage, maxDamage].map(Number);
		if (!id || !sourceClass || values.some((value) => !Number.isFinite(value))) {
			throw new Error(`MWL missile definition is invalid: ${entry}`);
		}
		return { id, sourceClass, tier: values[0]!, minDamage: values[1]!, maxDamage: values[2]! };
	});
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
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === 'scenarioChapters');
	if (!trait) throw new Error('MWL scenario chapters are missing');
	const effect = trait.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	if (!effect?.attributes.set) throw new Error('MWL scenario chapters are missing entries');
	const chapters = effect.attributes.set.split(';').filter(Boolean).map((entry) => {
		const [id, firstDepth, bossDepth, bossKind] = entry.split('|');
		if (!id || !bossKind || !Number.isInteger(Number(firstDepth)) || !Number.isInteger(Number(bossDepth))) {
			throw new Error(`Invalid MWL scenario chapter: ${entry}`);
		}
		return { id, firstDepth: Number(firstDepth), bossDepth: Number(bossDepth), bossKind };
	});
	if (new Set(chapters.map((chapter) => chapter.id)).size !== chapters.length) throw new Error('MWL scenario chapters contain duplicate ids');
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
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === 'scenarioQuests');
	if (!trait) throw new Error('MWL scenario quests are missing');
	const effect = trait.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	if (!effect?.attributes.set) throw new Error('MWL scenario quests are missing entries');
	const quests = effect.attributes.set.split(';').filter(Boolean).map((entry) => {
		const [id, depthList, rollBase] = entry.split('|');
		const depths = (depthList ?? '').split(',').map(Number);
		if (!id || depths.length === 0 || depths.some((depth) => !Number.isInteger(depth)) || !Number.isInteger(Number(rollBase))) {
			throw new Error(`Invalid MWL scenario quest: ${entry}`);
		}
		return { id, depths, rollBase: Number(rollBase) };
	});
	if (new Set(quests.map((quest) => quest.id)).size !== quests.length) throw new Error('MWL scenario quests contain duplicate ids');
	return quests;
}

export const MWL_SCENARIO_QUESTS = parseScenarioQuests();

export interface MwlQuestDefinition {
	readonly id: string;
	readonly conditionSwitch: string;
	readonly description: string;
}

function parseQuestDefinitions(): readonly MwlQuestDefinition[] {
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === 'questDefinitions');
	if (!trait) throw new Error('MWL quest definitions are missing');
	const effect = trait.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	if (!effect?.attributes.set) throw new Error('MWL quest definitions are missing entries');
	const definitions = effect.attributes.set.split(';').filter(Boolean).map((entry) => {
		const [id, conditionSwitch, ...descriptionParts] = entry.split('|');
		const description = descriptionParts.join('|');
		if (!id || !conditionSwitch || !description) throw new Error(`Invalid MWL quest definition: ${entry}`);
		return { id, conditionSwitch, description };
	});
	if (new Set(definitions.map((definition) => definition.id)).size !== definitions.length) throw new Error('MWL quest definitions contain duplicate ids');
	return definitions;
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
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === 'curseDefinitions');
	if (!trait) throw new Error('MWL curse definitions are missing');
	const effect = trait.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	if (!effect?.attributes.set) throw new Error('MWL curse definitions are missing entries');
	const definitions = effect.attributes.set.split(';').filter(Boolean).map((entry) => {
		const [id, type, locks, nameKey, descriptionKey] = entry.split('|');
		if (!id || (type !== 'weapon' && type !== 'armor') || (locks !== 'true' && locks !== 'false') || !nameKey || !descriptionKey) {
			throw new Error(`Invalid MWL curse definition: ${entry}`);
		}
		return { id, type, locks: locks === 'true', nameKey, descriptionKey } as const;
	});
	if (new Set(definitions.map((definition) => definition.id)).size !== definitions.length) {
		throw new Error('MWL curse definitions contain duplicate ids');
	}
	return definitions;
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
