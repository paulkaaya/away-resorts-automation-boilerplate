---
name: add-multi-site-support
description: Restructure this boilerplate's single-site config/fixtures into a multi-site setup — one Playwright suite testing several sites/brands, each with its own per-environment base URLs and content. Use when the user says the suite needs to cover more than one site/brand/domain, asks for a "site" dimension alongside environments, or wants the browser matrix run once per site — e.g. "we need to test both the UK and US sites", "add a second brand to this suite", "make the projects run per-site". Not applied by default — this repo ships single-site; run this skill only when a project actually needs the extra dimension.
---

# Adding multi-site support

This boilerplate assumes one site tested across several environments (`config/dev.ts`, `EnvironmentManager`). Some projects need a second dimension: the same suite exercising **several sites**, each with its own base URL and content per environment (e.g. a UK site and a US site, both with `inte`/`preprod`/`prod`). Bolting that on ad hoc (env files per site, if/else in page objects) gets unmaintainable fast. This skill describes the pattern this boilerplate's own team validated on a real multi-site project and ported back as a guide rather than default code, since most consumers of this boilerplate are single-site and shouldn't carry the extra indirection.

Read this fully before changing anything — the pieces are interdependent (config shape, fixtures, and the project matrix all change together).

## The shape

- **Site** — which property/brand/domain (e.g. `uk`, `us`). Orthogonal to **environment** (`inte`/`preprod`/`prod`), which is still selected via `ENV`.
- Every `(site, env)` pair resolves to one config object, merged from shared defaults + that site's per-env overrides — the same "defaults + `Required<...>`" merge this boilerplate already uses for env config (`config/defaults.ts`), just with an extra dimension.
- The browser × device project matrix (`config/projects.ts`) becomes browser × device × **site** — each project is named `"<Browser> - <site>"` (e.g. `"Chrome - uk"`), not just `"Chrome"`.
- Content that only exists on some sites is excluded with tags (`@missing-on-<site>`), not runtime conditionals — conditionals in test bodies are already banned by `playwright/no-conditional-in-test`.

## Step 1 — Restructure config into `config/sites/`

Replace the flat `config/<env>.ts` layout with a per-site tree:

```
config/
  sites/
    defaults.ts       # shared defaults across every site's optional EnvConfig fields
    index.ts           # site registry: SiteKey, DEFAULT_SITE, sites map
    uk/
      inte.ts
      preprod.ts
      prod.ts
    us/
      inte.ts
      preprod.ts
      prod.ts
```

`config/sites/defaults.ts` — same merge pattern as this repo's existing `config/defaults.ts`, just without `baseUrl` (every site must set its own):

```ts
import { EnvConfig } from '../../types/envConfig';

export const defaults: Required<Omit<EnvConfig, 'baseUrl'>> = {
  xmlSitemapUrl: 'sitemap.xml',
  robotsTxt: '',
  searchUrl: '',
  articleUrl: '',
  // ...every other optional EnvConfig field
};
```

`config/sites/index.ts` — the registry everything else derives from:

```ts
import type { Env } from '@utils/environmentManager';
import { EnvConfig } from '../../types/envConfig';
import { inteConfig as ukInte } from './uk/inte';
import { preprodConfig as ukPreprod } from './uk/preprod';
import { prodConfig as ukProd } from './uk/prod';
// ...same for every other site

export const sites = {
  uk: { inte: ukInte, preprod: ukPreprod, prod: ukProd },
  us: {/* ... */},
} satisfies Record<string, Record<Env, EnvConfig>>;

export type SiteKey = keyof typeof sites;
export const DEFAULT_SITE: SiteKey = 'uk';
```

Adding a site later is: one new subdirectory + one new entry in `sites` — nothing else to keep in sync.

## Step 2 — A `resolveConfig` helper + `ResolvedConfig` type

`types/envConfig.ts` gains the resolved-output type (same idea as this repo's existing `ResolvedConfig`, just documented as per-site now):

```ts
export type ResolvedConfig = Required<EnvConfig>;
```

`utils/siteConfig.ts` (new file) does the merge:

```ts
import { defaults } from '../config/sites/defaults';
import { sites, type SiteKey } from '../config/sites';
import type { ResolvedConfig } from '../types/envConfig';
import type { Env } from './environmentManager';

/**
 * Resolves the full config for a given site/environment combination, merging shared defaults
 * with the site+env-specific overrides. Every field on the result is a real string — callers
 * never need `?? ''`.
 * @param site - The site to resolve config for.
 * @param env - The environment to resolve config for.
 * @returns The merged config for this site/environment combination.
 */
export function resolveConfig(site: SiteKey, env: Env): ResolvedConfig {
  const siteEnvConfig = sites[site]?.[env];
  if (!siteEnvConfig) {
    throw new Error(`No config for site "${site}" in env "${env}"`);
  }
  return { ...defaults, ...siteEnvConfig };
}
```

## Step 3 — A `site` test option + `siteConfig` fixture

This is the one place the pattern diverges from this boilerplate's existing `envManager` fixture. `envManager` is safely **worker-scoped** because the environment never changes mid-run. `site` **does** change per-project, so the resolved config must be **test-scoped** and driven by a Playwright test _option_ (`use.site` in `config/projects.ts`), not a worker fixture:

```ts
// testFixtures/base.ts additions
type SiteOptions = {
  /** Which site this test runs against. Set per-project via `use.site` (config/projects.ts). */
  site: SiteKey;
};

type SiteConfigFixture = {
  /** The resolved config for this test's (site, env) combination. */
  siteConfig: ResolvedConfig;
};

// in test.extend<...>({ ... }):
site: [DEFAULT_SITE, { option: true }],
siteConfig: async ({ site }, use) => {
  await use(resolveConfig(site, envManager.getEnv()));
},
```

Page objects then take the resolved config instead of `envManager` directly — `createPageFixture` threads `siteConfig` the same way it already threads `envManager`:

```ts
function createPageFixture<T extends Pages[keyof Pages]>(
  PageClass: new (page: Page, config: ResolvedConfig) => T
) {
  return async ({ page, siteConfig }, use) => {
    const pageInstance = new PageClass(page, siteConfig);
    await setupPage(pageInstance);
    await use(pageInstance);
  };
}
```

`BasePage`'s constructor becomes `(page: Page, config: ResolvedConfig)`, reading `config.baseUrl` etc. directly instead of calling `envManager.getValue(...)` — there's no `EnvironmentManager` instance for a page object to hold once config is resolved per-site.

## Step 4 — The browser × site project matrix

`config/projects.ts` becomes a template × site cross-product instead of a flat list. Keep each browser's own `use`/exclusion shape as a template, then generate one project per `(template, site)` pair:

```ts
interface BrowserTemplate {
  name: string;
  use: Project['use'];
  excludeTags: string[];
}

const browserTemplates: BrowserTemplate[] = [
  { name: 'Chrome', use: { ...devices['Desktop Chrome'] }, excludeTags: ['@mobile'] },
  // ...
];

const siteKeys = Object.keys(sites) as SiteKey[];

function buildProject(template: BrowserTemplate, site: SiteKey): Project {
  const otherSites = siteKeys.filter(s => s !== site);
  const excludeTerms = [
    ...template.excludeTags,
    `@missing-on-${site}`,
    ...otherSites.map(s => `@only-on-${s}`),
  ];
  return {
    name: `${template.name} - ${site}`,
    use: { ...template.use, site, baseURL: resolveConfig(site, envManager.getEnv()).baseUrl },
    grepInvert: new RegExp(excludeTerms.filter(Boolean).join('|')),
  };
}

export const projects: Project[] = siteKeys.flatMap(site =>
  browserTemplates.map(template => buildProject(template, site))
);
```

Tag content that only exists on one site with `@missing-on-<otherSite>`, or content exclusive to one site with `@only-on-<thatSite>` — never with a runtime `if (site === 'uk')` in a test body.

## Step 5 — Scripts and CI

Package scripts and CI both need a `site` filter alongside the existing env selection:

```jsonc
// package.json
"test:uk": "playwright test --project \"* - uk\"",
"test:all-sites": "playwright test",
```

`ci-templates/playwrightTemplate.yml` (and any manual-trigger pipeline) gains a `site` parameter that maps onto the project name filter:

```yaml
- name: site
  type: string
  default: '' # blank = every site

variables:
  - name: siteFilter
    ${{ if eq(parameters.site, '') }}:
      value: '*'
    ${{ else }}:
      value: ${{ parameters.site }}

# then, wherever the pipeline currently runs `--project Chrome "Mobile Chrome"`:
pnpm exec playwright test --project "Chrome - $(siteFilter)" "Mobile Chrome - $(siteFilter)"
```

## Step 6 — Verify

```bash
pnpm typecheck
pnpm lint
pnpm exec playwright test --list   # confirm one project per (browser, site) and correct exclusions
```

Spot-check that a `@missing-on-<site>` test is absent from that site's project list, and that a plain `pnpm exec playwright test --project "Chrome - <site>"` only runs that site.

## Guardrails

- **Don't do this for a single-site project.** The extra `site` dimension, `ResolvedConfig` threading, and doubled CI parameters are pure overhead if there's only ever one site — this boilerplate's default single-site setup (`EnvironmentManager` + `envManager` fixture) is the right shape for that case.
- **`site` must be a Playwright test _option_, not a worker fixture.** It varies per-project; a worker-scoped fixture would leak the first-resolved site's config to every worker.
- **Migrate page objects together, not incrementally.** Once `BasePage` takes `(page, config)` instead of `(page, envManager)`, every subclass's constructor signature changes with it — half-migrating leaves some page objects unable to construct.
- **Tag, don't branch.** `@missing-on-<site>` / `@only-on-<site>` composed into `config/projects.ts`'s `grepInvert`, never a conditional inside a test body (`playwright/no-conditional-in-test` already forbids this).
