# Port coverage (index)

**Closed points only.** This is the record of what the port has done and how each piece relates to Java Shattered Pixel
Dungeon `v3.3.8`: every entry is **Ported** (reproduces the real numbers/logic), **Simplified** (the shape, with a stated
reduction), or **Divergence (deliberate)** (we deliberately differ - see `AGENTS.md`'s fidelity policy, settled 2026-09-11:
iso with Java is no longer the goal, and Java's own bugs and limitations are not reproduced). **Open work is not recorded
here**: anything SPD has that the port does not ("Not ported"), and every residual a row used to carry, lives in
`ROADMAP.md` (the open-items register, R-numbers) and `BACKLOG.md` (the ongoing epics). When an open item closes, the
evidence is added as a row in the matching file below and the `ROADMAP.md` item is deleted (its history moves to `CLOSED.md`).

## Layout (restructured 2026-09-26)

The single 650 KB file was split so concurrent sessions stop colliding on one hot region (new rows used to be prepended at
the top). Rows are single table lines, one per mechanic, with columns *Java source | port code | category and evidence*.

**Adding a row:** append it at the end of the `coverage/rows-*.md` file whose area matches (create a new file if none fits
and keep each file under ~150 KB). Internationalisation rows go in `PORT_COVERAGE_I18N.md`. Every simplification or
deviation still needs both a code comment at the point of deviation and a row here, in the same commit (`CLAUDE.md`).

**Finding a row:** code comments and older docs say "`PORT_COVERAGE.md`'s X row"; search all of them with
`grep -rn "X" PORT_COVERAGE.md PORT_COVERAGE_I18N.md coverage/`.

### Row files

| File | Rows | Size | Area |
|---|---|---|---|
| `coverage/rows-architecture-mwg-and-simulation.md` | 9 | 9 KB | Architecture, the simulation layer and the mwg framework |
| `coverage/rows-hero-and-armor-abilities.md` | 25 | 51 KB | Hero classes, subclasses, talents and armor abilities |
| `coverage/rows-items-consumables-and-crafting.md` | 39 | 68 KB | Consumables, spells, food, bombs, alchemy and heaps |
| `coverage/rows-items-equipment-and-artifacts.md` | 47 | 143 KB | Weapons, armor, rings, wands, artifacts and item generation |
| `coverage/rows-misc.md` | 24 | 15 KB | Rows that fit no other area |
| `coverage/rows-monsters-bosses-and-combat.md` | 68 | 101 KB | Monsters, bosses, buffs and combat resolution |
| `coverage/rows-monsters-and-quests.md` | 1 | 1 KB | Monsters and quest rosters |
| `coverage/rows-terrain-traps-and-levelgen.md` | 31 | 38 KB | Terrain, blobs, traps and level generation |
| `coverage/rows-ui-visual-audio-and-i18n.md` | 19 | 19 KB | UI, visuals, audio, badges and text |

### Audit notes (closed narrative)

Per-pass prose that used to sit between the tables: what each audit found, corrections, and measurements.

| File | Size | Section |
|---|---|---|
| `coverage/notes-01-2026-09-11-mwg-alignment-pass.md` | 33 KB | 2026-09-11 mwg alignment pass |
| `coverage/notes-02-2026-09-10-roadmap-pass.md` | 1 KB | 2026-09-10 roadmap pass |
| `coverage/notes-03-simulation-extraction.md` | 56 KB | Simulation extraction (steps 1-5) |
| `coverage/notes-04-core-combat.md` | 14 KB | Core combat (`actors/Char.java`) |
| `coverage/notes-05-hero.md` | 13 KB | Hero (`actors/hero/Hero.java`, `HeroClass.java`) |
| `coverage/notes-06-weapons.md` | 5 KB | Weapons (`items/weapon/**`) |
| `coverage/notes-07-consumables.md` | 1 KB | Consumables (`items/potions/*`, `items/scrolls/*`, `items/food/*`) |
| `coverage/notes-08-everything-still-outside-combat-terrain-.md` | 5 KB | Everything still outside combat/terrain/dungeon structure |
| `coverage/notes-09-audio-and-splash-art.md` | 23 KB | Audio and splash art (`watabou.noosa.audio.Music`/`Sample`, `Assets.Splashes`) |
| `coverage/notes-10-fixed-boss-floor-layouts.md` | 4 KB | Fixed boss-floor layouts (depths 10, 15, 20, 25, 26) |
| `coverage/notes-11-data-driven-dispatch.md` | 7 KB | Data-driven dispatch (2026-09-09) |
| `coverage/notes-12-0-5-0-adoption.md` | 21 KB | `mwg` 0.5.0: `core.ReactionTable` adoption (2026-09-09) |

### Other

- `PORT_COVERAGE_I18N.md` - internationalisation (`messages/Messages.java`, `Languages.java`, generated catalogs).

## Standing correction

The older *Ally combat* row still contains historical wording that the image super-defense multiplier was not live; its
pure-layer description predates the combat-boundary wiring, and the *Mirror/prismatic image live `super.defenseSkill(enemy)`*
row (`coverage/rows-monsters-bosses-and-combat.md`) is authoritative for the current implementation.