import type { Creature } from '../combat';

export type NpcMessageLevel = 'info' | 'positive' | 'negative' | 'warning';

export interface RatKingInteractionContext {
	npc: Pick<Creature, 'sleeping'>;
	armorAbility?: string | null;
	armorId: string;
	hasItem(id: string): boolean;
	removeItem(id: string, quantity: number): void;
	setArmorAbility(ability: 'ratmogrify'): void;
	say(message: string, level?: NpcMessageLevel): void;
	messages: { notSleeping: string; crownAfter: string; crownClothes: string; crownThankyou: string; whatIsIt: string };
}

/** `RatKing.interact()` as a scene-independent state transition. Inventory mutation and
 * dialogue presentation are supplied by the scene, while the NPC's exchange rules stay in
 * the actor domain with monster spawn policy. */
export function interactWithRatKing(context: RatKingInteractionContext): void {
	if (context.npc.sleeping) {
		context.npc.sleeping = false;
		context.say(context.messages.notSleeping, 'positive');
	} else if (context.armorAbility === 'ratmogrify') context.say(context.messages.crownAfter, 'positive');
	else if (context.hasItem('kingsCrown')) {
		if (context.armorId === 'clothArmor' || context.armorId === 'startingArmor') {
			context.say(context.messages.crownClothes, 'negative');
			return;
		}
		context.removeItem('kingsCrown', 1);
		context.setArmorAbility('ratmogrify');
		context.say(context.messages.crownThankyou, 'positive');
	} else context.say(context.messages.whatIsIt);
}

export type GhostQuestStatus = 'available' | 'complete' | 'active';
export interface GhostInteractionContext { status: GhostQuestStatus; stageHasCondition: boolean; offer(): void; done(): void; remind(): void; turnIn(): void; }
/** `Ghost.interact()`'s quest-state routing. */
export function interactWithGhost(context: GhostInteractionContext): void {
	if (context.status === 'available') return context.offer();
	if (context.status === 'complete') return context.done();
	if (context.stageHasCondition) return context.remind();
	context.turnIn();
}

export interface WandmakerInteractionContext {
	status: 'available' | 'complete' | 'active'; type: number; heroClass: string;
	hasItem(id: string): boolean; rotberrySeedInstance(): string | undefined;
	removeItem(id: string, instanceId?: string): void; startQuest(): void; advanceQuest(): void;
	giveWand(frost: boolean): void; say(message: string): void;
	messages: { intro: string[]; offer: string; done: string; remind: string; reminderDust: string; reminderEmber: string; reminderBerry: string };
}
/** `Wandmaker.interact()`'s quest and fetch-item routing. */
export function interactWithWandmaker(context: WandmakerInteractionContext): void {
	if (context.status === 'available') {
		context.startQuest(); context.advanceQuest();
		if (context.type >= 1 && context.type <= 3) for (const message of context.messages.intro) context.say(message);
		else context.say(context.messages.offer);
		return;
	}
	if (context.status === 'complete') return context.say(context.messages.done);
	if (context.type === 1) {
		if (!context.hasItem('corpseDust')) return context.say(context.messages.reminderDust);
		context.removeItem('corpseDust');
	} else if (context.type === 3) {
		const instanceId = context.rotberrySeedInstance();
		if (!instanceId) return context.say(context.messages.reminderBerry);
		context.removeItem('seed', instanceId);
	} else if (context.type === 2) {
		if (!context.hasItem('embers')) return context.say(context.messages.reminderEmber);
		context.removeItem('embers');
	} else {
		const scroll = ['scroll', 'scrollIdentify', 'scrollUpgrade'].find((id) => context.hasItem(id));
		if (!scroll) return context.say(context.messages.remind);
		context.removeItem(scroll);
	}
	context.giveWand(context.heroClass !== 'mage');
}

export interface ImpInteractionContext {
	status: 'available' | 'complete' | 'active'; need: number; heldTokens: number;
	startQuest(): void; advanceQuest(): void; removeTokens(quantity: number): void;
	reward(): string; flee(): void; say(message: string): void;
	messages: { offer: string; done: string; remind: string; reward: string };
}
/** `Imp.Quest.interact()`'s token gate and one-time reward/flee transition. */
export function interactWithImp(context: ImpInteractionContext): void {
	if (context.status === 'available') {
		context.startQuest(); context.advanceQuest(); context.say(context.messages.offer); return;
	}
	if (context.status === 'complete') return context.say(context.messages.done);
	if (context.heldTokens < context.need) return context.say(context.messages.remind);
	context.removeTokens(context.need);
	const rewardMessage = context.reward();
	context.advanceQuest(); context.flee(); context.say(rewardMessage || context.messages.reward);
}
