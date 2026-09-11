import { SpdLabel as Label } from '../ui/spdLabel';
import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { Game, Scene2D, Input, theme, Window, WindowStack } from 'mwg';
import { t, language, setLanguage, nextLanguage } from '../i18n/index';
import { titleIcon, type TitleIconName } from '../ui/titleIcons';
import { TitleBackground } from '../ui/titleBackground';
import { TitleFlame } from '../ui/titleFlame';
import { runState, LANGUAGE_KEY, APP_VERSION } from '../runState';
import { BADGE_DEFS, BADGE_ICON, loadBadges } from '../badges';
import { ClassSelectScene } from './classSelectScene';
import { rankings } from '../rankings';
import { CHALLENGES, challenges, challengeDescription, challengeLabel, toggleChallenge } from '../challenges';

import { SpdButton as Button, menuScale } from '../ui/spdButton';

// -------------------------------------------------------------------- title

export class TitleScene extends Scene2D {
	private background!: TitleBackground;
	private signs!: Sprite;
	private signTime = 0;
	private readonly torches: TitleFlame[] = [];
	private readonly windows = new WindowStack();

	override create(): void {
		//`Archs.java`'s scrolling background, real `arcs1.png`/`arcs2.png` art
		this.background = new TitleBackground(runState.sprites.uiArcsBg, runState.sprites.uiArcsFg);
		this.stage.addChild(this.background);

		//BannerSprites.PIXEL_DUNGEON and PIXEL_DUNGEON_SIGNS: real Java's own
		//interfaces/banners.png regions are 132x90/124x90, but this port's asset is a
		//custom "MWG Pixel Dungeon" redraw (see `banners old.png` for the original SPD
		//art it replaced), not byte-for-byte SPD art - three stacked lines instead of
		//"SHATTERED"/"PIXEL DUNGEON"'s two, so it needs 108px of height, not 90, or the
		//real Java frame rect clips the bottom of "Dungeon" against the next sprite
		//(BossSlain) below it in the sheet. Found live via browser screenshot.
		const title = new Sprite(new Texture({
			source: runState.sprites.banners.source,
			frame: new Rectangle(0, 0, 132, 108),
		}));
		const signs = new Sprite(new Texture({
			source: runState.sprites.banners.source,
			frame: new Rectangle(132, 0, 124, 108),
		}));
		this.stage.addChild(title);

		//`TitleScene.placeTorch` x2, flanking the title art like the real Java scene
		const torchLeft = new TitleFlame(runState.sprites.effectFireball, 0, 0);
		const torchRight = new TitleFlame(runState.sprites.effectFireball, 0, 0);
		this.torches.push(torchLeft, torchRight);
		this.stage.addChild(torchLeft, torchRight);

		this.stage.addChild(signs);
		signs.blendMode = 'add';
		this.signs = signs;

		const menuButtons: Button[] = [];
		const makeButton = (text: string, onClick?: () => void, iconName?: TitleIconName): Button => {
			const button = new Button({
				width: 1,
				height: 1,
				text,
				icon: iconName ? titleIcon(runState.sprites.uiIcons, iconName, 1) : undefined,
				onClick,
			});
			menuButtons.push(button);
			this.stage.addChild(button);
			return button;
		};
		makeButton(t('scenes.titlescene.enter'), () => this.begin(), 'enter');
		makeButton(t('scenes.titlescene.support'), () => this.showInfoWindow(t('port.window.support.title'), t('port.window.support.body')), 'gold');
		makeButton(t('scenes.titlescene.rankings'), () => this.showRankingsWindow(), 'rankings');
		makeButton(t('scenes.titlescene.news'), () => this.showInfoWindow(t('port.window.news.title'), t('port.window.news.body')), 'news');
		makeButton(t('scenes.titlescene.settings'), () => this.showSettingsWindow(), 'prefs');
		makeButton(t('scenes.titlescene.badges'), () => this.showBadgesWindow(), 'badges');
		makeButton(
			t('scenes.titlescene.changes'),
			() => this.showInfoWindow(t('port.window.changes.title'), t('port.window.changes.body', { version: APP_VERSION })),
			'changes'
		);
		makeButton(t('scenes.titlescene.about'), () => this.showInfoWindow(t('port.window.about.title'), t('port.window.about.body', { version: APP_VERSION })), 'shpx');
		const version = new Label({ text: `v${APP_VERSION}`, size: 8, color: 0x888888 });
		this.stage.addChild(version);
		const menu = new Container();
		for (const child of [...this.stage.children]) menu.addChild(child);
		this.stage.addChild(menu);
		this.stage.addChild(this.windows);

		this.layout = () => {
			const { width, height } = Game.current;
			const scale = menuScale(width, height);
			menu.scale.set(scale);
			const w = width / scale, h = height / scale;
			this.background.resize(w, h);
			const topRegion = Math.max(84, h * 0.45);
			//The redrawn "MWG Pixel Dungeon" art's own bbox (all 3 lines) is centred in
			//the 132px frame (x~7..124, centre 65.5, matching the frame's own 66) - but
			//the "Pixel" line the torches sit level with is narrower and shifted left
			//(x~8..110, centre 59). Flanking the torches on the frame centre (66, the
			//original 22/110 offsets) put them symmetric on the frame but visibly off
			//from the "Pixel" glyphs beside them; flanking them on the glyph centre (59)
			//fixed that but then threw the whole title+torches *group* off true screen
			//centre by 66-59=7px. GROUP_X_OFFSET shifts the whole group right by that
			//7px so the torch/glyph-centred layout also lands on screen centre - found
			//live via browser screenshot, both alignments confirmed together.
			const GROUP_X_OFFSET = 7;
			title.position.set(Math.round((w - 132) / 2) + GROUP_X_OFFSET, Math.round(2 + (topRegion - 108) / 2));
			signs.position.set(title.x + 4, title.y);
			torchLeft.position.set(title.x + 15, title.y + 46);
			torchRight.position.set(title.x + 103, title.y + 46);
			const landscape = w > h;
			const gap = Math.max(2, Math.floor(Math.floor((h - topRegion - (landscape ? 3 : 4) * 20) / 3) / (landscape ? 3 : 5)));
			const rect = (i: number, x: number, y: number, bw: number) => {
				menuButtons[i].position.set(Math.round(x), Math.round(y));
				menuButtons[i].resize(bw, 20);
			};
			const y = topRegion + gap;
			if (landscape) {
				const x = title.x - 50, bw = 115, small = bw * 0.67 - 1;
				rect(0, x, y, bw); rect(1, x + bw + 2, y, bw);
				[2, 3, 4].forEach((i, col) => rect(i, x + col * (small + 2), y + 20 + gap, small));
				[5, 6, 7].forEach((i, col) => rect(i, x + col * (small + 2), y + 40 + 2 * gap, small));
			} else {
				rect(0, title.x, y, 132); rect(1, title.x, y + 20 + gap, 132);
				[[2, 5], [3, 6], [4, 7]].forEach((row, r) => row.forEach((i, c) => rect(i, title.x + c * 67, y + (r + 2) * (20 + gap), 65)));
			}
			version.position.set(w - version.width - 4, h - version.height - 2);
			this.windows.scale.set(scale);
			this.windows.setViewport(w, h);
		};
		this.layout();

		this.onAction = (action) => {
			//a window swallows 'cancel' itself (WindowStack's own listener, registered ahead
			//of this one - see its constructor); 'confirm' has no such window-side handler,
			//so it is guarded here instead, or Enter would begin a run out from under an open
			//Support/Rankings/Badges/etc. window rather than dismissing it
			if (action === 'confirm' && this.windows.isEmpty) this.begin();
		};
		Input.onAction.add(this.onAction);
		this.onDestroy.add(() => Input.onAction.remove(this.onAction));
	}

	private layout: () => void = () => {};
	private onAction: (action: string) => void = () => {};

	private begin(): void {
		runState.audio.startTitle();
		Game.current.switchScene(ClassSelectScene);
	}

	/** `WndOptions`/`WndInfo`-style single-message window, close-only - used by every
	 * title-screen button that has no richer content to show. */
	private showInfoWindow(title: string, body: string): void {
		const width = Math.min(180, Game.current.width / menuScale(Game.current.width, Game.current.height) - 16);
		const label = new Label({ text: body, size: 6, wrapWidth: width - 16, color: theme().color.text });
		const window = new Window({ width, height: label.height + 48, title, anchor: 'center' });
		window.content.addChild(label);
		const close = new Button({
			width: window.contentWidth,
			height: 18,
			text: t('port.window.close'),
			onClick: () => window.close(),
		});
		close.position.set(0, label.height + 6);
		window.content.addChild(close);
		this.windows.push(window);
	}

	private showSettingsWindow(): void {
		const width = Math.min(180, Game.current.width / menuScale(Game.current.width, Game.current.height) - 16);
		const window = new Window({ width, height: 136, title: t('port.window.settings.title'), anchor: 'center' });
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
				try {
					localStorage.setItem(LANGUAGE_KEY, next.code);
				} catch {
					//a browser with storage blocked still gets the language for this session
				}
				window.close();
				Game.current.switchScene(TitleScene);
			},
		});
		languageButton.position.set(0, versionLabel.height + 8);
		window.content.addChild(languageButton);
		const challengeButton = new Button({ width: window.contentWidth, height: 22, text: t('windows.wndchallenges.title'), onClick: () => { window.close(); this.showChallengesWindow(); } });
		challengeButton.position.set(0, languageButton.y + 26);
		window.content.addChild(challengeButton);
		const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => window.close() });
		close.position.set(0, challengeButton.y + 30);
		window.content.addChild(close);
		this.windows.push(window);
	}

	/** `WndChallenges`: selected challenge ids persist between runs like SPD's settings. */
	private showChallengesWindow(): void {
		const width = Math.min(250, Game.current.width / menuScale(Game.current.width, Game.current.height) - 16);
		const window = new Window({ width, height: CHALLENGES.length * 24 + 52, title: t('windows.wndchallenges.title'), anchor: 'center' });
		const description = new Label({ size: 6, wrapWidth: width - 16, color: theme().color.textDim });
		description.position.set(0, CHALLENGES.length * 24 + 2);
		window.content.addChild(description);
		CHALLENGES.forEach((def, index) => {
			const button = new Button({ width: window.contentWidth, height: 21, text: `${challenges().has(def.id) ? '✓ ' : ''}${challengeLabel(def)}`, onClick: () => {
				toggleChallenge(def.id);
				window.close();
				this.showChallengesWindow();
			} });
			button.position.set(0, index * 24);
			button.on('pointerover', () => description.setText(challengeDescription(def)));
			button.on('pointertap', () => description.setText(challengeDescription(def)));
			window.content.addChild(button);
		});
		const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => window.close() });
		close.position.set(0, window.contentHeight - 18);
		window.content.addChild(close);
		this.windows.push(window);
	}

	/** `RankingsScene` backed by completed local runs, rather than the former informational stub. */
	private showRankingsWindow(): void {
		const records = rankings();
		const width = Math.min(220, Game.current.width / menuScale(Game.current.width, Game.current.height) - 16);
		const title = t('scenes.rankingsscene.title');
		if (records.length === 0) {
			this.showInfoWindow(title, t('scenes.rankingsscene.no_games'));
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
		const window = new Window({ width, height: 100, title, anchor: 'center' });
		window.content.addChild(total, entries);
		entries.y = total.height + 5;
		const close = new Button({ width: window.contentWidth, height: 18, text: t('port.window.close'), onClick: () => window.close() });
		const chrome = window.height - window.contentHeight;
		window.resize(width, Math.min(400, chrome + total.height + 5 + entries.height + 8 + close.height));
		close.position.set(0, window.contentHeight - close.height);
		window.content.addChild(close);
		this.windows.push(window);
	}

	/** BadgesGrid presentation, limited to the badge set implemented by this port. */
	private showBadgesWindow(): void {
		const badges = loadBadges();
		const width = 156;
		const rows = Math.ceil(BADGE_DEFS.length / 5);
		const window = new Window({ width, height: rows * 24 + 75, title: t('port.window.badges.title'), anchor: 'center' });
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
		this.windows.push(window);
	}

	override update(dt: number): void {
		this.background.update(dt);
		this.signTime += dt;
		if (this.signTime >= 1.5 * Math.PI) this.signTime = 0;
		this.signs.alpha = Math.max(0, Math.sin(this.signTime));
		for (const torch of this.torches) torch.update(dt);
		this.windows.update(dt);
		runState.audio.update(dt);
	}

	override resize(_w: number, _h: number): void {
		this.layout();
	}
}
