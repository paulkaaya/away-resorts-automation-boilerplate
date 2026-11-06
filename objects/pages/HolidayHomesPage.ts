import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export class HolidayHomesPage extends BasePage {
  readonly searchTab: Locator;
  readonly searchModal: Locator;
  readonly locationToggle: Locator;
  readonly regions: Locator;
  readonly stIvesBay: Locator;
  readonly tattershallLakes: Locator;
  readonly findHolidayHomes: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);
    this.url = `${this.baseUrl}/holiday-homes/`;
    this.searchTab = this.page.locator(
      '.search-bar__fields[data-search-tab="holiday-home-search-tab"]'
    );
    this.searchModal = this.page.locator('.search-widget-popup__box');
    this.locationToggle = this.searchModal.locator('#swp-location-label');
    this.regions = this.searchModal.locator('.search-widget-popup__regions');
    this.stIvesBay = this.regions.locator('input[data-park-id="20"]');
    this.tattershallLakes = this.regions.locator('input[data-park-id="7"]');
    this.findHolidayHomes = this.searchModal.locator(
      'button[type="submit"]#swp-holiday-homes-button'
    );
  }

  /**
   * Opens the holiday-home search modal.
   * @returns A promise that resolves when the search modal is visible.
   */
  async openSearch(): Promise<void> {
    await this.searchTab.click();
    await expect(this.searchModal).toBeVisible();
  }

  /**
   * Selects both stable test parks and opens the matching current listings.
   * @returns A promise that resolves after the listings page is reached.
   */
  async searchSelectedParks(): Promise<void> {
    await this.locationToggle.click();
    await this.stIvesBay.click();
    await this.tattershallLakes.click();
    await expect(this.stIvesBay).toHaveAttribute('aria-checked', 'true');
    await expect(this.tattershallLakes).toHaveAttribute('aria-checked', 'true');
    await this.locationToggle.click();
    await this.findHolidayHomes.click();
    await expect(this.page).toHaveURL(/\/holiday-homes\/caravans-for-sale\//);
  }
}
