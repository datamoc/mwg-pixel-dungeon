// The DungeonScene's source is split across scenes/dungeonScene.ts and the method groups in scenes/dungeon/.
// The harness cannot load it (Pixi), so several suites pin call sites at source level; they read the whole
// scene through here so a pin survives methods moving between the class, its groups, and its subdirectories.
import { readdirSync, readFileSync, statSync } from 'node:fs';

const root = new URL('../src/scenes/', import.meta.url);

/** dungeonScene.ts followed by every .ts under scenes/dungeon/ (subdirectories included), joined with a newline, LF line endings. */
export function readSceneSource() {
	const parts = [readFileSync(new URL('dungeonScene.ts', root), 'utf8')];
	parts.push(...walk(new URL('dungeon/', root)));
	//the pins are written against LF; a Windows checkout may hand back CRLF
	return parts.join('\n').replace(/\r\n/g, '\n');
}

/** every .ts under dir, descending into subdirectories, in sorted path order. */
function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir).sort()) {
		const child = new URL(name, dir);
		if (statSync(child).isDirectory()) out.push(...walk(new URL(`${name}/`, dir)));
		else if (name.endsWith('.ts')) out.push(readFileSync(child, 'utf8'));
	}
	return out;
}
