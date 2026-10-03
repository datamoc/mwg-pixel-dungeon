import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const out = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (!p.includes('node_modules')) walk(p); }
    else if (/\.tsx?$/.test(n)) {
      const t = readFileSync(p, 'utf8');
      const i = t.indexOf('trueDistance');
      if (i >= 0) out.push(p + ' :: ' + JSON.stringify(t.slice(Math.max(0, i - 200), i + 150)));
    }
  }
};
walk('src');
console.log(out.slice(0, 8).join('\n---\n'));
console.log('files: ' + out.length);
