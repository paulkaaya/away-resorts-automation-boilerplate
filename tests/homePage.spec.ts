import { expect, test } from '@base';

test.describe('hero banner', () => {
  test('hero banner is visible', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.heroBlock).toBeVisible();
  });

  test('hero banner has at least one CTA', async ({ homePage }) => {
    await homePage.goto();

    await homePage.pauseCarousel();

    await expect(homePage.heroCtas.first()).toBeVisible();
    await expect(homePage.heroCtas.first()).toBeEnabled();
  });

  test('hero banner CTA navigates to the correct page', async ({ homePage, page }) => {
    await homePage.goto();

    await homePage.pauseCarousel();

    await homePage.heroCtas.first().click();

    await expect(page).not.toHaveURL('/');
  });
});
