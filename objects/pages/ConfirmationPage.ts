import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export class ConfirmationPage extends BasePage {
  readonly confirmationHeading: Locator;
  readonly bookingReference: Locator;
  readonly loginLink: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);

    this.url = `${this.baseUrl}/book/success`;
    this.confirmationHeading = this.page.getByRole('heading', { name: /You're all booked/ });
    this.bookingReference = this.page.getByRole('heading', { level: 4, name: /^Ref:/ });
    this.loginLink = this.page.getByRole('link', { name: /Log in/ });
  }
}
