# Port coverage notes: Data-driven dispatch (2026-09-09)

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## Data-driven dispatch (2026-09-09)

User-flagged code-quality pass: `main.ts` had 205 `kind === '...'`/`id === '...'` string-compare
checks total (a full-file audit, not a guess), spread across ~19 functions rather than
concentrated in one place - `takeMonsterTurn` (43) and `spawnMonster` (37) were the two
genuinely large cascades, with `kill` (26), `attack` (21), and others smaller. Converted the
two largest independently-dispatchable cascades into `Record<Kind, handler>` registries:

- `quaffPotion`'s 39-branch `if (id === ...) else if (...)` potion-effect chain -> `potionEffects`,
  one entry per generated potion id, each handler doing exactly what its old branch did (same
  Java-source comments, moved onto their own entry). The `potionPurity` fallback and any
  genuinely unrecognized id still route through `applyPotionPurity` from `quaffPotion`'s own
  `else`, now with a `console.warn` guard - this exact silent-fallthrough shape (an unmapped id
  quietly acting as Purity) is the same bug class already found and fixed twice in this
  function's history (Frost, then Toxic/Paralytic Gas).
- `takeMonsterTurn`'s 236-line, 16-case non-adjacent "ranged special ability" cascade (every
  kind that does something other than melee or generic movement once `distance >= 2`:
  DM100/Shaman/Necromancer(+SpectralNecromancer)/Tengu/DM300/Yog/Warlock/Elemental/YogFist/
  Scorpio(+Acidic)/Guard/DM200/DM201/Spinner/Golem/Eye/GnollTrickster/GreatCrab) ->
  `rangedAiOverrides`, keyed by `monster.kind`. Each handler returns `true` if it consumed the
  monster's turn (the original branch's `return`) or `false` to fall through to the shared
  movement AI below (the original branch's condition failing, or no branch existing for that
  kind at all) - a direct behavior-preserving restructure, not a rewrite. Three cases that
  shared one underlying behavior via an `||`-joined kind check in the original cascade
  (Necromancer/SpectralNecromancer, Scorpio/Acidic, DM200/DM201) now share one helper method
  (`necromancerRangedTurn`/`scorpioRangedTurn`/`dm200VentAttempt`) referenced from two registry
  keys instead - DM201 additionally always returns `true` regardless of whether its vent
  attempt (delegated to the same `dm200VentAttempt`) actually fired, matching real Java's
  `IMMOVABLE` property that DM200 itself lacks.

Both refactors are a restructuring of *dispatch shape* only (linear string-compare cascade ->
O(1) keyed lookup), not a behavior or formula change - every case was checked against its
pre-refactor code path, and the harder ones (state-machine-shaped, not simple single-branch
effects) were browser-verified live post-refactor to confirm identical values: Eye's two-turn
charge-then-fire beam (including the 1/4-damage-while-charged interaction elsewhere in the
damage pipeline), Golem's teleport-plus-20-turn-cooldown (a second immediate attempt correctly
did nothing), Guard's chain-once-ever (a second attempt on the same Guard correctly did
nothing), DM200 (movable, resumes chasing when a forced-cooldown vent roll fails) versus DM201
(always immobile regardless of the same forced-cooldown vent-miss), GreatCrab's
every-3rd-turn movement throttle (no move on turns 1-2, moves and resets its counter on turn
3), Scorpio's ranged attack, Spinner's web-root, and Necromancer's full summon -> heal ->
adrenaline chain (skeleton healed exactly HT/5, then granted the haste stand-in on the
following turn once at full health). `tsc --noEmit` and `npm run build` both clean throughout.

`spawnMonster`'s 37-branch cascade was converted too, same pass: the 7-kind stat-override
ternary chain, the 10-kind base-alias ternary chain, and a 12-case sprite-texture-reuse chain
(the messiest of the three - inconsistent indentation from having grown by one clause per pass,
itself a live example of the OR-chain smell this file's section 11 already flagged) all became
real data tables in `monsters.ts` (`DEPTH_SCALED_STATS`, `BASE_KIND_ALIASES`,
`SPRITE_KIND_OVERRIDE`), plus `isNPC`/`isBoss`'s `||`-chains into `NPC_KINDS`/`BOSS_KINDS` sets.
The texture chain simplified further than a direct transcription: the original checked both
`kind` and `baseKind` (12 cases total), but every kind checked against `kind` directly
(`sentry`/`ratKing`/`rotHeart`/`rotLasher`) has no `BASE_KIND_ALIASES` entry, so `baseKind`
already equals `kind` for each of them - meaning a single lookup by `baseKind` covers every
case the original needed two dispatch passes for. Live-verified via direct texture-identity
comparison (spawning one of every affected kind and reading each sprite's underlying texture
source): `mimic`/`crystalMimic` share the dedicated `mimic.png` source, `piranha` uses
`piranha.png`, `bee` uses `bee.png`, and `statue`/`armoredStatue` use `statue.png`;
`greatCrab` alone continues to reuse `crab.png` because its Java sprite explicitly does so.
Every dedicated-asset kind resolves to its own distinct source - exactly
`SPRITE_KIND_OVERRIDE`'s intended grouping, no cross-contamination.
**2026-09-13:** the depth-scaled stat formulas that used to be hand-coded in
`DEPTH_SCALED_STATS` are now authored in `src/content/actor-rules.mwl`'s
`monsterDepthStats` table and evaluated by a closed adapter in `monsters.ts`. The table
preserves the real `Mimic`/`CrystalMimic`, `Piranha`, `Bee`, `Statue`, `ArmoredStatue`,
and `Sentry` formulas (including the Bee's depth-scaled HP fractions and the Mimic's
floor divisions); no gameplay formula was moved into generic MWG.
`tsc --noEmit`/`npm run build` clean throughout. See `ROADMAP.md` section 11's matching entry.

**2026-09-13:** Hero's shared starting HP 20, strength 10, attack skill 10, defense skill 5,
base evasion 5, and starting gold 0 are now authored in `actor-rules.mwl` and consumed by
scene initialization and save migration. These are the real Java `Hero` defaults; level growth,
class weapon factors, and runtime modifiers remain in TypeScript by design.

Hero level-up growth is now likewise authored in `actor-rules.mwl`: the real Java increments
are +5 maximum HP, +1 attack skill, and +1 defense skill per level. The scene retains the
stateful transition that applies those increments and preserves the HP delta.

The monster sprite-source override map is also now authored in `asset-references.mwl` and read
by `monsters.ts`; frame dimensions and idle-frame positions remain Pixi renderer metadata, not
gameplay content.

**Not a candidate for `mwg` itself** (the user asked whether this pattern belongs in the
framework): the *pattern* - a keyed handler registry with a "return true if you handled it"
contract, replacing a branch cascade - is genuinely generic and would be reasonable for `mwg`
to offer as a documented convention or small typed helper. But every handler *body* here is
concrete SPD monster/potion logic, which `CLAUDE.md`'s licensing-boundary section forbids
putting in `mwg` (MPL-2.0, must stay game-agnostic, never SPD-specific data or logic). Recorded
in `ROADMAP.md` as a possible upstream proposal for the user to raise in the framework's own
repo, not something actionable from inside this one.
