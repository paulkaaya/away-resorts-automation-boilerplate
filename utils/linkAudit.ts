import type { APIRequestContext } from '@playwright/test';

const excludedPaths =
  /\/(?:account|book|booking|checkout|payment|logout|signout|unsubscribe)(?:\/|$)/i;

/**
 * Resolves and deduplicates same-origin, read-only HTTP destinations without fragments.
 * @param hrefs - Raw href attributes from the rendered content.
 * @param sourceUrl - Source page used to resolve relative links and restrict the origin.
 * @returns Eligible URLs; external, action, empty and fragment-only links are excluded.
 */
export function collectInternalLinks(hrefs: string[], sourceUrl: string): string[] {
  const origin = new URL(sourceUrl).origin;
  const urls = new Set<string>();
  for (const rawHref of hrefs) {
    const href = rawHref.trim();
    if (!href || href.startsWith('#')) continue;
    try {
      const url = new URL(href, sourceUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) continue;
      if (url.username || url.password || excludedPaths.test(url.pathname)) continue;
      url.hash = '';
      urls.add(url.href);
    } catch {
      // Malformed HTTP links must not disappear silently from the audit.
      throw new Error(`Invalid link on ${sourceUrl}: ${href}`);
    }
  }
  return [...urls];
}

/**
 * Checks one-hop destinations in batches of three, reporting every failure rather than stopping early.
 * Redirects are followed manually so external or action destinations are never requested.
 * @param request - Playwright request context sharing the test's environment settings.
 * @param urls - Eligible absolute URLs from collectInternalLinks.
 * @param sourceUrl - Source page for failure diagnostics and redirect-origin enforcement.
 * @returns Failure messages including the source, original link and final destination or error.
 */
export async function auditLinks(
  request: APIRequestContext,
  urls: string[],
  sourceUrl: string
): Promise<string[]> {
  const failures: string[] = [];
  for (let offset = 0; offset < urls.length; offset += 3) {
    await Promise.all(
      urls.slice(offset, offset + 3).map(async href => {
        let destination = href;
        try {
          for (let redirects = 0; redirects <= 5; redirects++) {
            const response = await request.get(destination, {
              maxRedirects: 0,
              timeout: 10_000,
              failOnStatusCode: false,
            });
            const status = response.status();
            const location = response.headers().location;
            await response.dispose();
            if ([301, 302, 303, 307, 308].includes(status) && location) {
              if (redirects === 5) throw new Error('Redirect limit exceeded');
              const next = new URL(location, destination).href;
              if (collectInternalLinks([next], sourceUrl).length !== 1) {
                throw new Error(`Redirect to excluded destination: ${next}`);
              }
              destination = next;
              continue;
            }
            if (status < 200 || status >= 300) {
              throw new Error(`HTTP ${status} at ${destination}`);
            }
            return;
          }
        } catch (error) {
          failures.push(`${sourceUrl} -> ${href} (last URL: ${destination}): ${String(error)}`);
        }
      })
    );
  }
  return failures.sort();
}
