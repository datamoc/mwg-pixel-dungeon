# Java-vs-TypeScript parity kit (BACKLOG B1, coord T55)

One command rebuilds the Java oracle from source, runs it with fixed seeds and diffs it against this port:

```
node tools/parity/run-parity.mjs                  # all stages (npm run parity:java)
node tools/parity/run-parity.mjs --stage combat   # ~4 min
node tools/parity/run-parity.mjs --stage levelgen
```

Exit code 0 only when every gate holds. Options and the exact steps are in the header of `run-parity.mjs`.

## What is compared

| Stage | Java side | TS side | Gate |
|---|---|---|---|
| `combat` | `CombatHarness` drives the real `Char.attack()` of SPD **v3.3.8** headlessly (bare Warrior vs Rat/Crab, no sprites; rounds: plain exchanges, magic, surprise, Bless/Hex/Daze), tracing every raw RNG draw | `tools/parityCombatTrace.ts` runs the same scripted rounds through the pure `resolveAttack` seam with a `Random.java`-formula adapter | scripts 2, 3, 4 x seeds 123456789, 1, 42: outcomes **and** every draw byte-identical (`compare` says `traces identical`) |
| `loot` | `LootHarness` reports `Mob.lootChance()` - the value `rollToDropLoot()` compares its `Random.Float()` against - for 76 cases (plain-field control mobs, the ten `LimitedDrops` decays walked across their counts, and Swarm across three generations) at **v3.3.8** | `tools/parityLootTrace.ts` recomposes the same number from `monsterLoot` + `limitedDropDecay` through the shared `mobLootChance()` the scene's `kill()` funnel runs | every case matches Java's float32 either bit-exactly or within 1e-6 of float32/float64 rounding. `loot-known.json` is the allowlist for documented differences (empty since the swarm-base fix: `Swarm.lootChance()`'s runtime `1/(6*(generation+1))` override is now restored inside `mobLootChance()` instead of composing the authored `0.1667` field), and a documented entry that stops differing fails as stale |
| `quest` | `LevelGenHarness` with `LEVELGEN_QUESTS=true` reports the run-level `Wandmaker.Quest.type` (1 corpse dust / 2 embers / 3 rotberry) after every floor of the same four seeds, resetting all four quests per run exactly as `Dungeon.init()` does, on the **checkout oracle** | `tools/parityQuestTrace.ts` rebuilds each run with `resetPortedRun()` + `primeRunState()` and reads `wandmakerQuestType()` after the same floors | all 36 (seed, depth) lines agree, covering all three quest variants the four seeds roll |
| `levelgen` | `LevelGenHarness` generates floors 1-9 for four seeds on the **checkout oracle** (`0fdcf2b2b`) **plus the S6 deck backport** (`patchOracleDecks.mjs`, build-time, tables from MWL) | `tools/levelgenParity.ts` runs `portedFloor` with the same seeds and draw tracing | the 28 deterministic floors (depths 3-9) are `TRACE-IDENTICAL` and structurally `PARITY` (depths 1-2 stay `TRACE-SKIP`: Java's guidebook pages use an intentionally *unseeded* generator, so even Java-vs-Java is not reproducible there) |
| `ghost` | `GhostRewardHarness` replicates `Ghost.Quest.spawn()`'s RNG sequence per (seed, depth) for 40 seeds x depths 2-4 (spawn gate `Random.Int(5-depth)==0`, `type = depth-1`, tier chances `{0, 0, 10, 6, 3, 1}`, tier deck draw, shared item level, always-rolled enchant/glyph picks, 0.2 keep) at **v3.3.8**, minus the room/position loop (geometry-dependent draws the port places differently) | `tools/parityGhostRewardTrace.ts` runs the port's gate composition + `ghostQuestReward()` on the same seeds with fresh decks | all 612 fields match with empty `ghostreward-known.json` (documented-differences allowlist with stale-entry detection, same convention as loot) |
| `imp` | `ImpRewardHarness` replicates `Imp.Quest.spawn()`'s RNG sequence per seed for 40 seeds (fresh `fullReset`, `Random.Int(20-depth)==0` gates over depths 17-19, depth-switched `alternative`, `do { random(RING) } while (cursed)` + draw-free `upgrade(2)`), minus the room placement (geometry-dependent draws the port places differently); mechanics identical in both trees so it runs on the **checkout oracle plus the S6 deck backport** | `tools/parityImpTrace.ts` runs the port's gate composition + `impQuestReward()` on the same seeds with fresh decks | all 160 fields match with empty `impReward-known.json` (same convention as ghost) |
| `blacksmith` | `BlacksmithRewardHarness` calls Java's own `Blacksmith.Quest.generateRewards(true)` per (seed, depth) for 40 seeds x depths 12-14 (spawn gate `Random.Int(15-depth)==0`, `type = IntRange(1, 2)`, floor-set-3 tier rolls, clash re-roll, shared item level, always-rolled enchant/glyph picks, 0.3 keep) at **v3.3.8**, minus the room placement (geometry-dependent draws the port places differently); no backport needed, the v3.3.8 tree already has the deck mechanics | `tools/parityBlacksmithTrace.ts` runs the port's gate + type composition + `blacksmithSmithRewards()` on the same seeds with fresh decks | all 1350 fields match with empty `blacksmith-known.json` (same convention as ghost) |

The levelgen oracle is the SPD checkout's own tables, not v3.3.8 (decision recorded 2026-09-26 with B2: the port's room
tables are byte-identical to the checkout's; v3.3.8 has a different room roster and matches nothing).
The Ghost stage (2026-09-30) forced the port onto v3.3.8 decks; the S6 backport the same day re-pointed the levelgen oracle at those mechanics (checkout rooms + v3.3.8 deck draws), so `--stage levelgen` is green (28/28) and `--stage ghost` stays the v3.3.8-true gate for quests.
2026-09-30: keep the v3.3.8 mechanics).

The `imp` stage also calls v3.3.8's actual `Imp.Quest.complete()` after initializing a stored reward and a nonzero
score. It asserts that Java clears the stored reward, then compares the completion score and completed-state route
in the production TypeScript scene path, in addition to the 160 spawn/reward fields. The NPC confirmation window
remains an explicitly documented UI simplification in the port.

The `blacksmith` stage calls Java's actual `Blacksmith.Quest.complete()` for ten carried-DarkGold/boss-beaten
combinations. The production `blacksmithTurnInFavor()` matches the Java favor and score delta; checks also cover
consuming the ore, retaining the quest pickaxe, completion state, and the 2500-favor free-pickaxe threshold (60 completion fields),
in addition to its 1350 spawn/reward fields.

The `tengu` stage calls Java's actual `Tengu.damage()` for 102 HP-bracket cases and nine FIGHT_START half-HP
phase-edge cases (360 compared fields total). The phase fixture's `PrisonBossLevel` subclass records the real
override's `progress()` call and switches to FIGHT_PAUSE; it does not run arena map/layout presentation.

## How the Java half is made reproducible

Nothing here modifies your SPD checkout. For each stage the runner:

1. `git archive <ref>` the checkout into a work dir (default `<tmp>/mwg-parity`, reused between runs);
2. copies our harness sources from `java/` (`CombatHarness`, `LevelGenHarness` and their launchers - project-authored, they only call SPD classes);
3. inserts the RNG trace hook (`java/TracingRandom.hook.txt`, our own code) into `Random.java` by text insertion in front of `pushGenerator` and swaps its one `new java.util.Random(...)` for `traceDraws ? new TracingRandom(...) : ...` - it fails loudly if that shape ever changes;
4. registers the Gradle task (`runCombatHarness` / `runHarness`) if the tree lacks it, and runs it offline (`--offline`, needs a warm Gradle cache and JDK 17+);
5. emits the TS traces with the same seed and script and compares.

`--levelgen-tree <dir>` reuses an already-prepared Java tree (for example the checkout itself) instead of exporting one.

## Extending it (B3-B5 consume this)

- **New scripted rounds**: add to both `CombatHarness.java` and `parityCombatTrace.ts` in the same order (they mirror each other) and add the script number to `--scripts`.
- **New traced domains** (boss transitions and save/load state remain - BACKLOG B3): add a harness class next to `CombatHarness`, register its launcher in `installHarness`, and a stage in `run-parity.mjs` that emits, compares and gates. Two are already worked examples: the `loot` domain's stage (`LootHarness` + `tools/parityLootTrace.ts`) is a standalone harness whose TS side recomposes the value from the port's tables through production code; the `quest` domain rides the existing levelgen harness under `LEVELGEN_QUESTS=true` because quest rooms roll inside `build()` - that shape fits any outcome the generator itself decides. `loot-known.json` holds documented differences with stale-entry detection in both.
- Known limits: draws are bit-exact but outcomes run in float64 where Java computes float32, so last-ulp flips are what this hunts, not noise; the hero is unarmed (the extracted seam models flat damage only, no weapon rolls).

Licensing: the harness classes are part of this GPL-3.0-or-later port; the exported SPD tree is a build input only and is never stored in the repo.
