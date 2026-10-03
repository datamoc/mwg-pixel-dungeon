import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Scratch replica of the committed R105 pin in tools/verifyCombat.mjs
// (full suite is red on a pre-existing R106 buff-scenarios fixture miss,
// so the pin is exercised standalone here).
const attack = readFileSync(new URL('../../src/scenes/dungeon/combatResolution.ts', import.meta.url), 'utf8');
const blastSource = readFileSync(new URL('../../src/scenes/dungeon/panelsSingleUse.ts', import.meta.url), 'utf8');
const seam = readFileSync(new URL('../../src/scenes/dungeon/attackSeams.ts', import.meta.url), 'utf8');

assert.match(attack, /const powerAllyMult = attacker\.isAlly && attacker\.buffs\['powerOfMany'\] !== undefined[\s\S]*?\? POWER_OF_MANY_ATTACK_FACTOR : 1;[\s\S]*?damageMultiplier \* powerAllyMult/,
  'a powered ally folds 1.25x into the roll multiplier, ahead of armor');
assert.doesNotMatch(attack, /Math\.round\(damage \* POWER_OF_MANY_ATTACK_FACTOR\)/,
  'no post-armor ally multiplier may remain on the attack() tail');
assert.doesNotMatch(seam, /POWER_OF_MANY_ATTACK_FACTOR/,
  'no second ally copy may live on the T61 seam tail (it would double-apply once wired)');
assert.match(blastSource, /auraProtectedDamage\(c, damage\)[\s\S]*?c\.buffs\['powerOfMany'\] !== undefined[\s\S]*?powerOfManyDamageFactor\(this\.talentRank\('life_link'\)\)[\s\S]*?doomDamage\(damage, c\)/,
  'shared dispatch reduces powered defenders between Aura and Doom');
console.log('R105 pin standalone: PASS');
