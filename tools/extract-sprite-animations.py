"""Extract Java character clips, including explicitly selected base atlas variants."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[2]
source = root / 'core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites'
clips = {}
for path in sorted(source.glob('*Sprite.java')):
    text = path.read_text()
    # The port models the red shaman, fire elemental, burning fist, and normal DM300.
    # Their base atlas offset is zero; other Java variants remain separate work.
    if path.stem in ['ShamanSprite', 'ElementalSprite', 'FistSprite', 'DM300Sprite']:
        text = re.sub(r'\bc\s*\+\s*(\d+)', r'\1', text)
    if path.stem == 'DM300Sprite':
        text = text.replace('enraged ? 15 : 10', '10')
    if path.stem == 'FistSprite':
        text = text.replace('Math.round(1 / SLAM_TIME)', '3')
    # A shifted or nested film cannot be addressed with the port's uniform SpriteSheet.
    if 'new TextureFilm( ' not in text or re.search(r'film\.add|frames\.add|new TextureFilm\(\s*\w+\s*,\s*\d+\s*,\s*\w+\s*,', text):
        continue
    animations = {}
    for name in ['idle', 'run', 'attack', 'die']:
        speed = re.search(r'\b' + name + r'\s*=\s*new (?:MovieClip\.)?Animation\(\s*(\d+)\s*,\s*(true|false)\s*\)', text)
        frames = re.search(r'\b' + name + r'\.frames\(\s*\w+\s*,\s*([\d,\s]+)\)', text)
        if speed and frames:
            animations[name] = {'fps': int(speed[1]), 'loop': speed[2] == 'true',
                                'frames': [int(n) for n in frames[1].split(',') if n.strip()]}
    if 'idle' in animations:
        clips[path.stem.removesuffix('Sprite').lower()] = animations
output = root / 'web-mwg/src/generated/spriteAnimations.ts'
output.write_text('/** Generated from Java sprite classes by tools/extract-sprite-animations.py. */\n'
    + 'export const SPRITE_ANIMATIONS: Record<string, Record<string, { fps: number; loop: boolean; frames: number[] }>> = '
    + json.dumps(clips, indent=2) + ';\n', encoding='utf-8')
print(f'Extracted literal clips for {len(clips)} sprite classes.')
