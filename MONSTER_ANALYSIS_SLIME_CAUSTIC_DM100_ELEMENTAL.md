# Monster family analysis: Slime / CausticSlime / DM-100 / Elemental

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the ninth data/function/method matrix. The family is useful because
it is the first whose audit escaped the family: the CausticSlime loot row led to the global
`maxLvl + 2` loot gate missing for every mob, the wealth bonus rolls keyed on a hand list,
and the BOSS/MINIBOSS property sets missing members - all fixed in the same pass. The matrix
describes the current TypeScript representation before any class-level refactor. Java
authority is tag `v3.3.8` throughout.

## The matrix

| Axis | Slime | CausticSlime | DM-100 | Elemental (+Newborn) |
| --- | --- | --- | --- | --- |
| **Data** | MWL `slime` row `20/12/5/[2,5]/[0,0]/4/9` matching Java exactly; weapon loot `0.2` with the `SLIME_WEP` power-4 decay (`loot-rules.mwl`) | No Java loot override of its own, so it inherits the slime weapon line with the *shared* counter - the port row said `0.5` meat, fixed to the slime line in this pass (see below); `ooze`-immune through the ACIDIC rule (`resistance-rules.mwl`) | MWL `dm100` row `20/11/8/[2,8]/[0,4]/6/13` matching Java; scroll loot `0.25`; `INORGANIC` flag | MWL `elemental` row `60/25/20/[20,25]/[0,5]/10/20` matching the wild line; subtype loot verified per inner class (fire/frost `1/8` potion, shock `1/4` recharging scroll, chaos guaranteed transmutation); `flying` flag; the summoned-ally `newbornElemental` row is flat where Java scales |
| **Function** (shared) | `rollHit`/`rollDamage`, `defenderDamageCurves` soft-cap (`max(dmg, 5 + (dmg-5)/2)`), `Char.damage` handling | same soft-cap plus the shared `acidic` ooze-immunity read | same ordinary path when adjacent; the ranged table otherwise | same ordinary path for the wild kind; the summoned ally is gated out of several |
| **Method** (behavior keyed on `kind`) | none beyond the soft-cap | `mobOnHit` ooze branch at a bare half chance - matching Java, whose `attackProc` likewise carries no `damage > 0` gate (contrast Albino, whose gate is real) | ranged-AI entry: hero targetable within 6, zap `[3, 10]` (Java's `MAGIC_BOLT` ballistics ride the shared `canTarget` simplification) | ranged-AI table per `elementalType` (dodgeable newborn fireball, shock arcs at 40% damage, frost chill `12 + depth/2`, chaos debuff set, fire ignition); `mobOnHit` contact branch per subtype |
| **State** (runtime and save) | none | none | `rangedCooldown` | `elementalType` persisted; `rangedCooldown`; the summoned ally clears `miniboss` (matching `AllyNewBornElemental`'s "not a miniboss") and parks `rangedCooldown` at infinity |
| **Ability / hook** | soft-cap verified against the formula | half of all landed hits ooze for the standard duration | lightning zap with the hero-hit/miss presentation split | shock chains, frost chill, chaos vulnerability/hex equivalents, fire ignition through the shared buff pipeline |
| **Presentation** | slime art | caustic art | dm100 art, `port.log.dm100zaps` | per-subtype art, kit-applied and zap log lines |
| **Exceptions** | the tier-2 weapon arrives as the generic weapon-as-`armor` stand-in, not a real rolled weapon (documented at the row) | GooBlob quest drop added in this pass (gated, on a free 8-neighbour) | ELECTRIC resistances (lightning family halved) are unmodeled - the buff pipeline has no resistance-halving mechanism, established by the seventh matrix | `Elemental.random()`'s 1/50 exotic roll (RatSkull trinket multiplier) is absent with the trinket system; the summoned ally never scales (`15 * regionScale` HP and friends stay flat) and the ally/no-ranged distinction is only half-kept; greatCrab meat drops 1 instead of Java's stacked 2 (noticed in passing while gating it) |

## What this confirms about the target shape

The eighth matrix's "entry into play" moral inverts here: the interesting behavior was in the
*shared* systems (loot gating, wealth cadence, property sets), and the family rows were
already right. Three of the four fixes touch code no single family owns, which is the
strongest evidence yet that the keyed-branch target composes: one `overleveled` constant
gates every lootChance roll, one set read fixes every wealth roll, two MWL set edits fix
every downstream boss/miniboss rule (execute exclusions, aggression, multiplicity and
ratmogrify exclusion, paralysis immunity, spawn flags).

## Actual structural gaps and fixes

Four real bugs found and fixed in this pass, each with a Java-citing comment at the site:

- `Mob.rollToDropLoot()`'s `hero.lvl > maxLvl + 2` early return was missing everywhere:
  overleveled heroes rolled full loot from every mob. A single `overleveled` constant now
  gates the elemental/warlock/scorpio/succubus branches, the shared `MOB_LOOT` loop, the
  wealth bonus (which sits past the gate in Java too), and the greatCrab meat. die() drops
  (goo/DM300 materials, statue equipment, mimic payloads, stolen returns, embers) and the
  port-invented guard key stay outside it, matching Java's method boundary exactly.
- Wealth bonus rolls keyed on a hand list (`goo/dm200/dm201` at 5 rolls) instead of the
  BOSS/MINIBOSS properties: real minibosses rolled once, non-minibosses rolled five times.
  Now `BOSS_KINDS ? 15 : MINIBOSS_KINDS ? 5 : 1`, the shape every other rule already uses.
- The property sets themselves were incomplete: boss missed eye/warlock/pylon, miniboss
  missed elemental/eye/warlock (all real `Property` holders at the tag; unported
  CrystalSpire/FungalCore/GnollGeomancer and CrystalGuardian/FungalSentry/GnollSapper
  omitted). Newborn correctly stays miniboss - `NewbornFireElemental` carries it in Java,
  which the audit confirmed before touching anything.
- CausticSlime loot was invented (`0.5` meat): Java inherits Slime's weapon line with the
  shared `SLIME_WEP` counter and adds a gated GooBlob on a free neighbour. The row now
  matches slime's, the counter maps `causticSlime -> slime` (the `dm201 -> dm200` shape),
  and the GooBlob branch is live.

Deliberately left open: resistance halving generally (ELECTRIC here, noted twice before);
the slime weapon stand-in; greatCrab meat quantity; the summoned ally's scaling; the
RatSkull exotic roll. Each is recorded here and in the `PORT_COVERAGE.md` rows touched by
this pass rather than silently kept. Two adjacent pre-existing failures were re-proven
unrelated on a pristine HEAD worktree before committing: the hunger immutability check
(`291 !== 300`) and the missile-stats workflow check.
