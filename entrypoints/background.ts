export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'update') {
      await browser.tabs.create({
        url: `https://github.com/Dysnomia-Studio/slopinator/releases/tag/v${browser.runtime.getManifest().version}`,
        active: true,
      });
    }
  });
});
