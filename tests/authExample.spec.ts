import { expect, primaryUserTest } from '@base';
import { isAuthConfigured } from '@utils/auth';

/*
Example of an authenticated test. `primaryUserTest` loads the session captured
by tests/auth.setup.ts, so the page is already logged in — no login steps here.

Skipped while auth is unconfigured (placeholder creds) so a fresh boilerplate
stays green; activates automatically once real values are wired in.

Delete this file (and tests/auth.setup.ts) if the project has no auth.
*/

primaryUserTest.describe('authenticated session (example)', { tag: '@authenticated' }, () => {
  primaryUserTest.skip(!isAuthConfigured(), 'Auth not configured — see config/<env>.ts');

  primaryUserTest('primary user lands authenticated', async ({ loginPage }) => {
    await loginPage.goto(loginPage.baseUrl);

    // loggedInIndicator is only visible with a valid session restored from
    // storageState — proves the stored auth carried over to this test.
    await expect(loginPage.loggedInIndicator).toBeVisible();
  });
});
