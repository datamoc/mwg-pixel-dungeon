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
 * none of them. The values below are now `v3.3.8`'s (the real `4.0.0-beta` changes 17 of
 * them; that check read `v3.3.8`, which the local `4.0.0-beta` tag aliased until 2026-09-24). The nine
 * were `ko`/`fr`/`ja`/`uk`/`nl` (marked below their real `complete`), `ru`/`it`/`in` (above
 * their real `unreviewed`) and `el` (above its real `unfinished`); `zh`'s native name is
 * `简体中文` (SPD's `CHI_SMPL`) and `in`'s is `indonesia`, not the French `indonésien` that had
 * stood in.
 *
 * **Closed 2026-09-19: the four `v3.3.8` locales beyond the live checkout's 18 are offered now**
 * (`be`/`eo`/`sv`/`zh-hant`, values from `Languages.java` at tag `v3.3.8`: `be` is `X_UNFINISH`,
 * `eo` is `O_COMPLETE`, `sv` and `zh-hant` (`CHI_TRAD`) are both `__UNREVIEW`). Their SPD-side
 * `.properties` catalogs ship in the generated bundle, read from a second `--legacy-spd-root`
 * pointed at a `v3.3.8` checkout (see `tools/i18n-extract.mjs`'s header comment and `LOCALES`);
 * the live checkout's own current branch has dropped these four files entirely, which is why a
 * second root is needed rather than just adding them to the primary one. The port's own `port.*`
 * strings have no catalogs for them yet, so port prose falls back to English there - stated, not
 * silent (see `PORT_COVERAGE.md`'s i18n row).
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
	/** `Languages.java`'s own reviewer/translator credits, shown by the settings
	 * language tab's credits window (empty for English, which needs none). */
	reviewers: readonly string[];
	translators: readonly string[];
}

/** English is the base every other language falls back to, so it is first and always complete */
export const LANGUAGES: readonly Language[] = [
	{ code: 'en', tag: 'en', nativeName: 'english', status: 'complete', reviewers: [], translators: [] },
	{ code: 'zh', tag: 'zh', nativeName: '简体中文', status: 'unreviewed', reviewers: ["Chronie_Lynn_Iwa", "Jinkeloid(zdx00793)", "endlesssolitude"], translators: ["931451545", "Budding", "DM_216", "Fatir", "Fishbone", "Hcat", "HoofBumpBlurryface", "Horr_lski", "Lery", "Lyn_0401", "Lyx0527", "Ooooscar", "RainSlide", "ShatteredFlameBlast", "SpaceAnchor", "SunsetGlowTheDOGE", "Teller", "hmdzl001", "leo", "tempest102", "tequilasunset", "户方狸奴"] },
	{ code: 'ko', tag: 'ko', nativeName: '한국어', status: 'complete', reviewers: ["Cocoa", "Flameblast12", "GameConqueror", "Korean2017"], translators: ["AFS", "N8fall", "WondarRabb1t", "benepaper", "chlrhwnstkd", "ddojin0115", "eeeei", "enjuxx", "hancyel", "linterpreteur", "lemonam", "lsiebnie", "sora0430"] },
	{ code: 'ru', tag: 'ru', nativeName: 'русский', status: 'unreviewed', reviewers: ["AprilRain(Vadzim Navumaû)", "ConsideredHamster", "Dominowood371", "Inevielle", "apxwn", "yarikonline"], translators: ["5r", "Alternative15", "AngryPotato", "AttHawk46", "BlueberryShortcake", "CatGirlSasha", "Enwviun", "HerrGotlieb", "HoloTheWise", "Ilbko", "JleHuBbluKoT", "KirStaLong", "MrXantar", "Nikets", "OneDuo", "Originalej0name", "Provitia", "Raymundo", "Roycce", "Shamahan", "Thomasg63", "XAutumn", "Ya6lo4ko", "chelikchelik", "dasfan123", "ifritdiezel", "katyp2005", "kirusyaga", "kptmx", "leondorus", "long_live_the_9", "pancreper1", "perefrazz", "ponfertato", "roman.yagodin", "tibby", "un_logic", "vivatimperia", "wntrau", "xenrun", "Вoвa"] },
	{ code: 'es', tag: 'es', nativeName: 'español', status: 'complete', reviewers: ["KeyKai", "Kiroto", "Kohru", "airman12", "grayscales"], translators: ["2001sergiobr", "AdventurerKilly", "Alesxanderk", "Bryan092", "CorvosUtopy", "D0n.Kak0", "Dewstend", "Dyrran", "Enddox", "Fervoreking", "Illyatwo2", "Fuwn", "JPCHZ", "LastCry", "Marquezo_577_284", "NAVI1237", "No_se145", "STKmonoqui", "Sh4rkill3r", "Uri2523", "alfongad", "alquimistamyl", "anauta", "benzarr410", "chepe567.jc", "ctrijueque", "damc0616", "desen90", "dhg121", "javifs", "jonismack1", "magmax", "rechebeltran", "saadhabibi077", "tres.14159"] },
	{ code: 'de', tag: 'de', nativeName: 'deutsch', status: 'unreviewed', reviewers: ["Dallukas", "KrystalCroft", "Wuzzy", "Zap0", "apxwn", "bernhardreiter", "davedude"], translators: ["2711chrissi", "Abracadabra", "Anaklysmos", "Ceeee", "DarkPixel", "David.transifex", "EmilKevinManuel", "ErichME", "Faquarl", "JorahEtLabora", "LenzB", "MacMoff", "Micksha", "Niseko", "Ordoviz", "Sarius", "Shtynow", "SirEddi", "Sorpl3x", "SurmanPP", "SwissQ", "ThunfischGott", "Timo_S", "Topicranger", "azrdev", "carrageen", "dome.scheidler", "galactictrans", "gekko303", "jeinzi", "johannes.schobel", "karoshi42", "koryphea", "luciocarreras", "lukasghesse", "mklr", "niemand", "oragothen", "razzifazzi0", "spixi", "tanjay", "unbekannterTyp", "wunst"] },
	{ code: 'fr', tag: 'fr', nativeName: 'français', status: 'complete', reviewers: ["Emether", "TheKappaDuWeb", "Weende_Bellet", "Xalofar", "canc42", "kultissim", "minikrob", "Lucasgstar"], translators: ["3raven", "Alsydis", "Anonyme48", "Axce", "Az_zahr", "Bastien72", "Basttee", "Coco_EC", "Dekadisk", "Draal", "Eragem", "Karnot", "L.E.V.", "Lama", "Le_Valla", "Leandre", "Louson", "Martin.Bellet", "Neopolitan", "NoGi", "Nyrnx", "Opidox", "Pandaman516", "Petit_Chat", "RomTheMareep", "RunningColours", "STPayoube", "Soeiz", "SpeagleZNT", "Teddywestside", "Tronche2Cake", "VRad", "Ygdrazil", "_nim_", "adamch", "adeb", "antoine9298", "clexanis", "eloiseflo", "fricht", "gdavid2", "go11um", "hydrasho", "jan.", "jazzzz", "levilbatard", "linterpreteur", "luffah", "maeltur70", "marmous", "mcbaba29000", "mluzarreta", "panopano", "solthaar", "speagle", "tkf_", "typhr80", "vavavoum", "whereisfelix", "willi3725", "zM_"] },
	{ code: 'pt', tag: 'pt', nativeName: 'português', status: 'complete', reviewers: ["NicholasPainek", "TDF2001", "matheus208"], translators: ["14NGiestas", "Aetheryll", "Andrew_px1", "Arthur_Mastriaga", "Bigode935", "Bionic64", "Chacal.Ex", "ChainedFreaK", "DAVICCOSTA", "DRACOnicus", "Derik", "DredgenVale", "ElefanteFome", "Helen0903", "JST", "Kotaroo05", "MadHorus", "Maria_João", "MarkusCoisa", "Matie", "Ninguem.EXE", "OtávioMoraes", "PingasOwner", "Piraldo", "Sr.BaconDelicioso", "Tete_Teli", "Tio_P_(Krampus)", "Zukkine", "ancientorange", "danypr23", "denis.gnl", "efverick", "gBiazon", "ismael.henriques12", "juniorsilve33", "mfcord", "nattlegal", "owenreilly", "phobos445", "rafazago", "renan408", "try31"] },
	{ code: 'pl', tag: 'pl', nativeName: 'polski', status: 'unreviewed', reviewers: ["Daniel Witański", "Deksippos", "MrKukurykpl", "chronon", "kuadziw", "szymex73"], translators: ["Akmetari", "AntiTime", "Boguc", "Chasseur", "Ciechu", "Darden", "DarkKnightComes", "DogeseleQ", "GRan0000", "Hammil", "I256I", "KarixDaii", "KrnąbrnyOlaf", "Lufix", "MJedi", "MrCommander", "Odiihinia", "Ostsee0912", "Peperos", "RolsoN", "Scharnvirk", "Serpens13", "Tangens", "VasteelXolotl", "Voyteq", "Wiiiiiii", "bobas10", "bogumilg", "bvader95", "dusakus", "elchudy", "jajkoswinka", "michaub", "mikolka9144", "ozziezombie", "szczoteczka22", "taki1", "transportowiec96"] },
	{ code: 'it', tag: 'it', nativeName: 'italiano', status: 'unreviewed', reviewers: ["MottledElm", "NeoAugustus", "bizzolino", "funnydwarf", "inkubo87"], translators: ["4est", "Danelix", "DaniMare", "Danzl", "Dj1234", "Eriliken", "Esse78", "Guiller124", "Hydr46605", "IoannesMaria", "LN_90", "Mat323", "Mister64", "Noostale", "PicchiSeba", "Tugamer89", "Tysal", "andrea049ita", "andreafaffo", "andrearubbino00", "angelica.caruso", "cantarini", "carinellialessandro31", "dmytro.tokayev", "lorenzofrosi05", "mamon68596", "mattiuw", "max1234ita", "maxifire32", "nessunluogo", "righi.a", "umby000", "unknown888", "valerio.bozzolan"] },
	{ code: 'tr', tag: 'tr', nativeName: 'türkçe', status: 'unreviewed', reviewers: ["LokiofMillenium", "Mustafa.10", "T3kin5iZ", "emrebnk", "gorkem_yılmaz"], translators: ["AGORAAA", "AchernarPrime", "AcuriousPotato", "BurningDaylight", "ErenayDev", "Helgon", "Koga", "Mehmet_Emin_21", "MuratEfeYilmaz", "OzanAlkan", "TR_Muhittin", "Talha_0_0", "TheMBDsvs", "Yllcare", "YORGANSIZMTAV", "ahmetbakicakir", "akkaya.mustafa", "alikeremozfidan", "alpekin98", "barankrky", "denizakalin", "eraysall402", "erdemozdemir98", "hasantahsin160", "immortalsamuraicn", "kayikyaki", "kempilbey", "melezorus34", "mitux", "mustafadoslu", "ryuga", "superDpermn", "utkanozer13", "yasirckr85", "yukete"] },
	{ code: 'ja', tag: 'ja', nativeName: '日本語', status: 'complete', reviewers: ["daingewuvzeevisiddfddd", "oz51199"], translators: ["Gosamaru", "NickZhrbin", "Otogiri", "Siraore_Rou", "amama", "grassedge", "kiyofumimanabe", "librada", "mocklike", "tomofumikitano"] },
	{ code: 'uk', tag: 'uk', nativeName: 'українська', status: 'complete', reviewers: ["Oster", "Snikewin", "zhushman00"], translators: ["AlexFenixUA", "Buster54", "Doodlinka", "Dotsent", "Lyttym", "MaxQuiet", "Mops", "Sadsaltan1", "TarasUA", "TheGuyBill", "Tomfire", "Volkov", "ZverWolf", "_bor_", "alexfenixva", "ddmaster3463", "filalex77", "holuydadko", "ingvarfed", "iu0v1", "jesternotricks", "lezzen", "myshokoleksander05", "oliolioxinfree", "qweez", "romanokurg", "so1der", "sterenkevicsasa", "vlisivka", "xojltoh", "yukete", "zhawty", "Мальвочка"] },
	{ code: 'cs', tag: 'cs', nativeName: 'čeština', status: 'unreviewed', reviewers: ["16cnovotny", "ObisMike", "novotnyvaclav"], translators: ["AshenShugar", "Autony", "Block_Vader", "Buba237", "JStrange", "Nerdiniel", "Patrik123", "RealBrofessor", "Thorn_123", "chuckjirka", "emteckos2", "kristanka", "luhan.lukas"] },
	{ code: 'in', tag: 'id', nativeName: 'indonesia', status: 'unreviewed', reviewers: ["RF_4R4F1_03", "rakapratama"], translators: ["An_Ironstone", "Flasherx", "INDRA_SYAHPUTRA", "Izulhaaq", "Karanh", "M.Bintang.K", "PineFirebloom", "QiuQiuQi", "Ruzz_Axleod", "Taka31", "ZakyM313", "ZangieF347", "aachunemiku", "anagakenny24", "aryasatya_arifien", "atmorojo", "di9526985", "esprogarap", "hatsunnimiku", "icebearwand", "kirimaja", "lupar21", "luthfidzaky_ldzy", "mkakhsan301", "nicoalvito", "noeldycreator", "oolek", "wisnugafur"] },
	{ code: 'nl', tag: 'nl', nativeName: 'nederlands', status: 'complete', reviewers: ["AlbertBrand", "Mvharen"], translators: ["AvanLieshout", "Blokheck011", "Frankwert", "Gehenna", "Valco", "ZephyrZodiac", "link200023", "ojppe", "rmw", "th3f4llenh0rr0r"] },
	{ code: 'hu', tag: 'hu', nativeName: 'magyar', status: 'complete', reviewers: ["dorheim", "summoner001", "szalaik"], translators: ["Csanevox", "Navetelen", "acszoltan111", "balazsszalab", "clarovani", "dhialub", "nanometer", "nardomaa", "savarall", "szemetvodor"] },
	{ code: 'vi', tag: 'vi', nativeName: 'tiếng việt', status: 'complete', reviewers: ["Chuseko", "The_Hood", "nguyenanhkhoapythus"], translators: ["BlueSheepAlgodoo", "Phuc2401", "SpaceMetropolis", "Teh_boi", "Threyja", "Toluu", "bruhwut", "buicongminh_t63", "deadlevel13", "duongfg250", "h4ndy_c4ndy", "hniV", "khangxyz3g", "ngolamaz3", "nkhhu", "vdgiapp", "vtvinh24"] },
	{ code: 'el', tag: 'el', nativeName: 'ελληνικά', status: 'unfinished', reviewers: ["Aeonius", "Saxy"], translators: ["DU_Clouds", "VasKyr", "YiorgosH", "fr3sh", "nikolaoskelirakis", "stefboi", "toumbo", "val.exe"] },
	{ code: 'be', tag: 'be', nativeName: 'беларуская', status: 'unfinished', reviewers: ["AprilRain(Vadzim Navumaû)"], translators: ["4ebotar", "Loentrin"] },
	{ code: 'eo', tag: 'eo', nativeName: 'esperanto', status: 'complete', reviewers: ["Verdulo"], translators: ["Raizin", "Rwelean", "kameluloj"] },
	{ code: 'sv', tag: 'sv', nativeName: 'svenska', status: 'unreviewed', reviewers: ["leowitchhh", "yeager"], translators: ["KeyB", "Moistmemesneverlie", "antonaut", "dotMavriQ"] },
	{ code: 'zh-hant', tag: 'zh-Hant', nativeName: '繁體中文', status: 'unreviewed', reviewers: ["JZR", "Yichm", "p2635"], translators: ["DT227", "Fishbone", "Ken4Ro", "Lstron", "Relrin167", "Sotis425", "Zoe096423", "arnolam", "jackymaxj", "redbrow", "shiba", "唐延諭"] },
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
 * Traditional Chinese is `Languages.matchLocale`'s one special case (tag `v3.3.8`): a bare `zh`
 * primary subtag would otherwise always resolve to Simplified (the first `zh`-coded entry) since
 * both share it, so a `Hant` script subtag anywhere in the preference routes to `zh-hant` first,
 * exactly like `Languages.matchLocale(Locale)`'s own `locale.toString().contains("Hant")` check.
 *
 * Falls back to English, which is the one language guaranteed complete.
 */
export function detectLanguage(preferences: readonly string[]): Language {
	for (const preference of preferences) {
		if (/hant/i.test(preference)) {
			const traditional = LANGUAGES.find((language) => language.code === 'zh-hant');
			if (traditional) return traditional;
		}
		const primary = preference.toLowerCase().split('-')[0];
		const match = LANGUAGES.find((language) => language.code === primary || language.tag === primary);
		if (match) return match;
	}
	return LANGUAGES[0];
}
