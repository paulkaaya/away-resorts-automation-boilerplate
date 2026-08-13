import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export type A11yViolationSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export type A11yCheckOptions = {
  /**
   * Severity levels to treat as failures. When omitted, ALL violations fail the
   * check (zero-tolerance) regardless of impact — pass e.g. `['critical']` to
   * fail only on the most severe issues and surface the rest without blocking.
   */
  failOn?: A11yViolationSeverity[];
  /** axe tag set to run, e.g. `['wcag2a', 'wcag2aa']`. Defaults to axe's default ruleset. */
  tags?: string[];
  /** CSS selector to scope the scan. Defaults to full document. */
  scope?: string;
};

/**
 * Runs an axe-core accessibility scan on the current page using the
 * \@axe-core/playwright Node.js integration. This approach is CSP-safe
 * because axe is injected from the local Node.js process rather than
 * fetched from a remote CDN.
 *
 * This is the single axe entry point for the suite — the `accessibility`
 * fixture delegates to it for its strict WCAG scan, and specs can call it
 * directly with a `failOn` severity filter for a lighter-touch check.
 * @param page - Playwright page to scan
 * @param options - Optional configuration for the scan
 * @param options.failOn - Severity levels to treat as failures (`'critical' | 'serious' | 'moderate' | 'minor'`).
 *   When omitted, ALL violations fail the check. Pass e.g. `['critical', 'serious']` to only block on severe issues.
 * @param options.tags - axe tag set to run, e.g. `['wcag2a', 'wcag2aa']`. Defaults to `['wcag2a', 'wcag2aa']`.
 * @param options.scope - CSS selector to scope the scan to a subtree. Defaults to the full document.
 * @returns A promise that resolves once the scan has completed and any violations have been asserted.
 */
export async function assertNoA11yViolations(
  page: Page,
  options: A11yCheckOptions = {}
): Promise<void> {
  let builder = new AxeBuilder({ page });

  if (options.tags) {
    builder = builder.withTags(options.tags);
  } else {
    builder = builder.withTags(['wcag2a', 'wcag2aa']);
  }

  if (options.scope) {
    builder = builder.include(options.scope);
  }

  const { violations } = await builder.analyze();

  const filtered = options.failOn
    ? violations.filter(v => options.failOn!.includes((v.impact ?? '') as A11yViolationSeverity))
    : violations;

  const summary = filtered
    .map(v => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
    .join('\n');
  const scopeLabel = options.failOn ? ` (${options.failOn.join(', ')})` : '';
  expect(filtered, `Accessibility violations found${scopeLabel}:\n${summary}`).toHaveLength(0);
}

/**
 * Asserts that natively-interactive controls on the page are keyboard-reachable,
 * i.e. none have been removed from the tab order via a negative tabindex.
 *
 * Only genuine controls are considered (links with an href, buttons, and form
 * fields). Generic elements with `tabindex="-1"` — e.g. a `<main>` skip-link
 * target — are intentional programmatic focus targets, not violations, and are
 * not flagged. Hidden, disabled, and inert elements are also excluded.
 * @param page - Playwright page to scan
 * @returns A promise that resolves once the keyboard-reachability assertion has been made.
 */
export async function assertKeyboardReachable(page: Page): Promise<void> {
  // eslint-disable-next-line local/no-restricted-syntax-warn
  const unreachable = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea')
    );

    return controls
      .filter(el => {
        const style = window.getComputedStyle(el);
        const isHidden =
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          el.getAttribute('aria-hidden') === 'true' ||
          el.closest('[inert]') !== null;
        const isDisabled = (el as HTMLButtonElement).disabled === true;
        // tabIndex < 0 means the control has been pulled out of the tab order.
        return !isHidden && !isDisabled && el.tabIndex < 0;
      })
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classes: el.className || undefined,
        text: el.textContent?.trim().slice(0, 60) || undefined,
        ariaLabel: el.getAttribute('aria-label') || undefined,
        tabIndex: el.tabIndex,
      }));
  });

  expect(
    unreachable,
    `${unreachable.length} interactive control(s) are not keyboard-reachable (tabIndex < 0):\n` +
      JSON.stringify(unreachable, null, 2)
  ).toHaveLength(0);
}
