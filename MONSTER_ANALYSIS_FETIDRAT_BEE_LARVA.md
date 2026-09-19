# Monster family analysis: FetidRat / Bee / Larva

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the eleventh data/function/method matrix. The family is useful
because it is made of leftovers with owners: a ghost-quest target (FetidRat), a honeypot
that never shatters (Bee), and a boss spawn (Larva). Each member's audit is short, and each
short audit paid: one missing defense branch, one missing flag. The matrix describes the
current TypeScript representation before any class-level refactor. Java authority is tag
`v3.3.8` throughout.

## The matrix

| Axis | FetidRat | Bee | Larva |
| --- | --- | --- | --- |
| **Data** | MWL row `20/12/5/[1,4]/[0,3]/4/5`: Rat base with HP 20, evasion 5, EXP 4, and armor `0-3` (Rat's `0-1` plus the `NormalIntRange(0, 2)` override - the 2026-09-15 audit's find); flags `miniboss`, `demonic`; `flying` unset like the Rat base | MWL row `12/10/10/[1,3]/[0,0]/0/29` with `bee.png`: a flat stand-in for `spawn(level)`'s `HT=(2+level)*4`, evasion `9+level`, accuracy-from-evasion, damage `[HT/10, HT/4]` - moot, since nothing spawns the kind (see below) | MWL row `20/30/12/[15,25]/[0,4]/5/-2` matching `YogDzewa$Larva` line-for-line; `DEMONIC` added in this pass (see below); `BOSS_MINION` has no live reader (its only consumer is the unported Duelist Challenge) |
| **Function** (shared) | `rollHit`/`rollDamage`, generic wandering (the hero-seeking two-destination pick is an unmodeled nuance) | - (never acts) | `rollHit`/`rollDamage` at the row line |
| **Method** (behavior keyed on `kind`) | `mobOnHit` ooze branch at 1/3 with the hero/victim log split; `mobOnHit` StenchGas branch added in this pass (see below); ghost-quest kill handler shared with the other two miniboss targets | none - no spawn path, no branches | none - pure stat carrier in Yog's summon deck |
| **State** (runtime and save) | none | `level`/`potPos`/`potHolder`/`alignment` persistence has no counterpart (no bee state exists) | none |
| **Ability / hook** | ghost-quest spawn (quest type selects the kind) and ghost-quest death advance | honeypot shatter, pot-holder targeting, honeyed-healing charm, strike-back aggro - all absent with the shatter system | Yog's `regularSummons` deck entry |
| **Presentation** | fetid art, ooze log lines | bee art (unseen in play) | larva art |
| **Exceptions** | `questScores[0] -= 50` on dry-hero ooze has no table to land in (same missing system as the rot scores); wand/bomb hits seed no gas (same hook residual as the heart) | the whole Honeypot-shatter-to-bee chain is unported; the honeypot item itself exists in the catalogue | - |

## What this confirms about the target shape

The tenth matrix's `kill(creature, cause)` moral extends to `mobOnHit(attacker, defender,
damage)` as the defender-reaction hook: two more `defenseProc` overrides (heart gas,
fetid gas) landed in the same five lines' neighbourhood with the same stated residual.
The family also confirms the audit's stopping rule: Bee's row is wrong in every number and
it does not matter, because no code path can meet it - data without entry-into-play is
dead data, and the matrix records the missing entry, not a stat correction.

## Actual structural gaps and fixes

Two real gaps found and fixed in this pass, each with a Java-citing comment at the site:

- FetidRat never gassed when struck: `defenseProc`'s unconditional StenchGas-20 seed had
  no branch. Now in `mobOnHit` keyed on the defender, beside the heart gas, with the same
  wand/bomb residual.
- Larva was missing from the `demonic` flag set despite carrying DEMONIC in Java, hiding
  it from the prismatic-light blind and starflower smite readers. Now listed.

Deliberately left open: quest scores (no table exists); the hero-seeking wander nuance;
the entire honeypot-to-bee chain (item exists, shatter and all bee AI absent). Each is
recorded here and in the `PORT_COVERAGE.md` rows touched by this pass rather than silently
kept.
