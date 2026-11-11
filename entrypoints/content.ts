import type { AppGreyingConfig } from '@/utils/AppGreyingConfigType';
import getAppIdFromSteamStoreUrl from '@/utils/getAppIdFromSteamStoreUrl';
import getStatusForAppAndType from '@/utils/getStatusForAppAndType';
import { appsGreyingConfig } from '@/utils/storage';
import { GENAI_BADGES, STATUS_TYPES } from '../utils/constants';
import SteamAppListBeforeGpt from './steam_app_before_gpt';
import SteamAppData from './steam_app_data';

let config: AppGreyingConfig | null = null;
async function greyOutIfNeeded(element: HTMLElement, appId: number) {
	if (!config) {
		config = await appsGreyingConfig.getValue();
	}

	for (const iconType of GENAI_BADGES) {
		const statusIndex = await getStatusForAppAndType(appId, iconType);
		const status = STATUS_TYPES[statusIndex]!;

		if (config[iconType]?.[status]) {
			element.style.opacity = '0.1';
			return;
		}
	}
}

async function updateGreyingConfig() {
	config = await appsGreyingConfig.getValue();
}

async function getAppDetails(appId: number): Promise<HTMLElement> {
	const sourcesList = [...(SteamAppData[appId]?.sources as string[] ?? [])];;
	if (SteamAppListBeforeGpt.includes(appId)) {
		sourcesList.push(i18n.t('sources.pre_gpt'));
	}

	if (sourcesList.length === 0) {
		sourcesList.push('N/A');
	}

	const rootElement = document.createElement('div');

	rootElement.append(i18n.t('badges.section_title'), document.createElement('br'));
	for (const iconType of GENAI_BADGES) {
		const status: string = STATUS_TYPES[await getStatusForAppAndType(appId, iconType)]!;
		rootElement.append('- ', i18n.t('badges.' + iconType), ': ', i18n.t('status.' + status), document.createElement('br'));
	}

	rootElement.append(document.createElement('br'));
	rootElement.append(i18n.t('sources.section_title'), document.createElement('br'));

	for (const source of sourcesList) {
		if (source.startsWith(globalThis.location.href)) {
			rootElement.append('- ' + i18n.t('sources.current_page'));
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
	contributeLink.textContent = i18n.t('sources.contribute_msg');

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

	return `/status/${iconType}-${simplifiedStatus}.png` as any;
}

async function generateBadges(appId: number) {
	const aiBadgesList = document.createElement('span');
	aiBadgesList.classList.add('ai-badges-list');

	for (const iconType of GENAI_BADGES) {
		const status: string = STATUS_TYPES[await getStatusForAppAndType(appId, iconType)]!;

		const img = document.createElement('img');
		img.src = browser.runtime.getURL(getStatusImg(iconType, status));
			
		let style = 'max-height: 21px; vertical-align: middle;';
		if (aiBadgesList.children.length > 0) {
			style += ' margin-left: 7px;'; 
		}
		img.style = style;

		aiBadgesList.append(img);
	}

	let sourcesVisible = false;
	const aiInfoDetails = await getAppDetails(appId);

	function updateAIInfoSourcesVisibility() {
		let style = 'position: absolute; top: 35px; z-index: 10000; background: rgb(59, 64, 70); padding: 0.5rem; width: calc(100% - 1rem); text-overflow: ellipsis; overflow: hidden;';
		if (sourcesVisible) {
			style += 'display: initial;';
		} else {
			style += 'display: none;';
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

/**
 * Various pages/items types where to generate badges:
 **/
async function setSteamStorePageBadges() {
	const appId = getAppIdFromSteamStoreUrl(globalThis.location.href);
	if (Number.isNaN(appId)) {
		console.error('[SlopInator] Error: Cannot parse steam appid');
		return;
	}

	const { aiBadgesList, aiInfoDetails } = await generateBadges(appId);

	const aiInfoRoot = document.createElement('span');
	aiInfoRoot.classList.add('btnv6_blue_hoverfade', 'btn_medium');
	aiInfoRoot.style = 'margin-right: 3px;';
	aiInfoRoot.append(aiBadgesList);

	document.querySelector('.apphub_OtherSiteInfo')?.prepend(aiInfoRoot);
	document.querySelector('.apphub_OtherSiteInfo')?.prepend(aiInfoDetails);
}

async function setSteamSearchResultsBadges() {
	const list = document.querySelectorAll('#search_resultsRows > a');
	for (const item of list) {
		const subItem = item.querySelector('.responsive_search_name_combined');
		if (!subItem || subItem?.querySelector('.ai-badges-list')) {
			continue;
		}

		const appId = Number.parseInt(item.getAttribute('data-ds-appid') ?? '', 10);
		if (Number.isNaN(appId)) {
			console.error('[SlopInator] Error: Cannot parse steam appid');
			continue;
		}

		await greyOutIfNeeded(item as HTMLElement, appId);

		const { aiBadgesList } = await generateBadges(appId);
		if (subItem.querySelector('.ai-badges-list')) {
			continue;
		}
		subItem.append(aiBadgesList);
	}
}

async function setContainerBadges(titleLink: HTMLAnchorElement | null, aiBadgesListParent: ParentNode | null | undefined, parent: HTMLElement, prepend: boolean, additionalStyles?: string) {
	if (!aiBadgesListParent || aiBadgesListParent?.querySelector('.ai-badges-list')) {
		return;
	}

	if (!titleLink?.href || !titleLink?.href.startsWith('https://store.steampowered.com/app/')) {
		return;
	}

	const appId = getAppIdFromSteamStoreUrl(titleLink?.href ?? '');
	if (Number.isNaN(appId)) {
		console.error('[SlopInator] Error: Cannot parse steam appid', titleLink?.href);
		return;
	}
	const { aiBadgesList } = await generateBadges(appId);
	if (additionalStyles) {
		aiBadgesList.style = additionalStyles;
	}

	if (aiBadgesListParent.querySelector('.ai-badges-list')) {
		return;
	}

	if (prepend) {
		aiBadgesListParent.prepend(aiBadgesList);
	} else {
		aiBadgesListParent.append(aiBadgesList);
	}

	await greyOutIfNeeded(parent, appId);
}

async function setSaleSectionContainerBadges() {
	const largeContainersList = document.querySelectorAll('.SaleSectionContainer.center_row_trgt.ItemCount_1');
	for (const item of largeContainersList) {
		const titleLink = item.querySelector('a');
		const badgesListParent = item.querySelector('.StoreSaleWidgetShortDesc')?.parentNode;

		setContainerBadges(titleLink, badgesListParent, item as HTMLElement, true);
	}
}

async function setStoreSaleWidgetOuterContainerBadges() {
	const itemsList = document.querySelectorAll('.StoreSaleWidgetOuterContainer div div div:nth-child(2)');
	for (const item of itemsList) {
		const titleLink = item.querySelector('a');
		const badgesListParent = titleLink?.parentNode;

		setContainerBadges(titleLink, badgesListParent, item as HTMLElement, false, 'margin-left: 15px');
	}
}

async function setFrontPageCarouselBadges() {
	const itemsList = document.querySelectorAll('.carousel_items a');
	for (const item of itemsList) {
		const titleLink = item as HTMLAnchorElement;
		const badgesListParent = titleLink.querySelector('.app_name')?.parentNode;

		setContainerBadges(titleLink, badgesListParent, item.querySelector('.capsule') as HTMLElement, true, 'display: inline-block; margin-bottom: 5px');
	}
}

// Daily deals, personal calendar, ...
async function setPageCarouselBadges() {
	const itemsList = document.querySelectorAll('.carousel__slide .Panel.Focusable a');
	for (const item of itemsList) {
		const titleLink = item as HTMLAnchorElement;
		const parent = item;

		setContainerBadges(titleLink, parent, item as HTMLElement, true, 'background: #000000CC; display: inline-block; padding: 5px; position: absolute; right: 0; top: 0; z-index: 1000;');
	}
}

async function setPersonalCalendarPageBadges() {
	if (!globalThis.location.href.startsWith('https://store.steampowered.com/personalcalendar')) {
		return;
	}

	const itemsList = document.querySelectorAll('.Panel .Panel .ImpressionTrackedElement div[role="button"]');
	for (const item of itemsList) {
		const titleLink = item.querySelector('a');
		const parent = item;

		setContainerBadges(titleLink, parent, item as HTMLElement, true, 'background: #000000CC; display: inline-block; padding: 5px; position: absolute; right: 0; top: 0; z-index: 1000;');
	}
}

const currentlyRunningTasks: { [key: string]: boolean } = {};
const tasks: { [key: string]: () => Promise<void> } = {
	'setSteamSearchResultsBadges': setSteamSearchResultsBadges,
	'setSaleSectionContainerBadges': setSaleSectionContainerBadges,
	'setStoreSaleWidgetOuterContainerBadges': setStoreSaleWidgetOuterContainerBadges,
	'setFrontPageCarouselBadges': setFrontPageCarouselBadges,
	'setPageCarouselBadges': setPageCarouselBadges,
	'setPersonalCalendarPageBadges': setPersonalCalendarPageBadges,
}

export default defineContentScript({
	matches: ['*://store.steampowered.com/*'],
	main() {
		updateGreyingConfig();

		if (globalThis.location.href.startsWith('https://store.steampowered.com/app/')) {
			setSteamStorePageBadges();
		}
		setInterval(() => {
			for (const taskName in tasks) {
				if (currentlyRunningTasks[taskName]) {
					continue;
				}

				(async () => {
					try {
						currentlyRunningTasks[taskName] = true;
						await tasks[taskName]!();
					} catch (e) {
						console.error(e);
					}
					currentlyRunningTasks[taskName] = false;
				})();
			}
		}, 1000);
	},
});
