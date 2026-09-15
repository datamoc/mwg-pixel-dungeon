import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

//MWG 0.9.0 publishes this helper in its package files and documents the import path, but its
//exports map omits that subpath. Resolve the packaged file from the public package entry until a
//release exports `./tools/classic-html`; this still executes MWG's implementation, not a copy.
const { toClassicScript } = await import(
	pathToFileURL(join(here, '..', 'node_modules', '@datamoc', 'mw_games', 'tools', 'classic-html.mjs')).href,
);

const html = await readFile(join(dist, 'index.html'), 'utf8');
const result = toClassicScript(html);
if (!result) throw new Error('could not find the module entry script tag in vite output, check vite.config.ts');

await writeFile(join(dist, 'index.html'), result.html, 'utf8');
console.log('dist/index.html rewritten for file:// - open it directly, no server needed');
