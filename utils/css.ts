import type { Locator } from '@playwright/test';

/**
 * Gets the resolved computed CSS value of a property for an element,
 * e.g. `getCss(locator, 'font-size')`. Accepts either kebab-case or
 * camelCase property names, matching `CSSStyleDeclaration.getPropertyValue`.
 * @param locator - The element locator to read the computed style from.
 * @param property - The CSS property name to read (kebab-case or camelCase).
 * @returns The resolved computed value of the property.
 */
export async function getCss(locator: Locator, property: string): Promise<string> {
  // eslint-disable-next-line local/no-restricted-syntax-warn
  return locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);
}
