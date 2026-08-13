# GitHub Copilot instructions

The full conventions for this repository live in **[/AGENTS.md](../AGENTS.md)** — read that file first and follow it. The points below are the highest-priority rules repeated for quick reference.

## Must-follow rules

- Import `test` and `expect` via the `@base` path alias (`import { test, expect } from '@base'`, which resolves to `testFixtures/base.ts`), **never** from `@playwright/test` directly (rare exceptions: tests that must bypass fixtures, e.g. cookie-banner or 404 tests).
- Prefer `data-testid` locators (`getByTestId`). Fallback order: role → simple CSS → label → text. This is a CMS-driven site, so text/structure locators go stale fast.
- Use Page Objects in `objects/pages/` (extend `BasePage`, imported via the `@pages/BasePage` alias); don't put raw selectors in specs.
- The page-type registry is **`types/types.ts`**.
- Tag tests with `@quality-gate` / `@desktop` / `@mobile` / `@visual` / `@smoke` / `@regression` as appropriate, using array syntax (`{ tag: ['@smoke'] }`). Prefer these plus `config/projects.ts`'s `grepInvert` over manual per-test skips.

## After making changes

A repo-level Copilot CLI hook (`.github/hooks/lint-typecheck.json`) runs `eslint --fix` + `prettier --write` + `tsc --noEmit` automatically after every `edit`/`create` tool call and reports lint/typecheck failures back to the model — it takes effect from your next CLI session (hook config loads at startup). Run these manually if you need to check sooner, or when using a tool without hook support. Linting and formatting are separate passes (ESLint no longer runs Prettier as a rule):

```bash
pnpm lint:fix    # eslint --cache --fix .
pnpm format      # prettier --write .
pnpm typecheck   # tsc --noEmit
```

## Adding a page object

Follow the 4-step ritual in AGENTS.md: create the class → add it to `types/types.ts` → register `createPageFixture(...)` in `testFixtures/base.ts` → import it there. There is a reusable prompt for this at `.github/prompts/new-page-object.prompt.md` (invoke with `/new-page-object` in Copilot Chat).
