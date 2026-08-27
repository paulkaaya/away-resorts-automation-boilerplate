import { expect, test } from '@base';
import { HeaderMenuItem } from '@components/HeaderNavigation';

test.describe('header navigation', () => {
  test('site logo navigates back to the homepage', async ({ homePage, page }) => {
    await homePage.goto();

    await homePage.header.menuLinks.first().click();
    await expect(page).not.toHaveURL('/');

    await homePage.header.logo.click();
    await expect(page).toHaveURL('/');
  });

  test('log in link opens the login modal', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.header.loginModal).toHaveClass(/popup--hidden/);

    await homePage.header.openLoginModal();
  });

  test('mega menu opens on hover and shows its child links', async ({ homePage }) => {
    await homePage.goto();

    const menuItem = new HeaderMenuItem(homePage.header.menuItems.first());

    await menuItem.openItem(menuItem);

    await expect(menuItem.childrenLinks.first()).toBeVisible();
  });

  test('direct and nested nav links do not 404', async ({ homePage, request }) => {
    await homePage.goto();

    const directHrefs = await homePage.header.menuLinks.evaluateAll(links =>
      (links as HTMLAnchorElement[]).map(link => link.href)
    );

    const menuItemCount = await homePage.header.menuItems.count();
    const nestedHrefs: string[] = [];

    for (let itemIndex = 0; itemIndex < menuItemCount; itemIndex++) {
      const menuItem = new HeaderMenuItem(homePage.header.menuItems.nth(itemIndex));
      await menuItem.openItem(menuItem);

      const childHrefs = await menuItem.childrenLinks.evaluateAll(links =>
        (links as HTMLAnchorElement[]).map(link => link.href)
      );
      nestedHrefs.push(...childHrefs);
    }

    const uniqueHrefs = [...new Set([...directHrefs, ...nestedHrefs])].filter(href =>
      href.startsWith('http')
    );

    for (const href of uniqueHrefs) {
      const response = await request.get(href);
      expect.soft(response.status(), href).toBeLessThan(400);
    }
  });
});
