# Backlog: open epics

**Only open points live here.** Anything closed - a finished step, a progress note, a closed epic - is history and lives in
`CLOSED.md` (see its "Backlog progress log", which carries the full text of every `Bn` section as it stood on
2026-09-26, including each epic's slice-by-slice progress). When a box below closes, move its section to `CLOSED.md` and
delete it here; do not leave progress narrative in this file.

These epics were moved out of `ROADMAP.md` on 2026-09-24 because none is closable by one finite change (parity harness,
incremental refactor, matrix production). Open items that used to sit in `PORT_COVERAGE.md` rows are tracked in
`ROADMAP.md`'s "Open coverage items" register, not here.

B1 (the parity harness) closed 2026-09-26 (T55): `tools/parity/` (`npm run parity:java`), history in `CLOSED.md`. B2 (RNG call order for level/item/monster/quest generation) closed 2026-09-26 (T56) and moved to `CLOSED.md`. Its coord task T56 was closed the same day.
B9's coord tasks are T159 (residuals, re-filed after T18-T21 were cancelled as duplicates of T46-T48); the register check is T160.

## B3. Verify loot, quest outcomes, boss transitions and save/load state

- [ ] Verify loot, quest outcomes, boss transitions, and save/load state. **Complexity: L.** extends `tools/parity/` (see its README, "Extending it").
  - **Progress 2026-09-27, save/load and mob tables (T57):** `npm run verify:saveload` (Chrome and Firefox: five floors incl. two boss floors, save/load/save fixed point, fresh-page resume) found and fixed four real bugs (duplicated floor items and resurrected keys on every revisit/load, keys re-queued to the floor below, secret doors revealed by loading, a stale ritual site crashing a first visit) - see the coverage row "Floor restore on revisit and load". The `mobdata` stage diffs every Java mob class against the monster/loot tables (440 field checks, 8 documented differences) and corrected RotLasher DR to 0-8.
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
    each run with `resetPortedRun()` + `primeRunState()` and compares `wandmakerQuestType()`. **36/36 lines agree**
    across the four seeds, covering all three variants they roll (corpse dust x5, embers x1, rotberry x1). The
    **Blacksmith** quest is deliberately not walked: it rolls in `CavesLevel.initRooms()` at depths 12-14, and the
    levelgen oracle checkout predates v3.3.8's CRYSTAL/GNOLL/FUNGI trio (it has a boolean `alternative` instead of
    a `type` field), so that half needs a harness which compiles against v3.3.8 - `LevelGenHarness` currently does
    not (`Terrain.SIGN` and a `HashSet` inference error are the two it trips over).
  - Remaining: quest outcomes (Ghost/Blacksmith/Imp reward generation and completion state - the Wandmaker's quest
    type is covered by `--stage quest` above) and boss transitions (Goo, Tengu, DM-300, Dwarf King, Yog phase
    changes) have no Java-side trace yet.

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
  - Remaining: whatever of the attack tail is not yet in `simulation/` (the hit/damage roll pair, the defender-side
    `damage()` overrides and the executes are extracted; see the log for the current seam list).

## B8. Analysis matrices for the remaining families

- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/buff families before migrating
  each one's code, per SPD-ADR-010. 45 matrices exist (monsters and the named item families are covered).
  - **Progress 2026-09-26, forty-fifth matrix:** `garbage/MONSTER_ANALYSIS_MOB_LOOT.md` walks all 31 `monsterLoot` rows
    plus the seven drops the port keeps outside the table against tag `v3.3.8`'s `loot`/`lootChance` fields and
    `createLoot()` overrides: every chance matches Java's literal, and the two rows that do not reproduce Java's
    behaviour (`gnollTrickster`'s `Category.MISSILE` drop and the Evil Eye's 2/1/1 dew-seed-stone roll) are registered
    as `ROADMAP.md` R073.
  - Remaining families (inventoried 2026-09-25): `talent-rules`, `challenges`, `classes` (hero kits), `alchemy`
    recipes, room and level generation (`room-rules`, `generator-decks`/`generator-tables`, `dungeon-rules`),
    the non-DoT half of `buff-rules`, a second artifacts matrix (only `ARTIFACTS_ONE` exists), and the generic
    Spell/alchemy-result spells.
  - Residuals recorded open by earlier matrices: the stick/drop split in `turnLoopAiming.ts` has no `sticky` filter (stone,
    club, hammer and force cube stick where Java drops them, and Warriors always drop); `FishingSpear.proc()`'s Piranha
    `HP/2` guarantee has no hook; `pickupDelay()` is not modelled. The two FUNGI actors are what the Blacksmith mine-roster
    pin still leaves unported.

## B9. Armor-ability residuals

- [ ] Fine-grained armor-ability residuals, each recorded in its own `PORT_COVERAGE.md` row:
  - ShadowClone's remaining gear-proc shares and the `CityLevel.Smoke` pour;
  - CursedWand's eight VeryRare scene effects (the catalog is represented in `simulation/cursedWand.ts`; the tier is rolled
    at Java's 1% but deliberately dispatches nothing until each effect exists);
  - Trinity BodyForm's remaining unsupported positive glyph entries, and MindForm's discovery and projectile reductions;
  - Java's ref-counted `TimeStasis` and the purely visual `FireBall` blast ripple stay simplified.
