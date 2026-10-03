import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };

// --- src/simulation/clericSpells.ts ---
{
  const p = 'src/simulation/clericSpells.ts';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  // 1. TalentSpellId gains the tier-4 talent spell, in getSpellList order.
  const oldUnion = "export type TalentSpellId = 'holyIntuition' | 'shieldOfLight' | 'recallInscription' | 'sunray' | 'divineSense' | 'bless' | 'cleanse';";
  const newUnion = "export type TalentSpellId = 'holyIntuition' | 'shieldOfLight' | 'recallInscription' | 'sunray' | 'divineSense' | 'bless' | 'cleanse' | 'beamingRay';";
  if (!t.includes(oldUnion)) fail('spell union');
  const oldDoc = ' * pair (HolyIntuition, ShieldOfLight) then the tier-2 row (RecallInscription,';
  if (!t.includes(oldDoc)) fail('union doc');
  let out = t.replace(oldUnion, newUnion);
  // 2. BeamingRay numbers after the Flash block.
  const anchor = [
    'export function flashRange(talentRank: number): number {',
    '\treturn 2 + Math.max(0, talentRank);',
    '}',
  ].join(E);
  if (!out.includes(anchor)) fail('flash anchor');
  const add = [
    '',
    '/**',
    ' * `BeamingRay` (`actors/hero/spells/BeamingRay.java`, tag `v3.3.8`): the `ClericSpell`',
    ' * default cost 1 (no `chargeUse()` override); the ally teleport range `4*points`',
    ' * (halved for IMMOVABLE allies); the powered-ally attack factor `1.3+0.05*points`',
    ' * that replaces the plain 1.25x when the boost target is the victim; the 10-turn',
    ' * `BeamingRayBoost` window carrying the target id.',
    ' */',
    'export const BEAMING_RAY_COST = 1;',
    'export const BEAMING_RAY_BOOST_TURNS = 10;',
    'export function beamingRayRange(talentRank: number): number {',
    '\treturn 4 * Math.max(0, talentRank);',
    '}',
    'export function beamingRayBoostFactor(talentRank: number): number {',
    '\treturn 1.3 + 0.05 * Math.max(0, talentRank);',
    '}',
  ].join(E);
  out = out.replace(anchor, anchor + E + add);
  writeFileSync(p, out);
  console.log('clericSpells.ts updated');
}
