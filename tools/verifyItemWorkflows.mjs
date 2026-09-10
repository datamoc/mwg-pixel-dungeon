import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const mwg = fileURLToPath(new URL('../../MW_games/', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'spd-items-'));
function fileURLToPath(url) { return new URL(url).pathname.replace(/^\//, '').replaceAll('/', '\\'); }
function compile(source, destination) {
	const target = join(out, destination);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}
try {
	writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
	compile(join(mwg, 'src/actors/Inventory.ts'), 'actors/Inventory.js');
	compile(join(mwg, 'src/actors/Affix.ts'), 'actors/Affix.js');
	compile(join(mwg, 'src/actors/ItemState.ts'), 'actors/ItemState.js');
	compile(join(mwg, 'src/core/Random.ts'), 'core/Random.js');
	compile(join(mwg, 'src/actors/Appearances.ts'), 'actors/Appearances.js');
	compile(join(root, 'src/itemWorkflows.ts'), 'workflows.js');
	compile(join(root, 'src/ringModifiers.ts'), 'ringModifiers.js');
	compile(join(root, 'src/transmutation.ts'), 'transmutation.js');
	//The workflow module imports only actors from the package, so provide a tiny local barrel.
	mkdirSync(join(out, 'node_modules/mwg'), { recursive: true });
	writeFileSync(join(out, 'node_modules/mwg/index.js'), "exports.Actors = { ...require('../../actors/Inventory.js'), ...require('../../actors/Affix.js'), ...require('../../actors/ItemState.js') }; exports.Random = require('../../core/Random.js');\n");
	const require = createRequire(join(out, 'check.cjs'));
	const { Inventory } = require('./actors/Inventory.js');
	const { Appearances } = require('./actors/Appearances.js');
	const { transferEnhancement, upgradeItem } = require('./workflows.js');
	const { transmuteItem } = require('./transmutation.js');
	const bag = new Inventory();
	bag.add({ id: 'sword', quantity: 1, stackable: true, instanceId: 'flame', level: 2, affix: 'blazing' });
	bag.add({ id: 'sword', quantity: 1, stackable: true, instanceId: 'frost', level: 1, affix: 'chilling' });
	assert.equal(bag.items.length, 2);
	const source = bag.take('sword', 1, 'flame');
	const target = bag.take('sword', 1, 'frost');
	assert.ok(source && target);
	transferEnhancement(source, target);
	assert.equal(target.instanceId, 'frost');
	assert.equal(target.affix, 'blazing');
	upgradeItem(target, 1);
	assert.equal(target.level, 3);
	const looks = new Appearances({ potion: { kinds: ['a', 'b'], labels: ['red', 'blue'] } });
	const first = looks.appearanceOf('potion', 'a');
	const restored = Appearances.fromJSON({ potion: { kinds: ['a', 'b'], labels: ['red', 'blue'] } }, looks.toJSON());
	assert.equal(restored.appearanceOf('potion', 'a'), first);
	const ring = transmuteItem({ id: 'ring_might', quantity: 1, identified: true, level: 4, cursed: false }, (kind) => `test-${kind}`);
	assert.ok(ring);
	assert.equal(ring.level, 4);
	console.log('PASS item-instance separation, enhancement transfer, upgrade policy and appearance restore');
} finally {
	rmSync(out, { recursive: true, force: true });
}
