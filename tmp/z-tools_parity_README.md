# Java-vs-TypeScript parity kit (BACKLOG B1, coord T55)

One command rebuilds the Java oracle from source, runs it with fixed seeds and diffs it against this port:

```
node tools/parity/run-parity.mjs                  # both stages (npm run parity:java)
node tools/parity/run-parity.mjs --stage combat   # ~4 min
node tools/parity/run-parity.mjs --stage levelgen
```

Exit code 0 only when every gate holds. Options and the exact steps are in the header of `run-parity.mjs`.

## What is compared

| Stage | Java side | TS side | Gate |
|---|---|---|---|
| `combat` | `CombatHarness` drives the real `Char.attack()` of SPD **v3.3.8** headlessly (bare Warrior vs Rat/Crab, no sprites; rounds: plain exchanges, magic, surprise, Bless/Hex/Daze), tracing every raw RNG draw | `tools/parityCombatTrace.ts` runs the same scripted rounds through the pure `resolveAttack` seam with a `Random.java`-formula adapter | scripts 2, 3, 4 x seeds 123456789, 1, 42: outcomes **and** every draw byte-identical (`compare` says `traces identical`) |
| `loot` | `LootHarness` reports `Mob.lootChance()` - the value `rollToDropLoot()` compares its `Random.Float()` against - for 76 cases (plain-field control mobs, the ten `LimitedDrops` decays walked across their counts, and Swarm across three generations) at **v3.3.8** | `tools/parityLootTrace.ts` recomposes the same number from `monsterLoot` + `limitedDropDecay` through the shared `mobLootChance()` the scene's `kill()` funnel runs | every case matches Java's float32 either bit-exactly or within 1e-6 of float32/float64 rounding; the one real difference (`Swarm.lootChance()`'s runtime `1/(6*(generation+1))` base vs the port's authored `0.1667`) is documented in `loot-known.json`, and a documented entry that stops differing fails as stale |
| `mobdata` | `MobDataHarness` instantiates every concrete `Mob` class at **v3.3.8** (scaled to depth 1, aware, enemy alignment) and dumps HP, EXP, maxLvl, attack/defense skill, sampled damage and armor ranges, `lootChance`, loot object, flying, properties, immunities | `tools/parity/mobDataParity.ts` maps each class to a port monster id and diffs it against `monsters.mwl` / `loot-rules.mwl` (depth rows and `wraithCombatStats` evaluated at depth 1) | every difference is documented in `mobdata-known.json` (the reason cites the Java rule or the port branch that covers it) and no documented entry is stale; 440 field checks over 55 mobs, 8 documented differences, Java mobs with no port monster listed as informational |
| `levelgen` | `LevelGenHarness` generates floors 1-9 for four seeds on the **checkout oracle** (`0fdcf2b2b`), tracing every draw | `tools/levelgenParity.ts` runs `portedFloor` with the same seeds and draw tracing | the 28 deterministic floors (depths 3-9) are `TRACE-IDENTICAL` and structurally `PARITY` (depths 1-2 stay `TRACE-SKIP`: Java's guidebook pages use an intentionally *unseeded* generator, so even Java-vs-Java is not reproducible there) |

The levelgen oracle is the SPD checkout's own tables, not v3.3.8 (decision recorded 2026-09-26 with B2: the port's room
tables are byte-identical to the checkout's; v3.3.8 has a different room roster and matches nothing).

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
- **New traced domains** (quest outcomes, boss transitions and save/load state remain - BACKLOG B3): add a harness class next to `CombatHarness`, register its launcher in `installHarness`, and a stage in `run-parity.mjs` that emits, compares and gates. The `loot` domain's stage (`LootHarness` + `tools/parityLootTrace.ts`) is the worked example: the harness dumps Java's own value per case, the TS side recomposes it from the port's tables through production code, and `loot-known.json` holds documented differences with stale-entry detection.
- Known limits: draws are bit-exact but outcomes run in float64 where Java computes float32, so last-ulp flips are what this hunts, not noise; the hero is unarmed (the extracted seam models flat damage only, no weapon rolls).

Licensing: the harness classes are part of this GPL-3.0-or-later port; the exported SPD tree is a build input only and is never stored in the repo.
