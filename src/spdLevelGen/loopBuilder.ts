/** Port of `levels/builders/LoopBuilder.java`. */
import { Room } from './room';
import { findNeighbours, placeRoom, angleBetweenPoints, angleBetweenRooms } from './builder';
import { RegularBuilder } from './regularBuilder';
import { createConnectionRoom } from './connectionRoom';
import { SpdRandom } from '../spdRng';

export class LoopBuilder extends RegularBuilder {
	private curveExponent = 0;
	private curveIntensity = 1;
	private curveOffset = 0;
	private loopCenter: { x: number; y: number } | null = null;

	setLoopShape(exponent: number, intensity: number, offset: number): this {
		// Java: `curveIntensity`/`curveOffset` are `float` fields, `intensity`/`offset` `float` params.
		this.curveExponent = Math.abs(exponent);
		this.curveIntensity = Math.fround(intensity % 1);
		this.curveOffset = Math.fround(offset % 0.5);
		return this;
	}

	/** `curveEquation(double x)`: stays `double`-precision throughout in Java - no fround needed. */
	private curveEquation(x: number): number {
		return Math.pow(4, 2 * this.curveExponent) * Math.pow((x % 0.5) - 0.25, 2 * this.curveExponent + 1)
			+ 0.25 + 0.5 * Math.floor(2 * x);
	}

	/**
	 * `targetAngle(float percentAlong)`: `percentAlong += curveOffset` narrows (float+=float);
	 * `curveIntensity*curveEquation(...)` promotes to `double` (float*double), but
	 * `(1-curveIntensity)*percentAlong` is float*float and must be frounded on its own before
	 * the double sum; the whole parenthesized sum then gets an explicit `(float)` cast, and the
	 * final `360f * (...)` is float*float too. Missing any one of these narrowing points was the
	 * root cause of a real seed-42-depth-3 room-placement desync against the Java reference
	 * harness (`gradlew :desktop:runHarness`) - see `PORT_COVERAGE.md`.
	 */
	private targetAngle(percentAlong: number): number {
		percentAlong = Math.fround(percentAlong + this.curveOffset);
		const term1 = this.curveIntensity * this.curveEquation(percentAlong); // float*double = double
		const oneMinusIntensity = Math.fround(1 - this.curveIntensity); // float
		const term2 = Math.fround(oneMinusIntensity * percentAlong); // float*float = float
		const inner = Math.fround(term1 + term2 - this.curveOffset); // double sum, then explicit (float) cast
		return Math.fround(360 * inner);
	}

	private randomBranchAngle = (r: Room): number => {
		if (this.loopCenter === null) return SpdRandom.floatRange(0, 360);
		const center = this.loopCenter;
		let toCenter = angleBetweenPoints({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }, center);
		if (toCenter < 0) toCenter = Math.fround(toCenter + 360);

		let currAngle = SpdRandom.floatRange(0, 360);
		for (let i = 0; i < 4; i++) {
			const newAngle = SpdRandom.floatRange(0, 360);
			if (Math.fround(Math.abs(toCenter - newAngle)) < Math.fround(Math.abs(toCenter - currAngle))) currAngle = newAngle;
		}
		return currAngle;
	};

	build(rooms: Room[], depth: number): Room[] | null {
		this.setupRooms(rooms, depth);

		if (!this.entrance) return null;

		this.entrance.setSize();
		this.entrance.setPos(0, 0);

		const startAngle = SpdRandom.floatRange(0, 360);

		this.mainPathRooms.splice(0, 0, this.entrance);
		this.mainPathRooms.splice(Math.floor((this.mainPathRooms.length + 1) / 2), 0, this.exit!);

		const loop: Room[] = [];
		let pathTunnels = this.pathTunnelChances.slice();
		for (const r of this.mainPathRooms) {
			loop.push(r);

			let tunnels = SpdRandom.chances(pathTunnels);
			if (tunnels === -1) {
				pathTunnels = this.pathTunnelChances.slice();
				tunnels = SpdRandom.chances(pathTunnels);
			}
			pathTunnels[tunnels]--;

			for (let j = 0; j < tunnels; j++) loop.push(createConnectionRoom(depth, false));
		}

		let prev = this.entrance;
		for (let i = 1; i < loop.length; i++) {
			const r = loop[i];
			// Java: `i / (float)loop.size()` (float division), then `startAngle + targetAngle(...)` (float add).
			const targetAngle = Math.fround(startAngle + this.targetAngle(Math.fround(i / loop.length)));
			if (placeRoom(rooms, prev, r, targetAngle) !== -1) {
				prev = r;
				if (!rooms.includes(prev)) rooms.push(prev);
			} else {
				return null;
			}
		}

		while (!prev.connect(this.entrance)) {
			const c = createConnectionRoom(depth, false);
			if (placeRoom(loop, prev, c, angleBetweenRooms(prev, this.entrance)) === -1) return null;
			loop.push(c);
			rooms.push(c);
			prev = c;
		}

		if (this.shop) {
			let angle: number;
			let tries = 10;
			do {
				angle = placeRoom(loop, this.entrance, this.shop, SpdRandom.floatRange(0, 360));
				tries--;
			} while (angle === -1 && tries >= 0);
			if (angle === -1) return null;
		}

		// Java: `PointF loopCenter` - `x`/`y` are `float` fields, so accumulation narrows each step.
		const loopCenter = { x: 0, y: 0 };
		for (const r of loop) {
			loopCenter.x = Math.fround(loopCenter.x + Math.fround((r.left + r.right) / 2));
			loopCenter.y = Math.fround(loopCenter.y + Math.fround((r.top + r.bottom) / 2));
		}
		loopCenter.x = Math.fround(loopCenter.x / loop.length);
		loopCenter.y = Math.fround(loopCenter.y / loop.length);
		this.loopCenter = loopCenter;

		const branchable = loop.slice();
		const roomsToBranch = [...this.multiConnections, ...this.singleConnections];
		this.weightRooms(branchable);
		this.createBranches(rooms, branchable, roomsToBranch, this.branchTunnelChances, depth, this.randomBranchAngle);

		findNeighbours(rooms);

		for (const r of rooms) {
			for (const n of r.neigbours.slice()) {
				if (!n.connected.has(r) && SpdRandom.float() < this.extraConnectionChance) {
					r.connect(n);
				}
			}
		}

		return rooms;
	}
}
