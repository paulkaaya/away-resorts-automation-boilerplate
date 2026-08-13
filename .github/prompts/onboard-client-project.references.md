# Places to update — file-by-file map

Authoritative list of every placeholder the boilerplate ships with and how to replace it. Token to hunt for at the end: `your-url-here`, `example.com`, `playwright-boilerplate`, `frontend-playwright`, `change-me`.

## Contents

1. [package.json — identity](#1-packagejson--identity)
2. [Environment config (`config/*.ts` + environmentManager)](#2-environment-config)
3. [Consent & analytics (`testFixtures/base.ts`)](#3-consent--analytics)
4. [Authentication (`LoginPage` + setup project + role fixtures)](#4-authentication)
5. [Browser matrix (`config/projects.ts`)](#5-browser-matrix)
6. [CI/CD (Azure pipelines + template)](#6-cicd)
7. [Examples & docs](#7-examples--docs)
8. [Misc placeholders](#8-misc-placeholders)

---

## 1. package.json — identity

```jsonc
{
  "name": "playwright-boilerplate", // → client slug, kebab-case e.g. "acme-e2e"
  "description": "", // → one-line project description
  "author": "", // → team/author if wanted
  "license": "ISC", // → leave or change per client policy
  "keywords": [], // → optional
}
```

Leave `packageManager`, `scripts`, and `devDependencies` alone — they're framework, not identity. (Exception: bump deps only if the user asks.)

---

## 2. Environment config

Three coupled pieces:

### a) `types/envConfig.ts` — the shape (usually unchanged)

```ts
export interface EnvConfig {
  baseUrl: string; // required
  xmlSitemapUrl?: string; // optional — drop the key per-env if N/A
  robotsTxt?: string;
  searchUrl?: string;
  articleUrl?: string;
}
```

Add a key here only if the client needs a new config value (e.g. `apiUrl`). If you add one, set it in every env file.

### b) `config/<env>.ts` — one file per environment

The boilerplate has only `config/dev.ts`, full of placeholders:

```ts
import { EnvConfig } from '../types/envConfig';

export const devConfig: EnvConfig = {
  baseUrl: 'https://your-url-here.com', // → real URL
  xmlSitemapUrl: 'sitemap.xml',
  robotsTxt: 'User-Agent: *\nDisallow: /\nSitemap: https://example.com/sitemap.xml', // → real
  searchUrl: 'search-page/',
  articleUrl: 'sample-article/',
};
```

For each environment the user wants scaffolded, create `config/<env>.ts` exporting `<env>Config`. Naming follows the existing pattern: file `qa.ts` → export `qaConfig`. Drop optional keys that don't apply rather than leaving placeholders.

### c) `utils/environmentManager.ts` — wire each env into the map

Currently only `dev` is registered:

```ts
import { devConfig } from '../config/dev';
// import { qaConfig } from '../config/qa';   ← add an import per env

const environments: { [key: string]: EnvConfig } = {
  dev: devConfig,
  // qa: qaConfig,                              ← add an entry per env
};
```

Default env is `dev` (`process.env.ENV || 'dev'`). **If the client has no `dev` env, change this fallback** to whichever env should be the default (e.g. `|| 'qa'`) and delete `config/dev.ts` + its import/entry — otherwise an unset `ENV` resolves to a config that no longer exists and the manager throws. `isProd()` matches any env name containing `prod`. `package.json` already has `test:qa` / `test:staging` scripts — add matching scripts if the user wants shortcuts for other envs.

`.env.example` lists `ENV=dev|qa|preprod|prod` — align it to the environments actually wired.

### Dependent specs/objects when dropping an optional key

Optional `EnvConfig` keys are read in kept code. Before dropping a key, grep for `getValue('<key>')` and fix the dependents, or `pnpm typecheck` fails:

- `robotsTxt` → `tests/globalSeo.spec.ts` (a robots.txt test block — remove it if you drop the key).
- `searchUrl` → `objects/pages/BasePage.ts` (`this.searchUrl`), tolerated via `|| ''` so safe to drop, but check current specs.
- `articleUrl` → example specs that navigate to a sample article.

---

## 3. Consent & analytics

In `testFixtures/base.ts`:

### Consent cookie (the `cookieConsent` auto-fixture)

```ts
await context.addCookies([
  {
    name: 'OptanonAlertBoxClosed', // ← OneTrust default; swap per provider
    value: new Date().toISOString(),
    url: baseURL ?? envManager.getValue('baseUrl'),
  },
]);
```

Common providers — set the cookie name (value is usually fine as an ISO date or `true`):

| Provider | Cookie name | Typical value |
| --- | --- | --- |
| OneTrust | `OptanonAlertBoxClosed` | ISO date |
| Cookiebot | `CookieConsent` | `{stamp:...}` or `-1` (verify on site) |
| Civic / CookieControl | `CookieControl` | JSON consent object |
| Osano | `osano_consentmanager` | consent string |
| TrustArc | `notice_behavior` / `notice_preferences` | `implied,eu` / `2:` |

Verify the real cookie by inspecting the site (the Playwright MCP browser is handy here). If the site has **no** consent banner, simplify the fixture to a no-op (`await use();`) and note that `dismissCookies` opt-out is no longer needed.

### Analytics hosts (the `blockAnalytics` auto-fixture)

```ts
const ANALYTICS_HOSTS = /(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)/;
```

Extend the alternation with any other marketing/tag hosts test traffic shouldn't reach (e.g. `adobedtm\.com`, `segment\.(io|com)`, `hotjar\.com`, `doubleclick\.net`). Keep it a single regex.

---

## 4. Authentication

A dormant, provider-agnostic auth scaffold. It does nothing until configured (`isAuthConfigured()` gates it), so a fresh boilerplate runs green. Five coupled pieces:

### a) `objects/pages/LoginPage.ts` — the login template

Extends `BasePage`. Locators and `login()` steps are a generic username/password form, each marked `← TODO`:

```ts
this.loginTrigger = this.page.getByTestId('login'); // ← TODO: real testid
this.usernameField = this.page.getByLabel('Email address'); // ← TODO
this.passwordField = this.page.getByLabel('Password', { exact: true }); // ← TODO
this.submitButton = this.page.getByRole('button', { name: /log ?in|sign ?in/i }); // ← TODO
this.loggedInIndicator = this.page.getByTestId('account-menu'); // ← TODO
```

Replace these with the client's real provider (Okta, Auth0, Azure AD B2C, bespoke form). `login()` ships a direct-form flow plus a commented **SSO-redirect variant** (navigate to app → click header login → wait for IdP) — uncomment it for redirect-based SSO. Use the Playwright MCP browser to find stable locators.

### b) `types/envConfig.ts` + `config/<env>.ts` — credentials

Keys (all optional): `loginUrl`, `primaryUserEmail`, `primaryUserPassword`, `secondaryUserEmail`, `secondaryUserPassword`. Placeholders in `config/dev.ts`:

```ts
loginUrl: 'https://your-url-here.com/login',
primaryUserEmail: 'primary.user@example.com',
primaryUserPassword: 'change-me',
secondaryUserEmail: 'secondary.user@example.com',
secondaryUserPassword: 'change-me',
```

**Config vs `.env`:** values live in config by default. To keep secrets out of the repo, uncomment the `*_USER_EMAIL`/`*_USER_PASSWORD` vars in `.env.example` and change the config to read `process.env.PRIMARY_USER_EMAIL` etc. `isAuthConfigured()` treats `your-url-here`, `example.com`, and `change-me` as "not configured", so leftover placeholders keep the scaffold dormant — replace all of them to switch it on.

### c) `utils/auth.ts` — role paths + the gate

```ts
export const authFiles = {
  primaryUser: 'playwright/.auth/primaryUser.json',
  secondaryUser: 'playwright/.auth/secondaryUser.json',
} as const;
```

Rename the roles here (e.g. `member`/`admin`) and the JSON paths follow. `isAuthConfigured()` lives here too.

### d) `tests/auth.setup.ts` — the setup project

One `setup()` per role; logs in via the `loginPage` fixture and saves `storageState` to the `authFiles` path. Wrapped in `setup.skip(!isAuthConfigured(), …)`. Add/remove roles to match `authFiles`.

### e) `testFixtures/base.ts` + `playwright.config.ts` — wiring

`base.ts` registers `loginPage: createPageFixture(loginPage)` and exports `primaryUserTest` / `secondaryUserTest` (each pinned to a `storageState`). `playwright.config.ts` prepends `{ name: 'setup', testMatch: /.*\.setup\.ts/ }` and gives every browser project `dependencies: ['setup']`. `types/types.ts` registers `loginPage` in the `Pages` type.

**Role naming:** to rename `primaryUser`/`secondaryUser`, update them in `authFiles` (utils/auth.ts), the setup test paths, and the `primaryUserTest`/`secondaryUserTest` exports together. **One role only:** drop everything `secondary*`. **Third role:** add an `authFiles` entry + a setup test + an exported fixture.

**Which browsers run authenticated specs:** all projects depend on `setup`, but a skipped setup doesn't force auth on anyone. To stop some browsers running `@authenticated` specs, add `grepInvert: [/@authenticated/]` to those projects in `config/projects.ts` (the source repo ran member tests on Chrome only).

**No auth at all:** delete `objects/pages/LoginPage.ts`, `tests/auth.setup.ts`, `tests/authExample.spec.ts`, `utils/auth.ts`, the `loginPage` import/registration in `types/types.ts` + `testFixtures/base.ts`, the `primaryUserTest`/`secondaryUserTest` exports + `authFiles` import, the auth keys in `types/envConfig.ts` + `config/*.ts`, and the `setup` project block in `playwright.config.ts` (revert `projects` to `projects: projects`).

---

## 5. Browser matrix

`config/projects.ts` exports a `Project[]` with: Chrome, Firefox, Safari, Mobile Safari (iPhone 14), Mobile Chrome (Pixel 7), Mobile Tablet Chrome, Mobile Tablet Safari (iPad Mini), Large Desktop Edge, Large Desktop Chrome. Trim entries the client doesn't need, or keep all. Note the CI template references specific project names (`--project Chrome "Mobile Chrome"`) — if you rename or remove those, update the pipeline scripts to match (see §6). If you added `@authenticated` `grepInvert` rules (§4), keep them pointing at the projects you intend after trimming.

---

## 6. CI/CD

Azure DevOps + Testmo stack. Files: `.azure-pipelines/ci-manualTestReport.yml`, `.azure-pipelines/ci-scheduledTestReport- QA.yml`, `ci-templates/playwrightTemplate.yml`.

Tokens to update in `ci-templates/playwrightTemplate.yml`:

```yaml
variables:
  - group: playwright-variables # ← Azure variable group name
  - name: workingDir
    value: 'tests/playwright' # ← repo path within the build checkout
  - name: dockerContainer
    value: 'ecmchow/node-playwright-pnpm:v1.61.0-node22-pnpm11-noble' # ← auto-synced by Husky pre-commit hook; don't hand-edit
```

- Testmo `--source "frontend-playwright"` (appears twice) → client/source name.
- Project names in `--project Chrome "Mobile Chrome"` must match `config/projects.ts` (if you trim the matrix, make sure these still resolve).
- Run name strings `"Playwright - <env> - <date> - ..."` → rebrand if wanted.
- `dockerContainer` is rewritten automatically by the `.husky/pre-commit` hook whenever `package.json` is committed, so it stays in sync with `@playwright/test` and pnpm's major version without manual edits. The image (`ecmchow/node-playwright-pnpm`) bundles Node, pnpm, and Playwright, so pipeline jobs don't need separate Node-install/Corepack-enable steps.

In the pipeline entry files: schedule cron + `displayName` (`Weekday Nightly Regression - QA`), the `name:` headers, and the environment `values` lists. **Note:** `ci-manualTestReport.yml` ships a broken list `values: [qa, string, prod]` — `string` is a leftover placeholder; replace it with the real env (e.g. `staging`).

Testmo secrets (`TESTMO_TOKEN`, `TESTMO_URL`, `TESTMO_ID`) live in the Azure variable group — the user sets those in Azure, not in the repo.

If the client isn't on Azure/Testmo: ask whether to delete `.azure-pipelines/` + `ci-templates/` + the `playwright-testmo-reporter` reporter in `playwright.config.ts` + the `@testmo/testmo-cli` / `playwright-testmo-reporter` devDependencies, or leave them as a reference.

---

## 7. Examples & docs

### Examples (ask: keep as reference, or strip)

- Specs: `tests/customFixtureExample.spec.ts`, `tests/lighthouseAndAccessibility.spec.ts`, `tests/visualRegression.spec.ts`, `tests/globalSeo.spec.ts`, `tests/authExample.spec.ts` (strip with the rest of the auth scaffold — see §4 — if there's no auth).
- Components: `objects/components/HeaderNavigation.ts`, `objects/components/FooterNavigation.ts` (their locators are generic but may need client `data-testid`s).
- Screenshot baselines: `screenshots/`.
- **Keep regardless:** `objects/pages/BasePage.ts`, `testFixtures/base.ts` wiring, `utils/*`, `types/*` — these are the framework. If stripping examples, `types/types.ts` should still register `basePage`.

### Docs (regenerate for the client + fix stale refs)

- `README.me` and `AGENTS.md` describe the boilerplate. Rewrite for the client.
- **Known stale references to correct:** the page-type registry is `types/types.ts` (docs say `types/pages.ts`); env config lives in `config/*.ts` (docs say `config/environments/*.ts`). `AGENTS.md`, `README.me`, and `.github/copilot-instructions.md` may all carry these.
- The boilerplate `README.me` is ~700 lines and partly garbled (duplicated/merged lines). Prefer a fresh concise rewrite over line-by-line patching.
- `CLAUDE.md` just points at `AGENTS.md` — only touch it if file paths change.
- Leave the per-directory `README.me` stubs (`config/README.me`, `objects/README.me`, etc.) alone — they're framework notes, not client placeholders.

---

## 8. Misc placeholders

- `.vscode/settings.json` — the README suggests a `playwright.env` `{ "ENV": "qa" }` block for local runs; create/adjust if the user wants a default local env.
- `.vscode/mcp.json` — Playwright + Azure DevOps MCP config; update Azure org/project if it hardcodes the boilerplate's.
- Don't touch `.git`, remotes, or push — that's the user's call.
