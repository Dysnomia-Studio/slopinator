import { GENAI_BADGES } from "./constants";

export type AppGreyingConfig = { [key in typeof GENAI_BADGES[number]]: any };
