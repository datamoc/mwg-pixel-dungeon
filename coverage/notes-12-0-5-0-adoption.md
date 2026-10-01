# Port coverage notes: `mwg` 0.5.0: `core.ReactionTable` adoption (2026-09-09)

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## `mwg` 0.5.0: `core.ReactionTable` adoption (2026-09-09)

`mwg` bumped 0.4.2 -> 0.5.0 (`package.json`, already installed - `node_modules/mwg/package.json`
confirms `0.5.0`). This release ships `ReactionTable<TState>` (`mwg/core`): edge-triggered
`{id, when, action, once?}` rules evaluated against a state snapshot, firing `action` the
moment `when` turns true and (for `once: true`) never again - the framework's own doc comment
uses "a boss entering phase two" as its worked `once: true` example, which is close to a
literal description of `takeKingTurn`'s existing shape.

Adopted for DwarfKing's three real one-way transitions - P1->P2 at an HP threshold, P2->P3 at
shield-zero, and P3's one-time "losing" yell under 20 HP - previously three separate hand-rolled
latches (phase-gated `if` blocks for the first two, a standalone `kingLostYell` boolean for the
third). Now `kingPhaseRules(king)` builds three `ReactionRule<Creature>`s closing over that
specific King instance, and `takeKingTurn` calls `king.kingReactions ??= new
ReactionTable(this.kingPhaseRules(king))` then `.check(king)` once per turn before the
phase-behavior dispatch (which still reads `king.kingPhase` directly - only the *transition
detection and one-shot side effect* moved into the table, not the ongoing per-phase behavior
itself, which stays as plain code since it isn't an edge-triggered event).

Because `ReactionTable` is a stateful class instance rather than plain data, adopting it also
required extending this port's own save/restore path (which serializes `Creature` via an
explicit field list, not a generic `JSON.stringify`): a new `SavedCreature.kingReactionsState`
field holds `ReactionTable.toJSON()`'s `{active, spent}` shape, and `restoreFloor` reconstructs
the table via `ReactionTable.fromJSON(this.kingPhaseRules(creature), saved.kingReactionsState)`
using the same rule-builder a fresh King uses. `combat.ts`'s `kingLostYell` field was removed
entirely (superseded by the table's own `spent` tracking).

Live-verified via `chrome-devtools-mcp`: all three transitions fire exactly once each in
sequence (P1->P2, P2->P3, losing yell), a second `takeKingTurn` call with deliberately
out-of-range state (`hp` set far above any threshold) does not revert or double-fire an
already-spent transition, HP recovering above 20 and dropping again correctly does *not*
re-fire the spent losing-yell rule (true `once` semantics, not mere edge-triggering), a fresh
King has no reactions table until its first turn (lazy construction), and a full
`saveRun()`/`loadRun()` round-trip preserves phase and every fired-rule id exactly
(`{active, spent}` identical before and after). `tsc --noEmit`/`npm run build` clean throughout.

Brute's `hasRaged` one-time revival (`main.ts`, near the death-check in `attack()`) is a
smaller, single-rule instance of the same shape, identified but not converted this pass - a
single boolean flag guarding one `if`, lower value than the King's actual multi-rule state
machine. A reasonable next candidate if further `ReactionTable` adoption is wanted.

**Re-verified directly against real Java source (2026-09-09)**, using the local SPD checkout at
`~/dev/shattered-pixel-dungeon` (tag `4.0.0-beta`) - not available earlier in this session, so
this closes a gap where "matches Java" had been asserted from this repo's own prior citations
rather than freshly re-derived:
- `DwarfKing.java:495-500`: P1->P2 fires at `HP <= (challenged ? 100 : 50)`, clamps HP to that
  threshold, `Buff.affect(this, DKBarrior.class).setShield(HT)`, kills every existing subject,
  detaches `LifeLink` - the port's `kingPhaseRules` matches on every point except `LifeLink`
  (already documented elsewhere as unmodeled, not new).
- `DwarfKing.java:519-521`: P2->P3 fires at `shielding() == 0`, sets `summonsMade = 1` - exact
  match.
- **Found by this re-verification, not previously documented**: real Java's losing-yell
  condition is `phase == 3 && preHP > 20 && HP < 20` - checked *every time damage lands*, with
  no permanent lock, so a King that ever healed back above 20 and dropped below again would
  yell a second time. This port's `kingLostYell` flag (now `ReactionTable`'s `once: true`)
  fires once *ever*, not once *per crossing* - a real semantic difference, though practically
  unobservable since nothing heals the King in either version. Pre-existing (the flag predates
  this session's `ReactionTable` refactor), now honestly documented rather than assumed to
  match.
- `DM200.java`'s `canVent`/`zap()`: vent roll `Random.Int(100/distance(enemy)) == 0`, cooldown
  `30`, gas seeded `20`/cell along the path plus `100` at the endpoint - `dm200VentAttempt`/
  `ventDM200` match exactly (the already-documented "no closing-distance-failed retry" gap is
  Java's own fallback-vent-if-can't-move-closer branch, still unmodeled, not new).
- `Necromancer.java:180,193`: skeleton heal `HT/5`, Adrenaline duration `3f` - `necromancerRangedTurn` matches exactly.
- `Brute.java:105` and `BruteRage.act()`: enrage shield `HT/2 + 4`, decay `4` per turn (times an
  `AscensionChallenge` modifier this port doesn't model, already documented) - matches exactly.

No new formula/value bugs found in this direct re-verification; the one real finding is the
losing-yell edge-trigger-vs-once-lock distinction above.

**Bug found and fixed 2026-09-25 (King combat crash):** the `ReactionTable` adoption above
attached `king.kingReactions` directly to the `Creature` object. That is a stateful class
instance holding live rule-closure functions (`when`/`action`), and mwg's
`SimulationRuntime` journals every dispatched `'attack'` command via `structuredClone` -
the command payload carries the full live `attacker`/`defender` `Creature` objects
(`src/adapters/gameSimulation.ts`), not a stripped copy. Once `kingReactions` existed on the
King (lazily built on its *first* turn/damage event), every subsequent attack *against* the
King threw a real `DataCloneError` ("could not be cloned") from inside `resolveHeroAbilityAttack`
- the King was effectively unfightable past the opening exchange, in real play as much as in
any test, and this had gone undetected because every earlier verification of this feature
(the `ReactionTable` adoption note above, the live King fights in the boss-transition matrix)
happened to check state/phase transitions directly rather than running a sustained real melee
exchange long enough to dispatch a second post-reaction-table attack command through the
journaling path. Found via a scripted `playwright-core` live fight (teleport to depth 20,
trigger the King, repeated real `takeHeroTurn` melee swings) - the first hit was clean, the
King survived it (building the table via `kingDamageHook`), and the very next swing crashed.
**Fixed:** `kingReactions` no longer lives on `Creature` at all (removed from `combat.ts`);
it moved to `DungeonScene.kingReactionsFor`, a `Map<creatureId, ReactionTable<Creature>>` kept
alongside `spriteFor` for the identical reason (per-creature state that must not be part of
the plain, clonable creature record) - `kingDamageHook`/`takeKingTurn` now go through a shared
`kingReactionsTable(king)` accessor that gets-or-lazily-builds the entry, and the save/restore
sites in `coreSpawnTiles.ts` read/write the same map instead of the removed field. Re-verified
live: a full 3000-turn scripted melee fight against a fresh depth-20 King (Warrior, starting
gear) now runs start to finish with zero errors, HP dropping from 300 to 47 with no crash at
any point past the first hit. The same scripted-fight method was run against all five bosses
(Goo, Tengu, DM300, King, Yog) after the fix, each via real per-turn `takeHeroTurn` combat, not
an instant kill: Goo died in ~23 real turns confirming the full death/unseal pipeline; the
other four all took sustained real damage with zero errors within the test's turn budget
(a base-gear Warrior's melee alone isn't expected to drop a 200-400 HP boss with defenses in a
bounded turn count - the point of this pass was confirming no crash exists anywhere in the
attack-resolution path against any boss, which it now does). `npx tsc --noEmit`/`npm run build`
clean.










 | `SandalsOfNature`/`SandalsOfNature.Naturalism` (`items/artifacts/SandalsOfNature.java`, tag `v3.3.8`) | `src/items/sandals.ts` (the artifact's scene-free rules), `useSandals`/`openSandalsSeedPicker`/`feedSandalsSeedPick`/`beginSandalsRoot`/`confirmSandalsRoot` in `src/scenes/dungeonScene.ts` (both actions need the scene's own picker and aiming seams), `trampleHighGrass`'s charge hook, `itemDisplayName`'s level-name ladder, the `sandals*` effect rows and the `sandalsSeedReqs` table in `item-rules.mwl`, the `sandals` item id | **Ported (2026-09-15), the tenth real artifact this port implements** (after Cloak of Shadows, Timekeeper's Hourglass, Chalice of Blood, Cape of Thorns, AlchemistsToolkit, LloydsBeacon, MasterThievesArmband, HornOfPlenty, EtherealChains) - replacing a stand-in whose whole body printed the item's own name. Charge is Java's: `chargeCap = 100`, `levelCap = 3`, and `Naturalism.charge()`'s `(3+level)/6` per trampled high grass scaled by the energy-ring multiplier, banked in whole units onto the integer `charge` (with `partialCharge` the float build-up), gated on `!cursed && !MagicImmune` exactly as Java gates it. `AC_FEED` opens the generic item picker, whose second stage is Java's own `WndBag` filter (`canUseSeed`: a carried seed the footwear does not already hold, and - at the cap - not the currently attuned kind either); each pick consumes one seed unit, attunes its kind, and prepends it to the banked list, and the list reaching `3 + level()*3` clears it and raises the artifact one level, which is its only way to level. `AC_ROOT` aims through `beginAiming` (`range` 3, line of sight required, plus a `validate` requiring the cell be currently visible - Java's `heroFOV[cell]`), then plants the attuned seed at the aimed cell through the same `placePortedFeature`/`manualPlants` pair `plantSeed()` uses and immediately activates it on the cell's occupant, routing to the port's existing non-hero plant half (`triggerMobPlantAt`) for a creature and its hero half (`triggerPortedPlantAt`) when the hero aimed at himself; the charge spent is that seed's own requirement (`sandalsSeedReqs`: Rotberry 8, Mageroyal/Fadeleaf/Blindweed 12, Firebloom/Swiftthistle/Icecap/Stormvine/Sorrowmoss 20, Earthroot/Starflower 40, Sungrass 80), the hero's invisibility is dispelled, and a turn is spent. The item renames itself through SPD's own `name_1`/`name_2`/`name_3` keys (sandals -> shoes -> boots -> greaves of nature), resolved in `itemDisplayName`. **The same pass had to implement `HighGrass.trample`'s naturalism-scaled loot rolls** (see that row) - they read the same `naturalismLevel`, so the artifact could not be ported without them. **Simplified**: Java's cell selector accepts *any* cell and then refuses one that is invisible or beyond 3 tiles with its `out_of_range` line; this port's `beginAiming` needs a finite range, so an out-of-range cell simply cannot be aimed at (the same "the picker only ever offers legal cells" shape `useChains`/`useBeaconArtifact` document), and `confirmSandalsRoot` keeps Java's two clauses as a defensive re-check. **One more presentation divergence**: a *cursed* pair makes Java list no actions at all and log nothing, while this port (having no action menu through which the absence could be read) says the artifact's own `desc_cursed` line instead - a silent tap would be indistinguishable from a broken one. Where Java has a line, the port uses Java's: `no_effect` when nothing is attuned and `low_charge` when the charge is short. **Ported (2026-09-21)**: an empty-cell root now runs Java's `Plant.activate(null)` effects - Firebloom seeds Fire, Rotberry seeds ToxicGas, and Dewcatcher/Seedpod scatter their loot immediately; `Artifact.artifactProc` (Java hands it the seed's own charge requirement, but the method reads neither that nor `visiblyUpgraded()`: it runs three talent procs - the Priest subclass detonating an Illuminated target for `5 + hero.lvl`, the Cleric's SearingLight, the Huntress's Sunray blindness roll - and this port has none of those three talents, which is the accurate reason it is not called, rather than the "deals no damage" claim an earlier draft of this row made); the external `Artifact.charge(Hero, amount)` boost (`partialCharge += 2*amount`), which has no caller here; and the presentation layer Java's root/feed paths use - seed colours on the `Splash`, the item's own `glowing()` tint, the leaf-burst particles and the PLANT/TRAMPLE samples - since this port has no per-effect audio or item-glow seam (the planting path reuses the port's own planting log line, with SPD's real localized plant name). Browser-verified live (`tools/scratch/sandals-livecheck.mjs`, 18/18 assertions, plus a screenshot of the picker): two tramples of high grass at +0 banked exactly one charge and converted both cells to plain grass; a cursed pair banked nothing; the picker's two rows rendered as SPD's own `NOURRIR`/`ENRACINER` in French under the item's real level name; three feeds levelled the footwear to "chaussures de la nature" and emptied the banked list; a kind already banked stopped being offered while the other two still were; and a root aimed one cell away planted the attuned `icecap` at that exact cell (`manualPlants` + the `plant:icecap` feature), spent exactly its 20 charge, dispelled a 12-turn Invisibility, while an aim past 3 tiles could not be confirmed at all and spent nothing. `tools/verifyItemWorkflows.mjs` pins the authored seed table to Java's `seedChargeReqs` and covers the charge economy, the feed thresholds and the root gate headlessly. |











`VaultSentry` NPC + the vault branch (`VaultLevel`, `levels/rooms/quest/vault/*`, `CrystalKey`, `VaultFlameTraps`) | Unported: no spawn kinds, no room tables, no quest state (absence pinned in `test:simulation`) | Not ported (2026-09-21, closing the last open NPC): Java's `actors/mobs/npcs/VaultSentry.java` is a `WardSprite` NPC with `IMMOVABLE`, scan geometry per room (`scanWidth`/`scanLength`/`scanDirs`/`scanDirIdx`) and cooldowns (`curCooldown = 1`, `afterScanCooldown = 1`, `scansAfterCooldown = 1`, `giveWarning`), whose `act()` sweeps a `ConeAOE` over the current scan slice - hero found means `showStatus(NEGATIVE, "!!!")` plus `ZAP`, every other visible cell a `CheckedCell` effect, collective SFX throttled to 80ms, and a red `TargetedCell` warning pass while `curCooldown == 1`; full immunities plus invulnerability to everything, `interact()`/`reset()` true, `throwItems()` on death, Bundle keys `scanwidth`/`scanlength`/`scandirs`/`scandiridx`/`curcooldown`/`afterscancooldown`/`scansaftercooldown`/`givewarning`. It only ever spawns from the twelve `vault/*` quest rooms (plus the `treasure` subdir) on the crystal-key `VaultLevel` branch - none of which this port generates - and its presentation needs NPC `ConeAOE` targeting visuals this port has no equivalent for. Porting the mob alone would be dead code that can never spawn, so it stays out with its whole branch. |
### Current correction: EnhanceBomb

The ten `Bomb.EnhanceBomb` ingredient/result pairs are now executable through the authored
alchemy picker. The base blast follows Java's own `explosionRange()` per subclass (1 for a plain
bomb, 2 for Frost/Fire/Flashbang/Shock/Woolly/Holy/Noisemaker, 3 for Regrowth, 8 for Shrapnel),
and Regrowth, Arcane and Shrapnel no longer receive it at all - all three override
`explodesDestructively()` to false in Java, so giving them the base blast was an undeclared
divergence. Arcane then rolls its own armor-piercing `NormalIntRange(4+scalingDepth,
12+3*scalingDepth)`, Shrapnel the same roll minus the target's armor out to Chebyshev 8 (Java shadow-casts the FOV; the port has no blast-centered FOV service - recorded open 2026-09-19),
and Regrowth heals (through the ordinary `PotionOfHealing.cure()`/`heal()` pair, hero only - the
port has no standing ally side) instead of damaging anything; healing every monster in the area
was a plain bug. Holy's bonus is Java's own `Math.round(NormalIntRange(scalingDepth+4,
12+3*scalingDepth) * 0.5f)` (the previous 5+depth..10+2*depth range was invented), and Frost,
Fire, Flashbang, Shock and Woolly still reuse the existing chill/fire/status/sheep seams. Every
one of these effects deliberately uses a Chebyshev circle where Java builds a PathFinder distance
map or a ShadowCaster field of view, shared statuses rather than Java's exact blob/bolt/blindness
subsystems, and three sheep rather than the real spawn field and lifetimes. Noisemaker's own fuse
is now ported (`tickBombFuses`): its 2-turn fuse arms the alarm instead of exploding, an armed
unit detonates as soon as any character stands on its cell, it re-screams every 6 acts, cannot be
picked up or snuffed once armed, and keeps acting through a Timekeeper freeze
(`NoisemakerFuse.freeze()`). Its scream reuses the port's `Mob.beckon(pos)` stand-in, so it wakes
and turns the level's mobs instead of sending them to the bomb's cell, and the Java alert
sound/scream particle are not reproduced; the state (`noisemakerArmed`/`noisemakerAlertIn`) rides
the heap payload and so survives save/load. Picking up any lit bomb now snuffs it, not only a
plain `bomb` (a lit specialty bomb used to keep its `fuseTurns` in the bag). The crystal
(open residual moved to `ROADMAP.md` R062) GooBlob and
MetalShard identities are authored, their Java value/energy metadata is represented, and
Goo/DM-300 now drop 2/3/4 materials with the real 60/30/10 distribution. The port's
one-item-per-cell placement is a documented heap simplification.

**2026-09-19 correction: ShockBomb out, SmokeBomb in.** The ten pairs above matched the live
checkout's Java tree, which predates `v2.5.3` ("buffed all alchemy bombs" deleted
`ShockBomb.java`; `4.0.0-beta` still has no ShockBomb). At tag `v3.3.8` the map reads
invisibility -> `SmokeBomb` and recharging -> `FlashBangBomb`, both cost 2, and the recipes now
match that: `enhanceBombSmoke` (bomb + invisibility) and `enhanceBombFlashbang` (bomb +
recharging). The `smokeBomb` id replaces `shockBomb` everywhere (item, specialty category,
`value()` 60 = `quantity * (20 + 40)`); a save carrying the old id still loads (bag payloads
are id-tolerant) but the fossil no longer brews, throws, or detonates. Its blast is the shared
`super.explode()` plus `SmokeScreen` 40 per distance-2 flood cell *including* the center, with
the unplaced share of the 1000-volume budget piled onto the center on top of its own 40
(`smokeBombSeedPlan`, center total 40 plus remainder - pinned in `test:simulation`). The fog itself is a persisted blob advancing
through the shared diffusion, and its whole game effect is sight: `pruneSmokeFromSight` /
`smokeBlocksSight` mirror `Level.updateFieldOfView` (smoke strictly between viewer and target
blocks; smoky endpoints stay visible) for the hero's merged sight, ordinary-mob `seesHero`
and ally-target queries, the necromancer's skeleton placement, and the fist-teleport search -
allies keep their unpruned `allyFov` exactly as Java exempts them (no geomancer kind exists
to exempt). The ray is MWG's Bresenham `traceLine`, an approximation of Java's `ShadowCaster`
that only ever removes visibility, never adds it; like every gas here the cloud itself has no
tile art, so the closing fog is the feedback. Names live under `port.name.smokebomb` /
`port.desc.smokebomb` carrying SPD's own `v3.3.8` words in all 19 `PORT_STRINGS` locales
(byte-audited against the tag), because the generated catalogue still predates the swap and
has no `smokebomb` keys - they flip to `items.bombs.smokebomb.*` when it is re-extracted.
(open residual moved to `ROADMAP.md` R063) **2026-09-19 follow-up: the `ShroudingFog` exotic is ported too** - `potionShrouding` brewed from one `potionInvis` for 4 energy (`PotionToExotic`, value regular + 20 = 50, energy regular + 4 = 10, identified-state inheritance per `ExoticPotion.isKnown`), quaffing shatters Java's 180-per-cell NEIGHBOURS8 ring with the center top-up into the persisted `SmokeScreen` blob (`Potion.apply()`'s own default is `shatter(hero.pos)`; Java logs nothing on the shatter, so neither does this). Transmutation flips it back to `potionInvis` (`exoToReg`) without joining the random deck.
**2026-09-19 follow-up: the flashbang rework is ported too.** The daze is gone; every char in
the flood takes a fresh `NormalIntRange(4 + depth/2, 6 + depth)` quartered as `Electricity`
damage (armor-piercing, like Java's raw `damage()` call) plus a `Paralysis` prolong, with no
LOS gate. Two reductions ride along: the prolong lands the port's 3-turn paralysis rather
than Java's 10 (global buff-table reduction), and the Ring-of-Elements electric resistance
the blob path models does not reach the bomb adapter. Name/desc move to
`port.name.flashbang`/`port.desc.flashbang` carrying SPD's own `v3.3.8` `flashbangbomb` words
in all 19 locales (byte-audited like the smoke keys - the catalogue still ships the
pre-`v3.3.8` blinder text), and `value()` moves 15 -> 50 (`quantity * (20 + 30)`), pinned in
`test:items`.
Type-check/check/build/item/simulation suites green; browser verification owed per ROADMAP.md
section 10.
