import { Generator } from 'mwg';
import { Scheduler, SimulationRuntime, type Actor, type SimulationRuntimeRule } from 'mwg/simulation';
import type { Combatant } from '../simulation/combatState';
import { resolveAttack, type AttackResolution } from '../simulation/attackResolution';
import type { SimulationRandom } from '../simulation/random';

interface AttackActor extends Actor { id: string; }
interface AttackState { last: AttackResolution | null; }
interface AttackCommand {
	attacker: Combatant;
	defender: Combatant;
	random: SimulationRandom;
	magic: boolean;
	surprise: boolean;
}
type AttackEvent = { type: 'attack-resolution'; resolution: AttackResolution };

const rule: SimulationRuntimeRule<AttackState, AttackCommand, AttackEvent, AttackActor> = (_state, command) => {
	const resolution = resolveAttack(command.attacker, command.defender, command.random, command.magic, command.surprise);
	return { state: { last: resolution }, events: [{ type: 'attack-resolution', resolution }], status: 'ready', cost: null };
};

// The scene owns the live random stream, so it travels in the command. The runtime's
// inert generator/scheduler are only the transitional shell until combat state is unified.
const runtime = new SimulationRuntime<AttackState, AttackCommand, AttackEvent, AttackActor>({
	state: { last: null }, scheduler: new Scheduler<AttackActor>(), random: new Generator(0), rule,
	actorId: (actor) => actor.id,
});

/** Routes pure attack resolution through MWG; main.ts retains all combat presentation/effects. */
export function runAttackResolution(attacker: Combatant, defender: Combatant, random: SimulationRandom, magic = false, surprise = false): AttackResolution {
	return runtime.dispatch({ attacker, defender, random, magic, surprise }).events[0]!.resolution;
}
