// Throwaway (tools/scratch): the Wandmaker's reward flavor line, moved behind a real key.
//
// `interactWithWandmaker()` hardcoded its final "here's your wand" line as raw English text,
// unlike every sibling `.say()` in the same function (offer/done/remind all use `t(...)`). Real
// Java has no equivalent text at all here (WndWandmaker's own reward flow uses the generic
// "you_now_have" pickup message plus the NPC's own farewell yell) - the frost-vs-magicMissile
// choice and its flavor text are this port's own invented simplification of Java's real
// two-random-wands choice, so these are new port.* keys, hand-translated like the sibling
// offer/done/remind lines already are, not sourced from SPD's own catalog.
import { readFileSync, writeFileSync } from 'node:fs';

const LOCALES = ['en', 'fr', 'de', 'es', 'pt', 'it', 'pl', 'ru', 'tr', 'uk', 'hu', 'nl', 'in', 'ja', 'cs', 'vi', 'el', 'ko', 'zh'];

const VALUES = {
	en: { frost: 'The wandmaker hands you a frost wand: your zaps now chill their target as well.', missile: 'The wandmaker tunes your staff: its zaps strike cleaner than before.' },
	fr: { frost: 'Le fabricant de baguettes vous tend une baguette de gel : vos sorts glacent désormais aussi leur cible.', missile: 'Le fabricant de baguettes ajuste votre bâton : ses sorts frappent désormais plus proprement.' },
	de: { frost: 'Der Stabmacher überreicht dir einen Stab des Frostes: Deine Zauber frieren nun auch das Ziel ein.', missile: 'Der Stabmacher justiert deinen Stab: Seine Zauber treffen nun sauberer als zuvor.' },
	es: { frost: 'El fabricante de varitas te entrega una varita de hielo: tus hechizos ahora también enfrían al objetivo.', missile: 'El fabricante de varitas ajusta tu vara: sus hechizos golpean ahora de forma más limpia.' },
	pt: { frost: 'O fabricante de varinhas entrega-lhe uma varinha da geada: seus feitiços agora também congelam o alvo.', missile: 'O fabricante de varinhas ajusta seu cajado: seus feitiços agora acertam de forma mais limpa.' },
	it: { frost: "L'artefice di bacchette ti porge una bacchetta del congelamento: i tuoi incantesimi ora congelano anche il bersaglio.", missile: "L'artefice di bacchette regola il tuo bastone: i suoi incantesimi colpiscono ora in modo più pulito." },
	pl: { frost: 'Wytwórca różdżek wręcza ci różdżkę mrozu: twoje zaklęcia odtąd również chłodzą cel.', missile: 'Wytwórca różdżek dostraja twoją laskę: jej zaklęcia trafiają teraz czyściej niż wcześniej.' },
	ru: { frost: 'Мастер жезлов вручает вам палочку Холода: теперь ваши разряды ещё и замораживают цель.', missile: 'Мастер жезлов настраивает ваш посох: теперь его разряды бьют чище, чем прежде.' },
	tr: { frost: 'Asa ustası sana bir dondurma asası veriyor: büyülerin artık hedefi de dondurur.', missile: 'Asa ustası asanı ayarlıyor: büyüleri artık daha temiz isabet ediyor.' },
	uk: { frost: 'Виробник жезлів вручає тобі Жезл Морозу: тепер твої розряди ще й морозять ціль.', missile: 'Виробник жезлів налаштовує твій посох: тепер його розряди влучають чистіше, ніж раніше.' },
	hu: { frost: 'A pálcakészítő átad neked egy fagyasztó varázspálcát: a villámaid mostantól lehűtik a célpontot is.', missile: 'A pálcakészítő beállítja a pálcádat: a villámai most tisztábban találnak, mint korábban.' },
	nl: { frost: 'De toverstafmaker overhandigt je een toverstaf van vorst: je spreuken verkoelen voortaan ook het doelwit.', missile: 'De toverstafmaker stelt je staf af: zijn spreuken raken nu zuiverder dan voorheen.' },
	in: { frost: 'Pembuat tongkat sihir memberimu tongkat sihir es: seranganmu kini juga mendinginkan targetnya.', missile: 'Pembuat tongkat sihir menyetel tongkatmu: seranganmu kini mengenai lebih bersih dari sebelumnya.' },
	ja: { frost: '杖職人は凍結の杖を手渡した。呪文が敵を凍結させるようになった。', missile: '杖職人はあなたの杖を調整した。呪文がより正確に命中するようになった。' },
	cs: { frost: 'Výrobce hůlek ti podává Hůlku mrazu: tvá kouzla teď cíl také ochladí.', missile: 'Výrobce hůlek doladí tvou hůl: její kouzla teď zasahují čistěji než dřív.' },
	vi: { frost: 'Người làm đũa phép trao cho bạn một cây đũa phép băng giá: phép thuật của bạn giờ cũng làm lạnh cóng mục tiêu.', missile: 'Người làm đũa phép chỉnh lại cây đũa của bạn: phép thuật giờ đánh trúng gọn gàng hơn trước.' },
	el: { frost: 'Ο ραβδοποιός σού δίνει ένα ραβδί παγώματος: οι επιθέσεις σου τώρα παγώνουν και τον στόχο.', missile: 'Ο ραβδοποιός ρυθμίζει το ραβδί σου: οι επιθέσεις του χτυπούν πλέον πιο καθαρά.' },
	ko: { frost: '지팡이 깎는 노인이 서리의 마법 막대를 건넨다: 이제 마법 공격이 대상을 얼리기도 한다.', missile: '지팡이 깎는 노인이 당신의 지팡이를 조율한다: 이제 마법 공격이 이전보다 더 깔끔하게 명중한다.' },
	zh: { frost: '老杖匠递给你一根冰霜法杖：你的法术现在也会冻伤目标。', missile: '老杖匠调校了你的法杖：它的法术命中更加干净利落。' },
};

const path = 'src/i18n/portStrings.ts';
let source = readFileSync(path, 'utf8');
const anchor = "'port.npc.wandmaker.remind'";
let count = 0;
for (const locale of LOCALES) {
	const marker = `export const PORT_STRINGS_${locale.toUpperCase()}`;
	const start = source.indexOf(marker);
	if (start < 0) throw new Error(`no block for ${locale}`);
	const at = source.indexOf(anchor, start);
	if (at < 0) throw new Error(`no anchor in ${locale}`);
	// the anchor line's value may itself be on the next line (long values wrap); walk to the
	// end of the *value*, i.e. the next line that ends the statement with a trailing comma
	let lineEnd = source.indexOf('\n', at);
	if (!source.slice(at, lineEnd).includes(',')) lineEnd = source.indexOf('\n', lineEnd + 1);
	const v = VALUES[locale];
	const quote = (s) => (s.includes("'") ? `"${s}"` : `'${s}'`);
	const block = [
		`\t'port.npc.wandmaker.reward.frost': ${quote(v.frost)},`,
		`\t'port.npc.wandmaker.reward.missile': ${quote(v.missile)},`,
	].join('\n');
	source = source.slice(0, lineEnd) + '\n' + block + source.slice(lineEnd);
	count++;
}
writeFileSync(path, source);
console.log(`inserted 2 keys x ${count} locales`);
