/**
 * Throwaway (tools/scratch): splice one locale's draft block into `src/i18n/portStrings.ts`.
 *
 * Usage: node tools/scratch/splice-block.mjs <code> <LanguageName>
 *
 * Reads `tools/scratch/<code>.block.txt` (the body the draft agent wrote and `block-check.mjs`
 * validated), wraps it in `export const PORT_STRINGS_<XX> = { ... };` and inserts it - with a doc
 * comment naming the language - immediately before the `PORT_STRINGS` assembly comment. Also
 * registers the locale in `PORT_STRINGS` and `PORT_TRANSLATION_ORIGIN`.
 *
 * Refuses to run if the locale is already registered, so a second run cannot double-insert.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [code, languageName] = process.argv.slice(2);
if (!code || !languageName) {
	console.error('usage: node tools/scratch/splice-block.mjs <code> <LanguageName>');
	process.exit(2);
}

const path = new URL('../../src/i18n/portStrings.ts', import.meta.url);
const rawSource = readFileSync(path, 'utf8');
// git's default core.autocrlf=true checks this file out CRLF; normalize for the edits below and
// restore the original convention on write, so the splice does not show up as a whole-file diff.
const crlf = rawSource.includes('\r\n');
let source = rawSource.replace(/\r\n/g, '\n');
const constName = `PORT_STRINGS_${code.toUpperCase().replace(/-/g, '_')}`;

if (source.includes(`export const ${constName}:`)) {
	console.error(`refusing: ${constName} is already in portStrings.ts`);
	process.exit(1);
}

const body = readFileSync(new URL(`./${code}.block.txt`, import.meta.url), 'utf8').replace(/\s+$/, '');
const block = `/**
 * MT: ${languageName} (\`${code}\`), status \`unreviewed\` per SPD's own convention
 * (\`languages.ts\`). MT: machine-translated draft, not a native speaker's pass - adapted
 * key-by-key from \`PORT_STRINGS_EN\`, every \`{placeholder}\` token preserved exactly (checked
 * programmatically by \`tools/i18nCheck.ts\`), but not proofread by a fluent speaker. Flag this
 * status honestly rather than silently upgrading it to \`complete\` - it matches SPD's own
 * complete/unreviewed/unfinished distinction, which exists precisely so a machine-drafted locale
 * is never confused with a reviewed one.
 */

export const ${constName}: Record<string, string> = {
${body}
};

`;

const anchor = '/**\n * Every port-only catalogue, keyed by SPD\'s language code';
if (!source.includes(anchor)) {
	console.error('refusing: could not find the PORT_STRINGS assembly comment anchor');
	process.exit(1);
}
source = source.replace(anchor, `${block}${anchor}`);

// register in the assembly map. The anchor must name `PORT_STRINGS:` exactly - `PORT_STRINGS_EN`
// also starts with `PORT_STRINGS`, and a loose match spliced into the first locale block instead.
const mapLine = `\t${code}: ${constName},\n`;
const mapClose = /(\nexport const PORT_STRINGS: Readonly<Record<string, Readonly<Record<string, string>>>> = \{[\s\S]*?\n)\};/;
if (!mapClose.test(source)) {
	console.error('refusing: could not find the PORT_STRINGS map body');
	process.exit(1);
}
source = source.replace(mapClose, (_, body) => `${body}${mapLine}};`);

// register provenance, which i18nCheck requires for every catalogue
const originClose = /(\nexport const PORT_TRANSLATION_ORIGIN[\s\S]*?\n)\};/;
if (!originClose.test(source)) {
	console.error('refusing: could not find PORT_TRANSLATION_ORIGIN');
	process.exit(1);
}
source = source.replace(originClose, (_, body) => `${body}\t${code}: 'machine',\n};`);

writeFileSync(path, crlf ? source.replace(/\n/g, '\r\n') : source, 'utf8');
console.log(`spliced ${constName} (${body.split('\n').length} entries) and registered '${code}'`);
