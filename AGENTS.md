# Agent Guide - Away Resorts Smoke Project

This is the source-of-truth conventions file for coding agents in this repository.

## Core Rules

1. Import `test` and `expect` from `@base` (`testFixtures/base.ts` alias), not directly from `@playwright/test` in test specs.
2. Prefer `data-testid` locators first. Fallback order: role -> CSS -> label -> text.
3. Keep selectors in page objects/components, not in specs.
4. Run `pnpm lint:fix` and `pnpm typecheck` before finishing code changes.

## Environment Model

- Active envs: `pprd`, `prod`
- Config files: `config/pprd.ts`, `config/prod.ts`
- Resolver: `utils/environmentManager.ts`
- Default env fallback: `pprd`

To add a new environment:

1. Create `config/<env>.ts`
2. Register it in `utils/environmentManager.ts`
3. Update `.env.example`
4. Add optional script in `package.json`

## Browser Matrix

Configured in `config/projects.ts`:

- Chrome
- Safari
- Mobile Chrome
- Mobile Safari

Tag tests with `@desktop`, `@mobile`, `@quality-gate`, `@smoke`, `@regression`, `@visual` as applicable.

## Fixtures

`testFixtures/base.ts` exposes:

- `test` / `expect` via `@base`
- `qualityGate(pageObj, customUrl?)`
- `accessibility(pageObj, customUrl?)`
- `lighthouse(pageObj, customUrl?, thresholds?)`
- Auto fixtures for analytics blocking and cookie-consent pre-seeding

## Auth

Auth scaffold is intentionally removed in this project baseline.

If auth is introduced later, wire these together consistently:

- page object under `objects/pages/`
- type registration in `types/types.ts`
- fixture registration in `testFixtures/base.ts`
- setup/dependency wiring in `playwright.config.ts`

## CI/CD

Azure DevOps pipeline files:

- `.azure-pipelines/ci-manualTestReport.yml`
- `.azure-pipelines/ci-scheduledTestReport- QA.yml`
- `ci-templates/playwrightTemplate.yml`

Testmo source is `awayresorts-smoke-tests`.

Important: `dockerContainer` in `ci-templates/playwrightTemplate.yml` is managed automatically by the Husky pre-commit hook. Do not hardcode or manually maintain a specific image tag.

## Commands

```bash
pnpm test
pnpm test:pprd
pnpm test:prod
pnpm lint:fix
pnpm typecheck
pnpm format
```
