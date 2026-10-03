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
	check('pour auras carry Java\u2019s rates, visuals and gates', () => {
		const { pourAurasFor } = require('./simulation/pourAuras');
		const one = (creature) => {
			const specs = pourAurasFor(creature);
			assert.equal(specs.length, 1);
			return specs[0];
		};
		//FetidRat's stench and RotHeart's cloud pour unconditionally.
		assert.equal(one({ kind: 'fetidRat' }).rate, 1 / 0.7);
		assert.equal(one({ kind: 'fetidRat' }).tint, 0x003300);
		assert.equal(one({ kind: 'rotHeart' }).rate, 1 / 0.7);
		assert.equal(one({ kind: 'rotHeart' }).tint, 0x50ff60);
		//Elemental subtypes pour their own particle at 1/0.06.
		assert.equal(one({ kind: 'elemental', elementalType: 'fire' }).tint, 0xee7722);
		assert.equal(one({ kind: 'elemental', elementalType: 'frost' }).tint, 0x88ccff);
		assert.equal(one({ kind: 'elemental', elementalType: 'shock' }).life[0], 0.25);
		assert.equal(one({ kind: 'elemental', elementalType: 'chaos' }).rate, 40);
		assert.equal(one({ kind: 'newbornElemental' }).tint, 0x22ee66);
		//Fist types pour theirs (rotting is the slow 1/0.25 toxic drip).
		assert.equal(one({ kind: 'yogFist', yogFistType: 'burning' }).tint, 0xee7722);
		assert.equal(one({ kind: 'yogFist', yogFistType: 'rotting' }).rate, 4);
		assert.equal(one({ kind: 'yogFist', yogFistType: 'dark' }).tint, 0x440044);
		//Gated auras: DM300 sparks while supercharged, Eye charge while the
		//beam is charged, Goo spray while bloodied (HP*2 <= maxHp).
		assert.equal(one({ kind: 'dm300', dmSupercharged: true }).rate, 20);
		assert.deepEqual(pourAurasFor({ kind: 'dm300' }), []);
		assert.equal(one({ kind: 'eye', beamCharged: true }).rate, 20);
		assert.deepEqual(pourAurasFor({ kind: 'eye' }), []);
		assert.equal(one({ kind: 'goo', hp: 10, maxHp: 20 }).tint, 0x000000);
		assert.deepEqual(pourAurasFor({ kind: 'goo', hp: 11, maxHp: 20 }), []);
		//Sites with no representable trigger stay silent: the lotus and the
		//necromancer/spectral summonings pour at remote cells off unported
		//state, the golem pours while teleporting (no such state here), and
		//the phantom piranha has no kind at all.
		assert.deepEqual(pourAurasFor({ kind: 'ward', allyKind: 'lotus' }), []);
		assert.deepEqual(pourAurasFor({ kind: 'necromancer' }), []);
		assert.deepEqual(pourAurasFor({ kind: 'spectralNecromancer' }), []);
		assert.deepEqual(pourAurasFor({ kind: 'golem' }), []);
		assert.deepEqual(pourAurasFor({ kind: 'rat' }), []);
	});
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
