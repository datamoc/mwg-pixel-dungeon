import { SaveSystem } from 'mwg';
import { registerBuiltinPipes } from 'mwg/two-d/pixi-interop';

const checks = [];
const pass = (label, condition) => {
	checks.push([label, Boolean(condition)]);
	if (!condition) throw new Error(`FAIL ${label}`);
	console.log(`PASS ${label}`);
};

const values = new Map();
const storage = {
	read: (key) => values.get(key) ?? null,
	write: (key, value) => values.set(key, value),
	remove: (key) => values.delete(key),
	keys: () => [...values.keys()],
};
const saves = new SaveSystem({
	namespace: 'compatibility-probe',
	version: 2,
	storage,
	migrations: { 1: (state) => ({ ...state, migrated: true }) },
});

storage.write('mwg-save:compatibility-probe:corrupt', '{not-json');
pass('MWG SaveSystem rejects corrupted local JSON as an empty slot', saves.load('corrupt') === null);

storage.write('mwg-save:compatibility-probe:old', JSON.stringify({
	meta: { version: 1, savedAt: 1 },
	state: { depth: 3 },
}));
const migrated = saves.load('old');
pass('MWG SaveSystem still runs local migrations after the 0.9.0 hardening', migrated?.state.depth === 3 && migrated.state.migrated === true && migrated.meta.version === 2);

let importError = null;
try {
	saves.importSlot('bad-import', '{not-json');
} catch (error) {
	importError = String(error);
}
pass('MWG SaveSystem labels malformed imported payloads', importError?.includes('SaveSystem.importSlot') === true);
pass('MWG 0.9 exposes the built-in pipe registration facade', typeof registerBuiltinPipes === 'function');

console.log(`${checks.length} MWG compatibility checks passed.`);
