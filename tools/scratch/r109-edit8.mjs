import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };
const p = 'src/scenes/dungeon/combatResolution.ts';
const t = readFileSync(p, 'utf8');
const E = '\r\n';
let out = t;

// 1. Import the boost factor.
{
  const anchor = "import { POWER_OF_MANY_ATTACK_FACTOR, powerOfManyDamageFactor } from '../../simulation/clericSpells';";
  if (!out.includes(anchor)) fail('import');
  out = out.replace(anchor, "import { POWER_OF_MANY_ATTACK_FACTOR, beamingRayBoostFactor, powerOfManyDamageFactor } from '../../simulation/clericSpells';");
}

// 2. Whole comment + fold, rewritten with the boost variant.
{
  const anchor = [
    '\t\t//`Char.attack()` (tag `v3.3.8`): a PowerOfMany-powered ally deals 1.25x melee',
    '\t\t//damage. It folds into the roll multiplier so it lands BEFORE the armor',
    '\t\t//subtraction like Java\'s pre-`defenseProc` chain (applying it after rounded',
    '\t\t//differently whenever armor absorbed anything). Java\'s BeamingRay boost',
    '\t\t//variant (1.3x + 0.05x/rank) needs the unported BeamingRay cast/buff.',
    '\t\tconst powerAllyMult = attacker.isAlly && attacker.buffs[\'powerOfMany\'] !== undefined',
    '\t\t\t? POWER_OF_MANY_ATTACK_FACTOR : 1;',
  ].join(E);
  if (!out.includes(anchor)) fail('fold block');
  const replacement = [
    '\t\t//`Char.attack()` (tag `v3.3.8`): a PowerOfMany-powered ally deals 1.25x melee',
    '\t\t//damage - or `1.3+0.05xBEAMING_RAY` when its `BeamingRayBoost` names this',
    '\t\t//victim. Both fold into the roll multiplier so they land BEFORE the armor',
    '\t\t//subtraction like Java\'s pre-`defenseProc` chain (applying either after',
    '\t\t//rounded differently whenever armor absorbed anything).',
    '\t\tconst beamingMark = attacker.isAlly && attacker.buffs[\'powerOfMany\'] !== undefined',
    '\t\t\t&& attacker.buffs[\'beamingRayBoost\'] !== undefined',
    '\t\t\t&& attacker.beamingRayTarget !== undefined && attacker.beamingRayTarget === defender.id;',
    '\t\tconst powerAllyMult = attacker.isAlly && attacker.buffs[\'powerOfMany\'] !== undefined',
    '\t\t\t? (beamingMark ? beamingRayBoostFactor(this.talentRank(\'beaming_ray\')) : POWER_OF_MANY_ATTACK_FACTOR) : 1;',
  ].join(E);
  out = out.replace(anchor, replacement);
  writeFileSync(p, out);
  console.log('combatResolution.ts updated');
}
