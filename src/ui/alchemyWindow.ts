import { Button, Label, theme, Window } from 'mwg';
import { Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { t } from '../i18n';
import { runState } from '../runState';

/**
 * The alchemy window (`scenes/AlchemyScene.java`, tag `v3.3.8`): three input slots filled from the bag, one combine/output pair per recipe the
 * slotted units satisfy (`Recipe.findRecipes`, `AlchemyScene.updateState()`), the energy balance and a craft button. The flow
 * (`items/alchemySlots.ts`) owns the state; this module only draws a view model and reports taps, and is rebuilt after every change.
 *
 * Simplified against the Java scene: it is a modal window rather than a full scene, slot taps add one unit through the shared item picker
 * (Java's `WndBag` adds a whole stack for non-stackables and `detachAll`s stackable ones into the slot), units stay in the bag until the craft
 * consumes them (so closing the window needs no "return slotted items" step), and the Guide, Repeat Ingredients and Energize Items buttons are
 * not drawn (the Energize action is offered as an extra result row when the Alchemist's Toolkit can take it).
 */
export interface AlchemySlotView {
	readonly label?: string;
	readonly frame?: number;
}

export interface AlchemyResultView {
	readonly label: string;
	readonly frame?: number;
	readonly cost: number;
	readonly affordable: boolean;
}

export interface AlchemyWindowView {
	readonly energy: number;
	readonly slots: readonly AlchemySlotView[];
	readonly results: readonly AlchemyResultView[];
	readonly onSlot: (index: number) => void;
	readonly onCraft: (index: number) => void;
	readonly onClose: () => void;
}

const BTN = 36;
const GAP = 4;

function itemIcon(frame: number, x: number, y: number): Sprite {
	const icon = new Sprite(new Texture({ source: runState.sprites.items.source, frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) }));
	icon.scale.set(2);
	icon.position.set(x, y);
	icon.eventMode = 'none';
	return icon;
}

export function createAlchemyWindow(view: AlchemyWindowView, width: number): Window {
	const resultRows = Math.max(1, view.results.length);
	const slotsTop = 0;
	const infoTop = slotsTop + BTN + GAP + 4;
	const resultsTop = infoTop + 14;
	const contentHeight = resultsTop + resultRows * (BTN + GAP) + BTN + GAP + 8;
	const window = new Window({ width, height: contentHeight, title: t('scenes.alchemyscene.title'), anchor: 'center', blocker: true });
	//`Window`'s height is OUTER (its content is inset past the frame and title): grow it by the measured inset, like the item picker.
	window.resize(width, 2 * contentHeight - window.contentHeight);
	const contentWidth = window.contentWidth;

	const slotWidth = Math.floor((contentWidth - 2 * GAP) / 3);
	view.slots.forEach((slot, index) => {
		const button = new Button({ width: slotWidth, height: BTN, text: slot.label === undefined ? t('scenes.alchemyscene.add') : '', onClick: () => view.onSlot(index) });
		button.position.set(index * (slotWidth + GAP), slotsTop);
		button.eventMode = 'static';
		button.cursor = 'pointer';
		window.content.addChild(button);
		if (slot.label === undefined) return;
		const hasIcon = slot.frame !== undefined;
		if (hasIcon) window.content.addChild(itemIcon(slot.frame!, button.x + 2, button.y + 2));
		const left = hasIcon ? 36 : 4;
		const label = new Label({ text: slot.label, size: 6, wrapWidth: slotWidth - left - 2, color: theme().color.text });
		label.position.set(button.x + left, button.y + Math.round((BTN - label.height) / 2));
		label.eventMode = 'none';
		window.content.addChild(label);
	});

	const energy = new Label({ text: `${t('scenes.alchemyscene.energy')} ${view.energy}`, size: 6, color: theme().color.textDim });
	energy.position.set(0, infoTop);
	energy.eventMode = 'none';
	window.content.addChild(energy);

	if (view.results.length === 0) {
		const none = new Label({ text: t('scenes.alchemyscene.text'), size: 6, wrapWidth: contentWidth - 4, color: theme().color.textDim });
		none.position.set(0, resultsTop + Math.round((BTN - none.height) / 2));
		none.eventMode = 'none';
		window.content.addChild(none);
	}
	view.results.forEach((result, index) => {
		const top = resultsTop + index * (BTN + GAP);
		const hasIcon = result.frame !== undefined;
		if (hasIcon) window.content.addChild(itemIcon(result.frame!, 2, top + 2));
		const left = hasIcon ? 40 : 4;
		const craftWidth = 84;
		const label = new Label({ text: result.label + (result.cost > 0 ? `  (${result.cost})` : ''), size: 6, wrapWidth: contentWidth - left - craftWidth - 8, color: theme().color.text });
		label.position.set(left, top + Math.round((BTN - label.height) / 2));
		label.eventMode = 'none';
		window.content.addChild(label);
		const craft = new Button({ width: craftWidth, height: BTN, text: t('scenes.alchemyscene.craft'), onClick: () => { if (result.affordable) view.onCraft(index); } });
		craft.position.set(contentWidth - craftWidth, top);
		craft.eventMode = 'static';
		craft.cursor = result.affordable ? 'pointer' : 'default';
		craft.alpha = result.affordable ? 1 : 0.5;
		window.content.addChild(craft);
	});

	const close = new Button({ width: contentWidth - 4, height: BTN, text: t('port.ui.itempicker.cancel'), onClick: view.onClose });
	close.position.set(0, resultsTop + resultRows * (BTN + GAP));
	close.eventMode = 'static';
	close.cursor = 'pointer';
	window.content.addChild(close);
	return window;
}

/** Keeps the one live window of a scene: showing a new view closes the previous draw first (the window is rebuilt after every slot change). */
export function createAlchemyWindowHost(push: (window: Window) => void, viewportWidth: () => number): { show: (view: AlchemyWindowView) => void; close: () => void } {
	let current: Window | undefined;
	return {
		show: (view) => {
			current?.close();
			current = createAlchemyWindow(view, Math.min(320, Math.max(240, viewportWidth() - 24)));
			push(current);
		},
		close: () => { current?.close(); current = undefined; },
	};
}
