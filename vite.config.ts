import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version: string };

/**
 * Same file:// constraint as mwg's own examples: no server, no <script type="module">.
 * There are no image/audio assets yet (placeholder textures are drawn at runtime), so
 * unlike mwg's compiled examples there is nothing to inline - just one classic script.
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
		//`mwg` is a symlinked `file:../MW_games` dependency with its own nested
		//`node_modules/pixi.js` - without dedupe, Vite bundles two separate copies of the
		//package, each with its own `extensions` singleton. `main.ts` registering a pipe
		//(`registerColorTransform`, `TilingSpritePipe`, `NineSliceSpritePipe`) then adds it to
		//the wrong copy's registry from the renderer's point of view, since `mwg`'s own
		//`Game.ts` creates the `Application`/`Renderer` from its copy - every renderable using
		//that pipe throws "Cannot read properties of undefined (reading 'validateRenderable')"
		//on its first frame, in production builds only (dev's looser resolution hides it).
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
