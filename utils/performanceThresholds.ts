import type { PerformanceMetrics } from './performance';

/**
 * Baseline responsiveness thresholds.
 *
 * Values represent the maximum acceptable milliseconds for each metric.
 * These are intentionally conservative to avoid flakiness in CI while still
 * catching gross regressions. Re-baseline these against your own application's
 * observed load times after the first full regression run.
 */
export const PERFORMANCE_THRESHOLDS: Partial<Record<keyof PerformanceMetrics, number>> = {
  /** Time to First Byte: 2 s */
  ttfb: 2000,
  /** DOM Content Loaded: 5 s */
  domContentLoaded: 5000,
  /** Full load event: 8 s */
  loadEventEnd: 8000,
  /** First Contentful Paint: 3 s */
  fcp: 3000,
  /** Largest Contentful Paint: 4 s */
  lcp: 4000,
};
