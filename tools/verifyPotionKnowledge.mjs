// R112 - run-wide potion class knowledge (`Potion`'s static `ItemStatusHandler`, tag v3.3.8).
// The store's pure behavior (exotic->regular normalization, per-scene sets) and the
// `ScrollOfIdentify` target gate live in `tools/verifyItemWorkflows.mjs`; this file pins the
// scene-side seams that cannot load headlessly (Pixi), at source level:
//   1. every quaff marks the class BEFORE the effect runs (Java's identify-before-apply),
//   2. the display context carries the set and projects it onto instances
//      (`Potion.isIdentified() == isKnown()`),
//   3. the run envelope saves and restores the set (death-save builder + load site),
//   4. the Alchemize energize hook marks the class (`WndEnergizeItem.energize()`'s
//      `item.identify()`), and the scroll-read context wires both seams.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSceneSource } from './sceneSource.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const scene = readSceneSource();

// 1. `applyPotionEffect` (the scene adapter `quaffPotion` dispatches through): mark first,
//    then dispatch - the order Java's `Potion.apply()` subclasses use (`identify()` first).
//    Anonymous paths skip the mark like `Potion.setKnown()`'s `!anonymous` gate: the
//    UnstableBrew's `anonymize()`d rolls and the aquatic elixir (whose `apply()`
//    never calls `identify()`).
assert.match(scene,
	/applyPotionEffect\(this: DungeonScene, id: string, opts\?: \{ anonymous\?: boolean \}\): void \{[\s\S]{0,900}?if \(!opts\?\.anonymous\) markPotionKindsKnown\(this, \[id\]\);[\s\S]{0,120}?const effect = this\.potionEffects\[id\];/,
	'every quaff marks the potion class known before the effect runs, except anonymous paths');

// 2. Display: the context declares the set, and `itemDisplayName` projects a known class
//    onto the instance flag before its identified/name branches.
const display = readFileSync(join(root, 'src/items/displayName.ts'), 'utf8').replace(/\r\n/g, '\n');
assert.match(display, /readonly potionKindsKnown: ReadonlySet<string>;/,
	'the display context declares the run-wide potion class set');
assert.match(display,
	/if \(id\.startsWith\('potion'\)\) identified = identified \|\| potionKindKnown\(scene\.potionKindsKnown, id\);/,
	'a known class projects onto every instance (Potion.isIdentified() == isKnown())');
assert.match(scene, /ringTypesKnown: ringTypesKnownFor\(this\),\n\t+potionKindsKnown: potionKindsKnownFor\(this\),/,
	'itemDisplayContext feeds the live set to the display');

// 3. Persistence: envelope field, save write, load restore.
assert.match(scene, /potionKindsKnown\?: string\[\];/,
	'the run envelope carries the potion class set');
assert.match(scene,
	/ringTypesKnown: \[\.\.\.ringTypesKnownFor\(this\)\],\n\t+potionKindsKnown: \[\.\.\.potionKindsKnownFor\(this\)\],/,
	'the save builder writes the set into the envelope');
assert.match(scene, /markPotionKindsKnown\(this, s\.potionKindsKnown \?\? \[\]\);/,
	'loading restores the set into the scene');

// 4. `WndEnergizeItem.energize()` ends in `item.identify()` (tag v3.3.8, WndEnergizeItem.java:168),
//    so the Alchemize spell's identify-as-consumed marks the class, not just the instance.
assert.match(scene,
	/markIdentified: \(target\) => \{\n\t{4}target\.identified = true;[\s\S]{0,400}?if \(target\.id\.startsWith\('potion'\)\) markPotionKindsKnown\(scene, \[target\.id\]\);/,
	'the energize identify hook marks the potion class run-wide');

// 5. The scroll-read context wires both seams the read flow calls: the class mark on identify
//    and the `isIdentified() == isKnown()` target gate query.
assert.match(scene,
	/markPotionKindsKnown: \(ids\) => markPotionKindsKnown\(scene, ids\),\n\t+potionKindKnown: \(id\) => potionKindKnown\(potionKindsKnownFor\(scene\), id\),/,
	'readScrollContext wires the class mark and the target gate to the scene set');

console.log('verifyPotionKnowledge: ok (quaff order, display projection, save/load round-trip, energize hook, scroll wiring)');
