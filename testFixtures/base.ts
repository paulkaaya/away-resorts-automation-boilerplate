import { CookieBanner } from '@components/CookieBanner';
import { FooterNav } from '@components/FooterNavigation';
import { HeaderNav } from '@components/HeaderNavigation';
import { BasePage } from '@pages/BasePage';
import { HomePage } from '@pages/HomePage';
import type { Browser, Page } from '@playwright/test';
import { test as base, chromium } from '@playwright/test';
import type { Components, Pages } from '@types';
import { assertNoA11yViolations } from '@utils/accessibility';
import { EnvironmentManager } from '@utils/environmentManager';
import getPort from 'get-port';
import { playAudit } from 'playwright-lighthouse';
import lighthouseThresholds from '../lib/lighthouseThresholds';

/**
 * Runs global setup actions against a freshly-constructed page object, such as closing the cookie banner.
 * @param _pageInstance - The page object instance to set up.
 * @returns A promise that resolves once setup has completed.
 */
async function setupPage(_pageInstance: Pages[keyof Pages]): Promise<void> {
  //for global setup actions such as closing cookie banner
}

/**
 * Builds a Playwright fixture function that constructs the given page object class and makes
 * it available to tests via `use`, running `setupPage` first.
 * @param PageClass - The page object class to instantiate for this fixture.
 * @returns A Playwright fixture function that provides an instance of `PageClass`.
 */
function createPageFixture<T extends Pages[keyof Pages]>(
  PageClass: new (page: Page, envManager: EnvironmentManager) => T
): (
  args: { page: Page; envManager: EnvironmentManager },
  use: (page: T) => Promise<void>
) => Promise<void> {
  return async (
    { page, envManager }: { page: Page; envManager: EnvironmentManager },
    use: (page: T) => Promise<void>
  ): Promise<void> => {
    const pageInstance = new PageClass(page, envManager);
    await setupPage(pageInstance);
    await use(pageInstance);
  };
}

/**
 * Builds a Playwright fixture function that constructs the given component via `factory` and
 * makes it available to tests via `use`. Takes a factory rather than a bare constructor so
 * components needing extra constructor args (e.g. `HeaderNav`'s `isMobile`) can still be wired up.
 * @param factory - Builds the component instance from the test's `page`.
 * @returns A Playwright fixture function that provides the component instance.
 */
function createComponentFixture<T extends Components[keyof Components]>(
  factory: (page: Page) => T
): (args: { page: Page }, use: (page: T) => Promise<void>) => Promise<void> {
  return async ({ page }: { page: Page }, use: (page: T) => Promise<void>): Promise<void> => {
    await use(factory(page));
  };
}

type AccessibilityFixture = {
  /**
   * Navigates to a page and asserts there are no WCAG 2 A/AA violations, using a strict
   * zero-tolerance scan.
   * @param pageInstance - The page object to navigate before scanning.
   * @param customUrl - An optional URL to navigate to instead of the page object's default URL.
   * @returns A promise that resolves once the scan and assertion have completed.
   * @example
   * test('home page has no a11y violations', async ({ accessibility, basePage }) => {
   *   await accessibility(basePage, '/');
   * });
   */
  accessibility: (pageInstance: Pages[keyof Pages], customUrl?: string) => Promise<void>;
};

type QualityGateFixture = {
  /**
   * Navigates to a page and runs a standard bundle of quality checks (SEO, broken images,
   * header/footer visibility, h1) against it.
   * @param pageInstance - The page object to navigate and run checks against.
   * @param customUrl - An optional URL to navigate to instead of the page object's default URL.
   * @returns A promise that resolves once all checks have completed.
   * @example
   * test('quality gate', async ({ qualityGate, basePage }) => {
   *   await qualityGate(basePage, '/');
   * });
   */
  qualityGate: (pageInstance: Pages[keyof Pages], customUrl?: string) => Promise<void>;
};

type LighthouseFixture = {
  /**
   * Runs a Lighthouse audit against a fresh browser context/page, navigating via a temporary
   * copy of the given page object.
   * @param pageInstance - The page object whose class and `goto` should be used for navigation.
   * @param customUrl - An optional URL to navigate to instead of the page object's default URL.
   * @param thresholds - Optional Lighthouse score thresholds; defaults to `lighthouseThresholds` defined in `lib/lighthouseThresholds.ts`.
   * @returns A promise that resolves once the audit has completed.
   * @example
   * test('home page meets performance budget', async ({ lighthouse, basePage }) => {
   *   await lighthouse(basePage, '/');
   * });
   */
  lighthouse: (
    pageInstance: Pages[keyof Pages],
    customUrl?: string,
    thresholds?: Record<string, number>
  ) => Promise<void>;
};

type LighthouseWorkerFixtures = {
  lighthousePort: number;
  lighthouseBrowser: Browser;
};

type EnvWorkerFixtures = {
  /**
   * The active environment's config, resolved once per worker. Available in any test/fixture
   * via `({ envManager }) => ...` instead of importing and instantiating `EnvironmentManager`
   * directly. Page objects receive it as a constructor argument via `createPageFixture` instead.
   */
  envManager: EnvironmentManager;
};

type Options = {
  /**
   * When true (default), the cookie-consent banner is suppressed before each
   * test by pre-seeding the consent cookie. Suites that exercise the banner
   * itself opt out per-file with `test.use({ dismissCookies: false })`.
   */
  dismissCookies: boolean;
};

type AutoFixtures = {
  blockAnalytics: void;
  cookieConsent: void;
};

/**
 * Third-party analytics/tag hosts blocked during tests so automated traffic
 * never reaches Google Tag Manager / Analytics and skews marketing reporting.
 * Extend this pattern with any other hosts you don't want test runs to hit.
 */
const ANALYTICS_HOSTS = /(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)/;

export const test = base.extend<
  Pages &
    Components &
    AccessibilityFixture &
    QualityGateFixture &
    LighthouseFixture &
    Options &
    AutoFixtures,
  LighthouseWorkerFixtures & EnvWorkerFixtures
>({
  /**
   * Worker-scoped fixture providing the resolved `EnvironmentManager` for the active
   * environment. See `EnvWorkerFixtures` above for how tests/fixtures should consume it.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once the manager has been constructed.
   */
  envManager: [
    async ({}, use): Promise<void> => {
      await use(new EnvironmentManager());
    },
    { scope: 'worker' },
  ],

  /**
   * Whether the cookie-consent banner should be suppressed before each test. Defaults to true;
   * see the `Options` type above for how to opt out per-file.
   */
  dismissCookies: [true, { option: true }],

  /**
   * Auto-running fixture that aborts requests to `ANALYTICS_HOSTS` for the test's browser
   * context, so test traffic never reaches Google Tag Manager / Analytics.
   * @param root0 - Destructured test context.
   * @param root0.context - The Playwright browser context for the test.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once the route has been registered.
   */
  blockAnalytics: [
    async ({ context }, use): Promise<void> => {
      await context.route(ANALYTICS_HOSTS, route => route.abort());
      await use();
    },
    { auto: true },
  ],

  /**
   * Auto-running fixture that, when `dismissCookies` is true, pre-seeds the site's `accepted-cookies`
   * consent cookie so tests don't need to click through the cookie banner.
   * @param root0 - Destructured test context.
   * @param root0.context - The Playwright browser context for the test.
   * @param root0.baseURL - The base URL for the test.
   * @param root0.dismissCookies - Whether to dismiss the cookie banner.
   * @param root0.envManager - The resolved config for the active environment.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once the cookie has been set (or skipped).
   */
  cookieConsent: [
    async ({ context, baseURL, dismissCookies, envManager }, use): Promise<void> => {
      if (dismissCookies) {
        // Setting this cookie up-front avoids a banner-dismissal click on
        // every test and speeds the suite up a lot.
        await context.addCookies([
          {
            name: 'accepted-cookies',
            value: 'true',
            url: baseURL ?? envManager.getValue('baseUrl'),
          },
        ]);
      }
      await use();
    },
    { auto: true },
  ],

  /**
   * Provides a `lighthouse` function that runs a Lighthouse audit against a fresh browser
   * context/page, navigating via a temporary copy of the given page object. The returned
   * function accepts a page object, an optional custom URL, and optional threshold overrides.
   * @param root0 - Destructured worker fixtures.
   * @param root0.lighthouseBrowser - The Chromium browser launched with remote debugging enabled, used to run audits.
   * @param root0.lighthousePort - The unique remote-debugging port for this Playwright worker, so parallel workers' Lighthouse browsers don't collide.
   * @param root0.envManager - The resolved config for the active environment.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once the audit has completed.
   */
  lighthouse: async ({ lighthouseBrowser, lighthousePort, envManager }, use): Promise<void> => {
    const runLighthouse = async (
      pageInstance: Pages[keyof Pages],
      customUrl?: string,
      thresholds?: Record<string, number>
    ): Promise<void> => {
      const context = await lighthouseBrowser.newContext();
      const page = await context.newPage();
      // Create a temporary page object instance for navigation
      const tempPageInstance = new (pageInstance.constructor as any)(page, envManager);
      await tempPageInstance.goto(customUrl);

      await playAudit({
        page: page as any,
        port: lighthousePort,
        thresholds: thresholds || lighthouseThresholds(envManager.isProd()),
      });
      await context.close();
    };
    await use(runLighthouse);
  },

  /**
   * Worker-scoped fixture providing a unique remote-debugging port per Playwright worker,
   * so parallel workers' Lighthouse browsers don't collide.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once a free port has been assigned.
   */
  lighthousePort: [
    async ({}, use): Promise<void> => {
      // Assign a unique port for each playwright worker to support parallel tests
      const port = await getPort();
      await use(port);
    },
    { scope: 'worker' },
  ],

  /**
   * Worker-scoped fixture providing a Chromium browser launched with remote debugging enabled,
   * used by the `lighthouse` fixture to run audits.
   * @param root0 - Destructured test context.
   * @param root0.lighthousePort - The unique remote-debugging port for this Playwright worker, so parallel workers' Lighthouse browsers don't collide.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once the browser has launched (and, after the test, closed).
   */
  lighthouseBrowser: [
    async ({ lighthousePort }, use): Promise<void> => {
      const browser = await chromium.launch({
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      await use(browser);
      await browser.close();
    },
    { scope: 'worker' },
  ],

  /**
   * Provides a `qualityGate` function that navigates to a page and runs a standard bundle of
   * quality checks (SEO, broken images, header/footer visibility, h1) against it. The returned
   * function accepts the page object to check and an optional custom URL.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once all checks have completed.
   */
  qualityGate: async ({}, use): Promise<void> => {
    const runQualityGate = async (
      pageInstance: Pages[keyof Pages],
      customUrl?: string
    ): Promise<void> => {
      await pageInstance.goto(customUrl);

      await pageInstance.verifySEO();
      await pageInstance.checkBrokenImages();
      await pageInstance.checkHeaderVisible();
      await pageInstance.checkH1();
      await pageInstance.checkFooterVisible();
    };
    await use(runQualityGate);
  },

  /**
   * Provides an `accessibility` function that navigates to a page and asserts there are no
   * WCAG 2 A/AA violations, using a strict zero-tolerance scan. The returned function accepts
   * the page object to navigate and an optional custom URL.
   * @param root0 - Destructured test context.
   * @param root0.page - The Playwright page object for the test.
   * @param use - Function to call with the fixture's value.
   * @returns A promise that resolves once the scan and assertion have completed.
   */
  accessibility: async ({ page }, use): Promise<void> => {
    const runAccessibilityTest = async (
      pageInstance: Pages[keyof Pages],
      customUrl?: string
    ): Promise<void> => {
      await pageInstance.goto(customUrl);

      // Strict WCAG 2 A/AA scan, zero-tolerance (no failOn filter). For a
      // severity-filtered scan, call assertNoA11yViolations directly in the spec.
      await assertNoA11yViolations(page, { tags: ['wcag2a', 'wcag2aa'] });
    };
    await use(runAccessibilityTest);
  },

  //page types
  basePage: createPageFixture(BasePage),
  homePage: createPageFixture(HomePage),
  /* Add other page types here as needed, make sure to import them */

  //component types
  headerNavigation: createComponentFixture(
    page => new HeaderNav(page, (page.viewportSize()?.width || 0) < 768)
  ),
  footerNavigation: createComponentFixture(page => new FooterNav(page)),
  cookieBanner: createComponentFixture(page => new CookieBanner(page)),
  /* Add other component fixtures here as needed, make sure to import them */
});

export { expect } from '@playwright/test';
