# Bomb analysis: blast seams and all six variants

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the eighteenth analysis matrix and the fourth for
items. It covers `detonateBomb` (the live seam - the scene's own
`applyBlastDamage` serves only the explosive curse and armor-ability damage)
and all six blast variants. Java authority is tag `v3.3.8` throughout
(`items/bombs/*.java`, `Tengu.BombAbility`, `Mob.die()`'s wealth tiers and
`AntiMagic.RESISTS`, all read from the local shattered-pixel-dungeon checkout).

## The matrix

| Bomb | Java | Port | Verdict |
| --- | --- | --- | --- |
| Standard | `4+d..12+3d` minus armor, radius 2, chains | exact | ✓ unchanged |
| Tengu-thrown | `BombAbility`: `5+d..10+2d` minus armor, distance-2 map, source `Bomb` | exact values/area/armor/boss-disqualify | ✓ unchanged |
| Holy | base blast + `roll*0.5` bonus to UNDEAD/DEMONIC; both resisted (`MagicalBomb`, `HolyDamage` in RESISTS) | exact, including the magic-immune skip on both halves | ✓ unchanged |
| Woolly | full Fire/Burning + Regrowth + damage | reduced burn/regen (stated simplification) | ✓ unchanged |
| Regrowth | plants + effects | ported | ✓ unchanged |
| Arcane | same roll, pierces armor, 5x5 | exact | ✓ unchanged |
| Shrapnel | standard blast over FOV-8 | own loop already exact (roll, armor, FOV) | ✓ unchanged |

## What this confirms about the target shape

The seventeenth matrix's moral (the bug is the nearest shared default, not the
numbers) inverts here: every number in the bomb table was exact, including the
Tengu-thrown variant that looks most invented (`5+d..10+2d` is `BombAbility`
verbatim) and the holy 50% bonus with its correctly-resisted `HolyDamage`. The
failure was structural - the live bomb seam duplicated the scene's blast seam
without its King handling. A second suspected structural failure (a dud
shrapnel) turned out to be a misread instead - which is also structural, but of
the audit, not the code.

## Actual structural gaps and fixes

One real bug found and fixed in this pass, plus one misdiagnosis caught before commit:

1. **The live bomb seam bypassed all King handling.** `detonateBomb`'s local
   `applyBlastDamage` never absorbed the P2 shield, never fired damage-time
   transitions, never accelerated P1 cooldowns - a bomb crossing the P1
   threshold left the King un-transitioned, and any bomb tickled a shielded P2
   King straight through the shield. The seam now shares `absorbShield` and
   fires `kingDamageHook` (new injected callback, accel-first like the attack
   tail). This completes the 13th matrix's residual list: every damage seam
   except wand-zaps now honors the shield and the transitions.
2. **Misdiagnosis, caught and reverted before commit:** Shrapnel's `baseBlast:
   false` looked like a dud until the rest of `detonateBomb` showed its own
   dedicated loop (exact roll, armor, FOV-8). Flipping the flag would have
   double-hit every target - base loop plus dedicated loop. The lesson is
   procedural: the matrix read stopped at line 155 of a 177-line function.
   (`PORT_COVERAGE.md`'s "Shrapnel line's bleed" sentence still describes code
   that never existed - that correction stands.)

Two residuals, recorded not fixed: no bomb variant spares allies
(`!c.isAlly` skips them all), where Java's blast cells hit everyone standing in
them - uniform pre-existing behavior across all variants, not a seam bug; and
shrapnel ignores line-of-sight (Java shadow-casts the 8-range FOV), where the
port has no blast-centered FOV service to call.
