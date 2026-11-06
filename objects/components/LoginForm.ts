import { FormBase } from '@components/FormBase';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { BookingState } from '@utils/bookingState';

export class LoginForm extends FormBase {
  readonly root: Locator;
  readonly bookingReference: Locator;
  readonly surname: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.page.locator('#login-popup');
    this.bookingReference = this.root.locator('#booking_reference');
    this.surname = this.root.locator('#surname');
    this.submitButton = this.root.locator('button[type="submit"]');
  }

  /**
   * Asserts that the navigation login popup and its fields are visible.
   * @returns A promise that resolves after the visibility assertions.
   */
  async assertDisplayed(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.bookingReference).toBeVisible();
    await expect(this.surname).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Enters an environment-specific booking reference and surname.
   * @param bookingState - The selected environment's saved booking state.
   * @returns A promise that resolves after credentials are filled.
   */
  async fill(bookingState: BookingState): Promise<void> {
    await this.bookingReference.fill(bookingState.reference);
    await this.surname.fill(bookingState.surname);
  }

  /**
   * Submits the login form.
   * @returns A promise that resolves after the submit action.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
