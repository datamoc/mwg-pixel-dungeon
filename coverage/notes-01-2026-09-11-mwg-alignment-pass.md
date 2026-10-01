# Port coverage notes: 2026-09-11 mwg alignment pass

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## 2026-09-11 mwg alignment pass







- **`Item.value()` metadata used by `Shopkeeper`** — `src/content/shop-rules.mwl`'s typed
  `itemUnitValues` table, read by `src/items/shopPricing.ts`. **Ported:** the per-unit values
  for potions, scrolls, food, bombs, runestones, seeds, quest materials, and alchemy inputs
  now live in MWL; Java's identified-scroll, sealed-item, generated-gear, ring/wand, quantity,
  depth-bracket, sell, and buyback rules remain executable TypeScript because they depend on
  runtime item state. The port's documented 2.5-per-unit `Alchemize` approximation is authored
  as data and retained intentionally (Java truncates its single-unit value).

- **Ring display names** — `src/content/rings.mwl`'s `name` values and
  `src/items/catalog.ts`. **Ported:** the twelve SPD message keys now live with the ring
  definitions; the former TypeScript-only lookup table was duplicate content, not runtime logic.

- **Wand executable categories** — `src/content/wands.mwl`'s `wandDefinitions` table and
  `src/items/wands.ts`. **Ported:** the runtime category list is derived from the authored MWL
  definitions and checked against the closed TypeScript effect union; wand effects and targeting
  remain executable TS behavior.

- **Specialty bomb classification** — `src/content/item-rules.mwl`'s `itemCategories` table and
  `src/items/itemKinds.ts`. **Ported:** the ten specialty-bomb ids are authored as item metadata;
  TS retains only the ground-kind dispatch and executable bomb effects.

- **Bomb blast parameters** — `src/content/item-rules.mwl`'s `bombRules` table and
  `src/items/bombEffects.ts`. **Ported:** the standard, Tengu, specialty, Regrowth, Arcane, and
  Shrapnel chain radii, affected radii, depth-scaled damage bounds, base-blast flags, and armor
  piercing are authored as MWL data. The payload dispatch, terrain/fire changes, creature hooks,
  and recursive chain execution remain executable TypeScript because they are stateful behavior.

- **Item atlas frame coordinates** — `src/content/item-rules.mwl`'s `itemFrames` table and
  `src/dungeonConstants.ts`. **Ported:** the `items.png` frame indices now live in MWL and the
  adapter rejects any missing `GroundItemKind`; Pixi texture registration and the double-bomb
  `+1` variant remain renderer/runtime behavior.
  The inventory's item-specific variants are also authored in `itemSpecificFrames`; UI action
  selection remains TypeScript.

- **Food base characteristics** — `src/content/item-rules.mwl`'s `consumableStats` table and
  `src/items/consumables.ts`. **Ported:** base hunger reduction is authored in
  MWL; the no-food challenge, cached-ration roll, and class-talent reactions remain executable
  TypeScript. **Correction 2026-09-19 (19th matrix):** this row used to claim "meat healing" as
  ported - no Java food heals on eat (`MysteryMeat`/`ChargrilledMeat` carry no heal field; only
  the unmodeled `PhantomMeat` restores HP), so the flat `heal: 5` was invented and is removed.
  `MysteryMeat.effect()`'s 5-way roll is now live instead (burning reignite 8, roots 10,
  poison pooled to `HT/5`, slow unmodeled, nothing) - see the `MysteryMeat` row below.

- **MysteryMeat / ChargrilledMeat energy and effect** — `consumableStats` rows plus
  `applyMysteryMeatEffect` in `src/items/consumables.ts`. **Correction 2026-09-22 (ACP #393):**
  `phantomMeat` carried hunger 600 with no Java behind it - `PhantomMeat.energy` is
  `Hunger.STARVING` (450), and `Blandfruit.energy` is STARVING too while the port had
  no row at all (falling back to `food` 300). Both rows now read 450; the phantom
  HT/4 heal rides `mealHeal` separately and is untouched. Pinned in `test:items`. **Ported 2026-09-19 (19th matrix,
  `MONSTER_ANALYSIS_RUNESTONES_FOOD.md`):** both carry Java's real `Hunger.HUNGRY/2` (150) -
  the chargrilled row previously read 300, a transcription error with no Java behind it - and
  the invented `heal: 5` is gone. Eating `meat` runs `MysteryMeat.effect()`'s real
  `Random.Int(5)`: burning via `reigniteBuff` (Java's `reignite`, prolong 8), roots 10
  (`Roots.DURATION*2`), poison whose `HT/5` damage pool is converted to this port's turn-clock
  model (the clock whose cumulative `floor(t/3)+1` first reaches `HT/5`), or nothing.
  **Simplified:** the Slow case is unmodeled - no speed-factor buff exists in this port - so
  2 of 5 rolls are silent instead of Java's 1 of 5. **Correction 2026-09-22 (ACP #399):**
  the roll itself was `int(0,4)` until now, dealing the four modeled outcomes at 25%
  each; it is the full `Int(5)` again, so each modeled effect holds its real 20% with
  the unmodeled-slow and Java's own no-op sharing the silent 40%. Pinned in `test:items`. (open residual moved to `ROADMAP.md` R008) `FrozenCarpaccio` is ported (see the heap/food row above). Its `PotionOfHealing.cure()` outcome removes every represented cure target, including Vertigo; Java also removes Slow, which this port does not model because there is no Slow buff. `SupplyRation` is now a
  distinct consumable with Java's 200 energy, +5 direct healing, 10-gold value, and its
  carried-Cloak +1 charge/Recharging effect. **Simplified:** the talent-dependent zero-second
  eating time is not represented by the shared action-cost seam, and its checked-in catalog
  display uses the generic Ration strings because this checkout's SPD message snapshot predates
  `items.food.supplyration.*`. `SmallRation` is
  now a distinct shop/inventory id with Java's 150 energy and 10-gold value, while sharing the
  port's generic food action and localized Ration display/description. `Berry` is now also a
  distinct Nature's Bounty drop with Java's 100 energy and 5-gold value. Its revive-persistent
  two-berry `SeedCounter` now increments on eating, resets after the second berry, and drops a
  generated seed at the hero's cell; save/load carries the counter through the run state. The
  seed-drop presentation and exact `CounterBuff` object identity remain simplified.
  `PhantomMeat` is now a distinct consumable with Java's 600 energy, 30-gold value, dynamic `HT/4`
  healing, Barkskin (`HT/4`, decay interval 1), 20-turn Invisibility, and the shared Healing Potion
  cure list. Its Horn of Plenty bonus is also included. The shared meal-time simplification remains
  in force, and the status presentation for the newly applied effects is not separately modeled.

- **Waterskin capacity** — `src/content/item-rules.mwl`'s `itemLimits` table and
  `src/dungeonConstants.ts`. **Ported:** the static maximum volume is MWL content; dew pickup,
  drop selection, and the dynamic healing calculation remain TypeScript behavior.

- **Potion of Strength base modifier** — `src/content/item-rules.mwl`'s `itemEffectValues`
  table and `src/items/potionEffects.ts`. **Ported:** Java's one-point strength increase is
  authored as item data; applying it and synchronizing the live hero stats remain TypeScript.

- **Potion and artifact scalar parameters** — `src/content/item-rules.mwl`'s `itemEffectValues`
  table, `src/items/potionEffects.ts`, `artifactActions.ts`, and `generatedItems.ts`. **Ported:**
  the potion fire/gas volumes and the Hourglass/Cloak charge constants are authored as MWL data;
  scene effects, level caps, and charge-state mutation remain TypeScript behavior.

- **Artifact charge timing** — `itemEffectValues` now also authors the Hourglass and Cloak
  turns-per-charge costs (2 and 4); the scene still owns the ticking state and save/load behavior.

- **Scroll and Frost scalar effects** — `itemEffectValues` now authors Scroll of Mirror Image's
  clone count, Scroll of Retribution's power/damage coefficients, and Potion of Frost's radius
  and elemental damage fractions. The affected-cell scans, random rolls, status transitions, and
  deaths remain TypeScript behavior.

- **Runestone scalar effects** — `itemEffectValues` now authors the shared targeting range,
  Flock/Aggression/Clairvoyance/Shock/Blast radii and amounts, and Stone of Blast's depth-scaled
  damage bounds. Selection, aiming, map scans, random rolls, and combat mutation remain TS.

- **Bomb, Waterskin, and Transfusion scalar effects** — `itemEffectValues` now authors bomb
  targeting range, Waterskin healing per drop, and Transfusion's self-damage fraction. Target
  selection, reserve accounting, damage absorption, and world mutation remain TypeScript.

- **Runestone identity conversion** — `sourceInventoryItem` now consumes the existing MWL
  `consumableClassAliases` rows for all twelve runestones instead of repeating their class-to-id
  list in TypeScript; inventory state and unidentified-item handling remain TS.

- **Special ground-item identities** — the exact class-to-ground-kind mapping for bombs, quest
  props, and special shop items now lives in `specialItemGroundKinds` in `item-rules.mwl`; generic
  substring/category fallback and payload construction remain TypeScript.
- **Special inventory identities** — exact class-to-item-id, identification, and cursed-state
  metadata now lives in `specialItemInventoryRules` in `item-rules.mwl`; instance creation and
  variant/prefix fallback remain TypeScript.
- **Ground-item family aliases** — exact internal item-id-to-ground-kind aliases now live in
  `itemGroundKindAliases` in `item-rules.mwl`; prefix/category routing for families remains
  executable TypeScript.
- **Runtime item names** — names for runtime-only item IDs now live in `itemNameKeys` in
  `item-rules.mwl`; generated consumable/equipment/artifact names continue to come from their
  dedicated MWL definitions.
- **Ground-item names** — names for ground-item families now live in `groundItemNameKeys` in
  `item-rules.mwl`; choosing the family and resolving contextual wand names remain separate.
- **Inventory action labels** — `itemActionKeys` now authors the item/family action translation
  keys and capitalization flags, including localized Waterskin, Seed, Hourglass, and Cloak labels;
  family routing, frame selection, and the actual action behavior remain TypeScript/UI logic.
- **Generated item identity** — `itemInstanceRules` now authors which generated item kinds receive
  an instance identity (`weaponReward`, `armorReward`, `wand`, and rings); instance allocation and
  equipment state tracking remain TypeScript because they depend on the live inventory/equipment.
- **Specialty bomb scalar effects** — `itemEffectValues` now authors Fire Bomb's fire radius and
  duration, Regrowth Bomb's bloom/anti-healing values, Woolly Bomb's sheep limit, and Holy Bomb's
  damage fraction; area traversal, status application, terrain mutation, and combat remain TS.
- **Potion and runestone targeting scalars** — `itemEffectValues` now authors the Freerunner
  invisibility duration progression and Potion of Frost's adjacent-target radius; Stone of
  Aggression consumes the shared MWL targeting range instead of duplicating a literal. Talent
  checks, targeting, status transitions, and world effects remain TypeScript.
- **Seed generator deck** — `generator.ts` now consumes the existing `seedDeck` MWL trait for
  seed classes and probabilities; category selection, substream/RNG handling, and seed effects
  remain executable TypeScript.
- **Armor generator deck** — the armor class order and zero-weight specialization entries now
  live in `armorGeneratorDeck`; tier selection, reward-specific handling, and RNG orchestration
  remain TypeScript.
- **Generated equipment shop coefficients** — `equipmentValueRules` now authors the base-per-tier,
  positive-affix, known-curse, and identified-level price coefficients; identification, curse
  detection, quantity, depth bracket, and shop transaction behavior remain TypeScript.
- **Ring and Wand shop values** — the shared family value `75` is now authored in
  `itemUnitValues`; runtime ring-id fallback, quantity, and shop formulas remain TypeScript.

- **Fireblast charge rules** — `wandFireblastRules` now authors the three charge levels' cone
  angle, distance, fire volume, and damage bounds. Cone traversal, doors, fire propagation,
  victims, statuses, and charge refunds remain executable TypeScript.

- **Regrowth charge rules** — `wandRegrowthRules` now authors cone angle/distance, roots duration,
  grass placement coefficients, and the Lotus charge threshold. Cell eligibility, random plant and
  grass placement, charge accounting, and feature mutation remain TypeScript.

- **Transfusion scalar effects** — `itemEffectValues` now authors the ally healing progression
  and caster shield base/progression. Ally selection, undead damage, charm, absorption, and death
  handling remain TypeScript.

- **Potion/scroll/seed/runestone identity aliases** — `src/content/consumable-aliases.mwl`'s
  `consumableClassAliases` table and `src/items/generatedItems.ts`, `transmutation.ts`, and
  `itemKinds.ts`. **Ported:** Java class names and compact port ids, including the exceptional
  LiquidFlame/Invisibility/MagicMapping/RemoveCurse renames, plus all 12 seed and 12 runestone
  identities, are authored once in MWL; generation, eligibility, random selection, and inventory
  mutation remain TypeScript behavior.

- **Ring identity aliases** — `src/content/item-rules.mwl`'s `ringClassAliases` table and
  `src/items/generatedItems.ts`/`itemKinds.ts`. **Ported:** all 12 Java ring class names map to
  their compact runtime IDs from one MWL source; inventory instance creation and ring behavior
  remain TypeScript.

- **Wand range and charge scalars** — `src/content/wands.mwl`'s `wandRangeRules` and
  `wandChargeRules` tables and `src/items/wands.ts`. **Ported:** the base range, disintegration
  level scaling, and Fireblast/Regrowth charge ratio and bounds are authored in MWL; validation,
  charge spending, targeting, and wand effects remain TypeScript.

- **Wand direct-damage bounds** — `src/content/wands.mwl`'s `wandDamageRules`, read by
  `src/items/wands.ts` and the wand scene/effect adapters. **Ported:** the level-scaled bounds
  for Magic Missile, Frost, Lightning, Blast Wave, Prismatic Light,
  Disintegration, and Transfusion now live in MWL; charge-dependent Fireblast and the
  stateful status/area effects remain executable TypeScript. **Corrected 2026-09-19, wand
  matrix (`MONSTER_ANALYSIS_WANDS_NINE_ZAP.md`):** Living Earth has no row - its roll is
  depth-scaled (`NormalIntRange(2, 4 + scalingDepth()/2)`, `livingEarthZapRange` in
  `items/wands.ts`), which a level-parameterized table cannot express; the same pass deleted
  three invented Warlock zap bonuses (a +2 on Magic Missile/Frost, a free charge refund on
  every zap, and the same refund inside Fireblast) that have no Java source.

- **Warding tier characteristics** — `wandWardRules` now authors ward tier healing,
  self-damage, and lifetime limits (plus the fixed max HP of higher tiers); tier upgrades,
  target selection, actor turns, and live HP mutation remain TypeScript behavior.
  The energy budget and initial ward HP formulas are also authored in `itemEffectValues`.

- **Ring and wand display names** — `src/content/rings.mwl`/`wands.mwl` and
  `src/i18n/spdKeys.ts`. **Ported:** player-facing SPD message keys are read from the MWL item
  definitions; appearance handling and wand/ring runtime behavior remain TypeScript.

- **Base weapon and armor stat formulas** — `src/content/item-rules.mwl`'s
  `equipmentStatRules` table, `src/items/catalog.ts`, and `DungeonScene.syncHeroFromStats()`.
  **Ported:** the Java-derived formulas are authored as data and evaluated only through a closed
  TS parser; degradation, no-armor challenge behavior, Barkskin, and subclass modifiers remain
  runtime logic because they depend on the live hero state.

- **`Fire.evolve()` / `Level.destroy()` / `Heap.burn()` / `Plant.wither()`** — `main.ts`'s
  scene-owned `spreadFire`, `burnFireTerrain`, and `burnFireContents`, plus `Terrain.EMBERS` and
  raw `FURROWED_GRASS` in the level bridge. **Ported for the representable terrain/content slice:**
  existing cells lose exactly one volume per turn, empty flammable orthogonal neighbours ignite at
  volume 4, active cells burn their scroll/dewdrop heap, detonate bombs, convert the full Mystery Meat stack to the same-sized Chargrilled Meat stack, and wither plants; expired grass, furrowed grass, doors, locked doors, and
  barricades become passable `EMBERS`. A burned cell restitches its own tile face and the
  features layer is redrawn when a plant withers, the same redraw every grass change already
  performs - without it the terrain changed in the model only. The generic MWG Blob remains
  intentionally uninvolved in this SPD-specific transition. Sewer region wall decoration, webs,
  and Java's full heap/occupant subtype rules remain **Not ported** and are kept out of the coarse
  terrain model. **Corrected 2026-10-01**: the first two subjects are historical - sewer wall
  decoration is ported (`wallDecorations.ts`, `SewerLevel.addSewerVisuals`' `Sink` at every painted
  `WALL_DECO` cell) and webs are ported (the `scene.web` blob, seeded at `dungeonScene.ts:2006`,
  consume-on-touch and `spreadFire`'s webbed-cell ignition) - so R009 now tracks only the
  heap/occupant subtype half. **Ported 2026-09-23:** `Burning.act()`'s ground-ignition tail - a burning
  hero (`turnLoopAiming.ts`) or monster (`actorTurnsHazards.ts`) on flammable ground (webbed
  cells included, like `spreadFire`'s own predicate) with zero fire volume seeds `Fire` at
  volume 4, gated on the pre-tick burning flag since Java fires it even on the tick the buff
  detaches, with no flying gate, matching Java. The monster-side seed runs before the damage
  block so a monster killed by the tick still leaves its fire behind, as Java's fall-through
  does; a hero death returns at game over with nothing left to observe the cell. Pinned
  source-level in `test:simulation` via `verifyCombat.mjs`.

- **`Fireball` title flame / `Emitter.pour` / `Flame`** — `src/ui/titleFlame.ts` now uses MWG's
  `ParticleEmitter.frames` for the `FLAME1`/`FLAME2` film, with Java's 10 particles/second,
  one-second lifetime, upward motion, and a per-particle lateral angle/speed/spin range so the
  flame does not form a straight column. **Simplified presentation:** MWG's
  generic emitter has no per-spawn x/y jitter or Java `heightLimit` clamp, and its linear alpha
  range replaces Java's two-part fade curve; glow, flare, and local colour-only sparks remain.

- **The MWL item catalogue now resolves its names through SPD's real message keys, and
  `tools/i18nCheck.ts` is green.** The catalogue had invented keys for items that do exist as Java
  classes - `items.seeds.<plant>.name` for the twelve seeds, `items.food.pasty.name`,
  `items.bombs.doublebomb.name`, and thirty `port.name.alchemy.*` alchemy outputs - so `mwg/i18n`
  answered every one of them with the raw key string, in all 19 languages, and the offline check
  reported 46 failures (15 of them already on `HEAD`). They now use the real keys: seeds are
  `plants.<plant>$seed.name` (`Rotberry.Seed` is an inner class), `DoubleBomb` is
  `items.bombs.bomb$doublebomb.name`, `Pasty` is `items.food.pasty.pasty`, and the elixirs, brews,
  arcane resin, liquid metal, blandfruit, alchemize and ten spell outputs name themselves through
  `items.potions.elixirs.*`, `items.potions.brews.*`, `items.arcaneresin.name`,
  `items.liquidmetal.name`, `items.food.blandfruit.name`, `items.spells.alchemize.name` and
  `items.spells.*`. Only the four catalogue entries with no single SPD class behind them keep a
  port key (scroll-to-stone, the generic exotic potion and scroll, and `Bomb.EnhanceBomb`), added
  to English and French. The same pass keyed the port-authored DM-300 arrival line
  (`port.log.dm300arrives`, was a raw `say()` literal) and added the English base entries for the
  new journal tabs and the bag's filter labels, which had translations but no English original.
  `npm run i18n`/`npm run i18n:check` still need a `--spd-root`, and this session's checkout makes
  the extractor fail on stray MWL `set=` tokens, so the catalogue was not regenerated - every key
  used here is one the shipped catalogue already carries.
  **Two more defects were found by the live browser pass in section 10 of `ROADMAP.md`, both
  invisible to `tsc`/build/suites.** (1) `CLASSES[id].nameKey` came straight from
  `classes.mwl` and used invented `port.name.<class>` keys for five of the six classes, so class
  select rendered the raw string `Port.name.rogue`; the five now use SPD's real
  `actors.hero.heroclass.<class>` keys (`CLASS_KEYS` already used them for log lines), leaving
  only the Cleric on a port key, and `tools/i18nCheck.ts` gained a `CLASSES`/`CLASS_UNLOCK_HINT`
  rule so a raw class name cannot pass again. The same screen's locked hint was an English
  literal in the MWL, now `port.class.<class>.unlockhint` (English and French; Java has no such
  string at all - it never states an unlock condition). (2) `closeJournal()` left `journalWindow`
  pointing at a closed `mwg/ui` `Window`; the next `positionInterface` call then threw
  `Cannot set properties of null (setting 'x')`, which broke the inventory panel that calls it
  (`refreshInventoryPanel`) for the rest of the run. `closeJournal` now drops the reference, so
  the `if (this.journalWindow)` guard means something. The inventory's four filter tabs were also
  hardcoded English, now `port.ui.bag.*` (French `Équip.` kept short deliberately - the buttons
  are 35px wide and the fully-spelled word overflowed).

- **`mwg` 0.7.6 adopted (2026-09-11).** Published latest, pin moved from `^0.7.4`. Two changes,
  neither needing port code: `Blob.spread` now **returns the cells it just emptied**, which is the
  burnout hook the flamable work was waiting for (`GEOMETRY-AND-FIRE.md` §4.2 asked for exactly
  it) - so `Fire.evolve`'s "the fire left a flamable cell, turn it to embers" is now expressible
  without diffing `cellsAbove`; and `pixi.js` became an optional peer dependency, which this port
  needs no change for because it already lists `pixi.js` in its own dependencies. The bump itself
  is inert: MWL output byte-identical, tsc/build clean, 47/47 simulation, item suite, smoke and
  save round-trip clean.
- **`src/ui/floatingText.ts` deleted: the damage numbers are `mwg/ui`'s `FloatingTextStack`.**
  0.7.4 gave it both things the port's layer existed for - `FloatingTextOptions.hold` for Java's
  hold-then-fade curve (`alpha(p > 0.5f ? 1 : p * 2)`) and the keyed stacking `FloatingTextLayer`
  had approximated by proximity - so the 101-line wrapper went, along with its stale claim that
  the framework's class "fades linearly and has no per-target stacking". Java's numbers are kept
  through the stack's options: `LIFESPAN = 1f` second, one tile (`DungeonTilemap.SIZE`) of rise,
  `hold: 0.5`, one key per creature from a `WeakMap`, and the world-space trick of rasterising at
  full size then scaling the pop-up down (with the rise divided by the same factor, so it still
  travels exactly one tile). Verified live (`_browsercheck/floaters_check.mjs`): two numbers on one
  target in one turn both exist, the second is offset, scale is exactly `1/3`, alpha is `1` at
  300 ms of a 1 s life, `0.8` at 600 ms and the pop-up is gone by 1 s; the real `showStatus` path
  shows 'search' with no console or page errors.
- **Both defects carried here were fixed upstream in 0.7.7, and this port has now adopted them
  (2026-09-12, on 0.7.8).** The first: Java's `FloatingText.push()` anchors the **newcomer** on the
  target and nudges the **older** text *up* to `below.top() - above.height() - 4` (4 px gap),
  also shortening the nudged text's `timeLeft`; 0.7.4's stack instead moved the newcomer *down* by
  `height + 1`. That was found here by a live check, filed as
  `tools/scratch/mwg-proposal/0003-floating-text-stack-upward.patch`, and 0.7.7's changelog records
  it as fixed - "found by a consumer measuring it, not by the tests, which asserted the offset's
  magnitude and never its direction" - replacing `floatingTextStackOffset` with
  `floatingTextStackLift`/`floatingTextStackMoves` (pure arithmetic, now tested) and also fixing a
  lift that survived only one frame and the key rule (a stack keys on `key` alone, as Java's
  `stacks.get(key)` does). The second: a pop-up scaled *after* `push` was measured before the
  scale, because a `FloatingText`'s height includes its own scale - the port rasterises at 21px and
  draws at 7, so stacked lines were spaced by ~3x the drawn height. `push` now takes a `scale`
  applied before measurement, and `showStatus` passes it (`main.ts`) instead of chaining
  `.scale.set(...)`; `size`/`rise` stay divided by the scale because both are expressed in the
  pop-up's own pre-scale space. Verified live on the built page (`tools/scratch/floaters-livecheck.mjs`):
  the stack's measured height is the drawn one, a second number on one target lifts the older line
  *above* it (not below), and the real `showStatus` path still shows its text with no page errors.

- **Adopted `mwg/core`'s `RunHistory` for the run rankings.** `src/rankings.ts` no longer
  hand-rolls its own localStorage read/validate/sort/write: `RunHistory<RunRecord>` owns the
  storage, the id/`endedAt` stamping and the ranking sort, and only the summary shape is
  SPD-specific - the split `RunHistory` documents. Two behaviours changed with the adoption,
  both deliberate and stated at the call site: the retained 20 runs are now the most RECENT
  (`RunHistory`'s own "oldest runs are dropped" rule) rather than the highest-scoring 20, and
  the storage key is now `mwg-runs:spd-on-mwg.rankings.v1` rather than the old
  `spd-on-mwg.rankings.v1`, so runs recorded before this change are not carried over. A corrupt
  or denied store still degrades to an empty title-screen list, as before.
- **Corrected two stale comments** (`src/ui/bar.ts`, `src/ui/floatingText.ts`) that still claimed
  `mwg` was "a local dependency that can drift under this project between sessions" with a "once
  per session" check - removed along with the local-checkout workflow they described. Both files'
  substantive claims are unchanged: each is generic code that belongs in `mwg/ui`, together with
  the exact capability the framework counterpart still lacks (`Bar`: a texture fill and
  `HealthBar.layout()`'s ceil-to-whole-pixel rounding; `FloatingText`: the hold-then-fade alpha
  curve and per-target stacking).
- **Fixed both verification harnesses, which were still compiling a local checkout of the
  framework's sources.** `tools/verifySimulation.mjs` and `tools/verifyItemWorkflows.mjs` reached
  into a sibling `../MW_games` tree - a *different version* from the pinned dependency (0.7.3
  against the 0.7.2 this port pins), so both suites were exercising something the game does not
  ship. They now shim the installed package's `dist` instead (ESM required from CommonJS, which
  `require()` bridges directly on Node >= 22.12). This also fixes `npm run test:simulation`, which
  was failing outright before this pass: the old hand-written list of framework modules to
  compile had missed `Campaign.ts` once the checkout's `simulation/index.ts` grew it, leaving an
  `index.js` requiring a file that was never emitted (`Cannot find module './Campaign.js'`).
  Shimming the package barrel means the harness follows whatever it re-exports, so that staleness
  cannot recur.
- **Fixed the rankings window's sizing** (`src/scenes/titleScene.ts`), found by this pass's
  screenshot step rather than by any test. Its height was `Math.min(260, entries.height + 50)`,
  a guess that ignored both the frame/title chrome `Window` adds around `content` and the close
  button placed at `contentHeight - 18`. Measured live, three runs needed 97px of content in the
  74px that guess produced, so the button was drawn over the last row and the final score fell
  past the panel's bottom edge. It now derives the chrome height from a window of known size and
  sizes the frame from what is actually inside it (rows, gap and button) through `Window.resize`;
  the same live measurement now reports 113.3px of content with the button clear of the last row,
  reconfirmed visually.
- **Checked both "framework could not do this" claims against the pinned package, and one was
  wrong** (2026-09-11, follow-up to the same day's alignment pass). `src/ui/floatingText.ts`'s
  holds: `mwg/ui`'s `FloatingText` really does fade linearly with no stacking, so a patch
  proposing the hold-then-fade curve and a `FloatingTextStack` sits in
  `tools/scratch/mwg-proposal/`. `src/ui/bar.ts`'s does not: the pinned
  `@datamoc/mw_games@0.7.2` already ships `fillTexture` and `roundUpToPixel` on its own `Bar`
  (`tests/bar.test.ts` covers the rounding), so the two reasons it gave for existing are gone.
  It is not deletable yet either: `mwg`'s `Bar` cannot recolour its fill after construction or
  colour its track, and this file does both (the boss bar's bleeding red, the HP bar's black
  missing-health strip). Those two are proposed as
  `tools/scratch/mwg-proposal/0002-bar-runtime-colour-and-track.patch`, with framework tests,
  and the deletion is scheduled in ROADMAP.md's framework-adoption items behind it. Also confirmed while checking: five capabilities this port
  approximates - `Level.viewDistance`, `TerrainKind.flags`/`extras`, `Scheduler` priority,
  `Roguelike.Targeting`'s `Ballistica`, and `MultiTurnBeam`/`MultiStageAbility` - are all in
  0.7.3, so the work there is adopting them, not asking for them.
- **The `mwg` pin is now 0.7.3** (2026-09-11), the published latest. Bumping it alone changed
  nothing else in this port: the MWL compile emits byte-identical generated modules, tsc and the
  build are clean, `test:simulation` is 47/47 and `test:items` passes, and the browser checks
  (start-up, save round-trip, and the depth-25 live run covering Yog's fist decks, the Stronger
  Bosses challenge pairs, the beam burning terrain and the phase view radii) are identical to
  0.7.2. `tools/check-mwg-version.mjs` (`npm run mwg:check`) reports the pin, the installed
  version and npm's latest in one line and is the hourly check while porting, per AGENTS.md.
  Adopting what 0.7.3 makes redundant is tracked separately in ROADMAP.md.
- **`mwg` 0.7.4 adopted (2026-09-11), and the port's own `Bar` is gone with it.** 0.7.4 is the
  published latest, so the pin moved to `^0.7.4`; the MWL compile emits byte-identical modules,
  `check`/`build` are clean, both suites pass and the browser smoke/save checks are clean, so the
  bump alone changes nothing here. What the release unblocked came with it: `src/ui/bar.ts` is
  **deleted** (and `tools/scratch/uiCheck.ts` with it, since it only proved the rounding that the
  framework now owns and tests), with the HUD's two bars, the per-monster bars and the boss bar
  moved to `mwg/ui`'s `Bar` - `fillTexture`/`background` for the art and the black track,
  `roundUpToPixel` for `HealthBar.layout()`'s sliver rule, `setValue` for the fraction and
  `setColor` for the boss bar's bleeding tint. Verified live (`_browsercheck/bar_check.mjs`): the
  HP bar reads exactly `hp/maxHp`, a half-dead monster gets its own bar at `0.5`, Goo's boss bar
  reads `0.2` and tints `0xff7777` on the 25% edge, and the HUD screenshot shows the bar drawn
  over its black track. One capture caveat learned here: `page.screenshot()` returned a stale
  frame of the *previous* scene on this WebGL canvas, so the HUD was captured with
  `canvas.toDataURL()` inside a double `requestAnimationFrame` instead.
- **Correcting my own claim: the Yog beam's door handling is faithful, not a bug** (2026-09-11).
  I first recorded the opposite, from a grep that never matched `DOOR`; at `v3.3.8`
  `Terrain.flags[DOOR] = PASSABLE | LOS_BLOCKING | FLAMABLE | SOLID` and
  `flags[OPEN_DOOR] = PASSABLE | FLAMABLE`, so a door *is* combustible and the beam's
  `[GRASS, HIGH_GRASS, DOOR, DOOR_CLOSED]` list reproduces it - the port's own comment already
  said so. What the list still misses, if those kinds ever reach the live level, is
  `FURROWED_GRASS` (trampled high grass, which keeps the flag) and the `SewerLevel` case where
  `REGION_DECO`/`REGION_DECO_ALT` are force-marked flamable (`flags[REGION_DECO]` is `STATUE`'s,
  so it is the level, not the terrain, that makes those burn). Recorded here rather than fixed in place because the whole flammable model is a gap:
  the port still has no complete flamable map or heap-burn primitive, and `spreadFire()` retains
  those explicit gaps. This pass adds the first live slice: fire decays in place, and the
  representable grass/door cells burn out into a distinct passable `EMBERS` kind (with plants
  removed), rather than collapsing back to `floor`. `FURROWED_GRASS`, region decorations,
  occupant ignition is still handled only by the existing hero/monster fire pass, while ground
  scrolls/dewdrops are destroyed, bombs detonate, and plants wither while a fire cell is active.
  Meat-to-chargrilled conversion is now ported for the compact Mystery Meat heap: active fire
  replaces it with the authored `chargrilledMeat` identity, preserving the heap and ordinary-food
  eat path. Region decorations remain unported; ordinary fire now propagates orthogonally onto
  representable grass/door terrain with Java's volume-4 seed. **Corrected 2026-10-01**: region
  decorations are no longer wholly unported - `gameBridge.ts` maps `REGION_DECO`/`REGION_DECO_ALT`
  to `wall` with Java's SOLID passability since 2026-09-16 and `isFireFlammableTerrain` burns the
  sewer ones - so R010's remaining scope is their distinct sprite, the per-region examine text and
  the flamable-model completeness. The
  full scoping, both sides read, is
  `tools/scratch/mwg-proposal/GEOMETRY-AND-FIRE.md`, which also corrects two claims of mine in
  ROADMAP.md: `TerrainKind.flags`/`extras` and the `Scheduler` priority are **not** in the
  published 0.7.3 - both are in the unpublished 0.7.4 checkout.
