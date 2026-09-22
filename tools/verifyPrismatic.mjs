import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

// Called by verifySimulation.mjs after compiling actual production modules into its temp tree.
export function verifyPrismatic(require, check) {
	check('PrismaticGuard.maxHP is Java\'s 10 + floor(lvl * 2.5)', () => {
		// `PrismaticGuard.maxHP(hero)` (tag `v3.3.8`): "half of hero's HP".
		const { prismaticGuardMaxHp } = require('./simulation/prismatic');
		assert.equal(prismaticGuardMaxHp(1), 12);
		assert.equal(prismaticGuardMaxHp(2), 15);
		assert.equal(prismaticGuardMaxHp(10), 35);
		assert.equal(prismaticGuardMaxHp(30), 85);
	});
	check('the image reads Java\'s hero-derived combat stats', () => {
		// `PrismaticImage.duplicate()` binds the hero; `damageRoll()` is
		// `NormalIntRange(2 + lvl/4, 4 + lvl/2)` (int division), `attackSkill()` is
		// `(9 + lvl) * accuracyMultiplier`, `defenseSkill()` is
		// `1 * (baseEvasion + heroEvasion) / 2` with `baseEvasion = 4 + lvl`, and
		// `HT = maxHP(hero)`. The `(int)` casts truncate.
		const { prismaticImageStats } = require('./simulation/prismatic');
		assert.deepEqual(prismaticImageStats(1, 1, 1),
			{ accuracy: 10, evasion: 5, damageMin: 2, damageMax: 4, maxHp: 12 });
		assert.deepEqual(prismaticImageStats(10, 1, 1),
			{ accuracy: 19, evasion: 14, damageMin: 4, damageMax: 9, maxHp: 35 });
		// Ring of Accuracy `1.3^1`, Ring of Evasion `1.125^1` at hero level 10.
		assert.deepEqual(prismaticImageStats(10, 1.3, 1.125),
			{ accuracy: 24, evasion: 14, damageMin: 4, damageMax: 9, maxHp: 35 });
	});
	check('both images zero their evasion under Mob\'s super-defense conditions', () => {
		// `MirrorImage.defenseSkill()` / `PrismaticImage.defenseSkill()` (tag
		// `v3.3.8`) multiply the blended evasion by `super.defenseSkill(enemy)`,
		// which is 0 - not the 1 field - when the image is surprised,
		// paralysed, illuminated under a Cleric hero, or facing the hero
		// itself (`Mob.java` 684-705). The `superDefense` tail carries it;
		// only evasion moves, every other stat is untouched.
		const { prismaticImageStats } = require('./simulation/prismatic');
		const { mirrorImageStats, imageSuperDefenseSkill } = require('./simulation/mirrorImage');
		assert.deepEqual(prismaticImageStats(10, 1, 1, 0),
			{ accuracy: 19, evasion: 0, damageMin: 4, damageMax: 9, maxHp: 35 });
		assert.deepEqual(mirrorImageStats(10, 1, 1, 4, 7, 0),
			{ accuracy: 19, evasion: 0, damageMin: 2, damageMax: 4 });
		assert.equal(prismaticImageStats(10, 1, 1).evasion, 14, 'default super stays 1');
		assert.equal(mirrorImageStats(10, 1, 1, 4, 7).evasion, 14, 'default super stays 1');
		const clear = { surprised: false, paralysed: false, illuminated: false, heroIsCleric: false, attackerIsHero: false, attackerWeaponStrOk: false };
		assert.equal(imageSuperDefenseSkill(clear), 1);
		assert.equal(imageSuperDefenseSkill({ ...clear, surprised: true }), 0);
		assert.equal(imageSuperDefenseSkill({ ...clear, paralysed: true }), 0);
		assert.equal(imageSuperDefenseSkill({ ...clear, attackerIsHero: true }), 0, 'an amok hero faces evasion 0 from its own image');
		assert.equal(imageSuperDefenseSkill({ ...clear, illuminated: true, heroIsCleric: true }), 0, 'non-hero attacker under Cleric illumination');
		assert.equal(imageSuperDefenseSkill({ ...clear, illuminated: true, heroIsCleric: true, attackerIsHero: true, attackerWeaponStrOk: false }), 0,
			'even the too-heavy-weapon fall-through zeroes for images via the hero-facing clause');
		assert.equal(imageSuperDefenseSkill({ ...clear, illuminated: true, heroIsCleric: true, attackerIsHero: true, attackerWeaponStrOk: true }), 0,
			'a STR-sufficient hero weapon zeroes outright (the Cleric auto-hit)');
		assert.equal(imageSuperDefenseSkill({ ...clear, illuminated: true, heroIsCleric: false }), 1, 'illumination alone zeroes nothing without a Cleric hero');
	});
	check('the guard hatch picks the closest free neighbour, ties to the first', () => {
		// `PrismaticGuard.act()`: the free passable neighbour minimizing
		// `trueDistance` to the enemy, strict `<` keeping the earliest.
		const { prismaticSpawnCell, PRISMATIC_FADE_TURNS, PRISMATIC_HATCH_RANGE } = require('./simulation/prismatic');
		assert.equal(PRISMATIC_FADE_TURNS, 5, 'non-chasm death starts a 5-turn fade');
		assert.equal(PRISMATIC_HATCH_RANGE, 5, 'hatch inside Chebyshev distance 5');
		assert.deepEqual(prismaticSpawnCell([]), undefined, 'no free neighbour keeps the guard');
		assert.deepEqual(
			prismaticSpawnCell([
				{ x: 0, y: 0, distance: 3 },
				{ x: 1, y: 0, distance: 1.5 },
				{ x: 2, y: 0, distance: 2 },
			]),
			{ x: 1, y: 0 });
		assert.deepEqual(
			prismaticSpawnCell([
				{ x: 0, y: 0, distance: 2 },
				{ x: 1, y: 0, distance: 2 },
			]),
			{ x: 0, y: 0 }, 'ties keep the earliest (NEIGHBOURS8 order)');
	});
	check('the guard buff duration is the indefinite stand-in', () => {
		// The guard never expires on its own clock (it detaches on hatch); 9999 is
		// the catalogue's effectively-permanent stand-in, the cloak/focus precedent.
		const { BUFF_DURATION } = require('./simulation/buffs');
		assert.equal(BUFF_DURATION.prismaticGuard, 9999);
	});
	check('the guard icon overlays the pool HP like Java\'s iconTextDisplay', () => {
		// `PrismaticGuard.iconTextDisplay()` is `(int)HP` with no +1 - the 'left'
		// shape, fed the pool (not a duration) by the scene's status mapping.
		const { buffIconText } = require('./ui/buffOverlays');
		assert.equal(buffIconText('prismaticGuard', 17), '17');
		assert.equal(buffIconText('prismaticGuard', 17.9), '17');
	});
	check('the scene wires every half of the guard/image chain', () => {
		// dungeonScene.ts cannot load in this harness (Pixi), so this pins the
		// call sites at source level, the way verifyCombat's champion-eligible
		// spawn check and verifyRings' multiplier checks do.
		const source = readSceneSource();
		for (const site of [
			"imageSuperDefenseSkill({",
			"const sheep = this.spawnSheep({ x: cx, y: cy }, 6)",
			"this.triggerMobTrapAt(sheep)",
			'spawnPrismaticImage(at, Math.floor(pool))',
			'this.tickPrismaticGuard(turnCost)',
			'this.enterPrismaticFade(victim, dealt)',
			'this.enterPrismaticFade(defender, damage)',
			'prismaticFade: creature.prismaticFade',
			'prismaticFade: saved.prismaticFade',
			'prismaticGuardHp: this.hero.prismaticGuardHp ?? null',
			'grantPrismaticGuard: (hp)',
			'openAlchemyRecipes(this.alchemyFlowContext())',
		]) assert.ok(source.includes(site), `the scene must still contain: ${site}`);
		const statusPane = readFileSync(new URL('../src/ui/statusPane.ts', import.meta.url), 'utf8');
		assert.match(statusPane, /prismaticGuard: 20/, 'the guard icon is BuffIndicator.ARMOR');
		const scrollFx = readFileSync(new URL('../src/items/scrollEffects.ts', import.meta.url), 'utf8');
		assert.ok(scrollFx.includes("if (id === 'scrollPrismatic')"), 'the exotic read effect exists');
		const buffInfo = readFileSync(new URL('../src/ui/buffInfo.ts', import.meta.url), 'utf8');
		assert.ok(buffInfo.includes("prismaticGuard: 'actors.buffs.prismaticguard'"), 'the guard info maps to its catalogue key');
		const alchemy = readFileSync(new URL('../src/items/alchemy.ts', import.meta.url), 'utf8');
		assert.ok(alchemy.includes("scrollMirror: 'scrollPrismatic'"), 'the MirrorImage -> PrismaticImage brew pair exists');
		// The alchemy-pot window flow moved from the scene to `items/alchemy.ts`
		// (file-size refactor, behavior-identical): its two exotic call sites are
		// pinned here now, against the moved module instead of the scene.
		assert.ok(alchemy.includes('scrollExoticResult(item.id) !== undefined'), 'the exotic picker eligibility moved with the flow');
		assert.ok(alchemy.includes('craftScrollToExotic(scene.bag)'), 'the exotic craft moved with the flow');
		const transmute = readFileSync(new URL('../src/items/transmutation.ts', import.meta.url), 'utf8');
		assert.ok(transmute.includes("if (target.id === 'scrollPrismatic')"), 'the exotic transmutes to its regular counterpart');
	});
	check('the scene wires the mirror/sheep halves of the ally chain', () => {
		//42nd matrix (`MirrorImage.java`/`Sheep.java`, tag `v3.3.8`): the mirror
		//re-syncs its hero-derived stats every turn (no stale spawn copy), the
		//sheep carries its producer's lifespan and infinite evasion, and both
		//refuse what Java refuses (mirror: toxic/corrosive gas; sheep: all buffs
		//plus all blob/bomb/shocker damage).
		const source = readSceneSource();
		for (const site of [
			'this.syncMirrorImage(image)',
			"if (ally.allyKind === 'mirror') this.syncMirrorImage(ally)",
			'spawnSheep(this: DungeonScene, at: Step, lifespan: number)',
			'sheep.evasion = INFINITE_EVASION',
			'spawnSheep: (at) => this.spawnSheep(at, this.depth in BOSSES ? 20 : 200)',
			'spawnSheep: (at) => this.spawnSheep(at, 8)',
			"if (target.allyKind === 'mirror') return;",
			"|| target.allyKind === 'mirror'",
			"if (target.allyKind === 'sheep') return true;",
			"if (target.allyKind === 'sheep') continue;",
		]) assert.ok(source.includes(site), `the scene must still contain: ${site}`);
		const combat = readFileSync(new URL('../src/combat.ts', import.meta.url), 'utf8');
		assert.ok(combat.includes("if (c.allyKind === 'sheep') return true;"), 'sheep refuse every buff at the shared boundary');
		const bombs = readFileSync(new URL('../src/items/bombEffects.ts', import.meta.url), 'utf8');
		assert.ok(bombs.includes("if (target.allyKind === 'sheep') return false;"), 'bomb blasts pass through sheep');
	});
}
