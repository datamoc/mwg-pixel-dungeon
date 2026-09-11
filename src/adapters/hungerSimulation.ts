import { Generator } from 'mwg';
import { SimulationRuntime, Scheduler, type Actor, type SimulationRuntimeRule } from 'mwg/simulation';
import { advanceHunger, type HungerEvent, type HungerState } from '../simulation/hunger';

interface HungerActor extends Actor {
	id: string;
}

type HungerCommand = { state: HungerState; step?: number };

const rule: SimulationRuntimeRule<HungerState, HungerCommand, HungerEvent, HungerActor> = (_state, command) => {
	const { state, events } = advanceHunger(command.state, command.step);
	return { state, events, status: 'ready', cost: null };
};

/**
 * The second `SimulationRuntime` adoption after `searchSimulation.ts` (see
 * `SIMULATION_ARCHITECTURE.md`'s "Step 8" and `ROADMAP.md` section 11's "next real phase").
 *
 * Deliberately shares nothing with the scene's real scheduler/random yet, for the same reason
 * as the search runtime: hunger costs no randomness and its turn cost is still charged by the
 * existing `spendHeroTurn` mechanism (this rule's own `cost` is always `null`, so `dispatch()`
 * never touches the scheduler at all) - so an inert, actor-less `Scheduler` and an unused
 * seeded `Generator` are enough for this one command. Reconciling schedulers/randoms is a
 * later, separate integration once a command with a real cost routes through `SimulationRuntime`
 * (no big-bang, per the plan's own section 25 and this project's established practice).
 */
const runtime = new SimulationRuntime<HungerState, HungerCommand, HungerEvent, HungerActor>({
	state: { hunger: 0, partialDamage: 0, hp: 1, maxHp: 1 },
	scheduler: new Scheduler<HungerActor>(),
	random: new Generator(0),
	rule,
	actorId: (actor) => actor.id,
});

/** Advances one hunger step through the runtime - the pure transition only; the caller still
 * owns committing the state and presenting the events, the same "scene executes the selected
 * effect" split `movement.ts` established in Step 5. */
export function runHungerStep(state: HungerState, step = 10): { state: HungerState; events: HungerEvent[] } {
	const outcome = runtime.dispatch({ state, step });
	return { state: outcome.state, events: [...outcome.events] };
}
