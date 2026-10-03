import { readFileSync, writeFileSync } from 'node:fs';
const p = 'tools/verifyCombat.mjs';
const t = readFileSync(p, 'utf8');
const oldTwo = [
  "\t\tassert.doesNotMatch(attack, /Math\\.round\\(damage \\* POWER_OF_MANY_ATTACK_FACTOR\\)/,",
  "\t\t\t'no post-armor ally multiplier may remain on the attack() tail');",
].join('\r\n');
const replacement = [
  "\t\tconst seam = readFileSync(new URL('../src/scenes/dungeon/attackSeams.ts', import.meta.url), 'utf8');",
  "\t\tassert.doesNotMatch(attack, /Math\\.round\\(damage \\* POWER_OF_MANY_ATTACK_FACTOR\\)/,",
  "\t\t\t'no post-armor ally multiplier may remain on the attack() tail');",
  "\t\tassert.doesNotMatch(seam, /POWER_OF_MANY_ATTACK_FACTOR/,",
  "\t\t\t'no second ally copy may live on the T61 seam tail (it would double-apply once wired)');",
].join('\r\n');
if (!t.includes(oldTwo)) { console.error('ANCHOR MISS'); process.exit(1); }
writeFileSync(p, t.replace(oldTwo, replacement));
console.log('pin extended');
