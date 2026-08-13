---
name: code-review
description: "Review Playwright test code against this repo's conventions. Use when reviewing new tests, page objects, components, or fixtures — 'review my changes', 'check this against conventions', 'does this follow the repo style', 'pre-commit review', 'is this correct for this repo'. Checks imports, locators, page object structure, fixture registration, tagging, and lint/typecheck compliance."
argument-hint: 'file path or describe what to review (omit to review all changed files)'
---

# Code Review — Playwright Conventions

Reviews test code against the conventions in [AGENTS.md](/AGENTS.md). Run before every commit or PR.

## When to Use

- Before committing new specs, page objects, or components
- When asked to "review my changes", "check conventions", "does this look right"
- After writing or modifying anything under `tests/`, `objects/`, `testFixtures/`, or `types/`

## Procedure

### Step 1 — Identify scope

If an argument was given, review that file or area. Otherwise use `get_changed_files` (or `git diff --name-only HEAD`) to find changed source files in `tests/`, `objects/`, `testFixtures/`, and `types/` (for example `.ts`/`.tsx`, where applicable).

### Step 2 — Check each file against the checklist below

Work through every checklist section relevant to the file type. Report each violation with:

- The file path and line (as a markdown link)
- The rule violated (quote it from AGENTS.md)
- A concrete fix (show the corrected code inline)

Group findings by severity:

- **Blocker** — will cause a lint/type error, or directly breaks a convention rule
- **Warning** — technically works but violates style or will go stale

### Step 3 — Coverage review

For each spec file in scope, assess how well the tests cover the corresponding page object or component:

- Read the POM/component class and list its public locators, methods, and meaningful states
- Compare against the tests — which locators/methods/states are exercised? Which are untested?
- Flag any significant gaps: e.g. a component with an expanded/collapsed state but no test for one of them, or a page with key interactive elements that are never asserted on
- Distinguish between gaps that matter (likely user-facing regressions if broken) and gaps that are low-risk (purely cosmetic or already covered by a broader quality-gate test)

Report as a short coverage summary per file: what's covered, what's missing, and whether the gaps are worth addressing.

### Step 4 — Run lint and typecheck

```bash
pnpm lint:fix && pnpm typecheck
```

Report any remaining errors. If `lint:fix` auto-fixed something, show what changed.

### Step 5 — Summary

End with a short pass/fail summary: number of blockers, number of warnings, notable coverage gaps, and whether the code is ready to commit.

---

## Checklist

### Imports

- [ ] `test` and `expect` are imported from `@base`, **never** from `@playwright/test`  
      Exception: tests that opt out of fixtures (cookie-banner, 404) — these should have a comment explaining why
- [ ] Page objects imported via `@pages/*` (never a relative `../` path)
- [ ] Components imported via `@components/*` (never a relative `../` path)
- [ ] Utils imported via `@utils/*` (e.g. `@utils/environmentManager`, `@utils/accessibility`)
- [ ] No `../` import that crosses into `objects/pages/`, `objects/components/`, `utils/`, or `testFixtures/base`

### Locators

- [ ] Prefer `getByTestId()` first for stable selectors in this CMS-driven suite
- [ ] Fallback order when a stable test id is unavailable: `getByRole()` → simple semi-stable CSS → `getByLabel()` → `getByText()`
- [ ] No XPath
- [ ] No chained CSS selectors (`div.card > div.classA.classB`) — scope from a parent `Locator` instead
- [ ] No `waitForTimeout` — Playwright auto-waiting or a dynamic wait is used instead
- [ ] Tabbing uses `pressTab(page, locator)` from `@utils/keyboard`, not `page.keyboard.press('Tab')` directly (WebKit skips `<a>` links with plain Tab)
- [ ] External link behaviour is tested using `assertExternalLinkBehavior` from `@utils/externalNavigation` — not hand-rolled `target`/URL assertions

### Page Objects

- [ ] Class lives in `objects/pages/` and extends `BasePage`
- [ ] `url` is set in the constructor
- [ ] Locators are class properties, not buried inside methods
- [ ] New class is added to the `Pages` type in `types/types.ts`
- [ ] `createPageFixture(ClassName)` registered in `testFixtures/base.ts` under `// page types`
- [ ] New class imported at top of `testFixtures/base.ts`
- [ ] Assertion-only helper methods are named `assert*`, `check*`, or `verify*` (e.g. `verifySEO`, `checkH1`) — not a generic name that hides the fact that calling it is the test's only assertion

### Components

- [ ] Class lives in `objects/components/`
- [ ] New fixture key + type added to `Components` in `types/types.ts`
- [ ] `createComponentFixture(page => new ClassName(page))` registered in `testFixtures/base.ts`
- [ ] New class imported at top of `testFixtures/base.ts` and `types/types.ts`
- [ ] Sub-components with repeating structure use a method returning a scoped child object (e.g. `getColumn(i)`) — raw locators not exposed directly
- [ ] `.first()` is only used to pick one item from a **genuinely multi-item set** (e.g. choosing the first of several widgets on a page). Within an already-scoped root that should logically contain exactly one match, avoid `.first()` — it silently hides unexpected duplicates that are real bugs
- [ ] Assertion-only helper methods are named `assert*`, `check*`, or `verify*` (e.g. `assertSkipNavVisibility`) — not a generic name that hides the fact that calling it is the test's only assertion
- [ ] **Shared chrome** (present on every page, e.g. `HeaderNav`/`FooterNav`) is wired in **both** places: a `Components` fixture (`createComponentFixture`) **and** a constructed field in `BasePage`'s constructor (`this.header = new HeaderNav(...)`). A content block that isn't shared chrome only needs the fixture — flag chrome that's missing either half, and flag a non-chrome component that's been added to `BasePage` unnecessarily

### Specs

- [ ] `test.describe` blocks are present and clearly named, grouped by concern (e.g. `navigation`, `visibility and interaction`, `accessibility`) rather than one flat list — only use the groupings that actually apply to this feature
- [ ] Each test is independent — no shared mutable state between tests
- [ ] Test titles are lowercase
- [ ] No `if`/ternary controlling which assertions run — use `test.skip(condition, reason)` for genuine data-dependent skips instead
- [ ] `expect.soft()` used for a batch of independent visibility checks that should all be reported even if one fails; a hard `expect()` where a later step depends on the prior one succeeding
- [ ] `test.skip()` used (with reason) for env-specific gaps; `test.fixme()` for WIP
- [ ] Known cross-browser/environment quirks that don't warrant a full skip have an inline issue reference (ADO/Jira/GitHub/etc.), e.g. `// Issue #12345 - fails on tablet due to X`
- [ ] `@desktop` / `@mobile` device-scoping is applied at the **`test.describe` block level**, not on individual tests — `test.describe('desktop header', { tag: ['@desktop'] }, () => { ... })` — so the whole group is skipped on the wrong device
- [ ] Interactions go through POM methods, not raw locator properties — if the POM exposes a `click()` method or equivalent, use it rather than calling `locator.click()` directly in the test body
- [ ] Heading levels within a component are semantically ordered: a component's block heading must sit at a higher level than headings inside its child items (e.g. an h5 block heading with h3 card titles is a bug — flag it even if it's in the site HTML rather than the test code, as a note for dev follow-up)
- [ ] Web-first assertions are used (`expect(locator).toBeVisible()`, `expect(locator).toHaveText()`, etc.) — not the non-retrying equivalents (`locator.isVisible()`, `locator.textContent()`) outside of assertions
- [ ] Navigation assertions use `await expect(page).toHaveURL(...)` rather than `page.waitForURL(...)` — the former is a web-first assertion with auto-retry; the latter is a one-shot wait that can race
- [ ] `.scrollIntoViewIfNeeded()` is only present if the test demonstrably fails without it — it should not be used as a precaution or habit; Playwright's auto-scrolling handles the normal case
- [ ] Visual state change tests (hover, focus, active) use `screenshotsMatch` from `@utils/imageComparison` to assert the rendering actually changed — a CSS value assertion alone does not prove the user sees a difference
- [ ] Screenshots taken for comparison purposes pass `{ animations: 'disabled' }` — without this, in-flight CSS transitions can cause non-deterministic diffs
- [ ] Tags (`@quality-gate`, `@visual`, `@smoke`, `@regression`) are optional but encouraged for selective runs — flag only if a test is clearly a quality-gate or smoke candidate with no tag at all
- [ ] Device scope used where applicable: `@desktop` / `@mobile` (not `basePage.isMobile()` checks in test bodies)
- [ ] `qualityGate`, `accessibility`, or `lighthouse` fixtures used where a full-page audit is appropriate

### Accessibility coverage

Axe catches a lot, but it's a static scan — it can't see whether a _specific_ interaction pattern (a current-step indicator, a card that's one big link, a roving-tabindex menu) is actually correct. Check the baseline on every feature, then check the feature-specific table for whatever patterns this feature actually uses.

**Baseline (always)**

- [ ] At least one `assertNoA11yViolations` call covers the component or page — scoped to the relevant root selector where possible (e.g. `{ scope: component.selector }`) rather than scanning the whole page
- [ ] Heading hierarchy is correct (see Specs above) — axe's default `wcag2a`/`wcag2aa` tags don't include the `heading-order` rule, so a scoped scan won't catch a skipped or out-of-order heading level; this has to be checked by hand
- [ ] Attribute/state checks (`aria-*`, `tabindex`, focus) use web-first matchers — `toHaveAttribute`, `toHaveCount`, `toBeFocused` — not `locator.evaluate(el => ...)`. Use `getAttribute()` when a value needs comparing across two different locators, and prefer assertion matchers over evaluated DOM property comparisons.
- [ ] `assertKeyboardReachable` (`@utils/accessibility`) is scoped to the feature under test, not swept across the whole page, so page-level patterns outside the feature under review do not create false positives

**Feature-specific — check for whichever of these the feature actually has:**

| Feature has... | Test for... |
| --- | --- |
| A "current"/"active"/"selected" state (steps, tabs, current nav item) | `aria-current` / `aria-selected` (or equivalent) set on exactly the right element, and only that one |
| Decorative icons, redundant badges, or visual-only duplicate text | `aria-hidden="true"` present so it isn't double-announced |
| A card/row that's one big link wrapping separate visible text (heading, CTA icon, etc.) | the link's accessible name comes from the heading (`aria-labelledby` → heading `id`), not a generic repeated "read more" |
| Expandable/collapsible content (accordion, menu group, disclosure) | `aria-expanded` toggles `true`/`false` as the trigger is operated |
| Any image | non-empty, _meaningful_ `alt` text, not just present |
| A set of focusable items (list, menu, card grid) | tab order moves logically between them (`pressTab`); nothing is pulled out of tab order except deliberately |
| A skip link / "skip to content" affordance | focusable, becomes visible on focus, moves focus to the target on activation |
| Content that updates without a page reload (filter results, live counts, form validation) | an `aria-live` region announces the change |
| A modal, dropdown, or dismissible overlay | `Escape` closes it and focus returns to the trigger |
| A group of related form controls (checkboxes, radios, filter pills) | grouped via `fieldset`/`legend` or an equivalent ARIA group role |
| Navigating away and back to the same view | focus lands somewhere sensible ("point of regard"), not reset to the top |

**Out of scope for automation (manual QA territory — don't block a review on missing coverage here):**

- Zoom/reflow at 200%/400% — needs visual judgement across viewport sizes
- High-contrast / forced-colors mode — needs a real OS/browser contrast mode, not a CSS assertion
- Third-party dyslexia-friendly font extensions — outside the app's own control

These three (plus the flagged gaps above) come from this repo's manual accessibility test pack in Testmo. If a PR touches one of the first three areas, note in the review that manual QA sign-off is still needed rather than asking for automated coverage.

### Fixtures & Registration

- [ ] If a fixture already exists for a component, tests use it — they don't construct the class inline with `new`
- [ ] `EnvironmentManager` used to access config values, not hardcoded URLs or strings
- [ ] Auto fixtures (`blockAnalytics`, `cookieConsent`) are relied on — tests don't manually dismiss the cookie banner unless specifically testing it

### CSS / Computed Styles

- [ ] `getCss(locator, property)` from `@utils/css` used instead of inline `locator.evaluate(el => getComputedStyle(el)...)`

---

## Reference

Full conventions: [AGENTS.md](/AGENTS.md)  
Type registry: [types/types.ts](/types/types.ts)  
Fixture entry point: [testFixtures/base.ts](/testFixtures/base.ts)
