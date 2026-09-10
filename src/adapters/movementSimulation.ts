import { Generator } from 'mwg';
import { Scheduler, SimulationRuntime, type Actor, type SimulationRuntimeRule } from 'mwg/simulation';
import type { Step } from '../simulation/combatState';
import { planMovement, type MovementPlan, type MovementWorld } from '../simulation/movement';

interface MovementActor extends Actor { id: string; }
interface MovementState { last: MovementPlan | null; }
interface MovementCommand { position: Step; move: Step; world: MovementWorld; }
type MovementEvent = { type: 'movement-plan'; plan: MovementPlan };

const rule: SimulationRuntimeRule<MovementState, MovementCommand, MovementEvent, MovementActor> = (_state, command) => {
	const plan = planMovement(command.position, command.move, command.world);
	return { state: { last: plan }, events: [{ type: 'movement-plan', plan }], status: 'ready', cost: null };
};

/** Routes movement planning through MWG; the scene retains all movement effects and presentation. */
const runtime = new SimulationRuntime<MovementState, MovementCommand, MovementEvent, MovementActor>({
	state: { last: null }, scheduler: new Scheduler<MovementActor>(), random: new Generator(0), rule,
	actorId: (actor) => actor.id,
});

export function runMovement(position: Step, move: Step, world: MovementWorld): MovementPlan {
	return runtime.dispatch({ position, move, world }).events[0]!.plan;
}
