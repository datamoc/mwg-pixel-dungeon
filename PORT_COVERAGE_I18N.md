# Port coverage: Internationalisation

Split out of `PORT_COVERAGE.md` on 2026-09-21 (that file had grown to ~530KB) - genuinely
single-topic and not touched since 2026-09-19, unlike the rest of the file which multiple
concurrent sessions were actively extending the same day. Same row-category meanings as
`PORT_COVERAGE.md`'s own header: **Ported**, **Simplified**, **Not ported**,
**Divergence (deliberate)**. New Internationalisation/`messages/Messages.java`/i18n rows go
here, in the same commit as the code change, per `CLAUDE.md`'s dual-documentation rule -
everything else still goes in `PORT_COVERAGE.md`.

## Internationalisation (`messages/Messages.java`, `messages/Languages.java`, `assets/messages/**`)

| Cleric `PowerOfMany`, `PowerBuff`, and `LightAlly` copy | `port.armorability.powerofmany.*`, `port.buff.powerofmany.*`, `port.ally.*` in `portStrings.ts`, `armorAbilityKey`, `buffInfo.ts` | The base checkout does not contain the Cleric message bundle. These strings therefore use the English fallback for every locale, following the existing Cleric armor-buff fallback; the countdown token follows Java's `FlavourBuff` info shape. |

The mechanism is `mwg/i18n`'s, the words are SPD's own. `mwg/i18n` supplies the catalog shape,
`{token}` interpolation, CLDR plural selection through `Intl.PluralRules` and the fallback to a
base language, so none of that is reimplemented; `src/i18n/` adds what is SPD-specific -
assembling a catalog per language, choosing the language, and Java's language-dependent
capitalisation rules.

| Java block | TS destination | Status |
| --- | --- | --- |
| `Messages.get(cls, key, args)`'s key derivation: the class's package path below the SPD root, lowercased, plus the key suffix (`actors.mobs.Rat` + `name` -> `actors.mobs.rat.name`) | `src/i18n/spdKeys.ts` | Ported - the port uses SPD's dotted keys **verbatim**, so any key greps straight back to the Java class that owns it and its `.properties` entry, with no mapping table in between. `$` separates a Java inner class, as in Java |
| `assets/messages/**/*.properties`: 9 domains x base English + 18 locales, 171 files | `src/generated/spdMessages.ts`, built by `tools/i18n-extract.mjs` (`npm run i18n`) | **Ported in full: 3,753 SPD keys x 19 languages.** The built page runs from `file://`, so the complete catalog is deliberately compiled in rather than fetched on demand. This makes every original string immediately available when its Java screen is ported; the cost is a materially larger game bundle. |
| Java text for screens/windows not yet implemented (`WndBag`/`WndUseItem`/journal entries/full talent trees/shop dialogue etc.) | Complete `src/generated/spdMessages.ts` catalog | Text is ported and callable, but its owning Java UI/feature is still not necessarily ported. This is intentionally distinct from a missing translation: MWG already provides generic windows, stacks, scrolling lists, icon grids and message boxes; each remaining item requires its SPD-specific data and interactions to be implemented. |
| `Item.itemComparator` / `Generator.Category.order(Item)` (including tier and special subcategory ordering) | `generatorItemOrder()` + `refreshInventoryPanel()` | Ported for the compact inventory payloads: concrete generated classes use the latest matching Java category, bombs sort after missile weapons, and regular potions/scrolls retain their Java subcategory positions. Unknown compact IDs use the Java sprite-order fallback; equal keys retain bag insertion order through the stable display sort. |
| `.properties` syntax (`=`/`:` separators, `\n`, `\uXXXX`, continuations, comments) and `String.format`'s `%s`/`%d` | `tools/i18n-extract.mjs` | Ported - placeholders are converted to `mwg/i18n`'s `{token}` form at extraction time, not at runtime |
| The complete key set to ship: SPD's every base key, plus every key the port actually asks for | `tools/i18n-extract.mjs`'s `referencedKeys()`, audited transactionally before any write | Ported, and **repaired 2026-09-12**. The scrape that finds keys the port references reads `t('...')` call sites everywhere except `src/i18n/spdKeys.ts`, where keys appear as table *values* - and there it used to accept every string literal in the file. That file also contains MWL tag/attribute/table names (`'effect'`, `'keys'`, `'potionAppearances'`, `'scrollAppearances'`) and an import specifier (`'../mwlContent'`), so the audit failed on six non-keys and exited before writing: `npm run i18n` could not regenerate the catalogue at all, and the failure had been noted as pre-existing rather than diagnosed. It now keeps only literals of SPD's real key shape (dotted identifiers, `$` for an inner class) - all 3,753 base keys match, none of the six do. `--check` is green: the committed `spdMessages.ts` is byte-reproducible (modulo git's CRLF checkout, now normalized in the comparison) from the SPD checkout's working tree, which is this file's real provenance rather than any tag. |
| User-visible `GameLog` messages | `main.ts` + `tools/i18nCheck.ts` | Ported at the output boundary - every direct `say()` literal was removed. Java-owned paralysis, roots and descent text use their original SPD keys; port-only mechanics remain under `port.log.*`. The localization verifier rejects any future direct quoted `say()` argument, so an English-only message cannot silently bypass the catalog. |
| Enchant/glyph/curse display names (`port.affix.*`, rendered by `itemDisplayName`) | `src/i18n/portStrings.ts`'s `//affixes` block (EN+FR) | Ported - all 32 affix ids now resolve instead of rendering raw keys. Values are SPD's own `<class>.name` strings (tag `v3.3.8`): weapon affixes keep the bare adjective (`blazing`), armor affixes the `of`-suffix (`of stench`); FR uses the masculine base form, since Java resolves its `(e)`/`(le)` markers by item gender and this port models no gender data. `swiftness` takes the armor form (it is armor-glyph-only). Type-check/build only; never visually confirmed, like every other locale string. |
| Every `this.say('literal English string' ...)` call site (as opposed to `this.say(t('port.…'), ...)`) | `src/main.ts` scene-log call sites; new EN/FR `port.log.*` entries | **Found and fixed: 33 hardcoded-English log lines had never gone through `t()` at all**, discovered while adding the `no_herbalism` challenge gate right next to one of them (`plantSeed`'s three lines). A full sweep (`grep "this\.say('[A-Z]"`) found the rest scattered across chest/hourglass unlocking, the sacrificial-fire reward, both wells, every `triggerPlant` branch (sungrass/nourishing-fruit/starflower/dewcatcher/seedpod/fadeleaf/mageroyal/icecap x2/rotberry x2/sorrowmoss/firebloom/stormvine/swiftthistle/generic-wither), chasm falling, both crystal-mimic reveal/escape/displace lines, the armor-displacement curse, the statue equipment drop, and all three hourglass-freeze lines - none of these had ever rendered anything but raw English text in a French (or any non-English) run, a real, previously-undiscovered i18n gap the size of the `port.affix.*`/dynamic-subclass-key finds above, just never swept for because these calls pass a literal string rather than a template key. All 33 now have real `port.log.*` keys with EN (the original wording, unchanged) and new FR translations, reconfirmed by rerunning the full `port.*` literal-key audit (0 missing in either locale, 258 keys now in use, up from 224). |
| The five boss-victory log lines (`bossTransitions.victory` in `scenario-rules.mwl`) | `dungeonScene.ts`'s boss-slain call site | **Found and fixed, 2026-09-14**: these were raw English sentences authored directly in the MWL table and passed straight to `say()`, which never translates its argument - the same `t()`-bypass shape as the 33-line and 6-line finds above, just missed because the string lived in authored data rather than a literal in `main.ts`. Every non-English run has always shown these five lines in English. The table now holds `port.log.bossvictory.<region>` keys instead, translated into all 19 offered locales (the boss names inside each translation are the real per-locale names already generated from Java, `actors.mobs.{goo,tengu,dwarfking,yogdzewa}.name`, not re-invented), and the call site reads `t(boss.victory)`. `i18nCheck` confirms all 19 locales carry all five keys (449 port strings, up from 444). |
| Quest objective text (`questDefinitions.description` in `scenario-rules.mwl`) | `journalContent.ts`'s Notes tab, `dungeonScene.ts`'s `questObjective` context field | **Found and wired up, 2026-09-14**: this data was real and authored but dead - `Rpg.QuestDefinition.stages[].description` is `mwg`-carried metadata the framework's own doc comment says it "never reads itself", and nothing in this port read it either (only `stage.condition` was ever checked). Not a live i18n bug like the boss-victory row above (nothing rendered it, so no untranslated text ever reached a player), but a real, if minor, silent gap - authored objective text with no display path at all. Now shown in the Journal's Notes tab under each quest's status line, only while an active stage names one; translated into all 19 locales as `port.journal.quest.<id>.objective`, kept short (not re-stating the NPC name already on the line above). `i18nCheck` confirms all 19 carry all four (453 port strings, up from 449). |
| SPD message keys the local checkout carries but the pinned tag removed - DM300's `rocks`/`vent` lines, the pickaxe's `ac_mine` action and `no_vein` line, the sign `name`/`desc`, the journal `notes` tab | `port.log.dm300rocks`, `port.log.dm300vent`, `port.ui.pickaxemine`, `port.log.pickaxenovein`, `port.ui.signname`, `port.ui.signdesc`, `port.ui.journalnotes` in all 19 catalogues, with every call site re-pointed (the DM300 pair, both pickaxe lines, the MWL action row, both sign lines, all three journal tab lines, the title-screen badges button) | **Ported (2026-09-17).** The eight keys exist in the checkout's v2.1.4 message files but were removed by v3.3.8, so no regeneration from the pinned tag could ever ship them; they now live under `port.*` with SPD's own translations in every locale, and the old key names are referenced nowhere. The same pass cleared six more source keys that resolved in no catalog at all: SummonElemental's no-space line uses the real huntress `spirithawk.no_space` key Java itself reuses, the Recycle picker keeps the real `inv_title` key, and the DeathMark/SpectralBlades empty-target lines use SPD's generic `armorability.no_target` (both documented divergences above - Java asks for keys that exist in no properties file). `i18n-extract --check` against the checkout is green again. |
| `Languages.java`'s enum: native names, codes, and its own completeness assessment (`COMPLETE` 100% reviewed, `UNREVIEWED` 100% translated, `UNFINISHED` 80-99%; below 80% SPD does not ship) | `src/i18n/languages.ts` | Ported, status included - it is honest to show SPD's own assessment rather than implying every language is equally finished |
| SPD's filename suffixes are not always BCP-47 (`in` for Indonesian, where BCP-47 says `id`) | `Language.code` vs `Language.tag` | Ported - `code` names the file and is what the save persists, `tag` is what `Intl.PluralRules` gets. Conflating them degrades plural selection to the fallback rules *silently* rather than erroring |
| `WndSettings.LangsTab` language selection, language status, and credits (`windows/WndSettings.java`; `messages/Languages.java`, tag `v3.3.8`) | `src/ui/settingsWindow.ts` (`langsTab`, `orderedLanguages`, `showLangCredits`), `src/i18n/languages.ts`, `src/i18n/index.ts` | **Ported:** the full shipped `Languages` enum is listed as native-name buttons, the detected device language is moved to the top, the current language is highlighted, unfinished/unreviewed locales use Java's grey/pale tints, and the current locale's completion status plus reviewer/translator credits are shown. Selecting a locale updates the language and persists its SPD filename code. **Behavior difference:** unlike Java's `Messages.setup` + seamless scene reset (which wipes the game log and resets generators), this port applies the catalog in place; the title refreshes and an in-game settings window closes while preserving the run. The language code/status/credits values remain sourced from SPD's enum. |
| SPD's pixel fonts (`assets/fonts/`, `RenderedTextBlock`/`PixelScene.pixelFont`) | `pixel_font.ttf` + global theme | Ported using the supplied scalable SPD pixel-font face; the fallback stack remains deliberately for scripts not covered by that face. |
| Right-to-left layout | `Catalog.direction`, set per language | **Unexercised** - SPD ships no RTL locale, so nothing here has ever laid out RTL. `mwg/ui` mirrors against `direction`, but this port has never tested that path and should not be described as supporting RTL |
Strings this port invented, which have no Java equivalent - the sealed-floor search hint, the
keybind cheat-sheet, port-only status text, and two names absent from this checkout's message
files - live under a `port.*` namespace (`src/i18n/portStrings.ts`, **415** strings and counting -
`port.affix.*` alone added 32 in an earlier pass). The prefix
is deliberate: a `port.*` key is a string SPD never had, not a missing translation, and the two
distinguish themselves at a glance. English and French are hand-written (415 keys each).
**German (`de`), Spanish (`es`), Portuguese (`pt`), Italian (`it`), Polish (`pl`), Russian
(`ru`), Turkish (`tr`), Ukrainian (`uk`), Hungarian (`hu`) and Dutch (`nl`) are now
supplied too** (German 2026-09-09, Spanish 2026-09-09, Portuguese 2026-09-09, Italian
2026-09-09, Polish 2026-09-09, all 375/375 keys at the time, Russian 2026-09-10, Turkish
2026-09-10, both 389/389 keys at the time, Ukrainian 2026-09-11, 415/415 keys
against the current EN table, Hungarian 2026-09-11, 415/415 keys, Dutch 2026-09-11, 415/415
keys, `unreviewed` status) -
machine-assisted direct
translations, not human-proofread, marked as such in `PORT_STRINGS_DE`/`PORT_STRINGS_ES`/
`PORT_STRINGS_PT`/`PORT_STRINGS_IT`/`PORT_STRINGS_PL`/`PORT_STRINGS_RU`/`PORT_STRINGS_TR`/
`PORT_STRINGS_UK`/`PORT_STRINGS_HU`/`PORT_STRINGS_NL`'s own doc comments rather than silently
claimed `complete`. All ten are real Java SPD locales - confirmed against
`src/generated/spdMessages.ts`'s own generated table, which exists only for languages SPD
actually ships a base translation for - so this only ever supplies the port's *own* invented
strings on top of a base catalog Java already covers, never invents a locale Java doesn't have.
Verified programmatically before being wired in (0 missing/extra keys vs EN, 0 `{placeholder}`
token mismatches across all 375, for each locale) and live in-browser (welcome log line,
bag/talent panels, class-select blurb, settings/badges/changes windows, and - for Portuguese -
the hero info panel's real Java strings too, confirming the whole locale resolves end to end)
all rendered correctly-composed text, no raw keys, no console errors, for all five languages.
Russian was verified the same programmatic way (389/389 keys, 0 `{placeholder}` mismatches);
its live in-browser pass is owed per ROADMAP.md section 10 (no working browser tool in that
session). SPD itself ships Russian as reviewed, but that status covers SPD's own `.properties`
catalog, not this port-only draft - recorded as `MT`/`machine` like the other five.
Turkish was verified the same programmatic way (389/389 keys, 0 `{placeholder}` mismatches;
its combat line `port.log.hit` uses verb-final `{subject} {object} {damage} {verb}` order with
an identical token set, accepted by the sorted-token QA by design); its live in-browser pass
is likewise owed per ROADMAP.md section 10.
Ukrainian was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches - the EN table itself had grown to 415 keys by this pass, picking up
the alchemy/unlockhint/journal/bag keys added since the Russian and Turkish drafts, which is why
those two were short of the current EN count at that moment; that gap was closed the same
session in RU/TR and is not outstanding), formal «Ви» address
matching Russian's register as the closest sibling locale; its live in-browser pass is likewise
owed per ROADMAP.md section 10 (no working browser tool in that session either).
The Italian draft also caught a real transcription hazard worth reusing: a scripted
non-Latin-character scan (`/[Ѐ-ӿ一-鿿...]/`) over the finished draft file,
before wiring it in, caught one stray Cyrillic-character typo a manual read missed; the same
scan on the Polish draft found nothing, confirming it as a cheap habitual check rather than a
one-off fix. Ukrainian's own equivalent scan (Latin letters inside an otherwise-Cyrillic word)
found nothing either - every flagged Latin token was a legitimate untranslated proper noun
(`Shattered Pixel Dungeon`, `mwg`, `DM-300`) or a keybind letter.
Hungarian was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches, via the same QA the earlier drafts used); its live in-browser pass is
likewise owed per ROADMAP.md section 10 (no working browser tool in that session). SPD itself
ships Hungarian as reviewed, but that status covers SPD's own `.properties` catalog, not this
port-only draft - recorded as `MT`/`machine` like Russian. Informal te-form address, matching
German's Du, Spanish's Tú and Turkish's sen-forms.
Dutch was verified the same programmatic way (415/415 keys, 0 missing/extra, 0
`{placeholder}` mismatches); its live in-browser pass is likewise owed per ROADMAP.md section 10
(no working browser tool in that session). SPD ships Dutch as `unfinished`, and this port-only
draft is `MT`/`machine` too. Informal je-forms.

**Found and fixed 2026-09-12: five more locales had silently drifted behind the EN table.**
`de`/`es`/`pt`/`it`/`pl` stood at 386/386/386/384/391 of EN's 415 keys - 142 strings missing
across the five (the alchemy UI/log/name block, the five class `unlockhint` lines,
`port.log.stoneflock`/`stoneaggression`/`wandcorrosion`/`wandcorruption`/`dm300arrives`, and the
journal/bag UI labels, all added to EN after those drafts were written and never propagated).
This is the same drift class the Ukrainian pass found in RU/TR, and it is invisible by
construction: `mwg/i18n` falls back to English for a missing key, so the failure mode is not an
error or a raw key but a single English sentence in the middle of an otherwise fully translated
run. All 142 are now translated in the same voice as each block, giving every non-English
catalogue 415/415 keys with 0 `{placeholder}` mismatches. Italian additionally appeared to be
missing the two wandmaker lines, but that was an artifact of the ad-hoc audit script's regex
not matching double-quoted values containing escaped `\"` - a reminder to compare the imported
tables rather than scrape the source.

The invariant is now enforced instead of hoped for. `tools/i18nCheck.ts` check 3 compares
**every** registered catalogue's key set and `{placeholder}` tokens against EN; it previously
compared only French (and only French's placeholders), which is precisely why five incomplete
locales passed it. Check 3c asserts every catalogue has a `PORT_TRANSLATION_ORIGIN` entry and
maps to a real `LANGUAGES` code - the old origin check listed nine hardcoded codes and had
already missed `uk`/`hu`/`nl`. To let the check compare tables without importing the `mwg`
runtime, the assembled catalogue map moved out of `index.ts` into `portStrings.ts` as an
exported `PORT_STRINGS`, which `index.ts` now imports like any other data. The new check was
verified to *fail* on a deliberately removed key before being trusted - not merely observed to
pass.

**All 19 locales done, 2026-09-12.** The seven languages that still fell back to English for
port-only prose - `zh`, `ko`, `ja`, `cs`, `in`, `vi`, `el` - now each carry a complete
415/415-key catalogue, so no SPD language falls back for anything this port wrote itself. Each
was drafted from `PORT_STRINGS_EN` with SPD's own vocabulary for the game's terms (read out of
the real `_xx.properties` at tag `v3.3.8`), then validated three ways before being wired: key
set, key *order* and sorted `{placeholder}` multiset against EN (415/415 on all seven); a
script-contamination scan for text in the wrong script (no Cyrillic or Latin inside Greek words,
no kana in Korean, no hanja where it does not belong, no Traditional characters in the
Simplified draft); and the project's own `tools/i18nCheck.ts`. Splicing is scripted, so the
2,905 translated lines never pass through a hand-transcription step.

Two of these are worth calling out beyond "counts match", because a count cannot see them:
- **Chinese** is Simplified only - the draft was scanned for the common Traditional-only
  characters (`們`/`這`/`來`/`為`/`說`/`時`/`過`/`戰`/`術`...) and contains none.
- **Japanese, Korean and Chinese** have no grammatical plurality, so where English distinguishes
  singular from plural (`port.log.hit` vs `port.log.hithero`, `port.log.miss`/`misshero`,
  `port.log.monkdodge`/`monkdodgehero`, `port.log.oozed`/`oozedhero`) each pair is deliberately
  identical rather than a translation oversight. Their `{subject}`/`{object}`/`{damage}`/`{verb}`
  placeholders are re-ordered into natural sentence order, which the token-set comparison
  accepts by design.
- **A glyph-coverage scan of all 19 locales found no tofu**, and it turned up two curiosities
  worth recording for where they live rather than for what they are. Both are in SPD's *own*
  tables, never in a port-only string, and both are harmless - but each is the reason the scan
  must ignore characters that draw nothing *by design* rather than only whitespace, since
  otherwise it reports a missing glyph for a character that is not meant to have one:
  Ukrainian `actors.buffs.frost.desc` contains a U+0301 COMBINING ACUTE (a stress mark, which
  only renders attached to the letter before it) and Portuguese
  `scenes.gamescene.blacksmith_quest_window` contains a U+200B ZERO WIDTH SPACE, twice. The scan
  now skips `\p{Cf}` (format) and `\p{Mn}`/`\p{Me}` (combining) characters. That the scan can
  fail at all was verified rather than assumed: with nine rare codepoints injected in place of
  English's single one, it correctly flagged the three that Chromium has no glyph for (the rest
  - Kharoshthi, Adlam, Old Turkic - really are covered by fonts Windows ships).

Every catalogue here is still `MT`/`machine`: a machine draft, complete but not proofread by a
fluent speaker, and marked that way in source and in `PORT_TRANSLATION_ORIGIN` rather than
silently upgraded.

**Found and fixed while verifying Spanish, but a real bug affecting French and German too, not
new to this pass**: `main.ts`'s `attack()` built the combat-log `object` slot for a hero
defender as a hardcoded English literal `'you'`, bypassing translation entirely - every
non-English combat log line read "...hits **you** for 3" / "...golpea a **you** por 3" instead
of a translated pronoun, for as long as French and German have existed in this port. The
`subject` slot one line above already did this correctly via `t('port.log.subject.you')`;
naively reusing that same key for `object` would have been wrong too, since it is the
capitalized/nominative form ("You"/"Vous"/"Du"/"Tú") meant for sentence-initial use, not the
lowercase/case-inflected form an object position needs (English "you" lowercase, French
"vous", German accusative "dich", Spanish "ti" after the templates's own "a"). Added a new
`port.log.object.you` key to all four locales and fixed the call site to use it. Verified live
by calling `attack()` directly through `window.__MWG__.currentScene['attack']` for a scripted
hero-vs-monster exchange in all four locales after the fix: `"Marsupial rat hits you for 2."`
(en), `"Rat marsupial touche vous pour 2."` (fr, pre-existing word order unchanged - not part
of this fix), `"Beutelratte trifft dich für 2."` (de, now correctly accusative), `"Rata
marsupial golpea a ti por 2."` (es, now grammatically correct instead of "a you").

The remaining 7 `Languages.java` locales still fall back to English through
`mwg/i18n`'s base catalog - translating them is tracked as its own ROADMAP.md section 8 item.
**Closed 2026-09-12**: all seven now have catalogues, so no locale falls back for port-only
prose; see the "All 19 locales done" section above.
**Recurred in miniature, 2026-09-14**: six later-added `port.log.*` keys
(`curseinfusion`/`magicalinfusion`/`beaconreturned`/`summonelemental`/`reclaimtrap.stored`/
`.placed`) had been added to `PORT_STRINGS_EN`/`PORT_STRINGS_FR` only, silently falling back to
English in the other 17 - the same drift-then-silent-fallback pattern as 2026-09-12's five-locale
back-fill, just smaller. `npm run verify`'s `i18n:verify` step catches this (it failed with all 17
listed as missing exactly those six keys), which is how it surfaced. Fixed the same way: machine
draft each locale's translation from the EN/FR pair and splice it in at the EN/FR position via a
script rather than by hand. `i18nCheck: OK - 524 mapped keys, 444 port strings, 19 languages`.
Separately, the locale *set* was SPD `v2.1.4`'s 18 non-English locales rather than `v3.3.8`'s
22 (`be`/`eo`/`sv`/`zh-hant` absent from both `LANGUAGES` and the extractor's `LOCALES`) until
the eight-key migration above closed that half. **Closed 2026-09-19, the other half**: a further
provenance wrinkle turned up when actually running the regen - the *live* checkout (this port's
normal `--spd-root`, on its own current branch, not a tag) is not `v3.3.8` at all; it carries
pre-`v3.3.8` content this port still ships that `v3.3.8` dropped or renamed - **2026-09-19 correction, the direction first recorded here was backwards: the live tree is *older* than `v3.3.8`** (its Java still has `ShockBomb`, deleted upstream in `v2.5.3`, and no `SmokeBomb`) - (`items.potions.alchemicalcatalyst.name`,
`items.bombs.flashbang.name`/`.shockbomb.name`, `items.spells.aquablast.name`) that a literal
`v3.3.8` checkout does not have, while having dropped `be`/`eo`/`sv`/`zh-hant`'s files entirely
(present at `v3.3.8`, absent from the live branch). Neither checkout alone can serve the full
key set, so `tools/i18n-extract.mjs` now takes a second, optional `--legacy-spd-root`: the
primary root stays the live checkout (preserving the dropped pre-`v3.3.8` content everything else already
depends on), and only those four locales are read from a `v3.3.8` worktree via the new root (whose "legacy" name is now backwards too, but renaming it is not worth the churn). Conversely `v3.3.8` added keys the live tree lacks (`smokebomb`, `flashbangbomb`) - those arrive via `port.*` housing until a re-extraction, never from either root today.
Unset, they simply ship empty and fall back to English - no regression to the offline, zero-arg
case. `LANGUAGES` gained the four with `Languages.java`'s real `v3.3.8` statuses (`be`
`X_UNFINISH`, `eo` `O_COMPLETE`, `sv`/`zh-hant` `__UNREVIEW`), and `detectLanguage` gained
`Languages.matchLocale`'s `Hant`-script special case (a bare `zh` primary subtag would otherwise
always resolve to Simplified, since both share it). Browser-verified live for all four (title
screen + Settings, real glyphs, no tofu, honest English fallback on the still-untranslated
`port.*` strings). `i18nCheck`'s two placeholder checks for this exact gap (`zh-Hant-HK falls
back to zh`, `eo stays absent`) are updated to their real, now-passing expectations
(`zh-Hant-HK detects zh-hant`, `eo differs from en for the rat`). `i18nCheck: OK - 563 mapped
keys, 491 port strings, 23 languages`. Recorded under ROADMAP.md section 8, now closed.
**Dead end avoided, worth recording**: an earlier attempt at this same regen chased two
apparent key mismatches (`items.spells.featherfall.light` vs an invented `elixiroffeatherfall`
spelling, `missileweapon.stats` vs a `v3.3.8`-only `stats_known` split) by assuming `v3.3.8` was
the single source of truth; both were false leads once the live checkout was checked directly -
see the `FeatherFall`/`stats_known` rows elsewhere in this file for the real fix and the real,
still-open reason `stats_known` cannot ship yet.

**Fixed 2026-09-19, a systemic extraction bug found while adding the Duelist `ability_desc` row
below**: `tools/i18n-extract.mjs`'s `convertPlaceholders()` regex,
`/%(?:(\d+)\$)?[-+ 0,(#]*\d*(?:\.\d+)?([a-zA-Z%])/g`, treated a bare `%` followed by Java's real
(but here always-args-free) space-flag or left-justify-flag as the start of a genuine
`String.format` conversion, even though most `.desc`/`.ability_desc` bodies are passed through
`Messages.get(key)` with no args and are never run through `String.format` at all - so an
unescaped `%` in ordinary prose (`"+33% damage"`, Hungarian's percent-suffix grammar `"25%-kal
kevesebbet"`) had its next letter eaten as a bogus conversion character, producing corrupted
output like `"{0}amage"` or `"{0}al"`. This was not a narrow bug: it silently corrupted hundreds
of strings across the entire generated catalog, every domain, all 23 locales, wherever such a
pattern occurred in un-formatted source text. Fixed by removing `' '` and `'-'` from the flags
character class (`[+0,(#]*`), verified safe by grepping the real `.properties` corpus for any
genuine left-justify-with-width (`%-<digits>`) or intentional space-flag usage and finding none,
and by spot-checking every residual `{n}<letters>` pattern after the fix to confirm each is a
legitimate no-space source string (e.g. `"Turn into {0}g"`) rather than further corruption.
Regenerated via the dual-root command above; `i18nCheck: OK - 563 mapped keys, 491 port strings,
23 languages` (key/string/language counts unchanged, since this only fixes placeholder token
*content*, not key coverage).

`tools/i18nCheck.ts` guards the convention: every SPD-derived key the port uses must exist in
SPD's own base `.properties`, so a typo'd key **fails the check** rather than quietly rendering
English - which is the entire benefit of matching Java's key names, and worthless if a wrong key
can pass silently.

**Not visually confirmed.** The Chrome extension has been disconnected for this whole stretch, so
no locale has been seen rendered. The check above proves 138 keys resolve across 19 languages and
that interpolation produces the expected output; it cannot prove text fits its widget or that the
font stack actually covers a script. A CJK locale is the one most likely to be wrong, since that
is where a missing font shows as tofu.
