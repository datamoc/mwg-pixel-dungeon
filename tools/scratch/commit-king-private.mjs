import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const base = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const index = join(root, 'tools', 'scratch', 'king-private-index');
const env = { ...process.env, GIT_INDEX_FILE: index };
const git = (args, options = {}) => {
	const result = spawnSync('git', args, { cwd: root, env, encoding: 'utf8', ...options });
	if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr || result.stdout}`);
	return result.stdout.trim();
};

git(['read-tree', base]);
const files = [
	'tools/parity/run-parity.mjs',
	'tools/parity/README.md',
	'tools/verifyKingPhase.mjs',
	'tools/parity/java/DwarfKingPhaseHarness.java',
	'tools/parity/java/DwarfKingPhaseHarnessLauncher.java',
	'BACKLOG.md',
	'coverage/rows-monsters-bosses-and-combat.md',
];
for (const path of files) {
	const content = readFileSync(join(root, 'tools', 'scratch', 'king-private-files', path));
	const oid = git(['hash-object', '-w', '--stdin'], { input: content });
	git(['update-index', '--add', '--cacheinfo', `100644,${oid},${path}`]);
}
const tree = git(['write-tree']);
const commit = git(['commit-tree', tree, '-p', base, '-m', 'Add Dwarf King phase parity trace']);
git(['update-ref', 'HEAD', commit, base]);
console.log(JSON.stringify({ base, commit, tree, files }, null, 2));
