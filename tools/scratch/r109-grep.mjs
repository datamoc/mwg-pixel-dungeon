import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const pats = process.argv.slice(2);
const roots = ['src/items', 'src/simulation', 'src/scenes'];
const files = [];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (!p.includes('node_modules')) walk(p); }
    else if (/\.tsx?$/.test(n)) files.push(p);
  }
};
for (const r of roots) walk(r);
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  for (const pat of pats) {
    const i = t.indexOf(pat);
    if (i >= 0) console.log(f + ' :: ' + JSON.stringify(t.slice(Math.max(0, i - 40), i + pat.length + 80).replace(/\n/g, ' | ')));
  }
}
console.log('scanned ' + files.length);
