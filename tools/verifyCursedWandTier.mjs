import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const source = new URL('../src/simulation/cursedWand.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-cursed-wand-tier-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'cursedWand.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const { CURSED_COMMON_EFFECT_IDS, CURSED_RANDOM_AREA_EFFECTS, CURSED_RARE_EFFECT_IDS, CURSED_VERY_RARE_EFFECT_IDS, pickCursedCommonEffect,
	pickCursedRandomAreaEffect, pickCursedRareEffect, pickCursedVeryRareEffect, pickCursedUncommonEffect, cursedForestFireSeeds, cursedGoldenMimicSpawnCell, pickCursedEquipmentSlot, pickCursedTier } = createRequire(import.meta.url)(join(output, 'cursedWand.cjs'));

const rolls = [];
for (let roll = 0; roll < 100; roll++) {
	const tier = pickCursedTier((bound) => {
		assert.equal(bound, 100, "the draw must retain Java's full 100-outcome weight total");
		return roll;
	});
	rolls.push(tier);
}
assert.deepEqual(rolls.slice(0, 60), Array(60).fill('common'));
assert.deepEqual(rolls.slice(60, 90), Array(30).fill('uncommon'));
assert.deepEqual(rolls.slice(90, 99), Array(9).fill('rare'));
assert.deepEqual(rolls.slice(99), ['veryRare']);
assert.match(readFileSync(new URL('../src/scenes/dungeon/hero/cursedWandCast.ts', import.meta.url), 'utf8'),
	/else if \(tier === 'rare'\)[\s\S]*?else this\.castCursedWandVeryRareEffect\(cell\);/);
console.log('PASS CursedWand keeps Java 60/30/9/1 weights and routes the VeryRare tier to its own handler.');

assert.deepEqual(CURSED_COMMON_EFFECT_IDS, ['burnAndFreeze', 'spawnRegrowth', 'randomTeleport', 'randomGas', 'randomAreaEffect', 'bubbles', 'randomWand', 'selfOoze']);
assert.equal(pickCursedCommonEffect((bound) => { assert.equal(bound, 8); return 4; }), 'randomAreaEffect');
assert.equal(pickCursedCommonEffect((bound) => { assert.equal(bound, 8); return 1; }), 'spawnRegrowth');
assert.deepEqual(CURSED_RANDOM_AREA_EFFECTS, ['burningTrap', 'chillingTrap', 'shockingTrap']);
for (let i = 0; i < 3; i++) {
	assert.equal(pickCursedRandomAreaEffect((bound) => { assert.equal(bound, 3); return i; }), CURSED_RANDOM_AREA_EFFECTS[i]);
}
const scene = readFileSync(new URL('../src/scenes/dungeon/hero/cursedWandCast.ts', import.meta.url), 'utf8');
assert.match(scene, /castCursedWandForestFire[\s\S]*?cursedForestFireSeeds[\s\S]*?this\.regrowth\.seed/);
assert.deepEqual(CURSED_RARE_EFFECT_IDS, ['sheepPolymorph', 'curseEquipment', 'interFloorTeleport', 'summonMonsters', 'fireBall', 'coneOfColors', 'massInvuln', 'petrify']);
for (let i = 0; i < CURSED_RARE_EFFECT_IDS.length; i++) {
	assert.equal(pickCursedRareEffect((bound) => { assert.equal(bound, 8); return i; }), CURSED_RARE_EFFECT_IDS[i]);
}
assert.deepEqual(CURSED_VERY_RARE_EFFECT_IDS, ['forestFire', 'spawnGoldenMimic', 'abortRetryFail', 'randomTransmogrify', 'heroShapeShift', 'superNova', 'sinkHole', 'gravityChaos']);
for (let i = 0; i < CURSED_VERY_RARE_EFFECT_IDS.length; i++) {
	assert.equal(pickCursedVeryRareEffect((bound) => { assert.equal(bound, 8); return i; }), CURSED_VERY_RARE_EFFECT_IDS[i]);
}
assert.deepEqual(cursedForestFireSeeds(2, 2), [
	{ x: 0, y: 0, volume: 15 }, { x: 1, y: 0, volume: 15 },
	{ x: 0, y: 1, volume: 15 }, { x: 1, y: 1, volume: 15 },
]);
assert.deepEqual(cursedGoldenMimicSpawnCell({ x: 4, y: 4 }, false, () => true, () => false, () => { throw new Error('empty collision cell must not draw'); }), { x: 4, y: 4 });
assert.deepEqual(cursedGoldenMimicSpawnCell({ x: 4, y: 4 }, true, () => true, (x, y) => x === 4 && y === 3, (bound) => { assert.equal(bound, 7); return bound - 1; }), { x: 3, y: 3 });
assert.equal(cursedGoldenMimicSpawnCell({ x: 4, y: 4 }, true, () => false, () => false, () => 0), undefined);
assert.match(scene, /effect === 'petrify'[\s\S]*?paralysis[\s\S]*?timeStasis/);
assert.match(scene, /effect === 'fireBall'[\s\S]*?FieldOfView[\s\S]*?fov\.update\(cell\.x, cell\.y, 3\)/);
assert.match(scene, /this\.isFireFlammableTerrain\(x, y\)\) this\.fire\.seed\(x, y, 4\)/);
const { cursedInterfloorDepthWeights } = createRequire(import.meta.url)(join(output, 'cursedWand.cjs'));
assert.deepEqual(cursedInterfloorDepthWeights(1), []);
assert.deepEqual(cursedInterfloorDepthWeights(2), [1]);
assert.deepEqual(cursedInterfloorDepthWeights(11), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.deepEqual(cursedInterfloorDepthWeights(15), [0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.equal(cursedInterfloorDepthWeights(26).length, 25);
assert.deepEqual(cursedInterfloorDepthWeights(26).slice(-10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const uncommonWithoutHerbalism = [];
for (let i = 0; i < 7; i++) {
	const picked = pickCursedUncommonEffect((bound) => { assert.equal(bound, 7); return i; }, false);
	assert.notEqual(picked, 'randomPlant', 'Java RandomPlant.valid rejects No Herbalism');
	uncommonWithoutHerbalism.push(picked);
}
assert.deepEqual(new Set(uncommonWithoutHerbalism).size, 7, 'all other uncommon cursed effects retain equal eligibility');
assert.equal(pickCursedEquipmentSlot(true, false, true, true, (bound) => { assert.equal(bound, 1); return 0; }), 'weapon');
assert.equal(pickCursedEquipmentSlot(true, true, true, true, (bound) => { assert.equal(bound, 2); return 1; }), 'armor');
assert.equal(pickCursedEquipmentSlot(false, false, true, false, (bound) => { assert.equal(bound, 1); return 0; }), 'armor');
assert.equal(pickCursedEquipmentSlot(false, false, false, false, () => { throw new Error('empty pool must not draw'); }), undefined);
assert.match(scene, /effect === 'summonMonsters'[\s\S]*?activateUtilityTrap\('summoning', cell\.x, cell\.y\)/);
assert.match(scene, /effect === 'curseEquipment'[\s\S]*?this\.weaponCursedKnown = true[\s\S]*?getWeaponCurses\(\)[\s\S]*?getArmorCurses\(\)/);
assert.match(scene, /effect === 'interFloorTeleport'[\s\S]*?Random\.weighted\(weights\)[\s\S]*?this\.enterLevel\(\)/);
assert.match(scene, /this\.depth > 1 && !this\.floorLocked\(\)[\s\S]*?this\.miningBranchActive && !this\.bag\.find\('amulet'\)/);
assert.match(scene, /Java returnPos=-1 selects the destination entrance[\s\S]*?this\.beaconArrival = null/);
console.log('PASS CursedWand Rare roster dispatches SummonMonsters and preference-picks a curseable gear slot.');
assert.match(scene, /effect === 'randomAreaEffect'/);
assert.match(scene, /pickCursedUncommonEffect\(\(bound\) => Random\.int\(bound\), !isPlantBlocked\(\)\)/,
	'RandomPlant is excluded from the eligible effect pool under No Herbalism');
assert.match(scene, /this\.fire\.seed\(x, y, 2\)/);
assert.match(scene, /this\.plantFreeze\.seed\(x, y, 10\)/);
assert.match(scene, /this\.electricity\.seed\(x, y, 10\)/);
console.log('PASS CursedWand Common RandomAreaEffect selects and seeds all three trap payloads.');
assert.match(scene, /effect === 'spawnRegrowth'[\s\S]*?this\.regrowth\.seed\(cell\.x, cell\.y, 30\)/);
const regrowth = readFileSync(new URL('../src/simulation/regrowthBlob.ts', import.meta.url), 'utf8');
assert.match(regrowth, /evolveJavaBlob/);
assert.match(regrowth, /before\[cell\]! > 9 && creature === null/);
assert.match(regrowth, /next\[cell\]! > 1 && creature && !context\.isBlobImmune\(creature\)/);
for (const [filename, sourcePath] of [
	['javaBlob.js', '../src/simulation/javaBlob.ts'],
	['regrowthBlob.js', '../src/simulation/regrowthBlob.ts'],
]) {
	writeFileSync(join(output, filename), ts.transpileModule(readFileSync(new URL(sourcePath, import.meta.url), 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
}
const { advanceRegrowth } = createRequire(import.meta.url)(join(output, 'regrowthBlob.js'));
const makeRegrowth = (terrain, creatureAt, roots) => advanceRegrowth({
	width: 5, height: 5,
	before: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	isSolid: () => false,
	terrainAt: (cell) => terrain[cell],
	setTerrain: (cell, value) => { terrain[cell] = value; },
	hasPlant: () => false,
	creatureAt,
	isBlobImmune: () => false,
	addRoots: (_creature, turns) => roots.push(turns),
	grass: 5, highGrass: 6, embers: 8, floor: 1,
});
const terrainOccupied = Array(25).fill(1);
const roots = [];
const actor = { kind: 'rat', buffs: {} };
assert.ok(makeRegrowth(terrainOccupied, (x, y) => x === 2 && y === 2 ? actor : null, roots).some((v) => v > 0));
assert.equal(terrainOccupied[12], 5);
assert.deepEqual(roots, [1]);
const terrainOpen = Array(25).fill(1);
makeRegrowth(terrainOpen, () => null, []);
assert.equal(terrainOpen[12], 6);
const floorState = readFileSync(new URL('../src/scenes/floorState.ts', import.meta.url), 'utf8');
const sceneState = readFileSync(new URL('../src/scenes/dungeon/coreSpawnTiles.ts', import.meta.url), 'utf8');
assert.match(floorState, /regrowth\?: FireState/);
assert.match(sceneState, /regrowth: this\.regrowth\.toJSON\(\)/);
assert.match(sceneState, /state\.regrowth \? Blob\.fromJSON\(state\.regrowth\)/);
assert.match(sceneState, /this\.regrowth = new Blob\(this\.level\.width, this\.level\.height\)/);
console.log('PASS CursedWand SpawnRegrowth seeds 30 and models persistent terrain growth and rooting.');
