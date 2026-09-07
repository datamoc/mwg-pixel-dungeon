# Monster family analysis: Rat / Snake / Crab / Goo

Required deliverable per `SPD_ARCHITECTURE_TARGET_V3.md` section 22A/22B.4 (SPD-ADR-010): before
any class-level monster refactor, produce the data/function/method matrix for a family and let
the matrix - not a Java-class transposition - decide the representation. This is the first such
matrix for this project; Rat/Snake/Crab/Goo were the plan's own worked example (its section
22A.1). Everything below cites the actual current code (`src/monsters.ts`, `src/main.ts`), not
Java source, since the question here is what this port's *existing* TypeScript already looks
like against the target shape - not a fresh port of the Java classes.

## The matrix

| Axis | Rat | Snake | Crab | Goo |
| --- | --- | --- | --- | --- |
| **Data** | `hp:8 accuracy:8 evasion:2 damage:[1,4] armor:[0,1] frame:[16,15] idle:0 exp:1 maxLvl:5` (`monsters.ts:114`) | `hp:4 accuracy:10 evasion:25 damage:[1,4] armor:[0,0] frame:[12,11] idle:0 exp:2 maxLvl:7` (`monsters.ts:115`) | `hp:15 accuracy:12 evasion:5 damage:[1,7] armor:[0,4] frame:[16,16] idle:0 exp:4 maxLvl:9` (`monsters.ts:118`) | `hp:100 accuracy:10 evasion:8 damage:[1,8] armor:[0,2] frame:[20,14] idle:2 exp:10 maxLvl:29` (`monsters.ts:120`), plus one runtime field: `pumped?: number` (`combat.ts`) |
| **Function** (pure formulas, shared) | `rollHit`/`rollDamage` (`simulation/combat.ts`), `Roguelike.decideMonsterAI` (MWG) for movement/targeting | same | same | same, for its ordinary (non-pumped) attack |
| **Method** (behavior keyed on `kind`, today all living in one function, `takeMonsterTurn`, `main.ts:4693`) | **None.** No `if (monster.kind === 'rat')` branch exists anywhere in `takeMonsterTurn` or its helpers - confirmed by grep. Rat falls through every special-case check to the generic adjacency attack (`main.ts:4787`, `else this.attack(monster, this.hero)`) and the generic mover (`Roguelike.decideMonsterAI`, `main.ts:4973`). | **None**, same as Rat - no `kind === 'snake'` branch anywhere. | **None** for the base Crab - no `kind === 'crab'` branch. (`greatCrab`, a *different* `MonsterId`/`AnyMonsterId`, does have one: `main.ts:4946`'s "only really advances every 3rd turn" - that is a distinct entry in `MONSTERS`/`AnyMonsterId`, not this row.) | **One real branch**: `if (monster.kind === 'goo') this.takeGooTurn(monster)` (`main.ts:4778`), dispatching to a dedicated 25-line method (`takeGooTurn`, `main.ts:5335`). |
| **State** (runtime, must be snapshotable) | `hp`, `position`, `buffs`, `sleeping`, `seesHero` - the `ActorState` core, nothing extra | same as Rat | same as Rat | same as Rat **plus** `pumped: 0\|1\|2`, already a field on `Creature` and already carried through save/restore (`captureActiveFloor`/`restore`, `main.ts`) |
| **Ability/hook** | none | none | none | **pump-up charge**: a 3-state cycle (`takeGooTurn`) - roll to start charging (probability doubles below half HP), a guaranteed second charge turn, then a slam at 3x damage/2x accuracy. Self-contained: reads/writes only `goo.pumped`/`goo.hp`/`goo.maxHp`, calls the ordinary `this.attack` with adjusted stats for the slam turn (`main.ts:5342`) |
| **Presentation** | `spriteKey` = `frame`/`idle` above, feeding `SpriteSheet.fromTexture`/`AnimatedSprite` in `spawnMonster` (`main.ts:1430-1447`); `MOB_KEYS`/i18n text key | same shape | same shape | same shape, plus two extra log lines (`port.log.goopump`, `port.log.goopumpmore`, `port.log.gooslam`) that are pure presentation of the ability's state transitions |
| **Exceptions** (real code unique to this monster today) | none | none | none (base Crab; `greatCrab` is a separate `kind` with its own one-liner) | `takeGooTurn`, `pumped` field, three log message keys |

## What this confirms about the current code, versus what the plan warns against

The plan's own worked example (section 22A.1) frames this family as a test case for "did we
just transpose Java classes." **This port never did that here**: there is no `Rat`/`Snake`/
`Crab`/`Goo` TypeScript class, no per-monster subclass hierarchy, and no per-monster method to
override at all for three of the four - `Creature` (`combat.ts`) is already the single flat
type the plan's section 22B asks for, and Rat/Snake/Crab are already pure data rows against
shared functions, exactly the "seule des valeurs changent -> définition data-driven" row of the
plan's own decision table (section 22A.2). Goo is already the same shape *plus* one genuine,
self-contained ability method - the "même cycle de vie, hooks différents -> composants/
abilities/modifiers" row, not a justification for a dedicated class.

## The actual gap (not what the plan assumed, but real)

`takeMonsterTurn` (`main.ts:4693`-~`5050`) is one ~360-line function containing every special
case for every monster kind in the game (Goo's pump-up, DM200's vent, Spinner's web, Guard's
chain, the Trickster's ranged combo, and ~15 more), each gated by `if (monster.kind === '...')`.
Rat/Snake/Crab cost nothing here (they simply match none of the branches), but the function
itself is exactly the plan's "Une méthode ne fait que dispatcher selon un type" row (section
22A.2), whose prescribed target is "Table de stratégie / registry / discriminated union" - not
a rewrite of Rat/Snake/Crab/Goo's *data*, which is already right, but eventually replacing this
one large dispatch function with a per-`kind` ability table (`Record<AnyMonsterId,
MonsterAbility | undefined>`, called once per turn instead of walked as an if-chain) so that
adding an ordinary new monster (data-only, like Rat) truly requires zero new code in
`takeMonsterTurn`, and a monster with a real ability (like Goo) registers one function instead
of extending an ever-growing chain other monsters must be read past to reach their own branch.

## Recommendation

- **No refactor needed for Rat/Snake/Crab's data or turn logic** - they already satisfy
  SPD-ADR-011's target shape today.
- **Goo's `takeGooTurn` is a reasonable ability-shaped function already** - it does not need to
  become a class, and nothing here argues for one.
- **The real, deferred piece of work** is structural, not per-monster: replacing
  `takeMonsterTurn`'s if-chain with an ability/strategy lookup keyed by `kind`, so each
  monster's special behavior (where one exists) is one registered function instead of one more
  branch in a shared 360-line method. This is a `main.ts` decomposition task in the same family
  as the `attack()` extraction already scoped in `ROADMAP.md`'s section 11, not a monster-by-
  monster migration - doing it once benefits every monster in the roster, ordinary and special
  alike, and should be sequenced as its own reviewed, build-and-browser-verified step rather
  than folded into unrelated work (plan section 25's no-big-bang principle).
