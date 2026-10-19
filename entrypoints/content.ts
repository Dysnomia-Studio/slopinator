import SteamAppListBeforeGpt from './steam_app_before_gpt';
import SteamAppData from './steam_app_data';

const STEAM_ICONS_TYPES = ['code', 'art', 'translation', 'sound', 'voice'];
const STATUS_TYPES = ['human', 'ai', 'unknown', 'disabled'];

function getStatusForAppAndType(appId: number, type: string): number {
	if (SteamAppListBeforeGpt.includes(appId)) {
		return 0;
	}

	if (!SteamAppData || !SteamAppData[appId] || typeof SteamAppData[appId][type] !== 'number') {
		return 2;
	}

	return SteamAppData[appId][type];
}

function getAppDetails(appId: number): HTMLElement {
	const sourcesList = [...(SteamAppData[appId]?.sources as string[] ?? [])];;
	if (SteamAppListBeforeGpt.includes(appId)) {
		sourcesList.push('This game hasn\'t been updated since ChatGPT or any public big LLM released (2022-11-30).');
	}

	if (sourcesList.length === 0) {
		sourcesList.push('N/A');
	}

	const rootElement = document.createElement('div');

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

export default defineContentScript({
	matches: ['*://store.steampowered.com/app/*'],
	main() {
		const appId = parseInt(window.location.href.split('/')[4] ?? '', 10);
		if (Number.isNaN(appId)) {
			console.error('[SlopInator] Error: Cannot parse steam appid');
			return;
		}

		const aiInfoRoot = document.createElement('span');
		aiInfoRoot.classList.add('btnv6_blue_hoverfade', 'btn_medium');
		aiInfoRoot.style = 'margin-right: 3px;';

		const aiBadgesList = document.createElement('span');
		aiInfoRoot.append(aiBadgesList);

		for (const iconType of STEAM_ICONS_TYPES) {
			const status: string = STATUS_TYPES[getStatusForAppAndType(appId, iconType)]!;

			const img = document.createElement('img');
			img.src = browser.runtime.getURL(`/status/${iconType}-${status}.png` as any);
			
			let style = 'max-height: 23px; vertical-align: middle;';
			if (aiBadgesList.children.length > 0) {
				style += ' margin-left: 7px;'; 
			}
			img.style = style;

			aiBadgesList.append(img);
		}

		let sourcesVisible = false;
		const aiInfoDetails = getAppDetails(appId);

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

		document.querySelector('.apphub_OtherSiteInfo')?.prepend(aiInfoRoot);
		document.querySelector('.apphub_OtherSiteInfo')?.prepend(aiInfoDetails);
	},
});
