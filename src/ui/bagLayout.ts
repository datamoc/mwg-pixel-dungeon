/**
 * The bag window's grid geometry in both interface sizes - the pure arithmetic behind
 * `InventoryWindow.draw()`, kept here (no Pixi, no `mwg`) so `tools/verifyBagLayout.mjs`
 * pins it in node.
 *
 * Narrow is the port's long-standing fixed 5-column arrangement. Wide is Java's
 * `InventoryPane` shape (`ui/InventoryPane.java`, tag `v3.3.8`): that pane is 187 wide
 * with 17px slots, an equipped row of 5 on top and its 20 bag slots in two rows of 10
 * (`left - x > width - 17` wraps after the 10th slot). This port's window is not that
 * pane - it stays a tabbed popup with its own tab rows and footer - but in large
 * interface mode its grid switches to the same 10-column wide arrangement: the 5
 * equipped slots still lead, followed by the page's up-to-20 bag slots, padded out to
 * three full rows. `layout()`'s integer-fit zoom applies unchanged, so an over-wide
 * window on a tiny viewport behaves exactly as the narrow one always has.
 */

export interface BagGridLayout {
	/** grid columns: 5 narrow, Java's 10 wide */
	columns: number;
	windowWidth: number;
	windowHeight: number;
	gridWidth: number;
	gridHeight: number;
	gridY: number;
	/** total cells: 5 equipped + one 20-item page, padded to full rows */
	padTotal: number;
	/** y of the pagination/close footer row */
	footerY: number;
}

const CELL = 29;
const GRID_Y = 55;
const EQUIPPED_COUNT = 5;
const PAGE_SIZE = 20;

export function bagGridLayout(wide: boolean): BagGridLayout {
	if (!wide) {
		return {
			columns: 5,
			windowWidth: 156,
			windowHeight: 226,
			gridWidth: 145,
			gridHeight: 145,
			gridY: GRID_Y,
			padTotal: 25,
			footerY: 204,
		};
	}
	const columns = 10;
	const rows = Math.ceil((EQUIPPED_COUNT + PAGE_SIZE) / columns);
	const gridWidth = columns * CELL;
	const gridHeight = rows * CELL;
	const footerY = GRID_Y + gridHeight + 4;
	return {
		columns,
		windowWidth: gridWidth + 12,
		windowHeight: footerY + 17 + 5,
		gridWidth,
		gridHeight,
		gridY: GRID_Y,
		padTotal: rows * columns,
		footerY,
	};
}
