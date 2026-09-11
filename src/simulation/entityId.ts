/**
 * Stable, renderer-free identifiers for runtime entities (actors and ground items).
 *
 * SPD_ARCHITECTURE_TARGET_V3.md's "Step 6": the `EntityId` type is MWG's own `core.EntityId`
 * (re-exported, type-only - so this module keeps its zero runtime dependency on `mwg`). `mwg@0.7.2`
 * added `EntityRegistry.add(entity, requestedId?)`, the caller-chosen-id primitive the earlier
 * version of this comment said was missing - but this module lives inside the framework-free
 * `simulation/` boundary (`tools/verifyCombat.mjs` asserts every non-type import here is relative),
 * so importing `EntityRegistry` is not allowed. The reverse `idOfEntity`/`hasEntity` helpers it
 * used to carry also had no call sites, so they were removed rather than kept as dead API; wire
 * `EntityRegistry` at the scene/adapter layer if an id-keyed lookup is ever needed.
 *
 * Minting stays a plain local counter producing the port's prefixed `hero-N`/`actor-N`/`item-N`
 * ids, which the save schema (`SavedCreature`/ground-item payloads) persists.
 */
export type { EntityId } from 'mwg/core';
import type { EntityId } from 'mwg/core';

let counter = 0;

export function nextEntityId(prefix: string): EntityId {
	counter += 1;
	return `${prefix}-${counter}` as EntityId;
}
