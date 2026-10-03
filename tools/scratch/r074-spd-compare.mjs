// R074 review probe: compare every port badge description against SPD's own
// translations (spdMessages.ts) for (a) verbatim-identical EN strings and
// (b) proper-noun / item-name authority per locale.
import fs from 'fs';

// ---- parse SPD_MESSAGES (lang tables, only non-EN overrides + full EN) ----
const spdSrc = fs.readFileSync('src/generated/spdMessages.ts', 'utf8');
const spdParts = spdSrc.split(/^	"([a-z]{2}(?:_[A-Za-z]+)?)"\: \{$/m);
const spd = {};
for (let i = 1; i < spdParts.length; i += 2) {
	const lang = spdParts[i];
	const body = spdParts[i + 1];
	const vals = {};
	for (const m of body.matchAll(/^	 "([^"]+)": "((?:[^"\\]|\\.)*)",?$/gm)) vals[m[1]] = m[2];
	spd[lang] = vals;
}
console.error('SPD lang tables:', Object.keys(spd).map((l) => l + ':' + Object.keys(spd[l]).length).join(' '));

// ---- parse port badge descs ----
const portSrc = fs.readFileSync('src/i18n/portStrings.ts', 'utf8');
const parts = portSrc.split(/^export const (PORT_STRINGS_\w+)/m);
const port = {};
for (let i = 1; i < parts.length; i += 2) {
	const name = parts[i].replace('PORT_STRINGS_', '').toLowerCase();
	const vals = {};
	for (const m of parts[i + 1].matchAll(/'(port\.badges\.[\w.]+)'\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g)) {
		vals[m[1]] = m[2].slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
	}
	port[name] = vals;
}
const portLocales = Object.keys(port);
const spdLocales = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh', 'be', 'eo', 'sv'];

const spdGet = (key, lang) => {
	const table = spd[lang] || {};
	return table[key] ?? (spd.en && spd.en[key]) ?? null;
};

// ---- (a) verbatim-EN keys: SPD desc identical to port EN? ----
console.error('\n=== (a) verbatim-EN keys ===');
for (const pk of ['port.badges.happy_end.description', 'port.badges.happy_end_remains.description', 'port.badges.pacifist_ascent.description']) {
	const spdKey = 'badges$badge.' + pk.replace('port.badges.', '').replace('.description', '') + '.desc';
	const same = spd.en[spdKey] === port.en[pk];
	console.error(same ? 'MATCH  ' : 'DIFFER ', pk, same ? '' : JSON.stringify({ port: port.en[pk], spd: spd.en[spdKey] }));
}

// ---- (b) proper-noun authority ----
const nounAuthority = [
	['Goo', 'actors.mobs.goo.name'],
	['Tengu', 'actors.mobs.tengu.name'],
	['DM-300', 'actors.mobs.dm300.name'],
	['DwarfKing', 'actors.mobs.dwarfking.name'],
	['Yog', 'actors.mobs.yogdzewa.name'],
	['piranha-badge', 'badges$badge.piranhas.desc'],
	['velvetPouch', 'items.bags.velvetpouch.name'],
	['scrollHolder', 'items.bags.scrollholder.name'],
	['potionBandolier', 'items.bags.potionbandolier.name'],
	['magicalHolster', 'items.bags.magicalholster.name'],
];
let out = '\n=== (b) noun authority: EN / per-locale official ===\n';
for (const [label, key] of nounAuthority) {
	out += `\n## ${label} (${key})\n`;
	if (!spd.en[key]) { out += '  KEY ABSENT from SPD_MESSAGES\n'; continue; }
	for (const l of spdLocales) {
		const v = spdGet(key, l);
		out += '  ' + l + ': ' + v + '\n';
	}
}
fs.writeFileSync('tools/scratch/r074-spd-authority.txt', out, 'utf8');
console.error('authority dump -> tools/scratch/r074-spd-authority.txt');

// ---- (c) per-locale side-by-side of full badge descs (port vs spd where a
// same-id badge desc exists) for the matching-id subset ----
let c = '';
for (const pk of Object.keys(port.en)) {
	const id = pk.replace('port.badges.', '').replace('.description', '');
	const spdKey = 'badges$badge.' + id + '.desc';
	if (!spd.en[spdKey]) continue;
	c += `\n## ${id}  portEN=${JSON.stringify(port.en[pk])}  spdEN=${JSON.stringify(spd.en[spdKey])}\n`;
	for (const l of spdLocales) {
		const pv = (port[l] && port[l][pk]) ?? (port.en[pk]);
		const sv = spdGet(spdKey, l);
		c += '  ' + l + ' | port: ' + pv + ' | spd: ' + sv + '\n';
	}
}
fs.writeFileSync('tools/scratch/r074-same-id-badges.txt', c, 'utf8');
console.error('same-id dump -> tools/scratch/r074-same-id-badges.txt');
