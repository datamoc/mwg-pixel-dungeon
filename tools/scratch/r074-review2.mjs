// R074 review part 2: port vs SPD for victory + unlock badges (class-name and
// item-name terms), plus the upgrade-scroll item name authority.
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
	for (const m of parts[i + 1].matchAll(/'(port\.badges\.[\w.]+)'\s*:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g)) {
		vals[m[1]] = m[2].slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
	}
	port[name] = vals;
}

const portLocales = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh', 'be', 'eo', 'sv', 'zh_hant'];
const spdKey = (l) => (l === 'zh_hant' ? 'zh-hant' : l);
const spdGet = (key, l) => {
	const t = spd[spdKey(l)] || {};
	return t[key] ?? spd.en[key] ?? null;
};
const hasOverride = (key, l) => (spd[spdKey(l)] || {})[key] !== undefined;

const plan = [
	['victory', 'badges$badge.victory.desc'],
	['unlock_mage', 'badges$badge.unlock_mage.desc'],
	['unlock_rogue', 'badges$badge.unlock_rogue.desc'],
	['unlock_huntress', 'badges$badge.unlock_huntress.desc'],
	['unlock_duelist', 'badges$badge.unlock_duelist.desc'],
	['enemy_hazards', 'badges$badge.enemy_hazards.desc'],
];

let out = '';
for (const [id, key] of plan) {
	const pk = 'port.badges.' + id + '.description';
	out += '\n===== ' + id + ' =====\n';
	out += 'EN port: ' + port.en[pk] + '\n';
	out += 'EN spd : ' + spd.en[key] + (spd.en[key] === undefined ? '   [KEY ABSENT]' : '') + '\n';
	for (const l of portLocales) {
		const pv = (port[l] && port[l][pk]) ?? port.en[pk];
		out += '  ' + l.padEnd(8) + ' | port: ' + pv + '\n';
		if (spd.en[key] === undefined) continue;
		out += '  ' + ''.padEnd(8) + ' |  spd' + (hasOverride(key, l) ? '' : ' (=en)') + ': ' + spdGet(key, l) + '\n';
	}
}

// upgrade scroll item name authority
const usk = 'items.scrolls.scrollofupgrade.name';
out += '\n===== upgrade scroll item name (' + usk + ') =====\n';
out += 'EN: ' + spd.en[usk] + '\n';
for (const l of portLocales) {
	out += '  ' + l.padEnd(8) + (hasOverride(usk, l) ? '    ' : ' (=en)') + ': ' + spdGet(usk, l) + '\n';
}

fs.writeFileSync('tools/scratch/r074-fix-candidates2.txt', out, 'utf8');
console.error('written tools/scratch/r074-fix-candidates2.txt (' + out.split('\n').length + ' lines)');
