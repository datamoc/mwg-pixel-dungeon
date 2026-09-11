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
					"tag": "table",
					"attributes": {
						"id": "actorBaseAliases",
						"columns": "variant:string|base:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"variant": "albino",
								"base": "rat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 32,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "causticSlime",
								"base": "slime"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 36,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "bandit",
								"base": "thief"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 40,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "spectralNecromancer",
								"base": "necromancer"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 44,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "armoredBrute",
								"base": "brute"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 48,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "dm201",
								"base": "dm200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 52,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "senior",
								"base": "monk"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 56,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "acidic",
								"base": "scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 60,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "crystalMimic",
								"base": "mimic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 64,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "armoredStatue",
								"base": "statue"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 68,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "pylon",
								"base": "pylon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 72,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 29,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "monsterAiProfiles",
						"columns": "monster:string|profile:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"monster": "dm100",
								"profile": "dm100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 81,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "shaman",
								"profile": "shaman"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 85,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "necromancer",
								"profile": "necromancer"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 89,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spectralNecromancer",
								"profile": "necromancer"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 93,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "tengu",
								"profile": "tengu"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 97,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm300",
								"profile": "dm300"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 101,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yog",
								"profile": "yog"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 105,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "warlock",
								"profile": "warlock"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 109,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "elemental",
								"profile": "elemental"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 113,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "newbornElemental",
								"profile": "newbornElemental"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 117,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yogFist",
								"profile": "yogFist"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 121,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "scorpio",
								"profile": "scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 125,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "acidic",
								"profile": "scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 129,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "guard",
								"profile": "guard"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 133,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm200",
								"profile": "dm200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 137,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm201",
								"profile": "dm201"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 141,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spinner",
								"profile": "spinner"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 145,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "golem",
								"profile": "golem"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 149,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "eye",
								"profile": "eye"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 153,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "gnollTrickster",
								"profile": "gnollTrickster"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 157,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "greatCrab",
								"profile": "greatCrab"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 161,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 78,
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
								"line": 170,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 167,
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
					"tag": "table",
					"attributes": {
						"id": "weaponEnchants",
						"columns": "id:string|trigger:string|weight:number|curse:boolean|description:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "blazing",
								"trigger": "strike",
								"weight": "3",
								"curse": "false",
								"description": "Ignites the victim"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chilling",
								"trigger": "strike",
								"weight": "3",
								"curse": "false",
								"description": "Chills the victim"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 14,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "shocking",
								"trigger": "strike",
								"weight": "3",
								"curse": "false",
								"description": "+2 damage"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 21,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "vampiric",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Heals 1 on a hit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 28,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "grim",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Chance of bonus damage against a weakened foe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 35,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "lucky",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Chance of bonus loot on a kill"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blocking",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Chance to grant a shield on a landed hit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 49,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "kinetic",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Stores part of damage for the next hit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 56,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "corrupting",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Lethal hits can convert the victim into an ally"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 63,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elastic",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Chance to knock the victim backward"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 70,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "projecting",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Extends melee reach"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 77,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blooming",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "Chance to plant grass where you strike"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 84,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable",
								"trigger": "strike",
								"weight": "2",
								"curse": "false",
								"description": "A random enchantment effect on every hit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 91,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wayward",
								"trigger": "strike",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: -3 accuracy"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 98,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "annoying",
								"trigger": "strike",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to alert every monster on the floor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 105,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "dazzling",
								"trigger": "strike",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to blind everyone nearby, including you"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 112,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "explosive",
								"trigger": "strike",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: eventually detonates on its wielder"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 119,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "polarized",
								"trigger": "strike",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: every other hit is amplified, the rest whiff entirely"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 126,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sacrificial",
								"trigger": "strike",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to wound its wielder"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 133,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "displacing",
								"trigger": "strike",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to teleport the struck target away"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 140,
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
					"tag": "table",
					"attributes": {
						"id": "armorGlyphs",
						"columns": "id:string|trigger:string|weight:number|curse:boolean|description:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "stone",
								"trigger": "defend",
								"weight": "3",
								"curse": "false",
								"description": "+2 armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 152,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "thorns",
								"trigger": "defend",
								"weight": "3",
								"curse": "false",
								"description": "Reflects 2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 159,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "flow",
								"trigger": "passive",
								"weight": "3",
								"curse": "false",
								"description": "Moves faster in water"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 166,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "entanglement",
								"trigger": "defend",
								"weight": "2",
								"curse": "false",
								"description": "Chance to root an attacker"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 173,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "swiftness",
								"trigger": "passive",
								"weight": "3",
								"curse": "false",
								"description": "Faster movement when safe (20% speed increase)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 180,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potential",
								"trigger": "defend",
								"weight": "3",
								"curse": "false",
								"description": "Chance to recharge wands when hit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 187,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "repulsion",
								"trigger": "defend",
								"weight": "2",
								"curse": "false",
								"description": "Chance to knock an adjacent attacker backward"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 194,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "brimstone",
								"trigger": "defend",
								"weight": "2",
								"curse": "false",
								"description": "Immune to burning"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 201,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "viscosity",
								"trigger": "defend",
								"weight": "3",
								"curse": "false",
								"description": "Defers part of incoming damage"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 208,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "affection",
								"trigger": "defend",
								"weight": "1",
								"curse": "false",
								"description": "Charms an attacker"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 215,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "antimagic",
								"trigger": "defend",
								"weight": "1",
								"curse": "false",
								"description": "Reduces magical damage"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 222,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "obfuscation",
								"trigger": "passive",
								"weight": "3",
								"curse": "false",
								"description": "Makes the wearer harder to detect"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 229,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "camouflage",
								"trigger": "passive",
								"weight": "2",
								"curse": "false",
								"description": "Trampling grass turns you invisible"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 236,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stench",
								"trigger": "defend",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to release toxic gas when hit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 243,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "antientropy",
								"trigger": "defend",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to drain a wand charge"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 250,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bulk",
								"trigger": "passive",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: slower through doorways"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 257,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "corrosion",
								"trigger": "defend",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to corrode a weapon or armor level"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 264,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "displacement",
								"trigger": "defend",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to teleport its wearer away"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 271,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "metabolism",
								"trigger": "defend",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: consumes extra hunger"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 278,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "multiplicity",
								"trigger": "defend",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to summon a spectral copy of the attacker"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 285,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "overgrowth",
								"trigger": "defend",
								"weight": "1",
								"curse": "true",
								"description": "Cursed: chance to root its wearer in grass"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 292,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 149,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "unstableEnchants",
						"columns": "id:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "blazing"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 304,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blocking"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 307,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blooming"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 310,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chilling"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 313,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "corrupting"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 316,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "kinetic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 319,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "grim"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 322,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "lucky"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 325,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "shocking"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 328,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "vampiric"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 331,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 301,
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
					"tag": "table",
					"attributes": {
						"id": "alchemyEnergy",
						"columns": "kind:string|energy:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"kind": "seed",
								"energy": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "stone",
								"energy": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "scroll",
								"energy": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 15,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "potion",
								"energy": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 19,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "food",
								"energy": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 23,
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
					"tag": "table",
					"attributes": {
						"id": "alchemyRecipes",
						"columns": "id:string|ingredients:list|result:string|resultQuantity:number|energyCost:number",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "stewedMeat1",
								"ingredients": "meat:1",
								"result": "stewedMeat",
								"resultQuantity": "1",
								"energyCost": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 33,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stewedMeat2",
								"ingredients": "meat:2",
								"result": "stewedMeat",
								"resultQuantity": "2",
								"energyCost": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 40,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stewedMeat3",
								"ingredients": "meat:3",
								"result": "stewedMeat",
								"resultQuantity": "3",
								"energyCost": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 47,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "meatPie",
								"ingredients": "pasty:1,food:1,meat:1",
								"result": "meatPie",
								"resultQuantity": "1",
								"energyCost": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 54,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 29,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "alchemyRecipeManifest",
						"columns": "id:string|group:string|javaRecipe:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "liquidMetal",
								"group": "variable",
								"javaRecipe": "LiquidMetal.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 66,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollToStone",
								"group": "one",
								"javaRecipe": "Scroll.ScrollToStone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 71,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "exoticPotion",
								"group": "one",
								"javaRecipe": "ExoticPotion.PotionToExotic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 76,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "exoticScroll",
								"group": "one",
								"javaRecipe": "ExoticScroll.ScrollToExotic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 81,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "arcaneResin",
								"group": "one",
								"javaRecipe": "ArcaneResin.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 86,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "alchemize",
								"group": "one",
								"javaRecipe": "Alchemize.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 91,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stewedMeat1",
								"group": "one",
								"javaRecipe": "StewedMeat.oneMeat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 96,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blandfruit",
								"group": "two",
								"javaRecipe": "Blandfruit.CookFruit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 101,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBomb",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 106,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "alchemicalCatalyst",
								"group": "two",
								"javaRecipe": "AlchemicalCatalyst.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 111,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "arcaneCatalyst",
								"group": "two",
								"javaRecipe": "ArcaneCatalyst.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 116,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elixirArcaneArmor",
								"group": "two",
								"javaRecipe": "ElixirOfArcaneArmor.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 121,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elixirAquaticRejuvenation",
								"group": "two",
								"javaRecipe": "ElixirOfAquaticRejuvenation.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 126,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elixirDragonsBlood",
								"group": "two",
								"javaRecipe": "ElixirOfDragonsBlood.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 131,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elixirIcyTouch",
								"group": "two",
								"javaRecipe": "ElixirOfIcyTouch.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 136,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elixirMight",
								"group": "two",
								"javaRecipe": "ElixirOfMight.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 141,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elixirHoneyedHealing",
								"group": "two",
								"javaRecipe": "ElixirOfHoneyedHealing.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 146,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elixirToxicEssence",
								"group": "two",
								"javaRecipe": "ElixirOfToxicEssence.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 151,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blizzardBrew",
								"group": "two",
								"javaRecipe": "BlizzardBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 156,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "infernalBrew",
								"group": "two",
								"javaRecipe": "InfernalBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 161,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "shockingBrew",
								"group": "two",
								"javaRecipe": "ShockingBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 166,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "causticBrew",
								"group": "two",
								"javaRecipe": "CausticBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 171,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "aquaBlast",
								"group": "two",
								"javaRecipe": "AquaBlast.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 176,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconOfReturning",
								"group": "two",
								"javaRecipe": "BeaconOfReturning.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 181,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curseInfusion",
								"group": "two",
								"javaRecipe": "CurseInfusion.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 186,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "featherFall",
								"group": "two",
								"javaRecipe": "FeatherFall.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 191,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "magicalInfusion",
								"group": "two",
								"javaRecipe": "MagicalInfusion.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 196,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "phaseShift",
								"group": "two",
								"javaRecipe": "PhaseShift.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 201,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "reclaimTrap",
								"group": "two",
								"javaRecipe": "ReclaimTrap.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 206,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "recycle",
								"group": "two",
								"javaRecipe": "Recycle.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 211,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wildEnergy",
								"group": "two",
								"javaRecipe": "WildEnergy.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 216,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "telekineticGrab",
								"group": "two",
								"javaRecipe": "TelekineticGrab.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 221,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "summonElemental",
								"group": "two",
								"javaRecipe": "SummonElemental.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 226,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stewedMeat2",
								"group": "two",
								"javaRecipe": "StewedMeat.twoMeat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 231,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionSeed",
								"group": "three",
								"javaRecipe": "Potion.SeedToPotion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 236,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stewedMeat3",
								"group": "three",
								"javaRecipe": "StewedMeat.threeMeat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 241,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "meatPie",
								"group": "three",
								"javaRecipe": "MeatPie.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 246,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 63,
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
					"tag": "table",
					"attributes": {
						"id": "badgeCatalogue",
						"columns": "id:string|counter:string|target:number|description:string|icon:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "boss1",
								"counter": "boss_goo",
								"target": "1",
								"description": "Slew Goo",
								"icon": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss2",
								"counter": "boss_tengu",
								"target": "1",
								"description": "Slew Tengu",
								"icon": "47"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 14,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss3",
								"counter": "boss_dm300",
								"target": "1",
								"description": "Slew DM-300",
								"icon": "48"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 21,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss4",
								"counter": "boss_king",
								"target": "1",
								"description": "Slew the Dwarf King",
								"icon": "78"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 28,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "victory",
								"counter": "amulet",
								"target": "1",
								"description": "Escaped with the Amulet",
								"icon": "82"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 35,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unlock_mage",
								"counter": "upgrades_used",
								"target": "1",
								"description": "Used an upgrade scroll",
								"icon": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unlock_rogue",
								"counter": "surprises",
								"target": "10",
								"description": "10 surprise attacks",
								"icon": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 49,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unlock_huntress",
								"counter": "throws",
								"target": "10",
								"description": "10 thrown attacks",
								"icon": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 56,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unlock_duelist",
								"counter": "weapon_plus2",
								"target": "1",
								"description": "Raised a weapon to +2",
								"icon": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 63,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "death_trap",
								"counter": "death_trap",
								"target": "1",
								"description": "Died to a trap",
								"icon": "81"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 70,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "death_fire",
								"counter": "death_fire",
								"target": "1",
								"description": "Died to fire",
								"icon": "16"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 77,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "death_poison",
								"counter": "death_poison",
								"target": "1",
								"description": "Died to poison",
								"icon": "17"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 84,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "death_hunger",
								"counter": "death_hunger",
								"target": "1",
								"description": "Starved to death",
								"icon": "19"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 91,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "death_foe",
								"counter": "death_foe",
								"target": "1",
								"description": "Slain by a foe",
								"icon": "104"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 98,
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
								"apply_to": "negative",
								"set": "poison,burning,bleeding,cripple,weakness,vulnerable,paralysis,roots,terror,amok,aggression,ooze,charm,degrade,daze,chill,frost,hex"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 7,
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
				},
				{
					"tag": "table",
					"attributes": {
						"id": "buffDurations",
						"columns": "buff:string|duration:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"buff": "bless",
								"duration": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "hex",
								"duration": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 20,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "daze",
								"duration": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 24,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "chill",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 28,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "frost",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 32,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "drowsy",
								"duration": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 36,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "magicalSleep",
								"duration": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 40,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "fury",
								"duration": "9999"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 44,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "berserk",
								"duration": "9999"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 48,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "weakness",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 52,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "vulnerable",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 56,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "burning",
								"duration": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 60,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "poison",
								"duration": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 64,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "bleeding",
								"duration": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 68,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "cripple",
								"duration": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 72,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "paralysis",
								"duration": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 76,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "roots",
								"duration": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 80,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "levitation",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 84,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "invisibility",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 88,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "cloak",
								"duration": "9999"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 92,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "focus",
								"duration": "9999"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 96,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "recharging",
								"duration": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 100,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "frostImbue",
								"duration": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 104,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "adrenalineSurge",
								"duration": "200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 108,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "mindvision",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 112,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "terror",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 116,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "amok",
								"duration": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 120,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "aggression",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 124,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "awareness",
								"duration": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 128,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "haste",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 132,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "degrade",
								"duration": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 136,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "ooze",
								"duration": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 140,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "charm",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 144,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "lethalHasteCooldown",
								"duration": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 148,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
						"line": 13,
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
					"tag": "table",
					"attributes": {
						"id": "curseDefinitions",
						"columns": "id:string|type:string|locks:boolean|nameKey:string|descriptionKey:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "wayward",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.wayward.name",
								"descriptionKey": "items.weapon.curses.wayward.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "annoying",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.annoying.name",
								"descriptionKey": "items.weapon.curses.annoying.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 14,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "dazzling",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.dazzling.name",
								"descriptionKey": "items.weapon.curses.dazzling.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 21,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "displacing",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.displacing.name",
								"descriptionKey": "items.weapon.curses.displacing.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 28,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "explosive",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.explosive.name",
								"descriptionKey": "items.weapon.curses.explosive.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 35,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "friendly",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.friendly.name",
								"descriptionKey": "items.weapon.curses.friendly.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "polarized",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.polarized.name",
								"descriptionKey": "items.weapon.curses.polarized.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 49,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sacrificial",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.sacrificial.name",
								"descriptionKey": "items.weapon.curses.sacrificial.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 56,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stench",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.stench.name",
								"descriptionKey": "items.armor.curses.stench.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 63,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "antientropy",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.antientropy.name",
								"descriptionKey": "items.armor.curses.antientropy.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 70,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bulk",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.bulk.name",
								"descriptionKey": "items.armor.curses.bulk.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 77,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "corrosion",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.corrosion.name",
								"descriptionKey": "items.armor.curses.corrosion.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 84,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "displacement",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.displacement.name",
								"descriptionKey": "items.armor.curses.displacement.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 91,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "metabolism",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.metabolism.name",
								"descriptionKey": "items.armor.curses.metabolism.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 98,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "multiplicity",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.multiplicity.name",
								"descriptionKey": "items.armor.curses.multiplicity.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 105,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "overgrowth",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.overgrowth.name",
								"descriptionKey": "items.armor.curses.overgrowth.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 112,
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
					"tag": "table",
					"attributes": {
						"id": "monsterRosterFallback",
						"columns": "region:string|roster:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"region": "sewers",
								"roster": "skeleton,thief,dm100,dm100,guard,guard,necromancer,necromancer"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 8,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "caves",
								"roster": "bat,brute,shaman,shaman,spinner,spinner,dm200,dm200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 12,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "city",
								"roster": "elemental,warlock,warlock,monk,monk,golem,golem,golem"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "halls",
								"roster": "succubus,eye,eye,scorpio,scorpio,scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 20,
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
				},
				{
					"tag": "table",
					"attributes": {
						"id": "monsterRosterByDepth",
						"columns": "depth:number|roster:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"depth": "1",
								"roster": "rat,rat,rat,snake"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 30,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "2",
								"roster": "rat,rat,snake,gnoll,gnoll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 34,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "3",
								"roster": "rat,snake,gnoll,gnoll,gnoll,swarm,crab"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 38,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "4",
								"roster": "gnoll,swarm,crab,crab,slime,slime"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "6",
								"roster": "skeleton,skeleton,skeleton,thief,swarm"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 46,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "7",
								"roster": "skeleton,skeleton,skeleton,thief,dm100,guard"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 50,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "8",
								"roster": "skeleton,skeleton,thief,dm100,dm100,guard,guard,necromancer"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 54,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "9",
								"roster": "skeleton,thief,dm100,dm100,guard,guard,necromancer,necromancer"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 58,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "11",
								"roster": "bat,bat,bat,brute,shaman"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 62,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "12",
								"roster": "bat,bat,brute,brute,shaman,spinner"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 66,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "13",
								"roster": "bat,brute,brute,shaman,shaman,spinner,spinner,dm200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 70,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "14",
								"roster": "bat,brute,shaman,shaman,spinner,spinner,dm200,dm200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 74,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "16",
								"roster": "ghoul,ghoul,ghoul,elemental,warlock"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 78,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "17",
								"roster": "ghoul,elemental,elemental,warlock,monk"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 82,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "18",
								"roster": "ghoul,elemental,warlock,warlock,monk,monk,golem"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 86,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "19",
								"roster": "elemental,warlock,warlock,monk,monk,golem,golem,golem"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 90,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "21",
								"roster": "succubus,succubus,eye"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 94,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "22",
								"roster": "succubus,eye"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 98,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "23",
								"roster": "succubus,eye,eye,scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 102,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "24",
								"roster": "succubus,eye,eye,scorpio,scorpio,scorpio"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
								"line": 106,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
						"line": 26,
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
					"tag": "table",
					"attributes": {
						"id": "regionTrapTables",
						"columns": "region:string|kinds:list|weights:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"region": "prison",
								"kinds": "chilling,shocking,toxic,burning,poisonDart,alarm,ooze,gripping,confusion,flock,summoning,teleportation,gateway,geyser",
								"weights": "4,4,4,4,4,2,2,2,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 34,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "caves",
								"kinds": "burning,poisonDart,frost,storm,corrosion,gripping,rockfall,guardian,confusion,summoning,warping,pitfall,gateway,geyser",
								"weights": "4,4,4,4,4,2,2,2,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 39,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "city",
								"kinds": "frost,storm,corrosion,blazing,disintegration,rockfall,flashing,guardian,weakening,disarming,summoning,warping,cursing,pitfall,distortion,gateway,geyser",
								"weights": "4,4,4,4,4,2,2,2,2,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 44,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "halls",
								"kinds": "frost,storm,corrosion,blazing,disintegration,rockfall,flashing,guardian,weakening,disarming,summoning,warping,cursing,grim,pitfall,distortion,gateway,geyser",
								"weights": "4,4,4,4,4,2,2,2,2,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 49,
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
					"tag": "table",
					"attributes": {
						"id": "regionPaintRules",
						"columns": "region:string|waterNormal:number|waterFeeling:number|grassNormal:number|grassFeeling:number|waterSmoothness:number|grassSmoothness:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"region": "sewers",
								"waterNormal": "0.3",
								"waterFeeling": "0.85",
								"grassNormal": "0.2",
								"grassFeeling": "0.8",
								"waterSmoothness": "5",
								"grassSmoothness": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 59,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "prison",
								"waterNormal": "0.3",
								"waterFeeling": "0.9",
								"grassNormal": "0.2",
								"grassFeeling": "0.8",
								"waterSmoothness": "4",
								"grassSmoothness": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 68,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "caves",
								"waterNormal": "0.3",
								"waterFeeling": "0.85",
								"grassNormal": "0.15",
								"grassFeeling": "0.65",
								"waterSmoothness": "6",
								"grassSmoothness": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 77,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "city",
								"waterNormal": "0.3",
								"waterFeeling": "0.90",
								"grassNormal": "0.2",
								"grassFeeling": "0.8",
								"waterSmoothness": "4",
								"grassSmoothness": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 86,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "halls",
								"waterNormal": "0.15",
								"waterFeeling": "0.70",
								"grassNormal": "0.10",
								"grassFeeling": "0.65",
								"waterSmoothness": "6",
								"grassSmoothness": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 95,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 56,
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
					"tag": "table",
					"attributes": {
						"id": "floorSetTierProbs",
						"columns": "index:number|chances:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"index": "0",
								"chances": "0,75,20,4,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"index": "1",
								"chances": "0,25,50,20,5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
								"line": 11,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"index": "2",
								"chances": "0,0,40,50,10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
								"line": 15,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"index": "3",
								"chances": "0,0,20,40,40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
								"line": 19,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"index": "4",
								"chances": "0,0,0,20,80"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
								"line": 23,
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
					"tag": "table",
					"attributes": {
						"id": "monsterLoot",
						"columns": "monster:string|chance:number|kind:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"monster": "snake",
								"chance": "0.25",
								"kind": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "rotLasher",
								"chance": "0.75",
								"kind": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 12,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "gnoll",
								"chance": "0.5",
								"kind": "gold"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 17,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "crab",
								"chance": "0.1666666667",
								"kind": "meat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 22,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "albino",
								"chance": "1",
								"kind": "meat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 27,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "causticSlime",
								"chance": "0.5",
								"kind": "meat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 32,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "bandit",
								"chance": "1",
								"kind": "gold"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 37,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spectralNecromancer",
								"chance": "0.2",
								"kind": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "armoredBrute",
								"chance": "1",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 47,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm201",
								"chance": "0.125",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 52,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "senior",
								"chance": "1",
								"kind": "food"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 57,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "acidic",
								"chance": "1",
								"kind": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 62,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "piranha",
								"chance": "1",
								"kind": "meat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 67,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm100",
								"chance": "0.25",
								"kind": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 72,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "guard",
								"chance": "0.2",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 77,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "necromancer",
								"chance": "0.2",
								"kind": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 82,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "bat",
								"chance": "0.1666666667",
								"kind": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 87,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "brute",
								"chance": "0.5",
								"kind": "gold"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 92,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "shaman",
								"chance": "0.03",
								"kind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 97,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spinner",
								"chance": "0.125",
								"kind": "meat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 102,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm200",
								"chance": "0.2",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 107,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "gnollTrickster",
								"chance": "1",
								"kind": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 112,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "greatCrab",
								"chance": "1",
								"kind": "meat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 117,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ghoul",
								"chance": "0.2",
								"kind": "gold"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 122,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "monk",
								"chance": "0.1",
								"kind": "food"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 127,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "golem",
								"chance": "0.2",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 132,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "eye",
								"chance": "1",
								"kind": "dewdrop"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 137,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "demonSpawner",
								"chance": "1",
								"kind": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 142,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "slime",
								"chance": "0.2",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 147,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "skeleton",
								"chance": "0.1666666667",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 152,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "thief",
								"chance": "0.03",
								"kind": "ring"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 157,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "swarm",
								"chance": "0.1666666667",
								"kind": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 162,
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
					"tag": "table",
					"attributes": {
						"id": "limitedDropDecay",
						"columns": "monster:string|mode:string|value:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"monster": "bat",
								"mode": "linear",
								"value": "7"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 172,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "necromancer",
								"mode": "linear",
								"value": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 177,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "guard",
								"mode": "power",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 182,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm200",
								"mode": "power",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 187,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "golem",
								"mode": "power",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 192,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "shaman",
								"mode": "power",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 197,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "slime",
								"mode": "power",
								"value": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 202,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "skeleton",
								"mode": "power",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 207,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "thief",
								"mode": "power",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 212,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "swarm",
								"mode": "linear",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 217,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
						"line": 169,
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
					"tag": "table",
					"attributes": {
						"id": "missileDefinitions",
						"columns": "id:string|sourceClass:string|tier:number|minDamage:number|maxDamage:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "missile_throwingstone",
								"sourceClass": "ThrowingStone",
								"tier": "1",
								"minDamage": "2",
								"maxDamage": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 98,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_throwingknife",
								"sourceClass": "ThrowingKnife",
								"tier": "1",
								"minDamage": "2",
								"maxDamage": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 105,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_throwingspike",
								"sourceClass": "ThrowingSpike",
								"tier": "1",
								"minDamage": "2",
								"maxDamage": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 112,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_fishingspear",
								"sourceClass": "FishingSpear",
								"tier": "2",
								"minDamage": "4",
								"maxDamage": "10"
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
							"tag": "row",
							"attributes": {
								"id": "missile_throwingclub",
								"sourceClass": "ThrowingClub",
								"tier": "2",
								"minDamage": "4",
								"maxDamage": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 126,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_shuriken",
								"sourceClass": "Shuriken",
								"tier": "2",
								"minDamage": "4",
								"maxDamage": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 133,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_throwingspear",
								"sourceClass": "ThrowingSpear",
								"tier": "3",
								"minDamage": "6",
								"maxDamage": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 140,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_kunai",
								"sourceClass": "Kunai",
								"tier": "3",
								"minDamage": "6",
								"maxDamage": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 147,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_bolas",
								"sourceClass": "Bolas",
								"tier": "3",
								"minDamage": "6",
								"maxDamage": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 154,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_javelin",
								"sourceClass": "Javelin",
								"tier": "4",
								"minDamage": "8",
								"maxDamage": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 161,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_tomahawk",
								"sourceClass": "Tomahawk",
								"tier": "4",
								"minDamage": "8",
								"maxDamage": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 168,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_heavyboomerang",
								"sourceClass": "HeavyBoomerang",
								"tier": "4",
								"minDamage": "8",
								"maxDamage": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 175,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_trident",
								"sourceClass": "Trident",
								"tier": "5",
								"minDamage": "10",
								"maxDamage": "25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 182,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_throwinghammer",
								"sourceClass": "ThrowingHammer",
								"tier": "5",
								"minDamage": "10",
								"maxDamage": "25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 189,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_forcecube",
								"sourceClass": "ForceCube",
								"tier": "5",
								"minDamage": "10",
								"maxDamage": "25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 196,
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
								"line": 208,
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
								"line": 212,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 205,
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
								"line": 220,
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
								"line": 224,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 217,
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
								"line": 232,
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
								"line": 236,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 229,
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
								"line": 244,
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
								"line": 248,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 241,
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
								"line": 256,
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
								"line": 260,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 253,
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
					"tag": "table",
					"attributes": {
						"id": "standardRoomChances",
						"columns": "depth:number|chances:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"depth": "1",
								"chances": "10,10,10,5,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,1,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 8,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "2",
								"chances": "10,10,10,5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 12,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "5",
								"chances": "10,10,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 16,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "6",
								"chances": "10,0,0,0,10,10,5,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 20,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "11",
								"chances": "10,0,0,0,0,0,0,10,10,5,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 24,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "16",
								"chances": "10,0,0,0,0,0,0,0,0,0,10,10,5,0,0,0,1,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 28,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "21",
								"chances": "10,0,0,0,0,0,0,0,0,0,0,0,0,10,10,5,1,1,1,1,1,1,1,1,1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 32,
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
					"tag": "table",
					"attributes": {
						"id": "regionRoomCounts",
						"columns": "region:string|standardMax:number|standardBase:number|standardWeights:list|specialMax:number|specialBase:number|specialWeights:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"region": "sewers",
								"standardMax": "6",
								"standardBase": "4",
								"standardWeights": "1,3,1",
								"specialMax": "2",
								"specialBase": "1",
								"specialWeights": "1,4"
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
							"tag": "row",
							"attributes": {
								"region": "prison",
								"standardMax": "6",
								"standardBase": "5",
								"standardWeights": "1,1",
								"specialMax": "3",
								"specialBase": "1",
								"specialWeights": "1,3,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 51,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "caves",
								"standardMax": "7",
								"standardBase": "6",
								"standardWeights": "2,1",
								"specialMax": "3",
								"specialBase": "2",
								"specialWeights": "4,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 60,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "city",
								"standardMax": "8",
								"standardBase": "6",
								"standardWeights": "1,3,1",
								"specialMax": "3",
								"specialBase": "2",
								"specialWeights": "2,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 69,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "halls",
								"standardMax": "9",
								"standardBase": "8",
								"standardWeights": "2,1",
								"specialMax": "3",
								"specialBase": "2",
								"specialWeights": "1,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 78,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 38,
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
								"line": 92,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 89,
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
								"line": 101,
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
								"line": 105,
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
								"line": 109,
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
								"line": 113,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 98,
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
								"apply_to": "classes",
								"set": "tunnel,bridge,perimeter,walkway,ringTunnel,ringBridge"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 122,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 119,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "connectionRoomChanceRows",
						"columns": "depth:number|chances:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"depth": "1",
								"chances": "20,1,0,2,2,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 132,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "2",
								"chances": "20,1,0,2,2,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 136,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "3",
								"chances": "20,1,0,2,2,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 140,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "4",
								"chances": "20,1,0,2,2,1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 144,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "5",
								"chances": "20,0,0,0,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 148,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "6",
								"chances": "0,0,22,3,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 152,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "7",
								"chances": "0,0,22,3,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 156,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "8",
								"chances": "0,0,22,3,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 160,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "9",
								"chances": "0,0,22,3,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 164,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "10",
								"chances": "0,0,22,3,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
								"line": 168,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 128,
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
					"tag": "table",
					"attributes": {
						"id": "bossTransitions",
						"columns": "depth:number|kind:string|next:string|victory:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"depth": "5",
								"kind": "goo",
								"next": "continue",
								"victory": "Goo bursts apart in a spray of ooze. You have slain the Sewers boss!"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 7,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "10",
								"kind": "tengu",
								"next": "continue",
								"victory": "Tengu collapses, his tricks spent at last. You have slain the Prison boss!"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 13,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "15",
								"kind": "dm300",
								"next": "continue",
								"victory": "DM-300 grinds to a halt. You have slain the Caves boss!"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 19,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "20",
								"kind": "king",
								"next": "continue",
								"victory": "The Dwarf King crumbles from his throne. You have slain the City boss!"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 25,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "25",
								"kind": "yog",
								"next": "continue",
								"victory": "Yog-Dzewa dissolves into screaming dark. The Amulet lies before you..."
							},
							"children": [],
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
						"line": 4,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "scenarioChapters",
						"columns": "id:string|firstDepth:number|bossDepth:number|bossKind:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "sewers",
								"firstDepth": "1",
								"bossDepth": "5",
								"bossKind": "goo"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 42,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "prison",
								"firstDepth": "6",
								"bossDepth": "10",
								"bossKind": "tengu"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 48,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "caves",
								"firstDepth": "11",
								"bossDepth": "15",
								"bossKind": "dm300"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 54,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "city",
								"firstDepth": "16",
								"bossDepth": "20",
								"bossKind": "king"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 60,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "halls",
								"firstDepth": "21",
								"bossDepth": "25",
								"bossKind": "yog"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 66,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 39,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "scenarioQuests",
						"columns": "id:string|depths:list|rollBase:number",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "ghost",
								"depths": "2,3,4",
								"rollBase": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 78,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wandmaker",
								"depths": "7,8,9",
								"rollBase": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 83,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "shopkeeper",
								"depths": "6,11,16,21",
								"rollBase": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 88,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blacksmith",
								"depths": "12,13,14",
								"rollBase": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 93,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "imp",
								"depths": "17,18,19",
								"rollBase": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 98,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 74,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "questDefinitions",
						"columns": "id:string|conditionSwitch:string|description:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "sadGhost",
								"conditionSwitch": "ghostTargetSlain",
								"description": "Slay the ghost's tormentor."
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 108,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wandmaker",
								"conditionSwitch": "wandQuestDone",
								"description": "Bring the wandmaker a scroll."
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 113,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blacksmith",
								"conditionSwitch": "blacksmithDone",
								"description": "Complete the Blacksmith quest."
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 118,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "imp",
								"conditionSwitch": "impDone",
								"description": "Bring dwarf tokens."
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 123,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 105,
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
								"apply_to": "tier_thresholds",
								"set": "0,2,7,13,21,31"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 7,
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
				},
				{
					"tag": "table",
					"attributes": {
						"id": "talentSubclassEntries",
						"columns": "subclass:string|talents:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"subclass": "berserker",
								"talents": "endless_rage,deathless_fury,enraged_catalyst"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 17,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "gladiator",
								"talents": "cleave,lethal_defense,enhanced_combo"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 21,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "battlemage",
								"talents": "empowered_strike,mystical_charge,excess_charge"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 25,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "warlock",
								"talents": "soul_eater,soul_siphon,necromancers_minions"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 29,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "assassin",
								"talents": "enhanced_lethality,assassins_reach,bounty_hunter"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 33,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "freerunner",
								"talents": "evasive_armor,projectile_momentum,speedy_stealth"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 37,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "sniper",
								"talents": "farsight,shared_enchantment,shared_upgrades"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 41,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "warden",
								"talents": "durable_tips,barkskin,shielding_dew"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 45,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "champion",
								"talents": "secondary_charge,twin_upgrades,combined_lethality"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 49,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "monk_sub",
								"talents": "unencumbered_spirit,monastic_vigor,combined_energy"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 53,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
						"line": 13,
						"column": 1
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "talentClassEntries",
						"columns": "class:string|tier:number|talents:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"class": "warrior",
								"tier": "1",
								"talents": "hearty_meal,veterans_intuition,test_subject,iron_will"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 63,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "warrior",
								"tier": "2",
								"talents": "iron_stomach,restored_willpower,runic_transference,lethal_momentum,improvised_projectiles"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 68,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "mage",
								"tier": "1",
								"talents": "empowering_meal,scholars_intuition,tested_hypothesis,backup_barrier"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 73,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "mage",
								"tier": "2",
								"talents": "energizing_meal,energizing_upgrade,wand_preservation,arcane_vision,shield_battery"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 78,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "rogue",
								"tier": "1",
								"talents": "cached_rations,thiefs_intuition,sucker_punch,protective_shadows"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 83,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "rogue",
								"tier": "2",
								"talents": "mystical_meal,mystical_upgrade,wide_search,silent_steps,rogues_foresight"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 88,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "huntress",
								"tier": "1",
								"talents": "natures_bounty,survivalists_intuition,followup_strike,natures_aid"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 93,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "huntress",
								"tier": "2",
								"talents": "invigorating_meal,restored_nature,rejuvenating_steps,heightened_senses,durable_projectiles"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 98,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "duelist",
								"tier": "1",
								"talents": "strengthening_meal,adventurers_intuition,patient_strike,aggressive_barrier"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 103,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "duelist",
								"tier": "2",
								"talents": "focused_meal,restored_agility,weapon_recharging,lethal_haste,swift_equip"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 108,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "cleric",
								"tier": "1",
								"talents": "empowering_meal,scholars_intuition,tested_hypothesis,backup_barrier"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 113,
								"column": 1
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"class": "cleric",
								"tier": "2",
								"talents": "energizing_meal,energizing_upgrade,wand_preservation,arcane_vision,shield_battery"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 118,
								"column": 1
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
						"line": 59,
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
