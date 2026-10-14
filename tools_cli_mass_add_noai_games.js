import { execSync } from 'child_process';
import fs from 'node:fs/promises';
import readline from 'node:readline';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const askQuestion = (question) => {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
};

let lastSource;
async function addNextGame() {
	const url = await askQuestion(`Game to add ? `);
	const parts = url.split('/');
	const appId = parts[4];
	const name = parts[5];

	console.log(`Game: ${url} - Name: ${name} - App Id: ${appId}`);

	let source = await askQuestion(`Source ? (none = ${lastSource}) `);
	console.log(`Source: ${source}`);
	if (!source || source.trim() === '') {
		source = lastSource;
	}
	lastSource = source;

	const oldData = JSON.parse(await fs.readFile('entrypoints/steam_app_data.json', 'utf8'));

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

	const oldDataKeys = Object.keys(oldData);
	oldDataKeys.sort((a, b) => a.localeCompare(b));

	console.log(oldDataKeys);

	const newData = {};
	for (const key of oldDataKeys) {
		newData[key] = oldData[key];
	}

	await fs.writeFile('entrypoints/steam_app_data.json', JSON.stringify(newData, null, 4));

	execSync('git add entrypoints/steam_app_data.json', console.log);
	execSync(`git commit -m "Steam App Data: ${name} (${appId})"`, console.log);
}

while (true) {
	await addNextGame();
}