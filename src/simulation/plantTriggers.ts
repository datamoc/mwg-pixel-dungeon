import type { LogLevel } from '../ui/gameLog';
import type { BuffId, Creature, Step } from '../combat';
import type { AnyMonsterId } from '../monsters';
import { grantEarthrootArmor, grantSungrassHealth } from './plantPools';
import { TIME_BUBBLE_TURNS } from './timeBubble';

/**
 * `Plant.trigger()`/`Plant.activate(Char)` for generated regional plants, hero half (tag
 * `v3.3.8`). The scene keeps the trigger prelude - kind resolution, the Lotus seed
 * preservation, consuming the plant marker, and the feature-layer redraw - and this module
 * owns the per-kind effect switch. Mob/allied triggers run through `runMobPlantEffect`
 * behind `MobPlantContext` the same way (second extraction); the scene keeps both
 * preludes - kind resolution and marker removal - and performs the shared redraw.
 *
 * The simulation directory admits sibling-only runtime imports (see the confinement check
 * in `tools/verifyCombat.mjs`), so the translate function and the framework neighbour
 * offsets arrive on the context like every other scene-owned service; only the
 * dependency-free `plantPools` math is imported directly. The field is deliberately
 * named `t`, so the `t('...')` key audits keep seeing these call sites as the genuine
 * translate references they are (the scene binds the real `t`).
 */
export interface HeroPlantContext {
	subclass: () => string | null;
	depth: number;
	say: (line: string, level?: LogLevel) => void;
	t: (key: string) => string;
	neighbour8: ReadonlyArray<ReadonlyArray<number>>;
	grantBuff: (target: Creature, id: BuffId, duration?: number) => void;
	prolongBuff: (target: Creature, id: BuffId, duration?: number) => void;
	cureHero: () => void;
	spawnFood: (x: number, y: number) => void;
	dropLoot: (x: number, y: number, min: number, max: number, kind: 'dew' | 'seed') => void;
	seedFreeze: (x: number, y: number, volume: number) => void;
	seedGas: (x: number, y: number, volume: number) => void;
	seedFire: (x: number, y: number, volume: number) => void;
	markHazardArea: (x: number, y: number) => void;
	passable: (x: number, y: number) => boolean;
	isVisible: (x: number, y: number) => boolean;
	shake: (intensity: number, duration: number) => void;
	setEarthrootArmor: (level: number, pos: number) => void;
	setTimeBubble: (turns: number) => void;
	syncHero: () => void;
	healingLeft: () => number;
	setHealingLeft: (value: number) => void;
	healingFlat: () => number;
	setHealingFlat: (value: number) => void;
	sungrass: () => { level: number; partial: number } | undefined;
	setSungrass: (level: number, partial: number, pos: number) => void;
	findTeleportCell: () => { x: number; y: number } | null | undefined;
	cancelTravel: () => void;
	moveHero: (to: { x: number; y: number }) => void;
	showTeleport: (from: { x: number; y: number }, to: { x: number; y: number }) => void;
}

export function runHeroPlantEffect(
	kind: string,
	x: number,
	y: number,
	cell: number,
	hero: Creature,
	ctx: HeroPlantContext,
): void {
	switch (kind) {
		case 'sungrass':
			if (ctx.subclass() === 'warden') {
				//`Sungrass.activate(ch)`: a Warden gets `Healing.setHeal(HT, 0, 1)` instead
				//of the Health pool - a flat 1 HP per turn until HT is owed out, combined
				//property-wise with any in-progress potion heal exactly like `setHeal`.
				if (hero.maxHp > ctx.healingLeft()) ctx.setHealingLeft(hero.maxHp);
				ctx.setHealingFlat(Math.max(ctx.healingFlat(), 1));
			} else {
				//`Buff.affect(ch, Health.class).boost(ch.HT)`: an *additive* full-HT pool,
				//not the missing-HP snapshot this used to grant - stepping on sungrass at
				//full HP banks the whole pool for later damage, and re-triggering while a
				//pool is active adds rather than overwrites. Same math as the mob half.
				const granted = grantSungrassHealth(ctx.sungrass(), hero.maxHp);
				ctx.setSungrass(granted.level, granted.partial, cell);
			}
			ctx.say(ctx.t('port.log.sungrassheal'), 'positive');
			break;
		case 'blandfruit':
		case 'blandfruitbush':
			ctx.spawnFood(x, y);
			ctx.say(ctx.t('port.log.plantfruit'), 'positive');
			break;
		case 'starflower':
			//`Starflower.activate(ch)`: `prolong` (keep-max) `Bless.DURATION` for anyone,
			//plus `Recharging.DURATION` for a Warden - both whole-table values.
			ctx.prolongBuff(hero, 'bless');
			if (ctx.subclass() === 'warden') ctx.prolongBuff(hero, 'recharging');
			ctx.say(ctx.t('port.log.starflowerconfidence'), 'positive');
			break;
		case 'dewcatcher':
			ctx.dropLoot(x, y, 3, 6, 'dew');
			ctx.say(ctx.t('port.log.dewcatcherdew'), 'positive');
			break;
		case 'seedpod':
			ctx.dropLoot(x, y, 2, 4, 'seed');
			ctx.say(ctx.t('port.log.seedpodburst'), 'positive');
			break;
		case 'earthroot':
			//`Earthroot.activate(ch)`: the plain effect is `Buff.affect(ch, Armor.class)
			//.level(ch.HT)` - a block pool of the character's own maximum HP that blocks
			//`(scalingDepth + 5)/2` per hit and ends when the character leaves the cell. This
			//port used to grant a full-strength Barrier shield instead, which ignored both the
			//per-hit cap and the movement rule. The Warden's `Barkskin` variant stays
			//unmodelled, as it was before.
			ctx.setEarthrootArmor(hero.maxHp, cell);
			//`Earthroot.activate()` (tag `v3.3.8`): the burst shakes (`1, 0.4f`) when
			//the plant cell is in the hero's FOV - trivially true for the hero's own
			//trigger, load-bearing for the mob half below.
			if (ctx.isVisible(x, y)) ctx.shake(1, 0.4);
			break;
		case 'blindweed':
			//`Blindweed.activate(ch)`: a Warden gets `Invisibility.DURATION/2` (10, not the
			//table's whole 20); everyone else gets `Blindness` + `Cripple`, both prolonged
			//the whole `DURATION` (10 each - the table's cripple is exact now). Blindness
			//itself arrives as the port's `daze` stand-in: the `blindness` id exists but is
			//inert for the hero (no hero-FOV-emptying seam), so a faithful-but-silent buff
			//would be worse than a felt one - see the matrix for the standing seam.
			if (ctx.subclass() === 'warden') ctx.grantBuff(hero, 'invisibility', 10);
			else { ctx.grantBuff(hero, 'daze'); ctx.prolongBuff(hero, 'cripple'); }
			ctx.say(ctx.subclass() === 'warden' ? 'The blindweed shrouds you from sight.' : 'The blindweed clouds your senses.', ctx.subclass() === 'warden' ? 'positive' : 'negative');
			break;
		case 'fadeleaf': {
			//`Fadeleaf.activate(ch)`: a Hero is teleported by `ScrollOfTeleportation.teleportChar`,
			//and that method detaches `Roots` (`Buff.detach(ch, Roots.class)`, right after it
			//places the char) - this plant is the canonical escape from entanglement, so without
			//the detach it silently did nothing for a rooted hero, whose `moveTo` refuses
			//outright. The same helper the teleportation scroll uses gives the replacement cell.
			//Mob teleports run through `triggerMobPlantAt`'s fadeleaf branch (with the
			//tracker); a *Warden* with inter-floor
			//teleporting allowed is sent one depth back instead of moving within the level - a
			//floor-return transition this port does not have.
			delete hero.buffs['roots'];
			const fadeDestination = ctx.findTeleportCell();
			if (fadeDestination) {
				//`Fadeleaf.activate(ch)`: `((Hero)ch).curAction = null` - a teleport cancels
				//whatever the hero was doing, including a queued click-to-travel destination.
				ctx.cancelTravel();
				const fadeFrom = { x: hero.x, y: hero.y };
				ctx.moveHero(fadeDestination);
				ctx.showTeleport(fadeFrom, fadeDestination);
			}
			ctx.say(ctx.t('port.log.fadeleafteleport'), 'positive');
			break;
		}
		case 'mageroyal':
			//`Mageroyal.activate(ch)`: the whole effect is `PotionOfHealing.cure(ch)` - the
			//same nine-buff detach the potion, the well and the ankh share, so it runs the
			//shared helper rather than its own list (which wrongly cleared Burning, which
			//Java never cures, and missed Bleeding/Blindness/Drowsy, which it does). The
			//Warden's `BlobImmunity.DURATION/2f` needs a hero-side blob-immunity seam that
			//does not exist yet - recorded in the matrix, not silently dropped.
			ctx.cureHero();
			ctx.say(ctx.t('port.log.mageroyalclear'), 'positive');
			break;
		case 'icecap':
			//`Icecap.activate(ch)`: NO direct status at all - Java seeds `Freezing` on every
			//non-solid NEIGHBOURS9 cell (the `passable` test is this port's standing
			//non-solid convention, same as ShockingTrap's) and marks every mob in the 3x3.
			//The chill-then-Frost itself arrives through the shared `plantFreeze` blob the
			//way every other Freezing source works here, so the direct paralysis this used
			//to grant is gone. A Warden additionally gets `FrostImbue.DURATION*0.3f` (15).
			for (const [dx, dy] of [[0, 0], ...ctx.neighbour8]) {
				const nx = x + dx, ny = y + dy;
				if (ctx.passable(nx, ny)) ctx.seedFreeze(nx, ny, 2);
			}
			ctx.markHazardArea(x, y);
			if (ctx.subclass() === 'warden') {
				ctx.grantBuff(hero, 'frostImbue');
				ctx.say(ctx.t('port.log.icecapfrost'), 'positive');
			} else {
				ctx.say(ctx.t('port.log.icecapfreeze'), 'negative');
			}
			break;
		case 'rotberry':
			if (ctx.subclass() === 'warden') {
				ctx.grantBuff(hero, 'adrenalineSurge');
				ctx.syncHero();
				ctx.say(ctx.t('port.log.rotberryadrenaline'), 'positive');
			} else {
				//`Rotberry.activate(ch)`: the non-Warden half is the ToxicGas seed alone -
				//Java applies no direct poison (the gas poisons whoever stands in it, hero
				//included, through the shared blob path). The extra direct poison this used
				//to grant double-dipped on top of the gas.
				ctx.seedGas(x, y, 100);
				ctx.say(ctx.t('port.log.rotberrygas'), 'negative');
			}
			break;
		case 'sorrowmoss':
			//`Sorrowmoss.activate(ch)` grants Warden `ToxicImbue.DURATION*0.3f`
			//before its ordinary poison application (`Sorrowmoss.java`, tag `v3.3.8`).
			//The shared buff gate then refuses that poison, while other classes
			//receive the real depth-scaled set duration.
			if (ctx.subclass() === 'warden') {
				delete hero.buffs.poison;
				ctx.grantBuff(hero, 'toxicImbue');
			} else {
				ctx.grantBuff(hero, 'poison', 5 + Math.round(2 * ctx.depth / 3));
			}
			ctx.say(ctx.t('port.log.sorrowmosspoison'), 'negative');
			break;
		case 'firebloom':
			// Firebloom seeds Java's Fire blob at its cell. A Warden additionally gets
			// `FireImbue.DURATION*0.3f` (15) - the frost-imbue pair: `proc()` reignites
			// Burning on a 1-in-2, the holder is immune to Burning, and attaching
			// detaches it. Only mobs are marked (Java marks `instanceof Mob`).
			if (ctx.subclass() === 'warden') {
				delete hero.buffs['burning'];
				ctx.grantBuff(hero, 'fireImbue');
			}
			ctx.seedFire(x, y, 2);
			ctx.say(ctx.t('port.log.firebloomignite'), 'negative');
			break;
		case 'stormvine':
			//`Stormvine.activate(ch)`: a Warden gets `Levitation.DURATION/2` (10, not the
			//table's whole 20); everyone else gets `Vertigo.DURATION` (10) of Vertigo,
			//which arrives as the port's `daze` stand-in at its exact table 5 the way the
			//confusion-gas row already documents.
			if (ctx.subclass() === 'warden') ctx.grantBuff(hero, 'levitation', 10);
			else ctx.grantBuff(hero, 'daze');
			ctx.say(ctx.t('port.log.stormvinetwist'), 'negative');
			break;
		case 'swiftthistle':
			// Swiftthistle.TimeBubble freezes other actors for seven hero-time units.
			// Count those units at the automatic-actor boundary instead of granting a
			// free hero action, which would incorrectly skip hunger and buffs. A Warden
			// additionally gets `Haste` for 1 turn (`Buff.affect(ch, Haste.class, 1f)`).
			ctx.setTimeBubble(7);
			if (ctx.subclass() === 'warden') ctx.grantBuff(hero, 'haste', 1);
			ctx.say(ctx.t('port.log.swiftthistletime'), 'positive');
			break;
		default:
			ctx.say(ctx.t('port.log.plantwithers'));
	}
}

/**
 * The non-hero half of each `Plant.activate(Char)` (tag `v3.3.8`): mobs and allied
 * chars soft-trigger a revealed plant when they occupy its cell. Java's special Warden
 * variants are hero-only; ordinary monsters receive the base effect. Sprite placement
 * and the immovable-kind gate stay scene-owned services on the context.
 */
export interface MobPlantContext {
	depth: number;
	neighbour8: ReadonlyArray<ReadonlyArray<number>>;
	grantBuff: (target: Creature, id: BuffId, duration?: number) => void;
	prolongBuff: (target: Creature, id: BuffId, duration?: number) => void;
	markHazardMob: (creature: Creature) => void;
	markHazardArea: (x: number, y: number) => void;
	patrolDestination: (creature: Creature) => Step | undefined;
	findTeleportCell: (creature: Creature) => Step | null | undefined;
	placeSprite: (creature: Creature, x: number, y: number) => void;
	showTeleport: (from: { x: number; y: number }, to: { x: number; y: number }, creature: Creature) => void;
	seedFreeze: (x: number, y: number, volume: number) => void;
	seedGas: (x: number, y: number, volume: number) => void;
	seedFire: (x: number, y: number, volume: number) => void;
	passable: (x: number, y: number) => boolean;
	isVisibleCell: (cell: number) => boolean;
	shake: (intensity: number, duration: number) => void;
	isImmovableKind: (kind: AnyMonsterId) => boolean;
}

export function runMobPlantEffect(
	kind: string,
	cell: number,
	creature: Creature,
	ctx: MobPlantContext,
): void {
	if (kind === 'fadeleaf') {
		//`Fadeleaf.activate()`: Java teleports every non-`IMMOVABLE` mob. The statue is
		//not immovable in Java (`Statue.java` carries only `INORGANIC`), so the old statue
		//exclusion teleported too little; the shared set covers DM201 and the rest.
		if (creature.kind !== undefined && ctx.isImmovableKind(creature.kind)) return;
		//`Fadeleaf.activate()` marks a teleported mob first (`Buff.prolong(ch,
		//`HazardAssistTracker...)` runs before `teleportChar` in Java).
		ctx.markHazardMob(creature);
		const destination = ctx.findTeleportCell(creature);
		if (!destination) return;
		//`ScrollOfTeleportation.teleportChar()` moves the mob immediately, with the shared
		//`ScrollOfTeleportation.appear` presentation as well, leaving only the logical
		//position update direct (no `moveTo`, so no cell-press side effects).
		const mobFadeFrom = { x: creature.x, y: creature.y };
		creature.x = destination.x;
		creature.y = destination.y;
		ctx.placeSprite(creature, destination.x, destination.y);
		ctx.showTeleport(mobFadeFrom, destination, creature);
		return;
	}
	//The remaining branches are the non-hero half of each Plant.activate(Char). Java's
	//special Warden variants are hero-only; ordinary monsters receive the base effect.
	switch (kind) {
		case 'blindweed':
			ctx.grantBuff(creature, 'daze');
			//`Blindweed.activate(ch)`: `prolong` (keep-max) `Blindness.DURATION` and
			//`Cripple.DURATION` - both whole 10s. Blindness itself arrives as the `daze`
			//stand-in (see the hero branch); the cripple keeps Java's prolong shape.
			ctx.prolongBuff(creature, 'cripple');
			creature.seesHero = false;
			creature.patrolTarget = ctx.patrolDestination(creature);
			ctx.markHazardMob(creature);
			break;
		case 'firebloom':
			ctx.seedFire(creature.x, creature.y, 2);
			ctx.markHazardMob(creature);
			break;
		case 'rotberry':
			ctx.seedGas(creature.x, creature.y, 100);
			break;
		case 'starflower':
			//`Starflower.activate(ch)`: `prolong` (keep-max) `Bless.DURATION` for any char.
			ctx.prolongBuff(creature, 'bless');
			break;
		case 'sorrowmoss':
			//`Sorrowmoss.activate(ch)`: `affect(...).set(...)` - an unconditional SET of
			//`5 + round(2*scalingDepth/3)`, NOT a prolong: re-stepping while poisoned
			//shortens a longer clock where the old prolong kept it. (`scalingDepth` is
			//`depth` here - no AscensionChallenge exists to raise it to 26.)
			ctx.grantBuff(creature, 'poison', 5 + Math.round(2 * ctx.depth / 3));
			ctx.markHazardMob(creature);
			break;
		case 'stormvine':
			ctx.grantBuff(creature, 'daze');
			ctx.markHazardMob(creature);
			break;
		case 'icecap':
			//Same char-agnostic `Icecap.activate(ch)` as the hero half above: Freezing on
			//every passable NEIGHBOURS9 cell plus the 3x3 mob marking - no direct status.
			for (const [dx, dy] of [[0, 0], ...ctx.neighbour8]) {
				const nx = creature.x + dx, ny = creature.y + dy;
				if (ctx.passable(nx, ny)) ctx.seedFreeze(nx, ny, 2);
			}
			ctx.markHazardArea(creature.x, creature.y);
			break;
		case 'mageroyal':
			//Same `PotionOfHealing.cure(ch)` as the hero half above: detach Poison/
			//Cripple/Weakness/Vulnerable/Bleeding/Blindness/Drowsy, never Burning -
			//the old list wrongly cleared Burning and missed the other three.
			for (const buff of ['poison', 'bleeding', 'weakness', 'vulnerable', 'cripple', 'drowsy', 'blindness'] as BuffId[]) delete creature.buffs[buff];
			break;
		case 'sungrass': {
			//`Sungrass.activate(ch)` for a non-Warden char: `Buff.affect(ch, Health.class)
			//.boost(ch.HT)` (`plants/Sungrass.java`, tag `v3.3.8`) - an additive gradual-heal
			//pool, not the instant full recovery this used to grant. The per-turn payout lives
			//in `takeMonsterTurn`'s sungrass tick; the plant itself is still consumed here.
			const granted = grantSungrassHealth(
				creature.sungrassLevel !== undefined
					? { level: creature.sungrassLevel, partial: creature.sungrassPartial ?? 0 }
					: undefined,
				creature.maxHp);
			creature.sungrassLevel = granted.level;
			creature.sungrassPartial = granted.partial;
			creature.sungrassPos = cell;
			break;
		}
		case 'earthroot':
			//`Earthroot.activate(ch)` for a non-Warden char: `Buff.affect(ch, Armor.class)
			//.level(ch.HT)` (`plants/Earthroot.java`, tag `v3.3.8`) - the same keep-max block
			//pool the hero uses, absorbing per landed attack hit in `attack()`.
			creature.earthrootArmorLevel = grantEarthrootArmor(creature.earthrootArmorLevel, creature.maxHp);
			creature.earthrootArmorPos = cell;
			if (ctx.isVisibleCell(cell)) ctx.shake(1, 0.4);
			break;
		case 'swiftthistle':
			//Per-char ownership (`Buff.affect(ch, TimeBubble.class)`): the mob banks its own
			//seven rapid turns through the cost hook above - the global freeze is the hero's
			//bubble only. The mob's detach fires nothing: delayed presses only ever land
			//in the hero's bubble (`Level.pressCell` reads the hero's buff).
			//`TimeBubble.reset()` overwrites unconditionally - re-triggering restarts it.
			creature.timeBubbleTurns = TIME_BUBBLE_TURNS;
			break;
	}
}
