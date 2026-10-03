// R074: items.amulet.name authority per locale (+ which locales override).
import fs from 'fs';

const spdSrc = fs.readFileSync('src/generated/spdMessages.ts', 'utf8');
const spdParts = spdSrc.split(/^\t"([a-z]{2}(?:[-_][A-Za-z]+)?)": \{$/m);
const spd = {};
for (let i = 1; i < spdParts.length; i += 2) {
	const vals = {};
	for (const m of spdParts[i + 1].matchAll(/^\t "([^"]+)": "((?:[^"\\]|\\.)*)",?$/gm)) vals[m[1]] = m[2];
	spd[spdParts[i]] = vals;
}

const portLocales = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh', 'be', 'eo', 'sv', 'zh_hant'];
const key = 'items.amulet.name';
console.log('sections:', Object.keys(spd).length, Object.keys(spd).join(','));
for (const l of portLocales) {
	const sk = l === 'zh_hant' ? 'zh-hant' : l;
	const t = spd[sk] || {};
	const v = t[key];
	console.log(l.padEnd(8), v === undefined ? '(=en fallback) ' + spd.en[key] : JSON.stringify(v));
}
