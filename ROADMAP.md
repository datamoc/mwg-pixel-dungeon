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
      `src/content/artifacts.mwl`. Missiles, consumables, alchemy, and crafting inputs still
      Alchemy execution and the remaining crafting-input identities still need to be added;
      the named outputs from SPD's recipe manifest are now authored as catalogue entries;
      potion and scroll generator decks are
      now in `src/content/decks.mwl`.
      The runestone generator deck is now in `src/content/runestones.mwl`. Keep Java formulas and
      executable effects in explicit game hooks, referenced by MWL. The five missile generator
      decks are now in `src/content/missiles.mwl`, and the five weapon-tier generator decks are
      in `src/content/weapon-decks.mwl`; concrete missile behavior remains open.
      The fifteen generated missile classes now also have MWL item definitions with tier and
      base damage metadata, and generated loot preserves those identities through the inventory
      boundary; class-ammo pickup/use and specialty effects remain open.
      Floor-tier, affix-pool, and Ghost-reward generator tables are also authored in
      `src/content/generator-tables.mwl` and `src/content/generator-rules.mwl`.
      Wand, ring, artifact, and food generator decks are authored in
      `src/content/generator-decks.mwl`; remaining generator metadata and concrete item behavior
      are still open. The 48 generated potion, scroll, seed, and runestone item identities, plus
      food and bomb identities, are now authored in `src/content/consumables.mwl` and feed the
      runtime item-name map.
      The initial alchemy energy table and portable food recipes are now authored in
      `src/content/alchemy.mwl` and resolved through the MWG crafting transaction; the pot UI,
      energy resource, catalysts, exotic recipes, and specialty bombs remain open.
- [ ] Add actor and combat resources: hero classes, stats, talents, buffs, enchantments,
      glyphs, curses, monster definitions, resistances, drops, and monster AI profiles.
      Hero class kits are now authored in `src/content/classes.mwl` and adapted by `classes.ts`,
      and the complete base monster-stat catalogue is now authored in `src/content/monsters.mwl`
      and adapted by `monsters.ts`; talents, buffs, resistances, drops, AI profiles, and the
      remaining actor metadata still need the same treatment. The current monster loot table is
      now authored in `src/content/loot-rules.mwl`; Java-specific drop behavior still needs
      further parity work. Its limited-drop decay parameters are also authored there, while the
      Java formulas remain explicit hooks in `monsters.ts`. Actor classification flags are now
      authored in `src/content/actor-rules.mwl`; special-turn AI profile assignments are now
      authored there too, while detailed AI behavior and special abilities remain open. Talent
      tree membership/order is now authored in `src/content/talent-rules.mwl`; talent formulas
      and remaining Java-specific abilities remain open. Buff duration metadata is now authored
      in `src/content/buff-rules.mwl`; buff behavior remains executable in the simulation layer.
      Badge counters, thresholds, descriptions, and icon indices are now authored in
      `src/content/badges.mwl`; achievement persistence and UI remain runtime adapters.
      Hero level-cap and experience-curve parameters are authored in
      `src/content/progression-rules.mwl`; the arithmetic remains an executable hook.
      Weapon enchantments, armor glyphs, and Unstable's delegate list are now authored in
      `src/content/affix-rules.mwl` and adapted to `mwg/actors` affix tables by
      `itemAffixes.ts`; the per-id proc behavior stays in `main.ts`. The three
      `Char.isImmune` status lists (Brimstone/Frost/AntiMagic) are authored in
      `src/content/resistance-rules.mwl`, emitted as `simulation/mwlStatusImmunities.ts`, and
      consumed by `combat.ts`'s `addBuff`. Stat blocks still need the same treatment.
- [ ] Add dungeon resources: terrain and visual asset references, room templates, floor/depth
      tables, traps, plants, special rooms, NPCs, quests, boss phases, and branch transitions.
      Sewer trap class order and weights are now authored in `src/content/dungeon-rules.mwl`;
      the standard monster roster is now authored in `src/content/dungeon-rosters.mwl`; terrain,
      and standard-room weight rows are now authored in `src/content/room-rules.mwl`; plant, quest,
      and branch resources remain open. Trap tables for all five regions are now authored in
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
      startup. Terrain/UI references remain open. **2026-09-11:** an attempt to close that gap
      stalled on a framework schema limit, not on port code - `game.assets` is populated by
      scanning every node attribute whose *name* is an asset attribute (`image`/`file`/`icon`/
      `profile`/`sound`/`*_sound`/`*_image`, see `mwg/dist/mwl/compiler.js` `isAssetAttribute`),
      but the MWL schema only declares `image` on `monster` (plus the Wesnoth `unit_type`/`unit`),
      so a `[item] image=…` node fails validation with "unknown attribute image on item", and the
      alternative `[trait]` + `[effect apply_to=image set=assets/…]` form compiles but never reaches
      the manifest because `apply_to`/`set` are not asset-attribute names. There is no
      game-agnostic node for authoring a terrain/UI asset reference that flows into `game.assets`.
      The dead-end experiment is preserved in `tools/scratch/{terrain-assets,ui-assets,test-asset}.mwl`,
      and the generic capability is tracked as a framework proposal in §11A below; this item stays
      open until a released MWG version carries it.
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
      per number keyed by creature. One defect carried, found by the live check and not ours to
      hide: 0.7.4's stack moves the *newcomer* down by `height + 1` where Java anchors the newcomer
      and nudges the *older* text up by `height + 4` (shortening its life to stop spam).
      `tools/scratch/mwg-proposal/0003-floating-text-stack-upward.patch` is the fix, written and
      verified against 0.7.6; apply it and re-run the port's floaters check once a release carries
      it.
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
      recipe is *not* executable: Java's takes any seed plus any runestone, which the port's
      concrete-id recipe model cannot express (runestones carry 12 `stoneOf*` ids plus a generic
      `stone` id shared with the throwing-missile identity), so it is recorded as not ported
      rather than approximated. The runtime generic seed also gained the MWL identity it lacked
      (bag seeds used to render the raw id `seed`), and `shopPricing`'s alchemize value was
      corrected from 5 to Java's `20/8`.
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
      Java scales this way (Blazing/Chilling/Shocking/Vampiric are
      unconditional here, a separate pre-existing simplification with no roll left to scale).
       `ringArcanaMultiplier()` now feeds all of them. Elements/Furor are now ported (this pass), both genuinely - not just assumed - needing more than a stale-claim fix, and both got it: Elements applies RingOfElements.resist()'s real pow(0.825, level) at each hero-side elemental-damage site (burning/poison DoT tick, toxic-gas blob damage, burning-trap fire damage - all in RESISTS, scaled before Barrier absorption like Hero.damage()'s own ordering; durations untouched, as in Java), since this port has no equivalent of Char.resist(Class)'s single shared dispatch. Furor got the attack-only turn-cost split it needed (a new getAttackTurnCostMod(), blanket divided by RingOfFuror.attackSpeedMultiplier()'s real pow(1.09051, level), spent only for bump-attacks via a move-port pre-check; movement keeps the blanket cost, matching Java's attackDelay()-vs-speed() split). See PORT_COVERAGE.md's rings row. Bombs are now ported too (this pass): usable `bomb` bag item with LIGHT & THROW, landing as a lit heap with a real 2-turn fuse ticked from the end-of-turn pipeline (frozen by Timekeeper freeze, snuffable by stepping onto it, chained blasts, DoubleBomb pickup as Bomb x2 with the English-only status) and `Bomb.explode()`'s exact `NormalIntRange(4+depth, 12+3*depth)`-minus-armor blast including the hero - this also fixed generated bomb loot never spawning at all (`portItemKind` returned null). `EnhanceBomb` alchemy and the 10 specialty bombs still need the alchemy system. See PORT_COVERAGE.md's new `Bomb` row.
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
      250-volume ToxicGas at the wearer's own feet), now ported with a `fragile`->`stench` load
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
      `ceil`.** Remaining, each still needing its own system first: Corrupting's
      conversion, Elastic/Projecting's geometry, and Affection/
      `Obfuscation` now contributes its Java-scaled stealth to sleeping detection; only the
      non-sleeping FOV-binary `seesHero` path remains simplified. `polarized`/
      `sacrificial`/`displacing` gained real proc branches in an earlier pass, alongside the
      already-live `wayward`/`annoying`/`dazzling`/`explosive`.
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
 - [ ] Implement complete weapon and armor tiers, transfer formulas, upgrade formulas, curse infusion, and degradation. Upgrade transitions now preserve generated weapon/armor tiers through inventory and equip, and scroll upgrades keep the fixed tier while applying Java's plain +1 level (the no-picker auto-target remains a documented UI simplification); the existing affix-loss rolls/Warlock Degrade are Java-shaped. Blacksmith reforge now has persistent favor, progressive costs, same-category two-item selection, level preservation and one-item consumption; hardening, dedicated transfer/seal handling, and curse infusion proper (`items.spells.curseinfusion` is an alchemy-brewed spell, so it waits on the alchemy system with everything else brewed) remain. See `PORT_COVERAGE.md`'s upgrade/degrade row.
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
      Remaining: per-missile identity (boomerang return/merge), the last-missile confirm,
      the dust-pickup tracker, and Sharpshooting's Aim-buff rework (flagged, own pass).
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
      10. The Shocker actor is still collapsed to its one turn of direct damage - its Java `act()`
      as written never detaches, so its lifetime needs resolving against a real fight before it is
      guessed at - and that arena geometry remains).
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
      `CavesBossLevel.seal()`'s own do/while. Remaining: the port's arena layout is still a
      hand-approximation of Java's build order (so the patch's RNG stream position is deterministic
      but not Java's exact draw index), Java's entrance-wall relocation/rock-shake on seal and
      `unseal()` gate reopening are not modeled, and targeting refinements plus presentation
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
      upgrade remain).
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
- [ ] Port final-vault endgame-specific terrain, custom visuals, and compass behavior. The
      vault now runs Java's own `viewDistance = 4` through the shared sight radius (with the
      darkness-challenge minimum applied on top, matching `updateVisibility()`); chasm cells
      were already real there, and the compass was already correctly gated on `hasStairs`
      (false on 26). Remaining: the HALLS_SP custom floor, candle visuals, and the
      THEME_FINALE music cue (presentation/audio systems with no seam here).
- [x] Stop dungeon music on entry to the final vault, matching `LastLevel.playLevelMusic()`.
- [ ] Implement exact arena layouts, seals, pylons, boss phases, minions, traps, projectiles, movement scripts, and victory transitions.

## 4. Complete NPCs and quests

- [ ] Port Caves NPCs and quests.
- [ ] Port City NPCs and quests.
- [ ] Port Halls NPCs and quests.
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
- [ ] Port the Troll Blacksmith's mining and forge mechanics.
- [ ] Port Rat King and other missing special NPCs. Rat King is now complete for its core
      exchange (room drops real `Gold(10-25)` CHEST heaps, the king spawns sleeping with
      his own art, wakes with the real yell, awards the crown exchange when worn armor is
      present, and grants the six-turn Ratmogrify ability). Remaining: other special NPCs
      (MirrorImage/PrismaticImage/Sheep allies, ImpShopkeeper, VaultSentry,
      DirectableAlly), which need the ally/combat systems behind them -
      see `PORT_COVERAGE.md`'s quests row.

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
      terrain) remains simplified to the port's clear-line check. Its wandering self-teleport-
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
- [ ] Implement remaining blob area propagation, gas, and fire terrain (ordinary fire's
      representable terrain/content slice is covered above; gas and unsupported fire cases remain).
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
      Monastic Vigor, Twin Upgrades, Bounty Hunter, Thief's Intuition rank 1, Shared
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
- [ ] Implement the remaining Java seed and dew behavior in high grass. Actual seed payloads
      (real `Generator` category roll, concrete class retained) and planting them (`plantSeed()`,
      instant activation with no growth delay - confirmed against `Plant.java`'s own
      `Seed.execute(AC_PLANT)`, which has none either) are both already live; a stale comment
      claiming otherwise at `trampleHighGrass` is now fixed. `WandOfRegrowth`'s charge-scaled
      regional growth, roots, high-grass budget, seed/dewcatcher/seedpod chances, and persistent
      degradation counters are now live too. Lotus now spawns on qualifying casts, expires on
      its Java HP timer, and preserves nearby non-Rotberry seeds with the real level-scaled
      chance. Exact cone targeting and exact waterskin/dewdrop interactions remain.
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
      resets the timer (matching real `setShield()`). Java's priority-ordered absorption (Blocking's
      shield always drains before Barrier's on incoming damage) remains unmodeled - tracked in
      `PORT_COVERAGE.md`'s Barrier-decay row; healing-over-time - Sungrass is live, other Java
      Health-buff variants remain.

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
      `WallDecorationLayer`/`WaterEmberLayer` spots are a separate candidate, not converted here.
- [x] **P1 — Add a renderer-neutral grid targeting controller.** *Shipped in 0.7.7 (item 280).*
      `roguelike.TargetingController` gives a cursor moved by `move(dx, dy)`/`moveTo(cell)`,
      range + line-of-sight legality with an optional `validate` hook, a `preview()` of the shape's
      cells, and a cells-only `confirm()`/`cancel()` result, hex levels included. **Adopted
      2026-09-12 for the six cell-aimed runestones** (Fear/DeepSleep/Shock/Blast/Blink/
      Clairvoyance) through a new `beginAiming`/`confirmAiming`/`cancelAiming` trio plus a
      world-space preview overlay in `main.ts`: a click (or the arrow keys) picks the cell, an
      illegal cell is refused with the real "nothing to target" line, and nothing is consumed
      until a legal cell is confirmed - so cancelling is free. That retires "no map-click
      cell-targeting" for those six. Still auto-targeting, and the next adopters: thrown weapons
      (`useSpecial`), aimed wands, and bombs.
- [x] **P2 — Add reusable tabbed, paginated list primitives.** *Shipped in 0.7.7 (item 281).*
      `ui.TabbedList`/`ListTab` is a renderer-free tabbed, filtered, paged list with selection and a
      detail/close state over caller-supplied rows; the page is derived from the selection, so the
      two cannot disagree.
- [x] **P2 — Add a documented event-to-presentation sequencing recipe.** *Shipped in 0.7.7
      (item 282).* `simulation.EventPresentation`/`EventPresentationOptions` documents the
      `SimulationRuntime` -> `PresentationQueue` tie: command result, animation lock, scheduled
      secondary actor, cancellation, and save/load that resumes idle.
- [ ] **P2 — Author non-monster asset references in MWL.** *Still open in 0.7.7* - verified
      against `mwl/schema.ts`: the `item` node is still `{ id, name, slot, stackable, weight }` with
      no asset attribute, and `image` remains only on `monster`/`unit_type`/`object`/`story`. The
      manifest scanner (`isAssetAttribute`) already recognises `image`/`file`/`icon`/`profile`/
      `sound`/`*_sound`/`*_image` by *name* on any node, so only the schema gate blocks it, and
      authoring a terrain/UI asset in MWL still fails with "unknown attribute image on item" (the
      dead-end experiment preserved in `tools/scratch/*.mwl`). Adding `image` (and optionally
      `file`) to the generic `item` node - or a dedicated, game-agnostic `asset` node with an
      optional `slot`/`kind` - stays the one requested change; no SPD names, values, or art belong
      in MWG, only the attribute contract and determinism tests.
- [ ] **Before proposing further API changes, add framework-side acceptance tests and examples.**
      The 0.7.7 batch already carries its own renderer-free tests in MWG. Any new proposal needs the
      same: renderer-free determinism tests, a minimal example, save compatibility notes, and an
      API report entry in the MWG repository. This port should only add an adoption checkbox here
      after a released version exists and has been checked against its declarations.

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

## Definition of done

- Every Java gameplay system has an equivalent TypeScript implementation.
- Every intentional deviation is documented in code and in `PORT_COVERAGE.md`.
- Fixed-seed gameplay traces produce equivalent results across both versions.
- `npx tsc --noEmit`, `npm run build`, automated verification, and browser verification pass.

See `PORT_COVERAGE.md` for the current implementation status and known
simplifications.
