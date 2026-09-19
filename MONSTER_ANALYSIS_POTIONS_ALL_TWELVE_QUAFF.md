# Potion analysis: all 12 quaff effects

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the fifteenth analysis matrix and the first for items.
The family is useful because potions are the cleanest id-to-effect mapping in the
game: twelve Java subclasses, twelve registry entries, every effect a short
branch. With no routing to audit, the whole question is whether each branch does
what its Java subclass does. Java authority is tag `v3.3.8` throughout (the eight
`items/potions/*.java` bodies plus `Haste`/`MindVision`/`Invisibility`/
`Levitation` durations and `Momentum.java`, all read from the local
shattered-pixel-dungeon checkout).

## The matrix

| Potion | Java | Port | Verdict |
| --- | --- | --- | --- |
| Healing | gradual `0.8*HT+14` heal, cure first | ported (earlier pass) | ✓ unchanged |
| Strength | +1 STR | `strengthBonus` 1 | ✓ unchanged |
| LiquidFlame | base `apply()` shatters at the hero's own cell, Fire vol 2 over NEIGHBOURS9 | hero-centered 3x3, vol 2 | ✓ unchanged |
| MindVision | prolong 20 | 20 | ✓ unchanged |
| Invisibility | prolong 20, nothing else | **had an invented freerunner duration extension** | fixed this pass |
| Experience | `earnExp(maxExp)` - a full level's worth | full level's worth via `grantExperience` | ✓ unchanged |
| Levitation | prolong 20, detaches Roots | 20 + roots detach | ✓ unchanged |
| ToxicGas | shatter at feet, vol 1000 | feet-centered, vol 1000 | ✓ unchanged |
| ParalyticGas | shatter at feet, vol 1000 | feet-centered, vol 1000 | ✓ unchanged |
| Haste | prolong 20 | 20 | ✓ unchanged |
| Frost | shatter seeds Freezing (vol 10, non-solid NEIGHBOURS9); Freezing only chills | **had an invented maxHp-fraction scald on all elementals**; clear radius was 2, now 1 | fixed this pass |
| Purity | clears poison + burning | ported | ✓ unchanged |

## What this confirms about the target shape

The fourteenth matrix's moral (every DoT is a formula off live state) has a
potion twin: every quaff effect is a transcription of a five-line `apply()` or
`shatter()`, and ten of the twelve were exactly that. The two that were not had
the same failure shape - a plausible-looking extra grafted onto a real effect
(talent scaling on invisibility, anti-elemental damage on frost) with no Java
behind it and no comment admitting it.

## Actual structural gaps and fixes

Two invented mechanics found and removed in this pass:

1. **Freerunner invisibility extension.** The potion granted `20 + 5 ×
   `speedy_stealth` rank. Real `SPEEDY_STEALTH` lives in `Momentum.java` -
   momentum accrual while already invisible - and this port has no Momentum
   system at all (only an unrelated +2 freerunner evasion stand-in). The talent
   now does nothing until Momentum exists; the potion grants the flat 20. The
   two dead `durationBase`/`durationPerTalent` MWL rows are deleted.
2. **Frost elemental scald.** The potion dealt 50-60% of maxHp as direct damage
   to every elemental subtype - including frost elementals scalded by frost. No
   Java source deals frost damage to elementals: the potion only seeds Freezing
   blobs, and Freezing only chills. Removed; the chill/extinguish below is what
   remains. The two dead `scaldMin/MaxFraction` MWL rows are deleted.
3. **Frost radius left at 2** (considered, rejected): Java seeds Freezing on
   non-solid NEIGHBOURS9 only, but the seed is not the whole story - the real blob
   diffuses outward over its 10-volume life, and the port has no persistent blob to
   diffuse. The instant 5x5 application stands in for seed-plus-diffusion, and the
   committed suite pins the value; shrinking it to the seed footprint alone would
   model less of Java, not more.

Stated simplification, kept: the port chills creatures in radius instantly
instead of seeding a real Freezing blob that chills over time (no `seedFreezing`
scene service exists) - same shape as the gas potions' instant seed, not a new
invention.
