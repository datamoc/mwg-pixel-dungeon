import assert from 'node:assert/strict';

/**
 * `src/mechanics/cone.ts` - the `ConeAOE` translation. These pin the *shape* of the result: the
 * arc's angular limits, the range clamp, the rim, wall truncation and deduplication. The exact cell
 * sets Java produces are asserted by the live probe on the real wand
 * (`tools/scratch/regrowth-path-livecheck.mjs` and the sector check in its own file); here the
 * tracer is synthetic so the geometry can be reasoned about on its own.
 */
export function verifyCone(require, check) {
	const { coneCells } = require('./mechanics/cone');

	/** An open grid whose rays are the straight cells from `from` towards `to`, `from` excluded. */
	const openTrace = (from, to) => {
		const cells = [];
		const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
		for (let i = 1; i <= steps; i++) {
			cells.push({
				x: Math.round(from.x + ((to.x - from.x) * i) / steps),
				y: Math.round(from.y + ((to.y - from.y) * i) / steps),
			});
		}
		return cells;
	};
	const key = (cell) => `${cell.x},${cell.y}`;
	const setOf = (cells) => new Set(cells.map(key));
	const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
	const angleOf = (from, to) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
	const open = { source: { x: 10, y: 10 }, width: 40, height: 40, trace: openTrace };

	check('cone is empty only when no ray lands anywhere, and always deduplicates', () => {
		const cone = coneCells({ ...open, target: { x: 16, y: 10 }, degrees: 40, maxDistance: 6 });
		assert.equal(new Set(cone.cells.map(key)).size, cone.cells.length);
		assert.ok(cone.cells.length > 0);
	});

	check('every cone cell is within the range clamp, measured from the source cell', () => {
		const source = { x: 10, y: 10 };
		const cone = coneCells({ ...open, target: { x: 18, y: 10 }, degrees: 60, maxDistance: 5 });
		// the clamp is euclidean on cell centres, and the rim sits half a cell past the target
		for (const cell of cone.cells) assert.ok(distance(source, cell) <= 5 + 0.5 + 1e-9, `${key(cell)} is out of the clamped range`);
	});

	check('every cone cell is inside the arc, within the quantisation the algorithm itself has', () => {
		const source = { x: 10, y: 10 };
		const aim = { x: 16, y: 13 };
		const degrees = 40;
		const maxDistance = 8;
		const cone = coneCells({ ...open, source, target: aim, degrees, maxDistance });
		const aimAngle = angleOf(source, aim);
		const rimRadius = distance(source, aim) + 0.5;
		assert.ok(cone.cells.length > 0);
		for (const cell of cone.cells) {
			// Cells behind the source have nothing to do with the cone.
			assert.ok(distance(source, cell) >= 1, `${key(cell)} is not beyond the source`);
			let delta = Math.abs(angleOf(source, cell) - aimAngle) % 360;
			if (delta > 180) delta = 360 - delta;
			// Java's cone is the union of *straight traces* to the rim cells the arc sampled, and both
			// the rim and each trace are floored to whole cells. So a cell's deviation from the aim is
			// bounded by the half-arc plus the quantisation of its own distance (0.75 of a cell, the
			// worst diagonal rounding) plus the quantisation of the rim (one cell at the rim radius),
			// with a degree for the half-degree sampling. Without those terms the bound would be
			// wrong rather than tight - Java's own rim lands up to a cell outside the sampled arc,
			// which is visible above in the rim of this very cone.
			const degreesOf = (ratio) => (Math.atan(ratio) * 180) / Math.PI;
			const bound = degrees / 2 + degreesOf(0.75 / Math.max(1, distance(source, cell))) + degreesOf(1 / rimRadius) + 1;
			assert.ok(delta <= bound + 1e-9, `${key(cell)} is ${delta.toFixed(1)} degrees off the aim, beyond the ${bound.toFixed(1)}-degree bound`);
		}
	});

	check('a wider arc is a superset of a narrower one aimed the same way', () => {
		const narrow = setOf(coneCells({ ...open, target: { x: 16, y: 10 }, degrees: 20, maxDistance: 6 }).cells);
		const wide = setOf(coneCells({ ...open, target: { x: 16, y: 10 }, degrees: 60, maxDistance: 6 }).cells);
		for (const cell of narrow) assert.ok(wide.has(cell), `${cell} fell out of the wider cone`);
		assert.ok(wide.size > narrow.size);
	});

	check('a longer aim reaches further, and the rim is the arc\'s landing cells', () => {
		const near = coneCells({ ...open, target: { x: 12, y: 10 }, degrees: 30, maxDistance: 2 });
		const far = coneCells({ ...open, target: { x: 18, y: 10 }, degrees: 30, maxDistance: 8 });
		const source = { x: 10, y: 10 };
		const reach = (cone) => Math.max(...cone.cells.map((cell) => distance(source, cell)));
		assert.ok(reach(far) > reach(near));
		// the rim sits at the aimed radius (plus the half-cell rounding), and the aimed cell itself
		// is reached along the core ray
		const rimRadius = distance(source, { x: 18, y: 10 }) + 0.5;
		assert.ok(far.outer.length > 0);
		for (const cell of far.outer) assert.ok(Math.abs(distance(source, cell) - rimRadius) <= 1.5, `${key(cell)} is not on the rim`);
		assert.ok(far.cells.some((cell) => cell.x === 18 && cell.y === 10));
	});

	check('a wall truncates the ray, so cells behind it are not in the cone', () => {
		const source = { x: 5, y: 5 };
		// a wall at x = 8 on the aim row: every ray crossing it stops there
		const wallAt = 8;
		const trace = (from, to) => {
			const cells = openTrace(from, to);
			const hit = cells.findIndex((cell) => cell.x >= wallAt && to.x >= wallAt);
			return hit === -1 ? cells : cells.slice(0, hit + 1);
		};
		const cone = coneCells({ source, target: { x: 14, y: 5 }, degrees: 30, maxDistance: 12, width: 40, height: 40, trace });
		assert.ok(cone.cells.length > 0, 'the near side of the wall is still in the cone');
		for (const cell of cone.cells) assert.ok(cell.x <= wallAt, `${key(cell)} is behind the wall`);
		assert.ok(cone.cells.some((cell) => cell.x === wallAt));
	});

	check('a zero-degree cone is exactly the single trace to the one cell its ray lands on', () => {
		const source = { x: 10, y: 10 };
		const cone = coneCells({ ...open, source, target: { x: 17, y: 10 }, degrees: 0, maxDistance: 8 });
		assert.equal(cone.outer.length, 1, 'a zero-degree arc samples exactly one ray');
		// that ray lands on the quantised cell along the aim, and the cone is that cell's own trace
		assert.deepEqual(setOf(cone.cells), new Set(openTrace(source, cone.outer[0]).map(key)));
	});
}
