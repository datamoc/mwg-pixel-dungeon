import { BUFF_DURATION, NEGATIVE_BUFFS } from '../simulation/buffs';
import type { BuffId } from '../simulation/buffs';
import { colorblind } from '../settings';

/**
 * `BuffIndicator.BuffButton`'s icon overlays, split out of `buffInfo.ts` (which needs the
 * `i18n` catalogue and so cannot run headless): this module reads only the buff duration
 * tables, so `tools/verifyBuffOverlays.mjs` transpiles and pins it in node with no DOM,
 * Pixi or `mwg`. The renderer (`statusPane.ts`'s `layoutBuffs`) consumes the three
 * functions; the per-buff table below is the only place that needs extending when a new
 * buff gains a status-pane icon.
 */

/** `CharSprite.POSITIVE`/`NEGATIVE` - the tint Java's `BuffButton` hardlights its
 * large-mode text (`text.hardlight(buff.type == POSITIVE ? POSITIVE : NEGATIVE)`). Two
 * pairs, not one, so `settings.colorblind()` (port-original, ROADMAP.md section 8) can
 * swap this text the same way `ui/spdTheme.ts`'s `SPD_STATUS_COLOR` does - duplicated
 * rather than imported from there, since that module pulls in `mwg`/Pixi and this one is
 * deliberately kept headless for `tools/verifyBuffOverlays.mjs`'s plain-node transpile;
 * keep the two literal pairs in sync by hand. */
export const BUFF_TEXT_POSITIVE = 0x00ff00;
export const BUFF_TEXT_NEGATIVE = 0xff0000;
export const BUFF_TEXT_POSITIVE_COLORBLIND = 0x009e73;
export const BUFF_TEXT_NEGATIVE_COLORBLIND = 0xd55e00;

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
	aggression: 'flavour',
	wayward: 'flavour',
	vulnerable: 'flavour',
	cripple: 'flavour',
	paralysis: 'flavour',
	roots: 'flavour',
	levitation: 'flavour',
	featherFall: 'flavour',
	invisibility: 'flavour',
	light: 'flavour',
	degrade: 'flavour',
	frost: 'flavour',
	blindness: 'flavour',
	mindvision: 'flavour',
	frostImbue: 'flavour',
	fireImbue: 'left',
	toxicImbue: 'left',
	blobImmunity: 'flavour',
	drowsy: 'flavour',
	//Amok extends FlavourBuff and gets Java's countdown text, but does not override
	//iconFadePercent(), so its icon remains unfaded like the plain Buff default.
	amok: 'flavour',
	terror: 'flavour',
	//`WellFed.iconTextDisplay()` returns `(int)(left / SaltCube.hungerGainMultiplier()) + 1`;
	//this port has no SaltCube modifier, so the scene's raw left clock is the displayed value.
	wellFed: 'flavour',
	//Charm, Recharging and Haste all extend FlavourBuff at tag v3.3.8.
	charm: 'flavour',
	recharging: 'flavour',
	haste: 'flavour',
	invulnerability: 'flavour',
	//`HolyWepBuff`/`HolyArmBuff` are `FlavourBuff`s with `DURATION = 50`, so both
	//show `(int)visualcooldown()`. `Illuminated` is a plain `Buff` with no
	//`iconTextDisplay()` override - nothing to show, like `Fury`.
	holyWeapon: 'flavour',
	holyWard: 'flavour',
	//`ShieldOfLightTracker`, `DivineSenseTracker` and `UsedItemTracker` are all
	//`FlavourBuff`s with no `iconTextDisplay()` override (tag `v3.3.8`) - the standard
	//+1 countdown on large icons.
	shieldOfLight: 'flavour',
	divineSense: 'flavour',
	recallUsed: 'flavour',
	//`PotionOfCleansing.Cleanse` is a `FlavourBuff` with no `iconTextDisplay()`
	//override (tag `v3.3.8`) - the standard +1 countdown on large icons, and its
	//`iconFadePercent()` is the same `DURATION`-based fade the generic branch
	//computes from the duration table (`DURATION = 5`).
	cleanseImmunity: 'flavour',
	burning: 'left',
	//`Bleeding.iconTextDisplay()` is `(int)Math.round(level)`, not a cooldown.
	//The port stores that intensity in the buff value, so it is the same direct number.
	bleeding: 'left',
	 ooze: 'left',
	//`Poison.iconTextDisplay()` is `(int)left` where `left` is the *damage* pool, while
	//this port's poison value ticks down as remaining turns - same integer-countdown shape,
	//different quantity underneath (stated in `PORT_COVERAGE.md`).
	poison: 'left',
	//`PrismaticGuard.iconTextDisplay()` is `(int)HP` with no +1; the state builder feeds
	//the guard pool (not a duration) as this buff's `turns`, so the same shape holds.
	//The depletion fade (`1 - HP/maxHP`) has no expression: the overlay only sees one
	//number, and the HP text is the more informative half (stated in PORT_COVERAGE.md).
	prismaticGuard: 'left',
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
	if (id === 'bleeding') return String(Math.max(0, Math.round(turns)));
	return String(Math.max(0, Math.trunc(turns)));
}

/** The text tint for a buff id - Java's `buff.type == POSITIVE ? POSITIVE : NEGATIVE`. */
export function buffIconTextColor(id: BuffId | 'hungry' | 'starving'): number {
	const negative = (NEGATIVE_BUFFS as ReadonlySet<string>).has(id);
	if (colorblind()) return negative ? BUFF_TEXT_NEGATIVE_COLORBLIND : BUFF_TEXT_POSITIVE_COLORBLIND;
	return negative ? BUFF_TEXT_NEGATIVE : BUFF_TEXT_POSITIVE;
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
	if (id === 'burning' || id === 'ooze' || id === 'fireImbue' || id === 'toxicImbue') {
		return Math.min(1, Math.max(0, (duration - turns) / duration));
	}
	//`WellFed.iconFadePercent()` uses Hunger.STARVING (450) directly, not the visual
	//left-plus-one value used by FlavourBuff. Keep the Java boundary at a fresh 450.
	if (id === 'wellFed') return Math.min(1, Math.max(0, (duration - turns) / duration));
	if (id === 'amok') return 0;
	//Aggression's Java fade is target-dependent (DURATION 20, or DURATION/4 for
	//bosses/minibosses), but the compact status value does not retain its target class.
	//Keep the icon visible rather than applying the wrong fixed fade curve.
	if (id === 'aggression') return 0;
	if (ICON_TEXT_KIND[id] !== 'flavour') return 0;
	//`UsedItemTracker.iconFadePercent()` reads the rank's own duration (10 or 300);
	//the table only pins the rank-1 default, so live turns above 10 imply rank 2.
	const fadeBase = id === 'recallUsed' && (turns ?? 0) > 10 ? 300 : duration;
	return Math.min(1, Math.max(0, (fadeBase - (turns + 1)) / fadeBase));
}
