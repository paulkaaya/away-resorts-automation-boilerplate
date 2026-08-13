import { EnvConfig } from '../types/envConfig';

export const devConfig: EnvConfig = {
  baseUrl: 'https://your-url-here.com',
  xmlSitemapUrl: 'sitemap.xml',
  robotsTxt: 'User-Agent: *\nDisallow: /\nSitemap: https://example.com/sitemap.xml',
  searchUrl: 'search-page/',
  articleUrl: 'sample-article/',

  // Auth (placeholders — the auth scaffold stays dormant until these are real).
  // Onboarding can move the credentials to .env instead, e.g.
  //   primaryUserEmail: process.env.PRIMARY_USER_EMAIL,
  loginUrl: 'https://your-url-here.com/login',
  primaryUserEmail: 'primary.user@example.com',
  primaryUserPassword: 'change-me',
  secondaryUserEmail: 'secondary.user@example.com',
  secondaryUserPassword: 'change-me',
};
