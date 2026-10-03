import fs from 'node:fs';

const src = fs.readFileSync('src/i18n/portStrings.ts', 'utf8');
const mapPath = 'C:\\Users\\miche\\AppData\\Local\\Temp\\claude\\C--Users-miche-dev-mwg-pixel-dungeon\\65e43c09-1732-408d-9922-9e57c7a0fae5\\scratchpad\\hu-map.json';
const huMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

function extractBlock(name) {
	const marker = 'export const ' + name + ': Record<string, string> = {';
	const start = src.indexOf(marker);
	if (start === -1) throw new Error('not found ' + name);
	let i = start + marker.length;
	let depth = 1;
	const bodyStart = i;
	while (depth > 0) {
		if (src[i] === '{') depth++;
		else if (src[i] === '}') depth--;
		i++;
	}
	return src.slice(bodyStart, i - 1);
}

// Parse ordered key list from EN block, brace/quote aware but simple: keys are always
// simple string literals at the start of a line ('...' or "..."), so a per-line regex is safe.
function extractKeysOrdered(body) {
	const re = /^\s*['"]([^'"]+)['"]\s*:/gm;
	const out = [];
	let m;
	while ((m = re.exec(body))) out.push(m[1]);
	return out;
}

function placeholders(str) {
	const re = /\{([a-zA-Z0-9_]+)\}/g;
	const out = new Set();
	let m;
	while ((m = re.exec(str))) out.add(m[1]);
	return [...out].sort();
}

const enBody = extractBlock('PORT_STRINGS_EN');
const enKeysOrdered = extractKeysOrdered(enBody);

// Also need EN values for placeholder comparison - reuse a JS eval-safe parse via Function
// on the exact slice, since values are plain JS string literals.
const enObj = Function('"use strict"; return {' + enBody + '}')();

console.log('EN ordered keys:', enKeysOrdered.length);
console.log('EN object keys:', Object.keys(enObj).length);

const huKeys = Object.keys(huMap);
console.log('HU map keys:', huKeys.length);

const missing = enKeysOrdered.filter((k) => !(k in huMap));
const extra = huKeys.filter((k) => !enKeysOrdered.includes(k));
console.log('missing in HU:', missing.length, missing);
console.log('extra in HU:', extra.length, extra);

let mismatches = 0;
for (const k of enKeysOrdered) {
	if (!(k in huMap)) continue;
	const enPh = placeholders(enObj[k]);
	const huPh = placeholders(huMap[k]);
	if (JSON.stringify(enPh) !== JSON.stringify(huPh)) {
		mismatches++;
		console.log('MISMATCH', k, 'EN:', enPh, 'HU:', huPh);
	}
}
console.log('placeholder mismatches:', mismatches);

if (missing.length === 0 && extra.length === 0 && mismatches === 0) {
	// emit the ordered HU block text
	const lines = enKeysOrdered.map((k) => {
		const val = huMap[k].replace(/\\/g, '\\\\').replace(/'/g, "\\'");
		return "\t'" + k + "': '" + val + "',";
	});
	fs.writeFileSync(
		'C:\\Users\\miche\\AppData\\Local\\Temp\\claude\\C--Users-miche-dev-mwg-pixel-dungeon\\65e43c09-1732-408d-9922-9e57c7a0fae5\\scratchpad\\hu-block.txt',
		lines.join('\n') + '\n',
	);
	console.log('WROTE hu-block.txt with', lines.length, 'lines');
} else {
	console.log('NOT writing block - fix mismatches first');
}
