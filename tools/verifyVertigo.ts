// Pins `simulation/vertigo.ts` (`Char.move()` under `Vertigo`, tag `v3.3.8`) and the wiring source pins.
// Live-checked (`tools/scratch/vertigo-livecheck.mjs`): 400 hero steps east from an open cell scattered over
// all 8 neighbours (~12.5% each, intended direction 14%), and ConfusionGas grants `vertigo`, not `daze`.
import { readFileSync } from 'node:fs';
import { vertigoStep } from '../src/simulation/vertigo';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };
const open = () => true;
const free = () => false;
const from = { x: 5, y: 5 };

check('an adjacent step is re-rolled to pos + NEIGHBOURS8[roll]', vertigoStep(from, { x: 6, y: 5 }, 0, open, free)?.x === 4 && vertigoStep(from, { x: 6, y: 5 }, 0, open, free)?.y === 4);
check('all eight rolls reach eight distinct neighbours', new Set([0, 1, 2, 3, 4, 5, 6, 7].map((r) => { const c = vertigoStep(from, { x: 6, y: 5 }, r, open, free)!; return `${c.x},${c.y}`; })).size === 8);
check('a blocked rolled cell means no movement', vertigoStep(from, { x: 6, y: 5 }, 4, () => false, free) === null);
check('an occupied rolled cell means no movement', vertigoStep(from, { x: 6, y: 5 }, 4, open, () => true) === null);
check('a non-adjacent (travelling) move is untouched', vertigoStep(from, { x: 8, y: 5 }, 3, open, free)?.x === 8);

const read = (p: string) => readFileSync(p.replace('../', ''), 'utf8').split(String.fromCharCode(13)).join(''); //relative to the repo root (npm runs from there)
const rules = read('../src/content/buff-rules.mwl');
check('vertigo is a 10-turn negative buff', /buff: "vertigo",\s*duration: 10/.test(rules) && /degrade,daze,vertigo,chill/.test(rules));
check('ConfusionGas and Stormvine grant vertigo, not the daze stand-in', read('../src/simulation/environmentalBlobs.ts').includes("context.addBuff(target, 'vertigo', 2 * vertigoResistFactor(target.kind))")
	&& read('../src/simulation/plantTriggers.ts').includes("ctx.grantBuff(hero, 'vertigo', 10)") && read('../src/simulation/plantTriggers.ts').includes("ctx.grantBuff(creature, 'vertigo', 10 * vertigoResistFactor(creature.kind))"));
check('Healing cure detaches vertigo', read('../src/items/potionEffects.ts').includes("'blindness', 'vertigo'] as BuffId[]"));
check('DM300 resists Vertigo at half duration everywhere it can be applied (environmentalBlobs, plantTriggers, comboMoves)', read('../src/simulation/buffs.ts').includes("kind === 'dm300' ? 0.5 : 1") && read('../src/simulation/environmentalBlobs.ts').includes("2 * vertigoResistFactor(target.kind)") && read('../src/simulation/plantTriggers.ts').includes("10 * vertigoResistFactor(creature.kind)") && read('../src/scenes/dungeon/hero/comboMoves.ts').includes("3 * vertigoResistFactor(enemy.kind)"));
check('gaining vertigo/paralysis after a travel began cancels it (Hero.add -> interrupt)', read('../src/scenes/dungeon/turnLoopAiming.ts').includes('restricted && !startedRestricted'));
check('the hero and monster step funnels both apply it', read('../src/scenes/dungeon/actorTurnsHazards.ts').includes("this.hero.buffs['vertigo'] !== undefined")
	&& read('../src/scenes/dungeon/bosses/bossLogic.ts').includes("monster.buffs['vertigo'] !== undefined"));

if (failed > 0) { console.error(`${failed} vertigo check(s) failed`); process.exit(1); }
console.log('verifyVertigo: OK');
