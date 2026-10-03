const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async (game) => {
await game.startGame({ hero: 0 });
await sleep(2500);
const bodies = {
T_callobj: '({a: 1})()',
T_iifeNum: '(() => 1)()',
T_iifeObj1: '(() => ({a: 1}))()',
};
for (const [name, code] of Object.entries(bodies)) {
try {
console.log(name + ': ' + JSON.stringify(await game.eval(code)));
} catch (e) {
console.log(name + ' THREW: ' + e.message.split('\n')[0]);
}
}
};
