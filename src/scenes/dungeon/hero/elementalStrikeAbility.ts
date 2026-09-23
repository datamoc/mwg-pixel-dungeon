import type { DungeonScene } from '../../dungeonScene';
import type { ArmorAbilityDef } from '../../../armorAbilities';
import { Random, Roguelike } from 'mwg';
import { UNSTABLE_DELEGATES } from '../../../items/itemAffixes';
import { t } from '../../../i18n/index';
import { directedPowerBoost, elementalAnnoyingChance, elementalBaseDamage, elementalBlobAmount, elementalBlockingShield, elementalBloomingBudget, elementalCorruptingChance, elementalCurseChance, elementalFurrowStep, elementalGrimChance, elementalKineticSplash, elementalKnockback, elementalLuckyChance, elementalPowerMulti, elementalProjectingSplash, elementalRootsDuration, elementalSacrificialOther, elementalSacrificialSelf, elementalStrikeCone, elementalVampiricHeal } from '../../../simulation/duelistAbilities';
import { coneCells } from '../../../mechanics/cone';
import { EMBERS, FLOOR, GRASS, HIGH_GRASS } from '../../../dungeonConstants';
import { addBuff, applyElementalBacklash, setBleeding, type Creature, type Step } from '../../../combat';
import { applyChillFreeze } from '../../../simulation/buffs';
import { IMMOVABLE_KINDS } from '../../../monsters';

/** ElementalStrike scene handler extracted behavior-identically to keep the ability table under its file budget. */
export const elementalStrikeAbilityMethods = {
	activateElementalStrike(this: DungeonScene, def: ArmorAbilityDef, cost: number, cell: Step | null): boolean {
		if (!cell) return false;
		//`new Ballistica(hero.pos, target, WONT_STOP)`: the aim ignores everything, so the
		//cone's own `STOP_SOLID | STOP_TARGET` rays are what stop at walls (Shockwave's shape).
		const aimPath = Roguelike.ballistica(this.level, { x: this.hero.x, y: this.hero.y }, cell, { stop: 'none' }).cells;
		const aim = aimPath[aimPath.length - 1] ?? cell;
		const reach = this.talentRank('elemental_reach');
		const powerMulti = elementalPowerMulti(this.talentRank('striking_force'));
		const aimDistance = Roguelike.chebyshevDistance({ x: this.hero.x, y: this.hero.y }, aim);
		const { distance, degrees } = elementalStrikeCone(reach, aimDistance);
		const cone = coneCells({
			source: { x: this.hero.x, y: this.hero.y },
			target: aim,
			degrees,
			maxDistance: distance,
			width: this.level.width,
			height: this.level.height,
			trace: (coneFrom, coneTo) => this.coneRay(coneFrom, coneTo, true),
		});
		this.armorCharge = Math.max(0, this.armorCharge - cost);
		const ench = this.weaponAffix;
		const coneIndex = new Set(cone.cells.map((at) => this.level.index(at.x, at.y)));
		const foeInCone = (c: Creature): boolean => !c.isHero && !c.isAlly && !c.isNPC
			&& c.allyKind !== 'sheep' && c.hp > 0 && coneIndex.has(this.level.index(c.x, c.y));
		const targetsHit = this.creatures.filter(foeInCone).length;
		//Pre-attack pass: the DirectedPower boost stages onto the primary swing (Java's
		//one-shot tracker consumed by `Weapon.procDamage` amounts to exactly this), the
		//Kinetic copy is read before the swing can disturb it, and Blocking/Vampiric/
		//Sacrificial resolve before anything else.
		const directedBoost = directedPowerBoost(this.talentRank('directed_power'), targetsHit);
		const storedKinetic = this.kineticStored;
		if (ench === 'blocking') this.grantHeroShield(elementalBlockingShield(targetsHit, powerMulti));
		else if (ench === 'vampiric') {
			const heal = elementalVampiricHeal(targetsHit, powerMulti, this.hero.maxHp - this.hero.hp);
			if (heal > 0) this.hero.hp += heal;
		} else if (ench === 'sacrificial') setBleeding(this.hero, elementalSacrificialSelf(powerMulti));
		//The primary target: whoever stands on the aimed cell, unless charmed by her, allied,
		//or otherwise not a foe. Java gates on `isCharmedBy`/`alignment`/`canAttack`; the port
		//has no `canAttack` refusals beyond these, so the foe filter is the whole gate.
		let primary: Creature | null = this.creatureAt(cell.x, cell.y) ?? null;
		//`hero.attack` refuses its own out-of-range swing (`canAttack`), so the primary
		//needs melee range - Java's 8-neighbourhood adjacency - even though the cone and its
		//cell/char passes still resolve when she is not.
		if (primary !== null && (!foeInCone(primary)
			|| Roguelike.chebyshevDistance(this.hero, primary) > 1
			|| (this.hero.buffs['charm'] !== undefined && this.charmTargets.get(this.hero.id) === primary.id))) primary = null;
		const oldPrimary = primary === null ? null : { x: primary.x, y: primary.y };
		if (primary !== null) {
			//`hero.attack(enemy, 1, 0, INFINITE_ACCURACY)`: the established force-hit plus
			//damage-multiplier channels, reset explicitly afterwards in case an early gate
			//inside `attack()` returns before its own consume block.
			this.abilityForceHit = true;
			this.abilityDamageMult = 1 + directedBoost;
			this.attack(this.hero, primary);
			this.abilityForceHit = false;
			this.abilityDamageMult = 1;
		}
		//Per-cell pass over the cone.
		if (ench === 'blazing' || ench === 'chilling' || ench === 'shocking') {
			const volume = elementalBlobAmount(powerMulti);
			for (const at of cone.cells) {
				if (ench === 'blazing') this.fire.seed(at.x, at.y, volume);
				else if (ench === 'shocking') this.electricity.seed(at.x, at.y, volume);
				//No `Freezing` blob exists in this port: its `Freezing.evolve()` halves are the
				//fire-clearing the frost potion already models plus a chill on the occupants.
				else this.fire.clear(at.x, at.y);
			}
			if (ench === 'chilling') {
				for (const c of this.creatures) {
					if (c.hp <= 0 || c.isNPC || c.allyKind === 'sheep' || !coneIndex.has(this.level.index(c.x, c.y))) continue;
					delete c.buffs['burning'];
					//`Elemental.add()`'s hate-listed chill backslashes instead of attaching
					//(tag `v3.3.8`) - a fire-typed target takes the backlash, never the chill.
					if (applyElementalBacklash(c, 'chill') === 0) c.buffs = applyChillFreeze(c.buffs).buffs;
					if (c.hp <= 0) this.kill(c);
				}
			}
		} else if (ench === 'blooming') {
			const enemiesVisible = this.creatures.some((c) => foeInCone(c) && c.seesHero);
			const { furrowed, increment } = elementalFurrowStep(this.elementalFurrow, targetsHit, enemiesVisible);
			this.elementalFurrow += increment;
			let budget = elementalBloomingBudget(powerMulti);
			//`Random.shuffle(cells)`: Fisher-Yates on the port's own gameplay stream.
			const shuffled = [...cone.cells];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Random.int(0, i + 1);
				[shuffled[i], shuffled[j]] = [shuffled[i]!, shuffled[j]!];
			}
			for (const at of shuffled) {
				//`EMPTY || EMBERS || EMPTY_DECO || GRASS`: the live level folds deco into its
				//base kind, so `FLOOR || EMBERS || GRASS` is the whole plantable set.
				const kind = this.level.get(at.x, at.y);
				if (kind !== FLOOR && kind !== EMBERS && kind !== GRASS) continue;
				const occupant = this.creatureAt(at.x, at.y);
				if (occupant !== null && occupant.kind !== undefined && IMMOVABLE_KINDS.has(occupant.kind)) continue;
				const pos = this.level.index(at.x, at.y);
				if ((this.portedPaint?.plants.some((plant) => plant.pos === pos) ?? false) || this.manualPlants.has(pos)) continue;
				if (budget > 0) {
					this.level.set(at.x, at.y, HIGH_GRASS);
					if (furrowed) this.furrowedGrass.add(pos);
					budget--;
				} else this.level.set(at.x, at.y, GRASS);
				this.restitchTilesAround(at.x, at.y);
				this.featuresMap?.setLayerData('features', this.featureFrames());
			}
		}
		//Per-char pass over every non-ally caught in the cone.
		const affected = this.creatures.filter(foeInCone);
		if (ench === null || ench === undefined) {
			for (const ch of affected) this.applyAbilityDamage(ch, elementalBaseDamage(powerMulti, Random.normalRange(6, 12)), 'strike');
		} else if (ench === 'kinetic') {
			if (storedKinetic > 0) {
				for (const ch of affected) {
					if (ch !== primary) this.applyAbilityDamage(ch, elementalKineticSplash(storedKinetic, powerMulti), 'kinetic');
				}
			}
			//Java only clears the conserved damage when there was no primary target (the
			//splash spends a copy otherwise, and the swing's own Kinetic proc owns the buff).
			if (primary === null) this.kineticStored = 0;
		} else if (ench === 'blooming') {
			for (const ch of affected) addBuff(ch, 'roots', elementalRootsDuration(powerMulti));
		} else if (ench === 'elastic') {
			const knockback = elementalKnockback(powerMulti);
			const ordered = [...affected].sort((a, b) =>
				Roguelike.chebyshevDistance(this.hero, b) - Roguelike.chebyshevDistance(this.hero, a));
			for (const ch of ordered) {
				if (ch === primary && oldPrimary !== null && (ch.x !== oldPrimary.x || ch.y !== oldPrimary.y)) continue;
				const dx = Math.sign(ch.x - this.hero.x);
				const dy = Math.sign(ch.y - this.hero.y);
				if (dx === 0 && dy === 0) continue;
				for (let push = 0; push < knockback; push++) {
					const next = { x: ch.x + dx, y: ch.y + dy };
					if (!this.level.passable(next.x, next.y) || this.creatureAt(next.x, next.y)) break;
					this.moveTo(ch, next);
				}
			}
		} else if (ench === 'lucky') {
			for (const ch of affected) {
				if (ch.buffs['luckyTracker'] !== undefined) continue;
				if (Random.chance(elementalLuckyChance(powerMulti))) {
					//`Lucky.genLoot()` is `RingOfWealth.genConsumableDrop(-5)` (tag `v3.3.8`):
					//80% low (half-gold/stone/potion/scroll, equal 25% cases) and 20% mid
					//(doubled-low/exotic-potion/exotic-scroll/unstable/bomb/honeypot, equal
					//1/6 cases). Exotics and unstable items stand in as their regular potion/
					//scroll here because those item classes do not exist in this port.
					const cell = () => [{ x: ch.x, y: ch.y }, ...Roguelike.neighbourOffsets(8).map(([ox, oy]) => ({ x: ch.x + ox, y: ch.y + oy }))]
						.find((step) => this.level.inside(step.x, step.y) && this.level.passable(step.x, step.y)
							&& !this.groundItemAt(step.x, step.y) && !this.creatureAt(step.x, step.y));
					const kind = (id: 'stone' | 'potion' | 'scroll' | 'bomb' | 'honeypot') => {
						const at = cell();
						if (at) this.spawnGroundItem(id, at.x, at.y);
					};
					const gold = (doubled: boolean) => {
						const at = cell();
						if (!at) return;
						const full = Random.range(30 + this.depth * 10, 60 + this.depth * 20);
						this.spawnGroundItem('gold', at.x, at.y, { id: 'gold', quantity: Math.max(1, doubled ? full : Math.floor(full / 2)), identified: true });
					};
					const low = (doubled: boolean) => {
						const id = Random.element(['gold', 'stone', 'potion', 'scroll'] as const)!;
						if (id === 'gold') gold(doubled);
						else if (doubled) { kind(id); kind(id); }
						else kind(id);
					};
					if (Random.float() < 0.8) low(false);
					else {
						switch (Random.int(6)) {
							case 0: low(true); break;
							case 1: kind('potion'); break;
							case 2: kind('scroll'); break;
							case 3: kind(Random.int(2) === 0 ? 'potion' : 'scroll'); break;
							case 4: kind('bomb'); break;
							default: kind('honeypot'); break;
						}
					}
					this.say(t('port.log.lucky'), 'positive');
					addBuff(ch, 'luckyTracker');
				}
			}
		} else if (ench === 'projecting') {
			for (const ch of affected) {
				if (ch !== primary) this.applyAbilityDamage(ch, elementalProjectingSplash(this.heroWeaponRoll(), powerMulti), 'projecting');
			}
		} else if (ench === 'unstable') {
			for (const ch of affected) {
				if (ch === primary) continue;
				//`ench.proc(w, hero, ch, w.damageRoll(hero))`: a fresh random enchantment's
				//own proc with a fresh weapon roll, through the same delegation channel an
				//Unstable swing uses (Java skips this when unarmed; the port is never unarmed).
				const delegated = Random.element(UNSTABLE_DELEGATES)!;
				const previous = this.unstableDelegated;
				this.unstableDelegated = delegated;
				this.heroOnHit(this.hero, ch, this.heroWeaponRoll());
				this.unstableDelegated = previous;
			}
		} else if (ench === 'corrupting') {
			for (const ch of affected) {
				if (ch === primary || ch.isAlly) continue;
				if (ch.hp <= 0) continue;
				const missing = 1 - ch.hp / ch.maxHp;
				if (Random.chance(elementalCorruptingChance(missing, powerMulti))) {
					//`Corruption.corruptionHeal` + `AllyBuff.affectAndLoot`: the port's own
					//wand-of-corruption conversion is the established observable equivalent.
					ch.isAlly = true;
					ch.allyKind = 'mirror';
					ch.hp = ch.maxHp;
					ch.buffs = {};
					ch.sleeping = false;
					ch.seesHero = false;
				}
			}
		} else if (ench === 'grim') {
			for (const ch of affected) {
				if (ch === primary) continue;
				const missing = 1 - ch.hp / ch.maxHp;
				if (Random.chance(elementalGrimChance(missing, powerMulti))) this.applyAbilityDamage(ch, ch.hp, 'grim');
			}
		} else if (ench === 'annoying') {
			for (const ch of affected) {
				if (Random.chance(elementalAnnoyingChance(powerMulti))) addBuff(ch, 'amok', 6);
			}
		} else if (ench === 'displacing') {
			for (const ch of affected) {
				if (!Random.chance(elementalCurseChance(powerMulti))) continue;
				const destination = this.randomFreeCell(ch);
				if (destination === undefined) continue;
				const from = { x: ch.x, y: ch.y };
				this.moveTo(ch, destination);
				this.playTeleportAppear(from, destination, ch);
			}
		} else if (ench === 'dazzling') {
			for (const ch of affected) {
				if (Random.chance(elementalCurseChance(powerMulti))) addBuff(ch, 'blindness', 6);
			}
		} else if (ench === 'explosive') {
			if (Random.chance(elementalCurseChance(powerMulti))) {
				const exploding = Random.element(affected) ?? null;
				if (exploding !== null) this.detonateConjuredBlast(exploding.x, exploding.y);
			}
		} else if (ench === 'sacrificial') {
			for (const ch of affected) setBleeding(ch, elementalSacrificialOther(powerMulti));
		} else if (ench === 'wayward') {
			for (const ch of affected) {
				if (Random.chance(elementalCurseChance(powerMulti))) addBuff(ch, 'hex', 6);
			}
		} else if (ench === 'polarized') {
			for (const ch of affected) {
				if (Random.chance(elementalCurseChance(powerMulti))) this.applyAbilityDamage(ch, Random.normalRange(24, 36), 'strike');
			}
		} else if (ench === 'friendly') {
			for (const ch of affected) {
				if (Random.chance(elementalCurseChance(powerMulti))) {
					addBuff(ch, 'charm', 6);
					this.charmTargets.set(ch.id, this.hero.id);
				}
			}
		} else {
			//Blazing, Chilling, Shocking and Blocking, Vampiric, Lucky-share handled above deal
			//no per-char damage of their own; any other affix id falls through to the plain
			//strike rather than fizzling the whole ability.
			for (const ch of affected) this.applyAbilityDamage(ch, elementalBaseDamage(powerMulti, Random.normalRange(6, 12)), 'strike');
		}
		delete this.hero.buffs['invisibility'];
		//`DirectedPowerTracker` (`ElementalStrike.java`, tag `v3.3.8`): the strike's
		//`0.30 x targetsHit x points` boost is armed for the NEXT weapon-proc roll
		//(`genericProcChanceMultiplier` consumes it), alongside this strike's own
		//imbue use above - armed last so the strike's own attacks cannot consume
		//it. Overwrites like Java's `affect(...).enchBoost = ...`; stacking with
		//a pending RunicSlash bonus happens at the consume site, where both slots
		//sum.
		this.abilityDirectedBonus = directedBoost;
		this.spendHeroAction(1);
		return true;
	},
};
