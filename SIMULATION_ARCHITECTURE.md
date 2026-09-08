# Simulation extraction

## Step 1 — turn loop and hunger

`src/simulation/` has no framework, browser, rendering, or persistence dependency.

- `turns.ts` defines the port's turn contracts. The loop initially extracted here now
  uses MWG's `advanceToInput` through `adapters/sceneSimulation.ts` (step 3 below).
  It still distinguishes input, an empty queue, game over, and the 1000-iteration limit.
- `hunger.ts` transforms a plain state snapshot without mutating its input and emits
  ordered hunger, starvation, damage, and death events. It preserves the current
  TypeScript port's timing and thresholds; it does not claim full Java timing parity.
- `adapters/sceneSimulation.ts` connects those modules to the mwg scheduler and live
  scene state. It commits hunger state before presenting events and only requests input
  when the turn loop returns `hero-input`.
- `SewersScene` supplies bindings for messages, damage visuals, death handling, and state.
  The bindings read current fields, including the `GameState` replaced by `loadRun()`.
  The scheduler instance must remain stable; `enterLevel()` currently clears/reuses it.

The dependency direction is scene → adapter → simulation. The simulation defines its
own contracts. Neither a `Creature` with a sprite nor the global `runState` enters the
hunger transition. Actor behaviour still comes through callbacks in the turn loop.

## Behaviour deliberately retained

This is a structural change, not a gameplay correction. Warning flags and starvation
ticks keep their previous lifecycle. The save schema is unchanged (it does not currently
serialize `starveTicks`). Monster actions still spend on the scheduler's current entry
after acting, even when an action removes an actor. The existing 1000-iteration guard
does not grant input when reached. `heroTurn.ts` now coordinates clocks, charges,
fire, buffs, and scheduler spending through scene callbacks, preserving death ordering.

## Step 2 — combat rolls and timed buffs

- `simulation/combatState.ts` owns the data needed by the formulas. `Creature` extends
  that contract with scene fields. The core never imports the sprite or monster catalogue.
- `simulation/combat.ts` owns hit/damage rolls, multipliers, and Goo/Brute live stats.
  Its callers explicitly supply a `SimulationRandom` from `simulation/random.ts`.
- `simulation/buffs.ts` owns durations, immutable application (with a `buff-applied`
  event indicating fresh vs refreshed), and immutable ticking with aggregate damage.
- `adapters/combatSimulation.ts` projects scene creatures into plain combat snapshots
  and commits buff transitions without replacing the existing scene buff-map object.
- `adapters/mwgRandom.ts` forwards each draw to the current mwg random stack. It does
  not seed a new generator or cache a generator that might be replaced by push/pop.
- `src/combat.ts` is a compatibility facade: existing scene imports still work and its
  announcement hook consumes fresh buff events after the state has been committed.
  `monsters.ts` re-exports `liveStats` for existing callers.

Only the formulas and buff transitions have moved. `SewersScene.attack()` still applies
HP changes, invisibility removal, Monk/Yog gates, subclass effects, drops, deaths, audio,
and visuals. The global announcement hook remains a presentation compatibility bridge.
The scene still owns actor identity and serialization.

The previous `tickBuffs` comment overstated damage: mwg `int(min,max)` excludes max,
so `int(1,3)` burns for 1-2 and `int(1,2)` poisons for 1. The extraction preserves those
calls, their key order, and damage on the final tick. Correcting the gameplay ranges
would be a separate change. No new Java-parity claim is made.

## Subsequent steps

1. Extract hero action effects and monster decisions behind the existing action and
   end-of-turn orchestration. Preserve free actions, paralysis, death, and stair transitions.
2. Move rendering objects into a view map keyed by actor ID. Feed rendering and audio
   through simulation events; replace the global buff announcement hook.
3. Introduce a versioned simulation snapshot and a save adapter, with migration checks.
   Address missing persisted state explicitly rather than changing old saves incidentally.

Each step should remain playable and independently reviewable.

## Step 3 - MWG runners and hero action dispatch

MWG now provides a separate `mwg/simulation` entry point with no browser or rendering
imports. `advanceToInput` owns bounded scheduling; `runScenario` runs a finite sequence
of commands with game-supplied state, random source, transition rules, and events. These
are independently implemented generic utilities in the MPL framework. No game rules,
assets, or SPD source were moved into MWG.

The scene adapter calls `advanceToInput`, translating generic outcomes to the existing
SPD contract. It explicitly returns cost 1 after monster actions, preserving this port's
current queue behaviour even when an actor removes itself. There is no second copy of
the scheduling loop in this project. Rebuild the local MWG package before building the
port so its `mwg/simulation` export is available through the existing linked dependency.

`simulation/heroActions.ts` now owns action classification and movement vectors.
`adapters/heroActions.ts` dispatches the resulting plans through live scene callbacks:
free actions, failed attempts, paralysis exceptions, and descending preserve their
previous order and turn costs. Unknown action names are explicitly rejected, including
Object-prototype names. Modal windows and game/input guards remain in `onAction`.

`tools/verifyHeroActions.mjs` exercises this dispatch headlessly, including a command
scenario driven by MWG over the actual action adapter and hunger transition. This is
not a full dungeon replay: scene-owned movement effects, inventory, AI, presentation,
and persistence have not all been extracted. The MWG dungeon example independently
uses the same scheduled runner and shares its own damage rule with headless tests.

## Step 4 - End-of-turn orchestration

`simulation/heroTurn.ts` owns the sequence previously embedded in `spendHeroTurn()`.
Its live effect ports advance the clock, hunger, wand and tome charges, fire, and buffs,
then spend the scheduled turn and run automatic actors. Scene callbacks still implement
those effects and presentation; this is not a fully headless hero turn yet.

The initial dead-hero guard and fatal-buff early return are preserved. Hunger or fire
death alone does not interrupt the remaining callbacks, matching the previous port.
The tests exercise ordinary ordering, an already-dead hero, fatal buffs, and the actual
hunger transition causing death followed by the next-turn guard. No Java behavior changes
are proposed by this structural extraction.

## Step 5 - Hero movement decisions

`simulation/movement.ts` selects movement outcomes using plain coordinates and lazy
world queries. No creature, sprite, level object, or framework import enters the module.
Waiting performs no queries; occupants precede closed doors, which precede roots and
terrain. The scene retains the occupant reference obtained during that synchronous
query and executes the selected effect. Successful moves still perform grass, pickup,
traps, and stairs in their original order, including the existing descent turn handling.

Regression checks cover all 24 occupancy/door/roots/passability combinations, query
short-circuiting, waiting, all eight directions, and coordinate independence. Monster
decisions and movement effect implementations remain scene-owned.

## Step 6 - local EntityId and an actor/item view registry

`SPD_ARCHITECTURE_TARGET_V3.md` records a broader target architecture (Command -> State +
Events, MWG-owned `EntityId`/`EntityRegistry`, full snapshots) that assumes MWG capabilities
this project's pinned `mwg@0.4.0` does not yet ship. The piece of that target which is *not*
blocked on an unreleased MWG feature, and is the direct continuation of steps 1-5's own
"Subsequent steps" item 2 ("move rendering objects into a view map keyed by actor ID"), is
done, in two parts:

- Step 6a: give every `Combatant`/`Creature`/`GroundItem` a stable, locally-generated
  `id: EntityId` (`simulation/entityId.ts` - a plain counter; nothing here depends on MWG
  owning identity). `baseCreature()` and `spawnGroundItem()` assign one automatically.
- Step 6b: `sprite: TintedSprite` no longer lives on `Creature`/`GroundItem` in `combat.ts`.
  The scene now owns a `private spriteFor = new Map<string, TintedSprite>()` plus a
  `sprite(entity: {id})` lookup helper; every constructor site registers into it
  (`makeHero`/`spawnMonster`/`spawnGroundItem`), and every removal site
  (`kill`/`escapeCrystalMimic`/the imp-quest departure/`pickupGroundItemAt`) deletes its entry
  - except the hero's own kill path, which deliberately keeps the mapping alive for the
  game-over screen's `!sprite(hero).destroyed` check. `ui/{badgeBanner,characterEffects,
  heroAnimation,titleFlame,waterSurface}.ts` needed no changes: they already take locally-typed
  `{sprite}` projections built by `main.ts`, not `Creature` directly. `this.projectiles`'
  own `{flight, sprite}` shape is unrelated and was left alone.

This is scene-internal (the pure `simulation/*` modules already only see `Combatant`, which
never had a `sprite` field - confirmed by grep, so this step never touched the
domain/simulation boundary). Verified: type check, `npm run build`, and two live browser
sessions - the first confirmed `hero.id`/`monster.id`/ground-item ids populate and ordinary
combat/log output is unaffected (Step 6a); the second, after Step 6b, spawned and killed a rat
through `scene['spawnMonster']`/`scene['attack']` and spawned/picked up a gold pile through
`scene['spawnGroundItem']`/`scene['pickupGroundItemAt']`, confirming `spriteFor` gains an
entry on spawn and loses it on death/pickup, with correct damage numbers, floor items, and log
text rendering throughout.

## Step 7 - first SimulationRuntime adoption (search)

`adapters/searchSimulation.ts` routes the pure `simulation/search.ts` decision
(`planSearch`, extracted alongside `movement.ts`) through MWG's
`simulation.SimulationRuntime` with `cost: null` - the rule never touches the scheduler,
so it runs on an inert local `Scheduler`/`Generator` pair rather than the scene's real
ones. The caller still owns the effect (discovery, tile restitching, log, guide progress),
the same "scene executes the selected effect" split as Step 5. Reconciling runtimes with
the scene's real scheduler/random waits for the first command with a real cost (plan
section 25: no big-bang).

## Step 8 - second SimulationRuntime adoption (hunger) + MWG EntityId type

- `adapters/hungerSimulation.ts` wraps the pure `advanceHunger` transition the same way
(cost `null`, inert local scheduler/random), and `SceneSimulationAdapter.hungerStep()`
now dispatches through `runHungerStep()` instead of calling `advanceHunger` directly -
same state committed, same events presented, only the dispatch path changed.
- `simulation/entityId.ts`'s `EntityId` is now MWG's own `core.EntityId` (re-exported),
plus a reverse `idOfEntity(entity)` lookup the plain counter never had. Minting stays
local and prefixed (`hero-N`/`item-N`): MWG's `EntityRegistry.add()` mints opaque `eN`
ids with no caller-chosen-id primitive, and the prefixed ids are persisted in saves -
full registry adoption needs that primitive upstream or a save migration first.

## Verification

Run `npm run check`, `npm run test:simulation`, and `npm run build`. The simulation checks
compile the actual modules using the installed TypeScript compiler into a temporary
directory and exercise them without a DOM. Scheduler integration uses the local mwg
source already required by this project. Also verify the built game in a browser:
ordinary movement/waiting, hunger warnings/damage/death, save/load, and entering a floor.

Step 1 verified on 2026-09-05 with mwg commit
`f8e0278c232956e4bdd79ab5db372a7247acbdb2`: type checking, 11 simulation checks,
and the production build passed. Playwright exercised the built game, including waiting,
hunger thresholds, save/load, a staged adjacent stair transition (no extra hero turn),
and fatal starvation through `onAction('wait')`. Class selection, gameplay, and defeat
screens were visually inspected. Console errors were limited to the missing favicon;
Vite reported its large-bundle warning. Chrome DevTools was unavailable due to an
already-running profile, so browser verification used Playwright instead.

Step 2 adds 72 combat and 5 buff reference scenarios captured from the working tree before
extraction in `tools/fixtures/combat-before-extraction.json`. `tools/verifyCombat.mjs`
compares results and final seeded mwg generator state through both core and adapter,
then checks draw ordering/bounds, immutable inputs, buff-map identity, announcements,
and the simulation import boundary. These are port regression fixtures, not Java
reference results; do not regenerate them from the extracted implementation.

Step 2 verification on 2026-09-05: all 21 checks and the production build passed.
The in-app browser exercised class selection, movement, secret-door discovery, and
melee combat, with misses, damage in both directions, health bars, and floating damage
visually confirmed. No console errors were reported in that test. Buff application,
refresh, expiry, announcements, and random-state equivalence were verified by the
automated suite; no dedicated burning/poison visual scenario was exercised in this pass.
Playwright's shared profile was occupied, so this pass used the in-app browser.

Step 3 verification on 2026-09-05: all 27 port simulation checks, type checking,
and the production build passed. MWG's 12 new simulation tests, type checking,
library build, and dungeon example build passed. Importing the built simulation
subpath and running a scenario in Node also passed without browser globals.
The full MWG suite reported 839 passes and one failure in the separately edited
`tests/button-skin.test.ts` label-stroke assertion. Those UI changes were left intact.
Visual verification of this step remains incomplete: the browser URL policy blocked
the local-file preview. Earlier visual checks above apply to their respective steps.
The simplification pass removed the duplicate scheduling loops from both consumers;
game effects and presentation remain behind explicit callbacks.

Step 4 verification on 2026-09-05: all 31 simulation checks, TypeScript checking,
and the production build passed. The build required access outside the filesystem
sandbox to load its configuration and linked dependencies. The existing large-bundle
warning remains. Review confirmed the old effect ordering and live scene reads are
preserved. Visual verification remains outstanding after the earlier browser policy
block; these automated results do not substitute for a gameplay check.

Step 5 verification on 2026-09-05: all 34 simulation checks passed. Type checking
and the production build passed after correcting the scene query binding to use its
actual nullable return type. The existing bundle-size warning remains. Review checked
the retained movement-effect order and lazy query boundaries. Visual gameplay
verification remains outstanding following the earlier browser policy block.
