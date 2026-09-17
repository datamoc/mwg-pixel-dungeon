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
	status: 'available' | 'complete' | 'active'; type: number;
	hasItem(id: string): boolean; rotberrySeedInstance(): string | undefined;
	startQuest(): void; advanceQuest(): void;
	/** `WndWandmaker`: the scene opens the real two-wand reward window. The quest item is
	 *  detached by that window's own confirm, not here - Java's `selectReward` is the only
	 *  place it is spent, so cancelling leaves it in the bag (and the two offered wands are
	 *  the ones this floor already generated). */
	offerReward(): void;
	say(message: string): void;
	messages: { intro: string[]; offer: string; done: string; remind: string; reminderDust: string; reminderEmber: string; reminderBerry: string };
}
/**
 * `Wandmaker.interact()`'s quest and fetch-item routing.
 *
 * The intro is Java's own two-message shape: `msg1` is the class's own `intro_<class>` line
 * followed by `intro_1`, `msg2` the type's `intro_dust`/`intro_ember`/`intro_berry` followed by
 * `intro_2` - shown as two successive windows. The class line was missing here until 2026-09-16,
 * even though the generated catalogue has carried `intro_warrior`/`intro_rogue`/`intro_mage`/
 * `intro_huntress`/`intro_duelist` all along; the caller composes `messages.intro` in Java's own
 * order, so the class line is simply its first entry.
 *
 * Holding the item routes to `offerReward` rather than granting anything directly: Java shows
 * `WndWandmaker`, whose two buttons are the floor's own `Quest.wand1`/`wand2`, and only its
 * confirm spends the item (`selectReward`). See `offerReward`'s own doc comment.
 */
export function interactWithWandmaker(context: WandmakerInteractionContext): void {
	if (context.status === 'available') {
		context.startQuest(); context.advanceQuest();
		if (context.type >= 1 && context.type <= 3) for (const message of context.messages.intro) context.say(message);
		else context.say(context.messages.offer);
		return;
	}
	if (context.status === 'complete') return context.say(context.messages.done);
	const held = context.type === 1 ? (context.hasItem('corpseDust') ? 'dust' : null)
		: context.type === 3 ? (context.rotberrySeedInstance() !== undefined ? 'berry' : null)
			: context.type === 2 ? (context.hasItem('embers') ? 'ember' : null)
				: (['scroll', 'scrollIdentify', 'scrollUpgrade'].find((id) => context.hasItem(id)) ? 'scroll' : null);
	if (held === null) {
		if (context.type === 1) return context.say(context.messages.reminderDust);
		if (context.type === 3) return context.say(context.messages.reminderBerry);
		if (context.type === 2) return context.say(context.messages.reminderEmber);
		return context.say(context.messages.remind);
	}
	context.offerReward();
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
