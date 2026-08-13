import { expect, test } from '@base';

const pagesToTest = [
  { name: 'homepage', url: '' },
  { name: 'example page', url: 'example' },
  { name: 'another page', url: 'another' },
];

for (const pageInstance of pagesToTest) {
  test.describe('visual regression tests', () => {
    test.describe.configure({ retries: 0 }); //disable retries for visual tests

    test(
      `${pageInstance.name} visual regression`,
      { tag: '@visual' },
      async ({ basePage, page }) => {
        await basePage.goto(pageInstance.url);

        await basePage.scrollBottomToTop(); //trigger lazy load

        await expect(page).toHaveScreenshot({
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
          timeout: 10000,
        });
      }
    );
  });
}
