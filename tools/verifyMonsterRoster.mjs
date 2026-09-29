import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/content/dungeon-rosters.mwl', import.meta.url), 'utf8');
const implementation = readFileSync(new URL('../src/monsters.ts', import.meta.url), 'utf8');
const rosterTable = source.match(/id: "monsterRosterByDepth"[\s\S]*?children: \[([\s\S]*?)\n        \],\n      \},/);
assert.ok(rosterTable, 'MWL has the standard per-depth mob roster table');
assert.doesNotMatch(source, /monsterRosterFallback/, 'regional fallback table is removed');

const rosters = new Map([...rosterTable[1].matchAll(/depth: (\d+),\s+roster: "([^"]+)"/g)]
	.map(([, depth, roster]) => [Number(depth), roster.split(',')]));
assert.deepEqual([...rosters.keys()].sort((a, b) => a - b), Array.from({ length: 26 }, (_, i) => i + 1),
	'Java rotation rows cover every supported depth, including boss floors and depth 26');
for (const [bossDepth, precedingDepth] of [[5, 4], [10, 9], [15, 14], [20, 19], [25, 24]]) {
	assert.deepEqual(rosters.get(bossDepth), rosters.get(precedingDepth), `depth ${bossDepth} shares depth ${precedingDepth} roster`);
}
assert.match(implementation, /if \(!direct\) throw new Error\(`MWL dungeon roster has no Java depth row/,
	'missing supported depth fails instead of silently choosing another region');
assert.doesNotMatch(implementation, /ROSTER_FALLBACK|monsterRosterFallback/);

console.log('PASS monster rotations explicitly cover depths 1–26 and match Java boss-floor roster sharing.');
