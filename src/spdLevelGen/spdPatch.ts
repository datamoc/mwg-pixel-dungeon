/**
 * `levels/Patch.java`'s cellular-automaton generator, wired to this module's real per-floor
 * `SpdRandom` generator (unlike `main.ts`'s `patchGenerate`, which the live game currently drives
 * off `mwg`'s own generic `Random` - see that function's call sites for context). `PatchRoom.
 * setupPatch()` (`CircleBasinRoom`/`BurnedRoom`) needs the *real* seeded stream to stay
 * RNG-order-faithful, so this is a second, SpdRandom-backed port of the same algorithm rather than
 * a shared import - the two happen to be identical translations of the same Java source.
 */
import { SpdRandom } from '../spdRng';

export function spdPatchGenerate(w: number, h: number, fill: number, clustering: number, forceFillRate: boolean): boolean[] {
	const length = w * h;
	let cur = new Array<boolean>(length).fill(false);
	let off = new Array<boolean>(length).fill(false);

	let fillDiff = -Math.round(length * fill);
	const seedFill = forceFillRate && clustering > 0 ? fill + (0.5 - fill) * 0.5 : fill;

	for (let i = 0; i < length; i++) {
		off[i] = SpdRandom.float() < seedFill;
		if (off[i]) fillDiff++;
	}

	for (let pass = 0; pass < clustering; pass++) {
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const pos = x + y * w;
				let count = 0;
				let neighbours = 0;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const nx = x + dx, ny = y + dy;
						if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
						neighbours++;
						if (off[nx + ny * w]) count++;
					}
				}
				cur[pos] = 2 * count >= neighbours;
				if (cur[pos] !== off[pos]) fillDiff += cur[pos] ? 1 : -1;
			}
		}
		[cur, off] = [off, cur];
	}

	if (forceFillRate && Math.min(w, h) > 2) {
		const neighbourOffsets9 = [-w - 1, -w, -w + 1, -1, 0, 1, w - 1, w, w + 1];
		const growing = fillDiff < 0;
		let guard = 0;

		while (fillDiff !== 0 && guard++ < length * 10) {
			let cell = 0;
			let tries = 0;
			do {
				cell = SpdRandom.intRange0(1, w - 1) + SpdRandom.intRange0(1, h - 1) * w;
				tries++;
			} while (off[cell] !== growing && tries * 10 < length);

			for (const n of neighbourOffsets9) {
				const at = cell + n;
				if (fillDiff !== 0 && at >= 0 && at < length && off[at] !== growing) {
					off[at] = growing;
					fillDiff += growing ? 1 : -1;
				}
			}
		}
	}

	return off;
}
