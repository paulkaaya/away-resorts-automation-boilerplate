import { BasePage } from '@pages/BasePage';
import { expect, type Locator, type Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export interface CardDetails {
  name: string;
  number: string;
  month: string;
  year: string;
  securityCode: string;
}

export type PaymentOption = 'full' | 'deposit';

export class PaymentPage extends BasePage {
  readonly paymentForm: Locator;
  readonly payInFullOption: Locator;
  readonly payDepositOption: Locator;
  readonly payInFullLabel: Locator;
  readonly payDepositLabel: Locator;
  readonly cardName: Locator;
  readonly cardNumber: Locator;
  readonly expiryMonth: Locator;
  readonly expiryYear: Locator;
  readonly securityCode: Locator;
  readonly makePaymentButton: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);

    this.url = `${this.baseUrl}/book/checkout`;
    this.paymentForm = this.page.getByRole('main');
    this.payInFullOption = this.page.locator('#pay-full');
    this.payDepositOption = this.page.locator('#pay-percentage');
    this.payInFullLabel = this.page.locator('label[for="pay-full"]');
    this.payDepositLabel = this.page.locator('label[for="pay-percentage"]');
    this.cardName = this.page.locator('#cardholder-name');
    this.cardNumber = this.page.locator('#card-number');
    this.expiryMonth = this.page.locator('#expiry-month');
    this.expiryYear = this.page.locator('#expiry-year');
    this.securityCode = this.page.locator('#security-code');
    this.makePaymentButton = this.page.getByRole('button', { name: /Make payment/ });
  }

  /**
   * Chooses how much to pay today, which reveals the card form.
   * @param option - Pay the full balance or the minimum 10% deposit.
   * @returns A promise that resolves after the option is selected and the card form is visible.
   */
  async choosePaymentOption(option: PaymentOption = 'full'): Promise<void> {
    const radio = option === 'full' ? this.payInFullOption : this.payDepositOption;
    const label = option === 'full' ? this.payInFullLabel : this.payDepositLabel;

    await expect(radio).toBeEnabled();
    // The styled radio sits off-screen; its associated label is the visible click target.
    await label.click();
    await expect(radio).toBeChecked();
    await expect(this.cardNumber).toBeVisible();
  }

  /**
   * Fills the prelive Visa simulator card details.
   * @param details - Card values to enter.
   * @returns A promise that resolves after all card fields are populated.
   */
  async fillCard(details: CardDetails): Promise<void> {
    await this.cardName.fill(details.name);
    await this.cardNumber.fill(details.number);
    await this.expiryMonth.fill(details.month);
    await this.expiryYear.fill(details.year);
    await this.securityCode.fill(details.securityCode);
  }

  /**
   * Submits payment and waits for the configured authentication flow.
   * @returns A promise that resolves after the payment and 3DS challenge are submitted.
   */
  async makePayment(): Promise<void> {
    await this.makePaymentButton.click();
    await this.page.waitForURL(/3ds-simulator/);
    await this.page.getByRole('textbox').first().fill('challenge');
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }
}
