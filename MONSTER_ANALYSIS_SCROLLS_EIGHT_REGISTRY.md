# Scroll analysis: the 8 registry read effects

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the sixteenth analysis matrix and the second for items.
It covers the eight scrolls in `applyScrollEffect` (Identify, RemoveCurse,
Transmutation and Upgrade live in `readScroll` itself and were audited with their
own heavily-commented branches). Like potions, scrolls are one branch per kind,
so the audit is one Java `doRead()` per branch. Java authority is tag `v3.3.8`
throughout (the eight `items/scrolls/*.java` bodies plus the four buff
`DURATION`s, all read from the local shattered-pixel-dungeon checkout).

## The matrix

| Scroll | Java | Port | Verdict |
| --- | --- | --- | --- |
| Rage | beckon all mobs, Amok 5 on visible non-allies | wake + face hero for all, amok non-allies in FOV, duration 5 | ✓ unchanged |
| Lullaby | Drowsy 5 on visible mobs and the hero | same | ✓ unchanged |
| MagicMapping | reveal all + discover secrets | same | ✓ unchanged |
| MirrorImage | NIMAGES 2 | `imageCount` 2 | ✓ unchanged |
| Recharging | prolong 30 | 30 | ✓ unchanged |
| Teleportation | detach Roots, random respawn cell | roots clear + free-cell teleport | ✓ unchanged |
| Terror | Terror 20 on visible **non-allies**; none/one/many lines | **hit allies too** | fixed this pass |
| Retribution | `min(4, 4.45*missing)` power, `HT/10 + HP*power*0.225`, Weakness 20 | 4 / 4.45 / 0.225 / 0.1 MWL values, weakness after | ✓ unchanged |

## What this confirms about the target shape

The fifteenth matrix's moral (every effect is a transcription of a short Java
method) holds for all eight: seven were exact, down to the MWL constants and
the buff durations. The one that was not had the same failure shape as ever - a
missing predicate, not a wrong number.

## Actual structural gaps and fixes

One real bug found and fixed in this pass: **Scroll of Terror terrified the
hero's own allies.** Java's loop carries `mob.alignment != ALLY` (the same guard
its Rage twin has, which this port's rage branch already reproduced) - the
terror branch dropped it, so reading the scroll scattered mirror images and
allies alongside enemies. One predicate added. No MWL or doc-schema changes were
needed; the branch takes no values.
