// R074 review: build the port-vs-SPD side-by-side for every badge that has an
// SPD authority (boss names, bag names, piranhas, verbatim descs), one locale
// per line, so the fix list can be written against the file rather than memory.
import fs from 'fs';

// ---- SPD_MESSAGES, header allows [a-z]{2}[-_][A-Za-z]+ (zh-hant) ----
const spdSrc = fs.readFileSync('src/generated/spdMessages.ts', 'utf8');
const spdParts = spdSrc.split(/^	"([a-z]{2}(?:[-_][A-Za-z]+)?)": \{$/m);
const spd = {};
for (let i = 1; i < spdParts.length; i += 2) {
	const vals = {};
	for (const m of spdParts[i + 1].matchAll(/^	 "([^"]+)": "((?:[^"\\]|\\.)*)",?$/gm)) vals[m[1]] = m[2];
	spd[spdParts[i]] = vals;
}
console.error('SPD tables: ' + Object.keys(spd).map((k) => k + ':' + Object.keys(spd[k]).length).join(' '));

// ---- port badge descs ----
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

const spdKeyForLocale = (lang) => (lang === 'zh_hant' ? 'zh-hant' : lang);
const spdGet = (key, portLang) => {
	const t = spd[spdKeyForLocale(portLang)] || {};
	return t[key] ?? (spd.en && spd.en[key]) ?? null;
};

const portLocales = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh', 'be', 'eo', 'sv', 'zh_hant'];

// badge -> authority SPD keys (noun authorities) or 'verbatim' (SPD desc == port EN)
const plan = [
	['boss1', ['actors.mobs.goo.name']],
	['boss_challenge_1', ['actors.mobs.goo.name']],
	['boss2', ['actors.mobs.tengu.name']],
	['boss_challenge_2', ['actors.mobs.tengu.name']],
	['boss3', ['actors.mobs.dm300.name']],
	['boss_challenge_3', ['actors.mobs.dm300.name']],
	['boss4', ['actors.mobs.dwarfking.name']],
	['boss_challenge_4', ['actors.mobs.dwarfking.name']],
	['boss_challenge_5', ['actors.mobs.yogdzewa.name']],
	['piranhas', ['actors.mobs.piranha.name', 'badges$badge.piranhas.desc']],
	['bag_velvet', ['items.bags.velvetpouch.name']],
	['bag_holder', ['items.bags.scrollholder.name']],
	['bag_bandolier', ['items.bags.potionbandolier.name']],
	['bag_holster', ['items.bags.magicalholster.name']],
	['happy_end', 'verbatim'],
	['happy_end_remains', 'verbatim'],
	['pacifist_ascent', 'verbatim'],
];

let out = '';
out += 'SPD tables: ' + Object.keys(spd).join(', ') + '\n';
for (const [id, auth] of plan) {
	const pk = 'port.badges.' + id + '.description';
	out += '\n===== ' + id + ' =====\n';
	out += 'EN port: ' + port.en[pk] + '\n';
	if (auth === 'verbatim') {
		out += 'EN spd : ' + spd.en['badges$badge.' + id + '.desc'] + '   [VERBATIM: replace all locales with SPD official]\n';
		for (const l of portLocales) {
			if (l === 'en') continue;
			const v = spdGet('badges$badge.' + id + '.desc', l);
			const hasOverride = (spd[spdKeyForLocale(l)] || {})['badges$badge.' + id + '.desc'] !== undefined;
			out += '  ' + l.padEnd(8) + ' | spd' + (hasOverride ? '' : ' (=en)') + ': ' + v + '\n';
		}
		continue;
	}
	for (const l of portLocales) {
		const pv = (port[l] && port[l][pk]) ?? port.en[pk];
		out += '  ' + l.padEnd(8) + ' | port: ' + pv + '\n';
		for (const ak of auth) {
			const hasOverride = (spd[spdKeyForLocale(l)] || {})[ak] !== undefined;
			out += '  ' + ''.padEnd(8) + ' |  spd' + (hasOverride ? '' : ' (=en)') + ' [' + ak.split('.').pop() + ']: ' + spdGet(ak, l) + '\n';
		}
	}
}
fs.writeFileSync('tools/scratch/r074-fix-candidates.txt', out, 'utf8');
console.error('written tools/scratch/r074-fix-candidates.txt (' + out.split('\n').length + ' lines)');
