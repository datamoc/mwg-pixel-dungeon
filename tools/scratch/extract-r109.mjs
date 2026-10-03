// Scratch: extract R109-only hunks from shared files for the private-index
// commit. Prints the kept hunks for review; writes patches under /tmp/r109.
// NOT committed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = '/tmp/r109';
mkdirSync(OUT, { recursive: true });

function diff(file) {
	return execFileSync('git', ['-c', 'core.autocrlf=false', 'diff', 'HEAD', '-U3', '--', file], { encoding: 'utf8' });
}
function parseHunks(text) {
	const lines = text.split('\n');
	const header = lines.slice(0, 4);
	const hunks = [];
	let cur = null;
	for (const line of lines.slice(4)) {
		if (line.startsWith('@@')) { cur = [line]; hunks.push(cur); }
		else if (cur) cur.push(line);
	}
	// A diff's trailing newline splits into a phantom '' line - drop it so the
	// emitted hunk line counts stay exact.
	for (const h of hunks) while (h.length > 1 && h[h.length - 1] === '') h.pop();
	return { header, hunks };
}
const added = (h) => h.filter((l) => l.startsWith('+') && !l.startsWith('+++'));
const removed = (h) => h.filter((l) => l.startsWith('-') && !l.startsWith('---'));

function emit(file, kept) {
	const { header } = parseHunks(diff(file));
	const patch = `${[...header, ...kept.flatMap((h) => h)].join('\n')}\n`;
	const name = `${OUT}/${file.replaceAll('/', '_')}.patch`;
	writeFileSync(name, patch);
	console.log(`=== ${file}: kept ${kept.length} hunk(s) -> ${name}`);
	for (const h of kept) console.log(h.join('\n'));
	console.log('');
}

const keepAddedMatch = (file, re) => {
	const { hunks } = parseHunks(diff(file));
	emit(file, hunks.filter((h) => added(h).some((l) => re.test(l))));
};

keepAddedMatch('src/combat.ts', /eaming/);
keepAddedMatch('src/scenes/dungeon/hero/inventoryQuickslot.ts', /eaming/);
keepAddedMatch('src/generated/mwlContent.ts', /beamingRayBoost/);
keepAddedMatch('ROADMAP.md', /\*\*R109\*\*/);
keepAddedMatch('coverage/rows-hero-and-armor-abilities.md', /Ported \(R109/);

// coreSpawnTiles: keep the save hunk whole; strip the foreign allyDefendCell
// pair out of the load hunk, keeping only the beamingRayTarget line.
{
	const file = 'src/scenes/dungeon/coreSpawnTiles.ts';
	const { hunks } = parseHunks(diff(file));
	const kept = [];
	for (const h of hunks) {
		const a = added(h);
		if (!a.some((l) => /eamingRayTarget/.test(l))) continue;
		const r = removed(h);
		if (r.length === 0) { kept.push(h); continue; }
		// Load hunk: drop the allyDefendCell -/+ pair, keep the rest.
		const body = h.slice(1).filter((l) => !/allyDefendCell: saved\.allyDefendCell/.test(l));
		const oldCount = body.filter((l) => !l.startsWith('+')).length;
		const newCount = body.filter((l) => !l.startsWith('-')).length;
		const oldStart = Number(h[0].match(/@@ -(\d+),/)[1]);
		const newStart = Number(h[0].match(/\+(\d+),/)[1]);
		kept.push([`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`, ...body]);
	}
	emit(file, kept);
}
