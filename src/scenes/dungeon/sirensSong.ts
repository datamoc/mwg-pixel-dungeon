import { addBuff, type Creature } from '../../combat';
import { t } from '../../i18n/index';
import { MONSTERS, type AnyMonsterId } from '../../monsters';
import { NEGATIVE_BUFFS, corruptionImmune, type BuffId } from '../../simulation/buffs';
import { empoweringScrollsCharges } from '../../talentEffects';
import type { DungeonScene } from '../dungeonScene';

/**
 * `ScrollOfSirensSong.doRead()` and its cell targeter (`items/scrolls/exotic/ScrollOfSirensSong.java`, tag `v3.3.8`): pick a non-allied mob;
 * every OTHER non-ally mob in view is charmed (`Charm.DURATION`) and the picked one becomes an `Enthralled` ally - or is charmed too when it is
 * immune to `AllyBuff` (BOSS / MINIBOSS / STATIC kinds, champions' immunity, the ally summons). An `Enthralled` conversion goes through
 * `AllyBuff.affectAndLoot`, which pays out the kill's XP at once. Choosing no mob cancels with the `cancel` line and keeps the scroll.
 *
 * Stated gaps: the conversion is this port's ally model (the same stand-in `WandOfCorruption` and the Corrupting enchantment use - healed,
 * negative buffs cleared, `isAlly`), the `Enthralled` buff itself and its heart icon do not exist, and `affectAndLoot`'s loot roll, kill
 * statistics and Monk energy are not run (the loot table lives inside `kill()`); only the XP is granted. The turn is spent when the scroll
 * is used.
 */
export function startSirensSong(scene: DungeonScene, scrollInstanceId: string | undefined, consume = true): boolean {
	scene.beginAiming({
		range: 12,
		requireLineOfSight: false,
		onConfirm: (cell) => {
			const target = scene.creatureAt(cell.x, cell.y);
			const mob = target && !target.isHero && !target.isNPC && !target.isAlly && target.hp > 0 ? target : null;
			if (!mob) {
				scene.say(t('items.scrolls.exotic.scrollofsirenssong.cancel'), 'warning');
				return;
			}
			if (consume) {
				scene.bag.remove('scrollSirensSong', 1, scrollInstanceId);
				scene.onScrollUsed();
				scene.armRecallInscription('ScrollOfSirensSong');
			}
			if (scene.heroClass === 'mage' && scene.talentRank('empowering_scrolls') > 0) scene.empoweredZaps = empoweringScrollsCharges(scene.talentRank('empowering_scrolls'));
			for (const other of [...scene.creatures]) {
				if (other === mob || other.isHero || other.isNPC || other.isAlly || other.hp <= 0 || !scene.fov.isVisible(other.x, other.y)) continue;
				charm(scene, other);
			}
			if (corruptionImmune(mob)) charm(scene, mob);
			else enthrall(scene, mob);
			scene.actionSpentTurn = true;
			scene.spendHeroTurn(1);
		},
	});
	return false;
}

/** `Buff.affect(mob, Charm.class, Charm.DURATION).object = hero.id()` - the port's charm map is keyed the same way the Transfusion wand sets it. */
function charm(scene: DungeonScene, mob: Creature): void {
	addBuff(mob, 'charm');
	if (mob.buffs['charm'] !== undefined) scene.charmTargets.set(mob.id, scene.hero.id);
}

function enthrall(scene: DungeonScene, mob: Creature): void {
	const def = MONSTERS[mob.kind as AnyMonsterId];
	//`AllyBuff.affectAndLoot`: the kill's experience, `hero.lvl <= enemy.maxLvl ? enemy.EXP : 0`
	if (def && mob.noExp !== true && scene.progression.level <= def.maxLvl) scene.grantExperience(def.exp);
	mob.hp = mob.maxHp;
	for (const buff of NEGATIVE_BUFFS) delete mob.buffs[buff as BuffId];
	mob.isAlly = true;
	mob.allyKind = 'mirror';
	mob.sleeping = false;
	mob.seesHero = false;
}
