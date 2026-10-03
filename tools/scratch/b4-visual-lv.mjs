/**
 * B4 live-verification: spawn the newly-clipped variants around the hero,
 * prove their clips exist and play (incl. zap), and screenshot the lineup.
 * Run: npm run build && node tools/browserTest.mjs --url "http://127.0.0.1:PORT/?seed=12345"
 *   is wired by the caller - this script takes an open `game` instead:
 *   node tools/browserTest.mjs --script tools/scratch/b4-visual-lv.mjs -- --url <url>
 * (browserTest serves dist/ itself when no --url is given; pass one with
 * ?seed= for a deterministic floor.)
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (game) => {
	await game.startGame({ hero: 0 });
	const setup = await game.eval(`(() => {
		const hx = scene.hero.x, hy = scene.hero.y, W = scene.level.width, H = scene.level.height;
		const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H
			&& !scene.creatureAt(x, y) && scene.level.passable(x, y);
		const kinds = ['gnollExile', 'hermitCrab', 'dm201', 'mimic', 'crystalMimic',
			'spectralNecromancer', 'causticSlime', 'newbornElemental', 'ratKing', 'dm100'];
		const out = { hero: [hx, hy], spawned: [] };
		const tried = new Set();
		for (const kind of kinds) {
			let placed = null;
			for (let r = 1; r <= 6 && !placed; r++) {
				for (let dy = -r; dy <= r && !placed; dy++) {
					for (let dx = -r; dx <= r && !placed; dx++) {
						if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
						const x = hx + dx, y = hy + dy, k = x + ',' + y;
						if (tried.has(k)) continue;
						tried.add(k);
						if (free(x, y)) {
							// schedulerDelay 999 keeps the lineup still for the shot.
							const m = scene['spawnMonster'](kind, { x, y }, false, undefined, false, undefined, false, undefined, 999);
							placed = [x, y, m.id];
						}
					}
				}
			}
			out.spawned.push([kind, placed]);
		}
		// Functional proof: every spawned sprite owns its clips and plays zap.
		out.clips = out.spawned.map(([kind, placed]) => {
			if (!placed) return [kind, 'NO-CELL'];
			const sprite = scene.spriteFor.get(placed[2]);
			const names = ['idle', 'run', 'attack', 'die', 'zap'].filter((n) => sprite.has(n));
			if (sprite.has('zap')) sprite.play('zap', true);
			return [kind, names.join('+'), sprite.playing];
		});
		return out;
	})()`);
	console.log('setup: ' + JSON.stringify(setup));
	// Let the descent transition finish (startGame resolves while it plays).
	await sleep(3500);
	await game.screenshot('tools/scratch/b4-variants.png');
	const after = await game.eval(`(() => {
		const out = [];
		for (const id of scene.spriteFor.keys()) out.push(scene.spriteFor.get(id).playing);
		return out.slice(0, 14);
	})()`);
	console.log('playing after shot: ' + JSON.stringify(after));
	const errors = game.consoleErrors();
	if (errors.length > 0) console.error('console errors:\n' + errors.slice(0, 5).join('\n'));
};
