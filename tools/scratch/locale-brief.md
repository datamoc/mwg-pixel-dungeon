# Brief: draft a port-only string catalogue for one SPD locale

You are working in `C:\Users\miche\dev\mwg-pixel-dungeon`, a TypeScript port of Shattered Pixel
Dungeon. This brief is shared by several agents, one per locale. Do only your assigned locale.

## What the catalogue is

`src/i18n/portStrings.ts` holds the strings **this port invented** - its own log lines, its own
simplified-quest dialogue, its own hints - which have no original in SPD to borrow a translation
from. English and French are human-written; German, Spanish, Portuguese, Italian, Polish,
Russian, Turkish, Ukrainian, Hungarian and Dutch are machine drafts marked `MT`. Seven SPD
languages still fall back to English for these strings; you are drafting one of them.

## Source of truth

Read `src/i18n/portStrings.ts` lines 22-521: that is `PORT_STRINGS_EN`, the full key set and
order. Read at least one complete existing block for format and tone, e.g. `PORT_STRINGS_NL`
(near the end of the file) and `PORT_STRINGS_PL`.

Translate **values only**. Keys are identifiers and never change.

## Output

Write exactly one file: `tools/scratch/<code>.block.txt` (relative to the repo root).

It must contain **only the block body**: one line per key, in the same order as EN, each line
shaped like

```
	'port.some.key': 'translated value',
```

- exactly one leading TAB per line, single quotes, trailing comma
- no comments, no blank lines, no `export const` header, no closing `};`, no surrounding prose
- every value on a single line - never wrap a long value onto a second line
- if a value contains an apostrophe, either escape it (`'l\'arte'`) or wrap the value in
  double quotes (`"l'arte"`); it must still be one line

## Translation rules

1. **Placeholders are exact.** `{item}`, `{target}`, `{who}`, `{damage}` etc. must survive with
   the same names and the same multiplicity. You may move them within the sentence freely -
   word order is language-specific. A value that has `{subject}` and `{object}` must still have
   exactly one of each (a repeated token is a failure).
2. **Register:** informal second person unless the per-locale note says otherwise. Short, direct
   game-log and UI-label sentences, matching the tone of the existing blocks - not literary
   prose.
3. **Terminology:** use SPD's own translation for a game term wherever it has one. Anchors are
   given per locale below. For a term not listed, a standard, natural rendering is fine.
4. **Proper nouns stay:** `Shattered Pixel Dungeon`, `mwg`, `DM-300`, `Yog-Dzewa`, `Tengu`,
   `Amulet of Yendor`, `Sungrass`, `Rotberry`, `Seedpod`, `Dewcatcher`, `Timekeeper`, `Louhi`,
   `mass grave`, `Rot Garden`, `Ritual Site`, `Berserker`, `Gladiator`, `Battlemage`, `Warlock`,
   `Assassin`, `Freerunner`, `Sniper`, `Warden`, `Champion`, `Monk` - unless SPD has a
   translation you can confirm; the subclass/armor `port.subclass.*`/`port.armor.*` values are
   display names and **should** follow SPD's own class names if you know them.
5. `port.log.subject.you` is the hero's name in a combat line ("You"). SPD itself names the hero
   this way in `actors.hero.hero.name`, so use exactly that value (given per locale below).
   `port.log.object.you` is the lowercase object/accusative form for the *defender* slot.
6. `port.log.hit` / `port.log.hithero` are `{subject} {verb} {object} for {damage}`; the verb
   comes from separate keys `port.log.verb.hit` ("hits") and `port.log.verb.hithero` ("hit"). If
   your language conjugates differently or has no singular/plural distinction, make the two
   forms identical, or fold the verb into the sentence and make `port.log.verb.*` a natural
   invariant particle - but the token set of every key must still match EN exactly.
   `port.log.miss` / `port.log.misshero` / `port.log.monkdodge` / `port.log.monkdodgehero` are
   the same shape without `{damage}`.
7. Names SPD shows untranslated (e.g. `Bomb`, `Pasty`) may be translated only where the block
   already does so in EN; otherwise keep SPD's form.

## Self-check (required, iterate until it passes)

```
node tools/scratch/block-check.mjs <code> tools/scratch/<code>.block.txt
```

It compares your fragment's key set, key order and `{placeholder}` token multiset against EN,
and must print

```
<code>: OK - 415 keys, tokens match EN, order matches EN
```

Fix and re-run until it does. Report that exact line when done.

## Vocabulary anchors (from SPD v3.3.8's own `.properties`)

| concept | cs | in | vi | el | ja | ko | zh |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hero ("You") | Ty | kamu | bạn | εσύ | あなた | 당신 | 你 |
| scroll | svitek | gulungan | cuộn giấy | πάπυρος | 巻物 | 주문서 | 卷轴 |
| scroll of upgrade | Svitek vylepšení | gulungan peningkatan | cuộn giấy nâng cấp | πάπυρος αναβάθμισης | 強化の巻物 | 강화의 주문서 | 升级卷轴 |
| potion | lektvar | ramuan | thuốc | φίλτρο | ポーション | 물약 | 药剂 |
| ring | prsten | cincin | nhẫn | δαχτυλίδι | 指輪 | 반지 | 戒指 |
| bomb | bomba | bom | bom | βόμβα | 爆弾 | 폭탄 | 炸弹 |
| armor | zbroj | armor | áo giáp | πανοπλία | 鎧 | 갑옷 | 护甲 |
| gold | zlato | emas | vàng | χρυσός | ゴールド | 금화 | 金币 |
| key | klíč | kunci | chìa khoá | κλειδί | 鍵 | 열쇠 | 钥匙 |
| runestone | kámen | batu | hòn đá | λίθος | 石 | 돌 | 符石 |
| sheep | ovce | domba | cừu | πρόβατο | 羊 | 양 | 绵羊 |
| rat | krysa | tikus marsupial | chuột có túi | μαρσιποφόρος αρουραίος | 袋鼠 | 주머니쥐 | 啮齿小鼠 |
| barrier/shield | Bariéra | penghalang | trường bảo vệ | πεδίο προστασίας | バリア | 방어막 | 奥术屏障 |
| exotic | exotický | eksotis | kì lạ | εξωτικός | 奇抜な | 신비로운 | 奇异 |
| alchemy | alchymie | meracik | giả kim | αλχημισμός | 錬金 | 연금 | 炼金 |
| bag | kontejner | penampung | vật chứa | αποθηκ/κό μέσο | 容器 | 가방 | 容器 |
| burning | hoření | terbakar | cháy | κάψιμο | 燃焼 | 연소 | 燃烧 |
| poison | otrava | keracunan | trúng độc | δηλητηρίαση | 毒 | 중독 | 中毒 |
| paralysis | omráčení | lumpuh | tê liệt | παράλυση | 麻痺 | 마비 | 麻痹 |
| invisibility | neviditelnost | tembus pandang | tàng hình | αορατότητα | 不可視 | 투명화 | 隐形 |
| levitation | levitace | melayang | lơ lửng | αιώρηση | 浮遊 | 부유 | 飘浮 |

Per-locale notes:

- **cs (Czech)** - informal `ty`/`tvůj` (SPD's Czech is informal). `scroll of upgrade` =
  "svitek vylepšení"; `wand` = "hůlka", `staff` = "hůl". Use Czech diacritics.
- **in (Indonesian)** - informal `kamu`/`-mu` (SPD's Indonesian mostly uses it). SPD's own
  Indonesian is lowercase-heavy; match the block's sentence case rather than SPD's stray
  lowercase. `wand` = "tongkat", `staff` = "tongkat sihir".
- **vi (Vietnamese)** - informal `bạn`. Keep Vietnamese diacritics exact.
- **el (Greek)** - informal `εσύ`/`σου` (SPD's Greek is overwhelmingly informal). `wand` =
  "ραβδί", `staff` = "προσωπικό ραβδί" is wrong - use "ραβδί" for wand and "μπαστούνι" or
  "ραβδί του μάγου" for the mage's staff as fits.
- **ja (Japanese)** - plain/neutral game register (SPD's ja uses plain forms, e.g. 〜した).
  No plural distinction: make singular and plural forms identical where EN differentiates.
  Particle-based order: put `{object}` before the verb, `{damage}` as `{damage}のダメージ`.
- **ko (Korean)** - plain/neutral register (SPD's ko uses 한다-style plain forms, not 해요).
  No plural distinction: singular and plural forms may be identical. Prefer constructions that
  avoid particles whose form depends on the preceding syllable's final consonant (이/가, 은/는,
  을/를) - e.g. use 에게 for the object, or restructure; if unavoidable, pick one form.
- **zh (Simplified Chinese)** - plain game register. No plural distinction. Use 了/给/受到
  constructions naturally; `{damage}` can be `造成{damage}点伤害` or `受到{damage}点伤害`
  depending on direction.
