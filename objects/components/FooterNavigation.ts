import type { Locator, Page } from '@playwright/test';

export class FooterNav {
  readonly page: Page;
  readonly section: Locator;
  readonly topSection: Locator;
  readonly logo: Locator;
  readonly logoLink: Locator;
  readonly socialLinks: Locator;
  readonly columnOne: Locator;
  readonly columnTwo: Locator;
  readonly columnThree: Locator;
  readonly bottomSection: Locator;
  readonly bottomLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    this.section = this.page.locator('footer');
    this.topSection = this.section.getByTestId('footer-upper-section');
    this.logo = this.topSection.getByTestId('footer-logo-section');
    this.logoLink = this.logo.locator('a', { has: this.page.locator('img') });
    this.socialLinks = this.topSection.getByTestId('footer-logo-social');
    this.columnOne = this.topSection.getByTestId('footer-links-section').first();
    this.columnTwo = this.topSection.getByTestId('footer-links-section').nth(1);
    this.columnThree = this.topSection.getByTestId('footer-content-section');
    this.bottomSection = this.section.getByTestId('footer-lower-section');
    this.bottomLinks = this.bottomSection.locator('a');
  }

  /**
   * Returns the links within the given footer column.
   * @param column - The Locator for the footer column to read links from.
   * @returns A promise resolving to a Locator matching the column's links.
   */
  async getColumnLinks(column: Locator): Promise<Locator> {
    return column.locator('a');
  }
}
