import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const d = 'src/simulation';
for (const f of readdirSync(d).filter((n) => n.endsWith('.ts'))) {
  const t = readFileSync(join(d, f), 'utf8');
  const bad = [...t.matchAll(/from\s+['"]([^'"]+)['"]/g)]
    .map((x) => x[1])
    .filter((s) => !/^\.\/[\w]+$/.test(s));
  if (bad.length) console.log(f + ' :: ' + bad.join(','));
}
console.log('scan done');
