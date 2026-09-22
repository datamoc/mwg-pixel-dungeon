import { Actors, Roguelike } from 'mwg';
import { CLASS_AMMO, type ClassId } from '../classes';
import { addBuff, buffBlocked, type BuffId, type Creature, type Step } from '../combat';
import { t } from '../i18n/index';
import { mwlItemEffectValue } from '../mwlContent';
import { prismaticGuardMaxHp } from '../simulation/prismatic';
import { empoweringScrollsCharges, sharedUpgradeArmor, twinUpgradeArmor } from '../talentEffects';
import { getCurse } from './itemCurses';
import { MISSILE_DEFAULT_QUANTITY, MISSILE_MAX_DURABILITY, recordMissileUpgrade } from './missiles';
import type { EquippedRing } from './ringModifiers';
import { selectScrollId } from './scrolls';

/**
 * Scroll effects are item-domain rules. The scene supplies only world services
 * (FOV, movement, spawning and combat), keeping level orchestration out of the
 * item graph. Values and effect shape follow SPD's ScrollOf* classes.
 */
export interface ScrollEffectsContext {

	readonly hero: Creature;
	readonly creatures: Creature[];
	readonly level: { width: number; height: number; passable(x: number, y: number): boolean };
	readonly fov: { isVisible(x: number, y: number): boolean; revealAll(): void };
	readonly secrets: { isSecret(x: number, y: number): boolean; discover(x: number, y: number): void };
	isChasmCell(x: number, y: number): boolean;
	readonly creatureAt: (x: number, y: number) => Creature | null | undefined;
	readonly spawnMirrorImage: (at: Step) => void;
	readonly randomFreeCell: (exclude: Step) => Step | undefined;
	readonly moveTo: (creature: Creature, to: Step) => void;
	readonly playTeleportAppear: (from: Step, to: Step, entity: Creature) => void;
	readonly restitchAllTiles: () => void;
	readonly showDamage: (target: Creature, amount: number) => void;
	readonly showHeal: (target: Creature, amount: number) => void;
	readonly kill: (target: Creature) => void;
	readonly say: (message: string, level?: 'positive' | 'negative' | 'warning') => void;
	/** The hero's level for `PrismaticGuard.maxHP`; the scene's progression level. */
	readonly heroLevel: number;
	/** Set (or reset) the latent guard pool; the buff-map icon is re-armed with it. */
	readonly grantPrismaticGuard: (hp: number) => void;
}

export function applyScrollEffect(id: string, context: ScrollEffectsContext): boolean {
	const { hero, creatures, fov } = context;
	if (id === 'scrollRage') {
		for (const creature of creatures) {
			if (creature.isHero || creature.isNPC) continue;
			creature.sleeping = false;
			creature.seesHero = true;
			if (!creature.isAlly && fov.isVisible(creature.x, creature.y)) addBuff(creature, 'amok');
		}
		context.say(t('port.log.rage'));
		return true;
	}
	if (id === 'scrollLullaby') {
		for (const creature of creatures) if (!creature.isHero && !creature.isNPC && fov.isVisible(creature.x, creature.y)) addBuff(creature, 'drowsy');
		addBuff(hero, 'drowsy');
		context.say(t('port.log.lullaby'));
		return true;
	}
	if (id === 'scrollMapping') {
		fov.revealAll();
		for (let y = 0; y < context.level.height; y++) for (let x = 0; x < context.level.width; x++) {
			if (context.secrets.isSecret(x, y)) context.secrets.discover(x, y);
		}
		context.restitchAllTiles();
		context.say(t('port.log.mapping'), 'positive');
		return true;
	}
	if (id === 'scrollMirror') {
		const cells = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: hero.x + dx, y: hero.y + dy }))
			.filter((at) => context.level.passable(at.x, at.y) && !context.isChasmCell(at.x, at.y) && !context.creatureAt(at.x, at.y));
		for (const at of cells.slice(0, mwlItemEffectValue('scrollMirror', 'imageCount'))) context.spawnMirrorImage(at);
		context.say(t('port.log.mirror'), 'positive');
		return true;
	}
	if (id === 'scrollRecharging') {
		addBuff(hero, 'recharging');
		context.say(t('port.log.recharging'), 'positive');
		return true;
	}
	if (id === 'scrollTeleportation') {
		delete hero.buffs['roots'];
		const destination = context.randomFreeCell(hero);
		if (destination) {
			const teleportFrom = { x: hero.x, y: hero.y };
			context.moveTo(hero, destination);
			context.playTeleportAppear(teleportFrom, destination, hero);
			context.say(t('items.scrolls.scrollofteleportation.tele'), 'positive');
		} else context.say(t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
		return true;
	}
	if (id === 'scrollTerror') {
		const affected: Creature[] = [];
		//`ScrollOfTerror.doRead()` (tag `v3.3.8`) skips `ALIGNMENT == ALLY` - the rage
		//branch above already had its `!isAlly` guard, terror was missing it, so a
		//read scattered the hero's own mirror images and allies. Found by the 16th
		//monster-analysis matrix (scrolls).
		for (const creature of creatures) if (!creature.isHero && !creature.isNPC && !creature.isAlly && fov.isVisible(creature.x, creature.y)) {
			addBuff(creature, 'terror');
			affected.push(creature);
		}
		if (affected.length === 0) context.say(t('items.scrolls.scrollofterror.none'), 'negative');
		else if (affected.length === 1) context.say(t('items.scrolls.scrollofterror.one', { '0': affected[0]!.name }), 'positive');
		else context.say(t('items.scrolls.scrollofterror.many'), 'positive');
		return true;
	}
	if (id === 'scrollRetribution') {
		const missingHpFraction = (hero.maxHp - hero.hp) / hero.maxHp;
		const power = Math.min(mwlItemEffectValue('scrollRetribution', 'maxPower'),
			mwlItemEffectValue('scrollRetribution', 'powerPerMissingHp') * missingHpFraction);
		for (const creature of [...creatures]) {
			//`ScrollOfRetribution` is one of `AntiMagic.RESISTS`' listed source classes -
			//`Char.damage()` zeroes this blast for a MagicImmune creature the same way it does
			//for every other RESISTS-listed source.
			if (creature.isHero || creature.isNPC || !fov.isVisible(creature.x, creature.y) || creature.magicImmune) continue;
			const damage = Math.round(creature.maxHp * mwlItemEffectValue('scrollRetribution', 'baseHpFraction')
				+ creature.hp * power * mwlItemEffectValue('scrollRetribution', 'targetHpScale'));
			creature.hp -= damage;
			context.showDamage(creature, damage);
			if (creature.hp <= 0) context.kill(creature);
			//`ScrollOfRetribution.doRead()` (`ScrollOfRetribution.java`, tag `v3.3.8`)
			//prolongs `Blindness` (10) on every damaged survivor plus the reader.
			//Java's Blindness is vision-only (no `act()` override, no stat touch -
			//blinded chars just see less far), which has no seam here; `daze` is the
			//standing stand-in (same as the Dazzling curse), overstating slightly
			//since it also halves rolls. Survivors only, matching Java's `isAlive()`.
			else if (!buffBlocked(creature, 'daze')) creature.buffs['daze'] = Math.max(creature.buffs['daze'] ?? 0, 10);
		}
		addBuff(hero, 'weakness');
		if (!buffBlocked(hero, 'daze')) hero.buffs['daze'] = Math.max(hero.buffs['daze'] ?? 0, 10);
		context.say(t('items.scrolls.scrollofretribution.blast'), 'warning');
		return true;
	}
	if (id === 'scrollPrismatic') {
		//`ScrollOfPrismaticImage.doRead()` (tag `v3.3.8`): heal every live image to
		//its HT with the floating heal readout, else grant the latent guard at full
		//charge. Java's middle branch (a stasis ally that is an image) has no system
		//here - no Cleric spells, so no stasis ally can ever be an image. Java logs
		//no line on this read (READ sample plus read animation only); the buff icon
		//and the hatched image are the feedback, so this port logs none either.
		//Re-reading with a live image heals rather than stacking guards, exactly
		//like Java's `found` check; re-reading with only a guard active resets its
		//pool to full (`Buff.affect` on the existing buff, then `set(maxHP)`).
		let found = false;
		for (const creature of creatures) {
			//A fading image sits at 0 HP but is still a live mob (`isActive()` while
			//`deathTimer > 0`), and Java heals it back to full - the scroll is the
			//rescue for a fading image. Anything at 0 HP without a fade counter is
			//unreachable (death removes it), so the fade check doubles as the guard.
			if (!creature.isAlly || creature.allyKind !== 'prismatic') continue;
			if (creature.hp <= 0 && creature.prismaticFade === undefined) continue;
			found = true;
			if (creature.hp < creature.maxHp) {
				const restored = creature.maxHp - creature.hp;
				creature.hp = creature.maxHp;
				delete creature.prismaticFade;
				context.showHeal(creature, restored);
			} else delete creature.prismaticFade;
		}
		if (!found) context.grantPrismaticGuard(prismaticGuardMaxHp(context.heroLevel));
		return true;
	}
	return false;
}

/**
 * The scroll-read selection plus dispatch: `readScroll` in the scene, moved here
 * verbatim as the file-size refactor's twenty-seventh extraction, behavior-identical.
 * The scene keeps the one-line adapter plus a builder.
 */
export interface ReadScrollContext extends ScrollEffectsContext {
	readonly bag: Actors.Inventory;
	readonly requestedItemId: string | null;
	readonly requestedItemInstanceId: string | undefined;
	/** `Ring.setKnown()` on identify - the scene owns the per-run known set. */
	readonly markRingTypesKnown: (ids: string[]) => void;
	readonly heroClass: string;
	readonly talentRank: (id: string) => number;
	//Get/set pair (not set-only like TransmuteFlowContext): this builder spreads
	//scrollEffectsContext(), and a spread literal cannot satisfy a set-only member.
	get empoweredZaps(): number;
	set empoweredZaps(zaps: number);
	readonly itemDisplayName: (id: string, identified: boolean) => string;
	readonly procIdentifyTalents: () => void;
	/** `Talent.onScrollUsed()`'s Cleric half (tag `v3.3.8`) - the scene
	 * implementation no-ops unless the hero is a Cleric with the talent. */
	readonly armRecallInscription: (sourceClass: string) => void;
	readonly startTransmutationPick: (instanceId: string | undefined) => boolean;
	get weaponAffix(): string | null;
	set weaponAffix(affix: string | null);
	get armorGlyph(): string | null;
	set armorGlyph(glyph: string | null);
	/** Live equipped-ring object; the cleanse fallback clears its curse in place. */
	readonly equippedRing: EquippedRing | null;
	readonly syncHeroFromStats: () => void;
}

/**
 * The `getClass()` Java's `readAnimation` reports to `Talent.onScrollUsed()`
 * (`items/scrolls/Scroll.java`, tag `v3.3.8`) per port scroll id. Four ids rename
 * (`scrollCleanse` is `ScrollOfRemoveCurse`, `scrollMapping` is
 * `ScrollOfMagicMapping`, `scrollMirror` is `ScrollOfMirrorImage`, `scrollPrismatic`
 * is the exotic `ScrollOfPrismaticImage`); the rest are `ScrollOf` + remainder.
 * Unknown ids have no Java class and arm nothing (their cost would be 0, which
 * also fails `canCast`). Upgrade/transmutation never reach the call below -
 * refused/delegated before the consume - so they need no special case.
 */
export function recallScrollClass(id: string): string | undefined {
	if (id === 'scrollCleanse') return 'ScrollOfRemoveCurse';
	if (id === 'scrollMapping') return 'ScrollOfMagicMapping';
	if (id === 'scrollMirror') return 'ScrollOfMirrorImage';
	if (id === 'scrollPrismatic') return 'ScrollOfPrismaticImage';
	if (!id.startsWith('scroll')) return undefined;
	const known = ['scrollIdentify', 'scrollLullaby', 'scrollRage', 'scrollRecharging',
		'scrollRetribution', 'scrollTeleportation', 'scrollTerror', 'scrollTransmutation', 'scrollUpgrade'];
	if (!known.includes(id)) return undefined;
	return `ScrollOf${id.slice('scroll'.length)}`;
}

/**
 * `RecallInscription.onCast()`'s re-read (`RecallInscription.java`, tag `v3.3.8`):
 * the recalled scroll is a fresh instance (`Reflection.newInstance`) read with
 * `talentChance = 0` - its effect runs fully (identify still identifies, the cleanse
 * fallback still cleanses) but nothing is consumed from the bag, no talent procs
 * fire (`EMPOWERING_SCROLLS`, identify talents, the recall re-arm), and no turn is
 * spent here (Java's `onCast` spends none either). `forceItemId` selects that
 * scroll directly; transmutation recall keeps its own path (it still consumes the
 * *target*, so it threads through `startTransmutationPick`, not here).
 */
/**
 * The inverse of `recallScrollClass`: the port id a tracked Java scroll class
 * re-reads as in `resolveRecall`. Exotic classes have no port effect (this port
 * generates no exotic scrolls, so they can never be tracked either) and map to
 * `undefined`, which refuses the cast like a lapsed tracker.
 */
export function recallPortScrollId(javaClass: string): string | undefined {
	switch (javaClass) {
		case 'ScrollOfRemoveCurse': return 'scrollCleanse';
		case 'ScrollOfMagicMapping': return 'scrollMapping';
		case 'ScrollOfMirrorImage': return 'scrollMirror';
		case 'ScrollOfPrismaticImage': return 'scrollPrismatic';
		case 'ScrollOfIdentify': return 'scrollIdentify';
		case 'ScrollOfLullaby': return 'scrollLullaby';
		case 'ScrollOfRage': return 'scrollRage';
		case 'ScrollOfRecharging': return 'scrollRecharging';
		case 'ScrollOfRetribution': return 'scrollRetribution';
		case 'ScrollOfTeleportation': return 'scrollTeleportation';
		case 'ScrollOfTerror': return 'scrollTerror';
		case 'ScrollOfTransmutation': return 'scrollTransmutation';
		default: return undefined;
	}
}

/**
 * The port bag id a tracked Java class re-activates as (`resolveRecall`) and names
 * in the tracker's info window: `StoneOfX` stones lowercase their initial, scrolls
 * invert `recallScrollClass`. `undefined` for classes this port has no effect for
 * (exotics, unknowns) - which refuses the cast like a lapsed tracker.
 */
export function recallTrackedPortId(javaClass: string): string | undefined {
	if (javaClass.startsWith('StoneOf')) {
		if (!RECALLABLE_STONES.has(javaClass)) return undefined;
		return `stone${javaClass.slice('Stone'.length)}`;
	}
	return recallPortScrollId(javaClass);
}

/** The twelve `Runestone` classes `recastStone` (`stones.ts`) reactivates - extend both. */
const RECALLABLE_STONES: ReadonlySet<string> = new Set(['StoneOfFlock', 'StoneOfAggression',
	'StoneOfAugmentation', 'StoneOfFear', 'StoneOfDeepSleep', 'StoneOfBlink',
	'StoneOfClairvoyance', 'StoneOfShock', 'StoneOfBlast', 'StoneOfEnchantment',
	'StoneOfDetectMagic', 'StoneOfIntuition']);

export function readScrollFlow(context: ReadScrollContext, opts?: { freeRecast?: boolean; forceItemId?: string }): boolean {
	const { bag } = context;
	const free = opts?.freeRecast === true;
	const selectedScroll = opts?.forceItemId ?? selectScrollId({
		bag,
		requestedItemId: context.requestedItemId,
		say: (line, level) => context.say(line, level === 'info' ? undefined : level),
	});
	if (!selectedScroll) return false;
	//`Talent.EMPOWERING_SCROLLS` (Battlemage/Warlock T3): reading any scroll arms the next
	//1/2/3 wand zaps at +3 levels (`empoweredZaps`, consumed one per zap in `useSpecial`'s
	//zap branch). Armed here at selection time rather than at consumption: every branch
	//below consumes the scroll on a successful read (transmutation inside
	//`completeTransmutation`, which arms the same way), while a cancelled picker or an
	//empty eligible list consumes nothing - and arming on a cancelled read would hand out
	//free charges, so transmutation returns before arming and arms only on success there.
	//(Identify/effect/cleanse all consume below, so arming here is exact for them.)
	const armEmpowered = selectedScroll !== 'scrollTransmutation'
		&& context.heroClass === 'mage' && context.talentRank('empowering_scrolls') > 0;
	const unidentified = bag.items.find((i) => !i.identified && i.quantity > 0);
	const id = selectedScroll;
	if (id === 'scrollUpgrade') {
		context.say(t('port.log.scrollisforgear'));
		return false;
	}
	//Transmutation targeting and reroll live in `items/transmutation.ts` behind
	//`TransmuteFlowContext` (file-size refactor) - see `startTransmutationPick`.
	if (id === 'scrollTransmutation') return context.startTransmutationPick(context.requestedItemInstanceId);
	if (!free) bag.remove(id, 1, context.requestedItemInstanceId);
	//`Scroll.readAnimation()`'s `Random.Float() < talentChance` (same file): chance is 1
	//for every ported scroll, so each successful read below arms the recall tracker -
	//except a free re-read, whose `talentChance = 0` reports no class back.
	const recallClass = free ? undefined : recallScrollClass(id);
	if (recallClass !== undefined) context.armRecallInscription(recallClass);
	if (armEmpowered && !free) context.empoweredZaps = empoweringScrollsCharges(context.talentRank('empowering_scrolls'));

	if (id === 'scrollIdentify') {
		if (unidentified) {
			Actors.identify(unidentified);
			if (unidentified.id.startsWith('ring_')) context.markRingTypesKnown([unidentified.id]);
			//**Correction, 2026-09-09 roadmap pass**: a prior audit pass (checking only
			//Java tags `v3.3.8`/`4.0.0-beta`) wrongly called `test_subject`/`tested_hypothesis`
			//invented substitutes for the unrelated `PROVOKED_ANGER`/`LINGERING_MAGIC` talents.
			//They are real, named talents in the version of SPD this checkout's generated
			//message catalog was actually built from (`actors.hero.talent.test_subject`/
			//`tested_hypothesis`, real English text still in `src/generated/spdMessages.ts`),
			//simply absent from the two older tags checked. Both amounts live in
			//`procIdentifyTalents`, which every identify site shares (see its own comment).
			const heal = context.heroClass === 'warrior' ? context.talentRank('test_subject') : 0;
			const charge = context.heroClass === 'mage' ? context.talentRank('tested_hypothesis') : 0;
			if (!free && (heal > 0 || charge > 0)) context.procIdentifyTalents();
			//The old secret-revealing radius here invoked `arcaneVisionRadius()` - removed
			//outright: real Arcane Vision (Mage T2, `Wand.wandProc()`) marks the ZAPPED
			//target with `CharAwareness` for `5+5*points` turns, and has no identify/read
			//interaction at all. Revealing secrets on identify had no Java basis (the same
			//fabricated-stand-in class as the old Nature's Bounty dew odds). The real
			//zap-half lives in `useSpecial`'s zap branch now.
			context.say(t('port.log.identify', { item: context.itemDisplayName(unidentified.id, true) }), 'positive');
		} else context.say(t('port.log.nothingunidentified'), 'negative');
	} else if (applyScrollEffect(id, context)) {
		return true;
	} else {
		//ScrollOfRemoveCurse.doRead() is genuinely this branch's effect ('scrollCleanse' hits
		//it correctly). `ScrollOfTransmutation` has its own transmute branch above, so
		//this default is only reached by genuinely unknown scroll ids - still Remove
		//Curse's effect, a deliberate fallback rather than a silent misbehavior.
		//See `PORT_COVERAGE.md`.
		for (const b of ['weakness', 'vulnerable', 'hex', 'daze'] as BuffId[]) delete context.hero.buffs[b];
		for (const item of bag.items) if (item.cursed || getCurse(item.affix ?? '')) Actors.removeAffix(item);
		if (getCurse(context.weaponAffix ?? '')) context.weaponAffix = null;
		if (getCurse(context.armorGlyph ?? '')) context.armorGlyph = null;
		if (context.equippedRing?.cursed) context.equippedRing.cursed = false;
		context.syncHeroFromStats();
		context.say(t('port.log.cleanse'), 'positive');
	}
	return true;
}

/**
 * The `scrollUpgrade` action (`upgradeGear` in the scene, plus its
 * `rollUpgradeAffixLoss` helper), moved here verbatim as the file-size refactor's
 * twenty-eighth extraction, behavior-identical - except that the two `Random` rolls
 * arrive on the context (`randomInt`/`randomFloat`, the scene passing the real ones),
 * so the headless drive can script them exactly like the suite's other scripted-rng
 * seams. The scene keeps the one-line adapter plus a builder.
 */
export interface UpgradeGearContext {
	readonly bag: Actors.Inventory;
	readonly hero: Creature;
	readonly heroClass: ClassId;
	readonly subclass: () => string | null;
	readonly talentRank: (id: string) => number;
	get missileLevel(): number;
	set missileLevel(level: number);
	get weaponLevel(): number;
	set weaponLevel(level: number);
	get weaponCursed(): boolean;
	set weaponCursed(cursed: boolean);
	readonly weaponCursedKnown: boolean;
	get armorLevel(): number;
	set armorLevel(level: number);
	get armorCursed(): boolean;
	set armorCursed(cursed: boolean);
	readonly armorCursedKnown: boolean;
	get ammo(): number;
	set ammo(ammo: number);
	set ammoDurability(durability: number);
	get ammoSetId(): string;
	set ammoSetId(id: string);
	readonly newMissileSetId: () => string;
	get missileThresholds(): Map<string, number>;
	set missileThresholds(thresholds: Map<string, number>);
	readonly wandCharges: { refund(n: number): void };
	get weaponAffix(): string | null;
	set weaponAffix(affix: string | null);
	get armorGlyph(): string | null;
	set armorGlyph(glyph: string | null);
	get weaponHardened(): boolean;
	set weaponHardened(hardened: boolean);
	get armorHardened(): boolean;
	set armorHardened(hardened: boolean);
	/** Scriptable rolls: `Random.int`/`Random.float` in play, a queue in the suite. */
	readonly randomInt: (min: number, max: number) => number;
	readonly randomFloat: (bound: number) => number;
	readonly say: (message: string, level?: 'positive' | 'negative' | 'warning') => void;
	readonly syncHeroFromStats: () => void;
}

export function upgradeGearFlow(context: UpgradeGearContext): boolean {
	const scroll = context.bag.find('scrollUpgrade');
	if (!scroll) {
		context.say(t('port.log.noupgrade'), 'negative');
		return false;
	}
	//The Java item picker can target missiles independently. With no picker, let ammo users
	//catch missiles up after both equipped items have reached that level; otherwise choose the
	//lower-level weapon/armor pair below. This preserves a usable missile-upgrade path while
	//keeping the auto-selection rule deterministic.
	if (CLASS_AMMO.has(context.heroClass) && context.missileLevel < Math.min(context.weaponLevel, context.armorLevel)) {
		context.bag.remove('scrollUpgrade', 1);
		context.missileLevel++;
		//`MissileWeapon.upgrade()` on the wielded stack: full wear, and the refill to
		//`defaultQuantity()` - the pile count *is* that stack's quantity here.
		context.ammo = Math.max(context.ammo, MISSILE_DEFAULT_QUANTITY);
		context.ammoDurability = MISSILE_MAX_DURABILITY;
		//`MissileWeapon.upgrade()`: the upgraded stack's set records `trueLevel()+1`, so
		//heaps of that set scattered before this upgrade crumble on pickup (see below).
		//An upgraded *stack* owns the set its threshold is recorded under, so an empty pile - which
		//has no stack yet - mints one now rather than recording a threshold under the empty set.
		if (!context.ammoSetId) context.ammoSetId = context.newMissileSetId();
		context.missileThresholds = recordMissileUpgrade(context.missileThresholds, context.ammoSetId, context.missileLevel);
		context.syncHeroFromStats();
		context.say(t('port.log.missileupgraded', { level: context.missileLevel }), 'positive');
	} else if (context.weaponLevel <= context.armorLevel) {
		//Weapon.upgrade(): fixed class tier, plain +1 level. The missing item picker is
		//the only reason this port chooses the lower-level equipped item automatically.
		context.bag.remove('scrollUpgrade', 1);
		rollUpgradeAffixLoss(context, 'weapon');
		context.weaponLevel++;
		const sharedArmor = sharedUpgradeArmor(context.subclass(), context.talentRank('shared_upgrades'), context.armorLevel);
		const twinArmor = twinUpgradeArmor(context.subclass(), context.talentRank('twin_upgrades'), context.armorLevel);
		context.armorLevel += Math.max(sharedArmor, twinArmor);
		if (context.heroClass === 'mage' && context.talentRank('energizing_upgrade') > 0) context.wandCharges.refund(context.talentRank('energizing_upgrade') === 1 ? 4 : 6);
		if (context.heroClass === 'rogue' && context.talentRank('mystical_upgrade') > 0) context.hero.buffs['cloak'] = 9999;
		context.syncHeroFromStats();
		context.say(
			t('port.log.weaponupgraded', { level: context.weaponLevel, min: context.hero.damage[0], max: context.hero.damage[1] }),
			'positive'
		);
	} else {
		//Armor.upgrade(): fixed class tier, plain +1 level. This is the lower-level
		//fallback because the port lacks Java's item-picker modal.
		context.bag.remove('scrollUpgrade', 1);
		rollUpgradeAffixLoss(context, 'armor');
		context.armorLevel++;
		context.syncHeroFromStats();
		context.say(t('port.log.armorupgraded', { level: context.armorLevel }), 'positive');
	}
	return true;
}

/** Shared `Weapon.upgrade()`/`Armor.upgrade()` affix-loss roll, keyed on the CURRENT
 * upgrade level (before the +1 level is applied). `getCurse` distinguishes curse from
 * good affixes exactly the way `hasCurseEnchant()`/`hasCurseGlyph()` do. */
export function rollUpgradeAffixLoss(context: UpgradeGearContext, slot: 'weapon' | 'armor'): void {
	const affix = slot === 'weapon' ? context.weaponAffix : context.armorGlyph;
	const level = slot === 'weapon' ? context.weaponLevel : context.armorLevel;
	const wasCursed = slot === 'weapon' ? context.weaponCursed : context.armorCursed;
	const wasCursedKnown = slot === 'weapon' ? context.weaponCursedKnown : context.armorCursedKnown;
	const hadCurseAffix = Boolean(getCurse(affix ?? ''));
	//`Weapon.upgrade()`/`Armor.upgrade()`'s hardening branch, which comes *before* the affix
	//rolls and replaces them: while the item is hardened the enchant cannot be lost at all -
	//what can be lost is the hardening itself, with the same escalating odds but starting one
	//step later (`level() >= 6 && Random.Float(10) < 2^(level-6)`, against the ordinary
	//roll's `level() >= 4 && ... 2^(level-4)`). The affix-loss branch is guarded on the affix
	//being present in Java too (`else if (glyph != null)`); the separate item curse still clears.
	if (affix && (slot === 'weapon' ? context.weaponHardened : context.armorHardened)) {
		if (level >= 6 && context.randomFloat(10) < Math.pow(2, level - 6)) {
			if (slot === 'weapon') {
				context.weaponHardened = false;
				context.say(t('port.log.hardeninggone.weapon'), 'warning');
			} else {
				context.armorHardened = false;
				context.say(t('port.log.hardeninggone.armor'), 'warning');
			}
		}
	} else if (affix && getCurse(affix)) {
		if (context.randomInt(0, 3) === 0) {
			if (slot === 'weapon') context.weaponAffix = null;
			else context.armorGlyph = null;
		}
	} else if (affix && level >= 4 && context.randomFloat(10) < Math.pow(2, level - 4)) {
		if (slot === 'weapon') {
			context.weaponAffix = null;
			context.say(t('items.weapon.weapon.incompatible'), 'warning');
		} else {
			context.armorGlyph = null;
			context.say(t('items.armor.armor.incompatible'), 'warning');
		}
	}
	//`Weapon.upgrade()`/`Armor.upgrade()` (`Weapon.java`/`Armor.java`, tag `v3.3.8`)
	//always clear the item's `cursed` flag after resolving affix loss. The port previously
	//tracked enchant/glyph curses but dropped this separate item state, leaving equipped
	//gear bound after its Java upgrade should have weakened the curse.
	if (slot === 'weapon') context.weaponCursed = false;
	else context.armorCursed = false;
	const currentAffix = slot === 'weapon' ? context.weaponAffix : context.armorGlyph;
	if (hadCurseAffix && !getCurse(currentAffix ?? '') && wasCursedKnown) {
		context.say(t('items.scrolls.scrollofupgrade.remove_curse'), 'positive');
	} else if (wasCursed && wasCursedKnown) {
		context.say(t('items.scrolls.scrollofupgrade.weaken_curse'), 'positive');
	}
}
