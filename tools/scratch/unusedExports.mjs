// Exported simulation functions with no use anywhere in src (own file included): candidates for dropped scene wiring.
// "tests" = a tools/ verify script references the name, so the rule is pinned but not wired.
import fs from 'node:fs';
import path from 'node:path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const norm = (f) => f.split(path.sep).join('/');
const files = walk('src').map(norm).filter((f) => f.endsWith('.ts') && !f.includes('generated'));
const toolFiles = walk('tools').map(norm).filter((f) => /\.(ts|mjs)$/.test(f) && !f.includes('/scratch/'));
const text = Object.fromEntries([...files, ...toolFiles].map((f) => [f, fs.readFileSync(f, 'utf8')]));
const count = (re, f) => (text[f].match(re) ?? []).length;
const out = [];
for (const f of files.filter((f) => f.startsWith('src/simulation/'))) {
	for (const m of text[f].matchAll(/export function (\w+)/g)) {
		const n = m[1];
		const re = new RegExp(`\\b${n}\\b`, 'g');
		const own = count(re, f) - 1; // minus the definition
		const others = files.filter((g) => g !== f).reduce((a, g) => a + count(re, g), 0);
		if (own + others > 0) continue;
		const tests = toolFiles.filter((g) => count(re, g) > 0).length;
		out.push(`${f.slice('src/simulation/'.length)}:${n} (tests: ${tests})`);
	}
}
console.log(out.length);
console.log(out.join('\n'));
