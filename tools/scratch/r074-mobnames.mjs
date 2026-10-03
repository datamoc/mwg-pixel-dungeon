// R074: SPD mob-name authority for boss badges, all locales in one row each.
import fs from 'fs';

const spdSrc = fs.readFileSync('src/generated/spdMessages.ts', 'utf8');
const spdParts = spdSrc.split(/^\t"([a-z]{2}(?:[-_][A-Za-z]+)?)": \{$/m);
const spd = {};
for (let i = 1; i < spdParts.length; i += 2) {
	const vals = {};
	for (const m of spdParts[i + 1].matchAll(/^\t "([^"]+)": "((?:[^"\\]|\\.)*)",?$/gm)) vals[m[1]] = m[2];
	spd[spdParts[i]] = vals;
}

const mobs = ['goo', 'tengu', 'dm300', 'dwarfking', 'yog'];
const portLocales = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh', 'be', 'eo', 'sv', 'zh_hant'];

let out = 'locale  |' + mobs.map((m) => m.padStart(14)).join('') + '\n';
for (const l of portLocales) {
	const sk = l === 'zh_hant' ? 'zh-hant' : l;
	const t = spd[sk] || {};
	const row = mobs.map((m) => {
		const k = 'actors.mobs.' + m + '.name';
		const v = t[k] ?? spd.en[k];
		return String(v === undefined ? 'MISSING' : v).padStart(14);
	}).join('');
	out += l.padEnd(8) + '|' + row + '\n';
}
fs.writeFileSync('tools/scratch/r074-mobnames.txt', out, 'utf8');
console.error(out);
