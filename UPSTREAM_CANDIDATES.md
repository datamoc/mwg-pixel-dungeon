# Upstream candidates (retired - historical record only)

**Evan Debenham does not accept code contributions from anyone, confirmed directly by email
2026-09-06/07 - not just "PRs closed," but a declined one-line fix suggested inline in an
email. This workflow is retired; nothing further will be submitted upstream.** The entries
below are kept as a historical record of real bugs already found and already reported (by
email, since PRs are closed) before that was confirmed - not a todo list.

This file is retained only as historical context. No corrections are to be applied to the Java
tree or proposed upstream; corrections found while working on this port belong only in MWG.

Each entry: the Java file changed, what changed, and why. Mark an entry `Submitted` (with the
PR link) or `Merged` once it actually goes upstream, rather than removing it - this file is
the record of what to check has landed, not just a todo list.

| Java file | Change | Why | Status |
| --- | --- | --- | --- |
| `core/src/main/assets/messages/levels/levels_fr.properties` | `levels.sewerlevel.water_name`: `Eau sombre` → `Eau des égouts` | The literal translation of "Murky water" reads as generic dark water with no connection to where it is; a French player is far more likely to think of sewer water here than of murky water in the abstract - "égouts" is also the very word this port's own HUD already shows as the region name, so the tile description and the region name now use consistent vocabulary. Found via this port's new tile-examine feature surfacing the real string in play. | Not yet submitted |
| `core/src/main/java/.../items/Generator.java` | Java keeps `WEP_T3.probs = WEP_T1.defaultProbs.clone()`; MWG uses tier 3's own table | Real copy-paste bug in the static initializer. The Java checkout remains unchanged by policy; the correction exists only in `src/spdItems/generator.ts`, where tier 3 starts with six equal weights. This historical row is not an upstream-action item. | Corrected in MWG only |
| `core/src/main/assets/messages/**/*_fr.properties`, `*_it.properties`, `*_nl.properties` | Straight apostrophes (`'`) → typographic apostrophes (`’`) throughout (French `d'armes`→`d’armes`, Italian `dell'anti-entropia`→`dell’anti-entropia`, Dutch equivalents), plus restored missing accents on French capital letters (`Etat`→`État`, `Etrangement`→`Étrangement`, `Energie`→`Énergie`, `Electrocuté`→`Électrocuté`, `Equipement`→`Équipement`, `A propos`→`À propos`, `A cause`→`À cause`, `Economiseur`→`Économiseur`, `Etes-vous`→`Êtes-vous`) | Both are real orthography errors in the shipped localization, not stylistic preferences: French requires accents on capital letters same as lowercase (a common but incorrect shortcut is to drop them), and a straight apostrophe is simply the wrong glyph for elision/possessive in French, Italian and Dutch typography. Found while auditing these catalogs for this port's own i18n extraction/rendering. Re-derived against current upstream `master` (this checkout's snapshot is ~2 years stale, so the original diff didn't apply cleanly) via a mechanical, verified-safe regex (word-char + `'` + word-char only - confirmed it leaves space-delimited quotation usage like `'vermine'`/`'bandits'` in `journal_fr.properties` untouched) plus the same hand-verified accent list applied as exact-string replacement across the current files - 4449 apostrophes and 12 accents fixed across 25 files. Committed to a fork (`datamoc/shattered-pixel-dungeon`, branch `fix/fr-it-nl-typography`); `00-Evan/shattered-pixel-dungeon` has pull requests disabled, so reported by email with the compare link (`https://github.com/datamoc/shattered-pixel-dungeon/compare/00-Evan:master...datamoc:fix/fr-it-nl-typography`). | Reported via email (2026-09-06) |
