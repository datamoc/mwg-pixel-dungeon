# Monster family analysis: Gnoll / Brute / ArmoredBrute / Shaman / GnollTrickster

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4 (SPD-ADR-010): before
any class-level monster refactor, produce the data/function/method matrix for a family and let
the matrix - not a Java-class transposition - decide the representation. This is the third such
matrix (after Rat/Snake/Crab/Goo and DM200/DM300/Pylon). Everything below cites the actual
current code (`src/content/monsters.mwl` for stats, `src/scenes/dungeonScene.ts` and
`src/simulation/combat.ts` for behavior) and tag `v3.3.8` of the Java source for the
comparison - the Java reads in this pass were `Gnoll.java`, `Shaman.java`
(`Red/Blue/PurpleShaman`), `GnollTrickster.java` and `GnollSapper.java` (for the absence
note); Brute/ArmoredBrute numbers are taken from `PORT_COVERAGE.md`'s Brute row, which
audited `Brute.java`/`ArmoredBrute.java` line-for-line in an earlier pass.

`GnollSapper` (Java: `HT 45`, `defenseSkill 15`, `EXP 10`, custom `Hunting`/`Wandering`
subclasses) is not a column: it has no `MonsterId`, no MWL row and no spawn site here
(`src/monsters.ts` names it as simply absent, alongside `CrystalGuardian` and
`FungalSentry`). It stays a documented gap, not a silent one.

## The matrix

| Axis | Gnoll | Brute | ArmoredBrute | Shaman | GnollTrickster |
| --- | --- | --- | --- | --- | --- |
| **Data** | `hp:12 accuracy:10 evasion:4 damage:[1,6] armor:[0,2] exp:2 maxLvl:8` (`monsters.mwl:34-46`), loot `gold` 0.5 (`monsters.ts:373`) | `hp:40 accuracy:20 evasion:15 damage:[5,25] armor:[0,8] exp:8 maxLvl:16` (`monsters.mwl:346-359`), loot `gold` 0.5 (`monsters.ts:390`) | `hp:40 accuracy:20 evasion:15 damage:[5,25] armor:[4,12] exp:8 maxLvl:16` (`monsters.mwl:835-848`), loot `armor` 1.0 (`monsters.ts:381`) | `hp:35 accuracy:18 evasion:15 damage:[5,10] armor:[0,6] exp:8 maxLvl:16` (`monsters.mwl:361-373`), loot `wand` 0.03 + `(1/3)^n` decay (`monsters.ts:391`) | `hp:20 accuracy:16 evasion:5 damage:[1,6] armor:[0,2] exp:5 maxLvl:8` (`monsters.mwl:301-313`), loot `stone` 1.0 (`monsters.ts:398-399`), ghost-quest spawn (`dungeonScene.ts:3979`) |
| **Java data** | `HT 12`, `defenseSkill 4`, `EXP 2`, `maxLvl 8`, `loot Gold 0.5`, `drRoll +0-2` | `HT 40`, enrage shield `HT/2+4`, raged damage 15-40 (per the Brute row's audit) | `HT/2+1` shield, 1 point every 3rd turn, `drRoll +4` (per the Brute row's audit) | `HT 35`, `defenseSkill 15`, `EXP 8`, `maxLvl 16`, three `Red/Blue/PurpleShaman` subclasses, zap `Normal(6,15)` (per the Shaman rows' audits) | `HT 20`, `defenseSkill 5`, `EXP 5`, ranged-only via `Ballistica.PROJECTILE`, `effect = Random.Int(4) + combo` |
| **Function** (pure formulas, shared) | `rollHit`/`rollDamage` (`simulation/combat.ts`), `Roguelike.decideMonsterAI` (MWG) for movement/targeting | same, plus the raged damage branch in `liveStats`/`combat.ts:95` (shared with ArmoredBrute) | same as Brute (inherits `damageRoll` unchanged in Java; the port's raged branch covers both kinds) | same, plus `selectRangedTarget` (`simulation/targeting.ts`) and `zapHero` for the bolt | same |
| **Method** (behavior keyed on `kind`) | **None.** No `kind === 'gnoll'` branch exists anywhere (verified by grep, excluding `gnollTrickster`) - Gnoll falls through to the generic adjacency attack and the generic mover, exactly Rat's shape. | Three sites, all shared with ArmoredBrute by explicit kind-OR: death-interception in `attack()` (`dungeonScene.ts:13153`), rage decay in `takeMonsterTurn` (`dungeonScene.ts:9057`), damage boost (`combat.ts:95`). | Same three sites (OR'd with Brute), plus its own decay counter gate (`dungeonScene.ts:9067`). | `mobOnHit` debuff branch (`dungeonScene.ts:10250`: 1-in-2 Weakness/Vulnerable/Hex by `shamanType`), subtype drawn at spawn (`monsterSpawn.ts:129`), zap damage via the shared `zapHero` path. | Ranged kiting (`dungeonScene.ts:9280` `stepAway`), combo resets on move (`dungeonScene.ts:9989`, `:10589`) and on being hit (`:12816`), effect roll (`:13864`). |
| **State** (runtime, must be snapshotable) | `hp`, position, buffs, `sleeping`, `seesHero` - the `ActorState` core, nothing extra | same core **plus** `raged`/`hasRaged` (persisted through floor save/load, per the Brute row) | same as Brute **plus** `armoredRageTicks` (persisted, gating the every-3rd-turn decay) | same core **plus** `shamanType` (drawn once at spawn) | same core **plus** `combo` (default 0 at `dungeonScene.ts:2419`; Java persists it under the `COMBO` bundle key and resets it on move - the port ports the reset, all three sites above) |
| **Ability/hook** | none | **Enrage**: one-time near-death revival at `round(maxHp/2+4)`, 15-40 damage while raged, flat -4/turn decay. Reads/writes only its own three fields plus `hp`. | **Enrage (slower)**: same shape at `round(maxHp/2+1)` with the every-3rd-turn tick - a parameter variation of Brute's, not a second mechanic. | **Debuff zap**: a 1-in-2 rider on the landed bolt, keyed off the spawn-drawn subtype. | **Combo strike**: `Int(4)+combo` effect roll (ignite at 6+, poison above 2), combo reset on any move. |
| **Presentation** | `gnoll.png` sprite, `MOB_KEYS`/i18n text key | `brute.png`, same shape | `brute.png` (shared sheet with Brute), same shape | `shaman.png`, same shape (dedicated colour sprites and debuff audio unported, per the Shaman row) | `gnoll.png:21` (`monsters.ts:308`), same shape |
| **Exceptions** (real code unique to this monster today) | none | `raged`/`hasRaged` fields, two of the three kind-OR sites, `liveStats` branch | `armoredRageTicks`, the third kind-OR arm, the `[4,12]` armor row | `shamanType` field + spawn draw, `mobOnHit` debuff branch | `combo` field, three reset sites, effect-roll branch, ghost-spawn wiring |

## What this confirms about the current code, versus what the plan warns against

**This family is the variant-inheritance case the first two matrices did not cover, and the
port handles it without classes - but by hand, at every site.** Java says `class ArmoredBrute
extends Brute` once, and every Brute mechanic follows. This port says `(defender.kind ===
'brute' || defender.kind === 'armoredBrute')` at three sites (plus `combat.ts:95`), and the
history shows the failure mode is real: the ArmoredBrute shipped for a full pass with *none*
of the enrage mechanic because two sites tested the literal base kind - the exact bug class
the "Port rare monster variants" item was created to hunt. The OR-chain works today, and the
`code-quality` note in `ROADMAP.md` section 11 already prescribes the general fix (a shared
structural property over an OR-chain); for this family that property is Java's own
inheritance edge, i.e. a `baseKind`/family alias: Brute-plus-ArmoredBrute is one mechanic
with two parameter rows (`+4`/every-turn vs `+1`/every-3rd-turn, `[0,8]` vs `[4,12]` armor).

Gnoll itself is the second Rat: zero branches, pure data, exactly the plan's "seule des
valeurs changent" row. Shaman is the subtype-draw shape (one MWL row + a spawn-time variant
field + a behavior branch keyed off it - compare `DM201`'s alias treatment in the second
matrix: different mechanism, same lesson that variant identity must live in data, not in
branch conditions). GnollTrickster is the quest-miniboss shape (data row + ghost-spawn wiring
+ one ability branch + one counter), closest to Goo's pump-up in matrix one.

## Recommendation

- **No refactor needed for Gnoll/Shaman/Trickster data or turn logic** - same verdict as
matrices one and two for their median members.
- **The deferred structural piece from matrix one gains a second exhibit**: replace the
per-site kind-ORs with a family/alias lookup. Brute/ArmoredBrute is the smallest possible
pilot (three sites, one shared mechanic, two parameter rows) for the per-`kind` ability
table matrix one already recommends - smaller and safer than starting with Goo or the
DM200 vent.
- **Gaps this matrix newly records (no code changed this pass):** `GnollSapper` absent
(no id, no row, no spawn - needs its bombing behavior spec'd from `GnollSapper.java`
before it can even be a data row); Trickster `combo` save/load coverage was not
re-verified in this pass (Java persists it; the port's field exists and resets
correctly); Shaman zap damage numbers rest on the existing row's audit, not re-derived
here.
