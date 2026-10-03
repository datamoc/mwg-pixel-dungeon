import { readFileSync } from 'node:fs';
const t = readFileSync('coverage/rows-monsters-bosses-and-combat.md', 'utf8');
const marker = 'PowerOfMany.activate()';
const i = t.indexOf(marker);
console.log('idx', i);
if (i >= 0) {
  const end = t.indexOf('\n|', i + 10);
  console.log('rowlen', end - i);
  console.log(JSON.stringify(t.slice(end - 900, end)));
}
