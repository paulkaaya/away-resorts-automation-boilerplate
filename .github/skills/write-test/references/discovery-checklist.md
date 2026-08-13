# Discovery checklist

Concrete commands for step 1. This is only about locating where files go and how they're imported — the testing conventions themselves are fixed (`pom-patterns.md`, `spec-patterns.md`), not something to derive here.

This repo already has that discovery cached in `this-repo.md` — read that first and only fall back to re-running the commands below if it looks stale against the current codebase.

## 1. Find the test files and their POM counterparts

```bash
# Playwright specs are usually *.spec.ts / *.spec.js, sometimes *.test.ts
find . -type f \( -name "*.spec.ts" -o -name "*.spec.js" -o -name "*.test.ts" \) -not -path "*/node_modules/*"

# The directory holding page-object / component classes is usually named
# one of: pages, page-objects, objects, poms, models, screens
find . -type d \( -iname "pages" -o -iname "page-objects" -o -iname "objects" -o -iname "poms" -o -iname "models" -o -iname "screens" \) -not -path "*/node_modules/*"
```

Open a couple of spec files and their paired classes just to confirm: is there a base/shared page object that other page objects build on, and does it already carry shared chrome (nav, footer, banners)?

## 2. Find the fixture/support layer

```bash
grep -rl "test.extend\|test.use\|createBrowserContext\|customFixture" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
```

If found, this file is the one specs should import `test`/`expect` from instead of the raw framework package — check its exports. Specifically check whether it registers _components_ as fixtures too, not just pages (a second type registry alongside the page one, e.g. `Components` next to `Pages`, and a factory helper for building them — possibly a variant that takes a function so components needing extra constructor args can still be wired up). If even one existing content block or piece of chrome is exposed this way, treat that as the established pattern to follow for a new one, not an exception.

## 3. Find import/path-alias conventions

```bash
cat tsconfig.json 2>/dev/null | grep -A 20 '"paths"'
cat jsconfig.json 2>/dev/null | grep -A 20 '"paths"'
# Also check vite.config.*, webpack.config.*, or babel config for resolve aliases
```

If aliases exist, existing specs/POMs will already be using them (`@components/X`, `~/pages/X`, etc.) — match that, don't introduce relative `../../` imports where an alias exists, and don't invent an alias that isn't configured.

## 4. Find how to run things

```bash
cat package.json | grep -A 30 '"scripts"'
```

Look for lint, typecheck (`tsc`, `type-check`), and test-run scripts, and whether running tests requires an environment variable, `--project` flag, or config file to target a specific environment/browser. Also check for a `playwright.config.*` — its `projects` array reveals device/browser variants and any tag-based `grep`/`grepInvert` filtering, which matters if the new feature has `@desktop`/`@mobile`-tagged blocks.

## 5. Optional: check for repo-specific rules layered on top

A quick look at the ESLint config (`eslint.config.*`/`.eslintrc*`) for `eslint-plugin-playwright` and any custom `no-restricted-syntax`/`no-restricted-imports` rules can surface constraints specific to this repo beyond the fixed conventions above (an unusual banned API, an extra required naming pattern). Treat anything found here as additive, not as a reason to deviate from the fixed conventions.

## 6. Optional: cache what you found

If this repo doesn't already have a `references/this-repo.md` next to this skill and you expect to write tests here again, consider writing a short one after you finish — just the plumbing (directory layout, alias style, fixture wrapper name, run commands, a representative file or two) so the next invocation can skip straight to step 2.
