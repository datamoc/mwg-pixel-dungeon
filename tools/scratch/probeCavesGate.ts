// Scratch probe (not part of the suite): confirms the Caves boss gate's paint order and its
// effect on the arena's water/trap cells and on the pylon-energy cell set.
//   npx esbuild tools/scratch/probeCavesGate.ts --bundle --platform=node --format=esm --outfile=tools/scratch/probeCavesGate.mjs && node tools/scratch/probeCavesGate.mjs
import { PaintLevel, Terrain, fillEllipseRect, fillXY } from '../../src/spdLevelGen/paintLevel';
import { spdPatchGenerate } from '../../src/spdLevelGen/spdPatch';
import { SpdRandom } from '../../src/spdRng';

function fillRect(level: PaintLevel, left: number, top: number, right: number, bottom: number, terrain: number): void {
	fillXY(level, left, top, right - left + 1, bottom - top + 1, terrain);
}

type IntFn = (bound: number) => number;
let draws = 0;
const realInt = SpdRandom.int.bind(SpdRandom) as IntFn;
(SpdRandom as unknown as { int: IntFn }).int = (bound: number): number => {
	draws++;
	return realInt(bound);
};

/** The patch loop shared by both variants, so only the gate fill position differs. */
function body(level: PaintLevel, stronger: boolean): void {
	const patch = spdPatchGenerate(level.w, level.h - 14, 0.15, 2, true);
	const patchOffset = 14 * level.w;
	const trapBound = stronger ? 4 : 8;
	for (let i = patchOffset; i < level.w * level.h; i++) {
		if (level.map[i] !== Terrain.EMPTY) continue;
		if (patch[i - patchOffset]) level.map[i] = Terrain.WATER;
		else if (SpdRandom.int(trapBound) === 0) level.map[i] = Terrain.INACTIVE_TRAP;
	}
}

function build(order: 'gateFirst' | 'gateLast'): PaintLevel {
	SpdRandom.pushGenerator(42n);
	draws = 0;
	const level = new PaintLevel(33, 42, Terrain.CHASM);
	// Java's own `gate` rect, `Rect(14,13,19,14)`, in this module's inclusive `fillRect` form: five
	// cells on row 13. (It used to be written `14, 13, 19, 14` - the rect read inclusively - which
	// painted twelve, left six after the ellipse cleared row 14, and put one extra `CUSTOM_DECO`
	// cell into every energy count below.)
	if (order === 'gateFirst') fillRect(level, 14, 13, 18, 13, Terrain.SIGN);
	// `Painter.fillEllipse(this, mainArena, EMPTY)` - `mainArena` is `Rect(5,14,28,37)`, i.e. 23x23.
	fillEllipseRect(level, 5, 14, 28, 37, 0, Terrain.EMPTY);
	body(level, false);
	if (order === 'gateLast') fillRect(level, 14, 13, 18, 13, Terrain.SIGN);
	return level;
}

const NAME: Record<number, string> = {
	[Terrain.CHASM]: 'CHASM', [Terrain.WALL]: 'WALL', [Terrain.EMPTY]: '.', [Terrain.SIGN]: 'SIGN',
	[Terrain.WATER]: 'WATER', [Terrain.INACTIVE_TRAP]: 'TRAP',
};

/** Java's `activatePylon()` predicate, over `mainArena.top - 1` down (row 13 onward). */
function energyCells(level: PaintLevel): number[] {
	const cells: number[] = [];
	for (let i = 13 * level.w; i < level.map.length; i++) {
		const t = level.map[i];
		if (t === Terrain.INACTIVE_TRAP || t === Terrain.WATER || t === Terrain.SIGN) cells.push(i);
	}
	return cells;
}

for (const order of ['gateFirst', 'gateLast'] as const) {
	const level = build(order);
	const row = (y: number) => Array.from({ length: 10 }, (_, k) => NAME[level.map[14 + k + y * level.w]] ?? '?').join(' ');
	console.log(`--- ${order} ---`);
	console.log(`  draws in patch loop : ${draws}`);
	console.log(`  row 13 cols 14-23   : ${row(13)}`);
	console.log(`  row 14 cols 14-23   : ${row(14)}`);
	const cells = energyCells(level);
	const gate = cells.filter((c) => Math.floor(c / level.w) === 13 && c % level.w >= 14 && c % level.w <= 18).length;
	console.log(`  energy cells total  : ${cells.length} (of which the gate's own five cells: ${gate})`);
}

// Is the ellipse's top row exactly the gate's bottom row?
SpdRandom.pushGenerator(42n);
const probe = new PaintLevel(33, 42, Terrain.CHASM);
fillEllipseRect(probe, 5, 14, 28, 37, 0, Terrain.EMPTY);
const topRow = Array.from({ length: 10 }, (_, k) => (probe.map[14 + k + 14 * 33] === Terrain.EMPTY ? '#' : '.')).join('');
console.log(`ellipse top-row coverage, cols 14-23: ${topRow}`);
