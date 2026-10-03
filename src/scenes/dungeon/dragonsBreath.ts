import { Roguelike } from 'mwg';
import { addBuff, reigniteBuff, type Step } from '../../combat';
import { markPotionKindsKnown } from '../../items/potionKnow';
import { coneCells } from '../../mechanics/cone';
import type { DungeonScene } from '../dungeonScene';

/**
 * `PotionOfDragonsBreath` (`items/potions/exotic/PotionOfDragonsBreath.java`, tag `v3.3.8`): choose a cell, then a 60-degree, 6-cell fire cone
 * from the hero toward it. Every cone cell except the hero's own opens a door and is seeded with 5 Fire - except cells next to the hero
 * that are neither flammable nor solid, which are held back and only ignite a flammable cell beside them that is farther from the hero.
 * Any character in the cone (allies too) is ignited and crippled for 5. The potion is spent when the cell is chosen; backing out keeps
 * it (Java asks for confirmation and consumes an unidentified one), and the turn is spent when the cone fires.
 */
export function startDragonsBreath(scene: DungeonScene, potionInstanceId: string | undefined): boolean {
	scene.beginAiming({
		range: 12,
		requireLineOfSight: false,
		shape: { kind: 'line' },
		onConfirm: (target) => {
			scene.bag.remove('potionDragonsBreath', 1, potionInstanceId);
			markPotionKindsKnown(scene, ['potionDragonsBreath']);
			fireCone(scene, target);
			scene.actionSpentTurn = true;
			scene.spendHeroTurn(1);
		},
	});
	return false;
}

function fireCone(scene: DungeonScene, target: Step): void {
	const { hero, level } = scene;
	const cone = coneCells({
		source: { x: hero.x, y: hero.y }, target, degrees: 60, maxDistance: 6,
		width: level.width, height: level.height, trace: (from, to) => scene.coneRay(from, to),
	});
	const heldBack: Step[] = [];
	for (const cell of cone.cells) {
		if (cell.x === hero.x && cell.y === hero.y) continue;
		if (scene.doors.isDoor(cell.x, cell.y) && !scene.doors.isOpen(cell.x, cell.y) && !scene.secrets.isSecret(cell.x, cell.y)) scene.doors.open(cell.x, cell.y);
		const adjacent = Roguelike.chebyshevDistance(cell, hero) <= 1;
		if (adjacent && !scene.isFireFlammableTerrain(cell.x, cell.y)) {
			heldBack.push(cell);
			scene.burnFireContents(cell.x, cell.y);
		} else scene.fire.seed(cell.x, cell.y, 5);
		const occupant = scene.creatureAt(cell.x, cell.y);
		if (occupant) {
			reigniteBuff(occupant, 'burning');
			addBuff(occupant, 'cripple', 5);
		}
	}
	//cells beside a held-back cell, flammable and farther from the hero, so a point-blank cast still lights barricades and shelves
	const from = (c: Step): number => (c.x - hero.x) ** 2 + (c.y - hero.y) ** 2;
	for (const cell of heldBack) {
		for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
			const at = { x: cell.x + dx, y: cell.y + dy };
			if (!level.inside(at.x, at.y) || from(at) <= from(cell) || !scene.isFireFlammableTerrain(at.x, at.y) || scene.fire.volumeAt(at.x, at.y) > 0) continue;
			scene.fire.seed(at.x, at.y, 5);
		}
	}
}
