# Port coverage notes: Weapons (`items/weapon/**`)

Historical audit narrative (closed). Row tables live in `rows-*.md`. Closed points only: every row here is Ported, Simplified (with its stated reduction) or a Divergence (deliberate). Open work lives in `ROADMAP.md` and `BACKLOG.md`; a row that still carries a residual points to its `ROADMAP.md` R-number. New rows go into the file whose area matches, appended at the end; do not add them to `PORT_COVERAGE.md`.

## Weapons (`items/weapon/**`)

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
