import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../src/ui/effectBursts.ts', import.meta.url)), 'utf8');
const call = readFileSync(fileURLToPath(new URL('../src/scenes/dungeon/hero/inventoryQuickslot.ts', import.meta.url)), 'utf8');

assert.match(src, /case 'fire':/, 'fire cell has its own factory');
assert.match(src, /interval = 0\.03/, 'Fire.use pours every 0.03s (Java tag v3.3.8)');
assert.match(src, /tint: 0xEE7722/, 'FlameParticle color 0xEE7722');
assert.match(src, /gravity: \{ x: 0, y: -80 \}/, 'FlameParticle acc (0, -80)');
assert.match(src, /t \< 0\.2 \? t \* 5 : 1/, 'FlameParticle alpha fade-in over first 20% of age');

assert.match(src, /case 'toxicGas':/, 'toxic gas has its own factory');
assert.match(src, /tint: 0x50FF60/, 'Speck.TOXIC hardlight 0x50FF60');
assert.match(src, /interval = 0\.4/, 'ToxicGas.use pours every 0.4s');
assert.match(src, /life: \[1, 3\]/, 'Speck TOXIC/CORROSION/BLIZZARD life 1-3s');

assert.match(src, /case 'corrosiveGas':/, 'corrosive gas has its own factory');
assert.match(src, /tint: 0xAAAAAA/, 'Speck.CORROSION hardlight 0xAAAAAA');
assert.match(src, /0xFF8800/, 'documents CorrosionParticle life tint lerp as unmodelled');

assert.match(src, /case 'blizzard':/, 'blizzard has its own factory');
assert.match(src, /spin: \[200 \* DEG, 300 \* DEG\]/, 'Speck.BLIZZARD angularSpeed 200-300 deg/s');

assert.match(src, /case 'web':/, 'web has its own factory');
assert.match(src, /interval = 0\.25/, 'Web.use pours every 0.25s');
assert.match(src, /perEmit = 3/, 'WebParticle.FACTORY emits three particles per tick');
assert.match(src, /tint: 0xCCCCCC/, 'WebParticle color 0xCCCCCC');

assert.match(src, /case 'smokeScreen':/, 'smoke has its own factory');
assert.match(src, /interval = 0\.1/, 'SmokeScreen.use pours every 0.1s');
assert.match(src, /tint: 0x000000/, 'Speck.SMOKE hardlight 0x000000');
assert.match(src, /life: \[1, 1\.5\]/, 'Speck.SMOKE life 1-1.5s');

assert.match(src, /rate: 1 \/ interval/, 'cadence derives rate from Java pour interval');
assert.match(call, /syncBlobCells\(this, \[/, 'scene still binds the six blob layers');

console.log('PASS blob-cell factories (Java use() intervals, tints, lifetimes, Web x3)');
