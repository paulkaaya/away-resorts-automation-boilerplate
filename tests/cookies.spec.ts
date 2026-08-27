import { expect, test } from '@base';
import { assertNoA11yViolations } from '@utils/accessibility';

test.describe('cookie banner', () => {
  test.use({ dismissCookies: false });

  test.describe('visibility and interaction', () => {
    test('displays on first load', async ({ homePage }) => {
      await homePage.goto();

      await expect(homePage.cookieBanner.root).toBeVisible();
      await expect(homePage.cookieBanner.heading).toBeVisible();
      await expect(homePage.cookieBanner.description).toBeVisible();
    });

    test('remains visible when navigating between pages', async ({ homePage }) => {
      await homePage.goto();

      await expect(homePage.cookieBanner.root).toBeVisible();

      await homePage.goto('/cookie-policy/');

      await expect(homePage.cookieBanner.root).toBeVisible();
    });

    test('accepting cookies hides the banner and sets the consent cookie', async ({ homePage }) => {
      await homePage.goto();

      await homePage.cookieBanner.acceptCookies();

      await expect(homePage.cookieBanner.root).toBeHidden();
      await homePage.cookieBanner.assertCookiesAccepted();
    });

    test('clearing cookies causes the banner to reappear', async ({ homePage, context }) => {
      await homePage.goto();

      await homePage.cookieBanner.acceptCookies();
      await expect(homePage.cookieBanner.root).toBeHidden();

      await context.clearCookies();
      await homePage.goto();

      await expect(homePage.cookieBanner.root).toBeVisible();
    });
  });

  test.describe('accessibility', () => {
    test('has no accessibility violations', async ({ page, homePage }) => {
      await homePage.goto();

      await expect(homePage.cookieBanner.root).toBeVisible();
      await assertNoA11yViolations(page, { scope: homePage.cookieBanner.rootSelector });
    });
  });
});
