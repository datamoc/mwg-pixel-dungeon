import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const helperPath = new URL('../src/simulation/bossChallenge.ts', import.meta.url);
const helperSource = readFileSync(helperPath, 'utf8');
const compiled = ts.transpileModule(helperSource, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports });
const { weaponHitDisqualifiesDwarfKingChallenge } = module.exports;

assert.equal(weaponHitDisqualifiesDwarfKingChallenge('king', 'melee', 'longSword', false), true);
assert.equal(weaponHitDisqualifiesDwarfKingChallenge('king', 'throw', 'startingWeapon', false), true);
assert.equal(weaponHitDisqualifiesDwarfKingChallenge('king', 'shoot', 'startingWeapon', false), true);
assert.equal(weaponHitDisqualifiesDwarfKingChallenge('king', 'melee', 'startingWeapon', true), true);
assert.equal(weaponHitDisqualifiesDwarfKingChallenge('king', 'melee', 'startingWeapon', false), false);
assert.equal(weaponHitDisqualifiesDwarfKingChallenge('goo', 'melee', 'longSword', false), false);
assert.equal(weaponHitDisqualifiesDwarfKingChallenge('tengu', 'shoot', 'spiritBow', false), false);

const resolution = readFileSync(new URL('../src/scenes/dungeon/combatResolution.ts', import.meta.url), 'utf8');
const aim = readFileSync(new URL('../src/scenes/dungeon/turnLoopAiming.ts', import.meta.url), 'utf8');
const hitGate = resolution.indexOf('if (!attackRoll.hit)');
const kingCheck = resolution.indexOf('weaponHitDisqualifiesDwarfKingChallenge(defender.kind');
assert.ok(hitGate >= 0 && kingCheck > hitGate, 'Dwarf King weapon challenge runs only after an attack lands');
assert.ok(resolution.includes('this.disqualifyBossChallenge(defender)'), 'melee and throw damage clear the shared challenge flag');
const bowCheck = aim.indexOf("weaponHitDisqualifiesDwarfKingChallenge(target.kind, 'shoot'");
const bowDamage = aim.indexOf('this.applyCharacterDamage(target, damage, { pierceArmor: true, cause: \'foe\', magical: false });', bowCheck);
assert.ok(bowCheck >= 0 && bowDamage > bowCheck, 'Spirit Bow challenge runs on its landed-hit path before damage dispatch');

console.log('verifyBossChallenge: passed 10 assertions');
