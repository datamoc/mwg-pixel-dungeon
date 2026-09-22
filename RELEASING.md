# Releasing

Every release target this project can build, and how to cut one. The workflow is
`.github/workflows/release.yml`; the packaging scripts are `tools/pack-web.mjs` and
`tools/pack-desktop.mjs`.

## Cutting a release

```sh
git tag v0.1.0
git push origin v0.1.0
```

That is the whole trigger: the `Release` workflow runs on any `v*` tag and nothing else. An
ordinary push to `main` still only deploys the web build to GitHub Pages (`deploy.yml`), because
the Android and desktop jobs are minutes long and produce hundreds of megabytes.

The tag first has to pass **verify** - `npm run verify`, i.e. the MWL compile, `tsc --noEmit`, the
i18n check, the simulation/item/Lua/mwg suites and the build, the same bar `CLAUDE.md` sets. A tag
that fails it produces no artifacts at all; the three packaging jobs `needs:` it. Re-running the
workflow for an existing tag replaces that release's assets rather than failing.

## What a release contains

| Asset | What it is |
| --- | --- |
| `spd-on-mwg-<tag>-standalone.html` | The whole game in one file: every script inlined and gzipped, unpacked in the browser at load. The artifact to hand someone, and the only one that works from an email attachment or a USB stick. |
| `spd-on-mwg-<tag>-standalone-brotli.html` | The same with brotli - smaller, narrower reach (see the note below). |
| `spd-on-mwg-<tag>-web-selfhost.zip` | The ordinary multi-file build (`index.html` + `game.js`) plus `.gz`/`.br` siblings of both, for a host that can negotiate `Content-Encoding`. GitHub Pages already compresses its own responses, so this is for self-hosting. |
| `spd-on-mwg-<tag>-debug.apk` | Android, debug-signed - sideloadable on a device or emulator. |
| `spd-on-mwg-<tag>-desktop.zip` | The Windows application: a self-contained .NET WebView2 host with the game in a `web` folder beside its executable. Unzip and run `MwgDesktopHost.exe`. |

All compression in the web artifacts is `mwg`'s own tooling (`single-file`, `compress-dist`); the
archives for self-hosting and desktop are made by the runner's native archiver. This repository
implements no archive format.

## Building each target locally

```sh
npm run build && npm run release:web        # web artifacts into release/
npm run build && npm run release:desktop    # desktop build into release/desktop/ (Windows, .NET 8 SDK)

npm run build                               # Android, in order:
npm run android:add                         # once - generates android/ (gitignored, see below)
npm run android:version -- --version v0.1.0 # stamps the tag into the APK's version
npm run android:sync                        # copies dist/ into the Android project
npm run android:apk                         # gradle assembleDebug
```

On Windows the last one is `cd android; .\gradlew.bat assembleDebug`. A local Android build needs
a JDK (17+) and an Android SDK with platform 35 (`ANDROID_HOME`/`ANDROID_SDK_ROOT` set); the
workflow's `android` job installs both. The desktop build needs the .NET 8 SDK and Windows.

The version step is not optional for a release: `cap add android` writes `versionCode 1` /
`versionName "1.0"` into the generated `app/build.gradle` and never revises them, so without it
every APK this project publishes claims to be 1.0 - and Android refuses to update an installed app
whose `versionCode` has not increased. `tools/stamp-android-version.mjs` derives both from the tag.

## Notes and limits

- **Android is debug-signed.** `app-debug.apk` installs by sideloading, which is as far as a build
  without a keystore goes. Publishing to Play needs a keystore and a `signingConfigs` block in the
  generated project - since `android/` is regenerated (below), that means a patch step in the
  workflow applied after `cap add android`, with the keystore from repository secrets. Not
  implemented: there is no keystore in this project to verify it against.
- **`android/` is regenerated, not committed** (`.gitignore`). This project does not customise the
  Capacitor scaffold, so regenerating keeps ~50 generated files out of the repository. If the
  platform itself ever needs changing, that change becomes a tracked patch applied after
  `cap add android` - the same reasoning `mwg` itself used when it started tracking its own
  `android/`.
- **The desktop host is this repository's own** (`desktop/MwgDesktopHost`). `mwg` documents desktop
  and mobile packaging, but its published package ships none of that scaffolding, so a host had to
  be written here; the framework-side gap is recorded as P18 in `4MWG/IMPROVEMENT_PROPOSALS.md`
  (local notes, not committed). If a future `mwg` release ships a host or a template, this
  directory is what it replaces.
- **The desktop app needs the WebView2 Evergreen Runtime**, which ships with Windows 11 and current
  Windows 10; the .NET runtime itself is bundled, so nothing else has to be installed.
- **`standalone-brotli.html` has narrower reach**: `mwg` 0.11.0 records a real Chrome throwing for
  `DecompressionStream('br')`, which is why gzip is the default artifact and this one is extra.
- **iOS is not built.** Capacitor can generate the project (`npx cap add ios`), but building an
  installable IPA needs a macOS runner with Xcode and signing certificates/provisioning profiles -
  none of which exist here. The `android` job is the template if that changes.
- **`capacitor.config.json` carries an app ID** (`io.github.datamoc.mwgpixeldungeon`) and the app
  name. Both are identity, not build settings: they should be reviewed before anything is published
  to a store, and changing the app ID after a release makes it a different app to Android.
