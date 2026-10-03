import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const TMP = process.argv[2];
const pairs = [
  ['HEAD:src/scenes/dungeon/panelsSingleUse.ts', `${TMP}/panelsSingleUse.ts`, 'panels'],
  ['HEAD:tools/verifyCombat.mjs', `${TMP}/verifyCombat.mjs`, 'verify'],
  [':ROADMAP.md', `${TMP}/ROADMAP.md`, 'roadmap'],
];
for (const [baseRef, file, label] of pairs) {
  const base = git('show', baseRef);
  const made = readFileSync(file, 'utf8');
  const bl = base.split('\n').length, ml = made.split('\n').length;
  const peer = ['sourceClassResistHalf', 'GeyserTrap', 'R040', 'WarpBeacon', 'T63 geyser'];
  const basePeer = peer.filter((p) => base.includes(p));
  const madePeer = peer.filter((p) => made.includes(p));
  console.log(`${label}: baseLines=${bl} madeLines=${ml} basePeer=[${basePeer}] madePeer=[${madePeer}]`);
}
