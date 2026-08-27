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

  test('carousel dot navigation moves to the corresponding slide', async ({ homePage }) => {
    await homePage.goto();

    await homePage.pauseCarousel();

    const dotCount = await homePage.sliderDots.count();

    for (let dotIndex = 0; dotIndex < dotCount; dotIndex++) {
      await homePage.sliderDots.nth(dotIndex).click();

      const { position } = await homePage.getActiveSlidePosition();

      expect(position).toBe(dotIndex + 1);
      await expect(homePage.sliderDots.nth(dotIndex)).toHaveClass(
        /swiper-pagination-bullet-active/
      );
      await expect(homePage.activeHeroSlide).toHaveCount(1);
    }
  });
});

test.describe('homepage content links', () => {
  test('main content links do not 404 @regression', async ({ homePage, request }) => {
    await homePage.goto();

    const hrefs = await homePage.mainContentLinks.evaluateAll(links =>
      (links as HTMLAnchorElement[]).map(link => link.href).filter(href => href.startsWith('http'))
    );

    const uniqueHrefs = [...new Set(hrefs)];

    for (const href of uniqueHrefs) {
      const response = await request.get(href);
      expect.soft(response.status(), href).toBeLessThan(400);
    }
  });
});

test.describe('booking bar', () => {
  test('holidays tab is selected by default with correct field defaults', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.heroBookingBar.locationField).toHaveText('Choose your parks');
    await expect(homePage.heroBookingBar.datesField).toHaveText('Select dates');
    await expect(homePage.heroBookingBar.guestsField).toHaveText('2 Adults');
    await expect(homePage.heroBookingBar.submitButton).toBeVisible();
  });

  test('touring & camping tab shows the same fields', async ({ homePage }) => {
    await homePage.goto();

    await homePage.heroBookingBar.touringTab.click();

    await expect(homePage.heroBookingBar.locationField).toBeVisible();
    await expect(homePage.heroBookingBar.datesField).toBeVisible();
    await expect(homePage.heroBookingBar.guestsField).toBeVisible();
  });

  test('holiday homes for sale link routes correctly', async ({ homePage, page }) => {
    await homePage.goto();

    await homePage.heroBookingBar.hhsLink.click();

    await expect(page).toHaveURL(/holiday-homes/);
  });
});
