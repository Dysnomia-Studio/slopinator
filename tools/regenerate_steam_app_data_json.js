import fs from 'node:fs/promises';
import { STATUS_TYPES, STATUS_TYPES_UNKNOWN, STEAM_ICONS_TYPES } from '../utils/constants.js';

STEAM_ICONS_TYPES.sort();

const GAMES_FOLDER = 'data/games/'
const files = await fs.readdir(GAMES_FOLDER);
const output = {};
for (const file of files) {
	const res = await fs.readFile(`data/games/${file}`);
	const obj = JSON.parse(res);

	if (!obj.steamStoreAppId) {
		console.log(`${file} has no steamStoreAppId, skipping.`);
		continue;
	}

	output[obj.steamStoreAppId] = {};

	for (const iconType of STEAM_ICONS_TYPES) {
		const status = STATUS_TYPES.indexOf(obj.aiFlags[iconType]);
		if (status === STATUS_TYPES_UNKNOWN) {
			continue;
		}

		output[obj.steamStoreAppId][iconType] = STATUS_TYPES.indexOf(obj.aiFlags[iconType]);
	}

	output[obj.steamStoreAppId].sources = obj.sources;
}


const outputKeys = Object.keys(output);
outputKeys.sort((a, b) => a.localeCompare(b));

const newData = {};
for (const key of outputKeys) {
	newData[key] = output[key];
}

await fs.writeFile('entrypoints/steam_app_data.json', JSON.stringify(newData, null, 4));