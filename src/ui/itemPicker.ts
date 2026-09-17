import { Button, Label, theme, Window } from 'mwg';
import { t } from '../i18n';

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
	onPick: (index: number) => void;
	onCancel?: () => void;
}

/** Creates the shared modal bag picker used by alchemy, transmutation, stones, and shop actions.
 * This is a real MWG Window so the WindowStack owns modality, cancellation, and outside clicks;
 * the picker is not a scene-sized panel masquerading as a window. */
export function createItemPickerWindow({ width, title, body, entries, displayName, onPick, onCancel }: ItemPickerContext): Window {
	const cols = entries.length > 6 ? 2 : 1;
	const rows = Math.ceil(entries.length / cols);
	const rowHeight = 24;
	//The body sits between the window title and the first row, and the window grows to fit it.
	const bodyLabel = body
		? new Label({ text: body, size: 6, wrapWidth: width - 20, color: theme().color.textDim })
		: null;
	const bodyHeight = bodyLabel ? Math.ceil(bodyLabel.height) + 6 : 0;
	const rowsTop = bodyHeight + 6;
	const window = new Window({
		width,
		height: rowsTop + rows * (rowHeight + 4) + (rowHeight + 4) + 12,
		title,
		anchor: 'center',
		blocker: true,
	});
	if (bodyLabel) {
		bodyLabel.position.set(0, 0);
		window.content.addChild(bodyLabel);
	}
	const columnWidth = window.contentWidth / cols;
	entries.forEach((entry, index) => {
		const row = Math.floor(index / cols);
		const col = index % cols;
		const label = displayName(entry.id, entry.identified ?? false, entry.instanceId)
			+ (entry.quantity > 1 ? ` x${entry.quantity}` : '')
			+ (entry.note ? ` ${entry.note}` : '');
		const button = new Button({ width: columnWidth - 4, height: rowHeight, text: label, onClick: () => onPick(index) });
		button.position.set(col * columnWidth, rowsTop + row * (rowHeight + 4));
		button.eventMode = 'static';
		button.cursor = 'pointer';
		window.content.addChild(button);
	});
	const cancel = new Button({ width: window.contentWidth, height: rowHeight, text: t('port.ui.itempicker.cancel'), onClick: () => onPick(-1) });
	cancel.position.set(0, rowsTop + rows * (rowHeight + 4));
	cancel.eventMode = 'static';
	cancel.cursor = 'pointer';
	window.content.addChild(cancel);
	if (onCancel) window.onClose.add(onCancel);
	return window;
}
