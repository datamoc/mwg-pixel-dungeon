import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };

// --- src/scenes/floorState.ts (CRLF): SavedCreature.beamingRayTarget ---
{
  const p = 'src/scenes/floorState.ts';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  const anchor = '\tallyMovingToDefend?: boolean;';
  if (!t.includes(anchor)) fail('saved anchor');
  const add = [
    '\t/** `BeamingRay.BeamingRayBoost.object`: the boosted ally\u2019s target enemy id',
    '\t * (null when the boost has no target, or the buff is down). */',
    '\tbeamingRayTarget?: string | null;',
  ].join(E);
  writeFileSync(p, t.replace(anchor, anchor + E + add));
  console.log('floorState.ts updated');
}

// --- src/scenes/dungeon/coreSpawnTiles.ts: save writer + restore assign ---
{
  const p = 'src/scenes/dungeon/coreSpawnTiles.ts';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  const saveAnchor = 'potHolderId: creature.potHolderId,';
  if (!t.includes(saveAnchor)) fail('save anchor');
  let out = t.replace(saveAnchor, saveAnchor + E + '\t\t\t\t\tbeamingRayTarget: creature.beamingRayTarget,');
  // Restore: find the assign-list tail anchor near allyDefendCell restore if present,
  // else attach beside potHolderId-style entries. First inspect.
  const restoreProbe = 'allyDefendCell: saved.allyDefendCell';
  if (out.includes(restoreProbe)) {
    out = out.replace(restoreProbe, restoreProbe + ',' + E + '\t\t\t\t\tbeamingRayTarget: saved.beamingRayTarget,');
    console.log('coreSpawnTiles.ts updated (save + restore)');
  } else {
    console.log('RESTORE_ANCHOR_ABSENT');
  }
  writeFileSync(p, out);
}
