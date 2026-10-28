import getMetadataFromStorePage from "./getMetadataFromStorePage";

export default async function isAIDisclosed(appId: number) {
	if (appMetadata[appId]?.aiDisclosed !== undefined) {
		return appMetadata[appId]?.aiDisclosed;
	}

	appMetadata[appId] = await getMetadataFromStorePage(appId);

	return appMetadata[appId]?.aiDisclosed ?? false;
}
