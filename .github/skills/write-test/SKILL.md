---
name: write-test
description: Write Playwright tests for a new component, block, page, or feature by building its Page Object Model (POM) class first, then its spec file, following one consistent house style — locator priority, class shape, describe-block grouping, tagging, and assertion conventions — adapted only to each repo's own file layout and import syntax. Use whenever the user asks to add or write tests for anything new in a Playwright suite — "write tests for the new hero carousel", "add a POM for the FAQ block", "test the new pricing page", "we just shipped a testimonial slider, can you cover it" — even if they never say "POM" or "spec" out loud. Also use when extending an existing component with new sub-elements or states.
---

# Playwright test writer (POM → spec)

Tests are built through a Page Object Model: locators and interaction/assertion helpers live in dedicated classes, and spec files only call into those classes — they never touch a raw locator directly. Write the POM first; the spec often _can't_ be written correctly before it exists, since a spec has nothing but the POM's methods/locators to call.

Work in this order every time:

1. **Locate** where things go in this repo — file layout and import style only (below). This is plumbing, not convention-discovery — the conventions themselves are fixed and described in steps 3–4.
2. **Classify** what you're testing (shared chrome / embedded content block / whole new page).
3. **Write the POM.**
4. **Write the spec.**
5. **Wire up registration** — a fixture for the new page or component, or a field on the shared page object for shared chrome.
6. **Verify** — using the repo's own lint/typecheck/test commands.

`references/pom-patterns.md` and `references/spec-patterns.md` are the actual rulebook for steps 3–4 — read them before writing code. `references/discovery-checklist.md` has commands for step 1. If a repo already has an established Playwright POM suite with its own different conventions for the same kind of thing (its own describe-block scheme, its own locator style), follow the existing suite for consistency within that repo rather than overriding it wholesale — but that's a "this repo is the exception" call, not the default.

## Step 1 — Locate where things go

Only figure out the mechanical stuff — where files live and how they're imported — not the testing conventions themselves:

- **Where do specs live, and where do POM/page-object classes live?** Look for existing `*.spec.ts` files and whatever directory holds their corresponding classes (commonly `pages/`, `page-objects/`, `objects/`, `poms/`, `models/`).
- **How do specs get `test`/`expect`?** Many suites wrap Playwright's `test.extend` in a custom fixture module. If one exists, import from it, not from the raw `@playwright/test` package — that's usually the only way to get pre-built page objects and helper fixtures.
- **Does the fixture wrapper already hand out components, not just pages?** Some suites extend a component-type registry alongside the page one (e.g. a `components` type next to `pages`, wired up via a factory helper analogous to whatever builds page fixtures) so every component — shared chrome and embedded content blocks alike — is requested as a fixture rather than constructed inline. This governs the default in step 2 below.
- **What's the import style?** Path aliases (`tsconfig`/`jsconfig` `paths`, bundler aliases) vs. plain relative imports — match whichever the repo uses; don't introduce one it doesn't have.
- **How do you run lint, typecheck, and the tests themselves?** Check `package.json` scripts — commands are inherently repo-specific, there's no way around discovering these.

Full checklist with example commands: `references/discovery-checklist.md`. This repo's plumbing is already cached in `references/this-repo.md` — start there instead of re-deriving it.

## Step 2 — Classify the feature

This determines where the POM lives and how the spec gets hold of it:

- **Shared chrome** — present on every page (nav, footer, cookie banner). Add it to the repo's shared/base page object the same way existing chrome is attached (a field + construction in that object's constructor), not re-instantiated per spec. If the repo's fixture wrapper also hands out components as their own fixtures (per step 1), register this one too — a spec can then reach it either via `basePage.header`-style composition or as its own fixture, whichever an existing piece of chrome already does.
- **Embedded content block** — appears on one or more specific pages, not everywhere. Default to registering it as its own fixture the same way page objects are (step 5) — a spec requests it by name (`async ({ basePage, widgetBlock }) => {...}`) instead of writing `new WidgetBlock(page)` inline. Only fall back to constructing it directly inside each test if the repo's fixture wrapper has no component-fixture mechanism at all (step 1 found none, and no existing content block uses one either) — don't introduce the mechanism single-handedly for one component if the repo has consistently done it the inline way so far. If it needs a specific page/route and the repo has an environment or fixture-data layer for page paths, add an entry there rather than hardcoding a URL in the spec.
- **Whole new page** — an entirely new page/template. If the repo uses fixtures to hand page objects to tests, register the new page wherever existing ones are registered.

If you're unsure which shape fits, ask — chrome and whole-new-page both touch shared wiring, and guessing wrong means redoing step 5.

## Step 3 — Get the real selectors before writing anything

Don't invent test-id values, ARIA roles, or class names. A guessed selector produces a POM that looks plausible and fails silently against the real DOM.

- If you have browser tooling available (Playwright MCP, a browser-automation skill, etc.), navigate to the page with this feature and inspect it directly.
- Otherwise, ask the user for the relevant markup, a screenshot, or the component's test-id/class naming.
- Note which parts repeat (a list of cards, menu items, rows) — these become a second, per-item POM class constructed from the parent.

## Step 4 — Write the POM

Full rules and examples: `references/pom-patterns.md`. The essentials:

- One class per component; a second class for repeated child items, constructed from the parent (`new ChildItem(page, this.items.nth(index))`), not re-queried from the page root each time.
- Locator priority, most to least robust: test-id attributes → accessible role/name → a single, non-chained, non-XPath selector as a last resort.
- No XPath, no chained/combinator CSS selectors (`div.a > div.b.c`) — ever.
- Assertion-only helper methods are named `assert*`, `check*`, or `verify*` so a test calling only that helper is still recognized as asserting something.
- Never reach across objects for a raw page handle (`somePageObject.page`) when the `page` fixture is already the same instance — use `page` directly.

## Step 5 — Write the spec

Full rules and examples: `references/spec-patterns.md`. The essentials:

- Import `test`/`expect` from the repo's fixture wrapper if one exists, never straight from the framework package.
- Request the component under test as a fixture (`async ({ basePage, widgetBlock }) => {...}`) if step 2 registered one, rather than instantiating the class inline — the fixture is the only source of it in that case, so a test that writes `new WidgetBlock(page)` alongside an unused `widgetBlock` fixture parameter is wrong, not just redundant.
- Group tests into `describe` blocks by concern: `navigation`, `visibility and interaction`, `accessibility` — use whichever apply, don't force all three if one makes no sense for this feature.
- Inside `visibility and interaction`, split into `device agnostic`, `desktop` (tagged `@desktop`), and `mobile` (tagged `@mobile`) wherever behavior genuinely differs by viewport (hover-only vs. tap-only interactions) — check the runner config for how these tags gate which projects a test runs under before assuming they exist/behave a particular way.
- Use soft assertions for a batch of independent visibility checks that should all be reported even if one fails; use hard assertions when a later step depends on the prior one.
- Give the feature an `accessibility` describe block that scopes a scan (axe-core is the common integration) to its root selector, not the whole page.
- Lowercase test titles. No conditionals (`if`, ternaries) controlling test flow — use `test.skip(condition, reason)` for genuine data-dependent skips. Every test contains an assertion, whether directly or via a named `assert*`/`check*`/`verify*` helper.

## Step 6 — Registration

Find where the repo already wires equivalent existing objects into its fixtures/shared setup, and do the same for the new one:

- **Shared chrome**: a field + construction call in the shared/base page object's constructor (and a fixture entry too, if other chrome is registered that way per step 1).
- **Embedded content block**, when the repo has a component-fixture mechanism: add it to the component-type registry and register a fixture using whatever factory the repo already uses for this (e.g. a `createXFixture(Class)` helper, or one that takes a constructor-args factory function if the class needs more than just `page`) — the same shape as an existing content-block fixture, not a bespoke one-off.
- **Whole new page**: register a page fixture the same way existing pages are registered.

If it's a content block needing a new page/route to test against, add that the same way existing page-path configuration is done, regardless of whether it also gets a fixture. This step is inherently repo-specific plumbing — lean on whatever step 1 found, or use the `register-pom` skill (this repo's dedicated registration skill) for the full ritual, especially if you want it handled as a separate step.

## Step 7 — Verify before calling it done

Run whatever lint, typecheck, and test commands step 1 identified, in that order, and fix everything they flag.

If a real environment is reachable, run the new spec for real rather than trusting static checks alone. If the spec has viewport-specific blocks (`@desktop`/`@mobile`), run enough of the project/browser matrix to actually exercise all of them — running only a default project can silently skip tagged-out blocks.
