import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const temp = mkdtempSync(join(tmpdir(), 'spd-crystal-guardian-scale-'));

try {
	const sourcePath = fileURLToPath(new URL('../src/ui/characterPlacement.ts', import.meta.url));
	const output = join(temp, 'characterPlacement.js');
	writeFileSync(output, ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
	const { placeCharacterArt } = require(output);
	const sprite = (x, y) => ({
		texture: { orig: { width: 12, height: 15 } },
		scale: { x, y },
		pivot: { x: 0, y: 0, set(nextX, nextY) { this.x = nextX; this.y = nextY; } },
	});

	const guardian = sprite(1.25, 1.25);
	placeCharacterArt(guardian, false);
	assert.deepEqual([guardian.scale.x, guardian.scale.y], [1.25, 1.25], 'facing right preserves custom scale');
	placeCharacterArt(guardian, true);
	assert.deepEqual([guardian.scale.x, guardian.scale.y], [-1.25, 1.25], 'facing left mirrors X without flipping vertically');
	assert.deepEqual([guardian.pivot.x, guardian.pivot.y], [14, 5], 'left-facing pivot follows the mirrored sprite width');
	placeCharacterArt(guardian, false);
	assert.deepEqual([guardian.scale.x, guardian.scale.y], [1.25, 1.25], 'facing right again keeps the custom scale');

	const defaultSprite = sprite(1, 1);
	placeCharacterArt(defaultSprite, true);
	assert.deepEqual([defaultSprite.scale.x, defaultSprite.scale.y], [-1, 1], 'ordinary sprites retain their unit scale');

	const minePath = fileURLToPath(new URL('../src/scenes/dungeon/monsters/crystalMine.ts', import.meta.url));
	const mineSource = readFileSync(minePath, 'utf8');
	assert.match(mineSource, /sprite\.scale\.set\(sprite\.scale\.x < 0 \? -1\.25 : 1\.25, 1\.25\)/,
		'CrystalGuardianSprite uses Java scale on both axes while leaving facing to the sign of X');
	console.log('PASS CrystalGuardian scale survives facing changes and mine visual refresh stays upright');
} finally {
	rmSync(temp, { recursive: true, force: true });
}
