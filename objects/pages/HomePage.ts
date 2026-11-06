import { BookingBar } from '@components/BookingBar';
import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';
import { validateHomepageSchema } from '@utils/structuredData';

export class HomePage extends BasePage {
  readonly heroBlock: Locator;
  readonly heroCtas: Locator;
  readonly carouselPause: Locator;
  readonly sliderDots: Locator;
  readonly sliderDotInactive: Locator;
  readonly sliderDotActive: Locator;
  readonly heroSlides: Locator;
  readonly activeHeroSlide: Locator;
  readonly inactiveHeroSlides: Locator;
  readonly heroBookingBar: BookingBar;
  readonly contentAuditLinks: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);
    this.url = this.baseUrl;

    this.heroBlock = this.page.locator('.hero-carousel-v2');
    this.heroCtas = this.heroBlock.getByRole('link');
    this.carouselPause = this.heroBlock.getByRole('button', { name: 'Carousel playback controls' });
    this.sliderDots = this.heroBlock.locator('.swiper-pagination-bullet');
    this.sliderDotInactive = this.heroBlock.locator(
      '.swiper-pagination-bullet:not(.swiper-pagination-bullet-active)'
    );
    this.sliderDotActive = this.heroBlock.locator('.swiper-pagination-bullet-active');
    this.heroSlides = this.heroBlock.locator('.hero-carousel-v2__slide');
    this.activeHeroSlide = this.heroBlock.locator('.swiper-slide-visible');
    this.inactiveHeroSlides = this.heroBlock.locator(
      '.hero-carousel-v2__slide:not(.swiper-slide-visible)'
    );
    this.heroBookingBar = new BookingBar(this.page.locator('#hero-booking-v2'));
    this.contentAuditLinks = this.mainContentLinks.or(
      this.heroBlock.getByRole('link', { includeHidden: true })
    );
  }
  /**
   * Validates all homepage JSON-LD against the types observed on live and pre-production.
   * @returns Resolves once the public entity identities and required fields have been checked.
   */
  async checkStructuredData(): Promise<void> {
    await expect(this.breadcrumbSchema.first()).toBeAttached();
    const scripts = await this.breadcrumbSchema.allTextContents();
    const failures = validateHomepageSchema(scripts, 'https://www.awayresorts.co.uk/');
    expect(failures, `${this.page.url()} JSON-LD:\n${failures.join('\n')}`).toEqual([]);
  }

  /**
   * Pauses the hero carousel before deterministic interaction checks.
   * @returns Resolves after clicking the playback control.
   */
  async pauseCarousel(): Promise<void> {
    await this.carouselPause.click();
  }

  /**
   * Reads the active hero slide's `aria-label` (e.g. "2 / 4") and returns its position and total slide count.
   * @returns A promise resolving to the active slide's 1-based position and the total slide count.
   */
  async getActiveSlidePosition(): Promise<{ position: number; total: number }> {
    const ariaLabel = await this.activeHeroSlide.getAttribute('aria-label');
    const [position, total] = (ariaLabel || '').split('/').map(value => Number(value.trim()));

    return { position, total };
  }
}
