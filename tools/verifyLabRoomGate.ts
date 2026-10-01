import assert from 'node:assert/strict';
import { SpdRandom, pushRunInitGenerator, setTraceDrawLog, spdSeedForDepth } from '../src/spdRng.ts';
import { createSpecialRoom, initSpecialRoomFloor, resetSpecialRoomRunState } from '../src/spdLevelGen/rooms/special/registry.ts';

const depths = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24];

for (let seed = 1n; seed <= 80n; seed++) {
	pushRunInitGenerator(seed);
	resetSpecialRoomRunState();
	SpdRandom.popGenerator();
	const labsByRegion = new Map<number, number>();
	for (const depth of depths) {
		const floorSeed = spdSeedForDepth(seed, depth, 0);
		const region = 1 + Math.floor(depth / 5);
		const floorInRegion = depth % 5;
		const hadLabBefore = labsByRegion.has(region);
		let expectedThirdFloorLab = false;
		if (floorInRegion === 3 && !hadLabBefore) {
			SpdRandom.pushGenerator(floorSeed);
			expectedThirdFloorLab = SpdRandom.int(2) === 0;
			SpdRandom.popGenerator();
		}
		SpdRandom.pushGenerator(floorSeed);
		const gateDraws: string[] = [];
		setTraceDrawLog(gateDraws);
		initSpecialRoomFloor(depth);
		setTraceDrawLog(null);
		const kinds: string[] = [];
		let roomSlots = [0, 2, 2, 3, 3, 3][region]!;
		for (let index = 0; index < roomSlots; index++) {
			const kind = createSpecialRoom(depth, [4, 9, 14, 19, 24].includes(depth));
			kinds.push(kind);
			if (kind === 'pit') roomSlots++;
		}
		SpdRandom.popGenerator();

		const selectedLab = kinds.includes('laboratory');
		if (selectedLab) labsByRegion.set(region, (labsByRegion.get(region) ?? 0) + 1);
		const expectedLab = !hadLabBefore && (floorInRegion === 4 || (floorInRegion === 3 && expectedThirdFloorLab));
		assert.equal(selectedLab, expectedLab,
		`seed ${seed}, depth ${depth}: only the regional third/fourth floor can select the lab`);
		assert.equal(gateDraws.length, floorInRegion === 3 && !hadLabBefore ? 1 : 0,
		`seed ${seed}, depth ${depth}: only an eligible third floor consumes Random.Int(2)`);
	}
	assert.deepEqual([...labsByRegion.values()], [1, 1, 1, 1, 1], `seed ${seed}: exactly one lab per region`);
}

console.log('PASS Java lab gate: one lab per region, third-floor 50/50 gate, fourth-floor guarantee and draw count');
