/**
 * A closed arithmetic evaluator for the formulas MWL authors on equipment (`weaponCombatRules`,
 * `equipmentStatRules`). It is not `eval`: it parses numbers, the variables `tier` and `level`,
 * `+ - * /`, parentheses, unary minus and the functions `round`, `floor`, `max` and `min`, and it
 * throws on anything else, so authored content can describe a formula but never run code.
 *
 * `round` is Java's `Math.round` (half up), which is what `Math.round` does for the non-negative
 * values these formulas produce.
 */

export interface FormulaVariables {
	readonly tier: number;
	readonly level: number;
}

type Token = { kind: 'num'; value: number } | { kind: 'id'; value: string } | { kind: 'op'; value: string };

function tokenize(source: string): Token[] {
	const tokens: Token[] = [];
	const pattern = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]+)|([-+*/(),]))/y;
	let index = 0;
	while (index < source.length) {
		pattern.lastIndex = index;
		const match = pattern.exec(source);
		if (!match) {
			if (source.slice(index).trim() === '') break;
			throw new Error(`Unexpected character in formula "${source}" at ${index}`);
		}
		if (match[1] !== undefined) tokens.push({ kind: 'num', value: Number(match[1]) });
		else if (match[2] !== undefined) tokens.push({ kind: 'id', value: match[2] });
		else tokens.push({ kind: 'op', value: match[3]! });
		index = pattern.lastIndex;
	}
	return tokens;
}

const FUNCTIONS: Readonly<Record<string, (...args: number[]) => number>> = {
	round: (x) => Math.round(x!),
	floor: (x) => Math.floor(x!),
	max: (...xs) => Math.max(...xs),
	min: (...xs) => Math.min(...xs),
};

/** Evaluates `formula` with `tier` and `level` bound; throws on any syntax or name it does not know. */
export function evaluateFormula(formula: string, variables: FormulaVariables): number {
	const tokens = tokenize(formula);
	let position = 0;
	const peek = (): Token | undefined => tokens[position];
	const take = (): Token => {
		const token = tokens[position++];
		if (!token) throw new Error(`Formula "${formula}" ended early`);
		return token;
	};
	const expectOp = (value: string): void => {
		const token = take();
		if (token.kind !== 'op' || token.value !== value) throw new Error(`Formula "${formula}": expected "${value}"`);
	};

	function expression(): number {
		let value = term();
		for (let token = peek(); token?.kind === 'op' && (token.value === '+' || token.value === '-'); token = peek()) {
			position++;
			const right = term();
			value = token.value === '+' ? value + right : value - right;
		}
		return value;
	}
	function term(): number {
		let value = factor();
		for (let token = peek(); token?.kind === 'op' && (token.value === '*' || token.value === '/'); token = peek()) {
			position++;
			const right = factor();
			value = token.value === '*' ? value * right : value / right;
		}
		return value;
	}
	function factor(): number {
		const token = take();
		if (token.kind === 'num') return token.value;
		if (token.kind === 'op' && token.value === '-') return -factor();
		if (token.kind === 'op' && token.value === '(') {
			const inner = expression();
			expectOp(')');
			return inner;
		}
		if (token.kind === 'id') {
			const call = peek();
			if (call?.kind === 'op' && call.value === '(') {
				const fn = FUNCTIONS[token.value];
				if (!fn) throw new Error(`Formula "${formula}": unknown function ${token.value}`);
				position++;
				const args = [expression()];
				while (peek()?.kind === 'op' && (peek() as { value: string }).value === ',') { position++; args.push(expression()); }
				expectOp(')');
				return fn(...args);
			}
			if (token.value === 'tier') return variables.tier;
			if (token.value === 'level') return variables.level;
			throw new Error(`Formula "${formula}": unknown name ${token.value}`);
		}
		throw new Error(`Formula "${formula}": unexpected "${token.value}"`);
	}

	const result = expression();
	if (position !== tokens.length) throw new Error(`Formula "${formula}" has trailing input`);
	return result;
}
