---
name: using-utils
description: Use when writing or reviewing a Playwright spec, page object, or component in this repo and unsure whether a helper already exists in utils/ — for accessibility scans, external-link checks, keyboard/Tab navigation, computed-CSS reads, visual/pixel diffing, or page-load performance assertions — before hand-rolling a `page.evaluate`, a raw `Tab` keypress, or a manual `pixelmatch` call. Also use when adding a new file to utils/ to decide whether it needs wiring into testFixtures/base.ts or stays a plain imported helper.
---

# Using utils/

## Two shapes of helper

- **Fixture-wired** — already threaded into `testFixtures/base.ts`, reached through a fixture rather than imported directly: `environmentManager.ts` (`envManager` fixture — see AGENTS.md's Environments section / README's "Environment Management"), `auth.ts` (`authFiles`/`isAuthConfigured()`, consumed by `tests/auth.setup.ts` and the role fixtures — README's "Authentication"), and `accessibility.ts`'s `assertNoA11yViolations` (backs the `accessibility` fixture's strict WCAG scan).
- **Direct-import helpers** — plain functions with no fixture wrapper, imported straight from `@utils/*` inside a POM method or spec: `css.ts`, `externalNavigation.ts`, `imageComparison.ts`, `keyboard.ts`, `performance.ts`, `performanceThresholds.ts`. **None of these are called anywhere in this boilerplate's shipped examples yet** — they exist so the next test that needs one doesn't reinvent it. Full prose + runnable examples for every one of these live in README.md's **"Quality & Accessibility Helpers"** section — read that before writing a new caller, this file is the lookup table, not a replacement for it.

## Quick reference

| File | Exports | Use for |
| --- | --- | --- |
| `environmentManager.ts` | `EnvironmentManager`, `Env` | Env-scoped config. Use the `envManager` fixture inside tests/fixtures; instantiate directly only outside the fixture system (`playwright.config.ts`, `config/projects.ts`, `auth.setup.ts`). |
| `auth.ts` | `authFiles`, `isAuthConfigured()` | Locating a role's `storageState` file; gating auth-dependent setup/specs until real credentials are wired in. |
| `accessibility.ts` | `assertNoA11yViolations()`, `assertKeyboardReachable()` | A11y scans and tab-order checks. `assertNoA11yViolations` also takes a `failOn` severity filter the `accessibility` fixture doesn't expose — call it directly for a lighter-touch scan. `assertKeyboardReachable` has no fixture at all. |
| `css.ts` | `getCss(locator, property)` | Reading one resolved computed-style value. The **only** sanctioned way — `local/no-restricted-syntax-warn` blocks `getComputedStyle` inside `.evaluate()` anywhere else. |
| `externalNavigation.ts` | `assertExternalLinkBehavior()`, `expectUrlToMatchHref()`, `assertAbsoluteHref()` | Asserting an external link opens a new tab / navigates cross-origin, or that an href is absolute / matches the current URL. |
| `linkAudit.ts` | `collectInternalLinks()`, `auditLinks()` | One-hop same-origin HTTP link checks, excluding action routes and limiting requests/redirects. Used by `BasePage.checkContentLinks()`. |
| `structuredData.ts` | `parseStructuredData()`, `validateHomepageSchema()` | Multi-script JSON-LD parsing (arrays/graphs) and the observed homepage entity contract. Used by `HomePage.checkStructuredData()`; not a full schema.org validator. |
| `imageComparison.ts` | `screenshotsMatch(a, b, maxDiffPixels?, threshold?)` | A one-off before/after visual diff (e.g. "did hover actually change this") with no baseline file to maintain. For whole-page regression against a checked-in baseline, use `expect(page).toHaveScreenshot()` instead (`tests/visualRegression.spec.ts`) — complementary tools, not interchangeable. |
| `keyboard.ts` | `pressTab(page, locator?)`, `pressShiftTab(page, locator?)` | Advancing/reversing keyboard focus in a way that also works in WebKit. The **only** sanctioned way — `no-restricted-syntax` (error) blocks a raw `.press('Tab')`/`.press('Shift+Tab')` on `page.keyboard` or any locator. Prefer passing a `locator`; omit it only when tabbing repeatedly from whatever currently has focus. |
| `performance.ts` | `collectPerformanceMetrics(page)`, `assertMetricsWithinThresholds(metrics, thresholds)` | Real Navigation Timing / paint metrics (TTFB, DCL, load, FCP, LCP) from the page you just navigated, and asserting them against a budget. Complements the `lighthouse` fixture rather than replacing it: Lighthouse gives an audited score from a controlled run; this is cheap enough to assert per-page/per-viewport. Call `collectPerformanceMetrics` only after navigation completes. |
| `performanceThresholds.ts` | `PERFORMANCE_THRESHOLDS` | A starting budget for `assertMetricsWithinThresholds`. Deliberately conservative to avoid CI flakiness — re-baseline against your own app's observed load times after the first full regression run, don't ship these untouched into a real project. |

## Adding a new util

Decide fixture vs. plain function using the split above as precedent:

- **Needs per-test/per-worker state, or something every spec wants without asking for it explicitly** (like `envManager`, the role fixtures, or `accessibility`/`qualityGate`/`lighthouse`) → wire it into `testFixtures/base.ts` the same way an existing fixture of that shape is wired.
- **A pure function a POM method or spec calls with arguments it already has** (everything in the direct-import row) → just add the file under `utils/` and import it via `@utils/<name>` — no fixture needed.

Either way: give every exported function a JSDoc block (`@param`/`@returns`) to satisfy `jsdoc/require-jsdoc`, and if the helper replaces a pattern ESLint already restricts elsewhere (as `css.ts`/`keyboard.ts` do), add the matching `no-restricted-syntax` selector in `eslint.config.mjs` so the rule is enforced, not just documented. Then add a row to this table and a subsection to README's "Quality & Accessibility Helpers" — both go stale otherwise.

## Common mistakes

- Hand-rolling `page.evaluate(() => getComputedStyle(...))` or `locator.press('Tab')` in a spec/POM instead of `getCss`/`pressTab` — both are ESLint errors/warnings, not a style nit, and will fail `pnpm lint`.
- Calling `new EnvironmentManager()` inside a test body instead of using the `envManager` fixture — works, but bypasses the fixture's single worker-scoped instance for no reason.
- Reaching for `expect(page).toHaveScreenshot()` for a one-off "did this hover state actually change anything" check — that needs a maintained baseline file; `screenshotsMatch` doesn't.
- Asserting page performance only via the `lighthouse` fixture when what's actually needed is the real page's own timing on every viewport — that's `collectPerformanceMetrics`/`assertMetricsWithinThresholds`, cheap enough to run far more often than a full Lighthouse pass.
