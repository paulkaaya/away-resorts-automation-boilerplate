import { expect, test } from '@base';

const footerColumnTitles = ['Why choose us', 'About us', 'Ownership', 'Support'];

const socialLinks = {
  Facebook: 'https://www.facebook.com/AwayResortsHolidays',
  Twitter: 'https://x.com/AwayResortsUK',
  Instagram: 'https://www.instagram.com/awayresortsholidays/',
  YouTube: 'https://www.youtube.com/user/familyholidays',
};

test.describe('footer navigation', () => {
  test('footer displays', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.footer.section).toBeVisible();
  });

  test('cms footer links respond successfully on the current domain', async ({
    homePage,
    request,
  }) => {
    await homePage.goto();

    const cmsLinks = homePage.footer.getCmsLinks();
    await expect(cmsLinks, 'footer has no CMS links').not.toHaveCount(0);
    const hrefs = await cmsLinks.evaluateAll(links =>
      (links as HTMLAnchorElement[]).map(link => link.href)
    );

    const uniqueHrefs = [...new Set(hrefs)];
    for (const href of uniqueHrefs) {
      expect.soft(new URL(href).origin, href).toBe(new URL(homePage.baseUrl).origin);

      const response = await request.get(href);
      expect.soft(response.status(), href).toBeLessThan(400);
    }
  });

  test('social links have the expected external destinations', async ({ homePage }) => {
    await homePage.goto();

    for (const [name, href] of Object.entries(socialLinks)) {
      await expect.soft(homePage.footer.getSocialLink(name)).toHaveAttribute('href', href);
    }
  });

  test.describe('mobile', { tag: ['@mobile'] }, () => {
    test('footer displays all CMS-link accordion titles', async ({ homePage }) => {
      await homePage.goto();

      for (const title of footerColumnTitles) {
        await expect.soft(homePage.footer.getColumnToggle(title)).toBeVisible();
      }
    });

    test('cms-link columns open as accordions', async ({ homePage }) => {
      await homePage.goto();

      for (const title of footerColumnTitles) {
        const links = homePage.footer
          .getColumn(title)
          .locator('.expandable-sm-down')
          .getByRole('link');
        await expect(links.first()).toBeHidden();

        await homePage.footer.openColumn(title);
        await expect(links.first()).toBeVisible();
      }
    });
  });

  test.describe('desktop', { tag: ['@desktop'] }, () => {
    test('footer displays all CMS-link column titles', async ({ homePage }) => {
      await homePage.goto();

      for (const title of footerColumnTitles) {
        await expect.soft(homePage.footer.getColumnTitle(title)).toBeVisible();
      }
    });
  });
});
