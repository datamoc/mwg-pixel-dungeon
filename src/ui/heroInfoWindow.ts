import { Container } from 'mwg/two-d/pixi-interop';
import { Label, Window } from 'mwg';
import { Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';
import { t, capitalize } from '../i18n/index';
import { runState } from '../runState';
import { CLASS_TALENTS } from '../talents';
import { talentDescKey, talentTitleKey } from '../talents';
import { CLASSES, type ClassId } from '../classes';
import { markedText } from './markedText';
import { SpdButton } from './spdButton';
import { SPD_TITLE_COLOR } from './spdTheme';
import { createTalentInfoWindow, talentIconSprite, talentTierPane } from './talentPane';

/**
 * `windows/WndHeroInfo.java` (tag `v3.3.8`), opened by the info button beside the class name on the hero-select
 * screen: 120 wide, a title, and one tab per section. The Hero info tab is the class title and the class `desc()`
 * split on blank lines - one paragraph per starting-kit feature, each beside its item icon in a 20px column; the
 * Talents tab is the `talents_msg` line and the tier 1 and tier 2 talent tiles (`TalentButton.Mode.INFO`: a tap opens
 * the info window with no upgrade button).
 *
 * Simplified (`PORT_COVERAGE.md`): the Subclasses and Armor abilities tabs (`SubclassInfoTab`,
 * `ArmorAbilityInfoTab`, shown once the second/fourth boss badges are unlocked) are not ported; the tabs are two
 * text buttons rather than `IconTab`s; the icons are the port's own item-sheet frames (older layout than v3.3.8's,
 * so a few kit items - staff, rapier, dagger, hammer, spike, cudgel, gloves - use the closest existing frame) and
 * the three non-item glyphs (stairs, grass, talent) are omitted.
 */
const WIDTH = 120;
const MIN_HEIGHT = 125;
const MARGIN = 2;

/** One item-sheet frame per `desc()` paragraph, in Java's order (`HeroInfoTab`); `undefined` where Java draws a UI glyph. */
const KIT_FRAMES: Record<ClassId, readonly (number | undefined)[]> = {
	warrior: [50, 96, 304],
	mage: [208, 208, 304],
	rogue: [240, undefined, 96, 304],
	huntress: [144, undefined, 96, 304],
	duelist: [96, 96, 96, 304],
	cleric: [26, undefined, 96, 304],
};

function itemIcon(frame: number): Sprite {
	return new Sprite(new Texture({ source: runState.sprites.items.source, frame: new Rectangle((frame % 16) * 16, Math.floor(frame / 16) * 16, 16, 16) }));
}

function heroInfoTab(id: ClassId): Container {
	const tab = new Container();
	const title = new Label({ text: capitalize(t(CLASSES[id].nameKey)), size: 9, color: SPD_TITLE_COLOR, resolution: 6, roundPixels: true });
	title.position.set(Math.round((WIDTH - title.width) / 2), MARGIN);
	tab.addChild(title);
	let pos = Math.round(title.y + title.height) + 4 * MARGIN;
	const paragraphs = t(`actors.hero.heroclass.${id}_desc`).split('\n\n');
	paragraphs.forEach((paragraph, index) => {
		const text = markedText(paragraph, { size: 6, maxWidth: WIDTH - 20 });
		text.position.set(20, pos);
		tab.addChild(text);
		const frame = KIT_FRAMES[id][index];
		if (frame !== undefined) {
			const icon = itemIcon(frame);
			icon.position.set(Math.round((20 - 16) / 2), Math.round(pos + (text.height - 16) / 2));
			tab.addChild(icon);
		}
		pos += Math.ceil(text.height) + 4 * MARGIN;
	});
	return tab;
}

function talentInfoTab(id: ClassId, open: (window: Window) => void): Container {
	const tab = new Container();
	const title = new Label({ text: capitalize(t('windows.wndheroinfo.talents')), size: 9, color: SPD_TITLE_COLOR, resolution: 6, roundPixels: true });
	title.position.set(Math.round((WIDTH - title.width) / 2), MARGIN);
	tab.addChild(title);
	const message = markedText(t('windows.wndheroinfo.talents_msg'), { size: 6, maxWidth: WIDTH });
	message.position.set(0, Math.round(title.y + title.height) + 4 * MARGIN);
	tab.addChild(message);
	let top = Math.round(message.y + message.height) + 3 * MARGIN;
	//`talents.get(2).clear()`: tier 3 is shown with the subclasses, so only tiers 1 and 2 appear here.
	[1, 2].forEach((tier) => {
		const defs = CLASS_TALENTS[id]?.[tier - 1] ?? [];
		if (defs.length === 0) return;
		const { pane, height } = talentTierPane({
			tier, width: WIDTH, open: 0, spent: 0,
			tiles: defs.map((def) => ({ id: def.id, title: t(talentTitleKey(def.id)), rank: 0, max: def.maxRank })),
			onSelect: (talent) => open(createTalentInfoWindow({ id: talent, title: capitalize(t(talentTitleKey(talent))), rank: 0, description: t(talentDescKey(talent)) })),
		});
		pane.position.set(0, top);
		tab.addChild(pane);
		top += height + 2 * MARGIN;
	});
	return tab;
}

export function createHeroInfoWindow(id: ClassId, open: (window: Window) => void): Window {
	const tabs = [heroInfoTab(id), talentInfoTab(id, open)];
	const bodyHeight = Math.max(MIN_HEIGHT, ...tabs.map((tab) => Math.ceil(tab.height)));
	const window = new Window({ width: WIDTH + 12, height: bodyHeight + 30, title: '', anchor: 'center', blocker: true });
	const tabBar = new Container();
	//`IconTab`s: the class's first kit item (the seal, staff, cloak, ...) and the talent glyph (its first tier-1 talent icon here).
	const firstTalent = CLASS_TALENTS[id]?.[0]?.[0]?.id;
	const tabIcons = [itemIcon(KIT_FRAMES[id][0] ?? 96), (firstTalent ? talentIconSprite(firstTalent) : null) ?? itemIcon(96)];
	const buttons = tabIcons.map((icon, index) => {
		const button = new SpdButton({ width: WIDTH / 2 - 1, height: 20, icon, onClick: () => select(index) });
		button.position.set(index * (WIDTH / 2 + 1), 0);
		button.eventMode = 'static';
		button.cursor = 'pointer';
		tabBar.addChild(button);
		return button;
	});
	const body = new Container();
	body.position.set(0, 24);
	const select = (index: number): void => {
		body.removeChildren();
		body.addChild(tabs[index]!);
		buttons.forEach((button, i) => { button.alpha = i === index ? 1 : 0.6; });
	};
	window.content.addChild(tabBar, body);
	select(0);
	//`Window`'s height is outer: grow the frame by its own inset around the content, like the item picker does.
	window.resize(WIDTH + 12, 2 * (bodyHeight + 28) - window.contentHeight);
	return window;
}
