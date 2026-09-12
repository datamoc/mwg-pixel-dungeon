/**
 * `mechanics/ConeAOE.java` (tag v3.3.8), translated.
 *
 * Java builds a cone from an aiming shot by casting a ray every 0.5 degrees across the arc: the
 * cells those rays land on at the cone's radius - plus a ring one cell inside when the radius is at
 * least 4, which fills in the gaps a big cone would otherwise have - are then each connected back to
 * the source with a second `Ballistica`, and the union of *those* paths is the cone. A wall
 * therefore truncates the part of the cone behind it, because the ray that would have reached past
 * it stopped at the wall instead.
 *
 * The framework has no equivalent to reuse: `roguelike`'s `coneCells` is a spray whose aim snaps to
 * one of the eight directions and whose width grows linearly with distance - no arc angle, no range
 * clamp, no wall awareness (recorded as proposal P13 in `ROADMAP.md`). The line tracer is injected
 * rather than imported so this stays a pure function of its inputs, testable headlessly; the game
 * passes MWG's `ballistica` with the stop mode Java's `ballisticaParams` names.
 *
 * The arc arithmetic mirrors Java's `float` precision (`Math.fround` at each step). That looks
 * pedantic, but the loop's endpoint is a *sampled* boundary - 60.5 degrees of arc is 121 or 122
 * rays depending on the rounding - so a double-precision version could include or drop the rim cell
 * Java includes, and the point of the translation is that the two can be compared line for line.
 */
import type { Step } from '../simulation/combatState';

/** `PointF.G2R`. */
const G2R = Math.PI / 180;

export interface ConeOptions {
	/** Where the caster stands - Java's `core.sourcePos`. */
	source: Step;
	/** What it aims at - Java's `core.collisionPos`, i.e. where the aiming shot stopped. */
	target: Step;
	/** Total arc width in degrees - Java's `degrees`. */
	degrees: number;
	/** Java's `maxDist`, in *true* (euclidean) distance; `Infinity` is legal. */
	maxDistance: number;
	width: number;
	height: number;
	/**
	 * One ray: Java's `new Ballistica(source, cell, ballisticaParams).subPath(1, ray.dist)` - the
	 * cells from `source` (excluded) up to `cell` or the first stop, the stop cell included.
	 */
	trace(from: Step, to: Step): Step[];
}

export interface ConeResult {
	/** Java's `cells`: every cell of the cone. Order is Java's LinkedHashSet order. */
	cells: Step[];
	/** Java's `outerRays` landing cells - the rim, in the order the arc was scanned. */
	outer: Step[];
}

/** Java's `PointF.distance`, at `float` precision. */
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
	const dx = Math.fround(a.x - b.x);
	const dy = Math.fround(a.y - b.y);
	return Math.fround(Math.sqrt(Math.fround(Math.fround(dx * dx) + Math.fround(dy * dy))));
}

export function coneCells(options: ConeOptions): ConeResult {
	//Java works in true coordinates from the centre of each cell, not cell indices.
	const from = { x: Math.fround(options.source.x + 0.5), y: Math.fround(options.source.y + 0.5) };
	let to = { x: Math.fround(options.target.x + 0.5), y: Math.fround(options.target.y + 0.5) };

	//clamp distance of the cone to maxDist (in true distance, not game distance)
	if (distance(from, to) > options.maxDistance) {
		const ratio = Math.fround(options.maxDistance / distance(from, to));
		to = { x: Math.fround(from.x + Math.fround((to.x - from.x) * ratio)), y: Math.fround(from.y + Math.fround((to.y - from.y) * ratio)) };
	}

	//the circle's radius is bumped by 0.5 so the cone reaches the edge of the target cell
	const circleRadius = Math.fround(distance(from, to) + 0.5);
	const initialAngle = Math.fround(Math.fround(Math.atan2(to.y - from.y, to.x - from.x)) / G2R);

	/** Java's `scan.polar(a, radius)` + `offset(fromP)` + the half-cell nudge + gate/floor. */
	const scanCell = (angleDegrees: number, radius: number): string => {
		const radians = Math.fround(angleDegrees * G2R);
		const x = Math.fround(Math.fround(Math.cos(radians) * radius) + from.x);
		const y = Math.fround(Math.fround(Math.sin(radians) * radius) + from.y);
		const nudgedX = Math.fround(x + (from.x > x ? 0.5 : -0.5));
		const nudgedY = Math.fround(y + (from.y > y ? 0.5 : -0.5));
		const cellX = Math.min(Math.max(0, Math.floor(nudgedX)), options.width - 1);
		const cellY = Math.min(Math.max(0, Math.floor(nudgedY)), options.height - 1);
		return `${cellX},${cellY}`;
	};
	const stepOf = (key: string): Step => {
		const [x, y] = key.split(',').map(Number);
		return { x: x!, y: y! };
	};

	//Java preserves the scan order in a LinkedHashSet, and the game shuffles the cells afterwards
	//anyway, so only the *set* is load-bearing; the order is kept to stay comparable to the loop.
	const targetCells = new Map<string, Step>();
	const outerCells = new Set<string>();
	let angle = Math.fround(initialAngle + Math.fround(options.degrees / 2));
	const lastAngle = Math.fround(initialAngle - Math.fround(options.degrees / 2));
	for (; angle >= lastAngle; angle = Math.fround(angle - 0.5)) {
		const rim = scanCell(angle, circleRadius);
		targetCells.set(rim, stepOf(rim));
		outerCells.add(rim);
		if (circleRadius >= 4) {
			const inner = scanCell(angle, Math.fround(circleRadius - 1));
			targetCells.set(inner, stepOf(inner));
		}
	}

	const cells = new Map<string, Step>();
	for (const cell of targetCells.values()) {
		for (const traced of options.trace(options.source, cell)) {
			const key = `${traced.x},${traced.y}`;
			if (!cells.has(key)) cells.set(key, traced);
		}
	}
	return { cells: [...cells.values()], outer: [...outerCells].map(stepOf) };
}
