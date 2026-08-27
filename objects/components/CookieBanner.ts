import { expect, type Locator, type Page } from '@playwright/test';

export class CookieBanner {
  readonly page: Page;
  readonly rootSelector: string;
  readonly root: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  readonly acceptButton: Locator;
  readonly manageLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rootSelector = '[id="cookie-banner"]';
    this.root = this.page.locator(this.rootSelector);

    this.heading = this.root.getByRole('heading', {
      name: 'We use cookies to improve your experience',
    });
    this.description = this.root.locator('.-small');
    this.acceptButton = this.root.locator('.js-accept-cookies');
    this.manageLink = this.root.locator('.button--secondary');
  }

  /**
   * Clicks "I agree" to accept cookies.
   * @returns A promise that resolves once the click has completed.
   */
  async acceptCookies(): Promise<void> {
    await this.acceptButton.click();
  }

  /**
   * Clicks "Manage" to open the cookie preferences modal.
   * @returns A promise that resolves once the click has completed.
   */
  async openManagePreferences(): Promise<void> {
    await this.manageLink.click();
  }

  /**
   * Asserts that the `accepted-cookies` cookie has been set to `true` in the current context.
   * @returns A promise that resolves once the assertion has been made.
   */
  async assertCookiesAccepted(): Promise<void> {
    const cookies = await this.page.context().cookies();
    const acceptedCookie = cookies.find(cookie => cookie.name === 'accepted-cookies');

    expect(acceptedCookie?.value).toBe('true');
  }
}
