# DoT-buff analysis: Burning / Poison / Bleeding / Ooze / Corrosion

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the fourteenth analysis matrix and the first for buffs.
The family is useful because damage-over-time is where the buff model's shape is
most falsifiable: every Java DoT is a tiny actor with its own damage formula,
duration source, refresh rule and detach condition, and each one maps differently
onto this port's single-number-per-status buff map. Java authority is tag
`v3.3.8` throughout (`Burning.java`, `Poison.java`, `Bleeding.java`, `Ooze.java`,
`Corrosion.java`, all read from the local shattered-pixel-dungeon checkout).

## The matrix

| Axis | Burning | Poison | Bleeding | Ooze | Corrosion |
| --- | --- | --- | --- | --- | --- |
| **Damage** | `NormalIntRange(1, 3+depth/4)` - ported | **was flat 1** (`int(1,2)`, exclusive upper); now `(left/3)+1` - fixed this pass | halving redraw `NormalFloat(level/2, level)`, deal `round` - ported | `1+depth/5` past depth 5, 1 at 5, coin-flip 1 in Sewers - ported exactly | current damage, +1/turn under the depth cap then +0.5 - ported |
| **Duration source** | 8 (4 eternal fire) - ported | per-site values (hero 4+lvl/2, gas 8+2d/3, default 6); Java has no single constant - port's own convention, stated | none in Java (pure level decay); port stores the level in the duration slot and skips the timer - equivalent | 20 - ported | 2-turn base in the port's twin-slot state - ported |
| **Refresh** | prolong (`reigniteBuff`) - ported | overwrite (`applyBuff`); Java `set()` keeps the max - residual, see below | max (`set` keeps max; port sites use `>` guards) - ported | `set`/`extend` exist in Java; re-application is rare in practice | max duration, max damage (`set`) - ported in the twin-slot shape |
| **Detach** | water after first tick, Chill detach on attach and per tick - ported | clock expiry - ported | `round(level) == 0` - ported | water after first tick - ported | clock expiry - ported |
| **Extras** | hero scroll/meat burn at 4+ turns, thief stolen-scroll burn - ported | death badge (`Hero.Doom`) - shared kill path, no per-buff badge table | Chasm/Sacrificial death badges, HarvestBleed kill credit - not modeled (no source field) | `ondeath` line - ported | source-class immunity, death badge - not modeled |

## What this confirms about the target shape

The thirteenth matrix's moral (transitions are damage-event reactions) has a buff
twin: every DoT tick is a formula off live state, never a table lookup. Four of
the five were already that shape. Poison was the outlier - the only DoT whose
damage ignored its own clock - and the fix is one line in the single choke point
(`advanceBuffs` serves hero and monsters alike), with no RNG draw left to pin.

## Actual structural gaps and fixes

One real bug found and fixed in this pass: poison dealt a flat 1 per turn at every
duration, where Java deals `(int)(left/3)+1` - a fresh 6-turn poison hits for 3,
so every poison in the game was roughly a third as strong as Java's. Verified
against an independent oracle (a bundled copy of the module asserting 3/2/1/7 at
durations 6/3/1/19 with an RNG stub that throws, proving no draw remains), and
`tools/verifyCombat.mjs`'s pinned RNG-call list updated in the same commit (it
asserted the old `int(1, 2)` draw).

Two residuals recorded, not fixed: re-poisoning overwrites a longer clock where
Java's `set()` keeps the max (one instance of the known global
affect-vs-prolong gap - `applyBuff` overwrites everywhere, only fire has
`reigniteBuff`), and Bleeding carries no source, so the Chasm/Sacrificial death
badges and HarvestBleed kill credit have nothing to read.
