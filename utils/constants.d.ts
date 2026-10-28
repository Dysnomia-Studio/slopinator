export declare const STEAM_ICONS_TYPES: string[];
export declare const STATUS_TYPES: string[];
export declare const STATUS_TYPES_HUMAN: number;
export declare const STATUS_TYPES_UNKNOWN: number;
export declare const STATUS_TYPES_WARNING: number;
type AppMetadata = { parentAppId: number, aiDisclosed?: boolean }
declare global {
	var appMetadata: { [key: number]: AppMetadata }
}
