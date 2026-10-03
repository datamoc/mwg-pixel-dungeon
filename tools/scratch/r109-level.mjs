import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const out = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (!p.includes('node_modules')) walk(p); }
    else if (/\.tsx?$/.test(n)) {
      const t = readFileSync(p, 'utf8');
      const i = t.indexOf('passable(x: number, y: number)');
      if (i >= 0 && p.includes('evel')) out.push(p + ' :: ' + JSON.stringify(t.slice(Math.max(0, i - 300), i + 300)));
    }
  }
};
walk('src');
console.log(out.join('\n---\n').slice(0, 2000));
