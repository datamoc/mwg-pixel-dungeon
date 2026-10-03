import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };

// --- src/scenes/dungeon/hero/inventoryQuickslot.ts (CRLF) ---
{
  const p = 'src/scenes/dungeon/hero/inventoryQuickslot.ts';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  let out = t;
  // 1. Powered-ally context binding (anchor on a neighboring ctx binding).
  const bindAnchor = 'resolveFlash: (cell, instanceId) => scene.resolveFlash(cell, instanceId),';
  if (!out.includes(bindAnchor)) fail('qs resolve binding');
  out = out.replace(bindAnchor, bindAnchor + E + '\t\t\t\tresolveBeamingRay: (cell, instanceId) => scene.resolveBeamingRay(cell, instanceId),');
  // poweredAlly binding: anchor on talentRank binding.
  const talAnchor = 'talentRank: (id) => scene.talentRank(id),';
  if (!out.includes(talAnchor)) fail('qs talent binding');
  out = out.replace(talAnchor, talAnchor + E + '\t\t\t\tpoweredAlly: () => scene.poweredAlly(),');
  // 2. Picker aim gate: BeamingRay needs a cell.
  const gateAnchor = "|| spell === 'wallOfLight' || spell === 'divineIntervention' || spell === 'judgement' || spell === 'flash')";
  if (!out.includes(gateAnchor)) fail('qs gate');
  out = out.replace(gateAnchor, "|| spell === 'wallOfLight' || spell === 'divineIntervention' || spell === 'judgement' || spell === 'flash' || spell === 'beamingRay')");
  writeFileSync(p, out);
  console.log('inventoryQuickslot.ts updated');
}

// --- src/items/displayName.ts: picker name case ---
{
  const p = 'src/items/displayName.ts';
  const t = readFileSync(p, 'utf8');
  const anchor = "|| spell === 'judgement' || spell === 'flash'";
  if (!t.includes(anchor)) fail('display anchor');
  writeFileSync(p, t.replace(anchor, "|| spell === 'judgement' || spell === 'flash' || spell === 'beamingRay'"));
  console.log('displayName.ts updated');
}
