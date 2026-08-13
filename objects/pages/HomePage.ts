import { BasePage } from '@pages/BasePage';
import type { Locator, Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export class HomePage extends BasePage {
  readonly heroBlock: Locator;
  readonly heroCtas: Locator;
  readonly carouselPause: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);
    this.url = this.baseUrl;

    this.heroBlock = this.page.locator('.hero-carousel-v2');
    this.heroCtas = this.heroBlock.getByRole('link');
    this.carouselPause = this.heroBlock.getByRole('button', { name: 'Carousel playback controls' });
  }
  /**
   *
   * @returns
   */
  async pauseCarousel(): Promise<void> {
    await this.carouselPause.click();
  }
}
