import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// R041: hero-select game options (custom seed, daily), chevron UI hider, splash
// edge fades (`HeroSelectScene.java`, tag `v3.3.8`). Pure seed/date math runs
// through the compiled modules; scene wiring is pinned at source level.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = fileURLToPath(new URL('../node_modules/mwg/dist/', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'spd-heroselect-'));
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
	compile(join(root, 'src/spdLevelGen/mwlDungeonRules.ts'), 'spdLevelGen/mwlDungeonRules.js');
	compile(join(root, 'src/genericDungeon.ts'), 'genericDungeon.js');
	mkdirSync(join(out, 'node_modules/mwg'), { recursive: true });
	writeFileSync(join(out, 'node_modules/mwg/index.js'),
		`exports.Actors = require(${JSON.stringify(join(dist, 'actors', 'index.js'))}); exports.Random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))}); exports.Roguelike = require(${JSON.stringify(join(dist, 'roguelike', 'index.js'))});\n`);
	shim(join('node_modules', 'mwg', 'core', 'index.js'), join(dist, 'core', 'index.js'));
	shim(join('node_modules', 'mwg', 'mwl', 'index.js'), join(dist, 'mwl', 'index.js'));

	const check = (name, fn) => { fn(); console.log(`PASS ${name}`); };
	const require = createRequire(join(out, 'check.cjs'));
	const { seedTextValue, formatSeedText, dailySeedDay, dailySeedValue, dailySeedLabel, SEED_TOTAL, DAY_MS, DAILY_EPOCH_DAYS } = require(join(out, 'genericDungeon.js'));

	check('seed text parses codes, numbers and names, empty clears', () => {
		assert.equal(seedTextValue(''), null, 'empty input clears the custom seed');
		assert.equal(seedTextValue('AAAAAAAAA'), 0n, 'all-A code is zero');
		assert.equal(seedTextValue('abcdefghi'), seedTextValue('ABCDEFGHI'), 'codes normalize case');
		assert.equal(seedTextValue('ABC-DEF-GHI'), seedTextValue('ABCDEFGHI'), 'dashes are ignored');
		assert.equal(seedTextValue('42'), 42n, 'numbers parse directly');
		assert.ok((seedTextValue('some-fun-name') ?? -1n) >= 0n, 'arbitrary text hashes to a seed');
	});
	check('seed text formats to XXX-XXX-XXX codes', () => {
		assert.equal(formatSeedText('ABCDEFGHI'), 'ABC-DEF-GHI');
		assert.equal(formatSeedText('abc-def-ghi'), 'ABC-DEF-GHI', 'lowercase formats too');
		assert.equal(formatSeedText('hello'), 'hello', 'non-codes come back unchanged');
		assert.equal(formatSeedText('42'), '42', 'numbers are not codes');
	});
	check('daily runs floor to UTC days past the 2025 epoch', () => {
		assert.equal(DAILY_EPOCH_DAYS, 20148);
		assert.equal(dailySeedDay(0), 20148, 'pre-epoch clamps to the epoch');
		assert.equal(dailySeedDay(DAILY_EPOCH_DAYS * DAY_MS + 1), DAILY_EPOCH_DAYS);
		assert.equal(dailySeedValue(DAILY_EPOCH_DAYS * DAY_MS), BigInt(DAILY_EPOCH_DAYS) * BigInt(DAY_MS) + SEED_TOTAL,
			'the daily seed sits out of user-seed range');
		assert.equal(dailySeedLabel(Date.UTC(2026, 4, 17, 12)), '2026-05-17', 'the label is the UTC date');
	});

	check('chevron, options pane, seed overlay and edge fades are wired', () => {
		const scene = readFileSync(join(root, 'src/scenes/classSelectScene.ts'), 'utf8');
		assert.ok(scene.includes("chevronHolder.rotation = -Math.PI / 2;"),
			'the chevron art rotates to Java 270-degree angle');
		assert.ok(scene.includes('chevron.visible = landscape && this.selected !== null;'),
			'the chevron shows only in landscape once a class is selected');
		assert.ok(scene.includes("optionsPane.visible = !optionsPane.visible;"),
			'the options button toggles the pane');
		assert.ok(scene.includes("document.getElementById('spd-seed-overlay')?.remove();"),
			'the seed overlay tears down');
		assert.ok(scene.includes("setCustomSeed(seedTextValue(formatted) === null ? '' : formatted);"),
			'set persists the formatted seed, empty clears');
		assert.ok(scene.includes('runState.pendingDaily = true;'),
			'the daily confirm arms a date-seeded run');
		assert.ok(scene.includes('fadeLeft.visible = background.x > 0 || (uiAlpha > 0 && isLandscape);'),
			'the splash edge fades follow Java visibility rules');
		assert.ok(scene.includes('this.uiTick(dt);'),
			'the fade tween, idle fade and daily countdown tick per frame');
		const icons = readFileSync(join(root, 'src/ui/titleIcons.ts'), 'utf8');
		assert.ok(icons.includes('seed: [208, 32, 15, 10],') && icons.includes('calendar: [240, 16, 15, 12],'),
			'the seed/calendar rows use template-matched sheet regions');
		const dungeon = readFileSync(join(root, 'src/scenes/dungeonScene.ts'), 'utf8');
		assert.ok(dungeon.includes('const panelSeed = daily && dailyMs > 0 ? BigInt(dailyMs) + SEED_TOTAL : seedTextValue(customText);'),
			'run start prefers the daily date, then the custom text, then the URL seed');
	});
} finally {
}
console.log('verifyHeroSelect: ok (seed math, daily math, class-select wiring)');
