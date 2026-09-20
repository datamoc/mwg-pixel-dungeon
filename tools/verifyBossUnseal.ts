// Pins the Sewer boss exit fix: `SewerBossExitRoom` paints the exit LOCKED_EXIT and never converts
// it, so the port must turn that niche into a walkable EXIT when Goo dies (and again on reload
// repair) - otherwise the run dead-ends on depth 5. Run through `npm run test:bossunseal`.
import { Terrain, type PaintLevel } from '../src/spdLevelGen/paintLevel';
import { applyGooDeathUnseal, repairBossUnsealStairs, unlockPaintedExit, type BossUnsealContext } from '../src/scenes/bossUnseal';

let failed = 0;
const check = (name: string, ok: boolean, detail = ''): void => {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ` - ${detail}`}`);
	if (!ok) failed++;
};

const W = 10, H = 6;
function makeContext(depth: number, unsealed: number[]) {
	const map = new Array<number>(W * H).fill(Terrain.WALL);
	const exit = { x: 4, y: 2 };
	map[exit.y * W + exit.x] = Terrain.LOCKED_EXIT;
	const floor = new Set<number>();
	const opened: { at: { x: number; y: number }; draw?: boolean }[] = [];
	const marked = new Set<number>(unsealed);
	const ctx: BossUnsealContext = {
		depth, width: W,
		paint: { map } as unknown as PaintLevel,
		entrance: null,
		inside: (x, y) => x >= 0 && y >= 0 && x < W && y < H,
		markUnsealed: (d) => { marked.add(d); },
		wasUnsealed: (d) => marked.has(d),
		makeFloor: (x, y) => { floor.add(y * W + x); },
		restitch: () => undefined, refreshTerrain: () => undefined, refreshWater: () => undefined,
		placeDoor: () => undefined,
		openStairs: (at, draw) => { opened.push({ at, draw }); },
		clearCavesEnergy: () => undefined, refreshCavesArena: () => undefined, refreshHallsCenter: () => undefined,
		impShopDue: () => false, spawnImpShop: () => undefined,
	};
	return { ctx, map, exit, floor, opened, marked };
}

{
	const { ctx, map, exit, floor } = makeContext(5, []);
	const at = unlockPaintedExit(ctx);
	check('the locked sewer exit resolves to its own cell', at?.x === exit.x && at?.y === exit.y);
	check('the paint now holds a real EXIT there', map[exit.y * W + exit.x] === Terrain.EXIT);
	check('the collision grid treats it as floor', floor.has(exit.y * W + exit.x));
	check('a second call is idempotent', unlockPaintedExit(ctx)?.x === exit.x && map.filter((v) => v === Terrain.EXIT).length === 1);
}
{
	const { ctx, exit, opened, marked } = makeContext(5, []);
	applyGooDeathUnseal(ctx);
	check('Goo\'s death marks depth 5 unsealed', marked.has(5));
	check('Goo\'s death opens the stairs at the exit', opened.length === 1 && opened[0].at.x === exit.x && opened[0].at.y === exit.y);
}
{
	const { ctx, exit, opened } = makeContext(5, [5]);
	repairBossUnsealStairs(ctx);
	check('a reload onto the unsealed floor restores the stairs without redrawing the sprite', opened.length === 1 && opened[0].at.x === exit.x && opened[0].draw === false);
}
{
	const { ctx, opened } = makeContext(5, []);
	repairBossUnsealStairs(ctx);
	check('no stairs are repaired onto a floor whose boss is still alive', opened.length === 0);
}
if (failed > 0) { console.error(`${failed} boss-unseal check(s) failed`); process.exit(1); }
console.log('All boss-unseal checks passed.');
