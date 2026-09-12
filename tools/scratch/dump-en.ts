/**
 * Developer helper (tools/scratch): dump the EN port-string table as {key: sorted-tokens} JSON.
 *
 * Regenerate `en-keys.json` (committed, because `block-check.mjs` reads it) with:
 *   npx esbuild tools/scratch/dump-en.ts --bundle --platform=node --format=esm
 *     --outfile=tools/scratch/dump-en.mjs && node tools/scratch/dump-en.mjs
 *
 * It is bundled rather than scraping the source text, and it reads the *imported* table: a
 * regex over `portStrings.ts` once mis-read the Italian block's double-quoted values containing
 * escaped quotes and reported two keys as missing that were present all along.
 */
import { writeFileSync } from 'node:fs';
import { PORT_STRINGS_EN } from '../../src/i18n/portStrings';

const tokens = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const out: Record<string, { tokens: string[]; value: string }> = {};
for (const [key, value] of Object.entries(PORT_STRINGS_EN)) out[key] = { tokens: tokens(value), value };

writeFileSync(new URL('en-keys.json', import.meta.url), `${JSON.stringify(out, null, '\t')}\n`);
console.log(`wrote ${Object.keys(out).length} keys`);
