import { Random } from 'mwg';
import type { SimulationRandom } from '../simulation/random';

/** Delegate every draw to the current mwg stream; never capture, reseed, or replace it. */
export const simulationRandom: SimulationRandom = {
	float: (max) => Random.float(max),
	normalRange: (min, max) => Random.normalRange(min, max),
	range: (min, max) => Random.range(min, max),
	int: (min, max) => Random.int(min, max),
};
