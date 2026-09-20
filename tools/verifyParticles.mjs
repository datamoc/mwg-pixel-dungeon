import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

// Called by verifySimulation.mjs. dungeonScene.ts cannot load in this harness
// (Pixi), so the death-burst table pins its Java counts behaviorally against
// the real compiled module, while the two scene wirings (shared kill path,
// ward zap) pin at source level the way verifyShakes does. The full 17-site
// Java emitter audit lives in simulation/deathBursts.ts's header and in
// PORT_COVERAGE.md's sprite row.
export function verifyParticles(require, check) {
	check('death bursts carry Java\u2019s counts, colors and samples', () => {
		const { deathBurstsFor, wardZapBursts } = require('./simulation/deathBursts');
		const dm300 = deathBurstsFor('dm300', undefined);
		assert.equal(dm300.length, 1);
		assert.equal(dm300[0].count, 100);
		assert.equal(dm300[0].tint, 0xee7722);
		assert.equal(dm300[0].sound, 'blast');
		const pylon = deathBurstsFor('pylon', undefined);
		assert.equal(pylon.length, 1);
		assert.equal(pylon[0].count, 20);
		assert.equal(pylon[0].tint, 0xee7722);
		assert.equal(pylon[0].sound, 'blast');
		const guard = deathBurstsFor('guard', undefined);
		assert.equal(guard.length, 1);
		assert.equal(guard[0].count, 4);
		const succubus = deathBurstsFor('succubus', undefined);
		assert.deepEqual(succubus.map((spec) => spec.count), [6, 8]);
		//Both ghost roles share GhostSprite, so both burst identically.
		for (const specs of [deathBurstsFor('ghost', undefined), deathBurstsFor('skeleton', 'ghost')]) {
			assert.deepEqual(specs.map((spec) => spec.count), [4, 3]);
			assert.equal(specs[0].life, 1.2);
		}
		const ward = deathBurstsFor('statue', 'ward');
		assert.equal(ward.length, 1);
		assert.equal(ward[0].count, 10);
		assert.equal(ward[0].tint, 0x88ccff);
		const zap = wardZapBursts();
		assert.equal(zap.length, 1);
		assert.equal(zap[0].count, 2);
		assert.equal(zap[0].sound, 'ray');
		//Kinds with no Java burst stay silent.
		assert.deepEqual(deathBurstsFor('rat', undefined), []);
		assert.deepEqual(deathBurstsFor('hero', undefined), []);
	});
	check('death bursts stay wired to the shared kill path and the ward zap', () => {
		const source = readSceneSource();
		assert.ok(source.includes('this.playDeathBursts(deathBurstsFor(creature.kind, creature.allyKind), creature.x, creature.y);'),
			'the shared kill path must keep firing the death-burst table');
		assert.ok(source.includes('this.playDeathBursts(wardZapBursts(), ward.x, ward.y);'),
			'the ward zap must keep firing its burst');
	});
}
