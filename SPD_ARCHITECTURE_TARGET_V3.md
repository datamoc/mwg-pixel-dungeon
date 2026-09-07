# Target architecture (v3 refactoring plan) - reality-checked

Source: `MWG_Pixel_Dungeon_refactoring_plan_v3` (2026-09-07), supplied by the user as this
project's current architectural target. That document explicitly assumes "MWG's architectural
evolutions entirely available" - a 2D facade with no direct PixiJS dependency for the game, a
Command -> State + Events simulation runtime, EntityId/EntityRegistry, a SimulationContext
(RNG + scheduler), full state+scheduler+RNG snapshots, and a generic Semantic Messaging/
localization layer. This file records what of that is real today against the installed
`mwg@0.4.0` (`node_modules/mwg/dist`), so the plan's phases can be sequenced honestly instead
of assumed.

## What already exists in `mwg@0.4.0`

- `mwg/simulation`: `advanceToInput` (bounded turn scheduling) and `runScenario` (finite
  command sequences over game-supplied state/random/rules/events). This is *not* the plan's
  full Command -> State + Events runtime with EntityId/EntityRegistry/SimulationContext/
  snapshot - it is the turn-scheduling slice of it. `SIMULATION_ARCHITECTURE.md` already
  documents this project's adoption of it (steps 1-5).
- `mwg/two-d`: owns the Pixi `Application`/frame loop and a real set of 2D primitives
  (`TintedSprite`, `AnimatedSprite`, `SpriteSheet`, `Camera`, `TileMap`, `LayeredSprite`,
  `Projectile`, `ParticleEmitter`, `StatusVisuals`, `ActorAnimator`, plus the `ui/` widget
  library: `Window`, `ListView`, `Button`, `Bar`, `FloatingText`, `Toast`, `Tooltip`, etc.).
- `mwg/actors`, `mwg/world`, `mwg/i18n`, `mwg/battle`, `mwg/board`: generic stat/inventory/
  affix/loot/status-effect/shop/barrier primitives, a turn clock, and (per its own name) an
  i18n layer - not yet confirmed against the plan's specific "Semantic Messaging" shape
  (section 22C); needs its own comparison pass before section 22C/7b work starts.

## What the plan assumes but is NOT in `mwg@0.4.0` today

- No generic `EntityId`/`EntityRegistry` export anywhere in the package.
- No re-export of raw Pixi primitive types (`Container`, `Graphics`, `Rectangle`, `Texture`)
  through `mwg/two-d` - confirmed by grepping the package's `.d.ts` files. This is why 25
  files in `src/` still `import ... from 'pixi.js'` directly (`images.ts`, `main.ts`,
  `monsters.ts`, `scenes/*`, most of `ui/*`): the plan's section 3 ("remove direct PixiJS")
  is genuinely blocked on MWG shipping those wrapper types/primitives, not on effort in this
  repo. Removing pixi.js from `package.json` today would break the build.
- No full state+scheduler+RNG snapshot primitive (plan section 15) beyond what the existing
  scheduler/random adapters already checkpoint.
- No confirmed "Semantic Messaging" formatter/catalog/plural-select system matching section
  22C's shape (separate from `mwg/i18n`, which needs its own review).

## Consequence for sequencing

Phase 0's literal exit criterion ("`package.json` no longer depends directly on `pixi.js`")
cannot be met yet. The part of Phase 0 that *is* actionable now, and is the actual immediate
target, is its own weaker promise: "no *new* renderer leak" - i.e. don't add new direct
`pixi.js` imports in code that could instead use an `mwg/two-d` primitive, and default new
work to the same `presentation/scenes -> simulation/domain -> MWG` dependency direction the
plan describes (section 2), even before every file has been moved into that shape.

The parts of the plan that do NOT depend on an unreleased MWG capability, and are therefore
real, current work:

- Section 22A/22B's data/function/method analysis method, applied per family, as a prerequisite
  deliverable before migrating that family's code (independent of any MWG capability).
- Continuing `SIMULATION_ARCHITECTURE.md`'s own already-started extraction trajectory (turns,
  combat, buffs, hero actions, movement are steps 1-5; its own "Subsequent steps" section
  already named the next two moves before this plan arrived: extracting hero action *effects*
  and monster decisions from the scene's `attack()`/turn orchestration, and moving rendering
  objects into a view map keyed by actor ID). See `SIMULATION_ARCHITECTURE.md`'s "Step 6".
- Section 25's phased, no-big-bang migration principle - already this project's practice.
- The ADRs below, as a record of direction, most of which are aspirational/blocked rather
  than achieved.

## ADR status

| ADR | Decision | Status |
| --- | --- | --- |
| SPD-ADR-001 | `SpdSimulation` is the sole gameplay-mutation authority | Proposed; `main.ts`'s `attack()` et al. still mutate state directly and call presentation inline (see `SIMULATION_ARCHITECTURE.md`) |
| SPD-ADR-002 | Every runtime entity has a stable, renderer-free `EntityId` | Substantially adopted with a locally-owned id (`simulation/entityId.ts`, MWG has no `EntityId`/`EntityRegistry` yet): every `Creature`/`GroundItem` has one, and `sprite` moved off both interfaces into the scene's `spriteFor` registry (SIMULATION_ARCHITECTURE.md's "Step 6"). Still object-reference-identified elsewhere (`Map<Creature, Bar>` for health bars, `Set<Creature>` for king adds) - not yet migrated to id-keyed lookups |
| SPD-ADR-003 | The MWG scheduler is the sole time authority | Partially adopted: `advanceToInput` drives scheduling (step 3), but monster turns still hardcode `return 1` rather than a real per-action time cost (plan section 6) |
| SPD-ADR-004 | Scenes contain no business rules; they translate input and events | Not yet; `main.ts` (~7460 lines) still holds most combat/AI/effect logic |
| SPD-ADR-005 | GameEvents are the ordered output of simulation transactions | Partially: `buffs.ts` already emits `buff-applied`/tick events; `attack()` does not |
| SPD-ADR-006 | Save is a full simulation+scheduler+RNG snapshot | Not yet; no versioned snapshot primitive exists locally or in MWG |
| SPD-ADR-007 | The game never imports PixiJS in normal use | Blocked on MWG shipping 2D primitive wrapper types (see above) |
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
