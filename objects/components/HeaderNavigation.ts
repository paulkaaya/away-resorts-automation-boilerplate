import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class HeaderNav {
  readonly page: Page;
  readonly header: Locator;
  readonly section: Locator;
  readonly mobileHamburger: Locator;
  readonly image: Locator;
  readonly menuSection: Locator;
  readonly menuLinks: Locator;
  readonly menuItems: Locator;
  readonly ctas: Locator;
  readonly search: Locator;
  readonly searchModalInputs: Locator;
  readonly searchModalTextField: Locator;
  readonly searchModalGo: Locator;
  readonly skipNav: Locator;
  readonly logo: Locator;
  readonly loginTrigger: Locator;
  readonly loginModal: Locator;

  constructor(page: Page, isMobile?: boolean) {
    this.page = page;

    //section
    this.header = this.page.locator('header');
    this.section = isMobile ? this.page.locator('nav').last() : this.page.locator('header');

    //mobile specific
    this.mobileHamburger = this.page.getByTestId('mobile-hamburger');

    //menu content
    this.image = this.page.locator('header').getByRole('img');
    this.menuSection = this.section.getByTestId('navigation-menu');
    this.menuLinks = this.section.getByTestId('navigation-menu-link'); //direct click links
    this.menuItems = this.section.getByTestId('navigation-menu-item'); //item with dropdown
    this.ctas = this.section.getByTestId('header-cta');

    //search
    this.search = this.page.getByTestId('search-modal-trigger');
    this.searchModalInputs = this.page.getByTestId('search-modal-inputs');
    this.searchModalTextField = this.page.getByTestId('search-modal-search');
    this.searchModalGo = this.page.getByTestId('search-modal-go');

    //others
    this.skipNav = this.page.getByTestId('skip-nav');
    this.logo = this.header
      .locator('.container')
      .locator('.py-0')
      .locator('.site-header__logo-wrapper')
      .locator('a');
    this.loginTrigger = this.header.getByRole('link', { name: 'Log in' });
    this.loginModal = this.page.locator('#login-popup');
  }

  /**
   * Opens the login modal by clicking the header's login link.
   * @returns A promise that resolves once the login modal is no longer hidden.
   */
  async openLoginModal(): Promise<void> {
    await this.loginTrigger.click();
    await expect(this.loginModal).not.toHaveClass(/popup--hidden/);
  }
}

export class HeaderMenuItem {
  readonly root: Locator;
  readonly button: Locator;
  readonly children: Locator;
  readonly childrenLinks: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.button = this.root.locator('button').first(); //button top open the menu item
    this.children = this.root.getByTestId('navigation-menu-children');
    this.childrenLinks = this.children.getByTestId('navigation-menu-children-link');
  }

  /**
   * Opens this menu item by hovering its button and waiting for its children to be attached.
   * @param item - The HeaderMenuItem to open.
   * @returns A promise that resolves once the item's children are attached.
   */
  async openItem(item: HeaderMenuItem): Promise<void> {
    await item.button.hover();
    await expect(item.children).toBeAttached();
  }

  /**
   * Returns the child link at the specified index within this menu item.
   * @param index - The index of the child link to retrieve (0-based).
   * @returns A promise resolving to the Locator for the child link at the specified index.
   */
  async getChild(index: number): Promise<Locator> {
    return this.childrenLinks.nth(index);
  }

  /**
   * Clicks the child link at the specified index within this menu item.
   * @param index - The index of the child link to click (0-based).
   * @returns A promise that resolves once the child link has been clicked.
   */
  async clickChild(index: number): Promise<void> {
    await this.childrenLinks.nth(index).click();
  }
}
