import { execSync } from 'child_process';
import fs from 'node:fs/promises';

const source = '';
const games = [

];

async function addNextGame(url) {
	const parts = url.split('/');
	const appId = parts[4];
	const name = parts[5];

	console.log(`Game: ${url} - Name: ${name} - App Id: ${appId}`);
	console.log(`Source: ${source}`);

	const oldData = JSON.parse(await fs.readFile('entrypoints/steam_app_data.json', 'utf8'));

	if (!oldData[appId]) {
		oldData[appId] = {
			"art": 0,
			"code": 0,
			"sound": 0,
			"translation": 0,
			"voice": 0,
			"sources": [
				source
			]
		};
	} else {
		let oldLength = oldData[appId].sources.length;
		oldData[appId].sources = Array.from(new Set([...oldData[appId].sources, source]));

		if (oldLength === oldData[appId].sources.length) {
			console.log('Source already present, skipping.');
			return;
		}
	}

	const oldDataKeys = Object.keys(oldData);
	oldDataKeys.sort((a, b) => a.localeCompare(b));

	const newData = {};
	for (const key of oldDataKeys) {
		newData[key] = oldData[key];
	}

	await fs.writeFile('entrypoints/steam_app_data.json', JSON.stringify(newData, null, 4));

	execSync('git add entrypoints/steam_app_data.json', console.log);
	execSync(`git commit -m "Steam App Data: ${name} (${appId})"`, console.log);
}

for (const game of games) {
	await addNextGame(game);
}