import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
for (const n of readdirSync('tools')) {
  if (!/^verify.*\.mjs$/.test(n)) continue;
  const t = readFileSync(join('tools', n), 'utf8');
  if (t.includes("'flash'") && n !== 'verifyCombat.mjs') console.log(n);
}
const b = readFileSync('src/simulation/buffs.ts', 'utf8');
console.log('buffs re-exports BUFF_DURATION:', b.includes('BUFF_DURATION'));
