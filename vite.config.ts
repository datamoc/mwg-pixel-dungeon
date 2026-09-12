import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version: string };

/**
 * Same file:// constraint as mwg's own examples: no server, no <script type="module">.
 *
 * Assets are inlined by the bundler rather than by `mwg/tools/compile-resources` + `mwg/assets`:
 * every PNG goes through `assetsInlineLimit` below and every sound through `src/audio.ts`'s eager
 * `import.meta.glob`, so all of them arrive as `data:` URIs inside one classic script. That gives
 * the property the framework's compiled resource map exists for - build-time resolution, so a
 * runtime lookup is synchronous and nothing is ever fetched - without a second generated script.
 * `mwg/assets` is therefore unused here deliberately, and the trade-off is recorded in
 * `PORT_COVERAGE.md`'s mwg-usage row rather than left implicit.
 */
export default defineConfig({
	base: './',
	publicDir: false,
	//`main.ts`'s About/Settings/Changes windows show a real version rather than a
	//hand-copied one that drifts from package.json the next time it is bumped
	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version),
	},
	resolve: {
		//`mwg` is the published npm package `@datamoc/mw_games`, aliased as `mwg` in
		//`package.json`, so there is exactly one `pixi.js` on disk (`mwg` declares it as a peer
		//dependency, and peers do not nest). `dedupe` is kept as a guard for the case that
		//changes - a `file:` link or a stray nested install would give the game and the framework
		//two copies, each with its own `extensions` singleton, and every renderable using a pipe
		//registered in only one of them throws "Cannot read properties of undefined (reading
		//'validateRenderable')" on its first frame, in production builds only (dev's looser
		//resolution hides it). That was the shape of the failure while `mwg` was a symlinked
		//`file:../MW_games` dependency; the registration itself is no longer hand-rolled at all
		//(see the `extensions` note in `main.ts`).
		dedupe: ['pixi.js'],
	},
	build: {
		target: 'es2022',
		outDir: 'dist',
		rollupOptions: { output: { format: 'iife', entryFileNames: 'game.js' } },
		cssCodeSplit: false,
		//every sprite/tileset PNG is inlined as a base64 data: URI rather than a separate
		//file - the built page has to run from file://, which blocks fetch() entirely
		assetsInlineLimit: Number.MAX_SAFE_INTEGER,
	},
});
