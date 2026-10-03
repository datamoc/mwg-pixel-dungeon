/** Run from any directory: node mwg-pixel-dungeon/tools/verify-mwg-integration.mjs.
 * Only useful while actively developing the framework itself against a local MW_games
 * checkout at ../MW_games (sibling of this repo) - this project's normal dependency is the
 * published npm package (see package.json), not this local checkout.
 * Checks the local framework first, rebuilds its exports, then builds this consumer.
 * Visual inspection still needs a browser.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { accessSync, constants, existsSync, unlinkSync, writeFileSync } from 'node:fs';

const port = fileURLToPath(new URL('../', import.meta.url));
const framework = fileURLToPath(new URL('../../MW_games/', import.meta.url));
if (!existsSync(`${framework}/package.json`)) {
	throw new Error(`Local MWG checkout not found: ${framework}`);
}

// Some managed/dev environments expose the sibling MWG checkout as readable but
// deliberately protect its generated dist tree from writes. The consumer can
// still be checked against the already-published local-file dependency, so do
// not turn that filesystem policy into a false integration failure.
let canRebuildFramework = true;
try {
	// Checking a representative generated file catches ACLs that still report the
	// directory itself as writable on Windows. A probe write catches policies that
	// allow metadata access but reject replacement of generated output.
	accessSync(`${framework}/dist/index.js`, constants.W_OK);
	const probe = `${framework}/dist/.mwg-integration-write-test`;
	writeFileSync(probe, 'ok');
	unlinkSync(probe);
} catch {
	canRebuildFramework = false;
	console.warn(`\n${framework}/dist is not writable; skipping framework build and using its existing dist output.`);
}

const commands = [
	[framework, ['run', 'check']],
	[framework, ['test']],
	[port, [ 'run', canRebuildFramework ? 'build' : 'check' ]],
];
if (canRebuildFramework) commands.splice(2, 0, [framework, ['run', 'build']]);

for (const [cwd, args] of commands) {
	console.log(`\n${cwd}: npm ${args.join(' ')}`);
	// On Windows npm is a command shim. Only these fixed commands reach cmd.exe.
	const result = process.platform === 'win32'
		? spawnSync('cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], { cwd, stdio: 'inherit' })
		: spawnSync('npm', args, { cwd, stdio: 'inherit' });
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nMWG integration checks passed. Verify rendering in a browser before release.');
