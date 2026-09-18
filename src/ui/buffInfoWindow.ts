import { Window, theme } from 'mwg';
import { SpdLabel as Label } from './spdLabel';
import { spdPanel } from './spdPanel';
import { SpdButton } from './spdButton';
import { t } from '../i18n';
import type { BuffInfo } from './buffInfo';

/**
 * `WndInfoBuff`: a single-page name+description popup, opened from a `BuffIndicator` click.
 * The caller owns placement (`place()`, pushing onto the window stack), same as the talent
 * window in `dungeonScene.ts`.
 */
export function showBuffInfoWindow(info: BuffInfo): Window {
	const width = 220;
	const window = new Window({ width, height: 170, title: info.name, anchor: 'center', blocker: true });
	const heading = new Label({ text: info.name, size: 9, color: theme().color.textHighlight, wrapWidth: width - 24 });
	heading.position.set(8, 7);
	const body = new Label({ text: info.desc, size: 6, wrapWidth: width - 24, color: theme().color.text });
	body.position.set(8, 25);
	//The description's real length varies a lot (a one-line ankh buff vs. burning's four
	//paragraphs), so the window grows to fit rather than clipping or scrolling.
	const height = Math.max(170, 25 + body.height + 30);
	const close = new SpdButton({ width: width - 16, height: 16, text: t('port.window.close'), onClick: () => window.close() });
	close.position.set(8, height - 34);
	window.resize(width, height);
	window.content.addChild(spdPanel(width - 16, height - 20), heading, body, close);
	return window;
}
