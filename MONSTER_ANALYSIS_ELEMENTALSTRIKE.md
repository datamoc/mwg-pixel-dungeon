# Armor-ability analysis: Duelist ElementalStrike and its imbuements

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the twenty-second analysis matrix and the third for
armor abilities. It covers `ElementalStrike.java` - `activate()`,
`preAttackEffect`, `perCellEffect`, `perCharEffect`, the nested
`DirectedPowerTracker`/`ElementalStrikeLuckyTracker`/`ElementalStrikeFurrowCounter`,
and the three talents (tag `v3.3.8`, from the local shattered-pixel-dungeon
checkout) - against `activateElementalStrike`/`heroWeaponRoll`/
`detonateConjuredBlast` in `src/scenes/dungeonScene.ts`, the twenty pure
helpers in `src/simulation/duelistAbilities.ts`, the `elementalstrike` offer
row (already authored), and the new `luckyTracker` buff row.

## The matrix

| Java | Port | Verdict |
| --- | --- | --- |
| `baseChargeUse = 25`, `targeting 'cell'`, talents `ELEMENTAL_REACH/STRIKING_FORCE/DIRECTED_POWER` | MWL row, already authored; pinned in the verifier | V unchanged |
| Aim `Ballistica(hero, target, WONT_STOP)`; `maxDist = 4 + reach`, `dist = min(aim.dist, maxDist)`, `65 + 10*reach` degrees, `STOP_SOLID \| STOP_TARGET` | `ballistica` `stop: 'none'` aim, `elementalStrikeCone()`, `coneCells` with `coneRay(stopAtTarget)` | V exact, pinned |
| Enchantment read off the melee weapon (`enchantment.getClass()`, null when unenchanted) | `this.weaponAffix`, which holds the enchantment or curse id | V exact; curses ride the same branch because `Weapon.Curse extends Enchantment` in Java |
| `preAttackEffect`: enemy count in cone; `DIRECTED_POWER` `0.30*targetsHit*points` onto a one-shot tracker consumed by `Weapon.procDamage` | `directedPowerBoost()` passed straight into the forced primary swing's multiplier | V exact (the tracker has no other reader) |
| `powerMulti = 1 + 0.30*STRIKING_FORCE` over everything | `elementalPowerMulti()`, pinned | V exact |
| Kinetic: copy `ConservedDamage` before the swing; splash `round(stored*0.4*powerMulti)` to non-primaries; clear only when no primary | `storedKinetic` read pre-swing, `elementalKineticSplash()`, same clear rule | V exact |
| Blocking `round(6*targetsHit*powerMulti)` shield; Vampiric `round(2.5*targetsHit*powerMulti)` capped at missing HP; Sacrificial hero bleeds `10*powerMulti` | `elementalBlockingShield()` into `grantHeroShield`, `elementalVampiricHeal()`, `setBleeding(hero, ...)` | V exact |
| Primary: `Actor.findChar(target)` unless charmed-by, allied, or out of `canAttack` range; `hero.attack(enemy, 1, 0, INFINITE_ACCURACY)` | aimed-cell foe in melee range (Chebyshev 1) via `abilityForceHit` + `abilityDamageMult`, reset explicitly after | V exact (the explicit reset covers early gates in `attack()`) |
| Per-cell Blazing/Chilling/Shocking: seed Fire/Freezing/Electricity `round(8*powerMulti)` in every cone cell | `elementalBlobAmount()` into `fire`/`electricity`; Chilling clears fire per cell and chills occupants via `applyChillFreeze` | blobs exact; Freezing halves stated (no Freezing blob exists; the frost potion models the same two halves) |
| Per-cell Blooming: shuffled cells, `round(8*powerMulti)` high-grass budget on EMPTY/EMBERS/EMPTY_DECO/GRASS minus immovables/plants, else GRASS; furrow past 40 counted uses, +4 per empty-field use, +1 otherwise | same over `FLOOR/EMBERS/GRASS` (deco folds into the base kind live), `furrowedGrass` set, `elementalFurrow` counter saved with the run | V exact modulo deco; `Dungeon.observe()` unneeded (no stale-FOV seam here) |
| Per-char unenchanted: `round(powerMulti * heroDamageIntRange(6, 12))` | `elementalBaseDamage()`, pinned | V exact |
| Blooming roots `round(6*powerMulti)`; Elastic `round(5*powerMulti)` shove away, furthest-first, skipping a displaced primary | `elementalRootsDuration()`, `elementalKnockback()`, stepwise shove | durations exact; sort follows Java's comment (its comparator sorts closest-first instead - taken as the bug); collision damage absent (established shove) |
| Lucky: enemies at `0.125*powerMulti` drop `genLoot()` once per mob (`ElementalStrikeLuckyTracker`) | `elementalLuckyChance()`, consumable drop by the kill-proc neighbour search, `luckyTracker` 9999 (effectively-permanent stand-in) | chance/tracker exact; loot is the port's consumable stand-in, not `genConsumableDrop(-5)`'s 80/20 table |
| Projecting: non-primaries take `round(heroRoll*0.3*powerMulti)`; Unstable: non-primaries eat a random enchant's `proc` with a fresh roll | `elementalProjectingSplash()`, `UNSTABLE_DELEGATES` through the swing's own delegation channel | V exact (unarmed gate moot - the port is never unarmed) |
| Corrupting: non-primary living mobs at `(0.05+0.2*missing)*powerMulti` heal and convert; Grim: non-primaries at `(0.06+0.24*missing)*powerMulti` take full-HP damage | same chances, wand-of-corruption conversion, `applyAbilityDamage(ch, ch.hp)` | V exact; no boss gate either way (no mob overrides Corruption immunity in Java) |
| Annoying `0.2*powerMulti` Amok 6; Dazzling/Wayward `0.5*powerMulti` Blindness/Hex 6; Sacrificial `12*powerMulti` bleed; Polarized `0.5*powerMulti` for `heroDamageIntRange(24, 36)`; Friendly `0.5*powerMulti` Charm 6 bound to the hero | `elementalAnnoyingChance()`/`elementalCurseChance()`/`elementalSacrificialOther()`, same buffs/durations, charm target map | V exact |
| Displacing `0.5*powerMulti`: `teleportChar`, HUNTING drops to WANDERING | `randomFreeCell` + `moveTo` + appear effect | teleport exact; the calm has no mob-state field to write to |
| Explosive `0.5*powerMulti`: a random caught char's cell eats `ConjuredBomb().explode()` | `detonateConjuredBlast()`: distance-1 passable/flammable flood, `NormalIntRange(4+depth, 12+3*depth)` minus armor, hero included | V exact (shared `Bomb` base defaults with the Stone-of-Blast port) |
| Invis dispelled, charge spent, one turn | `spendHeroAction(1)` | V exact |

## What this confirms about the target shape

The twenty-first matrix's moral held a fourth time, at larger scale: the MWL
row, the talents, the aim/cone/force-hit/multiplier channels, every buff key
(`roots`, `amok`, `blindness`, `hex`, `charm`, `bleeding`), the Kinetic store,
the Barrier pool, the ally-conversion block, the Lucky neighbour search, the
Unstable delegation channel, the teleport and conjured-blast shapes were all
already in the tree. The genuinely new code is the dispatch itself - twenty-one
imbuement branches that are each one formula plus one existing seam.

## Residuals, recorded not fixed

Freezing has no blob (Chilling models its two halves ad hoc); the Displacing
calm (`HUNTING -> WANDERING`) has nowhere to land; Elastic shove deals no
collision damage; Lucky-strike loot is a plain consumable rather than
`genConsumableDrop(-5)`; cone cast visuals/sounds have no seam (Shockwave's
precedent); neutral NPCs in the cone are spared by the standing ability-damage
filter; the furrow counter does not specially survive ankh revive beyond the
normal save.

## Verification

- `npx tsc --noEmit`: clean.
- `npm run build`: clean.
- `npm run test:simulation`: green (121 checks, was 120), including the new
  ElementalStrike cone/talent/imbuement block.
- `npm run test:items`: green (buff-duration table gains `luckyTracker: 9999`).
- `npm run test:lua`, `test:mwg`, `test:settings`, `test:ui`: green.
- Browser verification owed per ROADMAP.md section 10 (no browser tool
  available this session).
