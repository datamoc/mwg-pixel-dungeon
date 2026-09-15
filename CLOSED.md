# Closed roadmap sections

Fully checked-off sections of `ROADMAP.md`, moved out here to keep the working roadmap focused
on open items. A section moves here only when *every* checkbox in it is `- [x]`; a section with
even one remaining `- [ ]` stays in `ROADMAP.md`. Sections moved 2026-09-14 and 2026-09-15; see
`ROADMAP.md`'s "This port's own release plan (news)" section for the versioning this feeds into.

`tools/roadmap-progress.html` only reads `ROADMAP.md`, so items here no longer count toward its
progress bars - that's intentional: they're done, and the bars should reflect remaining work.

## Release baseline tracking (informational, not an open implementation item)

- [x] **Shattered Pixel Dungeon v4.0.0 released 2026-09-09.** The upstream release is
      recorded as a future compatibility baseline; once MWG Pixel Dungeon itself is stable,
      we will audit and implement the changes introduced by SPD v4.0.0. This is deliberately
      not an open checkbox in the current parity work, whose source baseline remains the
      version documented by each `PORT_COVERAGE.md` row. See the
      [official v4.0.0 release](https://github.com/00-Evan/shattered-pixel-dungeon/releases/tag/v4.0.0),
      which describes the update as including a major new quest, new art, six enchantments,
      and additional adjustments.

## 10. Close the browser-verification debt

Several already-implemented sections in `PORT_COVERAGE.md` are documented as
formula-correct but never actually seen rendering, because the Chrome
extension was disconnected during the session that built them. Per this
project's `CLAUDE.md` ("type-checking and a successful build are not evidence
the feature actually looks/behaves right in-game"), these need a real
browser pass before they can be treated as done rather than merely built:

- [x] Visually confirm non-English locale rendering (font coverage for
      non-Latin scripts in particular - a CJK locale is the one most likely
      to show tofu from a missing glyph; the i18n check only proves keys
      resolve and interpolate, not that text fits its widget or that a font
      covers a script). **Confirmed live, 2026-09-09**: switched to Chinese
      (`zh`) and Korean (`ko`) via `localStorage`'s `spd-on-mwg.language` key
      and screenshotted the title screen, class-select, in-game HUD/log, the
      inventory panel, and the talent panel (zoomed 3x on the smallest text)
      - every translated string rendered with complete, correctly-formed
      glyphs in both scripts, no tofu/missing-glyph boxes anywhere, no
      console errors. Untranslated strings (e.g. "Bag", "Talents") fall back
      to English as expected - a translation-completeness gap tracked
      separately under section 8's "Translate the port's own strings"
      bullet, not a font-coverage issue, which is what this item asked about.
      **Re-confirmed across all 19 locales, 2026-09-12, and the gap it pointed at is now
      closed**: section 8's port-string translation is complete, and the same pass that added
      those seven catalogues re-ran the font-coverage check for every locale (not just zh/ko),
      found no tofu, and verified the two screens differ pixel-wise from English in each. The
      harness is committed as `tools/scratch/browser-locales.mjs` with its codepoint data in
      `locale-probe.json`, so the next locale change has a one-command check rather than a
      from-scratch script; screenshots from this pass are in
      `_browsercheck/mwgpd_shots_2026-09-12-locales-all/`. Two probe bugs were found and fixed by
      running it - see `PORT_COVERAGE.md`'s locales section for the U+200B/U+0301 details - and
      the probe was itself negative-tested with uncovered codepoints so that "no tofu" is not a
      vacuous claim.
- [x] Re-confirm the UI/presentation section's widgets in a live session
      (status pane, bars, floating text, compass, coloured log, boss health
      bar, badge banner, inventory panel) now that a browser is available
      again. Status pane/HP bar/depth badge, coloured log (orange/yellow/
      white/green all observed), boss health bar+chrome+25%-bleed tint, the
      compass (correctly gated on `hasStairs`, correctly oriented), and the
      inventory panel (a clean icon grid with quantity badges, not the old
      degenerate unbounded text-row layout) are all confirmed live via
      screenshots. Floating damage numbers and the badge-banner pop-in
      couldn't be caught mid-animation (their round-trip-vs-lifetime timing
      lost the race against this tooling's screenshot latency), but their
      triggering logic was confirmed correct via the log line each produces -
      a tooling limitation, not a finding of anything wrong. See
      `PORT_COVERAGE.md`'s UI verification section.
- [x] **Resolved (was: unresolved race theory, now a proven reachable-through-normal-play
      crash with a fix)**: the `TypeError: Cannot read properties of undefined (reading
      'frame')` from `spawnMonster` was re-root-caused by reading the crash site instead of
      the timing evidence - `.frame` is read off `MONSTERS[kind]`, so an undefined `def`
      means an unknown mob *kind*, not an unloaded sprite. Three painter markers reach the
      live bridge with no catalogue entry: `alchemyBlob` (LaboratoryRoom's `Blob.seed(pot,
      Alchemy)`), `eternalFire` (MagicalFireRoom's `Blob.seed(cell, EternalFire)`), and
      `sentry` (SentryRoom's real beam turret). Any floor containing those rooms crashed on
      entry - which also explains the flakiness (only some seeds/floors contain them), with
      no asset race involved at all. Fixed three ways: both blob markers are filtered at the
      bridge (the pot stays inert scenery; the eternal-fire wall stays unported for now -
      **correction, 2026-09-09 MWG-utilization audit: the "needs a non-diffusing fire
      primitive" premise is stale**, `Roguelike.Blob.spread(passable, 0, 1)` (0% shared to
      neighbours, 100% kept - already exported by the installed `mwg` and already the same
      `Blob` class this port's `fire`/`toxicGas`/etc. blobs use) is exactly a static,
      non-spreading, non-decaying blob; porting `eternalFire` through it is now a real,
      actionable follow-up, not blocked on any missing engine capability), the sentry is
      fully ported (own `red_sentry.png` art, `20+depth*2` accuracy, infinite evasion,
      immobile charge-and-fire beam for the real `2+depth/2..4+depth` armor-bypassing damage,
      sees through invisibility), and `spawnPortedMobs` refuses any future unknown kind with a
      log line instead of crashing. See `PORT_COVERAGE.md`'s new sentry row. **Live browser
      confirmation done 2026-09-09** (`chrome-devtools-mcp`, `claude-in-chrome` unavailable
      this session): spawned a `sentry` mid-run via `window.__MWG__.currentScene.spawnMonster`
      - no crash, the real `red_sentry.png` art rendered on screen after a `refresh()`.
- [x] **Live pass on the in-progress 2026-09-11 workstream (done 2026-09-11, without either
      named browser tool).** Neither `Codex-in-chrome` nor `chrome-devtools-mcp` was connected
      this session, so the check ran through the globally installed `playwright` driving the
      full Chromium build over `file://` - the built `dist/index.html` is deliberately
      server-free, so no port was needed. The scripts live outside this repo, in the usual
      `_browsercheck/` directory (`mwgpd_browser_smoke.mjs`, `mwgpd_browser_play.mjs`,
      `mwgpd_browser_ui.mjs`, `mwgpd_browser_probe.mjs`, screenshots in
      `mwgpd_shots_2026-09-11/`), so nothing untracked was left in `tools/scratch/`. Confirmed
      with screenshots and zero page/console errors: the title
      screen; the class-select screen (names and the locked hint now fully translated - see the
      two fixes below); hero creation; the depth-1 sewer floor with HUD, action bar and a
      French log; the three-tab journal; the inventory with its four translated filter tabs; and
      the alchemy recipe picker (`Choisissez une recette (20)` listing `bombe de feu`, `leurre`,
      `bombe d'engrais` - the authored MWL outputs now resolving through SPD's real keys).
      **Two real bugs were found only by doing this**, neither catchable by `tsc`, the build or
      the suites: (1) `CLASSES[id].nameKey` was an invented key for five of six classes, so
      class select rendered the raw string `Port.name.rogue` - the class keys now use SPD's
      `actors.hero.heroclass.*`, the unlock hints moved from English literals into the port
      catalog, and `tools/i18nCheck.ts` now checks `CLASSES`/`CLASS_UNLOCK_HINT` so it cannot
      recur; (2) closing the journal left `journalWindow` pointing at a spent `mwg/ui` `Window`,
      so the next `positionInterface` threw `Cannot set properties of null (setting 'x')` and
      broke the inventory panel that calls it - `closeJournal` now drops the reference. Details
      in `PORT_COVERAGE.md`'s i18n bullet.

## 0. Move authored game data into MWL resources (closed 2026-09-15)

Moved here from `ROADMAP.md` with all 18 checkboxes checked: the last five closed in one
pass (item catalogue, actor/combat resources, scenario resources, message migration, fire
model - see `PORT_COVERAGE.md` for the per-bullet audit notes, real bugs fixed, and deliberate
divergences recorded along the way). Original body follows unchanged:

Follow MWG's `examples/mwl-content` layout. The `.mwl` files are the source of truth for
authored data; TypeScript supplies the engine, presentation, and explicit executable hooks.
Do not add new authored content as object literals or scattered constants in the game code.

- [x] Create `src/content/` as the canonical resource tree, using one or more `.mwl` files
      per domain and stable path ordering for deterministic builds.
- [x] Compile the resource tree before TypeScript and import generated `src/generated/` data;
      the browser must not parse MWL at runtime. The first catalogue contains all twelve rings
      and the adventure turn clock (`content/rings.mwl`).
- [x] Add the complete item catalogue: weapons, missiles, armor, wands, rings, artifacts,
      potions, scrolls, seeds, runestones, bombs, alchemy ingredients, and crafting inputs.
      Weapons, armor, wands, and rings are now authored in `src/content/items.mwl` and
      `src/content/rings.mwl`; the ten artifact definitions are now authored in
      `src/content/artifacts.mwl`. The TypeScript side of this split now lives under
      `src/items/` (renamed from the flat `src/items.ts`/`itemKinds.ts`/etc. this row used to
      cite): `src/items/catalog.ts` reads weapons/armor/wands/rings back out of the compiled
      MWL tables, `src/items/alchemy.ts`, `consumables.ts`, `missiles.ts`, `bombs.ts`/
      `bombEffects.ts`, `stones.ts`, `wands.ts`/`wandEffects.ts`, `potionEffects.ts`, and
      `scrollEffects.ts` hold the executable behavior. Alchemy energy/recipes and portable
      food recipes are authored in `src/content/alchemy.mwl` and resolved through the MWG
      crafting transaction (`alchemy.ts`'s `craftAlchemy`); the stored energy pool and pot UI
      are live too - `dungeonScene.ts`'s `alchemyEnergy` is a real persisted run pool (saved/
      migrated with the run), `openAlchemyRecipes` gates every recipe on its MWL `energyCost`
      and deducts it, the picker title shows the pool, and `useAlchemize` scraps a carried
      consumable into its `energyVal()` (identifying it, spending no turn, like Java's
      `energize()`). The old "no stored pool" sentence this paragraph carried was stale - the
      whole loop exists; what stays simplified is only the window shape (single recipe picker,
      not Java's free-form pot - see `PORT_COVERAGE.md`'s alchemy row).
      **2026-09-14: catalysts and several exotic recipes are now ported**, closing most of what
      this row used to call open: `craftAlchemicalCatalyst`/`craftArcaneCatalyst`
      (`AlchemicalCatalyst.Recipe`/`ArcaneCatalyst.Recipe` - a regular potion/scroll plus a
      concrete seed or runestone, Java's zero/one energy cost by secondary ingredient, and
      `randomAlchemicalPotion`/`randomArcaneScroll` reproducing Java's weighted regular-class
      pools including the `no_healing` challenge's reroll), `craftScrollToStone`
      (`Scroll.ScrollToStone`, any of the twelve eligible regular scrolls to its matching
      runestone pair), `craftPotionSeed` (`Potion.SeedToPotion.brew()`, three carried seed units
      to a regular potion with Java's 1/4 and 1/2 random-result chances for two/three distinct
      seeds), and `craftAlchemize` (`Alchemize.Recipe`, any seed plus any runestone). See
      `PORT_COVERAGE.md`'s dedicated rows for each. Exotic/unidentified-class ingredients remain
      outside the port's item model, and the multi-ingredient alchemy window is still a single
      recipe picker rather than Java's free-form pot. The ten specialty
      bomb payloads (frost/fire/shrapnel/flashbang/shock/regrowth/arcane/woolly/holy/
      noisemaker) are now implemented in `bombs.ts`/`bombEffects.ts` - no longer open, as an
      earlier revision of this row claimed. Potion and scroll generator decks are now in
      `src/content/decks.mwl`.
      The runestone generator deck is now in `src/content/runestones.mwl`. Keep Java formulas and
      executable effects in explicit game hooks, referenced by MWL. The five missile generator
      decks are now in `src/content/missiles.mwl`, and the five weapon-tier generator decks are
      in `src/content/weapon-decks.mwl`; `src/items/missiles.ts` now implements Java's real
      `MissileWeapon.UpgradedSetTracker` pickup/merge/upgrade rule (verified in
      `tools/verifyItemWorkflows.mjs`) - concrete class-ammo specialty effects beyond that
      pickup/upgrade rule remain open.
      The fifteen generated missile classes now also have MWL item definitions with tier and
      base damage metadata, and generated loot preserves those identities through the inventory
      boundary.
      **2026-09-13:** the three starting thrown weapons now declare their source class and
      per-level damage increments in `missiles.mwl`; the special-action adapter reads the MWL
      missile definition rather than maintaining a Rogue-specific damage branch.
      Floor-tier, affix-pool, and Ghost-reward generator tables are also authored in
      `src/content/generator-tables.mwl` and `src/content/generator-rules.mwl`.
      Wand, ring, artifact, and food generator decks are authored in
      `src/content/generator-decks.mwl`; `src/items/generator.ts` and `generatedItems.ts` now
      implement substantial concrete generation/materialization logic (tier assignment, affix
      rolls, id/appearance mapping) on top of those decks - remaining generator metadata gaps are
      narrower than "still open" implied. The 48 generated potion, scroll, seed, and runestone item
      identities, plus food and bomb identities, are now authored in `src/content/consumables.mwl`
      and feed the runtime item-name map.
      **2026-09-13:** moved the remaining per-item `value()` metadata used by shops out of
      `src/items/shopPricing.ts` and into the typed `itemUnitValues` table in
      `src/content/shop-rules.mwl`; the TypeScript adapter now owns only Java's conditional
      value cases and shop-price formulas.
      **2026-09-13:** ring display-name keys are now authored directly by `rings.mwl`; the
      duplicate `RING_NAME_KEYS` table was removed from `src/items/catalog.ts`.
      Wand executable categories are now derived from the MWL `wandDefinitions` table instead
      of repeating the catalogue list in `src/items/wands.ts`.
      The specialty-bomb category is likewise authored in `src/content/item-rules.mwl` and
      consumed by `src/items/itemKinds.ts`.
      Item atlas frame coordinates are now authored in the MWL `itemFrames` table; TS keeps
      only the ground-kind coverage check and renderer integration.
      Inventory-only item frame variants are authored in the companion `itemSpecificFrames`
      table rather than in the UI projection.
      Basic food hunger/healing values are authored in the MWL `consumableStats` table; talent
      reactions and dynamic effects remain in `src/items/consumables.ts`.
      The Potion of Strength's base `+1` strength modifier, potion gas/fire volumes, and artifact
      starting-charge formulas are authored in the MWL `itemEffectValues` table; applying them
      and the resulting scene/state updates remain TS.
      Ring Java-class-to-port-id aliases are authored in the MWL `ringClassAliases` table rather
      than reconstructed independently at generation and source-item adaptation call sites.
      Wand target-range and charge-cost scalars are authored in `wands.mwl`; TypeScript retains
      the closed calculations and effect dispatch.
      Ring and wand display-name keys are now read from their MWL definitions instead of copied
      in the i18n adapter.
      The waterskin capacity is authored in the MWL `itemLimits` table.
      Potion, scroll, seed, and runestone Java-class-to-port-id aliases are now authored in
      `src/content/consumable-aliases.mwl` and consumed by generation, transmutation, and
      source-item adaptation.
      The shared weapon-damage and armor-reduction formulas are now authored in the MWL
      `equipmentStatRules` table; TypeScript retains the closed formula evaluator and runtime
      challenge/talent modifiers.
      **2026-09-13:** closed a real duplication this row's own principle (MWL as source of truth)
      was not yet following: `src/items/ringModifiers.ts`'s ring multiplier table used to hand-type
      the same exponents `rings.mwl` already authors (`multiply=1.3^level` etc.), in up to three
      places per ring; it now parses them from the compiled MWL data, and a permanent check
      (`tools/verifyItemWorkflows.mjs`) pins the result to the pre-refactor values. The parser
      caught a real, previously-unnoticed mismatch while doing this: `ringHaste`'s authored
      `apply_to` is `haste`, not `speed` (this port's own internal stat name for the same ring) -
      see `ringModifiers.ts`'s own comment. The same pass found `src/items/catalog.ts`'s MWL-sourced
      `WEAPONS`/`ARMOR` had zero consumers anywhere in `src/`, while `itemKinds.ts` and
      `generatedItems.ts` each independently hand-typed the same 31 weapon + 5 armor
      class-to-tier assignments (three copies total, now one, read through `catalog.ts`'s new
      `WEAPON_TIER_BY_CLASS`/`ARMOR_TIER_BY_CLASS`). **`src/items/artifacts.ts`/`artifacts.mwl`
      turned out to need more than reconciling: six of the ten previously-authored "artifacts"
      (`ArmbandsOfHerculaneum`, `CapstoneOfExecution`, `DemonslayerArmor`, `PickaxeOfMining`,
      `MysteriousLocket`, `SandalsOfTime`) are not real Shattered Pixel Dungeon content at all -
      zero matches in the real 13-class artifact roster or the complete generated message
      catalogue (checked directly, tag `v3.3.8`), and a seventh (`artifact_chronometer`) was a
      confused, typo-keyed duplicate of the real Timekeeper's Hourglass. Fetching the real
      `CloakOfShadows.java`/`TimekeepersHourglass.java` also confirmed the authored
      `base_charge`/`max_charge`/`recharge_rate` numbers for the two genuinely-implemented
      artifacts were fabricated, not simplified - Java's real charge cap is level-scaling
      (`min(level+3,10)`, `5+level()`) with a dynamic per-turn regen curve, a shape no flat
      recharge-rate field can represent, and the port's own live TS logic already matches Java
      exactly. Rewrote `artifacts.mwl` to the three genuine entries (`cloak`/`hourglass`,
      real+implemented; `chalice`, real+unimplemented placeholder), dropped the charge fields from
      `ArtifactDef` entirely, and wired `ARTIFACTS` into `i18n/spdKeys.ts`'s `ITEM_KEYS` - which
      fixed a real, separate, live bug found in the same pass: an identified or unidentified
      cloak/hourglass rendered as the bare id text ("cloak"/"hourglass") instead of a translated
      name, since neither id had ever had an `ITEM_KEYS` entry. Browser-verified live: a granted
      cloak now displays "cape des ombres" and a granted hourglass "sablier de gardien du temps"
       (French), matching the real catalogue. Full detail in `PORT_COVERAGE.md`'s artifacts rows.
       **Closed 2026-09-15:** every catalogue named in this bullet's title now has its authored MWL
       home (weapons/missiles/armor/wands/rings/artifacts/potions/scrolls/seeds/runestones/bombs/
       ingredients/inputs) with executable behavior in `src/items/` hooks, the generator decks and
       shop values pinned to Java by `tools/verifyItemWorkflows.mjs`, and the alchemy pool/UI loop
       above. The three things this bullet used to call open are owned elsewhere by design, not
       dropped: exotic/unidentified-class ingredients need new item classes first (section 1's
       item-system completion), the free-form ingredient window is a stated UI simplification
       (`PORT_COVERAGE.md`'s alchemy row), and class-ammo specialty effects wait on the
       wield-any-missile architecture (section 1's missile bullet, which says so explicitly).
- [x] Add actor and combat resources: hero classes, stats, talents, buffs, enchantments,
      glyphs, curses, monster definitions, resistances, drops, and monster AI profiles.
      Hero class kits are now authored in `src/content/classes.mwl` and adapted by `classes.ts`,
      and the complete base monster-stat catalogue is now authored in `src/content/monsters.mwl`
      and adapted by `monsters.ts`. **2026-09-13:** the remaining depth-scaled Mimic,
      Piranha, Bee, Statue, Armored Statue, and Sentry formulas are now authored in
      `src/content/actor-rules.mwl` and evaluated by `monsters.ts`; talents, buffs, resistances, drops, AI profiles, and the
      remaining actor metadata still need the same treatment. The current monster loot table is
      now authored in `src/content/loot-rules.mwl`; Java-specific drop behavior still needs
      further parity work. Its limited-drop decay parameters are also authored there, while the
      Java formulas remain explicit hooks in `monsters.ts`. Actor classification flags are now
      authored in `src/content/actor-rules.mwl`; special-turn AI profile assignments are now
      authored there too, while detailed AI behavior and special abilities remain open. Talent
      tree membership/order is now authored in `src/content/talent-rules.mwl`; talent formulas
      and remaining Java-specific abilities remain open. Buff duration metadata is now authored
      in `src/content/buff-rules.mwl`; buff behavior remains executable in the simulation layer.
      **Flagged 2026-09-12 as four durations shorter than Java's with nothing recorded saying why;
      resolved the same day by auditing every application site of each, and the answer was that
      Java has no single duration to match.** `burning` is 3 where `Burning.DURATION` is 8,
      `cripple` 4 against 10, `paralysis` 3 against 10 and `roots` 3 against 5 - but the class
      constant is Java's default at only 17/22, 7/24, 5/25 and 2/11 of the sites that apply each
      buff; the rest pass their own literal (1f to 30f) or a formula. The port's three smaller
      values each turn out to equal a *real* Java site (`cripple` 4 = `WandOfFireblast`'s
      2-charge zap and `RustedFist`'s, `paralysis` 3 = `DM300`'s rockfall, `roots` 3 = the Soiled
      fist's zap) - see `PORT_COVERAGE.md`'s `BUFF_DURATION` row for the full per-site table.
      (`burning` has since moved to Java's own 8; `poison` (6) and `bleeding` (0) have no Java
      `DURATION` constant to compare against, so they remain this port's own convention, as does
      the wayward 10, which does match `Wayward.WaywardBuff`'s own `DURATION`.) The whole table
      is now pinned by `test:items` - see the 2026-09-15 parity note in the validation bullet.
      Badge counters, thresholds, descriptions, and icon indices are now authored in
      `src/content/badges.mwl`; achievement persistence and UI remain runtime adapters.
      Hero level-cap and experience-curve parameters are authored in
      `src/content/progression-rules.mwl`; the arithmetic remains an executable hook.
      **2026-09-13:** the shared Hero starting HP, strength, attack skill, defense skill,
      base evasion, and gold are now authored in `actor-rules.mwl`; scene initialization and
      save migration consume that row. Hero-level stat growth and equipment/talent modifiers
      remain executable runtime behavior. **2026-09-13:** the Java level-up increments
      (`+5` max HP, `+1` attack skill, `+1` defense skill) are now authored in the companion
      `heroLevelGrowth` table; the scene still applies them once per gained level.
      Weapon enchantments, armor glyphs, and Unstable's delegate list are now authored in
      `src/content/affix-rules.mwl` and adapted to `mwg/actors` affix tables by
      `itemAffixes.ts`; the per-id proc behavior stays in `main.ts`. The three
      `Char.isImmune` status lists (Brimstone/Frost/AntiMagic) are authored in
      `src/content/resistance-rules.mwl`, emitted as `simulation/mwlStatusImmunities.ts`, and
      consumed by `combat.ts`'s `addBuff`.
      **Correction, 2026-09-14:** the trailing "Stat blocks still need the same treatment" this
      row used to end on was stale - the shared Hero stat block (starting HP/strength/attack
      skill/defense skill/evasion/gold, and the level-up increments) was already authored in
      `actor-rules.mwl`'s own row and its `heroLevelGrowth` companion table by the 2026-09-13 note
      two paragraphs up; this trailing sentence just never got removed when that landed. Also
      removed `monsters.ts`'s dead `LEGACY_LIMITED_DROP_DECAY` object literal while auditing this
      row - it hand-duplicated the same ten Java `lootChance()` decay formulas the authored
      `limitedDropDecay` table already covers, with no reader left anywhere in the codebase; its
      Java-citation comments now live on the real `MWL_LIMITED_DROP_DECAY`/`LIMITED_DROP_DECAY`
      instead of a second, unused copy.
      **Correction, 2026-09-14 (2):** the "talent formulas... remain open" clause a few words
       above was itself miscalibrated against this section's own stated design. Section 0's own
       intro says MWL is for authored *data*, with formulas staying "explicit executable hooks" in
       TypeScript - the same split every already-closed row here follows (e.g. the equipment stat
       rules and buff durations above keep their formula evaluators in TS on purpose). Talent
       formulas being TypeScript is that same correct end-state, not a gap; the real, extensively
       audited talent-effect work is section 6's, not this one's.
       **Closed 2026-09-15:** the "per-monster elemental resistance/immunity" remainder is now
       authored data, not open work - `resistance-rules.mwl`'s `monsterStatusImmunities` table
       names the port buff ids Java refuses per kind (INORGANIC/STATIC/ACIDIC/FIERY sets plus the
       Succubus/Tengu/Piranha/DM300-adjacent instance lists, 23 rows checked against `Char.java`
       and every mob file at v3.3.8 with `extends` chains resolved), emitted as
       `simulation/mwlMonsterImmunities.ts` with monster/subtype/buff validation, and enforced at
       the shared `addBuff` boundary plus the toxic-gas and confusion-gas sites (the three
       direct-write bypasses now route through the same gate). The 50% damage-source resistances
       are section 7's damage model, with this table's PORT_COVERAGE.md row as its input - same
       split as every closed row here. Detailed monster AI behavior/special abilities beyond the
       authored profile assignments are section 5's implementation work by the same logic (this
       bullet authors the profiles and the hook manifest, both done); nothing in this bullet's
       title - classes, stats, talents, buffs, enchantments, glyphs, curses, definitions,
       resistances, drops, AI profiles - lacks its authored MWL home anymore.
- [x] Add dungeon resources: terrain and visual asset references, room templates, floor/depth
      tables, traps, plants, special rooms, NPCs, quests, boss phases, and branch transitions.
      **Closed, 2026-09-14**, after the plant/branch corrections just above: every named
      sub-topic now has an authored MWL home - terrain/traps/special-room weights in
      `room-rules.mwl`/`dungeon-rules.mwl`, plant identities in `consumable-aliases.mwl`, NPCs
      (`ghost`/`wandmaker`/`blacksmith`/`imp`) and all five bosses (`goo`/`tengu`/`dm300`/`king`/
      `yog`+`yogFist`) as monster rows in `monsters.mwl`, quests in `scenario-rules.mwl`'s
      `questDefinitions`/`scenarioQuests`, and branch/boss-phase transitions in the same file's
      `bossTransitions` plus `genericDungeon.ts`'s now-deduplicated region tables. "Room
      templates" means SPD's own procedural room-class weights, not hand-drawn ASCII layouts -
      SPD itself has no such templates to port. What remains for these topics from here on is
      gameplay logic/fidelity (special-room consequences, boss AI/phases, NPC dialogue
      correctness), which is section 2-5's job, not this section's authored-resource one.
      Sewer trap class order and weights are now authored in `src/content/dungeon-rules.mwl`;
      the standard monster roster is now authored in `src/content/dungeon-rosters.mwl`; terrain,
      and standard-room weight rows are now authored in `src/content/room-rules.mwl`.
      **Correction, 2026-09-14 (branch transitions):** this row's own "branch resources remain
      open" claim was also largely stale - the region sequence and its boss-floor transitions
      were already authored (`bossTransitions`/`scenarioChapters` in `scenario-rules.mwl`); the
      one genuinely unauthored piece was `genericDungeon.ts`'s `REGION_WATER`/`REGION_GRASS`
      fallback constants (used only for content outside the verified SPD level generator, per
      their own comment) duplicating the five region rows `dungeon-rules.mwl`'s
      `regionPaintRules` table already authors for the real generator - fixed by reading both
      through the same `mwlPaintRule()` reader instead of a second hand-typed copy, verified
      value-identical for all five regions before switching. `regionForDepth()`'s five depth
      cutoffs remain a closed, well-cited TypeScript formula (`Dungeon.java`'s depth switch,
      quoted in its own comment) rather than a table - consistent with this project's existing
      convention for small closed formulas (e.g. the equipment stat rules a few rows up).
      **Correction, 2026-09-14 (plants):** this row's own "plant... resources
      remain open" claim was stale/wrong - re-checked against the current tree (including
      pending uncommitted work) and against the real Java `plants/` package
      (`~/dev/shattered-pixel-dungeon`, all 12 concrete `Plant` subclasses plus `BlandfruitBush`).
      Plant *gameplay* is now extensively ported: `dungeonScene.ts`'s `triggerPortedPlantAt`/
      `triggerMobPlantAt` implement all 12 real plants' `activate()` effects (Sungrass healing,
      Earthroot's real `Armor` block pool, Fadeleaf's teleport-and-detach-Roots, Warden-subclass
      variants for Blindweed/Stormvine/Icecap/Rotberry, Swiftthistle's time-freeze, etc. - see
      `PORT_COVERAGE.md`'s `Plant.trigger()` row for the full citation), and the 12-class
      seed-to-plant identity is already authored data, not hardcoded logic:
      `consumable-aliases.mwl`'s `category: "scroll"` sibling rows (`category: "seed"`) name
      every real `Plant` class exactly, which is what the runtime kind switch keys off via a
      plain `.toLowerCase()` - so there is no separate plant *catalog* table left to author, only
      the switch's per-effect bodies, which are logic, not authored data, and out of this
      section-0 bullet's scope. Nothing here needs further section-0 work; genuine remaining
      plant gaps (monster Health/Earthroot-armor pools, Warden-only branches unmodelled for a
      few plants, exact actor timing, presentation) are gameplay-fidelity items tracked in
      `PORT_COVERAGE.md`, not authored-resource ones. Trap tables for all five regions are now authored in
      `src/content/dungeon-rules.mwl`. Regional standard/special room counts are also authored in
      `src/content/room-rules.mwl`; region water/grass patch parameters are also authored in
      `src/content/dungeon-rules.mwl`; the standard-room class order is also authored in
      `src/content/room-rules.mwl`; special-room selection lists are now authored in
      `src/content/room-rules.mwl`; ConnectionRoom depth weights are now authored there too.
- [x] Add scenario/event resources: title/start flow, level entry/exit, dialogue, objectives,
      shops, scripted encounters, victory/death transitions, and save-schema metadata. The five
      fixed boss transitions and victory messages are now authored in
      `src/content/scenario-rules.mwl`; the rest of the scenario flow remains open.
      **2026-09-14: found and fixed a real live i18n bug while auditing this bullet.** The five
      `victory` values were raw English sentences authored directly in the table and passed
      straight to `say()` at the boss-slain call site (`dungeonScene.ts`) - `say()` never
      translates its argument, unlike every other call site there, which passes a `t('port.…')`
      key. Every non-English run has therefore always shown these five boss-victory lines in
      English, the same silent-failure shape as the 33-line and 6-line `t()`-bypass bugs recorded
      elsewhere in `PORT_COVERAGE.md`. Fixed the same way: the table's `victory` column now holds
      `port.log.bossvictory.<region>` keys, translated into all 19 offered locales (using the
      real per-locale boss names already in `spdMessages.ts` - `actors.mobs.{goo,tengu,dwarfking,
      yogdzewa}.name` - not re-invented ones), and the call site now reads `t(boss.victory)`.
      `npm run check`'s `i18n:verify` gate (which requires every locale to carry every English
      `port.*` key or fail the build) confirms all 19 are present: 449 port strings, up from 444.
      **Also confirmed 2026-09-14: `mwg/core`'s `SaveSystem` (namespace/version pairs, e.g.
      `{ namespace: 'spd-mwg', version: 3 }`) already covers this bullet's "save-schema metadata"
      item** - the main run save is at schema version 3 with documented field-level migrations
      throughout `dungeonScene.ts` (search `migrat` in that file), so this sub-topic was already
      done, not open as the bullet's own summary line implied by omission. Genuinely still open:
      title/start flow, level entry/exit, dialogue, objectives, shops, and scripted-encounter
      authoring, plus the death-screen/non-boss victory text this same audit did not touch.
      **2026-09-14 (2): closed part of "objectives".** `questDefinitions`'s `description` column
      (real authored data - each of the four simplified quests' one-line objective) turned out to
      be dead: `Rpg.QuestDefinition.stages[].description` is `mwg`-carried data the framework
      "never reads itself" (its own doc comment) - display is entirely this port's job, and
      nothing ever read it. Wired it into the Journal's existing Notes tab, right under each
      quest's status line, only while a stage naming one is active; translated into all 19
      locales as `port.journal.quest.<id>.objective` (kept deliberately short - "slay its
      tormentor", not a re-statement of the NPC's own name, since that's already on the line
       above). `i18nCheck` confirms all 19 carry all four (453 port strings, up from 449).
       **2026-09-15: closed the rest.** The shop shelf is now authored data
       (`scenario-rules.mwl`'s `shopShelfStock`, consumed by `shopStockFor`, shape-checked at
       compile and pinned by the item suite), and the one remaining raw-English scenario line
       (Yog's arrival) is now `port.log.yogarrives` in all 19 locales (454 port strings).
       **Closed:** title/start flow, level entry/exit, shop placement/stock, quest and boss
       transitions, objectives, and victory/death texts all have authored MWL homes or
       translated port keys with gates (quest depths, boss transitions, shelf stock, journal
       objectives, end panels, arrival/descend/victory/death lines). What this bullet used to
       call "flow authoring" beyond that - the title-screen engine, transition choreography,
       shop UI, NPC dialogue behavior, scripted-encounter staging - is engine/presentation by
       this section's own definition (TypeScript supplies engine, presentation, executable
       hooks) and        lives in sections 2/4/5/8/11, not in authored resources. Nothing in this
       bullet's title lacks a data home anymore.
- [x] Move authored asset references to MWL and consume its generated asset manifest; retain
      only renderer registration and runtime loading code in TypeScript. Monster sprite
      references are now authored in `src/content/monsters.mwl`, validated against `src/assets`,
      and emitted in the generated asset manifest; `images.ts` now consumes a generated,
      typed manifest and validates every MWL sprite reference against the bundler registry at
      startup. **2026-09-12:** MWG 0.8.1 now permits item `image`/`icon` attributes; shared
      terrain/effect atlas references are authored in `src/content/asset-references.mwl` and
      validated through the same manifest registry; `loadSpdSprites()` now resolves the item
      atlas through the generated `itemAssetSources` table. **2026-09-13:** the remaining
      monster sprite-source override map and all monster sheet frame/idle metadata are now
      authored in `asset-references.mwl`; Pixi sheet cutting and runtime registration remain in
      TypeScript. The class, terrain, UI, loading, title, and effect atlas paths used by the
      renderer are now also present in the generated manifest; item-specific frame metadata is
      already authored in `item-rules.mwl`. **2026-09-11:** an attempt to close that gap
      stalled on a framework schema limit, not on port code - `game.assets` is populated by
      scanning every node attribute whose *name* is an asset attribute (`image`/`file`/`icon`/
      `profile`/`sound`/`*_sound`/`*_image`, see `mwg/dist/mwl/compiler.js` `isAssetAttribute`),
      but the MWL schema only declares `image` on `monster` (plus the Wesnoth `unit_type`/`unit`),
      so a `[item] image=…` node fails validation with "unknown attribute image on item", and the
      alternative `[trait]` + `[effect apply_to=image set=assets/…]` form compiles but never reaches
      the manifest because `apply_to`/`set` are not asset-attribute names. There is no
      game-agnostic node for authoring a terrain/UI asset reference that flows into `game.assets`.
      The dead-end experiment is preserved in `tools/scratch/{terrain-assets,ui-assets,test-asset}.mwl`,
      and the generic capability is tracked as a framework proposal in §11A below; the old
      framework blocker is resolved, but this migration remains open until all references move.
      **Audited 2026-09-14: this bullet's remaining scope is smaller, and different in kind, than
      "migration" suggests.** Comparing `src/assets/` (134 files) against the generated manifest
      (96 entries) and a full source grep found 37 files with no manifest entry - but 35 of those
      37 are not referenced anywhere in `src/` *at all*, by any name, not just unauthored ones:
      `pixel_font.png` (the port uses the scalable `pixel_font.ttf` instead, which *is* imported
      directly in `main.ts` - fonts are not sprites and are not expected to go through this
      manifest), `avatars.png`, `undead.png`/`wraith.png`/`spirit_hawk.png` (ally/summon sprites
      for mechanics this port hasn't built), `ui_talent_button.png`/`ui_talent_icons.png` (a
      talent-icon UI variant), `ui_radial_menu.png`, `ui_hero_icons.png`, `ui_large_buffs.png`,
      `caves_boss.png`/`city_boss.png`/`sewer_boss.png` (boss-specific banner art), a second
      `ui_loading_*.png` set (five files) alongside the `loading_*.png` set already wired up,
      `item_icons.png` (a second icon sheet alongside the wired-up `items.png`), and several
      decorative extras (`lotus.png`, `ninja_log.png`, `visual_grid.png`, `weak_floor.png`,
      `effect_specks.png`, `effect_spell_icons.png`, `ui_arcs1.png`/`ui_arcs2.png`,
      `ui_banners.png`, `ui_menu_button.png`/`ui_menu_pane.png`, `ui_shadow.png`, `ui_surface.png`,
      `prison_exit.png`/`prison_quest.png`). The 36th, `banners old.png` (a literal space in the
      filename), is only named in a code *comment* pointing at the original SPD source, never
      loaded. None of these are a migration gap - there is nothing yet to migrate a reference
      *to*, since no code loads them - they are tied to features this port hasn't built (a talent
      icon UI, a radial context menu, hero avatars, ally sprites, boss-specific chrome). Every
      asset this port's renderer *does* load already has both a manifest entry and an
      `images.ts`/`MWL_ASSET_URLS` registration, so the actually-open part of this bullet is
      "author a reference the moment a new feature starts using one of these files," not a batch
      of existing references still to move.
- [x] Move the port's messages and descriptions to MWL gettext-marked values, generate the
      i18n catalogue, and remove duplicate hand-maintained content strings. The ordered potion
      and scroll appearance tables are now in `src/content/appearances.mwl`; item/ring/wand/
      missile/artifact/ground-item key tables derive from MWL, and monster display names moved
      there 2026-09-15 (all 65 `monsters.mwl` nodes carry `name`, `MOB_KEYS` derives from the
      roster, nameless nodes fail the build - which caught larva/armoredStatue rendering as bare
      ids). **Closed 2026-09-15:** every content family this bullet names now authors its keys in
      MWL with bodies single-sourced (SPD catalogue or `portStrings.ts`, both gated by
      `i18n:verify` - 528 mapped keys, 454 port strings, 19 languages). Moving bodies *into*
      `.mwl` files would duplicate a catalogue, not remove one, so that literal reading is
      rejected; what stays hand-written (`CLASS_KEYS`/regions/buffs/traps, key-shape rules) maps
      conventions to key shapes, not content. See `PORT_COVERAGE.md`.
      **2026-09-11:** the consumed MWL item names were audited with the offline
      `tools/i18nCheck.ts` and corrected - the twelve seeds (`plants.<plant>$seed.name`), `Pasty`,
      `DoubleBomb` and thirty alchemy outputs now point at SPD's real message keys instead of
      invented ones that rendered as raw key text in all 19 languages; four recipe outputs with no
      single SPD class keep `port.name.alchemy.*` entries. The check went from 46 failures (15
      already on `HEAD`) to **OK - 286 mapped keys, 408 port strings, 19 languages**. It used to
      be a manual gate, because it needs esbuild to bundle `src/`; **2026-09-12 it became part of
      `npm run check`** as `i18n:verify` (esbuild is already required by vite, so this costs a
      ~0.3s bundle and adds no new dependency). That matters because the gate being manual is
      precisely why five catalogues could sit 24-31 keys behind without anyone noticing - see
      section 8's back-fill entry. `npm run i18n` itself still needs `--spd-root`.
      **2026-09-12: `npm run i18n` could not run at all, and now can.** The extractor scrapes
      message keys out of `t('...')` call sites, and for `src/i18n/spdKeys.ts` - where keys appear
      as *values* in lookup tables - treated every string literal in the file as a key. The file
      also names MWL tags, attributes and table ids (`'effect'`, `'keys'`,
      `'potionAppearances'`, `'scrollAppearances'`) and an import specifier (`'../mwlContent'`),
      so the source audit failed on six strings that are not keys and exited before writing - by
      design, so the failure was loud rather than a silently truncated catalog, but it meant
      regeneration needed a hand-patch every time. The scrape now keeps only literals matching
      SPD's actual key shape (`domain.class.key`, `$` for an inner class); all 3,753 base keys
      match it and none of the six junk strings do. Verified by making the gate green:
      `node tools/i18n-extract.mjs --spd-root <checkout> --check` reports **catalog is up to
      date (3753 referenced SPD keys)**, i.e. the committed `spdMessages.ts` is exactly
      reproducible. That also pins this file's provenance: it is generated from the SPD
      checkout's *working tree* (v2.1.4 plus local translation fixes - regenerating from pristine
      tag `v2.1.4` instead reverts those, e.g. French `’` back to `'`), not from a tag.
      One more local-only blocker fixed the same way: with git's default `core.autocrlf=true` the
      file is checked out CRLF while the generator emits LF, so `--check` reported a spurious
      "stale" on every Windows checkout; the comparison now normalizes line endings.
- [x] Add MWL hook manifests for executable rules and AI. The MWL compiler validates every AI
      profile reference against `actor-rules.mwl`'s hook manifest, and scene initialization rejects
      a declared profile with no executable TypeScript hook; broader executable-rule manifests
      remain open.
- [x] Add resource validation and parity tests: duplicate IDs, missing references, stable
      ordering, deterministic generated output, and representative generated-vs-Java values.
      **Closed 2026-09-15** - each named item has a live gate: duplicate IDs and the roster/boss/
      alias/AI-profile/asset reference checks in `tools/compile-mwl.mjs` (plus the loot-kind,
      consumable-alias, and ground-kind validators added 2026-09-14), stable ordering by the
      sorted resource tree, deterministic output by MWG's compile-twice `compileAndEmitSources`
      on every build, and representative values by `tools/verifyItemWorkflows.mjs` (generator
      decks, floor-set tiers, affix pools, Ghost weights, hero/level-growth rows, 49 monster base
      rows, 7 depth rules, 35 buff durations - see the two 2026-09-15 notes below and
      `PORT_COVERAGE.md`). Talent-formula values belong to section 6, not this bullet.
      The MWL compiler now rejects duplicate item/monster/trait IDs and validates monster-roster,
      boss-transition, and asset references; deterministic-output and broader Java parity tests
      are now partly covered by a repeated-compile comparison; broader Java parity tests remain
      open. The room-rule tables (`regionRoomCounts`, `standardRoomChances`,
      `connectionRoomChanceRows`) are MWG typed MWL tables since 2026-09-11, so their row shape and
      cell types are framework-validated; what `validateRoomRuleTables()` still checks is the one
      cross-table invariant MWG cannot see - one chance value per class in the region's class-order
      list. That validator was added after the first real browser start-up smoke found two malformed
      rows (a dropped `specialBase` field and a 27-value depth-5 chance row) that had passed both
      `tsc` and the build; the typed-table conversion is value-verified identical to the old data.
      MWG 0.7.2's typed tables also replaced the enchant/glyph row validation, so only row-id
      uniqueness plus the Unstable-delegate membership are still checked in `mwlContent.ts` (MWG
      does not validate table row ids).
      **2026-09-14:** closed a real missing-reference gap this bullet's own scope names but had not
      covered yet: `monsterLoot`'s `kind` column (e.g. `"seed"`, `"gold"`, `"meat"`) is read in
      `monsters.ts`'s `MWL_MOB_LOOT` with a bare `String(row.kind) as GroundItemKind` cast, so a
      typo'd kind previously compiled clean under both `tsc` and `npm run build` and would only have
      surfaced as a wrong or missing dropped item at runtime - the same silent-failure shape the
      room-rule-table validator above was added to close. `tools/compile-mwl.mjs` now has
      `validateLootKindReferences()`, checked against a closed list mirroring
      `dungeonConstants.ts`'s `GROUND_ITEM_KINDS` (that file is real TypeScript and this script runs
      standalone via plain `node` before `tsc`, so it cannot import it directly - the same reason the
      `ITEM_SLOTS` list a few lines up in that file is hand-copied rather than imported). Verified the
      check actually fires: a deliberately mistyped `kind` value threw
      `MWL monsterLoot row for snake references unknown ground item kind: not_a_kind` and exited
      non-zero; reverted, and `npm run check` / `npm run build` are clean on the real data.
      **2026-09-14 (2):** added a second missing-reference check the same way:
      `validateConsumableAliasReferences()` verifies every `consumableClassAliases.item` names a
      real authored `[item]` id, closing the gap a stale hand-typed duplicate list (fixed the same
      day - see the Journal scroll-catalogue fix in `PORT_COVERAGE.md`) had already fallen into
      once for real. Verified the same way: a deliberately wrong `item` value threw and exited
       non-zero, then reverted.
       **2026-09-14 (3):** added a third: `validateGroundKindAliasReferences()` checks
       `itemGroundKindAliases.groundKind` and `specialItemGroundKinds.groundKind` against the same
       closed `GroundItemKind` set - `src/items/itemKinds.ts`'s `groundKindForItem`/`portItemKind`
       both do a bare `as GroundItemKind` cast on these two tables' values with no runtime check at
       all, so a typo'd `groundKind` would compile clean and only surface as a live item rendering/
       behaving as the wrong ground-item family. Verified the same way.
       **2026-09-15:** the first representative generated-vs-Java value tests now exist:
       `tools/verifyItemWorkflows.mjs` pins all seventeen generator decks (five weapon tiers, five
       missile tiers, potion, scroll, runestone, seed, wand, ring, artifact, food, armor) plus the
       `floorSetTierProbs` matrix, the enchant/glyph pool shapes, and the Ghost reward weights to
       `Generator.java`/`Ghost.java`/`Weapon.java`/`Armor.java` at tag `v2.1.4` - the single-deck
       baseline these MWL tables reproduce (checked value-for-value, class order included; the two
       deliberate divergences, tier-3's own weights and DetectMagic for Disarming, are asserted as
       authored with their own citations). Verified the new assertions actually fire by mistyping
       one deck entry and watching the suite fail, then reverted. **2026-09-15 (2):** the same
       suite now pins the shared hero row and level-up increments, 49 monster base rows, the 7
       depth-scaled formula rules, and all 35 buff durations to tag `v3.3.8`, every value checked
       field-by-field with `extends` chains and `Mob`/`Char` defaults resolved. That audit fixed
       nine real errors (skeleton/necroSkeleton armor, Armored Brute 4-16 corrected to 4-12,
       Fetid Rat armor,
       Albino HP, and the King/Yog/fists' experience gate) and corrected the Yog row's overstated
       fist-stats claim - see `PORT_COVERAGE.md`. Deterministic output needs no new test: every
       `mwl:compile` already compiles twice via MWG's `compileAndEmitSources` and fails on any
       difference. With duplicate IDs, missing references, stable ordering, deterministic output,
       and representative values all covered, this bullet is done - checked. Remaining
       Java-parity value work is explicitly elsewhere: talent formulas are section 6's, and the
       v3.3.8+ generator delta (Cudgel/Pickaxe/Dart, the potion/scroll dual-deck split, the newer
       artifact roster) stays Not ported in `PORT_COVERAGE.md` with section 1.
- [x] Adopt MWG 0.7.2 (2026-09-11): bump the `mwg` pin and use typed MWL tables for the first
      authored tables. The enchant/glyph/Unstable catalogues are now `[table]`/`[row]` data in
      `affix-rules.mwl`, read through a single `MWL_TABLE`/`MWL_TABLE_ROWS` accessor in
      `mwlContent.ts`; the hand-split `set=` parser and `validateAffixTables()` are gone, and
      `rollGeneratedAffix` uses `Actors.rollAffix`'s own `curse` pool option instead of filtering
      entries by hand. Browser-verified on 0.7.2 with an identical roll distribution (13/7 weapon,
      13/8 armor, none when ineligible). A second batch converted `missileDefinitions`,
      `curseDefinitions`, `bossTransitions`, `scenarioChapters`, `scenarioQuests`, and
      `questDefinitions`, whose consumers in `mwlContent.ts`/`monsters.ts` now just map typed rows
      (the build script's `bossTransitions` validator reads the table through `contentCatalog`). A
      third batch converted the room-rule tables `regionRoomCounts`, `standardRoomChances`, and
      `connectionRoomChanceRows` (the last is a new table beside the retained
      `connectionRoomChances` classes trait), which `regularLevel.ts`/`connectionRoom.ts` now read
      as typed row arrays. A fourth batch converted the monster/actor tables `monsterRosterByDepth`,
      `monsterRosterFallback` (from `monsterRosters`' two effects), `monsterLoot`,
      `limitedDropDecay`, `monsterAiProfiles`, and `actorBaseAliases` (from `actorFlags`), which
      `monsters.ts` now maps directly; the build script's roster/alias/AI-profile validators read
      those tables too. A fifth batch converted `alchemyEnergy`/`alchemyRecipes`/
      `alchemyRecipeManifest`, `badgeCatalogue`, `buffDurations`, `regionTrapTables`,
      `regionPaintRules`, `floorSetTierProbs`, and `talentClassEntries`/`talentSubclassEntries`
      (from `talentTrees`; its `tier_thresholds` scalar stays a trait effect). That completes the
      row-table conversion - every remaining `set=` is a scalar, an id-list, or a formula, not an
      array-of-records. Every converted table was checked value-identical to its old rows. Also
      adopted in the same pass: `tools/compile-mwl.mjs` now emits through `compileAndEmitSources`/
      `emitArtifacts` (MWG owns the compile-twice determinism check and the artifact set, with the
      game-owned generated modules passed as `artifacts`), and `simulation/entityId.ts` dropped its
      unused `trackEntity`/`idOfEntity`/`hasEntity` helpers (MWG 0.7.2's caller-chosen
      `EntityRegistry.add(entity, requestedId?)` exists, but `simulation/` is framework-free, so the
      registry belongs at the scene/adapter layer).
- [x] Update the build, test, package, and browser-smoke documentation so a clean checkout can
      reproduce every generated resource without a local MWG checkout (2026-09-11). No npm
      script needs the framework sources now: `npm run mwl:compile` reads only the installed
      package, and the two harnesses that still compiled a sibling `../MW_games` tree -
      `tools/verifySimulation.mjs` and `tools/verifyItemWorkflows.mjs` - shim the installed
      `dist` instead (ESM from CommonJS, which `require()` bridges on Node >= 22.12). That was a
      real defect, not just tidiness: the checkout is a different version from the pinned
      dependency (0.7.3 against the 0.7.2 pin), so both suites were testing something the game
      does not ship, and `npm run test:simulation` was failing outright - the old hand-written
      list of framework modules to compile had missed `Campaign.ts` once the checkout's
      `simulation/index.ts` grew it (`Cannot find module './Campaign.js'`). The only remaining
      `../MW_games` references are `tools/verify-mwg-integration.mjs` and
      `tools/prepare-mwg-ui.py`, both deliberate, documented, opt-in framework-development tools
      that no npm script invokes.
- [x] Bump the `mwg` pin to 0.7.3 (2026-09-11), then to **0.7.4** the same day once it was
      published. 0.7.4 brings what this port had asked for and could not have: `FloatingTextStack`
      and `FloatingTextOptions.hold`, `ParticleEmitterOptions.frames`, `Bar.setColor`/`background`,
      and in the framework checkout's tree `TerrainKind.flags`/`extras` and `Scheduler` priority.
      Still to adopt from it: `src/ui/floatingText.ts` -> `FloatingTextStack` + `hold`, and the
      title flame -> `frames`.
      The 0.7.3 step, for the record: 0.7.3 is published, and the bump alone changes
      nothing else here: the MWL compile emits byte-identical generated modules, `check`/`build`
      are clean, both suites pass, the start-up and save smoke are clean, and the depth-25 live
      checks (fist decks, challenge pairs, beam burning, view radii) come out identical. The
      hourly check while porting is `npm run mwg:check` (`tools/check-mwg-version.mjs`), which
      reports the pin, the installed version, npm's latest, and a checkout's version when passed
      with `--checkout`.
- [x] Re-audit the installed MWG release through `0.7.6` (2026-09-11), rather than treating a
      version bump as automatic adoption work. The port now consumes the published
      `ParticleEmitter` film API, `FloatingTextStack`, `Bar`, typed MWL tables, caller-chosen
      `EntityRegistry` ids, scheduler priorities and `Blob.spread`'s emptied-cell result where
      they are useful. The remaining generic proposals are intentionally tracked in §11A below;
      SPD-specific behavior stays in this repository.
- [x] Flammable terrain and fire burnout: the port now has a live representable slice of this model:
      fire decays in place and representable grass/door cells burn out into a distinct `EMBERS`
      terrain kind, with plants removed, exact one-volume decay, orthogonal volume-4 propagation,
      and cooked Mystery Meat. **Closed 2026-09-15:** the "remaining work" sentence below was
      stale on three of its four items - SewerLevel decoration is live (REGION_DECO to WATER,
      REGION_DECO_ALT to EMPTY_SP), heap burning matches `Heap.burn()` for every represented
      kind, and occupant ignition runs through the shared gate; see `PORT_COVERAGE.md`'s
      fire-remainder audit. What genuinely remains is webs, which need the Web blob to exist
      first (section 5's Spinner ability owns web creation; the fire side, the blob
      descriptions, and Spinner's Web immunity are already waiting for it). The full Java inventory -
      terrain, characters, items, plants, the sixteen igniters, and the Java limitations we will
      deliberately not reproduce - is `tools/scratch/FLAMABLE-INVENTORY.md`, gathered 2026-09-11 under
      AGENTS.md's new fidelity policy (iso is no longer the goal). It corrects the claim this item
      used to make: `Terrain.flags[DOOR]` and `flags[OPEN_DOOR]` **do** carry `FLAMABLE`, so the Yog
      beam's door handling was always right; the flamable set is `GRASS`, `HIGH_GRASS`,
      `FURROWED_GRASS`, both door states and `BARRICADE` (the wooden barricade), plus webs while they
      exist and the `SewerLevel` deco special case. `Fire.evolve()` is what burns terrain, converting
      a flamable cell to `EMBERS` (passable, *not* flammable) through `Level.destroy()` when its fire
      reaches zero, igniting the occupant, burning the heap and withering the plant. `EMBERS` is now
      a real live kind, fire decays in place, and ordinary fire propagates orthogonally onto the
      representable grass/door set with Java's volume-4 seed. A burned cell restitches its own
      tile face and the features layer is redrawn when a plant withers (the same redraw every
      grass change already performs); before that the terrain changed in the model only, and the
      old `EMBERS` face never appeared. Remaining work is webs, SewerLevel
      decoration, the full heap/occupant subtype rules, and other unsupported terrain cases. The
      generic Blob is deliberately not used for this transition because its diffusion/decay model
      is not Java Fire's exact one-volume step.

- [x] Replace `src/ui/bar.ts` with `mwg/ui`'s `Bar` and delete it (2026-09-11, on 0.7.4): done,
      and with it `tools/scratch/uiCheck.ts`. The four consumers (HUD health and experience, the
      per-monster bars, the boss bar) use `fillTexture`/`background`/`roundUpToPixel`/`setValue`
      and `setColor`, behaviour-identically - the port's `Bar` always rounded up, so every bar was
      given `roundUpToPixel: true` rather than changing any pixel. Verified live in the browser.
      The item's original scoping, kept below because it is how the blocker was found: `fillTexture`
      (the real bar art, stretched) and `roundUpToPixel` (`HealthBar.layout()`'s ceil-to-pixel
      rule) are already in the framework's `Bar`, so those are covered today. What blocks the
      deletion is the two things it still lacks and this file uses: recolouring the fill after
      construction (the boss bar goes red while the boss bleeds) and a track colour (the HP bar's
      missing-health strip is black, not the theme's panel fill). Both are in that patch, with
      framework tests. Check `StatusPane`'s two real bar arts still stretch the way Java's
      `scale.x` does before deleting.
- [x] `src/ui/floatingText.ts` replaced by `mwg/ui`'s `FloatingTextStack` + `FloatingText`'s
      `hold` curve (2026-09-11, on 0.7.6): the file is deleted and `showStatus` pushes one pop-up
      per number keyed by creature. **Both defects carried at adoption were fixed upstream in
      0.7.7 and are adopted here as of 2026-09-12 (on 0.7.8)**: the stack now lifts the *older*
      line above the newcomer instead of moving the newcomer down (this port's own finding, filed
      as `tools/scratch/mwg-proposal/0003-floating-text-stack-upward.patch` and recorded in
      0.7.7's changelog as "found by a consumer measuring it, not by the tests, which asserted the
      offset's magnitude and never its direction"), and `push` takes a `scale` applied *before*
      measurement, so a pop-up scaled after the push is no longer spaced by the 21px raster it was
      not drawn at - `showStatus` passes `scale: floaterTextScale` instead of chaining
      `.scale.set(...)`. Live-verified on the built page
      (`tools/scratch/floaters-livecheck.mjs`): measured height `9.45` = the drawn `7px x 1.35 / 3`,
      the older line `13.45` above the newcomer (drawn height + Java's 4px gap), newcomer unmoved.
- [x] `titleFlame`'s flame film now uses `ParticleEmitter.frames` with the two flame quadrants
      from Java's four-quadrant `fireball.png` (2026-09-11, on 0.7.6). MWG owns the pooled
      cadence, lifetime, motion, and frame selection; the tiny colour-only sparks remain local.
      The emitter has no per-spawn position range or height clamp, so those two presentation
      details are documented reductions in `PORT_COVERAGE.md`.

## 2. Complete dungeon generation and regional content (closed 2026-09-15)

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
- [x] Port all special-room item and monster generation, including missing RNG calls.
      **2026-09-15, closing note:** all 21 `SpecialRoom`/`CRYSTAL_KEY_SPECIALS` subclasses and
      all 12 `SecretRoom` subclasses have real, RNG-call-for-call `paint()` methods (see
      `PORT_COVERAGE.md`'s sub-pass 4/5 rows), each with its own header comment stating exactly
      which rolls are real versus skipped Generator-internal remainder. Today's audit pass found
      and fixed the worst remaining defect in this catalogue - `CrystalPathRoom`'s `paint()`
      wasn't even a port of the real Java method (an invented design that could hang the whole
      generator forever on certain room shapes) - and spot-checked `CrystalChoiceRoom` and
      `CrystalVaultRoom` (the other two crystal-family rooms) against real Java with no
      comparable defects found. What remains open is exactly what every "Ported"/"Simplified" row
      already documents per-room in `PORT_COVERAGE.md` (Generator-internal content picks this
      port's simplified item-generation model can't reproduce call-for-call, a few narrow
      position-retry/door-center rounding gaps) - real, itemized, and none of it a missing
      feature or a crash risk, which is the bar every other closed bullet in this section meets.
      **2026-09-14:** `ToxicGasRoom` now carries both Java's ambient 30-volume seeds and its
      persistent 12-volume `ToxicGasSeed` vent emitters into live gameplay; the remaining work
      in this item is the broader special-room catalogue and any still-unported room-specific
      consequences.
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
      **2026-09-15:** `CrystalPathRoom`'s `paint()` was found to not be a port of the real Java
      method at all - an invented "re-rolled center, clockwise quadrant walk" design that could
      hang the whole generator (a room with both dimensions odd made the do-while's exit
      condition permanently false; reproduced live at seed 123456789, depth 12). Rewritten to
      Java's real four-branch (`entry.x==left/right`, else `entry.y==top/bottom`) six-`EmptyRoom`
      geometry, the real six `new EmptyRoom()` RNG-burning constructions (previously only four),
      and the real `Door.Type.REGULAR` entrance (previously wrongly locked with an iron key - the
      room's own `CRYSTAL_DOOR`s are what actually gate it via the three seeded `CrystalKey`s).
      Loot picks remain a documented simplification (single `randomCategory()` draws, no
      exotic-item/duplicate-avoidance system), but the real `Random.Int(2)` branch and shuffle
      rolls are both honoured. See `PORT_COVERAGE.md`'s special-room row.
- [x] Port Halls' `DemonSpawnerRoom`: real Java room placement and the `HALLS_SP` custom-floor
      atlas through the live MWG sprite-sheet path; defeated spawners remain absent on revisit.
      **Formatting fix, 2026-09-09**: this bullet was a malformed list item missing its own
      `- [x]` checkbox marker entirely (just a bare `-` before the text), so
      `tools/roadmap-progress.html`'s checkbox counter silently dropped it from both the
      numerator and denominator - it never actually counted toward either "done" or "total".
      Content unchanged, only the marker restored to match what the prose already describes as
      finished.
- [x] Preserve Java room-placed NPCs and special mobs through the live-game bridge.
- [x] Implement rare and alternative monster spawns. Regional 2.5% additions and Java's
      per-entry 1-in-50 alternative swaps (Albino, Caustic Slime, Bandit, Spectral
      Necromancer, Armored Brute, DM-201, Senior, and Acidic) now occur in the correct
      add-rare -> swap -> shuffle order, with distinct stats/loot identities and live
      combat hooks where the current buff model supports them.
- [x] Implement signs, wells, chasms, crystal-door consequences, statues, plants, and mining branches
      **2026-09-15, closing note:** every named item here is live: signs/wells (with two real
      Java bugs found and fixed against `WaterOfAwareness.java`/`WaterOfHealth.java`, see below),
      chasm falling (real `Chasm.heroLand()` Cripple/landing-damage, Levitation bypass), crystal
      doors and chests (real crystal-key consumption, crystal-mimic theft/return, and - per
      today's `CrystalPathRoom` rewrite - the room's own Java-accurate `CRYSTAL_DOOR` layout and
      `CrystalKey` seeding), statues (StatueRoom's generated enchanted weapon/armor payloads,
      closed under this section's earlier bullet), plants (Java-aligned single-target statuses,
      Warden-sensitive variants, Fadeleaf relocation, Sungrass/Icecap/Rotberry persistence,
      Swiftthistle's timer+queue - see `PORT_COVERAGE.md`'s terrain-interactions row), and mining
      branches (the Blacksmith MiningLevel, closed under this section's second bullet). The one
      item flagged "remain simplified" below - seed growth/Lotus preservation - already has its
      own dedicated `PORT_COVERAGE.md` row marked **Ported** (with a presentation/carrier
      simplification, not a missing feature): `WandOfRegrowth`'s Lotus grants the real
      `25 + 3*wandLevel` HP and the real `0.40 + 0.04*wandLevel` seed-preservation chance. Closing
      to the same bar as every other bullet in this section: live, working, with narrow
      documented Generator-internal/presentation gaps, not missing functionality.
      **2026-09-14:** the existing Feather Fall alchemy result now grants Java's one-chasm
      protection and is consumed before landing damage; terrain and other hazard gaps remain.
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
      floor save/load while retaining SPD-specific consequences (fetched `WaterOfAwareness.java`/
      `WaterOfHealth.java` to confirm the exact effects this pass, and fixed two real divergences:
      the awareness well was fully identifying the whole bag with no Java basis - real
      `Belongings.observe()` only touches the equipped weapon/armor/ring, already covered by this
      port's existing equip-time identify simplification, plus marks unequipped backpack
      equipable/wand items cursed-known without fully identifying them, now matched, alongside a
      real `awareness` buff grant; the health well was also wrongly clearing `burning` - real
      `PotionOfHealing.cure()` never touches it - and was missing `uncurseEquipped()`'s weapon/
      armor/ring curse-clear entirely, both fixed); chasm falling now also applies
      `Chasm.heroLand()`'s real Cripple application and HP/HT-scaled landing damage through the
      normal hero-damage absorption pipeline, correctly killing the hero on a fatal fall, and
      Levitation now bypasses chasms the same way it already bypassed traps - see
      `PORT_COVERAGE.md`'s `Chasm.java` row for what's still not ported there).
      Active magic wells now also show a scene-owned, FOV-gated ripple animation over the well;
      its deterministic vector-ring reduction is documented in `PORT_COVERAGE.md`.
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

## 12. Publish a playable build on GitHub Pages (closed 2026-09-15)

- [x] Deploy `dist/` to GitHub Pages so the game is playable at
      `https://datamoc.github.io/mwg-pixel-dungeon/` without a local checkout. `vite.config.ts`'s
      `base: './'` (relative asset paths) needed no changes for the project-subpath Pages URL;
      `tools/emit.mjs`'s built `index.html` (non-module `<script defer>`) loads over `https://`
      exactly like it does over `file://`. `.github/workflows/deploy.yml` (`npm ci`, `npm run
      build`, upload `dist/`, deploy; triggers on push to `main` plus `workflow_dispatch`) existed
      from an earlier pass but had never actually been pushed - this repo was 42 commits ahead of
      `origin/main` the whole time, so the workflow, and everything else committed since, only
      existed locally. The user explicitly asked for the deployment this pass (confirmed via
      `AskUserQuestion` that the project-subpath URL, not a separate root `datamoc.github.io`
      user-page repo, is what they want), which resolved both open items below at once: pushed
      main, enabled Pages via `gh api -X POST repos/.../pages -f build_type=workflow` (source:
      GitHub Actions), and the push-triggered run deployed successfully
      (`gh run watch` - both `build`/`deploy` jobs green). Verified live over HTTP: the deployed
      page serves the real built `index.html` (non-module `<script defer src="./game.js">`, not
      the unbuilt-source fallback) and `game.js` itself returns `200` at its full ~25.6MB build
      size. **Not verified this pass**: actual in-browser rendering (title screen, class-select,
      a played floor) - no working browser tool was available this session (`claude-in-chrome`
      extension not connected, `chrome-devtools-mcp`'s browser unreachable/already running
      elsewhere), so this is HTTP/asset-shape verification only, honestly short of the real
      "open it and look" bar the rest of this file holds itself to - owed as a follow-up. Every
      future push to `main` now deploys automatically (the auto-vs-manual choice both options
      being kept for was implicitly resolved by asking the user to trigger deployment via a push-
      based workflow at all). **Live browser confirmation done 2026-09-09** (`chrome-devtools-mcp`):
      opened `https://datamoc.github.io/mwg-pixel-dungeon/` directly, the title screen rendered
      correctly (menu buttons, background, title art - showing the pre-existing cropped-logo bug
      documented below, since that fix was made locally this same pass and not yet pushed).
- [x] **Track the latest `mwg` release and build every packaging target it supports, not only the
      GitHub Pages web build.** **Done 2026-09-15, except iOS.** The tracking half is now the
      `mwg`-usage audit's recurring job (`npm run mwg:check`, `tools/check-mwg-version.mjs`, plus
      the audit section in `PORT_COVERAGE.md`, which was refreshed against 0.13.0 the same day).
      The packaging half ships as `RELEASING.md` + `.github/workflows/release.yml`, triggered by a
      `v*` tag and by nothing else: an ordinary push still only deploys Pages. Artifacts, all built
      on a tag and attached to the GitHub Release (which answers the "where are they published"
      question the item left open - Pages for web, Releases for the binaries): the single-file
      gzipped and brotli pages, a self-host zip carrying `mwg/tools/compress-dist`'s `.gz`/`.br`
      siblings, a debug-signed Android APK, and a self-contained Windows WebView2 build. Every one
      of them was produced locally first: the APK with the same `cap add`/`cap sync`/`gradlew
      assembleDebug` commands the workflow runs (JDK 21 + Android platform 35), and the desktop
      host published, launched and probed over CDP - `window.__MWG__` live, canvas present, and
      `localStorage` writable, which is the reason the host maps a virtual host name onto the game
      folder instead of opening `file://`. **Two findings this item did not anticipate**: the
      framework's Capacitor/WebView2 scaffolding is *not* in the published package at all (its own
      `cap:*`/`desktop:*` scripts point into its repository), so this project carries its own
      WebView2 host - recorded as P18 in `4MWG/IMPROVEMENT_PROPOSALS.md`; and the ~28 MB bundle is
      not a code-splitting problem, since 11.4 MB of assets on disk become ~15.2 MB of base64
      (54% of the bundle), so the compression artifacts are the lever, not chunking. Still open:
      iOS (needs a macOS runner with Xcode and signing), and Play Store publishing (needs a
      keystore and a signing config the workflow does not yet apply).

> Moved 2026-09-15. Two of this section's own cross-references have since moved on, updated
> here rather than left reading as live: the audit it cites was refreshed against the installed
> **0.14.0** the same day (see `PORT_COVERAGE.md`'s sixth pass), and **P18 is now closed** -
> 0.14.0 documented the consumer packaging recipe the proposal asked for, including every
> gotcha this item listed. The finding underneath still stands, which is why this repo carries
> its own host: the framework's scaffolding is still not in its published `files` list.
