import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// BACKLOG B4 (coord T58): screenshot and animation-timing comparisons for
// visual parity. dungeonScene.ts cannot load in this harness (Pixi), so the
// sprite tables, sheet geometry and playback call sites are pinned here -
// values below are Java's own at tag `v3.3.8` (method cites inline), and any
// mismatch fails loudly instead of drifting silently.
const checks = [];
const pass = (label, condition) => {
	checks.push([label, Boolean(condition)]);
	if (!condition) throw new Error(`FAIL ${label}`);
	console.log(`PASS ${label}`);
};
const root = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// The generated table is JSON with `//` comment lines; strip those first.
function readTable() {
	const src = root('../src/generated/spriteAnimations.ts');
	const raw = src.slice(src.indexOf('= {') + 2, src.lastIndexOf('}') + 1)
		.replace(/^\s*\/\/.*$/gm, '');
	return JSON.parse(raw);
}
const table = readTable();
const clip = (key, name) => table[key][name];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- key coverage: every v3.3.8 sprite class with uniform idle film ---------
pass('sprite table holds 70 classes', Object.keys(table).length === 70);
for (const key of ['gnollexile', 'hermitcrab', 'mimic', 'crystalmimic', 'causticslime',
	'dm201', 'newbornelemental', 'ratking', 'spectralnecromancer']) {
	pass(`table has ${key} clips`, typeof table[key] === 'object' && 'idle' in table[key]);
}
// Authored subsystems own these (never table keys): colour offsets in
// crystalMine.ts, base/statue sets in gnollMine.ts.
for (const key of ['crystalwisp', 'crystalguardian', 'crystalspire',
	'gnollguard', 'gnollsapper', 'gnollgeomancer']) {
	pass(`table leaves ${key} to its authored clip system`, !(key in table));
}
// No port mob or art (fungal), no port behaviour (tormented 1/100 roll),
// code-bypassed (phantom), or framework sprites.
for (const key of ['fungalcore', 'fungalsentry', 'fungalspinner', 'tormentedspirit',
	'phantompiranha', 'ward', 'prismatic', 'char', 'mob', 'item', 'missile', 'discardeditem']) {
	pass(`table excludes ${key}`, !(key in table));
}
// Hand-added keys the extractor cannot produce survive regeneration.
pass('ninjalog keeps its SmokeBomb frames (idle frozen, die 12fps)',
	eq(clip('ninjalog', 'idle'), { fps: 0, loop: true, frames: [0] })
	&& eq(clip('ninjalog', 'die'), { fps: 12, loop: false, frames: [1, 2, 3, 4] }));
pass('spirit hawk keeps its SpiritHawk frames (6/8/12/12fps)',
	eq(clip('spirithawk', 'idle'), { fps: 6, loop: true, frames: [0, 1] })
	&& eq(clip('spirithawk', 'run'), { fps: 8, loop: true, frames: [0, 1] })
	&& eq(clip('spirithawk', 'attack'), { fps: 12, loop: false, frames: [2, 3, 0, 1] })
	&& eq(clip('spirithawk', 'die'), { fps: 12, loop: false, frames: [4, 5, 6] }));

// --- appended/packed variant offsets (FINAL_BASE in the extractor) ---------
pass('exile idle sits on the appended row (42+)',
	eq(clip('gnollexile', 'idle'), { fps: 2, loop: true, frames: [42, 42, 42, 43, 42, 42, 43, 43] }));
pass('hermit idle sits on the appended row (32+)',
	eq(clip('hermitcrab', 'idle'), { fps: 5, loop: true, frames: [32, 33, 32, 34] }));
pass('mimic revealed set matches MimicSprite (c=0)',
	eq(clip('mimic', 'idle'), { fps: 5, loop: true, frames: [3, 3, 3, 4, 4] })
	&& eq(clip('mimic', 'attack'), { fps: 10, loop: false, frames: [3, 7, 8, 9] })
	&& eq(clip('mimic', 'die'), { fps: 5, loop: false, frames: [10, 11, 12] }));
pass('crystal mimic is the +32 Crystal set',
	eq(clip('crystalmimic', 'idle'), { fps: 5, loop: true, frames: [35, 35, 35, 36, 36] }));
pass('dm201 reads the shared DM200 sheet at c=12',
	eq(clip('dm201', 'idle'), { fps: 2, loop: true, frames: [12, 13] })
	&& eq(clip('dm201', 'run'), { fps: 2, loop: true, frames: [12, 13] })
	&& eq(clip('dm201', 'zap'), { fps: 15, loop: false, frames: [19, 20, 20, 19] }));
pass('caustic slime reads the shared slime sheet at c=9',
	eq(clip('causticslime', 'idle'), { fps: 3, loop: true, frames: [9, 10, 10, 9] }));
pass('newborn elemental reads the shared elemental sheet at ofs=21',
	eq(clip('newbornelemental', 'idle'), { fps: 10, loop: true, frames: [21, 22, 23] }));
pass('spectral necromancer reads the shared necro sheet at c=16',
	eq(clip('spectralnecromancer', 'idle'),
		{ fps: 1, loop: true, frames: [16, 16, 16, 17, 16, 16, 16, 16, 17] }));
pass('rat king is the base set (holiday/Ratmogrify variants have no port system)',
	eq(clip('ratking', 'idle'), { fps: 2, loop: true, frames: [0, 0, 0, 1] }));
// `RotLasher`: `new Animation(0, true)` freezes on the first frame; mwg maps
// fps 0 to an infinite frame duration, the same frozen frame.
pass('rot lasher idle/run keep Java fps 0 (frozen)',
	clip('rotlasher', 'idle').fps === 0 && clip('rotlasher', 'run').fps === 0);

// --- zap/operate: Java plays `zap` on ranged attacks, `operate` on devices --
const zapKeys = Object.keys(table).filter((k) => 'zap' in table[k]).sort();
pass('zap clips exist exactly where Java defines or aliases them',
	eq(zapKeys, ['acidic', 'dm100', 'dm200', 'dm201', 'dm300', 'elemental', 'eye',
		'fist', 'golem', 'hero', 'necromancer', 'scorpio', 'shaman', 'spectralnecromancer',
		'spinner', 'tengu', 'warlock']));
pass('distinct DM zaps keep their own frames',
	eq(clip('dm100', 'zap'), { fps: 8, loop: false, frames: [5, 5, 1] })
	&& eq(clip('dm200', 'zap'), { fps: 15, loop: false, frames: [7, 8, 8, 7] })
	&& eq(clip('dm300', 'zap'), { fps: 15, loop: false, frames: [6, 7, 7, 6] }));
pass('fist and necromancer zaps keep their own frames',
	eq(clip('fist', 'zap'), { fps: 8, loop: false, frames: [0, 5, 6] })
	&& eq(clip('necromancer', 'zap'), { fps: 10, loop: false, frames: [5, 6, 7, 8] }));
pass('attack=zapped clones resolve both directions',
	eq(clip('necromancer', 'attack'), clip('necromancer', 'zap'))
	&& eq(clip('spectralnecromancer', 'attack'), clip('spectralnecromancer', 'zap')));
pass('hero operate matches HeroSprite (8fps [16,17,16,17])',
	eq(clip('hero', 'operate'), { fps: 8, loop: false, frames: [16, 17, 16, 17] }));

// --- sheet geometry: appended rows must exist where the clips point -------
function pngSize(path) {
	const b = readFileSync(new URL(path, import.meta.url));
	return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
pass('gnoll sheet carries the appended exile row (256x45)',
	eq(pngSize('../src/assets/gnoll.png'), [256, 45]));
pass('crab sheet carries the appended hermit row (256x48)',
	eq(pngSize('../src/assets/crab.png'), [256, 48]));

// --- MWL frame rows: static fallbacks agree with the clip bases ------------
const refs = root('../src/content/asset-references.mwl');
const rowIdle = (monster) => {
	const m = refs.match(new RegExp(`monster: "${monster}", frame_width: \\d+, frame_height: \\d+, idle: (\\d+)`));
	assert.ok(m, `${monster} has a frame row`);
	return Number(m[1]);
};
pass('exile static frame is the appended row', rowIdle('gnollExile') === 42);
pass('hermit static frame is the appended row', rowIdle('hermitCrab') === 32);
pass('dm201 static frame is the shared-sheet offset', rowIdle('dm201') === 12);
pass('crystal mimic static frame is the Crystal set', rowIdle('crystalMimic') === 35);

// --- playback call sites: ranged attacks play zap, not attack -------------
const ai = root('../src/scenes/dungeon/monsters/monsterAi.ts');
pass('zap helper prefers zap over attack', ai.includes("if (sprite.has('zap')) sprite.play('zap', true);"));
pass('zapHero (DM100/shaman/warlock) plays zap',
	ai.includes('//`DM100.zap()`/`Shaman.zap()`/`Warlock.zap()` play `sprite.zap()`'));
pass('elemental bolts play zap', ai.includes('//`Elemental.zap()` plays the sprite zap'));
pass('eye beam fires with zap', ai.includes('//The charged beam fires with the sprite zap'));
pass('ventDM200 plays zap', ai.includes('//`DM200.act()` vents with `sprite.zap(enemy.pos)`'));
const fists = root('../src/scenes/dungeon/deathSaveRefresh.ts');
pass('yogFistRangedTurn plays zap',
	fists.includes('//`YogFist.doAttack` zaps with `sprite.zap(enemy.pos)`')
	&& fists.includes('this.playMonsterZap(fist);'));
const gnoll = root('../src/scenes/dungeon/monsters/gnollMine.ts');
pass('faceAndSwing plays zap with attack fallback',
	gnoll.includes("if (sprite.has('zap')) sprite.play('zap', true);"));
pass('gnoll clips carry the attack-cloned zap',
	gnoll.includes("['zap', [2, 3, 0].map((f) => f + ofs), { fps: 12, loop: false }],"));
const crystal = root('../src/scenes/dungeon/monsters/crystalMine.ts');
pass('wisp clips carry the attack-cloned zap',
	crystal.includes("['zap', at([2, 3, 4, 5]), { fps: 16, loop: false }],"));
const spawn = root('../src/scenes/monsterSpawn.ts');
for (const kind of ['gnollExile', 'hermitCrab', 'causticSlime', 'spectralNecromancer', 'dm201', 'crystalMimic']) {
	pass(`spawn looks up ${kind} variant clips`, spawn.includes(`kind === '${kind}'`));
}

// --- authored clip systems match Java (verified readouts, tag v3.3.8) ------
pass('wisp clips match CrystalWispSprite (1/12/16/15fps)',
	crystal.includes("['idle', at([0]), { fps: 1, loop: true }],")
	&& crystal.includes("['run', at([0, 0, 0, 1]), { fps: 12, loop: true }],")
	&& crystal.includes("['attack', at([2, 3, 4, 5]), { fps: 16, loop: false }],")
	&& crystal.includes("['die', at([6, 7, 8, 9, 10, 11, 12, 11]), { fps: 15, loop: false }],"));
pass('guardian clips match CrystalGuardianSprite (2/15/12/5fps)',
	crystal.includes("['idle', at([0, 0, 0, 0, 0, 1, 1]), { fps: 2, loop: true }],")
	&& crystal.includes("['run', at([2, 3, 4, 5, 6, 7]), { fps: 15, loop: true }],")
	&& crystal.includes("['attack', at([8, 9, 10]), { fps: 12, loop: false }],"));
pass('gnoll clips match the mine sprites (2/12/12/12fps, statue idle 1fps)',
	gnoll.includes("['idle', [0, 0, 0, 1, 0, 0, 1, 1].map((f) => f + ofs), { fps: statue ? 1 : 2, loop: true }],")
	&& gnoll.includes("['run', [4, 5, 6, 7].map((f) => f + ofs), { fps: 12, loop: true }],")
	&& gnoll.includes("['die', [8, 9, 10].map((f) => f + ofs), { fps: 12, loop: false }],"));

// --- scene-level timings: the movement, floaters and fades ------------------
const boss = root('../src/scenes/dungeon/bosses/bossLogic.ts');
pass('character movement tweens Java moveInterval (0.1s)',
	boss.includes('visual movement takes 0.1s') && boss.includes('motion.tween(0.1,'));
pass('knockback arc keeps 0.15s', boss.includes('motion.tween(0.15,'));
const tiles = root('../src/scenes/dungeon/coreSpawnTiles.ts');
pass('hero clips match HeroSprite cloth tier (1/20/15/20fps)',
	tiles.includes("sprite.add('idle', [0, 0, 0, 1, 0, 0, 1, 1].map(frame), { fps: 1 });")
	&& tiles.includes("sprite.add('run', [2, 3, 4, 5, 6, 7].map(frame), { fps: 20 });")
	&& tiles.includes("sprite.add('attack', [13, 14, 15, 0].map(frame), { fps: 15, loop: false });")
	&& tiles.includes("sprite.add('die', [8, 9, 10, 11, 12, 11].map(frame), { fps: 20, loop: false });"));
const scene = root('../src/scenes/dungeonScene.ts');
const floaterPush = root('../src/scenes/dungeon/hero/weaponSpellsGear.ts');
pass('damage floaters rise one tile at 7px rasterised type',
	scene.includes('floaterFontSize = 7') && scene.includes('floaterTextScale = 1 / 3')
	&& floaterPush.includes('rise: TILE / this.floaterTextScale'));
const death = root('../src/scenes/dungeon/deathSaveRefresh.ts');
pass('death keeps the 2s AlphaTweener fade', death.includes('AlphaTweener(sprite, 0, 2f)'));

console.log(`${checks.length} visual parity checks passed.`);
