#!/usr/bin/env python3
"""
Normalizes word-internal apostrophes in SPD's own .properties translation files from the
straight ASCII "'" to the typographic "'" - correct French/Italian/Dutch orthography for
elision (l'instant) and liaison, and what those languages' native .properties overwhelmingly
should use even though the game's own upstream text does not (verified against a fresh
`git show origin/master:...` before writing this: upstream is itself ~97% straight, so this
is a real, still-open style gap, not something already fixed there).

Reused reasoning:
  - SPD's `Messages.java` formats with `String.format` (%s/%d/%1$d placeholders), never
    `java.text.MessageFormat` (which treats a bare `'` as its own quoting character) - so a
    plain apostrophe has no special meaning in these files, and this substitution is safe.
  - Only the `key=value` line's value is touched, split on the first `=`, so a key name
    itself (never containing an apostrophe in this project) is never at risk.
  - Only a *word-internal* apostrophe converts (a letter, accented or not, on both sides) -
    this deliberately leaves alone any apostrophe used as a generic quote mark, since that is
    a different typographic question with its own correct glyph (a French guillemet or a
    curly double quote, not this script's job).

Usage: python3 tools/fix-apostrophes.py [lang ...]
  With no arguments, runs the three languages found to actually use apostrophe-elision at
  meaningful scale (checked across all 18 locales this project ships): fr, it, nl.
"""

import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parent.parent
MESSAGES_DIR = REPO_ROOT / "core" / "src" / "main" / "assets" / "messages"

# a letter, accented or not (covers fr/it/nl's own diacritics), on both sides
WORD_INTERNAL_APOSTROPHE = re.compile(r"(?<=[A-Za-zÀ-ÿ])'(?=[A-Za-zÀ-ÿ])")

DEFAULT_LANGS = ["fr", "it", "nl"]


def fix_file(path: Path) -> int:
	lines = path.read_text(encoding="utf-8").split("\n")
	changed = 0
	for i, line in enumerate(lines):
		if "=" not in line or line.startswith("#"):
			continue
		key, sep, value = line.partition("=")
		new_value, n = WORD_INTERNAL_APOSTROPHE.subn("’", value)
		if n:
			lines[i] = key + sep + new_value
			changed += n
	if changed:
		path.write_text("\n".join(lines), encoding="utf-8", newline="\n")
	return changed


def main() -> None:
	langs = sys.argv[1:] or DEFAULT_LANGS
	total = 0
	for lang in langs:
		lang_total = 0
		files = sorted(MESSAGES_DIR.glob(f"*/*_{lang}.properties"))
		if not files:
			print(f"{lang}: no *_{lang}.properties files found under {MESSAGES_DIR}")
			continue
		for f in files:
			n = fix_file(f)
			if n:
				print(f"{f.relative_to(REPO_ROOT)}: {n} apostrophes")
			lang_total += n
		print(f"{lang}: {lang_total} apostrophes across {len(files)} files")
		total += lang_total
	print(f"total: {total} apostrophes")


if __name__ == "__main__":
	main()
