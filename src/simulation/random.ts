/** Explicit random source. Bounds match the existing mwg calls, including int's exclusive upper bound. */
export interface SimulationRandom {
	float(max: number): number;
	normalRange(min: number, max: number): number;
	/** Uniform integer with both bounds included. */
	range(min: number, max: number): number;
	/** Uniform integer in [min, max), unlike range(). */
	int(min: number, max: number): number;
}
