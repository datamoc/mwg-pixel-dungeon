/** The simulation only needs actor identity and whether input is required. */
export interface TurnActor {
	isHero?: boolean;
}

export interface TurnScheduler<A> {
	peek(): A | null;
	spend(cost: number): void;
}

export interface TurnPorts<A> {
	scheduler: TurnScheduler<A>;
	isGameOver(): boolean;
	takeMonsterTurn(actor: A): void;
	afterMonsterTurn?(actor: A): void;
	/** The turn cost the action `takeMonsterTurn` just ran actually took, at speed 1 - most
	 * actions are the default 1, but a few (Necromancer's `firstSummon`-gated summon) cost more.
	 * Read once immediately after `takeMonsterTurn` returns; defaults to 1 when absent. */
	monsterTurnCost?(actor: A): number;
}

export type TurnStop = 'hero-input' | 'game-over' | 'empty' | 'iteration-limit';
