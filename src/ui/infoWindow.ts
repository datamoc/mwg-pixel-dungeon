import { Container, Graphics, Rectangle } from 'pixi.js';
import { SpdLabel as Label } from './spdLabel';
import { spdPanel } from './spdPanel';
import { SpdButton } from './spdButton';
import { t } from '../i18n';

/** WndHero/WndInfo-style modal with a native-pixel chrome border and stat rows. */
export class InfoWindow extends Container {
	private dim = new Graphics();
	private panel = new Container();
	private panelHeight = 100;
	constructor() { super(); this.visible = false; this.addChild(this.dim, this.panel); this.dim.eventMode = 'static'; this.dim.on('pointerdown', () => { this.visible = false; }); }
	show(title: string, rows: [string, string][], width: number, height: number): void {
		this.panel.removeChildren().forEach(c => c.destroy({ children: true }));
		this.panelHeight = 44 + rows.length * 13;
		this.panel.eventMode = 'static';
		this.panel.hitArea = new Rectangle(0, 0, 166, this.panelHeight);
		this.panel.addChild(spdPanel(166, this.panelHeight));
		const heading = new Label({ text: title, size: 9, color: 0xffff44, wrapWidth: 150 }); heading.position.set(8, 7); this.panel.addChild(heading);
		rows.forEach(([key, value], i) => {
			const label = new Label({ text: key, size: 7 }); label.position.set(8, 25 + i * 13);
			const amount = new Label({ text: value, size: 7, color: 0xffff44 }); amount.anchor.set(1, 0); amount.position.set(158, label.y);
			this.panel.addChild(label, amount);
		});
		const close = new SpdButton({ width: 150, height: 16, text: t('port.window.close'), onClick: () => { this.visible = false; } });
		close.position.set(8, this.panelHeight - 21); this.panel.addChild(close);
		this.visible = true; this.layout(width, height);
	}
	layout(width: number, height: number): void {
		const zoom = Math.max(1, Math.min(3, Math.floor(Math.min((width - 16) / 166, (height - 16) / this.panelHeight))));
		this.dim.clear().rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.5 });
		this.panel.scale.set(zoom); this.panel.position.set(Math.floor((width - 166 * zoom) / 2), Math.floor((height - this.panelHeight * zoom) / 2));
	}
}
