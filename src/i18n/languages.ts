/**
 * The languages SPD ships, from `messages/Languages.java`'s enum.
 *
 * Native names, codes and completeness status are that enum's own values. The codes are the
 * suffixes on SPD's `.properties` filenames, which are *not* always BCP-47: SPD uses `in` for
 * Indonesian where BCP-47 says `id`, so `tag` carries what `Intl.PluralRules` needs and
 * `code` carries what the files are named. Getting that wrong silently degrades plural
 * selection to the fallback rules rather than erroring, which is exactly the sort of thing
 * that stays broken until a native speaker notices.
 *
 * `status` is SPD's own assessment of its translations, kept because it is honest to show it:
 * `complete` is 100% reviewed, `unreviewed` is 100% translated, `unfinished` is 80-99%.
 * Anything below 80% SPD does not ship, and neither does this.
 *
 * **Correction, 2026-09-11.** Nine of the nineteen statuses and two of the native names were
 * wrong - checked against every tag from `v2.1.4` through `4.0.0-beta`, the old values matched
 * none of them. The values below are now `v3.3.8`'s, which `4.0.0-beta` agrees with. The nine
 * were `ko`/`fr`/`ja`/`uk`/`nl` (marked below their real `complete`), `ru`/`it`/`in` (above
 * their real `unreviewed`) and `el` (above its real `unfinished`); `zh`'s native name is
 * `简体中文` (SPD's `CHI_SMPL`) and `in`'s is `indonesia`, not the French `indonésien` that had
 * stood in. **Known gap:** this list is SPD `v2.1.4`'s 19 (18 non-English), which is also what
 * `tools/i18n-extract.mjs`'s `LOCALES` ships; `v3.3.8` additionally has `be`/`eo`/`sv`/`zh-hant`
 * (all >= 80%, so omitting them is a scoping choice here, not an SPD completeness fact), so the
 * picker is missing four locales SPD later added - see ROADMAP.md section 8.
 */

export type LanguageStatus = 'complete' | 'unreviewed' | 'unfinished';

export interface Language {
	/** SPD's `.properties` filename suffix, and the id persisted in the save */
	code: string;
	/** BCP-47 tag for `Intl.PluralRules`; differs from `code` only where SPD's code is not BCP-47 */
	tag: string;
	/** the language's name in itself, as SPD writes it */
	nativeName: string;
	status: LanguageStatus;
}

/** English is the base every other language falls back to, so it is first and always complete */
export const LANGUAGES: readonly Language[] = [
	{ code: 'en', tag: 'en', nativeName: 'english', status: 'complete' },
	{ code: 'zh', tag: 'zh', nativeName: '简体中文', status: 'unreviewed' },
	{ code: 'ko', tag: 'ko', nativeName: '한국어', status: 'complete' },
	{ code: 'ru', tag: 'ru', nativeName: 'русский', status: 'unreviewed' },
	{ code: 'es', tag: 'es', nativeName: 'español', status: 'complete' },
	{ code: 'de', tag: 'de', nativeName: 'deutsch', status: 'unreviewed' },
	{ code: 'fr', tag: 'fr', nativeName: 'français', status: 'complete' },
	{ code: 'pt', tag: 'pt', nativeName: 'português', status: 'complete' },
	{ code: 'pl', tag: 'pl', nativeName: 'polski', status: 'unreviewed' },
	{ code: 'it', tag: 'it', nativeName: 'italiano', status: 'unreviewed' },
	{ code: 'tr', tag: 'tr', nativeName: 'türkçe', status: 'unreviewed' },
	{ code: 'ja', tag: 'ja', nativeName: '日本語', status: 'complete' },
	{ code: 'uk', tag: 'uk', nativeName: 'українська', status: 'complete' },
	{ code: 'cs', tag: 'cs', nativeName: 'čeština', status: 'unreviewed' },
	{ code: 'in', tag: 'id', nativeName: 'indonesia', status: 'unreviewed' },
	{ code: 'nl', tag: 'nl', nativeName: 'nederlands', status: 'complete' },
	{ code: 'hu', tag: 'hu', nativeName: 'magyar', status: 'complete' },
	{ code: 'vi', tag: 'vi', nativeName: 'tiếng việt', status: 'complete' },
	{ code: 'el', tag: 'el', nativeName: 'ελληνικά', status: 'unfinished' },
];

export function languageByCode(code: string): Language | undefined {
	return LANGUAGES.find((language) => language.code === code);
}

/**
 * Picks a language from the browser's preference list.
 *
 * `navigator.languages` is in the user's own order of preference, so the first entry with a
 * translation wins. Each entry is matched on its primary subtag, so `pt-BR` finds `pt` and
 * `zh-Hans-CN` finds `zh` - SPD has one catalog per language, not per region. Indonesian is
 * matched on both spellings, since a browser reports BCP-47's `id` while SPD's file is `in`.
 *
 * Falls back to English, which is the one language guaranteed complete.
 */
export function detectLanguage(preferences: readonly string[]): Language {
	for (const preference of preferences) {
		const primary = preference.toLowerCase().split('-')[0];
		const match = LANGUAGES.find((language) => language.code === primary || language.tag === primary);
		if (match) return match;
	}
	return LANGUAGES[0];
}
