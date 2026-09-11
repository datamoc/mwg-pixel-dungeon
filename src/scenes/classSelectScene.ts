import { SpdLabel as Label } from '../ui/spdLabel';
import { Container, FillGradient, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { Game, Scene2D, theme, Input } from 'mwg';
import { t, capitalize } from '../i18n/index';
import type { SpdSprites } from '../images';
import { runState } from '../runState';
import { CLASSES, CLASS_UNLOCK_HINT, type ClassId } from '../classes';
import { loadBadges, classUnlocked } from '../badges';
import { SpdButton as Button, menuScale } from '../ui/spdButton';
import { titleIcon } from '../ui/titleIcons';
import { TitleScene } from './titleScene';
import { SewersScene } from '../main';

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
	private layout: () => void = () => {};

	override create(): void {
		// HeroSelectScene.java: compact hero buttons, splash art, then explicit Start.
		const root = new Container();
		this.stage.addChild(root);
		const background = new Sprite(runState.sprites[CLASS_SPLASH.warrior]);
		background.tint = 0x2d2f31;
		const shade = new Graphics();
		root.addChild(background, shade);
		const heading = new Label({ text: t('scenes.heroselectscene.title'), size: 12, color: theme().color.textHighlight });
		heading.anchor.set(0.5, 0);
		const name = new Label({ size: 9, color: theme().color.textHighlight });
		name.anchor.set(0.5, 0);
		const description = new Label({ size: 6, align: 'center', wrapWidth: 100 });
		description.anchor.set(0.5, 0);
		root.addChild(heading, name, description);
		const start = new Button({ width: 80, height: 21, text: capitalize(t('scenes.heroselectscene.start')),
			icon: titleIcon(runState.sprites.uiIcons, 'enter', 1), onClick: () => {
				if (!this.selected) return;
				runState.pendingClass = this.selected;
				Game.current.switchScene(SewersScene);
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
					description.setText(t('port.ui.locked', { hint: hintKey ? t(hintKey) : '' }));
				} else {
					this.selected = id;
					background.texture = runState.sprites[CLASS_SPLASH[id]];
					background.tint = 0xffffff;
					name.setText(capitalize(t(CLASSES[id].nameKey)));
					// The port's short class summary substitutes for Java's full WndHeroInfo.
					description.setText(t(CLASSES[id].blurbKey));
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
		const onAction = (action: string) => {
			if (action === 'cancel') Game.current.switchScene(TitleScene);
			if (action === 'confirm' && this.selected) start.onClick.dispatch();
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
				buttons.forEach((b, i) => {
					b.resize(35, bh);
					b.position.set(Math.round((leftArea - 107) / 2 + (i % 3) * 36), Math.round(heading.y + heading.height + spacing + Math.floor(i / 3) * (bh + 1)));
				});
				name.position.set(leftArea / 2, buttons[5].y + bh + 5);
				description.position.set(leftArea / 2, name.y + name.height + 5);
				start.position.set(Math.round((leftArea - 80) / 2), heading.y + uiHeight - 21);
			} else {
				const bw = Math.min(35, w / ids.length);
				buttons.forEach((b, i) => { b.resize(bw, 24); b.position.set((w - bw * ids.length) / 2 + i * bw, h - 24); });
				heading.position.set(w / 2, h - 24 - heading.height - 4);
				name.position.set(w / 2, h - 115);
				description.position.set(w / 2, h - 100);
				start.position.set((w - 80) / 2, h - 65);
			}
			back.position.set(w - 20, 0);
		};
		this.layout();
	}

	override update(dt: number): void { runState.audio.update(dt); }
	override resize(_w: number, _h: number): void { this.layout(); }
}
