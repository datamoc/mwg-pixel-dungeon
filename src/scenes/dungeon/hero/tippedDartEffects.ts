import type { DungeonScene } from '../../dungeonScene';
import { Random } from 'mwg';
import { BUFF_DURATION, NEGATIVE_BUFFS, addBuff, reigniteBuff, type BuffId, type Creature } from '../../../combat';
import { TILE, WATER } from '../../../dungeonConstants';
import { cureHeroBuffs } from '../../../items/potionEffects';
import { isUndeadOrDemonic } from '../../../monsters';

/** The thirteen tipped-dart on-hit effects (`items/weapon/missiles/darts/*.java`,
 * tag `v3.3.8`) - moved verbatim from `inventoryQuickslot.ts` as the file-size
 * refactor's extraction once the Cleansing/Adrenaline/numbers corrections grew past
 * that group's own budget, behavior-identical. Called from the throw resolver with
 * the struck creature and the pile's tipped seed. `simulation/missiles.ts` carries
 * the dart-damage/durability half; PORT_COVERAGE.md's tipped-dart row carries the
 * per-effect scoping rationale. */
export const tippedDartEffectsMethods = {

		applyTippedDartEffect(this: DungeonScene, target: Creature, seedClass: string | undefined): void {
			const seed = (seedClass ?? '').toLowerCase();
			switch (seed) {
				case 'blindweed':
					addBuff(target, 'daze', 3);
					target.seesHero = false;
					break;
				case 'firebloom':
					this.fire.seed(target.x, target.y, 2);
					break;
			case 'icecap':
				//`ChillingDart.proc()` (`ChillingDart.java`, tag `v3.3.8`): `Chill.DURATION`
				//in water, a flat 6 on dry land (both prolonged). The old branch dealt a
				//flat chill 4 everywhere.
				reigniteBuff(target, 'chill', this.level.get(target.x, target.y) === WATER ? BUFF_DURATION.chill : 6);
				break;
			case 'sorrowmoss':
				//`PoisonDart.proc()` (`PoisonDart.java`, tag `v3.3.8`): `Poison.set` with
				//a `3 + scalingDepth()/2` damage pool. This port's poison is a turn clock
				//dealing `floor(t/3)+1` per remaining turn, so take the clock whose
				//cumulative damage first reaches the pool (the same conversion
				//`applyMysteryMeatEffect` uses for its `HT/5` pool), prolonged like `set`.
				{
					const pool = 3 + Math.floor(this.depth / 2);
					let clock = 1, total = 1;
					while (total < pool) {
						clock++;
						total += Math.floor(clock / 3) + 1;
					}
					reigniteBuff(target, 'poison', clock);
				}
				break;
			case 'earthroot':
				//`ParalyticDart.proc()` (`ParalyticDart.java`, tag `v3.3.8`): prolonged
				//`Paralysis` 5, not 3.
				reigniteBuff(target, 'paralysis', 5);
				break;
				case 'fadeleaf': {
					const destination = this.randomFreeCell(target);
					if (destination) {
						target.x = destination.x;
						target.y = destination.y;
						this.sprite(target).position.set(destination.x * TILE, destination.y * TILE);
					}
					break;
				}
			case 'rotberry':
				//`RotDart.proc()` (`RotDart.java`, tag `v3.3.8`): `Corrosion.set(10,
				//scalingDepth)` normally, `set(5, scalingDepth/3)` against a boss or
				//miniboss - duration turns at the given per-turn damage, not a flat
				//3-turn, `4 + depth/2`-damage clock.
				if (target.boss === true || target.miniboss === true) {
					target.corrosionTurns = 5;
					target.corrosionDamage = Math.floor(this.depth / 3);
				} else {
					target.corrosionTurns = 10;
					target.corrosionDamage = this.depth;
				}
				break;
			case 'starflower':
				//`HolyDart.proc()` (`HolyDart.java`, tag `v3.3.8`): `Bless.DURATION`
				//on allies and on non-undead enemies alike, and a flat
				//`NormalIntRange(10 + depth/3, 20 + depth/3)` smite on UNDEAD/DEMONIC
				//targets instead of the bless. The old branch blessed 5 and smote for
				//25% of max HP on undead only. No allied undead exists in the roster,
				//so the ally/enemy bless halves collapse into one non-undead branch.
				if (isUndeadOrDemonic(target.kind)) {
					const smite = Random.normalRange(10 + Math.floor(this.depth / 3), 20 + Math.floor(this.depth / 3));
					target.hp -= smite;
					this.showDamage(target, smite);
					if (target.hp <= 0) this.kill(target);
				} else addBuff(target, 'bless', BUFF_DURATION.bless);
				break;
			case 'stormvine':
				//`ShockingDart.proc()` (`ShockingDart.java`, tag `v3.3.8`): flat
				//`NormalIntRange(5 + depth/4, 10 + depth/4)` electricity damage and no
				//status at all - the old daze-3 with no damage was invented. (The
				//lightning-arc presentation has no seam here.)
				{
					const shock = Random.normalRange(5 + Math.floor(this.depth / 4), 10 + Math.floor(this.depth / 4));
					target.hp -= shock;
					this.showDamage(target, shock);
					if (target.hp <= 0) this.kill(target);
				}
				break;
			case 'sungrass':
				//`HealingDart.proc()` (`HealingDart.java`, tag `v3.3.8`): Java's
				//`PotionOfHealing.cure()` plus a gradual `setHeal(0.5*HT + 30, 0.25)`
				//pool - not an instant `10 + 2*lvl` with no cure. The hero rides the
				//real `healingLeft` pool with `setHeal`'s max-replace rule; other
				//targets take the same amount at once (no per-mob heal pool exists -
				//stated simplification, same precedent as the Bless row).
				cureHeroBuffs(target);
				{
					const pool = Math.round(0.5 * target.maxHp + 30);
					if (target.isHero === true) this.healingLeft = Math.max(this.healingLeft ?? 0, pool);
					else {
						target.hp = Math.min(target.maxHp, target.hp + pool);
						this.showHeal(target, pool);
					}
				}
				break;
			case 'mageroyal':
				//`CleansingDart.proc()` (`CleansingDart.java`, tag `v3.3.8`) splits on
				//alignment: an ally is cleansed (`PotionOfCleansing.cleanse` - every
				//negative detached, `Cleanse` immunity at the dart's doubled duration
				//`DURATION*2f` = 10), while an enemy is stripped of positives instead.
				//The old branch ran the enemy strip on every target (exactly backwards
				//for allies) and added a blind Java never throws. `AllyBuff`/
				//`LostInventory` have no port model so their exclusions are vacuous;
				//the hunger-satisfy inside `cleanse` is unmodeled too (hunger is a
				//number here, not a buff), as is the strip-killed-Brute `die` edge
				//(deleting buffs cannot drop HP in this model). The enemy's
				//`seesHero = false` stays: Java resets a hunting/fleeing mob to
				//wandering with a fresh beckon and a `showLost` mark, and losing the
				//hero is this port's standing stand-in for that reset.
				if (target.isAlly === true || target.isHero === true) {
					for (const id of NEGATIVE_BUFFS) delete target.buffs[id];
					reigniteBuff(target, 'cleanseImmunity', 10);
				} else {
					for (const buff of ['bless', 'haste', 'adrenalineSurge', 'fury', 'berserk'] as BuffId[]) delete target.buffs[buff];
					target.seesHero = false;
				}
				break;
			case 'swiftthistle':
				//`AdrenalineDart.proc()` (`AdrenalineDart.java`, tag `v3.3.8`) splits
				//the same way: `Adrenaline.DURATION` (10) on an ally, `Cripple` at
				//half duration (`Cripple.DURATION/2` = 5) on an enemy. The old branch
				//dealt cripple 3 to everyone and never granted the buff at all.
				//(`processingChargedShot`'s self-hit refusal has no expression - no
				//Crossbow charged-shot system exists here.)
				if (target.isAlly === true || target.isHero === true) addBuff(target, 'adrenalineSurge', 10);
				else addBuff(target, 'cripple', 5);
				break;
				default:
					break;
			}
		},
};
