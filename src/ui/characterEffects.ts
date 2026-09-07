import { Container, Rectangle, Sprite, Texture } from 'pixi.js';

interface CharacterVisual { sprite: Sprite; sleeping?: boolean; }

/** CharSprite's flattened sprite shadow and EmoIcon.Sleep's pulsing icon.
 * Java's per-sprite flying/jumping shadow offsets are not modeled yet.
 */
export class CharacterEffects {
	readonly shadows = new Container();
	readonly icons = new Container();
	private entries = new Map<Sprite, { shadow: Sprite; sleep?: Sprite; pulse: number }>();
	private sleepTexture: Texture;
	constructor(icons: Texture) {
		this.sleepTexture = new Texture({ source: icons.source, frame: new Rectangle(32, 64, 9, 8) });
		this.shadows.eventMode = this.icons.eventMode = 'none';
	}
	update(dt: number, characters: CharacterVisual[]): void {
		const current = new Set(characters.map(character => character.sprite));
		for (const [sprite, entry] of this.entries) {
			if (sprite.destroyed || !current.has(sprite)) {
				entry.shadow.destroy(); entry.sleep?.destroy(); this.entries.delete(sprite);
			}
		}
		for (const { sprite, sleeping } of characters) {
			if (sprite.destroyed) continue;
			let entry = this.entries.get(sprite);
			if (!entry) {
				const shadow = new Sprite(sprite.texture);
				shadow.tint = 0x000000;
				this.shadows.addChild(shadow);
				entry = { shadow, pulse: 0 }; this.entries.set(sprite, entry);
			}
			const w = sprite.texture.orig.width, h = sprite.texture.orig.height;
			const left = sprite.x + (16 - w) / 2, top = sprite.y + 10 - h;
			const shadow = entry.shadow;
			shadow.texture = sprite.texture;
			shadow.anchor.set(0.5, 0);
			shadow.position.set(sprite.x + 8, top + h * 0.75 + 0.25);
			shadow.scale.set((sprite.scale.x < 0 ? -1 : 1) * 1.2, 0.25);
			shadow.alpha = sprite.alpha * 0.6;
			shadow.visible = sprite.visible;
			if (sleeping && !entry.sleep) {
				entry.sleep = new Sprite(this.sleepTexture); entry.sleep.anchor.set(0.5);
				this.icons.addChild(entry.sleep);
			}
			if (entry.sleep) {
				entry.sleep.visible = !!sleeping && sprite.visible;
				if (entry.sleep.visible) entry.pulse = (entry.pulse + dt * 0.5) % 0.4;
				entry.sleep.scale.set(1 + (entry.pulse <= 0.2 ? entry.pulse : 0.4 - entry.pulse));
				entry.sleep.position.set(left + w, top - 4);
			}
		}
	}
	clear(): void {
		for (const entry of this.entries.values()) { entry.shadow.destroy(); entry.sleep?.destroy(); }
		this.entries.clear();
	}
}
