import { FooterNav } from '@components/FooterNavigation';
import { HeaderNav } from '@components/HeaderNavigation';
import { expect, type Locator, type Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

type BoundingBox = Awaited<ReturnType<Locator['boundingBox']>>;

export class BasePage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly viewportWidth: number;

  //Shared page properties
  url: string;
  readonly h1: Locator;
  readonly breadcrumbs: Locator;
  readonly breadcrumbSchema: Locator;
  readonly searchUrl: string;
  readonly header: HeaderNav;
  readonly footer: FooterNav;

  //SEO & Social locators
  readonly pageTitle: Locator;
  readonly canonicalUrl: Locator;
  readonly ogTitle: Locator;
  readonly ogDescription: Locator;
  readonly ogImage: Locator;
  readonly ogImageAlt: Locator;
  readonly metaRobots: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    this.page = page;
    this.baseUrl = envManager.getValue('baseUrl');

    //others
    this.viewportWidth = this.page.viewportSize()?.width || 0;

    //Shared page properties
    this.url = this.baseUrl; // Default to baseUrl, can be overridden in subclasses
    this.h1 = this.page.locator('h1');
    this.breadcrumbs = this.page.getByTestId('breadcrumb');
    this.breadcrumbSchema = this.page.locator('script[type="application/ld+json"]');
    this.searchUrl = envManager.getValue('searchUrl');
    this.header = new HeaderNav(page, this.isMobile());
    this.footer = new FooterNav(page);

    //SEO & Social locators
    this.pageTitle = this.page.locator('head title');
    this.canonicalUrl = this.page.locator('link[rel="canonical"]');
    this.ogTitle = this.page.locator('meta[property="og:title"]');
    this.ogDescription = this.page.locator('meta[property="og:description"]');
    this.ogImage = this.page.locator('meta[property="og:image"]');
    this.ogImageAlt = this.page.locator('meta[property="og:image:alt"]');
    this.metaRobots = this.page.locator('meta[name="robots"]');
  }

  /**
   * Navigates to the page's URL, or a custom URL if provided.
   * Throws an error if the navigation response status is 400 or higher to stop tests on failed navigation.
   * Note: don't use this method if you expect a non-200 response (e.g., testing 404 pages)
   * @param customUrl - An optional URL to navigate to instead of the page's default URL.
   * @returns A promise that resolves once navigation has completed.
   */
  async goto(customUrl?: string): Promise<void> {
    let goToUrl = customUrl || this.url;
    const response = await this.page.goto(goToUrl);
    if (response && response.status() >= 400) {
      throw new Error(`Navigation failed with status ${response.status()}`);
    }
  }

  /* SEO and Quality Checks */
  /**
   * Asserts that the page's core SEO tags (canonical URL, title, OpenGraph, robots, viewport) are attached.
   * @returns A promise that resolves once the assertions have been made.
   */
  async verifySEO(): Promise<void> {
    await expect(this.canonicalUrl).toBeAttached();
    await expect.soft(this.pageTitle).toBeAttached();
    await expect.soft(this.ogTitle).toBeAttached();
    await expect.soft(this.ogDescription).toBeAttached();
    await expect.soft(this.metaRobots).toBeAttached();
    await expect.soft(this.page.locator('meta[name="viewport"]')).toBeAttached();
  }

  /**
   * Asserts that no image on the page failed to load, reporting the src of any broken images.
   * @returns A promise that resolves once the assertion has been made.
   */
  async checkBrokenImages(): Promise<void> {
    const brokenImages = await this.page
      .locator('img')
      .evaluateAll(images =>
        (images as HTMLImageElement[])
          .filter(img => img.naturalWidth === 0)
          .map(img => img.currentSrc || img.src)
      );

    expect.soft(brokenImages, `broken images found: ${brokenImages.join(', ')}`).toEqual([]);
  }

  /**
   * Asserts that the page has exactly one visible h1 element.
   * @returns A promise that resolves once the assertions have been made.
   */
  async checkH1(): Promise<void> {
    await expect.soft(this.h1).toBeAttached();
    await expect.soft(this.h1).toBeVisible();
    await expect.soft(this.h1).toHaveCount(1);
  }

  /**
   * Asserts that the breadcrumbs are visible and that their JSON-LD schema is well-formed
   * and matches the page's h1 for its final item.
   * @returns A promise that resolves once the assertions have been made.
   */
  async checkBreadcrumbs(): Promise<void> {
    await expect.soft(this.breadcrumbs).toBeAttached();
    await expect.soft(this.breadcrumbs).toBeVisible();
    await expect.soft(this.breadcrumbSchema).toBeAttached();

    const schemaContent = JSON.parse(await this.breadcrumbSchema.innerHTML());

    expect.soft(schemaContent).toHaveProperty('@context', 'https://schema.org');
    expect.soft(schemaContent).toHaveProperty('@type', 'BreadcrumbList');
    expect.soft(schemaContent).toHaveProperty('itemListElement');
    expect.soft(schemaContent.itemListElement.length).toBeGreaterThan(0);
    expect.soft(schemaContent.itemListElement[0]).toHaveProperty('@type', 'ListItem');
    expect.soft(schemaContent.itemListElement[0]).toHaveProperty('position', 1);
    expect.soft(schemaContent.itemListElement[0]).toHaveProperty('name');
    expect.soft(schemaContent.itemListElement[0]).toHaveProperty('item', this.baseUrl);
    expect
      .soft(schemaContent.itemListElement.at(-1))
      .toHaveProperty('name', await this.h1.innerText());
  }

  /* Header and Footer Checks */
  /**
   * Asserts that the page header is visible.
   * @returns A promise that resolves once the assertion has been made.
   */
  async checkHeaderVisible(): Promise<void> {
    await expect(this.header.header).toBeVisible();
  }

  /**
   * Asserts that the page footer is visible.
   * @returns A promise that resolves once the assertion has been made.
   */
  async checkFooterVisible(): Promise<void> {
    await expect(this.footer.section).toBeVisible();
  }

  /* General Helpers */
  /**
   * Determines whether the current viewport width is narrower than the given breakpoint.
   * @param breakpoint - The width in pixels below which the viewport is considered mobile. Defaults to 768.
   * @returns True if the viewport width is below the breakpoint, false otherwise.
   */
  isMobile(breakpoint?: number): boolean {
    return this.viewportWidth < (breakpoint || 768);
  }

  /* Interaction Helpers */
  /**
   * Performs a drag gesture, pressing the mouse down on the target locator and moving it
   * 100px to the right before releasing.
   * @param locator - The Locator to drag.
   * @returns A promise that resolves once the drag gesture has completed.
   */
  async drag(locator: Locator): Promise<void> {
    const box = await locator.boundingBox();

    await this.page.mouse.move(box?.x || 0, box?.y || 0);

    await this.page.mouse.down();
    await this.page.mouse.move((box?.x || 0) + 100, box?.y || 0);
    await this.page.mouse.up();
  }

  /**
   * Performs a drag gesture on the target locator, then waits for a fixed settle time.
   * @param locator - The Locator to drag.
   * @param waitTime - The time in milliseconds to wait after the drag for the animation to settle. Defaults to 1000.
   * @returns A promise that resolves once the drag and wait have completed.
   */
  async dragAndWait(locator: Locator, waitTime = 1000): Promise<void> {
    await this.drag(locator);
    // Intentional settle time for the drag animation — a free-form drag has no
    // deterministic end state to await on.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await this.page.waitForTimeout(waitTime);
  }

  /**
   * Scrolls the page to the bottom of the document.
   * @returns A promise that resolves once the scroll has been performed.
   */
  async scrollToBottom(): Promise<void> {
    // eslint-disable-next-line local/no-restricted-syntax-warn
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  /**
   * Scrolls the page to the top of the document.
   * @returns A promise that resolves once the scroll has been performed.
   */
  async scrollToTop(): Promise<void> {
    // eslint-disable-next-line local/no-restricted-syntax-warn
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }

  /**
   * Scrolls to the bottom of the page, briefly waits for lazy-loaded content to begin loading,
   * then scrolls back to the top.
   * @returns A promise that resolves once both scrolls have completed.
   */
  async scrollBottomToTop(): Promise<void> {
    await this.scrollToBottom();
    // Give lazy-loaded / scroll-triggered content a moment to begin loading
    // before scrolling back to the top.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await this.page.waitForTimeout(500);
    await this.scrollToTop();
  }

  /**
   * Captures the bounding box of a locator, waits a fixed interval, then captures it again —
   * used to detect whether an element has moved (e.g. for animation checks).
   * @param locator - The Locator whose position should be sampled.
   * @param waitTime - The time in milliseconds to wait between samples. Defaults to 1000.
   * @returns A promise resolving to a tuple of the initial and subsequent bounding boxes.
   */
  async checkForMovement(locator: Locator, waitTime = 1000): Promise<[BoundingBox, BoundingBox]> {
    const initialBox = await locator.boundingBox();
    // Sampling position before and after a fixed interval is the whole point of
    // this helper — the fixed wait is intrinsic.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await this.page.waitForTimeout(waitTime);
    const newBox = await locator.boundingBox();

    return [initialBox, newBox];
  }
}
