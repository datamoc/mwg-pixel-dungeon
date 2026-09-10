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

/** `actors.mobs.*` - the port's roster against SPD's own class names */
export const MOB_KEYS: Record<string, string> = {
	rat: 'actors.mobs.rat.name',
	snake: 'actors.mobs.snake.name',
	gnoll: 'actors.mobs.gnoll.name',
	swarm: 'actors.mobs.swarm.name',
	crab: 'actors.mobs.crab.name',
	slime: 'actors.mobs.slime.name',
	goo: 'actors.mobs.goo.name',
	skeleton: 'actors.mobs.skeleton.name',
	thief: 'actors.mobs.thief.name',
	dm100: 'actors.mobs.dm100.name',
	guard: 'actors.mobs.guard.name',
	necromancer: 'actors.mobs.necromancer.name',
	tengu: 'actors.mobs.tengu.name',
	fetidRat: 'actors.mobs.fetidrat.name',
	gnollTrickster: 'actors.mobs.gnolltrickster.name',
	greatCrab: 'actors.mobs.greatcrab.name',
	bat: 'actors.mobs.bat.name',
	brute: 'actors.mobs.brute.name',
	shaman: 'actors.mobs.shaman.name',
	spinner: 'actors.mobs.spinner.name',
	dm200: 'actors.mobs.dm200.name',
	dm300: 'actors.mobs.dm300.name',
	necroSkeleton: 'actors.mobs.necromancer$necroskeleton.name',
	ghost: 'actors.mobs.npcs.ghost.name',
	wandmaker: 'actors.mobs.npcs.wandmaker.name',
	shopkeeper: 'actors.mobs.npcs.shopkeeper.name',
	blacksmith: 'actors.mobs.npcs.blacksmith.name',
	imp: 'actors.mobs.npcs.imp.name',
	ghoul: 'actors.mobs.ghoul.name',
	//SPD has five elementals; this port models only the fire one
	elemental: 'actors.mobs.elemental$fireelemental.name',
	newbornElemental: 'actors.mobs.elemental$newbornfireelemental.name',
	warlock: 'actors.mobs.warlock.name',
	monk: 'actors.mobs.monk.name',
	golem: 'actors.mobs.golem.name',
	succubus: 'actors.mobs.succubus.name',
	eye: 'actors.mobs.eye.name',
	scorpio: 'actors.mobs.scorpio.name',
	king: 'actors.mobs.dwarfking.name',
	yog: 'actors.mobs.yogdzewa.name',
	//SPD has five fists; the port spawns one generic add, named after the rotting one
	yogFist: 'actors.mobs.yogfist$rottingfist.name',
	demonSpawner: 'actors.mobs.demonspawner.name',
	ripperDemon: 'actors.mobs.ripperdemon.name',
	albino: 'actors.mobs.albino.name',
	causticSlime: 'actors.mobs.causticslime.name',
	bandit: 'actors.mobs.bandit.name',
	spectralNecromancer: 'actors.mobs.spectralnecromancer.name',
	armoredBrute: 'actors.mobs.armoredbrute.name',
	dm201: 'actors.mobs.dm201.name',
	senior: 'actors.mobs.senior.name',
	acidic: 'actors.mobs.acidic.name',
	mimic: 'actors.mobs.mimic.name',
	sentry: 'levels.rooms.special.sentryroom$sentry.name',
	rotHeart: 'actors.mobs.rotheart.name',
	rotLasher: 'actors.mobs.rotlasher.name',
	ratKing: 'actors.mobs.npcs.ratking.name',
	crystalMimic: 'items.heap.crystal_chest',
	piranha: 'actors.mobs.piranha.name',
	bee: 'actors.mobs.bee.name',
	statue: 'actors.mobs.statue.name',
};

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

/** the ground-item kinds this port drops, against SPD's real item names */
export const GROUND_ITEM_KEYS: Record<string, string> = {
	dewdrop: 'items.dewdrop.name',
	stone: 'items.weapon.missiles.throwingstone.name',
	potion: 'port.name.potion',
	scroll: 'port.name.scroll',
	meat: 'items.food.mysterymeat.name',
	gold: 'items.gold.name',
	armor: 'items.armor.clotharmor.name',
	wand: 'items.wands.wandofmagicmissile.name',
	food: 'items.food.food.name',
	seed: 'plants.plant$seed$placeholder.name',
	darkGold: 'items.quest.darkgold.name',
	dwarfToken: 'items.quest.dwarftoken.name',
	amulet: 'items.amulet.name',
	ring: 'port.name.ring',
	crystalKey: 'items.keys.crystalkey.name',
	goldenKey: 'items.keys.goldenkey.name',
	bomb: 'items.bombs.bomb.name',
	corpseDust: 'items.quest.corpsedust.name',
	//Wandmaker type-2 ritual props (both catalog keys verified present)
	candle: 'items.quest.ceremonialcandle.name',
	embers: 'items.quest.embers.name',
};

/** the bag's item ids, against SPD's real item names */
export const ITEM_KEYS: Record<string, string> = {
	clothArmor: 'items.armor.clotharmor.name',
	armor: 'items.armor.clotharmor.name',
	armorReward: 'items.armor.clotharmor.name',
	weaponReward: 'port.name.questweapon',
	wand: 'port.name.wand',
	food: 'items.food.food.name',
	meat: 'items.food.mysterymeat.name',
	velvetPouch: 'items.bags.velvetpouch.name',
	waterskin: 'items.waterskin.name',
	gold: 'items.gold.name',
	darkGold: 'items.quest.darkgold.name',
	dwarfToken: 'items.quest.dwarftoken.name',
	ironKey: 'items.keys.ironkey.name',
	crystalKey: 'items.keys.crystalkey.name',
	goldenKey: 'items.keys.goldenkey.name',
	amulet: 'items.amulet.name',
	pickaxe: 'items.quest.pickaxe.name',
	stone: 'items.weapon.missiles.throwingstone.name',
	knife: 'items.weapon.missiles.throwingknife.name',
	spike: 'items.weapon.missiles.throwingspike.name',
	potion: 'port.name.potion',
	potionHealing: 'items.potions.potionofhealing.name',
	potionStrength: 'items.potions.potionofstrength.name',
	potionFlame: 'items.potions.potionofliquidflame.name',
	potionMindVision: 'items.potions.potionofmindvision.name',
	potionInvis: 'items.potions.potionofinvisibility.name',
	potionPurity: 'items.potions.potionofpurity.name',
	potionLevitation: 'items.potions.potionoflevitation.name',
	scroll: 'port.name.scroll',
	scrollIdentify: 'items.scrolls.scrollofidentify.name',
	scrollUpgrade: 'items.scrolls.scrollofupgrade.name',
	scrollRage: 'items.scrolls.scrollofrage.name',
	scrollLullaby: 'items.scrolls.scrolloflullaby.name',
	scrollMapping: 'items.scrolls.scrollofmagicmapping.name',
	scrollMirror: 'items.scrolls.scrollofmirrorimage.name',
	scrollCleanse: 'items.scrolls.scrollofremovecurse.name',
	scrollRecharging: 'items.scrolls.scrollofrecharging.name',
	scrollTeleportation: 'items.scrolls.scrollofteleportation.name',
	scrollTerror: 'items.scrolls.scrollofterror.name',
	scrollRetribution: 'items.scrolls.scrollofretribution.name',
	bomb: 'items.bombs.bomb.name',
	corpseDust: 'items.quest.corpsedust.name',
	stoneOfAugmentation: 'items.stones.stoneofaugmentation.name',
	stoneOfFear: 'items.stones.stoneoffear.name',
	stoneOfDeepSleep: 'items.stones.stoneofdeepsleep.name',
	stoneOfShock: 'items.stones.stoneofshock.name',
	stoneOfBlast: 'items.stones.stoneofblast.name',
	stoneOfBlink: 'items.stones.stoneofblink.name',
	stoneOfClairvoyance: 'items.stones.stoneofclairvoyance.name',
	stoneOfEnchantment: 'items.stones.stoneofenchantment.name',
	stoneOfIntuition: 'items.stones.stoneofintuition.name',
	//The generated catalog carries no `stoneofdetectmagic` keys at all (it even holds a
	//phantom `stoneofdisarming` set instead - a catalog-generation gap, not a Java one),
	//so this one name resolves through the port's own strings, sourced verbatim from Java.
	stoneOfDetectMagic: 'port.name.stoneOfDetectMagic',
	candle: 'items.quest.ceremonialcandle.name',
	embers: 'items.quest.embers.name',
};

/** `items.rings.*` */
export const RING_KEYS: Record<string, string> = {
	accuracy: 'items.rings.ringofaccuracy.name',
	evasion: 'items.rings.ringofevasion.name',
	might: 'items.rings.ringofmight.name',
	tenacity: 'items.rings.ringoftenacity.name',
	haste: 'items.rings.ringofhaste.name',
	energy: 'items.rings.ringofenergy.name',
};

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
export const POTION_APPEARANCE_KEYS: readonly string[] = [
	'items.potions.potion.turquoise',
	'items.potions.potion.crimson',
	'items.potions.potion.azure',
	'items.potions.potion.jade',
	'items.potions.potion.golden',
	'items.potions.potion.magenta',
	'items.potions.potion.charcoal',
	'items.potions.potion.ivory',
	'items.potions.potion.amber',
	'items.potions.potion.bistre',
	'items.potions.potion.indigo',
	'items.potions.potion.silver',
];

export const SCROLL_APPEARANCE_KEYS: readonly string[] = [
	'items.scrolls.scroll.kaunan',
	'items.scrolls.scroll.sowilo',
	'items.scrolls.scroll.laguz',
	'items.scrolls.scroll.yngvi',
	'items.scrolls.scroll.gyfu',
	'items.scrolls.scroll.raido',
	'items.scrolls.scroll.isaz',
	'items.scrolls.scroll.mannaz',
	'items.scrolls.scroll.naudiz',
	'items.scrolls.scroll.berkanan',
	'items.scrolls.scroll.odal',
	'items.scrolls.scroll.tiwaz',
];
