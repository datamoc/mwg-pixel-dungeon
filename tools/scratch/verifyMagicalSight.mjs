// tools/verifyMagicalSight.ts
import assert from "node:assert/strict";

// src/simulation/magicalSight.ts
var MAGICAL_SIGHT_DURATION = 50;
var MAGICAL_SIGHT_DISTANCE = 12;
function shadowCasterRounding(radius, row) {
  if (row <= 0) return 0;
  return Math.min(row, Math.round(radius * Math.cos(Math.asin(row / (radius + 0.5)))));
}
function senseRowHalfWidth(sense, dy) {
  const at = shadowCasterRounding(sense, dy);
  if (at < dy) return at;
  let left = sense;
  while (shadowCasterRounding(sense, left) < at) left--;
  return left;
}
function magicalSightCells(width, height, cx2, cy2, sense, discoverable) {
  const cells2 = [];
  for (let y = Math.max(0, cy2 - sense); y <= Math.min(height - 1, cy2 + sense); y++) {
    const half = senseRowHalfWidth(sense, Math.abs(cy2 - y));
    for (let x = Math.max(0, cx2 - half); x <= Math.min(width - 1, cx2 + half); x++) {
      if (discoverable(x, y)) cells2.push(y * width + x);
    }
  }
  return cells2;
}

// tools/verifyMagicalSight.ts
assert.equal(MAGICAL_SIGHT_DISTANCE, 12);
assert.equal(MAGICAL_SIGHT_DURATION, 50);
assert.equal(shadowCasterRounding(12, 0), 0);
assert.equal(shadowCasterRounding(12, 1), 1, "clamped to the row index near the middle");
assert.equal(shadowCasterRounding(12, 12), 3, "the top row of the circle: round(12*cos(asin(12/12.5))) = 3");
assert.equal(shadowCasterRounding(12, 11), 6);
assert.equal(senseRowHalfWidth(12, 0), 12);
assert.equal(senseRowHalfWidth(12, 12), 3);
assert.equal(senseRowHalfWidth(12, 11), 6);
assert.equal(senseRowHalfWidth(12, 6), 11, "dy=6 clamps, so the transposed search gives the largest column whose extent >= 6");
var W = 41;
var H = 41;
var cx = 20;
var cy = 20;
var cells = new Set(magicalSightCells(W, H, cx, cy, 12, () => true));
assert.ok(cells.size > 440 && cells.size < 540, `a disc of radius ~12: ${cells.size}`);
for (const cell of cells) {
  const x = cell % W, y = Math.floor(cell / W);
  assert.ok(cells.has(y * W + (2 * cx - x)) && cells.has((2 * cy - y) * W + x), "mirror-symmetric");
  assert.ok(Math.hypot(x - cx, y - cy) <= 13, "inside the circle");
}
assert.ok(cells.has(cy * W + cx + 12) && !cells.has(cy * W + cx + 13), "reaches exactly 12 on the axis");
var none = magicalSightCells(W, H, cx, cy, 12, () => false);
assert.equal(none.length, 0, "nothing discoverable, nothing sensed");
var corner = magicalSightCells(W, H, 0, 0, 12, () => true);
assert.ok(corner.every((cell) => cell % W < W && Math.floor(cell / W) < H) && corner.length > 100 && corner.length < cells.size, "clipped at the map corner");
console.log("magical sight: all checks pass");
