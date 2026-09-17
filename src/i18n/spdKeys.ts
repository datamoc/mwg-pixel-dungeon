/**
 * Maps this port's own ids onto SPD's real message keys, so every name the player reads comes
 * out of SPD's own translation files.
 *
 * This is where the 18 languages come from for free: a monster, item, class, region, buff or
 * trap name is looked up under the key SPD itself uses, and the generated catalog carries that
 * key in every language SPD ships. Nothing here needs translating by hand.
 *
 * Keys follow `Messages.get`'s convention - the class's package path below
 * `com.shatteredpixel.shatteredpixeldungeon.`, lowercased, plus the local key - so
 * `actors.mobs.rat.name` is `Rat.java`'s `name`. `$` separates a Java inner class, which is
 * why the summoned skeleton is `necromancer$necroskeleton`.
 *
 * Two ids have no SPD key in this checkout's message files and fall back to `port.name.*`
 * instead: the Cleric (a later version than these `.properties`; the class itself came from
 * tag `v3.3.8`) and Berserk (which has status strings but no `.name`).
 */
import { MWL_CONSUMABLE_ITEMS, MWL_GROUND_ITEM_NAME_KEYS, MWL_ITEM_NAME_KEYS, MWL_MISSILE_DEFINITIONS, MWL_MONSTER_NODES, MWL_RING_ITEMS, MWL_WAND_DEFINITIONS, MWL_TRAIT_NODES } from '../mwlContent';
import { ARTIFACTS } from '../items/artifacts';

/** `actors.mobs.*` - authored on each `monsters.mwl` node, derived here so the catalogue cannot
 * drift from the roster. SPD has five elementals; this port models only the fire one, and five
 * fists; the port spawns one generic add, named after the rotting one - both choices live on
 * the MWL rows themselves. */
export const MOB_KEYS: Record<string, string> = Object.fromEntries(
	MWL_MONSTER_NODES.map((node) => [node.attributes.id, node.attributes.name]),
);


/** `actors.hero.heroclass.*`; the Cleric postdates this checkout's message files */
export const CLASS_KEYS: Record<string, string> = {
	warrior: 'actors.hero.heroclass.warrior',
	mage: 'actors.hero.heroclass.mage',
	rogue: 'actors.hero.heroclass.rogue',
	huntress: 'actors.hero.heroclass.huntress',
	duelist: 'actors.hero.heroclass.duelist',
	cleric: 'port.name.cleric',
};

/** `journal.document.intros.*.title` - SPD names its regions in the guidebook's intro pages */
export const REGION_KEYS: Record<string, string> = {
	sewers: 'journal.document.intros.sewers.title',
	prison: 'journal.document.intros.prison.title',
	caves: 'journal.document.intros.caves.title',
	city: 'journal.document.intros.city.title',
	halls: 'journal.document.intros.halls.title',
};

/** Ground-item names are authored in MWL, keyed by the render/interaction family. */
export const GROUND_ITEM_KEYS: Record<string, string> = { ...MWL_GROUND_ITEM_NAME_KEYS };

/** Consumable names and runtime-only item aliases are authored in MWL. */
export const ITEM_KEYS: Record<string, string> = {
	...MWL_ITEM_NAME_KEYS,
	...Object.fromEntries(MWL_CONSUMABLE_ITEMS.map((item) => [item.id, item.name])),
	//`artifacts.mwl`'s two real, live-implemented artifacts (Cloak of Shadows -> 'cloak',
	//Timekeeper's Hourglass -> 'hourglass'). Found missing live: `itemDisplayName`'s
	//`ITEM_KEYS[id] ?? id` fallback meant an identified/unidentified cloak or hourglass rendered
	//as the bare id text ("cloak"/"hourglass") instead of its real SPD name - neither id had ever
	//had an entry here at all.
	...Object.fromEntries(ARTIFACTS.map((artifact) => [artifact.id, artifact.nameKey])),
	//`MwlMissileDefinition` carries only combat metadata (see `mwlContent.ts`), no `.name` -
	//derived here from `sourceClass` the same way Java's own `Messages.get(Class, "name")`
	//bundle-key convention does, rather than hand-listing the 15 (found missing live: the
	//Blacksmith's smith reward rendered a bare `missile_kunai` instead of "kunai").
	//`TippedDart` is the exception: its name lives under `darts.dart`, not `tippeddart`.
	...Object.fromEntries(MWL_MISSILE_DEFINITIONS.map((def) => [def.id, def.sourceClass === 'TippedDart' ? 'items.weapon.missiles.darts.dart.name' : `items.weapon.missiles.${def.sourceClass.toLowerCase()}.name`])),
};

/** `items.rings.*`, derived from the MWL item catalogue. */
export const RING_KEYS: Record<string, string> = Object.fromEntries(MWL_RING_ITEMS.map((item) => [item.id.replace(/^ring/, '').toLowerCase(), item.name]));

/**
 * `items/wands/*.java`, by this port's `wandType` id. An identified wand used to fall through to
 * `ITEM_KEYS.wand`, a single generic `port.name.wand` ("wand"), so every class displayed the same
 * unidentified word; `itemDisplayName` now reads the real class name from here. The ground-item
 * table no longer claims every dropped wand is the Magic Missile one either - those call sites
 * have no class to read.
 */
export const WAND_KEYS: Record<string, string> = Object.fromEntries(MWL_WAND_DEFINITIONS.map((definition) => [definition.type, definition.name]));

/** `actors.buffs.*`; Berserk carries status strings but no `.name` of its own */
export const BUFF_KEYS: Record<string, string> = {
	bless: 'actors.buffs.bless.name',
	hex: 'actors.buffs.hex.name',
	daze: 'actors.buffs.daze.name',
	fury: 'actors.buffs.fury.name',
	berserk: 'port.name.berserk',
	weakness: 'actors.buffs.weakness.name',
	vulnerable: 'actors.buffs.vulnerable.name',
	burning: 'actors.buffs.burning.name',
	poison: 'actors.buffs.poison.name',
	ooze: 'actors.buffs.ooze.name',
	cripple: 'actors.buffs.cripple.name',
	degrade: 'actors.buffs.degrade.name',
	cloak: 'actors.buffs.invisibility.name',
	focus: 'actors.mobs.monk$focus.name',
};

/** `levels.traps.*` */
export const TRAP_KEYS: Record<string, string> = {
	toxic: 'levels.traps.toxictrap.name',
	burning: 'levels.traps.burningtrap.name',
	poisonDart: 'levels.traps.poisondarttrap.name',
	grim: 'levels.traps.grimtrap.name',
	explosive: 'levels.traps.explosivetrap.name',
};

/**
 * SPD's real unidentified appearances, replacing the labels this port had invented.
 *
 * SPD names an unknown potion by colour and an unknown scroll by rune, and both phrases are
 * translated in every language - where the port's own "ruby"/"rune-covered" labels were
 * untranslatable English. The keys hold the whole phrase ("turquoise potion", "scroll of
 * KAUNAN"), not just the adjective, because that is how SPD stores them and how a language
 * with different word order needs them.
 *
 * Still simplified: SPD shuffles which appearance maps to which item per run, and this port
 * assigns them from its own seeded table (see `APPEARANCE_TABLES`).
 */
function appearanceKeys(id: string): readonly string[] {
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === id);
	const effect = trait?.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'keys');
	const keys = effect?.attributes.set?.split(',').map((key) => key.trim()).filter(Boolean);
	if (!keys?.length) throw new Error(`MWL appearance table is missing ${id}`);
	return keys;
}

export const POTION_APPEARANCE_KEYS = appearanceKeys('potionAppearances');
export const SCROLL_APPEARANCE_KEYS = appearanceKeys('scrollAppearances');
