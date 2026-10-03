const { mkdtempSync, mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname } = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = 'C:/Users/miche/dev/mwg-pixel-dungeon/';
const out = mkdtempSync(join(tmpdir(), 'spd-dbg2-'));
function compile(source, destination) {
	const target = join(out, destination);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}
writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
compile(join(root, 'src/generated/mwlContent.ts'), 'generated/mwlContent.js');
compile(join(root, 'src/mwlContent.ts'), 'mwlContent.js');
compile(join(root, 'src/simulation/mwlMonsterImmunities.ts'), 'simulation/mwlMonsterImmunities.js');
compile(join(root, 'src/simulation/mwlBuffDurations.ts'), 'simulation/mwlBuffDurations.js');
compile(join(root, 'src/simulation/buffs.ts'), 'simulation/buffs.js');
writeFileSync(join(out, 'combat.js'), `const buffs = require('./simulation/buffs.js');
exports.BUFF_DURATION = buffs.BUFF_DURATION;
exports.doomDamage = buffs.doomDamage;
`);
const rq = createRequire(join(out, 'check.cjs'));
const combat = rq('./combat.js');
console.log('typeof doomDamage:', typeof combat.doomDamage);
