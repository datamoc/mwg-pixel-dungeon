import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repo = process.cwd();
const gitEnv = {
	...process.env,
	GIT_CONFIG_COUNT: '1',
	GIT_CONFIG_KEY_0: 'safe.directory',
	GIT_CONFIG_VALUE_0: repo.replaceAll('\\', '/'),
};
const git = (args, input) => execFileSync('git', args, { cwd: repo, env: gitEnv, input, stdio: input ? ['pipe', 'pipe', 'inherit'] : 'pipe' });
const head = git(['rev-parse', 'HEAD']).toString().trim();
const readHead = (path) => git(['show', `HEAD:${path}`]).toString('utf8');
const eol = (text) => text.includes('\r\n') ? '\r\n' : '\n';
const replaceLine = (text, id, replacement) => {
	const re = new RegExp(`^- \\[ \\] \\*\\*${id}\\*\\*.*(\\r?)$`, 'm');
	if (!re.test(text)) throw new Error(`missing open ${id} roadmap line`);
	return text.replace(re, `${replacement}$1`);
};
const line = '- [x] **R002** _(PowerOfMany Barrier on direct environmental damage (`Char.damage()`, tag `v3.3.8`))_ **Closed 2026-10-01:** actor DoTs, environmental blobs, direct traps and their hero/mob halves all reach the shared damage dispatch, whose non-hero tail applies priority-ordered DivineShield/PowerOfMany pools before HP. The dispatch and shield ordering are pinned by `test:simulation`; the matching coverage row records the migrated sources. Attack-specific interleavings remain under R001.';

const roadmap = replaceLine(readHead('ROADMAP.md'), 'R002', line);
const coveragePath = 'coverage/rows-monsters-bosses-and-combat.md';
const coverage = readHead(coveragePath);
const old = 'so only the trap hero halves still call `absorbHeroDamage` directly (R002 residual).';
const updated = 'the hero trap halves later joined the same dispatch in T63 batch 5 (2026-09-29), so environmental gas/blob, trap, and actor-turn sources now drain the appropriate Barrier/DivineShield pools before HP. The scene dispatch and shield-pool ordering are pinned by `test:simulation`.';
if (!coverage.includes(old)) throw new Error('missing old R002 coverage tail');
const nextCoverage = coverage.replace(old, updated);
const closedPath = 'CLOSED.md';
const closed = readHead(closedPath);
const heading = '## Closed open-coverage items (moved from ROADMAP.md)';
if (!closed.includes(heading)) throw new Error('missing CLOSED register heading');
const sep = eol(closed);
const nextClosed = closed.replace(/[\r\n]*$/, '') + sep + line + sep;

const index = join(tmpdir(), `mwg-r002-${randomUUID()}.index`);
const env = { ...gitEnv, GIT_INDEX_FILE: index };
execFileSync('git', ['read-tree', head], { cwd: repo, env, stdio: 'inherit' });
for (const [path, text] of [
	['ROADMAP.md', roadmap],
	[coveragePath, nextCoverage],
	[closedPath, nextClosed],
]) {
	const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd: repo, env, input: Buffer.from(text, 'utf8') }).toString().trim();
	execFileSync('git', ['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`], { cwd: repo, env, stdio: 'inherit' });
}
const tree = execFileSync('git', ['write-tree'], { cwd: repo, env }).toString().trim();
const commit = execFileSync('git', ['commit-tree', tree, '-p', head, '-m', 'Close environmental Barrier damage residual'], { cwd: repo, env, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
execFileSync('git', ['update-ref', 'HEAD', commit, head], { cwd: repo, env, stdio: 'inherit' });
console.log(commit);
