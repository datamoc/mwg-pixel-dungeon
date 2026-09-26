// Pins `simulation/vertigo.ts` (`Char.move()` under `Vertigo`, tag `v3.3.8`) and the wiring source pins.
// Live-checked (`tools/scratch/vertigo-livecheck.mjs`): 400 hero steps east from an open cell scattered over
// all 8 neighbours (~12.5% each, intended direction 14%), and ConfusionGas grants `vertigo`, not `daze`.
import { readFileSync } from 'node:fs';
import { canDefaultPlaceSwap, vertigoStep } from '../src/simulation/vertigo';

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

const placeSwap = {
	allyCellPassable: true, heroFlying: false, heroImmovable: false, allyImmovable: false,
	heroParalysed: false, allyParalysed: false, heroRooted: false, allyRooted: false,
	heroVertigo: false, allyVertigo: false,
};
check('default Char.interact swaps when both characters may move', canDefaultPlaceSwap(placeSwap));
check('either character paralysis, roots or Vertigo blocks default swaps', [
	{ heroParalysed: true }, { allyParalysed: true }, { heroRooted: true }, { allyRooted: true },
	{ heroVertigo: true }, { allyVertigo: true },
].every((change) => !canDefaultPlaceSwap({ ...placeSwap, ...change })));
check('default swaps refuse immovable characters and unsafe cells unless the hero flies',
	!canDefaultPlaceSwap({ ...placeSwap, allyImmovable: true })
	&& !canDefaultPlaceSwap({ ...placeSwap, allyCellPassable: false })
	&& canDefaultPlaceSwap({ ...placeSwap, allyCellPassable: false, heroFlying: true }));

const read = (p: string) => readFileSync(p.replace('../', ''), 'utf8').split(String.fromCharCode(13)).join(''); //relative to the repo root (npm runs from there)
const rules = read('../src/content/buff-rules.mwl');
check('vertigo is a 10-turn negative buff', /buff: "vertigo",\s*duration: 10/.test(rules) && /degrade,daze,vertigo,chill/.test(rules));
check('ConfusionGas and Stormvine grant vertigo, not the daze stand-in', read('../src/simulation/environmentalBlobs.ts').includes("context.addBuff(target, 'vertigo', 2)")
	&& read('../src/simulation/plantTriggers.ts').includes("ctx.grantBuff(hero, 'vertigo', 10)") && read('../src/simulation/plantTriggers.ts').includes("ctx.grantBuff(creature, 'vertigo', 10)"));
check('Healing cure detaches vertigo', read('../src/items/potionEffects.ts').includes("'blindness', 'vertigo'] as BuffId[]"));
	check('the hero and monster step funnels both apply it', read('../src/scenes/dungeon/actorTurnsHazards.ts').includes("this.hero.buffs['vertigo'] !== undefined")
		&& read('../src/scenes/dungeon/bosses/bossLogic.ts').includes("monster.buffs['vertigo'] !== undefined"));
	const swaps = read('../src/scenes/dungeon/actorTurnsHazards.ts');
	check("default ally bump binds Java's passability, paralysis, roots, Vertigo and IMMOVABLE gates",
		swaps.includes("allyCellPassable: this.level.passable(ally.x, ally.y)")
		&& swaps.includes("ally.allyKind === 'ward' || ally.allyKind === 'lotus'")
		&& swaps.includes("ally.kind !== undefined && IMMOVABLE_KINDS.has(ally.kind)")
		&& swaps.includes("heroVertigo: (this.hero.buffs['vertigo'] ?? 0) > 0")
		&& swaps.includes("if (occupant!.allyKind !== 'sheep')")
		&& swaps.includes('this.tryDefaultAllyPlaceSwap(occupant!)'));
	// T17 comment/provenance pins: no stale "daze stand-in" remains on Vertigo paths; ALLY_WARP
	// is intentionally not gated on Vertigo (Java Char.interact order); Combo clobber stays open.
	const noStaleVertigoDaze = [
		'../src/scenes/dungeonScene.ts',
		'../src/scenes/dungeon/environmentFireTraps.ts',
		'../src/simulation/environmentalBlobs.ts',
	].every((p) => {
		const src = read(p);
		return !/Vertigo effect uses the port's daze stand-in/.test(src)
			&& !/is Vertigo's stand-in/.test(src)
			&& !/two-turn Vertigo shape through the port's daze stand-in/.test(src);
	});
	check('no stale "daze stand-in" comments remain on Vertigo paths', noStaleVertigoDaze);
	check('ALLY_WARP precedes the default swap gate (Java Char.interact order)', read('../src/scenes/dungeon/hero/armorAbilityUse.ts').includes('ally warp is')
		&& read('../src/scenes/dungeon/hero/armorAbilityUse.ts').includes('intentionally not Vertigo-gated')
		&& read('../src/scenes/dungeon/actorTurnsHazards.ts').includes('tryDefaultAllyPlaceSwap(occupant!)'));
	check('Combo clobber prolong-3 is documented as ported', read('../src/content/buff-rules.mwl').includes('Combo')
		&& !read('../src/content/buff-rules.mwl').includes('no Combo move system')
		&& read('../src/content/buff-rules.mwl').includes('Combo.java:381'));
	check('healing-potion cure comment no longer claims Vertigo is a daze stand-in', !read('../src/items/potionEffects.ts').includes('Blindness/Vertigo stand-in'));
	//T60 dispatch migration: both Vertigo step funnels route the rule through the shared
	//SimulationRuntime (`runVertigoStep` in adapters/gameSimulation.ts) instead of calling
	//`vertigoStep` directly, so the command is journaled like the other domain rules.
	const vertigoFunnels = read('../src/scenes/dungeon/actorTurnsHazards.ts') + read('../src/scenes/dungeon/bosses/bossLogic.ts');
	check('both Vertigo steps dispatch through the shared runtime',
		(vertigoFunnels.match(/runVertigoStep\(/g) ?? []).length === 2
		&& !/[^\w]vertigoStep\(/.test(vertigoFunnels));

	if (failed > 0) { console.error(`${failed} vertigo check(s) failed`); process.exit(1); }
	console.log('verifyVertigo: OK');
