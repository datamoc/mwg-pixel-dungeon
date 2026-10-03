#!/usr/bin/env node
/**
 * BACKLOG B4 (coord T58): threshold-diff of fresh captures against the
 * committed `tools/parity/screenshots/` baseline. Pure Node (zlib only), no
 * browser: capture with `captureVisualBaseline.mjs`, then run this.
 *
 *   node tools/compareScreenshots.mjs [--dir tools/parity/screenshots] [--new <fresh-dir>] [--threshold 0.01] [--update]
 *
 * Exit code is 1 when any image differs beyond `--threshold` (fraction of
 * pixels) or a file is missing/mismatched in size. `--update` copies the
 * fresh captures over the baseline (review the PNGs first - read them).
 */
import { inflateSync } from 'node:zlib';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Decode a non-interlaced PNG (colour types 2/6, bit depth 8) to RGBA bytes. */
export function decodePng(buf) {
	const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20);
	const colorType = buf[25], interlace = buf[28];
	if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported colour type ${colorType}`);
	if (buf[24] !== 8 || interlace !== 0) throw new Error('only 8-bit non-interlaced PNGs');
	const channels = colorType === 2 ? 3 : 4;
	let pos = 33;
	const chunks = [];
	while (pos < buf.length) {
		const len = buf.readUInt32BE(pos);
		const type = buf.toString('latin1', pos + 4, pos + 8);
		if (type === 'IDAT') chunks.push(buf.subarray(pos + 8, pos + 8 + len));
		pos += 12 + len;
	}
	const raw = inflateSync(Buffer.concat(chunks));
	const stride = width * channels;
	const out = Buffer.alloc(width * height * 4);
	let p = 0;
	for (let y = 0; y < height; y++) {
		const filter = raw[p++];
		const row = p;
		for (let x = 0; x < width; x++) {
			for (let c = 0; c < 4; c++) {
				const v = c < channels ? raw[row + x * channels + c] : 255;
				let recon = v;
				const a = x > 0 ? out[(y * width + x - 1) * 4 + c] : 0;
				const b = y > 0 ? out[((y - 1) * width + x) * 4 + c] : 0;
				const cc = x > 0 && y > 0 ? out[((y - 1) * width + x - 1) * 4 + c] : 0;
				if (filter === 1) recon = (v + a) & 255;
				else if (filter === 2) recon = (v + b) & 255;
				else if (filter === 3) recon = (v + ((a + b) >> 1)) & 255;
				else if (filter === 4) {
					const pp = a + b - cc, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - cc);
					recon = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc)) & 255;
				}
				out[(y * width + x) * 4 + c] = recon;
			}
		}
		p = row + stride;
	}
	return { width, height, pixels: out };
}

function args(argv) {
	const a = { dir: join(ROOT, 'tools', 'parity', 'screenshots'), fresh: null, threshold: 0.01, update: false };
	for (let i = 0; i < argv.length; i++) {
		const k = argv[i];
		if (k === '--dir') a.dir = resolve(argv[++i]);
		else if (k === '--new') a.fresh = resolve(argv[++i]);
		else if (k === '--threshold') a.threshold = Number(argv[++i]);
		else if (k === '--update') a.update = true;
	}
	return a;
}

const a = args(process.argv.slice(2));
const names = ['01-title.png', '02-select.png', '03-spawn.png'];
let failed = false;
for (const name of names) {
	const ref = join(a.dir, name);
	const cur = join(a.fresh ?? a.dir, name);
	if (!existsSync(ref)) { console.log(`FAIL ${name} - no committed baseline`); failed = true; continue; }
	if (a.fresh && !existsSync(cur)) { console.log(`FAIL ${name} - no fresh capture`); failed = true; continue; }
	const r = decodePng(readFileSync(ref));
	if (!a.fresh) { console.log(`ok ${name} (${r.width}x${r.height}, baseline present)`); continue; }
	const c = decodePng(readFileSync(cur));
	if (r.width !== c.width || r.height !== c.height) {
		console.log(`FAIL ${name} - size differs (${r.width}x${r.height} vs ${c.width}x${c.height})`);
		failed = true; continue;
	}
	let diff = 0;
	for (let i = 0; i < r.pixels.length; i += 4) {
		if (r.pixels[i] !== c.pixels[i] || r.pixels[i + 1] !== c.pixels[i + 1]
			|| r.pixels[i + 2] !== c.pixels[i + 2] || r.pixels[i + 3] !== c.pixels[i + 3]) diff++;
	}
	const frac = diff / (r.width * r.height);
	const ok = frac <= a.threshold;
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name} - ${diff} px differ (${(frac * 100).toFixed(2)}%, threshold ${(a.threshold * 100).toFixed(2)}%)`);
	if (!ok) failed = true;
	else if (a.update) { mkdirSync(a.dir, { recursive: true }); copyFileSync(cur, ref); }
}
process.exit(failed ? 1 : 0);
