import { expect, test } from '@base';

const notFoundPath = '/playwright-404-check-not-found-route-20261106/';

test.describe('global seo', () => {
  test('robots.txt is reachable and references the sitemap', async ({ request, envManager }) => {
    const response = await request.get(envManager.getValue('robotsTxt'));

    expect(response.status(), "robots.txt doesn't exist").toBe(200);

    const body = await response.text();

    expect(body).toContain('User-agent');
    expect(body.toLowerCase()).toContain(envManager.getValue('baseUrl').toLowerCase());
  });

  test('xml sitemap', async ({ page, envManager }) => {
    const baseURL = envManager.getValue('baseUrl');
    const sitemapInstance = '<loc>' + baseURL;
    const sitemapURL = envManager.getValue('xmlSitemapUrl');
    const counter = page.getByText('<url>');
    const baseURLOccurrences = page.getByText(sitemapInstance);

    const response = await page.goto(sitemapURL);

    expect(response?.status(), "Sitemap.xml doesn't exist at /sitemap.xml").toBe(200);
    await expect(
      counter,
      "There's a mismatch of URL counts. Are some URLs using the wrong domain?"
    ).toHaveCount(await baseURLOccurrences.count());
  });

  test('unknown homepage route returns a styled 404 page with recovery', async ({
    homePage,
    notFoundPage,
    page,
  }) => {
    const notFoundUrl = new URL(notFoundPath, homePage.url).toString();
    const response = await page.goto(notFoundUrl);

    expect(response?.status(), 'Unknown route should return an HTTP 404 response').toBe(404);

    await notFoundPage.verifyNotFoundContent();

    await notFoundPage.checkHeaderVisible();
    await notFoundPage.checkFooterVisible();

    await notFoundPage.clickReturnToHomepage();
    await expect(page).toHaveURL(new URL(homePage.url).toString());
  });

  test('https implementation', async ({ basePage, request }) => {
    const response = await request.get(basePage.url);
    expect(response.headers()['strict-transport-security']).toBeTruthy();
  });
});
