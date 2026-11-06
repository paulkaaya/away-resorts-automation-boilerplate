import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export interface GuestDetails {
  title?: string;
  firstName: string;
  secondName: string;
  email: string;
  postcode: string;
  addressLine1: string;
  town: string;
  country: string;
  telephone: string;
}

export class DetailsPage extends BasePage {
  readonly detailsForm: Locator;
  readonly title: Locator;
  readonly firstName: Locator;
  readonly secondName: Locator;
  readonly email: Locator;
  readonly postcode: Locator;
  readonly manualAddressLink: Locator;
  readonly addressLine1: Locator;
  readonly town: Locator;
  readonly country: Locator;
  readonly telephone: Locator;
  readonly source: Locator;
  readonly proceedButton: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);

    this.url = `${this.baseUrl}/book/guests`;
    this.detailsForm = this.page.locator('#guests-form');
    this.title = this.page.locator('#salutation');
    this.firstName = this.page.locator('#first_name');
    this.secondName = this.page.locator('#second_name');
    this.email = this.page.locator('#email');
    this.postcode = this.page.locator('#address-postcode');
    this.manualAddressLink = this.page.locator('[data-target-id="manual-address-fields"]');
    this.addressLine1 = this.page.locator('#address-line1');
    this.town = this.page.locator('#address-town');
    this.country = this.page.locator('#address-country');
    this.telephone = this.page.locator('#phone');
    this.source = this.page.locator('#source');
    this.proceedButton = this.page.getByRole('button', { name: /Proceed to Payment/ });
  }

  /**
   * Fills guest details using the manual address fields rather than address suggestions.
   * @param details - Guest contact and address details.
   * @returns A promise that resolves once the form fields have been filled.
   */
  async fillDetails(details: GuestDetails): Promise<void> {
    await this.title.selectOption({ label: details.title ?? 'Mr' });
    await this.firstName.fill(details.firstName);
    await this.secondName.fill(details.secondName);
    await this.email.fill(details.email);
    await this.manualAddressLink.click();
    await this.postcode.fill(details.postcode);
    await this.addressLine1.fill(details.addressLine1);
    await this.town.fill(details.town);
    await this.country.selectOption({ label: details.country });
    await this.telephone.fill(details.telephone);
    await this.source.selectOption({ label: 'National Advertising' });
  }

  /**
   * Submits guest details and continues to checkout.
   * @returns A promise that resolves after checkout navigation starts.
   */
  async proceedToPayment(): Promise<void> {
    await this.proceedButton.click();
  }
}
