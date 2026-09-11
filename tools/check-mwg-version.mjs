#!/usr/bin/env node
/**
 * What `@datamoc/mw_games` versions this project can see: the pin in `package.json`, what is
 * actually installed, what npm publishes as latest, and - when a checkout is pointed at - what
 * that checkout is working towards.
 *
 * The point is a cadence, not a build step: this project pins `mwg` deliberately and adopts a new
 * release as its own verified change (see AGENTS.md), so the useful question is "has a release
 * landed that we have not taken yet?", asked once per hour while porting rather than on every
 * build. Network access is therefore this script's whole job and it stays out of `npm run check`,
 * `build` and the test suites, all of which must keep working offline.
 *
 * Usage:
 *   node tools/check-mwg-version.mjs [--checkout <path>] [--fail-on-update]
 *
 * Exits 0 when the pin is current (or when npm cannot be reached, since "unknown" is not
 * "outdated"); with `--fail-on-update`, exits 1 when a newer version than the pin is published, so
 * a scheduler or a script can act on it.
 */
import { readFileSync } from 'node:fs';
import { execFileSync, execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const PACKAGE = '@datamoc/mw_games';

const args = process.argv.slice(2);
const checkoutIndex = args.indexOf('--checkout');
const checkout = checkoutIndex >= 0 ? resolve(args[checkoutIndex + 1] ?? '') : null;
const failOnUpdate = args.includes('--fail-on-update');

/** the pin, as written - the dependency is aliased to `mwg` so every import reads `from 'mwg'` */
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const pin = manifest.dependencies?.mwg ?? '(not a dependency)';
const pinnedRange = pin.startsWith(`npm:${PACKAGE}@`) ? pin.slice(`npm:${PACKAGE}@`.length) : pin;

function installedVersion() {
	try {
		return JSON.parse(readFileSync(join(root, 'node_modules', 'mwg', 'package.json'), 'utf8')).version;
	} catch {
		return '(not installed - run npm install)';
	}
}

function checkoutVersion() {
	if (!checkout) return null;
	try {
		return JSON.parse(readFileSync(join(checkout, 'package.json'), 'utf8')).version;
	} catch {
		return '(no package.json at ' + checkout + ')';
	}
}

/**
 * The published latest version, or null when it cannot be read.
 *
 * Two routes on purpose. `npm view` first, because it is npm's own client and so honours whatever
 * registry and auth the user has configured, exactly as an install would. It needs a shell here:
 * on Windows npm is a `.cmd`, and Node refuses to spawn `.cmd`/`.bat` without one (the 2024
 * `spawn` hardening), which is an `spawnSync EINVAL` rather than anything to do with the network.
 * The plain registry fetch is the fallback for a machine with no npm on PATH.
 */
function publishedLatest() {
	try {
		//one command string through a shell rather than an argument array with `shell: true`,
		//which Node deprecates (DEP0190): nothing here is caller-supplied, the package name is this
		//file's own constant
		return execSync(`npm view ${PACKAGE} version`, {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
	} catch {
		//fall through to the registry
	}
	try {
		return execFileSync(process.execPath, ['-e', `
			fetch('https://registry.npmjs.org/${PACKAGE.replace('/', '%2f')}/latest')
				.then((r) => r.json())
				.then((d) => process.stdout.write(String(d.version)))
				.catch(() => process.exit(1));
		`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return null;
	}
}

/** compares dotted numeric versions; `^0.7.2` counts as 0.7.2 for "is something newer published" */
function numeric(version) {
	const match = /(\d+)\.(\d+)\.(\d+)/.exec(version ?? '');
	return match ? match.slice(1).map(Number) : null;
}

function isNewer(candidate, than) {
	const [a, b] = [numeric(candidate), numeric(than)];
	if (!a || !b) return false;
	for (let i = 0; i < 3; i++) {
		if (a[i] !== b[i]) return a[i] > b[i];
	}
	return false;
}

const latest = publishedLatest();
const lines = [
	`pin (package.json)   ${pin}`,
	`installed (node_modules) ${installedVersion()}`,
	`published (npm latest)   ${latest ?? '(unreachable - offline, or npm not on PATH)'}`,
];
if (checkout) lines.push(`local checkout           ${checkoutVersion()}  (${checkout})`);

console.log(lines.join('\n'));

if (!latest) {
	console.log('\nNothing to report: the published version could not be read.');
	process.exit(0);
}

if (isNewer(latest, pinnedRange)) {
	console.log(`\nUPDATE AVAILABLE: npm has ${latest}, this project pins ${pinnedRange}.`);
	console.log('Bump deliberately and re-run the whole verification suite (see AGENTS.md), rather than npm-updating as a side effect.');
	process.exit(failOnUpdate ? 1 : 0);
}

console.log(`\nUp to date: the pin (${pinnedRange}) covers the published latest (${latest}).`);
