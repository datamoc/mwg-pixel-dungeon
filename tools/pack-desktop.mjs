/**
 * Packages the built web game as a Windows desktop application.
 *
 *   node tools/pack-desktop.mjs [--dist dist] [--out release/desktop]
 *
 * Publishes `desktop/MwgDesktopHost` self-contained for `win-x64`, then copies the built `dist/`
 * into a `web` folder beside the executable - which is where the host looks for the game, and the
 * only thing it needs beyond its own binary.
 *
 * Self-contained rather than framework-dependent: a game download that then tells the player to
 * install a .NET runtime is a worse artifact than one 150 MB folder, and WebView2 itself is already
 * a system component (the Evergreen Runtime ships with Windows 11 and current Windows 10). The
 * folder is what the release workflow zips with the runner's own archiver - no archive format is
 * implemented in this repository.
 *
 * Run it from Windows with the .NET SDK installed; the workflow's desktop job is a `windows-latest`
 * runner for that reason.
 */
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function arg(name, fallback) {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const dist = resolve(root, arg('dist', 'dist'));
const out = resolve(root, arg('out', join('release', 'desktop')));
const project = join(root, 'desktop', 'MwgDesktopHost');

for (const required of ['index.html', 'game.js']) {
	const info = await stat(join(dist, required)).catch(() => null);
	if (!info) throw new Error(`${join(dist, required)} is missing - run \`npm run build\` first`);
}

//A stale publish from an earlier tag must never be shipped as this one's.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const { stdout } = await run('dotnet', [
	'publish', project,
	'-c', 'Release',
	'-r', 'win-x64',
	'--self-contained', 'true',
	'-o', out,
], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
//MSB3277 is the WebView2 package's own WindowsBase unification notice on every WinForms build;
//anything else dotnet reports is worth seeing in the release log.
const warnings = stdout.split('\n').filter(line => line.includes('warning') && !line.includes('MSB3277'));
if (warnings.length) console.log(warnings.join('\n'));

await cp(dist, join(out, 'web'), { recursive: true });

const size = await run('powershell', ['-NoProfile', '-Command', `(Get-ChildItem -Recurse '${out}' | Measure-Object -Property Length -Sum).Sum`]);
const bytes = Number(size.stdout.trim());
console.log(`desktop build in ${relative(root, out)}/ - ${(bytes / 1024 / 1024).toFixed(1)} MB, game copied to web/`);
