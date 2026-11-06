import { expect, test } from '@base';
import { assertNoA11yViolations } from '@utils/accessibility';

test.describe('cookie banner', () => {
  test.use({ dismissCookies: false });
  test.setTimeout(60_000);

  test.describe('visibility and interaction', () => {
    test('displays on first load', async ({ homePage }) => {
      await homePage.goto();

      await expect(homePage.cookieBanner.root).toBeVisible();
      await expect(homePage.cookieBanner.heading).toBeVisible();
      await expect(homePage.cookieBanner.description).toBeVisible();
    });

    test('keeps necessary enabled and optional categories on by default', async ({ homePage }) => {
      await homePage.goto();

      await homePage.cookieBanner.openManagePreferences();
      await expect(homePage.cookieBanner.necessary).toBeChecked();
      await expect(homePage.cookieBanner.necessary).toBeDisabled();
      await expect(homePage.cookieBanner.preferences).toBeChecked();
      await expect(homePage.cookieBanner.statistics).toBeChecked();
      await expect(homePage.cookieBanner.marketing).toBeChecked();
    });

    test('accepting cookies hides the banner and sets the consent cookie', async ({ homePage }) => {
      await homePage.goto();

      await homePage.cookieBanner.acceptCookies();

      await expect(homePage.cookieBanner.root).toBeHidden();
      await homePage.cookieBanner.assertCookiesAccepted();
    });

    test('acceptance persists through reload and navigation', async ({ homePage, page }) => {
      await homePage.goto();

      await homePage.cookieBanner.acceptCookies();
      await page.reload();
      await homePage.cookieBanner.assertCookiesAccepted();
      await expect(homePage.cookieBanner.root).toBeHidden();
      await homePage.goto('/cookie-policy/');

      await homePage.cookieBanner.assertCookiesAccepted();
      await expect(homePage.cookieBanner.root).toBeHidden();
    });

    const selections = [
      { name: 'preferences only', preferences: true, statistics: false, marketing: false },
      { name: 'statistics only', preferences: false, statistics: true, marketing: false },
      { name: 'marketing only', preferences: false, statistics: false, marketing: true },
      { name: 'preferences and statistics', preferences: true, statistics: true, marketing: false },
      { name: 'preferences and marketing', preferences: true, statistics: false, marketing: true },
      { name: 'statistics and marketing', preferences: false, statistics: true, marketing: true },
    ];

    for (const { name, ...categories } of selections) {
      test(`saves ${name} and retains the selection after reload`, async ({ homePage, page }) => {
        await homePage.goto();

        await homePage.cookieBanner.openManagePreferences();
        await homePage.cookieBanner.setCategories(categories);
        await expect(homePage.cookieBanner.saveButton).toHaveText('Allow selection');
        await homePage.cookieBanner.saveSelection();
        await homePage.cookieBanner.assertConsentCategories(categories);
        await page.reload();
        await homePage.cookieBanner.assertConsentCategories(categories);
        await expect(homePage.cookieBanner.root).toBeHidden();
      });
    }

    test('rejects all optional categories and retains necessary consent', async ({
      homePage,
      page,
    }) => {
      const categories = { preferences: false, statistics: false, marketing: false };
      await homePage.goto();

      await homePage.cookieBanner.openManagePreferences();
      await homePage.cookieBanner.setCategories(categories);
      await expect(homePage.cookieBanner.rejectButton).toBeVisible();
      await expect(homePage.cookieBanner.rejectButton).toHaveText('Reject');
      await homePage.cookieBanner.saveSelection();
      await homePage.cookieBanner.assertConsentCategories(categories);
      await page.reload();
      await homePage.cookieBanner.assertConsentCategories(categories);
      await expect(homePage.cookieBanner.root).toBeHidden();
    });

    test('clearing cookies causes the banner to reappear', async ({ homePage, context }) => {
      await homePage.goto();

      await homePage.cookieBanner.acceptCookies();
      await expect(homePage.cookieBanner.root).toBeHidden();

      await context.clearCookies({ name: 'CookieConsent' });
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
