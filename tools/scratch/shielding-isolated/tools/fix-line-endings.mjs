// Normalize line endings of worktree files without touching their content.
//
// PowerShell's output redirection and `Add-Content` silently rewrite LF to
// CRLF in the worktree (and `git show` captures lose CRs entirely), which
// makes ending drift invisible until a diff explodes. This script works on
// raw bytes so what it reports is what is on disk. Note this repo has no
// .gitattributes and `core.autocrlf=true`, so `git hash-object -w` and commit
// already normalize blobs to LF: this script governs worktree uniformity
// (what editors and reviewers see), not the object store.
//
// Usage: node tools/fix-line-endings.mjs [--to lf|crlf|head] <file...>
//   --to lf    convert every line to LF
//   --to crlf  convert every line to CRLF
//   --to head  (default) match the dominant ending of the file's HEAD blob;
//              new (untracked or unborn-HEAD) files default to LF
//
// A file already uniform in the target style is left untouched (mtime kept).
// The presence or absence of a trailing newline is preserved. Files containing
// a NUL byte are skipped as binary. Exits 1 if any file was rewritten, 0 if
// everything was already uniform; exits 2 on usage/IO errors.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
let mode = 'head';
const files = [];
for (let i = 0; i < args.length; i++) {
	const a = args[i];
	if (a === '--to' && i + 1 < args.length) {
		mode = args[++i];
	} else if (a.startsWith('--to=')) {
		mode = a.slice('--to='.length);
	} else {
		files.push(a);
	}
}
if (mode !== 'lf' && mode !== 'crlf' && mode !== 'head') {
	console.error(`unknown --to style: ${mode} (want lf|crlf|head)`);
	process.exit(2);
}
if (files.length === 0) {
	console.error('usage: node tools/fix-line-endings.mjs [--to lf|crlf|head] <file...>');
	process.exit(2);
}

function headStyle(path) {
	try {
		const blob = execFileSync('git', ['show', `HEAD:${path}`], { maxBuffer: 64 * 1024 * 1024 });
		let crlf = 0, lf = 0;
		for (let i = 0; i < blob.length; i++) {
			if (blob[i] === 10) {
				if (i > 0 && blob[i - 1] === 13) crlf++;
				else lf++;
			}
		}
		if (crlf === 0 && lf === 0) return null;
		return crlf >= lf ? 'crlf' : 'lf';
	} catch {
		return null;
	}
}

let rewritten = 0;
for (const path of files) {
	if (!existsSync(path)) {
		console.error(`missing: ${path}`);
		process.exit(2);
	}
	const raw = readFileSync(path);
	if (raw.includes(0)) {
		console.log(`skip (binary): ${path}`);
		continue;
	}
	let target = mode;
	if (mode === 'head') target = headStyle(path) ?? 'lf';
	const eol = target === 'crlf' ? '\r\n' : '\n';
	const text = raw.toString('utf8');
	const trailing = text.endsWith('\n');
	const lines = text.split(/\r\n|\r|\n/);
	if (trailing) lines.pop();
	const out = lines.join(eol) + (trailing ? eol : '');
	const before = { crlf: (text.match(/\r\n/g) ?? []).length, lf: (text.match(/(?<!\r)\n/g) ?? []).length };
	if (out === text) {
		console.log(`uniform (${target}): ${path} (crlf=${before.crlf} lf=${before.lf})`);
		continue;
	}
	writeFileSync(path, out, 'utf8');
	const after = { crlf: (out.match(/\r\n/g) ?? []).length, lf: (out.match(/(?<!\r)\n/g) ?? []).length };
	console.log(`rewrote: ${path} ${before.crlf}xcrlf+${before.lf}xlf -> ${after.crlf}xcrlf+${after.lf}xlf (${target})`);
	rewritten++;
}
process.exit(rewritten > 0 ? 1 : 0);
