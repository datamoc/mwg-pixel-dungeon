/** A stable, renderer-free identifier for a runtime entity (actor or ground item).
 *
 * SPD_ARCHITECTURE_TARGET_V3.md's "Step 6" (see SIMULATION_ARCHITECTURE.md): the target plan
 * assumes MWG will eventually own `EntityId`/`EntityRegistry`. `mwg@0.4.2` now exports both
 * for real (`core/Entity.ts`), so the `EntityId` type here IS MWG's own (re-exported, not a
 * local alias) - a deliberate, one-line adoption of the upstream identity primitive.
 *
 * What is NOT adopted, deliberately: MWG's `EntityRegistry.add()` mints its own opaque
 * `e0, e1, ...` ids, while this port's ids are prefixed (`hero-N`, `actor-N`, `item-N`) and
 * persisted in the save schema (`SavedCreature`/ground-item payloads carry them). Routing
 * minting through the registry would rename every saved entity and break old saves, and the
 * registry has no "add with a caller-chosen id" primitive - so `nextEntityId(prefix)` keeps
 * minting the prefixed ids. Full `EntityRegistry` adoption needs either that primitive
 * upstream or a save migration here; until then the reverse `idOf(entity)` lookup the local
 * counter never had (SPD-ADR-002's own stated follow-up) lives in the small map below.
 */
export type { EntityId } from 'mwg/core';
import type { EntityId } from 'mwg/core';

const reverseLookup = new WeakMap<object, EntityId>();
const seenIds = new Set<EntityId>();

let counter = 0;

export function nextEntityId(prefix: string): EntityId {
	counter += 1;
	const id = `${prefix}-${counter}` as EntityId;
	seenIds.add(id);
	return id;
}

/** Records the object an already-minted id names, so `idOfEntity` can find it later.
 * Returns the entity unchanged, so call sites can wrap construction in one expression. */
export function trackEntity<T extends object>(entity: T, id: EntityId): T {
	seenIds.add(id);
	reverseLookup.set(entity, id);
	return entity;
}

/** Reverse lookup - the `idOf(entity)` SPD-ADR-002 names. */
export function idOfEntity(entity: object): EntityId | undefined {
	return reverseLookup.get(entity);
}

/** Forward check, for the loading-screen race ROADMAP.md section 10 tracks: distinguishes
 * "an id this session minted" from "a stale id from an old save". */
export function hasEntity(id: EntityId): boolean {
	return seenIds.has(id);
}
