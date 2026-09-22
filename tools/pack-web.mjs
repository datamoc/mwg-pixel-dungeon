/**
 * Packages the built web game into this project's release artifacts.
 *
 *   node tools/pack-web.mjs [--dist dist] [--out release] [--version <tag>]
 *
 * Consumes an *already built* `dist/` rather than building one: `npm run build` is the thing that
 * must have passed (type-check, MWL compile, Vite, the `file://` rewrite), and keeping the two steps
 * separate means a packaging bug can be re-run against the same bytes instead of being tangled with
 * a build. The release workflow runs `npm run build` first; locally, run it yourself (or
 * `npm run mwl:compile && npx vite build && node tools/emit.mjs` when the type-check gate is blocked
 * by unrelated in-flight work).
 *
 * Every byte of compression here is `mwg`'s, not this project's - `mwg/tools/single-file` (gzip and
 * brotli) and `mwg/tools/compress-dist` (per-file `.gz`/`.br` siblings). This file only decides what
 * gets built and where it lands:
 *
 * - `<prefix>-standalone.html` - a genuinely single-file page: every script inlined and gzipped,
 *   unpacked at load through the browser's own `DecompressionStream` behind a splash screen. No
 *   sibling `game.js` at all, so this is the artifact that survives being emailed, and the one to
 *   hand someone who wants to play.
 * - `<prefix>-standalone-brotli.html` - the same with brotli, which by the framework's own account
 *   (0.11.0: a real Chrome 153 threw for `DecompressionStream('br')`) has narrower reach. gzip stays
 *   the default artifact; this exists for browsers that do take it.
 * - `selfhost/` - the plain multi-file build plus `.gz`/`.br` siblings of every text file, for a host
 *   that can negotiate `Content-Encoding` and would rather not compress on every request. GitHub
 *   Pages already compresses its own responses, so this is for self-hosting; the originals are left
 *   intact and still open from `file://`. It is a folder, not an archive - the release workflow zips
 *   it with the runner's own archiver rather than this repo carrying format code for it.
 */
import { cp, mkdir, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/** The documented specifiers: MWG 0.14.0 gave both of these helpers a real `exports` subpath, so
 * they no longer have to be reached through their filesystem location - see `tools/emit.mjs` for
 * why that mattered under this project's alias install. */
const loadMwgTool = async (name) => import(`mwg/tools/${name}`);

function arg(name, fallback) {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const dist = resolve(root, arg('dist', 'dist'));
const out = resolve(root, arg('out', 'release'));
const version = arg('version', JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version);
const prefix = `spd-on-mwg-${version}`;

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const rows = [];

//The build is a precondition, not something to half-recreate here.
for (const required of ['index.html', 'game.js']) {
	const info = await stat(join(dist, required)).catch(() => null);
	if (!info) throw new Error(`${join(dist, required)} is missing - run \`npm run build\` first`);
}

//A stale artifact from an earlier tag must never be uploaded as if it were this one's.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const { buildSingleFile } = await loadMwgTool('single-file');
const { compressDist } = await loadMwgTool('compress-dist');

for (const [suffix, algorithm] of [['standalone.html', 'gzip'], ['standalone-brotli.html', 'brotli']]) {
	//`buildSingleFile`'s `output` is a file *name* written inside `dist` (it joins the two), not a
	//path - so the page is built where the framework puts it and then moved into the release
	//directory, rather than left behind in the tree Pages uploads.
	const result = await buildSingleFile({ dist, compress: true, algorithm, splash: true, output: suffix });
	await rename(join(dist, suffix), join(out, `${prefix}-${suffix}`));
	rows.push([`${prefix}-${suffix}`, mb(result.embeddedBytes ?? result.rawBytes), `${algorithm}, ${result.scripts} script(s) inlined`]);
}

//`compressDist` writes its siblings in place over whatever directory it is handed, so it gets a copy
//- never `dist/` itself, which Pages uploads directly and which `file://` opens as-is.
const selfhost = join(out, 'selfhost');
await cp(dist, selfhost, { recursive: true });
const sidecars = await compressDist(selfhost, { gzip: true, brotli: true });
const files = await readdir(selfhost);
rows.push(['selfhost/', mb(sidecars.reduce((total, row) => total + row.gzip + row.brotli, 0)), `${sidecars.length} text file(s) gained .gz/.br siblings, ${files.length} files total`]);

console.log(`release artifacts in ${relative(root, out)}/`);
for (const [name, size, note] of rows) console.log(`  ${name.padEnd(46)} ${size.padStart(9)}  ${note}`);
