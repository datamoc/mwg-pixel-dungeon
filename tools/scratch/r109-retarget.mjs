import { readFileSync, writeFileSync } from 'node:fs';
const p = 'tools/scratch/r109-cleric-harness.mjs';
let t = readFileSync(p, 'utf8');
t = t.replace("import { verifyCombat } from '../verifyCombat.mjs';", "import { verifyClericSpells } from '../verifyClericSpells.mjs';");
t = t.replace('verifyCombat(require, check);', 'verifyClericSpells(require, check);');
t = t.replace("COMBAT-EXCEPT-KNOWN-RED: ${passed} passed, ${skipped} skipped", "CLERIC: ${passed} passed, ${skipped} skipped");
writeFileSync(p, t);
console.log('harness retargeted');
