---
name: register-pom
description: Use when a Playwright Page Object Model (POM) class for a page or component already exists (hand-written by the user, or just finished) and needs to be wired into this repo's fixture system so specs can request it — e.g. "register this component", "wire up the new POM", "hook this page into the fixtures", "add a fixture for X", "make FooBlock available in tests". Also use for step 6 (registration) of the write-test skill when the user wants that step handled separately from writing the POM itself.
---

# Playwright POM registration

This repo hands page/component objects to specs as typed fixtures — `basePage`, `loginPage`, `headerNavigation`, `footerNavigation`, etc. — rather than specs writing `new SomeBlock(page)` inline. The wiring lives in two files plus, for shared chrome, a third:

- `types/types.ts` — the `Pages` and `Components` type maps (fixture name → class).
- `testFixtures/base.ts` — the actual fixture registration, via `createPageFixture` or `createComponentFixture`.
- `objects/pages/BasePage.ts` — only for shared chrome (header/footer-style components present on every page), which gets a constructor field _in addition to_ its component fixture.

This skill assumes the POM class itself already exists. It does not write POM classes or specs — see `write-test` for that (its step 6 points here).

## Step 1 — Classify what you're registering

| Shape | Registers in | Example |
| --- | --- | --- |
| Whole new page | `Pages` type + `createPageFixture` | `BasePage`, `LoginPage` |
| Content block / standalone component | `Components` type + `createComponentFixture` | (none shipped yet — this boilerplate is generic; a first example would follow `HeaderNav`'s shape minus the `BasePage` field) |
| Shared chrome (present on every page) | `Components` type + `createComponentFixture` **and** a field in `BasePage`'s constructor | `HeaderNav`, `FooterNav` |

If unsure whether something is "shared chrome" vs. "a content block that happens to be reused," ask — chrome gets registered twice (fixture + `BasePage` field), a content block only once.

## Step 2 — Register the type

Add the import and a `<fixtureKey>: <ClassName>;` line to the relevant map in `types/types.ts`:

```ts
import { NewBlock } from '@components/NewBlock';
// ...
export type Components = {
  // ...existing entries
  newBlock: NewBlock;
};
```

Pages go in the `Pages` type instead, imported from `@pages/*`.

## Step 3 — Register the fixture

In `testFixtures/base.ts`, add the matching import and a fixture entry next to the `/* Add other page/component fixtures here as needed */` comments (page fixtures under `//page types`, component fixtures under `//component types`):

```ts
// pages — use createPageFixture, no factory needed unless the class needs extra args
newPage: createPageFixture(NewPage),

// components — use createComponentFixture with a factory function
newBlock: createComponentFixture(page => new NewBlock(page)),
```

Use the factory form (`page => new X(page, extraArg)`) whenever the constructor needs more than just `page` — e.g. `headerNavigation: createComponentFixture(page => new HeaderNav(page, (page.viewportSize()?.width || 0) < 768))`. A component that also needs non-default construction args for specific tests (an auto-expanded variant, say) still gets the default-args fixture here; those specs construct it directly inline alongside the `page` fixture instead of using the registered one.

## Step 4 — Shared chrome only: wire it into `BasePage`

If step 1 classified this as shared chrome, also add it as a field, constructed in `BasePage`'s constructor — the same shape as `header`/`footer`:

```ts
readonly newChrome: NewChrome;
// in the constructor:
this.newChrome = new NewChrome(page);
```

This is additive to step 3, not a replacement — shared chrome ends up reachable both via `basePage.newChrome` and as its own `newChrome` fixture for specs that need it without a full `basePage`.

## Step 5 — New page needs its own URL? Register the path

If this is a page (or a content block anchored to one page) that needs a route the suite doesn't already know about, add an optional key to `EnvConfig` in `types/envConfig.ts`:

```ts
export interface EnvConfig {
  // ...
  newBlockPage?: string;
}
```

Then populate it only in whichever environment(s) actually have that content today (this boilerplate only ships `config/dev.ts` — add `qa.ts`/`staging.ts`/`prod.ts` the same way if the project needs them, and register each in `utils/environmentManager.ts`'s `environments` map — don't add the key speculatively to environments that don't have the content):

```ts
// config/dev.ts
export const devConfig: EnvConfig = {
  // ...
  newBlockPage: 'path/to/page',
};
```

Specs read it via `new EnvironmentManager().getValue('newBlockPage')`, not a hardcoded URL.

## Step 6 — Verify

Run `pnpm typecheck` and `pnpm lint`. A missing entry in one of `types/types.ts` / `testFixtures/base.ts` shows up as a TypeScript error at the _other_ file, not always where you'd expect — treat any type error touching `Pages[keyof Pages]` or `Components[keyof Components]` as a sign one side of the registration is missing or misspelled.

## Common mistakes

- **Registering in only one of `types/types.ts` / `testFixtures/base.ts`.** Both are required; the type map and the fixture map must have matching keys.
- **Bare constructor where a factory is needed.** `createComponentFixture(NewBlock)` compiles wrong once the class takes more than `page` — always check the constructor signature first and use `page => new X(page, ...)` if it takes extra args.
- **Shared chrome registered as a fixture but not added to `BasePage`** (or vice versa) — chrome needs both; a content block needs only the fixture.
- **Populating `EnvConfig` in every environment** instead of only the one(s) that actually have the content — this repo deliberately leaves it undefined elsewhere.
- **Forgetting to run typecheck/lint after** — the registration is pure plumbing and fails loudly (and unhelpfully) if a key or import is off. `@typescript-eslint/naming-convention` and `check-file/filename-naming-convention` (see `write-test`'s `references/this-repo.md`) will also flag a mis-cased new type/file at this point.
