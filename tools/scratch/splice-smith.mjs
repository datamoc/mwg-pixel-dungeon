// Throwaway (tools/scratch): the Blacksmith's smith-service strings, spliced like the others.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SPD = process.env.SPD_ROOT ?? 'C:/Users/miche/dev/shattered-pixel-dungeon';
const TAG = process.env.TAG ?? 'v3.3.8';
const LOCALES = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh'];
const KEYS = {
	smith: 'windows.wndblacksmith.smith',
	verify: 'windows.wndblacksmith.smith_verify',
	yes: 'windows.wndblacksmith.smith_yes',
	no: 'windows.wndblacksmith.smith_no',
	prompt: 'windows.wndblacksmith$wndsmith.prompt',
};

function table(locale) {
	const file = `core/src/main/assets/messages/windows/windows${locale === 'en' ? '' : `_${locale}`}.properties`;
	const text = execFileSync('git', ['-C', SPD, 'show', `${TAG}:${file}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
	const out = {};
	for (const line of text.split(/\r?\n/)) {
		const at = line.indexOf('=');
		if (at > 0 && !line.trimStart().startsWith('#')) out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
	}
	return out;
}

const convert = (value, locale, key, expectFavor) => {
	const placeholders = (value.match(/%d/g) ?? []).length;
	if (expectFavor && placeholders !== 1) throw new Error(`${locale} ${key}: expected one %d, found ${placeholders}`);
	if (!expectFavor && placeholders !== 0) throw new Error(`${locale} ${key}: expected no %d`);
	return value.replace('%d', '{favor}').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
};

const values = {};
for (const locale of LOCALES) {
	const windows = table(locale);
	values[locale] = {
		smith: convert(windows[KEYS.smith], locale, KEYS.smith, true),
		verify: convert(windows[KEYS.verify], locale, KEYS.verify, false),
		yes: convert(windows[KEYS.yes], locale, KEYS.yes, false),
		no: convert(windows[KEYS.no], locale, KEYS.no, false),
		prompt: convert(windows[KEYS.prompt], locale, KEYS.prompt, false),
	};
}

const path = 'src/i18n/portStrings.ts';
let source = readFileSync(path, 'utf8');
const anchor = "'port.blacksmith.cashout.no'";
for (const locale of LOCALES) {
	const marker = `export const PORT_STRINGS_${locale.toUpperCase()}`;
	const start = source.indexOf(marker);
	if (start < 0) throw new Error(`no block for ${locale}`);
	const at = source.indexOf(anchor, start);
	if (at < 0) throw new Error(`no anchor in ${locale}`);
	const end = source.indexOf('\n', at);
	const v = values[locale];
	const block = [
		`\t'port.blacksmith.smith': '${v.smith}',`,
		`\t'port.blacksmith.smith.verify': '${v.verify}',`,
		`\t'port.blacksmith.smith.yes': '${v.yes}',`,
		`\t'port.blacksmith.smith.no': '${v.no}',`,
		`\t'port.blacksmith.smith.prompt': '${v.prompt}',`,
	].join('\n');
	source = source.slice(0, end) + '\n' + block + source.slice(end);
}
writeFileSync(path, source);
console.log(`inserted 5 keys x ${LOCALES.length} locales`);
