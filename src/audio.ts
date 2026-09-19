import { Audio } from 'mwg';
import { isMusicMuted, isSfxMuted, setMusicMuted as persistMusicMuted, setSfxMuted as persistSfxMuted } from './settings';

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
	private musicOff = isMusicMuted();
	private sfxOff = isSfxMuted();
	/** The last music request, so unmuting resumes what should be playing - Java's
	 * `SPDSettings.music(true)` only re-enables future playback, but leaving a freshly
	 * unmuted game silent until the next region change reads as broken, so this replays.
	 * Deliberate improvement, recorded in `PORT_COVERAGE.md`. */
	private lastMusic: { tracks: string[]; fade: number } | null = null;

	isMusicMuted(): boolean {
		return this.musicOff;
	}

	/**
	 * `SPDSettings.music(value)`: `Music.INSTANCE.enable(value)` stops the music when
	 * muted and persists the flag; unmuting additionally replays the last request (see
	 * `lastMusic`), where Java waits for the next scene to start something.
	 */
	setMusicMuted(muted: boolean): void {
		persistMusicMuted(muted);
		this.musicOff = muted;
		if (muted) {
			this.currentTrack = null;
			this.music.stop(1);
		} else if (this.lastMusic) {
			this.currentTrack = null;
			this.playMusicTracks(this.lastMusic.tracks, this.lastMusic.fade);
		}
	}

	isSfxMuted(): boolean {
		return this.sfxOff;
	}

	/** `SPDSettings.soundFx(value)`: persists the flag and gates `cue()`; muting also
	 * silences already-playing one-shots via each cached pool's `stopAll()`. */
	setSfxMuted(muted: boolean): void {
		persistSfxMuted(muted);
		this.sfxOff = muted;
		if (muted) this.cues.forEach((sound) => sound.stopAll());
	}

	/**
	 * The `AudioSuspendRig` half of mwg 0.15.0's auto-pause on page hide (`Game` item 365):
	 * suspend parks the music mid-track and freezes cue playback; resume restarts them where
	 * they paused. Muted stays muted throughout - suspend/resume never touch `musicOff`/
	 * `sfxOff`, and a stopped-while-muted track has nothing suspended to resume.
	 */
	suspend(): void {
		this.music.suspend();
		this.cues.forEach((sound) => sound.suspend());
	}

	/** Counterpart to `suspend` above; only resumes what suspension parked. */
	resume(): void {
		this.music.resume();
		this.cues.forEach((sound) => sound.resume());
	}

	/** Browser autoplay rules defer audible playback until this runs in a player gesture. */
	startTitle(): void {
		this.playMusicTracks(['theme_1.ogg', 'theme_2.ogg'], 0);
	}

	enterDungeon(region: AudioRegion, boss: boolean): void {
		if (boss) this.playMusic(`${region}_boss.ogg`, 1);
		else this.playMusicTracks([`${region}_1.ogg`, `${region}_2.ogg`], 1);
	}

	/** `LastLevel.playLevelMusic()`: the endgame vault plays `THEME_FINALE` on loop while the
	 * Amulet is still in it, and only goes silent once the Amulet has been taken (`Music.end()`).
	 * This port used to stop the music on entry, which is Java's *second* branch applied to the
	 * first - the vault was silent even with the prize still on the floor. */
	vaultMusic(amuletObtained: boolean): void {
		if (amuletObtained) {
			//Java's `Music.end()`: silence that unmuting must not resurrect, so the
			//standing replay request goes with it.
			this.lastMusic = null;
			this.currentTrack = null;
			if (!this.musicOff) this.music.stop(1);
		} else {
			this.playMusic('theme_finale.ogg', 1);
		}
	}

	/** `AmuletScene.create()`'s own pair - `THEME_2` then `THEME_1`, the reverse of the title
	 * screen's `THEME_1`/`THEME_2` order, both played by the same `playTracks`. */
	winMusic(): void {
		this.playMusicTracks(['theme_2.ogg', 'theme_1.ogg'], 1);
	}

	/**
	 * `pitch` is Java's per-playback `Sample.play(id, volume, pitch)` rate, passed through to
	 * `mwg`'s `Sound.play(gain, pitch)` (its `pitch` parameter landed in MWG 0.12.0 and maps to
	 * `HTMLAudioElement.playbackRate`). Java varies it per call site rather than per clip, so each
	 * caller passes its own Java site's value; `1` is Java's own default for the plain
	 * `play(id)`/`play(id, volume)` overloads. Java's sibling `play(id, leftVolume, rightVolume,
	 * pitch)` stereo form stays unported - `mwg` documents that a plain `<audio>` element has no
	 * pan to set, the same call `Positional.audioPan` made.
	 */
	cue(name: string, volume = 0.7, pitch = 1): void {
		if (this.sfxOff) return;
		let sound = this.cues.get(name);
		if (!sound) {
			sound = new Audio.Sound(asset('sounds', `${name}.mp3`), { poolSize: name === 'step' ? 6 : 4, volume });
			this.cues.set(name, sound);
		}
		sound.play(1, pitch);
	}

	update(dt: number): void {
		this.music.update(dt);
	}

	private playMusic(track: string, fade: number): void {
		this.lastMusic = { tracks: [track], fade };
		if (this.currentTrack === track) return;
		this.currentTrack = track;
		if (!this.musicOff) this.music.play(asset('music', track), fade);
	}

	/** `Music.playTracks` mirrors SPD's non-looping `playTracks`: normal regions alternate
	 * their two ambient tracks rather than looping the shorter first one indefinitely. */
	private playMusicTracks(tracks: readonly string[], fade: number): void {
		this.lastMusic = { tracks: [...tracks], fade };
		const key = tracks.join('|');
		if (this.currentTrack === key) return;
		this.currentTrack = key;
		if (!this.musicOff) this.music.playTracks(tracks.map(track => asset('music', track)), fade);
	}
}
