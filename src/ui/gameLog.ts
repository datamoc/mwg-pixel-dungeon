import { MessageLog, type MessageLevel } from 'mwg/two-d/ui';
import { SPD_STATUS_COLOR } from './spdTheme';

/**
 * The message log, ported from `ui/GameLog.java` and now a thin SPD skin over the
 * framework's `MessageLog` (which was extracted from this file's earlier
 * hand-rolled version - same per-block entries, same drop-by-wrapped-lines trim,
 * same severity levels). What stays SPD-specific here:
 *
 *  - **Severity colours.** `GLog.java`'s `++`/`--`/`**`/`@@` prefixes hardlight a block
 *    with `CharSprite.POSITIVE`/`NEGATIVE`/`WARNING`/`NEUTRAL`; passed as the
 *    `colors` override instead of encoded into the string and parsed back out.
 *  - **The black outline.** `RenderedTextBlock`'s outline keeps small text legible
 *    over game artwork. `MessageLog` builds its own labels with no style hook, so
 *    `add()` re-applies `SpdLabel`'s stroke (and `roundPixels`) to the new block
 *    after delegating - the one place this file still touches label styling, and a
 *    candidate for a framework label-style passthrough instead.
 *  - **Interface size.** `SPDSettings.interfaceSize()`: large keeps 5 lines of
 *    history instead of 3, pushed in via `setInterfaceSize()` whenever the toggle
 *    fires or a save loads.
 *  - **Zoom.** Java's log text (size 6) draws at the UI zoom (3 on a desktop);
 *    the container keeps that scale and rasterises at it too.
 *
 * Two framework micro-differences are accepted, not papered over: `setWrapWidth`
 * trims while it relayouts (this file used to only relayout), and `logHeight`
 * sums the same unscaled block heights times the zoom.
 */
export type LogLevel = MessageLevel;

const LEVEL_COLOR: Record<LogLevel, number> = {
	info: SPD_STATUS_COLOR.default,
	positive: SPD_STATUS_COLOR.positive,
	negative: SPD_STATUS_COLOR.negative,
	warning: SPD_STATUS_COLOR.warning,
	//GLog.HIGHLIGHT maps to CharSprite.NEUTRAL, not to a colour of its own
	highlight: SPD_STATUS_COLOR.neutral,
};

const MAX_LINES_SMALL = 3;
const MAX_LINES_LARGE = 5;

export class GameLog extends MessageLog {
	constructor(wrapWidth: number) {
		super({
			wrapWidth,
			size: 6,
			colors: LEVEL_COLOR,
			//drawn at this container's zoom, so rasterise at it too (device ratio x 3) - at 1x the text was magnified and blurry
			resolution: (globalThis.devicePixelRatio || 1) * 3,
		});
		this.scale.set(3);
	}

	/** `SPDSettings.interfaceSize()`: large keeps 5 lines of history instead of 3. */
	setInterfaceSize(size: 0 | 1): void {
		this.setMaxLines(size === 1 ? MAX_LINES_LARGE : MAX_LINES_SMALL);
	}

	override add(text: string, level: LogLevel = 'info'): void {
		super.add(text, level);
		//No style hook on the built label, so the outline goes on after: the newest
		//block is always the container's last child.
		const label = this.children[this.children.length - 1] as unknown as {
			style: { stroke: unknown };
			roundPixels: boolean;
		};
		label.style.stroke = { color: 0x000000, width: 0.65 };
		label.roundPixels = true;
	}

	/** the log's own drawn height, so the caller can sit it on the bottom edge */
	get logHeight(): number {
		return this.contentHeight * this.scale.y;
	}
}
