/**
 * Developer helper (tools/scratch): emit one locale's catalogue as a block fragment.
 *
 *   npx esbuild tools/scratch/dump-locale.ts --bundle --platform=node --format=esm
 *     --outfile=tools/scratch/dump-locale.mjs
 *   node tools/scratch/dump-locale.mjs nl > tools/scratch/nl.block.txt
 *   node tools/scratch/block-check.mjs nl tools/scratch/nl.block.txt
 *
 * Prints the body of `export const PORT_STRINGS_<XX> = { ... }` - one single-line
 * `\t'key': 'value',` entry per key, in EN order - which is the format `block-check.mjs`
 * validates, `splice-block.mjs` consumes, and a draft agent is asked to produce. Dumping a
 * *finished* locale and checking it is how `block-check.mjs` itself was validated.
 */
import { PORT_STRINGS } from '../../src/i18n/portStrings';

const code = process.argv[2];
const catalog = PORT_STRINGS[code];
if (!catalog) {
	console.error(`no catalogue for ${code}`);
	process.exit(2);
}
const quote = (text: string): string => (text.includes("'") && !text.includes('"') ? `"${text}"` : `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);
for (const [key, value] of Object.entries(catalog)) console.log(`\t'${key}': ${quote(value)},`);
