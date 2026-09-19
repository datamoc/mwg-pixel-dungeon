import assert from 'node:assert/strict';

// Called by verifySimulation.mjs after compiling actual production modules into its temp tree.
export function verifyBrews(require, check) {
	check('ShockingBrew seeds electricity 20 over a radius-3 flood', () => {
		// `ShockingBrew.shatter()` (tag `v3.3.8`): `PathFinder.buildDistanceMap(cell,
		// not solid, 3)`, then `Blob.seed(i, 20, Electricity.class)` per reached cell.
		const { brewShatterCells, SHOCKING_BREW_RADIUS, SHOCKING_BREW_VOLUME } = require('./simulation/brews');
		assert.equal(SHOCKING_BREW_RADIUS, 3);
		assert.equal(SHOCKING_BREW_VOLUME, 20);
		const open = brewShatterCells(7, 7, () => false, 3, 3, SHOCKING_BREW_RADIUS);
		assert.equal(open.length, 49, 'Java walks dirLR (8 neighbours): Chebyshev layers 0..3 hold 49 cells');
		assert.deepEqual(open[0], { x: 3, y: 3 }, 'the center seeds first');
	});
	check('the flood stops at solid cells and at the map edge', () => {
		const { brewShatterCells } = require('./simulation/brews');
		const ringAt = new Set(['2,2', '3,2', '4,2', '2,3', '4,3', '2,4', '3,4', '4,4']);
		const boxed = brewShatterCells(7, 7, (x, y) => ringAt.has(`${x},${y}`), 3, 3, 3);
		assert.deepEqual(boxed, [{ x: 3, y: 3 }], 'a fully ringed center floods nowhere');
		const crossAt = new Set(['3,2', '3,4', '2,3', '4,3']);
		const leaked = brewShatterCells(7, 7, (x, y) => crossAt.has(`${x},${y}`), 3, 3, 1);
		assert.deepEqual(leaked, [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 4 }, { x: 4, y: 4 }],
			'Java checks only the target cell, so the flood cuts diagonal corners like the real one');
		const edge = brewShatterCells(3, 3, () => false, 0, 0, 3);
		for (const cell of edge) {
			assert.ok(cell.x >= 0 && cell.y >= 0 && cell.x < 3 && cell.y < 3, 'no cell escapes the map');
		}
		assert.equal(edge.length, 9, 'a 3x3 corner reaches every cell (Chebyshev 2 fills it)');
	});
	check('CausticBrew walks the same radius-3 flood and afflicts instead of seeding', () => {
		// `CausticBrew.shatter()`: the same distance-3 map, `Ooze` on every char found.
		const { brewShatterCells, CAUSTIC_BREW_RADIUS } = require('./simulation/brews');
		assert.equal(CAUSTIC_BREW_RADIUS, 3);
		const cells = brewShatterCells(9, 9, () => false, 4, 4, CAUSTIC_BREW_RADIUS);
		assert.equal(cells.length, 49);
	});
	check('Infernal/Blizzard pile blocked shares onto the center at 120 a cell', () => {
		// Both shatters seed 120 per open NEIGHBOURS8 cell; the center takes 120 plus
		// 120 per solid neighbour.
		const { brewNeighbourSeedPlan, INFERNO_BREW_VOLUME, BLIZZARD_BREW_VOLUME } = require('./simulation/brews');
		assert.equal(INFERNO_BREW_VOLUME, 120);
		assert.equal(BLIZZARD_BREW_VOLUME, 120);
		const open = brewNeighbourSeedPlan(() => false, 4, 4, 120);
		assert.equal(open.seeds.length, 8);
		assert.equal(open.centerVolume, 120);
		const oneWall = brewNeighbourSeedPlan((x, y) => x === 5 && y === 4, 4, 4, 120);
		assert.equal(oneWall.seeds.length, 7);
		assert.equal(oneWall.centerVolume, 240);
	});
	check('all four brews are throwable now that every shatter resolves', () => {
		const { THROWABLE_BREW_IDS } = require('./simulation/brews');
		for (const id of ['shockingBrew', 'causticBrew', 'infernalBrew', 'blizzardBrew']) {
			assert.ok(THROWABLE_BREW_IDS.has(id), `${id} throws`);
		}
	});
	check('inferno reignites, destroys flamable ground, and spreads fire next door', () => {
		// `Inferno.evolve()` (tag `v3.3.8`): live cells burn chars, eat flamable terrain,
		// and seed `Fire` 4 on flamable 4-neighbours without fire.
		const { applyEnvironmentalBlobs } = require('./simulation/environmentalBlobs');
		const target = { hp: 10 };
		const calls = [];
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true,
			advance: () => {},
			cellsAbove: (blob) => blob === 'inferno' ? [{ x: 1, y: 1 }] : [],
			amountAt: () => 0,
			creatureAt: (x, y) => x === 1 && y === 1 ? target : null,
			addBuff: () => {},
			applyCorrosion: () => {},
			corrosiveStrength: () => 0,
			toxicDamage: () => 0,
			isToxicImmune: () => false,
			applyDamage: () => true,
			electricDamage: () => 0,
			reigniteBurning: (t) => calls.push(['burn', t === target]),
			clearCell: (blob, x, y) => calls.push(['clear', blob, x, y]),
			clearFireCell: (x, y) => calls.push(['clearFire', x, y]),
			fireAmountAt: () => 0,
			seedFireCell: (x, y, volume) => calls.push(['seedFire', x, y, volume]),
			isFlammableCell: () => true,
			destroyFlammableCell: (x, y) => calls.push(['destroy', x, y]),
		});
		assert.ok(calls.some(([op]) => op === 'burn'), 'the occupant reignites');
		assert.ok(calls.some((call) => call[0] === 'destroy'), 'flamable ground is destroyed');
		assert.equal(calls.filter(([op]) => op === 'seedFire').length, 4, 'all four neighbours catch Fire 4');
		assert.ok(calls.every((call) => call[0] !== 'seedFire' || call[3] === 4));
	});
	check('inferno and blizzard annihilate each other instead of burning or chilling', () => {
		const { applyEnvironmentalBlobs } = require('./simulation/environmentalBlobs');
		const cleared = [];
		const chills = [];
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true,
			advance: () => {},
			cellsAbove: (blob) => blob === 'inferno' || blob === 'blizzard' ? [{ x: 2, y: 2 }] : [],
			amountAt: () => 1,
			creatureAt: () => ({ hp: 10 }),
			addBuff: () => {},
			applyCorrosion: () => {},
			corrosiveStrength: () => 0,
			toxicDamage: () => 0,
			isToxicImmune: () => false,
			applyDamage: () => true,
			electricDamage: () => 0,
			reigniteBurning: () => chills.push('burn'),
			applyChill: () => chills.push('chill'),
			clearCell: (blob, x, y) => cleared.push([blob, x, y]),
			clearFireCell: () => {},
			fireAmountAt: () => 0,
			seedFireCell: () => {},
			isFlammableCell: () => false,
			destroyFlammableCell: () => {},
		});
		assert.ok(cleared.some(([blob]) => blob === 'inferno'), 'inferno clears');
		assert.ok(cleared.some(([blob]) => blob === 'blizzard'), 'blizzard clears');
		assert.equal(chills.length, 0, 'neither burns nor chills on a shared cell');
	});
	check('plantFreeze chills (never paralyses) and clears fire, like Freezing', () => {
		// Regression: the loop granted raw paralysis while the icecap comments promised
		// the shared chill-then-Frost step.
		const { applyEnvironmentalBlobs } = require('./simulation/environmentalBlobs');
		const target = { hp: 10 };
		let chills = 0;
		let fires = 0;
		const buffs = [];
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true,
			advance: () => {},
			cellsAbove: (blob) => blob === 'plantFreeze' ? [{ x: 4, y: 4 }] : [],
			amountAt: () => 0,
			creatureAt: () => target,
			addBuff: (...args) => buffs.push(args),
			applyCorrosion: () => {},
			corrosiveStrength: () => 0,
			toxicDamage: () => 0,
			isToxicImmune: () => false,
			applyDamage: () => true,
			electricDamage: () => 0,
			applyChill: (t) => { if (t === target) chills++; },
			clearFireCell: () => { fires++; },
		});
		assert.equal(chills, 1, 'one chill step per turn');
		assert.equal(fires, 1, 'fire is cleared on the cell');
		assert.ok(buffs.every(([, id]) => id !== 'paralysis'), 'no paralysis from freezing');
	});
	check('a lone blizzard cell chills twice and clears fire', () => {
		// `Blizzard.evolve()` runs `Freezing.freeze(cell)` twice per live cell.
		const { applyEnvironmentalBlobs } = require('./simulation/environmentalBlobs');
		const target = { hp: 10 };
		let chills = 0;
		let fireClears = 0;
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true,
			advance: () => {},
			cellsAbove: (blob) => blob === 'blizzard' ? [{ x: 3, y: 3 }] : [],
			amountAt: () => 0,
			creatureAt: () => target,
			addBuff: () => {},
			applyCorrosion: () => {},
			corrosiveStrength: () => 0,
			toxicDamage: () => 0,
			isToxicImmune: () => false,
			applyDamage: () => true,
			electricDamage: () => 0,
			applyChill: (t) => { if (t === target) chills++; },
			clearCell: () => {},
			clearFireCell: () => { fireClears++; },
		});
		assert.equal(chills, 2, 'the double freeze lands two chill steps');
		assert.equal(fireClears, 1, 'fire is cleared on the cell');
	});
}
