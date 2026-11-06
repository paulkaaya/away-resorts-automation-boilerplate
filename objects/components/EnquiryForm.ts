import { FormBase } from '@components/FormBase';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SharedFormData } from '@utils/formTestData';

export class EnquiryForm extends FormBase {
  readonly trigger: Locator;
  readonly root: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly dialCode: Locator;
  readonly marketingConsent: Locator;
  readonly submitButton: Locator;
  readonly successContainer: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.trigger = this.page.locator('button[name="make-an-enquiry"]');
    this.root = this.page.locator('.quick-enquiry__form');
    this.firstName = this.root.locator('#first_name');
    this.lastName = this.root.locator('#last_name');
    this.email = this.root.locator('#email');
    this.phone = this.root.locator('#phone');
    this.dialCode = this.root.locator('[data-dial-code="44"]');
    this.marketingConsent = this.root.locator('#consent');
    this.submitButton = this.root.locator('button[type="submit"]');
    this.successContainer = this.page.locator('.quick-enquiry');
    this.successMessage = this.successContainer.getByRole('heading', {
      level: 3,
      name: 'Thank you!',
      exact: true,
    });
  }

  /**
   * Verifies the enquiry modal enters its confirmed success state.
   * @returns A promise that resolves when the thank-you message is visible.
   */
  async assertSuccess(): Promise<void> {
    await expect(this.successContainer).toHaveClass(/(?:^|\s)-success(?:\s|$)/);
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Opens the make-an-enquiry modal.
   * @returns A promise that resolves when the form becomes visible.
   */
  async open(): Promise<void> {
    await this.trigger.click();
    await expect(this.root).toBeVisible();
  }

  /**
   * Fills enquiry details and leaves the default phone code and marketing consent unchanged.
   * @param data - Shared contact values.
   * @returns A promise that resolves after the fields are populated.
   */
  async fill(data: SharedFormData): Promise<void> {
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.phone.fill(data.phone.replace(/^0/, ''));
  }

  /**
   * Asserts the enquiry modal fields and submit action are visible.
   * @returns A promise that resolves after the visibility assertions.
   */
  async assertDisplayed(): Promise<void> {
    await expect(this.firstName).toBeVisible();
    await expect(this.lastName).toBeVisible();
    await expect(this.email).toBeVisible();
    await expect(this.phone).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.marketingConsent).not.toBeChecked();
    await expect(this.dialCode).toHaveCount(1);
  }

  /**
   * Asserts enquiry fields retain their entered values and optional consent remains off.
   * @param data - Expected shared contact values.
   * @returns A promise that resolves after the value assertions.
   */
  async assertPopulated(data: SharedFormData): Promise<void> {
    await expect(this.firstName).toHaveValue(data.firstName);
    await expect(this.lastName).toHaveValue(data.lastName);
    await expect(this.email).toHaveValue(data.email);
    await expect
      .poll(async () => (await this.phone.inputValue()).replace(/\s+/g, ''))
      .toBe(data.phone.replace(/^0/, ''));
    await expect(this.marketingConsent).not.toBeChecked();
  }

  /**
   * Submits the make-an-enquiry form.
   * @returns A promise that resolves after the submit action.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
