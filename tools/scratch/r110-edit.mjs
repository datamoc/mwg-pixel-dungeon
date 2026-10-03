import { readFileSync, writeFileSync } from 'node:fs';
// R110 edits, line-based and EOL-preserving (catalog CRLF, gear mixed).
function lines(file) {
  return readFileSync(file, 'utf8').split('\n');
}
function save(file, L) {
  writeFileSync(file, L.join('\n'));
}
// Returns index of the unique line whose trimmed text === anchor (ignoring \r).
function find(L, file, anchor, count = 1) {
  const hits = [];
  L.forEach((l, i) => { if (l.replace(/\r$/, '').trim() === anchor.trim()) hits.push(i); });
  if (hits.length !== count) { console.error(`${file}: anchor x${hits.length}: ${anchor.slice(0, 70)}`); process.exit(1); }
  return hits[0];
}
const EOL = (L, i) => (L[i].endsWith('\r') ? '\r' : '');

// 1. catalog.ts: cleric cudgel entry.
{
  const f = 'src/items/catalog.ts';
  const L = lines(f);
  const i = find(L, f, "warrior: 'wornshortsword', mage: 'magesstaff', rogue: 'dagger', huntress: 'gloves', duelist: 'rapier',");
  const e = EOL(L, i);
  L.splice(i + 1, 0,
    `\t//\`HeroClass.initCleric()\` (\`HeroClass.java\` 248-250, tag \`v3.3.8\`): the Cleric${e}`,
    `\t//starts with a Cudgel (ACC 1.40). It has no \`weaponCombatRules\` row, but its${e}`,
    `\t//name key (\`port.name.cudgel\`, all locales) resolves the display name.${e}`,
    `\tcleric: 'cudgel',${e}`);
  save(f, L);
  console.log('catalog done');
}

// 2. displayName.ts: heroClass field + startingWeapon class resolution.
{
  const f = 'src/items/displayName.ts';
  const L = lines(f);
  const ii = find(L, f, 'readonly armorSourceClass?: string;');
  const ee = EOL(L, ii);
  L.splice(ii + 1, 0,
    `\t/** The hero class for run-start gear names (R110) - the wielded \`startingWeapon\`${ee}`,
    `\t * names its Java class per hero class, like the slot trackers above. */${ee}`,
    `\treadonly heroClass?: string;${ee}`);
  // Import STARTING_WEAPON_CLASS via catalog (already imports from './catalog').
  let i = find(L, f, "import { ARMOR_NAME_BY_CLASS, WEAPON_NAME_BY_CLASS, isClassArmorId, weaponCombat } from './catalog';");
  let e = EOL(L, i);
  L[i] = `\timport { ARMOR_NAME_BY_CLASS, STARTING_WEAPON_CLASS, WEAPON_NAME_BY_CLASS, isClassArmorId, weaponCombat } from './catalog';${e}`.replace(/^\t/, '');
  // Resolve the class before the minted-id lookup: the wielded startingWeapon
  // names its Java class per hero class (`HeroClass.initHero()`, tag v3.3.8);
  // the cudgel has no authored class row, so it falls back to its own port
  // name key (all locales).
  const j = L.findIndex((l) => l.includes('const classKey = sourceClass'));
  if (j < 0) { console.error('classKey anchor missing'); process.exit(1); }
  e = EOL(L, j);
  L.splice(j, 4,
    `\t\tconst startClass = id === 'startingWeapon' ? STARTING_WEAPON_CLASS[scene.heroClass ?? ''] : undefined;${e}`,
    `\t\tconst startKey = startClass === undefined ? undefined${e}`,
    `\t\t\t: startClass === 'cudgel' ? 'port.name.cudgel' : WEAPON_NAME_BY_CLASS[startClass];${e}`,
    `\t\tconst classKey = startKey ?? (sourceClass${e}`,
    `\t\t\t? (weapon ? WEAPON_NAME_BY_CLASS[sourceClass.toLowerCase()]${e}`,
    `\t\t\t\t: armor ? ARMOR_NAME_BY_CLASS[sourceClass.toLowerCase()] : undefined)${e}`,
    `\t\t\t: undefined);${e}`);
  save(f, L);
  console.log('displayName done');
}

// 3. weaponSpellsGear.ts: supply heroClass in the context.
{
  const f = 'src/scenes/dungeon/hero/weaponSpellsGear.ts';
  const L = lines(f);
  const i = find(L, f, 'ringTypesKnown: ringTypesKnownFor(this),');
  const e = EOL(L, i);
  L.splice(i, 0, `\t\t\theroClass: this.heroClass,${e}`);
  save(f, L);
  console.log('gear done');
}
