import { expect, test } from '@base';
import type { HolidayHomeListingsPage } from '@pages/HolidayHomeListingsPage';
import type { HolidayHomesPage } from '@pages/HolidayHomesPage';
import type { Page } from '@playwright/test';
import type { BookingState } from '@utils/bookingState';
import { readBookingState } from '@utils/bookingState';
import type { Env } from '@utils/environmentManager';
import { getSharedFormData } from '@utils/formTestData';

test.describe.configure({ retries: 0 });

/**
 * Blocks LiveChat's third-party iframe so it cannot cover form controls.
 * @param page - The page on which the third-party iframe request should be blocked.
 * @returns A promise that resolves after the route is registered.
 */
async function blockLiveChat(page: Page): Promise<void> {
  await page.route(/secure\.livechatinc\.com/, route => route.abort());
}

/**
 * Navigates from holiday-home search to the first current detail listing.
 * @param page - The Playwright page used for navigation assertions.
 * @param holidayHomesPage - The landing-page object that selects both test parks.
 * @param listingsPage - The listing object that opens the first current result.
 * @returns A promise that resolves on the selected home's detail page.
 */
async function openCurrentHolidayHome(
  page: Page,
  holidayHomesPage: HolidayHomesPage,
  listingsPage: HolidayHomeListingsPage
): Promise<void> {
  await holidayHomesPage.goto();

  await expect(page).toHaveURL(/\/holiday-homes\/$/);

  await holidayHomesPage.openSearch();
  await holidayHomesPage.searchSelectedParks();
  await listingsPage.openFirstHome();
}

/**
 * Reads the booking identity for the active environment or fails with setup guidance.
 * @param env - The environment whose saved booking should be used.
 * @returns The environment-specific reference and surname.
 */
function getBookingState(env: Env): BookingState {
  const bookingState = readBookingState(env);
  if (!bookingState) {
    throw new Error(
      `No booking login data is available for ENV=${env}. Provide BOOKING_REFERENCE and BOOKING_SURNAME for this run or create .test-state/booking-${env}.json by completing a booking test in that environment.`
    );
  }
  return bookingState;
}

test.describe('request a callback @desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(90_000);

  test('displays and retains callback form values', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    callbackForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await callbackForm.open();
    await callbackForm.assertDisplayed();
    const formData = getSharedFormData(envManager);
    await callbackForm.fill(formData);
    await callbackForm.assertPopulated(formData);
  });

  test('submits a callback request without changing the route', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    callbackForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await callbackForm.open();
    await callbackForm.fill(getSharedFormData(envManager));
    const currentUrl = page.url();

    await callbackForm.submit();

    await callbackForm.assertSuccess();
    await expect(page).toHaveURL(currentUrl);
  });
});

test.describe('request a callback @mobile', () => {
  test.setTimeout(90_000);

  test('displays and retains callback form values', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    callbackForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await callbackForm.open();
    await callbackForm.assertDisplayed();
    const formData = getSharedFormData(envManager);
    await callbackForm.fill(formData);
    await callbackForm.assertPopulated(formData);
  });

  test('submits a callback request without changing the route', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    callbackForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await callbackForm.open();
    await callbackForm.fill(getSharedFormData(envManager));
    const currentUrl = page.url();

    await callbackForm.submit();

    await callbackForm.assertSuccess();
    await expect(page).toHaveURL(currentUrl);
  });
});

test.describe('arrange a viewing @desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(90_000);

  test('displays and retains viewing form values', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    viewingForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await viewingForm.open();
    await viewingForm.assertDisplayed();
    const formData = getSharedFormData(envManager);
    await viewingForm.fill(formData);
    await viewingForm.assertPopulated(formData);
  });

  test('submits a viewing request without changing the route', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    viewingForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await viewingForm.open();
    await viewingForm.fill(getSharedFormData(envManager));
    const currentUrl = page.url();

    await viewingForm.submit();

    await viewingForm.assertSuccess();
    await expect(page).toHaveURL(currentUrl);
  });
});

test.describe('arrange a viewing @mobile', () => {
  test.setTimeout(90_000);

  test('displays and retains viewing form values', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    viewingForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await viewingForm.open();
    await viewingForm.assertDisplayed();
    const formData = getSharedFormData(envManager);
    await viewingForm.fill(formData);
    await viewingForm.assertPopulated(formData);
  });

  test('submits a viewing request without changing the route', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    viewingForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await viewingForm.open();
    await viewingForm.fill(getSharedFormData(envManager));
    const currentUrl = page.url();

    await viewingForm.submit();

    await viewingForm.assertSuccess();
    await expect(page).toHaveURL(currentUrl);
  });
});

test.describe('make an enquiry', () => {
  test.setTimeout(90_000);

  test('displays and retains enquiry form values', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    enquiryForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await enquiryForm.open();
    await enquiryForm.assertDisplayed();
    const formData = getSharedFormData(envManager);
    await enquiryForm.fill(formData);
    await enquiryForm.assertPopulated(formData);
  });

  test('submits an enquiry without changing the route', async ({
    page,
    holidayHomesPage,
    holidayHomeListingsPage,
    enquiryForm,
    envManager,
  }) => {
    await openCurrentHolidayHome(page, holidayHomesPage, holidayHomeListingsPage);
    await enquiryForm.open();
    await enquiryForm.fill(getSharedFormData(envManager));
    const currentUrl = page.url();

    await enquiryForm.submit();

    await enquiryForm.assertSuccess();
    await expect(page).toHaveURL(currentUrl);
  });
});

test.describe('contact us', () => {
  test.setTimeout(60_000);

  test('displays and retains contact form values', async ({
    page,
    basePage,
    contactForm,
    envManager,
  }) => {
    await blockLiveChat(page);
    await basePage.goto('/get-in-touch/');

    await contactForm.assertDisplayed();
    const formData = getSharedFormData(envManager);
    await contactForm.fill(formData);
    await contactForm.assertPopulated(formData);
  });

  test('submits a contact enquiry without changing the route', async ({
    page,
    basePage,
    contactForm,
    envManager,
  }) => {
    await blockLiveChat(page);
    await basePage.goto('/get-in-touch/');

    await contactForm.fill(getSharedFormData(envManager));
    const currentUrl = page.url();

    await contactForm.submit();

    await contactForm.assertSuccess();
    await expect(page).toHaveURL(currentUrl);
  });
});

test.describe('newsletter', () => {
  test.setTimeout(60_000);

  test('displays and retains newsletter form values', async ({
    page,
    basePage,
    newsletterForm,
    envManager,
  }) => {
    await blockLiveChat(page);
    await basePage.goto('/newsletter/');

    await newsletterForm.assertDisplayed();
    const formData = getSharedFormData(envManager);
    await newsletterForm.fill(formData);
    await newsletterForm.assertPopulated(formData);
  });

  test('subscribes without changing the route', async ({
    page,
    basePage,
    newsletterForm,
    envManager,
  }) => {
    await blockLiveChat(page);
    await basePage.goto('/newsletter/');

    await newsletterForm.fill(getSharedFormData(envManager));
    const currentUrl = page.url();

    await newsletterForm.submit();

    await newsletterForm.assertSuccess();
    await expect(page).toHaveURL(currentUrl);
  });
});

test.describe('login', () => {
  test.setTimeout(60_000);

  test('opens the login form', async ({ page, homePage, headerNavigation, loginForm }) => {
    await blockLiveChat(page);
    await homePage.goto();

    await headerNavigation.openLoginModal();

    await loginForm.assertDisplayed();
  });

  test('signs in using a booking from the selected environment', async ({
    page,
    homePage,
    headerNavigation,
    loginForm,
    envManager,
  }) => {
    await blockLiveChat(page);
    await homePage.goto();

    await headerNavigation.openLoginModal();
    await loginForm.assertDisplayed();
    await loginForm.fill(getBookingState(envManager.getEnv()));
    const environmentOrigin = new URL(envManager.getValue('baseUrl')).origin;
    const loginOrigin = new URL(page.url()).origin;

    expect(loginOrigin).toBe(environmentOrigin);

    await loginForm.submit();

    await expect(page).toHaveURL(/\/account\/bookings\?login=1(?:&|$)/);
    const destination = new URL(page.url());
    expect(destination.origin).toBe(environmentOrigin);
    expect(destination.pathname).toBe('/account/bookings');
    expect(destination.searchParams.get('login')).toBe('1');
  });
});
