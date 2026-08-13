import { type Page } from '@playwright/test';

export type PerformanceMetrics = {
  /** Time to First Byte (ms) */
  ttfb: number;
  /** DOM Content Loaded (ms) */
  domContentLoaded: number;
  /** Load event end (ms) */
  loadEventEnd: number;
  /** First Contentful Paint (ms), if available */
  fcp: number | null;
  /** Largest Contentful Paint (ms), if available */
  lcp: number | null;
};

/**
 * Collects Web Vitals and Navigation Timing metrics from the current page.
 * Must be called after navigation has completed (e.g. `page.goto(url, { waitUntil: 'load' })`).
 *
 * Complements the Lighthouse fixture: Lighthouse gives an audited score in a
 * controlled run, while this reads the real Navigation Timing / paint entries
 * from the live page so per-page load budgets can be asserted cheaply across
 * every project/viewport.
 * @param page - The Playwright page to collect metrics from.
 * @returns The collected performance metrics.
 */
export async function collectPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  // eslint-disable-next-line local/no-restricted-syntax-warn
  return page.evaluate((): Promise<PerformanceMetrics> => {
    return new Promise(resolve => {
      const nav = performance.getEntriesByType('navigation')[0] as
        PerformanceNavigationTiming | undefined;

      const ttfb = nav ? nav.responseStart - nav.requestStart : 0;
      const domContentLoaded = nav ? nav.domContentLoadedEventEnd - nav.startTime : 0;
      const loadEventEnd = nav ? nav.loadEventEnd - nav.startTime : 0;

      let fcp: number | null = null;
      let lcp: number | null = null;

      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        fcp = fcpEntry.startTime;
      }

      // LCP requires PerformanceObserver — attempt to get buffered entry
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          lcp = lcpEntries[lcpEntries.length - 1].startTime;
        }
      } catch {
        // LCP not available in this context
      }

      resolve({ ttfb, domContentLoaded, loadEventEnd, fcp, lcp });
    });
  });
}

/**
 * Asserts that collected performance metrics satisfy the given thresholds.
 * Missing metrics (null) are skipped.
 * @param metrics - The collected performance metrics to check.
 * @param thresholds - Maximum allowed values per metric; metrics not present are skipped.
 */
export function assertMetricsWithinThresholds(
  metrics: PerformanceMetrics,
  thresholds: Partial<Record<keyof PerformanceMetrics, number>>
): void {
  for (const [key, threshold] of Object.entries(thresholds) as [
    keyof PerformanceMetrics,
    number,
  ][]) {
    const value = metrics[key];
    if (value === null || value === undefined) {
      continue;
    }
    if (value > threshold) {
      throw new Error(
        `Performance threshold exceeded for '${key}': ${value.toFixed(1)}ms > ${threshold}ms`
      );
    }
  }
}
