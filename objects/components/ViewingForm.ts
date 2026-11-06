import { FormBase } from '@components/FormBase';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SharedFormData } from '@utils/formTestData';

export class ViewingForm extends FormBase {
  readonly isWideDesktop: boolean;
  readonly sidePanel: Locator;
  readonly viewingTab: Locator;
  readonly mobileTrigger: Locator;
  readonly root: Locator;
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly appointmentDate: Locator;
  readonly previousMonth: Locator;
  readonly nextMonth: Locator;
  readonly calendarDays: Locator;
  readonly selectedDay: Locator;
  readonly submitButton: Locator;
  readonly successPopup: Locator;
  readonly successMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.isWideDesktop = (this.page.viewportSize()?.width ?? 0) > 1366;
    this.sidePanel = this.page.locator('.pp-side-panel.js-ownership-details');
    this.viewingTab = this.sidePanel.locator('.callback').locator('.title').locator('.title-b');
    this.mobileTrigger = this.page.locator('.right-cta.d-xl-none').locator('#arrange_id');
    this.root = this.isWideDesktop ? this.sidePanel : this.page.locator('#arrange-viewing-a-popup');
    this.title = this.root.locator('#ownership_arrange_appointment_Salutations:visible');
    this.firstName = this.root.locator('#first_name:visible');
    this.lastName = this.root.locator('#last_name:visible');
    this.email = this.root.locator('#email:visible');
    this.phone = this.root.locator('#phone:visible');
    this.appointmentDate = this.root.locator('#ownership_arrange_appointment_AppointmentDate');
    this.previousMonth = this.root.locator('.button-previous-month');
    this.nextMonth = this.root.locator('.button-next-month');
    this.calendarDays = this.root.locator('.container__days');
    this.selectedDay = this.calendarDays.locator('.day-item.is-start-date.is-end-date');
    this.submitButton = this.isWideDesktop
      ? this.sidePanel.locator('#arrange-viewing-button')
      : this.root.locator('#request-button:visible');
    this.successPopup = this.page.locator('#success-popup');
    this.successMessages = this.successPopup
      .locator('.popup__inner-messages')
      .locator('.hhs-messages-container');
  }

  /**
   * Verifies the viewing-specific confirmation in the opened success popup.
   * @returns A promise that resolves when viewing success is visible.
   */
  async assertSuccess(): Promise<void> {
    await expect(this.successPopup).toHaveClass(/\bpopup-open\b/);
    await expect(this.successPopup).toBeVisible();
    await expect(this.successMessages.locator('.tick-con')).toBeVisible();
    await expect(this.successMessages.locator('.title')).toHaveText('Arrange a viewing');
    await expect(this.successMessages.locator('.title')).toBeVisible();
  }

  /**
   * Opens the viewing form using the supported control for the current viewport.
   * @returns A promise that resolves when the form is visible.
   */
  async open(): Promise<void> {
    if (this.isWideDesktop) {
      await this.viewingTab.click();
      await expect(this.viewingTab).toHaveClass(/title-active/);
      await this.sidePanel.scrollIntoViewIfNeeded();
      await this.submitButton.scrollIntoViewIfNeeded();
    } else {
      await this.mobileTrigger.click();
    }
    await expect(this.root).toBeVisible();
    await expect(this.firstName).toBeVisible();
  }

  /**
   * Fills viewing contact details while retaining the automatically selected appointment date.
   * @param data - Shared contact values.
   * @returns A promise that resolves after the supported fields are populated.
   */
  async fill(data: SharedFormData): Promise<void> {
    await this.title.selectOption({ label: data.title });
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.phone.fill(data.phone);
  }

  /**
   * Asserts the viewing fields and default Litepicker date are visible.
   * @returns A promise that resolves after the visibility assertions.
   */
  async assertDisplayed(): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.firstName).toBeVisible();
    await expect(this.lastName).toBeVisible();
    await expect(this.email).toBeVisible();
    await expect(this.phone).toBeVisible();
    await expect(this.appointmentDate).toBeAttached();
    await expect(this.appointmentDate).not.toHaveValue('');
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Asserts viewing fields retain their values and the default date is present.
   * @param data - Expected shared contact values.
   * @returns A promise that resolves after the value assertions.
   */
  async assertPopulated(data: SharedFormData): Promise<void> {
    await expect(this.title).toHaveValue(data.title);
    await expect(this.firstName).toHaveValue(data.firstName);
    await expect(this.lastName).toHaveValue(data.lastName);
    await expect(this.email).toHaveValue(data.email);
    await expect(this.phone).toHaveValue(data.phone);
    await expect(this.appointmentDate).not.toHaveValue('');
  }

  /**
   * Submits the viewing request without changing the date picker.
   * @returns A promise that resolves after the submit action.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
