---
agent: agent
description: Scaffold a new Page Object wired into the type registry and fixtures, following this repo's Playwright conventions.
---

Scaffold a new Page Object for this Playwright framework. First read `objects/pages/BasePage.ts`, `types/types.ts`, and `testFixtures/base.ts` so the generated code matches current conventions. Also follow `/AGENTS.md`.

Ask me for the **page name** (e.g. `LoginPage`), the **fixture key** (camelCase, e.g. `loginPage`), and the **URL path** if I haven't given them.

Then:

1. Create `objects/pages/<name>.ts` extending `BasePage` (import via the `@pages/BasePage` alias). Set `url`, and declare locators as `readonly` class properties in the constructor — **prefer `getByTestId`** (fallback order: role → simple CSS → label → text). Add page-specific action methods; keep locators out of method bodies. Document each public method with JSDoc (description, `@param`s, `@returns`) — enforced by `eslint-plugin-jsdoc`.
2. Add `<fixtureKey>: <ClassName>;` to the `Pages` type in `types/types.ts` and import the class there.
3. In `testFixtures/base.ts`, import the class and add `<fixtureKey>: createPageFixture(<ClassName>),` under the `//page types` section.
4. Tell me to run `pnpm typecheck` and `pnpm format`.

Guardrails:

- Specs must import `test`/`expect` via the `@base` alias (`import { test, expect } from '@base'`), never `@playwright/test`.
- Use `createPageFixture` rather than a hand-rolled fixture unless custom setup/teardown is needed.
- If a locator can't use `data-testid`, leave a `// TODO: request data-testid` note and use the best stable fallback.
