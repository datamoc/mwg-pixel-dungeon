import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(fileURLToPath(new URL('../src/simulation/hiddenMimicContact.ts', import.meta.url)), 'utf8');
const compiled = ts.transpileModule(source, {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { planHiddenMimicContact } = loaded.exports;

const base = { kind: 'mimic', mimicRevealed: false, attackerIsHero: true, adjacent: true, invisible: false, timeStopped: false, depth: 3 };
assert.deepEqual(planHiddenMimicContact(base), {
	reveal: 'chest', revealWhen: 'beforeAttack', counterattack: true, cancelHeroAttack: true, counterDamage: 8,
}, 'visible melee bump reveals, loses the swing, and takes the hidden Mimic hit');
const invisibleBump = planHiddenMimicContact({ ...base, invisible: true });
assert.equal(invisibleBump.counterattack, false, 'invisible melee reveal does not counterattack');
assert.equal(invisibleBump.cancelHeroAttack, true, 'invisible bump still consumes the hero swing');
const stoppedBump = planHiddenMimicContact({ ...base, timeStopped: true });
assert.equal(stoppedBump.counterattack, false, 'time-stopped melee reveal does not counterattack');
assert.equal(stoppedBump.cancelHeroAttack, true, 'time-stopped bump still consumes the hero swing');
assert.deepEqual(planHiddenMimicContact({ ...base, attackMode: 'throw' }), {
	reveal: 'chest', revealWhen: 'onHit', counterattack: false, cancelHeroAttack: false, counterDamage: 0,
}, 'thrown hit reveals and continues');
const reachAttack = planHiddenMimicContact({ ...base, adjacent: false });
assert.equal(reachAttack.revealWhen, 'onHit', 'a melee reach attack at distance is not an interaction bump');
assert.equal(reachAttack.cancelHeroAttack, false, 'a melee reach attack is not canceled');
const monsterHit = planHiddenMimicContact({ ...base, attackerIsHero: false });
assert.equal(monsterHit.revealWhen, 'onHit', 'monster hit reveals after a successful hit');
assert.equal(monsterHit.cancelHeroAttack, false, 'monster hit continues');
assert.deepEqual(planHiddenMimicContact({ ...base, kind: 'crystalMimic' }), {
   reveal: 'crystal', revealWhen: 'beforeAttack', counterattack: true, cancelHeroAttack: true, counterDamage: 8,
}, 'visible melee bump on a Crystal Mimic counters and cancels the hero swing too');
assert.equal(planHiddenMimicContact({ ...base, kind: 'crystalMimic', attackMode: 'throw' }).revealWhen, 'onHit', 'Crystal Mimic ranged reveal waits for a hit');
assert.equal(planHiddenMimicContact({ ...base, mimicRevealed: true }).reveal, 'none', 'revealed Mimic has no bump branch');
assert.equal(planHiddenMimicContact({ ...base, mimicRevealed: undefined }).reveal, 'none', 'unset chest-Mimic state is not treated as hidden');

const sceneSource = readFileSync(fileURLToPath(new URL('../src/scenes/dungeon/combatResolution.ts', import.meta.url)), 'utf8');
const onHitReveal = sceneSource.indexOf("mimicContact.revealWhen === 'onHit'");
const missBranch = sceneSource.indexOf('if (!attackRoll.hit)');
assert.ok(onHitReveal > missBranch, 'non-interaction Mimics reveal only after a successful hit');
console.log('15 hidden-Mimic contact checks passed.');
