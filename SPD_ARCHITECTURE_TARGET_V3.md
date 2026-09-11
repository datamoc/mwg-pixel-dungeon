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

## What exists in `mwg@0.5.0` (the pinned version; reviewed at 0.4.1, re-checked at 0.4.2 and 0.5.0)

- **`core.EntityRegistry`/`EntityId`** (new in 0.4.1, `core/Entity.ts`): exactly the plan's
  assumed identity primitive - `add(entity): EntityId`, `get(id)`, `idOf(entity)`, `has`,
  `remove`. Deliberately not an ECS; a game still owns its own entity type. This project's own
   `simulation/entityId.ts` (Step 6a/6b, landed earlier this session) was a narrower, local
   stand-in for exactly this - the `EntityId` type half is now adopted (Step 8 re-exports
   MWG's own type plus a reverse lookup); the `EntityRegistry.add()` minting half is
   deliberately deferred (opaque `eN` ids vs save-persisted prefixed ids - see Step 8).
- **`core.ReactionTable`/`ReactionRule`** (new in 0.5.0, `core/Reactions.ts`, re-exported
  from `mwg` root): declarative edge-triggered rules over any state shape (`when` predicate
  + `action`, `check()` returning fired ids, `once` retirement, `toJSON`/`fromJSON` with
  caller-supplied rules). Evaluated against every latch/transition site in `main.ts`
  (shopkeeper warn-then-flee, `yogFistWarned`, `kingLostYell`, Brute `hasRaged`, Tengu/King/
  Yog/DM300 phase gates, ability cooldowns): the verdict is to ADOPT IT AS A MECHANISM BUT
  NOT RETROFIT - every current site is already a minimal single boolean/inline check, and a
  table costs net lines plus save plumbing there (`fromJSON` needs the rules re-supplied at
  every load site), the exact speculative-scaffolding shape this repo deletes on sight.
  Its designated home is the v3 event-driven presentation phase (plan section 16):
  `check()`'s fired-id lists are the natural edge-event source once `attack()` and friends
  emit real events instead of calling presentation inline - at which point per-domain rule
  tables replace today's inline phase checks as they're extracted, one command at a time,
  under the "no big-bang" rule (plan section 25), not as a drive-by rewrite of working code.
- **`core.EntityRegistry`** (0.5.0): still `add`/`get`/`idOf`/`has`/`remove` only - no
  caller-chosen-id primitive, so upstream proposal P1 below stays open and the local
  counter stays.
- **`two-d/render` `Types2D.ts`** (0.5.0): still type aliases only - upstream proposal P2
  stays open and Phase 0's exit criterion stays blocked.
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
- `mwg/actors`, `mwg/world`, `mwg/battle`, `mwg/board`: generic stat/inventory/
  affix/loot/status-effect/shop/barrier primitives and a turn clock.
- **`mwg/i18n` IS the plan's section 22C "Semantic Messaging" shape** (compared this pass
  against the installed 0.4.2 `.d.ts` files - whether it landed in 0.4.1 or 0.4.2 is
  unconfirmed, the 0.4.1 review never enumerated these files either way): `SemanticMessage`
  (`{type, params}`) + `MessageChannel` (`log`/`compact`/`accessibility`/`debug`) +
  `MessageFormatter` + `createCatalogFormatter()` (looks up `${type}.${channel}`, falls back
  to `${type}`, formats through the same catalog) is exactly "one simulation event, several
  presentations"; `EntityTextResolver` + `GrammaticalEntity` (gender/plural/proper-noun/forms)
  is the game-owns-vocabulary contract (it would retire this port's ad-hoc `{who}` agreement
  problem - see ROADMAP.md section 8's French subject-first restructuring); the catalog layer
  has CLDR plural selection (`Intl.PluralRules`, `PluralForms`), `{token}` interpolation,
  FTL parsing, locale typography, and `Validate`/`Content` audit tools. The mechanism half is
  *already adopted* (`src/i18n/index.ts` builds on `I18n.t`/`Catalog`/`setBase`/`setActive`);
  what adoption still means is the message half: emitting typed messages at event sites
  (`say()` call sites) and owning this port's taxonomy/catalogs, per SPD-ADR-012 - a phased
  migration, not a switch (pilot candidate: combat damage log lines, the highest-volume
  `say()` family).
- **`mwg/two-d/render` now ships renderer-free 2D type aliases** (`Types2D.ts`: `Container2D`/
  `Texture2D` as names for the pixi types, a plain `Rect`, `TextureRegion`, `rectOf()`; plus
  `Shape2D.ts`'s `Node2D`/`Shape2D`/`Text2D`/`TiledSprite`/`Gradient`): the `.d.ts` files import
  pixi types via `import type` only, so game code can now *name* container/texture types via
  `import type ... from 'mwg/two-d/render'` without importing `pixi.js` itself. Value
  positions (constructing containers/graphics/sprites) still need pixi directly - so the
  plan's section 3 exit criterion stays blocked, but a new slice is unblocked: converting the
  *type-only* `pixi.js` imports across `src/` (of the 25 files importing it, whichever use it
  for types alone) to the mwg aliases. Not started; listed as the next Phase-0 slice.

## What the plan assumes but is still NOT in `mwg@0.5.0`

- No *value-level* Pixi primitive re-exports through `mwg/two-d` (constructing a `Container`/
  `Graphics`/`Sprite` still means `import ... from 'pixi.js'`): the plan's section 3 exit
  criterion ("`package.json` no longer depends directly on `pixi.js`") still cannot be met,
  and removing pixi.js from `package.json` today would still break the build. What changed is
  that *type* positions are now convertible (see `Types2D.ts` above) - the remaining block is
  narrower than "no primitive story at all".

## Upstream proposals (game-agnostic; for MWG's own repo, not this one)

The licensing boundary holds: nothing SPD-specific below, only generic capabilities this
port (or any game on the framework) needs, with the data that justifies each. Proposed to
the framework maintainer; implemented upstream or not at all - never here.

- **P1: caller-chosen ids for `core.EntityRegistry`** (unblocks SPD-ADR-002's deferred half).
  `add()` mints opaque `eN` ids, so a game whose ids are persisted/prefixed (saves, network
  play, debug tooling that names entities) cannot route minting through the registry and gets
  no unified reverse lookup. Proposal: `register(id: EntityId, entity: T): void` (reject on
  collision), with `get`/`idOf`/`has`/`remove` behaving identically for registered and added
  entities. No shape imposed on `T`, same as today. **Landed in 0.7.2** as
  `EntityRegistry.add(entity, requestedId?)`. This port's `simulation/entityId.ts` cannot adopt it
  in place: that module sits inside the framework-free `simulation/` boundary (no runtime `mwg`
  import allowed), and its `idOfEntity`/`hasEntity` helpers were unused dead code, so they were
  removed rather than migrated. The local `nextEntityId` counter stays; the registry belongs at the
  scene/adapter layer.
- **P2: a value-level 2D primitive story** (unblocks Phase 0's exit criterion). Surveyed all
  26 `from 'pixi.js'` imports in `src/` with the compiler API: *every* use is a value use -
  `extends Container`, `new Texture(...)` / `new Rectangle(...)`, statics like
  `Texture.from(...)`, `extensions.add(TilingSpritePipe)`. So the `Types2D.ts` type aliases
  (adopted in `monsters.ts`, the single convertible file) unblock nothing further on their
  own. Proposal, phased: (1) re-export the pixi values through `mwg/two-d` (also removes the
  dual-copy `dedupe` hazard `vite.config.ts` documents); (2) optionally, constructible
  wrappers later (`Container2D` class, `Texture2D.from(...)`, a `rect(x, y, w, h)` factory
  next to `rectOf`). Either phase lets games delete `pixi.js` from their own manifests.
- **No proposal for semantic messaging**: `mwg/i18n` already matches the section 22C shape
  and the remaining work (typed messages at event sites) is port-side. Proposing nothing is
  also a decision, recorded so it isn't re-surveyed every bump.

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
| SPD-ADR-001 | `SpdSimulation` is the sole gameplay-mutation authority | Unblocked, partially adopted: `simulation.SimulationRuntime` (0.4.1) fronts the search and hunger commands (`adapters/searchSimulation.ts`, `adapters/hungerSimulation.ts`, both cost-`null` so far); `main.ts`'s `attack()` et al. still mutate state directly and call presentation inline (see `SIMULATION_ARCHITECTURE.md`) |
| SPD-ADR-002 | Every runtime entity has a stable, renderer-free `EntityId` | Substantially adopted with a locally-minted id (`simulation/entityId.ts`): every `Creature`/`GroundItem` has one, and `sprite` moved off both interfaces into the scene's `spriteFor` registry (SIMULATION_ARCHITECTURE.md's "Step 6" + "Step 8"). The `EntityId` type itself is MWG's own `core.EntityId` (0.4.2, type-only re-export). `EntityRegistry.add(entity, requestedId?)` landed in 0.7.2, but it cannot be adopted inside the framework-free `simulation/` boundary, and the module's reverse-lookup helpers were unused dead code (removed 2026-09-11); minting stays the local prefixed counter. Still object-reference-identified elsewhere (`Map<Creature, Bar>` for health bars, `Set<Creature>` for king adds) - not yet migrated to id-keyed lookups either way |
| SPD-ADR-003 | The MWG scheduler is the sole time authority | Partially adopted: `advanceToInput` drives scheduling (step 3), but monster turns still hardcode `return 1` rather than a real per-action time cost (plan section 6). `SimulationRuntime.dispatch`'s `cost` field (0.4.1) is the real mechanism once actions route through it |
| SPD-ADR-004 | Scenes contain no business rules; they translate input and events | Not yet; `main.ts` (~7460 lines) still holds most combat/AI/effect logic |
| SPD-ADR-005 | GameEvents are the ordered output of simulation transactions | Partially: `buffs.ts` already emits `buff-applied`/tick events; `attack()` does not. `core.PresentationQueue` (0.4.1) is the consumer-side primitive this needs, once real events exist to feed it |
| SPD-ADR-006 | Save is a full simulation+scheduler+RNG snapshot | Unblocked, not yet adopted: `simulation.SimulationRuntime`'s `snapshot()`/`SimulationSnapshot` (0.4.1) is exactly `{version, state, scheduler, random}`; no game code builds on it yet |
| SPD-ADR-007 | The game never imports PixiJS in normal use | Blocked on MWG shipping 2D primitive wrapper types (see above) - unaffected by 0.4.1 |
| SPD-ADR-008 | Static definitions are separated from runtime instances | Partially: `monsters.ts`/`spdItems/*` already separate catalogue from state in places; not systematic |
| SPD-ADR-009 | Combat is Actor<->Actor, not Hero<->Monster-specialized | Not yet; `ROADMAP.md` section 5 already tracks "Implement ally-vs-monster combat" as an open, real gap for the same reason |
| SPD-ADR-010 | Business families are refactored only after a data/function/method analysis; inheritance is never the default | Adopted as a going-forward rule for this plan; no family has had the full matrix produced yet |
| SPD-ADR-011 | Actors/monsters/allies/summons/bosses share one Actor model; variation is composition + data | Not yet; current `Creature` is a single flat interface, closer in spirit to this than a Java-style hierarchy, but no `ActorDefinition`/`abilities` split exists |
| SPD-ADR-012 | Semantic messaging/localization belongs to MWG; SPD owns only its taxonomy/catalogs/lexical data | Evaluated this pass: `mwg/i18n@0.4.2` matches the section 22C shape (`SemanticMessage`/`MessageChannel`/`MessageFormatter`/`createCatalogFormatter`, `EntityTextResolver`/`GrammaticalEntity`, CLDR plurals, FTL, catalog audit tools); the catalog mechanism is already adopted (`src/i18n/index.ts`). Pending: the message half - emitting typed messages at `say()` sites, phased (combat log lines as pilot), not a switch |

## Non-goals reaffirmed from the plan (section 28)

Kept here because they're easy to violate piecemeal during a long migration: no Java-class-
for-TypeScript-class transposition, no game-local ECS now that MWG owns identity concerns
once it ships them, no second scheduler/time model, no big-bang rewrite (phase strictly by
playable vertical slice per `SIMULATION_ARCHITECTURE.md`'s own step discipline), and no
SPD-specific rule ever pushed into MWG to make the port easier locally.
