#!/usr/bin/env node
/**
 * Audit and extract the raw assets declared by SPD's Java `Assets` registry.
 *
 * The port deliberately keeps its assets flat in `src/assets/`, while Java keeps
 * them under `core/src/main/assets/<group>/`. This tool is the bridge between the
 * two layouts: it reads the registry and Java references, reports missing files,
 * and only copies files when `--copy` is explicitly requested.
 *
 * Usage:
 *   node tools/extract-spd-assets.mjs --spd-root <checkout> --check
 *   node tools/extract-spd-assets.mjs --spd-root <checkout> --copy
 *   node tools/extract-spd-assets.mjs --spd-root <checkout> --check --strict
 *
 * `--check` is intentionally non-failing by default: the report is also useful
 * while the port is incomplete. `--strict` makes missing referenced image assets
 * an error for CI once the port reaches its full asset-parity gate.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag) => {
	const index = args.indexOf(flag);
	return index >= 0 ? args[index + 1] : undefined;
};
const spdRootArg = valueAfter('--spd-root') ?? process.env.SPD_SOURCE_ROOT;
if (!spdRootArg) {
	console.error('extract-spd-assets: provide the Java SPD checkout with --spd-root <path> or SPD_SOURCE_ROOT');
	process.exit(2);
}

const spdRoot = resolve(spdRootArg);
const javaRoot = join(spdRoot, 'core', 'src', 'main', 'java');
const assetsRoot = join(spdRoot, 'core', 'src', 'main', 'assets');
const localRoot = resolve(valueAfter('--output') ?? join(process.cwd(), 'src', 'assets'));
if (!existsSync(javaRoot) || !existsSync(assetsRoot)) {
	console.error(`extract-spd-assets: invalid SPD checkout: ${spdRoot}`);
	process.exit(2);
}

function javaFiles(root) {
	const result = [];
	const visit = (directory) => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) visit(path);
			else if (entry.isFile() && entry.name.endsWith('.java')) result.push(path);
		}
	};
	visit(root);
	return result;
}

function readAssetsRegistry() {
	const path = join(javaRoot, 'com', 'shatteredpixel', 'shatteredpixeldungeon', 'Assets.java');
	if (!existsSync(path)) throw new Error(`Assets.java not found: ${path}`);
	const source = readFileSync(path, 'utf8');
	const groups = new Map();
	const groupPattern = /public static class (\w+)\s*\{([\s\S]*?)\n\s*\}/g;
	for (const match of source.matchAll(groupPattern)) {
		const group = match[1];
		const body = match[2];
		const constants = new Map();
		for (const constant of body.matchAll(/public static final String\s+(\w+)\s*=\s*"([^"]+)"\s*;/g)) {
			constants.set(constant[1], constant[2]);
		}
		if (constants.size) groups.set(group, constants);
	}
	return groups;
}

function isImage(path) {
	return new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']).has(extname(path).toLowerCase());
}

function destinationName(assetPath) {
	const [group, ...parts] = assetPath.split('/');
	const file = parts.join('/');
	const name = basename(file);
	if (group === 'interfaces') return `ui_${name}`;
	if (group === 'effects' && name !== 'effects.png') return `effect_${name}`;
	if (group === 'splashes') return `splash_${name}`;
	return name;
}

function allFiles(root) {
	const result = [];
	const visit = (directory) => {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) visit(path);
			else if (entry.isFile()) result.push(path);
		}
	};
	visit(root);
	return result;
}

const registry = readAssetsRegistry();
const javaSource = javaFiles(javaRoot).map((path) => ({ path, source: readFileSync(path, 'utf8') }));
const references = new Map();
for (const [group, constants] of registry) {
	for (const [constant, assetPath] of constants) {
		const token = `Assets.${group}.${constant}`;
		const users = javaSource.filter(({ source }) => source.includes(token)).map(({ path }) => relative(spdRoot, path));
		if (users.length) references.set(`${group}.${constant}`, { group, constant, assetPath, users });
	}
}

const images = [...references.values()].filter(({ assetPath }) => isImage(assetPath));
const missing = images.filter(({ assetPath }) => !existsSync(join(assetsRoot, assetPath)));
const localNames = new Map();
for (const path of allFiles(localRoot)) localNames.set(basename(path).toLowerCase(), path);
const missingInPort = missing.filter(({ assetPath }) => !localNames.has(destinationName(assetPath).toLowerCase()));
const unreferencedImages = [...registry].flatMap(([, constants]) => [...constants.values()])
	.filter((assetPath) => isImage(assetPath) && ![...references.values()].some((ref) => ref.assetPath === assetPath));

console.log(`Java asset registry: ${[...registry.values()].reduce((total, constants) => total + constants.size, 0)} string constants`);
console.log(`Referenced assets: ${references.size} (${images.length} images)`);
console.log(`Missing from Java checkout: ${missing.length}`);
console.log(`Missing from port by flattened name: ${missingInPort.length}`);

if (missing.length) {
	console.log('\nReferenced image assets not copied into the port:');
	for (const ref of missing) console.log(`- ${ref.assetPath} -> ${destinationName(ref.assetPath)} (${ref.users[0]})`);
}
if (unreferencedImages.length) {
	console.log(`\nRegistry image assets not referenced by Java source (${unreferencedImages.length}):`);
	for (const path of unreferencedImages) console.log(`- ${path}`);
}

if (args.includes('--copy')) {
	mkdirSync(localRoot, { recursive: true });
	let copied = 0;
	for (const ref of missingInPort) {
		const source = join(assetsRoot, ref.assetPath);
		const destination = join(localRoot, destinationName(ref.assetPath));
		if (!existsSync(source)) continue;
		if (existsSync(destination)) continue;
		copyFileSync(source, destination);
		copied++;
		console.log(`copied ${relative(process.cwd(), destination)}`);
	}
	console.log(`Copied ${copied} new image assets.`);
}

if (args.includes('--strict') && missingInPort.length) {
	console.error(`\nextract-spd-assets: strict check failed (${missingInPort.length} referenced image assets are absent)`);
	process.exit(1);
}
