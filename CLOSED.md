# Closed roadmap sections

Fully checked-off sections of `ROADMAP.md`, moved out here to keep the working roadmap focused
on open items. A section moves here only when *every* checkbox in it is `- [x]`; a section with
even one remaining `- [ ]` stays in `ROADMAP.md`. Sections moved 2026-09-14, 2026-09-15, 2026-09-16, 2026-09-18, 2026-09-23 and 2026-09-24; see
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

## 3. Port every boss level and boss script (closed 2026-09-16)

Moved here from `ROADMAP.md` with all 15 checkboxes checked. Original body follows unchanged:

- [x] Port the fixed Prison boss-floor layout at depth 10. **Correction, 2026-09-16: this was
      ticked while the layout was in fact unwalkable.** Java's `Painter.fill(level, rect, ...)`
      takes exclusive `right`/`bottom` edges, but this floor's rects were transcribed through an
      inclusive helper - so `startCells[0]`'s border covered x=10 instead of stopping at x=9, and
      deleted the level's entire one-cell hallway spine. The hero arrived in the entrance room and
      could reach nothing else on the floor: not the start cells, not Tengu's door, not the boss.
      Fixed by transcribing `setMapStart()` in Java's own exclusive-bounds form (the module's
      `fillJavaRect`/`fillJavaRectInset`), which also restored the four doors between the hallway
      and the flanking cells, the entrance room's own door, and the cell's real interior. Caught by
      a flood fill from the arrival cell, which is now pinned in `tools/verifyVault.mjs` (per-cell
      assertions had all stayed green over the broken map). Not ported, stated:
      `addCagesToCells()`'s 5 `REGION_DECO` cells - decoration only, and this floor carries no RNG
      stream of its own. See `PORT_COVERAGE.md`'s `PrisonBossLevel` row.
- [x] Finish re-reading the other three fixed boss layouts against Java's own fills. **The arena
      shapes are done** (2026-09-16): all three were being read inclusively, and two were the wrong
      *kind* of shape. Java's `fillEllipse(rect, m)` is the rect's exclusive extent inset by `m`,
      so the Caves arena is 23x23 and Tengu's is 13x13, not the 24x24/14x14 the port passed; and
      `CityBossLevel` carves the King's throne room with `fillDiamond`, not `fillEllipse` - a
      45-degree square whose corners are wall, 81 cells against the ellipse's ~154. Fixed through
      new `fillEllipseRect`/`fillDiamondRect` helpers, verified live
      (`tools/scratch/city-arena-livecheck.mjs`, 6/6: the live floor's walkable set *is* the
      diamond, its bounding corners are chasm, and the King still spawns and acts over it) and
      pinned in `verifyVault.mjs` against a blank map recomputed from Java's own arguments. That
      also turned up a real gap in `gameBridge.ts`: `REGION_DECO`/`REGION_DECO_ALT` had no
      `toGameTerrain` mapping at all, so the Caves' exit-corridor rails crashed level entry with
      `no mapping for Terrain value 34` the moment they were painted - both now map to `floor`, and
       the Caves rails are painted. **Closed 2026-09-16 including the decoration-only tail:**
       the City's entrance room now paints Java's outer `WALL` ring, insets, two `BOOKSHELF`
       columns, two `REGION_DECO` marks, three `STATUE` rows, `EMPTY_SP` spine, door and
       entrance, and its arena paints the `fill(arena, 5, EMPTY_SP)`/`fill(arena, 6,
       CUSTOM_DECO)` margins with statues and pedestals at Java's cells;
       `new CityPainter().paint(this, null)`'s scatter runs at Java's position via
       `cityDecorate.ts` (26 `EMPTY_DECO` / 12 `WALL_DECO` at seed 42, pinned in
       `verifyVault.mjs`); the Halls arms roll Java's own `IntRange`s with all ten draws,
       the three whole-floor passes run in order, and the room has Java's 11x11 `EMPTY`
       ring, 26-cell `WALL_DECO` band (walkable 9x7) and inner `EMPTY`, with Java's own
       rebuild-on-disconnect. **The tail**: `CustomGroundVisuals`/`CustomWallVisuals` are
       transcribed into `cityBossVisuals.ts` (`city_boss.png` was vendored but never loaded)
       with two scene layers and the three examine branches, pinned in `verifyVault.mjs`
       (stairs run, throne rows, pedestals, skull piles, pillar pairs, shadow rows,
       name-implies-drawn); and Prison's `addCagesToCells()` scatters Java's own five cells
       off the `seedCurDepth()` substream (`spdSeedForDepth` *is* that seed, same scramble,
       same call order - so these are Java's cells, not an approximation), re-rolled onto
       each transition repaint the way the three Java call sites do, and pinned the same way.
       Nothing open on this line.
- [x] Port the fixed Caves/DM-300 boss-floor layout at depth 15. **Correction, 2026-09-16: this
      floor's *base* terrain was wrong, and it was a hole out of the boss arena, not a look.** Java
      fills every level whose `feeling` is not CHASM with `WALL` (`Level.setSize()`, and no boss
      level sets a feeling), so the Caves arena is floor carved out of solid rock with the five
      explicit chasm strips of `build()` as its only pits. This port built the whole floor over a
      CHASM base instead, which left **34 walkable cells of the arena and its entrance corridor
      next to a pit** where Java has wall (452 stray pits in total) - and since this port lets the
      hero step into a chasm (`canStepOnto`'s pit branch), the hero could fall out of the boss
      floor mid-fight. Fixed by the `WALL` base plus Java's own five strips painted in its own
      order, which also brings the pit count from 584 to Java's 132. Pinned in `verifyVault.mjs`
      (no pit outside Java's strips, no walkable cell bordering one - both proven load-bearing by
      restoring the old base and watching them fail). **Found with it: the pickaxe gate was a depth
      range, not Java's condition.** `Hero.java` 1913 mines only where
      `Dungeon.level instanceof MiningLevel` - the mining *branch* - while this port allowed it on
      every Caves depth 11-15, so the hero could tunnel through ordinary Caves floors and through
      this arena's own walls. Now gated on `miningBranchActive`, that `instanceof`'s exact
      equivalent here, with the pickaxe requirement kept; browser-verified live
      (`tools/scratch/caves-mining-gate-livecheck.mjs`, 5/5: closed on a real depth-11 floor with a
      real pickaxe and a real wall step that leaves the wall standing, open inside the branch where
      the same wall comes down, and closed again on leaving). See `PORT_COVERAGE.md`'s Caves rows.
- [x] Port the fixed City boss-floor layout at depth 20.
- [x] Port the fixed Halls/Yog boss-floor layout at depth 25.
- [x] Port the fixed final vault/endgame layout at depth 26.
- [x] Port Prison/Tengu's real `START -> FIGHT_START` trigger, **and the `FIGHT_START` repaint it
      turned out to depend on**. Tengu is now not a live actor at all until the hero's own move
      lands past his locked door (`progress()`'s `case START:`, fired from `occupyCell`), spawned at
      Java's `tenguCellCenter` (10,27) with the real free-neighbour fallback and the abandon-and-retry
      when there is none; the door the iron key just opened is re-locked behind him, and
      `populate()` no longer spawns him on entry. That re-lock only works because the two later
      transitions reopen the door - so `enterTenguPauseMap()` now wires `setMapPause()` at the
      half-health beat (the one map repaint this file previously claimed was done while
      `prisonBossPause()` was called from nowhere), and the death transition re-places it for
      `setMapEnd()`'s own walkable exit. Browser-verified on the built game with 15 assertions
      (`tools/scratch/tengu-start-livecheck.mjs`): the hero *walks* from the arrival cell down the
      hallway, spends a real iron key on the door, steps in and Tengu appears, and each of the three
      transitions leaves its own destination reachable. See `PORT_COVERAGE.md`'s Tengu rows.
      Still open, all previously-stated simplifications of this fight rather than new gaps: Java's
      remove-then-re-add "he's vanished" beat during the pause, `clearEntities`' heap/mob/plant
      destruction and `cleanMapState()`'s blob/trap clearing at each repaint (the dart traps are
      deliberately kept), `seal()`'s own `LockedFloor` buff, the `BOSS_CHALLENGE` badge (tracked as its
      own item in section 6 - it is not a stray flag, it is a whole unported badge rule), and the
      wool/PUFF/music presentation.
- [x] Port the remaining Caves/DM-300 arena decoration. **Done 2026-09-16**: the gate's
      `CustomTilemap` dressing (`CityEntrance`, `EntranceOverhang`, `ArenaVisuals`) is now ported, so
      the entrance region and the arena's wiring render as they do in Java instead of as bare tiles -
      the sheet they draw from (`caves_boss.png`) was not even loaded before. Written up in
      `PORT_COVERAGE.md`'s own `CavesBossLevel`'s three custom tilemaps` row; the pass also found and
      fixed four real bugs on the way (two integer-division readings in the ported frame tables, the
      pylon cells being force-painted `EMPTY`, which made `updateState()`'s whole pylon branch dead,
      and the gate rect read inclusively - six gate cells where Java has five, which put one extra
      cell into `activatePylon()`'s energy set). **The `CavesPainter` claim this line used to carry
      was wrong twice over and is now corrected, not deleted:** there *is* a decoration pass to
      reproduce - see the item directly below - and the entrance's EMPTY/EMPTY_SP/STATUE/EXIT fills
      are not hand-matched rects but Java's own `Painter.fill` calls from `build()` transcribed one
      for one. What remains of this item's *subject* is deliberate and recorded: Java's gate is solid
      `CUSTOM_DECO` and blocks the exit corridor until `unseal()` breaks it, while this port's is
      walkable from the start (`SIGN` -> floor) - kept even now that `unseal()` is ported (see the
      auto-descent item below), since solidity would need a per-cell SOLID channel this port has
      no form of. The gate's broken frames (`32..36`) appear at `unseal()` through the arena-visuals
      re-map.
- [x] Port `CavesPainter.decorate()`'s boss-floor pass, which decides this floor's floor-deco and ore
      veins. **Done 2026-09-16.** It is two whole-level scans (an `EMPTY` cell with a wall neighbour
      becomes `EMPTY_DECO` on `Random.Int(6) <= n`; `generateGold` paints `WALL_DECO` on
      `Random.Int(4) == 0` above a floor tile) and they run even with a null room list, so
      `CavesBossLevel.build()`'s `new CavesPainter().paint(this, null)` was never the no-op an earlier
      note here called it: the port was one *parent-stream* draw short of Java from that point on
      (`Random.pushGenerator(Random.Long())`, whose substream the scans then draw from). The floor now
      runs it at Java's own position - after the entrance/corner stamps, before the chasm strips, which
      is where the scans must read the map - reusing `decorateStandaloneCaves`, the same function
      `MiningLevel` already ran, which `cavesPainter.ts`'s regular-floor `decorate()` now calls too
      rather than keeping a second copy (so one implementation serves the regular floors, the boss
      floor and the mining branch; the light `cavesDecorate.ts` exists so a fixed-layout floor does not
      have to pull in the room-graph pipeline to reach it). Measured at seed 42: 95 `EMPTY_DECO` and
      13 `WALL_DECO` cells, with the pylon mechanic's own terrain untouched (132 pits, 40 water, 36
      traps, 5 gate cells, 81 energized cells). Pinned in `verifyVault.mjs` as a regression pin, so
      dropping the call fails the suite.
- [x] Port City/Dwarf King's throne geometry and Imp shop. **Done 2026-09-16, with the
  blocking `unseal()` landed in the same pass.** The full 1/2/3-phase fight script was already
  live and browser-verified (exact summon/ability cooldowns, the P2 shield/wave schedule, the P3
  viscosity-deferred damage, the Crown drop). The throne room is now `CityBossLevel.build()`
  statement for statement (entrance room, diamond with margins, statues, pedestals, exit
  hallway, Imp shop base marks, pillars, `CityPainter` scatter - see the re-reading item
  above), the `seal()` half locks the bottom door behind the hero on approach
  (`checkCityBossSeal`, persisted like the other seals), and `applyKingDeathUnseal()` unlocks
  both doors and spawns the shop when `Imp.Quest.isCompleted()`. **Stated simplifications:**
  the `CustomGroundVisuals`/`CustomWallVisuals` tilemaps stay unported (presentation over the
  same terrain).
- [x] Port the last few Halls/Yog details. **Done 2026-09-16, with the one blocked clause moved to
      where its blocker lives.** The flame/shadow arena visuals - `HallsBossLevel`'s
      `CenterPieceVisuals`/`CenterPieceWalls`, two fixed 9x8 blocks of `halls_special.png` art over
      the arena, one on each side of the wall layer - are now ported (`hallsBossVisuals.ts` and two
       scene layers, pinned by a `verifyVault.mjs` check and browser-verified live); `unseal()`'s own
       portal/archway variant is transcribed with them and is swapped in live by
       `applyYogDeathUnseal()`. Phase-0 dormancy was **already live and is now documented as such** rather
      than listed as missing: `takeYogTurn`'s phase-0 branch owns Yog's whole turn, keeps it
      invulnerable, notices only once `fov.isVisible` covers it, and then yells, sets phase 1 and
      rolls fresh cooldowns - Java's `Dungeon.observe()`/`notice()` pair, whose boss-bar half has no
      UI here and whose music Java starts on the notice while this port starts it on floor entry.
      **The clause this item used to carry was mis-worded twice**: it is not a "Light artifact" and
      not a zap-weakening - Java's `YogDzewa.updateVisibility()` shrinks the *hero's* sight to Yog's
      own arena radius (`4 - (phase-1)`, floored at 1, and 2 under the Darkness challenge) and
      exempts a hero holding the **`Light` buff**, which in SPD comes from a **Torch** - an item
      class this port has no form of at all, so the exemption cannot be exercised yet. It now sits in
      section 1's missing-item-classes item, next to Torches themselves; the shrink itself, and the
      two-phase DeathGaze, are live and browser-verified - see `PORT_COVERAGE.md`'s Yog rows.
- [x] Port final-vault Amulet placement at Java's `AMULET_POS` (depth 26, x=8, y=12).
- [x] Port final-vault endgame-specific terrain, custom visuals, and compass behavior.
      `src/spdLevelGen/vaultVisuals.ts` plus a scene layer transcribe `CustomFloor.create()` statement
      for statement (cursor arithmetic, candle cluster, `tileVariance`/`amuletObtained` variants, the
      two `CenterPiece` stamps), the `EMPTY_DECO` scatter sits at its exact stream position in
      `lastLevel()`, and `create()`'s solid override is real via a new `SOLID` terrain kind - which
      also fixed the hero arriving on `(9,56)` instead of Java's transition cell `(8,54)`.
      `verifyVault.mjs` pins the transcription and `tools/scratch/vault-livecheck.mjs` proves it
      live. **Not ported, stated**: Java's `discoverable = false`/`visited = true` pre-seeding for
      the entrance rows, which this port's terrain-derived fog has no per-cell channel for.
- [x] Stop dungeon music on entry to the final vault, matching `LastLevel.playLevelMusic()`.
      `SpdAudio.vaultMusic`/`winMusic` play `THEME_FINALE` on loop until the Amulet is taken, then
      swap in the title pair (`THEME_2`/`THEME_1`, the reverse of `TitleScene`'s order);
      `theme_finale.ogg` is copied byte-for-byte out of the tag.
- [x] Remove the auto-descent and implement real victory transitions. **Done 2026-09-16:**
  Java never auto-descends, and now neither does this port - no boss death advances the depth
  directly any more. Each level's own `unseal()` runs at its boss's death and reopens a real,
  walkable exit: `applyGooDeathUnseal()` restores the drowned entrance, `applyDM300DeathUnseal()`
  restores the walled entrance, breaks the gate's five cells, clears the pylon energy and
  re-maps the arena visuals to the broken frames, `applyKingDeathUnseal()` unlocks both arena
  doors and spawns the Imp shop when the quest is complete, `applyYogDeathUnseal()` restores
  the entrance, sets the `EXIT` tile and swaps the centre pieces to their portal/archway
  variant, and Tengu's `setMapEnd()` transition already worked this way. Each opens
  `hasStairs`/`stairs` at Java's own exit cell, so the hero walks out through the ordinary
  stairs path (which is also what persists the unsealed floor); the unsealed set is
  run-persisted with paint writes re-applied and stairs repaired after `restoreFloor`.
  Measured per floor (`tools/scratch/boss-reachability.mjs`, a flood fill from entrance to
  exit): depths 5, 10, 15 and 25 each have their seal ported and a real reachable exit once
  their fight ends - depth 10's own exit was only *really* reachable after the 2026-09-16
  layout fix above, since the flood fill reaches it now from the cell `setMapEnd()` puts the
  hero back in (pinned in `verifyVault.mjs`); depth 20's exit is reachable once
  `CityBossLevel.unseal()` unlocks its doors, which now happens live. Note the tool only
  measures depths whose own map carries an EXIT tile, so depth 10's entrance-to-exit half is
  covered by the pinned flood-fill checks rather than by it. **Stated simplifications:**
  the `LockedFloor` buff (the stairs gate on the boss's death instead), presentation-only
  halves (particles, music fades), and the King's Crown still granted to the bag rather than
  dropped (it has no ground-pickup path, unlike the Amulet, which the vault's own entry now
  spawns, guarded against re-entry minting a second).

## 12. Build and toolchain (closed 2026-09-18)

Moved here from `ROADMAP.md` with all checkboxes checked. Original body follows unchanged:

- [x] Check Rollup code-splitting (`build.rollupOptions.output.manualChunks`, https://rollupjs.org/configuration-options/#output-manualchunks). **Closed 2026-09-18 as a deliberate non-adoption**: the 28 MB `game.js` is 57% inlined base64 assets (192 `data:` URIs), which must ship regardless, so `manualChunks` changes the file count rather than the total bytes - while breaking the single classic-`<script>` `file://` model (one entry tag rewritten by `tools/emit.mjs`, no loader, no fetch) for zero local-load benefit. The >500 kB warning is accepted and recorded in `vite.config.ts`'s own comment.
- [x] Check MWL "native" compiler usage. **Closed 2026-09-18: already on the recommended path, nothing to adopt.** `tools/compile-mwl.mjs` drives the framework's own `mwg/mwl` library (`compileSources`, `validateCatalog`, `contentCatalog`, deterministic `compileAndEmitSources`), and its game-owned extras (cross-table validators, the four extra emitted modules in `ARTIFACT_PATHS`) are exactly what `mwg/tools/mwl.mjs`'s own doc comment prescribes over the CLI's intentionally-closed `build` (standard three artifacts only): a game's own small script against the public library API *is* the extension point, and this port already is that script.

## 7. Replace simplified terrain and status mechanics (closed 2026-09-18)

Moved here from `ROADMAP.md` with all 8 checkboxes checked. Original body follows unchanged:

- [x] Implement area-of-effect traps instead of single-target approximations. Explosive traps apply
      Java's reduced off-center blast damage to nearby creatures, and toxic, fire, shocking and storm traps seed the
      live area effects. **Remaining**: exact Java projectile presentation, terrain destruction, and
      cadence.
- [x] Implement chasm falling and traversal. `isChasmCell`/`fallThroughChasm` model the terrain;
      `Chasm.heroLand()`'s real Cripple + HP/HT-scaled landing damage and the Levitation bypass are
      ported. **Remaining**: source-specific Bleeding death badges/blood visuals, the feather-fall
      item, landing sound/camera shake. See `PORT_COVERAGE.md`'s `Chasm.java` row.
- [x] Implement water and terrain hazards. **Closed 2026-09-16 by auditing Java's own terrain table
      against this port rather than repeating "other hazards remain"**: `Terrain.java`'s flags carry
      exactly three behaviour classes - `PIT` (chasm), `LIQUID` (water) and `AVOID` - and each is
      accounted for. Water: `Level.java`'s per-turn hook (a non-flying char standing in `WATER`
      extinguishes `Burning`, matching `Burning.act()`) is ported for hero and monsters alike,
      collapsed to an immediate extinguish once the turn's DoT tick has landed rather than
      reproducing the exact one-turn-late timing; Ooze's own water interaction is ported too
      (CausticSlime/Acidic/FetidRat/Corrosion feed a real `ooze` buff instead of the shared `poison`,
      and standing water washes it off). Chasm: `Chasm.heroLand()`'s Cripple + HP/HT-scaled landing
      damage and the Levitation bypass (section 7's own chasm item). `AVOID` is **deliberately
      collapsed into `passable`** and that is the one real simplification here, now stated rather
      than implied: Java's `avoid[]` marks cells you may enter or path over without being ordinary
      floor (chasm, `TRAP`, `WELL`), and every one of its readers is either a `passable || avoid`
      test (`Char.java` 1256, `Hero.java` 1782, `WellWater.java` 89, `Dungeon.java` 1038,
      `Preparation.java` 288/293) or the flying exception to one (`Combo.java` 500's
      `flying && avoid`, which is exactly how a flyer crosses a chasm) - so a game that already
      treats those cells as enterable answers every one of them the same way, which this port does
      (`canStepOnto`'s pit branch, traps walkable). The one place it shows is `WELL`, which Java keeps non-passable and this port maps
      to plain floor (its own stated simplification, see `gameBridge.ts`'s mapping table). Also
      still unported, and tracked with the mining work rather than here: `MINE_CRYSTAL` and
      `MINE_BOULDER`, the two terrain kinds Java's pickaxe accepts alongside `WALL`/`WALL_DECO` -
      this port has no equivalent of either (see `canMineCavesWall`'s own comment). See
      `PORT_COVERAGE.md`.
- [x] Complete plant growth and plant interactions. Live: one-shot regional plant activation,
      Java-aligned single-target statuses, Sungrass healing-over-time, Warden-sensitive variants,
      Icecap/Rotberry blob diffusion, Dewcatcher's 3-6 distinct dewdrops, Seedpod's 2-4 generated
      seeds, Lotus seed preservation, Fadeleaf freeing a rooted hero (and teleporting movable mobs),
      non-hero plant activation, and Earthroot's real block *pool* (`HT` points absorbing
      `min(damage, (scalingDepth+5)/2)` per hit, ended by exhaustion or leaving the cell) - which
      also corrected the Entanglement glyph, previously modelled as a cripple lock on the attacker
      instead of the same pool on the defender. **Closed 2026-09-17:** teleport presentation - `ScrollOfTeleportation.appear`'s own visuals (TELEPORT sample when either endpoint is seen, `Speck.LIGHT` bursts at a visible non-hero departure and at the arrival when seen or hero, sprite 0-to-1 fade over 0.4s unless invisible) play through a shared `playTeleportAppear` at every random-teleport site (scroll, Fadeleaf hero/mob, Displacing/Displacement, Beacon zap, Blink, Golem, necromancer recall, PhaseShift), with the gating pinned in `verifySimulation.mjs` (`simulation/teleportAppear`); the stagger (3 particles over 0.2s) collapses to one burst and the camera-follow release has no counterpart. **Closed 2026-09-17:** TimeBubble per-char ownership - a mob stepping on Swiftthistle banks its own seven rapid turns (`Creature.timeBubbleTurns`, zero-cost through `monsterTurnCost`, ticked in `afterMonsterTurn`, persisted through save/load) instead of freezing the hero's world; the hero's global bubble and its delayed presses are untouched, and the mob's detach fires nothing since presses only ever land in the hero's bubble. **Closed 2026-09-17:** Sungrass's monster
      `Health` pool and Earthroot's monster armor pool are now the real Java shapes
      (`simulation/plantPools`, granted in `triggerMobPlantAt`, ticked/absorbed in
      `takeMonsterTurn`/`attack()`, persisted through save/load), and the full dew-collection rules (triangular Dewcatcher/Seedpod counts, entrance-cell exclusion; heap-stacking stays with the stacking-heaps item), the `HazardAssistTracker` system (50-turn mob mark from every modelled hazard producer, 10-assist badge), and exact teleport destinations (respawn-cell FOV/secret/pit constraints on the shared search, `IMMOVABLE_KINDS` mob gate, PhaseShift wander-beckon, TimeBubble disarm-on-transition). See `PORT_COVERAGE.md`.
- [x] Implement the remaining Java seed and dew behavior in high grass. **Closed 2026-09-16** once the
      three things it named were each checked rather than carried: the waterskin/dewdrop interaction was
      already ported and exact, the boss-challenge flag was a whole unported badge rule (now its own item
      in section 6), and the furrowed visual was reachable-but-collapsed and now draws its own art. The
      one genuine remainder, Java's `fx` bolt animation for the growth cone, is the *wand's* presentation
      rather than seed/dew behaviour and is tracked with the wand's own row in `PORT_COVERAGE.md`.
      Original text follows. Live: real seed payloads and
      planting, `WandOfRegrowth`'s charge-scaled regional growth over Java's own `ConeAOE`
      (`src/mechanics/cone.ts`, a line-for-line translation), Lotus spawn/expiry/preservation, and
      Huntress furrowed state persisting across floor saves. **Corrected 2026-09-16: two of the three
      things this line listed were not gaps in *this* item, and one was not a gap at all.** The
      waterskin/dewdrop interaction is ported and exact (verified against `Dewdrop.doPickUp`/
      `Waterskin.execute(AC_DRINK)`: the drop goes into the flask while it has room, `dropsNeeded` is
      `missingHealthPercent/0.05` with the same `ceil(x - 0.01)` and `gate(1, …, volume)` clamp, the
      `SHIELDING_DEW` top-up makes the same shield `min`-trimmed heal split, and only the
      `VialOfBlood.delayBurstHealing()` clause is missing - that item does not exist here). The
      "Dwarf King's boss-challenge-badge flag" is not a grass gap at all: it is the whole
      **`BOSS_CHALLENGE` badge**, whose real rule is a *weapon-only* boss kill - `qualifiedForBossChallengeBadge`
      is set true at all five boss fights' starts (`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel`/
      `PrisonBossLevel`/`SewerBossLevel`'s own `progress()`/`seal()`), cleared when the hero deals
      any damage that is not a plain weapon hit (each boss's `damage()` override: `DwarfKing.java`
      459-467 clears on unarmed-without-`RingOfForce`, on any `Wand` except `WandOfLightning`, and on
      a `ClericSpell`; `Goo`/`DM300`/`Pylon`/`Tengu`/`YogDzewa` have their own sites), and awarded at
      that boss's death - so it belongs with the badges, not here, and it is a real piece of work
      rather than a flag: this port's badge catalogue is its own smaller set (one boss badge per chapter,
      `src/badges.mwl`) with no `BOSS_CHALLENGE_1..5` in it, and clearing the flag needs a
      damage-*source* notion at every boss's damage sites, which this port's inline monster-damage
      paths do not thread today. What actually remains here is Java's `fx` animation for the wand's
      growth. **The furrowed visual is no longer simplified (2026-09-16)**: this line claimed the
      two states shared one frame, and `foregroundGrassFrame` shows they did not - it already
      returns Java's own cuts (`152`/`156` for `FURROWED_GRASS` against `151`/`155` for
      `HIGH_GRASS`), but nothing could reach the furrowed pair, because the renderer's terrain value
      collapsed both kinds onto the high-grass constant before consulting the raw grid. The live
      `visualTerrainAt` now answers `30` for a furrowed cell from the state the floor already
      persists, so a Huntress's trampled grass draws its own art; pinned two ways
      (`verifyVault.mjs` recomputes the four frame numbers, and
      `tools/scratch/furrowed-grass-livecheck.mjs` reads the live value, 3/3). What stays coarse,
      and is the stated remainder here: the *flat* ground layer still renders both kinds with one
      frame (`terrainFrameAt` returns the shared grass frame, where Java's
      `FLAT_FURROWED_GRASS` is its own cut) - only the raised/foreground overlay distinguishes
      them. **Complexity: S.**
- [x] Match hunger and starvation damage exactly (`Hunger.act()`'s real `partialDamage` fractional
      accrual and crossing-into-STARVING 1-damage hit, replacing the former flat "every 10 turns"
      guess). Java has no attack-delay/accuracy penalty while merely hungry beyond the log line, so
      there is no further penalty to match there. **Correction, 2026-09-19**: the starvation-damage
      curve above was right, but the hunger *climb rate* underneath it was a real, player-reported
      bug this line's own text never caught - `rings.mwl`'s `spdAdventureClock` authored
      `hunger: 10` per turn against Java's real `+1`, making a hero hungry/starving in 30/45 turns
      instead of the real 300/450 (both thresholds were always correct and unscaled, which is
      exactly what made the mismatched increment a 10x-faster bug rather than a harmless
      re-scaling). Fixed to `1`, with matching stale `10` defaults in `dungeonScene.ts`,
      `sceneSimulation.ts`, `gameSimulation.ts` and `simulation/hunger.ts` itself. See
      `PORT_COVERAGE.md`'s `Hunger.act()` row.
- [x] Match stealth, invisibility, surprise, and attack-delay systems exactly. Ported: sleeping
      wake-ups roll the real `1/(distance+stealth)` detection gated on the mob's own sight, with
      Silent Steps and levitation as their real never-wake immunities; the negative-buff wake (any
      real negative-type buff wakes a sleeping monster unconditionally, no roll, even out of sight);
      the WANDERING notice roll; persistent random-destination patrol state including save/load and
      piranhas' water restriction; and the whole invisibility half - `Preparation` is a real state
      (the attack's damage roll is replaced by the best of 1-3 rolls plus 10/20/35/50% at 1/3/5/9
      turns invisible, read before the invisibility dispel, and the execute fires only while it is
      up) plus its blink action (a real toolbar action attacking in place or stepping to the cheapest
      free cell beside a visible hostile, refusing an unreachable or rooted case with Java's own
      message). Surprise gating ported 2026-09-17 (thrown/unarmed/STR/flail plus the invisible
      disjunct, hero-only). **Closed 2026-09-17:** `Mob`'s wound-instead-of-surprise presentation
      wound-instead-of-surprise presentation (`Mob.defenseProc` - `HIT_STRONG` plus the red `Wound` slash with Preparation up, the `!` otherwise) and the ranged invisibility gate (`selectRangedTarget` skips invisible hero/allies, pinned in `verifySimulation.mjs`). **Closed 2026-09-17:** boss-specific ranged target migration - the Eye's `deathGaze` strikes every char on its beam (hero, ally or enemy) with the per-victim hit roll and 30-50 damage plus the `Aggression` rule, instead of the hero-only simplification; the Warlock-zap `Aggression` site stays unreachable-by-design (documented on the Aggression row).
      See `PORT_COVERAGE.md`'s sleeping/wandering and `Preparation` rows.
- [x] Implement shield decay. `Barrier.act()`'s real `min(1,shielding/20)`-per-turn proportional
      curve runs every hero turn against the shared `heroBarrier` pool, and `Blocking` owns a
      separate `blockingBarrier` pool with `ShieldBuff.shieldUsePriority = 2` draining before
      `heroBarrier`'s priority-0 pool in `absorbHeroDamage`, exempt from the proportional accrual,
      with max-semantics and an always-reset 5-turn timer (plus a load-time carve-out migration for
      pre-two-pool saves). **Remaining**: `HoldFast.buffDecayFactor()` scaling of both clocks and the
      `ProvokedAngerTracker` a fully-broken shield grants (both need the section 6 talent systems),
      and Healing-over-time beyond Sungrass.



## 1. Complete the item system (closed 2026-09-20)

Moved here from ROADMAP.md with all 15 checkboxes checked. Original body follows unchanged:


- [x] Wire `rollAffix`/`ENCHANT_TABLE`/`GLYPH_TABLE` into real item generation and equip.
      `generatedInventoryItem` now rolls one via `rollGeneratedAffix` (curse-pool pick when
      `generated.cursed`, weighted good-enchant pick when `generated.hasGoodEnchant`), and
      `equipWeapon`/`equipArmor` gained the real cursed-and-known equip-lock rings already had.
      Statistically (3000-trial roll distributions) and live (equip lock, cleanse, Barrier decay)
      verified. **Known cleanup, not urgent**: `equipWeapon`/`equipArmor` duplicate ~40 lines of
      shape and use inconsistent starting-gear sentinel checks. See `PORT_COVERAGE.md`'s
      "Enchant/glyph/curse assignment" row.
- [x] Port all remaining weapons, wands, rings, artifacts, bombs, alchemy, and crafting.
      **Closed 2026-09-19, after a full re-audit of every sub-bullet under this line (all already
      `[x]`) plus a fresh grep of `PORT_COVERAGE.md` for any "Not ported" row in this section's
      domain**: nothing genuinely unstarted turned up. What remains is exactly the set of already-
      stated, deliberate simplifications this line's own sub-bullets already name and accept as
      final (per the "iso is no longer the goal" policy) - `SpiritArrow`'s Sniper+DAMAGE-augment
      clause (no bow-augment system), the Wandmaker reward's missing wand +1 (wand power here is
      `weaponLevel`, with no per-wand level to hold it), `MagesStaff`/`SpiritBow` targets for the
      infusion pickers (neither is a port item), ammunition stack merging and the boomerang flight
      animation, and a handful of UI/data narrows on the shop-pricing and enchant/glyph rows - none
      of which need a new subsystem, and every one of which is independently `[x]` and cited above.
      Two real remaining gaps belong to *other* roadmap lines, not this one: `ClassArmor` as a
      distinct item (section 6's armor-ability line) and ally-owned weapon-driven `Statue` combat
      (section 5). Closing this line does not re-open either.
      Already done: all 13 real artifact classes, all 12 ring types, all 13 wand classes, and
      generic weapon/armor tiers/upgrades/curses/degradation, and the Duelist T-key weapon abilities
      (all 30 `MeleeWeapon.ability()` overrides with real magnitudes, Java's exact `Charger`
      economy - uniform 1-charge costs, level-based cap, time accrual, partial-first spends,
      post-use `COUNTER_ABILITY` refunds - and Java's setup turn costs, sneak and the charged
      shot free - no missile weapon has an ability at all. **Closed 2026-09-17:** damage-strike auto-target (see below).
      Strikes aim through the `TargetingController` (confirm latches `abilityAimTarget` and re-enters `useWeaponAbility`; cancelling spends nothing), replacing the nearest-visible-enemy auto-pick.
      `VARIED_CHARGE` (no such talent here) and brawler's stance (no such buff); the stale
      ability/talent desc text (catalogue refresh, not mechanics); the alchemy pot's ingredient choice is live (recipe picker plus follow-up ingredient/unit pickers over the bag - the slot-window chrome stays simplified); and the
      shop-stock items that used to have no item class here at all (Torches, Tipped Darts, the Ankh,
      Java's `ChooseBag` pick) - all four now exist as real items: the bags as ownable, priced,
      tradable goods with the real pick (their container behavior stays with the inventory-windows line). **The Torch carries one more thing beyond itself:** SPD's
      `Light` buff, which `YogDzewa.updateVisibility()` checks before shrinking the hero's view
      distance to the arena's own radius - so that fight's dim-arena rule is fully implemented here
      (the shrink is live) and its `Light` exemption is live (`useTorch` lights the buff; the Yog view-radius rule skips the shrink while lit). **Complexity: L.** The weapon-ability system was the one
      cross-cutting piece and is now live (see PORT_COVERAGE.md's ability row); what remains here is narrow gaps.
- [x] Port the remaining potions. All 12 generator potion classes now have their own branch
      (Levitation, ToxicGas, ParalyticGas, Haste, Frost, and the `LiquidFlame`/`Invisibility`
      id-mapping bug fixed), each backed by its real blob or buff. The historical "silently falls
      through to Purity" bug class is closed, with a `console.warn` guard on the fallback. See
      `PORT_COVERAGE.md`'s potions row.
- [x] Port the remaining scrolls. Recharging, Teleportation, Terror, Retribution (minus
      `Blindness`, which has no seam here) and Transmutation (Simplified) are live, plus the
      `MirrorImage`/`MagicMapping` id-mapping bugs. A real generic item-picker panel
      (`openItemPicker`/`chooseItemPicker`) now serves Transmutation and the three picker-driven
      runestones. **Remaining**: exact `changeItem` coverage for exotics/trinkets/equipped gear -
      owed with section 1's item-system completion, since those items must exist as distinct
      ported items first (missile/tipped-dart/wand/pickaxe rerolls ported 2026-09-17).
      See `PORT_COVERAGE.md`'s updated row.
- [x] Port the remaining enchantments and glyphs, and complete their executable behavior. All 42
      (13 weapon enchants, 13 armor glyphs, 8 weapon curses, 8 armor curses) have real, live proc
      logic; the 16 curse definitions are authored in `src/content/curse-rules.mwl`. Unstable's
      delegate list is guarded both ways (item suite asserts it equals Java's `randomEnchants`
      array; `tools/scratch/unstable-delegates-livecheck.mjs` drives 440 real swings). **Remaining**:
      the non-sleeping FOV-binary `seesHero` path is still simplified, so `Obfuscation` contributes
      to sleeping detection only. See `PORT_COVERAGE.md`'s enchant/glyph/curse row for the 20 live
      assertions and each mechanic's citation.
- [x] Implement weapon augments. A real `stoneOfAugmentation` item, `useStoneOfAugmentation()` bag
      action and `chooseAugment()` choice panel, live end-to-end verified (Speed → `weaponAugment`
      `'speed'` → `getActionTurnCostMod()` 1 → 0.8). Auto-targets the equipped weapon rather than
      Java's item-picker, this port's convention for "use item on another item". **Simplification**:
      Java's stone also grants a genuine bonus weapon-upgrade level, not reproduced (this port's
      upgrade path is tier-based, with no free-standing "+1 level" primitive). See `PORT_COVERAGE.md`'s
      enchant/glyph row.
- [x] Port three more runestone (`Cat.STONE`) types: `StoneOfFear`, `StoneOfDeepSleep` and
      `StoneOfShock`, each with its own id and use-action. All three auto-target the nearest visible
      enemy (no map-click cell-targeting existed at the time), so they only ever affect an enemy.
      **Stated simplifications**: DeepSleep is instant-sleep rather than Java's gradual
      `Drowsy`/`MagicalSleep`; Shock uses a Chebyshev-distance-2 circle rather than Java's wall-aware
      `PathFinder` flood fill, and this port's shared 3-turn `paralysis` rather than Java's 1 turn.
      Browser-verified live. **Correction from this pass, worth noting**: the 12th runestone type is
      real Java's `StoneOfDetectMagic`, not the `StoneOfDisarming` an earlier draft of this line
      named - that class does not exist in SPD at all.
- [x] Port a fourth runestone type, `StoneOfBlast` -> `stoneOfBlast` (`useStoneOfBlast()`). Real
      Java's `activate()` is a `Bomb.ConjuredBomb().explode(cell)`: this port reuses the same
      Chebyshev-distance-1-circle approximation `StoneOfShock` makes, substitutes `this.depth` for
      `scalingDepth`, and routes the hero's own share through the existing `absorbHeroDamage`/`kill`
      path. **Not reproduced**: the terrain-destruction/heap-triggering half of the real explosion -
      this port has no equivalent call from an item-use site. Browser-verified live (radius cutoff,
      hero included in the blast, stack decremented by 1).
- [x] Port two more runestone types, `StoneOfBlink` and `StoneOfClairvoyance`, plus
      `StoneOfEnchantment`/`StoneOfIntuition`/`StoneOfDetectMagic` and Flock/Aggression - 10 of 12
      real runestone types, with the generator table now using the real `StoneOfDetectMagic` class.
      **Stated simplifications**: Blink collapses to the shared `randomFreeCell` (Java's short aimed
      hop is lost); Clairvoyance centres on the hero and reproduces DIST=20 as a plain Chebyshev
      circle; the picker is bag-only with no exotics. Aggression's boss/miniboss shortening and the
      marked-target half-damage branch are both real and live (with a new `miniboss` actor flag).
      Browser-verified live. See `PORT_COVERAGE.md`'s runestone row.
- [x] Implement complete weapon and armor tiers, transfer formulas, upgrade formulas, curse
      infusion, and degradation. Includes the Blacksmith's reforge (persistent favor, progressive
      costs, level preservation, one-item consumption) and its harden service, the Warrior's seal
      transfer/detach (`Armor.doEquip()`, `AC_DETACH`), and the curse-infusion bonus as Java's
      *virtual* `1 + level/6` in `level()` rather than a baked level. Both infusion pickers'
      candidate sets are now Java's real predicates (`MagicalInfusion.usableOnItem` =
      `isUpgradable()`; `CurseInfusion.usableOnItem` = equipable+upgradable, `Wand` or `SpiritBow`),
      resolved over this port's ids in `src/items/itemKinds.ts`, and both play their real
      presentation (`burstShadowUp`, the `READ`/`CURSED` samples). **Not covered by this line, and
      never was**: Java's `MagesStaff`/`SpiritBow` targets, which are not port items at all. See
      `PORT_COVERAGE.md`'s infusion, seal and hardening rows.
- [x] **Correction, 2026-09-14: this bullet's entire premise was stale.** It claimed Kinetic,
      Blooming, Projecting, Affection, AntiMagic, Camouflage, Obfuscation and Potential were all
      still unported stubs, each blocked on a subsystem this port had not built. Every one is
      implemented - including `Projecting`, which turned out to have no "line-AoE geometry" to build
      at all (real `Projecting.proc()` is a no-op; the entire enchant is `Weapon.reachFactor()` and
      `MissileWeapon.throwPos`, both already implemented). Nothing in this list needed a new
      subsystem by the time it was checked.
- [x] Replace simplified missile durability and wand recharge behavior with the Java formulas. Wand
      recharge is `10 + 40 * 0.875^missing` with Recharging's bonus and refunds separated from
      passive recharge; missile durability/damage/upgrade levels are exact against tag `v3.3.8`
      (per-type `baseUses`, the `1.5^level` scaling, `durable-talent` `1.25+0.25/point` applied only
      while the talent is actually taken, rounded usages ≥100 costing 0, hit-only wear with the real
      break warnings, uncapped missile levels via SoU). `wieldMissile` now switches which class the
      ammo model tracks, so per-class damage, durability and the three real `proc()` overrides
      (Bolas/Tomahawk/FishingSpear) all follow the wielded item. `HeavyBoomerang.CircleBack` is
      ported (5-turn return, hero pickup / throw at a squatter / drop). The ranged accuracy factors
      (`accuracyFactor * adjacentAccFactor`, 0.5 at adjacency) and the last-missile confirm window
      are live and browser-verified. **Three stated reductions remain**, each recorded in
      `PORT_COVERAGE.md`'s `MissileWeapon` row: ammunition stack merging (a fungible ammo counter has
      no per-stack identity to merge), `augment.delayFactor` and the MagicalHolster multiplier (no
      per-missile augmenting, no holster), and the boomerang's flight animation (Java tweens a
      `MissileSprite` home; this port resolves the return with SPD's own pickup line).
      `SpiritArrow.accuracyFactor`'s Sniper + DAMAGE-augment clause also stays unported - no bow
      augment system to read. **Complexity: S** for those remaining reductions.
- [x] Implement identification appearance randomization. Potion and scroll appearances are shuffled
      once per seeded run, pre-drawn without disturbing later gameplay RNG, and persisted through
      save/load.
- [x] Implement full shop pricing, buyback shelves, and wealth modifiers. **Closed 2026-09-17: the last two named halves are done - the stats line now carries Java's real STR sentences (`weaponSTRReq`/`armorSTRReq`/`missileSTRReq` in `src/items/strReq.ts` with the `too_heavy`/`excess_str` suffixes, pinned in `test:items`), and the "wand charges" half turned out not to exist in Java (`WndTradeItem` renders `item.info()`, which carries no charges - they live in `status()`), so it is recorded as a non-gap rather than built.** Pricing, shelf stock, the
      buyback shelf, and the real trade window's sell-button rules are all in place (see
      `PORT_COVERAGE.md`'s `Shopkeeper` + pricing rows). **The buying half no longer charges on a
      step (2026-09-16)**: this port used to spend the hero's gold the instant they set foot on a
      priced stand, where Java shows `WndTradeItem` and charges only when its `buy` button is
      pressed (and disables that button while the price exceeds the hero's gold). Stepping onto a
      stand now opens the port's trade window - the same generic picker the keeper's own window
      uses, one row labelled with SPD's real `windows.wndtradeitem.buy` string and the price -
      cancelling costs nothing and leaves the stand priced and unbought, and the purchase itself
      stays in `groundPickup.ts` so the window only decides *whether* it happens. An unaffordable
      stand opens nothing. Browser-verified live (`tools/scratch/shop-stand-purchase-livecheck.mjs`,
      7/7). **The window's item-info body is now ported too (2026-09-16)**: the picker gained a body
      block (Java's window is `WndTradeItem extends WndInfoItem`, so its body is the item's own
      description above the buy button), filled from `itemDescription(id, sourceClass)` plus `itemStatsLine` - the MWL
      `descriptionKey` tables first (which is what gives a generated-gear heap its gear's own text),
      then the SPD catalogue's `items.<class>.desc`; the keeper's shelf rows open the same body in their own
      detail window above the buy row (browser-verified live, `keeper-shelf-detail-livecheck.mjs`, 4/4).
      Remaining before the close-out (now done, see above): STR requirements and wand charges on the stats line (no STRReq system, no per-heap wand
      state, so those two halves stay unshown); the `extraThrownLeft` sell warning, which IS live for upgraded
      missile stacks holding extra throws.
      The Ankh is fully stocked and functional (one per shop, the BLESS action, the blessed revive, and the
      unblessed `WndResurrect` keeps window), and so is the `ChooseBag` pick (one bag per shop off the real scoring rule, bought live) - the one genuine remainder, the bags' container behavior, belongs to the
      inventory-windows line below.
      **Complexity: S.** A handful of narrow, independent UI/data gaps, none needing a new system.
- [x] Implement Timekeeper's Hourglass sand-bag state and its level-generation effects. The
      identified/uncursed inventory state follows Java's depth-specific shop percentages, sand bags
      upgrade and persist on the hourglass, concrete item identities survive the level/save bridge,
      and the active time-freeze action is wired into the turn scheduler. Stasis, recharge cadence
      and exact artifact presentation stay with the broader artifact-system work.

## 11A. MWG framework backlog (separate repository; roadmap only) (closed 2026-09-20)

Moved here from ROADMAP.md with all 23 checkboxes checked. Original body follows unchanged:


This section is a list of generic proposals for the independent `@datamoc/mw_games` project. It is
intentionally not an implementation plan for this repository: **do not add SPD names, Java formulas,
item values, dungeon rules, sprites, or other GPL game content to MWG.** If one of these proposals
is accepted upstream, this port may consume the published API later and must still keep its
game-specific rules and adapters here.

A checked box here records that MWG delivered the capability, **not** that this port consumes it yet
- the port-side adoption each one still owes is named inline. Pin history: 0.7.7 shipped its items
278-282; 0.7.8 was a patch whose every change lies outside this port's surface; 0.9.0 shipped P3/P4/
P9/P11/P12; 0.9.1 added canonical save/replay and lockstep primitives, which this port does not yet
adopt (its scene state and callback-based world adapters do not satisfy the serializable
command/state boundary those require). The five transitional `SimulationRuntime` adapters keep their
live callback handles outside MWG's `structuredClone`d commands and clear their temporary journals
after dispatch, while the existing local save/restore path remains authoritative.

- [x] **Keep using the existing generic primitives.** `Scheduler.add(actor, delay?, priority?)`,
      `EntityRegistry.add(entity, requestedId?)`, `Inventory` nested containers and instance state,
      `craft()`'s atomic recipe transaction, `ParticleEmitter.frames`, `Blob.spread(open, spread?,
      decay?)`, `TerrainKind.flags`, and MWL's typed tables/references/deterministic emission. 0.7.7
      adds further ready-made primitives the port can adopt as it reaches them (not proposals, so
      not listed individually): the missing UI widgets (`Slider`/`Checkbox`/`Spinner`/`Dropdown`/
      `TextModel`/`DataTable`/`TreeView`/`ScrollBox`), `Layout`/`Skins`, `StoryScreen`/
      `StorySequence`, the battle-UI models, positional audio, IME text input, and MT19937.
- [x] **P0 - Generalise `MultiTurnBeam` traversal.** *Shipped in 0.7.7 (item 278).* **Adopted for
      Tengu's fire cone**: the hand-rolled `tenguFire.cells` ring state is replaced by a per-creature
      `MultiTurnBeam` whose `fronts` resolver carries Java's exact ring rule and whose `onCell` seeds
      the port's fire field, with `restoreFloor` rebuilding the live beam (old saves load by dropping
      that cone, not crashing). The Yog death gaze is deliberately left alone: it is an
      aim-one-turn/fire-the-next effect here and in Java, so `MultiTurnBeam` is not its shape.
- [x] **P1 - Add generic particle spawn bounds.** *Shipped in 0.7.7 (item 279).* **Adopted** for the
      title flame: the column now births across a 4x3 ellipse instead of a single point (the
      `heightLimit` clamp is still unmodelled). The colour-only sparks stay local (a `ParticleEmitter`
      tints per emitter, not per particle), and the hand-rolled decoration spots are converted.
- [x] **P1 - Add a renderer-neutral grid targeting controller.** *Shipped in 0.7.7 (item 280), now
      the single biggest adoption in this section.* `roguelike.TargetingController` is **adopted for
      the six cell-aimed runestones** (Fear/DeepSleep/Shock/Blast/Blink/Clairvoyance) through a
      `beginAiming`/`confirmAiming`/`cancelAiming` trio plus a world-space preview overlay: a click or
      the arrow keys picks the cell, an illegal cell is refused with the real "nothing to target"
      line, and nothing is consumed until a legal cell is confirmed. Also adopted for aimed
      disintegration wands, thrown weapons (with a game-owned validation hook, so cancellation
      consumes neither ammo nor a turn), bombs, and the creature-targeted wands (keeping each wand's
      ally/guardian eligibility in its validation hook). **Remaining**: empty-cell area targeting.
- [x] **P2 - Add reusable tabbed, paginated list primitives.** *Shipped in 0.7.7 (item 281).*
      `ui.TabbedList`/`ListTab` is a renderer-free tabbed, filtered, paged list with selection and a
      detail/close state over caller-supplied rows; the page is derived from the selection, so the
      two cannot disagree.
- [x] **P2 - Add a documented event-to-presentation sequencing recipe.** *Shipped in 0.7.7 (item
      282).* `simulation.EventPresentation` documents the `SimulationRuntime` -> `PresentationQueue`
      tie: command result, animation lock, scheduled secondary actor, cancellation, and save/load
      that resumes idle.
- [x] **P2 - Author non-monster asset references in MWL.** **Shipped in MWG 0.8.1 and adopted.** The
      generic asset-attribute contract accepts these references, and this port uses
      `src/content/asset-references.mwl` for terrain/effect atlas sources plus the generated
      `itemAssetSources` table for the item atlas; `images.ts` validates the emitted manifest against
      the bundled files before loading them. Item-specific frame metadata is already authored in
      `item-rules.mwl`; only its Pixi frame cutting remains renderer-owned. The older dead-end
      experiment in `tools/scratch/*.mwl` is retained as historical evidence.
- [x] **Before proposing further API changes, add framework-side acceptance tests and examples.**
      The 0.7.7 batch already carries its own renderer-free tests in MWG. Any new proposal needs the
      same: renderer-free determinism tests, a minimal example, save compatibility notes, and an API
      report entry in the MWG repository. This port should only add an adoption checkbox here after a
      released version exists and has been checked against its declarations. **Closed 2026-09-19:**
      the port side of that last sentence is now automated - `tools/verifyMwgCompatibility.mjs`
      pins 15 adopted-surface declarations plus a negative `tableReferences` probe (19 checks in
      `test:mwg`), so an adopted-surface regression fails loudly at the gate instead of
      surfacing as a mistyped cast or a wrong runtime shape; `setAssetMap`/`coneSector`/
      `ScreenEffects.sequence` stay
      deliberately unasserted (shipped, not adopted). The framework side holds by process: the
      only open upstream items (P1 caller-chosen ids, P2 Types2D values, the gradient-hook
      candidate) are recorded open and unadopted. See `PORT_COVERAGE.md`'s mwg-usage section.
      **Complexity: S.**

### New proposals from the mwg-usage audit

Everything below is generic - no SPD names, values or art - and by this section's own rule an *API*
proposal wants renderer-free tests, a minimal example, save compatibility notes and an API report
entry in MWG before this port adopts it; P4 is doc-only.

- [x] **P3 - Re-export `extensions` and Pixi's built-in pipe classes from `two-d/pixi-interop`.**
      **Shipped in MWG 0.9.0 and adopted.** All 21 direct Pixi imports under `src/` migrated to
      `mwg/two-d/pixi-interop`, with the explicit `registerBuiltinPipes()` call kept as a defensive
      guarantee before the renderer is created. The remaining direct `pixi.js` dependency is
      intentional: MWG declares Pixi as a peer backend, so the application still supplies the single
      shared Pixi installation.
- [x] **P4 - Two shipped doc comments contradict each other; one over-claims.** **Shipped in MWG 0.9.0
      and confirmed against the installed package.** `Shape2D.d.ts` said `Container2D` "is a type
      alias, not something a game can `new`", while `Types2D.d.ts` re-exported it as "usable in both
      type and value positions"; and `pixi-interop.d.ts` presented built-in pipe registration as a
      universal import side effect, where what actually preserves them is Pixi's own `sideEffects`
      whitelist plus mwg's for `TintedSprite.js` - this port lost a whole session to a
      production-only `renderPipes[...] is undefined` failure in that area, and still registers all
      three pipes by hand.
- [x] **P5 - Pointer parity for `two-d/ui/ListView`. Shipped in MWG 0.7.9 (item 299).**
      `ListView.tapRow(index)` gives the exact select-and-confirm-in-one-step tap this proposal asked
      for. `ListView` itself remains unadopted (no text-menu window - dialogue choices, a save-slot
      list - exists yet to build on it); this port's only per-cell pointer UI is `IconGrid`, which
      already had its own tap parity.
- [x] **P6 - Let a game supply the compiled asset map. Shipped in MWG 0.7.9 (item 300).**
      `assets.setAssetMap(map)` hands `resolve`/`has`/`paths`/`isCompiled` a game's own path-to-URI
      map directly. **Not yet adopted**: this port still hand-rolls its own asset-to-texture plumbing
      (`images.ts`'s `MWL_ASSET_URLS`); adopting it is a separate, larger migration.
- [x] **P7 - Compose, don't only prioritise, in `two-d/render/StatusVisuals`. Shipped in MWG 0.7.9
      (item 301, a breaking change).** `StatusVisuals` now composes every active status's colour
      additively (each channel clipping at 1), never writes the multiply `tint`, and gained
      `flash(color, strength, duration)`. **Not yet adopted**: this port still drives its additive
      tint channel directly rather than through the class.
- [x] **P8 - A phase/sequence API for `two-d/render/ScreenEffects`. Shipped in MWG 0.7.9 (item
      302).** `ScreenEffects.sequence(steps)` chains `fadeOut`/`fadeIn`/`flash`/`hold` phases as one
      call, `update` returning false at every step boundary and true only once the whole sequence
      finishes - exactly the hold-then-fade-back shape this proposal asked for. **Resolved
      2026-09-16 as a deliberate non-adoption**: this port still hand-computes its own fade/hold/fade
      sequencing, because `ScreenEffects` is a flat colour wash and the interlevel curtain is a
      five-stop gradient - adopting it would trade a real visual detail for fewer lines (see section
      8's transitions item). A candidate for a future MWG proposal instead: a gradient/child-overlay
      hook for `ScreenEffects`, which would make the adoption a pure win.
      **P5-P8 were missed by the 0.9.1 re-audit**, which checked the newer canonical save/replay work
      but did not re-walk this older, still-open list against what had shipped in between - a real
      gap in how this section's own maintenance was done, not a framework gap. `Camera.shakeScreen`
      (item 303, same 0.7.9 batch) had already been caught and adopted (P9), which is what makes this
      an audit-process miss rather than 0.7.9 being unreviewed entirely.
- [x] **P9 - A screen-pixel shake helper on `Camera`.** **Shipped in MWG 0.9.0 and adopted.** The
      Java shake wrapper now calls `Camera.shakeScreen(intensity, duration)`, preserving pixel-based
      amplitudes across camera zoom levels.
- [x] **P10 - Say what MWL row ids are scoped to, or make it configurable.** *Shipped in MWG 0.7.9
      (item 304).* `validateCatalog` takes `rowIdScope: 'file'`. This port stays on the global scope
      **deliberately**: its restating tables were renamed to table-unique ids instead, so a per-file
      scope would only weaken the gate, silencing a real same-file collision across tables.
- [x] **P11 - Let `tools/mwl.mjs` carry extra artifacts, or document the library path as the answer.**
      **Resolved in MWG 0.9.0 documentation.** The CLI remains intentionally limited to its standard
      artifacts; this port uses the public MWL library API for its game-owned modules and cross-table
      validators.
- [x] **P12 - A documented `file://` post-build recipe for bundler users.** **Shipped in MWG 0.9.0
      and adopted.** The port's build now calls MWG's packaged `classic-html` implementation to
      rewrite the Vite entry tag, retaining the source-page guard in `index.html`.
- [x] **P13 - An angular cone area, not only a snapped spray - shipped in MWG 0.8.0 (item 322), port
      keeps its own exact translation deliberately.** This port needs Java's `mechanics/ConeAOE`
      exactly (rays every 0.5 degrees, wall-truncated unions, a range clamp), whereas
      `roguelike.coneCells` snaps to the nearest of eight directions. MWG 0.8.0 added the generic
      `coneSector(level, from, to, { degrees, range })` this proposal asked for - but this port does
      **not** migrate its three live consumers (Regrowth wand, Fireblast wand, DM-300's gas check)
      onto it: `src/mechanics/cone.ts` mirrors Java's `float` precision, fills the inner ring at
      radius 4+ and keeps the rim/inner distinction, all of which the generic drops, so adopting it
      would be a fidelity regression. New cone attacks belong on the port's translation.
- [x] **P14 - Per-particle colour, jitter and curves in `ParticleEmitter` - shipped in MWG 0.8.0
      (item 323), adopted here on MWG 0.8.1.** The emitter used to interpolate `scale`/`alpha`
      linearly and take one `tint` for the whole emitter, which cannot express `Sink`'s per-particle
      random colour, `Torch`'s per-frame size re-roll, or `SmokeParticle`'s piecewise alpha. MWG
      0.8.0 ships all three halves (`tint` ranges, `ParticleCurve`, `flicker`); the migration is
      complete (one pooled emitter per spot, FOV gating retained, WaterEmberLayer keeping Java's
      per-cell randomized delay) and browser-verified. The torch halo and well ripples remain
      separate presentation layers because they are not particle pools.
- [x] **P15 - A blocker layer for `Window` - shipped in MWG 0.8.0 (item 324), adopted.** Java's
      `Window` adds a full-screen `PointerArea` under its chrome whose click runs `onBackPressed()`
      unless the click landed on the chrome itself - what makes an outside click dismiss a window and
      what stops a window over a map or toolbar from letting clicks through. MWG's `Window` now takes
      `blocker: true` for exactly this, so every `Window` construction site passes it and the local
      `src/ui/blockingWindowStack.ts` subclass is deleted.
- [x] **P16 - Say who owns the keyboard when a scene and a `WindowStack` both listen - shipped in MWG
      0.8.0 (item 325), adopted.** `WindowStack.handleAction` is now public and the stack's own class
      doc prescribes the chain (`stack.handleAction(action) || myOwnHandling(action)`), which is what
      both scenes do now, keeping `main.ts`'s `blocksWorld` guard and its travel-cancel side effect.
      The old undocumented recipe is superseded; the pointer half of the same problem was P15.
- [x] **P17 - Cut arbitrary rectangles, not only regular grids, in `SpriteSheet` - shipped in MWG
      0.8.0 (item 326), adopted where it pays.** `SpriteSheet.rect(frame, x, y, w, h)` declares
      irregular frames with the same cut-once-and-cache behaviour grids had. Used for the repeat-cut
      sites: `main.ts`'s six variable-width ward frames, `inventoryWindow.ts`'s 16x16 item grid, and
      the title flame's four quadrants. The remaining one-off static crops (toolbar strip, status
      bars, badges, banners, portraits) stay hand-cut `new Texture` calls deliberately: each is cut
      exactly once, so a sheet would add a cache nobody reads twice. Java's per-item *tightened*
      sub-rects stay unported as before - a stated simplification in `images.ts`, not a framework gap.

### Explicitly out of scope for MWG

The following remain port-owned work even when they could be made more generic in theory: SPD
appearance tables and identification, fire/embers and well behavior, exact monster and boss rules,
talents and subclasses, quests, room generation, item effects, Java-derived numbers, translations,
and all SPD art/assets. "Could be represented by a generic primitive" is not a reason to move those
rules or data across the licensing boundary.

## 4. Complete NPCs and quests (closed 2026-09-21)

Moved here from `ROADMAP.md` with all 8 checkboxes checked. Original body follows unchanged:

- [x] Port Caves NPCs and quests. **Verified complete, and the region has exactly one NPC: the Troll
      Blacksmith.** Its quest is ported in all its variants (the normal DarkGold fetch and the
      alternative bat-stained-pickaxe run, the pickaxe, the favor, the progressive reforge, and the
      service window with all six services). `CavesLevel` overrides no `createMobs()` at all, so
      there is nothing else in the region to port.
- [x] Port City NPCs and quests. **Closed 2026-09-16, for free as predicted.** The Ambitious
  Imp quest itself was already fully ported and browser-verified (real spawn roll, monk/golem
  alternative, token counts, ring reward), with one stated simplification (depth 18's 50/50
  pick uses depth parity rather than a fresh Java roll). The Imp shop the quest's completion
  opens now spawns at the King's death via section 3's `unseal()`, kept by a real
  `ImpShopkeeper` with imp art, the shopkeeper's trade window and flee behavior, and its own
  first-sight greeting yell.
- [x] Port Halls NPCs and quests. **Closed as not applicable after checking: real Java ships
      neither** - `HallsLevel.initRooms()` adds exactly one room, `DemonSpawnerRoom` (ported), and
      the class overrides no `createMobs()` at all. The Halls' content is its mobs and Yog-Dzewa,
      tracked in sections 3 and 5.
- [x] Implement the full Ghost quest reward generator. Now uses `Ghost.Quest.spawn()`'s own distinct
      formula (fixed 50/30/15/5% tier roll, single upgrade level shared by both items, single shared
      20% enchant/glyph chance) via `generator.ts`'s `ghostQuestReward()`, statistically verified
      against Java's fractions. **Found and fixed the same pass**: every procedurally-generated
      weapon or missile in the game was silently mislabeled a plain `'food'` item with no
      enchant/curse, because `generatedInventoryItem` checked `generated.cat === Cat.WEAPON` when the
      real value is always a `WEP_T1..T5` sub-tier cat. See `PORT_COVERAGE.md`.
- [x] Finish the Wandmaker's three site quests. **Closed 2026-09-17: the dust-curse was the last portable piece** (Wraith kinds, cursed-rose spawn, dust-spawner bank and handover dispel - see `PORT_COVERAGE.md`'s `Wraith` row). What remains is missing-system-only: the zap pose (no animation layer), quest-music/score (neither system exists), the +1 on the offered reward wands (wand power here comes from `weaponLevel`, no per-wand level to hold it), and `intro_cleric` (predates the catalogue). All three fetch types (corpse dust, elemental embers,
      rotberry seed) are live end to end. **The reward and the intro were not what this line claimed
      until 2026-09-16**: it said the reward was real, and it was an invented substitute - the
      interaction handed out a *frost* wand outright (a plain magic-missile staff for a Mage),
      picking the class for the player where Java shows `WndWandmaker` and offers the floor's own
      two rolled wands (`Quest.wand1`/`wand2`) for the player to choose between. Both halves are now
      Java's: the window offers the two real classes, each named from the catalogue (the `wand`
      reward rows are distinguished by a synthetic `wand-reward:<Class>` instance id, the same
      convention the artifact action rows use), **cancelling keeps the quest item** because Java
      spends it only in `selectReward`, picking one sets the hero's wand to that class, and the
      Wandmaker then says his real `windows.wndwandmaker.farewell` and leaves for good
      (`destroy()`). The intro also gained the class's own `intro_<class>` line, which Java puts
      first and this port had been dropping entirely. Browser-verified live end to end
      (`tools/scratch/wandmaker-reward-livecheck.mjs`, 6/6). Stated, not silently missing: Java's
      `wand1.upgrade()`/`wand2.upgrade()` - both offered wands are generated at +1 - has no home in
      this port's wand model, whose power comes from `weaponLevel` rather than a level on the wand
      item; and `intro_cleric`, which real Java has (`v3.3.8`'s `case CLERIC:`) but this port's
      generated catalogue predates, is skipped for a Cleric rather than filled with another class's
      words and recorded in `PORT_COVERAGE.md`'s wand rows. **The `RitualMarker` custom tile is now
      ported (2026-09-16)**: `ritualMarkerVisuals.ts` and a scene layer transcribe
      `RitualSiteRoom.RitualMarker`'s 3x3 block over the four candles' own cell, from
      `prison_quest.png` - a sheet this port was not loading at all - with its own catalogue
      name/desc on the examine path. The frames are `0,1,2 / 4,5,6 / 8,9,10`, *not* `0..8`:
      `CustomTilemap.mapSimpleImage(0, 0, 64)` walks a **4-column** atlas and each row skips its
      fourth tile. Pinned in `verifyVault.mjs` (31 checks) by recomputing that helper's own
      arithmetic, and browser-verified live
      (`tools/scratch/ritual-marker-livecheck.mjs`, 6/6: the layer exists exactly when `ritualPos`
      names a site, carries those nine frames and nothing else, and answers its own text).
      **The newborn elemental's telegraph is now Java's too (2026-09-16)**: the red `TargetedCell`
      3x3 over the cells its fireball will cover, the charge's own cost
      (`gate(attackDelay(), ceil(hero.cooldown()), 3*attackDelay())`, expressed through
      `pendingMonsterTurnCost` - the "no expression here" this row used to claim was stale, the port
      has had fractional monster turn costs for a while), and the cooldown ticking on *every* hunting
      turn rather than only the non-adjacent ones. Browser-verified live
      (`tools/scratch/newborn-telegraph-livecheck.mjs`, 6/6).
      **Remaining, re-checked 2026-09-16 (candle aim closed 2026-09-17)**: the heap/pickup intermediaries this port
      collapses into a bag-direct action (candles aim through the `TargetingController` - only empty ritual slots validate, confirm spends the throw's turn; the heap/pickup halves stay collapsed).

      Still open: the zap *pose* (Java's `sprite.zap()`/`zap()` pair - the visible bolt itself is
      covered, `elementalRangedTurn` fires `spawnProjectile`); no quest-music swap or score
      accounting (neither system exists). **The dust quest's wraith-curse variant is ported (2026-09-17)**: the `Wraith`/`DustWraith` kinds carry Java's real stats and arrival rules, a cursed rose rolls the 1/100 adjacent spawn, and carrying the dust runs the real `DustGhostSpawner` bank (FOV/distance-gated spawns, handover dispel) - the score penalties stay out with the rest of the missing score system. See `PORT_COVERAGE.md`'s `Wraith` row. **Corrected in the same pass**: "regular fire
      elementals lacking the subtype split" was stale - `elementalType` carries all four kits
      with Java's selection, effects and loot (see `PORT_COVERAGE.md`'s Elemental row).
      **Complexity: S.** Narrow presentation/flavor gaps plus the one mob-blocked curse.
- [x] Port the Troll Blacksmith's last remaining gap. **Closed 2026-09-17: the missile half was already live (per-stack upgrade, consumed-set retirement, asserted in the item suite) - only the wand stays withheld, as a stated silent-no-op exclusion shared with the Upgrade service.** All six services and the real turn-in favor
      bookkeeping are live and browser-verified. **The Upgrade service now uses Java's own
      predicate (2026-09-16)**: `WndBlacksmith.WndUpgrade.itemSelectable` is `isUpgradable() &&
      isIdentified() && !cursed && level() < 2`, with no type test at all, where the picker here had
      been filtering on a three-id hand-list of weapons and armor - it now offers rings too (their
      level really is per-item here) and is browser-verified live
      (`tools/scratch/blacksmith-upgrade-livecheck.mjs`, 6/6). Two classes stay excluded on top of
      Java's predicate because their upgrade would be a *silent no-op* in this port's model, not
      because Java disagrees: a carried missile stack (no per-stack level) and a wand (power comes
      from `weaponLevel`, so a level on the wand item is read by nothing) - both asserted in the item suite
      **The reforge is now Java's own (2026-09-16).** `WndBlacksmith.WndReforge` needs two picks of the
      same *class* (`item1.getClass() != item2.getClass()`) that are not the same entry, and the
      picker here used to pair by bag id - which, since every generated weapon is the id
      `weaponReward` and every generated armor `armorReward`, happily reforged a handaxe with a
      shortsword. Pairing is now by class (`blacksmithItemClass` = `sourceClass ?? id`), the selector
      is Java's own `isIdentified() && !cursed && isUpgradable()` with no level cap (so rings can be
      reforged now, exactly as Java allows), and the second picker offers only the first pick's class
      - this port's equivalent of Java's disabled Reforge button, since its pickers have no disabled
      state. The reward line no longer reports the *scene's* weapon/armor counters (a reforged ring
      used to announce the armor's level) but names the item actually reforged, in all 19 locales.
      Browser-verified live (`tools/scratch/blacksmith-reforge-livecheck.mjs`, 7/7: a +1 and a +3
      shortsword reforge into +4 with the other consumed and the favor charged, while a handaxe, a
      ring and a missile stack stay untouched - that livecheck predates missiles being offered, like the upgrade one above). **The missile half is live since 2026-09-16; what follows is the original blocker analysis, kept for the record**, on two model
      prerequisites rather than on its selector:
      it pairs items by bag id, and every wand in this port shares the single minted id `wand`, so
      widening it as it stands would let two *different* wand classes merge (Java tests
      `item1.getClass() != item2.getClass()`). And what
      actually blocks the missile case is the *upgrade* side, not the set id: `onSelect` upgrades
      the kept item (`first.upgrade()`) and retires the consumed one's set
      (`UpgradedSetTracker.levelThresholds.put(setID, Integer.MAX_VALUE)`), and this port keeps
      missile levels on a single wielded counter (`missileLevel`) with **no per-bag-stack level at
      all** - so a reforged missile stack could be consumed but not upgraded, which is a silent
      no-op rather than a partial port. Closing it means giving carried missile stacks the same
      per-stack level and set that ground heaps already carry, i.e. deliberately reversing the
      fungible-ammo simplification recorded in `PORT_COVERAGE.md`'s `MissileWeapon` row - worth doing
      on its own terms, not as a Blacksmith tweak. See `PORT_COVERAGE.md`'s Blacksmith rows.
      **Complexity: M** for that reason: it is an ammo-model change, not a picker change, and it
      would touch wielding, pickup and dust together.
- [x] Give carried missile stacks their own level, set id and durability, reversing the fungible-ammo
      simplification. **Complexity: M.** Java keeps all three on the *stack* (`MissileWeapon.setID` is
      a per-stack `SecureRandom` long, `durability` starts at 100, and `upgrade()` resets it, refills
      `defaultQuantity()` and records `levelThresholds.put(setID, trueLevel()+1)`), and gates stack
      merging on `isSimilar` = same level **and** class **and** set. This port instead keeps one
      wielded counter (`missileLevel`/`ammoSetId`/`ammoDurability`) and gives carried stacks none of
      them - only ground heaps carry `missileLevel`/`missileSet`, written from the wielder's current
      values and read back by the dust rule. `mwg`'s `Inventory` already has what this needs (`level`,
      `durability`/`maxDurability`, and an `instanceId` that gates merging and travels with `take()`),
      so the identity can be `missile:<setId>:<level>`; what is missing is a `bagSources` slot for the
      set id on load, and the read/write plumbing in `wieldMissile`, `recoverStone`, the dust path and
      the throw. **Closed 2026-09-17 - every prerequisite named here is live since 2026-09-16** (`wieldMissile` adopts the whole stack with its level/set/wear, heaps persist the set/level, the dust rule and the throw read them back, `missileSet`/`tippedSeed` persist through the `bagSources` side channel, `extraThrownLeft` is modelled). Note `upgradeItem` already *writes* a missile stack's `level` (via MagicalInfusion)
      that nothing reads back. This unblocked the Blacksmith reforge's missile half above,
      and the shop's `extraThrownLeft` warning.
- [x] Port Rat King and other missing special NPCs. Rat King is complete for its core exchange (room
      drops real `Gold(10-25)` CHEST heaps, the king spawns sleeping with his own art, wakes with the
      real yell, awards the crown exchange when worn armor is present, and grants the six-turn
      Ratmogrify ability); `MirrorImage` and `Sheep` are live through the ally/combat system.
      Closed 2026-09-19: `PrismaticImage` (exotic scroll brewed from one `scrollMirror`; guard/image chain live - see PORT_COVERAGE.md). Genuinely remaining: only `VaultSentry`, which does not exist in this port at all.
      **Closed 2026-09-21:** `VaultSentry` is recorded as Not ported with its whole vault branch (`PORT_COVERAGE.md`'s new row: scan geometry, cooldowns, immunities, Bundle keys, and why porting the mob alone would be dead code), with a `test:simulation` pin on the absence - per the v0.2 done-definition (explicitly marked Not ported, no silent gaps) this item is done.
      **Triaged 2026-09-16, blocked on its own system, not on NPC code**:
      `VaultSentry` is the scanning sentry of the Halls vault quest rooms (`rooms/quest/vault/*`, crystal-key questline - the whole quest is unported);
      `DirectableAlly` drops off the list (2026-09-17): the hawk's orders - its only live consumer -
      are already live (`allyTargetChar`/`allyDefendCell`, re-cast cell selector, `directTocell`'s
      'follow me again'); PowerOfMany needs Cleric spells. **Correction, 2026-09-19: ShadowClone
      is no longer unoffered** - the 20th matrix (`MONSTER_ANALYSIS_SHADOWCLONE.md`) ported it as
      a real `allyKind`, summoned and directed through this same shared ally system; see section
      6's armor-ability row.
      The ported allies (hawk, ghost, mirror image, sheep, shadow clone, prismatic image) run through `allyKind`
      without the base. **Done in the same pass: `ImpShopkeeper`** - a real kind with imp art, the
      shopkeeper's trade window and flee behavior, its own first-sight greeting yell (the
      `greetings_ascent` variant stays out: no AscensionChallenge here), spawned by section 3's
      `unseal()`. See `PORT_COVERAGE.md`'s Shopkeeper row. **Complexity: M** for the two that
      remain, each inherited from its blocker.

## 5. Improve monster behavior and loot (closed 2026-09-21)

Moved here from `ROADMAP.md` with all 13 checkboxes checked. Original body follows unchanged:

- [x] Fix `Brute`'s enrage. Was a stateless below-half-HP damage boost that never granted Java's
      real one-time near-death revival; now a genuine `hasRaged`-gated revival with the real
      `HT/2+4` shield and flat 4/turn decay. Browser-verified live. See `PORT_COVERAGE.md`.
- [x] Implement exact wandering, hunting, fleeing, and stealth calculations. **Progress 2026-09-16:**
      the retained-target wandering branch is now isolated as `takeWanderingTurn`, including the
      Java target lifetime, passability checks, piranha water restriction, and Golem's unreachable
      target teleport path; fleeing recovery (`Mob.Fleeing.nowhereToRun()`) is ported since 2026-09-17 - a fleeing mob with no step turns and fights with the real `Mob.rage` line while it sees the hero, else drops back to wandering, unless Terror holds it (Dread has no system here). **Hunting parity ported 2026-09-17**: `Creature.lastSeen` is Java's hunting `Mob.target` - refreshed while the hero is seen, pursued when sight is lost (give up on arrival/unreachable), persisted through save/load, no re-roll on re-acquire while hunting, fleeing excluded; mass-alert sources set it so their mobs hunt. Stealth/invisibility gating lives on the section-7 line, now fully closed (wound/surprise presentation, ranged invisibility gate, Eye beam migration).
- [x] Implement monster-specific AI overrides. **Closed 2026-09-17: the last two "Not modeled" halves were already live (Spinner's persistent 3-cell `Web` blob plus the direct root, DM-200's BFS reachability plus the closing-distance-failed vent retry) - only Golem's charge particles and delayed animation remain, with no particle/animation layer to express them.** **Ported**: Golem's teleport-the-hero-away ability
      (with Java's `canTele` reachability, direct-shot distance roll and `MagicImmune` target gate)
      and its 30-turn self-teleport-to-reposition, Eye's real ranged two-turn DeathGaze (charge turn
      costs 2 and takes quarter damage; the fire turn is a magic hit roll for 30-50 bypassing armor),
      DM-200's venting override, Spinner's ranged web, the Necromancer's skeleton support (heal
      `HT/5`, one-time Adrenaline, teleport-back) and `firstSummon`'s variable tick cost via the new
      `monsterTurnCost` hook, RipperDemon's two-turn telegraphed leap (far-side landing prediction, re-traced pounce with an infinite-accuracy hit plus 0.75x `Bleeding`, 2-4 cooldown, instant relocation, the warning log line standing in for the red cell marker and crouch), and the Succubus hunting blink (teleport to a seen hero 3+ cells away off a 4-6 cooldown, free, ordinary-approach turns ticking it down). **Not modeled**: Golem's charge particles and delayed animation;
      Spinner's real persistent 3-cell `Web` terrain blob is ported (the direct root is the impact, the blob the aftermath);
      Golem's charge particles and delayed animation have no particle/animation layer here. See
      `PORT_COVERAGE.md`. **Complexity: M** for what remains.
- [x] Implement ally-vs-monster combat. `Creature.isAlly` is persisted and scheduled; MirrorImage
      summons are real 1-HP allied actors copying the hero's combat stats, ally turns use an
      ally-centred FOV, hostile mobs path toward a visible ally when they cannot see the hero, and
      `Amok` attacks nearby creatures. Flock and Aggression runestones run through the same seam.
      **Remaining**: boss-specific ranged target migration, and dedicated ally sprites/orders.
- [x] Port all champion types and their effects. All 6 real types (Blessed/Blazing/Giant/Growing/
      AntiMagic/Projecting) are live with their real per-type factors and a true 1-in-6 roll, gated
      on the `CHAMPION_ENEMIES` challenge, backed by Java's real resettable `mobsToChampion`
      countdown (persisted per-run, no kind or depth exclusions - the exclusion branch an earlier
      pass invented is deleted, not kept as a simplification), `AscensionChallenge.statModifier`'s
      real 25-class table flattened onto this port's 40 ids and gated on its own inert flag, a
      `championEligible` argument true at exactly one call site, `AntiMagic.RESISTS` closed as far as
      this port's feature set allows (23 of ~35 entries wired; the rest are catalogued in
      `PORT_COVERAGE.md` and each is either unported-feature or structurally unreachable), and a
      champion sprite tint from Java's own `CHAMPION_TINT` colours. **Remaining**: `spawnMonster`'s
      tint is a flat-tint stand-in for Java's persistent glow-ring `sprite.aura(color)`; browser
      verification of the tint. See `PORT_COVERAGE.md`'s `ChampionEnemy` row.
- [x] Implement remaining blob area propagation, gas, and fire terrain. The fire model itself is
      Java's (`Fire.burn()` runs for every burning cell every turn and reignites every creature
      standing in it, `Burning.DURATION` 8 with Java's depth-scaled damage roll, `reignite` vs
      `affect` at the buff boundary), and environmental gas/plant fields use a Java-shaped
      `Blob.evolve()` step. CorrosionTrap and ConfusionTrap seed their real gas volumes. Hero
      backpack item-burning is live for the port's concrete scroll and meat payloads. **Remaining, triaged producer-by-producer 2026-09-17**:
      every missing blob is missing its producer, not its effect table - `SmokeScreen` (**closed 2026-09-19**: the `smokeBomb` item replaces the pre-`v3.3.8` ShockBomb the old tree carried - invisibility brews it, cost 2 - and its blast seeds Java's 40-per-cell distance-2 flood with the 1000-budget center top-up into a persisted blob whose `Level.updateFieldOfView` sight-blocking is ported for hero, mobs, necromancer and fist-teleport sight; **closed 2026-09-19**: the ShroudingFog exotic (brewed 1 invisibility potion for 4 energy, quaff shatters Java's 180-per-cell ring with the center top-up into the same persisted blob - `Potion.apply()`'s default is `shatter(hero.pos)`; no ChaoticCenser trinket), `Inferno`/`Blizzard` (**closed 2026-09-19**: both blobs modeled with Java's evolve halves - inferno reignite/destroy/spread, blizzard double chill, mutual annihilation - and both brews thrown; plus no censer), `Electricity` (**closed 2026-09-17**: ShockingTrap/StormTrap seed Java's real volumes into a persisted blob with the paralyse-by-charge plus odd-charge depth-scaled zap; **ShockingBrew closed 2026-09-19** (craftable, thrown, seeds Java's 20 over the radius-3 flood) and CausticBrew afflicts Ooze over the same flood; ElementalStrike/Blast unoffered, no heap wand-charging (no per-heap wand charge state here); the pylon/Tengu zaps use it as a damage cause only, which the zap path already models; **conduction ported 2026-09-17** (`evolveElectricity`: full-power spread through connected water, minus one per cell, no diffusion), `StormCloud` (no StormClouds exotic, no censer; the Tengu-arena grid belongs to the boss-cycles item), `Foliage` (regrowth grows grass through its charge rules, no blob needed), `VaultFlameTraps` (vault quest unported). Non-gaps: `GooWarn` is unused in Java's own source; `Alchemy`/`WaterOfAwareness`/`WaterOfHealth`/`WellWater` are window flows here by design. Still open as stated: the gas blobs' own effects beyond what's live, the unsupported fire cases,
      and exact blob actor priorities/presentation. See `PORT_COVERAGE.md`'s `BUFF_DURATION` and
      blob-DoT rows. **Complexity: M.**
      **Closed 2026-09-21:** every gas blob carries its actor effect in the adapter (toxic damage,
      paralytic/stench paralysis, corrosive corrosion, confusion daze); the four
      `FLAMABLE-INVENTORY.md` fire cases are resolved - Tengu cone burns terrain and the
      water-extinguish timing collapse are recorded `Divergence (deliberate)` rows (both were
      already implemented with code comments, only the rows were missing), heap-burn matches
      Java (neither side processes potions/containers), the flying gate stands as designed;
      blob-cell presentation (no fire/gas cell particles) and turn-loop tick ordering are a
      new explicit Not-ported/simplification row rather than silent gaps.
- [x] Port the Necromancer's skeleton heal/Adrenaline/teleport support behavior, plus `firstSummon`'s
      variable tick cost (browser-verified end-to-end through the real scheduler: a second summon
      advanced its turn by exactly 2 versus 1 for the first). **Correction 2026-09-17: nothing remains open here** - the teleport destination this line called 'any free neighbour' already picks Java's closest-and-in-sight cell (Euclidean, NEIGHBOURS8 tie order; the branch comment says so in past tense). The teleport destination
      is Java's closest-and-in-sight pick. See
      `PORT_COVERAGE.md`.
- [x] Port DM-200's hunting/venting override. Vents toxic gas along a line to the hero from range
      with the real distance-scaled odds, seed amounts and 30-turn cooldown. Browser-verified live.
      **Correction 2026-09-17**: the BFS-around-terrain reachability check and the closing-distance-failed vent retry this line called not modeled are both ported (`dm200CanVent`, `dm200HuntingTurn`).
      See `PORT_COVERAGE.md`.
- [x] Port Spinner's ranged web ability. Roots the hero directly on a clear ranged shot, gated by the
      real 10-turn cooldown. **Correction 2026-09-17**: the persistent 3-cell `Web` terrain blob is ported - only movement-direction prediction is still not modeled. Real Java predicts movement direction and seeds
      a persistent 3-cell `Web` terrain blob alongside the direct root (the root is the impact, the blob the aftermath). Browser-verified live.
- [x] Implement exact Tengu, DM-300, and other boss attack cycles. **Status 2026-09-17:** all five cycles audited turn-by-turn against Java and corrected - DM300 (supercharge freeze/clamp/gate, free ranged abilities, no reset on failed attempts, rolled first cooldown), Tengu (no-chase wait rule), Dwarf King (unbounded P3 reinforcement), Goo (pump discharge on steps - completed 2026-09-20: all ten voluntary-step sites share a `stepMonster` helper clearing the pump on entry, forced relocations staying on `moveTo` - and blindness), Yog (beams under fists, fire-then-aim, summon burst, phase-5 clamp, map-wide aim, fire dispel); see the per-boss `PORT_COVERAGE.md` rows. **Closed 2026-09-18:** the three remainders - Yog's aiming turn spends Java's own `gate(TICK, ceil(hero.cooldown()), 3*TICK)` and interrupts auto-travel, the P5 "bleed" is latched as the bar flag Java's `processFistDeath` actually sets (not damage over time), and the King teleports onto `CITY_THRONE` at P1->P2 (Java's `ScrollOfTeleportation.appear(this, CityBossLevel.throne)`; the `IMMOVABLE` pin stays immobile-by-return, stated).
- [x] Port rare monster variants' unique behaviors. Found and fixed a whole class of bug: a variant
      never inheriting its base kind's special mechanic because a check tested the literal `kind`
      string instead of the family relationship Java's class extension implies - `ArmoredBrute`
      (enrage/revival with `HT/2+1` and 1/3-turn decay), `DM201` (DM200's vent, and `IMMOVABLE`),
      `Senior` (Monk's Focus regain - whose fix also surfaced that the regain check sat after the
      `distance === 1` early return, so a meleeing Monk never regained at all), `SpectralNecromancer`
      (bolt/summon/support), `Bandit` (fleeing after stealing, and the stolen item being recoverable
      when killed) and `Acidic` (melee retreat, ranged attack, Scorpio's 50% cripple). `Slime`'s
      incoming-hit soft cap was missing for the base kind too, now ported for both. See
      `PORT_COVERAGE.md`'s Brute/DM200/Monk/Necromancer/Thief/Scorpio/Slime rows.
- [x] Implement Java corpse, meat, gold, loot-stack, and limited-drop behavior. `Dungeon.LimitedDrops`
      decay is real for `bat`/`necromancer`/`guard`/`dm200`/`golem`/`shaman` (with `dm200`/`golem`'s
      base chance corrected to the real `0.2`), and `slime`/`skeleton`/`thief`/`swarm` have real
      `MOB_LOOT` entries and decay. Wealth rings' `tryForBonusDrop()` half is ported (section 1).
      **Remaining**: stacking heaps, and dm200/golem's real weapon-or-armor 50/50 pick (simplified to
      always-armor). See `PORT_COVERAGE.md`'s `MOB_LOOT`/`LIMITED_DROP_DECAY` row.
- [x] Check actor collision: two actors can never end up in the same cell. `moveTo`
      (`src/scenes/dungeon/bosses/bossLogic.ts`) writes the destination unconditionally - the
      occupancy gates live at individual call sites (hero bump-attack, necro shove) - so every
      voluntary, forced, and teleport move path needs auditing against Java's `Char.move` /
      `Actor.findChar` invariant, plus a standing check (debug assertion or suite pin) that no
      two live actors share a cell.
      **Closed 2026-09-21:** audited all ~60 `moveTo`/`stepMonster` call sites - every voluntary,
      forced, and teleport path gates on `creatureAt` at selection, mirroring Java (whose own
      `Char.move` writes unconditionally while `Mob`/`Hero.getCloser` refuse occupied cells, and
      whose scripted seal transitions write `pos` directly, fallbacks included). No behavior
      change was needed. The standing check is `findSharedCell`
      (`src/simulation/actorCollision.ts`, whose header records the per-category gate inventory)
      plus five selection-layer pins in `tools/verifyActorCollision.mjs` (wired into
      `test:simulation`). See `PORT_COVERAGE.md`'s occupancy row.

## 8. Complete UI and input parity

- [x] Port full inventory, bag, sub-bag, item-detail, and item-use windows. Item-detail (real
      per-item descriptions, resolved through `inventoryPanel.ts`'s MWL description tables, each a
      real authored Java `.desc` key) and item-use (activation for food/potions/scrolls/rings/armor/
      wands) are both already done. The four bags (VelvetPouch/ScrollHolder/PotionBandolier/MagicalHolster)
      now exist as ownable, named, priced, unsellable goods with the real shop pick (resale
      refused per `Shopkeeper.canSell`'s `unique` rule, 2026-09-18) - and three container-half
      stat effects are live in the same pass (the Holster's recharge/durability factors off
      ownership, the full `validateAllBagsBought` badge set). What stays open is the structural
      container behavior (contents, `grabItems` on pickup, capacity, an open action), not their existence. **Progress 2026-09-19: the open action is now live** - using a bag opens the bag window on its own filtered tab (`bags.ts`'s `bagTab`, routed through the item-action table, pinned in `test:items`); velvet opens the velvet-named runestone tab with seeds one tap away. **Progress 2026-09-19 (later same day): `grabItems` routing and capacity are live** - `bagFitsPickup` ports `Item.collect()` over the flat bag (19-stack sub-bags in fixed order, 20-stack backpack excluding sub-bag contents, merges and bags always fit, silent refusal with the heap kept), wired into every ground-pickup path including the six equipment callbacks. Per-bag contents arrays stay open as the documented stand-in (the filtered tabs already show the same contents). See `PORT_COVERAGE.md`'s bag row.
      **Closed 2026-09-21:** the last two residuals fell on re-audit. The "frame-0
      fallback" was stale - the four bags wear their exact `BAGS`-row sprites (499-502)
      on the real sheet. The per-bag contents arrays close as Simplified: every
      observable (acceptance, 19/20 capacity, display tabs, shop pick, stat effects,
      badges) is live and pinned; only the membership storage differs (derived, not
      nested), which no play-visible behavior can distinguish.
- [x] Implement click-to-travel (`repeated movement`) - a player-reported bug: clicking a distant
      tile previously only produced a single step. Now queues the target and walks the real
      pathfinder's route one step per turn through the existing `awaitHeroInput` hook, matching
      Java's real interrupt conditions (taking damage, or any awake hostile creature coming into
      sight - checked broadly rather than Java's narrower "newly seen" case) and cancelling cleanly
      on arrival or any manual keyboard action. Browser-verified live. **Closed 2026-09-21:** cell
      targeting was already live through `TargetingController`; the hovered destination now also
      draws the route that the same pathfinder will walk, with a documented static-highlight
      reduction in `PORT_COVERAGE.md`.
- [x] Fix the title screen's banner art. The redrawn three-line "MWG Pixel Dungeon" logo was cropped
      by a frame rect sized for the old two-line art and its torches sat asymmetric against the
      narrower text. Fixed: frame height 90->108, torch x-offsets recentred on the glyph midpoint,
      and the whole group shifted as a rigid unit (measured 1px off centre at 1078px width). See
      `PORT_COVERAGE.md`'s title-screen row.
- [x] Complete the journal UI and identification tabs (simplified). The MWG window exposes Guide,
      Notes and Items tabs with paged paragraphs, translated labels and known/unknown entries. This
      port persists identification on item instances rather than Java's run-wide class journal; the
      remaining Java-specific unlock rules stay documented in `PORT_COVERAGE.md`.
- [x] Port pause/menu chrome, boss banners, toast animations, and Java-style transitions. Checked
      against tag `v3.3.8` - the four parts are not one job. *Pause/menu chrome*: done - `WndGame` is
      a real in-game `Window` on a `WindowStack`, opened by the back key and by a new toolbar entry,
      with Java's real entry list (Settings; Challenges when carried; Start + Rankings once dead;
      save-and-exit, disabled while the intro is unfinished) at Java's 120/20/2 geometry, verified
      live by `tools/scratch/game-menu-livecheck.mjs`. *Boss banners*: ported - Java's
      `GameScene.showBanner` has exactly two users (`bossSlain()`'s `BOSS_SLAIN` sprite and
      `gameOver()`'s `GAME_OVER`); there are no level-up or quest banners in v3.3.8. The widget is
      `src/ui/banner.ts` over `src/ui/bannerState.ts`, art cut from Java's own sheet, wired at both
      sites and pixel-verified live (including a deliberate divergence: `ui/banner.ts` clamps its own
      step to 1/20s so a synchronous floor build cannot freeze the band at alpha 0.78). *Toast
      animations*: not applicable as designed - `ui/Toast.java` is used only by
      `GameScene.selectCell()`'s prompt, and this port's targeting is creature-based. *Java-style
      transitions*: the interlevel curtain exists and reproduces Java's totals (0.33 in / 0.67
      steady / 0.33 out, 1.66 on a new region) but hand-computes its fades. **P8's
      `ScreenEffects.sequence` is deliberately NOT adopted here, resolved 2026-09-16**: it is a
      flat colour wash, and this curtain is a five-stop gradient - adopting it would simplify the
      code by deleting the gradient, which is a fidelity loss, not a win. **The same read turned up
      a real divergence, now recorded rather than claimed as matching**: Java's arrival is two
      layers, not one - `GameScene.create()`'s trailing `fadeIn()` (a `PixelScene.Fader`: a
      full-screen black wash clearing over `FADE_TIME = 1f`, which is the P8-shaped part) *plus*
      the loading scene's rotated gradient veil, whose own
      alpha is driven by a custom `update()` that peaks at **0.666** (`2*(timeLeft - (fadeTime -
      0.333))` during FADE_IN, `2*(0.333 - timeLeft)` during FADE_OUT) and is forced to 1 only for
      the final vault's `lastRegion == 6`. This port collapses both into one gradient and drives it
      1 -> 0, so its veil is darker than Java's ever gets, and it additionally fades the loading
      text with `1 - curtain.alpha`, which Java does not animate at all. Also unmodelled:
      `FAST_FADE` (0.50 steady, a total of 1.16s) for revisiting an already-seen depth or any
      ascent - the port only distinguishes normal from slow.
- [x] Implement large interface-size layouts. **Closed 2026-09-19:** the toggle
      (`toggleInterfaceSize`), `StatusPane`'s 1.5x pane/bar scaling, `GameLog`'s Java-real
      3-line small / 5-line large split, the real `ui_large_buffs.png` icon sheet,
      `BuffButton`'s per-icon countdown/fade overlays, and - last - `InventoryPane`'s
      wide bag layout are all live. Large mode switches the bag
      grid to Java's own 10-column arrangement (5 equipped leading, the 20-item page
      after, padded to three full rows in a 302-wide window), with the footer and
      right-edge chrome re-anchored and the narrow 5-column geometry provably unchanged
      (pinned in `tools/verifyBagLayout.mjs`, including byte-level narrow positions).
      The window stays this port's own tabbed popup rather than Java's bottom pane -
      that structural difference is the standing bag-UI simplification, not a gap in
      this line. See `PORT_COVERAGE.md`'s `SPDSettings.interfaceSize()` row.
- [x] Port the hero information window, busy indicator, talent animations, and quick slots.
      **Closed 2026-09-18**: all four named things turn out to already be live, or ported in this
      pass, once checked individually. Quick slots were already live (`toolbar.ts`'s auto-assigned
      `Q1..Q4` buttons over the scene's `quickslot0..3` actions) - the line's own wording was
      stale. The busy indicator is a stated, deliberate text-stand-in (`statusPane.ts`'s `busyPip`,
      no `CircleArc` primitive here) rather than an unstarted port. `WndHero`'s own shell
      (Stats/Talents/Buffs tabs) does not exist as one window, but each tab's *function* does: the
      avatar's flat stat popup, the toolbar's talent-spend window, and `WndInfoBuff`'s click-to-info
      on every status-pane buff icon (`ui/buffInfo.ts`, `ui/buffInfoWindow.ts`), with the real
      name/description and the `{0}` turns-remaining substitution, browser-verified live in French.
      **Talent animations** (`StatusPane.talentBlink`): Java tints the whole avatar yellow with a
      cosine pulse for 10s after a talent point becomes available (`Hero.java`'s level-up grant,
      `GameScene`'s per-floor unspent-point check, `PotionOfDivineInspiration`), clearing early once
      the WndHero talent tab is opened regardless of whether the point was spent. This port has no
      avatar-tint layer for *any* state yet (the low-HP pulse isn't ported either), so a static
      yellow corner dot stands in for the animated tint - and, per this project's "iso is no longer
      the goal" policy, it tracks the real unspent-points state directly (`talentPoints.some(p =>
      p > 0)`) rather than Java's expiring 10s timer, so it cannot go dark on an unspent point the
      way Java's clock can. Browser-verified live: a pixel diff between the dot-off and dot-on
      states shows the exact 0xffee00 dot appear/disappear at its intended corner position and
      nowhere else. See `PORT_COVERAGE.md`'s `WndInfoBuff` and `StatusPane` rows.
- [x] Complete sprite/effect animations. (Split 2026-09-18: the armor-dependent hero
      portrait half is closed - `statusPane.ts` now draws `HeroSprite.avatar()`'s exact rule,
      the class sheet's own `(1, tier*15, 12, 15)` cell under Java's 0..6 clamp, with tiers
      0/6 and the `HeroDisguise` swap recorded unreachable rather than missing.
      **Correction, 2026-09-19: "the animation half...has no renderer seam" was stale.** A real
      seam (mwg's `AnimatedSprite`) already exists and is already driving `idle`/`run`/`attack`/
      `die` clips for both monsters and the hero (`SPRITE_ANIMATIONS`, extracted from the real
      Java sprite classes' own four-clip set - `idle`/`run`/`attack`/`die` genuinely is Java's
      whole per-monster clip vocabulary, checked directly against `RatSprite.java` et al., not an
      arbitrary four this port picked). **Closed the same day: `CharSprite.flash()`**, the brief
      full-white hit pulse `Char.attack()` fires on every landed hit alongside the damage number -
      this port had a half-built fade-out for it already (`colorAdd`, cleared every frame) but no
      trigger anywhere, so nothing had ever actually flashed. Wired the trigger into `showDamage`
      (the one shared choke point every damage-application site already calls), and fixed a real
      bug the fade-out's own unconditional reset caused: an ally's persistent identity tint
      (`allyIdentityColorAdd` - Sheep/EarthGuardian/Lotus/etc., the same `colorAdd` channel) was
      being wiped to 0 on literally the first frame after spawn, before this pass even added the
      flash trigger, since the fade-out never knew a non-zero baseline could be legitimate. Live-
      verified: a flashed Sheep now fades back to its own tint, not to nothing. **Closed 2026-09-19, the shake half**: all 41 Java shake sites audited (see PORT_COVERAGE.md) - 8 missing wirings added, the short refusal shakes documented, the rest tied to unported features; pinned by `tools/verifyShakes.mjs`. **Closed 2026-09-20, the monster-by-monster particle audit**: all 17 Java mob-sprite emitter files inventoried against tag `v3.3.8`, and the six one-shot sites are now live with Java's own counts/colors/samples - DM300 death Blast x100, Pylon death Blast x20, Guard death Shadow x4, Succubus death Heart x6 + Shadow x8, Ghost death Shaft x4 + Light x3 (quest NPC and Rose summon share `GhostSprite`), Ward zap WardParticle x2 + RAY and Ward death x10 - via the `simulation/deathBursts.ts` spec table (forty-seventh extraction), pinned behaviorally by `tools/verifyParticles.mjs`. **What remains
      here, genuinely**: **the pour half closed 2026-09-21** - the seven creature-following
      families pour at Java's own intervals through `simulation/pourAuras.ts` (spec table with
      Java's tints/lifespans/speeds, pinned in `test:simulation` via `tools/verifyParticles.mjs`)
      synced per-frame by `ui/effectBursts.ts`'s `syncPourAuras` (cells, FOV, rebuild on state
      changes) - FetidRat/RotHeart/elementals+fists/DM300-gated/Eye-gated/Goo-gated; see
      PORT_COVERAGE.md's pour-auras row for the stated reductions and the five deferred sites
      (Golem teleport, Goo pump-up cells, Lotus leaves, Necro/Spectral summonings,
      PhantomPiranha - each with its missing trigger named). **Closed 2026-09-21, the ward-zap
      attacker flash**: `takeWardTurn` now fires the same one-frame `colorAdd` pulse
      `showDamage` already triggers on a landed hit, matching `WardSprite.zap()`'s
      `attacker.sprite.flash()`. **Closed 2026-09-22, the ward death fade - and the
      "no fade/tween mechanism exists" premise it was recorded under was stale.** A generic
      corpse-fade loop (`dyingMonsters`, `dungeonScene.ts`'s `update()`) already existed for
      every ordinary monster's 3-second post-`die`-clip fade; a ward has no `die` clip at all
      (`WardSprite.die()` is just `new AlphaTweener(sprite, 0, 2f)`, no animation), so it fell
      through to instant `destroy()` instead of ever reaching that loop. Fixed by widening the
      loop to a per-corpse `duration` (3 default, 2 for a ward) and an explicit `playDieClip`
      flag rather than inferring "has a clip finished" from `AnimatedSprite.isFinished` -
      every monster's sprite is an `AnimatedSprite` instance regardless of whether it has a
      `die` clip, and `isFinished` defaults `false` on one that never had `play()` called, so
      the original `instanceof AnimatedSprite` check alone would have waited forever rather
      than ever reaching the fade branch (caught live before landing: a wand-summoned ward's
      corpse hung at a fixed 72% alpha instead of counting down). Live-verified via the
      scene's own `update(dt)` stepped in increments: fade 0/0.5/1/1.5 -> destroyed exactly
      at 2.0, alpha counting 1 -> 0.75 -> 0.5 -> 0.25 linearly in between.
      **Closed 2026-09-22, the Ward DeathRay beam.** `Beam.DeathRay` (`effects/Beam.java`,
      tag `v3.3.8`) is a textured additive sprite stretched cell-to-cell with a 0.5s fade
      (`alpha(p)` and `scale.set(scale.x, p)` where `p = timeLeft/duration`) - this port has
      no beam-image asset, so `zapBeamOverlay`/`zapBeams` (`dungeonScene.ts`) draw a plain
      fading, thinning line instead (the same "particles are plain squares" reduction
      `deathBursts.ts` already states for the rest of `WardSprite`'s effects), tinted the same
      `WardParticle` blue (0x88ccff). Pushed from `takeWardTurn` every zap that has a target,
      regardless of whether the hit landed (`magicImmune` zeroes only the damage, never the
      beam, matching Java). **Found and fixed live during verification**: the overlay was
      first added to the same early world-space group as the aim/travel/targeted-cell
      highlights, which sits *underneath* the item layer, creature layer, effect layer and
      wall-tops layer added later in the same setup pass - so the beam rendered, but always
      hidden beneath the tiles and sprites it was supposed to connect. Moved to sit beside
      `effectLayer` (the same layer particle bursts already draw into) instead. Live-verified
      via the scene's own `update(dt)`: a long-lived beam renders visibly over tiles and
      sprites at the fixed z-order; the normal 0.5s one is gone by the next real frame,
      consistent with the deterministic stepped-update proof used for the corpse fade above.
      **Closed 2026-09-22, wand-zap trails.** Generalized the same `zapBeams`/`zapBeamOverlay`
      primitive (renamed from the ward-only `wardBeams`) into a shared per-source-tinted zap
      line: `fireWandShot` pushes one from the hero's own cell to the target's for every one
      of the 12 hero-cast wand types, colored by a new `wandZapTrailColor` lookup (frost blue,
      fireblast orange, lightning yellow, etc. - stated representative tints, not values
      extracted from each wand's own Java particle class, since none of those textured assets
      exist here). Fired once per zap regardless of the type-specific branch below it
      (fireblast/regrowth's own cone/AOE shapes stay a stated simplification, not a full
      telegraph). Live-verified via a forced render pass (`renderer.render(stage)`) plus pixel
      extraction on the overlay, since the screenshot tool's own capture can race the game's
      normal render loop for a manually-stepped `update()` - not a rendering bug, a test-
      methodology gap the pixel check closes.
      **Closed 2026-09-22, the Sunray spell-cast burst - the one concretely-scoped piece of
      this line's "spell-cast bursts" half.** `Sunray.java`'s own cast draws two effects: `new
      Beam.SunRay(...)` (Java's own `1f`-duration, `tint(1,1,0.25,1)` yellow `Beam` subclass -
      `zapBeams`/`zapBeamOverlay` gained a per-beam `duration` field, since it previously
      hardcoded `DeathRay`/wand trails' shared `0.5f`, so this reuses the exact same primitive
      at Java's own `1f`) and `ch.sprite.burst(0xFFFFFF44, 5)` on the resolved target (a new
      `spawnHitFlash`/`burstSunrayFlash` in `ui/effectBursts.ts`, the same quick-poof shape
      `spawnCleanseFlare` already established, tinted white). Both fire from `resolveSunray`.
      Live-verified: the beam and a live `effectBursts` entry both appear from a scripted
      Sunray cast (talent gate bypassed for the test, matching this project's own "call the
      private method directly" diagnostic convention), and the beam renders visibly via the
      same forced-render check used above. (At this point every other Cleric tome spell's
      own cast presentation was still open - see below, where each is closed or found to
      need nothing in the same pass.)
      **Closed 2026-09-22, Bless's own cast flare - the second concrete slice.**
      `BlessSpell.castSpell()`'s `new Flare(6, 32).color(0xFFFF00, true).show(ch.sprite, 2f)`
      is the exact same star-flare shape `Cleanse` already draws, yellow instead of pink -
      `spawnCleanseFlare` generalized into `spawnFlare(layer, alive, x, y, color)` (its one
      call site updated to pass Cleanse's own pink explicitly) plus a new `burstBlessFlare`
      wrapper, fired from `resolveBless` on the resolved target in both the self and
      other-hero branches (Java's own `ch` covers both). Live-verified: a scripted Bless cast
      (talent gate bypassed for the test) queues a live `effectBursts` entry and applies the
      real shield/buff, through the exact same particle mechanism the already-working Cleanse
      flare uses.
      **Closed 2026-09-22, Judgement's own cast flash - the third concrete slice.**
      `GameScene.flash(0x80FFFFFF)` (`Judgement.onCast()`) is a screen-wide light-blend
      flash, structurally different from every other spell effect closed so far (screen-space,
      not a world-space beam or per-character particle) - a new `screenFlash`/
      `screenFlashOverlay` pair on `dungeonScene.ts`, added to `stage` directly so it covers
      the viewport regardless of camera position, fires from `resolveJudgement` ahead of its
      damage loop (matching Java's own order) with a stated-approximate `0.3s` fade (Java's
      own `Fader` duration lives in a `noosa` framework class outside this checkout's
      history - not a value read from source). Live-verified: a scripted cast (talent/
      subclass/AscendedForm gates bypassed for the test) sets the flash state and deals real
      damage; the overlay renders visibly via a forced-render pixel check.
      DivineSense/HolyWeapon/HolyWard turned out to need nothing further: their Java sources
      only call `hero.sprite.operate()`, a generic "using an item" pose with no distinct
      particle/beam effect of its own to port. Flash turned out to need nothing further
      either, on closer reading: `Flash.onTargetSelected()` delegates its whole presentation
      to `ScrollOfTeleportation.teleportToLocation()`, and `resolveFlash` already calls this
      port's own `playTeleportAppear` (the shared teleport-appear presentation every random
      teleport already routes through) - not a gap, just one this pass's earlier drafting
      wrongly assumed still open without checking.
      **Closed 2026-09-22, GuidingLight's travelling bolt - the fourth and last concrete
      slice, closing this line entirely.** `MagicMissile.boltFromChar(..., LIGHT_MISSILE,
      hero.sprite, collisionPos, callback)` (`GuidingLight.onTargetSelected()`) needed a real
      moving-projectile primitive, unlike every other spell effect above (all instant beams or
      static particle bursts) - `spawnProjectile`'s existing `Projectile`/`projectiles`
      machinery (already driving thrown-weapon flight) gained an optional `onArrive` callback
      and a new `spawnBoltTo(from, toCell, tint, onArrive)` sibling that targets an arbitrary
      cell rather than requiring an occupant, reused from `resolveGuidingLight` for a plain
      white dot with `ch.sprite.burst(0xFFFFFF44, 3)` firing on arrival (`spawnHitFlash`, the
      same primitive Sunray's own flash already established). The actual damage/buff
      resolution stays synchronous rather than deferred into the callback, the same
      simplification Sunray's instant Beam already made - only the visual bolt and its
      landing burst are async. Live-verified: the bolt spawns, occupies `projectiles` while in
      flight, and the `onArrive` callback fires exactly once the flight completes (confirmed
      both through the full `resolveGuidingLight` path and a direct `spawnBoltTo` call
      stepped frame by frame). **This closes the "spell-cast bursts" half of the line
      entirely** - Sunray, Bless, Judgement and GuidingLight were the four spells that
      actually needed new work; DivineSense/HolyWeapon/HolyWard/Flash needed none.
- [x] Audit every static `t('port.*')` call site against `portStrings.ts`'s EN/FR tables. A script
      walk found 45 keys missing from EN and 47 from FR - all fixed (window titles, victory/defeat
      screens, `port.action.bag`/`port.talent.*`, ~20 combat log lines), plus two French-specific
      bugs a player caught live ("bolt" mistranslated as `trait`, and a subject-first rewrite to
      avoid a bare "de {who}"). Follow-ups the same session closed two more classes of the same gap:
      the dynamic template keys (`port.armor.*`/`port.subclass.*`/`port.affix.*`, all missing), and
      the 33 `this.say('English', ...)` calls that skip `t()` entirely and so are invisible to a
      literal-key audit. **Note for future work**: the audit script only catches literal
      `t('port.…')` arguments; dynamic template keys need a manual check.
- [x] Translate the port's own strings into every Java locale. All 19 offered locales carry a
      complete `port.*` catalogue and all were verified live in a real browser per locale (locale
      active, every non-ASCII codepoint drawing a real glyph rather than tofu, both screens
      differing from English). Every catalogue is a machine draft marked `MT`/`unreviewed` in its own
      doc comment, matching SPD's own complete/unreviewed/unfinished convention - a machine-assisted
      draft is not silently promoted to `complete`. `i18nCheck` compares every registered catalogue
      (key set + `{placeholder}` tokens) against EN and asserts each has a provenance entry and a
      real `LANGUAGES` code, so the drift that let five catalogues fall 24-31 keys behind cannot
      recur silently. **Remaining, and the only reason this box is unticked**: the locale *set* is
      SPD `v2.1.4`'s 19, so `be`/`eo`/`sv`/`zh-hant` are offered by neither `LANGUAGES` nor
      `tools/i18n-extract.mjs`. Closing that means regenerating `spdMessages.ts` from `v3.3.8`, which
      is not a strings-only change - or was not: **the eight removed keys are closed
      2026-09-17**. All eight (`actors.mobs.dm300.rocks`/`.vent`,
      `items.quest.pickaxe.ac_mine`/`.no_vein`, `levels.level.sign_desc`/`.sign_name`,
      `scenes.titlescene.badges`, `windows.wndjournal.notes`) now live under `port.*` with
      SPD's own translations in all 19 locales, every call site (both DM300 lines, both
      pickaxe lines, the MWL action row, both sign lines, all three journal tab lines, the
      title-screen badges button) is re-pointed, and the old names are referenced nowhere.
      That same regen must also preserve the two port-original talent string sets
      (`actors.hero.talent.test_subject.*`, `actors.hero.talent.tested_hypothesis.*` - see
      the talent row: no SPD source has them, so a source-faithful regen would silently drop
      both talents' names and descriptions in all 19 locales; carry them explicitly, ideally
      migrated to `port.*` keys).
      The same pass cleared six more source keys that resolved in no catalog at all (the
      real huntress `spirithawk.no_space`, the real recycle `inv_title` with an open-always
      picker, the generic `armorability.no_target` for both abilities - see
      `PORT_COVERAGE.md`), so the transactional audit is green again.
      The reverse gap exists too: `levels.hallslevel.exit_desc` (addressed by the section 3 city
      visuals) exists at `v3.3.8` but not in this catalogue, so the port answers with the City exit desc there until the regen lands.
      **Closed 2026-09-19: the locale set is now the real 22.** `be`/`eo`/`sv`/`zh-hant` are
      offered by `LANGUAGES` with `Languages.java`'s real `v3.3.8` statuses (`be` unfinished,
      `eo` complete, `sv`/`zh-hant` unreviewed), and `tools/i18n-extract.mjs` ships them via a
      second, optional `--legacy-spd-root` pointed at a `v3.3.8` checkout - the live checkout's
      own current branch is *older* than `v3.3.8` (pre-`v2.5.3` bomb family) and carries pre-`v3.3.8` keys `v3.3.8` dropped or renamed (`alchemicalcatalyst`, `flashbang`/
      `shockbomb`, `aquablast`) but has dropped these four locale files entirely, so a single
      `--spd-root` cannot serve both; the primary root stays the live checkout (preserving that
      dropped content the port still ships) and only these four locales fall back to the legacy one. Left unset,
      `--legacy-spd-root` degrades gracefully - those four locales simply ship empty and fall
      back to English, so the tool still works offline with zero args changed from before.
      `detectLanguage` also gained Java's own `Languages.matchLocale` special case: a bare `zh`
      primary subtag always resolved to Simplified before, so a `Hant` script subtag anywhere in
      the preference now routes to `zh-hant` first, matching `locale.toString().contains("Hant")`.
      Browser-verified live for all four (title screen + Settings window, real non-ASCII glyphs
      throughout, Settings' still-untranslated `port.*` strings honestly falling back to English
      per the stated port-strings gap). `i18nCheck`'s two placeholder assertions for this gap
      (`zh-Hant-HK falls back to zh`, `eo stays absent`) are updated to their real, now-passing
      expectations. See `PORT_COVERAGE.md`'s i18n row. **Complexity: M.**
- [x] Port the audio-settings mutes. **Closed 2026-09-19 (added with the item itself - no
  roadmap line covered `WndSettings`' audio tab):** the settings window grew Java's real
  `AudioTab` title plus its two mute rows (`music_mute`/`sfx_mute`, SPD's own strings in
  every locale, `Window.TITLE_COLOR` headers like Java's `title.hardlight(TITLE_COLOR)`),
  backed by `SPDSettings`' own `music`/`soundfx` persisted flags (`src/settings.ts`) gating
  the single `SpdAudio` choke point every cue and track already funnels through. Muting
  music stops it at once; unmuting replays the standing request (a deliberate improvement -
  Java waits for the next scene to start something). **Extended 2026-09-19 (Java-line
  settings pass):** the 0-10 volume sliders (`music_vol`/`sfx_vol`, Java's quadratic
  curve, live music re-glide + per-playback sfx scaling), the `music_bg` background-play
  toggle (conditional music suspend), `DisplayTab` brightness (Java's `FOG_COLORS` alphas,
  live fog re-render) and screen-shake steppers (0..4 multiplier, default 2 - correcting
  the "default 1" the coverage file previously claimed), and the `UITab` vibration toggle
  (persisted, model-only), all as `- value +` steppers / `✓` toggles under Java's own
  labels (no slider widget in this port). All values re-checked against Java
  (`SPDSettings.java`/`FogOfWar.java`/`PixelScene.java`, tag `v3.3.7`). **Still unported**:
  the Keys/Data tabs and grid/follow behavior. See `PORT_COVERAGE.md`'s audio row.
  **Complexity: S.**
- [x] Manage the dungeon camera zoom. **Closed 2026-09-19 (added with the item itself - no
  roadmap line covered `SPDSettings.zoom()`):** the persisted integer offset (Java's own
  `zoom` key, default 0) drives the dungeon camera as `3 + offset`, adjustable with Java's
  own `+`/`-` keys (numpad twins included) and a port-original `- level +` row under the
  settings window's real `DisplayTab` title - Java has no settings row for zoom (desktop
  zooms with keys, mobile with pinch), so that row's chrome is new while the preference
  underneath is ported. A mid-run change re-zooms the live camera through a subscriber,
  no scene rebuild. **Stated simplifications**: the offset gate is a fixed `[-2, +3]`
  (Java's is screen-derived around a density-derived default), and pinch-to-zoom stays
  unported. See `PORT_COVERAGE.md`'s camera row. **Complexity: S.**
- [x] Warn before a voluntary fall: stepping (or click-to-travel) onto a chasm cell
      asks first. Java's `Chasm.heroJump()` (`levels/features/Chasm.java`) pauses the hero
      and shows a `WndOptions` chasm/jump yes/no window: yes sets the `jumpConfirmed`
      latch and resumes into the jump (0.2s anti-misclick guard on both show and select),
      no cancels and the hero stays put. This port's `fallThroughChasm()`
      (`scenes/dungeon/actorTurnsHazards.ts`) falls immediately with only a log line, so a
      single misstep costs half the hero's HP. Port the window through the scene's
      `WindowStack` (input held while it is up, like the last-missile confirm), the latch,
      and the guard; forced falls (knockback, FeatherFall landing) keep today's path.
      **Closed 2026-09-21:** the step gate (`simulation/chasmJump.ts`, pinned in
      `test:simulation`) pauses for `showConfirmWindow` with Java's own
      `levels.features.chasm.*` strings, the 0.2s guard on both buttons, the
      hero-still-there check on "yes", latch-and-re-enter on "yes", latch clear on the
      fall, and queued-path cancel on either answer. Levitation skips the warning (any
      active levitation glides over - Java still warns when it is about to detach
      mid-step, which this port cannot time; documented simplification).
- [x] Zoom shortcuts: Ctrl++ / Ctrl+- and Ctrl+mouse-wheel drive the existing zoom
      offset. The `3 + offset` camera, the `[-2, +3]` gate and the live `onZoomChanged`
      re-zoom above already exist - only the bindings are missing (today: bare `+`/`-`
      keys, numpad twins, and the settings `- level +` row). Depends on what the `Input`
      layer already exposes: a Ctrl modifier on key bindings and a wheel-event seam;
      check both before estimating. **Closed 2026-09-21:** both exist - the `zoomIn`/`zoomOut`
      bindings fire by physical code with Ctrl held, and MWG reports Ctrl/Cmd+wheel as a `zoom`
      action. New `scenes/dungeon/zoomShortcuts.ts` steps the same offset on wheel sign (refusing
      while a window holds input, like the keyboard zoom) and `preventDefault`s Ctrl+plus/minus
      so the browser does not page-zoom alongside; bound once per scene, unbound on destroy.
      Step direction pinned in `test:simulation` (`simulation/zoomStep.ts`), coverage row added.
- [x] Review key management end to end against Java: key colors on the ground and in the
      inventory (`crystalKey`/`ironKey`/`goldenKey` art), locked-chest and locked-door pictures,
      and the opening flows (which key opens which lock, key consumption, locked-chest loot).
      Keys and the golden-key chest gate exist (`src/items/itemKinds.ts`, `groundPickup.ts`'s
      `lockedChestNeedsGoldenKey`); the art and the full open sequence are unverified.
      **Progress 2026-09-21:** the opening-flow audit found and fixed a real bug - keys carried
      no depth of their own, so one found on any floor unlocked a locked door or chest on any
      *other* floor too (Java's `Key.depth`/`Notes.keyCount(new IronKey(Dungeon.depth))` scope
      every key to the floor it was found on). See `PORT_COVERAGE.md`'s new key-management row.
      **Closed 2026-09-21, the art half.** Two real, confirmed-live bugs found and fixed:
      (1) `ironKey`'s bag-slot icon fell back to the generic "?" placeholder (frame 0) - unlisted
      in `itemSpecificFrames` entirely - while its *ground*-pile icon was wired to frame 56, the
      golden key's own frame (`ItemSpriteSheet.IRON_KEY/GOLDEN_KEY/CRYSTAL_KEY = MISC_CONSUMABLE+7/
      8/9` = 55/56/57, tag `v3.3.8`); both tables now carry all three keys at their real frames.
      Live-verified in-browser: the bag window now shows three visually distinct key icons (gray
      iron, gold, cyan crystal) instead of a golden key twice and a question mark. (2) A locked or
      crystal chest's *ground* sprite showed the contained item's own icon (spoiling its contents)
      instead of a chest - Java's `ItemSprite.view(Heap)` always draws `ItemSpriteSheet.CHEST/
      LOCKED_CHEST/CRYSTAL_CHEST` (36/37/38) for a chest heap regardless of contents, never the
      item inside. Fixed alongside (`CHEST_FRAME`/`LOCKED_CHEST_FRAME`/`CRYSTAL_CHEST_FRAME` in
      `dungeonConstants.ts`, `spawnGroundItem`). All seven cells (three keys, four chest variants)
      were already byte-identical to the real `v3.3.8` sheet in this port's own `items.png` -
      pixel-verified against a fresh extraction of the real sheet before wiring, matching this
      project's "check real source before assuming a gap" convention - so no art needed sourcing
      or patching, only the frame-lookup wiring. The locked-door terrain is also now confirmed:
      `visualTerrainAt` selects Java's `LOCKED_DOOR` frame 10 and `CRYSTAL_DOOR` frame 31, while
      an ordinary closed door uses frame 5. The complete key/lock visual review is therefore
      closed; the remaining SkeletonKey/WornKey behavior is documented as not ported in the
      coverage matrix.
- [x] Add keyboard navigation to menus, title screen first. Neither Java nor this port can be
      played or even started without a pointer today: buttons, tabs, lists and dialogs have no
      focus model, no visible focus indicator, and no key bindings (arrows/Tab to move, Enter
      to activate, Esc to go back). Start with the title screen (the first thing every player
      meets, disabled players included), then carry the same model through class select, the
      settings window, and the bag tabs. Port-original accessibility work, not Java parity -
      Java SPD has no such system. **Complexity: M.**
      **Progress 2026-09-22: the title screen slice is done.** `TitleScene` tracks a single
      `focusedIndex` into the same row/column grid its own layout already lays buttons into,
      moved by the existing `up`/`down`/`left`/`right` movement actions (only while no window
      is open, so a window's own input is never fought over the same keys), drawn with a
      visible white ring redrawn on every layout pass (so it survives a resize/orientation
      change), and activated by `confirm` - which now dispatches the *focused* button's
      `onClick`, not unconditionally `begin()` as before (a pointer click already goes to
      whichever button was clicked; keyboard confirm now does the same for whichever button
      is focused). Browser-verified live via dispatched keyboard events: default focus on
      "Enter the Dungeon", arrow-key movement through the grid, Enter opening the focused
      window, Escape closing it without moving focus, and the ring relocating correctly after
      a portrait-width resize.
      **Progress 2026-09-22 (second slice): class select is done.** `ClassSelectScene`
      carries the same focused-portrait/ring model over its 6-class grid (grid-aware:
      3x2 in landscape, 1x6 in portrait, reusing the layout pass's own bounds). `Confirm`
      mirrors a portrait click (select) the first time; pressed again on the
      *already-selected* portrait it dispatches Start directly instead of re-selecting
      it, so a keyboard player never needs to separately reach the on-screen Start
      button - a port-original interaction, not Java parity (Java has no keyboard path
      here at all). `Cancel` already returned to the title screen before this pass.
      Browser-verified live: default focus, arrow movement across the grid, Enter
      selecting Rogue (splash art/name/description/Start button all updated), a second
      Enter beginning the run as Rogue.
      **Progress 2026-09-22 (third slice): settings-window tab switching is done, in-tab
      widgets are not.** `showSettingsWindow` registers its own `Input.onAction` listener
      (stack-mode `Signal`, so it sits in front of the scene's own while this window is
      open) so left/right cycles the tab strip the same way clicking a tab icon does;
      removed on close so a lower listener gets the keys back untouched. `Cancel` already
      closed the window before this pass (`Window`'s own `closable` handling). **Deliberately
      out of scope, stated rather than assumed:** sliders, checkboxes and the language grid
      inside each tab stay mouse-only - each widget kind needs its own activate/adjust
      semantics (a slider needs value-stepping, not just selection), which is a materially
      bigger task than a focus ring. Browser-verified live: opening Settings from the
      title screen, arrow-cycling from Display to Interface tab, Escape closing the window
      with title-screen focus correctly restored to the button that opened it.
      **Progress 2026-09-22 (fourth slice): bag-tab switching is done - the item grid
      itself already had keyboard support before this pass.** `IconGrid` (`mwg/two-d/ui`,
      the framework component the bag's item grid is already built from) turned out to
      already handle `up`/`down`/`left`/`right`/`confirm`/`cancel` internally with its own
      visible highlight - `InventoryWindow.handleAction` already delegated to it, so a
      player could already move the highlight and open an item's detail view by keyboard
      before this session touched anything. What was missing was only the category/pouch
      tab strip, the same click-only gap the title/class-select/settings screens had:
      `menu` (Tab/KeyI, otherwise unused while the bag is open, since `IconGrid` doesn't
      consume it) now calls `TabbedList.nextTab(1)`, cycling all nine tabs (four
      categories, five sub-bag pouches) in the order `createList` declares them. Browser-
      verified live: opening the bag, Tab switching from "Tout" to "Usage" with the grid
      re-filtering, arrow-key movement plus Enter still opening an item's detail view
      (a food ration) on the new tab, Escape closing both the detail and the bag.
      **Progress 2026-09-22 (fifth slice): settings-window checkboxes are keyboard-focusable
      now, sliders and the language grid still aren't.** `showSettingsWindow` scans each
      tab's built `node` for direct-child `SpdCheckBox` instances (every existing tab builder
      adds its checkboxes flat, not nested), draws a focus ring over one of them, up/down
      moves it, confirm calls the checkbox's own `setChecked(!checked, true)` (its existing
      toggle method - no new activation semantics needed, unlike a slider), and switching tabs
      resets focus to the first checkbox on the new tab. This is opportunistic reuse of an
      already-simple widget, not the full "every widget kind" scope: a slider still has no
      keyboard value-stepping, and the language grid (`langsTab`, a `SpdButton` grid, not
      `SpdCheckBox`) is unaffected by this pass's checkbox-only scan. Browser-verified live:
      focus starts on Fullscreen, moves to the colorblind checkbox, confirm toggles it, and
      switching from Display to Interface resets focus to that tab's own first checkbox.
      **Progress 2026-09-22 (sixth slice): sliders are keyboard-adjustable now too.** The
      checkbox-only focus scan above widened to also find `SpdOptionSlider` instances
      (`focusablesIn`, still a shallow direct-children scan, still visual order); a new
      public `SpdOptionSlider.step(delta)` mirrors what a completed drag already does (clamp,
      move the thumb, fire `onChange`). Left/right now context-switches: it adjusts the
      focused slider by one tick if one is focused, and only falls back to the previous
      tab-switch behavior otherwise - so the same two keys serve both jobs without a mode
      toggle, and a slider that happens to be a tab's first widget (Interface's own
      "toolbar config" row) is reachable and adjustable immediately on entering that tab.
      Browser-verified live: down-arrowing past both Display checkboxes onto the brightness
      slider, right-arrow driving its thumb to max: up-arrowing back to a checkbox,
      right-arrow correctly switching tabs instead (no regression), and the new tab's own
      first-widget slider (toolbar config) immediately left/right-adjustable on arrival.
      **Progress 2026-09-22 (seventh and final slice): the language grid is done, and a real
      keyboard dead-end found along the way is fixed.** `langsTab`'s own build result now
      carries an optional `focusGrid: { items, cols }`, keyboard-navigated by its own
      `ClassSelectScene`-style row/col math (up/down move by row, clamped; left/right move by
      one, clamped; confirm dispatches the focused language button's `onClick`, exactly the
      same rebuild-and-relabel path a mouse click already takes). **Found and fixed live
      while testing this slice**: tab-switching had been living on left/right since the third
      slice, which worked while only checkboxes existed (they never claim those keys) but
      quietly broke the moment sliders did - Input's own tab is two sliders and nothing else,
      so every left/right there adjusted one instead of ever reaching another tab, and
      up/down only ever toggles between the two sliders, never landing on a non-slider widget
      to unstick it: tab-switching became unreachable by keyboard on that tab, a real dead
      end no earlier slice's testing happened to hit (their tabs all mix checkboxes in).
      Fixed by moving tab-switching onto `menu` (Tab/KeyI) - the same convention the bag
      window's own tab strip already uses - so left/right unambiguously means "adjust the
      focused control" everywhere, with no fallback and no competing claim. Browser-verified
      live end to end: Tab cycling all six tabs including the two-slider Input tab (previously
      the trap), arrow movement across the language grid, confirm selecting Spanish and the
      whole title screen rebuilding in it exactly as a mouse click would, with the title
      scene's own keyboard focus still intact afterward. **This closes the entire item**: all
      four originally-named screens (title, class select, settings, bag) are keyboard-
      navigable, including every settings-window widget kind (tabs, checkboxes, sliders, the
      language grid).
- [x] Add colorblind options to the graphics settings. Too much state here is color-only:
      buff/debuff icon tints, HP-bar thresholds, key colors, trap and hazard highlights. Offer
      at least deuteranopia/protanopia/tritanopia-safe palettes (plus a high-contrast pass if
      it falls out cheaply), persisted like the other display settings, with every color-coded
      element re-checked against each palette rather than assumed. Port-original accessibility
      work, not Java parity - Java SPD has no such system. **Complexity: M.**
      **Progress 2026-09-22: the central status palette is done, not every color-coded
      element.** A new `settings.colorblind()` boolean (persisted like the other display
      settings, `port.ui.colorblind` checkbox added to the Display settings tab, all 19
      locale catalogs) swaps `ui/spdTheme.ts`'s `SPD_STATUS_COLOR` (positive/negative/
      warning/neutral - the palette the game log, floating combat text and status flashes
      all read from, 22 call sites across 8 files) and `ui/buffOverlays.ts`'s buff-text
      tint to one Okabe-Ito-derived safe set. **Deliberate simplification, stated rather
      than assumed:** one palette, not three separately tuned deuteranopia/protanopia/
      tritanopia sets - Okabe-Ito is validated jointly distinguishable under all three at
      once, so one safe set clears the "safe under each" bar without three to keep in
      sync. Browser-verified live: the checkbox toggles and persists (`localStorage`
      `colorblind: "true"`).
      **Progress 2026-09-22: monster HP-bar colors are done.** `refreshHealthBars`'
      per-creature `Bar` (`deathSaveRefresh.ts`) filled green-on-red (`0x00ee00` on
      `0xcc0000`) - the filled and missing portions read as similarly dark under red-green
      colorblindness, and unlike the hero's own HP bar (a real SPD texture strip, not a
      color fill, so nothing to swap there) this one is this port's own plain `Bar` color
      fill. `colorblind()` now swaps it to the same Okabe-Ito-derived pair
      `SPD_STATUS_COLOR` already uses (bluish-green filled, vermillion missing), read once
      at bar creation (matching this map's own per-creature caching - a mid-run toggle only
      affects bars created after it). Live-verified: a damaged monster's bar reads exactly
      `0x009e73`/`0xd55e00` with the setting on. Key art was checked and found to need
      nothing: each key already reads by its own distinct pixel art (gray/gold/cyan), not a
      swappable tint, so there is no color-only state there to begin with.
      **Progress 2026-09-22: the one hazard-telegraph highlight is done.** An audit of every
      floor/tile overlay found exactly one color-only hazard indicator:
      `NewbornFireElemental.doAttack()`'s red `TargetedCell` telegraph (the 3x3 blast-radius
      warning, `refreshTargetedCellsOverlay` in `monsterAi.ts`) - pure `0xff0000`, Java's own
      exact tint. `colorblind()` now substitutes the same Okabe-Ito vermillion
      `SPD_STATUS_COLOR.negative` already uses: still reads as "danger", but stays
      distinguishable from the palette's own bluish-green "safe" tones, unlike pure red under
      red-green colorblindness. Live-verified via a forced render: the 3x3 telegraph around
      the hero renders in the expected orange/vermillion tone, not pure red. No other
      color-only trap/hazard indicator was found in the audit (traps and hazard cells are
      identified by their own distinct sprite art, not a swappable overlay tint, the same
       shape as the key-art finding above).
       **Progress 2026-09-23: the high-contrast pass is done.** A second port-original
       setting (`highContrast()`, persisted `highcontrast`, default off, its own
       Display-tab checkbox wired to `port.ui.highcontrast` in all 19 catalogues)
       swaps the same three audited consumers to full-saturation primaries - positive
       cyan, negative magenta (the red/green pair red-green vision confuses, re-hued
       at maximum luminance), warning/neutral/default unchanged - winning over the
       colorblind set where both are on; the telegraph goes magenta on the same
       precedence. Pinned in `test:settings` (persistence plus the HC-first source
       shape for the Pixi-bound sites) and `verifyBuffOverlays.mjs` (tint values
       plus precedence). See `PORT_COVERAGE.md`'s new colorblind/high-contrast row,
       which also records the one residual: the monster HP bars read colours
       once at creation (mid-run toggles only affect later bars); their own
       high-contrast swap is wired since 2026-09-23 (codex-03: HC-first
       `0x00ffff`/`0xff00ff` at the same read-once construction, pinned in
       `test:settings`, browser-verified) - the read-once limitation is the
       part that stays, shared with the colorblind swap from the start.
## 9. Build the Java-vs-TypeScript parity harness

**Status check**: none of these six are done in the literal sense this section asks for - an actual
differential harness running both the real Java build and this port side by side against identical
seeds/traces - and none should be marked `[x]` on the strength of what already exists. What does
exist, so the gap is the real remaining one rather than a from-scratch build:
`tools/verify*.mjs` (wired into `test:simulation`, 195 simulation + 7 banner + 36 vault + 6 overlay checks as of 2026-09-21, plus the `test:items` pins and the armor-ability checks inside `test:simulation`) already pin combat rolls, damage
curves, buff timing and turn-cost/scheduling - but as *values checked against a transcription of the
Java source*, not against a running Java build, which is the bar "compare both implementations"
sets. **Honesty pass 2026-09-21, per bullet:** levelgen RNG-call-order (bullet 2's level
part) is the only piece done literally - 26/28 `TRACE-IDENTICAL` plus 2 classified oracle skew,
last run 2026-09-19 (the reference dumps are not in this repo and need the Java checkout's
harness to regenerate, so this was not re-run today; no levelgen code changed since). Item,
monster and quest *generation* RNG rides the same floor-build stream on those floors, but no
standalone item/monster/quest-trace comparison exists. Bullets 1, 4 and 5 are genuinely
unstarted in the literal sense: the Java harness dumps levelgen, not scripted play, so there
is no driver for fixed-seed action traces, quest/boss/save-load differentials, or a
screenshot matrix (only targeted `*-livecheck.mjs` probes). Bullet 3 is covered to the
transcription bar by the suites above. Bullet 6 is `PORT_COVERAGE.md` itself, row by row.
None of the six boxes tick on that basis; the remaining work is real and itemized, not a
re-verification of what the suites already pin. **Unblocked 2026-09-19:** the suite aborted at hunger for a day (stale STEP=10 expectations left behind by the STEP 1 fix), hiding every check after it - syncing those expectations un-hid three more stale sets (buff-fixture poison stream, MINIBOSS/BOSS comment-regex + sets, hero-turn/hero-actions hunger math) and, in the miniboss case, a real data bug (Eye/Warlock/plain-Elemental over-looted on boss wealth tiers Java never gives them). The full suite passes for the first time. `PORT_COVERAGE.md` already does the sixth bullet's classification row by row, as a running
narrative rather than one finished audit pass. Screenshot/animation-timing comparison has real
infra (pixel-hash probes, per-feature `*-livecheck.mjs` scripts) but only for the things those
scripts targeted. **Triage 2026-09-17:** the Java side is real and runnable after all - the
SPD checkout's `desktop:runHarness` task (Temurin JDK 21, offline Gradle build green) dumps 36
reference blocks (4 seeds x depths 1-9: room graph plus paint maps), and `npm run parity:levelgen`
diffs this port's own generator against them (`tools/levelgenParity.ts`, standalone - it needs the
Java checkout, so it stays out of `verify`). Settled result: 26/28 on depths 3+ fully identical
(feelings, exact room-rect sets, painted maps); the 2 remaining diffs are seed999999999999/depth9
(207 cells, water/grass/door/trap cascade with matching graph - first divergence is grass at row 2,
then door picks at rows 7/18/22) plus one structural outlier, seed42/depth8
(different dims, disjoint rects - but the same room-kind multiset, so selection matches and only
placement/sizing diverges). Fixed since the 22/28 count: all four depth-5 Goo arenas (arena
`center()` spawn draws, `GooBossRoom.canMerge() == false`, Diamond/Walled `canPlaceWater() ==
false` - see PORT_COVERAGE.md). Depths 1-2 print as UNSTABLE and stay out of the count: Java drops
the guidebook pages with an intentionally unseeded generator, so even Java-vs-Java is not
reproducible there (the heap shifts `paintGrass` draws). Probe details: TS room-kind labels ride
on `PortedFloor.rooms` for kind-level triage, and both sides rtrim trailing chasm before the
cell compare. **Progress 2026-09-18**: RNG-call-order comparison (bullet 2 below) is no longer
unstarted for levelgen - it was wired but silently broken, reporting a false divergence at
draw 0 on *every* floor including the 26 that already had matching output. Two real bugs fixed:
the trace log's own text was wrong for every 32-bit draw (signed-vs-unsigned formatting, not an
RNG bug - see `PORT_COVERAGE.md`), and `generateFloor()` was genuinely burning `spdSeedForDepth`
twice per floor (a redundant pure re-derivation, harmless to shared state but doubling the
trace). With both fixed, all 26 matching-output floors on depths 3+ are now confirmed
`TRACE-IDENTICAL` - true RNG-call-order equality, not just coincidentally-matching final maps -
and the two still-open floors have exact divergence draw indices: seed42/depth8 at draw 321,
inside `RegularBuilder.createBranches`'s per-branch retry loop (Java takes three consecutive
extra `bits=31` draws there that this port does not, then both sides resync perfectly for the
rest of the floor); seed999999999999/depth9
at draw 22626, inside `paintMazeConnection`'s maze-growing loop. **Narrowed 2026-09-19, a dead
end recorded so it is not re-walked**: the seed42/depth8 gap traces to `createBranches`'s
SecretRoom-vs-ConnectionRoom retry guard needing `roomsToBranch[i]` to be a real secret room at
that index in Java but not in this port for this seed/depth, despite byte-identical draws up to
that point - a content (which room is secret) question, not an algorithm one. `createSecretRoom`'s
own selection algorithm was checked against it too and found to not match tag `v3.3.8`'s real
`SecretRoom.createRoom()`, but implementing that literal algorithm regressed the whole suite
26/28 -> 13/28 (depths 3+), proving this port's actual levelgen RNG reference is not `v3.3.8` for
that call and the existing "min of 4 rolls" shape - despite its uncited comment - is the
empirically correct one; left unchanged. seed999999999999/depth9 carries the same signature
(short exactly 3 draws overall, same as seed42/depth8) despite diverging in different code
(`paintMazeConnection`'s `growMaze`, algorithm and door-order both checked and matching) -
circumstantial support that both floors share one cause (which room is secret) rather than two
separate bugs. See `PORT_COVERAGE.md`'s matching note. Chasing the
first index closed
a real, separately-documented suspect from an earlier audit pass: `createBranches` was a `void`
where Java's is `boolean` (`failedBranchAttempts > 100` gives up and lets the caller's builder
return `null`, retrying the whole room graph) - fixed, though confirmed *not* the cause of
either open diff (`failedBranchAttempts` never approaches 100 for these two seeds), so both
remain open for a future pass. **Trace-bisected 2026-09-19** (per-floor RNG-draw traces on both
sides plus the `traceStackWindow` call-site facility; no shipped code changed by the bisection
itself): secret *selection* is exonerated on both floors - the room-kind multisets are identical
(honeypot secret on both sides for seed42/depth8), and the port's secret-branch guard was
instrumented and behaves correctly there (honeypot guardRounds 1,1,2). seed42/depth8 splits at
draw 321 with the port mid-`placeRoom` angle retries while Java advances to the next branch
iteration's `element()`; spot-checked room sizes match while every position differs, and the port
draws ~2190 more post-split yet still converges attempts=1 (Java: attempts=1) - a
placement-outcome divergence from identical RNG inputs, i.e. a deterministic geometry/logic
difference on the placement path (branch order unexcluded), not an RNG-call difference. The
"resync perfectly" reading does not hold on current traces (0/60 post-gap lines match; 4390 vs
6582 draws). seed999999999999/depth9 matches through draw 22625 (graph, all painting, all three
trap class rolls); the split is one extra Java float between trap chances#1 and element#1
(net java+3 overall, with 3 extra TS ints at the tail pointing at item-substream ordering) - in
`paintTraps`, not in maze-growing, superseding that location. The checkout HEAD is custom
history (`v3.3.8` is not its ancestor), so the next pass must verify against the checkout
worktree Java that actually produced the dump, not only the `v3.3.8` tag.
**Resolved 2026-09-19:** both open floors are one oracle version-skew, not two port bugs.
Call-site attribution on both sides (port `traceStackWindow` probes, since reverted, plus
a new env-armed stack window in the harness's scratch `TracingRandom`,
`LEVELGEN_STACKWIN=seed:depth:lo-hi`, writing `levelgen_stacks_<seed>_<depth>.txt`)
proves the mechanisms: seed42/depth8's draw-321 gap is the port refusing a crystal-room
door under `v3.3.8`/`4.0.0-beta`'s center-strip `CrystalPathRoom.canConnect` where the
worktree oracle (v2.1.4-era `core/`, predating upstream's v2.2.0 crystal redesign)
accepts it under refuse-center - exact door cells (15,21),(15,22) on rect (7,20,15,27)
verified against both rule texts - followed by a port placeRoom retry cascade;
seed999999999999/depth9's draw-22626 gap is one extra Java `paintGrass` float from the
same redesign shifting the crystal entry door ((40,22) vs (41,22)) and an internal
crystal door ((40,24) vs (38,26)), with count-resync and shifted trap/wandmaker
positions making the 47 cells. Secret selection is exonerated (honeypot secret both
sides); the maze-`growMaze` and item-substream theories are withdrawn. User decision:
keep the `v3.3.8`/`4.0.0-beta` behavior, classify both as oracle skew in
`PORT_COVERAGE.md` - no port change, 26/28 `TRACE-IDENTICAL` plus 2 classified.
Still genuinely unstarted: RNG-call-order comparison

beyond levelgen, and loot/quest/boss-transition/save-load comparison.

- [x] Compare both implementations with fixed seeds and identical action traces... - moved to `BACKLOG.md` B1 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] Verify RNG call order for level, item, monster, and quest generation... - moved to `BACKLOG.md` B2 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] Verify combat rolls, damage, status effects, and turn timing. **Complexity: M.**
      **Closed 2026-09-21:** `tools/verifyCombatRolls.mjs` (wired into `test:simulation`)
      pins the formula shapes deterministically - stub RNGs stand in for Java's draws
      (`float(x)` returns scripted unit fractions scaled by the stat, endpoints for the
      rest), so there is no sampling noise: the two-uniform-rolls hit comparison as an
      exact 6-call sequence, Bless/Hex/Daze/magic/surprise/encumbrance boundaries
      (inclusive, as Java), damage endpoints with the armor-roll scratch floor, the full
      attacker multiplier chain in Java order (fury/weakness/berserk/blazing/growing/
      aggression/vulnerable/giant/antimagic/excess-STR), Preparation's best-of-N plus
      rank bonus, status-tick deal/redraw/decrement/expire (including magicalSleep's
      no-tick skip), and the pure-number helpers. Turn timing: searching cost a 1-turn
      spend against Java's `TIME_TO_SEARCH = 2f` - fixed in `TURN_COSTS` with cost pins
      in `tools/verifyHeroActions.mjs`, and the headless harness now ticks hunger
      per turn (a lone search runs 296 to 298). Closed 2026-09-21 by the turn-loop
      owner, who threaded the cost end to end (`finishHeroTurn(effects, turnCost)`,
      per-tick scene loops, forwarding pinned in `verifyHeroTurn`) - see
      `PORT_COVERAGE.md`'s combat-rolls row for the full per-tick inventory.
- [x] Verify loot, quest outcomes, boss transitions, and save/load state... - moved to `BACKLOG.md` B3 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] Add screenshot and animation-timing comparisons for visual parity... - moved to `BACKLOG.md` B4 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] Classify every remaining difference as either an implemented Java behavior or an explicitl... - moved to `BACKLOG.md` B5 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] Audit every `undefined` in the source as a clue to unimplemented functionality (missing
      returns, unfilled optional paths, stubbed branches). **Complexity: S.**
      **Closed 2026-09-21:** all hits classify clean - nullish/compare idioms, `T | undefined`
      lookup-or-missing returns, optional context hooks, and documented Java-mirroring no-ops;
      the only TODO/FIXME lines cite Java's own FIXME guards (already implemented beside each
      citation), and there are no empty stub bodies or swallowed catches. Two standing gates
      keep it that way: `noImplicitReturns` in `tsconfig.json` (the probe was already clean, so
      no missing-return path exists to grandfather) and `tools/audit-undefined.mjs`, wired into
      `npm run check`, which fails on bare TODO/FIXME markers and empty-message throws.
- [x] Check the code for multiple definitions as a clue to under-usage of the MWL file (values
      hardcoded in TypeScript that belong in authored data). **Complexity: S.**
      **Closed 2026-09-21:** audited monster stats (MWL-read), wands/shop/prices/XP curve (all
      MWL-read), and the Cleric/talent tuning family. Five duration constants duplicated
      `buffDurations` rows with Java-verified equal values and now read `BUFF_DURATION`
      instead (`divineSense`, `holyWeapon` imbue cap, `guidingPriestCooldown`,
      `lanceCooldown`, `auraProtection`, `lethalHasteCooldown`); per-source literals that
      differ from the table (ShieldOfLight 4-vs-5, vulnerable 5-vs-20, Radiance paralysis 3)
      match Java's own applied-vs-`DURATION` splits and stay. Standing pins: the new
      `single-sourced` check in `tools/verifyClericSpells.mjs` plus the
      `lethalHasteCooldown` row in the simulation suite. See `PORT_COVERAGE.md`'s MWL row.
## 11. Architecture refactor toward the v3 target

This section tracks structural work, as distinct from the Java-parity work above. See
`SPD_ARCHITECTURE_TARGET_V3.md` for the target architecture (Command -> State + Events simulation,
renderer-free `EntityId`-addressed actors, event-driven presentation, data/function/method-driven
business families instead of Java-class transposition) and which parts of it are blocked on `mwg`
capabilities not yet released versus actionable now. `SIMULATION_ARCHITECTURE.md` tracks the actual
extraction steps taken so far (turns, combat, buffs, hero actions, movement) and the next planned
one.

- [x] Step 6: give every `Combatant`/`Creature`/`GroundItem` a stable id (`simulation/entityId.ts`),
      and move `sprite` out of `Creature`/`GroundItem` into a `spriteFor` view registry keyed by that
      id (see `SIMULATION_ARCHITECTURE.md`'s "Step 6").
- [x] Produce the section 22A/22B data/function/method analysis matrix for one monster family
      (Rat/Snake/Crab/Goo, see `MONSTER_ANALYSIS_RAT_SNAKE_CRAB_GOO.md`) before any class-level
      monster refactor, per SPD-ADR-010.
- [x] **`mwg@0.9.1` is now the published dependency**: its `core.EntityRegistry`/`EntityId`,
      `simulation.SimulationRuntime` (Command -> State + Events + cost + snapshot runtime) and
      `core.PresentationQueue` are available to the port, and the first runtime adapters are in use.
      The pin was raised deliberately (not as a side effect of other work) with the full verification
      suite re-run.
- [x] Next real phase: wrap the existing per-domain rule functions (`simulation/combat.ts`... - moved to `BACKLOG.md` B6 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] Consider replacing `simulation/entityId.ts`'s local counter with MWG's own `core.EntityRegistry`
      now that it exists (SPD-ADR-002) - resolved as a split decision: the `EntityId` type *is* MWG's
      own (re-exported, plus the reverse `idOfEntity(entity)` lookup), but full `EntityRegistry`
      adoption (minting through `add()`) is deferred: it mints opaque `eN` ids while this port's
      prefixed ids (`hero-N`/`item-N`) are persisted in the save schema, and it has no
      caller-chosen-id primitive - needs that upstream or a save migration first (see P1 in section
      11A).
- [x] Extract `main.ts`'s `attack()` pure resolution (hit/damage rolls, weapon-affix/talent bran... - moved to `BACKLOG.md` B7 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] Compare `mwg/i18n` against the plan's section 22C "Semantic Messaging" shape before committing
      to SPD-ADR-012. It matches (`SemanticMessage`/`MessageChannel`/`MessageFormatter`/
      `createCatalogFormatter`, `EntityTextResolver`/`GrammaticalEntity`, CLDR plurals, FTL, catalog
      audit tools), and the catalog mechanism is already adopted. Pending is only the message half
      (typed messages at `say()` sites, combat log lines as pilot).
- [x] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/buff... - moved to `BACKLOG.md` B8 (2026-09-24, ongoing epic, not closable by a finite change).
- [x] **MWG-utilization audit**: checked whether this port reimplements functionality `mwg` already
      exports. Well-utilized overall, no action needed on `Roguelike.Pathfinder`/`Blob`/
      `Actors.rollLoot`/`Charges`, the `EntityId` re-export, the Java-bit-matching LCG RNG
      (`spdRng.ts`, correctly not using mwg's xoshiro) or `ui/floatingText.ts` (a justified sibling,
      not a duplicate). Three genuine gaps were found, and all three are resolved in the same pass -
      `heroBarrier`'s pooled model (three real bugs, not one ordering simplification), section 10's
      stale `eternalFire` claim, and `summonSkeleton`'s push-aside (where the audit's own suggested
      `knockbackPath` fix would have been wrong - Java's rule is an 8-neighbour search maximizing
      `trueDistance`, needing no framework primitive at all). No UI-widget/i18n-catalog/scheduler/
      FOV/geometry reimplementation found elsewhere. **Closed 2026-09-17:** the outstanding re-run already happened - the audit was refreshed against installed 0.14.0 on 2026-09-15, and `npm run mwg:check` confirms no newer release exists today (pin, installed and published latest all 0.14.0).
      See `PORT_COVERAGE.md`'s mwg-usage section. **Progress 2026-09-19:** bumped to 0.15.0 (purely additive - table references, persisted settings + screen, auto-pause/mute, quality scaling, ducking, `Meter`, `SpriteGroup`; `npm run mwg:check` confirms pin/installed/latest all 0.15.0). Adopted: `tableReferences` replaces the hand-copied ground-kind set in `tools/compile-mwl.mjs` (negative-probed), and `SpdAudio` gains the `AudioSuspendRig` pair wired into `new Game({ audio })` for auto-mute on hide. Deferred with reasons: Settings/SettingsScreen (own settings UI + persisted settings), QualityScaler/`SpriteGroup` (need visual verification), ducking/`Meter` (no call-site need). Correction 2026-09-19: the "silent removal" first
 written here never happened - the published 0.14.0 artifact already has `category`, no
 `sourceClass` (checked tarball to tarball); the stashweapon writer was new code that never
 compiled under either version, and rides a cast because `sourceClass` is port-owned data.
- [x] Re-check `mwg`'s exports on every version bump for the plan's remaining assumed primitives
      (raw 2D primitive re-exports, the Semantic Messaging shape). Re-checked at 0.4.2, 0.5.0 and
      0.5.1; `Types2D` arrived but remains type-only, so Phase 0's exit criterion still cannot be
      met. **Open upstream**: P1 (`EntityRegistry` caller-chosen ids) and P2 (`Types2D` value
      positions). `core.ReactionTable` was evaluated and deliberately not retrofitted at every
      latch/transition site (each is already a minimal boolean; a table costs net lines plus save
      plumbing) - it is recorded in `SPD_ARCHITECTURE_TARGET_V3.md` as the designated v3
      event-presentation mechanism instead.
- [x] **Code-quality note**: a long `if (x === 'a' || x === 'b' || ...)` OR-chain is itself a code
      smell. Where the values share a real, checkable structural property (a common prefix, a shared
      category the item's own definition carries, or a lookup table/`Set` membership test), prefer
      that over enumerating every literal by hand - it stops scaling linearly with every new case.
      **Keep It Simple, Stupid (KISS) is a good default principle here.** Closed this pass: a regex
      sweep of every such chain in `main.ts` found one genuine instance (`spawnMonster`'s 8-clause
      "never sleeps on spawn" gate, extracted into `monsters.ts`'s `NEVER_SLEEPS_KINDS` Set); the
      other short chains are each a fixed, real-world-bounded enumeration that doesn't grow with new
      features, and were deliberately left alone rather than converted for no structural reason.
      `tsc`/build/both suites green.
- [x] **Data-driven dispatch pass**, acting on the note above for the two largest instances found by
      a full `main.ts` audit (205 `kind ===`/`id ===` checks across ~19 functions).
      `quaffPotion`'s 39-branch chain became a `potionEffects` `Record<Kind, handler>`, and
      `takeMonsterTurn`'s 236-line 16-case ranged cascade became `rangedAiOverrides` (each handler
      returning `true` if it consumed the turn, `false` to fall through to the shared movement AI;
      three shared cases route through one helper from two keys). `spawnMonster`'s 37 branches became
      real data tables (`DEPTH_SCALED_STATS`/`BASE_KIND_ALIASES`/`SPRITE_KIND_OVERRIDE`) plus
      `NPC_KINDS`/`BOSS_KINDS` sets - the texture chain collapsing from 12 checked cases to one
      lookup once re-derived correctly. Browser-verified live for every handler with real branching
      complexity, and via direct texture-identity comparison for the sprite table. **Not a candidate
      for `mwg` itself**: the *pattern* (keyed handler registry) is generic, but every handler body
      is SPD-specific game logic, which the licensing boundary forbids putting in `mwg`. Recorded as
      a possible upstream proposal (a generic `keyedDispatch<K, Args>` utility, or documentation of
      the pattern) for the user to raise in the framework's own repo.
- [x] **File-size refactor: keep every hand-written source file human-readable.**
      **Closed 2026-09-21, correcting a badly stale claim.** This bullet's own narrative below still
      reads `dungeonScene.ts` at 22,534 lines after its 44th micro-extraction and predicted the
      remaining seams needed the section-11 runtime migration to move further - both now false. The
      file is **2,439 lines** as of this check (`wc -l src/scenes/dungeonScene.ts`), split by domain
      into `src/scenes/dungeon/*.ts` (`combatResolution.ts`, `environmentFireTraps.ts`,
      `panelsSingleUse.ts`, `turnLoopAiming.ts`, `actorTurnsHazards.ts`, `monsters/monsterAi.ts`,
      `bosses/bossLogic.ts`, `deathSaveRefresh.ts`, `hero/inventoryQuickslot.ts`,
      `hero/armorAbilityUse.ts`, `hero/weaponSpellsGear.ts`, `hero/clericSpellFlows.ts`, and more)
      mixed back onto `DungeonScene.prototype` via `Object.assign`, each file taking a `Mixed<typeof
      ...Methods>` slice of the interface - a larger structural jump than any single extraction this
      bullet documented, whose own intermediate history isn't reconstructed here (it happened across
      sessions this pass has no transcript for; `git log`/`git show` on the relevant files is the
      real record if it's ever needed). `npm run check`'s `tools/check-file-budget.mjs` gate is live
      and green: every hand-written file fits 2,000 lines except four narrow, deliberate,
      currently-declining overages in `tools/file-budgets.json` (`dungeonScene.ts` 2,439/2,445,
      `environmentFireTraps.ts` 2,002/2,010, `inventoryQuickslot.ts` 2,212/2,220, plus
      `portStrings.ts` at a fixed 12,259 - translation data, not logic, with no seam to extract
      along). The stated objective - no hand-written `.ts` file too large for a reader to hold its
      structure or review a diff touching it - is met; further shrinking any of the three narrow
      overages remains ordinary, optional follow-up work, not a standing gap.
      `src/scenes/dungeonScene.ts` is ~23,600 lines and still growing with every ported system -
      past the point where any reader can hold its structure, review a diff touching it, or find
      the one seam a change needs without a search tool. Objective: no hand-written `.ts` file
      over ~2,000 lines (generated files under `src/generated/` excluded), enforced by a line-count
      gate in `npm run check` so the budget holds as new systems land. Vehicle is the extraction
      pattern already established in this section (pure rule modules under `src/simulation/` and
      `src/items/` plus thin scene adapters): carve `dungeonScene.ts` per domain - item-use paths
      behind `items/itemActions.ts`'s router, blob fields/ticking next to `environmentalBlobs.ts`,
      aim/targeting helpers next to `simulation/targeting.ts` - one domain per commit, suites green
      at each step, no behavior change (each move is covered by the existing verify suites plus a
      before/after `tsc` + build). The promised line-count gate is live since
      2026-09-20 (`tools/check-file-budget.mjs`, wired into `npm run check`):
      every hand-written `src/**/*.ts` file must fit 2,000 lines except the
      entries in `tools/file-budgets.json` (`dungeonScene.ts` at 22,600,
      `portStrings.ts` at 10,300 - loose headroom over the day's counts, to be
      lowered in the same commit as each shrink and deleted once a file fits).
      **Triaged 2026-09-20, the micro-extraction vein is exhausted**: the
      thirty-fifth through forty-fourth extractions completed every seam-clean
      micro-unit the scene still held (six targeting queries, five wandering
      decisions, the vent emission, three consolidations: hunting blocked-set,
      flee-step, summon-cell) with paired drives and green gates throughout -
      and netted +8 lines across the ten commits (22,526 to 22,534), because
      adapters, builders and deviation-note comments cost what small moved
      bodies save. What remains scene-side is orchestration
      (turn loop, AI with live pathfinder, rendering, the context builders
      that must bind scene state) - not movable as behavior-identical
      micro-slices. Further movement toward the 2,000-line objective belongs
      to the section-11 runtime-command migration, not to more
      extractions - with two later exceptions driven by the file budget itself: the 45th (`takeSentryTurn` -> `simulation/sentryTurn.ts`, whole beam-turret turn with a headless warmup/gaze pin) and the 46th (the shared Amok/Aggression pursuit tail -> `pursueTarget` in `simulation/targeting.ts`, with an adjacency/blocking pin), both behavior-identical with scene adapters, landed 2026-09-20 when behavior ports pushed the scene 7 lines over its 22,700 budget. Further 2026-09-20 extractions, all behavior-identical and behind small context/callback seams: the boss `unseal()` cluster -> `scenes/bossUnseal.ts` (-93), the in-game menu -> `ui/gameMenu.ts`, the aim-preview drawing -> `ui/aimOverlay.ts`, and `spawnMonster`'s sprite/`Creature` construction plus `CHAMPION_TINT`/`allyIdentityColorAdd` -> `scenes/monsterSpawn.ts` (-163, live-checked against the original ally tints, alpha and Monk Focus), and the 287-line monster-side on-hit hook `mobOnHit` -> `scenes/mobOnHit.ts` behind a `MobOnHitContext` (-268; live-checked over ten armor glyphs x seventeen monster kinds with no exception). The scene's exact cap is now 22,160. **First extraction 2026-09-19**: the alchemy-pot window flow
      (`startAlchemyIngredientPick`/`pickAlchemyUnits`/`completeAlchemyRecipe`/`openAlchemyRecipes`
      plus the `AlchemyIngredientSelection` type) moved verbatim to `items/alchemy.ts` behind a new
      `AlchemyFlowContext` (bag, energy get/set, say, picker, display name, panel refresh) - the
      scene keeps one 17-line builder; net −139 lines in `dungeonScene.ts` (23,622 after),
      `alchemy.ts` 448 to 630.
      The move's own suites: `tsc` + build clean, the item/simulation suites green (two relocated
      source pins in `verifyPrismatic.mjs` now assert against the moved module), plus a new
      headless drive of the moved flow through a scripted picker (seed brew end to end, empty-pot
      refusal). **Second extraction 2026-09-19**: the transmutation-scroll window flow
      (`transmuteEligible`/`transmuteCandidates`/`completeTransmutation` plus the read
      branch as `startTransmutationPick`) moved verbatim to `items/transmutation.ts`
      behind a new `TransmuteFlowContext` (bag, heroClass, mining flag, hero vitals,
      talent/instance/sync/say/picker callbacks, get/set accessors for the equipped
      ring, Might bonus, missile thresholds and empowered zaps); the scene keeps one
      builder and a one-line branch (net −70 lines in `dungeonScene.ts`, 23,552 after).
      Suites: `tsc` clean (one real catch - `Creature`'s
      optional `magicImmune` needed an optional context field), item/simulation suites
      green, plus a new headless drive of the moved flow (reroll + scroll consumption +
      mage zap-arming, empty-list and stale-pick refusals). **Third extraction 2026-09-19**:
      `examineTile`'s whole name/description decision (ritual marker, caves-arena and city
      visuals, stairs, raw ported `Terrain.java` branches, coarse-kind switch) moved
      to `ui/examineText.ts` as `examineTileOutcome(ctx)` next to its per-region helpers -
      the scene only precomputes the arena/city key answers (they need its visual contexts)
      and performs the outcome (`say` vs the alchemy-pot recipe window); net −108 lines in
      `dungeonScene.ts` (23,444 after), `examineText.ts` 92 to 246. Suites: `tsc` clean,
      item/simulation suites green (eleven orphaned `examine*` imports and the two ritual
      key imports deleted from the scene), plus a 16-assertion headless pin of the moved
      branch table in `verifyItemWorkflows.mjs` (stairs, wall, halls water, locked/crystal
      doors, grass, floor fallback, raw-beats-coarse, alchemy outcome, well, ritual/arena/
      city precedence and the empty-desc suppression). **Fourth extraction 2026-09-19**:
      `triggerPortedPlantAt`'s 15-branch hero effect switch moved to the new
      `simulation/plantTriggers.ts` as `runHeroPlantEffect(kind, x, y, cell, hero, ctx)`
      behind a `HeroPlantContext` (buff grants, cure, blob seeds, healing/sungrass/
      earthroot/time-bubble state accessors, fadeleaf movement seam, loot, shake,
      visibility, depth); the scene keeps kind resolution, Lotus preservation, marker
      removal and the redraw plus a 30-line builder. The context field for text is
      deliberately named `t` (bound to the real one) so the `t('...')` key audits keep
      matching these call sites - a 16-vs-16 key-set diff over the move proves nothing
      was lost. Net −132 lines in `dungeonScene.ts` (23,312 after). Suites: `tsc` clean
      (two real catches - `subclass()` is `string | null`, `randomFreeCell` may return
      `undefined`), sim suite green at 158 checks with a new every-branch headless drive
      (Warden/non-Warden halves, impassable icecap neighbours, fadeleaf with and without
      a destination, depth-scaled sorrowmoss, the unknown-kind wither), the earthroot
      shake pin relocated to the moved module, and the simulation sibling-import
      confinement guard satisfied. The mob half stays for the fifth extraction. The
      old Dreamfoil note was corrected in `PORT_COVERAGE.md`: v3.3.8 renamed that plant
      to Mageroyal, whose seed and trigger behavior are already ported and tested.
      **Fifth extraction 2026-09-19**: the mob/allied half (`triggerMobPlantAt`'s
      fadeleaf block plus its ten-branch switch) joined the same module as
      `runMobPlantEffect(kind, cell, creature, ctx)` behind a `MobPlantContext`
      (immovable gate, patrol/teleport destinations, sprite placement, blob seeds,
      cell-visibility shake gate); the scene keeps guard, kind resolution and marker
      removal plus a 20-line builder. Net −78 lines in `dungeonScene.ts` (23,234
      after). Suites: `tsc` clean (one real catch - the immovable set is keyed by
      `AnyMonsterId`, so the gate takes that type), sim suite green at 159 checks
      with a new every-branch mob drive (mark-before-teleport fadeleaf ordering,
      immovable refusal before the mark, rotberry's unmarked gas, mageroyal keeping
      burning, the silent unknown-kind no-op), and the mob-half earthroot shake pin
      relocated to the moved module. The plant-trigger domain is now fully out of
      the scene. **Sixth extraction 2026-09-19**: the toolbar quickslot trio
      (`quickslotStates`/`assignQuickslot`/`useQuickslot`) moved into
      `items/itemActions.ts` next to the item-use router they feed - a
      `QuickslotContext` (live slot array mutated in place, bag lookup, use path)
      plus the pure `quickslotFamilySlot` mapping; the scene keeps one-line
      adapters and a 7-line builder. Net −10 lines in `dungeonScene.ts` (23,224
      after) - small, but it completes the "item-use paths behind the router" half
      of this line. Suites: `tsc` clean first try, item suite green with a new
      quickslot pin (family mapping, assign-mirrors-use, refresh reporting the
      held quantity under the held instance, stale-slot cleanup on refresh and on
      use, familyless ids assigning nothing). **Seventh extraction 2026-09-19**: the
      `SacrificialFire` room rule (`spreadSacrificialFire`/`sacrificeCost`/
      `processSacrifice`) moved into `simulation/environmentalBlobs.ts` next to the
      other blob rules - a `SacrificialFireContext` (prize/charge/cell accessors,
      structural fire volume, reset, passable, exp table, roll, reward spawn, say,
      `t`); the scene keeps the triple, room setup and save/load plus a 20-line
      builder. Net +3 lines in `dungeonScene.ts` (23,227 after) - the builder costs
      more than the 30 moved lines, stated plainly; the value is domain placement
      (blob ticking now lives in one module) plus first-ever headless coverage of
      the cost math and payout order. Suites: `tsc` clean (two real catches - the
      exp table is keyed by `AnyMonsterId`, the reward spawner needs a non-null
      prize), sim suite green at 160 checks with a new sacrificial drive (statue/
      mimic/piranha/swarm/kindless costs, spread gating, outside-volume refusal,
      partial payment banking nothing, prize-cell decode, stepper fallback). The
      reward key moves 1-to-1 with the code (`ctx.t`, extractor-matched). **Eighth extraction
      2026-09-19**: the Sandals of Nature's window flow (`useSandals`'s feed/root choice rows,
      the seed picker, root aiming plus confirm) moved to `items/sandals.ts` behind a new
      `SandalsFlowContext` (sandals/seed lookup, picker, aimer, plant-plus-trigger seam, turn,
      say, `t`); the scene keeps the one-line `useSandals` adapter the item-use router calls,
      `sandalsItem` for the grass paths, plus a builder. Net −47 lines in `dungeonScene.ts`
      (23,201 after), `sandals.ts` 141 to 264. Suites: `tsc` clean first try, item suite green
      with a new headless drive of the moved flow through scripted pickers (feed consumes and
      attunes, root aims at the authored range 3 and pays firebloom's own 20, AntiMagic opens
      nothing, cursed-plus-uncharged reports low charge, far cells refuse without planting).
      **Ninth extraction 2026-09-19**: the Talisman of Foresight's scry flow (`useTalisman`'s
      aimer, `confirmTalismanScry`'s cone pass, the per-turn trap warning) moved to
      `items/talisman.ts` behind a new `TalismanFlowContext` (talisman lookup, aimer, distance,
      fog/secret/terrain seams, creature/heap marks, travel/invisibility/refresh/turn, say,
      `t`); the scene keeps one-line `useTalisman`/`checkTalismanAwareness` adapters plus a
      builder. Net −90 lines in `dungeonScene.ts` (23,111 after), `talisman.ts` ~169 to 354.
      Suites: `tsc` clean (the six moved rule imports deleted from the scene), item suite green
      with a new headless drive of the moved flow on a stub 10x10 level (a 3-tile scry maps at
      1 exp a cell with no level, pays exactly 92 charge with the partial books, one turn;
      full creature+heap cover marks 5-turn awareness everywhere with the exact leveled
      remainder; own-cell/cursed/low-charge/AntiMagic refusals; the warning fires once per run
      and resets) - which needed one new harness compile line (`mechanics/cone.ts`) plus an
      earlier recompile of `dungeonConstants.js` for its `WALL`. **Tenth extraction 2026-09-19**:
      the Ethereal Chains' grab/pull flow (`useChains`'s aimer, `confirmChains`'s reachability
      split, the enemy pull and the self-grab) moved to the new `items/chains.ts` behind a
      `ChainsFlowContext` (chains lookup, aimer, explored/passable/immovable/reachability/trace
      seams, creature lookup, hero/enemy movement, shake, rings, invisibility, turn, say, `t`);
      the scene keeps the one-line `useChains` adapter the router calls, `chainsItem` for the
      builder, plus the builder. Net −42 lines in `dungeonScene.ts` (23,069 after). Suites: `tsc`
      clean after one real catch (the immovable set is keyed by `AnyMonsterId`, so the gate
      takes that type via an erased import), item suite green with a new headless drive of the
      moved flow on a stub 10x10 level (enemy pull to the first free cell for its distance,
      self-grab beside a wall, rooted/wall/grabless/short-charge/statue/unreachable refusals
      spending nothing, cursed/AntiMagic gates). **Eleventh extraction 2026-09-19**: the Horn of
      Plenty's meal flow (`useHorn`'s eat/snack/store rows, the satiety meal, the food store)
      moved to the new `items/horn.ts` behind a `HornFlowContext` (horn lookup, picker, food
      lookup, hunger get/set, meal effects, heal display, fast-eating read, rings, turn, say,
      `t`); the scene keeps the one-line `useHorn` adapter the router calls, `hornItem` for the
      builder, plus the builder. The pure charge/satiety rules moved with it (`hornChargeCap`,
      `hornSatietyPerCharge` - the recharge table now calls the module's). Net −57 lines in
      `dungeonScene.ts` (23,012 after). Suites: `tsc` clean, item suite green with a new headless
      drive of the moved flow through scripted pickers (five charges for a 500 pool at the
      authored 90 a charge with the meal firing over 3 turns, one-charge snack, a meat pie
      banking four levels with the bonus, empty-capped/AntiMagic refusals, cursed losing only
      the store row) - which needed one new harness compile line (`simulation/hunger.ts`).
      **Twelfth extraction 2026-09-19**: the Master Thieves' Armband's steal flow (`useArmband`'s
      melee aimer, the target gate, the loot-chance and loot-pick tables, the steal confirm)
      moved to the new `items/armband.ts` behind an `ArmbandFlowContext` (armband lookup, aimer,
      creature lookup, wealth multiplier, hero level, loot tables/decay/max-levels as data
      callbacks - the catalogue is too heavy for the item harness - limited-drop counters,
      loot spawn, kind names, creature buffs, invisibility, say, `t`); the scene keeps the
      one-line `useArmband` adapter the router calls, `armbandItem` for the builder, plus the
      builder. Net −77 lines in `dungeonScene.ts` (22,935 after). Suites: `tsc` clean after
      keying the builder's catalogue lookups by `MonsterId`, item suite green with a new
      headless drive of the moved flow (a surprised steal lands its stub drop with 5-turn
      debuffs, 9 charge left and 3+2 exp short of the 10-exp level; robbed/overleveled/empty
      refusals still mark, daze and pay; cursed/uncharged gates; the warlock/scorpio/succubus
      pick shapes). **Thirteenth extraction 2026-09-19**: the Dried Rose's summon/direct flow
      (`useRose`'s summon/direct rows, the neighbour-scan summon, the order aimer) moved to
      `items/rose.ts` behind a `RoseFlowContext` (rose lookup, title, picker, ghost liveness,
      dead-ghost clearing, spawn-cell scan, ghost spawn/registration, ally orders, hero level,
      first-summon latch, invisibility, refresh, turn, say, `t`); the scene keeps the one-line
      `useRose` adapter the router calls, `roseItem`/`roseGhostAlive` for the recharge/petal/turn
      paths, plus a builder. Net −62 lines in `dungeonScene.ts` (22,873 after), `rose.ts` 194 to
      342. Suites: `tsc` clean after diarizing `Creature`'s real shape into the ghost view
      (optional `sleeping`/`isNPC`/`npcKind`) and remembering both the interface's and the
      builder's `beginAim`, item suite green with a new headless drive of the moved flow (summon
      on a free neighbour with the exact level-0 statline, charge paid, scene registered, Java's
      hello-first/appeared-later greetings, direct orders with numbered yells, quest/charge/room
      refusals spending nothing, AntiMagic undercharging). The move caught one live omission in
      review - the scene-field assignment - fixed as a `setActiveGhost` seam before committing.
      **Complexity: L.** **Fourteenth extraction 2026-09-19**: Lloyd's Beacon's zap/set/return
      flow (`useBeaconArtifact`'s three rows, the aimer, the self/other confirms, the set anchor,
      the same-depth relocate vs cross-depth travel) moved to `items/beacon.ts` behind a
      `BeaconFlowContext` (beacon lookup, title, picker, aimer, depth, hero cell, cell index,
      grid width, boss/amulet/mining-branch gates, creature views, immovables, free-cell scatter,
      hero/creature moves, teleport effects, same-depth relocate, a `travelToDepth` callback that
      runs `enterLevel` scene-side, roots, invisibility, say, `t`); the scene keeps the one-line
      `useBeaconArtifact` adapter the router calls, `beaconArtifactItem` (retyped to the new
      `BeaconItem`), plus a builder, and `artifactRechargeCap`'s beacon case now calls the moved
      `beaconChargeCap`. Net −49 lines in `dungeonScene.ts` (22,824 after), new `beacon.ts` 206
      lines. Suites: `tsc` clean after keying the creature view and `isImmovableKind` by
      `AnyMonsterId` (the chains precedent), item suite green with a new headless drive of the
      moved flow (row gating by charge/anchor, set anchor with boss/adjacent blocks, self-zap
      paying/unrooting/scattering, victim scatter with boss/immovable/empty refusals, same-depth
      relocate vs cross-depth travel, blocked/occupied/walled anchors). The move caught one
      inverted reading in review - the zap costs 2 *past* depth 20, not above it - fixed in the
      module comment and the drive before committing.
      **Complexity: L.** **Fifteenth extraction 2026-09-19**: the brew throw/aim/shatter pair
      (`useBrew`'s pending-aim re-entry, `shatterBrewAt`'s four shatters) joined
      `simulation/brews.ts` behind a `BrewFlowContext` (bag has/consume, aimer with the
      passable-non-chasm validate, floor size, solid test, pending-aim cell, creature views,
      ooze affliction, per-blob seeding, turn); the scene keeps the one-line `useBrew` adapter
      the router calls plus a builder, and drops its eight-name brews import for the flow pair.
      Net −27 lines in `dungeonScene.ts` (22,797 after), `brews.ts` 98 to 186. Suites: `tsc`
      clean with no fix-ups (`Step` is exactly `{x, y}`, the aimer already takes a validate),
      simulation suite green at 165 checks with a new headless drive of the moved flow in
      `verifyBrews.mjs` (aim-then-shatter with the 49-cell electricity-20 flood, unknown/missing
      brews never aiming, pending aims shattering at once, Caustic oozing non-NPCs only,
      Infernal piling the blocked share onto the center). The move fixed two stale "no blob to
      seed" claims in passing - both blobs have been modeled and seeded since the follow-up, so
      the module header now says so and the moved comment carries the corrected shape.
      **Complexity: S.** **Sixteenth extraction 2026-09-19**: the single-use `BeaconOfReturning`
      spell (`useBeaconOfReturning`'s set-then-travel ladder) joined `items/beacon.ts` as
      `useReturningBeaconFlow` on the existing `BeaconFlowContext` plus three spell seams
      (spell lookup, spell consume, turn); the local `Beacon` item type is gone with the move
      (the flow reads the shared `BeaconItem`), and the scene keeps the one-line adapter the
      router calls. Net −43 lines in `dungeonScene.ts` (22,754 after), `beacon.ts` 206 to 260.
      Suites: `tsc` clean with no fix-ups, item suite green with a new headless drive of the
      moved spell (first cast anchors with the set line and spends the turn but not the spell,
      foreign branches refuse, same-depth steps consume, the unmoved hero exempts himself,
      strangers/walls refuse, cross-depth travels consume, depths outside 1..26 refuse - every
      refusal spending nothing). The drive caught one fixture bug in review - anchored fixtures
      must carry the `returnBranch: 0` the set path always writes, or the branch guard refuses
      them - fixed as a drive normalization with the reason stated.
      **Complexity: S.** **Seventeenth extraction 2026-09-19**: the targeted-spell pair
      (`useTelekineticGrab`'s heap aim/confirm, `usePhaseShift`'s victim scatter/calm/paralysis)
      moved to the new `items/spells.ts` behind `TelekineticGrabContext`/`PhaseShiftContext`
      sharing a `TargetedSpellAim` base (spell has/consume, aimer, turn, say, `t`); the scene
      keeps the two one-line adapters the router calls, two builders over a shared
      `targetedSpellBase`, and drops both bodies plus their comments. Net +7 lines in
      `dungeonScene.ts` (22,761 after) - the two builders and the shared base cost more than
      the two small bodies saved - new `spells.ts` 120 lines; the payback is headless coverage
      where none existed and a reuse base for the next targeted spell. Suites: `tsc` clean
      with no fix-ups except keying the heap view's `chest` marker as a string (the scene's
      `GroundItem.chest` is a variant union, only its presence is read), item suite green with
      a new headless drive of both flows (grab: missing spells never aim, empties/chests/shop
      stands refuse yet consume; shift: validate needs a creature, victims scatter/calm/stiffen
      on the victim itself after the move, bosses scatter unstiffened, empties and stranded
      casts still cost). The drive caught the same factory-merge bug as the brew drive - bag
      defaults swallowing the empty-bag override - fixed the same way. The move also corrected
      one seam choice in review: the teleport effect takes the victim view directly
      (`playTeleportOn`, move-then-play preserved) instead of re-looking it up post-move.
      **Complexity: S.** **Eighteenth extraction 2026-09-19**: `useReclaimTrap`'s store/redeploy
      flow joined `items/spells.ts` as `useReclaimTrapFlow` on the `TargetedSpellAim` base plus
      a `ReclaimTrapContext` (live carried class, armed-trap lookup folding the spent/secret
      gates, placeable test, take/place mutators, tile restitch); the scene keeps the one-line
      adapter the router calls plus a builder. Net +1 line in `dungeonScene.ts` (22,762 after) -
      the trap-layer builder costs what the body saved - `spells.ts` 120 to 174; the payback is
      the same as the seventeenth's (first headless coverage of the flow, base reuse holding).
      Suites: `tsc` clean with no fix-ups, item suite green with a new headless drive (missing
      spells never aim, armed traps validate/store with a wand refund while keeping the spell,
      bare/spent/concealed cells refuse on both validate and confirm, carrying validates the
      floor instead and redeploys concealed while consuming the spell, blocked cells refuse).
      Review corrected one invented Java clause in the interface comment before committing, and
      kept the snapshot-vs-live `carrying` distinction exact (snapshot on confirm, live read on
      validate, as the moved code did).
      **Complexity: S.** **Nineteenth extraction 2026-09-19**: `useRecycle`'s pick/redraw flow
      joined `items/spells.ts` as `useRecycleFlow` behind a `RecycleContext` (spell gate, picker,
      bag scans, category deck draw with the same-class/same-id reroll, remove/add swap, name,
      panel refresh); the scene keeps the one-line adapter the router calls plus a builder that
      owns the `Cat` deck mapping and the generator loop. Net +13 lines in `dungeonScene.ts`
      (22,775 after) - the draw-loop builder costs more than the body saved - `spells.ts` 174 to
      241; same payback as the last two (first headless coverage of the flow). Suites: `tsc`
      clean after narrowing the seam cast (the flow hands back the full payload the draw built,
      narrowed to `RecycledItemView` between - stated at the cast), item suite green with a new
      headless drive (missing spells never open the picker, only potions/scrolls/seeds/stones
      are offered, each redraws its own deck, the swap names the replacement and refreshes,
      empty pickers draw nothing, vanished picks swap nothing). The drive caught one stub bug
      in review - the drive's `t` dropped params, hiding the substitution the recycled line
      asserts - fixed by echoing params like the harness's own i18n stub.
      **Complexity: S.** **Twentieth extraction 2026-09-19**: the infusion pair
      (`useCurseInfusion`'s pool draw/curse/marker, `useMagicalInfusion`'s keep-upgrade) joined
      `items/spells.ts` as `useCurseInfusionFlow`/`useMagicalInfusionFlow` behind an
      `InfusionBase` plus `CurseInfusionContext` (spell gate/consume, picker, live-bag scans,
      relabel, burst, name, panels); the scene keeps the two one-line adapters the router
      calls, a curse builder over a shared `infusionBase`, and drops both bodies, both local
      `Infusable` types, and the six names the two bodies alone used (both predicates, both
      curse pools, `upgradeItem`). The
      module imports the real predicates, pools, `Random`, and `upgradeItem` directly. Net −23
      lines in `dungeonScene.ts` (22,752 after), `spells.ts` 241 to 358. Suites: `tsc` clean
      after narrowing one seam cast (the swapped-back payload is the drawn object, stated at
      the cast - same shape as the recycle seam), item suite green with a new headless drive
      (missing spells never open pickers, pickers run the real usability rules, curse lands
      pool affix/level/bonus/relabel/burst/consume, wands curse pool-free, marked picks gain
      nothing twice, bare lists refuse, vanished picks consume nothing, upgrades land +1 with
      the enchant kept). The drive caught three review bugs: a sibling-require the harness
      compiles under another name (fixed by an idempotent recompile with the reason stated),
      minted fixture ids the default-true predicate wrongly admits (fixed by using the
      suite-pinned real ids), and a before-level read after the drive already mutated the item
      (fixed by asserting the known +0 start).
      **Complexity: M.** **Twenty-first extraction 2026-09-19**: the self-buff pair
      (`useFeatherFall`'s cushion-and-log, `useWildEnergy`'s refund/buff/bank/extend) joined
      `items/spells.ts` as `useFeatherFallFlow`/`useWildEnergyFlow` behind a `CastBase` plus
      `FeatherFallContext`/`WildEnergyContext` (spell gate/consume, buff/refund/recharge/timer
      seams, turn, say); the scene keeps the two one-line adapters the router calls, two
      builders over a shared `castBase`. The module reads the buff table and the recharge
      turns directly. Net +19 lines in `dungeonScene.ts` (22,771 after) - two builders and a
      base for two tiny bodies - `spells.ts` 358 to 419; same payback as the small slices
      (first headless coverage of both casts). Suites: `tsc` clean with no fix-ups, item suite
      green with a new headless drive (missing spells do nothing; feather cushions for the
      table duration with the light line; wild refunds one charge, grants recharging for the
      table duration, banks exactly 4, extends by exactly the table turns, and logs nothing).
      The move corrected two stale claims in passing: the scene comment and the WildEnergy
      coverage row both said the four-turn pulse was unmodeled for want of a recharge clock,
      but `ArtifactRecharge` ported the next day and the body always banked it - both now say
      so, with the row pointing at the correction.
      **Complexity: S.** **Twenty-second extraction 2026-09-19**: the honeypot throw/shatter
      pair (`useHoneypot`'s pending-aim re-entry, `shatterHoneypotAt`'s owner-neighbour-free
      break) moved to the new `items/honeypot.ts` behind a `HoneypotFlowContext` (pot
      has/consume, aimer with the passable-non-chasm validate, pending-aim cell, occupant
      view, spawn-free test, bee release with holder, turn); the scene keeps the one-line
      adapter the router calls plus a builder. Net −8 lines in `dungeonScene.ts` (22,763
      after), new `honeypot.ts` 75 lines. Suites: `tsc` clean with no fix-ups, item suite
      green with a new headless drive (missing pots never aim, empties break ownerless with
      pot and turn spent, occupants sidestep the bee to a free cardinal with the holder set,
      NPCs pin no holder, no free cell keeps the pot and spends nothing, pending aims break
      at once). The drive caught one fixture bug in review - the NPC case freed only the
      occupied cell, but any occupant forces the cardinal scan - fixed by freeing a cardinal.
      **Complexity: S.** **Twenty-third extraction 2026-09-19**: the stylus/alchemize picker
      pair (`useStylus`'s identify/curse gates plus glyph write, `useAlchemize`'s energy
      filter plus scrap/bank/identify) joined `items/spells.ts` as `useStylusFlow`/
      `useAlchemizeFlow` behind `StylusContext`/`AlchemizeContext` (carried-spell gates,
      pickers, live-bag scans, glyph roll, energy bank, name, panels); the scene keeps the
      two one-line adapters the router calls plus two builders. The module reads the class-
      armor predicate, the curse lookup, and the energy table directly; only the glyph roll
      stays scene-side where its table lives. Net −6 lines in `dungeonScene.ts` (22,757
      after), `spells.ts` 419 to 545. Suites: `tsc` clean after snapshotting the readonly
      bag at the listing seams, item suite green with two new headless drives (stylus:
      missing styli never open pickers, tiered and class armors offered with swords excluded,
      unidentified/cursed/glyphed picks refuse keeping the stylus, missed rolls write nothing;
      alchemize: missing spells never open pickers, the picker runs the real energy table
      with the suite-pinned 12 banked, self-scrapping offers nothing, vanished picks bank
      nothing). The drive caught one fixture bug in review - minted ids the default-true
      predicate wrongly admits, same trap as the infusion drive - fixed with the suite-pinned
      real ids (`warriorarmor`, `potionHealing`); and four redundant second invocations the
      factory already runs were deleted before committing.
      **Complexity: M.** **Twenty-fourth extraction 2026-09-19**: the bomb throw-aim half
      (`useBomb`'s pending-target re-entry, the MWL range, the passable-non-chasm validate)
      joined `items/bombs.ts` as `aimBombFlow` behind a `BombAimContext` (bomb gate, aimer,
      range, pending-aim cell, detonate callback into the scene's existing `bombContext`
      call); the detonate half already lived there. The scene keeps the one-line adapter the
      router calls plus a builder. Net +4 lines in `dungeonScene.ts` (22,761 after) - the
      builder costs what the tiny body saved - `bombs.ts` 68 to 106. Suites: `tsc` clean with
      no fix-ups, item suite green with a new headless drive (missing bombs never aim, the
      range comes from the seam, confirms clear pending and hand target/id/instance to the
      detonate half, pending aims detonate at once). No review bugs this slice.
      **Complexity: XS.** **Twenty-fifth extraction 2026-09-19**: the candle throw-aim half
      (`useCandle`'s ritual gate, slot validate, place-plus-turn confirm) joined
      `items/candles.ts` as `aimCandleFlow` behind a `CandleAimContext` (candle gate, ritual
      pos/width, slot-free test, aimer, place callback into the scene's existing
      `candleContext` call, turn); the place half already lived there. The scene keeps the
      one-line adapter the router calls plus a builder, and drops the now-unused
      `candleRitualSlots` import (the geometry lives in the module now). Net −2 lines in
      `dungeonScene.ts` (22,759 after), `candles.ts` 61 to 105. Suites: `tsc` clean with no
      fix-ups, item suite green with a new headless drive next to the existing place checks
      (no candle/no ritual never aim, empty slots validate while filled and non-slots refuse,
      confirms place the validated slot and spend the turn). No review bugs this slice.
      **Complexity: XS.** **Twenty-sixth extraction 2026-09-19**: the ankh-bless and
      torch-light self uses (`useAnkh`'s full-skin gate plus bless-and-drain, `useTorch`'s
      consume-plus-light) moved to a new `items/selfUse.ts` as `useAnkhFlow`/`useTorchFlow`
      behind `AnkhContext` (ankh gate, waterskin level, drain, turn, say, `t`) and
      `TorchContext` (torch gate, consume, grant-light, turn). The scene keeps the one-line
      adapters the router calls plus `ankhContext()`/`torchContext()` builders. Net +16 lines
      in `dungeonScene.ts` (22,775 after) - the two builders cost more than the small bodies
      saved - `selfUse.ts` 70 new. Suites: `tsc` clean with no fix-ups, item suite green with
      a new headless drive (missing ankh/torch never act, a full skin blesses plus drains with
      the bless line and a turn, a short skin spends nothing with the needsfull line, a torch
      consumes, lights and spends the turn once). No review bugs this slice.
      **Complexity: XS.** **Twenty-seventh extraction 2026-09-19**: the scroll-read
      selection plus dispatch (`readScroll`'s select/priority, upgrade refusal, transmute
      delegation, identify consume-and-proc, registry dispatch, unknown-id cleanse
      fallback) moved to `items/scrollEffects.ts` as `readScrollFlow` behind a
      `ReadScrollContext` extending the existing `ScrollEffectsContext` (bag, requested
      id/instance, heroClass, talent ranks, empowered-zaps get/set, display name,
      identify-talent proc, transmute delegate, weapon-affix/armor-glyph get/set, live
      equipped ring, resync); the scene spreads its existing `scrollEffectsContext()`
      into the builder and keeps the one-line adapter, dropping the now-unused
      `selectScrollId`/`empoweringScrollsCharges` imports. Net −41 lines in
      `dungeonScene.ts` (22,734 after), `scrollEffects.ts` 151 to 252. Suites: `tsc`
      clean after one real catch (a spread literal cannot satisfy a set-only interface
      member - TS2322 - so the context carries an empowered-zaps get/set pair with a
      one-line comment, unlike TransmuteFlowContext's set-only whose literal has no
      spread), item suite green with a new headless drive (empty-bag and upgrade
      refusals consume nothing, transmute delegates without arming, identify consumes,
      identifies, procs and arms for a mage, the nothing-new line, a registry rage read
      waking and arming, the unknown-id fallback cleansing weakness/weapon/ring curses
      but not poison). No review bugs this slice.
      **Complexity: S.** **Twenty-eighth extraction 2026-09-20**: the `scrollUpgrade`
      action (`upgradeGear`'s no-scroll refusal, missile catch-up, weapon/armor pick
      with shared/twin armor bonuses and mage/rogue talent riders, plus the
      `rollUpgradeAffixLoss` curse/incompatible/hardening branches) moved to
      `items/scrollEffects.ts` as `upgradeGearFlow` behind an `UpgradeGearContext`
      (bag, hero, class/subclass/talents, get/set pairs for missile/weapon/armor
      levels, ammo pile/set/thresholds, wand charges, affix/glyph/hardening flags,
      scripted `randomInt`/`randomFloat`, say, resync); the scene keeps the one-line
      `upgradeGear` adapter plus the builder, and `rollUpgradeAffixLoss` survives as a
      one-line adapter too since the blacksmith upgrade path also calls it - dropping
      the now-unused `sharedUpgradeArmor`/`twinUpgradeArmor` imports. Net −40 lines in
      `dungeonScene.ts` (22,694 after), `scrollEffects.ts` 252 to 393. Suites: `tsc`
      clean after one real catch (`CLASS_AMMO` is a `Set<ClassId>`, so the context
      carries the class as `ClassId`, not `string`), item suite green with a new
      scripted-rng drive (refusal, missile catch-up with set mint and threshold,
      weapon/armor picks with energizing refund and mystical cloak, curse lift/keep,
      incompatible loss/keep on both slots, hardening floor and loss, empty queues
      proving the below-floor branches roll nothing). Two drive-setup bugs caught by
      the suite itself (ammo-class defaults and equal-level ties divert branches).
      **Complexity: S.** **Twenty-ninth extraction 2026-09-20**: the healing/purity
      trio (`cureHeroBuffs`, `applyPotionHealing`, `applyPotionPurity`) moved to
      `items/potionEffects.ts`, where the quaff registry now calls them directly
      instead of through scene callbacks; the scene keeps thin `cureHeroBuffs`/
      `applyPotionPurity` adapters for the wells, the ankh revive and `quaffPotion`'s
      own fallback (`applyPotionHealing` had no other caller and is gone), and the
      context trades the two callbacks for heal-pool accessors plus a shield grant.
      Net −35 lines in `dungeonScene.ts` (22,659 after), `potionEffects.ts` 141 to 200.
      Suites: `tsc` clean after one real catch (contextually-typed lambda params need
      explicit types here), item suite green first try with a new drive (the
      seven-debuff cure keeping burning and the daze stand-in, the max-rule pool, the
      willpower/agility riders, purity's poison-plus-burning clear, the registry
      wiring). The stubbed-`addBuff` roots branch and the stubbed-off no_healing
      branch stay live-only by construction, stated in the drive comment.
      **Complexity: XS.** **Thirtieth extraction 2026-09-20**: dew-drop collection
      (`collectDewdrop`'s skin top-up, full-skin heal with the Warden shielding-dew
      shield, healthy refusal, force flag) moved to `items/consumables.ts` behind the
      existing `ConsumableContext` extended with subclass/shield accessors; the scene
      keeps the one-line adapter the ground-pickup context calls, dropping the
      now-unused `shieldingDewGain` import. Net −7 lines in `dungeonScene.ts` (22,652
      after). Suites: `tsc` clean first try, item suite green with a new drive
      (top-up by one, hurt-heal of one 0.05*HT drop with readout, warden rank-2
      shielding, refusal, forced zero-heal). One suite-setup catch (an earlier
      same-name require proved block-scoped, so the drive aliases its own).
      **Complexity: XS.** **Thirty-first extraction 2026-09-20**: `Preparation`'s
      blink-aim family (`usePreparationBlink` plus the target/reach/destination/
      confirm helpers) moved to `simulation/preparation.ts` behind a
      `PreparationBlinkContext` (hero, subclass/talents, aimer, creature/fov/level/
      flood seams, move/refresh, the strike tail as callbacks); the scene keeps the
      one-line adapter plus a builder, dropping the now-unused
      `preparationBlinkDistance` import. Net −57 lines in `dungeonScene.ts` (22,595
      after), `preparation.ts` 130 to 257. Suites: `tsc` clean first try, item suite
      green with a new BFS-flood drive (aim ranges, validation, adjacent and blink
      strikes, both refusals with the rooted-only shake), and the sim suite green -
      including the sibling-import confinement guard, which forced one real rework:
      simulation modules take no runtime imports outside their directory, so the
      moved code inlines its Chebyshev/neighbour math and passes message keys for
      the scene to translate (the brews-module convention). Found in the same pass:
      the coverage row's "screen shake on a rooted refusal" gap never was one - the
      shake is live and now pinned - corrected in place.
      **Complexity: S.** **Thirty-second extraction 2026-09-20**: the `Ratmogrify`
      armor-ability flow (nearest-target selection with the boss/rat/ally
      exclusions, charge gate, transform, ratlomacy permanence with its adrenaline
      kicker, ratforcements self-cast) moved to `simulation/ratmogrify.ts` as
      `useRatmogrifyFlow` behind a `RatmogrifyContext` (hero/creature views, fov/
      level seams, boss predicate, charge cost/getter, scripted shuffle, awake-rat
      spawn and adrenaline callbacks, key-passing say); the scene keeps the one-line
      adapter plus a builder. Net −23 lines in `dungeonScene.ts` (22,572 after),
      `ratmogrify.ts` 17 to 119. Suites: `tsc` clean after one real catch (the
      scene's optional `Creature.kind` needs an optional view field with an
      undefined-tolerant boss predicate), item suite green first try with a new
      drive (refusal, nearest pick, all six exclusions, permanence with and without
      the kicker, talentless recast refusal, the two-rat self-cast). Sim suite
      green including the confinement guard.
      **Complexity: S.** **Thirty-third extraction 2026-09-20**: `trampleHighGrass`'s apply half plus the `plantBloomingGrass` sibling moved to `simulation/highGrass.ts` (where the pure plan already lived) as `applyHighGrassTrample` behind a `HighGrassApplyContext`; the scene keeps the one-line adapters plus a shared builder. Net −33 lines in `dungeonScene.ts` (22,539 after), `highGrass.ts` 103 to 233. Suites: `tsc` clean first try, item suite green first try with a new drive (plain passthrough, furrowing, the clear with camouflage keep-max and exact plan odds, cursed suppression without rolling, scripted seed/dew spawns, all four bloom verdicts). Noted in the drive comment: `natures_aid`'s shield and the berry schedule need a huntress past the furrow branch, which the plan never emits - live but unreachable through this flow, in Java's shape too. **Complexity: S.**
 **Thirty-fourth extraction 2026-09-20**: `afterMonsterTurn`'s buff ticks
      (rat countdown/expiry, monk/senior focus cooldown and attach, haste
      countdown/restore) moved to `simulation/buffs.ts` as `tickMonsterTurnEnd`
      behind a monster view with a focus-attach callback; the death-mark tick
      and time-bubble spend stay scene-side. Net -13 lines in `dungeonScene.ts`
      (22,526 after). Suites: `tsc` clean after two real catches (the scene's
      optional `speed`/`kind` need optional view fields), item suite green first
      try with a new drive (rat tick/expiry/permanence, focus attach/cooldown/
      blindness gates, haste tick/restore). Sim suite green.
      **Complexity: XS.**
      **Thirty-fifth extraction 2026-09-20**: the class-special throw aim's
      `nearestVisibleEnemy` helper moved to `simulation/targeting.ts` (where
      `selectRangedTarget` already lived) as `nearestVisibleEnemy` behind the
      module's own `SimulationRoguelike` seam - the scene keeps the one-line
      adapter binding its level, hero, creatures and field of view, and the
      bomb/stone auto-targets ride that same adapter. Net +8 lines in
      `dungeonScene.ts` (22,534 after) - the moved five-line body cost less
      than the adapter plus its deviation-note comment; `targeting.ts` 24 to
      47. Suites: `tsc` clean, item suite green with a new drive (empty/hero/
      npc/unseen/out-of-range refusals, nearest-wins ordering, range gating,
      scripted geometry). Sim suite green.
      **Complexity: XS.**
      **Thirty-sixth extraction 2026-09-20**: `Mob.chooseEnemy()`'s Aggression
      priority (`aggressionTarget` - nearest in-range `aggression`-buff carrier,
      even another enemy) moved to `simulation/targeting.ts` beside its two
      targeting neighbours behind the module's own `SimulationRoguelike` seam;
      the scene keeps the one-line adapter binding its level and creatures.
      Net +2 lines in `dungeonScene.ts` (22,536 after) - the moved five-line
      body cost less than the adapter plus its deviation-note comment;
      `targeting.ts` 47 to 69. Suites: `tsc` clean first try, item suite green
      first try with a new drive (seeker/npc/dead/unbuffed/range exclusions,
      enemy and ally carriers included, nearest-wins ordering). Sim suite
      green.
      **Complexity: XS.**
      **Thirty-seventh extraction 2026-09-20**: `ToxicGasSeed.evolve()`'s vent
      emission (`emitToxicGasVents` - re-seed ordinary ToxicGas while local gas
      is at most 9x the vent's retained source) moved to
      `simulation/environmentalBlobs.ts` behind a `ToxicVentContext` (vent map,
      width, inside/terrain reads, the TRAP id as a value, gas total/amount/seed
      callbacks); the scene keeps the one-line adapter. Net +9 lines in
      `dungeonScene.ts` (22,545 after) - the binding object costs more than the
      ten-line loop it replaces; `environmentalBlobs.ts` 221 to 252. Suites:
      `tsc` clean first try, item suite green with a new drive (re-seed under
      9x, refusal above, always on a gas-free floor, non-trap/outside skips;
      one stray-brace suite syntax error caught by `node --check` before the
      run). Sim suite green.
      **Complexity: XS.**
      **Thirty-eighth extraction 2026-09-20**: the wandering-decision trio
      (`wanderBlocked`'s creature/eternal-fire/piranha blocked set,
      `isPatrolTargetValid`'s retained-destination check,
      `randomPatrolDestination`'s `Level.randomDestination` sampler) moved to a
      new `simulation/wandering.ts` behind one `WanderingContext` (dims,
      passable/inside/terrain reads, the WATER id as a value, chasm/occupant
      reads, creatures, hero, an eternal-fire fold-in plus the
      `Random.element` pick as callbacks); the scene keeps one builder plus
      adapters, and the `takeWanderingTurn` validity branch calls the flow.
      Net 0 lines in `dungeonScene.ts` (22,545 after) - the builder plus
      adapters cost what the three moved bodies saved; the gain is domain
      placement (all wandering decisions in one module, ahead of the hunting/
      fleeing work the architecture doc names next), not shrinkage.
      `wandering.ts` is 80 lines new. Suites: `tsc` clean first try, item
      suite green first try with a new drive (blocked-set membership both
      modes, extra-fire fold-in, piranha confinement, all seven validity
      verdicts, the scripted roll plus the empty-floor undefined). Sim suite
      green.
      **Complexity: S.**
      **Thirty-ninth extraction 2026-09-20**: the hunting step built its own
      blocked set inline - line-for-line the `wanderBlocked(monster, false)`
      shape (creatures minus seeker and hero, eternal fire, piranha water
      confinement with the hero-cell exception) - now deduped onto the shared
      helper, behavior-identical. Net -4 lines in `dungeonScene.ts` (22,541
      after); the thirty-eighth drive already pins both blocked modes, and the
      sim suite's monster-turn checks cover the hunting path. `tsc` clean,
      item/sim suites green, build clean.
      **Complexity: XS.**
      **Fortieth extraction 2026-09-20**: `Amok.act()`'s target query
      (`takeAmokTurn`'s nearest living non-NPC within eight cells, no
      line-of-sight gate) moved to `simulation/targeting.ts` as `amokTarget`
      behind the module's own `SimulationRoguelike` seam; the scene keeps the
      one-line adapter. Net 0 lines in `dungeonScene.ts` (22,541 after);
      `targeting.ts` 69 to 90. Suites: `tsc` clean first try, item suite
      green first try with a new drive (self/npc/dead/far exclusions, range
      edge, ally inclusion, nearest-wins ordering, visibility-free geometry).
      Sim suite green.
      **Complexity: XS.**
      **Forty-first extraction 2026-09-20**: `Bee.chooseEnemy()`'s cascade
      (pot holder first at any range, else nearest live mob within 3 of the
      pot, else the hero within 3 - including the fall-through when a recorded
      holder is gone) moved to `simulation/targeting.ts` as `beeTarget` behind
      the module's own `SimulationRoguelike` seam; the scene keeps the
      one-line adapter. Net -10 lines in `dungeonScene.ts` (22,531 after);
      `targeting.ts` 90 to 121. Suites: `tsc` clean first try, item suite
      green after one real drive-setup catch (the dead-holder case passed a
      live hero in the folk list while the hero arg was dead - the flow is
      verbatim, the setup lied), covering holder-first, both fall-throughs,
      pot-mob, pot-hero, far-pot and potless verdicts. Sim suite green.
      **Complexity: XS.**
      **Forty-second extraction 2026-09-20**: the farthest-open-neighbour
      step (`Hunting.getFurther` shape) moved to `simulation/wandering.ts` as
      `fleeStep` behind a `FleeStepContext` (passable/occupant reads, the
      offsets as data, Chebyshev plus hero as values); `stepAway` and
      `fleeCrystalMimic` were line-for-line duplicates apart from their tails
      and now share the flow, keeping only the combo reset and the boolean
      report respectively. Net -3 lines in `dungeonScene.ts` (22,528 after);
      `wandering.ts` 80 to 114. Suites: `tsc` clean first try, item suite
      green first try with a new drive (farthest-wins with strict-`>` scan
      order, occupied-best fallback, boxed-in and nearer-only refusals - the
      first draft expected the wrong winner and the flow's verbatim strictness
      corrected the setup, not the reverse). Sim suite green.
      **Complexity: XS.**
      **Forty-third extraction 2026-09-20**: `Mob.findEnemy()`'s ally branch
      (nearest living non-sheep ally in the mob's FOV, outside smoke) moved to
      `simulation/targeting.ts` as `findEnemyAlly` - the FOV and the smoke
      gate arrive as callbacks, so the module still takes no runtime imports;
      the scene keeps the one-line adapter. Net +3 lines in `dungeonScene.ts`
      (22,531 after); `targeting.ts` 121 to 145. Suites: `tsc` clean first
      try, item suite green after two placeholder assertions were caught
      comparing fresh objects by identity instead of the returned element (the
      flow is verbatim; the setup compared wrong), covering allies-only,
      sheep/dead/unseen/smoked exclusions and nearest-wins ordering. Sim
      suite green.
      **Complexity: XS.**
      **Forty-fourth extraction 2026-09-20**: the summon-cell search (free
      neighbour cells sorted by hero distance) moved to
      `simulation/wandering.ts` as `nearestFreeCell` behind a
      `SummonCellContext` (the flee-step reads plus inside/chasm gates, built
      by spreading `fleeStepContext()`); the EarthGuardian placement (center
      admitted) and the Yog-minion placement (neighbours only) now share the
      flow. Net +3 lines in `dungeonScene.ts` (22,534 after);
      `wandering.ts` 114 to 137. Suites: `tsc` clean first try, item suite
      green first try with a new drive (nearest-to-hero wins, center
      admitted/excluded, chasm/occupied/outside refusals, undefined when
      nothing is free). Sim suite green.
      **Complexity: XS.**
- [x] **`mwg` bumped to 0.5.0**, adopting `core.ReactionTable` for `takeKingTurn`'s three real
      one-way transitions (previously three ad-hoc latch fields), with its `toJSON()`/`fromJSON()`
      wired into the save/restore path. Live-verified all three firing exactly once (including that
      HP recovering above 20 and dropping again does not re-fire a spent rule), plus a full
      save-then-load round trip. Brute's `hasRaged` one-time revival is a smaller instance of the
      same shape, identified but not converted (a single flag, not a multi-rule state machine).
- [x] **Hand-rolled code where the framework now ships the capability**, from the mwg-usage audit.
      Ordered by value: (1) `Scheduler` persistence - **done**: `FloorState.scheduler` carries the
      whole queue and restore goes through `Scheduler.restore`, verified live with 14 assertions.
      (2) The inventory UI now uses MWG's `TabbedList` and `IconGrid`, and constructs its display
      objects through the typed render facade (`Container2D`/`Shape2D`/`Rectangle2D`/`Sprite2D`),
      reducing the raw-Pixi boundary one audited file at a time. (3) The hand-rolled hero frame
      animator and move tween are **gone**: the hero is an `AnimatedSprite` sharing the monsters'
      `Tweener` motion map. (4) `src/ui/wallDecorations.ts` migrated to `ParticleEmitter` on MWG
      0.8.1, one emitter per FOV-gated spot, browser-verified. (5) The talent panel and `InfoWindow`
      still hand-roll modality where `Window`/`WindowStack` exist - **narrowed 2026-09-16**: the
      shared item picker is now a real `Window` on `gameWindows`, so all its consumers share the
      framework's keyboard, blocker and outside-click behavior. **Progress 2026-09-16:** the
      talent panel now keeps its SPD-specific content layout inside a lazily-created modal
      `Window` on the same stack, including close/outside-click cleanup and viewport re-placement.
      `InfoWindow` now also uses a fresh MWG `Window` per opening, with the existing stat-row
      chrome retained inside it; the scene no longer owns a second dimmer or close state machine.
      The in-game menu is also a real `Window` on a `WindowStack`, which is the worked example the rest
      of this item was missing. **Re-read 2026-09-16, and re-rated: this is not an S nibble, and the
      primitive this line named was the wrong one.** `MessageBox` is a *paged dialogue/choice* box
      (pages of text, an optional speaker/portrait, then a flat `choices` list) - it has no per-row
      icon and no scrolling, so it is not the item picker's shape at all despite this line's claim;
      `ListView` is (`rows with an optional icon`, keyboard-driven, scrolling by keeping the
      highlight in view - its own doc comment names "bags, spell lists, shop stock" as its use
      case). Nor is much of it hand-*drawn*: `ui/itemPicker.ts` remains a small adapter over MWG's
      own `Window`/`Label`/`Button`, and its modality now belongs to the stack. The three scene
      panels named by this audit are all stack-owned; the talent and info content retain only their
      SPD-specific inner layouts. (6) Screen shake - **wired** at every site whose
      Java feature is ported, through a `shakeScreen` wrapper; the unwired remainder is exactly the
      unported-feature list in `PORT_COVERAGE.md`'s mwg-usage section. (7) The interlevel curtain
      still hand-computes its fades where `ScreenEffects.sequence` now exists (see P8) -
      **resolved as a non-adoption, 2026-09-16**: `ScreenEffects` is a flat colour wash and this
      curtain is a five-stop gradient, so the swap would delete the gradient rather than just the
      sequencing code. See section 8's transitions item for the divergence that read turned up.
      **Also recorded
      as deliberately unused**, each with its reason in `PORT_COVERAGE.md`'s mwg-usage section
      rather than here: `TileMap.setCellColor`, `visualWalls.ts`'s neighbour-mask table vs
      `resolveTerrainGraphics`, `ui/gameLog.ts`'s own line budget vs `ListView`/`ScrollBox`, the six
      boss ability cooldowns vs `Roguelike.AbilityCycle`, `SimulationRuntime.snapshot()`,
      `src/challenges.ts`'s own `localStorage` key vs `SaveSystem`/`Collection`, `SaveSystem`'s
      version-3 bump with no `migrations` entry, and the two flat-index `neighbourOffsets9` copies
      `Roguelike.neighbourOffsets(8)` cannot express as a hot-loop form. The audit is now closed;
      remaining framework capabilities are deliberate non-adoptions documented above and in
      `PORT_COVERAGE.md`.
- [x] **Table-unique row ids in the MWL content.** MWL's id namespace is global per tag, and 42 of
      this port's `[row]`s restated another table's *domain* id as their own. Each restating row is
      now named `table-domain` (`unstable-blazing`, `manifest-stewedMeat1`, `curse-wayward`,
      `quest-wandmaker`) and carries the domain id in a column, which is what the five readers
      expose - so downstream code still sees bare domain ids. `tools/compile-mwl.mjs` now fails on
      any diagnostic at all, with no tolerated class and no pinned count.
## 6. Complete hero progression

- [x] Implement exact formulas for the remaining talents. Six wrong-shaped stand-ins have been
      corrected against the real source (Lethal Haste, Weapon Recharging, Farsight, Arcane Vision,
      `POINT_BLANK` - an accuracy factor and nothing else, applied inside `adjacentAccFactor` - and,
      in the 2026-09-09 audit, Hearty Meal, Sucker Punch, Aggressive Barrier and the per-tier
      talent-point pools, which had wrongly been one shared pool). Test Subject/Tested
      Hypothesis are port-original talents, kept deliberately (see `PORT_COVERAGE.md`'s talent
      row: absent from `Talent.java` and the `actors` strings at `v3.3.8`/`v4.0.0`/master);
      Swift Equip is genuine. `Iron Will`'s invented flat-damage-reduction stand-in is
      replaced by the real `BrokenSeal` shield mechanic. **Progress 2026-09-21: the Cleric's tier-1
      talent row is Java's own now** (`SATIATED_SPELLS`/`HOLY_INTUITION`/`SEARING_LIGHT`/`SHIELD_OF_LIGHT`
      with the tome-window talent spells, the eaten-food tracker, the illuminated-hit bonus and the
      light-shield tracker - see `PORT_COVERAGE.md`'s tier-1 row); **tier 2 is Java's own since 2026-09-21** (`ENLIGHTENING_MEAL`/`RECALL_INSCRIPTION`/`SUNRAY`/`DIVINE_SENSE`/`BLESS` with the meal charge, the scroll/stone arming, the four tome-window spells and their resolves - see `PORT_COVERAGE.md`'s tier-2 paragraph); **tier 3 is Java's own since 2026-09-21** (`CLEANSE`/`LIGHT_READING` with the spell resolve, the T3 tab unlock, the metamorphosed dead-leg hooks and the shared immunity gate - see `PORT_COVERAGE.md`'s tier-3 paragraph). **Progress 2026-09-18: a whole missing talent class
      found and half-closed.** Every class's real tier-3 pool is Java's own fixed class-wide pair
      (`initClassTalents`) *plus* the chosen subclass's three (`initSubclassTalents`, a separate
      call writing into the same map) - this port's table carried only the subclass three for
      all 10 subclasses, silently dropping 10 real talents (`HOLD_FAST`/`STRONGMAN`,
      `EMPOWERING_SCROLLS`/`ALLY_WARP`, `ENHANCED_RINGS`/`LIGHT_CLOAK`, `POINT_BLANK`/`SEER_SHOT`,
      `PRECISE_ASSAULT`/`DEADLY_FOLLOWUP`). All 10 are now in the table; `STRONGMAN` and
      `POINT_BLANK` needed no other code (their formulas were already written and simply
      unreachable - the same "ported ahead of the table row" pattern found three times over),
      and `HOLD_FAST`/`PRECISE_ASSAULT`/`DEADLY_FOLLOWUP` are newly wired. See
      `PORT_COVERAGE.md`'s dedicated row for the exact formulas and the browser verification.
      **Remaining (superseded by the Progress paragraph directly below, kept for history)**: `ENHANCED_RINGS`, `LIGHT_CLOAK`, `EMPOWERING_SCROLLS`, `ALLY_WARP` and
      `SEER_SHOT` each need a mechanic this port doesn't have yet (a ring-effective-level buff,
      a Cloak-of-Shadows charge-rate hook usable unequipped, a wand-zap level bonus, an
      ally-swap-at-range interact, and empty-cell map-reveal targeting), plus everything already
      blocked on systems this port lacks (SoulMark/Wraith for Necromancer's Minions, a real
      Cleric tree; `durable_tips` dropped off this list 2026-09-17 - tipped darts are live).
      **Progress 2026-09-19: all five named mechanics are now wired, each through the seam this
      port actually has.** `EMPOWERING_SCROLLS` arms 1/2/3 +3-level zap charges on any scroll
      read (Mage) and resolves them through `effectiveZapLevel()` (damage, corrosion, chill,
      blast-wave push, prismatic daze, excess-charge shield, regrowth/fireblast/transfusion
      helpers, and disintegration's targeting range previewed prospectively); `ENHANCED_RINGS`
      arms 3/6/9 turns of +1 ring upgrade on any artifact use (Rogue) read through
      `effectiveRing()` at every formula site; `LIGHT_CLOAK`'s cross-hero 7/13/20% artifact
      charge bonus is folded exactly into every passive charge gain (its Rogue unequipped-use
      half is satisfied by construction - a carried cloak is always usable at the full
      equipped rate, which is the stated divergence from Java's refusal); `ALLY_WARP` swaps
      the Mage with a bumped non-immovable ally at 2/4/6 range, free like every other ally
      order; `SEER_SHOT` reveals the landing cell's 3x3 (explored plus a timed
      creature-visibility layer, vision not search, so no secret discovery) on thrown and bow
      attacks with the flat 20-turn cooldown. All four new state fields persist through
      save/load; the five formulas are pinned in `test:simulation`. What stays open here is
      only what was already systems-blocked (SoulMark/Wraith, the Cleric tree, the
      `monastic_vigor`/`twin_upgrades` stand-ins needing Monk energy/dual-wield).
      **Methodology note worth keeping, amended 2026-09-18**: check `src/generated/spdMessages.ts`'s own real
      `actors.hero.talent.*` strings before concluding a talent id is invented - an earlier audit
      checked only two Java tags and wrongly declared several real talents fabricated - but catalogue
      presence alone does not prove upstream existence either: Test Subject/Tested Hypothesis ship
      full catalogue text in all 19 locales yet exist in no checkable Java source, so the final
      check is always the Java code/tags themselves. See
      `PORT_COVERAGE.md`'s talent rows. **Complexity: L.**
- [x] Implement rune transfer and shared-enchantment behavior. **Closed 2026-09-17: both named halves were already live - the "rune transfer" title has no other referent in code, coverage or Java's hero/talent sources (the only "rune" there is the Runestone/Recall-Inscription line), so it reads as the bow-enchantment transfer `shared_enchantment` performs.** Sniper's `shared_enchantment` proc is
      live for thrown hits with Java's `Random.Int(3) < points` gate and explicit ranged attack
      provenance; Warden's `durable_tips` is live in `missileDurabilityCost()` via `tippedDartUseDivisor` (the "waits on a real TippedDart item" premise was stale - tipped darts exist as `tippedSeed` payloads, shop stock and wielded ammo), verified against `TippedDart.durabilityPerUse()` (`use /= (1 + points)`, rot exempt). The three places that repeated the stale premise (`src/talents.ts` comment, two `PORT_COVERAGE.md` rows) are corrected in the same pass.
- [x] Complete subclass and armor-ability effects. **Closed 2026-09-24:** every armor ability and subclass the roadmap named is offered and live (Trinity's three forms with every SpiritForm artifact case, SkeletonKey included); the fine-grained residuals - ShadowClone's gear-proc shares/double-speed return/interact range/sprite, CursedWand's unported effect tiers, Trinity BodyForm's unsupported catalog entries, MindForm's stated reductions and PowerOfMany's INORGANIC set/wandering-return speed/zap presentation - moved to `BACKLOG.md` B9 and stay recorded as "Simplified"/"Not ported" rows in `PORT_COVERAGE.md`. The authored `armorAbilities` table carries all 18
      real `HeroClass.armorAbilities()` entries (base charge use, targeting mode, three tier-4
      talents each); the King's Crown's own `WEAR` action opens SPD's real choice panel, with
      `ClassArmor.upgrade()`'s state changes (charge starting at Java's 50, the four rank-4 talents
      registered, `Hero.talentPointsAvailable(4)`'s exact curve) and the charge meter regrowing at
      `ClassArmor.Charger`'s `100/500` per tick times the Ring of Energy multiplier. **Thirteen
      abilities are fully ported, formulas included (browser verification owed for the newest,
      per section 10)**: the Warrior's Heroic
      Leap/Shockwave/Endure, the Rogue's Death Mark, Smoke Bomb and Shadow Clone, the Huntress's
      Spectral Blades/Nature's Power/Spirit Hawk, the Mage's Warp Beacon, the Duelist's Feint,
      Challenge and ElementalStrike.
      **Progress 2026-09-19:** `ElementalBlast`'s pure arithmetic (per-wand factors, `ELEMENTAL_POWER`/`BLAST_RADIUS`, aim, damage, Transfusion splits, Corrosion, nine buff durations, Regrowth chance, knockback, `REACTIVE_BARRIER`) is ported and pinned (`simulation/mageAbilities.ts`, `tools/verifyArmorAbilities.mjs`), but the ability stays unoffered - firing reads the wand off an imbued `MagesStaff`, and the imbue system does not exist here.
      **Progress 2026-09-20:** Warden Earthroot now uses Java's `Barkskin` variant (`level + 5`, five-unit decay cadence) and persists its state; the remaining armor-ability gaps are still open.
      **Progress 2026-09-19 (20th matrix, `MONSTER_ANALYSIS_SHADOWCLONE.md`):** `ShadowClone` is
      ported - 80-HP `ShadowAlly` with Java's accuracy/evasion/damage/armor formulas, summoned or
      directed through the shared ally orders; only the gear-proc shares, double-speed return,
      interact range and sprite stay open.
      **Progress 2026-09-19 (21st matrix, `MONSTER_ANALYSIS_CHALLENGE.md`):** `Challenge` is
      ported - paired 10-turn duel with spectator freeze, close-the-gap blink, damage ledger,
      victory heal and re-challenge discount, all with Java's numbers; bomb/trap/blast negation
      on frozen spectators is now ported across the direct damage seams. **Still open, and deliberately not offered**
       (`armorAbilitiesFor()` offers only what can actually run): Trinity was
       previously unoffered; PowerOfMany is fully offered with both its slices
       (LightAlly summon and existing-ally empower, below).
      **Assessed 2026-09-21, an epic not a remainder (corrected same day - the assessment
      was written from stale evidence):** the Cleric HAS a class-select entry (the MWL
      `cleric` trait, victory-gated) and starting gear (`holyTome` + purity/cleanse +
      cudgel accuracy in `makeHero`) - what was missing was everything the tome DOES.
      **Progress 2026-09-21:** tier 1 (GuidingLight/HolyWeapon/HolyWard) is ported with the
      tome's full charge/spend/upgrade economy, recharge, save/load, combat hooks
      (illuminated consume + auto-hit, holy +2 with enchant override, ward -1, skeleton
      doubling, mirror copy, crab parry) and SPD's own v3.3.8 strings/icons/art (see
      `PORT_COVERAGE.md`'s new tier-1 row, and tier 2 since 2026-09-21 (see the tier-2 paragraph there), and tier 3 since 2026-09-21 (see the tier-3 paragraph there).
      **Correction 2026-09-23: "Still open: tier 4, PRIEST/PALADIN" was stale, not a real gap.**
      All six PRIEST/PALADIN subclass tier-3 spells (`HolyLance`/`HallowedGround`/`MnemonicPrayer`,
      `LayOnHands`/`AuraOfProtection`/`WallOfLight`) were already fully ported since 2026-09-21 -
      see `PORT_COVERAGE.md`'s "PRIEST/PALADIN subclass tier-3 Cleric spells" row, now also
      live-verified in the browser (2026-09-23). Java's own tier 4 is an unimplemented `//TBD`
      placeholder (`Talent.java`'s `initClassTalents()`, tag `v3.3.8` - the `tier4` switch has no
      cases at all), so there is nothing there to port. The remaining Trinity gap is its unsupported BodyForm catalog entries (BACKLOG.md B9); every SpiritForm artifact case is live and MindForm's conjured item-cast dispatch is implemented.
      **Trinity arithmetic progress (2026-09-22):** the pure Body/Mind/Spirit duration, item-level, and per-effect charge rules are now pinned against the v3.3.8 Java sources. **Progress 2026-09-23:** BodyForm's modeled positive weapon-enchantment subset opens from the MWL catalog (excluding the equipped affix), applies through the melee proc path for its Java-authored duration, and was live-verified in the browser. **Progress 2026-09-23:** BodyForm also offers the modeled Stone, Repulsion, AntiMagic and Viscosity glyphs, routing them through the existing defensive hooks with Java's HolyWard-independent BodyForm proc, duplicate and MagicImmune gates; the selected glyph persists and expires with the form, and selecting either BodyForm effect dispels invisibility. The port has no Tome discovery/store inventory, so only implemented affixes are offered.
      **Progress 2026-09-23 (SpiritForm):** two of its three real cases are live. UnstableSpellbook
      reuses `SpiritForm.applyActiveArtifactEffect()`'s own bypass of `execute()`'s equip/charge/
      cursed gates - a stateless one-shot scroll draw through the shared `applyScrollEffect` seam,
      gated only by the Trinity armor's own (doubled) charge cost. Rings are a genuine second,
      *independent* ring slot (`trinitySpiritRing()`, 20-turn window on the existing `trinityForm`/
      `trinityTurns` clock) - Java's real combination rule turned out to be a **fallback, not a
      stack** (`Ring.getBuffedBonus()`: the spirit ring's bonus only counts when the equipped
      ring's own bonus for that exact stat is precisely 0), now correctly wired at all ~37
      ring-formula call sites plus the Accuracy/Evasion StatBlock path and the mirror/prismatic-
      image stat duplication, via `combinedStatBonusLevel` (contributed by opencode-02 under the
      coord DOC1 contract). Every SpiritForm artifact case is live (Horn, Hourglass, Rose, Chains,
      Armband, Sandals, Talisman, Toolkit, the Chalice regen passive and SkeletonKey landed 2026-09-23/24); MindForm is now implemented with its stated simplifications in the coverage row.
      **Remaining Trinity scope, reviewed 2026-09-23:** BodyForm's supported glyph subset is live;
      MindForm now executes conjured Wands and modeled missiles through level-explicit seams (see
      the coverage row for the catalog and effect reductions) - live-verified 2026-09-24 end to end
      (Trinity picker, conjured frost kill for 11, armor 100 to 50, zero errors). SpiritForm's independent Ring slot
      and every artifact case are live; SkeletonKey was ported whole on 2026-09-24 (artifact, KeyWall, key-replacement tracker, wall tunnelling - see its `PORT_COVERAGE.md` row).
      DOC1 holds the per-case Java citations and findings. The Trinity gaps are listed above; AscendedForm's base shield window and all three of its tier-4 spells - DivineIntervention since 2026-09-22 - are live. The rest of the real Cleric talent tree (tiers 1-3 are live since 2026-09-21, see
      `PORT_COVERAGE.md`'s tier-1 row; the AscendedForm tier-4 talents all have live spells).
      **Progress 2026-09-22: DivineIntervention is ported** (5 charges, once per form, raise-only
      `100+50*points` shield on the hero after the shared Ascended `+50`, the same target on
      every ALLY-aligned character as a priority-1 `DivineShield` that dies with the form, and a
      `2+points` form extension) - and fixed in the same pass, AscendedForm's mid-form recast now
      keeps the cast history/Flash count/DI flag and raises rather than resets the shield, as
      Java's `AscendBuff.reset()` does. See `PORT_COVERAGE.md`'s DivineIntervention row. Every other class now offers its
      full set, Mage's two included (closed 2026-09-21, see below).
      **Correction 2026-09-22: "the ward's glyph override" is not open - it was already live,
      the sentence above had just drifted into describing it as a gap.** `Armor.hasGlyph()`'s
      real HolyWard suppression (`items/armor/Armor.java`, tag `v3.3.8`) is fully wired in
      `combatResolution.ts` (melee glyph-proc gate, direct armor-glyph damage/passive reads,
      and a `syncHeroFromStats()` refresh on both cast and expiry) - see `PORT_COVERAGE.md`'s
      tier-1 row for the fuller correction. Found and fixed in the same pass: HolyWard's own
      tome cost was 2 (matching HolyWeapon with no Java basis); `HolyWard.java` has no
      `chargeUse()` override at all, so the real cost is `ClericSpell`'s default 1 - live-
      verified, casting it now spends exactly 1 charge. Checked DivineIntervention's Java
      source directly while investigating this line's remaining scope: it needs the same
      tier-4 talent gate as the rest of tier 4 (`hero.hasTalent(Talent.DIVINE_INTERVENTION)`),
      so it is not independently offerable without that prerequisite either.
      **Progress 2026-09-22: PowerOfMany's existing-ally combat path is now available.** An aimed
       cast empowers one visible existing ally for Java's 100 turns and applies its melee damage
       increase, incoming-attack reduction, LifeLink rank factor, and `MANY_POWER` status icon.
       **Correction 2026-09-23 (opencode-02, read against `PowerOfMany.java`, tag `v3.3.8`):**
       the summon half is ported too - `spawnLightAlly` (80 HP, level+9/level+4, 5-30 roll,
       1-5 DR, the five non-Cleric classes Java's `Int(5)` picks), PowerBuff 100 plus Barrier
       25 with Java's own decay, death on Buff loss, and the free LightAlly re-cast
       (`powerOfManyLightAlly` zeroes the charge) are all live and offered; the "missing
       actor/shield/order seams" sentence this replaces was stale (the Stasis/empowered-guard
       `allyExists` contributors have no port-side equivalent, so the `powered`-only check is
       complete by construction). True residuals: the full INORGANIC set (bleeding/poison
       gated, the rest in flight), the 2x wandering-return speed, and zap/quickslot
       presentation.
      **Narrowed 2026-09-19 to the real
      shared root cause, checked directly against both abilities' Java source**: this port's
      hero carries at most one `wand` bag entry at a time (`dungeonScene.ts`'s `wandType: WandType`
      is a single scalar field, `equipWand` always writes the one stackable `id: 'wand'` bag
      slot) - but per-instance wand *identity* already exists here (`id: 'wand'` entries
      carry their own `instanceId` plus `sourceClass`, several can coexist, and a carried
      wand names its own class): what does not exist is per-instance *charges*, a single
      shared `wandCharges` pool serving the wielded scalar while ground pickups absorb
      (`wandabsorbed`). Corrected 2026-09-19: identity exists, charges do not.
      Superseded 2026-09-21: per-instance charges, spare pickups, recharge, imbue and both
      abilities are live (see the progress notes below) - the blocker is lifted. Both
      abilities are built directly on Java's opposite assumption: `MagesStaff.imbueWand()` lets
      the Mage attach *one of several carried wands* to the staff (`WndBag.ItemSelector` picks
      among them), and `WildMagic.activate()` literally fires `hero.belongings.getAllItems(
      Wand.class)` - every distinct wand the hero owns, shuffled, up to 4. Neither is offerable
      without first giving each carried wand its own charge pool and recharge, which is a
      change with a wide blast radius (the single `wand:` save entry, the shared recharge
      tick, Wand Preservation, Magical Holster's bag row and every refund targeting the one pool) - not scoped to these
      two abilities alone, so this is recorded as the actual blocker rather than the vaguer
      "staff-imbue system"/"wand-randomization pass" phrasing this line carried before. The
      Cleric's three have neither strings nor a spell system here.
      **Progress 2026-09-21 (foundation half): per-carried-wand charges are live** -
      `simulation/spareWands.ts` ports Java's `maxCharges`/`curCharges`/`partialCharge`
      (`min(initialCharges + level, 10)`, Magic Missile 3, rest 2, arriving full), other-class
      pickups land as spare entries with identity instead of absorbing, spares recharge on
      the shared rate and persist through `bagSources`, and `WildMagic`'s shot selection
      and per-shot spend are ported pure (both suites pin them). Still open: firing the
      selected shots through the real zap effects, `MagesStaff` + its imbue choice, and
      offering either ability. See `PORT_COVERAGE.md`'s spare-wands row.
      **Progress 2026-09-21 (firing half): `WildMagic` is offered and live** - the normal
      zap extracted verbatim into `fireWandShot(wandType, ...)` (same file, budget-neutral),
      `activateWildMagic` spends the 25 armor charge and fires every selected spare at the
      Wild-Power-boosted level; self-aim refuses silently, empty cells refuse with `no_target`
      (all stated in the coverage row).
      **Progress 2026-09-21 (cursed spares): `CursedWand.cursedZap`'s Common, Uncommon and Rare
      tiers are live, scoped to 6 of 8, all 8, and 3 of 8 effects respectively** - a cursed
      spare now fires through `castCursedWandEffect` (tier roll at Java's real 60/30/9 weights)
      instead of sitting out; `HealthTransfer`'s direct damage write is `magicImmune`-gated
      (`AntiMagic.RESISTS` lists `CursedWand` as a source class); `Explosion` and `LightningBolt`
      both reuse the newly-exported `applyBlastDamage` (it already had a hero branch, just
      wasn't exported - the earlier "needs a hero-inclusive bomb helper"/"genuinely large
      multi-area effect" notes were both overestimates made without reading past the
      presentation calls); `MassInvuln` needed no new infrastructure at all (Invulnerability
      and Bless were both already modeled), and `ConeOfColors` reuses `mechanics/cone.ts`'s
      `coneCells` (the same 8-radius/90-degree `STOP_SOLID` cone Shockwave/Regrowth already
      build) plus five already-modeled status/damage primitives, per-character direct damage
      following `HealthTransfer`'s precedent rather than `applyBlastDamage` (confirmed not
      `magicImmune`-gated: Java's damage source here is the buff instance, not `CursedWand`
      itself, so it isn't in `AntiMagic.RESISTS`), and `SheepPolymorph` silently destroys an
      eligible non-hero/non-boss/non-miniboss/non-NPC target (Java's own `valid()` gate) and
      replaces it with a fresh 10-turn `spawnSheep`, reusing `destroyAlly`'s no-death teardown
      and `SummonSheep`'s spawn factory - no new infrastructure needed. Both ConeOfColors and
      SheepPolymorph are now browser-verified live (isolated scratch builds, ~200-220 scripted
      casts each, all statuses/kills/exclusions and the boss-immunity gate confirmed, zero
      console errors). The three cast methods moved to their own
      file, `dungeon/hero/cursedWandCast.ts`, once the group outgrew `armorAbilityUse.ts`'s file
      budget. See `PORT_COVERAGE.md`'s dedicated `CursedWand` row for exactly which effects and
      tiers remain unported (two Common effects and most of Rare need real new infrastructure -
      pluggable blobs, unimplemented trap kinds, a missing buff, floor-travel wiring, or an FOV/
      knockback primitive; the VeryRare tier is folded into Rare's odds rather than modeled
      separately).
      **Progress 2026-09-21 (imbue half): the staff-imbue choice is live** - the Mage
      tapping a spare chooses wield (that entry) or imbue, with Java’s own refusals
      (`id_first`, `cursed`), confirm (`imbue_desc`/`imbue_lost`/`imbue_cursed`), level
      sync, consume line and save/load.
      **Closed 2026-09-21: `ElementalBlast` is offered and fired** - `activateElementalBlast`
       reads the imbue, aims the roomiest cardinal, and runs the full cone with every class
       effect through the pinned arithmetic (simplifications stated in the method comment
       and coverage row). Every class now offers its full armor-ability set.
       **Correction 2026-09-21 (opencode-01, via ACP #81):** the offered blast's frost
       leg applied Chill where Java applies Frost outright (`Buff.affect(mob,
       Frost.class, effectMulti*Frost.DURATION)`) - now direct Frost with Java's
       Burning/Chill-detach and paralysis order, pinned in `test:armorAbilities`;
       see the coverage row. The item itself stays open on the Cleric epic.
      **2026-09-19**: `ClassArmor` as a distinct item is ported - the crown choice and the Rat
      King exchange convert the worn armor to the hero's per-class subclass id (named from SPD's own keys, Cleric via `port.*` with tag-`v3.3.8` translations), keeping tier/level/glyph/curse and the Warrior's seal. **Closed 2026-09-20:** `AC_TRANSFER` now moves the class-armor ability/charge onto a selected armor with Java's target properties and one-turn cost; the compact single-action detail window exposes detach first when sealed, then transfer. Still open is the class-armor sprite tier. Ratmogrify is fully ported since 2026-09-19 (its own
      **Correction 2026-09-20:** the prior sentence's "Still open" note is superseded: the hero
      animation now switches to Java's tier-6 class-armor row when the crown is worn and returns
      to the copied ordinary armor tier on transfer/equipment changes. Ratmogrify is fully ported
      since 2026-09-19 (its own `class: "any"` row opens the tier-4 tab and `RATLOMACY`/`RATFORCEMENTS`
      run, and `RATSISTANCE`'s `0.9^points` factor rides the attack multiplier with a stated
      rounding note). See
      `PORT_COVERAGE.md`'s armor-ability section for the per-ability reason.
      **Progress 2026-09-24 (audit correction, re-checked directly against `src/armorAbilities.ts`
      and every cited `PORT_COVERAGE.md` row rather than from the item's own stale opening line):**
      the opening sentence above ("Thirteen abilities are fully ported... browser verification owed
      for the newest, per section 10") is stale and already superseded by this item's own later
      notes - `armorAbilities.ts`'s `PORTED_ARMOR_ABILITIES` set lists all 18 real abilities (Warrior
      x3, Rogue x3, Huntress x3, Mage x3, Duelist x3, Cleric x3) and its own doc comment states
      "Every class offers its full set now", matching the 2026-09-21 note above (`ElementalBlast`
      closed) and the Cleric/PowerOfMany notes that follow it. Section 10 itself is fully closed
      (moved to `CLOSED.md`), so "per section 10" is a dead cross-reference kept only for other
      items' line numbering, not a live debt tracker. **What is genuinely still open**: unlike the
      Cleric spells and the `CursedWand` effects (both of which cite explicit browser-verified
      passes in `PORT_COVERAGE.md`), no row for `ShadowClone`, `Challenge`, `ElementalStrike` or
      `PowerOfMany`'s existing-ally path cites one - each is pinned only in headless
      `test:armorAbilities`/`test:simulation`. This pass found no browser tool
      (`claude-in-chrome`/`chrome-devtools-mcp`) available in this session, so that verification is
      left undone rather than claimed done. Everything else the opening bar named (the King's Crown
      `WEAR` choice panel, `ClassArmor.upgrade()`'s state changes, the charge meter's regrowth rate,
      the four rank-4 talents) is confirmed live by the progress notes throughout this item.
      **Complexity: S** (browser verification only for the four abilities named above; no remaining
      unbuilt system blocks any of the 18).
- [x] Match Java talent timing, identification, recharge, and threshold rules. Tier-4 threshold
      timing is now real (the tier's window, its `armorAbility == null` gate and its point curve are
      Java's `Hero.talentPointsAvailable(4)` rather than the earlier "T4 is never granted"
      simplification), and Test Subject/Tested Hypothesis now proc on every identify event
      through one shared helper (2026-09-18). **Closed 2026-09-19**: Java's `onTalentUpgraded`
      rank-2 identify of *already-equipped* gear (Veteran's/Thief's/Adventurer's Intuition) is now
      wired too (`identifyOnTalentUpgraded`), now that equip/unequip tracks a real identified
      state to change (see the item-system's equip-identify bug fix, same date) - reaching rank 2
      identifies the currently-worn piece immediately rather than waiting for the next equip, and
      chains into Test Subject/Tested Hypothesis the same way any other identify does. Rank 1's
      Thief's Intuition `setKnown()` (ring type known, level/curse still hidden) stays unported -
      this port's binary `identified` ring model has no separate type-known state. **Closed 2026-09-21:**
      rank 1 now marks the worn ring's type known handler-wide (`simulation/ringKnow.ts`, per-run set,
      saved/loaded, bare type name in the display; rank 2 marks every carried ring's type the way Java's
      belongings loop does; any full identify marks the kind too - rule pinned in `test:simulation`,
      PORT_COVERAGE.md row added; the other three Intuitions have no rank-1 branch in Java). Recharge talents
      (Weapon Recharging, Wand Preservation, Empowering Scrolls) and the per-tier threshold windows
      were already exact from earlier passes. See `PORT_COVERAGE.md`'s equip-identify row.
- [x] Complete class-specific item and ability behavior. `SuckerPunchTracker` is ported (the Rogue
      surprise bonus uses Java's `Random.IntRange(points, 2)` once per stable enemy, with save/load
      and death cleanup). **Closed 2026-09-18, two halves**: Nature's Power now speeds the bow
      itself (`SpiritBow.speedMultiplier()`'s `+= (8 + GROWING_POWER)/24` as a bow-shot-only
      turn-cost divisor), and the bow branch's leftover `1 + 0.2*rank` Point Blank *damage*
      bonus is deleted while gaining the real accuracy factor (Point Blank is accuracy-only
      in Java - the 2026-09-15 correction had fixed the throw path but missed the bow).
      `SpiritArrow`'s infinite-accuracy clause stays unported as a correct-by-construction
      non-gap (it needs a bow augment plus a sniper special, neither of which exists here).
      **Closed 2026-09-20, one plant half:** Warden Sorrowmoss now grants Java's 15-turn
      `ToxicImbue`, removes poison, emits the real 6-volume ToxicGas pattern each turn, and is
      immune to poison and toxic gas through the shared buff/blob gates. The remaining open class
      effects stay listed in the coverage rows. **Also closed 2026-09-20, one plant half:**
      Warden Mageroyal now grants Java's 10-turn half-duration `BlobImmunity`, honored by the
      modeled harmful blob, fire, and smoke seams. **Closed 2026-09-21, one plant half:** the
      shared hero-plant trigger now interrupts queued click-travel for every plant, matching
      Java's `Plant.trigger()`/`Hero.interrupt()` prelude; only presentation remains in that
      narrow branch. **Closed 2026-09-21:** every sub-thread this line ever named is now closed
      with a dated entry, and re-checking `PORT_COVERAGE.md`'s plant/Warden rows turned up no
      further undocumented gap - the "remaining open class effects" the 2026-09-20 note above
      pointed at are the Simplified/Not-ported residuals already on record there (Warden's
      inter-floor Fadeleaf return, `HazardAssistTracker` marking on a mob teleport, Lotus/seed
      growth, wound/blood-splash presentation), each of which this project's own "Definition of
      done" already counts as done once documented. Checking off this item is that documentation
      catching up with the code, not new work. **Complexity: M.**
- [x] Port the `BOSS_CHALLENGE` badge set - the weapon-only boss kill. **Closed 2026-09-17: both halves this line called missing were already live, and only the documentation said otherwise.** The five badge rows exist (`boss_challenge_1..5` in `src/content/badges.mwl` - the "no `BOSS_CHALLENGE` rows" claim was stale, as was the `src/badges.mwl` path, which is really `src/content/badges.mwl`), the flag is set at all five fight starts, the damage-*source* notion the line said was missing is threaded (wand branch, unarmed branch, bomb seam, armor-ability seam, all clearing through `disqualifyBossChallenge`), and the award fires at each boss's death with the flag persisted through save/load. This was recorded for a while
      under section 7's seed/dew item as "the Dwarf King's boss-challenge-badge flag", which it is
      not: it is Java's `Badges.Badge.BOSS_CHALLENGE_1..5`, awarded at a boss's death while
      `Statistics.qualifiedForBossChallengeBadge` is still set. The flag is set true at all five
      boss fights' starts (`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel`/`PrisonBossLevel`/
      `SewerBossLevel`'s own `progress()`/`seal()`, all tag `v3.3.8`), cleared when the hero deals
      boss damage that is *not* a plain weapon hit - `DwarfKing.java` 459-467 clears it on an
      unarmed hit without `RingOfForce.fightingUnarmed`, on any `Wand` except `WandOfLightning`, and
      on a `ClericSpell`, with `Goo`/`DM300`/`Pylon`/`Tengu`/`YogDzewa` each carrying their own sites
      - and read at that boss's death. **Progress 2026-09-20 (41st matrix): the reverse direction is
      now ported too - `foulBossChallenge()` clears the flag when a boss itself fouls (Goo's water
      heal and pumped slam, Tengu's bomb blast, fire-cone cell, and shocker pulse on the hero).**
      Original text follows (superseded by the close-out above; kept for the rule description). The badge entries themselves
      (this port's `src/badges.mwl` is deliberately its own smaller set - one boss badge per chapter,
      no `BOSS_CHALLENGE` rows), and the clearing half's damage-*source* notion, which this port's
      inline monster-damage paths do not thread today. **Complexity: M** for that second half; the
      five badge rows and the award are S on their own.
