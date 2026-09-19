# Boss-transition analysis: Tengu / DwarfKing / YogDzewa (+ fists)

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the thirteenth analysis matrix and the first for bosses.
The family is useful because bosses invert the ordinary audit: the stat rows were
already exact (or deliberately scaled with a stated ratio), the ability kits were
already row-covered, and everything left lives in three places - the damage-event
hooks, the death branches, and the timing of the transitions between them. Java
authority is tag `v3.3.8` throughout (`Tengu.java`, `DwarfKing.java`,
`YogDzewa.java`, `YogFist.java`, `Char.java`, all read from the local
shattered-pixel-dungeon checkout).

## The matrix

| Axis | Tengu | DwarfKing | YogDzewa (+ 6 fists) |
| --- | --- | --- | --- |
| **Data** | 200 HP, 10/20 acc, 15 eva, 6-12 dmg, 0-5 armor, EXP 20, maxLvl 29 (row audited, unchanged) | 300 HP (450 challenge), 26 acc, 22 eva, 15-25 dmg, 0-10 armor, maxLvl -2 = no EXP (row audited, unchanged) | 400 HP deliberate scale of Java's 1000 (0.3-fraction gates: 280/160/40, P4 floor 40 = Java's 100); INFINITE_ACCURACY kept; fists deliberately scaled 60 HP with Java's 36/20/18-36/0-15 combat line restored per fist at spawn, maxLvl -2 (rows audited, unchanged) |
| **Phase gates** | 1/8-bracket clamp + half-HP pause/arena split (ported, unchanged) | P1->P2 at HP<=50 (100 challenge), clamp, throne teleport, full-HP shield, subject cull; P2->P3 at shield 0; P3 losing yell <20 HP (all ported, timing fixed this pass) | gates at HT-300*phase with clamp, fist spawn + darkness line per gate, P4 floor, P5 on last-fist death at phase 4 (ported; cooldown halves fixed this pass) |
| **Timing** | damage-event (`clampTenguBracket`, all seams) - correct already | **was turn-start only** (`takeKingTurn` re-check); now damage-event (`kingDamageHook`, four seams) - fixed this pass | damage-event (`yogDamageHook`, all seams) - correct already |
| **Damage accel** | n/a (bracket jumps, not cooldowns) | P1 `-= taken/8` on both cooldowns (ported; extended to blast/DoT/blob seams this pass) | **missing**: `-= dmgTaken/10` on both cooldowns, post-clamp measure - fixed this pass |
| **Gate reset** | n/a | n/a | **missing**: `addFist`'s `if (cd < 5) cd = 5` pair - fixed this pass |
| **Death** | arena repaint + stairs unseal (ported); **mask not ported** (recorded, see below) | adds culled, crown granted to bag (documented stand-in for the heap), unseal (ported) | minions culled (**larva was missing** - fixed this pass), unseal (ported) |
| **Lethal P1** | - | kills outright in BOTH (Java's `super.damage()` runs `die()` before the phase branch; verified in `Char.java`) - no bug, recorded to close the suspect | - |
| **Fist guard** | - | - | `yogShielded` (phase 0 or any live fist) blocks every damage path before the hook, so gates cannot advance under a live fist - correct already |

## What this confirms about the target shape

The twelfth matrix's moral (quest routing is pure state machines) has a boss twin:
every transition here is a damage-event reaction, never a turn-start poll. Tengu and
Yog already had that shape (`clampTenguBracket`, `yogDamageHook` fire from every
seam); the King was the outlier, polling his own `ReactionTable` from
`takeKingTurn`. The fix does not move the rules - it fires the same table from the
damage event, and the table's own `once` latch is what makes the two call sites
safe together.

## Actual structural gaps and fixes

Three real bugs found and fixed in this pass, one non-bug suspect closed, one
"Not ported" recorded:

1. **King transitions fired a turn late.** A crossing hit left the King in P1 (or
   P2 with an empty shield) until his next turn, so a second damage source in
   between - a bomb, a DoT tick, blob damage - hit the un-transitioned King
   (no throne/shield/cull, no P3 viscosity). New `kingDamageHook` fires the same
   `kingPhaseRules` table from the four seams that apply damage (`attack()` tail,
   `applyBlastDamage`, the DoT tick, blob `applyDamage`), accel-first per Java's
   order. The trap-blast path (`applyTrapBlast`) still bypasses the King shield
   absorb entirely - a pre-existing, wider gap, not introduced here.
2. **Yog never accelerated its cooldowns and never reset them at a gate.**
   `yogDamageHook` now subtracts post-clamp `dmgTaken/10` from both cooldowns
   and floors both at 5 on a gate crossing, matching `YogDzewa.damage()` and
   `addFist()`.
3. **Larvae survived Yog's death.** The `kill()` cleanup list held
   `yogFist/ripperDemon/eye/scorpio` but not `larva`, where `YogDzewa.die()`
   kills Larva alongside Ripper/Eye/Scorpio. One-word fix.
4. **Suspect closed, not a bug:** a lethal P1 hit killing the King outright
   looked like a missing clamp until `Char.damage()` showed Java kills him too
   (`die()` runs inside `super.damage()`, before the phase branch).
5. **Recorded, not fixed:** `Tengu.die()` drops a `TengusMask` whose wear action
   opens the subclass choice. This port has no mask item at all - the subclass
   choice opens on the level-13 advancement instead. New "Not ported" row in
   `PORT_COVERAGE.md` plus a comment at the Tengu death branch, per the dual-
   documentation rule.
