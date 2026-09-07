import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { Button, Label } from 'mwg';
import { runState } from '../runState';
import { t } from '../i18n';
import { SpdButton } from './spdButton';
import { titleIcon } from './titleIcons';

/** Toolbar.java GROUP layout and original toolbar.png frames.
 * Fixed item actions substitute for assignable quickslots; extra port verbs live
 * in the expandable menu. They all use the same game action handler as keyboard input.
 */
export class SpdToolbar extends Container {
	private readonly extras = new Container();
	private readonly hint = new Label({ size: 8 });
	private readonly row = new Container();
	private readonly rowWidth = 174;
	private zoom = 2;
	get occupiedHeight(): number { return (this.extras.visible ? 143 : 26) * this.zoom; }

	constructor(itemTextures: Texture[], onAction: (action: string) => void, onLayout: () => void) {
		super();
		this.extras.visible = false;
		this.hint.visible = false;
		this.hint.anchor.set(1, 1);
		this.hint.position.set(this.rowWidth, -3);
		this.addChild(this.row, this.extras, this.hint);
		const sheet = runState.sprites.uiToolbar;
		const crop = (x: number, y: number, w: number, h: number) => new Texture({ source: sheet.source, frame: new Rectangle(x, y, w, h) });
		let x = 0;
		const add = (action: string, key: string, frameX: number, width: number, height: number, icon: Sprite, click = () => onAction(action)) => {
			const button = new Button({ width, height, icon, onClick: click });
			button.children[0].visible = false;
			const base = new Sprite(crop(frameX, 0, width, height));
			button.addChildAt(base, 0);
			button.position.set(x, 26 - height);
			x += width;
			button.on('pointerover', () => { this.hint.setText(t(key)); this.hint.visible = !this.extras.visible; });
			button.on('pointerout', () => { this.hint.visible = false; base.tint = 0xffffff; });
			button.on('pointerdown', () => { base.tint = 0xaaaaaa; });
			button.on('pointerup', () => { base.tint = 0xffffff; });
			button.on('pointerupoutside', () => { base.tint = 0xffffff; });
			this.row.addChild(button);
		};
		add('more', 'scenes.titlescene.settings', 64, 22, 24, titleIcon(runState.sprites.uiIcons, 'prefs', 1), () => {
			this.extras.visible = !this.extras.visible;
			this.hint.visible = false;
			onLayout();
		});
		[['read', 'port.action.scroll'], ['quaff', 'port.action.potion'], ['eat', 'port.action.eat'], ['special', 'port.action.special']].forEach(([action, key], i) => {
			add(action, key, 64, 22, 24, new Sprite(itemTextures[i]));
		});
		add('inventory', 'port.action.bag', 0, 24, 26, new Sprite(crop(160, 0, 16, 16)));
		add('search', 'port.action.search', 44, 20, 26, new Sprite(crop(192, 0, 16, 16)));
		add('wait', 'port.action.wait', 24, 20, 26, new Sprite(crop(176, 0, 16, 16)));
		const extraActions = [['examine', 'port.action.examine'], ['upgrade', 'port.action.upgrade'], ['talents', 'port.action.talents'], ['journal', 'windows.wndkeybindings.journal'], ['save', 'port.action.save'], ['load', 'port.action.load']];
		extraActions.forEach(([action, key], i) => {
			const button = new SpdButton({ width: 100, height: 21, text: t(key), onClick: () => {
				this.extras.visible = false;
				onAction(action);
				onLayout();
			} });
			button.position.set(this.rowWidth - 100, -extraActions.length * 23 + i * 23);
			this.extras.addChild(button);
		});
	}

	layout(width: number, height: number): void {
		this.zoom = width >= 360 ? 2 : 1;
		this.scale.set(this.zoom);
		this.position.set(Math.floor(width - this.rowWidth * this.zoom), height - 26 * this.zoom);
	}
}
