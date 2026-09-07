/** A stable, renderer-free identifier for a runtime entity (actor or ground item).
 *
 * SPD_ARCHITECTURE_TARGET_V3.md's "Step 6" (see SIMULATION_ARCHITECTURE.md): the target plan
 * assumes MWG will eventually own `EntityId`/`EntityRegistry`. `mwg@0.4.0` does not export
 * either yet, so this project owns a minimal local id for now - a plain counter, not a
 * randomized/crypto id, since ids only need to be unique within one running session and
 * comparable/serializable, never guessed or exposed externally.
 */
export type EntityId = string;

let counter = 0;

export function nextEntityId(prefix: string): EntityId {
	counter += 1;
	return `${prefix}-${counter}`;
}
