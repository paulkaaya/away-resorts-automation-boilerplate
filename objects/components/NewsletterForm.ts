import { FormBase } from '@components/FormBase';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SharedFormData } from '@utils/formTestData';

export class NewsletterForm extends FormBase {
  readonly root: Locator;
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly parkInterest: Locator;
  readonly parkInterestLabel: Locator;
  readonly secondarySource: Locator;
  readonly holidayInterest: Locator;
  readonly holidayInterestLabel: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.page.locator('#brochure-form-offers-signup');
    this.title = this.root.locator('#offers_signup_Salutations');
    this.firstName = this.root.locator('#offers_signup_FirstName');
    this.lastName = this.root.locator('#offers_signup_LastName');
    this.email = this.root.locator('#offers_signup_Email');
    this.phone = this.root.locator('#offers_signup_Phone');
    this.parkInterest = this.root.locator('#offers_signup_st-ives-bay');
    this.parkInterestLabel = this.root.locator('label[for="offers_signup_st-ives-bay"]');
    this.secondarySource = this.root.locator('#offers_signup_SecondarySource');
    this.holidayInterest = this.root.locator('#InterestedIn_Holidays');
    this.holidayInterestLabel = this.root.locator('label[for="InterestedIn_Holidays"]');
    this.submitButton = this.root.locator('button[type="submit"]');
    this.successMessage = this.page.locator('.response-container').locator('.success-msg');
  }

  /**
   * Verifies the newsletter response displays the agreed confirmation heading.
   * @returns A promise that resolves when the enquiry confirmation is visible.
   */
  async assertSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
    await expect(
      this.successMessage.getByRole('heading', {
        level: 3,
        name: 'Thank you for your enquiry.',
        exact: true,
      })
    ).toBeVisible();
  }

  /**
   * Fills and selects the requested newsletter preferences.
   * @param data - Shared contact values.
   * @returns A promise that resolves after the fields are populated.
   */
  async fill(data: SharedFormData): Promise<void> {
    await this.title.selectOption({ label: data.title });
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.phone.fill(data.phone);
    if (!(await this.parkInterest.isChecked())) {
      await this.parkInterestLabel.click();
    }
    await expect(this.parkInterest).toBeChecked();
    await this.secondarySource.selectOption({ label: 'Been with you before' });
    if (!(await this.holidayInterest.isChecked())) {
      await this.holidayInterestLabel.click();
    }
    await expect(this.holidayInterest).toBeChecked();
  }

  /**
   * Asserts the newsletter fields and submit action are visible.
   * @returns A promise that resolves after the visibility assertions.
   */
  async assertDisplayed(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.title).toBeVisible();
    await expect(this.firstName).toBeVisible();
    await expect(this.lastName).toBeVisible();
    await expect(this.email).toBeVisible();
    await expect(this.phone).toBeVisible();
    await expect(this.parkInterestLabel).toBeVisible();
    await expect(this.secondarySource).toBeVisible();
    await expect(this.holidayInterestLabel).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Asserts newsletter fields and chosen preferences retain their expected values.
   * @param data - Expected shared contact values.
   * @returns A promise that resolves after the value assertions.
   */
  async assertPopulated(data: SharedFormData): Promise<void> {
    await expect(this.title).toHaveValue(data.title);
    await expect(this.firstName).toHaveValue(data.firstName);
    await expect(this.lastName).toHaveValue(data.lastName);
    await expect(this.email).toHaveValue(data.email);
    await expect(this.phone).toHaveValue(data.phone);
    await expect(this.parkInterest).toBeChecked();
    await expect(this.secondarySource).toHaveValue(/been.with.you.before/i);
    await expect(this.holidayInterest).toBeChecked();
  }

  /**
   * Submits the newsletter subscription.
   * @returns A promise that resolves after the submit action.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
