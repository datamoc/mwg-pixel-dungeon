// Throwaway: find where a region of Java's `interfaces/icons.png` sits in this port's
// `src/assets/ui_icons.png`, by matching alpha bitmaps. The port's sheet is hand-packed (its rows
// are not Java's), so a region's coordinates have to be measured, not derived. This is how
// `src/ui/titleIcons.ts`'s `challenge`/`displayPort`/`displayLand` regions were located and how
// that claim can be re-checked: run `node tools/scratch/icons-match.mjs`.
//
// The Java sheet is read straight out of the SPD checkout (`git show <tag>:<path>`, so the working
// tree's own version does not matter); pass `SPD_ROOT=<path> [TAG=<tag>]` to point it elsewhere.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const SPD_ROOT = process.env.SPD_ROOT ?? 'C:\\Users\\miche\\dev\\shattered-pixel-dungeon';
const TAG = process.env.TAG ?? 'v3.3.8';
const JAVA_SHEET = 'core/src/main/assets/interfaces/icons.png';
const javaSheetPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'icons-match-')), 'java-icons.png');
fs.writeFileSync(javaSheetPath, execFileSync('git', ['-C', SPD_ROOT, 'show', `${TAG}:${JAVA_SHEET}`], { maxBuffer: 1 << 26 }));

function decode(file) {
	const buf = fs.readFileSync(file);
	const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20);
	const channels = buf[25] === 6 ? 4 : 3;
	const idat = [];
	for (let off = 8; off < buf.length;) {
		const len = buf.readUInt32BE(off);
		if (buf.toString('ascii', off + 4, off + 8) === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
		off += 12 + len;
	}
	const raw = zlib.inflateSync(Buffer.concat(idat));
	const stride = width * channels;
	const out = Buffer.alloc(height * stride);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
		for (let x = 0; x < stride; x++) {
			const a = x >= channels ? out[y * stride + x - channels] : 0;
			const b = y > 0 ? out[(y - 1) * stride + x] : 0;
			const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
			let v = line[x];
			if (filter === 1) v += a; else if (filter === 2) v += b;
			else if (filter === 3) v += (a + b) >> 1;
			else if (filter === 4) {
				const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
				v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
			}
			out[y * stride + x] = v & 0xff;
		}
	}
	return {
		width, height, channels,
		// a 1-bit opacity fingerprint: what the art's silhouette is, which is what identifies it
		mask: (x, y) => (out[(y * width + x) * channels + (channels === 4 ? 3 : 0)] > 16 ? 1 : 0),
		// the colour, for reporting whether a match is the same art rather than a silhouette twin
		rgb: (x, y) => {
			const i = (y * width + x) * channels;
			return [out[i], out[i + 1], out[i + 2]];
		},
	};
}

const javaSheet = decode(javaSheetPath);
const portSheet = decode('src/assets/ui_icons.png');

/** matches a Java region against the port sheet; returns every offset with an identical mask+colour */
function find(java, x, y, w, h) {
	const hits = [];
	for (let py = 0; py + h <= portSheet.height; py++) {
		for (let px = 0; px + w <= portSheet.width; px++) {
			let ok = true;
			for (let dy = 0; dy < h && ok; dy++) {
				for (let dx = 0; dx < w; dx++) {
					if (java.mask(x + dx, y + dy) !== portSheet.mask(px + dx, py + dy)) { ok = false; break; }
				}
			}
			if (!ok) continue;
			for (let dy = 0; dy < h && ok; dy++) {
				for (let dx = 0; dx < w; dx++) {
					if (!java.mask(x + dx, y + dy)) continue;
					const a = java.rgb(x + dx, y + dy), b = portSheet.rgb(px + dx, py + dy);
					if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) { ok = false; break; }
				}
			}
			if (ok) hits.push({ x: px, y: py });
		}
	}
	return hits;
}

const regions = {
	// Java's `Icons.java` `uvRectBySize` coordinates, taken at 1x (this checkout's icons.png is 256x128)
	ENTER: [0, 0, 16, 16],
	PREFS: [102, 0, 14, 14],
	RANKINGS: [34, 0, 17, 16],
	EXIT: [0, 16, 15, 11],
	DISPLAY_PORT: [16, 16, 12, 16],
	DISPLAY_LAND: [32, 16, 16, 12],
	LANGS: [80, 16, 14, 11],
	CHALLENGE_COLOR: [144, 32, 15, 12],
};
for (const [name, [x, y, w, h]] of Object.entries(regions)) {
	const hits = find(javaSheet, x, y, w, h);
	console.log(`${name} java(${x},${y},${w},${h}) -> port ${hits.length ? hits.map((p) => `(${p.x},${p.y})`).join(' ') : 'NO MATCH'}`);
}
