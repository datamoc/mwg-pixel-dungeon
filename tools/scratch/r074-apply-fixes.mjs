// R074: apply SPD-authority + linguistic fixes to badge description drafts.
// Replaces whole values (keyed by badge key + locale catalog), logging old -> new.
import fs from 'fs';

const F = {};
F['port.badges.boss1.description'] = {
	es: 'Derrotar a Gú',
	pl: 'Pokonał Wielkiego Szlama',
	ru: 'Победил Слизня',
	uk: 'Переміг Хлюпня',
	hu: 'Legyőzte a Ragacsot',
	nl: 'Versloeg de smurrie',
	ja: 'グゥを倒した',
	cs: 'Porazil Slizáka',
	el: 'Νίκησε τον Γκου',
	zh: '击败粘咕',
	be: 'Перамог Смоўжа',
	eo: 'Venis Ŝmiraĵegon',
	sv: 'Besegrade Klegget',
	zh_hant: '擊敗黏咕',
};
F['port.badges.boss_challenge_1.description'] = {
	es: 'Derrotar a Gú solo con armas',
	pl: 'Pokonał Wielkiego Szlama, używając tylko broni',
	ru: 'Победил Слизня, используя только оружие',
	uk: 'Переміг Хлюпня, використовуючи лише зброю',
	hu: 'Legyőzte a Ragacsot, kizárólag fegyverrel',
	nl: 'Versloeg de smurrie alleen met wapens',
	ja: '武器だけでグゥを倒した',
	cs: 'Porazil Slizáka pouze se zbraněmi',
	el: 'Νίκησε τον Γκου μόνο με όπλα',
	zh: '只用武器击败粘咕',
	be: 'Перамог Смоўжа толькі зброяй',
	eo: 'Venis Ŝmiraĵegon nur per armiloj',
	sv: 'Besegrade Klegget enbart med vapen',
	zh_hant: '只用武器擊敗黏咕',
};
F['port.badges.boss2.description'] = {
	ru: 'Победил Тенгу',
	uk: 'Переміг Тенгу',
	ja: '天狗を倒した',
	cs: 'Porazil Tengu',
	el: 'Νίκησε τον Τένγκου',
	ko: '텐구 암살자를 처치함',
	eo: 'Venis Tengon',
	sv: 'Besegrade Tengun',
};
F['port.badges.boss_challenge_2.description'] = {
	ru: 'Победил Тенгу, используя только оружие',
	uk: 'Переміг Тенгу, використовуючи лише зброю',
	ja: '武器だけで天狗を倒した',
	cs: 'Porazil Tengu pouze se zbraněmi',
	el: 'Νίκησε τον Τένγκου μόνο με όπλα',
	ko: '무기만 사용해 텐구 암살자를 처치함',
	eo: 'Venis Tengon nur per armiloj',
	sv: 'Besegrade Tengun enbart med vapen',
};
F['port.badges.boss3.description'] = {
	ru: 'Победил DM-300',
	uk: 'Переміг ЗМ-300',
	be: 'Перамог DM-300',
};
F['port.badges.boss_challenge_3.description'] = {
	ru: 'Победил DM-300, используя только оружие',
	uk: 'Переміг ЗМ-300, використовуючи лише зброю',
	be: 'Перамог DM-300 толькі зброяй',
};
F['port.badges.boss4.description'] = {
	ru: 'Победил Короля Дворфов',
	uk: 'Переміг Короля Дварфів',
	be: 'Перамог Караля Дварфаў',
	eo: 'Venis la Gnomreĝon',
	sv: 'Besegrade Dvärgakungen',
	ko: '드워프 제왕을 처치함',
};
F['port.badges.boss_challenge_4.description'] = {
	ru: 'Победил Короля Дворфов, используя только оружие',
	uk: 'Переміг Короля Дварфів, використовуючи лише зброю',
	be: 'Перамог Караля Дварфаў толькі зброяй',
	eo: 'Venis la Gnomreĝon nur per armiloj',
	sv: 'Besegrade Dvärgakungen enbart med vapen',
	ko: '무기만 사용해 드워프 제왕을 처치함',
};
F['port.badges.boss_challenge_5.description'] = {
	ru: 'Победил Йог-Джеву, используя только оружие',
	uk: 'Переміг Йог-Джеву, використовуючи лише зброю',
	be: 'Перамог Ёг-Джаву толькі зброяй',
	ja: '武器だけでヨグ＝ゼーヴァを倒した',
	ko: '무기만 사용해 요그제바를 처치함',
	eo: 'Venis Jog-Dzevan nur per armiloj',
};
F['port.badges.piranhas.description'] = { it: 'Sconfitti 6 piranha' };
F['port.badges.enemy_hazards.description'] = { hu: '10 ellenség megölése a veszélyek segítségével' };
F['port.badges.death_trap.description'] = { pt: 'Morreu numa armadilha' };

F['port.badges.bag_velvet.description'] = {
	pl: 'Posiadał aksamitną sakiewkę',
	hu: 'Megszerezte a bársonyzacskót',
	nl: 'Bezat de fluwelen buidel',
	in: 'Memiliki kantong kecil',
	ja: 'ベルベットのポーチを所持した',
	zh: '拥有绒布袋',
	be: 'Валодаў аксамітным мяшочкам',
	eo: 'Posedis la veluran sakon',
	sv: 'Ägde sammetspåsen',
	zh_hant: '擁有絨布袋',
};
F['port.badges.bag_holder.description'] = {
	fr: "Posséder l'étui à parchemins",
	pt: 'Possuiu o canudo de pergaminhos',
	it: 'Posseduto il tubo per pergamene',
	pl: 'Posiadał tubę na zwoje',
	ru: 'Получил футляр для свитков',
	tr: 'Parşömen tutacağını edindi',
	uk: 'Отримав футляр для сувоїв',
	nl: 'Bezat de rolhouder',
	ja: '巻物入れを所持した',
	cs: 'Vlastnil tubu na svitky',
	vi: 'Sở hữu ống đựng cuộn giấy',
	el: 'Είχε τη θήκη παπύρων',
	ko: '주문서 보관함을 소유함',
	be: 'Атрымаў футляр для скруткаў',
	eo: 'Posedis la skribrulaĵujon',
	sv: 'Ägde skriftrullehållaren',
	zh: '拥有卷轴筒',
	zh_hant: '擁有卷軸筒',
};
F['port.badges.bag_bandolier.description'] = {
	fr: 'Posséder la cartouchière pour potions',
	it: 'Posseduta la cintura per pozioni',
	tr: 'İksir palaskasını edindi',
	hu: 'Megszerezte az italos válltáskát',
	nl: 'Bezat de toverdrank patroontas',
	in: 'Memiliki bandolier ramuan',
	ja: 'ポーション入れを所持した',
	cs: 'Vlastnil pás na lektvary',
	vi: 'Sở hữu băng thuốc',
	ko: '물약 보관대를 소유함',
	eo: 'Posedis la flakoningon',
	sv: 'Ägde en potionbandolier',
	zh: '拥有药剂挎带',
	zh_hant: '擁有藥瓶挎帶',
};
F['port.badges.bag_holster.description'] = {
	fr: 'Posséder le carquois magique',
	it: 'Posseduto il fodero magico',
	pl: 'Posiadał magiczny pokrowiec',
	ru: 'Получил волшебный чехол',
	hu: 'Megszerezte a mágikus tegezet',
	nl: 'Bezat het magische holster',
	vi: 'Sở hữu bao da thần kì',
	ko: '마법 보관집을 소유함',
	be: 'Атрымаў чароўны чахол',
	eo: 'Posedis la magian sagujon',
	zh: '拥有魔法筒袋',
	zh_hant: '擁有魔法筒袋',
};

F['port.badges.victory.description'] = {
	in: 'Melarikan diri dengan Jimat',
	ja: 'イェンダーの魔除けを持って脱出した',
	el: 'Δραπέτευσε με το Φυλακτό',
	vi: 'Thoát ra cùng Tấm bùa',
	be: 'Збег з Кудменем',
};
F['port.badges.happy_end.description'] = {
	ru: 'Вынес Амулет Индора на поверхность',
	uk: 'Виніс Амулет Єндера на поверхню',
	tr: "Yendor'un Muskasını yeryüzüne çıkardı",
	in: 'Membawa Jimat Yendor ke permukaan',
	ja: 'イェンダーの魔除けを地上へ持ち帰った',
	el: 'Έφερε το Φυλακτό του Γέντορ στην επιφάνεια',
	ko: '옌더의 부적을 지상으로 가져감',
	zh: '将Yendor护符带到地表',
	be: 'Вынес Кудмень Эндора на паверхню',
	eo: 'Portis la Amuleton de Jendor al la surfaco',
	vi: 'Đưa Tấm bùa Yendor lên mặt đất',
	zh_hant: '將Yendor護符帶到地表',
};
F['port.badges.pacifist_ascent.description'] = {
	ru: 'Вынес Амулет Индора на поверхность, ни разу не ослабив его проклятие',
	uk: 'Виніс Амулет Єндера на поверхню, жодного разу не послабивши його прокляття',
	tr: "Laneti hiç hafifletmeden Yendor'un Muskasını yeryüzüne çıkardı",
	in: 'Membawa Jimat Yendor ke permukaan tanpa pernah mengurangi kutukannya',
	ja: '呪いを一度も弱めずにイェンダーの魔除けを地上へ持ち帰った',
	vi: 'Đưa Tấm bùa Yendor lên mặt đất mà chưa từng làm suy yếu lời nguyền',
	el: 'Έφερε το Φυλακτό του Γέντορ στην επιφάνεια χωρίς ποτέ να μειώσει τη δύναμη της κατάρας του',
	zh: '从未削弱护符诅咒，仍将Yendor护符带到地表',
	be: 'Вынес Кудмень Эндора на паверхню, ні разу не аслабіўшы яго праклён',
	eo: 'Portis la Amuleton de Jendor al la surfaco sen iam malfortigi ĝian malbenon',
	zh_hant: '從未削弱護符詛咒，仍將Yendor護符帶到地表',
};
F['port.badges.unlock_mage.description'] = {
	ru: 'Использовал свиток Улучшения',
	uk: 'Використав сувій покращення',
	hu: 'Felhasznált egy fejlesztéstekercset',
	nl: 'Gebruikte een rol van opwaardering',
	ja: '強化の巻物を使った',
	it: 'Usata una pergamena del miglioramento',
	el: 'Χρησιμοποίησε πάπυρο αναβάθμισης',
	ko: '강화의 주문서를 사용함',
	be: 'Выкарыстаў скрутак Паляпшэння',
	eo: 'Uzis skribrulaĵon de plibonigo',
	sv: 'Använde en skriftrulle av uppgradering',
};
F['port.badges.unlock_huntress.description'] = {
	fr: '10 attaques avec des armes de jet',
	tr: 'Fırlatılan silahlarla 10 saldırı',
};

const CATALOGS = {
	en: 'PORT_STRINGS_EN', fr: 'PORT_STRINGS_FR', de: 'PORT_STRINGS_DE', es: 'PORT_STRINGS_ES',
	pt: 'PORT_STRINGS_PT', it: 'PORT_STRINGS_IT', pl: 'PORT_STRINGS_PL', ru: 'PORT_STRINGS_RU',
	tr: 'PORT_STRINGS_TR', uk: 'PORT_STRINGS_UK', hu: 'PORT_STRINGS_HU', nl: 'PORT_STRINGS_NL',
	in: 'PORT_STRINGS_IN', ja: 'PORT_STRINGS_JA', cs: 'PORT_STRINGS_CS', vi: 'PORT_STRINGS_VI',
	el: 'PORT_STRINGS_EL', ko: 'PORT_STRINGS_KO', zh: 'PORT_STRINGS_ZH', be: 'PORT_STRINGS_BE',
	eo: 'PORT_STRINGS_EO', sv: 'PORT_STRINGS_SV', zh_hant: 'PORT_STRINGS_ZH_HANT',
};

const path = 'src/i18n/portStrings.ts';
let src = fs.readFileSync(path, 'utf8');

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const log = [];
let total = 0;
let applied = 0;
let unchanged = 0;

function blockRange(name) {
	const start = src.indexOf('export const ' + name + ':');
	if (start === -1) throw new Error('catalog not found: ' + name);
	const close = src.indexOf('\n};', start);
	if (close === -1) throw new Error('catalog not closed: ' + name);
	return { start, end: close + 3 };
}

for (const [key, byLocale] of Object.entries(F)) {
	for (const [loc, newVal] of Object.entries(byLocale)) {
		if (typeof newVal !== 'string') throw new Error('bad value for ' + key + ' ' + loc);
		total++;
		const cat = CATALOGS[loc];
		if (!cat) throw new Error('no catalog mapping for locale ' + loc);
		let b = blockRange(cat);
		const seg = src.slice(b.start, b.end);
		const pat = new RegExp("('" + key.replace(/\./g, '\\.') + "'\\s*:\\s*)('(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\")");
		const hit = seg.match(pat);
		if (!hit) throw new Error('key not found: ' + key + ' in ' + cat);
		const escaped = "'" + esc(newVal) + "'";
		if (hit[2] === escaped) {
			unchanged++;
			log.push('UNCHANGED ' + loc + ' ' + key + ' = ' + hit[2]);
			continue;
		}
		const oldVal = hit[2];
		const newSeg = seg.replace(pat, '$1' + escaped);
		src = src.slice(0, b.start) + newSeg + src.slice(b.end);
		log.push('FIX ' + loc + ' ' + key + '\n    - ' + oldVal + '\n    + ' + escaped);
		applied++;
	}
}
fs.writeFileSync(path, src, 'utf8');
fs.writeFileSync('tools/scratch/r074-applied.log', log.join('\n') + '\n', 'utf8');
console.log('planned=' + total + ' applied=' + applied + ' unchanged=' + unchanged);
