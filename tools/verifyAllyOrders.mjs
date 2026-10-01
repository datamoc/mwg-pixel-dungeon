import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

// Pins ally bump interactions (tag `v3.3.8`): `DirectableAlly` order wiring
// (`actors/mobs/npcs/DirectableAlly.java`) - the shared `directAlly` order picker (attack/defend/
// follow), its four callers (PowerOfMany's LightAlly, SpiritHawk, ShadowClone, DriedRose's ghost),
// and `takeAllyTurn`'s give-up-the-spontaneous-chase gate - plus `Char.interact()`'s default
// branch (R066): the ordinary adjacent place-swap (`tryDefaultAllyPlaceSwap` and its shared
// gates in simulation/vertigo.ts), ALLY_WARP's bump and tap seams (`tryAllyWarp`), and the time
// split - the swap pays the blanket 1/speed(), while the warp/shadow swap and every refusal are
// free and re-ready the hero.
const scene = readSceneSource();
const rose = readFileSync(new URL('../src/items/rose.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const vertigo = readFileSync(new URL('../src/simulation/vertigo.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const check = (name, fn) => { fn(); console.log(`PASS ${name}`); };

check('directAlly is the shared order picker: defend/follow/attack by cell', () => {
	assert.ok(/directAlly\(this: DungeonScene, ally: Creature, cell: Step,[\s\S]{0,400}ally\.allyDefendCell = \{ x: cell\.x, y: cell\.y \};/.test(scene));
	assert.ok(scene.includes('ally.allyTargetChar = occupied;'), 'an enemy cell orders an attack');
});
check('all four real DirectableAlly kinds (LightAlly, SpiritHawk, ShadowClone, DriedRose ghost) call it', () => {
	assert.ok(/this\.directAlly\(powered, cell,/.test(scene), 'PowerOfMany LightAlly');
	assert.ok(/this\.directAlly\(hawk, cell,/.test(scene), 'SpiritHawk');
	assert.ok(/this\.directAlly\(clone, cell,/.test(scene), 'ShadowClone');
	assert.ok(rose.includes('ctx.directAlly(ghost, cell,'), 'DriedRose ghost');
});
check("an ally only breaks off a spontaneous (unordered) chase it can't reach, back to its post", () => {
	assert.ok(scene.includes('const defendVisible = defend !== undefined && this.fov.isVisible(defend.x, defend.y);'));
	assert.ok(/const huntsAutomatically = ally\.attacksAutomatically !== false\s*&& ally\.allyMovingToDefend !== true\s*&& \(defend === undefined \|\| !defendVisible/.test(scene));
	assert.ok(scene.includes('const target = ordered ?? (huntsAutomatically ? nearest : undefined);'));
});
check('an explicitly ordered target (allyTargetChar) is chased regardless - only a spontaneous one gives up', () => {
	assert.ok(scene.includes('const ordered = ally.allyTargetChar !== undefined && ally.allyTargetChar.hp > 0 ? ally.allyTargetChar : undefined;'));
	assert.ok(scene.includes('const target = ordered ?? (huntsAutomatically ? nearest : undefined);'));
});

check('tryDefaultAllyPlaceSwap refuses on an immovable ally or restricted movement (paralysis/roots/Vertigo) on either side', () => {
	assert.ok(/tryDefaultAllyPlaceSwap\(this: DungeonScene, ally: Creature\): boolean \{[\s\S]{0,900}IMMOVABLE_KINDS\.has/.test(scene));
	assert.ok(scene.includes('if (!allowed) return true;'), 'a refused swap is still handled, like Java');
	//the shared gate itself lives in simulation/vertigo.ts, outside the scene source
	assert.ok(vertigo.includes('if (!state.allyCellPassable && !state.heroFlying) return false;'), 'hazard cell (Char.java 247-251)');
	assert.ok(vertigo.includes('if (state.heroImmovable || state.allyImmovable) return false;'), 'either IMMOVABLE (264-267)');
	assert.ok(/return !\(state\.heroParalysed \|\| state\.allyParalysed \|\| state\.heroRooted \|\| state\.allyRooted\s*\|\| state\.heroVertigo \|\| state\.allyVertigo\);/.test(vertigo), 'restricted movement either side (284-288)');
});
check('the bump dispatch tries ShadowClone swap, then Ally Warp, then the default swap (Sheep skipped), before interactWithNPC', () => {
	assert.ok(scene.includes('if (occupant!.isAlly && !occupant!.isNPC && this.tryShadowCloneSwap(occupant!)) {'));
	assert.ok(scene.includes('if (occupant!.isAlly && !occupant!.isNPC && this.tryAllyWarp(occupant!)) {'));
	assert.ok(/if \(occupant!\.allyKind !== 'sheep'\) \{\s*this\.tryDefaultAllyPlaceSwap\(occupant!\);\s*\}/.test(scene));
	assert.ok(scene.includes('this.interactWithNPC(occupant!);'));
});
check('R066 time split: the swap pays the blanket 1/speed(), the attack charge is hostile-only, and a free outcome re-readies the hero', () => {
	assert.ok(/tryDefaultAllyPlaceSwap\(this: DungeonScene, ally: Creature\): boolean \{[\s\S]{0,3400}this\.spendHeroTurn\(this\.getActionTurnCostMod\(\)\);/.test(scene), 'swap spend');
	assert.ok(scene.includes('if (occupant && !occupant.isNPC && !occupant.isAlly) {'), 'the attack-rate charge is hostile-only');
	assert.ok(/finishFreeHeroAction\(this: DungeonScene\): void \{\s*this\.actionSpentTurn = true;\s*this\.awaitingInput = true;/.test(scene), 'free outcome re-readies input');
	assert.ok(scene.includes('if (!this.actionSpentTurn) this.finishFreeHeroAction();'), 'a refused default swap goes free, a successful one skips it');
});
check('Ally Warp reaches both seams - the bump dispatch and the map tap - with in-range refusals handled', () => {
	assert.ok(/handleMapPointer[\s\S]{0,2600}&& this\.tryAllyWarp\(clickAlly\)\)/.test(scene), 'the tap warps at range');
	assert.ok(/tryAllyWarp\(this: DungeonScene, ally: Creature\): boolean \{[\s\S]{0,1200}!this\.level\.passable\(ally\.x, ally\.y\) && this\.hero\.buffs\['levitation'\] === undefined\) return true;/.test(scene), 'hazard gate (Char.java 247-251)');
	assert.ok(/tryAllyWarp\(this: DungeonScene, ally: Creature\): boolean \{[\s\S]{0,2200}\(reach\[this\.level\.index\(ally\.x, ally\.y\)\] \?\? -1\) < 0\) return true;/.test(scene), 'unreachable flood refuses handled (Char.java 271-274)');
});

console.log('verifyAllyOrders: OK');
