// Throwaway (tools/scratch): live-check `Earthroot.Armor`, shared by the Earthroot plant and the
// Entanglement armor glyph.
//
// Java: a block *pool* (`level`) that absorbs `min(damage, (scalingDepth + 5)/2)` per hit and ends
// when exhausted or when its owner has left the cell it was granted on. The plant sets it to the
// char's max HP; the Entanglement glyph gives the *defender* `round((5 + 2*armorLevel) * max(1,
// chance))` - where this port used to give the *attacker* a `cripple` movement lock instead.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));

const executablePath = path.join(
	process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
	'ms-playwright',
	'chromium-1193',
	'chrome-win',
	'chrome.exe'
);
const browser = await chromium.launch({
	executablePath,
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);

const tap = async (fx, fy) => {
	await page.evaluate(([x, y]) => {
		const c = document.querySelector('canvas');
		const r = c.getBoundingClientRect();
		const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width * x, clientY: r.y + r.height * y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
		c.dispatchEvent(new PointerEvent('pointermove', opts));
		c.dispatchEvent(new PointerEvent('pointerdown', opts));
		c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
		c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
	}, [fx, fy]);
	await page.waitForTimeout(1200);
};
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s.hero;
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = hero.x + dx, y = hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};

	// --- 1. the plant grants a pool of the hero's own max HP, capped per hit, ended by movement
	s['earthrootArmor'] = null;
	const plantCell = s.level.index(hero.x, hero.y);
	s['manualPlants'].set(plantCell, 'earthroot');
	s['placePortedFeature'](plantCell, 'earthroot');
	s['triggerPortedPlantAt'](hero.x, hero.y);
	const depth = s['depth'];
	const poolAfterPlant = s['earthrootArmor']?.level ?? 0;
	const blocking = Math.floor((depth + 5) / 2);
	const firstHit = s['absorbHeroDamage'](20);
	const poolAfterHit = s['earthrootArmor']?.level ?? 0;
	// now leave the cell and take another hit: Java's absorb() detaches on the position mismatch
	const away = cell();
	s['moveTo'](hero, away);
	const afterMove = s['absorbHeroDamage'](20);
	const poolAfterMove = s['earthrootArmor']?.level ?? null;

	// --- 2. the glyph gives the *defender* the same pool, and no longer cripples the attacker
	s.armorGlyph = 'entanglement';
	s.armorLevel = 3;
	s['earthrootArmor'] = null;
	const mob = s.spawnMonster('rat', cell());
	mob.damage = [0, 0];
	let glyphPool = 0;
	for (let i = 0; i < 60 && glyphPool === 0; i++) {
		delete mob.buffs.cripple;
		s['mobOnHit'](mob, hero, 20);
		glyphPool = s['earthrootArmor']?.level ?? 0;
	}
	const attackerCrippled = !!mob.buffs.cripple;
	s.armorGlyph = undefined;
	mob.hp = 0;
	s.kill(mob);

	return {
		heroMaxHp: hero.maxHp, depth, blocking,
		poolAfterPlant, firstHit, poolAfterHit, afterMove, poolAfterMove,
		glyphPool, attackerCrippled, expectedGlyphPool: Math.round((5 + 2 * 3) * 1),
	};
});

console.log('probe results:', JSON.stringify(result));
const expect = [
	['the plant sets the pool to the hero\'s maximum HP', result.poolAfterPlant === result.heroMaxHp],
	['the plant blocks only (scalingDepth + 5)/2 of a 20-damage hit', result.firstHit === 20 - result.blocking],
	['the pool drops by exactly that block', result.poolAfterHit === result.poolAfterPlant - result.blocking],
	['moving away ends the pool, and the next hit lands in full', result.afterMove === 20 && result.poolAfterMove === null],
	['the glyph grants the defender its own smaller pool', result.glyphPool === result.expectedGlyphPool],
	['the glyph no longer cripples the attacker', result.attackerCrippled === false],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
