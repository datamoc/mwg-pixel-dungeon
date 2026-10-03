import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

//Stacked heaps (`Heap.items`, `Level.drop()`): source pins on the scene wiring, live-checked in the built game
//(`tools/scratch/heap-stack-livecheck.mjs`: three drops on one cell stack potion < scroll < gold, only the top
//sprite is visible, one step collects all three, and a drop onto a locked chest relocates to a neighbour).
const scene = readSceneSource();
const check = (name, fn) => { fn(); console.log(`PASS ${name}`); };

check('groundItemAt is the top of the stack (last entry at the cell)', () => {
	assert.ok(/groundItemAt\(this: DungeonScene, x: number, y: number\): GroundItem \| null \{\s*for \(let i = this\.groundItems\.length - 1; i >= 0; i--\)/.test(scene));
	assert.ok(scene.includes('heapItemsAt(this: DungeonScene'), 'the whole stack is readable');
});
check('a drop onto an occupied cell stacks instead of vanishing; chests and shelves relocate it', () => {
	assert.ok(!scene.includes('if (this.groundItemAt(x, y)) return; //one item per cell'), 'the silent-discard early return is gone');
	assert.ok(/under\.chest === 'locked' \|\| under\.chest === 'crystal' \|\| under\.forSale/.test(scene));
	assert.ok(scene.includes('if (under) this.sprite(under).visible = false;'), 'only the top of a stack is drawn');
});
check('removal reveals the new top; the refresh draws one sprite per cell', () => {
	assert.ok((scene.match(/this\.showTopHeapSprite\(/g) ?? []).length >= 2, 'both removal paths reveal the next entry');
	assert.ok(scene.includes('heapTops.get(this.level.index(item.x, item.y)) === item'), 'per-cell top visibility');
});
check('fire burns every entry of the heap', () => {
	assert.ok(scene.includes('groundItemsAt: (cellX, cellY) => this.heapItemsAt(cellX, cellY)'));
});
check('stepping onto a heap collects the whole stack while each take succeeds', () => {
	assert.ok(/for \(let guard = 0; guard < 64; guard\+\+\) \{\s*const top = this\.groundItemAt\(x, y\);/.test(scene));
});
