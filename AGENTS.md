# Agent Guide — Playwright E2E Framework

> Single source of truth for AI coding assistants (Claude Code, GitHub Copilot, etc.). `CLAUDE.md` and `.github/copilot-instructions.md` both point here. Keep project conventions in **this** file.

This is a TypeScript Playwright end-to-end test framework using the Page Object Model. Package manager is **pnpm** (pinned via `packageManager` in `package.json`).

## Golden rules

1. **Import `test`/`expect` from `testFixtures/base.ts` via the `@base` path alias, never from `@playwright/test` directly.**

   ```ts
   import { test, expect } from '@base';
   ```

   `@base` is defined in `tsconfig.json`'s `paths` and resolves to `./testFixtures/base` — use it instead of a relative path, no matter how deep the importing file is nested.

   The only exception is a test that must bypass fixture behaviour (e.g. exercising the cookie banner or a 404 page) — these opt out per-file, e.g. `test.use({ dismissCookies: false })`.

   Likewise, import anything under `utils/` via the `@utils/*` alias (e.g. `import { EnvironmentManager } from '@utils/environmentManager'`), page objects via `@pages/*` (e.g. `import { BasePage } from '@pages/BasePage'`), components via `@components/*` (e.g. `import { HeaderNav } from '@components/HeaderNavigation'`), and the `Pages`/`Components` type registries via `@types` (i.e. `import type { Pages } from '@types'`) instead of relative paths. This is enforced by the `no-restricted-imports` ESLint rule.

2. **Prefer `data-testid` for locators.** This is a CMS-driven site; text/structure-based locators go stale fast. Fallback order: `getByTestId` → `getByRole` → simple semi-stable CSS → `getByLabel` → `getByText`. Request new `data-testid`s from devs using descriptive kebab-case names (e.g. `load-more`, `card-title`).

3. **Use page objects, not raw selectors in tests.** Keep locators as class properties, not buried in methods.

4. **Lint + format + type-check before considering work done:** `pnpm lint:fix`, `pnpm format`, and `pnpm typecheck`. Linting and formatting are **separate passes**, not one: ESLint (`eslint --cache`) no longer runs Prettier as a rule — `eslint-config-prettier` just disables the stylistic ESLint rules (e.g. from `@stylistic/eslint-plugin`) that would otherwise fight Prettier's own formatting, and Prettier runs on its own (`pnpm format` / `pnpm exec prettier --check .`) because that's meaningfully faster than routing every file through the `prettier/prettier` ESLint rule. The formatting options live in **one place**: `prettierOptions` in `eslint.config.mjs` (kept there purely as the shared source of truth); `prettier.config.mjs` re-exports them so the Prettier CLI stays in lockstep, and `.prettierignore` mirrors the ESLint `ignores`. Note `endOfLine: 'auto'` — Prettier accepts the line endings already on disk so it doesn't fight Git's `core.autocrlf` on Windows checkouts. (In Claude Code these run automatically on edit via a hook; in other tools run them manually.) Code under `tests/`, `objects/`, `testFixtures/`, and `utils/` also gets a JSDoc lint pass (`eslint-plugin-jsdoc`, `warn`-level) — give every method/function a description, `@param`s (including one entry per destructured property, e.g. `@param root0.context` for a `{ context }` parameter — checked by `jsdoc/check-param-names`), and a `@returns` (including on `async` methods that resolve `void` — `forceReturnsWithAsync` requires it). Comments and JSDoc descriptions also get a length check (`local/comment-length`, `warn`-level, 200/400 chars) — shorten or move detail to linked docs rather than growing a comment past the limit. Class property declarations in `objects/**/*.ts` must be declared in the same order as their constructor assignments (`local/class-property-order-matches-constructor`, `error`-level, auto-fixable when there's no comment between the properties).

## Project layout

| Path | Purpose |
| --- | --- |
| `config/*.ts` (`dev`, `qa`, `staging`, `prod`, …) | Per-environment config values (`EnvConfig` instances) |
| `config/defaults.ts` | Default value for every optional `EnvConfig` key, merged under the active environment's config so `EnvironmentManager.getValue()` never returns `undefined` |
| `config/projects.ts` | Browser/device projects (Chrome, Firefox, Safari, Edge, mobile, tablet) |
| `objects/pages/BasePage.ts` | Base page class, extend it for every new page object |
| `objects/pages/LoginPage.ts` | Provider-agnostic login template (swap locators/steps for your IdP) |
| `objects/components/*.ts` (import via `@components/*`) | Reusable UI components. Shared chrome (`HeaderNavigation`, `FooterNavigation`) is instantiated once in `BasePage` and exposed as `this.header` / `this.footer`; it's also available as its own fixture (see below) for tests that don't need a full page object. Content-block components you add later (e.g. an `AccordionBlock`) should follow the same fixture pattern |
| `testFixtures/base.ts` (import via the `@base` alias) | Custom fixtures — the entry point for all tests |
| `tests/auth.setup.ts` | Setup project: logs each role in once, saves `storageState` |
| `utils/auth.ts` (import via `@utils/auth`) | `authFiles` paths + `isAuthConfigured()` gate |
| `tests/**/*.spec.ts` | Test specs, organised by feature/page |
| `types/types.ts` | The `Pages` and `Components` type registries — **every page or component fixture must be added here** |
| `types/envConfig.ts` | `EnvConfig` interface for environment values |
| `utils/environmentManager.ts` (import via `@utils/environmentManager`) | `EnvironmentManager` — selects active env, exposes `getValue()` |
| `utils/accessibility.ts`, `utils/performance.ts`, `utils/css.ts` (import via `@utils/accessibility`, `@utils/performance`, `@utils/css`) | a11y / Lighthouse / computed-style helpers |
| `utils/imageComparison.ts` (import via `@utils/imageComparison`) | `screenshotsMatch(a, b, maxDiffPixels?, threshold?)` — pixelmatch diff of two PNG screenshot buffers; use to confirm a focus/hover state actually changed the rendering |
| `utils/keyboard.ts` (import via `@utils/keyboard`) | `pressTab(page, locator?)` — presses `Tab` (from `locator` if given, else current page focus), or `Option+Tab` on WebKit where plain `Tab` skips `<a>` links |
| `utils/externalNavigation.ts`, `utils/performanceThresholds.ts` | External-link and page-load-budget assertion helpers — see the skill below |
| `lib/lighthouseThresholds.ts` | Default Lighthouse score thresholds, env-aware (lower SEO threshold on non-prod) |

Unsure which `utils/` helper fits a given spec, or whether a new one needs fixture wiring? `.github/skills/using-utils/SKILL.md` is the lookup table (fixture-wired vs. direct-import, one-liner per file); README.md's "Quality & Accessibility Helpers" section has the full prose and runnable examples.

## Adding a new page object (the 4-step ritual)

1. Create the class in `objects/pages/`, extending `BasePage` (import via `@pages/BasePage`). Its constructor takes `(page: Page, envManager: EnvironmentManager)` and must call `super(page, envManager)` — `createPageFixture` supplies both from the fixture system, so page objects never import/instantiate `EnvironmentManager` themselves. Set its `url` and declare locators (prefer `getByTestId`) in the constructor.
2. Add it to the `Pages` type in **`types/types.ts`**.
3. Register a fixture in **`testFixtures/base.ts`** under the `//page types` section using the factory:
   ```ts
   newPage: createPageFixture(NewPage),
   ```
4. Import the new class at the top of `testFixtures/base.ts`.

`createPageFixture(PageClass)` handles instantiation and shared setup (`setupPage`). Don't hand-roll fixtures unless you need custom setup/teardown.

## Adding a new component fixture

1. Add `<fixtureKey>: <ClassName>;` to the `Components` type in **`types/types.ts`**.
2. Register a fixture in **`testFixtures/base.ts`** using the `createComponentFixture` factory, which takes a `factory` function rather than a bare constructor so components needing extra constructor args (e.g. `HeaderNav`'s `isMobile` flag) can still be wired up:
   ```ts
   headerNavigation: createComponentFixture(page => new HeaderNav(page, isMobileFlag)),
   ```
3. Import the new class at the top of `testFixtures/base.ts` and `types/types.ts`.

Existing component fixtures: `headerNavigation`, `footerNavigation`. A test that needs non-default construction can still bypass the fixture and construct the class directly with `new ComponentClass(page, ...args)`.

## Fixtures available

- **`qualityGate(pageObj, customUrl?)`** — navigates then runs SEO checks, broken-image check, header/footer visibility, single-H1 check.
- **`accessibility(pageObj, customUrl?)`** — axe-core scan against `wcag2a` + `wcag2aa`, asserts zero violations.
- **`lighthouse(pageObj, customUrl?, thresholds?)`** — Lighthouse audit against numeric thresholds (per-worker browser + port). `thresholds` defaults to `lighthouseThresholds(envManager.isProd())` from `lib/lighthouseThresholds.ts` when omitted.
- **Page and component fixtures** — every entry in the `Pages`/`Components` type registries (`types/types.ts`) is available as a same-named fixture, built via `createPageFixture`/`createComponentFixture` in `testFixtures/base.ts`.
- **Auto fixtures (always on):** `blockAnalytics` (aborts GTM/GA requests so test traffic never skews marketing data) and `cookieConsent` (pre-seeds the OneTrust `OptanonAlertBoxClosed` cookie). Opt out of consent suppression with `test.use({ dismissCookies: false })`.
- **`envManager`** — worker-scoped `EnvironmentManager` for the active environment. Use it instead of importing/instantiating `EnvironmentManager` yourself: `test('...', async ({ envManager }) => { envManager.getValue('baseUrl'); })`. Page objects receive it as a constructor argument instead (see below).

## Authentication

The framework signs each role in **once** and replays the session, rather than logging in per test. Three moving parts:

1. **`objects/pages/LoginPage.ts`** — a provider-agnostic login page object (template). The locators (`usernameField`, `passwordField`, `submitButton`, `loginTrigger`, `loggedInIndicator`) and the `login()` steps are a generic username/password form marked `← TODO`; a commented **SSO-redirect variant** (header click → external IdP) sits beside the default. Swap these for the client's real provider (Okta, Auth0, Azure AD B2C, bespoke form).
2. **`tests/auth.setup.ts`** — a Playwright **setup project** (`testMatch: /.*\.setup\.ts/`, wired in `playwright.config.ts` so every browser project has `dependencies: ['setup']`). It calls `loginPage.login()` per role and writes the session to `playwright/.auth/<role>.json` via `context.storageState()`. The `.auth/` dir is git-ignored.
3. **Role fixtures** — `testFixtures/base.ts` exports `primaryUserTest` and `secondaryUserTest`, each pinned to its `storageState` file. Import these instead of `test`:

   ```ts
   import { primaryUserTest, expect } from '@base';

   primaryUserTest('shows account menu', async ({ loginPage }) => { ... });
   ```

   (Or per-file: `test.use({ storageState: authFiles.primaryUser })`.)

**Credentials** default to `config/<env>.ts` (`loginUrl`, `primaryUser*`, `secondaryUser*` in `EnvConfig`); they can be moved to `.env` (see `.env.example`). **`isAuthConfigured()`** (`utils/auth.ts`) returns false while values are still placeholders, so the setup project and `tests/authExample.spec.ts` skip themselves and the suite stays green until real values are wired in.

**Add a role:** add an entry to `authFiles`, a setup test in `auth.setup.ts`, and an exported fixture in `base.ts`. **No auth at all?** Delete `LoginPage.ts`, `auth.setup.ts`, `authExample.spec.ts`, the role fixtures, and the `setup` project wiring.

## Test conventions

- Add tags for selective runs: `@quality-gate`, `@visual`, `@smoke`, `@regression`, `@authenticated`, plus project/whitelabel tags as needed. Tags use the details-object **array** syntax only: `test('…', { tag: ['@smoke'] }, ...)`.
- `@quality-gate`-tagged tests are excluded everywhere except `Chrome` via `grepInvert` in `config/projects.ts` — tag a describe block once instead of hand-rolling a per-test `testInfo.skip(project.name !== 'Chrome', ...)` check.
- Likewise, tag device-specific tests `@desktop` / `@mobile` and let `config/projects.ts`'s `grepInvert` exclude them on the wrong device, instead of manually skipping on `basePage.isMobile()` in the test body.
- Filter with `--grep @smoke` / `--grepInvert @slow`.
- Keep tests independent — each sets up its own state.
- Use `test.skip()` for env-specific gaps, `test.fixme()` for WIP (flagged by ESLint at `warn` so it doesn't silently pile up).
- Tabbing onto or off of a link (`<a>`)? Use `pressTab(page, locator)` from `utils/keyboard.ts`, not `page.keyboard.press('Tab')` directly — plain `Tab` skips links in WebKit (Safari, Mobile Safari, Mobile Tablet Safari all use it), a known Playwright/WebKit limitation, not a site bug. Pass the locator to tab from (preferred); omit it only when tabbing repeatedly from whatever currently has focus, e.g. in a loop. This is enforced by ESLint (`no-restricted-syntax`, error-level).
- Avoid fixed `waitForTimeout` — rely on Playwright auto-waiting / dynamic waits.

## Environments

Selected via the `ENV` variable (e.g. `ENV=qa`), typed as `Env` (`'dev' | 'qa' | 'staging' | 'prod'`) in `utils/environmentManager.ts`. Inside a test/fixture, access values through the `envManager` fixture rather than importing `EnvironmentManager` yourself:

```ts
test('...', async ({ envManager }) => {
  const baseUrl = envManager.getValue('baseUrl');
});
```

Outside the fixture system — `playwright.config.ts`, `config/projects.ts`, or module-scope code that runs before any test (e.g. `tests/auth.setup.ts`'s `setup.skip` gate) — instantiate `new EnvironmentManager()` directly, since fixtures only exist inside a running test.

`EnvironmentManager.getValue()` always returns a real string, never `undefined` — every optional `EnvConfig` key is defaulted in `config/defaults.ts` and merged under the active `config/<env>.ts`, so callers never need `?? ''` / `|| ''`. To add a config value: add the key to the `EnvConfig` interface in `types/envConfig.ts`, add a default for it in `config/defaults.ts` (unless every environment must set it explicitly), then set it in each environment file under `config/` (`dev.ts`, `qa.ts`, `staging.ts`, `prod.ts`, …) that needs a non-default value.

Need the suite to cover more than one site/brand (e.g. a UK site and a US site, each with their own `env` matrix), not just more environments? That's an orthogonal dimension this boilerplate doesn't wire by default — don't bolt it on with `if`/`else` in page objects or env files per site. Use `.github/skills/add-multi-site-support/SKILL.md`, which restructures `config/`, the fixtures, and the project matrix for it.

## Editor snippets

`.vscode/playwright.code-snippets` scaffolds page objects, components, and test blocks — type a prefix (`pom`, `pom-component`, `spec`, `spec-auth`, `page-spec`, `describe`, `describe-tag`, `device-describe`, `test`, `test-tag`, `test-step`, `beforeEach`, `test-qualitygate`, `test-accessibility`, `loc-field`, `loc-testid`) in a `.ts` file and pick it from IntelliSense.

## Commands

```bash
pnpm first:install   # pnpm install + playwright install + husky (one-time setup)
pnpm test            # all tests
pnpm test:qa         # ENV=qa
pnpm test:staging    # ENV=staging
pnpm exec playwright test --ui        # UI mode
pnpm exec playwright test --grep @smoke
pnpm lint            # eslint --cache .
pnpm lint:fix        # eslint --cache --fix .
pnpm typecheck       # tsc --noEmit
pnpm format          # prettier --write .  (bulk-format all files incl. md/json/yml)
pnpm exec prettier --check .   # format check only, no writes (what pre-commit runs)
```

## CI/CD

Azure DevOps pipelines in `ci-*.yml` / `ci-templates/`. Sharding for parallelism, Testmo for reporting (`TESTMO_TOKEN`/`TESTMO_URL`/`TESTMO_ID` secrets). Keep the Playwright Docker container version in pipelines in sync with the `@playwright/test` version in `package.json`.

### Git hooks (Husky)

Husky installs via the `prepare` script on `pnpm install` (also covered by `pnpm first:install` for a fresh clone).

- **`pre-commit`** (`.husky/pre-commit`) runs three checks, in order:
  1. **Lint gate** — `pnpm lint` (`eslint --cache .`). A violation aborts the commit; fix with `pnpm lint:fix`.
  2. **Format gate** — `pnpm exec prettier --check .`. A violation aborts the commit; fix with `pnpm format`.
  3. **Playwright Docker sync** — keeps the CI Docker image in sync with Playwright and pnpm. Whenever `package.json` is part of a commit, it reads the staged `@playwright/test` version and pnpm major version and, if either differs from the current tag, rewrites the `dockerContainer` value in `ci-templates/playwrightTemplate.yml` to `ecmchow/node-playwright-pnpm:v<playwright-version>-node<node-major>-pnpm<pnpm-major>-noble` (Node major is preserved from the existing tag, since it isn't tracked in `package.json`) and re-stages the template so the sync lands in the same commit. If you bump Playwright in another template/pipeline file too, mirror it there manually — the hook only manages `playwrightTemplate.yml`.

Line endings are pinned to LF via `.gitattributes` (`* text=auto eol=lf`) so files don't show as phantom-modified on Windows checkouts where `core.autocrlf=true` would otherwise expect CRLF.
