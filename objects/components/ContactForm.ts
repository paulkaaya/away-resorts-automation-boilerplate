import { FormBase } from '@components/FormBase';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SharedFormData } from '@utils/formTestData';

export class ContactForm extends FormBase {
  readonly root: Locator;
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly enquiryType: Locator;
  readonly park: Locator;
  readonly comments: Locator;
  readonly secondarySource: Locator;
  readonly emailConsent: Locator;
  readonly phoneConsent: Locator;
  readonly smsConsent: Locator;
  readonly postConsent: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.page.locator('#brochure-form-general-enquiry');
    this.title = this.root.locator('#general_enquiry_Title');
    this.firstName = this.root.locator('[id="general_enquiry_First Name"]');
    this.lastName = this.root.locator('[id="general_enquiry_Last Name"]');
    this.email = this.root.locator('#general_enquiry_Email');
    this.phone = this.root.locator('[id="general_enquiry_Phone Number"]');
    this.enquiryType = this.root.locator('#general_enquiry_enquiry-type');
    this.park = this.root.locator('#general_enquiry_Park');
    this.comments = this.root.locator('#general_enquiry_Comments');
    this.secondarySource = this.root.locator('#general_enquiry_SecondarySource');
    this.emailConsent = this.root.locator('#general_enquiry_Email_Pref');
    this.phoneConsent = this.root.locator('#general_enquiry_Phone_Pref');
    this.smsConsent = this.root.locator('#general_enquiry_SMS_Pref');
    this.postConsent = this.root.locator('#general_enquiry_Post_Pref');
    this.submitButton = this.root.locator('button[type="submit"]');
    this.successMessage = this.page.locator('.response-container').locator('.success-msg');
  }

  /**
   * Verifies the contact response displays the agreed confirmation heading.
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
   * Fills the contact form with the agreed shared data and valid required selections.
   * @param data - Shared contact values.
   * @returns A promise that resolves after the form is populated.
   */
  async fill(data: SharedFormData): Promise<void> {
    await this.title.selectOption({ label: data.title });
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.phone.fill(data.phone);
    await this.enquiryType.selectOption({ label: 'Holiday home Ownership' });
    await this.park.selectOption({ label: 'St Ives Bay' });
    await this.comments.fill('Testing, Please Ignore');
    await this.secondarySource.selectOption({ label: 'Been with you before' });
  }

  /**
   * Asserts required contact fields and submit action are visible.
   * @returns A promise that resolves after the visibility assertions.
   */
  async assertDisplayed(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.title).toBeVisible();
    await expect(this.firstName).toBeVisible();
    await expect(this.lastName).toBeVisible();
    await expect(this.email).toBeVisible();
    await expect(this.phone).toBeVisible();
    await expect(this.enquiryType).toBeVisible();
    await expect(this.park).toBeVisible();
    await expect(this.comments).toBeVisible();
    await expect(this.secondarySource).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.emailConsent).not.toBeChecked();
    await expect(this.phoneConsent).not.toBeChecked();
    await expect(this.smsConsent).not.toBeChecked();
    await expect(this.postConsent).not.toBeChecked();
  }

  /**
   * Asserts the contact fields retain their entered values and optional preferences remain off.
   * @param data - Expected shared contact values.
   * @returns A promise that resolves after the value assertions.
   */
  async assertPopulated(data: SharedFormData): Promise<void> {
    await expect(this.title).toHaveValue(data.title);
    await expect(this.firstName).toHaveValue(data.firstName);
    await expect(this.lastName).toHaveValue(data.lastName);
    await expect(this.email).toHaveValue(data.email);
    await expect(this.phone).toHaveValue(data.phone);
    await expect(this.enquiryType).toHaveValue(/holiday.home.ownership/i);
    await expect(this.park).toHaveValue(/st.ives.bay/i);
    await expect(this.comments).toHaveValue('Testing, Please Ignore');
    await expect(this.secondarySource).toHaveValue(/been.with.you.before/i);
  }

  /**
   * Submits the contact form.
   * @returns A promise that resolves after the submit action.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
