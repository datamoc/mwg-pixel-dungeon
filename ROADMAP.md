# TypeScript parity roadmap

Goal: make the TypeScript game functionally equivalent to the Java Shattered
Pixel Dungeon implementation. Every completed item should be checked against
the corresponding Java source and recorded in `PORT_COVERAGE.md`.

`tools/roadmap-progress.html` renders this file's own checkbox completion (overall and
per `##` section) as real `mwg` `two-d.ui.Bar`/`Label` widgets, loaded from the
standalone `mw_games.global.js` build (no bundler needed). Serve the repo root (e.g.
`python -m http.server 8000` from the repo root - not `dist/`) and open
`http://localhost:<port>/tools/roadmap-progress.html`; it `fetch()`es `../ROADMAP.md`
directly, so opening the file via `file://` won't work (see this project's own
browser-verification workflow for why).

See `CLOSED.md` for fully checked-off sections moved out of this file (currently: release
baseline tracking, browser-verification debt).

## This port's own release plan (news)

Version numbering for *this* project (`package.json`'s `version`, tagged in this repo), not
the upstream SPD baseline tracked above. See `CLOSED.md` for the roadmap sections already
fully checked off as of a given release.

- **v0.1 (tagged `0.1.0`/`0.1.1`)** - the first more-or-less playable version: a hero can start
  a run, descend, fight, loot, and die or win, on top of the `mwg` framework. Release notes for
  this line should explain what `mwg` (`@datamoc/mw_games`) *is* and why this project depends on
  it rather than being a from-scratch engine - see this file's own header and `CLAUDE.md`'s
  "`mwg` dependency" section for the source material: it is a separate, generic, MPL-2.0 game
  framework the user maintains outside this repo, consumed here as a normal npm dependency, that
  supplies rendering (PixiJS-based), the MWL authored-data pipeline, UI widgets, actor/roguelike
  primitives (`Random`, `Roguelike`, `Blob`, `EntityRegistry`, `Scheduler`), and Capacitor/
  WebView2 packaging - while every SPD-specific number, rule, and asset stays in this GPL-3.0
  repository (the licensing boundary section above). Not itself a parity milestone; the bar was
  "playable", not "correct in every detail".
- **v0.2 (planned, not yet tagged)** - the first version this project calls *complete*: every
  roadmap section below closed or explicitly marked "Not ported"/"Divergence (deliberate)" with
  no silent gaps, per the "Definition of done" at the end of this file. Release notes for this
  line should call out the behavioral differences from vanilla Java SPD a player might actually
  notice, gathered from `PORT_COVERAGE.md` as they're closed - notable ones so far:
  - Environmental gas/blob propagation (`Blob.evolve()` - ToxicGas, ConfusionGas, Fire, etc.) now
    uses Java's exact bounded four-neighbour-average/one-volume-loss rule instead of `mwg`'s more
    generic diffusion-and-decay model, so gas clouds spread and thin out the way the real game's
    do rather than approximately.
  - `Generator.java`'s real tier-3 weapon-deck bug (`WEP_T3.probs` accidentally clones `WEP_T1`'s
    weights, zeroing the Mace's drop chance and making the tier-1 Whip unreachable) is corrected
    in this port rather than faithfully reproduced - a **Divergence (deliberate)** per the fidelity
    policy above, since Java itself won't take the fix.
  - Tengu's fire-throw and shocker abilities run on their real cadence and damage formulas.
  - Golems tick their enemy-teleport and wandering self-teleport cooldowns individually and on
    every turn (matching `Golem.act()`), not on a shared/simplified timer.
  - Monster AI generally - this line item is intentionally open-ended rather than a fixed claim;
    track it against section 5 ("Improve monster behavior and loot") as that section closes, and
    replace this bullet with the specific, checkable differences once they're known rather than a
    vague "AI improved".
  This list is a starting point, not exhaustive - extend it as more section-5/7 items close, and
  prefer pulling exact wording from the relevant `PORT_COVERAGE.md` row over re-describing it here
  from memory.

## 0. Move authored game data into MWL resources

Follow MWG's `examples/mwl-content` layout. The `.mwl` files are the source of truth for
authored data; TypeScript supplies the engine, presentation, and explicit executable hooks.
Do not add new authored content as object literals or scattered constants in the game code.

- [x] Create `src/content/` as the canonical resource tree, using one or more `.mwl` files
      per domain and stable path ordering for deterministic builds.
- [x] Compile the resource tree before TypeScript and import generated `src/generated/` data;
      the browser must not parse MWL at runtime. The first catalogue contains all twelve rings
      and the adventure turn clock (`content/rings.mwl`).
- [ ] Add the complete item catalogue: weapons, missiles, armor, wands, rings, artifacts,
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
      crafting transaction (`alchemy.ts`'s `craftAlchemy`); the pot UI, energy resource,
      catalysts, and exotic recipes beyond that initial set remain open. The ten specialty
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
- [ ] Add actor and combat resources: hero classes, stats, talents, buffs, enchantments,
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
      fist's zap); **`burning` 3 is the one value that matches no Java site at all**, and its
      mismatch is not only the number - see `PORT_COVERAGE.md`'s `BUFF_DURATION` row for the full
      per-site table, the reason the table stays as authored, and the fire-model half of that gap
      (this port's fire neither refreshes the burn nor damages directly while a target stands in
      it, where Java's does both every turn). `poison` (6) and `bleeding` (0) have no Java
      `DURATION` constant to compare against, so they remain this port's own convention. The one
      buff added since (`wayward`, 10 turns for `Wayward.WaywardBuff`) does use Java's own
      `DURATION` exactly.
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
      consumed by `combat.ts`'s `addBuff`. Stat blocks still need the same treatment.
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
- [ ] Add scenario/event resources: title/start flow, level entry/exit, dialogue, objectives,
      shops, scripted encounters, victory/death transitions, and save-schema metadata. The five
      fixed boss transitions and victory messages are now authored in
      `src/content/scenario-rules.mwl`; the rest of the scenario flow remains open.
- [ ] Move authored asset references to MWL and consume its generated asset manifest; retain
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
- [ ] Move the port's messages and descriptions to MWL gettext-marked values, generate the
      i18n catalogue, and remove duplicate hand-maintained content strings. The ordered potion
      and scroll appearance tables are now in `src/content/appearances.mwl`; message bodies and
      the remaining key tables still need migration.
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
- [ ] Add resource validation and parity tests: duplicate IDs, missing references, stable
      ordering, deterministic generated output, and representative generated-vs-Java values.
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
      non-zero; reverted, and `npm run check` / `npm run build` are clean on the real data. Broader
      Java-parity value tests (representative generated-vs-Java values) remain open.
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
- [ ] Flammable terrain and fire burnout: the port now has a live representable slice of this model:
      fire decays in place and representable grass/door cells burn out into a distinct `EMBERS`
      terrain kind, with plants removed, exact one-volume decay, orthogonal volume-4 propagation,
      and cooked Mystery Meat. The full Java inventory -
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

## 1. Complete the item system

- [x] Wire `rollAffix`/`ENCHANT_TABLE`/`GLYPH_TABLE` into real item generation and equip.
      Found and fixed the same pass: `Actors.rollAffix` was never called anywhere, so no
      weapon/armor obtained through normal play was ever assigned a concrete enchant/glyph/curse
      id. `generatedInventoryItem` now rolls one via a new `rollGeneratedAffix` helper
      (curse-pool pick when `generated.cursed`, weighted good-enchant pick when
      `generated.hasGoodEnchant`), and `equipWeapon`/`equipArmor` gained the real cursed-and-known
      equip-lock rings already had. See `PORT_COVERAGE.md`'s "Enchant/glyph/curse assignment"
      row. **Correction (2026-09-09 audit): this bullet's own "not yet confirmed in a live
      browser session" caveat was stale** - a later pass already ran the playtest it asked
      for (a 3000-trial statistical check of the curse/enchant roll distributions, a live
      equip-lock test with the correct FR message, a live cleanse test, and a Barrier-decay
      tick check - all recorded in `PORT_COVERAGE.md`'s same row), this bullet was just never
      updated afterward. A fresh static re-audit this pass found no functional bugs in
      `rollGeneratedAffix`/`equipWeapon`/`equipArmor`; the only real findings were code-quality
      (the two equip functions duplicate ~40 lines of shape between weapon/armor variants, and
      use inconsistent starting-gear sentinel checks) - left as a future cleanup candidate, not
      urgent enough to risk touching untested.
- [ ] Port all remaining weapons, wands, rings, artifacts, bombs, alchemy, and crafting.
      **2026-09-11 progress:** the ten `Bomb.EnhanceBomb` recipes are now authored in MWL,
      validated as executable all-or-nothing recipes, and produce named specialty bomb items;
      the base blast follows Java's per-subclass `explosionRange()` and is skipped entirely for
      the three subclasses whose `explodesDestructively()` is false (Arcane, Regrowth, Shrapnel),
      which then run their own damage or heal through the same target rules; the crystal energy
      pool and the remaining specialty effects reuse existing scene systems. Noisemaker's armed
      fuse is ported too (2-turn fuse arms the alarm, contact detonates it, a scream every 6 acts
      beckons the level, and it cannot be snuffed or picked up once armed), and picking up any lit
      bomb - not just a plain one - now snuffs it. The
      GooBlob/MetalShard boss drops now use the real 2/3/4 60/30/10 distribution and are
      recoverable for alchemy. The alchemy pot's examine interaction opens the authored recipes
      that the carried energy pool and bag can currently afford, through the shared item picker and
      MWG's all-or-nothing `craft()`; the catalogue outputs' display names now come from SPD's real
      message keys (see the i18n item under section 0), and the four recipe outputs with no single
      SPD class keep port keys. That pot window is still single-choice rather than Java's
      multi-ingredient add/scrap UI.
      **The `Alchemize` spell's cast is ported (2026-09-11)**: it scraps a picked bag consumable
      into its real `Item.energyVal()` (kind bases plus the four `isKnown()` 10s), identifying it
      and spending no turn, through the same free-action shape `useStylus` uses - this also put
      `alchemyEnergyFor` and the authored energy table to work instead of leaving both dead. Its
      recipe now uses a category-aware transaction for any carried seed plus any runestone (the
      generic exact-id transaction remains in use for every other recipe). The runtime generic
      seed also gained the MWL identity it lacked
      (bag seeds used to render the raw id `seed`), and `shopPricing`'s alchemize value was
      corrected from 5 to Java's `20/8`.
      **2026-09-14:** `ScrollToStone` now converts any of the twelve eligible regular scrolls
      into its corresponding pair of runestones through a category-aware recipe transaction;
      the port still auto-selects the first eligible scroll because its alchemy UI lacks Java's
      ingredient window.
      **2026-09-14:** Wand of Corrosion now seeds a persistent Java-shaped CorrosiveGas field
      with its real level-scaled volume and strength, and affected creatures receive the
      two-turn increasing damage state; source-class immunity, death-badge routing, and exact
      corrosion presentation remain documented reductions.
      **2026-09-14:** `SeedToPotion` now consumes three carried seed units and applies Java's
      one-/two-/three-distinct-seed result rules, including its regular-potion randomization
      chances and twelve seed mappings. The cooking HP limited-drop counter and placeholder
      preview remain outside this port's inventory transaction.
      **2026-09-14:** the existing Stewed Meat and Meat Pie alchemy outputs are now edible,
      using Java's base hunger values; their remaining Food-subclass-only buffs are documented
      as reductions.
      **2026-09-14:** Chalice of Blood is now a real, reachable artifact (`chalice`), closing
      the "genuine SPD content, not yet implemented" placeholder `artifacts.mwl`/`PORT_COVERAGE.md`
      had carried for it since the 2026-09-13 artifact-data audit. `AC_PRICK`'s self-damage/
      permanent-upgrade formula is exact Java (`NormalIntRange(ceil(3+2.5*level^2),
      floor(7+3.5*level^2))`, capped at level 10, refusing while cursed/already-capped/AntiMagic),
      routed through the shared hero-damage boundary so Tenacity/Barrier/RockArmor/Viscosity/
      AntiMagic still apply; not ported: the hero's own armor subtraction on the self-hit (no bare
      armor-only roll is exposed to item actions here), Java's death-chance confirmation window,
      and the passive `chaliceRegen` regen boost (this port has no natural HP-regen system to
      attach one to - Not ported, not simplified). Also fixed in the same pass: every *other*
      generated artifact besides the Hourglass used to silently become a Cloak of Shadows
      (`generatedInventoryItem`/`sourceInventoryItem` had no branch for any third artifact class) -
      a live Chalice of Blood drop would have rendered and behaved as the wrong artifact entirely;
      now fixed for Chalice specifically, the same latent gap remains for any future fourth
      artifact. Browser verification not attempted this pass (build/type-check/item/simulation/mwg
      suites green).
      **2026-09-14:** Alchemical Catalyst and Arcane Catalyst recipes and direct-use effects
      are now reachable, including their seed/runestone energy-cost split and weighted regular
      potion/scroll result pools; exotic-family behavior remains open.
      **2026-09-14:** the existing `WildEnergy` alchemy result is now usable, refunding one
      wand charge and applying Java's 8-turn Recharging effect; artifact recharge remains open.
      **2026-09-14:** `TelekineticGrab` is now usable through the shared cell-targeting picker;
      it remotely collects the port's ordinary GroundItem payload, while stacked heaps and the
      Java beacon/pickup-delay presentation remain simplified.
      **2026-09-14:** `PhaseShift` is now usable through the same picker, teleporting a selected
      creature and applying its non-boss paralysis effect; Mob state reset and beckoning remain
      open because the port has no equivalent state machine.
      **2026-09-14:** `SummonElemental` now summons an allied newborn elemental in an adjacent
      free cell; Java's imbue picker and mature elemental variants remain open.
      **2026-09-14:** `ReclaimTrap` now stores and redeploys visible traps, refunds a wand
      charge on reclamation, and persists one-shot trap state; arbitrary reflected trap classes
      remain outside the port's closed trap union.
      **2026-09-14:** `Recycle` now rerolls a selected potion, scroll, seed, or runestone
      within its generated category; tipped darts and exotic-family preservation remain open.
      **2026-09-14:** `MagicalInfusion` now upgrades a selected carried weapon, armor, wand,
      or ring through the shared affix-preserving upgrade operation; equipped-item selection
      and the separate wand curse-infusion bonus remain open.
      **2026-09-14:** `BeaconOfReturning` now persists a set floor/cell on the carried stack,
      returns within the current floor or through the existing saved-floor transition, and
      consumes only on return; the Java options window and branch/occupant edge cases remain
      documented simplifications.
      Wand identity is now persisted from generated `sourceClass` through equipment/save state,
      and (2026-09-11) a wand's *name* is too: every identified wand used to display the single
      generic `port.name.wand` word because `ITEM_KEYS.wand` has no class in it, so all 13
      classes read as "wand"/"baguette". `WAND_KEYS` + `itemDisplayName` now use the real class
      key, `i18nCheck` validates all 13, and the three wrong keys repeated across five tiers of
      `items.mwl`'s dead wand nodes were corrected;
      the shared Elemental carrier also preserves its four Java subtypes and now emits the
      corresponding Fire/Frost/Shock/Chaos loot outcomes; their shared combat carrier now
      applies the available subtype-specific fire/frost/shock/chaos ranged and melee effects,
      with Blindness/cursed-wand delegation explicitly reduced where no port subsystem exists;
      Fireblast and Lightning use their real level formulas, with Fireblast's burning and
      Lightning's per-target scaling. Corrosion and Corruption are now reachable too (their
      gas-volume/intensity and permanent corruption-loot payloads remain documented
      simplifications). Prismatic Light and Disintegration now use their real
      level formulas; Prismatic Light's blindness is represented by the existing timed daze
      status. Their Java cone/ballistic-chain/line geometry is simplified to the selected target
      and visible adjacent targets respectively. Rings: all 12 real types are now live (Haste, Energy, Wealth, Arcana, Force, Sharpshooting from earlier passes, plus Elements and Furor this pass - see PORT_COVERAGE.md's rings row; type-check clean, browser verification still owed per section 10) - Sharpshooting mirrors Force's shape for ranged attacks: a flat `+level`
      damage bonus on thrown missiles (both bounds) and SpiritBow (asymmetric: `+level` on the
      low bound, `+2*level` on the high one, matching `SpiritBow.min()`/`max()` exactly), plus a
      `1.2^level` durability multiplier folded straight into the existing `uses` calculation
      that already drives `ammoDurability`'s per-throw decrement. Force's flat `+level`
      melee-only damage bonus (`ringForceBonus`, gated the same way this
      port's other hero-only attack bonuses already are - `attacker === this.hero` is only true
      at the real bump-attack call site, never `useSpecial`'s throw/shoot/zap branches, matching
      Java's own `MissileWeapon` exclusion for free) needed no new system either. Wealth's
      flat `1.20^level` drop-chance multiplier (`ringWealthMultiplier`, applied to `MOB_LOOT`'s
      roll in `kill`) needed no new system at all, the "blocked" claim was stale; its separate
      bonus-item generation (`tryForBonusDrop`'s escalating rare-loot tracker) remains unported, a
      real narrower gap now rather than a total block. Arcana's real scope turned out much
      smaller than first guessed: it's a `1.175^level` proc-*chance* multiplier real Java only
      folds into whichever enchant's own `proc()` explicitly calls `procChanceMultiplier()` -
      **corrected this pass: the old text here claimed curses never call it "by design" - wrong
      (checked tag `v3.3.8`: Annoying/Dazzling/Explosive/Sacrificial/Displacing/Friendly and
      AntiEntropy/Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth/Stench all do;
      only Polarized has no chance roll at all). Every ported curse chance-proc now scales, and
      Sacrificial's base chance is corrected (flat 1/12 was a guess; real is 1/10)** - and of
      this port's ported good-enchant procs, Grim/Lucky/Blocking/Blooming roll a chance real
      Java scales this way (Blazing/Chilling/Shocking/Vampiric had no roll to scale when this was
      written; they gained their real level-scaled proc chances on 2026-09-12, so all nine now
      scale too).
       `ringArcanaMultiplier()` now feeds all of them. **Correction 2026-09-12: every `^level` in
       that shorthand is really Java's *bonus* level, and the port was reading the raw item level -
       one short of Java, with no cursed clamp and no AntiMagic gate.** `Ring.RingBuff.level()` is
       `soloBonus()`: `level + 1` uncursed, `min(0, level - 2)` cursed, and `Ring.getBonus`/
       `getBuffedBonus` return 0 outright under `MagicImmune` (the AntiMagic glyph). So a plain +0
       ring grants a full level of effect in real Java, a cursed ring can never grant a positive
       bonus (a cursed Might ring *docks* 2 STR), and AntiMagic suppresses rings outright - all
       three were missing, making every ring one level weaker than Java's and cursed rings
       beneficial. One new `ringBonusLevel(ring, magicImmune)` now feeds all twelve formulas (plus
       `ringMightBonus` for Might's STR and the two `HTMultiplier` sites), with `hero.magicImmune`
       threaded into every read. See `PORT_COVERAGE.md`'s rings row for the 12 live assertions.
       Elements/Furor are now ported (this pass), both genuinely - not just assumed - needing more than a stale-claim fix, and both got it: Elements applies RingOfElements.resist()'s real pow(0.825, level) at each hero-side elemental-damage site (burning/poison DoT tick, toxic-gas blob damage, burning-trap fire damage - all in RESISTS, scaled before Barrier absorption like Hero.damage()'s own ordering; durations untouched, as in Java), since this port has no equivalent of Char.resist(Class)'s single shared dispatch. Furor got the attack-only turn-cost split it needed (a new getAttackTurnCostMod(), blanket divided by RingOfFuror.attackSpeedMultiplier()'s real pow(1.09051, level), spent only for bump-attacks via a move-port pre-check; movement keeps the blanket cost, matching Java's attackDelay()-vs-speed() split). See PORT_COVERAGE.md's rings row. Bombs are now ported too (this pass): usable `bomb` bag item with LIGHT & THROW, landing as a lit heap with a real 2-turn fuse ticked from the end-of-turn pipeline (frozen by Timekeeper freeze, snuffable by stepping onto it, chained blasts, DoubleBomb pickup as Bomb x2 with the English-only status) and `Bomb.explode()`'s exact `NormalIntRange(4+depth, 12+3*depth)`-minus-armor blast including the hero - this also fixed generated bomb loot never spawning at all (`portItemKind` returned null). `EnhanceBomb` alchemy and the 10 specialty bombs still need the alchemy system. See PORT_COVERAGE.md's new `Bomb` row.
      **2026-09-12: two more Java mob *properties* are now real data rather than hand-written kind
      lists, and the holy effects that read them are correct.** `Char.Property.UNDEAD` and
      `Property.DEMONIC` are authored as actor flags (`UNDEAD_KINDS`/`DEMONIC_KINDS`, with
      subclasses folded onto this port's ids and `RipperDemon` correctly in both), exposed through
      `isUndeadOrDemonic()`. Three call sites were guessing before: `WandOfTransfusion`'s four-kind
      "undead" list meant a Guard, Ghoul, Monk, Senior, Thief, Bandit, Warlock, RipperDemon or the
      Dwarf King was *charmed* where Java burns it; `HolyBomb`'s list named no demon at all, so the
      bomb did nothing extra to a Succubus, Eye, Mimic, Goo or Yog; and `WandOfPrismaticLight` was
      missing its separate x1.333 multiplier against such targets entirely. All three now read the
      shared helper, browser-verified live (Guard/Ghoul harmed and a Mimic - DEMONIC but not
      UNDEAD - charmed; prismatic bolts reached 7 = `round(5 * 1.333)` against a Guard and a
      Succubus where an armor-free rat never passed 5).
      **And the same reading turned up a systemic one: `Char.damage()` subtracts no DR.** `drRoll()`
      appears exactly once in `Char.java`, inside `attack()` (line 386), and `damage()`'s own note
      says so ("if dmg is from a character we already reduced it in Char.attack") - so every mob
      ability that calls `ch.damage(...)` directly ignores armor. Five paths here were subtracting
      it anyway: `zapHero` (DM100/Shaman/Warlock bolts and the Necromancer's blocked-summon hit),
      DM-300's rockfall, Yog's death gaze, the Pylon's shock, and the transfusion wand's harm
      branch. A Warlock's 12-18 DarkBolt was landing for 2-8 against 10 armor. Bombs are the one
      deliberate exception and were already right: `Bomb.java` 197 subtracts `ch.drRoll()` itself
      before calling `damage()`.
- [x] Port the remaining potions. `PotionOfLevitation` is now live (real buff + chasm bypass,
      matching the trap bypass Levitation already had); a live id-mapping bug that made
      generated `PotionOfLiquidFlame`/`PotionOfInvisibility` silently quaff as Purity is fixed.
      `PotionOfToxicGas`/`PotionOfParalyticGas` are now live too: both are real Java "gas blob at
      your own feet" potions (`Potion.apply(hero)` is just `shatter(hero.pos)` - drinking one
      gases yourself exactly like throwing it at yourself, so this port's quaff-only flow already
      matches Java's own effect, no simplification needed there), now backed by dedicated
      `toxicGas`/`paralyticGas` blobs (direct `1+scalingDepth()/5` damage/turn and a per-turn
      `paralysis` reapplication respectively) shared with `ToxicTrap`, which was fixed in the same
      pass to seed the real blob instead of an instant `poison` buff it never had in Java.
      `PotionOfHaste` is now ported too, found stale in a later pass: the "needs a hero speed
      buff system this port doesn't have" premise no longer held once `getActionTurnCostMod`
      existed (added for Weapon Augment/Swiftness/RingOfHaste) - a real `haste` buff
      (`BUFF_DURATION.haste = 20`) now applies `Char.speed()`'s own `*3f` there as `mod /= 3`,
      the same shape RingOfHaste's multiplier already used. `PotionOfFrost` is now ported (Simplified, and the last generated potion id missing its own branch - it silently quaffed as Purity before): it uses a target-centred `Freezing` approximation, extinguishes Burning, applies Chill and explicit Frost/paralysis immobilization when Chill was already capped, and applies the real elemental harm when appropriate - see `PORT_COVERAGE.md`'s row. All 12 generator potion classes now have their own branch - see `PORT_COVERAGE.md`'s
      potions row for what currently happens instead. (There is no `PotionOfConfusion` in real
      Java - the
      earlier text here was wrong; `ConfusionGas` is a trap-only blob, unrelated to potions.)
      **Re-audited 2026-09-09**: static re-check of all 12 id branches against their cited
      Java formulas found no id-shadowing regression (the historical "silently falls through
      to Purity" bug class does not currently reproduce for any of the 12) and no arithmetic
      bugs. Two low-severity quality notes: LiquidFlame/Frost's branches are near-identical
      (worth a shared helper, not fixed here) and the `else`-branch Purity fallback had no
      guard against an unrecognized id reaching it silently by accident - the exact shape that
      bit this file twice before (Frost, then Toxic/Paralytic Gas each briefly fell through
      here) - now fixed with a `console.warn` on any id reaching the fallback other than
      `potionPurity` itself (`potion`/`potionHealing` already branch earlier and can never
      reach it, but are excluded from the warning too as a defensive belt-and-suspenders).
- [x] Port the remaining scrolls. Fixed the same class of live id-mapping bug for
      `ScrollOfMirrorImage`/`ScrollOfMagicMapping` (both silently read as Remove Curse instead of
      their real, already-ported effects). `ScrollOfRecharging` is now ported (grants the
      already-modeled `recharging` buff, previously just never wired to a scroll).
      `ScrollOfTeleportation` is now ported too (random-free-cell placement + Roots clear,
      reusing the same search the Displacing/Displacement curses already had, now factored into
      a shared `randomFreeCell()` helper). `ScrollOfTerror` is now ported (a new `terror` buff
      forces `takeMonsterTurn`'s existing `decideMonsterAI` fleeBelow threshold to 1, the same
      mechanism Thief's fleeing already uses). `ScrollOfRetribution` is now ported too (minus
      `Blindness`, which this port has no seam for) - this also uncovered `Weakness`/
      `Vulnerable` as fully-wired but previously never-granted dead code, and corrected both
      buffs' durations (`10` -> the real `20`). `ScrollOfTransmutation` is now ported
      (Simplified): `usableOnItem`/`changeItem`'s per-category reroll (same-tier melee
      weapons, 12-class potion/scroll/seed/runestone decks, 12-type rings, `cloak` via
      Java's own no-artifacts-left ring fallback), preserving upgrade level/enchant/curse
      state and consuming the scroll, logging the real `morph`/`nothing` keys. Target
      selection is now a real generic item-picker panel (`openItemPicker`/`chooseItemPicker`,
      built for reuse by the other picker-blocked uses - Enchantment/Intuition/DetectMagic
      stones, shop buy/sell, alchemy) with the real `inv_title` prompt, cancel-keeps-scroll,
      live-bag re-validation, and self-stack (2+) eligibility; armor (never eligible in real
      Java either), single-id `wand`, `MagesStaff`, thrown-stone ammo, `hourglass`, and
      equipped gear are still excluded - see `PORT_COVERAGE.md`'s updated row (type-check/build
      plus both suites green, browser verification owed per section 10). **Correction narrowed:
      the auto-target half of the old correction is now done (real picker, above) - what remains
      is exact `changeItem` including exotics/wands/trinkets/missiles/equipped gear, still owed
      with the section-1 item-system completion (those items must exist as distinct ported items
      first), not as a standalone scroll pass.**
- [ ] Port the remaining enchantments and glyphs, and complete their executable behavior. The
      16 weapon/armor curse definitions (including the corrected `stench` entry) are now
      authored in `src/content/curse-rules.mwl` and adapted by `itemCurses.ts`; `Friendly`
      interaction and the remaining enchantment/glyph behavior remain open. `Repulsion`,
      `Brimstone` are now ported (`Brimstone` grants Java's Burning immunity at the shared buff
      boundary), and `Viscosity` now defers incoming damage with its Java-scaled delayed drain.
      `Repulsion` is
      now ported with its exact level/Arcana-scaled adjacent knockback through the existing
      shove path. `Friendly` is
      now ported with its exact mutual Charm target/ignore-next-hit state and 1/10 x Arcana proc
      (the heart particles remain presentation-only). `Blooming` (uncommon, real
      `(lvl+1)/(lvl+3)` chance, level-scaled plant count, defender-first/shuffled-neighbour order)
      and `Camouflage` (uncommon, `round((3+lvl/2) x arcana)` invisibility on grass trample) are
      now ported - both genuinely fitting existing systems (plantable terrain + buff map), verified
      against tag `v3.3.8` source, not assumed. **Found and fixed in the same audit: no `Fragile`
      armor curse exists in real Java** (checked `v3.3.8` back to `v3.3.1` - closest match is a
      `v1.x`-era changelog mention); the real 8th curse is `Stench` (1/8 x arcana to seed
      250-volume StenchGas at the wearer's own feet), now ported with a distinct stench blob and
      its two-turn paralysis effect, plus a `fragile`->`stench` load
      migration plus a `getCurse` legacy shim. See `PORT_COVERAGE.md`'s new rows. `Unstable`
      (uncommon) is now ported too (this pass): per-swing delegation to one draw over the
      real `randomEnchants` list minus Projecting (Java's own exclusion) and minus
      Corrupting/Elastic (no ported proc to delegate into yet), with the pick shared
      between the pre- and post-damage proc halves and Kinetic's conserved read-back
      flowing through the delegation. **Found and corrected in the same pass, auditing
      `Kinetic`/`Char.java` for the delegation: the old "store half of every hit, cap 20,
      decay x0.75" shorthand had no Java basis - real storage is kill-overkill only
      (`-HP` beyond the swing's conserved bonus, `round(x arcana x berserk-catalyst)`,
      replacing not adding), decay is `2.5%/turn min 0.1` as a float, and the read-back is
      `ceil`.** **Correction 2026-09-12: the "remaining" list that stood here was wrong on all
      three counts - Corrupting, Elastic and Affection are all ported**, each with its real
      formula and reachable in play (Corrupting's lethal-hit conversion into a permanent ally,
      including the `damage >= defender.hp` guard evaluated before the defender's own `damage()`
      curves; Elastic's `(level+1)/(level+5) x arcana` proc shoving the defender out along the
      attack line by `round(2 x max(1, chance))`; Affection's `(level+3)/(level+20) x arcana`
      charm of the attacker). That list's own premise - "each still needs its own system first" -
      stopped being true once the ally/charm systems landed, and nobody re-read it. The one real
      gap it was hiding: **Elastic was missing from `Unstable`'s delegate list**, where Java's
      `randomEnchants` includes it (and orders Kinetic before Corrupting, which the port had
      swapped). Fixed, and now guarded both ways - the item suite asserts the authored list equals
      Java's array exactly, and `tools/scratch/unstable-delegates-livecheck.mjs` drives 440 real
      swings with an Unstable weapon and sees all eleven delegates fire, Elastic included.
      `Obfuscation` now contributes its Java-scaled stealth to sleeping detection; only the
      non-sleeping FOV-binary `seesHero` path remains simplified. `polarized`/
      `Obfuscation` now contributes its Java-scaled stealth to sleeping detection; only the
      non-sleeping FOV-binary `seesHero` path remains simplified. `polarized`/
      `sacrificial`/`displacing` gained real proc branches in an earlier pass, alongside the
      already-live `wayward`/`annoying`/`dazzling`/`explosive`. **Correction 2026-09-12: those
      four "already-live" curses were live in the wrong place** - all four resolved in
      `mobOnHit`, which runs for a *monster's* attack, so a cursed weapon never procced on the
      hero's own swing and instead fired whenever the hero was hit; they now sit in `heroOnHit`
      beside the enchants (the correctly-placed `sacrificial`/`displacing` in `attack()`'s own
      path are what made the anomaly visible). Three of the four also had a real effect bug,
      fixed in the same pass: Explosive threw the explosive *trap*'s formula at the defender's
      own cell and skipped the hero, where `ExplosiveCurseBomb` is a bare `Bomb.ConjuredBomb` -
      plain `Bomb.explode` at the adjacent non-solid cell *closest to the attacker* (its own
      cell when adjacent), `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` on every char
      in range, hero included; Dazzling dazed the hero unconditionally (its visibility test
      asked whether the hero could see *itself*) and wrongly dispelled the hero's invisibility,
      which is Annoying's line; and Wayward was a permanent flat -3 accuracy for merely owning
      the weapon, where Java's `1/4 x arcana` proc *toggles* a 10-turn `WaywardBuff` whose
      `Weapon.accuracyFactor` divides the weapon's `ACC` (1) by 5, multiplying the hero's whole
      attack skill - the port's new `wayward` buff id gates a `/5` on `hero.accuracy` in
      `syncHeroFromStats`. See `PORT_COVERAGE.md`'s curse paragraph for the 20 live assertions.
- [x] Implement weapon augments. **This roadmap line's own history is worth reading before
      trusting any future "done" claim on it: it was marked done, then found still-wrong by its
      own next revision, then actually finished on a third pass** - a real cautionary example of
      why "the formula is correct" and "the feature is reachable" are different claims that both
      need checking. Pass 1 wrongly declared it blocked (no fractional-turn-cost system). Pass 2
      correctly un-blocked that part (`getActionTurnCostMod` is real) but wrongly declared the
      whole feature "fully wired" without checking for an actual `weaponAugment =` assignment
      site anywhere outside the save-restore line - there wasn't one, so the correct formulas
      were completely unreachable through real gameplay. Pass 3 (this one) actually built the
      missing piece: a `stoneOfAugmentation` item (id-mapped from the generator's already-present
      `StoneOfAugmentation` class, previously silently collapsing into the generic `'stone'` id
      alongside 10 other still-unported runestones - a real, wider gap noted but not closed
      here), a `useStoneOfAugmentation()` bag-use action, and a `chooseAugment()` choice reusing
      the existing armor-ability/subclass choice-panel mechanism (a new `augmentChoiceOpen` flag
      threaded through the same handful of gate conditions, with its own full-width stacked-row
      layout instead of that panel's usual 2-column one, since Augment's option text is longer).
      Auto-targets the hero's own equipped weapon rather than presenting Java's real item-picker
      (this port's established convention for "use item on another item" actions). Real Java's
      stone also grants a genuine bonus weapon-upgrade level alongside the augment choice - not
      reproduced, since this port's own upgrade path is tier-based with no free-standing "+1
      level" primitive to borrow without disturbing that tier state machine - stated as a
      deliberate simplification, not silently dropped. Also fixed in passing: `groundKindForItem`
      had no case for `'stone'`/`'stoneOfAugmentation'` bag ids at all, so any generated runestone
      dropped as ordinary floor loot fell through to the caller's fallback (`'food'` at the one
      real call site) instead of rendering/behaving as a stone - pre-existing, not introduced by
      this change. Browser-verified live end-to-end: using the stone opened a real French choice
      panel ("Choisir un augment d'arme" / "Vitesse (+20 % de vitesse d'attaque)" / "Dégâts (+20 %
      de dégâts)" / "Aucun"), choosing Speed set `weaponAugment` to `'speed'`, closed the panel,
      logged "Arme augmentée : Vitesse (+20 % de vitesse d'attaque)." and immediately changed
      `getActionTurnCostMod()` from `1` to the real `0.8`. See `PORT_COVERAGE.md`'s enchant/glyph
      row.
- [x] Port three more runestone (`Cat.STONE`) types beyond Augmentation: `StoneOfFear`,
      `StoneOfDeepSleep`, and `StoneOfShock`, each getting its own item id
      (`stoneOfFear`/`stoneOfDeepSleep`/`stoneOfShock`, wired through
      `generatedInventoryItem`/`sourceInventoryItem`/`groundKindForItem` the same way
      Augmentation's id was) and a use-action, since all three auto-target the nearest visible
      enemy the same way `useSpecial`'s ranged targeting already does - no map-click cell-targeting
      exists in this port for either the real thrown-stone aim or the choice of ally-vs-enemy a
      full `StoneOfFear` needs, so this only ever affects an enemy, never an ally (moot anyway,
      no ally-vs-monster combat exists). `StoneOfFear` applies the `terror` buff `ScrollOfTerror`
      already grants and `takeMonsterTurn` already honors in full - no new mechanic needed, just
      a new way to reach the existing one. `StoneOfDeepSleep` still uses an instant-sleep
      simplification for real Java's gradual `Drowsy`/`MagicalSleep` debuff (the shared
      Lullaby path now carries the sustained hero healing/resting state; setting
      `sleeping = true` directly), just on one auto-targeted enemy instead of every
      visible mob. `StoneOfShock` paralyzes every creature within a Chebyshev-distance-2 circle of
      the auto-targeted enemy (real Java uses a wall-aware `PathFinder` flood fill instead, and a
      1-turn paralysis rather than this port's shared 3-turn `paralysis` buff - both stated
      simplifications, not silently dropped precision) and refunds the hero's wand `1 + hits`
      charges via the existing, already-generic `Actors.Charges.refund`. Browser-verified live:
      adding a fresh `stoneOfFear`/`stoneOfDeepSleep` to the bag and using each against a test
      target applied `terror: 20` and flipped `sleeping` to `true` respectively, decrementing the
      bag by exactly 1 each time; a fresh `stoneOfShock` used against two adjacent test targets
      applied `paralysis: 3` to both and raised a pre-drained wand's charge count (capped at its
      max of 4); the inventory panel's item-detail popup rendered the correct name and the real
      Java `items.stones.inventorystone.ac_use` action label ("사용한다") in Korean for all three,
      and the shock log line rendered its interpolated hit count ("Lightning arcs out, paralyzing
      3 nearby foes."). **This pass's own gap-list correction, worth noting**: this line originally
      (mis)named a 12th runestone type "StoneOfDisarming" - that class does not exist in real SPD
      at all (checked against the actual `items/stones/` directory listing in the local checkout);
      the real 12th type is `StoneOfDetectMagic`, corrected here and in `PORT_COVERAGE.md`.
- [x] Port a fourth runestone type, `StoneOfBlast` -> `stoneOfBlast` (`useStoneOfBlast()`), the
      same rename-plus-use-action pattern the three above already established. Real Java's
      `activate()` just calls `new Bomb.ConjuredBomb().explode(cell)`: a `PathFinder`
      distance-1 flood fill through non-solid/flammable terrain, dealing
      `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` damage minus armor to every char
      caught in it - the hero included, since a bomb does not discriminate - plus destroying
      flammable terrain and triggering/destroying caught heaps. This port reuses the same
      Chebyshev-distance-1-circle approximation `StoneOfShock` already makes for its own radius
      (ignoring walls), substitutes `this.depth` for `scalingDepth` (the same substitution every
      other depth-scaled formula in this file already makes), and routes the hero's own share of
      the blast through the existing `absorbHeroDamage`/`kill` path exactly like
      `applyTrapBlast`'s hero branch already does for a different (trap) bomb formula. **Not
      reproduced**: the terrain-destruction/heap-triggering half of the real explosion - this port
      has no equivalent call from an item-use site, a real, narrower gap left honest rather than
      faked. Browser-verified live: placing the hero adjacent to a 500-HP test target and using a
      fresh `stoneOfBlast` dealt 9 damage to the hero (from full HP) and 8 damage to the adjacent
      target, while a second target 6 cells away took none - confirming both the radius cutoff and
      the hero's own inclusion in the blast; the bag stack decremented by exactly 1.
- [x] Port two more runestone types, `StoneOfBlink` -> `stoneOfBlink` (`useStoneOfBlink()`) and
      `StoneOfClairvoyance` -> `stoneOfClairvoyance` (`useStoneOfClairvoyance()`), bringing 7 of
      12 real runestone types to distinct effects (Augmentation/Fear/DeepSleep/Shock/Blast from
      earlier passes, plus these two). **Blink**: real Java's `activate()` calls
      `ScrollOfTeleportation.teleportToLocation(curUser, cell)` on a player-aimed thrown-to cell -
      a short, precise, chosen hop, distinct from Teleportation's own full-level random jump. This
      port has no map-click cell-targeting for a thrown item (the same reason every combat stone
      above auto-targets instead of aiming), so it reuses the exact `randomFreeCell` placement
      this port's own `ScrollOfTeleportation` already uses rather than inventing a second
      "aim-like" strategy - the real distinction between Blink's short aimed hop and
      Teleportation's full random jump is lost, both collapsing to the same uniformly-random free
      cell. **Clairvoyance**: real Java marks every cell within a real `DIST = 20`
      `ShadowCaster`-diamond around the thrown-to cell `mapped`, plus reveals any secret terrain
      caught in that area - a smaller, localized cousin of the already-ported
      `ScrollOfMagicMapping`'s whole-floor `revealAll()`. With no cell-targeting, this port centers
      on the hero's own position instead (the natural default absent aiming, unlike the combat
      stones' nearest-enemy convention), and reproduces the same DIST=20 as a plain
      Chebyshev circle (ignoring walls) by adding each cell directly to `FieldOfView.explored` (a
      public, mutable `Set`) rather than calling the whole-level `revealAll()`. Browser-verified
      live: using a fresh `stoneOfBlink` moved the hero from `(6,16)` to `(16,13)` in one action;
      using a fresh `stoneOfClairvoyance` grew `fov.explored.size` from 54 to 832 (the floor's full
      `cellCount`, since this port's small Sewers-sized levels fit entirely within a 20-cell
      radius of the hero) and rendered the previously-fogged room fully visible on screen; both
      logged their correct French text ("Vous avez été téléporté en un clin d'œil..." reusing the
      real Java teleport key, "Le donjon vous révèle ses secrets." a new port string), and the
      inventory popup showed "stoneOfBlink" with the correct "UTILISER" action label.
      **Three more runestones, `StoneOfEnchantment`/`StoneOfIntuition`/`StoneOfDetectMagic`,
      ported this pass (10 of 12 real), first consumers of the new generic item-picker panel
      alongside Transmutation - the picker blocker cited below is now gone for good:**
      Enchantment imbues a picked bag weapon/armor with a random good affix (overwriting, like
      Java's own `enchant()`); Intuition runs the real two-stage guess (unidentified
      potion/scroll/ring, then its unknown classes by true name, class-level identify on a
      correct guess) with the real alternating free/paid `IntuitionUseTracker` rule; DetectMagic
      reveals a picked equipable/wand's curse state and reports none/both/good/bad magic from
      its real curse/level/affix inputs. See `PORT_COVERAGE.md`'s new row for the stated
      simplifications (bag-only picker, no exotics, single-id wand, consumed-knowns read
      unknown, no select-then-confirm). **Flock and Aggression are now wired too:** Flock
      creates temporary scheduled Sheep actors within the radius-2 cast area, while Aggression
      marks the nearest visible enemy for the Java 20-turn (5-turn boss) forced-target rule.
      **Corrected 2026-09-12**: that sentence described the *intended* rule, not what the code
      did - `useStoneOfAggression` shortened every non-ally to 5 turns, so an ordinary enemy was
      marked for a quarter of Java's duration and the "20-turn" half never happened at all
      (this call site can only target an enemy). Java's condition is
      `Char.hasProp(ch, Property.BOSS) || Char.hasProp(ch, Property.MINIBOSS)`, a property check
      with nothing to do with alignment, so only a boss/miniboss is shortened. Fixed and
      browser-verified live (rat 20; GreatCrab/Pylon 5 as MINIBOSS; Goo 5 as BOSS), along with
      the mechanic's other half - `Char.attack()` 480-488's half-damage branch for a marked
      boss/miniboss attacked by its own side - which needed a new `miniboss` actor flag. See
      `PORT_COVERAGE.md`'s runestone row.
      Both now have distinct ids and generated/floor-loot mappings; the remaining differences
      are the no-cell-picker center convention and reduced Sheep art/lifespan presentation.
      The generator table now also uses the real `StoneOfDetectMagic` class instead of the
      nonexistent `StoneOfDisarming`, so all 12 Java runestone classes are reachable from
      ordinary generation.
 - [ ] Implement complete weapon and armor tiers, transfer formulas, upgrade formulas, curse infusion, and degradation. Upgrade transitions now preserve generated weapon/armor tiers through inventory and equip, and scroll upgrades keep the fixed tier while applying Java's plain +1 level (the no-picker auto-target remains a documented UI simplification); the existing affix-loss rolls/Warlock Degrade are Java-shaped. Blacksmith reforge now has persistent favor, progressive costs, same-category two-item selection, level preservation and one-item consumption. Curse infusion now has a carried-item picker and real curse assignment, but dedicated equipped-slot targeting, temporary bonus reversal on cleanse, hardening, and transfer/seal handling remain. See `PORT_COVERAGE.md`'s upgrade/degrade row.
- [ ] Implement the remaining charm/knockback/stealth/blink/durability-per-hit
      subsystems the unported enchants, glyphs, and curses depend on (Kinetic's
      carried-damage buffer, Blooming's plant seeding, Projecting's
      line-AoE geometry, and the
      charm/wand-drain/blink/durability mechanics behind
      Affection/AntiMagic/Camouflage/Obfuscation/Potential
      and the matching armor curses) - each needs its own system stood up before
      the enchant/glyph/curse itself can be anything but a stub.
- [ ] Replace simplified missile durability and wand recharge behavior with the Java formulas.
      Wand recharge is now Java-shaped (`10 + 40 * 0.875^missing`, with Recharging's bonus)
      and explicit charge refunds are separated from passive recharge; missile durability,
      damage, and upgrade levels are now exact too (per-type `baseUses` 5/5/12 with the
      `1.5^level` scaling the old formula missed, durable-talent corrected to
      `1.25+0.25/point`, hit-only wear with the real break warnings, PinCushion sticking
      for knives/spikes with kill-scatter, uncapped missile levels via SoU) - this also
      fixed a live `{level}`/`{tier}` log interpolation bug in the upgrade messages.
      **2026-09-11 correction:** the durability formula is now factored into a single
      `missileDurabilityCost()` helper and fixed in two ways against `v3.3.8`'s
      `durabilityPerUse()` - the durable-talent multiplier is applied only while the talent is
      actually taken (`hasTalent`, i.e. rank > 0; the old code applied `1.25` even at rank 0,
      granting every hero +25% missile durability they had not earned), and rounded usages at or
      above 100 now return 0 cost (the stack effectively lasts forever, `usages >= 100f return 0`)
      instead of still wearing down by `100/usages`. The `augment.delayFactor` and MagicalHolster
      factors remain documented simplifications (missiles are not individually augmentable and
      there is no holster).
       Remaining: per-missile identity (boomerang return/merge). **Correction 2026-09-12: the
       "Sharpshooting's Aim-buff rework (stand-still charging)" this line carried for its own
       pass does not exist in Java** - checked both tags the rest of this port is built
       against: `RingOfSharpshooting.Aim` is an empty `RingBuff` marker in `v3.3.8` *and* in
       `4.0.0-beta`, with no charge state and no stand-still rule, and the ring's whole public
       surface is `levelDamageBonus` (a flat bonus level, `MissileWeapon.min()/max()` both add
       it, `SpiritBow` adds it once to min and twice to max) plus `durabilityMultiplier`
       (`1.2^bonus`). This port already implements exactly those, through `ringBonusLevel`, so
       there was nothing to rework; the claim is dropped rather than left as pending work. The
       dust-pickup tracker is ported (`src/missiles.ts` + heap
       lineage + upgrade recording, item-suite proved), and so is **the last-missile confirm**
       (2026-09-12): `MissileWeapon.doThrow()`'s pre-throw warning is now a real two-button
       window on the scene's `WindowStack` (`showConfirmWindow`), shown when the stack's last
       missile would break on that throw and the stack is upgraded - the one clause of Java's
       condition this port's fungible ammo can express - with SPD's own wording in all 19
       locales. Verified live (`tools/scratch/lastmissile-confirm-livecheck.mjs`, 7
       assertions), including that clicking "Yes" through the real pointer path throws and
       that the three neighbours Java does not warn about stay silent.
- [x] Implement identification appearance randomization. Potion and scroll appearances are
      shuffled once per seeded run, pre-drawn without disturbing later gameplay RNG, and
      persisted through save/load.
- [ ] Implement full shop pricing, buyback shelves, and wealth modifiers. Pricing is now
      exact Java (`sellPrice = value x 5 x (depth/5+1)` bracket, verified per-unit `value()`
      bodies, selling pays flat `value()`), keepers spawn on the real 6/11/16/21 depths with
      per-shop shelf stock and a persisted cap-3 buyback shelf rebought at flat `value()`
      (G key, newest sale first), and generated FOR_SALE stands are priced and no longer
      free loot. `ShopRoom` geometry and generic selling are now live: generated weapon/armor
      stock becomes concrete level-0 inventory payloads with preserved Java tiers, and the
      picker sells any positively-valued supported item one unit at a time. Remaining: full
      generated stock as priced live goods (darts/spells/bags still need distinct item systems).
      Priced stands can now be bought directly by stepping onto them;
      the Java trade window is still simplified. See `PORT_COVERAGE.md`'s
      `Shopkeeper` + pricing rows.
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
- [ ] Implement signs, wells, chasms, crystal-door consequences, statues, plants, and mining branches
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

## 3. Port every boss level and boss script

- [x] Port the fixed Prison boss-floor layout at depth 10.
- [x] Port the fixed Caves/DM-300 boss-floor layout at depth 15.
- [x] Port the fixed City boss-floor layout at depth 20.
- [x] Port the fixed Halls/Yog boss-floor layout at depth 25.
- [x] Port the fixed final vault/endgame layout at depth 26.
- [ ] Port Prison/Tengu's full multi-stage arena transition and trap scripts (bracket
      floor, per-bracket capped relocation with trap burst, and the bomb-ability rotation
      with real 3-turn fuses are now live, plus Terror immunity; the Fire cone and Shocker
      burst are now ported too, and the ability cadence is Java's real
      `canUseAbility()`/`targetAbilityUses()` schedule - the arena-jump-scaled cast budget,
      the 1-4 turn gap, and all three catch-up rules - extracted to a tested
      `simulation/tenguAbility.ts` rather than a flat every-third-turn rotation, and the
      adjacent-turn ability check (previously swallowed by the generic melee branch) is
      fixed; **the ability turn cost is now real too** (2026-09-11): `Tengu.useAbility()`'s
      trailing spend is 2 ticks normally (1 when 4+ behind on the cast budget) and 1 tick on the
      bosses challenge (0 when 4+ behind), with `Actor.TICK = 1` - previously every cast spent the
      default single turn, so a normal-mode Tengu cast about twice as often as Java. The rule lives
      in `tenguAbilityCost()` in `simulation/tenguAbility.ts`, is unit-tested by
      `tools/verifySimulation.mjs`, and is browser-verified on all four branches. **The FIGHT_START/FIGHT_ARENA split is now ported too** (2026-09-11): crossing half
      health pins HP to exactly `HT/2` and latches `tenguPhase` to `arena`; before that latch each
      1/8-bracket crossing is Java's cell-phase jump - a warp inside Tengu's cell plus a
      `Patch`-generated dart fill that thickens as HP falls (`placeTrapsInTenguCell`, `arenaJumps`
      untouched) - and after it each crossing is the phase-2 5-7 relocation that raises
      `arenaJumps` and with it the cast budget. The move still runs over the port's single
      Tengu-cell arena: Java rebuilds the whole map into its separate `arena` ellipse
      (`setMapArena()`, (3,1)-(18,16)) and moves both combatants there, so the port's darts persist
      into phase 2 and a phase-2 jump can land outside the cell. The fire ability's actor is now
      real (2026-09-11): `tenguFire` holds Java's `CIRCLE8` direction and the ring it has reached,
      advanced one ring per Tengu turn with the cast itself seeding nothing, verified live at depth
      10. The Shocker actor now persists for three Tengu turns, rolls Java's initial parity, and
      alternates its diagonal/cardinal pulses with the real `2 + scalingDepth()` damage; its
      persistent `ShockerBlob`/Lightning presentation is intentionally collapsed to direct logical
      pulses, and the separate phase-2 arena geometry remains).
- [ ] Port Caves/DM-300's full pylon, gate, energy field, and supercharge scripts (pylon
      proximity sealing, sequential threshold supercharges, pylon activation, boss
      invulnerability, x2 speed, and supercharge loss on pylon death are live; the
      GAS/ROCKS rotation is real with telegraphed rockfalls. **PylonEnergy terrain is now
      real too** (2026-09-11): the arena generates Java's own `Patch.generate(width, height-14,
      0.15f, 2, true)` water scatter and `Random.Int(challenge ? 4 : 8)` inactive-trap scatter on a
      per-floor seeded stream, `activatePylon()` seeds the field on INACTIVE_TRAP/WATER/SIGN from
      row 13 down *at DM-300's supercharge* (not at seal), the seal triggers at Java's real
      Chebyshev distance 3, and the energy tick's double-damage of the hero is fixed - all
      browser-verified live. **The heavy-metal curve is now applied where Java applies it**
      (2026-09-12): it is a `damage()` override, so it runs *inside* `enemy.damage(...)` - after
      every attacker multiplier and proc - but this port had it at the top of `attack()`, above
      the augment/talent/proc chain, which under-reduced every charged-pylon hit (`x1.5` augment:
      Java multiplies 40 to 60 then curves to 23; the old order curved 40 to 20 then multiplied to
      30). The whole `damage()`-override family - `Pylon` 14+/15, `Eye` /4 while charging,
      `DemonSpawner` 19+/20, `Slime`/`CausticSlime` 4+/5 - is now one pure function in
      `simulation/defenderDamageCurves.ts`, called once at Java's point, with `verifyCombat`
      asserting Java's own published value tables for each. Browser-verified live on the built
      game: a raw 40 hit on a slime lands for 12, and on a charged pylon with the x1.5 augment for
      23 (30 would mean the old order).
      **Locked-floor timing is now ported too**: DM-300 is no longer spawned
      in `populate()` on floor entry - `checkCavesBossPylonGate` creates it during `seal()`, at a
      random open, unoccupied `mainArena` cell that is not an `EMPTY_SP` tile, matching
      `CavesBossLevel.seal()`'s own do/while. **The seal's entrance half is ported too
      (2026-09-12)**: the cell the hero came in on becomes a wall, with anything standing on it -
      or heaped there - pushed to a random passable `PathFinder.NEIGHBOURS8` neighbour first
      (Java's own index order, since that is what the draw picks), the tile restitched, and the
      rock burst's screen shake plus the `rocks` cue played. Verified live
      (`tools/scratch/caves-seal-livecheck.mjs`, 7 assertions, including a monster actually being
      pushed off the cell and a heap beside it left alone, as Java does). **Save-safe since
      2026-09-14:** the spent flag persists in the run save instead of resetting per visit
      (which re-armed the gate after every load and doubled DM-300), the walled entrance is
      re-applied to regenerated paint on load, and the spawn is skipped while a live DM-300
      exists - same livecheck, now 9/9 with a refire and a save/load round-trip. `unseal()`'s gate
      reopening is deliberately **not** ported and is recorded as such rather than faked: this
      port descends the moment the boss dies and has no ascent path at all, so a reopened gate
      could never be seen - and Java's own reason for it (walk back out through the arena) is the
      same flow the port's immediate descent replaces. Remaining: the port's arena layout is still
      a hand-approximation of Java's build order (so the patch's RNG stream position is
      deterministic but not Java's exact draw index), and targeting refinements plus presentation
      remain).
- [ ] Port City/Dwarf King's throne and Imp-shop scripts (the full 1/2/3 phase machine
      is now live: P1 hunt with exact summon/ability cooldowns and LINK/TELE-lite, P2
      immobile shield with real wave schedule and self-chip, P3 bleed/summons/losing yell
      - replacing a sketch whose Fury and hold-the-barrier turn had no Java basis; the
      King's Crown drop is also live (granted on his death; see `kill`'s king branch), so
      the P3 viscosity deferral is now live too (2026-09-11): in phase 3 the King
      takes no direct HP damage at all - every hit routes into the same
      `Viscosity.DeferedDamage` pool the armor glyph uses and pays out on his own turns, with
      the payout excluded from re-deferral. Throne geometry, the Imp shop, and the LloydsBeacon
      upgrade remain - **and the Imp shop now has a measured answer for where it lives
      (2026-09-12)**: not a standard room and not `LastShopLevel` (which is dead code at `v3.3.8` -
      nothing instantiates it), but a `CityBossLevel` room that `unseal()` fills the moment the
      King dies, gated on `Imp.Quest.isCompleted()`. That makes it blocked on the victory-transition
      flow, not on the shop code - see the "victory transitions" item at the end of this section).
- [ ] Port Halls/Yog's full fist, flame, shadow, and arena scripts (HP-gate floors,
      per-gate fist spawns, fist-gated invulnerability across ALL damage sources, fist
      proximity guards, and the phase-5 hope trigger are now live with the real
      darkness/hope lines, the regular Yog minion cadence, phase-5 summon burst, and
      DeathRay cooldown/damage range -
      replacing a turn-based spawner that double-spawned against the new hooks and a
      0.75/0.5/0.25 rhythm with no Java basis; the six fist identities and base stats are
      now preserved with their shared fire/root/ooze/cripple effects; Larva is now a standalone
      kind with its exact Java stats/art instead of reusing the Ripper kit, and the DeathGaze is
      now the real two-phase `targetedCells` telegraph plus `beams = 1 + (HT-HP)/400` multi-target
      volley with Java's adjacent-cell beam reduction and `INFINITE_ACCURACY`.
      Challenge pairs are now ported too (2026-09-11): the fist identities come from Java's
      real seeded `fistSummons`/`challengeSummons` decks (one fist per opposed pair, shuffled,
      plus the paired counterparts in Java's two-rotation order on the Stronger Bosses
      challenge), replacing the rotating-index stand-in and the three-live cap; a Rusted fist's
      own deferred damage is now banked through the same monster pool as the King's phase 3; the
      visibility shrink is ported as well (the Halls floor caps view distance at 4 and it falls to
      3/2/1 as Yog's phases advance), and the beams now burn flamable terrain along their paths -
      which matters because the player can grow grass (Regrowth, furrows). The Soiled fist's own
      grass is ported too - it grows grass around itself each turn and around its zap target,
      blunts incoming blows by the tall grass beside it, and ignores Burning (2026-09-11).
      The Bright and Dark fists' half-health warp is ported as well - either pins at HT/2 and warps
      out of the hero's sight, with Bright prolonging Blindness (2026-09-11); since this port has
      no Light artifact and Java's Blindness is only a cosmetic darkening, both feedback paths use
      the existing daze stand-in. The Dark zap's Light weakening, flame/shadow arenas, and
      phase-0 dormancy remain).
- [x] Port final-vault Amulet placement at Java's `AMULET_POS` (depth 26, x=8, y=12).
- [x] Port final-vault endgame-specific terrain, custom visuals, and compass behavior. The
      vault already ran Java's own `viewDistance = 4` through the shared sight radius (with the
      darkness-challenge minimum applied on top, matching `updateVisibility()`), and the compass
      was already correctly gated on `hasStairs` (false on 26). **Closed 2026-09-12**: the last
      three parts - the HALLS_SP custom tiles, the candle visuals, and the floor decoration - are
      `src/spdLevelGen/vaultVisuals.ts` plus a scene layer, transcribed from the Java source
      statement for statement (`CustomFloor.create()`'s cursor arithmetic, its candle cluster, its
      `tileVariance`/`amuletObtained` variants, and the two `CenterPiece` stamps); the
      `EMPTY_DECO` scatter Java rolls one `Random.Int(5)` per `EMPTY` cell for is now in
      `lastLevel()` at its exact stream position; and `create()`'s solid override is real, so the
      hero can neither walk off the walkway into the void nor down into the sealed entrance
      chamber (a new `SOLID` terrain kind, checked in `canStepOnto` before the chasm branch that
      otherwise makes pits enterable - this also fixed the hero arriving on `(9,56)`, a corner of
      that sealed chamber, instead of Java's transition cell `(8,54)`). `verifyVault.mjs` (6
      checks, in `npm run test:simulation`) pins the transcription and
      `tools/scratch/vault-livecheck.mjs` (20 assertions) proves it live. Not ported, stated
      rather than hidden: Java's `discoverable = false` / `visited = true` pre-seeding for the
      entrance rows, which this port's terrain-derived fog has no per-cell channel for.
- [x] Stop dungeon music on entry to the final vault, matching `LastLevel.playLevelMusic()`.
      **Corrected 2026-09-12**: this line's own wording was wrong when it was ticked - Java's
      `playLevelMusic()` only *ends* the music once `Statistics.amuletObtained` is true; until the
      Amulet is taken it plays `THEME_FINALE` on loop, and `AmuletScene` then swaps in the title
      pair (`THEME_2`/`THEME_1`, the reverse of `TitleScene`'s order). `SpdAudio.vaultMusic`/
      `winMusic` now do exactly that, with `theme_finale.ogg` copied byte-for-byte out of the tag
      (the port previously stopped the music on entry, i.e. Java's second branch applied to the
      first, and had no finale asset at all).
- [ ] Implement exact arena layouts, seals, pylons, boss phases, minions, traps, projectiles, movement scripts, and victory transitions.
      **"Victory transitions" analysed 2026-09-12 rather than left as one word, because the answer
      decides whether this is a small change or the largest item left.** Java never descends for the
      player: the hero kills the boss, walks to the floor's own exit and steps on it. Every boss
      calls `Dungeon.level.unseal()` from its `die()` - Goo, Tengu, DM-300, the Dwarf King and
      Yog-Dzewa all do (`Dungeon.level.seal()` is the fight's opening act, called when the fight
      starts) - and each level's `unseal()` is what reopens the way: `SewerBossLevel` turns the
      entrance tile back from `WATER` to `ENTRANCE`, `CavesBossLevel` clears the `PylonEnergy` field
      and opens its gate row, `CityBossLevel` relocks/unlocks its two arena doors and *spawns the
      Imp shop* when `Imp.Quest.isCompleted()`, `HallsBossLevel` restores its entrance, and
      `PrisonBossLevel` swaps the whole map to its end state. This port instead descends the
      instant the boss dies, which is why the King's arena is unlootable, why the Imp shop has no
      reachable home, and why `unseal()` had nothing to do. **Removing the auto-descent is not a
      small change, and was measured rather than assumed**: a flood fill from each ported boss
      floor's entrance to its exit tile (`tools/scratch/boss-reachability.mjs`) shows depth 10 has
      **no `EXIT` tile at all** - Java's Tengu floor is a three-state map (`setMapStart`/
      `setMapPause`/`setMapArena`) whose exit exists only in the fourth, `setMapEnd()`, which is
      built after Tengu dies and teleports the hero back into his cell - and depth 20's exit is
      **unreachable** until `CityBossLevel.unseal()` unlocks its two doors, so flipping the flow
      today would soft-lock both. Depth 15 and 25 are already reachable and only need their seals
      ported - 15's was (2026-09-12, entrance to WALL plus DM-300 on approach), and **25's now is
      too (2026-09-14)**: `checkHallsBossSeal` converts the entrance to `EMPTY_SP` floor art and
      rises Yog at Java's `exit() + width*3` with the push-aside once the hero walks two cells
      from the entrance, instead of spawning him on floor entry; the flag persists through
      save/load with the tile re-applied, and `unseal()` (entrance restore, exit unlock,
      finale music) stays owed with the rest of the descent flow. **Depth 5's check is now done
      too (2026-09-14)**: Goo spawns SLEEPING (Java's `Mob.state` default, previously lifted by
      the port's boss-wide awake exemption), wakes on the real roll, and `takeGooTurn` drowns
      the entrance to live + paint `WATER` on his first acting turn; flag persists with the
      tile re-applied, `unseal()` and the `LockedFloor` buff stay owed with the descent flow
      (boss floors have no stairs, and Java's own water is walkable - the buff bars the exit,
      never the tile).
      The prerequisite is therefore each floor's state machine (Tengu's four maps above all), which
      is its own item - recorded here with the measurements so the next pass starts from them
      instead of rediscovering them.

## 4. Complete NPCs and quests

- [x] Port Caves NPCs and quests. **Verified complete 2026-09-12, and the region has exactly one
      NPC: the Troll Blacksmith.** Its quest (`BlacksmithRoom`, spawned by
      `CavesLevel.initRooms()`'s `Blacksmith.Quest.spawn`) is ported in all its variants - the
      normal DarkGold fetch and the alternative bat-stained-pickaxe run, the pickaxe, the
      favor, the progressive reforge, and now the service window with all six services
      (see the mining/forge bullet below). `CavesLevel` overrides no `createMobs()` at all, so
      there is nothing else in the region to port.
- [ ] Port City NPCs and quests. **The quest itself is ported (verified 2026-09-12)**: the
      Ambitious Imp - `CityLevel.initRooms()`'s `Imp.Quest.spawn` - has its real run-level
      roll (`depth > 16`, `Random.Int(20 - depth) == 0`), its monk-vs-golem alternative, the
      token drop on the right mob, the cursed +2 ring reward, and its flee-on-payment. Its
      token counts are Java's too (`>= 5` for monks, `>= 4` for golems, `Imp.java` 114). One
      stated simplification remains there: depth 18's 50/50 monk-or-golem pick is decided by
      depth parity here instead of Java's `Random.Int(2) == 0`, which the code comment at the
      call site already records. What
      remains is the *shop* the same unseal opens, which is blocked on the victory-transition
      flow rather than on the shop code (see section 3's last bullet).
- [x] Port Halls NPCs and quests. **Closed as not applicable after checking: real Java ships
      neither** - `HallsLevel.initRooms()` adds exactly one room, `DemonSpawnerRoom` (already
      ported, with its own ticked bullet in section 2), and the class overrides no
      `createMobs()` at all (the only region that does is the Sewers, for the Ghost, which is
      ported). The Halls' content is its mobs and Yog-Dzewa, tracked in sections 3 and 5.
- [x] Implement the full Ghost quest reward generator. Was calling the generic depth-scaled
      `randomWeapon`/`randomArmor` instead of `Ghost.Quest.spawn()`'s own distinct formula - a
      fixed 50/30/15/5% tier roll (not depth-scaled), a single upgrade level shared by both
      items, and a single shared 20% enchant/glyph chance (not per-item); see `generator.ts`'s
      new `ghostQuestReward()`. **Found and fixed a much bigger bug in the same pass, auditing
      `generatedInventoryItem`'s category dispatch while wiring this up**: every procedurally-
      generated weapon or missile in the entire game (ordinary floor loot, statue drops, and now
      Ghost's reward) was silently mislabeled as a plain `'food'` item with no enchant/curse ever
      applied, because that function checked `generated.cat === Cat.WEAPON` when the real value
      is always one of the WEP_T1..T5 sub-tier cats (`generatedGroundKind`, a few lines away,
      already had the correct range check - this was a narrow, isolated miss in one sibling
      function, not a systemic gap). Fixed to the same range check; verified live (a real Sickle
      +2 and ScaleArmor +2 landed correctly instead of two `'food'` items) and statistically (a
      20000-sample Node check of `ghostQuestReward()`'s tier/level/enchant fractions matched
      Java's 50/30/15/5%/20% closely, with zero cursed outcomes as Java requires). See
      `PORT_COVERAGE.md`.
- [ ] Replace the simplified Wandmaker quests with Mass Grave, Ritual Site, and Rot Garden.
      Corpse-dust (type 1) and rotberry-seed (type 3) fetches are now live with the real
      intro/reminder lines: MassGrave's dust heap spawns as a real cursed pickup (it used
      to vanish), grass druid... rotberry seeds already drop from grass, the quest type
      persists across save/load, and turn-in consumes the real item for the existing wand
      reward. **Type 2 (elemental embers) is now live too, with the real `intro_ember`/
      `reminder_ember` lines**: the four queued candles spawn as real pickups (same
      null-branch bug class as bombs/dust), a Place action sets them into the ritual slots
      from the bag (no aimed throw UI - stated shape change), all four lit rises a real
      `NewbornFireElemental` kit (HP 60, `[10,12]` melee, telegraphed 3x3 fireball, `3-5`
      cooldown, guaranteed `Embers` drop) for the existing wand reward - plus shared
      elemental rules (`FIERY` immunity, Frost harm) that also cover the base kind. See
      `PORT_COVERAGE.md` (type-check/build plus both suites green, browser owed per
      section 10).
- [ ] Port the Troll Blacksmith's mining and forge mechanics. **The service window is real now,
      and hardening is ported with it (2026-09-12)**: `WndBlacksmith`'s list is a
      `WindowStack` window (`showChoiceWindow`) with SPD's own labels and costs in all 19
      locales, each entry disabled unless the favor covers it; the harden service sets
      `enchantHardened`/`glyphHardened` on a picked item and replaces the upgrade affix-loss
      roll with Java's hardening-loss roll. Verified live (10 assertions). The paid `upgrade`
      (below +2) and `cash out` are ported as well, so the first four of Java's six services were live
      and verified (12 assertions). While implementing it, a wrong claim in `main.ts`'s own
      comment was found and corrected: hardening comes from this service, not from
      `StoneOfEnchantment`.
      **`smith` is now ported too (2026-09-13)**, the fifth of six: `Blacksmith.Quest.generateRewards(useDecks)`'s
      four tier-3 rewards (two weapons of different classes, one missile, one armor, one shared
      upgrade-level roll at 30/45/20/5% for +0/+1/+2/+3, one shared enchant/glyph keep-roll) are
      generated lazily on first open - Java's own fallback shape (`WndSmith`'s
      `generateRewards(false)`) rather than the deck-drawn set the quest normally pre-generates on
      spawn, so the deck bookkeeping is a stated simplification, not a silent drop. A flat 2000
      favor buys whichever of the four the player picks; the other three are discarded, matching
      `WndSmith.onSelect`. Verified live end-to-end (`tools/scratch/blacksmith-harden-livecheck.mjs`,
      22/22 assertions): the five-service window rendered before the pickaxe entry was added;
      the four rewards render as distinct,
      correctly-named items, taking one charges the flat cost and clears the set, and cash-out
      (retested in the same pass) still trades favor for gold 1-for-1.
      **This verification pass surfaced two real, pre-existing bugs, neither introduced by
      `smith` itself, both fixed here:** (1) `ITEM_KEYS` never merged in a name for any of the
      fifteen `missile_*` generated-missile identities (`src/content/missiles.mwl`'s
      `MwlMissileDefinition` carries only combat metadata, no `.name`, unlike the consumable
      catalogue's items) - the smith's own missile reward was the first live UI path to ever
      render one of these ids through `itemDisplayName`, and it showed the bare id
      (`missile_kunai`) instead of a name. Fixed in `src/i18n/spdKeys.ts` by deriving
      `items.weapon.missiles.<sourceClass>.name` for all fifteen from `MWL_MISSILE_DEFINITIONS`,
      the same Java `Messages.get` bundle-key convention every other lookup table here already
      uses. (2) `confirmBlacksmithCashOut`'s payout log line hardcoded the wrong key
      `items.gold.gold.name` (should be `items.gold.name`, i.e. `ITEM_KEYS.gold`) and so always
      logged the raw key text instead of "Gold" - invisible until this pass actually looked at
      the log line in a screenshot rather than only checking the numeric favor/gold state. Fixed
      to call the same `itemDisplayName('gold', true)` helper every other pickup log site uses.
      **The pickaxe buy-back is now ported too (2026-09-13), completing the six-service window:**
      completion retains the quest pickaxe, marks it free at 2500 favor or above, and the
      service sells it for Java's 250 favor otherwise; the retained-pickaxe flag persists
      through save/load and is consumed when the identified pickaxe returns to the bag.
      **Turn-in bookkeeping is now Java's too (2026-09-14, `Blacksmith.java` 450-477):**
      the DarkGold half of favor is capped at 2000 (`blacksmithTurnInFavor`, headlessly
      checked in `tools/verifyItemWorkflows.mjs`), the +1000 quest-branch-boss bonus reads
      a persisted `blacksmithBossBeaten` flag (never true yet - none of Java's three setter
      mobs, `CrystalSpire`/`FungalCore`/`GnollGeomancer`, is ported), the legacy bat-blood
      alternative grants no favor but earns the free buy-back (old Java's flat
      `questScores[2] = 3000` observable half; the score table itself is unported
      endgame/Rankings work), and the service-window gate is Java's `rewardsAvailable()`
      (favor, or a free retained pickaxe - a cashed-out run with only a paid buy-back left
      now hears the done line instead of an empty menu). Verified live end-to-end
      (`tools/scratch/blacksmith-harden-livecheck.mjs`, 22/22 assertions).
      The remaining work in this bullet is the reforge seal/missile transfer pair, and both
      halves are now precisely documented rather than silently missing: Java floor-drops a
      consumed armor's seal as a `BrokenSeal` item (`WndBlacksmith.java` 277-281), which needs
      the seal item and its affix action first (section 1 item work), and retires a consumed
      missile set in `UpgradedSetTracker` (`levelThresholds.put(setID, MAX_VALUE)`), which needs
      distinct set ids on bag missile stacks (today's fungible-ammo model has none, and the
      picker only offers weapon/armor payloads).
- [ ] Port Rat King and other missing special NPCs. Rat King is now complete for its core
      exchange (room drops real `Gold(10-25)` CHEST heaps, the king spawns sleeping with
      his own art, wakes with the real yell, awards the crown exchange when worn armor is
      present, and grants the six-turn Ratmogrify ability).
      **Correction, 2026-09-14: "Remaining: MirrorImage/PrismaticImage/Sheep allies... which need
      the ally/combat systems behind them" was stale.** The ally/combat system this sentence
      said was still missing was itself finished in a later pass (see the now-`[x]`d "Implement
      ally-vs-monster combat" bullet in section 5), and both `MirrorImage` (`spawnMirrorImage`,
      `ScrollOfMirrorImage`) and `Sheep` (`spawnSheep`, `WoollyBomb`) are live through it -
      `PORT_COVERAGE.md`'s ally-combat row already says so correctly; only this bullet's older
      wording never caught up. Genuinely remaining: `PrismaticImage`, `ImpShopkeeper`,
      `VaultSentry`, and `DirectableAlly`, none of which exist in this port at all.

## 5. Improve monster behavior and loot

- [x] Fix `Brute`'s enrage: it was a stateless below-half-HP damage boost that never actually
      granted Java's real one-time near-death revival (a Brute could just be killed outright,
      something Java never allows). Now a genuine `hasRaged`/`raged`-gated revival with the real
      `HT/2+4` shield and flat 4/turn decay. Browser-verified live. See `PORT_COVERAGE.md`.
- [ ] Implement exact wandering, hunting, fleeing, and stealth calculations.
- [ ] Implement monster-specific AI overrides. **Golem's teleport-the-hero-away ability is now
      ported** - previously it had none at all and fought as a plain melee attacker despite
      having a real, distinctive ranged ability in Java. Fetched `Golem.java` to confirm: while
      not adjacent and off a 20-turn cooldown, it teleports the hero to whichever of the hero's
      own free 8-neighbour cells is farthest from the golem (pushing the hero away, not pulling
      itself closer). Real Java's own reachability check (`canTele`, a BFS around blocking
      terrain) now uses the port's passable-path reachability, and the direct-shot
      distance roll, normal approach fallback, plus `MagicImmune` target gate are also ported. Its wandering self-teleport-
      to-reposition ability is now ported with the real 30-turn cooldown and 2-tick cost; the
      charge particles and delayed animation are not modeled. Browser-verified live:
      a golem teleported the hero to a genuinely farther cell, set the cooldown to 20, and a
      second immediate attempt correctly did nothing while the cooldown ticked down. **Eye's
      real DeathGaze is now ported too** - it was implemented as a completely wrong-shaped
      stand-in (an "every 3rd melee hit deals 1.5x" damage multiplier); fetched `Eye.java` to
      confirm the real ability is entirely ranged and never a melee proc at all: a two-turn
      charge-then-fire beam (turn 1 charges, no damage, the eye takes only 1/4 damage from any
      source meanwhile; turn 2 fires a real magic hit roll for 30-50 damage along a clear line
      to the hero, bypassing armor/DR entirely unlike this port's own `zapHero` bolts), then a
      4-6 turn cooldown. Uses the new `monsterTurnCost` hook (from the `firstSummon` fix above)
      to give the charge turn its own real 2x cost. Browser-verified live: charging set
      `beamCharged`/cost `2` correctly and a 20-damage test hit was quartered to `5` while
      charged versus the full `20` once uncharged; firing reset the charge, set a cooldown
      within the real 4-6 range, and dealt damage within the real 30-50 range. See
      `PORT_COVERAGE.md`.
- [x] **Implement ally-vs-monster combat.** Found this session while auditing the scroll branch
      against Java source: this port's monster AI originally had no concept of a non-hero target
      at all. This blocked at least two real mechanics from ever being more than a documented
      stand-in: `ScrollOfMirrorImage`'s allied `MirrorImage` NPCs and `ScrollOfRage`'s `Amok`
      status. Necromancer's summoned skeleton already
      fights monsters *for the hero's opponent*, so some of the shape may be reusable, but the
      hero-side case (something the player controls fighting alongside them) is new.
      **Progress this pass:** `Creature.isAlly` is now persisted and scheduled; MirrorImage
      summons are real 1-HP allied actors that copy the hero's combat stats, attack the nearest
      visible hostile, follow the hero when idle, and can be intercepted by adjacent hostile
      melee turns. Ally turns now use an ally-centered field of view instead of the hero's FOV;
       simple ranged targeting also considers the nearest visible ally, and hostile mobs now
       path toward a visible ally when they cannot see the hero. `Amok` now attacks nearby
       creatures. Flock and Aggression runestones are now live through the same ally/combat
       seam. Boss-specific ranged target migration and dedicated ally sprites/orders remain as
       narrower documented gaps.
- [x] Port all champion types and their effects. All 6 real types (Blessed/Blazing/Giant/
      Growing/AntiMagic/Projecting) are now live, each with its real per-type factor
      (`accRollMulti`/`rollDamage`), and the type roll is a true 1-in-6 matching Java's
      `Random.Int(6)`. Fixed a real bug in Blessed's factor (x3 -> the real x4) along the way.
      Remaining, tracked as narrower gaps rather than missing types: Giant/Projecting's
      extra-reach melee (`canAttackWithExtraReach`) is not modeled (attack range is fixed at 1
      regardless of champion type), `AntiMagic.RESISTS`'s status-immunity list is not modeled,
      and the champion roll itself is still a flat 10% rather than Java's roster-wide
      `Dungeon.mobsToChampion` budget. **Found and fixed a real bug this pass**: real Java
      only ever rolls a champion when the `CHAMPION_ENEMIES` challenge is active (it's an
      opt-in challenge, not a baseline mechanic) - this port's flat 10% roll had no such gate,
      so its own selectable "Champion Enemies" challenge toggle did nothing either way. Now
      gated on `isChallengeEnabled('champion_enemies')`. The by-depth exclusions (Crab/Thief/
      Guard/Bat can't become champions below depths 3/4/7/9, `GreatCrab`/`Bandit` inheriting
      their base kind's exclusion) are now ported too. See `PORT_COVERAGE.md`'s `ChampionEnemy`
      row.
      **Found and fixed the same class of bug in the neighbouring multiplier, 2026-09-12**:
      `AscensionChallenge.statModifier`'s per-mob table (Rat 10 down to Scorpio 1.1) was gated on
      `setStrongerBossesEnabled()`, wired in `main.ts` to the *Stronger Bosses* challenge - so
      merely selecting that challenge multiplied **every ordinary mob's** accuracy and damage by
      up to x10 (proved before fixing: `accRollMulti(rat)` went 1 -> 10 when only that challenge
      was on). Java couples the two not at all: `statModifier` returns 1 unless the hero carries
      the `AscensionChallenge` buff (the post-victory ascent, which this port does not model), and
      `Challenges.STRONGER_BOSSES`'s every use is on bosses - 18 call sites here covering boss HP,
      DM300 cooldowns/gas, King's phase thresholds, Goo's heal, Tengu's deck, and
      `CavesBossLevel`'s traps/pylons, all of which were already correct and are untouched. The
      table was also wrong on its own terms: `skeleton`/`thief` were 6 instead of Java's 5, `dm100`
      5 instead of 4.5, and fourteen named mobs were missing. Now Java's 25 classes flattened onto
      this port's 40 ids (Java resolves by `isAssignableFrom`, so subclasses inherit; the port
      models subclasses partly as MWL aliases and partly as first-class ids, so the flattening is
      explicit), the gate is its own inert flag, and a `verifyCombat` check pins both the table and
      the alias-table invariant. See `PORT_COVERAGE.md`'s new `AscensionChallenge` row.
      **And a third bug in the same neighbourhood, 2026-09-12: which spawns could roll a champion.**
      Java calls `ChampionEnemy.rollForChampion` from exactly one place - `Level.createMob()`, the
      path that draws from the floor's mob rotation - so every directly-constructed mob (a
      Ghost-quest miniboss, a mimic, a pylon, a summon, a swarm split, an ally) is never
      championed, which is why `rollForChampion` needs no NPC/boss test of its own. This port
      gated the roll on a hand-written kind list, so `fetidRat`/`greatCrab`/`gnollTrickster`,
      `pylon`, `mimic`/`crystalMimic`, `larva`, `ripperDemon`, `bee`, `piranha` and even summoned
      allies could all roll one. The guard is now a `championEligible` argument, true at exactly
      one call site (the rotated-roster spawn in `populate()`, this port's `createMob()` analogue),
      pinned by a `verifyCombat` check that only one such site exists and browser-verified live:
      300 eligible rat/snake spawns rolled 25/28 champions, while 300 each of fetidRat, mimic,
      pylon, larva and an allied rat rolled zero.
      **Correction, 2026-09-14: "Giant/Projecting's extra-reach melee is not modeled" (above)
      was stale.** `takeMonsterTurn` already has a clear-line extra-reach branch (range 2 for
      Giant, 4 for Projecting, citing tag `4.0.0-beta` where Projecting's own ability changed
      from an unlimited-FOV special case to that flat range) - see `PORT_COVERAGE.md`'s
      dedicated `ChampionEnemy.Giant/Projecting.canAttackWithExtraReach()` row, which already
      documented this correctly; only this bullet's older wording never caught up.
      **`AntiMagic.RESISTS` is now partially ported, same pass**: six of its ~25 entries are
      buff classes (`Charm`/`Weakness`/`Vulnerable`/`Hex`/`Degrade`/`MagicalSleep`) that
      `combat.ts`'s `buffBlocked()` already gated behind a generic `c.magicImmune` check - the
      check existed but nothing ever set `magicImmune` on a monster, only on the hero's own
      AntiMagic armor glyph. `spawnMonster` now sets `magicImmune: true` for an `antimagic`
      champion (carried through the swarm-split clone). `WandOfFireblast` (`useFireblastWand`)
      is now also wired: a `magicImmune` victim takes no damage and no burning/cripple/
      paralysis, matching Java's generic `isImmune(srcClass)` zero-out for that source class.
      **`Grim`/`Blazing`/`Shocking` (three more RESISTS entries) are wired too, same day**: Grim's
      execute bonus and Blazing's ignite+burn now skip a `magicImmune` defender outright;
      Shocking's arc instead gates per chain-target (`shockingArc`'s own loop), since the
      original defender is already excluded from the chain for an unrelated reason and gating
      there would have cancelled arcs that never even reached it.
      **The rest of the reachable RESISTS list is now closed too, same day - 23 of ~35 entries
      total.** `GrimTrap`'s hero-side damage now passes the `magical: true` flag `absorbHeroDamage`
      already had machinery for (the hero's own AntiMagic glyph gets its real partial `drRoll()`
      reduction the same way it already did for other magical sources - previously silently
      skipped for this one trap kind). The shared wand-zap loop that already handles blastWave/
      disintegration/frost/lightning/livingEarth/magicMissile/prismaticLight now skips a
      `magicImmune` victim's damage entirely (not `corrosion`/`corruption`, which are not RESISTS
      members) - seven more entries in one place. `WandOfTransfusion`'s undead-damage branch,
      `ScrollOfRetribution`'s blast, `WandOfWarding.Ward`'s own zap, and `Bomb.MagicalBomb`
      (`ArcaneBomb`/`HolyBomb`, both the shared base blast and each one's own bonus effect) round
      out the rest. **Genuinely not applicable, not merely unguarded**: `ScrollOfPsionicBlast`
      (an unported exotic scroll), `CursedWand` (no cursed-wand-backfire mechanic exists here),
      `ElementalBlast`/`ElementalStrike`/`WarpBeacon` (unported Mage/Duelist hero abilities -
      see section 6/8's hero-ability gap), and `DisintegrationTrap` (this port's five hidden trap
      kinds don't include one) - none of these have code to guard in the first place.
      **Left deliberately unguarded, and correctly so**: the six monster-bolt entries
      (`DM100.LightningBolt`/`Shaman.EarthenBolt`/`Warlock.DarkBolt`/`Eye.DeathGaze`/
      `YogFist.BrightFist.LightBeam`/`YogFist.DarkFist.DarkBolt`) - real Java's `isImmune()` only
      ever returns true for a target whose own buffs/properties list that class, which for the
      hero (wearing the AntiMagic glyph, not the `ChampionEnemy.AntiMagic` buff) never happens -
      the hero instead gets the separate, already-correctly-ported partial `drRoll()` reduction
      for these sources. An ally could theoretically be hit while itself being magicImmune, but
      champions never roll on ally spawns, so the case cannot occur in current play; adding a
      guard for it would be untestable dead code, not a real fix.
      **`AntiMagic.RESISTS` wiring is now closed, not merely paused, given this port's current
      feature set.** All 35 entries were re-audited one more time, one by one: 23 are wired (the
      6 status buffs plus the 17 damage/effect sources above); of the remaining 12, none can be
      closed further without either fabricating a feature this port does not have at all
      (`ScrollOfPsionicBlast`, `CursedWand` backfire, `ElementalBlast`/`ElementalStrike`/
      `WarpBeacon` hero abilities, `DisintegrationTrap`) or writing a guard against a code path
      that structurally cannot be reached given how this port's targeting works (the six
      monster-bolt classes, confirmed above; `ScrollOfTeleportation`, self-only in this port so
      its target is always the hero, who never actually gets Java's full-immunity `isImmune()`
      treatment from wearing the glyph, only the separate partial `drRoll()` reduction - adding a
      guard there would silently *remove* correct existing behaviour, not add missing behaviour).
      Revisiting this line again later only makes sense alongside whichever larger feature
      (hero abilities, a cursed-wand mechanic, a dart-trap system) it was blocked on.
      **A fourth, more consequential correction, same day: "the by-depth exclusions are now
      ported too" (a few paragraphs above, in this same bullet) was never real Java behaviour -
      it was invented, then documented as a verified port.** Re-fetched `ChampionEnemy.java`'s
      full `rollForChampion` and `Level.java`'s `createMob()` (its only caller): neither has any
      kind/depth check at all - every rotation-drawn mob is equally eligible. Real Java's actual
      gate is a **resettable countdown** (`Dungeon.mobsToChampion`, reset to 8 when exhausted,
      decremented every eligible spawn, assigning exactly on the countdown hitting 0 with the
      challenge active) - not the "flat 10%" this bullet's own text called the remaining
      approximation two paragraphs up. Both fixed together: `rollForChampion`
      (`actors/monsterSpawn.ts`) reproduces the exact countdown with no exclusion of any kind,
      backed by new persisted scene state (`mobsToChampion`, saved/restored, 0 on a fresh run
      matching Java's own zero-valued static field). The fabricated exclusion branch is deleted,
      not kept as a stated simplification. Verified headlessly
      (`tools/scratch/champion-counter-check.mjs`, 4 assertions: no assignment while the
      challenge is off but the counter still advances; exactly the 8th/16th/24th eligible spawn
      assigned across 24 calls with the challenge on; a save-restored counter of 3 needing only
      two more spawns rather than resetting to eight; the assigned type always one of the real
      six). `tsc`/`build`/all suites green. The existing browser livecheck
      (`tools/scratch/champion-roll-livecheck.mjs`) still asserts the old ~10%-with-exclusions
      shape and is annotated with the exact assertion a future browser pass should use instead
      (`champions === 37` of 300, no exclusion checks), rather than left silently wrong.
      **No champion type had any visual treatment at all until this same pass**: `spawnMonster`
      now tints a champion's sprite in its real Java colour (`CHAMPION_TINT`, all six values from
      `ChampionEnemy.java`) - a flat-tint stand-in for the real persistent glow-ring `sprite
      .aura(color)` primitive this port's sprite system doesn't have. `tsc`/`build` green; browser
      verification owed per section 10.
- [ ] Implement remaining blob area propagation, gas, and fire terrain (ordinary fire's
      representable terrain/content slice is covered above; gas and unsupported fire cases remain).
      **CorrosionTrap is now wired (2026-09-14):** it seeds the Java `80 + 5*depth`
      CorrosiveGas volume and `1 + depth/4` strength; the remaining gap is presentation and
      exact source-class resistance, recorded in `PORT_COVERAGE.md`.
      **The fire model itself is now Java's (2026-09-12)**: `Fire.burn()` runs for every burning
      cell every turn and does `Buff.affect(ch, Burning.class).reignite(ch)`, so `spreadFire` now
      reignites every creature standing in fire rather than granting the buff once - the port's
      fire was a short single burn however long a target stayed in it. The table's `burning` is
      Java's own `Burning.DURATION` (8) instead of 3, the one Java site with its own value passes
      it (`MagicalFireRoom.EternalFire`'s `reignite(ch, 4f)`), Burning's damage roll is Java's
      depth-scaled `NormalIntRange(1, 3 + scalingDepth/4)` instead of a fixed 1-2, and
      `reignite`/`affect` (prolong vs add) is now expressible at the buff boundary
      (`reigniteBuff`). Verified live with `tools/scratch/fire-model-livecheck.mjs` (6
      assertions) and headlessly in `verifyCombat`; see `PORT_COVERAGE.md`'s `BUFF_DURATION` and
      blob-DoT rows. Hero backpack item-burning is now live for the port's concrete scroll and
      meat payloads, with the missing unique-scroll/Frozen-Carpaccio distinctions documented in
      `PORT_COVERAGE.md`. What remains here is the rest of the blob/gas catalogue and the gas
      blobs' own propagation rules. Environmental gas/plant fields now use a Java-shaped
      `Blob.evolve()` step (bounded four-neighbour averaging, solid blocking, and one-volume
      loss); ConfusionTrap now seeds its Java-shaped ConfusionGas field and applies the port's
      daze stand-in. The remaining work is the unsupported gas catalogue/effects and exact blob
      actor priorities/presentation.
- [x] Port the Necromancer's skeleton heal/Adrenaline/teleport support behavior - previously it
      had none at all (a summoned skeleton just fought alone forever). Now heals `HT/5` when
      hurt, grants a one-time Adrenaline (reusing the existing haste stand-in) if visible and
      already at full health, and teleports an out-of-sight skeleton back beside the hero
      instead of leaving it stranded. Remaining: the teleport destination is any free neighbour
      of the hero rather than Java's closest-and-in-sight pick. `firstSummon`'s variable tick
      cost is now ported too - the "blocked on a fractional-monster-turn prerequisite" premise
      was stale: `mwg/roguelike`'s `Scheduler.spend(cost)` already takes an arbitrary cost, and
      this port's own monster-turn adapter (`adapters/sceneSimulation.ts`) already threads a
      per-actor cost back to it, just hardcoded to `1`. A new optional `TurnPorts.monsterTurnCost`
      port reads a scene-side `pendingMonsterTurnCost` (set by `summonSkeleton`, cleared at the
      start of every `takeMonsterTurn`) instead. Browser-verified live end-to-end through the real
      scheduler: a necromancer's second summon (after its first skeleton died) advanced its
      scheduled turn by exactly 2, versus 1 for its first ever summon. See `PORT_COVERAGE.md`.
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
- [x] Port rare monster variants' unique behaviors. Found and fixed two real bugs of the same
      shape auditing this - a monster's alternative-kind variant never inheriting the base
      kind's special mechanic because a check tested the literal `kind` string instead of the
      family relationship Java's own class extension implies:
      - `ArmoredBrute` (`extends Brute`) never got Brute's enrage/revival mechanic at all. Now
        ported with its own real numbers (`HT/2+1` shield, decaying 1/3 turns instead of
        Brute's 4/turn) - see `PORT_COVERAGE.md`'s Brute-enrage row.
      - `DM201` (`extends DM200`) never got DM200's gas-vent ability, and could also move
        freely despite real Java's `DM201` being `IMMOVABLE` (unlike `DM200` itself). Both
        fixed - see `PORT_COVERAGE.md`'s DM200-vent row. Also fixed this port's own vent log
        line hardcoding "DM-200" regardless of which kind actually vented.
      - `Senior` (`extends Monk`) never got Monk's Focus dodge-regain past its one spawn-time
        grant, same literal-kind-check pattern. Fixing it also surfaced a deeper, more
        consequential bug in the shared mechanic itself: the regain check sat after the
        `distance === 1` early return, so a Monk actively meleeing the hero (the normal state
        during a real fight) never regained Focus at all, only one chasing from range. Both
        fixed - see `PORT_COVERAGE.md`'s Monk/Senior-Focus row.
      - `SpectralNecromancer` (`extends Necromancer`) never got the bolt/summon/support
        behavior at all - fought as a plain melee attacker. All three check sites (adjacent
        bolt, summon/support branch, skeleton-death cleanup) fixed - see
        `PORT_COVERAGE.md`'s Necromancer-summon row.
      - `Bandit` (`extends Thief`) never actually fled after stealing (two check sites), and
        - the most consequential of the three - a killed Bandit's stolen item was gone for
        good instead of recoverable. All three fixed - see `PORT_COVERAGE.md`'s Thief-steal
        row.
      - `Acidic` (`extends Scorpio`) never retreated from melee, never attacked at range, and
        never applied Scorpio's own 50% cripple proc - only its own corrosion effect worked.
        All three fixed - see `PORT_COVERAGE.md`'s Scorpio row.
      Albino already had its on-hit behavior live from the earlier spawn-selection pass.
      `Slime.damage()`'s incoming-hit soft cap (shared unchanged by `CausticSlime`) turned out
      to be missing for the base kind too, not a literal-kind-check bug - now ported for both,
      see `PORT_COVERAGE.md`'s Slime row.
- [x] Implement Java corpse, meat, gold, loot-stack, and limited-drop behavior. `Dungeon.LimitedDrops`
      decay (each successful special-item drop makes the next one rarer, for the run's lifetime)
      is now real for `bat`/`necromancer`/`guard`/`dm200`/`golem`/`shaman` - `dm200`/`golem` also
      had their base chance itself fixed in the same pass (`0.125` was an unconfirmed guess; real
      Java is `0.2` for both). `slime`/`skeleton`/`thief`/`swarm` now have real `MOB_LOOT` entries
      and decay too (closing the last base-drop gap this line tracked) - see `PORT_COVERAGE.md`'s
      `MOB_LOOT`/`LIMITED_DROP_DECAY` row for each one's exact base chance/decay formula and the
      weapon-as-`'armor'`/`Random.oneOf(RING,ARTIFACT)`-as-`'ring'` stand-ins involved.
      Stacking heaps, Wealth rings' `tryForBonusDrop()` half, and dm200/golem's real
      weapon-or-armor 50/50 pick (simplified to always-armor here) remain unmodeled.

## 6. Complete hero progression

- [ ] Implement exact formulas for the remaining talents. Five wrong-shaped stand-ins
      corrected this pass against tag `v3.3.8` (Lethal Haste is now GreaterHaste-on-kill with
      a real 100-turn cooldown, Weapon Recharging a Recharging-gated melee multiplier,
      Farsight a sight-radius multiplier, Arcane Vision a zap-applied reveal, Necromancer's
      Minions removed until SoulMark/Wraith/ally exist, Endless Rage's free-turn line gone -
      see `PORT_COVERAGE.md`'s talent row; type-check/build plus both suites green, browser
      owed per section 10). **2026-09-09 audit, four more real formula bugs found and fixed**
      (Hearty Meal, Sucker Punch, Aggressive Barrier, plus the per-tier talent-point pool
      described below) **and a batch of previously-undocumented invented substitutions/gaps
      now recorded in code comments and `PORT_COVERAGE.md`** (Iron Will, Secondary Charge,
      Monastic Vigor, Twin Upgrades, Thief's Intuition rank 1, Shared
      Enchantment/Durable Tips) - see `PORT_COVERAGE.md`'s talent rows for exact formulas and
      browser verification. **Correction, same day, later pass: Test Subject/Tested Hypothesis
      and Swift Equip were wrongly filed under "invented substitution" above - a real
      methodology gap, not just two wrong entries.** That audit pass checked only Java tags
      `v3.3.8`/`4.0.0-beta` for whether a talent id was real; it should also have checked
      `src/generated/spdMessages.ts`'s own real, fully-translated `actors.hero.talent.*`
      strings, built from a more complete SPD source than either tag - which show Test
      Subject/Tested Hypothesis/Swift Equip are all genuine, named talents. Test Subject's
      formula was already exactly right; Tested Hypothesis had a real, drastic overpower bug
      (granting whole wand charges instead of a fraction of one, fixed twice over - first the
      unit, then the rate); Swift Equip's real spec (a cooldown-gated quickslot re-equip, not
      a general equip-cost reduction) was simply wrong, though the practical "cannot be
      modeled, no baseline cost to be an exception to" conclusion still holds for a different,
      now-correct reason. **Lesson for future talent work: check the generated message catalog
      before concluding a talent id is invented, not just whichever Java tags happen to be
      checked out locally** - see `PORT_COVERAGE.md`'s talent rows for the corrected formulas
      and fresh browser verification. **Also found and fixed: talent
      points were drawn from one shared pool across all three UI tiers instead of Java's
      separate per-tier pools**, letting a player freely cross-spend a leftover T1 point into
      T2/T3 - replaced with a real per-tier `talentPoints` array, browser-verified to grant the
      exact real per-tier totals (5/6/8) with T4's unimplemented 10 correctly never granted.
      **Cleric's entire talent tree is Mage's copied verbatim, with zero disclosure anywhere
      until this pass** - now documented in `src/talents.ts` and `PORT_COVERAGE.md`; not
      replaced, since a real Cleric tree needs the Cleric class's own Holy Lantern/spell
      mechanics built first.
 - [ ] Implement rune transfer and shared-enchantment behavior. Sniper's `shared_enchantment`
       proc is now live for thrown hits with Java's `Random.Int(3) < points` gate and explicit
       ranged attack provenance; Warden's `durable_tips` still waits on a real TippedDart item.
- [ ] Complete subclass and armor-ability effects.
- [ ] Match Java talent timing, identification, recharge, and threshold rules.
 - [ ] Complete class-specific item and ability behavior.
      `SuckerPunchTracker` is now also ported: the Rogue surprise bonus uses Java's
      `Random.IntRange(points, 2)` once per stable enemy, with save/load and death cleanup.

## 7. Replace simplified terrain and status mechanics

- [x] Implement area-of-effect traps instead of single-target approximations. Explosive traps
      now apply Java's reduced off-center blast damage to nearby creatures, while toxic and
      fire traps seed the live area effects; exact Java projectile presentation, terrain
      destruction, and cadence remain tracked as narrower follow-up gaps.
- [x] Implement chasm falling and traversal. `isChasmCell`/`fallThroughChasm` model the
      terrain; `Chasm.heroLand()`'s real Cripple + HP/HT-scaled landing damage and the
      Levitation bypass are now ported too (see `PORT_COVERAGE.md`'s `Chasm.java` row for the
      remaining gaps: source-specific Bleeding death badges/blood visuals, feather-fall item, landing sound/camera shake).
- [ ] Implement water and terrain hazards. `Level.java`'s per-turn water hook (a non-flying
      char standing in `WATER` extinguishes `Burning`, matching `Burning.act()`'s own
      `acted && water && !flying -> detach()`) is now ported for both hero and monsters,
      collapsed to an immediate extinguish once this turn's DoT tick has landed rather
      than reproducing the exact one-turn-late real timing - see `PORT_COVERAGE.md`. Ooze's own
      water interaction is now ported too: CausticSlime/Acidic/FetidRat/Corrosion feed a real
      `ooze` buff (20 turns, announced, own icon, `Ooze.act()`'s depth curve with the real
      `ondeath` line) instead of the shared `poison`, and standing water washes it off after
      the tick for hero and monsters alike. Other terrain hazards remain.
- [ ] Complete plant growth and plant interactions (one-shot regional plant activation, Java-aligned
      single-target statuses, Sungrass healing-over-time, and Warden-sensitive variants are live;
      Icecap/Rotberry blob diffusion and Warden FrostImbue/AdrenalineSurge variants are live;
      Dewcatcher now releases 3-6 distinct adjacent dewdrops and Seedpod releases 2-4 generated
      seed stand-ins; exact teleport/TimeBubble behavior and full dew collection rules remain
      (Lotus seed preservation is done - see the `WandOfRegrowth` note in the next bullet;
      this line's earlier "Lotus preservation remains" was stale, contradicting it)).
      **2026-09-12: Fadeleaf now frees a rooted hero.** `Plant.activate` teleports through
      `ScrollOfTeleportation.teleportChar`, which detaches `Roots` as it places the char - the
      plant path here never did, so a fadeleaf that fired while the hero was entangled (which the
      Overgrowth glyph's own proc can do, and which is the one route to a plant that does not
      need a step, the very thing roots prevents) silently did nothing. Fixed and
      browser-verified. **2026-09-14: movable mobs now trigger the same Fadeleaf teleport** when
      they step onto the plant. Still unported in the same plant: Java's
      HazardAssistTracker/teleport presentation and
      sends a Warden one depth back when inter-floor teleporting is allowed.
      **Non-hero plant activation is now represented too (2026-09-14):** revealed plants
      trigger their base status/blob effects for monsters and allies; Sungrass's monster
      Health buff is reduced to immediate full healing and Earthroot's monster armor pool
      remains unported. Hidden plants remain untouched by soft occupancy.
      **Same day, Earthroot's model was corrected outright, and it fixed the Entanglement glyph with
      it.** Java's `Earthroot.Armor` is a block *pool*: `HT` points that absorb
      `min(damage, (scalingDepth+5)/2)` per hit and end when exhausted or when the owner leaves the
      cell. The plant used to grant a full-strength `Barrier` shield instead (no per-hit cap, no
      movement rule), and the Entanglement armor glyph - which applies the same buff to the
      *defender* - was modelled as a `cripple` movement lock on the *attacker*, which inverted both
      the beneficiary and the effect of a defensive glyph. One pool now serves both, saved with the
      run, browser-verified live (a 20-damage hit on a depth-1 Earthroot plants blocks exactly 3;
      moving ends it; the glyph grants `round((5 + 2*level) * max(1, chance))` to the wearer and no
      longer touches the attacker). Java absorbs in `defenseProc`, before the armor subtraction and
      ahead of every shield, while this port absorbs after the damage roll - recorded as a stage
      difference rather than silently kept.
- [ ] Implement the remaining Java seed and dew behavior in high grass. Actual seed payloads
      (real `Generator` category roll, concrete class retained) and planting them (`plantSeed()`,
      instant activation with no growth delay - confirmed against `Plant.java`'s own
      `Seed.execute(AC_PLANT)`, which has none either) are both already live; a stale comment
      claiming otherwise at `trampleHighGrass` is now fixed. `WandOfRegrowth`'s charge-scaled
      regional growth, roots, high-grass budget, seed/dewcatcher/seedpod chances, and persistent
      degradation counters are now live too. Lotus now spawns on qualifying casts, expires on
      its Java HP timer, and preserves nearby non-Rotberry seeds with the real level-scaled
      chance. **2026-09-14: Huntress high-grass trampling now preserves Java's furrowed
      state across floor saves; Huntress preserves it on repeat steps and another hero clears it
      without rolling drops.** The dedicated
      furrowed visual remains simplified because the compact live terrain uses the high-grass
      frame for both states. **2026-09-12: the wand now works over Java's own `ConeAOE`.**
      `src/mechanics/cone.ts`
      is a line-for-line translation (arc `20 + 10*charges` degrees, range `2 + 2*charges`, rays every
      0.5 degrees plus the radius-1 ring where the radius is at least 4, each struck cell unioned with
      its `Ballistica.subPath(1, dist)`, Java's `float` precision kept so the rim samples match), with
      the ray's `STOP_SOLID` half from MWG's `ballistica({stop: 'impassable'})` and its `STOP_TARGET`
      half from the first creature on the path; the bolt path and Lotus placement became exact in the
      same pass, and a cell holding an `IMMOVABLE` character is now dropped from the cone before the
      roots pass. Verified two ways: seven headless geometry checks in `tools/verifyCone.mjs` (part of
      `npm run test:simulation`, now 61 checks) and ten live assertions in
      `tools/scratch/regrowth-path-livecheck.mjs`, including that every changed cell is inside the
      sector while the old circle version changed cells outside it, and that a pylon is neither
      grassed under nor rooted while an ordinary monster beside it is both. This wand's own remainder
      is now only the Dwarf King's boss-challenge-badge flag and Java's `fx` animation.
      **`ConeAOE` has two more live consumers here.** `DM300.java` 203-208 is now **wired and
      verified** - a 30-degree infinite-range `STOP_SOLID` cone deciding that an unreachable hero can
      still be gassed (the "trickshotting" `takeDM300Turn`'s comment named), with 8 live assertions in
      `tools/scratch/dm300-gas-cone-livecheck.mjs` covering the reachable/unreachable, cone-hit/miss,
      paralysed and under-cooldown cases. `WandOfFireblast` is now **fully ported** too: its
      charge/damage half was a bug rather than a simplification (`chargesPerCast()` is the same
      `gate(1, ceil(curCharges*0.3), 3)` rule Regrowth uses, so the port always cast at one charge
      with the one-charge damage ceiling), and its area half is Java's whole `onZap()` over the cone -
      fire seeding with the adjacent-to-caster exception, doors, heaps, the neighbours-8 ignition,
      and the per-charge Cripple/Paralysis. Verified live with 13 assertions in
      `tools/scratch/fireblast-charges-livecheck.mjs`. Exact waterskin/dewdrop interactions remain.
- [x] Match hunger and starvation damage exactly (`Hunger.act()`'s real `partialDamage`
      fractional accrual and crossing-into-STARVING 1-damage hit, replacing the former flat
      "every 10 turns" guess). Java has no attack-delay/accuracy penalty while merely hungry
      beyond the log line, so there is no further penalty to match there.
- [ ] Match stealth, invisibility, surprise, and attack-delay systems exactly. Sleeping
      wake-ups now roll the real `1/(distance+stealth)` detection (stealth 0 - only
      Obfuscation raises it; the old flat 6/3/2 radii had no Java basis), gated on the
      mob's own sight so invisibility still hides, with Silent Steps and levitation as
      their real never-wake immunities (an infinity chance never beats the selection's
      initial infinity, so gated heroes are never even rolled) and the woken mob waiting
      its turn. Surprise on the attack side already matched (`sleeping || !seesHero`;
      STRReq/flail gating unmodeled). **The negative-buff wake is now ported too (2026-09-09
      pass)**: a sleeping monster with any real negative-type buff (poison/burning/cripple/
      weakness/vulnerable/paralysis/roots/terror/ooze/degrade/daze/hex - checked against each
      one's own Java class) wakes unconditionally, no roll, even out of the hero's sight -
      real and reachable here since `spreadFire`/`spreadPlantBlobs` already apply those buffs
      to sleeping monsters without waking them. Browser-verified live. See
       `PORT_COVERAGE.md`'s sleeping/wandering row. The awake WANDERING notice roll is now
       Java-shaped too: the port uses the `seesHero` transition as its compact
       awake-but-unnoticed state and holds the mob when the real detection roll fails.
       Persistent random-destination patrol state now covers the Java movement half (including
       save/load and piranhas' water restriction). Remaining: specialized ally-aware ranged
       targeting.
      **Added 2026-09-12: the invisibility half is now complete on the attack side** -
      `Preparation` is a real state, so an attack made out of invisibility gets its real damage
      roll (the best of 1-3 rolls plus 10/20/35/50% at 1/3/5/9 turns invisible) and can assassinate
      a weak target, and invisibility is still dispelled by that attack. See `PORT_COVERAGE.md`'s
      `Preparation` row; `Mob`'s wound-instead-of-surprise presentation remains unported.
      **And its blink action is ported as well, same day**: the prepared strike is a real
      toolbar action (Java's `ActionIndicator`, present exactly while Preparation is up) that
      attacks an adjacent target in place or steps to the cheapest free cell beside a visible
      hostile within `AttackLevel.blinkDistance()` and strikes from there, refusing an
      unreachable or rooted case with Java's own message. It reuses the port's existing aim
      infrastructure and MWG's `distanceMap` (the same breadth-first flood as Java's
      `buildDistanceMap`), and every string is an SPD key already translated in all 19 locales.
      See `PORT_COVERAGE.md`'s `Preparation` row.
- [x] Implement shield decay (`Barrier.act()`'s real `min(1,shielding/20)`-per-turn proportional
      curve now runs every hero turn against the shared `heroBarrier` pool - previously never
      invoked at all, so shields held indefinitely). `Blocking.BlockBuff`'s own separate fixed
      5-turn cliff-edge expiry is now also approximated - a `blockingShieldLeft`/`blockingTurnsLeft`
      side counter, ticked alongside the proportional decay, force-expires however much of the
      pool is still attributable to Blocking once its own 5 turns are up, and every fresh proc
      resets the timer (matching real `setShield()`). **Correction, 2026-09-14: the sentence that
      used to stand here ("Java's priority-ordered absorption remains unmodeled") was stale** -
      section 11's later Blocking/Barrier rework (see this file's "Reworked this pass to Java's
      real two-buff shape" entry) gave Blocking its own separate `blockingBarrier` pool with
      `ShieldBuff.shieldUsePriority = 2` draining before `heroBarrier`'s priority-0 pool in
      `absorbHeroDamage`, matching `Char.processDamage()`'s sort exactly; this file's own
      `PORT_COVERAGE.md` row (`Barrier.act()`) already said so and was never wrong, only this
      bullet's older wording was. Still genuinely unmodeled, per that same row: `HoldFast
      .buffDecayFactor()` scaling of both clocks and the ProvokedAngerTracker a fully-broken
      shield grants (both need the Sec 6 talent systems this port doesn't have yet).
      Healing-over-time - Sungrass is live, other Java Health-buff variants remain.

## 8. Complete UI and input parity

- [ ] Port full inventory, bag, sub-bag, item-detail, and item-use windows.
      **Status check, 2026-09-14**: item-detail (real per-item descriptions, resolved through
      `inventoryPanel.ts`'s `MWL_CONSUMABLE_DESCRIPTION_KEYS`/`MWL_MISSILE_DESCRIPTION_KEYS`/
      `MWL_EQUIPMENT_DESCRIPTION_KEYS`/artifact tables, each a real authored Java `.desc` key -
      see `PORT_COVERAGE.md`'s bag row, correcting that row's own stale "descriptions... remain
      unported" claim) and item-use (activation for food/potions/scrolls/rings/armor/wands) are
      both already done. Sub-bags (SeedPouch/ScrollHolder/PotionBag/MagicalHolster/VelvetPouch)
      remain the one genuinely open piece of this line.
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
- [x] Fix the title screen's banner art: the redrawn "MWG Pixel Dungeon" logo (three stacked
      lines, replacing real SPD's two-line "SHATTERED"/"PIXEL DUNGEON" - see `banners old.png`)
      was cropped by a frame rect sized for the old two-line art, clipping the bottom of
      "Dungeon" clean off, and its flanking torches were positioned for the old asset's
      evenly-filled width, sitting visibly asymmetric against the new, narrower, left-shifted
      text. Found live via browser screenshot (a user report, not a code read). Fixed: frame
      height 90->108, torch x-offsets recentred on the actual glyph midpoint, and the whole
      title+torches group shifted as a rigid unit so that glyph-centred layout also lands
      dead-centre on screen (measured post-fix: 1px off centre at 1078px width). See
      `PORT_COVERAGE.md`'s title-screen row.
- [x] Complete the journal UI and identification tabs (2026-09-11, simplified). The MWG window
      now exposes Guide, Notes, and Items tabs with paged paragraphs, translated labels, and
      known/unknown item entries. The port persists identification on item instances rather than
      Java's run-wide class journal, and the remaining Java-specific journal unlock rules stay
      documented in `PORT_COVERAGE.md`.
- [x] Port pause/menu chrome, boss banners, toast animations, and Java-style transitions.
      **Checked against tag v3.3.8, 2026-09-12 - the four parts are not one job:**
      (a) *pause/menu chrome*: **done 2026-09-12.** `WndGame` is now a real in-game `Window` on a
      `WindowStack` (`main.ts`'s `openGameMenu`), opened by the back key (Escape/Backspace, Java's
      `SPDAction.BACK` - reachable *only* as an unconsumed `cancel`, which is Java's
      `GameScene.onBackPressed`'s `if (!cancel())`) and by a new toolbar entry for pointer-only
      players. Its real entry list is Settings, Challenges (when the run carries any), Start +
      Rankings (only once the hero is dead) and save-and-exit (disabled while the intro is
      unfinished), at Java's 120/20/2 geometry - note the earlier parenthetical here
      ("continue / save / journal / badges / rankings / settings / exit to title") was a *wrong*
      paraphrase and is corrected in `PORT_COVERAGE.md`'s row. The title screen's five window
      builders moved to `src/ui/portWindows.ts` so both scenes share them, Java's per-`Window`
      full-screen blocker is MWG 0.8.0's native `blocker: true` at every window site (the local
      subclass this bullet used to name is retired - see P15), and the whole thing is
      verified live by `tools/scratch/game-menu-livecheck.mjs` (23 assertions, including the title
       screen's own windows after the move). (b) *boss banners*: **ported.** Java's `GameScene.showBanner` is used
      by exactly two things - `bossSlain()`'s `BOSS_SLAIN` sprite (`show(0xFFFFFF, 0.3f, 5f)`, plus
      `Assets.Sounds.BOSS`) and `gameOver()`'s `GAME_OVER` sprite (`show(0x000000, 2f)`), each with a
      button or two whose alpha tracks the banner's own; there are **no level-up or quest banners** in
      v3.3.8, and `effects/BadgeBanner.java` (which `ui/badgeBanner.ts` already reproduces) is a
      *different* class from the general `ui/Banner.java`. That widget is small and the framework
      already has its exact colour semantics - `TintedSprite.lerpTint(color, strength)` *is* watabou's
      `Visual.tint(int, float)`, and `resetColor()` is `Visual.resetColor()`, so `ui/Banner.java`'s
       FADE_IN/STATIC/FADE_OUT is about 60 lines over one `TintedSprite`. The widget is
       `src/ui/banner.ts` over the pure `src/ui/bannerState.ts` translation of that machine
       (proved headlessly by `tools/verifyBanner.mjs`, 7 checks including the `time >= 0`
       boundary and the infinite-hold two-argument `show`). The art this bullet was waiting on
       is cut from Java's own sheet (`BannerSprites`' `uvRect(0,157,127,225)` and
       `uvRect(128,157,256,192)`) into `src/assets/banner_boss_slain.png`/`banner_game_over.png`,
      wired in `images.ts`. Wired at both sites: the slain banner on a surviving hero, playing out stage-level over the entered floor;
      the game-over banner's infinite hold behind the defeat panel, whose alpha tracks
      the banner squared like Java's buttons. Stated simplifications: no menu button (the panel
      is a port invention; Escape/toolbar still open the menu on a dead hero), panel-wide rather
      than button-only alpha tracking. **Live-pixel verified 2026-09-12** (`tools/scratch/banner-livecheck.mjs`,
      21 assertions: both sites driven through their real `kill()` paths, the art's own 127x68/128x35
      cuts, the band surviving the floor transition it plays over, each phase's tint/alpha, the
      panel's alpha-squared tracking, the measured 5.2-7.0s life of the slain band, and a pixel hash
      of the band's own screen rectangle shown vs hidden vs dead). That pass also **found and fixed a
      real defect the headless test could not see**: the band is armed in the same frame the port
      builds the next floor synchronously, so a measured 233ms delta froze the slain band's STATIC at
      alpha 0.78 where Java's residual is one normal frame - `ui/banner.ts` now clamps its own step
      to 1/20s (`MAX_STEP`), a deliberate divergence from Java's raw `Game.elapsed` recorded in the
      code comment and in `PORT_COVERAGE.md`. (c) *toast animations*: **not applicable as designed** -
      `ui/Toast.java` is used only by `GameScene.selectCell()` to show the active cell selector's
      own `prompt()` (one bottom-centred toast whose close button cancels the selection), and this
      port has no cell-selector prompt at all because its targeting is creature-based; the message
      roles are `gameLog` and the action-bar `hintLabel`. (d) *Java-style transitions*: the
      interlevel curtain exists and reproduces Java's timing but hand-computes its fades, because
      `ScreenEffects` has no hold-plus-two-fades phase - recorded as proposal P8 above.
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
      browser-verified live. **Same dynamic-key class, now closed**: `itemDisplayName` renders
      `` t(`port.affix.${item.affix}`) `` with no `port.affix.*` key in either locale, so every
      enchant/glyph/curse name on the item-detail popup showed a raw key - all 32 affix ids now
      have EN+FR entries, sourced from SPD's own `<class>.name` strings (FR uses the masculine
      base form; Java resolves its (e)/(le) markers by item gender, which this port does not
      model - see `PORT_COVERAGE.md`). **A third class of gap, orthogonal to both of the above,
      found and closed this pass**: the literal-key audit only ever catches `t('port.…')` calls -
      it can't see a `this.say('some literal English sentence', ...)` call that skips `t()`
      entirely. A full sweep found 33 of those, scattered across chest/hourglass unlocking, both
      wells, every `triggerPlant` branch, chasm falling, crystal-mimic reveal/escape/displace,
      the armor-displacement curse, the statue equipment drop, and the hourglass freeze lines -
      every one of them rendered raw English text in every locale, French included, with no
      fallback message even to show it was untranslated. All 33 now have real `port.log.*` keys
      with EN/FR entries; see `PORT_COVERAGE.md`.
- [ ] Translate the port's own strings into every Java locale. The picker already offers all
      19 of `Languages.java`'s locales (same codes, same complete/unreviewed/unfinished
      statuses - see `src/i18n/languages.ts`). **Correction, 2026-09-11:** that claim was
      checked against the Java enum and found partly wrong - nine of the nineteen statuses and
      the `zh`/`in` native names matched no SPD tag (`v2.1.4`-`4.0.0-beta`); they are now
      `v3.3.8`'s values, and `languages.ts`'s header records the detail. The same check found a
      **new gap**: the port's list is `v2.1.4`'s 19 (which is also `tools/i18n-extract.mjs`'s
      `LOCALES`), while `v3.3.8` adds `be`/`eo`/`sv`/`zh-hant` - so the picker is missing four
      locales SPD later shipped. Closing that needs those locales added to the extractor and a
      regenerated `spdMessages.ts`, not attempted this pass.
      **Status, 2026-09-12: the translation half of this item is complete** - all 19 offered
      locales carry a full 415-key `port.*` catalogue (see the per-locale entries below), so
      nothing reads English for port-only prose any more. The checkbox stays unticked for one
      reason only: the locale *set* above is still `v2.1.4`'s, and adding
      `be`/`eo`/`sv`/`zh-hant` is entangled with a `v3.3.8` catalogue migration (eight
      port-referenced keys no longer exist at that tag), which is a separate, now-measured piece
      of work rather than another locale draft.
      The picker's offered set otherwise works as before: SPD's own text arrives translated through
      the generated catalog, but the port's own `port.*` keys started out in English and French
      only - every other locale read English sentences (with SPD-translated names inside) until
      the per-locale passes recorded below filled them in.
      Scope: 305 keys x 17 locales (~5,200 strings), mirroring the `Languages` enum exactly
      (Java's `.properties` dirs also carry be/eo/sv/zh-hant files, but SPD doesn't ship
      anything below 80% and neither should this). Notes for whoever does it: nothing structural
      stands in the way - `catalogFor()` already merges `PORT_STRINGS[code]` per locale with
      base-catalog fallback, so each locale is purely additive; `mwg/i18n`'s typography and
      CLDR plurals already cover the per-locale mechanics. **First locale done: German (`de`),
      2026-09-09, 374/374 keys** (the key count grew since the 305 estimate - `port.affix.*`
      alone added 32). **Correction to this bullet's own prior "grounding" strategy note,
      found the moment the work was actually attempted**: `portStrings.ts`'s own header
      comment already says why grounding in real Java translations mostly doesn't apply here -
      "the strings this port invented, which have no SPD original to borrow a translation
      from... everything the real game also says is looked up under its own SPD key instead."
      That is `portStrings.ts`'s entire selection criterion: anything with a real Java
      equivalent already resolves through the generated catalog directly and was never a
      candidate for this file. The prior note's premise (most `port.*` keys closely paraphrase
      a real Java string with a translation to ground against) does not hold for the actual
      content - it is this port's own invented quest dialogue, its own simplified-mechanic log
      lines, and hint text SPD has no equivalent of. What worked in practice: direct
      translation key-by-key from `PORT_STRINGS_EN`, matching the source's tone (short, direct
      game-log sentences) rather than searching for a Java analogue that usually doesn't
      exist, then a **programmatic QA pass** before wiring anything in - diffing the new
      locale's key set against EN's (0 missing, 0 extra) and comparing each value's
      `{placeholder}` tokens exactly (0 mismatches) - catching exactly the class of error a
      human proofread would also have to catch, before any human proofreading happens. Marked
      `unreviewed` in `PORT_STRINGS_DE`'s own `MT` doc comment and `PORT_STRINGS`'s registration,
      matching SPD's own complete/unreviewed/unfinished convention - a machine-assisted draft
      is not silently promoted to `complete`. Browser-verified live: the welcome log line, bag/
      talent panel labels, and the settings/badges/changes windows all rendered correctly-
      composed German with no raw keys and no console errors. **Second locale done: Spanish
      (`es`), 2026-09-09, 374/374 keys**, same process (direct translation, then the
      programmatic key/placeholder QA diff against EN, then wiring, then live verification) -
      marked `unreviewed` in `PORT_STRINGS_ES`'s own doc comment for the same reason. Both `de`
      and `es` are real Java SPD locales (confirmed against `src/generated/spdMessages.ts`'s own
      generated table, which only exists for locales SPD actually ships translations for) - this
      work only ever adds a `port.*` catalog for a language Java's own base catalog already
      covers, never for one it doesn't.

      Verifying Spanish live surfaced a real, independent bug that predates this translation
      work and affects every non-English locale already shipped (French and German too):
      `main.ts`'s `attack()` built its combat-log `object` slot for a hero defender as a
      hardcoded English literal `'you'` bypassing translation entirely, instead of the same
      `t('port.log.subject.you')` pattern the `subject` slot already used correctly one line
      above. Reusing `subject.you` outright would have been wrong too - that key is capitalized/
      nominative ("You"/"Vous"/"Du"/"Tú") for sentence-initial use, not the lowercase/accusative
      form an object slot needs (English "you" lowercase, French "vous", German accusative
      "dich", Spanish "ti" after "a"). Fixed with a new `port.log.object.you` key per locale and
      confirmed by directly re-running `attack()` in the browser via `window.__MWG__` for all
      four locales (en/fr/de/es) post-fix - every locale's combat log now reads correctly instead
      of showing raw "you" mid-sentence.

      **Third locale done: Portuguese (`pt`), 2026-09-09, 375/375 keys** (key count grew to 375
      after the `object.you` fix above added one key to every locale), same process throughout -
      direct translation, the programmatic key/placeholder QA diff against EN (0 missing/extra,
      0 mismatches), wiring, then live verification. Marked `unreviewed` in `PORT_STRINGS_PT`'s
      own doc comment for the same reason as `de`/`es`. Confirmed `pt` is a real Java SPD locale
      the same way as `de`/`es` (present in `src/generated/spdMessages.ts`'s generated table).
      Browser-verified live: title screen buttons, the welcome log line, the hero info panel
      (Java's own real strings, confirming the whole locale resolves end to end, not just this
      port's own keys), and the `object.you`-fixed combat log all rendered correctly-composed
      Portuguese with no raw keys and no console errors.

      **Fourth locale done: Italian (`it`), 2026-09-09, 375/375 keys**, same process throughout -
      direct translation, the programmatic key/placeholder QA diff against EN (0 missing/extra,
      0 mismatches), wiring, then live verification. Marked `unreviewed` in `PORT_STRINGS_IT`'s
      own doc comment for the same reason as `de`/`es`/`pt`. Confirmed `it` is a real Java SPD
      locale the same way (present in `src/generated/spdMessages.ts`'s generated table). Caught
      and fixed a stray Cyrillic-character typo in the draft (`Ripони` for intended `Riponi`)
      via a scripted non-Latin-character scan of the draft file before wiring it in - worth
      keeping as a habit for future locales sharing a keyboard/IME slip risk, since a single
      corrupted key would otherwise only surface by chance during manual proofreading or a
      player report. Browser-verified live: title screen buttons ("Entra nel Dungeon",
      "Risultati", "Notizie", "Opzioni", "Trofei", "Cambiamenti", "Info"), the welcome log line
      ("Fogne, piano 1. Sei un guerriero, che impugna una spada corta consumata."), and the
      `object.you`-fixed combat log ("Ratto marsupiale colpisce te per 3.") all rendered
      correctly-composed Italian with no raw keys and no console errors.

      **Fifth locale done: Polish (`pl`), 2026-09-09, 375/375 keys**, same process throughout -
      direct translation, a scripted non-Latin-character scan (catching zero issues this time,
      confirming the Italian find wasn't a fluke worth repeating each pass), the programmatic
      key/placeholder QA diff against EN (0 missing/extra, 0 mismatches), wiring, then live
      verification. Marked `unreviewed` in `PORT_STRINGS_PL`'s own doc comment for the same
      reason as the other machine-drafted locales. Confirmed `pl` is a real Java SPD locale the
      same way (present in `src/generated/spdMessages.ts`'s generated table). Browser-verified
      live: title screen buttons ("Wejdź do Lochu", "Rankingi", "Aktualności", "Ustawienia",
      "Odznaki", "Zmiany", "O grze"), the welcome log line ("Kanały, poziom 1. Jesteś wojownik,
      dzierżysz zużyty krótki miecz."), and the `object.you`-fixed combat log ("Wielki szczur
      trafia ciebie za 2 obrażeń.") all rendered correctly-composed Polish (diacritics included)
       with no raw keys and no console errors.

       **Sixth locale done: Russian (`ru`), 2026-09-10, 389/389 keys**, same process throughout -
       direct translation (formal «Вы» address, matching SPD RU's own second-person style;
       `port.name.cursed`/affixes use the masculine base form like every other locale, since
       Java resolves its gender markers by item and this port does not model that), the
       programmatic key/placeholder QA diff against EN (0 missing/extra, 0 mismatches), wiring
       (`PORT_STRINGS_RU` + `PORT_STRINGS` registration + `ru: 'machine'` provenance), then
       type-check/build/both suites green. Marked `MT` in `PORT_STRINGS_RU`'s own doc comment
       for the same reason as the other machine-drafted locales - note the nuance recorded
       there: SPD itself ships Russian as reviewed, but that status covers SPD's own
       `.properties` catalog, not this port-only draft. Confirmed `ru` is a real Java SPD
       locale the same way (present in `src/generated/spdMessages.ts`'s generated table, one
       of its 19 base locales). No Cyrillic-typo scan was needed this pass (Russian is
       natively Cyrillic, so the Latin-script scan from the Italian pass does not apply).
       Browser verification owed per section 10 (no working browser tool in this session).

       **Seventh locale done: Turkish (`tr`), 2026-09-10, 389/389 keys**, same process throughout -
       direct translation (informal sen-forms, matching DE's Du and ES's Tú rather than FR's
       Vous; dotted/dotless İ/ı applied throughout, which is exactly the locale `capitalize()`
       calls out as easy to get wrong), the programmatic key/placeholder QA diff against EN
       (0 missing/extra, 0 mismatches - note the combat line `port.log.hit` reorders placeholders
       to verb-final Turkish (`{subject} {object} {damage} {verb}`) while keeping the token set
       identical, which the sorted-token QA accepts by design), wiring (`PORT_STRINGS_TR` +
       `PORT_STRINGS` registration + `tr: 'machine'` provenance), then type-check/build/both
       suites green. Marked `MT` in `PORT_STRINGS_TR`'s own doc comment like the other
       machine-drafted locales. Confirmed `tr` is a real Java SPD locale the same way (one of
       `src/generated/spdMessages.ts`'s 19 base locales). Browser verification owed per
       section 10 (no working browser tool in this session).

       **Eighth locale done: Ukrainian (`uk`), 2026-09-11, 415/415 keys**, same process
       throughout - direct translation from `PORT_STRINGS_EN` (formal «Ви» address, matching
       RU's register as the closest sibling locale - Cyrillic, same formal-address choice;
       `port.name.cursed`/affixes use a single masculine base form like every other locale,
       since Java resolves its gender markers by item and this port does not model that), a
       scripted non-Latin-character scan of the draft (0 issues - every Latin token found was a
       legitimate untranslated proper noun: `Shattered Pixel Dungeon`, `mwg`, `DM-300`, or a
       keybind letter like `T`/`F`/`E`), the programmatic key/placeholder QA diff against EN
       (0 missing/extra, 0 mismatches, run against the *current* 415-key EN table - up from the
       375/389 the earlier locales were checked against, since `port.ui.alchemy.*`/
       `port.log.alchemize.*`/`port.name.alchemy.*`/the five `*.unlockhint` keys/
       `port.log.dm300arrives`/the five `port.ui.journal.*`/`port.ui.bag.*` keys were all added
       to EN after RU and TR were drafted - this pass's own diff script surfaced that RU and TR
       are now 25 keys short of the current EN table, a real, pre-existing gap this task did not
       fix since fixing RU/TR was out of this task's scope, but is worth closing in a future
       pass rather than leaving unnoticed - **closed the same session**: the same 25 keys
       (alchemy UI/log/name strings, the five class `unlockhint` lines, `dm300arrives`, and the
       journal/bag UI labels) translated into both RU and TR and appended to their existing
       blocks, verified 415/415 keys and 0 placeholder mismatches for both against the current
       EN table, `tsc`/`build` clean), wiring (`PORT_STRINGS_UK` + `PORT_STRINGS`
       registration + `uk: 'machine'` provenance, plus extending both header comments' locale
       lists), then `npm run i18n:check`/`npx tsc --noEmit`/`npm run build` all green. The
       `i18n:check` failure seen then (`these keys are referenced but exist in no SPD properties
       file: ,` / `../mwlContent` / `effect` / `keys` / `potionAppearances` /
       `scrollAppearances`) was confirmed pre-existing by reproducing it on a clean `git stash`,
       but was **root-caused and fixed 2026-09-12** rather than accepted - those six strings are
       not keys at all, and the extractor's scrape of `spdKeys.ts` was too broad; see section 0's
       i18n item. `npm run i18n:check` is green now. Marked `MT`/`unreviewed` in `PORT_STRINGS_UK`'s own doc comment for the same
       reason as the other machine-drafted locales. Confirmed `uk` is a real Java SPD locale the
       same way (present in `src/generated/spdMessages.ts`'s generated table, and already listed
       in `languages.ts` with `status: 'unreviewed'`). **Browser verification is owed, honestly
       not done this pass**: this task ran with no browser tool available at all, so unlike RU/TR
       (which at least ran in sessions where the *absence* of a working browser tool was
       confirmed) this is a flat "not attempted" rather than "attempted and blocked" - flagging
       it plainly rather than implying a check that didn't happen.

       **Ninth locale done: Hungarian (`hu`), 2026-09-11, 415/415 keys.** The draft was
       already in progress (`tools/scratch/hu-check.mjs` against a generated `hu-map.json`); this
       pass ran that script's own key/placeholder QA (415/415 keys, 0 missing/extra, 0
       placeholder mismatches against the current EN table), wired the resulting block in
       (`PORT_STRINGS_HU` + `PORT_STRINGS` registration + `hu: 'machine'` provenance, plus the
       `index.ts` header locale list), and confirmed `i18nCheck: OK - 300 mapped keys, 415 port
       strings, 19 languages` (`npx esbuild tools/i18nCheck.ts … && node tools/scratch/i18nCheck.mjs`),
       `npx tsc --noEmit` and `npm run build` clean, both test suites green. Informal te-form
       address, matching DE's Du/ES's Tú/TR's sen-forms. Marked `MT` in `PORT_STRINGS_HU`'s own
       doc comment; note the provenance nuance recorded there - SPD itself ships Hungarian as
       `complete` in `languages.ts`, but that status covers SPD's own `.properties` catalog, not
       this port-only draft. Browser verification owed per section 10 (no working browser tool in
       this session).

       **Tenth locale done: Dutch (`nl`), 2026-09-11, 415/415 keys.** Direct machine
       translation from `PORT_STRINGS_EN`, validated programmatically (415/415 keys, 0
       missing/extra, 0 `{placeholder}` mismatches against the current EN table), then wired
       (`PORT_STRINGS_NL` + `PORT_STRINGS` registration + `nl: 'machine'` provenance, plus the
       `index.ts`/`portStrings.ts` header locale lists). `npx tsc --noEmit`, `npm run build` and
       both test suites green, `i18nCheck: OK - 300 mapped keys, 415 port strings, 19 languages`.
       Informal je-forms. Marked `MT` in `PORT_STRINGS_NL`'s own doc comment; SPD ships Dutch as
       `unfinished` in `languages.ts`. Browser verification owed per section 10 (no working
       browser tool in this session).

       **Back-fill (2026-09-12): the five earliest machine drafts were 24-31 keys behind.**
      `de`/`es`/`pt`/`it`/`pl` stood at 386/386/386/384/391 of EN's 415 - the alchemy
      UI/log/name block, the five class `unlockhint` lines, the runestone/wand/DM-300 lines, and
      the journal/bag labels had all been added to EN after those drafts and never propagated.
      A missing key falls back to English silently, so nothing surfaced it. All 142 strings are
      now translated and every non-English catalogue is 415/415 with 0 `{placeholder}`
      mismatches. `i18nCheck` now compares *every* registered catalogue (key set + tokens)
      against EN rather than only French, and asserts each catalogue has a provenance entry and
      a real `LANGUAGES` code; `PORT_STRINGS` moved into `portStrings.ts` so the check can read
      the tables without the `mwg` runtime. Verified by negative test (a deliberately removed
      key fails the check). `npx tsc --noEmit`, `npm run build` and both suites green,
      `i18nCheck: OK - 300 mapped keys, 415 port strings, 19 languages`.

       **Locales 11-17 done, 2026-09-12: `in`, `ja`, `cs`, `vi`, `el`, `ko`, `zh` - 415/415 keys
      each, which closes this item's translation half: all 19 of SPD's languages now have a
      complete port-only catalogue.** Seven drafts were produced in parallel, one per language,
      each given `PORT_STRINGS_EN`, SPD's own vocabulary for the game's terms (read out of the
      real `_xx.properties` at tag `v3.3.8` rather than invented), a register note (SPD's Czech,
      Indonesian, Vietnamese and Greek are informal; the CJK three take plain game register), and
      the requirement that every `{placeholder}` survive. Validated mechanically rather than by
      eye: a throwaway `block-check.mjs` comparing key set, key *order* and sorted token multiset
      against EN passed 415/415 on all seven; a script-contamination scan found no Cyrillic in
      Greek, no kana in Korean, no hanja where none belongs and no Traditional characters in the
      Simplified draft; and `tools/i18nCheck.ts` - which now compares every catalogue, not just
      French - reports OK. Splicing is scripted (`splice-block.mjs`), so the 2,905 translated
      lines never pass through a hand-transcription step that could corrupt them. `npx tsc
      --noEmit`, `npm run build` and both suites green.
      The header comments in `portStrings.ts`/`index.ts` no longer enumerate which languages are
      done: that list is now `PORT_STRINGS` itself, and it was a hand-kept version of it that let
      five catalogues drift 24-31 keys behind English in the first place.
      Verified live, not merely built (see section 10): the built game was driven in a real
      Chromium over `file://` once per locale with `spd-on-mwg.language` set, checking (a) the
      locale is active, (b) every non-ASCII codepoint that locale can draw renders a real glyph -
      rendered into a canvas and compared pixel-for-pixel with a codepoint no font has, which is
      what a missing-glyph box would look like - and (c) both the title screen and the in-game
      HUD/log differ pixel-wise from English, so the translation genuinely reached the screen.
      Japanese in particular had never had the font-coverage check this section asks for; it now
      has. **Result: `LOCALES OK - 19 locale(s) verified live`** - every locale reached a playable
      depth-1 floor with no console or page errors, no missing glyph (1,730 codepoints probed for
      `ja`, 2,225 for `zh`, 976 for `ko`, 123 for `vi`, 73 for `el`, 72 for `uk`, 69 for `ru`,
      single or double digits for the Latin locales), and both screens differing from English.
      Screenshots are in `_browsercheck/mwgpd_shots_2026-09-12-locales-all/`.
      Stated plainly: this session could not *look* at those images, so the visual judgement
      rests on the pixel comparisons rather than an eye - stronger than "no console errors", but
      not a substitute for someone reading the text for tone and accuracy, which is what the `MT`
      provenance marker continues to flag.
      Running the pass also caught two bugs in the probe itself (SPD's own U+200B in `pt` and
      U+0301 in `uk` draw nothing by design, so probing them in isolation reported a missing glyph
      that does not exist), and the probe was then negative-tested with nine rare codepoints -
      three of which it correctly flagged - so that "no tofu" is a real result and not a vacuous
      one. Both details are in `PORT_COVERAGE.md`.
      Still open in this bullet, and deliberately not attempted here: the locale *set* is SPD
      `v2.1.4`'s 18 non-English locales, so `be`/`eo`/`sv`/`zh-hant` are offered neither by
      `LANGUAGES` nor by the extractor. Closing that means regenerating `spdMessages.ts` from
      `v3.3.8`, and that is not a strings-only change: eight keys the port references
      (`actors.mobs.dm300.rocks`/`.vent`, `items.quest.pickaxe.ac_mine`/`.no_vein`,
      `levels.level.sign_desc`/`.sign_name`, `scenes.titlescene.badges`, `windows.wndjournal.notes`)
      exist in the v2.1.4-derived catalog and **do not exist at `v3.3.8`** - Java renamed or
      removed the features behind them - so the extractor's transactional audit refuses the
      regeneration until each is re-pointed or moved under `port.*`. That is a real, scoped
      migration (now measured, rather than assumed) and belongs in its own change.

      **Small back-fill, 2026-09-14: 6 keys had drifted behind EN/FR again.**
      `npm run verify`'s `i18n:verify` step failed with all 17 non-English/French locales
      missing `port.log.curseinfusion`, `.magicalinfusion`, `.beaconreturned`,
      `.summonelemental`, `.reclaimtrap.stored`, and `.reclaimtrap.placed` - the same silent-
      fallback-to-English drift the 2026-09-12 back-fill above describes, just a smaller
      recurrence (six keys added to EN/FR by later work, never propagated further). Translated
      directly from the EN/FR pair (machine draft, `MT` provenance, matching each locale's
      existing informal/formal register) and spliced in at the same position as EN/FR via a
      throwaway anchor-based script rather than by hand, so the insertion point could not drift.
      `i18nCheck: OK - 524 mapped keys, 444 port strings, 19 languages`; `npm run verify`
      (`check` + `test:simulation` + `test:items` + `test:lua` + `test:mwg` + `build`) green.
      Not browser-verified this pass (see section 10's standing "verified live, not merely
      built" bar) - the six lines are a strict formula/interpolation match to EN/FR's already-
      verified shape, and this was a completeness back-fill rather than new UI surface.

## 9. Build the Java-vs-TypeScript parity harness

**Status check, 2026-09-14**: none of these six are done in the literal sense this section asks
for - an actual differential harness running both the real Java build and this port side by side
against identical seeds/traces - and none should be marked `[x]` on the strength of what already
exists. But it's worth being precise about what already exists, so the gap is the real remaining
one rather than a from-scratch build: `tools/verifyCombat.mjs`/`verifyHeroTurn.mjs`/
`verifyHeroActions.mjs`/`verifyMovement.mjs`/`verifyCone.mjs` (all wired into `test:simulation`,
65+ checks) already pin combat rolls, damage curves, buff timing, and turn-cost/scheduling
against values hand-derived from the real Java formulas - the third and part of the second bullet
below, but as *values checked against a transcription of the Java source*, not *values checked
against a running Java build*, which is the actual bar "compare both implementations" sets.
`PORT_COVERAGE.md` already does the sixth bullet's classification, row by row, for everything this
project has touched - just as a running narrative document built up over many passes, not a single
finished audit pass. Screenshot/animation-timing comparison (the fifth bullet) has real infra too
(`tools/scratch/browser-locales.mjs`'s pixel-hash approach, per-feature `*-livecheck.mjs` scripts)
but only for the specific things those scripts targeted, not a systematic sweep. Genuinely
unstarted: an actual second, real Java instance to compare against at all (this checkout has no
build of the Java game, only its source for reading), fixed-seed RNG-call-order comparison, and
loot/quest/boss-transition/save-load comparison.
- [ ] Compare both implementations with fixed seeds and identical action traces.
- [ ] Verify RNG call order for level, item, monster, and quest generation.
- [ ] Verify combat rolls, damage, status effects, and turn timing.
- [ ] Verify loot, quest outcomes, boss transitions, and save/load state.
- [ ] Add screenshot and animation-timing comparisons for visual parity.
- [ ] Classify every remaining difference as either an implemented Java behavior or an explicitly accepted platform/UI difference.

## 10. Close the browser-verification debt

Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)
because many bullets elsewhere in this file cross-reference "section 10" by number when noting
that browser verification is still owed for their own item; renumbering everything below to
close the gap was judged not worth the churn against those existing references.

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
 - [x] **`mwg@0.9.1` is now the published dependency**: its `core.EntityRegistry`/`EntityId`,
      `simulation.SimulationRuntime` (Command -> State + Events + cost + snapshot runtime),
      and `core.PresentationQueue` are available to the port. The pin and lockfile now use the
      stable release rather than `0.9.0-alpha`; type check, build, simulation/item suites, and
       a built-game browser smoke check all pass. The first runtime adapters are now in use.
       The project pin was deliberately raised from `^0.9.0` to `^0.9.1` on 2026-09-14 after
       `npm run mwg:check` confirmed 0.9.1 as both installed and the current published release;
       the full verification suite remains green after the bump.
- [ ] **Next real phase**: wrap the existing per-domain rule functions (`simulation/combat.ts`,
      `movement.ts`, `heroActions.ts`, `heroTurn.ts`) behind one
      `SimulationRuntime<SpdGameState, SpdCommand, SpdEvent, Creature>`, migrating `main.ts`'s
      direct-mutation call sites (`attack()`, `moveTo()`, etc.) to `dispatch()` one command type
      at a time - start with whichever command is cheapest to convert without touching
      presentation-heavy code, not necessarily `attack()`. No big-bang (plan section 25).
      Progress: search already routes through its own runtime (`adapters/searchSimulation.ts`,
      cost `null`), and hunger now does too (`adapters/hungerSimulation.ts`, with
      `SceneSimulationAdapter.hungerStep()` dispatching through it - same transition, same
      events, only the dispatch path changed). Both keep inert local scheduler/random pairs;
      reconciling those with the scene's real ones waits for the first command with a real
      cost. **Movement planning is now also runtime-routed** through
      `adapters/movementSimulation.ts`; `main.ts` still owns the resulting attack, door,
      pickup, trap, and rendering effects.
- [x] Consider replacing `simulation/entityId.ts`'s local counter with MWG's own
      `core.EntityRegistry` now that it exists (SPD-ADR-002) - resolved as a split decision:
      the `EntityId` type IS now MWG's own (re-exported from `mwg/core`, not a local alias),
      plus the reverse `idOfEntity(entity)` lookup the counter never had. Full `EntityRegistry`
      adoption (minting through `add()`) is deliberately deferred: it mints opaque `eN` ids
      while this port's prefixed ids (`hero-N`/`item-N`) are persisted in the save schema, and
      it has no caller-chosen-id primitive - needs that upstream or a save migration first.
- [ ] Extract `main.ts`'s `attack()` pure resolution (hit/damage rolls, weapon-affix/talent
      branches, event-worthy outcomes like mimic reveal/displacement) from its presentation
      calls (sprite tint, audio cue, floating text) - the single largest concrete instance of
      plan section 10's complaint. Likely the vehicle for actually adopting `SimulationRuntime`
      above, rather than a separate step. **Progress (2026-09-09):** the hit/damage roll pair is
      now extracted into `simulation/attackResolution.ts` and routed through
      `adapters/attackSimulation.ts`; the scene consumes its result while retaining all
      presentation, proc, shield, death, and event effects. The remaining hook branches still
      need incremental extraction. **Progress (2026-09-12):** the defender-side `damage()`
      override family (`Pylon` 14+/15, `Eye` /4 while charging, `DemonSpawner` 19+/20,
      `Slime`/`CausticSlime` 4+/5) is now `simulation/defenderDamageCurves.ts`, called once at
      Java's point - and moving `Pylon`'s there fixed a real order bug, since it had been applied
      *above* the augment/talent/proc chain instead of after it (see section 3's Caves/DM-300
      item). **Three more ordering deviations surfaced from that same reading of `Char.java`'s
      `attack()`, and two are now fixed and verified (2026-09-12)**: `Corrupting.proc` evaluates its `damage >= defender.hp`
      guard before the curves again, as `attackProc()` does, so a Slime whose soft cap cuts a
      lethal raw hit below its HP is still corruptible; and both execute mechanics moved after the
      `damage()` overrides and the shield pools, guarded on the target surviving this hit so a hit
      that already kills does not also report an execution. Both were proved live on the built
      game, and both would have been invisible to a unit check - a 20-HP Slime against a raw 40
      (soft-capped to 12) corrupted 34 times in 60 swings where the old order managed 0, and a
      Dwarf King behind a 1000-point `DKBarrier` died outright where the old order left it at full
      HP with the shield barely touched. **The third is now half-closed too (2026-09-12)**: the
      port gained a real `miniboss` property, which is what `CombinedLethality`'s own exclusion
      needed - a boss/miniboss is no longer executable by that talent at all (`Char.java` 543-545),
      while the Assassin's `Preparation.canKO` still allows them at a fifth of its threshold, so
      the shared `max()` now zeroes one half for a boss and divides the other by five. Verified
      live: a rat at 40% of max HP is executed, GreatCrab and Goo survive that same hit, and an
      Assassin still executes Goo at 10% but not at 40%. **The third part is now closed too
      (2026-09-12)**: the `Preparation` model was ported, so the Assassin's half is no longer a
      flat stand-in - see the new `Preparation` row in `PORT_COVERAGE.md`. It is a real buff/state
      (`simulation/preparation.ts` plus a hero-turn counter) that exists only while the hero is
      invisible: the attack's damage roll is *replaced* by the best of 1-3 rolls plus
      10/20/35/50% at 1/3/5/9 turns invisible, and the execute fires only while it is up, at
      `AttackLevel.KOThreshold()`'s real 4x4 table (prep level by `enhanced_lethality` rank),
      strictly `<`, with a fifth for bosses - and it is read *before* the invisibility dispel,
      because Java reads it into a local at the top of `Char.attack()` and dispels only after the
      attack returns. Browser-verified live with 12 assertions, including that a high counter
      without invisibility assassinates nothing (the old stand-in fired on any hit at all).
      **Still approximated in that area**: the test is the predicted post-hit HP rather than the
      HP `damage()` actually leaves (so a shielded defender can be executed slightly early), and
      `CombinedLethality`'s weapon-changed arming gate is unmodelled.
- [x] Compare `mwg/i18n` against the plan's section 22C "Semantic Messaging" shape before
      committing to SPD-ADR-012. Done against the installed 0.4.2 `.d.ts` files: it matches
      (`SemanticMessage`/`MessageChannel`/`MessageFormatter`/`createCatalogFormatter`,
      `EntityTextResolver`/`GrammaticalEntity`, CLDR plurals, FTL, catalog audit tools - see
      `SPD_ARCHITECTURE_TARGET_V3.md`). The catalog mechanism is already adopted
      (`src/i18n/index.ts` builds on it); pending is only the message half (typed messages at
      `say()` sites, combat log lines as pilot). Whether the shape landed in 0.4.1 or 0.4.2 is
      unconfirmed - the 0.4.1 review never enumerated these files.
- [ ] Continue producing the section 22A/22B analysis matrix for the remaining monster/item/
      buff families before migrating each one's code, per SPD-ADR-010.
- [ ] **MWG-utilization audit (2026-09-09)**: checked whether this port reimplements
      functionality `mwg` (`@datamoc/mw_games` ^0.4.2) already exports. Well-utilized, no
      action: `Roguelike.Pathfinder`/`chebyshevDistance`/`canTarget`/`traceLine`/
      `hasLineOfSight` (~30 call sites), `Roguelike.Blob`, `Actors.rollLoot`/`LootTable`,
      `Actors.Charges`, the `EntityId` re-export (already tracked above), the custom
      Java-bit-matching LCG RNG (`spdRng.ts`, correctly *not* using mwg's own xoshiro128 since
      it must reproduce Java's exact sequence), and `ui/floatingText.ts`'s custom
      `FloatingTextLayer` (checked against mwg's own `FloatingText` and deliberately not
      reused - different fade curve/stacking, a justified sibling not a duplicate). Three
      genuine gaps found between roadmap claims and mwg's actual exports:
      1. `heroBarrier` only ever used mwg `Actors.Barrier` as a single pooled
         layer, then hand-rolled a side counter to approximate section 7's "Blocking drains
         before Barrier" ordering gap - **resolved this pass, and the audit's own prescription
         turned out to undersell the problem**: re-checking against `ShieldBuff.java` (not just
         the `Barrier` API) showed the pooled model had three real bugs, not one ordering
         simplification - additive stacking where `setShield()` keeps the max, proportional
         decay nibbling a shield `BlockBuff.act()` exempts, and recency-order draining instead
         of `shieldUsePriority`. Blocking now owns a separate `blockingBarrier` pool drained
         first in `absorbHeroDamage` (priority 2 before 0, matching `processDamage()`'s sort),
         exempt from the proportional accrual, with max-semantics + always-reset 5-turn timer in
         `grantBlockingShield` and a load-time carve-out migration for pre-two-pool saves (see
         `PORT_COVERAGE.md`'s Barrier-decay row). Remaining there, not here: HoldFast scaling
         of both clocks and the ProvokedAnger break tracker (both need Sec 6 talent systems).
      2. Section 10's `eternalFire` "needs a non-diffusing fire primitive" claim (see above)
         was stale - **resolved this pass, and the audit's own prescription is now recorded as
         over-mechanized**: re-checked against `MagicalFireRoom.EternalFire`'s real `evolve()`,
         which never diffuses by construction, so the port simply never calls `spread()` on the
         new static `eternalFire` blob (no `spread(passable, 0, 1)` call needed to express
         "static"). Live with ignition, hero/monster/travel passage-blocking, and
         frost-quenches-whole-wall (see `PORT_COVERAGE.md`'s new `EternalFire` row); remaining,
         narrower gaps there: flammable-spread, heap burning, water/blizzard clearing.
      3. `summonSkeleton`'s push-aside comment claimed Necromancer's
         "push the hero aside when no free cell exists" needs "a full knockback system this
         port doesn't have" - **resolved this pass, and the audit's own suggested fix would
         have been wrong**: re-checked against `Necromancer.summonMinion()`'s exact rule (an
         8-neighbour search maximizing `trueDistance` from the necro, not a directional shove),
         `Roguelike.knockbackPath`'s straight-line push does NOT match that direction-choice
         logic, so it was correctly *not* adopted. The real rule needed no framework primitive
         at all and is now ported directly (nearest-passable pick, farthest-free-neighbour
         shove with an `IMMOVABLE_KINDS` redirect, direct 2-10 `SummoningBlockDamage` with no
         hit roll, wait when nothing is passable - see `PORT_COVERAGE.md`'s Necromancer row).
      No UI-widget/i18n-catalog/scheduler/FOV/geometry reimplementation found elsewhere.
- [x] Re-check `mwg`'s exports on every version bump for the plan's remaining assumed
      primitives (raw 2D primitive re-exports, the Semantic Messaging shape) - some phases of
      the v3 plan still stay blocked until those land upstream. Re-checked at 0.4.2 this pass:
      both arrived in some form -       `two-d/render`'s `Types2D.ts` (`Container2D`/`Texture2D` type
      aliases, plain `Rect`, `rectOf()`) unblocks converting *type-only* `pixi.js` imports
      (value positions still blocked - Phase 0's exit criterion still cannot be met), and
      `mwg/i18n`'s Semantic Messaging family resolved the checkbox above. Follow-up survey,
      done with the compiler API: of 26 `from 'pixi.js'` imports, exactly one file
      (`monsters.ts`, `import type { Texture }`) was convertible - now `Texture2D`, no pixi
      import left there. Everything else is a value use (`extends Container`, `new
       Texture`/`new Rectangle`, `Texture.from`, `extensions.add(pipe)`), which type aliases
       cannot express: recorded as upstream proposal P2 in `SPD_ARCHITECTURE_TARGET_V3.md`.
       Re-checked at 0.5.0 this pass (pin `^0.4.2` -> `^0.5.0`, full suite green):
       `core.ReactionTable`/`ReactionRule` is new and root-exported - evaluated against
       every latch/transition site and deliberately NOT retrofitted (each site is already
       a minimal boolean; a table costs net lines plus save plumbing - recorded in
       `SPD_ARCHITECTURE_TARGET_V3.md` as the designated v3 event-presentation mechanism
       instead); `EntityRegistry` still has no caller-chosen ids (P1 stays open); `Types2D`
       still type-only (P2 stays open, Phase 0 exit still blocked).
       Re-checked at 0.5.1 this pass (pin `^0.5.0` -> `^0.5.1`, full suite green):
       no new game-logic primitives relevant to open items (no Alchemy/ally/Charm systems);
       `EntityRegistry.add()` still mints opaque ids with no caller-chosen-id primitive (P1
       stays open); `Types2D` still type-only aliases plus `Rect`/`rectOf()` (P2 stays open,
       Phase 0 exit still blocked).
- [x] **Code-quality note, flagged by the user**: a long `if (x === 'a' || x === 'b' || x === 'c'
      || ...)` OR-chain is itself a code smell worth watching for across `main.ts` (e.g. the
      inventory/ground-kind dispatch's `item.id === 'stone' || item.id === 'stoneOf...'` chains
      that have grown by one clause with every newly-ported runestone this session). Where the
      values share a real, checkable structural property (a common prefix like `'stone'`/`id
      .startsWith('stone')`, a shared category the item's own definition already carries, or a
      lookup table/`Set` membership test), prefer that over enumerating every literal by hand -
      it stops scaling linearly with every new case and reads its own intent instead of a list of
      exceptions. **Keep It Simple, Stupid (KISS) is a good default principle here**: reach for
      the simplest structure that actually matches the domain shape, not the first chain of
      conditions that happens to work. Not applied retroactively to the existing runestone
      chains in that pass (each addition was small, verified, and consistent with its own
      neighbors at the time). **Closed this pass (2026-09-09)**: audited every remaining
      `x === 'a' || x === 'b' || ...` chain in `main.ts` (regex swept every occurrence, not a
      sample). Found one genuine instance of the flagged smell - `spawnMonster`'s "never
      sleeps on spawn" gate, an 8-clause chain that had grown by one kind with every pass
      porting a new always-awake special mob (FetidRat/GnollTrickster/GreatCrab/DemonSpawner/
      Sentry/RotHeart/RotLasher/newbornElemental) - extracted into `monsters.ts`'s
      `NEVER_SLEEPS_KINDS` Set, the same pattern `NPC_KINDS`/`BOSS_KINDS`/`IMMOVABLE_KINDS`
      already established. Browser-verified live: a plain rat still spawns sleeping, a
      GnollTrickster still spawns already awake. The other short chains found (region lists,
      key-item groupings, a 3-kind Ghost-quest-target check) are each a fixed, real-world-
      bounded enumeration that doesn't grow with every new ported feature - the exact
      condition this note itself says NOT to force into a lookup table just for its own sake,
      so they were deliberately left alone rather than converted for no structural reason.
      `tsc`/build/both suites green.
- [x] **Data-driven dispatch pass (2026-09-09), user-flagged**: acted on the code-quality note
      above for the two largest concrete instances found by a full `main.ts` audit (205
      `kind === '...'`/`id === '...'` checks total, spread across ~19 functions - not one
      giant cascade, but two genuinely large ones: `takeMonsterTurn`'s 43 and `spawnMonster`'s
      37). Converted `quaffPotion`'s 39-branch potion-effect `if/else if` chain and
      `takeMonsterTurn`'s 236-line, 16-case non-adjacent "ranged special ability" cascade
      (DM100/Shaman/Necromancer/Tengu/DM300/Yog/Warlock/Elemental/YogFist/Scorpio-Acidic/Guard/
      DM200-DM201/Spinner/Golem/Eye/GnollTrickster/GreatCrab) each into a `Record<Kind,
      handler>` registry (`potionEffects`, `rangedAiOverrides`) - O(1) lookup instead of a
      linear string-compare cascade, same behavior per case, same Java-citation comments
      moved onto their own handler. Each `rangedAiOverrides` handler returns `true` if it
      consumed the monster's turn, `false` to fall through to the shared movement AI exactly
      as the original branch's condition failing did; three shared cases (Necromancer/
      SpectralNecromancer, Scorpio/Acidic, DM200/DM201) route through one helper method from
      two registry keys instead of one `||`-joined condition. Browser-verified live for every
      handler with real branching complexity: Eye's two-turn charge-then-fire beam (including
      the 1/4-damage-while-charged interaction), Golem's teleport-and-cooldown, Guard's
      chain-once-ever (confirmed a second attempt does nothing), DM200 (movable, resumes
      chasing when its vent roll fails) vs DM201 (always immobile, confirmed via a
      forced-cooldown vent-miss), GreatCrab's every-3rd-turn movement throttle, Scorpio's
      ranged attack, Spinner's web-root, and Necromancer's full summon->heal->adrenaline
      chain - all matched their pre-refactor values exactly. **`spawnMonster`'s 37-branch
      cascade converted too, same pass**: its stat-override chain (7 kinds), base-kind alias
      chain (10 kinds), and sprite-texture-reuse chain (12 cases, checking both `kind` and
      `baseKind`) all moved into `monsters.ts` as real data tables
      (`DEPTH_SCALED_STATS`/`BASE_KIND_ALIASES`/`SPRITE_KIND_OVERRIDE`), plus the `isNPC`/
      `isBoss` `||`-chains collapsed into `NPC_KINDS`/`BOSS_KINDS` sets - the single biggest
      concrete instance yet of this session's own "data belongs in asset data, not code" theme.
      The texture chain in particular collapsed from 12 checked cases to one lookup once
      re-derived correctly: every kind the original checked against `kind` directly
      (`sentry`/`ratKing`/`rotHeart`/`rotLasher`) has no `BASE_KIND_ALIASES` entry, so
      `baseKind` already equals `kind` for each - meaning checking `baseKind` alone, as the
      original's own fallback chain already did for the other 8 cases, covers all 12.
      Live-verified via direct texture-identity comparison (not just "no crash"): spawned one
      of every affected kind and confirmed `mimic`/`crystalMimic` share one texture source,
      `piranha`/`bee`/`statue`/`armoredStatue`/`greatCrab` share another (crab), and every
      dedicated-asset kind resolves to its own distinct source - exactly the grouping
      `SPRITE_KIND_OVERRIDE` specifies, with no cross-contamination. `tsc`/`build` clean
      throughout. **Not a candidate for `mwg` itself** (raised by the user):
      the *pattern* (keyed handler registry over branch-cascade dispatch, a "return true if
      you handled it" contract) is genuinely generic and would be a reasonable thing for the
      framework to offer as a documented convention or even a small typed helper - but every
      handler *body* here is SPD-specific game logic, which the licensing-boundary section of
      `CLAUDE.md` forbids putting in `mwg` (MPL-2.0, must stay game-agnostic, no SPD data/logic
      ever). Recorded as a possible upstream proposal (a generic `keyedDispatch<K,
      Args>(table, key, ...args)` utility, or documentation of the pattern) for the user to
      raise in the framework's own repo if they want it - not actionable from inside this one.
- [x] **`mwg` bumped to 0.5.0** (`package.json`'s pin, already installed). This release ships
      `core.ReactionTable` - edge-triggered condition->action rules with a `once: true` option
      the framework's own doc comment illustrates with "a boss entering phase two" as the
      worked example, a closer match to this port's hand-rolled one-shot transition flags than
      anything 0.4.x offered. Adopted immediately for `takeKingTurn`'s three real one-way
      transitions (P1->P2 at an HP threshold, P2->P3 at shield-zero, P3's one-time "losing"
      yell under 20 HP) - previously three separate ad-hoc latch fields
      (`kingPhase`-gated `if` blocks plus a standalone `kingLostYell` boolean), now one
      `ReactionTable<Creature>` (`kingPhaseRules`) built lazily per King and stored on
      `Creature.kingReactions`. Since `ReactionTable` is a stateful class instance (not plain
      data), its own `toJSON()`/`fromJSON()` needed wiring into the existing save/restore path
      separately from the plain `SavedCreature` field list - done via a new
      `kingReactionsState` field, reconstructed with the same `kingPhaseRules(creature)` used
      to build a fresh table. Live-verified all three transitions firing exactly once
      (including that HP recovering above 20 and dropping again correctly does *not* re-fire
      the spent losing-yell rule - true `once` semantics, not just edge-triggering), a second
      call with wildly out-of-range state not reverting or double-firing an already-spent
      transition, lazy construction on a fresh King, and a full save-then-load round-trip
      preserving phase and every fired-rule id exactly. `tsc`/`build` clean throughout. Brute's
      `hasRaged` one-time revival is a smaller, single-rule instance of the same shape,
      identified but not converted this pass (lower value - a single flag, not a multi-rule
      state machine like the King's).

- [ ] **Hand-rolled code where the framework now ships the capability** (2026-09-12, from the
      mwg-usage audit; each gap and its evidence is in `PORT_COVERAGE.md`'s mwg-usage section, and
      the *adopted* half of that audit - the `FloatingTextStack` defects, `Camera.toWorld`,
      `theme.direction`, 21 of 26 inlined Chebyshev checks - is already in). Ordered by value:
      (1) `Scheduler` persistence: `main.ts` saves `schedulerNow` plus a per-creature `nextTurn`
      and re-adds actors in `state.creatures` order, so `SchedulerSnapshot.sequence` is lost and
      actors tied on `nextTurn` can resolve in a different order after a load;
      `Roguelike.Scheduler.toJSON(actorId)`/`Scheduler.restore(snapshot, actorOf)` is the
      documented pair - **done 2026-09-12**: `FloorState.scheduler` now carries the whole queue
      (keyed `mob-<index>`/`hero`), restore goes through `Scheduler.restore` and rebuilds the
      simulation adapter against the new instance, `enterLevel` skips its own hero add only when
      the restored queue holds one, and saves without the snapshot still load; verified live with
      14 assertions (`tools/scratch/scheduler-queue-livecheck.mjs`) including floor actor
      state preservation and a real keypress spending the hero's turn after a load. (2) The inventory UI
      (`src/ui/inventoryWindow.ts`) now uses MWG's `TabbedList` for category filtering/page
      derivation and `IconGrid` for the masked 5-column grid and keyboard navigation; its SPD
      chrome, page/tab controls, metadata badges and inspect semantics remain port-owned. The
      same file now also constructs its ordinary display objects through MWG's typed render
      facade (`Container2D`/`Shape2D`/`Rectangle2D`/`Sprite2D`), reducing the raw-Pixi boundary
      one audited file at a time. (3) The
      hero's hand-rolled frame animator and 0.1s
      move tween (`src/ui/heroAnimation.ts`) are **gone (2026-09-12)**: the hero is an
      `AnimatedSprite` playing the same `HeroSprite` cloth-tier clips and sharing the monsters'
      `Tweener` motion map, with the file deleted and the death pose held (`playing !== 'die'` guard
      on the loop's return-to-idle). (4) `src/ui/wallDecorations.ts` hand-integrates its particle
      pool/physics - **migrated 2026-09-12 on MWG 0.8.1**: `ParticleEmitter` now expresses Java's
      per-particle random colour, per-frame size jitter and piecewise alpha (proposal P14).
      MWG 0.8.0 (item 323) added `tint` ranges, `ParticleCurve` scale/alpha
      and `flicker`; `wallDecorations.ts` now uses one emitter per FOV-gated spot. (5) The talent panel, item
      picker and `InfoWindow` hand-roll modality where `Window`/`WindowStack`/`MessageBox` exist
      (SPD's pixel chrome justifies not being a `Window`; the item picker is exactly `MessageBox`'s
      titled-choice shape) - **narrowed 2026-09-12**: the in-game menu now *is* a real `Window` on a
      `WindowStack` (`main.ts`'s `openGameMenu`, `src/ui/portWindows.ts`), which is the worked
      example the rest of this item was missing, and its blocker is the framework's own
      (`blocker: true` at every window site - see P15, done). (6) Screen shake: Java's 43 `PixelScene.shake(magnitude, duration)` sites
      all route through one wrapper whose body is `Camera.main.shake` - **wired 2026-09-12** at every
      site whose Java feature is ported (the chasm landing, mining, DM-100's bolt, DM-300's ROCKS,
      the Goo taking a hit while pumped up, and the rooted move/blink refusals) through a
      `shakeScreen` wrapper that is Java's own body minus its `SPDSettings.screenShake()` preference
      (this port has no such setting, and Java's default is 1 with the setting only scaling down).
      The unwired remainder is exactly the unported-feature list in `PORT_COVERAGE.md`'s mwg-usage
      section (hero abilities, monk paths, two monsters absent here, the crystal spire, tomb heaps,
      DM-300's `travelling` move); verified live with 7 assertions
      (`tools/scratch/screen-shake-livecheck.mjs`). (7) The interlevel curtain hand-computes its fades where `ScreenEffects` exists
      (not a drop-in swap for SPD's hold+two-fades phase, so lowest priority of the seven). Also
      recorded: `TileMap.setCellColor` unused (SPD's fog is per-half-tile, which per-cell tint
      cannot express), `visualWalls.ts`'s neighbour-mask table vs
      `resolveTerrainGraphics`/`TerrainGraphicsLayer`, `ui/gameLog.ts`'s own line budget vs
      `ListView`/`ScrollBox`, and the six boss ability cooldowns vs `Roguelike.AbilityCycle` (the
      phase machines around them stay local on purpose - Java has no such half-HP Fury rhythm, so
      `BossPhases` would be a regression). Four smaller ones from the same audit, each with its
      reason in `PORT_COVERAGE.md`'s mwg-usage section rather than here: `SimulationRuntime.snapshot()`
      unused (the same shape as the `Scheduler` item above), `src/challenges.ts` keeping its own
      `localStorage` key instead of `SaveSystem`/`Collection`, `SaveSystem`'s version-3 bump with no
      `migrations` entry (deliberate, stated at the call site), and the two flat-index
      `neighbourOffsets9` copies in `genericDungeon.ts`/`spdPatch.ts` that
      `Roguelike.neighbourOffsets(8)` cannot express as a hot-loop form. And one thing this audit
      *closed*: `patchRoom.ts`'s BFS neighbourhood, previously flagged there as an unverified
      fidelity risk, is verified 8-directional against `PathFinder.java` at `v3.3.8` (see the file's
      own comment for the two equivalences) - the port was right, so only the comment changed.
- [x] **Table-unique row ids in the MWL content** (2026-09-12, from the same audit) - **done.**
      MWL's id namespace is global per tag, and 42 of this port's `[row]`s restated another table's
      *domain* id as their own id - `alchemyRecipeManifest`+`alchemyRecipes` (14),
      `unstableEnchants`+`weaponEnchants` (10), `armorGlyphs`+`curseDefinitions` (8),
      `curseDefinitions`+`weaponEnchants` (7), `questDefinitions`+`scenarioQuests` (3). Each
      restating row is now named `table-domain` (`unstable-blazing`, `manifest-stewedMeat1`,
      `curse-wayward`, `quest-wandmaker`) and carries the domain id in a column (`enchant`,
      `recipe`, `curse`, `quest`), which is what the five readers expose - downstream code still
      sees bare domain ids, so nothing outside the readers changed. `tools/compile-mwl.mjs` now
      fails on any diagnostic at all, with no tolerated class and no pinned count.

## 11A. MWG framework backlog (separate repository; roadmap only)

This section is a list of generic proposals for the independent `@datamoc/mw_games` project.
It is intentionally not an implementation plan for this repository: do not add SPD names,
Java formulas, item values, dungeon rules, sprites, or other GPL game content to MWG. If one
of these proposals is accepted upstream, this port may consume the published API later and
must still keep its game-specific rules and adapters here.

The status was re-derived against `mwg@0.7.7` on 2026-09-12, the day the pin was bumped from
0.7.6 to 0.7.7 (commit `f736626`). **Five of the six proposals below shipped in 0.7.7** (its items
278-282); only the MWL asset-reference one is still open. A checked box here records that MWG
delivered the capability, not that this port consumes it yet - the port-side adoption each one
still owes is named inline.

**Pin bumped 0.7.7 -> 0.7.8 on 2026-09-12**, deliberately and with the whole suite re-run rather
than as a side effect of other work (the `mwg:check` script reported it available). 0.7.8 is a
patch release whose every change lies outside this port's surface, so no code changed for it and
no proposal below moves: its MWL executor fixes (`[if]`/`[else]`/`[while]` no longer running their
own `[condition]` child, and an `[else]` no longer also running after a taken `[if]`) cannot bite
here because this port's authored MWL never uses those commands, or `[set_variable]`/`[choice]`;
its `actors.sell` transactional fix is untouched because the port calls `Actors.buy` only; and its
`board.*`/classics/tactics work (Go scoring, backgammon bear-off, skirmish pathing, tactical action
budgets) is for board-game modes this port does not build. What 0.7.8 does add, and what this port
may adopt when it reaches the relevant feature: `MarkupText` and the canvas-side markup backend
(as the counterpart to the `RichLabel` HTML text this port's UI is built on), `TerrainGraphicsLayer`
for `[terrain_graphics]` placements, MWL unit identity (`name`/`role`/`can_recruit`/`leader` and
`subjectsWhere`/`ScoreSubjectFilter` on the AI side), and one shared variable-path resolver for
every `$name` reader. Verified on the new version: `tsc --noEmit` clean, `npm run build` clean, 53
simulation checks, the item suite, the i18n gate, seven behavioural browser probes (33 assertions,
including the wand/attack/spawn/buff paths), and a full-game load in English and French.

**Release update 2026-09-14: the published pin is now `^0.9.1`**, replacing the alpha range.
The stable release adds canonical save/replay and lockstep primitives, but the port does not
adopt them yet: its current scene state and callback-based world adapters do not satisfy the
serializable command/state boundary those features require. The compatibility work completed
here is narrower and deliberate: the five transitional `SimulationRuntime` adapters keep their
live callback handles outside MWG's `structuredClone`d commands and clear their temporary
journals after dispatch, while the existing local save/restore path remains authoritative.

- [x] **Keep using the existing generic primitives.** `Scheduler.add(actor, delay?, priority?)`
      supports actor priorities and postponement; `EntityRegistry.add(entity, requestedId?)`
      supports save-safe caller-chosen ids; `Inventory` supports nested containers and instance
      state; `craft()` provides an atomic recipe transaction; `ParticleEmitter.frames` supports
      animated pooled particles; `Blob.spread(open, spread?, decay?)` reports the cells it just
      emptied; `TerrainKind.flags` carries game-defined bits without interpretation; and MWL
      supplies typed tables, references, and deterministic artifact emission. 0.7.7 adds further
      ready-made primitives the port can adopt as it reaches them (not proposals, so not listed
      individually): the missing UI widgets (`Slider`/`Checkbox`/`Spinner`/`Dropdown`/`TextModel`/
      `DataTable`/`TreeView`/`ScrollBox`), `Layout`/`Skins`, `StoryScreen`/`StorySequence`, the
      battle-UI models, positional audio, IME text input, and MT19937 (`MersenneTwister`/
      `RandomStreams`).
- [x] **P0 — Generalise `MultiTurnBeam` traversal.** *Shipped in 0.7.7 (item 278).*
      `MultiTurnBeamOptions` now takes `fronts?(previous, turn)` (a game-supplied resolver, so a
      line, cone, burst, fork or moving front is expressible), `blocker?: BeamBlocker` (`'terrain'
      | 'none' | (cell, context) => boolean`), `onCell?`, and a `shape` string saved so a reload
      resumes the same shape (pre-fronts saves still load). **Adopted 2026-09-12 for Tengu's fire
      cone**: the hand-rolled `tenguFire.cells` ring state is gone, replaced by a per-creature
      `MultiTurnBeam` (built in `buildTenguBeam`) whose `fronts` resolver `tenguConeFront` carries
      Java's exact ring rule, `onCell` seeding the port's fire field. The creature's `tenguFire`
      now holds the beam's `toJSON()` plus the `CIRCLE8` direction the resolver needs, and
      `restoreFloor` rebuilds the live beam from it (old `{ direction, cells }` saves load by
      dropping that cone, not crashing). The Yog death gaze is deliberately left alone: it is an
      aim-one-turn/fire-the-next effect here and in Java, not a per-turn front sequence, so
      `MultiTurnBeam` is not its shape.
- [x] **P1 — Add generic particle spawn bounds.** *Shipped in 0.7.7 (item 279).*
      `ParticleEmitterOptions.spawn` takes a `ParticleSpawnArea` (`{ shape: 'rect' | 'ellipse',
      width, height? }`), spreading births across an extent rather than one origin; a point
      emitter is untouched, so existing seeded replays are identical. **Adopted 2026-09-12** for
      the title flame (`ui/titleFlame.ts`), which had documented the missing spawn range as its
      one deliberate reduction: the flame column now births across a 4x3 ellipse instead of a
      single point (the `heightLimit` clamp is still unmodelled - `ParticleEmitter` caps a
      particle's life, not its height). The colour-only sparks stay local (a `ParticleEmitter`
      tints per emitter, not per particle, so two colours need two emitters), and the hand-rolled
      `WallDecorationLayer`/`WaterEmberLayer` spots are now converted; FOV gating and water delay
      remain port-owned policy.
- [x] **P1 — Add a renderer-neutral grid targeting controller.** *Shipped in 0.7.7 (item 280).*
      `roguelike.TargetingController` gives a cursor moved by `move(dx, dy)`/`moveTo(cell)`,
      range + line-of-sight legality with an optional `validate` hook, a `preview()` of the shape's
      cells, and a cells-only `confirm()`/`cancel()` result, hex levels included. **Adopted
      2026-09-12 for the six cell-aimed runestones** (Fear/DeepSleep/Shock/Blast/Blink/
      Clairvoyance) through a new `beginAiming`/`confirmAiming`/`cancelAiming` trio plus a
      world-space preview overlay in `main.ts`: a click (or the arrow keys) picks the cell, an
      illegal cell is refused with the real "nothing to target" line, and nothing is consumed
      until a legal cell is confirmed - so cancelling is free. That retires "no map-click
      cell-targeting" for those six. **Aimed disintegration wands are now also adopted**:
      they use the same controller with an empty-cell target and no line-of-sight restriction,
      then apply the game-specific MWG `ballistica` path and disintegration rules on confirm.
      **Thrown weapons are now adopted (2026-09-13):** `useSpecial` opens the same controller
      for a visible hostile target, with the existing six-cell range/LOS rule and a game-owned
      validation hook; confirmation latches the selected creature and re-enters the unchanged
      throw resolver, so cancellation and invalid targets consume neither ammo nor a turn.
      **Bombs are now adopted (2026-09-13):** `useBomb` uses the same controller for a
      passable, non-chasm cell and passes the confirmed cell into the existing item-domain
      resolver; the Java occupied-cell fallback remains there. **Creature-targeted wands are
      now adopted (2026-09-13):** the remaining wand specials use the same controller and keep
      each wand's existing ally/guardian eligibility in its validation hook. Empty-cell area
      targeting remains the narrower next gap.
- [x] **P2 — Add reusable tabbed, paginated list primitives.** *Shipped in 0.7.7 (item 281).*
      `ui.TabbedList`/`ListTab` is a renderer-free tabbed, filtered, paged list with selection and a
      detail/close state over caller-supplied rows; the page is derived from the selection, so the
      two cannot disagree.
- [x] **P2 — Add a documented event-to-presentation sequencing recipe.** *Shipped in 0.7.7
      (item 282).* `simulation.EventPresentation`/`EventPresentationOptions` documents the
      `SimulationRuntime` -> `PresentationQueue` tie: command result, animation lock, scheduled
      secondary actor, cancellation, and save/load that resumes idle.
- [x] **P2 — Author non-monster asset references in MWL.** **Shipped in MWG 0.8.1 and adopted
      2026-09-13.** The generic asset-attribute contract now accepts these references, and this
      port uses `src/content/asset-references.mwl` for terrain/effect atlas sources plus the
      generated `itemAssetSources` table for the item atlas. `images.ts` validates the emitted
      manifest against the bundled files before loading them. Item-specific frame metadata is
      already authored in `item-rules.mwl`; only its Pixi frame cutting remains renderer-owned.
      The older dead-end experiment in
      `tools/scratch/*.mwl` is retained as historical evidence.
- [ ] **Before proposing further API changes, add framework-side acceptance tests and examples.**
      The 0.7.7 batch already carries its own renderer-free tests in MWG. Any new proposal needs the
      same: renderer-free determinism tests, a minimal example, save compatibility notes, and an
      API report entry in the MWG repository. This port should only add an adoption checkbox here
      after a released version exists and has been checked against its declarations.

### New proposals from the 2026-09-12 mwg-usage audit

The audit itself (what is adopted, what is deliberately unused, what is inapplicable) is
`PORT_COVERAGE.md`'s "mwg usage audit". Everything below is generic - no SPD names, values or art -
and by this section's own rule an *API* proposal wants renderer-free tests, a minimal example, save
compatibility notes and an API report entry in MWG before this port adopts it; P4 is doc-only.

- [x] **P3 — Re-export `extensions` and Pixi's built-in pipe classes from `two-d/pixi-interop`.**
      **Shipped in MWG 0.9.0 and adopted 2026-09-13.** The facade now exports the backend
      values plus `registerBuiltinPipes()`. This port migrated all 21 direct Pixi imports under
      `src/` to `mwg/two-d/pixi-interop`; startup keeps the explicit registration call as a
      defensive guarantee before the renderer is created. The remaining direct `pixi.js`
      dependency is intentional: MWG declares Pixi as a peer backend, so the application still
      supplies the single shared Pixi installation.
- [x] **P4 — Two shipped doc comments contradict each other; one over-claims.** **Shipped in MWG
      0.9.0 and confirmed against the installed package.**
      `Shape2D.d.ts` says "`Container2D` ... is a type alias, not something a game can `new`", while
      `Types2D.d.ts` re-exports `Container as Container2D` as "usable in both type and value
      positions". And `pixi-interop.d.ts` presents "this project imports the full `pixi.js` package
      everywhere ... and that package registers every built-in pipe ... as a side effect of the
      import itself" as a universal guarantee; what actually preserves them is Pixi's own
      `sideEffects` whitelist (`lib/scene/sprite-tiling/init.*`, `lib/scene/sprite-nine-slice/init.*`)
      and mwg's for `dist/two-d/render/TintedSprite.js` - this port lost a whole session to a
      production-only `renderPipes[...] is undefined` failure in that area and still registers all
      three pipes by hand.
- [ ] **P5 — Pointer parity for `two-d/ui/ListView`.** `IconGrid` is "driven by the keyboard or the
      pointer" and exposes `tapCell(index)`; `ListView` exposes only `move`/`select`/`confirm`/
      `handleAction`, so a list cannot be clicked. This port worked around it by filling each row's
      `ListItem.icon` with a full-row hit surface; a `tapRow(index)` mirroring `tapCell` would let a
      bag/menu use the widget as documented.
- [ ] **P6 — Let a game supply the compiled asset map.** `assets/paths` resolves against
      `window.__MWG_ASSETS__` (written by `mwg/tools/compile-resources`) or the dev server, with no
      entry point for a bundler that already produces URLs/data URIs - so a Vite game cannot use
      `Assets`' loaders, batching (`optional`/`fallback`) or progress reporting at all. This port
      uses none of `Resources` and hand-rolls asset-to-texture plumbing instead; a `setAssetMap(map)`
      (or a `setBase` overload) is the whole ask.
- [ ] **P7 — Compose, don't only prioritise, in `two-d/render/StatusVisuals`.** Its doc is explicit
      that one active status wins by declaration order and that a caller mixing in an unrelated
      `tint` write "will fight this"; this port needs an identity `tint`, N simultaneous *additive*
      effect colours and a transient flash, which is why it drives the additive channel directly and
      never adopted the class. Layering over that channel - never touching `tint` - is the generic
      shape.
- [ ] **P8 — A phase/sequence API for `two-d/render/ScreenEffects`.** `fadeOut`/`fadeIn`/`flash`
      cannot express hold-then-fade-then-fade-back, the standard transition here, which this port
      hand-computes. A small `run([{ phase, seconds }...], onMidpoint)` wrapper would.
- [x] **P9 — A screen-pixel shake helper on `Camera`.** **Shipped in MWG 0.9.0 and adopted here.**
      The port's Java shake wrapper now calls `Camera.shakeScreen(intensity, duration)`, preserving
      pixel-based amplitudes across camera zoom levels.
- [x] **P10 — Say what MWL row ids are scoped to, or make it configurable - shipped in MWG
      0.7.9 (item 304), evaluated.** `validateCatalog` takes `rowIdScope: 'file'`, scoping
      `MWL_DUPLICATE_ID`'s `tag:id` key per source file for games that reuse ids across files on
      purpose. This port stays on the global scope deliberately: its restating tables were renamed
      to table-unique ids instead (see the row-id item above), so a per-file scope would only
      weaken the gate, silencing a real same-file collision across tables. The 42 this proposal
      cited are gone, not scoped away.
- [x] **P11 — Let `tools/mwl.mjs` carry extra artifacts, or document the library path as the
      answer.** **Resolved in MWG 0.9.0 documentation.** The CLI remains intentionally limited to
      its standard artifacts; this port uses the public MWL library API for its game-owned modules
      and cross-table validators.
- [x] **P12 — A documented `file://` post-build recipe for bundler users.** **Shipped in MWG 0.9.0
      and adopted here.** The port's build now calls MWG's packaged `classic-html` implementation
      to rewrite the Vite entry tag, retaining the source-page guard in `index.html`.

- [x] **P13 — An angular cone area, not only a snapped spray - shipped in MWG 0.8.0 (item 322),
      port keeps its own exact translation.** This port needs Java's
      `mechanics/ConeAOE` exactly - a circular *sector*: rays cast every 0.5 degrees across an arc
      of a given angle, each struck cell unioned with the line from the source (so a wall stops the
      part of the cone behind it), with the ray length clamped to a maximum range. `roguelike`'s
      `coneCells(origin, target, width)` is a different shape: the aim snaps to the nearest of the
      eight directions, its length is the Chebyshev distance aimed, and step `i` spans
      `round(i / length * width)` cells per side - a linear spray with no angle, no range clamp and
      no wall awareness. MWG 0.8.0 added the generic `coneSector(level, from, to, { degrees, range })`
      this proposal asked for, which answers it for other games - but this port does **not** migrate
      its three live consumers (Regrowth wand, Fireblast wand, DM-300's gas check) onto it:
      `src/mechanics/cone.ts` mirrors Java's `float` precision, fills the inner ring at radius 4+
      and keeps the rim/inner distinction, all of which the generic drops, so adopting it would be a
      fidelity regression, not a consolidation. New cone attacks belong on the port's translation.

- [x] **P14 - Per-particle colour, jitter and curves in `ParticleEmitter` - shipped in MWG
      0.8.0 (item 323), adopted here on MWG 0.8.1.** The emitter
      interpolated `scale` and `alpha` linearly between two endpoints and took one `tint` for the
      whole emitter, recomputing each particle from its own age. Java's decoration particles need
      three things that cannot be expressed that way, which is why this port's
      `ui/wallDecorations.ts` now uses one pooled emitter per spot: `Sink`'s `WaterParticle` rolls a random
      *colour* per particle (`color(ColorMath.random(0xb6ccc2, 0x3b6653))`), `Torch`'s
      `SparkParticle.update()` re-rolls its *size* every frame (`size(Random.Float(size * left /
      lifespan))` - a flicker, not an interpolation), and `SmokeParticle.update()` needs a
      *piecewise* alpha (`am = p > 0.8 ? 2 - 2p : p * 0.5`). MWG 0.8.0 ships all three halves
      (`tint` ranges drawn per particle, `ParticleCurve` scale/alpha of age, `flicker` scale
      wobble - the doc names a torch spark as its example), so the framework gap is closed. The
      migration itself is now complete (2026-09-12): every spot owns a pooled emitter and
      per-spot FOV gating is retained by giving every spot its own emitter and wiring
      `start`/`stop`/`clear`; WaterEmberLayer retains Java's per-cell randomized delay. The
      torch halo and well ripples remain separate presentation layers because they are not
      particle pools. **Browser-verified 2026-09-13**
      (`tools/scratch/wall-decorations-livecheck.mjs`): teleporting the hero next to a real
      Sewers Sink spot and a real Prison Torch spot (both read from the live
      `wallDecorations['spots']` array, not guessed coordinates) and screenshotting each shows a
      rendered blue-green droplet at the sink cell and, at the torch cells, the FOV-gated warm
      halo lit around both visible sconces - confirming the pooled emitter and the separate glow
      layer both actually reach the screen, not just the type-checker.

- [x] **P15 - A blocker layer for `Window` - shipped in MWG 0.8.0 (item 324), adopted.**
      Java's `Window` adds a full-screen `PointerArea` *under its chrome* (`Window`'s constructor)
      whose click runs `onBackPressed()` unless the click landed on the chrome itself, and because
      it is a child of the window it also means a window's own buttons win over it. That one layer
      is what makes a click outside a window dismiss it, and what stops a window open over a map or
      a toolbar from letting clicks through to whatever is underneath. MWG's `Window` now takes
      `blocker: true` for exactly this (outside click closes a closable window, clicks on the frame
      or empty body are swallowed without dismissing), so every `Window` construction site in this
      port passes it and the local `src/ui/blockingWindowStack.ts` subclass - which inserted a
      hit-area'd, non-drawing blocker beneath each pushed window only because the framework had no
      such layer - is deleted.

- [x] **P16 - Say who owns the keyboard when a scene and a `WindowStack` both listen -
      shipped in MWG 0.8.0 (item 325), adopted.** `WindowStack.handleAction` is now public, and the
      stack's own class doc prescribes the chain (`stack.handleAction(action) || myOwnHandling(action)`),
      which is what both scenes do now: `main.ts` asks `gameWindows` first while keeping its
      `blocksWorld` guard (still needed for the direct `onAction` calls that bypass the listener)
      and its travel-cancel side effect, and the title scene chains before its `confirm` guard.
      The old undocumented recipe ("return `false` for every key you did not consume *and* check
      `blocksWorld` yourself first") is superseded; the pointer half of the same problem was P15,
      above.

- [x] **P17 - Cut arbitrary rectangles, not only regular grids, in `SpriteSheet` - shipped in
      MWG 0.8.0 (item 326), adopted where it pays.** `SpriteSheet.rect(frame, x, y, w, h)` declares
      irregular frames on a sheet with the same cut-once-and-cache behaviour grids already had.
      This port uses it for the repeat-cut sites: `main.ts`'s six variable-width ward frames (one
      sheet per texture, cached in a `WeakMap`), `inventoryWindow.ts`'s 16x16 item grid (one shared
      sheet, so redraws reuse frame textures), and the title flame's four fireball quadrants (a
      plain grid sheet). The remaining one-off static crops (toolbar strip, status bars, badges,
      banners, portraits) stay hand-cut `new Texture` calls deliberately: each is cut exactly
      once, so a sheet would add a cache nobody reads twice. Java's per-item *tightened* sub-rects
      (`assignItemRect` making each item smaller than its 16px cell) stay unported as before - a
      stated simplification in `images.ts`, not a framework gap.

### Explicitly out of scope for MWG

The following remain port-owned work even when they could be made more generic in theory:
SPD appearance tables and identification, fire/embers and well behavior, exact monster and boss
rules, talents and subclasses, quests, room generation, item effects, Java-derived numbers,
translations, and all SPD art/assets. “Could be represented by a generic primitive” is not a
reason to move those rules or data across the licensing boundary.

## 12. Publish a playable build on GitHub Pages

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
- [ ] **Track the latest `mwg` release and build every packaging target it supports, not only the
      GitHub Pages web build.** `npm run mwg:check` (`tools/check-mwg-version.mjs`) already reports
      the pin/installed/npm-latest triple; this item is the follow-through of actually bumping to
      the latest compatible release on a regular cadence (per CLAUDE.md's `mwg` dependency section)
      and re-running the full verification suite each time, rather than only reacting when a bump is
      needed for a specific feature. Separately, the installed `@datamoc/mw_games` package itself
      ships Capacitor (Android/iOS) and WebView2 (Windows desktop) packaging support alongside its
      web target (see the framework's own `package.json` `cap:*` scripts and README); this project
      currently only builds and ships the one web target (`npm run build` -> `dist/`, deployed to
      GitHub Pages above). Add the equivalent build targets here: a minified/compressed web bundle
      (the current `game.js` is an uncompressed ~28MB single chunk per the build warning above -
      code-splitting/minification tuning belongs here too), an Android build via the framework's
      Capacitor integration, and a standalone desktop executable via its WebView2 packaging. Each
      target needs its own build script, its own smoke verification (the existing browser-
      verification workflow does not cover a packaged app), and a decision on where built artifacts
      are published (Pages for web; likely GitHub Releases for the Android/desktop binaries, not yet
      decided). Not started.

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known
simplifications.
