import type { Roguelike } from 'mwg';
import { advanceToInput } from 'mwg/simulation';
import type { HungerEvent, HungerState } from '../simulation/hunger';
import type { TurnActor, TurnPorts, TurnStop } from '../simulation/turns';
import { runHungerStep } from './hungerSimulation';

/** Translate MWG's game-neutral runner outcomes to this port's existing turn contract. */
export function runUntilHeroInput<A extends TurnActor>(ports: TurnPorts<A>): TurnStop {
	const result = advanceToInput({
		scheduler: ports.scheduler,
		finished: () => ports.isGameOver(),
		needsInput: (actor) => !!actor.isHero,
		act: (actor) => {
			ports.takeMonsterTurn(actor);
			ports.afterMonsterTurn?.(actor);
			return ports.monsterTurnCost?.(actor) ?? 1;
		},
	}, 1000);
	switch (result.status) {
		case 'input': return 'hero-input';
		case 'finished': return 'game-over';
		case 'empty': return 'empty';
		case 'limit': return 'iteration-limit';
	}
}

/** All scene access is live: loading a save or entering a floor must not retain old state. */
export interface SceneSimulationBindings<A extends TurnActor & { speed?: number }> {
	scheduler: Roguelike.Scheduler<A>;
	isGameOver(): boolean;
	takeMonsterTurn(actor: A): void;
	afterMonsterTurn?(actor: A): void;
	monsterTurnCost?(actor: A): number;
	awaitHeroInput(): void;
	readHunger(): HungerState;
	writeHunger(state: HungerState): void;
	presentHungerEvent(event: HungerEvent): void;
}

/** Bridges the existing mutable scene and mwg scheduler to the first simulation modules. */
export class SceneSimulationAdapter<A extends TurnActor & { speed?: number }> {
	private readonly bindings: SceneSimulationBindings<A>;

	constructor(bindings: SceneSimulationBindings<A>) {
		this.bindings = bindings;
	}

	runTurns(): TurnStop {
		const stop = runUntilHeroInput(this.bindings);
		if (stop === 'hero-input') this.bindings.awaitHeroInput();
		return stop;
	}

	hungerStep(step = 10): void {
		//Routed through the hunger SimulationRuntime (see hungerSimulation.ts) rather than
		//calling advanceHunger directly - same transition, same events, committed and
		//presented exactly as before; only the dispatch path changed.
		const { state, events } = runHungerStep(this.bindings.readHunger(), step);
		this.bindings.writeHunger(state);
		for (const event of events) this.bindings.presentHungerEvent(event);
	}
}
