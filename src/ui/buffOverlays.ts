import { BUFF_DURATION, NEGATIVE_BUFFS } from '../simulation/buffs';
import type { BuffId } from '../simulation/buffs';

/**
 * `BuffIndicator.BuffButton`'s icon overlays, split out of `buffInfo.ts` (which needs the
 * `i18n` catalogue and so cannot run headless): this module reads only the buff duration
 * tables, so `tools/verifyBuffOverlays.mjs` transpiles and pins it in node with no DOM,
 * Pixi or `mwg`. The renderer (`statusPane.ts`'s `layoutBuffs`) consumes the three
 * functions; the per-buff table below is the only place that needs extending when a new
 * buff gains a status-pane icon.
 */

/** `CharSprite.POSITIVE`/`NEGATIVE` - the tint Java's `BuffButton` hardlights its
 * large-mode text (`text.hardlight(buff.type == POSITIVE ? POSITIVE : NEGATIVE)`). */
export const BUFF_TEXT_POSITIVE = 0x00ff00;
export const BUFF_TEXT_NEGATIVE = 0xff0000;

/**
 * Which buffs carry Java's `iconTextDisplay()` countdown on large icons, and in which
 * arithmetic. Checked class by class at tag `v3.3.8`:
 * - `'flavour'`: every `FlavourBuff` subclass shows `(int)visualcooldown()`, and
 *   `visualcooldown()` is `cooldown() + 1` (`Buff.java` - "buffs act after the hero, so
 *   it is often useful to use cooldown+1 when display buff time remaining"), so the
 *   displayed number is the remaining turns plus one. This is the bless/hex/daze/
 *   weakness/vulnerable/cripple/paralysis/roots/levitation/invisibility/light/degrade/
 *   invulnerability shape (`Invulnerability` extends `FlavourBuff` with `DURATION = 3`).
 * - `'left'`: `Burning`/`Ooze`/`Poison` show their own `(int)left` field with no +1.
 * - absent: `Fury` extends `Buff` with neither override; `Shadows` (the cloak) inherits
 *   the text but overrides `iconFadePercent()` to 0 and this port's cloak value is a
 *   condition/sentinel count rather than Java's charges, so showing it would print a
 *   meaningless number; `Berserk`'s text is a power percent/shield/recovery readout with
 *   no turns-left quantity behind it, which this port does not model; Monk `Focus`
 *   (Java `MonkEnergy`) shows an energy count this port's flag buff has no equivalent of.
 * Hunger states have no override either way.
 */
const ICON_TEXT_KIND: Partial<Record<BuffId | 'hungry' | 'starving', 'flavour' | 'left'>> = {
	bless: 'flavour',
	hex: 'flavour',
	daze: 'flavour',
	weakness: 'flavour',
	vulnerable: 'flavour',
	cripple: 'flavour',
	paralysis: 'flavour',
	roots: 'flavour',
	levitation: 'flavour',
	invisibility: 'flavour',
	light: 'flavour',
	degrade: 'flavour',
	invulnerability: 'flavour',
	burning: 'left',
	ooze: 'left',
	//`Poison.iconTextDisplay()` is `(int)left` where `left` is the *damage* pool, while
	//this port's poison value ticks down as remaining turns - same integer-countdown shape,
	//different quantity underneath (stated in `PORT_COVERAGE.md`).
	poison: 'left',
};

/**
 * `BuffIndicator.BuffButton.updateIcon()`'s text half: the string a large icon overlays
 * bottom-right, or `null` where Java shows none. `turns` is this port's remaining-turns
 * value (`hero.buffs[id]`), the same quantity Java's `cooldown()`/`left` holds.
 */
export function buffIconText(id: BuffId | 'hungry' | 'starving', turns: number | undefined): string | null {
	const kind = ICON_TEXT_KIND[id];
	if (!kind || turns === undefined) return null;
	if (kind === 'flavour') return String(Math.max(0, Math.trunc(turns + 1)));
	return String(Math.max(0, Math.trunc(turns)));
}

/** The text tint for a buff id - Java's `buff.type == POSITIVE ? POSITIVE : NEGATIVE`. */
export function buffIconTextColor(id: BuffId | 'hungry' | 'starving'): number {
	return (NEGATIVE_BUFFS as ReadonlySet<string>).has(id) ? BUFF_TEXT_NEGATIVE : BUFF_TEXT_POSITIVE;
}

/**
 * `BuffButton.updateIcon()`'s fade half: the `iconFadePercent()` grey-overlay fraction
 * (0 = none, growing as the buff expires), or 0 where Java shows none. The `+1` faces
 * the same way as the text: `FlavourBuff` fades read `visualcooldown()`, `Burning`/`Ooze`
 * read their own `left`, and `Poison` has no fade override at all (text only, even in
 * Java). Sentinel/indefinite durations (`fury`/`berserk`/`cloak`/`focus` at 9999, zero
 * durations, unknown values) fade nothing - Java's `Fury`/`Shadows` likewise define no
 * fade, and `Berserk`'s state-fraction fade has no quantity behind it here.
 */
export function buffIconFade(id: BuffId | 'hungry' | 'starving', turns: number | undefined): number {
	if (turns === undefined) return 0;
	const duration = (BUFF_DURATION as Partial<Record<string, number>>)[id] ?? 0;
	if (!(duration > 0) || duration >= 9999) return 0;
	if (id === 'burning' || id === 'ooze') {
		return Math.min(1, Math.max(0, (duration - turns) / duration));
	}
	if (ICON_TEXT_KIND[id] !== 'flavour') return 0;
	return Math.min(1, Math.max(0, (duration - (turns + 1)) / duration));
}
