# Monster family analysis: Piranha / Statue / Mimic / Wraith

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4
(`SPD-ADR-010`). This is the eighth data/function/method matrix. The family is useful because
it contains nothing but special-activation mobs: a water-bound sleeper (Piranha), a passive
guardian that wakes when struck (Statue, plus its armored subclass), a chest that is only
sometimes a monster (Mimic, plus the crystal variant), and a ghost with no roster entry at all
(Wraith, plus the quest dust variant). Every member's interesting behavior is in how it
enters play, not in its stat line - which is exactly where the port's gaps turned out to be.
The matrix describes the current TypeScript representation before any class-level refactor.
Java authority is tag `v3.3.8` throughout.

## The matrix

| Axis | Piranha | Statue (+ArmoredStatue) | Mimic (+CrystalMimic) | Wraith (+DustWraith) |
| --- | --- | --- | --- | --- |
| **Data** | MWL `piranha` row plus its `monsterDepthStats` row, all matching Java's constructor line-for-line: HP `10+5d`, evasion `10+2d`, damage `[d, 4+2d]`, accuracy `20+2d`, armor `[0, d]`, EXP 0, mystery-meat loot `1.0`; `blobImmune` flag (`BlobImmunity`, read at the fire site - the port's only creature-facing blob) | MWL `statue` row plus depth row: HP `15+5d`, evasion `4+d`, EXP 0, `inorganic` flag; armored doubles HP to `30+10d` with armor `[0, 4+d]`. The combat stats (`[2, 8+d]` damage, `9+d` accuracy, `[0, 2+d]` armor) are flat stand-ins: Java fights entirely through the generated weapon (damage, accuracy factor, delay, reach, proc, enchantment) plus generated armor DR for the armored kind, none of which the combat path reads | MWL `mimic`/`crystalMimic` rows plus shared depth row: HP `6+6d`, evasion `floor((4+d)/2) = 2+floor(d/2)`, revealed damage `[1+d, 2+2d]`, revealed accuracy `6+d`, armor `[0, 1+floor(d/2)]`, EXP 0, `demonic` flag - every one matching `adjustStats` and the revealed `damageRoll`/`attackSkill`/`drRoll` exactly | MWL `wraith` row holds only the level-0 constants (HP 1, EXP 0, `maxLvl -2`); `adjustStats` lives in `simulation/wraith.ts` (`wraithCombatStats`: accuracy `10+L`, evasion five times that, damage `[1+floor(L/2), 2+L]` - the integer division ordered before the +1 exactly as Java) and is applied by the scene spawner. Flags all present: `flying`, `undead`, `inorganic`, `never_sleeps` |
| **Function** (shared) | `rollHit`/`rollDamage`, generic sleeping wake, water-only pathing gates | `rollHit`/`rollDamage` with the flat stand-in line once awake | `rollHit`/`rollDamage` with the revealed line; loot through the shared `MOB_LOOT` roll plus the payload branch | `rollHit`/`rollDamage` with the spawner-applied line |
| **Method** (behavior keyed on `kind`) | `postAllyMonsterTurnOverrides` piranha entry (die on land, else fall through to the water-only mover); spawn gates refuse non-water cells; forced movement onto land kills | `postAllyMonsterTurnOverrides` statue entry, now shared with `armoredStatue` (fixed this pass - see below); damage path wakes both; debuff wake in the handler | death drops the held `mimicLoot` payload (bonus item, held gold, stolen item); crystal kind additionally gets reveal/steal/flee/escape methods | `spawnWraithAt`: passable-or-8-neighbour placement, stats applied, awake with `seesHero`, scheduled at delay 2 (Java's `SPAWN_DELAY`) |
| **State** (runtime and save) | `sleeping` starts true (Java's explicit `SLEEPING` falls out of the universal default) | `sleeping` doubles as PASSIVE; the `statue:` weapon/armor JSON payload rides `mimicLoot` through saves to the death-drop site | `mimicLoot` payload (bonus spec, held gold, held item) persisted; `mimicRevealed` persisted for the crystal kind | `wraithLevel` persisted; live stats ride the save, so no re-derivation is needed on restore |
| **Ability / hook** | surprise falls out of the shared sleeping/FOV model; the FishingSpear anti-piranha hook is live | weapon/armor kit generated at levelgen (`randomStatue`: melee weapon, armor for the armored kind, uncursed with a random enchantment - matching `createWeapon`) and dropped identified on death, matching `die()` | crystal kind: two hasted turns on reveal, first-attack backpack steal with Java's ten-retry invalid-entry shape, flee-while-seen plus destroy-unseen-at-distance-6 (Java's `nowhereToRun`) | CorpseDust spawns dust wraiths through the shared spawner with the quest power accounting |
| **Presentation** | piranha art + water-bound movement | statue art standing in the room; `port.log.statuedrops` on the equipment drop | `port.log.mimicreveals` for the crystal kind | wraith art; no spawn presentation (nothing spawns the base kind) |
| **Exceptions** | `baseSpeed = 2f` has no port model (same schema gap as Bat's); `Statistics.piranhasKilled`/`Badges.validatePiranhasKilled` have no counterpart (no piranha badge rows); the `surprisedBy` FOV/invisibility refinements ride the shared model | woken statues never chase (immobile adjacent-only attacks forever - Java HUNTINGs normally); weapon reach/delay/proc/enchantment and the Grim resistance are unmodeled; `desc_weapon` examine text and journal landmarks are absent | base mimic has no chest disguise and no NEUTRAL alignment: it spawns as a visible sleeping monster, so the hidden flat-damage/INFINITE-accuracy surprise, the `interact`-to-open reveal, and the reveal log/sound never fire for it (all present for the crystal kind); `MimicTooth` stealthiness and the Golden/Ebony variants are absent with the rest of that trinket/chest family | regular wraiths never spawn: no tomb heaps and no haunted-remains trigger exist, so the spawner serves only the CorpseDust quest kind; the haunted fallback (curse for half HP when placement fails) is absent with it |

## What this confirms about the target shape

The seventh matrix's conclusion survives a hostile family: variant inheritance stays data
(`armoredStatue` needed no new representation, only the two literal-kind checks the eighth
matrix fixed), single-kind state stays in keyed handlers (`takeStatueTurn` now serves both
statue kinds from one method), and depth scaling stays in MWL rows plus one spawn-time
function. The new shape this family adds is entry-into-play as the behavior: water gates,
payload-carried equipment, disguise state, tomb triggers. Where the port models the entry
(statue rooms with real weapon payloads, CorpseDust power), the mob works; where it does
not (tombs, chest disguise for the base mimic), the mob is absent or visibly wrong.

## Actual structural gaps and fixes

One real bug found and fixed in this pass (`dungeonScene.ts`, Java-citing comments at both
sites): the armored statue inherited nothing of the statue's passivity. Its kind missed both
the turn override (so it woke on sight via the generic sleeper path and then wandered and
fought as an ordinary mob) and the damage wake (so a struck-but-unseen armored statue slept
forever). It now shares `takeStatueTurn` with the base kind, both wake on any damage, and
both wake on a negative buff while asleep (Java's `Statue.add()` flip, previously unreachable
because the override returns before the generic sleeping branch).

Deliberately left open: the woken-statue chase (immobile-forever is the established
simplification, now stated on the method); weapon-driven statue combat (flat stand-ins stay,
with the weapon as loot only); the base mimic's chest disguise (needs a heap-actor
presentation neither mimic kind shares today); tomb/haunted wraith spawns (needs the heap
types); piranha/bat double speed (needs the schema column); the piranha kill badge.
Each is recorded here and in the `PORT_COVERAGE.md` rows touched by this pass rather than
silently kept.
