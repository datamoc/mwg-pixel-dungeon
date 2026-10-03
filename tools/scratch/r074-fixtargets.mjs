// R074: exact current port values for fix-target badges not yet fully reviewed,
// plus SPD unlock_* desc + upgrade scroll item authority.
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

const portLocales = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh', 'be', 'eo', 'sv', 'zh_hant'];
const badges = ['boss2', 'boss3', 'boss4', 'boss_challenge_2', 'boss_challenge_3', 'boss_challenge_4', 'boss_challenge_5', 'piranhas', 'enemy_hazards', 'unlock_mage', 'unlock_huntress', 'death_trap'];

let out = '';
for (const b of badges) {
	const pk = 'port.badges.' + b + '.description';
	out += '\n===== ' + b + ' =====\n';
	for (const l of portLocales) {
		out += '  ' + l.padEnd(8) + ' | ' + ((port[l] && port[l][pk]) ?? '(missing)') + '\n';
	}
}

// SPD side for unlock badges + upgrade scroll item
const spdKeys = [
	['unlock_mage_desc', 'badges$badge.unlock_mage.desc'],
	['unlock_huntress_desc', 'badges$badge.unlock_huntress.desc'],
	['scrollofupgrade_name', 'items.scrolls.scrollofupgrade.name'],
	['enemy_hazards_desc', 'badges$badge.enemy_hazards.desc'],
];
for (const [label, key] of spdKeys) {
	out += '\n===== spd ' + label + ' =====\n';
	if (spd.en[key] === undefined) { out += '  EN KEY ABSENT\n'; continue; }
	out += '  en       | ' + spd.en[key] + '\n';
	for (const l of portLocales.slice(1)) {
		const sk = l === 'zh_hant' ? 'zh-hant' : l;
		const t = spd[sk] || {};
		out += '  ' + l.padEnd(8) + (t[key] === undefined ? '(=en) ' : '| ') + (t[key] ?? spd.en[key]) + '\n';
	}
}

fs.writeFileSync('tools/scratch/r074-fixtargets.txt', out, 'utf8');
console.error('written tools/scratch/r074-fixtargets.txt (' + out.split('\n').length + ' lines)');
