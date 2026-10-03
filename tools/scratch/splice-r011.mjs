// R011 closure commit splices: HEAD blob + own hunks only (AGENTS.md private-index
// protocol) for the three peer-shared files. The code files are untouched this time.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const cat = (p) => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { maxBuffer: 1 << 28 }).toString('utf8');
// Chain onto the R061 re-land when it exists (this repo's ref was moved out from
// under those commits once already; the chain reproduces the original two-commit order).
const catOr = (p, chained) => {
	try { return readFileSync(chained, 'utf8'); } catch { return cat(p); }
};
mkdirSync('tools/scratch/r011', { recursive: true });

// --- ROADMAP.md: delete the R011 open line only -----------------------------
let roadmap = catOr('ROADMAP.md', 'tools/scratch/r061/ROADMAP.md');
const lines = roadmap.split(/\r?\n/).filter((l) => l.startsWith('- [ ] **R011** '));
if (lines.length !== 1) throw new Error(`expected exactly 1 open R011 line in HEAD ROADMAP, got ${lines.length}`);
const esc = lines[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
roadmap = roadmap.replace(new RegExp(esc + '\\r?\\n'), '');
if (roadmap.includes('**R011**')) throw new Error('R011 still present after deletion');
writeFileSync('tools/scratch/r011/ROADMAP.md', roadmap);

// --- CLOSED.md: append the R011 closure entry after HEAD's tail -------------
let closed = catOr('CLOSED.md', 'tools/scratch/r061/CLOSED.md');
if (closed.includes('**R011**')) throw new Error('HEAD CLOSED.md already carries R011');
if (!closed.endsWith('\n')) closed += '\n';
const entry = readFileSync('tools/scratch/r011-closed-entry.md', 'utf8').replace(/^\n+/, '');
closed += '\n' + entry;
writeFileSync('tools/scratch/r011/CLOSED.md', closed);

// --- notes-03: the stale "moved to ROADMAP R011" pointer names the closure ---
let notes = cat('coverage/notes-03-simulation-extraction.md');
const oldP = '(open residual moved to `ROADMAP.md` R011)';
const newP = '(the `chalice` clause this residual pointed to - real SPD content, correct `chaliceofblood` key - was implemented 2026-09-14, see below)';
const n = notes.split(oldP).length - 1;
if (n !== 1) throw new Error(`expected exactly 1 R011 pointer in HEAD notes-03, got ${n}`);
notes = notes.replace(oldP, newP);
writeFileSync('tools/scratch/r011/notes-03-simulation-extraction.md', notes);

console.log('splices written: tools/scratch/r011/{ROADMAP.md,CLOSED.md,notes-03-simulation-extraction.md}');
