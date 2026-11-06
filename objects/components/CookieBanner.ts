import { expect, type Locator, type Page } from '@playwright/test';

export type CookieCategories = {
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
};

export class CookieBanner {
  readonly page: Page;
  readonly rootSelector: string;
  readonly root: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  readonly acceptButton: Locator;
  readonly manageLink: Locator;
  readonly necessary: Locator;
  readonly preferences: Locator;
  readonly statistics: Locator;
  readonly marketing: Locator;
  readonly saveButton: Locator;
  readonly rejectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rootSelector = '#CybotCookiebotDialog';
    this.root = this.page.locator(this.rootSelector);

    this.heading = this.root.locator('#CybotCookiebotDialogBodyContentTitle');
    this.description = this.root.locator('#CybotCookiebotDialogBodyContentText');
    this.acceptButton = this.root.getByRole('button', { name: 'Allow all', exact: true });
    this.manageLink = this.root.locator('#CybotCookiebotDialogNavDetails');
    this.necessary = this.root.locator('#CybotCookiebotDialogBodyLevelButtonNecessaryInline');
    this.preferences = this.root.locator('#CybotCookiebotDialogBodyLevelButtonPreferencesInline');
    this.statistics = this.root.locator('#CybotCookiebotDialogBodyLevelButtonStatisticsInline');
    this.marketing = this.root.locator('#CybotCookiebotDialogBodyLevelButtonMarketingInline');
    this.saveButton = this.root.locator(
      '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection'
    );
    this.rejectButton = this.root.locator('#CybotCookiebotDialogBodyButtonDecline');
  }

  /**
   * Accepts all categories and waits for the blocking overlay to close.
   * @returns A promise that resolves once the click has completed.
   */
  async acceptCookies(): Promise<void> {
    await this.acceptButton.click();
    await expect(this.root).toBeHidden();
    await this.assertCookiesAccepted();
  }

  /**
   * Opens the Details tab containing individual category switches.
   * @returns A promise that resolves once the click has completed.
   */
  async openManagePreferences(): Promise<void> {
    await this.manageLink.click();
    await expect(this.preferences).toBeVisible();
  }

  /**
   * Sets optional categories explicitly, leaving Necessary enabled.
   * @param categories - The desired optional consent categories.
   * @returns A promise that resolves after the switches are updated.
   */
  async setCategories(categories: CookieCategories): Promise<void> {
    await this.preferences.setChecked(categories.preferences);
    await this.statistics.setChecked(categories.statistics);
    await this.marketing.setChecked(categories.marketing);
  }

  /**
   * Saves the visible Allow selection or Reject action without accepting other categories.
   * @returns A promise that resolves after the dialog closes.
   */
  async saveSelection(): Promise<void> {
    await this.root
      .getByRole('button', { name: /^(?:Allow selection|Reject)$/ })
      .filter({ visible: true })
      .click();
    await expect(this.root).toBeHidden();
  }

  /**
   * Reads known fields from Cookiebot's non-JSON cookie without evaluating its contents.
   * @returns Saved categories and method, or undefined before consent exists.
   */
  async getConsent(): Promise<
    (CookieCategories & { necessary: boolean; method: string }) | undefined
  > {
    const cookies = await this.page.context().cookies(this.page.url());
    const cookie = cookies.find(candidate => candidate.name === 'CookieConsent');
    if (!cookie) return undefined;
    const value = decodeURIComponent(cookie.value);
    const booleanValue = (key: string): boolean => {
      const match = value.match(
        new RegExp(`(?:^|[,\\{])\\s*["']?${key}["']?\\s*:\\s*(true|false)(?=\\s*[,}])`)
      );
      if (!match) throw new Error(`CookieConsent is missing a boolean ${key} field`);
      return match[1] === 'true';
    };
    const method = value.match(/(?:^|[,{])\s*["']?method["']?\s*:\s*['"]([^'"]+)['"]/);
    return {
      necessary: booleanValue('necessary'),
      preferences: booleanValue('preferences'),
      statistics: booleanValue('statistics'),
      marketing: booleanValue('marketing'),
      method: method?.[1] ?? '',
    };
  }

  /**
   * Waits for stored consent to match the requested categories and explicit save method.
   * @param categories - Expected optional category values; Necessary is always true.
   * @returns A promise that resolves when the cookie matches.
   */
  async assertConsentCategories(categories: CookieCategories): Promise<void> {
    await expect
      .poll(() => this.getConsent())
      .toEqual({ necessary: true, ...categories, method: 'explicit' });
  }

  /**
   * Verifies all categories were saved by Allow all.
   * @returns A promise that resolves once the assertion has been made.
   */
  async assertCookiesAccepted(): Promise<void> {
    await this.assertConsentCategories({ preferences: true, statistics: true, marketing: true });
  }
}
