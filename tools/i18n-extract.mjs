/**
 * Builds `src/generated/spdMessages.ts` from SPD's own `.properties` translation files.
 *
 * SPD ships 171 property files - 9 domains x English plus 18 locales, ~3,750 base keys - and
 * this port now ships every one of them. Everything here is inlined into `game.js` (the built
 * page runs from `file://`, where `fetch` is unavailable, so a locale cannot be loaded on
 * demand and *every* language ships in the bundle). That makes the complete corpus materially
 * larger, but guarantees that implementing a Java screen never leaves its original text absent
 * from the browser catalog.
 *
 * The key set is scraped from `t('...')` call sites rather than maintained by hand, so the
 * shipped catalog cannot drift from what the code asks for. `tools/i18nCheck.ts` re-derives
 * the same set and fails if the committed file no longer covers it.
 *
 * Run with `npm run i18n`. The output is committed, so a plain `npm run build` neither needs
 * the Java tree nor pays for re-parsing 171 files.
 *
 * Provenance: the strings this reads are SPD's own, GPL-3.0-or-later, from
 * `core/src/main/assets/messages/` in this same checkout. They stay inside `web-mwg/` and
 * must never be copied into `mwg` - see CLAUDE.md's licensing boundary.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, '..');
const messages = join(web, '..', 'core', 'src', 'main', 'assets', 'messages');

/** the 9 domains `Messages.java`'s `prop_files` loads, in its own order */
const DOMAINS = ['actors', 'items', 'journal', 'levels', 'misc', 'plants', 'scenes', 'ui', 'windows'];

/**
 * `Languages.java`'s real codes, minus English (the base). `in` is Indonesian's code in SPD's
 * files; BCP-47 calls it `id`, which is the mapping `src/i18n/languages.ts` carries for
 * `Intl.PluralRules` - here we only need the filename suffix.
 */
const LOCALES = ['zh', 'ko', 'ru', 'es', 'de', 'fr', 'pt', 'pl', 'it', 'tr', 'ja', 'uk', 'cs', 'in', 'nl', 'hu', 'vi', 'el'];

/**
 * Parses one `.properties` file the way libGDX's `I18NBundle` does for these files.
 *
 * SPD's files are UTF-8 with CRLF, one `key=value` per line, `=` always the separator, and -
 * verified across all 171 files - no backslash line continuations, so a value never spans
 * lines. Keys may contain `$` (Java inner classes, e.g. `championenemy$blazing`). Values
 * carry `\n`, `\t` and `\uXXXX` escapes, which are unescaped here so the runtime never has to.
 *
 * `Messages.get` lowercases every key before lookup, so keys are lowercased on the way in too.
 */
function parseProperties(text) {
	const out = new Map();
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (line === '' || line.startsWith('#') || line.startsWith('!')) continue;

		const split = line.indexOf('=');
		if (split < 0) continue;

		const key = line.slice(0, split).trim().toLowerCase();
		out.set(key, unescapeValue(line.slice(split + 1)));
	}
	return out;
}

function unescapeValue(value) {
	return value.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, escape) => {
		if (escape[0] === 'u') return String.fromCharCode(parseInt(escape.slice(1), 16));
		switch (escape) {
			case 'n':
				return '\n';
			case 't':
				return '\t';
			case 'r':
				return '\r';
			default:
				//covers \\, \=, \: and \ before anything else - the character itself
				return escape;
		}
	});
}

/**
 * Rewrites Java `String.format` placeholders into the `{token}` form `mwg/i18n` interpolates.
 *
 * `Messages.format` runs `String.format(Locale.ENGLISH, ...)`, so a value can hold `%s`,
 * `%d`, width/precision flags, `%%` for a literal percent, and explicit `%1$s` argument
 * indices - which translators reorder freely, since word order differs by language. Both
 * forms collapse to positional `{0}`, `{1}`, ... so a caller passes `t(key, {0: name})`
 * regardless of which language is active and where that language puts the token.
 */
function convertPlaceholders(value) {
	let next = 0;
	return value.replace(/%(?:(\d+)\$)?[-+ 0,(#]*\d*(?:\.\d+)?([a-zA-Z%])/g, (whole, index, conversion) => {
		if (conversion === '%') return '%';
		//an explicit index is 1-based in Java; an implicit one consumes the next argument
		const position = index !== undefined ? Number(index) - 1 : next++;
		return `{${position}}`;
	});
}

/**
 * Strips comments, so prose that merely *mentions* a key - `t('key')` in a doc comment - is
 * not mistaken for a call site.
 */
function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
}

/**
 * Every SPD message key the port references. The returned set is still useful as a source audit,
 * but `wanted` below now unions it with the complete base catalog.
 *
 * Two shapes, because the port asks for keys two ways. Most names are reached through the
 * lookup tables in `src/i18n/spdKeys.ts`, where the key is a *value* rather than an argument,
 * so every string literal in that file counts. Everything else is a literal `t('...')` call.
 * Keys under `port.` are the port's own and live in `portStrings.ts`, so they are filtered out
 * by the caller rather than looked for here.
 */
async function referencedKeys() {
	const keys = new Set();
	const roots = [join(web, 'src')];
	const keyTable = join(web, 'src', 'i18n', 'spdKeys.ts');

	while (roots.length > 0) {
		const dir = roots.pop();
		for (const entry of await readdir(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name !== 'assets' && entry.name !== 'generated') roots.push(path);
				continue;
			}
			if (!entry.name.endsWith('.ts')) continue;

			const source = stripComments(await readFile(path, 'utf8'));
			if (path === keyTable) {
				//the lookup tables: every literal in the file is a key
				for (const match of source.matchAll(/'([^']+)'/g)) keys.add(match[1]);
				continue;
			}
			for (const match of source.matchAll(/\bt\(\s*'([^']+)'/g)) keys.add(match[1]);
			for (const match of source.matchAll(/\bt\(\s*"([^"]+)"/g)) keys.add(match[1]);
		}
	}
	return keys;
}

async function readLocale(suffix) {
	const merged = new Map();
	for (const domain of DOMAINS) {
		const name = suffix === '' ? `${domain}.properties` : `${domain}_${suffix}.properties`;
		let text;
		try {
			text = await readFile(join(messages, domain, name), 'utf8');
		} catch {
			//a domain may simply not be translated for a locale; the base fills in at runtime
			continue;
		}
		//`Messages.getFromBundle` walks the domains in order and takes the first hit, so an
		//earlier domain wins a duplicate key
		for (const [key, value] of parseProperties(text)) if (!merged.has(key)) merged.set(key, value);
	}
	return merged;
}

const base = await readLocale('');
const referenced = await referencedKeys();
const wanted = [...new Set([...base.keys(), ...referenced])].filter((key) => !key.startsWith('port.')).sort();

const missing = wanted.filter((key) => !base.has(key));
if (missing.length > 0) {
	console.error(`these keys are referenced but exist in no SPD properties file:\n  ${missing.join('\n  ')}`);
	//Do not overwrite the committed generated catalog with a partial result. The old behavior
	//reported the audit failure but continued into writeFile(), leaving the next build with a
	//small, silently incomplete SPD catalog. A failed source audit is therefore transactional:
	//the caller must fix the missing Java-side keys (or deliberately move a port-only key under
	//port.*) before generation can replace the last known-good artifact.
	process.exit(1);
}

const catalogs = {};
for (const suffix of ['', ...LOCALES]) {
	const table = await readLocale(suffix);
	const picked = {};
	for (const key of wanted) {
		const value = table.get(key);
		//omit anything a locale does not translate, rather than storing the English twice -
		//`mwg/i18n` already falls back to the base catalog for a missing key
		if (value === undefined) continue;
		if (suffix !== '' && value === base.get(key)) continue;
		picked[key] = convertPlaceholders(value);
	}
	catalogs[suffix === '' ? 'en' : suffix] = picked;
}

const header = `/**
 * GENERATED by tools/i18n-extract.mjs - do not edit by hand; run \`npm run i18n\`.
 *
 * SPD's own translations for exactly the keys this port references, one table per language.
 * A locale only carries the keys it actually translates differently from English; everything
 * else resolves through \`mwg/i18n\`'s fallback to the base catalog.
 *
 * These strings are SPD's, GPL-3.0-or-later, from core/src/main/assets/messages/ in this
 * checkout. They belong to web-mwg and must never be copied into mwg (see CLAUDE.md).
 *
 * Java \`%s\`/\`%d\`/\`%1$s\` placeholders are rewritten as positional \`{0}\`, \`{1}\`, ... so a
 * caller passes \`t(key, { 0: value })\` no matter where a language puts the token.
 */

`;

const body = Object.entries(catalogs)
	.map(([locale, table]) => `\t${JSON.stringify(locale)}: ${JSON.stringify(table, null, 1).replace(/\n/g, '\n\t')},`)
	.join('\n');

await mkdir(join(web, 'src', 'generated'), { recursive: true });
await writeFile(
	join(web, 'src', 'generated', 'spdMessages.ts'),
	`${header}export const SPD_MESSAGES: Record<string, Record<string, string>> = {\n${body}\n};\n`,
	'utf8'
);

const counts = Object.entries(catalogs).map(([locale, table]) => `${locale}:${Object.keys(table).length}`);
console.log(`wrote src/generated/spdMessages.ts - ${wanted.length} keys referenced`);
console.log(`per-locale entries (only where a locale differs from English): ${counts.join(' ')}`);
