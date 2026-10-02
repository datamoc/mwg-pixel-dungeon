# Backlog: open epics

**Only open points live here.** Anything closed - a finished step, a progress note, a closed epic - is history and lives in
`CLOSED.md` (see its "Backlog progress log", which carries the full text of every `Bn` section as it stood on
2026-09-26, including each epic's slice-by-slice progress). When a box below closes, move its section to `CLOSED.md` and
delete it here; do not leave progress narrative in this file.

These epics were moved out of `ROADMAP.md` on 2026-09-24 because none is closable by one finite change (parity harness,
incremental refactor, matrix production). Open items that used to sit in `PORT_COVERAGE.md` rows are tracked in
`ROADMAP.md`'s "Open coverage items" register, not here.

B1 (the parity harness) closed 2026-09-26 (T55): `tools/parity/` (`npm run parity:java`), history in `CLOSED.md`. B2 (RNG call order for level/item/monster/quest generation) closed 2026-09-26 (T56) and moved to `CLOSED.md`. Its coord task T56 was closed the same day.
B8 (the analysis matrices) closed 2026-09-29 (T62): 55 matrices exist, every inventoried family is covered, and its three code residuals moved to `ROADMAP.md` R100-R102; its section is in `CLOSED.md`.
B9's coord tasks are T159 (residuals, re-filed after T18-T21 were cancelled as duplicates of T46-T48); the register check is T160.

## B3. Verify loot, quest outcomes, boss transitions and save/load state

  - **Progress 2026-10-02, Blacksmith completion trace:** --stage blacksmith calls actual v3.3.8 Blacksmith.Quest.complete() for ten Gold/boss cases; favor, score delta, consumed ore, retained pickaxe, completion state, and free-pickaxe threshold match across 60 fields plus 1,350 spawn/reward fields.

  - **Progress 2026-10-02, Imp completion trace:** `--stage imp` invokes v3.3.8 `Imp.Quest.complete()` with a stored reward and nonzero score, asserts reward clearing, and compares the 4000-point score and completed state against the port scene path; 162 fields match across reward and completion cases. Blacksmith completion now also has an actual-Java trace; boss runtime traces remain open.

- [ ] Verify loot, quest outcomes, boss transitions, and save/load state. **Complexity: L.** extends `tools/parity/` (see its README, "Extending it").
  - **Progress 2026-09-27, save/load and mob tables (T57):** `npm run verify:saveload` (Chrome and Firefox: five floors incl. two boss floors, save/load/save fixed point, fresh-page resume) found and fixed four real bugs (duplicated floor items and resurrected keys on every revisit/load, keys re-queued to the floor below, secret doors revealed by loading, a stale ritual site crashing a first visit) - see the coverage row "Floor restore on revisit and load". The `mobdata` stage diffs every Java mob class against the monster/loot tables (440 field checks, 8 documented differences) and corrected RotLasher DR to 0-8.
  - **Progress 2026-10-02, boss-state save/load coverage (T57):** `tools/verifySaveLoad.mjs` now snapshots boss-specific turn state and mutates it before restore on the Goo and Tengu floors: a primed Goo pump/heal increment and a paused Tengu phase/ability counters. The Tengu case triggers `checkTenguFightStart()` after entering the prison cell, because floor entry correctly does not create that actor. The same production `saveRun()`/`loadRun()` path was live-checked in the browser: Goo restored `2/3` and Tengu restored `paused/2/4` after deliberate mutation. The full scripted harness remains to be rerun through `browserTest.mjs`.
  - **Progress 2026-09-26, loot domain:** `node tools/parity/run-parity.mjs --stage loot` compares Java's own
    `Mob.lootChance()` - the value `Mob.rollToDropLoot()` rolls its `Random.Float()` against - across 76 cases
    (13 plain-field control mobs, the ten `LimitedDrops` decays walked across their counts, Swarm across three
    generations) against this port's composition of the same number from `monsterLoot` + `limitedDropDecay`, through
    the new `src/simulation/mobLoot.ts` `mobLootChance()` seam the scene's `kill()` funnel now shares: 41 cases
    bit-exact, 20 within float32/float64 rounding, 15 documented in `tools/parity/loot-known.json` (Swarm's runtime
    `1/(6*(generation+1))` base vs the authored `0.1667` field), 0 undocumented, 0 stale.
  - **Progress 2026-09-26, quest domain (Wandmaker):** `--stage quest` runs `LevelGenHarness` with
    `LEVELGEN_QUESTS=true`, which resets all four quests per run the way `Dungeon.init()` does and writes one
    `levelgen_quests.txt` line per (seed, depth) after each floor's build; `tools/parityQuestTrace.ts` rebuilds
    each run with `resetPortedRun()` + `primeRunState()` and compares `wandmakerQuestType()`. Against the checkout oracle (ref 0fdcf2b2b), **36/36 lines agreed**
    across the four seeds, covering all three variants they roll (corpse dust x5, embers x1, rotberry x1). The
    The **Blacksmith** reward stage now uses its own v3.3.8-capable harness; current verification is recorded below.
  - **Progress 2026-09-30, quest domain (Ghost):** `--stage ghost` runs the new `GhostRewardHarness` (120 cases: 40 seeds x depths 2-4), which replicates `Ghost.Quest.spawn()`'s RNG sequence minus the room/position loop (geometry-dependent draws the port places differently), and `tools/parityGhostRewardTrace.ts` diffs the spawn gate (`Random.Int(5-depth)==0`), `type = depth-1`, armor/weapon tiers and classes, the shared item level and the enchant keep against the port's gate composition + `ghostQuestReward()`: **612 fields match, 0 undocumented, empty `tools/parity/ghostreward-known.json`**. The stage forced four real v3.3.8 `Generator` deck fixes the port was missing: potion/scroll `defaultProbs2` second decks (fullReset Int(2)s), the absent TRINKET category (deck-seed chain), the v3.3.8 potion/scroll deck-1 tables, and `Weapon`/`Armor.random()`'s Long-seeded effect substream.
  - **Progress 2026-10-02, quest reward parity:** Blacksmith’s v3.3.8 harness ran 120 seed/depth cases; the TypeScript comparison matched 1,350 fields, with zero undocumented mismatches or stale known entries. A fresh Ghost run matched all 612 fields across 120 cases. Imp parity was freshly checked 2026-10-02: the project-authored Java harness compiled against the local v3.3.8 desktop distribution and produced 40 cases; all 160 spawn-depth, alternative, ring-class and ring-level fields matched, with zero Java errors, undocumented mismatches or stale known entries. Re-runs 2026-10-02: the standard runner passed Blacksmith (1,350 fields / 120 cases) and Imp (160 fields / 40 cases) when GRADLE_USER_HOME used the populated user cache with filesystem access; the default sandbox cache path denied the Gradle wrapper lock.
  - **Oracle tripwire resolved (2026-09-30, S6):** the deck fixes are covered by a backported oracle: `tools/parity/patchOracleDecks.mjs` applies the v3.3.8 deck draw sequence (second-deck Int(2)s, refill toggle, defaultProbsTotal branch, TRINKET deck-seed slot, effect substream; tables from the port MWL, zero stored SPD text) into the exported checkout tree at build time, wired into the stage with an idempotent skip (`--levelgen-tree` users run it themselves). `--stage levelgen` is green again: 28/28 TRACE-IDENTICAL, 28/28 structural parity. The 3 formerly-pristine failures went green too - the old port burned a spurious exotic-`Float()` per potion roll that neither side burns now.
  - Wandmaker target recheck (2026-10-02): against the local v3.3.8 build, 31/36 seed/depth lines matched and five differed; full levelgen traces matched 0/28 deterministic floors. At seed 123456789/depth 7, draw 38 is Java StandardRoom.setSizeCat() while the port uses that draw for the Wandmaker gate, consistent with the documented room-subclass/room-selection reductions (coverage/rows-terrain-traps-and-levelgen.md, rows 41-42). This is not evidence of a quest-roll formula bug. Isolated Wandmaker spawn gate/type verified against v3.3.8 Java: 40 equal-seed cases (80 fields) plus depth and short-circuit checks pass; full-floor quest parity remains open. Tengu actual v3.3.8 `Tengu.damage()` matches the production HP bracket clamp/deferred-jump seam plus nine FIGHT_START half-HP phase-edge cases for 360 fields via `--stage tengu`. A `PrisonBossLevel` test double records `progress()` and changes state without running arena presentation, so full Tengu arena progression remains open. Dwarf King damage trace (2026-10-02): six actual Java phase-2 threshold/clamp cases (normal and STRONGER_BOSSES) and one phase-3 crossing below 20 HP match the production seam, including HP, phase, summon reset, full-HT barrier and losing yell, via `node tools/parity/run-parity.mjs --stage king`. Its phase-2-to-phase-3 presentation branch remains untraced. Remaining: Java boss traces for Goo, DM-300 and Yog still lack runtime parity; Tengu arena progression is untraced; the Imp confirmation-window UI flow remains simplified.
  - **Scoping note for remaining boss-transition gaps (updated 2026-10-02):** the original blanket claim that both sides were blocked for node-only parity is retired. Java GDX launchers with real sprites in a Group support live traces: Tengu phase-1 and Dwarf King phase-2 threshold/phase-3 low-HP behavior now have extracted TypeScript decision seams and passing Java stages. Remaining Java presentation constraints include the Dwarf King's phase-2-to-phase-3 emitter/audio/BossHealthBar/render-thread branch and Goo's sprite emitters, idle animations, burst effects and PixelScene shake. Full Tengu arena progression also remains open. Goo, DM-300 and Yog still need production decision seams and Java fixtures that stub only their presentation boundaries.
  - **Scoping for the remaining quest halves (2026-09-27):** the Ghost quest's gate and target type mirror Java
    line-for-line by inspection (`Random.Int(5 - depth) == 0` and `type = Dungeon.depth - 1`, `Ghost.Quest.spawn`
    vs `maybeSpawnGhost`), but the spawn runs in `SewerLevel.createItems()`, which the harness deliberately skips,
    and on this side in a scene method (`npcShopBlacksmith.ts`) - so that comparison needs the same two halves:
    `createMobs()`/`createItems()` under the `LEVELGEN_QUESTS` flag (which the harness's own comment says never
    touches the level generator's stream) plus a pure seam for the spawn decision. The Imp quest is the same shape
    at City depth 16+, which the walk does not reach at all, and Blacksmith needs the v3.3.8-capable harness noted
    above.

## B6. `SimulationRuntime` migration

- [ ] Wrap the per-domain rule functions (`simulation/combat.ts`, `movement.ts`, `heroActions.ts`, `heroTurn.ts`) behind one
  `SimulationRuntime<SpdGameState, SpdCommand, SpdEvent, Creature>`, migrating the scene's direct-mutation call sites
  (`attack()`, `moveTo()`, ...) to `dispatch()` one command type at a time, cheapest first, no big-bang (plan section 25).
  - Remaining: the commands not yet routed through a runtime; the inert per-runtime scheduler/random pairs
    (search, hunger, movement) still have to be reconciled with the scene's real ones, which waits for the first command
    with a real cost. What is already routed is recorded in `CLOSED.md`'s progress log.
    Coord T60 ("Unify per-domain rule functions behind one SimulationRuntime dispatch") is done and covers the routed
    tranche only; this epic stays open for the commands above (reconciled with coord 2026-09-26).

## B7. Extract `attack()`'s pure resolution

- [ ] Extract the scene's `attack()` pure resolution (hit/damage rolls, weapon-affix/talent branches, event-worthy outcomes
  such as mimic reveal and displacement) from its presentation calls (sprite tint, audio cue, floating text); the likely
  vehicle for adopting `SimulationRuntime` (B6). **Complexity: L.**
  - Progress 2026-09-30: the landed-hit pre-armor numeric modifiers (charm/spectator suppression, weapon augment,
    Weapon Recharging, and Ring of Force) now resolve in `simulation/attackModifiers.ts`; hero talent damage bonuses
    (Empowered Strike, Sucker Punch, physical bonus, Patient Strike, Followup, Deadly Followup) resolve in
    `simulation/attackTalentBonuses.ts`; Polarized, Sacrificial, and Displacing proc decisions now resolve in
    `simulation/attackWeaponAffixes.ts`. The scene supplies live state and applies returned tracker, bleed, and
    displacement effects. Progress 2026-10-01 (T54/B7): Grim execute (`grimExecuteChance`: `(0.5 + 0.05 x level) x arcana` vs missing-HP-fraction squared, `Char.damage()` GrimTracker block) and Corrupting conversion (`corruptingProcChance`: `(level+5)/(level+25) x arcana`) now resolve in the seam with all four scene sites (hero path + Shockwave mirrors) delegating, pinned by the extended `verifyEnchantProcChances.mjs` (values, delegation, whole-file no-duplicate gates). Follow-up the same day: Lethal Momentum arming (`lethalMomentumChance`: Java's `0.34+0.33/point` from `Mob.die()`, replacing the old `2/3` rounding) with its kill-hook site delegating under the same pin. Gate settlement the same day: the curse-trio seam (`resolveAttackWeaponAffixes`) gates on `gearAttacker` (hero/clone/rose), not the live hero alone - the coverage row's SHADOW_BLADE half delegates `Weapon.proc` to clone swings, and `enchantProcMultiplier()` already answers base 1.0 for them via `delegatedGearSwing`; both inline blocks (`attack()`, `cursedWeaponPreProcs`) migrated, pin asserts the gate plus both-site delegation. Remaining: other weapon/defender procs and attack event outcomes are still scene-coupled.

## B9. Armor-ability residuals

- [ ] Fine-grained armor-ability residuals, each recorded in its own `PORT_COVERAGE.md` row:
  - ShadowClone's remaining gear-proc shares (AntiMagic/Viscosity ported 2026-09-30 (B9-a): CLONED_ARMOR-gated clone shares in the shared damage dispatch, clone-owned deferred pool paid out on ally turns). The `CityLevel.Smoke` pour is already implemented and documented in its coverage row: 5 particles/s, black 2-second lifetime, Java emitter bounds, with only velocity distribution simplified;
  - CursedWand's VeryRare tier (`v4.0.0`, all eight effects dispatched 2026-09-29; remaining model and presentation simplifications are documented in its coverage row);
  - Trinity BodyForm's remaining unsupported positive glyph entries, and MindForm's discovery and projectile reductions;
  - Java's ref-counted `TimeStasis` and the purely visual `FireBall` blast ripple stay simplified.
