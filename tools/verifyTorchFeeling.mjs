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
		const context = {
			depth: 3,
			isBossDepth: false,
			largeFeeling,
			darknessChallenge,
			upgradeScrollDrops: 99,
			noScrolls: false,
			randomSpawnRoom: () => ({ left: 0, right: 4, top: 0, bottom: 4 }),
			generateItem: () => ({ cat: 0, level: 0 }),
			materialize: (generated) => ({ id: 'x', quantity: 1, identified: true }),
			canPlaceFloorItem: () => false,
			canPlaceTorch: () => true,
			placeTorch: () => { torches++; },
			canPlaceKey: () => false,
			spawnMimic: () => {},
			spawnGround: () => {},
			placeUpgradeScroll: () => {},
		};
		placeGroundItems(context);
		return torches;
	};

	check('Torch count follows LARGE under DARKNESS through the shared placement', () => {
		assert.equal(torchContext(true, true), 2, 'LARGE floor drops two Torches');
		assert.equal(torchContext(false, true), 1, 'ordinary floor drops one Torch');
		assert.equal(torchContext(true, false), 0, 'no Torches without DARKNESS even when LARGE');
		assert.equal(torchContext(false, false), 0, 'no Torches without DARKNESS');
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
} finally {
}
console.log('verifyTorchFeeling: ok (generic LARGE feeling, Torch count)');
