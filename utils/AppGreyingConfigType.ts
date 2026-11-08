import { STEAM_ICONS_TYPES } from "./constants";

export type AppGreyingConfig = { [key in typeof STEAM_ICONS_TYPES[number]]: any };
