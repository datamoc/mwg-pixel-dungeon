// R074: bag badges - port value vs SPD item name, one line per locale.
import fs from 'fs';

const spdSrc = fs.readFileSync('src/generated/spdMessages.ts', 'utf8');
const spdParts = spdSrc.split(/^\t"([a-z]{2}(?:[-_][A-Za-z]+)?)": \{$/m);
const spd = {};
for (let i = 1; i < spdParts.length; i += 2) {
	const vals = {};
	for (const m of spdParts[i + 1].matchAll(/^\t "([^"]+)": "((?:[^"\\]|\\.)*)",?$/gm)) vals[m[1]] = m[2];
	spd[spdParts[i]] = vals;
}

const portSrc = fs.readFileSync('src/i18n/portStrings.ts', 'utf8');
const parts = portSrc.split(/^export const (PORT_STRINGS_\w+)/m);
const port = {};
for (let i = 1; i < parts.length; i += 2) {
	const name = parts[i].replace('PORT_STRINGS_', '').toLowerCase();
	const vals = {};
	for (const m of parts[i + 1].matchAll(/'(port\.badges\.[\w.]+\.description)'\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g)) {
		vals[m[1]] = m[2].slice(1, -1).replace(/\\'/g, "'");
	}
	port[name] = vals;
}

const bags = [
	['bag_velvet', 'items.bags.velvetpouch.name'],
	['bag_holder', 'items.bags.scrollholder.name'],
	['bag_bandolier', 'items.bags.potionbandolier.name'],
	['bag_holster', 'items.bags.magicalholster.name'],
];
const portLocales = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh', 'be', 'eo', 'sv', 'zh_hant'];

let out = '';
for (const [badge, key] of bags) {
	const pk = 'port.badges.' + badge + '.description';
	out += '\n===== ' + badge + '  (key ' + key + ') =====\n';
	for (const l of portLocales) {
		const sk = l === 'zh_hant' ? 'zh-hant' : l;
		const t = spd[sk] || {};
		const spdV = t[key] ?? spd.en[key];
		out += '  ' + l.padEnd(8) + ' | ' + ((port[l] && port[l][pk]) ?? '(missing)') + '  ||  ' + (spdV === undefined ? 'KEY-ABSENT' : spdV) + (t[key] === undefined ? '  (=en)' : '') + '\n';
	}
}
fs.writeFileSync('tools/scratch/r074-bags.txt', out, 'utf8');
console.error('written tools/scratch/r074-bags.txt (' + out.split('\n').length + ' lines)');
