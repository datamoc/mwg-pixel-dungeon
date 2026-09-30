import { Container, Graphics, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';

interface CharacterVisual { sprite: Sprite; sleeping?: boolean; emote?: 'alert' | 'lost'; hearts?: boolean; shadowOffset?: number; castsShadow?: boolean; }

/** CharSprite's flattened sprite shadow and EmoIcon.Sleep's pulsing icon.
 * Java's per-sprite flying/jumping shadow offsets are not modeled yet.
 */
export class CharacterEffects {
	readonly shadows = new Container();
	readonly icons = new Container();
	private entries = new Map<Sprite, { shadow: Sprite; sleep?: Sprite; emo?: Sprite; emoKind?: string; pulse: number; heartClock: number; hearts: { sprite: Graphics; age: number }[] }>();
	private sleepTexture: Texture;
	private emoTextures: Record<'alert' | 'lost', Texture>;
	constructor(icons: Texture) {
		this.sleepTexture = new Texture({ source: icons.source, frame: new Rectangle(32, 64, 9, 8) });
		//`Icons.ALERT`/`LOST` (`uvRectBySize(16,80,8,8)`/`(24,80,8,8)` in Java), pasted byte-for-byte into this sheet's first row.
		this.emoTextures = { alert: new Texture({ source: icons.source, frame: new Rectangle(166, 0, 8, 8) }), lost: new Texture({ source: icons.source, frame: new Rectangle(175, 0, 8, 8) }) };
		this.shadows.eventMode = this.icons.eventMode = 'none';
	}
	update(dt: number, characters: CharacterVisual[]): void {
		const current = new Set(characters.map(character => character.sprite));
		for (const [sprite, entry] of this.entries) {
			if (sprite.destroyed || !current.has(sprite)) {
				entry.shadow.destroy(); entry.sleep?.destroy(); entry.emo?.destroy();
				for (const heart of entry.hearts) heart.sprite.destroy();
				this.entries.delete(sprite);
			}
		}
		for (const { sprite, sleeping, emote, hearts, shadowOffset = 0, castsShadow = true } of characters) {
			if (sprite.destroyed) continue;
			let entry = this.entries.get(sprite);
			if (!entry) {
				const shadow = new Sprite(sprite.texture);
				shadow.tint = 0x000000;
				this.shadows.addChild(shadow);
				entry = { shadow, pulse: 0, heartClock: 0, hearts: [] }; this.entries.set(sprite, entry);
			}
			const w = sprite.texture.orig.width, h = sprite.texture.orig.height;
			const left = sprite.x + (16 - w) / 2, top = sprite.y + 10 - h;
			const shadow = entry.shadow;
			shadow.texture = sprite.texture;
			shadow.anchor.set(0.5, 0);
			shadow.position.set(sprite.x + 8, top + h * 0.75 + 0.25 + shadowOffset);
			shadow.scale.set((sprite.scale.x < 0 ? -1 : 1) * 1.2, 0.25);
			shadow.alpha = sprite.alpha * 0.6;
			//`ShadowClone.ShadowSprite.link()` sets `renderShadow = false` (tag `v3.3.8`);
			//the normal `CharSprite` flattening remains enabled for every other character.
			shadow.visible = castsShadow && sprite.visible;
			if (sleeping && !entry.sleep) {
				entry.sleep = new Sprite(this.sleepTexture); entry.sleep.anchor.set(0.5);
				this.icons.addChild(entry.sleep);
			}
			//`EmoIcon.Alert`/`Lost`: pulses 1..maxSize (1.3/1.25) at timeScale 2/1, top-right of the sprite, bottom-left anchored.
			if (emote && entry.emoKind !== emote) {
				entry.emo?.destroy();
				entry.emo = new Sprite(this.emoTextures[emote]); entry.emo.anchor.set(0, 1);
				entry.emoKind = emote; this.icons.addChild(entry.emo);
			}
			if (entry.emo) {
				entry.emo.visible = !!emote && sprite.visible;
				if (!emote) entry.emoKind = undefined;
				const max = emote === 'lost' ? 1.25 : 1.3, rate = emote === 'lost' ? 1 : 2;
				entry.pulse = (entry.pulse + dt * rate) % (2 * (max - 1));
				entry.emo.scale.set(1 + (entry.pulse <= max - 1 ? entry.pulse : 2 * (max - 1) - entry.pulse));
				entry.emo.position.set(left + w - 1, top);
			}
			if (entry.sleep) {
				entry.sleep.visible = !!sleeping && sprite.visible;
				if (entry.sleep.visible) entry.pulse = (entry.pulse + dt * 0.5) % 0.4;
				entry.sleep.scale.set(1 + (entry.pulse <= 0.2 ? entry.pulse : 0.4 - entry.pulse));
				entry.sleep.position.set(left + w, top - 4);
			}
			//`SummonElemental.InvisAlly.fx()` (tag `v3.3.8`) pours Speck.HEART every 0.5s
			//while attached. The port uses a small vector heart particle in the shared overlay
			//instead of Java's Speck texture/particle class; lifetime and upward drift are visual.
			for (let i = entry.hearts.length - 1; i >= 0; i--) {
				const heart = entry.hearts[i]!;
				heart.age += dt;
				if (heart.age >= 1.2) { heart.sprite.destroy(); entry.hearts.splice(i, 1); continue; }
				heart.sprite.y -= dt * 8;
				heart.sprite.alpha = 1 - heart.age / 1.2;
			}
			if (hearts && sprite.visible) {
				entry.heartClock += dt;
				if (entry.heartClock >= 0.5) {
					entry.heartClock %= 0.5;
					const heart = new Graphics().circle(2, 2, 2).circle(6, 2, 2)
						.poly([0, 2, 8, 2, 4, 8]).fill({ color: 0xff5b88 });
					heart.position.set(left + w / 2 - 4, top - 2);
					this.icons.addChild(heart);
					entry.hearts.push({ sprite: heart, age: 0 });
				}
			} else entry.heartClock = 0;
		}
	}
	clear(): void {
		for (const entry of this.entries.values()) {
			entry.shadow.destroy(); entry.sleep?.destroy(); entry.emo?.destroy();
			for (const heart of entry.hearts) heart.sprite.destroy();
		}
		this.entries.clear();
	}
}
