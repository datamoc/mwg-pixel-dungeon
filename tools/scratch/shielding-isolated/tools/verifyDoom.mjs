import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

// Pins `Doom` (`actors/buffs/Doom.java`, tag `v3.3.8`): a permanent, +67%-damage-taken marker
// (the multiplier itself is pinned in `verifyCombatRolls.mjs`, alongside Vulnerable). This file
// pins the scene wiring: `WandOfCorruption`'s corruption-immune fallback now actually attaches
// it, and re-zapping an already-doomed target is read from the real buff instead of a stub.
const scene = readSceneSource();
const check = (name, fn) => { fn(); console.log(`PASS ${name}`); };

check('a corruption-immune target (only PowerOfMany.LightAlly here) is doomed instead of converted', () => {
	assert.ok(scene.includes("else if (outcome.kind === 'doom') addBuff(victim, 'doom', 9999);"));
});
check('alreadyDoomed reads the real buff, not the old always-false stub', () => {
	assert.ok(scene.includes("alreadyDoomed: victim.buffs['doom'] !== undefined,"));
});

console.log('verifyDoom: OK');
