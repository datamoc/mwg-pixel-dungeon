/**
 * Targeted single-use spells, split out of the scene so they can be checked without a live
 * game - the same split `items/beacon.ts` uses. The first two `TargetedSpell` movers:
 * `TelekineticGrab` (pull a heap into the bag) and `PhaseShift` (scatter a creature and
 * paralyse it), both tag `v3.3.8`; the scene owns the aiming, the floor, and the turn.
 *
 * The flows themselves live here too, behind their contexts - the file-size refactor's
 * seventeenth extraction, behavior-identical.
 */
import { Random } from 'mwg';
import type { AnyMonsterId } from '../monsters';
import type { TrapKind } from '../dungeonConstants';
import { BUFF_DURATION } from '../simulation/buffs';
import { usableForCurseInfusion, usableForMagicalInfusion } from './itemKinds';
import { getArmorCurses, getCurse, getWeaponCurses } from './itemCurses';
import { upgradeItem } from './itemWorkflows';
import { wildEnergyRechargeTurns } from './artifactRecharge';
import { isClassArmorId } from './catalog';
import { alchemyEnergyFor } from './alchemy';

/** The seams every targeted spell shares: the carried spell, the aimer, the turn, the log. */
export interface TargetedSpellAim {
	hasSpell(id: string, instanceId?: string): boolean;
	consumeSpell(id: string, instanceId?: string): void;
	beginAim(opts: { range: number; validate?: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** A ground heap where the grab needs one: Java refuses chests and FOR_SALE heaps. Only
 *  the presence of the scene's own `chest` marker is read, never its variant. */
export interface GrabHeapView {
	chest?: string | undefined;
	forSale?: boolean | undefined;
}

/**
 * The TelekineticGrab aim/confirm flow, moved out of the scene behind this context the
 * way the beacon flows moved before it - behavior-identical, with the scene keeping one
 * builder plus the `useTelekineticGrab` adapter the item-use router calls.
 */
export interface TelekineticGrabContext extends TargetedSpellAim {
	groundItemAt(x: number, y: number): GrabHeapView | null;
	grabGroundItem(x: number, y: number): void;
}

/** A creature where PhaseShift needs one: the scatter victim and paralysis target. */
export interface PhaseShiftCreatureView {
	kind?: AnyMonsterId | undefined;
	isHero?: boolean | undefined;
}

/**
 * The PhaseShift aim/confirm flow, moved out of the scene behind this context the same
 * way - behavior-identical, with the scene keeping one builder plus the `usePhaseShift`
 * adapter the item-use router calls.
 */
export interface PhaseShiftContext extends TargetedSpellAim {
	creatureAt(x: number, y: number): PhaseShiftCreatureView | null;
	randomFreeCellNear(x: number, y: number): { x: number; y: number } | undefined;
	moveCreatureTo(x: number, y: number, cell: { x: number; y: number }): void;
	playTeleportOn(creature: PhaseShiftCreatureView, from: { x: number; y: number }, to: { x: number; y: number }): void;
	calmCreature(creature: PhaseShiftCreatureView): void;
	isBossOrMiniboss(kind: AnyMonsterId | undefined): boolean;
	afflictParalysis(creature: PhaseShiftCreatureView): void;
}

/** A carried potion, scroll, seed or runestone the recycle picker can offer. */
export interface RecyclableView {
	id: string;
	quantity: number;
	instanceId?: string | undefined;
	identified?: boolean | undefined;
	sourceClass?: string | undefined;
}

/** The generator's replacement for a recycled item, as the bag stores it. */
export interface RecycledItemView {
	id: string;
	instanceId?: string | undefined;
}

/** Which generator deck a recycled item redraws from. */
export type RecycleCategory = 'potion' | 'scroll' | 'seed' | 'stone';

/**
 * The Recycle pick/redraw flow, moved out of the scene behind this context the same
 * way - behavior-identical, with the scene keeping one builder plus the `useRecycle`
 * adapter the item-use router calls. Unlike the targeted spells above this is a picker
 * flow that spends no turn: the bag scans, the category deck draw (with its
 * same-class/same-id reroll) and the remove/add swap stay scene-side.
 */
export interface RecycleContext {
	hasSpell(id: string, instanceId?: string): boolean;
	openPicker(title: string, entries: RecyclableView[], onPick: (entry: { id: string; instanceId?: string }) => void): void;
	recyclables(): RecyclableView[];
	findRecyclable(id: string, instanceId?: string): RecyclableView | null;
	drawReplacement(category: RecycleCategory, source: RecyclableView): RecycledItemView;
	replaceRecycled(source: RecyclableView, replacement: RecycledItemView, spellInstanceId?: string): void;
	replacementName(replacement: RecycledItemView): string;
	refreshPanels(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `Recycle.onItemSelected()` (tag `v3.3.8`): replace one carried potion, scroll, seed, or
 * runestone with a different default-generated item from the same category. Java also accepts
 * TippedDart and preserves exotic-vs-regular families; neither has a distinct complete item
 * model here. The generic picker supplies the inventory selection, and the existing generator
 * plus `generatedInventoryItem` preserve the category's level-stream generation and payload
 * conversion. The transmuting particles and collection-vs-floor-drop branch are UI-only in
 * this inventory-sized port, whose bag has no capacity limit. */
export function useRecycleFlow(ctx: RecycleContext, instanceId?: string): void {
	if (!ctx.hasSpell('recycle', instanceId)) return;
	const candidates = ctx.recyclables().filter((item) => item.quantity > 0 && (
		item.id.startsWith('potion') || item.id.startsWith('scroll') || item.id === 'seed'
		|| item.id === 'stone' || item.id.startsWith('stoneOf')
	));
	// Java opens the picker regardless (InventorySpell has no empty-case message, its
	// WndBag simply shows no rows); an empty candidate list opens and cancels the same
	// way, consuming nothing, so no early-out message exists here either.
	ctx.openPicker(ctx.t('items.spells.recycle.inv_title'), candidates, (pick) => {
		const source = ctx.findRecyclable(pick.id, pick.instanceId);
		if (!source) return;
		const category: RecycleCategory = source.id.startsWith('potion') ? 'potion'
			: source.id.startsWith('scroll') ? 'scroll'
				: source.id === 'seed' ? 'seed' : 'stone';
		const replacement = ctx.drawReplacement(category, source);
		ctx.replaceRecycled(source, replacement, instanceId);
		ctx.say(ctx.t('items.spells.recycle.recycled', { 0: ctx.replacementName(replacement) }), 'positive');
		ctx.refreshPanels();
	});
}

/** The seams self-cast buff spells share: the carried spell, the turn, the log. */
export interface CastBase {
	hasSpell(id: string, instanceId?: string): boolean;
	consumeSpell(id: string, instanceId?: string): void;
	spendTurn(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/**
 * The FeatherFall self-cast, moved out of the scene behind this context the same
 * way - behavior-identical, with the scene keeping one builder plus the
 * `useFeatherFall` adapter the item-use router calls.
 */
export interface FeatherFallContext extends CastBase {
	applyFeatherFall(duration: number): void;
}

/**
 * The WildEnergy self-cast, moved out of the scene behind this context the same
 * way - behavior-identical, with the scene keeping one builder plus the
 * `useWildEnergy` adapter the item-use router calls.
 */
export interface WildEnergyContext extends CastBase {
	refundWandCharge(): void;
	grantRecharging(duration: number): void;
	rechargeArtifacts(amount: number): void;
	extendRechargeTurns(turns: number): void;
}

/** `FeatherFall`: consume the spell, cushion the hero's falls for the buff table's own
 *  duration, log the light line, spend the turn. */
export function useFeatherFallFlow(ctx: FeatherFallContext, instanceId?: string): void {
	if (!ctx.hasSpell('featherFall', instanceId)) return;
	ctx.consumeSpell('featherFall', instanceId);
	ctx.applyFeatherFall(BUFF_DURATION.featherFall);
	ctx.say(ctx.t('items.spells.featherfall.light'), 'positive');
	ctx.spendTurn();
}

/** `WildEnergy.affectTarget()` (tag `v3.3.8`): refund one wand charge, grant the
 * Recharging buff, bank four turns of every artifact hook at once, and extend the recharge
 * timer - the scene comment this moves carried a stale "no recharge clock" clause from
 * before `ArtifactRecharge` was ported; the body it describes always did both halves. */
export function useWildEnergyFlow(ctx: WildEnergyContext, instanceId?: string): void {
	if (!ctx.hasSpell('wildEnergy', instanceId)) return;
	ctx.consumeSpell('wildEnergy', instanceId);
	ctx.refundWandCharge();
	ctx.grantRecharging(BUFF_DURATION.recharging);
	//`WildEnergy.onCast()`: `ArtifactRecharge.chargeArtifacts(hero, 4f)` immediately, then the
	//buff is extended by 8 turns - so the cast banks four turns of every artifact hook at once
	//and leaves the timer running for the same hooks to be handed `min(1, left)` on later turns.
	ctx.rechargeArtifacts(4);
	ctx.extendRechargeTurns(wildEnergyRechargeTurns());
	// Java logs nothing on this cast (WildEnergy.affectTarget is sound and sprite only);
	// the recharge buff and the refunded wand charge are the feedback, so no line here either.
	ctx.spendTurn();
}

/** A carried armor the stylus picker can offer. The scene passes the live bag items,
 *  so writing the glyph here writes it on the real armor. */
export interface InscribableArmorView {
	id: string;
	quantity: number;
	instanceId?: string | undefined;
	identified?: boolean | undefined;
	cursed?: boolean | undefined;
	affix?: string | undefined;
}

/**
 * The ArcaneStylus inscribe flow, moved out of the scene behind this context the same
 * way - behavior-identical, with the scene keeping one builder plus the `useStylus`
 * adapter the item-use router calls. The armor scan and the glyph roll stay scene-side
 * where the tables live; the affix write lands on the live view, the way the beacon and
 * infusion flows write theirs.
 */
export interface StylusContext {
	hasStylus(instanceId?: string): boolean;
	consumeStylus(instanceId?: string): void;
	openPicker(title: string, entries: InscribableArmorView[], onPick: (entry: { id: string; instanceId?: string }) => void): void;
	armors(): InscribableArmorView[];
	findArmor(id: string, instanceId?: string): InscribableArmorView | null;
	rollGlyph(): string | null;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** A carried consumable the alchemize picker can offer. */
export interface EnergizableView {
	id: string;
	quantity: number;
	instanceId?: string | undefined;
	identified?: boolean | undefined;
}

/**
 * The Alchemize energize flow, moved out of the scene behind this context the same
 * way - behavior-identical, with the scene keeping one builder plus the `useAlchemize`
 * adapter the item-use router calls. The energy bank, the removals and the panel refresh
 * stay scene-side; the energy table itself is read here, the way the infusion pickers
 * read their own tables.
 */
export interface AlchemizeContext {
	hasSpell(id: string, instanceId?: string): boolean;
	consumeSpell(id: string, instanceId?: string): void;
	openPicker(title: string, entries: EnergizableView[], onPick: (entry: { id: string; instanceId?: string }) => void): void;
	energizables(): EnergizableView[];
	findEnergizable(id: string, instanceId?: string): EnergizableView | null;
	bankEnergy(amount: number): void;
	consumeTarget(id: string, instanceId?: string): void;
	markIdentified(target: EnergizableView): void;
	targetName(target: EnergizableView): string;
	refreshPanels(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `ArcaneStylus.onItemSelected()`: inscribe one identified, uncursed, glyphless armor
 *  with a rolled glyph. Java's selector offers every armor in the bag including equipped;
 *  this port's generic picker exposes carried payloads only. The roll draws from the same
 *  glyph table with the same uncursed odds; a miss simply ends the cast with the stylus
 *  kept, exactly like Java's null-glyph return. */
export function useStylusFlow(ctx: StylusContext, instanceId?: string): void {
	if (!ctx.hasStylus(instanceId)) return;
	const candidates = ctx.armors().filter((item) => item.quantity > 0
		&& (item.id === 'armor' || item.id === 'armorReward' || item.id === 'clothArmor'
			|| isClassArmorId(item.id)));
	if (candidates.length === 0) {
		ctx.say(ctx.t('items.stylus.identify'), 'negative');
		return;
	}
	ctx.openPicker(ctx.t('items.stylus.prompt'), candidates, (pick) => {
		const armor = ctx.findArmor(pick.id, pick.instanceId);
		if (!armor) return;
		if (!armor.identified) {
			ctx.say(ctx.t('items.stylus.identify'), 'negative');
			return;
		}
		if (armor.cursed || getCurse(armor.affix ?? '')) {
			ctx.say(ctx.t('items.stylus.cursed'), 'negative');
			return;
		}
		const glyph = ctx.rollGlyph();
		if (!glyph) return;
		ctx.consumeStylus(instanceId);
		armor.affix = glyph;
		ctx.say(ctx.t('items.stylus.inscribed'), 'positive');
	});
}

/** `Alchemize`'s in-game cast: `WndAlchemizeItem`/`WndEnergizeItem` scrap one carried
 * consumable into its `energyVal()` of alchemical energy and identify the scrapped item.
 * Java spends no time for this (`energize()` calls `hero.spend(-hero.cooldown())`), and this
 * port reaches the effect without going through `onAction`, so it likewise spends no turn -
 * the same shape `useStylus` uses. Java's window also offers a sell branch and an
 * "energize all" button; this direct picker grants one unit's energy. Java refuses to scrap
 * another Alchemize, and anything whose `energyVal()` is zero. */
export function useAlchemizeFlow(ctx: AlchemizeContext, instanceId?: string): void {
	if (!ctx.hasSpell('alchemize', instanceId)) return;
	const candidates = ctx.energizables().filter((item) => item.quantity > 0
		&& item.id !== 'alchemize'
		&& alchemyEnergyFor(item.id, item.identified ?? false) > 0);
	if (candidates.length === 0) {
		ctx.say(ctx.t('port.log.alchemize.nothing'), 'negative');
		return;
	}
	ctx.openPicker(ctx.t('items.spells.alchemize.prompt'), candidates, (pick) => {
		const target = ctx.findEnergizable(pick.id, pick.instanceId);
		if (!target) return;
		const energy = alchemyEnergyFor(target.id, target.identified ?? false);
		if (energy <= 0) return;
		const name = ctx.targetName(target);
		ctx.consumeTarget(target.id, target.instanceId);
		ctx.consumeSpell('alchemize', instanceId);
		ctx.bankEnergy(energy);
		//`energize()` identifies the item as it is consumed, even though it is gone.
		ctx.markIdentified(target);
		ctx.say(ctx.t('port.log.alchemize.energized', { item: name }), 'positive');
		ctx.refreshPanels();
	});
}

/** A carried weapon, armor, wand or missile stack an infusion picker can offer. The
 *  scene passes the live bag items, so setting fields here sets them on the real gear,
 *  the way the rose flow stats its ghost. */
export interface InfusableView {
	id: string;
	quantity: number;
	instanceId?: string | undefined;
	affix?: string | undefined;
	cursed?: boolean | undefined;
	level?: number | undefined;
	identified?: boolean | undefined;
	curseInfusionBonus?: boolean | undefined;
}

/** The seams both infusion pickers share: the carried spell, the picker, the bag. */
export interface InfusionBase {
	hasSpell(id: string, instanceId?: string): boolean;
	consumeSpell(id: string, instanceId?: string): void;
	openPicker(title: string, entries: InfusableView[], onPick: (entry: { id: string; instanceId?: string }) => void): void;
	infusables(): InfusableView[];
	findInfusable(id: string, instanceId?: string): InfusableView | null;
	itemName(item: InfusableView): string;
	refreshPanels(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/**
 * The CurseInfusion pick/curse flow, moved out of the scene behind this context the
 * same way - behavior-identical, with the scene keeping one builder plus the
 * `useCurseInfusion` adapter the item-use router calls. The curse pools, the draw and
 * the field writes are the module's; the missile-stack relabel and the shadow burst
 * stay scene-side.
 */
export interface CurseInfusionContext extends InfusionBase {
	relabelAfterInfusion(item: InfusableView): void;
	burstShadowUp(): void;
}

/** `MagicalInfusion.onItemSelected()`/`upgradeItem()` (tag `v3.3.8`): upgrade one
 * carried upgradable item while preserving an existing weapon enchant or armor glyph.
 * Java's spell opens the full equipment selector, including equipped gear and every
 * upgradable item type; this port's generic picker exposes carried weapon, armor, wand,
 * and ring payloads only. The bag item is upgraded through MWG's affix-aware operation,
 * which keeps the existing affix instead of rolling a new one. Java's wand-specific
 * preservation of `curseInfusionBonus` is represented by the payload's ordinary level and
 * cursed state; the separate temporary bonus has no independent field here. */
export function useMagicalInfusionFlow(ctx: InfusionBase, instanceId?: string): void {
	if (!ctx.hasSpell('magicalInfusion', instanceId)) return;
	const candidates = ctx.infusables().filter((item) => item.quantity > 0
		&& usableForMagicalInfusion(item));
	if (candidates.length === 0) {
		ctx.say(ctx.t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
		return;
	}
	ctx.openPicker(ctx.t('items.spells.magicalinfusion.inv_title'), candidates, (pick) => {
		const item = ctx.findInfusable(pick.id, pick.instanceId);
		if (!item) return;
		upgradeItem(item, 1, 'keep');
		ctx.consumeSpell('magicalInfusion', instanceId);
		ctx.say(ctx.t('port.log.magicalinfusion', { item: ctx.itemName(item) }), 'positive');
		ctx.refreshPanels();
	});
}

/** `CurseInfusion.onItemSelected()` (tag `v3.3.8`): curse one carried weapon or armor,
 * replacing its affix with a real negative pool entry, and grant the one-time infusion
 * upgrade marker. Java's selector also exposes equipped gear and MagesStaff/SpiritBow;
 * this port's generic picker exposes only carried weapon/armor/wand payloads, and its
 * upgrade systems have no separate temporary-bonus field, so the marker is represented by
 * one persistent level. Java removes that bonus when the curse is cleansed; this port's
 * cleanse path removes the curse affix but does not yet reverse the level marker. Both
 * omissions are recorded in PORT_COVERAGE.md rather than hidden in the action. */
export function useCurseInfusionFlow(ctx: CurseInfusionContext, instanceId?: string): void {
	if (!ctx.hasSpell('curseInfusion', instanceId)) return;
	//`CurseInfusion.usableOnItem`: an upgradable equipable, or a wand. The predicate covers the
	//missile stacks Java's `Weapon` reaches as well - `usableOnItem` is the same rule for both
	//infusion spells, so both pickers run it rather than hand-rolling the id list.
	const candidates = ctx.infusables().filter((item) => item.quantity > 0
		&& usableForCurseInfusion(item));
	if (candidates.length === 0) {
		ctx.say(ctx.t('items.spells.curseinfusion.inv_title'), 'negative');
		return;
	}
	ctx.openPicker(ctx.t('items.spells.curseinfusion.inv_title'), candidates, (pick) => {
		const item = ctx.findInfusable(pick.id, pick.instanceId);
		if (!item) return;
		if (item.id === 'wand') {
			item.cursed = true;
		} else {
			const pool = item.id === 'armorReward' ? getArmorCurses() : getWeaponCurses();
			const available = pool.filter((curse) => curse.id !== item.affix);
			const curse = Random.element(available.length > 0 ? available : pool) ?? pool[0];
			if (!curse) return;
			item.affix = curse.id;
			item.cursed = true;
		}
		if (!item.curseInfusionBonus) {
			item.curseInfusionBonus = true;
			item.level = (item.level ?? 0) + 1;
			//`Item.upgrade()` (not `MissileWeapon.upgrade()`): the infusion's level is the
			//ordinary one, so the stack is relabelled but its wear and count are left alone.
			ctx.relabelAfterInfusion(item);
		}
		ctx.consumeSpell('curseInfusion', instanceId);
		//`CurseInfusion.onItemSelected()`: five `ShadowParticle.UP` at the hero's own cell.
		//(Magical Infusion bursts nothing - it only plays READ.)
		ctx.burstShadowUp();
		ctx.say(ctx.t('port.log.curseinfusion', { item: ctx.itemName(item) }), 'negative');
		ctx.refreshPanels();
	});
}

/** `ReclaimTrap.affectTarget()` and `ReclaimedTrap` (tag `v3.3.8`): first target a visible,
 * active trap and store its class while recharging the hero's wand; a later cast redeploys
 * that class as a concealed active trap and consumes the spell. Java's trap reflection and
 * `reclaimed` flag collapse here to the closed `TrapKind` union. Trap activation itself stays
 * in `triggerTrapAt`; a persisted spent-cell set prevents a reclaimed/triggered trap from
 * firing again. Java's lightning/teleport presentation and Bestiary accounting are absent. */
export function useReclaimTrapFlow(ctx: ReclaimTrapContext, instanceId?: string): void {
	if (!ctx.hasSpell('reclaimTrap', instanceId)) return;
	const carrying = ctx.carriedTrap !== null;
	ctx.beginAim({
		range: 6,
		validate: (cell) => ctx.carriedTrap !== null
			? ctx.canPlaceTrap(cell.x, cell.y)
			: ctx.trapAt(cell.x, cell.y) !== null,
		onConfirm: (target) => {
			if (!carrying) {
				const kind = ctx.trapAt(target.x, target.y);
				if (!kind) {
					ctx.say(ctx.t('items.spells.reclaimtrap.no_trap'), 'negative');
				} else {
					ctx.takeTrap(target.x, target.y);
					ctx.say(ctx.t('port.log.reclaimtrap.stored'), 'positive');
				}
			} else {
				const kind = ctx.carriedTrap;
				if (!kind) return;
				ctx.placeTrap(target.x, target.y);
				ctx.consumeSpell('reclaimTrap', instanceId);
				ctx.say(ctx.t('port.log.reclaimtrap.placed'), 'positive');
			}
			ctx.refreshTiles();
			ctx.spendTurn();
		},
	});
}

/** `TelekineticGrab.affectTarget()` (tag `v3.3.8`): target a heap and pull its contents
 * into the hero's belongings, with the Java spell's cast cost capped at one turn. Java can
 * hold several items in one ordinary Heap; this port has one GroundItem per cell, so one
 * payload is the complete heap representation here. Java refuses chests and FOR_SALE heaps,
 * which this port represents with `chest`/`forSale`; the existing pickup workflow handles the
 * ordinary payload conversions (gold, stones, lit bombs, and generated inventory items). The
 * beacon projectile and pickup-delay animation are not represented by this scene's UI. */
export function useTelekineticGrabFlow(ctx: TelekineticGrabContext, instanceId?: string): void {
	if (!ctx.hasSpell('telekineticGrab', instanceId)) return;
	ctx.beginAim({
		// Java's CellSelector does not impose a spell-specific distance limit. The port's
		// renderer-neutral targeting contract requires a finite range; six cells is the
		// established ranged-item convention used by the other map-targeted actions.
		range: 6,
		onConfirm: (target) => {
			const ground = ctx.groundItemAt(target.x, target.y);
			if (!ground) ctx.say(ctx.t('items.spells.telekineticgrab.no_target'), 'negative');
			else if (ground.chest || ground.forSale) ctx.say(ctx.t('items.spells.telekineticgrab.cant_grab'), 'negative');
			else ctx.grabGroundItem(target.x, target.y);
			// Java's `onSpellused()` consumes the spell after every confirmed path, including
			// an empty or special heap. The pickup delay is capped at one actor tick there;
			// this port has whole hero turns, so every confirmed cast spends exactly one.
			ctx.consumeSpell('telekineticGrab', instanceId);
			ctx.spendTurn();
		},
	});
}

/**
 * The ReclaimTrap store/redeploy flow, moved out of the scene behind this context the
 * same way - behavior-identical, with the scene keeping one builder plus the
 * `useReclaimTrap` adapter the item-use router calls. The trap layer, the spent-cell
 * set, the carried class and the tile restitch stay scene-side; this flow only decides
 * them. The `carrying` snapshot is taken when the aimer opens; the validate re-reads
 * the live carried class, exactly as the scene code this flow moves did.
 */
export interface ReclaimTrapContext extends TargetedSpellAim {
	readonly carriedTrap: TrapKind | null;
	trapAt(x: number, y: number): TrapKind | null;
	canPlaceTrap(x: number, y: number): boolean;
	takeTrap(x: number, y: number): void;
	placeTrap(x: number, y: number): void;
	refreshTiles(): void;
}

/** `PhaseShift.affectTarget()` (tag `v3.3.8`): teleport the selected character to a
 * random free destination and paralyse non-boss characters for Java's standard duration.
 * Java also resets a hunting Mob to wandering and beckons it toward another destination;
 * this port has no separate Mob state/beckon system, so the normal post-teleport FOV update
 * supplies the equivalent loss of the current target. The spell's projectile and teleport
 * presentation are not represented by this scene's UI. */
export function usePhaseShiftFlow(ctx: PhaseShiftContext, instanceId?: string): void {
	if (!ctx.hasSpell('phaseShift', instanceId)) return;
	ctx.beginAim({
		//TargetedSpell uses CellSelector without a spell-specific range. The port's finite
		//targeting controller uses the established six-cell ranged-action convention.
		range: 6,
		validate: (cell) => ctx.creatureAt(cell.x, cell.y) !== null,
		onConfirm: (target) => {
			const creature = ctx.creatureAt(target.x, target.y);
			if (!creature) ctx.say(ctx.t('items.spells.phaseshift.no_target'), 'negative');
			else {
				const destination = ctx.randomFreeCellNear(target.x, target.y);
				if (destination) {
					const from = { x: target.x, y: target.y };
					ctx.moveCreatureTo(target.x, target.y, destination);
					ctx.playTeleportOn(creature, from, destination);
					//`PhaseShift.affectTarget`: a teleported mob is beckoned back to wandering
					//(`HUNTING -> WANDERING` plus a random destination) before the paralysis lands.
					if (!creature.isHero) ctx.calmCreature(creature);
					if (!ctx.isBossOrMiniboss(creature.kind)) ctx.afflictParalysis(creature);
				}
			}
			ctx.consumeSpell('phaseShift', instanceId);
			ctx.spendTurn();
		},
	});
}
