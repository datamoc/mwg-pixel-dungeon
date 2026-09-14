import { Actors, Random } from 'mwg';
import { t } from '../i18n';
import { mwlItemEffectValue } from '../mwlContent';

export interface ArtifactActionContext {
	readonly bag: Actors.Inventory;
	readonly hero: { buffs: Record<string, number>; hp: number; maxHp: number; magicImmune?: boolean };
	timeBubbleTurns: number;
	hourglassFreeze: boolean;
	hourglassTurnsToCost: number;
	cloakStealthTurnsToCost: number;
	flushTimeBubblePresses(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	/** Shared hero damage boundary (Tenacity/AntiMagic/Viscosity/RockArmor/Barrier), matching
	 * every other hero-inflicted-on-self source (bomb blast, trap damage). */
	absorbHeroDamage(amount: number): number;
	showHeroDamage(amount: number): void;
	/** Kills the hero with the given death cause (see `DungeonScene.kill`'s cause union). */
	killHero(cause: 'foe' | 'trap' | 'fire' | 'poison' | 'hunger'): void;
}

/** `TimekeepersHourglass.timeFreeze`: freeze automatic actors while hero actions are free. */
export function useHourglass(scene: ArtifactActionContext, instanceId?: string): void {
	const hourglass = scene.bag.find('hourglass', instanceId) as (typeof scene.bag.items[number] & { charges?: number }) | undefined;
	if (!hourglass || hourglass.cursed) {
		scene.say(t('port.log.cursedhourglass'), 'negative');
		return;
	}
	if (scene.timeBubbleTurns > 0) {
		scene.flushTimeBubblePresses();
		scene.hourglassFreeze = false;
		scene.timeBubbleTurns = 0;
		return;
	}
	const maxCharge = mwlItemEffectValue('hourglass', 'maxChargeBase')
		+ Math.min(mwlItemEffectValue('hourglass', 'maxChargeLevelCap'), hourglass.level ?? 0) * mwlItemEffectValue('hourglass', 'maxChargePerLevel');
	const charge = Math.min(maxCharge, hourglass.charges ?? maxCharge);
	if (charge <= 0) {
		scene.say(t('port.log.hourglassnocharge'), 'negative');
		return;
	}
	hourglass.charges = charge - 1;
	scene.hourglassFreeze = true;
	scene.hourglassTurnsToCost = mwlItemEffectValue('hourglass', 'turnsToCost');
	//Java's processTime loop lets a zero-charge freeze survive two more turns; using the
	//pre-spend charge here preserves that exact `2 * charge` duration.
	scene.timeBubbleTurns = charge * mwlItemEffectValue('hourglass', 'turnsPerCharge');
	scene.say(t('port.log.timefreezes'), 'positive');
}

/** `CloakOfShadows.execute()/cloakStealth`: toggle invisibility and consume charges over time. */
export function useCloak(scene: ArtifactActionContext, instanceId?: string): void {
	const cloak = scene.bag.find('cloak', instanceId) as (typeof scene.bag.items[number] & { charges?: number }) | undefined;
	if (!cloak) return;
	if (scene.cloakStealthTurnsToCost > 0) {
		scene.cloakStealthTurnsToCost = 0;
		delete scene.hero.buffs['invisibility'];
		return;
	}
	if (cloak.cursed || (cloak.charges ?? 0) <= 0) {
		scene.say(t('port.log.cannotupgrade'), 'negative');
		return;
	}
	scene.cloakStealthTurnsToCost = mwlItemEffectValue('cloak', 'turnsToCost');
	scene.hero.buffs['invisibility'] = 9999;
}

/** `ChaliceOfBlood.execute(AC_PRICK)`/`prick()` (tag `v3.3.8`): real Java rolls
 * `NormalIntRange(ceil(3 + 2.5*level^2), floor(7 + 3.5*level^2))` self-damage, subtracts the
 * hero's own `drRoll()` (armor), then calls `hero.damage(damage, this)` - killing the hero on a
 * lethal roll, otherwise permanently upgrading the chalice (capped at `levelCap = 10`). This port
 * reuses the shared `absorbHeroDamage` boundary (Tenacity/AntiMagic/Viscosity/RockArmor/Barrier)
 * the same way every other hero-inflicted-on-self source does (bomb blast, trap damage), but does
 * **not** additionally subtract the hero's own armor roll first: no existing hook exposes a bare
 * armor-only roll to a bespoke item action (only `applyBlastDamage`'s *monster* branch resolves
 * armor, and that call site's own hero branch already skips it too - see its comment), so this is
 * a stated simplification, not a silent omission. Real Java also shows a `WndOptions`
 * confirmation naming the exact death chance before pricking; this port has no equivalent
 * computed-odds confirmation window (matching every other "use item on self" action here that
 * skips Java's own modal) and pricks immediately. **Not ported at all**: the passive
 * `chaliceRegen` buff, which boosts Java's natural out-of-combat HP regeneration
 * (`Regeneration.act()` calling `Item.charge()`) - this port has no natural regen system for a
 * passive artifact to hook a bonus into, so Chalice here is active-only. See
 * `PORT_COVERAGE.md`'s artifacts row. */
export function useChalice(scene: ArtifactActionContext, instanceId?: string): void {
	const chalice = scene.bag.find('chalice', instanceId) as (typeof scene.bag.items[number] & { level?: number }) | undefined;
	if (!chalice) return;
	const levelCap = mwlItemEffectValue('chalice', 'levelCap');
	const level = chalice.level ?? 0;
	if (chalice.cursed || level >= levelCap || scene.hero.magicImmune) {
		scene.say(t('port.log.cannotupgrade'), 'negative');
		return;
	}
	const minDmg = Math.ceil(mwlItemEffectValue('chalice', 'minDmgBase') + mwlItemEffectValue('chalice', 'minDmgPerLevelSq') * level * level);
	const maxDmg = Math.floor(mwlItemEffectValue('chalice', 'maxDmgBase') + mwlItemEffectValue('chalice', 'maxDmgPerLevelSq') * level * level);
	const damage = Math.max(1, scene.absorbHeroDamage(Random.normalRange(minDmg, maxDmg)));
	scene.showHeroDamage(damage);
	scene.say(t('items.artifacts.chaliceofblood.onprick'), 'warning');
	scene.hero.hp -= damage;
	if (scene.hero.hp <= 0) {
		scene.say(t('items.artifacts.chaliceofblood.ondeath'), 'negative');
		scene.killHero('trap');
		return;
	}
	chalice.level = level + 1;
}

/** `CapeOfThorns`/`Thorns.proc()` (tag `v3.3.8`): while inactive (`cooldown == 0`), every hit the
 * hero takes charges the cape by `damage * (chargePerDamageBase + chargePerDamagePerLevel*level)`;
 * reaching `chargeCap` resets charge to 0 and starts a `cooldownBase + level`-turn "radiating"
 * window. While that cooldown is running, a `NormalIntRange(0, damage)` portion of every hit is
 * deflected (reduced) instead of landing, and the deflected amount both banks as `exp` (upgrading
 * the cape at `(level+1) * expPerLevelBase`, capped at `levelCap`) and would in real Java also
 * strike an adjacent attacker for the same amount (`Thorns.proc()`'s `attacker.damage(deflected,
 * this)`) - **not ported here**: this hook runs from inside `attack()`'s own resolution of that
 * same attacker's swing, and damaging/potentially killing the attacker mid-call risks the rest of
 * that large function referencing a creature already removed; scoped out rather than risked, see
 * `PORT_COVERAGE.md`'s `CapeOfThorns` row. Returns the (possibly reduced) damage to apply. */
export function applyCapeOfThornsProc(scene: Pick<ArtifactActionContext, 'bag' | 'say'>, damage: number): number {
	const cape = scene.bag.find('cape') as (typeof scene.bag.items[number] & { charge?: number; cooldown?: number; level?: number; exp?: number }) | undefined;
	if (!cape || damage <= 0) return damage;
	const level = cape.level ?? 0;
	let charge = cape.charge ?? 0;
	let cooldown = cape.cooldown ?? 0;
	if (cooldown === 0) {
		charge += damage * (mwlItemEffectValue('cape', 'chargePerDamageBase') + mwlItemEffectValue('cape', 'chargePerDamagePerLevel') * level);
		if (charge >= mwlItemEffectValue('cape', 'chargeCap')) {
			charge = 0;
			cooldown = mwlItemEffectValue('cape', 'cooldownBase') + level;
			scene.say(t('items.artifacts.capeofthorns$thorns.radiating'), 'positive');
		}
	}
	let remaining = damage;
	if (cooldown > 0) {
		const deflected = Random.normalRange(0, damage);
		remaining = damage - deflected;
		let exp = (cape.exp ?? 0) + deflected;
		const levelCap = mwlItemEffectValue('cape', 'levelCap');
		const expToLevel = (level + 1) * mwlItemEffectValue('cape', 'expPerLevelBase');
		if (exp >= expToLevel && level < levelCap) {
			exp -= expToLevel;
			cape.level = level + 1;
			scene.say(t('items.artifacts.capeofthorns$thorns.levelup'), 'positive');
		}
		cape.exp = exp;
	}
	cape.charge = charge;
	cape.cooldown = cooldown;
	return remaining;
}

/** `King's Crown.WEAR`: the crown is exchanged at the Rat King, not consumed directly. */
export function useKingsCrown(scene: Pick<ArtifactActionContext, 'say'>): void {
	scene.say(t('items.kingscrown.desc'));
}
