/**
 * MindForm's synthetic item cast, scene flow (`MindForm.targetSelector` plus the
 * `WndUseTrinity` Mind button, tag `v3.3.8`). Java stores the picked wand/thrown on
 * `Trinity.mindForm` at confirm, then aims through `targetSelector`: wands arrive at
 * `itemLevel()` full-charged and identified, thrown repaired with `spawnedForEffect`,
 * and only armor charge is spent per fire (no tome charges, no hero turn on the wand
 * branch; the throw spends its own time through `thrown.cast()`).
 *
 * This port has no temporary-item path, so the flow stays conjured end to end: pick
 * from the modeled catalogs (the same no-discovery-gate simplification BodyForm's
 * picker already makes - this port has no run-wide discovery journal), store the
 * pick in `Trinity.mindForm`'s slot, aim, and fire through the scene's existing
 * level-explicit seams with no ammo/durability/drop bookkeeping. Everything the
 * scene owns (catalogs, picker, aimer, firing, armor charge, turns) arrives through
 * the context, so this module has zero runtime imports and
 * `tools/verifyMindForm.mjs` drives the whole flow headlessly. The one-line scene
 * builder that binds this context is someone else's claimed file, deliberately.
 */

import type { MindFormAim, MindFormEffect } from '../simulation/mindFormCast';
import { mindFormCastGate, resolveMindFormAim } from '../simulation/mindFormCast';

export interface MindFormOption {
	value: MindFormEffect;
	label: string;
}

export interface MindFormCatalog {
	wands: MindFormOption[];
	thrown: MindFormOption[];
}

export interface MindFormTarget {
	id: string;
}

export interface MindFormContext {
	/** Conjured level (`trinityMindItemLevel()`), computed scene-side. */
	mindItemLevel(): number;
	/** Armor-charge cost of firing this effect (`trinityChargeUsePerEffect`). */
	mindEffectCost(effect: MindFormEffect): number;
	armorCharge(): number;
	spendArmor(amount: number): void;
	isMagicImmune(): boolean;
	heroCell(): { x: number; y: number };
	rayCollision(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number };
	occupantAt(cell: { x: number; y: number }): MindFormTarget | null;
	pickMindEffect(options: MindFormOption[], onPick: (effect: MindFormEffect | null) => void): void;
	aimMindEffect(effect: MindFormEffect, onConfirm: (cell: { x: number; y: number }) => void): void;
	fireMindWand(wandType: string, level: number, targetId: string): boolean;
	fireMindThrown(missileClass: string, level: number, targetId: string): boolean;
	spendTurn(): void;
	say(key: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	/** `Trinity.mindForm`'s slot (a `mind:<kind>:<key>` id, or null). Owned and
	 * persisted scene-side; this flow only writes at pick and reads at fire. */
	storeMindEffect(id: string | null): void;
	readMindEffect(): string | null;
}

/** `Trinity.mindForm` slot encoding. The scene persists the opaque string; the
 * shape is documented here so the Trinity UI can share the slot instead of
 * inventing a second one. */
export function serializeMindEffect(effect: MindFormEffect): string {
	return effect.kind === 'wand' ? `mind:wand:${effect.wandType}` : `mind:thrown:${effect.missileClass}`;
}

export function parseMindEffect(id: string | null): MindFormEffect | null {
	if (!id) return null;
	const parts = id.split(':');
	if (parts.length !== 3 || parts[0] !== 'mind') return null;
	if (parts[1] === 'wand' && parts[2]) {
		return { kind: 'wand', wandType: parts[2], isMultiCharge: parts[2] === 'fireblast' || parts[2] === 'regrowth' };
	}
	if (parts[1] === 'thrown' && parts[2]) return { kind: 'thrown', missileClass: parts[2] };
	return null;
}

/**
 * Effect pick (`WndItemtypeSelect`/`WndItemConfirm` for MindForm): offer every
 * modeled wand and thrown kind, store the pick in the Trinity slot. The Mind
 * button's charge/warded gate is checked at aim-confirm time (the armor total can
 * move between pick and fire), matching Java's button-enable read at window time
 * only in shape - gating twice would refuse a cast Java fires. Wand options carry
 * `isMultiCharge` for fireblast/regrowth (Java's multi-charge pair, charged double).
 */
export function startMindFormFlow(ctx: MindFormContext, catalog: MindFormCatalog): void {
	ctx.pickMindEffect([...catalog.wands, ...catalog.thrown], (effect) => {
		if (!effect) return;
		ctx.storeMindEffect(serializeMindEffect(effect));
		ctx.aimMindEffect(effect, (cell) => confirmMindFormAim(ctx, effect, cell));
	});
}

/**
 * Aim confirm (`targetSelector.onSelect()`): gate, resolve the target, fire, spend
 * the armor charge. A wand spends no hero turn and does not dispel invisibility
 * (Java's wand branch does neither - only armor charge via
 * `trinityChargeUsePerEffect`); a throw spends its turn and breaks invisibility
 * through the normal attack path the scene's `fireMindThrown` routes through.
 * `wand.wandUsed()` is identification accounting for an already-identified
 * conjured item, and the WondrousResin extra-curse roll needs trinkets - both
 * have no port-side seam by construction, stated, not silent.
 */
export function confirmMindFormAim(
	ctx: MindFormContext,
	effect: MindFormEffect,
	cell: { x: number; y: number },
): boolean {
	const isWand = effect.kind === 'wand';
	const cost = ctx.mindEffectCost(effect);
	const gate = mindFormCastGate(isWand, ctx.isMagicImmune(), ctx.armorCharge(), cost);
	if (gate === 'warded') {
		ctx.say('port.log.tomenospell', 'negative');
		return false;
	}
	if (gate === 'charges') {
		ctx.say('items.armor.classarmor.low_charge', 'negative');
		return false;
	}
	const hero = ctx.heroCell();
	const collision = ctx.rayCollision(hero, cell);
	const decided = resolveMindFormAim({
		heroCell: hero,
		aimCell: cell,
		collisionCell: collision,
		aimOccupied: ctx.occupantAt(cell) !== null,
		collisionOccupied: ctx.occupantAt(collision) !== null,
	});
	if (decided.status === 'refused') {
		ctx.say(decided.reason === 'self' ? 'items.wands.wand.self_target' : 'actors.hero.abilities.armorability.no_target', 'negative');
		return false;
	}
	const targetCell = decided.target === 'aim' ? cell : collision;
	const target = ctx.occupantAt(targetCell);
	if (!target) {
		//Unreachable through the planner above (it reports 'empty' first) - kept so a
		//stale occupant read between resolve and fire refuses instead of misfiring.
		ctx.say('actors.hero.abilities.armorability.no_target', 'negative');
		return false;
	}
	const level = ctx.mindItemLevel();
	const fired = isWand
		? ctx.fireMindWand(effect.wandType, level, target.id)
		: ctx.fireMindThrown(effect.missileClass, level, target.id);
	if (!fired) return false;
	ctx.spendArmor(cost);
	if (!isWand) ctx.spendTurn();
	return true;
}

/** Re-aim a stored pick (`WndUseTrinity`'s Mind button): parse the Trinity slot
 * back into an effect and run the same aim-confirm path as a fresh pick. A stale,
 * foreign, or no-longer-modeled id refuses silently, the way Java's empty button
 * row offers nothing - the catalog check covers ids shaped right but naming
 * nothing the picker can offer (e.g. a kind removed since the pick was stored). */
export function reaimStoredMindForm(ctx: MindFormContext, catalog: MindFormCatalog): void {
	const effect = parseMindEffect(ctx.readMindEffect());
	if (!effect) return;
	const known = effect.kind === 'wand'
		? catalog.wands.some((option) => option.value.kind === 'wand' && option.value.wandType === effect.wandType)
		: catalog.thrown.some((option) => option.value.kind === 'thrown' && option.value.missileClass === effect.missileClass);
	if (!known) return;
	ctx.aimMindEffect(effect, (cell) => confirmMindFormAim(ctx, effect, cell));
}
