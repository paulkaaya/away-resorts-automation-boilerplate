---
agent: agent
description: Guided, chat-driven tour of this Playwright framework — explains the conventions, configuration, fixtures, auth, hooks, CI, and the GitHub Copilot setup (instructions, prompt files, MCP) at whatever depth you want.
---

Give me a guided tour of this repository. I'm here to **understand** it, not change it — this is a read-only, explanatory session. Treat me as a new engineer (or a returning one) trying to get oriented.

**Before you say anything**, read the sources of truth so your explanation matches the actual code, not assumptions:

- `/AGENTS.md` — the shared project conventions (the source of truth for all conventions on this repo).
- `package.json` — scripts, package manager, dependencies.
- `playwright.config.ts`, `config/projects.ts`, and `config/*.ts` — runtime config, the browser matrix, and per-environment values.
- `testFixtures/base.ts`, `objects/pages/BasePage.ts`, `types/types.ts`, `types/envConfig.ts`, `utils/environmentManager.ts` — the fixture entry point, base page, type registry, and env plumbing.
- `.husky/pre-commit` — the git hook (lint/format gate + Playwright Docker image sync).
- `.github/copilot-instructions.md`, the `/new-page-object` and `/onboard-client-project` prompt files in this folder, and `.vscode/mcp.json` — the GitHub Copilot wiring.

Skim, don't recite — pull the specifics (real file names, real cookie names, real script names) into your explanation so nothing is hand-wavy.

## How to run the session

Open with a **two-or-three sentence orientation** (what this repo is: a TypeScript Playwright E2E framework using the Page Object Model, pnpm-managed, CMS-driven site) and then **show me a menu** of topics and ask which I want to start with. Let me pick one, go deep, then offer to continue, jump elsewhere, or hear the whole thing top-to-bottom. Keep it conversational — one topic at a time, check in between sections, invite questions. Don't dump everything at once unless I ask for the full walkthrough.

The menu (adapt to what actually exists in the repo — drop anything that's been removed, add anything new you find):

1. **Big picture** — what the framework is for, the Page Object Model approach, the project layout (the table in `AGENTS.md`), and how a test flows from spec → fixture → page object → base page.
2. **Conventions / golden rules** — import `test`/`expect` via the `@base` path alias (resolves to `testFixtures/base.ts`; never `@playwright/test`); locator priority (`getByTestId` first, and why — CMS-driven site); page objects over raw selectors; lint/format + typecheck before done. Quote the real rules from `AGENTS.md`.
3. **Configuration & environments** — `ENV` selection, `EnvironmentManager.getValue()`, the `EnvConfig` interface, the per-env `config/*.ts` files, and the `config/projects.ts` browser/device matrix.
4. **Fixtures** — the custom fixtures in `testFixtures/base.ts`: `qualityGate`, `accessibility`, `lighthouse`, the always-on auto-fixtures (`blockAnalytics`, `cookieConsent`) and their opt-outs, and the `createPageFixture` factory. Explain the 4-step ritual for adding a page object.
5. **Authentication** — the once-per-role login + `storageState` replay model: `LoginPage.ts` template, the `auth.setup.ts` setup project, the role fixtures (`primaryUserTest`/`secondaryUserTest`), and the `isAuthConfigured()` gate that keeps it dormant until configured.
6. **Test conventions** — tags (`@smoke`, `@visual`, `@quality-gate`, `@desktop`/`@mobile`, `@authenticated`, …), the `grepInvert` pattern in `config/projects.ts` that replaces manual per-test skips, `--grep`/`--grepInvert`, test independence, `test.skip`/`test.fixme`, avoiding fixed timeouts.
7. **Commands** — the `pnpm` scripts (`first:install`, `test`, `test:qa`, `lint`, `lint:fix`, `typecheck`, `format`, UI mode) and when to reach for each.
8. **Git hooks (Husky)** — `pre-commit` runs `pnpm lint` (blocks on violations) and keeps the CI Docker image in sync with `@playwright/test`. Husky installs via the `prepare` script on `pnpm install` (or via `pnpm first:install` on a fresh clone, which also runs `pnpm install` and installs Playwright browsers).
9. **GitHub Copilot setup** — what's wired for Copilot and when each fires:
   - **Custom instructions** (`.github/copilot-instructions.md`) — repo-wide guidance Copilot loads automatically; note it points at `AGENTS.md` as the source of truth for conventions.
   - **Prompt files** in this folder (`/new-page-object`, `/onboard-client-project`, and this one) — reusable `.prompt.md` tasks you invoke in Copilot Chat, and what each does.
   - **MCP servers** (`.vscode/mcp.json`) — the Playwright MCP (drive a real browser to find stable locators) and the Azure DevOps MCP (repo/pipeline/test-plan ops).
10. **CI/CD** — Azure DevOps pipelines (`.azure-pipelines/` + `ci-templates/`), sharding, Testmo reporting and its secrets, and the rule about keeping the Docker container version in sync with `@playwright/test`.

## Guardrails

- **Read-only.** Don't edit, scaffold, or run anything. If I ask "how do I add X", explain the steps and point at the relevant prompt file — don't do it. If I want to actually make a change, suggest the right prompt (e.g. `/new-page-object`) or that we start a separate working session.
- **Ground every claim in a file.** Cite paths (`file_path:line` is clickable) so I can go read the source myself. If the docs and the code disagree, trust the code and flag the drift (e.g. `AGENTS.md` notes the README's `types/pages.ts` is really `types/types.ts`).
- **Don't invent.** If something I ask about isn't in the repo, say so rather than guessing.
- **Match my level.** If I say "I already know Playwright, just the project-specific bits", skip the basics. If I'm new, explain the Page Object Model and fixtures more gently.
- Wrap up by pointing me at the canonical docs to keep reading: `AGENTS.md` (conventions), `.github/copilot-instructions.md` (Copilot guidance), and `README.me`.
