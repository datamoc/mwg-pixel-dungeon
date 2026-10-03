// R017 closure splice (private-index protocol): ROADMAP line deleted, CLOSED entry appended,
// notes-04's cut sentence restored with the closure. R017 was a harvest artifact: the row
// declares the PsionicBlast guard "genuinely not applicable, not merely unguarded" - a non-gap.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const cat = (p) => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { maxBuffer: 1 << 28 }).toString('utf8');
mkdirSync('tools/scratch/r017', { recursive: true });

const count = (text, needle) => text.split(needle).length - 1;

// --- ROADMAP.md: delete the R017 open line only -----------------------------
let roadmap = cat('ROADMAP.md');
const lines = roadmap.split('\n');
const hits = lines.filter((l) => l.startsWith('- [ ] **R017** '));
if (hits.length !== 1) throw new Error(`expected exactly 1 R017 line in HEAD ROADMAP, got ${hits.length}`);
roadmap = lines.filter((l) => !l.startsWith('- [ ] **R017** ')).join('\n');
writeFileSync('tools/scratch/r017/ROADMAP.md', roadmap);

// --- CLOSED.md: append the R017 closure entry after HEAD's tail -------------
const entry = [
	'',
	'- [x] **R017** _(Genuinely not applicable, not merely unguarded - the ScrollOfPsionicBlast magicImmune guard (notes-04-core-combat))_ Closed 2026-10-01 as a non-gap: the harvest misread notes-04\'s "Genuinely not applicable, not merely unguarded" declaration as an open residual - the guard was never missing because the port has no `ScrollOfPsionicBlast` at all (only the `alchemy.ts` exotic-counterpart label), and the exotic-scroll recipes are decided Not ported (rows-items-consumables-and-crafting R082, 2026-09-29), so no guard target can arise within decided scope. History: harvested into ROADMAP with its sentence cut mid-clause, leaving notes-04 reading "not (open residual ...) scroll)"; that row is repaired to the full sentence in the same commit.',
].join('\n');

const appendEntry = (label, text) => {
	if (text.includes('**R017**')) throw new Error(`${label}: CLOSED already has an R017 entry`);
	const base = text.endsWith('\n') ? text : text + '\n';
	return base + entry.slice(1) + '\n';
};
writeFileSync('tools/scratch/r017/CLOSED.md', appendEntry('HEAD CLOSED', cat('CLOSED.md')));
// keep the shared worktree copy in step (this session's own append; peers' uncommitted
// entries in it are preserved - we append after whatever is there).
const wtClosed = readFileSync('CLOSED.md', 'utf8');
writeFileSync('CLOSED.md', appendEntry('worktree CLOSED', wtClosed));

// --- notes-04-core-combat.md: restore the cut sentence ----------------------
const oldSeg = '**Genuinely not applicable, not\n(open residual moved to `ROADMAP.md` R017)\nscroll),';
const newSeg = [
	'**Genuinely not applicable, not merely unguarded** - no code exists to add a guard to:',
	'`ScrollOfPsionicBlast` (unported exotic scroll; the exotic-scroll recipes were decided Not',
	'ported 2026-09-29 under R082, so no guard target can arise - R017 closed as a non-gap',
	'2026-10-01),',
].join('\n');
const notes = cat('coverage/notes-04-core-combat.md');
if (count(notes, oldSeg) !== 1) throw new Error(`notes-04: expected 1 old segment in HEAD, got ${count(notes, oldSeg)}`);
const wtNotes = readFileSync('coverage/notes-04-core-combat.md', 'utf8').replace(/\r\n/g, '\n');
if (count(wtNotes, newSeg) !== 1) throw new Error('notes-04: worktree repair not found');
writeFileSync('tools/scratch/r017/notes-04-core-combat.md', notes.replace(oldSeg, newSeg));

console.log('spliced: tools/scratch/r017/{ROADMAP.md,CLOSED.md,notes-04-core-combat.md}');
