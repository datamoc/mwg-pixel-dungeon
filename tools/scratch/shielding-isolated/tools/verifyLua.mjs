import { createLuaAI } from 'mwg/ai/lua';

const checks = [];
const pass = (label, condition) => {
	checks.push([label, Boolean(condition)]);
	if (!condition) throw new Error(`FAIL ${label}`);
	console.log(`PASS ${label}`);
};

const ai = createLuaAI({ seed: 7, maxSteps: 1000 });
ai.register({
	id: 'rat',
	source: `
		function decide(perception, state)
			local turn = (state.turn or 0) + 1
			return {
				action = { type = perception.visible and "approach" or "wait" },
				state = { turn = turn }
			}
		end
	`,
});
const first = ai.decide('rat', { perception: { visible: true } });
pass('Lua decision returns a JSON action', first.action?.type === 'approach');
pass('Lua decision advances persistent state', first.state.turn === 1);
const second = ai.decide('rat', { perception: { visible: false } });
pass('Lua state survives the next decision', second.action?.type === 'wait' && second.state.turn === 2);
const exported = ai.exportState();
pass('Lua state exports through the versioned envelope', exported.version === 1 && exported.agents.rat.turn === 2);

const search = createLuaAI({ seed: 7 });
search.register({
	id: 'planner',
	search: { player: 'current_player', moves: 'legal_moves', apply: 'apply_move', terminal: 'is_terminal', evaluate: 'evaluate' },
	source: `
		function current_player(state) return 1 end
		function legal_moves(state)
			if state.turn < 2 then return { { step = 1 }, { step = 2 } } end
			return {}
		end
		function apply_move(state, move) return { turn = state.turn + move.step } end
		function is_terminal(state) return state.turn >= 2 end
		function evaluate(state, root) return state.turn end
	`,
});
const result = search.search('planner', { turn: 0 }, { depth: 2, maxNodes: 20 });
pass('Lua alpha-beta search completes with a legal move', result.status === 'complete' && (result.move?.step === 1 || result.move?.step === 2));
search.dispose();

const bounded = createLuaAI({ maxSteps: 32 });
bounded.register({ id: 'loop', source: 'function decide(perception, state) while true do end end' });
const limited = bounded.decide('loop', { perception: null });
pass('Lua execution stops at the configured instruction budget', limited.status === 'budget-exceeded' && limited.action === null);
bounded.dispose();
ai.dispose();

console.log(`${checks.length} Lua checks passed.`);
