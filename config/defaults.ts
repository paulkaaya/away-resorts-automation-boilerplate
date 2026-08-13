import { EnvConfig } from '../types/envConfig';

/*
Every optional EnvConfig field, defaulted so EnvironmentManager.getValue() always returns a real
string. The active environment's config/<env>.ts always wins on merge. New optional fields go
here too — `Required<...>` enforces it.
*/
export const defaults: Required<Omit<EnvConfig, 'baseUrl'>> = {
  xmlSitemapUrl: 'sitemap.xml',
  robotsTxt: '',
  searchUrl: '',
  articleUrl: '',
};
