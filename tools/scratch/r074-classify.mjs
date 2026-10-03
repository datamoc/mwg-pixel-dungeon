// R074 commit prep: classify every worktree-vs-HEAD hunk in portStrings.ts.
// - count badge description keys per locale section
// - list non-'port.' added lines grouped
// - show the PORT_CLERIC_ARMOR_FALLBACK line diff tail
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const wt = readFileSync('src/i18n/portStrings.ts', 'utf8');
const head = execSync('git show HEAD:src/i18n/portStrings.ts', { maxBuffer: 64e6 }).toString();

// --- per-locale badge description counts (sections are `export const PORT_STRINGS_XX:`) ---
function badgeCounts(src) {
	const re = /export const PORT_STRINGS_([A-Z0-9_]+):/g;
	const marks = [];
	let m;
	while ((m = re.exec(src))) marks.push({ locale: m[1], idx: re.lastIndex });
	const out = [];
	for (let i = 0; i < marks.length; i++) {
		const start = marks[i].idx;
		const end = i + 1 < marks.length ? marks[i + 1].idx : src.length;
		const body = src.slice(start, end);
		const n = (body.match(/'port\.badges\.[a-z0-9_]+\.description':/g) || []).length;
		out.push(`${marks[i].locale.toLowerCase().replace('_', '-')}=${n}`);
	}
	return out;
}
console.log('BADGE COUNTS (worktree): ' + badgeCounts(wt).join(' '));
console.log('BADGE COUNTS (HEAD):     ' + badgeCounts(head).join(' '));

// distinct badge keys in EN
const en = wt.slice(wt.indexOf('PORT_STRINGS_EN:'), wt.indexOf('export const PORT_STRINGS_FR'));
const enKeys = en.match(/'port\.badges\.[a-z0-9_]+\.description':/g) || [];
console.log('EN badge desc keys: ' + enKeys.length);

// --- PORT_CLERIC_ARMOR_FALLBACK line: common prefix/suffix diff ---
const line = (s) => s.split('\n').find((l) => l.startsWith('const PORT_CLERIC_ARMOR_FALLBACK'));
const a = line(head), b = line(wt);
let p = 0;
while (p < a.length && p < b.length && a[p] === b[p]) p++;
let q = 0;
while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
console.log('CONST HEAD-middle: ...' + a.slice(p, a.length - q));
console.log('CONST WT  -middle: ...' + b.slice(p, b.length - q));

// --- added lines not matching 'port.' key entries ---
const diff = execSync('git diff HEAD -U0 -- src/i18n/portStrings.ts', { maxBuffer: 64e6 }).toString();
const adds = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
const other = adds.filter((l) => !/^\+\s+'port\./.test(l));
console.log(`NON-KEY ADDED LINES: ${other.length}`);
for (const l of other) console.log('  ' + l.slice(0, 150));
