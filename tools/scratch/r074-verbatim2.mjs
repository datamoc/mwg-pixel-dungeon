// R074: dump port values for the two remaining verbatim badges (all locales).
import fs from 'fs';

const src = fs.readFileSync('src/i18n/portStrings.ts', 'utf8');
const parts = src.split(/^export const (PORT_STRINGS_\w+)/m);
for (let i = 1; i < parts.length; i += 2) {
	const name = parts[i].replace('PORT_STRINGS_', '').toLowerCase();
	const vals = {};
	for (const m of parts[i + 1].matchAll(/'(port\.badges\.(?:happy_end_remains|pacifist_ascent)\.description)'\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g)) {
		vals[m[1]] = m[2];
	}
	if (vals['port.badges.pacifist_ascent.description']) {
		console.log(name.padEnd(8), vals['port.badges.happy_end_remains.description'], '||', vals['port.badges.pacifist_ascent.description']);
	}
}
