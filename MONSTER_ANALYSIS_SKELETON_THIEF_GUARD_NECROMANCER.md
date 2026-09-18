# Monster family analysis: Skeleton / Thief (+Bandit) / Guard / Necromancer (+SpectralNecromancer)

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4 (SPD-ADR-010): before
any class-level monster refactor, produce the data/function/method matrix for a family and let
the matrix - not a Java-class transposition - decide the representation. This is the sixth such
matrix (after Rat/Snake/Crab/Goo, DM200/DM300/Pylon, Gnoll/Brute/Shaman/Trickster,
Ghoul/Monk/Warlock/Golem, and Succubus/Eye/Scorpio/Ripper). Everything below cites the actual
current code (`src/content/monsters.mwl` for stats, `src/content/loot-rules.mwl` +
`src/monsters.ts` for loot/decay, `src/scenes/dungeonScene.ts` for behavior) and tag `v3.3.8`
of the Java source - the Java reads in this pass were `Skeleton.java`, `Thief.java`,
`Bandit.java`, `Guard.java`, `Necromancer.java` (with `NecroSkeleton`) and
`SpectralNecromancer.java`.

`bandit` and `spectralNecromancer` are real spawnable kinds with MWL rows; every behavior
branch keys on them by explicit kind-OR with the base - the same hand-OR pattern as
Senior/Acidic/DM201. `necroSkeleton` has a data row but almost no branch keys on it; it is
nearly data-only.

## The matrix

| Axis | Skeleton | Thief / Bandit | Guard | Necromancer / SpectralNecromancer |
| --- | --- | --- | --- | --- |
| **Data** | `hp:25 accuracy:12 evasion:9 damage:[2,10] armor:[0,5] exp:5 maxLvl:10` (`monsters.mwl:109-123`), loot `armor` 1/6 with `power/3` decay (`loot-rules.mwl`, `monsters.ts:425,455`) | thief `hp:20 accuracy:12 evasion:12 damage:[1,10] armor:[0,3] exp:5 maxLvl:11` (`monsters.mwl:209-221`), loot `ring` 0.03 with `power/3` decay; bandit identical stats (`monsters.mwl:805-817`), loot `gold` 1 (`loot-rules.mwl:49-52`) with **no** decay row | `hp:40 accuracy:12 evasion:10 damage:[4,12] armor:[0,7] exp:7 maxLvl:14` (`monsters.mwl:239-251`), loot `armor` 0.2 with `power/3` decay | necro `hp:40 accuracy:10 evasion:14 damage:[2,10] armor:[0,5] exp:7 maxLvl:14` (`monsters.mwl:254-266`), spectral identical (`:820-832`), loot `potion` 0.2 with `linear/6` decay; `necroSkeleton` hp:20, skeleton combat stats, exp:0, maxLvl:-5 (`monsters.mwl:422-437`) |
| **Java data** | `HT 25`, `defenseSkill 9`, `EXP 5`, `maxLvl 10`, loot `WEAPON` 1/6 with `SKELE_WEP` (1/3)^n, `damageRoll Normal(2,10)`, `drRoll +0-5`, `attackSkill 12`, UNDEAD+INORGANIC | `HT 20`, `defenseSkill 12`, `EXP 5`, `maxLvl 11`, loot `oneOf(RING,ARTIFACT)` 0.03 with `THEIF_MISC` (1/3)^n, `damageRoll 1-10`, `drRoll +0-3`, `attackSkill 12`. Bandit `extends Thief`: same stats, `lootChance 1f` (first drop guaranteed, then the same decay); steal adds Blindness/2 + Poison 5-6 + Cripple/2 | `HT 40`, `defenseSkill 10`, `EXP 7`, `maxLvl 14`, loot `ARMOR` 0.2 with `GUARD_ARM` (1/3)^n, `damageRoll 4-12`, `drRoll +0-7`, `attackSkill 12`, `chainsUsed` once per lifetime | `HT 40`, `defenseSkill 14`, `EXP 7`, `maxLvl 14`, loot `PotionOfHealing` 0.2 with `(6-n)/6`, `drRoll +0-5`, `canAttack()` returns false (never strikes the hero), `firstSummon ? TICK : 2*TICK`; `NecroSkeleton extends Skeleton`: HP 20, `maxLvl -5` (no loot/exp). Spectral `extends Necromancer`: identical stats; summons an adjusted Wraith instead, extra Remove-Curse drop, `die` kills its wraiths |
| **Function** (pure formulas, shared) | `rollHit`/`rollDamage` (`simulation/combat.ts`), `Roguelike.decideMonsterAI` (MWG) for movement/targeting | same | same, plus the ranged chain dispatch (`rangedAiOverrides`) | same, plus `zapHero` for the bolt and `monsterTurnCost` for the variable summon cost |
| **Method** (behavior keyed on `kind`) | **None** - no `die()` explosion branch exists anywhere in port code (see gaps). | Steal-on-hit `thiefSteal` (`dungeonScene.ts:14179-14189`, `:14319-14330`); stolen-loot flee dispatch (`:9349`) with `fleeBelow 1` (`:9405`); kill-path stolen-item return + bonus gold (`:14720-14728`). Bandit shares all three by kind-OR, plus its poison/cripple/daze rider (`:14181-14188`). | Ranged chain branch (`:9978-9982`) + `chainHero` one-cell drag with Cripple (`:10830-10840`); `chainUsed` set-once, persisted through save/load (`floorState.ts:149`). Iron-key 1/3 kill drop (`:14704-14708`). | `necromancerRangedTurn` (`:10112`): heal `round(maxHp/5)` first, else Adrenaline stand-in, else skeleton teleport, else summon at distance<=4, else `[2,10]` bolt; `summonSkeleton` (`:10610-10695`) with push-aside and `firstSummon` cost; master-death skeleton collapse (`:14740-14744`). Spectral shares every branch by kind-OR (dispatch `:9949-9950`, kill collapse `:14741`). |
| **State** (runtime, must be snapshotable) | `hp`, position, buffs, `sleeping`, `seesHero` - the `ActorState` core - nothing extra | same core **plus** `stolen` (item id or gold; `floorState.ts:107`, saved) | same core **plus** `chainUsed` | same core **plus** `skeleton` (live ref, re-linked by `skeletonIndex`) and `firstSummon` (saved) |
| **Ability/hook** | **Bone explosion: missing.** Java's only Skeleton ability (`die()`: Normal 6-12 to all 8 neighbours, all DR doubled) has no port branch; the kind migrates as pure data. | **Steal-then-flee + recovery**: one theft sets `stolen`, forces flight, death returns the item plus gold. | **Once-ever chain-pull**: drag one cell closer + Cripple, gated by the lifetime flag. | **Summon/support/teleport + die-with-master**: skeleton companion with heal/Adrenaline/teleport upkeep and `firstSummon` TICK-vs-double cost; master's death kills it. |
| **Presentation** | `skeleton.png` sprite, `MOB_KEYS`/i18n text key; no explosion sound/line exists | `thief.png` (bandit shares it); `thiefsteals` / `thiefgold` / `thiefloot` lines | `guard.png`; `chain` line; `guardkey` line | `necromancer.png` for both; `skeleton.png` reused for `necroSkeleton`; `summonskeleton` / `necroheal` / `necroadrenaline` / `necroteleport` / `necropush` / `skeletoncollapses` lines |
| **Exceptions** (real code unique to this monster today) | none - that absence *is* the finding | `stolen`; four `thief OR bandit` sites (flee dispatch, `fleeBelow`, steal proc, kill return) | `chainUsed`; the chain branch + `chainHero`; the iron-key kill branch | `skeleton`, `firstSummon`; the whole `necromancerRangedTurn`/`summonSkeleton` complex; three `necromancer OR spectralNecromancer` sites (ranged dispatch, bolt, kill collapse) |

## What this confirms about the current code, versus what the plan warns against

**This family is one data row, one steal-flee loop, one once-ever pull, and one companion-master
complex - with the variant-inheritance exhibit twice over.** Bandit and SpectralNecromancer ride
their base branches by explicit kind-OR, the same hand-OR pattern as Senior/Acidic/DM201 and the
same future family-alias shape; a Java-class transposition (`class Bandit extends Thief`) would
add nothing the ORs do not already express. `necroSkeleton` is the cleanest data-only row yet:
a stat block with a loot-gate `maxLvl`, keyed on by almost nothing - the matrix's ideal "table
entry with no ability" case.

The hollow case is the Skeleton itself: its data row is exact, but Java's *only* Skeleton
behavior - the death explosion - is absent entirely, so the kind currently migrates as stats
plus a gap, not stats plus an ability. The Necromancer is the opposite pole: the largest
ability complex in any matrix so far (summon placement, push-aside, variable cost,
heal/Adrenaline/teleport upkeep, death linkage), already ported piece by piece, and it all
funnels through one helper the Spectral variant shares for free.

## Recommendation

- **No refactor needed for any data row or ability branch** - every branch is already single-kind
  or base-plus-variant-OR, i.e. table-shaped; the OR-chains are the migration's documented alias
  candidates, not defects.
- **Pilot candidate, in size order:** the `thief OR bandit` chain (four sites, one mechanic -
  same shape as the approved Brute pilot); the `necromancer OR spectralNecromancer` chain
  (three sites) rides the same alias if the pilot succeeds.
- **Gaps this matrix newly records (no code changed this pass):** Skeleton bone explosion not
  ported (Normal 6-12 to all 8 neighbours, all DR doubled); Thief steal simplified to one
  consumable-or-gold vs `randomUnequipped`; no `Fleeing.escaped` teleport-escape and no fleeing
  gold-drop on being hit; Bandit loot diverged to guaranteed `gold` with no decay row vs the
  inherited RING/ARTIFACT with `THEIF_MISC` (1/3)^n; Spectral summons `necroSkeleton`, not an
  adjusted Wraith, with no Remove-Curse drop and no wraith-death linkage; the Necro `[2,10]`
  hero bolt is port-invented (Java `canAttack()` returns false - a Necromancer never strikes
  the hero), kept as the fallback that keeps the kind threatening without a skeleton; Guard
  chain is a one-cell drag vs the Ballistica pull, and the 1/3 iron key is port-side prison
  content with no `Guard.java` counterpart.
