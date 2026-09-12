// Throwaway (tools/scratch): the Blacksmith's upgrade and cash-out strings, spliced the same way
// the harden ones were - SPD's own v3.3.8 text and translations, `%d` -> the port's `{favor}`.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SPD = process.env.SPD_ROOT ?? 'C:/Users/miche/dev/shattered-pixel-dungeon';
const TAG = process.env.TAG ?? 'v3.3.8';
const LOCALES = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh'];
const KEYS = {
	upgrade: 'windows.wndblacksmith.upgrade',
	cashout: 'windows.wndblacksmith.cashout',
	cashoutVerify: 'windows.wndblacksmith.cashout_verify',
	cashoutYes: 'windows.wndblacksmith.cashout_yes',
	cashoutNo: 'windows.wndblacksmith.cashout_no',
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

/** `%d` -> `{favor}`; only the two service labels carry one */
function convert(value, locale, key, expectFavor) {
	const placeholders = (value.match(/%d/g) ?? []).length;
	if (expectFavor && placeholders !== 1) throw new Error(`${locale} ${key}: expected one %d, found ${placeholders}`);
	if (!expectFavor && placeholders !== 0) throw new Error(`${locale} ${key}: expected no %d`);
	return value.replace('%d', '{favor}').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

const values = {};
for (const locale of LOCALES) {
	const windows = table(locale);
	values[locale] = {
		upgrade: convert(windows[KEYS.upgrade], locale, KEYS.upgrade, true),
		cashout: convert(windows[KEYS.cashout], locale, KEYS.cashout, false),
		cashoutVerify: convert(windows[KEYS.cashoutVerify], locale, KEYS.cashoutVerify, true),
		cashoutYes: convert(windows[KEYS.cashoutYes], locale, KEYS.cashoutYes, false),
		cashoutNo: convert(windows[KEYS.cashoutNo], locale, KEYS.cashoutNo, false),
	};
}

const path = 'src/i18n/portStrings.ts';
let source = readFileSync(path, 'utf8');
const anchor = "'port.item.hardened.armor'";
for (const locale of LOCALES) {
	const marker = `export const PORT_STRINGS_${locale.toUpperCase()}`;
	const start = source.indexOf(marker);
	if (start < 0) throw new Error(`no block for ${locale}`);
	const at = source.indexOf(anchor, start);
	if (at < 0) throw new Error(`no anchor in ${locale}`);
	const end = source.indexOf('\n', at);
	const v = values[locale];
	const block = [
		`\t'port.blacksmith.upgrade': '${v.upgrade}',`,
		`\t'port.blacksmith.cashout': '${v.cashout}',`,
		`\t'port.blacksmith.cashout.verify': '${v.cashoutVerify}',`,
		`\t'port.blacksmith.cashout.yes': '${v.cashoutYes}',`,
		`\t'port.blacksmith.cashout.no': '${v.cashoutNo}',`,
	].join('\n');
	source = source.slice(0, end) + '\n' + block + source.slice(end);
}
writeFileSync(path, source);
console.log(`inserted 5 keys x ${LOCALES.length} locales`);
