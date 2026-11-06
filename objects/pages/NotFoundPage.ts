import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export class NotFoundPage extends BasePage {
  readonly errorHeading: Locator;
  readonly errorDescription: Locator;
  readonly returnToHomepage: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);
    this.errorHeading = this.page.getByRole('heading', {
      level: 3,
      name: "We're having a holiday meltdown!",
    });
    this.errorDescription = this.page.getByText(
      "This page can't be found right now, we're sorry.",
      {
        exact: true,
      }
    );
    this.returnToHomepage = this.page.getByRole('link', { name: 'Return to homepage' });
  }

  /**
   * Asserts the not-found page's key message and home recovery link.
   * @returns A promise that resolves once the assertions have been made.
   */
  async verifyNotFoundContent(): Promise<void> {
    await expect(this.h1).toHaveText('404');
    await expect(this.errorHeading).toBeVisible();
    await expect(this.errorDescription).toBeVisible();
    await expect(this.returnToHomepage).toHaveAttribute('href', '/');
  }

  /**
   * Follows the not-found page's recovery link to the homepage.
   * @returns A promise that resolves once navigation has completed.
   */
  async clickReturnToHomepage(): Promise<void> {
    await this.returnToHomepage.click();
  }
}
