// Build the HEAD+mine blobs for the T63 armor-abilities remainder commit.
// - tools/verifyArmorAbilities.mjs: peer is one line dirty at 386, so the commit blob is
//   HEAD + my pin (pin bytes extracted from the worktree so they cannot diverge).
// - coverage/rows-hero-and-armor-abilities.md and ROADMAP.md: peer-dirty (rows M, ROADMAP MM),
//   so both are HEAD + my textual edit only; the worktree files stay untouched (peer-owned).
// Proves for each: tmp vs HEAD == only my lines.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const repo = 'C:/Users/miche/dev/mwg-pixel-dungeon';
const sh = (c) => execSync(c, { cwd: repo, maxBuffer: 1 << 28 });
const show = (p) => sh(`git show HEAD:${p}`).toString('utf8');
const applyOnce = (text, from, to, label) => {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: anchor occurs ${n} times (need exactly 1)`);
  return text.replace(from, to);
};

// --- 1. verifyArmorAbilities pin ---
const VA = 'tools/verifyArmorAbilities.mjs';
const worktree = readFileSync(join(repo, VA), 'utf8');
const PIN_START = "\tcheck('The WarpBeacon telefrag self-hit finishes through the shared Char.damage dispatch', () => {";
const PIN_ANCHOR = "\tcheck('CombinedLethality tests only on a weapon-changed hero melee swing, executing at `0.4*points/3`', () => {";
const s = worktree.indexOf(PIN_START);
const e = worktree.indexOf(PIN_ANCHOR, Math.max(s, 0));
if (s < 0) throw new Error('pin start not found in worktree');
if (e < 0 || e <= s) throw new Error('pin anchor not found after pin start in worktree');
const pin = worktree.slice(s, e).replace(/\r\n/g, '\n');
if (!pin.endsWith('});\n')) throw new Error('pin block does not end at a check close');
const vaBase = show(VA);
if (vaBase.includes(PIN_START)) throw new Error('HEAD already has the pin');
const vaTmp = applyOnce(vaBase, PIN_ANCHOR, pin + PIN_ANCHOR, 'verifyArmorAbilities');
writeFileSync(join(repo, 'tools/scratch/verifyarmor-dot.tmp'), vaTmp, 'utf8');

// --- 2. rows-hero-and-armor-abilities WarpBeacon row ---
const ROWS = 'coverage/rows-hero-and-armor-abilities.md';
const rowsBase = show(ROWS);
const ROW_FROM = 'so a cross-branch warp enters through `enterLevel()`. Browser verification of placement';
const ROW_TO = 'so a cross-branch warp enters through `enterLevel()`. **2026-09-29 (T63 armor-abilities remainder):** the `TELEFRAG` self-hit now finishes through the shared `applyCharacterDamage` hero branch instead of a hand-rolled absorb + HP write + floater. The branch runs those same lines plus the death booking Java has (only Doom\'s x1.67 multiply can make the clamped hit fatal, as in Java), and the call passes the `magical` flag because `WarpBeacon.class` sits in Java\'s `AntiMagic.RESISTS` so the hero\'s AntiMagic glyph `drRoll` applies; the roll stays Java\'s `Math.min(heroDmg, heroHP-1)`, measured against this port\'s `heroBarrier` pool rather than Java\'s full `shielding()` sum (the difference only shows when non-barrier pools are up and HP is low - the roll stays non-fatal either way). Browser verification of placement';
const rowsTmp = applyOnce(rowsBase, ROW_FROM, ROW_TO, 'rows WarpBeacon row');
writeFileSync(join(repo, 'tools/scratch/rows-armor.tmp'), rowsTmp, 'utf8');

// --- 3. ROADMAP R001 clause ---
const RM = 'ROADMAP.md';
const rmBase = show(RM);
const RM_FROM = 'is tracked as R097); still hand-rolled:';
const RM_TO = 'is tracked as R097); Closed 2026-09-29 (T63 armor-abilities remainder): the WarpBeacon telefrag\'s hero self-hit now finishes through the dispatch too (Java\'s own `Math.min(heroDmg, heroHP-1)` clamp kept as the roll, the `applyAbilityDamage` fade/boss-DQ prelude staying caller-side like every other seam); still hand-rolled:';
const rmTmp = applyOnce(rmBase, RM_FROM, RM_TO, 'ROADMAP R001');
writeFileSync(join(repo, 'tools/scratch/roadmap-armor.tmp'), rmTmp, 'utf8');

// --- prove: tmp vs HEAD shows only my lines ---
const d = mkdtempSync(join(tmpdir(), 'armor-'));
const base = {};
for (const [p, tmp] of [[VA, 'tools/scratch/verifyarmor-dot.tmp'], [ROWS, 'tools/scratch/rows-armor.tmp'], [RM, 'tools/scratch/roadmap-armor.tmp']]) {
  const f = join(d, p.replace(/[\\/]/g, '_'));
  writeFileSync(f, show(p), 'utf8');
  let out = '';
  try {
    sh(`git diff --no-index --numstat "${f}" "${join(repo, tmp).replace(/\\/g, '/')}"`);
  } catch (err) {
    out = (err.stdout || '').toString('utf8').trim();
  }
  base[p] = out;
}
rmSync(d, { recursive: true, force: true });
console.log('tmp vs HEAD numstats (only my lines expected):');
for (const k in base) console.log(`  ${k}: ${base[k]}`);
console.log('OK: tmps written');
