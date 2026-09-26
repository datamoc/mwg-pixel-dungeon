# Backlog: open epics

**Only open points live here.** Anything closed - a finished step, a progress note, a closed epic - is history and lives in
`CLOSED.md` (see its "Backlog progress log", which carries the full text of every `Bn` section as it stood on
2026-09-26, including each epic's slice-by-slice progress). When a box below closes, move its section to `CLOSED.md` and
delete it here; do not leave progress narrative in this file.

These epics were moved out of `ROADMAP.md` on 2026-09-24 because none is closable by one finite change (parity harness,
incremental refactor, matrix production). Open items that used to sit in `PORT_COVERAGE.md` rows are tracked in
`ROADMAP.md`'s "Open coverage items" register, not here.

B2 (RNG call order for level/item/monster/quest generation) closed 2026-09-26 (T56) and moved to `CLOSED.md`.

## B1. Java-vs-TypeScript parity harness

- [ ] Compare both implementations with fixed seeds and identical action traces. **Complexity: XL.**
  - Remaining (from the T55 log in `CLOSED.md`): the TS half (`tools/parityCombatTrace.ts`, `npm run parity:combat`) and a
    scratch Java half agree byte-for-byte on 4 scripted bouts x 3 seeds, but the Java harness lives only as uncommitted
    scratch in a `v3.3.8` worktree and must be made reproducible; an armed-hero script is out of scope of the current
    seam (flat damage only, no weapon rolls); beyond `Char.attack()`, other action traces (movement, item use, boss
    transitions) have no Java counterpart yet.

## B3. Verify loot, quest outcomes, boss transitions and save/load state

- [ ] Verify loot, quest outcomes, boss transitions, and save/load state. **Complexity: L.** Not started; consumes the B1
  harness.

## B4. Screenshot and animation-timing comparisons

- [ ] Add screenshot and animation-timing comparisons for visual parity. **Complexity: M.** Not started.
  `tools/browserTest.mjs` (Chrome and Firefox screenshots of the built game) is the capture side.

## B5. Classify every remaining difference

- [ ] Classify every remaining difference as either an implemented Java behavior or an explicitly accepted platform/UI
  difference. **Complexity: M.** Consumes the harness output from B1, B3 and B4.

## B6. `SimulationRuntime` migration

- [ ] Wrap the per-domain rule functions (`simulation/combat.ts`, `movement.ts`, `heroActions.ts`, `heroTurn.ts`) behind one
  `SimulationRuntime<SpdGameState, SpdCommand, SpdEvent, Creature>`, migrating the scene's direct-mutation call sites
  (`attack()`, `moveTo()`, ...) to `dispatch()` one command type at a time, cheapest first, no big-bang (plan section 25).
  - Remaining: the commands not yet routed through a runtime; the inert per-runtime scheduler/random pairs
    (search, hunger, movement) still have to be reconciled with the scene's real ones, which waits for the first command
    with a real cost. What is already routed is recorded in `CLOSED.md`'s progress log.

## B7. Extract `attack()`'s pure resolution

- [ ] Extract the scene's `attack()` pure resolution (hit/damage rolls, weapon-affix/talent branches, event-worthy outcomes
  such as mimic reveal and displacement) from its presentation calls (sprite tint, audio cue, floating text); the likely
  vehicle for adopting `SimulationRuntime` (B6). **Complexity: L.**
  - Remaining: whatever of the attack tail is not yet in `simulation/` (the hit/damage roll pair, the defender-side
    `damage()` overrides and the executes are extracted; see the log for the current seam list).

## B8. Analysis matrices for the remaining families

- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/buff families before migrating
  each one's code, per SPD-ADR-010. 44 matrices exist (monsters and the named item families are covered).
  - Remaining families (inventoried 2026-09-25): `talent-rules`, `badges`/challenges, `classes` (hero kits), `alchemy`
    recipes, room and level generation (`room-rules`, `generator-decks`/`generator-tables`, `dungeon-rules`), `loot-rules`,
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
