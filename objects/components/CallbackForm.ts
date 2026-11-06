import { FormBase } from '@components/FormBase';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SharedFormData } from '@utils/formTestData';
import { callbackInterest } from '@utils/formTestData';

export class CallbackForm extends FormBase {
  readonly isWideDesktop: boolean;
  readonly sidePanel: Locator;
  readonly callbackTab: Locator;
  readonly mobileTrigger: Locator;
  readonly root: Locator;
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly interest: Locator;
  readonly marketingConsent: Locator;
  readonly submitButton: Locator;
  readonly closeButton: Locator;
  readonly successPopup: Locator;
  readonly successMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.isWideDesktop = (this.page.viewportSize()?.width ?? 0) > 1366;
    this.sidePanel = this.page.locator('.pp-side-panel.js-ownership-details');
    this.callbackTab = this.sidePanel.locator('.callback').locator('.title').locator('.title-a');
    this.mobileTrigger = this.page.locator('.right-cta.d-xl-none').locator('#call_id');
    this.root = this.isWideDesktop
      ? this.sidePanel
      : this.page.locator('#request-callback-form-a-popup');
    this.title = this.root.locator('#ownership_arrange_appointment_Salutations:visible');
    this.firstName = this.root.locator('#first_name:visible');
    this.lastName = this.root.locator('#last_name:visible');
    this.email = this.root.locator('#email:visible');
    this.phone = this.root.locator('#phone:visible');
    this.interest = this.root.locator('#Interest:visible');
    this.marketingConsent = this.root.locator('#ownership-label:visible');
    this.submitButton = this.isWideDesktop
      ? this.sidePanel.locator('#request-callback-button')
      : this.root.locator('#request-button:visible');
    this.closeButton = this.page.locator('.popup__close-hhs.button--icon-hhs.js-close-popup');
    this.successPopup = this.page.locator('#success-popup');
    this.successMessages = this.successPopup
      .locator('.popup__inner-messages')
      .locator('.hhs-messages-container');
  }

  /**
   * Verifies the callback-specific confirmation in the opened success popup.
   * @returns A promise that resolves when callback success is visible.
   */
  async assertSuccess(): Promise<void> {
    await expect(this.successPopup).toHaveClass(/\bpopup-open\b/);
    await expect(this.successPopup).toBeVisible();
    await expect(this.successMessages.locator('.tick-con')).toBeVisible();
    await expect(this.successMessages.locator('.title')).toHaveText('Arrange a callback');
    await expect(this.successMessages.locator('.title')).toBeVisible();
  }

  /**
   * Opens the callback form using the supported control for the current viewport.
   * @returns A promise that resolves when the form is visible.
   */
  async open(): Promise<void> {
    if (this.isWideDesktop) {
      await this.callbackTab.click();
      await expect(this.callbackTab).toHaveClass(/title-active/);
      await this.sidePanel.scrollIntoViewIfNeeded();
      await this.submitButton.scrollIntoViewIfNeeded();
    } else {
      await this.mobileTrigger.click();
    }
    await expect(this.root).toBeVisible();
    await expect(this.firstName).toBeVisible();
  }

  /**
   * Fills callback contact details without changing the optional marketing preference.
   * @param data - Shared contact values.
   * @returns A promise that resolves after all supported fields are populated.
   */
  async fill(data: SharedFormData): Promise<void> {
    await this.title.selectOption({ label: data.title });
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.phone.fill(data.phone);
    await this.interest.fill(callbackInterest);
  }

  /**
   * Asserts the callback form's fields are visible.
   * @returns A promise that resolves after the visibility assertions.
   */
  async assertDisplayed(): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.firstName).toBeVisible();
    await expect(this.lastName).toBeVisible();
    await expect(this.email).toBeVisible();
    await expect(this.phone).toBeVisible();
    await expect(this.interest).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.marketingConsent).not.toBeChecked();
  }

  /**
   * Asserts callback fields retain their entered values.
   * @param data - Expected shared contact values.
   * @returns A promise that resolves after the value assertions.
   */
  async assertPopulated(data: SharedFormData): Promise<void> {
    await expect(this.title).toHaveValue(data.title);
    await expect(this.firstName).toHaveValue(data.firstName);
    await expect(this.lastName).toHaveValue(data.lastName);
    await expect(this.email).toHaveValue(data.email);
    await expect(this.phone).toHaveValue(data.phone);
    await expect(this.interest).toHaveValue(callbackInterest);
    await expect(this.marketingConsent).not.toBeChecked();
  }

  /**
   * Submits the callback request.
   * @returns A promise that resolves after the submit action.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
