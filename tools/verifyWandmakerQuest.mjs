#!/usr/bin/env node
/**
 * Compare the production TypeScript `Wandmaker.Quest.spawnRoom()` decision with
 * the project-authored Java harness. The harness stops immediately after the first
 * quest room is appended, isolating quest RNG from the documented floor-room deltas.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const javaPath = process.argv[2];
const reportPath = process.argv[3];
if (!javaPath) {
	console.error('usage: node tools/verifyWandmakerQuest.mjs <wandmaker_java_out.txt>');
	process.exit(2);
}

const temp = join(root, 'tools', 'scratch', `wandmaker-quest-${process.pid}`);
mkdirSync(temp, { recursive: true });
try {
	const transpile = (sourcePath, outPath) => {
		const source = readFileSync(join(root, sourcePath), 'utf8');
		const result = ts.transpileModule(source, {
			compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
			reportDiagnostics: true,
		});
		const errors = (result.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
		assert.equal(errors.length, 0, `${sourcePath} transpiles without errors`);
		writeFileSync(outPath, result.outputText, 'utf8');
	};

	const rngPath = join(temp, 'spdRng.mjs');
	const decisionPath = join(temp, 'wandmakerQuest.mjs');
	transpile('src/spdRng.ts', rngPath);
	transpile('src/simulation/wandmakerQuest.ts', decisionPath);
	const [{ SpdRandom }, { wandmakerSpawnDecision }] = await Promise.all([
		import(pathToFileURL(rngPath).href), import(pathToFileURL(decisionPath).href),
	]);

	// Edge checks pin Java's short-circuit order, the floor-6 exclusion, depth-9 guarantee,
	// and the three equiprobable type values without depending on a particular seed sample.
	const runScripted = (type, spawned, depth, values) => {
		const maxima = [];
		let index = 0;
		const decision = wandmakerSpawnDecision(type, spawned, depth, (max) => {
			maxima.push(max);
			return values[index++];
		});
		return { decision, maxima, used: index };
	};
	assert.deepEqual(runScripted(0, false, 6, []), {
		decision: { spawnRoom: false, type: 0 }, maxima: [], used: 0,
	}, 'depth 6 does not draw or spawn');
	assert.deepEqual(runScripted(0, false, 7, [1]), {
		decision: { spawnRoom: false, type: 0 }, maxima: [3], used: 1,
	}, 'depth 7 failed gate only draws Int(3)');
	assert.deepEqual(runScripted(0, false, 8, [1]), {
		decision: { spawnRoom: false, type: 0 }, maxima: [2], used: 1,
	}, 'depth 8 failed gate only draws Int(2)');
	for (let type = 1; type <= 3; type++) {
		assert.deepEqual(runScripted(0, false, 9, [0, type - 1]), {
			decision: { spawnRoom: true, type }, maxima: [1, 3], used: 2,
		}, `depth 9 selects quest type ${type}`);
	}
	assert.deepEqual(runScripted(2, false, 8, []), {
		decision: { spawnRoom: true, type: 2 }, maxima: [], used: 0,
	}, 'a previously chosen quest type short-circuits the gate roll');
	assert.deepEqual(runScripted(0, true, 9, []), {
		decision: { spawnRoom: false, type: 0 }, maxima: [], used: 0,
	}, 'an already spawned quest uses no RNG');

	const cases = readFileSync(javaPath, 'utf8').split(/\r?\n/).filter(Boolean)
		.map((line) => JSON.parse(line)).filter((row) => Number.isInteger(row.seed));
	assert.equal(cases.length, 40, 'Java harness produced all 40 cases');
	let fields = 0;
	for (const javaCase of cases) {
		assert.equal(javaCase.error, undefined, `Java seed ${javaCase.seed} had no error`);
		SpdRandom.pushGenerator(BigInt(javaCase.seed));
		try {
			let type = 0;
			let spawnDepth = 0;
			for (const depth of [7, 8, 9]) {
				const decision = wandmakerSpawnDecision(type, false, depth, (max) => SpdRandom.int(max));
				type = decision.type;
				if (decision.spawnRoom) {
					spawnDepth = depth;
					break;
				}
			}
			assert.equal(spawnDepth, javaCase.spawnDepth, `seed ${javaCase.seed} spawn depth`);
			assert.equal(type, javaCase.type, `seed ${javaCase.seed} quest type`);
			fields += 2;
		} finally {
			SpdRandom.popGenerator();
		}
	}
	const summary = `verifyWandmakerQuest: ${cases.length} seeds, ${fields} fields match; gate edge cases passed`;
	if (reportPath) writeFileSync(reportPath, `${summary}\n`, 'utf8');
	console.log(summary);
} finally {
	rmSync(temp, { recursive: true, force: true });
}
