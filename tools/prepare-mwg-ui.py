"""Prepare MWG UI extraction candidates without modifying the framework checkout.

Run from any directory. Outputs go into tools/scratch/mwg-ui-extraction.
Already-applied changes are preserved, making repeat runs safe. Review the generated
files against the current checkout before applying them; this is not a merge tool.
"""
from pathlib import Path
root = Path(__file__).resolve().parents[2] / 'MW_games'
out = Path(__file__).parent / 'scratch' / 'mwg-ui-extraction'
out.mkdir(parents=True, exist_ok=True)
def save(name, text):
    (out / name).write_text(text, encoding='utf-8')
s = (root / 'src/ui/Label.ts').read_text(encoding='utf-8')
original_label = s
s = s.replace('\tbold?: boolean;', '''\tbold?: boolean;
\t/** Outline in texture pixels, useful for text over artwork. */
\tstroke?: { color: number; width: number };
\t/** Text texture resolution; omit to use the renderer default. */
\tresolution?: number;
\troundPixels?: boolean;''')
s = s.replace("\t\t\ttext: opts.text ?? '',", "\t\t\ttext: opts.text ?? '',\n\t\t\tresolution: opts.resolution,\n\t\t\troundPixels: opts.roundPixels,")
s = s.replace('fontFamily: t.font.family,', 'fontFamily: t.font.family,\n\t\t\t\tstroke: opts.stroke,', 1)
save('Label.ts', original_label if 'stroke?:' in original_label else s)
s = (root / 'src/ui/Button.ts').read_text(encoding='utf-8')
original_button = s
s = s.replace("{ Container, Graphics }", "{ Container, Graphics, type Texture }")
s = s.replace("{ NinePatch }", "{ NinePatch, type NinePatchOptions }")
s = s.replace("{ Label }", "{ Label, type LabelOptions }")
s = s.replace('export interface ButtonOptions {', '''export type ButtonState = 'idle' | 'hover' | 'pressed' | 'disabled';

export interface ButtonSkin {
\ttexture: Texture;
\tborder: NinePatchOptions['border'];
\t/** Missing states retain the standard button tint. */
\ttints?: Partial<Record<ButtonState, number>>;
}

export interface ButtonOptions {''')
s = s.replace('\tdisabled?: boolean;', '''\t/** Per-button chrome, independent of the window theme. Textures remain caller-owned. */
\tskin?: ButtonSkin;
\t/** Caption styling, also used when setText creates a caption later. */
\tlabel?: Omit<LabelOptions, 'text'>;
\tdisabled?: boolean;''')
s = s.replace("\ntype ButtonState = 'idle' | 'hover' | 'pressed' | 'disabled';\n", '\n')
s = s.replace('\tprivate background:', "\tprivate readonly skin?: ButtonSkin;\n\tprivate readonly labelOptions: Omit<LabelOptions, 'text'>;\n\tprivate background:")
s = s.replace('\t\tconst t = theme();', '\t\tthis.skin = options.skin;\n\t\tthis.labelOptions = options.label ?? {};\n\t\tconst t = theme();', 1)
s = s.replace('this.background = t.panel ?', 'this.background = this.skin ? new NinePatch(this.skin.texture, { border: this.skin.border }) : t.panel ?')
s = s.replace("new Label({ text: options.text, align: 'center' })", "new Label({ align: 'center', ...this.labelOptions, text: options.text })")
s = s.replace("new Label({ text, align: 'center' })", "new Label({ align: 'center', ...this.labelOptions, text })")
s = s.replace('this.background.tint = tint;', 'this.background.tint = this.skin?.tints?.[this.state] ?? tint;')
s = s.replace('this.disabled_ ? t.color.textDim : t.color.text);', 'this.disabled_ ? t.color.textDim : this.labelOptions.color ?? t.color.text);')
save('Button.ts', original_button if 'export interface ButtonSkin' in original_button else s)
s = (root / 'src/ui/index.ts').read_text(encoding='utf-8').replace('export type { ButtonOptions }', 'export type { ButtonOptions, ButtonSkin, ButtonState }')
save('index.ts', s)
