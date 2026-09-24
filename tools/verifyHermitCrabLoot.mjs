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
// live: tools/scratch/gnollexile-loot-livecheck.mjs - 30 kills averaged 2.63 items (expected 2.5)

console.log('verifyHermitCrabLoot: OK');
