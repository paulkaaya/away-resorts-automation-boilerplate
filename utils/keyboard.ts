import type { Locator, Page } from '@playwright/test';

/**
 * Utils to avoid a known Playwright/WebKit limitation
 * (see https://github.com/microsoft/playwright/issues/2114) — and plain Tab everywhere else.
 * Safari browser default is to skip non-form-control elements, so this function is needed to match
 * user behaviour and to test keyboard navigation in Safari.
 */

/**
 * Presses Tab to advance keyboard focus, using Option+Tab on WebKit where plain Tab
 * skips non-form-control elements like links.
 * @param page - The Playwright page under test.
 * @param locator - Optional, but preferred. Locator to press Tab from. If omitted, Tab is pressed from the current page focus.
 * @returns A promise that resolves once the Tab key has been pressed.
 * @example
 * await basePage.footer.logo.focus();
 * await pressTab(page);
 * await expect(basePage.footer.getColumn(1).getLinkByIndex(0)).toBeFocused();
 */
export async function pressTab(page: Page, locator?: Locator): Promise<void> {
  const browserName = page.context().browser()?.browserType().name();
  if (locator) {
    await locator.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  } else {
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  }
}

/**
 * Presses Shift+Tab to reverse keyboard focus, using Shift+Option+Tab on WebKit where plain Tab
 * skips non-form-control elements like links.
 * @param page - The Playwright page under test.
 * @param locator - Optional, but preferred. Locator to press Shift+Tab from. If omitted, Shift+Tab is pressed from the current page focus.
 * @returns A promise that resolves once the Shift+Tab key has been pressed.
 * @example
 * await basePage.footer.logo.focus();
 * await pressShiftTab(page);
 * await expect(basePage.footer.getColumn(1).getLinkByIndex(0)).toBeFocused();
 */
export async function pressShiftTab(page: Page, locator?: Locator): Promise<void> {
  const browserName = page.context().browser()?.browserType().name();
  if (locator) {
    await locator.press(browserName === 'webkit' ? 'Shift+Alt+Tab' : 'Shift+Tab');
  } else {
    await page.keyboard.press(browserName === 'webkit' ? 'Shift+Alt+Tab' : 'Shift+Tab');
  }
}
