/**
 * Throwaway (tools/scratch): validate one locale draft block against the EN port-string table.
 *
 * Usage: node tools/scratch/block-check.mjs <localeCode> <fragmentPath>
 *
 * The fragment holds only the body of `export const PORT_STRINGS_<XX> = { ... }`:
 * one `\t'key': 'value',` line per entry, in EN's own order, no comments. Values must stay on a
 * single line so this parser (and a reviewer's eye) can read them without a TS grammar.
 */
import { readFileSync } from 'node:fs';

const [code, fragmentPath] = process.argv.slice(2);
if (!code || !fragmentPath) {
	console.error('usage: node tools/scratch/block-check.mjs <localeCode> <fragmentPath>');
	process.exit(2);
}

const en = JSON.parse(readFileSync(new URL('en-keys.json', import.meta.url), 'utf8'));
const fragment = readFileSync(fragmentPath, 'utf8');

const entryRe = /^\t'((?:[^'\\]|\\.)*)':[ ]*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"),\s*$/;
const seen = [];
const values = new Map();
let failures = 0;
const fail = (message) => {
	failures++;
	console.error(`FAIL  ${message}`);
};

for (const line of fragment.split(/\r?\n/)) {
	if (line === '') continue;
	const match = entryRe.exec(line);
	if (!match) {
		// A continuation line is the usual cause: a value wrapped onto a second line.
		fail(`not a single-line \`\\t'key': 'value',\` entry: ${line.slice(0, 100)}`);
		continue;
	}
	const key = match[1];
	if (!(key in en)) fail(`unknown key ${key}`);
	if (values.has(key)) fail(`duplicate key ${key}`);
	seen.push(key);
	values.set(key, match[2].slice(1, -1));
}

const enKeys = Object.keys(en);
if (seen.length !== enKeys.length) fail(`has ${seen.length} entries, EN has ${enKeys.length}`);
const missing = enKeys.filter((key) => !values.has(key));
if (missing.length) fail(`${missing.length} missing: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', ...' : ''}`);
const extra = seen.filter((key) => !(key in en));
for (const key of extra.slice(0, 10)) fail(`extra ${key}`);

const tokens = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
for (const [key, entry] of Object.entries(en)) {
	const value = values.get(key);
	if (value === undefined) continue;
	const got = tokens(value).join();
	if (got !== entry.tokens.join()) fail(`${key} tokens [${got}] != EN [${entry.tokens.join()}]`);
	if (value.trim() === '') fail(`${key} is empty`);
}

// order must match EN exactly, so a reviewer diffing the two blocks sees them line up
const sameOrder = seen.length === enKeys.length && seen.every((key, i) => key === enKeys[i]);
if (!sameOrder) fail('key order differs from EN');

console.log(
	failures === 0
		? `${code}: OK - ${seen.length} keys, tokens match EN, order matches EN`
		: `${code}: ${failures} failure(s)`
);
process.exitCode = failures === 0 ? 0 : 1;
