export default function getAppIdFromSteamStoreUrl(url: string) {
	return Number.parseInt(url.split('/')[4] ?? '', 10);
}