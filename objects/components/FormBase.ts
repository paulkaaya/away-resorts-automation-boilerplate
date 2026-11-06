import type { Page } from '@playwright/test';

export abstract class FormBase {
  readonly page: Page;

  protected constructor(page: Page) {
    this.page = page;
  }
}
