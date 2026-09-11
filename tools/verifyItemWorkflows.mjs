import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = fileURLToPath(new URL('../node_modules/mwg/dist/', import.meta.url));
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
	compile(join(root, 'src/itemWorkflows.ts'), 'workflows.js');
	compile(join(root, 'src/ringModifiers.ts'), 'ringModifiers.js');
	compile(join(root, 'src/transmutation.ts'), 'transmutation.js');
	// The framework side is the installed `@datamoc/mw_games` build the game itself ships,
	// shimmed rather than compiled from a sibling checkout of the framework's sources - the two
	// are different versions in general, so compiling a checkout would test something this port
	// does not depend on. mwg's dist is ESM and this temporary tree is CommonJS, which `require()`
	// bridges directly on Node >= 22.12.
	function shim(destination, source) {
		const target = join(out, destination);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, `module.exports = require(${JSON.stringify(source)});\n`);
	}
	shim(join('actors', 'Inventory.js'), join(dist, 'actors', 'Inventory.js'));
	shim(join('actors', 'Appearances.js'), join(dist, 'actors', 'Appearances.js'));
	shim(join('core', 'Random.js'), join(dist, 'core', 'Random.js'));
	//The workflow module imports only actors and Random from the package, so provide a tiny local barrel.
	mkdirSync(join(out, 'node_modules/mwg'), { recursive: true });
	writeFileSync(join(out, 'node_modules/mwg/index.js'),
		`exports.Actors = require(${JSON.stringify(join(dist, 'actors', 'index.js'))}); exports.Random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))});\n`);
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
