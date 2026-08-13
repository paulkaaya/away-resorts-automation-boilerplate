# POM rules

These are the fixed conventions for step 4. Only file paths, import syntax, and framework-specific APIs adapt to the target repo — the shape below doesn't.

## Class shape

```ts
export class WidgetBlock {
  readonly page: Page;
  readonly widgetSelector: string;
  readonly root: Locator;

  readonly heading: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    this.page = page;
    this.widgetSelector = '[data-testid="widget"]';
    this.root = this.page.getByTestId('widget');

    this.heading = this.root.getByRole('heading');
    this.items = this.root.getByTestId('widget-row');
  }

  getItem(index: number): WidgetItem {
    return new WidgetItem(this.page, this.items.nth(index));
  }
}

export class WidgetItem {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
  }
}
```

- Keep the raw selector string (`widgetSelector`) alongside the derived `Locator` — specs need it later to scope an accessibility scan without duplicating the selector.
- The child class takes the _already-scoped_ `Locator` from its parent (`this.items.nth(index)`), not a fresh page-level query — so `getItem(0)` and `getItem(1)` can never overlap.
- Build locators in the constructor, not as lazily-evaluated getters.

## Locator priority, most to least robust

1. Test-id attributes, if the markup provides them.
2. Accessible role + accessible name (`getByRole`, `getByLabel`).
3. A single, non-chained, non-XPath CSS/attribute selector as a last resort for a section root that has neither of the above.

Never use:

- **XPath** selectors.
- **Chained/combinator CSS** (`div.card > div.a.b`) — scope from a parent `Locator` instead (`this.root.locator('.child')`), or find a single non-chained selector.

Compose a role query with a filter for a sturdier middle ground when needed:

```ts
this.logo = this.header.getByRole('link').filter({ has: this.page.getByRole('img') });
```

## Constructor flags

Pass in behavioral context the component needs to build correct locators or branch its methods, rather than re-deriving it at runtime if the caller already knows it — e.g. an `isMobile: boolean` so the class can pick tap-vs-hover interactions, or a variant flag that changes which root element matches.

## Method families

- **Getters** — `getXByIndex(index)`, `getXByText(text)`: return a `Locator` or child object, perform no action.
- **Interaction** — `clickXByIndex(index)`, `openItem()`, `toggle()`: perform a single user action, async, resolve once it's done.
- **Assertion helpers** — encapsulate a check that's awkward to inline in a spec (a loop, a non-obvious CSS quirk, a multi-step wait). Name these `assert*`, `check*`, or `verify*` — always — so a test calling only that helper is still recognized as "containing an assertion" by lint tooling that looks for this prefix.

## Reading computed styles

If the repo has (or you're introducing) a shared helper for reading a computed CSS property (`getCss(locator, property)` is a good name), route through it instead of calling `getComputedStyle` inside a raw `.evaluate()` in multiple places — one code path for this is easier to keep correct across browsers than several ad hoc ones.

## Avoid reaching across objects for the raw page handle

If a spec already has both a `page` fixture and a page-object fixture, they're the same underlying page instance — use `page` directly rather than drilling into `somePageObject.page`.
