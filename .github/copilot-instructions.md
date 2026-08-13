# GitHub Copilot instructions

Read `AGENTS.md` first. It is the source-of-truth for this repository.

## Must-follow

- Import `test` and `expect` from `@base` (`testFixtures/base.ts` alias), not from `@playwright/test` in specs.
- Prefer `getByTestId` locators. Fallback: role -> CSS -> label -> text.
- Keep selectors in page objects/components; avoid raw selectors in specs.
- Type/fixture registry file is `types/types.ts`.

## Current Baseline

- Environments: `pprd`, `prod`
- Browser matrix: Chrome, Safari, Mobile Chrome, Mobile Safari
- Auth scaffold: removed for this smoke baseline

## After Edits

Run:

```bash
pnpm lint:fix
pnpm typecheck
```

Use `pnpm format` when needed.

## CI Note

`dockerContainer` in `ci-templates/playwrightTemplate.yml` is managed by the Husky pre-commit hook and should not be manually pinned.
