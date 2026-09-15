// Throwaway (tools/scratch): `ArtifactRecharge`, live - does WildEnergy now advance artifacts?
//
// Java's `WildEnergy` cast calls `ArtifactRecharge.chargeArtifacts(hero, 4f)` and then extends an
// `ArtifactRecharge` buff by 8 turns, which hands every carried artifact's own `charge(Hero,
// amount)` override `min(1, left)` per tick. The port had the spell and the Recharging buff, but
// nothing calling the artifact hooks at all - several artifact rows recorded "the external
// `Artifact.charge(Hero, amount)` boost has no caller here". This check drives a real cast and a
// real timer tick and looks at the artifacts' own charge fields.
//
// Run after `npm run build`:  node tools/scratch/recharge-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=recharge-live', { waitUntil: 'load', timeout: 120000 });
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

const probe = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const bag = s['bag'];
	// A sandals (rate 2/tick) and a talisman (rate 2/tick), plus a toolkit, whose override banks
	// charge *even while cursed* - the two guard exceptions the table encodes.
	bag.add({ id: 'sandals', quantity: 1, identified: true, instanceId: 'sandals-recharge', level: 0, charge: 0, partialCharge: 0 });
	bag.add({ id: 'talisman', quantity: 1, identified: true, instanceId: 'talisman-recharge', level: 0, charge: 0, partialCharge: 0 });
	bag.add({ id: 'toolkit', quantity: 1, identified: true, instanceId: 'toolkit-recharge', level: 0, charge: 0, partialCharge: 0, cursed: true });
	const sandals = () => bag.find('sandals', 'sandals-recharge');
	const talisman = () => bag.find('talisman', 'talisman-recharge');
	const toolkit = () => bag.find('toolkit', 'toolkit-recharge');

	// --- a real cast: `WildEnergy` advances every artifact by four, then starts the 8-turn timer ---
	bag.add({ id: 'wildEnergy', quantity: 1, identified: true, instanceId: 'wild-recharge' });
	const before = {
		sandals: sandals().charge ?? 0, talisman: talisman().charge ?? 0, toolkit: toolkit().charge ?? 0,
		timer: s['artifactRechargeTurns'],
	};
	s['useWildEnergy']('wild-recharge');
	await sleep(100);
	const afterCast = {
		sandals: sandals().charge ?? 0, talisman: talisman().charge ?? 0, toolkit: toolkit().charge ?? 0,
		timer: s['artifactRechargeTurns'],
		wildEnergyGone: bag.find('wildEnergy', 'wild-recharge') === undefined,
	};

	// --- and the timer ticks: each turn hands `min(1, left)` to the same hooks ---
	const chargeBeforeTicks = { sandals: sandals().charge ?? 0, talisman: talisman().charge ?? 0 };
	for (let i = 0; i < 8; i++) s['spendHeroTurn'](1);
	const afterTicks = {
		sandals: sandals().charge ?? 0, talisman: talisman().charge ?? 0, timer: s['artifactRechargeTurns'],
	};

	// --- the guards: a cursed artifact other than the toolkit banks nothing, and AntiMagic stops
	// even the toolkit ---
	const cursedSandals = { charge: sandals().charge ?? 0 };
	sandals().charge = 0;
	sandals().partialCharge = 0;
	sandals().cursed = true;
	s['applyArtifactRecharge'](1);
	const cursedBlocked = { charge: sandals().charge ?? 0 };
	sandals().cursed = false;
	toolkit().charge = 0;
	toolkit().partialCharge = 0;
	s['hero'].magicImmune = true;
	s['applyArtifactRecharge'](1);
	const immuneBlocked = { toolkit: toolkit().charge ?? 0 };
	s['hero'].magicImmune = false;
	void cursedSandals;

	// --- the chalice heals instead of charging, and the rose charges while no ghost is up ---
	// At +10 the chalice's own heal formula is deterministic (`healDelay = (10 - (1.33+6.67))/1 = 2`,
	// so `heal = 2.5` - always at least 2), where a +0 chalice rolls for a 0-or-1 heal per turn.
	bag.add({ id: 'chalice', quantity: 1, identified: true, instanceId: 'chalice-recharge', level: 10 });
	s['hero'].hp = Math.max(1, s['hero'].maxHp - 20);
	const hpBefore = s['hero'].hp;
	s['applyArtifactRecharge'](1);
	const chalice = { hpBefore, hpAfter: s['hero'].hp };
	bag.add({ id: 'rose', quantity: 1, identified: true, instanceId: 'rose-recharge', level: 0, charge: 0, partialCharge: 0 });
	s['applyArtifactRecharge'](1);
	const rose = { charge: bag.find('rose', 'rose-recharge').charge ?? 0 };

	await sleep(50);
	return { before, afterCast, chargeBeforeTicks, afterTicks, cursedBlocked, immuneBlocked, chalice, rose };
});

console.log('probe results:', JSON.stringify(probe, null, 1));
const expect = [
	// Ten, not eight: the cast's own four-turn advance (4 x rate 2) plus the point the spell's own
	// spent turn hands the fresh timer (`min(1, left)` x rate 2).
	['the cast advances a rate-2 artifact (Sandals) by four turns of its own hook, plus its turn',
		probe.afterCast.sandals === probe.before.sandals + 10],
	['and the Talisman, which shares that rate, by the same',
		probe.afterCast.talisman === probe.before.talisman + 10],
	['the Alchemists Toolkit banks charge even though it is cursed (its override guards only on AntiMagic)',
		probe.afterCast.toolkit === probe.before.toolkit + 1],
	['the eight-turn timer starts with the cast, less the turn the cast itself spent',
		probe.afterCast.timer === 7],
	['and the spell is consumed', probe.afterCast.wildEnergyGone === true],
	['and its remaining seven ticks hand the hooks another point each, then it expires',
		probe.afterTicks.sandals === probe.chargeBeforeTicks.sandals + 14
		&& probe.afterTicks.talisman === probe.chargeBeforeTicks.talisman + 14
		&& probe.afterTicks.timer === 0],
	['a cursed artifact outside the toolkit banks nothing', probe.cursedBlocked.charge === 0],
	['and AntiMagic stops the toolkit too', probe.immuneBlocked.toolkit === 0],
	['the Chalice heals the hero instead of charging', probe.chalice.hpAfter > probe.chalice.hpBefore],
	['and the Rose charges while no ghost is up', probe.rose.charge >= 4],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`recharge livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
