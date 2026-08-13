---
name: doc-sync
description: Review the code committed since this repo's docs were last touched and bring AGENTS.md, README.md (git-tracked as README.me), .github/copilot-instructions.md, the .github/prompts/*.prompt.md files, the .github/agents/*.agent.md files, the .github/skills content (the single git-tracked source of truth for skill content in this repo), and JSDoc comments (per eslint's jsdoc rules) back in sync with what the code actually does now. Use whenever the user asks to "update the docs", "sync the docs with recent commits", "check the docs are up to date", "add missing JSDoc", mentions eslint jsdoc warnings, or has just finished a feature/fix and wants the docs caught up — even if they never name a specific file. Defaults to reviewing everything committed since AGENTS.md/README.md were last touched, but honors an explicit scope if the user gives one (a commit SHA, a range, "last N commits", or a time window like "since last week").
---

# Doc sync (post-commit documentation review)

This repo documents itself in several places that don't update themselves: `AGENTS.md` is the single source of truth for conventions, `README.md` is the human-facing tour, `.github/copilot-instructions.md` is a condensed mirror of AGENTS.md's must-follow rules, `.github/prompts/*.prompt.md` embed some of the same rituals for Copilot Chat, `.github/agents/*.agent.md` define specialised Copilot agents that load a subset of these conventions themselves, `.github/skills/` holds the actual skill content (the single git-tracked copy — any AI tool's own local skill directory should symlink to it rather than duplicate it), and eslint's `jsdoc/*` rules expect every method to carry a JSDoc block. None of this is generated — it drifts the moment code changes and nobody deliberately walks the diff back against it. That's the job here: read what actually changed, then bring every affected surface back into agreement with it.

Treat this as documentation review, not a mechanical find-replace. The point is to understand what changed and judge which docs it affects — not every commit touches every surface, and forcing an update onto a surface a change doesn't concern is worse than leaving it alone.

## Step 1 — Decide what to review

Default scope: the commits since AGENTS.md or README.md (tracked as `README.me` — this repo sits on a case-insensitive filesystem where `README.md` and `README.me` are the same file, but git only knows the lowercase name) were last touched.

```bash
anchor=$(git log -1 --format=%H -- AGENTS.md README.me)
git log --oneline "$anchor"..HEAD
git diff --stat "$anchor"..HEAD
```

If that range is empty, the docs are already caught up for everything committed so far — say so and stop (no need to force Step 4's structural check on an idle repo unless the user asked for a full audit rather than a "what's changed" review).

If the user gave an explicit scope, resolve that instead of the default:

- A commit SHA or range → use it directly (`<ref>..HEAD`).
- "last N commits" → `HEAD~N..HEAD`.
- A time window ("since last week", "since Monday") → `git rev-list -1 --before="<window>" HEAD` to find the boundary commit, then `<that-commit>..HEAD`.

Either way, end this step with a concrete commit range and the list of files it touched.

## Step 2 — Read the diff like a docs reviewer

Read the actual diff for the commits in range (`git show`/`git diff`), not just the file list — a docs-relevant change is about what a file _means_ to the rest of the repo, which the stat line alone won't tell you.

For each changed file, ask two questions:

1. **Is it new, moved, renamed, or deleted, and does that show up in README's project-structure tree or AGENTS.md's project layout table?** New files under `objects/`, `utils/`, `lib/`, `config/`, `types/`, `testFixtures/` are the common case. Update the tree/table entries to match.
2. **Does it change a convention, not just an implementation detail?** A new locator strategy, a new fixture-registration pattern, a new required tag, a new alias, a new golden-rule-worthy rule of thumb — these belong in AGENTS.md's golden rules, and in copilot-instructions.md's condensed form if they're must-follow (not every golden rule needs to be — copilot-instructions.md already picks a subset; match its existing altitude, don't dump everything into it).

`references/doc-surfaces.md` has the full map of which file covers what and the signal that means it needs a look — read it before deciding a surface is out of scope, especially for `.github/skills/`, `.github/agents/`, and the `.github/prompts/` files, which are easy to forget about.

## Step 3 — Skills live in .github/skills; edit them there

`.github/skills/` is the only git-tracked home for skill content in this repo. Some AI tools also read skills from their own local config directory — where that's the case, that tool's local entry should be a symlink into `.github/skills/<name>`, not a separate copy, so there's nothing to keep in sync by hand.

What this step actually asks of you:

- If the diff touched a testing convention that `write-test`, `code-review`, or `register-pom` describes (locator priority, POM shape, spec structure, review checklist/rubric, the fixture-registration ritual), edit the file under `.github/skills/...` — that's the one real copy, regardless of which directory you reached it from.
- If a tool's local skill entry is ever a **real directory** instead of a symlink for something that already exists under `.github/skills/<name>`, that's drift to fix: reconcile any genuine content differences into `.github/skills/<name>` first — don't assume the git-tracked copy is automatically the correct side — then replace the local copy with a symlink back to it.
- Creating a brand-new skill for this repo? Write it under `.github/skills/<name>/` first (so it's git-tracked), then set up each tool's local symlink to it afterward — never the other way around.

## Step 4 — Structural sanity check

Small mismatches accumulate across many commits, not just the one(s) in scope this run. While you're already looking at README's tree and AGENTS.md's table, spot-check them against reality (`ls objects/pages objects/components utils/ config/ types/` etc.) and fix anything stale you notice — but stay scoped to what's actually wrong; don't rewrite sections that are already accurate just because you're in the neighborhood.

## Step 5 — JSDoc pass

Lint the changed files to see what eslint's jsdoc rules (`jsdoc/require-jsdoc`, `require-description`, `require-returns`, `check-param-names`) actually flag, rather than guessing which methods need a block:

```bash
pnpm exec eslint <changed-file.ts> [<changed-file.ts> ...]
```

For each warning, write the JSDoc directly from the method's real signature — params and return type come straight from the TypeScript, so there's no ambiguity there. For the one-line description: write what the method does when that isn't already obvious from its name and signature; skip filler that just restates the method name in prose. If the _why_ behind a method is genuinely non-obvious — a business rule, a workaround for something specific — say so honestly rather than inventing a confident-sounding description; flag that one in your final summary as needing a human's judgment instead of guessing.

## Step 6 — Verify

```bash
pnpm lint
pnpm typecheck
```

Both must come back clean on the files you touched. If Step 3 had you replace a stray real directory with a symlink, confirm it resolves back to `.github/skills/<name>` and that reading either path returns the same content.

## Step 7 — Summarize

Tell the user, concretely:

- Which docs/files you updated and why (tie each one back to the commit/change that motivated it).
- Any JSDoc you added but flagged as needing a human-written description.
- Any pre-existing structural drift you fixed opportunistically in Step 4, since that wasn't caused by the commits in scope and they may want to know why a seemingly-unrelated line changed.
