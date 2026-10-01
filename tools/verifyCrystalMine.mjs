import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const temp = mkdtempSync(join(tmpdir(), 'spd-crystal-mine-'));
function compile(source, destination) {
	const output = join(temp, destination);
	mkdirSync(dirname(output), { recursive: true });
	writeFileSync(output, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
}

try {
	compile(fileURLToPath(new URL('../src/simulation/combatState.ts', import.meta.url)), 'simulation/combatState.js');
	compile(fileURLToPath(new URL('../src/simulation/gnollGeomancer.ts', import.meta.url)), 'simulation/gnollGeomancer.js');
	compile(fileURLToPath(new URL('../src/simulation/crystalSpire.ts', import.meta.url)), 'simulation/crystalSpire.js');
	compile(fileURLToPath(new URL('../src/simulation/pourAuras.ts', import.meta.url)), 'simulation/pourAuras.js');
	const {
		spireSpread, planSpireDiamond, planSpireLine, spikeDamage, spikeKnockCell, damagedSpireNear,
		isOpenSpace, guardianSpeed, spireAbilityDelay, spireIdleFrame, usesCrystalPassability,
		ignoresCrystalGuardianBeckon,
	} = require(join(temp, 'simulation/crystalSpire.js'));

	const allOpen = () => true;
	assert.deepEqual(spireSpread([22], 7, allOpen), [15, 21, 23, 29], 'diamond spread follows Java NEIGHBOURS4 order');
	assert.deepEqual(spireSpread([22, 23], 7, allOpen), [15, 21, 29, 16, 24, 30], 'spread does not duplicate current or already-added cells');
	assert.deepEqual(planSpireDiamond(22, 300, 300, 7, allOpen), [[22, 15, 21, 23, 29]], 'full-health diamond has one hero-centered wave');
	assert.equal(planSpireDiamond(22, 200, 300, 7, allOpen).length, 1, 'exact two-thirds HP does not add a wave');
	assert.equal(planSpireDiamond(22, 199, 300, 7, allOpen).length, 2, 'below two-thirds adds the second wave');
	assert.equal(planSpireDiamond(22, 100, 300, 7, allOpen).length, 2, 'exact one-third does not add the third wave');
	assert.equal(planSpireDiamond(22, 99, 300, 7, allOpen).length, 3, 'below one-third adds the third wave');
	assert.deepEqual(planSpireLine([22, 23, 24, 25], 300, 300, 7, (cell) => cell !== 24), [[22, 23]], 'line ends at first closed cell');
	assert.deepEqual(planSpireLine([22, 23], 99, 300, 7, allOpen).map((wave) => wave.slice(0, 2)), [[22, 23], [22, 23], [22, 23]], 'line damage waves retain the growing first wave');
	assert.equal(spikeDamage(6, false), 6, 'ordinary spike uses its rolled damage');
	assert.equal(spikeDamage(15, true), 27, 'guardian spike adds twelve damage');
	assert.equal(spikeKnockCell(24, 7, 22, () => false), 24, 'knockback stays put when all neighbours are blocked');
	assert.equal(spikeKnockCell(24, 7, 22, (cell) => cell === 31), 31, 'knockback takes the strictly farther free cell');
	assert.equal(isOpenSpace(24, 7, () => false), true, 'empty cell with an open corner fits a large mob');
	assert.equal(isOpenSpace(24, 7, (cell) => cell === 24 || cell === 23 || cell === 25 || cell === 31 || cell === 17), false, 'solid cell or all blocked corner options fail openSpace');
	assert.equal(guardianSpeed(1, true), 1, 'guardian uses base speed in open space');
	assert.equal(guardianSpeed(1, false), 0.25, 'guardian has quarter speed outside open space, with Java floor');
	assert.equal(guardianSpeed(0.6, false), 0.25, 'guardian speed floor applies to slow statuses');
	assert.equal(usesCrystalPassability('crystalWisp', 100, 1, false), true, 'wisp passes mine crystals on every path');
	assert.equal(usesCrystalPassability('crystalGuardian', 0, 8, true), true, 'hunting guardian uses crystals when plain route is unreachable');
	assert.equal(usesCrystalPassability('crystalGuardian', 17, 8, true), true, 'hunting guardian uses crystals beyond twice straight distance');
	assert.equal(usesCrystalPassability('crystalGuardian', 16, 8, true), false, 'hunting guardian keeps a plain route at exactly twice straight distance');
	assert.equal(usesCrystalPassability('crystalGuardian', 0, 8, false), false, 'wandering guardian keeps ordinary passability');
	assert.equal(usesCrystalPassability('crystalGuardian', 8, 8, true), false, 'guardian keeps a sufficiently direct plain route');
	assert.equal(usesCrystalPassability('crystalSpire', 0, 1, true), false, 'spire never uses the monster movement shortcut');
	assert.equal(ignoresCrystalGuardianBeckon('crystalGuardian', true), true, 'a sleeping guardian ignores beckon like Java');
	assert.equal(ignoresCrystalGuardianBeckon('crystalGuardian', false), false, 'an awake guardian accepts beckon');
	assert.equal(ignoresCrystalGuardianBeckon('crystalWisp', true), false, 'other sleeping mine mobs retain normal beckoning');
	assert.equal(damagedSpireNear({ x: 4, y: 4 }, [{ kind: 'crystalSpire', x: 4, y: 12, hp: 100, maxHp: 300 }]), true, 'a damaged spire at Chebyshev distance 8 keeps the guardian score-free');
	assert.equal(damagedSpireNear({ x: 4, y: 4 }, [{ kind: 'crystalSpire', x: 4, y: 13, hp: 100, maxHp: 300 }]), false, 'at distance 9 the spire is no longer fighting the hero');
	assert.equal(damagedSpireNear({ x: 4, y: 4 }, [{ kind: 'crystalSpire', x: 12, y: 12, hp: 100, maxHp: 300 }]), true, 'the distance is Chebyshev: both axes 8 still counts');
	assert.equal(damagedSpireNear({ x: 4, y: 4 }, [{ kind: 'crystalSpire', x: 5, y: 5, hp: 300, maxHp: 300 }]), false, 'an untouched spire (HP == HT) is no fight in progress');
	assert.equal(damagedSpireNear({ x: 4, y: 4 }, []), false, 'with no spire at all the penalty applies');
	assert.equal(damagedSpireNear({ x: 4, y: 4 }, [{ kind: 'hero', x: 5, y: 5, hp: 50, maxHp: 999 }]), false, 'a damaged hero beside the guardian is not a spire (Java: instanceof CrystalSpire)');
	assert.equal(damagedSpireNear({ x: 4, y: 4 }, [{ kind: 'crystalWisp', x: 5, y: 5, hp: 10, maxHp: 30 }]), false, 'a damaged wisp is not a spire either');
	assert.deepEqual([spireAbilityDelay(0), spireAbilityDelay(1.2), spireAbilityDelay(3.1)], [1, 2, 3], 'spire delay is ceil hero cooldown clamped to 1..3');
	assert.deepEqual([0.91, 0.9, 0.67, 0.33].map((hp) => spireIdleFrame(hp * 300, 300)), [0, 1, 2, 3], 'spire idle frames use strict Java HP thresholds');
	const sceneSource = readFileSync(fileURLToPath(new URL('../src/scenes/dungeon/monsters/crystalMine.ts', import.meta.url)), 'utf8');
	const dungeonSceneSource = readFileSync(fileURLToPath(new URL('../src/scenes/dungeonScene.ts', import.meta.url)), 'utf8');
	assert.match(dungeonSceneSource, /syncPourAuras\(this,\s*dt\)/, 'continuous creature auras are synchronized and advanced from the scene frame loop');
	const { pourAurasFor } = require(join(temp, 'simulation/pourAuras.js'));
	const smoke = pourAurasFor({ allyKind: 'shadowClone' })[0];
	assert.deepEqual(smoke && { rate: smoke.rate, tint: smoke.tint, life: smoke.life, speedMin: smoke.speedMin, speedMax: smoke.speedMax, size: smoke.size, grow: smoke.grow, spread: smoke.spread, angleOffset: smoke.angleOffset, fade: smoke.fade }, {
		rate: 5, tint: 0, life: 2, speedMin: 3.6055512754639896, speedMax: 7.211102550927979, size: 3, grow: [3, 6], spread: 0.76, angleOffset: 0.17, fade: 'smoke',
	}, 'ShadowClone pours the source-derived black Smoke aura');
	assert.match(sceneSource, /updateCrystalWispVisuals\(this: DungeonScene, dt: number\)/, 'scene updates the CrystalWisp visual seam');
	assert.match(sceneSource, /Math\.abs\(Math\.sin\(state\.time\)\)/, 'wisp body uses Java sine bob');
	assert.match(sceneSource, /-0\.8 \* bodyBob/, 'wisp shadow uses Java animated shadow offset');
	assert.match(sceneSource, /pulseAge \/ 0\.2/, 'wisp attack halo uses Java 0.2-second pulse');
	assert.match(sceneSource, /pulseSerial !== visual\.pulseSerial/, 'each wisp attack event restarts its halo pulse');
	assert.match(sceneSource, /triggerCrystalWispPulse\(this: DungeonScene, wisp: Creature\)/, 'wisp pulse event has an explicit scene seam');
	assert.match(sceneSource, /crystalWispZap\(this: DungeonScene, wisp: Creature\): void \{\s*this\.triggerCrystalWispPulse\(wisp\)/, 'ranged wisp zap triggers its pulse');
	const combatSource = readFileSync(fileURLToPath(new URL('../src/scenes/dungeon/combatResolution.ts', import.meta.url)), 'utf8');
	assert.match(combatSource, /attacker\.kind === 'crystalWisp'\) this\.triggerCrystalWispPulse\(attacker\)/, 'melee wisp attack triggers its pulse');
	//R056 mine quest-score seams: the guardian's pre-roll write, its hook, and the spike's hero branch.
	assert.match(sceneSource, /crystalGuardianAttackScore\(this: DungeonScene, guardian: Creature, defender: Creature\): void \{\s*if \(!defender\.isHero \|\| damagedSpireNear\(guardian, this\.creatures\)\) return;\s*addQuestScore\(this, 2, -100\)/, 'guardian attack on the hero pays [2] -= 100 unless a damaged spire lies within 8');
	assert.match(combatSource, /if \(attacker\.kind === 'crystalGuardian'\) this\.crystalGuardianAttackScore\(attacker, defender\);/, 'the guardian score hook runs in resolveAttackWithGear ahead of the roll, like Java pre-super');
	const waveBody = /\tlandSpireWave\(this: DungeonScene[^)]*\)[^{]*\{([\s\S]*?)\n\t\},/.exec(sceneSource);
	assert.ok(waveBody, 'landSpireWave is a scene seam');
	assert.match(waveBody[1] ?? '', /if \(ch\.isHero\) \{\s*(?:\/\/[^\n]*\n\s*)*addQuestScore\(this, 2, -100\)/, 'a spike on the hero pays [2] -= 100 in its damage branch');
	assert.match(sceneSource, /deathAge < 1/, 'wisp halo remains through Java one-second TorchHalo putOut fade');
	assert.match(sceneSource, /visual\.bob = 0/, 'wisp death clip stops sine bob without shifting the corpse');
	console.log('PASS crystal mine pure planners (12 helpers), wisp visual seam and quest-score seams');
} finally {
	rmSync(temp, { recursive: true, force: true });
}
