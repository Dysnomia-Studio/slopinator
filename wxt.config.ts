import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  manifest: {
    name: "__MSG_extension_name__",
    description: "__MSG_extension_description__",
    browser_specific_settings: {
      gecko: {
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
    default_locale: 'en',
    web_accessible_resources: [
      {
        "resources": ["status/*.png"],
        "extension_ids": ["*"],
        "matches": ["*://*/*"]
      }
    ],
    permissions: ['storage'],
  }
});
