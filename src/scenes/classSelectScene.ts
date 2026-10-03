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
import { showChallengesWindow, showConfirmWindow, showInfoWindow } from '../ui/portWindows';
import { beginChallengeRun, endChallengeRun, setupChallenges } from '../challenges';
import { customSeed, setCustomSeed, lastDaily, setLastDaily } from '../settings';
import { seedTextValue, formatSeedText, dailySeedDay, dailySeedValue, dailySeedLabel, DAY_MS } from '../genericDungeon';
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
	/** Per-frame hero-select UI work, installed by `create()` (chevron fade tween,
	 * idle auto-fade, daily countdown). */
	private uiTick: (dt: number) => void = () => {};

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
		//Decorative layers never capture taps, so empty-canvas taps always reach the
		//fade resetter below the UI (Java's non-interactive visuals likewise never
		//consume the reset tap).
		background.eventMode = 'none';
		const shade = new Graphics();
		shade.eventMode = 'none';
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
		const startRun = (): void => {
			if (!this.selected) return;
			runState.pendingClass = this.selected;
			//`HeroSelectScene.java:237` + `Dungeon.init` (`Dungeon.java:236`): the setup mask is dropped until the
			//`VICTORY` badge exists, then snapshotted into the run.
			beginChallengeRun(this.badges.unlocked('victory'));
			Game.current.switchScene(DungeonScene);
		};
		const start = new Button({ width: 80, height: 21, text: capitalize(t('scenes.heroselectscene.start')),
			icon: titleIcon(runState.sprites.uiIcons, 'enter', 1), onClick: () => { startRun(); } });
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

		// ---- R041: chevron UI hider, game-options pane, splash edge fades ----
		// (`HeroSelectScene.btnFade/updateFade/resetFade/GameOptions`, tag `v3.3.8`).

		//Fade state. `uiAlpha` doubles as Java does: 2..1 is the 4s idle grace,
		//1..0 the 4s fade. `applyFade` gates interaction off at 0 like Java's `enable`.
		let uiAlpha = 2;
		let uiFadeBusy = false;
		let uiFadeDir = 0;
		let isLandscape = true;
		const fadeVisuals: { alpha: number }[] = [];
		const fadeGated: { alpha: number; eventMode?: string | undefined }[] = [];
		const applyFade = (): void => {
			const a = Math.max(0, Math.min(1, uiAlpha));
			for (const node of fadeVisuals) node.alpha = a;
			for (const node of fadeGated) {
				node.alpha = a;
				node.eventMode = a > 0 ? 'static' : 'none';
			}
		};
		//`btnFade`: landscape-only chevron hiding the UI. The sheet carries no chevron
		//art, so the 13x10 bitmap below traces Java's own `icons.png` chevron pixel for
		//pixel (verified against tag `v3.3.8`); the holder rotates -90 degrees to match
		//Java's 270-degree icon angle.
		const chevronMap = [
			'......#......',
			'.....###.....',
			'....#####....',
			'...#######...',
			'..#########..',
			'.###########.',
			'#############',
			'######.######',
			'#####...#####',
			'.###.....###.',
		];
		const chevronArt = new Graphics();
		for (let cy = 0; cy < chevronMap.length; cy++) {
			const row = chevronMap[cy]!;
			for (let cx = 0; cx < row.length; cx++) if (row[cx] === '#') chevronArt.rect(cx, cy, 1, 1);
		}
		chevronArt.fill({ color: 0xffffff });
		const chevronHolder = new Container();
		chevronHolder.pivot.set(6.5, 5);
		chevronHolder.position.set(10, 10.5);
		chevronHolder.rotation = -Math.PI / 2;
		chevronHolder.addChild(chevronArt);
		const chevron = new Container();
		chevron.addChild(chevronHolder);
		chevron.eventMode = 'static';
		chevron.cursor = 'pointer';
		chevron.hitArea = new Rectangle(0, 0, 20, 21);
		chevron.visible = false;
		chevron.on('pointertap', () => {
			//btnFade.onClick: disable + 0.5s fade-out (Java Tweener, which starts at
			//full alpha - snap out of the idle grace first, invisibly, or the
			//completion clamp below would stop the tween on its first tick).
			if (uiFadeBusy) return;
			uiAlpha = 1;
			uiFadeBusy = true;
			uiFadeDir = -1;
		});
		fadeGated.push(chevron);
		root.addChild(chevron);
		//Full-screen tap catcher restoring faded UI (Java's fadeResetter PointerArea):
		//behind the UI so buttons win their taps, and only taps that actually land on
		//it reset (a tap consumed by a control above never reaches the area below).
		const fadeResetter = new Container();
		fadeResetter.eventMode = 'static';
		fadeResetter.on('pointerup', (e) => {
			if ((e.target as unknown) !== fadeResetter) return;
			if (uiAlpha === 0 && isLandscape) {
				uiFadeBusy = true;
				uiFadeDir = 1;
			} else {
				uiAlpha = 2;
			}
		});
		root.addChildAt(fadeResetter, 2);
		//Splash edge gradients flanking the art in landscape (Java's fadeLeft/fadeRight).
		//Fixed 32px strips stand in for Java's resolution-scaled edge math; the port's
		//background geometry (centered + leftArea/6 offset) differs from Java's
		//insets/Camera layout, so only the gradient direction, black endpoints and
		//visibility rules below are Java's.
		const paintEdgeFade = (g: Graphics, flip: boolean, h: number): void => {
			g.clear();
			g.rect(0, 0, 32, h).fill(new FillGradient({
				type: 'linear', start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, textureSpace: 'local',
				colorStops: flip
					? [{ offset: 0, color: 'rgba(0,0,0,0)' }, { offset: 1, color: '#000000' }]
					: [{ offset: 0, color: '#000000' }, { offset: 1, color: 'rgba(0,0,0,0)' }],
			}));
		};
		const fadeLeft = new Graphics();
		const fadeRight = new Graphics();
		fadeLeft.visible = false;
		fadeRight.visible = false;
		fadeLeft.eventMode = 'none';
		fadeRight.eventMode = 'none';
		description.eventMode = 'none';
		root.addChild(fadeLeft, fadeRight);
		//Game-options pane: custom-seed and daily rows (`HeroSelectScene.GameOptions`).
		//The challenges row lives on the port's own top-right chal button instead of
		//duplicating it here (stated); seed/daily need the VICTORY badge like Java.
		const optionsPane = new Container();
		const optionsBg = new Graphics();
		optionsPane.addChild(optionsBg);
		const seedIcon = titleIcon(runState.sprites.uiIcons, 'seed', 1);
		const seedRow = new Button({ width: 104, height: 20, text: t('scenes.heroselectscene.custom_seed'), icon: seedIcon, onClick: () => { openSeedOverlay(); } });
		const dailyIcon = titleIcon(runState.sprites.uiIcons, 'calendar', 1);
		const dailyRow = new Button({ width: 104, height: 20, text: t('scenes.heroselectscene.daily'), icon: dailyIcon, onClick: () => { onDailyRow(); } });
		optionsPane.addChild(seedRow, dailyRow);
		optionsPane.visible = false;
		fadeGated.push(seedRow, dailyRow);
		root.addChild(optionsPane);
		const optionsIcon = titleIcon(runState.sprites.uiIcons, 'prefs', 1);
		const optionsBtn = new Button({ width: 20, height: 20, icon: optionsIcon, onClick: () => {
			optionsPane.visible = !optionsPane.visible;
		} });
		fadeGated.push(optionsBtn);
		root.addChild(optionsBtn);
		const updateOptionsColor = (): void => {
			//`updateOptionsColor`: seed set tints green-yellow, challenges set tints
			//orange, else plain. Java hardlights above 1/channel; port tints cap at 1,
			//so these are the closest flat tints, not the HDR boosts.
			if (customSeed() !== '') {
				optionsIcon.tint = 0xaaffaa;
				seedIcon.tint = 0xaaffaa;
			} else if (setupChallenges().size > 0) {
				optionsIcon.tint = 0xffcc66;
				seedIcon.tint = 0xffffff;
			} else {
				optionsIcon.tint = 0xffffff;
				seedIcon.tint = 0xffffff;
			}
		};
		//Custom-seed text entry (`WndTextInput` in Java). The port has no text-field
		//window, so the input rides a minimal DOM overlay (standard HTML input handles
		//keystrokes, IME and mobile keyboards; the scene owns its lifecycle). Empty
		//input clears the seed; every non-empty text is a valid seed there (hash
		//fallback), matched here by `seedTextValue`. Duplicate-seed detection needs a
		//multi-run list this port has none of (stated gap, same as daily below).
		const closeSeedOverlay = (): void => { document.getElementById('spd-seed-overlay')?.remove(); };
		this.onDestroy.add(() => { closeSeedOverlay(); });
		const openSeedOverlay = (): void => {
			if (!this.badges.unlocked('victory')) {
				showInfoWindow(this.windows, t('scenes.heroselectscene.custom_seed'), t('scenes.heroselectscene.custom_seed_nowin'));
				return;
			}
			closeSeedOverlay();
			const overlay = document.createElement('div');
			overlay.id = 'spd-seed-overlay';
			overlay.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#0a0a0c;border:1px solid #888;padding:12px;z-index:50;color:#fff;font:12px sans-serif;text-align:center;';
			const title = document.createElement('div');
			title.textContent = t('scenes.heroselectscene.custom_seed_title');
			const desc = document.createElement('div');
			desc.textContent = t('scenes.heroselectscene.custom_seed_desc');
			desc.style.cssText = 'margin:6px 0;font-size:11px;max-width:240px;';
			const input = document.createElement('input');
			input.id = 'spd-seed-input';
			input.maxLength = 20;
			input.value = customSeed();
			input.style.cssText = 'width:180px;margin-bottom:8px;';
			const row = document.createElement('div');
			const setBtn = document.createElement('button');
			setBtn.id = 'spd-seed-set';
			setBtn.textContent = t('scenes.heroselectscene.custom_seed_set');
			const clearBtn = document.createElement('button');
			clearBtn.id = 'spd-seed-clear';
			clearBtn.textContent = t('scenes.heroselectscene.custom_seed_clear');
			setBtn.onclick = () => {
				const formatted = formatSeedText(input.value);
				setCustomSeed(seedTextValue(formatted) === null ? '' : formatted);
				updateOptionsColor();
				closeSeedOverlay();
			};
			clearBtn.onclick = () => {
				setCustomSeed('');
				updateOptionsColor();
				closeSeedOverlay();
			};
			row.append(setBtn, clearBtn);
			overlay.append(title, desc, input, row);
			document.body.appendChild(overlay);
			input.focus();
		};
		//Daily runs (`HeroSelectScene` daily button). Date-floored UTC day, never before
		//the 2025-03-01 epoch; replaying reuses the stored day. Existing-daily-run
		//detection needs the multi-run list (stated gap with the seed duplicate check).
		const onDailyRow = (): void => {
			if (!this.badges.unlocked('victory')) {
				showInfoWindow(this.windows, t('scenes.heroselectscene.daily'), t('scenes.heroselectscene.daily_nowin'));
				return;
			}
			if (!this.selected) return;
			const diff = (lastDaily() + DAY_MS) - Date.now();
			if (diff > 24 * 3600000) {
				showInfoWindow(this.windows, t('scenes.heroselectscene.daily'),
					t('scenes.heroselectscene.daily_unavailable_long', { 0: Math.floor(diff / DAY_MS) + 1 }));
				return;
			}
			showConfirmWindow(this.windows,
				t('scenes.heroselectscene.daily'),
				t(diff > 0 ? 'scenes.heroselectscene.daily_repeat' : 'scenes.heroselectscene.daily_desc'),
				t('scenes.heroselectscene.daily_yes'), t('scenes.heroselectscene.daily_no'), () => {
					if (diff <= 0) setLastDaily(Math.floor(Date.now() / DAY_MS) * DAY_MS);
					runState.pendingDaily = true;
					startRun();
				});
		};
		//Daily countdown text on the row (`HeroSelectScene` daily button update).
		let lastDailySecond = -1;
		const refreshDailyRow = (): void => {
			const diff = (lastDaily() + DAY_MS) - Date.now();
			dailyRow.setText(diff > 0
				? (diff > 30 * 3600000 ? '30:00:00+' : new Date(diff).toISOString().slice(11, 19))
				: t('scenes.heroselectscene.daily'));
		};
		this.uiTick = (dt: number): void => {
			if (!this.windows.isEmpty) {
				uiAlpha = 2;
			} else if (uiFadeBusy) {
				uiAlpha += uiFadeDir * dt / 0.5;
				if (uiAlpha <= 0) { uiAlpha = 0; uiFadeBusy = false; }
				if (uiAlpha >= 1) { uiAlpha = 1; uiFadeBusy = false; }
				applyFade();
			} else if (!isLandscape && this.selected !== null && uiAlpha > 0) {
				//Portrait idle auto-fade (Java's update branch); the chevron path above
				//covers landscape, where a tap restores instead.
				uiAlpha = Math.max(0, uiAlpha - dt / 4);
				applyFade();
			}
			const second = Math.floor(Date.now() / 1000);
			if (second !== lastDailySecond) {
				lastDailySecond = second;
				if (optionsPane.visible) refreshDailyRow();
			}
		};
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
		fadeVisuals.push(heading, ...buttons, name, description, info, start, back, chal, chalCount, focusRing);
		fadeGated.push(...buttons, info, back, chal, start);
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
			isLandscape = landscape;
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
			//R041 layout: chevron left of Start (landscape only), options button right
			//of Start (landscape) or left of it (portrait), pane above the button row.
			chevron.position.set(start.x - 20, start.y);
			chevron.visible = landscape && this.selected !== null;
			optionsBtn.position.set(landscape ? start.x + 80 : start.x - 20, start.y);
			optionsBtn.visible = this.selected !== null;
			const paneW = 112, paneH = 50;
			optionsBg.clear();
			optionsBg.rect(0, 0, paneW, paneH).fill({ color: 0x0a0a0c, alpha: 0.92 });
			seedRow.position.set(4, 4);
			dailyRow.position.set(4, 26);
			if (landscape) optionsPane.position.set(optionsBtn.x + 20, optionsBtn.y - paneH - 2);
			else optionsPane.position.set(buttons[0].x, start.y - paneH - 2);
			fadeResetter.hitArea = new Rectangle(0, 0, w, h);
			//Splash edge fades (Java visibility rules; landscape only).
			if (landscape) {
				paintEdgeFade(fadeLeft, false, h);
				paintEdgeFade(fadeRight, true, h);
				fadeLeft.position.set(background.x - 28, 0);
				fadeRight.position.set(background.x + background.width - 4, 0);
				fadeLeft.visible = background.x > 0 || (uiAlpha > 0 && isLandscape);
				fadeRight.visible = background.x + background.width < w;
			} else {
				fadeLeft.visible = false;
				fadeRight.visible = false;
			}
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
		updateOptionsColor();
		this.layout();
	}

	override update(dt: number): void { this.windows.update(dt); this.refreshChal(); runState.audio.update(dt); this.uiTick(dt); }
	override resize(_w: number, _h: number): void { this.layout(); }
}
