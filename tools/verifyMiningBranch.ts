import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { miningBranchFloor } from '../src/spdLevelGen/gameBridge';
import { Terrain } from '../src/spdLevelGen/paintLevel';

/**
 * `MiningLevel` (tag `v3.3.8`, `src/spdLevelGen/miningLevel.ts` + `rooms/quest/mineRooms.ts`):
 * structural pins over several seeds and both quest types - Java's room roster, the 45-47 gold
 * budget (veins plus the Gnoll secret caches), one boss plus three large-room camps, the quest
 * terrains, no chasms, determinism - and the scene-side quest flow shape.
 */
const seeds = [1n, 7n, 42n, 123456789n, 999999999999n];
const CRYSTAL = 1, GNOLL = 2;

for (const seed of seeds) for (const type of [CRYSTAL, GNOLL] as const) {
	const floor = miningBranchFloor(seed, 13, type);
	const again = miningBranchFloor(seed, 13, type);
	const label = `seed ${seed} type ${type}`;
	assert.deepEqual([...floor.paint.map], [...again.paint.map], `${label}: generation is not deterministic`);
	const kinds = floor.rooms.map((r) => r.label);
	assert.equal(kinds.filter((k) => k === 'standard:mineEntrance').length, 1, `${label}: one MineEntrance`);
	assert.equal(kinds.filter((k) => k === 'standard:mineGiant').length, 1, `${label}: one MineGiantRoom`);
	assert.equal(kinds.filter((k) => k === 'standard:mineLarge').length, 3, `${label}: three MineLargeRooms`);
	const smalls = kinds.filter((k) => k === 'standard:mineSmall').length;
	assert.ok(smalls >= 6 && smalls <= 8, `${label}: 6-8 MineSmallRooms, got ${smalls}`);
	assert.equal(kinds.filter((k) => k === 'secret:mine').length, 2, `${label}: two MineSecretRooms`);
	assert.ok(floor.entrance, `${label}: has the mine exit`);
	assert.equal(floor.exit, null, `${label}: a branch level has no down stairs`);

	const map = [...floor.paint.map];
	assert.ok(!map.includes(Terrain.CHASM), `${label}: MiningLevelPainter removes every chasm`);
	const veins = map.filter((t) => t === Terrain.WALL_DECO).length;
	const cached = floor.groundItems.filter((g) => g.kind === 'darkGold').reduce((n, g) => n + (g.quantity ?? 0), 0);
	assert.ok(veins + cached >= 45 && veins + cached <= 47, `${label}: gold budget 45-47, got ${veins}+${cached}`);
	assert.ok(floor.groundItems.some((g) => g.kind === 'food'), `${label}: createItems drops food`);

	const mobs = floor.mobs.map((m) => m.kind);
	if (type === CRYSTAL) {
		assert.deepEqual(mobs.filter((k) => k === 'crystalSpire').length, 1, `${label}: one CrystalSpire`);
		assert.deepEqual(mobs.filter((k) => k === 'crystalGuardian').length, 3, `${label}: a guardian per large room`);
		assert.ok(map.includes(Terrain.MINE_CRYSTAL) && !map.includes(Terrain.MINE_BOULDER), `${label}: crystals only`);
		assert.equal(cached, 0, `${label}: crystal secrets hold veins, not chests`);
	} else {
		const geomancer = floor.mobs.find((m) => m.kind === 'gnollGeomancer');
		assert.equal(geomancer?.shield, 50, `${label}: the Geomancer spawns with RockArmor 50`);
		const sappers = floor.mobs.filter((m) => m.kind === 'gnollSapper');
		assert.equal(sappers.length, 3, `${label}: a sapper per large room`);
		for (const sapper of sappers) {
			assert.deepEqual(sapper.spawnPos, { x: sapper.x, y: sapper.y }, `${label}: sapper spawnPos is its cell`);
			assert.ok(floor.mobs.some((m) => m.kind === 'gnollGuard' && m.x === sapper.partnerPos?.x && m.y === sapper.partnerPos?.y), `${label}: sapper linked to its guard`);
		}
		assert.ok(map.includes(Terrain.MINE_BOULDER) && !map.includes(Terrain.MINE_CRYSTAL), `${label}: boulders only`);
		assert.ok(floor.traps.length >= 6 && floor.traps.every((t) => t.spdClass === 'gnollRockfall' && !t.hidden), `${label}: 2-3 revealed rockfall traps per large room`);
		assert.equal(floor.groundItems.filter((g) => g.kind === 'food').length, 2, `${label}: the gnoll mine drops a second food`);
		assert.ok(cached >= 8 && cached <= 10, `${label}: two 4-5 DarkGold chests`);
	}
}

//Scene flow shape (no DOM harness): completion happens on the way out, graded by carried gold.
//The npm script runs from the repository root; using cwd paths keeps esbuild from
//trying to resolve the source-inspection paths while bundling this verifier.
const scene = readFileSync('src/scenes/dungeon/npcShopBlacksmith.ts', 'utf8').replace(/\r\n/g, '\n');
const hazards = readFileSync('src/scenes/dungeon/actorTurnsHazards.ts', 'utf8').replace(/\r\n/g, '\n');
assert.match(hazards, /this\.tryLeaveMiningBranch\(\);[\s\S]{0,200}this\.tryEnterMiningBranch\(\);/, 'the ladders go through the quest gates');
assert.match(scene, /gold < 10 \? 'port\.blacksmith\.exit_warn_none' : gold < 20 \? 'port\.blacksmith\.exit_warn_low'\s*: gold < 30 \? 'port\.blacksmith\.exit_warn_med' : gold < 40 \? 'port\.blacksmith\.exit_warn_high' : 'port\.blacksmith\.exit_warn_full'/, 'exit warnings grade 10/20/30/40');
assert.match(scene, /completeBlacksmithQuest\(\);\s*this\.leaveMiningBranch\(\);/, 'confirming the exit completes the quest first');

console.log(`Mining branch checks passed (${seeds.length} seeds x 2 quest types).`);
