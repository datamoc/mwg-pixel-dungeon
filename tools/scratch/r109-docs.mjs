import { readFileSync, writeFileSync } from 'node:fs';
const fail = (m) => { console.error('EDIT MISS: ' + m); process.exit(1); };
const A = "'";

// --- 1. coverage row 16 (spell system): append BeamingRay clause ---
{
  const p = 'coverage/rows-hero-and-armor-abilities.md';
  const t = readFileSync(p, 'utf8');
  const oldTail = 'the overlay renders visibly via a forced-render pixel check. |';
  if (!t.includes(oldTail)) fail('row16 tail');
  const clause = 'the overlay renders visibly via a forced-render pixel check.'
    + ' **Ported (R109, 2026-09-30):** `BeamingRay` (tier-4 talent spell, `resolveBeamingRay`):'
    + ' cost 1, teleport range `4xrank` (halved for IMMOVABLE allies), nearest-free-visible-neighbour'
    + ' fallback, `SunRay` beam plus the `zap` cue, teleport appear with the shared'
    + ' teleported-destination handling, enemy acquisition (cell occupant else nearest hostile'
    + ' within 4), hunt orders (standing order for ghost/hawk/light/shadow, `lastSeen` aggro'
    + ' otherwise), the 10-turn `BeamingRayBoost` carrying the target id (persisted as'
    + ' `beamingRayTarget` for the damage variant), Priest illuminate, and the `1.3+0.05xrank`'
    + ' pre-DR attack variant. Simplifications stated in code: `passable` for Java' + A + 's'
    + ' `solid[]`, chebyshev for `trueDistance`, no sprite.zap, no Ballistica pathing on aim.'
    + ' Not ported: the Stasis-ally arm (needs the Stasis spell) with its LifeLink prolong;'
    + ' hunt orders reset on load like every other directAlly order. Pinned by two'
    + ' `verifyClericSpells` checks and the R105 `verifyCombat` extension; live-verified'
    + ' (scripted cast teleports, boosts, spends charge plus turn; boosted roll ratio ~1.15). |';
  writeFileSync(p, t.replace(oldTail, clause));
  console.log('coverage row updated');
}

// --- 2. ROADMAP R109 flip ---
{
  const p = 'ROADMAP.md';
  const t = readFileSync(p, 'utf8');
  const marker = '- [ ] **R109** _(Cleric `BeamingRay` spell incl. its `PowerBuff` boost variant)_';
  const s = t.indexOf(marker);
  if (s < 0) fail('r109 open');
  const e = t.indexOf('\n', s);
  const closed = '- [x] **R109** _(Cleric `BeamingRay` spell incl. its `PowerBuff` boost variant)_ **Closed 2026-09-30:** cast, teleport, boost, and the `1.3+0.05xrank` attack variant ported (`resolveBeamingRay`, row-16 clause, two `verifyClericSpells` pins plus the R105 `verifyCombat` extension). Still open: the Stasis-ally arm, which needs the unported Stasis spell.';
  const out = t.slice(0, s) + closed + t.slice(e);
  writeFileSync(p, out);
  console.log('roadmap flipped');
}

// --- 3. PORT_COVERAGE_I18N.md: picker-label row at table end ---
{
  const p = 'PORT_COVERAGE_I18N.md';
  const t = readFileSync(p, 'utf8');
  const E = '\r\n';
  const anchor = '| Right-to-left layout | `Catalog.direction`, set per language |';
  if (!t.includes(anchor)) fail('i18n table');
  const rowStart = t.indexOf(anchor);
  const rowEnd = t.indexOf(E, rowStart);
  const row = [
    '| Cleric BeamingRay picker labels | `port.spell.beamingray.name`/`short_desc` in `portStrings.ts` | **Ported 2026-09-30 (R109):** English hand-written; every other locale falls back to English through `PORT_CLERIC_ARMOR_FALLBACK` (the Flash Ascended-trio precedent). The boost buff itself reuses SPD' + A + 's own translated `beamingray$beamingrayboost` strings, so it needs no port key. |',
  ].join(E);
  const out = t.slice(0, rowEnd) + E + row + t.slice(rowEnd);
  writeFileSync(p, out);
  console.log('i18n row added');
}
