import fs from 'node:fs/promises';

const chatGptReleaseDate = new Date("2022-11-30");

const dataTxt = await fs.readFile("tools/GenerateNotUpdatedAppsList/bin/Debug/net10.0/lastupdates.json", "utf8");
const data = JSON.parse(dataTxt);

const beforeGptGames = [];
for (const appId in data) {
	const lastUpdateDate = new Date(data[appId]);
	if (lastUpdateDate.getTime() <= chatGptReleaseDate.getTime()) {
		beforeGptGames.push(parseInt(appId, 10));
	}
}

console.log(Object.keys(data).length);
console.log(beforeGptGames.length);

await fs.writeFile("entrypoints/steam_app_before_gpt.json", JSON.stringify(beforeGptGames));