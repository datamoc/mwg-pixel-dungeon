import { Generator } from 'mwg';
import { Scheduler, SimulationRuntime, type Actor, type SimulationRuntimeRule } from 'mwg/simulation';
import type { Combatant } from '../simulation/combatState';
import { resolveAttack, type AttackResolution } from '../simulation/attackResolution';
import { advanceHunger, type HungerEvent, type HungerState } from '../simulation/hunger';
import { planHeroAction, type HeroActionPlan } from '../simulation/heroActions';
import { planMovement, type MovementPlan, type MovementWorld } from '../simulation/movement';
import { planSearch, type SearchOutcome, type SearchWorld } from '../simulation/search';
import type { SimulationRandom } from '../simulation/random';
import { finishHeroTurn, type HeroTurnEffects, type HeroTurnResult } from '../simulation/heroTurn';

interface SpdActor extends Actor { id: string; }

export interface MonsterTurnEffects {
	act(): void;
	afterAct?(): void;
	cost?(): number;
}

type Command =
	| { kind: 'attack'; attacker: Combatant; defender: Combatant; randomId: number; magic: boolean; surprise: boolean; accFactor: number; damageMultiplier: number }
	| { kind: 'hero-turn'; effectsId: number; turnCost: number }
	| { kind: 'monster-turn'; effectsId: number }
	| { kind: 'hunger'; state: HungerState; step?: number }
	| { kind: 'hero-action'; action: string; paralysed: boolean; turnCostMod: number }
	| { kind: 'movement'; position: { x: number; y: number }; move: { x: number; y: number }; worldId: number }
	| { kind: 'search'; position: { x: number; y: number }; radius: number; worldId: number };

type Event =
	| { type: 'attack-resolution'; resolution: AttackResolution }
	| { type: 'hero-turn-result'; result: HeroTurnResult }
	| { type: 'monster-turn-result'; cost: number }
	| { type: 'hunger-transition'; state: HungerState; events: HungerEvent[] }
	| { type: 'hero-action-plan'; plan: HeroActionPlan }
	| { type: 'movement-plan'; plan: MovementPlan }
	| { type: 'search-result'; outcome: SearchOutcome };

interface State { last: Event | null; }

// MWG 0.9.0 journals commands with structuredClone. These callbacks are deliberately kept
// outside the command payload: they are live scene views, not replayable game state.
let nextHandle = 0;
const randomSources = new Map<number, SimulationRandom>();
const heroTurnEffects = new Map<number, HeroTurnEffects>();
const monsterTurnEffects = new Map<number, MonsterTurnEffects>();
const movementWorlds = new Map<number, MovementWorld>();
const searchWorlds = new Map<number, SearchWorld>();

const rule: SimulationRuntimeRule<State, Command, Event, SpdActor> = (_state, command) => {
	switch (command.kind) {
		case 'attack': {
			const random = randomSources.get(command.randomId);
			if (!random) throw new Error(`attack random source ${command.randomId} is no longer available`);
			const resolution = resolveAttack(command.attacker, command.defender, random, command.magic, command.surprise, command.accFactor, command.damageMultiplier);
			return { state: { last: { type: 'attack-resolution', resolution } }, events: [{ type: 'attack-resolution', resolution }], status: 'ready', cost: null };
		}
		case 'hero-turn': {
			const effects = heroTurnEffects.get(command.effectsId);
			if (!effects) throw new Error(`hero turn effects ${command.effectsId} are no longer available`);
			const result = finishHeroTurn(effects);
			return { state: { last: { type: 'hero-turn-result', result } }, events: [{ type: 'hero-turn-result', result }], status: 'ready', cost: command.turnCost };
		}
		case 'monster-turn': {
			const effects = monsterTurnEffects.get(command.effectsId);
			if (!effects) throw new Error(`monster turn effects ${command.effectsId} are no longer available`);
			effects.act();
			effects.afterAct?.();
			const cost = effects.cost?.() ?? 1;
			return { state: { last: { type: 'monster-turn-result', cost } }, events: [{ type: 'monster-turn-result', cost }], status: 'ready', cost };
		}
		case 'hunger': {
			const result = advanceHunger(command.state, command.step);
			const event = { type: 'hunger-transition' as const, state: result.state, events: result.events };
			return { state: { last: event }, events: [event], status: 'ready', cost: null };
		}
		case 'hero-action': {
			const plan = planHeroAction(command.action, command.paralysed, command.turnCostMod);
			return { state: { last: { type: 'hero-action-plan', plan } }, events: [{ type: 'hero-action-plan', plan }], status: 'ready', cost: null };
		}
		case 'movement': {
			const world = movementWorlds.get(command.worldId);
			if (!world) throw new Error(`movement world ${command.worldId} is no longer available`);
			const plan = planMovement(command.position, command.move, world);
			return { state: { last: { type: 'movement-plan', plan } }, events: [{ type: 'movement-plan', plan }], status: 'ready', cost: null };
		}
		case 'search': {
			const world = searchWorlds.get(command.worldId);
			if (!world) throw new Error(`search world ${command.worldId} is no longer available`);
			const outcome = planSearch(command.position, command.radius, world);
			return { state: { last: { type: 'search-result', outcome } }, events: [{ type: 'search-result', outcome }], status: 'ready', cost: null };
		}
	}
};

const runtime = new SimulationRuntime<State, Command, Event, SpdActor>({
	state: { last: null }, scheduler: new Scheduler<SpdActor>(), random: new Generator(0), rule,
	actorId: (actor) => actor.id,
});

function dispatch(command: Command): Event {
	try {
		return runtime.dispatch(command).events[0]!;
	} finally {
		// These commands are currently synchronous adapters, not the durable run journal. Clear
		// the cloned command after presentation so live callback handles cannot accumulate.
		runtime.journal.truncate(0);
	}
}

export function runAttackResolution(attacker: Combatant, defender: Combatant, random: SimulationRandom, magic = false, surprise = false, accFactor = 1, damageMultiplier = 1): AttackResolution {
	const randomId = ++nextHandle;
	randomSources.set(randomId, random);
	try {
		return (dispatch({ kind: 'attack', attacker, defender, randomId, magic, surprise, accFactor, damageMultiplier }) as { type: 'attack-resolution'; resolution: AttackResolution }).resolution;
	} finally {
		randomSources.delete(randomId);
	}
}

/** Route the extracted hero-turn sequence through the same runtime as the other decisions.
 * The effects object is a live scene binding, so only its numeric handle enters MWG's cloned
 * command journal; presentation and persistence remain scene-owned until the full snapshot
 * boundary is introduced. */
export function runHeroTurn(effects: HeroTurnEffects, turnCost = 1): HeroTurnResult {
	const effectsId = ++nextHandle;
	heroTurnEffects.set(effectsId, effects);
	try {
		return (dispatch({ kind: 'hero-turn', effectsId, turnCost }) as { type: 'hero-turn-result'; result: HeroTurnResult }).result;
	} finally {
		heroTurnEffects.delete(effectsId);
	}
}

/** Route a scheduled monster action through the shared runtime while keeping live scene hooks
 * outside MWG's cloneable command payload. The returned cost is read immediately after the
 * action, preserving special actors such as Necromancer's variable-cost summon. */
export function runMonsterTurn(effects: MonsterTurnEffects): number {
	const effectsId = ++nextHandle;
	monsterTurnEffects.set(effectsId, effects);
	try {
		return (dispatch({ kind: 'monster-turn', effectsId }) as { type: 'monster-turn-result'; cost: number }).cost;
	} finally {
		monsterTurnEffects.delete(effectsId);
	}
}

export function runHungerStep(state: HungerState, step = 10): { state: HungerState; events: HungerEvent[] } {
	const event = dispatch({ kind: 'hunger', state, step }) as { type: 'hunger-transition'; state: HungerState; events: HungerEvent[] };
	return { state: event.state, events: [...event.events] };
}

export function runHeroActionPlan(action: string, paralysed: boolean, turnCostMod = 1): HeroActionPlan {
	return (dispatch({ kind: 'hero-action', action, paralysed, turnCostMod }) as { type: 'hero-action-plan'; plan: HeroActionPlan }).plan;
}

export function runMovement(position: { x: number; y: number }, move: { x: number; y: number }, world: MovementWorld): MovementPlan {
	const worldId = ++nextHandle;
	movementWorlds.set(worldId, world);
	try {
		return (dispatch({ kind: 'movement', position, move, worldId }) as { type: 'movement-plan'; plan: MovementPlan }).plan;
	} finally {
		movementWorlds.delete(worldId);
	}
}

export function runSearch(position: { x: number; y: number }, radius: number, world: SearchWorld): SearchOutcome {
	const worldId = ++nextHandle;
	searchWorlds.set(worldId, world);
	try {
		return (dispatch({ kind: 'search', position, radius, worldId }) as { type: 'search-result'; outcome: SearchOutcome }).outcome;
	} finally {
		searchWorlds.delete(worldId);
	}
}
