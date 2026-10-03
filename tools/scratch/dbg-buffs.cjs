const { mkdtempSync, mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname } = require('node:path');
const ts = require('typescript');
const root = 'C:/Users/miche/dev/mwg-pixel-dungeon/';
const out = mkdtempSync(join(tmpdir(), 'spd-dbg-'));
function compile(source, destination) {
	const target = join(out, destination);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}
compile(join(root, 'src/simulation/mwlMonsterImmunities.ts'), 'simulation/mwlMonsterImmunities.js');
compile(join(root, 'src/simulation/mwlBuffDurations.ts'), 'simulation/mwlBuffDurations.js');
compile(join(root, 'src/simulation/buffs.ts'), 'simulation/buffs.js');
const src = readFileSync(join(out, 'simulation/buffs.js'), 'utf8');
console.log('has doomDamage export stmt:', /exports\.doomDamage|doomDamage =/.test(src));
console.log('require lines:', (src.match(/require\(.*\)/g) || []).join(' | '));
const buffs = require(join(out, 'simulation/buffs.js'));
console.log('typeof doomDamage:', typeof buffs.doomDamage);
console.log('export keys sample:', Object.keys(buffs).slice(0, 10).join(','));
