# Port coverage notes: Audio and splash art (`watabou.noosa.audio.Music`/`Sample`, `Assets.Splashes`)

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## Audio and splash art (`watabou.noosa.audio.Music`/`Sample`, `Assets.Splashes`)

Found by the same asset audit as the UI-chrome gaps above (`interfaces/boss_hp.png` etc.):
comparing what `core/src/main/assets/` actually contains against what `web-mwg/src/assets/`
copies. `music/` (8.2 MB of `.ogg` tracks) and `sounds/` (581 KB of SFX) together dwarf every
other asset category, and neither has a single byte copied into this port. `splashes/`
(976 KB of per-class portrait art) is now ported; music/SFX are not. None of this was
previously recorded here.

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
water/grass pass, matching Java's null-room painter order. **Still divergent, recorded 2026-09-16:**
that path does not take Java's `Random.pushGenerator(Random.Long())` before its water/grass/deco
block, so all three draw straight off the level-gen stream instead of a `Long()`-seeded substream -
one parent draw plus the substream's own contents. The branch floor therefore does not place its
water, grass or deco where Java's does, even though the code that places them is the same. (The Caves
boss floor, which also has no room list, *does* push - see the `DM300` row.)

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
  `WATER`, exit is genuinely locked - while `Goo` is awake). The `seal()` half is ported -
  see the Goo row's own 2026-09-14 note. **The `unseal()` half is now ported too, and with
  it the whole auto-descent flow is gone (2026-09-16):** no boss death advances the depth
  directly any more. Goo's death restores the entrance to `ENTRANCE` (`applyGooDeathUnseal()`)
  and every boss floor gains a real walkable exit at Java's own exit cell
  (`applyDM300DeathUnseal()` clears the gate's five `SIGN` cells to `EMPTY` and clears the
  pylon energy with an arena-visuals re-map to the broken `32..36` frames;
  `applyKingDeathUnseal()` opens both arena doors and spawns the Imp shop when the quest
  is complete; `applyYogDeathUnseal()` restores the entrance, sets the `EXIT` tile and
  swaps the centre pieces to their portal/archway variant; Tengu's `setMapEnd()` transition
  already worked this way). Each sets `hasStairs`/`stairs` at that cell - the hero walks out
  through the ordinary stairs path, which is also what persists the unsealed floor. The
  unsealed set (`bossUnsealedDepths`) is run-persisted: on reload the paint writes are
  re-applied in `enterLevel` (the live terrain itself survives via the floor capture) and
  the stairs half is repaired after `restoreFloor`. The exit tile still paints as the real
  `Terrain.LOCKED_EXIT` and maps to `'wall'` (already true before this pass,
  since it was listed as "boss-floor gating; unreachable on the ported regular floors") - it is
  simply never meant to be reached.
- **`SkeletonKey`/`GooBlob` drops** on Goo's death - no key-per-lock or bonus-loot system exists
  for them; moot anyway given the point above.
- `main.ts`'s existing generic boss-floor convention - `populate()` spawns `BOSSES[depth].kind`
  at `this.level.rooms[rooms.length-1]` - was **not** changed; instead `gameBridge.ts`'s
  `extract()` reorders the returned room list so the `GooBossRoom` is always last, satisfying
  that existing contract without touching `main.ts` at all.

**Layout audit, 2026-09-16 - the arena shapes were all read inclusively, and two were the wrong
shape entirely.** Java's `Painter.fillEllipse`/`fillDiamond` take a `Rect` plus a margin, and a
plain `Rect`'s `right`/`bottom` are exclusive edges, so the shape is the rect's own extent
(`right - left`) inset by the margin. The port was passing the *inclusive* extent instead, one
cell too wide and tall on each axis, and `CityBossLevel`'s throne room was drawn as an ellipse at
all when Java carves it with `fillDiamond` - a 45-degree square, 81 cells against the ellipse's
~154, whose bounding corners are solid wall. Corrected through `paintLevel.ts`'s new
`fillEllipseRect`/`fillDiamondRect` (with `fillDiamond` itself moved out of `gooBossRoom.ts`,
which had the only faithful copy): the Caves arena is Java's 23x23, Tengu's is 13x13, and the
King's is the diamond. `verifyVault.mjs` now recomputes each shape from Java's own arguments and
compares it against the generated floor, which fails on the wider reading (proved by restoring
it), and the live floor is checked by `tools/scratch/city-arena-livecheck.mjs` (6/6 - the
walkable set *is* the diamond, and its bounding corners are chasm through the scene's own
predicate). This also uncovered a real hole in `gameBridge.ts`'s terrain table: `REGION_DECO` and
`REGION_DECO_ALT` had no `toGameTerrain` mapping at all, so the Caves' two exit-corridor rails -
Java's `Painter.fill(this, 9, 3, 1, 6, REGION_DECO_ALT)` and its mirror at x=23 - could not be
painted without crashing level entry (`no mapping for Terrain value 34`). Both now map to
`floor` and the rails are painted. **Still open from the same audit, each needing its own pass:**
the City entrance room never paints Java's outer `WALL` ring or its insets 1/2 (the port paints
the whole entry rect `EMPTY`, so row 37 is floor where Java has wall), nor its two `BOOKSHELF`
columns, two `REGION_DECO` marks, three `STATUE` rows, its `EMPTY_SP` spine or the arena's
`fill(arena, 5, EMPTY_SP)`/`fill(arena, 6, CUSTOM_DECO)` margins, and its arena statues sit a row
low with two pedestals on cells Java uses for statues. **The Halls is the largest of the three and
is not decoration-only**: the five approach arms' extents are hardcoded here where Java rolls each
one (`IntRange(ROOM_TOP-1, ROOM_TOP+3)`/`IntRange(ROOM_BOTTOM+2, ROOM_BOTTOM+6)` for `i == 0 || 4`,
similarly for the other two classes), so the arms are wrong *and* ten `Random.IntRange` draws are
never consumed; the three whole-floor `Patch` passes Java runs after them (`0.20f`
`REGION_DECO`/`STATUE` by `distance(i, bossPos) + Random.Int(5) >= 10`, `0.30f` `WATER`, then 1-in-4
`EMPTY_DECO`) are missing entirely, with their draws; and the room is missing Java's 11x11 `EMPTY`
ring at (11,7) and its `WALL_DECO` band (26 cells in Java against the port's 8) - Java's band being
solid, its boss room is 9x7 walkable against this port's 9x9, which is the Yog arena itself.
`addCagesToCells()` - now unblocked by the mapping fix - is still not painted either. (Both
sentences describe the pre-closure state; the two paragraphs below close them in order.)

**Closed 2026-09-16, except the decoration-only tail.** `cityBoss()` is now `CityBossLevel.build()`
statement for statement: the entrance room's `WALL` ring with insets 1 (`BOOKSHELF`) and 2 (`EMPTY`),
the two freestanding bookshelf columns, the two `REGION_DECO` marks, the three `STATUE` rows, the
`EMPTY_SP` spine, the `DOOR` (which is also the arena's bottom door) and the `ENTRANCE` at
`entry.center() + 2 rows` = (7,44); the diamond with its inset-5 `EMPTY_SP` / inset-6 `CUSTOM_DECO`
(`SIGN` stand-in) margins, the four statues, the four pedestals at `c±3` and the locked top door;
the exit hallway's `CHASM`/`EMPTY`/`EXIT` fills with the transition on Java's own (7,8); the Imp
shop's pedestal, two statues and corridor link (the room itself stays unpainted until `unseal()` -
`ImpShopRoom.paint()` is a no-op by design); the eight 2x2 `WALL` pillars; and
`new CityPainter().paint(this, null)`'s scatter at Java's own position via `cityDecorate.ts`
(the `cavesDecorate.ts` split repeated: a leaf module, so the fixed floor does not pull in the
room-graph pipeline) - 26 `EMPTY_DECO` / 12 `WALL_DECO` at seed 42, pinned in `verifyVault.mjs`.
`hallsBoss()` is now `HallsBossLevel.build()` in full: the five arms roll Java's own `IntRange`s
(ten draws), the `0.20f` scatter keys on Chebyshev `distance(i, bossPos) + Int(5) >= 10`, the 11x11
`EMPTY` ring lands at (11,7), the `0.30f` watering, the 1-in-4 `EMPTY_DECO`, the 9x9 `EMPTY_SP` room
with its 26-cell `WALL_DECO` band (pinned) and inner 3x4 `EMPTY`, the exit transition at (16,9) with
no `EXIT` tile yet (it sits in the wall band until `unseal()`), exactly one `ENTRANCE` on the middle
arm, and the trailing `REGION_DECO -> REGION_DECO_ALT` coin flip - with Java's own retry (up to 50
rebuilds) when no entrance-to-exit path survives. **Closed 2026-09-16, including the decoration-only tail.** `CustomGroundVisuals`/
`CustomWallVisuals` are transcribed statement for statement into `cityBossVisuals.ts` -
the exit-hall stairs run, pillar bases/tops, skull piles/tops, ground stitching, throne
carpets, the stairs' shadow and archway, with the `data[++i]` cursor pairs kept verbatim
(which is where transcription off-by-ones would hide) and `SIGN` read wherever Java reads
`CUSTOM_DECO`. `city_boss.png` was vendored but never loaded; it now renders through two
scene layers straddling the walls like the Caves maps, and the three examine branches
(skull piles, throne, summoning pedestals) answer with Java's own name-gating (only where
the ground map draws) - the upper-`EXIT` desc falls through to text-identical region
wording because HallsLevel's key postdates the catalogue (recorded in the locale-set
item), and upper `EMPTY_DECO` suppresses its desc exactly like Java's `""`. Pinned in
`verifyVault.mjs` (stairs rows, throne rows, pedestals, skulls, pillar pairs, shadow rows,
name-implies-drawn, deco suppression). Prison's `addCagesToCells()` scatters Java's own
five cells: `spdSeedForDepth(runSeed, 10, 0)` *is* `Dungeon.seedCurDepth()`, pushed the
same way over the same bit-matching LCG with the same call order
(`Int(4)`/`IntRange`/`IntRange` x5, wall-neighbour gate), so these are Java's cells rather
than an approximation - re-rolled onto each transition repaint from the same seed, the way
Java's three call sites do, with the run seed threaded from levelgen (`gameBridge.ts`)
and live repaints (`dungeonScene.ts`) alike. Pinned the same way (independent
recomputation of the five picks plus the validity gate, on start/pause/end).

(End of file)
