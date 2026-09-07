import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

//vite marks its entry script type="module" crossorigin no matter what format it emitted.
//That attribute makes a file:// page refuse to run it (ES modules are blocked by CORS from
//the file: origin), even though the bundle itself is a plain IIFE - so rewrite the tag.
const html = await readFile(join(dist, 'index.html'), 'utf8');
const entryTag = /[ \t]*<script[^>]*src="\.\/game\.js"[^>]*><\/script>/;

if (!entryTag.test(html)) {
	throw new Error('could not find the game script tag in vite output, check vite.config.ts');
}

await writeFile(join(dist, 'index.html'), html.replace(entryTag, '\t<script defer src="./game.js"></script>'), 'utf8');
console.log('dist/index.html rewritten for file:// - open it directly, no server needed');
