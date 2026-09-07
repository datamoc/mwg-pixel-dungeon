/** Port of `levels/builders/FigureEightBuilder.java`. */
import { Room, ALL } from './room';
import { findNeighbours, placeRoom, angleBetweenPoints, angleBetweenRooms } from './builder';
import { RegularBuilder } from './regularBuilder';
import { createConnectionRoom } from './connectionRoom';
import { SpdRandom } from '../spdRng';

export class FigureEightBuilder extends RegularBuilder {
	private curveExponent = 0;
	private curveIntensity = 1;
	private curveOffset = 0;
	private landmarkRoom: Room | null = null;
	private firstLoop: Room[] = [];
	private secondLoop: Room[] = [];
	private firstLoopCenter: { x: number; y: number } | null = null;
	private secondLoopCenter: { x: number; y: number } | null = null;

	/**
	 * `FigureEightBuilder.setLandmarkRoom(Room)`. Called externally (`SewerBossLevel.initRooms()`
	 * casts its `builder` to `FigureEightBuilder` and calls this before `build()` runs) to force
	 * a specific room - the Goo boss room - as the loop's landmark, instead of `build()`'s own
	 * "prefer a large/giant 4+-connection room" auto-pick. See `regularLevel.ts`'s
	 * `sewerBossInitRooms()`/depth-5 branch in `buildRoomGraph()`.
	 */
	setLandmarkRoom(room: Room): this {
		this.landmarkRoom = room;
		return this;
	}

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

	/** See `LoopBuilder.targetAngle`'s comment - identical Java method, same float-narrowing points. */
	private targetAngle(percentAlong: number): number {
		percentAlong = Math.fround(percentAlong + this.curveOffset);
		const term1 = this.curveIntensity * this.curveEquation(percentAlong); // float*double = double
		const oneMinusIntensity = Math.fround(1 - this.curveIntensity); // float
		const term2 = Math.fround(oneMinusIntensity * percentAlong); // float*float = float
		const inner = Math.fround(term1 + term2 - this.curveOffset); // double sum, then explicit (float) cast
		return Math.fround(360 * inner);
	}

	private randomBranchAngle = (r: Room): number => {
		const center = this.firstLoop.includes(r) ? this.firstLoopCenter : this.secondLoopCenter;
		if (center === null) return SpdRandom.floatRange(0, 360);
		let toCenter = angleBetweenPoints({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }, center!);
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

		if (!this.landmarkRoom) {
			// prefer large and giant standard rooms over others
			for (const r of this.mainPathRooms) {
				if (r.maxConnections(ALL) >= 4
					&& (!this.landmarkRoom || this.landmarkRoom.minWidth() * this.landmarkRoom.minHeight() < r.minWidth() * r.minHeight())) {
					this.landmarkRoom = r;
				}
			}
			if (this.multiConnections.length > 0) {
				this.mainPathRooms.push(this.multiConnections.shift()!);
			}
		}
		if (!this.landmarkRoom) return null; // real Java can NPE here if no room qualifies; we bail instead

		const landmark = this.landmarkRoom;
		this.mainPathRooms = this.mainPathRooms.filter(r => r !== landmark);
		this.multiConnections = this.multiConnections.filter(r => r !== landmark);

		const startAngle = SpdRandom.floatRange(0, 360);

		let roomsOnFirstLoop = Math.floor(this.mainPathRooms.length / 2);
		if (this.mainPathRooms.length % 2 === 1) roomsOnFirstLoop += SpdRandom.int(2);

		const roomsToLoop = this.mainPathRooms.slice();

		const firstLoopTemp: Room[] = [landmark];
		for (let i = 0; i < roomsOnFirstLoop; i++) firstLoopTemp.push(roomsToLoop.shift()!);
		firstLoopTemp.splice(Math.floor((firstLoopTemp.length + 1) / 2), 0, this.entrance!);

		let pathTunnels = this.pathTunnelChances.slice();

		this.firstLoop = [];
		for (const r of firstLoopTemp) {
			this.firstLoop.push(r);
			let tunnels = SpdRandom.chances(pathTunnels);
			if (tunnels === -1) {
				pathTunnels = this.pathTunnelChances.slice();
				tunnels = SpdRandom.chances(pathTunnels);
			}
			pathTunnels[tunnels]--;
			for (let j = 0; j < tunnels; j++) this.firstLoop.push(createConnectionRoom(depth, false));
		}

		const secondLoopTemp: Room[] = [landmark, ...roomsToLoop];
		secondLoopTemp.splice(Math.floor((secondLoopTemp.length + 1) / 2), 0, this.exit!);

		this.secondLoop = [];
		for (const r of secondLoopTemp) {
			this.secondLoop.push(r);
			let tunnels = SpdRandom.chances(pathTunnels);
			if (tunnels === -1) {
				pathTunnels = this.pathTunnelChances.slice();
				tunnels = SpdRandom.chances(pathTunnels);
			}
			pathTunnels[tunnels]--;
			for (let j = 0; j < tunnels; j++) this.secondLoop.push(createConnectionRoom(depth, false));
		}

		landmark.setSize();
		landmark.setPos(0, 0);

		let prev = landmark;
		for (let i = 1; i < this.firstLoop.length; i++) {
			const r = this.firstLoop[i];
			const targetAngle = Math.fround(startAngle + this.targetAngle(Math.fround(i / this.firstLoop.length)));
			if (placeRoom(rooms, prev, r, targetAngle) !== -1) {
				prev = r;
				if (!rooms.includes(prev)) rooms.push(prev);
			} else {
				return null;
			}
		}

		while (!prev.connect(landmark)) {
			const c = createConnectionRoom(depth, false);
			if (placeRoom(rooms, prev, c, angleBetweenRooms(prev, landmark)) === -1) return null;
			this.firstLoop.push(c);
			rooms.push(c);
			prev = c;
		}

		prev = landmark;
		const secondStartAngle = Math.fround(startAngle + 180); // Java: `startAngle += 180f;`
		for (let i = 1; i < this.secondLoop.length; i++) {
			const r = this.secondLoop[i];
			const targetAngle = Math.fround(secondStartAngle + this.targetAngle(Math.fround(i / this.secondLoop.length)));
			if (placeRoom(rooms, prev, r, targetAngle) !== -1) {
				prev = r;
				if (!rooms.includes(prev)) rooms.push(prev);
			} else {
				return null;
			}
		}

		while (!prev.connect(landmark)) {
			const c = createConnectionRoom(depth, false);
			if (placeRoom(rooms, prev, c, angleBetweenRooms(prev, landmark)) === -1) return null;
			this.secondLoop.push(c);
			rooms.push(c);
			prev = c;
		}

		if (this.shop) {
			let angle: number;
			let tries = 10;
			do {
				angle = placeRoom(rooms, this.entrance!, this.shop, SpdRandom.floatRange(0, 360));
				tries--;
			} while (angle === -1 && tries >= 0);
			if (angle === -1) return null;
		}

		// Java: `PointF firstLoopCenter`/`secondLoopCenter` - `x`/`y` are `float` fields.
		const firstLoopCenter = { x: 0, y: 0 };
		for (const r of this.firstLoop) {
			firstLoopCenter.x = Math.fround(firstLoopCenter.x + Math.fround((r.left + r.right) / 2));
			firstLoopCenter.y = Math.fround(firstLoopCenter.y + Math.fround((r.top + r.bottom) / 2));
		}
		firstLoopCenter.x = Math.fround(firstLoopCenter.x / this.firstLoop.length);
		firstLoopCenter.y = Math.fround(firstLoopCenter.y / this.firstLoop.length);
		this.firstLoopCenter = firstLoopCenter;

		const secondLoopCenter = { x: 0, y: 0 };
		for (const r of this.secondLoop) {
			secondLoopCenter.x = Math.fround(secondLoopCenter.x + Math.fround((r.left + r.right) / 2));
			secondLoopCenter.y = Math.fround(secondLoopCenter.y + Math.fround((r.top + r.bottom) / 2));
		}
		secondLoopCenter.x = Math.fround(secondLoopCenter.x / this.secondLoop.length);
		secondLoopCenter.y = Math.fround(secondLoopCenter.y / this.secondLoop.length);
		this.secondLoopCenter = secondLoopCenter;

		const branchable = [...this.firstLoop, ...this.secondLoop];
		{
			const idx = branchable.indexOf(landmark);
			if (idx !== -1) branchable.splice(idx, 1);
		}

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
