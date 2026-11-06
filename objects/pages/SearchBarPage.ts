import { BasePage } from '@pages/BasePage';
import { expect, type Locator, type Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export type BookingType = 'holiday' | 'touring';

export interface SearchOptions {
  parkId: number;
  bookingType: BookingType;
  nights?: number;
  adults?: number;
  children?: number;
  pets?: number;
}

export interface AvailableSearch {
  from: Date;
  to: Date;
  url: string;
}

export class SearchBarPage extends BasePage {
  readonly searchBar: Locator;
  readonly searchSummary: Locator;
  readonly resultCards: Locator;
  readonly bookButtons: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);

    this.url = this.baseUrl;
    this.searchBar = this.page.locator('.hero-booking-v2');
    this.searchSummary = this.page.locator('.search-summary');
    this.resultCards = this.page.locator('[data-id^="unit-types"]');
    this.bookButtons = this.page.locator('div.date-scroll__day[class~="-bg-away-white-updated"] a');
  }

  /**
   * Builds a search URL for a park, booking type, date range, and guest selection.
   * @param options - The park and booking search options.
   * @param from - The check-in date.
   * @param to - The check-out date.
   * @returns The environment-aware search URL.
   */
  buildSearchUrl(options: SearchOptions, from: Date, to: Date): string {
    const params = new URLSearchParams({
      parkID: String(options.parkId),
      from: this.formatDate(from),
      to: this.formatDate(to),
      nights: String(options.nights ?? this.nightsBetween(from, to)),
      holidayType: options.bookingType === 'holiday' ? '1' : '2',
      adults: String(options.adults ?? 2),
      children: String(options.children ?? 0),
      petsCount: String(options.pets ?? 0),
      livesearch: '1',
    });

    return `${this.baseUrl}/search/?${params.toString()}`;
  }

  /**
   * Searches forward for the next available stay.
   * @param options - The park and booking search options.
   * @returns The first available date range and its search URL.
   */
  async searchNextAvailable(options: SearchOptions): Promise<AvailableSearch> {
    let start = this.addDays(new Date(), 84);
    const nights = options.nights ?? 2;

    for (let offset = 0; offset < 365; offset += 1) {
      const from = this.addDays(start, offset);
      const to = this.addDays(from, nights);

      if (options.bookingType === 'touring' && !this.isTouringDateRangeAvailable(from, to)) {
        start = this.nextTouringSeasonStart(from);
        offset = -1;
        continue;
      }

      const url = this.buildSearchUrl(options, from, to);
      const response = await this.page.request.get(url, { timeout: 30_000 });
      if (response.status() >= 400) {
        throw new Error(`Search navigation failed with status ${response.status()}`);
      }

      const responseBody = await response.text();
      if (/Book\s+\d+\s+nights/i.test(responseBody)) {
        await this.page.goto(url, { waitUntil: 'commit', timeout: 30_000 });

        await expect(this.searchSummary).toBeVisible({ timeout: 10_000 });
        return { from, to, url };
      }
    }

    throw new Error(`No available ${options.bookingType} search found within 365 days`);
  }

  /**
   * Checks whether a Touring & Camping stay falls within the seasonal operating window.
   * @param from - The check-in date.
   * @param to - The check-out date.
   * @returns Whether every day of the stay is within the available season.
   */
  private isTouringDateRangeAvailable(from: Date, to: Date): boolean {
    const year = from.getUTCFullYear();
    const seasonStart = new Date(Date.UTC(year, 2, 13));
    const seasonEnd = new Date(Date.UTC(year, 10, 9));

    return from >= seasonStart && to <= seasonEnd;
  }

  /**
   * Moves a Touring & Camping search to the next available March start date.
   * @param date - The date that falls inside or crosses the closed season.
   * @returns 13 March in the relevant season year.
   */
  private nextTouringSeasonStart(date: Date): Date {
    const year = date.getUTCMonth() >= 10 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
    return new Date(Date.UTC(year, 2, 13));
  }

  /**
   * Opens the first available accommodation.
   * @returns A promise that resolves after the accommodation is opened.
   */
  async openFirstAccommodation(): Promise<void> {
    await this.bookButtons.first().click();
    await this.page.waitForURL(/\/book\/extras/, { timeout: 30_000 });
  }

  /**
   * Formats a date for the search query.
   * @param date - The date to format.
   * @returns The date in YYYY-MM-DD format.
   */
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Adds a number of UTC days to a date.
   * @param date - The starting date.
   * @param days - The number of days to add.
   * @returns The adjusted date.
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  /**
   * Calculates the number of nights between two dates.
   * @param from - The check-in date.
   * @param to - The check-out date.
   * @returns The number of nights.
   */
  private nightsBetween(from: Date, to: Date): number {
    return Math.round((to.getTime() - from.getTime()) / 86_400_000);
  }
}
