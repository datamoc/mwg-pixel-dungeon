import { Container, FillGradient, Graphics, Rectangle, Sprite, Texture } from 'mwg/two-d/pixi-interop';

/** the four sheets `TitleBackground` cuts its frames from, each a `TextureFilm` over `splashes/title/*.png` */
export interface TitleBackgroundTextures {
	archs: Texture;
	backClusters: Texture;
	midMixed: Texture;
	frontSmall: Texture;
}

/**
 * `TextureFilm(texture, frameW, frameH)`: row-major grid of equal frames, `cols = floor(texW / frameW)`.
 * Textures are made once per frame index so re-framing a sprite is just a texture swap.
 */
class Film {
	private readonly cols: number;
	private readonly cache = new Map<number, Texture>();

	constructor(private readonly sheet: Texture, private readonly frameW: number, private readonly frameH: number) {
		this.cols = Math.floor(sheet.width / frameW);
	}

	get(index: number): Texture {
		let tex = this.cache.get(index);
		if (!tex) {
			const col = index % this.cols, row = Math.floor(index / this.cols);
			tex = new Texture({
				source: this.sheet.source,
				frame: new Rectangle(col * this.frameW, row * this.frameH, this.frameW, this.frameH),
			});
			this.cache.set(index, tex);
		}
		return tex;
	}
}

/** `Random.Float(min, max)` */
const randFloat = (min: number, max: number): number => min + Math.random() * (max - min);

/** `Random.chances(float[])`: index drawn with weight `max(0, chances[i])`, or -1 when nothing is left */
function randChances(chances: number[]): number {
	let sum = 0;
	for (const c of chances) sum += Math.max(0, c);
	if (sum <= 0) return -1;
	let value = Math.random() * sum;
	for (let i = 0; i < chances.length; i++) {
		if (value < chances[i]) return i;
		value -= Math.max(0, chances[i]);
	}
	return -1;
}

/**
 * Picks frames the way `getArchFrame`/`getClusterFrame`/`getMidFrame`/`getSmallFrame` do: a bag of
 * per-frame counts that refills when it runs dry, and (mid/small only) a short memory of the last
 * frames drawn so the same picture is not repeated close together.
 */
class FramePicker {
	private chances: number[];

	constructor(private readonly initial: readonly number[], private readonly film: Film, private readonly memory = 0) {
		this.chances = [...initial];
	}

	private readonly recent: number[] = [];

	next(): Texture {
		let tile = -1;
		do {
			tile = randChances(this.chances);
			if (tile === -1) {
				this.chances = [...this.initial];
				tile = randChances(this.chances);
			}
		} while (this.recent.includes(tile));
		this.chances[tile]--;
		if (this.memory > 0) {
			this.recent.unshift(tile);
			//Java: `if (size >= 20) remove(19)` / `if (size >= 15) remove(14)` - capped one short of the threshold
			if (this.recent.length >= this.memory) this.recent.splice(this.memory - 1);
		}
		return this.film.get(tile);
	}
}

/** an `Image` of a layer: width()/height() are frame size times scale, like `Visual.width()` */
const imgW = (s: Sprite): number => s.texture.frame.width * s.scale.x;
const imgH = (s: Sprite): number => s.texture.frame.height * s.scale.y;

/** sets `Image.brightness(v)` (`rm = gm = bm = v`) as a Pixi tint */
function setBrightness(s: Sprite, v: number): void {
	const c = Math.round(Math.max(0, Math.min(1, v)) * 255);
	s.tint = (c << 16) | (c << 8) | c;
}

/**
 * v3.3.8's `ui/TitleBackground.java`: a parallax of six layers scrolling upward at
 * `SCROLL_SPEED = 15` (scaled by `height / 450`), each layer faster than the one behind - archs, two
 * cluster layers, a far small layer, two mid layers and a close small layer - with a dark
 * gradient over the arches only. It replaces the older `Archs` tiled-texture scroll this port
 * originally used on the title screen (`Archs.java` is still what SPD uses elsewhere).
 *
 * Java builds and recycles its images in `update()`: anything that scrolls off the top is re-framed
 * and re-placed below the last one, and new images are added until the layer reaches past the
 * bottom of the screen. This does the same, keeping one array of sprites per layer.
 */
export class TitleBackground extends Container {
	private static readonly SCROLL_SPEED = 15;

	private static readonly ARCH_W = 333;
	private static readonly ARCH_H = 100;

	private readonly archFrames: FramePicker;
	private readonly clusterFrames: FramePicker;
	private readonly midFrames: FramePicker;
	private readonly smallFrames: FramePicker;

	private readonly archLayer = new Container();
	private readonly darkness = new Graphics();
	private readonly clustersFarLayer = new Container();
	private readonly clustersLayer = new Container();
	private readonly smallFarLayer = new Container();
	private readonly mids1Layer = new Container();
	private readonly mids2Layer = new Container();
	private readonly smallCloseLayer = new Container();

	private archs: Sprite[] = [];
	private clustersFar: Sprite[] = [];
	private clusters: Sprite[] = [];
	private smallFars: Sprite[] = [];
	private mids1: Sprite[] = [];
	private mids2: Sprite[] = [];
	private smallCloses: Sprite[] = [];

	//the logical size handed to `resize` (named apart from `Container.width/height`, which measure children)
	private viewW = 1;
	private viewH = 1;
	private wasLandscape: boolean | null = null;
	private density = 1;

	constructor(textures: TitleBackgroundTextures) {
		super();
		//the sheets are pixel art; Java's `SmartTexture` defaults to NEAREST filtering
		for (const t of Object.values(textures)) t.source.scaleMode = 'nearest';
		this.archFrames = new FramePicker([5, 5, 2, 2, 2, 2], new Film(textures.archs, TitleBackground.ARCH_W, TitleBackground.ARCH_H));
		this.clusterFrames = new FramePicker([2, 2], new Film(textures.backClusters, 450, 250));
		this.midFrames = new FramePicker(new Array(24).fill(1), new Film(textures.midMixed, 273, 242), 20);
		this.smallFrames = new FramePicker(new Array(20).fill(1), new Film(textures.frontSmall, 112, 116), 15);
		this.addChild(
			this.archLayer, this.darkness, this.clustersFarLayer, this.clustersLayer,
			this.smallFarLayer, this.mids1Layer, this.mids2Layer, this.smallCloseLayer,
		);
	}

	/**
	 * `setupObjects`. Java recreates the component on a size change and carries the old images across
	 * with `convertImage`; this rebuilds the layers from empty when the shape changes (the next
	 * `update()` refills them) and only re-scales `density`/the gradient otherwise. See PORT_COVERAGE.md.
	 */
	resize(width: number, height: number): void {
		const landscape = width > height;
		const reshaped = this.wasLandscape !== null && (landscape !== this.wasLandscape
			|| Math.abs(height - this.viewH) > 0.5 || Math.abs(width - this.viewW) > 0.5);
		this.viewW = width;
		this.viewH = height;
		this.wasLandscape = landscape;
		if (reshaped) this.clearLayers();

		let scale = height / 450;
		if (!landscape) scale /= 1.5;
		this.density = width / (800 * scale);
		this.density = (this.density + 0.5) / 1.5; //pull density a third of the way toward 1

		//`TextureCache.createGradient(0x00, 0x11, 0x22, 0x33, 0x44, 0x88 alpha)`: a 6x1 image, rotated 90 degrees and
		//stretched over the screen with LINEAR filtering, so pixel i sits at (i+0.5)/6 and the ends clamp
		const alphas = [0x00, 0x11, 0x22, 0x33, 0x44, 0x88];
		const stops = [
			{ offset: 0, color: `rgba(0,0,0,${alphas[0] / 255})` },
			...alphas.map((a, i) => ({ offset: (i + 0.5) / alphas.length, color: `rgba(0,0,0,${a / 255})` })),
			{ offset: 1, color: `rgba(0,0,0,${alphas[alphas.length - 1] / 255})` },
		];
		this.darkness.clear();
		this.darkness.rect(0, 0, width, height).fill(
			new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local', colorStops: stops }),
		);
	}

	private clearLayers(): void {
		for (const layer of [
			this.archLayer, this.clustersFarLayer, this.clustersLayer,
			this.smallFarLayer, this.mids1Layer, this.mids2Layer, this.smallCloseLayer,
		]) layer.removeChildren().forEach((c) => c.destroy());
		this.archs = []; this.clustersFar = []; this.clusters = [];
		this.smallFars = []; this.mids1 = []; this.mids2 = []; this.smallCloses = [];
	}

	update(dt: number): void {
		const { viewW: width, viewH: height } = this;
		const portrait = width <= height;
		let scale = height / 450;
		let shift = dt * TitleBackground.SCROLL_SPEED * scale;
		if (portrait) shift /= 1.5;
		this.updateArchLayer(scale, shift);
		if (portrait) scale /= 1.5;
		shift *= 1.33;
		this.updateClusterLayer(this.clustersFar, this.clustersFarLayer, scale, shift, 0.5, 0.5);
		shift *= 1.5;
		this.updateClusterLayer(this.clusters, this.clustersLayer, scale, shift, 1, 0.75);
		shift *= 1.33;
		this.updateSmallLayer(this.smallFars, this.smallFarLayer, scale, shift, [0.75, 1.25], 0.8, false);
		shift *= 1.33;
		this.updateMidLayer(this.mids1, this.mids1Layer, scale, shift, [0.75, 1.25], 0.9, true);
		shift *= 1.33;
		this.updateMidLayer(this.mids2, this.mids2Layer, scale, shift, [1.25, 1.75], 1, false);
		shift *= 1.33;
		this.updateSmallLayer(this.smallCloses, this.smallCloseLayer, scale, shift, [2, 2.5], 1, true);
	}

	//*** Arch layer ***

	private updateArchLayer(scale: number, shift: number): void {
		const { viewW: width, viewH: height, archs, archLayer } = this;
		let bottom = 0;
		const toMove: Sprite[] = [];

		//pass over existing archs, raise them
		for (const arch of archs) {
			arch.y -= shift;
			if (arch.y + imgH(arch) < 0) toMove.push(arch);
			else if (arch.y + imgH(arch) > bottom) bottom = arch.y + imgH(arch);
		}

		//move any archs that scrolled off camera to the bottom (one row, all at the same y)
		if (toMove.length > 0) {
			for (const arch of toMove) {
				arch.texture = this.archFrames.next();
				arch.y = bottom - 5 * scale;
			}
			bottom += TitleBackground.ARCH_H * scale;
		}

		//if we aren't low enough, add more arch rows
		while (bottom < height) {
			let left = -5 + (-33.334 * (1 + Math.floor(Math.random() * 8)) * scale); //Random.Int(1, 9)
			while (left < width) {
				const arch = new Sprite(this.archFrames.next());
				arch.scale.set(scale);
				arch.x = left;
				arch.y = bottom - 5 * scale;
				archLayer.addChild(arch);
				archs.push(arch);
				left += imgW(arch) - 9 * scale;
			}
			bottom += TitleBackground.ARCH_H * scale;
		}
	}

	//*** Shared recycling loop for the floating layers ***

	/**
	 * The loop all six floating layers share in Java: raise everything, collect what left the top, then
	 * `respawn` re-places each of those below the current lowest one, and `spawn` grows the layer until it
	 * reaches `padding` below the screen.
	 */
	private scrollLayer(
		list: Sprite[],
		layer: Container,
		shift: number,
		padBase: number,
		respawn: (img: Sprite, lastX: number, bottom: number) => void,
		spawn: (lastX: number, bottom: number) => Sprite,
	): void {
		let bottom = 0;
		let lastX = 0;
		const toMove: Sprite[] = [];
		for (const img of list) {
			img.y -= shift;
			if (img.y + imgH(img) < -20) toMove.push(img);
			else if (img.y + imgH(img) > bottom) {
				bottom = img.y + imgH(img);
				lastX = img.x;
			}
		}
		if (toMove.length > 0) {
			for (const img of toMove) {
				respawn(img, lastX, bottom);
				bottom = img.y + imgH(img);
				lastX = img.x;
			}
		}
		const padding = padBase - padBase / 2 / this.density;
		while (bottom < this.viewH + padding) {
			const img = spawn(lastX, bottom);
			list.push(img);
			layer.addChild(img);
			bottom = img.y + imgH(img);
			lastX = img.x;
		}
	}

	/** x for the cluster/mid layers: `[-w/3, width - 2w/3)`, retried until far enough from the previous one */
	private spreadX(img: Sprite, lastX: number, reach: number): void {
		const w = imgW(img);
		let flex = 0;
		do {
			img.x = randFloat(-w / 3, this.viewW - 2 * w / 3);
			flex += 1;
		} while (Math.abs(img.x - lastX) < this.density * (w * reach - flex));
	}

	//*** Cluster layers (far: half scale, brightness .5; near: full scale, brightness .75) ***

	private updateClusterLayer(list: Sprite[], layer: Container, scale: number, shift: number, sizeFactor: number, brightness: number): void {
		this.scrollLayer(
			list, layer, shift, 300,
			(img, lastX, bottom) => {
				img.texture = this.clusterFrames.next();
				this.spreadX(img, lastX, 0.5);
				img.y = bottom - imgH(img) + randFloat(imgH(img) / 2, imgH(img)) / this.density;
				img.angle = randFloat(-20, 20);
			},
			(lastX, bottom) => {
				const img = new Sprite(this.clusterFrames.next());
				img.scale.set(scale * sizeFactor);
				this.spreadX(img, lastX, 0.5);
				img.y = bottom - imgH(img) + randFloat(imgH(img) / 2, imgH(img)) / this.density;
				img.angle = randFloat(-20, 20);
				setBrightness(img, brightness);
				return img;
			},
		);
	}

	//*** Mid layers (mids1: brightness .9 and .75-1.25x; mids2: untouched brightness and 1.25-1.75x) ***

	private updateMidLayer(list: Sprite[], layer: Container, scale: number, shift: number, range: [number, number], brightness: number, respawnYFloor: boolean): void {
		//Java's recycle branch places mids1 with `height*0.75 .. height` and mids2 with `height/2 .. height`;
		//the spawn branch uses `height/2 .. height` for both
		this.scrollLayer(
			list, layer, shift, 300,
			(img, lastX, bottom) => {
				img.texture = this.midFrames.next();
				img.scale.set(scale * randFloat(range[0], range[1]));
				this.spreadX(img, lastX, 0.75);
				img.y = bottom - imgH(img) + randFloat(imgH(img) * (respawnYFloor ? 0.75 : 0.5), imgH(img)) / this.density;
				img.angle = randFloat(-20, 20);
			},
			(lastX, bottom) => {
				const img = new Sprite(this.midFrames.next());
				img.scale.set(scale * randFloat(range[0], range[1]));
				if (brightness !== 1) setBrightness(img, brightness);
				this.spreadX(img, lastX, 0.75);
				img.y = bottom - imgH(img) + randFloat(imgH(img) / 2, imgH(img)) / this.density;
				img.angle = randFloat(-20, 20);
				return img;
			},
		);
	}

	//*** Small layers (far: brightness .8, x kept off the edges; close: 2-2.5x, spread like clusters) ***

	private updateSmallLayer(list: Sprite[], layer: Container, scale: number, shift: number, range: [number, number], brightness: number, close: boolean): void {
		const placeX = (img: Sprite, lastX: number) => {
			const w = imgW(img);
			let flex = 0;
			do {
				img.x = close ? randFloat(-w / 3, this.viewW - 2 * w / 3) : randFloat(w / 3, this.viewW - 4 * w / 3);
				flex += 1;
			} while (Math.abs(img.x - lastX) < this.density * (w - flex));
		};
		//the far layer overlaps by half a height, the close layer by a whole one
		const placeY = (img: Sprite, bottom: number) => {
			img.y = close
				? bottom - imgH(img) + randFloat(imgH(img) / 2, imgH(img)) / this.density
				: bottom - imgH(img) / 2 + randFloat(imgH(img) / 2, imgH(img)) / this.density;
		};
		this.scrollLayer(
			list, layer, shift, 150,
			(img, lastX, bottom) => {
				img.texture = this.smallFrames.next();
				img.scale.set(scale * randFloat(range[0], range[1]));
				placeX(img, lastX);
				placeY(img, bottom);
				img.angle = randFloat(-20, 20);
			},
			(lastX, bottom) => {
				const img = new Sprite(this.smallFrames.next());
				img.scale.set(scale * randFloat(range[0], range[1]));
				if (brightness !== 1) setBrightness(img, brightness);
				placeX(img, lastX);
				placeY(img, bottom);
				img.angle = randFloat(-20, 20);
				return img;
			},
		);
	}
}
