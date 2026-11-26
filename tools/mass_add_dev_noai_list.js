import { execSync } from 'child_process';
import fs from 'node:fs/promises';

// Get All steam links in a page:
// Array.from(document.querySelectorAll('a')).map((x) => x.href).filter((x) => x.includes('store.steampowered.com'))

// Get All app ids in a page:
// Array.from(new Set(Array.from(document.querySelectorAll('a')).map((x) => x.href).filter((x) => x.includes('store.steampowered.com/app/')).map((x) => x.split('/')[4].split('?')[0])))

// Regularly get app ids on a page:
// test = []
// intervalId = setInterval(() => { test.push(...Array.from(new Set(Array.from(document.querySelectorAll('a')).map((x) => x.href).filter((x) => x.includes('store.steampowered.com/app/')).map((x) => x.split('/')[4].split('?')[0])))); test = Array.from(new Set(test)); console.log(test.length); }, 200)
// console.log(test);
// clearInterval(intervalId);

const newSources = [
    'https://store.steampowered.com/curator/46307989/sale/GamesWithoutAI',
    'https://web.archive.org/web/20260000000000*/https://store.steampowered.com/curator/46307989/sale/GamesWithoutAI',
];

const appIds = [
    "3839500",
    "3862100",
    "3574200",
    "3917260",
    "4070560",
    "3963580",
    "4159050",
    "4309480",
    "4232750",
    "4513510",
    "4940270",
    "5032520",
    "3943110",
    "4825820",
    "2863300",
    "4363380",
    "3217880",
    "4517570",
    "3670730",
    "4358700",
    "4184130",
    "1275550",
    "2980870",
    "4485070",
    "3122600",
    "4271620",
    "1239360",
    "2477750",
    "3090810",
    "4428600",
    "4874170",
    "1091870",
    "1266210",
    "4386890",
    "4514070",
    "3598860",
    "4390080",
    "3670110",
    "2244700",
    "3834910",
    "4931850",
    "4852570",
    "3339000",
    "4687430",
    "3096460",
    "2830480",
    "4859230",
    "4531680",
    "4573540",
    "2292650",
    "4714860",
    "4013410",
    "2334400",
    "3411970",
    "2706980",
    "3694190",
    "3046820",
    "3846290",
    "3551150",
    "4667970",
    "4408940",
    "4977030",
    "4009450",
    "4082490",
    "3814270",
    "4113970",
    "3637610",
    "3005340",
    "4546870",
    "4734180",
    "4207140",
    "4357240",
    "4939960",
    "3193330",
    "4566010",
    "2972760",
    "4609300",
    "2944610",
    "4977510",
    "2930030",
    "3784140",
    "2479320",
    "3844300",
    "3650210",
    "3770820",
    "4548190",
    "3882690",
    "3136380",
    "4514920",
    "4238990",
    "3056570",
    "4127730",
    "3220130",
    "4640140",
    "4504240",
    "4351070",
    "5032860",
    "3481410",
    "3839500",
    "3862100",
    "3574200",
    "4184130",
    "4070560",
    "1275550",
    "2980870",
    "4517570",
    "3670730",
    "4485070",
    "3917260",
    "3963580",
    "4390080",
    "3670110",
    "2244700",
    "4271620",
    "3122600",
    "3834910",
    "4159050",
    "4309480",
    "4232750",
    "4513510",
    "4940270",
    "5032520",
    "3943110",
    "4825820",
    "2863300",
    "4363380",
    "3217880",
    "4358700",
    "3090810",
    "1239360",
    "4428600",
    "4874170",
    "1091870",
    "1266210",
    "4386890",
    "4514070",
    "2477750",
    "3598860",
    "3046820",
    "4687430",
    "3096460",
    "2830480",
    "4931850",
    "4859230",
    "4531680",
    "4573540",
    "2292650",
    "4852570",
    "4714860",
    "3339000",
    "4013410",
    "2334400",
    "3814270",
    "3694190",
    "4009450",
    "3411970",
    "2706980",
    "3551150",
    "3846290",
    "4667970",
    "4408940",
    "4977030",
    "4082490",
    "4113970",
    "3637610",
    "3005340",
    "4546870",
    "4734180",
    "4207140",
    "4357240",
    "4939960",
    "3193330",
    "4566010",
    "4127730",
    "2972760",
    "4609300",
    "2944610",
    "4977510",
    "2930030",
    "3784140",
    "2479320",
    "3844300",
    "3650210",
    "3136380",
    "3220130",
    "4238990",
    "4640140",
    "3770820",
    "4548190",
    "3882690",
    "4514920",
    "3056570",
    "4504240",
    "4351070",
    "5032860",
    "3481410"
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

    const oldLength = obj.sources.length;
    obj.sources = Array.from(new Set([...obj.sources, ...newSources]));

    if (oldLength === obj.sources.length) {
        continue;
    }

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
            ...newSources,
        ]
    };

    await fs.writeFile(filePath, JSON.stringify(obj, null, 4));

    gitCommit(filePath, obj.name, obj.steamStoreAppId);

    await new Promise((x) => setTimeout(x, 1000));
}
