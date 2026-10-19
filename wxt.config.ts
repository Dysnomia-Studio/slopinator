import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    web_accessible_resources: [
      {
        "resources": ["status/*.png"],
        "extension_ids": ["*"],
        "matches": ["*://*/*"]
      }
    ],
    browser_specific_settings: {
      gecko: {
        id: "afa5d966-ad04-4c4e-85f4-6115517e965b",
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  }
});
