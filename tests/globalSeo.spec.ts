import { expect, test } from '@base';

test.describe('global seo', () => {
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

  test('404', async ({ page }) => {
    const response = await page.goto('/abcdefg');

    expect(response?.status(), `No 404 response code, does this page exist?`).toBe(404);
  });

  test('https implementation', async ({ basePage, request }) => {
    const response = await request.get(basePage.url);
    expect(response.headers()['strict-transport-security']).toBeTruthy();
  });
});
