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
	compile(join(root, 'src/missiles.ts'), 'missiles.js');
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
	const { missilePickupValid, recordMissileUpgrade } = require('./missiles.js');
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
	// `MissileWeapon.UpgradedSetTracker.pickupValid`: no tracker, no entry, or a level at/above
	// the recorded threshold merges; anything below the threshold crumbles to dust instead.
	assert.equal(missilePickupValid(undefined, 1, 0), true);
	assert.equal(missilePickupValid(new Map(), 1, 0), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), undefined, 0), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 2, 0), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 2), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 3), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 1), false);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 0), false);
	// `MissileWeapon.upgrade()`: the upgraded set records trueLevel()+1, immutably.
	const recorded = recordMissileUpgrade(new Map(), 1, 2);
	assert.deepEqual([...recorded], [[1, 2]]);
	assert.equal(recordMissileUpgrade(recorded, 1, 5).get(1), 5);
	assert.equal(recorded.get(1), 2);
	// `Unstable.randomEnchants` (`items/weapon/enchantments/Unstable.java`, tag `v3.3.8`): the
	// eleven enchantments its proc may delegate a swing to, in Java's own array order - the port
	// picks a delegate from a single draw, so the index each one sits at has to be Java's for that
	// draw to mean the same thing. Projecting is Java's deliberate omission ("no on-hit effect")
	// and Unstable never delegates to itself; the check fails both ways, on a missing delegate and
	// on one Java does not list.
	compile(join(root, 'src/generated/mwlContent.ts'), 'generated/mwlContent.js');
	const { gameData } = require('./generated/mwlContent');
	const tableRows = (id) => {
		const tables = [];
		const walk = (node) => {
			if (node.tag === 'table' && node.attributes?.id === id) tables.push(node);
			for (const child of node.children ?? []) walk(child);
		};
		for (const rootNode of gameData.roots) walk(rootNode);
		assert.equal(tables.length, 1, `exactly one ${id} table`);
		return tables[0].children.filter((child) => child.tag === 'row').map((row) => row.attributes.enchant);
	};
	assert.deepEqual(tableRows('unstableEnchants'), [
		'blazing', 'blocking', 'blooming', 'chilling', 'kinetic', 'corrupting', 'elastic',
		'grim', 'lucky', 'shocking', 'vampiric',
	], 'Unstable delegates to exactly Java\'s list, in Java\'s order');
	console.log('PASS item-instance separation, enhancement transfer, upgrade policy, appearance restore, missile dust pickup, and the Unstable delegate list');
} finally {
	rmSync(out, { recursive: true, force: true });
}
