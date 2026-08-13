/*
Define the structure and types for environment configuration settings. These values are defined per environment in the config folder.
uses 
*/
export interface EnvConfig {
  baseUrl: string;
  xmlSitemapUrl?: string;
  robotsTxt?: string;
  searchUrl?: string;
  articleUrl?: string;

  /*
  Authentication (optional) — consumed by the auth scaffold:
  objects/pages/LoginPage.ts, tests/auth.setup.ts and utils/auth.ts.
  Credentials live here by default; the onboarding wizard can wire them to
  process.env (.env) instead — see .env.example. Drop these keys entirely if
  the project has no authenticated tests.
  */
  loginUrl?: string;
  primaryUserEmail?: string;
  primaryUserPassword?: string;
  secondaryUserEmail?: string;
  secondaryUserPassword?: string;
}

/*
What EnvironmentManager.getValue() actually returns: EnvConfig merged with config/defaults.ts,
so every field is guaranteed a real string — no `?? ''` / `|| ''` needed at the point of use.
*/
export type ResolvedConfig = Required<EnvConfig>;
