import { Container } from 'pixi.js';
import { SpdLabel as Label } from './spdLabel';
import { SPD_STATUS_COLOR } from './spdTheme';

/**
 * The message log, ported from `ui/GameLog.java`.
 *
 * Three behaviours of the real log that the port's previous single dim `Label` had none of,
 * and that carry real information:
 *
 *  - **Severity colour.** `GLog.java` prefixes a line with `++`/`--`/`**`/`@@` and
 *    `GameLog.update()` strips the prefix and hardlights the block with
 *    `CharSprite.POSITIVE`/`NEGATIVE`/`WARNING`/`NEUTRAL` respectively, plain lines staying
 *    `DEFAULT`. Colour is how "you are starving" reads differently from "you found a
 *    dewdrop" at a glance. The prefixes themselves are not reproduced - a severity is passed
 *    as an argument instead of encoded into the string and parsed back out.
 *  - **Merging.** Consecutive entries of the *same* colour are appended into one block
 *    joined by a space, while that block is still under the line limit, rather than each
 *    taking a line of its own.
 *  - **Dropping by line, not by entry.** The oldest block is dropped while the total wrapped
 *    line count exceeds the limit, so one long message costs as much room as the several
 *    short ones it is worth.
 *
 * `MAX_LINES` is 3, or 5 when `SPDSettings.interfaceSize() > 0`. This port has no interface
 * size setting, so it takes the larger 5 - the value the old log already showed.
 */
const MAX_LINES = 5;

export type LogLevel = 'info' | 'positive' | 'negative' | 'warning' | 'highlight';

const LEVEL_COLOR: Record<LogLevel, number> = {
	info: SPD_STATUS_COLOR.default,
	positive: SPD_STATUS_COLOR.positive,
	negative: SPD_STATUS_COLOR.negative,
	warning: SPD_STATUS_COLOR.warning,
	//GLog.HIGHLIGHT maps to CharSprite.NEUTRAL, not to a colour of its own
	highlight: SPD_STATUS_COLOR.neutral,
};

interface Block {
	label: Label;
	level: LogLevel;
	text: string;
}

export class GameLog extends Container {
	private blocks: Block[] = [];
	private wrapWidth: number;

	constructor(wrapWidth: number) {
		super();
		this.wrapWidth = wrapWidth;
		this.scale.set(2);
	}

	add(text: string, level: LogLevel = 'info'): void {
		const last = this.blocks[this.blocks.length - 1];

		//merge into the previous block when the colour matches and it still has room, as
		//GameLog.update() does with `lastEntry.nLines < maxLines`
		if (last && last.level === level && this.linesOf(last) < MAX_LINES) {
			last.text = last.text.length === 0 ? text : `${last.text} ${text}`;
			last.label.setText(last.text);
		} else {
			const label = new Label({
				text,
				size: 6,
				color: LEVEL_COLOR[level],
				wrapWidth: this.wrapWidth,
			});
			this.addChild(label);
			this.blocks.push({ label, level, text });
		}

		this.trim();
		this.layout();
	}

	/** how many wrapped lines a block occupies, Java's `RenderedTextBlock.nLines` */
	private linesOf(block: Block): number {
		//Pixi measures the wrapped text for us; height/lineHeight is its line count
		const lineHeight = (block.label.style.lineHeight as number) || block.label.style.fontSize;
		return Math.max(1, Math.round(block.label.height / lineHeight));
	}

	private trim(): void {
		//drop oldest blocks while the total line count is over budget - by lines, as Java
		//does, not by entry count
		for (;;) {
			let lines = 0;
			for (const block of this.blocks) lines += this.linesOf(block);
			if (lines <= MAX_LINES || this.blocks.length <= 1) break;
			const oldest = this.blocks.shift();
			oldest?.label.destroy();
		}
	}

	private layout(): void {
		let y = 0;
		for (const block of this.blocks) {
			block.label.x = 0;
			block.label.y = y;
			y += block.label.height;
		}
	}

	/** the log's own drawn height, so the caller can sit it on the bottom edge */
	get logHeight(): number {
		let height = 0;
		for (const block of this.blocks) height += block.label.height;
		return height * this.scale.y;
	}

	setWrapWidth(width: number): void {
		this.wrapWidth = width;
		for (const block of this.blocks) {
			block.label.style.wordWrapWidth = width;
		}
		this.layout();
	}
}
