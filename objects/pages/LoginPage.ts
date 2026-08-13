import { BasePage } from '@pages/BasePage';
import { expect, type Locator, type Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

/**
 * Provider-agnostic login page object — a TEMPLATE.
 *
 * The boilerplate can't know your identity provider, so the locators and the
 * `login()` steps below are a generic username/password form. Swap them for
 * your provider (Okta, Auth0, Azure AD B2C, a bespoke form, …). Every
 * site-specific locator is marked `← TODO`.
 *
 * Prefer `getByTestId` where you control the markup (golden rule #2); IdP login
 * forms you don't own usually only expose labels/roles, hence `getByLabel` /
 * `getByRole` below.
 *
 * This object isn't called from tests directly — tests/auth.setup.ts drives it
 * once per role and persists the resulting session via storageState.
 */
export class LoginPage extends BasePage {
  /** The "Log in" control in YOUR app's header (used by the SSO-redirect variant). */
  readonly loginTrigger: Locator;
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly submitButton: Locator;
  /** Something visible ONLY when authenticated — proves login succeeded. */
  readonly loggedInIndicator: Locator;

  constructor(page: Page, envManager: EnvironmentManager) {
    super(page, envManager);
    // Login form lives at loginUrl when set, else fall back to the site root.
    this.url = envManager.getValue('loginUrl') || this.baseUrl;

    this.loginTrigger = this.page.getByTestId('login'); // ← TODO: real testid
    this.usernameField = this.page.getByLabel('Email address'); // ← TODO
    this.passwordField = this.page.getByLabel('Password', { exact: true }); // ← TODO
    this.submitButton = this.page.getByRole('button', { name: /log ?in|sign ?in/i }); // ← TODO
    this.loggedInIndicator = this.page.getByTestId('account-menu'); // ← TODO
  }

  /**
   * Logs in with the given credentials and leaves the browser authenticated.
   * tests/auth.setup.ts calls this, then captures context.storageState().
   * @param username - The username/email to log in with.
   * @param password - The password to log in with.
   * @returns A promise that resolves once login has completed and been verified.
   */
  async login(username: string, password: string): Promise<void> {
    // --- Default: direct navigation to a login form ----------------------
    await this.goto(this.url);

    // --- SSO-redirect variant (e.g. Okta/Auth0) --------------------------
    // If login starts from your app's header and redirects to an external IdP,
    // replace the goto above with:
    //   await this.goto(this.baseUrl);
    //   await this.loginTrigger.click();
    //   await this.page.waitForURL(/your-idp-domain/);
    // ---------------------------------------------------------------------

    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
    await this.submitButton.click();

    // Assert we're genuinely authenticated before storageState is captured —
    // otherwise a failed login would persist an empty/anonymous session.
    await expect(this.loggedInIndicator).toBeVisible();
  }
}
