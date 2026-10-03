import { readFileSync, writeFileSync } from 'node:fs';
// R110 edits with EOL-preserving matching (catalog.ts is CRLF, gear mixed).
function edit(file, pairs) {
  let t = readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    const norm = (s) => s.replace(/\r\n/g, '\n');
    const tn = norm(t);
    const an = norm(a);
    if (tn.split(an).length !== 2) { console.error(`${file}: anchor x${tn.split(an).length - 1}: ${an.slice(0, 70)}`); process.exit(1); }
    // Rebuild with the file's dominant EOL for the inserted lines.
    const eol = (t.match(/\r\n/g) || []).length > (t.match(/(?<!\r)\n/g) || []).length ? '\r\n' : '\n';
    const bLocal = b.replace(/\n/g, eol);
    // Replace on the normalized text, then restore dominant EOL everywhere is
    // wrong for mixed files - instead replace the exact original span.
    const idx = tn.indexOf(an);
    // Map normalized index back: walk both strings (they differ only by \r).
    let oi = 0, ni = 0;
    while (ni < idx) { if (t[oi] === '\r' && t[oi + 1] === '\n') oi += 2; else oi++; ni++; }
    let oEnd = oi;
    let rem = an.length;
    const wb = norm(b);
    t = t.slice(0, oi) + bLocal + t.slice(oi + (t.slice(oi).length - norm(t.slice(oi)).length) + 0, 0).slice(0, 0) + '';
    // Simpler correct approach below - redo by lines.
    throw new Error('unreachable');
  }
}
console.log('unused');
