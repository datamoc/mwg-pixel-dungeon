import { Label, type LabelOptions } from 'mwg';

/** RenderedTextBlock's black outline keeps small text legible over game artwork. */
export class SpdLabel extends Label {
	constructor(options: LabelOptions | string = {}) {
		super({
			stroke: { color: 0x000000, width: 0.65 }, resolution: 3, roundPixels: true,
			...(typeof options === 'string' ? { text: options } : options),
		});
	}
}
