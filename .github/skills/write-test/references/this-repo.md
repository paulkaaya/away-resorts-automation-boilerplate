# Cached discovery: playwright-boilerplate

This is the result of already running step 1 (discovery) in this specific repo. Treat it as a shortcut, not a substitute for common sense — if something here looks stale against the current codebase, re-derive it and update this file rather than trusting it blindly. This is a boilerplate/template repo (see `README.me`'s onboarding notes) — it ships with placeholder content, an auth scaffold that stays dormant until real credentials are wired in, and only two example content components, so several sections below are deliberately thin until a real client project fills them in.

## Layout

- Specs: flat under `tests/*.spec.ts` (no `tests/components/` or `tests/pages/` split yet — `authExample.spec.ts`, `customFixtureExample.spec.ts`, `globalSeo.spec.ts`, `lighthouseAndAccessibility.spec.ts`, `visualRegression.spec.ts`). `tests/auth.setup.ts` is the auth setup project, not a spec.
- POM/component classes: `objects/pages/BasePage.ts` (the one page object today, besides `LoginPage.ts`) and `objects/components/*.ts`. `BasePage` already composes `HeaderNav` and `FooterNav` (shared chrome) as fields.
- Fixture wrapper: `testFixtures/base.ts`, re-exported as `expect`/`test` (and `primaryUserTest`/`secondaryUserTest` for authenticated sessions) from the `@base` alias. Specs must import from `@base`, never `@playwright/test` directly — that's the only way to get the `basePage`, `loginPage`, `accessibility`, `qualityGate`, `lighthouse`, and per-component fixtures (below).

## Import aliases (tsconfig `paths`)

```
@base            -> testFixtures/base
@utils/*         -> utils/*
@pages/*         -> objects/pages/*
@components/*    -> objects/components/*
```

ESLint's `no-restricted-imports` blocks relative imports into any of these — always use the alias.

## Feature-shape examples

- **Shared chrome**: `HeaderNav` / `FooterNav` (`objects/components/HeaderNavigation.ts`, `FooterNavigation.ts`), attached in `BasePage`'s constructor and reached in specs via `basePage.header` / `basePage.footer`. **They're also separately registered as component fixtures** (`headerNavigation`, `footerNavigation`) for specs that need the component in isolation, without a `basePage`.
- **Content block**: no example ships yet — the boilerplate is intentionally generic here. When you add the first one (e.g. an `AccordionBlock`), follow this skill's default: register it as a component fixture (`Components` type + `createComponentFixture`) rather than constructing it inline, since the fixture mechanism already exists and `headerNavigation`/`footerNavigation` establish the pattern.
- **Whole new page**: `LoginPage` (`objects/pages/LoginPage.ts`) is the second example beyond `BasePage` — registered in `types/types.ts`'s `Pages` type and `testFixtures/base.ts`'s `createPageFixture(LoginPage)`, right where the file says `/* Add other page types here as needed, make sure to import them */`. It's a provider-agnostic template (every site-specific locator marked `← TODO`) driven only by `tests/auth.setup.ts`, not called from specs directly.

## Component fixtures (`types/types.ts`'s `Components` type)

New content-block or standalone components should follow the same pattern as pages, but via the `Components` type and `createComponentFixture` (not `createPageFixture`):

```ts
function createComponentFixture<T extends Components[keyof Components]>(
  factory: (page: Page) => T
) {
  return async ({ page }: { page: Page }, use: (page: T) => Promise<void>): Promise<void> => {
    await use(factory(page));
  };
}
```

Registered by passing a factory function, not a bare constructor — this is how `headerNavigation` supplies `HeaderNav`'s extra `isMobile` constructor arg:

```ts
headerNavigation: createComponentFixture(
  page => new HeaderNav(page, (page.viewportSize()?.width || 0) < 768)
),
```

To add a new one: add the class import + `<fixtureKey>: <ClassName>;` to `Components` in `types/types.ts`, then `<fixtureKey>: createComponentFixture(page => new <ClassName>(page)),` in `testFixtures/base.ts`, right where the file says `/* Add other component fixtures here as needed, make sure to import them */`.

## Environment-scoped page paths

`types/envConfig.ts` defines optional keys (`searchUrl`, `articleUrl`, `loginUrl`, …) on the `EnvConfig` interface; only `config/dev.ts` exists today (this boilerplate ships one environment — add `qa.ts`/`staging.ts`/`prod.ts` following the same shape as a real project needs them, and register each in `utils/environmentManager.ts`'s `environments` map). Specs read them via:

```ts
const envManager = new EnvironmentManager();
const searchUrl = envManager.getValue('searchUrl');
```

Add a new key the same way, and only populate it in whichever environment(s) actually have the content — don't add it everywhere speculatively.

## Describe-block scheme actually used

Top-level groups, used selectively per feature: `navigation`, `visibility and interaction`, `accessibility` — see `references/spec-patterns.md` for when to split further into `device agnostic`/`desktop`/`mobile`. No existing spec in this boilerplate demonstrates the full split yet (the shipped examples are quality-gate/a11y/visual-regression style, not component interaction tests) — `config/projects.ts` still sets up `grepInvert` for `@desktop`/`@mobile`/`@quality-gate`, so the tagging mechanism is ready even though no test uses `@desktop`/`@mobile` yet.

## Visual diffing options

Two complementary tools, not a single mechanism:

- **`expect(page).toHaveScreenshot()`** (built-in Playwright snapshot comparison) — used in `tests/visualRegression.spec.ts` for whole-page regression baselines checked into the repo.
- **`screenshotsMatch(a, b, maxDiffPixels?, threshold?)`** from `@utils/imageComparison` — a `pixelmatch` diff of two PNG screenshot buffers, `true` if they're visually equivalent. Use this for the generic "screenshot before/after, assert they differ" focus/hover pattern (see `spec-patterns.md`) where there's no baseline file to maintain — scope both screenshots to the smallest element expected to change (e.g. a component's `.section` root), not the whole page.

## Cross-browser Tab presses

`pressTab(page, locator?)` from `@utils/keyboard` — WebKit (`Safari`, `Mobile Safari`, `Mobile Tablet Safari` in `config/projects.ts`) only visits form controls with a plain `Tab` key press, silently skipping `<a>` links (a Playwright/WebKit limitation, not a site bug). `pressTab` reads the engine off `page` itself and substitutes `Option+Tab` on WebKit. A raw `page.keyboard.press('Tab')` / `locator.press('Tab')` is an ESLint error (`no-restricted-syntax`) pointing back at this helper — there's no opt-out, so use it in any new test that tabs onto or off of a link.

## Lint rules with teeth (from `eslint.config.mjs`)

- `noRawLocator`-equivalent: raw locators (`.getByRole()`, `.locator()`, etc.) are only legal inside `objects/`, never inside `tests/`.
- No XPath locators, no chained/combinator CSS selectors (`div.a > div.b.c`) — both explicitly blocked with custom messages.
- No `.page` read off a non-`this` object — use the `page` fixture directly instead of `basePage.page`.
- No `getComputedStyle` inside `.evaluate()` outside of `utils/css.ts` itself — use `getCss(locator, property)` from `@utils/css`.
- No `waitForLoadState()` — prefer `expect(locator).toBeVisible()`.
- No raw `.press('Tab')` (on `page.keyboard` or any locator) — use `pressTab(page, locator?)` from `@utils/keyboard`. (These four rules, plus `.fixme()`/XPath/chained-CSS above, are split across two separately-configured instances of the same underlying `no-restricted-syntax` rule — aliased as `local/no-restricted-syntax-warn` and `local/no-restricted-syntax-error` — purely so the `.fixme()`/XPath/chained-CSS group can stay `warn`-level while this group is `error`-level; both fire from the same selector-list mechanism.)
- `expect-expect` requires an assertion per test, recognizing fixtures/helpers named `qualityGate`, `accessibility`, `lighthouse`, or matching `^assert.*`/`^check.*`/`^verify.*`/`^open$`/`^close$`/`^openSearch$` as satisfying it — so custom POM assertion helpers must be prefixed `assert`/`check`/`verify` (or named exactly `open`/`close`/`openSearch`) to count.
- `prefer-lowercase-title` — test titles must be lowercase.
- `no-conditional-in-test` / `no-conditional-expect` — use `test.skip(condition, reason)` for genuine data-dependent skips instead.
- A stylistic rule requires a blank line immediately after any `goto(...)`/`skip(...)` call.
- `jsdoc/require-jsdoc` (warn) — most non-trivial POM methods carry a full JSDoc block (description, `@param`, `@returns`, including on `async` methods that resolve `void`); match this for new methods.
- `local/comment-length` (warn) — comments and JSDoc descriptions over 200/400 characters respectively get flagged; shorten or move detail to linked docs instead.
- `local/class-property-order-matches-constructor` (error, auto-fixable) — in `objects/**/*.ts`, class property declarations must appear in the same order as their constructor assignments.
- `@typescript-eslint/explicit-function-return-type` — every method/function needs an explicit return type annotation.
- `@typescript-eslint/naming-convention` — classes/interfaces/type aliases/enums must be PascalCase, everything else (variables, functions, methods, parameters) camelCase (module-level `const` may also be UPPER_CASE, e.g. `ANALYTICS_HOSTS`). Object literal property keys are exempt (cookie names, JSON-LD keys, etc. aren't ours to rename).
- `check-file/filename-naming-convention` — filenames under `objects/**` must be PascalCase (matching the class(es) they contain); filenames under `tests/`, `testFixtures/`, `utils/`, `types/`, `config/`, `lib/` must be camelCase (`.spec.ts`/`.setup.ts` suffixes are ignored when checking casing).

## Commands

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint --cache .
pnpm lint:fix    # eslint --cache --fix .
pnpm format      # prettier --write .  (separate pass from lint — ESLint no longer runs Prettier as a rule)

# Run a spec for real (this boilerplate ships one environment, "dev"):
npx playwright test <path/to/new.spec.ts> --project=Chrome --project="Mobile Chrome"
```
