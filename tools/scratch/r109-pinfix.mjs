import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };
const p = 'tools/verifyCombat.mjs';
const t = readFileSync(p, 'utf8');
const oldRe = "\t\tassert.match(attack, /const powerAllyMult = attacker\\.isAlly && attacker\\.buffs\\['powerOfMany'\\] !== undefined[\\s\\S]*?\\? POWER_OF_MANY_ATTACK_FACTOR : 1;[\\s\\S]*?damageMultiplier \\* powerAllyMult/,";
if (!t.includes(oldRe)) fail('old fold regex');
const newRe = "\t\tassert.match(attack, /const powerAllyMult = attacker\\.isAlly && attacker\\.buffs\\['powerOfMany'\\] !== undefined[\\s\\S]*?beamingMark \\? beamingRayBoostFactor\\(this\\.talentRank\\('beaming_ray'\\)\\) : POWER_OF_MANY_ATTACK_FACTOR\\) : 1;[\\s\\S]*?damageMultiplier \\* powerAllyMult/,";
writeFileSync(p, t.replace(oldRe, newRe));
console.log('R105 pin updated for boost fold');
