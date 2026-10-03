// R074: locate the badge description key whose value the simple parser misses,
// then re-dump all badge descriptions for all locales with a robust parser.
import fs from 'fs';

const src = fs.readFileSync('src/i18n/portStrings.ts', 'utf8');
const s = src.indexOf('export const PORT_STRINGS_EN');
const e = src.indexOf('export const PORT_STRINGS_FR');
const body = src.slice(s, e);

const keyScan = [...body.matchAll(/'(port\.badges\.[\w.]+)'\s*:/g)].map((m) => m[1]);
const valScan = [...body.matchAll(/'(port\.badges\.[\w.]+)'\s*:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
console.log('key scan:', keyScan.length, 'value scan:', valScan.length);
const unparsed = keyScan.filter((k) => !valScan.includes(k));
console.log('unparsed:', unparsed);
for (const k of unparsed) {
	const idx = body.indexOf("'" + k + "'");
	console.log('RAW:', JSON.stringify(body.slice(idx, idx + 200)));
}

// Robust per-catalog parse: value may be single- or double-quoted, and several
// keys may share one line (the badge-only catalogs pack 5-8 per line).
const parts = src.split(/^export const (PORT_STRINGS_\w+)/m);
const cats = {};
for (let i = 1; i < parts.length; i += 2) {
	const name = parts[i].replace('PORT_STRINGS_', '');
	const vals = {};
	for (const m of parts[i + 1].matchAll(/'(port\.badges\.[\w.]+)'\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g)) {
		vals[m[1]] = m[2];
	}
	cats[name] = vals;
}
const keys = keyScan;
console.log('parsed keys per locale:', Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, Object.keys(v).length])));

let out = 'KEY COUNT: ' + keys.length + '  LOCALES: ' + Object.keys(cats).length + '\n';
for (const k of keys) {
	out += '\n## ' + k.replace('port.badges.', '').replace('.description', '') + '\n';
	out += 'EN: ' + cats.EN[k] + '\n';
	for (const c of Object.keys(cats)) {
		if (c === 'EN') continue;
		const v = cats[c][k];
		out += c + ': ' + (v === undefined ? '<<MISSING>>' : v) + '\n';
	}
}
fs.writeFileSync('tools/scratch/r074-badge-desc-review.txt', out, 'utf8');
console.log('dump written');
