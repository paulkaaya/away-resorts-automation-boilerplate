import type { Locator, Page } from '@playwright/test';

export class FooterNav {
  readonly page: Page;
  readonly footerSelector: string;
  readonly section: Locator;
  readonly columns: Locator;
  readonly socialLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    this.footerSelector = 'footer';
    this.section = this.page.locator(this.footerSelector);
    this.columns = this.section.locator('.site-footer__links');
    this.socialLinks = this.section.locator('.site-footer__info');
  }

  /**
   * Returns a footer CMS-link column title by its visible text.
   * @param title - The visible text of the column title.
   * @returns A Locator for the matching footer column title.
   */
  getColumnTitle(title: string): Locator {
    return this.getColumn(title).locator('p');
  }

  /**
   * Returns the CMS-link accordion title for the specified column.
   * @param title - The accessible name of the column's accordion title.
   * @returns A Locator for the matching accordion title.
   */
  getColumnToggle(title: string): Locator {
    return this.getColumn(title).getByRole('link', { name: title, exact: true });
  }

  /**
   * Returns a social link by its accessible name.
   * @param name - The accessible name of the social link.
   * @returns A Locator for the matching social link.
   */
  getSocialLink(name: string): Locator {
    return this.socialLinks.getByRole('link', { name, exact: true });
  }

  /**
   * Opens the specified footer column's mobile accordion.
   * @param title - The accessible name of the column's accordion title.
   * @returns A promise that resolves when the column is expanded.
   */
  async openColumn(title: string): Promise<void> {
    const toggle = this.getColumnToggle(title);
    await toggle.click();
  }

  /**
   * Returns the footer CMS-link column associated with the specified title.
   * @param title - The visible text of the column title.
   * @returns A Locator for the matching footer column.
   */
  getColumn(title: string): Locator {
    return this.columns.filter({
      has: this.page.locator('p').filter({ hasText: new RegExp(`^${title}$`) }),
    });
  }

  /**
   * Returns CMS-managed, same-site footer links.
   * @returns A Locator matching the footer's CMS links.
   */
  getCmsLinks(): Locator {
    return this.columns.locator('.expandable-sm-down').locator('a[href]');
  }
}
