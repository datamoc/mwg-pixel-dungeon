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
		//A pumped Goo pours its own cell even at full health (Java's warn set
		//includes distance 0); a bloodied pumped Goo pours spray plus warn.
		assert.deepEqual(pourAurasFor({ kind: 'goo', hp: 20, maxHp: 20, pumped: 1 }).map((spec) => spec.rate), [1 / 0.04]);
		assert.equal(pourAurasFor({ kind: 'goo', hp: 10, maxHp: 20, pumped: 2 }).length, 2);
		//A lotus ally pours leaves over its own cell at the ring's 0.5 beat.
		assert.equal(one({ kind: 'ward', allyKind: 'lotus' }).rate, 2);
		//A charging golem pours Elmo at Java's 0.05 beat while 'teleporting'
		//holds (T178 owns the flag now); silent otherwise.
		assert.equal(one({ kind: 'golem', teleporting: true }).rate, 20);
		assert.equal(one({ kind: 'golem', teleporting: true }).tint, 0x22ee66);
		//Sites with no representable trigger stay silent: the
		//necromancer/spectral summonings pour at remote cells off unported
		//state, and the phantom piranha has no kind at all.
		assert.deepEqual(pourAurasFor({ kind: 'necromancer' }), []);
		assert.deepEqual(pourAurasFor({ kind: 'spectralNecromancer' }), []);
		assert.deepEqual(pourAurasFor({ kind: 'golem' }), []);
		assert.deepEqual(pourAurasFor({ kind: 'rat' }), []);
	});
	check('goo pump-up warn cells follow Java\u2019s ring rule', () => {
		const { gooPumpWarnCells, gooWarnPourSpec } = require('./simulation/pourAuras');
		const open = () => true;
		//No charge warns nowhere; the own cell rides the creature emitter.
		assert.deepEqual(gooPumpWarnCells(5, 5, 0, open, open), []);
		assert.deepEqual(gooPumpWarnCells(5, 5, -1, open, open), []);
		//Warn distance 1 rings the eight neighbours in scan order.
		assert.deepEqual(gooPumpWarnCells(5, 5, 1, open, open), [
			{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
			{ x: 4, y: 5 }, { x: 6, y: 5 },
			{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
		]);
		//Warn distance 2 reaches the whole 5x5 ring minus the centre.
		assert.equal(gooPumpWarnCells(5, 5, 2, open, open).length, 24);
		//Unseen cells stay dry, and either blocked ray direction vetoes.
		assert.ok(!gooPumpWarnCells(5, 5, 1, (x, y) => x !== 6 || y !== 5, open).some((cell) => cell.x === 6 && cell.y === 5));
		assert.ok(!gooPumpWarnCells(5, 5, 1, open, (fromX, fromY, toX, toY) => !(fromX === 5 && toX === 6 && toY === 5)).some((cell) => cell.x === 6 && cell.y === 5));
		assert.ok(!gooPumpWarnCells(5, 5, 1, open, (fromX, fromY, toX, toY) => !(fromX === 6 && fromY === 5 && toX === 5)).some((cell) => cell.x === 6 && cell.y === 5));
		//The ring pour is the bloodied-spray spec: same factory, same 0.04 beat.
		assert.equal(gooWarnPourSpec().rate, 1 / 0.04);
		assert.equal(gooWarnPourSpec().tint, 0x000000);
	});
	check('goo pump-up presentation stays wired to the aura sync and the slam', () => {
		const bursts = readFileSync(new URL('../src/ui/effectBursts.ts', import.meta.url), 'utf8');
		assert.ok(bursts.includes('scene.gooPumpWarnCells?.(creature) ?? []'),
			'the aura sync must keep consulting the goo warn hook');
		const source = readSceneSource();
		assert.ok(source.includes('onPumpWarn: (warnDist) => {'),
			'a Goo charge must keep cueing CHARGEUP through the scene');
		assert.ok(source.includes('this.gooPumpWarnCells(goo) ?? []'),
			'an unseen primed slam must keep bursting the warn cells');
	});
	check('lotus leaf range follows Java\u2019s Euclidean ring', () => {
		const { lotusLeafCells, lotusLeafPourSpec } = require('./simulation/pourAuras');
		const open = () => true;
		//Level 0 reaches nothing remote; the own cell rides the creature emitter.
		assert.deepEqual(lotusLeafCells(5, 5, 0, open, open), []);
		//Level 1 rings the four orthogonals (diagonals are past trueDistance 1).
		assert.deepEqual(lotusLeafCells(5, 5, 1, open, open), [
			{ x: 5, y: 4 }, { x: 4, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 6 },
		]);
		//Level 2 adds the diagonals and the two-step orthogonals: twelve cells.
		assert.equal(lotusLeafCells(5, 5, 2, open, open).length, 12);
		//Closed and unseen cells stay dry.
		assert.ok(!lotusLeafCells(5, 5, 2, () => false, open).length);
		assert.ok(!lotusLeafCells(5, 5, 2, open, () => false).length);
		//The ring pour is leaves at the ring's own 0.5 beat.
		assert.equal(lotusLeafPourSpec().rate, 2);
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
