import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';

/**
 * Asserts that clicking an external link either opens a new tab (target="_blank")
 * or navigates the current tab to a different origin. WebKit does not reliably
 * fire 'popup' events for target="_blank", so behaviour is keyed off the target
 * attribute rather than waiting on a popup unconditionally.
 * @param page - The Playwright page under test.
 * @param context - The browser context, used to catch popups opened in a new tab.
 * @param link - The locator for the external link to click.
 * @param expectedUrl - Optional URL/pattern the resulting page should match; defaults to any http(s) URL.
 * @returns A promise that resolves once the external navigation has been asserted.
 */
export async function assertExternalLinkBehavior(
  page: Page,
  context: BrowserContext,
  link: Locator,
  expectedUrl?: string
): Promise<void> {
  await expect(link).toHaveAttribute('href', /^https?:\/\//);
  const target = await link.getAttribute('target');

  const urlPattern = expectedUrl ? expectedUrl : new RegExp('^https?:\\/\\/');

  if (target === '_blank') {
    const [newPage] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await expect(newPage).toHaveURL(urlPattern);
    await newPage.close();
  } else {
    await link.click();
    await expect(page).toHaveURL(urlPattern);
  }
}

/**
 * Asserts the page's current URL contains the given (relative) href,
 * escaping any regex-significant characters in the href first.
 * @param page - The Playwright page under test.
 * @param href - The relative href expected to appear in the current URL.
 * @returns A promise that resolves once the URL assertion has been made.
 */
export async function expectUrlToMatchHref(page: Page, href: string): Promise<void> {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).toHaveURL(new RegExp(escaped));
}

/**
 * Asserts that an anchor element has a valid, absolute href.
 * @param link - The anchor locator to check.
 * @returns A promise that resolves once the href assertion has been made.
 */
export async function assertAbsoluteHref(link: Locator): Promise<void> {
  await expect(link, 'Link href must be absolute').toHaveAttribute('href', /^https?:\/\//);
}
