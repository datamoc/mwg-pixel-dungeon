import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

// Pins Recycle's TippedDart support (`Recycle.usableOnItem()`/`onItemSelected()`, tag `v3.3.8`):
// a carried tipped dart is offered and redrawn as a different tip, one fresh level-0 unit with
// full durability - the same redraw `transmutation.ts`'s `changeTippedDart` already uses.
// Live-checked in the built game (`tools/scratch/recycle-tippeddart-livecheck.mjs`): a blindweed
// dart redrew to sorrowmoss, level 0, full durability, and the spell was consumed.
const scene = readSceneSource();
const spells = readFileSync(new URL('../src/items/spells.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const check = (name, fn) => { fn(); console.log(`PASS ${name}`); };

check('the picker candidate filter includes missile_tippeddart', () => {
	assert.ok(spells.includes("|| item.id === 'missile_tippeddart'"));
});
check('the category routes a tipped dart to its own draw branch', () => {
	assert.ok(spells.includes("source.id === 'missile_tippeddart' ? 'tippedDart' : 'stone'"));
});
check('the draw rerolls a different seed as a fresh level-0, full-durability unit', () => {
	assert.ok(/if \(category === 'tippedDart'\) \{[\s\S]{0,500}TIPPED_DART_BY_SEED\)\.filter\(\(seed\) => seed !== current\)/.test(scene));
	assert.ok(/tippedDart[\s\S]{0,700}level: 0, durability: MISSILE_MAX_DURABILITY, maxDurability: MISSILE_MAX_DURABILITY/.test(scene));
});

// Exotic families (`Recycle.onItemSelected()`'s `ExoticPotion.regToExo`/`ExoticScroll.regToExo`
// branch): an exotic never redraws as a regular item, and one with no other exotic is not offered.
check('an exotic source keeps its family: it is offered only with an alternative and redraws among exotics', () => {
	assert.ok(spells.includes('exoticRecycleAlternatives(item.id).length > 0'), 'the picker gate');
	assert.ok(spells.includes("exoticRecycleAlternatives(source.id).length > 0 ? 'exotic'"), 'the category routes to the exotic draw');
	assert.ok(/category === 'exotic'\) \{\s*const pool = exoticRecycleAlternatives\(source\.id\)/.test(scene));
});

console.log('verifyRecycleTippedDart: OK');
