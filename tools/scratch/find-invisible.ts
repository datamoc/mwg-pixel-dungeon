// Throwaway: find zero-width / format characters in the pt catalogues and say where they are.
import { PORT_STRINGS } from '../../src/i18n/portStrings';
import { SPD_MESSAGES } from '../../src/generated/spdMessages';

for (const [source, table] of [['port.pt', PORT_STRINGS.pt], ['spd.pt', SPD_MESSAGES.pt], ['port.en', PORT_STRINGS.en], ['spd.en', SPD_MESSAGES.en]]) {
	const hits: string[] = [];
	for (const [key, value] of Object.entries(table ?? {})) {
		for (const ch of value) {
			const cp = ch.codePointAt(0)!;
			// Cf (format), Zs/Zl/Zp (separators) other than a plain space, and the BOM
			if (/\p{Cf}|\p{Zl}|\p{Zp}/u.test(ch) || (/\p{Zs}/u.test(ch) && ch !== ' ') || cp === 0xfeff) {
				hits.push(`${key}: U+${cp.toString(16).toUpperCase().padStart(4, '0')} (${JSON.stringify(ch)})`);
			}
		}
	}
	console.log(`${source}: ${hits.length} invisible-character hit(s)`);
	for (const hit of hits.slice(0, 12)) console.log(`  ${hit}`);
}
