import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };

// --- src/simulation/buffs.ts (LF) ---
{
  const p = 'src/simulation/buffs.ts';
  const t = readFileSync(p, 'utf8');
  const oldTail = "'burningActed' | 'oozeActed';";
  if (!t.includes(oldTail)) fail('buffid tail');
  writeFileSync(p, t.replace(oldTail, "'burningActed' | 'oozeActed' | 'beamingRayBoost';"));
  console.log('buffs.ts updated');
}

// --- src/content/buff-rules.mwl (CRLF) ---
{
  const p = 'src/content/buff-rules.mwl';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  const anchor = [
    '            // Hidden saved state for Java Ooze.acted (`Ooze.java`, tag `v3.3.8`).',
    '            tag: "row",',
    '            buff: "oozeActed",',
    '            duration: 9999,',
    '          },',
  ].join(E);
  if (!t.includes(anchor)) fail('mwl anchor');
  const add = [
    '          {',
    '            // `BeamingRay.BeamingRayBoost.DURATION`: the 10-turn empowered-ally',
    '            // window (`FlavourBuff`, so the generic countdown/fade covers it; the',
    '            // target id rides `Creature.beamingRayTarget`, saved alongside).',
    '            tag: "row",',
    '            buff: "beamingRayBoost",',
    '            duration: 10,',
    '          },',
  ].join(E);
  writeFileSync(p, t.replace(anchor, anchor + E + add));
  console.log('buff-rules.mwl updated');
}

// --- src/combat.ts (CRLF): Creature.beamingRayTarget after shieldOfLightTarget ---
{
  const p = 'src/combat.ts';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  const anchor = '\tshieldOfLightTarget?: string;';
  if (!t.includes(anchor)) fail('creature anchor');
  const add = [
    '\t/**',
    '\t * `BeamingRay.BeamingRayBoost.object` (`actors/hero/spells/BeamingRay.java`,',
    '\t * tag `v3.3.8`): the enemy id the boosted ally answers to. Java keeps it on',
    '\t * the buff; this port\'s buff map holds durations only, so it lives here with',
    '\t * the other per-creature payloads. Meaningful only while',
    '\t * `buffs[\'beamingRayBoost\']` is up.',
    '\t */',
    '\tbeamingRayTarget?: string;',
  ].join(E);
  writeFileSync(p, t.replace(anchor, anchor + E + add));
  console.log('combat.ts updated');
}
