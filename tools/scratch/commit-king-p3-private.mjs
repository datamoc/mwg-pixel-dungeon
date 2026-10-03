import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const base = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const preparedBase = readFileSync(join(root, 'tools', 'scratch', 'king-p3-base.txt'), 'utf8').trim();
if (preparedBase !== base) throw new Error(`HEAD moved since isolated files were prepared (${preparedBase} -> ${base}); regenerate before committing.`);
const env = { ...process.env, GIT_INDEX_FILE: join(root, 'tools', 'scratch', 'king-p3-private-index') };
const git = (args, options = {}) => {
	const result = spawnSync('git', args, { cwd: root, env, encoding: 'utf8', ...options });
	if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr || result.stdout}`);
	return result.stdout.trim();
};
git(['read-tree', base]);
const files = [
	'tools/parity/java/DwarfKingPhaseHarness.java',
	'tools/verifyKingPhase.mjs',
	'tools/parity/README.md',
	'coverage/rows-monsters-bosses-and-combat.md',
	'BACKLOG.md',
];
for (const path of files) {
	const blob = readFileSync(join(root, 'tools', 'scratch', 'king-p3-private-files', path));
	const oid = git(['hash-object', '-w', '--stdin'], { input: blob });
	git(['update-index', '--add', '--cacheinfo', `100644,${oid},${path}`]);
}
const tree = git(['write-tree']);
const commit = git(['commit-tree', tree, '-p', base, '-m', 'Trace Dwarf King phase-three entry']);
git(['update-ref', 'HEAD', commit, base]);
console.log(JSON.stringify({ base, commit, tree, files }, null, 2));
