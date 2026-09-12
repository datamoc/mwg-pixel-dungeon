/**
 * Developer helper (tools/scratch): find characters that never draw ink on their own anywhere in
 * either catalogue - zero-width spaces, BOMs, bidi marks (Unicode `Cf`), line/paragraph
 * separators (`Zl`/`Zp`), and combining marks (`Mn`/`Me`).
 *
 *   npx esbuild tools/scratch/find-invisible.ts --bundle --platform=node --format=esm
 *     --outfile=tools/scratch/find-invisible.mjs && node tools/scratch/find-invisible.mjs
 *
 * Written because a browser glyph-coverage probe flagged two of them as "no glyph" - true, and
 * meaningless, since they are not supposed to have one. Both live in SPD's own tables rather
 * than the port's: Portuguese `scenes.gamescene.blacksmith_quest_window` carries a U+200B ZERO
 * WIDTH SPACE (twice) and Ukrainian `actors.buffs.frost.desc` a U+0301 COMBINING ACUTE (a stress
 * mark). This lists every such character so a future probe can be told to ignore the category
 * rather than a hardcoded exception.
 *
 * Plain non-ASCII *spaces* (U+3000 in Japanese, U+00A0) are deliberately not listed: they are
 * legitimate typography, and the browser probe already skips them via `\s`.
 */
import { PORT_STRINGS } from '../../src/i18n/portStrings';
import { SPD_MESSAGES } from '../../src/generated/spdMessages';

const INKLESS = /[\p{Cf}\p{Mn}\p{Me}\p{Zl}\p{Zp}]/u;

const locales = new Set([...Object.keys(PORT_STRINGS), ...Object.keys(SPD_MESSAGES)]);
let total = 0;

for (const code of locales) {
	for (const [source, table] of [
		[`port.${code}`, PORT_STRINGS[code]],
		[`spd.${code}`, SPD_MESSAGES[code]],
	] as const) {
		for (const [key, value] of Object.entries(table ?? {})) {
			const counts = new Map<string, number>();
			for (const ch of value) if (INKLESS.test(ch)) counts.set(ch, (counts.get(ch) ?? 0) + 1);
			for (const [ch, count] of counts) {
				total += count;
				const cp = ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
				console.log(`${source} ${key}: U+${cp} x${count} in ${JSON.stringify(value.slice(0, 80))}`);
			}
		}
	}
}

console.log(total === 0 ? 'no inkless characters found' : `${total} inkless character occurrence(s)`);
