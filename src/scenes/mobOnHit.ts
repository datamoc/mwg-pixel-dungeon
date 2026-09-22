import { Random, Roguelike, type Actors, type Blob } from 'mwg';
import { addBuff, reigniteBuff, setBleeding, type Creature } from '../combat';
import { WATER } from '../dungeonConstants';
import { capitalize, t } from '../i18n/index';
import { BASE_KIND_ALIASES, type AnyMonsterId, type MonsterId } from '../monsters';
import { STARVING } from '../simulation/hunger';
import type { Step } from '../simulation/combatState';
import { lethalDefenseShield } from '../talentEffects';

/**
 * What the monster-side on-hit hooks need from the scene. `mobOnHit` was a 287-line scene method; it moves
 * here unchanged (every provenance comment included) with `this` replaced by this context. The scene builds
 * it per call from live state, so the mutable fields go through getters/setters rather than copies.
 */
export interface MobOnHitContext {
	armorGlyph: string | null;
	readonly armorGlyphActive: boolean;
	readonly armorLevel: number;
	hunger: number;
	earthrootArmor: { level: number; pos: number } | null;
	readonly hero: Creature;
	readonly level: Roguelike.Level;
	readonly charmTargets: Map<string, string>;
	readonly manualPlants: Map<number, string>;
	readonly stenchGas: Blob;
	readonly toxicGas: Blob;
	readonly wandCharges: Actors.Charges;
	creatureAt(x: number, y: number): Creature | null | undefined;
	degradedLevel(trueLevel: number): number;
	genericProcMultiplier(): number;
	grantHeroShield(amount: number, cap?: number): number;
	isChasmCell(x: number, y: number): boolean;
	placePortedFeature(cell: number, kind: string): void;
	say(message: string, level?: 'positive' | 'negative' | 'warning'): void;
	shakeScreen(magnitude: number, duration: number): void;
	showHeal(target: Creature, amount: number): void;
	spawnMonster(kind: AnyMonsterId, at: Step): Creature;
	subclass(): string | null;
	talentRank(id: string): number;
	thiefSteal(thief: Creature): void;
	triggerPortedPlantAt(x: number, y: number): void;
}

/** monster-side on-hit hooks (all pre-existing, now grouped) */
export function mobOnHit(ctx: MobOnHitContext, attacker: Creature, defender: Creature, damage: number): void {
	const armorGlyph = (id: string): boolean => ctx.armorGlyphActive && ctx.armorGlyph === id;
	if (defender.isHero) ctx.grantHeroShield(lethalDefenseShield(ctx.subclass(), ctx.talentRank('lethal_defense')), ctx.hero.maxHp);
	//`RottingFist.attackProc` is the only fist subclass with a melee-contact effect:
	//half of all landed melee hits ooze the victim (`Ooze.DURATION` is the table's own
	//20). The burning/soiled/rusted/bright/dark contact riders this hook used to carry
	//were invented - Java's other five subclasses have no `attackProc` at all (their
	//zap riders fire at range, never on contact), so they are gone, not rebuilt.
	if (attacker.kind === 'yogFist' && attacker.yogFistType === 'rotting' && Random.int(2) === 0) {
		addBuff(defender, 'ooze');
	}
	//Elemental meleeProc() (Elemental.java, tag `v3.3.8`): preserve each concrete subtype's
	//contact effect. Shock delegates its recursive 40%-damage arc to the scene so the
	//normal hero-absorption and kill seams still own HP mutation.
	if (attacker.kind === 'elemental') {
		switch (attacker.elementalType ?? 'fire') {
			case 'fire': if (Random.chance(0.5) && ctx.level.get(defender.x, defender.y) !== WATER) addBuff(defender, 'burning'); break;
			case 'frost': if (Random.chance(1 / 3) || ctx.level.get(defender.x, defender.y) === WATER) addBuff(defender, 'frost'); break;
			case 'shock': break;
			case 'chaos': addBuff(defender, Random.element(['burning', 'chill', 'cripple', 'daze'] as const) ?? 'daze'); break;
		}
	}
	//Affection.proc() (items/armor/glyphs/Affection.java, tag 4.0.0-beta):
	//an adjacent hit can charm the attacker toward the armor wearer with
	//(level+3)/(level+20) x Arcana chance, for round(10 x max(1, chance)).
	//The existing charm target map supplies Java's object payload; direct map
	//assignment preserves the level-scaled duration that addBuff alone cannot set.
	if (defender.isHero && armorGlyph('affection') && attacker.hp > 0
		&& Random.chance(((Math.max(0, ctx.degradedLevel(ctx.armorLevel)) + 3) / (Math.max(0, ctx.degradedLevel(ctx.armorLevel)) + 20)) * ctx.genericProcMultiplier())) {
		const level = Math.max(0, ctx.degradedLevel(ctx.armorLevel));
		const chance = ((level + 3) / (level + 20)) * ctx.genericProcMultiplier();
		addBuff(attacker, 'charm');
		attacker.buffs.charm = Math.max(attacker.buffs.charm ?? 0, Math.round(10 * Math.max(1, chance)));
		ctx.charmTargets.set(attacker.id, defender.id);
	}
	//`Metabolism.proc()` (`items/armor/curses/Metabolism.java`, tag `v3.3.8`):
	//1-in-6 x arcana, healing `min(STARVING/100, missing HP)` - and the price is
	//hunger ADDED, not removed: Java calls `hunger.affectHunger(healing * -10)` and
	//`affectHunger` subtracts its argument, so the hero gets hungrier by 10x the
	//healing, capped at STARVING and never while starving. What stood here
	//subtracted (satiated), making the curse heal and feed - a pure benefit.
	if (defender.isHero && armorGlyph('metabolism') && ctx.hunger < STARVING && ctx.hero.hp < ctx.hero.maxHp && Random.chance((1 / 6) * ctx.genericProcMultiplier())) {
		const healing = Math.min(Math.floor(STARVING / 100), ctx.hero.maxHp - ctx.hero.hp);
		if (healing > 0) {
			ctx.hunger = Math.min(STARVING, ctx.hunger + healing * 10);
			ctx.hero.hp += healing;
			ctx.showHeal(ctx.hero, healing);
		}
	}
	//`AntiEntropy.proc()` (`items/armor/curses/AntiEntropy.java`, tag `v3.3.8`):
	//a 1-in-8 x arcana proc freezes the eight neighboring cells and reignites
	//the wearer for 4 - but NOT while standing in water. Daze is the port's
	//timed freeze equivalent (stated). What stood here burned for the full
	//table-8 duration with no water gate at all.
	if (defender.isHero && armorGlyph('antientropy') && Random.chance((1 / 8) * ctx.genericProcMultiplier())) {
		if (ctx.level.get(ctx.hero.x, ctx.hero.y) !== WATER) reigniteBuff(ctx.hero, 'burning', 4);
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const nearby = ctx.creatureAt(ctx.hero.x + dx, ctx.hero.y + dy);
			if (nearby && nearby !== ctx.hero) addBuff(nearby, 'daze');
		}
	}
	//`Corrosion.proc()` (`items/armor/curses/Corrosion.java`, tag `v3.3.8`): a
	//1-in-10 x arcana proc oozes NEIGHBOURS9 - the wearer's own cell included -
	//at `Ooze.DURATION/2` (10). What stood here skipped the wearer and applied
	//the table's whole-20 duration.
	if (defender.isHero && armorGlyph('corrosion') && Random.chance((1 / 10) * ctx.genericProcMultiplier())) {
		addBuff(ctx.hero, 'ooze', 10);
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const nearby = ctx.creatureAt(ctx.hero.x + dx, ctx.hero.y + dy);
			if (nearby && nearby !== ctx.hero) addBuff(nearby, 'ooze', 10);
		}
	}
	//Multiplicity.proc(): a 1-in-20 proc duplicates the attacker into an available
	//neighboring cell. Java refuses to copy several classes - `!(toDuplicate instanceof Mob)`,
	//a `BOSS` or `MINIBOSS` carrier, a `Mimic`, a `Statue` or an `NPC` (`Multiplicity.java`
	//82-84) - and rather than skipping the proc it substitutes `Dungeon.level.createMob()`,
	//a random floor mob. This port tests those exclusions the way the rest of the file does
	//now: the two properties through the real flags, and Mimic/Statue through the base-kind
	//chain (`crystalMimic`/`armoredStatue` inherit their base's exclusion exactly as Java's
	//`instanceof` gives them). The previous hand-written kind list named only the six bosses,
	//so every miniboss could be duplicated; it also never covered Mimic or Statue. Still not
	//modelled: the random-mob substitution itself (an excluded attacker simply goes
	//un-duplicated here), and mirror-image duplication, which has no separate actor type -
	//which is why Java's hero half is skipped.
	if (defender.isHero && armorGlyph('multiplicity') && !attacker.isHero && !attacker.isNPC
		&& !attacker.boss && !attacker.miniboss && Random.chance((1 / 20) * ctx.genericProcMultiplier())) {
		const adjacent = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: ctx.hero.x + dx, y: ctx.hero.y + dy }))
			.filter((at) => ctx.level.passable(at.x, at.y) && !ctx.isChasmCell(at.x, at.y) && !ctx.creatureAt(at.x, at.y));
		const destination = Random.element(adjacent);
		const attackerKind = attacker.kind;
		const copyBase = attackerKind === undefined ? undefined : BASE_KIND_ALIASES[attackerKind as AnyMonsterId] ?? (attackerKind as MonsterId);
		if (destination && attackerKind && copyBase !== 'mimic' && copyBase !== 'statue') {
			ctx.spawnMonster(attackerKind, destination);
		}
	}
	//Overgrowth.proc(): a 1-in-20 x arcana proc couches and immediately activates a
	//random supported seed at the defender's cell. The generator's full seed
	//weight table is not available, so selection is uniform across supported seeds.
	if (defender.isHero && armorGlyph('overgrowth') && Random.chance((1 / 20) * ctx.genericProcMultiplier())) {
		const seed = Random.element(['blindweed', 'earthroot', 'fadeleaf', 'firebloom', 'icecap', 'mageroyal',
			'rotberry', 'sorrowmoss', 'starflower', 'stormvine', 'sungrass', 'swiftthistle'] as const);
		if (seed) {
			const cell = ctx.level.index(ctx.hero.x, ctx.hero.y);
			ctx.manualPlants.set(cell, seed);
			ctx.placePortedFeature(cell, `plant:${seed}`);
			ctx.triggerPortedPlantAt(ctx.hero.x, ctx.hero.y);
		}
	}
	//Stench.proc() (Armor.java, tag v3.3.8): 1/8 x arcana chance when hit seeds a
	//250-volume ToxicGas blob at the wearer's own feet. Java's Stench.java imports
	//ToxicGas; only FetidRat's defenseProc seeds the distinct StenchGas blob.
	if (defender.isHero && armorGlyph('stench') && Random.chance((1 / 8) * ctx.genericProcMultiplier())) {
		ctx.toxicGas.seed(ctx.hero.x, ctx.hero.y, 250);
		ctx.say(t('port.log.stenchcurse'), 'negative');
	}
	if (attacker.kind === 'bat' && damage > 4) {
		const reg = Math.min(damage - 4, attacker.maxHp - attacker.hp);
		if (reg > 0) {
			attacker.hp += reg;
			ctx.say(t('port.log.batfeeds', { who: capitalize(attacker.name), amount: reg }), 'negative');
		}
	}
	if ((attacker.kind === 'thief' || attacker.kind === 'bandit') && !attacker.stolen && defender.isHero) {
		ctx.thiefSteal(attacker);
 			if (attacker.kind === 'bandit' && attacker.stolen) {
 				//`Bandit.java` on a successful steal: `prolong(hero, Blindness, DURATION/2)`
 				//(5), `affect(hero, Poison).set(IntRange(5, 6))` (a 5-or-6 overwrite, even
 				//shortening), and `prolong(hero, Cripple, DURATION/2)` (keep-max 5). Blindness
 				//itself arrives as the port's `daze` stand-in: the `blindness` id exists but
 				//is inert for the hero (no hero-FOV-emptying seam), so a faithful-but-silent
 				//buff would be worse than a felt one - see the blindweed branch.
 				addBuff(defender, 'poison', 5 + Random.int(2));
 				reigniteBuff(defender, 'cripple', 5);
 				addBuff(defender, 'daze');
 			}
	}
	//The three weapon curses this file used to resolve here (explosive/dazzling/annoying) now
	//live in `heroOnHit`, where the attacker is the weapon's own wielder - see the note there.
	//Albino.attackProc() (Albino.java, tag v3.3.8): half of landed hits dealing
	//damage>0 apply `Bleeding.set(Random.NormalFloat(2, 3))`. The port's bleeding
	//primitive (`setBleeding`, max-wins) is the direct equivalent - the `poison`
	//stand-in this site used to apply is removed. `Random.float(1)` is uniform on
	//[2, 3), a stated stand-in for Java's bell-curved `NormalFloat(2, 3)`.
	if (attacker.kind === 'albino' && damage > 0 && Random.chance(0.5)) {
		setBleeding(defender, 2 + Random.float(1));
	}
	if ((attacker.kind === 'causticSlime' || attacker.kind === 'acidic') && Random.chance(attacker.kind === 'acidic' ? 1 : 0.5)) {
		addBuff(defender, 'ooze');
		if (attacker.kind === 'acidic') addBuff(defender, 'cripple');
	}
	//RotLasher.attackProc() (RotLasher.java, tag v3.3.8): every landed hit cripples
	//for 2 turns (`Buff.affect(enemy, Cripple.class, 2f)` - unconditional, like the
	//caustic proc above, not damage-gated like Albino's).
	if (attacker.kind === 'rotLasher') {
		addBuff(defender, 'cripple', 2);
	}
	//RotHeart.defenseProc() (RotHeart.java, tag v3.3.8): a struck heart seeds ToxicGas
	//at its own cell with volume `5 + 3 * openNearby`, where openness counts non-solid
	//8-neighbours - fewer gas in enclosed spaces. Passable stands in for non-solid
	//here (same substitution the split gate uses for free cells). Only hits routed
	//through mobOnHit (melee, monster projectiles) seed gas - wand and bomb hits on
	//the heart bypass it, a recorded residual of Java's source-independent defenseProc.
	if (defender.kind === 'rotHeart') {
		let openNearby = 0;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			if (ctx.level.passable(defender.x + dx, defender.y + dy)) openNearby++;
		}
		ctx.toxicGas.seed(defender.x, defender.y, 5 + 3 * openNearby);
	}
	//FetidRat.defenseProc() (FetidRat.java, tag v3.3.8): a struck rat seeds StenchGas
	//volume 20 at its own cell, unconditionally - same hook and same wand/bomb residual
	//as the heart above.
	if (defender.kind === 'fetidRat') {
		ctx.stenchGas.seed(defender.x, defender.y, 20);
	}
	//`Acidic.defenseProc()` (`Acidic.java`, tag `v3.3.8`): a struck acidic oozes an
	//adjacent attacker (`Dungeon.level.adjacent`, i.e. Chebyshev 1). The attacker-side
	//ooze above covers the acidic's own hits; nothing covered hitting one back.
	if (defender.kind === 'acidic' && Roguelike.chebyshevDistance(defender, attacker) === 1) {
		addBuff(attacker, 'ooze');
		ctx.say(t(attacker.isHero ? 'port.log.oozedhero' : 'port.log.oozed', { who: capitalize(attacker.name) }), 'negative');
	}
	if (attacker.kind === 'fetidRat' && Random.chance(1 / 3)) {
		addBuff(defender, 'ooze');
		ctx.say(t(defender.isHero ? 'port.log.oozedhero' : 'port.log.oozed', { who: capitalize(defender.name) }), 'negative');
	}
	//`Goo.attackProc()` (`Goo.java`, tag `v3.3.8`): a third of landed hits
	//afflict Ooze for its full duration - the same `addBuff` the FetidRat
	//branch just above uses. The burst is presentation-only; the death-by-ooze
	//badge has no bucket here (see the death-badge note), so only the buff lands.
	if (attacker.kind === 'goo' && Random.int(3) === 0) {
		addBuff(defender, 'ooze');
		ctx.say(t(defender.isHero ? 'port.log.oozedhero' : 'port.log.oozed', { who: capitalize(defender.name) }), 'negative');
	}
	//Spinner.attackProc() (Spinner.java, v3.3.8): half of landed bites apply
	//Poison for Random.IntRange(7, 8) turns and switch the spider into its own FLEEING
	//state. This is separate from Hunting.shootWeb(), which is the ranged web/root
	//action above (and stays available while fleeing, as in Java).
	if (attacker.kind === 'spinner' && defender.isHero && Random.chance(0.5)) {
		addBuff(defender, 'poison');
		defender.buffs.poison = Random.range(7, 8);
		attacker.seesHero = true;
		attacker.fleeing = true;
	}
	//GnollTrickster.attackProc(): real formula is `Random.Int(4) + combo` (combo incrementing
	//every landed hit, reset to 0 whenever it moves instead - see `stepAway`), not a flat
	//combo>=3/>=6 cutoff - the randomness means an early hit can occasionally ignite or
	//poison too, while a long combo isn't a hard guarantee either. `effect>=6` ignites (skip
	//if already burning); otherwise `effect>2` poisons. Java's `Poison.set(effect-2)` sets a
	//real magnitude this port's poison buff has no field for (a pre-existing, documented
	//simplification elsewhere), so only the ignite-vs-poison-vs-nothing threshold is fixed here.
	if (attacker.kind === 'gnollTrickster') {
		attacker.combo = (attacker.combo ?? 0) + 1;
		const effect = Random.int(4) + attacker.combo;
		if (effect >= 6 && !defender.buffs['burning']) {
			addBuff(defender, 'burning');
			ctx.say(t('port.log.tricksterfire'), 'negative');
		} else if (effect > 2) {
			addBuff(defender, 'poison');
			ctx.say(t('port.log.trickstervenom'), 'negative');
		}
	}
	//Succubus.attackProc() (`Succubus.java`, tag `v3.3.8`): feeds ONLY on a victim
	//that arrives already charmed - a fresh 1/3 charm (with `ignoreNextHit`) never
	//feeds the same hit - and converts feed overflow past full HP into a `Barrier`
	//shield. The old branch checked daze after applying it, feeding on the very hit
	//that landed the charm. The shield half has no expression (no per-mob shield
	//pool exists - the same precedent the Bless row states), so the feed still caps
	//at missing HP, stated rather than upgraded silently. Any live `daze` reads as
	//charmed (the stand-in), even from non-succubus sources - inherent to it.
	if (attacker.kind === 'succubus' && defender.isHero) {
		const alreadyCharmed = defender.buffs['daze'] !== undefined;
		if (Random.chance(1 / 3)) {
			addBuff(defender, 'daze');
			ctx.say(t('port.log.charm'), 'negative');
		}
		if (alreadyCharmed) {
			const feed = Math.min(5 + damage, attacker.maxHp - attacker.hp);
			if (feed > 0) {
				attacker.hp += feed;
				ctx.say(t('port.log.succubusfeeds', { who: capitalize(attacker.name), amount: feed }), 'negative');
			}
		}
	}
 		//Scorpio: 50% cripple on a hit. Acidic's own attackProc() calls super.attackProc() after
 		//adding its Ooze proc, so it still applies this too - previously excluded here.
 		//`Buff.prolong(enemy, Cripple.class, Cripple.DURATION)`: keep-max whole 10.
 		if ((attacker.kind === 'scorpio' || attacker.kind === 'acidic') && Random.chance(0.5)) {
 			reigniteBuff(defender, 'cripple');
		ctx.say(t('port.log.cripple'), 'negative');
	}
	//`Thorns.proc()` (tag v3.3.8): an Arcana-scaled `(level+2)/(level+12)` chance - 16.7% at level
	//0, 23.1% at 1, 28.5% at 2 - against an attacker of the opposite alignment, applying
	//`Bleeding` at `round((4 + level) * max(1, chance))`. What stood here was 2 points of
	//*instant* damage with no roll at all, which fired on every single hit the hero took and
	//scaled with nothing; Java's glyph is a damage-over-time with a real chance.
	if (defender.isHero && armorGlyph('thorns') && !attacker.isHero && attacker.hp > 0) {
		const level = Math.max(0, ctx.degradedLevel(ctx.armorLevel));
		const procChance = ((level + 2) / (level + 12)) * ctx.genericProcMultiplier();
		if (Random.chance(procChance)) {
			setBleeding(attacker, Math.round((4 + level) * Math.max(1, procChance)));
			ctx.say(t('port.log.thorns'), 'positive');
		}
	}
	//`Entanglement.proc()`/`Earthroot.Armor` (tag v3.3.8): the 1/4 chance is Arcana-scaled, and
	//the **defender** - the hero wearing the armor - gains the same block pool the Earthroot
	//plant grants, at `round((5 + 2 * armorLevel) * max(1, chance))`. This port used to give the
	//*attacker* a `cripple` movement lock instead, which was wrong twice over: Java's glyph
	//protects its wearer rather than disabling the enemy, and it protects by blocking damage.
	if (defender.isHero && armorGlyph('entanglement') && !attacker.isHero) {
		const level = Math.max(0, ctx.degradedLevel(ctx.armorLevel));
		const procChance = 0.25 * ctx.genericProcMultiplier();
		if (Random.chance(procChance)) {
			const pool = Math.round((5 + 2 * level) * Math.max(1, procChance));
			ctx.earthrootArmor = {
				level: Math.max(ctx.earthrootArmor?.level ?? 0, pool),
				pos: ctx.level.index(ctx.hero.x, ctx.hero.y),
			};
			//`Entanglement.proc()` (tag `v3.3.8`): the burst shakes (`1, 0.4f`) when
			//it lands on the hero - this branch only runs for the hero defender.
			ctx.shakeScreen(1, 0.4);
			ctx.say(t('port.log.entanglement'), 'positive');
		}
	}
	//`Potential.proc()` (tag v3.3.8): proc chance is `(level+1)/(level+6) * Arcana`
	//and `belongings.charge(powerMulti)` adds fractional charge progress, with
	//`powerMulti = max(1, procChance)`. `Charges.advance()` already accepts fractional
	//progress and retains it through save/load, so it is the correct generic seam here.
	if (defender.isHero && armorGlyph('potential')) {
		const level = Math.max(0, ctx.degradedLevel(ctx.armorLevel));
		const procChance = ((level + 1) / (level + 6)) * ctx.genericProcMultiplier();
		if (Random.float() < procChance) {
			ctx.wandCharges.advance(Math.max(1, procChance));
			ctx.say(t('port.log.potential'), 'positive');
		}
	}
	if (attacker.champion === 'blazing') addBuff(defender, 'burning');
	if (!attacker.isHero && attacker.hp <= attacker.maxHp * 0.5 && !attacker.buffs['fury'] && attacker.kind !== 'necroSkeleton') {
		addBuff(attacker, 'fury');
		ctx.say(t('port.log.fury', { who: capitalize(attacker.name) }), 'warning');
	}
}
