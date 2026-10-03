// Standing audit for the roadmap's `undefined` item (section 9): every
// `undefined` in hand-written source must be a deliberate idiom, not a clue
// to unimplemented functionality. Wired into `npm run check` after the
// file-budget gate; offline-safe (plain filesystem walk, no network).
//
// What it enforces:
// - No bare TODO/FIXME markers except ones citing Java's own source comments
//   (the only three in the tree name Java's own FIXME guards, each already
//   implemented beside the citation). A new `// TODO implement X` fails.
// - No `throw new Error` stubs announcing unimplemented work: every throw
//   must carry a real diagnostic (empty-message throws fail).
//
// What it reports (informational, never failing):
// - counts of `undefined` by shape, so a future audit can re-classify them.
//
// Deliberately NOT gated: `T | undefined` lookup-or-missing returns, `??`/
// `?.`/comparison idioms, optional context hooks (`?.()` scene seams), and
// documented Java-mirroring no-ops - the 2026-09-21 audit classified all 525
// hits into those buckets, and `noImplicitReturns` in tsconfig.json now
// proves at compile time that no value-returning path falls off the end
// (the probe was already clean before the flag was enabled).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, out = []) {
	for (const entry of readdirSync(dir)) {
		if (entry === 'generated') continue;
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) { if (!entry.startsWith('.')) walk(path, out); }
		else if (path.endsWith('.ts')) out.push(path);
	}
	return out;
}

const failures = [];
const shapes = { total: 0, nullishOrCompare: 0, typeUnion: 0, other: 0 };
for (const file of walk(join(root, 'src'))) {
	const lines = readFileSync(file, 'utf8').split('\n');
	lines.forEach((line, index) => {
		const at = `${file}:${index + 1}`;
		if (/(^|[^A-Za-z])TODO([^A-Za-z]|$)|FIXME/.test(line) && !/Java/.test(line)) {
			failures.push(`${at}: bare TODO/FIXME marker without a Java citation:\n  ${line.trim()}`);
		}
		if (/throw new Error\(\s*\)/.test(line)) {
			failures.push(`${at}: empty-message throw (stub-shaped):\n  ${line.trim()}`);
		}
		if (!line.includes('undefined')) return;
		shapes.total++;
		if (/\?\? undefined|!== undefined|=== undefined/.test(line)) shapes.nullishOrCompare++;
		else if (/\| undefined|undefined \|/.test(line)) shapes.typeUnion++;
		else shapes.other++;
	});
}

console.log(`undefined audit: ${shapes.total} hits outside src/generated ` +
	`(${shapes.nullishOrCompare} nullish/compare idiom, ${shapes.typeUnion} type-union, ` +
	`${shapes.other} other lookup/return shapes)`);
if (failures.length > 0) {
	console.error('AUDIT-FAIL:\n' + failures.join('\n'));
	process.exit(1);
}
console.log('undefined audit: no bare TODO/FIXME markers, no empty throws.');
