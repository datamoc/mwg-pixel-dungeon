# Port coverage

Row categories: **Ported** (reproduces the real numbers/logic), **Simplified** (the shape with a
stated reduction), **Not ported** (SPD has it, we do not), **Divergence (deliberate)** (we
deliberately differ - see AGENTS.md's fidelity policy, settled 2026-09-11: iso with Java is no
longer the goal, and Java's own bugs and limitations are not reproduced).

## 2026-09-11 mwg alignment pass

- **`Fire.evolve()` / `Level.destroy()` / `Heap.burn()` / `Plant.wither()`** — `main.ts`'s
  scene-owned `spreadFire`, `burnFireTerrain`, and `burnFireContents`, plus `Terrain.EMBERS` and
  raw `FURROWED_GRASS` in the level bridge. **Ported for the representable terrain/content slice:**
  existing cells lose exactly one volume per turn, empty flammable orthogonal neighbours ignite at
  volume 4, active cells burn their scroll/dewdrop heap, detonate bombs, convert Mystery Meat to
  Chargrilled Meat, and wither plants; expired grass, furrowed grass, doors, locked doors, and
  barricades become passable `EMBERS`. A burned cell restitches its own tile face and the
  features layer is redrawn when a plant withers, the same redraw every grass change already
  performs - without it the terrain changed in the model only. The generic MWG Blob remains
  intentionally uninvolved in this SPD-specific transition. Sewer region wall decoration, webs,
  and Java's full heap/occupant subtype rules remain **Not ported** and are kept out of the coarse
  terrain model.

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
- **Known defect in 0.7.4's `FloatingTextStack`, found by that verification and not yet fixed.**
  Java's `FloatingText.push()` anchors the **newcomer** on the target and nudges the **older** text
  *up* to `below.top() - above.height() - 4` (4 px gap), also shortening the nudged text's
  `timeLeft` (**Simplified** here, pending a framework patch): `FloatingTextStack` instead moves
  the newcomer *down* by `height + 1`, so a second number in one turn lands below the target rather
  than above the first - the framework's own `floatingTextStackOffset` is a pure function and a
  sign/order change fixes it, with the lifetime shortening as a second step. Recorded in
  `tools/scratch/mwg-proposal/0003-floating-text-stack-upward.patch`, written the same day (applies
  to 0.7.6, tsc clean, its tests 9/9 and asserting the direction the old ones never checked). The
  adoption above is still a strict improvement over the port's proximity approximation, which is
  why it is not held back for it; the port takes the fix when a release carries it.

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
  representable grass/door terrain with Java's volume-4 seed. The
  full scoping, both sides read, is
  `tools/scratch/mwg-proposal/GEOMETRY-AND-FIRE.md`, which also corrects two claims of mine in
  ROADMAP.md: `TerrainKind.flags`/`extras` and the `Scheduler` priority are **not** in the
  published 0.7.3 - both are in the unpublished 0.7.4 checkout.
## 2026-09-10 roadmap pass

- **Ported:** the Dwarf King's death now awards the identified, non-upgradable King's Crown;
  the Rat King consumes it when a real armor is worn and grants the Ratmogrify armor ability.
  Ratmogrify affects the nearest visible non-boss enemy for six turns and preserves its combat
  stats while routing it through ordinary melee/pathing. The port has no `TransmogRat` actor or
  cell-targeting window, so the original mob sprite remains and those two presentation/targeting
  details are documented reductions at the call sites in `main.ts`.

## Simulation extraction (steps 1-5)

Turn contracts and hunger live in `src/simulation/turns.ts` and
`src/simulation/hunger.ts`. `src/adapters/sceneSimulation.ts` now delegates the
bounded loop to MWG's generic `advanceToInput` rather than duplicating it.
Combat rolls and live stats now live in `src/simulation/combat.ts`, and buff application/
timing in `src/simulation/buffs.ts`. `combatState.ts` defines sprite-free data and
`random.ts` defines the injected random port. The adapters preserve current mwg draws
and mutable scene buff maps; `src/combat.ts` retains the existing public calls and UI hook.
Hero action policy is in `simulation/heroActions.ts`; `adapters/heroActions.ts` preserves
free actions, failed attempts, paralysis exceptions, and no double-spend on descent.
Unrecognized action names (including Object-prototype names) are rejected explicitly.
This extraction preserves the existing gameplay. Monster AI, attack orchestration,
on-hit effects, and HP application remain in the scene. `simulation/heroTurn.ts` now
orders end-of-turn effects through live callbacks. It preserves the existing simplified
timing: hunger/fire death does not stop the sequence, but fatal buff damage does.
Effect implementations and presentation remain scene-owned.
`simulation/movement.ts` selects wait, interaction, attack, door, roots, movement,
or wall through plain, lazy world queries. Grass, pickup, trap, and stair effects remain
in their existing scene order; this is a decision extraction, not a full movement simulation.
See `SIMULATION_ARCHITECTURE.md` for the boundary, retained limitations, and next steps.

Tracks which blocks of SPD's real Java source this port has actually translated into
`src/main.ts` (or `src/images.ts` for assets), block by block - a method, a field
initializer, a `switch` case - not line by line. "Ported" means the TypeScript reproduces
that block's real numbers/logic; "Simplified" means it reproduces the *shape* of the
mechanic with a stated, deliberate reduction; "Not ported" means SPD has this and this port
currently does not, at all.

Update this alongside `main.ts` - when a block moves from "Not ported" to "Ported", add its
row here in the same commit, the same way the file header comments are kept current.

The transmutation implementation also preserves an eligible ring's upgrade level when
rerolling its type; this was corrected after a focused audit found the level was being
dropped despite the behavior already being documented as preserved in the transmutation row.
The picker now also retains the exact selected transmutation-scroll instance across its
asynchronous UI callback, preventing a duplicate stack from consuming the wrong scroll.

The authored monster catalogue is now in `src/content/monsters.mwl` and compiled before the
game imports it. `monsters.ts` adapts those MWL values into the scene's typed combat records
with required-field validation; sprite film dimensions and idle frames remain adapter metadata
until the MWL asset-reference pass. The catalogue includes the port's documented special-actor
values and balance reductions (for example invulnerable NPCs, Goo's base state, and Yog's
scaled encounter), so those values are no longer duplicated in TypeScript.

The weapon, armor, and wand catalogues now follow the same path in `src/content/items.mwl`.
Tiered variants use deterministic MWL item IDs, while portable numeric properties such as wand
damage and weapon speed are represented by MWL effects and read by `items.ts`; formulas and
runtime behavior remain in the game hooks.

The ten artifact definitions now live in `src/content/artifacts.mwl`, including their display
keys and charge values. `artifacts.ts` only adapts the generated resource into its public typed
records; artifact charge behavior remains executable game logic.

The potion and scroll generator decks now live in `src/content/decks.mwl`; `generator.ts` reads
their class order and default probabilities from the compiled MWL traits and validates matching
lengths before use. This preserves the Java RNG table data while leaving generator algorithms and
substream handling as executable code.

The runestone deck now follows the same model in `src/content/runestones.mwl`, including the
correct `StoneOfDetectMagic` entry and the zero-weight boundary entries from Java.

The five missile decks now live in `src/content/missiles.mwl`. `generator.ts` consumes their
class order and equal weights through the same validated MWL deck reader, preserving the
level-generation substream behavior.

The five weapon-tier generator decks now live in `src/content/weapon-decks.mwl`. This preserves
the corrected tier-3 probability table and keeps generator class ordering separate from the
runtime equipment catalogue.

The potion and scroll unidentified-appearance key tables now live in
`src/content/appearances.mwl`; `spdKeys.ts` validates and reads their ordered keys through the
compiled MWL traits. The existing seeded per-run assignment simplification remains unchanged.

The floor tier matrix, affix pool sizes/weights, and Ghost reward tables now live in
`src/content/generator-tables.mwl` and `src/content/generator-rules.mwl`; `generator.ts` validates
their numeric rows before using them for RNG. The Java-specific correction comments remain next
to the executable adapter logic.

The WAND, RING, ARTIFACT, and FOOD generator deck class lists and weights now live in
`src/content/generator-decks.mwl`; `generator.ts` reads them through the shared MWL deck adapter.

The generated potion, scroll, seed, runestone, food, and bomb item identities now live in
`src/content/consumables.mwl`; `spdKeys.ts` consumes their MWL names while retaining explicit
aliases for runtime-only quest items. `sourceInventoryItem` now normalizes both Java class names
and painter short ids (`PotionOfLevitation`/`potionOfLevitation`) to the same appearance-table id;
the lowercase painter form previously crashed on pickup. Their executable use effects remain in
the game hooks.

Active `WellWater` cells now have a scene-owned, FOV-gated pair of expanding ripple rings over
the well. This reproduces the Java water-surface animation's visible intent; the port simplifies
the underlying effect to deterministic vector rings rather than Java's shared ripple emitter.

`WndJournal` now exposes Guide, Notes, and Items tabs. Guide pages use the bundled adventurer
documentation, Notes retains regional lore and quest status, and Items lists potion/scroll/ring
classes with the current known/unknown state. The identification state is **Simplified** because
this port persists `identified` on carried instances rather than Java's run-wide item-class journal.

Ground items adopted from room painters now retain their authored cell only when it is a valid,
passable non-stair cell; if terrain reduction leaves a key or other queued item inside a wall, the
port relocates it through the normal valid-cell chooser instead of creating an unreachable pickup.

The SewerLevel trap class order and weights now live in `src/content/dungeon-rules.mwl`; the
SewerPainter adapter validates and reads the depth-specific MWL rule while retaining Java's
depth-1 special case and RNG order. Trap effects themselves remain a separate gameplay hook gap.

Monster loot entries now live in `src/content/loot-rules.mwl`; `monsters.ts` validates and adapts
the MWL table while retaining the executable roll and limited-drop decay hooks. Java-specific
multi-item and category-selection behavior remains documented as a port simplification.
The fifteen generated missile classes are catalogued in `src/content/missiles.mwl` with names,
tiers, stackability, and base damage ranges. `generatedInventoryItem()` now preserves their
concrete MWL id/source class/tier when generated loot crosses into the inventory boundary;
the class special action still uses the compact shared ammo counter, so pickup integration and
distinct missile behavior (boomerang return, bolas, etc.) remain open.
The same resource now carries the ten limited-drop decay parameters; the linear and power-law
formulas remain explicit executable hooks so their Java semantics stay reviewable.

The five main scenario chapter ranges and boss depths are now authored in
`src/content/scenario-rules.mwl`; `mwlContent.ts` validates ordering and `monsters.ts` verifies
that every chapter points at the matching boss transition. Dialogue, objective progression,
and boss-fight scripting remain scene-owned runtime behavior.
The same resource now owns the exact quest/NPC spawn depth lists and roll bases for Ghost,
Wandmaker, Shopkeeper, Blacksmith, and Imp; `main.ts` consumes those tables instead of carrying
duplicate depth literals. Quest-specific dialogue and completion logic remain runtime hooks.
Quest stage condition keys and objective descriptions are also authored in the
`questDefinitions` MWL trait and consumed when building the runtime `QuestLog`; localized NPC
conversation strings remain in the existing i18n catalogue.

Hero progression's maximum level and experience-curve coefficients are authored in
`src/content/progression-rules.mwl`; `main.ts` retains only the formula adapter consumed by
MWG's `Progression` class.

Alchemy ingredient energy values and executable food plus `Bomb.EnhanceBomb` recipes are
authored in `src/content/alchemy.mwl`, with their named outputs in
`src/content/consumables.mwl`; `src/alchemy.ts` parses them and the alchemy-pot interaction
resolves them through MWG's all-or-nothing `craft()` transaction. The same MWL resource contains
a manifest of every recipe registered by SPD's `Recipe.java`, and import-time validation rejects
any recipe reference without an authored item identity. The alchemy-pot interaction is still a
single-choice picker rather than Java's multi-ingredient window. The carried energy pool is now
persisted, fed by EnergyCrystal pickups, and consumed by recipe costs; the scene still lacks
Java's scrap/add controls. Seed-to-potion brewing,
catalysts, exotic items, and the specialty bombs' subclass effects remain open.

The `Alchemize` spell's **cast** is now ported (`useAlchemize`, dispatched from `useItemById`):
casting it opens the shared item picker over the bag and scraps one unit of the chosen consumable
into `Item.energyVal()`, identifying it as it goes and spending no turn - Java's `WndEnergizeItem`
/`energize()` shape. The yield is authored per *kind* in `alchemy.mwl` (seed 2, runestone 3,
scroll/potion/food 6), with `alchemyEnergyFor` reducing a concrete port id (`potionHealing`,
`seedMageroyal`...) to its kind and applying `Item.energyVal()`'s four `isKnown()` overrides
(`potionStrength`/`potionExperience`/`scrollUpgrade`/`scrollTransmutation` give 10 while
identified). Stated reductions: Java's window also offers a sell branch and an "energize all"
button, both folded into the single picker action, and the per-class values for outputs this port
cannot yet obtain (brews/elixirs 12, exotic potions +4/+6, `GooBlob`/`MetalShard` 3) are not
authored. **Its recipe is not executable**: `Alchemize.Recipe` takes *any* `Plant.Seed` plus *any*
`Runestone`, and the port's recipe model has concrete ingredient ids only, with runestones carried
under 12 `stoneOf*` ids plus a generic `stone` id that doubles as the throwing-missile identity -
so a faithful two-ingredient row cannot be authored without either a wildcard ingredient or an
id-taxonomy split. Recorded as not ported rather than approximated with one seed/runestone class.
The runtime generic seed also gained its own MWL identity (`id=seed`, named through SPD's
unknown-seed placeholder), which it previously lacked - bag seeds rendered the raw id `seed`
because neither `ITEM_KEYS` map carried one. `shopPricing`'s `alchemize` value was corrected from
5 to `20/8 = 2.5` per unit (`Alchemize.value()`, `OUT_QUANTITY` 8); the old comment cited a
nonexistent `40 * quantity / 8`.

Monster actor classifications (flying, NPC, boss, immovable, and initially-awake) now live in
`src/content/actor-rules.mwl` and are adapted to runtime sets. Special actor abilities and AI
decision hooks remain executable TypeScript until their complete Java behavior is ported.
Variant-to-base actor inheritance aliases are also authored in that resource and consumed by
`monsters.ts`.

The monster special-turn profile assignments now live in `src/content/actor-rules.mwl`; the
scene resolves those MWL profile names to executable TypeScript hooks. The hook algorithms and
their documented Java simplifications remain in `main.ts`.
The same resource now contains a hook manifest; the MWL compiler validates profile references,
and scene initialization fails explicitly if a declared profile has no executable hook.

The class and subclass talent membership and ordering are authored in
`src/content/talent-rules.mwl` and adapted by `talents.ts`; rank limits remain adapter metadata
while the formulas stay in `talentEffects.ts` hooks.
The tier-unlock thresholds are also authored in that MWL resource.

Buff durations and the negative-buff classification are authored in
`src/content/buff-rules.mwl` and consumed by the simulation buff adapter; ticking, damage
formulas, and expiry semantics remain executable rules.

The five fixed boss-depth transitions and victory messages now live in
`src/content/scenario-rules.mwl`; scene victory/death execution remains in `main.ts`.

The standard monster rotation by depth and its regional fallback rosters now live in
`src/content/dungeon-rosters.mwl`; `monsters.ts` validates and adapts those lists.

The standard-room class weight rows now live in `src/content/room-rules.mwl`; `regularLevel.ts`
validates the 26-class rows and preserves Java's regional row inheritance by depth.
Hero class ammo categories, badge gates, and unlock hints are authored in
`src/content/classes.mwl` and adapted by `classes.ts`; the badge achievement catalogue itself
is now authored in `src/content/badges.mwl` and adapted by `badges.ts`, including counters,
targets, descriptions, and badge sprites. The Cleric unlock rule remains the explicitly
documented port-specific fallback because this checkout has no Java counterpart for it.
Regional standard/special room counts, maxima, and RNG weight arrays are also authored in that
resource and consumed by `regularLevel.ts`.
The standard room class order is also authored there and validated before room selection.

The special-room selection queues (equipment, consumable, crystal-key, and potion-spawn
categories) are authored in `src/content/room-rules.mwl` and adapted by the special-room
registry. Their queue mutation and RNG behavior remain executable TypeScript because those
are runtime algorithms rather than resource data.

The monster roster adapter no longer carries a duplicate TypeScript roster fallback: every
standard depth entry and regional fallback must be present in `src/content/dungeon-rosters.mwl`,
so an incomplete resource fails at startup instead of silently reverting to code data.

The ConnectionRoom depth-indexed class weights are authored in `src/content/room-rules.mwl` and
validated by `connectionRoom.ts`; its six-class registration order is authored in the same
resource and only adapted to the concrete room behavior.

The Prison, Caves, City, and Halls trap class/weight tables now live in
`src/content/dungeon-rules.mwl`; their painters use one validated MWL adapter. Trap effects
remain a separate gameplay-hook gap.

Monster resource entries now carry their logical sprite references (`image=assets/...`) in
`src/content/monsters.mwl`, and the generated `mwlAssets.json` includes the deduplicated set.
The MWL compiler now validates those manifest entries against `src/assets` during the build, so
missing referenced files fail fast instead of producing a partial resource catalogue.
The renderer still registers its Vite-imported textures directly, but `images.ts` now consumes
the generated MWL asset manifest through a bundler-facing URL registry and validates every
manifest entry before loading sprites. Terrain and UI references still use renderer metadata
directly.

The MWL build now rejects duplicate item, monster, and trait IDs and validates every monster
roster, boss-transition, and asset reference before emitting generated files. Deterministic
output comparison is also performed by compiling the resource tree twice; broad
generated-vs-Java parity fixtures remain open.

Weapon enchantments and armor glyphs now follow the same path. Their ids, triggers
(`strike`/`defend`/`passive`), roll weights, curse flags, and descriptions are authored in
`src/content/affix-rules.mwl`, and `itemAffixes.ts` adapts them into the `mwg/actors`
`AffixTable`s `generatedInventoryItem` already rolled through; `Unstable.randomEnchants`'
delegate list is authored beside them and cross-checked against the enchant catalogue. The
per-id proc bodies stay in `main.ts`, where they need live scene/combat state. Moving the tables
is behavior-preserving: `affix-rules.mwl` was verified value-identical to the inline arrays it
replaced (20 weapon entries, 21 armor entries, 10 delegates), and a live browser run that called
`generatedInventoryItem` 6000 times per table produced exactly the expected 13 good/7 cursed
weapon ids and 13 good/8 cursed glyph ids with none missing or spurious, while a plain
(non-cursed, non-enchanted) roll left `affix` undefined in all 200 samples. `tools/compile-mwl.mjs`'s
`validateAffixTables()` enforces the row shape, id uniqueness, and delegate membership at build
time, so a malformed affix row now fails `npm run build` rather than the first generated roll.
`npx tsc --noEmit`, `npm run build`, `test:simulation` 46/46, and `test:items` 1/1 all pass.

Status immunities (`Char.isImmune`) now follow the same path. The three class lists this port
models - Brimstone's fire immunity (`Brimstone.java`, `Burning`), AntiMagic's magical-status
immunity (`AntiMagic.java`'s `RESISTS`: charm/weakness/vulnerable/hex/degrade/magicalSleep), and
Frost's chill immunity (`Frost.java`, `Chill`) - are authored in
`src/content/resistance-rules.mwl`. `tools/compile-mwl.mjs` emits
`src/simulation/mwlStatusImmunities.ts` (the same pattern `mwlBuffDurations.ts` already uses, so
the framework-free simulation boundary is preserved) and validates every referenced id against
the buff-duration catalogue. `combat.ts`'s `addBuff` now uses membership sets instead of the
hardcoded `id === '...'` chains, so a newly ported immunity is a data change. This is
behavior-preserving and now covered by a dedicated `test:simulation` check (47/47): fire immunity
blocks only `burning`, magic immunity blocks exactly those six magical statuses and not `poison`,
and an active `frost` buff blocks only `chill`.

**Browser-verified 2026-09-11 (first real start-up smoke of the MWL migration):** the resource
tree compiled and type-checked cleanly but did not actually run. Importing the level generator
threw on two malformed `room-rules.mwl` rows, which a real browser load surfaced immediately as
a black screen - exactly the "type-checking is not evidence" case section 10 of `ROADMAP.md`
warns about, and the reason this pass did not treat the green build as sufficient. Both bugs are
fixed and re-verified live: the five `regionRoomCounts` rows were missing their `specialBase`
field entirely (six fields where the runtime parser in `spdLevelGen/regularLevel.ts` reads
seven; Caves/City/Halls also need `2`, which the missing field had hidden), and the depth-5
`standardRoomChances` row carried 27 values where Java's `StandardRoom.Chances[5]` has 26.
`tools/compile-mwl.mjs`'s new `validateRoomRuleTables()` now enforces both shapes at build time
(seven fields per region row with non-empty, non-negative weight lists; one chance entry per
class, cross-checked against each table's own `classes` list), so this class of data/parser
mismatch fails `npm run build` instead of first floor generation. JavaScript build/test coverage
is unchanged and still green (`npx tsc --noEmit`, `npm run build`, `test:simulation` 46/46,
`test:items` 1/1); browser run: the built `dist/index.html` loads with no console or page
errors, Enter reaches class select, a pointer click selects a class, Enter starts depth 1
(a 27x46 level with 9 creatures and 12 ground items), and turns process. The rendering itself
is the real dark FOV-limited floor, not a failed load - only the starting room is lit.

The Troll Blacksmith now retains quest favor and reforge count across saves. Its forge
selects two identified, non-cursed, same-category weapon/armor payloads, keeps the higher
level item, upgrades it once, consumes the other, and charges Java's progressive reforge
cost. The remaining harden/upgrade menu, missile/seal transfer details, and alternative
quest reward bookkeeping are still open and remain explicitly simplified in `main.ts`.

Two corrections to earlier revisions of this file: this checkout's `DM100.java` has no
self-destruct blast (its kit is melee plus a lightning zap; the blast belongs to
`DM200`/`DM201`/bomb territory), and its `Guard.java` has no peaceful-until-provoked state
or lethal first blow (it pulls with chains). The old rows claiming those mechanics have
been replaced with what the Java actually contains.

## Core combat (`actors/Char.java`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `hit()`: `Random.Float(acuStat) >= Random.Float(defStat)` | `rollHit` | Ported |
| `hit()`'s attacker/defender roll multipliers (`Bless` x1.25, `Hex` x0.8, `Daze` x0.5, magic `accMulti` 2 for zaps) | `accRollMulti`, `rollHit`'s `magic` flag | Ported |
| `attack()`'s damage line: `damageRoll() - drRoll()`, floored at 0 | `rollDamage` | Ported |
| `attack()`'s damage multipliers (`Berserk` scaling, `Fury` x1.5, `Weakness` x0.67, `Vulnerable`-taken x1.33) | `rollDamage` | Ported, with one simplification: `Berserk.power` is the missing-HP fraction (no rage gain/decay clock) |
| `ChampionEnemy` (full type list with per-type procs) | `Creature.champion`/`championPower`, `rollHit`/`rollDamage`/`accRollMulti`, `takeMonsterTurn` | Fetched `ChampionEnemy.java` from the local shattered-pixel-dungeon checkout to confirm every type's exact factor - found and fixed a real bug plus added 2 more types. **Blessed's `evasionAndAccuracyFactor()` was wrong outright**: real Java is x4, this port had x3 - an unconfirmed guess, now corrected in `accRollMulti`. **Blazing**: +25% dmg (`meleeDamageFactor() = 1.25`) and ignites its target on hit (`onAttackProc`), unchanged and correct; its `detach()` seeding fire around itself on death is still not ported (no camera/fire-blob wiring at that call site). **Giant and AntiMagic were entirely missing; Giant is now ported, AntiMagic is not**: `Giant.damageTakenFactor() = 0.2` is now a flat multiplier in `rollDamage`, applied on the defender side after armor reduction - browser-verified with a 30-swing sampling comparison giving a 0.199x ratio against baseline, matching 0.2x within noise. `Giant.canAttackWithExtraReach()` (a 2-cell melee reach via pathfinding, also making the mob physically large per `Char.properties()`) is not modeled - this port's attack range is fixed at 1 regardless of champion type. **Growing is now ported**: its own rising `multiplier` (starts 1.19, `+0.01`/turn via a real separate `4*TICK`-cost actor slot in Java) is now `Creature.championPower`, incremented once per `takeMonsterTurn` call instead of on a second scheduled actor (this port has no secondary-actor scheduling to give it its own slot), and read by `meleeDamageFactor()`/`damageTakenFactor()` (its own inverse, `1/multiplier`)/`evasionAndAccuracyFactor()` (same as offense) in `rollDamage`/`accRollMulti`. Persisted through floor save/load (`championPower` added to `SavedCreature`). Browser-verified: a `championPower` starting at 1.19 became exactly 1.20 after one `takeMonsterTurn` call, and a 40-swing sampling comparison at `championPower=1.19` gave a 0.814x damage-taken ratio against baseline (expected `1/1.19 = 0.840`, within noise). **AntiMagic and Projecting are now ported too, completing all 6 real types.** Re-reading `Char.damage()` (not just the buff class itself) showed the earlier "magic-vs-physical distinction" premise above was wrong: `damageTakenFactor()` is applied to every damage source alike (the loop sits right after the generic `resist()` call, before the separate, still-unported `AntiMagic.RESISTS` status-immunity check) - so `AntiMagic.damageTakenFactor() = 0.5` is just another flat multiplier, the same shape as Giant's 0.2, and needed no new system. Wired into `rollDamage` alongside Giant/Growing (fixing a wrong first-draft guess of 0.75x found while re-deriving the real value from source). **Projecting**: `meleeDamageFactor() = 1.25`, same shape as Blazing, now applied in `rollDamage`; its `canAttackWithExtraReach()` (a 2-4-cell melee reach via pathfinding) is not modeled, same pre-existing gap as Giant's own reach. The champion roll itself is still a flat 10% (real Java's `rollForChampion` instead scales a roster-wide budget by depth via `Dungeon.mobsToChampion`, not modeled), but the *type* pick is now a true 1-in-6 (`Random.element` over all 6 ids) matching Java's own `Random.Int(6)`, rather than the previous 1-in-4-of-the-ported-subset. **Found and fixed a real, separate bug this pass**: real `rollForChampion` only ever assigns anything at all when `Dungeon.isChallenged(Challenges.CHAMPION_ENEMIES)` is true - champions are an opt-in challenge in real Java, never a baseline mechanic - but this port's flat 10% roll had no such gate, so its own selectable "Champion Enemies" challenge toggle (already wired, e.g. for `stronger_bosses`) did nothing either way: champions spawned identically whether the challenge was on or off. Now gated on `isChallengeEnabled('champion_enemies')`, so toggling it actually changes something. **The by-depth exclusions are now ported too**: real Java also blocks Crab/Thief/Guard/Bat from ever becoming champions below depths 3/4/7/9 respectively (`instanceof` checks, so `GreatCrab`/`Bandit` inherit their base kind's exclusion) - reproduced with the same `kind`/`baseKind` checks this port already uses elsewhere, `this.depth` substituting for `scalingDepth()` as usual. The flat-10%-vs-real-depth-scaled-budget approximation itself remains unmodeled. `AntiMagic.RESISTS` (blocking certain status effects from certain sources) remains unmodeled - this port has no damage-source-class distinction for status immunity, only for the flat-multiplier factor above. No visual treatment (aura/tint) exists for any champion type in this port, ported or not - a pre-existing gap, not newly introduced. |
| `Dungeon.LimitedDrops` decay on top of `MOB_LOOT`'s flat chance | `src/monsters.ts`'s `LIMITED_DROP_DECAY`, `SewersScene.limitedDrops` (persisted with the run, not the floor - matches `Dungeon.LimitedDrops` being a run-lifetime static, reset only on a new game), the `kill()` loot-roll loop | Fetched `Bat.java`/`Necromancer.java`/`Guard.java`/`Slime.java`/`Skeleton.java`/`Thief.java`/`Swarm.java`/`DM200.java`/`Golem.java`/`Shaman.java`/`Warlock.java` to confirm every kind's real `lootChance()` override. **Bat/Necromancer/Guard are now ported**: each already had the right base chance in `MOB_LOOT` (`1/6` potion, `0.2` potion, `0.2` armor respectively), just missing Java's own further per-drop decay - `(7-n)/7`, `(6-n)/6`, `(1/3)^n` - where `n` is how many times *that exact drop* has already happened this run. Browser-verified live: killing 400 fresh bats produced exactly 7 drops before the counter hit 7 and the chance floor to `(7-7)/7 = 0` (matching Java's own hard cutoff, since that formula is linear and reaches exactly zero); the same test on necromancers produced exactly 6 drops, matching `(6-n)/6`'s own zero point; guards (whose `(1/3)^n` never mathematically reaches zero, only asymptotes) accumulated a real, incrementing counter without a hard cutoff, as expected. **`dm200`/`golem`/`shaman` are now ported too, found and fixed in the same follow-up pass**: `dm200`'s and `golem`'s `MOB_LOOT` entries had the wrong base chance outright (`{chance:0.125, kind:'armor'}` for both, an unconfirmed-guess bug with no derivation from Java's real `lootChance = 0.2` field) - both corrected to `0.2`, with their own `(1/3)^n` decay now wired (same shape as Guard's). `shaman`'s base chance (`0.03`) was already correct, just missing its own `(1/3)^n` decay, now added. Browser-verified live: 2000-3000 kills of fresh dm200/golem/shaman reached decay counters of 6/7/4 respectively, consistent with the `(1/3)^n` asymptotic falloff (no hard zero-point, unlike Bat/Necromancer's linear formulas). **Still not modeled**: Java's `Random.oneOf(WEAPON, ARMOR)` 50/50 category pick for dm200/golem - both always produce the `'armor'`-kind ground item here, a pre-existing simplification not newly introduced. **`slime`/`skeleton`/`thief`/`swarm` are now ported too, closing the last base-drop gap this row tracked**: each now has a real `MOB_LOOT` entry plus its own decay - `slime` (`0.2` base, weapon simplified to the shared weapon-as-`'armor'` stand-in dm200/golem already use, `(1/4)^n` via `SLIME_WEP`), `skeleton` (`1/6` base, same weapon-as-`'armor'` stand-in - Java's is any-tier `WEAPON` rather than Slime's `WEP_T2`, not distinguished here since this port has no per-tier weapon ground-item kind at all, `(1/3)^n` via `SKELE_WEP`), `thief` (`0.03` base, Java's `Random.oneOf(RING,ARTIFACT)` collapsed to the single `'ring'` kind rather than folding into the shared `'wand'` kind Artifact normally maps to - the `'wand'` choice would make it indistinguishable from a real wand pickup, `(1/3)^n` via `THEIF_MISC`), and `swarm` (`1/6` base `'potion'`, `(5-n)/5` via `SWARM_HP` - Java's own `1/(6*(generation+1))` term is not reproduced since this port's monster AI has no Swarm-split mechanic, so `generation` is always Java's own `0` case here). **`Warlock`'s `WARLOCK_HP` slot is now ported too, in its own dedicated `kill()` branch rather than the generic `MOB_LOOT` table** - it isn't a `lootChance()` override (Warlock's own top-level `0.5` chance has no `LimitedDrops` decay in Java at all), it's a separate roll on *which* potion class drops. This needed its own branch because this port's generic `'potion'` bag id always resolves to a full heal on quaff (`quaffPotion`'s own simplification), so routing Warlock through the shared `MOB_LOOT` `'potion'` kind the way Bat/Necromancer/Scorpio do would make every Warlock kill a guaranteed free heal - the exact opposite of real Java, where a Warlock drop is a genuine `PotionOfHealing` only on `Random.Int(3)==0 && Random.Int(8) > WARLOCK_HP.count` (reusing the shared `limitedDrops` map under a `warlock` key for that counter) and a redrawn non-`PotionOfHealing` class otherwise - reproduced here as a uniform pick among the 7 other potion ids this port already models by id (`potionStrength`/`potionFlame`/`potionMindVision`/`potionInvis`/`potionPurity`/`potionExperience`/`potionLevitation`). **`Scorpio` is now ported too, the same fix applied to a simpler case**: its real `createLoot()` is a flat `0.5` chance (no `LimitedDrops` counter at all) that redraws until the potion class is neither Healing nor Strength - reproduced as a uniform pick among the remaining 6 modeled potion ids, in its own `kill()` branch next to Warlock's. **`Succubus` is now ported too, the scroll-side equivalent**: its real `createLoot()` redraws until the scroll class is neither Identify nor Upgrade - this port's generic `'scroll'` bag id resolves to exactly those two, the same mismatch. Fixed the same way, in its own `kill()` branch, picking uniformly among the other 10 non-excluded ids. **Found and fixed a separate, genuinely pre-existing crash surfaced while wiring this**: `APPEARANCE_TABLES.scroll`'s `kinds` list never included `scrollTransmutation` at all, even though `sourceInventoryItem`'s own generic `ScrollOf* -> 'scroll'+Name` rename already produces exactly that id for any floor-generated `ScrollOfTransmutation` (Library rewards, plain floor loot) - so an unidentified one reaching `itemDisplayName` would throw inside `mwg`'s `Appearances.appearanceOf` (`"scrollTransmutation" is not in appearance category "scroll"`), a real, live crash risk with no prior report, not something this loot work introduced. Fixed by adding it as the table's 13th kind, with `labels` duplicating its first rune name onto this port's own synthetic pre-resolution `'scroll'` placeholder (a kind with no real Java counterpart at all) rather than inventing a fake 13th SPD rune name. **`snake`/`gnoll`/`crab` are now ported too, closing three more totally-missing base-drop gaps found in a full sweep of every real spawnable kind's `loot` field**: `Snake.loot = Generator.Category.SEED` (`0.25`, this port's real `'seed'` ground-item kind), `Gnoll.loot = Gold.class` (`0.5`), `Crab.loot = MysteryMeat.class` (`0.167`, `1/6`) - none had any `MOB_LOOT` entry at all before. `Rat` and `Goo` were also checked and confirmed to have no `loot` field in Java at all, so correctly still have no entry. **Found, not fixed, correctly scoped as bigger**: real Java's `Elemental` is abstract with 4 concrete subtypes picked via `Elemental.random()` for a normal spawn (`FireElemental`: `PotionOfLiquidFlame`, `1/8`; `FrostElemental`: `PotionOfFrost`, `1/8`; `ShockElemental`: `ScrollOfRecharging`, `1/4`; `ChaosElemental`: `ScrollOfTransmutation`, guaranteed `1`) - this port's single generic `'elemental'` id (no subtype AI/sprite distinction at all, a pre-existing, larger simplification) has no `MOB_LOOT` entry for any of them. Not attempted this pass: `PotionOfFrost` has no dedicated ground-item id or appearance-table entry of its own yet (it already falls through to Purity's effect on quaff, a documented gap elsewhere), so a naive drop would either need a fake virtual subtype roll at kill time (a real design choice, not a quick fix) or risk repeating the exact `appearanceOf`-throws-on-an-unmapped-kind bug `scrollTransmutation` just had, if implemented carelessly. |
| `Challenges.java` selection plus `AscensionChallenge.statModifier` per-mob table | `src/challenges.ts`, title Settings > Challenges, `ASCENSION_MOD` | Challenge ids/names/descriptions are selectable and persisted between runs. **Audited every challenge for whether its toggle actually does anything, having just found `champion_enemies` didn't**: `stronger_bosses` is real and **boss-only** - 18 call sites covering boss HP (Goo 100->120, Tengu 200->250, DM300 300->400, King 300->450, Pylon 50->80), DM300's cooldown and gas multiplier, King's phase-2 thresholds, Goo's heal increment, Tengu's ability deck, and `CavesBossLevel`'s trap chance plus final-pylon count. **This row used to claim the challenge "activates the Java multiplier table (already live)" - that was a bug written down as a feature.** The two are unrelated Java mechanisms, and the wiring pointed the *AscensionChallenge* per-mob table at this challenge, so selecting Stronger Bosses multiplied every ordinary mob's accuracy **and** damage by up to x10 (a rat). Found and fixed 2026-09-12; see the `AscensionChallenge` row below. `champion_enemies` now gates the champion roll (fixed this pass, see the `ChampionEnemy` row); `darkness` is now ported too - real `Level.viewDistance` drops from `8` to `2`, and since this port already uses one shared `VIEW_RADIUS` constant for both the hero's own FOV and every monster's `seesHero`/AI sight radius (the same shape real Java's own light-casting array backs both alike with), a single new `viewRadius()` helper reading `isChallengeEnabled('darkness')` covers every call site at once. `no_armor` is now ported too: real `Armor.DRMin()`/`DRMax()` drop to a flat `0` and `1+tier+lvl(+augment, not modeled here)` respectively under the challenge, instead of the normal `lvl`/`tier*(2+lvl)` scaling - `syncHeroFromStats`'s existing `hero.armor = [min, max]` assignment now branches on `isChallengeEnabled('no_armor')`; the Barkskin-talent addend stays unconditional on both branches, since it's this port's own additive layer on top of either formula, not part of Java's `DRMin`/`DRMax` bodies. `no_healing` is now ported too: fetched `PotionOfHealing.java` to confirm real `heal()`'s challenge branch grants no `Healing` buff at all - instead `pharmacophobiaProc()` sets a fresh `Poison` at the hero's own `4 + lvl/2` level. This port's `poison` buff has no separate stack-level dimension (a pre-existing simplification - every source just sets the shared flat duration, dealing a fixed 1-2 dmg/turn regardless), so `4 + floor(lvl/2)` is applied as that duration instead, the closest faithful substitute within the existing model. `cure()`'s own poison/burning/weakness/vulnerable/cripple clear still runs first either way, matching Java's `apply()` calling both unconditionally; the `restored_willpower`/`restored_agility`/`restored_nature` talent triggers correctly do not fire under the challenge, since real Java gates them on the `Healing` buff itself existing. New `port.log.pharmacophobia` EN/FR keys (no real Java message string was available in this checkout to reuse, unlike most other new lines here). `no_herbalism` is now ported too: real `Plant.Seed.onThrow()` falls through to a plain thrown-item drop under the challenge instead of ever planting - this port has no throw-to-cell targeting at all, so `plantSeed()` simply refuses the action without consuming the seed, the closest faithful equivalent. **Found and fixed three unrelated hardcoded-English strings in the same function while adding this gate** - `plantSeed()`'s three existing log lines (`This cell cannot grow a plant.` / `The seed has no known plant effect.` / the plant-success line) had never gone through `t()` at all, a real, pre-existing i18n gap this project's own audit convention exists to catch; all three plus the new `no_herbalism` line are now real `port.log.*` keys with EN+FR entries, reconfirmed by rerunning the full `port.*` literal-key audit (0 missing in either locale, 224 keys now in use). `swarm_intelligence` is now ported too: fetched `Mob.java`'s `Sleeping`/`Wandering` AI states to confirm the real hook - the instant any enemy mob notices the hero, it beckons every other non-paralyzed, not-yet-`HUNTING` enemy mob within 8 tiles of *itself* toward the hero too, rather than each mob only ever noticing independently. Wired into the existing wake check (right where `monster.sleeping` flips `false`); this port has no `HUNTING`/`WANDERING` state machine, so "not yet `HUNTING`" is approximated as "not already awake-and-`seesHero`," and the beckon itself reuses the exact `sleeping=false`/`seesHero=true` stand-in `ScrollOfRage`'s own beckon already established. **`no_food` is now ported**: real `Food.satisfy()` subtracts `HUNGRY` energy (300 for ordinary food, 150 for MysteryMeat), dividing that energy by three under `NO_FOOD`; `eatFood()` reproduces this in the MWG hunger model, while preserving the port's existing flat meat-heal simplification. **`no_scrolls` is now ported**: Java's `Dungeon.souNeeded()`/`Level.create()` allocation is reproduced as three guaranteed Upgrade Scrolls per five-floor chapter, with every second allocation suppressed while its run counter still advances. The port's generic floor allocator had no pre-existing guaranteed-scroll queue, so this is integrated as an equivalent post-generated-item placement with the same chapter budget and random floor selection. |
| `AscensionChallenge.statModifier` per-class table (`Rat` 10 down to `Scorpio` 1.1) | `ASCENSION_MOD` in `src/simulation/combat.ts`, `ascensionOn()` gate | **Not ported - inert data, and the gate was wrong until 2026-09-12.** Java applies this table only while the hero holds the `AscensionChallenge` buff, i.e. during the post-victory ascent (`AscensionChallenge.java`: `if (Dungeon.hero == null || Dungeon.hero.buff(AscensionChallenge.class) == null) return 1;`), and this port does not model the ascent, so nothing sets the flag and the multiplier is always 1 in-game. It used to be gated on the *Stronger Bosses* challenge instead, which made every ordinary mob up to x10 stronger - see the challenges row above. The table itself was also unreliable: `skeleton`/`thief` were 6 instead of 5, `dm100` 5 instead of 4.5, and fourteen mobs Java names (`bat`, `brute`, `shaman`, `spinner`, `dm200`, `ghoul`, `elemental`, `warlock`, `monk`, `golem`, `ripperDemon`, `succubus`, `eye`, `scorpio`) were missing. Now Java's 25 classes flattened onto this port's 40 ids, since Java resolves by `isAssignableFrom` (a subclass inherits its parent) while this port models subclasses partly as MWL `BASE_KIND_ALIASES` variants and partly as first-class `MonsterId`s; a `verifyCombat` check pins the flattened table and asserts each alias-table variant matches its base kind's value. Unported remainder: the `statModifier(enemy)` factor Java applies to the defender's `drRoll()`, and the `Ratmogrify.TransmogRat`/`AscensionBuffBlocker` exemptions.
| Four concrete Elemental kits (`FireElemental`, `FrostElemental`, `ShockElemental`, `ChaosElemental`) | `Creature.elementalType`, `randomElementalType`, `elementalRangedTurn`, `mobOnHit`, `kill()` elemental loot branch, potion appearance table | Simplified but ported at the kit boundary: subtype selection now matches Java (Chaos 1/50, otherwise Fire/Frost/ Shock at 40/40/20%), melee/ranged fire and frost effects are active, and Fire/Frost/Shock/Chaos produce their Java loot outcomes (1/8, 1/8, 1/4, guaranteed). Shock Blindness uses Daze and Chaos's cursed-wand delegation uses an existing harmful status because those subsystems are absent; subtype-specific sprites and chained lightning geometry remain. |
| `INFINITE_ACCURACY`/`INFINITE_EVASION` short-circuits (surprise attacks, untargetable defenders) | `INFINITE_ACCURACY`/`INFINITE_EVASION`, sleeping-target surprise, NPC unkillability | Ported |
| `Char.java`'s `paralysed`/`rooted`/`flying`/`invisible` fields (gate movement in `Hero.actMove`/`Char.move`, trap/chasm/water interaction, and `Char.canInteract`'s stealth check) | `Creature.buffs`, `onAction`/`moveTo`/`triggerTrapAt`/`fallThroughChasm`, `rollHit`, `statusPane.ts` | Ported in the model used by this game: paralysis consumes the creature's turn; roots block movement but not attacks; levitation bypasses the port's pressure/ground traps and (as of the chasm-falling row below) chasms too; and invisibility is timed, displayed, makes distant monsters lose target, gives surprise, and dispels on attack. Buff durations also persist through save/load. There is still no water-hazard terrain in this port's model, so Levitation has no such interaction to apply there - the earlier note that chasm cells didn't exist either was stale; `isChasmCell`/`fallThroughChasm` already model chasm terrain and predate this correction. |
| `Chasm.java`'s `heroLand()` (fall-damage consequences, once a floor/chasm cell exists to fall through) | `fallThroughChasm`/`landFromChasm` | Ported: `Cripple`, the real `Bleeding` intensity formula, and the real `max(HP/2, NormalIntRange(HP/2, HT/4))` upfront damage, run through the same hero-damage absorption pipeline (Tenacity/Barrier/Iron Will/Deathless Fury) every other source uses; a chasm death correctly triggers `kill()`. Not ported: Bleeding's source-class death badge distinction and blood-splash presentation, `ElixirOfFeatherFall`'s fall-negation (that item isn't ported), the landing sound, and camera shake (no camera-shake system exists). `Chasm.heroJump()`'s confirmation dialog is UI-only and isn't needed given this port has no equivalent modal-confirmation system for movement. |
| `Bleeding` buff and `Sacrificial.proc()` / chasm source applications | `simulation/buffs.ts`, `setBleeding`, `landFromChasm`, `attack` | Ported for the active Chasm and Sacrificial sources: intensity keeps the strongest application, ticks with Java's `NormalFloat(level/2, level)` then `round`, and healing cures it. Remaining Bleeding sources (Sickle harvest, monster/trap effects) and source-specific death badges/blood visuals are not yet ported. |
| `Char.canEnterCell()` monster treatment of `Terrain.CHASM` | `populate`, `spawnPortedMobs`, `standableCellIn` | Ported: monsters and NPCs are now rejected from raw chasm cells even though the coarse MWG terrain map exposes those cells as passable for the hero's falling interaction. This closes a live generation bug where a ported-floor monster could render over unsupported black/chasm terrain. |
| Chasm exclusion for summoned/created actors | `spawnMirrorImage`, `maybeSummonEarthGuardian`, `summonSkeleton`, `summonKingAdd`, `summonYogFist`, `Multiplicity`, `Swarm`, ritual elemental | Ported: every runtime actor-placement path now applies the same raw-chasm rejection, so abilities and summons cannot recreate the unsupported placement after initial generation. |
| Ally perception and ally-vs-monster turns | `visibleAllyHostiles`, `takeAllyTurn`, `takeMonsterTurn`, `takeEarthGuardianTurn`, `takeWardTurn`, `fadeMirrorOnDamage` | Simplified: allied actors now compute visibility from their own position before selecting hostile targets, hostile mobs pursue visible non-sheep allies when they cannot see the hero, and Mirror Images fade on their first positive damage event through melee, wand, gas, and falling-rock paths. Full ally orders, dedicated ally sprite classes, and boss-specific ranged target migration remain open; specialized ranged attacks still target only the hero. |

## Hero (`actors/hero/Hero.java`, `HeroClass.java`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Hero`'s base `HP = HT = 20`, `attackSkill = 10`, `defenseSkill = 5` | `makeHero` | Ported |
| `HeroClass.initHero`: `ClothArmor` (equipped, identified), `Food`, `VelvetPouch`, `Waterskin`, `ScrollOfIdentify` knowledge | `makeHero`'s base kit | Ported (`VelvetPouch` is a carried item with no container UI - it has no effect to wire) |
| `initWarrior`/`initMage`/`initRogue`/`initHuntress`/`initDuelist`: starting weapon + extras | `makeHero` per-class branches | Ported - stones/knives/spikes ammo, staff + `Charges`, cloak (+3 evasion stand-in for its charge stealth), bow in the bag, rapier; knowledge items grant one real consumable each |
| `initCleric` (read at tag `v3.3.8`: `Cudgel`, `HolyTome`, `PotionOfPurity`, `ScrollOfRemoveCurse`) | `makeHero` cleric branch, `useSpecial`'s tome heal | Ported (weapon + tome-as-slow-charges + both consumables); the SP economy the real tome draws on is Simplified to charges |
| `HeroClass.isUnlocked()`: Warrior always true, everything else needs a `Badges.Badge.UNLOCK_*` | `CLASSES[id].unlocked`, `classUnlocked`, persisted meta badges | Ported - the initial state matches Java, and earned unlock badges persist across runs. The Cleric has no counterpart in this checkout, so the port unlocks it on first victory. |
| `STR`: `STARTING_STR = 10`, no per-level gain, +1 per Potion of Strength | `heroStr`, `quaffPotion`'s strength branch, `syncHeroFromStats` | Ported |
| Talent trees (full per-class choice UI), subclasses (`HeroSubClass`), armor abilities | `src/talents.ts`, `refreshTalentPanel`, `SkillPoints`, `Advancement`, subclass combat branches, armor capstones | Ported for the selectable tree - Java Tier 1/2 nodes and translated descriptions are shown per class, Tier 3 subclass nodes unlock at level 13, rank limits and selections persist in saves. Live proc families now include barrier/shield absorption, healing triggers, food bonuses, stealth shielding, combo/execute, point-blank ranged damage, charge refunds, lethal-momentum/free-turn effects, follow-up strikes, heightened senses, durable projectiles, nature's aid/bounty, rejuvenating steps, weapon recharging and Iron Will mitigation. Exact Java formulas for the remaining rare ability talents remain roadmap work |
| Levelling itself (`exp`/`lvl`, `HT` growth, `attackSkill++`/`defenseSkill++`) | see "Levelling and skill points" below | Ported/Simplified - see that section |

## Weapons (`items/weapon/**`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `MeleeWeapon`/`Weapon` base `min()`/`max()` formulas, per-weapon overrides at `lvl = 0` | `CLASSES[id].damage` | Ported |
| `MeleeWeapon`/`Armor` tier and upgrade terms (`min = tier+lvl`, `max = 5(tier+1)+lvl(tier+1)`; armor `min = lvl`, `max = tier(2+lvl)`) | `syncHeroFromStats`, `generatedInventoryItem`, `equipWeapon`/`equipArmor`, `weaponTier`/`armorTier` | Simplified but improved: generated weapon sub-tier cats and concrete armor classes persist their real fixed 1-5 tier in inventory and restore it when equipped; old saves default to tier 1. Scroll upgrades now preserve that tier and add Java's plain +1 level; because this port has no item-picker modal, the action auto-targets the lower-level equipped weapon or armor, and ammo users let missiles catch up after both equipped items reach that level. Blacksmith transfer and curse infusion remain open roadmap work. |
| `Gloves.DLY = 0.5` (2x attack speed) | `CLASSES.huntress.speed = 2` | Ported |
| `Cudgel.ACC = 1.40f` | `CLASSES.cleric.accuracy = 14` | Ported |
| **All weapon/armor/wand definitions (35 weapons × 5 tiers, 5 armor types, 10 wands × 5 tiers, 12 rings)** | `src/items.ts` WEAPONS/ARMOR/WANDS/RINGS and lookup functions; `src/mwlContent.ts` | **Ported** - the MWL catalogue now declares all 12 ring ids, slots, weights and high-level effect metadata; SPD-specific formulas and runtime hooks remain in `ringModifiers.ts`/`main.ts`. The other item families remain the existing typed database. |
| Ring effects (`items/rings/RingOf*.java`, 12 real types) | `main.ts`'s `RING_DEFS`, `ringDef`, `equipRing`, `ringTenacityMultiplier`/`absorbHeroDamage`, `ringHtBonus`, `ringElementsMultiplier` (`spendHeroTurn` DoT / `spreadPlantBlobs` toxic gas / `triggerTrapAt` burning), `ringFurorMultiplier`/`getAttackTurnCostMod` (bump-attack-only cost via the `move` port pre-check), `NON_STATBLOCK_RING_STATS` | **Both gaps found in the previous audit pass are now closed, and a real crash bug found while closing them is fixed too.** Only 4 of 12 ring types exist at all (Accuracy/Evasion/Might/Tenacity - Arcana/Elements/Energy/Force/Furor/Haste/Sharpshooting/Wealth are **not ported**), but all 4 now reproduce their exact real Java formula: **Accuracy** (`accuracyMultiplier()` x1.30^lvl) and **Evasion** (`evasionMultiplier()` x1.125^lvl), unchanged, via `scaledModifiers`. **Might**: `strengthBonus()` (flat +lvl STR) and now also `HTMultiplier()` (x1.035^lvl max HP, previously not ported) - the HT bonus is tracked as `ringHtBonus`, an absolute HP delta recomputed only in `equipRing` (the sole ring-mutation choke point) using the same old-max/hp-delta-preserving pattern `levelUp`'s +5/level bump already used, backing out the ring's own prior contribution first so repeated ring swaps don't compound. **Tenacity**: `damageMultiplier()` = x0.85^(lvl × currentMissingHpFraction), previously a flat +2 armor/lvl stand-in with a different shape entirely, is now the real curve, applied to incoming hero damage in a new `ringTenacityMultiplier()` called from `absorbHeroDamage` before Barrier absorption (matching `Hero.damage()`'s real ordering: the multiplier applies to the raw hit before `Char.damage()`'s Barrier logic runs). **Bug found and fixed in the same pass**: `RING_DEFS` is keyed bare (`"might"`) but every stored ring id carries the UI's `"ring_"` prefix (`"ring_might"`) - indexing `RING_DEFS[equippedRing.id]` directly (both read sites) was silently looking up `undefined` and would throw a `TypeError` reading `.stat` the moment any ring was actually equipped, a live crash that predates this pass and was never previously exercised/caught. Fixed via a new `ringDef()` helper that strips the prefix before lookup; both call sites and the new HT/Tenacity code route through it. **Browser-verified live** via `window.__MWG__.currentScene`: equipping a level-5 Might ring took `maxHp` 20→24 and `str` 10→15 (`round(20×(1.035^5−1))=4`, `+5` STR, exact); equipping a level-5 Tenacity ring at 50%-missing HP made `ringTenacityMultiplier()` return `0.6661...` (`0.85^(5×0.5)`, exact) and `absorbHeroDamage(20)` return `14` (`ceil(20×0.6661)`, exact); re-equipping a level-3 Accuracy ring afterward still gave exactly `1.3^3 = 2.197×` accuracy, confirming the refactor didn't regress the two rings that were already correct. `npx tsc --noEmit`, `npm run build`, and both test suites (`test:simulation` 36/36, `test:items` 1/1) all clean. **Two more ring types now ported, fetching `RingOfHaste.java`/`RingOfEnergy.java` from the local shattered-pixel-dungeon checkout (tag `4.0.0-beta`) to confirm the exact formulas** (6 of 12 now real; Arcana/Elements/Force/Furor/Sharpshooting/Wealth remain **not ported**, each needing a system this port doesn't have - wand-damage scaling, elemental status resistance, melee damage bonus, attack-speed distinct from movement speed, ranged-specific accuracy/damage, and loot-drop-rate modification respectively). **Haste**: `speedMultiplier()` = `1.175^level`, applied as a divisor on `getActionTurnCostMod()`'s existing multiplicative turn-cost chain (the same mechanism Swiftness/Weapon.Augment SPEED/Bulk already use) - Java expresses this as `Char.speed()` scaling up, this port's fractional-turn-cost model expresses the identical relationship as action cost scaling down. **Energy**: `wandChargeMultiplier()` = `1.175^level` (the Light Reading talent's further multiplier on top is not modeled, since that talent itself isn't ported), applied directly to `recoverWandCharge`'s existing per-turn recharge-rate calculation. Both skip the generic `heroStats`-modifier loop the same way Tenacity does (via new `stat !== 'speed' && stat !== 'energy'` guards) since neither is a `StatBlock` entry, and both read through dedicated `ringHasteMultiplier()`/`ringEnergyMultiplier()` helpers mirroring `ringTenacityMultiplier()`'s existing shape. `RING_KEYS`/`RING_DEFS`/the appearance-shuffle's implicit ring pool (`Random.element(Object.keys(RING_DEFS))`, used for the Imp quest reward and one other spawn site) pick these two up automatically - the `PotionOf`/`ScrollOf`-style manual id-rename bug that hit potions/scrolls doesn't apply here, since `generatedInventoryItem`'s ring-id transform (`RingOfHaste` -> `haste`) already matches `RING_DEFS`'s bare keys with no special-casing needed. Browser-verified live: equipping a level-3 Haste ring made `getActionTurnCostMod()` return exactly `1/1.175^3 = 0.61643...`; equipping a level-4 Energy ring made `ringEnergyMultiplier()` return exactly `1.175^4 = 1.90613...`; both rings' French names/levels rendered correctly on equip ("bague de célérité +3 (+3)", "bague d'énergie +4 (+4)"). **A third ring type, Wealth, is now ported too, found stale in the same "re-check other blocked claims" pass that fixed Weapon Augment/`firstSummon`/`PotionOfHaste`** (7 of 12 now real): fetched `RingOfWealth.java` to confirm the exact shape - it's actually two independent mechanics, not one. `dropChanceMultiplier()` = `1.20^level`, a flat multiplier Java applies wherever a mob's own `lootChance()` gets rolled, needed no new system at all and is now wired into the `MOB_LOOT` roll in `kill()` via a new `ringWealthMultiplier()` (same shape as `ringHasteMultiplier`/`ringEnergyMultiplier`). The *separate* `tryForBonusDrop()` mechanic (an independent escalating-toward-guaranteed-rare-loot bonus roll, tracked by its own `TriesToDropTracker`/`dropsToRare` counters, generating an *additional* item via `Generator` on top of whatever the mob's own table already dropped) is a real, distinct subsystem this port doesn't have and is **not ported** - a narrower, honestly-flagged remaining gap, not glossed over as done. Browser-verified live: sampling 3000 fresh-bat kills with no ring equipped versus 3000 more with a level-3 Wealth ring equipped gave a drop-count ratio of `1.782` against real Java's exact `1.20^3 = 1.728` predicted ratio, within sampling noise. **Arcana is now ported too - a follow-up correction to this row's own previous entry, which overstated the scope after only checking `RingOfArcana.java` itself and guessing every enchant/curse proc would need touching.** Actually reading each of `Blazing`/`Chilling`/`Shocking`/`Vampiric`/`Grim`/`Lucky`/`Blocking`/`Polarized`/`Sacrificial`/`Displacing`/`Annoying`/`Dazzling`/`Explosive`/`Wayward`'s real Java `proc()` source showed `procChanceMultiplier()` is called *only* by the seven good-enchant classes, never by any curse - a deliberate Java design split (Arcana rewards keeping good enchants, never boosts a curse you're stuck with), not an oversight to retrofit everywhere. Of those seven, this port only rolls a real probabilistic chance for three - **Grim** (`0.15 * ringArcanaMultiplier()`), **Lucky** (`0.1 * ringArcanaMultiplier()`), and **Blocking** (folded into its existing exact `(lvl+4)/(lvl+40)` formula, which also correctly cascades into `powerMulti = max(1, procChance)`'s shield-amount calculation, matching Java's own order of operations) - since Blazing/Chilling/Shocking/Vampiric are unconditional in this port already (a separate, pre-existing simplification with no roll left for Arcana to scale). A new `ringArcanaMultiplier()` (`1.175^level`, mirroring `ringHasteMultiplier`/`ringEnergyMultiplier`'s shape) feeds all three. Browser-verified live: with no ring equipped, `ringArcanaMultiplier()` reads `1`; with a level-3 Arcana ring, it reads exactly `1.175^3 = 1.62223...`; a 4000-kill sampling comparison of Grim's proc rate with and without the ring gave a `1.737` ratio against the same `1.622` prediction, within sampling noise. **Force is now ported too**: fetched `RingOfForce.java`/`Hero.java` to confirm - `armedDamageBonus()` is a flat `+level` Java adds to `Hero.damageRoll()` whenever the wielded weapon isn't a `MissileWeapon` (its `fightingUnarmed`/`unarmedGetsWeaponAugment` branches, for a monk-style barehanded fighting mode this port has no equivalent of, are not modeled - moot anyway since this port always has *some* weapon equipped). A new `ringForceBonus()` is added at the hero's own melee-attack site, gated by the exact same `attacker === this.hero` reference check every other hero-only attack bonus here already uses (`kinetic`, `physicalBonusAttacks`, etc.) - true only at the real bump-attack call site (`this.attack(this.hero, occupant)`), never inside `useSpecial`'s throw/shoot/zap branches (which pass a shallow *copy* of the hero, not the hero itself) - so it excludes ranged/thrown attacks for free, with no extra weapon-kind check needed, matching Java's `MissileWeapon` exclusion exactly. Browser-verified live: with a level-4 Force ring equipped and the hero's own weapon damage roll zeroed out to isolate the ring's contribution, 50 real melee attacks averaged exactly `+4` damage each, while 50 attacks through the `useSpecial`-shaped copy-attacker path averaged `0` - confirming the exclusion holds. **Sharpshooting is now ported too**, the ranged mirror of Force's shape: fetched `RingOfSharpshooting.java`/`MissileWeapon.java`/`SpiritBow.java` to confirm two effects. `levelDamageBonus()` (flat `+level`) is added to `MissileWeapon.min()`/`max()` identically on both bounds (thrown stones/knives/spikes) but asymmetrically on `SpiritBow.min()`/`max()` - `+level` low, `+2*level` high - both now reproduced exactly via a new `ringSharpshootingBonus()`, added to `special.damage`'s two bounds at the `'throw'` and SpiritBow (`else`/`'shoot'`) branches in `useSpecial()` respectively, before their existing roll. `durabilityMultiplier()` (`1.2^level`) scales Java's `usages` directly; this port's equivalent `uses` (the divisor behind `ammoDurability`'s per-throw percentage decrement) now gets a matching `* ringSharpshootingDurabilityMultiplier()`. Browser-verified live: with a level-5 ring equipped, `ringSharpshootingBonus()` read `5` and `ringSharpshootingDurabilityMultiplier()` read exactly `1.2^5 = 2.48832`; a real thrown attack's `ammoDurability` dropped by exactly `100/round(5*2.48832) = 8.333`, matching the scaled `uses` divisor precisely; a 200-throw sampling comparison with and without the ring showed average damage rise from `3.54` to `8.495` (a `4.955` difference against the exact `+5` expected, within sampling noise). **Elements and Furor are now both ported, closing the last two ring gaps (all 12 real types live)** - fetched RingOfElements.java/RingOfFuror.java/Hero.java/Char.java (tag v3.3.8) to confirm the exact formulas, which overturned this row's own earlier scoping (written before the Java was actually read). **Elements**: resist() = pow(0.825, level) for sources in RESISTS (Burning/Chill/Frost/Ooze/Paralysis/Poison/Corrosion/ToxicGas/Electricity + AntiMagic.RESISTS). Real Java applies this in Char.resist()'s single choke point (damage *= resist(srcClass) - damage only, never buff duration); this port has no such shared dispatch, so the same factor is applied at each hero-side elemental-damage call site instead, via a new ringElementsMultiplier(): the burning/poison DoT tick in spendHeroTurn's applyBuffDamage hook, the toxic-gas blob's direct damage in spreadPlantBlobs, and the burning trap's fire damage in triggerTrapAt - all scaled before Barrier absorption, matching Hero.damage()'s ordering. Status durations are not scaled - Java does not scale those through this path either. **Furor**: attackSpeedMultiplier() = pow(1.09051, level), scaling only Hero.attackDelay() (a cost function entirely separate from Char.speed()). This port previously had only the single blanket getActionTurnCostMod(), so the split was built first: a new getAttackTurnCostMod() (blanket divided by ringFurorMultiplier()), and the move action port pre-checks whether the step leads into a hostile creature (the same creatureAt/NPC-exclusion test takeHeroTurn's own occupantAt query uses, which also correctly takes precedence over roots) - bump-attacks spend the attack rate and report the turn spent so the adapter does not also spend the blanket cost, while movement/door/NPC steps keep the blanket path, matching Java's split where Furor never speeds non-attacks. Both new defs ride RING_DEFS as marker-only entries (via a new NON_STATBLOCK_RING_STATS set, which also replaces the old 8-clause OR-chain in syncHeroFromStats per the ROADMAP section-11 KISS note), so ring generation (Random.element(Object.keys(RING_DEFS))) picks them up with no spawn-site changes. Type-check clean (npx tsc --noEmit); browser verification still owed per ROADMAP section 10 (no browser available this session). **Superseded scoping note, kept for history rather than deleted**: the paragraph below had checked the Java and concluded Elements needed a double-digit-site retrofit and Furor needed an attack-cost split - both turned out to be implementable in this same shape (3 elemental-damage sites; one attack-cost branch), not left as gaps. **Elements checked and confirmed a genuinely broad retrofit, not a quick win like Force/Sharpshooting/Arcana turned out to be** - fetched `RingOfElements.java`/`Char.java` to check before assuming either way. Real Java's `resist(Class effect)` is a single generic dispatch `Char.resist()` (0.5x per matching creature/property/buff-level resistance, then `* RingOfElements.resist()` on top) that EVERY status-effect application in the whole codebase is expected to call before applying its damage/duration - burning, chill/frost, poison, paralysis, corrosion, the ToxicGas/Electricity blobs, and `AntiMagic.RESISTS`'s list all route through it. This port has no equivalent generic resistance dispatch at all; every status buff this port already has (`poison`/`paralysis`/`burning`/etc.) is granted via its own scattered `addBuff(hero, id)` call site (gas blobs, potions, traps, plants, monster procs - a genuine double-digit count of sites, confirmed by grep), each of which would need its own multiply-by-`ringElementsMultiplier()` retrofit to get this right, not the 1-3 sites Force/Sharpshooting/Arcana each turned out to need. Not attempted this pass - correctly scoped as a real, broader gap rather than assumed simple and rushed. **Furor is also not ported, but its blocker is now narrower and more precisely understood, not a blanket "no system"**: fetched `RingOfFuror.java`/`Hero.java` to confirm - real Java's `RingOfFuror.attackSpeedMultiplier()` (`1.09051^level`) only scales `Hero.attackDelay()`, a cost function entirely separate from `Char.speed()` (`Hero.java`'s own `spend(attackDelay())` at the melee-hit site, distinct from the generic per-action `spend()` everything else uses) - this port's `getActionTurnCostMod()` is a single blanket multiplier applied to every hero action alike (move, search, ranged, melee) with no attack-only cost path to hang a Furor-specific multiplier on. Implementing Furor for real needs that split first, not just a stale-claim fix like Haste/Wealth/Augment/`firstSummon` turned out to be. **2026-09-09 item-system audit, two real bugs found and fixed, unrelated to the ring formulas themselves**: (1) `equipRing`'s Might HT-bonus branch checked `id.startsWith('ring_might')` directly instead of `ringDef(id)?.stat === 'strength'` like every other ring-stat branch - not a live bug (no other id starts with "might"), but an inconsistent exception now matched to the established pattern. (2) The Recharging buff's wand-charge bonus (`recoverWandCharge`, unrelated to rings but audited alongside Energy) was a `1.25x` multiplier on the ring-scaled base rate instead of `Wand.java`'s real `Charger.recharge()` shape - a flat `+CHARGE_BUFF_BONUS(0.25) * remainder()` added on top, independent of the base rate. At typical missing-charge counts the flat bonus dwarfs the base rate (e.g. `+0.25`/turn vs a `~0.02-0.03`/turn base), so the old multiplier made Recharging far weaker than real Java - fixed to `baseRate + (buff active ? 0.25 : 0)`, `remainder()`'s "half benefit on the last partial turn" collapsed to the flat value since this port's buff countdown has no sub-turn fraction to read. Both browser-verified live via `window.__MWG__.currentScene`: `getActionTurnCostMod`/`getAttackTurnCostMod`'s ring math unaffected; `recoverWandCharge` now banks `~0.28`/turn (`0.02` base `+0.25`) with `recharging` active at 4 missing charges, versus the old formula's `~0.0375`. |
| **Shop pricing (`Shopkeeper.sellPrice`, `Item.value`)** | `src/shopPricing.ts` (`itemValue`/`getShopPrice`/`getSellPrice`/`buybackPrice`) | **Ported, replacing the old guessed table wholesale**: the old `~10%/depth x 1.5x/tier` curve and invented bases (potions 50, scrolls 30-50, rings 80) had no Java basis - now `sellPrice = value x 5 x (depth/5+1)` with the integer depth bracket (Java's own wealth modifier) and per-unit `value()` bodies verified class by class (potions/scrolls 30, upgrade/transmutation 50-known else 30, food 10, meat 5, bombs 15, runestones 15, seeds 10, sandbags 30, rings/wands 75 at shop-stand level/curse state). Selling to the keeper pays flat `value()` (the old 67%-of-shelf guess is gone). Ring/wand/armor/weapon full `value()` bodies (curse halving, level/tier scaling) are deliberately not reproduced - nothing prices them, since the sell side is food-only until a picker UI exists. |
| **Artifact definitions (all 10 unique items)** | `src/artifacts.ts` ARTIFACTS array | **Defined** - all 10 SPD artifacts listed with charge mechanics (CloakOfShadows, ArmbandsOfHerculaneum, CapstoneOfExecution, ChaliceOfBlood, TimekeeperHourglass, DemonSlayerArmor, PickaxeOfMining, Hourglass, MysteriousLocket, SandalsOfTime). Full effect implementation requires system support. |
| `MissileWeapon` base `min()`/`max()` | `CLASSES[id].special.damage` (warrior/rogue/duelist) | Ported |
| `MissileWeapon` durability (`MAX_DURABILITY`, `durabilityPerUse`, PinCushion sticking), per-type damage/uses, missile upgrade levels | `useSpecial`'s throw branch, `attack()`'s hit boolean, `ammoDurability`/`missileLevel`, `stuckAmmo` scatter in `kill()`, the `scrollUpgrade` missile branch | Ported, checked against tag `v3.3.8` (`MissileWeapon.java`, `ThrowingStone/Knife/Spike.java`, `RingOfSharpshooting.java`). Damage is the real tier-1 formula (`min 2+lvl`, `max 5+lvl`, rogue knives `max 6+2lvl`) plus Sharpshooting, with a real `missileLevel` (uncapped, upgraded via SoU after armor, resetting durability) rather than fixed per-class ranges. Durability is exact: per-type baseUses (stones/knives 5, spikes 12 - the duelist flat 10 had no basis) x `1.5^level` x durable-talent (`1.25+0.25/point`, now applied only while the talent is taken - a 2026-09-11 pass fixed it applying `1.25` even at rank 0, silently giving every hero +25% durability) x sharpshooting, rounded plus the `+0.001` epsilon, returning 0 once rounded usages reach 100 so the stack effectively lasts forever (same pass - the old code still wore it down by `100/usages`), decreasing ONLY on hits (misses just drop - the old code wore missiles down on misses too) with the real `about_to_break`/`has_broken` lines. PinCushion sticks surviving knives/spikes in living targets (stones are `sticky=false` and drop, as in Java) and scatters them as heaps on the kill. **Found and fixed alongside: the upgrade-failure log keys interpolated `{level}` while callers pass `{tier}`, rendering a literal `{level}` in-game.** Remaining, each needing its own system: HeavyBoomerang-style return/merge durability (no per-missile identity exists), the upgraded-last-missile confirm dialog (no modal UI), the dust-pickup UpgradedSetTracker rule, and Sharpshooting's Aim-buff rework (stand-still charging - the flat +level damage bonus matches an older Java, flagged for its own pass). Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `WandOfMagicMissile.min()`/`max()` at `lvl = 0`, and `onZap`'s direct `ch.damage()` (no hit roll) | `CLASSES.mage.special`, `useSpecial`'s `'zap'` branch | Ported |
| `Wand` charges (`initialCharges`, `maxCharges = min(initial+level,10)`, staff +1) and `Charger` recharge | `wandCharges: Charges`, `spendHeroTurn`'s normalized recharge tick | Ported (counts and Java's `10 + 40*0.875^missing` delay, including Recharging's fractional bonus); old saves migrate their former turn-based progress |
| Wand class *names* (`items/wands/*.java`'s 13 classes) | `spdKeys.ts`'s new `WAND_KEYS`, `itemDisplayName`'s `wand` branch, `GROUND_ITEM_KEYS.wand` | **Ported, and this was a real display bug found in the 2026-09-11 wand pass.** An identified wand had no per-class name: `ITEM_KEYS.wand` is a single generic `port.name.wand` ("wand"/"baguette"), so all 13 classes - Magic Missile through Warding - displayed the same unidentified word, and `GROUND_ITEM_KEYS.wand` named every dropped wand "Wand of Magic Missile". `itemDisplayName` now reads `WAND_KEYS[wandType]` for an identified wand (unidentified keeps the generic word), and the ground kind is generic now that no call site has a class to read. `tools/i18nCheck.ts` validates all 13 against SPD's own `.properties` (the check went 287 -> 300 mapped keys), and the `items.mwl` wand catalogue nodes had three wrong keys for five tiers each (`wandoffirebolt` -> `wandoffireblast`, `wandofblast` -> `wandofblastwave`, `wandofprismatic` -> `wandofprismaticlight`) - dead data at runtime, since nothing reads those nodes, but wrong and now corrected. Verified live in the built game in French: `baguette de gel`, `baguette de souffle de feu`, `Baguette d'onde de choc`, ... (previously all "baguette"). |
| `SpiritBow.min()`/`max()` at `hero.lvl = 0`, and its distance multiplier `min(3, 1.2 * 1.125^(distance-1))` | `CLASSES.huntress.special`, `useSpecial`'s `'shoot'` branch | Ported (including the corrected `distance-1` exponent) |
| Weapon enchantment/armor glyph *types* (`items/weapon/enchantments/`'s 13 + `items/armor/glyphs/`'s 13, plus 8 weapon curses + 8 armor curses) | `main.ts`'s `ENCHANT_TABLE`/`GLYPH_TABLE`, `src/itemCurses.ts` | **Correction, found while adding more curse procs this pass: the proc logic below is real, but is currently unreachable in actual play - see the dedicated "enchant/glyph/curse assignment is unwired" row directly below for why, before trusting any "Ported" claim in this row against a live game session.** Nine of 13 enchants have real proc logic written (Blazing/Chilling/Shocking/Vampiric/Grim/Lucky/Blocking/Swiftness/Unstable - Unstable delegates per swing, see this row's correction note), seven of 13 glyphs do (Stone/Thorns/Flow/Entanglement/Swiftness/Potential, plus the three curses below) - each chosen because its real effect fits a system this port already has (a buff, a flat stat delta, a ground-item drop, the flat `heroShield`), with the curve simplified to a flat roll where Java scales by weapon/armor level (Grim's execute chance, Lucky's ring-of-wealth tier, Entanglement's root duration) - except Blocking, whose real `(lvl+4)/(lvl+40)` proc-chance and `round(max(1,procChance)*(2+lvl))` shield-amount formulas are both reproduced exactly; the shared `heroBarrier` pool it feeds into now decays every hero turn via `Barrier.act()`'s real proportional curve, and Blocking's own separate `BlockBuff` 5-turn cliff-edge expiry is now also approximated via a side counter (see the dedicated Barrier-decay row below for both). Swiftness glyph (0.8x turn cost when no enemies within 3 cells) applies its multiplicative turn-cost modifier, checking for nearby monsters using Chebyshev distance as a proxy for Java's pathfinding. **Correction: the old text here also described a 0.9x weapon "Swiftness enchant" - no such enchantment exists in real Java** (`Swiftness` is armor-glyph-only, checked tag `v3.3.8`); the phantom branch and table entry are removed, with pre-correction weapon ids dropped on load. Potential glyph procs on hit with chance (level+1)/(level+6) to recharge wands based on the armor level. Gear entries now have stable instance IDs in saves; equipping a second weapon, armor, or ring returns the previous instance to the bag. **Weapon.Augment** (SPEED/DAMAGE/NONE via `StoneOfAugmentation`) **is now genuinely ported, closing out a three-pass history worth reading in full before trusting a future "done" claim elsewhere in this file**: pass 1 wrongly called it blocked; pass 2 correctly un-blocked the turn-cost prerequisite but wrongly declared the whole feature "wired" without checking for an actual `weaponAugment =` assignment anywhere outside the save-restore line (there wasn't one - the formulas were real but completely unreachable); this pass built the missing half. `generatedInventoryItem`/`sourceInventoryItem` now special-case `StoneOfAugmentation` to its own `stoneOfAugmentation` id (previously it silently collapsed into the generic `'stone'` id shared by every other of the 12 real runestone types - `StoneOfEnchantment`/`Intuition`/`DetectMagic`/`Flock`/`Shock`/`Blink`/`DeepSleep`/`Clairvoyance`/`Aggression`/`Blast`/`Fear` all still did at the time, a real, wider "not ported" gap noted here but not closed then - see the follow-up passes below, which have since closed Fear/DeepSleep/Shock/Blast; this row's own list originally misnamed the 12th type "StoneOfDisarming", which does not exist in real SPD - the actual 12th type is `StoneOfDetectMagic`, corrected here). A new `useStoneOfAugmentation()` bag-use action consumes the stone and opens `augmentChoiceOpen`, a new flag threaded through the same handful of gate conditions the existing armor-ability/subclass level-up choice panel already uses (`talentOpen`'s toggle logic, the action-blocking gate, the panel-render branch), with its own full-width stacked-button layout (that panel's existing 2-column layout is too narrow for Augment's longer option text, which was already sitting in `portStrings.ts` unused before this pass). `chooseAugment()` sets `weaponAugment` and logs via the pre-existing `port.log.augmentchosen`/`port.ui.augment.*` keys (found missing from French entirely - fixed as a small aside, closing 5 of the 10 `i18nCheck.ts` failures this repo already tracks). Auto-targets the hero's own equipped weapon rather than presenting Java's real item-picker, the same auto-target convention `ScrollOfIdentify`/`ScrollOfRemoveCurse` already use for "act on one item" actions this port has no generic picker for. **Deliberately not reproduced**: real Java's stone also grants a genuine bonus weapon-upgrade level via `ScrollOfUpgrade.upgrade()` alongside the augment choice - this port's own upgrade path is tier-based (`upgradeGear`'s `weaponTier`/`weaponLevel` split) with no free-standing "+1 level" primitive to borrow without unexpectedly perturbing that tier state machine, so only the augment choice itself is reproduced. **Also fixed in passing**: `groundKindForItem` had no case for `'stone'`/`'stoneOfAugmentation'` bag ids at all, so a generated runestone dropped as ordinary floor loot fell through to the caller's fallback (`'food'` at the one real call site) instead of rendering/behaving as a stone - a real, pre-existing bug, not introduced by this change. Browser-verified live end-to-end (a fresh, unrelated `spawnMonster`/`enterLevel` `TypeError` reproduced twice from rapid synthetic pointer events, then NOT on a slower-paced retry, further supporting ROADMAP.md section 10's existing "load-order race, not a real code path" theory rather than anything to do with this change): using the stone opened a real French panel ("Choisir un augment d'arme" / "Vitesse (+20 % de vitesse d'attaque)" / "Dégâts (+20 % de dégâts)" / "Aucun"), choosing Speed set `weaponAugment` to `'speed'`, closed the panel, logged the correct interpolated message, and immediately changed `getActionTurnCostMod()` from `1` to the real `0.8`. **Curse proc logic:** 12 of 16 curses (8 weapon + 8 armor) now have real proc branches in `main.ts` - weapon: `wayward`, `annoying`, `dazzling`, `explosive`, and (added this pass) `polarized` (exact - a flat 1/2 roll between 1.5x damage and a whiffed 0, needing no new subsystem at all), `sacrificial` (reuses the shared poison DoT in place of a dedicated Bleeding buff, magnitude curve lost), and `displacing` (reuses the same free-cell teleport search as the `displacement` armor curse); armor: `fragile`, `metabolism`, `antientropy`, `corrosion`, `multiplicity`, `overgrowth`, `bulk`, `displacement`. **Not ported, and why** (4 remaining, not the "6" an earlier revision of this row claimed - annoying/dazzling/explosive were already live and are not in this list): `friendly` needs a two-way Charm subsystem (attacker charmed toward target, target ignoring its next hit) this port has none of; Corrupting needs enemy-conversion; Elastic/Projecting need line-AoE geometry; **Correction this pass, audited against `Unstable.java`/`Kinetic.java`/`Char.java`: Kinetic is now exact (kill-overkill store `round(overkill x arcana x berserk-catalyst)` replacing the old add-half-of-every-hit, real `2.5%/turn min 0.1` float decay replacing the flat `x0.75`, `ceil` read-back) and Unstable is now ported (uncommon table entry, per-swing `Random.element` over the real list minus Projecting per Java's own exclusion and minus Corrupting/Elastic which have no ported proc to delegate into, one shared pick across the pre- and post-damage proc halves, Kinetic's conserved read-back flowing through the delegation); Blooming/Camouflage left this list in earlier passes.** The 7 remaining glyphs (Affection/AntiMagic/Brimstone/Camouflage/Obfuscation/Repulsion/Viscosity) each need a charm/wand-drain/blink/durability subsystem this port lacks. **Two more runestones ported in a follow-up pass, the same rename-plus-use-action pattern `StoneOfAugmentation` established**: `StoneOfFear` -> `stoneOfFear` (a new `useStoneOfFear()`) and `StoneOfDeepSleep` -> `stoneOfDeepSleep` (`useStoneOfDeepSleep()`), each auto-targeting the nearest visible enemy the same way `useSpecial`'s ranged attacks already do, since this port has no map-click cell-targeting for a thrown item's real Java aim (and no ally-vs-monster combat to make `StoneOfFear`'s real ally-vs-enemy distinction observable anyway). `StoneOfFear` grants the `terror` buff `ScrollOfTerror` already applies and `takeMonsterTurn` already honors in full - a pure new-access-path, zero new mechanic. `StoneOfDeepSleep` reuses the exact instant-`sleeping = true` simplification `ScrollOfLullaby` already uses in place of real Java's gradual `MagicalSleep`/`Drowsy` debuff, just against one target instead of every visible mob - the same simplification, not a new one invented for this stone. Both wired through `generatedInventoryItem`/`sourceInventoryItem`/`groundKindForItem` alongside Augmentation's existing special-cases, and given the same generic stone icon frame the inventory panel already uses for Augmentation (no dedicated per-type art in this port, same economy as the single shared wand/cloak-artifact icons). Browser-verified live: adding a fresh `stoneOfFear` and using it against a test target set `buffs.terror = 20` and decremented the bag stack by exactly 1 in one atomic check (an earlier, sloppier cross-call check had appeared to show no decrement at all, which turned out to be read/write ordering noise from the live game loop between separate tool calls, not a real bug - a single atomic before/after check resolved it cleanly); `stoneOfDeepSleep` flipped `sleeping` from `false` to `true` the same way; the inventory panel's item-detail popup rendered "stoneOfFear" and the real Java `items.stones.inventorystone.ac_use` label correctly in Korean. **A third runestone, `StoneOfShock` -> `stoneOfShock` (`useStoneOfShock()`), ported in the same follow-up pass**: real Java paralyzes every char within a `PathFinder` distance-2 flood fill of the thrown-to cell (`Buff.prolong(n, Paralysis.class, 1f)`, a 1-turn paralysis) and refunds `curUser.belongings.charge(1 + hits)`. This port approximates the area as a plain Chebyshev-distance-2 circle around the same auto-targeted nearest-visible-enemy ground zero (ignoring walls, unlike Java's real flood fill) and applies this port's existing shared 3-turn `paralysis` buff rather than a bespoke 1-turn variant (`addBuff`/`BUFF_DURATION` has no per-call duration override) - both stated simplifications. The wand-charge refund itself is exact, reusing the already-generic `Actors.Charges.refund` (harmless no-op for non-wand classes, matching Java's own generic, mostly-inert `Belongings.charge()`). Browser-verified live: draining a hero's wand charges to 0 and using a fresh `stoneOfShock` against two adjacent test targets applied `paralysis: 3` to both and raised the wand's charge count back up (capped at its real max of 4, since `1 + hits` exceeded the remaining headroom); the log line rendered its interpolated hit count correctly ("Lightning arcs out, paralyzing 3 nearby foes."). **A fourth runestone, `StoneOfBlast` -> `stoneOfBlast` (`useStoneOfBlast()`), ported in a follow-up pass**: real Java's `activate()` is just `new Bomb.ConjuredBomb().explode(cell)` - a `PathFinder` distance-1 flood fill dealing `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` damage minus armor to every char caught, hero included (a bomb does not discriminate), plus destroying flammable terrain and triggering/destroying caught heaps. This port reuses `StoneOfShock`'s own Chebyshev-distance-circle approximation (radius 1 here, matching `Bomb`'s real `explosionRange()`), substitutes `this.depth` for `scalingDepth` (the same substitution every other depth-scaled formula in this file already makes), and routes the hero's own share of the blast through the existing `absorbHeroDamage`/`kill` path the same way `applyTrapBlast`'s hero branch already does for the unrelated `ExplosiveTrap` formula. **Not reproduced**: the terrain-destruction/heap-triggering half of the real explosion - no equivalent call from an item-use site exists in this port, a real, narrower gap left honest rather than faked. Browser-verified live: placing the hero adjacent to a 500-HP test target and using a fresh `stoneOfBlast` dealt 9 damage to the hero (from full HP) and 8 damage to the adjacent target, while a second target 6 cells away took none, confirming both the radius cutoff and the hero's own inclusion in the blast; the bag stack decremented by exactly 1. **Two more runestones, `StoneOfBlink` -> `stoneOfBlink` (`useStoneOfBlink()`) and `StoneOfClairvoyance` -> `stoneOfClairvoyance` (`useStoneOfClairvoyance()`), ported in a follow-up pass, bringing 7 of 12 runestone types real.** `StoneOfBlink`: real Java's `activate()` calls `ScrollOfTeleportation.teleportToLocation(curUser, cell)` on a player-aimed thrown-to cell - a short, precise, chosen hop, distinct from Teleportation's own full-level random jump. With no map-click cell-targeting (the same reason every combat stone above auto-targets instead of aiming), this port reuses the exact `randomFreeCell` placement its own `ScrollOfTeleportation` already uses rather than inventing a second "aim-like" strategy - the real distinction between Blink's short aimed hop and Teleportation's full random jump is lost, both collapsing to the same uniformly-random free cell. `StoneOfClairvoyance`: real Java marks every cell within a real `DIST = 20` `ShadowCaster`-diamond around the thrown-to cell `mapped`, plus reveals secret terrain caught in that area - a smaller, localized cousin of the already-ported `ScrollOfMagicMapping`'s whole-floor `revealAll()`. With no cell-targeting, this port centers on the hero's own position instead (the natural default absent aiming, unlike the combat stones' nearest-enemy convention), and reproduces the same DIST=20 as a plain Chebyshev circle (ignoring walls) by adding each cell directly to `FieldOfView.explored` (a public, mutable `Set`) rather than calling the whole-level `revealAll()`. Browser-verified live: using a fresh `stoneOfBlink` moved the hero from `(6,16)` to `(16,13)` in one action; using a fresh `stoneOfClairvoyance` grew `fov.explored.size` from 54 to 832 (the floor's full `cellCount` - this port's small Sewers-sized levels fit entirely within a 20-cell radius of the hero) and rendered the previously-fogged room fully visible on screen; both logged correct French text (Blink reusing the real Java teleport key, Clairvoyance a new port string), and the inventory popup showed "stoneOfBlink" with the correct "UTILISER" action label. The remaining 5 runestone types (Enchantment/Intuition/DetectMagic/Flock/Aggression) stay unported and still collapse to the generic `'stone'` id - Enchantment/Intuition/DetectMagic all need a real item-picker UI this port doesn't have (same blocker as `ScrollOfTransmutation`), Flock needs ally-spawning, Aggression's redirection buff is mostly moot without ally-vs-monster combat. **Correction this pass - the first three are now ported (10 of 12 real), first consumers of the new generic `openItemPicker`/`chooseItemPicker` panel**: `StoneOfEnchantment` imbues a picked bag `weaponReward`/`armorReward` with a random good affix (`ENCHANT_TABLE`/`GLYPH_TABLE` via the existing `rollGeneratedAffix`, overwriting like Java's own `enchant()`); `StoneOfIntuition` runs the real two-stage guess (unidentified potion/scroll/ring, then its still-unknown classes shown by true name, class-level identify of every same-id instance on a correct guess) with the real alternating free/paid `IntuitionUseTracker` rule (kept as a persisted run flag, since numeric buffs tick down); `StoneOfDetectMagic` marks a picked equipable/wand cursed-known and reports the real none/both/good/bad verdict from its curse/level/affix inputs. All three checked against tag `v3.3.8` (`StoneOf*.java`, `ScrollOfEnchantment.enchantable()`, `InventoryStone`). Stated simplifications: bag-only picker (equipped gear excluded, same as Transmutation); no exotic classes in the Intuition decks; single-id wand carries no level, so it reports curse state only; "unknown" means no identified bag instance (consumed knowns read unknown again - no run-level `Handler`); no select-then-confirm step (a guess row confirms); `Talent.onRunestoneUsed` has no expression; the dead `preserved`/`break` catalog keys stay unused (`break` is referenced nowhere in Java). Also fixed alongside: all 10 stone ids now resolve real catalog names in `ITEM_KEYS` (previously every stone rendered its raw id), and the generated catalog's missing `stoneofdetectmagic` keys (it even holds a phantom `stoneofdisarming` set instead) are covered by verbatim-Java `port.*` keys. Only Flock/Aggression remain, both needing ally combat. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. **2026-09-09 item-system audit, four real bugs found and fixed:** (1) **Weapon.Augment's own formulas were wrong**, not just its wiring (already fixed in the pass above) - fetched `Weapon.java`'s real `Augment` enum (tag `v3.3.8`): `SPEED(0.7f damageFactor, 2/3f delayFactor)`, `DAMAGE(1.5f damageFactor, 5/3f delayFactor)`, both trading damage against attack speed in *each* direction. This port previously modeled only DAMAGE's beneficial half at the wrong number (`1.2x`, not `1.5x`) and applied SPEED's delay (`0.8x`, not the real `2/3`) to the *blanket* `getActionTurnCostMod()` instead of the attack-only `getAttackTurnCostMod()` - meaning an equipped Speed-augmented weapon was silently speeding up hero movement/search/item-use too, which real Java's `attackDelay()`/`Char.speed()` split never does (the port's own doc comment on `getAttackTurnCostMod` already stated this exact split for Furor, making this an internal inconsistency, not just a Java mismatch). Fixed: `attack()` now applies `0.7x`/`1.5x` to damage for SPEED/DAMAGE respectively, and `getAttackTurnCostMod()` multiplies in the weapon's `2/3`/`5/3` delay factor - `getActionTurnCostMod()` no longer touches `weaponAugment` at all. Browser-verified live: `getActionTurnCostMod()` stays `1` regardless of augment; `getAttackTurnCostMod()` reads `0.6667`/`1.6667` for speed/damage. (2) **`useStoneOfBlast` mutated `this.creatures` while iterating it** (`for (const c of this.creatures)` calling `this.kill(c, ...)`, which splices the array mid-loop) - with 3+ creatures caught in one blast, a creature could silently dodge damage entirely as JS's default iterator skips whatever shifted into the just-visited index, the same failure class `detonateGroundBomb` already guards against with a `[...this.creatures]` snapshot; `useStoneOfBlast` now does the same. (3) **Kinetic/Unstable's conserved-damage read-back was wrongly gated**: `Unstable.proc()` (`Unstable.java`) reads back and clears any stored `Kinetic.ConservedDamage` unconditionally on *every* Unstable swing, before delegating to a random enchant - this port instead gated the read-back on `kineticTrackerHit` (true only when the delegate happened to redraw Kinetic, ~1/9 of swings), silently withholding the stored bonus the other ~8/9 of the time. Fixed by splitting the two concerns: `kineticTrackerHit` still arms this swing's kill-storage (unchanged, correct), but the read-back now fires whenever `weaponAffix` is `'kinetic'` or `'unstable'`, independent of this swing's delegate. Browser-verified live via `window.__MWG__.currentScene`: forcing an Unstable weapon with 10 stored damage read the bonus back on the very first synthetic swing even though `unstableDelegated !== 'kinetic'`. (4) **Blocking's proc used the raw stored weapon level instead of the Degrade-adjusted `buffedLvl()`** real `Blocking.java` reads for both its proc chance and shield magnitude (Blooming's `Blooming.java` has the identical `buffedLvl()` read and had the same gap) - a Degrade-hit weapon procced/shielded as if undegraded. Both now route through the existing `degradedLevel()` helper. Browser-verified live: with a `degrade` buff active and `weaponLevel = 10` (`degradedLevel(10) = 5`), a forced Blocking proc granted a shield of exactly `round(1 * (2+5)) = 7`, matching the degraded formula (the undegraded formula would have given `12`). All four fixes verified with a clean `tsc --noEmit`, `npm run build`, and both test suites green. |
| **Enchant/glyph/curse assignment - was completely unwired, now closed.** `Actors.rollAffix` was defined for but never called on `ENCHANT_TABLE`/`GLYPH_TABLE` - confirmed by a whole-repo search the same session this was found and fixed. `generatedInventoryItem` (the single choke point behind `generatorRandom()`'s ground-item spawns, the hero's Ghost-quest/Statue/crystal-room rewards, and `dropGeneratedStatueItem` - all three call sites route through it) now calls a new `rollGeneratedAffix(table, cursed, hasGoodEnchant)` helper: when `generated.cursed` it picks uniformly from the table's curse-only entries (mirroring Java's `enchant(Enchantment.randomCurse())` -> `Random.element(curses)`), when `generated.hasGoodEnchant` it weight-picks from the non-curse entries (mirroring `Enchantment.random()`'s `chances(typeChances)`), and sets neither otherwise - a fresh, gameplay-only `Random` roll, since `generator.ts`'s own RNG-faithful flags deliberately stop short of the concrete Generator-internal identity (same "burn the real call, substitute a fresh roll for the unreproducible content" convention already used throughout `spdLevelGen/`'s room-content rolls). `ENCHANT_TABLE` gained the 6 curse ids that already had real proc logic but no table entry (`annoying`/`dazzling`/`explosive`/`polarized`/`sacrificial`/`displacing`, alongside the existing `wayward`); `GLYPH_TABLE` gained all 7 remaining armor curses (`antientropy`/`bulk`/`corrosion`/`displacement`/`metabolism`/`multiplicity`/`overgrowth`, alongside the existing `fragile`) - every curse with real proc logic can now actually be assigned. `src/itemCurses.ts`'s `getCurse` now has a real call site too: `equipWeapon`/`equipArmor` gained Java's real cursed-and-known equip-lock (`EquipableItem.doUnequip()`) - a currently-equipped cursed weapon/armor can no longer be swapped away, matching the equivalent lock this port's rings already had (`equippedRing.cursed`) but weapons/armor never did; the cleanse-scroll handler was broadened from hardcoded `wayward`/`fragile` checks to `getCurse(...)`, so it now lifts *any* equipped curse, not just those two. Also fixed in passing: `port.log.weaponequipped`/`armorequipped`/`ringworn`/`ringalready`/`ringcursed` were all called via `t()` with no matching entry in `portStrings.ts` (EN or FR) - a separate, pre-existing i18n gap discovered while adding the new `weaponcursed`/`armorcursed` keys these locks needed; all seven now have real translations in both locales. **Browser-verified live**, after root-causing the earlier server failures: every port tried before (8934-8968, 8869-9068, etc.) fell inside a Windows dynamic-port-exclusion range (`netsh interface ipv4 show excludedportrange protocol=tcp`), not a sandbox restriction - port 8000 binds fine, and `chrome-devtools-mcp` (CDP-direct, not the Chrome-extension bridge) reached it. Confirmed live in a running French-locale session via `window.__MWG__.currentScene`: (1) calling `generatedInventoryItem` directly for `cat=0`/`cat=6` with `cursed:true` over 3000 trials rolled all 7 weapon curses and all 8 armor curses at the expected uniform rate, and with `hasGoodEnchant:true` rolled all 9 weapon enchants and all 6 armor glyphs at the expected weighted rate, with zero unexpected affixes when neither flag was set; (2) equipping a cursed weapon (`annoying`) then attempting to equip a different one was actually blocked in-game, with the correct on-screen message "Impossible de retirer cette arme : elle semble maudite !" (confirming the new `weaponcursed` FR string resolves, not a raw key); (3) clearing the curse released the lock and the swap then succeeded; (4) `heroBarrier` with 20 shielding dropped by exactly 1 on the first `spendHeroTurn()` tick with `barrierPartialLoss` resetting to 0, confirming last session's Barrier-decay fix live as well. Also noticed live and fixed in the same pass: the depth-entry log line was printing a raw untranslated key (`"Vous êtes guerrier, arme en main : port.name.wornshortsword."`) - `classes.ts`'s `weaponKey` for 5 of 6 classes (`wornshortsword`/`magesstaff`/`dagger`/`gloves`/`rapier`; only the Cleric's `cudgel` had a real entry) had no matching `portStrings.ts` key in either locale. Added all 5 in both EN and FR; re-verified live afterward (`"Vous êtes guerrier, arme en main : une épée courte usée."`). **2026-09-11 (MWG 0.7.2):** the affix catalogue moved from a hand-split `set=` positional trait to MWG typed MWL tables (`[table]`/`[row]` in `affix-rules.mwl`), so the framework validates column shape and coerces each cell; `mwlContent.ts`'s hand parser and `compile-mwl.mjs`'s `validateAffixTables` are gone, and `rollGeneratedAffix` now uses `Actors.rollAffix`'s own `curse` option instead of filtering entries itself. Browser-verified on 0.7.2: the roll distribution is identical (13 good/7 cursed weapon ids, 13 good/8 cursed glyph ids, none when ineligible). |
| `Repulsion.proc()` (armor glyph: chance-scaled knockback of an adjacent attacker) | `attack()`'s post-hit armor-glyph branch + `moveTo` | Simplified but playable: the real `(buffedLvl+1)/(buffedLvl+5) x Arcana` chance and `round(2 x max(1, chance))` straight shove are reproduced for a defending hero, stopping at walls/occupants and preserving the port's flying/chasm/piranha movement rules. Java uses `Ballistica`/`WandOfBlastWave`; the port reuses its existing direct shove path. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Brimstone.proc()`/`Char.isImmune(Burning)` (armor glyph: fire immunity) | `Creature.fireImmune`, `syncHeroFromStats`, `addBuff` | Ported: the equipped Brimstone glyph sets the same immunity at the shared buff boundary, so traps, fire blobs, wands, plants, and monster attacks cannot attach `burning`. Java's glyph proc itself is intentionally empty; the effect lives in `Char.isImmune()`. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Viscosity.proc()`/`DeferedDamage.act()` (armor glyph: defer part of incoming damage) | `absorbHeroDamage`, `Creature.deferredDamage`, `spendHeroTurn` | Ported for the hero: Java's level/Arcana-scaled split, one-turn delay, and `max(1, floor(pool*0.1))` damage drain are reproduced at the shared incoming-damage boundary, including save/load state. The scheduled tick bypasses Viscosity recursion while still using shields and HP. The Java `WarriorFoodImmunity` exception is not modeled because that talent is absent. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Affection.proc()`/`Charm.object` (armor glyph: charm the attacker toward the wearer) | `attack()`'s charm target check, `mobOnHit`'s Affection branch | Ported: the real `(buffedLvl+3)/(buffedLvl+20) x Arcana` proc and `round(10 x max(1, chance))` duration are applied to the attacker, with the existing target map making subsequent attacks against the wearer deal zero damage. Heart particles are presentation-only. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `AntiMagic.drRoll()`/`Char.damage()`/`Char.isImmune()` (armor glyph: reduce listed magical damage and statuses) | `absorbHeroDamage(amount, magical)`, `zapHero`, `eyeBeamTurn`, `Creature.magicImmune`, `addBuff` | Ported for the represented magical ranged sources: the Java level/Arcana-scaled `NormalIntRange(level, 3+1.5*level)` reduction is applied before shields, and `Charm`/`MagicalSleep`/`Weakness`/`Vulnerable`/`Hex`/`Degrade` are rejected at the shared buff boundary. The port marks its explicit magic-bolt/death-gaze callers; unrepresented Java spell/bomb/trap source classes remain outside this seam. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Obfuscation.stealthBoost()`/`Char.stealth()` (armor glyph: harder detection) | `heroStealth()`, sleeping-monster detection | Simplified but functional: the exact `(1+level/3) x Arcana` stealth value now participates in Java's sleeping detection roll `1/(distance+stealth)`. The port's non-sleeping `seesHero` remains FOV-binary because it has no separate Java Wandering detection state. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `ChampionEnemy.Giant/Projecting.canAttackWithExtraReach()` | `takeMonsterTurn` extra-reach branch | Ported with geometry simplification: Giant attacks at clear-line range 2 and Projecting at clear-line range 4, matching Java's maximum ranges and existing damage factors. Java uses a path-distance map that can reach around walls; this port's `Roguelike.canTarget` requires a clear line. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Weapon.Projecting.reachFactor()` (weapon enchantment) | `takeHeroTurn` directional reach scan | Ported with input simplification: the real `1 + round(Arcana)` melee reach is applied along the player's chosen direction, stopping at the first wall/door/occupant. Java selects an arbitrary valid target cell through its targeting UI; this port has directional movement input instead. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Corrupting.proc()` (lethal weapon enchant converts a Mob into a healed controlled ally) | `attack()`'s pre-damage Corrupting branch | Simplified but playable: the real `(buffedLvl+5)/(buffedLvl+25) x Arcana` lethal proc now fully heals the target, clears negative buffs, prevents the killing damage, and converts it into the existing scheduled ally model. The port has no separate Corruption buff/loot-transfer payload, so the converted actor uses the existing ally combat state; no additional loot is generated. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Elastic.proc()` (chance-scaled knockback beyond the struck cell) | `heroOnHit`'s `elastic` branch, `moveTo` | Simplified but playable: the real `(buffedLvl+1)/(buffedLvl+5) x Arcana` chance and `round(2 x max(1, chance))` shove distance are applied to melee targets along the attack axis, stopping at blocking cells and using the existing chasm/piranha movement rules. Java's Ballistica/BlastWave projectile-vs-melee distinction is represented by limiting the shove to the real hero bump-attack path; missile and SpiritBow attacks do not push. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| `Blooming.proc()`/`plantGrass()` (uncommon weapon enchant: `(lvl+1)/(lvl+3)` chance, `(1+0.1*lvl)` plants, defender-first/shuffled-neighbour order) | `heroOnHit`'s `blooming` branch + `plantBloomingGrass()` | Ported with stated substitutions: EMPTY/EMPTY_DECO/EMBERS have no ids in this port's terrain, so FLOOR+GRASS are the plantable set; FURROWED_GRASS (and HIGH_GRASS-under-Regeneration, a well-water state not modeled) collapses straight to HIGH_GRASS; occupancy reuses the live plant-marker maps; leaf-burst particles have no seam (a log line stands in). Real common/uncommon/rare rarity confirmed against `Weapon.java` (`Blooming` is uncommon -> weight 2, matching the table's existing common-3/uncommon-2 convention). Type-check/build/tests only; browser verification owed per ROADMAP.md section 10. |
| `Camouflage.activate()` (uncommon armor glyph: `round((3+lvl/2) x arcana)` Invisibility on grass trample) | `trampleHighGrass`'s `camouflage` branch | Ported, keep-max (`Buff.prolong` semantics) via a direct buff-map write (the freerunner precedent, since `addBuff` only grants fixed durations). Java's MELD sound has no per-effect audio seam here - the log line stands in. Uncommon -> weight 2 per `Armor.java`. Type-check/build/tests only; browser verification owed per ROADMAP.md section 10. |
| `Stench.proc()` (armor curse: 1/8 x arcana to seed 250-volume ToxicGas at the wearer's feet) | `mobOnHit`'s `stench` branch | Ported exactly (250, not the trap/potion 1000). **Found fixing this: the port's `fragile` armor curse (-2 armor) never existed in real Java** (checked tag `v3.3.8` back to `v3.3.1`; closest match is a `v1.x`-era changelog mention, and its `items.armor.curses.fragile.*` name keys don't exist in the generated catalog either) - replaced by `stench` in `GLYPH_TABLE`/`itemCurses.ts`, the phantom -2 armor line removed, and pre-correction `fragile` ids migrate to `stench` on load plus a `getCurse` legacy shim. `Friendly` is now ported: the exact 1/10 x Arcana proc attaches Java-shaped 10-turn Charm to the attacker targeting the defender, 5-turn Charm to the defender with `ignoreNextHit`, and the attacker deals zero damage to its recorded target while charmed. The object/one-hit payload is stored separately from the generic duration map and persisted by stable entity id. Simplified only in presentation: no heart particle effect. Type-check/build/tests pass; browser verification owed per ROADMAP.md section 10. |
| Arcana scaling on curse procs (`RingOfArcana.enchantPowerMultiplier` via `procChanceMultiplier`) | `ringArcanaMultiplier()` at every ported curse chance-proc | **Correction: the old claim (here and in ROADMAP.md) that curses never scale "by design" was wrong** - checked tag `v3.3.8`: every ported curse chance-proc calls it (weapon: Annoying/Dazzling/Sacrificial/Displacing; armor: AntiEntropy/Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth; plus new Stench and unported Friendly). All now scale; only Polarized (no chance roll) and Wayward (ported as a flat passive) don't. **Sacrificial's base chance corrected in the same audit**: flat 1/12 was an unconfirmed guess, real Java is 1/10. Explosive's fuse burn now also scales (`round(IntRange(0,10) x arcana)`). Type-check/build/tests only; browser verification owed per ROADMAP.md section 10. |
| Durability for melee (none exists in Java - only missiles wear), identification flags, STR requirements and the accuracy penalty for being under-strength | `rollHit`'s `1.5^enc` penalty, `rollDamage`'s excess-STR bonus, `InventoryItem.identified` | Ported, with one simplification: the `1.2^enc` delay penalty has no model (turns here have no fractional duration) |

## Monsters (`actors/mobs/*.java`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Goo.act()`'s water-healing regen (`healInc` while submerged and below full HP) | `takeGooTurn` | **Now ported, found missing entirely while auditing the Sewers boss against `Goo.java`** - Goo's pump-up/slam mechanic was already live, but the separate "retreat into water to heal" behavior real players use as a tell had no equivalent at all. Simplified to a flat `+1 HP`/turn while standing in water and below full HP (real Java's `healInc` ramps `1`->`3` only under the `STRONGER_BOSSES` challenge, not modeled here) and does not interact with a `LockedFloor` door-lock countdown, since this port has no boss-room door-lock system at all - both narrower, honestly-flagged gaps rather than a rushed full match. |
| `SentryRoom$Sentry.act()`/`onZapComplete()` (immobile beam turret: infinite evasion, `20+depth*2` accuracy, `NormalIntRange(2+depth/2, 4+depth)` DeathGaze, sees through invisibility) | `MONSTERS.sentry` + `red_sentry.png`, `spawnMonster`'s sentry case, `takeMonsterTurn`'s sentry branch, `sentryWarmup` | Ported, checked against tag `v3.3.8` (`SentryRoom.java`). Own byte-for-byte art at the real 8x15 film, HP=HT=1/EXP=0 (the NPC base), real evasion constant (the short-circuit threshold, not the display 999999), depth-scaled accuracy set at spawn, never sleeps, excluded from champions, never moves or melees (owns its whole turn ahead of the adjacent block), sees through invisibility, charges ~2 turns on first sight then fires every visible turn with the armor-bypassing beam (looking away resets the charge), holds fire while terrified instead of fleeing. Stated gaps: the room-area/EMPTY_SP trigger collapses to line-of-sight, no Bestiary tick, no travel-interrupt pity, no charge particles (a port log line stands in). **Found fixing the section-10 crash this same pass: `alchemyBlob`/`eternalFire` painter markers are blob seeds, not mobs** - filtered at the live bridge (the pot stays inert scenery; the eternal-fire wall is now ported, see the dedicated `EternalFire` row below - the old "needs a non-diffusing fire primitive" premise was stale, a static blob needs no diffusion primitive at all), and `spawnPortedMobs` now refuses any future unknown kind with a log line instead of crashing. Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `RotHeart`/`RotLasher` (HP 80, defense 0, IMMOVABLE, ToxicGas-immune; heart PASSIVE/EXP 4/no attack, lasher Waiting/EXP 1/damage 10-20/acc 25/seed loot 0.75/+5 regen, heart death kills lashers) | `MONSTERS.rotHeart`/`rotLasher` + `rot_heart.png`/`rot_lasher.png`, `takeMonsterTurn`'s rot branches, `kill()`'s heart rule, `MOB_LOOT`, the toxic-gas immunity | Ported, checked against tag `v3.3.8` (`RotHeart.java`, `RotLasher.java`) - the same crash class as the sentry (`rotHeart`/`rotLasher` painter kinds had no catalogue entry either, so RotGarden floors crashed on entry too). Own byte-for-byte art at the real films, never sleep, excluded from champions, never move; the heart never acts (burning still destroys it through the generic DoT, minus Java's destroy-vs-die distinction); the lasher attacks adjacent foes, regenerates exactly `min(5, missing)` with no adjacent enemy, holds still while terrified, drops the real 0.75 seed, and dies with the heart. Stated gaps: burning-destroy nuance, lasher heal status text (a `showHeal` tick stands in). Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `MagicalFireRoom.EternalFire` (permanent non-diffusing fire wall: blocks passage, ignites chars with `Burning.reignite(4)`, spreads regular Fire to flammable cells, burns heaps, any partial frost/blizzard/water clear wipes the whole wall) | `main.ts`'s `eternalFire` blob (seeded at the live bridge from the painter's `eternalFire` markers, floor-saved), `spreadFire`'s ignite branch, `eternalFireBlockedInto` (hero step query, click-travel routing, shared + terror-flee monster pathing), `potionFrost`'s quench branch | Ported, closing the section-10 crash row's own "needs a non-diffusing fire primitive" premise as stale - checked against tag `v3.3.8` (`MagicalFireRoom.java`): Java's `evolve()` never diffuses by construction, so the port simply never calls `spread()` on this blob (seeded at Java's own amount 1 per wall cell), which is exactly the audit's `spread(passable, 0, 1)` prescription with the call omitted. Ignition (hero + monsters + the existing log line), hero/monster/travel passage-blocking, and frost-quenches-whole-wall (`clear()` -> `fullyClear()`, via a Chebyshev-2 circle around the quaffing hero, the same radius approximation `StoneOfShock` uses - the room's own dropped PotionOfFrost is the intended key past the wall) are all live. Stated gaps: spreading regular Fire onto flammable terrain (no flammable map - same gap as StoneOfBlast's unported terrain half), heap burning (no heap-burn primitive), water/blizzard clearing (neither system touches blobs), boss-arena pathing (fixed arenas never contain the room), visuals (consistent with every other logic-only blob). Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| `Rat`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.rat` | Ported |
| `actors.properties`' `actors.mobs.rat.name=marsupial rat` display name | `MONSTERS.rat.name` | Ported |
| `Snake`: same four | `MONSTERS.snake` | Ported |
| `Gnoll`: same four | `MONSTERS.gnoll` | Ported |
| Java flying mob property and chasm access (`Bat`, `Bee`, `Elemental`/`NewbornFireElemental`, `Eye`, `Swarm`, `Ghost`) | `FLYING_KINDS`, `Creature.flying`, `spawnPortedMobs`/`populate`/`swarmSplit`/`moveTo` | Ported: all listed flying actors may be generated on and move across raw chasm cells. `YogFist.java` does not set `flying`, so Yog's fists remain correctly grounded. |
| `Swarm.defenseProc` split (`HP >= damage+2`, clone holds half the post-hit HP, `EXP = 0` past generation 0, free 4-neighbour) | `swarmSplit` | Ported: the clone retains Java's normal 50-HP maximum, generation, Burning/Poison and champion state; its exact one-time `SPLIT_DELAY` timestamp remains simplified to the shared scheduler stagger. |
| `Piranha.act()` water-only occupancy and `dieOnLand()` after forced movement | `spawnPortedMobs`/`populate` water gate, `moveTo` post-move check | Ported: Piranhas are only created in water, follow water-only movement paths, and die immediately when an effect moves one onto dry terrain, matching `Piranha.java`. |
| `Crab`: same four | `MONSTERS.crab` | Ported |
| `Slime`: same four | `MONSTERS.slime` | Ported |
| `Skeleton`: same four | `MONSTERS.skeleton` | Ported |
| `Thief`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.thief` | Ported |
| `Thief.steal` + `FLEEING` (steals an unequipped item, flees, drops it + gold on death) | `thiefSteal`, `takeMonsterTurn`'s `fleeBelow: 1` | Simplified - steals one consumable (or 10 gold), not an unequipped gear piece with placeholder/shatter semantics. **`Bandit` (a real, spawnable alternative kind that `extends Thief` in Java, sharing the steal-then-flee behavior unchanged - its own override just adds Blindness/Poison/Cripple on a successful steal, already ported separately via the `attacker.kind === 'bandit'` branch in `attack()`) had the flee half of this missing in three places**: found auditing rare monster variants, the same literal-kind-check bug as `ArmoredBrute`/`DM201`/`Senior`/`SpectralNecromancer` - the `stepAway` dispatch in `takeMonsterTurn`, the `decideMonsterAI` `fleeBelow` threshold, and (the most consequential of the three) `kill()`'s stolen-item-return logic all tested `kind === 'thief'` only. The first two meant a Bandit that stole something never actually fled - it kept fighting normally instead of running, the opposite of Java's real behavior; the third meant a killed Bandit's stolen item was gone for good rather than recoverable, an actual permanent item loss bug, not just a missing flavor behavior. All three fixed. Browser-verified live: a Bandit that stole an item immediately increased its distance from the hero on its next turn (fled, distance 1 -> 2) rather than staying adjacent to fight; killing it afterward correctly returned the stolen item to the bag and granted the bonus gold, with the real log line ("Vous récupérez ce que le voleur avait pris, et quelques pièces."). |
| `DM100`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.dm100` | Ported |
| `DM100` lightning zap (`Normal(3,10)` over `MAGIC_BOLT` ballistics when not adjacent) | `takeMonsterTurn`'s dm100 branch, `zapHero` | Ported |
| `Guard`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()` | `MONSTERS.guard` | Ported |
| `Guard.chain` (distance < 5 pull + `Cripple`; `chainsUsed` - real Java only ever lets a Guard chain-pull once in its lifetime) | `chainHero`, `chainUsed` field on `Creature` | Simplified - one-cell drag plus the real 4-turn Cripple; the Ballistica path (multi-cell pull distance along the projectile line) is still not modelled. **The once-per-life flag is now ported** (was previously missing entirely, letting a Guard repeatedly chain-pull and Cripple-lock the hero every time it came back into range - something real Java never allows): `chainUsed` is set the first time `chainHero` fires and persists through floor save/load, gating the attack out for good afterward. Browser-verified live: a Guard chained once (hero pulled, Cripple applied), then took no further chain action across three more turns at the same range. |
| `Necromancer`: `HP`, `defenseSkill`, `drRoll()` | `MONSTERS.necromancer` | Ported |
| `Necromancer` summon (`NecroSkeleton` HP 20, no EXP, dies with its master) + ranged bolt (`Normal(2,10)`) | `summonSkeleton`, `zapHero`, `kill`'s skeleton cleanup, `simulation/turns.ts`'s `TurnPorts.monsterTurnCost`, `adapters/sceneSimulation.ts` | Simplified - the summon trigger/range, bolt, and now `firstSummon` timing are real; only the push-aside remains not modeled. **The push-aside is now ported too, closing a second stale "blocked" claim** (the old "needs a full knockback system" premise was wrong - checked against `Necromancer.summonMinion()`, the rule is a plain 8-neighbour search maximizing distance from the necro, and `Roguelike.knockbackPath`'s straight-line shove would not even have matched it): `summonSkeleton` now picks the unoccupied passable hero-neighbour nearest the necro (Euclidean, matching `trueDistance`), else the nearest passable neighbour even when occupied and shoves a pushable occupant to its farthest free neighbour (`IMMOVABLE_KINDS` - dm201/sentry/rotHeart/rotLasher - redirect the skeleton instead, matching the immovable rule), else deals the real `SummoningBlockDamage` direct 2-10 hit with no hit roll (which also fixed the old fallback wrongly firing a missable `zapHero` bolt even when no cell was passable at all, where Java waits). Remaining simplifications, all narrower than before: no one-turn telegraph, no reachability/FOV gating on the pick, no LARGE/`openSpace` gate, no Pushing visual (a log line), no per-monster DR on the blocker hit. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. **`firstSummon`'s variable tick cost is now ported, closing a stale "blocked" claim**: this row previously said the port's turn model "spends exactly 1 for every monster action, so there's no variable cost to apply without a scheduler-level change" - re-checking the actual plumbing while auditing other stale roadmap claims (right after finding the Weapon-Augment one) showed that premise was simply wrong. `mwg/roguelike`'s `Scheduler.spend(cost)` already accepts an arbitrary cost, and `adapters/sceneSimulation.ts`'s own `act` callback already threads a per-actor return value straight into it (`rules.scheduler.spend(cost)` in `mwg/simulation`'s `Turns.ts`) - it was just hardcoded to return the literal `1`, discarding any real per-action cost the scene might want. Fixed with a new optional `TurnPorts.monsterTurnCost(actor)` port, read once immediately after `takeMonsterTurn` returns (falling back to `1` when absent, so every other actor and the committed `verifySimulation.mjs` test suite are unaffected). `summonSkeleton` sets a scene-side `pendingMonsterTurnCost` (cleared at the start of every `takeMonsterTurn` call) to `2` when `necro.firstSummon` was already `false` before this summon, `1` otherwise, then sets `firstSummon = false` - matching Java's own `spend(firstSummon ? TICK : 2*TICK)` exactly, including the real semantics that `firstSummon` only ever flips once per necromancer, for its lifetime, not per-skeleton (a necromancer whose skeleton dies and gets replaced costs 2 for every summon from then on, not just the first replacement). A new `firstSummon` field on `Creature`/`SavedCreature` persists this through floor save/load, matching how `skeletonIndex` already does. Browser-verified live, end-to-end through the real scheduler (not just the isolated cost calculation): spawning a fresh necromancer and driving `runTurns()` after killing its first skeleton showed its scheduled turn advance by exactly `2` for the resummon, versus `1` confirmed for a fresh necromancer's very first summon. | **`SpectralNecromancer` (a real, spawnable alternative kind that `extends Necromancer` in Java, sharing this bolt/summon/support behavior unchanged - its own overrides, a wraith-summoning variant and a Scroll of Remove Curse drop, are both beyond this port's scope) never got any of it at all**: found auditing rare monster variants, the same literal-kind-check bug as `ArmoredBrute`/`DM201`/`Senior` - all three sites (the adjacent-bolt dispatch, the summon/support branch, and `kill`'s skeleton-death cleanup) tested `kind === 'necromancer'` only, so a SpectralNecromancer fought as a plain melee attacker with no ranged bolt or skeleton summon at all. All three fixed; stats were already correct in `monsters.ts` (identical to base Necromancer) from before this pass. Browser-verified live: a SpectralNecromancer at distance 2 correctly summoned a skeleton first (matching the real summon-before-bolt priority), then with the skeleton moved out of sight, its next 10 turns rolled damage in the real `[2,10]` range (misses read 0) with the correct French bolt-hit log line naming it by its own translated name, not the base Necromancer's - see the French-wording correction to that same log line lower in this file (the "i18n audit" row), found by the user directly afterward: it had been using "carreau" (a physical crossbow quarrel), wrong for every creature that actually uses this line, all of which fire a magical bolt/zap, not a physical one. |
| `Necromancer.onZapComplete()`: while its own skeleton lives and is in its sight, it supports rather than attacks - heals `HT/5` if the skeleton is hurt, else grants it a one-time `Adrenaline` if it doesn't already have it | `takeMonsterTurn`'s necromancer branch, reusing the existing `hasteTurns`/`hasteBaseSpeed` haste fields as the closest stand-in for `Adrenaline` (this port has no separate buff for it) | **Ported**, closing part of the same row's "not" list above - previously the necromancer had zero ongoing support behavior at all: once summoned, its skeleton just fought alone forever. Real heal amount (`round(maxHp/5)`, capped at max) and the real "heal first, otherwise Adrenaline, but only one or the other per turn" priority are both reproduced. The teleport-to-hero's-side branch (`ScrollOfTeleportation.appear`, for when the skeleton is out of the necromancer's own sight) is also now ported: an out-of-sight skeleton not already adjacent to the hero gets moved to a free cell beside the hero instead of being left stranded wherever it last wandered. Simplified: real Java picks the closest such cell that is *also* in the necromancer's own sight (a distance-ranked search over `PathFinder.NEIGHBOURS8`); this port picks any free neighbour of the hero at random, a narrower selection. Browser-verified live: a hurt skeleton healed by exactly `round(maxHp/5)`, a full-health skeleton without haste got 3 turns of doubled speed instead, and a skeleton placed out of the necromancer's sight and not adjacent to the hero was moved to stand directly next to the hero - all three with the correct on-screen messages. |
| `Bat`/`Brute`/`Shaman`/`Spinner`/`DM200`: `HP`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()`, `EXP`, `maxLvl` | `MONSTERS.bat/brute/shaman/spinner/dm200` | Ported |
| `Bat.attackProc` heal (`min(damage-4, missing HP)`) | `attack`'s bat branch | Ported |
| `Brute` enrage (`Brute.isAlive()`/`triggerEnrage()`/`BruteRage`: a one-time near-death revival with a `HT/2+4` shield that drains at a flat 4/turn plus further combat damage, boosting `damageRoll()` to 15-40 only while it's active) | `main.ts`'s death-interception in `attack()` (`hasRaged`/`raged` fields on `Creature`), the flat 4/turn decay in `takeMonsterTurn`, `liveStats`' brute branch keyed on `raged` | **Ported, correcting this row's earlier claim.** Previously "enrage" was a stateless below-half-HP check on `damageRoll()` alone - not a translation of the real mechanic, and wrong in a way that mattered: it fired every turn a Brute happened to be under half HP (even before ever nearly dying) and never actually granted the real one-time survive-a-killing-blow revival at all, so a Brute could simply be killed outright the first time, something Java never allows. Now: the first hit that would bring a Brute's `hp` to 0 (`!hasRaged`) instead sets `hp = round(maxHp/2+4)` (reusing the creature's own hp field as the shield pool, so existing damage-application code drains it exactly like real hp would - the real `ShieldBuff.absorbDamage` semantics without a parallel absorb path), sets `raged`/`hasRaged`, and only then does `damageRoll()` jump to 15-40. Each of the Brute's own turns while `raged` drains a flat 4 (Java's `AscensionChallenge.statModifier` multiplier is 1 with no ascension-challenge UI to change it), on top of whatever combat damage also lands; reaching 0 this way kills it for real, with no second revival. Persisted through floor save/load. Browser-verified live: a Brute forced to near-death revived at exactly the real `HT/2+4` value (24 for `maxHp=40`), its own subsequent turn decayed exactly -4, and driving it to 0 after the revival killed it outright rather than reviving again. **`ArmoredBrute` (a real, spawnable rare/alternative kind - `mobRosterForDepth`'s Prison swap table - that `extends Brute` in Java) never got any of this at all**: found while auditing the "Port rare monster variants" roadmap item - both check sites (`attack()`'s death-interception, `takeMonsterTurn`'s decay) tested `kind === 'brute'` literally, so an ArmoredBrute could simply be killed outright, exactly the bug the base Brute fix above once corrected. Fetched `ArmoredBrute.java` to confirm its real override: `triggerEnrage()` grants a smaller `HT/2+1` shield (not `+4`) that decays far slower - 1 point every 3rd turn (`ArmoredRage.act()`'s own `spend(3*TICK)`, vs plain `BruteRage`'s every-turn 4-point drain; Java's own comment: "similar to regular brute rate, but deteriorates much slower. 60 turns to death total"). Both check sites now include `armoredBrute`, with a new `armoredRageTicks` counter (persisted through save/load) gating the decay to every 3rd call instead of every one; `liveStats`' 15-40 damage boost while raged now also covers it (`ArmoredBrute` inherits `damageRoll()` from `Brute` unchanged). `ArmoredBrute`'s own extra `+4` DR (`drRoll()`'s override) was already correctly baked into its separate `armor: [4,16]` entry in `monsters.ts` (vs plain Brute's `[0,8]`) from before this pass - only the enrage/revival mechanic itself was missing. Browser-verified live: forcing an ArmoredBrute to near-death revived at exactly `round(40/2+1) = 21`; its next two turns left hp unchanged, the third dropped it by exactly 1 with the tick counter resetting to 0; a 30-swing sampling comparison (after the first attempt was corrupted by repeated in-loop hero deaths triggering scene transitions - redone cleanly on a fresh page, keeping hero HP topped up between swings) confirmed damage stayed bounded in the real 15-40 range (observed 16-37). |
| `Monk`/`Senior` Focus (`Monk.act()`'s `focusCooldown` decaying every one of the monk's own turns, re-attaching a dodge-the-next-hit buff once it reaches 0 while `HUNTING`) | `Creature.focusCooldown`, `afterMonsterTurn`, `moveTo`, `attack()`'s Focus-consuming dodge branch, the initial grant in `spawnMonster` | Ported: the floating 6–7-turn cooldown is reduced by one action-time unit after each Monk/Senior turn, plus Java's movement reductions (0.67 for Monk and an additional 1.66 for Senior), then reattaches the dodge buff while the mob sees the hero. Senior inherits the same parry reset and defense behavior. The shared buff map remains the carrier, so Java's sprite/audio parry presentation is not modeled. |
| `Scorpio`: refuses adjacent kills and backs away instead (`getCloser` override calling `getFurther` while `HUNTING`), attacks ranged-only over `PROJECTILE` ballistics, 50% cripple proc on hit | `takeMonsterTurn`'s scorpio retreat/ranged branches, `attack()`'s cripple proc | Ported for the base kind. **`Acidic` (a real, spawnable alternative kind that `extends Scorpio` in Java, sharing all three of these unchanged - its own override adds an `Ooze`/corrosion proc on top via `super.attackProc()`, already ported separately elsewhere in this file) had all three missing**: found auditing rare monster variants, the same literal-kind-check bug as `ArmoredBrute`/`DM201`/`Senior`/`SpectralNecromancer`/`Bandit` - the retreat dispatch, the ranged-attack range check, and the cripple proc all tested `kind === 'scorpio'` only, so an Acidic fought as a plain melee attacker with no retreat, no ranged attack, and no cripple proc, keeping only its own corrosion effect. All three fixed; stats were already correct in `monsters.ts` (identical to base Scorpio) from before this pass. Browser-verified live: an adjacent Acidic correctly retreated (increased its distance) instead of meleeing; placed at range 3 with a clear line, it landed real ranged hits bounded in the exact `[30,40]` range with zero hero armor (confirmed over 20 turns: observed 31-40), with the correct French cripple-proc log line ("La piqûre vous estropie !") firing on procs. |
| `Slime.damage()`: incoming hits of 5+ are soft-capped, the same shape as `DemonSpawner.damage()`'s already-ported formula but with a lower threshold (takes 5/6/7/8/9/10 dmg at 5/7/10/14/19/25 incoming) | `simulation/defenderDamageCurves.ts` (was `attack()`'s slime/causticSlime branch) | **Ported, and since 2026-09-12 part of one consolidated family applied at Java's point.** Previously not modeled at all, for either kind - not the literal-kind-check bug (no branch existed for either `slime` or `causticSlime`), simply an unported mechanic, found while checking whether `CausticSlime extends Slime` (which shares it unchanged; its own override just adds the already-ported Ooze proc via `super.attackProc()`) needed the same kind of fix as the other rare variants this session. Implemented with the identical `4 + floor((sqrt(8*(dmg-4)+1)-1)/2)` formula (confirmed against `Slime.java`), placed next to the existing `demonSpawner` soft-cap branch it mirrors. Browser-verified live: fed the six raw values from Java's own documenting comment (5/7/10/14/19/25) and got back exactly 5/6/7/8/9/10 each time; a live 25-damage hit through the real `attack()` pipeline landed for exactly 10, matching precisely. **Then found the family's *position* was wrong for one of its four members**: these are all `damage()` overrides, so Java runs them inside `enemy.damage(...)` - after the attacker's every multiplier and proc - and while `eye`/`demonSpawner`/`slime` happened to sit there, `pylon`'s ran at the top of `attack()`, above the augment/talent/proc chain, so a charged pylon under-reduced every hit it took (with the x1.5 augment: Java computes 60 then curves to 23, the old order curved 40 to 20 then multiplied to 30). All four are now `simulation/defenderDamageCurves.ts`'s `applyDefenderDamageCurves(kind, damage, flags)`, called once at Java's point, with `verifyCombat` asserting Java's own published value table for each curve and browser-verified live on the built game (slime raw 40 -> 12; charged pylon with the x1.5 augment -> 23, not 30). Not modelled within the family: `Slime.damage()`'s `AscensionChallenge.statModifier` divide-and-multiply (the identity while the ascent is unported), and `Pylon`/`DemonSpawner`'s own side effects - the locked-floor timer credit, and the spawn-cooldown cut - which stay at the call site. |
| `Shaman` zap (`Normal(6,15)` over `MAGIC_BOLT`) | `takeMonsterTurn`'s shaman branch | Ported |
| `Spinner.attackProc()` / `Hunting.act()` / `shootWeb()`: poisonous fleeing bite plus a 10-turn-cooldown ranged web | `mobOnHit` Spinner bite branch, `takeMonsterTurn`'s new spinner branch, `webCooldown` field on `Creature` | Simplified - the melee bite now matches Java's 50% `Poison` for 7-8 turns and flee transition. The ranged web is also ported in shape: real Java predicts the hero's movement direction (`lastEnemyPos` vs current) and seeds a real `Web` terrain blob across three cells that immobilises whoever later stands in it, not a direct debuff - this port instead roots the hero directly on a clear (line-of-sight, range 6) shot, the same "shape not curve" simplification already used for other line-based abilities (DM200's vent, the Necromancer's bolt). The real 10-turn cooldown and not-adjacent gating are faithful. **2026-09-10 correction: the flee half is now actually implemented, not aspirational** - `attackProc` sets a persisted generic `Creature.fleeing` flag (the prior code assigned `fleeBelow` on the `Creature`, which is not a real field, so the tree did not type-check and no flee ever happened), `takeMonsterTurn` treats `fleeing` like the Thief's steal state (`fleeBelow: 1`, and `stepAway` when adjacent instead of biting), and `Spinner.Fleeing.act()`'s return to HUNTING is modeled (cleared once the spider sees the hero and the hero's `Poison` has worn off; Terror/Dread are owned by the generic terror override). The bite duration now uses `Random.range(7, 8)`, Java's exact `Random.IntRange(7, 8)`, instead of the `normalRange` lookalike. Browser verification remains pending for this correction. |
| `Golem.teleportEnemy()`/`canTele()`: while not adjacent, teleports the hero to their own farthest free neighbour cell from the golem, gated by a 20-turn `enemyTeleCooldown` | `takeMonsterTurn`'s golem branch, `golemTeleCooldown` field on `Creature` | **Ported** - Golem previously had no special behavior at all and fought as a plain melee attacker, despite having a real, distinctive teleport-the-hero-away ability in Java. Fetched `Golem.java` to confirm the exact shape: while not adjacent, off cooldown, and with a real reachability check passing, it picks whichever of the hero's own 8 neighbouring cells maximises distance from the golem (among passable, unoccupied ones) and teleports the hero there, pushing them away rather than closing the gap itself. Simplified: real Java's `canTele()` is a BFS reachability check around blocking terrain (`PathFinder.buildDistanceMap`); this port requires a clear line-of-sight within 8 cells instead, the same "shape not curve" simplification already used for DM200's vent and Spinner's web. Golem's *other* real ability - a self-teleport-to-reposition move while `Wandering` (not `Hunting`), gated by its own separate `selfTeleCooldown` - is not modeled at all; only the hunting-state, hero-targeting teleport is. Browser-verified live: a golem 3 cells from the hero correctly teleported the hero to a genuinely farther cell and set `golemTeleCooldown` to 20; an immediate second attempt correctly did nothing while the cooldown ticked down to 19. |
| `Eye.doAttack()`/`deathGaze()`: a two-turn ranged beam (charge, then fire a real magic-hit-roll 30-50 line attack bypassing armor/DR), with 1/4 damage taken while charged and a 4-6 turn cooldown after firing | `takeMonsterTurn`'s eye branch, `beamCharged`/`beamCooldown` fields on `Creature`, the `Eye.damage()` quarter-damage check folded into the shared attack damage-modifier chain, `simulation/turns.ts`'s `monsterTurnCost` hook (from the `firstSummon` fix) for the charge turn's real 2x cost | **Ported, replacing a completely wrong-shaped stand-in.** The previous implementation applied a 1.5x damage multiplier to every 3rd landed *melee* hit - not a simplification of the real ability, a different mechanic entirely: fetched `Eye.java` and confirmed DeathGaze is 100% ranged, never a melee proc at all (Eye's own melee `damageRoll()`/`attackSkill()` exist only as the generic fallback `canAttack` uses when the beam is on cooldown or blocked). Real Java: turn 1 charges (`spend(attackDelay()*2f)`, no damage, `((EyeSprite)sprite).charge()`), during which incoming damage is quartered (`if (beamCharged) dmg /= 4` in `Eye.damage()`); turn 2 fires along a `Ballistica` line, rolling a real magic hit (`hit(this, ch, true)`) and, on a hit, `Random.NormalIntRange(30,50)` damage applied via a direct `ch.damage()` call that never subtracts armor/DR at all (unlike this port's own `zapHero`, which does subtract armor for its bolt-throwing mob kinds - confirmed by reading the exact call chain, not assumed); then a `Random.IntRange(4,6)` cooldown. This port's version reuses the same `Roguelike.canTarget`/line-of-sight simplification already established for DM200's vent and Spinner's web instead of Java's full multi-target beam-with-terrain-destruction and BFS reachability check (this port's beam only ever targets the hero, not every creature caught in the line). Browser-verified live: a fresh eye's first `takeMonsterTurn` call charged (`beamCharged: true`, `pendingMonsterTurnCost: 2`); a 20-damage test attack while charged did exactly `5` (floor(20/4)) versus the full `20` once un-charged; forcing a charged eye to fire dealt damage in the real 30-50 range and set a fresh cooldown in the real 4-6 range, with `beamCharged` correctly reset to `false`. |
| `DM200.Hunting.act()`/`canVent()`: while not adjacent, a distance-scaled roll (`Random.Int(100/distance)==0` - farther is *more* likely) seeds toxic gas along the `Ballistica` line to the hero (20/cell, 100 at the target's own cell), gated by a 30-turn `ventCooldown` | `takeMonsterTurn`'s dm200 branch, `ventDM200`, `ventCooldown` field on `Creature`, `Roguelike.traceLine` for the line, the shared `plantGas` toxic blob for seeding | **Ported** - DM200 previously had no special hunting behavior at all (it just fought as a plain melee attacker once adjacent); it now correctly prefers venting from range, with the real distance-scaled odds, the real 20/100 seed amounts, and the real 30-turn cooldown, all persisted through floor save/load. Simplified: real Java's `canVent()` also BFS-checks that *some* path exists around blocking terrain even without a clear line of sight - this port requires a clear line instead (`Roguelike.canTarget` with line-of-sight required), a narrower reachability check; and real Java retries venting as a fallback if closing distance also failed this turn, which this port does not model (a missed vent roll just falls through to the normal closer-distance AI, with no second attempt). Browser-verified live: calling the vent directly seeded the exact real amounts (20, 20, 100 along a 3-cell line) and set the cooldown to 30. **`DM201` (a real, spawnable alternative kind that `extends DM200` in Java) never got this ability at all, and could also move freely** - found auditing rare monster variants, the same class of bug as `ArmoredBrute`/`Brute`: the vent check tested `kind === 'dm200'` literally, and real Java's `DM201` also adds `Property.IMMOVABLE` (unlike `DM200` itself, which moves normally) - this port had no immovability concept applied to it at all, so it walked around like any other hunter. Both fixed: the vent branch now covers `dm201` too (inherited unchanged from `DM200`), and `takeMonsterTurn` now returns immediately for `dm201` once it reaches the generic-mover point without having vented or attacked, rather than falling through to `decideMonsterAI`. Also fixed in the same pass: this port's own vent log line (`port.log.dm200vent` - an addition with no real Java equivalent, since `DM200.java` itself has no `GLog` call for the vent, only the visible gas cloud) hardcoded "DM-200" regardless of which kind actually vented; now interpolates the real attacking creature's own name. Browser-verified live: a spawned DM201 stayed at its exact spawn cell over 10 turns of `takeMonsterTurn` despite the hero being in range; forced-roll testing over up to 400 turns (the real per-turn odds are low - `Random.Int(100/distance)` - so many trials are needed to observe one) confirmed it vents correctly with `ventCooldown` set to the real 30; the log line correctly read "DM-201 relâche un jet de gaz toxique !" instead of naming DM-200. |
| `DM300`: `HP = HT = 300`, `defenseSkill`, `attackSkill()`, `damageRoll()`, `drRoll()`, `EXP` | `MONSTERS.dm300`, `BOSSES[15]` | Ported (stats, all exact: 15-25 damage, acc 20, +0-10 armor); GAS/ROCKS uses live toxic-gas venting plus telegraphed 7x7 rockfalls on the real cooldown/pick rules. The Caves floor restores four dedicated Pylon actors, enforces inactive immunity and the Java heavy-metal damage curve, and reproduces DM300's HP-bracket supercharges: normal-mode HT/3 thresholds, challenge HT/4 thresholds, sequential pylon activation (closest pylon reserved, another selected), boss invulnerability, x2 scheduler cost, pylon loss of charge, persisted PylonEnergy cells, ground damage to every grounded character, and the Java `30 + (HT-HP)/10` boss Barrier when moving onto energized ground. Simplified: Java's water diffusion is collapsed because the fixed floor already records its water/wire cells, and exact locked-floor timing/energy visuals remain; can't-reach refinements (cone trickshotting, inorganic rule), adjacent-only turn spend (full turn here), and GAS sound/travel-interrupt presentation remain. **Updated 2026-09-11:** the arena now generates its real `Patch.generate(width, height-14, 0.15f, 2, true)` water scatter and `Random.Int(challenge ? 4 : 8)` inactive-trap scatter on the per-floor seeded stream, instead of a bare empty ellipse - without that terrain `PylonEnergy` had no cells to seed, so the whole pylon mechanic was inert. `PylonEnergy` is now seeded where Java seeds it, in `activatePylon()` at DM-300's HP-bracket supercharge (covering INACTIVE_TRAP/WATER/SIGN from row 13 down, plus any water via `evolve()`'s spread), not at arena seal; the seal itself now triggers at Java's real Chebyshev distance 3 (`Level.distance` is `max(|dx|,|dy|)`), not 2; and a long-standing double-damage bug was fixed (the energy tick iterated `[this.hero, ...this.creatures]`, damaging the hero twice). Browser-verified live at depth 15: arena water/trap/sign counts all > 0; distance-4 does not seal but distance-3 does; energy cell count is 0 before and after the seal and exactly equals the trap+water+sign count after supercharge; one pylon activates; a grounded hero takes a single 6-12 hit per tick. **Also 2026-09-11:** DM-300's locked-floor timing is now ported - it is created inside `seal()` at a random open, unoccupied `mainArena` cell that is not an `EMPTY_SP` tile (matching `CavesBossLevel.seal()`'s own do/while), not on floor entry; verified live that no boss exists before the seal and one spawns inside the arena exactly when the hero reaches distance 3. Still simplified: the port's arena layout is a hand-approximation of Java's build order, and Java's entrance-wall relocation/rock-shake on seal plus `unseal()` gate reopening are not modeled. |
| `DwarfKing` phase machine (P1 summons + LINK/TELE, P2 throne/shield/waves, P3 bleed/summons/viscosity) | `takeKingTurn` + `summonKingAdd`/`kingP1Summon`/`kingAbility`/`kingWave`, `kingPhase`/`kingShield`/cooldown fields, `attack()`'s shield/LifeLink/P1-accel hooks | Ported, checked against tag `v3.3.8` (`DwarfKing.java`) - replacing the old sketch outright, whose half-HP Fury has no Java basis at all and whose hold-the-barrier turn ran the real barrier backwards (it is a shield pool on the King, not inaction). P1 hunts with exact summon/ability cooldowns (10-14, damage-accelerated `-= taken/8`), real ghoul/monk/warlock/golem rotation, furthest-subject LINK (damage splits evenly onto the King through his own shield) and TELE (subject beside the hero, real yells); at HP<=50 (100 challenge) P2 goes immobile with a full-HP shield and the real wave schedule (ghoul/monk/warlock/golem counts and thresholds both modes, real wave yells, `KingDamager` HT/12 self-chip per batch); at shield 0, P3 summons under 4 adds and yells once under 20 HP. **P3 viscosity-deferral is now ported too** (2026-09-11): `DwarfKing.damage()`'s phase-3 branch banks every hit whose source is not its own payout into the shared `Viscosity.DeferedDamage` pool (`deferKingDamage`, checked at the central damage boundary before the LifeLink split so the King's share defers too) and pays it out on his own turns (`tickMonsterDeferredDamage`, `max(1, floor(pool*0.1))` after a one-turn delay) - the King therefore takes no direct HP damage in P3, exactly like Java. Remaining: throne geometry (stands ground instead), the Imp shop, the LloydsBeacon upgrade, and presentation (the King's Crown drop is now granted on his death - see `kill`'s king branch). |
| `YogDzewa` phases (gates at HT-300, fist summons, P5) + `YogFist` proximity guard | `takeYogTurn`, `summonYogMinion`, `yogDamageHook`/`yogShielded`/`guardFist`/`fistNearYog`, persisted phase/summon/beam state, `kill()` cleanup | Ported, checked against tag `v3.3.8` (`YogDzewa.java`, `YogFist.java`) - replacing a turn-based spawner (which double-spawned and ran a baseless 0.75/0.5/0.25 rhythm). HP floors at each gate with phase advance, darkness line, and a fist spawn; fist-gated invulnerability and fist proximity guards route through every damage source; last-fist death at phase 4 opens phase 5 with the real hope yell and summon burst; regular Larva/Ripper/Eye/Scorpio summon cadence now runs while fists are alive and cleans up when Yog dies; the DeathRay now uses the real 10-15 cooldown shape, 20-30/30-50 damage ranges, two-phase `targetedCells` telegraph, `beams = 1 + (HT-HP)/400` multi-target volley with the adjacent-cell beam reduction, and Java's `INFINITE_ACCURACY` (Yog's HP stays balance-scaled at 400 vs Java's 1000); fists now preserve the six real subclass identities, HP/accuracy/evasion/damage/armor and their shared fire/root/ooze/cripple effects. Larva is now a standalone kind with its exact Java stats (HP 20, accuracy 30, evasion 12, damage 15-25, armor 0-4) and its own art rather than reusing the Ripper kit. **Challenge pairs are now ported too** (2026-09-11): the per-gate fist identities come from Java's real `fistSummons`/`challengeSummons` decks - built once per Yog on `Random.pushGenerator(Dungeon.seedCurDepth()+1)` with one fist from each opposed pair, `Random.shuffle`d, plus the paired counterparts in one of Java's two rotations on the Stronger Bosses challenge - so a fist and its own pair can never open together, and the decks' three entries (six on the challenge) bound the fist count by themselves instead of the old three-live cap. **A Rusted YogFist now banks its own incoming damage too** (2026-09-11): `RustedFist.damage()` defers every hit into the same `Viscosity.DeferedDamage` pool the glyph uses (`deferMonsterDamage`, the shared monster deferral the Dwarf King's phase 3 also uses) and pays it out on its own turns, so a Rusted fist never loses HP directly. **The visibility shrink is now ported too** (2026-09-11): the Halls boss floor caps its level view distance at 4 (`HallsBossLevel.viewDistance = min(4, viewDistance)`), and while Yog lives `YogDzewa.updateVisibility()` shrinks it by phase - 1 -> 4, then `max(4 - (phase-1), 1)` (3/2/1/1) - applied to both the hero's FOV and monster sight through the port's shared `viewRadius()`. **The beam now burns flamable terrain too** (2026-09-11): `YogDzewa.act()` runs `Dungeon.level.destroy(p)` on every flamable cell of each beam path - Java's FLAMABLE flag covers GRASS/HIGH_GRASS (including the furrows a Soiled fist or a Regrowth wand leaves, which is what makes this visible in the arena) and both door states. Java rewrites the tile to EMBERS; this port's live terrain has no EMBERS id, so a burned cell becomes plain FLOOR, whose flags (passable, not flamable) match EMBERS' own. **The Soiled fist's grass is now ported too** (2026-09-11): `SoiledFist.act()` grows grass around itself every turn (`Random.chances([0,2,1])` furrow rolls that upgrade a plain GRASS neighbour, then plain grass across its 3x3), `SoiledFist.zap()` roots its target and grows grass (1-in-5 tall) across the target's 3x3, both gated by `canSpreadGrass()` (more than 4 cells from Yog's own `exit + width*3` anchor, non-solid, not already tall), and `SoiledFist.damage()` blunts incoming blows by `(6-n)/6` for n tall-grass cells in its 3x3 and ignores Burning itself. This port's live terrain has no `FURROWED_GRASS` id, so Java's furrow rolls land on the `HIGH_GRASS` state instead; and because the port applies one combined per-turn DoT, Burning's immunity only covers the case where Burning is the sole damaging effect. **The Bright and Dark fists' half-health warp is ported too** (2026-09-11): the first time either drops past `HT/2` it pins there, warps to a random level cell that is not in the hero's FOV, unoccupied and reachable from the exit (Java's `Random.Int(level.length())` loop, shared `teleportFistAway`), and costs the hero something - Bright prolongs Blindness (1.5x on the pin, 3x on death) and Dark detaches the hero's Light. Java's own Blindness is only a cosmetic screen darkening (a `FlavourBuff` with no mechanical effect in v3.3.8), and this port has no Light artifact to weaken/detach, so both feedback paths keep the port's `daze` stand-in. Simplified: the Dark zap's `Light.weaken(50)`, flame/shadow arenas, and phase-0 dormancy remain. |
| `Goo`: full kit (see before) | `MONSTERS.goo`, `liveStats`, `takeGooTurn` | Ported, with one simplification: the pumped slam only fires at melee range, not as the 2-tile lunge |
| `Tengu`: `HP`, `defenseSkill`, `damageRoll()`, `drRoll()`, melee *and* ranged `attackSkill()` (10 adjacent / 20 at range) | `MONSTERS.tengu`, `takeTenguTurn`, `seedBossTrap` | Ported, extended this pass with the phase-2 rhythm: HP cannot cross more than one 1/8-bracket per hit (`clampTenguBracket`, hooked into melee/thrown/zap hits, bomb blasts, and DoT ticks), every bracket crossing relocates 5-7 away with the trap burst (capped at 4 jumps, `tenguBracketJump`), and below half HP a bomb-ability rotation plants real 3-turn `tenguBomb` fuses (nearest free hero-adjacent cell) detonating for the real range-2 `NormalIntRange(5+depth, 10+2*depth)` blast through the shared routine. Terror-immune like the real immunities list (Roots/Blindness/Dread have no seam anywhere). **2026-09-11: the FIGHT_START/FIGHT_ARENA split is ported** - crossing half HP pins HP to `HT/2` and latches `tenguPhase='arena'`; before the latch a 1/8-bracket crossing warps within Tengu's cell and refills it with `Patch`-generated dart traps (`placeTrapsInTenguCell`, `arenaJumps` untouched), after it the crossing is the phase-2 5-7 relocation that raises `arenaJumps`. Simplified: the move keeps the port's single Tengu-cell arena rather than rebuilding Java's separate `arena` ellipse (`setMapArena()`, (3,1)-(18,16)), so the darts persist into phase 2 and a phase-2 jump can land outside the cell, and Java's trap-free distance band for the dart patch is approximated by keeping the hero and its neighbours clear. The Fire cone, the Shocker anchored burst, and Java's real catch-up ability scheduler are all ported (see the dedicated Tengu-abilities row below). |
| `Ghost Quest type 2/3` (`GnollTrickster` HP20/eva5/acc16, ranged-only, combo poison/burning; `GreatCrab` HP25/eva0, moves 2/3 turns, blocks seen melee + wand bolts, 2x meat) | `MONSTERS.gnollTrickster/greatCrab`, `takeMonsterTurn` branches, `rollHit`'s crab block, `useSpecial`'s wand-negate | `GnollTrickster.attackProc()`'s real `effect = Random.Int(4) + combo` formula is now **ported** (`mobOnHit`'s gnollTrickster branch), correcting this row's earlier claim - the previous flat `combo>=3`/`>=6` cutoff meant an early hit could *never* ignite and a long combo was a guaranteed ignite with no variance either way, where real Java rolls randomness on top of the combo counter every hit (e.g. even the very first hit has a real chance to poison). `effect>=6` ignites (skipped if already burning) and `effect>2` otherwise poisons, both gated exactly as Java gates them; `combo` now also resets to 0 whenever the Trickster moves instead of attacking (`getCloser()`'s own reset, ported into both `stepAway` and the generic-movement fallback in `takeMonsterTurn`) rather than only ever climbing. Simplified: Java's `Poison.set(effect-2)` sets a real magnitude this port's poison buff has no field for (a pre-existing, separately-documented simplification), so only the ignite-vs-poison-vs-nothing threshold is faithful, not the poison's duration. Browser-verified live: 400 trials at combo 1 (effect range 1-4) produced poison exactly ~50% of the time and never ignited; 400 trials at combo 6 (effect range 6-9) ignited every time. The crab's target-based block is range-based so the quest stays completable |
| Every other Sewers/Prison/Caves mob's unique behaviour beyond the four base stats | - | Ported in full - these have no special mechanic in Java beyond their stats |
| Sleeping/wandering (`Mob.SLEEPING`, wake radius, `WANDERING`/`HUNTING`/`FLEEING`) | `spawnMonster`'s `sleeping`, `takeMonsterTurn`'s wake check, `decideMonsterAI`, `simulation/buffs.ts`'s `NEGATIVE_BUFFS` | Sleeping wake-ups roll the real `1/(distance+stealth)` detection (stealth 0), gated on the mob's own sight, with Silent Steps/levitation as their real never-wake immunities and the woken mob waiting its turn. **The negative-buff wake is now ported too (2026-09-09 roadmap pass)**: `Mob.Sleeping.act()`'s "debuffs cause mobs to wake as well" is an unconditional, no-roll wake checked before the sight-gated detection roll - real, reachable in this port since `spreadFire`/`spreadPlantBlobs` already apply `burning`/`poison`/`ooze` to sleeping monsters standing in fire/gas without ever waking them before this fix. Checked each buff's own Java class (tag `v3.3.8`) for `buffType.NEGATIVE`: `poison`/`burning`/`cripple`/`weakness`/`vulnerable`/`paralysis`/`roots`/`terror`/`ooze`/`degrade`/`daze`/`hex` qualify; this port's own invented stand-ins (`focus`/`cloak`/`frostImbue`/`lethalHasteCooldown`) have no real monster-facing negative equivalent and are excluded. Browser-verified live via `window.__MWG__.currentScene`: a sleeping, out-of-sight (`seesHero: false`) dummy with no buffs stayed asleep through `takeMonsterTurn`; the same dummy given a `poison` buff woke immediately despite still being out of sight. Remaining: no per-mob custom `HUNTING` classes, no WANDERING notice roll (checked this pass - real Java's `Wandering.act()` needs a genuine "awake but hasn't noticed the hero yet" state distinct from this port's current binary sleeping/not-sleeping model, plus a random-patrol movement behavior `mwg`'s `Roguelike` module has no primitive for; a real, moderate-scope feature, not attempted here to avoid destabilizing every monster's core AI dispatch without a careful, separately-reviewed pass), ally-aware targeting (needs the unported ally-vs-monster combat system). |
| Awake wandering detection and patrol (`Mob.Wandering.act`) | `takeMonsterTurn`'s `wasSeen` edge, `heroStealth()`, `Creature.patrolTarget`, `randomPatrolDestination` | Simplified but Java-shaped: when an awake mob first acquires the hero in its FOV, it rolls the real `Random.Float(distance/2 + stealth) < 1` notice test; a failed notice holds the mob for that turn. When no enemy is acquired, it retains Java's persistent random destination and paths toward it, with floor save/load and piranhas' water-only restriction. The destination sampler additionally excludes occupied cells, and specialized ranged target migration remains unmodeled. |
| Monster item drops (`loot`/`lootChance`) and `Gold.random()` amounts | `MOB_LOOT` + `rollLoot`, `pickupGroundItemAt`'s gold branch | Simplified - one ground item per kill (no stacking heaps, no `LimitedDrops` decay, no Wealth modifiers); gold amounts are the real `Int(30+depth*10, 60+depth*20)` |
| Corpses (heaps) beyond meat drops | `meat` ground item (Spinner/GreatCrab) | Simplified - meat eats as food; no corpse objects, no cook/carpaccio chain |
| Blob-area DoTs (fire/gas spreading over cells) | `simulation/buffs.ts:advanceBuffs`, via `tickBuffs` | Simplified - per-creature damage/timers; area fire is handled separately in the scene. Existing mwg `int` uses an exclusive upper bound: burning deals 1-2/turn and poison 1/turn. The old 1-3/1-2 description was inaccurate; step 2 preserves the actual behaviour, including damage before expiry. |
| `Fury` kindling below half HP | `attack`'s fury branch | Ported |

## Levelling and skill points (`actors/hero/Hero.java`, `Talent.java`; `mwg/actors`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Hero.maxExp(lvl) = 5 + lvl*5` (turned into `Progression`'s cumulative-total shape) | `SPD_LEVEL_CURVE` (`Actors.Progression`) | Ported |
| `Mob.java`: `exp = hero.lvl <= maxLvl ? EXP : 0` on a kill | `SewersScene.kill`, `MONSTERS[kind].exp`/`.maxLvl` | Ported |
| Level-up block: `HT = 20 + 5*(lvl-1)`, current HP carried forward by the same delta | `grantExperience` | Ported |
| Level-up block: `attackSkill++`, `defenseSkill++` every level | `heroAttackSkill`/`heroDefenseSkill`, synchronized into `heroStats` | Ported - raw combat skills grow independently by +1 each level; talent points are separate and spent through the selectable talent UI. |
| `Talent.tierLevelThresholds = [0,2,7,13,21,31]` (tier 1: levels 2-6, tier 2: 7-12) | `grantExperience`'s tier checks, `talentPoints` | Ported as a persisted talent-point ledger: points accrue through the Java talent windows, while the UI exposes Tier 1/2 nodes and selected subclass Tier 3 nodes. **Bug found and fixed, 2026-09-09 hero-progression audit**: points were previously drawn from one shared `Actors.SkillPoints` pool across all three UI tiers (itself repurposed as a bare counter by immediately reverting the `accuracy` stat bump it caused as a side effect), letting a player freely cross-spend an unspent T1 point on a T2/T3 talent the moment that tier unlocked - real Java's tiers each keep their own separate pool, and a tier's points can never buy another tier's talents. Replaced with a plain per-tier `[number, number, number]` array, granted into the correct bucket by `Talent.tierLevelThresholds`'s own windows (T1 [2,7), T2 [7,13), T3 [13,21)); T4's [21,31) window (10 points) is deliberately never granted at all, since this port has no T4 talents to spend them on - the old single pool silently leaked all 29 levels' worth (T4's 10 included) into the three tiers the UI actually shows, a real balance bug beyond just the cross-tier-spend one. Old saves (`skillPoints`/`skillPointsState`) migrate their one remaining unspent total into the T1 bucket on load, since the old format has no record of which tier those points were earned in. Browser-verified live via `window.__MWG__.currentScene`: `grantExperience(100000)` to level 30 produced exactly `talentPoints = [5, 6, 8]`, matching Java's per-tier totals precisely (and confirming T4's 10 are correctly absent); spending T1's pool down to 0 left T2's 6 points completely untouched. |
| `SUCKER_PUNCH`, `TEST_SUBJECT`, `HEARTY_MEAL`, intuition talents, meal/upgrade recharge talents | `attack`, `readScroll`, `eatFood`, equipment use and `upgradeGear` | Partially ported with rank-aware effects: surprise damage, identify healing/recharge, meal bonuses, upgrade recharge, equipment identification and stealth wake-radius rules; exact identification timing multipliers remain simplified. **Three real bugs found and fixed, 2026-09-09 hero-progression audit** (`Talent.java`, tag `v3.3.8`): (1) **`hearty_meal`** used two invented HP thresholds (25%/50%) with non-Java additive shapes - real `onFoodEaten()` has a single `HP/HT < 0.334` threshold with a flat `2 + 2*points` heal; fixed to match exactly, browser-verified (0 heal at 40% HP, exactly `+6` at rank 2 below the threshold). (2) **`sucker_punch`** added a flat `points` bonus - real `onAttackProc()` rolls `Random.IntRange(points, 2)` (1-2 at rank 1, flat 2 at rank 2); fixed, browser-verified (rank 1 produced only `{1,2}` over 40 isolated swings, rank 2 only `{2}`). Real Java also gates this once per enemy via a `SuckerPunchTracker` buff (no re-proc on repeat surprise hits against the same target) - this port has no equivalent tracker and re-procs every time, a disclosed remaining gap, not fixed. (3) **Correction, 2026-09-09 roadmap pass: `test_subject`/`tested_hypothesis` are real Java talents, not invented substitutes for `PROVOKED_ANGER`/`LINGERING_MAGIC`.** The hero-progression audit's claim was wrong - it checked only Java tags `v3.3.8`/`4.0.0-beta`, but `src/generated/spdMessages.ts`'s own real, fully-translated English text (`actors.hero.talent.test_subject`/`tested_hypothesis`, built from a more complete SPD source than either tag) confirms both are genuine, named talents this port's code already targets almost exactly. Real `test_subject`: "+1: heals 2 HP on identify, +2: heals 3 HP" - exactly what `heal + 1` already computes (rank 1 -> 2, rank 2 -> 3), no bug. Real `tested_hypothesis`: "+1: gains 2 turns of wand recharging on identify, +2: gains 3 turns" - **two real bugs found and fixed here**: the code granted `charge + 1` *whole wand charges* via `Charges.refund()`, drastically stronger than "N turns of recharging" (a charge normally takes `recoverWandCharge`'s own 10-50 turns); switching to `Charges.advance(charge + 1)` alone was still wrong, since `advance`'s argument is progress-units-toward-a-charge with this port's `regenRate: 1` (one unit fills a charge), not real game turns. Fixed to compute the *current* per-turn passive regen rate (`ringEnergyMultiplier / turnsToCharge`, the same formula `recoverWandCharge` uses) and bank exactly `charge + 1` turns' worth of it via `advance(perTurnRate * (charge + 1))`. Browser-verified live: at 4 missing charges, rank 1 banked exactly `2 * (1/33.4) = 0.0598` progress (previously: 2 whole charges instantly) - the code comment at the call site now cites this exact derivation. |
| Remaining proc-heavy talent effects | `heroShield`, charge hooks, combo/kill hooks and `talentRank` | Incrementally ported: barrier absorption, healing shields/evasion, combo/kill/cleave, point-blank ranged scaling, subclass charge/sustain effects, stealth shielding, lethal momentum/haste/deathless fury/endless rage, necromancer minions, follow-up strikes, heightened senses, durable projectiles/tips, nature's aid/bounty, shielding dew, rejuvenating steps, weapon recharging, wand preservation, farsight/arcane vision, Iron Will, Iron Stomach, Cached Rations, Improvised Projectiles, Evasive Armor, Assassin's Reach/enhanced lethality, Empowered Strike, Bounty Hunter, Unencumbered Spirit, Monastic Vigor, Lethal Defense, Shared Upgrades, Twin Upgrades, Soul Siphon, Projectile Momentum, Enraged Catalyst, Rogue's Foresight and Swift Equip presentation are live; **five of those were wrong-shaped stand-ins, found auditing each helper against tag `v3.3.8` (`Talent.java`, `Mob.die()`, `Hero.damageRoll()`, `Wand.wandProc()`, `Level.updateVisibility()`) and now corrected**: Lethal Haste was a free-turn flag on every kill - real is `GreaterHaste.set(2+2*points)` turns on a hero-caused kill (melee, thrown, bow; never wand - Java's `cause` gate) behind a real 100-turn cooldown, now reproduced with the existing `haste` buff at its real x3 cost plus a ticking `lethalHasteCooldown` buff; Weapon Recharging was a per-hit wand-charge refund - real is `round(dmg*1.025+0.025*points)` melee damage while Recharging is held (ArtifactRecharge counts too in Java; no such buff exists here); Farsight was a +2/point ranged-targeting range - real is a `1+0.25*points` sight-radius multiplier in `viewRadius()` (targeting is a flat 6 for everyone); Arcane Vision revealed secrets on identify reads - real marks the zapped target (`CharAwareness`, `5+5*points` turns), now the over-broad but duration-exact `mindvision` on zap; Necromancer's Minions spawned a hostile skeleton on every warlock kill - real rolls `0.4*points/3` only on soul-marked deaths for a Corrupted Wraith ally, so with no SoulMark/Wraith/ally systems the stand-in is removed outright (its formula helper stays as reference) rather than kept wrong; Endless Rage's free-turn line is gone too (real Endless Rage only raises the Berserk cap, needing the unmodeled rage clock). Lethal Momentum's chance was already exact, only its trigger widened to missile kills per the same `cause` gate. Two `!= DUELIST` gates in the Java lines above are unsatisfiable alongside class-locked talents (both tags agree) - the port follows the evident intent for the talent-holding class, stated not silent. `verifySimulation.mjs` asserts the corrected shapes; pure threshold/class/rank rules are covered by `verifySimulation` (35 checks total), while full Pixi scene/effect choreography remains browser/integration coverage rather than headless unit coverage; rune transfer and shared-enchantment item-instance behavior remain roadmap work. **`natures_bounty` was found wrong outright, not merely simplified, and is now fixed**: fetched `HighGrass.java`'s `trample()` to confirm - the real talent has nothing to do with dew-drop odds at all (that was a fabricated stand-in with no textual or mechanical basis in the Java). It actually drops a depth-paced `Berry` food item, capped at `2+2*rank` total for the whole run via a never-reset `CounterBuff`; the schedule aims for a `targetFloor` and rolls `1/10` if the hero is already past it, `1/30` if exactly on it, `1/90` if still ahead of it. Reproduced as a new `natureBerriesDropped` run-persisted counter and the same three-tier chance in `trampleHighGrass`, dropping this port's shared generic `'food'` kind as the Berry stand-in (no distinct, weaker Berry item exists here - a real, narrower simplification, not the wrong-mechanic bug it replaces). **Also found while fixing this**: the fabricated version had silently swallowed the real, unrelated base `1/6` dew-drop chance real Java's `trample()` always rolls regardless of the talent (scaled instead by Sandals of Nature's `naturalismLevel`, an artifact this port doesn't model) - restored as its own unconditional roll, so removing the wrong talent logic doesn't also remove a real mechanic that was never talent-gated in Java to begin with. **2026-09-09 hero-progression audit, one more real bug fixed plus a batch of newly-documented substitutions and gaps** (`Talent.java`/`MeleeWeapon.java`/`MonkEnergy.java`/`Hero.java`, tag `v3.3.8`; `4.0.0-beta` for Cleric): **Aggressive Barrier bug fixed** - granted a flat `3` shield behind an invented rank-dependent threshold (0.4/0.6) instead of real `MeleeWeapon.useAbility()`'s `1 + 2*points` (3/5) behind a flat `HP/HT <= 0.5`; fixed, browser-verified (no shield above the threshold, exactly `+5` at rank 2 right at the 0.5 boundary). Real Java fires this on weapon-*ability* use specifically, which this port has no separate concept of from a class's own special action (`useSpecial` already stands in for every class's special the same way), so triggering it there remains this port's existing convention, not a new substitution. **Newly-documented invented substitutions** (each already gameplay-live, just previously uncommented - CLAUDE.md's dual-documentation rule): `secondary_charge` (Champion) grants ammo on kill in place of real `VARIED_CHARGE`'s partial wand-charge gain on ability use; `monastic_vigor` (Monk) grants a flat shield on Holy Tome heal in place of real `MONASTIC_VIGOR`'s threshold on the Monk's own separate energy resource (unmodeled); `twin_upgrades` (Champion) boosts armor-tier progression in place of real `TWIN_UPGRADES`'s dual-wielded-weapon tier equalization (no dual-wield system exists); `iron_will` (Warrior) grants a flat damage reduction below 50% HP in place of real `IRON_WILL`'s `BrokenSeal` shield-capacity boost (no seal item exists). **`swift_equip` (Duelist), correction, 2026-09-09 roadmap pass**: an earlier pass wrongly assumed the real talent reduces the general equip-time turn cost. Its actual spec, recovered from `src/generated/spdMessages.ts`'s real English text (absent from the Java tags that earlier pass checked), is a distinct, cooldown-gated quick-swap ability: rank 1 lets the Duelist instantly re-equip a *quickslotted* weapon once per 20-turn cooldown, rank 2 raises that to twice within a 5-turn window (same 20-turn cooldown) - ordinary inventory-panel equipping is unaffected either way. Still traced to the same practical conclusion for a different, now-correct reason: this port's `equipWeapon`/`equipArmor`/`equipRing`/`equipWand` never call `spendHeroTurn` at all - every hero, every class, already equips instantly with no cooldown of any kind - so the real cooldown-gated ability has no "slow" baseline left to be an exception to, and genuinely cannot be modeled distinctly without first giving ordinary equipping a real cost/cooldown. The log line remains an honest flavour-only stand-in. `thiefs_intuition` (Rogue) rank 1 does nothing - real rank 1's `setKnown()` effect (ring type known, level/curse still hidden) has no equivalent in this port's binary `identified` ring model, only rank 2's full-identify is reproduced; `bounty_hunter` (Assassin) substitutes flat gold-on-any-kill for real `BOUNTY_HUNTER`'s item-drop-chance bonus scoped to kills via the `Preparation` ability (Assassin's real special - prepare, then attack for a prep-level bonus), a whole subsystem this port doesn't have at all, so not rebuilt. `shared_enchantment` (Sniper) and `durable_tips` (Warden) are genuinely unimplemented (zero call sites) - matches ROADMAP.md section 6's own unchecked line; their exact target formulas (33/67/100% enchant-share chance, 2x/3x/4x dart durability) are now recorded in `src/talents.ts`'s own comment for a future pass. **Cleric's entire T1/T2 talent tree is Mage's tree copy-pasted verbatim** (`src/talents.ts`) - confirmed against `4.0.0-beta`'s real, wholly distinct Cleric tree (Holy Lantern/light-spell mechanics this port has none of); Cleric is a real, playable, unlockable class here, and this gap had zero documentation anywhere before this pass - now commented in `src/talents.ts` and recorded here. Subclass-choice gating (locks in once at level 13, only the chosen subclass's 3 T3 talents) and armor-ability effects (`warding`/`arcane`, both real non-no-op effects) were checked and found correct; the exact real-Java correspondence for `warding`/`arcane` was not identified within this pass's budget. |
| `MAX_LEVEL = 30` | `SPD_LEVEL_CURVE.maxLevel` | Ported |
| `MissileWeapon`/`Talent.shared_enchantment` | `useSpecial` throw path, `heroOnHit` | Ported for the available generic missile path: thrown hits carry explicit ranged provenance and, for Sniper, invoke the equipped bow enchantment only when `Random.Int(3) < points` (33/67/100%). Tipped-dart payloads and Warden's `durable_tips` remain not ported because no `TippedDart` item exists. |
| `Talent.SUCKER_PUNCH` / `SuckerPunchTracker` | `attack` and `suckerPunchTargets` | Ported: the real `Random.IntRange(points, 2)` surprise bonus is now granted only once per stable enemy id, with tracker state saved and removed when that enemy dies. |

## Quests and NPCs (`actors/mobs/npcs/*.java`; `mwg/rpg`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `Ghost.Quest.spawn()`: `Random.Int(5-depth)==0`, depth 2-4, `type = depth-1` | `maybeSpawnGhost` | Ported - all three types at the real odds |
| `Ghost`'s undamageable/unkillable state (`defenseSkill()` returns `INFINITE_EVASION`, `damage()` does nothing) | `MONSTERS.ghost` (very high HP/evasion instead of a real unkillable flag), `Creature.isNPC` routing bump-into to dialogue instead of `attack` | Simplified |
| `Ghost.interact()`'s three-state dialogue (offer / reminder / turn-in) | `interactWithGhost` | Ported (structure), using `Rpg.QuestLog`'s real `status`/`currentStage`/`advance` rather than the raw `given`/`processed` booleans Java uses |
| `FetidRat`/`GnollTrickster`/`GreatCrab` stats + `die()` calling `Ghost.Quest.process()` | `MONSTERS.*`, `kill`'s `ghostTargetSlain` branch | Ported (via `mwg/rpg`'s real quest-stage machinery, not a bespoke scene-local flag) |
| `Ghost.Quest`'s reward: a randomly generated weapon and armor set (tier 2-5, occasionally enchanted) | `interactWithGhost`'s turn-in + `generator.ts`'s `ghostQuestReward()` + inventory equipment actions | **Now genuinely ported, not just simplified.** Fetched `Ghost.java`'s `Quest.spawn()` to confirm the exact formula - it does NOT reuse the generic depth-scaled `randomWeapon()`/`randomArmor()` this port's turn-in previously called (those are `Generator.randomWeapon(floorSet)`/`randomArmor(floorSet)`, keyed on `Dungeon.depth/5` via `FLOOR_SET_TIER_PROBS`). Real Java's quest reward has its own, depth-independent formula: a fixed `Random.chances({0,0,10,6,3,1})` roll for armor tier (2-5 at 50/30/15/5%) directly instantiating the concrete class (`LeatherArmor`/`MailArmor`/`ScaleArmor`/`PlateArmor` - no `.random()` call on armor at all, so it draws no further RNG of its own); an *independent* identical `chances()` roll for weapon tier, followed by a real `Generator.random(Generator.wepTiers[tier-1])` for the weapon's class pick (whose own level/cursed/enchant outcome is then explicitly discarded - `weapon.level(0); weapon.enchant(null); weapon.cursed=false` - but the RNG draws it consumed still happened and must still be burned, the same "burn the roll, drop the unreproducible content" convention this whole module already follows elsewhere); a single shared `itemLevelRoll` (50/30/15/5% for +0/+1/+2/+3) applied to *both* items; and a single shared 20% chance (`enchantRoll <= 0.2`, gating a real enchant AND a real glyph that are - per Java's own comment - always rolled first regardless "so the outcome doesn't affect the number of RNG rolls," then kept or discarded together). Neither item is ever cursed. `ghostQuestReward()` reproduces this exact sequence and feeds its result through the existing `generatedInventoryItem`/`rollGeneratedAffix` pipeline unchanged. **Found and fixed a second, much larger bug in the same pass, auditing `generatedInventoryItem`'s category dispatch while wiring this up**: `generated.cat === Cat.WEAPON` (and `=== Cat.MISSILE`) never actually matches anything a real generated weapon or missile carries - `randomWeapon()`/`randomMissile()`/`randomCategory(Cat.WEAPON)` all resolve internally to one of the `WEP_T1..T5`/`MIS_T1..T5` sub-tier `Cat` values (confirmed in `generator.ts`'s own `Cat` enum: `WEAPON=0, WEP_T1..WEP_T5=1..5`, all distinct from each other), so this equality check has *never* matched for any procedurally-generated weapon or missile since this function was written - not just Ghost's reward, but every ordinary floor-loot weapon (the `generatorRandom()` site used for regular chest/heap spawns) and every statue-drop weapon too. Every one of them silently fell through to the `'food'` default id, with no enchant ever rolled (the adjoining `affix` check had the identical bug). The sibling function `generatedGroundKind`, a few lines away in the same file, already used the correct range check (`item.cat <= Cat.WEP_T5`) - this was a narrow, isolated miss in one function, not a systemic design gap, and is now fixed to the same range shape. **Browser-verified live**: before the fix, a Ghost-quest turn-in produced `{id:'food', sourceClass:'RunicBlade'}` for the weapon slot; after, the same flow produced real `{id:'weaponReward', sourceClass:'Sickle', level:2}`/`{id:'armorReward', sourceClass:'ScaleArmor', level:2}` items. A 20000-sample Node-side statistical check of `ghostQuestReward()` alone (bundled via esbuild, run standalone, not part of the committed test suite - a throwaway `tools/scratch/` script) gave tier fractions `0.498/0.299/0.154/0.049`, level fractions `0.500/0.300/0.148/0.052`, and an enchant fraction of `0.197`, all matching Java's `50/30/15/5%`/`20%` within sampling noise, with the weapon and armor level/enchant outcomes matching each other on every one of the 20000 samples (confirming the "shared roll" semantics) and zero cursed outcomes across all of them. **Follow-up scope check, same session**: sampled `generatorRandom()` (the ordinary floor-loot/chest site) and `mimicGeneratePrize()` 2000 times each, plus `randomWeapon()`/`randomMissile()` 500 times each directly - confirmed every single draw that landed in a weapon or missile tier resolves through the fixed range check correctly (never the bare `Cat.WEAPON`/`Cat.MISSILE` enum value, always a `WEP_Tn`/`MIS_Tn` sub-tier), so the fix's benefit is universal across every caller of `generatedInventoryItem`, not narrowly scoped to Ghost's own reward. |
| `Wandmaker.Quest` spawn odds (`depth > 6 && Random.Int(10-depth)==0`) and offer/fetch/turn-in shape | `maybeSpawnWandmaker`, `WANDMAKER_QUEST`, `interactWithWandmaker`, `wandmakerQuestType` | Odds, shape, and two of the three site quests are real: the run's quest type (corpse dust / embers / rotberry) is decided by levelgen, surfaced live, and persisted across save/load; MassGrave's dust heap spawns as a real cursed pickup (it used to vanish) and Rotberry seeds already drop from grass, so types 1 and 3 turn in their real fetch with the real intro/reminder lines for the existing wand reward. **Type 2 (elemental embers) is now real too, checked against tag `v3.3.8` (`Wandmaker.java`, `RitualSiteRoom.java`, `CeremonialCandle.java`, `Elemental.java`)**: the four queued candles spawn as real pickups (previously vanishing on the null `portItemKind` branch, the same bug class as bombs/dust); a Place action sets them into the ritual center's 4 cardinal slots from the bag (no aimed throw/drop UI exists - the stated shape change, same family as the combat stones' auto-target); all four lit fires the real ritual (placements burned, a `NewbornFireElemental` rises HUNTING at the center or a free neighbour, with the real `3-5` opening cooldown); the newborn fights with the real kit (HP 60, acc 15, eva 12, `[10,12]` melee with no fiery on-hit, telegraphed 3x3 fireball - charge line, then `Fire` 8/cell, 2 over water, plus `Burning.reignite` - on a re-rolled `3-5` cooldown) and always drops its `Embers` where it dies; the NPC takes the real `intro_ember`/`reminder_ember` lines and consumes the embers for the existing wand reward. Shared elemental rules closed in the same pass: `FIERY` burning-immunity (both kinds, at the fire/eternal-fire ignite sites) and Frost/Chill `harmfulBuffs` harm (`HT/2..HT*3/5` direct instead of the 4-damage daze stand-in - the ritual room's own dropped Frost potion is the implied counter). Ritual state (`ritualPos` + 4 slots) is captured from levelgen at the live bridge and persisted per floor, since the module-level paint state goes stale on revisits and mining-branch floors. Stated gaps: heap/pickup/throw intermediaries for candles (bag-direct instead); `TargetedCell`/zap visuals and the scaled charge cost (a log line + plain turn); cooldown ticks on ranged turns only; no quest-music swap or quest-score accounting; no `RitualMarker` custom tile (visual only); regular fire elementals keep their zap-only stand-in (no subtype split - see the `MOB_LOOT` row's "found, not fixed" note); the dust wraith-curse still needs a Wraith mob. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| `Shopkeeper` + `Gold` (keeping, `sellPrice`, buyback) | `maybeSpawnShopkeeper`, `interactWithShopkeeper`, `shopBuy`/`shopSellFood` via real `Actors.buy`/`sell`, `shopPricing.ts` | Partially ported - keepers now spawn on Java's real 6/11/16/21 depths (rooms still random-stand-ins, not `ShopRoom` geometry), each with its own shelf stock and persisted `buybackItems` shelf (cap 3, rebuy at flat `value()` with the real reluctance line, newest sale first on the G key - choosing among 3 needs the picker UI Transmutation is also waiting on); prices are the exact `sellPrice()` formula with the depth bracket (see the pricing row) and selling pays flat `value()` (meat correctly 5, food 10 - the old fold-everything-to-food pricing is gone); the sell side stays food-only for the same picker reason. **Found and closed in the same pass: every generated FOR_SALE heap spawned as free loot** (`placeItems()` stock on ported shop floors ignored its own note) - stands are now priced with the real `for_sale` line and cannot be picked up free; stepping onto a priced stand now completes the purchase directly, deducts the exact total price, clears the sale flag, and transfers the item to the bag. **Shop stock identity is now preserved for the six non-Generator goods that were previously dropped silently**: Ankh, Stylus, Honeypot, Alchemize, shop bags, and SandBag each gets its Java item id, message key, sprite frame, and exact base value (Ankh 50, Stylus/Honeypot 30, Alchemize 2.5 per unit - `20/8`, corrected from a wrong 5 in the 2026-09-11 Alchemize pass - bag 30, SandBag 30). Their specialized action windows/semantics remain separate roadmap work; they are now visible, priced, and collectible rather than disappearing at the bridge. This is a deliberate UI simplification of Java's `WndTradeItem` (no browse/details window); unpriced or not-yet-real stock remains unavailable. **Noticed while auditing for wiring gaps like the enchant/curse one above, now source-checked, confirmed dead, and removed**: `shopPricing.ts` used to export `getIdentifyCost()`/`getHealingCost()` (flat 30 gold / 50 gold-per-HP, the latter's own comment claiming "Wandmaker's well healing") that were never called anywhere in the codebase. Checked the real `actors/mobs/npcs/` directory (`Blacksmith`, `Ghost`, `Imp`, `ImpShopkeeper`, `Shopkeeper`, `Wandmaker`, etc.) in the local shattered-pixel-dungeon checkout: none of them offers a generic "pay gold to identify an item" or "pay gold to heal" service, and `Wandmaker.java` itself contains no gold or healing logic at all - the referenced mechanic doesn't exist in real SPD. Confirmed speculative scaffolding with no Java feature to restore, unlike `rollAffix`'s real missing-wiring gap; deleted rather than left as unreachable exports. **`Shopkeeper.processHarm()`/`flee()` is now ported too, found missing entirely (Section 4 audit)**: every NPC in this port is flatly immune to environmental damage (fire/gas never touch `isNPC` creatures at all) except real Java's Shopkeeper, who warns once if caught in harm's way and flees for good - closing the shop - on the next hit. Wired into `spreadFire` only (the far more common accidental-harm path in real play); Java's other harmful-buff triggers (gas, any negative buff generally) and its per-heap shop-stock item removal on flee (this port's shop is a shared bag, not floor heaps, so there's no equivalent partial-stock-loss to reproduce) are not modeled - a narrower, honestly-flagged gap, not a full match. New `port.log.shopkeeperwarn`/`port.log.shopkeeperflee` EN/FR keys. |
| Troll Blacksmith quest currency (`DarkGold`) | `placeGroundItems` on Caves depths 12-14 + `interactWithBlacksmith` | Simplified - collectible Caves drops replace mining wall veins, keeping the quest completable |
| `RatKingRoom.paint()` (gold CHEST perimeter + king placement) and `RatKing.interact()` (wake yell, crown exchange) | `rooms/sewerBoss/ratKingRoom.ts`, `MONSTERS.ratKing` + `ratking.png`, `interactWithRatKing` | Ported, checked against tag `v3.3.8` (`RatKingRoom.java`, `RatKing.java`): the `IntRange(10,25)` gold draws now fill real CHEST heaps (same stream, same `chest,qty:` convention), the king spawns at the real `random(2)` cell as a sleeping NPC with his own art, wakes with the real `not_sleeping` yell, and answers awake bumps with the real `what_is_it`. The crown exchange stays blocked - no King's Crown item and no Ratmogrify armor ability exist yet. Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| Every other region's NPC and quest (Caves/City/Halls NPCs) | - | Not ported - City/Halls combat roster is present, but their remaining NPC quest content is not |

## Bestiary and dungeon structure

The live roster path uses MWG's `Roguelike.rollRoster` primitive for the Java
add-rare -> swap-regular -> shuffle sequence, so the framework owns the ordering
and exposes a traceable content-roll boundary for future parity fixtures.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Bestiary.getMobRotation`, `case 1`-`case 4` (Sewers) | `mobRosterForDepth` | Ported |
| `Bestiary.getMobRotation`, `case 6`-`case 9`/`default` (Prison) | `mobRosterForDepth` | Ported |
| `Bestiary.getMobRotation`, cases 11-15 (Caves: Bat/Brute/Shaman/Spinner/DM200 mix) | `mobRosterForDepth` | Ported |
| `Bestiary` cases 16+ (City/Halls) and rare/alternative spawns (Albino, Caustic, Bandit, Spectral, Senior, Acidic...) | `mobRosterForDepth`, `main.ts:populate`, `monsters.ts` | City/Halls standard rosters are present. The four 2.5% regional rare additions (Thief depth 4, Bat 9, Ghoul 14, Succubus 19) and Java's eight 1-in-50 per-entry alternative swaps now roll in the correct add-rare -> swap -> shuffle order. Variants have distinct ids, stats, loot identities, localized names, base-art fallback, and live combat hooks where the current buff model supports them; dedicated variant sprites and a few Java-only effects remain visual/system follow-up. |
| `Dungeon.java`'s depth `switch`: `case 1-4: SewerLevel`, `case 5: SewerBossLevel`, `case 6-9: PrisonLevel`, `case 10: PrisonBossLevel`, `case 11-14: CavesLevel`, `case 15: CavesBossLevel` | `regionForDepth`, `BOSSES` | Ported |
| `Dungeon.java`'s depth `switch`, `case 16` onward (`CityLevel` through `LastLevel`) | `regionForDepth`, `BOSSES`, `enterLevel`, `spdLevelGen/` | Ported floor routing for City/Halls regular depths 16-19 and 21-24, fixed boss-floor layouts at depths 20/25, and the depth-26 vault layout. Boss phase scripts and some boss-specific terrain/visual behavior remain simplified |
| `Dungeon.saveGame` run persistence | `saveRun`/`loadRun` via `mwg/core` `SaveSystem` | Simplified - stats/bag/quests/switches and visited-floor runtime state persist as JSON. Terrain mutations, door/secret/trap state, fire, ground items and non-hero creature state survive re-entry and reload; FOV exploration, exact scheduler tie order, and Java's full bundle graph remain outside the port. |
| `RegularLevel`'s actual room/corridor generation algorithm, room types (vaults, special rooms), `Painter` classes | `src/spdLevelGen/{room,builder,regularBuilder,loopBuilder,figureEightBuilder,connectionRoom,regularLevel,regularPainter,sewerPainter,prisonPainter}.ts`, wired into the live game via `src/spdLevelGen/gameBridge.ts` (`portedFloor`/`toGameTerrain`/`isPortedDepth`, called from `main.ts`'s `enterLevel`) | **Wired into `main.ts` and live in real gameplay**, superseding the "not yet wired" status this row used to carry. Sewers depths 1-4, Prison depths 6-9, Caves depths 11-14, City depths 16-19, and Halls depths 21-24 all come from `spdLevelGen/` now; every other depth still falls back to the generic `generateSpdDungeon`. `gameBridge.ts` translates a verified `PaintLevel` into what `main.ts` renders/plays: real terrain, rooms, entrance/exit, doors (incl. locked/crystal), traps (routed to the nearest of `main.ts`'s five trap behaviours, see `TRAP_BEHAVIOUR`), and room-drop ground items, with the ported floor's own water/grass/doors/traps used verbatim rather than re-run through the generic terrain passes that would overwrite them (`adoptPortedFeatures`). Real items and monsters now populate a ported floor too - `src/spdItems/generator.ts` (682 lines) is the item-generator-equivalent this row used to list as missing, and `src/spdItems/shopItems.ts` backs a working `ShopRoom` (a real shopkeeper NPC with real dialogue and prices, confirmed in a live browser session on depth 6). Floors are cached per run (`gameBridge.ts`'s `RunCache`) so revisiting a ported depth returns the same terrain rather than regenerating it - a real behaviour change from the generic generator, and still not full persistence (mobs/items/door state still rebuild on re-entry, see the row below). Verified two ways: `tools/verifyLevelGraph.ts`/`verifyLevelPaint.ts` against the Java RNG trace (unchanged from before), and now also a live browser session driving the actual game to both a Sewers and a Prison ported depth and screenshotting the result. Real remaining gaps, unchanged from before wiring: depths 1-2's paint is not deterministic across repeated generation for a real, source-confirmed reason (guidebook cascade, see `entranceRoom.ts`); the outer retry loop is capped at 200 attempts (Java's is uncapped); most feeling-gated branches beyond `LARGE` still always take their "no feeling" path even when the roll picked one (documented per-branch in `regularPainter.ts`); `SecretMazeRoom`'s cursed/blocked retry can't fully reproduce Java's Generator-internal call count. Every region's boss levels remain out of scope and still use the generic generator |
| Sewers' (`SewerLevel`) depth-1..4 reachable `StandardRoom` set, per `StandardRoom.chances[1..4]`'s nonzero weights - the 14 classes (`EmptyRoom`, `SewerPipeRoom`, `RingRoom`, `CircleBasinRoom`, `PlantsRoom`, `AquariumRoom`, `PlatformRoom`, `BurnedRoom`, `FissureRoom`, `GrassyGraveRoom`, `StripedRoom`, `StudyRoom`, `SuspiciousChestRoom`, `MinefieldRoom`) plus always-present `EntranceRoom`/`ExitRoom` | `src/spdLevelGen/rooms/standard/{emptyRoom,sewerPipeRoom,ringRoom,circleBasinRoom,plantsRoom,aquariumRoom,platformRoom,burnedRoom,fissureRoom,grassyGraveRoom,stripedRoom,studyRoom,suspiciousChestRoom,minefieldRoom,entranceRoom,exitRoom}.ts`, `patchRoom.ts`, dispatched via `registry.ts` | **Sub-pass 2 done: all 14 `paint()` methods ported**, real class selection now wired into `regularLevel.ts`'s `Random.chances()` roll. `SuspiciousChestRoom` preserves its queued-prize/Gold roll, mimic gate, generated bonus reward, live spawn, and death drop; `GrassyGraveRoom` preserves each Java Generator/Gold result class id in its tomb heap; `AquariumRoom` preserves the per-fish `Piranha.random()` roll and now spawns live depth-scaled, water-bound piranhas with meat loot (base `Piranha` stats confirmed exact: `HP=HT=10+depth*5`, `defenseSkill=10+depth*2` - matches this port's `MONSTERS.piranha` formula precisely; **found, not fixed, correctly scoped as bigger**: `Piranha.random()`'s own real `1/50` chance for the exotic `PhantomPiranha` variant - halved incoming damage plus a teleport-away proc unless the hit is adjacent/melee, `PhantomMeat` loot - is not modeled, since this port has no exotic/RatSkull-tier alternate-monster family at all, a step further than the already-ported regional `Bestiary.swapMobAlts()` 1-in-50 swaps); standard-room Generator categories now route to playable ground-item families. Verified via `tools/verifyLevelPaint.ts`: all 16 (seed x depth 1-4) combinations paint without error and are deterministic across repeated runs. Remaining room-local RNG gaps are Generator-internal concrete class identity and `SewerPipeRoom`'s minor door-center rounding draws. |
| `RegularPainter.paint()`'s full pipeline (`paintDoors`: hidden-door rolls + room merging; `paintWater`/`paintGrass`/`paintTraps`) and `SewerPainter.decorate()` | `src/spdLevelGen/regularPainter.ts`, `sewerPainter.ts` | **Sub-pass 3 done.** `layoutAndCreateLevel` (bounds/shift/`setSize` prologue), the shuffle+placeDoors+paint driver, `paintDoors` (hidden-door chance, `Graph.buildDistanceMap` reachability re-check via a BFS over `Room.edges()`), room merging (`mergeRooms`/`canMerge`/`merge` - confirmed by reading every override in the codebase that no `Random.*` call exists anywhere in this path, so unlike everything else here its control flow doesn't need call-order fidelity, only matching tiles), `paintWater`/`paintGrass` (via a real per-floor-seeded `spdPatch.ts`), `paintTraps` (real `nTraps()`/`trapClasses()`/`trapChances()` weights per depth), and `SewerPainter.decorate()`'s three per-cell cosmetic rolls are all ported against the real Java source. Verified via `tools/verifyLevelPaint.ts` (ASCII dump with doors/water/grass/traps for 4 seeds x depths 1-4 - all paint without error). **Real, source-confirmed finding, not a porting bug**: depth-1 (while the intro guidebook page is unread) and depth-2 (while the searching page is unfound) Sewers generation is **not perfectly seed-deterministic in the real game itself**. `EntranceRoom.paint()`'s guidebook drop uses Java's own intentionally-unseeded generator for its position (see `entranceRoom.ts`), and `paintGrass()` skips its `Random.Float()` roll on any cell already holding a heap - so whether the guidebook lands on a grass-candidate cell changes the *seeded* stream's call count for the rest of that floor (grass pattern, traps, decorate all shift). Confirmed directly against this port: depths 3-4 are deterministic run-to-run, depth 1 (fresh-save default: `guideIntroRead: false`) is not. Byte-exact Phase 2 comparison against Java fixtures should target depths 3-4 first, or depth 1/2 with the guide-read flags forced true, to avoid chasing a mismatch that both implementations would independently produce. **Correction after running the actual Phase 2 Java-fixture comparison** (see the dedicated section below): this nondeterminism is real, but it was *not* the dominant source of the large depth-1/2 divergence observed before that comparison - three real ordering/arithmetic bugs upstream (in `spdRng.ts`/`regularLevel.ts`) were. Don't assume every depth-1/2 mismatch is this guidebook effect; verify against depths 3-4 first, which isolate it out. **Documented simplifications**: `paintTraps` doesn't model `avoidsHallways` (no trap-class behavior exists yet, so `validNonHallways` is computed but unused - every placement draws from `validCells`); `canPlaceWater`/`canPlaceGrass` overrides for `BurnedRoom` are approximated as "false everywhere in the room" rather than patch-shaped (its patch array isn't threaded out of `burnedRoom.ts` this pass); the `EntranceRoom`/`ExitRoom` depth-1/2 "hide the entrance door during tutorial" special case is skipped (`SPDSettings.intro()`/`Document` save-state isn't modeled) |
| `SpecialRoom`'s run-level selection queue (`EQUIP_SPECIALS`/`CONSUMABLE_SPECIALS`/`CRYSTAL_KEY_SPECIALS`/`POTION_SPAWN_ROOMS`, `initForRun`/`initForFloor`/`useType`/`createRoom`) and all 21 reachable subclasses (9 equip + 10 consumable + `LaboratoryRoom` + `PitRoom`; `ShopRoom` is instantiated directly by `RegularLevel`, not through this queue, and `MassGraveRoom`/`RotGardenRoom`/`DemonSpawnerRoom` spawn via NPC quest logic elsewhere. Updated by the Prison pass: `MassGraveRoom`/`RotGardenRoom` ARE now ported - `Wandmaker.Quest.spawnRoom()` appends one directly, so they share the `'special'` paint dispatch without ever coming out of this queue. `ShopRoom`/`DemonSpawnerRoom` remain out of scope) | `src/spdLevelGen/rooms/special/{registry,weakFloorRoom,cryptRoom,poolRoom,armoryRoom,sentryRoom,statueRoom,crystalVaultRoom,crystalChoiceRoom,sacrificeRoom,runestoneRoom,gardenRoom,libraryRoom,storageRoom,treasuryRoom,magicWellRoom,toxicGasRoom,magicalFireRoom,trapsRoom,crystalPathRoom,laboratoryRoom,pitRoom}.ts`, dispatched via `rooms/standard/registry.ts` | **Sub-pass 4 done: selection queue + all 21 `paint()` methods ported**, real class selection wired into `regularLevel.ts`'s `initRooms()` (previously a stubbed `Random.chances({6,3,1})` with a discarded result). Unlike `StandardRoom`'s depth-keyed table, reachability here is run-order based, not depth-gated - every one of the 19 EQUIP+CONSUMABLE classes can appear at any depth depending on the run's shuffle, so all 21 are in scope for Sewers regardless of depth. Every room's geometry, local content rolls (category picks, position retries against real terrain/heap/mob-occupancy state, side-of-door/parity coin-flips) are ported RNG-call-for-call. **Documented, deliberate gap**: `SpecialRoom.initForRun()`'s two `Random.shuffle()` calls are implemented (`resetSpecialRoomRunState()`) but NOT auto-invoked - real Java calls `initForRun()` once at `Dungeon.newGame()`, off whatever generator is current at that moment, a point in the run's RNG stream this port's per-depth `generateLevel()`-style entry points don't model yet. Callers must call it explicitly (both verify scripts do, seeding a generator from the run seed around the call for their own reproducibility - this is a script-level convenience, not a claim about what Java's real `Dungeon.newGame()` moment uses). `SentryRoom`/`CrystalChoiceRoom`/`CrystalPathRoom`'s `canConnect()` override (refusing a door exactly on the room's parity-even center point) is NOT threaded into the graph stage (`room.ts`/`builder.ts`) - a narrow, real divergence, most likely to matter only when a room happens to be offered that exact door position. **Almost every class has at least one documented Generator/mob-subsystem-internal skip** (this port has no `Generator`/`Piranha`/`Statue`/`Mimic`/item-upgrade-and-curse system): each file's header comment states exactly which rolls are real vs. skipped, following the same "preserve local/leading rolls, skip the opaque Generator-internal remainder with ZERO substitute Random calls" convention established in sub-pass 2. `TrapsRoom`'s `levelTraps[depth/5]` indexed only the Sewers 3-element array while this port stopped at depth 4; Prison (depths 7-9) now exercises index 1 as well. `ToxicGasRoom`'s "furthest gold position" pick uses `PaintLevel.trueDistance()`, which the Prison pass established is a FAITHFUL port, not an approximation: `Level.trueDistance()` (`Level.java:1397`) is plain Euclidean `sqrt(dx^2+dy^2)` over raw cell coordinates, with no pathfinding at all (`PathFinder.buildDistanceMap` is the BFS, and `trueDistance` never calls it). The previous "Euclidean approximation of the real BFS-based" wording here was simply wrong - see the Prison section. Verified via the extended `tools/verifyLevelPaint.ts`/`verifyLevelGraph.ts`: all 16 combinations paint error-free with a real spread of special-room kinds selected (confirmed: garden, laboratory, weakFloor, pit, crypt, treasury, traps, armory, storage, sentry, runestone, statue, crystalPath, magicWell, pool, crystalVault, sacrifice all appeared across the 16-run sample), and the graph-stage determinism check passes once the run-state seeding fix above is applied |
| `SecretRoom.initForRun()`/`secretsForFloor()`/`createRoom()` (run-level budget/shuffle across all 5 regions, tracked in `regionSecretsThisRun`) and all 12 `ALL_SECRETS` subclasses (`RatKingRoom` excluded - not in `ALL_SECRETS`, placed by quest logic elsewhere, same reasoning as `SpecialRoom`'s exclusions) | `src/spdLevelGen/rooms/secret/{registry,gardenRoom,laboratoryRoom,libraryRoom,larderRoom,wellRoom,runestoneRoom,artilleryRoom,chestChasmRoom,hoardRoom,honeypotRoom,mazeRoom,summoningRoom,maze}.ts`, dispatched via `rooms/standard/registry.ts` | **Sub-pass 5 done: run-state + selection + all 12 `paint()` methods ported**, real `secretsForFloor()`/`createRoom()` wired into `regularLevel.ts`'s `initRooms()` (previously stubbed to always contribute 0 rooms). `secretsForFloor()`'s region indexing (`depth/5`) is ported exactly as Java computes it, including the real quirk that depth 5 (SewerBossLevel) already falls under region index 1 (Prison's slot) - never exercised by this port's depths-1-4 scope, but not "fixed" either, since that's what Java actually does. `createRoom()`'s unusual "min of 4 independent `Random.Int(size)` rolls, then rotate the pick to the end of the queue" selection is ported literally, not approximated. Like `SpecialRoom.initForRun()`, `resetSecretRoomRunState()` is implemented but NOT auto-invoked (same `Dungeon.newGame()`-moment gap - callers must call it explicitly; both verify scripts do). **Per-class fidelity**: `chestChasmRoom`/`artilleryRoom`/`larderRoom`/`hoardRoom` are fully RNG-faithful (no Generator dependency beyond a skipped chest/missile/gold-tier content roll that never changes call *count* it can't reproduce, since `Gold().random()` is the real, already-elsewhere-ported `IntRange(30+depth*10,60+depth*20)` formula - not Generator-internal at all). `gardenRoom`/`wellRoom`/`summoningRoom`/`honeypotRoom` are fully real except a single skipped Generator-internal content pick each (plant seeding; Honeypot is direct and its Bomb-vs-DoubleBomb roll plus concrete class are now preserved; WellWater class choice is actually real - a plain 2-element array, not Generator-dependent). `laboratoryRoom`/`libraryRoom` preserve their real position-retry loops and item-count rolls, but each item's own `Random.chances(HashMap<Class,Float>)` pick can't be reproduced (Java `HashMap` iteration order is JVM-hashcode-dependent) - the one `Random.Float(sum)` call `chances(HashMap)` always burns is still made, for RNG-order fidelity, same "burn the roll, drop the unreproducible content" convention as `SpecialRoom.createRoom()`'s min-of-4 selection. `mazeRoom` ports `Maze.generate()`'s full growing-tree algorithm and `PathFinder.buildDistanceMap`'s 8-directional BFS faithfully (`maze.ts`) - genuinely real, not approximated - but its prize roll is a real, documented RNG-order gap: Java's `do { Generator.randomWeapon/randomArmor } while (cursed || blocked)` retries an unknown number of times (Generator-internal), so this port makes only the leading `Random.Int(2)` weapon-vs-armor roll once, with no retry: depths where Java's loop would have spun more than once will desync here, unlike every other "burn one call" case in this port. Verified via the extended `tools/verifyLevelPaint.ts`/`verifyLevelGraph.ts`: all 16 combinations paint error-free, secret rooms appeared across the sample (garden, well, library, artillery, honeypot, maze, chestChasm confirmed; hoard/laboratory/larder/runestone/summoning not hit in this particular 16-run sample but exercised by the registry's dispatch table either way), and both scripts' determinism checks pass |
| `SewerLevel`/`PrisonLevel`/`CavesLevel`/`CityLevel`/`HallsLevel` hand-placed decorations and unique rooms | `src/spdLevelGen/rooms/**`, regional painters, `gameBridge.ts` | Ported for regular floors, including the regional unique-room painters, all six ConnectionRoom paint variants, Java room-placed NPC/special-mob positions (including Blacksmith and Aquarium Piranha placement, plus live Statue/ArmoredStatue actors), Caves ore-vein sparkle visuals, live crystal-room reward families/mimics with concrete source-class payloads, queued room keys and playable crystal-door unlocking, crystal-chest key consumption before reward pickup, crystal-mimic first-attack theft/death return, persistent fleeing, and unseen-distance-6 destruction, sign/well/empty-well examination, generated awareness/health well effects, persistent Icecap/Rotberry area blobs, sacrificial-fire diffusion and completion rewards, and Warden FrostImbue/AdrenalineSurge variants. Generated special-room drops now preserve their concrete Java class ids through the bridge, including MassGrave, CrystalVault, CrystalChoice/Path Artifact family payloads, SecretMaze, SecretArtillery, SecretLibrary, SecretLaboratory, SuspiciousChest, and Treasury mimic rewards. Boss arenas, exact remaining Generator-selected item classes outside carried statue rewards, and some room-local item/mob outcomes remain incomplete. |
| Persistence of per-floor state (mobs, heaps, traps) across visits | `SewersScene.floorStates`, captured before transitions and serialized in `SaveShape` | Ported for the port's model - mutable terrain, doors/secrets, traps, fire, ground items and non-hero creature state are restored when revisiting or loading. Simplified: one item per cell remains the heap model, fog exploration is recalculated, and exact Java actor-bundle/scheduler ordering is not serialized. |
| Wiring the ported generator into the live game (`spdLevelGen/` -> `main.ts`) | `src/spdLevelGen/gameBridge.ts`, `main.ts`'s `enterLevel`/`adoptPortedFeatures` | **Done for Sewers 1-4, Prison 6-9, Caves 11-14, City 16-19 and Halls 21-24** (updated as each region's own section below was ported); every boss-level depth still uses the generic `generateSpdDungeon`. See the dedicated section below for the terrain mapping and its losses |

## Phase 2: Java-fixture verification (real bugs found and fixed)

A throwaway Java harness (`core/src/main/java/.../levels/LevelGenHarness.java` +
`desktop/src/main/java/.../desktop/LevelGenHarnessLauncher.java` - both scratch/debug-only,
**not part of the real game**, boot a minimal invisible LWJGL3 window purely so the real game's
texture-loading static initializers succeed headlessly) produces real Java reference dumps
(room graph, doors, tile ASCII map, traps) for the same 4 seeds x depths 1-4 the TS verify
scripts use. Comparing TS output against these fixtures found and fixed three real bugs,
corrections to earlier sub-passes' work rather than new scope:

1. **`SpdJavaRandom.nextLong()` sign-handling bug** (`spdRng.ts`) - combined the two `next(32)`
   draws as unsigned bitwise-OR; Java's real `((long)(next(32))<<32) + next(32)` does *signed*
   32-bit arithmetic, which differs by exactly `2^32` whenever the second (low) draw's top bit is
   set. This desynced `spdSeedForDepth()`'s derived per-floor seed for roughly half of all
   (seed, depth) pairs - confirmed by comparing `Dungeon.seedCurDepth()` against `spdSeedForDepth()`
   directly for depths 1-4 of seed 123456789 (off by exactly 2^32 on 3 of 4 depths before the fix,
   exact match on all 4 after). This is the highest-severity bug found: it corrupted the seed
   feeding *everything* downstream for an affected floor, not a narrow content roll.
2. **`buildRoomGraph()` called `pickBuilder()` after computing `standardRooms()`/
   `specialRooms()`'s counts**, backwards from `RegularLevel.build()`'s real order (`builder()`
   first, then `initRooms()`) - both burn `Random.*` calls, so this shifted the entire stream for
   every room-content roll that follows.
3. **`initRooms()` computed room counts before constructing `EntranceRoom`/`ExitRoom`** -
   both extend `StandardRoom` in Java and inherit its `{ setSizeCat(); }` *instance initializer*,
   which auto-rolls a `Random.chances()` sizeCat pick during construction, before any caller-side
   logic runs. Real Java constructs them as the first two lines of `initRooms()`, before
   `standardRooms()`'s count roll; an earlier version of this function took pre-computed counts as
   parameters, which meant the count roll(s) happened before entrance/exit's two implicit rolls.

**Combined effect confirmed via the harness**: for seed 123456789 depth 1 (deterministic, no
guidebook effect), after all three fixes the standard-room and special-room *selections*
matched Java exactly (`CircleBasinRoom`/`RingRoom`x2/`SewerPipeRoom` standards, `WeakFloorRoom`
special, `traps=2` both sides) - previously the port produced entirely different classes
(`EmptyRoom`/`toxicGas`/etc.) and trap counts. Depths 3-4's room *counts* now match exactly
(12=12, 15=15); depths 1-2 are off by exactly one room, a remaining real gap (see below) rather
than a leftover ordering bug.

**Sub-pass 6 (follow-up): `ConnectionRoom` subclass sizing + two more RegularLevel.initRooms()
bugs, found via re-diffing against the harness.** Three more real, source-confirmed fixes:

1. **`ConnectionRoom`'s 6 real subclasses weren't distinguished.** `RingTunnelRoom`/
   `RingBridgeRoom` override `minWidth()`/`minHeight()` to `Math.max(5, super.minWidth())` = 5
   (`RingTunnelRoom.java:34-41`); the other four (`TunnelRoom`/`BridgeRoom`/`PerimeterRoom`/
   `WalkwayRoom`) keep the base `ConnectionRoom` 3. `room.ts` collapsed all 6 into one generic
   3-10 shape, which let ring rooms squeeze into spaces too small for them in Java - changing how
   many placement retries/branch tunnels get consumed downstream. Fixed: `Room` now carries a
   `connectionKind` (`room.ts`'s `ConnectionRoomKind`/`CONNECTION_ROOM_META`), and
   `connectionRoom.ts`'s existing `Random.chances(ConnectionRoom.chances[depth])` roll (already
   real) now actually selects and tags the concrete subclass instead of discarding the result.
   `paint()` for all 6 is still not ported (cosmetic tunnel/bridge/chasm rendering only).
2. **`if (s instanceof PitRoom) specials++;`** (`RegularLevel.java:141`) - picking a `PitRoom`
   grows the special-room loop bound by one extra iteration. Missing from `regularLevel.ts`'s
   `initRooms()`; fixed by reassigning a local `specialsRemaining` counter instead of using the
   original fixed `specials` value as the loop bound.
3. **`if (feeling == Feeling.SECRETS) secrets++;`** (`RegularLevel.java:147`) - one additional
   secret room on a SECRETS-feeling floor. Missing from `secretsForFloor()`'s call site; fixed by
   threading a `feelingSecrets` flag (`feeling === 6`, alongside the existing `feelingLarge`
   check) into `initRooms()`.

**Re-verified against the harness after all three fixes**: of the 8 (seed x depth) combinations
at depths 3-4 (the deterministic ones - depths 1-2 still carry the documented guidebook-cascade
nondeterminism), **7 now match Java exactly** - identical room *count*, identical connector count,
and identical concrete `StandardRoom`/`SpecialRoom`/`SecretRoom` class selections (not just
counts): seed 123456789 depths 3 and 4, seed 1 depths 3 and 4, seed 42 depth 4, seed 999999999999
depths 3 and 4. This includes cases that previously mismatched on *which* class was picked (e.g.
seed 123456789 depth 3's special was `StorageRoom` in both, not `ToxicGasRoom` in TS as before -
the run-level `SpecialRoom`/`SecretRoom` queues are shared state carried across floors in
generation order, so earlier-floor fixes correct later-floor selections too) and the SECRETS-feeling
case that motivated fix 3 (seed 999999999999 depth 3, `SecretLaboratoryRoom` now present on both
sides, room count 14=14).

**Sub-pass 7 (follow-up): diagnosed, not fixed - `float` vs `double` precision drift in the
builder's angle/geometry math.** Seed 42 depth 3 (feeling `LARGE`) still has a one-room mismatch -
TS produces 19 rooms (8 connectors, `attempts=3`) against Java's 18 (7 connectors, `attempts=1`).
Standard/special-room counts and selections match exactly here too (only the connector count and
attempt count differ). Debug instrumentation (temporarily added to `loopBuilder.ts`/
`figureEightBuilder.ts`/`regularLevel.ts`, then removed - not left in the tree) pinpointed the
exact failure: TS's first `FigureEightBuilder.build()` attempt (this seed/depth picks
`FigureEightBuilder`) fails partway through placing the second loop's rooms
(`placeRoom` returns -1 at loop index 4 of 5), where Java's first attempt succeeds outright. Since
each floor's RNG stream is seeded independently and everything through room-graph setup and the
first loop's placement already matches Java exactly for this seed, the divergence has to be a
genuine *arithmetic* difference, not a further missing rule.

Line-by-line comparison of `Builder.java`/`LoopBuilder.java`/`FigureEightBuilder.java`/
`RegularBuilder.java` against their TS ports found no further logic gaps, but did find a
systemic type difference: Java declares `targetAngle()`'s parameter and return, `startAngle`,
`angleBetweenPoints()`/`angleBetweenRooms()`'s return, and the loop-index ratio
`i/(float)loop.size()` all as 32-bit `float` - every one of these narrows (or is computed in)
float32 precision in Java, including an explicit `(float)` cast in `targetAngle()`'s `return
360f * (float)(...)` line. This port's `builder.ts`/`loopBuilder.ts`/`figureEightBuilder.ts` keep
all of these as plain JS `number` (64-bit double) throughout - `Math.tan`/`Math.atan` themselves
already operate in double precision in both languages (Java's `Math.atan(double)` auto-widens a
float argument, so that part matches), but Java's explicit float-typed locals/return values
truncate precision *between* those calls in a way this port currently doesn't reproduce. Over many
chained room placements this can flip a `Math.round()` boundary by one pixel in a way that changes
whether a later `findFreeSpace`/`placeRoom` call collides or not - a plausible, if narrow,
explanation for why 7 of 8 tested combinations still match exactly (the drift didn't happen to
flip a rounding boundary for those) while this one seed/depth does not.

**Sub-pass 7b: the `float`/`double` audit was completed and applied, then A/B-tested against the
real Java harness - it does NOT explain this mismatch (nor the wider attempts-count divergence
below).** Every `float`-typed variable identified above now gets `Math.fround()` at its real Java
narrowing point: `SpdRandom.floatMax`/`floatRange`/`normalFloat`/`chances` (`spdRng.ts`, the root
RNG-arithmetic layer, so every caller benefits); `angleBetweenPoints`'s explicit `(float)` cast and
the `-180f` step; `placeRoom`'s `angle %= 360f` and its `targetCenter`/`Math.round(float)` block
(added `javaRoundFloat()`, since Java's `Math.round(float)` - `floor(a+0.5f)` at float precision -
is a distinct operation from the `Math.round(double)` used elsewhere in the same function);
`LoopBuilder`/`FigureEightBuilder`'s `setLoopShape`, `targetAngle` (including the float
`(1-curveIntensity)*percentAlong` sub-product before the double sum, then the whole-expression
float cast), the `i/(float)loop.size()` ratio, and the loop-center `PointF` accumulation.

**Empirically verified via direct A/B testing that this fix changes nothing for the currently
tested seeds**: reverting `builder.ts`/`loopBuilder.ts`/`figureEightBuilder.ts`/`spdRng.ts` back
to their pre-fix (plain-`double`) form and re-running `verifyLevelPaint.ts` produced byte-identical
`attempts`/`rooms` output to the fixed version, for all 16 (seed x depth) combinations - including
seed 42 depth 3, which still mismatches Java exactly the same way (19 rooms/8 connectors/3 attempts
vs Java's 18/7/1) with or without the fix. The float-precision theory from sub-pass 7 is therefore
**ruled out** as the cause, at least for this seed - not merely "not yet fixed." The `fround` calls
are kept anyway (still a genuine correctness improvement toward Java's real arithmetic, and may
matter for other seeds not in this small sample), but the actual root cause of seed 42 depth 3's
extra connector room remains open.

**A second, more concerning pattern surfaced by the same re-verification**: comparing `attempts`
(the outer `while (rooms == null)` retry count) between TS and Java across all 8 depth-3/4
combinations shows Java always succeeds in 1 attempt, while TS needs more than 1 in 5 of the 8
cases (123456789 d3/d4, 1 d4, 999999999999 d3) despite the *final* room composition still matching
exactly in all 5. This means TS's `builder.build()` is failing and retrying somewhere Java's
doesn't, even in cases where the eventual outcome happens to converge to the same room set - so a
"room composition matches" check (used for the "7 of 8 match" claim two sub-passes ago) is weaker
than it sounds: it does NOT establish that the actual room *positions*/tile layout match, since a
failed-then-retried attempt runs through a different, RNG-shifted code path than Java's first-try
success before landing on the same room list. **Not investigated further this pass** - flagged as
higher priority than the seed-42 connector count for closing this out, since it likely affects
more seeds than the one visibly-mismatching one. Traps/doors were not re-diffed cell-by-cell beyond
room-kind/count in this pass.

**Follow-up pass, correcting the "5 of 8" methodology**: the "attempts" comparison above (and the
verification script it came from) tested depths in isolation - e.g. running only depth 3 for a
seed without first running depths 1-2 for that same seed. This is invalid for any combo where
`SecretRoom.secretsForFloor(depth)` runs, since it mutates a **cumulative, run-level budget**
(`regionSecretsThisRun[region]`, consumed depth-by-depth in strict ascending order - see
`SecretRoom.java:66-88`) - skipping earlier depths starves or inflates the budget available at the
tested depth, changing how many secret rooms (and therefore how much of everything downstream)
get requested, independent of any real porting bug. Re-running with depths 1-4 genuinely visited
in order per seed (matching `tools/verifyLevelGraph.ts`'s existing loop shape, and the Java
harness's own sequential-depth loop) changes the picture substantially:
- **`seed=1 depth=1` is now a confirmed, exact, room-for-room match against the real Java harness**
  (`connection:ringTunnel, connection:tunnel, entrance, exit, special:crystalPath, standard:empty,
  standard:empty, standard:ring` vs Java's `CrystalPathRoom, EmptyRoom, EmptyRoom, EntranceRoom,
  ExitRoom, RingRoom, RingTunnelRoom, TunnelRoom` - same 8 rooms, same kinds, `attempts=1` both
  sides) - this is the strongest evidence yet that the ported pipeline **can** produce true,
  position-consistent parity, not just coincidentally-matching composition after a desynced retry.
- **A real, still-open, narrower bug found**: `seed=123456789 depth=1` (also `attempts=1` on both
  sides, so not a retry-desync artifact) has TS producing one fewer `TunnelRoom`/`connection:tunnel`
  than Java, with every other room (types, standard/special counts, `WalkwayRoom`/`walkway`) exactly
  matching: Java's 13 rooms include 5 `TunnelRoom` + 1 `WalkwayRoom`; TS's 12 rooms include 4
  `connection:tunnel` + 1 `connection:walkway`. Since this is attempt 1 on both sides and everything
  else in the composition lines up, the divergence is narrowly scoped to one connector-count or
  connector-placement roll somewhere in `LoopBuilder`/`FigureEightBuilder`/`RegularBuilder`'s
  `createBranches` (most likely: a `pathTunnelChances`/`branchTunnelChances`
  `Random.chances()` roll, or a `placeRoom` retry-exhaustion, that resolves to a different tunnel
  count than Java for this specific seed/depth). Root cause **not yet found** despite a thorough
  line-by-line re-read of `Builder.java`/`RegularBuilder.java`/`LoopBuilder.java` against their TS
  ports (no further logic gaps spotted this pass beyond what's already documented above) - the
  remaining candidates are either a data-dependent edge case only reachable for specific room
  geometries, or something in `createBranches`'s failure/retry bookkeeping that only manifests after
  several chained placements. Next step: instrument both the TS builder and a modified
  `LevelGenHarness.java`+`Room`/`Builder` (temporarily, rebuilt via `gradlew :desktop:runHarness`)
  with matching per-`Random.chances()`-call tracing for this exact seed/depth, and diff the trace
  call-by-call rather than only the final composition - this pass ran out of budget to do that.
- The originally-reported "5 of 8" attempts-mismatch figures above are **not reliable as stated**
  (the underlying test had a methodology bug, not necessarily the port) and should be disregarded in
  favor of re-testing with sequential depth order before drawing conclusions about which
  seed/depth combos actually diverge.

**Sub-pass 8/9 (follow-up): three more real, source-confirmed bugs, found via call-by-call trace
diffing against the harness (temporary `BuilderTrace`/`trace()` logging added to both sides,
compared line-by-line for `seed=123456789 depth=1`'s single-room `connectingRooms` mismatch, then
removed - not left in the tree).**

1. **`CircleBasinRoom.resize(w,h)` override was missing.** Real Java ("cannot roll even numbers"):
   `super.resize(w,h); if (width()%2==0) right--; if (height()%2==0) bottom--;` - the generic
   `Room.resize()` in `room.ts` had no per-kind hook, so a `circleBasin` room could come out with
   an even width/height (14x14) where Java always forces it odd (13x13). Confirmed via the harness:
   this single off-by-one in the very first `CircleBasinRoom` placed in the loop cascaded into
   every room positioned after it for the rest of that seed/depth's graph. Fixed: `Room.resize()`
   now applies the odd-forcing whenever `kind==='standard' && standardKind==='circleBasin'`.
2. **`SewerPipeRoom.canConnect(Point)` override was missing** (`SewerPipeRoom.java`: `return
   super.canConnect(p) && ((p.x>left+1 && p.x<right-1) || (p.y>top+1 && p.y<bottom-1));` - refuses
   a door spot adjacent to a corner). `room.ts`'s `canConnectPoint()` already had this exact formula
   for `SecretWellRoom` but not `SewerPipeRoom` - generalized the existing branch to cover both
   kinds. Without it, a door position real Java correctly rejects (both rooms in a pair must
   independently reject every intersect point for `Room.canConnect(Room)`'s `foundPoint` search to
   fail) let TS's `connect()` succeed where Java's failed after exhausting all 10 `placeRoom`
   retries - and each of those extra failed Java retries burns real RNG that TS's early success
   skips, desyncing every subsequent roll for the rest of the floor. Confirmed via the harness:
   after this fix, the exact same `curr`/`next`/`angle` inputs at the previously-diverging call now
   produce the same `connect FAILED` outcome on both sides.
3. **`CrystalPathRoom`/`SentryRoom.canConnect(Point)`'s two `center()` calls were hoisted into
   one.** Real Java calls `center()` separately inside each of its two `if` guards (`if
   (width()%2==1 && p.x==center().x)`, `if (height()%2==1 && p.y==center().y)`), and `center()`
   itself unconditionally computes *both* x and y each call, rolling `Random.Int(2)` on whichever
   axis has odd `(right-left)`/`(bottom-top)` (i.e. even width/height) - independent of which
   component the caller reads. The first version here called `center()` once, hoisted above both
   guards, which is wrong on two counts: when both width and height are even, Java's guards are
   both false and `center()` is never invoked at all (0 rolls) where the hoisted version always
   burns 1-2; when exactly one axis is even, Java's still-taken guard's `center()` call burns a
   roll for the *unused* other axis that a smarter caller might not expect. Fixed by inlining two
   separate `this.center()` calls matching Java's exact call sites. Not yet confirmed against the
   harness with a `crystalPath`/`sentry` room actually present in one of the 4 standard test seeds'
   graphs (none happened to appear after the other two fixes), so this one is source-verified but
   not yet harness-verified - flag for whoever re-verifies with more seeds.

**Re-verified against the harness after all three fixes, all 4 seeds x depths 1-4 run in correct
sequential order**: room *counts* now match Java exactly for **all 16 combinations** (previously
several were off by one, e.g. 123456789 d1 was 12 vs Java's 13). `attempts` (the outer `build()`
retry count) still exceeds Java's constant 1 in several combos (123456789 d3/d4, 1 d4, 42 d1/d2/d3,
999999999999 d2/d3) even though final room *counts* now converge - meaning at least one more
RNG-order divergence remains somewhere in the graph-building path that these three fixes didn't
reach. Root cause not yet found for the remaining gap; the same call-by-call trace-diffing method
used to find the three bugs above (temporary logging on both TS and Java sides, targeted at one
specific still-diverging seed/depth, removed after) is the proven approach for whoever continues
this - static line-by-line source reading alone repeatedly failed to find these bugs across
multiple prior passes.

**Sub-pass 10: full RNG call-trace diffing. One combo now reproduces Java EXACTLY; four more
real bugs found and fixed; and the headline "attempts mismatch" turned out to be a measurement
artifact, not a port bug.**

Method (this is the one that works, and it is mechanical rather than inferential): a scratch
`GenTrace` helper on each side, with a single on/off switch, logging EVERY primitive draw as
`<seq> next(<bits>) = <value>`. On the Java side it hooks `java.util.Random.next(int)` via a
`TracingRandom` subclass injected from `Random.pushGenerator(long)` - every higher-level call
(`Int`/`Float`/`chances`, and `Collections.shuffle`'s direct `nextInt`, which bypasses
`Random.Int()`) funnels through `next()`, so nothing is missed. Phase markers
(`build:*`/`paint:*`) annotate the log. Two scratch comparers then (a) find the first diverging
draw and (b) report the first *phase* whose draw count/bit-widths differ, which names the exact
Java method to read. Each fix provably moves the divergence point later.

Two things the trace setup must get right, both learned the hard way here:
- **Filter nested generators.** `Generator.random()` does `Random.pushGenerator(cat.seed)` for
  deck categories, so those `chances` draws are NOT on the level-gen stream. Both sides track a
  `relDepth` push/pop counter and drop draws at depth > 1, or the diff compares unrelated streams.
- **Markers are asymmetric**, so diff DRAW LINES only and use markers purely as annotation.

**The "attempts" mismatch was a false alarm.** Every prior pass compared TS's inner
`while (rooms == null)` retry count against the harness's OUTER `while (!build())` count. Java's
outer loop is ~always 1 because `RegularLevel.build()` retries internally. Instrumenting Java's
*inner* loop shows it matches TS exactly on all 16 combos (1,1,2,2 / 1,1,1,2 / 4,3,3,1 / 1,2,5,1).
Disregard the "attempts exceeds Java's constant 1" wording above - it measured two different loops.

**The graph stage is byte-perfect.** Dumping sorted room rectangles from both sides shows all 16
combos have IDENTICAL room positions and sizes (and identical counts, feelings and level
dimensions). Every remaining difference is in the paint stage.

Four real bugs found and fixed, all confirmed against the harness:
1. **The 6 `ConnectionRoom` subclasses' `paint()` was never ported** (bare wall/floor fallback).
   `TunnelRoom.getDoorCenter()` makes **two `Random.Float()` draws every time a tunnel-family room
   is painted**, and tunnels are the most common room type on a floor - so this desynced the entire
   paint stage on essentially every floor. Now ported in `rooms/connection/paint.ts`
   (`TunnelRoom`/`BridgeRoom`/`PerimeterRoom`/`WalkwayRoom`/`RingTunnelRoom`/`RingBridgeRoom`) plus
   `rooms/connection/mazeConnection.ts` for `MazeConnectionRoom` (whose doors are set HIDDEN, not
   TUNNEL). `RingTunnelRoom.connSpace` is cached, matching Java's per-instance field, so its
   `getDoorCenter()` draws happen once, not twice. Note a faithfully-reproduced quirk: `doorCenter`
   sums raw integer door coords, so `doorCenter.x % 1` is always 0 and the rounding nudge can never
   fire - only the two draws are observable.
2. **`SewerPipeRoom.getDoorCenter()`'s same two `Random.Float()` draws were skipped.** Previously
   documented here as "only reachable at 3+ connections"; it is actually reachable at **>= 2**
   connections (`connected.size() <= 1` is the `center()` case), i.e. very often.
3. **`CrystalPathRoom` skipped four draws**: Java builds its four quadrants as real
   `new EmptyRoom()` instances, and `StandardRoom`'s `{ setSizeCat(); }` instance initializer burns
   one `Random.chances()` float **per construction**. The port built plain rect literals. The
   rolled size is unused - the draws are not.
4. **`new Gold().random()`'s quantity roll was skipped** in `CrystalPathRoom` and `TreasuryRoom`
   (in the latter it is evaluated in BOTH branches, being the `Mimic.spawnAt` argument - though
   AFTER the mimic gate's own `Random.Int(5)`, an ordering this pass initially got backwards and
   later fixed; see "Six more bugs" below). It is
   `Random.IntRange(30 + depth*10, 60 + depth*20)` - fully portable, no Generator deck. Also
   ported `PlantsRoom.randomSeed()` (`generatorSeeds.ts`): `Generator.randomUsingDefaults(SEED)`
   does NOT push a substream, so its `Random.chances(SEED.defaultProbs)` - retried while the roll
   is Firebloom, so a variable number of draws - lands squarely on the level-gen stream.

**Result: `seed=1 depth=1` now has an IDENTICAL RNG draw stream to real Java** (3379 draws,
byte-for-byte), the first time any combo has reached full stream parity. The other 15 combos'
first divergence moved substantially later (e.g. `1 d4` from draw 16842 to 19061). Room counts,
level dimensions, room rectangles, feelings and trap counts now match Java on all 16 combos - the
sole exception being `seed=42 depth=2`, where Java's `Feeling.TRAPS` paints 5x traps (15 vs 3),
which is the already-documented "Feeling not modeled" gap, not a new bug.

**What remains, honestly stated.** No map is yet byte-identical, and cell-diff counts remain
substantial on most floors (though `1:1` is down to 8 cells and `999999999999:1` to 50, from
200-300 before). Two distinct causes:
- **Item-`Generator` dependence (the large one).** The remaining first-divergence points are
  overwhelmingly inside rooms that drop generated items - `SentryRoom`, `StorageRoom`, `PoolRoom`,
  `LaboratoryRoom`, `SacrificeRoom`, `StatueRoom`, `MagicalFireRoom`, `TrapsRoom`, `ToxicGasRoom`,
  `SecretMazeRoom`. Critically, `Generator.randomWeapon`/`randomArmor` roll
  `Random.chances(floorSetTierProbs[floorSet])` **on the level stream** and then call `.random()`
  on the produced item (enchantment/curse rolls) also on the level stream. Closing these requires
  porting a real slice of the item system, not just a table. `randomUsingDefaults` categories (like
  SEED, done above) are the portable subset and can be picked off individually.
  **RESOLVED in sub-pass 12** (`src/spdItems/generator.ts`) - and it turned out not to need a real
  item system at all, only the categories, because an item's level-stream draw pattern is fixed by
  its `Category.superClass`.
- **Tile-level logic differences independent of the RNG.** `1:1` has an identical draw stream yet
  still differs in 8 cells (2 trap positions, 2 decoration cells), so at least one candidate-cell
  list is built in a different order than Java's. Separately, `123456789 d1` diverges in
  `paint:doors` with 11 hidden-door rolls against Java's 12, meaning one door is non-REGULAR in
  this port where Java's is REGULAR - most likely a `mergeRooms` outcome difference (merging
  `continue`s past the roll and is itself RNG-free). Both are worth chasing next: they are small,
  self-contained, and do not need the item system.

The trace scaffolding was fully removed afterwards: all four tracked Java game files
(`Random.java`, `RegularLevel.java`, `RegularPainter.java`, `CrystalPathRoom.java`) were restored
byte-exact via `git checkout` and verified with `git diff --exit-code`, and `GenTrace.java` /
`genTrace.ts` deleted. Only the untracked scratch harness remains. To re-instrument, re-add the
`TracingRandom` hook in `Random.pushGenerator(long)` plus push/pop counters - roughly 20 lines per
side. One useful diagnostic that did NOT survive cleanup, since it lives in a real game file: a
`innerAttempts++` counter in `RegularLevel.build()`'s `do` loop, which is what exposed the
attempts false alarm.

**Sub-pass 11: the first byte-identical map. Five more real bugs, four of them in the paint
pipeline's plumbing rather than in any individual room.**

Scope was the two divergences sub-pass 10 flagged as small and self-contained. Both are now
closed, and the headline result is that **`seed=1 depth=1` is a MAP EXACT MATCH against the real
Java output** - the first time any floor in this port has reproduced Java's tiles byte for byte.

The five bugs, all source-confirmed and each independently A/B-tested against the Java harness
(turning any one of them back off measurably worsens the diff):

1. **`Random.shuffle(rooms)` shuffled a COPY instead of the list itself.** This is the big one.
   `RegularPainter.paint()` does `Random.shuffle(rooms)` on its own `ArrayList`, in place, and then
   hands that SAME shuffled list to `paintDoors`, `paintWater`, `paintGrass`, `paintTraps` and
   `decorate`. This port shuffled `rooms.slice()`, painted in the shuffled order (so the paint loop
   looked right), then passed the ORIGINAL order downstream. Consequences: every candidate-cell
   list is accumulated room by room, so water/grass/trap candidates came out in a different order
   than Java's - and `paintDoors`, which is itself RNG-consuming, iterated rooms in the wrong order
   too. Fixed by shuffling in place exactly like Java.
2. **`mergeRooms()` used an inclusive height/width.** Java's `merge` local is a plain
   `com.watabou.utils.Rect`, whose `height()`/`width()` are `bottom - top`/`right - left` with **no
   +1** - unlike `Room`, which overrides both to `super.x()+1`. The port applied the `Room`-style
   inclusive form, so `merge.height() >= 3` became "expansion >= 2" instead of ">= 3" and this port
   merged room pairs Java rejects. Each spurious merge `continue`s past a door's hidden-door roll,
   which is exactly the "11 hidden-door rolls against Java's 12" symptom sub-pass 10 recorded.
3. **`paintTraps()` never consulted `Room.canPlaceTrap()` at all** - it treated every in-room
   `EMPTY` cell as trappable. The load-bearing override is `EntranceRoom.canPlaceTrap()`, which
   returns **false on depth 1**, putting the whole entrance room off-limits on floor 1. (Also
   honoured now: `PitRoom` and `SecretHoardRoom` always false, `BurnedRoom` false inside its patch.)
4. **`validNonHallways` was not ported at all** - every trap placement used `validCells`. Java
   builds a second list of cells that have a passable neighbour both vertically and horizontally
   (i.e. not in a 1-wide corridor) and routes any trap with `avoidsHallways` through it. On
   **depth 1 this applies to every single trap**, because floor 1's trap table is `WornDartTrap`
   alone and `WornDartTrap.avoidsHallways` is true. Required porting `Terrain.flags`' `PASSABLE`
   bit (`paintLevel.ts`'s `isPassableTerrain`, matching the real `Terrain.java` initializer -
   note `TRAP` is `AVOID`/not passable while `SECRET_TRAP` aliases `flags[EMPTY]` and is). The old
   comment here also named the wrong classes: the real `avoidsHallways` set is `DisintegrationTrap`,
   `FlashingTrap`, `GatewayTrap`, `GrimTrap`, `GrippingTrap`, `PoisonDartTrap`, `RockfallTrap`,
   `WornDartTrap` - `SummoningTrap`/`FlockTrap` are NOT in it.
5. **`paintDoors()`' entrance-room tutorial case was skipped as "unmodelled save state."** It is
   not an edge case: `SPDSettings.intro()` is `getBoolean(KEY_INTRO, true)`, so on a fresh install -
   precisely what the Java reference harness runs as - **every door touching the entrance room is
   HIDDEN on floor 1**. Leaving those cells as passable `DOOR` rather than solid `SECRET_DOOR`
   changed `paintTraps`' passable array, hence `validNonHallways`, hence trap positions, hence
   `SewerPainter.decorate()`'s per-`EMPTY`-cell rolls. Now driven off `entranceRoomContext`'s
   `guideIntroRead`/`guideSearchingFound` flags, which both default false, matching a fresh game.

Also fixed in passing: `PatchRoom.patch` is now stored on the `Room` instance (Java keeps it as a
field, still live when the painter later calls `canPlaceWater`/`canPlaceGrass`/`canPlaceTrap`), so
`BurnedRoom`'s three patch-shaped overrides are properly patch-shaped instead of the previous
"false everywhere in the room" approximation.

**Verified against the harness** (4 seeds x depths 1-4, sequential depth order):
- `seed=1 depth=1`: **MAP EXACT MATCH**.
- Hidden-door roll counts on depth 1, all four seeds: Java `12, 6, 16, 13` = TS `12, 6, 16, 13`
  (the first was 11 before fix 2).
- For `123456789 depth=1`, `validCells` (113 entries) and `validNonHallways` (90) are now
  byte-identical to Java's, including order and Java's intentional duplicate entries (a cell shared
  by two rooms is contributed twice, and `Random.element` picks by index, so the duplicates matter).

**Still open at the time, stated honestly.** `123456789 depth=1` still differed in 24 cells even
though its candidate lists and door-roll count matched Java exactly. Sub-pass 12 established why,
and it was not a port bug: **depth 1 is not reproducible in Java either**, because
`EntranceRoom.paint()`'s guidebook placement uses an unseeded generator and `paintGrass()` skips
its per-cell roll on heap cells. Two runs of the *unmodified* Java harness give different depth-1
output for the same seed. The `paintGrass`/heap interaction named here is real, but it is the
mechanism by which that non-determinism propagates, not a divergence to fix. Depths 2-4 were
indeed dominated by the item-`Generator` gap, which sub-pass 12 closed.

**Sub-pass 12: the item `Generator` slice - ALL Sewers floors now reproduce Java's tiles exactly
(depths 2-4 deterministically; depth 1 whenever Java's own unseeded guidebook roll agrees).**

Scope was the item-`Generator` dependence sub-pass 10 identified as "the large one", plus
whatever the trace diff then exposed. Result: **12 of 12 depth-2/3/4 floors are MAP EXACT
MATCHES against the real Java harness, on every run**, and all four depth-1 floors match too
whenever the two sides' independent unseeded guidebook rolls happen to coincide (observed 16/16,
15/16 and 14/16 across three runs, the variance being entirely depth-1 floors - see "depth 1 is
not reproducible in Java either", below).

### `src/spdItems/generator.ts` - a Generator that generates nothing

The new module is **not** an item system: it creates no usable items and nothing reads its
output. Its only job is to consume exactly the draws real `Generator` consumes *on the level
stream*. What makes it small is one property, verified by reading every `random()` override
(`Item`, `Weapon`, `Armor`, `Ring`, `Wand`, `Artifact`, `Gold` are the only ones that exist):
**the number and kind of level-stream draws an item's `.random()` makes depends only on its
`Category.superClass`, never on the concrete class.** So the category - which the level stream
itself tells us - is enough; the concrete class never has to be right for the stream to be.

The load-bearing distinctions, all confirmed against `Generator.java`:
- `random(Category)`'s **class pick** for a deck category runs inside
  `Random.pushGenerator(cat.seed)`, i.e. on a substream that is invisible to the level stream.
  (We reproduce it anyway - `fullReset()` gives us the real `cat.seed` - so the classes are
  faithful too, but no layout depends on that.)
- the `.random()` on the produced item runs *after* `popGenerator()`, so it IS on the level
  stream. This is where most of the draw volume lives.
- `randomUsingDefaults(Category)` pushes **no** substream: its `chances(defaultProbs)` is on the
  level stream.
- `randomWeapon`/`randomArmor`/`randomMissile`'s tier roll is on the level stream.
- An item's post-selection `.random()` draw count is set by its category's `superClass`, and
  `MissileWeapon` is NOT interchangeable with `Weapon` here: it overrides `random()` to roll a
  stack size only. Filing `MISSILE`/`MIS_T1..T5` under the weapon path cost ~2 extra draws per
  generated missile (fixed - see "Six more bugs" below), so treat each `superKind` as a claim
  about a specific `random()` override, verified against that class, not a family guess.
- `random()` (no-arg)'s category roll is on the level stream **and mutates `categoryProbs`**, so
  that deck is run-level state carried across floors in generation order, like the
  `SpecialRoom`/`SecretRoom` queues.
- `Generator.fullReset()` (run-init generator, after `SecretRoom.initForRun()`) is now called by
  the verify scripts. Its `Random.Int(2)` sets `usingFirstDeck`, which decides every
  `categoryProbs` weight and therefore steers level content on every floor of the run.

One real Java bug is deliberately corrected only in this port: `Generator.java`'s static init has
`WEP_T3.probs = WEP_T1.defaultProbs.clone()`, so tier 3's starting deck copies tier 1 instead of
its own table. In the `4.0.0-beta` source both arrays have six entries, so the observable defect
is the zero weight at tier-3 index 1 (`Mace`); the older source snapshot also made the final
`Whip` entry unreachable because tier 1 had only five weights. The Java source is left unchanged
by project policy. `spdItems/generator.ts` corrects the port locally with tier 3's own six weights;
`chances()` always burns exactly one `Random.Float`, so this changes which weapon index a draw
resolves to but not the level-generation RNG call count/order.

### The draws that were being skipped

Every one of these was previously documented here as "Generator-subsystem-internal - skipped
with ZERO Random calls", or similar. That claim was wrong in every case listed:

1. **`Generator.random()`/`random(Category)`/`randomUsingDefaults()` at ~20 room call sites** -
   `StorageRoom`, `MagicalFireRoom`, `PoolRoom`, `SentryRoom`, `TrapsRoom`, `CryptRoom`,
   `SacrificeRoom`, `ArmoryRoom`, `PitRoom`, `LaboratoryRoom`, `LibraryRoom`, `RunestoneRoom`,
   `CrystalChoiceRoom`, `CrystalVaultRoom`, `CrystalPathRoom`, `StudyRoom`,
   `SuspiciousChestRoom`, `GrassyGraveRoom`, `SecretArtilleryRoom`, `SecretChestChasmRoom`,
   `SecretRunestoneRoom`, `SecretSummoningRoom`, `SecretMazeRoom`. `Random.oneOf(...)` category
   picks are real draws too.
2. **The `while (prize.cursed)` prize loops** (`PoolRoom`/`SentryRoom`/`TrapsRoom`/
   `SecretMazeRoom`) were previously called unreproducible because the retry count was unknown.
   It is not unknown - it is driven by the `cursed` flag `Weapon.random()`/`Armor.random()` roll,
   which this module now rolls. `uncursedWeaponOrArmorPrize()` implements the shared loop
   (including `SecretMazeRoom`'s quirk of passing `useDefaults = true` for the weapon branch
   only, which moves that class pick onto the level stream).
3. **`CryptRoom`/`SacrificeRoom`'s `randomCurse()`**, which fires only when the prize came out
   uncursed AND without a good enchantment - hence `GenItem.hasGoodEnchant`.
4. **`Level.findPrizeItem()` is not free.** The no-arg overload makes a real
   `Random.element(itemsToSpawn)` draw whenever the queue is non-empty, and returning an item
   makes the calling room skip its entire Generator path. Rooms queue keys/potions via
   `addItemToSpawn` *as they paint*, so a room painted later in the shuffled order genuinely can
   find one. `PaintLevel` now models `itemsToSpawn` (`findPrizeItem` draws; the
   `findPrizeItem(Class)` overload does not - it scans in order). The 24 existing
   `drop(..., 'itemToSpawn')` calls route there.
5. **`Piranha.random()`** - `Random.Int(50)`, once per fish, *before* that fish's placement loop:
   `PoolRoom` (x3) and `AquariumRoom` (1-3).
6. **`Statue.random()`** - `StatueRoom` was documented as having "no local RNG at all", true of
   its `paint()` body but badly misleading: `Statue.random()` rolls the 1-in-10 armored variant
   and then the constructor generates a full **enchanted weapon** (`do { random(WEAPON) } while
   cursed` + `Enchantment.random()`), plus an armor for `ArmoredStatue`.
7. **`new EnergyCrystal().random()`** - `Random.IntRange(4, 6)`, in both `LaboratoryRoom` and
   `SecretLaboratoryRoom` (x2 there).
8. **`new Gold().random()`** at three more sites: `ToxicGasRoom` (x3 - skeleton plus two chests),
   `SuspiciousChestRoom`, `GrassyGraveRoom`.
9. **`new EmptyRoom()` as a scratch rect.** `EmptyRoom` extends `StandardRoom`, whose instance
   initializer `{ setSizeCat(); }` burns one `Random.chances(sizeCatProbs())` float **per
   construction**. Sub-pass 10 caught this in `CrystalPathRoom`; the same pattern was still
   missing in `CrystalChoiceRoom` (x3, before its `center()` calls), `MagicalFireRoom`
   (`behindFire`) and `SentryRoom` (`sentry.room`).
10. **`LaboratoryRoom`'s alchemy guide page.** On a fresh game all 10 `Document.ALCHEMY_GUIDE`
    pages are NOT_FOUND, so `missingPages.size() <= 5` is false, `chapterTarget = 1`, and
    `chapter = 1 + depth/5` is 1 throughout the Sewers - so exactly one page drops, with its own
    position-retry loop. Missing entirely.
11. **`SecretRunestoneRoom`'s second `randomUsingDefaults(STONE)`** (only the first was wired).
12. **`SecretHoneypotRoom`'s `new Bomb().random()`** - `Random.Int(4)`, and Java evaluates it as
    `placeItem`'s argument, so it lands BEFORE that item's position-retry loop. The port now
    preserves both the draw and the selected `Bomb`/`DoubleBomb` class; it remains source-verified
    rather than harness-verified because no honeypot room appeared in the 16 tested floors.

### Two non-Generator bugs the same trace diff exposed

- **`Level.Feeling` was not wired into the painter at all**, though `RegularLevel` already used
  it for room counts. It changes five things: `layoutAndCreateLevel`'s padding (CHASM -> 2),
  `SewerLevel.painter()`'s water fill (WATER -> 0.85) and grass fill (GRASS -> 0.80),
  `paintDoors`' `hiddenDoorChance` (SECRETS pulls it toward 50%) and its connectivity rule
  (SECRETS only requires "not totally isolated" - each side must still reach >= 2
  non-`ConnectionRoom`s - instead of full connectivity), and `paintTraps` (TRAPS places `5*nTraps`
  with only the first `nTraps` hidden). Every floor that still mismatched after the Generator
  work had a non-NONE feeling; wiring this fixed `1:4`, `123456789:2`/`:4` and `42:2`.
- **`SacrificeRoom`'s corridor loop was off by one.** Java is
  `for (; p.y != c.y; p.y += ...) { set(p) }` - it writes at the CURRENT `p`, then advances. This
  port advanced first and then wrote, skipping the cell `drawInside` stopped on and leaving a
  single `CHASM` tile behind. That one cell was the *entire* remaining diff on two otherwise
  byte-perfect floors (`1:2` and `42:3`), each of which had an already-identical RNG stream -
  a good reminder that a matching stream does not imply matching tiles.

### Depth 1 is not reproducible in Java either - do not chase it

`EntranceRoom.paint()`'s guidebook placement uses a deliberately **unseeded**
`Random.pushGenerator()`, and `paintGrass()` skips its per-cell roll on any cell already holding a
heap - so the guidebook's position shifts the *seeded* stream's call count for the rest of that
floor. Measured directly: running the unmodified Java harness twice produces different depth-1
output for the same seed (and its trace length changed 7211 -> 7210 for `42:1`). The TS side is
non-deterministic at depth 1 for the same reason. Consequences for anyone re-verifying:
- **Depths 2-4 are the trustworthy signal** and are deterministic on both sides.
- A depth-1 mismatch is only meaningful if the *room graph* differs; a tile-level diff of a few
  dozen decoration/trap cells is expected noise.
- Mid-pass, `42:1` and `123456789:1` each flipped between EXACT and ~30 differing cells with no
  code change in between. Do not read such a flip as a regression.

### Verification tooling

`tools/scratch/` keeps the comparers (`cmp.mjs` maps, `cmptrace.mjs` first-diverging-draw,
`phases.mjs` per-phase draw counts). The trace *instrumentation* is removed again, per the
established convention: `src/spdTrace.ts` + hooks in `SpdJavaRandom.next()`/`pushGenerator`/
`popGenerator`, phase markers in `regularPainter.ts`, a `TracingRandom extends java.util.Random`
injected from `Random.pushGenerator(long)` with a `TRACE_REL` push/pop filter, and a
`TRACE_SEED`/`TRACE_DEPTH` env-gated dump in `LevelGenHarness`. All tracked Java game files were
restored with `git checkout` and verified with `git diff --exit-code`; the harness still builds
and runs. Note the harness must walk depths 1..N in order for a seed, since `SecretRoom`'s budget
and the `Generator`/`SpecialRoom`/`SecretRoom` decks are cumulative per run.
The regular `createItems()` heap branch now also preserves Java's artifact/upgradable
locked-chest decision, depth-gated Golden Mimic fallback, and queued Golden Key drops;
remaining simplifications are the broader item-instance catalogue and exact heap stacking.

### What remained outside this phase

This phase initially covered only the generator's Sewers output. Later passes superseded that
scope: all five regular regions are now generated and live, and the scene has real playable
ground-item and mob population models. The remaining gap is full Java item-instance generation
and behavior (rather than the current translated families), plus `Blob`/`Alchemy`/
`SacrificialFire` seeding and `Level.create()`'s exact `createMobs()`/`createItems()` bundle
semantics. See the current integration, item, and persistence rows rather than treating this
historical phase boundary as the live coverage status.

## Prison region (depths 6-10) - `PrisonLevel`/`PrisonPainter`

Ported in the Prison pass, reusing the verified `Builder`/`RegularPainter`/`Generator` core
unchanged. **Depth 6 now generates too** - `ShopRoom` is ported (see the ShopRoom section
below), so the earlier `initRooms()` throw for depths 6/11/16 is gone and the harness runs the
sequence 1,2,3,4,6,7,8,9.

| Java block | TS destination | Status |
| --- | --- | --- |
| `PrisonLevel.standardRooms()` (`5+chances{1,1}`) / `specialRooms()` (`1+chances{1,3,1}`) | `regularLevel.ts`'s `prisonStandardRooms`/`prisonSpecialRooms`, dispatched by `regionForDepth()` | Ported |
| `StandardRoom.chances[6..10]` (zeroes indices 1-3, enables 4-6) | `regularLevel.ts`'s `STANDARD_ROOM_CHANCES[6..10]` | Ported |
| `SegmentedRoom` (recursive `createWalls`, one `IntRange` per retry, `Int(2)` tie-break only) | `rooms/standard/segmentedRoom.ts` | Ported - fully RNG-faithful, no `Generator` dependency |
| `PillarsRoom` (2-pillar vs 4-pillar branch, float32 skew arithmetic) | `rooms/standard/pillarsRoom.ts` | Ported - uses `Math.fround`/`javaRoundFloat` at Java's real narrowing points, since `xSpaces`/`ySpaces`/`percentSkew` are `float` and `Math.round(float)` is the float overload; here (unlike the builder's angle math) a one-off moves a pillar a whole tile |
| `CellBlockRoom` (nullable `Boolean topBottomDoors`, per-cell `Int(4)` in the 1x1 case) | `rooms/standard/cellBlockRoom.ts` | Ported |
| `ConnectionRoom.chances[6..10]` (`{0,0,22,3,0,0}` - `PerimeterRoom` 22, `WalkwayRoom` 3, the inverse of Sewers) | `connectionRoom.ts`'s `CHANCES` | Ported |
| `Wandmaker.Quest.spawnRoom()` (`depth>6 && Int(10-depth)==0`, then `Int(3)+1` type) | `wandmaker.ts`'s `wandmakerSpawnRoom` | Ported, including the run-level `spawned`/`type` carry-over and the `||` short-circuit; `Int(1)` at depth 9 makes an un-spawned quest guaranteed there |
| `Wandmaker.Quest.spawnWandmaker()` (placement retry loop, two `randomUsingDefaults(WAND)`, two `upgrade()`) | `wandmaker.ts`'s `spawnWandmaker` | Ported |
| `MassGraveRoom` / `RotGardenRoom` / `RitualSiteRoom` (the three quest rooms) | `rooms/special/massGraveRoom.ts`, `rooms/special/rotGardenRoom.ts`, `rooms/standard/ritualSiteRoom.ts` | Ported. `RitualSiteRoom`'s `canPlaceItem`/`canPlaceCharacter` ritual-radius exclusion is tracked (`ritualSiteState.ritualPos`) but consulted only by that room, matching how narrowly Java scopes it; consumes no RNG either way |
| `PrisonLevel.painter()` (`.setWater(WATER?0.90:0.30, 4)`, `.setGrass(GRASS?0.80:0.20, 3)`), `trapClasses()`/`trapChances()` (14 classes, no depth special-case) | `prisonPainter.ts` | Ported |
| `PrisonPainter.decorate()` (corner-weighted `Random.Float()` EMPTY_DECO pass, then two `WALL_DECO` passes at `Int(6)`/`Int(3)`) | `prisonPainter.ts`'s `decorate` | Ported. Unlike Sewers', this pass is not purely cosmetic - it runs `spawnWandmaker()` first, which consumes a variable number of draws |
| `ShopRoom` (depths 6/11/16) | `spdItems/shopItems.ts`, `rooms/special/shopRoom.ts`, `room.ts`'s `'shop'` sizing, `regularLevel.ts`'s `shopOnLevel()` | **Ported** - see the dedicated section below |
| `PrisonLevel.addPrisonVisuals`/`Torch`/`tileName`/`tileDesc` | `src/ui/wallDecorations.ts`'s `WallDecorationLayer`, `examineTile` (`main.ts`) | Ported (see the Sewers row in "UI and presentation" for the shared implementation, written generically over both regions from the start) - real `Torch` particle/glow decoration at every real `WALL_DECO` cell `prisonPainter.ts` places, and a `L`/"Look" action showing `PrisonLevel`'s real `water_name`/`empty_deco_desc`/`bookshelf_desc` overrides. Music is separately already ported (see "Audio and splash art") |
| `PrisonBossLevel` (depth 10) | `spdLevelGen/bossLevels.ts`, `gameBridge.ts` | Fixed layout routed through the live bridge; Tengu now runs the phase-2 rhythm (bracket floor, per-bracket capped relocation with trap burst, bomb-ability rotation, and Java's real ability cadence - see the Tengu-abilities row), with the FIGHT_START/FIGHT_ARENA split now ported (cell-phase warp + dart fill, arena-phase 5-7 relocation), while the separate phase-2 arena geometry and the one-turn-collapsed Fire/Shocker actors remain simplified |

### Three real bugs this pass found in the SHARED core (all pre-existing, all Sewers-affecting)

None of these are Prison-specific. Each was invisible in Sewers for a structural reason.

1. **`Level.setSize()` fills the map with `Terrain.CHASM`, not `WALL`, on a `Feeling.CHASM`
   floor** (`Level.java:290`). `PaintLevel`'s constructor hardcoded `WALL`, leaving every
   unpainted cell of a chasm floor solid. Not cosmetic: `paintTraps`' passable/hallway analysis
   and `decorate()`'s `WALL`-adjacency tests both read those cells. Never surfaced because none
   of the 16 Sewers test floors happened to roll CHASM. Fixed via a `backgroundTerrain`
   constructor argument.
2. **`Level.tunnelTile()` returns `EMPTY_SP` on a chasm floor**, not `EMPTY` (`Level.java:456`).
   The connection-room dispatch in `rooms/standard/registry.ts` hardcoded `EMPTY` behind a
   "Feeling isn't modeled" comment that went stale when sub-pass 12 wired Feeling in. This one
   is load-bearing: water and grass only spread over `EMPTY`, so chasm-floor corridors got
   flooded where Java's stay dry. Sewers cannot expose it - `PerimeterRoom`/`WalkwayRoom`, the
   subclasses that fill whole corridor runs with this tile, have weight 0 in
   `ConnectionRoom.chances[1..5]`. `PaintLevel` now carries `feeling` so room `paint()`s can
   read it, not just the painter stages.
3. **`Wand.upgrade()` rolls `Random.Int(3)`** for its own 1-in-3 uncurse (`Wand.java:305`).
   `spawnWandmaker()` upgrades both offered wands, so two draws were missing. This port's
   comment had asserted "`cursed = false` and `upgrade()` cost no RNG" - wrong, and the sole
   cause of every Prison quest floor diverging inside `decorate()` while everything upstream
   was already byte-perfect. Found by printing `wand1`'s class/level/cursed on both sides: they
   matched exactly, which localised the missing draws to between `wand1` and `wand2`.

A fourth bug was Prison-only: `CellBlockRoom`'s `Rect internal = new EmptyRoom()` is DECLARED
`Rect` but holds a `Room`, and `width()`/`height()` are virtual - so `internal.width()`
dispatches to `Room.width()`'s INCLUSIVE `super.width()+1`, not `Rect`'s. The declared type is
a red herring. This is the exact mirror of sub-pass 11's `mergeRooms` bug, where a genuinely
plain `Rect` local was wrongly given `Room`'s `+1`.

### Verification (as of the Prison pass; superseded by the ShopRoom section below)

> **Superseded.** The numbers in this subsection were measured with the harness sequence
> 1,2,3,4,**7**,8,9, i.e. with depth 6 skipped because `ShopRoom` was unported. Depth 6 is now
> generated, and since run-level state (`SecretRoom`'s budget, the `SpecialRoom` queue,
> `Generator`'s decks) is cumulative in depth order, inserting it changes which rooms and items
> depths 7-9 roll - so those are *different floors* now, not the ones measured here. See the
> ShopRoom section's own verification subsection for the current result (28/28 at depths 2-9).
> Kept for the reasoning it records, not for its counts.

`LevelGenHarness.java` generates `PrisonLevel` for depths 7-9 alongside `SewerLevel` for
1-4, and resets `Wandmaker.Quest` in its run-init block. At the time, depth 5
(`SewerBossLevel`) and depth 6 (`ShopRoom`) were skipped on BOTH sides, which made the sequence
not a real playthrough: the state at depth 7+ was not what a real run would have. That still
verified the PORT - both sides ran the identical sequence - but it was not a claim about real
in-game floors.

**Result: 27-28 of 28 floors are MAP EXACT MATCHES, and the only floors that ever differ are
the two where JAVA DISAGREES WITH ITSELF.** Broken down:
- **Sewers depths 2-4: 12/12 exact on every run.**
- **Prison depths 7-9: 12/12 exact on every run.**
- **Depth 1: 2/4 to 4/4 depending on the run**, because depth 1 is not reproducible in Java
  either (`EntranceRoom.paint()`'s unseeded guidebook generator - see that section above).

That last point is now measured rather than asserted. Running the *unmodified* Java harness four
times and this port five times, then comparing all 20 Java x TS pairings, the ONLY floors that
ever mismatch are `123456789:1` (24 cells) and `42:1` (32 cells) - and Java-vs-Java runs disagree
on exactly those two floors, with exactly those cell counts. Every one of the 24 floors at depths
2-9 matched in all 20 pairings. One pairing came out 28/28 (Java's unseeded roll happening to
coincide on both depth-1 floors). `42:2` was seen to differ in one early pairing and never again,
which fits the documented depth-2 case (a floor's entrance room can still hold an unfound guide
page); depth 2 is therefore *usually* but not *provably always* deterministic.

**The Prison room-graph stage is byte-perfect on all 12 floors**: identical room rectangles,
identical counts, and identical concrete class selections one-for-one - `SegmentedRoom`,
`PillarsRoom`, `CellBlockRoom`, `PerimeterRoom`, `WalkwayRoom`, `MazeConnectionRoom`,
`RitualSiteRoom`, `MassGraveRoom`, `RotGardenRoom` all land where Java puts them.

### Six more bugs, found by full RNG draw-trace diffing

This pass closed the seven remaining Prison floors. Every one of these was found by diffing draw
streams, not by reading source or staring at which tiles changed; each fix provably moved the
first-divergence point later, which is why the method converges where outcome-based inference had
stalled for several passes.

1. **`ToxicGasRoom` was given a `canPlaceGrass()` override it does not have.** Grepping
   `public boolean canPlaceGrass` across all of `levels/rooms/` yields exactly six declarations -
   `Room`, `SecretRunestoneRoom`, `DemonSpawnerRoom`, `MagicalFireRoom`, `PitRoom`, `BurnedRoom` -
   and `ToxicGasRoom` is not among them. The invented override removed 72 candidate points on a
   ToxicGasRoom floor, dropping 5 grass cells and so 5 `Random.Float()` draws.
2. **`Door.Type.TUNNEL` hardcoded `EMPTY` instead of `Level.tunnelTile()`.** The second surviving
   victim of the "Feeling isn't modeled" assumption (the first, `Level.setSize()`'s CHASM
   background, was fixed in the Prison pass). On a chasm floor Java writes `EMPTY_SP` there;
   leaving it `EMPTY` made a TUNNEL door a grass candidate Java never offers. `tunnelTile()` now
   lives on `PaintLevel` so the room-paint path and the door path cannot drift apart again.
3. **`LaboratoryRoom` hardcoded `pagesToDrop = 1`.** Java: `chapter = 1 + depth/5`,
   `chapterTarget = missingPages.size() <= 5 ? 2 : 1`, `pagesToDrop = min(missing, (chapter -
   chapterTarget) + 1)`. `Document.ALCHEMY_GUIDE` has 10 pages, all NOT_FOUND unless the player
   reads them, so it is 1 page in the Sewers but **2 from depth 5 on**. Each page runs its own
   position-retry loop, so this was a 2-draw gap on every Prison Laboratory floor - correct in
   the Sewers, which is exactly why it survived the whole Sewers verification.
4. **`MIS_T1..MIS_T5`/`MISSILE` were filed under `superKind: 'weapon'`.**
   `MissileWeapon.random()` (MissileWeapon.java:252) fully OVERRIDES `Weapon.random()`: it rolls
   a stack size (`Int(3)`, then `Int(5)`) and never touches level, enchantment or curse. Running
   `Weapon.random()` instead burned ~2 extra draws on every generated missile. A new `'missile'`
   superKind now implements the real override.
5. **`Mimic.spawnAt()`'s `generatePrize()` was not modelled at all.** It always generates a kill
   reward on the level stream (`Random.Int(5)` plus one of gold / missile-with-defaults / armor /
   weapon-with-defaults / `randomUsingDefaults(RING)`). Its `do..while` cannot loop here: all five
   cases assign non-null and `Challenges.isItemBlocked` is false with no challenge mode. Added to
   `TreasuryRoom` and `SuspiciousChestRoom`. **Not** to `CrystalVaultRoom`: `CrystalMimic`
   overrides `generatePrize()` to just uncurse existing items, consuming nothing.
6. **`TreasuryRoom` evaluated its two draws in the wrong order.** Java rolls the mimic gate
   first - `heapType == CHEST && depth > 1 && Random.Int(5) == 0` - and only then
   `new Gold().random()`, as the argument expression in both branches. The port had gold first,
   so each draw fed the other's decision.

### A verification-tooling bug worth knowing about

`tools/scratch/cmp.mjs` was itself wrong for `Feeling.CHASM` floors, in two ways, and its numbers
in earlier revisions of this file cannot be trusted. CHASM renders as a SPACE, so (a) dropping
blank rows and right-trimming mangled every chasm floor - `42:9` was read as 20x52 when it is
really 35x56, making its "49 cells differ" meaningless - and (b) a later fix filtered summary
lines by "third character is a letter", which also eats map rows starting with legitimate glyphs
`w`/`W`/`L`/`P`/`X`/`s`/`B`/`A`/`C`, inventing 51 phantom differing cells on `42:2`, a floor whose
maps are byte-identical. Summary lines are now filtered by their known prefixes and rows are kept
verbatim and padded. `42:1` had also been reported as differing for the same chasm-parsing reason.

## Caves region (depths 11-14) - `CavesLevel`/`CavesPainter`

Real generation, following the same shape as Sewers/Prison: `regularLevel.ts`'s `regionForDepth()`
now returns `'caves'` for 11-14, `cavesStandardRooms()`/`cavesSpecialRooms()` reproduce
`CavesLevel.standardRooms()`/`specialRooms()` (6-7 standard, average 6.333; 2-3 special, average
2.2), and `STANDARD_ROOM_CHANCES[11]` (aliased to 12-14) is the real `StandardRoom.chances[11]`
row read directly off `StandardRoom.java`'s static initializer, not re-derived. `cavesPainter.ts`
wires `regularPainter.ts`'s shared pipeline with Caves' real trap table (`nTraps` range (2,5), 14
classes/weights from `CavesLevel.trapClasses()`/`trapChances()`) and water/grass fill numbers
(0.85/0.30 water @ smoothness 6, 0.65/0.15 grass @ 3), then its own `decorate()`:
merges every still-unconnected room-neighbour pair into `CHASM` (a second, later call to
`regularPainter.ts`'s now-exported `mergeRooms`, after `paintDoorsForDepth`'s own EMPTY-merge
pass), randomly walls off large standard-room corners, and places `EMPTY_DECO`/`WALL_DECO` by
adjacency - the `WALL_DECO` check needed `DungeonTileSheet.floorTile()`'s exact terrain set
(read off `directVisuals`'s static initializer, not approximated), since it excludes `HIGH_GRASS`
which the generic "is this passable" tests elsewhere in this port do not.

### Three new `StandardRoom` subclasses (`StandardRoom.chances[]` indices 7-9)

Sewers/Prison never exercised these three indices, so they were still `undefined` in
`STANDARD_ROOM_CLASS_ORDER`/`STANDARD_ROOM_META` before this pass - the biggest real unknown the
initial scoping pass surfaced, since two of the three are the *most likely* rolls in Caves'
`chances[11]` row (weights 10/10 out of a 25-point non-misc total).

- **`CaveRoom`** (`rooms/standard/caveRoom.ts`) - extends `PatchRoom` like `BurnedRoom`, reusing
  `setupPatch()`/`xyToPatchCoords()`; carves `WALL` back into an otherwise-`EMPTY` room via a
  fill-percentage patch, then a newly-ported `cleanDiagonalEdges()` (`PatchRoom.java`, pure
  geometry, no RNG) removes corner-only patch touches.
- **`CirclePitRoom`** (`rooms/standard/circlePitRoom.ts`) - an elliptical room (`fillEllipseRoom`)
  with a `CHASM` pit ringed 3 cells in from the wall; both primitives already existed in
  `paintLevel.ts` from other rooms, so this port was direct.
- **`CavesFissureRoom`** (`rooms/standard/cavesFissureRoom.ts`) - by far the largest of the three
  (313 lines of Java): rolls 2-4 chasm "fissure" lines radiating from the room centre at angles
  clear of doors and each other, draws each as a `CHASM` line via incremental angle-stepping,
  drops a `CHASM` block at the centre on 3+ lines, then punches an `EMPTY_SP` bridge back across
  each fissure so the room is never split into an unreachable island. Its own retry loop
  (`while (!pathable)`) needed a pathability check - Java's is `PathFinder.buildDistanceMap`
  scoped to `PathFinder.setMapSize(width()-2, height()-2)` (the room's own interior only, never
  the full level); ported as a local 8-directional BFS instead of routing through a level-wide
  pathfinder, since `PathFinder.java`'s own neighbour set (`dirLR`) is 8-directional and the check
  makes no `Random.*` calls of its own (so only its *result* needs to match, not a call order).
  `CavesFissureRoom` also overrides `canMerge()` (the only new override among all three): true
  unconditionally when merging into `CHASM`, otherwise true unless the interior point is itself
  already `CHASM` - `regularPainter.ts`'s `canMergeAt()` now takes `mergeTerrain` as a parameter
  (previously unused by any of the 17 Sewers/Prison classes) to support this one case, and
  `mergeRooms()` is now exported for `cavesPainter.ts`'s own `decorate()`-pass merge call.

### Blacksmith's forge branch

`CavesLevel.initRooms()` is `return Blacksmith.Quest.spawn(super.initRooms())`. The Blacksmith room
now places its NPC and emits a branch-exit cell into the live bridge. The branch itself is generated
as a playable 32x32 CaveRoom, with a centre entrance/return transition, Java's standalone
CavesPainter water/grass pass (`0.35f`/`0.10f`), and pickaxe wall mining that can produce DarkGold.

Verified scope:

- The exact branch reward-seeding behavior is implemented. Bones now follows Java's seeded-gold versus
  normal-run equipment/backpack selection order and only rolls stack quantities after selecting
  a stack; artifact remains now consume the matching Generator uniqueness-deck entry and fall
  back to Gold when that class is unavailable; the CAVES_QUEST custom-tile border atlas is copied
  from the Java assets and rendered with the exact BorderDarken tile index map; the Blacksmith
  QuestEntrance tile (atlas index 0) is rendered at the branch-exit cell.
- The Java `MiningLevel` source defines no additional mining hazards. The cross-run `Bones.get()` persistence contract is live through
  the framework save store: death records branch/depth (with Java's five-floor deepest-floor cap)
  and the Gold or normal-run eligible-loot
  payload, matching floors place it (MiningLevel uses the fixed cell above its entrance), and
  consumption clears the record. Seeded remains resolve to Java's Gold(10), while normal
  upgradable loot preserves its ordinary identification state, becomes cursed-known, and is capped at +3. Hero mining accepts ordinary Caves
  walls and real `WALL_DECO` veins, removes the wall into `EMPTY_DECO`, and awards DarkGold only for veins;
  the explicit Pickaxe MINE action now scans adjacent veins, converts them to `WALL`, awards DarkGold, and spends two turns;
  the Blacksmith normal/Bat-blood quest variant is now selected by the generator, persisted, and completed by
  15 DarkGold or a pickaxe stained on a Bat kill respectively; the Duelist Pierce ability remains an item-system task outside this branch.
  Bones remains now also reset Java's weapon/armor/wand identification-use budgets, clear an
  armor seal, and restore missile durability before placement; broader item-specific reset and
  degradation behavior for unsupported item classes remains open.
- `verifyMiningBranch.ts` checks the fixed 32x32 geometry, entrance clearing, deterministic output,
  global water/grass pass, and mineable ore decoration across four seeds.

### Also not ported: the ore-vein `WALL_DECO` particle effect

`main.ts`'s `WallDecorationLayer` (real `Sink`/`Torch` particle emitters for Sewers/Prison's own
`WALL_DECO`) now includes Caves floors: `CavesLevel.tileDesc()`'s own `WALL_DECO` case
("A vein of some ore is visible on the wall.") is rendered by the dedicated FOV-gated `ore`
sparkle variant in `WallDecorationLayer`, rather than being mis-rendered as a sink or torch.

### Examine-text fix while wiring: `bookshelf_desc`/`empty_deco_desc` were wrong for non-Sewers/Prison regions

`main.ts`'s tile-examine feature (see the Sewers/Prison section above) had a latent bug, unreachable
before this pass because Caves never actually placed `BOOKSHELF`/`EMPTY_DECO` tiles: both
descriptions were a two-way `region === 'prison' ? prisonlevel... : sewerlevel...` ternary, using
Sewers' string as an implicit "everyone else" fallback. The real Java has no such fallback -
`Level.tileDesc()`'s base switch has no `BOOKSHELF`/`EMPTY_DECO` case at all, so any region that
doesn't override one gets no description (`CavesLevel` overrides `BOOKSHELF` with its own
`caveslevel.bookshelf_desc` but NOT `EMPTY_DECO`, despite generating `EMPTY_DECO` tiles). Replaced
with `examineBookshelfDesc()`/`examineEmptyDecoDesc()`, each an explicit per-region switch ending
in `''` rather than a borrowed string, now that Caves makes the wrong branch reachable in practice.

### Verification

`tools/verifyLevelPaint.ts` extended to depths 11-14 (dispatching to `paintCavesLevel`) and run
across 7 seeds (28 Caves floors) with no `PAINT FAILED` lines and no unmapped terrain characters in
the dump - the same smoke-test tier Sewers/Prison's paint stage had before its own Java-fixture
pass (no byte-exact Java fixture exists for Caves yet, same caveat as the rest of this file's
"Not yet compared against a Java fixture" notes). Also verified live in-browser at depths 11 and
13 via `window.__MWG__`: correct "Caves 13" HUD region label, the Caves rock tileset (distinct from
Sewers/Prison), a spawned mob, no console errors, `npx tsc --noEmit` and `npm run build` both clean.

## City region (depths 16-19) - `CityLevel`/`CityPainter`

Ported the same way as Caves above: `cityPainter.ts` wires `regularPainter.ts`'s shared pipeline
with City's real numbers (`standardRooms()` 6-8 average 7, `specialRooms()` 2-3 average 2.33,
water fill 0.30/0.90 (feeling), grass 0.20/0.80, `nTraps` the shared `RegularLevel` default, and
the real 17-class `trapClasses()`/`trapChances()` table, name-only stand-ins as with every other
region - see the Sewers section for why trap *behaviour* isn't ported). `regularLevel.ts`'s
`regionForDepth()` now returns `'city'` for depths 15 < d <= 19 (throwing above 19, same
depth-15-is-a-boss-level exclusion as Caves' depth-15 gap); `shopOnLevel()` already had the
`depth === 16` case from before this pass. `gameBridge.ts`'s `PORTED_DEPTHS` grew depths 16-19 and
its `generateFloor()` dispatch grew a fourth branch.

City's `StandardRoom.chances[16..20]` table introduces 3 new reachable classes (indices 9/10/11 -
`HallwayRoom`/`StatuesRoom`/`SegmentedLibraryRoom`), ported into `rooms/standard/{hallwayRoom,
statuesRoom,segmentedLibraryRoom}.ts` and wired into `room.ts`'s `StandardRoomKind`/
`STANDARD_ROOM_META` (min-dimension floors/`sizeCatProbs`) and `regularPainter.ts`'s `canMergeAt`
(`HallwayRoom.canMerge()` is unconditionally false, the same treatment as `sewerPipe`/`entrance`).
Unlike Prison/Caves, City needed **no new `SpecialRoom` subclasses** - `SpecialRoom` selection is a
run-level queue, not `StandardRoom`'s depth-keyed table (see `rooms/special/registry.ts`'s own
module comment), so all 21 reachable classes were already in scope for every ported region.

`HallwayRoom` routes every door inward to a shared 3x3 hub near the room's centre via two
axis-aligned `Painter.drawLine` segments per door, stamps that hub `EMPTY_SP` with one central
`STATUE_SP`, and raises every door to `REGULAR` - a faithful line-for-line port including the real
`getConnectionSpace()` gating logic. `StatuesRoom` tiles a `rows x cols` grid of statue alcoves
sized from the room's own dimensions (`{9,3,1}` `sizeCatProbs`, min dimension 7). `
SegmentedLibraryRoom` is `SegmentedRoom`'s recursive wall-splitting algorithm (see
`segmentedRoom.ts`'s own doc comment on its `do { ... } while (--tries > 0)` RNG shape) with
`BOOKSHELF` in place of `WALL`, a 4/3 (not 5/3) minimum-area cutoff, one `EMPTY_SP` gap cell per
split (not two), and the recursion area inset by 2 (not 1) from the room's own walls/bookshelf
border - all four differences read directly off `SegmentedLibraryRoom.java` against
`SegmentedRoom.java`, not assumed from the shared shape.

`CityPainter.decorate()`'s two-pass `EMPTY`->`EMPTY_DECO`/`WALL`->`WALL_DECO` roll (the latter
gated on `!wallStitcheable(below)`) is ported as `cityPainter.ts`'s own `decorate()`, with a local
`wallStitcheable()` narrowed to the terrain values this port actually models (see its own comment
for the two real Java members - `UNLOCKED_EXIT` and off-map `NULL_TILE` - that are consequently
unreachable here).

### City's `WALL_DECO` gets a real particle effect: `Smoke`

Unlike Caves' ore-vein `WALL_DECO` (deliberately left undecorated, see above), `CityLevel`'s own
`WALL_DECO` fixture is `Smoke`/`SmokeParticle` - real, source-confirmed values (`pour(factory,
0.2f)`, a black particle shrinking `size(6 - p*3)` over a 2s lifespan with a two-phase alpha
curve). Added as a third `WallDecoKind` (`'smoke'`) to `ui/wallDecorations.ts` alongside Sewers'
`sink`/Prison's `torch`, and wired into `main.ts`'s existing wall-decoration gate (`region ===
'sewers' || 'prison' || 'city'`), same FOV-gated visibility rule as the other two.

### Examine-text: City is the first region with STATUE/STATUE_SP/EMPTY_SP/WALL_DECO tile-examine text

`CityLevel.tileDesc()` overrides four cases the port's `examineTile()` had never needed before:
`BOOKSHELF` (`citylevel.bookshelf_desc`, added to the existing `examineBookshelfDesc()` switch),
`WALL_DECO`+`EMPTY_DECO` sharing one `deco_desc` key (`examineWallDecoDesc()`, a new raw-grid
branch; `examineEmptyDecoDesc()` gained a `city` case), `STATUE`/`STATUE_SP` (`statue_desc`, a new
`examineStatueDesc()`), and `EMPTY_SP` (`sp_desc`, a new `examineSpDesc()`). Read `Level.java`'s
own base `tileDesc()`/`tileName()` directly rather than assuming City is the only region that can
reach these tiles: `STATUE`/`STATUE_SP` already have a base `Level.class` `statue_name`/
`statue_desc` pair (any region's `StatueRoom`/`ring`/`hallway` decoration falls through to that
generic text, not to emptiness), so `examineStatueDesc()` falls back to `levels.level.statue_desc`
for every non-City region rather than `''`. `WALL_DECO`/`EMPTY_SP` have no base case at all, so
their desc functions stay City-only. All four keys pulled into `spdMessages.ts` via the normal
`npm run i18n` scrape once the `t('levels.citylevel....')` call sites existed (186 keys total now,
up from 167).

### Verification

`tools/verifyLevelPaint.ts` extended to depths 16-19 (dispatching to `paintCityLevel`) and run
across 7 seeds (28 City floors) with no `PAINT FAILED` lines; `standard:hallway`/`standard:statues`/
`standard:segmentedLibrary` all confirmed selected and painting without error across the run.
Also verified live in-browser at depth 16 via `window.__MWG__` (`fov.revealAll()` plus a direct
camera pan, since this depth's floor is larger than the viewport): the City tileset renders
distinctly from Sewers/Prison/Caves, a `StatuesRoom`'s alcove-grid floor pattern and a
bookshelf-lined room are both visible, ground items and mobs render, no console errors,
`npx tsc --noEmit` and `npm run build` both clean.

## Halls region (depths 21-24) - `HallsLevel`/`HallsPainter`

Ported the same way as City above: `hallsPainter.ts` wires `regularPainter.ts`'s shared pipeline
with Halls' real numbers (`standardRooms()` 8-9 average 8.33, `specialRooms()` 2-3 average 2.5,
water fill 0.15/0.70 (feeling), grass 0.10/0.65, `nTraps` the shared `RegularLevel` default, and
the real 18-class `trapClasses()`/`trapChances()` table - City's 17 plus `GrimTrap`, the one
region where a trap class has a genuine implemented behaviour rather than a name-only stand-in,
see `gameBridge.ts`'s `TRAP_BEHAVIOUR`). `regularLevel.ts`'s `regionForDepth()` now returns
`'halls'` for depths 20 < d <= 24; `gameBridge.ts`'s `PORTED_DEPTHS` grew depths 21-24 and its
`generateFloor()` dispatch grew a fifth branch.

Halls' `StandardRoom.chances[21..26]` table introduces 3 new reachable classes (indices 12/13/14 -
`RuinsRoom`/`ChasmRoom`/`SkullsRoom`), ported into `rooms/standard/{ruinsRoom,chasmRoom,
skullsRoom}.ts` and wired into `room.ts`'s `StandardRoomKind`/`STANDARD_ROOM_META` and
`regularPainter.ts`'s `canMergeAt`/`mergeFill`. Like City, Halls needed no new `SpecialRoom`
subclasses. `RuinsRoom` and `ChasmRoom` both extend `PatchRoom` (the same base as `CaveRoom`,
ported in the Caves pass) - `RuinsRoom` re-applies `WALL` rubble into an open room (fill 20%->50%
across NORMAL/LARGE/GIANT, `canMerge()` unconditionally true, modeled in `canMergeAt`), `ChasmRoom`
carves `CHASM` instead (fill 30%->60%, ordinary `canMerge()`). `ChasmRoom.merge()`'s own
special-casing - CHASM-merging with another `ChasmRoom` or a `PlatformRoom` at `mergeTerrain ===
EMPTY`, with a plain `EMPTY` (not `EMPTY_SP`) door tile, the one difference from `PlatformRoom`'s
own symmetric case - is modeled in `regularPainter.ts`'s `mergeFill`, which also gained
`PlatformRoom`'s missing `ChasmRoom` half of its own check (present in the real Java all along,
just unreachable before this pass since `ChasmRoom` didn't exist yet in this port). `SkullsRoom` is
four nested `Painter.fillEllipse` calls (`WALL` -> `EMPTY` inset 2 -> `STATUE` inset 4 -> `WALL`
inset 6 - a statue ring around open floor, itself walled in), min dimension 7.

`HallsPainter.decorate()`'s two rolls - an `EMPTY`->`EMPTY_DECO` roll weighted by 8-neighbour
passable-count (`Random.Int(80) < count`, unlike every other region's flat-probability roll) and a
`WALL`->`WALL_DECO` roll gated on neither left nor up neighbour already being `WALL_DECO` - are
ported as `hallsPainter.ts`'s own `decorate()`, followed by the same "merge every still-unconnected
room-neighbour pair into `CHASM`" pass `CavesPainter.decorate()` already has (see `cavesPainter.ts`'s
own comment) - Halls runs it AFTER the two rolls above, the opposite statement order from Caves,
kept faithful to `HallsPainter.java`'s real order even though the two passes touch disjoint terrain
and so produce identical output either way.

### `DemonSpawnerRoom`: live room, mob, and custom floor overlay

`HallsLevel.initRooms()` is `rooms.add(new DemonSpawnerRoom()); return rooms;` - unconditional,
appended after every other room on **every** Halls floor. The room now preserves its Java geometry
and room-local `DemonSpawner` placement through `PaintLevel.mobs`; the live bridge spawns that
actor instead of using the old generic quest-spawn fallback. The exact `HALLS_SP` atlas is bundled
as `assets/halls_special.png`; `main.ts` renders frames 19/27/31 and the 37-39 three-cell
spawner overlay, changes the decorative frame after the Amulet is obtained, and rebuilds from
live/restored actors so a defeated spawner stays absent on revisit. The entrance-connection
refusal and no-trap/water/grass rules remain wired in the graph/painter.

### `HallsLevel.Stream`/`FireParticle`: a real particle effect on every `WATER` cell

Unlike the other four regions' `WALL_DECO`-gated particle effects (`Sink`/`Torch`/`Smoke`, none of
which Halls has - `HallsLevel.tileDesc()` has no `WALL_DECO` case at all), `HallsLevel`'s own
`addHallsVisuals()` adds one `Stream`/`FireParticle` emitter per real `WATER` cell,
unconditionally - not decoration-gated, and using real values (`color(0xEE7722)`, `lifespan 1f`,
`acc.set(0,+80)`, `speed.set(0,-40)`, size 4, alpha `p>0.8?(1-p)*5:1`). Added as `ui/
wallDecorations.ts`'s `WaterEmberLayer`, a sibling to `WallDecorationLayer` reusing the same
particle/FOV-gating mechanics but keyed on every `WATER` cell rather than a decoration-placed
subset, and on each real `Stream`'s own per-instance `Random.Float(2)` re-roll delay (not a fixed
pour rate). `PixelParticle.Shrinking`'s shrink-over-life isn't reproduced - a documented no-op in
the real game too, since Java's own `size` field here is never reassigned after `reset()` despite
the shrinking base class, not a simplification on this port's part.

### Examine-text: Halls overrides `statue_name` (the only region that does), plus its own `bookshelf_desc`/`statue_desc`

`HallsLevel.tileName()` overrides `STATUE`/`STATUE_SP` with its own `statue_name` - the only region
that overrides this case at all (`CityLevel.tileName()` has no STATUE case, confirmed directly);
added as a new `examineStatueName()`, with `examineTile()`'s STATUE/STATUE_SP branch switched from
a hardcoded base key to it. `HallsLevel.tileDesc()` also overrides `bookshelf_desc` (added to the
existing `examineBookshelfDesc()` switch) and `statue_desc` (added to `examineStatueDesc()`,
alongside City's). `water_desc`/`water_name`/`grass_name`/`high_grass_name` already had `halls`
cases from the Sewers/Prison-era wiring pass, since those four keys work off `regionForDepth` alone
regardless of which regions had a ported floor yet.

### Verification

`tools/verifyLevelPaint.ts` extended to depths 21-24 (dispatching to `paintHallsLevel`) and run
across 7 seeds (28 Halls floors, 140 floors total across all five ported regions) with no
`PAINT FAILED` lines; `standard:ruins`/`standard:chasm`/`standard:skulls` all confirmed selected
and painting without error across the run. Also verified live in-browser at depth 21 via
`window.__MWG__`: the Halls tileset (a distinct red/orange "molten" palette) and real lava-red
water render correctly, a `SkullsRoom`'s statue ring, `RuinsRoom` rubble clutter, and a `ChasmRoom`
void are all visible and visually distinct from each other and from every other region, locked
doors and ground items render, no console errors, `npx tsc --noEmit` and `npm run build` both
clean.

## `ShopRoom` (depths 6/11/16) - `spdItems/shopItems.ts`, `rooms/special/shopRoom.ts`

The last thing blocking depth 6. Its `minWidth()`/`minHeight()` call `itemCount()` ->
`generateItems()`, which dereferences `Dungeon.hero.belongings`, so earlier passes had
`initRooms()` throw for depths 6/11/16 rather than generate a shop-less floor and call it parity.
Reading the Java closely, that hero dependency turns out to be nearly inert for level generation:

- **`ChooseBag(pack)` makes ZERO `Random.*` calls** - it is pure `HashMap` logic. Backpack
  contents can only change *which* bag class comes back, never whether one does, and every bag is
  just "one more item" to `placeItems`. So all level generation needs is the **count**.
- That count is determinate without inspecting the live inventory: grepping the whole codebase, the four
  `LimitedDrops` bag flags are dropped in exactly two places - `HeroClass.initHero()` (velvet
  pouch, unconditionally, every class) and `ChooseBag()` itself. A run therefore starts with the
  pouch gone and three holders left, and each shop consumes one, so shops at depths 6/11/16 each
  add a bag and a fourth would add none. That is `bagsRemaining` in `shopItems.ts`.
- Hero creation cannot shift any level stream regardless: `Dungeon.init()` ends its seeded
  run-init block with `Random.resetGenerators()` (Dungeon.java:240) and only then builds the hero
  and calls `initHero()` (267-272).

| Java block | TS destination | Status |
| --- | --- | --- |
| `generateItems()`'s per-depth `switch` (`wepTiers[1]`/`misTiers[1]` + LeatherArmor at depth 6; tiers 3/4/5 and Mail/Scale/Plate at 11/16/20-21, plus 3 Torches at 20-21) | `shopItems.ts`'s `depthKit` | Ported |
| `generateItems()`'s full draw sequence (two `Generator.random(tier)`, `TippedDart.randomTipped(2)`, `IntRange(2,3)`, 2x `randomUsingDefaults(POTION)`, the 2x `Int(2)` potion-or-scroll loop, `Int(4)` bomb pick, `Int(10)` rare pick with its WAND/RING/ARTIFACT branches) | `generateShopItems` | Ported - verified marker-for-marker against the Java harness (identical draw sequence numbers 143-158) |
| `TippedDart.randomTipped`'s `do { randomUsingDefaults(SEED) } while (!types.containsKey(...))` | one `randomUsingDefaults(SEED)` | Ported - the loop provably cannot iterate twice: `types` has all 12 `Plant.Seed` classes (TippedDart.java:198-209), and `SEED.defaultProbs[0] = 0` makes Rotberry unreachable anyway |
| `Random.pushGenerator(Random.Long()); shuffle(itemsToSpawn); popGenerator()` | `generateShopItems`'s tail | Ported - the `Random.Long()` is on the LEVEL stream (one draw); the shuffle runs on the pushed substream and is invisible to layout, and cannot affect `placeItems`' draw count either way since that only tests whether a cell is occupied, never by what |
| `minWidth()`/`minHeight()` = `max(7, (int)(sqrt(itemCount())+3))`, with `itemCount()` lazily caching `generateItems()` | `room.ts`'s `'shop'` case + `shopStock()` | Ported - the laziness is load-bearing: the instance is built in `initRooms()` but `minWidth()` is first reached when the builder places the shop, and `setSizeWithLimit()` tests `minWidth()` *before* `setSize()`'s two `NormalIntRange` draws (Room.java:90-94), so the stock draws land ahead of the size draws, once only (the `build()` retry loop reuses the instance) |
| `new ShopRoom()`'s construction cost | - | Ported (nil) - `ShopRoom` extends `SpecialRoom`, NOT `StandardRoom`, so unlike `EntranceRoom`/`ExitRoom` it does not inherit the `{ setSizeCat(); }` initializer and burns no RNG when built |
| `paint()`: `fill(WALL)`, `fill(1, EMPTY_SP)`, `placeShopkeeper()`, `placeItems()`, all doors REGULAR | `rooms/special/shopRoom.ts` | Ported. `placeShopkeeper()`'s `center()` rolls a `Random.Int(2)` per odd-span axis; `placeItems()`' inner-ring walk falls back to a `Room.random()` retry loop on any cell already holding a heap, which is reached routinely (a 7x7 shop's ring holds 16 cells against ~20 items at depth 6) |
| `ChooseBag()`'s choice of *which* bag | `'Bag'` label, +1 to the count | Simplified deliberately - no draws exist to reproduce, and the identity is invisible to layout (it also depends on JVM `HashMap` iteration order, so it is not reproducible even in principle) |
| `TimekeepersHourglass` sand bags and `timeFreeze` | `shopItems.ts` hourglass state, `main.ts` item bridge/pickup/save/action scheduler | **Partially ported.** Identified, uncursed hourglasses now add `ceil((5 - sandBags) * 0.20f)` bags at depth 6 (0.25/0.50/0.80 at 11/16/20-21), capped at the remaining five; picking up a bag upgrades the hourglass, rejects missing/cursed hourglasses without consuming it, and persists the custom sand count. Concrete `TimekeepersHourglass`/`sandBag` identities are retained through generated drops and saves. The active freeze action now pauses automatic actors, lets hero actions proceed without scheduler time, consumes one charge every two hero-time units, queues trap/plant presses, cancels on attack/magic, and persists its timer. `timeStasis`, artifact recharge cadence, visuals, and exact charge/fractional-time presentation remain unported |
| `Stylus.INSCRIBE` / `Stylus.inscribe(Armor)` | `useStylus`, generic item picker, `GLYPH_TABLE` | **Simplified but playable:** the picker accepts the armor families represented by this port and rejects unidentified or cursed armor before consuming the stylus, then assigns one random good glyph from the real table. Java's two-turn busy cost and inscription/purple-particle presentation are not modeled because this port has no matching animation/timing seam; equipped armor is not exposed by the bag-only picker. |
| `ShopRoom` concrete weapon/armor stock and `Shopkeeper.canSell`/`WndTradeItem.sell` | `itemKinds.ts`, `shopPricing.ts`, `main.ts` shop picker/buyback | **Ported for supported gear:** generated concrete weapons/armor now become level-0, uncursed `weaponReward`/`armorReward` payloads retaining Java class and tier; Java's `20 x tier` value formula (including known curse/good-affix/identified-level modifiers) is used for purchase and sale pricing. The picker sells one unit of any positively-valued supported item, not food only. Tipped darts, brewed spells, and distinct bag implementations remain unported. |
| `Grim.proc()` / `Char.damage()` + `GrimTracker` | `main.ts` central `attack()` damage boundary | **Ported:** after damage is committed, the real `(0.5 + 0.05 * buffedWeaponLevel) * Arcana` chance is multiplied by the squared missing-HP fraction; success deals `round(currentHP)` extra damage and can finish the target. This replaces the former flat 15%/15-damage stand-in and also works for Unstable's delegated Grim. |
| `Lucky.proc()` / `LuckProc` | `main.ts` `heroOnHit` lethal-enchant branch | **Ported gate and placement:** lethal hits now use Java's `(buffedLevel+4)/(buffedLevel+40) * Arcana` chance and place the deferred bonus in the corpse cell or a free neighbour. The reward catalogue remains the documented common/uncommon potion/scroll/stone/armor stand-in because the full Wealth rarity generator is not yet represented. |
| `WandOfBlastWave` identity, `onZap()` damage/knockback | `main.ts` `wandTypeFromSource` and zap dispatch | **Simplified but playable:** Blast Wave now survives generated wand identity, deals its real level-scaled `1+level..3+3*level` magic damage to the target-centred 3x3 area, and pushes living victims outward by the real `1+round(level/2)` strength. Java's Ballistica cone, cell-press side effects, collision damage, and delayed pushing presentation remain simplified. |
| `Entanglement.proc()` / `Earthroot.Armor` | `main.ts` armor-glyph defense hook | **Ported with status substitution:** Arcana-scaled 1/4 proc chance and `round((5 + 2*buffedArmorLevel) * max(1, chance))` duration are now exact; the port stores that duration in its existing `cripple` movement-lock buff because it has no distinct Earthroot armor object. |
| `Potential.proc()` / `Belongings.charge()` | `main.ts` armor-glyph defense hook + `Actors.Charges.advance` | **Ported:** Arcana-scaled `(level+1)/(level+6)` proc chance and fractional `max(1, chance)` charge progress are retained through the framework charge resource, rather than incorrectly refunding a whole charge. |

### The bug this exposed in the SHARED core (pre-existing, not shop-specific)

**`paintDoors`' `roomMerges` bookkeeping omitted entrance/exit rooms.** Java writes
`((StandardRoom) r).sizeCat == NORMAL` with an UNCONDITIONAL cast, and `EntranceRoom`/`ExitRoom`
both *extend* `StandardRoom` - so they are recorded in `roomMerges` like any other normal-size
room, which is what caps a room at one merge. This port tested `r.kind === 'standard'`, which
excludes the separate `'entrance'`/`'exit'` kinds, so an entrance or exit could merge with a
second neighbour Java refuses. Each extra merge swallows a door, removing its hidden-door
`Random.Float()` from `paintDoors` and desyncing the stream for the rest of the floor.

Found by trace-diffing `999999999999:6`: Java merges `ExitRoom`+`PillarsRoom` and then *declines*
`ExitRoom`+`FissureRoom` (falling through to the door branch, its 13th roll), while this port
merged both and rolled 12. Note the cast is safe in Java only because a merge can succeed solely
when both rooms are `StandardRoom` subclasses - `Room.canMerge()`'s base returns false, so
`mergeRooms` fails for every special/secret/connection room.

Also corrected while tracing, though it was not the cause: the `SOLID` terrain set used by
`canMerge` was missing `LOCKED_EXIT`, `SIGN`, `STATUE`, `STATUE_SP` and `ALCHEMY`, which would let
a merge expand across a statue or alchemy pot that Java stops at. It is now read exhaustively off
`Terrain.java`'s static initializer. Unreachable on the floors verified so far (none of those
tiles lands adjacent to a merge candidate), but wrong.

### Verification (harness sequence 1,2,3,4,6,7,8,9 per seed; 4 seeds = 32 floors)

**All 28 floors at depths 2-9 are MAP EXACT MATCHES on every run, including all four depth-6 shop
floors.** Across five runs of the unmodified Java harness the score was 32/32 four times and
29/32 once, and every floor that ever differed was depth 1 or depth 2 - exactly the floors
documented above as non-reproducible in Java itself (`EntranceRoom.paint()`'s unseeded guidebook
generator, and depth 2's unfound searching page).

Depth 5 remains the only omitted floor: `SewerBossLevel` extends `Level`, not `RegularLevel`. That
omission does not desync depths 6+, because `secretsForFloor()`/`initForFloor()` are reached only
from `RegularLevel.initRooms()` and the harness skips `createItems()` on every floor, so a boss
floor mutates none of the run-level state (`SecretRoom`'s budget, the `SpecialRoom` queue,
`Generator`'s decks) that later floors read.

One residual worth recording honestly: on an earlier run `1:1` differed by 25 cells in three
consecutive comparisons, which looked too stable to be chance - but trace-diffing it showed the
two sides consume an **identical** 3375-draw stream, and it has matched exactly on every run
since. So the port's randomness is exact there, and the earlier difference was Java's own depth-1
nondeterminism after all; no port-side cause was found or is believed to exist.

The harness now builds a bare `Hero` (empty backpack) plus `LimitedDrops.reset()` +
`VELVET_POUCH.drop()`, rather than running `HeroClass.initHero()` - which would drag in
Talent/Badges/quickslot state the harness has no business booting. Per the `ChooseBag` reasoning
above this costs no fidelity, since the backpack can only change which bag is offered.

## Integration: the ported generator in the live game (`spdLevelGen/gameBridge.ts`)

`main.ts` now generates Sewers 1-4 and Prison 6-9 from `spdLevelGen/` instead of
`generateSpdDungeon`. Every other depth (5, 10+, all boss floors) still uses the generic
generator, because this port does not generate hand-authored arenas or the three regions past
the Prison. `generateSpdDungeon` is therefore still live and was left untouched.

**Generation is driven exactly as the Java harness drives it**, because anything else would
produce a floor that was never verified: `gameBridge.ts` runs `Dungeon.init()`'s run-level
resets once per run seed, then generates floors in strict ascending depth order (1,2,3,4,6,7,8,9)
and caches them. The cache is what makes this safe - `SecretRoom`'s budget, the `SpecialRoom`
queue, `Generator`'s decks and the shop's bag counter are all consumed floor by floor, so
re-entering a floor would otherwise consume that state twice. A consequence worth stating: on a
ported depth the *terrain* you climb back down to is the floor you left, where the generic
generator used to re-roll it. Mobs, items and opened doors are still rebuilt (see the row above).

**Confirmed unchanged by integration**: 30/32 maps byte-identical to the Java harness after
wiring, the two exceptions being `123456789:1` and `42:2` - the same depth-1/depth-2 floors
documented above as non-reproducible in Java itself. No generated byte moved.

### The terrain mapping, and what it loses

The generator speaks real `Terrain.java` constants (0-31); `main.ts` implements eight coarse
kinds. The mapping is therefore many-to-one. **Passability is preserved in every case**;
behaviour is not. `main.ts` owns the numeric ids and passes them in (`GAME_KIND_CODES`), so the
two halves cannot drift silently, and an unmapped `Terrain` value is a hard error rather than a
wrong tile.

| SPD terrain | mapped to | what is lost |
| --- | --- | --- |
| `CHASM` | `floor` with raw pit frame | Java lets the hero enter a chasm and fall to the next floor, and chasms do not block line of sight. The coarse collision kind is now open while raw CHASM keeps the pit atlas frame; the movement boundary still prevents non-hero mobs from stepping into pits. |
| `BARRICADE` | `wall` | Java's is flammable and can be burned through; permanent here |
| `STATUE`/`STATUE_SP` | `wall` | Java's animate into a `Statue` mob on contact; scenery here (the mob is not spawned either way - mob generation is not ported) |
| `BOOKSHELF`, `ALCHEMY` | `wall` | Searchable / craftable in Java; scenery here |
| `LOCKED_EXIT` | `wall` | Boss-floor gating; unreachable on the ported regular floors |
| `WELL`, `EMPTY_WELL` | `floor` | Java's wells hold a `WellWater` effect |
| `SIGN` | `floor` | Java shows its text on contact |
| `PEDESTAL` | `floor` | Holds the Amulet on Java's last floor |
| `EMBERS`, `EMPTY_SP`, `EMPTY_DECO`, `INACTIVE_TRAP` | `floor` | Cosmetic in Java too (an `INACTIVE_TRAP` is a sprung one) - only the distinct sprite is lost |
| `CRYSTAL_DOOR` | `doorClosed`, locked by `crystalKey` | Ported - queued crystal keys from `Level.itemsToSpawn` are placed on valid room cells after painting; exact Java `randomDropCell()` room-selection parity remains simplified |
| `LOCKED_DOOR` | `doorClosed`, locked by `ironKey` | The same stand-in key the generic path uses; Java's key placement needs drop logic this port has none of, so the key still comes from a guard |
| `SECRET_DOOR`, `SECRET_TRAP` | concealed via `Secrets`, not mapped directly | Correctly render as their disguise (`wall`/`floor`) until searched out |
| `WALL_DECO` | `wall` | Cosmetic |
| everything else | 1:1 | `EMPTY`/`GRASS`/`HIGH_GRASS`/`WATER`/`DOOR`/`ENTRANCE`/`EXIT`/`TRAP` map directly |

Trap **behaviour** was never ported, only class names and weights (which is what `Random.chances`
and `avoidsHallways` need). `gameBridge.ts`'s `TRAP_BEHAVIOUR` routes each real class to one of
the five effects `main.ts` implements. Only `toxic`, `burning`, `poisonDart` and `wornDart` are
genuine matches; `chilling`, `shocking`, `alarm`, `ooze`, `gripping`, `confusion`, `flock`,
`summoning`, `teleportation`, `gateway` and `geyser` are stand-ins, since their real effects
(freezing, chained lightning, waking the floor, corroding, rooting, confusing, summoning,
teleporting, gateways, launching the hero) need systems this port has none of. A trap in the
verified grid still does *something* when stepped on rather than being dropped.

### Integration bugs found and fixed while wiring

Four, all in `main.ts`'s own post-generation passes, which had assumptions only the generic
generator satisfied:

1. **The generic terrain passes had to be skipped.** `placeWaterPool`/`placeGrass`/`placeDoors`/
   `placeHiddenTraps` *invent* plausible water, grass, doors and traps. A ported floor already
   has all four in Java's own positions at Java's own fill numbers, so running them would
   overwrite precisely the output that was verified. They are now gated, and the floor's real
   doors/secret doors/traps are adopted from the grid instead (`adoptPortedFeatures`).
2. **`rooms[0]` is not the hero's room on a ported floor.** Every spawn site used
   `Random.int(1, rooms.length)` to skip index 0, which is the entrance room by construction in
   the generic generator. A ported floor's order is whatever `LoopBuilder` and then
   `RegularPainter`'s in-place shuffle produced, so index 0 means nothing; the hero's own cell is
   now excluded explicitly instead (`randomSpawnRoom`).
3. **`populate()` never checked passability.** It only checked for another creature, which was
   survivable when a room's interior was all floor. A ported floor puts far more solid terrain
   *inside* the room rect - chasms, statues, bookshelves and maze walls all map to `wall` - so
   monsters could spawn inside rock. Now guarded and retried.
4. **Every NPC spawn used `rectCenter(room)` unconditionally.** Safe on a generic floor, not on a
   ported one: a `SecretMazeRoom`'s centre is maze wall, a `CircleBasinRoom`'s is water, and
   anything folded onto `wall` can sit dead centre - sealing the NPC in solid rock. Replaced with
   `standableCellIn`, which prefers the centre and falls back to any passable cell.

Also fixed: `searchForSecrets` announced every discovery as "a hidden trap", which is wrong now
that real `SECRET_DOOR` cells are concealed too.

### Verified structurally

`tools/scratch/checkBridge.ts` walks all 32 ported floors and checks what a renderer and the
gameplay depend on: that the mapping covers every emitted `Terrain` value, that each floor has an
entrance and an exit, and that **the exit is reachable from the entrance through the mapped
terrain** (bumping closed doors open). Result: the exit is reachable on all 24 floors at depths
3,4,6,7,8,9, and the terrain mixes look right (real water, grass, high grass, doors, traps).

The 8 depth-1 and depth-2 floors report the exit as *unreachable*, and this is **faithful, not a
bug**: with `SPDSettings.intro()` true - a fresh install, which is what this port always is -
Java makes every entrance-room door a `SECRET_DOOR` as its search tutorial, so the hero genuinely
starts sealed into the entrance room. Re-running the same reachability check with secret doors
treated as walkable makes the exit reachable on all 8, which is the decisive test: the seal is the
tutorial, not a mapping error that walled the stairs off. `searchForSecrets` checks all 8
neighbours, so the doors are findable and every ported floor is completable.

### Browser verification: done, and what it took

**A ported Sewers floor 1 now renders and plays.** Confirmed from a screenshot of the built page
opened at `file://`: real rooms and corridors, brick walls and floor at the right tiles, a door
sprite, the hero and a marsupial rat drawn on it, the FOV's lit region bright against the dimmer
remembered one, and a message log reading "You open the door." / "A marsupial rat hits you for 0."
- so terrain, doors, spawns, FOV and turn resolution are all working off the ported grid.

Getting there turned up a bug that had nothing to do with level generation, and had been
black-screening the whole game regardless of it: **`registerColorTransform` was never called.**
mwg's commit `0bbf241` ("decouple core from render") stopped `Game` registering its own render
extensions and moved that to `GameOptions.extensions`; this project was written against the older
mwg and never updated. Pixi only accepts a custom render pipe registered *before* the renderer is
created, so it cannot be done lazily on first use - and every `TintedSprite` here (hero, monsters,
items, both staircases) draws through that pipe. The first frame drawing one threw
`renderPipes[renderPipeId] is undefined` inside Pixi's render-group walk and killed the renderer.
`new Game({ extensions: [registerColorTransform] })` is the fix.

Two lessons worth keeping, both already written into `CLAUDE.md` and ignored on the way in:

- **`node_modules/mwg` is a symlink to the live `MW_games` checkout**, which can hold another
  session's uncommitted work. Check its commit once per session *before* trusting its API. That
  check would have found this immediately instead of after a long hunt through the level port.
- **A canvas game that throws during start-up looks exactly like a rendering bug in whatever was
  changed last.** Structural checks all passed and the generated data was provably sound, which is
  precisely why the failure was misattributed. `index.html` now carries a `window.onerror` overlay
  that prints the exception and stack onto the page, so a black screen states its own cause; note
  that at `file://` the browser sanitises the message to "Script error." and the real text is only
  in the devtools console.

`tools/scratch/checkBridge.ts`'s structural pass above remains the cheap regression check; the
visual pass is what it cannot replace.

Still not visually checked: the deeper ported floors (2-4, 6-9) and the degraded tiles in the
mapping table below - `CHASM` in particular, which now keeps its raw pit frame while using open
collision for hero/FOV behavior.

## UI and presentation (`ui/*`, `windows/*`, `scenes/GameScene.java`, `effects/*`)

Until this section existed, the whole in-game interface was **two `Label`s**: one ~300-character
status line that concatenated place, seed, level, HP, four stats, gold, waterskin, hunger, a
comma-joined list of buff keys, wand charges, ammo, *the entire bag as text*, and a literal
keybind cheat-sheet - plus a five-line log in one dim colour with no wrapping. Combat fed back a
single white frame-flash and nothing else. None of that gap was recorded here, so every row below
was previously an undocumented omission rather than a stated one.

**Correction, from a reimplementation audit against the current `MW_games` checkout:** this
paragraph previously claimed `Button` was implemented port-side because `mwg/ui` lacked one.
That was already wrong when written - `Button` has only ever come straight from `mwg`
(`import { ..., Button, ... } from 'mwg'` in `main.ts`; there is no `src/ui/button.ts`), and
this port even contributed `Button.resize()` upstream into `mwg` itself rather than
reimplementing around the gap. The real port-side widgets are `src/ui/bar.ts` and
`src/ui/floatingText.ts`, written game-agnostically under the same "could move into `mwg`
later" intent - but `mwg` has since grown its own `Bar` and `FloatingText` too (again, version
drift: `mwg` is a local dependency, and its exported surface must be re-checked, not assumed,
each session - see this file's CLAUDE.md). Neither is a safe swap: `mwg`'s `Bar` cannot take a
texture fill or reproduce `HealthBar.layout()`'s ceil-to-pixel rounding, both load-bearing for
this port's own verified real-Java-parity claims (see "Verification" below); `mwg`'s
`FloatingText` fades linearly over its whole lifetime with no per-target stacking, not the real
Java curve this port's own version reproduces. Both `src/ui/bar.ts` and `src/ui/floatingText.ts`
now say this directly in their own header comments, rather than pointing at a promotion that
would be a regression if taken today.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Chrome.Type.WINDOW` = `NinePatch(chrome.png, 0, 0, 20, 20, 6)`, `Window.TITLE_COLOR`, `CharSprite`'s status palette | `src/ui/spdTheme.ts` `applySpdTheme`, called from `main()` before any widget exists | Ported - the real 20x20/border-6 region and the real colours, so every `Window`/`ListView`/`IconGrid` built later inherits SPD's frame |
| `PixelScene.pixelFont` / `RenderedTextBlock` (SPD's bitmap fonts in `assets/fonts/`) | `pixel_font.ttf` + `loadSpdFont()`/`applySpdTheme()` | Ported through SPD's supplied scalable pixel-font face: it is bundled, registered as `SPD Pixel` before any UI is built, and selected by the global UI theme. System fallbacks remain after it for translations whose glyphs are not in the Latin face. |
| `ui/GameLog.java`'s severity colours (`GLog`'s `++`/`--`/`**`/`@@` -> `CharSprite.POSITIVE/NEGATIVE/WARNING/NEUTRAL`), same-colour merging, and dropping the oldest block by *line* count | `src/ui/gameLog.ts`, `say(line, level)` | **Divergence (deliberate)**: severity colours and dropping the oldest block by line count are ported, but Java's same-colour concatenation is not - each message stays its own block so rapid messages remain readable as separate lines, at the cost of the vertical space Java saves by merging. Severity is also an argument rather than a prefix encoded into the string and parsed back out, and `MAX_LINES` takes the larger 5 since this port has no `SPDSettings.interfaceSize()` |
| `GLog`'s severity at each message site | ~106 of 142 `say()` calls tagged | Simplified - the calls where colour carries information (damage taken, deaths, pickups, heals, hunger, boss turns) are tagged; the rest default to `info`. Multi-line `say(` calls are untagged |
| `effects/FloatingText.java` (`LIFESPAN = 1s`, `DISTANCE = DungeonTilemap.SIZE`, alpha held to half-life then linear), `CharSprite.showStatus` | `src/ui/floatingText.ts`, `showStatus`/`showDamage`/`showHeal`, spawned at 19 damage/heal sites | Ported (timing, rise distance, fade curve, `CharSprite` colours). Simplified: Java stacks texts per-target via a `key`; this stacks by proximity, so it needs no key bookkeeping from callers |
| `Buff.java`'s `announced` flag (buff name shown over the creature as it lands) | `announceBuff` hook + `ANNOUNCED_BUFFS`, called from `addBuff` | Simplified - a hook, because `addBuff` is module-level with ~60 call sites none of which hold a scene. The announced set is chosen here rather than read from a per-buff flag this port's buffs do not have |
| `ui/HealthBar.java` (`COLOR_BG 0xCC0000`, `COLOR_HP 0x00EE00`, fill rounded up to a whole pixel) and `ui/CharHealthIndicator.java` (`width*4/6`, offset `width/6`, 2px above the sprite, shown only while `HP < HT`) | `src/ui/bar.ts`, `refreshHealthBars` | Ported (colours, geometry, visibility rule, and the ceil rounding that stops a sliver of health vanishing). The port has shielding mechanics; only Java's exact shield-overlay sprite treatment is absent. |
| `ui/Compass.java` - `atan2(cell.x - centre.x, centre.y - cell.y)` (note the argument order: 0 degrees is up), `RADIUS = 12` pivot, hidden until the target is `visited`/`mapped` and never hidden again | `src/ui/compass.ts` | Ported, using `Icons.COMPASS`'s real 7x5 region at (16,72). It points at `exit()`; Java points at `entrance()` instead once the Amulet is taken, which this port does not model |
| `SewerLevel.addSewerVisuals`/`Sink`, `Level.java`'s generic `tileName`/`tileDesc` plus every region's own `*Level.java` overrides (`Sewer`/`Prison`'s `water_name`/`empty_deco_desc`/`bookshelf_desc`; `Caves`/`City`/`Halls`'s own `water_name`/`grass_name`/`high_grass_name`(+`_desc`)/`entrance_desc`/`exit_desc`, each checked directly against its real class - see `examineWaterName`/`examineGrassName`/`examineHighGrassName`/`examineEntranceDesc`/`examineExitDesc`'s own doc comments for exactly which regions override which key) | `src/ui/wallDecorations.ts`'s `WallDecorationLayer`, `examineTile` + a new `L`/"Look" action (`main.ts`) | Ported for all five regions, not just Sewers/Prison - a decorative particle emitter (Sink's real blue-green falling droplets, `pour(factory, 0.1f)`, colour/size/lifespan/gravity all real; City's `Smoke` likewise, see the City section above) at every real `WALL_DECO` cell `sewerPainter.ts`/`prisonPainter.ts`/`cityPainter.ts`'s already-verified decoration passes place (Caves has no such particle - its own `WALL_DECO` is an undecorated ore vein; Halls has no `WALL_DECO` particle either, but gets its own unconditional `WaterEmberLayer` over every `WATER` cell instead - `HallsLevel.Stream`/`FireParticle`, see the Halls section above), visible only in the hero's current FOV like Java's own (`heroFOV`-gated `Sink`/`Torch`/`Smoke`/`Stream`); and a free "Look" action reading the real per-tile name/description text for all eight of this port's coarse terrain kinds. `water_name`/`grass_name`/`high_grass_name`(+`_desc`)/`exit_desc` work on every depth regardless of generator, since they only need `regionForDepth` and (for `exit_desc`) `this.stairs`, both tracked unconditionally; `ENTRANCE`/`EMPTY_DECO`/`BOOKSHELF`/`WALL_DECO`/`STATUE`/`STATUE_SP`/`EMPTY_SP` (and `Sewer`/`Prison`/`City`/`Halls`'s overrides for them) stay ported-floor-only, resolved from the ported floor's own raw, retained `PaintLevel` grid, since the coarse kind system otherwise collapses them into indistinguishable `wall`/`floor`. Not reproduced: `Sink`'s own real second half, a ripple on the water tile below it (`GameScene.ripple()`) - this port's water tiles have no ripple system; `Torch`'s real soft radial-gradient `Halo` is a plain low-alpha filled circle instead; Caves gets no `Sink`/`Torch`/`Smoke`/`Stream`-equivalent decoration at all, since without a matching real particle there is no real placement data to draw one from, and inventing one would violate this file's own no-undocumented-invention standard. New real SPD keys extracted via the normal `npm run i18n` pipeline (189 keys total now, up from 167) - see `levels.level.*`/`levels.sewerlevel.*`/`levels.prisonlevel.*`/`levels.caveslevel.*`/`levels.citylevel.*`/`levels.hallslevel.*`. One real bug caught and fixed in the same pass: the first draft used a computed template-literal key (`` t(\`levels.${region}level.water_name\`) ``) for the per-region lookup, which `tools/i18n-extract.mjs` cannot see (it only scrapes literal `t('...')`/`t("...")` string arguments) - the key would have silently resolved to nothing and printed the raw key text in play. Rewritten as explicit per-region literal calls, one per real Java override, verified by directly diffing each region's actual key list against its own `*Level.java` rather than assumed |
| `TitleScene.java` menu, `Chrome.GREY_BUTTON_TR`, title signs | `src/scenes/titleScene.ts`, `src/ui/spdButton.ts`, `src/ui/titleIcons.ts` | Ported: Java landscape/portrait button geometry, native icon regions including GOLD and PREFS, translucent button chrome, version footer, additive pulsing signs. Integer menu zoom is capped at 3; browser density/settings do not reproduce every PixelScene scale preference. |
| **Real bug, not a Java-parity gap**: `banners.png`'s title art was redrawn at some earlier point from real SPD's "SHATTERED"/"PIXEL DUNGEON" (preserved as `banners old.png`) into this port's own "MWG"/"Pixel"/"Dungeon" branding, but the redraw is three stacked lines instead of Java's two and was never re-measured against the frame rect that crops it - `title`'s `Rectangle(0,0,132,90)` clipped the bottom half of "Dungeon" clean off (confirmed by cropping the raw asset: the full 3-line logo needs 108px, and 90-108 bleeds into the next sprite, `BossSlain`'s sword, starting at y=109). Separately, the two flanking `TitleFlame` torches were hardcoded at the frame-centred x-offsets (22/110) tuned for the old asset's evenly-filled 0-131 width; the new asset's "Pixel" line (the one they sit level with) is narrower and left-shifted (x≈8-110, centre 59 vs the frame's own 66), so the right torch sat visibly farther from the letters than the left one. Found live via browser screenshot (both the crop and the asymmetry), not from a code read. | `src/scenes/titleScene.ts` (`title`/`signs` frame height 90→108, `title.position.set`'s centering math updated to match, torch offsets 22/110→15/103) | Fixed three ways, all confirmed live: (1) frame height raised to 108 so "Dungeon" renders in full with no bleed from the sword sprite below it; (2) torch x-offsets recentred on the "Pixel" line's actual glyph midpoint (59) instead of the frame's geometric centre (66); (3) since that glyph-centred offset moved the torches off true screen centre relative to the whole group, a `GROUP_X_OFFSET = 7` shifts `title`/`signs` (and everything anchored off `title.x`) right by the same 66-59=7px delta, so the torch/glyph-centred layout also lands the whole logo+torches composite dead-centre on screen (measured post-fix: composite centre x=538 vs screen centre x=539, a 1px difference at 1078px width). |
| Language selection | `TitleScene.showSettingsWindow` | Simplified: cycling languages is now inside Settings; the extra ninth title-menu button was removed to match Java. The full Java settings tabs are not ported. |
| `Icons.LANGS` on SPD's own real language-settings icon (`WndSettings`'s language row) | `titleIcons.ts`'s `langs` region (`uvRectBySize(80,32,14,11)`) applied to the title screen's language-cycle button, and to the same button relocated into the new Settings window | Ported - real pixel region, not invented placeholder art. Note this is SPD's own generic language icon, not a per-language flag: SPD ships no flag art at all (a language is not a country, and SPD's own UI never shows one) |
| **Real bug, not a Java-parity gap**: `btnSupport`/`btnRankings`/`btnNews`/`btnSettings`/`btnBadges`/`btnChanges`/`btnAbout` had no `onClick` at all before this pass - seven of eight title-screen buttons (everything except Play) did nothing when clicked, found from a user screenshot rather than a code read | `TitleScene.showInfoWindow`/`showSettingsWindow`/`showBadgesWindow`, a `mwg/ui` `WindowStack` pushed onto the scene | Fixed. Support/Rankings/News/Changes open a plain single-message `Window` with real, honest text (this port tracks no rankings and no news feed, and keeps no changelog - stated as such rather than inventing fake data); About shows the port's real version (`vite.config.ts`'s `define`, read from `package.json` at build time), license and attribution; Settings holds the real version plus the language-cycle button (moved off the main menu into here, alongside it); Badges shows a real `ListView` of this port's own `BADGE_DEFS` achievements with real locked/unlocked state and progress counts read from the same `Achievements` store a run writes to. None of `RankingsScene`/`NewsScene`/`ChangesScene`/`AboutScene`/`SupporterScene`/`WndSettings`/`BadgesScene`'s real Java layouts are reproduced - this is a bounded fix for "the button does nothing," not a port of those scenes |
| `ui/Archs.java` (`arcs1.png`/`arcs2.png` scrolling at `SCROLL_SPEED = 20`px/s, foreground at 2x, plus a right-edge dark gradient) | `src/ui/titleBackground.ts`'s `TitleBackground`, `main.ts`'s `TitleScene` | Ported - real byte-for-byte `arcs1.png`/`arcs2.png` art (renamed `ui_arcs_bg.png`/`ui_arcs_fg.png`), same scroll speeds, and the same 5-stop gradient alpha values (`0x00/0x22/0x55/0x99/0xEE`) as a `FillGradient` instead of Java's rotated 1px gradient image - a mechanical simplification, same pixels. This was an undocumented gap: the title screen previously drew a static placeholder grid instead, found by a user screenshot rather than a code read |
| `effects/Fireball.java`'s two title-screen torches (`placeTorch` at the title art's top corners) - spinning glow/flare, `Emitter.pour(..., 0.1f)` flame quads capped at `heightLimit`, `Random.Float() < Game.elapsed` sparks | `src/ui/titleFlame.ts`'s `TitleFlame`, `main.ts`'s `TitleScene` | Ported - real byte-for-byte `fireball.png` art (renamed `effect_fireball.png`), the same spawn rates, speeds/accelerations and the exact fade curve (`p > 0.8f ? (1-p)*5 : p*1.25f`) from `Flame.update`. Simplified: a small local particle array stands in for Java's shared `Emitter`/`PixelParticle` pool - same visible behavior, no shared particle-pool machinery. This was an undocumented gap: the two torches were entirely missing, found by a user screenshot rather than a code read |
| `ui/StatusPane.java` small layout: `NinePatch(status_pane.png, 0,0,128,36, 85,0,45,0)`, HP fill `(0,36,50,4)`, shielded `(0,40,50,4)`, EXP `(0,44,16,1)`, and `hp.scale.x = max(0,(health-shield)/max)` / `exp.scale.x = (width/exp.width)*exp/maxExp()` | `src/ui/statusPane.ts` | Ported (frame, bar rects, both fill formulas). The EXP fraction converts `mwg`'s cumulative `Progression` total back to Java's per-level `exp`/`maxExp()`, verified equal to `5 + lvl*5` |
| `ui/BuffIndicator.java` + `ui/BuffIcon.java` - 7x7 icons from `buffs.png`, indexed by `BuffIndicator`'s own constants, skipping `icon() == NONE` | `statusPane.ts`'s `BUFF_ICON` map, all 12 buffs this port models | Ported (real indices, incl. Monk `Focus`'s `MIND_VISION` icon and its green hardlight). Simplified: the row is rebuilt outright rather than tweened in and out with Java's `AlphaTweener` |
| `StatusPane`'s shielded-HP and raw-shielding overlay images | `src/ui/statusPane.ts`, `main.ts`'s `heroShield` | Simplified/ported behavior - shielded HP is rendered as a distinct remaining-health fill, with the raw shield amount exposed in hover stats; the exact Java overlay sprite art is not yet reproduced |
| `StatusPane` hero avatar and compass placement | `src/ui/statusPane.ts`, `main.ts` | Ported for starting cloth armor: HeroSprite avatar crop, level at (27.5,28), XP at y=0, compass centered on portrait. Simplified: avatar does not change with armor, and port-only stats appear on hover rather than in WndHero. WndHero, BusyIndicator, CircleArc and talent blinking remain unported. |
| `SPDSettings.interfaceSize()`'s `large` variants throughout (`StatusPane`'s 128x9 bars, `large_buffs.png`, `InventoryPane`'s wide layout, `GameLog`'s 5-line mode) | - | Not ported - one fixed interface size, so `large_buffs.png` is not even copied |
| The bag, itemised on screen | `InventoryWindow`, item-action windows, `itemDisplayName` | Simplified - it separates equipment from carried items, exposes affixes/curses, supports concrete weapon/armor/ring instances and activates food, potions, scrolls, rings and armor. Sub-bags and full Java item descriptions remain unported. |
| **Avoidable reimplementation, fixed**: `refreshInventoryPanel` (`main.ts`) used to hand-roll a rebuild-from-scratch column of text-only `Button` rows for the bag - no scrolling or clipping at all, so `height = 34 + rows.length * 18` grew unbounded and a large bag could run the panel off the bottom of the viewport | `mwg/ui`'s `ListView`, built once and driven through `setItems`/`resize` (`main.ts`'s `inventoryList`, `refreshInventoryPanel`, `buildInventoryRowIcon`) | Fixed - the panel is now a fixed `INVENTORY_ROW_HEIGHT * INVENTORY_VISIBLE_ROWS` (6 rows) tall regardless of bag size, with `ListView`'s own real masked scrolling and keyboard `up`/`down`/`confirm` (routed from `onAction` while `inventoryOpen`, mirroring what `WindowStack` gives a real `Window` - the panel is not one, it is a toggled HUD element). `ListView` has no built-in pointer/click support (unlike `IconGrid`, which was the other candidate here but needs a per-item `icon: Container` this port has no full id-to-sprite-frame table for yet - out of scope for this fix, `ITEM_FRAME` only covers the smaller ground-item-kind set), so each row's `ListItem.icon` slot is filled with the row's entire clickable surface instead of a small icon (a full-row hit `Graphics`, the same "a plain hitArea rect misses pointer events; an actual filled one does not" trick `TitleScene`'s own `catcher` already relies on, plus the row's real text, since `ListItem.text` is left `''` so `ListView`'s own auto-label renders nothing) - `ListView` positions and scrolls that `icon` as a normal child of its own masked, scrolled row, so click-through-scroll works with no need to read any of `ListView`'s private scroll state from outside. Verified in a real browser: bounded height at 7 items (was previously going to overflow), scroll-into-view on keyboard `down` past the visible 6, pointer click on a scrolled-to row correctly selecting and using that specific item (`requestedItemId`) |
| `ui/Toolbar.java`'s discoverable action controls | `buildInterface`'s pointer/touch action bar | Simplified - eleven compact buttons route to the same turn actions as the keyboard bindings, including explicit wait and save/load; the bar wraps to two rows on narrow screens, while cell targeting, drag gestures and the full toolbar layout are not ported |
| `GameScene.java`'s cell selection for movement, `Hero.travel()`'s repeated movement | `handleMapPointer`, `stepTravel`, `travelTarget`/`travelStartHp` fields | **Player-reported bug, now fixed: clicking a distant tile previously always took exactly one step toward it, with no auto-walk at all** - a real, immediately-noticeable gap from Java's click-and-it-walks-there behavior, not merely a documented simplification. Now ported: a click beyond one step away queues the target and walks the real pathfinder's route (`this.pathfinder.find`, already used for monster AI) one step per turn via the existing `awaitHeroInput` hook, re-pathing every step so other creatures moving into the route are avoided. Interrupt conditions match Java's real "stop and let the player decide" cases - taking damage, or a hostile creature coming into sight - simplified to checking *any* such creature currently visible rather than Java's narrower *newly* seen one (a stated, safer-not-looser simplification); travel also cancels cleanly on arrival, when the path becomes unreachable, or on any manual keyboard action (so a stale queued travel can never silently resume after the player takes explicit control). Browser-verified live: a clear 3-tile click walked the full distance in a single call chain with zero further clicks, and a click issued with a hostile monster already in view correctly refused to take even one step, matching Java's real immediate-refusal behavior. Not ported: path preview (the visual line/highlight while aiming) and explicit non-adjacent cell/target selection for actions other than movement. |
| `ui/InventoryPane.java`, `windows/WndBag.java`, `windows/WndUseItem.java`, `ui/QuickSlotButton.java`, `scenes/GameScene.java`'s `CellSelector`/`selectCell`/`examineCell`, `journal/Document.java` + `WndJournal`, `ui/BossHealthBar.java`, `ui/Banner.java`, `ui/Toast.java`, `windows/WndGame.java` | `InventoryWindow`, `createJournalWindow`, `bossNameLabel`/`bossHealthBar`, `victoryPanel` | Simplified - the live bag now opens item actions, and the Journal exposes all five translated region documents plus live quest status. Detailed item-grid tabs, cell targeting, journal item-identification tabs and banner/toast animations remain |
| `ui/BossHealthBar.java`'s real `boss_hp.png` chrome | `bossChrome` + `bossHealthBar` (`main.ts`) | Ported - `interfaces/boss_hp.png` is copied byte-for-byte and rendered at integer 4x scale; the live HP bar occupies the Java frame's own `(15,3,47,4)` inset. Exact Java shield-overlay art remains unavailable. |
| `BossHealthBar.bleed()` (skull tints red + a blood `Emitter` turns on once `hp.scale.x < 0.25f`), and `bossInfo`'s click opening `WndInfoMob` | `refreshHealthBars`' edge-triggered `bossBleeding` + `bossHealthBar`'s `pointerdown` (`main.ts`) | Ported the low-HP cue and the click, simplified their form: Java's `update()` only re-tints on the boolean's *edge* (not a continuous flash), reproduced here the same way against `Bar.setFillColor`/`Label.setColor`; there is no skull icon or chrome to tint (`boss_hp.png` row above), so the whole bar/name flip to warning-red instead, and no blood-particle drip is spawned - a purely static colour cue, not Java's continuous emitter. The click has no `WndInfoMob` to open, so it logs the same name/HP line the bar already shows (`port.log.bossinfo`), matching the "detailed window -> log line" simplification `awardBadge`/`BadgeBanner` already uses |
| `scenes/InterlevelScene.java` (per-region `loading_sewers/prison/caves/city/halls.png`, plus `effects/ShadowBox.java`'s `shadow.png` drop-shadow under the hero) | `showInterlevel` (`main.ts`), called after `enterLevel` | Partially ported - the five original per-region loading textures are copied byte-for-byte and shown with Java's 5 px/s scroll, centred localized `DESCEND` caption, 0.33s gradient-curtain fades, and the slower first-floor/new-region timing. Input stays blocked throughout. The port generates synchronously, so it has no Java worker's static wait phase, mode-specific text/timing for ascend/fall/restore, or error/install handling. `ShadowBox` remains unavailable: the port has no matching separate hero-shadow effect. |
| `effects/BadgeBanner.java`'s graphical banner/icon (`interfaces/badges.png`, real `Badges.Badge.image`-indexed 16x16 grid), fade-in/static/fade-out at the real 0.25s/1s/1.75s timings | `src/ui/badgeBanner.ts`'s `BadgeBannerLayer`, `awardBadge` (`main.ts`) via the new `BADGE_ICON` map | Ported - real byte-for-byte art (`ui_badges.png`), the real `DEFAULT_SCALE = 3` pop-in/hold/fade curve and timings, queued rather than dropped when a second badge lands mid-animation. Simplified: shown at a fixed HUD position (top-centre) instead of anchored to the hero's world position, since there is no on-screen hero sprite position that reads well as a HUD element; the pixel-scanned "shine" highlight (`BadgeBanner.highlight`) is not reproduced. `BADGE_DEFS` is this port's own smaller, invented achievement set (not a 1:1 port of `Badges.Badge`'s ~120 entries), so `BADGE_ICON` approximates the closest real badge for two entries that have no exact Java counterpart (`death_trap` -> `DEATH_FROM_GRIM_TRAP`, `death_foe` -> `DEATH_FROM_ALL`'s generic skull); the text log (`port.log.badge`) stays alongside the banner rather than being replaced by it, which is a superset of Java's purely-visual toast, not a deviation from it |
| `ui/TalentIcon.java`/`ui/TalentButton.java`'s real per-talent icon/button art (`talent_icons.png`, `talent_button.png`) | `talentPanel` (`main.ts`), `src/talents.ts` | Partially ported - per-talent selectable nodes, rank labels, tier gating and persistence are live; the original Java icon/button sprites and blinking selection treatment remain unported |
| `ui/MenuPane.java`'s in-game pause/exit menu chrome (`menu_pane.png`, `menu_button.png`) | `buildInterface`'s save/load toolbar buttons | Not ported - save/load exist as plain toolbar buttons already, so this is the missing chrome around functionality that does work, not a missing function. Found by asset audit |

**Verification.** `tools/scratch/uiCheck.ts` asserts 22 properties of the shipped widgets against
the Java formulas above, headlessly: `Bar`'s fill matches `HealthBar.layout()`'s
`ceil(health*pixelWidth)/pixelWidth` at six HP ratios (including that 1/300 still lights a whole
pixel, which is the point of Java's ceil); each level's span in `SPD_LEVEL_CURVE` equals Java's
`maxExp(lvl) = 5 + lvl*5`; `Compass`'s angle is 0/90/180/-90 for north/east/south/west, matching
Java's unusual `atan2(dx, -dy)` order, and its reveal latches on; and `applySpdTheme` really does
install border 6 and `Window.TITLE_COLOR`.

**`GameLog` is not covered by that script** - it measures wrapped text through Pixi's
`CanvasTextMetrics`, which needs a real canvas, so its merging and line-based trimming can only be
checked in a browser.

**Now actually looked at, via `chrome-devtools-mcp` (the extension bridge was unavailable this
session too, same CDP-direct fallback used elsewhere) - real screenshots, not just formula
checks.** Status pane: hero portrait, HP bar, and depth badge/label all render legibly at the
top-left; zooming the canvas 4x (CSS `transform: scale()`, since this tool has no per-region zoom)
confirmed the HP bar's fill edge is genuinely jagged pixel-by-pixel, not a smooth gradient -
matching the `ceil(health*pixelWidth)` formula this file's script-based check already confirmed
numerically. Coloured log: multiple real message colours observed in one session - orange
("Aucune porte ne sort de cette pièce...", a warning), yellow (the depth-entry line), white (a
plain hit/kill line), and green (an achievement-earned line) - all legible, correctly coloured,
and in the real French locale text. Boss health bar: forcing `depth = 5` (Sewers boss) and
spawning a `goo` at 20% HP made `bossChrome`/`bossHealthBar`/`bossNameLabel` all go visible
exactly as `refreshHealthBars()` intends (they're gated on `BOSSES[depth]?.kind` matching a live
creature, not just "a boss exists" - can't just set `currentBoss` directly, the very next
`refreshHealthBars()` call overwrites it back to `null` off that same depth check), with the
skull-chrome icon, a correctly-filled bar, and the real HP/maxHP text at the top-centre; the
25%-crossing "bleed" red tint fired as intended (the `fraction < 0.25` edge-detect this row's
formula section already described). Compass: invisible until `hasStairs`/`stairs` are set
(matching `Compass.java`'s own real gate), then a small correctly-oriented arrow appears at the
portrait's corner, pointing the right direction at 4x zoom. Inventory panel: opening it with a
mixed bag (potions/scrolls/gold/gear) showed a clean icon grid with quantity badges, not the
degenerate unbounded-height text-row layout the "avoidable reimplementation" row above once
described - matches Java's real `WndBag` shape closely enough to read at a glance, no overflow.
**Two widgets couldn't be caught on screen, and this is a genuine tooling limitation, not a
negative finding**: floating combat-damage numbers (`FloatingTextLayer`, constructed with a very
short `1/3`-unit lifetime) and the badge-banner pop-in both cycle fast enough that the round-trip
latency between triggering them via a script call and taking a follow-up screenshot reliably
missed them, even though the *triggering* logic was confirmed correct both times (the log line
for the badge award rendered correctly - "Haut fait obtenu : Slew Goo !" - and `showDamage`/
`showHeal` ran with no errors). Neither is evidence of a rendering bug; both would need a tighter
capture loop (e.g. a screenshot burst across consecutive frames) to actually see the widget
mid-animation, not just its aftermath in the log.

## Terrain and doors (`tiles/DungeonTileSheet.java`, `levels/*`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `WIDTH = 16`, `xy()`'s coordinate math, `FLOOR`/`ENTRANCE`/`EXIT`/`RAISED_WALL`/`FLAT_DOOR`/`WATER` cell indices | `TERRAIN_FRAME` | Ported |
| `stitchWaterTile()`'s bit order and its 16 real water tiles | `WATER_FRAMES` (via `mwg/render`'s `autotileFrames`/`BLOB_SHAPES`) | Ported, quantized from mwg's 8-neighbour blob convention down to SPD's real 4-neighbour one |
| `Level.java`'s per-turn `WATER` hook: a non-flying char standing in water extinguishes `Burning` | The hero-turn `applyBuffDamage`/monster-turn branches, right after each side's own `tickBuffs()` call | Ported for both hero and monsters. Fetched `Level.java`/`Burning.java` to confirm the real shape: entering water forces one more `Burning.act()` (this turn's DoT already covers that) then detaches on the *next* check while still wet - collapsed here to an immediate extinguish once the current tick has landed, rather than reproducing that one-turn-late timing exactly. Gated on the hero's own `levitation` buff (this port's stand-in for `Char.flying`, per `fallThroughChasm`'s own comment); gated by `Creature.flying`, so Java's flying Bat/Bee/Elemental/Eye/Swarm/Ghost actors are exempt as well. The same real hook also force-ticks `Ooze`, not reproduced since this port has no distinct `Ooze` buff/stack model (folded into a stackless `corrosion` mechanic elsewhere) - a narrower, already-known gap, not newly introduced. |
| A level's real up/down staircases (`ENTRANCE`/`EXIT` tiles, one of each per regular floor) | `placeEntrance`, `placeStairs` | Ported |
| Doors: open/closed/locked state at room/corridor junctions (`FLAT_DOOR`) | `placeDoors`, `adoptPortedFeatures`, `bumpDoor` via `mwg/roguelike` `Doors` | Simplified - generic floors use one locked door keyed to `ironKey`; ported crystal doors now require the real `crystalKey`, while exact key-drop placement remains simplified |
| `Patch.java`'s cellular-automaton fill/smooth/correct algorithm, and regions' real water fill numbers | `patchGenerate`, `placeWaterPool`, `REGION_WATER` | Ported, including the 85%/90%-fill `WATER`-feeling variants for Sewers/Prison and the corresponding regional feeling fills; a defensive iteration cap is added, see the code comment |
| `RegularPainter.paintGrass` + `HIGH_GRASS` split at both regions' real numbers | `placeGrass`, `REGION_GRASS` | Ported. Simplified: single-layer rendering (no `FLAT_HIGH_GRASS` overlay), no Huntress-only `FURROWED_GRASS`, no stealth interaction beyond wake radius. **Correction**: this row previously also claimed "no `GRASS_ALT`" - wrong, `terrainFrameAt`'s `alternate(2)` call on the `GRASS` branch already applies it (`>= 50` variance -> the common alt frame), and has since the same wall-rendering pass that added the wall alt below; see the corrected row two below |
| `HighGrass.trample()`: real loot odds (1/25 stone-or-seed, 1/6 dew, "naturalism level 0") | `trampleHighGrass` | Simplified - stone roll always yields stone (no seed item); dew takes priority on a double-hit (single-item cells vs stacking heaps) |
| Ground items lying on the floor, picked up by walking onto them (`Level.drop`, `Item.doPickUp`) | `spawnGroundItem`/`pickupGroundItemAt`, `generator.ts`, `placeGroundItems`, `adoptPortedFeatures`, real `ItemSpriteSheet` frames | Ported for the current item catalogue - generated class, level, curse, quantity and instance ID survive as a concrete payload through floor saves and inventory; room placement and unsupported Java item families remain simplified, found potions/scrolls start unidentified, and one item per cell replaces stacking heaps |
| The Waterskin/dew-drop mechanic (`MAX_VOLUME = 20`, `collectDew`, `consumeDew`'s 5%-of-max-HP-per-drop heal) | `collectDewdrop`, `quaffPotion`'s waterskin branch, `WATERSKIN_MAX` | Ported with UI simplification: collection and the 20-cap are real; drinking now computes Java's minimum drops-needed formula, preserves unused water, and applies the Warden Shielding Dew overflow cap. It remains exposed through the port's quaff action rather than a dedicated quickslot/window; Vial of Blood is unmodeled. |
| Traps (`ToxicTrap`, `BurningTrap`, `PoisonDartTrap`, `GrimTrap`, `ExplosiveTrap`) | `placeHiddenTraps`, `triggerTrapAt`, `applyTrapBlast`, live fire/gas blobs, `TRAP_KINDS` via `mwg/roguelike` `Secrets` | Ported for gameplay consequences - real damage numbers (depth-scaled where Java scales); explosive traps affect every nearby character with Java's 0.67 off-center multiplier, and toxic/burning traps seed spreading gas/fire blobs. Exact gas/fire volume cadence, destructible terrain, and non-explosive trap projectile/area presentation remain simplified |
| **Depth-1/2 entrance-room tutorial seal (`SPDSettings.intro()`/`Document.ADVENTURERS_GUIDE`) was permanently on, every run, forever - a real user-reported bug, now fixed.** `entranceRoomContext.guideIntroRead`/`guideSearchingFound` (`entranceRoom.ts`) defaulted `false` and nothing anywhere ever set them `true` (confirmed by a whole-repo search) - so every single run, not just a genuinely new player's first one, sealed the depth-1 entrance room behind hidden doors (and depth 2 similarly), reported live by a player as "the first room has often only secret doors." Real Java seals this exactly once, permanently un-sealing the moment the player reads the relevant Adventurer's Guide page - normally within their first few minutes of their very first run. This port has no guidebook-reading interaction (a separate, already-documented gap - see `entranceRoom.ts`'s own comment on the guidebook item drop), so `main.ts`'s new `guideProgress` (`SaveSystem<{introRead,searchingFound}>`, namespace `spd-guide`, loaded once at scene creation and pushed into `entranceRoomContext`) treats the tutorial's real completion signal - successfully searching out the sealed door via `searchForSecrets` - as satisfied, and persists it permanently across runs, the same way a badge is. Browser-verified live: a fresh profile (no `localStorage`) still seals depth 1 (`secretDoorCells: 3`, matching a genuinely new install); after simulating the search-completion write and reloading, a brand new run's depth 1 has `secretDoorCells: 0` and real, visible perimeter doors (screenshotted). |
| **Entrance-room mob exclusion (`RegularLevel.createMobs()`'s `room != roomEntrance`) was not modeled on ported floors - monsters, including the roster's less-common entries, could spawn directly in the entrance room.** Real Java's mob-placement loop explicitly excludes whichever `Room` object is `roomEntrance` - an identity rule, not an index one, true on every floor including ported ones. This port's `populate()` previously reasoned "a ported floor's shuffled room order makes index 0 meaningless, so skip the index-0 exclusion there" - true as stated, but the conclusion drawn from it (every room becomes fair game) was wrong; the entrance room still needed excluding, just not by index. Fixed by finding whichever room actually contains the hero's spawn cell (true on both generic and ported floors, and the hero is still standing there at `populate()` time) and excluding that one from the room draw, replacing the generic-floor-only `index !== 0` check. Directly explains part of the same player report above (a snake was reachable inside the very first room). Browser-verified live: the entrance room (identified by containing the hero's spawn position) held zero monsters across two separate generated runs, both before and after the guide-seal fix above. |
| **`portStrings.ts` i18n audit: 45 EN / 47 FR keys were in real use via `t('port.*')` but had no matching table entry - the raw key string rendered in the log/UI in their place.** A script (walk every `.ts` file, collect literal `t('port.…')` call sites, diff against both `PORT_STRINGS_EN`/`PORT_STRINGS_FR` objects) found the gap; this is not a translation-completeness gap Java has any equivalent of, purely this port's own wiring bug. Covered nearly every category: window titles/bodies (About/Badges/Changes/News/Settings/Support), the victory/defeat result screens, the talent-selection header/tier label, `port.action.bag`, and ~20 combat log lines (`bossinfo`, `grim`, `lucky`, `kingbarrier`, `spinnerweb`, `yogbeam`/`yogfistslam`, `tengutraps`, `gladiatorcombo`, `talentexecute`, `talentspent`, `armorabilitychosen`, `wandequipped`, `shield`, `deathboss`/`deathfloor`, `descendboss`, `queststatus`, `port.name.cursed`, plus the French-only `entanglement`/`potential`). All 45/47 now fixed and reconfirmed by rerunning the same audit script (0 missing in either locale). Browser-verified live: the About and Badges title-screen windows both render real translated text and a working "Fermer" close button, not raw keys. **Two further French-specific corrections a player caught live, unrelated to the missing-key audit itself**: "bolt" (`port.log.bolt(mis)ses`/`bolthits`, the DM100/Shaman/Necromancer/SpectralNecromancer/Warlock/Elemental/YogFist ranged zap - every caller of `zapHero`) was first mistranslated `trait`, then miscorrected in this same file's earlier revision to `carreau` (a crossbow bolt/quarrel) - wrong either way, since **every single creature that uses this line fires a magical bolt/zap, not a physical projectile at all** (confirmed by reading `zapHero`'s own callers: DM-100's lightning, the Shaman's/Necromancer's/Warlock's magic bolt, the Elemental's zap, YogFist's magic bolt - none of them a crossbow). The user caught this directly and it is now `éclair` (a flash/bolt of light or lightning - the correct term for a magical zap), matching the sole real physical-projectile case (the GreatCrab's generic parry line, which blocks *any* projectile including these magical ones) staying the deliberately generic `projectile` rather than either the crossbow- or lightning-specific word. Both bolt-hit lines were also restructured subject-first ("{who} vous rate/touche avec un éclair...") to avoid the grammatically broken bare "de {who}" the previous phrasing used, which reads fine only for a proper name and not for the common-noun-style monster/class names `{who}` actually holds (French needs "du"/"de la"/"de l'" article agreement a bare `{who}` can't supply). Live-reconfirmed with the corrected wording: "DM-100 vous touche avec un éclair pour 2." **Follow-up, same session: the deferred dynamic keys were checked and were just as broken.** Manually enumerating `SUBCLASS_OPTIONS`/`ARMOR_OPTIONS`'s 12 possible ids (`berserker`/`gladiator`/`battlemage`/`warlock`/`assassin`/`freerunner`/`sniper`/`warden`/`champion`/`monk_sub`/`warding`/`arcane`) found all 12 missing from both locales too - the entire subclass/armor-ability choice window (shown to every class at level 13, and again at 21 for the armor ability) was rendering raw ids like `port.subclass.berserker` instead of a class name. All 12 added in both locales. Browser-verified live: forcing the subclass-choice panel open showed real buttons reading "Berserker"/"Gladiateur", not raw keys. |
| `Hunger.act()` (`actors/buffs/Hunger.java`): `HUNGRY = 300`, `STARVING = 450`, `STEP = 10`, crossing into STARVING deals an immediate `hero.damage(1,this)`, then `level` freezes and `partialDamage += STEP*HT/1000` every turn, applying `(int)partialDamage` (with carried fractional remainder) whenever it exceeds 1 | `simulation/hunger.ts`'s `advanceHunger` (`hungerStep`/`hungerPartialDamage` on `main.ts`), `eatFood` | **Ported exactly**, correcting this row's earlier claim. The port previously modeled starvation as a flat `max(1, round(maxHp/100))` damage tick once every 10 starving turns - a guess, not a translation of the real formula, and roughly half Java's real rate at low max HP (e.g. HT=20 takes 1 damage about every 5 turns in Java, not every 10). `advanceHunger` now reproduces `partialDamage`'s real fractional accrual and carry-over, the immediate 1-damage-on-crossing, and the fact that `level` itself stops climbing once starving (Java's `isStarving()` branch never reassigns `level`) - previously this port kept incrementing hunger every starving turn via a separate tick counter, which the real Java never does. The `onhungry`/`onstarving` log lines now fire from the same `newLevel` crossing check Java uses rather than persisted "warned" flags (removed from `HungerState`/saves - crossing is naturally self-gating). Simplified: no attack-delay/accuracy penalty while hungry (Java has none beyond the log line either), no exhaustion beyond HP damage. |
| `Barrier.act()` (`actors/buffs/Barrier.java`): `partialLostShield += min(1, shielding/20)` every turn, `absorbDamage(1)` and a hard reset to 0 once it reaches 1 (bigger shields decay faster; `incShield`/`setShield` reset the accumulator on every top-up) | `main.ts`'s `barrierPartialLoss` field, applied in `spendHeroTurn`'s `applyBuffDamage` hook against `heroBarrier` (`mwg/actors`' generic `Actors.Barrier`) | **Ported**, closing a real "Not ported" gap: `heroBarrier`'s decay was never invoked at all before this - `Actors.Barrier.advance()` existed in the framework but nothing in `main.ts` ever called it, so every hero shield (Barrier proc-family grants, Blocking, talent shields) held its value indefinitely once granted instead of draining on its own. The proportional curve and the discard-not-carry reset semantics (`partialLostShield = 0`, unlike `Hunger.partialDamage`'s carried remainder) are both reproduced. Simplified: this port pools every shield source into one flat `heroBarrier` rather than separate typed `ShieldBuff` instances. **`Blocking.BlockBuff`'s own distinct fixed 5-turn cliff-edge expiry is now approximated too**: fetched `Blocking.java`/`ShieldBuff.java` to confirm the exact mechanics - `BlockBuff.act()` decrements a private `left` (starts at 5, reset to 5 by every `setShield()` call, i.e. every fresh proc) by 1 per turn and `detach()`es outright at `left<=0`; `ShieldBuff.setShield()` itself only raises the shield to the higher of old/new (never additive), unlike this port's existing `grantHeroShield`, which stays additive as a pre-existing, unchanged simplification. A side counter pair, `blockingShieldLeft`/`blockingTurnsLeft` (persisted with the run, reset alongside `heroBarrier.clear()`), tracks only the portion of the pooled `heroBarrier` attributable to Blocking and ticks down in the same `applyBuffDamage` hook as the proportional curve above; hitting 0 force-`absorb()`s whatever of that tracked amount the pool still holds (clamped down first, since the proportional decay or ordinary damage absorption may have already eaten into the same shared pool - this port has no priority-ordered per-source draining to keep them truly separate, so the tracked amount is only ever an upper bound). Every fresh Blocking proc resets the timer to 5 and adds its granted amount to the tracked total, matching `setShield()`'s own always-refresh behavior. Browser-verified live: seeding `heroBarrier`+`blockingShieldLeft` at 20/5 and stepping `spendHeroTurn()` seven times showed the pool falling via the ordinary proportional curve on turns 1-4, then dropping to exactly 0 on turn 5 regardless of how much the proportional curve had left standing; a mid-countdown top-up (simulating a second proc at turn 1-of-2) correctly reset the counter to a fresh 5 and pushed the forced expiry out to the new turn 5, matching real Java's `setShield()` refresh. **Reworked this pass to Java's real two-buff shape, closing both "still not modeled" gaps above**: auditing the 2026-09-09 MWG-utilization note (which suggested layering Blocking over the shared pool via `Barrier.add`) against `ShieldBuff.java` showed the pooled model had three real bugs, not one simplification - repeated procs stacked additively where `setShield()` keeps the max, the proportional decay nibbled a shield `BlockBuff.act()` exempts from it entirely, and drain order was recency rather than `shieldUsePriority`. Blocking now owns a separate `blockingBarrier` pool (`ShieldBuff.shieldUsePriority = 2` drains before Barrier's 0 in `absorbHeroDamage`, matching `processDamage()`'s sort; the proportional accrual base is the Barrier pool only; `grantBlockingShield` keeps `max(current, proc)` and always resets the 5-turn timer), persisted as `blockingBarrierState` with a load-time carve-out migration for pre-two-pool saves. **Still not modeled**: `HoldFast.buffDecayFactor()` scaling of both the proportional decay and the 5-turn clock (this port has no HoldFast buff - a Sec 6 talent gap), and the ProvokedAngerTracker a fully-broken shield grants (same talent gap). Monsters have no shielding of their own to decay, matching the port's existing hero-only shield scope. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| Stealth (surprise attacks, `CloakOfShadows`) | `Creature.seesHero`, sampled before each monster move; `rollHit`, Rogue wake-radius 3 + cloak +3 evasion | Simplified - door/corner surprise attacks now use Java's pre-move `Mob.enemySeen` timing (including the snake-door tactic); no invisibility counter or sneak-attack multiplier beyond Sucker Punch |
| `DungeonTerrainTilemap.getTileVisual`'s `getRaisedWallTile`/`getRaisedDoorTile`, and `DungeonWallsTilemap`'s `stitchInternalWallTile`/`stitchWallOverhangTile` - SPD's two-layer raised-wall rendering | `spdLevelGen/wallTiles.ts` (`terrainFrameAt`/`wallFrameAt`/`stitchesAsWall`), the `wall*`/`*Overhang`/`raisedDoor*` entries of `TERRAIN_FRAME`, and `main.ts`'s second `wallsMap` TileMap | Ported. **This row previously said the opposite and was wrong on both counts** - see the note below |
| `DungeonTileSheet.tileVariance`/`getVisualWithAlts` (`RAISED_WALL` -> `RAISED_WALL_ALT`, `FLOOR` -> `FLOOR_ALT_1`/`FLOOR_ALT_2`, `GRASS` -> `GRASS_ALT`, `EMBERS` -> `EMBERS_ALT`) | `setupTileVariance`, `terrainFrameAt`'s `alternate()` helper | **Correction: this row previously said the FLOOR/GRASS/EMBERS alts were "not ported... a small follow-up" - wrong, they already were.** `alternate()` is generic over any frame index, not wall-specific: the final `return alternate(frame)` fallthrough (frame 0, the base `FLOOR` tile) applies both `commonAltVisuals`' `FLOOR_ALT_1` at `variance >= 50` and `rareAltVisuals`' `FLOOR_ALT_2` at `variance >= 95` (the only one of these four with a rare tier); the `GRASS`/`EMBERS` branches call `alternate(2)`/`alternate(3)` the same way, matching Java's own `commonAltVisuals` entries exactly. `GameScene.java` rolls `Random.Int(100)` per cell inside its own `pushGenerator(seedCurDepth())`, so `tileVariance` touches no part of the level-generation stream and reproduces exactly from the per-depth seed, for all four alts alike |
| `WALL_DECO`/`BOOKSHELF`/statue/alchemy-pot/barricade/high-grass raised and overhang art | `spdLevelGen/visualWalls.ts` (`raisedWallFrame`/`upperWallFrame`/`foregroundGrassFrame`) | **Correction: this row previously said "Not ported - this port has no such terrain" - wrong on both counts.** `WALL_DECO`(12)/`BOOKSHELF`(27) are in `visualWalls.ts`'s own `walls` set (raised south-face + overhang frames 100/108, both alt-variance-gated); `STATUE`/`STATUE_SP`(25/26) -> overhang frame 240, `ALCHEMY`(28) -> 241, `BARRICADE`(13) -> 242, `HIGH_GRASS`(15, alt 246) and its furrowed counterpart(30, alt 247) are all explicit cases in `upperWallFrame`'s below-neighbour switch, verified live in-browser (Halls depth 21, `SkullsRoom`'s statue ring rendering with the correct raised/overhang lip). `BARRICADE` specifically is unexercised in practice - no room this port paints currently places that terrain (only referenced in `regularPainter.ts`'s `SOLID` merge-blocking set) - so its frame code is correct but dead until some future room places one |
| Remaining terrain interaction families (signs/wells and the Java-specific consequences of chasms and crystal doors) | `visualWalls.ts`, `adoptPortedFeatures`, `bumpDoor`, `fallThroughChasm`, `usePortedWellAt`, `triggerPortedPlantAt` | Partial/live - raw CHASM cells now retain their pit frame while using open collision/FOV; hero entry causes the depth transition and the movement boundary prevents non-hero mobs from stepping into pits. Signs are examined; wells apply awareness/health effects and become empty; crystal doors consume crystal keys; crystal chests consume a key before exposing their reward; generated plant markers trigger one-shot effects and wither. **The well effects themselves were re-checked against `WaterOfAwareness.java`/`WaterOfHealth.java` this pass and had two real bugs each, now fixed.** Awareness well: previously ran `Actors.identify(item)` over the *entire bag* - real Java's `Belongings.observe()` (called by `affectHero()`) only identifies the 6 equip slots, which this port already treats as identified/curse-known the instant they're equipped (a pre-existing, unrelated simplification - see `equipWeapon`/`equipArmor`), so there was nothing left for that part to do; the real, distinct, previously-missing effect is `observe()`'s last loop marking every *unequipped* backpack equipable/wand item cursed-known without fully identifying it, now matched, plus a genuine `awareness` buff grant (`BUFF_DURATION.awareness = 2`, matching `Awareness.DURATION`; its Java on-detach `Belongings.observe()` re-run has nothing new to reveal here for the same equip-time reason, so it's a real status with no distinct expiry action to wire). Health well: was wrongly clearing `burning` - real `PotionOfHealing.cure()` never touches it (confirmed by reading `cure()`'s exact buff list) - and had no `Belongings.uncurseEquipped()` at all, silently dropping the weapon/armor/ring curse-clear real Java grants alongside the full heal; both fixed, reusing the exact same three-line equipped-slot clear `ScrollOfRemoveCurse`'s branch already has. Browser-verified live: an awareness well correctly left an unidentified ring's `identified` flag untouched while setting `cursedKnown: true`, discovered a concealed secret cell, and granted `awareness: 2`; a health well with a cursed weapon/armor/ring and both `poison`+`burning` active healed to full, cleared `poison` while leaving `burning` untouched, and cleared all three curses. Plant interactions now include Java-aligned single-target statuses, Warden-sensitive Blindweed/Stormvine, Fadeleaf relocation, Sungrass healing-over-time that cancels on movement and survives save/load, persistent Icecap/Rotberry area blobs, Warden FrostImbue/AdrenalineSurge variants, and Java-sized Dewcatcher (3-6) / Seedpod (2-4) distinct-neighbour drops. Swiftthistle now freezes automatic actors for its seven-time-unit window, queues delayed trap/plant presses, and persists both timer and queue through saves; seed growth/Lotus preservation remain simplified. |

### How SPD draws walls, and the claim this file used to make about it

The row above used to read *"Not ported - confirmed by inspection that none of these are
neighbour-dependent pieces; SPD's wall 'stitching' look is a rendering trick (`DungeonTilemap`
overdraw), not stitched sprites."* Both halves are wrong, and the consequence was visible: every
impassable cell drew the same lit brick face, so a five-deep mass of rock rendered as a five-tile
slab of bright brick where Java shows one lit edge and dark rock behind it. The user spotted it
against a real screenshot - "the whole walls are visible where only the surface should be visible".

What Java actually does, across **two** tilemaps (`updateMap()` passes `flat=false` for both; the
`flat=true` branch is only the still-image path for inventory icons, which is why `FLAT_WALL`
never appears on a real floor):

- **Lower layer**, under the actors (`DungeonTerrainTilemap`). A wall draws its lit south face
  *only when the cell below it is not itself wall* - `getRaisedWallTile`'s first line returns
  nothing otherwise. This single test is the whole effect.
- **Upper layer**, above the actors (`DungeonWallsTilemap`). A wall whose neighbour below is also
  wall draws `WALL_INTERNAL`, the dark top of the mass; a *non*-wall cell whose neighbour below is
  wall draws `WALL_OVERHANG`, the lip that wall casts up into it. Being above the actors is what
  lets a wall top hide whoever stands behind it, so it is a second `TileMap` here rather than
  another layer of the first - mwg's layers all draw under whatever is added to the world after.

And the pieces *are* neighbour-dependent, which is the second error: `getRaisedWallTile` adds +1
for open right and +2 for open left, `stitchInternalWallTile` adds +1/+2/+4/+8 for its four
corners, and `stitchWallOverhangTile` adds +1/+2 for its two. Off-map counts as wall throughout,
because Java passes `-1` for a missing neighbour and `-1` is `NULL_TILE`, which is in the
`wallStitcheable` list.

Every wall and door frame therefore reads its neighbours, so a cell that changes has to restitch
the ring around it (`restitchTilesAround`, Java's `DungeonTilemap.updateMapCell`, which also
rewrites a 3x3). Opening a door and uncovering a secret one both do this now. That fixed a
pre-existing bug on the way past: nothing used to re-pick frames at all, so a discovered secret
door kept the wall face it had been hiding behind.

Checked by `tools/scratch/wallDump.ts`, which imports the same module the game renders from and
asserts the defining invariant across all 8 ported floors - every wall cell has a lit face **xor**
a dark top, matching whether the cell below it is open. Lit faces come out at 5-11% of wall cells
(they were 100%), and faces exactly equal overhangs on every floor, which is the vertical
transition count agreeing with itself. **Not verified visually**: the Chrome extension was down
for this change, so nobody has yet seen the new walls drawn. The dump proves the rule, not the
art.

### The sealed starting room is faithful; the hint is not

On depth 1 with `SPDSettings.intro()` set - and again on depth 2 until the guidebook's searching
page is found - `RegularPainter.paintDoors` turns every entrance-room door into
`Door.Type.HIDDEN`. Its own comment calls this the tutorial. **The hero genuinely starts sealed
into the entrance room, and that is correct generation, not a bug**: the doors sit on the room's
perimeter and `searchForSecrets` checks all eight neighbours, so they are findable. Do not "fix"
it by opening them. `tools/scratch/checkBridge.ts` reports the exit unreachable on exactly the
depth-1 and depth-2 floors and reachable on all of 3,4,6,7,8,9, which is that seal and nothing
else.

What real SPD ships alongside it, and this port does not, is the scaffolding that makes the seal
fair: the Adventurer's Guide page lying in the starting room, a search button on the toolbar, and
the prompts pointing at it. Without those a correct seal reads as a broken floor - a player bumped
into walls until they starved. So `enterLevel` prints a one-line hint (`stairsNeedSearching`) when
the stairs cannot be reached without searching. **That hint is a port-only affordance with no Java
counterpart**, standing in for tutorial content that is not ported; it is keyed off actual
reachability rather than off `depth === 1`, so it stays correct for the depth-2 case too. Shut
doors count as ways through, since bumping one opens it; a hidden door does not, being stored as
plain wall until found.

## Consumables (`items/potions/*`, `items/scrolls/*`, `items/food/*`)

| Java block | TS destination | Status |
| --- | --- | --- |
| `PotionOfHealing.heal()`/`Healing.act()`: `setHeal(round(0.8*HT+14), 0.25, 0)` starts a heal-over-time that drains 25% of what's left each turn (floored at 1, capped at what's left) - not an instant heal; a second potion mid-heal only replaces `healingLeft` if its amount is bigger, it never stacks additively | `quaffPotion`'s healing branch, the `healingLeft` field and its per-turn tick in `spendHeroTurn`'s `applyBuffDamage` hook | **Ported, correcting this row's earlier claim.** The port previously did an instant flat full heal (`hero.hp = hero.maxHp`) - not a translation of the real formula at all, and a real gameplay-changing simplification: at low levels the two happen to look similar (`0.8*20+14=30` already exceeds a level-1 hero's full HP pool), but at higher `maxHp` the real potion heals meaningfully less than a full bar, gradually. Both the total amount and the exact 25%-per-turn decay curve are now reproduced; the cure list (poison/weakness/vulnerable/cripple) still applies instantly on quaffing, matching Java's `cure()`/`heal()` split (**correction, 2026-09-09 item-system audit**: `burning` was also in this list, a real, unwarranted addition - fetched `PotionOfHealing.java`'s `cure()` and confirmed it detaches Poison/Cripple/Weakness/Vulnerable/Bleeding/Blindness/Drowsy/Slow/Vertigo, never Burning; a healing potion does not extinguish fire in real Java. `burning` removed from the port's list; the other five Java entries have no equivalent buff in this port at all, so there's nothing to add for them). Browser-verified live: quaffing at 1/20 HP produced the exact real progression turn by turn (30 -> 22 -> 16 -> 12 -> 9 -> 7 -> 5 remaining, HP climbing 1 -> 9 -> 15 -> 19 -> 20-capped -> 20 -> 20). The `quaffhealing` log line was also corrected in both locales - it previously claimed "fully healed", which is no longer immediately true. Simplified: real Java's `Healing` is its own visible buff with a status-pane icon/countdown and `Talent.onHealingPotionUsed`'s Shielding-aware interaction; this port's `healingLeft` has no UI indicator of its own and only affects the already-real-and-unchanged Restored Willpower/Agility/Nature talent hooks (which still fire immediately on quaffing, as Java's `Talent.onHealingPotionUsed` does). |
| `PotionOfStrength` (`STR+1`, unique) | `quaffPotion`'s strength branch | Ported |
| `ScrollOfIdentify` (reveal one item) | `readScroll`'s identify branch + `Actors.identify` | Ported (one item; TEST_SUBJECT heal rides along) |
| Unidentified potion/scroll appearance assignment | `Actors.Appearances`, `APPEARANCE_TABLES`, `itemDisplayName`, save/load | Ported - appearances are shuffled once per seeded run, pre-drawn so later gameplay RNG is unaffected, and serialized with the run |
| Ally combat / `ScrollOfMirrorImage` / `Amok` | `Creature.isAlly`, `takeAllyTurn`, `takeAmokTurn`, `rangedTarget`, `spawnMirrorImage`, `takeMonsterTurn`, `readScroll` | Partially ported this pass: two scheduled 1-HP allies copy the hero's combat stats, attack the nearest visible hostile, follow the hero when idle, and can be intercepted by adjacent hostile melee turns. Simple ranged attacks now choose the nearest line-of-sight hero/ally; `Amok` lasts 5 turns and attacks the nearest living non-NPC creature, including hostile mobs and allies. Ally state survives floor/run saves and ally deaths award no XP or loot. `MirrorImage` now uses the hero's real class sheet and armor-tier idle frame, matching Java `MirrorSprite`; boss-specific ranged targeting and Java's richer ally orders/aggro memory remain simplified. |
| `ScrollOfUpgrade.upgradeItem()` + `Weapon/Armor.upgrade(false)` (affix/curse transitions) and `Item.degrade()`/`Warlock` Degrade | `upgradeGear` + `rollUpgradeAffixLoss`, `zapHero`'s warlock branch, `degradedLevel`, the `degrade` buff (`BUFF_DURATION`, status icon 48, announced) | Ported, checked against tag `v3.3.8` (`ScrollOfUpgrade.java`, `Weapon.java`, `Armor.java`, `Warlock.java`, `Degrade.java`, `Item.java`). Upgrading rolls the real transitions BEFORE the level changes: curse affix/glyph removed on a static 1-in-3 with the real `remove_curse` line, otherwise a good affix/glyph lost at 10/20/40/80/100% from +4 (`Float(10) < 2^(level-4)`) with the real `incompatible` warnings. **Found and fixed in the same audit: Warlock never permanently decremented weapon levels** - real `Warlock.zap()` applies the 30-turn Degrade *buff* on a LANDED ranged zap at 50% (melee never degrades); the buff reduces EFFECTIVE levels through `Degrade.reduceLevel()` (`round(sqrt(2*(lvl-1))+1)`, non-positive untouched) exactly where Java routes `buffedLevel()` (damage rolls, armor DR), while proc chances, upgrade-loss rolls and stored true levels keep `level()`. The old 25%-permanent-chip is gone. Not modeled: harden loss (nothing grants hardening without StoneOfEnchantment), seal upgrade (no seal), RunicTransference shifting the armor loss floor (talent has no mechanics yet - floor stays 4), `Degrade.detach`'s `updateHT` (no such recompute exists here), the DEGRADE sound. `Item.degrade()` itself is unbounded-negative by definition - no new primitive needed. The tier-jump progression itself stays this port's own simplification (fixed per-class tiers + plain +1 levels is the real shape - a full rework is tracked, not attempted). Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `ScrollOfRage` (beckon + Amok), `ScrollOfLullaby` (Drowsy->sleep), `ScrollOfMagicMapping` (reveal), `ScrollOfMirrorImage` (2 images), `ScrollOfRemoveCurse` (decuse) | `readScroll` branches | Audited this session against Java source (same method that found the potion-branch bugs), found two more real mismatches - correcting this row's stale claims. **`ScrollOfMirrorImage` was outright wrong, not simplified**: real Java spawns 2 allied `MirrorImage` NPCs (1 HP each, mirroring the hero's own weapon/accuracy/evasion, fighting alongside the hero); the port granted a 10-turn `bless` self-buff that has no relationship to that effect at all - not a chosen stand-in, just a stray leftover. A full port needs genuine ally-vs-monster combat, which this port has nowhere (every monster AI decision here hardcodes the hero as the only possible target) - tracked in `ROADMAP.md` as its own item, not attempted this pass. Replaced the wrong bless with a `heroBarrier` shield (`round(maxHp*0.15)`) as an honest, documented stand-in for "extra bodies soak some hits," using a system this port already has rather than inventing a new one. **`ScrollOfRage` was missing its actual beckon effect**: real Java calls `mob.beckon(hero.pos)` on every mob on the level (not just visible ones), turning them to approach: the port only ever woke mobs where they stood, with no beckon at all. Fixed by setting `seesHero = true` alongside waking - the same target-acquisition stand-in the Annoying weapon curse's own beckon already uses, for consistency. The additional 5-turn `Amok` (visible, non-ally mobs attack anything nearby, allies included) is not modeled, for the same missing-monster-vs-monster-combat reason as MirrorImage. Browser-verified live: a sleeping, out-of-sight rat given `scrollRage` correctly woke (`sleeping: false`) and turned to approach (`seesHero: true`); a `scrollMirror` read correctly granted a `round(maxHp*0.15)` shield and left the old `bless` buff untouched (never set). **`ScrollOfMagicMapping` only ever did half its job**: real Java marks every discoverable cell `mapped` (the whole floor layout becomes visible, not just secrets) *in addition to* revealing secret terrain - the port only ever did the secret-reveal half, leaving the rest of the floor exactly as unexplored as before reading it. Fixed by calling `FieldOfView.revealAll()` - an `mwg/roguelike` method whose own doc comment says "for a magic mapping effect or a debug view," but which, like `rollAffix` earlier this session, was never actually called anywhere in `web-mwg`. Since this port's fog-of-war doubles as its map display (no separate minimap), revealing every cell as explored is the direct equivalent. Browser-verified live: before reading, only the starting room was explored (`fov.explored.size` well under the floor's cell count); after, `explored.size === level.cellCount` exactly, and a zoomed-out screenshot showed the whole floor's rooms and corridors rendered, hero's own room aside. **`ScrollOfLullaby` is now ported with an explicit reduction**: real Java applies `Drowsy.DURATION = 5` to visible mobs and the reader, and `Drowsy.act()` then attaches `MagicalSleep`; this port now applies the timed five-turn buff and transitions mobs into their native sleeping state. Currently, the hero-side `MagicalSleep` healing/resting state has no equivalent here, so an injured reader receives the existing three-turn paralysis as a documented stand-in, while a full-health reader remains awake like Java's `toohealthy` path. The `drowsy` timer is a first-class shared buff and persists through the existing creature save/load path. **`ScrollOfRemoveCurse` re-checked now that cursed gear is actually real (post enchant/curse-wiring fix) - confirmed a real, deliberate, already-consistent simplification, not a new bug**: real Java is an `InventoryScroll` that targets exactly one player-chosen item (`onItemSelected`/`uncurse`); this port cleanses every curse source at once (bag items, equipped weapon/armor curse, cursed ring) with no item-picker step at all - the same auto-target-rather-than-let-the-player-choose pattern `ScrollOfIdentify` already uses elsewhere in this same file (it auto-picks "the first unidentified item" rather than presenting a chooser), so this isn't an isolated shortcut invented for this one scroll. The actual curse-clearing coverage itself is complete and correct for every curse source this session's enchant/curse work made real. **Found and fixed a further live bug, auditing every `Cat.SCROLL` id `generatedInventoryItem`/`sourceInventoryItem` can produce (same method as the potion-id bug above)**: `ScrollOfMirrorImage` and `ScrollOfMagicMapping` were mapped to `scrollMirrorImage`/`scrollMagicMapping` by the generic `ScrollOf` -> `scroll` rename, ids `readScroll()` never recognized (it only checks the shorter `scrollMirror`/`scrollMapping`, matching the identification-appearance table's own kinds) - so an actually-generated Mirror Image or Magic Mapping scroll silently read as Remove Curse instead of its real (already-ported, working) effect. `ScrollOfRemoveCurse` itself also got the generic `scrollRemoveCurse` id rather than the `scrollCleanse` the appearance table and `readScroll()`'s default branch both expect - harmless by coincidence (any unrecognized id already fell to that same default), but now named consistently too. All three id-producing call sites fixed. Browser-verified live: `generatedInventoryItem` now produces `scrollMirror`/`scrollMapping`/`scrollCleanse` for those three classes, and reading an actual `scrollMirror` item correctly grants the shield stand-in (not Remove Curse's cleanse). **`ScrollOfRecharging` is now ported too**, fetched from the local shattered-pixel-dungeon checkout (tag `4.0.0-beta`) to confirm: `doRead()` just grants the 30-turn `Recharging` flavour buff (`Recharging.DURATION = 30f`) this port already fully modeled (`BUFF_DURATION.recharging = 30`, already read by `recoverWandCharge`'s 1.25x rate bonus for the Recharging enchant's own charger effect) - the scroll itself was simply never wired to a buff/rate system that already existed complete and correct. Added to the identification-appearance shuffle table (9th scroll look) and `readScroll()`'s auto-preference order. `readScroll()`'s default branch comment now states plainly that `ScrollOfRetribution`/`Terror`/`Transmutation` (all in the real Generator pool, none with its own branch) still fall through to Remove Curse's effect - an active misbehavior, not mere inaction, same as the equivalent unported potions. Browser-verified live: reading a `scrollRecharging` item granted the buff (`hero.buffs.recharging === 30`, exact), and `generatedInventoryItem`'s id mapping needed no special-casing (unlike Mirror/Mapping above) since the generic `ScrollOf` -> `scroll` rename already produces the correct `scrollRecharging` id. **`ScrollOfTeleportation` is now ported too**, fetched from the local shattered-pixel-dungeon checkout to confirm the real shape: `teleportToLocation`/`teleportChar` move the reader to a free cell and clear `Roots`. Real Java's `teleportPreferringUnseen` biases toward an unvisited room with a `PathFinder` reachability check; this port has no room-visited tracking or reachability search to draw on, so it reuses the same uniformly-random, unchecked cell search the Displacing weapon curse and Displacement armor curse already use elsewhere in this file - factored out into a new shared `randomFreeCell()` helper (a genuine rule-of-three refactor, this being its third call site) rather than a fourth copy-pasted search. Uses the real Java message keys (`items.scrolls.scrollofteleportation.tele`/`no_tele`), already present in the generated catalog for every locale including French, instead of adding new `port.log.*` entries. Browser-verified live: reading a `scrollTeleportation` item while `Roots` was active moved the hero to a new cell and cleared the roots buff in the same action, with the correct French message rendering ("Vous avez été téléporté en un clin d'œil à un autre endroit de l'étage."); `generatedInventoryItem` needed no id special-casing, matching the generic rename directly. **`ScrollOfTerror` is now ported too**, fetched `ScrollOfTerror.java`/`Terror.java` from the local checkout to confirm: real Java applies a 20-turn `Terror` buff (`Terror.DURATION`) to every visible non-ally mob, which stops that specific mob attacking the reader while it otherwise acts freely (can still attack allies, flee toward other exits) - a per-object avoidance this port's monster-turn model has no primitive for, and moot anyway given this port's total absence of monster-vs-ally combat. Modeled as a practical equivalent instead: a new `terror` buff (`BUFF_DURATION.terror = 20`) checked early in `takeMonsterTurn`, right after the sleep/wake logic and before any attack-decision branch, which forces `decideMonsterAI`'s existing `fleeBelow` parameter to `1` (always flee) - the same mechanism `Thief.FLEEING` already uses for its own "stolen and running" behavior - and returns immediately, skipping every attack branch for that turn. Uses the real Java message keys (`items.scrolls.scrollofterror.none`/`one`/`many`, the "one" variant substituting the target's name via the literal `{0}` token `MessageParams` supports as any string key), already present in the generated catalog for every locale. Browser-verified live: reading the scroll on an adjacent, awake rat applied `terror: 20`; the rat's next six turns fled to distance 10 and never closed back in or attacked (hero HP unchanged throughout) despite starting adjacent; the French "one mob affected" log line rendered with the substituted name. Not modeled: Java's real per-object distinction (the terrorized mob could still fight something else, or lose the buff early if attacked) - accepted as moot given no ally-combat system exists to make that distinction observable. **`ScrollOfRetribution` is now ported too, minus `Blindness`**: fetched `ScrollOfRetribution.java` from the local checkout to confirm the real formula - `round(mob.HT/10 + mob.HP*power*0.225)` damage to every visible mob, where `power = min(4, 4.45*missingHpFraction)` scales with how hurt the reader is (can nearly one-shot enemies at very low HP), then applies `Weakness` and `Blindness` to the reader as the cost. This port has no `Blindness` (a `FlavourBuff` whose real mechanical effect - reduced vision radius/targeting - has no equivalent seam here), so only `Weakness` is granted; `Blindness` stays a documented gap rather than a fudged stand-in. **Found in the course of this: `Weakness` and `Vulnerable` were both fully wired dead code** - `rollDamage`/`rollHit` already read them correctly (`attacker.buffs['weakness']` -> x0.67 damage dealt, `defender.buffs['vulnerable']` -> x1.33 damage taken), but nothing anywhere in the codebase ever granted either buff to anyone, so both mechanics, though correct, had never once fired in actual play. Also fixed both buffs' durations: `BUFF_DURATION.weakness`/`.vulnerable` were `10`, but real `Weakness.DURATION`/`Vulnerable.DURATION` are both `20` - an unconfirmed placeholder guess from before either buff had a real source, now corrected against source. `ScrollOfRetribution` is `Weakness`'s first real source; `Vulnerable` remains unassigned to any source (it's not part of Retribution in real Java either - it's a separate mob-facing debuff) and stays dead until something grants it. Browser-verified live: reading the scroll at 75% missing HP against an 8-HP rat dealt exactly the formula's predicted 7 damage; `hero.buffs.weakness` was set to the corrected `20`; a 50-swing sampling comparison with and without the buff active showed a ~0.71x damage ratio, matching the real 0.67x multiplier within sampling noise and confirming the previously-inert mechanic now actually fires. |
| `PotionOfLiquidFlame/MindVision/Invisibility/Purity`, `Food` energy | `quaffPotion` branches, `eatFood` | Simplified - flame is 4 + burning to the nearest enemy, purity cures fire/poison, food/meat resets hunger. **`PotionOfExperience` was entirely missing and is now ported** (found the same way as the two bugs above, while auditing the rest of the potion branch): `hero.earnExp(hero.maxExp())` - grants exactly the XP needed to complete the current level, evaluated before the level-up itself raises the requirement, via the existing `grantExperience`/`SPD_LEVEL_CURVE` machinery already used for monster kills. Added to the identification-appearance shuffle table alongside the other seven potions. Browser-verified live: quaffing at level 1/0 XP produced exactly `level 2, exp 10` - matching `Hero.maxExp(1) = 5+1*5 = 10` precisely. **`PotionOfLevitation` is now ported** (this port's chasm terrain, `isChasmCell`/`fallThroughChasm`, already existed by the time this was picked up - the "limited value without chasm terrain" reasoning below predates that and no longer applies): `Levitation.attachTo()`'s buff (`BUFF_DURATION.levitation = 20`, already matching `Levitation.DURATION` before this potion used it) plus its immediate `Roots` clear on landing; `fallThroughChasm` also now skips the chasm interaction entirely while the buff is active, the same bypass `triggerTrapAt` already applied to traps. **Found and fixed the same pass, auditing every `Cat.POTION` id `generatedInventoryItem`/`sourceInventoryItem` can produce**: `PotionOfLiquidFlame`/`PotionOfInvisibility` were mapped to `potionLiquidFlame`/`potionInvisibility` by the generic `PotionOf` -> `potion` rename, ids `quaffPotion()` has never recognized (it only ever checked the shorter `potionFlame`/`potionInvis`, matching the starting-kit items `makeHero()` adds directly) - so an actually-generated Liquid Flame or Invisibility potion silently quaffed as Purity instead of its real effect. Both id-producing functions now special-case those two class names to the short ids. **`PotionOfToxicGas` and `PotionOfParalyticGas` are now ported.** There is no `PotionOfConfusion` class in real Java at all (the previous text here was simply wrong - `ConfusionGas` is a trap-only blob, seeded by `ConfusionTrap`, which this port doesn't model as a trap kind; not a potion gap). Re-reading `Potion.java` showed the "needs a new consequence system" premise below was also wrong: `Potion.apply(hero)` is just `shatter(hero.pos)` for every potion, gas ones included - there is no separate "drink" effect, so drinking a gas potion in real Java already means gassing your own feet, identical in shape to throwing it at yourself. This port's quaff-only flow (it has no potion-throw targeting) reproduces that exactly, no simplification needed. Two new floor-persisted blobs, `toxicGas`/`paralyticGas` (`main.ts`'s `spreadPlantBlobs`, ticked alongside the existing `plantGas`/`plantFreeze`/`fire`), give each its real per-turn consequence: `ToxicGas.evolve()`'s direct `1 + scalingDepth()/5` damage (no buff at all - distinct from the `plantGas`/Rotberry stand-in, which reuses a `poison` buff refresh) and `ParalyticGas.evolve()`'s per-turn `Paralysis.DURATION` reapplication (reusing the existing `paralysis` buff, already Java-shaped). `PotionOfToxicGas.shatter()`/`PotionOfParalyticGas.shatter()` both seed a 1000-volume blob at the hero's feet on quaff, matching Java exactly. **`ToxicTrap` was also fixed in the same pass**: real Java's `ToxicTrap.activate()` seeds the exact same `ToxicGas` blob class the potion does (`300 + 20*scalingDepth()`, a formula this port already had right) and does nothing else - no instant status. This port's trap handler previously gave an instant `poison` buff (never real Java behavior) and reused `plantGas` (Rotberry's own blob, conflating two distinct Java blob classes) instead of seeding its own gas - both fixed; the trap now seeds `toxicGas` and only that. Browser-verified live: quaffing `potionToxicGas` seeded `toxicGas` to volume 1000 at the hero's cell, and a subsequent turn dealt exactly `1+floor(depth/5)` damage (confirmed 1 at depth 1, 3 at depth 12); quaffing `potionParalyticGas` applied `paralysis: 3` (matching `BUFF_DURATION.paralysis`); triggering a `toxic`-kind trap seeded `toxicGas` to volume 320 (`300+20*1`) with no `poison` buff granted, confirming the old instant-poison bug is gone. **`PotionOfHaste` is now ported too, found stale in a later pass auditing other "blocked" claims right after the Weapon-Augment one turned out stale**: the "needs a hero speed-buff system this port doesn't have" premise no longer held once `getActionTurnCostMod` existed. Fetched `Char.java` to confirm the exact mechanic: `speed()` has a flat `if (buff(Haste.class)) speed *= 3f` - Haste is a genuine 3x speed multiplier, not a doubling, applied alongside Cripple/Stamina/Adrenaline/Dread the same way. A new `haste` buff (`BUFF_DURATION.haste = 20`, matching `Haste.DURATION`) is read by `getActionTurnCostMod` as `mod /= 3`, the exact inverse relationship `RingOfHaste`'s own multiplier there already uses. Browser-verified live: `getActionTurnCostMod()` read `1` before quaffing and `0.3333...` immediately after, with `hero.buffs.haste === 20`. **`PotionOfFrost` remains not ported**: it needs a freeze/immobilize effect and visual this port has no other seam for. It currently falls through to `quaffPotion()`'s default branch and gets Purity's poison/burning-clear effect instead of its own - not merely inert, an active (if narrow) misbehavior, explicitly commented at that call site rather than left implicit. **Invisibility was also wrong outright, found the same way as MindVision and now fixed**: it previously force-slept every monster on the floor on top of granting the buff - a much stronger effect than real Java's `Invisibility.attachTo()`, which does nothing but increment a stealth counter. This port already has the *correct* invisibility AI gating elsewhere (`monster.seesHero`'s `!hero.buffs['invisibility']` check, and `takeMonsterTurn`'s `distance > 1` skip - matching Java's real "distant monsters lose track, adjacent ones keep fighting" behavior) - the blanket sleep was a redundant, incorrect addition on top of an already-working mechanism, not a needed stand-in for anything. Removed; the existing gating now runs unmodified. Browser-verified live: an already-awake, adjacent rat correctly stayed awake (`sleeping: false`) after the hero quaffed invisibility, rather than being forced to sleep. **MindVision was wrong outright too, found the same way, and is now fixed**: it previously revealed every secret (trap and hidden door) on the floor - the real effect of Java's Scroll of Magic Mapping, not this potion at all. Real `PotionOfMindVision.apply()` grants a 20-turn `MindVision` buff that reveals every ordinary monster's position through walls/fog. Now ported as a real `mindvision` buff (`BUFF_DURATION.mindvision = 20`, matching `MindVision.DURATION`) gating `creature.sprite.visible` - regular monsters render regardless of FOV while it's active; NPCs and the hero are unaffected, matching Java's mobs-only reveal. The log line was also split into Java's real two variants (`see_mobs`/`see_none`, based on whether any monster exists on the floor) in both locales. Browser-verified live: a rat 15 cells away, definitely outside FOV, went from `sprite.visible: false` to `true` immediately on quaffing, with `mindvision: 20` turns applied. |
| Wands other than Magic Missile, rings, artifacts (beyond the cloak stand-in), glyphs, alchemy/crafting, honeypot/shattered-pot semantics | `placeGroundItems`, `pickupGroundItemAt`, `equipWand`, ring equipment workflow | Simplified - wand `sourceClass` now persists as an equipped `wandType`; Magic Missile/Frost, Fireblast, Lightning, Prismatic Light, Disintegration, and the regional growth portion of Regrowth are playable. Fireblast uses the real `WandOfFireblast` level roll and Burning effect but targets the selected cell instead of Java's cone; Lightning uses the real `WandOfLightning` level roll and per-target multiplier but arcs to visible adjacent foes instead of Java's Ballistica chain; Prismatic Light uses the real `WandOfPrismaticLight` level roll and blindness chance, represented by timed daze because this port has no distinct Blindness status; Disintegration uses the real level roll but targets only the selected enemy instead of Java's full line and terrain bonus. Regrowth's remaining Lotus/aiming gaps are recorded in its dedicated row. Other wand families, artifacts and alchemy semantics are not ported. Ordinary throwable bombs are now ported too (see the dedicated `Bomb` row). |
| `PotionOfFrost.shatter()` (`Freezing` blob: extinguish fire, `Chill`, eventual `Frost` immobilize) | `quaffPotion`'s `potionFrost` branch, `buffs.ts`'s `frost`, hero/monster turn gates | Simplified - the cast remains target-centred because no thrown-cell picker or persistent freezing-terrain layer exists, but it now applies the hero/target Chill effect, extinguishes Burning, and represents Java's explicit 10-turn Frost immobilization with a `frost` marker plus the shared paralysis lock when an already-capped Chill reaches its freeze transition. Elemental harmful-buff damage is retained; freezing heaps, blob cadence, and full area geometry remain unported. Type-check/build only; browser verification owed per ROADMAP.md section 10. |
| `ScrollOfTransmutation.doRead()` (`usableOnItem`/`changeItem` per-category reroll via an item picker) | `readScroll`'s `scrollTransmutation` branch, `transmuteCandidates`/`completeTransmutation`/`transmuteItem`, the generic `openItemPicker`/`chooseItemPicker` panel, the `WEP_TIER_CLASSES`/deck tables | Simplified - checked against tag `v3.3.8` (`ScrollOfTransmutation.java`, `InventoryScroll.java`, `Generator.java`). The per-category reroll is real: melee weapons reroll to a different class within the same `Generator` WEP_T1..T5 tier (preserving level/curse/`affix`/identified, mirroring `changeWeapon`'s carry-over); potions/scrolls/seeds/runestones reroll within their real 12-class decks (a different class, one unit of a stack, identified state preserved); rings reroll across all 12 real types (level/curse preserved, mirroring `changeRing`); the `cloak` artifact stand-in uses Java's own no-artifacts-left fallback (a random ring, curse preserved, flat +0). Reading consumes the scroll and logs the real `items.scrolls.scrolloftransmutation.morph` key; with no eligible target (or only defensively) it logs the real `nothing` key WITHOUT consuming, mirroring the `result == null` path. Simplifications, all stated: regular<->exotic flips collapse to a random different regular type (no exotic classes exist here - checked against source, `changeScroll`/`changePotion` are pure regular<->exotic flips); ineligible here - armor (never eligible in real Java either, no `changeArmor` exists), single-id `wand` (no class identity to change), `MagesStaff` (real `changeStaff` keeps the staff and re-imbues its wand only), thrown-stone ammo (a bare count; real Java likewise excludes plain `Dart`), unique `hourglass`, and equipped gear (tier fields/ring slot, not bag items - real Java's picker includes them). **The target-selection half is now real, not auto-picked**: a generic item-picker panel (`openItemPicker`/`chooseItemPicker`, modeled on `InventoryScroll.itemSelector`'s contract - eligible rows, a cancel row, the real `inv_title` prompt, scroll consumed only inside `completeTransmutation`, snapshotted pick re-validated against the live bag like Java's own FIXME check) replaced the first-eligible auto-target and its upgrade/identify deprioritization hack; a `scrollTransmutation` stack of 2+ is self-eligible (Java's `item != this || quantity > 1`, consuming two units total, matching detach-then-detach). The picker is built generic for reuse by the other picker-blocked uses (Enchantment/Intuition/DetectMagic stones, shop buy/sell, alchemy). Remaining toward full parity, still owed with the section-1 item-system completion rather than a standalone scroll pass: exotic results, wand/trinket rerolls, tipped-dart/missile handling, and equipped-gear targeting. Gameplay-`Random` rolls (a live hero action, never the level-stream `SpdRandom`). The retired `port.log.transmutationfizzle` key is removed from both locales. Type-check/build/simulation/item suites green; browser verification owed per ROADMAP.md section 10. |
| `Bomb.execute(AC_LIGHTTHROW)`/`onThrow()`/`explode()`/`Fuse`/`DoubleBomb.doPickUp()` (light-and-throw, 2-turn fuse, range-1 blast for `NormalIntRange(4+scalingDepth, 12+3*scalingDepth)` minus armor on every char including the hero, chained bomb heaps, double heap picked up as 2 bombs with an English-only "1+1 free!" status) | `useBomb`/`detonateGroundBomb`/`tickBombFuses`/`removeGroundItem`, the `portItemKind`/`sourceInventoryItem`/`groundKindForItem` bomb branches, `ITEM_FRAME.bomb` (80 = `BOMBS+0`), the `bomb` bag id + `ac_lightthrow` inventory action, `ITEM_KEYS`/`GROUND_ITEM_KEYS`, `shopPricing`'s `bomb: 15` (`value()`), the `bonesEligible` denylist | Ported, checked against tag `v3.3.8` (`Bomb.java`). Lighting throws the bomb at the auto-targeted enemy's cell (no map-click aiming exists - the combat-stone convention), where it lands as a lit heap (red-tinted, `glowing()`'s red) with a real 2-turn `fuseTurns` countdown ticked once per hero turn from the end-of-turn pipeline (frozen by the Timekeeper freeze like every other actor, carried by ordinary ground payloads so floors/saves behave); stepping onto a lit heap snuffs it back into the bag with the real `snuff_fuse` key. The blast reuses the exact formula and hero-included absorption (plus the real `ondeath` line on a hero kill); chaining runs through the same routine with a visited set. Found and fixed alongside: every generated bomb never spawned at all (`portItemKind` returned null for `'bomb'`/`'doubleBomb'`, silently dropping Armory/Honeypot/Artillery loot - now a real `'bomb'` ground kind, frame 81 for double heaps); `bonesEligible` would have admitted bombs through the live bag (real `Item.bones` defaults false, `Bomb` never opts in - both ids denied). Stated gaps, not silent: the flood fill is passable-cell Chebyshev-1 (the `useStoneOfBlast` shape); flammable-terrain destruction has no primitive at any item site; `EnhanceBomb` alchemy and the 10 specialty bombs need the alchemy system; blast particles/sound have no seam here. Type-check/build only; browser verification owed per ROADMAP.md section 10. |

## Everything still outside combat/terrain/dungeon structure

The Bulk armor curse is now live: while standing in a door, the shared action-cost model applies
Java's threefold speed increase. Metabolism is also live. Anti-Entropy now applies its 1-in-8
burning retaliation and dazes adjacent creatures; exact freezing-blob terrain interaction and
visual effects remain simplified.
Dazzling now applies its 1-in-10 visible-area impairment burst and dispels hero invisibility;
the port uses timed daze in place of Java's separate blindness status.
Corrosion now applies its 1-in-10 adjacent ooze burst as a real `ooze` buff (20 turns,
announced, own status icon) - CausticSlime/Acidic/FetidRat procs feed it too, no longer the
shared `poison` (real Poison sources - darts, sorrowmoss, venom, bleeds-as-poison - correctly
stay put). Ticks are `Ooze.act()`'s own depth curve (`1+depth/5` past 5, 1 at 5, coin-flip 1
in the Sewers, RESISTS-scaled for the hero) with the real `ondeath` line, and standing water
washes it off after the tick like Burning; duration refreshes rather than `extend()`-stacking,
and intensity is flat. The splash presentation is not modeled.
Displacement now has Java's 1-in-20 incoming-hit proc, relocating the hero to a free passable
cell and negating that hit; exact ScrollOfTeleportation destination weighting remains simplified.
Multiplicity now duplicates a non-boss attacking monster into a free adjacent cell on Java's
1-in-20 proc; hero mirror images and exact actor-copy state are not represented.
Overgrowth now creates and immediately activates a supported plant on its 1-in-20 proc; the
seed choice is uniform over the supported plant set rather than Java Generator's weighted table.
Annoying now uses its 1-in-20 proc to alert every active monster through the persisted
`seesHero` target state and dispels hero invisibility; Java's message/sound variants remain UI gaps.

Remaining unported work: the majority of enchantment/glyph/curse *types* and all weapon Augments (see the dedicated enchant/glyph row above for exactly which are ported and why), complete weapon/armor tier and transfer formulas, upgrade-chance/curse-infusion odds, degradable gear beyond the stone coin-flip, shops beyond the depth-6 keeper's flat prices, challenge-specific generation/loot/boss branches beyond the persisted selector and stronger-boss stat modifier, and the remaining rare City/Halls content plus full boss arena scripts.

## Internationalisation (`messages/Messages.java`, `messages/Languages.java`, `assets/messages/**`)

The mechanism is `mwg/i18n`'s, the words are SPD's own. `mwg/i18n` supplies the catalog shape,
`{token}` interpolation, CLDR plural selection through `Intl.PluralRules` and the fallback to a
base language, so none of that is reimplemented; `src/i18n/` adds what is SPD-specific -
assembling a catalog per language, choosing the language, and Java's language-dependent
capitalisation rules.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Messages.get(cls, key, args)`'s key derivation: the class's package path below the SPD root, lowercased, plus the key suffix (`actors.mobs.Rat` + `name` -> `actors.mobs.rat.name`) | `src/i18n/spdKeys.ts` | Ported - the port uses SPD's dotted keys **verbatim**, so any key greps straight back to the Java class that owns it and its `.properties` entry, with no mapping table in between. `$` separates a Java inner class, as in Java |
| `assets/messages/**/*.properties`: 9 domains x base English + 18 locales, 171 files | `src/generated/spdMessages.ts`, built by `tools/i18n-extract.mjs` (`npm run i18n`) | **Ported in full: 3,753 SPD keys x 19 languages.** The built page runs from `file://`, so the complete catalog is deliberately compiled in rather than fetched on demand. This makes every original string immediately available when its Java screen is ported; the cost is a materially larger game bundle. |
| Java text for screens/windows not yet implemented (`WndBag`/`WndUseItem`/journal entries/full talent trees/shop dialogue etc.) | Complete `src/generated/spdMessages.ts` catalog | Text is ported and callable, but its owning Java UI/feature is still not necessarily ported. This is intentionally distinct from a missing translation: MWG already provides generic windows, stacks, scrolling lists, icon grids and message boxes; each remaining item requires its SPD-specific data and interactions to be implemented. |
| `Item.itemComparator` / `Generator.Category.order(Item)` (including tier and special subcategory ordering) | `generatorItemOrder()` + `refreshInventoryPanel()` | Ported for the compact inventory payloads: concrete generated classes use the latest matching Java category, bombs sort after missile weapons, and regular potions/scrolls retain their Java subcategory positions. Unknown compact IDs use the Java sprite-order fallback; equal keys retain bag insertion order through the stable display sort. |
| `.properties` syntax (`=`/`:` separators, `\n`, `\uXXXX`, continuations, comments) and `String.format`'s `%s`/`%d` | `tools/i18n-extract.mjs` | Ported - placeholders are converted to `mwg/i18n`'s `{token}` form at extraction time, not at runtime |
| The complete key set to ship: SPD's every base key, plus every key the port actually asks for | `tools/i18n-extract.mjs`'s `referencedKeys()`, audited transactionally before any write | Ported, and **repaired 2026-09-12**. The scrape that finds keys the port references reads `t('...')` call sites everywhere except `src/i18n/spdKeys.ts`, where keys appear as table *values* - and there it used to accept every string literal in the file. That file also contains MWL tag/attribute/table names (`'effect'`, `'keys'`, `'potionAppearances'`, `'scrollAppearances'`) and an import specifier (`'../mwlContent'`), so the audit failed on six non-keys and exited before writing: `npm run i18n` could not regenerate the catalogue at all, and the failure had been noted as pre-existing rather than diagnosed. It now keeps only literals of SPD's real key shape (dotted identifiers, `$` for an inner class) - all 3,753 base keys match, none of the six do. `--check` is green: the committed `spdMessages.ts` is byte-reproducible (modulo git's CRLF checkout, now normalized in the comparison) from the SPD checkout's working tree, which is this file's real provenance rather than any tag. |
| User-visible `GameLog` messages | `main.ts` + `tools/i18nCheck.ts` | Ported at the output boundary - every direct `say()` literal was removed. Java-owned paralysis, roots and descent text use their original SPD keys; port-only mechanics remain under `port.log.*`. The localization verifier rejects any future direct quoted `say()` argument, so an English-only message cannot silently bypass the catalog. |
| Enchant/glyph/curse display names (`port.affix.*`, rendered by `itemDisplayName`) | `src/i18n/portStrings.ts`'s `//affixes` block (EN+FR) | Ported - all 32 affix ids now resolve instead of rendering raw keys. Values are SPD's own `<class>.name` strings (tag `v3.3.8`): weapon affixes keep the bare adjective (`blazing`), armor affixes the `of`-suffix (`of stench`); FR uses the masculine base form, since Java resolves its `(e)`/`(le)` markers by item gender and this port models no gender data. `swiftness` takes the armor form (it is armor-glyph-only). Type-check/build only; never visually confirmed, like every other locale string. |
| Every `this.say('literal English string' ...)` call site (as opposed to `this.say(t('port.…'), ...)`) | `src/main.ts` scene-log call sites; new EN/FR `port.log.*` entries | **Found and fixed: 33 hardcoded-English log lines had never gone through `t()` at all**, discovered while adding the `no_herbalism` challenge gate right next to one of them (`plantSeed`'s three lines). A full sweep (`grep "this\.say('[A-Z]"`) found the rest scattered across chest/hourglass unlocking, the sacrificial-fire reward, both wells, every `triggerPlant` branch (sungrass/nourishing-fruit/starflower/dewcatcher/seedpod/fadeleaf/mageroyal/icecap x2/rotberry x2/sorrowmoss/firebloom/stormvine/swiftthistle/generic-wither), chasm falling, both crystal-mimic reveal/escape/displace lines, the armor-displacement curse, the statue equipment drop, and all three hourglass-freeze lines - none of these had ever rendered anything but raw English text in a French (or any non-English) run, a real, previously-undiscovered i18n gap the size of the `port.affix.*`/dynamic-subclass-key finds above, just never swept for because these calls pass a literal string rather than a template key. All 33 now have real `port.log.*` keys with EN (the original wording, unchanged) and new FR translations, reconfirmed by rerunning the full `port.*` literal-key audit (0 missing in either locale, 258 keys now in use, up from 224). |
| `Languages.java`'s enum: native names, codes, and its own completeness assessment (`COMPLETE` 100% reviewed, `UNREVIEWED` 100% translated, `UNFINISHED` 80-99%; below 80% SPD does not ship) | `src/i18n/languages.ts` | Ported, status included - it is honest to show SPD's own assessment rather than implying every language is equally finished |
| SPD's filename suffixes are not always BCP-47 (`in` for Indonesian, where BCP-47 says `id`) | `Language.code` vs `Language.tag` | Ported - `code` names the file and is what the save persists, `tag` is what `Intl.PluralRules` gets. Conflating them degrades plural selection to the fallback rules *silently* rather than erroring |
| Language selection (SPD: a settings menu) | `TitleScene.showSettingsWindow` | Simplified: cycles the supported languages in Settings and persists the selection; no full language list. |
| SPD's pixel fonts (`assets/fonts/`, `RenderedTextBlock`/`PixelScene.pixelFont`) | `pixel_font.ttf` + global theme | Ported using the supplied scalable SPD pixel-font face; the fallback stack remains deliberately for scripts not covered by that face. |
| Right-to-left layout | `Catalog.direction`, set per language | **Unexercised** - SPD ships no RTL locale, so nothing here has ever laid out RTL. `mwg/ui` mirrors against `direction`, but this port has never tested that path and should not be described as supporting RTL |

Strings this port invented, which have no Java equivalent - the sealed-floor search hint, the
keybind cheat-sheet, port-only status text, and two names absent from this checkout's message
files - live under a `port.*` namespace (`src/i18n/portStrings.ts`, **415** strings and counting -
`port.affix.*` alone added 32 in an earlier pass). The prefix
is deliberate: a `port.*` key is a string SPD never had, not a missing translation, and the two
distinguish themselves at a glance. English and French are hand-written (415 keys each).
**German (`de`), Spanish (`es`), Portuguese (`pt`), Italian (`it`), Polish (`pl`), Russian
(`ru`), Turkish (`tr`), Ukrainian (`uk`), Hungarian (`hu`) and Dutch (`nl`) are now
supplied too** (German 2026-09-09, Spanish 2026-09-09, Portuguese 2026-09-09, Italian
2026-09-09, Polish 2026-09-09, all 375/375 keys at the time, Russian 2026-09-10, Turkish
2026-09-10, both 389/389 keys at the time, Ukrainian 2026-09-11, 415/415 keys
against the current EN table, Hungarian 2026-09-11, 415/415 keys, Dutch 2026-09-11, 415/415
keys, `unreviewed` status) -
machine-assisted direct
translations, not human-proofread, marked as such in `PORT_STRINGS_DE`/`PORT_STRINGS_ES`/
`PORT_STRINGS_PT`/`PORT_STRINGS_IT`/`PORT_STRINGS_PL`/`PORT_STRINGS_RU`/`PORT_STRINGS_TR`/
`PORT_STRINGS_UK`/`PORT_STRINGS_HU`/`PORT_STRINGS_NL`'s own doc comments rather than silently
claimed `complete`. All ten are real Java SPD locales - confirmed against
`src/generated/spdMessages.ts`'s own generated table, which exists only for languages SPD
actually ships a base translation for - so this only ever supplies the port's *own* invented
strings on top of a base catalog Java already covers, never invents a locale Java doesn't have.
Verified programmatically before being wired in (0 missing/extra keys vs EN, 0 `{placeholder}`
token mismatches across all 375, for each locale) and live in-browser (welcome log line,
bag/talent panels, class-select blurb, settings/badges/changes windows, and - for Portuguese -
the hero info panel's real Java strings too, confirming the whole locale resolves end to end)
all rendered correctly-composed text, no raw keys, no console errors, for all five languages.
Russian was verified the same programmatic way (389/389 keys, 0 `{placeholder}` mismatches);
its live in-browser pass is owed per ROADMAP.md section 10 (no working browser tool in that
session). SPD itself ships Russian as reviewed, but that status covers SPD's own `.properties`
catalog, not this port-only draft - recorded as `MT`/`machine` like the other five.
Turkish was verified the same programmatic way (389/389 keys, 0 `{placeholder}` mismatches;
its combat line `port.log.hit` uses verb-final `{subject} {object} {damage} {verb}` order with
an identical token set, accepted by the sorted-token QA by design); its live in-browser pass
is likewise owed per ROADMAP.md section 10.
Ukrainian was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches - the EN table itself had grown to 415 keys by this pass, picking up
the alchemy/unlockhint/journal/bag keys added since the Russian and Turkish drafts, which is why
those two were short of the current EN count at that moment; that gap was closed the same
session in RU/TR and is not outstanding), formal «Ви» address
matching Russian's register as the closest sibling locale; its live in-browser pass is likewise
owed per ROADMAP.md section 10 (no working browser tool in that session either).
The Italian draft also caught a real transcription hazard worth reusing: a scripted
non-Latin-character scan (`/[Ѐ-ӿ一-鿿...]/`) over the finished draft file,
before wiring it in, caught one stray Cyrillic-character typo a manual read missed; the same
scan on the Polish draft found nothing, confirming it as a cheap habitual check rather than a
one-off fix. Ukrainian's own equivalent scan (Latin letters inside an otherwise-Cyrillic word)
found nothing either - every flagged Latin token was a legitimate untranslated proper noun
(`Shattered Pixel Dungeon`, `mwg`, `DM-300`) or a keybind letter.
Hungarian was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches, via the same QA the earlier drafts used); its live in-browser pass is
likewise owed per ROADMAP.md section 10 (no working browser tool in that session). SPD itself
ships Hungarian as reviewed, but that status covers SPD's own `.properties` catalog, not this
port-only draft - recorded as `MT`/`machine` like Russian. Informal te-form address, matching
German's Du, Spanish's Tú and Turkish's sen-forms.
Dutch was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches); its live in-browser pass is likewise owed per ROADMAP.md section 10
(no working browser tool in that session). SPD ships Dutch as `unfinished`, and this port-only
draft is `MT`/`machine` too. Informal je-forms.

**Found and fixed 2026-09-12: five more locales had silently drifted behind the EN table.**
`de`/`es`/`pt`/`it`/`pl` stood at 386/386/386/384/391 of EN's 415 keys - 142 strings missing
across the five (the alchemy UI/log/name block, the five class `unlockhint` lines,
`port.log.stoneflock`/`stoneaggression`/`wandcorrosion`/`wandcorruption`/`dm300arrives`, and the
journal/bag UI labels, all added to EN after those drafts were written and never propagated).
This is the same drift class the Ukrainian pass found in RU/TR, and it is invisible by
construction: `mwg/i18n` falls back to English for a missing key, so the failure mode is not an
error or a raw key but a single English sentence in the middle of an otherwise fully translated
run. All 142 are now translated in the same voice as each block, giving every non-English
catalogue 415/415 keys with 0 `{placeholder}` mismatches. Italian additionally appeared to be
missing the two wandmaker lines, but that was an artifact of the ad-hoc audit script's regex
not matching double-quoted values containing escaped `\"` - a reminder to compare the imported
tables rather than scrape the source.

The invariant is now enforced instead of hoped for. `tools/i18nCheck.ts` check 3 compares
**every** registered catalogue's key set and `{placeholder}` tokens against EN; it previously
compared only French (and only French's placeholders), which is precisely why five incomplete
locales passed it. Check 3c asserts every catalogue has a `PORT_TRANSLATION_ORIGIN` entry and
maps to a real `LANGUAGES` code - the old origin check listed nine hardcoded codes and had
already missed `uk`/`hu`/`nl`. To let the check compare tables without importing the `mwg`
runtime, the assembled catalogue map moved out of `index.ts` into `portStrings.ts` as an
exported `PORT_STRINGS`, which `index.ts` now imports like any other data. The new check was
verified to *fail* on a deliberately removed key before being trusted - not merely observed to
pass.

**All 19 locales done, 2026-09-12.** The seven languages that still fell back to English for
port-only prose - `zh`, `ko`, `ja`, `cs`, `in`, `vi`, `el` - now each carry a complete
415/415-key catalogue, so no SPD language falls back for anything this port wrote itself. Each
was drafted from `PORT_STRINGS_EN` with SPD's own vocabulary for the game's terms (read out of
the real `_xx.properties` at tag `v3.3.8`), then validated three ways before being wired: key
set, key *order* and sorted `{placeholder}` multiset against EN (415/415 on all seven); a
script-contamination scan for text in the wrong script (no Cyrillic or Latin inside Greek words,
no kana in Korean, no hanja where it does not belong, no Traditional characters in the
Simplified draft); and the project's own `tools/i18nCheck.ts`. Splicing is scripted, so the
2,905 translated lines never pass through a hand-transcription step.

Two of these are worth calling out beyond "counts match", because a count cannot see them:
- **Chinese** is Simplified only - the draft was scanned for the common Traditional-only
  characters (`們`/`這`/`來`/`為`/`說`/`時`/`過`/`戰`/`術`...) and contains none.
- **Japanese, Korean and Chinese** have no grammatical plurality, so where English distinguishes
  singular from plural (`port.log.hit` vs `port.log.hithero`, `port.log.miss`/`misshero`,
  `port.log.monkdodge`/`monkdodgehero`, `port.log.oozed`/`oozedhero`) each pair is deliberately
  identical rather than a translation oversight. Their `{subject}`/`{object}`/`{damage}`/`{verb}`
  placeholders are re-ordered into natural sentence order, which the token-set comparison
  accepts by design.
- **A glyph-coverage scan of all 19 locales found no tofu**, and it turned up two curiosities
  worth recording for where they live rather than for what they are. Both are in SPD's *own*
  tables, never in a port-only string, and both are harmless - but each is the reason the scan
  must ignore characters that draw nothing *by design* rather than only whitespace, since
  otherwise it reports a missing glyph for a character that is not meant to have one:
  Ukrainian `actors.buffs.frost.desc` contains a U+0301 COMBINING ACUTE (a stress mark, which
  only renders attached to the letter before it) and Portuguese
  `scenes.gamescene.blacksmith_quest_window` contains a U+200B ZERO WIDTH SPACE, twice. The scan
  now skips `\p{Cf}` (format) and `\p{Mn}`/`\p{Me}` (combining) characters. That the scan can
  fail at all was verified rather than assumed: with nine rare codepoints injected in place of
  English's single one, it correctly flagged the three that Chromium has no glyph for (the rest
  - Kharoshthi, Adlam, Old Turkic - really are covered by fonts Windows ships).

Every catalogue here is still `MT`/`machine`: a machine draft, complete but not proofread by a
fluent speaker, and marked that way in source and in `PORT_TRANSLATION_ORIGIN` rather than
silently upgraded.

**Found and fixed while verifying Spanish, but a real bug affecting French and German too, not
new to this pass**: `main.ts`'s `attack()` built the combat-log `object` slot for a hero
defender as a hardcoded English literal `'you'`, bypassing translation entirely - every
non-English combat log line read "...hits **you** for 3" / "...golpea a **you** por 3" instead
of a translated pronoun, for as long as French and German have existed in this port. The
`subject` slot one line above already did this correctly via `t('port.log.subject.you')`;
naively reusing that same key for `object` would have been wrong too, since it is the
capitalized/nominative form ("You"/"Vous"/"Du"/"Tú") meant for sentence-initial use, not the
lowercase/case-inflected form an object position needs (English "you" lowercase, French
"vous", German accusative "dich", Spanish "ti" after the templates's own "a"). Added a new
`port.log.object.you` key to all four locales and fixed the call site to use it. Verified live
by calling `attack()` directly through `window.__MWG__.currentScene['attack']` for a scripted
hero-vs-monster exchange in all four locales after the fix: `"Marsupial rat hits you for 2."`
(en), `"Rat marsupial touche vous pour 2."` (fr, pre-existing word order unchanged - not part
of this fix), `"Beutelratte trifft dich für 2."` (de, now correctly accusative), `"Rata
marsupial golpea a ti por 2."` (es, now grammatically correct instead of "a you").

The remaining 7 `Languages.java` locales still fall back to English through
`mwg/i18n`'s base catalog - translating them is tracked as its own ROADMAP.md section 8 item.
**Closed 2026-09-12**: all seven now have catalogues, so no locale falls back for port-only
prose; see the "All 19 locales done" section above.
Separately, the locale *set* is still SPD `v2.1.4`'s 18 non-English locales rather than
`v3.3.8`'s 22: `be`/`eo`/`sv`/`zh-hant` are absent from both `LANGUAGES` and the extractor's
`LOCALES`. That gap is **still open**, and closing it is now known to be a scoped migration
rather than a one-line list change: eight keys the port references exist in the v2.1.4-derived
catalog and do not exist at `v3.3.8` at all (`actors.mobs.dm300.rocks`/`.vent`,
`items.quest.pickaxe.ac_mine`/`.no_vein`, `levels.level.sign_desc`/`.sign_name`,
`scenes.titlescene.badges`, `windows.wndjournal.notes`), so the extractor's transactional audit
refuses a `v3.3.8` regeneration until each is re-pointed at its new Java name or moved under
`port.*`. Recorded under ROADMAP.md section 8.

`tools/i18nCheck.ts` guards the convention: every SPD-derived key the port uses must exist in
SPD's own base `.properties`, so a typo'd key **fails the check** rather than quietly rendering
English - which is the entire benefit of matching Java's key names, and worthless if a wrong key
can pass silently.

**Not visually confirmed.** The Chrome extension has been disconnected for this whole stretch, so
no locale has been seen rendered. The check above proves 138 keys resolve across 19 languages and
that interpolation produces the expected output; it cannot prove text fits its widget or that the
font stack actually covers a script. A CJK locale is the one most likely to be wrong, since that
is where a missing font shows as tofu.

## Audio and splash art (`watabou.noosa.audio.Music`/`Sample`, `Assets.Splashes`)

Found by the same asset audit as the UI-chrome gaps above (`interfaces/boss_hp.png` etc.):
comparing what `core/src/main/assets/` actually contains against what `web-mwg/src/assets/`
copies. `music/` (8.2 MB of `.ogg` tracks) and `sounds/` (581 KB of SFX) together dwarf every
other asset category, and neither has a single byte copied into this port. `splashes/`
(976 KB of per-class portrait art) is now ported; music/SFX are not. None of this was
previously recorded here.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Music.INSTANCE.play`/`playTracks`/`volume`/`enable` (`SPD-classes/.../audio/Music.java`), called from ~21 sites incl. `TitleScene.create()`'s theme music | `src/audio.ts` (`mwg/Audio.Music.playTracks`) | Ported - all shipped region, boss and title OGGs are bundled for `file://`; title and normal-region pairs now advance at each completion instead of looping only the shorter `_1` file, while boss tracks loop. Browser autoplay policy necessarily prevents an audible title track before a gesture. The original's optional extra `_2` selection is simplified to one guaranteed `_2` per cycle. |
| `Sample.INSTANCE.play`/`playDelayed` (`SPD-classes/.../audio/Sample.java`), called from ~255 sites (every hit, miss, pickup, level-up, door, footstep, UI click) | `src/audio.ts` (`mwg/Audio.Sound`) + gameplay call sites | Ported as the shared system and core gameplay cues - the complete shipped MP3 catalog is bundled; MWG pools overlapping instances; hit, miss, death, pickup/gold/dew, level-up, doors and hero footsteps now play their real clips. Remaining less-common Java call sites can be attached by their clip basename through `audio.cue()` without adding another audio implementation. |
| **Cost of the two rows above, stated plainly per this file's own convention (see the splash-art row below):** `src/assets/audio/` is **8.8 MB** on disk, `pixel_font.ttf` a further 60 KB, both base64-inlined for `file://` the same way every other asset here is - `game.js` grew from **2.97 MB to ~15 MB** (1.75 MB to ~10.6 MB gzip) once music, SFX and the pixel font all landed together. Audio does not compress further under gzip any more than the splash JPEGs do. |
| `HeroSelectScene.java` layout and selection | `src/scenes/classSelectScene.ts` | Ported structure: two rows of compact hero buttons at left in landscape, bottom strip in portrait, selected splash art, separate Start, back action, locked/unselected portrait dimming. Six classes are retained from the port, while this Java checkout has five. Simplified: short class descriptions and inline lock hints replace WndHeroInfo/WndMessage; splash transition, timed UI fade and game-options panel remain unported. |
| Platform startup asset loading before the title splash | `index.html` startup curtain, `main.ts` `updateStartupProgress`/`revealTitleSplash` | Simplified web equivalent: Java delegates startup progress to its platform asset pipeline, while this file://-compatible port exposes the real asynchronous font/sprite stages with a lightweight pixel-style progress bar. The curtain is removed only after `TitleScene` has been created, so the splash is the final startup surface. |

**Correction, since superseded by the rows above:** an earlier draft of this section claimed
audio needed a `mwg` capability that did not exist yet. That was wrong even at the time -
`mwg` already shipped `src/audio` (`Sound`, `Music`, `Playable`, `Orchestrator`, exported from
`mwg`'s root), a pooled-SFX/streaming-music API mapping closely onto Java's `Sample`/`Music`
shape - the gap was real but the blocker was not: nothing was missing from the framework,
`main.ts` had simply never been wired to it. All three of audio, splash art and the pixel font
are now ported (rows above); none of the three needed anything new from `mwg` itself, matching
what this correction already said about audio and splash art specifically. The pixel-font row
above was, at the time this paragraph was first written, a genuinely different and still-open
case (`mwg` had no bitmap-font `Label`) - it has since been closed by bundling SPD's own
scalable pixel-font face directly rather than waiting on that framework capability, so it no
longer illustrates the distinction this paragraph originally drew. Left here as the record of
a real self-correction rather than deleted.

### Visual parity pass (2026-09-05)

Compared the checked-in Java TitleScene, HeroSelectScene, PixelScene, Chrome,
StyledButton, HeroSprite and StatusPane against the active MWG TypeScript implementation.
The archived web-ts tree is not the active application.

| Area | Result | Remaining differences |
| --- | --- | --- |
| Title | Java menu geometry, icon crops, chrome and pulsing signs | Support/news/rankings/about remain port information windows; no desktop process-exit action |
| Hero selection | Compact responsive buttons, selected splash, explicit Start | Inline descriptions, six classes, no Java hero-info/options/fade system |
| HUD | Avatar, level/XP placement, black empty HP background, compass center | Fixed 2x small HUD; hover details, no shield overlays or large interface |
| Camera | Removed map-edge clamp to match GameScene hero-centred framing | MWG smooth following retains its existing deadzone |
| Controls/log | Original toolbar.png frames and bag/search/wait icons, four item slots, bottom-right grouped layout, log above controls | Fixed actions replace assignable quickslots; extra actions use an expandable menu. Cleric special uses a wand placeholder because this checkout predates the tome asset. Keyboard hint line hidden |

These changes improve visual parity; they do not claim complete Java rendering parity.
Terrain overlays, particles, inventory windows and unported screens still have the
limitations listed in their respective sections above.

Validation: TypeScript checks and production build passed. Playwright visually checked
title, settings, hero selection and gameplay at 390x844 and 1280x800; class selection,
Start, Wait and the extra-action menu worked. The corrected camera placed the hero at
(640,400) in the 1280x800 viewport, and the log ended eight pixels above the toolbar.
Only the missing development favicon produced a browser console error.

### Visual parity continuation (2026-09-05)

#### Terrain and monster rendering follow-up

`visualWalls.ts` now reads Java terrain identities independently of collision kinds.
It implements wooden wall interiors, decorated/wooden overhangs, locked and crystal
door variants, statue/alchemy/barricade overhangs, and upper grass blades. Door frame
orientation now uses the north neighbour, as `DungeonTerrainTilemap` actually passes
it to `getRaisedDoorTile`. Trampling updates both grass layers and the overhang above.
Mining-branch `CavesPainter.decorate()`'s standalone global scans are now implemented: real
`EMPTY_DECO` floor decoration and mineable `WALL_DECO` ore veins are generated after the branch's
water/grass pass, matching Java's null-room painter order.

The real terrain-features atlas is now rendered beneath actors. Trap and plant frame
indices are extracted from the checked-in Java classes; hidden traps remain hidden.
Regional grass details are included. Unknown plant classes from later game versions
remain blank, and plant growth effects and embers overlays remain unported. Trap
activation and plant interactions now include the single-target Java effects and
Sungrass healing state described above; Dewcatcher and Seedpod release their
Java-sized distinct-neighbour drops; area effects, exact teleport/TimeBubble
behavior, seed growth/Lotus preservation, and embers overlays remain unported.

MWG `AnimatedSprite` and `Tweener` now drive literal Java idle/run/attack clips and
0.1-second movement for monsters. Browser verification instantiated all 39 supported
monster/NPC types without atlas errors: 33 received clips; gnollTrickster, greatCrab,
shaman, dm300, elemental and yogFist retain their static frame. Compound/shifted films,
death animations, sprite particles and special attack sequences remain outstanding.
No generic animation implementation was added to SPD or copied into MWG.

Validation: typecheck and production build passed; `tools/verify-visual-walls.mjs`
checks structural terrain, door orientation, wooden interiors, grass alternates and
map edges. Desktop and portrait browser screenshots checked a terrain fixture with
bookshelf, statue, alchemy pot, tall grass and a revealed toxic trap. Monster movement
was checked at halfway and completion. Full visual parity remains unfinished,
especially fog, special effects and the previously listed unported screens.

Reusable tools retained in `tools`: `extract-terrain-visuals.py`,
`extract-sprite-animations.py`, and `verify-visual-walls.mjs`.

Framework extraction: MWG `ButtonOptions.skin` now owns per-button nine-patch
chrome, resizing and input-state tints; `ButtonOptions.label` and `LabelOptions`
own caption outlines, texture resolution and pixel rounding. `SpdButton` and
`SpdLabel` supply only this game's style values. No Java code or assets were moved
into MWG. The former hidden-background and child-inspection workarounds are removed.

The following supersedes the inventory, water and hover-detail limitations of the
initial visual pass. Reference code includes WndBag, ItemSlot, Chrome, WaterTilemap,
Ripple, DungeonTileSheet, HeroSprite, CharSprite and BossHealthBar.

- Inventory now uses native WINDOW chrome and a five-column equipment/item grid,
  item sprites, quantities, upgrade markings and item-action windows. Equipment
  slots and carried items are separated. Sub-bags and full Java item descriptions
  still require implementation.
- Water uses the five regional water textures, continuous scrolling, shoreline
  masks and movement ripples. Terrain now uses raw Java paint values for raised
  features, decorated floors, grass and chasm edges. Visible tiles use full color;
  explored tiles are darkened. Java's half-cell fog, feature overlays and complete
  wall stitching remain different.
- Cloth-tier hero idle, movement and attack animations use Java's frames and rates,
  with 0.1-second movement interpolation. Other armor tiers, monster animation,
  death/read/zap sequences and most particles remain outstanding.
- Clicking the portrait opens a native-chrome statistics window. Hunger buffs,
  boss-bar texture geometry, outlined labels and log text scaling are implemented.
  Java's tabbed hero window, shields, large-interface mode and assignable quickslots
  remain outstanding.
- Title arches now fade downward, matching the running Java desktop reference.
  Dialogs scale with the menu, and badges use a five-column icon grid. Several title
  actions still show port-specific information rather than Java's full screens.

Validation: production build (including TypeScript checking) passed. Browser checks
covered desktop title, hero selection, starting a run, hero statistics, and the
390x844 inventory layout. Selecting and consuming food was checked in the browser;
regional water and terrain were visually inspected. A malformed source byte in the
statistics heading found during visual checking was corrected. Full visual parity
is not yet achieved; the outstanding items above are actual unported behavior.

### Prison room-graph "attempts" divergence closed - test-tool bug, not a port bug (2026-09-06)

Sub-pass 10 (above) proved the "attempts mismatch" was a measurement artifact for the 16
Sewers combos (4 seeds x depths 1-4) and closed it there. That investigation's `attempts`
comparison never covered Prison (depths 6-9), and a fresh `graphAttempts` instrumentation pass
(temporary `RegularLevel.ATTEMPT_HOOK`/`GRAPH_DONE_HOOK` in Java, rebuilt via
`gradlew :desktop:runHarness`, and matching trace hooks in `spdRng.ts`/`regularLevel.ts` - both
removed after use, none left in the tree) found the same class of bug recurring there for a
different reason:

`tools/verifyLevelGraph.ts`'s `resetRunStateForSeed()` never called `resetWandmakerRunState()`
between seeds (unlike `tools/verifyLevelPaint.ts`, which already did). Since `Wandmaker.Quest`'s
`type`/`spawned` fields are real run-level state (like `SpecialRoom`/`SecretRoom`'s queues), this
let a Prison run's quest roll leak into the next seed's Prison floors, producing a phantom extra
`massGrave`/`ritualSite`/`rotGarden` special room on depth 6 (where the real `depth > 6` gate
should forbid it entirely) and cascading room-count/attempt mismatches through depths 7-9. Fixed
with one added `resetWandmakerRunState()` call in that function.

A second, narrower limitation was found and documented (not fixed, since it's inherent to what
the tool does): `verifyLevelGraph.ts` only runs the room-graph stage, never `paintPrisonLevel()`'s
`decorate()` step - so `Wandmaker.Quest.spawned` never becomes `true` there (that only happens
inside `spawnWandmaker()`, called from paint). A floor whose graph rolls the quest room will roll
it again on a later floor in this tool, where the real game and `verifyLevelPaint.ts` (which does
run paint) would not. `verifyLevelGraph.ts` now carries a comment pointing at
`verifyLevelPaint.ts` as the trustworthy comparison for any Prison depth-6-9 question.

**Result, re-verified against a fresh Java harness dump with `graphAttempts` exposed
end-to-end**: all 32 tested (seed x depth) combinations - the same 4 seeds across Sewers 1-4 and
Prison 6-9 - now match Java exactly via `verifyLevelPaint.ts`: room count, room-graph retry
count, and (spot-checked for seed 42 depth 3 via full RNG call-trace diffing, 599 draws including
both failed attempts and the successful one) byte-for-byte identical draw order. There is no
remaining room-graph divergence for either region across this test matrix. The seed-42-depth-3
case specifically named in earlier sub-passes as unresolved is confirmed closed - its `18=18`
room composition and `3=3` attempts are exact, not coincidental.

### Sewers boss level (depth 5) wired in (2026-09-06)

Every prior pass (including this file's own `PORTED_DEPTHS` doc comment) stated that no boss
level could be ported because all five boss levels "extend `Level`, not `RegularLevel`". That
was true for four of them but never checked against the fifth: **`SewerBossLevel` actually
extends `SewerLevel` -> `RegularLevel`** (confirmed by reading the real Java source directly) -
a genuine room-and-corridor floor, generated by the same `FigureEightBuilder`/`SewerPainter`
pipeline this port had already verified for depths 1-4, with a few boss-specific overrides
grafted on. `PrisonBossLevel`/`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel` (depths 10, 15,
20, 25) genuinely do extend `Level` directly - hand-built fixed-layout arenas with entirely
bespoke boss-fight scripts and no room-graph to port. Their stable layouts are now represented
in `bossLevels.ts`; the remaining gaps are boss-specific scripts and visual behavior.

**What's ported, RNG-faithful:**
- `SewerBossLevel.builder()` (always a `FigureEightBuilder` with fixed shape/path/tunnel
  parameters, unlike the normal 50/50 Loop/FigureEight roll) and `initRooms()` (a
  `SewerBossEntranceRoom`/`SewerBossExitRoom` pair, 3 filler `StandardRoom`s forced to NORMAL
  size via a second `setSizeCat(0,0)` roll, one of the 4 `GooBossRoom` variants picked by
  `Random.Int(4)` as the loop's forced landmark room, and a `RatKingRoom`) - see
  `regularLevel.ts`'s `sewerBossPickBuilder()`/`sewerBossInitRooms()`.
- All 4 `GooBossRoom` subclasses' `paint()` (`DiamondGooRoom`/`WalledGooRoom`/
  `ThinPillarsGooRoom`/`ThickPillarsGooRoom`) - pure geometry, zero `Random.*` calls each,
  confirmed by reading all four Java files. `rooms/sewerBoss/gooBossRoom.ts`.
- `SewerBossEntranceRoom`/`SewerBossExitRoom.paint()` (`rooms/sewerBoss/entranceExitRoom.ts`) and
  `RatKingRoom`'s room shell/door/chest-position RNG (`rooms/sewerBoss/ratKingRoom.ts`) - the
  latter burns every `Random.IntRange`/`random()` draw the real `paint()` makes, in the same
  order, and now also drops the real content (gold CHEST heaps + the king himself).
- `SewerBossLevel.painter()`'s fixed 0.50/5 water, 0.20/4 grass, and `nTraps()=0` (no traps at
  all) - `sewerPainter.ts`'s `paintSewerBossLevel()`.
- Verified against a real Java harness dump (`LevelGenHarness.java`'s `depths` array now
  includes 5, constructing a real `SewerBossLevel`): **room count, room kinds, and room
  rectangles are byte-identical to Java across all 4 tested seeds** (123456789, 1, 42,
  999999999999) - `EmptyRoom`/`RingRoom`/`SewerPipeRoom` filler selections and all 4
  `GooBossRoom` variant picks matched exactly, not just in count.

**What's NOT ported, and why:**
- **`RatKing` NPC** - now ported (this pass): the room drops real `Gold(10-25)` CHEST heaps
  and spawns the king himself (own byte-for-byte `ratking.png` at the real 16x17 film,
  sleeping NPC with the real `not_sleeping` wake yell and the `what_is_it` fallback).
  The crown exchange stays blocked - no King's Crown item and no Ratmogrify armor
  ability exist yet. See the NPC section's new row.
- **`GooBossRoom.setupGooNest()`'s `GooNest` decal**, and `SewerBossExitRoom`'s
  `SewerExit`/`SewerExitOverhang` decals - purely cosmetic custom tilemaps this port has no
  decal-layer asset for.
- **The `seal()`/`unseal()` mechanic** (sealing the hero into the boss arena - entrance flips to
  `WATER`, exit is genuinely locked - while `Goo` is awake) is not reproduced as gameplay. It
  doesn't need to be: this port's boss-kill flow already auto-advances the depth the instant the
  boss dies (`main.ts`'s `BOSSES[this.depth]` kill handler), so there is no "find the real exit
  and walk to it" step for the hero to be locked out of in the first place. The exit tile still
  paints as the real `Terrain.LOCKED_EXIT` and maps to `'wall'` (already true before this pass,
  since it was listed as "boss-floor gating; unreachable on the ported regular floors") - it is
  simply never meant to be reached.
- **`SkeletonKey`/`GooBlob` drops** on Goo's death - no key-per-lock or bonus-loot system exists
  for them; moot anyway given the point above.
- `main.ts`'s existing generic boss-floor convention - `populate()` spawns `BOSSES[depth].kind`
  at `this.level.rooms[rooms.length-1]` - was **not** changed; instead `gameBridge.ts`'s
  `extract()` reorders the returned room list so the `GooBossRoom` is always last, satisfying
  that existing contract without touching `main.ts` at all.

(End of file)

## Fixed boss-floor layouts (depths 10, 15, 20, 25, 26)

`src/spdLevelGen/bossLevels.ts` now supplies dedicated fixed-layout floors for
Prison/Tengu, Caves/DM-300, City/Dwarf King, Halls/Yog, and the final vault.
Their Java dimensions, main approach/arena geometry, entrance cells, exit cells,
locked gates, chasm boundaries, statues, pedestals, and major decorative terrain
are represented as `PaintLevel` data and routed through `gameBridge.ts`.

The Amulet is now placed at Java's `LastLevel.AMULET_POS` (cell `12*16+8`,
coordinates x=8/y=12) after the Yog transition, rather than on the hero's
arrival cell. The remaining differences are gameplay scripts rather than a
generic-floor fallback. Tengu now has a one-time phase relocation/trap burst; DM-300 now has
pylon proximity sealing, short energy pressure, and overcharge ground effects;
the King summon/barrier cycle is live; and Yog's three fists gate beams and
rotate four available debuffs. Exact floor shifting, rockfall/gas, King throne
and Imp content, Yog flame/shadow arenas, and final-vault visual behavior still
and final-vault visual/compass behavior still need dedicated scene systems; the
final-vault music stop is now ported. Caves' four pylon cells are represented as live
dedicated actors rather than inactive trap scenery; their remaining DM-300 lock/supercharge
coupling is tracked in the boss row above.

## Data-driven dispatch (2026-09-09)

User-flagged code-quality pass: `main.ts` had 205 `kind === '...'`/`id === '...'` string-compare
checks total (a full-file audit, not a guess), spread across ~19 functions rather than
concentrated in one place - `takeMonsterTurn` (43) and `spawnMonster` (37) were the two
genuinely large cascades, with `kill` (26), `attack` (21), and others smaller. Converted the
two largest independently-dispatchable cascades into `Record<Kind, handler>` registries:

- `quaffPotion`'s 39-branch `if (id === ...) else if (...)` potion-effect chain -> `potionEffects`,
  one entry per generated potion id, each handler doing exactly what its old branch did (same
  Java-source comments, moved onto their own entry). The `potionPurity` fallback and any
  genuinely unrecognized id still route through `applyPotionPurity` from `quaffPotion`'s own
  `else`, now with a `console.warn` guard - this exact silent-fallthrough shape (an unmapped id
  quietly acting as Purity) is the same bug class already found and fixed twice in this
  function's history (Frost, then Toxic/Paralytic Gas).
- `takeMonsterTurn`'s 236-line, 16-case non-adjacent "ranged special ability" cascade (every
  kind that does something other than melee or generic movement once `distance >= 2`:
  DM100/Shaman/Necromancer(+SpectralNecromancer)/Tengu/DM300/Yog/Warlock/Elemental/YogFist/
  Scorpio(+Acidic)/Guard/DM200/DM201/Spinner/Golem/Eye/GnollTrickster/GreatCrab) ->
  `rangedAiOverrides`, keyed by `monster.kind`. Each handler returns `true` if it consumed the
  monster's turn (the original branch's `return`) or `false` to fall through to the shared
  movement AI below (the original branch's condition failing, or no branch existing for that
  kind at all) - a direct behavior-preserving restructure, not a rewrite. Three cases that
  shared one underlying behavior via an `||`-joined kind check in the original cascade
  (Necromancer/SpectralNecromancer, Scorpio/Acidic, DM200/DM201) now share one helper method
  (`necromancerRangedTurn`/`scorpioRangedTurn`/`dm200VentAttempt`) referenced from two registry
  keys instead - DM201 additionally always returns `true` regardless of whether its vent
  attempt (delegated to the same `dm200VentAttempt`) actually fired, matching real Java's
  `IMMOVABLE` property that DM200 itself lacks.

Both refactors are a restructuring of *dispatch shape* only (linear string-compare cascade ->
O(1) keyed lookup), not a behavior or formula change - every case was checked against its
pre-refactor code path, and the harder ones (state-machine-shaped, not simple single-branch
effects) were browser-verified live post-refactor to confirm identical values: Eye's two-turn
charge-then-fire beam (including the 1/4-damage-while-charged interaction elsewhere in the
damage pipeline), Golem's teleport-plus-20-turn-cooldown (a second immediate attempt correctly
did nothing), Guard's chain-once-ever (a second attempt on the same Guard correctly did
nothing), DM200 (movable, resumes chasing when a forced-cooldown vent roll fails) versus DM201
(always immobile regardless of the same forced-cooldown vent-miss), GreatCrab's
every-3rd-turn movement throttle (no move on turns 1-2, moves and resets its counter on turn
3), Scorpio's ranged attack, Spinner's web-root, and Necromancer's full summon -> heal ->
adrenaline chain (skeleton healed exactly HT/5, then granted the haste stand-in on the
following turn once at full health). `tsc --noEmit` and `npm run build` both clean throughout.

`spawnMonster`'s 37-branch cascade was converted too, same pass: the 7-kind stat-override
ternary chain, the 10-kind base-alias ternary chain, and a 12-case sprite-texture-reuse chain
(the messiest of the three - inconsistent indentation from having grown by one clause per pass,
itself a live example of the OR-chain smell this file's section 11 already flagged) all became
real data tables in `monsters.ts` (`DEPTH_SCALED_STATS`, `BASE_KIND_ALIASES`,
`SPRITE_KIND_OVERRIDE`), plus `isNPC`/`isBoss`'s `||`-chains into `NPC_KINDS`/`BOSS_KINDS` sets.
The texture chain simplified further than a direct transcription: the original checked both
`kind` and `baseKind` (12 cases total), but every kind checked against `kind` directly
(`sentry`/`ratKing`/`rotHeart`/`rotLasher`) has no `BASE_KIND_ALIASES` entry, so `baseKind`
already equals `kind` for each of them - meaning a single lookup by `baseKind` covers every
case the original needed two dispatch passes for. Live-verified via direct texture-identity
comparison (spawning one of every affected kind and reading each sprite's underlying texture
source): `mimic`/`crystalMimic` share the dedicated `mimic.png` source, `piranha` uses
`piranha.png`, `bee` uses `bee.png`, and `statue`/`armoredStatue` use `statue.png`;
`greatCrab` alone continues to reuse `crab.png` because its Java sprite explicitly does so.
Every dedicated-asset kind resolves to its own distinct source - exactly
`SPRITE_KIND_OVERRIDE`'s intended grouping, no cross-contamination.
`tsc --noEmit`/`npm run build` clean throughout. See `ROADMAP.md` section 11's matching entry.

**Not a candidate for `mwg` itself** (the user asked whether this pattern belongs in the
framework): the *pattern* - a keyed handler registry with a "return true if you handled it"
contract, replacing a branch cascade - is genuinely generic and would be reasonable for `mwg`
to offer as a documented convention or small typed helper. But every handler *body* here is
concrete SPD monster/potion logic, which `CLAUDE.md`'s licensing-boundary section forbids
putting in `mwg` (MPL-2.0, must stay game-agnostic, never SPD-specific data or logic). Recorded
in `ROADMAP.md` as a possible upstream proposal for the user to raise in the framework's own
repo, not something actionable from inside this one.

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

| `WandOfLivingEarth.onZap()` / `RockArmor.absorb()` / `EarthGuardian` | `useSpecial` zap branch, `maybeSummonEarthGuardian`, `takeEarthGuardianTurn`, `absorbHeroDamage`, run save/load | Simplified but playable: the wand uses the real damage range `NormalIntRange(4, 6 + 2*level)`, stores successful hits as rock armor capped at `2*(8 + 4*level)`, creates the dedicated Java `EarthGuardian` actor at the threshold, heals it when targeted, lets it attack and reform into rock armor when no visible hostile remains, and incoming damage consumes `ceil(damage/2)` rock armor before ordinary barriers. The guardian's particles, exact Ballistica targeting, `NO_ARMOR` challenge-specific DR range, and precise nearest-reachable spawn choice remain simplified. |

| `WandOfRegrowth.onZap()` / `chargesPerCast()` / degradation counters | `useRegrowthWand`, `regrowthChargeLimit`, `useSpecial` wand branch, run save/load | Simplified but playable: the real 1–3 charge cost (`ceil(30% of current charges)`), level-scaled degradation limit, `round((3.67 + level/3)*charges)` grass budget, `4*charges` Roots duration, furrow chance after the limit, Seedpod/Dewcatcher chances, and generated seed activation are reproduced. The Java `ConeAOE` is represented by a target-centred Chebyshev circle because this port has no cell-targeting picker; its Lotus NPC, exact cone orientation/path, immovable-property filtering, and Dwarf King challenge flag are not ported because no equivalent actor/property system exists here. |

| `WandOfTransfusion.onZap()` | `useTransfusionWand`, transfusion target selection in `useSpecial` | Simplified but playable: enemy targets receive the real `5 + level` hero shield and living enemies receive the existing Charm state; undead receive the real `NormalIntRange(3 + level, 6 + 2*level)` damage after armor. Ally targets receive the real heal amount and pay the real 5% hero-health cost. The port has no generic ally Barrier pool, so overheal shielding on allies is omitted; no cell picker exists, so visible allies are auto-preferred and otherwise the nearest visible enemy is chosen. |

| `WandOfWarding.onZap()` / nested Java `WandOfWarding.Ward.zap()` actor | `useWardingWand`, `takeWardTurn`, `monsters.ts`'s `ward` kind, persisted ward fields, `images.ts`'s `wards` asset | Simplified but playable: casts create scheduled tier-1 `ward` actors within the Java energy budget (`2 + wand level`), wards use the dedicated Java `WardSprite` six-tier film and fire always-hit `NormalIntRange(2 + wand level, 8 + 4*wand level)` attacks at visible hostiles, and the real tier 1–3 zap lifetimes and tier 4–6 self-damage are reproduced. Existing wards are auto-selected for the Java tier upgrade/heal interaction. Aimed-cell placement, exact line-of-sight collision, and ward dismissal UI use nearest-visible targeting because this port has no cell picker. |

| `WandOfCorrosion.onZap()` / `WandOfCorruption.onZap()` | `useSpecial` zap branch, `wandTypeFromSource`, generated wand identity | Simplified but playable: Corrosion now deals no artificial direct damage and applies the existing depth-scaled `Ooze` damage-over-time status to the selected cell and visible adjacent creatures, preserving the real gas burst's area shape without a separate `CorrosiveGas` volume/intensity actor. Corruption now heals/cleanses the selected monster and converts it into a scheduled ally using the port's existing ally AI; the real permanent `Corruption`/loot-transfer buff payload and immunity-specific `Doom` fallback are not modeled. Both wand families are now reachable through generated `sourceClass` identity and saved equipment state. Checked against local SPD `WandOfCorrosion.java` and `WandOfCorruption.java` at the current checkout. |

| `StoneOfFlock.activate()` / `SheepSprite` | `useStoneOfFlock`, `spawnSheep`, `monsters.ts`'s `sheep` kind, `images.ts`'s `sheep` asset | Simplified but playable: spawned sheep now use the dedicated Java `SheepSprite` 16x15 film copied byte-for-byte from the SPD asset, remain neutral/invulnerable for their scheduled lifespan, and disappear after expiration. Cell targeting remains centered on the hero because this port has no thrown-cell picker; Sheep's flavour animation/audio and manual dispel interaction are not modeled. |

| `ChampionEnemy.Blazing.detach()` | `kill()`'s champion-death hook and floor `fire` blob | Ported - a grounded blazing champion seeds volume 2 into each eligible neighbouring non-solid, non-water cell on death, with Java's suppression when it is flying over a pit. The existing floor-scoped Fire blob supplies the same short-lived environmental effect; particles and aura visuals remain outside the logic port. |

| `PotionOfFrost.shatter()` / `Freezing.freeze()` | `quaffPotion`'s `potionFrost` branch | Simplified but broadened to Java's `NEIGHBOURS9` impact: every eligible creature in the 3x3 area around the quaffing hero is chilled/frozen, including elemental harm, instead of only the nearest visible enemy. The port still uses direct status application rather than a persistent Freezing blob, and does not freeze heaps or clear ordinary Fire terrain. |

| `Tengu.canUseAbility()` / `targetAbilityUses()` / `useAbility()`, `Tengu.throwFire()` / `FireAbility`, `Tengu.throwShocker()` / `ShockerAbility` | `simulation/tenguAbility.ts` (tested cadence), `takeTenguTurn`, `tenguFireAbilityIfReady`, `tenguUseAbility`, `tenguThrowFire`, `tenguThrowShocker`, saved `tenguAbilityCd`/`tenguAbilityUses`/`tenguLastAbility` | **Ported (cadence) / Simplified (ability actors).** 2026-09-10: the phase-2 cadence is now Java's real `canUseAbility()`/`useAbility()` schedule instead of a flat every-third-turn rotation - `targetAbilityUses()` = `1 + 2*arenaJumps + max(0, arenaJumps-2)` bounds the casts (11 over a full four-jump fight, so Tengu can run dry until the next jump), the cooldown starts at 2 and takes the real `Random.IntRange(1, 4)` gap, and all three catch-up rules are reproduced (4+ behind casts immediately, except on the bosses challenge; 3+ behind paces every other turn). The pure arithmetic + single-draw step is extracted to `simulation/tenguAbility.ts` and covered by `tools/verifySimulation.mjs`, including assertions that no draw happens at the points Java itself would not draw (which keeps the run's random stream aligned). `useAbility()`'s selection is exact too: scripted Bomb then Shocker, then a roll that repeats the previous ability only 1/10 of the time (`tenguLastAbility`), with Bomb/Shocker falling back to Fire on their scripted use and the bosses challenge excluding Fire from the roll but adding a guaranteed Fire cast after any non-Fire ability. An ability now owns the turn rather than riding on top of an attack, which uncovered and fixed a real bug: when Tengu was adjacent, the generic melee branch consumed the whole turn and the ability check never ran (Java checks `canUseAbility()` before `doAttack()` in both cases), so a phase-2 ability could previously only ever fire at range. Fire preserves the hero-facing three-cell cone, three rings, volume 2, and solid-cell stopping; Shocker preserves the real `2 + scalingDepth()` direct damage over its 3x3 burst. The `FireAbility` actor is now Java's (2026-09-11): `Creature.tenguFire` holds the `PathFinder.CIRCLE8` direction taken from the aiming `Ballistica`'s first step plus the ring it has reached, saved with the creature, and `advanceTenguFire` spreads one ring per Tengu turn from the top of `takeMonsterTurn` - which is where a Java `Buff` acts, with its host - so the cast turn seeds nothing and the first ring lands on Tengu's next turn. Verified live at depth 10 (`_browsercheck/tengu_fire_check.mjs`): three cells on the first ring, then eight, fifteen, twenty-three, thirty-two and forty-one burning cells, reaching nine cells at distance six after six turns, every cell on the aimed side and inside the map, and the same growth from a real `takeMonsterTurn`; it is an advancing front that ends against walls, not a three-ring burst. Its one deviation is the field it spreads on: the port's `Blob` diffuses where Java's `FireBlob` decays in place at one volume per turn, so Java's "the previous ring is still burning" guard is a shade more permissive here (a ring extinguished by water can still read as burning through a neighbour), and where the front can go is the port's own fire spreading. The `ShockerAbility` actor is still collapsed to its one turn of `2 + scalingDepth()` damage: its Java `act()` as written never detaches, so its lifetime needs resolving against a real fight before it is guessed at. The port also keeps one Tengu-cell arena instead of rebuilding Java's separate phase-2 `arena` ellipse, and an ability spends one whole turn rather than Java's 1-2 `TICK`s. **2026-09-11: the ability turn cost is now real** - `Tengu.useAbility()`'s trailing spend (`Actor.TICK = 1`) is 2 ticks normally, 1 when 4+ behind on the cast budget; the bosses challenge uses 1 tick, or 0 when 4+ behind (the check reads the pre-increment cast count, like Java's `abilitiesUsed`). The rule is the pure, unit-tested `tenguAbilityCost()`, wired through the scene's `monsterTurnCost` hook; previously every cast spent the default single turn, so a normal-mode Tengu cast roughly twice as often as Java. Browser-verified on all four branches. |

| `CloakOfShadows.execute()` / `cloakStealth` / `cloakRecharge` | `useCloak`, inventory action row, bag `charges`, `cloakChargeProgress` and `cloakStealthTurnsToCost` save fields | Simplified but playable: the Rogue cloak starts at the real level-0 three charges, toggles invisibility from its inventory row, consumes one charge every four hero turns, remains active for the final four-turn charge window, and passively recharges using Java's level-0/level-scaled `45 - missing` cadence. The port treats a carried cloak as equipped and has no artifact quickslot, active-buff icon, sound, artifact XP/level-up, MagicImmune action gate, or Light Cloak talent path; these are UI/progression differences, not silent charge behavior. |

| `RingOfWealth.tryForBonusDrop()` / `TriesToDropTracker` / `DropsToEquipTracker` | `tryWealthBonusDrop`, `wealthTriesToDrop`, `wealthDropsToEquip`, `kill()` | Simplified but playable: the separate missed-drop counter now runs in addition to ordinary mob loot, with Java's 1/5/15 roll counts for ordinary/miniboss/boss kills, 0–20 retry increments, 5–10 consumable/equipment pacing, and persistent save state. The result catalogue is narrowed to this port's playable potion/scroll/stone/gold payloads or armor stand-in, and one-item-per-cell placement uses neighbouring cells instead of Java heaps; exact rarity weighting, Generator challenge filtering, second Wealth ring cap, and flare presentation remain unported. |

| `PotionOfLiquidFlame.shatter()` / `Fire` blob | `quaffPotion`'s `potionFlame` branch and floor `fire` state | Simplified but shape-faithful: quaffing now seeds Fire volume 2 in the Java `NEIGHBOURS9` area centered on the hero, replacing the previous incorrect instant 4-damage nearest-enemy hit. The port has no thrown-cell picker and its shared Fire evolution applies Burning on the following turn rather than Java's exact blob actor cadence; terrain destruction, heap burning, particles, and audio remain unported. |
| `Golem.Wandering.continueWandering()` self-teleport | `Creature.patrolTarget`, `golemSelfTeleCooldown`, wandering path fallback | Simplified presentation, Java-shaped behavior: when a retained wandering destination cannot be approached, the Golem relocates to it, uses the real 30-turn cooldown, and costs 2 ticks. The Java charge-particle/delayed-animation actor is folded into one logical action. |
| `Golem.act()` cooldown ticking | `takeMonsterTurn` before AI dispatch | Ported: both enemy-teleport and wandering self-teleport cooldowns now decrement on every Golem turn, including adjacent melee turns, matching `Golem.act()` rather than only ticking in the ranged branch. |
| `WandOfRegrowth.Lotus` and `Plant.trigger()` seed preservation | `spawnLotus`, `takeAllyTurn`, `lotusPreservesSeed`, `useRegrowthWand`, `triggerPortedPlantAt` | Ported with presentation/carrier simplification: qualifying 3-charge casts create a neutral expiring Lotus with Java's `25 + 3*wandLevel` HP, and nearby plants preserve their concrete seed with the real `0.40 + 0.04*wandLevel` chance, excluding Rotberry. The target-cell picker and Lotus sprite are represented by the target-centred eligible-cell choice and a tinted ward carrier. |
| `Waterskin` explicit drink action | inventory entry/use dispatch | Ported through the compact inventory UI: selecting the Waterskin now invokes its drink behavior even when other potions are present, while preserving Java's drop-count and shield calculations. |
| `Swarm.defenseProc()` split state and `lootChance()` generation term | `main.ts`'s `swarmSplit`, `monsters.ts` `MOB_LOOT.swarm`/`LIMITED_DROP_DECAY` | Ported: a surviving Swarm hit can create a free 4-neighbour clone with `floor((preHitHP-damage)/2)` HP while retaining the normal 50-HP maximum, increments the clone generation, copies Burning/Poison/champion state, and applies Java's `1/(6*(generation+1))` loot term together with the run-wide `SWARM_HP` decay. The compact scheduler still uses the shared spawn-time stagger rather than Java's exact one-time `SPLIT_DELAY = 1` timestamp. |
| `Armor.speedFactor()` / `Swiftness` glyph | `main.ts`'s `getActionTurnCostMod` and `hasSwiftnessEnemyNearby` | Ported: safe movement uses Java's 8-way passable path-distance-2 enemy check and applies the exact `(1.2 + 0.04 * buffedLvl) * RingOfArcana` speed multiplier as inverse action cost. The port still uses its shared fractional turn clock rather than Java's actor-duration scheduler. |
| `Armor.speedFactor()` / `Flow` glyph | `main.ts`'s `getActionTurnCostMod` | Ported: while standing in water, Flow applies Java's `(2 + 0.5 * buffedLvl) * RingOfArcana` speed multiplier as inverse action cost. The port has no separate water animation/audio effect. |
| Legacy Flow `+2 evasion` stand-in | `main.ts`'s `syncHeroFromStats`/`equipArmor` | Removed: `Flow.java` has no evasion effect; its only gameplay effect is the water speed multiplier documented above. |
| `StoneOfAggression.Aggression` duration | `main.ts`'s `useStoneOfAggression`/`aggressionTarget` | Ported: Java uses 20 turns for an allied target and `DURATION / 4` (5 turns) for every enemy target, not only bosses; the forced-target AI branch is shared by ordinary enemy movement and melee. |
| `Goo.act()` water healing and `Goo.healInc` | `takeGooTurn`, `Creature.gooHealInc`, `SavedCreature.gooHealInc` | Ported: Goo heals by its persistent increment while damaged and standing in water; the `STRONGER_BOSSES` challenge starts it at 120 HP and ramps the increment from 1 to 3, while leaving water or reaching full HP resets it to 1. Java's `LockedFloor` boss-room door countdown and its visual healing presentation remain unported. |
| `Monk.focusCooldown` / `Monk.move()` / `Senior.move()` | `Creature.focusCooldown`, `afterMonsterTurn`, `moveTo`, Focus defense branch | Ported: Focus now uses a persistent floating 6–7-turn cooldown after a parry, loses one action-time unit per Monk/Senior turn, and gains Java's extra movement reductions (0.67 for Monk plus 1.66 for Senior). The port still attaches Focus through its shared buff map and has no Java sprite/audio parry presentation. |
| `Shaman.random()` subtype and `Shaman.zap()` debuff | `Creature.shamanType`, `spawnMonster`, `zapHero` | Ported: Shamans now retain Java's one-draw 40% red/30% blue/30% purple subtype and apply Weakness, Vulnerable, or Hex on a landed magic bolt at the real 1-in-2 chance. Dedicated colour sprites and debuff audio remain unported. |
| `WandOfFrost.onZap()` damage and Chill interaction | `useSpecial` wand branch | Ported for the selected target: Frost now uses Java's `2+level` to `8+5*level` damage range, deals reduced damage against existing Chill, does nothing to an already-Frozen target, and applies the terrain-sensitive `2+level`/`4+level` Chill duration. The generic Blob API has no per-cell clear method, so Fire/eternal-fire extinction, frozen heap handling, exact Ballistica targeting, and staff-on-hit Frost are not modeled. |
### Current correction: EnhanceBomb

The ten `Bomb.EnhanceBomb` ingredient/result pairs are now executable through the authored
alchemy picker. The base blast follows Java's own `explosionRange()` per subclass (1 for a plain
bomb, 2 for Frost/Fire/Flashbang/Shock/Woolly/Holy/Noisemaker, 3 for Regrowth, 8 for Shrapnel),
and Regrowth, Arcane and Shrapnel no longer receive it at all - all three override
`explodesDestructively()` to false in Java, so giving them the base blast was an undeclared
divergence. Arcane then rolls its own armor-piercing `NormalIntRange(4+scalingDepth,
12+3*scalingDepth)`, Shrapnel the same roll minus the target's armor over line of sight up to 8,
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
pool is now enforced, but its scrap/add UI and blast particles/sound remain open. GooBlob and
MetalShard identities are authored, their Java value/energy metadata is represented, and
Goo/DM-300 now drop 2/3/4 materials with the real 60/30/10 distribution. The port's
one-item-per-cell placement is a documented heap simplification.
