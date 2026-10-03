import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const hits = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|mwl|json)$/.test(n)) {
      const t = readFileSync(p, 'utf8');
      if (t.includes('port.spell.sunray') || t.includes('spell/sunray') || t.includes("'sunray'") && p.includes('i18n')) hits.push(p);
    }
  }
};
walk('src/i18n');
walk('src/content');
console.log(hits.join('\n') || 'none');
// And: how does t() resolve port.spell.* — find fallback/other sunray name keys.
const t2 = readFileSync('src/generated/spdMessages.ts', 'utf8');
const re = /"[a-z0-9_.]*sunray[a-z0-9_.]*"/gi;
const keys = new Set();
let m;
while ((m = re.exec(t2)) !== null && keys.size < 20) keys.add(m[0]);
console.log([...keys].join('\n'));
