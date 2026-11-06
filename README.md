# Away Resorts Smoke Test Framework

Playwright + TypeScript smoke-test suite for Away Resorts.

## Quick Start

1. Install dependencies:

```bash
pnpm install
pnpm exec playwright install
```

2. Choose environment in `.env` (or shell):

```bash
ENV=pprd
```

3. Run tests:

```bash
pnpm test
pnpm test:pprd
pnpm test:prod
```

## Environments

Environment configs live in `config/`.

- `config/pprd.ts` -> `https://pprd.awayresorts.co.uk`
- `config/prod.ts` -> `https://awayresorts.co.uk`

Environment selection is handled by `utils/environmentManager.ts` and defaults to `pprd` when `ENV` is not set.

## Project Structure

- `playwright.config.ts`: Playwright runner config
- `config/projects.ts`: browser/device matrix
- `testFixtures/base.ts`: shared fixtures and quality helpers
- `objects/pages/BasePage.ts`: base page object for shared navigation/checks
- `types/types.ts`: fixture type registry
- `types/envConfig.ts`: environment config shape
- `tests/`: smoke and quality specs
- `ci-templates/playwrightTemplate.yml`: Azure pipeline template

## Browser Matrix

The default active matrix is:

- Chrome (desktop)
- Safari (desktop)
- Mobile Chrome
- Mobile Safari

Adjust in `config/projects.ts` as needed.

## Fixtures and Helpers

Import `test` and `expect` from `@base`:

```ts
import { test, expect } from '@base';
```

Available shared helpers include:

- `qualityGate(pageObj, customUrl?)`
- `accessibility(pageObj, customUrl?)`
- `lighthouse(pageObj, customUrl?, thresholds?)`

### Homepage links and structured data

`tests/homePage.spec.ts` audits homepage hero and main-content links and validates the observed JSON-LD contract. Visual/layout review stays manual alongside regression; existing block interaction tests remain automated.

- `BasePage.checkContentLinks(request, links?)` uses `utils/linkAudit.ts` to resolve and deduplicate same-origin HTTP links. It skips non-HTTP, fragment-only and account/booking/payment/action links, limits concurrency to three, follows at most five safe redirects and requires final 2xx responses. External/action redirects are reported without following them. It does not recursively crawl, detect soft 404s or prove the intended destination.
- `HomePage.checkStructuredData()` uses `utils/structuredData.ts` to parse every JSON-LD script, including arrays and graph containers, and check `WebSite`, `Organization` and `TouristTrip` fields. Public entity URLs remain production URLs on pre-production. This is a regression baseline, not complete schema.org validation.
- These are direct-import utilities, not fixtures. `tests/pageAudit.spec.ts` covers normalization, redirects, failures and schema parsing against deterministic local data. Landing templates need their own agreed URLs and schema contracts before coverage is added.

## CI/CD

Azure pipeline files are in `.azure-pipelines/` and `ci-templates/`.

- Manual pipeline env values are `pprd` and `prod`.
- Testmo source is `awayresorts-smoke-tests`.
- `workingDir` defaults to `.` in the shared template.

`dockerContainer` in `ci-templates/playwrightTemplate.yml` is auto-managed by the Husky pre-commit hook and should not be manually pinned to a specific tag.

## Notes

- This baseline intentionally removes the auth scaffold for faster smoke onboarding.
- If authenticated coverage is needed later, re-introduce a login page object + setup project.
- If you need multi-site support (multiple brands/domains under same envs), use `.github/skills/add-multi-site-support/SKILL.md`.
