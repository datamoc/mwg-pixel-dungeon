import { readFileSync } from 'node:fs';
const t = readFileSync('PORT_COVERAGE_I18N.md', 'utf8');
console.log('port.spell hits:', (t.match(/port\.spell/g) || []).length);
console.log('port.buff hits:', (t.match(/port\.buff/g) || []).length);
const i = t.indexOf('port.buff');
console.log(i >= 0 ? JSON.stringify(t.slice(Math.max(0, i - 200), i + 400)) : 'no port.buff');
