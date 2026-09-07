import type { SpdSprites } from './images';
import type { SpdAudio } from './audio';
import type { ClassId } from './classes';

/**
 * The handful of values every scene needs that belong to the run as a whole, not to any one
 * scene: the loaded sprite sheets, the audio system, and the class picked on the select
 * screen for the next scene to read. Kept as one mutable object (not separate module-level
 * `let`s) so every file that needs one imports the same live binding rather than each
 * needing its own getter/setter pair - a plain `import { x } from './runState'` cannot be
 * reassigned by the importer (that is a TypeScript/ESM error), but `runState.x = ...` can,
 * which is exactly the shape a shared mutable singleton wants.
 */
export const runState: {
	sprites: SpdSprites;
	audio: SpdAudio;
	/** set by ClassSelectScene, read once by SewersScene.create() */
	pendingClass: ClassId;
} = {
	sprites: undefined as unknown as SpdSprites,
	audio: undefined as unknown as SpdAudio,
	pendingClass: 'warrior',
};

/** Where the language override is persisted - see `main.ts`'s `main()` for why `localStorage`
 * rather than `mwg`'s `SaveSystem`: the choice has to outlive a run and be readable before
 * `main()` builds anything, so it is a setting rather than run state. */
export const LANGUAGE_KEY = 'spd-on-mwg.language';

/** `package.json`'s own `version`, injected at build time by `vite.config.ts`'s `define` */
export const APP_VERSION = __APP_VERSION__;
