import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

//This still executes MWG's implementation, not a copy of it. The specifier is the documented one:
//MWG 0.14.0 gave this helper (and `extract-html`/`single-file`) a real `exports` subpath, so the
//path-based workaround that used to stand here is gone. That workaround existed because an
//`exports` map blocks every deep path it does not name - and it resolved through
//`node_modules/mwg/...`, which is where the package's *alias* install puts it; the pre-0.13.0
//`node_modules/@datamoc/mw_games/...` spelling only ever worked as a stale directory left behind by
//an older install layout, and 0.14.0's own changelog calls that hardcoding out by name as the thing
//that breaks under an alias.
const { toClassicScript } = await import('mwg/tools/classic-html');

const html = await readFile(join(dist, 'index.html'), 'utf8');
const result = toClassicScript(html);
if (!result) throw new Error('could not find the module entry script tag in vite output, check vite.config.ts');

await writeFile(join(dist, 'index.html'), result.html, 'utf8');
console.log('dist/index.html rewritten for file:// - open it directly, no server needed');
