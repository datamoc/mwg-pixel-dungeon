/**
 * Developer helper (tools/scratch): dump the facts the browser locale check needs.
 *
 * Regenerate `locale-probe.json` (committed, because `browser-locales.mjs` reads it) with:
 *   npx esbuild tools/scratch/dump-locale-chars.ts --bundle --platform=node --format=esm
 *     --outfile=tools/scratch/dump-locale-chars.mjs && node tools/scratch/dump-locale-chars.mjs
 *
 * Writes:
 *  - `font`: the game's font-family stack, read out of `spdTheme.ts` - the stack is an inline
 *    array literal inside `applySpdTheme`, so it is read as source rather than imported, which
 *    also keeps this bundle free of Pixi
 *  - `chars`: per locale, the unique non-ASCII codepoints its port catalogue and SPD's own
 *    translated table use, so a browser pass can ask whether the shipped fonts have glyphs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PORT_STRINGS } from '../../src/i18n/portStrings';
import { SPD_MESSAGES } from '../../src/generated/spdMessages';

const themeSource = readFileSync(new URL('../../src/ui/spdTheme.ts', import.meta.url), 'utf8');
const familyBlock = /font:\s*\{\s*family:\s*\[([\s\S]*?)\]/.exec(themeSource);
if (!familyBlock) throw new Error('could not find the font family array in spdTheme.ts');
const font = [...familyBlock[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
if (font.length < 10) throw new Error(`only ${font.length} font families scraped; expected the whole stack`);

const chars: Record<string, string[]> = {};
// every locale either catalogue knows about, so the probe covers SPD-only locales (Greek,
// Chinese, Korean) too, not just those with a port draft
for (const code of new Set([...Object.keys(PORT_STRINGS), ...Object.keys(SPD_MESSAGES)])) {
	const seen = new Set<string>();
	for (const value of Object.values(PORT_STRINGS[code] ?? {})) {
		for (const ch of value) if (ch.codePointAt(0)! > 127) seen.add(ch);
	}
	// also cover SPD's own text for the locale, which is the bulk of what a player reads
	for (const value of Object.values(SPD_MESSAGES[code] ?? {})) {
		for (const ch of value) if (ch.codePointAt(0)! > 127) seen.add(ch);
	}
	chars[code] = [...seen].sort();
}

writeFileSync(
	new URL('locale-probe.json', import.meta.url),
	`${JSON.stringify({ font, chars }, null, '\t')}\n`
);
console.log(`wrote locale-probe.json: ${Object.keys(chars).length} locales, ${font.length}-entry font stack`);
for (const [code, list] of Object.entries(chars)) console.log(`  ${code}: ${list.length} distinct non-ASCII chars`);
