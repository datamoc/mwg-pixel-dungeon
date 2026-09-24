import { t, titleCase } from '../i18n';
import type { BuffId } from '../simulation/buffs';

/**
 * `WndInfoBuff`: clicking a `BuffIndicator` icon opens a small window with the buff's real
 * name and description, its `{0}` filled from `Buff.desc()`'s own turns-remaining value. This
 * maps this port's `BuffId` (the status pane's `layoutBuffs` keys) to the real SPD message key
 * each icon actually is, per `BuffIndicator.java`'s icon table and each buff class's own
 * `name()`/`desc()`, checked against `v3.3.8`.
 *
 * Two keys intentionally deviate from a bare id lookup: `cloak` is Java's `Shadows` buff
 * (`shadows` in the catalog, not `cloak`), and `invulnerability` here is the Ankh's
 * `AnkhInvulnerability` (`ankhinvulnerability`), since that is the only source this port grants
 * that buff from.
 */
const BUFF_MESSAGE_KEY: Partial<Record<BuffId, string>> = {
	burning: 'actors.buffs.burning',
	bleeding: 'actors.buffs.bleeding',
	poison: 'actors.buffs.poison',
	frost: 'actors.buffs.frost',
	blindness: 'actors.buffs.blindness',
	drowsy: 'actors.buffs.drowsy',
	magicalSleep: 'actors.buffs.magicalsleep',
	amok: 'actors.buffs.amok',
	terror: 'actors.buffs.terror',
	ooze: 'actors.buffs.ooze',
	paralysis: 'actors.buffs.paralysis',
	roots: 'actors.buffs.roots',
	invisibility: 'actors.buffs.invisibility',
	levitation: 'actors.buffs.levitation',
	//`ElixirOfFeatherFall.FeatherBuff` has no own message class; it reuses Levitation's icon
	//and therefore the same info title/description in Java's WndInfoBuff.
	featherFall: 'actors.buffs.levitation',
	cloak: 'actors.buffs.shadows',
	weakness: 'actors.buffs.weakness',
	aggression: 'items.stones.stoneofaggression$aggression',
	wayward: 'items.weapon.curses.wayward$waywardbuff',
	fury: 'actors.buffs.fury',
	charm: 'actors.buffs.charm',
	recharging: 'actors.buffs.recharging',
	haste: 'actors.buffs.haste',
	cripple: 'actors.buffs.cripple',
	bless: 'actors.buffs.bless',
	vulnerable: 'actors.buffs.vulnerable',
	hex: 'actors.buffs.hex',
	degrade: 'actors.buffs.degrade',
	mindvision: 'actors.buffs.mindvision',
	frostImbue: 'actors.buffs.frostimbue',
	fireImbue: 'actors.buffs.fireimbue',
	toxicImbue: 'actors.buffs.toxicimbue',
	blobImmunity: 'actors.buffs.blobimmunity',
	wellFed: 'actors.buffs.wellfed',
	daze: 'actors.buffs.daze',
	vertigo: 'actors.buffs.vertigo',
	combo: 'actors.buffs.combo',
	light: 'actors.buffs.light',
	invulnerability: 'actors.buffs.ankhinvulnerability',
	prismaticGuard: 'actors.buffs.prismaticguard',
	lockedFloor: 'actors.buffs.lockedfloor',
	//The Cleric buffs postdate the checkout, so their name/desc ride `port.*` keys
	//carrying SPD's own tag-`v3.3.8` text (see `portStrings.ts`).
	holyWeapon: 'port.buff.holyweapon',
	holyWard: 'port.buff.holyward',
	powerOfMany: 'port.buff.powerofmany',
	illuminated: 'port.buff.illuminated',
	satiatedSpells: 'port.buff.satiatedspells',
	shieldOfLight: 'port.buff.shieldoflight',
	divineSense: 'port.buff.divinesense',
	recallUsed: 'port.buff.recallused',
	//The Cleric's `Cleanse` prolongs `PotionOfCleansing.Cleanse` itself, whose
	//name/desc ride a `port.*` key carrying SPD's own tag-`v3.3.8` text like the
	//other Cleric buffs above. Its desc takes the turns-remaining `{0}`, so it
	//stays out of `NO_TURNS_PARAM`.
	cleanseImmunity: 'port.buff.cleanseimmunity',
};

/**
 * Buffs whose real Java `desc()` has no turns-remaining sentence at all (an indefinite state
 * ended by a condition, not a clock) - `Shadows`/`Fury` above are two of these; substituting
 * `{0}` into either would print a stray, unused token.
 */
const NO_TURNS_PARAM = new Set<BuffId>(['cloak', 'fury', 'illuminated', 'satiatedSpells']);

export interface BuffInfo {
	name: string;
	desc: string;
}

/**
 * `Hunger`'s two icon states (`hungry`/`starving`) are a real buff too, just not one this
 * port's `BUFF_MESSAGE_KEY` table can drive generically: its name key varies by state and its
 * description is `desc_intro_<state>` prefixed onto the shared `desc` body, per
 * `Hunger.desc()`.
 */
function hungerInfo(state: 'hungry' | 'starving'): BuffInfo {
	return {
		name: t(`actors.buffs.hunger.${state}`),
		desc: t(`actors.buffs.hunger.desc_intro_${state}`) + t('actors.buffs.hunger.desc'),
	};
}

/**
 * Returns the info popup content for a status-pane buff icon, or `null` for an icon this port
 * shows but has no message mapping for yet (a fallback title-only display is still shown by
 * the caller rather than the click doing nothing).
 *
 * @param turns the buff's remaining value (`hero.buffs[id]`) - Java's own `{0}` substitution.
 * @param maxHp only for `prismaticGuard`: Java's `desc` takes `{0}` = current HP and
 * `{1}` = max HP, and the buff-map value here is the pool, not a duration, so the cap
 * arrives separately (the scene feeds `prismaticGuardMaxHp`).
 */
/**
 * @param comboCount only for `combo`: the hit count (`Combo.desc()`'s `{0}`); `turns` is its `{1}`.
 * @param itemName only for `recallUsed`: `UsedItemTracker.desc()` names the tracked
 * item (`%1$s`), which the scene maps back from its Java class. `undefined` prints
 * `?` - reachable only if the tracker lapsed without detaching.
 */
export function buffInfo(id: BuffId | 'hungry' | 'starving', turns: number | undefined, maxHp?: number, itemName?: string, comboCount?: number): BuffInfo | null {
	if (id === 'hungry' || id === 'starving') return hungerInfo(id);
	const key = BUFF_MESSAGE_KEY[id];
	if (!key) return null;
	if (id === 'recallUsed') {
		return { name: titleCase(t(`${key}.name`)), desc: t(`${key}.desc`, { 0: itemName ?? '?', 1: Math.max(0, turns ?? 0) }) };
	}
	if (id === 'combo') {
		//`Combo.desc()`: `{0}` = the hit count, `{1}` = the turns until it is lost.
		return { name: titleCase(t(`${key}.name`)), desc: t(`${key}.desc`, { 0: Math.max(0, comboCount ?? 0), 1: Math.max(0, Math.ceil(turns ?? 0)) }) };
	}
	if (id === 'prismaticGuard') {
		return { name: titleCase(t(`${key}.name`)), desc: t(`${key}.desc`, { 0: Math.max(0, Math.trunc(turns ?? 0)), 1: Math.max(0, Math.trunc(maxHp ?? 0)) }) };
	}
	const desc = NO_TURNS_PARAM.has(id) ? t(`${key}.desc`) : t(`${key}.desc`, { 0: Math.max(0, turns ?? 0) });
	return { name: titleCase(t(`${key}.name`)), desc };
}
