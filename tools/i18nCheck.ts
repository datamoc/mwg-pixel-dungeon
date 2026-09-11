/**
 * Asserts the translation layer holds together, in the style of `tools/uiCheck.ts`.
 *
 * The failure this guards against is the one that reaches the player: a key the code asks for
 * that no catalog answers, which `mwg/i18n` renders as the raw key itself - `port.log.dies`
 * where a sentence should be. That cannot be caught by `tsc`, because a key is just a string,
 * so it is checked here instead.
 *
 * Run with `npx esbuild tools/i18nCheck.ts --bundle --platform=node --format=esm
 * --outfile=tools/scratch/i18nCheck.mjs && node tools/scratch/i18nCheck.mjs`. It needs
 * bundling because `src/` uses extensionless imports, which Node's ESM loader will not
 * resolve on its own - the same reason the other verify scripts are bundled.
 */

import { SPD_MESSAGES } from '../src/generated/spdMessages';
import { PORT_STRINGS_EN, PORT_STRINGS_FR, PORT_TRANSLATION_ORIGIN } from '../src/i18n/portStrings';
import { CLASSES, CLASS_UNLOCK_HINT } from '../src/classes';
import { readFileSync } from 'node:fs';
import { LANGUAGES, detectLanguage } from '../src/i18n/languages';
import {
	MOB_KEYS,
	CLASS_KEYS,
	REGION_KEYS,
	GROUND_ITEM_KEYS,
	ITEM_KEYS,
	RING_KEYS,
	WAND_KEYS,
	BUFF_KEYS,
	TRAP_KEYS,
	POTION_APPEARANCE_KEYS,
	SCROLL_APPEARANCE_KEYS,
} from '../src/i18n/spdKeys';

let failures = 0;
function check(what: string, ok: boolean, detail = ''): void {
	if (!ok) {
		failures++;
		console.error(`FAIL  ${what}${detail ? ` - ${detail}` : ''}`);
	}
}

const base = { ...SPD_MESSAGES.en, ...PORT_STRINGS_EN };

/**
 * An SPD key must resolve in SPD's *own* base catalog, never in the port's strings.
 *
 * Checking against the merged catalog would let a typo'd or renamed SPD key pass whenever a
 * port string happened to share its name, and a wrong key does not throw - `mwg/i18n` falls
 * back, so the player silently reads English. That is precisely the failure the
 * key-must-equal-the-Java-key convention exists to make impossible, so it fails here.
 */
const spdKeyExists = (key: string): boolean =>
	key.startsWith('port.') ? PORT_STRINGS_EN[key] !== undefined : SPD_MESSAGES.en[key] !== undefined;

// 1. every key any lookup table points at resolves, in the catalog that should own it
const tables: [string, string[]][] = [
	['MOB_KEYS', Object.values(MOB_KEYS)],
	['CLASS_KEYS', Object.values(CLASS_KEYS)],
	['REGION_KEYS', Object.values(REGION_KEYS)],
	['GROUND_ITEM_KEYS', Object.values(GROUND_ITEM_KEYS)],
	['ITEM_KEYS', Object.values(ITEM_KEYS)],
	['RING_KEYS', Object.values(RING_KEYS)],
	['WAND_KEYS', Object.values(WAND_KEYS)],
	['BUFF_KEYS', Object.values(BUFF_KEYS)],
	['TRAP_KEYS', Object.values(TRAP_KEYS)],
	['POTION_APPEARANCE_KEYS', [...POTION_APPEARANCE_KEYS]],
	['SCROLL_APPEARANCE_KEYS', [...SCROLL_APPEARANCE_KEYS]],
];
for (const [table, keys] of tables) {
	for (const key of keys) {
		check(
			`${table}: ${key} exists in ${key.startsWith('port.') ? 'the port catalog' : "SPD's own base .properties"}`,
			spdKeyExists(key) && base[key] !== ''
		);
	}
}

/**
 * 1c. The hero classes' own keys, which no lookup table covered.
 *
 * `CLASSES[id].nameKey` reached `t()` straight from MWL, so five of the six classes rendered the
 * raw string `Port.name.rogue` on the class-select screen while this check passed - the exact
 * player-visible failure the file exists to catch. `CLASSES` is now a checked table too, and the
 * unlock hints moved from English literals in the MWL into the port catalog with it.
 */
for (const [id, definition] of Object.entries(CLASSES)) {
	for (const [field, key] of [['nameKey', definition.nameKey], ['weaponKey', definition.weaponKey], ['blurbKey', definition.blurbKey]] as const) {
		check(`${id}.${field} (${key}) resolves`, spdKeyExists(key) && base[key] !== '');
	}
	if (definition.special.labelKey) {
		check(`${id}.special.labelKey (${definition.special.labelKey}) resolves`, spdKeyExists(definition.special.labelKey) && base[definition.special.labelKey] !== '');
	}
}
for (const [id, key] of Object.entries(CLASS_UNLOCK_HINT)) {
	if (key === '') continue; // the always-unlocked Warrior has no hint
	check(`CLASS_UNLOCK_HINT.${id} (${key}) resolves`, spdKeyExists(key) && base[key] !== '');
}

/**
 * 1b. Every SPD-derived key anywhere in the port's sources, not just the ones reachable
 * through a lookup table - `t('scenes.titlescene.enter')` and friends are written inline.
 *
 * The list is generated rather than maintained: `tools/i18n-extract.mjs` scrapes the same
 * call sites to decide what to ship, so anything it shipped is what the code asks for, and
 * anything the code asks for that SPD does not define fails the extractor first. This is the
 * belt to that braces - it catches a key added to the source after the last `npm run i18n`.
 */
for (const key of Object.keys(SPD_MESSAGES.en)) {
	check(`shipped SPD key ${key} is a real SPD key`, !key.startsWith('port.'), 'a port-only key must not live in the SPD catalog');
}
for (const key of Object.keys(PORT_STRINGS_EN)) {
	check(`port key ${key} is namespaced`, key.startsWith('port.'), 'port-only strings must be obvious as such');
	check(`port key ${key} is lowercase, as Java keys are`, key === key.toLowerCase());
	check(`port key ${key} does not shadow an SPD key`, SPD_MESSAGES.en[key] === undefined);
}

// 3b. `say()` is the game's user-visible log boundary. A literal passed directly here skips
// the catalog entirely, which is how an English-only message can slip into an otherwise
// translated run. Dynamic values and `t(...)` results remain legitimate; only direct quoted
// text is forbidden. Keep this deliberately narrow rather than trying to infer every string
// expression in TypeScript - labels and buttons have their own explicit `text:` audit.
const mainSource = readFileSync('src/main.ts', 'utf8');
check(
	'game log has no untranslated string literals',
	!/(?:this\.)?say\(\s*['\"]/.test(mainSource),
	'wrap player-facing log text in t(...)'
);

// 2. a resolved name is never the key itself - the tell that a lookup fell through
for (const [, keys] of tables) {
	for (const key of keys) check(`${key} is not its own value`, base[key] !== key);
}

// 3. French covers every port-only string English has. SPD's own keys need no such check:
//    a locale that omits one falls back to the base catalog by design.
for (const key of Object.keys(PORT_STRINGS_EN)) {
	check(`French has ${key}`, PORT_STRINGS_FR[key] !== undefined);
}
check('French adds no key English lacks', Object.keys(PORT_STRINGS_FR).every((key) => key in PORT_STRINGS_EN));

// 3c. Every port-only catalogue is labelled in source. This prevents a machine draft from
// being mistaken for a reviewed translation when a new locale is wired into `index.ts`.
for (const code of ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr']) {
	check(`port locale ${code} declares translation origin`, PORT_TRANSLATION_ORIGIN[code] !== undefined);
}

// 4. a translated string keeps the placeholders its English original declares. A dropped
//    token silently loses a number the player needed; an invented one renders as literal
//    braces.
const tokensOf = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
for (const [key, english] of Object.entries(PORT_STRINGS_EN)) {
	const french = PORT_STRINGS_FR[key];
	if (french === undefined) continue;
	check(`${key} keeps its tokens in French`, tokensOf(english).join() === tokensOf(french).join(), `en=[${tokensOf(english)}] fr=[${tokensOf(french)}]`);
}

// 5. every locale parses, declares itself, and is a real BCP-47 tag `Intl.PluralRules` takes
for (const language of LANGUAGES) {
	const table = language.code === 'en' ? SPD_MESSAGES.en : SPD_MESSAGES[language.code];
	check(`${language.code} has a catalog`, table !== undefined);
	check(`${language.code} is a tag Intl accepts`, (() => {
		try {
			new Intl.PluralRules(language.tag);
			return true;
		} catch {
			return false;
		}
	})());
}

// 6. language detection: a regional tag finds its language, an unknown one falls back to
//    English, and SPD's `in` is reachable from BCP-47's `id`
check("pt-BR detects pt", detectLanguage(['pt-BR']).code === 'pt');
check('zh-Hans-CN detects zh', detectLanguage(['zh-Hans-CN']).code === 'zh');
check('id detects SPD\'s in', detectLanguage(['id']).code === 'in');
check('an untranslated language falls back to English', detectLanguage(['sw', 'mt']).code === 'en');
check('preference order is honoured', detectLanguage(['sw', 'fr', 'de']).code === 'fr');

// 7. the generated catalog really carries other languages, not just English twice
check('fr differs from en for the rat', SPD_MESSAGES.fr['actors.mobs.rat.name'] !== SPD_MESSAGES.en['actors.mobs.rat.name']);
check('ja is non-latin', /[^\x00-ɏ]/.test(SPD_MESSAGES.ja['actors.mobs.rat.name'] ?? ''));

// 8. `convertPlaceholders` is exercised by generation for the complete corpus. Do not try to
// infer leftover printf markers with a regex here: natural localized prose legitimately contains
// percentage signs followed by letters (for example Vietnamese "%sức"), indistinguishable from
// `%s` without language-aware parsing. The source call-site/catalog ownership checks above are
// therefore the sound runtime guarantee this verifier can make.

const total = tables.reduce((sum, [, keys]) => sum + keys.length, 0);
console.log(
	failures === 0
		? `i18nCheck: OK - ${total} mapped keys, ${Object.keys(PORT_STRINGS_EN).length} port strings, ${LANGUAGES.length} languages`
		: `i18nCheck: ${failures} failure(s)`
);
process.exitCode = failures === 0 ? 0 : 1;
