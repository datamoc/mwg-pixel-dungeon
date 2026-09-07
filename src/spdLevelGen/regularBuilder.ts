/**
 * Port of `levels/builders/RegularBuilder.java`: the main-path/branch concept shared by
 * `LoopBuilder` and `FigureEightBuilder`. `ConnectionRoom.createRoom()`'s real class-selection
 * table (`chances[depth]`, 6 concrete subclasses) is ported for RNG-order fidelity, but the
 * concrete subclasses themselves aren't - see `connectionRoom.ts`.
 */
import { Room, ALL } from './room';
import { placeRoom } from './builder';
import { SpdRandom } from '../spdRng';
import { createConnectionRoom } from './connectionRoom';

export class RegularBuilder {
	pathVariance = 45;
	pathLength = 0.25;
	pathLenJitterChances = [0, 0, 0, 1];
	pathTunnelChances = [2, 2, 1];
	branchTunnelChances = [1, 1, 0];
	extraConnectionChance = 0.30;

	entrance: Room | null = null;
	exit: Room | null = null;
	shop: Room | null = null;

	mainPathRooms: Room[] = [];
	multiConnections: Room[] = [];
	singleConnections: Room[] = [];

	setupRooms(rooms: Room[], depth: number): void {
		for (const r of rooms) r.setEmpty();

		this.entrance = this.exit = this.shop = null;
		this.mainPathRooms = [];
		this.singleConnections = [];
		this.multiConnections = [];

		for (const r of rooms) {
			if (r.kind === 'entrance') this.entrance = r;
			else if (r.kind === 'exit') this.exit = r;
			else if (r.kind === 'shop' && r.maxConnections(ALL) === 1) this.shop = r;
			else if (r.maxConnections(ALL) > 1) this.multiConnections.push(r);
			else if (r.maxConnections(ALL) === 1) this.singleConnections.push(r);
		}

		// weights larger rooms to be much more likely to appear on the main path
		this.weightRooms(this.multiConnections);
		SpdRandom.shuffle(this.multiConnections);
		this.multiConnections = Array.from(new Set(this.multiConnections));
		// shuffle again so the actual path ordering doesn't put big rooms early
		SpdRandom.shuffle(this.multiConnections);

		let roomsOnMainPath = Math.floor(this.multiConnections.length * this.pathLength) + SpdRandom.chances(this.pathLenJitterChances);

		while (roomsOnMainPath > 0 && this.multiConnections.length > 0) {
			const r = this.multiConnections.shift()!;
			if (r.kind === 'standard' || r.kind === 'entrance' || r.kind === 'exit') {
				roomsOnMainPath -= r.sizeCat!.roomValue;
			} else {
				roomsOnMainPath--;
			}
			this.mainPathRooms.push(r);
		}
	}

	weightRooms(rooms: Room[]): void {
		for (const r of rooms.slice()) {
			if (r.kind === 'standard' || r.kind === 'entrance' || r.kind === 'exit') {
				for (let i = 1; i < r.sizeCat!.connectionWeight; i++) rooms.push(r);
			}
		}
	}

	/** Places `roomsToBranch` into branches off `branchable`. The three arrays may overlap. */
	createBranches(rooms: Room[], branchable: Room[], roomsToBranch: Room[], connChances: number[], depth: number, randomBranchAngle: (r: Room) => number): void {
		let i = 0;
		let connectionChances = connChances.slice();

		while (i < roomsToBranch.length) {
			const r = roomsToBranch[i];
			const connectingRoomsThisBranch: Room[] = [];

			let curr: Room;
			do {
				curr = SpdRandom.element(branchable);
				// r instanceof SecretRoom && curr instanceof ConnectionRoom - secrets never
				// branch off a tunnel room. Secret rooms are stubbed to never appear this pass
				// (see regularLevel.ts), so this guard never actually rejects a candidate yet.
			} while (r.kind === 'secret' && (curr.kind === 'connection' || curr.kind === 'mazeConnection'));

			let connectingRooms = SpdRandom.chances(connectionChances);
			if (connectingRooms === -1) {
				connectionChances = connChances.slice();
				connectingRooms = SpdRandom.chances(connectionChances);
			}
			connectionChances[connectingRooms]--;

			let failed = false;
			for (let j = 0; j < connectingRooms; j++) {
				const t = r.kind === 'secret' ? createConnectionRoom(depth, true) : createConnectionRoom(depth, false);
				let tries = 3;
				let angle: number;
				do {
					angle = placeRoom(rooms, curr, t, randomBranchAngle(curr));
					tries--;
				} while (angle === -1 && tries > 0);

				if (angle === -1) {
					t.clearConnections();
					for (const c of connectingRoomsThisBranch) {
						c.clearConnections();
						const idx = rooms.indexOf(c);
						if (idx !== -1) rooms.splice(idx, 1);
					}
					connectingRoomsThisBranch.length = 0;
					failed = true;
					break;
				} else {
					connectingRoomsThisBranch.push(t);
					rooms.push(t);
				}
				curr = t;
			}

			if (failed || connectingRoomsThisBranch.length !== connectingRooms) {
				continue;
			}

			let tries = 10;
			let angle: number;
			do {
				angle = placeRoom(rooms, curr, r, randomBranchAngle(curr));
				tries--;
			} while (angle === -1 && tries > 0);

			if (angle === -1) {
				r.clearConnections();
				for (const t of connectingRoomsThisBranch) {
					t.clearConnections();
					const idx = rooms.indexOf(t);
					if (idx !== -1) rooms.splice(idx, 1);
				}
				continue;
			}

			for (const t of connectingRoomsThisBranch) {
				if (SpdRandom.int(3) <= 1) branchable.push(t);
			}
			if (r.maxConnections(ALL) > 1 && SpdRandom.int(3) === 0) {
				if (r.kind === 'standard' || r.kind === 'entrance' || r.kind === 'exit') {
					for (let j = 0; j < r.sizeCat!.connectionWeight; j++) branchable.push(r);
				} else {
					branchable.push(r);
				}
			}

			i++;
		}
	}
}
