import type { DungeonScene } from '../../dungeonScene';
import type { Creature } from '../../../combat';
import { t } from '../../../i18n/index';
import { showConfirmWindow } from '../../../ui/portWindows';

/** Missile durability confirmation scene methods extracted without changing their flow. */
export const missileThrowConfirmationMethods = {
	missileThrowNeedsConfirm(this: DungeonScene): boolean {
		return this.missileLevel > 0 && this.ammo === 1 && this.ammoDurability <= this.missileDurabilityCost();
	},

	/** `WndOptions`' yes/no, worded with SPD's own `break_upgraded_warn_*` strings (title is the
	 * missile's own name, as Java's `Messages.titleCase(title())` is). "Yes" re-enters
	 * `useSpecial` with the confirmation latched, so the throw runs its one real path.
	 *
	 * **The target has to be handed back explicitly (fixed 2026-09-16).** `useSpecial` consumes
	 * `specialTarget` as it resolves the target, which happens *before* this warning is raised - so
	 * re-entering with only the confirmation flag set re-resolved the target from scratch (Java's
	 * `doThrow` is re-entered with the same `enemy`), and with no other visible candidate the throw
	 * simply did not happen: the player answered "Yes" and nothing was spent or hit. Passing the
	 * resolved target through re-latches exactly what Java keeps. */
	confirmMissileThrow(this: DungeonScene, title: string, target: Creature): void {
		showConfirmWindow(
			this.gameWindows,
			title,
			t('port.confirm.lastmissile.desc'),
			t('port.confirm.lastmissile.yes'),
			t('port.confirm.lastmissile.no'),
			() => {
				this.missileThrowConfirmed = true;
				this.specialTarget = target;
				this.useSpecial();
			},
		);
	},
};
