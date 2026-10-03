function wrapEval(code) {
	return `(async () => {
		const mwg = window.__MWG__, scene = mwg && mwg.currentScene;
		const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
		const src = ${JSON.stringify(code)};
		let fn;
		try { fn = new AsyncFunction('mwg', 'scene', 'return (' + src + '\\n);'); } catch (e) { fn = new AsyncFunction('mwg', 'scene', src); }
		const v = await fn(mwg, scene);
		return JSON.stringify(v === undefined ? null : v);
	})()`;
}
const D = '(() => ({\n\t\ta: 1,\n\t\tb: 2\n\t})})()';
const w = wrapEval(D);
const lines = w.split('\n');
console.log('total lines: ' + lines.length);
console.log('line6: ' + JSON.stringify(lines[5]));
console.log('line6 length: ' + lines[5].length);
console.log('col95 area: ' + JSON.stringify(lines[5].slice(80, 110)));
