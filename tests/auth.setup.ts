/* eslint-disable playwright/expect-expect */
import { test as setup } from '@base';
import { authFiles, isAuthConfigured } from '@utils/auth';
import { EnvironmentManager } from '@utils/environmentManager';

/*
Authentication setup project. Runs before the browser projects (wired via
`dependencies: ['setup']` in playwright.config.ts), logs each role in once, and
persists the session to a storageState file under playwright/.auth/.

Tests then reuse those sessions through the primaryUserTest / secondaryUserTest
fixtures (or `test.use({ storageState })`) — no per-test login.

While auth is unconfigured (fresh boilerplate placeholders) these are skipped,
so the suite stays green and dependent projects still run unauthenticated.

Remove the `eslint-disable` from the top of the file once real setup is in place.
*/

const envManager = new EnvironmentManager();

// Credential gating, computed at module scope so the test bodies stay free of
// conditional logic (playwright/no-conditional-in-test) and only call
// `setup.skip(condition, reason)`.
const CREDENTIAL_PLACEHOLDERS = ['your-url-here', 'example.com', 'change-me'];
const looksReal = (value?: string): boolean =>
  !!value && !CREDENTIAL_PLACEHOLDERS.some(token => value.includes(token));
const secondaryUserConfigured =
  looksReal(envManager.getValue('secondaryUserEmail')) &&
  looksReal(envManager.getValue('secondaryUserPassword'));

setup.describe('authenticate', () => {
  setup.skip(
    !isAuthConfigured(),
    'Auth not configured — set loginUrl + user credentials in config/<env>.ts (or .env). Skipping storageState setup.'
  );

  setup('primary user', async ({ page, loginPage }) => {
    setup.setTimeout(60_000); // a real login round-trip can be slow
    await loginPage.login(
      envManager.getValue('primaryUserEmail'),
      envManager.getValue('primaryUserPassword')
    );
    await page.context().storageState({ path: authFiles.primaryUser });
  });

  setup('secondary user', async ({ page, loginPage }) => {
    setup.skip(
      !secondaryUserConfigured,
      'Secondary user credentials not configured — skipping secondary storageState setup.'
    );

    setup.setTimeout(60_000);
    await loginPage.login(
      envManager.getValue('secondaryUserEmail'),
      envManager.getValue('secondaryUserPassword')
    );
    await page.context().storageState({ path: authFiles.secondaryUser });
  });
});
