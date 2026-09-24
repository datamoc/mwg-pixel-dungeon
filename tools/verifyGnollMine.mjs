import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

// Called by verifySimulation.mjs. The Blacksmith GNOLL mine roster (`GnollGuard`/`GnollSapper`/
// `GnollGeomancer.java`, tag `v3.3.8`): the renderer-free planner in `simulation/gnollGeomancer.ts`
// is exercised directly; the scene wiring in `scenes/dungeon/monsters/gnollMine.ts` cannot load in
// this harness (Pixi), so its hooks are pinned at source level like the other scene seams.
export function verifyGnollMine(require, check) {
	const {
		geomancerBracket, resolveGeomancerDamage, planGnollRockFall, chooseThrownBoulder, spreadDiamond,
		chooseDashSpawn, gnollAbilityDelay, cellDistance, cellTrueDistance,
	} = require('./simulation/gnollGeomancer');
	/** A scripted `SimulationRandom`: `int(min, max)` pops the next value (clamped into range). */
	const scripted = (ints) => ({
		int: (min, max) => { const v = ints.length ? ints.shift() : min; return Math.min(max - 1, Math.max(min, v)); },
		float: () => 0, normalRange: (min) => min, range: (min) => min, chance: () => false,
	});

	check('geomancer brackets: HT/3 each, full HP folded into the top one', () => {
		assert.equal(geomancerBracket(150, 150), 2);
		assert.equal(geomancerBracket(101, 150), 2);
		assert.equal(geomancerBracket(100, 150), 2);
		assert.equal(geomancerBracket(99, 150), 1);
		assert.equal(geomancerBracket(50, 150), 1);
		assert.equal(geomancerBracket(49, 150), 0);
	});

	check('geomancer damage: one bracket per hit, no death before the last, bleed from the unclamped bracket', () => {
		assert.deepEqual(resolveGeomancerDamage(150, 130, 150), { hp: 130, crossed: false, bleed: false });
		// 120 -> 20 would cross two brackets: clamped to 51, and Java's pre-clamp `newBracket` (0) bleeds.
		assert.deepEqual(resolveGeomancerDamage(120, 20, 150), { hp: 51, crossed: true, bleed: true });
		assert.deepEqual(resolveGeomancerDamage(120, 80, 150), { hp: 80, crossed: true, bleed: false });
		// From the middle bracket a lethal hit leaves it at 1 HP (`isAlive()` with `!inFinalBracket`).
		assert.deepEqual(resolveGeomancerDamage(60, -30, 150), { hp: 1, crossed: true, bleed: true });
		// In the final bracket it dies like anything else.
		assert.equal(resolveGeomancerDamage(40, -5, 150).hp, -5);
		assert.equal(resolveGeomancerDamage(40, -5, 150).crossed, false);
	});

	check('ability delay is gate(TICK, ceil(enemy cooldown), 3*TICK)', () => {
		assert.equal(gnollAbilityDelay(1), 1);
		assert.equal(gnollAbilityDelay(0.5), 1);
		assert.equal(gnollAbilityDelay(2.2), 3);
		assert.equal(gnollAbilityDelay(9), 3);
	});

	check('cell distances are Chebyshev and Euclidean over indices', () => {
		assert.equal(cellDistance(10, 0, 23), 3);
		assert.equal(cellTrueDistance(10, 0, 34), 5);
	});

	check('rock throw picks the boulder nearest the target, first-found winning ties', () => {
		assert.equal(chooseThrownBoulder(10, 55, []), null);
		assert.equal(chooseThrownBoulder(10, 55, [50, 53, 57]), 53);
		assert.equal(chooseThrownBoulder(10, 55, [57, 53]), 57);
	});

	check('rockfall: range square minus the safe cell, the caster, the geomancer and solids; 1/(1+d/2) inclusion', () => {
		const width = 20, length = 400;
		const center = 10 * width + 10;
		const context = {
			width, length,
			insideMap: (cell) => cell % width > 0 && cell % width < width - 1 && cell >= width && cell < length - width,
			solid: (cell) => cell === center + 2,
			trap: () => false,
			barricadeOrEntrance: () => false,
			geomancerAt: (cell) => cell === center - 2,
			sapperAt: (cell) => cell === center + width * 2,
		};
		// Safe cell: first NEIGHBOURS8 draw (index 4 = +1). Every inclusion roll then returns 0.
		const cells = planGnollRockFall(center, center - 1, true, 2, true, context, scripted([4]));
		assert.ok(!cells.includes(center + 1), 'the safe cell is spared');
		assert.ok(!cells.includes(center + 2), 'solid cells are skipped');
		assert.ok(!cells.includes(center - 2), 'the geomancer is never under its own rocks');
		assert.ok(!cells.includes(center + width * 2), 'a geomancer never drops rocks on a sapper');
		assert.ok(cells.includes(center), 'the target cell is in the square');
		assert.equal(cells.length, 25 - 4, 'the rest of the 5x5 square');
		// A sapper casting does hit a sapper's cell.
		assert.ok(planGnollRockFall(center, center - 1, false, 2, true, context, scripted([4])).includes(center + width * 2));
		// avoidBarricades drops everything touching a barricade.
		const barricaded = planGnollRockFall(center, center - 1, false, 1, true, { ...context, barricadeOrEntrance: (cell) => cell === center }, scripted([4]));
		assert.deepEqual(barricaded, []);
	});

	check('spreadDiamond adds each in-map NEIGHBOURS4 cell once', () => {
		const inside = () => true;
		assert.deepEqual(spreadDiamond([55], 10, inside), [45, 54, 56, 65]);
		assert.deepEqual(spreadDiamond([55, 56], 10, inside), [45, 54, 65, 46, 57, 66]);
	});

	check('dash target: nearest unused spawn, a living sapper within 16 preferred', () => {
		const width = 50;
		const pos = 25 * width + 25;
		const near = 25 * width + 28, far = 25 * width + 35;
		assert.equal(chooseDashSpawn(width, pos, [-1, -1, -1], () => true), null);
		assert.deepEqual(chooseDashSpawn(width, pos, [far, near, -1], () => true), { spawn: near, alive: true });
		// The dead near camp loses to a living one within 16.
		assert.deepEqual(chooseDashSpawn(width, pos, [near, far, -1], (s) => s === far), { spawn: far, alive: true });
	});

	check('the scene wires every gnoll hook', () => {
		const source = readSceneSource();
		const pins = [
			["pre-turn prologue", "if (monster.kind && GNOLL_MINE_KINDS.has(monster.kind) && this.gnollMinePreTurn(monster)) return;"],
			['hunting turn', "if (monster.kind && GNOLL_MINE_KINDS.has(monster.kind) && this.takeGnollMineTurn(monster, distance)) return;"],
			['pickaxe on the armoured geomancer', "else if (plan.kind === 'attack' && this.tryPickaxeGeomancer(occupant!)) return;"],
			['invulnerable while armoured or sapper-linked', 'if (this.gnollMineInvulnerable(defender)) return false;'],
			['blast invulnerability', 'if (this.gnollMineInvulnerable(c)) return false;'],
			['guard quarter damage (attack)', 'damage = this.gnollMineDamageTaken(defender, damage);'],
			['guard quarter damage (blast)', 'damage = this.gnollMineDamageTaken(c, damage);'],
			['bracket rule (attack)', 'this.gnollMineAfterDamage(defender, preHp);'],
			['bracket rule (blast)', 'this.gnollMineAfterDamage(c, preHp);'],
			['gnoll rockfall landing', 'if (volley.gnoll) { if (this.landGnollRockFall(volley.cells)) heroDied = true; continue; }'],
			['room payload links', 'this.linkMineQuestActors(this.portedMobSpawns);'],
			['geomancer scale survives clip refresh and facing', "if (creature.kind === 'gnollGeomancer') {\n\t\t\t//`GnollGeomancerSprite`'s constructor sets `scale.set(1.25f)`; retain the facing sign\n\t\t\t//used by `faceCharacter()` while refreshing the statue/idle clips.\n\t\t\tsprite.scale.set(sprite.scale.x < 0 ? -1.25 : 1.25, 1.25);\n\t\t}"],
			['death hooks', "if (creature.kind === 'gnollSapper' || creature.kind === 'gnollGeomancer') this.gnollMineDied(creature);"],
			['boss bar after the third strike', "(creature.kind === 'gnollGeomancer' && (creature.geomancerHits ?? 0) >= 3)"],
			['ambient guards', 'if (!this.populateMiningBranch())'],
			['quest boss beaten', 'this.blacksmithBossBeaten = true;'],
			['telegraphed cells drawn', 'for (const at of this.gnollWarningCells())'],
		];
		for (const [name, fragment] of pins) assert.ok(source.includes(fragment), `gnoll mine wiring: ${name}`);
	});
}
