# Monster family analysis: Ghoul / Monk / Warlock / Golem (+ the Dwarf King's court variants)

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4 (SPD-ADR-010): before
any class-level monster refactor, produce the data/function/method matrix for a family and let
the matrix - not a Java-class transposition - decide the representation. This is the fourth such
matrix (after Rat/Snake/Crab/Goo, DM200/DM300/Pylon, and Gnoll/Brute/Shaman/Trickster).
Everything below cites the actual current code (`src/content/monsters.mwl` for stats,
`src/scenes/dungeonScene.ts` and `src/monsters.ts` for behavior) and tag `v3.3.8` of the Java
source - the Java reads in this pass were `Ghoul.java` (with `GhoulLifeLink`), `Monk.java`,
`Warlock.java` and `Golem.java`, plus the `DKGhoul`/`DKMonk`/`DKWarlock` variants inside
`DwarfKing.java`.

The King's P3 court spawns the four base kinds (`summonKingAdd`, `dungeonScene.ts:12010`); the
`DK*` subclasses have no `MonsterId`, no MWL row and no spawn site here. They stay a documented
gap, not a silent one (see the last row).

## The matrix

| Axis | Ghoul | Monk | Warlock | Golem |
| --- | --- | --- | --- | --- |
| **Data** | `hp:45 accuracy:24 evasion:20 damage:[16,22] armor:[0,4] exp:5 maxLvl:20` (`monsters.mwl:534-546`), loot `gold` 0.2 (`monsters.ts:411`) | `hp:70 accuracy:30 evasion:30 damage:[12,25] armor:[0,2] exp:11 maxLvl:21` (`monsters.mwl:594-606`), loot `food` 0.1 (`monsters.ts:412`) | `hp:70 accuracy:25 evasion:18 damage:[12,18] armor:[0,8] exp:11 maxLvl:21` (`monsters.mwl:579-591`), potion loot with the healing-decay rule in scene code, not the table | `hp:120 accuracy:28 evasion:15 damage:[25,30] armor:[0,12] exp:12 maxLvl:22` (`monsters.mwl:609-621`), loot `armor` 0.2 (`monsters.ts:413`) |
| **Java data** | `HT 45`, `defenseSkill 20`, `EXP 5`, `maxLvl 20`, loot `Gold` 0.2, `drRoll +0-4` | `HT 70`, `defenseSkill 30`, `EXP 11`, `maxLvl 21`, loot `Food` 0.083, `drRoll +0-2` | `HT 70`, `defenseSkill 18`, `EXP 11`, `maxLvl 21`, loot `POTION` 0.5 with healing guaranteed early then decaying to 0 over 8 drops, `drRoll +0-8` | `HT 120`, `defenseSkill 15`, `EXP 12`, `maxLvl 22`, loot `WEAPON/ARMOR` 0.125 halving per drop (`LimitedDrops.GOLEM_EQUIP`), `drRoll +0-12` |
| **Function** (pure formulas, shared) | `rollHit`/`rollDamage` (`simulation/combat.ts`), `Roguelike.decideMonsterAI` (MWG) for movement/targeting | same, plus the shared `focus` buff readers in `attack()` and the damage boundary | same, plus `selectRangedTarget` (`simulation/targeting.ts`) and `zapHero` for the bolt | same |
| **Method** (behavior keyed on `kind`) | Death revival via `ghoulDown` (`dungeonScene.ts:13199`) - first down per fight rises at `maxHp/10` with the `ghoulrises` line. No link partner, no downed-counter scaling. | `focus` lifecycle in three places, all OR'd with `senior`: spawn equip (`:2368`/`:2452`), cooldown tick plus re-focus while seeing the hero (`:7243`), regain-on-move (`:12454`), and the defense reader (`:12627`). | Landed-ranged-zap Degrade rider, 1-in-2 (`:10302`); the full healing-decay potion table in the kill path (`:14355`). | Unreachable-target self-teleport with the real 30-turn cooldown and 2-turn cost (`:9825`); the teleport-the-hero-away ability with the `MagicImmune` gate (see the King row); DwarfToken drops shared with Monk (`:14481`). |
| **State** (runtime, must be snapshotable) | `hp`, position, buffs, `sleeping`, `seesHero` - the `ActorState` core - plus the fight-scoped `ghoulsDowned` latch (first revival only) | same core **plus** `focusCooldown` (0 at spawn) and the `focus` buff itself | same core, nothing extra (the warlock healing-drop counter lives in `limitedDrops`, not on the mob) | same core **plus** `golemSelfTeleCooldown` |
| **Ability/hook** | **LifeLink-lite**: one revival per fight at a tenth of max HP. Reads/writes only the latch plus `hp`. | **Focus**: a spawn/hunt/move-maintained accuracy-and-evasion buff with a per-turn cooldown tick. | **DarkBolt Degrade**: a 1-in-2 debuff rider on landed ranged zaps (melee excluded, per the audit that fixed the old any-hit weapon-decrement). | **Self-teleport**: relocation to the unreachable patrol target when boxed in, once per 30 turns. |
| **Presentation** | `ghoul.png` sprite, `MOB_KEYS`/i18n text key, `ghoulrises` line | `monk.png`, same shape | `warlock.png`, same shape, `degrade` line | `golem.png`, same shape |
| **Exceptions** (real code unique to this monster today) | `ghoulsDowned`, the `ghoulDown` branch | `focusCooldown`, four `monk OR senior` sites (spawn x2, turn tick, move regain, defense reader) | the zap rider branch, the kill-path loot table | `golemSelfTeleCooldown`, the wandering-teleport branch |

## What this confirms about the current code, versus what the plan warns against

**This family is four separate abilities wearing one roster, plus one more variant-inheritance
exhibit.** Unlike the Gnoll matrix's single shared mechanic, Ghoul/Monk/Warlock/Golem share
nothing but the generic turn - each ability branch is keyed on exactly one kind, which is
precisely the per-`kind` ability table matrix one recommends: this family would migrate as
four independent table entries with zero shared code, the easiest possible shape.

The variant-inheritance lesson from matrix three repeats twice here. `senior` rides every
Monk branch by explicit kind-OR (spawn, tick, regain, defense) - the same hand-OR pattern as
Brute/ArmoredBrute, and the same future alias. The King's court is the sharper case: Java
says `class DKGhoul extends Ghoul` (plus `DKMonk`, `DKWarlock`) with `BOSS_MINION`, a
hunting spawn state, and - for the ghoul - severed LifeLink partners (`partnerID = -2`);
this port spawns the four base kinds awake with none of that. The base-kind spawn is fine
for stats and abilities, but a family alias would additionally need a per-spawn flag row
(minion property, partner severing) before the court can be faithful.

## Recommendation

- **No refactor needed for the four data rows or their ability branches** - each branch is
already single-kind and table-shaped; they are the migration's trivial cases.
- **Two pilot candidates, in size order:** (1) the Monk/`senior` OR-chain (four sites, one
mechanic - same shape as the approved Brute pilot); (2) a spawn-flag row for the King's
court (`BOSS_MINION` + partner severing) the next time the King summons are touched.
- **Gaps this matrix newly records (no code changed this pass):** Monk loot is 0.1 here
against Java's 0.083 (rounding, kept); Golem loot is a flat `armor` 0.2 against Java's
decaying `WEAPON/ARMOR` from 0.125 (approximation, kept - same stand-in the Slime row
already documents); Monk spawns already focused where Java earns it on the first hunting
turn (converges immediately, kept); Ghoul revival is first-down-only at a tenth of max HP
against Java's partner-linked `timesDowned*5` chain (simplification, kept).
