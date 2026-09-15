import { Button, Game, Label, theme } from 'mwg';
import { Container2D, Shape2D } from 'mwg/two-d/render';
import { t } from '../i18n';
import { TitleScene } from '../scenes/titleScene';

export interface EndPanelContext {
	panel: Container2D;
	level: number;
	depth: number;
	position: () => void;
}

function preparePanel(panel: Container2D): number {
	panel.removeChildren().forEach((child) => child.destroy());
	panel.visible = true;
	panel.alpha = 1;
	return Math.min(380, Math.max(260, Game.current.width - 28));
}

/** Builds the Amulet victory panel. DungeonScene supplies only its panel and current values. */
export function showVictoryPanel({ panel, level, depth, position }: EndPanelContext): void {
	const width = preparePanel(panel);
	panel.addChild(new Shape2D().roundRect(0, 0, width, 150, 10)
		.fill({ color: 0x0c1018, alpha: 0.98 }).stroke({ width: 3, color: 0xe0bd61 }));
	const title = new Label({ text: t('port.ui.victorytitle'), size: 22, bold: true, align: 'center', color: 0xf3d477 });
	title.anchor.set(0.5, 0); title.position.set(width / 2, 16); panel.addChild(title);
	const summary = new Label({ text: t('port.ui.victorysummary', { level, depth }), size: 11, align: 'center', wrapWidth: width - 24, color: theme().color.text });
	summary.anchor.set(0.5, 0); summary.position.set(width / 2, 55); panel.addChild(summary);
	const restart = new Button({ width: width - 40, height: 34, text: t('port.ui.newrun'), onClick: () => Game.current.switchScene(TitleScene) });
	restart.position.set(20, 102); restart.eventMode = 'static'; restart.cursor = 'pointer'; panel.addChild(restart);
	position();
}

/** Builds the defeat panel using the same restart/layout contract as the victory screen. */
export function showDefeatPanel({ panel, depth, position }: EndPanelContext): void {
	const width = preparePanel(panel);
	panel.addChild(new Shape2D().roundRect(0, 0, width, 150, 10)
		.fill({ color: 0x160d12, alpha: 0.98 }).stroke({ width: 3, color: 0xb95858 }));
	const title = new Label({ text: t('port.ui.defeattitle'), size: 22, bold: true, align: 'center', color: 0xe58c8c });
	title.anchor.set(0.5, 0); title.position.set(width / 2, 16); panel.addChild(title);
	const summary = new Label({ text: t('port.ui.defeatsummary', { depth }), size: 11, align: 'center', wrapWidth: width - 24, color: theme().color.text });
	summary.anchor.set(0.5, 0); summary.position.set(width / 2, 55); panel.addChild(summary);
	const restart = new Button({ width: width - 40, height: 34, text: t('port.ui.newrun'), onClick: () => Game.current.switchScene(TitleScene) });
	restart.position.set(20, 102); restart.eventMode = 'static'; restart.cursor = 'pointer'; panel.addChild(restart);
	position();
}
