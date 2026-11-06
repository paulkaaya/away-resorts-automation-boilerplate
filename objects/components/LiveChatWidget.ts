import type { Locator, Page } from '@playwright/test';

/**
 * Controls the third-party LiveChat widget when it covers page content.
 */
export class LiveChatWidget {
  readonly page: Page;
  readonly iframe: Locator;
  readonly minimizeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.iframe = this.page.locator('iframe#chat-widget');
    this.minimizeButton = this.page.frameLocator('iframe#chat-widget').locator('button#minimize');
  }

  /**
   * Minimizes the chat if its iframe has loaded and is visible.
   * @returns A promise that resolves after the widget is minimized or found absent.
   */
  async minimizeIfVisible(): Promise<void> {
    if (await this.iframe.isVisible()) {
      await this.minimizeButton.click();
    }
  }
}
