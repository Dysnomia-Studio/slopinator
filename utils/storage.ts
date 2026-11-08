import { storage } from "wxt/utils/storage";
import type { AppGreyingConfig } from "./AppGreyingConfigType";

export const appsGreyingConfig = storage.defineItem<AppGreyingConfig>("local:apps-greying-config", {
	fallback: {
		code: {
			ai: true,
		},
		art: {
			ai: true,
		},
		translation: {
			ai: true,
		},
		marketing: {
			ai: true,
		},
		sound: {
			ai: true,
		},
		voice: {
			ai: true,
		},
	}
},);