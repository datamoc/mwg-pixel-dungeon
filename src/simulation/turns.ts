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
}

export type TurnStop = 'hero-input' | 'game-over' | 'empty' | 'iteration-limit';
