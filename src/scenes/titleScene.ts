import { SpdLabel as Label } from '../ui/spdLabel';
import { Container, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Game, Scene2D, Input, WindowStack } from 'mwg';
import { t } from '../i18n/index';
import { titleIcon, type TitleIconName } from '../ui/titleIcons';
import { TitleBackground } from '../ui/titleBackground';
import { TitleFlame } from '../ui/titleFlame';
import { runState, APP_VERSION } from '../runState';
import { ClassSelectScene } from './classSelectScene';
import {
	showBadgesWindow,
	showInfoWindow,
	showRankingsWindow,
	showSettingsWindow,
} from '../ui/portWindows';

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
		//the windows themselves live in `ui/portWindows.ts`, so the in-game menu can open the same
		//ones (Java shares `WndSettings`/`WndChallenges`/`WndRankings` between scenes the same way)
		const info = (title: string, body: string) => showInfoWindow(this.windows, title, body);
		makeButton(t('scenes.titlescene.enter'), () => this.begin(), 'enter');
		makeButton(t('scenes.titlescene.support'), () => info(t('port.window.support.title'), t('port.window.support.body')), 'gold');
		makeButton(t('scenes.titlescene.rankings'), () => showRankingsWindow(this.windows), 'rankings');
		makeButton(t('scenes.titlescene.news'), () => info(t('port.window.news.title'), t('port.window.news.body')), 'news');
		//a language change rebuilds the interface, and this scene is where it is rebuilt from
		makeButton(t('scenes.titlescene.settings'), () => showSettingsWindow(this.windows, () => Game.current.switchScene(TitleScene)), 'prefs');
		//SPD's titlescene.badges key was removed by v3.3.8, so the button reads the port
		//catalog instead (SPD's own v2.1.4 translations, all 19 locales) - see PORT_COVERAGE.md.
		makeButton(t('port.ui.titlebadges'), () => showBadgesWindow(this.windows), 'badges');
		makeButton(
			t('scenes.titlescene.changes'),
			() => info(t('port.window.changes.title'), t('port.window.changes.body', { version: APP_VERSION })),
			'changes'
		);
		makeButton(t('scenes.titlescene.about'), () => info(t('port.window.about.title'), t('port.window.about.body', { version: APP_VERSION })), 'shpx');
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
			//The windows are asked first (MWG 0.8.0's public `WindowStack.handleAction`, item 325),
			//so an open window consumes its keys before the scene ever sees them - this handler
			//can no longer starve a window by returning `true` early, whatever it returns.
			//`Input.onAction` is a stack-mode `Signal`, so listeners added later are offered the
			//action *first* (`Signal`'s constructor doc: "new listeners are added at the front ...
			//so the most recently opened window is offered the event first") - this scene listener
			//runs before `WindowStack`'s own, which is why the chain goes through the stack
			//explicitly rather than relying on registration order. 'confirm' has no window-side
			//handler, so it is guarded here instead, or Enter would begin a run out from under
			//an open Support/Rankings/Badges/etc. window rather than dismissing it.
			if (!this.windows.handleAction(action) && action === 'confirm' && this.windows.isEmpty) this.begin();
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
