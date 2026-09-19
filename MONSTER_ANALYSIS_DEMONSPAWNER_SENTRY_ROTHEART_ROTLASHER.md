# Monster family analysis: DemonSpawner / Sentry / RotHeart / RotLasher

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the tenth data/function/method matrix. The family is useful because
every member is immobile by design - a passive ripper factory (DemonSpawner), a beam turret
(SentryRoom's Sentry), a passive gas heart (RotHeart), and its waiting guard (RotLasher) -
so the audit is about turns that must *not* happen as much as ones that must. The matrix
describes the current TypeScript representation before any class-level refactor. Java
authority is tag `v3.3.8` throughout. (FungalSentry is a different mob and is not ported at
all - see the exceptions.)

## The matrix

| Axis | DemonSpawner | Sentry | RotHeart | RotLasher |
| --- | --- | --- | --- | --- |
| **Data** | MWL row `120/0/0/[0,0]/[0,12]/15/29` matching Java (healpot loot `1.0` in `loot-rules.mwl`); flags `miniboss`, `demonic`, immovable/static | MWL row plus its depth row: accuracy `20+2d` matching `attackSkill`, `INFINITE_EVASION` as evasion `1000000`, HP 1, EXP 0; damage `[2+floor(d/2), 4+d]` matching the beam roll | MWL row `80/0/0/[0,0]/[0,5]/4/29`: HP/EXP match; armor `[0,5]` stands in for `drRoll`'s `0..5` (Java adds no weapon factor); ToxicGas immunity flag | MWL row `80/25/0/[10,20]/[0,8]/1/29`: HP/accuracy/damage/EXP match, evasion 0 matches the missing `defenseSkill`; armor was `[0,8]` with no Java `drRoll` override behind it (plain 0) - fixed to `[0,0]` in this pass; seed loot `0.75` |
| **Function** (shared) | `rollHit`/`rollDamage` never meaningfully run (no attacks, evasion 0, armor only) | never melees; the beam resolves through the shared magic-hit roll at the scaled accuracy | never acts; damage lands through the shared seams | ordinary melee at the row line when adjacent |
| **Method** (behavior keyed on `kind`) | `tickDemonSpawner`: cooldown decrements with the `-20` clamp, HUNTING ripper on a free 8-neighbour, reset to 60 minus the depth-scaled up-to-20 - all matching `act()`; damage accelerates the cooldown (the `damage()` override, at the defense site) | sentry beam branch: terror-gated, range-8, ~2-turn first charge then every visible turn, magic hit bypassing armor, death-magic kill presentation | no turn at all (returns past the DoT line so burning still destroys it); struck hearts seed gas and dead hearts drop seed (both fixed this pass) | adjacent-only attack with the +5 regen while hurt and unapproached; terrified lashers hold still |
| **State** (runtime and save) | `spawnCooldown` persisted (`sentryWarmup` pattern's sibling) | `sentryWarmup` persisted | none | none |
| **Ability / hook** | Halls room placement with the live-floor overlay; ripper spawns HUNTING | the room's locked-door + prize flow around it | ToxicGas seeding `5 + 3 * openNearby` on being struck (passable stands in for non-solid); Rotberry seed on non-burn death | every landed hit cripples 2 turns (fixed this pass) |
| **Presentation** | spawner art + floor overlay | red sentry art, charge/zap/miss log lines standing in for the particles | heart art | lasher art, heal tick in place of the status text |
| **Exceptions** | `spawnersAlive` tally, journal landmarks, and the ascension cooldown cap have no counterparts (statistics/notes/ascension systems); `beckon` is a no-op in Java and there is no beckon system here | `damage()` is a no-op in Java - the sentry is fully invulnerable - while the port's HP-1 body survives only because nothing can hit evasion 1000000; player-inflicted AoE or blob damage would wrongly kill it. Bestiary-seen tick, travel-interrupt pity, and charge particles absent (stated at the branch) | burning destroys via `destroy()` with no death processing while the port kills ordinarily - the seed fix respects this exactly (`fire` cause excluded); the +2000/-100 quest scores have no table to land in; wand/bomb hits seed no gas (hook coverage residual) | armor `[0,8]` vs Java's flat 0; `viewDistance = 1` and the `Waiting` always-notice shape ride the shared sleeper model approximately |

## What this confirms about the target shape

The ninth matrix's moral - shared systems carry the behavior, rows carry the numbers -
holds for actors that barely act: spawner cooldown, beam charge, regen, and gas seeding all
live in keyed branches and tiny persisted fields, no classes. The family also confirms the
`kill(creature, cause)` cause parameter as load-bearing fidelity infrastructure: without
the `fire` cause the burn-destroy distinction (no seed) would be unstatable.

## Actual structural gaps and fixes

Three real gaps found and fixed in this pass (`dungeonScene.ts`, Java-citing comments at
each site):

- RotLasher never crippled: `attackProc`'s unconditional 2-turn Cripple had no branch.
  Now in `mobOnHit`, unconditional like the caustic proc (and unlike Albino's gated one).
- RotHeart never gassed when struck: `defenseProc`'s `5 + 3 * openNearby` ToxicGas seed
  had no branch. Now in `mobOnHit` keyed on the defender, with passable standing in for
  non-solid; wand/bomb hits bypassing the hook are a recorded residual of Java's
  source-independent `defenseProc`.
- RotHeart never dropped its Rotberry seed: `die()`'s seed drop had no branch. Now at the
  heart-death site, excluded for the `fire` cause exactly the way Java's `destroy()` path
  skips death processing.
- RotLasher armor `[0,8]` had no Java behind it (no `drRoll` override - flat 0): fixed to
  `[0,0]` in the MWL row.

Deliberately left open: quest scores (no table exists); sentry invulnerability (all attack
rolls already miss - only corner-case AoE/blob damage leaks through); FungalSentry entire
(poison extender, gas/poison immunities, ballistics reach, 200 HP); `viewDistance`/notice
nuances of the `Waiting` state. Each is recorded here and in the
`PORT_COVERAGE.md` rows touched by this pass rather than silently kept.
