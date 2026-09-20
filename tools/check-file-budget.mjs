// File-size budget gate (ROADMAP.md's file-size refactor line): every hand-written
// `src/**/*.ts` file must stay within budget - 2,000 lines by default (the line's
// stated objective), or its recorded entry in `tools/file-budgets.json` while it is
// still above that. Generated files under `src/generated/` are excluded, as the
// line says. Budgets are deliberately loose headroom over the count on the day the
// entry was written; lower an entry (and delete it once the file fits 2,000) as
// extractions land, in the same commit as the shrink. Runs offline, no dependencies.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const DEFAULT_BUDGET = 2000;

function walk(dir) {
	const entries = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			if (name === 'generated' && full === join(SRC, 'generated')) continue;
			entries.push(...walk(full));
		} else if (name.endsWith('.ts')) {
			entries.push(full);
		}
	}
	return entries;
}

const budgets = JSON.parse(readFileSync(join(ROOT, 'tools', 'file-budgets.json'), 'utf8'));
let failures = 0;
for (const full of walk(SRC)) {
	const key = relative(ROOT, full).split(sep).join('/');
	const lines = (readFileSync(full, 'utf8').match(/\n/g) || []).length;
	const budget = Object.hasOwn(budgets, key) ? budgets[key] : DEFAULT_BUDGET;
	if (lines > budget) {
		console.error(`OVER BUDGET: ${key} is ${lines} lines (budget ${budget})`);
		failures++;
	} else if (Object.hasOwn(budgets, key)) {
		console.log(`${key}: ${lines} / ${budget}`);
	}
}
if (failures > 0) {
	console.error(`${failures} file(s) over budget - shrink them or deliberately raise their entry in tools/file-budgets.json.`);
	process.exit(1);
}
console.log('file budgets hold.');
