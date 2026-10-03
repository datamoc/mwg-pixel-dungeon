"""Regenerate src/generated/spriteAnimations.ts from Java sprite classes at a tag.

Reads each `*Sprite.java` via `git show <tag>:<path>` from an SPD checkout,
so the table is always traceable to a real Java revision instead of a frozen
copy. Frame offsets (`c+N`, `N+c`, `ofs+N`) are normalised to the variant the
port models (base atlas offset zero), `zap = <clip>.clone()` aliases resolve
to the cloned clip's own values (that is what Java plays), and shifted or
nested films the port's uniform SpriteSheet cannot address are skipped loudly.

Port sheet packing (see `src/images.ts`): `gnoll.png` holds Java's row 0
(0-20) plus Java's row 2 (trickster, 42-62) at 21-41, and `crab.png` holds
row 0 (0-31) plus row 2 (great crab, 32-47) at 16-31 - both verified
pixel-identical against tag `v3.3.8`. The exile (Java 21-41) and hermit (Java
16-31) rows are appended after those at 42-62 and 32-47. FINAL_BASE records
each class's frame 0 on the port sheet; every other class reads Java indices
unchanged.

Excluded classes (each recorded so a newly-excluded class cannot slip by
silently): the three fungal sprites (no port mob or art yet), TormentedSpirit
(the 1/100 wraith-table roll is not ported), PhantomPiranha (explicitly
clip-less in `buildMonsterSprite`), Ward/Prismatic (variable-width films),
Char/Mob/Item/Missile/DiscardedItem (framework sprites, no mob clips), the
three crystal sprites (their colour-offset clips live in `crystalMine.ts`'s
`crystalClips`, which the verifier pins instead), and the three gnoll-mine
sprites (their base/statue clips live in `gnollMine.ts`'s `gnollClips`,
pinned the same way).

Keys already in the output file that extraction no longer produces (hand
added entries such as `ninjalog`, whose class is nested in SmokeBomb.java and
therefore outside the *Sprite.java glob) are carried over verbatim.
"""
from pathlib import Path
import argparse
import json
import re
import subprocess
import sys

CLIPS = ['idle', 'run', 'attack', 'die', 'zap', 'operate']

# Absolute port-sheet index of each class's frame 0. Extraction normalises
# Java frames to base (offsets stripped), then this re-bases them onto the
# port sheet. Dedicated sheets read Java indices unchanged (base 0); shared
# sheets keep Java's own offset when the port sheet is identical, and the
# packed/appended position when the port sheet packs rows (see module docstring).
# Cited per entry: Java's offset decl, then the port sheet fact.
FINAL_BASE = {
    # GnollTricksterSprite `int c = 42`; port gnoll.png packs Java row 2 at 21-41.
    'gnolltrickster': 21,
    # GnollExileSprite `int c = 21`; its row is appended at 42-62.
    'gnollexile': 42,
    # GreatCrabSprite `int c = 32`; port crab.png packs Java row 2 at 16-31.
    'greatcrab': 16,
    # HermitCrabSprite `int c = 16`; its row is appended at 32-47.
    'hermitcrab': 32,
    # CausticSlimeSprite `int c = 9`; port slime.png is byte-identical.
    'causticslime': 9,
    # DM201Sprite `int c = 12`; port dm200.png keeps Java's layout.
    'dm201': 12,
    # SpectralNecromancerSprite `int c = 16`; port necromancer.png is byte-identical.
    'spectralnecromancer': 16,
    # NewbornElementalSprite `ofs = 21`; port elemental.png is byte-identical.
    'newbornelemental': 21,
}

# Extra keys derived from an extracted key: (source key, frame delta).
# `MimicSprite.Crystal` is `texOffset()` 32 over the base set (tag `v3.3.8`).
EXTRA_KEYS = {'crystalmimic': ('mimic', 32)}

EXCLUDED = {
    'fungalcore': 'no port mob or art yet',
    'fungalsentry': 'no port mob or art yet (Java MINIBOSS)',
    'fungalspinner': 'no port mob or art yet',
    'tormentedspirit': 'the 1/100 wraith-table roll is not ported',
    'phantompiranha': 'explicitly clip-less in buildMonsterSprite',
    'ward': 'variable-width film, custom texture path',
    'prismatic': 'nested film the uniform sheet cannot address',
    'char': 'framework base sprite, no mob clips',
    'mob': 'framework base sprite, no mob clips',
    'item': 'framework sprite, no mob clips',
    'missile': 'framework sprite, no mob clips',
    'discardeditem': 'framework sprite, no mob clips',
    'crystalwisp': 'colour-offset clips live in crystalMine.ts crystalClips',
    'crystalguardian': 'colour-offset clips live in crystalMine.ts crystalClips',
    'crystalspire': 'colour-offset clips live in crystalMine.ts crystalClips',
    'gnollguard': 'base-variant clips live in gnollMine.ts gnollClips',
    'gnollsapper': 'base-variant clips live in gnollMine.ts gnollClips',
    'gnollgeomancer': 'statue/base clips live in gnollMine.ts gnollClips (rockArmor toggle)',
}


def show(checkout: Path, tag: str, ref_path: str) -> str:
    r = subprocess.run(['git', '-C', str(checkout), 'show', f'{tag}:{ref_path}'],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'cannot read {tag}:{ref_path} in {checkout}\n{r.stderr.strip()}')
    return r.stdout


def list_sprites(checkout: Path, tag: str, package: str) -> list[str]:
    r = subprocess.run(['git', '-C', str(checkout), 'ls-tree', '-r', '--name-only',
                        tag, package], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'cannot list {package} at {tag} in {checkout}\n{r.stderr.strip()}')
    return sorted(f.split('/')[-1][:-5] for f in r.stdout.split()
                  if f.endswith('Sprite.java'))


def extract(text: str, stem: str) -> dict:
    # The port models the base variant of each family: strip every symbolic
    # frame offset (`c+N`, `N+c`, `ofs+N`) back to base; FINAL_BASE re-bases
    # onto the port sheet afterwards.
    text = re.sub(r'\b[A-Za-z_]\w*\s*\+\s*(\d+)', r'\1', text)
    text = re.sub(r'\b(\d+)\s*\+\s*[A-Za-z_]\w*\b', r'\1', text)
    if stem == 'DM300Sprite':
        text = text.replace('enraged ? 15 : 10', '10')
    if stem == 'FistSprite':
        text = text.replace('Math.round(1 / SLAM_TIME)', '3')
    # A shifted or nested film cannot be addressed with the port's uniform SpriteSheet.
    if 'new TextureFilm( ' not in text or re.search(r'film\.add|frames\.add|new TextureFilm\(\s*\w+\s*,\s*\d+\s*,\s*\w+\s*,', text):
        return {}
    idle_var = re.search(r'\bidle\.frames\(\s*(\w+)\s*,', text)
    if not idle_var:
        return {}
    var = idle_var[1]
    anims: dict = {}
    for name in CLIPS:
        speed = re.search(r'\b' + name + r'\s*=\s*new (?:MovieClip\.)?Animation\(\s*(\d+)\s*,\s*(true|false)\s*\)', text)
        frames = re.search(r'\b' + name + r'\.frames\(\s*' + var + r'\s*,\s*([\d,\s]+)\)', text)
        if speed and frames:
            # Java 0-fps clips are static single frames (noosa tolerates 0); mwg's
            # `Animation` throws on fps <= 0 (R116), so floor at 1 - a single frozen
            # frame renders identically at any positive fps.
            anims[name] = {'fps': max(1, int(speed[1])), 'loop': speed[2] == 'true',
                           'frames': [int(n) for n in frames[1].split(',') if n.strip()]}
    # Aliases (`zap = attack.clone()`, and the reverse `attack = zap.clone()`)
    # resolve to the cloned clip's own values, whatever the direction: iterate
    # to a fixpoint so a target declared before its source still resolves.
    for _ in range(3):
        for alias in re.finditer(r'\b(idle|run|attack|die|zap|operate)\s*=\s*(idle|run|attack|die|zap|operate)\.clone\(\)', text):
            if alias[2] in anims:
                anims[alias[1]] = dict(anims[alias[2]])
                anims[alias[1]]['frames'] = list(anims[alias[2]]['frames'])
    return anims


def read_existing(out: Path) -> dict:
    if not out.exists():
        return {}
    src = out.read_text(encoding='utf-8')
    raw = src[src.index('= {') + 2:src.rindex('}') + 1]
    raw = re.sub(r'(?m)^\s*//.*$', '', raw)
    return json.loads(raw)


# Keys extraction cannot produce, carried over verbatim with their reason so
# regeneration never silently drops (or unexplains) them.
HAND_ADDED = {
    'ninjalog': 'SmokeBomb.NinjaLog is not an actors/mobs sprite class, so the *Sprite.java glob never sees it '
                '(NinjaLogSprite is nested in actors/hero/abilities/rogue/SmokeBomb.java). Frames are that class: '
                'idle.frames(frames, 0) on a 0-speed animation and die.frames(frames, 1, 2, 3, 4) at 12fps.',
    'spirithawk': 'SpiritHawk.HawkSprite is nested in actors/hero/abilities/huntress/SpiritHawk.java, outside the glob. '
                  'Every clip is that class, on a TextureFilm(15, 15): idle 6fps 0, 1; run 8fps 0, 1; '
                  'attack 12fps non-looping 2, 3, 0, 1; die 12fps non-looping 4, 5, 6.',
}

# Corrections to carried values, applied after carry-over: Java-exact values
# the old hand-add got slightly wrong. Each cites its source; the single-frame
# clips render identically at any fps, so these are record-keeping, not visual.
FIXUPS = {
    # NinjaLogSprite: `idle = new Animation( 0, true )` (static single frame); mwg's
    # `Animation` throws on fps <= 0 (R116), so this carries fps 1 like every other
    # Java 0-fps static - renders identically, never advances past frame 0.
    'ninjalog': {'idle': {'fps': 1, 'loop': True, 'frames': [0]}},
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--checkout', default=r'C:\Users\miche\dev\shattered-pixel-dungeon')
    ap.add_argument('--tag', default='v3.3.8')
    ap.add_argument('--out', default=None)
    args = ap.parse_args()
    checkout = Path(args.checkout)
    package = 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites'
    out = Path(args.out) if args.out else Path(__file__).resolve().parents[1] / 'src/generated/spriteAnimations.ts'

    clips: dict = {}
    skipped: list[str] = []
    for stem in list_sprites(checkout, args.tag, package):
        key = stem.removesuffix('Sprite').lower()
        if key in EXCLUDED:
            continue
        anims = extract(show(checkout, args.tag, f'{package}/{stem}.java'), stem)
        if 'idle' not in anims:
            skipped.append(stem)
            continue
        base = FINAL_BASE.get(key, 0)
        if base:
            for clip in anims.values():
                clip['frames'] = [f + base for f in clip['frames']]
        clips[key] = anims
    for source, (from_key, delta) in EXTRA_KEYS.items():
        if from_key in clips:
            clips[source] = {name: {'fps': clip['fps'], 'loop': clip['loop'],
                                    'frames': [f + delta for f in clip['frames']]}
                             for name, clip in clips[from_key].items()}
    carried: dict = {}
    for key, old in read_existing(out).items():
        if key not in clips and key.lower() not in EXCLUDED:
            clips[key] = old
            carried[key] = old
            if key in HAND_ADDED:
                print(f'carried over hand-added key: {key}')
            else:
                print(f'WARNING: unregistered key carried over, register it in HAND_ADDED: {key}')
    for key, fix in FIXUPS.items():
        if key in clips:
            for clip_name, clip_value in fix.items():
                clips[key][clip_name] = clip_value
            print(f'applied documented fixup: {key}')
    body = json.dumps(dict(sorted(clips.items())), indent=2)
    for key in sorted(carried):
        reason = HAND_ADDED.get(key, 'unregistered hand-add: move it into HAND_ADDED with its reason')
        body = body.replace(f'  "{key}": {{', f'  // Hand-added, not generated: {reason}\n  "{key}": {{', 1)
    out.write_text('/** Generated from Java sprite classes at tag `'
                   + args.tag + '` by tools/extract-sprite-animations.py. '
                   + 'Port sheet-packing deltas live in that script; keys it cannot produce '
                   + '(hand-added, e.g. `ninjalog`) are carried over verbatim - do not edit by hand. */\n'
                   + 'export const SPRITE_ANIMATIONS: Record<string, Record<string, { fps: number; loop: boolean; frames: number[] }>> = '
                   + body + ';\n',
                   encoding='utf-8')
    print(f'Extracted clips for {len(clips)} sprite classes at {args.tag}.')
    if skipped:
        print(f'skipped (no uniform idle film): {", ".join(skipped)}')


main()
