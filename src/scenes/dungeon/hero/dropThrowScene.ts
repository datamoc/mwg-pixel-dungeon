import type { DungeonScene } from '../../dungeonScene';
import { Roguelike } from 'mwg';
import { t } from '../../../i18n/index';
import type { GroundItem } from '../../../combat';
import { Terrain } from '../../../spdLevelGen/paintLevel';
import { groundKindForItem } from '../../../items/itemKinds';
import { showChoiceWindow } from '../../../ui/portWindows';
import { AREA_SHATTER_POTION_IDS, shatterPotionAt } from '../../../items/potionEffects';
import { canDropBagItem, canThrowBagItem, potionThrowsByDefault, shatterHasEffect, throwLanding, throwNeedsConfirm, MUST_THROW_POTIONS } from '../../../items/dropThrow';

/**
 * Scene side of the generic `Item.AC_DROP`/`AC_THROW` verbs (`items/dropThrow.ts`, tag `v3.3.8`): the
 * bag, the heap an item lands on (`Level.drop`, see `spawnGroundItem`), the aim and the turn clock.
 */
export const dropThrowMethods = {
	/** What the item window offers for a bag entry: Drop, Throw, and Drink for a known malevolent flask. */
	itemVerbs(this: DungeonScene, id: string, known: boolean): { drop: boolean; throw: boolean; drink: boolean } {
		return { drop: canDropBagItem(id), throw: canThrowBagItem(id), drink: potionThrowsByDefault(id, known) };
	},

	/**
	 * `Item.doDrop`: the WHOLE stack (`detachAll`) goes onto the hero's cell as a heap (stacking onto whatever
	 * lies there) and the action costs one turn (`TIME_TO_DROP`).
	 */
	dropBagItem(this: DungeonScene, id: string, instanceId?: string): void {
		const item = this.bag.find(id, instanceId);
		if (!item || !canDropBagItem(id)) return;
		const payload = { ...item } as NonNullable<GroundItem['item']>;
		this.bag.remove(id, item.quantity, item.instanceId);
		this.spawnGroundItem(groundKindForItem(payload, 'food'), this.hero.x, this.hero.y, payload);
		this.refreshInventoryPanel();
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
	},

	/**
	 * `Item.doThrow`: aim (six cells - the port's throw range, `TIME_TO_THROW` one turn), then one unit leaves the
	 * bag and `onThrow`s at the landing cell. A known potion that is neither must-throw nor can-throw asks first
	 * (`Potion.doThrow`).
	 */
	throwBagItem(this: DungeonScene, id: string, instanceId?: string): void {
		const item = this.bag.find(id, instanceId);
		if (!item || !canThrowBagItem(id)) return;
		const aim = (): void => {
			this.beginAiming({
				range: 6,
				validate: (cell) => this.level.inside(cell.x, cell.y) && (this.fov.isVisible(cell.x, cell.y) || this.fov.isExplored(cell.x, cell.y)),
				onConfirm: (cell) => this.finishThrow(id, item.instanceId, cell),
			});
		};
		if (throwNeedsConfirm(id, item.identified === true)) {
			showChoiceWindow(this.gameWindows, t('items.potions.potion.beneficial'), t('items.potions.potion.sure_throw'), [
				{ label: t('items.potions.potion.yes'), onPick: aim },
				{ label: t('items.potions.potion.no'), onPick: () => undefined },
			]);
			return;
		}
		aim();
	},

	finishThrow(this: DungeonScene, id: string, instanceId: string | undefined, target: { x: number; y: number }): void {
		const item = this.bag.find(id, instanceId);
		if (!item) return;
		//`Item.throwPos`: the projectile line stops on the first creature or before the first blocking cell.
		const path = Roguelike.traceLine({ x: this.hero.x, y: this.hero.y }, target);
		const landing = throwLanding(path,
			(x, y) => !this.level.inside(x, y) || (!this.level.passable(x, y) && !this.isChasmCell(x, y)),
			(x, y) => this.creatureAt(x, y) !== null);
		//`Item.detach(backpack)`: exactly one unit leaves the stack.
		const payload = { ...item, quantity: 1 } as NonNullable<GroundItem['item']>;
		this.bag.remove(id, 1, item.instanceId);
		if (id.startsWith('potion')) this.shatterThrownPotion(id, landing);
		else this.spawnGroundItem(groundKindForItem(payload, 'food'), landing.x, landing.y, payload);
		this.refreshInventoryPanel();
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
	},

	/**
	 * `Potion.onThrow` -> `shatter(cell)`: the flask breaks where it lands (a well or a pit takes it as an
	 * ordinary drop instead). `Potion.splash` first clears Fire at the cell; a malevolent potion then runs its
	 * own shatter (`shatterPotionAt`), anything else "splashes harmlessly" with SPD's own line when in view.
	 * Not modeled: `Level.pressCell(cell)` (a thrown flask setting off or disarming a trap), the potion talent
	 * triggers, and the splash particles/sound.
	 */
	shatterThrownPotion(this: DungeonScene, id: string, at: { x: number; y: number }): void {
		const raw = this.portedPaint?.map[this.level.index(at.x, at.y)];
		if (this.isChasmCell(at.x, at.y) || raw === Terrain.WELL) {
			this.spawnGroundItem('potion', at.x, at.y, { id, quantity: 1, identified: false, instanceId: this.newItemInstanceId('potion') });
			return;
		}
		this.fire.clear(at.x, at.y);
		if (shatterHasEffect(id)) {
			shatterPotionAt(this.potionEffectsContext(), id, at.x, at.y);
			return;
		}
		if (this.fov.isVisible(at.x, at.y)) this.say(t('items.potions.potion.shatter'));
	},

	/**
	 * `Heap.explode()` for one entry of a blasted heap: a bomb detonates, a potion is removed and SHATTERS where it
	 * lay (`Potion.shatter(pos)`, so a Toxic flask in the blast spills its gas), unique/equipment stand-ins
	 * survive and everything else is destroyed. The one place the three blast paths share.
	 * @returns whether the hero died (a chained bomb).
	 */
	explodeHeapEntry(this: DungeonScene, ground: GroundItem, chained: Set<string>): boolean {
		if (!this.groundItems.includes(ground)) return false;
		if (ground.kind === 'bomb' && ground.item) return this.detonateGroundBomb(ground, chained);
		if (ground.kind === 'potion' && ground.item?.id.startsWith('potion')) {
			this.removeGroundItem(ground);
			shatterPotionAt(this.potionEffectsContext(), ground.item.id, ground.x, ground.y);
			return false;
		}
		const protectedItem = ['armor', 'wand', 'ring', 'amulet', 'ankh', 'stylus'].includes(ground.kind);
		if (!protectedItem) this.removeGroundItem(ground);
		return false;
	},

	/** Drinking a known malevolent potion asks first (`Potion.execute(AC_DRINK)`'s `harmful` window). */
	drinkBagPotion(this: DungeonScene, id: string, instanceId?: string): void {
		if (!MUST_THROW_POTIONS.has(id) || !AREA_SHATTER_POTION_IDS.has(id)) {
			this.useItemById(id, instanceId);
			return;
		}
		showChoiceWindow(this.gameWindows, t('items.potions.potion.harmful'), t('items.potions.potion.sure_drink'), [
			{ label: t('items.potions.potion.yes'), onPick: () => this.useItemById(id, instanceId) },
			{ label: t('items.potions.potion.no'), onPick: () => undefined },
		]);
	},
};
