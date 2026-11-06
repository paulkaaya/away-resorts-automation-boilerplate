import { expect, test } from '@base';
import type { GuestDetails } from '@pages/DetailsPage';
import type { BookingType, SearchOptions } from '@pages/SearchBarPage';
import { writeBookingState } from '@utils/bookingState';

const journeys: Array<SearchOptions & { name: string }> = [
  { name: 'holidays', parkId: 78, bookingType: 'holiday' },
  { name: 'touring and camping', parkId: 20, bookingType: 'touring' },
];

const guestDetails: GuestDetails = {
  title: 'Mr',
  firstName: 'Regression',
  secondName: 'Test',
  email: 'paul.kaaya@msq-dx.com',
  postcode: 'LS1 4BA',
  addressLine1: '28 Sovereign Street',
  town: 'Leeds',
  country: 'United Kingdom',
  telephone: '07123456789',
};

const cardDetails = {
  name: 'Regression Test',
  number: '4929000000006',
  month: '10',
  year: '32',
  securityCode: '123',
};

for (const journey of journeys) {
  test.describe(`booking - ${journey.name}`, () => {
    test.setTimeout(120_000);

    test('finds the next available two-night stay', async ({ searchBarPage }) => {
      const availableSearch = await searchBarPage.searchNextAvailable(journey);

      expect(availableSearch.to.getTime() - availableSearch.from.getTime()).toBe(2 * 86_400_000);
      await expect(searchBarPage.bookButtons.first()).toBeVisible();
    });

    test('reaches the payment page with valid details', async ({
      searchBarPage,
      extrasPage,
      detailsPage,
      paymentPage,
      confirmationPage,
      envManager,
      page,
    }) => {
      const availableSearch = await searchBarPage.searchNextAvailable(journey);
      await searchBarPage.openFirstAccommodation();

      await expect(extrasPage.holidaySummary).toBeVisible();
      await extrasPage.skipExtras();
      await expect(detailsPage.firstName).toBeVisible();
      await detailsPage.fillDetails(guestDetails);
      await detailsPage.proceedToPayment();

      await expect(page).toHaveURL(/\/book\/checkout/);
      await paymentPage.choosePaymentOption('full');
      await expect(paymentPage.cardNumber).toBeVisible();

      test.skip(envManager.isProd(), 'Production coverage stops before payment submission');

      await paymentPage.fillCard(cardDetails);
      await paymentPage.makePayment();

      await expect(page).toHaveURL(/\/book\/success/, { timeout: 60_000 });
      await expect(confirmationPage.confirmationHeading).toBeVisible();
      await expect(confirmationPage.bookingReference).toHaveText(/Ref:\s*\S+/, { timeout: 60_000 });

      const referenceText = await confirmationPage.bookingReference.innerText();
      const reference = referenceText.replace(/^\s*Ref:\s*/, '').trim();
      expect(reference).not.toBe('');

      writeBookingState(envManager.getEnv(), {
        reference,
        surname: guestDetails.secondName,
      });

      expect(availableSearch.url).toContain('holidayType=');
    });
  });
}

/**
 *
 * @param bookingType
 * @returns
 */
export function bookingTypeLabel(bookingType: BookingType): string {
  return bookingType === 'holiday' ? 'Holidays' : 'Touring & Camping';
}
