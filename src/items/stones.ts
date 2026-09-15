import { Random, Roguelike, type Actors } from 'mwg';
import { addBuff, type Creature, type Step } from '../combat';
import { t } from '../i18n';
import { mwlItemEffectValue } from '../mwlContent';

export interface StonePickerEntry {
	id: string;
	instanceId?: string;
	quantity: number;
	identified?: boolean;
	level?: number;
	affix?: string;
	cursed?: boolean;
	cursedKnown?: boolean;
}

export interface StoneContext {
	readonly bag: Actors.Inventory;
	readonly hero: Creature;
	readonly level: { width: number; height: number; passable(x: number, y: number): boolean };
	readonly creatureAt: (x: number, y: number) => Creature | null;
	readonly nearestVisibleEnemy: (range: number) => Creature | null;
	readonly isChasmCell: (x: number, y: number) => boolean;
	readonly spawnSheep: (at: Step) => void;
	readonly beginAiming: (options: {
		range: number;
		shape?: { kind: 'burst'; radius: number };
		validate?: (cell: Step) => boolean;
		onConfirm: (cell: Step) => void;
	}) => void;
	readonly openAugmentChoice: () => void;
	readonly moveHero: (target: Step) => void;
	readonly revealClairvoyance: (center: Step, distance: number) => void;
	readonly creatures: Creature[];
	readonly depth: number;
	readonly wandCharges: { refund(amount: number): void };
	readonly absorbHeroDamage: (amount: number) => number;
	readonly showDamage: (target: Creature, amount: number) => void;
	readonly isFlammableTerrain: (x: number, y: number) => boolean;
	readonly burnFlammableTerrain: (x: number, y: number) => void;
	readonly explodeGroundItem: (x: number, y: number) => void;
	readonly kill: (target: Creature) => void;
	readonly openItemPicker: (title: string, items: StonePickerEntry[], onPick: (entry: StonePickerEntry) => void) => void;
	readonly rollAffix: (kind: 'weapon' | 'armor') => string | undefined;
	readonly curseOf: (affix: string) => string | undefined;
	readonly identify: (item: StonePickerEntry) => void;
	readonly potionKinds: string[];
	readonly scrollKinds: string[];
	readonly ringKinds: string[];
	get intuitionTracker(): boolean;
	set intuitionTracker(value: boolean);
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
}

const stoneValue = (effect: string): number => mwlItemEffectValue('runestones', effect);

/** `PathFinder.buildDistanceMap(center, explodable, radius)` with Java's 8-neighbour order.
 * The compact port's equivalent explodable predicate is `passable || flammable`. */
function blastCells(scene: StoneContext, center: Step, radius: number): Set<number> {
	const cells = new Set<number>();
	const queue: Step[] = [center];
	const distance = new Map<number, number>();
	const start = center.y * scene.level.width + center.x;
	distance.set(start, 0);
	while (queue.length > 0) {
		const current = queue.shift()!;
		const currentCell = current.y * scene.level.width + current.x;
		const currentDistance = distance.get(currentCell)!;
		cells.add(currentCell);
		if (currentDistance >= radius) continue;
		for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) {
			const next = { x: current.x + dx, y: current.y + dy };
			if (next.x < 0 || next.y < 0 || next.x >= scene.level.width || next.y >= scene.level.height) continue;
			const nextCell = next.y * scene.level.width + next.x;
			if (distance.has(nextCell) || (!scene.level.passable(next.x, next.y) && !scene.isFlammableTerrain(next.x, next.y))) continue;
			distance.set(nextCell, currentDistance + 1);
			queue.push(next);
		}
	}
	return cells;
}

/** StoneOfFlock.activate(): fill the hero-centred radius used by this port's no-picker path. */
export function useStoneOfFlock(scene: StoneContext, instanceId?: string): void {
	scene.bag.remove('stoneOfFlock', 1, instanceId);
	let count = 0;
	const radius = stoneValue('flockRadius');
	for (let y = Math.max(0, scene.hero.y - radius); y <= Math.min(scene.level.height - 1, scene.hero.y + radius); y++) {
		for (let x = Math.max(0, scene.hero.x - radius); x <= Math.min(scene.level.width - 1, scene.hero.x + radius); x++) {
			const at = { x, y };
			if (Roguelike.chebyshevDistance(scene.hero, at) > radius || !scene.level.passable(x, y)
				|| scene.isChasmCell(x, y) || scene.creatureAt(x, y)) continue;
			scene.spawnSheep(at);
			count++;
		}
	}
	scene.say(t('port.log.stoneflock', { count }), 'positive');
}

/** StoneOfAggression.activate(): apply the ordinary or boss-duration aggression buff. */
export function useStoneOfAggression(scene: StoneContext, instanceId?: string): void {
	scene.bag.remove('stoneOfAggression', 1, instanceId);
	const target = scene.nearestVisibleEnemy(stoneValue('targetRange'));
	if (!target) {
		scene.say(t('port.log.stonewasted'), 'negative');
		return;
	}
	addBuff(target, 'aggression');
	if (target.boss === true || target.miniboss === true) target.buffs.aggression = stoneValue('aggressionBossDuration');
	scene.say(t('port.log.stoneaggression', { target: target.name }), 'positive');
}

/** StoneOfAugmentation: consume the stone and open the scene's augment-choice UI. */
export function useStoneOfAugmentation(scene: StoneContext, instanceId?: string): void {
	scene.bag.remove('stoneOfAugmentation', 1, instanceId);
	scene.openAugmentChoice();
}

/** StoneOfFear.activate(): aim at one hostile creature and apply Terror on confirmation. */
export function useStoneOfFear(scene: StoneContext, instanceId?: string): void {
	scene.beginAiming({
		range: stoneValue('targetRange'),
		onConfirm: (target) => {
			const hit = scene.creatureAt(target.x, target.y);
			if (hit && !hit.isHero && !hit.isNPC && hit.hp > 0) {
				scene.bag.remove('stoneOfFear', 1, instanceId);
				addBuff(hit, 'terror');
				scene.say(t('port.log.stonefear', { target: hit.name }), 'positive');
			} else scene.say(t('port.log.stonewasted'), 'negative');
		},
	});
}

/** StoneOfDeepSleep.activate(): aim at one hostile creature and put it to sleep. */
export function useStoneOfDeepSleep(scene: StoneContext, instanceId?: string): void {
	scene.beginAiming({
		range: stoneValue('targetRange'),
		onConfirm: (target) => {
			const hit = scene.creatureAt(target.x, target.y);
			if (hit && !hit.isHero && !hit.isNPC && hit.hp > 0) {
				scene.bag.remove('stoneOfDeepSleep', 1, instanceId);
				hit.sleeping = true;
				scene.say(t('port.log.stonesleep', { target: hit.name }), 'positive');
			} else scene.say(t('port.log.stonewasted'), 'negative');
		},
	});
}

/** StoneOfBlink.activate(): aim at a free cell and move the hero there. */
export function useStoneOfBlink(scene: StoneContext, instanceId?: string): void {
	scene.beginAiming({
		range: stoneValue('targetRange'),
		validate: (cell) => scene.level.passable(cell.x, cell.y) && !scene.creatureAt(cell.x, cell.y),
		onConfirm: (target) => {
			scene.bag.remove('stoneOfBlink', 1, instanceId);
			delete scene.hero.buffs['roots'];
			scene.moveHero(target);
			scene.say(t('items.scrolls.scrollofteleportation.tele'), 'positive');
		},
	});
}

/** StoneOfClairvoyance.activate(): reveal the aimed cell's local map and secrets. */
export function useStoneOfClairvoyance(scene: StoneContext, instanceId?: string): void {
	scene.beginAiming({
		range: stoneValue('targetRange'),
		onConfirm: (center) => {
			scene.bag.remove('stoneOfClairvoyance', 1, instanceId);
		scene.revealClairvoyance(center, stoneValue('clairvoyanceDistance'));
		scene.say(t('port.log.stoneclairvoyance'), 'positive');
	},
	});
}

/** StoneOfShock.activate(): paralyze nearby creatures and refund one charge per hit. */
export function useStoneOfShock(scene: StoneContext, instanceId?: string): void {
	scene.beginAiming({
		range: stoneValue('targetRange'),
		shape: { kind: 'burst', radius: stoneValue('shockBurstRadius') },
		onConfirm: (center) => {
			scene.bag.remove('stoneOfShock', 1, instanceId);
			let hits = 0;
			for (const creature of scene.creatures) {
				if (creature.isHero || creature.isNPC || Roguelike.chebyshevDistance(center, creature) > stoneValue('shockBurstRadius')) continue;
				addBuff(creature, 'paralysis');
				hits++;
			}
			if (hits > 0) {
				scene.wandCharges.refund(stoneValue('shockBaseRefund') + hits);
				scene.say(t('port.log.stoneshock', { count: hits }), 'positive');
			} else scene.say(t('port.log.stonewasted'), 'negative');
		},
	});
}

/** StoneOfBlast.activate(): apply the conjured-bomb blast to every nearby creature. */
export function useStoneOfBlast(scene: StoneContext, instanceId?: string): void {
	scene.beginAiming({
		range: stoneValue('targetRange'),
		shape: { kind: 'burst', radius: stoneValue('blastRadius') },
		onConfirm: (center) => {
			scene.bag.remove('stoneOfBlast', 1, instanceId);
			const radius = stoneValue('blastRadius');
			const affected = blastCells(scene, center, radius);
			// `StoneOfBlast` creates a destructive `ConjuredBomb`; Java destroys
			// every flammable cell in the affected path before applying damage.
			for (const cell of affected) {
				const x = cell % scene.level.width;
				const y = Math.floor(cell / scene.level.width);
				if (scene.isFlammableTerrain(x, y)) scene.burnFlammableTerrain(x, y);
				scene.explodeGroundItem(x, y);
			}
			let hits = 0;
			for (const creature of [...scene.creatures]) {
				const cell = creature.y * scene.level.width + creature.x;
				if (creature.isNPC || creature.hp <= 0 || !affected.has(cell)) continue;
				let damage = Math.max(0, Random.normalRange(
					stoneValue('blastMinBase') + stoneValue('blastMinPerDepth') * scene.depth,
					stoneValue('blastMaxBase') + stoneValue('blastMaxPerDepth') * scene.depth,
				));
				if (creature.isHero) {
					damage = scene.absorbHeroDamage(damage);
					creature.hp -= damage;
					scene.showDamage(creature, damage);
					if (creature.hp <= 0) scene.kill(creature);
				} else {
					damage = Math.max(0, damage - Random.normalRange(creature.armor[0], creature.armor[1]));
					creature.hp -= damage;
					scene.showDamage(creature, damage);
					creature.sleeping = false;
					if (creature.hp <= 0) scene.kill(creature);
				}
				hits++;
			}
			scene.say(t('port.log.stoneblast', { count: hits }), hits > 0 ? 'positive' : 'negative');
		},
	});
}

/** StoneOfEnchantment.onItemSelected(): pick bag gear and apply a good affix. */
export function useStoneOfEnchantment(scene: StoneContext, instanceId?: string): void {
	const candidates = scene.bag.items.filter((item) => item.quantity > 0
		&& (item.id === 'weaponReward' || item.id === 'armorReward')) as StonePickerEntry[];
	if (candidates.length === 0) {
		scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
		return;
	}
	scene.openItemPicker(t('items.stones.stoneofenchantment.inv_title'), candidates, (pick) => {
		const live = scene.bag.items.find((item) => item.quantity > 0 && item.id === pick.id
			&& (item.instanceId ?? undefined) === (pick.instanceId ?? undefined)
			&& (item.id === 'weaponReward' || item.id === 'armorReward')) as StonePickerEntry | undefined;
		if (!live) {
			scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		const rolled = scene.rollAffix(live.id === 'weaponReward' ? 'weapon' : 'armor');
		if (!rolled) {
			scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		scene.bag.remove('stoneOfEnchantment', 1, instanceId);
		live.affix = rolled;
		scene.say(t(live.id === 'weaponReward' ? 'items.stones.stoneofenchantment.weapon' : 'items.stones.stoneofenchantment.armor'), 'positive');
	});
}

/** StoneOfDetectMagic.onItemSelected(): identify curse knowledge and report the item magic. */
export function useStoneOfDetectMagic(scene: StoneContext, instanceId?: string): void {
	const isGear = (item: StonePickerEntry): boolean =>
		item.id === 'weaponReward' || item.id === 'armorReward' || item.id.startsWith('ring_') || item.id === 'wand';
	const candidates = scene.bag.items.filter((item) => item.quantity > 0 && isGear(item as StonePickerEntry)
		&& (!(item as StonePickerEntry).identified || !(item as StonePickerEntry).cursedKnown)) as StonePickerEntry[];
	if (candidates.length === 0) {
		scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
		return;
	}
	scene.openItemPicker(t('port.stone.detectmagic.inv_title'), candidates, (pick) => {
		const live = scene.bag.items.find((item) => item.quantity > 0 && item.id === pick.id
			&& (item.instanceId ?? undefined) === (pick.instanceId ?? undefined)
			&& isGear(item as StonePickerEntry)
			&& (!(item as StonePickerEntry).identified || !(item as StonePickerEntry).cursedKnown)) as StonePickerEntry | undefined;
		if (!live) {
			scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		live.cursedKnown = true;
		const negative = !!live.cursed || scene.curseOf(live.affix ?? '') !== undefined;
		const positive = (live.level ?? 0) > 0 || (!!live.affix && scene.curseOf(live.affix) === undefined);
		scene.bag.remove('stoneOfDetectMagic', 1, instanceId);
		scene.say(t(!positive && !negative ? 'port.stone.detectmagic.detected_none'
			: positive && negative ? 'port.stone.detectmagic.detected_both'
			: positive ? 'port.stone.detectmagic.detected_good'
			: 'port.stone.detectmagic.detected_bad'), 'positive');
	});
}

/** StoneOfIntuition: choose an unknown potion, scroll, or ring and guess its class. */
export function useStoneOfIntuition(scene: StoneContext, instanceId?: string): void {
	const isGuessable = (id: string): boolean =>
		(id.startsWith('potion') && id !== 'potion' && scene.potionKinds.includes(id))
		|| (id.startsWith('scroll') && id !== 'scroll') || id.startsWith('ring_');
	const candidates = scene.bag.items.filter((item) => item.quantity > 0 && !item.identified && isGuessable(item.id)) as StonePickerEntry[];
	if (candidates.length === 0) {
		scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
		return;
	}
		scene.openItemPicker(t('items.stones.stoneofintuition.inv_title'), candidates, (pick) => {
		const live = scene.bag.items.find((item) => item.quantity > 0 && !item.identified && item.id === pick.id
			&& (item.instanceId ?? undefined) === (pick.instanceId ?? undefined) && isGuessable(item.id)) as StonePickerEntry | undefined;
		if (!live) {
			scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		const known = new Set(scene.bag.items.filter((item) => item.identified).map((item) => item.id));
		const deck = live.id.startsWith('potion') ? scene.potionKinds
			: live.id.startsWith('scroll') ? scene.scrollKinds : scene.ringKinds;
		const unknown = deck.filter((id) => !known.has(id));
		if (unknown.length === 0) {
			scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		scene.openItemPicker(t('items.stones.stoneofintuition$wndguess.text'), unknown.map((id) => ({ id, identified: true, quantity: 1 })), (guess) => {
			const target = scene.bag.items.find((item) => item.quantity > 0 && !item.identified && item.id === live.id
				&& (item.instanceId ?? undefined) === (live.instanceId ?? undefined)) as StonePickerEntry | undefined;
			if (!target) {
				scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
				return;
			}
			if (guess.id === target.id) {
				for (const same of scene.bag.items.filter((item) => item.id === target.id) as StonePickerEntry[]) scene.identify(same);
				scene.say(t('items.stones.stoneofintuition$wndguess.correct'), 'positive');
			} else scene.say(t('items.stones.stoneofintuition$wndguess.incorrect'), 'negative');
			if (!scene.intuitionTracker) scene.intuitionTracker = true;
			else {
				scene.bag.remove('stoneOfIntuition', 1, instanceId);
				scene.intuitionTracker = false;
			}
		});
	});
}
