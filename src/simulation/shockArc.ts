import type { Step } from './combatState';

export interface ShockArcTarget extends Step {
	id: string;
	hp: number;
	flying?: boolean;
}

export interface ShockArcPlan {
	targetIds: string[];
	damage: number;
}

/**
 * Java reference: `Shocking.arc()` and `Elemental.ShockElemental.meleeProc()` in
 * `items/weapon/enchantments/Shocking.java` and `actors/mobs/Elemental.java`, tag `v3.3.8`.
 * Java deals each arc hit via `ch.damage(round(dmg*0.4))`, which never rolls armor -
 * the scene therefore applies the plan through the armor-piercing blast seam (plus
 * the shared kill path). This module owns only Java's recursive non-solid radius,
 * the affected-set order, and the 0.4 factor.
 */
export function planShockElementalArc(
	attackerId: string,
	defender: ShockArcTarget,
	damage: number,
	creatures: readonly ShockArcTarget[],
	distanceMap: (origin: Step) => ArrayLike<number>,
	cellIndex: (x: number, y: number) => number,
	isSolid: (x: number, y: number) => boolean,
	isWater: (target: ShockArcTarget) => boolean,
): ShockArcPlan {
	const affected: ShockArcTarget[] = [];
	const queue: { from: ShockArcTarget; radius: number }[] = [{ from: defender, radius: 2 }];
	while (queue.length > 0) {
		const { from, radius } = queue.shift()!;
		const distances = distanceMap(from);
		for (const target of creatures) {
			if (target.id === attackerId || target.hp <= 0 || affected.some((hit) => hit.id === target.id)) continue;
			const steps = distances[cellIndex(target.x, target.y)] ?? -1;
			if (steps < 0 || steps > radius || isSolid(target.x, target.y)) continue;
			affected.push(target);
			queue.push({ from: target, radius: isWater(target) && !target.flying ? 2 : 1 });
		}
	}
	const targetIds = isWater(defender) ? affected.map((target) => target.id) : affected.filter((target) => target.id !== defender.id).map((target) => target.id);
	return { targetIds, damage: Math.round(damage * 0.4) };
}