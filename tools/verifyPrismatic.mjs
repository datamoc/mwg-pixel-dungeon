import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
		const source = readFileSync(new URL('../src/scenes/dungeonScene.ts', import.meta.url), 'utf8');
		for (const site of [
			'spawnPrismaticImage(at, Math.floor(pool))',
			'this.tickPrismaticGuard(turnCost)',
			'this.enterPrismaticFade(victim, dealt)',
			'this.enterPrismaticFade(defender, damage)',
			'prismaticFade: creature.prismaticFade',
			'prismaticFade: saved.prismaticFade',
			'prismaticGuardHp: this.hero.prismaticGuardHp ?? null',
			'grantPrismaticGuard: (hp)',
			'scrollExoticResult(item.id) !== undefined',
			'craftScrollToExotic(this.bag)',
		]) assert.ok(source.includes(site), `the scene must still contain: ${site}`);
		const statusPane = readFileSync(new URL('../src/ui/statusPane.ts', import.meta.url), 'utf8');
		assert.match(statusPane, /prismaticGuard: 20/, 'the guard icon is BuffIndicator.ARMOR');
		const scrollFx = readFileSync(new URL('../src/items/scrollEffects.ts', import.meta.url), 'utf8');
		assert.ok(scrollFx.includes("if (id === 'scrollPrismatic')"), 'the exotic read effect exists');
		const buffInfo = readFileSync(new URL('../src/ui/buffInfo.ts', import.meta.url), 'utf8');
		assert.ok(buffInfo.includes("prismaticGuard: 'actors.buffs.prismaticguard'"), 'the guard info maps to its catalogue key');
		const alchemy = readFileSync(new URL('../src/items/alchemy.ts', import.meta.url), 'utf8');
		assert.ok(alchemy.includes("scrollMirror: 'scrollPrismatic'"), 'the MirrorImage -> PrismaticImage brew pair exists');
		const transmute = readFileSync(new URL('../src/items/transmutation.ts', import.meta.url), 'utf8');
		assert.ok(transmute.includes("if (target.id === 'scrollPrismatic')"), 'the exotic transmutes to its regular counterpart');
	});
}
