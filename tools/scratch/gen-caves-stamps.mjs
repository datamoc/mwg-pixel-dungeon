// Throwaway (tools/scratch): emits the Caves boss entrance/corner tile stamps as TypeScript.
//
// `CavesBossLevel.buildEntrance()`/`buildCorners()` each pick one of four stamps with
// `Random.oneOf` and mirror it into the map around the entrance point. The stamps are 656 tiles
// between them, so they are generated from the Java source rather than hand-transcribed - a
// typo in one tile would be invisible until someone compared the two maps cell by cell.
//
//   node tools/scratch/gen-caves-stamps.mjs
//
// Legend: `.` = `n` (leave the tile alone), `#` = WALL, `_` = EMPTY, `,` = EMPTY_SP.
import { execFileSync } from 'node:child_process';

const TAG = 'v3.3.8';
const FILE = 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/CavesBossLevel.java';
const source = execFileSync('git', ['-C', process.env.SPD_CHECKOUT ?? 'C:/Users/miche/dev/shattered-pixel-dungeon',
	'show', `refs/tags/${TAG}:${FILE}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

const LEGEND = { n: '.', W: '#', e: '_', s: ',' };

function stamp(name) {
	const match = source.match(new RegExp(`short\\[\\]\\s+${name}\\s*=\\s*\\{([^}]*)\\}`, 's'));
	if (!match) throw new Error(`stamp ${name} not found`);
	const tiles = match[1].split(',').map((token) => token.trim()).filter(Boolean);
	const unknown = [...new Set(tiles.filter((t) => !(t in LEGEND)))];
	if (unknown.length) throw new Error(`${name}: unknown tile symbols ${unknown.join(', ')}`);
	const size = name.startsWith('entrance') ? 8 : 10;
	if (tiles.length % size !== 0) throw new Error(`${name}: ${tiles.length} tiles is not a multiple of ${size}`);
	const rows = [];
	for (let i = 0; i < tiles.length; i += size) rows.push(tiles.slice(i, i + size).map((t) => LEGEND[t]).join(''));
	return rows;
}

for (const group of [['entrance', 4], ['corner', 4]]) {
	const [prefix, count] = group;
	for (let i = 1; i <= count; i++) {
		const rows = stamp(`${prefix}${i}`);
		// the flat string is what the port embeds (its width is the known stamp size); the
		// per-row dump beside it is for eyeballing against the Java source
		console.log(`\t'${rows.join('')}', // ${prefix}${i}, ${rows.length} rows of ${rows[0].length}`);
		for (const row of rows) console.log(`\t//   ${row}`);
	}
}
