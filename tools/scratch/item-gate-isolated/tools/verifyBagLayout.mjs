import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// The bag window's grid geometry (`src/ui/bagLayout.ts`): the long-standing fixed
// 5-column arrangement is byte-for-byte what `InventoryWindow.draw()` always laid out,
// and large interface mode switches to `InventoryPane`'s wide 10-column shape (5
// equipped slots leading, the 20-item page after them, padded to full rows). Same house
// pattern as `verifyVault.mjs`: compile the real module - import-free arithmetic, no
// DOM, Pixi or `mwg` - into a private CommonJS tree.
const output = mkdtempSync(join(tmpdir(), 'spd-baglayout-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	const compiled = join(output, 'bagLayout.js');
	mkdirSync(dirname(compiled), { recursive: true });
	writeFileSync(compiled, ts.transpileModule(readFileSync(new URL('../src/ui/bagLayout.ts', import.meta.url), 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
	const require = createRequire(join(output, 'tests.cjs'));
	const { bagGridLayout } = require('./bagLayout.js');

	check('narrow keeps the historical fixed arrangement', () => {
		const layout = bagGridLayout(false);
		assert.equal(layout.columns, 5);
		assert.equal(layout.windowWidth, 156);
		assert.equal(layout.windowHeight, 226);
		assert.equal(layout.gridWidth, 145);
		assert.equal(layout.gridHeight, 145);
		assert.equal(layout.gridY, 55);
		assert.equal(layout.padTotal, 25);
		assert.equal(layout.footerY, 204);
	});

	check('wide mirrors InventoryPane: 10 columns, equipped leading', () => {
		const layout = bagGridLayout(true);
		assert.equal(layout.columns, 10);
		//5 equipped + one 20-item page (25 cells), padded up to full 10-wide rows
		assert.equal(layout.padTotal, 30);
		assert.equal(layout.gridWidth, 290);
		assert.equal(layout.gridHeight, 87);
		assert.equal(layout.gridY, 55);
		//footer clears the grid exactly as the narrow one does (55 + height + 4)
		assert.equal(layout.footerY, 146);
		assert.equal(layout.windowWidth, 302);
		assert.equal(layout.windowHeight, 168);
	});

	check('both modes fit 5 equipped plus a full page with no clipping', () => {
		for (const wide of [false, true]) {
			const layout = bagGridLayout(wide);
			assert.ok(layout.padTotal >= 25);
			assert.equal(layout.padTotal % layout.columns, 0);
			assert.ok(layout.footerY > layout.gridY + layout.gridHeight);
			assert.ok(layout.windowHeight > layout.footerY + 17);
			assert.ok(layout.windowWidth >= layout.gridWidth + 10);
		}
	});

	console.log(`\nAll ${passed} bag-layout checks passed.`);
} catch (error) {
	console.error(`FAIL after ${passed} passed:`, error);
	process.exit(1);
}
