// Throwaway: where do Java's BOSS_SLAIN / GAME_OVER banner sprites sit in this port's
// src/assets/banners.png? The port's title art is a custom redraw, so these have to be measured.
//
// Modes (`node tools/scratch/banner-match.mjs [map|boxes]`):
//   (default)  exact-pixel search for each Java `BannerSprites` frame in the port's sheet
//   map        a coarse alpha map of the port's sheet, to read its layout
//   boxes      the port's sheet components plus a silhouette-IoU comparison per Java frame
//
// Result on 2026-09-12, recorded in PORT_COVERAGE.md: no exact match for any of them, and no
// silhouette match either - the port's sheet carries its own three text bands (114x38 at (4,107),
// 76x31 at (19,145), 111x26 at (7,178)) which are not Java's 127x68 `BOSS_SLAIN` or 128x35
// `GAME_OVER` at any scale. So `ui/Banner` needs those two sprites cut from Java's own sheet first.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const SPD_ROOT = process.env.SPD_ROOT ?? 'C:\\Users\\miche\\dev\\shattered-pixel-dungeon';
const TAG = process.env.TAG ?? 'v3.3.8';
const javaPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'banner-match-')), 'java-banners.png');
fs.writeFileSync(javaPath, execFileSync('git', ['-C', SPD_ROOT, 'show', `${TAG}:core/src/main/assets/interfaces/banners.png`], { maxBuffer: 1 << 26 }));

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
	return { width, height, channels, data: out,
		rgba: (x, y) => {
			const i = (y * width + x) * channels;
			return [out[i], out[i + 1], out[i + 2], channels === 4 ? out[i + 3] : 255];
		},
	};
}

const javaSheet = decode(javaPath);
const portSheet = decode('src/assets/banners.png');
console.log(`java banners.png ${javaSheet.width}x${javaSheet.height}, port banners.png ${portSheet.width}x${portSheet.height}`);

if (process.argv[2] === 'assets') {
	// the two sprites `ui/banner.ts` draws were cut out of Java's own sheet rather than redrawn:
	// this is the check that they are *exactly* the regions `BannerSprites.get()` asks for, since
	// "cut from Java's sheet" is otherwise an unverifiable claim in a comment
	let bad = 0;
	for (const [name, file, [x, y, w, h]] of [
		['BOSS_SLAIN', 'src/assets/banner_boss_slain.png', [0, 157, 127, 68]],
		['GAME_OVER', 'src/assets/banner_game_over.png', [128, 157, 128, 35]],
	]) {
		const cut = decode(file);
		let diff = 0;
		for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
			const a = javaSheet.rgba(x + dx, y + dy), b = cut.rgba(dx, dy);
			if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3]) diff++;
		}
		const ok = cut.width === w && cut.height === h && diff === 0;
		if (!ok) bad++;
		console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${file}: ${cut.width}x${cut.height} vs java rect ${w}x${h}, ${diff} differing pixels`);
	}
	process.exit(bad ? 1 : 0);
}

if (process.argv[2] === 'map') {
	// 1 char per 2x2 block of the port's own sheet, so its layout can be read
	for (let y = 0; y < portSheet.height; y += 2) {
		let row = String(y).padStart(3, ' ') + ' ';
		for (let x = 0; x < portSheet.width; x += 2) {
			let opaque = 0;
			for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (portSheet.rgba(x + dx, y + dy)[3] > 16) opaque++;
			row += opaque === 4 ? '#' : opaque > 0 ? '+' : '.';
		}
		console.log(row);
	}
	process.exit(0);
}

if (process.argv[2] === 'boxes') {
	/** opaque bounding boxes of a sheet (4-neighbour components, alpha > 16) */
	const boxes = (sheet, minPixels = 40) => {
		const seen = new Uint8Array(sheet.width * sheet.height);
		const out = [];
		for (let y = 0; y < sheet.height; y++) for (let x = 0; x < sheet.width; x++) {
			if (seen[y * sheet.width + x] || sheet.rgba(x, y)[3] <= 16) continue;
			let minX = x, maxX = x, minY = y, maxY = y, count = 0;
			const queue = [[x, y]];
			seen[y * sheet.width + x] = 1;
			while (queue.length) {
				const [cx, cy] = queue.pop();
				count++;
				if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
				if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
				for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
					const nx = cx + dx, ny = cy + dy;
					if (nx < 0 || ny < 0 || nx >= sheet.width || ny >= sheet.height) continue;
					if (seen[ny * sheet.width + nx] || sheet.rgba(nx, ny)[3] <= 16) continue;
					seen[ny * sheet.width + nx] = 1;
					queue.push([nx, ny]);
				}
			}
			if (count >= minPixels) out.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, count });
		}
		return out.sort((a, b) => a.y - b.y || a.x - b.x);
	};
	/** how alike two regions are, as opaque coverage over a 24x24 grid (1 = identical silhouette) */
	const shape = (sheet, x, y, w, h) => {
		const cells = new Array(24 * 24).fill(0);
		const total = new Array(24 * 24).fill(0);
		for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
			const gx = Math.min(23, Math.floor(dx * 24 / w));
			const gy = Math.min(23, Math.floor(dy * 24 / h));
			total[gy * 24 + gx]++;
			if (sheet.rgba(x + dx, y + dy)[3] > 16) cells[gy * 24 + gx]++;
		}
		return cells.map((v, i) => (total[i] ? v / total[i] : 0));
	};
	const iou = (a, b) => {
		let inter = 0, union = 0;
		for (let i = 0; i < a.length; i++) {
			const av = a[i] > 0.5 ? 1 : 0, bv = b[i] > 0.5 ? 1 : 0;
			if (av && bv) inter++;
			if (av || bv) union++;
		}
		return union ? inter / union : 0;
	};
	const javaBoxes = { BOSS_SLAIN: [0, 157, 127, 68], GAME_OVER: [128, 157, 128, 35], TITLE_PORT: [0, 0, 139, 100] };
	const portBoxes = boxes(portSheet).filter((b) => b.count > 120);
	console.log('port sheet components:', JSON.stringify(portBoxes));
	for (const [name, [jx, jy, jw, jh]] of Object.entries(javaBoxes)) {
		const javaShape = shape(javaSheet, jx, jy, jw, jh);
		const scored = portBoxes.map((b) => ({ ...b, iou: +iou(javaShape, shape(portSheet, b.x, b.y, b.w, b.h)).toFixed(3) }));
		scored.sort((a, b) => b.iou - a.iou);
		console.log(`${name} java(${jx},${jy},${jw},${jh}) best port matches: ${scored.slice(0, 3).map((s) => `(${s.x},${s.y},${s.w},${s.h}) iou=${s.iou}`).join('  ')}`);
	}
	process.exit(0);
}


function find(java, x, y, w, h) {
	const hits = [];
	for (let py = 0; py + h <= portSheet.height; py++) {
		for (let px = 0; px + w <= portSheet.width; px++) {
			let ok = true;
			for (let dy = 0; dy < h && ok; dy++) {
				for (let dx = 0; dx < w; dx++) {
					const a = java.rgba(x + dx, y + dy), b = portSheet.rgba(px + dx, py + dy);
					if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3]) { ok = false; break; }
				}
			}
			if (ok) hits.push({ x: px, y: py });
		}
	}
	return hits;
}

for (const [name, [x, y, w, h]] of Object.entries({
	//Java's `BannerSprites.get()` frames, as `uvRect` corner pairs (interfaces/banners.png, 512x256)
	BOSS_SLAIN: [0, 157, 127, 68],
	GAME_OVER: [128, 157, 128, 35],
	TITLE_PORT: [0, 0, 139, 100],
})) {
	//exact pixels first: that is the only way a region can be *confirmed* rather than guessed at
	const hits = find(javaSheet, x, y, w, h);
	console.log(`${name} java(${x},${y},${w},${h}) -> port ${hits.length ? hits.map((p) => `(${p.x},${p.y})`).join(' ') : 'NO EXACT MATCH'}   (run with \`boxes\` to compare silhouettes)`);
}
