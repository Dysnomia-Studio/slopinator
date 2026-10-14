import SteamAppData from './steam_app_data';

const STEAM_ICONS_TYPES = ['code', 'art', 'translation'];
const STATUS_TYPES = ['ai', 'human', 'unknown'];

function getStatusForAppAndType(appId: number, type: string): number {
	if (!SteamAppData || !SteamAppData[appId] || !SteamAppData[appId][type]) {
		return 2;
	}

	return SteamAppData[appId][type];
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

		const aiBadgesList = document.createElement('span');
		aiInfoRoot.append(aiBadgesList);

		for (const iconType of STEAM_ICONS_TYPES) {
			const status: string = STATUS_TYPES[getStatusForAppAndType(appId, iconType)]!;

			const img = document.createElement('img');
			console.log(`/status/${iconType}-${status}.png` as any);
			console.log(browser.runtime.getURL(`/status/${iconType}-${status}.png` as any));
			img.src = browser.runtime.getURL(`/status/${iconType}-${status}.png` as any);
			
			let style = 'max-height: 23px; vertical-align: middle;';
			if (aiBadgesList.children.length > 0) {
				style += ' margin-left: 7px;'; 
			}
			img.style = style;

			aiBadgesList.append(img);
		}

		document.querySelector('.apphub_OtherSiteInfo')?.prepend(aiInfoRoot);
	},
});
