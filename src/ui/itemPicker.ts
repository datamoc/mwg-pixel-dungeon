import { Button, Label, theme, Window } from 'mwg';
import { Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
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
 * for renders the item's icon per row (`ItemButton`; this port draws the 16x16 sheet frame the bag
 * uses, via `iconFrame`, not `ItemButton`'s 32x32 tile) and, in every case this
 * port has audited so far, a second confirm step before committing (`WndSadGhost`'s `RewardWindow`
 * extends `WndInfoItem` with explicit Confirm/Cancel buttons; `WndTradeItem`'s Buy button is
 * likewise a second press, already reproduced here via each row's own `note`/price text). This
 * picker instead renders one text-label button per row (icon + name + quantity + optional note),
 * and picking a row commits immediately - a single "Cancel" row is the only escape, not
 * a per-item confirm/cancel pair. The underlying choice set, gating, and pick logic are real at
 * every call site (see each site's own `PORT_COVERAGE.md` row); this file's own row documents the
 * shared presentation gap once instead of repeating it at each of the ~15 call sites. */
export function createItemPickerWindow({ width, title, body, entries, displayName, iconFrame, onPick, onCancel }: ItemPickerContext): Window {
	const cols = entries.length > 6 ? 2 : 1;
	const rows = Math.ceil(entries.length / cols);
	const rowHeight = 24;
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
		const frame = iconFrame?.(entry.id, entry.instanceId);
		if (frame !== undefined) {
			const icon = new Sprite(new Texture({ source: runState.sprites.items.source, frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) }));
			icon.position.set(button.x + 4, button.y + (rowHeight - 16) / 2);
			icon.eventMode = 'none';
			window.content.addChild(icon);
		}
	});
	const cancel = new Button({ width: window.contentWidth - 4, height: rowHeight, text: t('port.ui.itempicker.cancel'), onClick: () => onPick(-1) });
	cancel.position.set(0, rowsTop + rows * (rowHeight + 4));
	cancel.eventMode = 'static';
	cancel.cursor = 'pointer';
	window.content.addChild(cancel);
	if (onCancel) window.onClose.add(onCancel);
	return window;
}
