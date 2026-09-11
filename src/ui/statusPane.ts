import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { Bar, Label, NinePatch } from 'mwg';
import { SPD_TITLE_COLOR } from './spdTheme';

/**
 * The hero's status pane, ported from `ui/StatusPane.java` (its small, non-`large` layout).
 *
 * This replaces a single ~300-character `Label` that concatenated place, seed, HP, four
 * stats, gold, waterskin, hunger, a comma-joined list of buff keys, wand charges, ammo, the
 * whole bag and a keybind cheat-sheet onto one line. HP as a bar is legible mid-combat in a
 * way `HP 17/24` buried in that line is not, and buff *icons* say what is affecting you
 * where `[burning,cripple]` needed reading.
 *
 * Real geometry, from `StatusPane`'s small branch:
 *  - frame: `NinePatch(status_pane.png, 0, 0, 128, 36, 85, 0, 45, 0)` - a horizontal-only
 *    patch, hence the left/right-only border here.
 *  - HP fill: `Image(asset, 0, 36, 50, 4)`; shielded HP and raw shielding both
 *    `Image(asset, 0, 40, 50, 4)`; EXP fill `Image(asset, 0, 44, 16, 1)`.
 *  - fill maths (`StatusPane.update()`): `hp.scale.x = max(0, (health-shield)/max)` and
 *    `exp.scale.x = (width/exp.width) * hero.exp / hero.maxExp()`.
 *
 * Simplifications, all deliberate and listed in PORT_COVERAGE.md: shielding is represented
 * numerically in the HP bar/stats rather than with Java's separate gold strip, no `BusyIndicator`/`CircleArc` turn counter, and no
 * `large` interface-size variant.
 */

/** `BuffIndicator`'s own icon indices, into `buffs.png`'s 7x7 grid */
const BUFF_ICON: Record<string, number> = {
	//BuffIndicator.MIND_VISION = 0 - Monk's Focus uses this icon (tinted green in Java)
	focus: 0,
	hungry: 5,
	starving: 6,
	//FIRE = 2
	burning: 2,
	//POISON = 3
	poison: 3,
	//OOZE = 8
	ooze: 8,
	//PARALYSIS = 4; ROOTS = 11; INVISIBLE = 12; LEVITATION = 1
	paralysis: 4,
	roots: 11,
	invisibility: 12,
	levitation: 1,
	//SHADOWS = 13, the Cloak of Shadows buff
	cloak: 13,
	//WEAKNESS = 14
	weakness: 14,
	//FURY = 18
	fury: 18,
	//CRIPPLE = 23
	cripple: 23,
	//BLESS = 37
	bless: 37,
	//BERSERK = 40
	berserk: 40,
	//VULNERABLE = 46
	vulnerable: 46,
	//HEX = 47
	hex: 47,
	//DEGRADE = 48
	degrade: 48,
	//DAZE = 70
	daze: 70,
};

/** buffs.png is 128x64 of 7x7 cells, so TextureFilm walks 18 to a row */
const BUFF_SIZE = 7;
const BUFF_COLUMNS = 18;

const SCALE = 2;
const PANE_WIDTH = 128;
const BAR_WIDTH = 50;

export interface StatusPaneState {
	place: string;
	seed: string;
	level: number;
	hp: number;
	maxHp: number;
	shield?: number;
	exp: number;
	maxExp: number;
	accuracy: number;
	evasion: number;
	strength: number;
	gold: number;
	waterskin: number;
	waterskinMax: number;
	hunger: 'none' | 'hungry' | 'starving';
	buffs: string[];
	staff: { current: number; max: number } | null;
	ammo: number | null;
	carriedCount: number;
}

export class StatusPane extends Container {
	private hpBar: Bar;
	private expBar: Bar;
	private hpText: Label;
	private levelText: Label;
	private placeText: Label;
	private statsText: Label;
	private buffLayer = new Container();
	private buffIcons: Texture;
	private lastBuffs = '';

    constructor(statusSheet: Texture, buffs: Texture, heroSheet: Texture) {
		super();
		this.buffIcons = buffs;

		//NinePatch(asset, 0, 0, 128, 36, 85, 0, 45, 0): stretches horizontally only
		const frameTexture = new Texture({
			source: statusSheet.source,
			frame: new Rectangle(0, 0, PANE_WIDTH, 36),
		});
		const frame = new NinePatch(frameTexture, { border: { left: 85, top: 0, right: 45, bottom: 0 } });
		frame.resize(PANE_WIDTH, 36);
		frame.scale.set(SCALE);
		this.addChild(frame);
		// HeroSprite.avatar(class, armorTier=1), centered at StatusPane's (15,16).
		const avatar = new Sprite(new Texture({ source: heroSheet.source, frame: new Rectangle(1, 15, 12, 15) }));
		avatar.scale.set(SCALE);
		avatar.position.set(9 * SCALE, 8 * SCALE);
		this.addChild(avatar);

		//HP uses the real (0,36,50,4) strip. Missing HP is black, not the shielding art.
		this.hpBar = new Bar({
			width: BAR_WIDTH,
			height: 4,
			fillTexture: new Texture({ source: statusSheet.source, frame: new Rectangle(0, 36, BAR_WIDTH, 4) }),
			background: 0x000000,
			//`HealthBar.layout()` lights a sliver of health rather than a sub-pixel nothing, and the
			//framework's `Bar` has that rule as an option rather than always, so it is asked for.
			roundUpToPixel: true,
		});
		this.hpBar.x = 30 * SCALE;
		this.hpBar.y = 3 * SCALE;
		this.hpBar.scale.set(SCALE);
		this.addChild(this.hpBar);

		//EXP: Image(asset, 0, 44, 16, 1), stretched across the pane's width
		this.expBar = new Bar({
			width: 16,
			height: 1,
			fillTexture: new Texture({ source: statusSheet.source, frame: new Rectangle(0, 44, 16, 1) }),
			background: 0x222222,
			roundUpToPixel: true,
		});
		this.expBar.x = 0;
		this.expBar.y = 0;
		this.expBar.scale.set(PANE_WIDTH / 16 * SCALE, SCALE);
		this.addChild(this.expBar);

		this.hpText = new Label({ size: 8, color: 0xffffff });
		this.hpText.alpha = 0.85;
		this.hpText.x = 34 * SCALE;
		this.hpText.y = 3 * SCALE;
		this.addChild(this.hpText);

		//the level tag sits in the frame's left-hand plate, where Java draws it at ~27.5,28
		this.levelText = new Label({ size: 9, color: SPD_TITLE_COLOR, bold: true });
		this.levelText.anchor.set(0.5, 0.5);
		this.levelText.x = 27.5 * SCALE;
		this.levelText.y = 28 * SCALE;
		this.addChild(this.levelText);

		this.placeText = new Label({ size: 9, color: SPD_TITLE_COLOR });
		this.placeText.x = 32 * SCALE;
		this.placeText.y = 21 * SCALE;
		this.addChild(this.placeText);

		this.statsText = new Label({ size: 8, color: 0xcccccc });
		this.statsText.x = 0;
		this.statsText.y = 38 * SCALE;
		// Port-only diagnostic details remain available on hover; Java has WndHero.
		this.statsText.visible = false;
		this.eventMode = 'static';
		this.hitArea = new Rectangle(0, 0, PANE_WIDTH * SCALE, 36 * SCALE);
		// Details are shown by the portrait's modal hero-info action.
		this.cursor = 'pointer';
		this.on('pointerout', () => { this.statsText.visible = false; });
		this.addChild(this.statsText);

		this.buffLayer.x = 30 * SCALE;
		this.buffLayer.y = 9 * SCALE;
		this.addChild(this.buffLayer);
	}

	update(state: StatusPaneState): void {
		//hp.scale.x = max(0, (health - shield)/max); no shielding here, so health/max
		const shield = state.shield ?? 0;
		this.hpBar.setValue(state.maxHp > 0 ? Math.max(0, state.hp - shield) / state.maxHp : 0);
		this.hpText.setText(`${Math.max(0, state.hp)}/${state.maxHp}`);

		//exp.scale.x = (width/exp.width) * hero.exp / hero.maxExp() - the width factor is
		//baked into this bar's own scale, so only the fraction is set here
		this.expBar.setValue(state.maxExp > 0 ? state.exp / state.maxExp : 0);

		this.levelText.setText(String(state.level));
		this.placeText.setText(state.place);

		const hunger =
			state.hunger === 'starving' ? '  STARVING' : state.hunger === 'hungry' ? '  hungry' : '';
		this.statsText.setText(
			`seed ${state.seed}  ACC ${state.accuracy}  EVA ${state.evasion}  STR ${state.strength}  ` +
				`gold ${state.gold}  water ${state.waterskin}/${state.waterskinMax}` +
				(state.staff ? `  staff ${state.staff.current}/${state.staff.max}` : '') +
			(state.ammo !== null ? `  ammo ${state.ammo}` : '') +
			(shield > 0 ? `  SHLD ${shield}` : '') +
				`  bag ${state.carriedCount}` +
				hunger
		);
		this.statsText.setColor(state.hunger === 'starving' ? 0xff8800 : 0xcccccc);

		this.layoutBuffs([...state.buffs, ...(state.hunger === 'none' ? [] : [state.hunger])]);
	}

	/**
	 * `BuffIndicator` rebuilds its row from the live buff set each update, skipping any buff
	 * whose `icon()` is `NONE`. Java animates icons in and out with an `AlphaTweener`; this
	 * rebuilds the row outright, a stated simplification.
	 */
	private layoutBuffs(buffs: string[]): void {
		const key = buffs.join(',');
		if (key === this.lastBuffs) return;
		this.lastBuffs = key;
		this.buffLayer.removeChildren().forEach((child) => child.destroy());

		let x = 0;
		for (const buff of buffs) {
			const index = BUFF_ICON[buff];
			if (index === undefined) continue;
			const icon = new Sprite(
				new Texture({
					source: this.buffIcons.source,
					frame: new Rectangle(
						(index % BUFF_COLUMNS) * BUFF_SIZE,
						Math.floor(index / BUFF_COLUMNS) * BUFF_SIZE,
						BUFF_SIZE,
						BUFF_SIZE
					),
				})
			);
			//Monk's Focus is hardlit green in Java (tintIcon: 0.25, 1.5, 1.0)
			if (buff === 'focus') icon.tint = 0x40ff80;
			icon.x = x;
			icon.scale.set(SCALE);
			this.buffLayer.addChild(icon);
			x += (BUFF_SIZE + 1) * SCALE;
		}
	}
}
