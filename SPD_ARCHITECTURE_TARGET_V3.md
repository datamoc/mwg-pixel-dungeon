# Target architecture (v3 refactoring plan) - reality-checked

Source: `MWG_Pixel_Dungeon_refactoring_plan_v3` (2026-09-07), supplied by the user as this
project's current architectural target. That document explicitly assumes "MWG's architectural
evolutions entirely available" - a 2D facade with no direct PixiJS dependency for the game, a
Command -> State + Events simulation runtime, EntityId/EntityRegistry, a SimulationContext
(RNG + scheduler), full state+scheduler+RNG snapshots, and a generic Semantic Messaging/
localization layer. This file records what of that is real against the installed `mwg`
version (`node_modules/mwg/dist`), so the plan's phases can be sequenced honestly instead of
assumed. **Updated 2026-09-07, same day**: `mw_games@0.4.1` published mid-session (the pin in
`package.json` was bumped and the full verification suite re-run per `CLAUDE.md`'s "`mwg`
dependency" section) and turned out to ship most of the plan's previously-assumed core
primitives for real - see below.

## What exists in `mwg@0.4.1` (the pinned version)

- **`core.EntityRegistry`/`EntityId`** (new in 0.4.1, `core/Entity.ts`): exactly the plan's
  assumed identity primitive - `add(entity): EntityId`, `get(id)`, `idOf(entity)`, `has`,
  `remove`. Deliberately not an ECS; a game still owns its own entity type. This project's own
  `simulation/entityId.ts` (Step 6a/6b, landed earlier this session) is a narrower, local
  stand-in for exactly this - adopting the real one is now unblocked and is the natural next
  step, but is a separate migration (replacing a plain string counter with a registry that also
  holds reverse lookup) from anything landed so far.
- **`simulation.SimulationRuntime`** (new in 0.4.1, `simulation/Runtime.ts`): the plan's actual
  Command -> State + Events runtime. `SimulationContext<A>` bundles `random`+`scheduler`
  exactly as the plan describes; `dispatch(command)` runs one `SimulationRuntimeRule` and
  returns a `SimulationOutcome` (`state`, `events`, `status`, `cost`), charging `cost` to the
  scheduler's current actor automatically; `snapshot()`/`static restore()` round-trip
  `{version, state, scheduler, random}` as one `SimulationSnapshot` - the plan's section 15
  target precisely. This coexists with (does not replace) `advanceToInput`/`runScenario`,
  already adopted in steps 1-5 - a game composes both against the same `scheduler`.
- **`core.PresentationQueue`** (new in 0.4.1, `core/Presentation.ts`): plays a queue of
  simulation events one at a time at their own pace, generic over the event type and free of
  any renderer - the plan's section 16 "presentation driven by events" target. Directly usable
  as the `EventPresenter` the plan's architecture diagram names, once `attack()` and friends
  emit real events instead of calling presentation inline.
- `mwg/simulation`'s pre-existing `advanceToInput`/`runScenario` (steps 1-5, unchanged).
- `mwg/two-d`: owns the Pixi `Application`/frame loop and a real set of 2D primitives
  (`TintedSprite`, `AnimatedSprite`, `SpriteSheet`, `Camera`, `TileMap`, `LayeredSprite`,
  `Projectile`, `ParticleEmitter`, `StatusVisuals`, `ActorAnimator`, plus the `ui/` widget
  library: `Window`, `ListView`, `Button`, `Bar`, `FloatingText`, `Toast`, `Tooltip`, etc.) -
  unchanged in 0.4.1 as far as this review went.
- `mwg/actors`, `mwg/world`, `mwg/i18n`, `mwg/battle`, `mwg/board`: generic stat/inventory/
  affix/loot/status-effect/shop/barrier primitives, a turn clock, and (per its own name) an
  i18n layer - not yet confirmed against the plan's specific "Semantic Messaging" shape
  (section 22C); needs its own comparison pass before section 22C/7b work starts, and was not
  re-diffed against 0.4.0 in this pass (out of scope for the version-bump review).

## What the plan assumes but is still NOT in `mwg@0.4.1`

- No re-export of raw Pixi primitive types (`Container`, `Graphics`, `Rectangle`, `Texture`)
  through `mwg/two-d` - confirmed by grepping the package's `.d.ts` files (not specifically
  re-checked for 0.4.1, but `two-d`'s exports were otherwise unchanged). This is why 25 files
  in `src/` still `import ... from 'pixi.js'` directly (`images.ts`, `main.ts`, `monsters.ts`,
  `scenes/*`, most of `ui/*`): the plan's section 3 ("remove direct PixiJS") is genuinely
  blocked on MWG shipping those wrapper types/primitives, not on effort in this repo. Removing
  pixi.js from `package.json` today would break the build.
- No confirmed "Semantic Messaging" formatter/catalog/plural-select system matching section
  22C's shape (separate from `mwg/i18n`, which still needs its own review).

## Consequence for sequencing

Phase 0's literal exit criterion ("`package.json` no longer depends directly on `pixi.js`")
still cannot be met. The part of Phase 0 that *is* actionable now, and is the actual immediate
target, is its own weaker promise: "no *new* renderer leak" - i.e. don't add new direct
`pixi.js` imports in code that could instead use an `mwg/two-d` primitive, and default new
work to the same `presentation/scenes -> simulation/domain -> MWG` dependency direction the
plan describes (section 2), even before every file has been moved into that shape.

What changed materially with 0.4.1: Phases 0's P0 items "Créer `SpdSimulation`" and "Remplacer
le tour simplifié" (real time cost) - previously blocked on an unreleased runtime - are now
directly buildable on `simulation.SimulationRuntime`. This is the single biggest unblock since
this document was first written and should be the next real code phase (see `ROADMAP.md`
section 11): wrap the existing per-domain rule functions (`simulation/combat.ts`,
`movement.ts`, `heroActions.ts`, `heroTurn.ts`) behind one `SimulationRuntime<SpdGameState,
SpdCommand, SpdEvent, Creature>`, replacing `main.ts`'s direct-mutation `attack()`/`moveTo()`/
etc. one command type at a time (no big-bang - plan section 25) rather than assuming the whole
`main.ts` surface converts at once.

The parts of the plan that do NOT depend on any MWG capability, released or not, and are
therefore real, current work regardless of version:

- Section 22A/22B's data/function/method analysis method, applied per family, as a prerequisite
  deliverable before migrating that family's code. Done once so far - see
  `MONSTER_ANALYSIS_RAT_SNAKE_CRAB_GOO.md`.
- Section 25's phased, no-big-bang migration principle - already this project's practice.
- The ADRs below, as a record of direction - several flipped from blocked to actionable-but-
  not-yet-adopted with 0.4.1; none is fully adopted yet.

## ADR status

| ADR | Decision | Status |
| --- | --- | --- |
| SPD-ADR-001 | `SpdSimulation` is the sole gameplay-mutation authority | Unblocked, not yet adopted: `simulation.SimulationRuntime` (0.4.1) is exactly this facade; `main.ts`'s `attack()` et al. still mutate state directly and call presentation inline (see `SIMULATION_ARCHITECTURE.md`) |
| SPD-ADR-002 | Every runtime entity has a stable, renderer-free `EntityId` | Substantially adopted with a locally-owned id (`simulation/entityId.ts`): every `Creature`/`GroundItem` has one, and `sprite` moved off both interfaces into the scene's `spriteFor` registry (SIMULATION_ARCHITECTURE.md's "Step 6"). MWG's own `core.EntityRegistry`/`EntityId` (0.4.1) is now available to replace the local stand-in - not yet done. Still object-reference-identified elsewhere (`Map<Creature, Bar>` for health bars, `Set<Creature>` for king adds) - not yet migrated to id-keyed lookups either way |
| SPD-ADR-003 | The MWG scheduler is the sole time authority | Partially adopted: `advanceToInput` drives scheduling (step 3), but monster turns still hardcode `return 1` rather than a real per-action time cost (plan section 6). `SimulationRuntime.dispatch`'s `cost` field (0.4.1) is the real mechanism once actions route through it |
| SPD-ADR-004 | Scenes contain no business rules; they translate input and events | Not yet; `main.ts` (~7460 lines) still holds most combat/AI/effect logic |
| SPD-ADR-005 | GameEvents are the ordered output of simulation transactions | Partially: `buffs.ts` already emits `buff-applied`/tick events; `attack()` does not. `core.PresentationQueue` (0.4.1) is the consumer-side primitive this needs, once real events exist to feed it |
| SPD-ADR-006 | Save is a full simulation+scheduler+RNG snapshot | Unblocked, not yet adopted: `simulation.SimulationRuntime`'s `snapshot()`/`SimulationSnapshot` (0.4.1) is exactly `{version, state, scheduler, random}`; no game code builds on it yet |
| SPD-ADR-007 | The game never imports PixiJS in normal use | Blocked on MWG shipping 2D primitive wrapper types (see above) - unaffected by 0.4.1 |
| SPD-ADR-008 | Static definitions are separated from runtime instances | Partially: `monsters.ts`/`spdItems/*` already separate catalogue from state in places; not systematic |
| SPD-ADR-009 | Combat is Actor<->Actor, not Hero<->Monster-specialized | Not yet; `ROADMAP.md` section 5 already tracks "Implement ally-vs-monster combat" as an open, real gap for the same reason |
| SPD-ADR-010 | Business families are refactored only after a data/function/method analysis; inheritance is never the default | Adopted as a going-forward rule for this plan; no family has had the full matrix produced yet |
| SPD-ADR-011 | Actors/monsters/allies/summons/bosses share one Actor model; variation is composition + data | Not yet; current `Creature` is a single flat interface, closer in spirit to this than a Java-style hierarchy, but no `ActorDefinition`/`abilities` split exists |
| SPD-ADR-012 | Semantic messaging/localization belongs to MWG; SPD owns only its taxonomy/catalogs/lexical data | Not evaluated yet; needs a comparison pass between `mwg/i18n` and the plan's section 22C shape before adoption |

## Non-goals reaffirmed from the plan (section 28)

Kept here because they're easy to violate piecemeal during a long migration: no Java-class-
for-TypeScript-class transposition, no game-local ECS now that MWG owns identity concerns
once it ships them, no second scheduler/time model, no big-bang rewrite (phase strictly by
playable vertical slice per `SIMULATION_ARCHITECTURE.md`'s own step discipline), and no
SPD-specific rule ever pushed into MWG to make the port easier locally.
