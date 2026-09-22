/**
 * Stamps the release version into Capacitor's generated Android project.
 *
 *   node tools/stamp-android-version.mjs --version v0.1.0 [--gradle android/app/build.gradle]
 *
 * `cap add android` writes `versionCode 1` / `versionName "1.0"` into `app/build.gradle` and never
 * touches them again, so without this step every APK this project ever publishes claims to be
 * version 1.0 - Android would also refuse to *update* an installed copy, since `versionCode` must
 * increase between releases.
 *
 * `versionCode` is derived from the tag's semver as `major * 10000 + minor * 100 + patch`, the
 * common scheme: monotonic for any increasing version, and an implied patch of 0 so `v1.2` and
 * `v1.2.0` agree. A pre-release suffix (`v1.2.0-beta`) sets the same code as its release - the
 * workflow creates a GitHub Release for whatever tag it is given, and Android's own versionCode
 * has no channel concept to carry the suffix into.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function arg(name, fallback) {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const tag = arg('version', null);
if (!tag) throw new Error('pass the release tag, e.g. --version v0.1.0');

const match = /^v?(\d+)\.(\d+)(?:\.(\d+))?/.exec(tag);
if (!match) throw new Error(`cannot read a version out of "${tag}" - expected something like v1.2.3`);

const [, major, minor, patch = '0'] = match;
const versionName = `${major}.${minor}.${patch}`;
const versionCode = Number(major) * 10000 + Number(minor) * 100 + Number(patch);

const gradle = resolve(root, arg('gradle', join('android', 'app', 'build.gradle')));
const source = await readFile(gradle, 'utf8');

const stamped = source
	.replace(/^(\s*versionCode\s+)\d+$/m, `$1${versionCode}`)
	.replace(/^(\s*versionName\s+)"[^"]*"$/m, `$1"${versionName}"`);

//Silent no-ops are the failure mode worth guarding: a scaffold change that renames these fields
//would otherwise ship an APK whose version is the default while the log claims otherwise.
if (stamped === source) throw new Error(`${gradle}: no versionCode/versionName line matched - check the generated scaffold`);
if (!stamped.includes(`versionCode ${versionCode}`) || !stamped.includes(`versionName "${versionName}"`)) {
	throw new Error(`${gradle}: rewrite did not take effect`);
}

await writeFile(gradle, stamped, 'utf8');
console.log(`${gradle.replace(root, '').replace(/\\/g, '/')}: versionName "${versionName}", versionCode ${versionCode} (from ${tag})`);
