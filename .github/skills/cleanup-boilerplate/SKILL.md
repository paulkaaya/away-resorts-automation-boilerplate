---
name: cleanup-boilerplate
description: Post-onboarding sweep that removes boilerplate scaffolding the client project no longer needs (unused example specs/POMs/fixtures/config keys/dependencies/docs) after onboard-client-project has run, and brings the docs back in sync with what's left. Use when the user says onboarding is done and wants the repo tidied up — "clean up the boilerplate", "remove what we're not using", "strip the unused examples", "the project's onboarded, can you tidy it up" — or as the final step of onboard-client-project once its interview/edits are confirmed.
---

# Boilerplate cleanup (post-onboarding)

`onboard-client-project` replaces placeholders and wires client-specific values, but it deliberately keeps unrelated scaffolding alone unless the user says otherwise in that interview (e.g. it only deletes the auth scaffold if the client has no auth, only trims `config/*.ts` env files the client confirmed dropping, only strips examples if asked in its "Examples & docs" question). This skill is the deferred second pass: once onboarding has actually landed, walk the repo for anything now dead — leftover example specs/POMs, unused fixtures, orphaned `EnvConfig` keys, dependencies nothing imports, stale docs — and remove or update it.

Run this only after `onboard-client-project` (or an equivalent manual onboarding) has completed and been confirmed by the user — cleaning up before the client's real shape is known just deletes scaffolding they were about to need.

## Step 1 — Confirm scope with the user

Ask (don't assume) which of these the user wants in this pass, since some are more destructive than others:

- Example specs/POMs kept only as reference scaffolding (`tests/customFixtureExample.spec.ts`, `tests/authExample.spec.ts`, `objects/pages/LoginPage.ts` if auth was declined, visual-regression baselines under `tests/visualRegression.spec.ts` if unused).
- Unused npm dependencies.
- Unused `EnvConfig` keys / `config/*.ts` values.
- Stale docs (`AGENTS.md`, `README.md`/`README.me`, `.github/copilot-instructions.md`, per-directory `readme.md` stubs).

If the user already answered "strip examples" during onboarding, don't re-ask that part — just confirm the rest.

## Step 2 — Find dead example/scaffolding code

This repo has no `knip`/`depcheck`/`ts-prune` configured (don't add one — see the "don't add new tooling" rule) so do this with grep, not a magic unused-code tool:

1. **Example specs** — list `tests/*.spec.ts` and, for each, check whether it's the client's real content or leftover boilerplate demo (`customFixtureExample.spec.ts` is always a demo; `authExample.spec.ts` only applies if auth was kept; `globalSeo.spec.ts`/`visualRegression.spec.ts`/`lighthouseAndAccessibility.spec.ts` are usually kept but may reference env keys the client dropped — check with grep in step 3).
2. **Page objects / components** — for each file in `objects/pages/` and `objects/components/`, grep for its class name across `tests/`, `testFixtures/base.ts`, and `types/types.ts`. Zero hits outside its own file (besides the fixture registration) means it's unreferenced — the boilerplate ships `LoginPage.ts` as auth scaffolding, so this is expected there if onboarding's auth question said "no auth" but the file wasn't deleted yet.
3. **Fixtures** — cross-check `types/types.ts`'s `Pages`/`Components` maps against `testFixtures/base.ts`'s registrations; every key should appear in both (see `register-pom`'s "Common mistakes" for what a mismatch looks like) and be requested by at least one spec's fixture destructuring.
4. **`EnvConfig` keys** — for each optional key in `types/envConfig.ts`, grep specs/objects for `getValue('<key>')`. A key with no reader is dead; a key read somewhere but missing from a kept `config/<env>.ts` will fail at runtime, not lint/typecheck — check both directions.
5. **Utils** — grep each export in `utils/*.ts` for external references (outside its own file and its own test, if any). This repo's utils are typically all wired into fixtures/specs already, so a genuinely-unused one usually means a prior onboarding step half-deleted something (e.g. auth removal left `utils/auth.ts` behind) rather than dead-from-day-one code.

Delete what's confirmed unused; when a class/util is only unreferenced because of an in-progress onboarding step (e.g. auth declined but `LoginPage.ts` still exists), route back to `onboard-client-project`'s deletion list for that area rather than partially removing it here — half-removing auth scaffolding leaves dangling imports.

## Step 3 — Unused dependencies

Check `package.json`'s `devDependencies` against real usage — grep each package name (or its import path) across `*.ts`/`*.yml`/config files:

```bash
for pkg in $(node -p "Object.keys(require('./package.json').devDependencies).join('\n')"); do
  echo "== $pkg =="
  grep -rl "$pkg" --include='*.ts' --include='*.yml' --include='*.json' . --exclude-dir=node_modules | grep -v package.json || echo "  (no references found)"
done
```

Treat framework/tooling packages (`@playwright/test`, `typescript`, `oxlint`, `oxfmt`, `husky`, `@types/*`) as always-needed even if the grep for their literal name comes up short (they're invoked by script/config, not `import`). Only flag a package as removable if it's genuinely feature-specific (e.g. `playwright-lighthouse`/`pixelmatch`/`pngjs`/`@axe-core/playwright` if the client dropped Lighthouse/visual-regression/accessibility testing, `@testmo/testmo-cli`/`playwright-testmo-reporter` if they're not on Testmo). Confirm with the user before removing — a false positive here breaks CI silently.

## Step 4 — Update documentation to match what's left

After deletions, the docs that describe the deleted things need to shrink too:

- **`AGENTS.md`** — project layout table, any golden rule that referenced deleted scaffolding (e.g. the auth section if auth scaffolding is now gone), the commands table if any script was removed.
- **`README.md`**/`README.me` — project-structure tree, feature list.
- **`.github/copilot-instructions.md`** — condensed mirror of AGENTS.md; drop anything it echoes that no longer applies.
- **Per-directory `readme.md` stubs** (`config/readme.md`, `objects/readme.md`, `types/readme.md`, `testFixtures/readme.md`) — these are explicitly out of scope for `onboard-client-project` but _are_ in scope here if a whole category of file they describe (e.g. an example component) is gone.
- **`.env.example`** — remove vars for dropped env keys/auth roles; this mirrors Step 2's `EnvConfig` check.
- Prefer delegating this step to the `doc-sync` skill once deletions are finalized — it already knows the full doc-surface map (`.github/prompts/*.prompt.md`, `.github/agents/*.agent.md`, `.github/skills/`) and how to reconcile it against a diff. Use it directly here rather than re-deriving that map.

## Step 5 — Verify

```bash
pnpm lint:fix
pnpm typecheck
pnpm exec playwright test --list   # confirms no spec references a deleted fixture/page object
```

Fix anything surfaced (a dangling import, a `types/types.ts` entry with no matching `testFixtures/base.ts` registration, a spec that read a dropped `EnvConfig` key). Stop and ask the user if an error isn't a straightforward fix.

## Step 6 — Summarize

Tell the user, concretely:

- What was deleted (files, `EnvConfig` keys, dependencies) and why each was confirmed unused.
- What docs were updated to match.
- Anything left in place because you weren't sure it was safe to remove — flag it rather than silently keeping it.

## Guardrails

- **Confirm before deleting** — this is the same destructive-change bar as `onboard-client-project`; don't remove example specs, POMs, or dependencies without the user's go-ahead per Step 1.
- **Don't add new tooling** (`knip`, `depcheck`, `ts-prune`, etc.) to automate the unused-code search — grep/manual cross-reference is the repo's existing convention for this.
- **Auth/env scaffolding half-removed by onboarding is a routing problem, not a fresh deletion** — send it back through `onboard-client-project`'s deletion list so every dependent file is handled together.
- **`dockerContainer` in `ci-templates/playwrightTemplate.yml` is managed by the Husky pre-commit hook** — never hand-edit or "clean up" it.
