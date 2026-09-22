// Imports SPD v3.3.8's own MiningLevel/Blacksmith-quest strings, with
// their shipped translations, under `port.*` keys (the generated catalogue predates them), as
// `src/i18n/portMineStrings.ts`, which `portStrings.ts` merges into `PORT_STRINGS`.
// Run: node tools/importMineStrings.mjs <spd-checkout>
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const spd = process.argv[2];
const TAG = 'refs/tags/v3.3.8';
const LOCALES = ['fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh'];
const BLACKSMITH = ['intro_quest_warrior', 'intro_quest_mage', 'intro_quest_rogue', 'intro_quest_huntress', 'intro_quest_duelist', 'intro_quest_cleric',
	'intro_quest_start', 'intro_quest_crystal', 'intro_quest_gnoll', 'reminder', 'reminder_crystal', 'reminder_gnoll',
	'exit_warn_none', 'exit_warn_low', 'exit_warn_med', 'exit_warn_high', 'exit_warn_full', 'exit_warn_crystal', 'exit_warn_gnoll', 'exit_yes', 'exit_no',
	'entrance_blocked', 'quest_start_prompt', 'enter_yes', 'enter_no'];
const MINING = ['wall_desc', 'gold_extra_desc', 'crystal_name', 'boulder_name', 'crystal_desc', 'boulder_desc', 'barricade_desc'];
const KEYS = [
	...BLACKSMITH.map((k) => ['actors', `actors.mobs.npcs.blacksmith.${k}`, `port.blacksmith.${k}`]),
	...MINING.map((k) => ['levels', `levels.mininglevel.${k}`, `port.mininglevel.${k}`]),
	['levels', 'levels.rooms.quest.mineentrance$questexit.name', 'port.mininglevel.exit_name'],
	['levels', 'levels.rooms.quest.mineentrance$questexit.desc', 'port.mininglevel.exit_desc'],
	['items', 'items.quest.darkgold.you_now_have', 'port.darkgold.you_now_have'],
];

function props(domain, locale) {
	const file = `core/src/main/assets/messages/${domain}/${domain}${locale ? `_${locale}` : ''}.properties`;
	const text = execFileSync('git', ['-C', spd, 'show', `${TAG}:${file}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
	const out = new Map();
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trimStart();
		if (!line || line.startsWith('#') || line.startsWith('!')) continue;
		const split = line.indexOf('=');
		if (split < 0) continue;
		const value = line.slice(split + 1).replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, e) =>
			e[0] === 'u' ? String.fromCharCode(parseInt(e.slice(1), 16)) : e === 'n' ? '\n' : e);
		out.set(line.slice(0, split).trim().toLowerCase(), value);
	}
	return out;
}

//`%d`/`%1$d` -> the named `{count}` token this file uses (only `you_now_have` carries one).
const placeholders = (v) => v.replace(/%(?:1\$)?d/g, '{count}');
//Real newlines, as the generated SPD catalogue stores them: emitted as the `\n` escape.
const literal = (v) => `'${v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, "\\'")}'`;

const cache = new Map();
const lookup = (domain, locale) => {
	const id = `${domain}:${locale}`;
	if (!cache.has(id)) cache.set(id, props(domain, locale));
	return cache.get(id);
};

function entries(locale) {
	return KEYS.map(([domain, key, portKey]) => {
		const value = lookup(domain, locale).get(key) ?? lookup(domain, '').get(key);
		if (value === undefined) throw new Error(`missing ${key}`);
		return `		'${portKey}': ${literal(placeholders(value))},`;
	}).join('\n');
}

const out = [
	'/**',
	" * SPD v3.3.8's own MiningLevel/Blacksmith-quest text and its shipped translations (the Java",
	" * `actors`/`levels`/`items` message bundles at that tag), which the generated catalogue predates.",
	' * Kept apart from `portStrings.ts` (whose file budget it would break) and merged into',
	' * `PORT_STRINGS` there. Regenerate with `tools/importMineStrings.mjs <spd-checkout>`.',
	' */',
	'export const PORT_MINE_STRINGS: Readonly<Record<string, Readonly<Record<string, string>>>> = {',
	...['', ...LOCALES].map((locale) => `\t${locale || 'en'}: {\n${entries(locale)}\n\t},`),
	'};',
	'',
].join('\n');
writeFileSync('src/i18n/portMineStrings.ts', out);
console.log('wrote src/i18n/portMineStrings.ts:', KEYS.length, 'keys x', LOCALES.length + 1, 'catalogues');
