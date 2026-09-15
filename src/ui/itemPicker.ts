import { Button, Label, theme } from 'mwg';
import { Container2D, Shape2D } from 'mwg/two-d/render';
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
	panel: Container2D;
	width: number;
	title: string;
	entries: readonly ItemPickerEntry[];
	displayName: (id: string, identified: boolean, instanceId?: string) => string;
	onPick: (index: number) => void;
}

/** Renders the shared bag picker used by alchemy, transmutation, stones, and shop actions. */
export function renderItemPicker({ panel, width, title, entries, displayName, onPick }: ItemPickerContext): void {
	const cols = entries.length > 6 ? 2 : 1;
	const rows = Math.ceil(entries.length / cols);
	const rowHeight = 24;
	const panelHeight = 34 + rows * (rowHeight + 4) + (rowHeight + 4);
	panel.addChild(new Shape2D().roundRect(0, 0, width, panelHeight, 6)
		.fill({ color: 0x101116, alpha: 0.98 }).stroke({ width: 2, color: 0xc9a24c }));
	const pickerTitle = new Label({ text: title, size: 13, bold: true, color: theme().color.textHighlight });
	pickerTitle.position.set(10, 7);
	panel.addChild(pickerTitle);
	const columnWidth = (width - 16) / cols;
	entries.forEach((entry, index) => {
		const row = Math.floor(index / cols);
		const col = index % cols;
		const label = displayName(entry.id, entry.identified ?? false, entry.instanceId)
			+ (entry.quantity > 1 ? ` x${entry.quantity}` : '')
			+ (entry.note ? ` ${entry.note}` : '');
		const button = new Button({ width: columnWidth - 8, height: rowHeight, text: label, onClick: () => onPick(index) });
		button.position.set(8 + col * columnWidth, 34 + row * (rowHeight + 4));
		button.eventMode = 'static';
		button.cursor = 'pointer';
		panel.addChild(button);
	});
	const cancel = new Button({ width: width - 16, height: rowHeight, text: t('port.ui.itempicker.cancel'), onClick: () => onPick(-1) });
	cancel.position.set(8, 34 + rows * (rowHeight + 4));
	cancel.eventMode = 'static';
	cancel.cursor = 'pointer';
	panel.addChild(cancel);
}
