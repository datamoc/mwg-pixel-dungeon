import { Audio } from 'mwg';

/**
 * SPD's original OGG/MP3 assets, bundled as data URLs so the exported game still works from
 * `file://`. `mwg/audio` owns playback, pooling and music crossfades; this class is only the
 * game's small semantic map from dungeon events to those primitives.
 */
const ASSETS = import.meta.glob('./assets/audio/**/*.{ogg,mp3}', {
	eager: true,
	query: '?url',
	import: 'default',
}) as Record<string, string>;

function asset(folder: 'music' | 'sounds', name: string): string {
	const suffix = `/audio/${folder}/${name}`;
	const found = Object.entries(ASSETS).find(([path]) => path.endsWith(suffix))?.[1];
	if (!found) throw new Error(`Missing bundled SPD audio asset: ${folder}/${name}`);
	return found;
}

export type AudioRegion = 'sewers' | 'prison' | 'caves' | 'city' | 'halls';

export class SpdAudio {
	private readonly music = new Audio.Music({ volume: 0.42 });
	private readonly cues = new Map<string, Audio.Sound>();
	private currentTrack: string | null = null;

	/** Browser autoplay rules defer audible playback until this runs in a player gesture. */
	startTitle(): void {
		this.playMusicTracks(['theme_1.ogg', 'theme_2.ogg'], 0);
	}

	enterDungeon(region: AudioRegion, boss: boolean): void {
		if (boss) this.playMusic(`${region}_boss.ogg`, 1);
		else this.playMusicTracks([`${region}_1.ogg`, `${region}_2.ogg`], 1);
	}

	/** LastLevel.playLevelMusic(): the Java endgame vault is intentionally silent. */
	endDungeon(): void {
		this.currentTrack = null;
		this.music.stop(1);
	}

	cue(name: string, volume = 0.7): void {
		let sound = this.cues.get(name);
		if (!sound) {
			sound = new Audio.Sound(asset('sounds', `${name}.mp3`), { poolSize: name === 'step' ? 6 : 4, volume });
			this.cues.set(name, sound);
		}
		sound.play();
	}

	update(dt: number): void {
		this.music.update(dt);
	}

	private playMusic(track: string, fade: number): void {
		if (this.currentTrack === track) return;
		this.currentTrack = track;
		this.music.play(asset('music', track), fade);
	}

	/** `Music.playTracks` mirrors SPD's non-looping `playTracks`: normal regions alternate
	 * their two ambient tracks rather than looping the shorter first one indefinitely. */
	private playMusicTracks(tracks: readonly string[], fade: number): void {
		const key = tracks.join('|');
		if (this.currentTrack === key) return;
		this.currentTrack = key;
		this.music.playTracks(tracks.map(track => asset('music', track)), fade);
	}
}
