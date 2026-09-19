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
								"set": "bat,bee,elemental,newbornElemental,eye,swarm,ghost,spiritHawk,wraith,dustWraith"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 12,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "blobImmune",
								"set": "spiritHawk,piranha"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 21,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "npc",
								"set": "ghost,wandmaker,shopkeeper,blacksmith,imp,ratKing,impShopkeeper"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 26,
								"column": 13
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
								"line": 31,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "miniboss",
								"set": "fetidRat,gnollTrickster,greatCrab,demonSpawner,pylon,rotHeart,rotLasher,newbornElemental"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 42,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "undead",
								"set": "king,ghoul,guard,monk,senior,necromancer,spectralNecromancer,ripperDemon,skeleton,necroSkeleton,thief,bandit,warlock,wraith,dustWraith"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 54,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "demonic",
								"set": "demonSpawner,eye,fetidRat,goo,mimic,crystalMimic,ripperDemon,scorpio,acidic,succubus,yog,yogFist,larva"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 59,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "immovable",
								"set": "dm201,sentry,rotHeart,rotLasher,pylon,demonSpawner,yog,blacksmith,ninjaLog"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 67,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "inorganic",
								"set": "dm100,dm200,dm201,dm300,golem,skeleton,necroSkeleton,statue,armoredStatue,pylon,wraith,dustWraith,ninjaLog"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 76,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "never_sleeps",
								"set": "fetidRat,gnollTrickster,greatCrab,demonSpawner,sentry,rotHeart,rotLasher,newbornElemental,pylon,wraith,dustWraith"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 81,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 93,
								"column": 13
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
								"line": 98,
								"column": 13
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
								"line": 103,
								"column": 13
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
								"line": 108,
								"column": 13
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
								"line": 113,
								"column": 13
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
								"line": 118,
								"column": 13
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
								"line": 123,
								"column": 13
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
								"line": 128,
								"column": 13
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
								"line": 133,
								"column": 13
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
								"line": 138,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "dustWraith",
								"base": "wraith"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 143,
								"column": 13
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
								"line": 148,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 88,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "heroBaseStats",
						"columns": "id:string|hp:number|max_hp:number|strength:number|attack_skill:number|defense_skill:number|base_evasion:number|base_gold:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "spdHero",
								"hp": "20",
								"max_hp": "20",
								"strength": "10",
								"attack_skill": "10",
								"defense_skill": "5",
								"base_evasion": "5",
								"base_gold": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 159,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 155,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "heroLevelGrowth",
						"columns": "id:string|hp_per_level:number|attack_skill_per_level:number|defense_skill_per_level:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "spdHeroLevelGrowth",
								"hp_per_level": "5",
								"attack_skill_per_level": "1",
								"defense_skill_per_level": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 167,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 163,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "monsterDepthStats",
						"columns": "monster:string|hp_base:number|hp_per_depth:number|accuracy_base:number|accuracy_per_depth:number|evasion_base:number|evasion_per_depth:number|evasion_divisor:number|damage_min_base:number|damage_min_per_depth:number|damage_min_divisor:number|damage_min_floor:number|damage_max_base:number|damage_max_per_depth:number|damage_max_divisor:number|damage_max_floor:number|armor_min_base:number|armor_min_per_depth:number|armor_min_divisor:number|armor_max_base:number|armor_max_per_depth:number|armor_max_divisor:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"monster": "mimic",
								"hp_base": "6",
								"hp_per_depth": "6",
								"accuracy_base": "6",
								"accuracy_per_depth": "1",
								"evasion_base": "4",
								"evasion_per_depth": "1",
								"evasion_divisor": "2",
								"damage_min_base": "1",
								"damage_min_per_depth": "1",
								"damage_min_divisor": "0",
								"damage_min_floor": "0",
								"damage_max_base": "2",
								"damage_max_per_depth": "2",
								"damage_max_divisor": "0",
								"damage_max_floor": "0",
								"armor_min_base": "0",
								"armor_min_per_depth": "0",
								"armor_min_divisor": "0",
								"armor_max_base": "2",
								"armor_max_per_depth": "1",
								"armor_max_divisor": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 175,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "crystalMimic",
								"hp_base": "6",
								"hp_per_depth": "6",
								"accuracy_base": "6",
								"accuracy_per_depth": "1",
								"evasion_base": "4",
								"evasion_per_depth": "1",
								"evasion_divisor": "2",
								"damage_min_base": "1",
								"damage_min_per_depth": "1",
								"damage_min_divisor": "0",
								"damage_min_floor": "0",
								"damage_max_base": "2",
								"damage_max_per_depth": "2",
								"damage_max_divisor": "0",
								"damage_max_floor": "0",
								"armor_min_base": "0",
								"armor_min_per_depth": "0",
								"armor_min_divisor": "0",
								"armor_max_base": "2",
								"armor_max_per_depth": "1",
								"armor_max_divisor": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 176,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "piranha",
								"hp_base": "10",
								"hp_per_depth": "5",
								"accuracy_base": "20",
								"accuracy_per_depth": "2",
								"evasion_base": "10",
								"evasion_per_depth": "2",
								"evasion_divisor": "0",
								"damage_min_base": "0",
								"damage_min_per_depth": "1",
								"damage_min_divisor": "0",
								"damage_min_floor": "0",
								"damage_max_base": "4",
								"damage_max_per_depth": "2",
								"damage_max_divisor": "0",
								"damage_max_floor": "0",
								"armor_min_base": "0",
								"armor_min_per_depth": "0",
								"armor_min_divisor": "0",
								"armor_max_base": "0",
								"armor_max_per_depth": "1",
								"armor_max_divisor": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 177,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "bee",
								"hp_base": "8",
								"hp_per_depth": "4",
								"accuracy_base": "9",
								"accuracy_per_depth": "1",
								"evasion_base": "9",
								"evasion_per_depth": "1",
								"evasion_divisor": "0",
								"damage_min_base": "8",
								"damage_min_per_depth": "4",
								"damage_min_divisor": "10",
								"damage_min_floor": "1",
								"damage_max_base": "8",
								"damage_max_per_depth": "4",
								"damage_max_divisor": "4",
								"damage_max_floor": "1",
								"armor_min_base": "0",
								"armor_min_per_depth": "0",
								"armor_min_divisor": "0",
								"armor_max_base": "0",
								"armor_max_per_depth": "0",
								"armor_max_divisor": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 178,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "statue",
								"hp_base": "15",
								"hp_per_depth": "5",
								"accuracy_base": "9",
								"accuracy_per_depth": "1",
								"evasion_base": "4",
								"evasion_per_depth": "1",
								"evasion_divisor": "0",
								"damage_min_base": "2",
								"damage_min_per_depth": "0",
								"damage_min_divisor": "0",
								"damage_min_floor": "0",
								"damage_max_base": "8",
								"damage_max_per_depth": "1",
								"damage_max_divisor": "0",
								"damage_max_floor": "0",
								"armor_min_base": "0",
								"armor_min_per_depth": "0",
								"armor_min_divisor": "0",
								"armor_max_base": "2",
								"armor_max_per_depth": "1",
								"armor_max_divisor": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 179,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "armoredStatue",
								"hp_base": "30",
								"hp_per_depth": "10",
								"accuracy_base": "9",
								"accuracy_per_depth": "1",
								"evasion_base": "4",
								"evasion_per_depth": "1",
								"evasion_divisor": "0",
								"damage_min_base": "2",
								"damage_min_per_depth": "0",
								"damage_min_divisor": "0",
								"damage_min_floor": "0",
								"damage_max_base": "8",
								"damage_max_per_depth": "1",
								"damage_max_divisor": "0",
								"damage_max_floor": "0",
								"armor_min_base": "0",
								"armor_min_per_depth": "0",
								"armor_min_divisor": "0",
								"armor_max_base": "4",
								"armor_max_per_depth": "1",
								"armor_max_divisor": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 180,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "sentry",
								"hp_base": "0",
								"hp_per_depth": "0",
								"accuracy_base": "20",
								"accuracy_per_depth": "2",
								"evasion_base": "0",
								"evasion_per_depth": "0",
								"evasion_divisor": "0",
								"damage_min_base": "0",
								"damage_min_per_depth": "0",
								"damage_min_divisor": "0",
								"damage_min_floor": "0",
								"damage_max_base": "0",
								"damage_max_per_depth": "0",
								"damage_max_divisor": "0",
								"damage_max_floor": "0",
								"armor_min_base": "0",
								"armor_min_per_depth": "0",
								"armor_min_divisor": "0",
								"armor_max_base": "0",
								"armor_max_per_depth": "0",
								"armor_max_divisor": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 181,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 171,
						"column": 9
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
								"line": 190,
								"column": 13
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
								"line": 195,
								"column": 13
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
								"line": 200,
								"column": 13
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
								"line": 205,
								"column": 13
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
								"line": 210,
								"column": 13
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
								"line": 215,
								"column": 13
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
								"line": 220,
								"column": 13
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
								"line": 225,
								"column": 13
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
								"line": 230,
								"column": 13
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
								"line": 235,
								"column": 13
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
								"line": 240,
								"column": 13
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
								"line": 245,
								"column": 13
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
								"line": 250,
								"column": 13
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
								"line": 255,
								"column": 13
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
								"line": 260,
								"column": 13
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
								"line": 265,
								"column": 13
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
								"line": 270,
								"column": 13
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
								"line": 275,
								"column": 13
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
								"line": 280,
								"column": 13
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
								"line": 285,
								"column": 13
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
								"line": 290,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ripperDemon",
								"profile": "ripperDemon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 295,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 185,
						"column": 9
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
								"set": "dm100,shaman,necromancer,tengu,dm300,yog,warlock,elemental,newbornElemental,yogFist,scorpio,guard,dm200,dm201,spinner,golem,eye,gnollTrickster,greatCrab,ripperDemon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
								"line": 307,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
						"line": 302,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\actor-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 20,
								"column": 13
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
								"line": 28,
								"column": 13
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
								"line": 36,
								"column": 13
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
								"line": 44,
								"column": 13
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
								"line": 52,
								"column": 13
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
								"line": 60,
								"column": 13
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
								"line": 68,
								"column": 13
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
								"line": 76,
								"column": 13
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
								"line": 84,
								"column": 13
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
								"line": 92,
								"column": 13
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
								"line": 100,
								"column": 13
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
								"line": 108,
								"column": 13
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
								"line": 116,
								"column": 13
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
								"line": 124,
								"column": 13
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
								"line": 132,
								"column": 13
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
								"line": 140,
								"column": 13
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
								"line": 148,
								"column": 13
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
								"line": 156,
								"column": 13
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
								"line": 164,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 179,
								"column": 13
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
								"line": 187,
								"column": 13
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
								"line": 195,
								"column": 13
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
								"line": 203,
								"column": 13
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
								"line": 211,
								"column": 13
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
								"line": 219,
								"column": 13
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
								"line": 227,
								"column": 13
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
								"line": 235,
								"column": 13
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
								"line": 243,
								"column": 13
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
								"line": 251,
								"column": 13
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
								"line": 259,
								"column": 13
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
								"line": 267,
								"column": 13
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
								"line": 275,
								"column": 13
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
								"line": 283,
								"column": 13
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
								"line": 291,
								"column": 13
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
								"line": 299,
								"column": 13
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
								"line": 307,
								"column": 13
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
								"line": 315,
								"column": 13
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
								"line": 323,
								"column": 13
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
								"line": 331,
								"column": 13
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
								"line": 339,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 174,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "unstableEnchants",
						"columns": "id:string|enchant:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-blazing",
								"enchant": "blazing"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 354,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-blocking",
								"enchant": "blocking"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 359,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-blooming",
								"enchant": "blooming"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 364,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-chilling",
								"enchant": "chilling"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 369,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-kinetic",
								"enchant": "kinetic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 374,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-corrupting",
								"enchant": "corrupting"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 379,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-elastic",
								"enchant": "elastic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 384,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-grim",
								"enchant": "grim"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 389,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-lucky",
								"enchant": "lucky"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 394,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-shocking",
								"enchant": "shocking"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 399,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "unstable-vampiric",
								"enchant": "vampiric"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
								"line": 404,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
						"line": 349,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\affix-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
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
								"line": 22,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "scrollPrismatic",
								"energy": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 28,
								"column": 13
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
								"line": 33,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "potionShrouding",
								"energy": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 39,
								"column": 13
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
								"line": 44,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "infernalBrew",
								"energy": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 51,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "blizzardBrew",
								"energy": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 56,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "shockingBrew",
								"energy": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 61,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "causticBrew",
								"energy": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 66,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "alchemyKnownEnergy",
						"columns": "item:string|energy:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "potionStrength",
								"energy": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 77,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionExperience",
								"energy": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 78,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollUpgrade",
								"energy": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 79,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollTransmutation",
								"energy": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 80,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 73,
						"column": 9
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
								"line": 90,
								"column": 13
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
								"line": 98,
								"column": 13
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
								"line": 106,
								"column": 13
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
								"line": 114,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionSeed",
								"ingredients": "seed:3",
								"result": "potionHealing",
								"resultQuantity": "1",
								"energyCost": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 122,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollToStone",
								"ingredients": "scrollIdentify:1",
								"result": "stoneOfIntuition",
								"resultQuantity": "2",
								"energyCost": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 130,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollToExotic",
								"ingredients": "scrollMirror:1",
								"result": "scrollPrismatic",
								"resultQuantity": "1",
								"energyCost": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 143,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionToExotic",
								"ingredients": "potionInvis:1",
								"result": "potionShrouding",
								"resultQuantity": "1",
								"energyCost": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 156,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "alchemicalCatalyst",
								"ingredients": "potionHealing:1,seed:1",
								"result": "alchemicalCatalyst",
								"resultQuantity": "1",
								"energyCost": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 164,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "arcaneCatalyst",
								"ingredients": "scrollIdentify:1,stoneOfIntuition:1",
								"result": "arcaneCatalyst",
								"resultQuantity": "1",
								"energyCost": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 172,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "alchemize",
								"ingredients": "seed:1,stoneOfBlast:1",
								"result": "alchemize",
								"resultQuantity": "8",
								"energyCost": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 180,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombFrost",
								"ingredients": "bomb:1,potionFrost:1",
								"result": "frostBomb",
								"resultQuantity": "1",
								"energyCost": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 188,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombWoolly",
								"ingredients": "bomb:1,scrollMirror:1",
								"result": "woollyBomb",
								"resultQuantity": "1",
								"energyCost": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 196,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombFire",
								"ingredients": "bomb:1,potionFlame:1",
								"result": "fireBomb",
								"resultQuantity": "1",
								"energyCost": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 204,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombNoisemaker",
								"ingredients": "bomb:1,scrollRage:1",
								"result": "noisemaker",
								"resultQuantity": "1",
								"energyCost": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 212,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombFlashbang",
								"ingredients": "bomb:1,scrollRecharging:1",
								"result": "flashbang",
								"resultQuantity": "1",
								"energyCost": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 222,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombSmoke",
								"ingredients": "bomb:1,potionInvis:1",
								"result": "smokeBomb",
								"resultQuantity": "1",
								"energyCost": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 232,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombRegrowth",
								"ingredients": "bomb:1,potionHealing:1",
								"result": "regrowthBomb",
								"resultQuantity": "1",
								"energyCost": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 240,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombHoly",
								"ingredients": "bomb:1,scrollCleanse:1",
								"result": "holyBomb",
								"resultQuantity": "1",
								"energyCost": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 248,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombArcane",
								"ingredients": "bomb:1,gooBlob:1",
								"result": "arcaneBomb",
								"resultQuantity": "1",
								"energyCost": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 256,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enhanceBombShrapnel",
								"ingredients": "bomb:1,metalShard:1",
								"result": "shrapnelBomb",
								"resultQuantity": "1",
								"energyCost": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 264,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "infernalBrew",
								"ingredients": "potionFlame:1",
								"result": "infernalBrew",
								"resultQuantity": "1",
								"energyCost": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 273,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "blizzardBrew",
								"ingredients": "potionFrost:1",
								"result": "blizzardBrew",
								"resultQuantity": "1",
								"energyCost": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 282,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "shockingBrew",
								"ingredients": "potionParalyticGas:1",
								"result": "shockingBrew",
								"resultQuantity": "1",
								"energyCost": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 291,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "causticBrew",
								"ingredients": "potionToxicGas:1,gooBlob:1",
								"result": "causticBrew",
								"resultQuantity": "1",
								"energyCost": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 300,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 84,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "alchemyRecipeManifest",
						"columns": "id:string|group:string|javaRecipe:string|recipe:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-liquidMetal",
								"recipe": "liquidMetal",
								"group": "variable",
								"javaRecipe": "LiquidMetal.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 315,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-scrollToStone",
								"recipe": "scrollToStone",
								"group": "one",
								"javaRecipe": "Scroll.ScrollToStone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 322,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-scrollToExotic",
								"recipe": "scrollToExotic",
								"group": "one",
								"javaRecipe": "ExoticScroll.ScrollToExotic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 329,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-potionToExotic",
								"recipe": "potionToExotic",
								"group": "one",
								"javaRecipe": "ExoticPotion.PotionToExotic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 336,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-exoticPotion",
								"recipe": "exoticPotion",
								"group": "one",
								"javaRecipe": "ExoticPotion.PotionToExotic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 343,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-exoticScroll",
								"recipe": "exoticScroll",
								"group": "one",
								"javaRecipe": "ExoticScroll.ScrollToExotic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 350,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-arcaneResin",
								"recipe": "arcaneResin",
								"group": "one",
								"javaRecipe": "ArcaneResin.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 357,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-alchemize",
								"recipe": "alchemize",
								"group": "one",
								"javaRecipe": "Alchemize.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 364,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-stewedMeat1",
								"recipe": "stewedMeat1",
								"group": "one",
								"javaRecipe": "StewedMeat.oneMeat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 371,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-blandfruit",
								"recipe": "blandfruit",
								"group": "two",
								"javaRecipe": "Blandfruit.CookFruit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 378,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBomb",
								"recipe": "enhanceBomb",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 385,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-alchemicalCatalyst",
								"recipe": "alchemicalCatalyst",
								"group": "two",
								"javaRecipe": "AlchemicalCatalyst.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 392,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-arcaneCatalyst",
								"recipe": "arcaneCatalyst",
								"group": "two",
								"javaRecipe": "ArcaneCatalyst.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 399,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-elixirArcaneArmor",
								"recipe": "elixirArcaneArmor",
								"group": "two",
								"javaRecipe": "ElixirOfArcaneArmor.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 406,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-elixirAquaticRejuvenation",
								"recipe": "elixirAquaticRejuvenation",
								"group": "two",
								"javaRecipe": "ElixirOfAquaticRejuvenation.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 413,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-elixirDragonsBlood",
								"recipe": "elixirDragonsBlood",
								"group": "two",
								"javaRecipe": "ElixirOfDragonsBlood.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 420,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-elixirIcyTouch",
								"recipe": "elixirIcyTouch",
								"group": "two",
								"javaRecipe": "ElixirOfIcyTouch.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 427,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-elixirMight",
								"recipe": "elixirMight",
								"group": "two",
								"javaRecipe": "ElixirOfMight.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 434,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-elixirHoneyedHealing",
								"recipe": "elixirHoneyedHealing",
								"group": "two",
								"javaRecipe": "ElixirOfHoneyedHealing.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 441,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-elixirToxicEssence",
								"recipe": "elixirToxicEssence",
								"group": "two",
								"javaRecipe": "ElixirOfToxicEssence.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 448,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-blizzardBrew",
								"recipe": "blizzardBrew",
								"group": "two",
								"javaRecipe": "BlizzardBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 455,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-infernalBrew",
								"recipe": "infernalBrew",
								"group": "two",
								"javaRecipe": "InfernalBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 462,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-shockingBrew",
								"recipe": "shockingBrew",
								"group": "two",
								"javaRecipe": "ShockingBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 469,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-causticBrew",
								"recipe": "causticBrew",
								"group": "two",
								"javaRecipe": "CausticBrew.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 476,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-aquaBlast",
								"recipe": "aquaBlast",
								"group": "two",
								"javaRecipe": "AquaBlast.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 483,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-beaconOfReturning",
								"recipe": "beaconOfReturning",
								"group": "two",
								"javaRecipe": "BeaconOfReturning.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 490,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-curseInfusion",
								"recipe": "curseInfusion",
								"group": "two",
								"javaRecipe": "CurseInfusion.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 497,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-featherFall",
								"recipe": "featherFall",
								"group": "two",
								"javaRecipe": "FeatherFall.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 504,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-magicalInfusion",
								"recipe": "magicalInfusion",
								"group": "two",
								"javaRecipe": "MagicalInfusion.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 511,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-phaseShift",
								"recipe": "phaseShift",
								"group": "two",
								"javaRecipe": "PhaseShift.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 518,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-reclaimTrap",
								"recipe": "reclaimTrap",
								"group": "two",
								"javaRecipe": "ReclaimTrap.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 525,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-recycle",
								"recipe": "recycle",
								"group": "two",
								"javaRecipe": "Recycle.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 532,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-wildEnergy",
								"recipe": "wildEnergy",
								"group": "two",
								"javaRecipe": "WildEnergy.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 539,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-telekineticGrab",
								"recipe": "telekineticGrab",
								"group": "two",
								"javaRecipe": "TelekineticGrab.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 546,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-summonElemental",
								"recipe": "summonElemental",
								"group": "two",
								"javaRecipe": "SummonElemental.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 553,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-stewedMeat2",
								"recipe": "stewedMeat2",
								"group": "two",
								"javaRecipe": "StewedMeat.twoMeat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 560,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-potionSeed",
								"recipe": "potionSeed",
								"group": "three",
								"javaRecipe": "Potion.SeedToPotion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 567,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-stewedMeat3",
								"recipe": "stewedMeat3",
								"group": "three",
								"javaRecipe": "StewedMeat.threeMeat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 574,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-meatPie",
								"recipe": "meatPie",
								"group": "three",
								"javaRecipe": "MeatPie.Recipe"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 581,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombFrost",
								"recipe": "enhanceBombFrost",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(FrostBomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 588,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombWoolly",
								"recipe": "enhanceBombWoolly",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(WoollyBomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 595,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombFire",
								"recipe": "enhanceBombFire",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(Firebomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 602,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombNoisemaker",
								"recipe": "enhanceBombNoisemaker",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(Noisemaker)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 609,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombFlashbang",
								"recipe": "enhanceBombFlashbang",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(Flashbang)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 616,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombSmoke",
								"recipe": "enhanceBombSmoke",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(SmokeBomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 623,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombRegrowth",
								"recipe": "enhanceBombRegrowth",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(RegrowthBomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 630,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombHoly",
								"recipe": "enhanceBombHoly",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(HolyBomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 637,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombArcane",
								"recipe": "enhanceBombArcane",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(ArcaneBomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 644,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "manifest-enhanceBombShrapnel",
								"recipe": "enhanceBombShrapnel",
								"group": "two",
								"javaRecipe": "Bomb.EnhanceBomb(ShrapnelBomb)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
								"line": 651,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
						"line": 310,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\alchemy.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
						"line": 7,
						"column": 9
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
								"line": 24,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
						"line": 19,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\appearances.mwl",
				"line": 3,
				"column": 5
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
								"line": 13,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_hourglass",
						"name": "items.artifacts.timekeepershourglass.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.timekeepershourglass.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 26,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 20,
						"column": 9
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
								"line": 39,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 33,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_cape",
						"name": "items.artifacts.capeofthorns.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.capeofthorns.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 52,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 46,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_toolkit",
						"name": "items.artifacts.alchemiststoolkit.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.alchemiststoolkit.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 65,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 59,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_rose",
						"name": "items.artifacts.driedrose.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.driedrose.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 78,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 72,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_chains",
						"name": "items.artifacts.etherealchains.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.etherealchains.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 91,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 85,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_horn",
						"name": "items.artifacts.hornofplenty.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.hornofplenty.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 104,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 98,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_beacon",
						"name": "items.artifacts.lloydsbeacon.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.lloydsbeacon.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 117,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 111,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_armband",
						"name": "items.artifacts.masterthievesarmband.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.masterthievesarmband.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 130,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 124,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_sandals",
						"name": "items.artifacts.sandalsofnature.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.sandalsofnature.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 143,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 137,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_talisman",
						"name": "items.artifacts.talismanofforesight.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.talismanofforesight.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 156,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 150,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "artifact_spellbook",
						"name": "items.artifacts.unstablespellbook.name",
						"slot": "artifact"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "description",
								"set": "items.artifacts.unstablespellbook.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
								"line": 169,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
						"line": 163,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\artifacts.mwl",
				"line": 3,
				"column": 5
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
					"tag": "object",
					"attributes": {
						"id": "asset-water0",
						"name": "water0",
						"image": "assets/water0.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-water1",
						"name": "water1",
						"image": "assets/water1.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 13,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-water2",
						"name": "water2",
						"image": "assets/water2.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 19,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-water3",
						"name": "water3",
						"image": "assets/water3.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 25,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-water4",
						"name": "water4",
						"image": "assets/water4.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 31,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-effects",
						"name": "effects",
						"image": "assets/effects.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 37,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-terrain-features",
						"name": "terrain-features",
						"image": "assets/terrain_features.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 43,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-caves-quest",
						"name": "caves-quest",
						"image": "assets/caves_quest.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 49,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-halls-special",
						"name": "halls-special",
						"image": "assets/halls_special.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 55,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-prison-quest",
						"name": "prison-quest",
						"image": "assets/prison_quest.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 63,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-caves-boss",
						"name": "caves-boss",
						"image": "assets/caves_boss.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 72,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-city-boss",
						"name": "city-boss",
						"image": "assets/city_boss.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 82,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-wall-blocking",
						"name": "wall-blocking",
						"image": "assets/wall_blocking.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 88,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-warrior",
						"name": "warrior",
						"image": "assets/warrior.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 93,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-mage",
						"name": "mage",
						"image": "assets/mage.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 94,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-rogue",
						"name": "rogue",
						"image": "assets/rogue.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 95,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-huntress",
						"name": "huntress",
						"image": "assets/huntress.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 96,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-duelist",
						"name": "duelist",
						"image": "assets/duelist.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 97,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-cleric",
						"name": "cleric",
						"image": "assets/cleric.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 98,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-sewers",
						"name": "sewers",
						"image": "assets/tiles_sewers.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 99,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-prison",
						"name": "prison",
						"image": "assets/tiles_prison.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 100,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-caves",
						"name": "caves",
						"image": "assets/tiles_caves.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 101,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-city",
						"name": "city",
						"image": "assets/tiles_city.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 102,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-halls",
						"name": "halls",
						"image": "assets/tiles_halls.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 103,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-banners",
						"name": "banners",
						"image": "assets/banners.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 104,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-banner-boss-slain",
						"name": "banner-boss-slain",
						"image": "assets/banner_boss_slain.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 105,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-banner-game-over",
						"name": "banner-game-over",
						"image": "assets/banner_game_over.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 106,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-toolbar",
						"name": "ui-toolbar",
						"image": "assets/ui_toolbar.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 107,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-chrome",
						"name": "ui-chrome",
						"image": "assets/ui_chrome.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 108,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-status-pane",
						"name": "ui-status-pane",
						"image": "assets/ui_status_pane.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 109,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-buffs",
						"name": "ui-buffs",
						"image": "assets/ui_buffs.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 110,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-icons",
						"name": "ui-icons",
						"image": "assets/ui_icons.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 111,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-badges",
						"name": "ui-badges",
						"image": "assets/ui_badges.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 112,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-boss-hp",
						"name": "ui-boss-hp",
						"image": "assets/ui_boss_hp.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 113,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-arcs-bg",
						"name": "ui-arcs-bg",
						"image": "assets/ui_arcs_bg.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 114,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-ui-arcs-fg",
						"name": "ui-arcs-fg",
						"image": "assets/ui_arcs_fg.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 115,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-effect-fireball",
						"name": "effect-fireball",
						"image": "assets/effect_fireball.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 116,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-loading-sewers",
						"name": "loading-sewers",
						"image": "assets/loading_sewers.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 117,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-loading-prison",
						"name": "loading-prison",
						"image": "assets/loading_prison.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 118,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-loading-caves",
						"name": "loading-caves",
						"image": "assets/loading_caves.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 119,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-loading-city",
						"name": "loading-city",
						"image": "assets/loading_city.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 120,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-loading-halls",
						"name": "loading-halls",
						"image": "assets/loading_halls.png"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 121,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-splash-warrior",
						"name": "splash-warrior",
						"image": "assets/splash_warrior.jpg"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 122,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-splash-mage",
						"name": "splash-mage",
						"image": "assets/splash_mage.jpg"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 123,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-splash-rogue",
						"name": "splash-rogue",
						"image": "assets/splash_rogue.jpg"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 124,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-splash-huntress",
						"name": "splash-huntress",
						"image": "assets/splash_huntress.jpg"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 125,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-splash-duelist",
						"name": "splash-duelist",
						"image": "assets/splash_duelist.jpg"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 126,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "object",
					"attributes": {
						"id": "asset-splash-cleric",
						"name": "splash-cleric",
						"image": "assets/splash_cleric.jpg"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 127,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemAssetSources",
						"columns": "slot:string|image:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"slot": "items",
								"image": "assets/items.png"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 134,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 129,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "monsterSpriteOverrides",
						"columns": "monster:string|sprite:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"monster": "sheep",
								"sprite": "sheep"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 145,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ninjaLog",
								"sprite": "ninjaLog"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 146,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spiritHawk",
								"sprite": "spiritHawk"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 147,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ward",
								"sprite": "wards"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 148,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "earthGuardian",
								"sprite": "guardian"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 149,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "sentry",
								"sprite": "sentry"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 150,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ratKing",
								"sprite": "ratking"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 151,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "rotHeart",
								"sprite": "rotHeart"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 152,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "rotLasher",
								"sprite": "rotLasher"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 153,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "fetidRat",
								"sprite": "rat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 154,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "impShopkeeper",
								"sprite": "imp"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 155,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "gnollTrickster",
								"sprite": "gnoll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 156,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "greatCrab",
								"sprite": "crab"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 157,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "necroSkeleton",
								"sprite": "skeleton"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 158,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "newbornElemental",
								"sprite": "elemental"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 159,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "mimic",
								"sprite": "mimic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 160,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "piranha",
								"sprite": "piranha"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 161,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "bee",
								"sprite": "bee"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 162,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "statue",
								"sprite": "statue"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 163,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 141,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "monsterSpriteFrames",
						"columns": "monster:string|frame_width:number|frame_height:number|idle:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"monster": "rat",
								"frame_width": "16",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 171,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "wraith",
								"frame_width": "14",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 172,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dustWraith",
								"frame_width": "14",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 173,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "snake",
								"frame_width": "12",
								"frame_height": "11",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 174,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "gnoll",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 175,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "swarm",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 176,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "crab",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 177,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "slime",
								"frame_width": "14",
								"frame_height": "12",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 178,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "goo",
								"frame_width": "20",
								"frame_height": "14",
								"idle": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 179,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "skeleton",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 180,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ward",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 181,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "sheep",
								"frame_width": "16",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 182,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ninjaLog",
								"frame_width": "11",
								"frame_height": "12",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 183,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spiritHawk",
								"frame_width": "15",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 184,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "earthGuardian",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 185,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "thief",
								"frame_width": "12",
								"frame_height": "13",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 186,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm100",
								"frame_width": "16",
								"frame_height": "14",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 187,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "guard",
								"frame_width": "12",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 188,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "necromancer",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 189,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "tengu",
								"frame_width": "14",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 190,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "fetidRat",
								"frame_width": "16",
								"frame_height": "15",
								"idle": "32"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 191,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "gnollTrickster",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "21"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 192,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "greatCrab",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "16"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 193,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "bat",
								"frame_width": "15",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 194,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "brute",
								"frame_width": "12",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 195,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "shaman",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 196,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spinner",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 197,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm200",
								"frame_width": "21",
								"frame_height": "18",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 198,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm300",
								"frame_width": "25",
								"frame_height": "22",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 199,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "necroSkeleton",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 200,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ghost",
								"frame_width": "14",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 201,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "wandmaker",
								"frame_width": "12",
								"frame_height": "14",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 202,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "shopkeeper",
								"frame_width": "14",
								"frame_height": "14",
								"idle": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 203,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "impShopkeeper",
								"frame_width": "12",
								"frame_height": "14",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 204,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "blacksmith",
								"frame_width": "13",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 205,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "imp",
								"frame_width": "12",
								"frame_height": "14",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 206,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ghoul",
								"frame_width": "12",
								"frame_height": "14",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 207,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "elemental",
								"frame_width": "12",
								"frame_height": "14",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 208,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "newbornElemental",
								"frame_width": "12",
								"frame_height": "14",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 209,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "warlock",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 210,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "monk",
								"frame_width": "15",
								"frame_height": "14",
								"idle": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 211,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "golem",
								"frame_width": "17",
								"frame_height": "19",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 212,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "succubus",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 213,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "eye",
								"frame_width": "16",
								"frame_height": "18",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 214,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "scorpio",
								"frame_width": "17",
								"frame_height": "17",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 215,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "king",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 216,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yog",
								"frame_width": "20",
								"frame_height": "19",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 217,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yogFist",
								"frame_width": "24",
								"frame_height": "17",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 218,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "larva",
								"frame_width": "12",
								"frame_height": "8",
								"idle": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 219,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "demonSpawner",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 220,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ripperDemon",
								"frame_width": "15",
								"frame_height": "14",
								"idle": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 221,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "albino",
								"frame_width": "16",
								"frame_height": "15",
								"idle": "16"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 222,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "causticSlime",
								"frame_width": "14",
								"frame_height": "12",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 223,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "bandit",
								"frame_width": "12",
								"frame_height": "13",
								"idle": "21"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 224,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "spectralNecromancer",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 225,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "armoredBrute",
								"frame_width": "12",
								"frame_height": "16",
								"idle": "21"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 226,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm201",
								"frame_width": "21",
								"frame_height": "18",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 227,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "senior",
								"frame_width": "15",
								"frame_height": "14",
								"idle": "18"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 228,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "acidic",
								"frame_width": "17",
								"frame_height": "17",
								"idle": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 229,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "mimic",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 230,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "crystalMimic",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 231,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "piranha",
								"frame_width": "12",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 232,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "bee",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 233,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "statue",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 234,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "armoredStatue",
								"frame_width": "12",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 235,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "pylon",
								"frame_width": "10",
								"frame_height": "20",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 236,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "sentry",
								"frame_width": "8",
								"frame_height": "15",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 237,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "rotHeart",
								"frame_width": "16",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 238,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "rotLasher",
								"frame_width": "12",
								"frame_height": "16",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 239,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ratKing",
								"frame_width": "16",
								"frame_height": "17",
								"idle": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
								"line": 240,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
						"line": 167,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\asset-references.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 20,
								"column": 13
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
								"line": 28,
								"column": 13
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
								"line": 36,
								"column": 13
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
								"line": 44,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss_challenge_1",
								"counter": "boss_challenge_goo",
								"target": "1",
								"description": "Slew Goo with weapon only",
								"icon": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 52,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss_challenge_2",
								"counter": "boss_challenge_tengu",
								"target": "1",
								"description": "Slew Tengu with weapon only",
								"icon": "47"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 60,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss_challenge_3",
								"counter": "boss_challenge_dm300",
								"target": "1",
								"description": "Slew DM-300 with weapon only",
								"icon": "48"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 68,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss_challenge_4",
								"counter": "boss_challenge_king",
								"target": "1",
								"description": "Slew the Dwarf King with weapon only",
								"icon": "78"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 76,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "boss_challenge_5",
								"counter": "boss_challenge_yog",
								"target": "1",
								"description": "Slew Yog-Dzewa with weapon only",
								"icon": "82"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 84,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "enemy_hazards",
								"counter": "hazard_assists",
								"target": "10",
								"description": "10 hazard-assisted kills",
								"icon": "64"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 92,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bag_velvet",
								"counter": "bag_velvet",
								"target": "1",
								"description": "Owned the Velvet Pouch",
								"icon": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 100,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bag_holder",
								"counter": "bag_holder",
								"target": "1",
								"description": "Owned the Scroll Holder",
								"icon": "61"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 108,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bag_bandolier",
								"counter": "bag_bandolier",
								"target": "1",
								"description": "Owned the Potion Bandolier",
								"icon": "62"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 116,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bag_holster",
								"counter": "bag_holster",
								"target": "1",
								"description": "Owned the Magical Holster",
								"icon": "63"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 124,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bags_all",
								"counter": "bags_all",
								"target": "1",
								"description": "Owned all four bags",
								"icon": "67"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
								"line": 132,
								"column": 13
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
								"line": 140,
								"column": 13
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
								"line": 148,
								"column": 13
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
								"line": 156,
								"column": 13
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
								"line": 164,
								"column": 13
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
								"line": 172,
								"column": 13
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
								"line": 180,
								"column": 13
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
								"line": 188,
								"column": 13
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
								"line": 196,
								"column": 13
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
								"line": 204,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\badges.mwl",
				"line": 3,
				"column": 5
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
								"set": "poison,burning,bleeding,cripple,weakness,vulnerable,paralysis,roots,terror,amok,aggression,ooze,charm,degrade,daze,chill,frost,hex,wayward,blindness,feintConfusion,soulmark"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 12,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 24,
								"column": 13
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
								"line": 29,
								"column": 13
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
								"line": 34,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "blindness",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 41,
								"column": 13
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
								"line": 46,
								"column": 13
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
								"line": 51,
								"column": 13
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
								"line": 56,
								"column": 13
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
								"line": 61,
								"column": 13
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
								"line": 66,
								"column": 13
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
								"line": 71,
								"column": 13
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
								"line": 76,
								"column": 13
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
								"line": 81,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "burning",
								"duration": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 86,
								"column": 13
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
								"line": 91,
								"column": 13
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
								"line": 96,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "cripple",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 106,
								"column": 13
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
								"line": 111,
								"column": 13
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
								"line": 116,
								"column": 13
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
								"line": 121,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "featherFall",
								"duration": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 126,
								"column": 13
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
								"line": 131,
								"column": 13
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
								"line": 136,
								"column": 13
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
								"line": 141,
								"column": 13
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
								"line": 146,
								"column": 13
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
								"line": 151,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "fireImbue",
								"duration": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 161,
								"column": 13
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
								"line": 166,
								"column": 13
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
								"line": 171,
								"column": 13
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
								"line": 176,
								"column": 13
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
								"line": 181,
								"column": 13
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
								"line": 186,
								"column": 13
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
								"line": 191,
								"column": 13
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
								"line": 196,
								"column": 13
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
								"line": 201,
								"column": 13
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
								"line": 206,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "wayward",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 211,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "soulmark",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 220,
								"column": 13
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
								"line": 225,
								"column": 13
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
								"line": 230,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "light",
								"duration": "250"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 235,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "invulnerability",
								"duration": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 240,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "feintConfusion",
								"duration": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 254,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "counterAbility",
								"duration": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 264,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "hazardAssist",
								"duration": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 273,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "spectatorFreeze",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 282,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "duelParticipant",
								"duration": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 290,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "eliminationMatch",
								"duration": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 297,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "luckyTracker",
								"duration": "9999"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 306,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"buff": "prismaticGuard",
								"duration": "9999"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
								"line": 318,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
						"line": 19,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\buff-rules.mwl",
				"line": 3,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "warrior",
				"name": "actors.hero.heroclass.warrior"
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
						"line": 8,
						"column": 9
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
						"line": 13,
						"column": 9
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
						"line": 18,
						"column": 9
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
						"line": 23,
						"column": 9
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
						"line": 28,
						"column": 9
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
						"line": 33,
						"column": 9
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
						"line": 38,
						"column": 9
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
						"line": 43,
						"column": 9
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
						"line": 48,
						"column": 9
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
						"line": 53,
						"column": 9
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
						"line": 58,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_source_class",
						"set": "ThrowingStone"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 63,
						"column": 9
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
						"line": 68,
						"column": 9
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
						"line": 73,
						"column": 9
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
						"line": 78,
						"column": 9
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
						"line": 83,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 3,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "mage",
				"name": "actors.hero.heroclass.mage"
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
						"line": 95,
						"column": 9
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
						"line": 100,
						"column": 9
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
						"line": 105,
						"column": 9
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
						"line": 110,
						"column": 9
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
						"line": 115,
						"column": 9
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
						"line": 120,
						"column": 9
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
						"line": 125,
						"column": 9
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
						"line": 130,
						"column": 9
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
						"line": 135,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "port.class.mage.unlockhint"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 140,
						"column": 9
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
						"line": 145,
						"column": 9
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
						"line": 150,
						"column": 9
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
						"line": 155,
						"column": 9
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
						"line": 160,
						"column": 9
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
						"line": 165,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 90,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "rogue",
				"name": "actors.hero.heroclass.rogue"
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
						"line": 177,
						"column": 9
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
						"line": 182,
						"column": 9
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
						"line": 187,
						"column": 9
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
						"line": 192,
						"column": 9
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
						"line": 197,
						"column": 9
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
						"line": 202,
						"column": 9
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
						"line": 207,
						"column": 9
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
						"line": 212,
						"column": 9
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
						"line": 217,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "port.class.rogue.unlockhint"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 222,
						"column": 9
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
						"line": 227,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_source_class",
						"set": "ThrowingKnife"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 232,
						"column": 9
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
						"line": 237,
						"column": 9
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
						"line": 242,
						"column": 9
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
						"line": 247,
						"column": 9
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
						"line": 252,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 172,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "huntress",
				"name": "actors.hero.heroclass.huntress"
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
						"line": 264,
						"column": 9
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
						"line": 269,
						"column": 9
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
						"line": 274,
						"column": 9
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
						"line": 279,
						"column": 9
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
						"line": 284,
						"column": 9
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
						"line": 289,
						"column": 9
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
						"line": 294,
						"column": 9
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
						"line": 299,
						"column": 9
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
						"line": 304,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "port.class.huntress.unlockhint"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 309,
						"column": 9
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
						"line": 314,
						"column": 9
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
						"line": 319,
						"column": 9
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
						"line": 324,
						"column": 9
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
						"line": 329,
						"column": 9
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
						"line": 334,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 259,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "trait",
			"attributes": {
				"id": "duelist",
				"name": "actors.hero.heroclass.duelist"
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
						"line": 346,
						"column": 9
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
						"line": 351,
						"column": 9
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
						"line": 356,
						"column": 9
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
						"line": 361,
						"column": 9
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
						"line": 366,
						"column": 9
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
						"line": 371,
						"column": 9
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
						"line": 376,
						"column": 9
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
						"line": 381,
						"column": 9
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
						"line": 386,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "port.class.duelist.unlockhint"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 391,
						"column": 9
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
						"line": 396,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "special_source_class",
						"set": "ThrowingSpike"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 401,
						"column": 9
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
						"line": 406,
						"column": 9
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
						"line": 411,
						"column": 9
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
						"line": 416,
						"column": 9
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
						"line": 421,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 341,
				"column": 5
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
						"line": 433,
						"column": 9
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
						"line": 438,
						"column": 9
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
						"line": 443,
						"column": 9
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
						"line": 448,
						"column": 9
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
						"line": 453,
						"column": 9
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
						"line": 458,
						"column": 9
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
						"line": 463,
						"column": 9
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
						"line": 468,
						"column": 9
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
						"line": 473,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "effect",
					"attributes": {
						"apply_to": "unlock_hint",
						"set": "port.class.cleric.unlockhint"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
						"line": 478,
						"column": 9
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
						"line": 483,
						"column": 9
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
						"line": 488,
						"column": 9
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
						"line": 493,
						"column": 9
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
						"line": 498,
						"column": 9
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
						"line": 503,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\classes.mwl",
				"line": 428,
				"column": 5
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
						"id": "consumableClassAliases",
						"columns": "sourceClass:string|item:string|category:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfStrength",
								"item": "potionStrength",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 11,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfHealing",
								"item": "potionHealing",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 12,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfMindVision",
								"item": "potionMindVision",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 13,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfFrost",
								"item": "potionFrost",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 14,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfLiquidFlame",
								"item": "potionFlame",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 15,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfToxicGas",
								"item": "potionToxicGas",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 16,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfHaste",
								"item": "potionHaste",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 17,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfInvisibility",
								"item": "potionInvis",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 18,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfLevitation",
								"item": "potionLevitation",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 19,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfParalyticGas",
								"item": "potionParalyticGas",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 20,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfPurity",
								"item": "potionPurity",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 21,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "PotionOfExperience",
								"item": "potionExperience",
								"category": "potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 22,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfUpgrade",
								"item": "scrollUpgrade",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 23,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfIdentify",
								"item": "scrollIdentify",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 24,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfRemoveCurse",
								"item": "scrollCleanse",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 25,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfMirrorImage",
								"item": "scrollMirror",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 26,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfRecharging",
								"item": "scrollRecharging",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 27,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfTeleportation",
								"item": "scrollTeleportation",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 28,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfLullaby",
								"item": "scrollLullaby",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 29,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfMagicMapping",
								"item": "scrollMapping",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 30,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfRage",
								"item": "scrollRage",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 31,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfRetribution",
								"item": "scrollRetribution",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 32,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfTerror",
								"item": "scrollTerror",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 33,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ScrollOfTransmutation",
								"item": "scrollTransmutation",
								"category": "scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 34,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Rotberry",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 35,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Sungrass",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 36,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Fadeleaf",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 37,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Icecap",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 38,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Firebloom",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 39,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Sorrowmoss",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 40,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Swiftthistle",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 41,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Blindweed",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 42,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Stormvine",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 43,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Earthroot",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 44,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Mageroyal",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 45,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Starflower",
								"item": "seed",
								"category": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 46,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfAugmentation",
								"item": "stoneOfAugmentation",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 47,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfFear",
								"item": "stoneOfFear",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 48,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfDeepSleep",
								"item": "stoneOfDeepSleep",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 49,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfShock",
								"item": "stoneOfShock",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 50,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfBlast",
								"item": "stoneOfBlast",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 51,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfBlink",
								"item": "stoneOfBlink",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 52,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfClairvoyance",
								"item": "stoneOfClairvoyance",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 53,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfEnchantment",
								"item": "stoneOfEnchantment",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 54,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfIntuition",
								"item": "stoneOfIntuition",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 55,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfDetectMagic",
								"item": "stoneOfDetectMagic",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 56,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfFlock",
								"item": "stoneOfFlock",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 57,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "StoneOfAggression",
								"item": "stoneOfAggression",
								"category": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
								"line": 58,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumable-aliases.mwl",
				"line": 3,
				"column": 5
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
						"line": 7,
						"column": 9
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
						"line": 14,
						"column": 9
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
						"line": 21,
						"column": 9
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
						"line": 28,
						"column": 9
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
						"line": 35,
						"column": 9
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
						"line": 42,
						"column": 9
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
						"line": 49,
						"column": 9
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
						"line": 56,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "potionShrouding",
						"name": "items.potions.exotic.potionofshroudingfog.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 63,
						"column": 9
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
						"line": 70,
						"column": 9
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
						"line": 77,
						"column": 9
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
						"line": 84,
						"column": 9
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
						"line": 91,
						"column": 9
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
						"line": 98,
						"column": 9
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
						"line": 105,
						"column": 9
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
						"line": 112,
						"column": 9
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
						"line": 119,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollPrismatic",
						"name": "items.scrolls.exotic.scrollofprismaticimage.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 126,
						"column": 9
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
						"line": 133,
						"column": 9
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
						"line": 140,
						"column": 9
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
						"line": 147,
						"column": 9
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
						"line": 154,
						"column": 9
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
						"line": 161,
						"column": 9
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
						"line": 168,
						"column": 9
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
						"line": 175,
						"column": 9
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
						"line": 182,
						"column": 9
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
						"line": 189,
						"column": 9
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
						"line": 196,
						"column": 9
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
						"line": 203,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedRotberry",
						"name": "plants.rotberry$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 210,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedSungrass",
						"name": "plants.sungrass$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 217,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedFadeleaf",
						"name": "plants.fadeleaf$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 224,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedIcecap",
						"name": "plants.icecap$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 231,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedFirebloom",
						"name": "plants.firebloom$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 238,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedSorrowmoss",
						"name": "plants.sorrowmoss$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 245,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedSwiftthistle",
						"name": "plants.swiftthistle$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 252,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedBlindweed",
						"name": "plants.blindweed$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 259,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedStormvine",
						"name": "plants.stormvine$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 266,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedEarthroot",
						"name": "plants.earthroot$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 273,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedMageroyal",
						"name": "plants.mageroyal$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 280,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seedStarflower",
						"name": "plants.starflower$seed.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 287,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "seed",
						"name": "plants.plant$seed$placeholder.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 294,
						"column": 9
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
						"line": 301,
						"column": 9
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
						"line": 308,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "pasty",
						"name": "items.food.pasty.pasty",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 315,
						"column": 9
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
						"line": 322,
						"column": 9
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
						"line": 329,
						"column": 9
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
						"line": 336,
						"column": 9
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
						"line": 343,
						"column": 9
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
						"line": 350,
						"column": 9
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
						"line": 357,
						"column": 9
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
						"line": 364,
						"column": 9
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
						"line": 371,
						"column": 9
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
						"line": 378,
						"column": 9
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
						"line": 385,
						"column": 9
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
						"line": 392,
						"column": 9
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
						"line": 399,
						"column": 9
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
						"line": 406,
						"column": 9
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
						"line": 413,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "chargrilledMeat",
						"name": "items.food.chargrilledmeat.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 420,
						"column": 9
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
						"line": 427,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "frostBomb",
						"name": "items.bombs.frostbomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 434,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "woollyBomb",
						"name": "items.bombs.woollybomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 441,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "fireBomb",
						"name": "items.bombs.firebomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 448,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "noisemaker",
						"name": "items.bombs.noisemaker.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 455,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "flashbang",
						"name": "port.name.flashbang",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 462,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "smokeBomb",
						"name": "port.name.smokebomb",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 469,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "regrowthBomb",
						"name": "items.bombs.regrowthbomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 476,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "holyBomb",
						"name": "items.bombs.holybomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 483,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "arcaneBomb",
						"name": "items.bombs.arcanebomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 490,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "shrapnelBomb",
						"name": "items.bombs.shrapnelbomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 497,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "gooBlob",
						"name": "items.quest.gooblob.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 504,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "metalShard",
						"name": "items.quest.metalshard.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 511,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "doubleBomb",
						"name": "items.bombs.bomb$doublebomb.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 518,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "liquidMetal",
						"name": "items.liquidmetal.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 525,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "scrollToStone",
						"name": "port.name.alchemy.scrolltostone",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 532,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "exoticPotion",
						"name": "port.name.alchemy.exoticpotion",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 539,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "exoticScroll",
						"name": "port.name.alchemy.exoticscroll",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 546,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "arcaneResin",
						"name": "items.arcaneresin.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 553,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "alchemize",
						"name": "items.spells.alchemize.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 560,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "blandfruit",
						"name": "items.food.blandfruit.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 567,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "enhanceBomb",
						"name": "port.name.alchemy.enhancebomb",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 574,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "elixirArcaneArmor",
						"name": "items.potions.elixirs.elixirofarcanearmor.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 581,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "elixirAquaticRejuvenation",
						"name": "items.potions.elixirs.elixirofaquaticrejuvenation.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 588,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "elixirDragonsBlood",
						"name": "items.potions.elixirs.elixirofdragonsblood.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 595,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "elixirIcyTouch",
						"name": "items.potions.elixirs.elixiroficytouch.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 602,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "elixirMight",
						"name": "items.potions.elixirs.elixirofmight.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 609,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "elixirHoneyedHealing",
						"name": "items.potions.elixirs.elixirofhoneyedhealing.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 616,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "elixirToxicEssence",
						"name": "items.potions.elixirs.elixiroftoxicessence.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 623,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "blizzardBrew",
						"name": "items.potions.brews.blizzardbrew.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 630,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "infernalBrew",
						"name": "items.potions.brews.infernalbrew.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 637,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "shockingBrew",
						"name": "items.potions.brews.shockingbrew.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 644,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "causticBrew",
						"name": "items.potions.brews.causticbrew.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 651,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "aquaBlast",
						"name": "items.spells.aquablast.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 658,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "beaconOfReturning",
						"name": "items.spells.beaconofreturning.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 665,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "curseInfusion",
						"name": "items.spells.curseinfusion.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 672,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "featherFall",
						"name": "items.spells.featherfall.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 679,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "magicalInfusion",
						"name": "items.spells.magicalinfusion.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 686,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "phaseShift",
						"name": "items.spells.phaseshift.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 693,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "reclaimTrap",
						"name": "items.spells.reclaimtrap.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 700,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "recycle",
						"name": "items.spells.recycle.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 707,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wildEnergy",
						"name": "items.spells.wildenergy.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 714,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "telekineticGrab",
						"name": "items.spells.telekineticgrab.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 721,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "summonElemental",
						"name": "items.spells.summonelemental.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 728,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "torch",
						"name": "items.torch.name",
						"slot": "consumable",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
						"line": 735,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\consumables.mwl",
				"line": 3,
				"column": 5
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
						"columns": "id:string|type:string|locks:boolean|nameKey:string|descriptionKey:string|curse:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "curse-wayward",
								"curse": "wayward",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.wayward.name",
								"descriptionKey": "items.weapon.curses.wayward.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 12,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-annoying",
								"curse": "annoying",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.annoying.name",
								"descriptionKey": "items.weapon.curses.annoying.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 21,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-dazzling",
								"curse": "dazzling",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.dazzling.name",
								"descriptionKey": "items.weapon.curses.dazzling.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 30,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-displacing",
								"curse": "displacing",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.displacing.name",
								"descriptionKey": "items.weapon.curses.displacing.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 39,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-explosive",
								"curse": "explosive",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.explosive.name",
								"descriptionKey": "items.weapon.curses.explosive.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 48,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-friendly",
								"curse": "friendly",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.friendly.name",
								"descriptionKey": "items.weapon.curses.friendly.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 57,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-polarized",
								"curse": "polarized",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.polarized.name",
								"descriptionKey": "items.weapon.curses.polarized.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 66,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-sacrificial",
								"curse": "sacrificial",
								"type": "weapon",
								"locks": "true",
								"nameKey": "items.weapon.curses.sacrificial.name",
								"descriptionKey": "items.weapon.curses.sacrificial.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 75,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-stench",
								"curse": "stench",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.stench.name",
								"descriptionKey": "items.armor.curses.stench.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 84,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-antientropy",
								"curse": "antientropy",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.antientropy.name",
								"descriptionKey": "items.armor.curses.antientropy.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 93,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-bulk",
								"curse": "bulk",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.bulk.name",
								"descriptionKey": "items.armor.curses.bulk.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 102,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-corrosion",
								"curse": "corrosion",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.corrosion.name",
								"descriptionKey": "items.armor.curses.corrosion.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 111,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-displacement",
								"curse": "displacement",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.displacement.name",
								"descriptionKey": "items.armor.curses.displacement.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 120,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-metabolism",
								"curse": "metabolism",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.metabolism.name",
								"descriptionKey": "items.armor.curses.metabolism.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 129,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-multiplicity",
								"curse": "multiplicity",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.multiplicity.name",
								"descriptionKey": "items.armor.curses.multiplicity.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 138,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "curse-overgrowth",
								"curse": "overgrowth",
								"type": "armor",
								"locks": "true",
								"nameKey": "items.armor.curses.overgrowth.name",
								"descriptionKey": "items.armor.curses.overgrowth.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
								"line": 147,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\curse-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
						"line": 7,
						"column": 9
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
								"line": 29,
								"column": 13
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
								"line": 34,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
						"line": 24,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\decks.mwl",
				"line": 3,
				"column": 5
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
								"line": 13,
								"column": 13
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
								"line": 18,
								"column": 13
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
								"line": 23,
								"column": 13
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
								"line": 28,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
						"line": 7,
						"column": 9
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
								"line": 41,
								"column": 13
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
								"line": 46,
								"column": 13
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
								"line": 51,
								"column": 13
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
								"line": 56,
								"column": 13
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
								"line": 61,
								"column": 13
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
								"line": 66,
								"column": 13
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
								"line": 71,
								"column": 13
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
								"line": 76,
								"column": 13
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
								"line": 81,
								"column": 13
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
								"line": 86,
								"column": 13
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
								"line": 91,
								"column": 13
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
								"line": 96,
								"column": 13
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
								"line": 101,
								"column": 13
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
								"line": 106,
								"column": 13
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
								"line": 111,
								"column": 13
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
								"line": 116,
								"column": 13
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
								"line": 121,
								"column": 13
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
								"line": 126,
								"column": 13
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
								"line": 131,
								"column": 13
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
								"line": 136,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
						"line": 35,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rosters.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 29,
								"column": 13
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
								"line": 34,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 24,
						"column": 9
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
								"line": 47,
								"column": 13
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
								"line": 53,
								"column": 13
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
								"line": 59,
								"column": 13
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
								"line": 65,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 41,
						"column": 9
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
								"line": 78,
								"column": 13
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
								"line": 88,
								"column": 13
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
								"line": 98,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "city",
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
								"line": 108,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"region": "halls",
								"waterNormal": "0.15",
								"waterFeeling": "0.7",
								"grassNormal": "0.1",
								"grassFeeling": "0.65",
								"waterSmoothness": "6",
								"grassSmoothness": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
								"line": 118,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
						"line": 73,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\dungeon-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 7,
						"column": 9
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
								"line": 29,
								"column": 13
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
								"line": 34,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 24,
						"column": 9
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
								"line": 53,
								"column": 13
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
								"line": 58,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 41,
						"column": 9
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
								"line": 70,
								"column": 13
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
								"line": 75,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 65,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "trait",
					"attributes": {
						"id": "armorGeneratorDeck",
						"name": "Generator.Category.ARMOR"
					},
					"children": [
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "default_probs",
								"set": "1,1,1,1,1,0,0,0,0,0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 87,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "effect",
							"attributes": {
								"apply_to": "classes",
								"set": "ClothArmor,LeatherArmor,MailArmor,ScaleArmor,PlateArmor,WarriorArmor,MageArmor,RogueArmor,HuntressArmor,DuelistArmor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
								"line": 92,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
						"line": 82,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-decks.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
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
								"line": 22,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 34,
								"column": 13
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
								"line": 39,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
						"line": 29,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 13,
								"column": 13
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
								"line": 18,
								"column": 13
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
								"line": 23,
								"column": 13
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
								"line": 28,
								"column": 13
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
								"line": 33,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\generator-tables.mwl",
				"line": 3,
				"column": 5
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
						"id": "itemCategories",
						"columns": "item:string|category:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "frostBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 11,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "woollyBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 12,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "fireBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 13,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "noisemaker",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 14,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "flashbang",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 15,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "smokeBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 16,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "regrowthBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 17,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "holyBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 18,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "arcaneBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 19,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "shrapnelBomb",
								"category": "specialtyBomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 20,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemNameKeys",
						"columns": "item:string|nameKey:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "kingsCrown",
								"nameKey": "items.kingscrown.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 28,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "clothArmor",
								"nameKey": "items.armor.clotharmor.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 29,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armor",
								"nameKey": "items.armor.clotharmor.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 30,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armorReward",
								"nameKey": "items.armor.clotharmor.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 31,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "weaponReward",
								"nameKey": "port.name.questweapon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 32,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wand",
								"nameKey": "port.name.wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 33,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "velvetPouch",
								"nameKey": "items.bags.velvetpouch.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 34,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollHolder",
								"nameKey": "items.bags.scrollholder.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 35,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionBandolier",
								"nameKey": "items.bags.potionbandolier.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 36,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "magicalHolster",
								"nameKey": "items.bags.magicalholster.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 37,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "waterskin",
								"nameKey": "items.waterskin.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 38,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "gold",
								"nameKey": "items.gold.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 39,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "darkGold",
								"nameKey": "items.quest.darkgold.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 40,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "dwarfToken",
								"nameKey": "items.quest.dwarftoken.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 41,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "ironKey",
								"nameKey": "items.keys.ironkey.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 42,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "crystalKey",
								"nameKey": "items.keys.crystalkey.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 43,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "goldenKey",
								"nameKey": "items.keys.goldenkey.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 44,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "amulet",
								"nameKey": "items.amulet.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 45,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "pickaxe",
								"nameKey": "items.quest.pickaxe.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 46,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stone",
								"nameKey": "items.weapon.missiles.throwingstone.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 47,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "knife",
								"nameKey": "items.weapon.missiles.throwingknife.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 48,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "spike",
								"nameKey": "items.weapon.missiles.throwingspike.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 49,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potion",
								"nameKey": "port.name.potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 50,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scroll",
								"nameKey": "port.name.scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 51,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "corpseDust",
								"nameKey": "items.quest.corpsedust.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 52,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "candle",
								"nameKey": "items.quest.ceremonialcandle.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 53,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "embers",
								"nameKey": "items.quest.embers.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 54,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "ankh",
								"nameKey": "items.ankh.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 55,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stylus",
								"nameKey": "items.stylus.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 56,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "brokenSeal",
								"nameKey": "items.brokenseal.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 57,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "honeypot",
								"nameKey": "items.honeypot.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 58,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "bag",
								"nameKey": "items.bags.bag.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 59,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "sandBag",
								"nameKey": "items.artifacts.timekeepershourglass$sandbag.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 60,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 24,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "specialItemGroundKinds",
						"columns": "sourceClass:string|groundKind:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Bomb",
								"groundKind": "bomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 68,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "DoubleBomb",
								"groundKind": "bomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 69,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "CorpseDust",
								"groundKind": "corpseDust"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 70,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "CeremonialCandle",
								"groundKind": "candle"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 71,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Embers",
								"groundKind": "embers"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 72,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Ankh",
								"groundKind": "ankh"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 73,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Stylus",
								"groundKind": "stylus"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 74,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "BrokenSeal",
								"groundKind": "brokenSeal"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 75,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Honeypot",
								"groundKind": "honeypot"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 76,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Alchemize",
								"groundKind": "alchemize"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 77,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Bag",
								"groundKind": "bag"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 78,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "SandBag",
								"groundKind": "sandBag"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 79,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Torch",
								"groundKind": "torch"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 80,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 64,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "groundItemNameKeys",
						"columns": "groundKind:string|nameKey:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"groundKind": "dewdrop",
								"nameKey": "items.dewdrop.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 88,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "petal",
								"nameKey": "items.artifacts.driedrose$petal.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 89,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "stone",
								"nameKey": "items.weapon.missiles.throwingstone.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 90,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "potion",
								"nameKey": "port.name.potion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 91,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "scroll",
								"nameKey": "port.name.scroll"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 92,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "meat",
								"nameKey": "items.food.mysterymeat.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 93,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "gold",
								"nameKey": "items.gold.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 94,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "armor",
								"nameKey": "items.armor.clotharmor.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 95,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "weapon",
								"nameKey": "items.weapon.melee.wornshortsword.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 100,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "wand",
								"nameKey": "port.name.wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 101,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "food",
								"nameKey": "items.food.food.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 102,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "seed",
								"nameKey": "plants.plant$seed$placeholder.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 103,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "darkGold",
								"nameKey": "items.quest.darkgold.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 104,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "dwarfToken",
								"nameKey": "items.quest.dwarftoken.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 105,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "kingsCrown",
								"nameKey": "items.kingscrown.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 106,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "amulet",
								"nameKey": "items.amulet.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 107,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "ring",
								"nameKey": "port.name.ring"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 108,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "crystalKey",
								"nameKey": "items.keys.crystalkey.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 109,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "goldenKey",
								"nameKey": "items.keys.goldenkey.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 110,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "bomb",
								"nameKey": "items.bombs.bomb.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 111,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "corpseDust",
								"nameKey": "items.quest.corpsedust.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 112,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "candle",
								"nameKey": "items.quest.ceremonialcandle.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 113,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "embers",
								"nameKey": "items.quest.embers.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 114,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "ankh",
								"nameKey": "items.ankh.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 115,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "stylus",
								"nameKey": "items.stylus.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 116,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "brokenSeal",
								"nameKey": "items.brokenseal.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 117,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "honeypot",
								"nameKey": "items.honeypot.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 118,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "alchemize",
								"nameKey": "items.spells.alchemize.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 119,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "bag",
								"nameKey": "items.bags.bag.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 120,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "sandBag",
								"nameKey": "items.artifacts.timekeepershourglass$sandbag.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 121,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"groundKind": "torch",
								"nameKey": "items.torch.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 122,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 84,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemActionKeys",
						"columns": "item:string|actionKey:string|capitalize:boolean"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "potion",
								"actionKey": "items.potions.potion.ac_drink",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 130,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scroll",
								"actionKey": "items.scrolls.scroll.ac_read",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 131,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "bomb",
								"actionKey": "items.bombs.bomb.ac_lightthrow",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 132,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "shockingBrew",
								"actionKey": "items.item.ac_throw",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 133,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "causticBrew",
								"actionKey": "items.item.ac_throw",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 134,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "infernalBrew",
								"actionKey": "items.item.ac_throw",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 135,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "blizzardBrew",
								"actionKey": "items.item.ac_throw",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 136,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "food",
								"actionKey": "items.food.food.ac_eat",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 137,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "meat",
								"actionKey": "items.food.food.ac_eat",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 138,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chargrilledMeat",
								"actionKey": "items.food.food.ac_eat",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 139,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "waterskin",
								"actionKey": "items.waterskin.ac_drink",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 140,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seed",
								"actionKey": "plants.plant$seed.ac_plant",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 141,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "pickaxe",
								"actionKey": "port.ui.pickaxemine",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 142,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "hourglass",
								"actionKey": "items.artifacts.timekeepershourglass.ac_activate",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 143,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "cloak",
								"actionKey": "items.artifacts.cloakofshadows.ac_stealth",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 144,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chalice",
								"actionKey": "items.artifacts.chaliceofblood.ac_prick",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 145,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "toolkit",
								"actionKey": "items.artifacts.alchemiststoolkit.ac_brew",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 146,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "beacon",
								"actionKey": "items.artifacts.lloydsbeacon.ac_zap",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 147,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armband",
								"actionKey": "items.artifacts.masterthievesarmband.ac_steal",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 148,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "horn",
								"actionKey": "items.artifacts.hornofplenty.ac_snack",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 149,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chains",
								"actionKey": "items.artifacts.etherealchains.ac_cast",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 150,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfAugmentation",
								"actionKey": "port.ui.augment.title",
								"capitalize": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 151,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stone",
								"actionKey": "items.stones.inventorystone.ac_use",
								"capitalize": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 152,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stylus",
								"actionKey": "items.stylus.ac_inscribe",
								"capitalize": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 153,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "brokenSeal",
								"actionKey": "items.brokenseal.ac_affix",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 154,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "kingsCrown",
								"actionKey": "items.kingscrown.ac_wear",
								"capitalize": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 155,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "candle",
								"actionKey": "port.ui.candle.place",
								"capitalize": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 156,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "torch",
								"actionKey": "items.torch.ac_light",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 157,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "ankh",
								"actionKey": "items.ankh.ac_bless",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 158,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "ring",
								"actionKey": "items.equipableitem.ac_equip",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 159,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armor",
								"actionKey": "items.equipableitem.ac_equip",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 160,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armorReward",
								"actionKey": "items.equipableitem.ac_equip",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 161,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "weaponReward",
								"actionKey": "items.equipableitem.ac_equip",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 162,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wand",
								"actionKey": "items.equipableitem.ac_equip",
								"capitalize": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 163,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 126,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemInstanceRules",
						"columns": "item:string|needsInstance:boolean"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "weaponReward",
								"needsInstance": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 171,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armorReward",
								"needsInstance": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 172,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wand",
								"needsInstance": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 173,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "ring",
								"needsInstance": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 174,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 167,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "specialItemInventoryRules",
						"columns": "sourceClass:string|itemId:string|identified:boolean|cursed:boolean"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Bomb",
								"itemId": "bomb",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 182,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "DoubleBomb",
								"itemId": "doubleBomb",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 183,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "CorpseDust",
								"itemId": "corpseDust",
								"identified": "true",
								"cursed": "true"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 184,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "CeremonialCandle",
								"itemId": "candle",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 185,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Embers",
								"itemId": "embers",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 186,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Ankh",
								"itemId": "ankh",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 187,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Stylus",
								"itemId": "stylus",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 188,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "BrokenSeal",
								"itemId": "brokenSeal",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 189,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Honeypot",
								"itemId": "honeypot",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 190,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Alchemize",
								"itemId": "alchemize",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 191,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Bag",
								"itemId": "bag",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 192,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "SandBag",
								"itemId": "sandBag",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 193,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Torch",
								"itemId": "torch",
								"identified": "true",
								"cursed": "false"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 194,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 178,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "ringClassAliases",
						"columns": "sourceClass:string|item:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfAccuracy",
								"item": "ring_accuracy"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 202,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfArcana",
								"item": "ring_arcana"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 203,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfElements",
								"item": "ring_elements"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 204,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfEnergy",
								"item": "ring_energy"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 205,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfEvasion",
								"item": "ring_evasion"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 206,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfForce",
								"item": "ring_force"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 207,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfFuror",
								"item": "ring_furor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 208,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfHaste",
								"item": "ring_haste"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 209,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfMight",
								"item": "ring_might"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 210,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfSharpshooting",
								"item": "ring_sharpshooting"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 211,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfTenacity",
								"item": "ring_tenacity"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 212,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "RingOfWealth",
								"item": "ring_wealth"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 213,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 198,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemGroundKindAliases",
						"columns": "itemId:string|groundKind:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"itemId": "gold",
								"groundKind": "gold"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 221,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "energyCrystal",
								"groundKind": "stone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 222,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "gooBlob",
								"groundKind": "food"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 223,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "metalShard",
								"groundKind": "food"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 224,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "seed",
								"groundKind": "seed"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 225,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "weaponReward",
								"groundKind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 226,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "armorReward",
								"groundKind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 227,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "cloak",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 228,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "chalice",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 229,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "cape",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 230,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "toolkit",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 231,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "beacon",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 232,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "armband",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 233,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "horn",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 234,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "chains",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 235,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "wand",
								"groundKind": "wand"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 236,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "bomb",
								"groundKind": "bomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 237,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "doubleBomb",
								"groundKind": "bomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 238,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "corpseDust",
								"groundKind": "corpseDust"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 239,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "candle",
								"groundKind": "candle"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 240,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "embers",
								"groundKind": "embers"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 241,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "ankh",
								"groundKind": "ankh"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 242,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "stylus",
								"groundKind": "stylus"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 243,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "brokenSeal",
								"groundKind": "brokenSeal"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 244,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "honeypot",
								"groundKind": "honeypot"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 245,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "chargrilledMeat",
								"groundKind": "meat"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 246,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "alchemize",
								"groundKind": "alchemize"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 247,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "bag",
								"groundKind": "bag"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 248,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "sandBag",
								"groundKind": "sandBag"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 249,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"itemId": "torch",
								"groundKind": "torch"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 250,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 217,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemFrames",
						"columns": "kind:string|frame:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"kind": "dewdrop",
								"frame": "21"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 258,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "stone",
								"frame": "147"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 259,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "potion",
								"frame": "352"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 260,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "scroll",
								"frame": "304"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 261,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "meat",
								"frame": "432"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 262,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "gold",
								"frame": "18"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 263,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "armor",
								"frame": "176"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 264,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "weapon",
								"frame": "96"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 268,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "wand",
								"frame": "208"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 269,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "food",
								"frame": "437"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 270,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "seed",
								"frame": "58"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 271,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "petal",
								"frame": "39"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 273,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "darkGold",
								"frame": "453"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 274,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "dwarfToken",
								"frame": "454"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 275,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "amulet",
								"frame": "61"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 276,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "ring",
								"frame": "224"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 277,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "crystalKey",
								"frame": "57"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 278,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "ironKey",
								"frame": "56"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 279,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "goldenKey",
								"frame": "56"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 280,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "bomb",
								"frame": "80"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 281,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "corpseDust",
								"frame": "465"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 282,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "candle",
								"frame": "466"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 283,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "embers",
								"frame": "467"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 284,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "ankh",
								"frame": "48"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 285,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "stylus",
								"frame": "49"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 286,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "brokenSeal",
								"frame": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 288,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "honeypot",
								"frame": "53"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 289,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "alchemize",
								"frame": "237"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 290,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "bag",
								"frame": "480"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 291,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "sandBag",
								"frame": "23"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 292,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "torch",
								"frame": "51"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 295,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 254,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "equipmentStatRules",
						"columns": "kind:string|minFormula:string|maxFormula:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"kind": "weaponDamage",
								"minFormula": "tier+level",
								"maxFormula": "5*(tier+1)+level*(tier+1)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 303,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"kind": "armorReduction",
								"minFormula": "level",
								"maxFormula": "tier*(2+level)"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 304,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 299,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemSpecificFrames",
						"columns": "item:string|frame:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "clothArmor",
								"frame": "176"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 312,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "rose",
								"frame": "277"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 315,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armor",
								"frame": "176"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 316,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armorReward",
								"frame": "176"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 317,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "weaponReward",
								"frame": "96"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 318,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "food",
								"frame": "437"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 319,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "meat",
								"frame": "432"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 320,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chargrilledMeat",
								"frame": "432"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 321,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seed",
								"frame": "58"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 322,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "waterskin",
								"frame": "480"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 323,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "velvetPouch",
								"frame": "482"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 324,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "cloak",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 325,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "hourglass",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 326,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chalice",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 327,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "cape",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 328,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "toolkit",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 329,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "beacon",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 330,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "armband",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 331,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "horn",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 332,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chains",
								"frame": "240"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 333,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "spiritBow",
								"frame": "144"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 334,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wand",
								"frame": "208"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 335,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "holyTome",
								"frame": "246"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 336,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "darkGold",
								"frame": "453"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 337,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "dwarfToken",
								"frame": "454"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 338,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "kingsCrown",
								"frame": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 339,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "amulet",
								"frame": "61"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 340,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "bomb",
								"frame": "80"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 341,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "infernalBrew",
								"frame": "400"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 343,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "blizzardBrew",
								"frame": "401"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 344,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "shockingBrew",
								"frame": "402"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 345,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "causticBrew",
								"frame": "403"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 346,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "corpseDust",
								"frame": "465"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 347,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "torch",
								"frame": "51"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 348,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 308,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "consumableStats",
						"columns": "item:string|hunger:number|heal:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "food",
								"hunger": "300",
								"heal": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 356,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "meat",
								"hunger": "150",
								"heal": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 357,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chargrilledMeat",
								"hunger": "150",
								"heal": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 358,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stewedMeat",
								"hunger": "150",
								"heal": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 359,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "meatPie",
								"hunger": "900",
								"heal": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 360,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "pasty",
								"hunger": "450",
								"heal": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 361,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 352,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemEffectValues",
						"columns": "id:string|item:string|effect:string|value:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "potionStrengthStrengthBonus",
								"item": "potionStrength",
								"effect": "strengthBonus",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 369,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionFlameFireVolume",
								"item": "potionFlame",
								"effect": "fireVolume",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 370,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionToxicGasGasVolume",
								"item": "potionToxicGas",
								"effect": "gasVolume",
								"value": "1000"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 371,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionParalyticGasGasVolume",
								"item": "potionParalyticGas",
								"effect": "gasVolume",
								"value": "1000"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 372,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionFrostTargetRadius",
								"item": "potionFrost",
								"effect": "targetRadius",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 374,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "fireBombFireRadius",
								"item": "fireBomb",
								"effect": "fireRadius",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 375,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "fireBombFireDuration",
								"item": "fireBomb",
								"effect": "fireDuration",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 376,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "regrowthBombBloomRadius",
								"item": "regrowthBomb",
								"effect": "bloomRadius",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 377,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "regrowthBombNoHealingPoisonBase",
								"item": "regrowthBomb",
								"effect": "noHealingPoisonBase",
								"value": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 378,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "regrowthBombNoHealingPoisonLevelDivisor",
								"item": "regrowthBomb",
								"effect": "noHealingPoisonLevelDivisor",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 379,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "woollyBombSheepCount",
								"item": "woollyBomb",
								"effect": "sheepCount",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 380,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "holyBombDamageFraction",
								"item": "holyBomb",
								"effect": "damageFraction",
								"value": "0.5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 381,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hourglassMaxChargeBase",
								"item": "hourglass",
								"effect": "maxChargeBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 382,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hourglassMaxChargePerLevel",
								"item": "hourglass",
								"effect": "maxChargePerLevel",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 383,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hourglassMaxChargeLevelCap",
								"item": "hourglass",
								"effect": "maxChargeLevelCap",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 384,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hourglassSandBagCap",
								"item": "hourglass",
								"effect": "sandBagCap",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 388,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hourglassTurnsPerCharge",
								"item": "hourglass",
								"effect": "turnsPerCharge",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 389,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hourglassTurnsToCost",
								"item": "hourglass",
								"effect": "turnsToCost",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 390,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "cloakInitialChargeBase",
								"item": "cloak",
								"effect": "initialChargeBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 391,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "cloakInitialChargeCap",
								"item": "cloak",
								"effect": "initialChargeCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 392,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "cloakTurnsToCost",
								"item": "cloak",
								"effect": "turnsToCost",
								"value": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 393,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceLevelCap",
								"item": "chalice",
								"effect": "levelCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 394,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceMinDmgBase",
								"item": "chalice",
								"effect": "minDmgBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 395,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceMinDmgPerLevelSq",
								"item": "chalice",
								"effect": "minDmgPerLevelSq",
								"value": "2.5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 396,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceMaxDmgBase",
								"item": "chalice",
								"effect": "maxDmgBase",
								"value": "7"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 397,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceMaxDmgPerLevelSq",
								"item": "chalice",
								"effect": "maxDmgPerLevelSq",
								"value": "3.5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 398,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "capeLevelCap",
								"item": "cape",
								"effect": "levelCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 399,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "capeChargeCap",
								"item": "cape",
								"effect": "chargeCap",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 400,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "capeChargePerDamageBase",
								"item": "cape",
								"effect": "chargePerDamageBase",
								"value": "0.5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 401,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "capeChargePerDamagePerLevel",
								"item": "cape",
								"effect": "chargePerDamagePerLevel",
								"value": "0.05"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 402,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "capeCooldownBase",
								"item": "cape",
								"effect": "cooldownBase",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 403,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "capeExpPerLevelBase",
								"item": "cape",
								"effect": "expPerLevelBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 404,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "toolkitLevelCap",
								"item": "toolkit",
								"effect": "levelCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 405,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "toolkitEnergizeCost",
								"item": "toolkit",
								"effect": "energizeCost",
								"value": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 406,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconLevelCap",
								"item": "beacon",
								"effect": "levelCap",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 407,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconChargeCapBase",
								"item": "beacon",
								"effect": "chargeCapBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 408,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconChargeCapPerLevel",
								"item": "beacon",
								"effect": "chargeCapPerLevel",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 409,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconZapCostBase",
								"item": "beacon",
								"effect": "zapCostBase",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 410,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconZapCostHighDepth",
								"item": "beacon",
								"effect": "zapCostHighDepth",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 411,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconZapCostDepthThreshold",
								"item": "beacon",
								"effect": "zapCostDepthThreshold",
								"value": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 412,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconZapRange",
								"item": "beacon",
								"effect": "zapRange",
								"value": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 417,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconRechargeBase",
								"item": "beacon",
								"effect": "rechargeBase",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 418,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "beaconRechargeCapWeight",
								"item": "beacon",
								"effect": "rechargeCapWeight",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 419,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandLevelCap",
								"item": "armband",
								"effect": "levelCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 420,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandChargeCapBase",
								"item": "armband",
								"effect": "chargeCapBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 421,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandChargeGainBase",
								"item": "armband",
								"effect": "chargeGainBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 422,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandLootMultiplierBase",
								"item": "armband",
								"effect": "lootMultiplierBase",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 423,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandLootMultiplierPerLevel",
								"item": "armband",
								"effect": "lootMultiplierPerLevel",
								"value": "0.1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 424,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandSurpriseLootBonus",
								"item": "armband",
								"effect": "surpriseLootBonus",
								"value": "0.5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 425,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandDebuffDurationBase",
								"item": "armband",
								"effect": "debuffDurationBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 426,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandSurpriseDebuffBonus",
								"item": "armband",
								"effect": "surpriseDebuffBonus",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 427,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandMaxLvlLootCutoff",
								"item": "armband",
								"effect": "maxLvlLootCutoff",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 428,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandExpPerUse",
								"item": "armband",
								"effect": "expPerUse",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 429,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandSurpriseExpBonus",
								"item": "armband",
								"effect": "surpriseExpBonus",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 430,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandExpToLevelBase",
								"item": "armband",
								"effect": "expToLevelBase",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 431,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "armbandExpToLevelPerLevel",
								"item": "armband",
								"effect": "expToLevelPerLevel",
								"value": "3.33"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 432,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hornLevelCap",
								"item": "horn",
								"effect": "levelCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 433,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hornChargeCapBase",
								"item": "horn",
								"effect": "chargeCapBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 434,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hornChargeGainBase",
								"item": "horn",
								"effect": "chargeGainBase",
								"value": "0.25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 435,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hornChargeGainPerLevel",
								"item": "horn",
								"effect": "chargeGainPerLevel",
								"value": "0.125"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 436,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hornSatietyDivisor",
								"item": "horn",
								"effect": "satietyDivisor",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 440,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hornPastyBonusFraction",
								"item": "horn",
								"effect": "pastyBonusFraction",
								"value": "0.5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 445,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "hornMeatPieBonusFraction",
								"item": "horn",
								"effect": "meatPieBonusFraction",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 446,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsLevelCap",
								"item": "chains",
								"effect": "levelCap",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 447,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsChargeCapBase",
								"item": "chains",
								"effect": "chargeCapBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 452,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsChargeCapPerLevel",
								"item": "chains",
								"effect": "chargeCapPerLevel",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 453,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsRechargeBase",
								"item": "chains",
								"effect": "rechargeBase",
								"value": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 457,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsRechargeCapWeight",
								"item": "chains",
								"effect": "rechargeCapWeight",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 458,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsCursedCrippleDuration",
								"item": "chains",
								"effect": "cursedCrippleDuration",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 461,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsExpToLevelBase",
								"item": "chains",
								"effect": "expToLevelBase",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 462,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsExpToLevelPerLevel",
								"item": "chains",
								"effect": "expToLevelPerLevel",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 463,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chainsGainExpChargeScale",
								"item": "chains",
								"effect": "gainExpChargeScale",
								"value": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 464,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsLevelCap",
								"item": "sandals",
								"effect": "levelCap",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 473,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsChargeCap",
								"item": "sandals",
								"effect": "chargeCap",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 474,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsChargeGainBase",
								"item": "sandals",
								"effect": "chargeGainBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 477,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsChargeGainDivisor",
								"item": "sandals",
								"effect": "chargeGainDivisor",
								"value": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 478,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsFeedThresholdBase",
								"item": "sandals",
								"effect": "feedThresholdBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 482,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsFeedThresholdPerLevel",
								"item": "sandals",
								"effect": "feedThresholdPerLevel",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 483,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsRootRange",
								"item": "sandals",
								"effect": "rootRange",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 487,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsSeedChanceBase",
								"item": "sandals",
								"effect": "seedChanceBase",
								"value": "25"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 491,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsSeedChancePerLevel",
								"item": "sandals",
								"effect": "seedChancePerLevel",
								"value": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 492,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsDewChanceBase",
								"item": "sandals",
								"effect": "dewChanceBase",
								"value": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 493,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "sandalsDewChanceLevelDivisor",
								"item": "sandals",
								"effect": "dewChanceLevelDivisor",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 494,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanChargeCap",
								"item": "talisman",
								"effect": "chargeCap",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 497,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanLevelCap",
								"item": "talisman",
								"effect": "levelCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 498,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanScryMinCharge",
								"item": "talisman",
								"effect": "scryMinCharge",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 499,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanMaxDistBase",
								"item": "talisman",
								"effect": "maxDistBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 502,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanMaxDistPerLevel",
								"item": "talisman",
								"effect": "maxDistPerLevel",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 503,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanMaxDistChargeOffset",
								"item": "talisman",
								"effect": "maxDistChargeOffset",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 504,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanMaxDistChargeDivisor",
								"item": "talisman",
								"effect": "maxDistChargeDivisor",
								"value": "1.08"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 505,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanAngleBase",
								"item": "talisman",
								"effect": "angleBase",
								"value": "200"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 509,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanAngleDecay",
								"item": "talisman",
								"effect": "angleDecay",
								"value": "0.92"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 510,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanScryCostBase",
								"item": "talisman",
								"effect": "scryCostBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 511,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanScryCostPerTile",
								"item": "talisman",
								"effect": "scryCostPerTile",
								"value": "1.08"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 512,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanChargeGainBase",
								"item": "talisman",
								"effect": "chargeGainBase",
								"value": "0.05"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 516,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanChargeGainPerLevel",
								"item": "talisman",
								"effect": "chargeGainPerLevel",
								"value": "0.005"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 517,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanAwarenessBase",
								"item": "talisman",
								"effect": "awarenessBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 518,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanAwarenessPerLevel",
								"item": "talisman",
								"effect": "awarenessPerLevel",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 519,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanProcBase",
								"item": "talisman",
								"effect": "procBase",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 523,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanProcPerTile",
								"item": "talisman",
								"effect": "procPerTile",
								"value": "1.08"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 524,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanExpToLevelBase",
								"item": "talisman",
								"effect": "expToLevelBase",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 527,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanExpToLevelPerLevel",
								"item": "talisman",
								"effect": "expToLevelPerLevel",
								"value": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 528,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanExpMappedCell",
								"item": "talisman",
								"effect": "expMappedCell",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 529,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanExpUnseen",
								"item": "talisman",
								"effect": "expUnseen",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 530,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanExpSecretTrap",
								"item": "talisman",
								"effect": "expSecretTrap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 531,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "talismanExpSecretDoor",
								"item": "talisman",
								"effect": "expSecretDoor",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 532,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseLevelCap",
								"item": "rose",
								"effect": "levelCap",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 535,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseChargeCap",
								"item": "rose",
								"effect": "chargeCap",
								"value": "100"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 536,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostHpBase",
								"item": "rose",
								"effect": "ghostHpBase",
								"value": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 539,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostHpPerLevel",
								"item": "rose",
								"effect": "ghostHpPerLevel",
								"value": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 540,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostAttackSkillOffset",
								"item": "rose",
								"effect": "ghostAttackSkillOffset",
								"value": "9"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 543,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostDefenseSkillOffset",
								"item": "rose",
								"effect": "ghostDefenseSkillOffset",
								"value": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 544,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostDamageMin",
								"item": "rose",
								"effect": "ghostDamageMin",
								"value": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 548,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostDamageMax",
								"item": "rose",
								"effect": "ghostDamageMax",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 549,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostStrengthBase",
								"item": "rose",
								"effect": "ghostStrengthBase",
								"value": "13"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 551,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostStrengthLevelDivisor",
								"item": "rose",
								"effect": "ghostStrengthLevelDivisor",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 552,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseGhostHealTurns",
								"item": "rose",
								"effect": "ghostHealTurns",
								"value": "500"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 555,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "roseRechargePerTurn",
								"item": "rose",
								"effect": "rechargePerTurn",
								"value": "0.2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 556,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "rosePetalDropCap",
								"item": "rose",
								"effect": "petalDropCap",
								"value": "11"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 559,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthTriesToDropMax",
								"item": "wealth",
								"effect": "triesToDropMax",
								"value": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 564,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthDropsToEquipMin",
								"item": "wealth",
								"effect": "dropsToEquipMin",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 565,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthDropsToEquipMax",
								"item": "wealth",
								"effect": "dropsToEquipMax",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 566,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthLowTierBase",
								"item": "wealth",
								"effect": "lowTierBase",
								"value": "0.6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 567,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthLowTierPerLevel",
								"item": "wealth",
								"effect": "lowTierPerLevel",
								"value": "0.04"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 568,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthMidTierBase",
								"item": "wealth",
								"effect": "midTierBase",
								"value": "0.9"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 569,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthMidTierPerLevel",
								"item": "wealth",
								"effect": "midTierPerLevel",
								"value": "0.02"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 570,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthBossRolls",
								"item": "wealth",
								"effect": "bossRolls",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 571,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wealthMinibossRolls",
								"item": "wealth",
								"effect": "minibossRolls",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 572,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "artifactRechargeDuration",
								"item": "artifactRecharge",
								"effect": "duration",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 576,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "artifactRechargeWildEnergyTurns",
								"item": "artifactRecharge",
								"effect": "wildEnergyTurns",
								"value": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 577,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceRechargeBase",
								"item": "chalice",
								"effect": "rechargeBase",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 580,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceRechargeLevelBase",
								"item": "chalice",
								"effect": "rechargeLevelBase",
								"value": "1.33"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 581,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceRechargeLevelScale",
								"item": "chalice",
								"effect": "rechargeLevelScale",
								"value": "0.667"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 582,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "chaliceRechargeHealTurns",
								"item": "chalice",
								"effect": "rechargeHealTurns",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 583,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wardingEnergyBase",
								"item": "wandWarding",
								"effect": "energyBase",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 584,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wardingEnergyPerLevel",
								"item": "wandWarding",
								"effect": "energyPerLevel",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 585,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wardingSpawnHpBase",
								"item": "wandWarding",
								"effect": "spawnHpBase",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 586,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wardingSpawnHpPerLevel",
								"item": "wandWarding",
								"effect": "spawnHpPerLevel",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 587,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "potionFrostRadius",
								"item": "potionFrost",
								"effect": "radius",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 588,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollMirrorImageCount",
								"item": "scrollMirror",
								"effect": "imageCount",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 589,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollRetributionMaxPower",
								"item": "scrollRetribution",
								"effect": "maxPower",
								"value": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 590,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollRetributionPowerPerMissingHp",
								"item": "scrollRetribution",
								"effect": "powerPerMissingHp",
								"value": "4.45"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 591,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollRetributionTargetHpScale",
								"item": "scrollRetribution",
								"effect": "targetHpScale",
								"value": "0.225"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 592,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "scrollRetributionBaseHpFraction",
								"item": "scrollRetribution",
								"effect": "baseHpFraction",
								"value": "0.1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 593,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneTargetRange",
								"item": "runestones",
								"effect": "targetRange",
								"value": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 594,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneFlockRadius",
								"item": "runestones",
								"effect": "flockRadius",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 595,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneAggressionBossDuration",
								"item": "runestones",
								"effect": "aggressionBossDuration",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 596,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneClairvoyanceDistance",
								"item": "runestones",
								"effect": "clairvoyanceDistance",
								"value": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 597,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneShockBurstRadius",
								"item": "runestones",
								"effect": "shockBurstRadius",
								"value": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 598,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneShockBaseRefund",
								"item": "runestones",
								"effect": "shockBaseRefund",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 599,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneBlastRadius",
								"item": "runestones",
								"effect": "blastRadius",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 600,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneBlastMinBase",
								"item": "runestones",
								"effect": "blastMinBase",
								"value": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 601,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneBlastMinPerDepth",
								"item": "runestones",
								"effect": "blastMinPerDepth",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 602,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneBlastMaxBase",
								"item": "runestones",
								"effect": "blastMaxBase",
								"value": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 603,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "stoneBlastMaxPerDepth",
								"item": "runestones",
								"effect": "blastMaxPerDepth",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 604,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "bombTargetRange",
								"item": "bombs",
								"effect": "targetRange",
								"value": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 605,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "waterskinHealFraction",
								"item": "waterskin",
								"effect": "healFractionPerDrop",
								"value": "0.05"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 606,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "transfusionSelfDamageFraction",
								"item": "wandTransfusion",
								"effect": "selfDamageFraction",
								"value": "0.05"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 607,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "transfusionHealingPerLevel",
								"item": "wandTransfusion",
								"effect": "healingPerLevel",
								"value": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 608,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "transfusionShieldBase",
								"item": "wandTransfusion",
								"effect": "shieldBase",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 609,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "transfusionShieldPerLevel",
								"item": "wandTransfusion",
								"effect": "shieldPerLevel",
								"value": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 610,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 365,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "sandalsSeedReqs",
						"columns": "seed:string|charge:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"seed": "rotberry",
								"charge": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 625,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "firebloom",
								"charge": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 626,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "swiftthistle",
								"charge": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 627,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "sungrass",
								"charge": "80"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 628,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "icecap",
								"charge": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 629,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "stormvine",
								"charge": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 630,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "sorrowmoss",
								"charge": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 631,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "mageroyal",
								"charge": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 632,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "earthroot",
								"charge": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 633,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "starflower",
								"charge": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 634,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "fadeleaf",
								"charge": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 635,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"seed": "blindweed",
								"charge": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 636,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 614,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "consumableDescriptionKeys",
						"columns": "item:string|descriptionKey:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "potionStrength",
								"descriptionKey": "items.potions.potionofstrength.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 644,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionHealing",
								"descriptionKey": "items.potions.potionofhealing.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 645,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionMindVision",
								"descriptionKey": "items.potions.potionofmindvision.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 646,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionFrost",
								"descriptionKey": "items.potions.potionoffrost.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 647,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionFlame",
								"descriptionKey": "items.potions.potionofliquidflame.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 648,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionToxicGas",
								"descriptionKey": "items.potions.potionoftoxicgas.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 649,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionHaste",
								"descriptionKey": "items.potions.potionofhaste.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 650,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionInvis",
								"descriptionKey": "items.potions.potionofinvisibility.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 651,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionShrouding",
								"descriptionKey": "items.potions.exotic.potionofshroudingfog.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 652,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionLevitation",
								"descriptionKey": "items.potions.potionoflevitation.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 653,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionParalyticGas",
								"descriptionKey": "items.potions.potionofparalyticgas.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 654,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionPurity",
								"descriptionKey": "items.potions.potionofpurity.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 655,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionExperience",
								"descriptionKey": "items.potions.potionofexperience.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 656,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollUpgrade",
								"descriptionKey": "items.scrolls.scrollofupgrade.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 657,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollIdentify",
								"descriptionKey": "items.scrolls.scrollofidentify.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 658,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollCleanse",
								"descriptionKey": "items.scrolls.scrollofremovecurse.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 659,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollMirror",
								"descriptionKey": "items.scrolls.scrollofmirrorimage.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 660,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollPrismatic",
								"descriptionKey": "items.scrolls.exotic.scrollofprismaticimage.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 661,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollRecharging",
								"descriptionKey": "items.scrolls.scrollofrecharging.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 662,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollTeleportation",
								"descriptionKey": "items.scrolls.scrollofteleportation.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 663,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollLullaby",
								"descriptionKey": "items.scrolls.scrolloflullaby.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 664,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollMapping",
								"descriptionKey": "items.scrolls.scrollofmagicmapping.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 665,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollRage",
								"descriptionKey": "items.scrolls.scrollofrage.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 666,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollRetribution",
								"descriptionKey": "items.scrolls.scrollofretribution.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 667,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollTerror",
								"descriptionKey": "items.scrolls.scrollofterror.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 668,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollTransmutation",
								"descriptionKey": "items.scrolls.scrolloftransmutation.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 669,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedRotberry",
								"descriptionKey": "plants.rotberry.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 670,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedSungrass",
								"descriptionKey": "plants.sungrass.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 671,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedFadeleaf",
								"descriptionKey": "plants.fadeleaf.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 672,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedIcecap",
								"descriptionKey": "plants.icecap.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 673,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedFirebloom",
								"descriptionKey": "plants.firebloom.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 674,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedSorrowmoss",
								"descriptionKey": "plants.sorrowmoss.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 675,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedSwiftthistle",
								"descriptionKey": "plants.swiftthistle.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 676,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedBlindweed",
								"descriptionKey": "plants.blindweed.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 677,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedStormvine",
								"descriptionKey": "plants.stormvine.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 678,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedEarthroot",
								"descriptionKey": "plants.earthroot.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 679,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedMageroyal",
								"descriptionKey": "plants.mageroyal.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 680,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seedStarflower",
								"descriptionKey": "plants.starflower.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 681,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfEnchantment",
								"descriptionKey": "items.stones.stoneofenchantment.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 682,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfIntuition",
								"descriptionKey": "items.stones.stoneofintuition.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 683,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfFlock",
								"descriptionKey": "items.stones.stoneofflock.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 684,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfShock",
								"descriptionKey": "items.stones.stoneofshock.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 685,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfBlink",
								"descriptionKey": "items.stones.stoneofblink.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 686,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfDeepSleep",
								"descriptionKey": "items.stones.stoneofdeepsleep.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 687,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfClairvoyance",
								"descriptionKey": "items.stones.stoneofclairvoyance.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 688,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfAggression",
								"descriptionKey": "items.stones.stoneofaggression.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 689,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfBlast",
								"descriptionKey": "items.stones.stoneofblast.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 690,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfFear",
								"descriptionKey": "items.stones.stoneoffear.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 691,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfAugmentation",
								"descriptionKey": "items.stones.stoneofaugmentation.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 692,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "food",
								"descriptionKey": "items.food.food.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 693,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "meat",
								"descriptionKey": "items.food.mysterymeat.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 694,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "chargrilledMeat",
								"descriptionKey": "items.food.chargrilledmeat.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 695,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stewedMeat",
								"descriptionKey": "items.food.stewedmeat.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 696,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "meatPie",
								"descriptionKey": "items.food.meatpie.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 697,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "bomb",
								"descriptionKey": "items.bombs.bomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 698,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "doubleBomb",
								"descriptionKey": "items.bombs.bomb$doublebomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 699,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "frostBomb",
								"descriptionKey": "items.bombs.frostbomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 700,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "woollyBomb",
								"descriptionKey": "items.bombs.woollybomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 701,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "fireBomb",
								"descriptionKey": "items.bombs.firebomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 702,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "noisemaker",
								"descriptionKey": "items.bombs.noisemaker.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 703,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "flashbang",
								"descriptionKey": "port.desc.flashbang"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 704,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "smokeBomb",
								"descriptionKey": "port.desc.smokebomb"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 705,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "regrowthBomb",
								"descriptionKey": "items.bombs.regrowthbomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 706,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "holyBomb",
								"descriptionKey": "items.bombs.holybomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 707,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "arcaneBomb",
								"descriptionKey": "items.bombs.arcanebomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 708,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "shrapnelBomb",
								"descriptionKey": "items.bombs.shrapnelbomb.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 709,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 640,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "equipmentDescriptionKeys",
						"columns": "item:string|descriptionKey:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "wornshortsword",
								"descriptionKey": "items.weapon.melee.wornshortsword.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 717,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "magesstaff",
								"descriptionKey": "items.weapon.melee.magesstaff.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 718,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "dagger",
								"descriptionKey": "items.weapon.melee.dagger.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 719,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "gloves",
								"descriptionKey": "items.weapon.melee.gloves.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 720,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "rapier",
								"descriptionKey": "items.weapon.melee.rapier.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 721,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "shortsword",
								"descriptionKey": "items.weapon.melee.shortsword.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 722,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "handaxe",
								"descriptionKey": "items.weapon.melee.handaxe.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 723,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "spear",
								"descriptionKey": "items.weapon.melee.spear.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 724,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "quarterstaff",
								"descriptionKey": "items.weapon.melee.quarterstaff.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 725,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "dirk",
								"descriptionKey": "items.weapon.melee.dirk.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 726,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "sickle",
								"descriptionKey": "items.weapon.melee.sickle.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 727,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "sword",
								"descriptionKey": "items.weapon.melee.sword.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 728,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "mace",
								"descriptionKey": "items.weapon.melee.mace.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 729,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scimitar",
								"descriptionKey": "items.weapon.melee.scimitar.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 730,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "roundshield",
								"descriptionKey": "items.weapon.melee.roundshield.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 731,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "sai",
								"descriptionKey": "items.weapon.melee.sai.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 732,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "whip",
								"descriptionKey": "items.weapon.melee.whip.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 733,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "longsword",
								"descriptionKey": "items.weapon.melee.longsword.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 734,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "battleaxe",
								"descriptionKey": "items.weapon.melee.battleaxe.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 735,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "flail",
								"descriptionKey": "items.weapon.melee.flail.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 736,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "runicblade",
								"descriptionKey": "items.weapon.melee.runicblade.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 737,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "assassinsblade",
								"descriptionKey": "items.weapon.melee.assassinsblade.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 738,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "crossbow",
								"descriptionKey": "items.weapon.melee.crossbow.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 739,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "katana",
								"descriptionKey": "items.weapon.melee.katana.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 740,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "greatsword",
								"descriptionKey": "items.weapon.melee.greatsword.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 741,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "warhammer",
								"descriptionKey": "items.weapon.melee.warhammer.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 742,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "glaive",
								"descriptionKey": "items.weapon.melee.glaive.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 743,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "greataxe",
								"descriptionKey": "items.weapon.melee.greataxe.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 744,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "greatshield",
								"descriptionKey": "items.weapon.melee.greatshield.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 745,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "gauntlet",
								"descriptionKey": "items.weapon.melee.gauntlet.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 746,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "warscythe",
								"descriptionKey": "items.weapon.melee.warscythe.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 747,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "clotharmor",
								"descriptionKey": "items.armor.clotharmor.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 748,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "leatherarmor",
								"descriptionKey": "items.armor.leatherarmor.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 749,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "mailarmor",
								"descriptionKey": "items.armor.mailarmor.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 750,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scalearmor",
								"descriptionKey": "items.armor.scalearmor.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 751,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "platearmor",
								"descriptionKey": "items.armor.platearmor.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 752,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandmagicmissile",
								"descriptionKey": "items.wands.wandofmagicmissile.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 753,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandfrost",
								"descriptionKey": "items.wands.wandoffrost.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 754,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandfirebolt",
								"descriptionKey": "items.wands.wandoffireblast.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 755,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandlightning",
								"descriptionKey": "items.wands.wandoflightning.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 756,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandcorrosion",
								"descriptionKey": "items.wands.wandofcorrosion.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 757,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandcorruption",
								"descriptionKey": "items.wands.wandofcorruption.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 758,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandblast",
								"descriptionKey": "items.wands.wandofblastwave.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 759,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandlivingearth",
								"descriptionKey": "items.wands.wandoflivingearth.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 760,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandregrowth",
								"descriptionKey": "items.wands.wandofregrowth.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 761,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandprismatic",
								"descriptionKey": "items.wands.wandofprismaticlight.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 762,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wandwarding",
								"descriptionKey": "items.wands.wandofwarding.desc"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 763,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 713,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "bombRules",
						"columns": "variant:string|chainRadius:number|affectedRadius:number|baseBlast:boolean|piercesArmor:boolean|minBase:number|minPerDepth:number|maxBase:number|maxPerDepth:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"variant": "standard",
								"chainRadius": "1",
								"affectedRadius": "2",
								"baseBlast": "true",
								"piercesArmor": "false",
								"minBase": "4",
								"minPerDepth": "1",
								"maxBase": "12",
								"maxPerDepth": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 771,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "tengu",
								"chainRadius": "2",
								"affectedRadius": "2",
								"baseBlast": "true",
								"piercesArmor": "false",
								"minBase": "5",
								"minPerDepth": "1",
								"maxBase": "10",
								"maxPerDepth": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 772,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "specialty",
								"chainRadius": "2",
								"affectedRadius": "2",
								"baseBlast": "true",
								"piercesArmor": "false",
								"minBase": "4",
								"minPerDepth": "1",
								"maxBase": "12",
								"maxPerDepth": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 773,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "regrowthBomb",
								"chainRadius": "3",
								"affectedRadius": "2",
								"baseBlast": "false",
								"piercesArmor": "false",
								"minBase": "4",
								"minPerDepth": "1",
								"maxBase": "12",
								"maxPerDepth": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 774,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "arcaneBomb",
								"chainRadius": "2",
								"affectedRadius": "2",
								"baseBlast": "false",
								"piercesArmor": "true",
								"minBase": "4",
								"minPerDepth": "1",
								"maxBase": "12",
								"maxPerDepth": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 775,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"variant": "shrapnelBomb",
								"chainRadius": "8",
								"affectedRadius": "8",
								"baseBlast": "false",
								"piercesArmor": "false",
								"minBase": "4",
								"minPerDepth": "1",
								"maxBase": "12",
								"maxPerDepth": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 776,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 767,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemLimits",
						"columns": "item:string|value:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "waterskin",
								"value": "20"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
								"line": 784,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
						"line": 780,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\item-rules.mwl",
				"line": 3,
				"column": 5
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
						"name": "items.weapon.melee.wornshortsword.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_magesstaff_t1",
						"name": "items.weapon.melee.magesstaff.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 13,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_dagger_t1",
						"name": "items.weapon.melee.dagger.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 19,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_gloves_t1",
						"name": "items.weapon.melee.gloves.name",
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
								"line": 31,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 25,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "weapon_rapier_t1",
						"name": "items.weapon.melee.rapier.name",
						"slot": "weapon"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 38,
						"column": 9
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
						"line": 44,
						"column": 9
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
						"line": 50,
						"column": 9
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
						"line": 56,
						"column": 9
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
						"line": 62,
						"column": 9
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
						"line": 68,
						"column": 9
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
						"line": 74,
						"column": 9
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
						"line": 80,
						"column": 9
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
						"line": 86,
						"column": 9
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
						"line": 92,
						"column": 9
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
						"line": 98,
						"column": 9
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
						"line": 104,
						"column": 9
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
						"line": 110,
						"column": 9
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
						"line": 116,
						"column": 9
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
						"line": 122,
						"column": 9
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
						"line": 128,
						"column": 9
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
						"line": 134,
						"column": 9
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
						"line": 140,
						"column": 9
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
						"line": 146,
						"column": 9
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
						"line": 152,
						"column": 9
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
						"line": 158,
						"column": 9
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
						"line": 164,
						"column": 9
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
						"line": 170,
						"column": 9
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
						"line": 176,
						"column": 9
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
						"line": 182,
						"column": 9
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
						"line": 188,
						"column": 9
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
						"line": 194,
						"column": 9
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
						"line": 200,
						"column": 9
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
						"line": 206,
						"column": 9
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
						"line": 212,
						"column": 9
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
						"line": 218,
						"column": 9
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
						"line": 224,
						"column": 9
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
								"line": 236,
								"column": 13
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
								"line": 241,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 230,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t1",
						"name": "items.wands.wandoffireblast.name",
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
								"line": 254,
								"column": 13
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
								"line": 259,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 248,
						"column": 9
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
								"line": 272,
								"column": 13
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
								"line": 277,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 266,
						"column": 9
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
								"line": 290,
								"column": 13
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
								"line": 295,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 284,
						"column": 9
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
								"line": 308,
								"column": 13
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
								"line": 313,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 302,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t1",
						"name": "items.wands.wandofblastwave.name",
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
								"line": 326,
								"column": 13
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
								"line": 331,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 320,
						"column": 9
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
								"line": 344,
								"column": 13
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
								"line": 349,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 338,
						"column": 9
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
								"line": 362,
								"column": 13
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
								"line": 367,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 356,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t1",
						"name": "items.wands.wandofprismaticlight.name",
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
								"line": 380,
								"column": 13
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
								"line": 385,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 374,
						"column": 9
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
								"line": 398,
								"column": 13
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
								"line": 403,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 392,
						"column": 9
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
								"line": 416,
								"column": 13
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
								"line": 421,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 410,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t2",
						"name": "items.wands.wandoffireblast.name",
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
								"line": 434,
								"column": 13
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
								"line": 439,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 428,
						"column": 9
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
								"line": 452,
								"column": 13
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
								"line": 457,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 446,
						"column": 9
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
								"line": 470,
								"column": 13
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
								"line": 475,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 464,
						"column": 9
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
								"line": 488,
								"column": 13
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
								"line": 493,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 482,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t2",
						"name": "items.wands.wandofblastwave.name",
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
								"line": 506,
								"column": 13
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
								"line": 511,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 500,
						"column": 9
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
								"line": 524,
								"column": 13
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
								"line": 529,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 518,
						"column": 9
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
								"line": 542,
								"column": 13
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
								"line": 547,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 536,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t2",
						"name": "items.wands.wandofprismaticlight.name",
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
								"column": 13
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
								"line": 565,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 554,
						"column": 9
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
								"line": 578,
								"column": 13
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
								"line": 583,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 572,
						"column": 9
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
								"line": 596,
								"column": 13
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
								"line": 601,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 590,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t3",
						"name": "items.wands.wandoffireblast.name",
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
								"line": 614,
								"column": 13
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
								"line": 619,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 608,
						"column": 9
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
								"line": 632,
								"column": 13
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
								"line": 637,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 626,
						"column": 9
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
								"line": 650,
								"column": 13
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
								"line": 655,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 644,
						"column": 9
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
								"line": 668,
								"column": 13
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
								"line": 673,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 662,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t3",
						"name": "items.wands.wandofblastwave.name",
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
								"line": 686,
								"column": 13
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
								"line": 691,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 680,
						"column": 9
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
								"line": 704,
								"column": 13
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
								"line": 709,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 698,
						"column": 9
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
								"line": 722,
								"column": 13
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
								"line": 727,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 716,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t3",
						"name": "items.wands.wandofprismaticlight.name",
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
								"line": 740,
								"column": 13
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
								"line": 745,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 734,
						"column": 9
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
								"line": 758,
								"column": 13
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
								"line": 763,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 752,
						"column": 9
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
								"line": 776,
								"column": 13
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
								"line": 781,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 770,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t4",
						"name": "items.wands.wandoffireblast.name",
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
								"line": 794,
								"column": 13
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
								"line": 799,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 788,
						"column": 9
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
								"line": 812,
								"column": 13
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
								"line": 817,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 806,
						"column": 9
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
								"line": 830,
								"column": 13
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
								"line": 835,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 824,
						"column": 9
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
								"line": 848,
								"column": 13
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
								"line": 853,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 842,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t4",
						"name": "items.wands.wandofblastwave.name",
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
								"line": 866,
								"column": 13
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
								"line": 871,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 860,
						"column": 9
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
								"line": 884,
								"column": 13
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
								"line": 889,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 878,
						"column": 9
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
								"line": 902,
								"column": 13
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
								"line": 907,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 896,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t4",
						"name": "items.wands.wandofprismaticlight.name",
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
								"line": 920,
								"column": 13
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
								"line": 925,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 914,
						"column": 9
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
								"line": 938,
								"column": 13
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
								"line": 943,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 932,
						"column": 9
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
								"line": 956,
								"column": 13
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
								"line": 961,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 950,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandfirebolt_t5",
						"name": "items.wands.wandoffireblast.name",
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
								"line": 974,
								"column": 13
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
								"line": 979,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 968,
						"column": 9
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
								"line": 992,
								"column": 13
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
								"line": 997,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 986,
						"column": 9
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
								"line": 1010,
								"column": 13
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
								"line": 1015,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 1004,
						"column": 9
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
								"line": 1028,
								"column": 13
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
								"line": 1033,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 1022,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandblast_t5",
						"name": "items.wands.wandofblastwave.name",
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
								"line": 1046,
								"column": 13
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
								"line": 1051,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 1040,
						"column": 9
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
								"line": 1064,
								"column": 13
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
								"line": 1069,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 1058,
						"column": 9
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
								"line": 1082,
								"column": 13
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
								"line": 1087,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 1076,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "wand_wandprismatic_t5",
						"name": "items.wands.wandofprismaticlight.name",
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
								"line": 1100,
								"column": 13
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
								"line": 1105,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 1094,
						"column": 9
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
								"line": 1118,
								"column": 13
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
								"line": 1123,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
						"line": 1112,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\items.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 18,
								"column": 13
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
								"line": 24,
								"column": 13
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
								"line": 30,
								"column": 13
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
								"line": 36,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "causticSlime",
								"chance": "0.2",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 42,
								"column": 13
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
								"line": 53,
								"column": 13
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
								"line": 59,
								"column": 13
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
								"line": 65,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm201",
								"chance": "0.2",
								"kind": "armor"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 71,
								"column": 13
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
								"line": 80,
								"column": 13
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
								"line": 86,
								"column": 13
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
								"line": 92,
								"column": 13
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
								"line": 98,
								"column": 13
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
								"line": 104,
								"column": 13
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
								"line": 110,
								"column": 13
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
								"line": 116,
								"column": 13
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
								"line": 122,
								"column": 13
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
								"line": 128,
								"column": 13
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
								"line": 134,
								"column": 13
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
								"line": 140,
								"column": 13
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
								"line": 152,
								"column": 13
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
								"line": 158,
								"column": 13
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
								"line": 164,
								"column": 13
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
								"line": 170,
								"column": 13
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
								"line": 176,
								"column": 13
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
								"line": 184,
								"column": 13
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
								"line": 190,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "slime",
								"chance": "0.2",
								"kind": "weapon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 196,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "skeleton",
								"chance": "0.1666666667",
								"kind": "weapon"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
								"line": 206,
								"column": 13
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
								"line": 214,
								"column": 13
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
								"line": 220,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 233,
								"column": 13
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
								"line": 239,
								"column": 13
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
								"line": 245,
								"column": 13
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
								"line": 251,
								"column": 13
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
								"line": 257,
								"column": 13
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
								"line": 263,
								"column": 13
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
								"line": 269,
								"column": 13
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
								"line": 275,
								"column": 13
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
								"line": 281,
								"column": 13
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
								"line": 287,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
						"line": 228,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\loot-rules.mwl",
				"line": 3,
				"column": 5
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
						"line": 7,
						"column": 9
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
						"line": 14,
						"column": 9
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
						"line": 21,
						"column": 9
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
						"line": 28,
						"column": 9
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
						"line": 35,
						"column": 9
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
						"line": 42,
						"column": 9
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
						"line": 49,
						"column": 9
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
						"line": 56,
						"column": 9
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
						"line": 63,
						"column": 9
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
						"line": 70,
						"column": 9
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
						"line": 77,
						"column": 9
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
						"line": 84,
						"column": 9
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
						"line": 91,
						"column": 9
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
						"line": 98,
						"column": 9
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
						"line": 105,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "missile_tippeddart",
						"name": "items.weapon.missiles.darts.dart.name",
						"slot": "missile",
						"stackable": "true"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 112,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "missileDefinitions",
						"columns": "id:string|sourceClass:string|tier:number|minDamage:number|maxDamage:number|baseUses:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "missile_throwingstone",
								"sourceClass": "ThrowingStone",
								"tier": "1",
								"minDamage": "2",
								"maxDamage": "5",
								"baseUses": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 129,
								"column": 13
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
								"maxDamage": "6",
								"baseUses": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 138,
								"column": 13
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
								"maxDamage": "5",
								"baseUses": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 147,
								"column": 13
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
								"maxDamage": "10",
								"baseUses": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 156,
								"column": 13
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
								"maxDamage": "8",
								"baseUses": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 165,
								"column": 13
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
								"maxDamage": "8",
								"baseUses": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 174,
								"column": 13
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
								"maxDamage": "15",
								"baseUses": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 183,
								"column": 13
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
								"maxDamage": "12",
								"baseUses": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 192,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_bolas",
								"sourceClass": "Bolas",
								"tier": "3",
								"minDamage": "4",
								"maxDamage": "9",
								"baseUses": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 201,
								"column": 13
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
								"maxDamage": "20",
								"baseUses": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 210,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_tomahawk",
								"sourceClass": "Tomahawk",
								"tier": "4",
								"minDamage": "6",
								"maxDamage": "16",
								"baseUses": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 219,
								"column": 13
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
								"maxDamage": "16",
								"baseUses": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 228,
								"column": 13
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
								"maxDamage": "25",
								"baseUses": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 237,
								"column": 13
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
								"maxDamage": "20",
								"baseUses": "12"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 246,
								"column": 13
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
								"maxDamage": "25",
								"baseUses": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 255,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "missile_tippeddart",
								"sourceClass": "TippedDart",
								"tier": "2",
								"minDamage": "3",
								"maxDamage": "9",
								"baseUses": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 267,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 119,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "missileUpgradeRules",
						"columns": "sourceClass:string|minPerLevel:number|maxPerLevel:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ThrowingStone",
								"minPerLevel": "1",
								"maxPerLevel": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 293,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ThrowingKnife",
								"minPerLevel": "1",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 294,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ThrowingSpike",
								"minPerLevel": "1",
								"maxPerLevel": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 295,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "FishingSpear",
								"minPerLevel": "1",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 296,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ThrowingClub",
								"minPerLevel": "1",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 297,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Shuriken",
								"minPerLevel": "1",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 298,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ThrowingSpear",
								"minPerLevel": "1",
								"maxPerLevel": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 299,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Kunai",
								"minPerLevel": "1",
								"maxPerLevel": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 300,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Bolas",
								"minPerLevel": "0",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 301,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Javelin",
								"minPerLevel": "1",
								"maxPerLevel": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 302,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Tomahawk",
								"minPerLevel": "1",
								"maxPerLevel": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 303,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "HeavyBoomerang",
								"minPerLevel": "1",
								"maxPerLevel": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 304,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "Trident",
								"minPerLevel": "1",
								"maxPerLevel": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 305,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ThrowingHammer",
								"minPerLevel": "1",
								"maxPerLevel": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 306,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "ForceCube",
								"minPerLevel": "1",
								"maxPerLevel": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 307,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"sourceClass": "TippedDart",
								"minPerLevel": "1",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 308,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 278,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "missileDescriptionKeys",
						"columns": "id:string|item:string|descriptionKey:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_throwingstone",
								"descriptionKey": "items.weapon.missiles.throwingstone.desc",
								"item": "missile_throwingstone"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 316,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_throwingknife",
								"descriptionKey": "items.weapon.missiles.throwingknife.desc",
								"item": "missile_throwingknife"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 317,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_throwingspike",
								"descriptionKey": "items.weapon.missiles.throwingspike.desc",
								"item": "missile_throwingspike"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 318,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_fishingspear",
								"descriptionKey": "items.weapon.missiles.fishingspear.desc",
								"item": "missile_fishingspear"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 319,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_throwingclub",
								"descriptionKey": "items.weapon.missiles.throwingclub.desc",
								"item": "missile_throwingclub"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 320,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_shuriken",
								"descriptionKey": "items.weapon.missiles.shuriken.desc",
								"item": "missile_shuriken"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 321,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_throwingspear",
								"descriptionKey": "items.weapon.missiles.throwingspear.desc",
								"item": "missile_throwingspear"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 322,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_kunai",
								"descriptionKey": "items.weapon.missiles.kunai.desc",
								"item": "missile_kunai"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 323,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_bolas",
								"descriptionKey": "items.weapon.missiles.bolas.desc",
								"item": "missile_bolas"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 324,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_javelin",
								"descriptionKey": "items.weapon.missiles.javelin.desc",
								"item": "missile_javelin"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 325,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_tomahawk",
								"descriptionKey": "items.weapon.missiles.tomahawk.desc",
								"item": "missile_tomahawk"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 326,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_heavyboomerang",
								"descriptionKey": "items.weapon.missiles.heavyboomerang.desc",
								"item": "missile_heavyboomerang"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 327,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_trident",
								"descriptionKey": "items.weapon.missiles.trident.desc",
								"item": "missile_trident"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 328,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_throwinghammer",
								"descriptionKey": "items.weapon.missiles.throwinghammer.desc",
								"item": "missile_throwinghammer"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 329,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_forcecube",
								"descriptionKey": "items.weapon.missiles.forcecube.desc",
								"item": "missile_forcecube"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 330,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "description_missile_tippeddart",
								"descriptionKey": "items.weapon.missiles.darts.dart.desc",
								"item": "missile_tippeddart"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
								"line": 331,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 312,
						"column": 9
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
								"line": 340,
								"column": 13
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
								"line": 345,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 335,
						"column": 9
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
								"line": 357,
								"column": 13
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
								"line": 362,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 352,
						"column": 9
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
								"line": 374,
								"column": 13
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
								"line": 379,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 369,
						"column": 9
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
								"line": 391,
								"column": 13
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
								"line": 396,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 386,
						"column": 9
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
								"line": 408,
								"column": 13
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
								"line": 413,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
						"line": 403,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\missiles.mwl",
				"line": 3,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "rat",
				"name": "actors.mobs.rat.name",
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
				"line": 3,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "snake",
				"name": "actors.mobs.snake.name",
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
				"line": 18,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "gnoll",
				"name": "actors.mobs.gnoll.name",
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
				"line": 33,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "swarm",
				"name": "actors.mobs.swarm.name",
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
				"line": 48,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "crab",
				"name": "actors.mobs.crab.name",
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
				"line": 63,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "slime",
				"name": "actors.mobs.slime.name",
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
				"line": 78,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "goo",
				"name": "actors.mobs.goo.name",
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
				"line": 93,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "skeleton",
				"name": "actors.mobs.skeleton.name",
				"hp": "25",
				"accuracy": "12",
				"evasion": "9",
				"damage_min": "2",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "5",
				"max_level": "10",
				"image": "assets/skeleton.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 108,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ward",
				"name": "items.wands.wandofwarding$ward.name_1",
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
				"line": 125,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "sheep",
				"name": "actors.mobs.npcs.sheep.name",
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
				"line": 140,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ninjaLog",
				"name": "actors.hero.abilities.rogue.smokebomb$ninjalog.name",
				"hp": "20",
				"accuracy": "0",
				"evasion": "0",
				"damage_min": "0",
				"damage_max": "0",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/ninja_log.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 159,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "spiritHawk",
				"name": "actors.hero.abilities.huntress.spirithawk$hawkally.name",
				"hp": "10",
				"accuracy": "60",
				"evasion": "60",
				"damage_min": "5",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "0",
				"image": "assets/spirit_hawk.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 178,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "earthGuardian",
				"name": "items.wands.wandoflivingearth$earthguardian.name",
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
				"line": 193,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "thief",
				"name": "actors.mobs.thief.name",
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
				"line": 208,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm100",
				"name": "actors.mobs.dm100.name",
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
				"line": 223,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "guard",
				"name": "actors.mobs.guard.name",
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
				"line": 238,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "necromancer",
				"name": "actors.mobs.necromancer.name",
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
				"line": 253,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "tengu",
				"name": "actors.mobs.tengu.name",
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
				"line": 268,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "fetidRat",
				"name": "actors.mobs.fetidrat.name",
				"hp": "20",
				"accuracy": "12",
				"evasion": "5",
				"damage_min": "1",
				"damage_max": "4",
				"armor_min": "0",
				"armor_max": "3",
				"experience": "4",
				"max_level": "5",
				"image": "assets/rat.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 283,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "gnollTrickster",
				"name": "actors.mobs.gnolltrickster.name",
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
				"line": 300,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "greatCrab",
				"name": "actors.mobs.greatcrab.name",
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
				"line": 315,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "bat",
				"name": "actors.mobs.bat.name",
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
				"line": 330,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "brute",
				"name": "actors.mobs.brute.name",
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
				"line": 345,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "shaman",
				"name": "actors.mobs.shaman.name",
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
				"line": 360,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "spinner",
				"name": "actors.mobs.spinner.name",
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
				"line": 375,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm200",
				"name": "actors.mobs.dm200.name",
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
				"line": 390,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm300",
				"name": "actors.mobs.dm300.name",
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
				"line": 405,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "necroSkeleton",
				"name": "actors.mobs.necromancer$necroskeleton.name",
				"hp": "20",
				"accuracy": "12",
				"evasion": "9",
				"damage_min": "2",
				"damage_max": "10",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "0",
				"max_level": "-5",
				"image": "assets/skeleton.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 420,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ghost",
				"name": "actors.mobs.npcs.ghost.name",
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
				"line": 439,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "wandmaker",
				"name": "actors.mobs.npcs.wandmaker.name",
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
				"line": 454,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "shopkeeper",
				"name": "actors.mobs.npcs.shopkeeper.name",
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
				"line": 469,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "impShopkeeper",
				"name": "actors.mobs.npcs.impshopkeeper.name",
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
				"line": 488,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "blacksmith",
				"name": "actors.mobs.npcs.blacksmith.name",
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
				"line": 503,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "imp",
				"name": "actors.mobs.npcs.imp.name",
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
				"line": 518,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ghoul",
				"name": "actors.mobs.ghoul.name",
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
				"line": 533,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "elemental",
				"name": "actors.mobs.elemental$fireelemental.name",
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
				"line": 548,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "newbornElemental",
				"name": "actors.mobs.elemental$newbornfireelemental.name",
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
				"line": 563,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "warlock",
				"name": "actors.mobs.warlock.name",
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
				"line": 578,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "monk",
				"name": "actors.mobs.monk.name",
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
				"line": 593,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "golem",
				"name": "actors.mobs.golem.name",
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
				"line": 608,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "succubus",
				"name": "actors.mobs.succubus.name",
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
				"line": 623,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "eye",
				"name": "actors.mobs.eye.name",
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
				"line": 638,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "scorpio",
				"name": "actors.mobs.scorpio.name",
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
				"line": 653,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "king",
				"name": "actors.mobs.dwarfking.name",
				"hp": "300",
				"accuracy": "26",
				"evasion": "22",
				"damage_min": "15",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "10",
				"experience": "40",
				"max_level": "-2",
				"image": "assets/king.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 668,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "yog",
				"name": "actors.mobs.yogdzewa.name",
				"hp": "400",
				"accuracy": "1000000",
				"evasion": "12",
				"damage_min": "15",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "50",
				"max_level": "-2",
				"image": "assets/yog.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 686,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "yogFist",
				"name": "actors.mobs.yogfist$rottingfist.name",
				"hp": "60",
				"accuracy": "20",
				"evasion": "10",
				"damage_min": "6",
				"damage_max": "12",
				"armor_min": "0",
				"armor_max": "5",
				"experience": "25",
				"max_level": "-2",
				"image": "assets/yog_fists.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 707,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "larva",
				"name": "actors.mobs.yogdzewa$larva.name",
				"hp": "20",
				"accuracy": "30",
				"evasion": "12",
				"damage_min": "15",
				"damage_max": "25",
				"armor_min": "0",
				"armor_max": "4",
				"experience": "5",
				"max_level": "-2",
				"image": "assets/larva.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 727,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "demonSpawner",
				"name": "actors.mobs.demonspawner.name",
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
				"line": 742,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ripperDemon",
				"name": "actors.mobs.ripperdemon.name",
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
				"line": 757,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "albino",
				"name": "actors.mobs.albino.name",
				"hp": "12",
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
				"line": 772,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "causticSlime",
				"name": "actors.mobs.causticslime.name",
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
				"line": 789,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "bandit",
				"name": "actors.mobs.bandit.name",
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
				"line": 804,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "spectralNecromancer",
				"name": "actors.mobs.spectralnecromancer.name",
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
				"line": 819,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "armoredBrute",
				"name": "actors.mobs.armoredbrute.name",
				"hp": "40",
				"accuracy": "20",
				"evasion": "15",
				"damage_min": "5",
				"damage_max": "25",
				"armor_min": "4",
				"armor_max": "12",
				"experience": "8",
				"max_level": "16",
				"image": "assets/brute.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 834,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dm201",
				"name": "actors.mobs.dm201.name",
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
				"line": 851,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "senior",
				"name": "actors.mobs.senior.name",
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
				"line": 866,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "acidic",
				"name": "actors.mobs.acidic.name",
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
				"line": 881,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "mimic",
				"name": "actors.mobs.mimic.name",
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
				"line": 896,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "crystalMimic",
				"name": "items.heap.crystal_chest",
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
				"line": 911,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "piranha",
				"name": "actors.mobs.piranha.name",
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
				"line": 926,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "bee",
				"name": "actors.mobs.bee.name",
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
				"line": 941,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "statue",
				"name": "actors.mobs.statue.name",
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
				"line": 956,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "armoredStatue",
				"name": "actors.mobs.armoredstatue.name",
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
				"line": 971,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "pylon",
				"name": "actors.mobs.pylon.name",
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
				"line": 986,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "sentry",
				"name": "levels.rooms.special.sentryroom$sentry.name",
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
				"line": 1001,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "rotHeart",
				"name": "actors.mobs.rotheart.name",
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
				"line": 1016,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "rotLasher",
				"name": "actors.mobs.rotlasher.name",
				"hp": "80",
				"accuracy": "25",
				"evasion": "0",
				"damage_min": "10",
				"damage_max": "20",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "1",
				"max_level": "29",
				"image": "assets/rot_lasher.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 1031,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "ratKing",
				"name": "actors.mobs.npcs.ratking.name",
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
				"line": 1048,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "wraith",
				"name": "actors.mobs.wraith.name",
				"hp": "1",
				"accuracy": "10",
				"evasion": "50",
				"damage_min": "1",
				"damage_max": "2",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "-2",
				"image": "assets/wraith.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 1063,
				"column": 5
			},
			"gettext": []
		},
		{
			"tag": "monster",
			"attributes": {
				"id": "dustWraith",
				"name": "actors.mobs.wraith.name",
				"hp": "1",
				"accuracy": "10",
				"evasion": "50",
				"damage_min": "1",
				"damage_max": "2",
				"armor_min": "0",
				"armor_max": "0",
				"experience": "0",
				"max_level": "-2",
				"image": "assets/wraith.png"
			},
			"children": [],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\monsters.mwl",
				"line": 1083,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\progression-rules.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\progression-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
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
								"line": 22,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "monsterStatusImmunities",
						"columns": "monster:string|subtype:string|immunities:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"monster": "dm100",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 47,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm200",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 48,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm201",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 49,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "dm300",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 50,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "golem",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 51,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "skeleton",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 52,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "necroSkeleton",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 53,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "statue",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 54,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "armoredStatue",
								"subtype": "",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 55,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "pylon",
								"subtype": "",
								"immunities": "bleeding,poison,terror,amok,charm,paralysis"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 56,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "demonSpawner",
								"subtype": "",
								"immunities": "terror,amok,charm,paralysis"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 57,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "rotHeart",
								"subtype": "",
								"immunities": "terror,amok,charm,paralysis"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 58,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yog",
								"subtype": "",
								"immunities": "terror,amok,charm,paralysis"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 59,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "ninjaLog",
								"subtype": "",
								"immunities": "terror,amok,charm,bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 65,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "goo",
								"subtype": "",
								"immunities": "ooze"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 66,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "acidic",
								"subtype": "",
								"immunities": "ooze"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 67,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "causticSlime",
								"subtype": "",
								"immunities": "ooze"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 68,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yogFist",
								"subtype": "rotting",
								"immunities": "ooze"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 69,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yogFist",
								"subtype": "burning",
								"immunities": "burning"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 70,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "yogFist",
								"subtype": "rusted",
								"immunities": "bleeding,poison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 71,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "succubus",
								"subtype": "",
								"immunities": "charm"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 72,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "tengu",
								"subtype": "",
								"immunities": "roots,terror"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 73,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"monster": "piranha",
								"subtype": "",
								"immunities": "burning"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
								"line": 74,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
						"line": 42,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\resistance-rules.mwl",
				"line": 3,
				"column": 5
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
						"hunger": "1"
					},
					"children": [],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringAccuracy",
						"name": "items.rings.ringofaccuracy.name",
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
								"line": 27,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 19,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringEvasion",
						"name": "items.rings.ringofevasion.name",
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
								"line": 42,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 34,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringMight",
						"name": "items.rings.ringofmight.name",
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
								"line": 57,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 49,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringTenacity",
						"name": "items.rings.ringoftenacity.name",
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
								"line": 72,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 64,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringHaste",
						"name": "items.rings.ringofhaste.name",
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
								"line": 87,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 79,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringEnergy",
						"name": "items.rings.ringofenergy.name",
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
								"line": 102,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 94,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringWealth",
						"name": "items.rings.ringofwealth.name",
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
								"line": 117,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 109,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringArcana",
						"name": "items.rings.ringofarcana.name",
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
								"line": 132,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 124,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringForce",
						"name": "items.rings.ringofforce.name",
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
								"line": 147,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 139,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringSharpshooting",
						"name": "items.rings.ringofsharpshooting.name",
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
								"line": 162,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 154,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringElements",
						"name": "items.rings.ringofelements.name",
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
								"line": 177,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 169,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "item",
					"attributes": {
						"id": "ringFuror",
						"name": "items.rings.ringoffuror.name",
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
								"line": 192,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
						"line": 184,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\rings.mwl",
				"line": 3,
				"column": 5
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
								"line": 13,
								"column": 13
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
								"line": 18,
								"column": 13
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
								"line": 23,
								"column": 13
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
								"line": 28,
								"column": 13
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
								"line": 33,
								"column": 13
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
								"line": 38,
								"column": 13
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
								"line": 43,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 56,
								"column": 13
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
								"line": 66,
								"column": 13
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
								"line": 76,
								"column": 13
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
								"line": 86,
								"column": 13
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
								"line": 96,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 50,
						"column": 9
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
								"line": 113,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 108,
						"column": 9
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
								"line": 125,
								"column": 13
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
								"line": 130,
								"column": 13
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
								"line": 135,
								"column": 13
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
								"line": 140,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 120,
						"column": 9
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
								"line": 152,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 147,
						"column": 9
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
								"line": 165,
								"column": 13
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
								"line": 170,
								"column": 13
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
								"line": 175,
								"column": 13
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
								"line": 180,
								"column": 13
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
								"line": 185,
								"column": 13
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
								"line": 190,
								"column": 13
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
								"line": 195,
								"column": 13
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
								"line": 200,
								"column": 13
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
								"line": 205,
								"column": 13
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
								"line": 210,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
						"line": 159,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\room-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\runestones.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\runestones.mwl",
				"line": 3,
				"column": 5
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
								"victory": "port.log.bossvictory.sewers"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 12,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "10",
								"kind": "tengu",
								"next": "continue",
								"victory": "port.log.bossvictory.prison"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 19,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "15",
								"kind": "dm300",
								"next": "continue",
								"victory": "port.log.bossvictory.caves"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 26,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "20",
								"kind": "king",
								"next": "continue",
								"victory": "port.log.bossvictory.city"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 33,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"depth": "25",
								"kind": "yog",
								"next": "continue",
								"victory": "port.log.bossvictory.halls"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 40,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 7,
						"column": 9
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
								"line": 54,
								"column": 13
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
								"line": 61,
								"column": 13
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
								"line": 68,
								"column": 13
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
								"line": 75,
								"column": 13
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
								"line": 82,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 49,
						"column": 9
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
								"line": 97,
								"column": 13
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
								"line": 103,
								"column": 13
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
								"line": 109,
								"column": 13
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
								"line": 115,
								"column": 13
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
								"line": 121,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 91,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "questDefinitions",
						"columns": "id:string|conditionSwitch:string|description:string|quest:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "quest-sadGhost",
								"quest": "sadGhost",
								"conditionSwitch": "ghostTargetSlain",
								"description": "port.journal.quest.sadghost.objective"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 134,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "quest-wandmaker",
								"quest": "wandmaker",
								"conditionSwitch": "wandQuestDone",
								"description": "port.journal.quest.wandmaker.objective"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 141,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "quest-blacksmith",
								"quest": "blacksmith",
								"conditionSwitch": "blacksmithDone",
								"description": "port.journal.quest.blacksmith.objective"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 148,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "quest-imp",
								"quest": "imp",
								"conditionSwitch": "impDone",
								"description": "port.journal.quest.imp.objective"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
								"line": 155,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
						"line": 129,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\scenario-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\seeds.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\seeds.mwl",
				"line": 3,
				"column": 5
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
						"id": "equipmentValueRules",
						"columns": "kind:string|basePerTier:number|positiveAffixMultiplier:number|knownCurseMultiplier:number|identifiedLevelBase:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"kind": "generatedGear",
								"basePerTier": "20",
								"positiveAffixMultiplier": "1.5",
								"knownCurseMultiplier": "0.5",
								"identifiedLevelBase": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 11,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "itemUnitValues",
						"columns": "item:string|value:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"item": "potion",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 19,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionHealing",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 20,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionStrength",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 21,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionFlame",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 22,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionMindVision",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 23,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionInvis",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 24,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionShrouding",
								"value": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 26,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionPurity",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 27,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionLevitation",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 28,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionExperience",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 29,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionToxicGas",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 30,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionParalyticGas",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 31,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionHaste",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 32,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionFrost",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 33,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "infernalBrew",
								"value": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 35,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "blizzardBrew",
								"value": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 36,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "shockingBrew",
								"value": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 37,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "causticBrew",
								"value": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 38,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scroll",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 39,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollIdentify",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 40,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollRage",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 41,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollLullaby",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 42,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollMapping",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 43,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollMirror",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 44,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollPrismatic",
								"value": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 46,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollCleanse",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 47,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollRecharging",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 48,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollTeleportation",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 49,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollTerror",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 50,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollRetribution",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 51,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollUpgrade",
								"value": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 52,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollTransmutation",
								"value": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 53,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "food",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 54,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "meat",
								"value": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 55,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "bomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 56,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "doubleBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 57,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "frostBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 58,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "woollyBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 59,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "fireBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 60,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "noisemaker",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 61,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "flashbang",
								"value": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 62,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "smokeBomb",
								"value": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 63,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "regrowthBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 64,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "holyBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 65,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "arcaneBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 66,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "shrapnelBomb",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 67,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "gooBlob",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 68,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "metalShard",
								"value": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 69,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stone",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 70,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfAugmentation",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 71,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfFear",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 72,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfDeepSleep",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 73,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfShock",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 74,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfBlast",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 75,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfBlink",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 76,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stoneOfClairvoyance",
								"value": "15"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 77,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "seed",
								"value": "10"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 78,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "sandBag",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 79,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "ankh",
								"value": "50"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 80,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "stylus",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 81,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "honeypot",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 82,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "alchemize",
								"value": "2.5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 83,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "bag",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 84,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "velvetPouch",
								"value": "30"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 85,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "scrollHolder",
								"value": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 86,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "potionBandolier",
								"value": "40"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 87,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "magicalHolster",
								"value": "60"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 88,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "torch",
								"value": "8"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 89,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "ring",
								"value": "75"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 90,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"item": "wand",
								"value": "75"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
								"line": 91,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
						"line": 15,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\shop-rules.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
						"line": 7,
						"column": 9
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
								"talents": "hold_fast,strongman,endless_rage,deathless_fury,enraged_catalyst"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 25,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "gladiator",
								"talents": "hold_fast,strongman,cleave,lethal_defense,enhanced_combo"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 30,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "battlemage",
								"talents": "empowering_scrolls,ally_warp,empowered_strike,mystical_charge,excess_charge"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 35,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "warlock",
								"talents": "empowering_scrolls,ally_warp,soul_eater,soul_siphon,necromancers_minions"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 40,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "assassin",
								"talents": "enhanced_rings,light_cloak,enhanced_lethality,assassins_reach,bounty_hunter"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 45,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "freerunner",
								"talents": "enhanced_rings,light_cloak,evasive_armor,projectile_momentum,speedy_stealth"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 50,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "sniper",
								"talents": "point_blank,seer_shot,farsight,shared_enchantment,shared_upgrades"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 55,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "warden",
								"talents": "point_blank,seer_shot,durable_tips,barkskin,shielding_dew"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 60,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "champion",
								"talents": "precise_assault,deadly_followup,secondary_charge,twin_upgrades,combined_lethality"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 65,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"subclass": "monk_sub",
								"talents": "precise_assault,deadly_followup,unencumbered_spirit,monastic_vigor,combined_energy"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 70,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
						"line": 19,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "armorAbilities",
						"columns": "id:string|class:string|charge:number|targeting:string|talents:list",
						"list_delimiter": ","
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "heroicleap",
								"class": "warrior",
								"charge": "35",
								"targeting": "cell",
								"talents": "body_slam,impact_wave,double_jump"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 83,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "shockwave",
								"class": "warrior",
								"charge": "35",
								"targeting": "cell",
								"talents": "expanding_wave,striking_wave,shock_force"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 91,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "endure",
								"class": "warrior",
								"charge": "50",
								"targeting": "none",
								"talents": "sustained_retribution,shrug_it_off,even_the_odds"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 99,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elementalblast",
								"class": "mage",
								"charge": "35",
								"targeting": "none",
								"talents": "blast_radius,elemental_power,reactive_barrier"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 107,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "warpbeacon",
								"class": "mage",
								"charge": "35",
								"targeting": "beacon",
								"talents": "telefrag,remote_beacon,longrange_warp"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 115,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wildmagic",
								"class": "mage",
								"charge": "25",
								"targeting": "cell",
								"talents": "wild_power,fire_everything,conserved_magic"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 123,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "smokebomb",
								"class": "rogue",
								"charge": "50",
								"targeting": "cell",
								"talents": "hasty_retreat,body_replacement,shadow_step"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 131,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "deathmark",
								"class": "rogue",
								"charge": "25",
								"targeting": "cell",
								"talents": "fear_the_reaper,deathly_durability,double_mark"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 139,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "shadowclone",
								"class": "rogue",
								"charge": "35",
								"targeting": "clone",
								"talents": "shadow_blade,cloned_armor,perfect_copy"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 147,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "spectralblades",
								"class": "huntress",
								"charge": "25",
								"targeting": "cell",
								"talents": "fan_of_blades,projecting_blades,spirit_blades"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 155,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "naturespower",
								"class": "huntress",
								"charge": "35",
								"targeting": "none",
								"talents": "growing_power,natures_wrath,wild_momentum"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 163,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "spirithawk",
								"class": "huntress",
								"charge": "35",
								"targeting": "hawk",
								"talents": "eagle_eye,go_for_the_eyes,swift_spirit"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 171,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "challenge",
								"class": "duelist",
								"charge": "35",
								"targeting": "cell",
								"talents": "close_the_gap,invigorating_victory,elimination_match"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 179,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "elementalstrike",
								"class": "duelist",
								"charge": "25",
								"targeting": "cell",
								"talents": "elemental_reach,striking_force,directed_power"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 187,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "feint",
								"class": "duelist",
								"charge": "50",
								"targeting": "cell",
								"talents": "feigned_retreat,expose_weakness,counter_ability"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 195,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "ratmogrify",
								"class": "any",
								"charge": "50",
								"targeting": "cell",
								"talents": "ratsistance,ratlomacy,ratforcements"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
								"line": 203,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
						"line": 77,
						"column": 9
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
								"line": 219,
								"column": 13
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
								"line": 225,
								"column": 13
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
								"line": 231,
								"column": 13
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
								"line": 237,
								"column": 13
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
								"line": 243,
								"column": 13
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
								"line": 249,
								"column": 13
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
								"line": 255,
								"column": 13
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
								"line": 261,
								"column": 13
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
								"line": 267,
								"column": 13
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
								"line": 273,
								"column": 13
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
								"line": 279,
								"column": 13
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
								"line": 285,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
						"line": 213,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\talent-rules.mwl",
				"line": 3,
				"column": 5
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
						"id": "wandDefinitions",
						"columns": "id:string|sourceClass:string|type:string|name:string"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"id": "wand-magic-missile",
								"sourceClass": "WandOfMagicMissile",
								"type": "magicMissile",
								"name": "items.wands.wandofmagicmissile.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 12,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-frost",
								"sourceClass": "WandOfFrost",
								"type": "frost",
								"name": "items.wands.wandoffrost.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 19,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-fireblast",
								"sourceClass": "WandOfFireblast",
								"type": "fireblast",
								"name": "items.wands.wandoffireblast.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 26,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-lightning",
								"sourceClass": "WandOfLightning",
								"type": "lightning",
								"name": "items.wands.wandoflightning.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 33,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-corrosion",
								"sourceClass": "WandOfCorrosion",
								"type": "corrosion",
								"name": "items.wands.wandofcorrosion.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 40,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-corruption",
								"sourceClass": "WandOfCorruption",
								"type": "corruption",
								"name": "items.wands.wandofcorruption.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 47,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-disintegration",
								"sourceClass": "WandOfDisintegration",
								"type": "disintegration",
								"name": "items.wands.wandofdisintegration.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 54,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-blast-wave",
								"sourceClass": "WandOfBlastWave",
								"type": "blastWave",
								"name": "items.wands.wandofblastwave.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 61,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-living-earth",
								"sourceClass": "WandOfLivingEarth",
								"type": "livingEarth",
								"name": "items.wands.wandoflivingearth.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 68,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-prismatic-light",
								"sourceClass": "WandOfPrismaticLight",
								"type": "prismaticLight",
								"name": "items.wands.wandofprismaticlight.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 75,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-regrowth",
								"sourceClass": "WandOfRegrowth",
								"type": "regrowth",
								"name": "items.wands.wandofregrowth.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 82,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-transfusion",
								"sourceClass": "WandOfTransfusion",
								"type": "transfusion",
								"name": "items.wands.wandoftransfusion.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 89,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"id": "wand-warding",
								"sourceClass": "WandOfWarding",
								"type": "warding",
								"name": "items.wands.wandofwarding.name"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 96,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
						"line": 7,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "wandRangeRules",
						"columns": "type:string|base:number|perLevel:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"type": "default",
								"base": "6",
								"perLevel": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 109,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "disintegration",
								"base": "6",
								"perLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 110,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
						"line": 105,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "wandChargeRules",
						"columns": "type:string|ratio:number|min:number|max:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"type": "default",
								"ratio": "0",
								"min": "1",
								"max": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 118,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "fireblast",
								"ratio": "0.3",
								"min": "1",
								"max": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 119,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "regrowth",
								"ratio": "0.3",
								"min": "1",
								"max": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 120,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
						"line": 114,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "wandDamageRules",
						"columns": "type:string|minBase:number|minPerLevel:number|maxBase:number|maxPerLevel:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"type": "magicMissile",
								"minBase": "2",
								"minPerLevel": "1",
								"maxBase": "8",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 130,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "frost",
								"minBase": "2",
								"minPerLevel": "1",
								"maxBase": "8",
								"maxPerLevel": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 131,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "lightning",
								"minBase": "5",
								"minPerLevel": "1",
								"maxBase": "10",
								"maxPerLevel": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 132,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "blastWave",
								"minBase": "1",
								"minPerLevel": "1",
								"maxBase": "3",
								"maxPerLevel": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 133,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "prismaticLight",
								"minBase": "1",
								"minPerLevel": "1",
								"maxBase": "5",
								"maxPerLevel": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 134,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "disintegration",
								"minBase": "2",
								"minPerLevel": "1",
								"maxBase": "8",
								"maxPerLevel": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 135,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"type": "transfusion",
								"minBase": "3",
								"minPerLevel": "1",
								"maxBase": "6",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 136,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
						"line": 126,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "wandWardRules",
						"columns": "tier:number|maxHp:number|heal:number|selfDamage:number|zapLimit:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"tier": "1",
								"maxHp": "0",
								"heal": "0",
								"selfDamage": "0",
								"zapLimit": "1"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 144,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"tier": "2",
								"maxHp": "0",
								"heal": "0",
								"selfDamage": "0",
								"zapLimit": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 145,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"tier": "3",
								"maxHp": "0",
								"heal": "0",
								"selfDamage": "0",
								"zapLimit": "5"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 146,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"tier": "4",
								"maxHp": "35",
								"heal": "9",
								"selfDamage": "5",
								"zapLimit": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 147,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"tier": "5",
								"maxHp": "54",
								"heal": "12",
								"selfDamage": "6",
								"zapLimit": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 148,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"tier": "6",
								"maxHp": "84",
								"heal": "16",
								"selfDamage": "7",
								"zapLimit": "0"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 149,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
						"line": 140,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "wandFireblastRules",
						"columns": "charges:number|degrees:number|distance:number|fireVolume:number|minLevelFactor:number|maxBase:number|maxPerLevel:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"charges": "1",
								"degrees": "50",
								"distance": "5",
								"fireVolume": "2",
								"minLevelFactor": "1",
								"maxBase": "2",
								"maxPerLevel": "2"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 157,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"charges": "2",
								"degrees": "70",
								"distance": "7",
								"fireVolume": "3",
								"minLevelFactor": "2",
								"maxBase": "8",
								"maxPerLevel": "4"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 158,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"charges": "3",
								"degrees": "90",
								"distance": "9",
								"fireVolume": "4",
								"minLevelFactor": "3",
								"maxBase": "18",
								"maxPerLevel": "6"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 159,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
						"line": 153,
						"column": 9
					},
					"gettext": []
				},
				{
					"tag": "table",
					"attributes": {
						"id": "wandRegrowthRules",
						"columns": "charges:number|degrees:number|distance:number|rootsPerCharge:number|grassBase:number|grassPerLevel:number|lotusMinCharges:number"
					},
					"children": [
						{
							"tag": "row",
							"attributes": {
								"charges": "1",
								"degrees": "30",
								"distance": "4",
								"rootsPerCharge": "4",
								"grassBase": "3.67",
								"grassPerLevel": "0.3333333333",
								"lotusMinCharges": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 167,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"charges": "2",
								"degrees": "40",
								"distance": "6",
								"rootsPerCharge": "4",
								"grassBase": "3.67",
								"grassPerLevel": "0.3333333333",
								"lotusMinCharges": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 168,
								"column": 13
							},
							"gettext": []
						},
						{
							"tag": "row",
							"attributes": {
								"charges": "3",
								"degrees": "50",
								"distance": "8",
								"rootsPerCharge": "4",
								"grassBase": "3.67",
								"grassPerLevel": "0.3333333333",
								"lotusMinCharges": "3"
							},
							"children": [],
							"location": {
								"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
								"line": 169,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
						"line": 163,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\wands.mwl",
				"line": 3,
				"column": 5
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
								"line": 12,
								"column": 13
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
								"line": 17,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 7,
						"column": 9
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
								"line": 29,
								"column": 13
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
								"line": 34,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 24,
						"column": 9
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
								"line": 46,
								"column": 13
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
								"line": 51,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 41,
						"column": 9
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
								"line": 63,
								"column": 13
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
								"line": 68,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 58,
						"column": 9
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
								"line": 80,
								"column": 13
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
								"line": 85,
								"column": 13
							},
							"gettext": []
						}
					],
					"location": {
						"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
						"line": 75,
						"column": 9
					},
					"gettext": []
				}
			],
			"location": {
				"file": "C:\\Users\\miche\\dev\\mwg-pixel-dungeon\\src\\content\\weapon-decks.mwl",
				"line": 3,
				"column": 5
			},
			"gettext": []
		}
	],
	"assets": [
		"assets/banner_boss_slain.png",
		"assets/banner_game_over.png",
		"assets/banners.png",
		"assets/bat.png",
		"assets/bee.png",
		"assets/blacksmith.png",
		"assets/brute.png",
		"assets/caves_boss.png",
		"assets/caves_quest.png",
		"assets/city_boss.png",
		"assets/cleric.png",
		"assets/crab.png",
		"assets/demon.png",
		"assets/dm100.png",
		"assets/dm200.png",
		"assets/dm300.png",
		"assets/duelist.png",
		"assets/effect_fireball.png",
		"assets/effects.png",
		"assets/elemental.png",
		"assets/eye.png",
		"assets/ghost.png",
		"assets/ghoul.png",
		"assets/gnoll.png",
		"assets/golem.png",
		"assets/goo.png",
		"assets/guard.png",
		"assets/guardian.png",
		"assets/halls_special.png",
		"assets/huntress.png",
		"assets/items.png",
		"assets/king.png",
		"assets/larva.png",
		"assets/loading_caves.png",
		"assets/loading_city.png",
		"assets/loading_halls.png",
		"assets/loading_prison.png",
		"assets/loading_sewers.png",
		"assets/mage.png",
		"assets/mimic.png",
		"assets/monk.png",
		"assets/necromancer.png",
		"assets/ninja_log.png",
		"assets/piranha.png",
		"assets/prison_quest.png",
		"assets/pylon.png",
		"assets/rat.png",
		"assets/ratking.png",
		"assets/red_sentry.png",
		"assets/ripper.png",
		"assets/rogue.png",
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
		"assets/spirit_hawk.png",
		"assets/splash_cleric.jpg",
		"assets/splash_duelist.jpg",
		"assets/splash_huntress.jpg",
		"assets/splash_mage.jpg",
		"assets/splash_rogue.jpg",
		"assets/splash_warrior.jpg",
		"assets/statue.png",
		"assets/succubus.png",
		"assets/swarm.png",
		"assets/tengu.png",
		"assets/terrain_features.png",
		"assets/thief.png",
		"assets/tiles_caves.png",
		"assets/tiles_city.png",
		"assets/tiles_halls.png",
		"assets/tiles_prison.png",
		"assets/tiles_sewers.png",
		"assets/ui_arcs_bg.png",
		"assets/ui_arcs_fg.png",
		"assets/ui_badges.png",
		"assets/ui_boss_hp.png",
		"assets/ui_buffs.png",
		"assets/ui_chrome.png",
		"assets/ui_icons.png",
		"assets/ui_status_pane.png",
		"assets/ui_toolbar.png",
		"assets/wall_blocking.png",
		"assets/wandmaker.png",
		"assets/wards.png",
		"assets/warlock.png",
		"assets/warrior.png",
		"assets/water0.png",
		"assets/water1.png",
		"assets/water2.png",
		"assets/water3.png",
		"assets/water4.png",
		"assets/wraith.png",
		"assets/yog.png",
		"assets/yog_fists.png"
	],
	"messages": []
} as const;
