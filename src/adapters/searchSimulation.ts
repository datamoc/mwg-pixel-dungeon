import { Generator } from 'mwg';
import { SimulationRuntime, Scheduler, type Actor, type SimulationRuntimeRule } from 'mwg/simulation';
import type { Step } from '../simulation/combatState';
import { planSearch, type SearchOutcome, type SearchWorld } from '../simulation/search';

interface SearchActor extends Actor {
	id: string;
}

interface SearchState {
	last: SearchOutcome | null;
}

interface SearchCommand {
	position: Step;
	radius: number;
	world: SearchWorld;
}

type SearchEvent = { type: 'search-result'; outcome: SearchOutcome };

const rule: SimulationRuntimeRule<SearchState, SearchCommand, SearchEvent, SearchActor> = (_state, command) => {
	const outcome = planSearch(command.position, command.radius, command.world);
	return { state: { last: outcome }, events: [{ type: 'search-result', outcome }], status: 'ready', cost: null };
};

/**
 * The first real adoption of `mwg@0.4.1`'s `simulation.SimulationRuntime` in this port (see
 * `SIMULATION_ARCHITECTURE.md`'s "Step 7" and `ROADMAP.md` section 11's "next real phase").
 *
 * Deliberately does NOT share the scene's real scheduler/random: search costs no randomness and
 * its turn cost is still charged by the existing `heroActions.ts`/`spendHeroTurn` mechanism (this
 * rule's own `cost` is always `null`, so `dispatch()` never touches the scheduler at all) - so an
 * inert, actor-less `Scheduler` and an unused seeded `Generator` are enough for this one command.
 * Reconciling this runtime's scheduler/random with the scene's real ones is a later, separate
 * integration once more commands route through `SimulationRuntime` (no big-bang, per the plan's
 * own section 25 and this project's established practice).
 */
const runtime = new SimulationRuntime<SearchState, SearchCommand, SearchEvent, SearchActor>({
	state: { last: null },
	scheduler: new Scheduler<SearchActor>(),
	random: new Generator(0),
	rule,
	actorId: (actor) => actor.id,
});

/** Dispatches one search command and returns its outcome - the pure decision only; the caller
 * still owns discovering the secret, presentation (tile restitching, feature-map redraw), the
 * log message, and guide-progress persistence, the same "scene executes the selected effect"
 * split `movement.ts` already established in Step 5. */
export function runSearch(position: Step, radius: number, world: SearchWorld): SearchOutcome {
	return runtime.dispatch({ position, radius, world }).events[0]!.outcome;
}
