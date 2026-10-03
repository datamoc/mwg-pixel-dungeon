import { readFileSync } from 'node:fs';
const t = readFileSync('src/items/displayName.ts', 'utf8');
const i = t.indexOf("spell === 'hallowedGround'");
console.log(JSON.stringify(t.slice(Math.max(0, i - 900), i + 900)));
