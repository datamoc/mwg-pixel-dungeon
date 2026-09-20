/**
 * Ratmogrify's `RATSISTANCE` talent (`Ratmogrify.TransmogRat.damageRoll()`, tag `v3.3.8`):
 * a transformed, non-allied rat deals `damage *= 0.9^points`.
 *
 * Only the arithmetic lives here. The dispatch stays in the scene (`resolveHeroAbilityAttack`
 * folds it into the attack's damage multiplier for a `ratmogrifiedTurns` attacker that is not
 * an ally), because the transformed state and the hero's talent ranks live on the live scene,
 * not on the combatant stat block `rollDamage` reads.
 */

/** The per-point base of `Math.pow(0.9f, pointsInTalent(RATSISTANCE))`. */
export const RATSISTANCE_BASE = 0.9;

/** `0.9^points`: 1 at rank 0 (Java gates on `hasTalent`, which is the same value). */
export function ratsistanceFactor(points: number): number {
	return Math.pow(RATSISTANCE_BASE, Math.max(0, points));
}

/** A creature where the ratmogrify flow needs one: hostility flags plus the rat state. */
export interface RatmogrifyCreatureView {
	x: number;
	y: number;
	hp: number;
	name: string;
	kind?: string | undefined;
	isHero?: boolean | undefined;
	isNPC?: boolean | undefined;
	isAlly?: boolean | undefined;
	ratmogrifiedPermanent?: boolean | undefined;
	ratmogrifiedTurns?: number | undefined;
}

/**
 * The `Ratmogrify` armor-ability flow (`useRatmogrify` in the scene), moved here
 * verbatim as the file-size refactor's thirty-second extraction, behavior-identical.
 * Zero runtime imports (the simulation confinement rule): geometry is inline,
 * message keys stay keys for the scene to translate, and the charge roll, shuffle,
 * spawn and buff grant arrive as callbacks. The scene keeps the one-line adapter
 * plus a builder.
 */
export interface RatmogrifyContext {
	readonly hero: { x: number; y: number; buffs: { invisibility?: number | undefined } };
	readonly creatures: RatmogrifyCreatureView[];
	readonly fov: { isVisible(x: number, y: number): boolean };
	readonly level: { passable(x: number, y: number): boolean };
	readonly creatureAt: (x: number, y: number) => RatmogrifyCreatureView | null | undefined;
	//An undefined kind is never a boss (`Set.has(undefined)` is false in the scene).
	readonly isBossKind: (kind: string | undefined) => boolean;
	readonly ratmogrifyChargeUse: () => number;
	get armorCharge(): number;
	set armorCharge(charge: number);
	readonly talentRank: (id: string) => number;
	readonly shuffle: <T>(items: T[]) => void;
	readonly spawnAwakeAllyRat: (cell: { x: number; y: number }) => void;
	readonly grantAdrenaline: (target: RatmogrifyCreatureView, turns: number) => void;
	//Message keys stay keys here (this directory cannot import the catalog): the scene
	//translates with `t()`; only the transmogrify line carries a param, Java's `{0: name}`.
	readonly say: (key: string, params: { readonly [param: string]: string | number } | null, level: 'positive' | 'negative') => void;
}

export function useRatmogrifyFlow(context: RatmogrifyContext): boolean {
	const target = context.creatures
		.filter((c) => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0 && !c.ratmogrifiedPermanent && c.kind !== 'rat'
			&& !context.isBossKind(c.kind) && context.fov.isVisible(c.x, c.y))
		.sort((a, b) => Math.max(Math.abs(a.x - context.hero.x), Math.abs(a.y - context.hero.y))
			- Math.max(Math.abs(b.x - context.hero.x), Math.abs(b.y - context.hero.y)))[0];
	//`Ratmogrify.chargeUse()` is the real 50, so the ability is not free - this used to cost no
	//charge at all, since it predates the charge system. The turn is spent by the calling
	//`attempt` action (`HeroAction.Attack`'s own `spendAndNext`); spending it here as well made
	//every ratmogrify cost two turns.
	const cost = context.ratmogrifyChargeUse();
	if (context.armorCharge < cost) {
		context.say('items.armor.classarmor.low_charge', null, 'negative');
		return false;
	}
	if (!target) {
		//`RATFORCEMENTS`: self-cast spawns `points` ally rats on free NEIGHBOURS8 cells.
		const rats = context.talentRank('ratforcements');
		if (rats <= 0) {
			context.say('actors.hero.abilities.ratmogrify.cant_transform', null, 'negative');
			return false;
		}
		const free: { x: number; y: number }[] = [];
		//All eight neighbours, one step each - the same `dirLR` walk `PathFinder` uses.
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (dx === 0 && dy === 0) continue;
				const x = context.hero.x + dx, y = context.hero.y + dy;
				if (context.level.passable(x, y) && !context.creatureAt(x, y)) free.push({ x, y });
			}
		}
		context.shuffle(free);
		context.armorCharge = Math.max(0, context.armorCharge - cost);
		delete context.hero.buffs['invisibility'];
		for (const cell of free.slice(0, rats)) context.spawnAwakeAllyRat(cell);
		return true;
	}
	if (target.ratmogrifiedTurns !== undefined) {
		//`RATLOMACY`: re-casting on a transformed enemy makes it a permanent ally -
		//plus `Adrenaline` 2*(points-1) from rank 2 up - and refuses without the talent.
		const diplomacy = context.talentRank('ratlomacy');
		if (diplomacy <= 0) {
			context.say('actors.hero.abilities.ratmogrify.cant_transform', null, 'negative');
			return false;
		}
		context.armorCharge = Math.max(0, context.armorCharge - cost);
		delete context.hero.buffs['invisibility'];
		target.isAlly = true;
		target.ratmogrifiedPermanent = true;
		delete target.ratmogrifiedTurns;
		if (diplomacy > 1) context.grantAdrenaline(target, 2 * (diplomacy - 1));
		return true;
	}
	context.armorCharge = Math.max(0, context.armorCharge - cost);
	delete context.hero.buffs['invisibility'];
	target.ratmogrifiedTurns = 6;
	context.say('actors.hero.abilities.ratmogrify$transmograt.name', { 0: target.name }, 'positive');
	return true;
}
