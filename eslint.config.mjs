import stylistic from '@stylistic/eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import jsdoc from 'eslint-plugin-jsdoc';
import playwright from 'eslint-plugin-playwright';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { fileURLToPath } from 'node:url';

import classPropertyOrderMatchesConstructor from './eslint-rules/classPropertyOrderMatchesConstructor.mjs';
import commentLength from './eslint-rules/commentLength.mjs';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

const pomLikeFiles = ['tests/**/*.ts', 'objects/**/*.ts', 'testFixtures/**/*.ts', 'utils/**/*.ts'];

// Shared `local` plugin rule set, referenced by the same object in every config block below so
// ESLint's flat-config plugin merging never has two different definitions for the same name.
const localRules = {
  rules: {
    'no-restricted-syntax-warn': builtinRules.get('no-restricted-syntax'),
    'no-restricted-syntax-error': builtinRules.get('no-restricted-syntax'),
    'comment-length': commentLength,
    'class-property-order-matches-constructor': classPropertyOrderMatchesConstructor,
  },
};

// Kept here purely as the shared source of truth for prettier.config.mjs; the
// prettier/prettier ESLint rule was dropped in favour of running Prettier as its own
// separate, much faster pass (`pnpm format` / `pnpm exec prettier --check .`), matching
// Prettier's own recommended setup.
export const prettierOptions = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'auto',
  proseWrap: 'never',
};

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['screenshots/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'check-file': checkFile,
      local: localRules,
    },
    rules: {
      'local/comment-length': ['warn', { maxLength: 200, maxJSDocDescriptionLength: 400 }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/testFixtures/base',
                '**/objects/pages/*',
                '**/objects/components/*',
                '**/utils/*',
                '**/types/types',
              ],
              message:
                'Use the path alias instead of a relative path: @base, @pages/*, @components/*, @utils/*, or @types.',
            },
          ],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variable',
          modifiers: ['const', 'global'],
          format: ['camelCase', 'UPPER_CASE'],
        },
        {
          // Allows factory helpers to accept a class reference (e.g. `PageClass`) as a parameter.
          selector: 'parameter',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['PascalCase'],
        },
        {
          // Object literal keys are often external contract names (cookie/HTTP names, JSON-LD keys) not under our control.
          selector: 'objectLiteralProperty',
          format: null,
        },
      ],
    },
  },
  {
    files: ['objects/**/*.ts'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.ts': 'PASCAL_CASE' },
        {
          errorMessage:
            'POM/component files must be named in PascalCase to match the class they export (e.g. `AccordionBlock.ts`) — "{{ target }}" isn\'t.',
        },
      ],
    },
  },
  {
    files: ['objects/**/*.ts'],
    plugins: { local: localRules },
    rules: {
      'local/class-property-order-matches-constructor': 'error',
    },
  },
  {
    files: ['{tests,testFixtures,utils,types,config,lib}/**/*.ts'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.ts': 'CAMEL_CASE' },
        {
          ignoreMiddleExtensions: true,
          errorMessage:
            'Files here must be named in camelCase (e.g. `environmentManager.ts`, `accordion.spec.ts`) — "{{ target }}" isn\'t.',
        },
      ],
    },
  },
  {
    files: pomLikeFiles,
    ...playwright.configs['flat/recommended'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      ...playwright.configs['flat/recommended'].plugins,
      ...jsdoc.configs['flat/recommended-typescript'].plugins,
      '@stylistic': stylistic,
      '@typescript-eslint': tseslint,
      local: localRules,
    },
    settings: {
      playwright: {
        globalAliases: {
          test: ['primaryUserTest', 'secondaryUserTest'],
        },
        messages: {
          conditionalInTest:
            'Tests should avoid using conditionals in their bodies, conditional tests can mask failures. Use `test.skip(condition, reason)` with a env flag for genuine data-dependent cases.',
          conditionalExpect:
            'Tests should avoid using conditionals in their bodies, conditional tests can mask failures. Use `test.skip(condition, reason)` with a env flag for genuine data-dependent cases.',
          useToBeComparison: 'Prefer using comparison matchers for more precise assertions. ',
          useEqualityMatcher:
            'Prefer using built in equality matchers for more precise assertions. ',
          noAssertions:
            'Tests should contain at least one assertion. If the test delegates its assertions to a POM method or a quality fixture, ensure that the method is named with an `assert*`, `check*`, or `verify*` prefix so it is recognised as asserting something.',
          unexpectedLowercase:
            'Prefer using lowercase titles for consistency and readability. e.g `test("my test")` not `test("My Test")`',
          noRawLocator:
            'Usage of raw locator detected. Inside tests, methods like .getByRole() or .getByText() should be used instead of raw locators. Raw locators should only be used in POM files.',
        },
      },
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'local/no-restricted-syntax-warn': [
        'warn',
        {
          selector: "CallExpression[callee.property.name='fixme']",
          message:
            '.fixme() tests should be fixed. Check if the test is dependent on a pending bug fix.',
        },
        {
          selector:
            "CallExpression[callee.property.name='locator'][arguments.0.type='Literal'][arguments.0.value=/^(\\/\\/|xpath=)/i]",
          message:
            'Avoid XPath locators. Prefer getByRole/getByLabel/getByText for elements, or a single, non-chained CSS selector / data-testid for sections.',
        },
        {
          selector:
            "CallExpression[callee.property.name='locator'][arguments.0.type='Literal'][arguments.0.value=/^(?!\\s*>).*>/]",
          message:
            'Avoid chained/combinator CSS selectors (e.g. `div.card > div.classA.classB`). Scope from a parent Locator instead, or use a single non-chained selector / data-testid.',
        },
        {
          selector:
            "CallExpression[callee.property.name='locator'][arguments.0.type='Literal'][arguments.0.value=/\\.[\\w-]+\\.[\\w-]+/]",
          message:
            'Avoid chained/combinator CSS selectors (e.g. `div.card > div.classA.classB`). Scope from a parent Locator instead, or use a single non-chained selector / data-testid.',
        },
        {
          selector: "CallExpression[callee.property.name='evaluate']",
          message:
            'Avoid raw `.evaluate()` — prefer a web-first Playwright assertion/matcher (toHaveAttribute, toHaveCount, toBeFocused, etc.), or `locator.getAttribute()` when a value needs comparing across locators. Reserve `.evaluate()` for the handful of POM/utils files where no Playwright API expresses the check (see per-file overrides below).',
        },
      ],
      'local/no-restricted-syntax-error': [
        'error',
        {
          selector: "CallExpression[callee.property.name='waitForLoadState']",
          message:
            'Playwright has built-in waiting for locators. Prefer using `await expect(locator).toBeVisible()`',
        },
        {
          selector: "CallExpression[callee.property.name='press'][arguments.0.value='Tab']",
          message:
            'Avoid using raw Tab presses. For cross-browser compatibility, use the `pressTab(page, locator?)` utility from @utils/keyboard instead.',
        },
        {
          selector: "MemberExpression[property.name='page'][object.type!='ThisExpression']",
          message:
            'Avoid use of `.page` from a page/component object — it is the same Page instance as the `page` fixture, so use `page` directly instead.',
        },
        {
          selector:
            "CallExpression[callee.property.name='evaluate'][callee.object.name!='page'] CallExpression[callee.name='getComputedStyle'], CallExpression[callee.property.name='evaluate'][callee.object.name!='page'] CallExpression[callee.property.name='getComputedStyle']",
          message:
            'Avoid calling getComputedStyle() directly inside locator.evaluate(). Use the getCss(locator, property) helper from @utils/css to read a single computed style value.',
        },
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: {
            selector:
              "ExpressionStatement[expression.callee.property.name=/^(goto|skip)$/], ExpressionStatement[expression.type='AwaitExpression'][expression.argument.callee.property.name=/^(goto|skip)$/]",
          },
          next: '*',
        },
      ],
      'playwright/no-skipped-test': 'off',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
      'playwright/prefer-native-locators': 'error',
      'playwright/prefer-comparison-matcher': 'error',
      'playwright/prefer-equality-matcher': 'error',
      'playwright/prefer-lowercase-title': 'error',
      'playwright/no-standalone-expect': 'warn',
      'playwright/no-commented-out-tests': 'error',
      'playwright/require-top-level-describe': 'error',
      'playwright/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expect', 'qualityGate', 'accessibility', 'lighthouse'],
          assertFunctionPatterns: [
            '^assert.*',
            '^check.*',
            '^verify.*',
            '^open$',
            '^close$',
            '^openSearch$',
          ],
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-console': 'error',

      ...jsdoc.configs['flat/recommended-typescript'].rules,
      'jsdoc/require-jsdoc': [
        'warn',
        {
          contexts: ["MethodDefinition[kind='method']"],
        },
      ],
      'jsdoc/require-description': 'warn',
      'jsdoc/require-returns': ['warn', { enableFixer: true, forceReturnsWithAsync: true }],
      'jsdoc/check-param-names': ['warn', { checkDestructured: true }],
    },
  },
  {
    // The getCss() implementation itself is the one legitimate place a locator.evaluate()
    // may call getComputedStyle() directly.
    files: ['utils/css.ts'],
    rules: {
      'local/no-restricted-syntax-error': 'off',
    },
  },

  // Disables stylistic rules that would conflict with Prettier's own formatting
  // (e.g. from @stylistic/eslint-plugin) without running Prettier as a lint rule.
  eslintConfigPrettier,
]);
