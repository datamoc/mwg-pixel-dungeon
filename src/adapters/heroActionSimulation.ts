import { Generator } from 'mwg';
import { Scheduler, SimulationRuntime, type Actor, type SimulationRuntimeRule } from 'mwg/simulation';
import { planHeroAction, type HeroActionPlan } from '../simulation/heroActions';

interface HeroActionActor extends Actor { id: string; }
interface HeroActionState { last: HeroActionPlan | null; }
interface HeroActionCommand { action: string; paralysed: boolean; turnCostMod: number; }
type HeroActionEvent = { type: 'hero-action-plan'; plan: HeroActionPlan };

const rule: SimulationRuntimeRule<HeroActionState, HeroActionCommand, HeroActionEvent, HeroActionActor> = (_state, command) => {
	const plan = planHeroAction(command.action, command.paralysed, command.turnCostMod);
	return { state: { last: plan }, events: [{ type: 'hero-action-plan', plan }], status: 'ready', cost: null };
};

/**
 * Routes the hero-action policy through MWG; the scene retains every effect and the turn
 * spending (`adapters/heroActions.ts` executes the plan against its ports). A cost-free
 * command with an inert scheduler/random pair, matching the search, hunger, movement and
 * attack-resolution adapters; reconciling those with the scene's live turn runtime waits for
 * the first command with a real cost.
 */
const runtime = new SimulationRuntime<HeroActionState, HeroActionCommand, HeroActionEvent, HeroActionActor>({
	state: { last: null }, scheduler: new Scheduler<HeroActionActor>(), random: new Generator(0), rule,
	actorId: (actor) => actor.id,
});

export function runHeroActionPlan(action: string, paralysed: boolean, turnCostMod = 1): HeroActionPlan {
	return runtime.dispatch({ action, paralysed, turnCostMod }).events[0]!.plan;
}
