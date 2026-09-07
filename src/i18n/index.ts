/**
 * The port's translation layer: `mwg/i18n` for the mechanism, SPD's own `.properties` for the
 * words.
 *
 * `mwg/i18n` supplies the catalog shape, `{token}` interpolation, CLDR plural selection and
 * the fallback to a base language, so none of that is reimplemented here. What this module
 * adds is SPD-specific: assembling a catalog per language out of the generated SPD tables plus
 * this port's own strings, choosing the language, and Java's own capitalisation rules, which
 * are language-dependent and therefore belong with the text rather than at each call site.
 *
 * Everything ships in the bundle. The built page runs from `file://`, where `fetch` is
 * unavailable, so a language cannot be fetched on demand and all 19 are compiled in - which is
 * why `tools/i18n-extract.mjs` ships only the keys the port actually references.
 */

import { I18n } from 'mwg';
import { SPD_MESSAGES } from '../generated/spdMessages';
import { PORT_STRINGS_EN, PORT_STRINGS_FR } from './portStrings';
import { LANGUAGES, detectLanguage, languageByCode, type Language } from './languages';

export { LANGUAGES, languageByCode, type Language, type LanguageStatus } from './languages';
export * from './spdKeys';

/** re-exported so call sites read `t('key')` rather than reaching through `I18n` */
export const t = I18n.t;
export const has = I18n.has;

/**
 * This port's own strings, per language.
 *
 * Only English and French are written; every other language resolves them through the base
 * catalog, so a Russian player reads SPD's Russian *names* inside English sentences. That is a
 * real gap and PORT_COVERAGE.md records it as one.
 */
const PORT_STRINGS: Record<string, Record<string, string>> = {
	en: PORT_STRINGS_EN,
	fr: PORT_STRINGS_FR,
};

/**
 * SPD ships no right-to-left language, so every catalog here is left-to-right. The direction
 * is still declared per catalog rather than hardcoded at the `mwg/ui` layer, because that is
 * the field `mwg/ui` lays out against - but it means RTL is entirely unexercised by this port,
 * not supported-and-tested.
 */
function catalogFor(language: Language): I18n.Catalog {
	return {
		locale: language.tag,
		direction: 'ltr',
		messages: {
			...(SPD_MESSAGES[language.code] ?? {}),
			...(PORT_STRINGS[language.code] ?? {}),
		},
	};
}

let current: Language = LANGUAGES[0];

export function language(): Language {
	return current;
}

/**
 * Installs English as the base and `language` as the active catalog.
 *
 * English is always the base, so a key missing from a translation falls back to English rather
 * than showing the player a raw key.
 */
export function setLanguage(language: Language): void {
	current = language;
	I18n.setBase(catalogFor(LANGUAGES[0]));
	I18n.setActive(language.code === 'en' ? null : catalogFor(language));
}

/**
 * Picks the starting language: a previously saved choice, else the browser's preferences.
 *
 * A saved choice wins, because someone who overrode the automatic pick meant it.
 */
export function initI18n(saved?: string | null): Language {
	const chosen = (saved ? languageByCode(saved) : undefined) ?? detectLanguage(navigator.languages ?? [navigator.language]);
	setLanguage(chosen);
	return chosen;
}

/** the next language in `LANGUAGES`, for cycling through them from the title screen */
export function nextLanguage(from: Language = current): Language {
	const index = LANGUAGES.findIndex((entry) => entry.code === from.code);
	return LANGUAGES[(index + 1) % LANGUAGES.length];
}

/**
 * `Messages.capitalize` - uppercases the first character, in the active locale.
 *
 * The locale matters: Turkish maps `i` to `İ`, not `I`, which is exactly the sort of thing that
 * looks fine in English and wrong to a Turkish reader.
 */
export function capitalize(text: string): string {
	if (text.length === 0) return text;
	return text.charAt(0).toLocaleUpperCase(current.tag) + text.slice(1);
}

/**
 * Words `Messages.java`'s `titleCase` leaves lowercase - mostly prepositions that show up in
 * item names. SPD's own list, and its own note that it is not comprehensive.
 */
const NO_CAPS = new Set(['a', 'an', 'and', 'of', 'by', 'to', 'the', 'x', 'for']);

/**
 * `Messages.titleCase` - English capitalises every word but a few; every other language uses
 * sentence case.
 *
 * That split is SPD's, and it is a real linguistic difference rather than an oversight: title
 * case is an English convention, and applying it to French or German would be wrong.
 */
export function titleCase(text: string): string {
	if (current.code !== 'en') return capitalize(text);

	//split after any unicode space, keeping the space with the word before it, as Java does
	const words = text.split(/(?<=\s)/);
	const cased = words
		.map((word) => (NO_CAPS.has(word.trim().toLowerCase().replace(/:|[0-9]/g, '')) ? word : capitalize(word)))
		.join('');
	return capitalize(cased);
}
