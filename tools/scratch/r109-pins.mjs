// Scratch: run ONLY verifyCombat + verifyClericSpells with a tolerant check that
// continues past failures, so the pre-existing R106 burningActed fixture failure
// (fails on HEAD too) does not hide the R109 pin results. NOT committed.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { verifyCombat } from '../verifyCombat.mjs';
import { verifyClericSpells } from '../verifyClericSpells.mjs';

const output = mkdtempSync(join(tmpdir(), 'spd-r109-pins-'));
let passed = 0;
const failed = [];
function check(name, run) {
	try { run(); passed++; console.log(`PASS ${name}`); }
	catch (e) { failed.push(name); console.log(`FAIL ${name}: ${String(e).split('\n')[0]}`); }
}
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	for (const file of ['simulation/movement', 'simulation/heroTurn', 'simulation/hunger', 'simulation/turns', 'simulation/mobLoot', 'adapters/sceneSimulation',
		'adapters/hungerSimulation', 'simulation/random', 'simulation/combatState', 'simulation/mwlBuffDurations', 'simulation/mwlStatusImmunities', 'simulation/mwlMonsterImmunities', 'simulation/mwlMonsterStateStats', 'simulation/buffs', 'simulation/combat', 'simulation/entityId', 'talentEffects',
		'adapters/combatSimulation', 'adapters/mwgRandom', 'combat', 'simulation/heroActions', 'adapters/heroActionSimulation', 'adapters/heroActions',
	'simulation/search', 'adapters/searchSimulation', 'adapters/movementSimulation', 'simulation/attackResolution', 'adapters/attackSimulation', 'simulation/warriorAbilities', 'simulation/huntressAbilities', 'simulation/duelistAbilities', 'simulation/mageAbilities', 'simulation/rogueAbilities', 'simulation/ratmogrify', 'simulation/fishingSpearProc', 'talents', 'armorAbilities', 'simulation/tenguAbility', 'simulation/tenguBeam', 'simulation/gooBoss', 'simulation/ratKingBoss', 'simulation/dm300Boss', 'simulation/gnollGeomancer', 'simulation/yogBoss', 'simulation/defenderDamageCurves', 'simulation/preparation', 'simulation/disintegration', 'items/wands', 'items/missiles', 'mechanics/cone', 'dungeonConstants',
	'simulation/javaBlob', 'simulation/prismaticWandLight', 'simulation/swarmIntelligence', 'simulation/crystalSpire', 'simulation/fireSpread', 'simulation/environmentalBlobs', 'simulation/wraith', 'simulation/plantPools', 'simulation/plantDrops', 'simulation/plantTriggers', 'simulation/teleport', 'simulation/trapAreas', 'simulation/tenguDart', 'simulation/teleportAppear', 'simulation/timeBubble', 'simulation/targeting', 'simulation/ripperLeap', 'simulation/succubusBlink', 'simulation/prismatic', 'simulation/mirrorImage', 'simulation/sentryTurn', 'simulation/brews', 'simulation/levelPopulation', 'simulation/smoke', 'simulation/deathBursts', 'simulation/pourAuras', 'simulation/skeletonExplosion', 'simulation/vertigo', 'simulation/ringKnow', 'simulation/actorCollision', 'simulation/wandering', 'simulation/zoomStep', 'simulation/chasmJump', 'simulation/spareWands', 'simulation/clericSpells', 'simulation/shockArc', 'simulation/geyserTrap', 'simulation/cursedWand', 'ui/buffOverlays', 'settings',
	'monsters', 'challenges', 'i18n/index', 'i18n/portStrings', 'i18n/portMineStrings', 'i18n/languages', 'i18n/spdKeys', 'generated/spdMessages', 'items/artifacts', 'actors/monsterSpawn',
	'generated/mwlContent', 'mwlContent', 'items/ringModifiers',
	'adapters/gameSimulation']) {
		compile(new URL(`../../src/${file}.ts`, import.meta.url), `${file}.js`);
	}
	compile(new URL('../../src/simulation/highGrass.ts', import.meta.url), 'simulation/highGrass.js');
	const dist = fileURLToPath(new URL('../../node_modules/mwg/dist/', import.meta.url));
	function shim(destination, source) {
		const file = join(output, destination);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, `module.exports = require(${JSON.stringify(source)});\n`);
	}
	shim('scheduler.js', join(dist, 'roguelike', 'Scheduler.js'));
	shim('random.js', join(dist, 'core', 'Random.js'));
	shim(join('node_modules', 'mwg', 'roguelike', 'Scheduler.js'), join(dist, 'roguelike', 'Scheduler.js'));
	shim(join('node_modules', 'mwg', 'core', 'Random.js'), join(dist, 'core', 'Random.js'));
	shim(join('node_modules', 'mwg', 'simulation', 'index.js'), join(dist, 'simulation', 'index.js'));
	shim(join('node_modules', 'mwg', 'mwl', 'index.js'), join(dist, 'mwl', 'index.js'));
	mkdirSync(join(output, 'node_modules', 'mwg'), { recursive: true });
	writeFileSync(join(output, 'node_modules', 'mwg', 'index.js'),
		`const random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))}); exports.Random = random; exports.Generator = random.Generator; exports.I18n = require(${JSON.stringify(join(dist, 'i18n', 'index.js'))}); exports.Roguelike = require(${JSON.stringify(join(dist, 'roguelike', 'index.js'))});\n`);
	const require = createRequire(join(output, 'tests.cjs'));
	verifyCombat(require, check);
	verifyClericSpells(require, check);
	console.log(`\nR109-pin run: ${passed} passed, ${failed.length} failed`);
	if (failed.length > 0) { console.log('failed:', JSON.stringify(failed, null, 1)); process.exit(1); }
} finally {
}
