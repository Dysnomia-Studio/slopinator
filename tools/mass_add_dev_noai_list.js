import { execSync } from 'child_process';
import fs from 'node:fs/promises';

// Get All steam links in a page:
// Array.from(document.querySelectorAll('a')).map((x) => x.href).filter((x) => x.includes('store.steampowered.com'))

// Get All app ids in a page:
// Array.from(new Set(Array.from(document.querySelectorAll('a')).map((x) => x.href).filter((x) => x.includes('store.steampowered.com/app/')).map((x) => x.split('/')[4].split('?')[0])))

const source = 'https://aftermath.site/video-games-no-ai/';

const appIds = [

];

const doneIds = [];

function gitCommit(file, appName, appId) {
    execSync('git add ' + file, console.log);
    execSync(`git commit -m "Steam App Data: ${appName} (${appId})"`, console.log);
}

function simplifyName(name) {
    return (
        name
            .replaceAll(' ', '_')
            .replaceAll(':', '_')
            .replaceAll('?', '_')
            .replaceAll('&', '_')
    );
}

const GAMES_FOLDER = 'data/games/'
const files = await fs.readdir(GAMES_FOLDER);
for (const file of files) {
    const filePath = `data/games/${file}`;
    const res = await fs.readFile(filePath);
    const obj = JSON.parse(res);

    if (!obj.steamStoreAppId) {
        console.log(`${file} has no steamStoreAppId, skipping.`);
        continue;
    }

    if (!appIds.includes(obj.steamStoreAppId)) {
        continue;
    }

    console.log(obj.steamStoreAppId, ' is already in the list!');
    doneIds.push(obj.steamStoreAppId);

    if (obj.sources.includes(source)) {
        console.log(`${file} has the source. Skipping`);
        continue;
    }

    obj.sources.push(source);

    for (const flagName in obj.aiFlags) {
        obj.aiFlags[flagName] = 'human';
    }

    await fs.writeFile(filePath, JSON.stringify(obj, null, 4));

    gitCommit(filePath, obj.name, obj.steamStoreAppId);
}

for (const appId of appIds) {
    if (doneIds.includes(appId)) {
        continue;
    }

    const httpRes = await fetch('https://store.steampowered.com/api/appdetails/?&appids=' + appId);
    const jsonRes = await httpRes.json();
    const appData = jsonRes?.[appId].data;
    if (!appData) {
        console.warn('No data, rate-limited');
        throw new Error('No data, rate-limited');
    }
    if (appData.type !== 'game') {
        console.warn('Not a game, skipping.', appData.type);
        continue;
    }

    const simplifiedAppName = simplifyName(appData.name);
    const filePath = `data/games/${simplifiedAppName}.json`;

    const obj = {
        'name': appData.name,
        'steamStoreAppId': appId,
        'aiFlags': {
            'art': 'human',
            'code': 'human',
            'marketing': 'human',
            'sound': 'human',
            'translation': 'human',
            'voice': 'human',
            'writing': 'human'
        },
        'sources': [
            source,
        ]
    };

    await fs.writeFile(filePath, JSON.stringify(obj, null, 4));

    gitCommit(filePath, obj.name, obj.steamStoreAppId);

    await new Promise((x) => setTimeout(x, 1000));
}
