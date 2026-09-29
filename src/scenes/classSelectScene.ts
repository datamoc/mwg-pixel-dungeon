import { SpdLabel as Label } from '../ui/spdLabel';
import { Container, FillGradient, Graphics, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Game, Scene2D, theme, Input, WindowStack } from 'mwg';
import { markedText } from '../ui/markedText';
import { createHeroInfoWindow } from '../ui/heroInfoWindow';
import { t, capitalize } from '../i18n/index';
import type { SpdSprites } from '../images';
import { runState } from '../runState';
import { CLASSES, CLASS_UNLOCK_HINT, type ClassId } from '../classes';
import { loadBadges, classUnlocked } from '../badges';
import { SpdButton as Button, menuScale } from '../ui/spdButton';
import { titleIcon } from '../ui/titleIcons';
import { showChallengesWindow, showInfoWindow } from '../ui/portWindows';
import { beginChallengeRun, endChallengeRun, setupChallenges } from '../challenges';
import { TitleScene } from './titleScene';
import { DungeonScene } from './dungeonScene';

// -------------------------------------------------------------- class select

/** `HeroClass.splashArt()`: one full-screen background image per class */
export const CLASS_SPLASH: Record<ClassId, keyof SpdSprites> = {
	warrior: 'splashWarrior',
	mage: 'splashMage',
	rogue: 'splashRogue',
	huntress: 'splashHuntress',
	duelist: 'splashDuelist',
	cleric: 'splashCleric',
};

export class ClassSelectScene extends Scene2D {
	private badges = loadBadges();
	private selected: ClassId | null = null;
	private readonly windows = new WindowStack();
	private refreshChal: () => void = () => {};
	private layout: () => void = () => {};

	override create(): void {
		endChallengeRun(); //back on the setup screen: the selection is editable again
		// HeroSelectScene.java: compact hero buttons, splash art, then explicit Start.
		const root = new Container();
		this.stage.addChild(root);
		//The class splash JPGs are 800x450 painted art, so use linear sampling when they
		//are scaled to the viewport; the pixel-art atlases keep the framework's nearest mode.
		for (const key of Object.values(CLASS_SPLASH)) runState.sprites[key].source.scaleMode = 'linear';
		const background = new Sprite(runState.sprites[CLASS_SPLASH.warrior]);
		background.tint = 0x2d2f31;
		const shade = new Graphics();
		root.addChild(background, shade);
		const heading = new Label({ text: t('scenes.heroselectscene.title'), size: 12, color: theme().color.textHighlight });
		heading.anchor.set(0.5, 0);
		const name = new Label({ size: 9, color: theme().color.textHighlight });
		name.anchor.set(0.5, 0);
		//`HeroSelectScene.heroDesc`: `cl.shortDesc()` with SPD's `_highlight_` markup, centred under the name.
		const description = new Container();
		const setDescription = (markup: string): void => {
			description.removeChildren().forEach((child) => child.destroy({ children: true }));
			description.addChild(markedText(markup, { size: 6, maxWidth: 100, align: 'center' }));
		};
		//`infoButton`: `Icons.INFO`, right of the class name, opens `WndHeroInfo` for the selected class.
		const info = new Container();
		info.addChild(titleIcon(runState.sprites.uiIcons, 'info', 1));
		info.eventMode = 'static';
		info.cursor = 'pointer';
		info.hitArea = new Rectangle(-3, -3, 20, 21);
		info.visible = false;
		info.on('pointertap', () => { if (this.selected) this.windows.push(createHeroInfoWindow(this.selected, (window) => this.windows.push(window))); });
		root.addChild(heading, name, description, info);
		const start = new Button({ width: 80, height: 21, text: capitalize(t('scenes.heroselectscene.start')),
			icon: titleIcon(runState.sprites.uiIcons, 'enter', 1), onClick: () => {
				if (!this.selected) return;
				runState.pendingClass = this.selected;
				//`HeroSelectScene.java:237` + `Dungeon.init` (`Dungeon.java:236`): the setup mask is dropped until the
				//`VICTORY` badge exists, then snapshotted into the run.
				beginChallengeRun(this.badges.unlocked('victory'));
				Game.current.switchScene(DungeonScene);
			} });
		start.visible = false;
		root.addChild(start);
		const ids = Object.keys(CLASSES) as ClassId[];
		const portraits: Sprite[] = [];
		const buttons = ids.map((id) => {
			// HeroBtn uses the unclothed preview at (0,90), not the in-game idle frame.
			const portrait = new Sprite(new Texture({ source: runState.sprites[id].source,
				frame: new Rectangle(0, 90, 12, 15) }));
			portrait.tint = classUnlocked(id, this.badges) ? 0x999999 : 0x191919;
			portraits.push(portrait);
			const button = new Button({ width: 35, height: 30, icon: portrait, onClick: () => {
				if (!classUnlocked(id, this.badges)) {
					name.setText(capitalize(t(CLASSES[id].nameKey)));
					const hintKey = CLASS_UNLOCK_HINT[id];
					setDescription(t('port.ui.locked', { hint: hintKey ? t(hintKey) : '' }));
					info.visible = false;
				} else {
					this.selected = id;
					background.texture = runState.sprites[CLASS_SPLASH[id]];
					background.tint = 0xffffff;
					name.setText(capitalize(t(CLASSES[id].nameKey)));
					setDescription(t(`actors.hero.heroclass.${id}_desc_short`));
					info.visible = true;
					start.visible = true;
					portraits.forEach((p, i) => { p.tint = ids[i] === id ? 0xffffff : classUnlocked(ids[i], this.badges) ? 0x999999 : 0x191919; });
				}
				this.layout();
			} });
			root.addChild(button);
			return button;
		});
		const back = new Button({ width: 20, height: 20, icon: titleIcon(runState.sprites.uiIcons, 'exit', 1), onClick: () => Game.current.switchScene(TitleScene) });
		root.addChild(back);
		//`HeroSelectScene.java:798-924`: the challenges button. Without the `VICTORY` badge it only explains
		//`challenges_nowin`; with it, it opens the editable `WndChallenges`. The count beside it is the number of
		//selected challenges (Java tints the icon instead).
		const chalCount = new Label({ size: 6, color: theme().color.textHighlight });
		let chalShown = '';
		const refreshChalIcon = (): void => { const n = this.badges.unlocked('victory') ? setupChallenges().size : 0; const text = n > 0 ? String(n) : ''; if (text !== chalShown) { chalShown = text; chalCount.setText(text); } };
		const chal = new Button({ width: 20, height: 20, icon: titleIcon(runState.sprites.uiIcons, 'challenge', 1), onClick: () => {
			if (this.badges.unlocked('victory')) showChallengesWindow(this.windows, true);
			else showInfoWindow(this.windows, t('windows.wndchallenges.title'), t('scenes.heroselectscene.challenges_nowin'));
		} });
		root.addChild(chal, chalCount);
		this.stage.addChild(this.windows);
		this.refreshChal = refreshChalIcon;
		//Port-original keyboard-navigation accessibility work (ROADMAP.md section 8 - Java has
		//no such system), continuing `TitleScene`'s model to the class-select screen: a single
		//focused portrait, moved by the movement actions, drawn with the same visible ring.
		//`Confirm` mirrors a portrait click (select) the first time; pressed again on the
		//*already-selected* portrait it starts the run instead of re-selecting it, so a
		//keyboard player never needs to reach the separate on-screen Start button.
		let focusedIndex = 0;
		//The ring is this port's keyboard aid (Java has none), so it stays hidden until a key moves it.
		let ringShown = false;
		const buttonBounds: { x: number; y: number; w: number; h: number }[] = ids.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
		const focusRing = new Graphics();
		focusRing.eventMode = 'none';
		root.addChild(focusRing);
		const drawFocusRing = () => {
			const b = buttonBounds[focusedIndex]!;
			focusRing.clear();
			if (ringShown) focusRing.rect(b.x - 2, b.y - 2, b.w + 4, b.h + 4).stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
		};
		let focusCols = 3;
		const moveFocus = (dRow: number, dCol: number): void => {
			const row = Math.floor(focusedIndex / focusCols), col = focusedIndex % focusCols;
			const rowCount = Math.ceil(ids.length / focusCols);
			const nextRow = Math.max(0, Math.min(rowCount - 1, row + dRow));
			const nextCol = Math.max(0, Math.min(focusCols - 1, col + dCol));
			const next = nextRow * focusCols + nextCol;
			focusedIndex = next < ids.length ? next : ids.length - 1;
			drawFocusRing();
		};
		const onAction = (action: string) => {
			if (!this.windows.isEmpty) { this.windows.handleAction(action); return; }
			if (['up', 'down', 'left', 'right', 'confirm'].includes(action)) { ringShown = true; drawFocusRing(); }
			if (action === 'cancel') Game.current.switchScene(TitleScene);
			if (action === 'up') moveFocus(-1, 0);
			if (action === 'down') moveFocus(1, 0);
			if (action === 'left') moveFocus(0, -1);
			if (action === 'right') moveFocus(0, 1);
			if (action === 'confirm') {
				const focusedId = ids[focusedIndex]!;
				if (this.selected === focusedId && start.visible) start.onClick.dispatch();
				else buttons[focusedIndex]!.onClick.dispatch();
			}
		};
		Input.onAction.add(onAction);
		this.onDestroy.add(() => Input.onAction.remove(onAction));
		this.layout = () => {
			const scale = menuScale(Game.current.width, Game.current.height);
			root.scale.set(scale);
			const w = Game.current.width / scale, h = Game.current.height / scale;
			const landscape = w > h;
			const leftArea = Math.max(112, w / 3);
			background.scale.set(h / background.texture.height);
			background.position.set((w - background.width) / 2 + (landscape ? leftArea / 6 : 0), 0);
			background.visible = landscape || this.selected !== null;
			shade.clear();
			if (landscape) shade.rect(0, 0, leftArea + 35, h).fill(new FillGradient({
				type: 'linear', start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, textureSpace: 'local',
				colorStops: [{ offset: 0, color: '#000000' }, { offset: 0.65, color: 'rgba(0,0,0,0.85)' }, { offset: 1, color: 'rgba(0,0,0,0)' }],
			}));
			if (landscape) {
				const uiHeight = Math.min(h - 20, 300);
				let spacing = (uiHeight - 120) / 2;
				if (uiHeight >= 160) spacing -= 5;
				if (uiHeight >= 180) spacing -= 6;
				heading.position.set(leftArea / 2, (h - uiHeight) / 2);
				const bh = uiHeight >= 180 ? 30 : 24;
				focusCols = 3;
				buttons.forEach((b, i) => {
					b.resize(35, bh);
					b.position.set(Math.round((leftArea - 107) / 2 + (i % 3) * 36), Math.round(heading.y + heading.height + spacing + Math.floor(i / 3) * (bh + 1)));
					buttonBounds[i] = { x: b.x, y: b.y, w: 35, h: bh };
				});
				//`heroName.setPos(insets.left + (leftPortion - heroName.width() - 20) / 2, ..)`: the name and its 20px info button centre together.
				name.anchor.set(0, 0);
				name.position.set(Math.round((leftArea - name.width - 20) / 2), buttons[5].y + bh + 5);
				info.position.set(Math.round(name.x + name.width + 3), Math.round(name.y + (name.height - 14) / 2));
				description.position.set(Math.round(leftArea / 2 - 50), name.y + name.height + 5);
				start.position.set(Math.round((leftArea - 80) / 2), heading.y + uiHeight - 21);
			} else {
				const bw = Math.min(35, w / ids.length);
				focusCols = ids.length;
				buttons.forEach((b, i) => {
					b.resize(bw, 24);
					b.position.set((w - bw * ids.length) / 2 + i * bw, h - 24);
					buttonBounds[i] = { x: b.x, y: b.y, w: bw, h: 24 };
				});
				heading.position.set(w / 2, h - 24 - heading.height - 4);
				name.anchor.set(0, 0);
				name.position.set(Math.round((w - name.width - 20) / 2), h - 115);
				info.position.set(Math.round(name.x + name.width + 3), Math.round(name.y + (name.height - 14) / 2));
				description.position.set(Math.round(w / 2 - 50), h - 100);
				start.position.set((w - 80) / 2, h - 65);
			}
			back.position.set(w - 20, 0);
			chal.position.set(w - 42, 0);
			chalCount.position.set(w - 42, 20);
			this.windows.scale.set(scale);
			this.windows.setViewport(w, h);
			refreshChalIcon();
			drawFocusRing();
		};
		// HeroSelectScene.create restores GamesInProgress.selectedClass when one exists.
		// The port keeps that selection in runState.pendingClass between visits.
		const initialClass = classUnlocked(runState.pendingClass, this.badges)
			? runState.pendingClass
			: ids.find((id) => classUnlocked(id, this.badges));
		if (initialClass) buttons[ids.indexOf(initialClass)]!.onClick.dispatch();
		this.layout();
	}

	override update(dt: number): void { this.windows.update(dt); this.refreshChal(); runState.audio.update(dt); }
	override resize(_w: number, _h: number): void { this.layout(); }
}
