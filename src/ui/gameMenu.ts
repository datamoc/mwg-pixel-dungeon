import { Button, Game, Window, WindowStack, theme } from 'mwg';
import { challenges } from '../challenges';
import { t } from '../i18n';
import { runState } from '../runState';
import { showChallengesWindow, showRankingsWindow, showSettingsWindow } from './portWindows';
import { titleIcon, type TitleIconName } from './titleIcons';

export interface GameMenuContext {
	/** the scene's own (scaled) window stack: the menu and every window it opens live in it */
	windows: WindowStack;
	/** the run is over, so the menu offers "start a new run" and the rankings */
	gameOver: boolean;
	/** `SPDSettings.intro()`: false while the intro's guide page is unread - saving and leaving is not offered yet */
	canLeave: boolean;
	saveRun: () => void;
	startNewRun: () => void;
	toTitle: () => void;
}

/**
 * `WndGame` (tag `v3.3.8`): the in-game menu, extracted from `DungeonScene.openGameMenu` unchanged
 * apart from taking its scene state through `GameMenuContext` (the scene switches are callbacks so
 * this module adds no import cycle through `ClassSelectScene`/`TitleScene`).
 */
export function openGameMenu({ windows, gameOver, canLeave, saveRun, startNewRun, toTitle }: GameMenuContext): void {
	if (!windows.isEmpty) return;
	const width = 120;
	const buttonHeight = 20;
	const gap = 2;
	//each entry carries the icon Java gives it (`Icons.PREFS`, `CHALLENGE_COLOR`, `ENTER`,
	//`RANKINGS` and `DISPLAY`); `DISPLAY` is two images in Java, chosen by orientation
	const display: TitleIconName = Game.current.width > Game.current.height ? 'displayLand' : 'displayPort';
	const entries: { label: string; icon: TitleIconName; onClick: () => void; disabled?: boolean; highlight?: boolean }[] = [];
	const closeThen = (open: () => void) => () => {
		menuWindow.close();
		open();
	};
	let menuWindow: Window;
	entries.push({
		label: t('windows.wndgame.settings'),
		icon: 'prefs',
		//a language change rebuilds the interface; mid-run that means keeping the run
		//and reopening settings with fresh labels (`WndSettings` changes language in
		//place in Java - this is the closest without a scene rebuild)
		onClick: closeThen(() => showSettingsWindow(windows, () => showSettingsWindow(windows, () => undefined))),
	});
	if (challenges().size > 0) {
		entries.push({ label: t('windows.wndgame.challenges'), icon: 'challenge', onClick: closeThen(() => showChallengesWindow(windows)) });
	}
	if (gameOver) {
		entries.push({
			label: t('windows.wndgame.start'),
			icon: 'enter',
			//Java tints this one `Window.TITLE_COLOR`, its "highlight"/attention colour
			highlight: true,
			onClick: closeThen(startNewRun),
		});
		entries.push({ label: t('windows.wndgame.rankings'), icon: 'rankings', onClick: closeThen(() => showRankingsWindow(windows)) });
	}
	entries.push({
		label: t('windows.wndgame.menu'),
		icon: display,
		//`SPDSettings.intro()`: a genuinely new player is sealed in until the intro's guide page
		//closes, so saving and bailing out to the title is not offered yet - see `guideProgress`
		disabled: !canLeave,
		onClick: closeThen(() => {
			saveRun();
			toTitle();
		}),
	});
	const contentHeight = entries.length * buttonHeight + (entries.length - 1) * gap;
	menuWindow = new Window({ width, height: contentHeight, anchor: 'center', blocker: true });
	//`Window`'s width/height are OUTER: its content origin is inset past the frame and padding.
	//Sized as the content alone, the frame came out one inset too small and the buttons hung
	//over its right and bottom edges. Grow it by the measured inset instead.
	menuWindow.resize(2 * width - menuWindow.contentWidth, 2 * contentHeight - menuWindow.contentHeight);
	entries.forEach((entry, index) => {
		const button = new Button({
			width,
			height: buttonHeight,
			text: entry.label,
			icon: titleIcon(runState.sprites.uiIcons, entry.icon, 1),
			disabled: entry.disabled,
			...(entry.highlight ? { label: { color: theme().color.textHighlight } } : {}),
			onClick: entry.onClick,
		});
		button.position.set(0, index * (buttonHeight + gap));
		menuWindow.content.addChild(button);
	});
	windows.push(menuWindow);
}
