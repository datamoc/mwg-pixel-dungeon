# Port coverage notes: Simulation extraction (steps 1-5)

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

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
with required-field validation; sprite film dimensions and idle frames are authored in the MWL
asset-reference tables while Pixi sheet cutting remains adapter logic. The catalogue includes the port's documented special-actor
values and balance reductions (for example invulnerable NPCs, Goo's base state, and Yog's
scaled encounter), so those values are no longer duplicated in TypeScript.

The weapon, armor, and wand catalogues now follow the same path in `src/content/items.mwl`.
Tiered variants use deterministic MWL item IDs, while portable numeric properties such as wand
damage and weapon speed are represented by MWL effects and read by `src/items/catalog.ts`
(renamed from `items.ts` in the `src/items/` split); formulas and runtime behavior remain in
the game hooks. **Corrected 2026-09-13:** `catalog.ts`'s `WEAPONS`/`ARMOR`/`WANDS`/`RINGS` had
zero consumers anywhere in `src/` until this pass wired `itemKinds.ts` and `generatedItems.ts`'s
weapon/armor tier-by-class lookups through it (removing three independent hand-typed copies of
the same 31 weapon + 5 armor tier assignments); `catalog.ts` itself is exercised by
`tools/verifyItemWorkflows.mjs` for the first time as of the same pass.
The same item family now has 47 MWL-authored localized description keys in
`item-rules.mwl`; the inventory inspection detail resolves them without moving combat or
upgrade behavior into content data.

**`src/content/artifacts.mwl`/`src/items/artifacts.ts`, corrected 2026-09-13 - six of ten
previously-authored "artifacts" were not real Shattered Pixel Dungeon content.** This row and
the "Artifact definitions" row below both used to describe all ten as legitimately ported/defined
SPD data. Checked directly, in order: (1) `artifacts.ts` (`ARTIFACTS`/`getArtifact`/
`getAllArtifactIds`) had zero consumers anywhere in `src/` - nothing called those records, despite
this row's prior claim that it "adapts the generated resource into its public typed records". (2)
The one artifact with a real, live charge mechanic disagreed outright with its authored data:
`artifact_cloak` authored `base_charge=40`/`max_charge=40`/`recharge_rate=10`, while
`DungeonScene`'s real Cloak of Shadows logic computes `maxCharge = min(level+3, 10)`. Fetching the
real `CloakOfShadows.java` (tag `v3.3.8`) confirmed the *port's* formula is the Java-accurate one
(`chargeCap = Math.min(level()+3, 10)`, verbatim) and the authored MWL numbers were invented, not
merely simplified - Java's actual regen is a dynamic `45 - (chargeCap - charge)` turns-to-charge
curve, not a flat rate at all. `TimekeepersHourglass.java` confirmed the same pattern
(`chargeCap = 5+level()`, a dynamic `90 - 3*(chargeCap-charge)` regen), against authored
`base_charge=100`/`max_charge=100`/`recharge_rate=40` - equally invented. (3) The real finding:
checked all ten authored `name` keys against the complete generated message catalogue (3753+ real
SPD keys, 19 languages) and the real `v3.3.8` `items/artifacts/` roster (13 classes:
AlchemistsToolkit, CapeOfThorns, ChaliceOfBlood, CloakOfShadows, DriedRose, EtherealChains,
HornOfPlenty, LloydsBeacon, MasterThievesArmband, SandalsOfNature, TalismanOfForesight,
TimekeepersHourglass, UnstableSpellbook). Six authored entries -
`ArmbandsOfHerculaneum`/`CapstoneOfExecution`/`DemonslayerArmor`/`PickaxeOfMining`/
`MysteriousLocket`/`SandalsOfTime` - match **no** real class and **zero** message keys; they were
fabricated, invented names given plausible-sounding SPD-style flavor and false charge stats, not
ported content. A seventh, `artifact_chronometer`, was a confused near-duplicate of the real
Timekeeper's Hourglass under a typo'd key (`timekeeperhourglass`, missing the required "s").
**Fixed**: `artifacts.mwl` now authors exactly three entries - the two with real, live TS
implementations (`cloak`, `hourglass`, both name/desc keys verified against the real catalogue)
(the `chalice` clause this residual pointed to - real SPD content, correct `chaliceofblood` key - was implemented 2026-09-14, see below)
honest placeholder, not removed, since it is genuine). `ArtifactDef` dropped
`baseCharge`/`maxCharge`/`rechargeRate` entirely, since no real artifact's mechanic reduces to that
shape (each is its own bespoke formula - see above). **`ARTIFACTS` is now a real consumer**: wired
into `i18n/spdKeys.ts`'s `ITEM_KEYS` for `cloak`/`hourglass`, which fixed a live, separate bug in
the same area - `itemDisplayName`'s `ITEM_KEYS[id] ?? id` fallback meant an identified or
unidentified cloak/hourglass rendered as the bare id text ("cloak"/"hourglass") instead of a
translated name, since neither id had ever had an `ITEM_KEYS` entry at all. Browser-verified live
via `window.__MWG__.currentScene`: granting a `cloak` now displays "cape des ombres" (French for
Cloak of Shadows) and a `hourglass` displays "sablier de gardien du temps" (Timekeeper's
Hourglass), both matching the real generated catalogue exactly, identified or not.

**Chalice of Blood is now implemented (2026-09-14, `ChaliceOfBlood.java` tag `v3.3.8`), closing
the `chalice` placeholder above.** `useChalice` (`src/items/artifactActions.ts`) reproduces
`prick()`'s exact `NormalIntRange(ceil(3 + 2.5*level^2), floor(7 + 3.5*level^2))` self-damage
formula (authored in `item-rules.mwl`'s `itemEffectValues` table: `chaliceMinDmgBase`/
`chaliceMinDmgPerLevelSq`/`chaliceMaxDmgBase`/`chaliceMaxDmgPerLevelSq`/`chaliceLevelCap`),
routed through the shared `absorbHeroDamage` boundary (Tenacity/AntiMagic/Viscosity/RockArmor/
Barrier) the same way every other hero-inflicted-on-self source does (bomb blast, trap damage),
either killing the hero (`kill(hero, 'trap')`, the closest existing death-cause bucket - Java's
own `ondeath` line plays either way) or permanently upgrading the chalice up to `levelCap = 10`.
Cursed, already-capped, or `MagicImmune` (AntiMagic) chalices refuse the action, matching Java's
`actions()` gate. **Stated simplifications, not silent gaps:** real Java also subtracts the
hero's own `drRoll()` (armor) before calling `hero.damage()` - this port's `absorbHeroDamage`
boundary has no separate bare armor-only roll exposed to a bespoke item action (only
`applyBlastDamage`'s *monster* branch resolves armor, and that call site's own hero branch
already skips it too), so the self-hit here is not reduced by armor; real Java's `WndOptions`
confirmation naming the exact computed death chance has no equivalent window in this port
(matching every other "use item on self" action here) and pricks immediately. The passive
`chaliceRegen` half is ported since 2026-09-23 through `Regeneration` (see the Regeneration +
LockedFloor row at the top; this paragraph used to call it "Not ported at all" for want of a
natural-regeneration system). Generation was fixed in the
same pass: `generatedInventoryItem`/`sourceInventoryItem` (`src/items/generatedItems.ts`,
`src/items/itemKinds.ts`) used to route every generated artifact other than the Hourglass to
`cloak` regardless of its real class - a live `ChaliceOfBlood` drop silently became a second Cloak
of Shadows - now checked for `chaliceofblood` before that fallback. `bonesItemForPickup` (Bones
remains) is also now symmetric across all three artifact ids (`cloak`/`hourglass`/`chalice`)
rather than only recognizing `cloak` by id, a related pre-existing hourglass gap fixed in passing.
Type-check/build and the item/simulation/mwg suites are green; browser verification is owed
per ROADMAP.md section 10 (not attempted this pass).

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

**2026-09-14 fix:** the Items tab's scroll list (`journalContent.ts`) was a hand-typed 11-entry
array missing `scrollTransmutation` - `Catalog.SCROLLS` (`journal/Catalog.java`) is seeded from
`Generator.Category.SCROLL.classes` (`items/Generator.java` 293-305), the real 12-scroll list
ending in `ScrollOfTransmutation.class`, which `consumable-aliases.mwl`'s `category: "scroll"`
rows already author in full. The list now reads `MWL_CONSUMABLE_CLASS_ALIASES` instead of
duplicating it, so Transmutation - and any future scroll added only to the MWL table - shows up
without a second edit site.

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
the three starting thrown classes now also carry their source class and per-level damage
increments in MWL, and `DungeonScene.useSpecial()` consumes that metadata instead of branching
on the hero class. The compact shared ammo counter remains a deliberate port simplification;
pickup integration and distinct missile behavior are no longer open (corrected 2026-09-25): the
shared ground-pickup gate routes through `missilePickupValid` (`groundPickup.ts`, scene seam
`npcShopBlacksmith.ts`), Bolas cripples on every proc through `bolasCrippleTurns()` at both throw
sites (`armorAbilityUse.ts`, `inventoryQuickslot.ts`), and the HeavyBoomerang return runs as Java's
five-turn `CircleBack` - `BOOMERANG_RETURN_TURNS`/`BOOMERANG_RETURN_ACC_FACTOR`, the 1.5
`circlingBack` accuracy factor, the cancel and replace-on-arrival rules - persisted in the save
shape (`shared.ts`) and restored on load. `PinCushion`'s `stuckAmmo` scatter on death
(`deathSaveRefresh.ts`) and `MISSILE_MAX_DURABILITY` are live too; the shared ammo counter remains
the one deliberate simplification.
Their fifteen localized description keys are now authored alongside the missile catalogue and are
shown by the inventory inspection detail; executable special behavior remains in TypeScript.
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
any recipe reference without an authored item identity. The alchemy-pot interaction is a recipe picker plus one ingredient picker per unit (2026-09-17), which covers Java's add controls - the scrap half is the Alchemize cast's energize picker; the
simultaneous multi-slot window with its recipe preview and cook button stays simplified. The carried energy pool is now
persisted, fed by EnergyCrystal pickups, and consumed by recipe costs. Seed-to-potion brewing,
scroll-to-stone, alchemize and both catalysts are executable with chosen or first-eligible units;
(open residual moved to `ROADMAP.md` R012)
**Closed 2026-09-21** (was: "a related pre-`v3.3.8` leftover stays open"): `AlchemicalCatalyst`/
`ArcaneCatalyst`/`AquaBlast` are retired - see the dedicated row below, which supersedes the stale
"Simplified" row still describing them elsewhere in this section.
**The four regular brews are now executable recipes (2026-09-19):** `InfernalBrew` (one
liquid flame, 12 energy), `BlizzardBrew` (one frost, 8), `ShockingBrew` (one paralytic gas, 10)
and `CausticBrew` (one toxic gas plus one goo blob, 1) - Java's own inputs and costs from
`items/potions/brews/*.java` (tag `v3.3.8`). Every brew carries Java's `value()` (60) and
`energyVal()` (12) in MWL and its real atlas cell (400-403). **Thrown and shattering:**
`useBrewFlow`/`shatterBrewFlow` in `simulation/brews.ts` (the file-size refactor's fifteenth extraction, 2026-09-19, behavior-identical - the scene keeps the one-line `useBrew` adapter the router calls plus a builder over its bag/aim/floor/blob/turn seams) aim through the bomb's picker (passable non-chasm, six cells) and
resolve all four shatters - Shocking seeds `Electricity` 20 over the radius-3 flood,
Caustic lays `Ooze` on every non-NPC creature in the same flood (the table's 20 matching
`Ooze.DURATION`; NPCs stay out per the area-effect convention), and Infernal/Blizzard seed
their blobs (120 per open NEIGHBOURS8 cell, 120 plus 120 per solid neighbour onto the
center). **2026-09-19 follow-up: both blobs are modeled.** `Inferno.evolve()` clears `Fire`
and `Freezing`/`plantFreeze` on live cells, annihilates with `Blizzard` instead of burning,
reignites occupants (`Fire.burn`), destroys flamable terrain, and seeds `Fire` 4 on flamable
4-neighbours without fire; `Blizzard.evolve()` mirrors the clears and annihilation and runs
`Freezing.freeze(cell)` twice (two shared chill-then-Frost steps - the water 5-vs-3 nuance
stays unmodeled, like the frost-potion path). Pinned in `test:simulation`
(`tools/verifyBrews.mjs`: flood shape, volumes, throwable set, inferno burn/destroy/spread,
annihilation, double chill) and `test:items` (all four recipes, a brewed shocking brew,
scrap energy, all four values). Type-check/build/check/item/simulation suites green; browser
verification owed per ROADMAP.md section 10.

The `Alchemize` spell's **cast** is now ported (`useAlchemizeFlow` in `src/items/spells.ts` - the file-size refactor's twenty-third extraction, 2026-09-19, behavior-identical; the scene keeps the one-line `useAlchemize` adapter plus a builder - dispatched from `useItemById`):
casting it opens the shared item picker over the bag and scraps one unit of the chosen consumable
into `Item.energyVal()`, identifying it as it goes and spending no turn - Java's `WndEnergizeItem`
/`energize()` shape. The yield is authored per *kind* in `alchemy.mwl` (seed 2, runestone 3,
scroll/potion/food 6), with `alchemyEnergyFor` reducing a concrete port id (`potionHealing`,
`seedMageroyal`...) to its kind and applying `Item.energyVal()`'s four `isKnown()` overrides
(`potionStrength`/`potionExperience`/`scrollUpgrade`/`scrollTransmutation` give 10 while
identified; the four known-item override values are authored in `alchemyKnownEnergy` rather
than a TypeScript set). Stated reductions: Java's window also offers a sell branch and an "energize all"
button, both folded into the single picker action, and the per-class values for outputs this port
cannot yet obtain (elixirs 12, exotic potions +4/+6, `GooBlob`/`MetalShard` 3) are not
authored. **Its recipe is now executable through a category-aware transaction**: `Alchemize.Recipe`
takes *any* `Plant.Seed` plus *any* `Runestone`, so `craftAlchemize` selects one carried item from
each category and produces Java's eight-unit output. The generic exact-id transaction remains in
use for every other recipe; the multi-ingredient alchemy window is still simplified.
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
manifest entry before loading sprites. As of MWG 0.8.1, shared terrain/effect atlas identities
are authored in `src/content/asset-references.mwl` as generic object asset records and included
in that manifest. The item atlas is resolved from the generated `itemAssetSources` table during
sprite loading; class, terrain, UI, loading, title, and effect atlas paths are now also represented
by MWL manifest objects, while frame cutting remains renderer-owned.

The MWL build now rejects duplicate item, monster, and trait IDs and validates every monster
roster, boss-transition, and asset reference before emitting generated files. Deterministic
output comparison is also performed by compiling the resource tree twice; broad
(open residual moved to `ROADMAP.md` R013)

**2026-09-14:** closed a real missing-reference gap in that validation: `monsterLoot`'s `kind`
column was not checked against the closed `GroundItemKind` set at all. `monsters.ts`'s
`MWL_MOB_LOOT` reads it with a bare `String(row.kind) as GroundItemKind` cast, so a typo'd kind
would have compiled clean under both `tsc` and `npm run build` and only surfaced as a wrong or
missing dropped item at runtime - the same silent-failure shape the room-rule-table cross-check
above exists to close, and this one had no equivalent. `tools/compile-mwl.mjs` now has
`validateLootKindReferences()`, checked (build-time, in `node`, before `tsc`) against a list
mirroring `dungeonConstants.ts`'s `GROUND_ITEM_KINDS`; verified by feeding it a deliberately wrong
`kind` value, which threw and exited non-zero, then reverting. `npm run check` and
`npm run build` are clean on the real data.

**2026-09-14 (2):** added `validateConsumableAliasReferences()` alongside it, checking every
`consumableClassAliases.item` against the same authored `[item]` id set, so a typo'd or
renamed/removed item id in that table fails the build instead of surfacing as a wrong or missing
lookup at runtime. Verified the same way: a deliberately wrong `item` value threw and exited
non-zero, then reverted.

**2026-09-14 (3):** added `validateGroundKindAliasReferences()`, checking
`itemGroundKindAliases.groundKind` and `specialItemGroundKinds.groundKind` against the closed
`GroundItemKind` set - `src/items/itemKinds.ts`'s `groundKindForItem`/`portItemKind` both cast
these values with `as GroundItemKind` and no runtime check, so a typo would compile clean and
only surface as a live item rendering/behaving as the wrong ground-item family. Verified the
same way.

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

Monster display names moved into MWL too (2026-09-15): every `monsters.mwl` node now carries
its SPD message key as `name`, and `spdKeys.ts`'s 65-entry hand-typed `MOB_KEYS` is derived from
the roster instead of repeated beside it - the largest remaining hand key table is gone. That
migration caught two kinds with no key at all (larva, armoredStatue), which rendered as bare id
text in every language like cloaks/hourglasses once did; both now use real keys
(`yogdzewa$larva`, `armoredstatue`, verified in the catalogue - 528 mapped keys, up from 526).
`tools/compile-mwl.mjs` rejects a nameless monster node, and the item suite pins the roster size
plus those two keys. What stays hand-written in `spdKeys.ts` deliberately: the six small
closed-family tables (classes, regions, buffs, traps) and the derivation rules (missile/wand/
ring/artifact key shapes) - those map port conventions to key shapes, not content, and every
key they emit is still resolved-or-fail by `i18n:verify`. Message *bodies* stay where they are
by the same single-source rule: SPD prose lives in the generated catalogue, port prose in
`portStrings.ts` - duplicating either into `.mwl` files would create the second copy this
migration exists to remove.

Shop shelf stock is authored data too (2026-09-15): `scenario-rules.mwl`'s `shopShelfStock`
table names the simplified opening shelf (two unidentified potions, two identifies) that
`shopStockFor` used to hand-build, with a shape-only compile check (the generic `potion` runtime
id has no catalogue entry to validate against) and an item-suite pin. **Superseded the same day**:
`shopStockFor` (`src/scenes/dungeonScene.ts`) now builds each depth's shelf from `planShopStock`
(`src/items/shopStock.ts`), a real port of `ShopRoom.generateItems()` (`v3.3.8`) rather than the
simplified table above - the tier-matched weapon/missile pair, the depth's concrete armor, an
alchemize stack, the fixed healing potion/three scrolls, the two random potion draws plus two more
random potion-or-scroll draws, two rations, the bomb/doubleBomb/doubleBomb/honeypot roll, a stone
of augmentation, sandbags for a carried identified uncursed hourglass (Java's per-depth fraction of
its remaining capacity), and the rare wand/ring/artifact-or-stylus slot, all in Java's own order and
drawn off the real category decks and the real RNG (including the substream-isolated
`Random.pushGenerator(Random.Long())` shuffle at the end). `scenario-rules.mwl`'s table is now dead
data superseded by this generator, not a documented simplification in its own right; no Java entry
no Java entry is absent any more (the `ChooseBag` pick IS stocked now - see the next paragraph)
rather than substituted - the TippedDart stack, the three depth-20/21 Torches, the one-Ankh-per-shop, and the `ChooseBag` pick ARE all stocked now,
per `shopStock.ts`'s own header comment. Verified by `tools/verifyItemWorkflows.mjs`'s "the generated shop shelf" block
(fixed-entry presence, tier-matched armor per depth, the depth-20/21 torch trio at unit price 8,
the bomb/rare rolls, and the sandbag count formula), a live browser boot (Warrior run, depth 1, no console errors), and the live shop-depth visit below. **Hourglass-in-hand shop visit browser-verified 2026-09-26** (`tools/scratch/hourglass-shop-livecheck.mjs`, 7/7 green, screenshot `tools/scratch/browser-test/hourglass-shop-livecheck.png`): a shelf built with no hourglass stocks no `sandBag`; carrying a fresh identified, uncursed hourglass stocks `shopSandBags(11, 5) = 2` on the depth-11 shelf and increments `hourglass.sandBags` 0 -> 2; the next shop (depth 16) then stocks `shopSandBags(16, 3) = 2` rather than a fresh five, taking the field to 4; a cursed or an unidentified hourglass is refused by Java's own gate (`hourglass != null && isIdentified() && !cursed`); zero page errors.

The pick is `chooseShopBag` (`src/items/bags.ts`): the real argmax over the not-yet-dropped
bags (velvet base weight 1, the rest 0, plus one per holdable backpack entry), stocked in Java's
own position between the alchemize stack and the healing potion, with the flag drop at
shelf-generation time (the port's `ShopRoom.paint()` analogue) and the run's flags persisted with
the save. Java breaks scoring ties by JVM `HashMap` iteration order, which is not reproducible
even in principle, so ties go to the earlier bag id instead - the one stated simplification. The
four bags' `value()` bodies (30/40/40/60) price the shelf through the existing formula, their names
and detail bodies resolve through SPD's own `items.bags.*` catalogue keys, and all four are
excluded from infusion targets and resurrect keeps like Java's non-upgradable, unkeepable `Bag`.
Verified by the suite's bag block (pick/scoring/tie/exhaustion/`stone` disambiguation, shelf
position, values, shelf price) and live (`tools/scratch/bag-shop-livecheck.mjs`, 14/14: velvet
starts dropped, the depth-6 shelf stocks the scroll holder the starting kit's scrolls vote for, the
flag drops exactly once, the shelf note reads the real 400g price, the picker-to-detail-to-buy path
pays it and moves the holder into the bag, and an exhausted flag field stocks no bag) -
the hourglass-in-hand shop visit is now paid too (2026-09-26, same livecheck: the sandbag the shelf stocks while the hourglass is in the bag, and the running `sandBags` field that makes a later shop offer the remainder instead of a fresh five). **Three container-half stat effects are now
live (2026-09-18, all checked against tag `v3.3.8`)**: the Magical Holster's `0.85`
recharge base (normal `0.875`) and `1.2x` missile-use durability, read off holster ownership
(Java gates on the item sitting *inside* the holster; the flat bag keeps no per-item location,
and every owned wand/missile would sit in the one holster anyway); the `Shopkeeper.canSell`
refusal (`unique && !stackable` - bought bags can no longer be sold back); and the
`validateAllBagsBought` badge set (four per-bag badges plus `ALL_BAGS_BOUGHT` at Java's own
cell 67, firing on every acquisition including the free starting velvet, exactly like
`HeroClass.initHero()`'s `collect()`). **Ported 2026-09-19: the open action** - using a bag opens the bag window on its own filtered tab (`bags.ts`'s `bagTab`, routed through the item-action table, free like any window open); three mappings are exact and velvet opens the velvet-named runestone tab with seeds one tap away. **Ported 2026-09-19 (later same day): `grabItems` routing and capacity** - `bagFitsPickup` ports `Item.collect()` over the flat bag: owned sub-bags take what their `canHold` gates match up to 19 stacks each (fixed `BAG_IDS` order stands in for the backpack's bag order), the rest counts toward the backpack's own 20 with sub-bag contents excluded (Java counts `backpack.items` directly), merges and bag items always fit, and refusal is silent with the heap kept (Java's failed collect: no sound, no turn spent). The pickup wires it before sound/ground removal for id-known heaps; the six equipment callbacks gate themselves and report back (upgrade-in-place and victory never touch the bag). Stated stand-ins: per-bag contents arrays still don't exist (the filtered tabs already show the same contents, so routing is capacity-only in effect), and kind classification follows the port's own gates. Residual, out of scope: shop buys, rewards and crafts add straight into the bag without a collect check. **Corrected 2026-09-21: the bag frames ARE ported, and the old "frame-0 fallback" tail was stale** - the four bags wear their own `BAGS`-row sprites (`ItemSpriteSheet.java`, tag `v3.3.8`: `BAGS = xy(1,31)` = 497, `POUCH` 499, `HOLDER` 500, `BANDOLIER` 501, `HOLSTER` 502 - exact), and `items.png` is the real 256x512 sheet so row 31 is genuine art. **The per-bag contents arrays close here as Simplified, not Not-ported**: every observable of a real nested `Bag.items` list is already live and pinned - acceptance (`bagCanHold`), routing + 19/20-stack capacity (`bagFitsPickup`, `test:items`), display (filtered tabs via `bagTab`), the shop pick, the stat effects and the badge set. What differs is only where the membership lives (derived from the flat bag plus gates, in fixed `BAG_IDS` order rather than the backpack's bag order) - no play-visible behavior is missing.

Found and fixed auditing the scenario bullet the same pass: Yog's arrival line was a raw English
`say()` literal, showing English on all 19 locales like the boss-victory lines once did. It is
now `port.log.yogarrives` in all 19 catalogues (English/French human-written, the rest first-
draft MT per this file's translation convention), and `i18n:verify` confirms all 19 carry it
(454 port strings, up from 453).

Fire-model remainder audit (2026-09-15): the §0 bullet's "remaining work" sentence was stale
on three of its four items. Sewer decoration is live (`burnFireTerrain`/`destroyBombTerrain`
turn REGION_DECO into WATER and REGION_DECO_ALT into EMPTY_SP on Sewers depths, with the
ordinary EMBERS result elsewhere). Heap burning matches `Heap.burn()` for every kind this
port represents (scrolls/dewdrops removed, bombs detonated, Mystery Meat chargrilled - Java
burns nothing else; potions shatter only on freeze/explosion, which have their own paths, and
stacked heaps/unique scrolls/containers are the one-payload item-model boundary recorded
elsewhere). Occupant ignition is live (standing in fire re-arms burning on hero and monsters
through the shared gate, which is also where FIERY/piranha immunities bite). What genuinely
remains is webs: Java's `Web` is a flammable Blob the Spinner seeds, while this port roots
directly (documented at the spinner ability site) - there is no web terrain for fire to burn
yet. Creating webs belongs to section 5's monster-ability work, with the fire side already
waiting (the `actors.blobs.web.*` descriptions sit translated in the catalogue, and Spinner's
Web immunity is authored in `monsterStatusImmunities` against the day the status exists).

Per-monster status immunities (`Char.isImmune()`'s mob half) follow the same authored-data path
(2026-09-15): `resistance-rules.mwl`'s `monsterStatusImmunities` table names the port buff ids
Java refuses per kind - the INORGANIC set (bleeding/poison for dm100/dm200/dm201/dm300/golem/
skeleton/necroSkeleton/statue/armoredStatue/pylon, with dm201/necroSkeleton/armoredStatue
inheriting through their `extends` chain), the STATIC set (terror/amok/charm/paralysis for
demonSpawner/rotHeart/pylon/yog), the ACIDIC set (ooze for goo/acidic/causticSlime/rottingFist),
burning for the burning fist, the INORGANIC pair for the rusted fist (the bright fist carries no row - corrected 2026-09-19, Java's BrightFist declares no immunities),
charm for the succubus, roots/terror for Tengu, burning for piranhas - 23 rows, every one
checked against `Char.java`'s property sets and each mob file at tag `v3.3.8`, variants included.
`tools/compile-mwl.mjs` emits `simulation/mwlMonsterImmunities.ts` and validates monster ids,
the closed fist-subtype list, composite row uniqueness, and buff ids; `simulation/buffs.ts`'s
`monsterBuffImmune()` is the pure gate (pinned with 13 verdicts in `test:items`, including the
subtype split and the deliberate non-gates: DM300 takes terror like Java, since its Terror/Charm
entries are damage `resist()`s, not immunities). `combat.ts`'s `buffBlocked` consults it, so the
~60 existing `addBuff` call sites obey per-kind refusals with no touch; the three direct-write
bypasses (poison-dart trap, Sorrowmoss, challenge rockfall paralysis) now route through the same
gate with identical durations. ToxicGas-blob immunity for the same INORGANIC set (+ rusted fist)
rides the existing `isToxicImmune` predicate, and confusion-gas daze refuses IMMOVABLE kinds
(Java's Vertigo immunity - every other daze source still lands, since those are not Vertigo;
the flag itself gained its three missing Java members, demonSpawner/yog/blacksmith). Recompiling
also repaired a real drift the check caught: the committed `mwlBuffDurations.ts` was missing
`featherFall`, which the MWL has carried all along. Deliberately not modeled here (section 7's
damage model owns them, with the data above as its input): the 50% damage-source resistances
(FIERY/ELECTRIC/ICY/ACIDIC/Corrosion/Grim/Disintegration), Web immunity (no web status exists
yet), Sleep immunity (no Sleep buff exists - the drowsy path correctly still lands), and the
boss Grim-trap/retribution resistances.

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
cost. **The service menu is now a real `WndBlacksmith` window (2026-09-12)**: talking to him
with any favor opens a titled `Window` on the scene's `WindowStack` (`showChoiceWindow`),
listing each service as Java does - `<b>Label (cost favor):</b> description`, greyed out when
the favor does not cover it - using SPD's own v3.3.8 label text and translations in all 19
locales. **Harden is ported with it** (`500 + 1000*hardens` favor): it sets
`Weapon.enchantHardened`/`Armor.glyphHardened` on an identified, uncursed, upgradable item
the player picks - the equipped weapon or armor included, since Java's selector walks the
whole belongings and the hardening only ever matters on the item a scroll later upgrades -
and from then on `upgrade()`'s affix-loss roll is replaced by a *hardening*-loss one
(`level() >= 6 && Random.Float(10) < 2^(level-6)`), so the enchant is protected until the
protection wears off. The state lives in the scene flags for equipped gear and in the bag
payload otherwise, carries through `transferEnhancement`/equip/unequip/save, and shows in the
item's own name (Java's `item.info()` line). Verified live
(`tools/scratch/blacksmith-harden-livecheck.mjs`, 10 assertions): the window opens with both
services enabled at 2000 favor, Harden opens the picker and clicking it through the real
pointer path hardens the equipped weapon and charges 500, a hardened item below +6 never
loses its enchant in 200 rolls, and at +6 the hardening itself breaks at Java's 10%.
**Correction found while implementing it: this file's own earlier claim that hardening is
granted by `StoneOfEnchantment` was wrong** - it is this Blacksmith service. **The paid `upgrade` (`1000 + 1000*upgrades`, an identified, uncursed, upgradable item
below +2) and `cash out` (the whole favor as gold, 1 for 1, behind Java's own
`cashout_verify` confirm) are ported too**, so the first four of Java's six services were live
before the pickaxe entry was added. The upgrade runs the same affix-loss/hardening rolls a scroll does - including
for an item still in the bag, which needs its own helper because the equipped slots keep
that state in scene fields rather than in the payload.

**`smith` is now ported too (2026-09-13), the fifth of six services.**
`Blacksmith.Quest.generateRewards(useDecks)` (`Blacksmith.java` 370-407) rolls four tier-3
rewards - two weapons of *different* classes, one missile, one armor - sharing one upgrade-level
roll (30/45/20/5% for +0/+1/+2/+3) and one enchant/glyph keep-roll, all burned in Java's own
order even though the port's `GenItem` only needs whether the enchant was kept, not its concrete
type. This port generates the set lazily on first open rather than pre-generating it when the
quest spawns - Java's own fallback branch (`WndSmith`'s `generateRewards(false)`), so the deck
bookkeeping (`useDecks = true` normally) is a stated simplification, not a silent drop. A flat
2000 favor buys whichever of the four the player picks (`takeBlacksmithSmith`); the other three
are discarded and the set is regenerated next time, matching `WndSmith.onSelect`. Verified live
end-to-end (`tools/scratch/blacksmith-harden-livecheck.mjs`, 22/22 assertions, screenshot-checked):
the five-service window rendered with all five labels and costs before the pickaxe entry was
added; the four rewards render as distinct correctly-named items, picking one charges the flat cost, adds the item, and clears the
cached set, and cash-out (retested in the same pass) still trades the whole favor for gold 1-for-1.

**This verification pass surfaced two real, pre-existing bugs, neither introduced by `smith`
itself, both fixed here rather than left for later:**
1. `ITEM_KEYS` never merged in a display name for any of the fifteen `missile_*` generated-missile
   identities. `MwlMissileDefinition` (`src/mwlContent.ts`) carries only combat metadata (`id`,
   `sourceClass`, `tier`, `minDamage`, `maxDamage`) with no `.name` field, unlike the consumable
   catalogue's `[item]` nodes that `MWL_CONSUMABLE_ITEMS` spreads into `ITEM_KEYS` today - the
   fifteen missile identities from `src/content/missiles.mwl` were simply never spread in anywhere.
   Nothing had rendered one of these ids through `itemDisplayName` in a live UI path before the
   smith's own missile reward did, so the gap went unnoticed: the reward showed the bare id
   (`missile_kunai`) instead of a name. Fixed in `src/i18n/spdKeys.ts` by deriving
   `items.weapon.missiles.<sourceClass.toLowerCase()>.name` for all fifteen directly from
   `MWL_MISSILE_DEFINITIONS` - the same Java `Messages.get` bundle-key convention every other
   lookup table in that file already follows - rather than hand-listing fifteen entries that could
   drift from the authored catalogue. Verified against `spdMessages.ts`: all fifteen derived keys
   exist (`bolas`, `fishingspear`, `forcecube`, `heavyboomerang`, `javelin`, `kunai`, `shuriken`,
   `throwingclub`, `throwinghammer`, `throwingknife`, `throwingspear`, `throwingspike`,
   `throwingstone`, `tomahawk`, `trident`).
2. `confirmBlacksmithCashOut`'s payout log line hardcoded the wrong, non-existent key
   `items.gold.gold.name` (the real key, `ITEM_KEYS.gold`, is `items.gold.name`) instead of calling
   `itemDisplayName` like every other pickup log site in the file - so cashing out always logged
   the raw key text ("Vous ramassez : items.gold.gold.name.") instead of "Gold". The numeric
   favor/gold state was correct, which is why the automated assertions never caught it; only
   looking at the log line in a screenshot did. Fixed to call the shared
   `itemDisplayName('gold', true)` helper.

The sixth service is now ported too: Java's retained quest pickaxe is persisted as a scene
flag, is free when the completed quest had at least 2500 favor, otherwise costs 250 favor,
and is consumed when bought back as an identified `pickaxe`.

**Turn-in bookkeeping is now Java's (`Blacksmith.java` 450-477, 2026-09-14):**
`blacksmithTurnInFavor()` (`src/items/blacksmith.ts`, headlessly pinned in
`tools/verifyItemWorkflows.mjs`: 15 ore for 750, 40 ore capped at 2000, +1000 with the boss
flag) caps the DarkGold half at 2000 and adds the quest-branch-boss bonus on a persisted
`blacksmithBossBeaten` flag - set since 2026-09-23 by the `GnollGeomancer`'s death (see the
"Blacksmith GNOLL mine roster" row) and, since the same day, by smashing the `CrystalSpire` (the
"Blacksmith CRYSTAL mine roster" row); (open residual moved to `ROADMAP.md` R014) The legacy bat-blood alternative grants no favor and
earns the free buy-back: old Java's flat `questScores[2] = 3000` observable half, recorded
(open residual moved to `ROADMAP.md` R015)
endgame/Rankings work, not a forge gap). The service-window gate is Java's
`rewardsAvailable()` - favor, or a free retained pickaxe - so a run cashed out to 0 with only
a paid buy-back left hears the done line instead of an empty menu. Verified live
(`tools/scratch/blacksmith-harden-livecheck.mjs`, 22/22 assertions: the cap at 50 ore, the
bonus at 15 ore, the favorless-but-free alternative opening the window, the 0-favor buy-back
returning the pickaxe, and the shut gate after cash-out, alongside every earlier service).

**The reforge seal/missile transfer pair is now ported, not just documented**
(`WndBlacksmith.java` 277-285, comment at `openBlacksmithReforge`, both closed 2026-09-16
with the missile-stack reversal below). Java floor-drops a consumed armor's seal as a
`BrokenSeal` item - the reforge spawns it at the hero's feet and `useBrokenSeal` affixes
it onto equipped armor - and retires a consumed missile set in `UpgradedSetTracker`
(`levelThresholds.put(setID, MAX_VALUE)`) via `reforgeDiscardedMissileSet`, which is why
carried stacks needed a set id of their own. Opening the picker to missiles without that
plumbing would have silently dropped the retirement half; with it live, the retirement
half is kept. The only remaining exclusion of that shape is the wand (see below), a
deliberate silent-no-op refusal, not a gap in the rule.

**Correction and partial close, 2026-09-16 - the *selector* half was not a model gap, and was
just too narrow.** Java's three service selectors all open with `isUpgradable() && isIdentified()
&& !cursed` (plus `level() < 2` for the upgrade service and a Weapon/Armor test for harden), with
no type test at all - whereas this port's pickers filtered on a three-id hand-list
(`isBlacksmithGear`). The **Upgrade** service now uses Java's own predicate through the
`isUpgradableItem` this port already had for the infusion pickers, so it offers rings (whose level
is genuinely per-item here, `ringBonusLevel`) and drops the hand-list's ceiling. One class stays
excluded on top of Java's predicate (2026-09-16 correction: carried missile stacks are offered now that they carry their own level - only the wand remains), and it *is* a model gap, a real Java target whose
upgrade would otherwise be a silent no-op: a **wand** (this port's wands share one bag id
and take their power from `weaponLevel` - see
`useWardingWand`'s own `degradedLevel(this.weaponLevel)` - so a level written onto a wand item is
read by nothing). Asserted both ways in `tools/verifyItemWorkflows.mjs` and browser-verified live
end to end (`tools/scratch/blacksmith-upgrade-livecheck.mjs`, 6/6: the real picker offers the
equipped pair plus the carried ring, offers neither the wand nor the runestone (missiles joined the offered set after that livecheck ran; the harness asserts the current set),
and buying the ring's upgrade moves its own level 0 -> 1 for its real 1000 favor).
**The reforge is now Java's own rule (2026-09-16).** Java's `WndReforge.itemSelectable` is the
*same* predicate as its upgrade window's (`isIdentified() && !cursed && isUpgradable()`, no level
cap), and its `onSelect` requires two picks of one class that are not the same entry. This row used
to pair by bag id, which is not a class test at all - every generated weapon is the id
`weaponReward` - so a handaxe could be reforged with a shortsword. Pairing is now
`blacksmithItemClass` = `sourceClass ?? id` (the payload class every generated entry carries, or the
id where it already names its class), the selector offers rings too, and the second picker is
restricted to the first pick's class - this port's equivalent of Java's disabled Reforge button,
since its pickers have no disabled state. The reward line is this port's own (Java's reforge only
closes the window) and used to report the *scene's* weapon/armor counters, announcing the armor's
level for a reforged ring; it now names the item that was reforged and is translated in all 19
locales. Browser-verified live (`tools/scratch/blacksmith-reforge-livecheck.mjs`, 7/7).
**Closed 2026-09-16, documented 2026-09-17**: the consumed-missile set retirement above, and the missile half of
the reforge generally - the picker offers missile stacks outright (a ThrowingKnife stack is among the harness's asserted candidates), the only remaining exclusion
being the wand, whose level is read by nothing (see the
`MissileWeapon` row and the dedicated roadmap item).
Harden keeps the weapon/armor list, which is what its own Java predicate asks for, with no missile caveat at all (Java's harden predicate is Weapon/Armor-only).


Two corrections to earlier revisions of this file: this checkout's `DM100.java` has no
self-destruct blast (its kit is melee plus a lightning zap; the blast belongs to
`DM200`/`DM201`/bomb territory), and its `Guard.java` has no peaceful-until-provoked state
or lethal first blow (it pulls with chains). The old rows claiming those mechanics have
been replaced with what the Java actually contains.
