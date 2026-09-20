// The DungeonScene's source is split across scenes/dungeonScene.ts and the method groups in scenes/dungeon/.
// The harness cannot load it (Pixi), so several suites pin call sites at source level; they read the whole
// scene through here so a pin survives methods moving between the class and its groups.
import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../src/scenes/', import.meta.url);

/** dungeonScene.ts followed by every file in scenes/dungeon/, joined with a newline, LF line endings. */
export function readSceneSource() {
	const parts = [readFileSync(new URL('dungeonScene.ts', root), 'utf8')];
	const dir = new URL('dungeon/', root);
	for (const name of readdirSync(dir).filter((file) => file.endsWith('.ts')).sort()) parts.push(readFileSync(new URL(name, dir), 'utf8'));
	//the pins are written against LF; a Windows checkout may hand back CRLF
	return parts.join('\n').replace(/\r\n/g, '\n');
}
