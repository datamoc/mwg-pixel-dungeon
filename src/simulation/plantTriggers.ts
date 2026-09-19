import type { LogLevel } from '../ui/gameLog';
import type { BuffId, Creature } from '../combat';
import { grantSungrassHealth } from './plantPools';

/**
 * `Plant.trigger()`/`Plant.activate(Char)` for generated regional plants, hero half (tag
 * `v3.3.8`). The scene keeps the trigger prelude - kind resolution, the Lotus seed
 * preservation, consuming the plant marker, and the feature-layer redraw - and this module
 * owns the per-kind effect switch. Mob/allied triggers stay on the scene's own
 * `triggerMobPlantAt` until the second extraction moves them behind the same shape.
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
			//`Sorrowmoss.activate(ch)`: `affect(...).set(5 + round(2*scalingDepth/3))` - an
			//unconditional set through the one shared applier, so immunities still refuse
			//it (the old add-then-overwrite forced the buff past the immunity gate).
			ctx.grantBuff(hero, 'poison', 5 + Math.round(2 * ctx.depth / 3));
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
