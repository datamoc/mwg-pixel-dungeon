// Amend cacc7bed to drop a peer's unstaged `cookingHpCount: this.cookingHpCount,`
// save-serialization line that leaked into the wand-seam commit's blob (the whole
// worktree file was hashed). HEAD is unpushed; the commit object is rebuilt with only
// its `tree` line replaced, so author/committer/message stay byte-exact, and the ref
// update is CAS-guarded against a concurrent peer commit.
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const path = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sh = (cmd, opts = {}) => execSync(cmd, { cwd: path, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024, ...opts });
const utf = (cmd, opts = {}) => sh(cmd, opts).toString('utf8');

const OLD = process.argv[2] || 'cacc7bed';

// 1. original commit object bytes
const orig = utf(`git cat-file commit ${OLD}`);
const nl = orig.indexOf('\n\n');
if (nl < 0) { console.error('FATAL: no message separator'); process.exit(1); }
const headers = orig.slice(0, nl);
const message = orig.slice(nl + 2);

// 2. that commit's blob for deathSaveRefresh
let blob = utf(`git show ${OLD}:src/scenes/dungeon/deathSaveRefresh.ts`);
const stray = '\t\t\tcookingHpCount: this.cookingHpCount,\n';
const count = blob.split(stray).length - 1;
if (count !== 1) { console.error(`FATAL: stray line count = ${count}`); process.exit(1); }
blob = blob.replace(stray, '');

// 3. new blob object (byte-exact utf8 in, raw git object out)
const blobSha = execSync('git hash-object -w --stdin', {
  cwd: path, input: Buffer.from(blob, 'utf8'), encoding: 'utf8',
}).trim();
console.log('new blob:', blobSha);

// 4. private index -> new tree
const idx = join(path, 'tools', 'scratch', 'amend-index');
if (existsSync(idx)) unlinkSync(idx);
const env = { ...process.env, GIT_INDEX_FILE: idx };
execSync('git read-tree HEAD', { cwd: path, env });
execSync(`git update-index --cacheinfo 100644,${blobSha},src/scenes/dungeon/deathSaveRefresh.ts`, { cwd: path, env });
const newTree = execSync('git write-tree', { cwd: path, env, encoding: 'utf8' }).trim();
console.log('new tree:', newTree);

// 5. new commit object = original bytes with only the tree line replaced
const newHeaders = headers.replace(/^tree [0-9a-f]{40}/m, `tree ${newTree}`);
if (newHeaders === headers) { console.error('FATAL: tree line not replaced'); process.exit(1); }
const newCommit = execSync('git hash-object -t commit -w --stdin', {
  cwd: path, input: Buffer.from(newHeaders + '\n\n' + message, 'utf8'), encoding: 'utf8',
}).trim();
console.log('new commit:', newCommit);

// 6. byte-verify headers + message round-trip
const check = utf(`git cat-file commit ${newCommit}`);
const cnl = check.indexOf('\n\n');
const okH = check.slice(0, cnl) === newHeaders;
const okM = check.slice(cnl + 2) === message;
console.log('headers byte-identical:', okH, '| message byte-identical:', okM);
if (!okH || !okM) { console.error('FATAL: round-trip mismatch'); process.exit(1); }

// 7. CAS update (fails loudly if a peer committed meanwhile)
try {
  execSync(`git update-ref HEAD ${newCommit} ${OLD}`, { cwd: path });
} catch {
  console.error('FATAL: CAS failed - HEAD moved during amend');
  process.exit(2);
}
try { unlinkSync(idx); } catch {}
console.log('HEAD now:\n' + utf('git log --oneline -2'));
console.log('deathSaveRefresh status: ' + utf('git status --porcelain -- src/scenes/dungeon/deathSaveRefresh.ts').trim());
