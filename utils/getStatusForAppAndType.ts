import SteamAppListBeforeGpt from '../entrypoints/steam_app_before_gpt';
import SteamAppData from '../entrypoints/steam_app_data';
import getMetadataFromStorePage from './getMetadataFromStorePage';
import isAIDisclosed from './isAIDisclosed';

export default async function getStatusForAppAndType(appId: number, type: string): Promise<number> {
	if (SteamAppListBeforeGpt.includes(appId) && type !== 'marketing') {
		return STATUS_TYPES_HUMAN;
	}

	globalThis.appMetadata[appId] = await getMetadataFromStorePage(appId);

	const localAppId = globalThis.appMetadata[appId].parentAppId ?? appId;

	if (!SteamAppData?.[localAppId]) {
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