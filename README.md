# Playwright E2E Testing Framework

## Project Overview

This is a Playwright-based end-to-end testing framework boilerplate. The framework uses TypeScript and follows the Page Object Model (POM) design pattern for maintainable and scalable test automation.

## Contributor Guidance

- Core conventions live in `AGENTS.md`.
- AI-assistant workflows live in `.github/skills/`.
- For convention checks before commit, use `.github/skills/code-review/SKILL.md`.
- For post-change documentation alignment, use `.github/skills/doc-sync/SKILL.md`.
- To test more than one site/brand behind the same suite (not just more environments), use `.github/skills/add-multi-site-support/SKILL.md`.

## Making This Boilerplate Project-Specific

To adapt this boilerplate for your project:

1. Set the correct name in the `package.json` file
2. Define your environments in the `config` folder (see Environment Management section)
3. Create page objects for your application in `objects/pages`
4. Update locators in base object model classes to match your application
5. Configure browser settings in `config/projects.ts` as needed
6. Update pipeline files with your project's Azure DevOps configuration
7. Replace this README with project-specific documentation

## Project Structure

```
playwright/
├── config/
│   ├── dev.ts, qa.ts, staging.ts, prod.ts, …  # Environment-specific configuration
│   └── projects.ts            # Browser configuration (Chrome, Firefox, Safari, Edge, Mobile)
├── objects/
│   ├── components/            # Reusable UI components (e.g. HeaderNavigation, FooterNavigation)
│   └── pages/                 # Page Object Models
│       ├── BasePage.ts
│       └── ...                # Specific page implementations
├── testFixtures/
│   └── base.ts                # Custom test fixtures extending Playwright
├── tests/
│   └── ...                    # Your test files organized by feature/page
├── types/
│   ├── envConfig.ts           # Environment configuration types
│   └── types.ts               # Page and component type registries (`Pages` / `Components`)
├── utils/
│   ├── environmentManager.ts  # Environment variable management
│   ├── css.ts                 # getCss() computed-style helper
│   └── imageComparison.ts     # Screenshot buffer diffing (pixelmatch)
├── lib/
│   └── lighthouseThresholds.ts # Default, env-aware Lighthouse score thresholds
├── .vscode/
│   └── playwright.code-snippets # Editor snippets for scaffolding POMs, components, tests
├── ci-templates/
│   └── playwrightTemplate.yml # Azure DevOps pipeline template (optional)
├── ci-manualTestReport.yml    # Manual test execution pipeline (optional)
├── ci-scheduledTestReport.yml # Scheduled test pipelines (optional)
├── playwright.config.ts       # Playwright configuration
└── package.json
```

## Setup

This project uses [pnpm](https://pnpm.io/) as its package manager. The required version is pinned via the `packageManager` field in `package.json`. The easiest way to get the right version is to enable [Corepack](https://nodejs.org/api/corepack.html) (bundled with Node.js):

```bash
corepack enable
```

Then:

1. Install dependencies, Playwright browsers, and git hooks in one step:

   ```bash
   pnpm run first:install
   ```

   This runs `pnpm install`, `pnpm run test:install` (installs Playwright browsers), and sets up Husky.

2. Install the Playwright VS Code extension

3. Add the following to `.vscode/settings.json`:

   ```json
   {
     "playwright.env": {
       "ENV": "qa"
     }
   }
   ```

4. Run tests to verify setup

## Running Tests

### Command Line

```bash
# Run all tests
pnpm test

# Run tests against specific environments
pnpm test:qa
pnpm test:staging

# Run with UI mode
pnpm exec playwright test --ui

# Run in headed mode
pnpm exec playwright test --headed

# Run only quality gate tests
pnpm exec playwright test --grep @quality-gate

# Run only visual regression tests
pnpm exec playwright test --grep @visual

# Run tagged tests
pnpm exec playwright test --grep @smoke
```

### VS Code Extension

Use the Playwright test runner in VS Code for an integrated testing experience:

- View all tests in the Test Explorer
- Run/debug individual tests
- View test results inline
- Set breakpoints in test code

Project snippets are defined in `.vscode/playwright.code-snippets` for scaffolding page objects, components, and test blocks. Type a prefix (e.g. `pom`, `pom-component`, `spec`, `spec-auth`, `page-spec`, `describe`, `describe-tag`, `test`, `test-tag`, `test-qualitygate`, `test-accessibility`, `loc-field`, `loc-testid`) in a `.ts` file and select it from the IntelliSense suggestions.

## Updates

To update Playwright to the latest version:

```bash
pnpm add -D @playwright/test@latest
pnpm exec playwright install --with-deps
pnpm exec playwright --version
```

**Important:** If using CI/CD pipelines, ensure the container version in the pipeline file matches the current Playwright and pnpm versions:

```yaml
container: 'ecmchow/node-playwright-pnpm:v1.61.1-node22-pnpm11-noble'
```

The pre-commit hook keeps `ci-templates/playwrightTemplate.yml` in sync with `package.json` automatically — see [Git hooks (Husky)](#git-hooks-husky).

## Test Organization

### Test Tags

Tests use tags for selective execution, via the details-object **array** syntax only — `test('…', { tag: ['@smoke'] }, () => { ... })`, never a string or a `// @tag:` comment:

- `@quality-gate` - Critical tests for SEO, visual regression, and core functionality. Excluded everywhere except the `Chrome` project via `grepInvert` in `config/projects.ts` — tag a describe block once instead of a per-test `testInfo.skip(project.name !== 'Chrome', ...)` check.
- `@desktop` / `@mobile` - Device-scoped tests, similarly excluded on the wrong device via `grepInvert` instead of a manual `basePage.isMobile()` skip.
- `@visual` - Visual regression tests
- `@smoke` - Quick smoke tests
- `@regression` - Full regression test suite
- `@authenticated` - Tests that run against a stored authenticated session (see Authentication)
- Custom tags - Add project-specific tags as needed

## Page Object Model

### Pages

To create a new page type:

1. Create the page class in `objects/pages/`
2. Inherit from `BasePage` (import via the `@pages/BasePage` alias) for common functionality
3. Add the page type to `types/types.ts`
4. Register the page fixture in `testFixtures/base.ts`

Example page object structure:

```typescript
import { BasePage } from '@pages/BasePage';
import { Page } from '@playwright/test';
import type { EnvironmentManager } from '@utils/environmentManager';

export class LoginPage extends BasePage {
    url = '/login';

    constructor(page: Page, envManager: EnvironmentManager) {
        super(page, envManager);
        this.usernameInput = page.getByTestId('username-input');
        this.passwordInput = page.getByTestId('password-input');
        this.submitButton = page.getByTestId('submit-button');
    }

    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click
    }
```

Reusable UI components (cards, navigation, forms) are defined in `objects/components/`, imported via the `@components/*` alias (e.g. `import { HeaderNav } from '@components/HeaderNavigation'`). Shared chrome is composed into page objects — `BasePage` instantiates `header` and `footer` in its constructor, so every page object gets `this.header` / `this.footer` for free. Components are also handed to tests as their own fixtures — see [Component Fixtures](#component-fixtures) below — rather than being constructed inline in each test.

Example component:

```typescript
export class CardComponent {
  constructor(private page: Page) {
    this.card = page.getByTestId('card');
    this.title = this.card.getByTestId('card-title');
    this.image = this.card.getByTestId('card-image');
  }

  async clickCard() {
    await this.card.click();
  }
}
```

### Locator Strategy

Due to the nature of our typical CMS managed site builds, text based locators can quickly become stale and outdated. **Prefer `data-testid` attributes** or other stable locators for element selection to ensure test stability and maintainability:

```typescript
// ✅ Preferred - stable, semantic, independent of implementation
this.section = page.getByTestId('listing-grid');
this.cards = page.getByTestId('card');

// ❌ Avoid - brittle, coupled to styling/structure
this.section = page.getByText('Listing area');
this.cards = page.locator('div.card-wrapper > div');
```

**Benefits of `data-testid`:**

- Stable across UI changes (styling, layout, refactoring)
- Clear intent - explicitly marks elements as test targets
- Easy to identify in source code
- Decouples tests from implementation details

**Fallback options** (in order of preference):

1. `getByRole()` - for semantic HTML elements (buttons, headings, links)
2. `CSS/XPath selectors` - simple semi-stable CSS locators are fine (eg, a .h2 class typically won't be removed); avoid XPath and chained/combinator CSS selectors — both are flagged by `pnpm lint`
3. `getByLabel()` - for form inputs with labels
4. `getByText()` - for unique text content

When requesting new `data-testid` attributes from developers, use descriptive, kebab-case names that reflect the component purpose (e.g., `load-more`, `card-title`).

## Types

### Page Types

Page types are defined in `types/types.ts`. Each page fixture must be added to this type definition:

```typescript
export type Pages = {
  basePage: BasePage;
  loginPage: LoginPage;
  articlePage: ArticlePage;
  // ... add your pages here
};
```

### Component Types

Component types are also defined in `types/types.ts`, alongside `Pages`. Every component fixture must be added to the `Components` type:

```typescript
export type Components = {
  headerNavigation: HeaderNav;
  footerNavigation: FooterNav;
  // ... other components
};
```

### Environment Types

Environment configuration types are defined in `types/envConfig.ts`. To add a new environment variable:

1. Add the key and type to the `EnvConfig` interface in `types/envConfig.ts`
2. Add the value to all environment files under `config/` (`dev.ts`, `qa.ts`, `staging.ts`, `prod.ts`, …)
3. The value will be accessible via `EnvironmentManager`

Example:

```typescript
export interface EnvConfig {
  baseUrl: string;
  apiUrl: string;
  newProperty: string; // Add your new property here
}
```

## Fixtures

The base fixture is defined in `testFixtures/base.ts` and imported via the `@base` path alias (defined in `tsconfig.json`'s `paths`, resolving to `./testFixtures/base`).

**Important:** When writing tests, always import from your custom fixtures, not from `@playwright/test`. Exceptions to this are made when the test explicitly needs to avoid the functionality that the fixture handles, eg to test a cookie banner or 404 page:

```typescript
// ✅ Correct
import { test, expect } from '@base';

// ❌ Use sparingly
import { test, expect } from '@playwright/test';
```

### Available Fixtures

#### Auto Fixtures

Two fixtures run automatically before every test (no need to request them):

- **`blockAnalytics`** — aborts requests to Google Tag Manager / Google Analytics so automated test traffic never reaches your marketing tags and skews reporting. Extend the `ANALYTICS_HOSTS` pattern in `testFixtures/base.ts` with any other hosts you want test runs to avoid.
- **`cookieConsent`** — pre-seeds the consent cookie (OneTrust's `OptanonAlertBoxClosed` by default) so the consent banner never appears, which is much faster than dismissing the banner on every test. Suites that need to exercise the banner itself opt out per-file:

  ```typescript
  // cookie-banner.spec.ts — let the banner render so we can test it
  test.use({ dismissCookies: false });
  ```

  Swap the cookie name/value in `testFixtures/base.ts` for your own consent provider if you don't use OneTrust.

#### Quality Gate Fixture

The `qualityGate` fixture provides a consistent way to run standard quality checks across all pages:

```typescript
test(
  'quality checks pass for article page',
  { tag: ['@quality-gate'] },
  async ({ qualityGate, articlePage }) => {
    await qualityGate(articlePage);
    // Add any page-specific checks here
  }
);
```

The quality gate automatically runs:

- SEO verification (meta tags, canonical URL, Open Graph tags)
- Broken image checks
- Header and footer visibility
- H1 tag validation

The fixture uses the page's default URL (defined in the page object's `url` property), or you can pass a custom URL:

```typescript
await qualityGate(articlePage, '/custom-url');
```

#### Page Object Fixtures

Available page fixtures:

- `basePage` - Base page object for homepage
- `loginPage` - the provider-agnostic login template (see Authentication)

Page fixtures are available for each page object you create. All page fixtures should be created using the `createPageFixture` factory function, which automatically handles:

- Page instantiation
- Cookie banner closure (if applicable)
- Setup and teardown

To add a new page fixture in `testFixtures/base.ts`:

```typescript
newPageType: createPageFixture(NewPageType),
```

Example usage in tests:

```typescript
test('should load page successfully', async ({ loginPage }) => {
  await loginPage.goto();
  await expect(loginPage.submitButton).toBeVisible();
});
```

#### Component Fixtures

A component fixture is available for every entry registered in the `Components` type. Like page fixtures, these are created via a factory — `createComponentFixture`, which takes a `factory` function (rather than a bare constructor) so components needing extra constructor args, e.g. `HeaderNav`'s `isMobile` flag, can still be wired up:

```typescript
headerNavigation: createComponentFixture(
  page => new HeaderNav(page, (page.viewportSize()?.width || 0) < 768)
),
footerNavigation: createComponentFixture(page => new FooterNav(page)),
```

Tests request the component fixture directly instead of constructing it inline:

```typescript
test('header renders the nav menu', async ({ headerNavigation }) => {
  await expect(headerNavigation.menuSection).toBeVisible();
});
```

A test that needs non-default construction can still construct the class directly with `new HeaderNav(page, true)` alongside the `page` fixture — the fixture just covers the common case.

To add a new component fixture:

1. Add `<fixtureKey>: <ClassName>;` to the `Components` type in `types/types.ts`.
2. Register it in `testFixtures/base.ts`:

   ```typescript
   newComponent: createComponentFixture(page => new NewComponent(page)),
   ```

3. Import the new class at the top of both files.

#### Accessibility Fixture

Runs Axe accessibility tests against WCAG 2.0 Level A & AA standards:

```typescript
test('should pass accessibility checks', async ({ accessibility, articlePage }) => {
  await accessibility(articlePage);
  // Or with custom URL:
  await accessibility(articlePage, '/custom-path');
});
```

#### Lighthouse Fixture

Runs Lighthouse performance audits:

```typescript
test('should pass lighthouse tests', async ({ lighthouse, basePage }) => {
  // Uses the env-aware defaults from lib/lighthouseThresholds.ts
  await lighthouse(basePage);

  // Or with a custom URL and/or explicit thresholds:
  await lighthouse(basePage, '/custom-path', {
    performance: 90,
    accessibility: 90,
    'best-practices': 90,
    seo: 95,
  });
});
```

### Extending Fixtures

To create a custom fixture:

```typescript
export const test = base.extend<pages>({
  customPage: async ({ page }, use) => {
    // Create the page instance
    const customPage = new CustomPage(page);

    // Setup (runs before test). Cookie consent is already handled by the
    // cookieConsent auto-fixture, so there's no need to dismiss it here.
    await customPage.navigateToPage();

    // Provide page to test
    await use(customPage);

    // Teardown (runs after test)
    await customPage.cleanup();
  },
});
```

**Note:** Cookie-consent handling is managed by the `cookieConsent` auto-fixture in `testFixtures/base.ts`, which pre-seeds the consent cookie before every test. You don't need to call it — opt out with `test.use({ dismissCookies: false })` only when a test needs the banner to appear.

## Authentication

Roles are signed in **once** and their sessions replayed, rather than logging in per test:

- **`objects/pages/LoginPage.ts`** — a provider-agnostic login template. Swap its `← TODO` locators and `login()` steps for your identity provider (a commented SSO-redirect variant is included for Okta/Auth0-style flows).
- **`tests/auth.setup.ts`** — a Playwright _setup project_ that logs each role in and saves its session to `playwright/.auth/<role>.json`. It's wired as a dependency of every browser project in `playwright.config.ts`, so it runs first.
- **Role fixtures** — `testFixtures/base.ts` exports `primaryUserTest` and `secondaryUserTest`; import one instead of `test` to run against that stored session:

  ```ts
  import { primaryUserTest, expect } from '@base';

  primaryUserTest('member-only content', async ({ loginPage }) => {
    await loginPage.goto(loginPage.baseUrl);
    await expect(loginPage.loggedInIndicator).toBeVisible();
  });
  ```

Credentials live in `config/<env>.ts` (`loginUrl`, `primaryUser*`, `secondaryUser*`) by default and can be moved to `.env`. Until real values are set, `isAuthConfigured()` (`utils/auth.ts`) keeps the setup project and the example spec (`tests/authExample.spec.ts`) skipped so the suite stays green. See `tests/authExample.spec.ts` for a worked example.

## Environment Management

Environment configuration is managed in `config/` with a dedicated file for each environment (`dev.ts`, `qa.ts`, `staging.ts`, `prod.ts`, …).

Each file creates an instance of the `EnvConfig` type and exports environment-specific values like URLs, API endpoints, and credentials.

### Using Environment Manager

The `EnvironmentManager` utility selects the active environment and provides access to configuration values.

Import and create an instance:

```typescript
import { EnvironmentManager } from '@utils/environmentManager';
const envManager = new EnvironmentManager();
```

Get configuration values:

```typescript
const baseUrl = envManager.getValue('baseUrl');
const apiUrl = envManager.getValue('apiUrl');
```

Check current environment:

```typescript
const env = envManager.getEnv(); // Returns "qa", "staging", etc.
const isProd = envManager.isProd(); // Returns true if production environment
```

Environment is selected via the `ENV` environment variable (set in `.vscode/settings.json` for local development or in CI/CD pipelines).

## CI/CD Pipelines (Optional)

This boilerplate includes example Azure DevOps YAML pipelines for automated test execution. You can adapt these to your chosen CI/CD platform (GitHub Actions, GitLab CI, Jenkins, etc.).

### Example Pipeline Structure

**`ci-templates/playwrightTemplate.yml`** - Example reusable template that demonstrates:

- Multiple execution modes: Chrome-only, all browsers, screenshot generation
- Sharding for parallel execution
- Test reporting integration
- Artifact storage for test results and screenshots
- Docker container usage: `ecmchow/node-playwright-pnpm:v1.61.1-node22-pnpm11-noble` (bundles Node, pnpm, and Playwright, so pipeline jobs no longer need a separate Node install/Corepack-enable step)

### Example Pipeline Configurations

**`ci-manualTestReport.yml`** - Manual pipeline with parameters:

- Environment selection
- Browser configuration
- Custom Playwright arguments
- Artifact toggles

**`ci-scheduledTestReport.yml`** - Scheduled test execution:

- Cron-based scheduling
- Automated regression testing
- Configurable execution scope

### Key CI/CD Features

- **Sharding**: Parallel test execution for faster results
- **Test Reporting**: Integration options for test management platforms
- **Artifact Management**: Screenshots, videos, and test reports
- **Environment Variables**: Secure credential management

### Setting Up CI/CD

1. Adapt the example pipeline files to your CI/CD platform
2. Configure environment variables and secrets
3. Set up variable groups or secret storage as needed
4. Configure test reporting integrations (optional)
5. Schedule automated test runs (optional)

Required secrets:

- **`TESTMO_TOKEN`** - Authentication token for Testmo API access
- **`TESTMO_URL`** - Testmo instance URL (e.g., `https://yourcompany.testmo.net`)
- **`TESTMO_ID`** - Testmo project ID for test result submission

These variables are injected as environment variables during test execution and used by the `testmo` CLI for automated test result reporting. Secrets should be marked as secret in Azure DevOps Library to prevent exposure in logs.

## Browser Configuration

The test suite runs across multiple browser configurations defined in `config/projects.ts`:

### Desktop Browsers

- **Chrome** (1280×720)
- **Firefox** (1280×720)
- **Safari** (1280×720)
- **Edge** (1920×1080)
- **Large Desktop Chrome** (1920×1080)

### Mobile Browsers

- **Mobile Safari** (iPhone 14, 390×664)
- **Mobile Chrome** (Pixel 7, 390×664)
- **Mobile Tablet Chrome** (1024×810 with touch)
- **Mobile Tablet Safari** (iPad Mini landscape, 1024×768)

Locally, tests run with 2 workers by default (4 on CI); adjust `workers` in `playwright.config.ts` based on your project needs. Sharding in the CI pipelines provides further parallelism on top of that.

### Test Filtering with Tags

The framework supports filtering tests using tags with `grep` and `grepInvert` options:

- Use tags to organize tests by feature, priority, or test type
- Example: `grep: '@smoke'` to run only smoke tests
- Example: `grepInvert: '@slow'` to exclude slow-running tests
- Combine tags for more complex filtering scenarios — e.g. `config/projects.ts` sets a per-project `grepInvert` so `@quality-gate` tests only run on `Chrome`, and `@desktop`/`@mobile` tests only run on the matching device class

## Quality & Accessibility Helpers

Reusable, page-based helpers live in `utils/` and can be called directly from any spec. They take a Playwright `Page`/`Locator` (not a page object), so they compose with the auto fixtures and don't require a page-object fixture.

### Accessibility (`utils/accessibility.ts`)

- **`assertNoA11yViolations(page, { failOn, tags, scope })`** — runs a CSP-safe axe-core scan. With no `failOn` it's zero-tolerance (any violation fails); pass e.g. `failOn: ['critical']` to fail only on the most severe issues and surface the rest without blocking. `tags` scopes the ruleset and defaults to `['wcag2a', 'wcag2aa']` when omitted; `scope` limits the scan to a CSS selector. The `accessibility` fixture delegates to this helper, so there's one axe implementation across the suite.
- **`assertKeyboardReachable(page)`** — asserts no genuinely-interactive control (links, buttons, form fields) has been pulled out of the tab order with a negative `tabindex`.

```typescript
import { test } from '@base';
import { assertNoA11yViolations, assertKeyboardReachable } from '@utils/accessibility';

test('home page has no critical a11y violations', { tag: ['@a11y'] }, async ({ page }) => {
  await page.goto('/');
  await assertNoA11yViolations(page, { failOn: ['critical'] });
  await assertKeyboardReachable(page);
});
```

> The existing `accessibility` fixture runs a strict zero-tolerance WCAG 2 A/AA scan and navigates via a page object; these helpers are the lighter-weight, severity-aware alternative for direct use in specs. Use whichever fits.

### Performance (`utils/performance.ts`, `utils/performanceThresholds.ts`)

`collectPerformanceMetrics(page)` reads Navigation Timing + paint metrics (TTFB, DOMContentLoaded, load, FCP, LCP) from the live page, and `assertMetricsWithinThresholds(metrics, thresholds)` asserts them against a budget. `PERFORMANCE_THRESHOLDS` ships a conservative default — re-baseline it against your own app. This complements the Lighthouse fixture: Lighthouse gives an audited score, these give cheap per-page / per-viewport load budgets.

```typescript
import { collectPerformanceMetrics, assertMetricsWithinThresholds } from '@utils/performance';
import { PERFORMANCE_THRESHOLDS } from '@utils/performanceThresholds';

test('home page loads within budget', { tag: ['@perf'] }, async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  const metrics = await collectPerformanceMetrics(page);
  assertMetricsWithinThresholds(metrics, PERFORMANCE_THRESHOLDS);
});
```

### External navigation (`utils/externalNavigation.ts`)

- **`assertExternalLinkBehavior(page, context, link, expectedUrl?)`** — clicking an external link either opens a new tab or navigates to a different origin (WebKit-safe: keys off the `target` attribute rather than waiting on a popup). Pass `expectedUrl` to assert against a specific URL/pattern instead of any `https?://` origin.
- **`assertAbsoluteHref(link)`** / **`expectUrlToMatchHref(page, href)`** — small href assertions for link checks.

### CSS (`utils/css.ts`)

- **`getCss(locator, property)`** — reads a single resolved computed-style value for an element, e.g. `await getCss(locator, 'background-color')`. Use this instead of calling `getComputedStyle()` directly inside `locator.evaluate()` — the latter is flagged by `pnpm lint`.

### Image comparison (`utils/imageComparison.ts`)

- **`screenshotsMatch(a, b, maxDiffPixels?, threshold?)`** — compares two PNG screenshot buffers with [`pixelmatch`](https://github.com/mapbox/pixelmatch) and returns `true` if they're visually equivalent (same dimensions, and at most `maxDiffPixels` differing pixels, default `10`). `threshold` (`0`–`1`, default `0.05`) controls per-pixel sensitivity — lower is stricter. Use it to confirm a visible focus/hover state actually changed the rendering, or that a component's visual state reverted after an interaction ended.

```typescript
import { screenshotsMatch } from '@utils/imageComparison';

test('links should have a visible hover state', async ({ basePage }) => {
  const link = basePage.footer.bottomLinks.first();

  const beforeHover = await basePage.footer.section.screenshot();
  await link.hover();

  const afterHover = await basePage.footer.section.screenshot();
  expect(screenshotsMatch(beforeHover, afterHover)).toBe(false);
});
```

> Take both screenshots scoped to the smallest element that should change (e.g. a component's root, not the full page) — a narrower scope means less incidental noise for `pixelmatch` to weigh against `maxDiffPixels`. This complements `expect(page).toHaveScreenshot()` (used in `tests/visualRegression.spec.ts`) — reach for that built-in Playwright snapshot comparison for whole-page regression baselines, and `screenshotsMatch` for one-off before/after diffs where there's no baseline file to maintain.

### Keyboard navigation (`utils/keyboard.ts`)

- **`pressTab(page, locator?)`** — presses `Tab` to advance focus, or `Option+Tab` on WebKit (Safari, Mobile Safari, Mobile Tablet Safari), where plain `Tab` only visits form controls and skips `<a>` links. This is a known Playwright/WebKit limitation ([playwright#2114](https://github.com/microsoft/playwright/issues/2114)), not a site bug — use this helper instead of `page.keyboard.press('Tab')` in any test that tabs onto or off of a link. It detects the browser engine from `page` itself, so there's no need to also request the `browserName` fixture. Pass `locator` to press `Tab` from a specific element (preferred); omit it to press from whatever currently has page focus, e.g. inside a loop where the focused element changes each iteration.

```typescript
import { pressTab } from '@utils/keyboard';

test('tab from logo should move focus to the first column link', async ({ page, basePage }) => {
  const firstColumnLink = (await basePage.footer.getColumnLinks(basePage.footer.columnOne)).first();

  await pressTab(page, basePage.footer.logo);
  await expect(firstColumnLink).toBeFocused();
});
```

> A raw `page.keyboard.press('Tab')` or `locator.press('Tab')` is flagged by `pnpm lint` (`no-restricted-syntax`, error-level) — always go through `pressTab`.

## Linting

Test quality is enforced by [`eslint-plugin-playwright`](https://github.com/playwright-community/eslint-plugin-playwright), configured in `eslint.config.mjs` and scoped to `tests/`, `objects/`, `testFixtures/`, and `utils/`:

```bash
pnpm lint
```

Key rules:

- `no-conditional-in-test` and `no-conditional-expect` are **errors** — keep branching out of test bodies (see Test Conventions below).
- `expect-expect` is taught about the `assert*` / `check*` / `verify*` helper naming, so a test that delegates its assertions to a POM method or a quality fixture still counts as asserting something.
- `no-restricted-imports` requires the `@base` / `@pages/*` / `@components/*` / `@utils/*` aliases instead of relative paths into those folders.
- `@typescript-eslint/naming-convention` — classes/interfaces/type aliases/enums must be PascalCase, everything else (variables, functions, methods, parameters) camelCase (module-level `const` may also be UPPER_CASE, e.g. `ANALYTICS_HOSTS`). Object literal property keys are exempt (cookie names, JSON-LD keys, etc. aren't ours to rename).
- `check-file/filename-naming-convention` — filenames under `objects/**` must be PascalCase (matching the class(es) they contain); filenames under `tests/`, `testFixtures/`, `utils/`, `types/`, `config/`, `lib/` must be camelCase (`.spec.ts`/`.setup.ts` suffixes are ignored when checking casing).
- `eslint-plugin-jsdoc` (`warn`-level, across `tests/`, `objects/`, `testFixtures/`, and `utils/`) expects a description, `@param`s (including destructured params, via `jsdoc/check-param-names`), and a `@returns` on class methods; document plain functions/fixtures the same way for consistency even where not strictly enforced.
- `.fixme()` usage is flagged (`warn`) as a nudge to circle back on work-in-progress tests.

## Test Conventions

These mirror the patterns from the best-practices refactor — keep new tests consistent with them (they're enforced by `pnpm lint` where possible):

- **Import from the fixture, not Playwright.** Specs use `import { test, expect } from '@base'` (the `@base` path alias) so they get the page-object fixtures plus the `blockAnalytics` / `cookieConsent` auto fixtures.
- **No branching in test bodies.** No `if`/`else`, ternaries, or loops that change which assertions run. Push branching into POM methods, and use `test.skip(condition, reason)` for genuinely data-dependent cases. Data-driven `for` loops that _generate_ parametrised tests are fine.
- **Page objects expose locators as `readonly` properties / getters** — never `async getX(): Promise<Locator>`. Name public assertion helpers `assert*` (the linter also recognises `check*` / `verify*`).
- **Tags use the details-object syntax only:** `test('…', { tag: ['@smoke', '@a11y'] }, async () => { … })`. Don't put tags in the title string or in `// @tag:` comments.
- **Prefer `grepInvert` tags over manual skips.** `@quality-gate` / `@desktop` / `@mobile` are excluded per-project via `config/projects.ts`'s `grepInvert` — tag the describe block instead of hand-rolling `testInfo.skip(...)` in every test.

## Best Practices

### Test Writing

- ✅ Import test fixtures via the `@base` alias (`testFixtures/base.ts`), not from `@playwright/test` directly
- ✅ Use descriptive test names that explain what is being tested
- ✅ Leverage page objects instead of writing raw selectors in tests
- ✅ Prefer `data-testid` attributes for stable element selection
- ✅ Use `test.skip()` conditionally for features not yet implemented or environment-specific limitations
- ✅ Mark work-in-progress tests with `test.fixme()`
- ✅ Add appropriate tags (`@quality-gate`, `@visual`, `@smoke`, whitelabel tags) for test filtering
- ✅ Keep tests independent - each test should set up its own state

### Page Object Development

- ✅ Inherit from `BasePage` for common functionality
- ✅ Define the page's default URL in the `url` property
- ✅ Group related locators logically
- ✅ Create reusable methods for common page interactions
- ✅ Keep locators as class properties, not buried in methods
- ✅ Use component composition for shared UI elements
- ✅ Document public methods with JSDoc (description, `@param`s, `@returns`) — enforced by `eslint-plugin-jsdoc`

### Maintenance

- ✅ Keep CI/CD container versions in sync with the `@playwright/test` version (if applicable)
- ✅ Update environment configs when URLs or endpoints change
- ✅ Review and update visual regression baselines when intentional design changes occur
- ✅ Run code formatting using Prettier before committing to maintain consistent code style
- ✅ Regularly audit and remove obsolete tests
- ✅ Document complex test scenarios with comments
- ✅ Keep test data separate from test logic
- ✅ Update this README with project-specific information

### Performance

- ✅ Use `waitFor()` only when necessary - Playwright auto-waits by default
- ✅ Avoid fixed `wait()` calls - use dynamic waiting strategies
- ✅ Reuse authenticated state when possible to avoid repeated login flows
- ✅ Use `test.describe.configure({ mode: 'serial' })` for dependent tests that share expensive setup

## Troubleshooting

### Common Issues

**Tests fail locally but pass in CI (or vice versa)**

- Check browser versions match between local and CI
- Verify environment variables are set correctly
- Check for timing issues - CI may be slower/faster than local

**Flaky tests**

- Avoid fixed waits - use dynamic waiting
- Check for race conditions with async operations
- Ensure proper page load completion before interactions
- Use `test.describe.configure({ retries: 2 })` as a last resort

**Visual regression failures**

- Ensure screenshots are generated in the same environment
- Check for dynamic content (timestamps, random IDs)
- Verify viewport sizes match across environments
- Update baselines when design changes are intentional

**Locator not found**

- Verify `data-testid` exists in the DOM
- Check for timing issues - element may not be loaded yet
- Inspect element in browser DevTools
- Use Playwright Inspector to debug: `pnpm exec playwright test --debug`

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Contributing

When contributing to this test framework:

1. Follow the established patterns for page objects and fixtures
2. Add appropriate test tags for filtering
3. Document complex test scenarios
4. Update this README when adding new features or changing workflows
5. Ensure all tests pass before submitting changes
6. Request `data-testid` attributes for new UI elements before writing selectors
