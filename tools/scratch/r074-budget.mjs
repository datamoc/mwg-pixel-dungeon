// Compare budget vs HEAD vs worktree line counts for over-budget files.
import fs from 'fs';
import { execSync } from 'child_process';

const budgets = JSON.parse(fs.readFileSync('tools/file-budgets.json', 'utf8'));
console.log('file | budget | head | worktree');
for (const [file, budget] of Object.entries(budgets)) {
	const wt = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
	let head = -1;
	try {
		head = execSync('git show HEAD:' + file, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split(/\r?\n/).length;
	} catch {
		head = NaN;
	}
	const mark = wt > budget || head > budget ? ' <<<' : '';
	console.log(file.replace('src/', '') + ' | ' + budget + ' | ' + head + ' | ' + wt + mark);
}
