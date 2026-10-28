import type { AppMetadata } from "./constants";

const metadataQueries: { [key: number]: Promise<AppMetadata> } = {};

function getParentAppId(htmlStr: string) {
	try {
		const appId = Number.parseInt(
			htmlStr
				.split('<div class="blockbg">')[1]
				?.split('<a href="https://store.steampowered.com/app/')[1]
				?.split('/')[0] ?? '',
			10
		);

		if (Number.isNaN(appId)) {
			return 0;
		}

		return appId;
	} catch {
		return 0;
	}
}

function parseStorePageHMTMLString(appId: number, html: string) {
	const aiDisclosed = html.includes('AI Generated Content Disclosure');
	const parentAppId = getParentAppId(html);
	console.debug(`Found app ${parentAppId} as parent of ${appId}`);

	return { parentAppId, aiDisclosed };
}

export default async function getMetadataFromStorePage(appId: number) {
	if (!metadataQueries[appId]) {
		metadataQueries[appId] = (async (): Promise<AppMetadata> => {
			let parentAppId = 0;
			let aiDisclosed;

			try {
				const res = await fetch(`https://store.steampowered.com/app/${appId}/?l=english`);
				const html = await res.text();

				const appData = parseStorePageHMTMLString(appId, html);

				parentAppId = appData.parentAppId;
				aiDisclosed = appData.aiDisclosed;

				if (appData.parentAppId !== 0 && appData.parentAppId !== appId) {
					const parentApp = await getMetadataFromStorePage(parentAppId);

					aiDisclosed = aiDisclosed || parentApp.aiDisclosed;
				}
			} catch (e) {
				console.error('Error when getting disclosure status', e);
			}

			return { parentAppId, aiDisclosed };
		})();
	}

	return await metadataQueries[appId];
}