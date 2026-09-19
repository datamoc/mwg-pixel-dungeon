# Monster family analysis: Bat / Albino / Swarm / Spinner

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the seventh data/function/method matrix. The family is useful because
it contains the variant-inheritance case at its most extreme (Albino `extends Rat`, overriding
only HP/EXP/loot plus one proc), a self-replicating mob (Swarm), a mob with a terrain ability
plus a poison-and-flee bite (Spinner), and a fast lifesteal mob (Bat) whose speed has no port
model. (Albino/Swarm haunt the Sewers, Bat/Spinner the Caves.) The matrix describes the current TypeScript representation before any class-level
refactor. Java authority is tag `v3.3.8` throughout.

## The matrix

| Axis | Bat | Albino | Swarm | Spinner |
| --- | --- | --- | --- | --- |
| **Data** | `hp:30 accuracy:16 evasion:15 damage:[5,18] armor:[0,4] exp:7 maxLvl:15`, authored by the `bat` MWL monster row; `bat.png` art; `flying` flag via `actor-rules.mwl`; healpot loot `1/6` with the `BAT_HP` linear-7 decay (`loot-rules.mwl`) | Rat variant through `actorBaseAliases` (`base: rat` in `actor-rules.mwl`): inherits the Rat line `8/2/[1,4]/[0,1]/maxLvl:5` and overrides `hp:12 exp:2` in its own MWL row; mystery-meat loot `1.0`; albino sprite frame metadata (`16x15, idle 16`) plus its own `SPRITE_ANIMATIONS` entry | `hp:50 accuracy:10 evasion:5 damage:[1,4] armor:[0,0] exp:3 maxLvl:9`, authored by the `swarm` MWL row; `swarm.png` art; `flying` flag; healpot loot `1/6` with the `SWARM_HP` linear-5 decay **times `1/(generation+1)`** (divisor fixed in this pass - see below) | `hp:50 accuracy:22 evasion:17 damage:[10,20] armor:[0,6] exp:9 maxLvl:17`, authored by the `spinner` MWL row; `spinner.png` art; mystery-meat loot `0.125` |
| **Function** (shared) | `rollHit`/`rollDamage`, `Char.damage` handling, and `Roguelike.decideMonsterAI` supply the ordinary fight/move path | same inherited path | same ordinary path when no split fires | same ordinary path when neither the web override nor the flee flag redirects the turn |
| **Method** (behavior keyed on `kind`) | `mobOnHit` lifesteal branch: `damage > 4` gates `reg = min(damage-4, missing HP)` | `mobOnHit` bleed branch (fixed in this pass): `damage > 0` plus a half chance applies `setBleeding(defender, 2 + Random.float(1))` | `defenseProc` equivalent: `swarmSplit(defender, damage, preHp)` on the melee/ranged damage boundary; generation persisted on `Creature` and into saves | ranged-AI override table entry plus `mobOnHit` poison/flee branch plus the flee-recovery rule in the monster-turn pre-hook |
| **State** (runtime and save) | none beyond the shared creature state | none beyond the shared creature state | `generation?: number`, captured/restored with the floor; clones start awake (`sleeping = false`) | `webCooldown?: number` on `Creature`, captured/restored; the `web` floor `Blob` volume persists with the floor; the shared `fleeing` flag carries the FLEEING state |
| **Ability / hook** | lifesteal matches `Bat.attackProc()` exactly, including the `damage - 4` shape and the missing-HP cap | half of damaging landed hits bleed for a `[2, 3)` intensity with max-wins retention (`Bleeding.set` semantics); uniform draw is a stated stand-in for Java's bell-curved `NormalFloat(2, 3)` | split fires when `preHp >= damage + 2` with a free 4-neighbour (passable, unoccupied, chasm-safe for the flying original); clone HP is `floor((preHp - damage) / 2)` subtracted from the parent; Burning copied, Poison reset to 2, champion/magicImmune carried as the `revivePersists` analogue; clones grant no EXP on the kill path | off-cooldown (`webCooldown <= 0`, reset to 10), non-adjacent, hero targetable within range 6: seeds the hero cell plus east/west neighbours at volume 10 and roots the hero; half of landed bites poison for `Random.range(7, 8)` and set `fleeing`; a fleeing spinner recovers when it sees the hero and the hero is not poisoned, and can still shoot webs while fleeing |
| **Presentation** | `port.log.batfeeds` red line with the regained amount | shared bleeding announcement/log through the buff pipeline | `port.log.swarmsplits` warning line | `port.log.spinnerweb` red line; web cells render through the floor blob |
| **Exceptions** | `baseSpeed = 2` (double-speed turns) has no port model: the MWL schema has no speed column and every mob acts 1:1; `die()`'s `flying = false` is cosmetic-only and unmodeled | Rat's `Ratmogrify` truce sniff belongs to the Rat base, shared free with whatever the Rat row carries | clone scheduling is the shared spawn path (acts from the next round; Java's explicit `SPLIT_DELAY` of 1 turn is the same observable cadence) | web volume 10 vs Java's 20; fixed east/west spread vs Java's movement-predicted directional fan; `canTarget` range-6 gate vs Java's `Ballistica` wall-check; immediate direct roots on top of the per-turn blob roots (harsher than Java); no `Web` immunity and no Poison resistance (half-duration) for the spinner itself; no `lastEnemyPos` prediction (webs the hero's current cell); flee recovery drops Java's Terror/Dread nuance; poison duration carries no ascension scaling (moot: no ascension UI, multiplier is 1) |

## What this confirms about the target shape

Albino is the cleanest variant-inheritance case yet: one MWL row of overrides plus one
`mobOnHit` branch, with the Rat base shared free - stronger evidence than DM-201 (whose
branch is shared identically) that `BASE_KIND_ALIASES` plus keyed branches is the right
target and Java-style subclasses are not. Swarm and Spinner confirm the stateful
single-kind strategy shape (`generation`, `webCooldown` + floor blob + `fleeing`): small
per-kind fields on `Creature`, no classes. Bat confirms the schema boundary: anything Java
keeps off the stat line (speed) stays absent until the schema grows a column for it.

## Actual structural gaps and fixes

Two real bugs found and fixed in this pass (`dungeonScene.ts`, both with Java-citing
comments at the site):

- Albino applied `poison` on a bare half chance; Java applies `Bleeding.set(2..3)` gated on
  `damage > 0`. Fixed to `setBleeding` with the `damage > 0` gate (uniform `[2, 3)` stated
  as the `NormalFloat` stand-in). The old comment claiming poison was the only available
  primitive was stale - the bleeding primitive, its tick, and its cure paths all exist.
- Split-descendant Swarms rolled loot at the full `1/6`: Java's `1/(6*(generation+1))` divisor
  was missing (the `monsters.ts` comment already promised it). Fixed at the shared loot-roll
  site; the `(5-n)/5` half already rode `LIMITED_DROP_DECAY`.

Deliberately left open: Bat's double speed (needs a schema column, not a branch); Spinner's
Poison resistance halving (the buff pipeline models immunities only, no resistance-halving
mechanism exists); Spinner's Web immunity (moot - nothing reads web volume except the
root-each-turn loop, and webs land on the hero at range); the web-spread/volume/prediction
differences (stated simplifications in the table above). Each is recorded here and in the
`PORT_COVERAGE.md` rows touched by this pass rather than silently kept.
