import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

// Pins `DirectableAlly` order wiring (`actors/mobs/npcs/DirectableAlly.java`, tag `v3.3.8`): the
// shared `directAlly` order picker (attack/defend/follow), its four callers (PowerOfMany's
// LightAlly, SpiritHawk, ShadowClone, DriedRose's ghost), and `takeAllyTurn`'s
// `DirectableAlly.Hunting.act()` give-up-the-spontaneous-chase override.
const scene = readSceneSource();
const rose = readFileSync(new URL('../src/items/rose.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
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
check("a defend-ordered ally under DirectableAlly.Hunting's override breaks off a spontaneous (unordered) chase it can't reach, back to its post", () => {
	assert.ok(scene.includes('const chasingSpontaneously = defend !== undefined && target !== undefined && target !== ordered && this.fov.isVisible(defend.x, defend.y);'));
	assert.ok(scene.includes('const destination = chasingSpontaneously ? defend : target ?? defend ?? this.hero;'));
});
check('an explicitly ordered target (allyTargetChar) is chased regardless - only a spontaneous one gives up', () => {
	assert.ok(/const ordered = ally\.allyTargetChar !== undefined[\s\S]{0,1700}chasingSpontaneously/.test(scene));
});

console.log('verifyAllyOrders: OK');
