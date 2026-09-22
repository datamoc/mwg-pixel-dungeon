import { MWL_WAND_CHARGE_RULES, MWL_WAND_DAMAGE_RULES, MWL_WAND_DEFINITIONS, MWL_WAND_RANGE_RULES } from '../mwlContent';
import { Roguelike, Random } from 'mwg';
import { planDisintegration } from '../simulation/disintegration';
import { preservationChance } from '../talentEffects';
import { SOLID } from '../dungeonConstants';
import type { Creature, Step } from '../combat';

/** Wand identity and pure shared rules.
 *
 * Authored identity/metadata belongs in MWL; this module owns the executable category
 * boundary. Scene code may use these values to select a target and then delegate the actual
 * world mutation to a scene-specific effect. It must not become the catalogue for items.
 */
export type WandType =
	| 'magicMissile' | 'frost' | 'fireblast' | 'lightning' | 'corrosion' | 'corruption'
	| 'disintegration' | 'blastWave' | 'livingEarth' | 'prismaticLight' | 'regrowth'
	| 'transfusion' | 'warding';

/** Executable wand categories are derived from the MWL catalogue; this avoids a second content
 * list in TypeScript while retaining a closed union for the effect dispatcher. Exported for
 * `CursedWand.RandomWand`'s uniform pick over `Generator.Category.WAND` (`simulation/cursedWand.ts`'s
 * scoping note; the port's roster matches Java's 13-class real wand list one for one). */
export const WAND_TYPES: readonly WandType[] = [...new Set(MWL_WAND_DEFINITIONS.map((definition) => definition.type))]
	.filter((type): type is WandType => [
		'magicMissile', 'frost', 'fireblast', 'lightning', 'corrosion', 'corruption', 'disintegration',
		'blastWave', 'livingEarth', 'prismaticLight', 'regrowth', 'transfusion', 'warding',
	].includes(type));
const WAND_SOURCE_TYPES: ReadonlyMap<string, WandType> = new Map(MWL_WAND_DEFINITIONS.map((definition) => {
	if (!WAND_TYPES.includes(definition.type as WandType)) throw new Error(`MWL wand has unknown executable type: ${definition.type}`);
	return [definition.sourceClass.toLowerCase(), definition.type as WandType];
}));
if (WAND_SOURCE_TYPES.size !== MWL_WAND_DEFINITIONS.length || WAND_SOURCE_TYPES.size !== WAND_TYPES.length) {
	throw new Error('MWL wand definitions contain duplicate or missing source classes');
}

export function wandTypeFromSource(sourceClass?: string): WandType | null {
	if (!sourceClass) return null;
	return WAND_SOURCE_TYPES.get(sourceClass.toLowerCase()) ?? null;
}

/** Load-time guard for the persisted imbue class. */
export function isWandType(value: unknown): value is WandType {
	return typeof value === 'string' && (WAND_TYPES as readonly string[]).includes(value);
}

/** `WandOfDisintegration.distance()`; other current wand families use the scene's normal range. */
export function wandTargetRange(type: WandType, level: number): number {
	const rule = MWL_WAND_RANGE_RULES[type] ?? MWL_WAND_RANGE_RULES.default;
	if (!rule) throw new Error(`MWL wand range rule is missing: ${type}`);
	return rule.base + rule.perLevel * Math.max(0, level);
}

/** `Wand.initialCharges()` (`Wand.java`, tag `v3.3.8`): 3 for Magic Missile, 2 for
 * every other executable class. Spare carried wands arrive full at this count. */
export function wandInitialCharges(type: WandType): number {
	return type === 'magicMissile' ? 3 : 2;
}

/**
 * Absorb-vs-spare on a ground wand pickup. The shared pool + single scalar can
 * only ever fire one class, so a pickup of the wielded class (or of unknown
 * class, which is invalid identity rather than a new wand) absorbs exactly as
 * before - pool reset, one stackable entry - while a pickup of any *other*
 * class lands as a spare entry with its own identity and charge state instead
 * of being silently destroyed. That spare is what `WildMagic` fires and
 * `MagesStaff.imbueWand()` chooses among.
 */
export function resolveWandPickup(wielded: WandType | null, ground: WandType | null): 'absorb' | 'spare' {
	if (ground === null || ground === wielded) return 'absorb';
	return 'spare';
}

/** Imbued-staff holder by scene: the Mage's staff starts on Magic Missile
 * (`HeroClass.initMage()`: `new MagesStaff(new WandOfMagicMissile())`), and
 * `ElementalBlast` reads exactly this class back (`staff.wandClass()`). A
 * dungeonScene.ts field is out of the question (that file sits exactly at its
 * line budget), so the run state lives here behind the scene key - the same
 * shape as the chasm-jump latch (`simulation/chasmJump.ts`). */
const staffImbueByScene = new WeakMap<object, WandType>();

export function staffImbueFor(scene: object): WandType {
	return staffImbueByScene.get(scene) ?? 'magicMissile';
}

export function setStaffImbue(scene: object, type: WandType): void {
	staffImbueByScene.set(scene, type);
}

/**
 * `MagesStaff.imbueWand()`'s level sync (`MagesStaff.java`, tag `v3.3.8`):
 * the staff takes the higher of the two true levels, plus one of its own when
 * the incoming wand meets or beats a positive staff level.
 */
export function imbueStaffLevel(staffLevel: number, wandLevel: number): number {
	const safeStaff = Math.max(0, staffLevel);
	const safeWand = Math.max(0, wandLevel);
	let target = Math.max(safeStaff, safeWand);
	if (safeWand >= safeStaff && safeStaff > 0) target += 1;
	return target;
}

/** `Wand.chargesPerCast()`; only Regrowth and Fireblast scale cost with current charges. */
export function wandChargesPerCast(type: WandType, currentCharges: number): number {
	const rule = MWL_WAND_CHARGE_RULES[type] ?? MWL_WAND_CHARGE_RULES.default;
	if (!rule) throw new Error(`MWL wand charge rule is missing: ${type}`);
	if (rule.ratio === 0) return rule.min;
	return Math.min(rule.max, Math.max(rule.min, Math.ceil(currentCharges * rule.ratio)));
}

/** Damage bounds from the simple `WandOf*.onZap()` rolls in SPD tag v3.3.8.
 * MWL owns the constants; this evaluator remains TypeScript because the level is live state.
 * Fireblast has a charge-dependent roll and is intentionally handled by its effect adapter. */
export function wandDamageRange(type: WandType, level: number): [number, number] {
	const rule = MWL_WAND_DAMAGE_RULES[type];
	if (!rule) throw new Error(`MWL wand damage rule is missing: ${type}`);
	const safeLevel = Math.max(0, level);
	return [rule.minBase + rule.minPerLevel * safeLevel, rule.maxBase + rule.maxPerLevel * safeLevel];
}

/** `WandOfLivingEarth.damageRoll()`: `NormalIntRange(2, 4 + scalingDepth()/2)` - the
 * only wand roll that scales with depth instead of wand level, so it cannot live in the
 * level-parameterized MWL damage table (which carries no livingEarth row). `depth` is the
 * caller's `this.depth`, the usual `scalingDepth()` stand-in; the division is Java's
 * integer division. The caller rolls `normalRange` over these bounds like every other
 * wand (the port's standing NormalIntRange simplification). */
export function livingEarthZapRange(depth: number): [number, number] {
	return [2, 4 + Math.floor(Math.max(1, depth) / 2)];
}

/** Scene services used by the disintegration wand; targeting remains with the scene. */
export interface DisintegrationWandScene {
	level: Parameters<typeof Roguelike.ballistica>[0];
	hero: Creature;
	weaponLevel: number;
	wandCharges: { current: number; spend(amount: number): boolean; refund(amount: number): void };
	creatures: Creature[];
	creatureAt(x: number, y: number): Creature | null;
	isFireFlammableTerrain(x: number, y: number): boolean;
	burnFireTerrain(x: number, y: number): void;
	talentRank(id: string): number;
	grantHeroShield(amount: number, cap: number): number;
	fadeMirrorOnDamage(target: Creature, damage: number): boolean;
	showDamage(target: Creature, damage: number): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	kill(target: Creature): void;
	spendHeroTurn(turnCost: number): void;
	getAttackTurnCostMod(): number;
	message(target: Creature, damage: number): string;
}

export function confirmDisintegrationWand(scene: DisintegrationWandScene, target: Step, chargesPerCast: number): void {
	const lastCharge = scene.wandCharges.current === 1;
	if (!scene.wandCharges.spend(chargesPerCast)) return;
	const preservation = preservationChance(scene.talentRank('wand_preservation'));
	if (preservation > 0 && Random.chance(preservation)) scene.wandCharges.refund(1);
	if (lastCharge && scene.talentRank('backup_barrier') > 0) {
		scene.grantHeroShield(scene.talentRank('backup_barrier') === 1 ? 3 : 5, scene.hero.maxHp);
	}
	useDisintegrationWand(scene, target);
	scene.spendHeroTurn(scene.getAttackTurnCostMod());
}

export function useDisintegrationWand(scene: DisintegrationWandScene, target: Step): void {
	//WandOfDisintegration.java's collisionProperties() is WONT_STOP: the beam passes through
	//walls, still counting each cell (and its terrain/victim bonuses) toward the effect.
	const path = Roguelike.ballistica(scene.level, { x: scene.hero.x, y: scene.hero.y }, target, { stop: 'none' }).cells.slice(1);
	const creatures = path.map((cell) => scene.creatureAt(cell.x, cell.y));
	const plan = planDisintegration(scene.weaponLevel, path.map((cell, index) => {
		const victim = creatures[index];
		return {
			solid: scene.level.get(cell.x, cell.y) === SOLID,
			flammable: scene.isFireFlammableTerrain(cell.x, cell.y),
			victim: victim !== null,
			//`WandOfDisintegration.onZap()` uses Actor.findChar, so NPCs count as beam
			//victims too; only an undiscovered passive Mob is filtered by Java.
			eligibleVictim: victim !== null && victim.hp > 0,
		};
	}));
	for (const index of plan.flammableCells) {
		const cell = path[index];
		if (cell) scene.burnFireTerrain(cell.x, cell.y);
	}
	for (const index of plan.victimCells) {
		const victim = creatures[index];
		if (!victim || victim.hp <= 0) continue;
		const damage = Random.normalRange(2 + plan.effectiveLevel, 8 + 4 * plan.effectiveLevel);
		victim.hp -= damage;
		if (scene.fadeMirrorOnDamage(victim, damage)) continue;
		scene.showDamage(victim, damage);
		victim.sleeping = false;
		scene.say(scene.message(victim, damage), 'positive');
		if (victim.hp <= 0 && !victim.isAlly) scene.kill(victim);
	}
}
