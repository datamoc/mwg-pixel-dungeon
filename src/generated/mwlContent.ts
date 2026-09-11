export const gameData = {
	"schema": "0.1",
	"roots": [
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "actorFlags",
						"name": "Mob.actorFlags"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "flying",
								"set": "bat,bee,elemental,newbornElemental,eye,swarm,ghost"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "npc",
								"set": "ghost,wandmaker,shopkeeper,blacksmith,imp,ratKing"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "boss",
								"set": "goo,tengu,dm300,king,yog,yogFist"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 15,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "immovable",
								"set": "dm201,sentry,rotHeart,rotLasher,pylon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 19,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "never_sleeps",
								"set": "fetidRat,gnollTrickster,greatCrab,demonSpawner,sentry,rotHeart,rotLasher,newbornElemental,pylon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 23,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_aliases",
								"set": "albino|rat;causticSlime|slime;bandit|thief;spectralNecromancer|necromancer;armoredBrute|brute;dm201|dm200;senior|monk;acidic|scorpio;crystalMimic|mimic;armoredStatue|statue;pylon|pylon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 27,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "monsterAiProfiles",
						"name": "Mob.aiProfiles"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "dm100|dm100;shaman|shaman;necromancer|necromancer;spectralNecromancer|necromancer;tengu|tengu;dm300|dm300;yog|yog;warlock|warlock;elemental|elemental;newbornElemental|newbornElemental;yogFist|yogFist;scorpio|scorpio;acidic|scorpio;guard|guard;dm200|dm200;dm201|dm201;spinner|spinner;golem|golem;eye|eye;gnollTrickster|gnollTrickster;greatCrab|greatCrab"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 36,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 33,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "hookManifest",
						"name": "Runtime.hooks"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "ai_profiles",
								"set": "dm100,shaman,necromancer,tengu,dm300,yog,warlock,elemental,newbornElemental,yogFist,scorpio,guard,dm200,dm201,spinner,golem,eye,gnollTrickster,greatCrab"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 45,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 42,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "weaponEnchants",
						"name": "Weapon.enchantments"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "blazing|strike|3|false|Ignites the victim;chilling|strike|3|false|Chills the victim;shocking|strike|3|false|+2 damage;vampiric|strike|2|false|Heals 1 on a hit;grim|strike|2|false|Chance of bonus damage against a weakened foe;lucky|strike|2|false|Chance of bonus loot on a kill;blocking|strike|2|false|Chance to grant a shield on a landed hit;kinetic|strike|2|false|Stores part of damage for the next hit;corrupting|strike|2|false|Lethal hits can convert the victim into an ally;elastic|strike|2|false|Chance to knock the victim backward;projecting|strike|2|false|Extends melee reach;blooming|strike|2|false|Chance to plant grass where you strike;unstable|strike|2|false|A random enchantment effect on every hit;wayward|strike|1|true|Cursed: -3 accuracy;annoying|strike|1|true|Cursed: chance to alert every monster on the floor;dazzling|strike|1|true|Cursed: chance to blind everyone nearby, including you;explosive|strike|1|true|Cursed: eventually detonates on its wielder;polarized|strike|1|true|Cursed: every other hit is amplified, the rest whiff entirely;sacrificial|strike|1|true|Cursed: chance to wound its wielder;displacing|strike|1|true|Cursed: chance to teleport the struck target away"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "armorGlyphs",
						"name": "Armor.glyphs"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "stone|defend|3|false|+2 armor;thorns|defend|3|false|Reflects 2;flow|passive|3|false|Moves faster in water;entanglement|defend|2|false|Chance to root an attacker;swiftness|passive|3|false|Faster movement when safe (20% speed increase);potential|defend|3|false|Chance to recharge wands when hit;repulsion|defend|2|false|Chance to knock an adjacent attacker backward;brimstone|defend|2|false|Immune to burning;viscosity|defend|3|false|Defers part of incoming damage;affection|defend|1|false|Charms an attacker;antimagic|defend|1|false|Reduces magical damage;obfuscation|passive|3|false|Makes the wearer harder to detect;camouflage|passive|2|false|Trampling grass turns you invisible;stench|defend|1|true|Cursed: chance to release toxic gas when hit;antientropy|defend|1|true|Cursed: chance to drain a wand charge;bulk|passive|1|true|Cursed: slower through doorways;corrosion|defend|1|true|Cursed: chance to corrode a weapon or armor level;displacement|defend|1|true|Cursed: chance to teleport its wearer away;metabolism|defend|1|true|Cursed: consumes extra hunger;multiplicity|defend|1|true|Cursed: chance to summon a spectral copy of the attacker;overgrowth|defend|1|true|Cursed: chance to root its wearer in grass"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 13,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "unstableEnchants",
						"name": "Unstable.randomEnchants"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "ids",
								"set": "blazing,blocking,blooming,chilling,corrupting,kinetic,grim,lucky,shocking,vampiric"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 25,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 22,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "alchemyEnergy",
						"name": "Item.energyVal"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "seed|2;stone|3;scroll|6;potion|6;food|6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "alchemyRecipes",
						"name": "Recipe"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "stewedMeat1|meat:1|stewedMeat|1|1;stewedMeat2|meat:2|stewedMeat|2|2;stewedMeat3|meat:3|stewedMeat|3|2;meatPie|pasty:1,food:1,meat:1|meatPie|1|6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 13,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "alchemyRecipeManifest",
						"name": "Recipe.all"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "liquidMetal|variable|LiquidMetal.Recipe;scrollToStone|one|Scroll.ScrollToStone;exoticPotion|one|ExoticPotion.PotionToExotic;exoticScroll|one|ExoticScroll.ScrollToExotic;arcaneResin|one|ArcaneResin.Recipe;alchemize|one|Alchemize.Recipe;stewedMeat1|one|StewedMeat.oneMeat;blandfruit|two|Blandfruit.CookFruit;enhanceBomb|two|Bomb.EnhanceBomb;alchemicalCatalyst|two|AlchemicalCatalyst.Recipe;arcaneCatalyst|two|ArcaneCatalyst.Recipe;elixirArcaneArmor|two|ElixirOfArcaneArmor.Recipe;elixirAquaticRejuvenation|two|ElixirOfAquaticRejuvenation.Recipe;elixirDragonsBlood|two|ElixirOfDragonsBlood.Recipe;elixirIcyTouch|two|ElixirOfIcyTouch.Recipe;elixirMight|two|ElixirOfMight.Recipe;elixirHoneyedHealing|two|ElixirOfHoneyedHealing.Recipe;elixirToxicEssence|two|ElixirOfToxicEssence.Recipe;blizzardBrew|two|BlizzardBrew.Recipe;infernalBrew|two|InfernalBrew.Recipe;shockingBrew|two|ShockingBrew.Recipe;causticBrew|two|CausticBrew.Recipe;aquaBlast|two|AquaBlast.Recipe;beaconOfReturning|two|BeaconOfReturning.Recipe;curseInfusion|two|CurseInfusion.Recipe;featherFall|two|FeatherFall.Recipe;magicalInfusion|two|MagicalInfusion.Recipe;phaseShift|two|PhaseShift.Recipe;reclaimTrap|two|ReclaimTrap.Recipe;recycle|two|Recycle.Recipe;wildEnergy|two|WildEnergy.Recipe;telekineticGrab|two|TelekineticGrab.Recipe;summonElemental|two|SummonElemental.Recipe;stewedMeat2|two|StewedMeat.twoMeat;potionSeed|three|Potion.SeedToPotion;stewedMeat3|three|StewedMeat.threeMeat;meatPie|three|MeatPie.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 25,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 22,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "potionAppearances",
						"name": "Potion.appearances"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "keys",
								"set": "items.potions.potion.turquoise,items.potions.potion.crimson,items.potions.potion.azure,items.potions.potion.jade,items.potions.potion.golden,items.potions.potion.magenta,items.potions.potion.charcoal,items.potions.potion.ivory,items.potions.potion.amber,items.potions.potion.bistre,items.potions.potion.indigo,items.potions.potion.silver"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "scrollAppearances",
						"name": "Scroll.appearances"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "keys",
								"set": "items.scrolls.scroll.kaunan,items.scrolls.scroll.sowilo,items.scrolls.scroll.laguz,items.scrolls.scroll.yngvi,items.scrolls.scroll.gyfu,items.scrolls.scroll.raido,items.scrolls.scroll.isaz,items.scrolls.scroll.mannaz,items.scrolls.scroll.naudiz,items.scrolls.scroll.berkanan,items.scrolls.scroll.odal,items.scrolls.scroll.tiwaz"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
								"line": 14,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
						"line": 11,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_cloak",
						"name": "items.artifacts.cloakofshadows.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.cloakofshadows.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 8,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 12,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 20,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_armband",
						"name": "items.artifacts.armbandsofherculaneum.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.armbandsofherculaneum.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 30,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 34,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 38,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 26,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_capstone",
						"name": "items.artifacts.capstoneofexecution.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.capstoneofexecution.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 52,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 56,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 60,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 64,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 48,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_chalice",
						"name": "items.artifacts.chaliceofblood.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.chaliceofblood.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 74,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 78,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 82,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 86,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 70,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_chronometer",
						"name": "items.artifacts.timekeeperhourglass.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.timekeeperhourglass.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 96,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 100,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 104,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 108,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 92,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_dragonslayer",
						"name": "items.artifacts.demonslayerarmor.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.demonslayerarmor.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 118,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 122,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 126,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 130,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 114,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_emerald",
						"name": "items.artifacts.pickaxeofmining.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.pickaxeofmining.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 140,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 144,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 148,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 152,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 136,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_hourglass",
						"name": "items.artifacts.hourglass.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.hourglass.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 162,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 166,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 170,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 174,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 158,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_locket",
						"name": "items.artifacts.mysteriouslocket.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.mysteriouslocket.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 184,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 188,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 192,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "80"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 196,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 180,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_sandals",
						"name": "items.artifacts.sandalsoftime.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.sandalsoftime.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 206,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "base_charge",
								"set": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 210,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_charge",
								"set": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 214,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "recharge_rate",
								"set": "25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 218,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 202,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "badgeCatalogue",
						"name": "Badges.Badge"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "boss1|boss_goo|1|Slew Goo|15;boss2|boss_tengu|1|Slew Tengu|47;boss3|boss_dm300|1|Slew DM-300|48;boss4|boss_king|1|Slew the Dwarf King|78;victory|amulet|1|Escaped with the Amulet|82;unlock_mage|upgrades_used|1|Used an upgrade scroll|1;unlock_rogue|surprises|10|10 surprise attacks|2;unlock_huntress|throws|10|10 thrown attacks|3;unlock_duelist|weapon_plus2|1|Raised a weapon to +2|4;death_trap|death_trap|1|Died to a trap|81;death_fire|death_fire|1|Died to fire|16;death_poison|death_poison|1|Died to poison|17;death_hunger|death_hunger|1|Starved to death|19;death_foe|death_foe|1|Slain by a foe|104"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "buffDurations",
						"name": "Buff.durations"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "bless|30;hex|30;daze|5;chill|10;frost|10;drowsy|5;magicalSleep|0;fury|9999;berserk|9999;weakness|20;vulnerable|20;burning|3;poison|6;bleeding|0;cripple|4;paralysis|3;roots|3;levitation|20;invisibility|20;cloak|9999;focus|9999;recharging|30;frostImbue|15;adrenalineSurge|200;mindvision|20;terror|20;amok|5;aggression|20;awareness|2;haste|20;degrade|30;ooze|20;charm|10;lethalHasteCooldown|100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "negative",
								"set": "poison,burning,bleeding,cripple,weakness,vulnerable,paralysis,roots,terror,amok,aggression,ooze,charm,degrade,daze,chill,frost,hex"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "warrior",
				"name": "port.name.warrior"
			},
			"children": [
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "weapon_key",
						"set": "port.name.wornshortsword"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_min",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 8,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_max",
						"set": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 12,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "speed",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 16,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "accuracy",
						"set": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 20,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "blurb_key",
						"set": "port.class.warrior.blurb"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 24,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlocked",
						"set": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 28,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "ammo",
						"set": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 32,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "badge",
						"set": "null"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 36,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": ""
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 40,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_kind",
						"set": "throw"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 44,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_label_key",
						"set": "items.weapon.missiles.throwingstone.name"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 48,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_ammo",
						"set": "3"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 52,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_min",
						"set": "2"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 56,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_max",
						"set": "5"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 60,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "mage",
				"name": "port.name.mage"
			},
			"children": [
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "weapon_key",
						"set": "port.name.magesstaff"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 69,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_min",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 73,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_max",
						"set": "6"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 77,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "speed",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 81,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "accuracy",
						"set": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 85,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "blurb_key",
						"set": "port.class.mage.blurb"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 89,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlocked",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 93,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "ammo",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 97,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "badge",
						"set": "unlock_mage"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 101,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "Unlock: use an upgrade scroll."
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 105,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_kind",
						"set": "zap"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 109,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_label_key",
						"set": "items.wands.wandofmagicmissile.name"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 113,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_ammo",
						"set": "null"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 117,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_min",
						"set": "2"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 121,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_max",
						"set": "8"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 125,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 66,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "rogue",
				"name": "port.name.rogue"
			},
			"children": [
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "weapon_key",
						"set": "port.name.dagger"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 134,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_min",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 138,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_max",
						"set": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 142,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "speed",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 146,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "accuracy",
						"set": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 150,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "blurb_key",
						"set": "port.class.rogue.blurb"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 154,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlocked",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 158,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "ammo",
						"set": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 162,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "badge",
						"set": "unlock_rogue"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 166,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "Unlock: land 10 surprise attacks."
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 170,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_kind",
						"set": "throw"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 174,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_label_key",
						"set": "items.weapon.missiles.throwingknife.name"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 178,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_ammo",
						"set": "3"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 182,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_min",
						"set": "2"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 186,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_max",
						"set": "6"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 190,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 131,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "huntress",
				"name": "port.name.huntress"
			},
			"children": [
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "weapon_key",
						"set": "port.name.gloves"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 199,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_min",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 203,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_max",
						"set": "5"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 207,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "speed",
						"set": "2"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 211,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "accuracy",
						"set": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 215,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "blurb_key",
						"set": "port.class.huntress.blurb"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 219,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlocked",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 223,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "ammo",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 227,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "badge",
						"set": "unlock_huntress"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 231,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "Unlock: throw 10 times."
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 235,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_kind",
						"set": "shoot"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 239,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_label_key",
						"set": "items.weapon.spiritbow.name"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 243,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_ammo",
						"set": "null"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 247,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_min",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 251,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_max",
						"set": "6"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 255,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 196,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "duelist",
				"name": "port.name.duelist"
			},
			"children": [
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "weapon_key",
						"set": "port.name.rapier"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 264,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_min",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 268,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_max",
						"set": "8"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 272,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "speed",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 276,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "accuracy",
						"set": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 280,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "blurb_key",
						"set": "port.class.duelist.blurb"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 284,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlocked",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 288,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "ammo",
						"set": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 292,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "badge",
						"set": "unlock_duelist"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 296,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "Unlock: raise a weapon to +2."
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 300,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_kind",
						"set": "throw"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 304,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_label_key",
						"set": "items.weapon.missiles.throwingspike.name"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 308,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_ammo",
						"set": "2"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 312,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_min",
						"set": "2"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 316,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_max",
						"set": "5"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 320,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 261,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "cleric",
				"name": "port.name.cleric"
			},
			"children": [
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "weapon_key",
						"set": "port.name.cudgel"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 329,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_min",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 333,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "damage_max",
						"set": "8"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 337,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "speed",
						"set": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 341,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "accuracy",
						"set": "14"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 345,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "blurb_key",
						"set": "port.class.cleric.blurb"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 349,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlocked",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 353,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "ammo",
						"set": "false"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 357,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "badge",
						"set": "victory"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 361,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "Unlock: win a run."
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 365,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_kind",
						"set": "none"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 369,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_label_key",
						"set": ""
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 373,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_ammo",
						"set": "0"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 377,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_min",
						"set": "0"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 381,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_damage_max",
						"set": "0"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 385,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 326,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "item",
					"attributes": {
						"id": "potionStrength",
						"name": "items.potions.potionofstrength.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionHealing",
						"name": "items.potions.potionofhealing.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 10,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionMindVision",
						"name": "items.potions.potionofmindvision.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 16,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionFrost",
						"name": "items.potions.potionoffrost.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 22,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionFlame",
						"name": "items.potions.potionofliquidflame.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 28,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionToxicGas",
						"name": "items.potions.potionoftoxicgas.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 34,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionHaste",
						"name": "items.potions.potionofhaste.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 40,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionInvis",
						"name": "items.potions.potionofinvisibility.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 46,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionLevitation",
						"name": "items.potions.potionoflevitation.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 52,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionParalyticGas",
						"name": "items.potions.potionofparalyticgas.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 58,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionPurity",
						"name": "items.potions.potionofpurity.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 64,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionExperience",
						"name": "items.potions.potionofexperience.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 70,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollUpgrade",
						"name": "items.scrolls.scrollofupgrade.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 77,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollIdentify",
						"name": "items.scrolls.scrollofidentify.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 83,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollCleanse",
						"name": "items.scrolls.scrollofremovecurse.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 89,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollMirror",
						"name": "items.scrolls.scrollofmirrorimage.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 95,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollRecharging",
						"name": "items.scrolls.scrollofrecharging.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 101,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollTeleportation",
						"name": "items.scrolls.scrollofteleportation.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 107,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollLullaby",
						"name": "items.scrolls.scrolloflullaby.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 113,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollMapping",
						"name": "items.scrolls.scrollofmagicmapping.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 119,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollRage",
						"name": "items.scrolls.scrollofrage.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 125,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollRetribution",
						"name": "items.scrolls.scrollofretribution.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 131,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollTerror",
						"name": "items.scrolls.scrollofterror.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 137,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollTransmutation",
						"name": "items.scrolls.scrolloftransmutation.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 143,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "energyCrystal",
						"name": "items.energycrystal.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 150,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "alchemicalCatalyst",
						"name": "items.potions.alchemicalcatalyst.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 156,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "arcaneCatalyst",
						"name": "items.spells.arcanecatalyst.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 162,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedRotberry",
						"name": "items.seeds.rotberry.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 169,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedSungrass",
						"name": "items.seeds.sungrass.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 175,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedFadeleaf",
						"name": "items.seeds.fadeleaf.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 181,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedIcecap",
						"name": "items.seeds.icecap.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 187,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedFirebloom",
						"name": "items.seeds.firebloom.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 193,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedSorrowmoss",
						"name": "items.seeds.sorrowmoss.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 199,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedSwiftthistle",
						"name": "items.seeds.swiftthistle.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 205,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedBlindweed",
						"name": "items.seeds.blindweed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 211,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedStormvine",
						"name": "items.seeds.stormvine.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 217,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedEarthroot",
						"name": "items.seeds.earthroot.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 223,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedMageroyal",
						"name": "items.seeds.mageroyal.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 229,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedStarflower",
						"name": "items.seeds.starflower.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 235,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stewedMeat",
						"name": "items.food.stewedmeat.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 242,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "meatPie",
						"name": "items.food.meatpie.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 248,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "pasty",
						"name": "items.food.pasty.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 254,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfEnchantment",
						"name": "items.stones.stoneofenchantment.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 261,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfIntuition",
						"name": "items.stones.stoneofintuition.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 267,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfDetectMagic",
						"name": "port.name.stoneofdetectmagic",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 273,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfFlock",
						"name": "items.stones.stoneofflock.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 279,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfShock",
						"name": "items.stones.stoneofshock.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 285,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfBlink",
						"name": "items.stones.stoneofblink.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 291,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfDeepSleep",
						"name": "items.stones.stoneofdeepsleep.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 297,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfClairvoyance",
						"name": "items.stones.stoneofclairvoyance.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 303,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfAggression",
						"name": "items.stones.stoneofaggression.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 309,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfBlast",
						"name": "items.stones.stoneofblast.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 315,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfFear",
						"name": "items.stones.stoneoffear.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 321,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "stoneOfAugmentation",
						"name": "items.stones.stoneofaugmentation.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 327,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "food",
						"name": "items.food.food.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 334,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "meat",
						"name": "items.food.mysterymeat.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 340,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "bomb",
						"name": "items.bombs.bomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 346,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "doubleBomb",
						"name": "items.bombs.doublebomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 352,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "curseDefinitions",
						"name": "ItemCurses"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "wayward|weapon|true|items.weapon.curses.wayward.name|items.weapon.curses.wayward.desc;annoying|weapon|true|items.weapon.curses.annoying.name|items.weapon.curses.annoying.desc;dazzling|weapon|true|items.weapon.curses.dazzling.name|items.weapon.curses.dazzling.desc;displacing|weapon|true|items.weapon.curses.displacing.name|items.weapon.curses.displacing.desc;explosive|weapon|true|items.weapon.curses.explosive.name|items.weapon.curses.explosive.desc;friendly|weapon|true|items.weapon.curses.friendly.name|items.weapon.curses.friendly.desc;polarized|weapon|true|items.weapon.curses.polarized.name|items.weapon.curses.polarized.desc;sacrificial|weapon|true|items.weapon.curses.sacrificial.name|items.weapon.curses.sacrificial.desc;stench|armor|true|items.armor.curses.stench.name|items.armor.curses.stench.desc;antientropy|armor|true|items.armor.curses.antientropy.name|items.armor.curses.antientropy.desc;bulk|armor|true|items.armor.curses.bulk.name|items.armor.curses.bulk.desc;corrosion|armor|true|items.armor.curses.corrosion.name|items.armor.curses.corrosion.desc;displacement|armor|true|items.armor.curses.displacement.name|items.armor.curses.displacement.desc;metabolism|armor|true|items.armor.curses.metabolism.name|items.armor.curses.metabolism.desc;multiplicity|armor|true|items.armor.curses.multiplicity.name|items.armor.curses.multiplicity.desc;overgrowth|armor|true|items.armor.curses.overgrowth.name|items.armor.curses.overgrowth.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "potionDeck",
						"name": "Generator.Category.POTION"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "0,6,4,3,3,3,2,2,2,2,2,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "PotionOfStrength,PotionOfHealing,PotionOfMindVision,PotionOfFrost,PotionOfLiquidFlame,PotionOfToxicGas,PotionOfHaste,PotionOfInvisibility,PotionOfLevitation,PotionOfParalyticGas,PotionOfPurity,PotionOfExperience"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
								"line": 10,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "scrollDeck",
						"name": "Generator.Category.SCROLL"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "0,6,4,3,3,3,2,2,2,2,2,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
								"line": 18,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "ScrollOfUpgrade,ScrollOfIdentify,ScrollOfRemoveCurse,ScrollOfMirrorImage,ScrollOfRecharging,ScrollOfTeleportation,ScrollOfLullaby,ScrollOfMagicMapping,ScrollOfRage,ScrollOfRetribution,ScrollOfTerror,ScrollOfTransmutation"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
								"line": 22,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
						"line": 15,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "monsterRosters",
						"name": "Bestiary.standardMobRotation"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "1|rat,rat,rat,snake;2|rat,rat,snake,gnoll,gnoll;3|rat,snake,gnoll,gnoll,gnoll,swarm,crab;4|gnoll,swarm,crab,crab,slime,slime;6|skeleton,skeleton,skeleton,thief,swarm;7|skeleton,skeleton,skeleton,thief,dm100,guard;8|skeleton,skeleton,thief,dm100,dm100,guard,guard,necromancer;9|skeleton,thief,dm100,dm100,guard,guard,necromancer,necromancer;11|bat,bat,bat,brute,shaman;12|bat,bat,brute,brute,shaman,spinner;13|bat,brute,brute,shaman,shaman,spinner,spinner,dm200;14|bat,brute,shaman,shaman,spinner,spinner,dm200,dm200;16|ghoul,ghoul,ghoul,elemental,warlock;17|ghoul,elemental,elemental,warlock,monk;18|ghoul,elemental,warlock,warlock,monk,monk,golem;19|elemental,warlock,warlock,monk,monk,golem,golem,golem;21|succubus,succubus,eye;22|succubus,eye;23|succubus,eye,eye,scorpio;24|succubus,eye,eye,scorpio,scorpio,scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "fallbacks",
								"set": "sewers|skeleton,thief,dm100,dm100,guard,guard,necromancer,necromancer;caves|bat,brute,shaman,shaman,spinner,spinner,dm200,dm200;city|elemental,warlock,warlock,monk,monk,golem,golem,golem;halls|succubus,eye,eye,scorpio,scorpio,scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "sewerTrapsDepth1",
						"name": "SewerLevel.traps.depth1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "wornDart"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "chances",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "sewerTrapsDefault",
						"name": "SewerLevel.traps.default"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "chilling,shocking,toxic,wornDart,alarm,ooze,confusion,flock,summoning,teleportation,gateway"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 20,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "chances",
								"set": "4,4,4,4,2,2,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 24,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 17,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "regionTrapTables",
						"name": "RegularLevel.trapTables"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "prison|chilling,shocking,toxic,burning,poisonDart,alarm,ooze,gripping,confusion,flock,summoning,teleportation,gateway,geyser|4,4,4,4,4,2,2,2,1,1,1,1,1,1;caves|burning,poisonDart,frost,storm,corrosion,gripping,rockfall,guardian,confusion,summoning,warping,pitfall,gateway,geyser|4,4,4,4,4,2,2,2,1,1,1,1,1,1;city|frost,storm,corrosion,blazing,disintegration,rockfall,flashing,guardian,weakening,disarming,summoning,warping,cursing,pitfall,distortion,gateway,geyser|4,4,4,4,4,2,2,2,2,1,1,1,1,1,1,1,1;halls|frost,storm,corrosion,blazing,disintegration,rockfall,flashing,guardian,weakening,disarming,summoning,warping,cursing,grim,pitfall,distortion,gateway,geyser|4,4,4,4,4,2,2,2,2,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 33,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 30,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "regionPaintRules",
						"name": "LevelPainter.terrainPatches"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "sewers|0.3|0.85|0.2|0.8|5|4;prison|0.3|0.9|0.2|0.8|4|3;caves|0.3|0.85|0.15|0.65|6|3;city|0.3|0.90|0.2|0.8|4|3;halls|0.15|0.70|0.10|0.65|6|3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 39,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "wandGeneratorDeck",
						"name": "Generator.Category.WAND"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "3,3,3,3,3,3,3,3,3,3,3,3,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "WandOfMagicMissile,WandOfLightning,WandOfDisintegration,WandOfFireblast,WandOfCorrosion,WandOfBlastWave,WandOfLivingEarth,WandOfFrost,WandOfPrismaticLight,WandOfWarding,WandOfTransfusion,WandOfCorruption,WandOfRegrowth"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 10,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "ringGeneratorDeck",
						"name": "Generator.Category.RING"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "3,3,3,3,3,3,3,3,3,3,3,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 18,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "RingOfAccuracy,RingOfArcana,RingOfElements,RingOfEnergy,RingOfEvasion,RingOfForce,RingOfFuror,RingOfHaste,RingOfMight,RingOfSharpshooting,RingOfTenacity,RingOfWealth"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 22,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 15,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "artifactGeneratorDeck",
						"name": "Generator.Category.ARTIFACT"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "1,1,0,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 30,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "AlchemistsToolkit,ChaliceOfBlood,CloakOfShadows,DriedRose,EtherealChains,HornOfPlenty,MasterThievesArmband,SandalsOfNature,TalismanOfForesight,TimekeepersHourglass,UnstableSpellbook"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 34,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 27,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "foodGeneratorDeck",
						"name": "Generator.Category.FOOD"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "4,1,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "Food,Pasty,MysteryMeat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 46,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 39,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "affixPools",
						"name": "Generator.affixPools"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "type_chances",
								"set": "50,40,10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "pool_sizes",
								"set": "4,6,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
								"line": 10,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "curse_pool_size",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
								"line": 14,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "ghostQuestReward",
						"name": "Ghost.Quest.spawn"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "tier_weights",
								"set": "0,0,10,6,3,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
								"line": 22,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "armor_classes",
								"set": "ClothArmor,LeatherArmor,MailArmor,ScaleArmor,PlateArmor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
								"line": 26,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
						"line": 19,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "floorSetTierProbs",
						"name": "Generator.floorSetTierProbs"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "rows",
								"set": "0,75,20,4,1;0,25,50,20,5;0,0,40,50,10;0,0,20,40,40;0,0,0,20,80"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_wornshortsword_t1",
						"name": "port.name.wornshortsword",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_magesstaff_t1",
						"name": "port.name.magesstaff",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 9,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_dagger_t1",
						"name": "port.name.dagger",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 14,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_gloves_t1",
						"name": "port.name.gloves",
						"slot": "weapon"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "speed",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 23,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 19,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_rapier_t1",
						"name": "port.name.rapier",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 28,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_shortsword_t2",
						"name": "items.weapon.melee.shortsword.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 33,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_handaxe_t2",
						"name": "items.weapon.melee.handaxe.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 38,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_spear_t2",
						"name": "items.weapon.melee.spear.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 43,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_quarterstaff_t2",
						"name": "items.weapon.melee.quarterstaff.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 48,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_dirk_t2",
						"name": "items.weapon.melee.dirk.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 53,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_sickle_t2",
						"name": "items.weapon.melee.sickle.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 58,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_sword_t3",
						"name": "items.weapon.melee.sword.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 63,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_mace_t3",
						"name": "items.weapon.melee.mace.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 68,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_scimitar_t3",
						"name": "items.weapon.melee.scimitar.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 73,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_roundshield_t3",
						"name": "items.weapon.melee.roundshield.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 78,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_sai_t3",
						"name": "items.weapon.melee.sai.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 83,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_whip_t3",
						"name": "items.weapon.melee.whip.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 88,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_longsword_t4",
						"name": "items.weapon.melee.longsword.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 93,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_battleaxe_t4",
						"name": "items.weapon.melee.battleaxe.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 98,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_flail_t4",
						"name": "items.weapon.melee.flail.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 103,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_runicblade_t4",
						"name": "items.weapon.melee.runicblade.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 108,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_assassinsblade_t4",
						"name": "items.weapon.melee.assassinsblade.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 113,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_crossbow_t4",
						"name": "items.weapon.melee.crossbow.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 118,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_katana_t4",
						"name": "items.weapon.melee.katana.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 123,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_greatsword_t5",
						"name": "items.weapon.melee.greatsword.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 128,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_warhammer_t5",
						"name": "items.weapon.melee.warhammer.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 133,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_glaive_t5",
						"name": "items.weapon.melee.glaive.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 138,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_greataxe_t5",
						"name": "items.weapon.melee.greataxe.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 143,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_greatshield_t5",
						"name": "items.weapon.melee.greatshield.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 148,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_gauntlet_t5",
						"name": "items.weapon.melee.gauntlet.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 153,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_warscythe_t5",
						"name": "items.weapon.melee.warscythe.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 158,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "armor_clotharmor_t1_cloth",
						"name": "items.armor.clotharmor.name",
						"slot": "armor"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 164,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "armor_leatherarmor_t2_leather",
						"name": "items.armor.leatherarmor.name",
						"slot": "armor"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 169,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "armor_mailarmor_t3_mail",
						"name": "items.armor.mailarmor.name",
						"slot": "armor"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 174,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "armor_scalearmor_t4_scale",
						"name": "items.armor.scalearmor.name",
						"slot": "armor"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 179,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "armor_platearmor_t5_plate",
						"name": "items.armor.platearmor.name",
						"slot": "armor"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 184,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandmagicmissile_t1",
						"name": "items.wands.wandofmagicmissile.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 194,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 198,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 190,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t1",
						"name": "items.wands.wandoffirebolt.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 207,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 211,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 203,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandcorruption_t1",
						"name": "items.wands.wandofcorruption.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 220,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 224,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 216,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfrost_t1",
						"name": "items.wands.wandoffrost.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 233,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 237,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 229,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlightning_t1",
						"name": "items.wands.wandoflightning.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 246,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 250,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 242,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t1",
						"name": "items.wands.wandofblast.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 259,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 263,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 255,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlivingearth_t1",
						"name": "items.wands.wandoflivingearth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 272,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 276,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 268,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandregrowth_t1",
						"name": "items.wands.wandofregrowth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 285,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 289,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 281,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t1",
						"name": "items.wands.wandofprismatic.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 298,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 302,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 294,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandwarding_t1",
						"name": "items.wands.wandofwarding.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 311,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 315,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 307,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandmagicmissile_t2",
						"name": "items.wands.wandofmagicmissile.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 325,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 329,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 321,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t2",
						"name": "items.wands.wandoffirebolt.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 338,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 342,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 334,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandcorruption_t2",
						"name": "items.wands.wandofcorruption.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 351,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 355,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 347,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfrost_t2",
						"name": "items.wands.wandoffrost.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 364,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 368,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 360,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlightning_t2",
						"name": "items.wands.wandoflightning.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 377,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 381,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 373,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t2",
						"name": "items.wands.wandofblast.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 390,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 394,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 386,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlivingearth_t2",
						"name": "items.wands.wandoflivingearth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 403,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 407,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 399,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandregrowth_t2",
						"name": "items.wands.wandofregrowth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 416,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 420,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 412,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t2",
						"name": "items.wands.wandofprismatic.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 429,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 433,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 425,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandwarding_t2",
						"name": "items.wands.wandofwarding.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 442,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 446,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 438,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandmagicmissile_t3",
						"name": "items.wands.wandofmagicmissile.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 456,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 460,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 452,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t3",
						"name": "items.wands.wandoffirebolt.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 469,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 473,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 465,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandcorruption_t3",
						"name": "items.wands.wandofcorruption.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 482,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 486,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 478,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfrost_t3",
						"name": "items.wands.wandoffrost.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 495,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 499,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 491,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlightning_t3",
						"name": "items.wands.wandoflightning.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 508,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 512,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 504,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t3",
						"name": "items.wands.wandofblast.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 521,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 525,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 517,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlivingearth_t3",
						"name": "items.wands.wandoflivingearth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 534,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 538,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 530,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandregrowth_t3",
						"name": "items.wands.wandofregrowth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 547,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 551,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 543,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t3",
						"name": "items.wands.wandofprismatic.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 560,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 564,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 556,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandwarding_t3",
						"name": "items.wands.wandofwarding.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 573,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 577,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 569,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandmagicmissile_t4",
						"name": "items.wands.wandofmagicmissile.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 587,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 591,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 583,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t4",
						"name": "items.wands.wandoffirebolt.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 600,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 604,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 596,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandcorruption_t4",
						"name": "items.wands.wandofcorruption.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 613,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 617,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 609,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfrost_t4",
						"name": "items.wands.wandoffrost.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 626,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 630,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 622,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlightning_t4",
						"name": "items.wands.wandoflightning.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 639,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 643,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 635,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t4",
						"name": "items.wands.wandofblast.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 652,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 656,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 648,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlivingearth_t4",
						"name": "items.wands.wandoflivingearth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 665,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 669,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 661,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandregrowth_t4",
						"name": "items.wands.wandofregrowth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 678,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 682,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 674,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t4",
						"name": "items.wands.wandofprismatic.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 691,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 695,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 687,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandwarding_t4",
						"name": "items.wands.wandofwarding.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 704,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 708,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 700,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandmagicmissile_t5",
						"name": "items.wands.wandofmagicmissile.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 718,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 722,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 714,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t5",
						"name": "items.wands.wandoffirebolt.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 731,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 735,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 727,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandcorruption_t5",
						"name": "items.wands.wandofcorruption.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 744,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 748,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 740,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfrost_t5",
						"name": "items.wands.wandoffrost.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 757,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 761,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 753,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlightning_t5",
						"name": "items.wands.wandoflightning.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 770,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 774,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 766,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t5",
						"name": "items.wands.wandofblast.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 783,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 787,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 779,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandlivingearth_t5",
						"name": "items.wands.wandoflivingearth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 796,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 800,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 792,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandregrowth_t5",
						"name": "items.wands.wandofregrowth.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 809,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 813,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 805,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t5",
						"name": "items.wands.wandofprismatic.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 822,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 826,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 818,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandwarding_t5",
						"name": "items.wands.wandofwarding.name",
						"slot": "wand"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "min_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 835,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_damage",
								"set": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
								"line": 839,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 831,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "monsterLoot",
						"name": "Mob.loot"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "snake|0.25|seed;rotLasher|0.75|seed;gnoll|0.5|gold;crab|0.1666666667|meat;albino|1|meat;causticSlime|0.5|meat;bandit|1|gold;spectralNecromancer|0.2|potion;armoredBrute|1|armor;dm201|0.125|armor;senior|1|food;acidic|1|potion;piranha|1|meat;dm100|0.25|scroll;guard|0.2|armor;necromancer|0.2|potion;bat|0.1666666667|potion;brute|0.5|gold;shaman|0.03|wand;spinner|0.125|meat;dm200|0.2|armor;gnollTrickster|1|stone;greatCrab|1|meat;ghoul|0.2|gold;monk|0.1|food;golem|0.2|armor;eye|1|dewdrop;demonSpawner|1|potion;slime|0.2|armor;skeleton|0.1666666667|armor;thief|0.03|ring;swarm|0.1666666667|potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "limitedDropDecay",
						"name": "Dungeon.LimitedDrops"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "bat|linear|7;necromancer|linear|6;guard|power|3;dm200|power|3;golem|power|3;shaman|power|3;slime|power|4;skeleton|power|3;thief|power|3;swarm|linear|5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
						"line": 13,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "item",
					"attributes": {
						"id": "missile_throwingstone",
						"name": "items.weapon.missiles.throwingstone.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_throwingknife",
						"name": "items.weapon.missiles.throwingknife.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 10,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_throwingspike",
						"name": "items.weapon.missiles.throwingspike.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 16,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_fishingspear",
						"name": "items.weapon.missiles.fishingspear.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 22,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_throwingclub",
						"name": "items.weapon.missiles.throwingclub.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 28,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_shuriken",
						"name": "items.weapon.missiles.shuriken.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 34,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_throwingspear",
						"name": "items.weapon.missiles.throwingspear.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 40,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_kunai",
						"name": "items.weapon.missiles.kunai.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 46,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_bolas",
						"name": "items.weapon.missiles.bolas.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 52,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_javelin",
						"name": "items.weapon.missiles.javelin.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 58,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_tomahawk",
						"name": "items.weapon.missiles.tomahawk.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 64,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_heavyboomerang",
						"name": "items.weapon.missiles.heavyboomerang.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 70,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_trident",
						"name": "items.weapon.missiles.trident.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 76,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_throwinghammer",
						"name": "items.weapon.missiles.throwinghammer.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 82,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_forcecube",
						"name": "items.weapon.missiles.forcecube.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 88,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "missileDefinitions",
						"name": "MissileWeapon.definitions"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "missile_throwingstone|ThrowingStone|1|2|5;missile_throwingknife|ThrowingKnife|1|2|6;missile_throwingspike|ThrowingSpike|1|2|5;missile_fishingspear|FishingSpear|2|4|10;missile_throwingclub|ThrowingClub|2|4|10;missile_shuriken|Shuriken|2|4|10;missile_throwingspear|ThrowingSpear|3|6|15;missile_kunai|Kunai|3|6|15;missile_bolas|Bolas|3|6|15;missile_javelin|Javelin|4|8|20;missile_tomahawk|Tomahawk|4|8|20;missile_heavyboomerang|HeavyBoomerang|4|8|20;missile_trident|Trident|5|10|25;missile_throwinghammer|ThrowingHammer|5|10|25;missile_forcecube|ForceCube|5|10|25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 98,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 95,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "missileDeckT1",
						"name": "Generator.Category.MIS_T1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "3,3,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 107,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "ThrowingStone,ThrowingKnife,ThrowingSpike"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 111,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 104,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "missileDeckT2",
						"name": "Generator.Category.MIS_T2"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "3,3,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 119,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "FishingSpear,ThrowingClub,Shuriken"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 123,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 116,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "missileDeckT3",
						"name": "Generator.Category.MIS_T3"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "3,3,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 131,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "ThrowingSpear,Kunai,Bolas"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 135,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 128,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "missileDeckT4",
						"name": "Generator.Category.MIS_T4"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "3,3,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 143,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "Javelin,Tomahawk,HeavyBoomerang"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 147,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 140,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "missileDeckT5",
						"name": "Generator.Category.MIS_T5"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "3,3,3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 155,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "Trident,ThrowingHammer,ForceCube"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 159,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 152,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "rat",
				"hp": "8",
				"accuracy": "8",
				"evasion": "2",
				"damage_min": "1",
				"damage_max": "4",
				"armor_min": "0",
				"armor_max": "1",
				"experience": "1",
				"max_level": "5",
				"image": "assets/rat.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "snake",
				"hp": "4",
				"accuracy": "10",
				"evasion": "25",
				"damage_min": "1",
				"damage_max": "4",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "2",
				"max_level": "7",
				"image": "assets/snake.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 15,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "gnoll",
				"hp": "12",
				"accuracy": "10",
				"evasion": "4",
				"damage_min": "1",
				"damage_max": "6",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "2",
				"max_level": "8",
				"image": "assets/gnoll.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 29,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "swarm",
				"hp": "50",
				"accuracy": "10",
				"evasion": "5",
				"damage_min": "1",
				"damage_max": "4",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "3",
				"max_level": "9",
				"image": "assets/swarm.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 43,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "crab",
				"hp": "15",
				"accuracy": "12",
				"evasion": "5",
				"damage_min": "1",
				"damage_max": "7",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "4",
				"max_level": "9",
				"image": "assets/crab.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 57,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "slime",
				"hp": "20",
				"accuracy": "12",
				"evasion": "5",
				"damage_min": "2",
				"damage_max": "5",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "4",
				"max_level": "9",
				"image": "assets/slime.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 71,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "goo",
				"hp": "100",
				"accuracy": "10",
				"evasion": "8",
				"damage_min": "1",
				"damage_max": "8",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "10",
				"max_level": "29",
				"image": "assets/goo.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 85,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "skeleton",
				"hp": "25",
				"accuracy": "12",
				"evasion": "9",
				"damage_min": "2",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "5",
				"max_level": "10",
				"image": "assets/skeleton.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 99,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ward",
				"hp": "10",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/wards.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 113,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "sheep",
				"hp": "1",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/sheep.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 127,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "earthGuardian",
				"hp": "0",
				"accuracy": "0",
				"evasion": "0",
				"damage_min": "2",
				"damage_max": "4",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/guardian.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 141,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "thief",
				"hp": "20",
				"accuracy": "12",
				"evasion": "12",
				"damage_min": "1",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "3",
				"experience": "5",
				"max_level": "11",
				"image": "assets/thief.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 155,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm100",
				"hp": "20",
				"accuracy": "11",
				"evasion": "8",
				"damage_min": "2",
				"damage_max": "8",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "6",
				"max_level": "13",
				"image": "assets/dm100.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 169,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "guard",
				"hp": "40",
				"accuracy": "12",
				"evasion": "10",
				"damage_min": "4",
				"damage_max": "12",
				"armor_min": "0",
				"armor_max": "7",
				"experience": "7",
				"max_level": "14",
				"image": "assets/guard.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 183,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "necromancer",
				"hp": "40",
				"accuracy": "10",
				"evasion": "14",
				"damage_min": "2",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "7",
				"max_level": "14",
				"image": "assets/necromancer.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 197,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "tengu",
				"hp": "200",
				"accuracy": "10",
				"evasion": "15",
				"damage_min": "6",
				"damage_max": "12",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "20",
				"max_level": "29",
				"image": "assets/tengu.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 211,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "fetidRat",
				"hp": "20",
				"accuracy": "12",
				"evasion": "5",
				"damage_min": "1",
				"damage_max": "4",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "4",
				"max_level": "5",
				"image": "assets/rat.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 225,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "gnollTrickster",
				"hp": "20",
				"accuracy": "16",
				"evasion": "5",
				"damage_min": "1",
				"damage_max": "6",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "5",
				"max_level": "8",
				"image": "assets/gnoll.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 239,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "greatCrab",
				"hp": "25",
				"accuracy": "12",
				"evasion": "0",
				"damage_min": "1",
				"damage_max": "7",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "6",
				"max_level": "9",
				"image": "assets/crab.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 253,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "bat",
				"hp": "30",
				"accuracy": "16",
				"evasion": "15",
				"damage_min": "5",
				"damage_max": "18",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "7",
				"max_level": "15",
				"image": "assets/bat.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 267,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "brute",
				"hp": "40",
				"accuracy": "20",
				"evasion": "15",
				"damage_min": "5",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "8",
				"experience": "8",
				"max_level": "16",
				"image": "assets/brute.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 281,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "shaman",
				"hp": "35",
				"accuracy": "18",
				"evasion": "15",
				"damage_min": "5",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "6",
				"experience": "8",
				"max_level": "16",
				"image": "assets/shaman.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 295,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "spinner",
				"hp": "50",
				"accuracy": "22",
				"evasion": "17",
				"damage_min": "10",
				"damage_max": "20",
				"armor_min": "0",
				"armor_max": "6",
				"experience": "9",
				"max_level": "17",
				"image": "assets/spinner.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 309,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm200",
				"hp": "80",
				"accuracy": "20",
				"evasion": "12",
				"damage_min": "10",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "8",
				"experience": "9",
				"max_level": "17",
				"image": "assets/dm200.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 323,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm300",
				"hp": "300",
				"accuracy": "20",
				"evasion": "15",
				"damage_min": "15",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "10",
				"experience": "30",
				"max_level": "29",
				"image": "assets/dm300.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 337,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "necroSkeleton",
				"hp": "20",
				"accuracy": "12",
				"evasion": "9",
				"damage_min": "2",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/skeleton.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 351,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ghost",
				"hp": "999999",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/ghost.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 365,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "wandmaker",
				"hp": "999999",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/wandmaker.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 379,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "shopkeeper",
				"hp": "999999",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/shopkeeper.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 393,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "blacksmith",
				"hp": "999999",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/blacksmith.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 407,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "imp",
				"hp": "999999",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/demon.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 421,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ghoul",
				"hp": "45",
				"accuracy": "24",
				"evasion": "20",
				"damage_min": "16",
				"damage_max": "22",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "5",
				"max_level": "20",
				"image": "assets/ghoul.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 435,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "elemental",
				"hp": "60",
				"accuracy": "25",
				"evasion": "20",
				"damage_min": "20",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "10",
				"max_level": "20",
				"image": "assets/elemental.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 449,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "newbornElemental",
				"hp": "60",
				"accuracy": "15",
				"evasion": "12",
				"damage_min": "10",
				"damage_max": "12",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "10",
				"max_level": "20",
				"image": "assets/elemental.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 463,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "warlock",
				"hp": "70",
				"accuracy": "25",
				"evasion": "18",
				"damage_min": "12",
				"damage_max": "18",
				"armor_min": "0",
				"armor_max": "8",
				"experience": "11",
				"max_level": "21",
				"image": "assets/warlock.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 477,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "monk",
				"hp": "70",
				"accuracy": "30",
				"evasion": "30",
				"damage_min": "12",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "11",
				"max_level": "21",
				"image": "assets/monk.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 491,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "golem",
				"hp": "120",
				"accuracy": "28",
				"evasion": "15",
				"damage_min": "25",
				"damage_max": "30",
				"armor_min": "0",
				"armor_max": "12",
				"experience": "12",
				"max_level": "22",
				"image": "assets/golem.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 505,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "succubus",
				"hp": "80",
				"accuracy": "40",
				"evasion": "25",
				"damage_min": "25",
				"damage_max": "30",
				"armor_min": "0",
				"armor_max": "10",
				"experience": "12",
				"max_level": "25",
				"image": "assets/succubus.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 519,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "eye",
				"hp": "100",
				"accuracy": "30",
				"evasion": "20",
				"damage_min": "20",
				"damage_max": "30",
				"armor_min": "0",
				"armor_max": "10",
				"experience": "13",
				"max_level": "26",
				"image": "assets/eye.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 533,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "scorpio",
				"hp": "110",
				"accuracy": "36",
				"evasion": "24",
				"damage_min": "30",
				"damage_max": "40",
				"armor_min": "0",
				"armor_max": "16",
				"experience": "14",
				"max_level": "27",
				"image": "assets/scorpio.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 547,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "king",
				"hp": "300",
				"accuracy": "26",
				"evasion": "22",
				"damage_min": "15",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "10",
				"experience": "40",
				"max_level": "29",
				"image": "assets/king.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 561,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "yog",
				"hp": "400",
				"accuracy": "30",
				"evasion": "0",
				"damage_min": "8",
				"damage_max": "16",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "50",
				"max_level": "29",
				"image": "assets/yog.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 575,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "yogFist",
				"hp": "60",
				"accuracy": "20",
				"evasion": "10",
				"damage_min": "6",
				"damage_max": "12",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "10",
				"max_level": "29",
				"image": "assets/yog_fists.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 589,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "demonSpawner",
				"hp": "120",
				"accuracy": "0",
				"evasion": "0",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "12",
				"experience": "15",
				"max_level": "29",
				"image": "assets/spawner.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 603,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ripperDemon",
				"hp": "60",
				"accuracy": "30",
				"evasion": "22",
				"damage_min": "15",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "9",
				"max_level": "-2",
				"image": "assets/ripper.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 617,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "albino",
				"hp": "15",
				"accuracy": "8",
				"evasion": "2",
				"damage_min": "1",
				"damage_max": "4",
				"armor_min": "0",
				"armor_max": "1",
				"experience": "2",
				"max_level": "5",
				"image": "assets/rat.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 631,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "causticSlime",
				"hp": "20",
				"accuracy": "12",
				"evasion": "5",
				"damage_min": "2",
				"damage_max": "5",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "4",
				"max_level": "9",
				"image": "assets/slime.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 645,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "bandit",
				"hp": "20",
				"accuracy": "12",
				"evasion": "12",
				"damage_min": "1",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "3",
				"experience": "5",
				"max_level": "11",
				"image": "assets/thief.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 659,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "spectralNecromancer",
				"hp": "40",
				"accuracy": "10",
				"evasion": "14",
				"damage_min": "2",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "7",
				"max_level": "14",
				"image": "assets/necromancer.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 673,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "armoredBrute",
				"hp": "40",
				"accuracy": "20",
				"evasion": "15",
				"damage_min": "5",
				"damage_max": "25",
				"armor_min": "4",
				"armor_max": "16",
				"experience": "8",
				"max_level": "16",
				"image": "assets/brute.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 687,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm201",
				"hp": "120",
				"accuracy": "20",
				"evasion": "12",
				"damage_min": "15",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "8",
				"experience": "9",
				"max_level": "17",
				"image": "assets/dm200.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 701,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "senior",
				"hp": "70",
				"accuracy": "30",
				"evasion": "30",
				"damage_min": "16",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "11",
				"max_level": "21",
				"image": "assets/monk.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 715,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "acidic",
				"hp": "110",
				"accuracy": "36",
				"evasion": "24",
				"damage_min": "30",
				"damage_max": "40",
				"armor_min": "0",
				"armor_max": "16",
				"experience": "14",
				"max_level": "27",
				"image": "assets/scorpio.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 729,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "mimic",
				"hp": "6",
				"accuracy": "6",
				"evasion": "2",
				"damage_min": "1",
				"damage_max": "2",
				"armor_min": "0",
				"armor_max": "1",
				"experience": "0",
				"max_level": "29",
				"image": "assets/mimic.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 743,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "crystalMimic",
				"hp": "6",
				"accuracy": "6",
				"evasion": "2",
				"damage_min": "1",
				"damage_max": "2",
				"armor_min": "0",
				"armor_max": "1",
				"experience": "0",
				"max_level": "29",
				"image": "assets/mimic.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 757,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "piranha",
				"hp": "10",
				"accuracy": "20",
				"evasion": "10",
				"damage_min": "1",
				"damage_max": "6",
				"armor_min": "0",
				"armor_max": "1",
				"experience": "0",
				"max_level": "29",
				"image": "assets/piranha.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 771,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "bee",
				"hp": "12",
				"accuracy": "10",
				"evasion": "10",
				"damage_min": "1",
				"damage_max": "3",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "29",
				"image": "assets/bee.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 785,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "statue",
				"hp": "15",
				"accuracy": "9",
				"evasion": "4",
				"damage_min": "2",
				"damage_max": "8",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "0",
				"max_level": "29",
				"image": "assets/statue.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 799,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "armoredStatue",
				"hp": "30",
				"accuracy": "9",
				"evasion": "4",
				"damage_min": "2",
				"damage_max": "8",
				"armor_min": "0",
				"armor_max": "2",
				"experience": "0",
				"max_level": "29",
				"image": "assets/statue.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 813,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "pylon",
				"hp": "50",
				"accuracy": "0",
				"evasion": "0",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "-2",
				"image": "assets/pylon.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 827,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "sentry",
				"hp": "1",
				"accuracy": "20",
				"evasion": "1000000",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/red_sentry.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 841,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "rotHeart",
				"hp": "80",
				"accuracy": "0",
				"evasion": "0",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "4",
				"max_level": "29",
				"image": "assets/rot_heart.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 855,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "rotLasher",
				"hp": "80",
				"accuracy": "25",
				"evasion": "0",
				"damage_min": "10",
				"damage_max": "20",
				"armor_min": "0",
				"armor_max": "8",
				"experience": "1",
				"max_level": "29",
				"image": "assets/rot_lasher.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 869,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ratKing",
				"hp": "1",
				"accuracy": "0",
				"evasion": "999999",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/ratking.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 883,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "heroProgression",
						"name": "Hero.level"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "max_level",
								"set": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\progression-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "experience_formula",
								"set": "5|2|2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\progression-rules.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\progression-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\progression-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "statusImmunities",
						"name": "Char.immunities"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "fire",
								"set": "burning"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 8,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "magic",
								"set": "charm,weakness,vulnerable,hex,degrade,magicalSleep"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 12,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "chill",
								"set": "chill"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
						"line": 5,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "turn_clock",
					"attributes": {
						"id": "spdAdventureClock",
						"tick": "1",
						"hunger": "10"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringAccuracy",
						"name": "RingOfAccuracy",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "accuracy",
								"multiply": "1.3^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 15,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 9,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringEvasion",
						"name": "RingOfEvasion",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "evasion",
								"multiply": "1.125^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 27,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 21,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringMight",
						"name": "RingOfMight",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "strength",
								"add": "level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 39,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 33,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringTenacity",
						"name": "RingOfTenacity",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "tenacity",
								"multiply": "0.85^(level*missing_hp_fraction)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 51,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 45,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringHaste",
						"name": "RingOfHaste",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "haste",
								"multiply": "1.175^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 63,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 57,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringEnergy",
						"name": "RingOfEnergy",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "energy",
								"multiply": "1.175^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 75,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 69,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringWealth",
						"name": "RingOfWealth",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "wealth",
								"multiply": "1.2^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 87,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 81,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringArcana",
						"name": "RingOfArcana",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "arcana",
								"multiply": "1.175^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 99,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 93,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringForce",
						"name": "RingOfForce",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "force",
								"add": "level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 111,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 105,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringSharpshooting",
						"name": "RingOfSharpshooting",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "sharpshooting",
								"add": "level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 123,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 117,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringElements",
						"name": "RingOfElements",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "elements",
								"multiply": "0.825^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 135,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 129,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringFuror",
						"name": "RingOfFuror",
						"slot": "ring",
						"stackable": "false",
						"weight": "0.1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "furor",
								"multiply": "1.09051^level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
								"line": 147,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 141,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "standardRoomChances",
						"name": "StandardRoom.chances"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "1|10,10,10,5,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,1,0,0;2|10,10,10,5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1;5|10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0;6|10,0,0,0,10,10,5,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1;11|10,0,0,0,0,0,0,10,10,5,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1;16|10,0,0,0,0,0,0,0,0,0,10,10,5,0,0,0,1,1,1,1,1,1,1,1,1,1;21|10,0,0,0,0,0,0,0,0,0,0,0,0,10,10,5,1,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "regionRoomCounts",
						"name": "RegularLevel.roomCounts"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "sewers|6|4|1,3,1|2|1|1,4;prison|6|5|1,1|3|1|1,3,1;caves|7|6|2,1|3|2|4,1;city|8|6|1,3,1|3|2|2,1;halls|9|8|2,1|3|2|1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 13,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "standardRoomClassOrder",
						"name": "StandardRoom.classOrder"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "empty,sewerPipe,ring,circleBasin,segmented,pillars,cellBlock,cave,cavesFissure,circlePit,hallway,statues,segmentedLibrary,ruins,chasm,skulls,plants,aquarium,platform,burned,fissure,grassyGrave,striped,study,suspiciousChest,minefield"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 25,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 22,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "specialRoomRules",
						"name": "SpecialRoom.selectionLists"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "equipSpecials",
								"set": "weakFloor,crypt,pool,armory,sentry,statue,crystalVault,crystalChoice,sacrifice"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 34,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "consumableSpecials",
								"set": "runestone,garden,library,storage,treasury,magicWell,toxicGas,magicalFire,traps,crystalPath"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 38,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "crystalKeySpecials",
								"set": "pit,crystalVault,crystalChoice,crystalPath"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "potionSpawnRooms",
								"set": "pool,sentry,storage,toxicGas,magicalFire,traps"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 46,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 31,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "connectionRoomChances",
						"name": "ConnectionRoom.chances"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "1|20,1,0,2,2,1;2|20,1,0,2,2,1;3|20,1,0,2,2,1;4|20,1,0,2,2,1;5|20,0,0,0,0,0;6|0,0,22,3,0,0;7|0,0,22,3,0,0;8|0,0,22,3,0,0;9|0,0,22,3,0,0;10|0,0,22,3,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 55,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "tunnel,bridge,perimeter,walkway,ringTunnel,ringBridge"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 59,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 52,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "runestoneDeck",
						"name": "Generator.Category.STONE"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "0,5,5,5,5,5,5,5,5,5,5,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\runestones.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "StoneOfEnchantment,StoneOfIntuition,StoneOfDetectMagic,StoneOfFlock,StoneOfShock,StoneOfBlink,StoneOfDeepSleep,StoneOfClairvoyance,StoneOfAggression,StoneOfBlast,StoneOfFear,StoneOfAugmentation"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\runestones.mwl",
								"line": 10,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\runestones.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\runestones.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "bossTransitions",
						"name": "Scenario.bossTransitions"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "5|goo|continue|Goo bursts apart in a spray of ooze. You have slain the Sewers boss!;10|tengu|continue|Tengu collapses, his tricks spent at last. You have slain the Prison boss!;15|dm300|continue|DM-300 grinds to a halt. You have slain the Caves boss!;20|king|continue|The Dwarf King crumbles from his throne. You have slain the City boss!;25|yog|continue|Yog-Dzewa dissolves into screaming dark. The Amulet lies before you..."
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "scenarioChapters",
						"name": "Scenario.chapters"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "sewers|1|5|goo;prison|6|10|tengu;caves|11|15|dm300;city|16|20|king;halls|21|25|yog"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 13,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "scenarioQuests",
						"name": "Scenario.quests"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "ghost|2,3,4|5;wandmaker|7,8,9|10;shopkeeper|6,11,16,21|0;blacksmith|12,13,14|15;imp|17,18,19|20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 25,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 22,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "questDefinitions",
						"name": "QuestLog"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "entries",
								"set": "sadGhost|ghostTargetSlain|Slay the ghost's tormentor.;wandmaker|wandQuestDone|Bring the wandmaker a scroll.;blacksmith|blacksmithDone|Complete the Blacksmith quest.;imp|impDone|Bring dwarf tokens."
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 34,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 31,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "seedDeck",
						"name": "Generator.Category.SEED"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "rotberry,sungrass,fadeleaf,icecap,firebloom,sorrowmoss,swiftthistle,blindweed,stormvine,earthroot,mageroyal,starflower"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\seeds.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "0,5,5,5,5,5,5,5,5,5,5,2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\seeds.mwl",
								"line": 10,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\seeds.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\seeds.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "talentTrees",
						"name": "Hero.talentTrees"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "class_entries",
								"set": "warrior|1|hearty_meal,veterans_intuition,test_subject,iron_will;warrior|2|iron_stomach,restored_willpower,runic_transference,lethal_momentum,improvised_projectiles;mage|1|empowering_meal,scholars_intuition,tested_hypothesis,backup_barrier;mage|2|energizing_meal,energizing_upgrade,wand_preservation,arcane_vision,shield_battery;rogue|1|cached_rations,thiefs_intuition,sucker_punch,protective_shadows;rogue|2|mystical_meal,mystical_upgrade,wide_search,silent_steps,rogues_foresight;huntress|1|natures_bounty,survivalists_intuition,followup_strike,natures_aid;huntress|2|invigorating_meal,restored_nature,rejuvenating_steps,heightened_senses,durable_projectiles;duelist|1|strengthening_meal,adventurers_intuition,patient_strike,aggressive_barrier;duelist|2|focused_meal,restored_agility,weapon_recharging,lethal_haste,swift_equip;cleric|1|empowering_meal,scholars_intuition,tested_hypothesis,backup_barrier;cleric|2|energizing_meal,energizing_upgrade,wand_preservation,arcane_vision,shield_battery"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "subclass_entries",
								"set": "berserker|endless_rage,deathless_fury,enraged_catalyst;gladiator|cleave,lethal_defense,enhanced_combo;battlemage|empowered_strike,mystical_charge,excess_charge;warlock|soul_eater,soul_siphon,necromancers_minions;assassin|enhanced_lethality,assassins_reach,bounty_hunter;freerunner|evasive_armor,projectile_momentum,speedy_stealth;sniper|farsight,shared_enchantment,shared_upgrades;warden|durable_tips,barkskin,shielding_dew;champion|secondary_charge,twin_upgrades,combined_lethality;monk_sub|unencumbered_spirit,monastic_vigor,combined_energy"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "tier_thresholds",
								"set": "0,2,7,13,21,31"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 15,
								"column": 2
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
						"line": 4,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		},
		{
			"tag": "game",
			"attributes": {
				"schema": "0.1"
			},
			"children": [
				{
					"tag": "trait",
					"attributes": {
						"id": "weaponDeckT1",
						"name": "Generator.Category.WEP_T1"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "2,0,2,2,2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 6,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "WornShortsword,MagesStaff,Dagger,Gloves,Rapier"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 10,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 3,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "weaponDeckT2",
						"name": "Generator.Category.WEP_T2"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "2,2,2,2,2,2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 18,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "Shortsword,HandAxe,Spear,Quarterstaff,Dirk,Sickle"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 22,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 15,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "weaponDeckT3",
						"name": "Generator.Category.WEP_T3"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "2,2,2,2,2,2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 30,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "Sword,Mace,Scimitar,RoundShield,Sai,Whip"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 34,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 27,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "weaponDeckT4",
						"name": "Generator.Category.WEP_T4"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "2,2,2,2,2,2,2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "Longsword,BattleAxe,Flail,RunicBlade,AssassinsBlade,Crossbow,Katana"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 46,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 39,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "weaponDeckT5",
						"name": "Generator.Category.WEP_T5"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "2,2,2,2,2,2,2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 54,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "Greatsword,WarHammer,Glaive,Greataxe,Greatshield,Gauntlet,WarScythe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
								"line": 58,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 51,
						"column": 1
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
				"line": 1,
				"column": 1
			},
			"gettext": []
		}
	],
	"assets": [
		"assets/bat.png",
		"assets/bee.png",
		"assets/blacksmith.png",
		"assets/brute.png",
		"assets/crab.png",
		"assets/demon.png",
		"assets/dm100.png",
		"assets/dm200.png",
		"assets/dm300.png",
		"assets/elemental.png",
		"assets/eye.png",
		"assets/ghost.png",
		"assets/ghoul.png",
		"assets/gnoll.png",
		"assets/golem.png",
		"assets/goo.png",
		"assets/guard.png",
		"assets/guardian.png",
		"assets/king.png",
		"assets/mimic.png",
		"assets/monk.png",
		"assets/necromancer.png",
		"assets/piranha.png",
		"assets/pylon.png",
		"assets/rat.png",
		"assets/ratking.png",
		"assets/red_sentry.png",
		"assets/ripper.png",
		"assets/rot_heart.png",
		"assets/rot_lasher.png",
		"assets/scorpio.png",
		"assets/shaman.png",
		"assets/sheep.png",
		"assets/shopkeeper.png",
		"assets/skeleton.png",
		"assets/slime.png",
		"assets/snake.png",
		"assets/spawner.png",
		"assets/spinner.png",
		"assets/statue.png",
		"assets/succubus.png",
		"assets/swarm.png",
		"assets/tengu.png",
		"assets/thief.png",
		"assets/wandmaker.png",
		"assets/wards.png",
		"assets/warlock.png",
		"assets/yog.png",
		"assets/yog_fists.png"
	],
	"messages": []
} as const;
