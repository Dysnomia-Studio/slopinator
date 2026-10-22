import SteamAppListBeforeGpt from './steam_app_before_gpt';
import SteamAppData from './steam_app_data';

const STEAM_ICONS_TYPES = ['code', 'art', 'translation', 'marketing', 'sound', 'voice'];
const STATUS_TYPES = ['human', 'ai', 'unknown', 'disabled', 'warning', 'past'];
const STATUS_TYPES_HUMAN = STATUS_TYPES.indexOf('human');
const STATUS_TYPES_WARNING = STATUS_TYPES.indexOf('warning');
const aiDisclosed: { [key: number]: boolean } = {};
const parentApps: { [key: number]: number } = {};
const metadataQueries: { [key: number]: Promise<void> } = {};

function getParentAppId(htmlStr: string) {
	try {
		const appId = Number.parseInt(
			htmlStr
				.split('<div class=\"blockbg\">')[1]
				?.split('<a href=\"https://store.steampowered.com/app/')[1]
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
	aiDisclosed[appId] = html.includes('AI Generated Content Disclosure');
	parentApps[appId] = getParentAppId(html);
	console.debug(`Found app ${parentApps[appId]} as parent of ${appId}`);
}

async function getMetadataFromStorePage(appId: number): Promise<void> {
	if (!metadataQueries[appId]) {
		metadataQueries[appId] = (async () => {
			try {
				const res = await fetch(`https://store.steampowered.com/app/${appId}/?l=english`);
				const html = await res.text();

				parseStorePageHMTMLString(appId, html);

				if (parentApps[appId] !== 0 && parentApps[appId] !== appId) {
					await getMetadataFromStorePage(parentApps[appId]!);

					aiDisclosed[appId] = aiDisclosed[appId] || aiDisclosed[parentApps[appId]!]!;
				}
			} catch (e) {
				console.error('Error when getting disclosure status', e);
			}
		})();
	}

	await metadataQueries[appId];
}


async function isAIDisclosed(appId: number) {
	if (aiDisclosed[appId] !== undefined) {
		return aiDisclosed[appId];
	}

	await getMetadataFromStorePage(appId);

	return aiDisclosed[appId] ?? false;
}

async function getStatusForAppAndType(appId: number, type: string): Promise<number> {
	if (SteamAppListBeforeGpt.includes(appId) && type != 'marketing') {
		return STATUS_TYPES_HUMAN;
	}

	await getMetadataFromStorePage(appId);

	const localAppId = parentApps[appId] ?? appId;

	if (!SteamAppData || !SteamAppData[localAppId]) {
		if (await isAIDisclosed(localAppId)) {
			return STATUS_TYPES_WARNING;
		}

		return 2;
	}

	if (typeof SteamAppData[localAppId][type] !== 'number') {
		return 2;
	}

	return SteamAppData[localAppId][type];
}

async function getAppDetails(appId: number): Promise<HTMLElement> {
	const sourcesList = [...(SteamAppData[appId]?.sources as string[] ?? [])];;
	if (SteamAppListBeforeGpt.includes(appId)) {
		sourcesList.push('This game hasn\'t been updated since ChatGPT or any public big LLM released (2022-11-30).');
	}

	if (sourcesList.length === 0) {
		sourcesList.push('N/A');
	}

	const rootElement = document.createElement('div');

	rootElement.append('Badges:', document.createElement('br'));
	for (const iconType of STEAM_ICONS_TYPES) {
		const status: string = STATUS_TYPES[await getStatusForAppAndType(appId, iconType)]!;
		rootElement.append('- ', iconType, ': ', status, document.createElement('br'));
	}

	rootElement.append(document.createElement('br'));
	rootElement.append('Sources:', document.createElement('br'));

	for (const source of sourcesList) {
		if (source.startsWith(window.location.href)) {
			rootElement.append('- Text on the current page');
		} else if (source.startsWith('http')) {
			const link = document.createElement('a');
			link.href = source;
			link.target = '_blank';
			link.textContent = source;
			rootElement.append('- ', link);
		} else {
			rootElement.append(`- ${source}`);
		}

		rootElement.append(document.createElement('br'));
	}

	const contributeLink = document.createElement('a');
	contributeLink.href = 'https://github.com/Dysnomia-Studio/slopinator#contribution';
	contributeLink.target = '_blank';
	contributeLink.textContent = 'Incorrect or incomplete data? You can contribute to the extension data here!';

	rootElement.append(
		document.createElement('br'),
		document.createElement('br'),
		contributeLink,
	);

	return rootElement;
}

function getStatusImg(iconType: string, status: string) {
	let simplifiedStatus = status;
	if (simplifiedStatus === 'past') {
		simplifiedStatus = 'warning';
	}

	return `/status/${iconType}-${status}.png` as any;
}

async function generateBadges(appId: number) {
	const aiBadgesList = document.createElement('span');
	aiBadgesList.classList.add('ai-badges-list');

	for (const iconType of STEAM_ICONS_TYPES) {
		const status: string = STATUS_TYPES[await getStatusForAppAndType(appId, iconType)]!;

		const img = document.createElement('img');
		img.src = browser.runtime.getURL(getStatusImg(iconType, status));
			
		let style = 'max-height: 23px; vertical-align: middle;';
		if (aiBadgesList.children.length > 0) {
			style += ' margin-left: 7px;'; 
		}
		img.style = style;

		aiBadgesList.append(img);
	}

	let sourcesVisible = false;
	const aiInfoDetails = await getAppDetails(appId);

	function updateAIInfoSourcesVisibility() {
		let style = 'position: absolute;top: 35px;z-index: 10000;background: #3b4046;padding: 0.5rem;width: calc(100% - 1rem);display: ';
		if (sourcesVisible) {
			style += 'initial;';
		} else {
			style += 'none;';
		}

		aiInfoDetails.style = style;
	}

	updateAIInfoSourcesVisibility();

	aiBadgesList.addEventListener('click', async () => {
		sourcesVisible = !sourcesVisible;
		updateAIInfoSourcesVisibility();
	});

	return { aiBadgesList, aiInfoDetails };
}

function getAppIdFromUrl(url: string) {
	return Number.parseInt(url.split('/')[4] ?? '', 10);
}

async function setSteamStorePageBadges() {
	const appId = getAppIdFromUrl(window.location.href);
	if (Number.isNaN(appId)) {
		console.error('[SlopInator] Error: Cannot parse steam appid');
		return;
	}

	const { aiBadgesList, aiInfoDetails } = (await generateBadges(appId))!;

	const aiInfoRoot = document.createElement('span');
	aiInfoRoot.classList.add('btnv6_blue_hoverfade', 'btn_medium');
	aiInfoRoot.style = 'margin-right: 3px;';
	aiInfoRoot.append(aiBadgesList);

	document.querySelector('.apphub_OtherSiteInfo')?.prepend(aiInfoRoot);
	document.querySelector('.apphub_OtherSiteInfo')?.prepend(aiInfoDetails);
}

let steamSearchPageIntervalIterationId = 0;
async function setSteamSearchPageBadges(iterationId: number) {
	const list = document.querySelectorAll('#search_resultsRows > a');
	for (const item of list) {
		if (iterationId !== steamSearchPageIntervalIterationId) {
			return;
		}

		const subItem = item.querySelector('.responsive_search_name_combined');
		if (subItem?.querySelector('.ai-badges-list')) {
			continue;
		}

		const appId = Number.parseInt(item.getAttribute('data-ds-appid') ?? '', 10);
		if (Number.isNaN(appId)) {
			console.error('[SlopInator] Error: Cannot parse steam appid');
			continue;
		}
		const { aiBadgesList } = (await generateBadges(appId))!;
		if (subItem?.querySelector('.ai-badges-list')) {
			continue;
		}
		subItem?.append(aiBadgesList);
	}
}

let steamSalePageIntervalIterationId = 0;
async function setSteamSalePageBadges(iterationId: number) {
	const largeContainersList = document.querySelectorAll('.SaleSectionContainer.center_row_trgt.ItemCount_1');
	for (const item of largeContainersList) {
		if (iterationId !== steamSalePageIntervalIterationId) {
			return;
		}

		const titleLink = item.querySelector('a');
		const parent = item.querySelector('.StoreSaleWidgetShortDesc')?.parentNode;
		if (parent?.querySelector('.ai-badges-list')) {
			continue;
		}

		const appId = getAppIdFromUrl(titleLink?.href ?? '');
		if (Number.isNaN(appId)) {
			console.error('[SlopInator] Error: Cannot parse steam appid');
			continue;
		}
		const { aiBadgesList } = (await generateBadges(appId))!;
		const root = document.createElement('span');
		root.appendChild(aiBadgesList);
		if (parent?.querySelector('.ai-badges-list')) {
			continue;
		}

		parent?.prepend(root);

		return;
	}

	const thinContainersList = document.querySelectorAll('.StoreSaleWidgetOuterContainer div div div:nth-child(2)');
	for (const item of thinContainersList) {
		if (iterationId !== steamSalePageIntervalIterationId) {
			return;
		}

		const titleLink = item.querySelector('a');
		if (titleLink?.parentNode?.querySelector('.ai-badges-list')) {
			continue;
		}

		const appId = getAppIdFromUrl(titleLink?.href ?? '');
		if (Number.isNaN(appId)) {
			console.error('[SlopInator] Error: Cannot parse steam appid');
			continue;
		}
		const { aiBadgesList } = (await generateBadges(appId))!;
		const root = document.createElement('span');
		root.style = "margin-left: 1rem;"
		root.appendChild(aiBadgesList);
		if (titleLink?.parentNode?.querySelector('.ai-badges-list')) {
			continue;
		}

		titleLink?.parentNode?.append(root);
	}
}

export default defineContentScript({
	matches: ['*://store.steampowered.com/*'],
	main() {
		if (window.location.href.startsWith('https://store.steampowered.com/app/')) {
			setSteamStorePageBadges();
		}
		if (window.location.href.startsWith('https://store.steampowered.com/search')) {
			setInterval(() => {
				setSteamSearchPageBadges(++steamSearchPageIntervalIterationId);
			}, 1000);
		}
		if (window.location.href.startsWith('https://store.steampowered.com/sale/')) {
			setInterval(() => {
				setSteamSalePageBadges(++steamSalePageIntervalIterationId);
			}, 1000);
		}
	},
});
