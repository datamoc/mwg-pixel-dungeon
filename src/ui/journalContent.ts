import { POTION_CLASS_BY_PORT_ID } from '../items/transmutation';
import { RING_DEFS } from '../items/ringModifiers';
import { MWL_CONSUMABLE_CLASS_ALIASES } from '../mwlContent';
import { t, REGION_KEYS } from '../i18n/index';
import type { JournalPage, JournalTab } from './journalWindow';

export interface JournalContentContext {
	readonly items: readonly { id: string; identified?: boolean }[];
	readonly questStatus: (id: 'sadGhost' | 'wandmaker' | 'blacksmith' | 'imp') => string;
	/** the active stage's objective key (`Rpg.QuestStage.description`, authored in
	 * `questDefinitions` - real data that was authored but never displayed anywhere before this),
	 * or `undefined` outside an active stage that names one. */
	readonly questObjective: (id: 'sadGhost' | 'wandmaker' | 'blacksmith' | 'imp') => string | undefined;
	readonly itemDisplayName: (id: string, identified: boolean) => string;
}

/** Builds journal data; window creation and scene lifetime remain in the UI adapter. */
export function createJournalTabs(context: JournalContentContext): JournalTab[] {
	const regionPages: JournalPage[] = (['sewers', 'prison', 'caves', 'city', 'halls'] as const).map(region => ({
		title: t(REGION_KEYS[region]), body: t(`journal.document.intros.${region}.body`),
	}));
	const guideKeys = ['intro', 'food', 'identifying', 'searching', 'positioning', 'looting', 'strength', 'upgrades', 'magic', 'levelling', 'surprise_attacks', 'dieing'] as const;
	const guidePages: JournalPage[] = guideKeys.map(key => ({
		title: t(`journal.document.adventurers_guide.${key}.title`), body: t(`journal.document.adventurers_guide.${key}.body`),
	}));
	const quests = [
		['sadGhost', 'windows.wndsadghost.title'], ['wandmaker', 'windows.wndwandmaker.title'],
		['blacksmith', 'windows.wndblacksmith.title'], ['imp', 'windows.wndimp.title'],
	] as const;
	const notesPages: JournalPage[] = [{
		title: t('port.ui.journalnotes'),
		body: quests.map(([id, key]) => {
			const line = t('port.journal.queststatus', { quest: t(key), status: t(`port.journal.${context.questStatus(id)}`) });
			const objectiveKey = context.questObjective(id);
			return objectiveKey ? `${line}\n${t(objectiveKey)}` : line;
		}).join('\n\n'),
	}];
	const potionIds = Object.keys(POTION_CLASS_BY_PORT_ID).filter(id => id !== 'potion');
	/** `Catalog.SCROLLS` is seeded from `Generator.Category.SCROLL.classes`, the same 12-scroll list
	 * `consumable-aliases.mwl`'s `category: "scroll"` rows already author - reading it from there
	 * instead of a second hand-typed list keeps both in sync. This port's own list used to hard-code
	 * only 11 (missing Scroll of Transmutation), so the Journal's item checklist never showed it. */
	const scrollIds = MWL_CONSUMABLE_CLASS_ALIASES.filter(alias => alias.category === 'scroll').map(alias => alias.item);
	const known = (id: string): boolean => context.items.some(item => item.id === id && item.identified !== false);
	const itemLine = (id: string): string => `${known(id) ? '✓' : '?'} ${context.itemDisplayName(id, known(id))}`;
	const itemPages: JournalPage[] = [{
		title: t('port.ui.journal.items'),
		body: [t('port.ui.journal.potions'), potionIds.map(itemLine).join('\n'), '', t('port.ui.journal.scrolls'), scrollIds.map(itemLine).join('\n'), '', t('port.ui.journal.rings'), Object.keys(RING_DEFS).map(id => itemLine(`ring_${id}`)).join('\n')].join('\n'),
	}];
	return [
		{ label: t('port.ui.journal.guide'), pages: guidePages },
		{ label: t('port.ui.journalnotes'), pages: [...regionPages, ...notesPages] },
		{ label: t('port.ui.journal.items'), pages: itemPages },
	];
}

