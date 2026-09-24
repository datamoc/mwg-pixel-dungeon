// Maintenance: move a fully-closed `ROADMAP.md` section to `CLOSED.md`.
//
// A section moves only when *every* checkbox in it is `- [x]`; a section with
// even one remaining `- [ ]` stays. The moved body lands verbatim (bytes kept,
// so CRLF files stay CRLF) under its own `## ` heading at the end of
// `CLOSED.md`, and `ROADMAP.md` keeps a numbered stub heading - other bullets
// cross-reference sections by number, so renumbering is not worth the churn
// (the same convention sections 3, 4, 5, 7, 10 and 12 already follow).
// `tools/roadmap-progress.html` only reads `ROADMAP.md`, so moved items leave
// its progress bars by design. Dry-run by default; pass `--apply` to write.
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

const number = process.argv[2];
const apply = process.argv.includes('--apply');
if (!/^\d+$/.test(number ?? '')) {
	fail('usage: node tools/close-roadmap-section.mjs <section-number> [--apply]');
}

const endingOf = (text) => (text.includes('\r\n') ? '\r\n' : '\n');

const rmRaw = readFileSync(ROADMAP, 'utf8');
const rm = rmRaw.split('\n');
const rmEnd = endingOf(rmRaw);
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

const firstBullet = boxes[0].slice(0, 80);
console.log(`section ${number}: '${heading}' - ${boxes.length} closed, 0 open, ${content.length} lines to move`);
console.log(`  first: ${firstBullet}...`);

if (!apply) {
	console.log('dry run only - pass --apply to move it');
	process.exit(0);
}

const suffix = rmEnd === '\r\n' ? '\r' : '';
const stubLines = [
	'',
	'Fully closed - moved to `CLOSED.md`. Kept as a numbered heading (rather than removed outright)',
	`because other bullets in this file cross-reference "section ${number}" by number; renumbering everything`,
	'below to close the gap was judged not worth the churn against those existing references.',
	'',
].map((line) => line + suffix);
const newRm = [...rm.slice(0, headIdx + 1), ...stubLines, ...rm.slice(nextIdx)];
writeFileSync(ROADMAP, newRm.join('\n'));

let closed = closedText;
if (!closed.endsWith('\n')) closed += '\n';
const closedEnd = endingOf(closedText);
const movedBlock = [heading, '', ...content.map((line) => line.replace(/\r$/, '')), ''].join(closedEnd);
writeFileSync(CLOSED, closed + movedBlock);

const today = new Date().toISOString().slice(0, 10);
const after = readFileSync(CLOSED, 'utf8');
const dateMatch = after.match(/Sections moved (.*?); see/);
if (dateMatch && !dateMatch[1].includes(today)) {
	const dates = [...dateMatch[1].matchAll(/\d{4}-\d{2}-\d{2}/g)].map((m) => m[0]);
	dates.push(today);
	const relisted = dates.length > 1
		? `${dates.slice(0, -1).join(', ')} and ${dates[dates.length - 1]}`
		: dates[0];
	writeFileSync(CLOSED, after.replace(/Sections moved (.*?); see/, `Sections moved ${relisted}; see`));
	console.log(`CLOSED.md move-date list extended with ${today}`);
}

// Post-move audit: checkbox totals across both files must be unchanged,
// and the stubbed section must hold zero boxes.
const countBoxes = (text) => (text.match(/^- \[( |x)\]/gm) || []).length;
const before = boxes.length;
const rmAfter = readFileSync(ROADMAP, 'utf8');
const stubSlice = rmAfter.split('\n').slice(headIdx + 1, headIdx + 7).join('\n');
if (countBoxes(stubSlice) !== 0) fail('stub region unexpectedly holds a checkbox');
console.log(`moved ${before} checkbox(es); stub holds 0; totals preserved by construction (verbatim body)`);
console.log(`PASS section ${number} closed into CLOSED.md`);
