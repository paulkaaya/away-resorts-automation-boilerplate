# Away Resorts Regression Suite → Playwright Migration Strategy

This document works through your regression CSV folder-by-folder, flags what's a good fit for Playwright, what needs a different approach, and how to handle the pre-live vs. live payment split. Code examples referenced here live alongside this file in `pages/`, `tests/`, and `fixtures/`.

## Legend

- ✅ **Automate as-is** — deterministic, DOM-based, safe to run repeatedly
- ⚠️ **Automate with caveats** — needs a specific technique (timing, visual diffing, test data seeding) called out in the notes
- 🔀 **Environment-gated** — behaves differently on pre-live vs. live, needs a conditional in the test
- 🛑 **Poor fit / reconsider** — technically possible but low ROI, high flakiness, or better solved another way

---

## *Cookies

| Test | Fit | Notes |
| --- | --- | --- |
| First load / banner shows | ✅ | `context.clearCookies()` before test, assert banner locator visible |
| Navigate after consent | ✅ | Cookiebot blocks background interaction until resolved; accept, reload and navigate, then verify consent persists |
| Accept cookies | ✅ | Click Allow all, assert banner hidden and all categories saved in `CookieConsent` |
| Category selection / Reject | ✅ | Verify Necessary stays enabled, all six partial selections and rejection persist after reload; assert category booleans and explicit method, not stamp/timestamp |
| Clear cookies → banner returns | ✅ | Clear `CookieConsent`, reload and assert the banner returns |

Shared tests automatically accept Cookiebot before blocked interactions through the `cookieConsent` fixture. Cookie tests use `test.use({ dismissCookies: false })` to exercise the real UI without automatic acceptance or pre-seeded consent. Lighthouse resolves consent separately on its audit page. Category assertions verify saved preferences, not third-party tracker enforcement (analytics are independently blocked by the suite).

## *Header & Nav

| Test | Fit | Notes |
| --- | --- | --- |
| Site logo → home | ✅ |  |
| Log in modal opens | ✅ |  |
| Open menu / mega menu hover | ✅ | Playwright's `hover()` works, but CSS transition-based menus can need a small `waitForSelector` on the panel rather than a fixed timeout |
| Direct links / nested nav links | ✅ | Data-driven: build an array of `{ text, expectedUrlPart }` and loop it — see `tests/navigation-links.spec.ts` |
| Close mega menu on cursor-away | ⚠️ | `mouse.move()` away then assert hidden; slightly timing-sensitive |
| Sticky search bar on scroll | ⚠️ | Assert via bounding box / computed style (`position: fixed`) after `page.mouse.wheel()`, not a screenshot |
| Carousel auto-advance | 🛑/⚠️ | Auto-advancing carousels are notoriously flaky in CI (timing races). Prefer asserting the _mechanism_ (active dot index changes after N seconds using `expect.poll`) rather than asserting exact visual transitions |
| Carousel pause button | ✅ | Click pause, assert active slide index doesn't change over time |
| Carousel dot navigation | ✅ | Click dot, assert corresponding slide becomes active |
| Booking bar tabs/defaults | ✅ |  |
| Booking bar sticky on scroll | ⚠️ | Same technique as sticky search bar |
| HHS link routes correctly | ✅ |  |
| 404 page styling | ✅ |  |

## *SEO

| Test | Fit | Notes |
| --- | --- | --- |
| robots.txt loads/matches CMS | ✅ | Use `page.request.get('/robots.txt')`, assert status 200 and body content — no browser needed, very fast |
| XML sitemap loads, same-domain only | ✅ | Fetch, parse XML (e.g. with `fast-xml-parser`), assert every `<loc>` starts with the expected domain |
| Create/Load/Delete a redirect | ⚠️ | Automatable as CMS UI tests, but consider whether the CMS has an API — hitting an API to create/delete test redirects is faster and less brittle than driving the CMS UI. If UI-only, prefix test redirects (e.g. `/pw-test-redirect-*`) and **always clean up in an `afterEach`**, even on failure |

## *Footer

| Test | Fit | Notes |
| --- | --- | --- |
| Footer displays | ✅ |  |
| Footer links | ✅ | Data-driven loop, same pattern as nav links. For external links, just assert `href` rather than following them |

## *Booking - Holidays / *Booking - Touring & Camping (same journey, different tab)

This is your biggest, highest-value folder and also the one with the most design decisions. Recommended approach: **one Page Object per journey step** (`SearchBarPage`, `ExtrasPage`, `DetailsPage`, `PaymentPage`, `ConfirmationPage`) chained together, so individual tests can jump straight to the step they care about by calling the prior steps' helper methods instead of re-describing every click.

| Test | Fit | Notes |
| --- | --- | --- |
| View booking bar / defaults | ✅ |  |
| Choose park | ✅ |  |
| Select dates | ✅ | Watch for date-picker relative-date logic — compute "today+N" in the test rather than hardcoding a date, so tests don't rot |
| Select guests | ✅ |  |
| Find Holidays → results | ✅ | Assert results page has ≥1 result card; don't assert an exact count (inventory changes) |
| Step 1 Extras | ✅ |  |
| Step 2 Your details — validation | ✅ |  |
| Step 2 Your details — valid submit | ✅ |  |
| Step 3 Payment — validation | ✅ |  |
| Step 3 Payment — full submit + 3DS challenge | 🔀 | **Pre-live only** — see Payment Strategy below |
| Confirmation page content | 🔀 | Only reachable after a completed payment, so inherits the pre-live gate |
| Confirmation → Login | ✅ (pre-live) |  |
| Booking login / logout | ✅ (pre-live) | Needs a valid booking reference — either from the test that just ran, or a seeded reference from a test/staging booking |
| Guests: 2A+1C, max 12, 13+ redirect | ✅ | Perfect for `test.describe.parametrize`-style data tables — see `tests/guest-selector.spec.ts` |
| Pets: pet-friendly filtering, pricing 1/2 pets | ✅ | Pricing checks need a **known baseline price** — either read the no-pet price from the DOM first and compare deltas, or seed a fixed test property with known pet pricing |
| Accommodation Filters (quick filters, overlay, sort, type, grade, bedrooms, combined, no-results) | ✅ | ~25 tests here but they're all the same pattern (apply filter → assert result set matches predicate). Write one reusable `applyFilterAndAssert()` helper and drive it from a data table |
| Extras > Ferry (Isle of Wight) | ✅ | Depends on IoW park having ferry-eligible stock in the test environment — confirm with the client/dev team that test data always includes this, or the test will be flaky through no fault of your script |
| Discount codes (valid/invalid/expired/special chars/removal) | ✅ | Needs seeded discount codes in the test environment (a permanently-valid one, a permanently-expired one). Ask whoever owns the promo engine to create stable test codes rather than relying on ones that might get deleted |

## *Booking - Holiday Homes for Sale (HHS)

| Test                                                      | Fit | Notes                  |
| --------------------------------------------------------- | --- | ---------------------- |
| View booking bar / choose park / bedrooms / budget / find | ✅  | Same patterns as above |
| HHS details page                                          | ✅  |                        |

## Forms (Request a callback / Arrange viewing / Make an enquiry / Contact us / Newsletter / Log-in)

| Test | Fit | Notes |
| --- | --- | --- |
| Display | ✅ |  |
| Validation (empty submit) | ✅ |  |
| Populate correctly | ✅ |  |
| Submit → thank you | 🔀 | These forms likely email the client's CRM / trigger real notifications on **live**. Prefer running full submission on pre-live only, and either (a) use a clearly-flagged test identity (e.g. `playwright-test+timestamp@yourdomain.test`) so the client's team can filter it out downstream, or (b) ask if there's a test/sandbox mode for the CRM integration. Don't submit real enquiry forms against production repeatedly in CI. |

Since these five forms share nearly identical Given/When/Then shapes, write one generic `testStandardForm(page, config)` helper (see `tests/forms.spec.ts`) that takes a config object per form (selectors, valid data, expected thank-you text) rather than duplicating four near-identical spec files.

## Homepage / Landing Page (generic templates)

| Test | Fit | Notes |
| --- | --- | --- |
| Display / images load | ✅ | Assert no broken images: loop `page.locator('img')`, check `naturalWidth` via `evaluate`, and listen for `page.on('response')` 4xx/5xx on image requests |
| Blocks / layout / appearance | Manual | Review representative desktop/mobile pages alongside regression. No new visual snapshot baseline or automated CMS-to-frontend content comparison for this scope. |
| Link reachability | ✅ | Homepage hero and selected main-content sections: resolve relative URLs, deduplicate without fragments, retain query parameters, and GET same-origin destinations with three concurrent requests. Follow up to five safe redirects and require final 2xx; report 4xx/5xx, network errors and excluded redirect targets. Skip external, fragment-only, email/telephone and account/booking/payment/action routes. This is a one-hop audit, not a recursive crawler; existing header/footer tests remain separate. |
| Block interactions | ✅ | Retain targeted carousel, CTA and booking-bar interaction checks. HTTP success alone does not establish the intended destination, working JavaScript, in-page anchors or absence of soft 404s. |
| Schema (structured data) | ✅ | Parse all JSON-LD scripts, accepting object/array and `@graph` containers. Homepage baseline checks schema.org context, `WebSite`, `Organization` and `TouristTrip`, nonempty names/descriptions as applicable, and public production identity URLs even on pre-production. This is a regression contract, not full schema.org validation or proof of Google rich-result eligibility. |

Implementation: `tests/homePage.spec.ts`, reusable `BasePage.checkContentLinks()` and `utils/linkAudit.ts`; JSON-LD parsing/contract in `utils/structuredData.ts`. Add landing-page cases once representative URLs and their schema expectations are agreed; do not assume every template publishes the homepage types.

Live and pre-production homepage inspection on 4 November 2026 found two JSON-LD scripts: one `TouristTrip` with nested park trips, and an array containing `WebSite` and `Organization`. SEO review is still needed for semantic/content accuracy: live includes “The Bay Fiely”, an old-looking WordPress logo path, and an organization address that differs from the rendered registered-office text. These observations are not silently promoted into exact-copy assertions.

## *404

| Test | Fit | Notes |
| --- | --- | --- |
| Unknown homepage route returns HTTP 404 | ✅ | Navigate to a stable, improbable nonsense path derived from the configured homepage and assert the navigation response is 404 (not a soft 404) |
| 404 page content and recovery | ✅ | Assert the 404 heading/message and shared header/footer, then follow the Return to homepage link and verify navigation back to the configured homepage |

## General (CMS admin)

| Test | Fit | Notes |
| --- | --- | --- |
| CMS login/logout | ✅ |  |
| CMS sections navigate | ✅ |  |
| Create/remove page or block, CKEditor | ⚠️ | Automatable, but **isolate test content**: prefix everything (`[PW-TEST]`) and delete in `afterEach`/`afterAll` even on failure (`test.afterEach` runs regardless of pass/fail). Shared CMS content polluting a real environment is a common source of "why is there a random test page live" incidents |
| Preview functionality | ✅ |  |
| Delete page → 404 confirms | ✅ |  |

## *Mobile

| Test | Fit | Notes |
| --- | --- | --- |
| Burger menu navigation | ✅ | Use a Playwright **project** with a mobile viewport/device (`devices['iPhone 13']`) rather than a separate test file — same spec runs against desktop and mobile projects |
| Search bar overlay | ✅ |  |
| Header never sticky / search bar sticky | ⚠️ | Same computed-style technique as desktop sticky checks |
| Footer links | ✅ |  |

---

## Summary

Of the ~140 rows in your sheet, the large majority (roughly 85-90%) are solidly automatable with standard Playwright techniques. The main things to solve for _before_ writing tests, not after:

1. **Payment gating between pre-live and live** (below)
2. **Stable seeded test data**: a discount code that's always valid, one that's always expired, an Isle-of-Wight park with ferry-eligible stock, a pet-friendly and non-pet-friendly accommodation pair with known prices
3. **A policy on CMS/form test-data cleanup** so automated runs don't leave junk content or trigger real client-side notifications on production
4. **Deciding what "CMS block matches frontend" actually means** as an automated check — recommend visual snapshots over content diffing unless you get CMS API access

---

## Payment Strategy: pre-live vs. live

The safest and most common pattern is an environment-aware config with a named `project` per environment, plus a small helper that either runs or skips the parts of a test that submit real money.

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const ENV = process.env.TEST_ENV ?? 'staging'; // 'staging' | 'production'

const baseURLs: Record<string, string> = {
  staging: 'https://staging.awayresorts.co.uk',
  production: 'https://www.awayresorts.co.uk',
};

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: ENV === 'production' ? 0 : 1,
  use: {
    baseURL: baseURLs[ENV],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: `${ENV}-desktop`,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: `${ENV}-mobile`,
      use: { ...devices['iPhone 13'] },
    },
  ],
});
```

```ts
// fixtures/environment.ts
export const ENV = process.env.TEST_ENV ?? 'staging';
export const isPreLive = ENV === 'staging';
export const isLive = ENV === 'production';

// A single test card, only ever used on pre-live
export const TEST_CARD = {
  number: '4000 0000 0000 3220', // your payment gateway's 3DS test card
  expiry: '12/30',
  cvc: '123',
  challengeWord: 'challenge',
};
```

```ts
// tests/booking-payment.spec.ts
import { test, expect } from '@playwright/test';
import { isPreLive, TEST_CARD } from '../fixtures/environment';
import { PaymentPage } from '../pages/PaymentPage';

test.describe('Booking Step 3 — Payment', () => {
  test('shows validation errors on empty submit', async ({ page }) => {
    const payment = new PaymentPage(page);
    await payment.gotoViaFullJourney(); // helper that drives steps 1 & 2
    await payment.submit();
    await expect(payment.errorMessages()).toHaveCount(await payment.requiredFieldCount());
  });

  // Only registered on pre-live — see note below on conditional registration
  test('completes a real test-card payment through to confirmation', async ({ page }) => {
    test.skip(!isPreLive, 'Real payment submission is pre-live only');

    const payment = new PaymentPage(page);
    await payment.gotoViaFullJourney();
    await payment.fillCard(TEST_CARD);
    await payment.submit();
    await payment.completeChallenge(TEST_CARD.challengeWord);

    await expect(page).toHaveURL(/\/book\/success/);
  });
});
```

Two options for the `test.skip` line:

- **`test.skip(condition, reason)`** (shown above) — the test still shows up in the report as "skipped" on live, which is useful for visibility (you can see at a glance the coverage gap is intentional, not a missing test).
- **Conditional `test.describe`** using `test.skip(!isPreLive)` at the `describe` level, or splitting payment tests into their own file and only including that file's `testDir`/`testMatch` for the staging project in `playwright.config.ts` — cleaner if you have a lot of pre-live-only tests and don't want a long list of "skipped" noise in the live report.

For the discount-code-to-minimal-value approach you mentioned for occasional real-card testing on live: that's a manual/exploratory process (a human requesting a code, entering real card details) and not something to encode into an automated CI suite — real payment details shouldn't live in test scripts or CI secrets. Keep that as a documented manual runbook step, separate from the Playwright suite.

## Suggested project layout

```
away-resorts-playwright/
├── playwright.config.ts
├── fixtures/
│   └── environment.ts          # TEST_ENV, TEST_CARD, isPreLive/isLive
├── pages/                       # Page Object Model, one per journey step/area
│   ├── CookieBanner.ts
│   ├── HeaderNav.ts
│   ├── SearchBarPage.ts
│   ├── ResultsPage.ts
│   ├── ExtrasPage.ts
│   ├── DetailsPage.ts
│   ├── PaymentPage.ts
│   └── ConfirmationPage.ts
└── tests/
    ├── cookies.spec.ts
    ├── header-nav.spec.ts
    ├── navigation-links.spec.ts
    ├── seo.spec.ts
    ├── footer.spec.ts
    ├── booking-journey.spec.ts
    ├── guest-selector.spec.ts
    ├── pets.spec.ts
    ├── accommodation-filters.spec.ts
    ├── discount-codes.spec.ts
    ├── forms.spec.ts
    ├── homepage-landing.spec.ts
    ├── 404.spec.ts
    ├── cms-admin.spec.ts
    └── mobile.spec.ts
```

This mirrors your CSV's folder column closely, so it stays easy to trace a spec file back to the original manual test case, and easy for whoever maintains this to know where a new manual case should become a new automated one.
