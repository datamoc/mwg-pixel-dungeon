import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

//importing this runs the collection and writes dist/assets/*.js
import { GROUPS } from './collect-assets.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

const PAGE = 'shattered-pixel-dungeon.html';

const html = await readFile(join(dist, 'index.html'), 'utf8');

//the asset scripts only populate a map, so they must run before the game does. they are
//listed here rather than discovered at runtime because a file:// page cannot read a
//directory, and plain <script src> tags are not subject to the origin rules that would
//block fetch() or an <img> used as a WebGL texture
const tags = GROUPS.map((g) => `\t<script src="./assets/${g}.js"></script>`).join('\n');

//vite marks its entry as type="module" crossorigin whatever format it emitted. the bundle
//is a plain IIFE, and both of those attributes make a file:// page refuse to run it, so
//the tag is rewritten as a classic script
const gameTag = /[ \t]*<script[^>]*src="\.\/game\.js"[^>]*><\/script>/;

if (!gameTag.test(html)) {
	throw new Error('could not find the game script tag in vite output, check vite.config.ts');
}

const withAssets = html.replace(gameTag, `${tags}\n\t<script src="./game.js"></script>`);

await writeFile(join(dist, PAGE), withAssets, 'utf8');
await rm(join(dist, 'index.html'));

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`\n  dist/${PAGE}`.padEnd(30) + kb(withAssets.length));
console.log('  open it directly from disk, no server needed');
