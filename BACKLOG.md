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
  - **Progress 2026-09-30, quest domain (Ghost):** `--stage ghost` runs the new `GhostRewardHarness` (120 cases: 40 seeds x depths 2-4), which replicates `Ghost.Quest.spawn()`'s RNG sequence minus the room/position loop (geometry-dependent draws the port places differently), and `tools/parityGhostRewardTrace.ts` diffs the spawn gate (`Random.Int(5-depth)==0`), `type = depth-1`, armor/weapon tiers and classes, the shared item level and the enchant keep against the port's gate composition + `ghostQuestReward()`: **612 fields match, 0 undocumented, empty `tools/parity/ghostreward-known.json`**. The stage forced four real v3.3.8 `Generator` deck fixes the port was missing: potion/scroll `defaultProbs2` second decks (fullReset Int(2)s), the absent TRINKET category (deck-seed chain), the v3.3.8 potion/scroll deck-1 tables, and `Weapon`/`Armor.random()`'s Long-seeded effect substream.
  - **Oracle tripwire resolved (2026-09-30, S6):** the deck fixes are covered by a backported oracle: `tools/parity/patchOracleDecks.mjs` applies the v3.3.8 deck draw sequence (second-deck Int(2)s, refill toggle, defaultProbsTotal branch, TRINKET deck-seed slot, effect substream; tables from the port MWL, zero stored SPD text) into the exported checkout tree at build time, wired into the stage with an idempotent skip (`--levelgen-tree` users run it themselves). `--stage levelgen` is green again: 28/28 TRACE-IDENTICAL, 28/28 structural parity. The 3 formerly-pristine failures went green too - the old port burned a spurious exotic-`Float()` per potion roll that neither side burns now.
  - Remaining: quest outcomes (Blacksmith reward/completion parity and Imp completion behavior; Imp's Java-generated ring now rolls at spawn and persists through save/load; depth 18 variant and token-count persistence match Java) - the Wandmaker's quest
    type and the Ghost gate+reward are covered by the stages above) and boss transitions (Goo, Tengu, DM-300, Dwarf King, Yog phase
    changes) have no Java-side trace yet.
  - **Scoping note for the boss-transitions domain (2026-09-27, read before starting it):** both sides are blocked
    for a node-only stage, and the blockers are structural rather than missing code. *Java*: the transitions are
    interleaved with presentation a headless harness cannot satisfy - `Goo.doAttack()`'s non-visible branch calls
    `((GooSprite)sprite).triggerEmitters()`, `Goo.act()` calls `sprite.idle()` when it drops out of HUNTING with
    `pumpedUp > 0`, `Goo.attackProc()` hits `enemy.sprite.burst(...)` on one attack in three and then
    `PixelScene.shake(...)`, `DwarfKing.damage()` phase 3 writes `sprite.showStatus(...)`, and v3.3.8 has no
    `Mob.chooseAbility()` to call instead (zero hits in the tag). *Port*: the phase fields (`kingPhase`,
    `dmSupercharged`, `yogPhase`, `tenguPhase`) live in scene-side modules (`combatState.ts`, `floorState.ts`,
    `pourAuras.ts`, `deathBursts.ts`), not in the pure `simulation/*Boss.ts` planners those rows cite - the planners
    cover ability and wave *choices*, not the phase change - so `tools/parity*Trace.ts` has nothing pure to drive
    either. The two-sided shape that follows: (a) a Java harness that constructs real sprites for the boss and the
    hero under the launcher (the `MobDataHarness` launcher already boots the Gdx context) and adds them to a `Group`
    so `sprite.parent` exists, plus a stub or FOV gate for `BossHealthBar`/`GLog`; and (b) a B6-style extraction of
    each phase transition into a pure seam, the way `mobLootChance()` did for the loot decision. Both halves are
    needed - neither alone gives a comparison.
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
    displacement effects. Progress 2026-10-01 (T54/B7): Grim execute (`grimExecuteChance`: `(0.5 + 0.05 x level) x arcana` vs missing-HP-fraction squared, `Char.damage()` GrimTracker block) and Corrupting conversion (`corruptingProcChance`: `(level+5)/(level+25) x arcana`) now resolve in the seam with all four scene sites (hero path + Shockwave mirrors) delegating, pinned by the extended `verifyEnchantProcChances.mjs` (values, delegation, whole-file no-duplicate gates). Remaining: other weapon/defender procs and attack event outcomes are still scene-coupled.

## B9. Armor-ability residuals

- [ ] Fine-grained armor-ability residuals, each recorded in its own `PORT_COVERAGE.md` row:
  - ShadowClone's remaining gear-proc shares (AntiMagic/Viscosity ported 2026-09-30 (B9-a): CLONED_ARMOR-gated clone shares in the shared damage dispatch, clone-owned deferred pool paid out on ally turns). The `CityLevel.Smoke` pour is already implemented and documented in its coverage row: 5 particles/s, black 2-second lifetime, Java emitter bounds, with only velocity distribution simplified;
  - CursedWand's VeryRare tier (`v4.0.0`, all eight effects dispatched 2026-09-29; remaining model and presentation simplifications are documented in its coverage row);
  - Trinity BodyForm's remaining unsupported positive glyph entries, and MindForm's discovery and projectile reductions;
  - Java's ref-counted `TimeStasis` and the purely visual `FireBall` blast ripple stay simplified.
