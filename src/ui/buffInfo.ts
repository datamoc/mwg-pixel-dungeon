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
	poison: 'actors.buffs.poison',
	ooze: 'actors.buffs.ooze',
	paralysis: 'actors.buffs.paralysis',
	roots: 'actors.buffs.roots',
	invisibility: 'actors.buffs.invisibility',
	levitation: 'actors.buffs.levitation',
	cloak: 'actors.buffs.shadows',
	weakness: 'actors.buffs.weakness',
	fury: 'actors.buffs.fury',
	cripple: 'actors.buffs.cripple',
	bless: 'actors.buffs.bless',
	vulnerable: 'actors.buffs.vulnerable',
	hex: 'actors.buffs.hex',
	degrade: 'actors.buffs.degrade',
	daze: 'actors.buffs.daze',
	light: 'actors.buffs.light',
	invulnerability: 'actors.buffs.ankhinvulnerability',
};

/**
 * Buffs whose real Java `desc()` has no turns-remaining sentence at all (an indefinite state
 * ended by a condition, not a clock) - `Shadows`/`Fury` above are two of these; substituting
 * `{0}` into either would print a stray, unused token.
 */
const NO_TURNS_PARAM = new Set<BuffId>(['cloak', 'fury']);

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
 */
export function buffInfo(id: BuffId | 'hungry' | 'starving', turns: number | undefined): BuffInfo | null {
	if (id === 'hungry' || id === 'starving') return hungerInfo(id);
	const key = BUFF_MESSAGE_KEY[id];
	if (!key) return null;
	const desc = NO_TURNS_PARAM.has(id) ? t(`${key}.desc`) : t(`${key}.desc`, { 0: Math.max(0, turns ?? 0) });
	return { name: titleCase(t(`${key}.name`)), desc };
}
