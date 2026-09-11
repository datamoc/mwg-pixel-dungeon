import { Button, Label, Window, theme } from 'mwg';
import { t } from '../i18n';

export interface JournalPage {
	title: string;
	body: string;
}

export interface JournalTab {
	label: string;
	pages: JournalPage[];
}

/**
 * WndJournal: a compact, paged journal window.  SPD's documents are long enough
 * that showing one paragraph at a time keeps the window usable on phone-sized
 * canvases while still exposing the complete translated text.
 */
export function createJournalWindow(tabs: JournalTab[], onClose: () => void): Window {
	const width = 280;
	const height = 238;
	const window = new Window({ width, height, title: t('windows.wndjournal.notes'), anchor: 'center' });
	let tabIndex = 0;
	let pageIndex = 0;
	let paragraphIndex = 0;
	const tabButtons: Button[] = [];
	const title = new Label({ size: 8, color: theme().color.textHighlight, wrapWidth: 76 });
	const body = new Label({ size: 7, color: theme().color.text, wrapWidth: 184 });
	const progress = new Label({ size: 6, color: theme().color.textDim, align: 'center' });
	const previous = new Button({ width: 58, height: 18, text: '<', onClick: () => {
		const pages = tabs[tabIndex]?.pages ?? [];
		if (!pages.length) return;
		if (paragraphIndex > 0) paragraphIndex--;
		else pageIndex = (pageIndex + pages.length - 1) % pages.length;
		paragraphIndex = Math.min(paragraphIndex, paragraphs().length - 1);
		render();
	} });
	const next = new Button({ width: 58, height: 18, text: '>', onClick: () => {
		const pages = tabs[tabIndex]?.pages ?? [];
		if (paragraphIndex + 1 < paragraphs().length) paragraphIndex++;
		else { pageIndex = (pageIndex + 1) % pages.length; paragraphIndex = 0; }
		render();
	} });
	const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => { onClose(); window.close(); } });
	for (const [index, tab] of tabs.entries()) {
		const button = new Button({ width: 84, height: 18, text: tab.label, onClick: () => {
			tabIndex = index; pageIndex = 0; paragraphIndex = 0; render();
		} });
		button.position.set(index * 84, 0);
		tabButtons.push(button);
	}
	title.position.set(0, 23);
	body.position.set(84, 23);
	progress.position.set(84, 190);
	previous.position.set(84, 208);
	next.position.set(148, 208);
	close.position.set(0, window.contentHeight - 18);
	window.content.addChild(...tabButtons, title, body, progress, previous, next, close);
	const paragraphs = (): string[] => (tabs[tabIndex]?.pages[pageIndex]?.body.split(/\n\s*\n/).filter(Boolean) ?? ['']);
	const render = (): void => {
		const pages = tabs[tabIndex]?.pages ?? [];
		if (!pages.length) return;
		const page = pages[pageIndex] ?? pages[0]!;
		const parts = paragraphs();
		title.setText(page.title);
		body.setText(parts[paragraphIndex] ?? '');
		progress.setText(`${pageIndex + 1}/${pages.length}  ${paragraphIndex + 1}/${parts.length}`);
	};
	render();
	return window;
}
