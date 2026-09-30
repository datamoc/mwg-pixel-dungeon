import { Button, Label, theme, Window } from 'mwg';
import { Container, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { t } from '../i18n';
import { runState } from '../runState';

export interface ItemPickerEntry {
	id: string;
	instanceId?: string;
	identified?: boolean;
	quantity: number;
	/** Appended after the name - the shop's rows use it for their price (SPD's own
	 *  `windows.wndtradeitem.buy`), the way Java's trade window prints a price per item. */
	note?: string;
}

export interface ItemPickerContext {
	width: number;
	title: string;
	/** The window's own body text, above the rows - `WndInfoItem`'s place in Java's windows. The
	 *  trade window is the one caller: it is Java's `WndTradeItem`, which *extends* `WndInfoItem`, so
	 *  its body is the item's own description above its buy button. */
	body?: string;
	entries: readonly ItemPickerEntry[];
	displayName: (id: string, identified: boolean, instanceId?: string) => string;
	displayDescription?: (id: string, instanceId?: string) => string | undefined;
	/** The item-sheet frame to draw beside a row (`ItemButton`'s icon); rows get no icon when it is absent. */
	iconFrame?: (id: string, instanceId?: string) => number | undefined;
	onPick: (index: number) => void;
	onCancel?: () => void;
}

/** Creates the shared modal bag picker used by alchemy, transmutation, stones, shop actions, and
 * every one-off item-choice window this port would otherwise need its own class for - the Ghost
 * quest reward (`WndSadGhost`), the Beacon's action list (`WndUseItem`), etc. This is a real MWG
 * Window so the WindowStack owns modality, cancellation, and outside clicks; the picker is not a
 * scene-sized panel masquerading as a window.
 *
 * **Simplified UI (same pattern as the talent picker, `panelsSingleUse.ts`'s `createTalentWindow`
 * - found via the same user comparison, 2026-09-25):** every real Java window this seam stands in
 * for renders the item's icon per row (`ItemButton`; this port draws a 16x16 sheet frame at 2x via
 * `iconFrame`) and, in every case this port has audited so far, a second confirm step before
 * committing (`WndSadGhost`'s `RewardWindow` extends `WndInfoItem` with explicit Confirm/Cancel
 * buttons; `WndTradeItem` likewise confirms a purchase). Each row now opens a second Confirm/Back
 * view before its callback commits. That view names the selected item with its translated
 * description when one is catalogued (`displayDescription`), but renders it as plain label text
 * rather than Java's `Item.info()` (which subclasses extend with item-specific stat lines, as
 * `WndInfoItem` shows them) and uses generic button styling; the Ghost-specific header and flavor
 * text are also absent.
 * The underlying choice set, gating, and pick logic are real at every call site (see each site's
 * own `PORT_COVERAGE.md` row); this file's row documents the shared presentation reduction once. */
export function createItemPickerWindow({ width, title, body, entries, displayName, displayDescription, iconFrame, onPick, onCancel }: ItemPickerContext): Window {
	const cols = entries.length > 6 ? 2 : 1;
	const rows = Math.ceil(entries.length / cols);
	const rowHeight = 36;
	//The body sits between the window title and the first row, and the window grows to fit it.
	const bodyLabel = body
		? new Label({ text: body, size: 6, wrapWidth: width - 20, color: theme().color.textDim })
		: null;
	const bodyHeight = bodyLabel ? Math.ceil(bodyLabel.height) + 6 : 0;
	const rowsTop = bodyHeight + 6;
	const contentHeight = rowsTop + rows * (rowHeight + 4) + (rowHeight + 4) + 12;
	const window = new Window({ width, height: contentHeight, title, anchor: 'center', blocker: true });
	//`Window`'s height is OUTER (its content is inset past the frame and title): sized as the content alone,
	//the frame ended above the Cancel row. Grow it by the measured inset.
	window.resize(width, 2 * contentHeight - window.contentHeight);
	if (bodyLabel) {
		bodyLabel.position.set(0, 0);
		window.content.addChild(bodyLabel);
	}
	const listElements: { visible: boolean }[] = [];
	const columnWidth = window.contentWidth / cols;
	let largestConfirmContent = 0;
	entries.forEach((entry, index) => {
		const row = Math.floor(index / cols);
		const col = index % cols;
		const label = displayName(entry.id, entry.identified ?? false, entry.instanceId)
			+ (entry.quantity > 1 ? ` x${entry.quantity}` : '')
			+ (entry.note ? ` ${entry.note}` : '');
		const button = new Button({ width: columnWidth - 4, height: rowHeight, text: '', onClick: () => { confirmPanel.visible = true; for (const element of listElements) element.visible = false; } });
		button.position.set(col * columnWidth, rowsTop + row * (rowHeight + 4));
		button.eventMode = 'static';
		button.cursor = 'pointer';
		window.content.addChild(button);
		listElements.push(button);
		const frame = iconFrame?.(entry.id, entry.instanceId);
		const labelLeft = frame === undefined ? 8 : 40;
		const labelText = new Label({ text: label, size: 6, wrapWidth: columnWidth - labelLeft - 4, color: theme().color.text });
		labelText.position.set(button.x + labelLeft, button.y + Math.round((rowHeight - labelText.height) / 2));
		labelText.eventMode = 'none';
		window.content.addChild(labelText);
		listElements.push(labelText);
		if (frame !== undefined) {
			const icon = new Sprite(new Texture({ source: runState.sprites.items.source, frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) }));
			icon.scale.set(2);
			icon.position.set(button.x + 2, button.y + 2);
			icon.eventMode = 'none';
			window.content.addChild(icon);
			listElements.push(icon);
		}
		const confirmPanel = new Container();
		confirmPanel.visible = false;
		const description = displayDescription?.(entry.id, entry.instanceId);
		const confirmText = description ? `${label}\n\n${description}` : label;
		const selected = new Label({ text: confirmText, size: 6, wrapWidth: window.contentWidth - 12, color: theme().color.text });
		selected.position.set(4, rowsTop + 2);
		selected.eventMode = 'none';
		confirmPanel.addChild(selected);
		const confirmTop = rowsTop + Math.max(40, Math.ceil(selected.height) + 8);
		largestConfirmContent = Math.max(largestConfirmContent, confirmTop + rowHeight + 12);
		const confirmWidth = (window.contentWidth - 8) / 2;
		const confirm = new Button({ width: confirmWidth, height: rowHeight, text: t('port.ui.itempicker.confirm'), onClick: () => onPick(index) });
		confirm.position.set(0, confirmTop);
		confirm.eventMode = 'static';
		confirm.cursor = 'pointer';
		confirmPanel.addChild(confirm);
		const back = new Button({ width: confirmWidth, height: rowHeight, text: t('port.ui.itempicker.back'), onClick: () => { confirmPanel.visible = false; for (const element of listElements) element.visible = true; } });
		back.position.set(confirmWidth + 4, confirmTop);
		back.eventMode = 'static';
		back.cursor = 'pointer';
		confirmPanel.addChild(back);
		window.content.addChild(confirmPanel);
	});
	const cancel = new Button({ width: window.contentWidth - 4, height: rowHeight, text: t('port.ui.itempicker.cancel'), onClick: () => onPick(-1) });
	cancel.position.set(0, rowsTop + rows * (rowHeight + 4));
	cancel.eventMode = 'static';
	cancel.cursor = 'pointer';
	window.content.addChild(cancel);
	listElements.push(cancel);
	if (largestConfirmContent > window.contentHeight) {
		const windowInsets = window.height - window.contentHeight;
		window.resize(width, largestConfirmContent + windowInsets);
	}
	if (onCancel) window.onClose.add(onCancel);
	return window;
}
