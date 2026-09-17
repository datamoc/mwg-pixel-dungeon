// Throwaway (tools/scratch): blessed-ankh loop - BLESS consumes a full waterskin and flags
// the ankh, and dying with a blessed ankh revives on the spot at quarter health instead of
// ending the run. Unblessed rescue (WndResurrect) is separate roadmap work and is NOT covered.
//
// Run after `npm run build`:  node tools/scratch/ankh-bless-revive-livecheck.mjs
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
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=ankh-revive', { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 6;
	s['enterLevel']();
	await sleep(3500);
	const logText = () => (s['gameLog']?.['blocks'] ?? []).map((block) => block.text ?? block.label?.text ?? '').join('\n');

	// refusal first: a thirsty hero cannot bless
	s['bag'].add({ id: 'ankh', quantity: 1 });
	s['waterskin'] = 0;
	s['useAnkh']();
	await sleep(300);
	const refused = logText().includes('outre') || logText().includes('waterskin');
	const stillUnblessed = s['bag'].find('ankh')?.blessed !== true;

	// the rite: full waterskin, one ankh, one turn
	s['waterskin'] = 20;
	s['useAnkh']();
	await sleep(300);
	const blessed = s['bag'].find('ankh')?.blessed === true;
	const emptied = s['waterskin'] === 0;
	const blessLogged = /bénis|bless/i.test(logText());

	// death with a blessed ankh: revive at a quarter health, shield up, run continues
	s['hero'].buffs['poison'] = 10;
	s['hero'].hp = 1;
	s['kill'](s['hero']);
	await sleep(400);
	const revive = {
		alive: s['hero'].hp > 0,
		hp: s['hero'].hp,
		quarter: Math.floor(s['hero'].maxHp / 4),
		noGameOver: s['gameOver'] !== true,
		ankhGone: (s['bag'].find('ankh')?.quantity ?? 0) === 0,
		cured: s['hero'].buffs['poison'] == null,
		shielded: (s['hero'].buffs['invulnerability'] ?? 0) > 0,
		reviveLogged: /ankh|énergie|energy/i.test(logText()),
		negated: s['absorbHeroDamage'](10) === 0,
	};
	return { refused, stillUnblessed, blessed, emptied, blessLogged, revive };
});
await page.screenshot({ path: 'tools/scratch/ankh-revive.png' });

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['a thirsty hero is refused, ankh stays unblessed', result.refused === true && result.stillUnblessed === true],
	['BLESS flags the ankh and empties a full waterskin', result.blessed === true && result.emptied === true && result.blessLogged === true],
	['death revives at quarter health with the run continuing',
		result.revive.alive === true && result.revive.hp === result.revive.quarter && result.revive.noGameOver === true],
	['the ankh is consumed, poison cured, shield up and logging',
		result.revive.ankhGone === true && result.revive.cured === true && result.revive.shielded === true && result.revive.reviveLogged === true],
	['the shield negates incoming damage', result.revive.negated === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`ankh bless+revive livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
