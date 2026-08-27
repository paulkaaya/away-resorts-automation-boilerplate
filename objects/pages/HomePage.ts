import { BookingBar } from '@components/BookingBar';
import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

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
  }
  /**
   *
   * @returns
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
