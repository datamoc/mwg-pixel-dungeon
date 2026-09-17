# Monster family analysis: Succubus / Eye / Scorpio / RipperDemon

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4 (SPD-ADR-010): before
any class-level monster refactor, produce the data/function/method matrix for a family and let
the matrix - not a Java-class transposition - decide the representation. This is the fifth such
matrix (after Rat/Snake/Crab/Goo, DM200/DM300/Pylon, Gnoll/Brute/Shaman/Trickster, and
Ghoul/Monk/Warlock/Golem). Everything below cites the actual current code
(`src/content/monsters.mwl` for stats, `src/scenes/dungeonScene.ts` and `src/monsters.ts` for
behavior) and tag `v3.3.8` of the Java source - the Java reads in this pass were
`Succubus.java`, `Eye.java`, `Scorpio.java` and `RipperDemon.java`. No YogEye/YogScorpio/YogRipper
variant classes exist anywhere: the Yog summon deck (`summonYogMinion`,
`dungeonScene.ts:14659-14660`) fields the four base kinds below, so there is no variant row to
fill - stated, not missing.

## The matrix

| Axis | Succubus | Eye | Scorpio | RipperDemon |
| --- | --- | --- | --- | --- |
| **Data** | `hp:80 accuracy:40 evasion:25 damage:[25,30] armor:[0,10] exp:12 maxLvl:25` (`monsters.mwl:624-636`), scroll loot 0.33 (scene table `:17458`) | `hp:100 accuracy:30 evasion:20 damage:[20,30] armor:[0,10] exp:13 maxLvl:26` (`monsters.mwl:639-651`), `dewdrop` 1.0 (`monsters.ts:414`) | `hp:110 accuracy:36 evasion:24 damage:[30,40] armor:[0,16] exp:14 maxLvl:27` (`monsters.mwl:654-666`), non-healing potion 0.5 (scene table `:17454`) | `hp:60 accuracy:30 evasion:22 damage:[15,25] armor:[0,4] exp:9 maxLvl:-2` (`monsters.mwl:758-770`), no loot row anywhere |
| **Java data** | `HT 80`, `defenseSkill 25`, `EXP 12`, `maxLvl 25`, loot `SCROLL` 0.33, `blinkCooldown` 4-6 | `HT 100`, `defenseSkill 20`, `EXP 13`, `maxLvl 26`, loot `Dewdrop` 1.0 | `HT 110`, `defenseSkill 24`, `EXP 14`, `maxLvl 27`, loot `POTION` 0.5 (healing excluded by the same `createLoot` override Warlock uses) | `HT 60`, `defenseSkill 22`, `EXP 9` (for corrupting), `maxLvl -2`, no loot lines at all, `leapCooldown` 2-4 |
| **Function** (pure formulas, shared) | `rollHit`/`rollDamage` (`simulation/combat.ts`), `Roguelike.decideMonsterAI` (MWG) for movement/targeting | same, plus `resolveEyeBeamMobHit` (multi-target DeathGaze, ported 2026-09-17) and the shared `viewRadius()` | same | same |
| **Method** (behavior keyed on `kind`) | Charm-feed on hit (`:13955`): 1/3 `daze` plus healing `5+damage` capped at missing HP. No blink branch anywhere. | Multi-target beam (see the Eye commit); kite-away shared with `acidic` (`:9306`). | 50% `cripple` on a hit (`:13970`, shared with `acidic`); kite-away shared with `acidic` (`:9306`). | None. No leap, no Bleeding, no branch of any kind - spawned (`:3928`), sprited, and fielded in the Yog deck, but behaviorally a plain melee bag. |
| **State** (runtime, must be snapshotable) | `hp`, position, buffs, `sleeping`, `seesHero` - the `ActorState` core, nothing extra (no blink cooldown field exists) | same core, nothing extra (the beam needs no persisted aim state) | same core, nothing extra | same core, nothing extra (no leap position/cooldown fields exist) |
| **Ability/hook** | **Charm-feed**: a 1-in-3 debuff plus heal-off-the-victim rider on landed hits. | **DeathGaze**: the telegraphed multi-cell beam. | **Crippling hit**: a 1-in-2 slow rider on landed hits. | **Leap** (unported): a telegraphed 2-4-cooldown pounce ending in Bleeding - the family's only movement ability and its only missing kit. |
| **Presentation** | `succubus.png` sprite, `MOB_KEYS`/i18n text key, `charm` + `succubusfeeds` lines | `eye.png`, same shape | `scorpio.png`, same shape, `cripple` line | `ripper.png`, same shape, no lines of its own |
| **Exceptions** (real code unique to this monster today) | the charm-feed branch | the beam resolver + the `acidic` kite-away OR | the cripple branch, the kill-path potion table, the `acidic` kite-away OR | none |

## What this confirms about the current code, versus what the plan warns against

**This family is three finished ports plus one empty uniform.** Succubus/Eye/Scorpio each carry
exactly one landed-hit rider or beam plus a faithful loot table, all already single-kind and
table-shaped - like the Dwarf court, the trivial migration shape. The Ripper is the opposite:
a stat row with no behavior at all, which is also the matrix's main gap finding - its leap
needs two persisted fields (`leapPos`, `leapCooldown`) and a Hunting override, i.e. the first
real state-plus-override case since the matrices began, worth piloting on its own rather than
folded into a table migration.

Three smaller gaps this matrix newly records (no code changed this pass): Succubus has no
blink (Java closes distance over 2 on a 4-6 cooldown when unrooted - she currently walks like
everything else); her feed discards overheal where Java converts it to a Barrier shield; and
her `daze` stands in for Charm (seduce semantics - cannot harm the charmer - unmodeled, kept).
Scorpio's kite-away is shared with `acidic` by kind-OR, and the Java basis checks out:
`Scorpio.getCloser()` returns `enemySeen && getFurther(target)` while HUNTING, i.e. a
ranged claw-fighter that holds its distance whenever it sees the enemy (Acidic steps away
from its own blood instead - same observable, different reason - so the shared branch
stays, and this paragraph replaces the open question an earlier draft recorded here).

## Recommendation

- **No refactor needed for the three data rows, their riders, or their loot tables** - each is
already single-kind and table-shaped.
- **One pilot candidate, deliberately scoped:** the Ripper leap (two state fields plus the
telegraph-and-pounce Hunting override) - the migration's first stateful movement ability.
- **One open question for a later pass, not this one:** whether Succubus blink plus
Barrier-overflow feed are worth their fields before the table migration.
**Update 2026-09-17:** blink is now ported (see its `PORT_COVERAGE.md` row); the
Barrier-overflow feed stays open - the port still has no generic ally Barrier pool.

**Update 2026-09-17:** the Ripper pilot above is now ported (`simulation/ripperLeap.ts` +
`takeRipperLeapTrigger`/`executeRipperLeap`/`resolveRipperPounce`, leap state on `Creature`
persisted through save/load - see its `PORT_COVERAGE.md` row). The table rows above describe
the pre-pilot audit state and are left as-is; only this note records the outcome.
