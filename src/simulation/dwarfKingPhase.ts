/**
 * DwarfKing phase-transition predicates - the pure decision half of `DwarfKing.damage()`'s
 * phase branches (actors/mobs/DwarfKing.java, tag `v3.3.8`). Extracted from the scene's
 * `kingPhaseRules` ReactionTable so the Java-vs-TS parity kit (BACKLOG B3, boss transitions)
 * checks the *same* predicates the game runs rather than a second copy of them, the way
 * `mobLootChance()` did for the loot decision. The composition is deliberately the same
 * shape as the inline expressions it replaced, so the change is behavior-identical; the
 * presentation and mutation (throne teleport, shield grant, cull, yells) stay in the table's
 * `action` closures in `bossLogic.ts`.
 *
 * Java, in order (`DwarfKing.damage()`, after the P1 cooldown acceleration):
 *  - `phase == 1 && HP <= (challenge ? 100 : 50)`: HP is clamped back UP to the threshold,
 *    phase becomes 2, `summonsMade = 0`, the barrier is set to full HT;
 *  - `phase == 2 && shielding() == 0`: phase becomes 3, `summonsMade = 1`;
 *  - `phase == 3 && preHP > 20 && HP < 20 && isAlive()`: the one-time "losing" yell.
 *
 * Port notes: the barrier is a plain number drained through the shared `absorbShield`,
 * which floors at zero, so the port's `<= 0` test fires on the same crossing as Java's
 * `== 0`. The yell predicate keeps the port's existing `hp < 20` shape (no phase or
 * crossing gate): in practice HP can only sit under 20 in phase 3 - the P1->P2 rule clamps
 * to 50 first and the P2 shield absorbs everything - and the table's `once` latch keeps it
 * one-time, matching Java's one-shot yell.
 */

/** `DwarfKing.damage()`'s P1->P2 HP threshold (50, or 100 on STRONGER_BOSSES). */
export function kingPhase2Threshold(strongerBosses: boolean): number {
	return strongerBosses ? 100 : 50;
}

/** P1->P2 entry: still phase 1 with HP at or under the threshold (the clamp rescues survivors). */
export function kingPhase2Entry(phase: number, hp: number, strongerBosses: boolean): boolean {
	return phase === 1 && hp <= kingPhase2Threshold(strongerBosses);
}

/** P2->P3 entry: still phase 2 with the barrier drained. */
export function kingPhase3Entry(phase: number, shield: number): boolean {
	return phase === 2 && shield <= 0;
}

/** P3's one-time "losing" yell gate. */
export function kingLosingYell(hp: number): boolean {
	return hp < 20;
}
