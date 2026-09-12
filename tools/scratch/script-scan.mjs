// Throwaway (tools/scratch): script-contamination scan over the new locale drafts.
//
// The QA the project already used for the Italian and Ukrainian passes: look for characters that
// belong to the wrong script for a locale (Cyrillic inside Greek, Latin inside CJK, Greek inside
// Czech), which a manual read misses. Latin stays allowed where a legitimate proper noun or
// keybind letter uses it, so Latin hits are reported for review rather than failed outright.
import { readFileSync } from 'node:fs';

const RANGES = {
	cyrillic: /[\u0400-\u04FF\u0500-\u052F]/,
	greek: /[\u0370-\u03FF\u1F00-\u1FFF]/,
	han: /[\u4E00-\u9FFF\u3400-\u4DBF]/,
	hangul: /[\uAC00-\uD7AF\u1100-\u11FF]/,
	kana: /[\u3040-\u30FF]/,
	arabic: /[\u0600-\u06FF]/,
	hebrew: /[\u0590-\u05FF]/,
	devanagari: /[\u0900-\u097F]/,
	thai: /[\u0E00-\u0E7F]/,
};

const expectations = {
	cs: ['cyrillic', 'greek', 'han', 'hangul', 'kana', 'arabic', 'hebrew', 'devanagari', 'thai'],
	in: ['cyrillic', 'greek', 'han', 'hangul', 'kana', 'arabic', 'hebrew', 'devanagari', 'thai'],
	vi: ['cyrillic', 'greek', 'han', 'hangul', 'kana', 'arabic', 'hebrew', 'devanagari'],
	el: ['cyrillic', 'han', 'hangul', 'kana', 'arabic', 'hebrew', 'devanagari', 'thai'],
	ja: ['cyrillic', 'hangul', 'arabic', 'hebrew', 'devanagari', 'thai'],
	ko: ['cyrillic', 'kana', 'arabic', 'hebrew', 'devanagari', 'thai'],
	zh: ['cyrillic', 'hangul', 'kana', 'arabic', 'hebrew', 'devanagari', 'thai'],
};

// Traditional-only characters that must not appear in a Simplified draft
const TRADITIONAL = /[們這來個為說裡時過對開關進擊寶劍藥劑師體聲點線麼樣纔於與從願顯驛]|護|隨|離|戰|術|級|絕|紅|綠|藍|黃|髮|淨|靈|牆|鎖|鑰|捲|軸|載|項|鏈|鮮|豔|識|覺|觀|覽|讀|寫|語|譯|標|準|確|認|誤|設|裝|備|啟|動|態|總|結|續|斷|復|雜|嚴|權|極|樂|歡|舊|營|藝|價|億|倉|僅|佈|佔|偵|側|倖|備|傑|偽|傑]/;

let failures = 0;

for (const [code, forbidden] of Object.entries(expectations)) {
	let text;
	try {
		text = readFileSync(new URL(`./${code}.block.txt`, import.meta.url), 'utf8');
	} catch {
		console.log(`${code}: no draft, skipped`);
		continue;
	}
	const hits = [];
	for (const [name, re] of Object.entries(RANGES)) {
		if (!forbidden.includes(name)) continue;
		for (const line of text.split(/\r?\n/)) {
			const m = line.match(new RegExp(`.{0,30}${re.source}.{0,30}`));
			if (m) hits.push(`${name}: ${m[0]}`);
		}
	}
	if (hits.length) {
		failures++;
		console.log(`FAIL ${code}: unexpected script(s)\n  ${hits.slice(0, 10).join('\n  ')}`);
	}
	if (code === 'zh') {
		const trad = [...text.matchAll(new RegExp(TRADITIONAL.source, 'g'))].map((m) => m[0]);
		if (trad.length) {
			failures++;
			console.log(`FAIL zh: Traditional character(s) present: ${[...new Set(trad)].join(' ')}`);
		}
	}
	// non-ASCII characters outside the locale's own script(s), excluding punctuation/symbols
	const unexpected = new Set();
	for (const ch of text) {
		const cp = ch.codePointAt(0);
		if (cp < 128) continue;
		if (/[\u2000-\u206F\u2E00-\u2E7F\u00A0-\u00FF\u2010-\u203F\u3000-\u303F\uFF00-\uFFEF]/.test(ch)) continue;
		const expected =
			(code === 'el' && RANGES.greek.test(ch)) ||
			(code === 'ja' && (RANGES.kana.test(ch) || RANGES.han.test(ch))) ||
			(code === 'ko' && (RANGES.hangul.test(ch) || RANGES.han.test(ch))) ||
			(code === 'zh' && RANGES.han.test(ch));
		if (!expected) unexpected.add(ch);
	}
	console.log(`${code}: ${[...unexpected].join('') || '(none)'} <- non-ASCII outside the expected script`);
}

console.log(failures === 0 ? 'SCRIPT SCAN OK' : `SCRIPT SCAN FAILED (${failures})`);
