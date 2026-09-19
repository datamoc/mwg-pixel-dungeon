# Runestone + food analysis: all 12 stones and the six foods

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the nineteenth analysis matrix and the fifth for
items. It covers the twelve `Runestone` subclasses in `src/items/stones.ts`
and the six foods in `consumableStats`/`src/items/consumables.ts`. Java
authority is tag `v3.3.8` throughout (the twelve `items/stones/*.java`
bodies, `items/food/*.java`, `Terror.java`, `Slow.java`, `Roots.java`,
`Poison.java`, `Weapon.java`'s `enchant()`, and
`ScrollOfEnchantment.enchantable()`, all from the local
shattered-pixel-dungeon checkout).

## The matrix

| Stone | Java | Port | Verdict |
| --- | --- | --- | --- |
| Flock | distance-2 flood around the thrown cell, unoccupied non-pit cells, `Sheep.initialize(8)` | hero-centred Chebyshev-2, passable non-chasm unoccupied, `spawnSheep` lifespan ~8 | ✓ values; centre is a stated residual (no thrown-cell convention for this one) |
| Aggression | `prolong` 20, 5 for BOSS/MINIBOSS, any char at the aimed cell | `addBuff` 20, MWL boss 5, nearest visible enemy | durations exact; set-vs-prolong and enemy-only targeting are residuals |
| Augmentation | augment choice + bonus upgrade level | augment choice real | ✓ unchanged (bonus level still unmodeled, documented) |
| Fear | single aimed target, `Terror` 20 with `.object = curUser` | single aimed target, `terror` 20 | ✓ durations; terror source id not modeled |
| DeepSleep | single aimed target, `MagicalSleep` | single aimed target, instant `sleeping` | documented simplification, unchanged |
| Blink | aimed `teleportToLocation`, detaches Roots | aimed, detaches roots | ✓ unchanged |
| Clairvoyance | aimed DIST-20 mapped diamond + secrets | aimed, DIST-20 Chebyshev into `explored` | ✓ unchanged |
| Shock | distance-2 flood, `prolong` Paralysis 1, refund `1 + hits` | aimed burst-2, shared 3-turn paralysis, refund `1 + hits` | refund exact; area shape + clock stated |
| Blast | `ConjuredBomb.explode`: 4+depth..12+3depth minus armor, terrain + heaps | same formula/armor/hero-inclusion, burns flammable, explodes ground items | ✓ unchanged (18th matrix) |
| Enchantment | `enchantable` (weapon/armor + upgradable, curse allowed), `enchant()` overwrites, never a curse, never the same class twice | bag-only picker, `rollAffix` good-only overwrite | ✓ curse behavior; same-affix re-roll + equipped exclusion are residuals |
| DetectMagic | curse-known + none/both/good/bad from curse/level/affix | same gate, same four-way verdict | ✓ unchanged |
| Intuition | two-stage guess, class-level identify, `IntuitionUseTracker` alternating free/paid | same, tracker as persisted run flag | ✓ unchanged (`IntuitionUseTracker` is real Java, confirmed this pass) |

| Food | Java | Port | Verdict |
| --- | --- | --- | --- |
| Ration (`food`) | `Hunger.HUNGRY` = 300, no heal | 300, heal 0 | ✓ unchanged |
| MysteryMeat (`meat`) | 150, no heal, `effect()`: `Int(5)` burning / roots×2 / poison `HT/5` / slow / nothing | 150, heal 0 | **heal 5 removed (invented); effect implemented this pass** |
| ChargrilledMeat | `HUNGRY/2` = 150, no heal | 150, heal 0 | **300 was a transcription error, fixed this pass** |
| StewedMeat | `HUNGRY/2` = 150 | 150 | ✓ unchanged |
| MeatPie | `STARVING*2` = 900 | 900 | ✓ unchanged |
| Pasty | `STARVING` = 450 | 450 | ✓ unchanged |
| Berry / Blandfruit / Carpaccio / Phantom / Supply / SmallRation | various | — | Not ported (none generated; documented) |

## What this confirms about the target shape

The eighteenth matrix's moral (one shared helper per seam, keyed branches
for the variants) held again - the stones are twelve thin `activate()`
transcriptions over `blastCells`, `addBuff`, and the MWL value table, and
every number checked (`flockRadius` 2, aggression 20/5, clairvoyance 20,
shock burst 2 + refund `1 + hits`, blast `4 + depth..12 + 3*depth`,
`charge(1f + hits)`, terror 20, `enchantable`'s weapon/armor+upgradable gate)
matched Java exactly. The failures rhyme differently this time: both food
bugs are numbers with no Java behind them at all (an invented heal, a
doubled energy), not shared-default substitutions - the MWL table had never
been read back against the `food/*.java` bodies.

## Actual structural gaps and fixes

Three real bugs found and fixed in this pass:

1. **MysteryMeat had no effect and a fake heal.** The port ate `meat` as a
   safe 150-energy snack that healed 5. Java's `MysteryMeat` never heals and
   always rolls `effect()`: burning (`reignite`), roots `Roots.DURATION*2`
   (10), poison `set(HT/5)`, slow (`Slow.DURATION` 10), or nothing. Eating
   meat now runs `applyMysteryMeatEffect` with Java's own numbers: burning
   through `reigniteBuff` (prolong 8, not overwrite), roots 10 through
   `addBuff`'s per-call duration, and poison converted from Java's damage
   pool to this port's turn clock (the clock whose cumulative
   `floor(t/3)+1` first reaches `HT/5` - exact at HT 20/30/40 (clocks 3/4/5
   dealing 4/6/8 against Java's 4/6/8). The Slow case stays unmodeled - no speed-factor
   buff exists in this port - so 2 of 5 rolls are silent instead of 1 of 5,
   stated in `PORT_COVERAGE.md`.
2. **ChargrilledMeat energy doubled.** `ChargrilledMeat.java` sets
   `Hunger.HUNGRY/2` (150); the MWL row read 300. Fixed to 150, which also
   corrects Horn-of-Plenty feed value, since that path reads the same row.
3. **Stale coverage on six stones.** `PORT_COVERAGE.md`'s runestone passages
   still describe the pre-aiming port: "no map-click cell-targeting" for
   Fear/DeepSleep/Shock/Blast/Blink/Clairvoyance, "Only Flock/Aggression
   remain" unported, Blast's terrain/heap half "not reproduced", and
   `addBuff` "has no per-call duration override". All four claims are now
   false - `beginAiming` serves six stones (only Flock stays hero-centred
   and Aggression nearest-enemy), all twelve stones are ported,
   `useStoneOfBlast` burns flammable terrain and explodes ground items, and
   `addBuff`/`reigniteBuff` take durations (Shock still applies the shared
   3-turn paralysis against Java's 1 - the behavior gap stands, only its
   stated mechanism changed). Corrected in place with this pass's date.

Residuals, recorded not fixed: Aggression uses set-semantics (`addBuff`)
where Java prolongs, and targets the nearest visible enemy where Java marks
whatever char occupies the aimed cell (ally included); Fear carries no
`Terror.object` source id; Enchantment may re-roll the item's existing
affix (Java's `Enchantment.random(old)` excludes it) and cannot reach
equipped gear (bag-only picker, shared with Transmutation); Flock centres
on the hero rather than a thrown cell.

## Verification

- `npx tsc --noEmit`: clean.
- `npm run test:items`: green, including the new `consumableStats` block
  pinning all six foods' hunger values and zero heals.
- Full `npm run build` + remaining suites before commit per `AGENTS.md`.
- Browser verification owed per ROADMAP.md section 10 (no browser tool
  available this session).
