import { Actors, Roguelike } from 'mwg';
import { addBuff, type BuffId, type Creature, type Step } from '../combat';
import { t } from '../i18n/index';
import { mwlItemEffectValue } from '../mwlContent';
import { prismaticGuardMaxHp } from '../simulation/prismatic';
import { empoweringScrollsCharges } from '../talentEffects';
import { getCurse } from './itemCurses';
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
		}
		addBuff(hero, 'weakness');
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
	readonly heroClass: string;
	readonly talentRank: (id: string) => number;
	//Get/set pair (not set-only like TransmuteFlowContext): this builder spreads
	//scrollEffectsContext(), and a spread literal cannot satisfy a set-only member.
	get empoweredZaps(): number;
	set empoweredZaps(zaps: number);
	readonly itemDisplayName: (id: string, identified: boolean) => string;
	readonly procIdentifyTalents: () => void;
	readonly startTransmutationPick: (instanceId: string | undefined) => boolean;
	get weaponAffix(): string | null;
	set weaponAffix(affix: string | null);
	get armorGlyph(): string | null;
	set armorGlyph(glyph: string | null);
	/** Live equipped-ring object; the cleanse fallback clears its curse in place. */
	readonly equippedRing: EquippedRing | null;
	readonly syncHeroFromStats: () => void;
}

export function readScrollFlow(context: ReadScrollContext): boolean {
	const { bag } = context;
	const selectedScroll = selectScrollId({
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
	bag.remove(id, 1, context.requestedItemInstanceId);
	if (armEmpowered) context.empoweredZaps = empoweringScrollsCharges(context.talentRank('empowering_scrolls'));
	if (id === 'scrollIdentify') {
		if (unidentified) {
			Actors.identify(unidentified);
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
			if (heal > 0 || charge > 0) context.procIdentifyTalents();
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
