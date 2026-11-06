import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export class ExtrasPage extends BasePage {
  readonly extras: Locator;
  readonly addButtons: Locator;
  readonly continueButton: Locator;
  readonly skipButton: Locator;
  readonly holidaySummary: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);

    this.url = `${this.baseUrl}/book/extras`;
    this.extras = this.page.getByRole('main');
    this.addButtons = this.extras.getByRole('button', { name: 'Add', exact: true });
    this.continueButton = this.page.getByRole('button', { name: /Continue booking/ });
    this.skipButton = this.page.getByRole('button', { name: 'Skip', exact: true });
    this.holidaySummary = this.page.getByRole('heading', { name: 'Your holiday' });
  }

  /**
   * Continues from extras to the guest details step.
   * @returns A promise that resolves after the next step is opened.
   */
  async continueBooking(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Skips extras without adding an optional product.
   * @returns A promise that resolves after the next step is opened.
   */
  async skipExtras(): Promise<void> {
    await this.skipButton.click();
  }
}
