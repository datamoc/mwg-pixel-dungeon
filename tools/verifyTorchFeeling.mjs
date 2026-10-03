import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// R088: generic floors retain Java's LARGE feeling (`Level`, tag `v3.3.8` - past depth 1,
// `Random.Int(14) === 4`), so the Torch count and the mob-count ceiling follow it the way
// the ported painter's `feeling === 4` already does.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = fileURLToPath(new URL('../node_modules/mwg/dist/', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'spd-torch-'));
function compile(source, destination) {
	const target = join(out, destination);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}
function shim(destination, source) {
	const target = join(out, destination);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, `module.exports = require(${JSON.stringify(source)});\n`);
}
try {
	writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
	compile(join(root, 'src/generated/mwlContent.ts'), 'generated/mwlContent.js');
	compile(join(root, 'src/mwlContent.ts'), 'mwlContent.js');
	compile(join(root, 'src/spdRng.ts'), 'spdRng.js');
	compile(join(root, 'src/items/generator.ts'), 'items/generator.js');
	compile(join(root, 'src/items/formula.ts'), 'items/formula.js');
	compile(join(root, 'src/items/catalog.ts'), 'items/catalog.js');
	compile(join(root, 'src/items/missiles.ts'), 'items/missiles.js');
	compile(join(root, 'src/items/itemKinds.ts'), 'items/itemKinds.js');
	compile(join(root, 'src/items/groundPlacement.ts'), 'items/groundPlacement.js');
	mkdirSync(join(out, 'node_modules/mwg'), { recursive: true });
	writeFileSync(join(out, 'node_modules/mwg/index.js'),
		`exports.Actors = require(${JSON.stringify(join(dist, 'actors', 'index.js'))}); exports.Random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))}); exports.Roguelike = require(${JSON.stringify(join(dist, 'roguelike', 'index.js'))});\n`);
	shim(join('node_modules', 'mwg', 'core', 'index.js'), join(dist, 'core', 'index.js'));
	shim(join('node_modules', 'mwg', 'mwl', 'index.js'), join(dist, 'mwl', 'index.js'));

	const check = (name, fn) => { fn(); console.log(`PASS ${name}`); };
	const require = createRequire(join(out, 'check.cjs'));
	const { genericLargeFeeling } = require(join(out, 'spdRng.js'));
	const { placeGroundItems } = require(join(out, 'items/groundPlacement.js'));

	check('generic LARGE is a depth-gated 1-in-14 roll off its own seeded stream', () => {
		for (let seed = 1n; seed <= 5n; seed++) {
			assert.equal(genericLargeFeeling(seed, 0), false, 'no feeling on depth 0');
			assert.equal(genericLargeFeeling(seed, 1), false, 'no feeling on depth 1 (Java rolls past depth 1 only)');
			assert.equal(genericLargeFeeling(seed, 7), genericLargeFeeling(seed, 7), 'the roll is deterministic per seed and depth');
		}
		// ~7.1% over a fixed sweep: deterministic because every seed is fixed.
		let hits = 0, total = 0;
		for (let seed = 1n; seed <= 50n; seed++) {
			for (let depth = 2; depth <= 26; depth++) {
				total++;
				if (genericLargeFeeling(seed, depth)) hits++;
			}
		}
		const rate = hits / total;
		assert.ok(rate > 0.03 && rate < 0.12, `LARGE rate ${rate} sits near Java's 1/14 over the sweep`);
	});

	const torchContext = (largeFeeling, darknessChallenge) => {
		let torches = 0;
		const cells = [];
		const context = {
			depth: 3,
			isBossDepth: false,
			largeFeeling,
			darknessChallenge,
			upgradeScrollDrops: 99,
			noScrolls: false,
			randomSpawnRoom: () => ({ left: 0, right: 4, top: 0, bottom: 4 }),
			torchRoom: () => ({ left: 0, right: 4, top: 0, bottom: 4 }),
			torchInt: () => 0,
			generateItem: () => ({ cat: 0, level: 0 }),
			materialize: (generated) => ({ id: 'x', quantity: 1, identified: true }),
			canPlaceFloorItem: () => false,
			canPlaceTorch: () => true,
			placeTorch: (x, y) => { torches++; cells.push([x, y]); },
			canPlaceKey: () => false,
			spawnMimic: () => {},
			spawnGround: () => {},
			placeUpgradeScroll: () => {},
		};
		placeGroundItems(context);
		return { torches, cells };
	};

	check('Torch count follows LARGE under DARKNESS through the shared placement', () => {
		assert.equal(torchContext(true, true).torches, 2, 'LARGE floor drops two Torches');
		assert.equal(torchContext(false, true).torches, 1, 'ordinary floor drops one Torch');
		assert.equal(torchContext(true, false).torches, 0, 'no Torches without DARKNESS even when LARGE');
		assert.equal(torchContext(false, false).torches, 0, 'no Torches without DARKNESS');
	});

	check('both LARGE consumers read the generic roll beside the painter feeling', () => {
		const scene = readFileSync(join(root, 'src/scenes/dungeon/npcShopBlacksmith.ts'), 'utf8');
		const sites = scene.match(/portedPaint\?\.feeling === 4\) \|\| genericLargeFeeling\(this\.runSeedLong, this\.depth\)/g) ?? [];
		assert.equal(sites.length, 2, 'mob-count and torch consumers both OR the generic roll with the painter feeling');
		const rng = readFileSync(join(root, 'src/spdRng.ts'), 'utf8');
		assert.match(rng, /export function genericLargeFeeling\(runSeed: bigint, depth: number\): boolean/,
			'the roll lives beside the depth-seed helpers');
		assert.match(rng, /new SpdJavaRandom\(spdSeedForDepth\(runSeed, depth, 7\)\)\.nextInt\(14\) === 4/,
			'past depth 1 the roll is Int(14) === 4 on its own branch-7 stream');
	});

	check('torch candidates draw off a dedicated depth-seeded stream, stable per floor', () => {
		//`RegularLevel.createItems()` torches draw off their own pushed generator
		//(`RegularLevel.java:470-491`, tag `v3.3.8`), popped right after - gameplay RNG
		//can neither shift torch cells nor be shifted by them. The port's equivalent is
		//one `torchRoller` per floor (branch 8: 0/1 carry levelgen, 7 the LARGE roll).
		const { torchRoller, TORCH_STREAM_BRANCH } = require(join(out, 'spdRng.js'));
		assert.equal(TORCH_STREAM_BRANCH, 8, 'torches take branch 8');
		//Bounds: every draw lands in [0, bound), so room-index and cell picks keep
		//exactly the old live draw's support (`Random.range` is inclusive both ends).
		const draw = torchRoller(99n, 5);
		for (let i = 0; i < 200; i++) {
			const v = draw(7);
			assert.ok(v >= 0 && v < 7, `draw ${v} stays in [0, 7)`);
		}
		//Determinism: the same seed+depth rebuilds the same torch cells through the
		//real placement loop (stub rooms, always placeable, two rooms to pick between).
		const rooms = [{ left: 2, right: 9, top: 3, bottom: 8 }, { left: 12, right: 15, top: 1, bottom: 6 }];
		const cellsFor = () => {
			const cells = [];
			const roller = torchRoller(123n, 5);
			const context = {
				depth: 5, isBossDepth: false, largeFeeling: true, darknessChallenge: true,
				upgradeScrollDrops: 99, noScrolls: false,
				randomSpawnRoom: () => rooms[0],
				torchRoom: () => rooms[roller(rooms.length)],
				torchInt: (bound) => roller(bound),
				generateItem: () => ({ cat: 0, level: 0 }),
				materialize: (generated) => ({ id: 'x', quantity: 1, identified: true }),
				canPlaceFloorItem: () => false,
				canPlaceTorch: () => true,
				placeTorch: (x, y) => { cells.push([x, y]); },
				canPlaceKey: () => false,
				spawnMimic: () => {},
				spawnGround: () => {},
				placeUpgradeScroll: () => {},
			};
			placeGroundItems(context);
			for (const [x, y] of cells) {
				assert.ok(rooms.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom),
					`torch cell [${x},${y}] sits inside a candidate room`);
			}
			return JSON.stringify(cells);
		};
		assert.equal(cellsFor(), cellsFor(), 'same seed+depth rebuilds identical torch cells');
		//Wiring: the loop draws room+cells off the context stream, and the scene feeds it
		//one dedicated roller per floor (same entrance-room skip as the ordinary loop).
		const placement = readFileSync(join(root, 'src/items/groundPlacement.ts'), 'utf8');
		assert.match(placement, /const room = context\.torchRoom\(\);[\s\S]{0,400}const x = room\.left \+ context\.torchInt\(room\.right - room\.left \+ 1\);/,
			'the torch loop draws room and inclusive-both-ends cells off the context stream');
		const blacksmith = readFileSync(join(root, 'src/scenes/dungeon/npcShopBlacksmith.ts'), 'utf8');
		assert.match(blacksmith, /const torchDraw = torchRoller\(this\.runSeedLong, this\.depth\);/,
			'the scene builds one dedicated torch roller per floor');
		assert.match(blacksmith, /torchRoom: \(\) => \{\s*const first = this\.portedFloorActive \? 0 : 1;/,
			'the seeded room pick keeps the ordinary loop entrance-room skip');
	});
} finally {
}
console.log('verifyTorchFeeling: ok (generic LARGE feeling, Torch count, Torch seeded stream)');
