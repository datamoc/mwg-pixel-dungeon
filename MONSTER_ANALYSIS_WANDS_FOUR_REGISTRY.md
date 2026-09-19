# Wand analysis: the 4 registry zap effects

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the seventeenth analysis matrix and the third for
items. It covers the four wands in `wandEffects.ts` (the other eight zap through
`dungeonScene` branches audited with their own comments). Like potions and
scrolls, each wand is one Java `onZap()` against one registry function. Java
authority is tag `v3.3.8` throughout (the four `items/wands/*.java` bodies plus
`Ward`'s nested class, `Charm`/`Terror` durations and `Momentum.java` for the
one talent read, all from the local shattered-pixel-dungeon checkout).

## The matrix

| Wand | Java | Port | Verdict |
| --- | --- | --- | --- |
| Transfusion (ally) | heal `selfDmg + 3*lvl`, overheal becomes Barrier | heal, capped, no overflow shield | residual (needs a target-shield service) |
| Transfusion (charmed) | heals ally **or charmed** target | **healed allies only** | fixed this pass |
| Transfusion (enemy) | shield `5+lvl`, charm `DURATION/2` = 5, undead take the damage roll | shield values exact | charm was 10, now 5 |
| Warding (spawn) | ward actor, energy `2+lvl`, spawn HP | energy/HP exact | ✓ unchanged |
| Warding (promote) | 1/2: nothing; 3→4: SET `15+(5-totalZaps)*4`; 4→5: +19; 5→6: +30; 6: heal 16 | **added wandHeal-table values (9/12/16) on every promotion** | fixed this pass |
| Fireblast | `(1+lvl)*charges` to `2/8/18 + 2/4/6*lvl`, cone 50/70/90° × 5/7/9, fire vol `1+charges`, Burning reignite, Cripple 4 / Paralysis 4 | damage/cone/volumes exact | statuses overwrote; Paralysis was 3 |
| Regrowth | roots `4*charges`, grass `round((3.67+lvl/3)*charges)`, lotus at 3+ charges | exact | ✓ unchanged |

## What this confirms about the target shape

The sixteenth matrix's moral (every effect transcribes a short Java method) held
again - and the failures rhyme: all three fixes are cases where the port reached
for the nearest shared default (full charm duration, shared paralysis 3,
zap-heal table on promotion) instead of the call-site-specific number Java
passes. The shared defaults are all correct for their primary sources; the bug
is using them where Java names a number.

## Actual structural gaps and fixes

Three real bugs found and fixed in this pass:

1. **Ward promotion HP.** `Ward.upgrade()` never heals by the `wandHeal` table
   except on a tier-6 re-zap - promotions set or add their own numbers
   (3→4 sets `15+(5-totalZaps)*4` at HT 35, 4→5 adds 19, 5→6 adds 30). The port
   added 9/12/16 on promotion: over-setting fresh tier-4s, under-healing 4→5
   (12 vs 19) and 5→6 (16 vs 30). The tier-6 re-zap path already used the right
   table and is untouched, as are the gating (energy/empty) and the 35/54/84
   maxHp values.
2. **Transfusion charm duration and target.** Java charms for `DURATION/2` (5)
   via `affect` (keeps a longer clock); the port overwrote the full 10. Java
   also heals an already-charmed enemy; the port re-shielded it. Both fixed -
   the charm branch now prolongs 5 through the facade's own `reigniteBuff`
   (newly wired into both wand contexts), and the heal branch tests the live
   charm buff exactly like Java's `ch.buff(Charm) != null`.
3. **Fireblast status clocks.** Burning reignites (prolong 8), Cripple and
   Paralysis `affect` (4 and an explicit 4, not shared-paralysis 3) - all three
   overwrote. Now prolonged through `reigniteBuff`, closing the "Paralysis 3
   against Java's 4" gap `PORT_COVERAGE.md` already recorded.

One residual, recorded not fixed: ally overheal becomes a Barrier shield on the
ally in Java; the port caps at maxHp (the enemy-branch shield helper is
hero-specific, and extending it needs a target-shield service, not a number).
