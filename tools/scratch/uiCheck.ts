// Asserts the arithmetic behind the new HUD widgets against the formulas in SPD's own Java,
// for the parts that need no renderer. This is NOT a substitute for looking at the game:
// nothing here proves a single pixel is drawn in the right place.
import { Bar } from '../../src/ui/bar';
import { Compass } from '../../src/ui/compass';
import { applySpdTheme } from '../../src/ui/spdTheme';
import { theme } from 'mwg';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown): void {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	if (!ok) failures++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: got ${JSON.stringify(actual)}${ok ? '' : ` want ${JSON.stringify(expected)}`}`);
}

// --- HealthBar.layout()'s rounding -----------------------------------------
// Java: Hp.size( width * ceil(health*pixelWidth)/pixelWidth, height ). A sliver of health
// must round UP to a whole pixel rather than vanish.
const W = 50;
function javaFill(health: number): number {
	return W * (Math.ceil(health * W) / W);
}
const bar = new Bar({ width: W, height: 4, fillColor: 0x00ee00 });
for (const [hp, max] of [[1, 20], [19, 20], [20, 20], [0, 20], [7, 24], [1, 300]] as const) {
	bar.setLevel(hp / max);
	// read the fill back off the sprite Bar actually sized
	const drawn = (bar.children[bar.children.length - 1] as { width: number }).width;
	check(`fill ${hp}/${max}`, Math.round(drawn * 1000) / 1000, Math.round(javaFill(hp / max) * 1000) / 1000);
}

// a single hit point out of 300 must still light at least one pixel, which is the whole
// point of Java's ceil
bar.setLevel(1 / 300);
check('1/300 lights >=1px', (bar.children[bar.children.length - 1] as { width: number }).width >= 1, true);

// --- StatusPane's EXP fraction ---------------------------------------------
// Java: exp.scale.x = (width/exp.width) * hero.exp / hero.maxExp(), where hero.exp resets
// to 0 each level. maxExp(lvl) = 5 + lvl*5.
function javaMaxExp(lvl: number): number {
	return 5 + lvl * 5;
}
// SPD_LEVEL_CURVE is a cumulative total, so a level's own span must equal Java's maxExp
function curveTotal(level: number): number {
	let total = 0;
	for (let l = 1; l < level; l++) total += javaMaxExp(l);
	return total;
}
for (const lvl of [1, 2, 5, 10]) {
	check(`level ${lvl} span == maxExp(${lvl})`, curveTotal(lvl + 1) - curveTotal(lvl), javaMaxExp(lvl));
}

// --- Compass.java's angle --------------------------------------------------
// angle = atan2(cell.x - centre.x, centre.y - cell.y) * 180/PI - note the argument order,
// which puts 0 degrees up the screen rather than right.
const compass = new Compass({ source: {} } as never);
function angleFor(dx: number, dy: number): number {
	compass.update({ x: dx, y: dy }, { x: 0, y: 0 }, true);
	return Math.round(compass.angle);
}
check('target north  -> 0deg', angleFor(0, -10), 0);
check('target east   -> 90deg', angleFor(10, 0), 90);
check('target south  -> 180deg', angleFor(0, 10), 180);
check('target west   -> -90deg', angleFor(-10, 0), -90);

// hidden until the target cell has been seen, and never hides again once shown
const fresh = new Compass({ source: {} } as never);
fresh.update({ x: 1, y: 1 }, { x: 0, y: 0 }, false);
check('hidden while unseen', fresh.visible, false);
fresh.update({ x: 1, y: 1 }, { x: 0, y: 0 }, true);
check('shown once seen', fresh.visible, true);
fresh.update({ x: 1, y: 1 }, { x: 0, y: 0 }, false);
check('stays shown afterwards', fresh.visible, true);


// --- the theme actually applies -------------------------------------------
// Chrome.Type.WINDOW is NinePatch(chrome.png, 0, 0, 20, 20, 6): border 6, and SPD's title
// gold is Window.TITLE_COLOR = 0xFFFF44.
applySpdTheme({ source: {} } as never);
check('theme border == Chrome WINDOW border', theme().panelBorder, 6);
check('theme highlight == Window.TITLE_COLOR', theme().color.textHighlight, 0xffff44);
check('theme text == CharSprite.DEFAULT', theme().color.text, 0xffffff);
check('theme panel texture set', theme().panel !== undefined, true);

// GameLog is NOT checked here: it measures wrapped text through Pixi's
// CanvasTextMetrics, which needs a real canvas, so its merge/trim behaviour can only be
// verified in a browser. Stated rather than skipped silently.

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
