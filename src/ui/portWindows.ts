import { Rectangle, Sprite, Texture } from 'pixi.js';
import { Game, theme, Window, WindowStack } from 'mwg';
import { t, language, nextLanguage, setLanguage } from '../i18n/index';
import { runState, LANGUAGE_KEY, APP_VERSION } from '../runState';
import { BADGE_DEFS, BADGE_ICON, loadBadges } from '../badges';
import { CHALLENGES, challenges, challengeDescription, challengeLabel, toggleChallenge } from '../challenges';
import { rankings } from '../rankings';
import { applySpdDirection } from './spdTheme';
import { SpdButton as Button, menuScale } from './spdButton';
import { SpdLabel as Label } from './spdLabel';
import { titleIcon } from './titleIcons';

/**
 * The windows SPD opens over a scene, extracted from `TitleScene` so the in-game menu
 * (`WndGame`) can open the same ones - Java shares them the same way, since `WndSettings`,
 * `WndChallenges` and `WndRankings` are plain windows any scene can `show`.
 *
 * Each takes the scene's own `WindowStack` (the caller owns it, its viewport and its `update`),
 * and each is sized the way its Java counterpart is: `WndChallenges` at `24` per row, the
 * rankings window to its content, the badges grid to `5` columns of `16px` icons. Every window
 * here passes `blocker: true` (MWG 0.8.0, item 324): Java's `Window` carries a full-screen
 * blocker that swallows outside clicks and dismisses the window, so no caller has to add one.
 */
function windowWidth(cap: number): number {
	return Math.min(cap, Game.current.width / menuScale(Game.current.width, Game.current.height) - 16);
}

/** `WndOptions`/`WndInfo`-style single-message window, close-only - used by every title-screen
 * button that has no richer content to show, and by the rankings window's empty case. */
export function showInfoWindow(windows: WindowStack, title: string, body: string): void {
	const width = windowWidth(180);
	const label = new Label({ text: body, size: 6, wrapWidth: width - 16, color: theme().color.text });
	const window = new Window({ width, height: label.height + 48, title, anchor: 'center', blocker: true });
	window.content.addChild(label);
	const close = new Button({
		width: window.contentWidth,
		height: 18,
		text: t('port.window.close'),
		onClick: () => window.close(),
	});
	close.position.set(0, label.height + 6);
	window.content.addChild(close);
	windows.push(window);
}

/** `WndOptions`' two-button shape, for the one place this port needs a real yes/no rather than a
 * message: `MissileWeapon.doThrow`'s warning before throwing the last of an upgraded stack.
 * Java builds the same thing out of `WndOptions` with an `onSelect(index)`; this is that, worded
 * with SPD's own `break_upgraded_warn_*` strings. */
export function showConfirmWindow(windows: WindowStack, title: string, body: string, yes: string, no: string, onYes: () => void): void {
	const width = windowWidth(180);
	const label = new Label({ text: body, size: 6, wrapWidth: width - 16, color: theme().color.text });
	const window = new Window({ width, height: label.height + 70, title, anchor: 'center', blocker: true });
	window.content.addChild(label);
	const half = Math.floor((window.contentWidth - 6) / 2);
	const yesButton = new Button({ width: half, height: 18, text: yes, onClick: () => { window.close(); onYes(); } });
	yesButton.position.set(0, label.height + 6);
	window.content.addChild(yesButton);
	const noButton = new Button({ width: half, height: 18, text: no, onClick: () => window.close() });
	noButton.position.set(half + 6, label.height + 6);
	window.content.addChild(noButton);
	windows.push(window);
}

/**
 * Settings: the port's real settings are the language and the challenge set (`WndSettings`' music,
 * sound and brightness have no seam here, and its other tabs are unported).
 *
 * A language change rebuilds the whole interface, which the title screen does by switching to
 * itself; `onLanguageChanged` is what a caller wants to happen instead - the title passes its own
 * scene switch, the in-game menu keeps the run and just closes the menu, so a mid-run language
 * change does not abandon the hero (`WndSettings` changes language in place in Java).
 */
export function showSettingsWindow(windows: WindowStack, onLanguageChanged: () => void): void {
	const width = windowWidth(180);
	const window = new Window({ width, height: 136, title: t('port.window.settings.title'), anchor: 'center', blocker: true });
	const versionLabel = new Label({ text: t('port.window.settings.version', { version: APP_VERSION }), size: 7, color: theme().color.textDim });
	window.content.addChild(versionLabel);
	const languageButton = new Button({
		width: window.contentWidth,
		height: 22,
		text: t('port.ui.language', { language: language().nativeName }),
		icon: titleIcon(runState.sprites.uiIcons, 'langs', 1),
		onClick: () => {
			const next = nextLanguage();
			setLanguage(next);
			//`theme.direction` follows the active catalogue - see `applySpdDirection`
			applySpdDirection();
			try {
				localStorage.setItem(LANGUAGE_KEY, next.code);
			} catch {
				//a browser with storage blocked still gets the language for this session
			}
			window.close();
			onLanguageChanged();
		},
	});
	languageButton.position.set(0, versionLabel.height + 8);
	window.content.addChild(languageButton);
	const challengeButton = new Button({
		width: window.contentWidth,
		height: 22,
		text: t('windows.wndchallenges.title'),
		onClick: () => {
			window.close();
			showChallengesWindow(windows);
		},
	});
	challengeButton.position.set(0, languageButton.y + 26);
	window.content.addChild(challengeButton);
	const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => window.close() });
	close.position.set(0, challengeButton.y + 30);
	window.content.addChild(close);
	windows.push(window);
}

/** `WndChallenges`: selected challenge ids persist between runs like SPD's settings. */
export function showChallengesWindow(windows: WindowStack): void {
	const width = windowWidth(250);
	const window = new Window({ width, height: CHALLENGES.length * 24 + 52, title: t('windows.wndchallenges.title'), anchor: 'center', blocker: true });
	const description = new Label({ size: 6, wrapWidth: width - 16, color: theme().color.textDim });
	description.position.set(0, CHALLENGES.length * 24 + 2);
	window.content.addChild(description);
	CHALLENGES.forEach((def, index) => {
		const button = new Button({
			width: window.contentWidth,
			height: 21,
			text: `${challenges().has(def.id) ? '✓ ' : ''}${challengeLabel(def)}`,
			onClick: () => {
				toggleChallenge(def.id);
				window.close();
				showChallengesWindow(windows);
			},
		});
		button.position.set(0, index * 24);
		button.on('pointerover', () => description.setText(challengeDescription(def)));
		button.on('pointertap', () => description.setText(challengeDescription(def)));
		window.content.addChild(button);
	});
	const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => window.close() });
	close.position.set(0, window.contentHeight - 18);
	window.content.addChild(close);
	windows.push(window);
}

/** `RankingsScene` backed by completed local runs, rather than the former informational stub. */
export function showRankingsWindow(windows: WindowStack): void {
	const records = rankings();
	const width = windowWidth(220);
	const title = t('scenes.rankingsscene.title');
	if (records.length === 0) {
		showInfoWindow(windows, title, t('scenes.rankingsscene.no_games'));
		return;
	}
	const body = records.slice(0, 8).map((record, index) => {
		const result = t(record.result === 'won' ? 'rankings$record.won' : 'rankings$record.something');
		return `#${index + 1}  ${result}\n${t('windows.wndranking$statstab.score')}: ${record.score}`;
	}).join('\n\n');
	const total = new Label({ text: `${t('scenes.rankingsscene.total')} ${records.length}`, size: 7, color: theme().color.textDim });
	const entries = new Label({ text: body, size: 6, wrapWidth: width - 16, color: theme().color.text });
	// Size the frame to what is actually inside it. The old `entries.height + 50` guess did not
	// account for the frame/title chrome or the close button, so the button was drawn over the
	// last row and the final score fell below the panel's own edge - measured live, three runs
	// needed 97px of content in the 74px the guess produced. `Window` does not expose its chrome
	// height, so derive it from a window of known size and then `resize`.
	const window = new Window({ width, height: 100, title, anchor: 'center', blocker: true });
	window.content.addChild(total, entries);
	entries.y = total.height + 5;
	const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => window.close() });
	const chrome = window.height - window.contentHeight;
	window.resize(width, Math.min(400, chrome + total.height + 5 + entries.height + 8 + close.height));
	close.position.set(0, window.contentHeight - close.height);
	window.content.addChild(close);
	windows.push(window);
}

/** BadgesGrid presentation, limited to the badge set implemented by this port. */
export function showBadgesWindow(windows: WindowStack): void {
	const badges = loadBadges();
	const width = 156;
	const rows = Math.ceil(BADGE_DEFS.length / 5);
	const window = new Window({ width, height: rows * 24 + 75, title: t('port.window.badges.title'), anchor: 'center', blocker: true });
	const description = new Label({ size: 6, wrapWidth: window.contentWidth, align: 'center' });
	description.position.set(0, rows * 24 + 2);
	window.content.addChild(description);
	BADGE_DEFS.forEach((def, i) => {
		const index = BADGE_ICON[def.id] ?? 0;
		const columns = Math.floor(runState.sprites.uiBadges.width / 16);
		const icon = new Sprite(new Texture({ source: runState.sprites.uiBadges.source, frame: new Rectangle(index % columns * 16, Math.floor(index / columns) * 16, 16, 16) }));
		icon.position.set(10 + i % 5 * 26, 2 + Math.floor(i / 5) * 24);
		icon.tint = badges.unlocked(def.id) ? 0xffffff : 0x555555;
		icon.eventMode = 'static'; icon.cursor = 'pointer';
		const describe = () => description.setText(`${def.description}${badges.unlocked(def.id) ? '' : ` — ${t('port.window.badges.locked')}`}`);
		icon.on('pointerover', describe); icon.on('pointertap', describe);
		window.content.addChild(icon);
	});
	const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => window.close() });
	close.position.set(0, window.contentHeight - 18); window.content.addChild(close);
	windows.push(window);
}
