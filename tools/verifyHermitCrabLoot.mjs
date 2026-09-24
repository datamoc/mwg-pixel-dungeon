import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

// Pins `HermitCrab.rollToDropLoot()` (tag `v3.3.8`): 3x the base Crab meat chance (0.5, not
// 0.1666667) plus a guaranteed `Generator.randomArmor()` drop on top. Live-checked in the built
// game (`tools/scratch/hermitcrab-loot-livecheck.mjs`): 30 deaths gave 30 armor drops and ~15
// meat drops.
const loot = readFileSync(new URL('../src/content/loot-rules.mwl', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const scene = readSceneSource();
const check = (name, fn) => { fn(); console.log(`PASS ${name}`); };

check("hermitCrab's loot row is 0.5 (3x the base crab's 0.1666666667)", () => {
	assert.ok(/monster: "crab",\s*chance: 0\.1666666667,\s*kind: "meat",/.test(loot), 'the base crab row is unchanged');
	assert.ok(/monster: "hermitCrab",\s*chance: 0\.5,\s*kind: "meat",/.test(loot), 'hermitCrab has its own 0.5 row');
});
check('a guaranteed armor drop runs past the overleveled gate, alongside the ordinary loot roll', () => {
	assert.ok(/!overleveled && creature\.kind === 'hermitCrab'\) \{\s*const item = generatedInventoryItem\(randomArmor\(\)/.test(scene));
});

check('GnollExile drops 2 or (coin flip) 3 random items past the same gate', () => {
	assert.ok(/!overleveled && creature\.kind === 'gnollExile'\) \{\s*const count = Random\.int\(2\) === 0 \? 3 : 2;/.test(scene));
	assert.ok(scene.includes('randomUsingDefaultsAnyCategory()'), 'the category-free Generator.randomUsingDefaults()');
});
check('GnollExile attacks from two cells only through a free two-step path', () => {
	assert.ok(/gnollExileTurn\(this: DungeonScene, exile: Creature, distance: number\): boolean \{[\s\S]{0,700}this\.creatureAt\(mid\.x, mid\.y\)/.test(scene));
	assert.ok(scene.includes("monster.kind === 'gnollExile' && this.gnollExileTurn(monster, distance)"), 'dispatched from the monster turn');
});
check("GnollExile stays passive until hit or debuffed", () => {
	assert.ok(/gnollExilePassive\(this: DungeonScene, exile: Creature\): boolean \{[\s\S]{0,900}NEGATIVE_BUFFS\.has/.test(scene));
	assert.ok(scene.includes("monster.kind === 'gnollExile' && monster.seesHero && this.gnollExilePassive(monster)"), 'gated ahead of the detection roll');
});
// live: tools/scratch/gnollexile-passive-livecheck.mjs (passive / hit / poisoned)
// live: tools/scratch/gnollexile-reach-livecheck.mjs (reach on/off with blockers)
// live: tools/scratch/gnollexile-loot-livecheck.mjs - 30 kills averaged 2.63 items (expected 2.5)

console.log('verifyHermitCrabLoot: OK');
