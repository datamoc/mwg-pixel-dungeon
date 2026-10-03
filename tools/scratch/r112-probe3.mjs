// probe3: trace localStorage run key + screen text through startGame's steps when a save exists.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function (game) {
	const keys = () => game.eval(`Object.keys(localStorage).filter(k => k.includes('spd-mwg'))`);
	const texts = async () => {
		const t1 = await game.findText('choisissez votre h|choose your hero').catch(() => null);
		const t2 = await game.findText('entrer dans le donjon|enter the dungeon').catch(() => null);
		return { heroSelect: !!t1, enterDungeon: !!t2 };
	};
	await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 30000 });
	await sleep(3000);
	console.log('boot keys:', JSON.stringify(await keys()), 'texts:', JSON.stringify(await texts()));
	// step 1 of startGame: tap "enter the dungeon"
	await game.tapText('entrer dans le donjon|enter the dungeon', { timeout: 15000 });
	await sleep(1500);
	console.log('after enter tap keys:', JSON.stringify(await keys()), 'texts:', JSON.stringify(await texts()));
	await game.screenshot('tools/scratch/browser-test/r112-probe3-after-enter.png');
}
