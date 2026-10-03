// Maintenance: move closed points out of `ROADMAP.md` into `CLOSED.md`.
// (`ROADMAP.md` and `BACKLOG.md` hold open points only; `CLOSED.md` holds the history.)
//
//   node tools/close-roadmap-section.mjs <section-number> [--apply]   a whole `## N. ...` section
//   node tools/close-roadmap-section.mjs R012 [--apply]               one register item (`- [x] **R012** ...`)
//
// A section moves only when *every* checkbox in it is `- [x]`; a section with even one remaining
// `- [ ]` stays. The moved body lands verbatim (bytes kept, so CRLF files stay CRLF) at the end of
// `CLOSED.md`, and the section (or item line) is REMOVED from `ROADMAP.md` - no stub heading is left
// behind since the 2026-09-26 restructure. An item is moved only when its box is already checked, under
// the "Closed open-coverage items" heading of `CLOSED.md`. `tools/roadmapProgress.js` reads ROADMAP.md,
// BACKLOG.md and CLOSED.md, so closing raises the progress bars. Dry-run by default; `--apply` writes.
// Runs offline, no dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ROADMAP = join(ROOT, 'ROADMAP.md');
const CLOSED = join(ROOT, 'CLOSED.md');

const fail = (message) => {
	console.error(`CLOSE-SECTION FAIL: ${message}`);
	process.exit(1);
};

const target = process.argv[2];
const apply = process.argv.includes('--apply');
const endingOf = (text) => (text.includes('\r\n') ? '\r\n' : '\n');
const stripEnd = (text) => text.replace(/[\r\n]+$/, '');

/** Moves one checked register line (`- [x] **R012** ...`) to CLOSED.md and deletes it from ROADMAP.md. */
function closeItem(id) {
	const rmText = readFileSync(ROADMAP, 'utf8');
	const lines = rmText.split('\n');
	const idx = lines.findIndex((line) => line.startsWith(`- [x] **${id}**`) || line.startsWith(`- [ ] **${id}**`));
	if (idx === -1) fail(`no register item ${id} in ROADMAP.md`);
	if (lines[idx].startsWith('- [ ]')) fail(`${id} is still open (add the coverage row, check its box, then re-run)`);
	const item = lines[idx].replace(/\r$/, '');
	console.log(`item ${id}: ${item.slice(0, 100)}...`);
	if (!apply) {
		console.log('dry run only - pass --apply to move it');
		return;
	}
	lines.splice(idx, 1);
	writeFileSync(ROADMAP, lines.join('\n'));
	const closedText = readFileSync(CLOSED, 'utf8');
	const eol = endingOf(closedText);
	const heading = '## Closed open-coverage items (moved from ROADMAP.md)';
	let closed = stripEnd(closedText) + eol;
	if (!closedText.split('\n').some((line) => line.replace(/\r$/, '') === heading)) {
		closed += eol + heading + eol + eol
			+ 'Register items extracted from PORT_COVERAGE on 2026-09-26 and closed since; the evidence is a row in `coverage/`.' + eol + eol;
	}
	writeFileSync(CLOSED, closed + item + eol);
	console.log(`PASS ${id} moved to CLOSED.md`);
}

if (/^R\d{3}$/.test(target ?? '')) {
	closeItem(target);
	process.exit(0);
}

const number = target;
if (!/^\d+$/.test(number ?? '')) {
	fail('usage: node tools/close-roadmap-section.mjs <section-number | Rnnn> [--apply]');
}

const rmRaw = readFileSync(ROADMAP, 'utf8');
const rm = rmRaw.split('\n');
const headIdx = rm.findIndex((line) => line.startsWith(`## ${number}. `));
if (headIdx === -1) fail(`no '## ${number}. ' heading in ROADMAP.md`);
if (rm.findIndex((line, i) => i !== headIdx && line.startsWith(`## ${number}. `)) !== -1) {
	fail(`multiple '## ${number}. ' headings in ROADMAP.md`);
}
let nextIdx = rm.findIndex((line, i) => i > headIdx && line.startsWith('## '));
if (nextIdx === -1) nextIdx = rm.length;
const body = rm.slice(headIdx + 1, nextIdx);
const trimStart = body.findIndex((line) => line.trim() !== '');
const trimEnd = body.length - [...body].reverse().findIndex((line) => line.trim() !== '');
const content = trimStart === -1 ? [] : body.slice(trimStart, trimEnd);

const boxes = content.filter((line) => /^- \[( |x)\]/.test(line));
const open = boxes.filter((line) => line[3] === ' ');
if (boxes.length === 0) fail(`section ${number} holds no checkboxes - nothing to close`);
if (open.length > 0) {
	for (const line of open.slice(0, 8)) console.error(`  still open: ${line.slice(0, 100)}`);
	fail(`section ${number} still has ${open.length} open checkbox(es) - not moving`);
}

const heading = rm[headIdx].replace(/\r$/, '');
const closedText = readFileSync(CLOSED, 'utf8');
if (closedText.split('\n').some((line) => line.replace(/\r$/, '') === heading)) {
	fail(`CLOSED.md already holds '${heading}' - refusing a duplicate move`);
}

console.log(`section ${number}: '${heading}' - ${boxes.length} closed, 0 open, ${content.length} lines to move`);
console.log(`  first: ${boxes[0].slice(0, 80)}...`);

if (!apply) {
	console.log('dry run only - pass --apply to move it');
	process.exit(0);
}

// Remove the section entirely (heading and body): ROADMAP.md keeps open points only.
writeFileSync(ROADMAP, [...rm.slice(0, headIdx), ...rm.slice(nextIdx)].join('\n'));

const closedEnd = endingOf(closedText);
const movedBlock = [heading, '', ...content.map((line) => line.replace(/\r$/, '')), ''].join(closedEnd);
writeFileSync(CLOSED, stripEnd(closedText) + closedEnd + closedEnd + movedBlock);

// Post-move audit: the heading is gone from ROADMAP.md and present in CLOSED.md.
if (readFileSync(ROADMAP, 'utf8').split('\n').some((line) => line.replace(/\r$/, '') === heading)) fail('heading still in ROADMAP.md');
if (!readFileSync(CLOSED, 'utf8').split('\n').some((line) => line.replace(/\r$/, '') === heading)) fail('heading missing from CLOSED.md');
console.log(`moved ${boxes.length} checkbox(es); section removed from ROADMAP.md`);
console.log(`PASS section ${number} closed into CLOSED.md`);
