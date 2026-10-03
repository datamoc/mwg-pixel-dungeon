/**
 * What gets packaged, and how it is split across files.
 *
 * Each group becomes one assets/<name>.js next to the page, so nothing is a single huge
 * blob and a rebuild only rewrites the groups that changed.
 */
export const ASSET_GROUPS = {
	sprites: ['sprites'],
	interfaces: ['interfaces'],
	environment: ['environment', 'effects'],
	splashes: ['splashes'],
	fonts: ['fonts'],
	sounds: ['sounds'],
	//music is 8MB of the 21MB total and the game runs without it, so it is opt-in
	music: [],
};

//translations are per-language and only one is loaded at a time
export const MESSAGE_LOCALES = ['', '_fr'];

export const MIME = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.ogg': 'audio/ogg',
	'.mp3': 'audio/mpeg',
	'.ttf': 'font/ttf',
	'.properties': 'text/plain',
	'.json': 'application/json',
};
