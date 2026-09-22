import { Container, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { Label } from 'mwg';
import { APP_VERSION, runState } from '../runState';
import { SpdButton } from './spdButton';
import { titleIcon } from './titleIcons';

export interface DungeonHudState {
	place: string;
	keys: { iron: number; golden: number; crystal: number };
}

/** The compact top-right HUD from `GameScene.java`: version, floor, keys and menu access. */
export class DungeonHud extends Container {
	private readonly version = new Label({ size: 7, color: 0xd0d0c0 });
	private readonly place = new Label({ size: 8, color: 0xffff44 });
	private readonly keys = new Container();
	private readonly keyTexture: Texture;
	private readonly menu: SpdButton;

	constructor(onMenu: () => void) {
		super();
		this.version.anchor.set(1, 0);
		this.version.position.set(96, 0);
		this.addChild(this.version);
		this.place.position.set(4, 13);
		this.addChild(this.place);
		this.keyTexture = runState.sprites.items;
		this.addChild(this.keys);
		this.menu = new SpdButton({ width: 22, height: 22, icon: titleIcon(runState.sprites.uiIcons, 'displayLand', 1), onClick: onMenu });
		this.menu.position.set(74, 18);
		this.addChild(this.menu);
	}

	update(state: DungeonHudState): void {
		this.version.setText(`v${APP_VERSION}`);
		this.place.setText(state.place);
		this.keys.removeChildren().forEach((child) => child.destroy({ children: true }));
		const entries: [number, number][] = [[57, state.keys.iron], [56, state.keys.golden], [55, state.keys.crystal]];
		let x = 4;
		for (const [frame, count] of entries) {
			if (count <= 0) continue;
			const icon = new Sprite(new Texture({ source: this.keyTexture.source, frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) }));
			icon.scale.set(1.25);
			icon.position.set(x, 38);
			this.keys.addChild(icon);
			const label = new Label({ text: String(count), size: 7, color: 0xffff44 });
			label.position.set(x + 14, 41);
			this.keys.addChild(label);
			x += 27;
		}
	}

	layout(width: number): void {
		this.scale.set(width >= 360 ? 2 : 1);
		this.position.set(Math.floor(width - 106 * this.scale.x), 4);
	}
}
