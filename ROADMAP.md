# TypeScript parity roadmap

Goal: make the TypeScript game functionally equivalent to the Java Shattered
Pixel Dungeon implementation. Every completed item should be checked against
the corresponding Java source and recorded in `PORT_COVERAGE.md`.

## 1. Complete the item system

- [x] Wire `rollAffix`/`ENCHANT_TABLE`/`GLYPH_TABLE` into real item generation and equip.
      Found and fixed the same pass: `Actors.rollAffix` was never called anywhere, so no
      weapon/armor obtained through normal play was ever assigned a concrete enchant/glyph/curse
      id. `generatedInventoryItem` now rolls one via a new `rollGeneratedAffix` helper
      (curse-pool pick when `generated.cursed`, weighted good-enchant pick when
      `generated.hasGoodEnchant`), and `equipWeapon`/`equipArmor` gained the real cursed-and-known
      equip-lock rings already had. See `PORT_COVERAGE.md`'s "Enchant/glyph/curse assignment"
      row - **flagged there as implemented but not yet confirmed in a live browser session**
      (the sandboxed environment's local HTTP servers all fail to bind a socket), so treat this
      as needing a playtest pass before fully trusting it.
- [ ] Port all remaining weapons, wands, rings, artifacts, bombs, alchemy, and crafting.
- [ ] Port the remaining potions. `PotionOfLevitation` is now live (real buff + chasm bypass,
      matching the trap bypass Levitation already had); a live id-mapping bug that made
      generated `PotionOfLiquidFlame`/`PotionOfInvisibility` silently quaff as Purity is fixed.
      `PotionOfParalyticGas`/`ToxicGas`/`Confusion`/`Frost`/`Haste` remain unported (each needs a
      system this port doesn't have - a status-on-contact gas blob, a freeze effect, or a hero
      speed buff) - see `PORT_COVERAGE.md`'s potions row for what currently happens instead.
- [ ] Port the remaining scrolls. Fixed the same class of live id-mapping bug for
      `ScrollOfMirrorImage`/`ScrollOfMagicMapping` (both silently read as Remove Curse instead of
      their real, already-ported effects). `ScrollOfRecharging`/`Teleportation`/`Retribution`/
      `Terror`/`Transmutation` remain unported (each needs a system this port doesn't have) and
      still fall through to Remove Curse's effect when read - see `PORT_COVERAGE.md`.
- [ ] Port the remaining enchantments, glyphs, weapon curses, and armor curses. Only 4 weapon
      curses now lack proc logic at all (`friendly`, plus Kinetic/Blooming/Corrupting/Elastic/
      Projecting/Unstable's missing-subsystem group) - `polarized`/`sacrificial`/`displacing`
      gained real proc branches this pass, alongside the already-live `wayward`/`annoying`/
      `dazzling`/`explosive`. All 8 armor curses already have proc logic, and (this pass) all of
      it is now actually reachable through the assignment fix above.
- [ ] Implement weapon augments. **Blocked on a prerequisite**: `Weapon.Augment`
      (SPEED/DAMAGE/NONE) and the Swiftness enchant both trade off a per-weapon
      attack-delay economy that this port's hero turn model does not have (every
      hero action currently costs exactly one turn, so there is no delay to
      shorten/lengthen) - implement the fractional-turn-cost system first, or the
      damage half of Augment ends up half-ported against advice already recorded
      in `PORT_COVERAGE.md`.
- [ ] Implement complete weapon and armor tiers, transfer formulas, upgrade formulas, curse infusion, and degradation.
- [ ] Implement the remaining charm/knockback/stealth/blink/durability-per-hit
      subsystems the unported enchants, glyphs, and curses depend on (Kinetic's
      carried-damage buffer, Blooming's plant seeding, Corrupting's
      enemy-conversion, Elastic/Projecting's line-AoE geometry, and the
      charm/wand-drain/blink/durability mechanics behind
      Affection/AntiMagic/Brimstone/Camouflage/Obfuscation/Potential/Repulsion/Viscosity
      and the matching armor curses) - each needs its own system stood up before
      the enchant/glyph/curse itself can be anything but a stub.
- [ ] Replace simplified missile durability and wand recharge behavior with the Java formulas.
      Wand recharge is now Java-shaped (`10 + 40 * 0.875^missing`, with Recharging's bonus)
      and explicit charge refunds are separated from passive recharge; missile durability
      now persists a Java-shaped durability budget and decrements the stack only on break;
      PinCushion/item-specific recovery and missile upgrade levels remain.
- [x] Implement identification appearance randomization. Potion and scroll appearances are
      shuffled once per seeded run, pre-drawn without disturbing later gameplay RNG, and
      persisted through save/load.
- [ ] Implement full shop pricing, buyback shelves, and wealth modifiers. The live keeper now
      uses depth-scaled prices and retains sold stock in its buyback inventory; exact Java
      shop-room placement and wealth modifiers remain.
- [x] Implement Timekeeper's Hourglass sand-bag state and its level-generation effects. The
      identified/uncursed inventory state now follows Java's depth-specific shop percentages,
      sand bags upgrade and persist on the hourglass, and concrete item identities survive the
      level/save bridge; the active time-freeze action is now wired into the turn scheduler, while
      stasis, recharge cadence, and exact artifact presentation remain part of the broader
      artifact-system work.

## 2. Complete dungeon generation and regional content

- [x] Port regular-floor hand-placed decorations and unique rooms for Sewers, Prison, Caves, City, and Halls.
- [x] Port the remaining branch-level hand-placed layouts (the Blacksmith MiningLevel
      now has a generated 32x32 CaveRoom branch, working entry/return transition, remains
      position, save/load branch state, Java's standalone CavesPainter water/grass pass,
      Caves ore-vein sparkle visuals, pickaxe mining with Java timing/audio, and persistent
      cross-run Bones placement/consumption, the exact CAVES_QUEST border atlas, and the
      Blacksmith QuestEntrance custom tile; branch Bones now follows Java's seeded-gold versus
      normal-run eligible-loot selection with Java's equipment/backpack draw order; exact
      branch reward seeding and the source-confirmed absence of MiningLevel hazards are
      implemented and verified; the Blacksmith normal/Bat-blood
      quest variant now follows Java's run-level roll, persists through saves, and accepts
      15 DarkGold or a pickaxe stained by killing a Bat).
- [ ] Port all special-room item and monster generation, including missing RNG calls.
      `SuspiciousChestRoom` is now complete through its queued-prize/Gold roll, mimic gate,
      generated bonus prize, live mimic spawn, and death drop; remaining Generator-dependent
      room contents are tracked in `PORT_COVERAGE.md`; generated special-room drops now preserve
      their concrete Java class ids through the live bridge. `GrassyGraveRoom` now also preserves
      each Java Generator/Gold result class id in its tomb heap, Crystal rooms now expose
      playable reward families/mimics, `AquariumRoom` now spawns depth-scaled water-bound
      Piranhas with Java's meat drop, StatueRoom now carries generated enchanted weapon/
      armor payloads (including the armored variant) into live death drops, and
      `SacrificeRoom` now adopts a spreading sacrificial-fire blob, consumes creature EXP-like
      charge, and releases its concrete generated weapon reward when the fire is satisfied;
      MassGrave generated item/armor drops and CrystalVault mimic rewards now retain their
      concrete generated class ids through live death drops as well. Secret Maze weapon/armor,
      Artillery missile, Library scroll, and Laboratory potion rewards now retain their concrete
      generated class ids too; SuspiciousChest and Treasury mimics now retain their held item,
      and Secret Honeypot now preserves the Java Bomb-versus-DoubleBomb result and class id;
      generated bonus, and treasury gold drops on death.
-      Halls `DemonSpawnerRoom` now also uses the Java room placement and `HALLS_SP` custom-floor
      atlas through the live MWG sprite-sheet path; defeated spawners remain absent on revisit.
- [x] Preserve Java room-placed NPCs and special mobs through the live-game bridge.
- [x] Implement rare and alternative monster spawns. Regional 2.5% additions and Java's
      per-entry 1-in-50 alternative swaps (Albino, Caustic Slime, Bandit, Spectral
      Necromancer, Armored Brute, DM-201, Senior, and Acidic) now occur in the correct
      add-rare -> swap -> shuffle order, with distinct stats/loot identities and live
      combat hooks where the current buff model supports them.
- [ ] Implement signs, wells, chasms, crystal-door consequences, statues, plants, and mining branches
      (sign/well examination and awareness/health well effects, generated chasm falling, Java-aligned
      plant status effects and Sungrass movement-cancelled healing, queued crystal/iron keys,
      playable crystal-door unlocking, crystal chests now consume a crystal key before releasing
      their contents, and the basic MiningLevel branch are live; exact
      crystal-room content is now carried through Artifact-family rewards and crystal-mimic theft/return;
      exact crystal-room consequences and seed-growth/Lotus behavior remain (Swiftthistle now
      freezes automatic actors for the Java seven-time-unit window and queues delayed trap/plant
      presses until expiry);
      Pickaxe now mines ordinary
      Caves walls and real WALL_DECO veins, with only veins yielding DarkGold; the inventory Pickaxe
      MINE action now scans adjacent veins, converts them to WALL, awards DarkGold, and spends two turns;
      generated wells and plants now use MWG `FeatureLayer` for placement, one-shot interaction, and
      floor save/load while retaining SPD-specific consequences; chasm falling now also applies
      `Chasm.heroLand()`'s real Cripple application and HP/HT-scaled landing damage through the
      normal hero-damage absorption pipeline, correctly killing the hero on a fatal fall, and
      Levitation now bypasses chasms the same way it already bypassed traps - see
      `PORT_COVERAGE.md`'s `Chasm.java` row for what's still not ported there).
- [x] Implement Java's feeling-based water and grass branches; feeling selection and the
      CHASM/WATER/GRASS/LARGE/TRAPS/SECRETS branches are threaded through `PaintLevel` and
      the regional painters.
- [x] Resolve the previously observed room-generation edge cases and RNG
      divergences. The seed-42/depth-3 graph and retry counts now match Java,
      and the wider Sewers/Prison verification matrix is byte-for-byte aligned;
      the former attempts mismatch was traced to verifier run-state leakage and
      fixed by resetting Wandmaker state between seeds. Remaining paint-stage
      content RNG gaps are tracked with the affected room types in
      `PORT_COVERAGE.md`.
- [x] Port `ConnectionRoom`'s cosmetic `paint()` for all 6 subclasses
      (`TunnelRoom`/`BridgeRoom`/`PerimeterRoom`/`WalkwayRoom`/`RingTunnelRoom`/`RingBridgeRoom`)
      - their sizing/subclass selection and tunnel/bridge/chasm decoration are now wired
        through `rooms/standard/registry.ts` and `rooms/connection/paint.ts`.
- [x] Fix two real, user-reported bugs found by actually playing depth 1: the entrance-room
      tutorial seal (`SPDSettings.intro()`) was permanently on for every run instead of only a
      genuinely new player's first one (nothing ever set `guideIntroRead`/`guideSearchingFound`
      true - now persisted cross-run via `guideProgress`, satisfied by the real completion
      signal of successfully searching out the door); and `RegularLevel.createMobs()`'s
      entrance-room exclusion wasn't modeled on ported floors, so monsters could spawn directly
      in the first room. Both browser-verified live. See `PORT_COVERAGE.md`.

## 3. Port every boss level and boss script

- [x] Port the fixed Prison boss-floor layout at depth 10.
- [x] Port the fixed Caves/DM-300 boss-floor layout at depth 15.
- [x] Port the fixed City boss-floor layout at depth 20.
- [x] Port the fixed Halls/Yog boss-floor layout at depth 25.
- [x] Port the fixed final vault/endgame layout at depth 26.
- [ ] Port Prison/Tengu's full multi-stage arena transition and trap scripts (the one-time
      below-half relocation and trap burst are now live; floor shifting and exact ability
      cadence remain).
- [ ] Port Caves/DM-300's full pylon, gate, energy field, and supercharge scripts (pylon
      proximity sealing, short energy pressure, and overcharge ground effects are now live;
      rockfall/gas and exact pylon state remain).
- [ ] Port City/Dwarf King's throne and Imp-shop scripts (the live King summon/barrier
      cycle is already present; throne geometry and the conditional Imp shop remain).
- [ ] Port Halls/Yog's full fist, flame, shadow, and arena scripts (three fists now gate
      Yog's beam, with rotating burning/roots/cripple/daze pressure; flame/shadow arenas
      remain).
- [x] Port final-vault Amulet placement at Java's `AMULET_POS` (depth 26, x=8, y=12).
- [ ] Port final-vault endgame-specific terrain, custom visuals, and compass behavior.
- [x] Stop dungeon music on entry to the final vault, matching `LastLevel.playLevelMusic()`.
- [ ] Implement exact arena layouts, seals, pylons, boss phases, minions, traps, projectiles, movement scripts, and victory transitions.

## 4. Complete NPCs and quests

- [ ] Port Caves NPCs and quests.
- [ ] Port City NPCs and quests.
- [ ] Port Halls NPCs and quests.
- [ ] Implement the full Ghost quest reward generator.
- [ ] Replace the simplified Wandmaker quests with Mass Grave, Ritual Site, and Rot Garden.
- [ ] Port the Troll Blacksmith's mining and forge mechanics.
- [ ] Port Rat King and other missing special NPCs.

## 5. Improve monster behavior and loot

- [x] Fix `Brute`'s enrage: it was a stateless below-half-HP damage boost that never actually
      granted Java's real one-time near-death revival (a Brute could just be killed outright,
      something Java never allows). Now a genuine `hasRaged`/`raged`-gated revival with the real
      `HT/2+4` shield and flat 4/turn decay. Browser-verified live. See `PORT_COVERAGE.md`.
- [ ] Implement exact wandering, hunting, fleeing, and stealth calculations.
- [ ] Implement monster-specific AI overrides.
- [ ] **Implement ally-vs-monster combat.** Found this session while auditing the scroll branch
      against Java source: this port's monster AI has no concept of a non-hero target at all -
      every `takeMonsterTurn` decision hardcodes the hero as the only possible thing to attack
      or path toward. This blocks at least two real mechanics from ever being more than a
      documented stand-in: `ScrollOfMirrorImage`'s allied `MirrorImage` NPCs (currently a
      `heroBarrier` shield stand-in - see `PORT_COVERAGE.md`) and `ScrollOfRage`'s `Amok` status
      (currently unmodeled entirely, since an Amok'd mob attacking "anything nearby" needs
      something for it to attack besides the hero). Necromancer's summoned skeleton already
      fights monsters *for the hero's opponent*, so some of the shape may be reusable, but the
      hero-side case (something the player controls fighting alongside them) is new.
- [ ] Port all champion types and their effects.
- [ ] Implement blob area propagation, gas, and fire terrain.
- [x] Port the Necromancer's skeleton heal/Adrenaline/teleport support behavior - previously it
      had none at all (a summoned skeleton just fought alone forever). Now heals `HT/5` when
      hurt, grants a one-time Adrenaline (reusing the existing haste stand-in) if visible and
      already at full health, and teleports an out-of-sight skeleton back beside the hero
      instead of leaving it stranded. Remaining: the teleport destination is any free neighbour
      of the hero rather than Java's closest-and-in-sight pick, and `firstSummon`'s variable
      tick cost is blocked on the same fractional-monster-turn prerequisite as Weapon
      Augment/Swiftness above. Browser-verified live. See `PORT_COVERAGE.md`.
- [x] Port DM-200's hunting/venting override - previously it had no special behavior at all
      (plain melee attacker only). Now vents toxic gas along a line to the hero from range with
      the real distance-scaled odds, seed amounts, and 30-turn cooldown; the BFS-around-terrain
      reachability check and the closing-distance-failed vent retry are not modeled.
      Browser-verified live. See `PORT_COVERAGE.md`.
- [x] Port Spinner's ranged web ability - previously it had none at all (only the already-ported
      melee bite's on-hit root/cripple chance). Now roots the hero directly on a clear ranged
      shot, gated by the real 10-turn cooldown; real Java instead predicts movement direction and
      seeds a persistent 3-cell `Web` terrain blob rather than a direct debuff, not modeled here.
      Browser-verified live.
- [ ] Implement exact Tengu, DM-300, and other boss attack cycles.
- [ ] Port rare monster variants.
- [ ] Implement Java corpse, meat, gold, loot-stack, and limited-drop behavior.

## 6. Complete hero progression

- [ ] Implement exact formulas for the remaining talents.
- [ ] Implement rune transfer and shared-enchantment behavior.
- [ ] Complete subclass and armor-ability effects.
- [ ] Match Java talent timing, identification, recharge, and threshold rules.
- [ ] Complete class-specific item and ability behavior.

## 7. Replace simplified terrain and status mechanics

- [x] Implement area-of-effect traps instead of single-target approximations. Explosive traps
      now apply Java's reduced off-center blast damage to nearby creatures, while toxic and
      fire traps seed the live area effects; exact Java projectile presentation, terrain
      destruction, and cadence remain tracked as narrower follow-up gaps.
- [ ] Implement chasm falling and traversal.
- [ ] Implement water and terrain hazards.
- [ ] Complete plant growth and plant interactions (one-shot regional plant activation, Java-aligned
      single-target statuses, Sungrass healing-over-time, and Warden-sensitive variants are live;
      Icecap/Rotberry blob diffusion and Warden FrostImbue/AdrenalineSurge variants are live;
      Dewcatcher now releases 3-6 distinct adjacent dewdrops and Seedpod releases 2-4 generated
      seed stand-ins; exact teleport/TimeBubble behavior, seed growth/Lotus preservation, and
      full dew collection rules remain).
- [ ] Implement the remaining Java seed and dew behavior in high grass (actual seed payloads,
      growth timing, Lotus preservation, and exact waterskin/dewdrop interactions).
- [x] Match hunger and starvation damage exactly (`Hunger.act()`'s real `partialDamage`
      fractional accrual and crossing-into-STARVING 1-damage hit, replacing the former flat
      "every 10 turns" guess). Java has no attack-delay/accuracy penalty while merely hungry
      beyond the log line, so there is no further penalty to match there.
- [ ] Match stealth, invisibility, surprise, and attack-delay systems exactly.
- [x] Implement shield decay (`Barrier.act()`'s real `min(1,shielding/20)`-per-turn proportional
      curve now runs every hero turn against the shared `heroBarrier` pool - previously never
      invoked at all, so shields held indefinitely). Remaining gap: this port pools every shield
      source into one barrier, so Blocking's own separate fixed 5-turn cliff-edge `BlockBuff`
      expiry isn't modeled distinctly (tracked in `PORT_COVERAGE.md`'s Barrier-decay row); healing-
      over-time - Sungrass is live, other Java Health-buff variants remain.

## 8. Complete UI and input parity

- [ ] Port full inventory, bag, sub-bag, item-detail, and item-use windows.
- [x] Implement click-to-travel (`repeated movement`) - a player-reported bug: clicking a
      distant tile previously only produced a single step toward it, with no auto-walk at all.
      Now queues the target and walks the real pathfinder's route one step per turn via the
      existing `awaitHeroInput` hook, matching Java's real interrupt conditions (taking damage,
      or any awake hostile creature coming into sight - checked broadly, i.e. any such creature
      currently visible, rather than Java's narrower "newly seen" case) and cancelling cleanly
      on arrival or on any manual keyboard action. Browser-verified live: a clear 3-tile click
      walked the whole distance in one call; a click with a hostile monster already in view
      correctly refused to start rather than taking even one step. Cell targeting and path
      preview (the visual line/highlight while aiming) remain unported.
- [ ] Complete the journal UI and identification tabs.
- [ ] Port pause/menu chrome, boss banners, toast animations, and Java-style transitions.
- [ ] Implement large interface-size layouts.
- [ ] Port the hero information window, busy indicator, talent animations, and quick slots.
- [ ] Support armor-dependent hero portraits and complete sprite/effect animations.
- [x] Audit every static `t('port.*')` call site against `portStrings.ts`'s EN/FR tables. A
      script (walk `src/**/*.ts`, collect every literal `t('port.…')` call, diff against both
      locale objects) found 45 keys missing from EN and 47 from FR - all fixed this pass (window
      titles, victory/defeat screens, `port.action.bag`/`port.talent.*`, ~20 combat log lines
      including `bossinfo`/`grim`/`lucky`/`kingbarrier`/`yogbeam` and more - the raw key string
      was rendering in place of real text for all of them). Also fixed two French-specific bugs
      a player caught live: "bolt" was mistranslated `trait` instead of the correct `carreau`
      (crossbow-bolt-specific), except the GreatCrab's generic parry line, which blocks any
      projectile and correctly stays `projectile`; and "{who} vous rate/touche" was restructured
      subject-first to avoid a bare "de {who}" that reads as broken French for any non-proper
      monster name (needs "du"/"de la"/"de l'" agreement `{who}` can't supply on its own).
      Followed up the same session: the audit script only catches literal `t('port.…')` string
      arguments, so the dynamic template keys (`` t(`port.armor.${option}`) ``/
      `` t(`port.subclass.${option}`) `` for the armor-ability/subclass choice UI) needed a
      manual check - all 12 possible ids across `ARMOR_OPTIONS`/`SUBCLASS_OPTIONS` were missing
      from both locales too (the entire level-13/21 choice window showed raw ids), now fixed and
      browser-verified live.

## 9. Build the Java-vs-TypeScript parity harness

- [ ] Compare both implementations with fixed seeds and identical action traces.
- [ ] Verify RNG call order for level, item, monster, and quest generation.
- [ ] Verify combat rolls, damage, status effects, and turn timing.
- [ ] Verify loot, quest outcomes, boss transitions, and save/load state.
- [ ] Add screenshot and animation-timing comparisons for visual parity.
- [ ] Classify every remaining difference as either an implemented Java behavior or an explicitly accepted platform/UI difference.

## 10. Close the browser-verification debt

Several already-implemented sections in `PORT_COVERAGE.md` are documented as
formula-correct but never actually seen rendering, because the Chrome
extension was disconnected during the session that built them. Per this
project's `CLAUDE.md` ("type-checking and a successful build are not evidence
the feature actually looks/behaves right in-game"), these need a real
browser pass before they can be treated as done rather than merely built:

- [ ] Visually confirm non-English locale rendering (font coverage for
      non-Latin scripts in particular - a CJK locale is the one most likely
      to show tofu from a missing glyph; the i18n check only proves keys
      resolve and interpolate, not that text fits its widget or that a font
      covers a script).
- [ ] Re-confirm the UI/presentation section's widgets in a live session
      (status pane, bars, floating text, compass, coloured log, boss health
      bar, badge banner, inventory `ListView`) now that a browser is
      available again - some of these were already spot-checked individually
      in later passes, but the section as a whole was last marked "nothing
      here has been looked at."
- [ ] **Unresolved, flagged rather than silently dropped or guess-fixed**: a live browser
      session surfaced `TypeError: Cannot read properties of undefined (reading 'frame')` from
      `spawnMonster` -> `spawnPortedMobs` -> `enterLevel`, reached from a scene-transition
      callback (`applySwitch`/`frame` in the stack) well *after* a batch of direct scene-method
      test calls had already returned correct results on the same page load. `spawnMonster`'s
      sprite lookup depends on `runState.sprites[kind]`, populated by an asset-preload step a
      real player waits behind a loading screen for; the test harness dispatches synthetic
      pointer events in rapid bursts with no such wait, so the leading theory is a load-order
      race specific to that unnatural pacing, not a reachable-through-normal-play bug - but this
      was not confirmed either way. Reproduce under normal human-paced play (or a scripted wait
      for the loading screen to clear) before deciding whether this needs an actual fix.

## 11. Architecture refactor toward the v3 target

This section tracks structural work, as distinct from the Java-parity work above. See
`SPD_ARCHITECTURE_TARGET_V3.md` for the target architecture (Command -> State + Events
simulation, renderer-free `EntityId`-addressed actors, event-driven presentation, data/
function/method-driven business families instead of Java-class transposition) and which
parts of it are blocked on `mwg` capabilities not yet released versus actionable now.
`SIMULATION_ARCHITECTURE.md` tracks the actual extraction steps taken so far (turns, combat,
buffs, hero actions, movement) and the next planned one (Step 6: local `EntityId` + an actor
view registry, replacing `Creature.sprite`/object-identity lookups).

- [x] Step 6: give every `Combatant`/`Creature`/`GroundItem` a stable id
      (`simulation/entityId.ts`), and move `sprite` out of `Creature`/`GroundItem` into a
      `spriteFor` view registry keyed by that id (see `SIMULATION_ARCHITECTURE.md`'s "Step 6").
- [x] Produce the section 22A/22B data/function/method analysis matrix for one monster family
      (Rat/Snake/Crab/Goo, see `MONSTER_ANALYSIS_RAT_SNAKE_CRAB_GOO.md`) before any class-level
      monster refactor, per SPD-ADR-010.
- [x] **`mwg@0.4.1` shipped `core.EntityRegistry`/`EntityId`, `simulation.SimulationRuntime`
      (the plan's actual Command -> State + Events + cost + snapshot runtime), and
      `core.PresentationQueue`** - the single biggest unblock since this section was written.
      Pin bumped (`package.json`), full verification suite re-run (type check, build, live
      browser session on the Sewers), see `SPD_ARCHITECTURE_TARGET_V3.md` for the detailed
      diff against 0.4.0. No game code adopts any of these three yet.
- [ ] **Next real phase**: wrap the existing per-domain rule functions (`simulation/combat.ts`,
      `movement.ts`, `heroActions.ts`, `heroTurn.ts`) behind one
      `SimulationRuntime<SpdGameState, SpdCommand, SpdEvent, Creature>`, migrating `main.ts`'s
      direct-mutation call sites (`attack()`, `moveTo()`, etc.) to `dispatch()` one command type
      at a time - start with whichever command is cheapest to convert without touching
      presentation-heavy code, not necessarily `attack()`. No big-bang (plan section 25).
- [ ] Consider replacing `simulation/entityId.ts`'s local counter with MWG's own
      `core.EntityRegistry` now that it exists (SPD-ADR-002) - a smaller, independent follow-up
      to the `SimulationRuntime` adoption above, since `EntityRegistry` also gives the reverse
      `idOf(entity)` lookup this project's own `entityId.ts` does not.
- [ ] Extract `main.ts`'s `attack()` pure resolution (hit/damage rolls, weapon-affix/talent
      branches, event-worthy outcomes like mimic reveal/displacement) from its presentation
      calls (sprite tint, audio cue, floating text) - the single largest concrete instance of
      plan section 10's complaint. Likely the vehicle for actually adopting `SimulationRuntime`
      above, rather than a separate step.
- [ ] Compare `mwg/i18n` against the plan's section 22C "Semantic Messaging" shape before
      committing to SPD-ADR-012.
- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/
      buff families before migrating each one's code, per SPD-ADR-010.
- [ ] Re-check `mwg`'s exports on every version bump for the plan's remaining assumed
      primitives (raw 2D primitive re-exports, the Semantic Messaging shape) - some phases of
      the v3 plan still stay blocked until those land upstream.

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known
simplifications.
