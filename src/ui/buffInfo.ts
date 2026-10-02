import { t, titleCase } from '../i18n';
import type { BuffId } from '../simulation/buffs';
import { berserkDamageFactor, berserkShieldBoost } from '../simulation/subclassPassives';

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
	artifactRecharge: 'actors.buffs.artifactrecharge',
	haste: 'actors.buffs.haste',
	cripple: 'actors.buffs.cripple',
	bless: 'actors.buffs.bless',
	vulnerable: 'actors.buffs.vulnerable',
	hex: 'actors.buffs.hex',
	doom: 'actors.buffs.doom',
	degrade: 'actors.buffs.degrade',
	mindvision: 'actors.buffs.mindvision',
	frostImbue: 'actors.buffs.frostimbue',
	fireImbue: 'actors.buffs.fireimbue',
	toxicImbue: 'actors.buffs.toxicimbue',
	blobImmunity: 'actors.buffs.blobimmunity',
	wellFed: 'actors.buffs.wellfed',
	daze: 'actors.buffs.daze',
	vertigo: 'actors.buffs.vertigo',
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
	//`BeamingRayBoost` keeps its real bundle strings (present in every locale),
	//so unlike the Cleric buffs above it needs no `port.*` carry.
	beamingRayBoost: 'actors.hero.spells.beamingray$beamingrayboost',
	divineSense: 'port.buff.divinesense',
	recallUsed: 'port.buff.recallused',
	//The Cleric's `Cleanse` prolongs `PotionOfCleansing.Cleanse` itself, whose
	//name/desc ride a `port.*` key carrying SPD's own tag-`v3.3.8` text like the
	//other Cleric buffs above. Its desc takes the turns-remaining `{0}`, so it
	//stays out of `NO_TURNS_PARAM`.
	cleanseImmunity: 'port.buff.cleanseimmunity',
	rejuvenatingStepsCooldown: 'actors.hero.talent$rejuvenatingstepscooldown',
};

/**
 * Buffs whose real Java `desc()` has no turns-remaining sentence at all (an indefinite state
 * ended by a condition, not a clock) - `Shadows`/`Fury` above are two of these; substituting
 * `{0}` into either would print a stray, unused token.
 */
const NO_TURNS_PARAM = new Set<BuffId>(['cloak', 'fury', 'illuminated', 'satiatedSpells', 'doom']);

export interface BuffInfo {
	name: string;
	desc: string;
}

export interface BerserkBuffInfoState {
	mode: 'normal' | 'berserk' | 'recovering';
	power: number;
	shield: number;
	levelRecovery: number;
	turnRecovery: number;
	hp: number;
	maxHp: number;
	armorBuffedLevel: number;
}

/** The three live counters `Momentum.desc()` (Momentum.java 165-175, tag `v3.3.8`) selects
 * its text from - the buff-map sentinel is not a duration, like `berserk`'s above. */
export interface MomentumBuffInfoState {
	stacks: number;
	freerunTurns: number;
	freerunCooldown: number;
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
 * @param itemName only for `recallUsed`: `UsedItemTracker.desc()` names the tracked
 * item (`%1$s`), which the scene maps back from its Java class. `undefined` prints
 * `?` - reachable only if the tracker lapsed without detaching.
 */
export function buffInfo(id: BuffId | 'hungry' | 'starving', turns: number | undefined, maxHp?: number, itemName?: string, berserk?: BerserkBuffInfoState, momentum?: MomentumBuffInfoState): BuffInfo | null {
	if (id === 'hungry' || id === 'starving') return hungerInfo(id);
	//`ScrollEmpower.desc()` takes fixed +2 level boost and its remaining zap count
	//(actors/buffs/ScrollEmpower.java, tag `v3.3.8`); this is an action count, not turns.
	if (id === 'scrollEmpower') {
		return { name: titleCase(t('actors.buffs.scrollempower.name')),
			desc: t('actors.buffs.scrollempower.desc', { 0: 2, 1: Math.max(0, Math.trunc(turns ?? 0)) }) };
	}
	//`Berserk.desc()` selects Angry, Berserking or Recovering text from live state
	//(actors/buffs/Berserk.java, tag v3.3.8); its buff-map sentinel is not a duration.
	if (id === 'berserk' && berserk) {
		if (berserk.mode === 'berserk') {
			return { name: titleCase(t('actors.buffs.berserk.berserk')),
				desc: t('actors.buffs.berserk.berserk_desc', { 0: Math.max(0, Math.trunc(berserk.shield)) }) };
		}
		if (berserk.mode === 'recovering') {
			const debt = berserk.levelRecovery > 0
				? t('actors.buffs.berserk.recovering_desc_levels', { 0: decimal(berserk.levelRecovery) })
				: t('actors.buffs.berserk.recovering_desc_turns', { 0: Math.max(0, Math.trunc(berserk.turnRecovery)) });
			return { name: titleCase(t('actors.buffs.berserk.recovering')),
				desc: `${t('actors.buffs.berserk.recovering_desc')}\n\n${debt}` };
		}
		const damageBonus = Math.floor(berserkDamageFactor(10000, berserk.power)) / 100 - 100;
		const nextShield = berserkShieldBoost(berserk.hp, berserk.maxHp, berserk.armorBuffedLevel, berserk.power);
		return { name: titleCase(t('actors.buffs.berserk.angered')),
			desc: t('actors.buffs.berserk.angered_desc', { 0: Math.floor(berserk.power * 100), 1: damageBonus, 2: nextShield }) };
	}
	//`Momentum.desc()` (Momentum.java 165-175, tag v3.3.8) selects freerunning, recovering
	//or building text from the live state: turns left while running, the cooldown while
	//resting, and the banked stack count otherwise; without the state the icon degrades to
	//the caller's title-only fallback like an unmapped buff (no key row here, same as
	//`berserk`).
	if (id === 'momentum' && momentum) {
		if (momentum.freerunTurns > 0) {
			return { name: titleCase(t('actors.buffs.momentum.running')),
				desc: t('actors.buffs.momentum.running_desc', { 0: Math.max(0, Math.trunc(momentum.freerunTurns)) }) };
		}
		if (momentum.freerunCooldown > 0) {
			return { name: titleCase(t('actors.buffs.momentum.resting')),
				desc: t('actors.buffs.momentum.resting_desc', { 0: Math.max(0, Math.trunc(momentum.freerunCooldown)) }) };
		}
		return { name: titleCase(t('actors.buffs.momentum.momentum')),
			desc: t('actors.buffs.momentum.momentum_desc', { 0: Math.max(0, Math.trunc(momentum.stacks)) }) };
	}
	const key = BUFF_MESSAGE_KEY[id];
	if (!key) return null;
	if (id === 'recallUsed') {
		return { name: titleCase(t(`${key}.name`)), desc: t(`${key}.desc`, { 0: itemName ?? '?', 1: Math.max(0, turns ?? 0) }) };
	}
	//`ArtifactRecharge.desc()` (`ArtifactRecharge.java`, tag `v3.3.8`) displays `left + 1`.
	if (id === 'artifactRecharge') {
		return { name: titleCase(t(`${key}.name`)), desc: t(`${key}.desc`, { 0: Math.max(0, (turns ?? 0) + 1) }) };
	}
	if (id === 'prismaticGuard') {
		return { name: titleCase(t(`${key}.name`)), desc: t(`${key}.desc`, { 0: Math.max(0, Math.trunc(turns ?? 0)), 1: Math.max(0, Math.trunc(maxHp ?? 0)) }) };
	}
	const desc = NO_TURNS_PARAM.has(id) ? t(`${key}.desc`) : t(`${key}.desc`, { 0: Math.max(0, turns ?? 0) });
	return { name: titleCase(t(`${key}.name`)), desc };
}

function decimal(value: number): string {
	return Number.isFinite(value) ? String(Number(value.toFixed(2))) : '0';
}
