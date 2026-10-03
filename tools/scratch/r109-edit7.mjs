import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };

// --- src/ui/buffInfo.ts: boost reuses SPD's own translated strings ---
{
  const p = 'src/ui/buffInfo.ts';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  const anchor = "\tshieldOfLight: 'port.buff.shieldoflight',";
  if (!t.includes(anchor)) fail('buffinfo anchor');
  const add = '\t//`BeamingRayBoost` keeps its real bundle strings (present in every locale),'
    + E + '\t//so unlike the Cleric buffs above it needs no `port.*` carry.'
    + E + "\tbeamingRayBoost: 'actors.hero.spells.beamingray$beamingrayboost',";
  writeFileSync(p, t.replace(anchor, anchor + E + add));
  console.log('buffInfo.ts updated');
}

// --- src/i18n/portStrings.ts: picker labels (English + cleric-armor fallback) ---
{
  const p = 'src/i18n/portStrings.ts';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  const anchor = "\t'port.spell.flash.name': 'flash',";
  if (!t.includes(anchor)) fail('portstrings anchor');
  const anchor2 = "\t'port.spell.flash.short_desc': 'Teleport to an empty nearby cell.',";
  if (!t.includes(anchor2)) fail('portstrings anchor2');
  let out = t.replace(anchor, anchor + E + "\t'port.spell.beamingray.name': 'beaming ray',");
  out = out.replace(anchor2, anchor2 + E + "\t'port.spell.beamingray.short_desc': 'Teleport an empowered ally to a nearby cell.',");
  const fb = "'port.spell.flash.short_desc': PORT_STRINGS_EN['port.spell.flash.short_desc']";
  if (!out.includes(fb)) fail('fallback anchor');
  out = out.replace(fb, fb + ", 'port.spell.beamingray.name': PORT_STRINGS_EN['port.spell.beamingray.name'], 'port.spell.beamingray.short_desc': PORT_STRINGS_EN['port.spell.beamingray.short_desc']");
  writeFileSync(p, out);
  console.log('portStrings.ts updated');
}
