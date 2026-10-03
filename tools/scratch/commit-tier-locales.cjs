const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const git = (args, options = {}) => execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
const stateFile = 'tools/scratch/tier-commit-state.json';
if (process.argv[2] === 'prepare') {
	const head = git(['rev-parse', 'HEAD']);
	const index = path.resolve(`tools/scratch/tier-${Date.now()}.idx`);
	const env = { ...process.env, GIT_INDEX_FILE: index };
	git(['read-tree', head], { env });
	let source = execFileSync('git', ['show', `${head}:src/i18n/portStrings.ts`], { encoding: 'utf8' });
	const work = fs.readFileSync('src/i18n/portStrings.ts', 'utf8');
	for (const locale of ['DE','ES','PT','IT','PL','RU','TR','UK','HU','NL','IN','JA','CS','VI','EL','KO','ZH']) {
		const start = source.indexOf(`export const PORT_STRINGS_${locale}:`);
		const end = source.indexOf('\n};', start);
		const block = source.slice(start, end);
		if (start < 0 || end < 0 || block.includes('port.item.wealth_drop_tier')) throw Error(`Unexpected HEAD catalog: ${locale}`);
		const workStart = work.indexOf(`export const PORT_STRINGS_${locale}:`);
		const workBlock = work.slice(workStart, work.indexOf('\n};', workStart));
		const entry = workBlock.match(/\t\/\/ MT: tier label added 2026-10-01; unreviewed\.\r?\n\t'port\.item\.wealth_drop_tier': '[^']+',\r?\n/)[0].replace(/\r\n/g, '\n');
		const anchor = "\t'port.blacksmith.upgrade':";
		if (!block.includes(anchor)) throw Error(`Missing anchor: ${locale}`);
		source = source.slice(0, start) + block.replace(anchor, entry + anchor) + source.slice(end);
	}
	let coverage = execFileSync('git', ['show', `${head}:PORT_COVERAGE_I18N.md`], { encoding: 'utf8' });
	const newRow = fs.readFileSync('PORT_COVERAGE_I18N.md', 'utf8').split(/\r?\n/).find(line => line.startsWith('| Ring of Wealth bonus drop tier'));
	const oldRow = coverage.split(/\r?\n/).find(line => line.startsWith('| Ring of Wealth bonus drop tier'));
	if (!oldRow || !newRow) throw Error('Missing coverage row');
	coverage = coverage.replace(oldRow, newRow);
	for (const [file, text] of [['src/i18n/portStrings.ts', source], ['PORT_COVERAGE_I18N.md', coverage]]) {
		const blob = git(['hash-object', '-w', '--stdin'], { input: text });
		git(['update-index', '--add', '--cacheinfo', `100644,${blob},${file}`], { env });
	}
	const tree = git(['write-tree'], { env });
	fs.writeFileSync(stateFile, JSON.stringify({ head, index, tree }));
	console.log(git(['diff', '--cached', '--stat'], { env }));
} else if (process.argv[2] === 'commit') {
	const { head, tree } = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
	const commit = git(['commit-tree', tree, '-p', head, '-m', 'Complete Ring of Wealth tier label translations']);
	git(['update-ref', 'HEAD', commit, head]);
	console.log(git(['show', '--stat', '--oneline', commit]));
} else throw Error('Expected prepare or commit');
