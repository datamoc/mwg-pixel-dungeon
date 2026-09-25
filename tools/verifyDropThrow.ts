// Pins `items/dropThrow.ts` (`Item.AC_DROP`/`AC_THROW`, `Potion.mustThrowPots`/`canThrowPots`/`doThrow`, tag `v3.3.8`).
// The scene wiring (heap drop, aim, shatter, item window) was live-checked in the built game
// (`tools/scratch/drop-throw-livecheck.mjs`, `dropthrow-ui-shot.mjs`). Run through `npm run test:dropthrow`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canDropBagItem, canThrowBagItem, potionThrowsByDefault, shatterHasEffect, snuffBombFuseOnFreeze, throwLanding, throwNeedsConfirm } from '../src/items/dropThrow';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

check('keys, equipment stand-ins, rings and the tome never drop', ['ironKey', 'goldenKey', 'crystalKey', 'armorReward', 'weaponReward', 'wand', 'ring_garnet', 'holyTome', 'missile_dart'].every((id) => !canDropBagItem(id)));
check('potions, scrolls, food and artifacts drop', ['potionHealing', 'scrollIdentify', 'food', 'talisman', 'seed'].every(canDropBagItem));
check('items with their own throw keep it (bombs, honeypot, brews, candle, runestones)', ['bomb', 'honeypot', 'shockingBrew', 'candle', 'stoneOfBlast'].every((id) => !canThrowBagItem(id)));
check('flasks and scrolls take the generic throw', canThrowBagItem('potionToxicGas') && canThrowBagItem('scrollIdentify'));
check('a known beneficial potion asks before it is thrown; must-throw and can-throw do not', throwNeedsConfirm('potionHealing', true) && !throwNeedsConfirm('potionFrost', true) && !throwNeedsConfirm('potionPurity', true) && !throwNeedsConfirm('potionHealing', false));
check('a known malevolent potion throws by default', potionThrowsByDefault('potionToxicGas', true) && !potionThrowsByDefault('potionToxicGas', false) && !potionThrowsByDefault('potionHealing', true));
check('the seven potions with a real shatter run it (Levitation is a confusion-gas flask, Purity clears blobs); the rest splash harmlessly', ['potionFlame', 'potionToxicGas', 'potionParalyticGas', 'potionFrost', 'potionShrouding', 'potionLevitation', 'potionPurity'].every(shatterHasEffect) && !shatterHasEffect('potionHealing'));

check('freezing snuffs live bomb fuses but leaves triggered Noisemakers armed', (() => {
	const bomb = { id: 'bomb', fuseTurns: 1 };
	const liveNoisemaker = { id: 'noisemaker', fuseTurns: 1 };
	const armedNoisemaker = { id: 'noisemaker', noisemakerArmed: true };
	return snuffBombFuseOnFreeze(bomb) && bomb.fuseTurns === undefined
		&& snuffBombFuseOnFreeze(liveNoisemaker) && liveNoisemaker.fuseTurns === undefined
		&& !snuffBombFuseOnFreeze(armedNoisemaker) && armedNoisemaker.noisemakerArmed;
})());

const line = [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 }));
check('an unobstructed throw lands on the aimed cell', throwLanding(line, () => false, () => false).x === 5);
check('a wall stops it on the last open cell', throwLanding(line, (x) => x === 3, () => false).x === 2);
check('a creature is hit at its own cell', throwLanding(line, () => false, (x) => x === 2).x === 2);

const dropScene = readFileSync(join(process.cwd(), 'src/scenes/dungeon/hero/dropThrowScene.ts'), 'utf8');
const envScene = readFileSync(join(process.cwd(), 'src/scenes/dungeon/environmentFireTraps.ts'), 'utf8');
const hazardScene = readFileSync(join(process.cwd(), 'src/scenes/dungeon/actorTurnsHazards.ts'), 'utf8');
const bossScene = readFileSync(join(process.cwd(), 'src/scenes/dungeon/bosses/bossLogic.ts'), 'utf8');
const blobSim = readFileSync(join(process.cwd(), 'src/simulation/environmentalBlobs.ts'), 'utf8');
check('a blast breaks open plain chests (flag cleared, contents stay) and leaves locked/crystal/shop heaps untouched',
	dropScene.includes("if (ground.chest === 'normal' && !ground.forSale) {")
	&& dropScene.includes('ground.chest = undefined;')
	&& dropScene.includes('if (ground.chest !== undefined || ground.forSale) return false;'));
check('a landed flask hard-presses its cell before shattering (trap/grass/plant/web)',
	dropScene.includes('this.pressCellFromFlask(at.x, at.y);')
	&& envScene.includes('pressCellFromFlask(this: DungeonScene, x: number, y: number)'));
check('a revealed trap still fires for the hero (Java hard press ignores reveal state)',
	envScene.includes('if (this.secrets.isSecret(x, y)) this.secrets.discover(x, y);')
	&& !envScene.includes('if (!this.secrets.isSecret(x, y)) return;'));
check('an unattended trap trigger seeds its positional halves and spends (darts/grim only spend)',
	envScene.includes('triggerUnattendedTrapAt(this: DungeonScene, x: number, y: number)')
	&& envScene.includes("else if (kind === 'explosive') {")
	&& envScene.includes('if (kind !== \'gateway\') this.spentTrapCells.add(cell);'));
check('mobs trample high grass on step (terrain falls, naturalism-0 loot, no hero bits)',
	envScene.includes('trampleMobGrass(this: DungeonScene, monster: Creature)')
	&& envScene.includes("heroClass: 'mob',")
	&& bossScene.includes('if (moved) this.trampleMobGrass(creature);'));
check('a chasm landing presses its cell (trap, grass, plant) before the Cripple, like heroLand',
	hazardScene.includes('this.triggerTrapAt(this.hero.x, this.hero.y);')
	&& hazardScene.includes('this.trampleHighGrass(this.hero.x, this.hero.y);')
	&& hazardScene.includes('this.triggerPortedPlantAt(this.hero.x, this.hero.y);')
	&& hazardScene.includes('if (this.hero.hp <= 0) return;'));
check('confusion gas prolongs vertigo (a longer live clock survives instead of resetting to 2)',
	blobSim.includes("if ((target.buffs?.['vertigo'] ?? 0) < 2) context.addBuff(target, 'vertigo', 2);"));

if (failed > 0) { console.error(`${failed} drop/throw check(s) failed`); process.exit(1); }
console.log('verifyDropThrow: OK');
