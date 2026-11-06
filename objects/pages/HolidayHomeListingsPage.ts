import { LiveChatWidget } from '@components/LiveChatWidget';
import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export class HolidayHomeListingsPage extends BasePage {
  readonly liveChat: LiveChatWidget;
  readonly productCards: Locator;
  readonly firstDetailsLink: Locator;
  readonly emptyResults: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);
    this.liveChat = new LiveChatWidget(page);
    this.url = `${this.baseUrl}/holiday-homes/caravans-for-sale/`;
    this.productCards = this.page.locator('div.product-card');
    this.firstDetailsLink = this.productCards.first().locator('a.details-button');
    this.emptyResults = this.page
      .locator('p.mb-8')
      .getByText(
        'Oh dear, there are no holiday homes that meet that criteria. Please amend your search options to see more availability.',
        { exact: true }
      );
  }

  /**
   * Waits for either current inventory or the site's explicit empty-results message.
   * @returns A promise that resolves once one result state is visible.
   */
  async assertResultsLoaded(): Promise<void> {
    await expect(this.productCards.first().or(this.emptyResults).first()).toBeVisible();
    await expect(this.productCards.first().or(this.emptyResults)).toBeVisible();
    await expect(this.productCards.first()).toBeVisible();
  }

  /**
   * Opens the first currently listed holiday home.
   * @returns A promise that resolves after navigation to the detail page.
   */
  async openFirstHome(): Promise<void> {
    await this.assertResultsLoaded();
    await this.liveChat.minimizeIfVisible();
    await this.firstDetailsLink.click();
    await expect(this.page).toHaveURL(/\/holiday-homes\/caravans-for-sale\/[^/]+/);
    await this.liveChat.minimizeIfVisible();
  }
}
