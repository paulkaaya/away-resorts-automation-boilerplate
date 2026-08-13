import { EnvironmentManager } from './environmentManager';

/**
 * Single source of truth for the authenticated-session storageState files.
 * The setup project (tests/auth.setup.ts) writes these; the role fixtures in
 * testFixtures/base.ts (primaryUserTest / secondaryUserTest) read them.
 *
 * The `playwright/.auth/` directory is git-ignored — sessions are recreated by
 * the setup project on every run, never committed.
 *
 * Add a role by adding an entry here, a setup test, and a fixture.
 */
export const authFiles = {
  primaryUser: 'playwright/.auth/primaryUser.json',
  secondaryUser: 'playwright/.auth/secondaryUser.json',
} as const;

/**
 * True only once real auth values have been supplied. A fresh boilerplate ships
 * with placeholder credentials/URL, so this returns false and the auth setup +
 * example specs skip themselves — the suite stays green until a client wires in
 * real values (config/<env>.ts or .env).
 * @returns `true` once real (non-placeholder) auth values are configured.
 */
export function isAuthConfigured(): boolean {
  const env = new EnvironmentManager();

  // Substrings that mark a value as still being a boilerplate placeholder.
  const placeholders = ['your-url-here', 'example.com', 'change-me'];
  const looksReal = (value?: string): boolean =>
    !!value && !placeholders.some(token => value.includes(token));

  return (
    looksReal(env.getValue('loginUrl')) &&
    looksReal(env.getValue('primaryUserEmail')) &&
    looksReal(env.getValue('primaryUserPassword')) &&
    looksReal(env.getValue('secondaryUserEmail')) &&
    looksReal(env.getValue('secondaryUserPassword'))
  );
}
