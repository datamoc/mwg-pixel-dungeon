import { readFileSync } from 'node:fs';
const t = readFileSync('src/ui/buffOverlays.ts', 'utf8');
for (const pat of ['powerofmany', 'buffName', '.name})', 'port.buff']) {
  const i = t.indexOf(pat);
  console.log(pat, '@' + i, i >= 0 ? JSON.stringify(t.slice(Math.max(0, i - 150), i + 200)) : '');
}
