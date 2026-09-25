/**
 * `Doom.fx()` adds `CharSprite.State.DARKENED` and removes it when Doom detaches
 * (`Doom.java`, `CharSprite.java`, tag `v3.3.8`). `DarkBlock.update()` calls
 * `CharSprite.brightness(0.4f)` and `lighten()` calls `resetColor()` (`DarkBlock.java`,
 * `Visual.java`). Pixi has no matching brightness/additive-channel contract here, so
 * this approximates it with 0.4 RGB multiplication while preserving/restoring any
 * existing tint (for example, a champion's identity colour).
 */
export interface TintableSprite {
	tint: number;
}

interface TintState {
	baseTint: number;
	dark: Set<string>;
}

const tints = new WeakMap<TintableSprite, TintState>();

function darken(tint: number): number {
	const channel = (shift: number) => Math.round(((tint >>> shift) & 0xff) * 0.4);
	return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** Apply or clear sprite darkening for one reason, composed across reasons. */
function syncTint(sprite: TintableSprite, reason: string, active: boolean): void {
	let state = tints.get(sprite);
	if (!active) {
		if (state) {
			state.dark.delete(reason);
			if (state.dark.size === 0) {
				if (sprite.tint === darken(state.baseTint)) sprite.tint = state.baseTint;
				tints.delete(sprite);
			}
		}
		return;
	}

	if (!state) {
		state = { baseTint: sprite.tint, dark: new Set() };
		tints.set(sprite, state);
	} else if (sprite.tint !== darken(state.baseTint)) {
		// Another presentation effect changed the base tint while darkened.
		state.baseTint = sprite.tint;
	}
	state.dark.add(reason);
	sprite.tint = darken(state.baseTint);
}

/** Apply or clear Doom's sprite darkening without accumulating tint on repeated syncs. */
export function syncDoomSpriteTint(sprite: TintableSprite, doomed: boolean): void {
	syncTint(sprite, 'doom', doomed);
}

/** Challenge.SpectatorFreeze.fx() darkens the frozen spectator the same way (Challenge.java, tag v3.3.8); the PARALYSED half has no port visual to reuse. */
export function syncFrozenSpriteTint(sprite: TintableSprite, frozen: boolean): void {
	syncTint(sprite, 'frozen', frozen);
}
