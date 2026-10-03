import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
for (const n of readdirSync('coverage')) {
  if (!n.endsWith('.md') || !n.startsWith('rows-')) continue;
  const t = readFileSync(join('coverage', n), 'utf8');
  if (t.includes('resolveFlash') || t.includes('`Flash`')) console.log('FLASH-ROW: ' + n);
  if (t.includes('HolyLance')) console.log('LANCE-ROW: ' + n);
}
