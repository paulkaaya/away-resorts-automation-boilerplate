import type { Locator } from '@playwright/test';

export class BookingBar {
  readonly root: Locator;
  readonly tabs: Locator;
  readonly holidaysTab: Locator;
  readonly touringTab: Locator;
  readonly hhsLink: Locator;
  readonly formFields: Locator;
  readonly locationField: Locator;
  readonly datesField: Locator;
  readonly guestsField: Locator;
  readonly submitButton: Locator;

  constructor(root: Locator) {
    this.root = root;

    this.tabs = this.root.locator('.hero-booking-v2__tabs');
    this.holidaysTab = this.tabs.getByRole('button', { name: 'Holidays' });
    this.touringTab = this.tabs.getByRole('button', { name: 'Touring & camping' });
    this.hhsLink = this.tabs.getByRole('link', { name: 'Holiday Homes for Sale' });

    const formWrapper = this.root.locator('.hero-booking-v2__form-wrapper');
    this.formFields = formWrapper.locator('.hero-booking-v2__form-field');
    this.locationField = this.formFields.filter({ hasText: 'Location' }).locator('button');
    this.datesField = this.formFields.filter({ hasText: 'Check in/out' }).locator('button');
    this.guestsField = this.formFields.filter({ hasText: 'Guests' }).locator('button');
    this.submitButton = formWrapper.locator('form').locator('button[type="submit"]');
  }
}
