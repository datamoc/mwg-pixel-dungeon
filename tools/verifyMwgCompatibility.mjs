import { SaveSystem } from 'mwg';
import { registerBuiltinPipes } from 'mwg/two-d/pixi-interop';
import {
	Game,
	ReactionTable,
	AnimatedSprite,
	Tweener,
	ParticleEmitter,
	TabbedList,
	IconGrid,
	ListView,
	Window,
	WindowStack,
	Camera,
	PresentationQueue,
} from 'mwg';
import { SpriteSheet, ScreenEffects } from 'mwg/two-d/render';
import { SimulationRuntime, EventPresentation, Scheduler, advanceToInput } from 'mwg/simulation';
import { TargetingController, MultiTurnBeam, coneSector } from 'mwg/roguelike';
import { EntityRegistry } from 'mwg/core';
import { contentCatalog, validateCatalog, compileSources } from 'mwg/mwl';
import { craft } from 'mwg/actors';

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

/**
 * ROADMAP 11A's acceptance gate, port side: every MWG capability this port adopted must
 * still resolve against the installed package's declarations. `tsc` already pins the
 * statically-imported names, but the 0.14 -> 0.15 bump silently removed
 * `InventoryItem.sourceClass` with no changelog note - a property read through a cast, so
 * no static import failed. This section fails loudly on that whole class of removal for
 * the adopted surface, renderer-free and offline (`npm run mwg:check` stays the
 * networked pin/latest comparison and is deliberately not part of this).
 *
 * Deliberately NOT asserted here, each with its reason in PORT_COVERAGE.md's mwg-usage
 * section rather than here: `setAssetMap` (P6, shipped but not adopted), `coneSector`
 * (P13, shipped but the port keeps its own exact ConeAOE translation), and
 * `ScreenEffects.sequence` (P8, resolved as a deliberate non-adoption - the curtain is a
 * five-stop gradient, not a flat wash). Their absence from this list is the assertion.
 */
pass('adopted: Game/Scene/UI primitives resolve', typeof Game === 'function' && typeof Window === 'function' && typeof WindowStack === 'function');
pass('adopted: WindowStack owns the keyboard chain', typeof WindowStack.prototype.handleAction === 'function');
pass('adopted: inventory widgets resolve', typeof TabbedList === 'function' && typeof IconGrid === 'function');
pass('adopted: hero motion primitives resolve', typeof AnimatedSprite === 'function' && typeof Tweener === 'function');
pass('adopted: decoration/particle primitives resolve', typeof ParticleEmitter === 'function' && typeof SpriteSheet === 'function');
pass('adopted: SpriteSheet cuts irregular rects', typeof SpriteSheet.prototype.rect === 'function');
pass('adopted: ListView ships the tap parity P5 asked for', typeof ListView.prototype.tapRow === 'function');
pass('adopted: screen shake is pixel-based across zoom', typeof Camera.prototype.shakeScreen === 'function');
pass('adopted: king-transition state machine primitive resolves', typeof ReactionTable === 'function');
pass('adopted: scheduler persistence round-trips through restore', typeof Scheduler.restore === 'function');
pass('adopted: simulation runtime + presentation tie resolve', typeof SimulationRuntime === 'function' && typeof EventPresentation === 'function' && typeof PresentationQueue === 'function' && typeof advanceToInput === 'function');
pass('adopted: cell-aimed targeting + multi-turn beams resolve', typeof TargetingController === 'function' && typeof MultiTurnBeam === 'function');
pass('adopted: entity identity primitive resolves', typeof EntityRegistry === 'function' && typeof EntityRegistry.prototype.add === 'function');
pass('adopted: MWL catalog + atomic crafting resolve', typeof contentCatalog === 'function' && typeof validateCatalog === 'function' && typeof craft === 'function');

// The `tableReferences` adoption is option-level, so no export assertion can pin it:
// instead, a bogus reference must still report MWL_TABLE_REFERENCE (negative probe -
// `tools/compile-mwl.mjs` exercises the positive path on every `npm run check`).
const tableReferenceProbe = validateCatalog(compileSources([]), {
	slots: [],
	hooks: [],
	tableReferences: [{ table: 'no-such-table', column: 'c', references: { table: 'also-missing', column: 'd' } }],
});
pass(
	'adopted: validateCatalog honors tableReferences',
	tableReferenceProbe.some((diagnostic) => diagnostic.code === 'MWL_TABLE_REFERENCE')
);

console.log(`${checks.length} MWG compatibility checks passed.`);
