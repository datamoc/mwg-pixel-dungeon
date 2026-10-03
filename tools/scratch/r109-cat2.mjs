import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const out = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (!p.includes('node_modules')) walk(p); }
    else if (/\.tsx?$/.test(n)) {
      const t = readFileSync(p, 'utf8');
      let i = -1;
      while ((i = t.indexOf('creatureAt(this: DungeonScene', i + 1)) >= 0) {
        out.push(p);
        break;
      }
    }
  }
};
walk('src/scenes');
console.log(out.join('\n') || 'none');
